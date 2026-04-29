#!/bin/bash
# CareerMate — первичная настройка VPS
# Запускать один раз на чистом сервере Ubuntu 22.04 / Debian 12
# Использование: bash setup-vps.sh

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()      { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 1. Обновление системы ────────────────────────────────────
info "Обновляем пакеты..."
apt-get update -qq && apt-get upgrade -y -qq
ok "Система обновлена"

# ── 2. Установка Docker ──────────────────────────────────────
if command -v docker &>/dev/null; then
    ok "Docker уже установлен: $(docker --version)"
else
    info "Устанавливаем Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    ok "Docker установлен: $(docker --version)"
fi

# ── 3. Проверка Docker Compose плагина ──────────────────────
if docker compose version &>/dev/null; then
    ok "Docker Compose: $(docker compose version)"
else
    info "Устанавливаем Docker Compose плагин..."
    apt-get install -y docker-compose-plugin
    ok "Docker Compose установлен"
fi

# ── 4. Создание директорий проекта ──────────────────────────
info "Создаём /opt/careermate..."
mkdir -p /opt/careermate/devops/docker/nginx
mkdir -p /opt/careermate/devops/scripts
mkdir -p /opt/careermate/backups
ok "Директории созданы"

# ── 5. Настройка UFW (firewall) ──────────────────────────────
if command -v ufw &>/dev/null; then
    info "Настраиваем UFW firewall..."
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS (для будущего SSL)
    ufw --force enable
    ok "UFW настроен (22, 80, 443 открыты)"
else
    warn "UFW не установлен — пропускаем настройку firewall"
fi

# ── 6. Копирование конфигов из репозитория ──────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

if [[ -f "$REPO_ROOT/devops/docker/docker-compose.prod.yml" ]]; then
    cp "$REPO_ROOT/devops/docker/docker-compose.prod.yml" /opt/careermate/devops/docker/
    cp "$REPO_ROOT/devops/docker/nginx/nginx.conf"        /opt/careermate/devops/docker/nginx/
    ok "Конфиги скопированы в /opt/careermate/devops/"
else
    warn "Конфиги не найдены рядом со скриптом — скопируй вручную:"
    warn "  devops/docker/docker-compose.prod.yml → /opt/careermate/devops/docker/"
    warn "  devops/docker/nginx/nginx.conf        → /opt/careermate/devops/docker/nginx/"
fi

# ── 7. Создание .env.production ─────────────────────────────
if [[ -f /opt/careermate/.env.production ]]; then
    warn ".env.production уже существует — не перезаписываем"
else
    if [[ -f "$REPO_ROOT/.env.production.example" ]]; then
        cp "$REPO_ROOT/.env.production.example" /opt/careermate/.env.production
        chmod 600 /opt/careermate/.env.production
        warn "ВАЖНО: заполни /opt/careermate/.env.production реальными значениями!"
    else
        touch /opt/careermate/.env.production
        chmod 600 /opt/careermate/.env.production
        warn "Создан пустой .env.production — заполни его перед запуском"
    fi
fi

# ── Итог ─────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║          VPS настроен. Следующие шаги:               ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  1. Заполни /opt/careermate/.env.production          ║"
echo "║     (образец: .env.production.example в репо)        ║"
echo "║                                                      ║"
echo "║  2. Настрой GitHub Secrets (Settings → Secrets):     ║"
echo "║     SSH_HOST, SSH_USER, SSH_PRIVATE_KEY              ║"
echo "║     DATABASE_URL (prod)                              ║"
echo "║     PRODUCTION_API_URL  = http://ВАШ_IP              ║"
echo "║     PRODUCTION_AGENT_URL = http://ВАШ_IP             ║"
echo "║     VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID   ║"
echo "║     SLACK_WEBHOOK (опционально)                      ║"
echo "║                                                      ║"
echo "║  3. Добавь публичный SSH-ключ в authorized_keys      ║"
echo "║     (тот же, что в GitHub Secret SSH_PRIVATE_KEY)    ║"
echo "║                                                      ║"
echo "║  4. Запусти деплой: git push origin main             ║"
echo "║     или вручную: bash devops/scripts/deploy.sh prod  ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
