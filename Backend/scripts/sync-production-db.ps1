# Sync production MongoDB + e-sign uploads to local dev (Windows).
# Usage (run in YOUR PowerShell — password prompt will appear):
#   cd Backend\scripts
#   .\sync-production-db.ps1
#   .\sync-production-db.ps1 -SkipUploads          # DB only, faster
#   .\sync-production-db.ps1 -UsePutty -PuttySession "esp.documantra.in"
#
# Prerequisites: local MongoDB on 127.0.0.1:27017, mongorestore, SSH to server.
# WARNING: --drop replaces your entire local draftnsign database.

param(
  [string]$ServerHost = "root@157.230.231.148",
  [string]$RemoteProjectPath = "/root/Draft-and-Sign",
  [string]$RemoteDbName = "",
  [string]$LocalDbName = "draftnsign",
  [string]$LocalMongoUri = "mongodb://127.0.0.1:27017",
  [string]$DumpFile = "",
  [switch]$SkipUploads,
  [switch]$UsePutty,
  [string]$PuttySession = ""
)

$ErrorActionPreference = "Stop"
$BackendRoot = Split-Path -Parent $PSScriptRoot
if (-not $DumpFile) {
  $DumpFile = Join-Path $BackendRoot ".live-db-dump.archive.gz"
}

$sshExe = $null
$scpExe = $null
$plinkExe = $null
$pscpExe = $null

foreach ($dir in @(
  "C:\Windows\System32\OpenSSH",
  "C:\Program Files\Git\usr\bin",
  "C:\Program Files\PuTTY"
)) {
  if ($env:PATH -notlike "*$dir*") { $env:PATH = "$dir;$env:PATH" }
}

if ($UsePutty) {
  $plinkExe = (Get-Command plink -ErrorAction SilentlyContinue).Source
  $pscpExe = (Get-Command pscp -ErrorAction SilentlyContinue).Source
  if (-not $plinkExe -or -not $pscpExe) {
    Write-Error "PuTTY plink/pscp not found. Install PuTTY or run without -UsePutty."
  }
} else {
  $sshExe = (Get-Command ssh -ErrorAction SilentlyContinue).Source
  $scpExe = (Get-Command scp -ErrorAction SilentlyContinue).Source
  if (-not $sshExe -or -not $scpExe) {
    Write-Error "Missing ssh/scp. Install OpenSSH Client or run with -UsePutty."
  }
}

function ConvertTo-UnixScript {
  param([string]$Script)
  $lines = $Script -split "`r?`n" | ForEach-Object { $_.TrimEnd("`r") }
  (($lines -join "`n").TrimEnd() + "`n")
}

function Invoke-RemoteBash {
  param([string]$Script)
  $unixScript = ConvertTo-UnixScript $Script
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    if ($UsePutty) {
      $target = if ($PuttySession) { "-load", $PuttySession } else { $ServerHost }
      $lines = $unixScript | & $plinkExe @target "bash -s" 2>&1
    } else {
      $lines = $unixScript | & $sshExe -T -o StrictHostKeyChecking=accept-new $ServerHost "bash -s" 2>&1
    }
    $text = ($lines | ForEach-Object {
      if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.ToString() } else { "$_" }
    }) -join "`n"
    if ($text) {
      $text -split "`n" | ForEach-Object { if ($_) { Write-Host $_ } }
    }
    if ($LASTEXITCODE -ne 0 -and $text -match 'SYNC_DB_NAME=\S+') {
      Write-Host "WARN: Remote bash exit $LASTEXITCODE but dump succeeded; continuing."
    } elseif ($LASTEXITCODE -ne 0) {
      throw "Remote bash script failed (exit $LASTEXITCODE)`n$text"
    }
    return $text
  } finally {
    $ErrorActionPreference = $prev
  }
}

