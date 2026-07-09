#!/usr/bin/env bash
# Read-only health check: esp.documantra.in MongoDB + security controls (antivirus model).
# Run on the production droplet as root (PuTTY):
#   bash deploy/scripts/check-production-db-and-security.sh
#
# Or from repo on server:
#   cd /var/www/html && bash deploy/scripts/check-production-db-and-security.sh

set -euo pipefail

echo "=============================================="
echo " esp.documantra.in — DB & Security Check"
echo " $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=============================================="
echo ""

echo "==> 1. Host & OS"
hostname -f 2>/dev/null || hostname
lsb_release -ds 2>/dev/null || cat /etc/os-release | head -3
echo ""

echo "==> 2. MongoDB service"
if systemctl is-active mongod &>/dev/null; then
  echo "mongod service: ACTIVE"
  systemctl status mongod --no-pager -l 2>/dev/null | head -5
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -qi mongo; then
  echo "mongod: running in Docker"
  docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -i mongo || true
else
  echo "WARN: mongod service not found — check Docker Compose or install"
fi
echo ""

echo "==> 3. MongoDB port exposure (must be 127.0.0.1 only, NOT 0.0.0.0)"
if command -v ss &>/dev/null; then
  ss -tlnp | grep 27017 || echo "(no listener on 27017 — may use Docker internal network)"
else
  netstat -tlnp 2>/dev/null | grep 27017 || true
fi
echo ""

echo "==> 4. Database list & sizes"
if command -v mongosh &>/dev/null; then
  mongosh --quiet --eval '
    const dbs = db.adminCommand({ listDatabases: 1 }).databases;
    dbs.forEach(d => print(d.name.padEnd(24) + (d.sizeOnDisk/1024/1024).toFixed(2) + " MB"));
  ' 2>/dev/null || echo "mongosh failed — check auth in /etc/mongod.conf"
elif command -v mongo &>/dev/null; then
  mongo --quiet --eval 'db.adminCommand("listDatabases").databases.forEach(function(d){print(d.name)})'
else
  echo "mongosh/mongo CLI not installed"
fi
echo ""

echo "==> 5. draftnsign database — collection counts"
if command -v mongosh &>/dev/null; then
  mongosh draftnsign --quiet --eval '
    const cols = ["users","envelopes","documents","recipients","audittrails","digital signatures","organizations"];
    db.getCollectionNames().sort().forEach(c => {
      try { print(c + ": " + db.getCollection(c).countDocuments()); } catch(e) { print(c + ": error"); }
    });
  ' 2>/dev/null || echo "Cannot open draftnsign — wrong DB name or auth required"
fi
echo ""

echo "==> 6. Recent audit trail sample (last 3)"
if command -v mongosh &>/dev/null; then
  mongosh draftnsign --quiet --eval '
    db.audittrails.find().sort({timestamp:-1}).limit(3).forEach(d => printjson(d));
  ' 2>/dev/null || true
fi
echo ""

echo "==> 7. Backend microservice ports (must bind 127.0.0.1)"
if command -v ss &>/dev/null; then
  ss -tlnp | grep -E '210[0-9]|211[0-9]|3100' || echo "(no backend listeners found)"
fi
echo ""

echo "==> 8. Firewall (UFW)"
ufw status verbose 2>/dev/null | head -15 || echo "UFW not active or not installed"
echo ""

echo "==> 9. fail2ban"
systemctl is-active fail2ban 2>/dev/null && fail2ban-client status 2>/dev/null | head -8 || echo "fail2ban not running"
echo ""

echo "==> 10. Automatic security patches"
systemctl is-active unattended-upgrades 2>/dev/null || echo "unattended-upgrades status unknown"
dpkg -l unattended-upgrades 2>/dev/null | tail -1 || true
echo ""

echo "==> 11. Antivirus / endpoint protection (Linux cloud model)"
echo "Documantra production uses hardened Linux VM controls — NOT a desktop antivirus agent."
AV_FOUND=0
for pkg in clamav clamdscan sophos crowdstrike falcon sentinelagent; do
  if dpkg -l 2>/dev/null | grep -qi "$pkg" || command -v "$pkg" &>/dev/null; then
    echo "  FOUND: $pkg"
    AV_FOUND=1
  fi
done
if [[ "$AV_FOUND" -eq 0 ]]; then
  echo "  No traditional AV packages detected (expected for this architecture)."
  echo "  Compensating controls: DigitalOcean Cloud Firewall, UFW, fail2ban,"
  echo "  unattended-upgrades, Docker isolation, nginx TLS, rate limits."
fi
echo ""

echo "==> 12. Docker services"
docker ps --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null | head -20 || echo "Docker not running"
echo ""

echo "==> 13. Public HTTPS check (from server)"
curl -fsSI https://esp.documantra.in/ 2>/dev/null | head -6 || echo "curl to public URL failed"
echo ""

echo "=============================================="
echo " Done. Share this output for audit / support."
echo "=============================================="
