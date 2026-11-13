// Scheduled posting of one library product to the Telegram news channel (cover + caption + buttons).
// Port of scripts/post_to_telegram.py so it runs on Cloudflare cron (GitHub's schedule was unreliable).
// Products come from the live site (sitemap.xml -> books/*.html Product JSON-LD); the product is chosen by a
// fixed rotation (no state): POSTS_PER_DAY slots per day walk through every product before repeating.
import { esc } from './util.js';
import { tg } from './tgapi.js';

const BOT_URL = 'https://t.me/SmartZaki_Bot';
const POSTS_PER_DAY = 3;          // keep in sync with the crons in wrangler.toml
const SIZE = 'A4';                // same default as the site (assets/app.js sizeVal)
const SLOT_UTC_HOURS = [8, 14];   // runs before 08:00 UTC are slot 0, before 14:00 slot 1, later slot 2
const CATS = [                    // [slug regex, emoji, hashtags]
  [/coloring/, '🎨', '#كتب_تلوين #تلوين_للكبار'],
  [/novel/, '📖', '#روايات #رواية_عربية'],
  [/learn-|programming/, '💻', '#تعلم_البرمجة #برمجة'],
  [/tracker/, '🤲', '#متتبع_الصلوات #عادات_يومية'],
  [/planner/, '📅', '#تنظيم_الوقت #مخطط_دراسي'],
  [/cv-/, '📄', '#سيرة_ذاتية #قوالب_Word'],
];
const BASE_TAGS = '#مكتبة_الحيالي_الرقمية';
const site = (env) => (env.SITE_URL || 'https://aboudiiii.github.io').replace(/\/$/, '');

export const slotFor = (ms) => SLOT_UTC_HOURS.filter((h) => new Date(ms).getUTCHours() >= h).length;
export const pickIndex = (ms, n) => (Math.floor(ms / 86400000) * POSTS_PER_DAY + slotFor(ms)) % n;

export function bookSlugs(sitemapXml) {
  const slugs = [...String(sitemapXml).matchAll(/<loc>[^<]*\/books\/([a-z0-9-]+)\.html<\/loc>/g)].map((m) => m[1]);
  return [...new Set(slugs)].sort();
}

export function parseProduct(slug, html, env = {}) {
  let data = null;
  for (const m of String(html).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { const o = JSON.parse(m[1]); if (o && o['@type'] === 'Product') { data = o; break; } } catch { /* next block */ }
  }
  if (!data) return null;
  const key = (/index\.html\?add=([a-z0-9]+)/.exec(html) || [])[1] || '';
  // The library sells digital files only: drop any sentence that talks about printing.
  const desc = String(data.description || '').split(/(?<=[.!؟])\s+/).map((s) => s.trim())
    .filter((s) => s && !s.includes('طباعة')).join(' ');
  return { slug, name: data.name || slug, desc, image: data.image || '', url: data.url || `${site(env)}/books/${slug}.html`, key };
}

export function buildCaption(p) {
  const [, emoji, tags] = CATS.find(([re]) => re.test(p.slug)) || [null, '📚', '#كتب_عربية'];
  let desc = p.desc.trim();
  if (desc.length > 420) desc = desc.slice(0, 417).trimEnd() + '…';
  const parts = [`${emoji} <b>${esc(p.name)}</b>`];
  if (desc) parts.push(esc(desc));
  parts.push('✅ ملف رقمي يصلك مباشرة على تيليجرام بعد الطلب', `${BASE_TAGS} ${tags}`);
  return parts.join('\n\n');
}

export const orderUrl = (p) => (p.key ? `${BOT_URL}?start=o_${p.key}_${SIZE}` : BOT_URL);
export const keyboard = (p) => ({ inline_keyboard: [[{ text: '🛒 اطلب الآن', url: orderUrl(p) }], [{ text: '🌐 صفحة المنتج', url: p.url }]] });

async function call(env, method, payload) {
  const res = await tg(env, method, payload);
  const j = await res.json().catch(() => ({}));
  return { ok: !!j.ok, id: j.result && j.result.message_id, why: j.description || `HTTP ${res.status}` };
}

async function notifyOwner(env, text) {
  if (env.TG_OWNER_ID) await tg(env, 'sendMessage', { chat_id: env.TG_OWNER_ID, text }).catch(() => {});
}

export async function autopost(env, scheduledTime = Date.now()) {
  const chat = env.TG_CHANNEL;
  if (!chat || !env.TG_TOKEN) return { ok: false, why: 'TG_CHANNEL/TG_TOKEN not set' };
  try {
    const base = site(env);
    const map = await fetch(`${base}/sitemap.xml`);
    if (!map.ok) throw new Error(`sitemap HTTP ${map.status}`);
    const slugs = bookSlugs(await map.text());
    if (!slugs.length) throw new Error('no books in sitemap');
    const start = pickIndex(Number(scheduledTime) || Date.now(), slugs.length);
    let p = null;
    for (let i = 0; i < slugs.length && !p; i++) {      // skip a page that is missing/unparseable
      const slug = slugs[(start + i) % slugs.length];
      const r = await fetch(`${base}/books/${slug}.html`);
      if (r.ok) p = parseProduct(slug, await r.text(), env);
    }
    if (!p) throw new Error('no product page could be read');
    const caption = buildCaption(p), reply_markup = keyboard(p);
    let r = await call(env, 'sendPhoto', { chat_id: chat, photo: p.image, caption, parse_mode: 'HTML', reply_markup });
    if (!r.ok) r = await call(env, 'sendMessage', { chat_id: chat, text: caption, parse_mode: 'HTML', reply_markup, disable_web_page_preview: false });
    if (!r.ok) throw new Error(r.why);
    return { ok: true, slug: p.slug, message_id: r.id };
  } catch (e) {
    await notifyOwner(env, '⚠️ فشل النشر التلقائي بالقناة: ' + (e && e.message ? e.message : e));
    return { ok: false, why: String(e && e.message || e) };
  }
}
