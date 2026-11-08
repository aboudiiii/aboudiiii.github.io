---
name: new-book-page
description: Add a new product/book page to the library (books/<slug>.html, sitemap entry, product entry in assets/app.js, index links). Use when the user asks to add a new book or product.
disable-model-invocation: true
---

1. Copy the closest existing page in `books/` as the template (same type: novel / coloring book / programming book / planner).
2. Update title, description, canonical, `og:*`, JSON-LD (name, price, image), `<h1>` with both `data-l` languages.
3. Cover image `<img>`: descriptive Arabic/English `alt`, `fetchpriority="high"`, width/height set. Other images `loading="lazy"`.
4. Add the product to the `P` object in `assets/app.js` and bump the `?v=` of `app.js` in `index.html`.
5. Link it from `index.html`, then run `python3 scripts/update_sitemap.py` to regenerate `sitemap.xml`.
6. Run `python3 scripts/check_site.py` and fix every `ERROR`.
Do not change existing prices, texts or bot links.
