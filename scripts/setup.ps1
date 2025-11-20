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

function Write-ErrorMsg($message) {
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
        Write-ErrorMsg "Node.js version $nodeVersion is not supported. Please use Node.js 18 or higher."
        exit 1
    }
    Write-Success "Node.js $nodeVersion detected"
} catch {
    Write-ErrorMsg "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
}

# Create directory structure
Write-Header "📁 Creating Directory Structure"

$directories = @(
    # Apps - Monorepo applications
    "apps",
    "apps\frontend",
    "apps\frontend\app",
    "apps\frontend\app\(auth)\login",
    "apps\frontend\app\(auth)\register",
    "apps\frontend\app\(dashboard)\dashboard",
    "apps\frontend\app\(dashboard)\profile",
    "apps\frontend\app\(dashboard)\resumes",
    "apps\frontend\app\(dashboard)\jobs",
    "apps\frontend\app\(dashboard)\applications",
    "apps\frontend\app\(dashboard)\interview-prep",
    "apps\frontend\app\api",
    "apps\frontend\components\features",
    "apps\frontend\components\layout",
    "apps\frontend\components\shared",
    "apps\frontend\components\ui",
    "apps\frontend\lib",
    "apps\frontend\hooks",
    "apps\frontend\services",
    "apps\frontend\styles",
    "apps\frontend\public\images",
    "apps\frontend\public\fonts",

    "apps\backend",
    "apps\backend\src",
    "apps\backend\src\modules",
    "apps\backend\src\modules\auth",
    "apps\backend\src\modules\users",
    "apps\backend\src\modules\profiles",
    "apps\backend\src\modules\resumes",
    "apps\backend\src\modules\jobs",
    "apps\backend\src\modules\applications",
    "apps\backend\src\modules\interviews",
    "apps\backend\src\modules\ai",
    "apps\backend\src\modules\notifications",
    "apps\backend\src\modules\analytics",
    "apps\backend\src\common\decorators",
    "apps\backend\src\common\filters",
    "apps\backend\src\common\guards",
    "apps\backend\src\common\interceptors",
    "apps\backend\src\common\pipes",
    "apps\backend\src\config",
    "apps\backend\src\database",
    "apps\backend\test\unit",
    "apps\backend\test\integration",
    "apps\backend\test\e2e",

    # Packages - Shared libraries
    "packages",
    "packages\types\src",
    "packages\ui\src",
    "packages\utils\src",
    "packages\config\src",

    # Prisma - Database
    "prisma",
    "prisma\migrations",
    "prisma\seeds",

    # DevOps
    "devops",
    "devops\docker",
    "devops\k8s",
    "devops\scripts",

    # Docs
    "docs\api",
    "docs\architecture",
    "docs\guides",
    "docs\deployment",

    # Scripts
    "scripts\migrations",
    "scripts\generators",

    # Legacy (for backward compatibility)
    "frontend\src",
    "backend\src",

    # Uploads
    "uploads\resumes",
    "uploads\cover-letters",
    "uploads\temp",

    # Logs
    "logs\backend",
    "logs\frontend"
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

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure your environment:" -ForegroundColor White
Write-Host "   Edit .env file with your API keys and configuration" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start infrastructure services:" -ForegroundColor White
Write-Host "   npm run docker:dev" -ForegroundColor Green
Write-Host ""
Write-Host "3. Install dependencies:" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor Green
Write-Host ""
Write-Host "4. Setup database:" -ForegroundColor White
Write-Host "   npm run db:migrate" -ForegroundColor Green
Write-Host ""
Write-Host "5. Start development servers:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "Optional Development Tools:" -ForegroundColor Yellow
Write-Host "   - PgAdmin: http://localhost:5050" -ForegroundColor Gray
Write-Host "   - Redis Commander: http://localhost:8081" -ForegroundColor Gray
Write-Host "   - MinIO Console: http://localhost:9001" -ForegroundColor Gray
Write-Host "   - MailHog: http://localhost:8025" -ForegroundColor Gray
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor Cyan
Write-Host ""
