import onnx
import onnxruntime as ort
import numpy as np
from PIL import Image, ImageDraw

onnx_model = onnx.load("yolo11n.onnx")
onnx.checker.check_model(onnx_model)

ort_sess = ort.InferenceSession("yolo11n.onnx")

IMAGE_WIDTH_AND_HEIGHT = 640

# load image
image_path = "parking_lot.JPEG"
image = Image.open(image_path)

# store original image size
orig_width, orig_height = image.size
print(f"Original Image Size: {image.size}")

# resize image
image = image.resize((IMAGE_WIDTH_AND_HEIGHT, IMAGE_WIDTH_AND_HEIGHT))
print(f"Image Size: {image.size}") 

# convert to numpy array
image_data = np.array(image).astype(np.float32) # Convert to numpy array
image_data /= 255.0 # Normalize pixel values
print(f"Image Data Shape: {image_data.shape}")
image_data = np.expand_dims(image_data, axis=0) # Add batch dimension
print(f"Image Data Shape: {image_data.shape}")
image_data = np.transpose(image_data, (0, 3, 1, 2)) # NHWC -> NCHW
print(f"Image Data Shape: {image_data.shape}")

# run inference
input_name = ort_sess.get_inputs()[0].name
print(f"Input Name: {input_name}")
input_data = {input_name: image_data}
print(f"Input Data Shape: {image_data.shape}")
outputs = ort_sess.run(None, input_data)
print(f"Output Shape: {outputs[0].shape}")
output_array = np.squeeze(outputs[0])
print(f"Output Array Shape: {output_array.shape}")

# save output array
np.save("output_array.npy", output_array)

