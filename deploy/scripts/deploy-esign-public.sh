#!/bin/bash
# Deploy public-sign SPA to esign.documantra.in (same backend e-sign service on :2103).
set -euo pipefail

ROOT="${ROOT:-/root/Draft-and-Sign}"
BRANCH="${BRANCH:-recipient-portal-pandadoc-ux-10-7-26}"
WEB_ROOT="${WEB_ROOT:-/var/www/esign-public}"
NGINX_SITE="${NGINX_SITE:-/etc/nginx/sites-enabled/esign.documantra.in}"

echo "==> Pull $BRANCH"
cd "$ROOT"
git pull --ff-only origin "$BRANCH"

echo "==> Build frontend (public-sign host)"
cd "$ROOT/Frontend"
npm ci
cp "$ROOT/deploy/env/esign-public.env" .env.esign
npm run build:esign-public
rm -f .env.esign

echo "==> Deploy static files"
mkdir -p "$WEB_ROOT"
rsync -a --delete dist/ "$WEB_ROOT/"
chown -R www-data:www-data "$WEB_ROOT" 2>/dev/null || true

echo "==> Install nginx snippets"
cp "$ROOT/deploy/nginx/snippets/vapt-esign-public-spa-headers.conf" /etc/nginx/snippets/
cp "$ROOT/deploy/nginx/snippets/vapt-hide-server-header.conf" /etc/nginx/snippets/ 2>/dev/null || true

if [ ! -f "$NGINX_SITE" ]; then
  echo "==> Install nginx site config"
  cp "$ROOT/deploy/nginx/esign.documantra.in.production.conf.example" "$NGINX_SITE"
fi

nginx -t
systemctl reload nginx

echo "OK: https://esign.documantra.in/"
