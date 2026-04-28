# CareerMate — Monitoring Stack

Prometheus + Grafana + Alertmanager observability stack for CareerMate.

## Quick Start

```bash
# From project root
docker-compose -f devops/monitoring/docker-compose.monitoring.yml up -d
```

| Service       | URL                       | Credentials       |
|---------------|---------------------------|-------------------|
| Grafana       | http://localhost:3333     | admin / careermate |
| Prometheus    | http://localhost:9090     | —                 |
| Alertmanager  | http://localhost:9093     | —                 |

## Architecture

```
CareerMate Backend (:3001/api/v1/metrics)  ──┐
node-exporter (:9100)                        ├──► Prometheus ──► Grafana
postgres-exporter (:9187)                    │         │
redis-exporter (:9121)                       ┘         └──► Alertmanager
```

## What's Scraped

| Job                  | Metrics                                          |
|----------------------|--------------------------------------------------|
| `careermate-backend` | HTTP request rate, latency (p50/p95), heap, event loop |
| `node`               | CPU, memory, disk, network (host OS)             |
| `postgres`           | Active connections, replication lag, table stats  |
| `redis`              | Memory usage, hit rate, connected clients         |

## Alerts

Defined in `prometheus/alerts.yml`:

| Alert                      | Threshold          | Severity |
|----------------------------|--------------------|----------|
| BackendDown                | 0 for 1 min        | critical |
| HighErrorRate              | > 5% 5xx           | warning  |
| SlowResponses              | p95 > 2s           | warning  |
| PostgresDown               | 0 for 1 min        | critical |
| PostgresTooManyConnections | > 80% of max_conn  | warning  |
| RedisDown                  | 0 for 1 min        | critical |
| RedisHighMemory            | > 85% of maxmemory | warning  |
| HighCPU                    | > 85% for 10 min   | warning  |
| LowDiskSpace               | < 15% free         | warning  |
| HighMemoryUsage            | > 90% RAM          | warning  |

## Configuring Alertmanager Notifications

Edit `prometheus/alertmanager.yml` and add a Slack webhook or email:

```yaml
receivers:
  - name: critical
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        send_resolved: true
```

## Production Environment Variables

Set these before starting the monitoring stack:

```bash
MONITORING_POSTGRES_URL=postgresql://user:pass@host:5432/careermate?sslmode=disable
MONITORING_REDIS_URL=redis://host:6379
```

## Connecting to Production Backend

Edit `prometheus/prometheus.yml` and replace the backend target:

```yaml
- job_name: careermate-backend
  static_configs:
    - targets: ['your-server-ip:3001']
```
