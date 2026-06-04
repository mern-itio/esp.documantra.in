#!/bin/bash
# Run ON SERVER (165.22.215.73) after git pull / code sync.
set -e
cd "$(dirname "$0")/.."
echo "==> e-sign-service: install deps"
npm install
cd ../../packages/auth-lib && npm install && cd - >/dev/null
echo "==> Set PUBLIC_FLOW_SENDER_ID in .env if not set (required for guest upload)"
grep -q '^PUBLIC_FLOW_SENDER_ID=' .env 2>/dev/null || echo "# PUBLIC_FLOW_SENDER_ID=<mongo_user_id>" >> .env
echo "==> Restart service (pick one that matches your setup)"
if command -v pm2 >/dev/null; then
  pm2 restart e-sign-service 2>/dev/null || pm2 restart all
elif docker compose ps e-sign-service 2>/dev/null | grep -q Up; then
  docker compose restart e-sign-service
else
  echo "Manual: restart node process on port 2103"
fi
sleep 2
curl -sf "http://127.0.0.1:2103/api/e-sign/public/wizard/health" && echo "" && echo "OK: public wizard is live" || echo "FAIL: health check — see logs"
