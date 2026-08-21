# Switch VSign to production (esp.documantra.in callback) and verify readiness.
$ErrorActionPreference = "Stop"
$serviceRoot = Split-Path $PSScriptRoot -Parent
Push-Location $serviceRoot

Write-Host ""
Write-Host "=== VSign Production Go-Live ===" -ForegroundColor Cyan
Write-Host ""

# 1) Profile switch — production callback, no Cloudflare tunnel
Write-Host "[1/4] Switching to live profile (production callback)..." -ForegroundColor Yellow
node scripts/switch-vsign-env.js live
if ($LASTEXITCODE -gt 2) { exit $LASTEXITCODE }

# 2) Key files
Write-Host "[2/4] Checking live key files..." -ForegroundColor Yellow
$required = @(
  "uploads/vSign/signCertificate.pfx",
  "uploads/vSign/ITIO_PUBLIC_KEY.cer",
  "uploads/vSign/dm_encryption_key.pfx",
  "config/vsign/secrets/live.env"
)
$missing = @()
foreach ($rel in $required) {
  $abs = Join-Path $serviceRoot $rel
  if (-not (Test-Path $abs)) { $missing += $rel }
  else { Write-Host "  OK  $rel" -ForegroundColor Green }
}
if ($missing.Count -gt 0) {
  Write-Host ""
  Write-Host "Missing files:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  - $_" }
  Write-Host "Run: .\scripts\setup-vsign-live-keys.ps1 -Force" -ForegroundColor Yellow
  exit 1
}

# 3) Utility + gettxnref smoke test
Write-Host "[3/4] VSign utility gettxnref diagnostic..." -ForegroundColor Yellow
$portOk = (Test-NetConnection -ComputerName 127.0.0.1 -Port 7078 -WarningAction SilentlyContinue).TcpTestSucceeded
if (-not $portOk) {
  Write-Host "  VSign utility not on 7078 — starting..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList "-NoExit", "-File", (Join-Path $PSScriptRoot "start-vsign-utility.ps1") -WindowStyle Minimized
  Start-Sleep -Seconds 8
}
node scripts/diagnose-vsign-gettxnref.js
if ($LASTEXITCODE -ne 0) {
  Write-Host "  gettxnref failed — fix utility/PFX before production deploy." -ForegroundColor Red
  exit 1
}

# 4) Summary
Write-Host "[4/4] Production config summary" -ForegroundColor Yellow
node scripts/switch-vsign-env.js status

Write-Host ""
Write-Host "Local production profile is ready." -ForegroundColor Green
Write-Host ""
Write-Host "Production server steps:" -ForegroundColor Cyan
Write-Host "  1. Deploy latest code (CORS + callback + isresponseXML=1 fixes)"
Write-Host "  2. Copy live keys to server uploads/vSign/"
Write-Host "  3. Run: bash deploy/scripts/deploy-vsign-live.sh"
Write-Host "  4. Register callback with VSign if needed:"
Write-Host "     https://esp.documantra.in/esign/api/e-sign/public/v-sign/response"
Write-Host "  5. Create NEW envelope on esp.documantra.in and test Aadhaar sign"
Write-Host ""
Write-Host "Admin panel: /e-sign/admin/vsign — confirm Live mode + IIPL001" -ForegroundColor DarkGray
Write-Host ""

Pop-Location
