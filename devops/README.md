# DevOps — CareerMate

Все файлы для деплоя и эксплуатации CareerMate.

## Архитектура деплоя

```
VPS (Ubuntu 22.04)
┌──────────────────────────┐
│  nginx :80               │
│   /        → frontend:3000│
│   /api/*   → backend:3001 │
│   /auth/*  → backend:3001 │
│   /ai/*    → agent:3002   │
│                           │
│  frontend  :3000 (Next.js)│
│  backend   :3001 (NestJS) │
│  agent     :3002 (NestJS) │
│  postgres  :5432          │
│  redis     :6379          │
└──────────────────────────┘

Внешние сервисы (cloud):
  Neo4j AuraDB  — Knowledge Graph
  Qdrant Cloud  — векторный поиск
  Resend        — email
```

---

## Первый деплой на VPS

### Шаг 1 — Подготовить сервер

Подключись по SSH и запусти скрипт настройки:

```bash
ssh root@ВАШ_IP
curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/careermate/main/devops/scripts/setup-vps.sh | bash
```

Или скопируй репозиторий и запусти локально:

```bash
git clone https://github.com/YOUR_ORG/careermate.git
bash devops/scripts/setup-vps.sh
```

Скрипт установит Docker, создаст `/opt/careermate/`, откроет порты 22/80/443.

### Шаг 2 — Заполнить .env.production на сервере

```bash
nano /opt/careermate/.env.production
```

Используй `.env.production.example` из репозитория как шаблон. Обязательные поля:

| Переменная | Где взять |
|---|---|
| `POSTGRES_PASSWORD` | придумай сильный пароль |
| `REDIS_PASSWORD` | придумай сильный пароль |
| `DATABASE_URL` | собери из postgres-переменных выше |
| `REDIS_URL` | `redis://:REDIS_PASSWORD@redis:6379` |
| `JWT_SECRET` | `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 64` |
| `GOOGLE_CLIENT_ID/SECRET` | Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `http://ВАШ_IP/auth/google/callback` |
| `FRONTEND_URL` | твой Vercel URL (напр. `https://careermate.vercel.app`) |
| `CORS_ORIGIN` | то же, что `FRONTEND_URL` |
| `RESEND_API_KEY` | resend.com |
| `LLM_API_KEY` | polza.ai |
| `QDRANT_URL` | cloud.qdrant.io |
| `QDRANT_API_KEY` | cloud.qdrant.io |
| `NEO4J_URI` | console.neo4j.io |
| `NEO4J_USER` / `NEO4J_PASSWORD` | console.neo4j.io |

> **Важно:** `GOOGLE_CALLBACK_URL` должен быть добавлен в Google Cloud Console →
> APIs & Services → Credentials → OAuth 2.0 Client → Authorized redirect URIs.

### Шаг 3 — Настроить GitHub Secrets

GitHub → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Значение | Пример |
|---|---|---|
| `SSH_HOST` | IP-адрес VPS | `185.123.45.67` |
| `SSH_USER` | пользователь SSH | `root` |
| `SSH_PRIVATE_KEY` | содержимое `/root/.ssh/id_ed25519` с VPS | `-----BEGIN OPENSSH...` |
| `DATABASE_URL` | строка подключения к prod БД (для миграций) | `postgresql://careermate:pass@postgres:5432/careermate_prod` |
| `PRODUCTION_API_URL` | URL VPS | `http://185.123.45.67` |
| `PRODUCTION_AGENT_URL` | URL VPS (тот же) | `http://185.123.45.67` |
| `SLACK_WEBHOOK` | опционально, для уведомлений | — |

> `NEXT_PUBLIC_API_URL` и `NEXT_PUBLIC_AGENT_URL` передаются автоматически из `PRODUCTION_API_URL` и `PRODUCTION_AGENT_URL` при сборке Docker-образа фронтенда.

### Шаг 4 — Задеплоить

```bash
git push origin main
```

GitHub Actions запустит CI → build Docker images → deploy Vercel → migrate DB → deploy VPS.

**Или вручную с VPS:**

```bash
cd /opt/careermate
bash devops/scripts/deploy.sh production
```

---

## Ручное управление на VPS

```bash
cd /opt/careermate

# Статус контейнеров
docker compose -f devops/docker/docker-compose.prod.yml ps

# Логи
docker compose -f devops/docker/docker-compose.prod.yml logs -f backend
docker compose -f devops/docker/docker-compose.prod.yml logs -f agent
docker compose -f devops/docker/docker-compose.prod.yml logs -f nginx

# Перезапустить один сервис
docker compose -f devops/docker/docker-compose.prod.yml restart backend

# Остановить всё
docker compose -f devops/docker/docker-compose.prod.yml down
```

---

## Health checks

```bash
# Backend
curl http://ВАШ_IP/api/v1/health

# Agent
curl http://ВАШ_IP/ai/health

# Nginx
curl http://ВАШ_IP/health
```

---

## Подключение домена и SSL (после получения домена)

1. Укажи A-запись домена на IP VPS
2. Установи Certbot и получи сертификат:
   ```bash
   apt-get install -y certbot
   certbot certonly --standalone -d yourdomain.com
   ```
3. Обнови `nginx.conf` — раскомментируй HTTPS-блок и добавь пути к сертификатам
4. Обнови `GOOGLE_CALLBACK_URL` → `https://yourdomain.com/auth/google/callback`
5. Обнови `FRONTEND_URL`, `CORS_ORIGIN` в `.env.production`
6. Обнови `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_AGENT_URL` в Vercel

---

## Бэкап БД

```bash
bash devops/scripts/backup.sh
```

Автоматический бэкап через cron (добавить через `crontab -e`):

```
0 2 * * * cd /opt/careermate && bash devops/scripts/backup.sh >> /var/log/careermate-backup.log 2>&1
```
