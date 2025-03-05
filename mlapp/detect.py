import Ultralytics

TRAINING = "train20"
model = Ultralytics.YOLO(f"Vehicle-Detection/runs/detect/{TRAINING}/weights/best.pt")

