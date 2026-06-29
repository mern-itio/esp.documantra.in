#!/usr/bin/env bash
# One-shot VAPT deploy for esp.documantra.in
# Safe defaults: 2FA enforcement with 90-day grace (existing users not blocked).
#
# Run on droplet as root:
#   cd /root/Draft-and-Sign && sudo bash deploy/scripts/deploy-vapt-live.sh
#
# Optional env:
#   BRANCH=vapt-changes-24-6-26
#   ADMIN_REPO_DIR=/root/Draft-and-Sign-Admin-Frontend
#   ADMIN_BRANCH=feature/local-prod-setup
#   ENABLE_2FA_LOGIN=true
#   REQUIRE_2FA_GRACE_DAYS=90
#   SKIP_NGINX=1          # skip nginx snippet install
#   SKIP_ADMIN_BUILD=1    # skip admin SPA build

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND="$ROOT/Backend"
FRONTEND="$ROOT/Frontend"
BRANCH="${BRANCH:-vapt-changes-24-6-26}"
ADMIN_REPO_DIR="${ADMIN_REPO_DIR:-/root/Draft-and-Sign-Admin-Frontend}"
ADMIN_BRANCH="${ADMIN_BRANCH:-feature/local-prod-setup}"
ENABLE_2FA_LOGIN="${ENABLE_2FA_LOGIN:-true}"
REQUIRE_2FA_GRACE_DAYS="${REQUIRE_2FA_GRACE_DAYS:-90}"
MAX_CONCURRENT_SESSIONS="${MAX_CONCURRENT_SESSIONS:-5}"

if [[ "${EUID:-}" -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

upsert_env() {
  local file="$1" key="$2" value="$3"
  touch "$file"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

echo "==> [1/8] Pull backend monorepo ($BRANCH)"
cd "$ROOT"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH" || true

echo "==> [2/8] Auth-service VAPT env (non-breaking: 2FA grace + session limits)"
AUTH_ENV="$BACKEND/services/auth-service/.env"
upsert_env "$AUTH_ENV" "MAX_CONCURRENT_SESSIONS" "$MAX_CONCURRENT_SESSIONS"
upsert_env "$AUTH_ENV" "SESSION_IDLE_TIMEOUT_MS" "28800000"
upsert_env "$AUTH_ENV" "REQUIRE_2FA_FOR_LOGIN" "$ENABLE_2FA_LOGIN"
upsert_env "$AUTH_ENV" "REQUIRE_2FA_GRACE_DAYS" "$REQUIRE_2FA_GRACE_DAYS"
upsert_env "$AUTH_ENV" "HIDE_ERROR_DETAILS" "true"
upsert_env "$AUTH_ENV" "ACCESS_TOKEN_EXPIRY" "8h"
upsert_env "$AUTH_ENV" "ADMIN_ACCESS_TOKEN_EXPIRY" "8h"
upsert_env "$AUTH_ENV" "REQUIRE_2FA_FOR_ADMIN_LOGIN" "$ENABLE_2FA_LOGIN"
upsert_env "$AUTH_ENV" "REQUIRE_2FA_ADMIN_GRACE_DAYS" "$REQUIRE_2FA_GRACE_DAYS"
upsert_env "$AUTH_ENV" "AUTH_SERVICE_URL" "http://auth-service:2101"

echo "==> [3/8] Rebuild & restart backend services"
cd "$BACKEND"
docker compose build auth-service organization-service
docker compose up -d auth-service organization-service
docker compose restart admin-service subscription-service api-gateway e-sign-service identity-service

echo "==> [4/8] Build & deploy user frontend"
cd "$FRONTEND"
npm install --legacy-peer-deps
NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}" npm run build
rsync -av --delete dist/ /var/www/draft-and-sign/
chown -R www-data:www-data /var/www/draft-and-sign

if [[ "${SKIP_ADMIN_BUILD:-0}" != "1" && -d "$ADMIN_REPO_DIR" ]]; then
  echo "==> [5/8] Build & deploy admin frontend from $ADMIN_REPO_DIR"
  cd "$ADMIN_REPO_DIR"
  git fetch origin "$ADMIN_BRANCH" || true
  git checkout "$ADMIN_BRANCH" || true
  git pull --ff-only origin "$ADMIN_BRANCH" || true
  npm install --legacy-peer-deps
  NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}" npm run build
  rsync -av --delete dist/ /var/www/admin-esp/
  chown -R www-data:www-data /var/www/admin-esp
else
  echo "==> [5/8] SKIP admin build (set ADMIN_REPO_DIR or unset SKIP_ADMIN_BUILD)"
fi

if [[ "${SKIP_NGINX:-0}" != "1" ]]; then
  echo "==> [6/8] Apply nginx VAPT config (backup + reload)"
  bash "$ROOT/deploy/scripts/apply-nginx-vapt.sh"
else
  echo "==> [6/8] SKIP nginx (SKIP_NGINX=1)"
fi

echo "==> [7/8] Waiting for services"
sleep 4

echo "==> [8/8] Smoke checks"
sleep 4
curl -fsSI "https://esp.documantra.in/" | grep -i "strict-transport-security" || true
curl -fsS "https://esp.documantra.in/auth/api/auth/security-policy" | head -c 400 || true
echo ""
docker compose -f "$BACKEND/docker-compose.yml" ps auth-service organization-service

echo ""
echo "=============================================="
echo " VAPT deploy complete"
echo "=============================================="
echo "Verify:"
echo "  curl -I https://esp.documantra.in/admin/  | grep -i x-frame-options"
echo "  curl -I https://esp.documantra.in/dashboard/ | grep -i x-frame-options"
echo "  curl -X OPTIONS https://esp.documantra.in/auth-login -i | head -5"
echo "  Profile: PUT /auth/api/auth/profile with <script> in fullname → 400"
echo ""
echo "2FA: REQUIRE_2FA_FOR_LOGIN=$ENABLE_2FA_LOGIN grace=${REQUIRE_2FA_GRACE_DAYS}d"
echo "      Existing users keep logging in during grace; then guided to enable 2FA."
echo "Admin 2FA: not yet on AdminUser model — close via policy + user-account 2FA for admin emails."
