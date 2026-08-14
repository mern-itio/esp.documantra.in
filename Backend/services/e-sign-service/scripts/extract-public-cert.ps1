# Extract public certificate from PFX (share with VSign — never share password/private key).
param(
  [string]$PfxPath = (Join-Path (Split-Path $PSScriptRoot -Parent) "uploads\vSign\signCertificate.pfx"),
  [string]$OutPath = (Join-Path (Split-Path $PSScriptRoot -Parent) "uploads\vSign\public-cert-for-vsign.pem"),
  [string]$Password = $env:PFX_PASSWORD
)

if (-not (Test-Path $PfxPath)) {
  Write-Host "PFX not found: $PfxPath" -ForegroundColor Red
  exit 1
}

$openssl = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $openssl) {
  Write-Host "OpenSSL not found. Install Git for Windows or OpenSSL, then retry." -ForegroundColor Red
  exit 1
}

if (-not $Password) { $Password = "abc1234" }

& openssl pkcs12 -in $PfxPath -clcerts -nokeys -out $OutPath -passin "pass:$Password"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Public certificate saved:" -ForegroundColor Green
Write-Host "  $OutPath"
Write-Host "Send this file to VSign (production go-live). Do NOT send PFX password." -ForegroundColor Yellow
