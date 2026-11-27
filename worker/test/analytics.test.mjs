import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, post, get, old, say } from './helpers.mjs';

async function ownerToken(ctx) {
  const start = await (await post(ctx.env, '/api/auth/tg/start', { t: old() })).json();
  await say(ctx.env, '/start login_' + start.s);
  await say(ctx.env, start.c);
  return (await (await post(ctx.env, '/api/auth/tg/poll', { s: start.s })).json()).token;
}

test('analytics accepts valid minimal events and rejects malformed payloads', async () => {
  const ctx = setup();
  const good = await post(ctx.env, '/api/analytics', {
    session_id: 'a'.repeat(32), event: 'page_view', page: '/index.html', source: 'direct'
  });
  assert.equal(good.status, 202);
  const bad = await post(ctx.env, '/api/analytics', {
    session_id: 'bad', event: 'page_view', page: '/index.html'
  });
  assert.equal(bad.status, 400);
  const injected = await post(ctx.env, '/api/analytics', {
    session_id: 'b'.repeat(32), event: 'page_view', page: '/index.html?email=secret'
  });
  assert.equal(injected.status, 400);
  assert.equal(ctx.env.DB.db.prepare('SELECT COUNT(*) AS n FROM analytics_events').get().n, 1);
});

test('admin analytics requires owner session and reports funnel, sources and products', async () => {
  const ctx = setup();
  const session = 'c'.repeat(32);
  for (const event of ['page_view','product_view','add_to_cart','begin_checkout','telegram_click']) {
    await post(ctx.env, '/api/analytics', { session_id: session, event, page: '/books/learn-python-arabic-book.html', product: 'learn-python-arabic-book', source: 'social' });
  }
  assert.equal((await get(ctx.env, '/api/admin/analytics')).status, 401);
  const token = await ownerToken(ctx);
  const r = await get(ctx.env, '/api/admin/analytics', { headers: { Authorization: 'Bearer ' + token } });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.visitors, 1);
  assert.equal(d.page_views, 1);
  assert.equal(d.funnel.find(x => x.event === 'telegram_click').sessions, 1);
  assert.equal(d.sources[0].source, 'social');
  assert.equal(d.products[0].adds, 1);
});

test('analytics endpoint is separate from order ingestion', async () => {
  const ctx = setup();
  const r = await post(ctx.env, '/api/analytics', {
    session_id: 'd'.repeat(32), event: 'telegram_click', page: '/index.html'
  });
  assert.equal(r.status, 202);
  assert.equal(ctx.env.DB.db.prepare('SELECT COUNT(*) AS n FROM orders').get().n, 0);
});
