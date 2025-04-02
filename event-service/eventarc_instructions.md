## Instructions for building and deploying a new version of the eventarc trigger
# Build
    gcloud builds submit --tag gcr.io/vision-447321/eventarc-trigger-service

# Deploy
    gcloud run deploy eventarc-trigger-service \
    --image gcr.io/vision-447321/eventarc-trigger-service \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated

# Create eventarc trigger if it doesn't exist
    gcloud eventarc triggers create eventarc-trigger \
    --location=us-central1 \
    --destination-run-service=eventarc-trigger-service \
    --destination-run-region=us-central1 \
    --service-account=706655025204-compute@developer.gserviceaccount.com \
    --event-filters="type=google.cloud.storage.object.v1.finalized" \
    --event-filters="bucket=parking-lot-images"
