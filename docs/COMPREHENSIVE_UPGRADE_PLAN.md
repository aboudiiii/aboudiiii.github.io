# Comprehensive Upgrade Plan — Al-Hayali Digital Library

Date: 2026-11-10
Target branch: `feature/comprehensive-library-upgrade`
Release policy: no direct commits to `main`; no production Worker deployment or D1 migration without a separate reviewed release.

## Executive summary

The project already has a working, deliberately lightweight architecture:

- GitHub Pages serves the Arabic/English static storefront and book pages.
- A Cloudflare Worker exposes the API.
- Cloudflare D1 stores orders, order items, feedback, subscribers, login codes, sessions and rate-limit records.
- Customer email-code and Telegram login already exist; `/api/me` returns the signed-in customer's order history.
- The storefront already has product selection, a mini-cart, package discounts, saved products and a Telegram checkout hand-off.
- The store/payment bot runs outside this repository. Its payment confirmation and digital-file delivery logic cannot safely be changed from this repository alone.

The upgrade will extend these pieces, not replace them with a framework or a new payment provider. Existing product IDs, product prices, order codes, Telegram deep links and current customer records must remain compatible.

## Current-state findings

### Already present (do not rebuild)

1. Product catalogue for 16 products in `assets/app.js`, mirrored in Worker product names.
2. Cart-like selection and mini-cart; selections currently disappear on reload.
3. Existing bundle discounts for the kids/adult coloring books and the four coloring packs.
4. Customer account login by email code or Telegram and order history.
5. Order ingestion from the external store bot, idempotent by order code.
6. Public per-product order counts; not yet a full revenue dashboard.
7. Feedback moderation, email/Telegram subscribers and announcement workflow.
8. Worker tests and CI checks for the static site, security scan and Worker tests.

### Gaps and constraints

- No verified, owner-only web administration interface exists.
- No coupon data model or server-side redemption flow exists.
- Sales analytics expose product order counts, not a complete finance report; historical orders may have missing totals.
- The customer session token is currently stored in localStorage. CSP still permits inline scripts; these are dedicated security-hardening tasks.
- The checkout/payment and file-delivery bot is external to this repository. A coupon must not reduce the storefront total until the bot validates the same coupon and amount before accepting payment.
- AI response/model features are explicitly out of scope by the owner's decision; no model provider, inference binding, AI API or AI usage budget will be added.

## Delivery phases

### Phase 1 — Storefront reliability and mobile experience
- Persist the current cart selection locally with a versioned key; restore valid product IDs only.
- Preserve the current checkout message, order IDs, product prices, discounts and Telegram hand-off.
- Improve mobile/tablet layout and accessibility with tests at 320, 360, 390, 768 and desktop widths.
- Add empty/error/loading states without hiding existing functionality.

### Phase 2 — Owner-only administration foundation
- Authenticate administrators through the existing Telegram login and verify the authenticated Telegram ID against the server-side `TG_OWNER_ID` secret.
- Add owner-only endpoints for dashboard summary, order lookup, coupon management and audit events.
- Never expose an admin key in HTML, JavaScript, Git history or localStorage.
- Add a D1 migration for coupons and audit records; do not edit `0001_init.sql`.
- Add tests for unauthenticated access, non-owner Telegram users, invalid input and coupon lifecycle.
- Build a separate `admin.html` interface; hide it from public navigation and search indexing.

### Phase 3 — Coupons and promotions
- Support fixed-amount and percentage coupons, start/end dates, usage limits, per-customer limits, minimum basket value and product/category restrictions.
- Validate all coupon calculations on the Worker; never trust a browser-supplied discount.
- Add a signed, short-lived checkout quote or an equivalent server-verified order contract.
- Coordinate the external Telegram store bot before enabling discounted checkout. Until that bot is updated and tested, coupons remain draft/preview-only and must not change the amount requested from the customer.
- Keep current bundle discounts intact and define how they combine with coupons before launch.

### Phase 4 — Sales analytics
- Add owner-only metrics: order count, recorded revenue, average order value, product performance, date filters and coupon usage.
- Distinguish verified totals from orders whose `total_usd` is null; never infer or fabricate revenue.
- Do not import old bot database records until the owner supplies and verifies the source export and mapping.

### Phase 5 — AI library assistant
- Start with retrieval from the actual product catalogue, book descriptions, samples, policies and FAQ.
- Add a model-backed answer layer only after selecting/configuring a provider (for example Cloudflare Workers AI), setting a server-side binding/secret, rate limits, abuse controls and an explicit usage budget.
- Keep answers grounded in the library catalogue; do not claim a product is available or paid unless the API confirms it.
- Do not expose customer records, order history or admin functions to the public assistant.

### Phase 6 — Security, performance and release
- Replace localStorage session storage with a safer cookie-based session only after validating same-site API/domain constraints; otherwise document a mitigation plan.
- Remove inline scripts/styles and tighten CSP in a dedicated migration with regression tests.
- Consolidate HTML escaping and audit all dynamic HTML insertion points.
- Add responsive image formats and loading hints while retaining current fallbacks.
- Run `scripts/check_site.py`, `scripts/security_check.py`, `cd worker && npm test`, mobile/desktop browser checks and an end-to-end checkout regression.
- Deploy static pages and Worker separately. Apply D1 migrations only after a verified backup and staging validation.

## First implementation in this branch

- Persist the existing storefront cart under `hayali_cart_v1`.
- Restore only known product IDs on page load.
- Save the selection whenever the cart changes.
- Leave the legacy `cart` key cleanup untouched and do not change checkout or pricing behavior.

## Release gates

- No direct write to `main`.
- No production D1 migration in this task.
- No Cloudflare Worker deployment in this task.
- No change to the external bot, payment verification or digital-file delivery.
- A feature is not considered live until the PR passes checks, is reviewed and merged, then its deployment is verified.