function Invoke-Remote {
  param([string]$Command)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    if ($UsePutty) {
      $target = if ($PuttySession) { "-load", $PuttySession } else { $ServerHost }
      & $plinkExe @target $Command 2>&1 | ForEach-Object {
        if ($_ -is [System.Management.Automation.ErrorRecord]) { Write-Host $_.ToString() } else { Write-Host $_ }
      }
    } else {
      & $sshExe -T -o StrictHostKeyChecking=accept-new $ServerHost $Command 2>&1 | ForEach-Object {
        if ($_ -is [System.Management.Automation.ErrorRecord]) { Write-Host $_.ToString() } else { Write-Host $_ }
      }
    }
    if ($LASTEXITCODE -ne 0) {
      throw "Remote command failed (exit $LASTEXITCODE): $Command"
    }
  } finally {
    $ErrorActionPreference = $prev
  }
}

function Invoke-ScpDownload {
  param([string]$Remote, [string]$Local)
  if ($UsePutty) {
    $target = if ($PuttySession) { "-load", $PuttySession } else { $ServerHost }
    & $pscpExe @target "${Remote}" $Local
  } else {
    & $scpExe -o StrictHostKeyChecking=accept-new "${ServerHost}:${Remote}" $Local
  }
}

function Invoke-ScpUploadDir {
  param([string]$Remote, [string]$Local)
  if ($UsePutty) {
    $target = if ($PuttySession) { "-load", $PuttySession } else { $ServerHost }
    & $pscpExe -r @target "${Remote}" $Local
  } else {
    & $scpExe -o StrictHostKeyChecking=accept-new -r "${ServerHost}:${Remote}" $Local
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
$remoteDbHint = if ($RemoteDbName) { $RemoteDbName } else { "draftnsign" }

Write-Host "==> Creating dump on server (detecting DB name from production)..."
$remoteDumpScript = @'
set -e
DUMP='__DUMP__'
PROJECT='__PROJECT__'
DB='__DB__'
URI=""
dump_ok=0

read_uri_file() {
  local f="$1"
  [ -f "$f" ] || return 1
  grep -E '^MONGO_URI=' "$f" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'"
}

AUTH_C=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -iE 'auth-service' | head -1 || true)
if [ -n "$AUTH_C" ]; then
  URI=$(docker exec "$AUTH_C" printenv MONGO_URI 2>/dev/null || true)
  if [ -z "$URI" ]; then
    URI=$(docker exec "$AUTH_C" node -e "require('dotenv').config(); process.stdout.write(process.env.MONGO_URI||'')" 2>/dev/null || true)
  fi
  [ -n "$URI" ] && echo "MONGO_URI from running container $AUTH_C"
fi

if [ -z "$URI" ]; then
  for envfile in \
    "$PROJECT/.env.prod" \
    "$PROJECT/Backend/services/auth-service/.env" \
    "$PROJECT/Backend/.env"; do
    if URI="$(read_uri_file "$envfile")"; then
      echo "MONGO_URI from $envfile"
      break
    fi
  done
fi

if [ -n "$URI" ]; then
  parsed="${URI#mongodb://}"
  parsed="${parsed#mongodb+srv://}"
  parsed="${parsed##*/}"
  parsed="${parsed%%\?*}"
  if [ -n "$parsed" ]; then DB="$parsed"; fi
fi
echo "Using database: $DB"
[ -n "$URI" ] && echo "Mongo URI host: $(echo "$URI" | sed -E 's|mongodb(\+srv)?://([^/@]*@)?||; s|/.*||')"

if [ -n "$AUTH_C" ]; then
  echo "Auth network mode: $(docker inspect -f '{{.HostConfig.NetworkMode}}' "$AUTH_C" 2>/dev/null || echo unknown)"
  docker exec "$AUTH_C" node -e "
require('dotenv').config();
const m=require('mongoose');
m.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:5000})
 .then(()=>{console.log('Auth DB connected:', m.connection.host+':'+m.connection.port, 'db='+m.connection.name); return m.disconnect();})
 .catch((e)=>{console.error('Auth DB connect failed:', e.message); process.exit(1);});
" || echo "WARN: auth-service cannot reach MongoDB with configured URI"
fi

try_mongodump() {
  local label="$1"
  shift
  echo "Trying: $label"
  if "$@" ; then
    echo "OK: $label"
    return 0
  fi
  echo "FAIL: $label"
  return 1
}

set +e

