import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, post, get, hook, press, old } from './helpers.mjs';

test('rating: pending, owner notified with buttons, approve publishes', async () => {
  const { env, tgCalls } = setup();
  const r = await post(env, '/api/rating', { p: 'y', r: 5, name: 'علي', t: old() });
  assert.equal(r.status, 200);
  const { id } = await r.json();
  const sent = tgCalls('sendMessage')[0].body;
  assert.equal(sent.chat_id, '111');
  assert.match(sent.text, /★★★★★/);
  assert.match(sent.text, /تعلّم بايثون/);
  assert.equal(sent.reply_markup.inline_keyboard[0][0].callback_data, 'a:' + id);
  assert.equal((await (await get(env, '/api/feed')).json()).ratings.length, 0);
  await press(env, 'a:' + id);
  const feed = await (await get(env, '/api/feed')).json();
  assert.equal(feed.ratings.length, 1);
  assert.deepEqual([feed.ratings[0].p, feed.ratings[0].r], [['y'], 5]);
});

test('comment: approve, unpublish, reject', async () => {
  const { env } = setup();
  const a = await (await post(env, '/api/comment', { name: 'سارة', text: 'كتاب رائع جدا', t: old() })).json();
  await press(env, 'a:' + a.id);
  assert.equal((await (await get(env, '/api/feed')).json()).comments.length, 1);
  await press(env, 'd:' + a.id);
  assert.equal((await (await get(env, '/api/feed')).json()).comments.length, 0);
  const b = await (await post(env, '/api/comment', { name: 'x', text: 'تعليق ثاني', t: old() }, { ip: '2.2.2.2' })).json();
  await press(env, 'r:' + b.id);
  assert.equal((await (await get(env, '/api/feed')).json()).comments.length, 0);
});

test('only the owner can moderate; wrong webhook secret rejected', async () => {
  const { env } = setup();
  const a = await (await post(env, '/api/comment', { name: 'a', text: 'hello there', t: old() })).json();
  await press(env, 'a:' + a.id, 999);
  assert.equal((await (await get(env, '/api/feed')).json()).comments.length, 0);
  assert.equal((await hook(env, {}, 'nope')).status, 403);
});

test('spam protection', async () => {
  const { env } = setup();
  assert.equal((await post(env, '/api/comment', { website: 'x', name: 'a', text: 'hello there', t: old() })).status, 200);
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) n FROM feedback').get().n, 0);
  assert.equal((await post(env, '/api/comment', { name: 'a', text: 'hello there', t: Date.now() })).status, 429);
  assert.equal((await (await post(env, '/api/comment', { name: 'a', text: 'see http://spam.com', t: old() })).json()).error, 'links_not_allowed');
  assert.equal((await (await post(env, '/api/rating', { p: 'y', r: 9, t: old() })).json()).error, 'bad_rating');
  assert.equal((await post(env, '/api/rating', { p: 'y', r: 4, t: old() }, { ip: '3.3.3.3' })).status, 200);
  assert.equal((await (await post(env, '/api/rating', { p: 'y', r: 4, t: old() }, { ip: '3.3.3.3' })).json()).error, 'already_rated');
  for (let i = 0; i < 4; i++) await post(env, '/api/comment', { name: 'n', text: 'comment ' + i + ' ok', t: old() }, { ip: '4.4.4.4' });
  assert.equal((await post(env, '/api/comment', { name: 'n', text: 'one more please', t: old() }, { ip: '4.4.4.4' })).status, 429);
});

test('HTML in user text is escaped in the Telegram message; /setup registers webhook', async () => {
  const { env, calls, tgCalls } = setup();
  await post(env, '/api/comment', { name: '<b>x</b>', text: '<script>alert(1)</script> nice', t: old() });
  const text = tgCalls('sendMessage')[0].body.text;
  assert.ok(!text.includes('<script>'));
  assert.match(text, /&lt;script&gt;/);
  const { default: w } = await import('../src/index.js');
  assert.equal((await w.fetch(new Request('https://w.test/setup/sec'), env)).status, 200);
  assert.ok(calls.some((c) => c.url.includes('/setWebhook?url=' + encodeURIComponent('https://w.test/tg/sec'))));
  assert.equal((await w.fetch(new Request('https://w.test/setup/bad'), env)).status, 403);
});
