# 🚀 Production Deployment Guide

Руководство по развертыванию CareerMate в production окружении.

## Рекомендуемая архитектура

### Для MVP (0-1000 пользователей)

\`\`\`
┌─────────────┐
│   Vercel    │ ← Frontend (Next.js)
└─────────────┘
       │
       ▼
┌─────────────┐
│   Railway   │ ← Backend (NestJS)
└─────────────┘
       │
   ┌───┴────┬────────┬──────────┐
   ▼        ▼        ▼          ▼
┌─────┐  ┌─────┐  ┌─────┐  ┌──────┐
│ Neon│  │Redis│  │  R2 │  │Pinecone│
│ DB  │  │Cloud│  │  S3 │  │ Vector │
└─────┘  └─────┘  └─────┘  └──────┘
\`\`\`

**Стоимость:** ~$200-400/месяц

### Для роста (1K-10K пользователей)

**Платформа:** AWS / GCP / Azure

**Компоненты:**
- Load Balancer (ALB)
- Auto-scaling группы (2-5 инстансов)
- Managed PostgreSQL (RDS)
- Managed Redis (ElastiCache)
- S3 + CloudFront
- Container Registry

**Стоимость:** ~$1,000-1,500/месяц

## Вариант 1: Vercel + Railway (Рекомендуется для MVP)

### 1.1 Frontend на Vercel

#### Подготовка

\`\`\`bash
cd frontend
npm run build
\`\`\`

#### Развертывание

1. Установите Vercel CLI:
\`\`\`bash
npm i -g vercel
\`\`\`

2. Авторизуйтесь:
\`\`\`bash
vercel login
\`\`\`

3. Деплой:
\`\`\`bash
cd frontend
vercel --prod
\`\`\`

#### Переменные окружения в Vercel

В Vercel Dashboard → Settings → Environment Variables:

\`\`\`env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api/v1
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
SENTRY_DSN=your-sentry-dsn
\`\`\`

#### Настройка домена

1. Vercel Dashboard → Domains
2. Добавьте свой домен (например, careermate.com)
3. Настройте DNS записи согласно инструкции

### 1.2 Backend на Railway

#### Подготовка

1. Создайте `Dockerfile` в backend/:

\`\`\`dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
\`\`\`

#### Развертывание

1. Зарегистрируйтесь на [Railway.app](https://railway.app)
2. Создайте новый проект → Deploy from GitHub
3. Выберите ваш репозиторий
4. Railway автоматически обнаружит Dockerfile

#### Переменные окружения в Railway

\`\`\`env
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}  # Railway предоставит автоматически
REDIS_URL=${REDIS_URL}
JWT_SECRET=your-production-jwt-secret
AI_MODEL_ENDPOINT=your-ai-endpoint
AI_MODEL_API_KEY=your-ai-key
PINECONE_API_KEY=your-pinecone-key
SENDGRID_API_KEY=your-sendgrid-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
SENTRY_DSN=your-sentry-dsn
\`\`\`

### 1.3 Настройка баз данных

#### PostgreSQL на Neon

1. Зарегистрируйтесь на [Neon.tech](https://neon.tech)
2. Создайте новый проект
3. Скопируйте Connection String
4. Добавьте в Railway как `DATABASE_URL`

#### Redis на Upstash

1. Зарегистрируйтесь на [Upstash](https://upstash.com)
2. Создайте Redis базу
3. Скопируйте URL
4. Добавьте в Railway как `REDIS_URL`

#### Pinecone

1. Зарегистрируйтесь на [Pinecone](https://www.pinecone.io/)
2. Создайте индекс (dimension: 1536)
3. Получите API ключ
4. Добавьте `PINECONE_API_KEY`

#### Storage (Cloudflare R2)

1. Cloudflare Dashboard → R2
2. Создайте bucket
3. Получите R2 credentials
4. Настройте в переменных окружения

## Вариант 2: AWS Full Stack

### 2.1 Архитектура AWS

\`\`\`
┌──────────────┐
│ CloudFront   │ ← CDN + SSL
└──────────────┘
       │
┌──────┴──────┐
│     ALB     │ ← Load Balancer
└──────┬──────┘
       │
┌──────┴──────────┐
│  ECS Fargate    │ ← Containers
│  (Auto-scaling) │
└──────┬──────────┘
       │
   ┌───┴────┬─────────┬────────┐
   ▼        ▼         ▼        ▼
┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
│ RDS │  │Redis│  │  S3 │  │ SES │
└─────┘  └─────┘  └─────┘  └─────┘
\`\`\`

### 2.2 Terraform конфигурация

Создайте `infrastructure/terraform/`:

\`\`\`hcl
# main.tf
provider "aws" {
  region = "us-east-1"
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "careermate-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier        = "careermate-db"
  engine            = "postgres"
  engine_version    = "16.1"
  instance_class    = "db.t3.medium"
  allocated_storage = 100

  db_name  = "careermate"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  skip_final_snapshot    = false
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "careermate-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "careermate-cluster"
}

# ... дополнительная конфигурация
\`\`\`

### 2.3 Развертывание через Terraform

\`\`\`bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
\`\`\`

## GitHub Actions CI/CD

Создайте `.github/workflows/deploy.yml`:

\`\`\`yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.ORG_ID }}
          vercel-project-id: \${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: \${{ secrets.FLY_API_TOKEN }}
\`\`\`

## Мониторинг в Production

### Sentry

\`\`\`typescript
// Frontend & Backend
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 1.0,
});
\`\`\`

### Datadog

\`\`\`yaml
# docker-compose.prod.yml
services:
  datadog-agent:
    image: gcr.io/datadoghq/agent:latest
    environment:
      - DD_API_KEY=\${DD_API_KEY}
      - DD_SITE=datadoghq.com
      - DD_LOGS_ENABLED=true
\`\`\`

## Безопасность в Production

### Обязательные настройки

✅ HTTPS только (SSL/TLS)
✅ Secure cookies (httpOnly, secure)
✅ CORS правильно настроен
✅ Rate limiting включен
✅ Helmet.js для безопасности headers
✅ Secrets в environment variables (не в коде!)
✅ Database credentials rotated
✅ Регулярные security audits

### Environment Variables Security

Используйте AWS Secrets Manager / HashiCorp Vault:

\`\`\`typescript
import { SecretsManager } from 'aws-sdk';

const secretsManager = new SecretsManager();
const secret = await secretsManager.getSecretValue({
  SecretId: 'careermate/production/db'
}).promise();
\`\`\`

## Performance Optimization

### CDN Setup

- Cloudflare / CloudFront перед всеми статическими ресурсами
- Edge caching для API (где возможно)
- Image optimization через CDN

### Database

- Connection pooling (PgBouncer)
- Read replicas для тяжелых запросов
- Индексы на часто используемых полях

### Caching

- Redis для session storage
- API response caching
- Database query caching

## Backup & Recovery

### Автоматические бэкапы

\`\`\`bash
# PostgreSQL автоматические бэкапы
# RDS: автоматически через AWS
# Self-hosted: cron job

0 2 * * * pg_dump -U careermate careermate > /backups/db_\$(date +\%Y\%m\%d).sql
\`\`\`

### Disaster Recovery Plan

1. **RPO** (Recovery Point Objective): < 1 час
2. **RTO** (Recovery Time Objective): < 4 часа
3. Регулярные тесты восстановления из бэкапов

## Checklist перед продакшеном

- [ ] Все секреты в environment variables
- [ ] HTTPS настроен и форсится
- [ ] Database миграции протестированы
- [ ] Monitoring и alerting настроены
- [ ] Backup strategy реализована
- [ ] Load testing пройден
- [ ] Security audit выполнен
- [ ] Документация обновлена
- [ ] Incident response plan готов
- [ ] Rollback strategy определена

## Post-deployment

### Мониторинг метрик

- Response time (p50, p95, p99)
- Error rate
- Throughput (requests/sec)
- Database connections
- Memory usage
- CPU usage

### Alerts

Настройте алерты на:
- Error rate > 1%
- Response time p95 > 1000ms
- CPU > 80%
- Memory > 90%
- Database connections > 80%

---

**Нужна помощь с deployment?** Свяжитесь с devops@careermate.com
