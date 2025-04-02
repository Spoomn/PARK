from flask import Flask, request, jsonify
import google.auth
from google.auth.transport.requests import Request
import requests

app = Flask(__name__)

PROJECT_ID = "vision-447321"

@app.route('/', methods=['POST'])
def event_handler():
    event = request.get_json()
    print("Received Event:", event)
    
    # Instead of extracting and passing file data, just trigger the job.
    job_url = f"https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/jobs/pipeline-job:run"
    
    
    credentials, _ = google.auth.default()
    auth_req = Request()
    credentials.refresh(auth_req)
    
    headers = {
        "Authorization": f"Bearer {credentials.token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(job_url, headers=headers)
    print("Job execution response:", response.status_code, response.text)
    
    if response.status_code == 200:
        return jsonify({"status": "Job triggered successfully"}), 200
    else:
        return jsonify({"error": response.text}), response.status_code

if __name__ == '__main__':
    app.run(debug=True)
