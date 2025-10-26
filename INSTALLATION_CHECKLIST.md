# ✅ Installation Checklist - CareerMate

Используйте этот чеклист для пошаговой установки проекта.

## ☐ Pre-requisites Check

### Software Installation

- [ ] **Node.js 18+** установлен
  \`\`\`bash
  node --version  # Должно быть >= v18.0.0
  \`\`\`

- [ ] **npm 9+** установлен
  \`\`\`bash
  npm --version   # Должно быть >= 9.0.0
  \`\`\`

- [ ] **Docker** установлен и запущен
  \`\`\`bash
  docker --version
  docker ps       # Должно работать без ошибок
  \`\`\`

- [ ] **Docker Compose** установлен
  \`\`\`bash
  docker-compose --version
  \`\`\`

- [ ] **Git** установлен
  \`\`\`bash
  git --version
  \`\`\`

### System Requirements

- [ ] Минимум 8 GB RAM (рекомендуется 16 GB)
- [ ] 10 GB свободного места на диске
- [ ] Стабильное интернет-соединение

---

## ☐ Step 1: Project Initialization

- [ ] Склонирован репозиторий (если еще не сделано)
  \`\`\`bash
  git clone https://github.com/yourusername/careermate.git
  cd careermate
  \`\`\`

- [ ] Запущен скрипт инициализации:

  **Windows (PowerShell):**
  \`\`\`powershell
  .\scripts\setup.ps1
  \`\`\`

  **macOS/Linux:**
  \`\`\`bash
  chmod +x scripts/setup.sh
  ./scripts/setup.sh
  \`\`\`

  **Или Node.js:**
  \`\`\`bash
  npm run setup
  \`\`\`

- [ ] Создан файл `.env` (скопирован из `.env.example`)

---

## ☐ Step 2: Environment Variables

Откройте `.env` и заполните следующие переменные:

### Обязательные

- [ ] `JWT_SECRET` - Ваш секретный ключ для JWT
  \`\`\`env
  JWT_SECRET=ваш-длинный-случайный-секрет-минимум-32-символа
  \`\`\`

- [ ] `NEXTAUTH_SECRET` - Секрет для NextAuth
  \`\`\`env
  NEXTAUTH_SECRET=другой-длинный-случайный-секрет
  \`\`\`

- [ ] `DATABASE_URL` - URL PostgreSQL (может быть по умолчанию для dev)
  \`\`\`env
  DATABASE_URL=postgresql://careermate:careermate_dev_pass@localhost:5432/careermate_dev
  \`\`\`

- [ ] `REDIS_URL` - URL Redis (может быть по умолчанию для dev)
  \`\`\`env
  REDIS_URL=redis://:careermate_redis_pass@localhost:6379
  \`\`\`

### AI & ML (Важно!)

- [ ] **Вариант 1: Свой AI Model**
  \`\`\`env
  AI_MODEL_ENDPOINT=https://your-ai-endpoint.com
  AI_MODEL_API_KEY=your-api-key
  \`\`\`

- [ ] **ИЛИ Вариант 2: OpenAI**
  \`\`\`env
  OPENAI_API_KEY=sk-your-openai-key
  \`\`\`

- [ ] **Pinecone (Vector DB)**
  \`\`\`env
  PINECONE_API_KEY=your-pinecone-api-key
  PINECONE_ENVIRONMENT=us-west1-gcp
  PINECONE_INDEX_NAME=careermate-vectors
  \`\`\`

  > Зарегистрируйтесь на [pinecone.io](https://www.pinecone.io/) для получения бесплатного API ключа

### Опциональные (для production)

- [ ] `SENDGRID_API_KEY` - Email сервис
- [ ] `AWS_ACCESS_KEY_ID` и `AWS_SECRET_ACCESS_KEY` - S3 storage
- [ ] `SENTRY_DSN` - Error tracking
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` - Analytics

### Для разработки без AI

Если у вас нет доступа к AI API, активируйте mock режим:

- [ ] `FEATURE_AI_MOCK=true`

---

## ☐ Step 3: Infrastructure (Docker)

- [ ] Запущены Docker сервисы:
  \`\`\`bash
  docker-compose up -d
  \`\`\`

- [ ] Проверен статус сервисов:
  \`\`\`bash
  docker-compose ps
  \`\`\`

  Все сервисы должны быть в статусе "Up":
  - ✅ careermate-postgres
  - ✅ careermate-redis
  - ✅ careermate-pgadmin (если используете --profile dev)
  - ✅ careermate-redis-commander (если используете --profile dev)

- [ ] Проверены логи (нет критических ошибок):
  \`\`\`bash
  docker-compose logs
  \`\`\`

### Доступ к Dev Tools (опционально)

- [ ] **PgAdmin**: http://localhost:5050
  - Email: `admin@careermate.com`
  - Password: `admin`

- [ ] **Redis Commander**: http://localhost:8081

- [ ] **MinIO Console**: http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin`

- [ ] **MailHog**: http://localhost:8025

---

## ☐ Step 4: Dependencies Installation

