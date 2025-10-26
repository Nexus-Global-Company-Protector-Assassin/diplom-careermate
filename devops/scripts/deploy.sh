#!/bin/bash

# ==========================================
# CareerMate Deployment Script
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

log_info "Deploying CareerMate to ${ENVIRONMENT}..."
log_info "Project root: ${PROJECT_ROOT}"

# Check environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    log_error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Load environment variables
if [ -f "${PROJECT_ROOT}/.env.${ENVIRONMENT}" ]; then
    log_info "Loading environment variables from .env.${ENVIRONMENT}"
    export $(cat "${PROJECT_ROOT}/.env.${ENVIRONMENT}" | grep -v '^#' | xargs)
else
    log_warning ".env.${ENVIRONMENT} not found, using default .env"
    export $(cat "${PROJECT_ROOT}/.env" | grep -v '^#' | xargs)
fi

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

log_success "Pre-deployment checks passed"

# Build images
log_info "Building Docker images..."
cd "${PROJECT_ROOT}"

docker-compose -f devops/docker/docker-compose.prod.yml build --no-cache

log_success "Docker images built successfully"

# Database backup (production only)
if [ "$ENVIRONMENT" = "production" ]; then
    log_info "Creating database backup..."

    BACKUP_DIR="${PROJECT_ROOT}/backups"
    mkdir -p "$BACKUP_DIR"

    BACKUP_FILE="${BACKUP_DIR}/db_backup_$(date +%Y%m%d_%H%M%S).sql"

    docker-compose -f devops/docker/docker-compose.prod.yml exec -T postgres \
        pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" > "$BACKUP_FILE"

    log_success "Database backup created: $BACKUP_FILE"
fi

# Stop old containers
log_info "Stopping old containers..."
docker-compose -f devops/docker/docker-compose.prod.yml down

# Start new containers
log_info "Starting new containers..."
docker-compose -f devops/docker/docker-compose.prod.yml up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 10

# Health checks
log_info "Running health checks..."

# Check backend
BACKEND_URL="${API_URL:-http://localhost:3001}"
if curl -f "${BACKEND_URL}/api/v1/health" &> /dev/null; then
    log_success "Backend is healthy"
else
    log_error "Backend health check failed"
    exit 1
fi

# Check frontend
FRONTEND_URL="${NEXTAUTH_URL:-http://localhost:3000}"
if curl -f "${FRONTEND_URL}" &> /dev/null; then
    log_success "Frontend is healthy"
else
    log_error "Frontend health check failed"
    exit 1
fi

# Run database migrations
log_info "Running database migrations..."
docker-compose -f devops/docker/docker-compose.prod.yml exec -T backend \
    npx prisma migrate deploy

log_success "Database migrations completed"

# Clean up old images
log_info "Cleaning up old Docker images..."
docker system prune -f

log_success "Deployment completed successfully!"

# Show running containers
log_info "Running containers:"
docker-compose -f devops/docker/docker-compose.prod.yml ps

echo ""
log_success "CareerMate ${ENVIRONMENT} is now running!"
echo ""
echo "Services:"
echo "  Frontend: ${FRONTEND_URL}"
echo "  Backend:  ${BACKEND_URL}"
echo "  API Docs: ${BACKEND_URL}/api/docs"
echo ""
