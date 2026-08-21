# Local VSign UAT — preflight + start helper
$ErrorActionPreference = "Continue"
$serviceRoot = Split-Path $PSScriptRoot -Parent
$backendRoot = Join-Path $serviceRoot ".." ".."

Write-Host ""
Write-Host "=== Local VSign UAT Setup ===" -ForegroundColor Cyan
Write-Host ""

# 1. Preflight
& (Join-Path $PSScriptRoot "setup-vsign-local.ps1")
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Fix missing items above before continuing." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Required for LOCAL UAT (VSign callback) ===" -ForegroundColor Cyan
Write-Host @"

VSign UAT cannot POST callback to localhost. You MUST expose port 2103 publicly:

  1. Install ngrok: winget install ngrok.ngrok
  2. In a new terminal:  ngrok http 2103
  3. Copy HTTPS URL, e.g. https://abc123.ngrok-free.app
  4. Set in Backend/.env:
       VSIGN_CALLBACK_URL=https://abc123.ngrok-free.app/api/e-sign/public/v-sign/response
       FRONTEND_URL=http://127.0.0.1:5173
  5. Restart backend (npm run dev:core)
  6. Share this callback URL with VSign if they whitelist UAT ASP callbacks

"@ -ForegroundColor DarkGray

Write-Host "=== Start order (4 terminals) ===" -ForegroundColor Cyan
Write-Host @"
  Terminal 1: cd Backend && npm run dev:core
  Terminal 2: cd Frontend && npm run dev -- --mode esign --host 127.0.0.1 --port 5173
  Terminal 3: ngrok http 2103
  Terminal 4: cd Backend/services/e-sign-service && .\scripts\start-vsign-utility.ps1

"@ -ForegroundColor DarkGray

Write-Host "=== Test one sign ===" -ForegroundColor Cyan
Write-Host @"
  Open: http://127.0.0.1:5173/
  Upload PDF -> Add recipient (with Aadhaar number) -> Send
  Recipient opens sign link -> Aadhaar OTP on esignuat.vsign.in
  After success, signed PDF appears under uploads/signed/

"@ -ForegroundColor DarkGray

Write-Host "=== After 50 successful signs ===" -ForegroundColor Cyan
Write-Host @"
  node scripts/export-vsign-uat-report.js --limit 50
  Pick 2 PDFs from uploads/signed/ and email VSign with the CSV report

"@ -ForegroundColor DarkGray
