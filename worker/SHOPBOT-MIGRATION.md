# ShopBot → Cloudflare Workers migration

This migration is intentionally additive. It does not modify the existing website tables
(`orders`, `order_items`, `feedback`, `sessions`, etc.) or replace the current
website/announcement Telegram webhook.

## Target runtime

- Cloudflare Worker: same `hayali-reviews` Worker, separate `/shop-tg/<secret>` route.
- D1: existing `hayali` database, new `shop_*` tables only.
- R2: private product files and covers (object keys stored in `shop_products`).
- Telegram Bot API: dedicated ShopBot token, distinct from the website announcement bot.
- Webhook secret: separate `SHOP_TG_WEBHOOK_SECRET`; validate Telegram's
  `X-Telegram-Bot-Api-Secret-Token` header.
- No long polling, local SQLite, local disk, Termux process, or qpdf dependency.

## Porting inventory from the legacy Python bot

The inspected `bot.py` contains:
- bilingual catalog, sections, country pricing and A4/Letter/both selection;
- carts, coupon/referral discounts and order creation;
- manual payment instructions and receipt-photo submission;
- owner approval/rejection, delivery and resend limit;
- customer order history/cancellation, support relay, samples and follow-ups;
- admin commands for orders, stats, coupons, broadcasts and backups;
- review/comment workflow and daily scheduled jobs.

The current Worker already has website account/order reporting, feedback, customer login,
newsletter, announcements and scheduled reporting. Those features must remain intact.

## Important behavioral corrections during migration

1. Coupon usage is reserved/consumed at order creation in the legacy bot. The new
   implementation must reserve it atomically and release it on cancellation/rejection,
   or consume only on approval. Do not trust a client-calculated discount.
2. Order state changes must be conditional SQL updates to prevent double approval,
   double coupon consumption and duplicate delivery.
3. Telegram update IDs are persisted in `shop_webhook_updates` for webhook idempotency.
4. Each product delivery gets a durable attempt record. A retry must not silently exceed
   the legacy five-download limit.
5. Admin-only actions must verify the Telegram sender ID on every command/callback.
6. Store product binaries must live in a private R2 bucket; never put paid files in GitHub
   or expose public object URLs.
7. PDF watermarking/password restrictions currently use local qpdf/subprocess. This must
   be replaced by a compatible pre-generated file strategy or an edge-compatible library;
   no unsupported subprocess calls in Workers.

## Cutover policy

Do not register the new webhook, deploy a new bot token, change the production D1 schema,
or stop the legacy Termux bot until:
- product binaries and covers are inventoried and copied to private R2;
- the complete message/callback flow is implemented;
- migrations and unit tests pass;
- payment receipt → owner approval → file delivery is tested end-to-end;
- the customer account reporting path is reconciled with the existing `orders` tables;
- a rollback plan is prepared.

This branch currently adds the isolated D1 schema and migration notes only. It is not
a live replacement and must not be presented as production-ready.

## Current implementation branch (PR #57)

The branch `feature/shopbot-cloudflare-runtime` adds an initial runtime foundation:
- `src/shopbot.js`: isolated webhook handler, bilingual catalog structure placeholder, cart/order creation, receipt-photo intake, owner approval and R2 delivery.
- `/shop-tg/<SHOP_TG_WEBHOOK_SECRET>`: separate webhook endpoint; checks both URL secret and Telegram's `X-Telegram-Bot-Api-Secret-Token`.
- `/setup-shop/<SHOP_TG_WEBHOOK_SECRET>`: registers that webhook using the dedicated ShopBot token.
- `migrations/0005_shopbot_catalog.sql`: adds catalog section and seeds 16 inspected paid products.
- `wrangler.toml`: private R2 binding `SHOP_FILES` to bucket `hayali-shop-files`.
- `scripts/upload_shop_assets.py`: validates both ZIP archives and uploads paid files, free samples, and covers directly to R2 without committing binaries to GitHub.

Required GitHub Actions secrets for a future deployment:
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, existing website secrets, plus
`SHOP_TG_TOKEN`, `SHOP_TG_WEBHOOK_SECRET`, `SHOP_OWNER_ID`, and
`SHOP_PAYMENT_INSTRUCTIONS`. Never put these values in source control or chat.

After the runtime is completed and reviewed, the safe setup order will be:
1. Merge reviewed code and run the deployment workflow only after confirming D1 database ID handling and migrations.
2. Run the asset uploader from a trusted computer with Wrangler authenticated to the intended Cloudflare account.
3. Verify R2 object presence and private access.
4. Set the four ShopBot secrets in GitHub Actions.
5. Deploy, register the webhook once via `/setup-shop/<secret>`, then test with a separate test order.

**Not production-ready:** the current branch is only the first implementation slice. It does not yet provide full legacy feature parity (country-specific pricing, coupons/referrals, full language switching, free sample flows, support relay, complete admin commands, review/reminder automation, and robust resumable delivery). Delivery retry semantics and transactional coupon/order handling still require hardening. Do not merge/deploy or stop the old Termux bot until those are implemented and end-to-end tested.