- [ ] Установлены зависимости для всех пакетов:
  \`\`\`bash
  npm run install:all
  \`\`\`

  Это займет ~3-5 минут и установит:
  - Root dependencies
  - Frontend dependencies (~50 пакетов)
  - Backend dependencies (~60 пакетов)

- [ ] Проверка успешной установки:
  \`\`\`bash
  ls frontend/node_modules
  ls backend/node_modules
  \`\`\`

---

## ☐ Step 5: Database Setup

- [ ] Переход в backend директорию:
  \`\`\`bash
  cd backend
  \`\`\`

- [ ] Создание Prisma Client:
  \`\`\`bash
  npx prisma generate
  \`\`\`

- [ ] Применение миграций:
  \`\`\`bash
  npx prisma migrate dev --name init
  \`\`\`

- [ ] (Опционально) Заполнение тестовыми данными:
  \`\`\`bash
  npx prisma db seed
  \`\`\`

- [ ] Открытие Prisma Studio для проверки:
  \`\`\`bash
  npx prisma studio
  \`\`\`
  Откроется на http://localhost:5555

---

## ☐ Step 6: First Run

- [ ] Возврат в root директорию:
  \`\`\`bash
  cd ..
  \`\`\`

- [ ] Запуск development серверов:
  \`\`\`bash
  npm run dev
  \`\`\`

- [ ] Проверка Frontend (http://localhost:3000)
  - [ ] Страница загружается без ошибок
  - [ ] Нет ошибок в консоли браузера

- [ ] Проверка Backend API (http://localhost:3001/api/v1/health)
  - [ ] Возвращает JSON ответ: `{"status": "ok"}`

- [ ] Проверка API Documentation (http://localhost:3001/api/docs)
  - [ ] Swagger UI открывается

---

## ☐ Step 7: Create Test User

### Через API

- [ ] Создан тестовый пользователь через Swagger UI или curl:
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

- [ ] Открыт http://localhost:3000/register
- [ ] Заполнена форма регистрации
- [ ] Успешный вход в систему

---

## ☐ Step 8: Verification

### Frontend Checklist

- [ ] Landing page открывается
- [ ] Login/Register работают
- [ ] Dashboard доступен после логина
- [ ] Нет ошибок в DevTools Console

### Backend Checklist

- [ ] Health endpoint работает
- [ ] API docs доступны
- [ ] Auth endpoints работают
- [ ] Database подключена

### Infrastructure Checklist

- [ ] PostgreSQL работает
- [ ] Redis работает
- [ ] Нет ошибок в Docker logs

---

## ☐ Optional: Additional Setup

### VSCode Extensions (рекомендуется)

- [ ] ESLint
- [ ] Prettier
- [ ] Prisma
- [ ] Tailwind CSS IntelliSense
- [ ] GitLens

### Git Hooks (pre-commit)

- [ ] Установлен Husky:
  \`\`\`bash
  npm install -D husky
  npx husky install
  \`\`\`

### Environment для других разработчиков

- [ ] Создан `.env.team` (без секретов) для шаринга с командой
- [ ] Обновлен `.env.example` с актуальными переменными

---

## ☐ Troubleshooting

Если что-то не работает:

### Порты заняты

- [ ] Проверены используемые порты:
  \`\`\`bash
  # Windows
  netstat -ano | findstr :3000
  netstat -ano | findstr :3001

  # macOS/Linux
  lsof -i :3000
  lsof -i :3001
  \`\`\`

- [ ] Изменены порты в `.env` если нужно:
  \`\`\`env
  API_PORT=3002
  POSTGRES_PORT=5433
  \`\`\`

### Docker не работает

- [ ] Docker Desktop запущен
- [ ] Перезапущены контейнеры:
  \`\`\`bash
  docker-compose down -v
  docker-compose up -d
  \`\`\`

### Ошибки установки зависимостей

- [ ] Очищен npm cache:
  \`\`\`bash
  npm cache clean --force
  rm -rf node_modules package-lock.json
  npm install
  \`\`\`

### База данных не подключается

- [ ] Проверены логи PostgreSQL:
  \`\`\`bash
  docker-compose logs postgres
  \`\`\`

- [ ] Проверен `DATABASE_URL` в `.env`

### Prisma ошибки

- [ ] Пересоздан Prisma Client:
  \`\`\`bash
  cd backend
  rm -rf node_modules/.prisma
  npx prisma generate
  \`\`\`

---

## ✅ Installation Complete!

Если все пункты выполнены, поздравляем! 🎉

Ваша установка CareerMate завершена.

### Следующие шаги:

1. 📖 Прочитайте [Quick Start Guide](docs/guides/quick-start.md)
2. 🏗️ Изучите [System Design](docs/architecture/system-design.md)
3. 💻 Начните разработку!

### Полезные команды:

\`\`\`bash
npm run dev              # Запуск в dev режиме
npm run build            # Сборка проекта
npm test                 # Запуск тестов
npm run lint             # Проверка кода
npm run format           # Форматирование кода
npm run docker:up        # Запуск Docker сервисов
npm run docker:down      # Остановка Docker сервисов
npm run db:studio        # Открыть Prisma Studio
\`\`\`

---

**Дата:** 2025-01-26

**Вопросы?**
- Прочитайте [Troubleshooting Guide](docs/guides/troubleshooting.md)
- Создайте [Issue](https://github.com/yourusername/careermate/issues)
- Напишите на dev@careermate.com

**Happy Coding! 🚀**
