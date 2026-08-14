# Restart e-sign service on port 2103 (kill stale Node, start fresh).
$ErrorActionPreference = "Stop"
$port = 2103
$serviceRoot = Split-Path $PSScriptRoot -Parent

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
Write-Host "Starting e-sign service..." -ForegroundColor Cyan
npm run dev
