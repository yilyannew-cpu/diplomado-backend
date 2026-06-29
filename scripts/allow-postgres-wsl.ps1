# Ejecutar en PowerShell COMO ADMINISTRADOR
# Permite que WSL se conecte a PostgreSQL en Windows (puerto 5433)

New-NetFirewallRule `
  -DisplayName "PostgreSQL 5433 - WSL/LAN" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 5433 `
  -Action Allow `
  -Profile Any

Write-Host "Regla creada. Desde WSL prueba: nc -zv 172.18.16.1 5433"
