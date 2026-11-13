# Bean Beacon DevOps Workflow

This project applies the six-step guide to the existing React + Express + MongoDB application.

## Pipeline

GitLab Runner executes validation, tests, security checks, and production Docker builds. Deployment uses the local production Compose file; Harbor is intentionally outside the project scope.

## Local services

```powershell
docker compose up -d --build
```

- Frontend: http://localhost:8081
- API health: http://localhost:3000/api/health
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
- Uptime Kuma: http://localhost:3002

In Uptime Kuma, create an HTTP monitor for `http://backend:3000/api/health` with a 60-second interval.

## Production deployment

```powershell
$env:JWT_SECRET = "use-a-unique-secret"
docker compose -f docker-compose.prod.yml up -d --build
```

For a local pyinfra deployment, install `pyinfra` and run:

```powershell
pyinfra @local deploy.py
```

## Windows demonstration

```powershell
.\demo.ps1
```

The script checks the API, runs backend tests, and starts the production Compose stack. It does not commit changes or push branches automatically.
