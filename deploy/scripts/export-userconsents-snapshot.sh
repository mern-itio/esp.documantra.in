#!/usr/bin/env bash
# Export userconsents collection snapshot for ASP audit (redacted JSON).
# Usage on production:
#   cd /root/Draft-and-Sign
#   bash deploy/scripts/export-userconsents-snapshot.sh
#   bash deploy/scripts/export-userconsents-snapshot.sh 50   # limit rows
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LIMIT="${1:-25}"
OUT_DIR="$ROOT/deploy/docs/asp-audit-annexures"
OUT_FILE="$OUT_DIR/Annexure-A16-UserConsents-Snapshot.json"
DB_NAME="${MONGO_DB:-draftnsign}"

mkdir -p "$OUT_DIR"

mongosh "$DB_NAME" --quiet --eval "
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
" > "$OUT_FILE"

echo "Written: $OUT_FILE"
echo "Total userconsents: $(mongosh "$DB_NAME" --quiet --eval 'db.userconsents.countDocuments()')"
