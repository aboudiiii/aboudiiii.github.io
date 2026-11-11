---
name: library-site-quality
description: Maintain and improve Al-Hayali Digital Library safely. Use for any changes to its HTML, CSS, JavaScript, product pages, mobile layout, Arabic/English RTL, accessibility, or site QA.
---

# Al-Hayali Digital Library — Quality Guardrails

## Project identity and constraints
- This is a production static GitHub Pages site: plain HTML, CSS and vanilla JavaScript. Do not migrate it to React, add a bundler, or introduce dependencies unless the owner explicitly requests it.
- Arabic-first RTL with English switching via the existing `data-l="ar|en"` spans. Preserve both languages and test both directions.
- Preserve the established deep emerald / dark green and gold visual identity. Improve hierarchy and spacing without replacing the brand.
- Motion is allowed (owner decision 2026-11-11): bold but purposeful, using only transform/opacity/translate/scale, no motion libraries, and always disabled under `prefers-reduced-motion: reduce`. Never let motion cover content, shift layout or cause horizontal overflow.
- Design mobile-first. Verify at narrow phone widths as well as desktop. Prevent horizontal overflow and keep all product covers, text, buttons and cards inside their gold frames.

## Non-negotiable safety rules
- Inspect the existing implementation and related call sites before editing. Never patch by guessing selector names or assuming a DOM structure.
- Preserve store ordering, cart state, prices, product descriptions, sample PDFs, Telegram bot links, customer accounts, reviews, and existing API/Worker contracts unless the owner explicitly requests a change.
- Never edit `assets/reviews.json` manually; it is maintained by the bot.
- Do not change Cloudflare Worker, D1 schema, order/payment flows or secrets for a front-end-only request.
- Respect the strict Content Security Policy. Do not add third-party scripts, fonts, images, or domains without explicit approval and the necessary CSP review.
- When editing `assets/*.js` or `assets/style.css`, bump the relevant `?v=` query in every HTML page that loads the asset.
- Keep descriptive Arabic/English `alt` text and image dimensions. Above-the-fold cover images should retain `fetchpriority="high"`; below-the-fold images should use lazy loading.
- Never replace real copy with placeholder text or alter commercial wording without approval.

## Required implementation workflow
1. **Inspect:** read `CLAUDE.md`, the relevant HTML/CSS/JS, existing tests and linked behavior. Identify the exact DOM selector and asset references.
2. **Plan narrowly:** state the root cause and the smallest safe change. Avoid broad CSS overrides and duplicated style blocks.
3. **Implement:** reuse existing design tokens, class conventions and components. Keep JavaScript compatible with the site's existing browser support and no-build setup.
4. **Verify:** run `python3 scripts/check_site.py`. If Worker code changed, run `cd worker && npm test`. Run `node --check` on changed JavaScript files. Check all local links and referenced images.
5. **Review:** inspect mobile and desktop layouts, Arabic RTL and English LTR, keyboard focus, form labels, alt text, contrast, loading/error/empty states, and browser console errors. Check that no animation or transition has been reintroduced.
6. **Ship:** summarize changed files, tests and any remaining manual browser checks. Do not claim visual/runtime verification unless it was actually performed.

## UI quality checklist
- Correct reading order and semantic heading hierarchy.
- Buttons are real buttons; links navigate; interactive elements are keyboard accessible and have visible focus.
- Inputs have labels, helpful validation and clear error states.
- Text and controls wrap without clipping at phone widths.
- Product covers remain centered, proportionate and fully within their frame.
- Images reserve their dimensions to prevent layout shifts.
- Keep CSS selectors scoped to the component; avoid global overrides that affect unrelated pages.
- Prefer measured performance improvements over speculative optimization.

## Existing project commands
- Site checks: `python3 scripts/check_site.py`
- Sitemap regeneration after adding/removing pages: `python3 scripts/update_sitemap.py`
- Worker tests only when Worker code changes: `cd worker && npm test`
