import ultralytics
import os
import numpy as np

model = ultralytics.YOLO("/home/spoomn/runs/detect/train/weights/best.pt")
input_image = "/home/spoomn/school/spr25/PARK/utahtech/bank2.png"

base_name_with_extension = os.path.basename(input_image)
base_name_without_extension = os.path.splitext(base_name_with_extension)[0]
print(base_name_without_extension)

results = model(input_image)
results[0].show()

detected_objects = results[0]
class_indices = detected_objects.boxes.cls
unique_classes = np.unique(class_indices.cpu().numpy())
print("Unique class indices detected:", unique_classes)

print("Class index to name mapping:")
for idx in unique_classes:
    print(f"{int(idx)}: {model.names[int(idx)]}")

CAR_INDEX = {3,4,5,8,9} 

num_cars = sum(1 for obj in detected_objects.boxes.cls if int(obj) in CAR_INDEX)
print(f"Number of cars detected: {num_cars}")

os.makedirs("output", exist_ok=True)
results[0].save(f"output/{base_name_without_extension}_detect_11x.jpg")
