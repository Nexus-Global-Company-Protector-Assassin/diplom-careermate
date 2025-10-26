# 🚀 DevOps Documentation - CareerMate

Все файлы для развертывания и эксплуатации CareerMate.

## 📁 Структура

\`\`\`
devops/
├── docker/                    # Docker конфигурации
│   ├── docker-compose.dev.yml    # Development окружение
│   ├── docker-compose.prod.yml   # Production окружение
│   ├── Dockerfile.frontend       # Frontend образ
│   ├── Dockerfile.backend        # Backend образ
│   ├── .dockerignore            # Docker ignore
│   └── nginx/                   # Nginx конфигурация
│       └── nginx.conf
│
├── k8s/                       # Kubernetes манифесты
│   └── deployment.yml         # K8s deployment конфигурация
│
├── terraform/                 # Infrastructure as Code (будущее)
│
├── scripts/                   # Deployment скрипты
│   ├── deploy.sh             # Скрипт развертывания
│   └── backup.sh             # Скрипт бэкапа БД
│
└── monitoring/                # Мониторинг конфигурации (будущее)
\`\`\`

---

## 🐳 Docker

### Development

Запуск для локальной разработки:

\`\`\`bash
# Из корня проекта
docker-compose -f devops/docker/docker-compose.dev.yml up -d

# С dev tools (PgAdmin, Redis Commander, etc.)
docker-compose -f devops/docker/docker-compose.dev.yml --profile dev up -d

# Просмотр логов
docker-compose -f devops/docker/docker-compose.dev.yml logs -f

# Остановка
docker-compose -f devops/docker/docker-compose.dev.yml down
\`\`\`

**Включает:**
- PostgreSQL 16
- Redis 7
- PgAdmin (опционально)
- Redis Commander (опционально)
- MinIO (опционально)
- MailHog (опционально)

### Production

Запуск production окружения:

\`\`\`bash
# Сборка образов
docker-compose -f devops/docker/docker-compose.prod.yml build

# Запуск с Nginx
docker-compose -f devops/docker/docker-compose.prod.yml --profile with-nginx up -d

# Проверка здоровья
docker-compose -f devops/docker/docker-compose.prod.yml ps

# Логи
docker-compose -f devops/docker/docker-compose.prod.yml logs -f backend
\`\`\`

**Включает:**
- Frontend (Next.js)
- Backend (NestJS)
- PostgreSQL
- Redis
- Nginx (опционально)

### Сборка отдельных образов

\`\`\`bash
# Frontend
docker build -f devops/docker/Dockerfile.frontend -t careermate-frontend:latest .

# Backend
docker build -f devops/docker/Dockerfile.backend -t careermate-backend:latest .
\`\`\`

---

## 📜 Deployment Scripts

### deploy.sh

Автоматический скрипт развертывания:

\`\`\`bash
# Staging
./devops/scripts/deploy.sh staging

# Production
./devops/scripts/deploy.sh production
\`\`\`

**Что делает:**
1. ✅ Pre-deployment проверки
2. 🏗️ Сборка Docker образов
3. 💾 Бэкап БД (только production)
4. 🛑 Остановка старых контейнеров
5. 🚀 Запуск новых контейнеров
6. ⏳ Health checks
7. 🗄️ Миграции БД
8. 🧹 Очистка старых образов

### backup.sh

Автоматический бэкап базы данных:

\`\`\`bash
# Запуск бэкапа
./devops/scripts/backup.sh
\`\`\`

**Что делает:**
- Создает dump PostgreSQL
- Сжимает в .gz
- Удаляет бэкапы старше 7 дней
- Выводит статистику

**Автоматизация через cron:**

\`\`\`bash
# Ежедневный бэкап в 2:00 AM
0 2 * * * /path/to/project/devops/scripts/backup.sh >> /var/log/careermate-backup.log 2>&1
\`\`\`

---

## ☸️ Kubernetes

### Создание секретов

\`\`\`bash
kubectl create secret generic careermate-secrets \\
  --from-literal=DATABASE_URL=postgresql://user:pass@host:5432/db \\
  --from-literal=REDIS_URL=redis://host:6379 \\
  --from-literal=JWT_SECRET=your-jwt-secret \\
  --from-literal=AI_MODEL_API_KEY=your-ai-key \\
  --from-literal=POSTGRES_USER=careermate \\
  --from-literal=POSTGRES_PASSWORD=secure-password \\
  --from-literal=NEXTAUTH_SECRET=your-nextauth-secret \\
  -n careermate
\`\`\`

### Развертывание

\`\`\`bash
# Применить манифесты
kubectl apply -f devops/k8s/deployment.yml

# Проверка статуса
kubectl get pods -n careermate
kubectl get services -n careermate

# Логи
kubectl logs -f deployment/backend -n careermate
kubectl logs -f deployment/frontend -n careermate

# Масштабирование
kubectl scale deployment backend --replicas=5 -n careermate
\`\`\`

### Обновление образов

\`\`\`bash
# Обновить backend
kubectl set image deployment/backend \\
  backend=ghcr.io/yourusername/careermate-backend:v1.2.0 \\
  -n careermate

# Обновить frontend
kubectl set image deployment/frontend \\
  frontend=ghcr.io/yourusername/careermate-frontend:v1.2.0 \\
  -n careermate

# Проверка rollout
kubectl rollout status deployment/backend -n careermate
\`\`\`

---

## 🔄 CI/CD

### GitHub Actions Workflows

**1. CI Pipeline (`.github/workflows/ci.yml`)**

Запускается на каждый push и PR:
- ✅ Lint & Type Check
- 🧪 Unit Tests (Frontend & Backend)
- 🎭 E2E Tests (Playwright)
- 🔒 Security Scan (Trivy)
- 🏗️ Build Docker Images

**2. Deploy Pipeline (`.github/workflows/deploy.yml`)**

Запускается на push в `main`:
- 🏗️ Build & Push Docker Images (GHCR)
- 🚀 Deploy Frontend (Vercel)
- 🚀 Deploy Backend (Railway/Fly.io)
- 🗄️ Run Migrations
- ✅ Smoke Tests
- 📢 Slack Notifications

### Необходимые Secrets

Настройте в GitHub Settings → Secrets:

\`\`\`
# Vercel
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID

# Railway (или Fly.io)
RAILWAY_TOKEN
# или
FLY_API_TOKEN

# Database
DATABASE_URL

# API Keys
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_POSTHOG_KEY
SENTRY_DSN

# Production URLs
PRODUCTION_FRONTEND_URL
PRODUCTION_API_URL

# Notifications (опционально)
SLACK_WEBHOOK
\`\`\`

---

## 🔧 Рекомендуемые платформы

### Development
- **Local**: Docker Compose
- **Staging**: Railway / Render

### Production (MVP)
- **Frontend**: Vercel
- **Backend**: Railway / Fly.io / Render
- **Database**: Neon / Supabase / Railway Postgres
- **Redis**: Upstash / Redis Cloud
- **Storage**: Cloudflare R2 / AWS S3

### Production (Scale)
- **Infrastructure**: AWS / GCP / Azure
- **Kubernetes**: EKS / GKE / AKS
- **CDN**: Cloudflare
- **Monitoring**: Datadog / New Relic

---

## 📊 Мониторинг

### Health Checks

**Backend:**
\`\`\`bash
curl http://localhost:3001/api/v1/health
\`\`\`

**Frontend:**
\`\`\`bash
curl http://localhost:3000
\`\`\`

### Docker Health Checks

Встроены в Dockerfiles:

- **Backend**: HTTP GET `/api/v1/health` каждые 30 секунд
- **PostgreSQL**: `pg_isready` каждые 10 секунд
- **Redis**: `redis-cli ping` каждые 10 секунд

### Kubernetes Probes

- **Liveness Probe**: Проверяет жизнеспособность контейнера
- **Readiness Probe**: Проверяет готовность принимать трафик

---

## 🔐 Безопасность

### SSL/TLS Сертификаты

**Let's Encrypt (рекомендуется):**

\`\`\`bash
# Установка Certbot
sudo apt-get install certbot

# Получение сертификата
sudo certbot certonly --standalone -d careermate.com -d www.careermate.com

# Копирование в nginx
sudo cp /etc/letsencrypt/live/careermate.com/fullchain.pem devops/docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/careermate.com/privkey.pem devops/docker/nginx/ssl/

# Автообновление
sudo certbot renew --dry-run
\`\`\`

### Environment Variables

**Никогда не коммитьте:**
- `.env`
- `.env.production`
- SSL ключи
- API keys

Используйте:
- `.env.example` для документации
- Secrets Manager (AWS/GCP/Azure)
- GitHub Secrets для CI/CD

---

## 🚨 Troubleshooting

### Docker Issues

**Контейнеры не запускаются:**
\`\`\`bash
# Проверка логов
docker-compose -f devops/docker/docker-compose.prod.yml logs

# Пересоздание
docker-compose -f devops/docker/docker-compose.prod.yml down -v
docker-compose -f devops/docker/docker-compose.prod.yml up -d --build
\`\`\`

**Нехватка памяти:**
\`\`\`bash
# Увеличить Docker memory limit (Docker Desktop)
# Или настроить resource limits в docker-compose.yml
\`\`\`

### Deployment Issues

**Миграции не применяются:**
\`\`\`bash
# Вручную запустить миграции
docker-compose -f devops/docker/docker-compose.prod.yml exec backend \\
  npx prisma migrate deploy
\`\`\`

**Health checks failing:**
\`\`\`bash
# Проверить логи
docker-compose -f devops/docker/docker-compose.prod.yml logs backend

# Проверить доступность
curl http://localhost:3001/api/v1/health
\`\`\`

---

## 📚 Дополнительные ресурсы

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Последнее обновление:** 2025-01-26

**Вопросы?** devops@careermate.com
