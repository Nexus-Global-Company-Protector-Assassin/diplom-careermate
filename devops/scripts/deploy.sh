#!/bin/bash
# Manual VPS deploy script — use when deploying outside of GitHub Actions CI/CD.
# For automated deploys, push to main and let GitHub Actions handle it.

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
COMPOSE_FILE="${PROJECT_ROOT}/devops/docker/docker-compose.prod.yml"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    log_error "Usage: $0 [staging|production]"
    exit 1
fi

log_info "Deploying CareerMate → ${ENVIRONMENT}"

# Load env vars safely (no eval, handles spaces and special chars)
ENV_FILE="${PROJECT_ROOT}/.env.${ENVIRONMENT}"
[[ -f "$ENV_FILE" ]] || ENV_FILE="${PROJECT_ROOT}/.env"
if [[ ! -f "$ENV_FILE" ]]; then
    log_error "No env file found at $ENV_FILE"
    exit 1
fi
set -a; source "$ENV_FILE"; set +a
log_success "Loaded env from $ENV_FILE"

# Preflight checks
command -v docker &>/dev/null || { log_error "Docker not installed"; exit 1; }
docker compose version &>/dev/null || { log_error "Docker Compose plugin not installed"; exit 1; }
log_success "Preflight checks passed"

# Backup DB before production deploy
if [[ "$ENVIRONMENT" == "production" ]]; then
    BACKUP_DIR="${PROJECT_ROOT}/backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="${BACKUP_DIR}/db_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    log_info "Backing up database → $BACKUP_FILE"
    docker compose -f "$COMPOSE_FILE" exec -T postgres \
        pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "$BACKUP_FILE"
    log_success "Backup saved: $BACKUP_FILE"
fi

# Pull latest images from GHCR
log_info "Pulling latest images from registry..."
docker compose -f "$COMPOSE_FILE" pull --ignore-pull-failures backend agent
log_success "Images pulled"

# Run migrations before starting new containers
log_info "Running DB migrations..."
docker compose -f "$COMPOSE_FILE" run --rm migrate
log_success "Migrations complete"

# Rolling restart of app services (keeps nginx + DB running)
log_info "Restarting backend and agent..."
docker compose -f "$COMPOSE_FILE" up -d --no-build --remove-orphans backend agent

# Health check with polling (no sleep guessing)
wait_healthy() {
    local name=$1 url=$2 timeout=${3:-60}
    log_info "Waiting for $name to be healthy ($timeout s max)..."
    local deadline=$(( $(date +%s) + timeout ))
    until curl -sf --max-time 5 "$url" &>/dev/null; do
        if (( $(date +%s) > deadline )); then
            log_error "$name health check timed out"
            docker compose -f "$COMPOSE_FILE" logs --tail=50 "$name"
            return 1
        fi
        sleep 3
    done
    log_success "$name is healthy"
}

wait_healthy "backend" "http://localhost:3001/api/v1/health" 90
wait_healthy "agent"   "http://localhost:3002/health"         60

# Cleanup old/dangling images (scoped — won't nuke other projects)
log_info "Cleaning up dangling images..."
docker image prune -f --filter "dangling=true"

log_success "Deployment to ${ENVIRONMENT} complete!"
echo ""
echo "  Backend: http://localhost:3001/api/docs"
echo "  Agent:   http://localhost:3002"
