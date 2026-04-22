#!/bin/bash
set -e

# ── System packages ──────────────────────────────────────────────────────────
dnf update -y
dnf install -y docker git curl

systemctl enable --now docker
usermod -aG docker ec2-user

# ── Docker Compose ───────────────────────────────────────────────────────────
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# ── Application directory ────────────────────────────────────────────────────
mkdir -p /opt/careermate
cd /opt/careermate

# ── Environment file ─────────────────────────────────────────────────────────
cat > .env.production <<EOF
NODE_ENV=production
DATABASE_URL=${db_url}
REDIS_URL=${redis_url}
JWT_SECRET=${jwt_secret}
LLM_API_KEY=${llm_api_key}
PINECONE_API_KEY=${pinecone_key}
ADZUNA_APP_ID=${adzuna_id}
ADZUNA_APP_KEY=${adzuna_key}
AWS_REGION=${aws_region}
AWS_S3_BUCKET=${s3_bucket}
EOF

chmod 600 .env.production

# ── Clone and start the application ─────────────────────────────────────────
# Replace with your actual repository URL
# git clone https://github.com/your-org/careermate.git .
# docker-compose -f devops/docker/docker-compose.prod.yml --env-file .env.production up -d

echo "EC2 bootstrap complete. Deploy CareerMate manually or via CI/CD."
