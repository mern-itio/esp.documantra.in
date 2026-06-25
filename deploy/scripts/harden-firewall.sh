#!/usr/bin/env bash
# VAPT L32 — restrict inbound to SSH, HTTP, HTTPS only.
# Run on the DigitalOcean droplet as root after Docker ports are bound to 127.0.0.1.
#
# Also create a DigitalOcean Cloud Firewall (Networking → Firewalls) with the same rules
# so ports are blocked at the cloud edge even if ufw is misconfigured.

set -euo pipefail

if [[ "${EUID:-}" -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

if ! command -v ufw >/dev/null 2>&1; then
  echo "Installing ufw..."
  apt-get update -qq && apt-get install -y ufw
fi

ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Restrict SSH to your office IP when possible:
# ufw allow from YOUR.IP.ADDR.HERE to any port 22 proto tcp comment 'SSH admin'

ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP redirect'
ufw allow 443/tcp comment 'HTTPS'

ufw --force enable
ufw status verbose

echo ""
echo "Done. Verify backend ports are NOT public:"
echo "  ss -tlnp | grep -E '210[0-9]|211[0-9]|3100'"
echo "  (should show 127.0.0.1 only, not 0.0.0.0)"
