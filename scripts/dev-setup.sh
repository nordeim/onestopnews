#!/usr/bin/env bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up OneStopNews development environment with Docker...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

# Copy .env.docker to .env if not exists (for local scripts)
if [ ! -f .env ]; then
    cp .env.docker .env
    echo -e "${GREEN}Created .env from .env.docker${NC}"
fi

# Create necessary directories (if any)
mkdir -p scripts

# Ensure init-extensions.sql exists
if [ ! -f scripts/init-extensions.sql ]; then
    echo "ERROR: scripts/init-extensions.sql not found. Please create it."
    exit 1
fi

# Build and start services
echo -e "${YELLOW}Building and starting containers...${NC}"
docker compose -f docker-compose-dev.yml up --build -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

# Run database migrations (if needed)
echo -e "${YELLOW}Running database migrations...${NC}"
docker exec onestopnews-web-dev pnpm drizzle-kit migrate

echo -e "${GREEN}Development environment is ready!${NC}"
echo -e "Web app: ${GREEN}http://localhost:3000${NC}"
echo -e "PostgreSQL: ${GREEN}localhost:5432${NC} (user: onestopnews, password: onestopnews)"
echo -e "Redis: ${GREEN}localhost:6379${NC}"
echo ""
echo "To stop: docker compose -f docker-compose-dev.yml down"
echo "To view logs: docker compose -f docker-compose-dev.yml logs -f"
