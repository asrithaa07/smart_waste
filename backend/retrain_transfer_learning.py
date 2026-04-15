import json
import os
from pathlib import Path
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras import layers, models, regularizers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

print("=" * 60)
print("Training with Transfer Learning (MobileNetV2)")
print("=" * 60)

tf.keras.utils.set_random_seed(42)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
dataset_path = str(PROJECT_ROOT / "dataset")
img_size = (224, 224)
batch_size = 32
validation_split = 0.2
seed = 42

# Data augmentation only for training; validation must stay clean.
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    zoom_range=0.2,
    brightness_range=[0.85, 1.15],
    validation_split=validation_split
)
val_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    validation_split=validation_split
)

train_data = train_datagen.flow_from_directory(
    dataset_path,
    target_size=img_size,
    batch_size=batch_size,
    class_mode='categorical',
    subset='training',
    shuffle=True,
    seed=seed
)

val_data = val_datagen.flow_from_directory(
    dataset_path,
    target_size=img_size,
    batch_size=batch_size,
    class_mode='categorical',
    subset='validation',
    shuffle=False,
    seed=seed
)

print(f"\nTraining samples: {train_data.samples}")
print(f"Validation samples: {val_data.samples}")
print(f"Classes: {train_data.class_indices}")

class_counts = np.bincount(train_data.classes)
num_classes = len(train_data.class_indices)
total_samples = np.sum(class_counts)
class_weight = {
    class_idx: float(total_samples / (num_classes * max(count, 1)))
    for class_idx, count in enumerate(class_counts)
}
print(f"Class weights: {class_weight}")

# Transfer learning model
print("\nLoading MobileNetV2 base model...")
base_model = MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)

# Freeze base model weights
base_model.trainable = False

# Build custom top layers
model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dense(256, activation='relu',
                 kernel_regularizer=regularizers.l2(1e-4)),
    layers.Dropout(0.4),
    layers.Dense(128, activation='relu',
                 kernel_regularizer=regularizers.l2(1e-4)),
    layers.Dropout(0.3),
    layers.Dense(3, activation='softmax')
])

# Compile
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.05),
    metrics=['accuracy']
)

best_model_path = Path(__file__).resolve().parent / "waste_classifier.keras"
callbacks = [
    EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6),
    ModelCheckpoint(str(best_model_path), monitor='val_loss', save_best_only=True)
]

print("\nTraining model (up to 25 epochs)...")
history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=25,
    class_weight=class_weight,
    callbacks=callbacks,
    verbose=1
)

print("\n" + "=" * 60)
print("Fine-tuning: Unfreezing last layers of base model...")
print("=" * 60)

# Unfreeze last 50 layers of base model
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

# Recompile with lower learning rate
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.05),
    metrics=['accuracy']
)

print("\nFine-tuning (up to 12 more epochs)...")
model.fit(
    train_data,
    validation_data=val_data,
    epochs=12,
    class_weight=class_weight,
    callbacks=callbacks,
    verbose=1
)

print("\n" + "=" * 60)
print("Saving improved model...")
print("=" * 60)
model.save(str(best_model_path))
print(f"✓ Model saved to: {best_model_path}")

# Save class labels to keep inference mapping aligned.
class_labels = [name for name, _ in sorted(
    train_data.class_indices.items(), key=lambda item: item[1])]
labels_path = Path(__file__).resolve().parent / "class_labels.json"
with open(labels_path, "w", encoding="utf-8") as f:
    json.dump(class_labels, f, indent=2)
print(f"✓ Labels saved to: {labels_path}")

# Test predictions
print("\nTesting model on sample images:")

test_images = [
    (r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\metal\metal1.jpg", "metal"),
    (r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\organic\orga.jpg", "organic"),
    (r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\plastic\plastic1.jpg", "plastic"),
    (r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\plastic\plastic100.jpg", "plastic"),
]

correct = 0

for img_path, expected in test_images:
    if os.path.exists(img_path):
        img = image.load_img(img_path, target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)

        pred = model.predict(img_array, verbose=0)
        pred_idx = np.argmax(pred)
        pred_label = class_labels[pred_idx]

        is_correct = pred_label == expected
        status = "✓" if is_correct else "✗"
        if is_correct:
            correct += 1

        print(
            f"{status} {expected}: predicted {pred_label} ({pred[0][pred_idx]:.1%})")

print(f"\nTest accuracy: {correct}/4 ({correct*100/4:.0f}%)")
print("\n" + "=" * 60)
