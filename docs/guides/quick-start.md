# 🚀 Быстрый старт - CareerMate

Это руководство поможет вам быстро развернуть CareerMate локально для разработки.

## Предварительные требования

Убедитесь, что у вас установлено:

- ✅ **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- ✅ **npm** >= 9.0.0 (устанавливается с Node.js)
- ✅ **Docker** >= 20.10.0 ([Download](https://www.docker.com/))
- ✅ **Docker Compose** >= 2.0.0
- ✅ **Git** ([Download](https://git-scm.com/))

### Проверка версий

\`\`\`bash
node --version  # должно быть >= v18.0.0
npm --version   # должно быть >= 9.0.0
docker --version
docker-compose --version
\`\`\`

## Шаг 1: Клонирование репозитория

\`\`\`bash
git clone https://github.com/yourusername/careermate.git
cd careermate
\`\`\`

## Шаг 2: Инициализация проекта

Запустите скрипт установки для вашей ОС:

### Windows (PowerShell)

\`\`\`powershell
.\scripts\setup.ps1
\`\`\`

### macOS / Linux

\`\`\`bash
chmod +x scripts/setup.sh
./scripts/setup.sh
\`\`\`

### Кроссплатформенный (Node.js)

\`\`\`bash
npm run setup
\`\`\`

Скрипт создаст:
- Все необходимые директории
- Файл `.env` из `.env.example`
- Конфигурационные файлы

## Шаг 3: Настройка переменных окружения

Откройте `.env` файл и обновите основные переменные:

\`\`\`env
# База данных (можно оставить для разработки)
DATABASE_URL=postgresql://careermate:careermate_dev_pass@localhost:5432/careermate_dev

# JWT секреты (ОБЯЗАТЕЛЬНО измените!)
JWT_SECRET=your-super-secret-jwt-key-change-me
NEXTAUTH_SECRET=your-nextauth-secret-change-me

# AI модель (настройте свой AI endpoint)
AI_MODEL_ENDPOINT=https://your-ai-endpoint.com
AI_MODEL_API_KEY=your-ai-api-key

# Pinecone (для векторного поиска)
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=careermate-vectors
\`\`\`

⚠️ **Важно**: Для полной функциональности вам нужны:
- AI модель endpoint (или используйте OpenAI)
- Pinecone API ключ
- Email сервис (SendGrid или SMTP)

Для разработки без AI можно использовать mock-режим (см. ниже).

## Шаг 4: Запуск инфраструктуры

Запустите PostgreSQL, Redis и другие сервисы через Docker:

\`\`\`bash
docker-compose up -d
\`\`\`

Проверка статуса:

\`\`\`bash
docker-compose ps
\`\`\`

Все сервисы должны быть в статусе `Up`.

## Шаг 5: Установка зависимостей

\`\`\`bash
npm run install:all
\`\`\`

Это установит зависимости для:
- Root проекта
- Frontend (Next.js)
- Backend (NestJS)

## Шаг 6: Настройка базы данных

### Применить миграции

\`\`\`bash
cd backend
npx prisma migrate dev
\`\`\`

### (Опционально) Заполнить тестовыми данными

\`\`\`bash
npx prisma db seed
\`\`\`

### Открыть Prisma Studio (GUI для БД)

\`\`\`bash
npx prisma studio
# Откроется на http://localhost:5555
\`\`\`

## Шаг 7: Запуск приложения

### Запуск всех сервисов одновременно

\`\`\`bash
npm run dev
\`\`\`

Это запустит:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### Или запустите отдельно

\`\`\`bash
# Terminal 1 - Frontend
npm run dev:frontend

# Terminal 2 - Backend
npm run dev:backend
\`\`\`

## Шаг 8: Проверка работы

### Frontend
Откройте браузер: http://localhost:3000

Вы должны увидеть landing page CareerMate.

### Backend API
Откройте: http://localhost:3001/api/v1/health

Ответ должен быть:
\`\`\`json
{
  "status": "ok",
  "timestamp": "2025-01-26T10:00:00.000Z"
}
\`\`\`

### Swagger API Docs
http://localhost:3001/api/docs

## Шаг 9: Создание тестового пользователя

### Через API

\`\`\`bash
curl -X POST http://localhost:3001/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "fullName": "Test User"
  }'
\`\`\`

### Через UI

1. Откройте http://localhost:3000/register
2. Заполните форму регистрации
3. Войдите в систему

## Дополнительные инструменты для разработки

После запуска `docker-compose up -d` доступны:

| Сервис | URL | Описание |
|--------|-----|----------|
| **PgAdmin** | http://localhost:5050 | GUI для PostgreSQL |
| **Redis Commander** | http://localhost:8081 | GUI для Redis |
| **MinIO Console** | http://localhost:9001 | S3-совместимое хранилище |
| **MailHog** | http://localhost:8025 | Email testing |

### Доступы

**PgAdmin:**
- Email: `admin@careermate.com`
- Password: `admin`

**MinIO:**
- Username: `minioadmin`
- Password: `minioadmin`

## Разработка без AI (Mock режим)

Если у вас нет доступа к AI модели, активируйте mock режим:

\`\`\`env
# В .env
FEATURE_AI_MOCK=true
\`\`\`

Это будет возвращать заранее подготовленные ответы вместо реальных AI запросов.

## Troubleshooting

### Порт уже занят

Если порт 3000, 3001, 5432 или другие уже используются:

\`\`\`env
# Измените в .env
API_PORT=3002
POSTGRES_PORT=5433
\`\`\`

### Docker контейнеры не запускаются

\`\`\`bash
# Остановите и удалите все
docker-compose down -v

# Запустите снова
docker-compose up -d
\`\`\`

### База данных не подключается

Проверьте логи:

\`\`\`bash
docker-compose logs postgres
\`\`\`

### Ошибки Prisma

Пересоздайте клиент:

\`\`\`bash
cd backend
npx prisma generate
\`\`\`

## Следующие шаги

После успешного запуска:

1. 📖 Изучите [Frontend Development Guide](frontend-development.md)
2. 🔧 Изучите [Backend Development Guide](backend-development.md)
3. 🤖 Изучите [AI Integration Guide](ai-integration.md)
4. 📊 Изучите [Database Schema](../architecture/database-schema.md)

## Полезные команды

\`\`\`bash
# Просмотр логов всех сервисов
npm run docker:logs

# Остановка всех сервисов
npm run docker:down

# Перезапуск backend
npm run dev:backend

# Очистка и пересборка
npm run clean && npm run build

# Запуск тестов
npm test
\`\`\`

## Помощь

Если у вас возникли проблемы:
- Проверьте [Troubleshooting Guide](troubleshooting.md)
- Создайте [Issue](https://github.com/yourusername/careermate/issues)
- Напишите на dev@careermate.com

Удачной разработки! 🚀
