# CareerMate Project Setup Script (PowerShell)
# Fully automated project setup for Windows

$ErrorActionPreference = "Stop"

# Colors
function Write-Info($message) { Write-Host "i " -ForegroundColor Blue -NoNewline; Write-Host $message }
function Write-Success($message) { Write-Host "√ " -ForegroundColor Green -NoNewline; Write-Host $message }
function Write-Warn($message) { Write-Host "! " -ForegroundColor Yellow -NoNewline; Write-Host $message }
function Write-Err($message) { Write-Host "X " -ForegroundColor Red -NoNewline; Write-Host $message }
function Write-Header($message) { Write-Host "`n$message`n" -ForegroundColor Cyan }
function Write-Step($num, $message) { Write-Host "[$num] " -ForegroundColor White -NoNewline; Write-Host $message }

# Project root
$ROOT_DIR = Split-Path -Parent $PSScriptRoot

# Banner
Write-Host @"

   ____                          __  __       _
  / ___|__ _ _ __ ___  ___ _ __|  \/  | __ _| |_ ___
 | |   / _`` | '__/ _ \/ _ \ '__| |\/| |/ _`` | __/ _ \
 | |__| (_| | | |  __/  __/ |  | |  | | (_| | ||  __/
  \____\__,_|_|  \___|\___|_|  |_|  |_|\__,_|\__\___|

  Project Setup Script v1.0

"@ -ForegroundColor Cyan

# ==========================================
# Check Dependencies
# ==========================================
Write-Header "Checking Dependencies"

$depsOk = $true

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')

    if ($majorVersion -ge 18) {
        Write-Success "Node.js $nodeVersion"
    } else {
        Write-Err "Node.js $nodeVersion - requires v18+"
        $depsOk = $false
    }
} catch {
    Write-Err "Node.js not found"
    $depsOk = $false
}

# Check npm
try {
    $npmVersion = npm --version 2>$null
    Write-Success "npm v$npmVersion"
} catch {
    Write-Err "npm not found"
    $depsOk = $false
}

# Check Docker
try {
    $dockerVersion = docker -v 2>$null
    Write-Success $dockerVersion

    # Check Docker daemon
    $null = docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker daemon is running"
    } else {
        Write-Warn "Docker daemon is not running - please start Docker Desktop"
    }
} catch {
    Write-Err "Docker not found - please install Docker Desktop"
    $depsOk = $false
}

# Check docker-compose
try {
    $null = docker compose version 2>$null
    Write-Success "Docker Compose available"
} catch {
    try {
        $null = docker-compose --version 2>$null
        Write-Success "Docker Compose available"
    } catch {
        Write-Warn "Docker Compose not found"
    }
}

if (-not $depsOk) {
    Write-Err "Please install missing dependencies and try again"
    exit 1
}

# ==========================================
# Setup Environment
# ==========================================
Write-Header "Setting Up Environment"

# Root .env
$envFile = Join-Path $ROOT_DIR ".env"
$envExample = Join-Path $ROOT_DIR ".env.example"
if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Success "Created .env from .env.example"
    }
} else {
    Write-Info ".env already exists"
}

# Frontend .env.local
$feEnvFile = Join-Path $ROOT_DIR "frontend\.env.local"
$feEnvExample = Join-Path $ROOT_DIR "frontend\.env.example"
if (-not (Test-Path $feEnvFile)) {
    if (Test-Path $feEnvExample) {
        Copy-Item $feEnvExample $feEnvFile
        Write-Success "Created frontend\.env.local"
    }
} else {
    Write-Info "frontend\.env.local already exists"
}

# Backend .env
$beEnvFile = Join-Path $ROOT_DIR "backend\.env"
$beEnvExample = Join-Path $ROOT_DIR "backend\.env.example"
if (-not (Test-Path $beEnvFile)) {
    if (Test-Path $beEnvExample) {
        Copy-Item $beEnvExample $beEnvFile
        Write-Success "Created backend\.env"
    }
} else {
    Write-Info "backend\.env already exists"
}

# ==========================================
# Install Dependencies
# ==========================================
Write-Header "Installing Dependencies"

# Root dependencies
$rootPackage = Join-Path $ROOT_DIR "package.json"
if (Test-Path $rootPackage) {
    Write-Step 1 "Installing root dependencies..."
    Push-Location $ROOT_DIR
    npm install
    Pop-Location
    Write-Success "Root dependencies installed"
}

