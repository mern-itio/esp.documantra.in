# VSign environment profiles (UAT vs Live)

Switch between UAT and production **without code changes** — only scripts update `.env`, MongoDB `VSignConfig`, and `utility/application.properties`.

## Quick switch

```powershell
cd Backend/services/e-sign-service

# UAT (logo auth page, IIPLUAT001)
.\scripts\switch-vsign-env.ps1 uat

# Live / production (IIPL001, esign.verasys.in) — esp.documantra.in callback
.\scripts\switch-vsign-env.ps1 live

# Full go-live check (keys + gettxnref + production callback)
.\scripts\go-live-vsign-production.ps1

# With Cloudflare tunnel for local callback
.\scripts\switch-vsign-env.ps1 uat "https://YOUR.trycloudflare.com"
.\scripts\switch-vsign-env.ps1 live "https://YOUR.trycloudflare.com"

# Current profile
.\scripts\switch-vsign-env.ps1 status
```

After every switch:

1. Restart **VSign utility** — `.\scripts\start-vsign-utility.ps1`
2. Restart **e-sign-service** (or wait for nodemon)
3. Create a **new envelope** before signing

## File layout (isolated certs)

| Profile | PFX | Public cert |
|---------|-----|-------------|
| **UAT** | `uploads/vSign/signCertificate.uat.pfx` | `uploads/vSign/ITIO_PUBLIC_KEY.uat.cer` |
| **Live** | `uploads/vSign/signCertificate.pfx` | `uploads/vSign/ITIO_PUBLIC_KEY.cer` |

Live files are **never modified** when switching to UAT.

## First-time UAT setup

1. Copy VSign UAT kit files:

```powershell
.\scripts\setup-vsign-uat-files.ps1 -UatKitDir "C:\path\to\UAT\kit\folder"
```

2. Switch to UAT:

```powershell
.\scripts\switch-vsign-env.ps1 uat "https://YOUR.trycloudflare.com"
```

UAT PFX uses kit defaults (`abc1234` + standard alias) unless you set `config/vsign/secrets/uat.env`.

## Production go-live (esp.documantra.in)

1. **Local verify** (after UAT/tunnel testing works):

```powershell
.\scripts\go-live-vsign-production.ps1
```

2. **Deploy code** to production server (includes CORS + callback fixes).

3. **On server**:

```bash
bash deploy/scripts/deploy-vsign-live.sh
```

4. **VSign utility** must run on the server (Java 8, port 7078) with live PFX in `uploads/vSign/`.

5. **Callback URL** registered with VSign:

`https://esp.documantra.in/esign/api/e-sign/public/v-sign/response`

6. Create a **new envelope** on production and test Aadhaar sign.

If e-sign runs in Docker but utility on host, set `UTILITY_URL=http://host.docker.internal:7078` in production `.env`.

## Profile config

| Path | Purpose |
|------|---------|
| `config/vsign/profiles/uat.json` | UAT URLs, ASP ID, paths |
| `config/vsign/profiles/live.json` | Live URLs, ASP ID, paths |
| `config/vsign/secrets/live.env` | Live PFX password/alias (gitignored) |
| `config/vsign/secrets/uat.env` | Optional UAT overrides |
| `config/vsign/active.profile` | Currently active: `uat` or `live` |
| `config/vsign/tunnel.url` | Last Cloudflare tunnel base URL |

## Legacy scripts

These now delegate to the switcher:

- `node scripts/sync-vsign-uat-config.js [tunnel]`
- `node scripts/sync-vsign-live-config.js [tunnel]`
