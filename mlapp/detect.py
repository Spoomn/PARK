import ultralytics
import os

model = ultralytics.YOLO("yolo11n.pt")

results = model("alt_lot.JPG")
results[0].show()
detected_objects = results[0]
CAR_INDEX = 0

num_cars = sum(1 for obj in detected_objects.boxes.cls if obj == CAR_INDEX)
print(f"Number of cars detected: {num_cars}")
os.makedirs("output", exist_ok=True)

results[0].save(f"output/alt_lot1.jpg")