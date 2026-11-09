# Al-Hayali Digital Library — Audit Report

Date: 2026-11-10 · Branch: `audit/2026-11-10` · Base: `main` (83 commits, clean tree)
Scope: static site, Cloudflare Worker + D1, GitHub Actions. The Telegram store bot (@SmartZaki_Bot, Termux on the owner's tablet) lives outside this repo and was **not** audited beyond its interface with the Worker.

Legend: **[V]** verified by running a command/reading code in this session · **[A]** assumed / not verifiable from here.
No application file was modified. No secret values are reproduced here.

## 1. Inventory [V]
- Pages: `index.html` (~57 KB), 16 `books/*.html`, 5 `articles/*.html`, `about/terms/privacy/404.html` (26 pages; sitemap lists 25 — `404` is intentionally absent).
- JS: `app.js` (~46 KB, product table `P`, cart, i18n), `boost.js` (~16 KB), `account.js`, `play.js`, `code.js`, `motion.js`, `extra.js`, `config.js`. CSS: single `style.css` (~48 KB).
- Assets: 80 JPGs, `assets/` 7.5 MB, `samples/` 1.6 MB (4 PDFs), `.git` 20 MB. Largest image ≈ 310 KB (`big_i3.jpg`); no WebP/AVIF.
- Worker: `worker/src` ≈ 32 KB, no dependencies, 15 passing tests (node:test + fake D1), migration `0001_init.sql`.
- Workflows: `check-site`, `deploy-worker` (manual), `clear-feedback`.

## 2. What works well [V]
- No build step, no runtime dependencies, no supply-chain surface in the Worker.
- All 16 products render consistently on home, book pages and the Worker product map (390 px and 1280 px, no page errors).
- Every `<img>` in `index.html` and `books/*.html` has `alt`; all pages have a viewport meta; `check_site.py` reports no ERROR; JSON-LD `Product/Offer` on all 16 book pages, `Article` on articles, `ItemList`+`WebSite` on home.
- Secrets scan of tracked files: no tokens/keys found. Worker secrets are injected via GitHub Actions secrets.
- Auth basics are sound: login codes hashed, 10-min TTL, max 5 attempts, 60 s resend limit; session tokens stored hashed (SHA) server-side, 30-day TTL; bot endpoint guarded by constant-time compare of `X-Bot-Key`; Telegram webhook guarded by a secret path; D1 fixed-window rate limiter (`hit()`); honeypot (`.hpf`).
- `prefers-reduced-motion` handled (CSS + `motion.js`); `:focus-visible` rules exist.

## 3. Findings

### High / Medium
| # | Finding | Evidence | Status |
|---|---|---|---|
| F1 | CSP allows `script-src 'unsafe-inline'` and `style-src 'unsafe-inline'`, weakening XSS protection that the strict `default-src 'none'` otherwise gives. | `index.html` meta CSP | [V] |
| F2 | ~37 `innerHTML` writes across 6 JS files, with three separate, slightly different `esc()` helpers (`boost.js` does not escape `'`). Safe today only if every interpolation is escaped; risk grows with each feature. | grep counts: app 15, play 9, boost 7, account 5, code 1 | [V] counts; [A] each call site is safe — not individually reviewed |
| F3 | `RATE_SALT` falls back to the literal `'salt'` when unset; it feeds both IP hashing and login-code hashing. If the secret is ever missing, codes/visitor hashes become guessable offline. | `worker/src/auth.js:6`, `util.js:46` | [V] code; [A] secret is currently set in production |
| F4 | Session token kept in `localStorage` (readable by any script on the origin) for 30 days; combined with F1 any XSS = account takeover. | `assets/account.js` | [V] |
| F5 | Rate limiter is read-then-write (non-atomic); concurrent requests can exceed the limit slightly. Low impact, noted for completeness. | `util.js hit()` | [V] |
| F6 | Order → "most ordered" and purchase history depend on an external bot posting to the Worker; if the bot is stopped, stats silently stall. Prices/`IQD_RATE=1500` are duplicated between site and bot and can drift. | `app.js`, bot patch | [V] site side; [A] bot side |
| F7 | Backup tag `backup-pre-audit-2026-11-10` exists **locally only** (push failed). | `git push` error | [V] |

### SEO / Performance / UX
| # | Finding | Status |
|---|---|---|
| S1 | No `hreflang`; AR/EN switch is client-side on one URL, so English content is not independently indexable. | [V] (0 pages) |
| S2 | Stats strip shows `0 0 0 0` without JS or before scroll (count-up in `motion.js`); crawlers/no-JS users see zeros. Real values: 16/4/2/2. | [V] |
| S3 | JPG-only imagery (80 files, 7.5 MB); no responsive `srcset`/WebP. Cover images up to ~310 KB. | [V] |
| S4 | Google Fonts is the only third-party origin (CSP allows it); adds a render-blocking dependency and a privacy disclosure. | [V] |
| S5 | `404.html` has no description/canonical/og (flagged by `check_site.py`; acceptable for a 404). | [V] |
| S6 | Owner contact email appears in `assets/config.js` (public). Not a secret, but scrapeable. | [V] |
| S7 | No "skip to content" link in `index.html`. | [V] |

### Operations
| # | Finding | Status |
|---|---|---|
| O1 | Actions pinned by tag (`@v4`) and `wrangler@4` unpinned; supply-chain drift possible. Workflow `permissions:` blocks not reviewed. | [V] tags; [A] permissions |
| O2 | `clear-feedback` workflow can delete D1 feedback rows from CI — legitimate but destructive; manual-only trigger should be confirmed. | [A] |
| O3 | Test order `TEST-1` still in production D1; old orders not back-filled from the bot's `orders.db`. | [V] (from earlier session) |
| O4 | Brevo (email subscribe + email-code login) not configured; the email features are hidden/inactive until `BREVO_API_KEY` and `MAIL_FROM` are set and phone verification completes. | [V] |

## 4. Not verified
- Lighthouse/real-device performance numbers; screen-reader behavior; colour-contrast ratios.
- Production Worker secrets and Cloudflare dashboard settings (WAF, rate rules).
- Telegram store bot code, its file-delivery path, and payment confirmation flow.
- Per-call-site XSS review of all `innerHTML` uses.
- `permissions:` blocks and branch protection settings on GitHub.
