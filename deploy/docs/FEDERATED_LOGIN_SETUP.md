# Federated login setup (DocuMantra)

## Current status

| Provider | UI on login/signup | Backend API | Notes |
|----------|-------------------|-------------|-------|
| **Google** | Yes (`GoogleLogin` button) | `POST /auth/google-login` | Implemented; broken in prod if client IDs are missing/mismatched |
| **Facebook** | No | No | Not implemented yet |
| **LinkedIn** | No | No | Not implemented yet |
| **X (Twitter)** | No | No | Not implemented yet |

Footer social icons (Facebook/LinkedIn/X) are marketing links only — not sign-in.

---

## Why Google login fails today (most common)

1. **Frontend** build missing `VITE_GOOGLE_CLIENT_ID` → falls back to `YOUR_GOOGLE_CLIENT_ID_HERE`
2. **Backend** `auth-service` missing `GOOGLE_CLIENT_ID` in `.env`
3. **Mismatch** — frontend Web client ID ≠ backend verification audience
4. **Google Cloud Console** — `esp.documantra.in` not in Authorized JavaScript origins / redirect URIs

---

## Credentials to provide

### Google (fix existing flow)

Create an OAuth 2.0 **Web application** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

**Authorized JavaScript origins**
- `https://esp.documantra.in`
- `https://esign.documantra.in` (if public-sign host uses Google later)
- `http://localhost:5173` (local dev)

**Authorized redirect URIs** (if using redirect flow later)
- `https://esp.documantra.in/login`
- `http://localhost:5173/login`

**Share with dev team**
- `GOOGLE_CLIENT_ID` (Web client ID, ends with `.apps.googleusercontent.com`)
- Same value as `VITE_GOOGLE_CLIENT_ID` for frontend builds

**Server** (`Backend/services/auth-service/.env`):
```env
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

**Frontend build** (production):
```env
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

Then rebuild frontend + restart `auth-service`.

---

### Facebook (to implement)

[Meta for Developers](https://developers.facebook.com/) → App → Facebook Login.

**Share**
- App ID
- App Secret
- Valid OAuth Redirect URI: `https://esp.documantra.in/auth/facebook/callback`

**Env (planned)**
```env
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=https://esp.documantra.in/auth/facebook/callback
```

---

### LinkedIn (to implement)

[LinkedIn Developer Portal](https://www.linkedin.com/developers/) → Sign In with LinkedIn.

**Share**
- Client ID
- Client Secret
- Redirect URL: `https://esp.documantra.in/auth/linkedin/callback`

**Scopes:** `openid`, `profile`, `email`

**Env (planned)**
```env
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_CALLBACK_URL=https://esp.documantra.in/auth/linkedin/callback
```

---

### X / Twitter (to implement)

[X Developer Portal](https://developer.x.com/) → OAuth 2.0 with PKCE.

**Share**
- Client ID
- Client Secret
- Callback URL: `https://esp.documantra.in/auth/twitter/callback`

**Env (planned)**
```env
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
TWITTER_CALLBACK_URL=https://esp.documantra.in/auth/twitter/callback
```

---

## Production deploy checklist (Google)

```bash
# On server — auth-service .env
GOOGLE_CLIENT_ID=<your-web-client-id>

cd /root/Draft-and-Sign/Backend
docker compose restart auth-service

# Frontend — pass client ID at build time
cd /root/Draft-and-Sign/Frontend
VITE_GOOGLE_CLIENT_ID=<your-web-client-id> npm run build
sudo rsync -av --delete dist/ /var/www/draft-and-sign/
```

---

## Next implementation steps (Facebook / LinkedIn / X)

1. Add provider fields on `User` model (`facebookId`, `linkedinId`, `twitterId`)
2. Add OAuth routes on `auth-service` (`/auth/google-login` pattern per provider)
3. Add login/signup buttons on `LoginPage` / `SignupPage`
4. Register callback URLs in each provider console
5. Test on `esp.documantra.in` with HTTPS

Provide credentials for the providers you want first; we typically ship **Google first**, then add others in order of priority.
