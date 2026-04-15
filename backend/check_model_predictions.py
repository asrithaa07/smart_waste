import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image

model = tf.keras.models.load_model('waste_classifier.keras')
class_labels = ['metal', 'organic', 'plastic']
base = r'C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset'
for cls in ['metal', 'organic', 'plastic']:
    d = os.path.join(base, cls)
    files = [f for f in os.listdir(
        d) if f.lower().endswith(('.jpg', '.png'))][:3]
    print('CLASS', cls, files)
    for f in files:
        img = image.load_img(os.path.join(d, f), target_size=(224, 224))
        arr = image.img_to_array(img) / 255.0
        pred = model.predict(np.expand_dims(arr, 0), verbose=0)[0]
        print(f, class_labels[int(np.argmax(pred))], pred)
