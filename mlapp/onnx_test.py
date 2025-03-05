import onnx

model_path = "yolo11n.onnx"  # Change this to your actual ONNX file
try:
    model = onnx.load(model_path)
    onnx.checker.check_model(model)
    print("ONNX model is valid!")
except Exception as e:
    print(f"ONNX model is invalid: {e}")
