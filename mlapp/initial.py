import ultralytics
ultralytics.checks()
from ultralytics import YOLO
model = YOLO("yolo11n.pt")
model.export(format="onnx", dynamic=True)