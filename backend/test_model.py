import tensorflow as tf
from tensorflow.keras.models import load_model

print("Loading model...")
try:
    model = load_model('waste_classifier.keras')
    print("✅ Model loaded successfully!")
    print(f"Model input shape: {model.input_shape}")
    print(f"Model output shape: {model.output_shape}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
