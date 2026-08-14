# Preflight checks for local VSign / ESP utility development.
$ErrorActionPreference = "Continue"

$serviceRoot = Split-Path $PSScriptRoot -Parent
$checks = @()

function Add-Check($name, $ok, $detail) {
  $script:checks += [PSCustomObject]@{ Name = $name; Ok = $ok; Detail = $detail }
}

# Java
$java = Get-Command java -ErrorAction SilentlyContinue
Add-Check "Java" ([bool]$java) ($(if ($java) { (& java -version 2>&1 | Select-Object -First 1) } else { "Not installed" }))

# PFX
$pfx = Join-Path $serviceRoot "uploads\vSign\signCertificate.pfx"
if (Test-Path (Join-Path $serviceRoot ".env")) {
  $pfxLine = Get-Content (Join-Path $serviceRoot ".env") | Where-Object { $_ -match '^\s*PFX_PATH=' } | Select-Object -First 1
  if ($pfxLine -match 'PFX_PATH=(.+)$') {
    $rel = $Matches[1].Trim()
    if ($rel) { $pfx = Join-Path $serviceRoot ($rel -replace '/', '\') }
  }
}
Add-Check "ASP PFX certificate" (Test-Path $pfx) $pfx

# Utility JAR
$utilityDir = Join-Path $serviceRoot "utility"
$jar = Get-ChildItem $utilityDir -Filter "*.jar" -ErrorAction SilentlyContinue | Select-Object -First 1
Add-Check "ESP Utility JAR" ([bool]$jar) ($(if ($jar) { $jar.FullName } else { "Missing - copy to $utilityDir" }))

# Utility port
$portOk = $false
try {
  $portOk = (Test-NetConnection -ComputerName 127.0.0.1 -Port 7077 -WarningAction SilentlyContinue).TcpTestSucceeded
} catch { $portOk = $false }
Add-Check "ESP Utility running (7077)" $portOk "http://127.0.0.1:7077"

# Sample PDF
$pdf = Join-Path $serviceRoot "..\..\..\deploy\docs\asp-audit-annexures\Annexure-A13-Sample-Signed-Document.pdf"
$pdf = [System.IO.Path]::GetFullPath($pdf)
Add-Check "Sample PDF" (Test-Path $pdf) $pdf

Write-Host ""
Write-Host "VSign local setup status" -ForegroundColor Cyan
Write-Host "========================"
foreach ($c in $checks) {
  $mark = if ($c.Ok) { "[OK]" } else { "[--]" }
  $color = if ($c.Ok) { "Green" } else { "Yellow" }
  Write-Host "$mark $($c.Name)" -ForegroundColor $color
  Write-Host "    $($c.Detail)" -ForegroundColor DarkGray
}

$allReady = ($checks | Where-Object { $_.Name -ne "ESP Utility running (7077)" -and -not $_.Ok }).Count -eq 0
if ($allReady -and -not ($checks | Where-Object { $_.Name -eq "ESP Utility running (7077)" }).Ok) {
  Write-Host ""
  Write-Host "Next: start utility in another terminal:" -ForegroundColor Cyan
  Write-Host "  .\scripts\start-vsign-utility.ps1"
}

if (-not ($checks | Where-Object { $_.Name -eq "ESP Utility JAR" }).Ok) {
  exit 1
}
