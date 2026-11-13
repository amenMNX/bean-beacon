param(
    [string]$HealthUrl = "http://localhost:3000/api/health"
)

$ErrorActionPreference = "Stop"

Write-Host "1. Validate the application health endpoint..."
$health = Invoke-RestMethod -Uri $HealthUrl
if (-not $health.success) {
    throw "Bean Beacon health check failed."
}

Write-Host "2. Run backend tests..."
Push-Location "$PSScriptRoot\bean-beacon-backend"
try {
    npm test -- run
} finally {
    Pop-Location
}

Write-Host "3. Build and start the production stack..."
docker compose -f "$PSScriptRoot\docker-compose.prod.yml" up -d --build

Write-Host "4. Deployment completed. Check http://localhost and http://localhost:3002."
