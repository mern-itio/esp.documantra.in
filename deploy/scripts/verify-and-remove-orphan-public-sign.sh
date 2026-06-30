#!/usr/bin/env bash
# Verify and remove orphan public-sign test deploy (NOT connected to live).
#
# LIVE (never deleted by this script):
#   /root/Draft-and-Sign          — production git + Docker backend
#   /var/www/draft-and-sign       — production user SPA (nginx root)
#   /root/Admin                   — admin git
#   /var/www/admin-esp            — production admin SPA
#
# Usage on server (PuTTY as root):
#   cd /root/Draft-and-Sign && git pull
#   bash deploy/scripts/verify-and-remove-orphan-public-sign.sh
#   CONFIRM_DELETE=yes bash deploy/scripts/verify-and-remove-orphan-public-sign.sh
#
# Dry-run only (default): prints checks, does NOT delete.

set -euo pipefail

CONFIRM_DELETE="${CONFIRM_DELETE:-no}"
LIVE_PATHS=(
  "/root/Draft-and-Sign"
  "/var/www/draft-and-sign"
  "/root/Admin"
  "/var/www/admin-esp"
)

# Common orphan / test folders (edit after verify step if yours differs)
CANDIDATE_PATHS=(
  "/root/Draft-and-Sign-public-sign"
  "/root/public-sign"
  "/root/Draft-and-Sign-Public-Sign"
  "/var/www/documantra"
  "/var/www/Draft-and-Sign-public-sign"
)

FOUND_ORPHANS=()

section() {
  echo ""
  echo "========== $1 =========="
}

is_live_path() {
  local p="$1"
  for live in "${LIVE_PATHS[@]}"; do
    [[ "$p" == "$live" ]] && return 0
  done
  return 1
}

section "LIVE paths (protected)"
for p in "${LIVE_PATHS[@]}"; do
  if [[ -d "$p" ]]; then
    echo "  OK exists: $p"
  else
    echo "  WARN missing: $p"
  fi
done

section "Scan candidate orphan folders"
for p in "${CANDIDATE_PATHS[@]}"; do
  if [[ -d "$p" ]]; then
    echo "  FOUND: $p"
    FOUND_ORPHANS+=("$p")
    du -sh "$p" 2>/dev/null || true
    if [[ -d "$p/.git" ]]; then
      echo "    git remote: $(git -C "$p" remote get-url origin 2>/dev/null || echo n/a)"
      echo "    git branch: $(git -C "$p" branch --show-current 2>/dev/null || echo n/a)"
    fi
  fi
done

if [[ ${#FOUND_ORPHANS[@]} -eq 0 ]]; then
  echo "  No known candidate folders found. Manual search:"
  echo "    find /root /var/www -maxdepth 2 -type d -iname '*public*sign*' 2>/dev/null"
  FOUND_ORPHANS+=($(find /root /var/www -maxdepth 2 -type d \( -iname '*public*sign*' -o -iname '*public-sign*' \) 2>/dev/null || true))
  # dedupe and remove live paths
  UNIQUE=()
  for p in "${FOUND_ORPHANS[@]}"; do
    [[ -z "$p" || ! -d "$p" ]] && continue
    is_live_path "$p" && continue
    skip=0
    for u in "${UNIQUE[@]:-}"; do [[ "$u" == "$p" ]] && skip=1; done
    [[ $skip -eq 0 ]] && UNIQUE+=("$p")
  done
  FOUND_ORPHANS=("${UNIQUE[@]:-}")
fi

if [[ ${#FOUND_ORPHANS[@]} -eq 0 ]]; then
  echo "  Nothing to remove. Exiting."
  exit 0
fi

section "Verify NO live connection"

check_nginx() {
  local orphan="$1"
  if grep -Rsl "$orphan" /etc/nginx/ 2>/dev/null | head -5; then
    echo "  FAIL nginx references: $orphan"
    return 1
  fi
  echo "  OK nginx does not reference: $orphan"
  return 0
}

check_docker() {
  local orphan="$1"
  if docker ps -a --format '{{.Names}} {{.Mounts}}' 2>/dev/null | grep -F "$orphan"; then
    echo "  FAIL docker mount references: $orphan"
    return 1
  fi
  echo "  OK docker does not mount: $orphan"
  return 0
}

check_processes() {
  local orphan="$1"
  if pgrep -af "$orphan" 2>/dev/null | grep -v "verify-and-remove"; then
    echo "  WARN process still using: $orphan"
    return 1
  fi
  echo "  OK no running process cwd in: $orphan"
  return 0
}

check_ports() {
  section "Dev ports (5173/5174) — should be closed on production"
  ss -tlnp 2>/dev/null | grep -E ':5173|:5174' || echo "  OK no vite dev ports listening"
}

SAFE_TO_DELETE=1
for p in "${FOUND_ORPHANS[@]}"; do
  echo ""
  echo "--- Checks for: $p ---"
  is_live_path "$p" && { echo "  SKIP protected live path"; continue; }
  check_nginx "$p" || SAFE_TO_DELETE=0
  check_docker "$p" || SAFE_TO_DELETE=0
  check_processes "$p" || SAFE_TO_DELETE=0
done

check_ports

section "Production URLs (must stay 200)"
curl -s -o /dev/null -w "  https://esp.documantra.in/public-sign => %{http_code}\n" https://esp.documantra.in/public-sign || true
curl -s -o /dev/null -w "  https://esp.documantra.in/ => %{http_code}\n" https://esp.documantra.in/ || true

section "Stop stray dev servers"
bash "$(dirname "$0")/stop-server-dev-port.sh" 5173 5174 2>/dev/null || {
  fuser -k 5173/tcp 5174/tcp 2>/dev/null || true
  pkill -f 'vite.*--host' 2>/dev/null || true
}

section "Summary — folders marked for removal"
for p in "${FOUND_ORPHANS[@]}"; do
  is_live_path "$p" && continue
  echo "  DELETE: $p"
done

if [[ "$SAFE_TO_DELETE" -ne 1 ]]; then
  echo ""
  echo "ABORT: fix nginx/docker/process references first, then re-run."
  exit 1
fi

if [[ "$CONFIRM_DELETE" != "yes" ]]; then
  echo ""
  echo "DRY RUN complete. To delete after review:"
  echo "  CONFIRM_DELETE=yes bash $0"
  exit 0
fi

section "Deleting orphan folders"
for p in "${FOUND_ORPHANS[@]}"; do
  is_live_path "$p" && continue
  echo "  rm -rf $p"
  rm -rf "$p"
done

echo ""
echo "Done. Verify:"
echo "  ls -la /root/ | grep -i public"
echo "  curl -I https://esp.documantra.in/public-sign | head -3"
echo "  ss -tlnp | grep 5174 || echo '5174 closed'"
