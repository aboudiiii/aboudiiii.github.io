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
    if "script-src 'unsafe-inline'" in policy:
        warnings.append(f"{page.relative_to(ROOT)}: script-src still allows unsafe-inline")

util = ROOT / "worker/src/util.js"
if not util.exists():
    errors.append("worker/src/util.js is missing")
else:
    source = util.read_text(encoding="utf-8")
    if not re.search(r"if\s*\(!env\.RATE_SALT\)\s*throw", source):
        errors.append("Worker RATE_SALT must fail closed when missing")

workflows = sorted((ROOT / ".github/workflows").glob("*.yml"))
for workflow in workflows:
    source = workflow.read_text(encoding="utf-8")
    if not re.search(r"(?m)^permissions\s*:", source):
        errors.append(f"{workflow.relative_to(ROOT)}: explicit least-privilege permissions missing")

account = ROOT / "assets/account.js"
if account.exists() and re.search(r"localStorage.*hayali_session|hayali_session", account.read_text(encoding="utf-8")):
    warnings.append("Customer session token is stored in localStorage; mitigate XSS and plan HttpOnly-cookie migration")

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
