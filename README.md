# PARK
##  Parking App for Real-Time Knowledge

An AI-powered, full-stack smart parking availability application designed for any parking lot. This system uses real-time machine vision to collect parking data and update a database. The app displays available parking in a user-friendly interactive web app.

## Project Overview

Finding parking on campus can be frustrating. My goal is to simplify that process by providing students and faculty with **real-time updates on parking availability** across campus lots.

This project utilizes:
- A **YOLO-based object detection model** to detect cars from aerial images.
- A **Google Cloud-hosted backend** to manage and serve availability data.
- A **modern web interface** that displays clickable parking lot maps with status updates.

## Features

-  **AI-Powered Detection:** Uses pre-trained YOLOv11x model to identify vehicles in parking lot images.
-  **Cloud Integration:** Google Cloud Platform App Engine for scalable image processing and backend services.
-  **Interactive UI:** Users interact with cards that provide detailed information on the lots.
-  **Backend API:** REST API built with Python to serve and update parking availability.
-  **Database Support:** PostgreSQL database for storing information on each parking lot and other important data.

## Data Setup


- A set of **aerial or drone images** fed into the pipeline on an interval loop.

These images are passed into the YOLO model, which processes them and returns a car count per lot.

## Machine Learning Pipeline

1. **Image Input:** Static aerial images.
2. **Model Inference:** YOLOv11x model detects vehicles.
3. **Post-processing:** Cars are counted per lot.
4. **Data Output:** Availability metrics pushed to backend/database.


## Web Interface

The frontend is designed with simplicity and clarity in mind:

- Built with modern React.
- Clicking a lot reveals:
  - Live car count
  - Lot Description
  - Map Link for directions
  
Status updates are refreshed periodically.

## Tech Stack

| Layer         | Technology Used                          |
|--------------|-------------------------------------------|
| Frontend     | HTML/CSS, React, Javascript |
| Backend API  | Python, Express                |
| ML Framework | YOLOv11 by Ultralytics                      |
| Database     | PostgreSQL via GCloud SQL   |
| Cloud Infra  | Google Cloud Platform                     |
| Deployment   | App Engine, Cloud Run             |


## Future Improvements

- Integrate real live feeds for configured lots
- Train a custom model specifically on parking data
- Add user alerts when availability changes
- Improve frontend with dark mode and accessibility support
- Live map view using Leaflet.js
- Add trends and historic data to reflect patterns

