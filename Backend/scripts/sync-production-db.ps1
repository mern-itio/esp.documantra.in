# Sync production MongoDB + e-sign uploads to local dev (Windows).
# Usage:
#   1. Edit $ServerHost if needed (SSH alias or user@host).
#   2. Ensure local MongoDB is running on 127.0.0.1:27017.
#   3. Run: .\scripts\sync-production-db.ps1
#
# WARNING: --drop replaces your entire local database.

param(
  [string]$ServerHost = "root@esp.documantra.in",
  [string]$RemoteDbName = "draftnsign",
  [string]$LocalDbName = "draftnsign",
  [string]$LocalMongoUri = "mongodb://127.0.0.1:27017",
  [string]$DumpFile = "",
  [switch]$SkipUploads
)

$ErrorActionPreference = "Stop"
$BackendRoot = Split-Path -Parent $PSScriptRoot
if (-not $DumpFile) {
  $DumpFile = Join-Path $BackendRoot ".live-db-dump.archive.gz"
}

foreach ($cmd in @('ssh', 'scp')) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    $candidates = @(
      "C:\Windows\System32\OpenSSH\$cmd.exe",
      "C:\Program Files\Git\usr\bin\$cmd.exe"
    )
    $found = $false
    foreach ($candidate in $candidates) {
      if (Test-Path $candidate) {
        $dir = Split-Path -Parent $candidate
        if ($env:PATH -notlike "*$dir*") {
          $env:PATH = "$dir;$env:PATH"
        }
        $found = $true
        break
      }
    }
    if (-not $found) {
      Write-Error "Missing '$cmd'. Install OpenSSH Client (Windows Settings -> Optional Features) or use Git Bash."
    }
  }
}

$mongorestore = "mongorestore"
if (-not (Get-Command mongorestore -ErrorAction SilentlyContinue)) {
  $candidates = @(
    "C:\Program Files\MongoDB\Tools\100\bin\mongorestore.exe",
    "C:\Program Files\MongoDB\Server\8.3\bin\mongorestore.exe",
    "C:\Program Files\MongoDB\Server\8.0\bin\mongorestore.exe"
  )
  $found = $false
  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      $mongorestore = $candidate
      $found = $true
      break
    }
  }
  if (-not $found) {
    Write-Error "mongorestore not found. Install MongoDB Database Tools or MongoDB Server."
  }
}

$remoteDump = "/tmp/draftnsign-live-$(Get-Date -Format 'yyyyMMdd-HHmmss').gz"

Write-Host "==> Creating dump on server ($RemoteDbName)..."
ssh $ServerHost "mongodump --db=$RemoteDbName --archive=$remoteDump --gzip"

Write-Host "==> Downloading dump..."
scp "${ServerHost}:${remoteDump}" $DumpFile
ssh $ServerHost "rm -f $remoteDump"

Write-Host "==> Restoring to local ($LocalDbName)..."
& $mongorestore --uri="$LocalMongoUri" --drop --gzip --archive="$DumpFile" --nsFrom="${RemoteDbName}.*" --nsTo="${LocalDbName}.*"

if (-not $SkipUploads) {
  Write-Host "==> Syncing e-sign uploads (PDF files)..."
  $LocalUploads = Join-Path $BackendRoot "services\e-sign-service\uploads"
  New-Item -ItemType Directory -Force -Path $LocalUploads | Out-Null
  scp -r "${ServerHost}:/root/Draft-and-Sign/Backend/services/e-sign-service/uploads/." $LocalUploads
}

Write-Host "Done. Local DB now mirrors production ($LocalDbName)."
