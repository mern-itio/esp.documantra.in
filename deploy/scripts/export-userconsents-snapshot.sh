#!/usr/bin/env bash
# Export userconsents collection snapshot for ASP audit (redacted JSON).
# Works without host mongosh — falls back to auth-service container (Node/Mongoose).
#
# Usage on production:
#   cd /root/Draft-and-Sign
#   bash deploy/scripts/export-userconsents-snapshot.sh
#   bash deploy/scripts/export-userconsents-snapshot.sh 50
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND="$ROOT/Backend"
LIMIT="${1:-25}"
OUT_DIR="$ROOT/deploy/docs/asp-audit-annexures"
OUT_FILE="$OUT_DIR/Annexure-A16-UserConsents-Snapshot.json"
DB_NAME="${MONGO_DB:-draftnsign}"

mkdir -p "$OUT_DIR"

MONGOSH_JS="
const limit = ${LIMIT};
const total = db.userconsents.countDocuments();
const rows = db.userconsents.find().sort({ createdAt: -1 }).limit(limit).toArray();
const redact = (doc) => {
  const o = { ...doc };
  if (o.ipAddress) o.ipAddress = String(o.ipAddress).replace(/\\d+$/, 'xxx');
  if (o.userAgent && o.userAgent.length > 80) o.userAgent = o.userAgent.slice(0, 80) + '…';
  return o;
};
print(JSON.stringify({
  exportedAt: new Date().toISOString(),
  database: '${DB_NAME}',
  collection: 'userconsents',
  totalDocuments: total,
  sampleLimit: limit,
  schema: {
    consentType: 'terms_of_service | privacy_policy | marketing_email | esign_electronic_records',
    consentVersion: 'policy version string (default v1)',
    granted: 'boolean',
    subjectType: 'user | recipient | self_signer',
    subjectId: 'ObjectId — user or recipient',
    userId: 'ObjectId | null',
    recipientId: 'ObjectId | null',
    envelopeId: 'ObjectId | null',
    cycleId: 'ObjectId | null',
    source: 'signup | public_signer | powerform | admin | api',
    ipAddress: 'client IP (X-Forwarded-For or socket)',
    userAgent: 'browser user-agent (max 512 chars)',
    metadata: 'optional object',
    createdAt: 'ISO timestamp',
    updatedAt: 'ISO timestamp'
  },
  records: rows.map(redact)
}, null, 2));
"

export_via_mongosh() {
  local runner="$1"
  shift
  "$runner" "$@" --quiet --eval "$MONGOSH_JS"
}

export_via_node() {
  cd "$BACKEND"
  docker compose exec -T auth-service node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const UserConsent = require('./models/UserConsent');
const limit = ${LIMIT};
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const total = await UserConsent.countDocuments();
  const rows = await UserConsent.find().sort({ createdAt: -1 }).limit(limit).lean();
  const redact = (doc) => {
    const o = { ...doc };
    if (o.ipAddress) o.ipAddress = String(o.ipAddress).replace(/\\d+\$/, 'xxx');
    if (o.userAgent && o.userAgent.length > 80) o.userAgent = o.userAgent.slice(0, 80) + '…';
    return o;
  };
  console.log(JSON.stringify({
    exportedAt: new Date().toISOString(),
    database: '${DB_NAME}',
    collection: 'userconsents',
    totalDocuments: total,
    sampleLimit: limit,
    records: rows.map(redact)
  }, null, 2));
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
"
}

if command -v mongosh &>/dev/null; then
  export_via_mongosh mongosh "$DB_NAME" > "$OUT_FILE"
elif command -v mongo &>/dev/null; then
  export_via_mongosh mongo "$DB_NAME" > "$OUT_FILE"
else
  MONGO_CONTAINER="$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i mongo | head -1 || true)"
  if [[ -n "$MONGO_CONTAINER" ]]; then
    docker exec -i "$MONGO_CONTAINER" mongosh "$DB_NAME" --quiet --eval "$MONGOSH_JS" > "$OUT_FILE"
  elif docker compose -f "$BACKEND/docker-compose.yml" ps auth-service 2>/dev/null | grep -q Up; then
    echo "Using auth-service container (mongosh not on host)…" >&2
    export_via_node > "$OUT_FILE"
  elif docker run --rm --network host mongo:7 mongosh "mongodb://127.0.0.1:27017/${DB_NAME}" --quiet --eval "$MONGOSH_JS" > "$OUT_FILE" 2>/dev/null; then
    :
  else
    echo "ERROR: No mongosh and auth-service not running. Install: sudo apt install -y mongodb-mongosh" >&2
    exit 1
  fi
fi

echo "Written: $OUT_FILE"
if command -v mongosh &>/dev/null; then
  echo "Total userconsents: $(mongosh "$DB_NAME" --quiet --eval 'db.userconsents.countDocuments()')"
elif docker compose -f "$BACKEND/docker-compose.yml" ps auth-service 2>/dev/null | grep -q Up; then
  cd "$BACKEND"
  docker compose exec -T auth-service node -e "
require('dotenv').config();
const mongoose=require('mongoose');
(async()=>{await mongoose.connect(process.env.MONGO_URI);console.log('Total userconsents:',await mongoose.connection.db.collection('userconsents').countDocuments());await mongoose.disconnect();})();
"
fi
