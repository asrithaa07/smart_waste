#!/usr/bin/env python3
"""
Test the API endpoint with a plastic image
"""
import requests
import sys

# Test image path
test_image_path = r"C:\Users\Thimmampalli Asritha\Desktop\Smart Waste\dataset\plastic\plastic10.jpg"
api_url = "http://localhost:5000/classify"

try:
    with open(test_image_path, 'rb') as img:
        files = {'image': img}
        print(f"Testing API with: {test_image_path}")
        response = requests.post(api_url, files=files)
        response.raise_for_status()
        result = response.json()
        print(f"\n✓ API Response:")
        print(f"  Class: {result['classification']['class']}")
        print(f"  Confidence: {result['classification']['confidence']:.2f}%")
        print(f"  All predictions: {result['classification']['predictions']}")
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
