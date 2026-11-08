import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, post, get, old } from './helpers.mjs';

const codeFrom = (mails) => /(\d{6})/.exec(mails()[mails().length - 1].body.htmlContent)[1];

async function login(ctx, email = 'a@test.com') {
  await post(ctx.env, '/api/auth/request', { email, t: old() });
  const r = await post(ctx.env, '/api/auth/verify', { email, code: codeFrom(ctx.mails) });
  return (await r.json()).token;
}

test('email code login -> my purchases -> logout', async () => {
  const ctx = setup();
  await post(ctx.env, '/api/orders', { code: 'A1', items: ['y', 'n'], email: 'a@test.com', total_usd: 10, paid_at: 1700000000000 }, { headers: { 'X-Bot-Key': 'botkey' } });
  await post(ctx.env, '/api/orders', { code: 'Z9', items: ['x'], email: 'other@test.com' }, { headers: { 'X-Bot-Key': 'botkey' } });
  const token = await login(ctx);
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal(ctx.env.DB.db.prepare('SELECT COUNT(*) n FROM sessions WHERE token_hash = ?').get(token).n, 0); // only a hash is stored
  const me = await (await get(ctx.env, '/api/me', { headers: { Authorization: 'Bearer ' + token } })).json();
  assert.equal(me.email, 'a@test.com');
  assert.equal(me.orders.length, 1);
  assert.deepEqual(me.orders[0].items.sort(), ['n', 'y']);
  assert.equal((await get(ctx.env, '/api/me')).status, 401);
  await post(ctx.env, '/api/auth/logout', {}, { headers: { Authorization: 'Bearer ' + token } });
  assert.equal((await get(ctx.env, '/api/me', { headers: { Authorization: 'Bearer ' + token } })).status, 401);
});

test('wrong code is rejected and locks after 5 attempts; code is single use', async () => {
  const ctx = setup();
  await post(ctx.env, '/api/auth/request', { email: 'b@test.com', t: old() });
  const good = codeFrom(ctx.mails);
  const wrong = good === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) assert.equal((await post(ctx.env, '/api/auth/verify', { email: 'b@test.com', code: wrong })).status, 400);
  assert.equal((await post(ctx.env, '/api/auth/verify', { email: 'b@test.com', code: good })).status, 400); // locked
  const c2 = setup();
  await post(c2.env, '/api/auth/request', { email: 'c@test.com', t: old() });
  const ok = codeFrom(c2.mails);
  assert.equal((await post(c2.env, '/api/auth/verify', { email: 'c@test.com', code: ok })).status, 200);
  assert.equal((await post(c2.env, '/api/auth/verify', { email: 'c@test.com', code: ok })).status, 400);
});

test('expired code, bad email, bots, cooldown and rate limits', async () => {
  const ctx = setup();
  assert.equal((await post(ctx.env, '/api/auth/request', { email: 'nope', t: old() })).status, 400);
  assert.equal((await post(ctx.env, '/api/auth/request', { email: 'a@test.com', t: Date.now() })).status, 429);
  assert.equal((await post(ctx.env, '/api/auth/request', { email: 'a@test.com', website: 'x', t: old() })).status, 200);
  assert.equal(ctx.mails().length, 0);
  await post(ctx.env, '/api/auth/request', { email: 'a@test.com', t: old() });
  await post(ctx.env, '/api/auth/request', { email: 'a@test.com', t: old() }); // within 60s: no second mail
  assert.equal(ctx.mails().length, 1);
  ctx.env.DB.db.prepare('UPDATE login_codes SET expires_at = 1').run();
  assert.equal((await post(ctx.env, '/api/auth/verify', { email: 'a@test.com', code: codeFrom(ctx.mails) })).status, 400);
  for (let i = 0; i < 6; i++) await post(ctx.env, '/api/auth/request', { email: `u${i}@test.com`, t: old() }, { ip: '9.9.9.9' });
  assert.equal((await post(ctx.env, '/api/auth/request', { email: 'late@test.com', t: old() }, { ip: '9.9.9.9' })).status, 429);
});

test('same answer whether or not the email has orders (no account enumeration)', async () => {
  const ctx = setup();
  await post(ctx.env, '/api/orders', { code: 'K1', items: ['y'], email: 'known@test.com' }, { headers: { 'X-Bot-Key': 'botkey' } });
  const a = await (await post(ctx.env, '/api/auth/request', { email: 'known@test.com', t: old() })).json();
  const b = await (await post(ctx.env, '/api/auth/request', { email: 'unknown@test.com', t: old() }, { ip: '8.8.8.8' })).json();
  assert.deepEqual(a, b);
});
