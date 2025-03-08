from ultralytics import YOLO
import os
import traceback
import os

EPOCHS = 5
BATCH = 16
IMGSZ = 640
WORKERS = 8

MIN_EPOCHS = 5
RETRY_LIMIT = 1

DATASET = "A"
# if DATASET == "A":
#     DATA = "/home/spoomn/datasets/Car-Detection/kaggle_dataset.yaml"
# if DATASET == "B":
#     DATA = "/home/spoomn/datasets/Vehicle-Detection/dataset-vehicles/maryam_dataset.yaml"
DATA = "/Users/spencerream/Vehicle_Detection_Image_Dataset/data.yaml"
model = YOLO("yolo11n_custom.pt")

retry_count = 0
while retry_count < RETRY_LIMIT and EPOCHS >= MIN_EPOCHS:
    try:
        print(f"Starting training attempt {retry_count + 1} with {EPOCHS} epochs...")

        train_results = model.train(
            data=DATA,
            epochs=EPOCHS,
            batch=BATCH,
            imgsz=IMGSZ,
            workers=WORKERS,
            # device="0",
        )

        print("Training completed successfully.")
        break  

    except Exception as e:
        error_message = traceback.format_exc()
        print(f"Training failed: {e}")
        
        with open("training_error.log", "a") as log_file:
            log_file.write(f"\n\nAttempt {retry_count + 1} failed:\n")
            log_file.write(error_message)
        
        EPOCHS = max(EPOCHS // 2, MIN_EPOCHS)
        retry_count += 1
        print(f"Retrying with {EPOCHS} epochs...\n")

if retry_count == RETRY_LIMIT:
    print("All retry attempts failed. Check training_error.log for details.")
else:
    results = model("parking_lot.JPEG")
    results[0].show()
    detected_objects = results[0]
    CAR_INDEX = 0
    if DATASET == "A":
        CAR_INDEX = 2
        data_name = "Kaggle" #source: https://www.kaggle.com/code/yusufsahin1/vehicle-detection-using-yolo-11
    elif DATASET == "B":
        data_name = "Maryam" #source: https://github.com/MaryamBoneh/Vehicle-Detection/blob/main/dataset.yaml
    else:
        data_name = "Sample"

    num_cars = sum(1 for obj in detected_objects.boxes.cls if obj == CAR_INDEX)
    print(f"Number of cars detected: {num_cars}")
    os.makedirs("output", exist_ok=True)

    results[0].save(f"output/trained_{data_name}_{EPOCHS}_{BATCH}_{IMGSZ}_{WORKERS}.jpg")

    path = model.export(format="onnx")

    print(f"Saved detection results to output/trained_{data_name}_{EPOCHS}_{BATCH}_{IMGSZ}_{WORKERS}.jpg")
    print(f"Exported model to {path}")
