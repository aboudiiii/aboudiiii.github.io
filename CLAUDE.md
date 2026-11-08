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

## Check before pushing
`python3 scripts/check_site.py` — يفحص الـ sitemap والروابط المحلية وصور og وبيانات الصفحات. يجب أن ينتهي بدون `ERROR`.

## Live ratings and comments
- `worker/` — Cloudflare Worker (no dependencies) that receives ratings/comments, notifies the owner on Telegram with Approve/Reject buttons and serves approved items at `/api/feed`. Setup: `worker/README.ar.md`. Tests: `cd worker && npm test`.
- `assets/config.js` holds `window.HAYALI_API` (empty = feature off, old Telegram review link stays). The CSP allows `https://*.workers.dev`.
- Ratings (stars) and comments are separate on purpose; verified-buyer reviews still come from `assets/reviews.json`.
