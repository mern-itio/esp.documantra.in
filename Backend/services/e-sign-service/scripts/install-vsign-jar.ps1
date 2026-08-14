# Copy vendor JAR from Desktop (or custom path) into utility/ and optionally start it.
param(
  [string]$JarPath = '',
  [switch]$Start
)

$ErrorActionPreference = 'Stop'
$serviceRoot = Split-Path $PSScriptRoot -Parent
$utilityDir = Join-Path $serviceRoot 'utility'

if (-not $JarPath) {
  $desktop = [Environment]::GetFolderPath('Desktop')
  $candidates = @(
    (Join-Path $desktop 'esp-utility.jar'),
    (Join-Path $desktop 'ESPUtility.jar'),
    (Join-Path $desktop 'VerasyseSignUtility.jar'),
    (Join-Path $desktop 'eSignUtility.jar')
  )
  $found = Get-ChildItem $desktop -Filter '*.jar' -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if ($found) { $JarPath = $found.FullName }
  else {
    foreach ($c in $candidates) {
      if (Test-Path -LiteralPath $c) { $JarPath = $c; break }
    }
  }
}

if (-not $JarPath -or -not (Test-Path -LiteralPath $JarPath)) {
  Write-Host 'JAR not found. Usage:' -ForegroundColor Yellow
  Write-Host '  .\scripts\install-vsign-jar.ps1 -JarPath "C:\Users\DELL\Desktop\YOUR-FILE.jar" -Start'
  exit 1
}

$dest = Join-Path $utilityDir 'esp-utility.jar'
Copy-Item -LiteralPath $JarPath -Destination $dest -Force
Write-Host "Installed: $dest" -ForegroundColor Green
Write-Host 'Set VSIGN_USE_JAR=1 in .env (already default in start script when JAR present).'

if ($Start) {
  & (Join-Path $PSScriptRoot 'start-vsign-utility.ps1')
}
