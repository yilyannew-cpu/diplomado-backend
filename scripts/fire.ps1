# Atajo Windows (PowerShell) equivalente a `make fire`.
# No afecta Render. Uso: .\scripts\fire.ps1
param(
  [ValidateSet("fire", "up", "down", "clean", "logs", "seed", "ps", "rebuild", "help")]
  [string]$Cmd = "fire"
)

$ErrorActionPreference = "Stop"
$Compose = @("compose", "-f", "docker-compose.local.yml")

function Invoke-Compose {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  & docker @Compose @Args
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

switch ($Cmd) {
  "help" {
    Write-Host ""
    Write-Host "  .\scripts\fire.ps1          → build + levantar API y Postgres"
    Write-Host "  .\scripts\fire.ps1 down     → parar"
    Write-Host "  .\scripts\fire.ps1 clean    → parar y borrar BD local"
    Write-Host "  .\scripts\fire.ps1 logs     → logs API"
    Write-Host "  .\scripts\fire.ps1 seed     → seed superadmin"
    Write-Host "  .\scripts\fire.ps1 rebuild  → rebuild sin caché"
    Write-Host ""
  }
  "fire" {
    Write-Host ""
    Write-Host "  ▶ FFCore local — modo Docker"
    Write-Host "  API:      http://localhost:3000"
    Write-Host "  Health:   http://localhost:3000/api/v1/health"
    Write-Host "  Postgres: localhost:5432 (ffcore / ffcore)"
    Write-Host ""
    Invoke-Compose up --build -d
    Write-Host ""
    Write-Host "  Listo. Logs: .\scripts\fire.ps1 logs  |  Parar: .\scripts\fire.ps1 down"
    Write-Host ""
  }
  "up" { Invoke-Compose up -d }
  "down" { Invoke-Compose down }
  "clean" { Invoke-Compose down -v }
  "logs" { Invoke-Compose logs -f api }
  "ps" { Invoke-Compose ps }
  "seed" { Invoke-Compose exec api npx prisma db seed }
  "rebuild" {
    Invoke-Compose build --no-cache api
    Invoke-Compose up -d
  }
}
