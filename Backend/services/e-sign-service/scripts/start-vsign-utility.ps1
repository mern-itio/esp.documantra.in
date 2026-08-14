# Start VSign ESP Utility on port 7077 (gettxnrefv4_1 / signpdfv4_1).
# Prefers vendor JAR when VSIGN_USE_JAR=1 or esp-utility.jar exists.
param(
  [switch]$ForceJar
)

$ErrorActionPreference = 'Stop'

$serviceRoot = Split-Path $PSScriptRoot -Parent
$utilityDir = Join-Path $serviceRoot 'utility'
$port = if ($env:UTILITY_PORT) { $env:UTILITY_PORT } else { '7077' }

function Test-PortListen {
  param([int]$P)
  return (Test-NetConnection -ComputerName 127.0.0.1 -Port $P -WarningAction SilentlyContinue).TcpTestSucceeded
}

function Stop-PortProcess {
  param([int]$P)
  Get-NetTCPConnection -LocalPort $P -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.OwningProcess -gt 0) {
      Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
  Start-Sleep -Seconds 2
}

$envFile = Join-Path $serviceRoot '.env'
$useJar = $ForceJar.IsPresent
if (-not $useJar -and (Test-Path $envFile)) {
  $line = Get-Content $envFile | Where-Object { $_ -match '^VSIGN_USE_JAR\s*=\s*1' } | Select-Object -First 1
  if ($line) { $useJar = $true }
}
if ($env:VSIGN_USE_JAR -eq '1') { $useJar = $true }

$jarFromEnv = $env:VSIGN_UTILITY_JAR
if ($jarFromEnv -and (Test-Path -LiteralPath $jarFromEnv)) {
  $destJar = Join-Path $utilityDir 'esp-utility.jar'
  if ((Resolve-Path -LiteralPath $jarFromEnv).Path -ne (Resolve-Path -LiteralPath $destJar -ErrorAction SilentlyContinue).Path) {
    Copy-Item -LiteralPath $jarFromEnv -Destination $destJar -Force
  }
}

$jarPath = Join-Path $utilityDir 'esp-utility.jar'
if (-not (Test-Path $jarPath)) {
  $jarPath = Get-ChildItem $utilityDir -Filter '*.jar' -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notmatch '^(access-bridge|rt|jce|jsse)' } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 -ExpandProperty FullName
}

$exePath = Join-Path $utilityDir 'Verasays-eSign-Web-1.0_UAT.exe'
if (-not (Test-Path $exePath)) {
  $exePath = Get-ChildItem $utilityDir -Filter '*eSign*UAT*.exe' -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName
}

if (Test-PortListen -P ([int]$port)) {
  Write-Host "ESP Utility already running on port $port" -ForegroundColor Green
  Write-Host "Status: http://127.0.0.1:$port"
  exit 0
}

if ($useJar -and $jarPath -and (Test-Path $jarPath)) {
  $javaCmd = Get-Command java -ErrorAction SilentlyContinue
  if (-not $javaCmd) {
    Write-Host 'Java not found. Install JDK 17+ (winget install EclipseAdoptium.Temurin.17.JDK).' -ForegroundColor Red
    exit 1
  }
  Stop-PortProcess -P ([int]$port)
  Write-Host 'Starting VSign ESP Utility JAR...' -ForegroundColor Cyan
  Write-Host "  $jarPath"
  Start-Process -FilePath 'java' -ArgumentList @('-jar', $jarPath) -WorkingDirectory $utilityDir -WindowStyle Normal
  Start-Sleep -Seconds 8
  if (Test-PortListen -P ([int]$port)) {
    Write-Host "ESP Utility JAR started on port $port" -ForegroundColor Green
  } else {
    Write-Host "JAR started but port $port not ready yet - check Java window for errors." -ForegroundColor Yellow
  }
  exit 0
}

if ($exePath -and (Test-Path $exePath)) {
  Write-Host 'Starting VSign ESP Utility EXE (set VSIGN_USE_JAR=1 to use vendor JAR instead)...' -ForegroundColor Cyan
  Write-Host "  $exePath"
  Start-Process -FilePath $exePath -WorkingDirectory (Split-Path $exePath)
  Start-Sleep -Seconds 5
  if (Test-PortListen -P ([int]$port)) {
    Write-Host "ESP Utility EXE started on port $port" -ForegroundColor Green
  } else {
    Write-Host "Utility process started but port $port not ready yet." -ForegroundColor Yellow
  }
  exit 0
}

Write-Host 'ESP Utility not found.' -ForegroundColor Red
Write-Host "Copy vendor JAR to $utilityDir\esp-utility.jar then run:" -ForegroundColor Yellow
Write-Host '  .\scripts\install-vsign-jar.ps1 -JarPath C:\Users\DELL\Desktop\YOUR.jar -Start'
exit 1
