import os
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np

# Get the class indices from flow_from_directory to see actual mapping
dataset_path = r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset"

datagen = ImageDataGenerator(rescale=1./255)
test_data = datagen.flow_from_directory(
    dataset_path,
    target_size=(224, 224),
    batch_size=1,
    class_mode='categorical',
    shuffle=False
)

print("Class mapping from flow_from_directory:")
print(test_data.class_indices)

# Load model and test with samples
model = tf.keras.models.load_model('waste_classifier.keras')

# Test with different images
test_images = [
    (r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\metal\metal1.jpg", "metal"),
    (r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\organic\orga.jpg", "organic"),
    (r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\plastic\plastic1.jpg", "plastic")
]

for img_path, label in test_images:
    if os.path.exists(img_path):
        try:
            img = image.load_img(img_path, target_size=(224, 224))
            img_array = image.img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = img_array / 255.0

            prediction = model.predict(img_array, verbose=0)
            predicted_class_idx = np.argmax(prediction)

            print(f"\n{label} image: {img_path}")
            print(f"Predictions: {prediction[0]}")
            print(f"Predicted index: {predicted_class_idx}")
        except Exception as e:
            print(f"Error with {label}: {e}")
    else:
        print(f"\nImage not found: {img_path}")
