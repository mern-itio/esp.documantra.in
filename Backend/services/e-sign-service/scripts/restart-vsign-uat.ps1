# Restart e-sign with current VSIGN_CALLBACK_URL from .env
$ErrorActionPreference = "Stop"
$serviceRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $serviceRoot ".env"

Write-Host "=== VSign UAT restart ===" -ForegroundColor Cyan
if (Test-Path $envFile) {
  $line = Get-Content $envFile | Where-Object { $_ -match '^VSIGN_CALLBACK_URL=' } | Select-Object -First 1
  if ($line) { Write-Host "Current: $line" -ForegroundColor Green }
} else {
  Write-Host ".env not found at $envFile" -ForegroundColor Red
}

$conns = Get-NetTCPConnection -LocalPort 2103 -ErrorAction SilentlyContinue
foreach ($c in $conns) {
  Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

Write-Host "Starting e-sign on port 2103..." -ForegroundColor Cyan
Write-Host "IMPORTANT: Create a NEW envelope after restart (old envelopes keep old callback URL)." -ForegroundColor Yellow
Set-Location $serviceRoot
node index.js
