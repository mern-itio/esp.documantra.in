#!/usr/bin/env bash
# Stop accidental Vite/npm dev servers on production (e.g. :5174/public-sign).
# Safe for production: does NOT touch nginx, Docker, or /var/www static deploys.
#
# Usage (on server as root):
#   bash deploy/scripts/stop-server-dev-port.sh
#   bash deploy/scripts/stop-server-dev-port.sh 5174
#   bash deploy/scripts/stop-server-dev-port.sh 5173 5174

set -euo pipefail

PORTS=("$@")
if [[ ${#PORTS[@]} -eq 0 ]]; then
  PORTS=(5173 5174)
fi

echo "==> Stopping dev servers on ports: ${PORTS[*]}"

for PORT in "${PORTS[@]}"; do
  echo ""
  echo "--- Port ${PORT} ---"
  if ss -tlnp 2>/dev/null | grep -q ":${PORT} "; then
    ss -tlnp | grep ":${PORT} " || true
  else
    echo "Nothing listening on ${PORT}"
    continue
  fi

  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${PORT}/tcp" 2>/dev/null || true
    sleep 1
  fi

  PIDS=$(ss -tlnp 2>/dev/null | grep ":${PORT} " | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u || true)
  if [[ -n "${PIDS}" ]]; then
    echo "Killing PIDs: ${PIDS}"
    kill ${PIDS} 2>/dev/null || true
    sleep 1
    kill -9 ${PIDS} 2>/dev/null || true
  fi

  if ss -tlnp 2>/dev/null | grep -q ":${PORT} "; then
    echo "WARN: port ${PORT} still in use"
  else
    echo "OK: port ${PORT} closed"
  fi
done

echo ""
echo "==> Stopping stray vite/npm dev processes (not Docker)..."
pkill -f 'node.*vite.*--host' 2>/dev/null || true
pkill -f 'npm run dev' 2>/dev/null || true

if command -v pm2 >/dev/null 2>&1; then
  pm2 list 2>/dev/null || true
  pm2 delete vite 2>/dev/null || true
  pm2 delete frontend-dev 2>/dev/null || true
fi

echo ""
echo "==> Remaining vite/dev processes:"
ps aux | grep -E 'vite|npm run dev' | grep -v grep || echo "(none)"

echo ""
echo "==> Verify production URLs (nginx static — should stay 200):"
curl -s -o /dev/null -w "https://esp.documantra.in/public-sign => %{http_code}\n" https://esp.documantra.in/public-sign || true
curl -s -o /dev/null -w "https://esp.documantra.in/ => %{http_code}\n" https://esp.documantra.in/ || true

echo ""
echo "==> Verify dev ports closed from localhost:"
for PORT in "${PORTS[@]}"; do
  if curl -s -m 2 -o /dev/null "http://127.0.0.1:${PORT}/" 2>/dev/null; then
    echo "WARN: http://127.0.0.1:${PORT}/ still responds"
  else
    echo "OK: http://127.0.0.1:${PORT}/ not reachable"
  fi
done

echo ""
echo "Done. Use https://esp.documantra.in/public-sign (not http://IP:5174)."
