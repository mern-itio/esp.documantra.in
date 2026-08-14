# Live keys only (dmsignaturekey.pfx + ITIO_PUBLIC KEY.cer + dm_encryption_key.pfx).
# VSign sends production ASP ID later, after you share the public cert.
param(
  [string]$PfxPassword = $env:PFX_PASSWORD,
  [string]$PfxAlias = $env:PFX_ALIAS,
  [string]$AspId = $env:ASP_ID,
  [switch]$ProductionEsp
)

$ErrorActionPreference = "Stop"
$serviceRoot = Split-Path $PSScriptRoot -Parent
$envPath = Join-Path $serviceRoot ".env"
$backupPath = "$envPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

& (Join-Path $PSScriptRoot "setup-vsign-live-keys.ps1") -Force | Out-Null

if (-not $PfxPassword -or -not $PfxAlias) {
  Write-Host "Live PFX password + alias required (from when dmsignaturekey.pfx was created)." -ForegroundColor Red
  Write-Host ""
  Write-Host "Find alias (alias name only, no key dump):"
  Write-Host "  .\scripts\discover-pfx-alias.ps1 -Password 'YOUR_PFX_PASSWORD'"
  Write-Host ""
  Write-Host "Then configure:"
  Write-Host "  `$env:PFX_PASSWORD='...'; `$env:PFX_ALIAS='{GUID}'; .\scripts\configure-vsign-live-keys-only.ps1"
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

$liveVars = [ordered]@{
  VSIGN_CERT_MODE = "live"
  VSIGN_ENV = if ($ProductionEsp) { "production" } else { "uat" }
  ASP_ID = if ($AspId) { $AspId } else { "IIPLUAT001" }
  VSIGN_AUTHPAGE = if ($ProductionEsp) { "https://esign.vsign.in/esp" } else { "https://esignuat.vsign.in/esp" }
  PFX_PATH = "uploads/vSign/signCertificate.pfx"
  PFX_PASSWORD = $PfxPassword
  PFX_ALIAS = $PfxAlias
  DM_ENCRYPTION_KEY_PATH = "uploads/vSign/dm_encryption_key.pfx"
  UTILITY_URL = "http://127.0.0.1:7077"
  VSIGN_USE_JAR = "1"
  VSIGN_APPEARANCE_MODE = "custom-tick"
}

foreach ($key in $liveVars.Keys) {
  $existing[$key] = $liveVars[$key]
}

$lines = foreach ($key in ($existing.Keys | Sort-Object)) {
  "$key=$($existing[$key])"
}
Set-Content -Path $envPath -Value ($lines -join "`n") -Encoding UTF8

Write-Host ""
Write-Host "Live keys configured (VSign extra credentials NOT required)" -ForegroundColor Green
Write-Host "  signCertificate.pfx  <- dmsignaturekey.pfx"
Write-Host "  ITIO_PUBLIC_KEY.cer  <- share with VSign for production ASP ID"
Write-Host "  dm_encryption_key.pfx <- stored (DocuMantra internal; not sent to VSign utility)"
Write-Host ""
Write-Host "  VSIGN_CERT_MODE=live"
Write-Host "  ASP_ID=$($liveVars.ASP_ID)$(if (-not $AspId) { ' (UAT until VSign assigns production ID)' })"
Write-Host "  VSIGN_AUTHPAGE=$($liveVars.VSIGN_AUTHPAGE)"
Write-Host ""
Write-Host "Restart e-sign + utility, then: .\scripts\verify-vsign-live-config.ps1" -ForegroundColor Cyan
