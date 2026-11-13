import test from 'node:test';
import assert from 'node:assert/strict';
import { bookSlugs, pickIndex, slotFor, parseProduct, buildCaption, orderUrl, autopost } from '../src/autopost.js';

const SITEMAP = '<urlset><url><loc>https://aboudiiii.github.io/</loc></url><url><loc>https://aboudiiii.github.io/books/b-book.html</loc></url><url><loc>https://aboudiiii.github.io/books/a-novel.html</loc></url><url><loc>https://aboudiiii.github.io/about.html</loc></url></urlset>';
const page = (name, key) => `<a href="../index.html?add=${key}">x</a><script type="application/ld+json">${JSON.stringify({ '@type': 'Product', name, description: 'وصف أول. نسخة للقراءة أو الطباعة. جملة ثالثة.', image: 'https://aboudiiii.github.io/assets/c.jpg', url: 'https://aboudiiii.github.io/books/x.html' })}</script>`;

test('slots and rotation', () => {
  const at = (h) => Date.UTC(2026, 10, 13, h, 0, 0);
  assert.deepEqual([5, 11, 17].map((h) => slotFor(at(h))), [0, 1, 2]);
  const idx = [5, 11, 17].map((h) => pickIndex(at(h), 16));
  assert.equal(new Set(idx).size, 3);
  assert.equal(pickIndex(at(5) + 86400000 * 0, 16), idx[0]);
});

test('sitemap parsing keeps only sorted book slugs', () => assert.deepEqual(bookSlugs(SITEMAP), ['a-novel', 'b-book']));

test('product parsing drops printing sentences and builds the order link', () => {
  const p = parseProduct('a-novel', page('رواية', 'o'));
  assert.equal(p.desc, 'وصف أول. جملة ثالثة.');
  assert.equal(orderUrl(p), 'https://t.me/SmartZaki_Bot?start=o_o_A4');
  assert.match(buildCaption(p), /^📖 <b>رواية<\/b>/);
  assert.ok(!buildCaption(p).includes('طباعة'));
});

test('autopost sends photo with buttons to the channel; failure notifies owner', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    calls.push({ u, body: init && init.body ? JSON.parse(init.body) : null });
    if (u.endsWith('sitemap.xml')) return new Response(SITEMAP);
    if (u.includes('/books/')) return new Response(page('كتاب', 'k'));
    return new Response(JSON.stringify({ ok: true, result: { message_id: 9 } }));
  };
  const env = { TG_TOKEN: 'T', TG_CHANNEL: '@chan', TG_OWNER_ID: '111', SITE_URL: 'https://aboudiiii.github.io' };
  const r = await autopost(env, Date.UTC(2026, 10, 13, 5, 0, 0));
  assert.deepEqual([r.ok, r.message_id], [true, 9]);
  const send = calls.find((c) => c.u.includes('sendPhoto'));
  assert.equal(send.body.chat_id, '@chan');
  assert.equal(send.body.reply_markup.inline_keyboard[0][0].url, 'https://t.me/SmartZaki_Bot?start=o_k_A4');
  globalThis.fetch = async (url) => (String(url).endsWith('sitemap.xml') ? new Response('', { status: 500 }) : new Response('{"ok":true}'));
  calls.length = 0;
  const bad = await autopost(env);
  assert.equal(bad.ok, false);
  assert.equal((await autopost({ TG_TOKEN: 'T' })).ok, false);
});
