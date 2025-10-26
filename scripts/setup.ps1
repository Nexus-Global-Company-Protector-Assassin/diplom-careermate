# CareerMate Project Setup Script (PowerShell)
# This script initializes the project structure for Windows users

$ErrorActionPreference = "Stop"

# Colors
function Write-Info($message) {
    Write-Host "ℹ $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "✓ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠ $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "✗ $message" -ForegroundColor Red
}

function Write-Header($message) {
    Write-Host ""
    Write-Host $message -ForegroundColor White
    Write-Host ""
}

# Project root
$ROOT_DIR = Split-Path -Parent $PSScriptRoot

Write-Header "🚀 CareerMate Project Setup"

# Check Node.js version
Write-Info "Checking Node.js version..."
try {
    $nodeVersion = node --version
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')

    if ($majorVersion -lt 18) {
        Write-Error "Node.js version $nodeVersion is not supported. Please use Node.js 18 or higher."
        exit 1
    }
    Write-Success "Node.js $nodeVersion detected"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
}

# Create directory structure
Write-Header "📁 Creating Directory Structure"

$directories = @(
    # Frontend
    "frontend\src",
    "frontend\src\app",
    "frontend\src\app\(auth)\login",
    "frontend\src\app\(auth)\register",
    "frontend\src\app\(dashboard)\dashboard",
    "frontend\src\app\(dashboard)\profile",
    "frontend\src\app\(dashboard)\resumes",
    "frontend\src\app\(dashboard)\jobs",
    "frontend\src\app\(dashboard)\applications",
    "frontend\src\app\(dashboard)\interview-prep",
    "frontend\src\components\ui",
    "frontend\src\components\layout",
    "frontend\src\components\forms",
    "frontend\src\lib",
    "frontend\src\hooks",
    "frontend\src\services",
    "frontend\src\types",
    "frontend\src\utils",
    "frontend\src\styles",
    "frontend\public\images",
    "frontend\public\fonts",

    # Backend
    "backend\src\auth\strategies",
    "backend\src\auth\guards",
    "backend\src\auth\decorators",
    "backend\src\users\entities",
    "backend\src\users\dto",
    "backend\src\profiles\entities",
    "backend\src\profiles\dto",
    "backend\src\profiles\career-paths",
    "backend\src\profiles\skills-analysis",
    "backend\src\resumes\entities",
    "backend\src\resumes\dto",
    "backend\src\resumes\templates",
    "backend\src\resumes\generators",
    "backend\src\jobs\entities",
    "backend\src\jobs\dto",
    "backend\src\jobs\scrapers",
    "backend\src\jobs\matching",
    "backend\src\applications\entities",
    "backend\src\applications\dto",
    "backend\src\applications\auto-apply",
    "backend\src\applications\tracking",
    "backend\src\interviews\entities",
    "backend\src\interviews\dto",
    "backend\src\interviews\company-research",
    "backend\src\interviews\question-gen",
    "backend\src\ai\langchain",
    "backend\src\ai\embeddings",
    "backend\src\ai\providers",
    "backend\src\notifications\email",
    "backend\src\notifications\push",
    "backend\src\analytics\reports",
    "backend\src\common\decorators",
    "backend\src\common\filters",
    "backend\src\common\guards",
    "backend\src\common\interceptors",
    "backend\src\common\pipes",
    "backend\src\config",
    "backend\src\database",
    "backend\src\queues",
    "backend\src\workers",
    "backend\prisma\migrations",
    "backend\test",

    # Docs
    "docs\api",
    "docs\architecture",
    "docs\guides",
    "docs\deployment",

    # Scripts
    "scripts\migrations",

    # Shared
    "shared\types",
    "shared\utils",

    # Docker
    "docker",

    # Tests
    "tests\e2e",
    "tests\integration",
    "tests\load",

    # Uploads
    "uploads\resumes",
    "uploads\cover-letters",
    "uploads\temp",

    # Logs
    "logs"
)

$createdCount = 0

foreach ($dir in $directories) {
    $fullPath = Join-Path $ROOT_DIR $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        # Create .gitkeep
        New-Item -ItemType File -Path (Join-Path $fullPath ".gitkeep") -Force | Out-Null
        Write-Success "Created: $dir"
        $createdCount++
    }
}

if ($createdCount -gt 0) {
    Write-Success "Created $createdCount directories"
} else {
    Write-Info "All directories already exist"
}

# Setup environment
Write-Header "⚙️  Setting Up Environment"

$envExample = Join-Path $ROOT_DIR ".env.example"
$envFile = Join-Path $ROOT_DIR ".env"

if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Success "Created .env file from .env.example"
    Write-Warning "Please update .env with your configuration"
} else {
    Write-Info ".env file already exists"
}

# Success message
Write-Header "✅ Setup Complete!"

Write-Host @"

Next Steps:

1. Configure your environment:
   Edit .env file with your API keys and configuration

2. Start infrastructure services:
   docker-compose up -d

3. Install dependencies:
   npm run install:all

4. Setup database:
   npm run db:migrate

5. Start development servers:
   npm run dev

Optional Development Tools:
   - PgAdmin: http://localhost:5050
   - Redis Commander: http://localhost:8081
   - MinIO Console: http://localhost:9001
   - MailHog: http://localhost:8025

For more information, see README.md

"@ -ForegroundColor Cyan
