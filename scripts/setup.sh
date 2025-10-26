#!/bin/bash

# CareerMate Project Setup Script (Bash)
# This script initializes the project structure for Unix/Linux/MacOS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_header() {
    echo ""
    echo -e "${GREEN}$1${NC}"
    echo ""
}

# Project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

log_header "🚀 CareerMate Project Setup"

# Check Node.js version
log_info "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node --version)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')

if [ "$MAJOR_VERSION" -lt 18 ]; then
    log_error "Node.js version $NODE_VERSION is not supported. Please use Node.js 18 or higher."
    exit 1
fi

log_success "Node.js $NODE_VERSION detected"

# Create directory structure
log_header "📁 Creating Directory Structure"

directories=(
    # Frontend
    "frontend/src"
    "frontend/src/app"
    "frontend/src/app/(auth)/login"
    "frontend/src/app/(auth)/register"
    "frontend/src/app/(dashboard)/dashboard"
    "frontend/src/app/(dashboard)/profile"
    "frontend/src/app/(dashboard)/resumes"
    "frontend/src/app/(dashboard)/jobs"
    "frontend/src/app/(dashboard)/applications"
    "frontend/src/app/(dashboard)/interview-prep"
    "frontend/src/components/ui"
    "frontend/src/components/layout"
    "frontend/src/components/forms"
    "frontend/src/lib"
    "frontend/src/hooks"
    "frontend/src/services"
    "frontend/src/types"
    "frontend/src/utils"
    "frontend/src/styles"
    "frontend/public/images"
    "frontend/public/fonts"

    # Backend
    "backend/src/auth/strategies"
    "backend/src/auth/guards"
    "backend/src/auth/decorators"
    "backend/src/users/entities"
    "backend/src/users/dto"
    "backend/src/profiles/entities"
    "backend/src/profiles/dto"
    "backend/src/profiles/career-paths"
    "backend/src/profiles/skills-analysis"
    "backend/src/resumes/entities"
    "backend/src/resumes/dto"
    "backend/src/resumes/templates"
    "backend/src/resumes/generators"
    "backend/src/jobs/entities"
    "backend/src/jobs/dto"
    "backend/src/jobs/scrapers"
    "backend/src/jobs/matching"
    "backend/src/applications/entities"
    "backend/src/applications/dto"
    "backend/src/applications/auto-apply"
    "backend/src/applications/tracking"
    "backend/src/interviews/entities"
    "backend/src/interviews/dto"
    "backend/src/interviews/company-research"
    "backend/src/interviews/question-gen"
    "backend/src/ai/langchain"
    "backend/src/ai/embeddings"
    "backend/src/ai/providers"
    "backend/src/notifications/email"
    "backend/src/notifications/push"
    "backend/src/analytics/reports"
    "backend/src/common/decorators"
    "backend/src/common/filters"
    "backend/src/common/guards"
    "backend/src/common/interceptors"
    "backend/src/common/pipes"
    "backend/src/config"
    "backend/src/database"
    "backend/src/queues"
    "backend/src/workers"
    "backend/prisma/migrations"
    "backend/test"

    # Docs
    "docs/api"
    "docs/architecture"
    "docs/guides"
    "docs/deployment"

    # Scripts
    "scripts/migrations"

    # Shared
    "shared/types"
    "shared/utils"

    # Docker
    "docker"

    # Tests
    "tests/e2e"
    "tests/integration"
    "tests/load"

    # Uploads
    "uploads/resumes"
    "uploads/cover-letters"
    "uploads/temp"

    # Logs
    "logs"
)

created_count=0

for dir in "${directories[@]}"; do
    full_path="$ROOT_DIR/$dir"
    if [ ! -d "$full_path" ]; then
        mkdir -p "$full_path"
        touch "$full_path/.gitkeep"
        log_success "Created: $dir"
        ((created_count++))
    fi
done

if [ $created_count -gt 0 ]; then
    log_success "Created $created_count directories"
else
    log_info "All directories already exist"
fi

# Setup environment
log_header "⚙️  Setting Up Environment"

if [ ! -f "$ROOT_DIR/.env" ]; then
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    log_success "Created .env file from .env.example"
    log_warning "Please update .env with your configuration"
else
    log_info ".env file already exists"
fi

# Make scripts executable
chmod +x "$SCRIPT_DIR/setup.sh" 2>/dev/null || true
chmod +x "$ROOT_DIR/node_modules/.bin/"* 2>/dev/null || true

# Success message
log_header "✅ Setup Complete!"

cat << EOF

${GREEN}Next Steps:${NC}

1. Configure your environment:
   ${BLUE}Edit .env file with your API keys and configuration${NC}

2. Start infrastructure services:
   ${GREEN}docker-compose up -d${NC}

3. Install dependencies:
   ${GREEN}npm run install:all${NC}

4. Setup database:
   ${GREEN}npm run db:migrate${NC}

5. Start development servers:
   ${GREEN}npm run dev${NC}

${YELLOW}Optional Development Tools:${NC}
   - PgAdmin: http://localhost:5050
   - Redis Commander: http://localhost:8081
   - MinIO Console: http://localhost:9001
   - MailHog: http://localhost:8025

${GREEN}For more information, see README.md${NC}

EOF
