#!/bin/bash
# Deploy Gotenberg PDF renderer to Google Cloud Run.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - A GCP project configured (gcloud config set project YOUR_PROJECT)
#
# Gotenberg runs Chromium inside a proper Docker container — no more
# @sparticuz/chromium-min in serverless. This service is stateless and
# scales to zero when not in use (zero cost at idle).
#
# Usage:
#   chmod +x scripts/deploy-gotenberg.sh
#   ./scripts/deploy-gotenberg.sh

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${GCP_REGION:-us-east1}"
SERVICE_NAME="intentbid-pdf-renderer"
IMAGE="gotenberg/gotenberg:8"

echo "Deploying Gotenberg to Cloud Run..."
echo "  Project: ${PROJECT_ID}"
echo "  Region:  ${REGION}"
echo "  Service: ${SERVICE_NAME}"
echo "  Image:   ${IMAGE}"
echo ""

gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --timeout 120s \
  --concurrency 10 \
  --no-allow-unauthenticated \
  --set-env-vars "CHROMIUM_DISABLE_ROUTES=true" \
  --set-env-vars "LOG_LEVEL=info"

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --format 'value(status.url)')

echo ""
echo "Gotenberg deployed successfully!"
echo "  URL: ${SERVICE_URL}"
echo ""
echo "Next steps:"
echo "  1. Set GOTENBERG_URL=${SERVICE_URL} in your Vercel environment"
echo "  2. For Cloud Run auth, the Next.js app needs a service account with 'Cloud Run Invoker' role"
echo "     OR allow unauthenticated access (simpler, service is not publicly discoverable):"
echo "     gcloud run services add-iam-policy-binding ${SERVICE_NAME} \\"
echo "       --region=${REGION} --member=allUsers --role=roles/run.invoker"
