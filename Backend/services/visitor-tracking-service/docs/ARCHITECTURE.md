# Visitor Journey Tracking — Architecture

## Stack mapping (vs DR)

| DR assumes | DocuMantra / ESP reality |
|------------|--------------------------|
| Next.js App Router | Marketing = Vite React SPA; ESP = React SPA |
| Master DB = PostgreSQL | Master = MongoDB (auth / customers) |
| Tracking DB = PostgreSQL | **Separate PostgreSQL** (this service) — mandatory |

Tracking begins on first marketing/ESP page load via `dm-tracker.js` / ESP `visitorTracker.ts`, not only on `/signup`.

## Databases

1. **Master (MongoDB)** — users, auth, business data. Stores only `visitorId` reference on User (optional thin link).
2. **Visitor Tracking (PostgreSQL)** — all browsing history, sessions, events, IPs, attribution. Disposable; 90-day retention.

Failures in the tracking DB **must not** block signup, login, or page browsing (fire-and-forget / soft-fail).

## Service

- Name: `visitor-tracking-service`
- Port: `2116`
- Public ingest: `POST /track/v1/batch` (CORS from documantra.in + esp.documantra.in)
- Internal link: `POST /internal/v1/link-customer` (shared secret)
- Admin journey: `GET /admin/v1/customers/:customerId/journey` (admin JWT or internal)

## Client cookies (first-party, Domain=.documantra.in)

| Cookie | Purpose |
|--------|---------|
| `dm_vid` | Persistent anonymous visitor UUID |
| `dm_sid` | Session UUID (30 min inactivity) |
| `dm_attr_v1` | First-touch attribution snapshot (existing) |

## Retention

Daily job deletes page_views / sessions / events / observations older than `TRACKING_RETENTION_DAYS` (default 90). Visitor profiles with no remaining data are pruned. Master User rows are never deleted by this job.
