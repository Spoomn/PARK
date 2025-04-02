import os
from dotenv import load_dotenv
import psycopg2
from ultralytics import YOLO
from google.cloud import storage
import tempfile
import onnxruntime as ort
import numpy as np
from google.cloud.sql.connector import Connector
import pg8000
from datetime import datetime, timezone

load_dotenv()

INSTANCE_CONNECTION_NAME = "vision-447321:us-central1:vision-db"
DB_USER = os.environ.get("DB_USERNAME")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_NAME = "vision"

def connect_with_connector():

    connector = Connector()
    conn = connector.connect(
        INSTANCE_CONNECTION_NAME, 
        "pg8000",
        user=DB_USER,
        password=DB_PASSWORD,
        db=DB_NAME,
        port=5432,
    )
    return conn

def update_parking_lot(lot_name, vehicle_count):
    formatted_lot_name = format_lot_name(lot_name)
    current_time = datetime.now(timezone.utc).isoformat()

    try:
        conn = connect_with_connector()
        cur = conn.cursor()

        cur.execute("SELECT COUNT(*) FROM parking_lots WHERE name = %s;", (formatted_lot_name,))
        exists = cur.fetchone()[0] > 0

        if not exists:
            print(f"⚠️ Parking lot '{formatted_lot_name}' not found in database.")
            cur.execute(
                "INSERT INTO parking_lots (name, occupied_spots, last_updated) "
                "VALUES (%s, %s, %s);", 
                (formatted_lot_name, vehicle_count, current_time)
            )
            print(f"✅ Created new parking lot: {formatted_lot_name}")

        update_query = """
        UPDATE parking_lots 
        SET occupied_spots = %s, last_updated = %s
        WHERE name = %s;
        """
        cur.execute(update_query, (vehicle_count, current_time, formatted_lot_name))
        conn.commit()
        
        # error check
        if cur.rowcount == 0:
            print(f"⚠️ No rows updated! Check if parking lot '{formatted_lot_name}' exists.")
        else:
            print(f"✅ Updated parking lot '{formatted_lot_name}' with {vehicle_count} occupied spots.")

        # query the database to confirm the update
        cur.execute("SELECT occupied_spots FROM parking_lots WHERE name = %s;", (formatted_lot_name,))
        updated_value = cur.fetchone()[0]
        if updated_value != vehicle_count:
            raise Exception(f"Verification failed: Expected {vehicle_count} but got {updated_value}")
        else:
            print("✅ Update verified: The occupied_spots field matches the expected value.")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"Database update failed: {e}")

def download_blob(bucket_name, source_blob_name, destination_file_name):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    print(f"🔍 Checking for {source_blob_name} in {bucket_name}...")

    blobs = list(bucket.list_blobs(prefix=source_blob_name.rsplit("/", 1)[0]))
    print("📂 Files in GCS bucket:")
    for blob in blobs:
        print(f"  - {blob.name}")

    blob = bucket.blob(source_blob_name)
    if not blob.exists():
        print(f"❌ Model file not found: {source_blob_name}")
        return

    blob.download_to_filename(destination_file_name)
    print(f"✅ Downloaded {source_blob_name} to {destination_file_name}")


def get_latest_image_path(bucket_name):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    blobs = list(bucket.list_blobs());


    image_blobs = sorted(
        [blob for blob in blobs if blob.name.lower().endswith(".jpg") and not blob.name.endswith("/")],
        key=lambda b: b.updated,
        reverse=True
    )

    latest_blob = image_blobs[0]
    latest_image_path = latest_blob.name

    latest_image_path = f"gs://{bucket_name}/{latest_blob.name}"
    print(f"✅ Latest image found: {latest_image_path}")
    return latest_image_path

def format_lot_name(lot_name):
    return lot_name.replace("_", " ").replace("-", " ").title().strip()

def extract_lot_name(gcs_path):
    parts = gcs_path.split('/')
    if len(parts) >= 4:
        return parts[3]
    return None

def main(model_path_gcs):
    print("🚀 Starting pipeline...")
    #Step 0: Bucket name
    bucket_name = "parking-lot-images"

    # Step 1: Get the lot name from the image detected as most recently uploaded
    file_path = get_latest_image_path(bucket_name)
    if not file_path:
        print(f"⚠️ No valid image found in path for processing.")
        return
    
    lot_name = extract_lot_name(file_path)
    if not lot_name:
        print("❌ Could not determine lot name from the provided image path.")
        return
    
    formatted_lot_name = format_lot_name(lot_name)
    print("Found Lot Name: ", formatted_lot_name)
    

    # Step 2: Temporary files for image and get model
    model_extension = os.path.splitext(model_path_gcs)[-1]
    temp_model = tempfile.NamedTemporaryFile(delete=False, suffix=model_extension)
    temp_image = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")

    # Extract bucket and file paths
    model_bucket, model_file = model_path_gcs.replace("gs://", "").split("/", 1)
    image_bucket, image_file = file_path.replace("gs://", "").split("/", 1)

    print(f"🔽 Downloading model from {model_path_gcs}...")
    download_blob(model_bucket, model_file, temp_model.name)
    print(f"✅ Model downloaded to: {temp_model.name}")

    print(f"🔽 Downloading image from {file_path}...")
    download_blob(image_bucket, image_file, temp_image.name)
    print(f"✅ Image downloaded to: {temp_image.name}")

    # Step 3: Run image model on latest image
    if temp_model.name.endswith(".pt"):
        print("🔹 Loading PyTorch Model...")
        model = YOLO(temp_model.name)

        # Run inference
        print("🛠 Running YOLO detection...")
        results = model(temp_image.name)
        detected_objects = results[0]
        VEHICLE_CLASSES = {2, 3, 7}
        num_vehicles = sum(1 for obj in detected_objects.boxes.cls.tolist() if obj in VEHICLE_CLASSES)

    elif temp_model.name.endswith(".onnx"):
        print(f"⚠️ Unsupported model format: {temp_model.name}")
        return

    print(f"✅ Number of cars and trucks detected: {num_vehicles}")

    # Step 4: Update parking lot information in database
    print("🗄 Updating database...")
    update_parking_lot(formatted_lot_name, num_vehicles)
    print("✅ Database update complete!")

if __name__ == "__main__":
    model_path_gcs = "gs://yolo11n-bucket/yolo/v1/yolo11x.pt" 

    # print(f"🛠 Running with model: {args.model_path_gcs}, parking lot: {args.lot_name}")
    print(f"🛠 Running with model: {model_path_gcs}")

    main(model_path_gcs)
