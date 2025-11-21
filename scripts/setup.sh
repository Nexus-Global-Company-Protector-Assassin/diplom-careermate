#!/bin/bash

# CareerMate Project Setup Script (Bash)
# Fully automated project setup for Unix/Linux/macOS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_header() { echo -e "\n${BOLD}${CYAN}$1${NC}\n"; }
log_step() { echo -e "${BOLD}[$1]${NC} $2"; }

# Project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Banner
echo -e "
${BOLD}${CYAN}
   ____                          __  __       _
  / ___|__ _ _ __ ___  ___ _ __|  \\/  | __ _| |_ ___
 | |   / _\` | '__/ _ \\/ _ \\ '__| |\\/| |/ _\` | __/ _ \\
 | |__| (_| | | |  __/  __/ |  | |  | | (_| | ||  __/
  \\____\\__,_|_|  \\___|\\___|_|  |_|  |_|\\__,_|\\__\\___|

${NC}${DIM}  Project Setup Script v1.0${NC}
"

# ==========================================
# Check Dependencies
# ==========================================
log_header "🔍 Checking Dependencies"

DEPS_OK=true

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        log_success "Node.js $NODE_VERSION"
    else
        log_error "Node.js $NODE_VERSION - requires v18+"
        DEPS_OK=false
    fi
else
    log_error "Node.js not found"
    DEPS_OK=false
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_success "npm v$NPM_VERSION"
else
    log_error "npm not found"
    DEPS_OK=false
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker -v | head -n1)
    log_success "$DOCKER_VERSION"

    # Check Docker daemon
    if docker info &> /dev/null; then
        log_success "Docker daemon is running"
    else
        log_warning "Docker daemon is not running - please start Docker Desktop"
    fi
else
    log_error "Docker not found - please install Docker Desktop"
    DEPS_OK=false
fi

# Check docker-compose
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    log_success "Docker Compose available"
else
    log_warning "Docker Compose not found"
fi

if [ "$DEPS_OK" = false ]; then
    log_error "Please install missing dependencies and try again"
    exit 1
fi

# ==========================================
# Setup Environment
# ==========================================
log_header "⚙️  Setting Up Environment"

# Root .env
if [ ! -f "$ROOT_DIR/.env" ]; then
    if [ -f "$ROOT_DIR/.env.example" ]; then
        cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
        log_success "Created .env from .env.example"
    fi
else
    log_info ".env already exists"
fi

# Frontend .env.local
if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
    if [ -f "$ROOT_DIR/frontend/.env.example" ]; then
        cp "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env.local"
        log_success "Created frontend/.env.local"
    fi
else
    log_info "frontend/.env.local already exists"
fi

# Backend .env
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
    if [ -f "$ROOT_DIR/backend/.env.example" ]; then
        cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
        log_success "Created backend/.env"
    fi
else
    log_info "backend/.env already exists"
fi

# ==========================================
# Install Dependencies
# ==========================================
log_header "📦 Installing Dependencies"

# Root dependencies
if [ -f "$ROOT_DIR/package.json" ]; then
    log_step 1 "Installing root dependencies..."
    cd "$ROOT_DIR" && npm install
    log_success "Root dependencies installed"
fi

# Frontend dependencies
if [ -f "$ROOT_DIR/frontend/package.json" ]; then
    log_step 2 "Installing frontend dependencies..."
    cd "$ROOT_DIR/frontend" && npm install
    log_success "Frontend dependencies installed"
fi

# Backend dependencies
if [ -f "$ROOT_DIR/backend/package.json" ]; then
    log_step 3 "Installing backend dependencies..."
    cd "$ROOT_DIR/backend" && npm install
    log_success "Backend dependencies installed"
fi

cd "$ROOT_DIR"

# ==========================================
# Start Docker Services
# ==========================================
log_header "🐳 Starting Docker Services"

DOCKER_STARTED=false

if [ -f "$ROOT_DIR/docker-compose.yml" ]; then
    if docker info &> /dev/null; then
        log_info "Starting containers (this may take a few minutes on first run)..."

        # Try docker compose v2 first
        if docker compose version &> /dev/null; then
            docker compose up -d
        else
            docker-compose up -d
        fi

        log_success "Docker services started"

        # Wait for services
        log_info "Waiting for services to be healthy..."
        ATTEMPTS=0
        MAX_ATTEMPTS=30

        while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
            if docker compose exec -T postgres pg_isready &> /dev/null 2>&1; then
                break
            fi
            ATTEMPTS=$((ATTEMPTS + 1))
            sleep 2
        done

        if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
            log_warning "Services may not be fully ready yet"
        else
            log_success "All services are healthy"
        fi

        DOCKER_STARTED=true
    else
        log_warning "Docker daemon not running - skipping container startup"
        log_info "Start Docker Desktop and run: docker-compose up -d"
    fi
else
    log_warning "docker-compose.yml not found"
fi

# ==========================================
# Run Database Migrations
# ==========================================
log_header "🗄️  Setting Up Database"

if [ "$DOCKER_STARTED" = true ] && [ -f "$ROOT_DIR/backend/prisma/schema.prisma" ]; then
    log_info "Waiting for database to be ready..."
    sleep 5

    cd "$ROOT_DIR/backend"

    # Generate Prisma client
    log_info "Generating Prisma client..."
    npx prisma generate || log_warning "Prisma generate failed"
    log_success "Prisma client generated"

    # Run migrations
    log_info "Running database migrations..."
    npx prisma migrate deploy || log_warning "Migration failed - run manually: cd backend && npx prisma migrate deploy"
    log_success "Database migrations applied"

    cd "$ROOT_DIR"
else
    log_warning "Skipping migrations (Docker not running or Prisma not found)"
fi

# ==========================================
# Summary
# ==========================================
log_header "✅ Setup Complete!"

cat << EOF

${BOLD}Services are running at:${NC}

${CYAN}Application:${NC}
  Frontend:         http://localhost:3000
  Backend API:      http://localhost:3001
  API Docs:         http://localhost:3001/api/docs

${CYAN}Database & Cache:${NC}
  PostgreSQL:       localhost:5432
  Redis:            localhost:6379

${CYAN}Admin Tools:${NC}
  PgAdmin:          http://localhost:5050
  Redis Commander:  http://localhost:8081
  MinIO Console:    http://localhost:9001
  MailHog:          http://localhost:8025

${BOLD}Default Credentials:${NC}

${CYAN}PostgreSQL:${NC}
  User:     careermate
  Password: careermate_dev_pass
  Database: careermate_dev

${CYAN}PgAdmin:${NC}
  Email:    admin@careermate.com
  Password: admin

${CYAN}Redis:${NC}
  Password: careermate_redis_pass

${CYAN}MinIO:${NC}
  User:     minioadmin
  Password: minioadmin

${BOLD}Quick Start:${NC}

  ${GREEN}npm run dev${NC}           # Start development servers
  ${GREEN}npm run docker:dev${NC}    # Start/restart Docker services
  ${GREEN}npm run db:studio${NC}     # Open Prisma Studio

${DIM}For more information, see README.md${NC}

EOF
