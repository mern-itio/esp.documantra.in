# Didit Workflows (Admin) — setup & smoke test

DocuMantra Admin mirrors Didit’s **Simple Workflow** loop via Didit’s Management + Sessions APIs. Verification UI stays on Didit hosted pages.

## Services involved

| Service | Role |
|---------|------|
| `identity-service` | Didit API client, local `IdentitySession` store, `/webhook/didit` |
| `admin-service` | BFF: `/admin/didit/workflows*`, `/admin/didit/sessions*` |
| `subscription-service` | `initiate/auth` for `providerType: didit` (requires `DIDIT_WORKFLOW_ID`) |
| Admin SPA | `/admin/workflows`, `/admin/workflows/:id`, `/admin/verification-sessions` |

## Environment (identity-service)

```bash
DIDIT_API_KEY=your_didit_api_key          # fallback if Auth Provider apiKeyRef empty
DIDIT_API_BASE_URL=https://verification.didit.me   # optional
DIDIT_WEBHOOK_URL=https://esp.documantra.in/identity/webhook/didit
DIDIT_WORKFLOW_ID=                        # optional fallback only — prefer Auth Provider field
FRONTEND_URL=https://esp.documantra.in
ESING_SERVICE_URL=https://esp.documantra.in/esign   # note: existing typo env name
IDENTITY_SERVICE_URL=http://identity-service:2114   # used by subscription + admin
```

## Environment (admin-service)

```bash
IDENTITY_SERVICE_URL=http://identity-service:2114
# or public: https://esp.documantra.in/identity
```

Prefer storing the Didit API key on the **Auth Provider** (`config.apiKeyRef`) rather than only in env.

## Admin UI flow

1. Open **Admin → Workflows**
2. **Create workflow** — pick template (KYC / KYC+AML / Biometric), toggle features, save (Didit `POST /v3/workflows/`)
3. Open workflow detail — copy `workflow_id`, optional **Create test session**
4. **Auth Providers** → edit Didit provider → select workflow from dropdown (sets `DIDIT_WORKFLOW_ID`) + set API key + callback URL to identity webhook
5. Send an envelope with that auth method → signer is redirected to Didit → callback updates recipient → returns to signer
6. **Admin → Verification Sessions** — list local sessions; open **Decision** for Didit payload

## Smoke test checklist

- [ ] `GET /admin/didit/workflows` returns Didit list (or empty `results`)
- [ ] Create a Simple KYC workflow from Admin UI
- [ ] Link `workflow_id` on Didit Auth Provider
- [ ] Envelope with Didit auth → signer gets `COMPLETE_IDENTITY_VERIFICATION` + URL
- [ ] Complete verification on Didit → redirect back to `/e-sign/signer/...`
- [ ] Recipient auth status is `completed` (Approved) or `failed` (Declined)
- [ ] Session appears under Verification Sessions with `workflowId` set

## API cheat sheet

```bash
# Via admin BFF (Bearer admin JWT)
curl -H "Authorization: Bearer $ADMIN_JWT" \
  -H "x-didit-api-key: $DIDIT_API_KEY" \
  https://esp.documantra.in/admin/api/admin/didit/workflows

# Identity direct
curl -H "x-didit-api-key: $DIDIT_API_KEY" \
  http://localhost:2114/api/identity/workflows
```

(Adjust admin base path to match your gateway mount for admin-service.)

## Out of scope (v1)

Node-based graph builder, first-party OCR/liveness, KYB/KYT consoles.
