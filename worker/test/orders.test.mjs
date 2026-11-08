import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, post, get } from './helpers.mjs';

const H = { headers: { 'X-Bot-Key': 'botkey' } };

test('orders: bot key required, idempotent, stats count paid orders per product', async () => {
  const { env } = setup();
  assert.equal((await post(env, '/api/orders', { code: 'A1', items: ['y'] })).status, 401);
  assert.equal((await post(env, '/api/orders', { code: 'A1', items: ['y'] }, { headers: { 'X-Bot-Key': 'wrong' } })).status, 401);
  assert.equal((await post(env, '/api/orders', { code: 'A1', items: ['y', 'n'], email: 'A@Test.com', telegram_id: 5, total_usd: 10 }, H)).status, 200);
  const again = await (await post(env, '/api/orders', { code: 'A1', items: ['y', 'n'] }, H)).json();
  assert.equal(again.new, false);
  await post(env, '/api/orders', { code: 'A2', items: ['y'] }, H);
  assert.equal((await post(env, '/api/orders', { code: '', items: [] }, H)).status, 400);
  const s = await (await get(env, '/api/stats')).json();
  assert.deepEqual(s.orders, { y: 2, n: 1 });
  assert.equal(s.total, 2);
  assert.equal(env.DB.db.prepare('SELECT email FROM orders WHERE code = ?').get('A1').email, 'a@test.com');
});

test('a later report adds a missing email to an existing order', async () => {
  const { env } = setup();
  await post(env, '/api/orders', { code: 'B1', items: ['y'] }, H);
  await post(env, '/api/orders', { code: 'B1', items: ['y'], email: 'b@test.com' }, H);
  assert.equal(env.DB.db.prepare('SELECT email FROM orders WHERE code = ?').get('B1').email, 'b@test.com');
});
