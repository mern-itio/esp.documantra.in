#!/usr/bin/env bash
# Production VSign go-live on esp.documantra.in server.
# Run from repo root on the production VM (as deploy user with docker/sudo access).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ESIGN="$ROOT/Backend/services/e-sign-service"
CALLBACK="https://esp.documantra.in/esign/api/e-sign/public/v-sign/response"

echo "=== VSign production deploy ==="

# 1) Live keys must exist on server (never commit these)
for f in signCertificate.pfx ITIO_PUBLIC_KEY.cer dm_encryption_key.pfx; do
  if [[ ! -f "$ESIGN/uploads/vSign/$f" ]]; then
    echo "ERROR: Missing $ESIGN/uploads/vSign/$f"
    echo "Copy from secure backup (dmsignaturekey kit) before continuing."
    exit 1
  fi
done

if [[ ! -f "$ESIGN/config/vsign/secrets/live.env" ]]; then
  echo "ERROR: Missing $ESIGN/config/vsign/secrets/live.env (PFX_PASSWORD, PFX_ALIAS)"
  exit 1
fi

# 2) Switch profile → production callback (no tunnel)
echo "==> Applying live VSign profile..."
cd "$ESIGN"
node scripts/switch-vsign-env.js live

# 3) Patch Mongo creds from live.env + .env
node scripts/patch-live-mongo-creds.js

# 4) Utility JAR — production ESP URLs (esign.verasys.in)
echo "==> Patching utility/application.properties for production ESP..."
node scripts/vsign-utility-props.js production

# 5) Start / restart VSign utility (Java 8 required)
UTILITY_PORT="${UTILITY_PORT:-7078}"
if command -v systemctl &>/dev/null && systemctl list-unit-files vsign-utility.service &>/dev/null; then
  sudo systemctl restart vsign-utility || true
else
  echo "NOTE: Start VSign utility manually on port $UTILITY_PORT (Java 8):"
  echo "  cd $ESIGN && bash -c './scripts/start-vsign-utility.ps1'  # or run JAR via systemd"
fi

# 6) Rebuild + restart e-sign-service (includes callback CORS fix)
echo "==> Rebuilding e-sign-service..."
cd "$ROOT"
docker compose -f docker-compose.prod.yml build e-sign-service
docker compose -f docker-compose.prod.yml up -d --force-recreate e-sign-service

# 7) Verify callback route via nginx
echo "==> Callback URL: $CALLBACK"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CALLBACK" || echo "000")
echo "    GET probe: HTTP $HTTP_CODE (400/500 expected without txn; 502 = nginx/backend down)"

echo ""
echo "OK: VSign live config applied."
echo "Next: create a NEW envelope on https://esp.documantra.in and test Aadhaar eSign."
echo "Admin: https://esp.documantra.in/e-sign/admin/vsign"
