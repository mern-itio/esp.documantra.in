#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.prod ]]; then
  echo "Missing .env.prod — copy from .env.prod.example and set secrets."
  exit 1
fi

echo "Building and starting production stack..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

echo ""
echo "Stack is up. Nginx listens on host port 8080."
echo "Point your TLS reverse proxy (or host nginx) to 127.0.0.1:8080"
echo "Ensure proxy_set_header X-Forwarded-Proto \$scheme; is set."
echo ""
docker compose -f docker-compose.prod.yml ps
