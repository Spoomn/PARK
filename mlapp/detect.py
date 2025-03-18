import ultralytics
import os

model = ultralytics.YOLO("yolo11n.pt")
input_image = "aerial-view-of-car-parking-top-v.jpg"
# extract the name of the image


base_name_with_extension = os.path.basename(input_image)
base_name_without_extension = os.path.splitext(base_name_with_extension)[0]
print(base_name_without_extension)

results = model(input_image) # Input image
results[0].show()
detected_objects = results[0]
CAR_INDEX = 0

num_cars = sum(1 for obj in detected_objects.boxes.cls if obj == CAR_INDEX)
print(f"Number of cars detected: {num_cars}")
os.makedirs("output", exist_ok=True)

results[0].save(f"output/{base_name_without_extension}.jpg") # Save the image with the bounding boxes