FROM python:3.11-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Production stage ──────────────────────────────────────────────────────
FROM base AS production

WORKDIR /app

COPY src/ ./src/

# Directory for serialized model artefacts (mounted as volume in prod)
RUN mkdir -p /app/models

RUN useradd -r -u 1001 -g root mlservice && chown -R mlservice /app
USER mlservice

ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:3003/health')"

CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "3003"]
