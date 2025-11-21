#!/usr/bin/env node

/**
 * CareerMate Project Setup Script (Cross-platform)
 * Fully automated project setup with dependency checks
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  step: (num, msg) => console.log(`${colors.bright}[${num}]${colors.reset} ${msg}`),
};

const ROOT_DIR = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

/**
 * Execute command and return output
 */
function exec(cmd, options = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: options.cwd || ROOT_DIR,
      ...options
    });
  } catch (error) {
    if (options.ignoreError) return null;
    throw error;
  }
}

/**
 * Check if command exists
 */
function commandExists(cmd) {
  try {
    const checkCmd = isWindows ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get command version
 */
function getVersion(cmd, versionFlag = '--version') {
  try {
    const output = execSync(`${cmd} ${versionFlag}`, { encoding: 'utf8', stdio: 'pipe' });
    return output.trim().split('\n')[0];
  } catch {
    return null;
  }
}

/**
 * Check all required dependencies
 */
function checkDependencies() {
  log.header('🔍 Checking Dependencies');

  const deps = {
    node: { required: true, minVersion: 18 },
    npm: { required: true },
    docker: { required: true },
    'docker-compose': { required: false, alt: 'docker compose' },
  };

  let allGood = true;

  // Check Node.js
  if (commandExists('node')) {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    if (major >= deps.node.minVersion) {
      log.success(`Node.js ${version}`);
    } else {
      log.error(`Node.js ${version} - requires v${deps.node.minVersion}+`);
      allGood = false;
    }
  } else {
    log.error('Node.js not found');
    allGood = false;
  }

  // Check npm
  if (commandExists('npm')) {
    const version = getVersion('npm');
    log.success(`npm ${version}`);
  } else {
    log.error('npm not found');
    allGood = false;
  }

  // Check Docker
  if (commandExists('docker')) {
    const version = getVersion('docker', '-v');
    log.success(`Docker ${version}`);

    // Check if Docker daemon is running
    try {
      execSync('docker info', { stdio: 'pipe' });
      log.success('Docker daemon is running');
    } catch {
      log.warning('Docker daemon is not running - please start Docker Desktop');
    }
  } else {
    log.error('Docker not found - please install Docker Desktop');
    allGood = false;
  }

  // Check docker-compose
  const hasDockerCompose = commandExists('docker-compose');
  const hasDockerComposeV2 = (() => {
    try {
      execSync('docker compose version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  })();

  if (hasDockerCompose || hasDockerComposeV2) {
    log.success('Docker Compose available');
  } else {
    log.warning('Docker Compose not found - may be included with Docker Desktop');
  }

  return allGood;
}

/**
 * Setup environment files
 */
function setupEnvironment() {
  log.header('⚙️  Setting Up Environment');

  const envFiles = [
    { src: '.env.example', dest: '.env' },
    { src: 'frontend/.env.example', dest: 'frontend/.env.local', optional: true },
    { src: 'backend/.env.example', dest: 'backend/.env', optional: true },
  ];

  envFiles.forEach(({ src, dest, optional }) => {
    const srcPath = path.join(ROOT_DIR, src);
    const destPath = path.join(ROOT_DIR, dest);

    if (!fs.existsSync(srcPath)) {
      if (!optional) log.warning(`${src} not found`);
      return;
    }

    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
      log.success(`Created ${dest} from ${src}`);
    } else {
      log.info(`${dest} already exists`);
    }
  });
}

/**
 * Install dependencies
 */
function installDependencies() {
  log.header('📦 Installing Dependencies');

  // Root dependencies
  if (fs.existsSync(path.join(ROOT_DIR, 'package.json'))) {
    log.step(1, 'Installing root dependencies...');
    exec('npm install', { cwd: ROOT_DIR });
    log.success('Root dependencies installed');
  }

  // Frontend dependencies
  const frontendDir = path.join(ROOT_DIR, 'frontend');
  if (fs.existsSync(path.join(frontendDir, 'package.json'))) {
    log.step(2, 'Installing frontend dependencies...');
    exec('npm install', { cwd: frontendDir });
    log.success('Frontend dependencies installed');
  }

  // Backend dependencies
  const backendDir = path.join(ROOT_DIR, 'backend');
  if (fs.existsSync(path.join(backendDir, 'package.json'))) {
    log.step(3, 'Installing backend dependencies...');
    exec('npm install', { cwd: backendDir });
    log.success('Backend dependencies installed');
  }
}

/**
 * Start Docker services
 */
function startDockerServices() {
  log.header('🐳 Starting Docker Services');

  const composeFile = path.join(ROOT_DIR, 'docker-compose.yml');
  if (!fs.existsSync(composeFile)) {
    log.warning('docker-compose.yml not found, skipping...');
    return false;
  }

  try {
    // Check if Docker daemon is running
    execSync('docker info', { stdio: 'pipe' });
  } catch {
    log.warning('Docker daemon not running - skipping container startup');
    log.info('Start Docker Desktop and run: docker-compose up -d');
    return false;
  }

  log.info('Starting containers (this may take a few minutes on first run)...');

  // Try docker compose (v2) first, fallback to docker-compose
  try {
    exec('docker compose up -d', { cwd: ROOT_DIR });
  } catch {
    exec('docker-compose up -d', { cwd: ROOT_DIR });
  }

  log.success('Docker services started');

  // Wait for services to be healthy
  log.info('Waiting for services to be healthy...');
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    try {
      const result = execSync('docker compose ps --format json', {
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: ROOT_DIR
      });

      // Check if postgres is healthy
      if (result.includes('healthy') || result.includes('running')) {
        break;
      }
    } catch {
      // Fallback check
      try {
        execSync('docker compose exec -T postgres pg_isready', { stdio: 'pipe', cwd: ROOT_DIR });
        break;
      } catch {}
    }

    attempts++;
    execSync(isWindows ? 'timeout /t 2 /nobreak >nul' : 'sleep 2', { stdio: 'pipe' });
  }

  if (attempts >= maxAttempts) {
    log.warning('Services may not be fully ready yet');
  } else {
    log.success('All services are healthy');
  }

  return true;
}

/**
 * Run database migrations
 */
function runMigrations() {
  log.header('🗄️  Setting Up Database');

  const backendDir = path.join(ROOT_DIR, 'backend');
  const prismaSchema = path.join(backendDir, 'prisma', 'schema.prisma');

  if (!fs.existsSync(prismaSchema)) {
    log.warning('Prisma schema not found, skipping migrations...');
    return;
  }

  try {
    // Generate Prisma client
    log.info('Generating Prisma client...');
    exec('npx prisma generate', { cwd: backendDir });
    log.success('Prisma client generated');

    // Run migrations
    log.info('Running database migrations...');
    exec('npx prisma migrate deploy', { cwd: backendDir });
    log.success('Database migrations applied');
  } catch (error) {
    log.warning('Migration failed - database may not be ready yet');
    log.info('Run manually: cd backend && npx prisma migrate deploy');
  }
}

/**
 * Print summary
 */
function printSummary() {
  log.header('✅ Setup Complete!');

  console.log(`
${colors.bright}Services are running at:${colors.reset}

${colors.cyan}Application:${colors.reset}
  Frontend:         http://localhost:3000
  Backend API:      http://localhost:3001
  API Docs:         http://localhost:3001/api/docs

${colors.cyan}Database & Cache:${colors.reset}
  PostgreSQL:       localhost:5432
  Redis:            localhost:6379

${colors.cyan}Admin Tools:${colors.reset}
  PgAdmin:          http://localhost:5050
  Redis Commander:  http://localhost:8081
  MinIO Console:    http://localhost:9001
  MailHog:          http://localhost:8025

${colors.bright}Default Credentials:${colors.reset}

${colors.cyan}PostgreSQL:${colors.reset}
  User:     careermate
  Password: careermate_dev_pass
  Database: careermate_dev

${colors.cyan}PgAdmin:${colors.reset}
  Email:    admin@careermate.com
  Password: admin

${colors.cyan}Redis:${colors.reset}
  Password: careermate_redis_pass

${colors.cyan}MinIO:${colors.reset}
  User:     minioadmin
  Password: minioadmin

${colors.bright}Quick Start:${colors.reset}

  ${colors.green}npm run dev${colors.reset}           # Start development servers
  ${colors.green}npm run docker:dev${colors.reset}    # Start/restart Docker services
  ${colors.green}npm run db:studio${colors.reset}     # Open Prisma Studio

${colors.dim}For more information, see README.md${colors.reset}
`);
}

/**
 * Main setup function
 */
async function main() {
  console.log(`
${colors.bright}${colors.cyan}
   ____                          __  __       _
  / ___|__ _ _ __ ___  ___ _ __|  \\/  | __ _| |_ ___
 | |   / _\` | '__/ _ \\/ _ \\ '__| |\\/| |/ _\` | __/ _ \\
 | |__| (_| | | |  __/  __/ |  | |  | | (_| | ||  __/
  \\____\\__,_|_|  \\___|\\___|_|  |_|  |_|\\__,_|\\__\\___|

${colors.reset}${colors.dim}  Project Setup Script v1.0${colors.reset}
`);

  try {
    // Step 1: Check dependencies
    const depsOk = checkDependencies();
    if (!depsOk) {
      log.error('Please install missing dependencies and try again');
      process.exit(1);
    }

    // Step 2: Setup environment
    setupEnvironment();

    // Step 3: Install dependencies
    installDependencies();

    // Step 4: Start Docker services
    const dockerStarted = startDockerServices();

    // Step 5: Run migrations (only if Docker started successfully)
    if (dockerStarted) {
      // Give services a moment to fully initialize
      log.info('Waiting for database to be ready...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      runMigrations();
    }

    // Print summary
    printSummary();

  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run setup
main();
