#!/usr/bin/env python3
"""Generate Daily Activity Report (DAR) for DocuMantra / ESP project."""
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "deploy" / "docs"

ORG = "ITIO Innovex Pvt Ltd"
PRODUCT = "DocuMantra (ESP)"
URL = "https://esp.documantra.in"
BRANCH = "recipient-portal-pandadoc-ux-10-7-26"
ADMIN_BRANCH = "feature/local-prod-setup"
PREPARED_BY = "Technical Lead / Development Team"
REPORT_DATE = "20 July 2026"
OUT = OUT_DIR / "DAR-20-July-2026.docx"


def add_meta_table(doc: Document, rows: list[tuple[str, str]]) -> None:
    table = doc.add_table(rows=len(rows), cols=2)
    table.style = "Table Grid"
    for i, (key, value) in enumerate(rows):
        table.rows[i].cells[0].text = key
        table.rows[i].cells[1].text = value
        for cell in table.rows[i].cells:
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(10)


def main() -> None:
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)

    title = doc.add_heading("Daily Activity Report (DAR)", 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.add_run(f"{ORG}\n{PRODUCT} — {URL}\n")

    doc.add_paragraph()
    add_meta_table(
        doc,
        [
            ("Report date", REPORT_DATE),
            ("Prepared by", PREPARED_BY),
            ("Git branch (user app)", BRANCH),
            ("Git branch (admin app)", ADMIN_BRANCH),
            ("Environment", "Development + production verification (esp.documantra.in)"),
            ("Report type", "Daily Activity Report (DAR)"),
        ],
    )
    doc.add_paragraph()

    sections = [
        (
            "1. Executive summary",
            [
                "Stabilized end-to-end signup: single-page flow with pre-register email OTP, Terms acceptance, clearer email-exists UX, and register no longer failing with 400 after successful email verification.",
                "Fixed Google OAuth production failures (502 / rate-limit / duplicate token exchange) and signup password visibility after email verification.",
                "Resolved dashboard crash (Recharts toUpperCase on undefined) with safe chart colors, scales, and ChartErrorBoundary.",
                "Credits & Usage: added Add credits purchase CTA; billing amounts display in package currency (INR/USD/EUR/GBP) instead of forced USD→INR.",
                "Admin Credit Package modal: currency selector; subscription-service validates and persists currency; Stripe checkout uses admin-configured currency as-is.",
                "Thirteen commits pushed on user branch recipient-portal-pandadoc-ux-10-7-26 (39c1c15 through 299618e); one admin commit (65e1c90) on feature/local-prod-setup.",
            ],
        ),
        (
            "2. Signup flow — OTP, Terms, and register 400 fix",
            [
                "Redesigned signup as single-page flow with pre-register email verification (OTP) before account creation.",
                "Aligned signup visual theme with login; improved email-already-exists messaging.",
                "Required Terms of Service acceptance before submit.",
                "Root cause of register 400: backend required both a valid email-verification JWT and a DB verified row — raced with OTP resend / replica lag.",
                "Fix: trust email-verification JWT alone; idempotent register when user already exists with matching password; clearer phone/email conflict errors; consent write failures non-blocking.",
                "Password policy / special-character validation aligned between frontend and backend validators.",
                "Commits: 375a038, b83e923, d9c9912, 39893bf, 39c1c15, 1787f1b.",
            ],
        ),
        (
            "3. Google OAuth and signup password UX",
            [
                "Fixed Google OAuth callback rate limiting and duplicate token exchange causing failed logins.",
                "Fixed Google OAuth 502 on production code exchange path.",
                "Reveal signup passwords after email verification step so users can complete registration without retyping blindly.",
                "Commits: 55bbd5e, 57c1f3b.",
            ],
        ),
        (
            "4. Dashboard chart crash (Recharts)",
            [
                "Production /dashboard crashed: Cannot read properties of undefined (reading 'toUpperCase') inside vendor-charts.",
                "Cause: chart color props used CSS variables (var(--*)) and empty/undefined series data reached Recharts color normalization.",
                "Fix: hex chart colors, explicit axis scales, ChartErrorBoundary, sanitized chart datasets for empty states.",
                "Commits: d2e7aad, c142704.",
            ],
        ),
        (
            "5. Credits & Usage — purchase CTA and currency display",
            [
                "Credits & Usage page: Add credits opens CreditPurchaseModal for top-up.",
                "Introduced billingCurrency helpers; subscription/invoice amounts format by currency code.",
                "Stopped forcing USD→INR so admin-selected package currency (e.g. USD) shows correctly in user checkout UI.",
                "Flexible package API returns currency for frontend formatting.",
                "Commits: 845b1a3, 299618e.",
            ],
        ),
        (
            "6. Admin credit package currency + Stripe",
            [
                "Admin SPA (Draft-and-Sign-Admin-Frontend / server path /root/Admin): currency dropdown (INR/USD/EUR/GBP) on fixed and flexible credit packages.",
                "Main repo subscription-service: validate currency on create/update; allow currency-only updates; Stripe PaymentIntent/Checkout uses package currency without usd→inr override.",
                "Commits: user 3ed4ffa, 299618e; admin 65e1c90.",
            ],
        ),
        (
            "7. Commits pushed (20 July 2026) — user app",
            [
                "39c1c15 — Fix signup password validation and auth admin route self-check.",
                "1787f1b — Fix signup OTP flow and transactional email delivery.",
                "375a038 — Redesign signup as single-page flow with pre-register email verification.",
                "b83e923 — Align signup page with login theme and improve email-exists UX.",
                "55bbd5e — Fix Google OAuth callback rate limiting and duplicate token exchange.",
                "d2e7aad — Redesign signup page and fix dashboard chart crash on empty data.",
                "57c1f3b — Fix Google OAuth 502 and reveal signup passwords after email verification.",
                "d9c9912 — Require Terms acceptance before signup submission.",
                "39893bf — Fix signup register 400 by trusting email verification JWT.",
                "c142704 — Fix dashboard chart crash from Recharts toUpperCase on undefined.",
                "845b1a3 — Add credit purchase on Credits & Usage and default billing to INR.",
                "3ed4ffa — Allow admin credit packages to set billing currency.",
                "299618e — Respect admin-configured credit package currency in checkout UI and Stripe.",
            ],
        ),
        (
            "8. Commits pushed (20 July 2026) — admin app",
            [
                "65e1c90 — Add currency selector to credit add-on package admin UI.",
            ],
        ),
        (
            "9. Testing & verification",
            [
                "Verified signup email OTP → register path no longer returns 400 after successful verification.",
                "Verified dashboard loads without Recharts toUpperCase crash on empty/partial analytics data.",
                "Verified Credits & Usage shows Add credits and formats amounts using package currency.",
                "Verified admin package currency persists and user modal / Stripe path respect selected currency (no forced INR when admin sets USD).",
            ],
        ),
        (
            "10. Production deploy steps",
            [
                "User app server: git pull origin recipient-portal-pandadoc-ux-10-7-26",
                "Rebuild/restart: auth-service, subscription-service (and email-service if OTP email changes not yet live).",
                "Frontend: cd Frontend && npm run build && sudo rsync -av --delete dist/ /var/www/draft-and-sign/",
                "Admin app server: cd /root/Admin && git pull (feature/local-prod-setup) && npm run build && deploy to /var/www/admin-esp",
                "Smoke test: signup OTP+register, Google login, /dashboard charts, Credits & Usage purchase modal currency, admin package currency save.",
            ],
        ),
        (
            "11. Pending / next steps",
            [
                "Confirm production deploy of auth-service + subscription-service + user Frontend + Admin SPA for today's currency and signup fixes.",
                "End-to-end Stripe test purchase in both INR and USD packages on staging/production.",
                "Monitor Google OAuth and signup register error rates after JWT-trust change.",
                "Continue unrelated local WIP separately (support-service, cookie preference, DAR archive docs, surepass-estamp-local) — not part of today's pushed scope.",
            ],
        ),
    ]

    for heading, bullets in sections:
        doc.add_heading(heading, 1)
        for item in bullets:
            doc.add_paragraph(item, style="List Bullet")

    doc.add_paragraph()
    footer = doc.add_paragraph(
        "This DAR is prepared for internal tracking and management review. "
        "Redact credentials and customer PII before external distribution."
    )
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
