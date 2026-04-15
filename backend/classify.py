import os
import sys
import json
import base64
import io
from pathlib import Path
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from PIL import Image

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Prefer the backend retrained model by default, with override support.
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
model_override = os.getenv("MODEL_PATH")
MODEL_CANDIDATES = [
    Path(model_override) if model_override else None,
    BASE_DIR / "waste_classifier.keras",
    BASE_DIR / "waste_classifier.h5",
    PROJECT_ROOT / "notebook" / "waste_classifier.keras",
    PROJECT_ROOT / "notebook" / "waste_classifier.h5",
]

MODEL_PATH = next((str(candidate) for candidate in MODEL_CANDIDATES if candidate and candidate.exists()), None)
MODEL_SOURCE = "notebook" if MODEL_PATH and "notebook" in MODEL_PATH.lower() else "backend"

try:
    if not MODEL_PATH:
        raise FileNotFoundError(
            "No trained model found. Expected one of: "
            + ", ".join(str(path) for path in MODEL_CANDIDATES)
        )
    model = tf.keras.models.load_model(MODEL_PATH)
except Exception as e:
    print(f"Error loading model: {e}", file=sys.stderr)
    sys.exit(1)

# Default labels and optional labels file produced by retraining script.
class_labels = ['metal', 'organic', 'plastic']
labels_path = Path(MODEL_PATH).with_name("class_labels.json")
if labels_path.exists():
    try:
        with open(labels_path, "r", encoding="utf-8") as f:
            loaded_labels = json.load(f)
            if isinstance(loaded_labels, list) and all(isinstance(i, str) for i in loaded_labels):
                class_labels = loaded_labels
    except Exception:
        pass


def classify_waste_image(image_data):
    """
    Classify waste from image data (base64 or file path)
    Returns: {'class': 'organic', 'confidence': 0.95}
    """
    try:
        # If image_data is base64, decode it
        if image_data.startswith('data:image'):
            # Remove the data URL prefix
            image_data = image_data.split(',')[1]
            image_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(image_bytes))
        else:
            # Assume it's a file path
            img = image.load_img(image_data, target_size=(224, 224))

        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        # Use preprocessing that matches the training pipeline of the loaded model.
        if MODEL_SOURCE == "backend":
            # Use light test-time augmentation for better robustness on hard metal samples.
            prepared_input = preprocess_input(np.copy(img_array))
            flipped_input = preprocess_input(np.flip(np.copy(img_array), axis=2))
            pred_main = model.predict(prepared_input, verbose=0)[0]
            pred_flip = model.predict(flipped_input, verbose=0)[0]
            chosen_pred = (pred_main + pred_flip) / 2.0
            preprocessing_used = "mobilenet_v2_tta"
        else:
            prepared_input = img_array / 255.0
            chosen_pred = model.predict(prepared_input, verbose=0)[0]
            preprocessing_used = "rescale_255"
        class_index = int(np.argmax(chosen_pred))
        confidence = float(chosen_pred[class_index])

        # Guard against borderline metal-vs-organic confusion.
        if (
            class_labels[class_index] == "organic"
            and "metal" in class_labels
            and "organic" in class_labels
        ):
            metal_idx = class_labels.index("metal")
            organic_idx = class_labels.index("organic")
            organic_score = float(chosen_pred[organic_idx])
            metal_score = float(chosen_pred[metal_idx])
            # If organic-vs-metal is close or organic confidence is weak, prefer metal.
            if (organic_score - metal_score) < 0.25 or (organic_score < 0.70 and metal_score > 0.20):
                class_index = metal_idx
                confidence = metal_score

        return {
            'class': class_labels[class_index],
            'confidence': confidence,
            'model_source': MODEL_SOURCE,
            'model_path': MODEL_PATH,
            'preprocessing': preprocessing_used,
            'all_predictions': {
                class_labels[i]: float(chosen_pred[i]) for i in range(len(class_labels))
            }
        }
    except Exception as e:
        return {'error': str(e)}


if __name__ == "__main__":
    # If run directly, expect image path as argument
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        result = classify_waste_image(image_path)
        print(json.dumps(result))
    else:
        print(json.dumps({'error': 'No image path provided'}))
