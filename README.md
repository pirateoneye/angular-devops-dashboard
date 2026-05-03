# DevOps Dashboard

Angular-based DevOps monitoring dashboard. Real-time overview of CI/CD pipelines, containers, Kubernetes clusters, logs, and alerts.

## Features

| Module | What it tracks |
|--------|---------------|
| **Dashboard** | System metrics (CPU, memory, disk, network) + environment health |
| **Pipelines** | CI/CD build status with per-stage breakdown |
| **Containers** | Docker runtime status, resource usage, health checks |
| **Kubernetes** | Pod statuses, node resources, readiness |
| **Logs** | Centralized log viewer with filtering by service/level |
| **Alerts** | Severity-based alerts with acknowledge workflow |

## Quick Start

```bash
# Install dependencies
npm install

# Dev server
npm start

# Production build
npm run build:prod
```

## Docker

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Or use docker-compose
docker-compose up -d
```

## Kubernetes

```bash
kubectl apply -f k8s/
```

## CI/CD

GitHub Actions workflow included:
- Lint + test on PR
- Docker build + push to GHCR on main
- Auto-deploy to staging then production

## Tech Stack

- Angular 17 (standalone components, signals-ready)
- RxJS for async data streams
- SCSS with CSS custom properties
- Docker multi-stage build
- nginx static hosting
- Kubernetes deployment with probes
