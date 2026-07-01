#!/bin/bash
# Install nginx headers-more module and deploy Server banner strip (VAPT L24).
set -euo pipefail

SNIPPET_SRC="$(cd "$(dirname "$0")/.." && pwd)/nginx/snippets/vapt-hide-server-header.conf"
SNIPPET_DST="/etc/nginx/snippets/vapt-hide-server-header.conf"

if ! command -v nginx >/dev/null 2>&1; then
  echo "nginx not found"
  exit 1
fi

if ! dpkg -l libnginx-mod-http-headers-more-filter >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y libnginx-mod-http-headers-more-filter
fi

mkdir -p /etc/nginx/snippets
cp "$SNIPPET_SRC" "$SNIPPET_DST"
chmod 644 "$SNIPPET_DST"

nginx -t
systemctl reload nginx
echo "OK: vapt-hide-server-header.conf installed and nginx reloaded."
