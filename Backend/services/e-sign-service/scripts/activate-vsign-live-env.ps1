# Merge live VSign settings into e-sign-service .env (keeps Mongo/JWT lines from existing file).
param(
  [string]$AspId = $env:ASP_ID,
  [string]$PfxPassword = $env:PFX_PASSWORD,
  [string]$PfxAlias = $env:PFX_ALIAS,
  [switch]$LocalCallback
)

$ErrorActionPreference = "Stop"
$serviceRoot = Split-Path $PSScriptRoot -Parent
$envPath = Join-Path $serviceRoot ".env"
$examplePath = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) "deploy\env\e-sign-service.live.example"
$examplePath = [System.IO.Path]::GetFullPath($examplePath)
$backupPath = "$envPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

$liveVars = [ordered]@{
  VSIGN_ENV = "production"
  ASP_ID = $AspId
  VSIGN_AUTHPAGE = "https://esign.vsign.in/esp"
  VSIGN_ESP_RESPONSE_URL = "https://esign.vsign.in/esp/2.1.1/aspesignresponse"
  VSIGN_CALLBACK_URL = if ($LocalCallback) {
    "http://127.0.0.1:2103/api/e-sign/public/v-sign/response"
  } else {
    "https://esp.documantra.in/esign/api/e-sign/public/v-sign/response"
  }
  UTILITY_URL = "http://127.0.0.1:7077"
  VSIGN_USE_JAR = "1"
  PFX_PATH = "uploads/vSign/signCertificate.pfx"
  PFX_PASSWORD = $PfxPassword
  PFX_ALIAS = $PfxAlias
  DM_ENCRYPTION_KEY_PATH = "uploads/vSign/dm_encryption_key.pfx"
  VSIGN_APPEARANCE_MODE = "custom-tick"
}

if (-not $AspId) {
  Write-Host "ASP_ID required. Pass -AspId or set `$env:ASP_ID (live production ID from VSign)." -ForegroundColor Red
  exit 1
}
if (-not $PfxPassword -or -not $PfxAlias) {
  Write-Host "PFX_PASSWORD and PFX_ALIAS required for live signing." -ForegroundColor Red
  Write-Host "Example: `$env:PFX_PASSWORD='...'; `$env:PFX_ALIAS='{GUID}'; .\scripts\activate-vsign-live-env.ps1 -AspId 'IIPL...'" -ForegroundColor Yellow
  exit 1
}

$existing = @{}
if (Test-Path $envPath) {
  Copy-Item $envPath $backupPath
  Write-Host "Backed up .env -> $backupPath" -ForegroundColor DarkGray
  Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      $existing[$Matches[1]] = $Matches[2]
    }
  }
}

foreach ($key in $liveVars.Keys) {
  $existing[$key] = $liveVars[$key]
}

$lines = foreach ($key in ($existing.Keys | Sort-Object)) {
  "$key=$($existing[$key])"
}
Set-Content -Path $envPath -Value ($lines -join "`n") -Encoding UTF8

Write-Host ""
Write-Host "Live VSign env activated in .env" -ForegroundColor Green
Write-Host "  VSIGN_ENV=production"
Write-Host "  ASP_ID=$AspId"
Write-Host "  VSIGN_AUTHPAGE=https://esign.vsign.in/esp"
Write-Host "  VSIGN_CALLBACK_URL=$($liveVars.VSIGN_CALLBACK_URL)"
Write-Host ""
Write-Host "Template reference: $examplePath"
Write-Host "Restart e-sign-service, then check GET /health" -ForegroundColor Cyan
Write-Host ""
