# Restart admin-service on port 3100
$ErrorActionPreference = "Stop"
$port = 3100
$serviceRoot = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path $serviceRoot)) {
  $serviceRoot = "E:\esp-public-flow-backup\Backend\services\admin-service"
}

Write-Host "Stopping processes on port $port..." -ForegroundColor Cyan
$connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
foreach ($conn in $connections) {
  if ($conn.OwningProcess -gt 0) {
    Write-Host "  Killing PID $($conn.OwningProcess)"
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
  }
}
Start-Sleep -Seconds 2

Set-Location $serviceRoot
Write-Host "Starting admin-service..." -ForegroundColor Cyan
npm run dev
