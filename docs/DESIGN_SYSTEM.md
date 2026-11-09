# Design System (proposal)

Goal: a calm, premium, bilingual (RTL/LTR) look — navy, ivory, subtle gold — in light and dark. Documents tokens to consolidate in `style.css`; values below are **proposed** starting points, to be reconciled with the existing CSS variables before adoption [A: current variable names/values were not enumerated in this audit].

## Colour tokens
| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | ivory `#FAF6EC` | navy-900 `#0B1424` | page |
| `--surface` | `#FFFFFF` | navy-800 `#121E33` | cards |
| `--ink` | navy-900 `#0B1424` | ivory `#F3EEDF` | text |
| `--muted` | `#5B6578` | `#A9B2C3` | secondary text |
| `--accent` | navy-600 `#1F3A68` | `#7FA0D6` | links, primary buttons |
| `--gold` | `#B08A3E` | `#D4B26A` | rules, badges, highlights only |
| `--ok / --warn / --err` | `#2E7D4F / #B26A00 / #B3261E` | lighter variants | status |
Rules: gold is decorative/secondary, never the only carrier of meaning, and not for body text. Verify ≥ 4.5:1 for text pairs (not yet measured).

## Typography
- Arabic: one humanist naskh/Kufi-leaning web font (self-hosted, 2 weights); Latin fallback system UI.
- Scale: 14 / 16 / 18 / 22 / 28 / 36 px; line-height 1.7 Arabic, 1.5 Latin; max line 70ch.

## Spacing, shape, motion
- 4 px base: 4/8/12/16/24/32/48. Radius 8 (inputs), 14 (cards), 999 (pills). Shadows low and navy-tinted.
- Motion 150–250 ms ease-out; disable under `prefers-reduced-motion` (already supported).

## RTL / LTR
- Use logical properties (`margin-inline`, `padding-inline`, `inset-inline`, `text-align: start`) everywhere; mirror icons that imply direction; keep numerals and code LTR (`dir="ltr"` islands, e.g. `.art pre`).
- Language toggle swaps `dir` and `lang` on `<html>`.

## Components (existing → standardise)
Header/nav, hero pill, product card, store list row, cart drawer, savings nudge bar, rating stars, review/comment, daily-challenge card, account/login dialog, snackbar (undo), article layout, footer. Each needs: default, hover, focus-visible (2 px gold/navy ring), disabled, and dark-mode states.

## Accessibility baseline
Skip link; visible focus; 44 px touch targets; descriptive `alt` in both languages (already enforced); no colour-only status; test at 320 px and 200 % zoom.
