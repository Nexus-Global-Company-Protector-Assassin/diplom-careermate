#!/bin/bash

# ==========================================
# CareerMate Database Backup Script
# ==========================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/careermate_backup_${TIMESTAMP}.sql"
RETENTION_DAYS=7

# Load environment variables
if [ -f "${PROJECT_ROOT}/.env" ]; then
    export $(cat "${PROJECT_ROOT}/.env" | grep -v '^#' | xargs)
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

log_info "Starting database backup..."

# Create backup
docker-compose -f "${PROJECT_ROOT}/devops/docker/docker-compose.prod.yml" exec -T postgres \
    pg_dump -U "${POSTGRES_USER:-careermate}" "${POSTGRES_DB:-careermate}" \
    > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

log_success "Backup created: $BACKUP_FILE"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log_info "Backup size: $BACKUP_SIZE"

# Delete old backups
log_info "Deleting backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "careermate_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# Count remaining backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/careermate_backup_*.sql.gz 2>/dev/null | wc -l)
log_info "Total backups: $BACKUP_COUNT"

log_success "Backup completed successfully!"
