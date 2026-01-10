import requests
from PIL import Image
import io
import numpy as np

# Create dummy image (Green 224x224)
img = Image.fromarray(np.uint8(np.random.rand(224,224,3) * 255))
byte_io = io.BytesIO()
img.save(byte_io, 'JPEG')
byte_io.seek(0)

url = 'http://localhost:8000/api/predict/'
files = {'image': ('test.jpg', byte_io, 'image/jpeg')}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(response.json())
except Exception as e:
    print(f"Request failed: {e}")