if [ "$dump_ok" = 0 ]; then
  STOPPED_MONGO=$(docker ps -aq --filter ancestor=mongo:7 2>/dev/null | head -1)
  if [ -n "$STOPPED_MONGO" ]; then
    MONGO_STATE=$(docker inspect -f '{{.State.Status}}' "$STOPPED_MONGO" 2>/dev/null)
    MONGO_NAME=$(docker inspect -f '{{.Name}}' "$STOPPED_MONGO" 2>/dev/null | sed 's/^\///')
    echo "Found mongo container $MONGO_NAME (state: $MONGO_STATE)"
    if [ "$MONGO_STATE" != "running" ]; then
      echo "Starting $MONGO_NAME..."
      docker start "$STOPPED_MONGO"
      sleep 3
    fi
    try_mongodump "started mongo container $MONGO_NAME" sh -c "
      docker exec \"$MONGO_NAME\" mongodump --db=\"$DB\" --archive=/tmp/_live_dump.gz --gzip
      docker cp \"$MONGO_NAME:/tmp/_live_dump.gz\" \"$DUMP\"
      docker exec \"$MONGO_NAME\" rm -f /tmp/_live_dump.gz
    " && dump_ok=1
  fi
fi

if [ -f "$PROJECT/docker-compose.prod.yml" ]; then
  cd "$PROJECT"
  if docker compose -f docker-compose.prod.yml ps -q mongo 2>/dev/null | grep -q .; then
    try_mongodump "docker compose prod mongo" sh -c "
      docker compose -f docker-compose.prod.yml exec -T mongo mongodump --db=\"$DB\" --archive=/tmp/_live_dump.gz --gzip
      CID=\$(docker compose -f docker-compose.prod.yml ps -q mongo | head -1)
      docker cp \"\$CID:/tmp/_live_dump.gz\" \"$DUMP\"
      docker compose -f docker-compose.prod.yml exec -T mongo rm -f /tmp/_live_dump.gz
    " && dump_ok=1
  fi
fi

if [ "$dump_ok" = 0 ]; then
  MONGO_C=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -iE 'mongo' | head -1 || true)
  if [ -z "$MONGO_C" ]; then
    MID=$(docker ps -q --filter ancestor=mongo:7 2>/dev/null | head -1 || true)
    [ -n "$MID" ] && MONGO_C=$(docker inspect -f '{{.Name}}' "$MID" | sed 's/^\///')
  fi
  if [ -n "$MONGO_C" ]; then
    try_mongodump "mongo container $MONGO_C" sh -c "
      docker exec \"$MONGO_C\" mongodump --db=\"$DB\" --archive=/tmp/_live_dump.gz --gzip
      docker cp \"$MONGO_C:/tmp/_live_dump.gz\" \"$DUMP\"
      docker exec \"$MONGO_C\" rm -f /tmp/_live_dump.gz
    " && dump_ok=1
  fi
fi

if [ "$dump_ok" = 0 ] && [ -n "$URI" ]; then
  host_part="${URI#mongodb://}"
  host_part="${host_part#mongodb+srv://}"
  host_part="${host_part%%/*}"
  mongo_host="${host_part%%:*}"
  mongo_port="${host_part#*:}"
  [ "$mongo_port" = "$host_part" ] && mongo_port=27017

  if [ -n "$AUTH_C" ]; then
    NET=$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' "$AUTH_C" | head -1)
  else
    NET=""
  fi

  if systemctl list-unit-files mongod.service &>/dev/null 2>&1; then
    if ! systemctl is-active mongod &>/dev/null; then
      echo "Starting systemd mongod..."
      systemctl start mongod || true
      sleep 2
    fi
  fi

  try_mongodump "host network + URI" \
    docker run --rm --network host -v /tmp:/tmp mongo:7 \
      mongodump --uri="$URI" --archive="$DUMP" --gzip && dump_ok=1 || true

  if [ "$dump_ok" = 0 ]; then
    URI_HOST_GW="${URI//$mongo_host/host.docker.internal}"
    try_mongodump "host-gateway + URI" \
      docker run --rm --add-host=host.docker.internal:host-gateway -v /tmp:/tmp mongo:7 \
        mongodump --uri="$URI_HOST_GW" --archive="$DUMP" --gzip && dump_ok=1 || true
  fi

  if [ "$dump_ok" = 0 ] && [ -n "$NET" ]; then
    URI_BRIDGE="${URI//$mongo_host/172.17.0.1}"
    try_mongodump "bridge network $NET + 172.17.0.1" \
      docker run --rm --network "$NET" -v /tmp:/tmp mongo:7 \
        mongodump --uri="$URI_BRIDGE" --archive="$DUMP" --gzip && dump_ok=1 || true
  fi

  if [ "$dump_ok" = 0 ] && [ -n "$NET" ]; then
    try_mongodump "service network $NET + URI" \
      docker run --rm --network "$NET" -v /tmp:/tmp mongo:7 \
        mongodump --uri="$URI" --archive="$DUMP" --gzip && dump_ok=1 || true
  fi
