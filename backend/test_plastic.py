import os
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np

print("Testing plastic classification accuracy...\n")

# Load model
model = tf.keras.models.load_model('waste_classifier.keras')
class_labels = ['metal', 'organic', 'plastic']

# Get first 10 plastic images
plastic_dir = r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\plastic"
plastic_files = [f for f in os.listdir(
    plastic_dir) if f.lower().endswith(('.jpg', '.png'))][:10]

correct = 0
wrong = 0

for filename in plastic_files:
    img_path = os.path.join(plastic_dir, filename)
    try:
        img = image.load_img(img_path, target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0

        prediction = model.predict(img_array, verbose=0)
        pred_idx = np.argmax(prediction)
        pred_label = class_labels[pred_idx]
        confidence = prediction[0][pred_idx]

        is_correct = "✓" if pred_label == "plastic" else "✗"
        if pred_label == "plastic":
            correct += 1
        else:
            wrong += 1

        print(f"{is_correct} {filename}: predicted {pred_label} ({confidence:.1%})")
        print(
            f"   [metal: {prediction[0][0]:.2%}, organic: {prediction[0][1]:.2%}, plastic: {prediction[0][2]:.2%}]")
    except Exception as e:
        print(f"Error: {e}")

print(
    f"\nPlastic accuracy on sample: {correct}/{len(plastic_files)} ({correct*100/len(plastic_files):.0f}%)")
