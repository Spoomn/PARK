from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import storage
import os
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

BUCKET_NAME = 'parking-lot-photos'

@app.post("/upload_photo")
async def upload_photo(image: UploadFile = File(...), lotName: str = Form(...)):
    client = storage.Client()
    bucket = client.get_bucket(BUCKET_NAME)

    # Create subdirectory with lotName and current timestamp for uniqueness
    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{image.filename}"
    blob_path = f"{lotName}/{filename}"

    blob = bucket.blob(blob_path)
    blob.upload_from_file(image.file, content_type=image.content_type)


    return {
        "message": "Uploaded successfully",
        "url": blob.public_url,
        "path": blob_path
    }
