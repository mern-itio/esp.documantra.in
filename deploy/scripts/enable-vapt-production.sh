#!/usr/bin/env bash
# VAPT final step — enable host firewall + optional 2FA policy on production.
# Run on the droplet as root from the repo root:
#   sudo bash deploy/scripts/enable-vapt-production.sh
#
# Optional env overrides:
#   ENABLE_2FA_LOGIN=true|false     (default: true)
#   ENABLE_2FA_ESIGN=true|false     (default: false)
#   REQUIRE_2FA_GRACE_DAYS=30       (default: 30)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND="$ROOT/Backend"
AUTH_ENV="$BACKEND/services/auth-service/.env"
ESIGN_ENV="$BACKEND/services/e-sign-service/.env"

ENABLE_2FA_LOGIN="${ENABLE_2FA_LOGIN:-true}"
ENABLE_2FA_ESIGN="${ENABLE_2FA_ESIGN:-false}"
REQUIRE_2FA_GRACE_DAYS="${REQUIRE_2FA_GRACE_DAYS:-30}"

if [[ "${EUID:-}" -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  touch "$file"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

echo "==> Layer 1: UFW host firewall"
bash "$ROOT/deploy/scripts/harden-firewall.sh"

echo ""
echo "==> Layer 2: 2FA policy env (auth + e-sign)"
upsert_env "$AUTH_ENV" "REQUIRE_2FA_FOR_LOGIN" "$ENABLE_2FA_LOGIN"
upsert_env "$AUTH_ENV" "REQUIRE_2FA_GRACE_DAYS" "$REQUIRE_2FA_GRACE_DAYS"
upsert_env "$AUTH_ENV" "HIDE_ERROR_DETAILS" "true"
upsert_env "$ESIGN_ENV" "REQUIRE_2FA_FOR_E_SIGN" "$ENABLE_2FA_ESIGN"

echo "   auth-service: REQUIRE_2FA_FOR_LOGIN=$ENABLE_2FA_LOGIN, GRACE_DAYS=$REQUIRE_2FA_GRACE_DAYS"
echo "   e-sign-service: REQUIRE_2FA_FOR_E_SIGN=$ENABLE_2FA_ESIGN"

echo ""
echo "==> Restarting services"
cd "$BACKEND"
docker compose up -d --force-recreate auth-service e-sign-service

echo ""
echo "==> Verify security policy"
sleep 3
curl -fsS "https://esp.documantra.in/auth/api/auth/security-policy" | sed 's/,/\n/g' || true

echo ""
echo "==> Verify Docker ports are localhost-only"
ss -tlnp | grep -E '210[0-9]|211[0-9]|3100' || echo "(no matching listeners — check docker compose)"

echo ""
echo "Done."
echo ""
echo "IMPORTANT: Also attach a DigitalOcean Cloud Firewall to this droplet:"
echo "  Inbound allow: TCP 22, 80, 443 from trusted sources"
echo "  Inbound deny: 2101-2115, 3100 from all sources"
echo ""
echo "After pulling latest frontend, users past the grace period without 2FA"
echo "will be guided to /account/security to enable it before full app access."
