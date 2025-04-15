from flask import Flask, request, jsonify
import google.auth
from google.auth.transport.requests import Request
import requests
import os
import socket

app = Flask(__name__)

PROJECT_ID = "vision-447321"
PROJECT_NUMBER = "706655025204"
JOB_NAME = "pipeline-job"
BUCKET_NAME = "parking-lot-images"

@app.route('/', methods=['POST'])
def event_handler():
    event = request.get_json()
    print("Received Event:", event)
    
    image_name = event.get("name")
    print(f"Image name: {image_name}")
    if not image_name:
        return jsonify({"error": "Image name not found in event"}), 400
    
    job_url = f"https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/{PROJECT_ID}/jobs/pipeline-job:run"
    
    
    credentials, _ = google.auth.default()
    auth_req = Request()
    credentials.refresh(auth_req)
    
    headers = {
        "Authorization": f"Bearer {credentials.token}",
        "Content-Type": "application/json"
    }

    payload = {
        "taskOverrides": {
            "containerOverrides": [
                {
                    "name": "pipeline-job",  # This must match your container name (check your YAML or deploy script)
                    "env": [
                        {
                            "name": "IMAGE_NAME",
                            "value": image_name
                        }
                    ]
                }
            ]
        }
    }

    
    response = requests.post(job_url, headers=headers, json=payload)
    print("Job execution response:", response.status_code, response.text)
    
    if response.status_code == 200:
        return jsonify({"status": "Job triggered successfully"}), 200
    else:
        return jsonify({"error": response.text}), response.status_code

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
