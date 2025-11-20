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
    # Apps - Monorepo applications
    "apps"
    "apps/frontend"
    "apps/frontend/app"
    "apps/frontend/app/(auth)/login"
    "apps/frontend/app/(auth)/register"
    "apps/frontend/app/(dashboard)/dashboard"
    "apps/frontend/app/(dashboard)/profile"
    "apps/frontend/app/(dashboard)/resumes"
    "apps/frontend/app/(dashboard)/jobs"
    "apps/frontend/app/(dashboard)/applications"
    "apps/frontend/app/(dashboard)/interview-prep"
    "apps/frontend/app/api"
    "apps/frontend/components/features"
    "apps/frontend/components/layout"
    "apps/frontend/components/shared"
    "apps/frontend/components/ui"
    "apps/frontend/lib"
    "apps/frontend/hooks"
    "apps/frontend/services"
    "apps/frontend/styles"
    "apps/frontend/public/images"
    "apps/frontend/public/fonts"

    "apps/backend"
    "apps/backend/src"
    "apps/backend/src/modules"
    "apps/backend/src/modules/auth"
    "apps/backend/src/modules/users"
    "apps/backend/src/modules/profiles"
    "apps/backend/src/modules/resumes"
    "apps/backend/src/modules/jobs"
    "apps/backend/src/modules/applications"
    "apps/backend/src/modules/interviews"
    "apps/backend/src/modules/ai"
    "apps/backend/src/modules/notifications"
    "apps/backend/src/modules/analytics"
    "apps/backend/src/common/decorators"
    "apps/backend/src/common/filters"
    "apps/backend/src/common/guards"
    "apps/backend/src/common/interceptors"
    "apps/backend/src/common/pipes"
    "apps/backend/src/config"
    "apps/backend/src/database"
    "apps/backend/test/unit"
    "apps/backend/test/integration"
    "apps/backend/test/e2e"

    # Packages - Shared libraries
    "packages"
    "packages/types/src"
    "packages/ui/src"
    "packages/utils/src"
    "packages/config/src"

    # Prisma - Database
    "prisma"
    "prisma/migrations"
    "prisma/seeds"

    # DevOps
    "devops"
    "devops/docker"
    "devops/k8s"
    "devops/scripts"

    # Docs
    "docs/api"
    "docs/architecture"
    "docs/guides"
    "docs/deployment"

    # Scripts
    "scripts/migrations"
    "scripts/generators"

    # Legacy (for backward compatibility)
    "frontend/src"
    "backend/src"

    # Uploads
    "uploads/resumes"
    "uploads/cover-letters"
    "uploads/temp"

    # Logs
    "logs/backend"
    "logs/frontend"
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
   ${GREEN}npm run docker:dev${NC}

3. Install dependencies:
   ${GREEN}npm install${NC}

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
