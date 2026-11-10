#!/usr/bin/env python3
"""Read-only security invariants for the Al-Hayali static site and Worker.

This is a regression guard, not a penetration test. It intentionally reports
known hardening debt as warnings until it can be fixed without breaking pages.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []
warnings = []

pages = sorted(
    list(ROOT.glob("*.html"))
    + list((ROOT / "books").glob("*.html"))
    + list((ROOT / "articles").glob("*.html"))
)
if not pages:
    errors.append("No HTML pages found")

required_csp = ("default-src 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'none'")
for page in pages:
    source = page.read_text(encoding="utf-8")
    match = re.search(
        r'<meta[^>]+http-equiv=["\']Content-Security-Policy["\'][^>]+content="([^"]+)"',
        source,
        re.IGNORECASE,
    )
    if not match:
        errors.append(f"{page.relative_to(ROOT)}: missing CSP meta policy")
        continue
    policy = match.group(1)
    for directive in required_csp:
        if directive not in policy:
            errors.append(f"{page.relative_to(ROOT)}: CSP missing {directive}")
    if re.search(r"""script-src[^;]*['"]unsafe-inline['"]""", policy, re.IGNORECASE):
        errors.append(f"{page.relative_to(ROOT)}: script-src must not allow unsafe-inline")
    executable_inline = re.findall(
        r"<script\\b([^>]*)>([\\s\\S]*?)</script\\s*>", source, re.IGNORECASE
    )
    for attrs, body in executable_inline:
        if "application/ld+json" not in attrs.lower() and body.strip():
            errors.append(f"{page.relative_to(ROOT)}: executable inline script must be externalized")

# User-provided review content must be escaped before HTML insertion.
play = ROOT / "assets/play.js"
if not play.exists():
    errors.append("assets/play.js is missing")
else:
    source = play.read_text(encoding="utf-8")
    for expression, label in (
        ('esc(r.ar||r.en)', "Arabic review text"),
        ('esc(r.en||r.ar)', "English review text"),
        ('esc(r.name||"")', "reviewer name"),
    ):
        if expression not in source:
            errors.append(f"Static review rendering does not escape {label}")

util = ROOT / "worker/src/util.js"
if not util.exists():
    errors.append("worker/src/util.js is missing")
else:
    source = util.read_text(encoding="utf-8")
    if not re.search(r"function\s+salt\s*\(\s*env\s*\)\s*\{[\s\S]{0,300}?if\s*\(\s*!env\.RATE_SALT\s*\)\s*throw", source):
        errors.append("Worker RATE_SALT must fail closed when missing")

workflows = sorted((ROOT / ".github/workflows").glob("*.yml"))
for workflow in workflows:
    source = workflow.read_text(encoding="utf-8")
    if not re.search(r"(?m)^permissions\s*:", source):
        errors.append(f"{workflow.relative_to(ROOT)}: explicit least-privilege permissions missing")

account = ROOT / "assets/account.js"
if account.exists():
    account_source = account.read_text(encoding="utf-8")
    if re.search(r"localStorage.*hayali_session", account_source):
        errors.append("Customer session token must not be persisted in localStorage")
    if "sessionStorage.getItem(KEY)" in account_source:
        warnings.append("Session token remains JavaScript-readable in sessionStorage; HttpOnly cookies require a same-site API domain")

if errors:
    print("SECURITY CHECK: FAIL")
    for item in errors:
        print("ERROR:", item)
    for item in warnings:
        print("WARNING:", item)
    sys.exit(1)

print(f"SECURITY CHECK: PASS ({len(pages)} HTML pages, {len(workflows)} workflows)")
for item in warnings:
    print("WARNING:", item)
print("Note: static regression checks only; not a penetration test.")
