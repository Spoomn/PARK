from ultralytics import YOLO

# Load a model
model = YOLO("yolo11n.pt") 

# Train the model
results = model.train(data="VisDrone.yaml", epochs=20, imgsz=640)