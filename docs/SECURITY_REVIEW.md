# Security Review

Method: static reading of `worker/src/*`, `assets/*.js`, HTML CSP, workflows, plus grep checks. No production probing, no deploy, no secret values read or printed. **[V]** verified in code · **[A]** assumption / needs confirmation.

## Summary
Overall posture is good for a small store: no dependencies, hashed codes and sessions, constant-time secret compares, rate limiting, CORS allow-list. Main gaps are CSP `'unsafe-inline'`, localStorage session token, a weak fallback salt, and wide `innerHTML` use.

## Controls observed [V]
| Area | Control |
|---|---|
| CORS | Allow-list from `ALLOWED_ORIGINS` (default the Pages origin); non-listed origins get the first allowed origin, methods GET/POST/OPTIONS, headers Content-Type/Authorization |
| Auth (email) | Code hashed with salt, 10 min TTL, ≤5 attempts, 60 s resend |
| Auth (Telegram) | 32-hex one-time secret, DB row keyed by its hash, single-use poll, 5 min polling window client-side |
| Sessions | Random token, stored hashed, 30-day expiry, Bearer header |
| Bot API | `X-Bot-Key` constant-time compare; orders idempotent on `code` |
| Telegram webhook | Path secret `/tg/<TG_WEBHOOK_SECRET>`; setup path also secret-gated |
| Abuse | D1 fixed-window rate limiter, honeypot `.hpf`, moderation queue for ratings/comments |
| Secrets | Held in GitHub Actions secrets → `wrangler secret put`; none found in tracked files |
| Cache | `/api/feed` `no-store`; `/api/stats` public 300 s (non-sensitive aggregate) |

## Risks (ranked)
1. **CSP `'unsafe-inline'` for scripts** — reduces XSS defence to output escaping only. Fix: externalise inline scripts, use hashes/nonces (roadmap P0.3).
2. **Session in `localStorage`, 30 days** — any XSS steals it. Mitigate with CSP fix, shorter TTL, "sign out everywhere", or HttpOnly cookie on a same-site API domain (requires custom domain) [A].
3. **`RATE_SALT` fallback `'salt'`** — fail closed instead (P0.1).
4. **`innerHTML` surface (~37 sites)** with multiple `esc()` variants; `boost.js` variant omits `'`. Consolidate and review each site; user-generated content (reviews/comments) must always be escaped or set via `textContent`.
5. **Webhook secret in URL path** — logged by proxies/Cloudflare analytics; Telegram's `secret_token` header is preferable (not currently checked) [V]. Rotate if ever exposed.
6. **Telegram-login phishing/replay** — secret `s` is in a `t.me` deep link; anyone who obtains it before the user taps could claim the session. Low likelihood (5 min, single-use) but note; bind to a short confirmation code displayed on the site as hardening [A].
7. **Non-atomic rate limiter** — minor.
8. **Identity merge** (`tg:<id>` vs email) — orders match by `telegram_id`; ensure no cross-account exposure if a user can type arbitrary identifiers [A: endpoint authorization for `ordersOf` was reviewed only at signature level].
9. **CI supply chain** — tag-pinned actions, unpinned `wrangler@4`, destructive `clear-feedback` workflow; set explicit `permissions:` and require manual approval [A].
10. **Privacy** — Google Fonts leaks visitor IPs to Google; stored IP hashes use the salt from risk 3; owner email public in `config.js` (spam only).

## Not covered
Cloudflare dashboard settings (WAF, bot fight, secrets list), Termux bot code and its key storage on the tablet, payment confirmation process, GitHub repo settings (branch protection, 2FA), formal penetration testing.

## Recommended order
P0 items in `IMPROVEMENT_ROADMAP.md`, then rotate `BOT_API_KEY`/webhook secret if any were ever pasted in chat or logs (the bot key was masked in chat; the webhook secret was not observed) [A].
