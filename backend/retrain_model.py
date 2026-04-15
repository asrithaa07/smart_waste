import numpy as np
from tensorflow.keras.preprocessing import image
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras import layers, models
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

print("Training improved waste classification model...")

dataset_path = r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset"
img_size = (224, 224)
batch_size = 32

# Enhanced data augmentation for better generalization
datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    zoom_range=0.2,
    validation_split=0.2
)

train_data = datagen.flow_from_directory(
    dataset_path,
    target_size=img_size,
    batch_size=batch_size,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

val_data = datagen.flow_from_directory(
    dataset_path,
    target_size=img_size,
    batch_size=batch_size,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

print(f"Training samples: {train_data.samples}")
print(f"Validation samples: {val_data.samples}")
print(f"Classes: {train_data.class_indices}")

# Improved model architecture
model = models.Sequential([
    layers.Conv2D(64, (3, 3), activation='relu', input_shape=(224, 224, 3)),
    layers.BatchNormalization(),
    layers.MaxPooling2D(2, 2),

    layers.Conv2D(128, (3, 3), activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling2D(2, 2),

    layers.Conv2D(256, (3, 3), activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling2D(2, 2),

    layers.Conv2D(256, (3, 3), activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling2D(2, 2),

    layers.Flatten(),
    layers.Dense(512, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(3, activation='softmax')
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("\nTraining model (30 epochs)...")
history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=30,
    verbose=1
)

print("\nSaving improved model...")
model.save("waste_classifier.keras")
print("✓ Model saved successfully!")

# Test predictions
print("\nTesting model on sample images:")

test_images = [
    (r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\metal\metal1.jpg", "metal"),
    (r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\organic\orga.jpg", "organic"),
    (r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\plastic\plastic1.jpg", "plastic")
]

class_labels = ['metal', 'organic', 'plastic']

for img_path, expected in test_images:
    if os.path.exists(img_path):
        img = image.load_img(img_path, target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0

        pred = model.predict(img_array, verbose=0)
        pred_idx = np.argmax(pred)
        pred_label = class_labels[pred_idx]

        status = "✓" if pred_label == expected else "✗"
        print(
            f"{status} {expected}: predicted {pred_label} ({pred[0][pred_idx]:.2%})")
