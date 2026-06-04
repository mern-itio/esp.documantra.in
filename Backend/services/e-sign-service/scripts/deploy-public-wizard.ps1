# Run ON SERVER after git pull / code sync.
Set-Location $PSScriptRoot\..
Write-Host "==> e-sign-service: install deps"
npm install
Set-Location ..\..\packages\auth-lib
npm install
Set-Location $PSScriptRoot\..

Write-Host "==> Ensure PUBLIC_FLOW_SENDER_ID is set in .env"
if (-not (Select-String -Path .env -Pattern '^PUBLIC_FLOW_SENDER_ID=' -Quiet -ErrorAction SilentlyContinue)) {
  Add-Content .env "`n# PUBLIC_FLOW_SENDER_ID=<mongodb_user_objectid>"
}

Write-Host "==> Restart service (pm2 example)"
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
  pm2 restart e-sign-service 2>$null
  if ($LASTEXITCODE -ne 0) { pm2 restart all }
}

Start-Sleep -Seconds 2
try {
  $r = Invoke-WebRequest -Uri "http://127.0.0.1:2103/api/e-sign/public/wizard/health" -UseBasicParsing -TimeoutSec 10
  Write-Host "OK: $($r.Content)"
} catch {
  Write-Host "FAIL: health check — $($_.Exception.Message)"
}
