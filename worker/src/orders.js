import { KEY_RE, clean, normEmail, now, safeEqual } from './util.js';

// Called by the store bot after a payment is confirmed. Idempotent on `code`.
export async function ingest(req, env) {
  if (!safeEqual(req.headers.get('X-Bot-Key') || '', env.BOT_API_KEY || '')) return [{ ok: false, error: 'unauthorized' }, 401];
  let b;
  try { b = await req.json(); } catch { return [{ ok: false, error: 'bad_json' }, 400]; }
  const code = clean(b.code, 40);
  const items = [...new Set((Array.isArray(b.items) ? b.items : []).map((k) => clean(k, 12).toLowerCase()).filter((k) => KEY_RE.test(k)))].slice(0, 20);
  if (!code || !items.length) return [{ ok: false, error: 'bad_order' }, 400];
  const email = normEmail(b.email) || null;
  const tg = clean(String(b.telegram_id == null ? '' : b.telegram_id), 20) || null;
  const total = Number.isFinite(Number(b.total_usd)) && Number(b.total_usd) > 0 ? Number(b.total_usd) : null;
  const paid = Number(b.paid_at) > 0 ? Number(b.paid_at) : now();

  const old = await env.DB.prepare('SELECT code, email FROM orders WHERE code = ?').bind(code).first();
  if (old) {
    if (email && !old.email) await env.DB.prepare('UPDATE orders SET email = ? WHERE code = ?').bind(email, code).run();
    return [{ ok: true, new: false }, 200];
  }
  await env.DB.batch([
    env.DB.prepare('INSERT INTO orders (code, email, telegram_id, total_usd, paid_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(code, email, tg, total, paid, now()),
    ...items.map((k) => env.DB.prepare('INSERT INTO order_items (code, product) VALUES (?, ?)').bind(code, k)),
  ]);
  return [{ ok: true, new: true }, 200];
}

export async function stats(env) {
  const r = await env.DB.prepare('SELECT product, COUNT(*) AS n FROM order_items GROUP BY product').all();
  const t = await env.DB.prepare('SELECT COUNT(*) AS n FROM orders').first();
  const orders = {};
  for (const x of r.results) orders[x.product] = x.n;
  return { ok: true, updated: now(), orders, total: t ? t.n : 0 };
}

export async function ordersOf(env, email) {
  const isTg = /^tg:\d{1,20}$/.test(email);
  const o = isTg
    ? await env.DB.prepare('SELECT code, total_usd, paid_at FROM orders WHERE telegram_id = ? ORDER BY paid_at DESC LIMIT 100').bind(email.slice(3)).all()
    : await env.DB.prepare('SELECT code, total_usd, paid_at FROM orders WHERE email = ? ORDER BY paid_at DESC LIMIT 100').bind(email).all();
  if (!o.results.length) return [];
  const out = [];
  for (const x of o.results) {
    const it = await env.DB.prepare('SELECT product FROM order_items WHERE code = ?').bind(x.code).all();
    out.push({ code: x.code, total: x.total_usd, paid_at: x.paid_at, items: it.results.map((i) => i.product) });
  }
  return out;
}
