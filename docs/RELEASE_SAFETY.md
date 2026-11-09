# Release safety and rollback

## Non-negotiable release rules

- Never push application changes directly to `main`.
- Use a short-lived feature/security branch and a pull request.
- Do not merge unless the site checks, Worker tests, and security regression checks pass.
- Do not deploy the Cloudflare Worker as part of a static-site-only change.
- Treat Worker/D1 migrations, payment/order logic, authentication, and product pricing as high-risk changes requiring separate review.
- Never run the destructive `Clear ratings and comments` workflow without an owner-confirmed backup and explicit approval.
- Never print or commit secret values. Rotate a secret if it is exposed.

## Current deployment boundaries

- The public storefront is a static GitHub Pages site. A merge to `main` can publish it automatically.
- The Cloudflare Worker has a separate, manually triggered deployment workflow.
- A static-site rollback should be a reviewed revert commit to the last known-good commit; do not rewrite history or force-push `main`.
- A Worker rollback is separate and must account for D1 schema compatibility. Never assume reverting Worker code also reverses a database migration.

## Before every storefront merge

1. Confirm the PR changes only intended files.
2. Confirm product IDs, prices, discount rules, cart payloads, and Telegram deep links are unchanged unless explicitly approved.
3. Run `python3 scripts/check_site.py`.
4. Run `python3 scripts/security_check.py`.
5. Run `cd worker && npm test`.
6. Inspect the rendered site on mobile and desktop.
7. Record the merge commit SHA and verify the published site after deployment.

## Current security debt

The static checker reports existing hardening debt as warnings rather than blocking a safe release:
- `script-src 'unsafe-inline'` remains in the current CSP.
- The customer session token is stored in `localStorage`.

These require dedicated, independently tested changes. Do not remove CSP allowances or change session storage in a broad redesign PR.
