import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, post, get, old, say } from './helpers.mjs';

async function telegramLogin(ctx, userId = 111) {
  const start = await (await post(ctx.env, '/api/auth/tg/start', { t: old() })).json();
  await say(ctx.env, '/start login_' + start.s, userId);
  const result = await (await post(ctx.env, '/api/auth/tg/poll', { s: start.s })).json();
  return result.token;
}

test('admin endpoints require a Telegram session matching TG_OWNER_ID', async () => {
  const ctx = setup();
  assert.equal((await get(ctx.env, '/api/admin/summary')).status, 401);
  const token = await telegramLogin(ctx, 222);
  const denied = await get(ctx.env, '/api/admin/summary', { headers: { Authorization: 'Bearer ' + token } });
  assert.equal(denied.status, 403);
  const ownerToken = await telegramLogin(ctx, 111);
  const allowed = await get(ctx.env, '/api/admin/summary', { headers: { Authorization: 'Bearer ' + ownerToken } });
  assert.equal(allowed.status, 200);
  assert.equal((await allowed.json()).ok, true);
});

test('admin dashboard reports recorded revenue separately from missing order totals', async () => {
  const ctx = setup();
  await post(ctx.env, '/api/orders', { code: 'R1', items: ['y'], total_usd: 8.5 }, { headers: { 'X-Bot-Key': 'botkey' } });
  await post(ctx.env, '/api/orders', { code: 'R2', items: ['n'] }, { headers: { 'X-Bot-Key': 'botkey' } });
  const token = await telegramLogin(ctx);
  const r = await get(ctx.env, '/api/admin/summary', { headers: { Authorization: 'Bearer ' + token } });
  const d = await r.json();
  assert.equal(d.orders, 2);
  assert.equal(d.recorded_revenue_usd, 8.5);
  assert.equal(d.orders_with_recorded_totals, 1);
  assert.equal(d.orders_missing_totals, 1);
  assert.deepEqual(d.top_products.map((x) => x.product).sort(), ['n', 'y']);
  assert.equal(d.recent_orders.length, 2);
});

test('owner can create, pause, reactivate and delete coupons with validation', async () => {
  const ctx = setup();
  const token = await telegramLogin(ctx);
  const auth = { headers: { Authorization: 'Bearer ' + token } };
  const invalid = await post(ctx.env, '/api/admin/coupons', { action: 'create', code: 'BAD', kind: 'percent', value: 150 }, auth);
  assert.equal(invalid.status, 400);
  const created = await post(ctx.env, '/api/admin/coupons', { action: 'create', code: 'WELCOME10', kind: 'percent', value: 10, min_total_usd: 5, max_uses: 20 }, auth);
  assert.equal(created.status, 201);
  const id = (await created.json()).id;
  assert.match(id, /^[a-f0-9]{24}$/);
  let list = await (await get(ctx.env, '/api/admin/coupons', auth)).json();
  assert.equal(list.coupons.length, 1);
  assert.equal(list.coupons[0].active, 0);
  assert.equal((await post(ctx.env, '/api/admin/coupons', { action: 'toggle', id, active: true }, auth)).status, 200);
  list = await (await get(ctx.env, '/api/admin/coupons', auth)).json();
  assert.equal(list.coupons[0].active, 1);
  assert.equal((await post(ctx.env, '/api/admin/coupons', { action: 'delete', id }, auth)).status, 200);
  list = await (await get(ctx.env, '/api/admin/coupons', auth)).json();
  assert.equal(list.coupons.length, 0);
  assert.equal(ctx.env.DB.db.prepare('SELECT COUNT(*) AS n FROM admin_audit').get().n, 3);
});

test('expanded summary includes customer, monthly and audit data', async () => {
  const ctx = setup();
  await post(ctx.env, '/api/orders', { code: 'C1', items: ['y'], total_usd: 4, email: 'one@example.com' }, { headers: { 'X-Bot-Key': 'botkey' } });
  const token = await telegramLogin(ctx);
  const r = await get(ctx.env, '/api/admin/summary', { headers: { Authorization: 'Bearer ' + token } });
  const d = await r.json();
  assert.equal(d.customers, 1);
  assert.ok(Array.isArray(d.monthly));
  assert.ok(Array.isArray(d.audit));
});
