# Print PKCS12 alias name only (for live dmsignaturekey.pfx). Does not export private key or cert body.
param(
  [string]$PfxPath = (Join-Path (Split-Path $PSScriptRoot -Parent) "uploads\vSign\signCertificate.pfx"),
  [Parameter(Mandatory = $true)]
  [string]$Password
)

if (-not (Test-Path $PfxPath)) {
  Write-Host "PFX not found: $PfxPath" -ForegroundColor Red
  Write-Host "Run: .\scripts\setup-vsign-live-keys.ps1" -ForegroundColor Yellow
  exit 1
}

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
  Write-Host "keytool not found. Install Java JDK/JRE and retry." -ForegroundColor Red
  exit 1
}

$out = & keytool -list -keystore $PfxPath -storetype PKCS12 -storepass $Password 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Could not read PFX — wrong password or corrupt file." -ForegroundColor Red
  exit 1
}

$aliasLine = $out | Where-Object { $_ -match ', \d{4}-\d{2}-\d{2},' } | Select-Object -First 1
if (-not $aliasLine) {
  Write-Host "No alias found in PFX output." -ForegroundColor Red
  exit 1
}

$alias = ($aliasLine -split ',')[0].Trim()
Write-Host ""
Write-Host "PFX alias (copy to .env PFX_ALIAS):" -ForegroundColor Green
Write-Host "  $alias"
Write-Host ""
Write-Host "Next:"
Write-Host "  `$env:PFX_PASSWORD='...'; `$env:PFX_ALIAS='$alias'; .\scripts\configure-vsign-live-keys-only.ps1"
