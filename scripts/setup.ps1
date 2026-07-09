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

# PostgreSQL (opcional — solo aviso)
$pgServices = @("postgresql-x64-17", "postgresql-x64-18", "postgresql-x64-16")
$pgRunning = $false
foreach ($svc in $pgServices) {
    $s = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($s -and $s.Status -eq "Running") {
        Write-Host "PostgreSQL: $svc (Running)" -ForegroundColor Green
        $pgRunning = $true
        break
    }
}
if (-not $pgRunning) {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
        Write-Host "PostgreSQL Windows no detectado. Puedes usar Docker: npm run setup:docker" -ForegroundColor Yellow
    } else {
        Write-Host "ADVERTENCIA: PostgreSQL no detectado en ejecución. Las migraciones pueden fallar." -ForegroundColor Yellow
    }
}

# Ejecutar script Node (misma lógica en todos los SO)
$setupArgs = @("scripts/setup.cjs")
if ($Clean) {
    $setupArgs += "--clean"
}

node @setupArgs
exit $LASTEXITCODE
