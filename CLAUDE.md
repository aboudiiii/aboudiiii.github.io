# مكتبة الحيالي الرقمية (Al-Hayali Digital Library)

موقع ثابت (GitHub Pages) بلا أدوات بناء: HTML وCSS وJS فقط. اللغة الأساسية العربية (RTL) مع إنجليزية عبر `data-l="ar|en"`.
Static site, no build step. Arabic-first (RTL) with an AR/EN toggle via `<span data-l="ar">…</span><span data-l="en">…</span>`.

## Layout
- `index.html` — الصفحة الرئيسية والسلة والمتجر؛ المنتجات معرّفة في `assets/app.js` (الكائن `P`).
- `books/*.html` — صفحة لكل منتج (قالب موحد). `articles/*.html` — مقالات. `about/terms/privacy.html`.
- `assets/` — الصور والـ JS/CSS. `samples/` — ملفات PDF مجانية. `assets/reviews.json` — تقييمات يديرها البوت (لا تعدّله يدويًا).
- `sitemap.xml` يُولَّد بالأمر `python3 scripts/update_sitemap.py` (التواريخ من git، يحتاج clone كاملًا). شغّله بعد إضافة أي صفحة أو تعديلها.

## Rules
- **CSP صارمة** (`default-src 'none'`): لا تضف نطاقات خارجية (سكربتات/صور/خطوط) إلا بعد تعديل وسم CSP في كل الصفحات.
- **الكاش:** عند تعديل `assets/*.js` أو `style.css` ارفع رقم `?v=` في كل صفحة تستدعيه.
- كل `<img>` لازم يحمل `alt` وصفيًا (عربي / English). غلاف أول الصفحة: `fetchpriority="high"`، الباقي `loading="lazy"`.
- كل صفحة: `<title>`، `description`، `canonical`، `og:*`، وJSON-LD عند الإمكان.
- لا تغيّر الأسعار أو النصوص التجارية أو روابط البوت `t.me/SmartZaki_Bot` دون طلب صريح.

## Claude Code skills
Project-local skills are stored under `.claude/skills/` and should be used when relevant:
- `frontend-design`: distinctive visual direction and design critique. Keep the existing emerald/gold identity.
- `frontend-ui-engineering`: responsive, accessible UI implementation and component behavior.
- `performance-optimization`: measure first, then fix verified performance bottlenecks; see its local references.
- `library-site-quality`: project-specific guardrails and required validation. This skill takes precedence over generic skill advice when they conflict.
- `new-book-page`: existing workflow for adding book/product pages.
- `accessibility-seo-review`: audit semantics, keyboard use, contrast, metadata, structured data, Arabic/English content, and mobile behavior.

**Project-specific override:** the owner explicitly disabled animations. Do not introduce animations or CSS transitions, even if a generic design skill suggests motion.

## Check before pushing
`python3 scripts/check_site.py` — يفحص الـ sitemap والروابط المحلية وصور og وبيانات الصفحات. يجب أن ينتهي بدون `ERROR`.

## Worker: ratings, orders, subscribers, accounts
- `worker/` — Cloudflare Worker + D1 (no dependencies): moderated ratings/comments (Telegram approve/reject), `/api/orders` from the store bot, `/api/stats` ("most ordered"), email-code customer login, email/Telegram subscribers and `/announce`. Setup: `worker/README.ar.md`. Tests: `cd worker && npm test`. Schema: `worker/migrations/`.
- `assets/config.js` holds `window.HAYALI_API` (empty = all of it off; the subscribe/account section is hidden) and `HAYALI_TG_BOT`. `assets/account.js` is the UI for stats badges, subscribe and account. The CSP allows `https://*.workers.dev`.
- Don't reuse the class `.hp` for honeypots (it is the hero pill); use `.hpf`.
- Ratings (stars) and comments are separate on purpose; verified-buyer reviews still come from `assets/reviews.json`.
