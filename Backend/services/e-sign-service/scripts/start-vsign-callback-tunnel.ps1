# Stable HTTPS tunnel for VSign callback (Cloudflare quick tunnel).
$ErrorActionPreference = "Stop"

$cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $cloudflared)) {
  $cloudflared = Join-Path $env:ProgramFiles "Cloudflare\cloudflared\cloudflared.exe"
}
if (-not (Test-Path $cloudflared)) {
  Write-Host "cloudflared not found. Install: winget install Cloudflare.cloudflared" -ForegroundColor Red
  exit 1
}

Write-Host "Starting Cloudflare tunnel -> http://127.0.0.1:2103" -ForegroundColor Cyan
Write-Host "Copy the https://*.trycloudflare.com URL into Backend/.env as:" -ForegroundColor DarkGray
Write-Host "  VSIGN_CALLBACK_URL=https://YOUR-URL/api/e-sign/public/v-sign/response" -ForegroundColor DarkGray
Write-Host "Then restart e-sign-service and create a NEW envelope." -ForegroundColor Yellow
Write-Host ""

& $cloudflared tunnel --url http://127.0.0.1:2103 --no-autoupdate
