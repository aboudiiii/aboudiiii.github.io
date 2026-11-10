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

### Phase 5 — Security, performance and release
- Replace localStorage session storage with a safer cookie-based session only after validating same-site API/domain constraints; otherwise document a mitigation plan.
- Remove inline scripts/styles and tighten CSP in a dedicated migration with regression tests.
- Consolidate HTML escaping and audit all dynamic HTML insertion points.
- Add responsive image formats and loading hints while retaining current fallbacks.
- Run `scripts/check_site.py`, `scripts/security_check.py`, `cd worker && npm test`, mobile/desktop browser checks and an end-to-end checkout regression.
- Deploy static pages and Worker separately. Apply D1 migrations only after a verified backup and staging validation.

## Implemented in this branch

- Persist the storefront cart under `hayali_cart_v1`; restore only known product IDs and save on cart changes.
- Add owner-only dashboard APIs, guarded by the existing Telegram login and server-side `TG_OWNER_ID`.
- Add sales summary: total orders, recorded revenue, missing totals, product counts, daily totals and recent orders.
- Add coupon creation, activation/deactivation, deletion and audit logging.
- Add a responsive, `noindex` `admin.html` page with Telegram owner login, dashboard and coupon management.
- Add D1 migration `0002_admin_coupons.sql` and tests for authorization, analytics and coupon lifecycle.
- Add a Content Security Policy to the admin page and update site checks to keep private noindex pages out of the public sitemap.
- Keep AI/model-based response features explicitly excluded.
- Coupon redemption and checkout price changes are not enabled: the external store/payment bot must validate the same coupon and final amount before a real discount can be charged.

## Release gates

- No direct write to `main`.
- No production D1 migration in this task.
- No Cloudflare Worker deployment in this task.
- No change to the external bot, payment verification or digital-file delivery.
- A feature is not considered live until the PR passes checks, is reviewed and merged, then its deployment is verified.
