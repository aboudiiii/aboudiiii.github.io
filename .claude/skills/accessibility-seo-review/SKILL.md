---
name: accessibility-seo-review
description: Audit Al-Hayali Digital Library pages for accessibility, mobile usability, Arabic/English RTL/LTR correctness, SEO metadata, structured data and safe navigation. Use before publishing or when reviewing a page.
---

# Accessibility and SEO Review — Al-Hayali Digital Library

## Scope
Review the static HTML/CSS/vanilla-JS site without introducing dependencies or changing product/business content.

## Review checklist
- Semantic landmarks and a logical heading hierarchy; one clear page-level H1.
- Links navigate and buttons perform actions; no clickable non-semantic elements without keyboard support.
- Keyboard-only navigation, visible focus, sensible tab order, accessible names, dialog focus/close behavior.
- Form labels, required-state communication, useful validation and readable error messages.
- Text contrast: 4.5:1 for normal text and 3:1 for large text or essential UI boundaries where applicable.
- Arabic-first RTL and English LTR: direction, punctuation, mixed currency/number display, alignment, wrapping and reading order.
- Phone widths: no horizontal scroll, clipped text, overlapping controls, or content outside gold frames.
- Images: meaningful bilingual alt text, width/height, eager/high priority only for the main visible cover, lazy loading below the fold.
- SEO: unique title and description, canonical URL, Open Graph metadata, valid JSON-LD, sitemap entry and working local links.
- CSP: do not introduce external origins or inline execution without reviewing the existing strict policy.
- Respect the owner's preference: no animations, transitions, scroll reveals or motion libraries.

## Review method
1. Read `CLAUDE.md` and inspect the target page plus the CSS/JS it actually loads.
2. Verify each finding against the code. Report file and line/selector, impact, and a minimal fix.
3. Separate confirmed defects from suggestions. Do not invent missing behavior.
4. Do not modify product prices, purchase flows, bot links, account logic, reviews or Worker contracts during an audit.
5. After approved fixes, run `python3 scripts/check_site.py`, `node --check` for changed JS, and `cd worker && npm test` only if Worker code changed.
6. Summarize blockers and manual browser checks still required.