fi

if [ "$dump_ok" = 0 ] && command -v mongodump >/dev/null 2>&1; then
  try_mongodump "host mongodump" sh -c "
    if [ -n \"$URI\" ]; then mongodump --uri=\"$URI\" --archive=\"$DUMP\" --gzip;
    else mongodump --db=\"$DB\" --archive=\"$DUMP\" --gzip; fi
  " && dump_ok=1
fi

if [ "$dump_ok" = 0 ] && [ -n "$AUTH_C" ]; then
  NETMODE=$(docker inspect -f '{{.HostConfig.NetworkMode}}' "$AUTH_C" 2>/dev/null || true)
  if [ "$NETMODE" = "host" ]; then
    try_mongodump "auth host network namespace" \
      docker run --rm --network "container:$AUTH_C" -v /tmp:/tmp mongo:7 \
        mongodump --uri="$URI" --archive="$DUMP" --gzip && dump_ok=1 || true
  fi
fi

if [ "$dump_ok" = 0 ]; then
  echo "ERROR: MongoDB dump failed."
  echo "Port 27017 listeners:"
  ss -tlnp 2>/dev/null | grep 27017 || echo "(none)"
  echo "mongod service:"
  systemctl is-active mongod 2>/dev/null || echo "(no systemd mongod)"
  echo "All mongo containers:"
  docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' 2>/dev/null | grep -i mongo || echo "(none)"
  echo "Running containers:"
  docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' || true
  exit 1
fi
test -f "$DUMP"
ls -lh "$DUMP"
echo "SYNC_DB_NAME=$DB"
exit 0
'@ -replace '__DUMP__', $remoteDump -replace '__PROJECT__', $RemoteProjectPath -replace '__DB__', $remoteDbHint

try {
  $remoteOut = Invoke-RemoteBash -Script $remoteDumpScript
  if ($remoteOut -match 'SYNC_DB_NAME=(\S+)') {
    $RemoteDbName = $Matches[1]
  } elseif (-not $RemoteDbName) {
    $RemoteDbName = $remoteDbHint
  }
  Write-Host "Production DB: $RemoteDbName -> local DB: $LocalDbName"
} catch {
  $detail = $_.Exception.Message
  Write-Error "Server dump failed.`n$detail"
  exit 1
}

Write-Host "==> Downloading dump..."
Invoke-ScpDownload -Remote $remoteDump -Local $DumpFile
if (-not (Test-Path $DumpFile)) {
  Write-Error "Download failed - dump file not found at $DumpFile"
}
Invoke-Remote -Command "rm -f $remoteDump"

Write-Host "==> Restoring to local ($LocalDbName)..."
& $mongorestore --uri="$LocalMongoUri" --drop --gzip --archive="$DumpFile" --nsFrom="${RemoteDbName}.*" --nsTo="${LocalDbName}.*"

if (-not $SkipUploads) {
  Write-Host "==> Syncing e-sign uploads (PDF files)..."
  $LocalUploads = Join-Path $BackendRoot "services\e-sign-service\uploads"
  New-Item -ItemType Directory -Force -Path $LocalUploads | Out-Null
  Invoke-ScpUploadDir -Remote "/root/Draft-and-Sign/Backend/services/e-sign-service/uploads/." -Local $LocalUploads
}

Write-Host "Done. Local DB now mirrors production ($LocalDbName)."
