#!/usr/bin/env bash
# Safe nginx VAPT patch — copies header snippets, enables http2, adds /auth-login redirect.
# Does NOT overwrite the whole site (DigiLocker webhook / identity routes stay intact).
#
# After running, merge includes from:
#   deploy/nginx/esp.documantra.in.production.conf.example
# into location /, /admin/, and = /index.html blocks.
#
#   sudo bash deploy/scripts/apply-nginx-vapt.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SNIPPETS_SRC="$ROOT/deploy/nginx/snippets"
NGINX_SITE="${NGINX_SITE:-/etc/nginx/sites-enabled/esp.documantra.in}"

if [[ "${EUID:-}" -ne 0 ]]; then
  echo "Run as root"
  exit 1
fi

mkdir -p /etc/nginx/snippets
cp "$SNIPPETS_SRC/vapt-user-spa-headers.conf" /etc/nginx/snippets/
cp "$SNIPPETS_SRC/vapt-admin-spa-headers.conf" /etc/nginx/snippets/
echo "==> Snippets installed in /etc/nginx/snippets/"

if [[ ! -f "$NGINX_SITE" ]]; then
  echo "WARN: $NGINX_SITE not found — copy deploy/nginx/esp.documantra.in.production.conf.example manually"
  exit 0
fi

BACKUP="${NGINX_SITE}.bak.$(date +%Y%m%d%H%M%S)"
cp "$NGINX_SITE" "$BACKUP"
echo "==> Backed up → $BACKUP"

sed -i 's/listen 443 ssl;/listen 443 ssl http2;/g' "$NGINX_SITE" || true
sed -i 's/listen \[::\]:443 ssl;/listen [::]:443 ssl http2;/g' "$NGINX_SITE" || true

if ! grep -q "location = /auth-login" "$NGINX_SITE"; then
  # Insert before final closing brace of server block (last line with lone })
  sed -i '${ 
    /^}$/i\
    location = /auth-login {\
        if ($request_method = OPTIONS) { return 405; }\
        return 301 /login;\
    }
  }' "$NGINX_SITE" 2>/dev/null || {
    echo "WARN: Could not auto-add /auth-login block — add manually from production.conf.example"
  }
fi

if ! grep -q "vapt-admin-spa-headers" "$NGINX_SITE"; then
  echo ""
  echo "MANUAL (required for L4/L5 close): edit $NGINX_SITE"
  echo "  Inside 'location /admin/' add:"
  echo "    include /etc/nginx/snippets/vapt-admin-spa-headers.conf;"
  echo "    if (\$request_method = OPTIONS) { return 405; }"
  echo "  Inside 'location /' and 'location = /index.html' add:"
  echo "    include /etc/nginx/snippets/vapt-user-spa-headers.conf;"
  echo "    if (\$request_method = OPTIONS) { return 405; }"
  echo ""
  echo "Reference: $ROOT/deploy/nginx/esp.documantra.in.production.conf.example"
fi

nginx -t && systemctl reload nginx
echo "==> nginx reloaded (http2 + snippets ready)"
