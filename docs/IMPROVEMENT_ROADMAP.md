# Improvement Roadmap (proposal — nothing implemented)

Priorities reference findings in `AUDIT_REPORT.md`. Each item is small and independently shippable; none requires a framework.

## P0 — Security hardening (do first)
1. Make the Worker fail closed when `RATE_SALT` is missing (F3) and add a test.
2. Replace the three `esc()` helpers with one shared helper that also escapes `'`; audit every `innerHTML` call site; prefer `textContent`/DOM building where no markup is needed (F2).
3. Move inline scripts/styles to files and drop `'unsafe-inline'` from the CSP, or switch to hashes (F1).
4. Set explicit least-privilege `permissions:` in all workflows; pin actions by SHA and pin `wrangler` (O1).
5. Push the backup tag, or document that it is local only (F7).

## P1 — Correctness & data integrity
1. Single source of truth for prices/`IQD_RATE` (e.g., a tiny `/api/prices` or a shared JSON the bot reads) (F6).
2. Back-fill script for historic orders from the bot's `orders.db`; delete `TEST-1` (O3).
3. Add a bot heartbeat to the Worker so a stopped bot is visible to the owner via Telegram.
4. Make `hit()` atomic (single `INSERT … ON CONFLICT DO UPDATE … RETURNING`) (F5).

## P2 — SEO
1. Separate AR/EN URLs or at least `hreflang` + `html lang` handling (S1).
2. Server-render real values in the stats strip; use JS only to animate (S2).
3. Keep `sitemap.xml` generation and `check_site.py` as a CI gate (already present).

## P3 — Performance
1. Convert covers to WebP/AVIF with `srcset`/`sizes`; keep JPG fallback (S3).
2. Self-host the two Arabic font weights actually used and update the CSP (S4).
3. Split `app.js` by page (home vs book page) to cut parse time.

## P4 — Accessibility & UX
1. Add skip link, verify heading order, contrast check for the gold-on-ivory pairs in both themes (S7).
2. Keyboard test of cart, lightbox, daily challenge and login dialogs; ensure focus return.
3. Test at 320 px and with 200 % text zoom.

## P5 — Features (after the above)
1. Brevo email subscribe + email-code login once phone verification is done (O4).
2. Back-in-stock/new-title announcements via existing subscriber table.
3. More daily-challenge questions per language.

## P6 — Maintainability
1. Extract the product table `P` into `assets/products.json` consumed by site, book pages generator and Worker tests.
2. Small build-free generator script for `books/*.html` (template already uniform).
3. Expand Worker tests to cover tg-login, orders idempotency and rate-limit edge cases.
