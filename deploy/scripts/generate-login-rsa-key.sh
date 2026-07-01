#!/bin/bash
# Generate RSA private key for login payload encryption (persist in auth-service .env).
set -euo pipefail
OUT="${1:-login-rsa-private.pem}"
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$OUT"
chmod 600 "$OUT"
echo "Wrote $OUT"
echo "Add to auth-service .env as LOGIN_RSA_PRIVATE_KEY_PEM (escape newlines as \\n on one line), or mount this file."
