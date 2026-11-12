import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, post, get, press, say, old } from './helpers.mjs';

const link = (mails) => /api\/confirm\?t=([a-f0-9]+)/.exec(mails()[mails().length - 1].body.htmlContent)[1];

test('email subscription needs confirmation; unsubscribe link works', async () => {
  const { env, mails } = setup();
  assert.equal((await post(env, '/api/subscribe', { email: 'x@test.com', t: old() })).status, 200);
  assert.equal(env.DB.db.prepare('SELECT confirmed FROM subscribers').get().confirmed, 0);
  const t = link(mails);
  assert.equal((await get(env, '/api/confirm?t=' + t)).status, 200);
  assert.equal(env.DB.db.prepare('SELECT confirmed FROM subscribers').get().confirmed, 1);
  assert.equal((await get(env, '/api/confirm?t=bad')).status, 404);
  assert.equal((await get(env, '/api/unsubscribe?t=' + t)).status, 200);
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) n FROM subscribers').get().n, 0);
});

test('telegram subscribers: /start and /stop (public), setup mode shows chat id', async () => {
  const { env, tgCalls } = setup();
  await say(env, '/start', 555);
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) n FROM subscribers WHERE channel = 'telegram'").get().n, 1);
  assert.match(tgCalls('sendMessage')[0].body.text, /تم اشتراكك/);
  await say(env, '/stop', 555);
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) n FROM subscribers').get().n, 0);
  const s2 = setup(); s2.env.TG_OWNER_ID = '0';
  await say(s2.env, '/start', 777);
  assert.match(s2.tgCalls('sendMessage')[0].body.text, /Chat ID: 777/);
});

test('welcome shows a join-channel button only when CHANNEL_URL is a t.me link', async () => {
  const a = setup(); a.env.CHANNEL_URL = 'https://t.me/hayali_news';
  await say(a.env, '/start', 555);
  assert.equal(a.tgCalls('sendMessage')[0].body.reply_markup.inline_keyboard[0][0].url, 'https://t.me/hayali_news');
  const b = setup(); b.env.CHANNEL_URL = '';
  await say(b.env, '/start', 556);
  assert.equal(b.tgCalls('sendMessage')[0].body.reply_markup, undefined);
  const c = setup(); c.env.CHANNEL_URL = 'javascript:alert(1)';
  await say(c.env, '/start', 557);
  assert.equal(c.tgCalls('sendMessage')[0].body.reply_markup, undefined);
});

test('announce: owner only, preview, then sends to email + telegram in batches', async () => {
  const { env, mails, tgCalls } = setup({ tgFail: (u, b) => u.includes('/sendMessage') && b.chat_id === '1004' });
  for (let i = 0; i < 40; i++) env.DB.db.prepare("INSERT INTO subscribers (channel, address, confirmed, token, created_at) VALUES ('telegram', ?, 1, ?, 1)").run(String(1000 + i), 'tok' + i);
  for (let i = 0; i < 3; i++) env.DB.db.prepare("INSERT INTO subscribers (channel, address, confirmed, token, created_at) VALUES ('email', ?, 1, ?, 1)").run(`e${i}@t.com`, 'et' + i);
  env.DB.db.prepare("INSERT INTO subscribers (channel, address, confirmed, token, created_at) VALUES ('email', 'pending@t.com', 0, 'pt', 1)").run();
  await say(env, '/announce صدر كتاب جديد عن بايثون', 999); // not the owner: ignored
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) n FROM announcements').get().n, 0);
  await say(env, '/announce صدر كتاب جديد عن بايثون');
  const prev = tgCalls('sendMessage').pop().body;
  assert.match(prev.text, /3 بريد، 40 تيليجرام/);
  const id = prev.reply_markup.inline_keyboard[0][0].callback_data.split(':')[1];
  await press(env, 'n:' + id, 999);
  assert.equal(mails().length, 0);
  await press(env, 'n:' + id);
  assert.equal(mails().length, 1);
  assert.equal(mails()[0].body.messageVersions.length, 3); // confirmed email subscribers only
  assert.match(mails()[0].body.messageVersions[0].htmlContent, /api\/unsubscribe\?t=et0/);
  const first = tgCalls('sendMessage').filter((c) => c.body.text === 'صدر كتاب جديد عن بايثون').length;
  assert.equal(first, 30);
  assert.match(tgCalls('editMessageText').pop().body.text, /المتبقي 10/);
  await press(env, 'n:' + id); // continue
  assert.equal(mails().length, 1); // emails are not sent twice
  assert.equal(tgCalls('sendMessage').filter((c) => c.body.text === 'صدر كتاب جديد عن بايثون').length, 40);
  assert.match(tgCalls('editMessageText').pop().body.text, /اكتمل/);
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) n FROM subscribers WHERE address = '1004'").get().n, 0); // blocked user removed
  await press(env, 'n:' + id); // already done
  assert.match(tgCalls('editMessageText').pop().body.text, /غير متاح/);
});
