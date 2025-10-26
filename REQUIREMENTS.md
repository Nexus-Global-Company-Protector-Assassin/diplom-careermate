# 📋 CareerMate - Requirements & Dependencies

Полный список требований и зависимостей для проекта CareerMate.

## Системные требования

### Минимальные требования

- **OS**: Windows 10/11, macOS 10.15+, Ubuntu 20.04+
- **RAM**: 8 GB (рекомендуется 16 GB)
- **Disk**: 10 GB свободного места
- **CPU**: 2 cores (рекомендуется 4 cores)

### Программное обеспечение

| Компонент | Минимальная версия | Рекомендуемая версия |
|-----------|-------------------|---------------------|
| **Node.js** | 18.0.0 | 20.x LTS |
| **npm** | 9.0.0 | 10.x |
| **Docker** | 20.10.0 | 24.x |
| **Docker Compose** | 2.0.0 | 2.20.x |
| **Git** | 2.30.0 | Latest |

## Установка зависимостей

### Node.js & npm

#### Windows
Скачайте установщик с [nodejs.org](https://nodejs.org/)

#### macOS
\`\`\`bash
# Через Homebrew
brew install node@20
\`\`\`

#### Linux (Ubuntu/Debian)
\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
\`\`\`

### Docker

#### Windows / macOS
Скачайте Docker Desktop: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

#### Linux
\`\`\`bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
\`\`\`

## Зависимости проекта

### Root Dependencies

\`\`\`json
{
  "devDependencies": {
    "concurrently": "^8.2.2",
    "prettier": "^3.1.0",
    "turbo": "^1.11.0"
  }
}
\`\`\`

### Frontend Dependencies (Next.js)

#### Production Dependencies

\`\`\`json
{
  "next": "^14.0.4",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@tanstack/react-query": "^5.14.2",
  "axios": "^1.6.2",
  "zod": "^3.22.4",
  "react-hook-form": "^7.49.2",
  "tailwindcss": "^3.4.0",
  "@radix-ui/react-*": "Latest",
  "next-auth": "^4.24.5",
  "@sentry/nextjs": "^7.91.0"
}
\`\`\`

**Всего**: ~50 пакетов (см. `frontend/package.json`)

#### Development Dependencies

\`\`\`json
{
  "@types/node": "^20.10.6",
  "@types/react": "^18.2.46",
  "typescript": "^5.3.3",
  "eslint": "^8.56.0",
  "@playwright/test": "^1.40.1",
  "jest": "^29.7.0"
}
\`\`\`

### Backend Dependencies (NestJS)

#### Production Dependencies

\`\`\`json
{
  "@nestjs/common": "^10.3.0",
  "@nestjs/core": "^10.3.0",
  "@nestjs/config": "^3.1.1",
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "@prisma/client": "^5.8.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.1",
  "bull": "^4.12.0",
  "ioredis": "^5.3.2",
  "langchain": "^0.0.214",
  "@pinecone-database/pinecone": "^1.1.2",
  "axios": "^1.6.5",
  "puppeteer": "^21.7.0",
  "@sendgrid/mail": "^8.1.0",
  "aws-sdk": "^2.1524.0",
  "@sentry/node": "^7.91.0",
  "winston": "^3.11.0"
}
\`\`\`

**Всего**: ~60 пакетов (см. `backend/package.json`)

## Внешние сервисы (Production)

### Обязательные

| Сервис | Назначение | Стоимость | Альтернативы |
|--------|-----------|-----------|--------------|
| **PostgreSQL** | База данных | Free-$20/mo | Neon, Supabase, Railway |
| **Redis** | Cache & Queue | Free-$10/mo | Upstash, Redis Cloud |
| **AI Model** | LLM обработка | Varies | OpenAI, Anthropic, Custom |
| **Pinecone** | Vector DB | $70+/mo | Weaviate, Qdrant |
| **S3/R2** | File storage | $5+/mo | Cloudflare R2, AWS S3 |

### Рекомендуемые

| Сервис | Назначение | Стоимость |
|--------|-----------|-----------|
| **SendGrid** | Email | Free-$15/mo |
| **Sentry** | Error tracking | Free-$26/mo |
| **PostHog** | Analytics | Free-$25/mo |
| **Vercel** | Frontend hosting | Free-$20/mo |
| **Railway** | Backend hosting | $5-$50/mo |

### Опциональные

| Сервис | Назначение | Стоимость |
|--------|-----------|-----------|
| **Datadog** | Monitoring | $15+/host |
| **Cloudflare** | CDN + DDoS | Free-$20/mo |
| **GitHub Actions** | CI/CD | Free (2000 min) |

## API Ключи (нужны для production)

### Обязательные

- ✅ **AI_MODEL_API_KEY** - Ваша AI модель
- ✅ **PINECONE_API_KEY** - Pinecone векторная БД
- ✅ **DATABASE_URL** - PostgreSQL connection string
- ✅ **REDIS_URL** - Redis connection string
- ✅ **JWT_SECRET** - Secret для JWT токенов

### Рекомендуемые

- ⚠️ **SENDGRID_API_KEY** - Email сервис
- ⚠️ **AWS_ACCESS_KEY_ID** - S3 storage
- ⚠️ **AWS_SECRET_ACCESS_KEY** - S3 storage
- ⚠️ **SENTRY_DSN** - Error tracking

### Опциональные

- 🔵 **HH_API_KEY** - HeadHunter API (job parsing)
- 🔵 **LINKEDIN_CLIENT_ID** - LinkedIn OAuth
- 🔵 **GOOGLE_CLIENT_ID** - Google OAuth
- 🔵 **POSTHOG_KEY** - Analytics

## Размеры установки

### Локальная разработка

\`\`\`
node_modules (frontend):    ~500 MB
node_modules (backend):     ~400 MB
Docker images:              ~2 GB
PostgreSQL data:            ~100 MB
Total:                      ~3 GB
\`\`\`

### Production build

\`\`\`
Frontend build:    ~50 MB
Backend build:     ~100 MB
Docker image:      ~500 MB
\`\`\`

## Время установки

На средней машине (Intel i5, 16GB RAM, SSD):

| Этап | Время |
|------|-------|
| Клонирование репозитория | 10 сек |
| npm install (all) | 3-5 мин |
| Docker compose up | 2-3 мин |
| Database migrations | 30 сек |
| **Всего** | **~8-10 минут** |

## Сетевые порты

Убедитесь, что следующие порты свободны:

| Порт | Сервис | Обязательный |
|------|--------|--------------|
| **3000** | Frontend | ✅ Да |
| **3001** | Backend API | ✅ Да |
| **5432** | PostgreSQL | ✅ Да |
| **6379** | Redis | ✅ Да |
| **5050** | PgAdmin | ❌ Нет |
| **8081** | Redis Commander | ❌ Нет |
| **9000** | MinIO | ❌ Нет |
| **9001** | MinIO Console | ❌ Нет |
| **8025** | MailHog | ❌ Нет |

## Проверка системы

Запустите эту команду для проверки:

\`\`\`bash
node --version && npm --version && docker --version && docker-compose --version
\`\`\`

Ожидаемый вывод:
\`\`\`
v20.x.x
10.x.x
Docker version 24.x.x
Docker Compose version v2.x.x
\`\`\`

## Команды установки

### Полная установка с нуля

\`\`\`bash
# 1. Клонирование
git clone https://github.com/yourusername/careermate.git
cd careermate

# 2. Инициализация
npm run setup

# 3. Настройка .env
# Отредактируйте .env файл

# 4. Запуск инфраструктуры
docker-compose up -d

# 5. Установка зависимостей
npm run install:all

# 6. Миграции БД
npm run db:migrate

# 7. Запуск приложения
npm run dev
\`\`\`

## Troubleshooting

### Node.js версия устарела

\`\`\`bash
# Используйте nvm для управления версиями
nvm install 20
nvm use 20
\`\`\`

### Docker не запускается

- Windows: Убедитесь, что WSL 2 включен
- macOS: Увеличьте выделенную память в Docker Desktop
- Linux: Проверьте, что пользователь в группе docker

### Порты заняты

Измените порты в `.env`:

\`\`\`env
API_PORT=3002
POSTGRES_PORT=5433
\`\`\`

### Out of memory

Увеличьте Node.js memory limit:

\`\`\`bash
export NODE_OPTIONS="--max-old-space-size=4096"
\`\`\`

## Дополнительные инструменты (опционально)

### Рекомендуемые IDE

- **VS Code** (рекомендуется)
  - Extensions: ESLint, Prettier, Prisma, Tailwind CSS
- **WebStorm**
- **Cursor** (AI-assisted)

### Полезные CLI инструменты

\`\`\`bash
npm install -g @nestjs/cli       # NestJS CLI
npm install -g prisma            # Prisma CLI
npm install -g vercel            # Vercel CLI
\`\`\`

## Следующие шаги

После установки всех зависимостей:

1. Прочитайте [Quick Start Guide](docs/guides/quick-start.md)
2. Настройте [Environment Variables](.env.example)
3. Ознакомьтесь с [Architecture](docs/architecture/system-design.md)

---

**Последнее обновление:** 2025-01-26

Если у вас возникли проблемы с установкой, создайте [Issue](https://github.com/yourusername/careermate/issues) или напишите на dev@careermate.com
