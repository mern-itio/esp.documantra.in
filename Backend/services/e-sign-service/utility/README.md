# VSign ESP Utility (partner kit)

Place the **ESP Utility JAR** from VSign / Verasys ASP integration kit here.

Expected filename (any one works):
- `esp-utility.jar`
- `ESPUtility.jar`
- Or any `*.jar` in this folder

## Start

```powershell
cd Backend/services/e-sign-service
.\scripts\start-vsign-utility.ps1
```

Default port: **7077** (`UTILITY_URL=http://127.0.0.1:7077`)

## Production ESP URL (`application.properties`)

Place or edit `utility/application.properties` (loaded when the JAR starts):

```properties
esp21.url.value=https://esign.verasys.in/esign/2.1/signature
esp32.url.value=https://esign.verasys.in/esign/3.2/signature
```

Restart the utility after changes. Mirror the same URL in e-sign `.env`:

```env
VSIGN_ESP_RESPONSE_URL=https://esign.verasys.in/esign/2.1/signature
```

## Obtain JAR

1. **VSign ASP onboarding kit** — contact Verasys / your ASP account manager (ASP ID: `IIPLUAT001`).
2. **Production server** — if already deployed:
   ```bash
   # On India server (example paths — adjust after locate)
   find /root -name "*.jar" 2>/dev/null | grep -iE 'esp|utility|vsign|esign'
   scp root@server:/path/to/esp-utility.jar ./utility/esp-utility.jar
   ```

This JAR is **not** publicly downloadable; it is provided only to registered ASPs.

## Production / live keys

**Admin UI (recommended):** open **`/e-sign/admin/vsign`** in the app (admin login required), or use admin API `GET/PUT /admin/vsign-config` via admin-service.

1. Upload **dmsignaturekey.pfx**, **ITIO_PUBLIC KEY.cer**, **dm_encryption_key.pfx**
2. Enter **PFX password** + **alias**
3. Set **ASP ID** (UAT `IIPLUAT001` until VSign assigns production ID)
4. Toggle **Enable VSign** → Save → **Test connection**

Scripts (alternative):
   ```powershell
   .\scripts\setup-vsign-live-keys.ps1
   ```
2. Set `ASP_ID`, `PFX_PASSWORD`, `PFX_ALIAS` then activate:
   ```powershell
   $env:ASP_ID='YOUR_LIVE_ASP_ID'
   $env:PFX_PASSWORD='...'
   $env:PFX_ALIAS='{GUID}'
   .\scripts\activate-vsign-live-env.ps1
   ```
3. Verify:
   ```powershell
   .\scripts\verify-vsign-live-config.ps1
   ```

Template: `deploy/env/e-sign-service.live.example`  
Production callback: `https://esp.documantra.in/esign/api/e-sign/public/v-sign/response`  
Production auth: `https://esign.vsign.in/esp`
