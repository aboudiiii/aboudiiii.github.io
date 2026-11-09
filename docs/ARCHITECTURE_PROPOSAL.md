# Architecture Proposal

## 1. Current architecture [V]
```
Browser (GitHub Pages, static HTML/CSS/JS, AR/EN, strict CSP)
   │  fetch (CORS: ALLOWED_ORIGINS)
   ▼
Cloudflare Worker (no deps)  ──►  D1 (ratings, feedback, orders, subscribers,
   ▲   ▲                              login_codes, sessions, rate)
   │   └── Telegram webhook (secret path) ── @HayaliLibraryNews_bot (ratings moderation, login, announce)
   └────── X-Bot-Key ── Store bot @SmartZaki_Bot (Termux on tablet): orders, delivery
Email (planned): Brevo API
```
Strengths: zero build, zero dependencies, near-zero hosting cost, easy to reason about.
Weak points: client-side prices duplicated with the bot; bot runs on a personal tablet (single point of failure); inline scripts block a strict CSP; one large `app.js`.

## 2. Recommended direction: stay static, tighten seams
- Keep GitHub Pages + Worker + D1. No migration is needed to reach the roadmap goals.
- Introduce `assets/products.json` as the single catalog; generate/validate book pages from it with the existing Python scripts (still no runtime build).
- Worker exposes `/api/prices` (read-only) so the bot no longer hard-codes prices/exchange rate.
- Add bot heartbeat endpoint and owner alert when stale.
- Split JS: `core.js` (i18n, theme), `store.js` (cart/catalog), `account.js`, `play.js` — loaded per page.

## 3. Framework migration (documented, **not** proposed now)
| Option | Benefits | Risks / costs |
|---|---|---|
| Astro (static, islands) | Templated pages, i18n routing with real AR/EN URLs, image optimisation, strict CSP without inline scripts, tiny JS | Introduces Node build + CI; contributor must learn tooling; rewrite of 26 pages and 8 scripts; risk of regressions in RTL and motion; GitHub Pages deploy via Actions |
| Eleventy | Closest to current model, low lock-in | Fewer built-in image/i18n features |
| Next.js/React | Rich interactivity | Overkill, heavier JS, hosting changes, higher maintenance |

Recommendation: revisit Astro/Eleventy only if the catalog exceeds ~50 products or real multi-language URLs become a priority. Until then P0–P3 deliver most of the benefit with far less risk.

## 4. Data & integration notes
- D1 schema is a single migration; add migrations per change, never edit `0001`.
- Orders are idempotent on `code`; keep that contract when adding fields.
- Identity: `email` or `tg:<chat_id>`; orders match by email or `telegram_id`. Consider an explicit account-linking step before merging identities.
- Backups: schedule a periodic `wrangler d1 export` via Actions to an artifact (assumption: not currently done [A]).
