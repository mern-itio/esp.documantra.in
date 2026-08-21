# Switch VSign UAT <-> Live (no code changes).
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidateSet('uat', 'live', 'status')]
  [string]$Profile,

  [string]$TunnelUrl = ''
)

$ErrorActionPreference = 'Stop'
$serviceRoot = Split-Path $PSScriptRoot -Parent
Push-Location $serviceRoot

try {
  if ($Profile -eq 'status') {
    node scripts/switch-vsign-env.js status
    exit $LASTEXITCODE
  }

  $args = @('scripts/switch-vsign-env.js', $Profile)
  if ($TunnelUrl) { $args += $TunnelUrl }
  node @args
  $code = $LASTEXITCODE

  if ($code -eq 0 -or $code -eq 2) {
    Write-Host ""
    Write-Host "Restart utility + e-sign, then create a NEW envelope to sign." -ForegroundColor Cyan
    Write-Host "  .\scripts\start-vsign-utility.ps1" -ForegroundColor DarkGray
    Write-Host "  npm run dev   (in e-sign-service)" -ForegroundColor DarkGray
  }
  exit $code
} finally {
  Pop-Location
}
