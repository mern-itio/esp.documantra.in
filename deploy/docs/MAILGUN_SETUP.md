# Mailgun Platform Email Setup

All transactional emails (e-sign envelopes, subscription OTP, organization invites, system notifications) are sent through **Mailgun** when configured in the admin panel.

## Admin configuration

1. Open **Admin → Platform email** (`/admin/platform-email`)
2. Create a [Mailgun](https://www.mailgun.com/) account and verify your sending domain
3. Fill in:
   - **Mailgun API key** — from Mailgun → Settings → API keys
   - **Sending domain** — e.g. `mg.documantra.in`
   - **Region** — US or EU (must match your Mailgun account)
   - **DM From email** — address on your verified domain, e.g. `noreply@mg.documantra.in`
   - **DM From name** — `DocuMantra`
4. Choose **Default sender**:
   - **DM email** — all envelope emails use the platform address
   - **User email** — uses the sender’s **From Name / From Email** from **Account → Email Configuration** (still sent via Mailgun)
5. Enable Mailgun and **Save**
6. Use **Send test email** to verify DM and user sender modes

## Sender behaviour

| Mode | From address | When used |
|------|--------------|-----------|
| **DM** | `DocuMantra <noreply@mg...>` | System emails, default envelope sender |
| **User** | User’s configured from-email via Mailgun | When default sender = User and user has email settings |
| **User + Reply-To** | DM address, Reply-To = user email | User mode but no verified from-domain on Mailgun |

Users configure their identity at **Account → Email Configuration** (`/account/email-configuration`).

## Services affected

| Service | Path |
|---------|------|
| email-service | Sends via Mailgun (`/mail/send/:userId`, `/mail/send-by-system`) |
| e-sign-service | Calls email-service for envelope notifications |
| organization-service | Calls email-service for invites |
| subscription-service | Calls email-service for auth OTP |
| auth-service | Calls email-service (`/mail/send-by-system`) for OTP, password reset, login alerts |
| support-service | Calls email-service for admin support notifications |

After saving admin settings, restart:

```bash
cd Backend && docker compose restart email-service auth-service e-sign-service
```

## Environment fallback

If admin Mailgun is not enabled, the system falls back to:

1. `MAILGUN_*` environment variables on the service
2. Per-user SMTP (if **Allow user SMTP fallback** is enabled)

**Do not** use `draftnsign@gmail.com` or Gmail SMTP — configure Mailgun in admin or env for production.

### auth-service / support-service

Set on each service `.env`:

```env
EMAIL_SERVICE_URL=http://email-service:2112
APP_NAME=DocuMantra
```

On the production host (services calling via nginx): `EMAIL_SERVICE_URL=https://esp.documantra.in/email`

Remove legacy Gmail vars (`EMAIL_USER`, `EMAIL_PASS`, `EMAIL_PROVIDER=smtp`) from auth-service so nothing falls back to Gmail.

## Mailgun checklist

- [ ] Domain DNS records verified (SPF, DKIM)
- [ ] DM From email uses verified domain
- [ ] EU/US region matches Mailgun account
- [ ] Test email received (inbox, not spam)
- [ ] Webhook URL for bounces (optional, Mailgun dashboard)
