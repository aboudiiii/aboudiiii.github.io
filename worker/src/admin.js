import { clean, randomHex, now } from './util.js';
import { ownerSession } from './auth.js';

const fail = (error, status = 400) => [{ ok: false, error }, status];
const validCode = (v) => /^[A-Z0-9_-]{3,24}$/.test(v);

async function audit(env, actor, action, entityId, details = {}) {
  await env.DB.prepare('INSERT INTO admin_audit (id, actor, action, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(randomHex(16), actor, action, entityId || null, JSON.stringify(details), now()).run();
}

export async function adminSummary(req, env) {
  const auth = await ownerSession(req, env);
  if (!auth.ok) return fail(auth.error, auth.status);
  const [orders, revenue, missing, products, recent, daily, coupons, customers, monthly, auditRows] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS n FROM orders').first(),
    env.DB.prepare('SELECT COALESCE(SUM(total_usd), 0) AS amount, COUNT(total_usd) AS n FROM orders').first(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM orders WHERE total_usd IS NULL').first(),
    env.DB.prepare('SELECT product, COUNT(*) AS n FROM order_items GROUP BY product ORDER BY n DESC LIMIT 8').all(),
    env.DB.prepare('SELECT code, email, telegram_id, total_usd, paid_at FROM orders ORDER BY paid_at DESC LIMIT 20').all(),
    env.DB.prepare("SELECT strftime('%Y-%m-%d', paid_at / 1000, 'unixepoch') AS day, COUNT(*) AS orders, COALESCE(SUM(total_usd), 0) AS revenue FROM orders WHERE paid_at >= ? GROUP BY day ORDER BY day")
      .bind(now() - 30 * 86400000).all(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM coupons').first(),
    env.DB.prepare("SELECT COUNT(DISTINCT COALESCE(NULLIF(email, ''), 'tg:' || telegram_id)) AS n FROM orders WHERE (email IS NOT NULL AND email != '') OR (telegram_id IS NOT NULL AND telegram_id != '')").first(),
    env.DB.prepare("SELECT strftime('%Y-%m', paid_at / 1000, 'unixepoch') AS month, COUNT(*) AS orders, COALESCE(SUM(total_usd), 0) AS revenue FROM orders WHERE paid_at >= ? GROUP BY month ORDER BY month DESC LIMIT 12").bind(now() - 365 * 86400000).all(),
    env.DB.prepare('SELECT action, entity_id, details, created_at FROM admin_audit ORDER BY created_at DESC LIMIT 12').all(),
  ]);
  return [{
    ok: true,
    generated_at: now(),
    orders: orders?.n || 0,
    recorded_revenue_usd: Number(revenue?.amount || 0),
    average_recorded_order_usd: revenue?.n ? Number(revenue.amount || 0) / revenue.n : 0,
    orders_with_recorded_totals: revenue?.n || 0,
    orders_missing_totals: missing?.n || 0,
    top_products: products.results,
    recent_orders: recent.results,
    daily: daily.results,
    coupon_count: coupons?.n || 0,
    customers: customers?.n || 0,
    monthly: monthly.results,
    audit: auditRows.results,
  }, 200];
}

export async function adminCoupons(req, env) {
  const auth = await ownerSession(req, env);
  if (!auth.ok) return fail(auth.error, auth.status);
  const actor = auth.session.email;
  if (req.method === 'GET') {
    const rows = await env.DB.prepare('SELECT id, code, kind, value, active, starts_at, ends_at, min_total_usd, max_uses, used_count, created_at, updated_at FROM coupons ORDER BY created_at DESC LIMIT 200').all();
    return [{ ok: true, coupons: rows.results }, 200];
  }
  if (req.method !== 'POST') return fail('method_not_allowed', 405);
  let b;
  try { b = await req.json(); } catch { return fail('bad_json'); }
  const action = clean(b.action, 12);
  if (action === 'create') {
    const code = clean(b.code, 24).toUpperCase();
    const kind = b.kind === 'percent' ? 'percent' : b.kind === 'fixed' ? 'fixed' : '';
    const value = Number(b.value);
    const min = Number(b.min_total_usd || 0);
    const maxUses = b.max_uses === '' || b.max_uses == null ? null : Number(b.max_uses);
    const starts = b.starts_at ? Number(b.starts_at) : null;
    const ends = b.ends_at ? Number(b.ends_at) : null;
    if (!validCode(code) || !kind || !Number.isFinite(value) || value <= 0 ||
      (kind === 'percent' && value > 100) || (kind === 'fixed' && value > 10000) ||
      !Number.isFinite(min) || min < 0 ||
      (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 1000000)) ||
      (starts !== null && (!Number.isFinite(starts) || starts < 0)) ||
      (ends !== null && (!Number.isFinite(ends) || ends < 0)) ||
      (starts !== null && ends !== null && ends <= starts)) return fail('invalid_coupon');
    const id = randomHex(12), t = now();
    try {
      await env.DB.prepare('INSERT INTO coupons (id, code, kind, value, active, starts_at, ends_at, min_total_usd, max_uses, used_count, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, 0, ?, ?)')
        .bind(id, code, kind, value, starts, ends, min, maxUses, t, t).run();
    } catch { return fail('coupon_code_exists', 409); }
    await audit(env, actor, 'coupon_created', id, { code, kind, value });
    return [{ ok: true, id }, 201];
  }
  if (action === 'toggle') {
    const id = clean(b.id, 32), active = b.active === true ? 1 : b.active === false ? 0 : -1;
    if (!/^[a-f0-9]{24}$/.test(id) || active < 0) return fail('invalid_coupon');
    const r = await env.DB.prepare('UPDATE coupons SET active = ?, updated_at = ? WHERE id = ?').bind(active, now(), id).run();
    if (!r?.meta?.changes) return fail('not_found', 404);
    await audit(env, actor, active ? 'coupon_activated' : 'coupon_paused', id);
    return [{ ok: true }, 200];
  }
  if (action === 'delete') {
    const id = clean(b.id, 32);
    if (!/^[a-f0-9]{24}$/.test(id)) return fail('invalid_coupon');
    const r = await env.DB.prepare('DELETE FROM coupons WHERE id = ?').bind(id).run();
    if (!r?.meta?.changes) return fail('not_found', 404);
    await audit(env, actor, 'coupon_deleted', id);
    return [{ ok: true }, 200];
  }
  return fail('invalid_action');
}
