#!/usr/bin/env bash
# Deploy Admin SPA from the SEPARATE admin frontend repo (not inside user monorepo).
#
# Repo: https://github.com/ITIO-Innovex/Draft-and-Sign-Admin-Frontend.git
# Default server path: /root/Admin
# Live static files:  /var/www/admin-esp  (nginx location /admin/)
#
# Usage:
#   ADMIN_REPO_DIR=/root/Admin bash deploy/scripts/deploy-admin.sh
#   # or from admin repo directly:
#   cd /root/Admin && npm run build && sudo rsync -av --delete dist/ /var/www/admin-esp/
set -euo pipefail

ADMIN_REPO_DIR="${ADMIN_REPO_DIR:-/root/Admin}"
DEPLOY_PATH="${ADMIN_DEPLOY_PATH:-/var/www/admin-esp}"
ADMIN_REPO_URL="${ADMIN_REPO_URL:-https://github.com/ITIO-Innovex/Draft-and-Sign-Admin-Frontend.git}"
ADMIN_BRANCH="${ADMIN_BRANCH:-main}"

if [[ ! -d "${ADMIN_REPO_DIR}" ]]; then
  echo "==> Cloning admin repo to ${ADMIN_REPO_DIR}"
  git clone --branch "${ADMIN_BRANCH}" "${ADMIN_REPO_URL}" "${ADMIN_REPO_DIR}"
fi

echo "==> Building Admin from ${ADMIN_REPO_DIR} (separate repo, not user Frontend)"
cd "${ADMIN_REPO_DIR}"

if [[ -d .git ]]; then
  git fetch origin "${ADMIN_BRANCH}"
  git checkout "${ADMIN_BRANCH}"
  git pull --ff-only origin "${ADMIN_BRANCH}" || true
fi

npm install --legacy-peer-deps

if [[ -f .env.production ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
elif [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}" npm run build

echo "==> Deploying dist/ to ${DEPLOY_PATH}"
sudo mkdir -p "${DEPLOY_PATH}"
sudo rsync -av --delete dist/ "${DEPLOY_PATH}/"
sudo chown -R www-data:www-data "${DEPLOY_PATH}"

echo "==> Admin deploy complete (separate repo). Verify: https://esp.documantra.in/admin/"
