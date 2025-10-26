# 🚀 DevOps Migration Guide

## Что изменилось?

Все DevOps файлы перенесены в папку `devops/` для лучшей организации проекта.

### Структура до:

\`\`\`
careermate/
├── docker-compose.yml        # ❌ В корне
├── Dockerfile.frontend       # ❌ В корне
├── Dockerfile.backend        # ❌ В корне
└── nginx.conf                # ❌ В корне
\`\`\`

### Структура после:

\`\`\`
careermate/
├── devops/
│   ├── docker/
│   │   ├── docker-compose.dev.yml     # ✅ Development
│   │   ├── docker-compose.prod.yml    # ✅ Production
│   │   ├── Dockerfile.frontend        # ✅ Frontend образ
│   │   ├── Dockerfile.backend         # ✅ Backend образ
│   │   ├── .dockerignore              # ✅ Docker ignore
│   │   └── nginx/
│   │       └── nginx.conf             # ✅ Nginx config
│   ├── k8s/
│   │   └── deployment.yml             # ✅ Kubernetes
│   ├── scripts/
│   │   ├── deploy.sh                  # ✅ Deployment
│   │   └── backup.sh                  # ✅ Backup
│   └── README.md                      # ✅ DevOps docs
└── docker-compose.yml                 # ℹ️ Symlink (обратная совместимость)
\`\`\`

---

## Как обновить команды

### Docker Compose

**Старые команды:**
\`\`\`bash
docker-compose up -d
docker-compose down
docker-compose logs -f
\`\`\`

**Новые команды:**
\`\`\`bash
# Вариант 1: Через npm scripts (рекомендуется)
npm run docker:dev          # Запуск development
npm run docker:dev:down     # Остановка
npm run docker:dev:logs     # Логи

# Вариант 2: Напрямую
docker-compose -f devops/docker/docker-compose.dev.yml up -d
docker-compose -f devops/docker/docker-compose.dev.yml down
docker-compose -f devops/docker/docker-compose.dev.yml logs -f

# Или для обратной совместимости (пока работает)
npm run docker:up
npm run docker:down
npm run docker:logs
\`\`\`

### Production

**Новые команды:**
\`\`\`bash
# Production docker-compose
npm run docker:prod:build   # Сборка образов
npm run docker:prod         # Запуск
npm run docker:prod:down    # Остановка

# Deployment скрипт
npm run deploy:staging
npm run deploy:production

# Backup
npm run backup:db
\`\`\`

### Docker Build

**Старые команды:**
\`\`\`bash
docker build -f Dockerfile.frontend -t frontend .
docker build -f Dockerfile.backend -t backend .
\`\`\`

**Новые команды:**
\`\`\`bash
docker build -f devops/docker/Dockerfile.frontend -t frontend .
docker build -f devops/docker/Dockerfile.backend -t backend .

# Или через docker-compose
docker-compose -f devops/docker/docker-compose.prod.yml build
\`\`\`

---

## Обновление CI/CD

### GitHub Actions

Обновлены workflows в `.github/workflows/`:

- ✅ `ci.yml` - CI Pipeline (lint, test, build)
- ✅ `deploy.yml` - Deployment Pipeline

**Что изменилось:**
- Пути к Dockerfile обновлены: `devops/docker/Dockerfile.*`
- Docker Compose файлы: `devops/docker/docker-compose.*.yml`

### Переменные окружения

Никаких изменений! `.env` остается в корне проекта.

---

## Обновление .gitignore

Добавлены новые правила:

\`\`\`gitignore
# Claude AI
.claude/

# Backups
backups/
*.sql
*.sql.gz

# Terraform
devops/terraform/.terraform/
devops/terraform/*.tfstate

# Kubernetes secrets
devops/k8s/*-secret.yml
devops/k8s/secrets/

# SSL Certificates
devops/docker/nginx/ssl/
*.crt
*.key
*.pem
\`\`\`

---

## Чек-лист миграции

Для существующих разработчиков:

- [ ] Обновить Git репозиторий: \`git pull\`
- [ ] Остановить старые контейнеры: \`docker-compose down\`
- [ ] Запустить новые: \`npm run docker:dev\`
- [ ] Обновить локальные скрипты/алиасы (если есть)
- [ ] Прочитать `devops/README.md`

---

## Преимущества новой структуры

✅ **Организация** - Все DevOps файлы в одном месте
✅ **Масштабируемость** - Легко добавлять Kubernetes, Terraform, и т.д.
✅ **Документация** - Отдельный README для DevOps
✅ **CI/CD** - Четкое разделение dev и prod конфигураций
✅ **Безопасность** - Secrets и SSL в .gitignore

---

## Дополнительные ресурсы

- [DevOps README](devops/README.md) - Полная документация
- [Docker Compose Dev](devops/docker/docker-compose.dev.yml) - Development конфигурация
- [Docker Compose Prod](devops/docker/docker-compose.prod.yml) - Production конфигурация
- [Deployment Guide](docs/deployment/production.md) - Production deployment

---

## Поддержка

Вопросы? Создайте [Issue](https://github.com/yourusername/careermate/issues) с тегом `devops`

**Дата миграции:** 2025-01-26
