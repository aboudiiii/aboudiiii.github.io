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
