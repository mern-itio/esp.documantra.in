# VAPT Retest Evidence — esp.documantra.in

**Application:** Documantra (ESP)  
**Environment:** Production — `https://esp.documantra.in`  
**Assessment date:** 29 June 2026  
**Branch:** `vapt-changes-24-6-26` (backend), `feature/local-prod-setup` (admin)

---

## Executive summary

| Severity (original retest) | Open before fix | Closed after deploy | Partial / policy |
|----------------------------|-----------------|---------------------|------------------|
| HIGH (SSRF) | 1 | 1 | 0 |
| MEDIUM | Multiple | Addressed in branch | — |
| LOW (9 open) | 9 | 8 closed | 1 (npm components — mitigated) |

All user-facing and admin flows (login, 2FA, e-sign, DigiLocker webhook) were preserved. 2FA rollout uses a **90-day grace period** for existing accounts.

---

## Evidence collection commands

Run from any machine with network access to production:

```bash
BASE=https://esp.documantra.in

# HTTP/2 + transport
curl -sSI "$BASE/" | head -5

# User SPA security headers
curl -sSI "$BASE/dashboard/" | grep -iE 'strict-transport|x-frame-options|content-security-policy|x-content-type'

# Admin clickjacking (DENY)
curl -sSI "$BASE/admin/index.html" | grep -iE 'x-frame-options|content-security-policy'

# OPTIONS enumeration blocked
curl -sSI -X OPTIONS "$BASE/auth-login" | head -5

# Security policy (2FA, sessions)
curl -sS "$BASE/auth/api/auth/security-policy" | python3 -m json.tool

# DigiLocker webhook route alive (not 404)
curl -sSI -X POST "$BASE/webhook/surepass-digilocker" | head -5
```

### Authenticated tests (after user login + 2FA)

```bash
export TOKEN="<Bearer JWT>"

# L2 — Profile HTML injection blocked (400)
curl -sS -w "\nHTTP:%{http_code}\n" -X PUT "$BASE/auth/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"fullname":"<script>alert(1)</script>"}'

# HIGH SSRF — logo URL blocked (400)
curl -sS -w "\nHTTP:%{http_code}\n" -X POST "$BASE/organization/api/organization/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"SSRF Test","logo":"http://169.254.169.254/"}'
```

**Expected:** Profile → `400` + disallowed characters. SSRF → `400` + Invalid or disallowed logo URL.

---

## Finding-by-finding status

### HIGH — Blind SSRF on organization logo (CWE-918)

| Item | Detail |
|------|--------|
| Status | CLOSED |
| Fix | ssrfGuard + resolveLogoInput (logo + logoUrl alias) |
| Evidence | POST create org with metadata IP → HTTP 400 |

### LOW L1 — Known vulnerable components (CWE-1104)

| Item | Detail |
|------|--------|
| Status | MITIGATED |
| Fix | react-router-dom@6.30.4, axios@1.12.2+, npm audit fix |

### LOW L2 — Profile input validation (CWE-20)

| Item | Detail |
|------|--------|
| Status | CLOSED |
| Evidence | script tag in fullname → HTTP 400 |

### LOW L3 — HTTP OPTIONS on /auth-login (CWE-346)

| Item | Detail |
|------|--------|
| Status | CLOSED |
| Evidence | OPTIONS → HTTP 405 |

### LOW L4 — Missing security headers (CWE-693)

| Item | Detail |
|------|--------|
| Status | CLOSED |
| Evidence | HSTS, CSP, X-Frame-Options on /dashboard/ |

### LOW L5 — Clickjacking admin (CWE-1021)

| Item | Detail |
|------|--------|
| Status | CLOSED |
| Evidence | X-Frame-Options: DENY on /admin/index.html |

### LOW L6 — HTTP/1.1 outdated (CWE-444)

| Item | Detail |
|------|--------|
| Status | CLOSED |
| Evidence | HTTP/2 in curl -I |

### LOW L7 — 2FA not enabled (CWE-306)

| Item | Detail |
|------|--------|
| Status | CLOSED |
| Fix | User + Admin TOTP; 90-day grace via env |

### LOW L8 — Concurrent logins (CWE-613)

| Item | Detail |
|------|--------|
| Status | CLOSED |
| Evidence | maxConcurrentSessions: 5 in security-policy |

### LOW L9 — Autocomplete on login (CWE-522)

| Item | Detail |
|------|--------|
| Status | CLOSED |
| Evidence | autocomplete=off on login fields |

---

## Deployment reference

```bash
cd /root/Draft-and-Sign && git pull origin vapt-changes-24-6-26
sudo bash deploy/scripts/deploy-vapt-live.sh

cd /root/Admin && git pull origin feature/local-prod-setup
npm run build && sudo rsync -av --delete dist/ /var/www/admin-esp/
```
