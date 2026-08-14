# Preflight for live VSign (keys + env, no secret dump).
$ErrorActionPreference = "Continue"
$serviceRoot = Split-Path $PSScriptRoot -Parent
$envPath = Join-Path $serviceRoot ".env"
$vSignDir = Join-Path $serviceRoot "uploads\vSign"

function Read-EnvVar($name) {
  if (-not (Test-Path $envPath)) { return $null }
  $line = Get-Content $envPath | Where-Object { $_ -match "^\s*$name=" } | Select-Object -First 1
  if ($line -match "^\s*$name=(.*)$") { return $Matches[1].Trim() }
  return $null
}

$checks = @()
function Add-Check($name, $ok, $detail) {
  $script:checks += [PSCustomObject]@{ Name = $name; Ok = $ok; Detail = $detail }
}

Add-Check "signCertificate.pfx" (Test-Path (Join-Path $vSignDir "signCertificate.pfx")) (Join-Path $vSignDir "signCertificate.pfx")
Add-Check "ITIO_PUBLIC_KEY.cer" (Test-Path (Join-Path $vSignDir "ITIO_PUBLIC_KEY.cer")) "VSign-registered public cert"
Add-Check "dm_encryption_key.pfx" (Test-Path (Join-Path $vSignDir "dm_encryption_key.pfx")) "Optional encryption key"

Add-Check "VSIGN_CERT_MODE=live" ((Read-EnvVar "VSIGN_CERT_MODE") -eq "live") "Live dmsignaturekey.pfx"

$vsignEnv = Read-EnvVar "VSIGN_ENV"
Add-Check "VSIGN_ENV" ([bool]$vsignEnv) "Current: $vsignEnv"

$aspId = Read-EnvVar "ASP_ID"
$prodAspPending = ($aspId -eq "IIPLUAT001")
Add-Check "ASP_ID set" ([bool]$aspId) $(if ($prodAspPending) { "$aspId (production ID pending from VSign)" } else { $aspId })

Add-Check "PFX_PASSWORD set" ([bool](Read-EnvVar "PFX_PASSWORD")) "(hidden)"
Add-Check "PFX_ALIAS set" ([bool](Read-EnvVar "PFX_ALIAS")) "(hidden)"

$callback = Read-EnvVar "VSIGN_CALLBACK_URL"
$prodCallback = $callback -like "*esp.documantra.in*"
Add-Check "Production callback URL" $prodCallback $callback

$auth = Read-EnvVar "VSIGN_AUTHPAGE"
$prodAuth = $auth -like "*esign.vsign.in*" -and $auth -notlike "*esignuat*"
Add-Check "VSign auth page" ([bool]$auth) $(if ($prodAspPending) { "$auth (UAT OK until production ASP ID)" } else { $auth })

try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:2103/health" -TimeoutSec 3
  Add-Check "e-sign /health" ($health.vsignBuild) "vsignBuild=$($health.vsignBuild) pfx=$($health.pfxConfigured)"
} catch {
  Add-Check "e-sign /health" $false "Service not running on 2103"
}

Write-Host ""
Write-Host "VSign LIVE verification" -ForegroundColor Cyan
foreach ($c in $checks) {
  $mark = if ($c.Ok) { "[OK]" } else { "[!!]" }
  $color = if ($c.Ok) { "Green" } else { "Yellow" }
  Write-Host "$mark $($c.Name)" -ForegroundColor $color
  if ($c.Detail) { Write-Host "    $($c.Detail)" -ForegroundColor DarkGray }
}

$fail = ($checks | Where-Object { -not $_.Ok }).Count
if ($fail -gt 0) {
  Write-Host ""
  Write-Host "$fail check(s) pending — complete .env + restart services." -ForegroundColor Yellow
  exit 1
}
Write-Host ""
Write-Host "Live config looks ready. Test with a NEW envelope on production." -ForegroundColor Green
