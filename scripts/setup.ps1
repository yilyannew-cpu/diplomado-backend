# FFCore API — setup en Windows (PowerShell)
# Uso:
#   .\scripts\setup.ps1
#   .\scripts\setup.ps1 -Clean
#   npm run setup

param(
    [switch]$Clean
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "`n=== FFCore API — Setup (Windows) ===`n" -ForegroundColor Cyan

# Node.js
try {
    $nodeVersion = node -v
    Write-Host "Node.js: $nodeVersion"
    $major = [int]($nodeVersion -replace '^v(\d+)\..*', '$1')
    if ($major -lt 20) {
        Write-Host "Se requiere Node.js 20+. Instala desde https://nodejs.org" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Node.js no encontrado. Instala Node 20+ desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

# PostgreSQL: Docker está en Ubuntu (WSL), no en Windows
$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
    Write-Host "Docker en PATH de Windows. Si falla, usa Ubuntu: wsl → npm run db:up" -ForegroundColor Yellow
} else {
    Write-Host "Docker no está en Windows PATH (normal si solo lo tienes en Ubuntu)." -ForegroundColor Yellow
    Write-Host "  Abre Ubuntu/WSL y ejecuta:" -ForegroundColor Cyan
    Write-Host "    cd /mnt/c/Users/yilgr/OneDrive/Desktop/diplomado-backend" -ForegroundColor White
    Write-Host "    npm run db:up && npm run setup && npm run dev" -ForegroundColor White
}

# Aviso si .env apunta a Neon
$envFile = Join-Path $ProjectRoot ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match 'neon\.tech') {
        Write-Host ""
        Write-Host "ERROR: tu .env apunta a Neon (nube/producción)." -ForegroundColor Red
        Write-Host "  En Ubuntu: cp .env.example .env" -ForegroundColor Red
        Write-Host "  Neon solo se usa en Render." -ForegroundColor Red
        exit 1
    }
}

# Ejecutar script Node (misma lógica en todos los SO)
$setupArgs = @("scripts/setup.cjs")
if ($Clean) {
    $setupArgs += "--clean"
}

node @setupArgs
exit $LASTEXITCODE
