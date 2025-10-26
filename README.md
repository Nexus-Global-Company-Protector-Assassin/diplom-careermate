# 🚀 CareerMate - AI-Powered Job Search Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

> **AI-платформа для автоматизации поиска работы** с персонализированными рекомендациями, генерацией резюме и автоматическими откликами.

## 📋 Содержание

- [О проекте](#о-проекте)
- [Технологический стек](#технологический-стек)
- [Быстрый старт](#быстрый-старт)
- [Структура проекта](#структура-проекта)
- [Разработка](#разработка)
- [Тестирование](#тестирование)
- [Развертывание](#развертывание)
- [Документация](#документация)
- [Contributing](#contributing)
- [Лицензия](#лицензия)

---

## 🎯 О проекте

**CareerMate** — это комплексная AI-платформа, которая помогает соискателям:

- 📊 **Анализировать опыт и навыки** с помощью AI
- 📝 **Генерировать профессиональные резюме** под конкретные вакансии
- 🎯 **Получать персонализированные рекомендации** вакансий
- 🤖 **Автоматизировать отклики** на подходящие позиции
- 💼 **Готовиться к собеседованиям** с AI-ассистентом
- 📈 **Отслеживать прогресс** поиска работы

### Ключевые возможности

✅ AI-анализ профиля и карьерных путей
✅ Генерация резюме в PDF (множественные стили)
✅ Векторный поиск вакансий по семантике
✅ Автоматические/полуавтоматические отклики
✅ Подготовка к интервью и исследование компаний
✅ Еженедельные отчеты и аналитика

---

## 🛠 Технологический стек

### Frontend
- **Framework**: Next.js 14 (App Router, Server Components)
- **UI Library**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Auth**: NextAuth.js

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache & Queue**: Redis + BullMQ
- **Authentication**: JWT + Passport (OAuth2)
- **Validation**: class-validator + class-transformer

### AI & ML
- **LLM Orchestration**: LangChain
- **Vector Database**: Pinecone
- **Custom LLM**: [Your AI Model]
- **Embeddings**: Custom embeddings service

### Infrastructure
- **Container**: Docker + Docker Compose
- **Storage**: S3 / CloudFlare R2 / MinIO
- **Email**: SendGrid / AWS SES
- **Monitoring**: Sentry + PostHog
- **CI/CD**: GitHub Actions

### Development Tools
- **Linting**: ESLint + Prettier
- **Testing**: Jest + Playwright
- **API Docs**: Swagger/OpenAPI
- **Database UI**: PgAdmin, Prisma Studio
- **Cache UI**: Redis Commander

---

## 🚀 Быстрый старт

### Требования

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** >= 20.10.0
- **Docker Compose** >= 2.0.0

### Установка

#### 1. Клонируйте репозиторий

\`\`\`bash
git clone https://github.com/yourusername/careermate.git
cd careermate
\`\`\`

#### 2. Запустите скрипт установки

**Для Windows (PowerShell):**
\`\`\`powershell
.\scripts\setup.ps1
\`\`\`

**Для macOS/Linux:**
\`\`\`bash
chmod +x scripts/setup.sh
./scripts/setup.sh
\`\`\`

**Или используйте Node.js скрипт (кроссплатформенный):**
\`\`\`bash
npm run setup
\`\`\`

#### 3. Настройте переменные окружения

Отредактируйте файл \`.env\`:

\`\`\`bash
# Скопируйте .env.example в .env (уже сделано скриптом)
# Обновите значения API ключей и конфигурации
\`\`\`

#### 4. Запустите инфраструктуру

\`\`\`bash
# Запуск PostgreSQL, Redis, MinIO и других сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps
\`\`\`

#### 5. Установите зависимости

\`\`\`bash
# Установка зависимостей для всех пакетов
npm run install:all
\`\`\`

#### 6. Настройте базу данных

\`\`\`bash
# Выполнить миграции
npm run db:migrate

# (Опционально) Заполнить тестовыми данными
npm run db:seed
\`\`\`

#### 7. Запустите приложение

\`\`\`bash
# Запуск frontend + backend в режиме разработки
npm run dev
\`\`\`

Приложение будет доступно по адресам:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs

### Development Tools URLs

- **PgAdmin**: http://localhost:5050 (admin@careermate.com / admin)
- **Redis Commander**: http://localhost:8081
- **MinIO Console**: http://localhost:9001 (minioadmin / minioadmin)
- **MailHog**: http://localhost:8025 (Email testing)
- **Prisma Studio**: \`npm run db:studio\`

---

## 📁 Структура проекта

\`\`\`
careermate/
├── frontend/                 # Next.js приложение
│   ├── src/
│   │   ├── app/             # App Router страницы
│   │   │   ├── (auth)/      # Аутентификация
│   │   │   └── (dashboard)/ # Основное приложение
│   │   ├── components/      # React компоненты
│   │   ├── lib/             # Библиотеки и утилиты
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API сервисы
│   │   └── types/           # TypeScript типы
│   └── package.json
│
├── backend/                  # NestJS приложение
│   ├── src/
│   │   ├── auth/            # Модуль аутентификации
│   │   ├── users/           # Пользователи
│   │   ├── profiles/        # Профили и CV
│   │   ├── resumes/         # Генерация резюме
│   │   ├── jobs/            # Вакансии и поиск
│   │   ├── applications/    # Отклики
│   │   ├── interviews/      # Подготовка к интервью
│   │   ├── ai/              # AI сервисы (LangChain)
│   │   ├── notifications/   # Email, Push
│   │   ├── analytics/       # Аналитика
│   │   ├── workers/         # Background workers
│   │   └── common/          # Общие модули
│   ├── prisma/              # Prisma схема и миграции
│   └── package.json
│
├── docs/                     # Документация
│   ├── api/                 # API документация
│   ├── architecture/        # Архитектурные решения
│   ├── guides/              # Руководства
│   └── deployment/          # Развертывание
│
├── scripts/                  # Скрипты утилит
│   ├── setup.js             # Инициализация проекта
│   ├── setup.sh             # Bash скрипт
│   └── setup.ps1            # PowerShell скрипт
│
├── shared/                   # Общий код
│   ├── types/               # Shared TypeScript типы
│   └── utils/               # Shared утилиты
│
├── tests/                    # Тесты
│   ├── e2e/                 # End-to-end тесты
│   ├── integration/         # Интеграционные тесты
│   └── load/                # Нагрузочные тесты
│
├── docker/                   # Docker конфигурации
├── uploads/                  # Загрузки (dev)
├── logs/                     # Логи
│
├── docker-compose.yml        # Docker Compose
├── .env.example             # Пример переменных окружения
├── package.json             # Root package.json (workspaces)
└── README.md                # Этот файл
\`\`\`

---

## 💻 Разработка

### Доступные команды

#### Root уровень
\`\`\`bash
npm run dev              # Запуск frontend + backend
npm run build            # Сборка всех пакетов
npm run test             # Запуск всех тестов
npm run lint             # Линтинг кода
npm run format           # Форматирование кода
\`\`\`

#### Frontend
\`\`\`bash
npm run dev:frontend     # Только frontend
npm run build:frontend   # Сборка frontend
npm run test:frontend    # Тесты frontend
npm run test:e2e         # E2E тесты (Playwright)
\`\`\`

#### Backend
\`\`\`bash
npm run dev:backend      # Только backend
npm run build:backend    # Сборка backend
npm run test:backend     # Тесты backend
npm run db:migrate       # Миграции БД
npm run db:seed          # Заполнение БД
npm run db:studio        # Prisma Studio
\`\`\`

#### Docker
\`\`\`bash
npm run docker:up        # Запуск сервисов
npm run docker:down      # Остановка сервисов
npm run docker:logs      # Просмотр логов
\`\`\`

### Работа с базой данных

\`\`\`bash
# Создать миграцию
cd backend
npx prisma migrate dev --name your_migration_name

# Применить миграции в продакшене
npx prisma migrate deploy

# Сгенерировать Prisma Client
npx prisma generate

# Открыть Prisma Studio
npx prisma studio
\`\`\`

### Кодстайл

Проект использует ESLint и Prettier:

\`\`\`bash
# Проверка кода
npm run lint

# Автоматическое форматирование
npm run format
\`\`\`

---

## 🧪 Тестирование

### Unit тесты (Jest)

\`\`\`bash
# Все тесты
npm test

# Watch режим
npm run test:watch

# С покрытием
npm run test:cov
\`\`\`

### E2E тесты (Playwright)

\`\`\`bash
# Запуск E2E тестов
npm run test:e2e

# UI режим
npm run test:e2e:ui
\`\`\`

### Нагрузочные тесты (k6)

\`\`\`bash
cd tests/load
k6 run ai-generation.js
\`\`\`

---

## 🚢 Развертывание

### Production Build

\`\`\`bash
# Сборка всех пакетов
npm run build

# Запуск в продакшен режиме
cd frontend && npm start
cd backend && npm run start:prod
\`\`\`

### Docker Production

\`\`\`bash
# Сборка образов
docker-compose -f docker-compose.prod.yml build

# Запуск
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

### Рекомендуемые платформы

- **Frontend**: Vercel / Netlify
- **Backend**: Railway / Render / AWS ECS
- **Database**: Neon / Supabase / AWS RDS
- **Redis**: Upstash / Redis Cloud
- **Storage**: Cloudflare R2 / AWS S3

Подробнее см. [docs/deployment/](docs/deployment/)

---

## 📚 Документация

### Основные документы

- [Системный дизайн](docs/architecture/system-design.md)
- [API документация](docs/api/README.md)
- [База данных схема](docs/architecture/database-schema.md)
- [AI архитектура](docs/architecture/ai-architecture.md)
- [Гайды для разработчиков](docs/guides/)

### API Документация

API документация доступна через Swagger UI:

\`\`\`
http://localhost:3001/api/docs
\`\`\`

---

## 🤝 Contributing

Мы приветствуем вклад в проект! Пожалуйста, следуйте этим шагам:

1. Fork проекта
2. Создайте feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit изменения (\`git commit -m 'Add some AmazingFeature'\`)
4. Push в branch (\`git push origin feature/AmazingFeature\`)
5. Откройте Pull Request

### Правила коммитов

Используйте [Conventional Commits](https://www.conventionalcommits.org/):

\`\`\`
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
\`\`\`

---

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE)

---

## 👥 Команда

- **Ваше имя** - *Initial work* - [GitHub](https://github.com/yourusername)

---

## 🙏 Благодарности

- [Next.js](https://nextjs.org/)
- [NestJS](https://nestjs.com/)
- [LangChain](https://www.langchain.com/)
- [Prisma](https://www.prisma.io/)
- [shadcn/ui](https://ui.shadcn.com/)


**⭐ Если проект вам понравился, поставьте звезду!**
