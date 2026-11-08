import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.js';

function kv() {
  const m = new Map();
  return { m, get: async (k) => (m.has(k) ? m.get(k) : null), put: async (k, v) => { m.set(k, v); }, delete: async (k) => { m.delete(k); } };
}
function setup() {
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url: String(url), body: init && init.body ? JSON.parse(init.body) : null }); return new Response('{"ok":true}', { status: 200 }); };
  const env = { REVIEWS: kv(), TG_TOKEN: 'T', TG_OWNER_ID: '111', TG_WEBHOOK_SECRET: 'sec', RATE_SALT: 's', ALLOWED_ORIGINS: 'https://aboudiiii.github.io' };
  return { env, calls };
}
const old = Date.now() - 10000;
const post = (env, path, body, ip = '1.1.1.1') =>
  worker.fetch(new Request('https://w.test' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip, Origin: 'https://aboudiiii.github.io' }, body: JSON.stringify(body) }), env);
const hook = (env, body, secret = 'sec') => worker.fetch(new Request('https://w.test/tg/' + secret, { method: 'POST', body: JSON.stringify(body) }), env);

test('rating -> pending + owner notified with buttons; approve publishes to feed', async () => {
  const { env, calls } = setup();
  const r = await post(env, '/api/rating', { p: 'y', r: 5, name: 'علي', t: old, pl: 'تعلّم بايثون' });
  assert.equal(r.status, 200);
  const { id } = await r.json();
  assert.ok(env.REVIEWS.m.has('pend:' + id));
  const sent = calls.find((c) => c.url.endsWith('/sendMessage'));
  assert.equal(sent.body.chat_id, '111');
  assert.match(sent.body.text, /★★★★★/);
  assert.equal(sent.body.reply_markup.inline_keyboard[0][0].callback_data, 'a:' + id);
  // not visible before approval
  let feed = await (await worker.fetch(new Request('https://w.test/api/feed'), env)).json();
  assert.equal(feed.ratings.length, 0);
  await hook(env, { callback_query: { id: 'q', from: { id: 111 }, data: 'a:' + id, message: { chat: { id: 111 }, message_id: 5 } } });
  feed = await (await worker.fetch(new Request('https://w.test/api/feed'), env)).json();
  assert.equal(feed.ratings.length, 1);
  assert.equal(feed.ratings[0].r, 5);
  assert.equal(env.REVIEWS.m.has('pend:' + id), false);
});

test('comment: approve, then unpublish removes it; reject deletes pending', async () => {
  const { env } = setup();
  const a = await (await post(env, '/api/comment', { p: '', name: 'سارة', text: 'كتاب رائع جدا', t: old })).json();
  await hook(env, { callback_query: { id: 'q', from: { id: 111 }, data: 'a:' + a.id, message: { chat: { id: 111 }, message_id: 1 } } });
  let feed = await (await worker.fetch(new Request('https://w.test/api/feed'), env)).json();
  assert.equal(feed.comments.length, 1);
  await hook(env, { callback_query: { id: 'q', from: { id: 111 }, data: 'd:' + a.id, message: { chat: { id: 111 }, message_id: 1 } } });
  feed = await (await worker.fetch(new Request('https://w.test/api/feed'), env)).json();
  assert.equal(feed.comments.length, 0);
  const b = await (await post(env, '/api/comment', { name: 'x', text: 'تعليق ثاني', t: old }, '2.2.2.2')).json();
  await hook(env, { callback_query: { id: 'q', from: { id: 111 }, data: 'r:' + b.id, message: { chat: { id: 111 }, message_id: 2 } } });
  assert.equal(env.REVIEWS.m.has('pend:' + b.id), false);
  feed = await (await worker.fetch(new Request('https://w.test/api/feed'), env)).json();
  assert.equal(feed.comments.length, 0);
});

test('only the owner can approve; wrong webhook secret is rejected', async () => {
  const { env } = setup();
  const a = await (await post(env, '/api/comment', { name: 'a', text: 'hello there', t: old })).json();
  await hook(env, { callback_query: { id: 'q', from: { id: 999 }, data: 'a:' + a.id, message: { chat: { id: 999 }, message_id: 1 } } });
  assert.equal((await (await worker.fetch(new Request('https://w.test/api/feed'), env)).json()).comments.length, 0);
  assert.equal((await hook(env, {}, 'nope')).status, 403);
});

test('spam protection: honeypot, too fast, links, bad rating, rate limit, duplicate rating', async () => {
  const { env } = setup();
  assert.equal((await post(env, '/api/comment', { website: 'x', name: 'a', text: 'hello there', t: old })).status, 200); // silently ignored
  assert.equal([...env.REVIEWS.m.keys()].filter((k) => k.startsWith('pend:')).length, 0);
  assert.equal((await post(env, '/api/comment', { name: 'a', text: 'hello there', t: Date.now() })).status, 429);
  assert.equal((await (await post(env, '/api/comment', { name: 'a', text: 'visit http://spam.com', t: old })).json()).error, 'links_not_allowed');
  assert.equal((await (await post(env, '/api/rating', { p: 'y', r: 9, t: old })).json()).error, 'bad_rating');
  assert.equal((await post(env, '/api/rating', { p: 'y', r: 4, t: old }, '3.3.3.3')).status, 200);
  assert.equal((await (await post(env, '/api/rating', { p: 'y', r: 4, t: old }, '3.3.3.3')).json()).error, 'already_rated');
  for (let i = 0; i < 4; i++) await post(env, '/api/comment', { name: 'n', text: 'comment ' + i + ' ok', t: old }, '4.4.4.4');
  assert.equal((await post(env, '/api/comment', { name: 'n', text: 'one more please', t: old }, '4.4.4.4')).status, 429);
});

test('html in text is escaped in the Telegram message; /setup registers webhook', async () => {
  const { env, calls } = setup();
  await post(env, '/api/comment', { name: '<b>x</b>', text: '<script>alert(1)</script> nice', t: old });
  const sent = calls.find((c) => c.url.endsWith('/sendMessage'));
  assert.ok(!sent.body.text.includes('<script>'));
  assert.match(sent.body.text, /&lt;script&gt;/);
  const r = await worker.fetch(new Request('https://w.test/setup/sec'), env);
  assert.equal(r.status, 200);
  assert.ok(calls.some((c) => c.url.includes('/setWebhook?url=' + encodeURIComponent('https://w.test/tg/sec'))));
  assert.equal((await worker.fetch(new Request('https://w.test/setup/bad'), env)).status, 403);
});
