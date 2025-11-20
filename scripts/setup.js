#!/usr/bin/env node

/**
 * CareerMate Project Setup Script
 * This script initializes the project structure and creates necessary directories
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}\n`),
};

// Project root directory
const ROOT_DIR = path.resolve(__dirname, '..');

// Directory structure
const DIRECTORIES = {
  // Apps - Monorepo applications
  'apps': {},
  'apps/frontend': {},
  'apps/frontend/app': {},
  'apps/frontend/app/(auth)': {},
  'apps/frontend/app/(auth)/login': {},
  'apps/frontend/app/(auth)/register': {},
  'apps/frontend/app/(dashboard)': {},
  'apps/frontend/app/(dashboard)/dashboard': {},
  'apps/frontend/app/(dashboard)/profile': {},
  'apps/frontend/app/(dashboard)/resumes': {},
  'apps/frontend/app/(dashboard)/jobs': {},
  'apps/frontend/app/(dashboard)/applications': {},
  'apps/frontend/app/(dashboard)/interview-prep': {},
  'apps/frontend/app/api': {},
  'apps/frontend/components': {},
  'apps/frontend/components/features': {},
  'apps/frontend/components/layout': {},
  'apps/frontend/components/shared': {},
  'apps/frontend/components/ui': {},
  'apps/frontend/lib': {},
  'apps/frontend/hooks': {},
  'apps/frontend/services': {},
  'apps/frontend/styles': {},
  'apps/frontend/public': {},
  'apps/frontend/public/images': {},
  'apps/frontend/public/fonts': {},

  'apps/backend': {},
  'apps/backend/src': {},
  'apps/backend/src/modules': {},
  'apps/backend/src/modules/auth': {},
  'apps/backend/src/modules/users': {},
  'apps/backend/src/modules/profiles': {},
  'apps/backend/src/modules/resumes': {},
  'apps/backend/src/modules/jobs': {},
  'apps/backend/src/modules/applications': {},
  'apps/backend/src/modules/interviews': {},
  'apps/backend/src/modules/ai': {},
  'apps/backend/src/modules/notifications': {},
  'apps/backend/src/modules/analytics': {},
  'apps/backend/src/common': {},
  'apps/backend/src/common/decorators': {},
  'apps/backend/src/common/filters': {},
  'apps/backend/src/common/guards': {},
  'apps/backend/src/common/interceptors': {},
  'apps/backend/src/common/pipes': {},
  'apps/backend/src/config': {},
  'apps/backend/src/database': {},
  'apps/backend/test': {},
  'apps/backend/test/unit': {},
  'apps/backend/test/integration': {},
  'apps/backend/test/e2e': {},

  // Packages - Shared libraries
  'packages': {},
  'packages/types': {},
  'packages/types/src': {},
  'packages/ui': {},
  'packages/ui/src': {},
  'packages/utils': {},
  'packages/utils/src': {},
  'packages/config': {},
  'packages/config/src': {},

  // Prisma - Database
  'prisma': {},
  'prisma/migrations': {},
  'prisma/seeds': {},

  // DevOps
  'devops': {},
  'devops/docker': {},
  'devops/k8s': {},
  'devops/scripts': {},

  // Documentation
  'docs': {},
  'docs/api': {},
  'docs/architecture': {},
  'docs/guides': {},
  'docs/deployment': {},

  // Scripts
  'scripts': {},
  'scripts/migrations': {},
  'scripts/generators': {},

  // Legacy (for backward compatibility)
  'frontend': {},
  'frontend/src': {},
  'backend': {},
  'backend/src': {},

  // Uploads (development)
  'uploads': {},
  'uploads/resumes': {},
  'uploads/cover-letters': {},
  'uploads/temp': {},

  // Logs
  'logs': {},
  'logs/backend': {},
  'logs/frontend': {},
};

/**
 * Create a directory if it doesn't exist
 */
function createDirectory(dirPath) {
  const fullPath = path.join(ROOT_DIR, dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    log.success(`Created: ${dirPath}`);
    return true;
  }
  return false;
}

/**
 * Create a .gitkeep file in empty directories
 */
function createGitkeep(dirPath) {
  const fullPath = path.join(ROOT_DIR, dirPath, '.gitkeep');
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, '');
  }
}

/**
 * Copy environment file
 */
function setupEnvironment() {
  const envExample = path.join(ROOT_DIR, '.env.example');
  const envFile = path.join(ROOT_DIR, '.env');

  if (!fs.existsSync(envFile)) {
    fs.copyFileSync(envExample, envFile);
    log.success('Created .env file from .env.example');
    log.warning('Please update .env with your configuration');
  } else {
    log.info('.env file already exists');
  }
}

/**
 * Main setup function
 */
async function main() {
  log.header('🚀 CareerMate Project Setup');

  try {
    // Check Node version
    log.info('Checking Node.js version...');
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion < 18) {
      log.error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or higher.`);
      process.exit(1);
    }
    log.success(`Node.js ${nodeVersion} detected`);

    // Create directory structure
    log.header('📁 Creating Directory Structure');
    let createdCount = 0;

    Object.keys(DIRECTORIES).forEach((dir) => {
      if (createDirectory(dir)) {
        createGitkeep(dir);
        createdCount++;
      }
    });

    if (createdCount > 0) {
      log.success(`Created ${createdCount} directories`);
    } else {
      log.info('All directories already exist');
    }

    // Setup environment
    log.header('⚙️  Setting Up Environment');
    setupEnvironment();

    // Success message
    log.header('✅ Setup Complete!');
    console.log(`
${colors.bright}Next Steps:${colors.reset}

1. Configure your environment:
   ${colors.blue}Edit .env file with your API keys and configuration${colors.reset}

2. Start infrastructure services:
   ${colors.green}npm run docker:dev${colors.reset}

3. Install dependencies:
   ${colors.green}npm install${colors.reset}

4. Setup database:
   ${colors.green}npm run db:migrate${colors.reset}

5. Start development servers:
   ${colors.green}npm run dev${colors.reset}

${colors.yellow}Optional Development Tools:${colors.reset}
   - PgAdmin: http://localhost:5050
   - Redis Commander: http://localhost:8081
   - MinIO Console: http://localhost:9001
   - MailHog: http://localhost:8025

${colors.bright}For more information, see README.md${colors.reset}
`);

  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run setup
main();
