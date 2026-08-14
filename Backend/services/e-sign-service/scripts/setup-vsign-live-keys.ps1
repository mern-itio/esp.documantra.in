# Install live VSign keys from Desktop into uploads/vSign/ (does not commit secrets).
param(
  [string]$SourceDir = "C:\Users\DELL\Desktop\dmsignaturekey",
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$serviceRoot = Split-Path $PSScriptRoot -Parent
$destDir = Join-Path $serviceRoot "uploads\vSign"
New-Item -ItemType Directory -Force -Path $destDir | Out-Null

$map = @(
  @{ Src = "dmsignaturekey.pfx"; Dest = "signCertificate.pfx"; Label = "ASP signing PFX" },
  @{ Src = "ITIO_PUBLIC KEY.cer"; Dest = "ITIO_PUBLIC_KEY.cer"; Label = "VSign registered public cert" },
  @{ Src = "dm_encryption_key.pfx"; Dest = "dm_encryption_key.pfx"; Label = "DM encryption PFX" }
)

Write-Host ""
Write-Host "VSign LIVE key install" -ForegroundColor Cyan
Write-Host "Source: $SourceDir"
Write-Host "Target: $destDir"
Write-Host ""

if (-not (Test-Path $SourceDir)) {
  Write-Host "Source folder not found: $SourceDir" -ForegroundColor Red
  exit 1
}

foreach ($item in $map) {
  $srcPath = Join-Path $SourceDir $item.Src
  $destPath = Join-Path $destDir $item.Dest
  if (-not (Test-Path $srcPath)) {
    Write-Host "[SKIP] $($item.Label) — missing: $srcPath" -ForegroundColor Yellow
    continue
  }
  if ((Test-Path $destPath) -and -not $Force) {
    Write-Host "[OK]   $($item.Label) — already present (use -Force to overwrite)" -ForegroundColor DarkGray
    continue
  }
  Copy-Item -LiteralPath $srcPath -Destination $destPath -Force
  $size = (Get-Item -LiteralPath $destPath).Length
  Write-Host "[OK]   $($item.Label) -> $($item.Dest) ($size bytes)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Set PFX_PASSWORD and PFX_ALIAS in .env (from VSign kit / key generation)."
Write-Host "  2. Set live ASP_ID in .env (production ASP ID, not IIPLUAT001)."
Write-Host "  3. Run: .\scripts\activate-vsign-live-env.ps1"
Write-Host "  4. Restart e-sign-service and VSign utility (7077)."
Write-Host "  5. Verify: GET http://127.0.0.1:2103/health -> vsignEnv=production, pfxConfigured=true"
Write-Host ""
