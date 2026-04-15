import os
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np

# Try loading the .h5 model instead
try:
    model = tf.keras.models.load_model(
        r'C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\notebook\waste_classifier.h5')
    print("✓ Loaded .h5 model")
except Exception as e:
    print(f"✗ Failed to load .h5: {e}")
    exit(1)

# Test with different images
test_images = [
    (r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\metal\metal1.jpg", "metal"),
    (r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\organic\orga.jpg", "organic"),
    (r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\plastic\plastic1.jpg", "plastic")
]

class_labels = ['metal', 'organic', 'plastic']

for img_path, expected_label in test_images:
    if os.path.exists(img_path):
        try:
            img = image.load_img(img_path, target_size=(224, 224))
            img_array = image.img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = img_array / 255.0

            prediction = model.predict(img_array, verbose=0)
            predicted_class_idx = np.argmax(prediction)
            predicted_label = class_labels[predicted_class_idx]
            confidence = prediction[0][predicted_class_idx]

            status = "✓" if predicted_label == expected_label else "✗"
            print(
                f"{status} {expected_label.upper()}: Predicted {predicted_label} ({confidence:.2%})")
            print(f"   Raw: {prediction[0]}")
        except Exception as e:
            print(f"Error with {expected_label}: {e}")
    else:
        print(f"Image not found: {img_path}")
