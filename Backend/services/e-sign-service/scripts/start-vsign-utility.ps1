# Start VSign ESP Utility on port 7078 (gettxnrefv4_1 / signpdfv4_1).
# Prefers vendor JAR when VSIGN_USE_JAR=1 or esp-utility.jar exists.
param(
  [switch]$ForceJar,
  [switch]$Restart
)

$ErrorActionPreference = 'Stop'

$serviceRoot = Split-Path $PSScriptRoot -Parent
$utilityDir = Join-Path $serviceRoot 'utility'
# Match utility/application.properties server.port (7078 for Verasays-eSign-Web-ASP-4.2.jar)
$port = if ($env:UTILITY_PORT) { $env:UTILITY_PORT } else { '7078' }

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

function Resolve-UtilityJava {
  $candidates = @()
  if ($env:VSIGN_JAVA_HOME) { $candidates += (Join-Path $env:VSIGN_JAVA_HOME 'bin\java.exe') }
  $candidates += @(
    'C:\Users\DELL\Desktop\ASP eSign 2.1_ITIO Innovex Private Limited(UAT)_17-Feb-26\ASP eSign 2.1_ITIO Innovex Private Limited(UAT)_17-Feb-26\UAT\jre\bin\java.exe',
    (Join-Path $utilityDir 'jre\bin\java.exe')
  )
  foreach ($javaPath in $candidates) {
    if ($javaPath -and (Test-Path -LiteralPath $javaPath)) {
      return (Resolve-Path -LiteralPath $javaPath).Path
    }
  }
  $javaCmd = Get-Command java -ErrorAction SilentlyContinue
  if ($javaCmd) {
    $versionLine = & $javaCmd.Source -version 2>&1 | Select-Object -First 1
    if ($versionLine -match 'version "1\.8') {
      return $javaCmd.Source
    }
    Write-Host "WARNING: default java is not 1.8 ($versionLine). Set VSIGN_JAVA_HOME to Java 8 for Verasays JAR." -ForegroundColor Yellow
    return $javaCmd.Source
  }
  return $null
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

$verasaysJar = Get-ChildItem $utilityDir -Filter 'Verasays-eSign-Web-ASP*.jar' -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1 -ExpandProperty FullName
$jarPath = if ($verasaysJar -and (Test-Path $verasaysJar)) {
  $verasaysJar
} else {
  Join-Path $utilityDir 'esp-utility.jar'
}
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
  if (-not $Restart) {
    Write-Host "ESP Utility already running on port $port" -ForegroundColor Green
    Write-Host "Status: http://127.0.0.1:$port"
    Write-Host "Use -Restart after switching UAT/live (utility reads application.properties only at startup)." -ForegroundColor DarkGray
    exit 0
  }
  Write-Host "Restarting ESP Utility on port $port..." -ForegroundColor Cyan
  Stop-PortProcess -P ([int]$port)
}

if ($useJar -and $jarPath -and (Test-Path $jarPath)) {
  $javaExe = Resolve-UtilityJava
  if (-not $javaExe) {
    Write-Host 'Java not found. Install Java 8 (JRE) or set VSIGN_JAVA_HOME.' -ForegroundColor Red
    exit 1
  }
  Stop-PortProcess -P ([int]$port)
  Write-Host 'Starting VSign ESP Utility JAR...' -ForegroundColor Cyan
  Write-Host "  $jarPath"
  Write-Host "  java: $javaExe"
  Start-Process -FilePath $javaExe -ArgumentList @('-jar', $jarPath) -WorkingDirectory $utilityDir -WindowStyle Normal
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