# Frontend dependencies
$fePackage = Join-Path $ROOT_DIR "frontend\package.json"
if (Test-Path $fePackage) {
    Write-Step 2 "Installing frontend dependencies..."
    Push-Location (Join-Path $ROOT_DIR "frontend")
    npm install
    Pop-Location
    Write-Success "Frontend dependencies installed"
}

# Backend dependencies
$bePackage = Join-Path $ROOT_DIR "backend\package.json"
if (Test-Path $bePackage) {
    Write-Step 3 "Installing backend dependencies..."
    Push-Location (Join-Path $ROOT_DIR "backend")
    npm install
    Pop-Location
    Write-Success "Backend dependencies installed"
}

# ==========================================
# Start Docker Services
# ==========================================
Write-Header "Starting Docker Services"

$dockerStarted = $false
$composeFile = Join-Path $ROOT_DIR "docker-compose.yml"

if (Test-Path $composeFile) {
    $null = docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Starting containers (this may take a few minutes on first run)..."

        Push-Location $ROOT_DIR
        try {
            docker compose up -d
        } catch {
            docker-compose up -d
        }
        Pop-Location

        Write-Success "Docker services started"

        # Wait for services
        Write-Info "Waiting for services to be healthy..."
        $attempts = 0
        $maxAttempts = 30

        while ($attempts -lt $maxAttempts) {
            try {
                $null = docker compose exec -T postgres pg_isready 2>$null
                if ($LASTEXITCODE -eq 0) { break }
            } catch {}
            $attempts++
            Start-Sleep -Seconds 2
        }

        if ($attempts -ge $maxAttempts) {
            Write-Warn "Services may not be fully ready yet"
        } else {
            Write-Success "All services are healthy"
        }

        $dockerStarted = $true
    } else {
        Write-Warn "Docker daemon not running - skipping container startup"
        Write-Info "Start Docker Desktop and run: docker-compose up -d"
    }
} else {
    Write-Warn "docker-compose.yml not found"
}

# ==========================================
# Run Database Migrations
# ==========================================
Write-Header "Setting Up Database"

$prismaSchema = Join-Path $ROOT_DIR "backend\prisma\schema.prisma"

if ($dockerStarted -and (Test-Path $prismaSchema)) {
    Write-Info "Waiting for database to be ready..."
    Start-Sleep -Seconds 5

    Push-Location (Join-Path $ROOT_DIR "backend")

    # Generate Prisma client
    Write-Info "Generating Prisma client..."
    try {
        npx prisma generate
        Write-Success "Prisma client generated"
    } catch {
        Write-Warn "Prisma generate failed"
    }

    # Run migrations
    Write-Info "Running database migrations..."
    try {
        npx prisma migrate deploy
        Write-Success "Database migrations applied"
    } catch {
        Write-Warn "Migration failed - run manually: cd backend && npx prisma migrate deploy"
    }

    Pop-Location
} else {
    Write-Warn "Skipping migrations (Docker not running or Prisma not found)"
}

# ==========================================
# Summary
# ==========================================
Write-Header "Setup Complete!"

Write-Host @"

Services are running at:

Application:
  Frontend:         http://localhost:3000
  Backend API:      http://localhost:3001
  API Docs:         http://localhost:3001/api/docs

Database & Cache:
  PostgreSQL:       localhost:5432
  Redis:            localhost:6379

Admin Tools:
  PgAdmin:          http://localhost:5050
  Redis Commander:  http://localhost:8081
  MinIO Console:    http://localhost:9001
  MailHog:          http://localhost:8025

"@

Write-Host "Default Credentials:" -ForegroundColor White
Write-Host @"

PostgreSQL:
  User:     careermate
  Password: careermate_dev_pass
  Database: careermate_dev

PgAdmin:
  Email:    admin@careermate.com
  Password: admin

Redis:
  Password: careermate_redis_pass

MinIO:
  User:     minioadmin
  Password: minioadmin

"@

Write-Host "Quick Start:" -ForegroundColor White
Write-Host ""
Write-Host "  npm run dev" -ForegroundColor Green -NoNewline; Write-Host "           # Start development servers"
Write-Host "  npm run docker:dev" -ForegroundColor Green -NoNewline; Write-Host "    # Start/restart Docker services"
Write-Host "  npm run db:studio" -ForegroundColor Green -NoNewline; Write-Host "     # Open Prisma Studio"
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor DarkGray
Write-Host ""
