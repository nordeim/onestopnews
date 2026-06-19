#!/bin/bash
# Deployment script for OneStopNews. Production deployments only.
set -euo pipefail

# Configuration
IMAGE_TAG="${1:-latest}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"  # Set if using a registry like ECR/GCR

# Functions
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Deployment Steps
log "Starting deployment with image tag: $IMAGE_TAG"

# Build and push images (if registry is set)
if [ -n "$DOCKER_REGISTRY" ]; then
  log "Building and pushing Docker images to $DOCKER_REGISTRY..."
  docker compose -f docker-compose.prod.yml build
  docker tag onestopnews-web:latest "${DOCKER_REGISTRY}/onestopnews-web:${IMAGE_TAG}"
  docker push "${DOCKER_REGISTRY}/onestopnews-web:${IMAGE_TAG}"
else
  log "Building Docker images locally..."
  docker compose -f docker-compose.prod.yml build
  docker compose -f docker-compose.prod.yml up -d
  log "Running database migrations..."
  # Ideally, run migrations as a one-off container or via a script
  docker compose -f docker-compose.prod.yml exec web pnpm run db:migrate || true
fi

log "Deployment complete!"
