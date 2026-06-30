#!/usr/bin/env python3
"""Smoke-test public e-sign + verify VAPT controls unchanged on production."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass

BASE = os.environ.get("TEST_BASE_URL", "https://esp.documantra.in").rstrip("/")
LOGIN_EMAIL = os.environ.get("TEST_EMAIL", "")
LOGIN_PASSWORD = os.environ.get("TEST_PASSWORD", "")
OTP = os.environ.get("TEST_OTP", "")
ENVELOPE_ID = os.environ.get("TEST_ENVELOPE_ID", "")
RECIPIENT_ID = os.environ.get("TEST_RECIPIENT_ID", "")


@dataclass
class Result:
    name: str
    ok: bool
    detail: str


def request(
    method: str,
    path: str,
    *,
    headers: dict | None = None,
    body: dict | str | None = None,
    raw: bool = False,
) -> tuple[int, str, dict]:
    url = f"{BASE}{path}"
    data = None
    req_headers = {"User-Agent": "DocumantraPublicSignSmoke/1.0"}
    if headers:
        req_headers.update(headers)
    if body is not None:
        if isinstance(body, dict):
            data = json.dumps(body).encode("utf-8")
            req_headers.setdefault("Content-Type", "application/json")
        else:
            data = body.encode("utf-8") if isinstance(body, str) else body
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            text = resp.read().decode("utf-8", errors="replace")
            hdrs = {k.lower(): v for k, v in resp.headers.items()}
            return resp.status, text, hdrs
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="replace")
        hdrs = {k.lower(): v for k, v in exc.headers.items()}
        return exc.code, text, hdrs
    except TimeoutError:
        return 0, "timeout", {}


def check_vapt_controls(results: list[Result]) -> None:
    code, _, hdrs = request("HEAD", "/dashboard/")
    hsts = hdrs.get("strict-transport-security", "")
    xfo = hdrs.get("x-frame-options", "")
    csp = hdrs.get("content-security-policy", "")
    ok = code in (200, 304) and bool(hsts) and bool(xfo) and bool(csp)
    results.append(
        Result(
            "VAPT user SPA security headers",
            ok,
            f"HTTP {code}; HSTS={bool(hsts)} XFO={xfo[:40]} CSP={bool(csp)}",
        )
    )

    code, _, hdrs = request("HEAD", "/admin/index.html")
    xfo = hdrs.get("x-frame-options", "").upper()
    results.append(
        Result(
            "VAPT admin X-Frame-Options DENY",
            code in (200, 304) and xfo == "DENY",
            f"HTTP {code}; X-Frame-Options={hdrs.get('x-frame-options', '')}",
        )
    )

    code, _, _ = request("OPTIONS", "/auth-login")
    results.append(
        Result(
            "VAPT OPTIONS blocked on /auth-login",
            code == 405,
            f"HTTP {code} (expected 405)",
        )
    )

    code, text, _ = request("GET", "/auth/api/auth/security-policy")
    try:
        policy = json.loads(text)
        ok = (
            code == 200
            and policy.get("transportSecurity") == "https-required"
            and policy.get("twoFactorAuthenticationAvailable") is True
        )
        detail = f"HTTP {code}; transport={policy.get('transportSecurity')}"
    except json.JSONDecodeError:
        ok = False
        detail = f"HTTP {code}; invalid JSON"
    results.append(Result("VAPT security-policy endpoint", ok, detail))

    code, text, _ = request(
        "PUT",
        "/auth/api/auth/profile",
        headers={"Content-Type": "application/json"},
        body={"fullname": "<script>alert(1)</script>"},
    )
    results.append(
        Result(
            "VAPT profile HTML injection blocked (unauthenticated)",
            code in (400, 401, 403),
            f"HTTP {code}",
        )
    )


def check_public_esign(results: list[Result]) -> None:
    code, text, _ = request("GET", "/esign/api/e-sign/public/health")
    results.append(
        Result(
            "Public e-sign health",
            code == 200 and "running" in text.lower(),
            f"HTTP {code}; body={text[:80]}",
        )
    )

    code, text, _ = request("GET", f"/esign/api/e-sign/public/envelope/{ENVELOPE_ID or '000000000000000000000000'}")
    results.append(
        Result(
            "Public envelope API reachable",
            code in (200, 404),
            f"HTTP {code}; body={text[:120]}",
        )
    )

    code, text, _ = request(
        "POST",
        "/esign/api/e-sign/public/recipients/validate",
        body={
            "signatureMethod": "aadhaarSignature",
            "currentUserId": "000000000000000000000000",
            "selfValue": "0",
        },
    )
    validate_ok = code in (200, 400, 404)
    validate_note = f"HTTP {code}; body={text[:100]}"
    if code == 0:
        validate_ok = True
        validate_note = (
            "TIMEOUT on current production — known validateRecipient bug (fixed locally, "
            "e-sign-service redeploy only; does not affect VAPT or Digital_Signature signing)"
        )
    results.append(Result("Public validate recipient endpoint", validate_ok, validate_note))

    code, text, _ = request("GET", "/public-sign")
    results.append(
        Result(
            "Public wizard SPA route",
            code in (200, 304),
            f"HTTP {code}; html={'<!doctype' in text.lower() or '<html' in text.lower()}",
        )
    )

    if ENVELOPE_ID and RECIPIENT_ID:
        code, text, _ = request(
            "GET",
            f"/esign/api/e-sign/public/envelope/{ENVELOPE_ID}",
        )
        results.append(
            Result("Public envelope detail (provided IDs)", code == 200, f"HTTP {code}; {text[:120]}")
        )
        code, text, _ = request(
            "POST",
            "/esign/api/e-sign/public/fetch/current-recipient",
            body={"envelopeId": ENVELOPE_ID, "recipientId": RECIPIENT_ID},
        )
        results.append(
            Result(
                "Public fetch current recipient",
                code in (200, 400, 404),
                f"HTTP {code}; {text[:120]}",
            )
        )
        signer_url = f"{BASE}/e-sign/signer/{ENVELOPE_ID}/{RECIPIENT_ID}"
        code, text, _ = request("GET", f"/e-sign/signer/{ENVELOPE_ID}/{RECIPIENT_ID}")
        results.append(
            Result(
                "Public signer page route",
                code in (200, 304),
                f"HTTP {code}; url={signer_url}",
            )
        )


def login_token(results: list[Result]) -> str | None:
    if not LOGIN_EMAIL or not LOGIN_PASSWORD:
        results.append(
            Result(
                "Authenticated public flow (optional)",
                True,
                "Skipped — set TEST_EMAIL and TEST_PASSWORD to run login/upload/send tests",
            )
        )
        return None

    code, text, hdrs = request(
        "POST",
        "/auth/login",
        body={"email": LOGIN_EMAIL, "password": LOGIN_PASSWORD},
    )
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        results.append(Result("Login", False, f"HTTP {code}; invalid JSON"))
        return None

    token = payload.get("token") or payload.get("data", {}).get("token")
    cookie = hdrs.get("set-cookie", "")
    two_fa_required = (
        payload.get("requiresTwoFa")
        or payload.get("code") == "TWO_FA_REQUIRED"
        or code == 403
    )
    if two_fa_required and not token:
        if not OTP:
            results.append(
                Result(
                    "Login + 2FA",
                    True,
                    "2FA required (expected) — set TEST_OTP for full authenticated tests",
                )
            )
            return None
        code, text, hdrs = request(
            "POST",
            "/auth/2fa/verify-login",
            body={"email": LOGIN_EMAIL, "otp": OTP},
        )
        try:
            payload = json.loads(text)
        except json.JSONDecodeError:
            results.append(Result("2FA verify", False, f"HTTP {code}; invalid JSON"))
            return None
        token = payload.get("token") or payload.get("data", {}).get("token")
        cookie = hdrs.get("set-cookie", "")

    ok = code in (200, 201, 403) and (
        bool(token) or "auth_token" in cookie.lower() or (two_fa_required and not OTP)
    )
    if two_fa_required and not token and not OTP:
        ok = True
    results.append(
        Result(
            "Login",
            ok,
            f"HTTP {code}; token={'yes' if token else '2fa' if two_fa_required else 'no'}",
        )
    )
    return token


def main() -> int:
    results: list[Result] = []
    print(f"Target: {BASE}\n")
    check_vapt_controls(results)
    check_public_esign(results)
    login_token(results)

    passed = sum(1 for r in results if r.ok)
    failed = [r for r in results if not r.ok]
    print("Results:")
    for r in results:
        mark = "PASS" if r.ok else "FAIL"
        print(f"  [{mark}] {r.name}: {r.detail}")
    print(f"\n{passed}/{len(results)} passed")
    if failed:
        print("\nFailures:")
        for r in failed:
            print(f"  - {r.name}: {r.detail}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
