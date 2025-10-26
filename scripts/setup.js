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
  // Frontend directories
  'frontend/src': {},
  'frontend/src/app': {},
  'frontend/src/app/(auth)': {},
  'frontend/src/app/(auth)/login': {},
  'frontend/src/app/(auth)/register': {},
  'frontend/src/app/(dashboard)': {},
  'frontend/src/app/(dashboard)/dashboard': {},
  'frontend/src/app/(dashboard)/profile': {},
  'frontend/src/app/(dashboard)/resumes': {},
  'frontend/src/app/(dashboard)/jobs': {},
  'frontend/src/app/(dashboard)/applications': {},
  'frontend/src/app/(dashboard)/interview-prep': {},
  'frontend/src/components': {},
  'frontend/src/components/ui': {},
  'frontend/src/components/layout': {},
  'frontend/src/components/forms': {},
  'frontend/src/lib': {},
  'frontend/src/hooks': {},
  'frontend/src/services': {},
  'frontend/src/types': {},
  'frontend/src/utils': {},
  'frontend/src/styles': {},
  'frontend/public': {},
  'frontend/public/images': {},
  'frontend/public/fonts': {},

  // Backend directories
  'backend/src': {},
  'backend/src/auth': {},
  'backend/src/auth/strategies': {},
  'backend/src/auth/guards': {},
  'backend/src/auth/decorators': {},
  'backend/src/users': {},
  'backend/src/users/entities': {},
  'backend/src/users/dto': {},
  'backend/src/profiles': {},
  'backend/src/profiles/entities': {},
  'backend/src/profiles/dto': {},
  'backend/src/profiles/career-paths': {},
  'backend/src/profiles/skills-analysis': {},
  'backend/src/resumes': {},
  'backend/src/resumes/entities': {},
  'backend/src/resumes/dto': {},
  'backend/src/resumes/templates': {},
  'backend/src/resumes/generators': {},
  'backend/src/jobs': {},
  'backend/src/jobs/entities': {},
  'backend/src/jobs/dto': {},
  'backend/src/jobs/scrapers': {},
  'backend/src/jobs/matching': {},
  'backend/src/applications': {},
  'backend/src/applications/entities': {},
  'backend/src/applications/dto': {},
  'backend/src/applications/auto-apply': {},
  'backend/src/applications/tracking': {},
  'backend/src/interviews': {},
  'backend/src/interviews/entities': {},
  'backend/src/interviews/dto': {},
  'backend/src/interviews/company-research': {},
  'backend/src/interviews/question-gen': {},
  'backend/src/ai': {},
  'backend/src/ai/langchain': {},
  'backend/src/ai/embeddings': {},
  'backend/src/ai/providers': {},
  'backend/src/notifications': {},
  'backend/src/notifications/email': {},
  'backend/src/notifications/push': {},
  'backend/src/analytics': {},
  'backend/src/analytics/reports': {},
  'backend/src/common': {},
  'backend/src/common/decorators': {},
  'backend/src/common/filters': {},
  'backend/src/common/guards': {},
  'backend/src/common/interceptors': {},
  'backend/src/common/pipes': {},
  'backend/src/config': {},
  'backend/src/database': {},
  'backend/src/queues': {},
  'backend/src/workers': {},
  'backend/prisma': {},
  'backend/prisma/migrations': {},
  'backend/test': {},

  // Documentation
  'docs': {},
  'docs/api': {},
  'docs/architecture': {},
  'docs/guides': {},
  'docs/deployment': {},

  // Scripts
  'scripts': {},
  'scripts/migrations': {},

  // Shared
  'shared': {},
  'shared/types': {},
  'shared/utils': {},

  // Docker
  'docker': {},

  // Tests
  'tests': {},
  'tests/e2e': {},
  'tests/integration': {},
  'tests/load': {},

  // Uploads (development)
  'uploads': {},
  'uploads/resumes': {},
  'uploads/cover-letters': {},
  'uploads/temp': {},

  // Logs
  'logs': {},
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
   ${colors.green}docker-compose up -d${colors.reset}

3. Install dependencies:
   ${colors.green}npm run install:all${colors.reset}

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
