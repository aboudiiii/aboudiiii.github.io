// Cloudflare Worker: live ratings and comments for aboudiiii.github.io
// - POST /api/rating  {p, r, name?}          -> pending, owner gets a Telegram message with Approve / Reject buttons
// - POST /api/comment {p?, name, text}       -> same
// - GET  /api/feed                           -> approved ratings and comments (JSON)
// - POST /tg/<TG_WEBHOOK_SECRET>             -> Telegram webhook (button presses)
// - GET  /setup/<TG_WEBHOOK_SECRET>          -> registers the Telegram webhook for this Worker (open once)
// No dependencies. Storage: one KV namespace bound as REVIEWS.

const LIMITS = { name: 40, text: 400, label: 60, feed: 500, pendingDays: 30 };
const RATE = { perHour: 4, perDay: 12 };

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      if (url.pathname === '/api/feed' && req.method === 'GET') return json(await feed(env), 200, { ...cors, 'Cache-Control': 'public, max-age=60' });
      if (url.pathname === '/api/rating' && req.method === 'POST') return json(...(await submit(req, env, 'rating')), cors);
      if (url.pathname === '/api/comment' && req.method === 'POST') return json(...(await submit(req, env, 'comment')), cors);
      if (url.pathname.startsWith('/tg/') && req.method === 'POST') return await telegram(req, env, url);
      if (url.pathname.startsWith('/setup/') && req.method === 'GET') return await setup(env, url);
      return json({ ok: false, error: 'not_found' }, 404, cors);
    } catch (e) {
      return json({ ok: false, error: 'server_error' }, 500, cors);
    }
  },
};

/* ---------- helpers ---------- */
function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}
function corsHeaders(req, env) {
  const allowed = String(env.ALLOWED_ORIGINS || 'https://aboudiiii.github.io').split(',').map((s) => s.trim());
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
function clean(s, max) {
  return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f‎‏‪-‮]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
function hasLink(s) {
  return /(https?:\/\/|www\.|t\.me\/|@\w{4,}|\b[a-z0-9-]+\.(com|net|org|io|ru|ir|xyz|me|info)\b)/i.test(s);
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].slice(0, 8).map((x) => x.toString(16).padStart(2, '0')).join('');
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
async function readList(env, key) {
  const raw = await env.REVIEWS.get(key);
  try { const a = JSON.parse(raw || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
}
async function feed(env) {
  return { ok: true, updated: Date.now(), ratings: await readList(env, 'feed:ratings'), comments: await readList(env, 'feed:comments') };
}

/* ---------- submissions ---------- */
async function submit(req, env, kind) {
  let body;
  try { body = await req.json(); } catch { return [{ ok: false, error: 'bad_json' }, 400]; }
  // bots: honeypot filled, or submitted faster than a human could
  if (body.website) return [{ ok: true }, 200]; // pretend success
  const t = Number(body.t);
  if (!(t > 0) || Date.now() - t < 2500) return [{ ok: false, error: 'too_fast' }, 429];

  const p = clean(body.p, 12).toLowerCase();
  if (kind === 'rating' && !/^[a-z0-9_-]{1,12}$/.test(p)) return [{ ok: false, error: 'bad_product' }, 400];
  if (kind === 'comment' && p && !/^[a-z0-9_-]{1,12}$/.test(p)) return [{ ok: false, error: 'bad_product' }, 400];
  const name = clean(body.name, LIMITS.name);
  const label = clean(body.pl, LIMITS.label);
  const item = { id: '', kind, p: p ? [p] : [], name, date: today() };

  if (kind === 'rating') {
    const r = Math.round(Number(body.r));
    if (!(r >= 1 && r <= 5)) return [{ ok: false, error: 'bad_rating' }, 400];
    item.r = r;
  } else {
    item.text = clean(body.text, LIMITS.text);
    if (item.text.length < 3) return [{ ok: false, error: 'text_short' }, 400];
    if (!name) return [{ ok: false, error: 'name_required' }, 400];
    if (hasLink(item.text) || hasLink(name)) return [{ ok: false, error: 'links_not_allowed' }, 400];
  }
  if (name && hasLink(name)) return [{ ok: false, error: 'links_not_allowed' }, 400];

  // rate limit per visitor (hashed IP, never stored in clear)
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  const who = await sha(ip + '|' + (env.RATE_SALT || 'salt'));
  const hKey = `rl:h:${who}:${new Date().toISOString().slice(0, 13)}`;
  const dKey = `rl:d:${who}:${today()}`;
  const [h, d] = await Promise.all([env.REVIEWS.get(hKey), env.REVIEWS.get(dKey)]);
  if (Number(h || 0) >= RATE.perHour || Number(d || 0) >= RATE.perDay) return [{ ok: false, error: 'rate_limited' }, 429];
  // one rating per product per visitor per day
  if (kind === 'rating') {
    const rKey = `rl:r:${who}:${p}:${today()}`;
    if (await env.REVIEWS.get(rKey)) return [{ ok: false, error: 'already_rated' }, 429];
    await env.REVIEWS.put(rKey, '1', { expirationTtl: 90000 });
  }
  await Promise.all([
    env.REVIEWS.put(hKey, String(Number(h || 0) + 1), { expirationTtl: 3700 }),
    env.REVIEWS.put(dKey, String(Number(d || 0) + 1), { expirationTtl: 90000 }),
  ]);

  item.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await env.REVIEWS.put(`pend:${item.id}`, JSON.stringify({ item, label }), { expirationTtl: LIMITS.pendingDays * 86400 });

  const ok = await notifyOwner(env, item, label);
  if (!ok) return [{ ok: false, error: 'notify_failed' }, 502];
  return [{ ok: true, id: item.id }, 200];
}

function summary(item, label) {
  const lines = [item.kind === 'rating' ? '⭐ <b>تقييم جديد</b>' : '💬 <b>تعليق جديد</b>'];
  if (item.p.length) lines.push('المنتج: ' + esc(label || item.p[0]) + ' (' + esc(item.p[0]) + ')');
  if (item.kind === 'rating') lines.push('التقييم: ' + '★'.repeat(item.r) + '☆'.repeat(5 - item.r) + ' (' + item.r + '/5)');
  if (item.name) lines.push('الاسم: ' + esc(item.name));
  if (item.text) lines.push('\n' + esc(item.text));
  return lines.join('\n');
}
async function tg(env, method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  return res.ok;
}
async function notifyOwner(env, item, label) {
  return tg(env, 'sendMessage', {
    chat_id: env.TG_OWNER_ID, parse_mode: 'HTML', text: summary(item, label), disable_web_page_preview: true,
    reply_markup: { inline_keyboard: [[{ text: '✅ نشر', callback_data: 'a:' + item.id }, { text: '❌ حذف', callback_data: 'r:' + item.id }]] },
  });
}

/* ---------- Telegram webhook ---------- */
async function telegram(req, env, url) {
  if (url.pathname !== '/tg/' + env.TG_WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
  const u = await req.json().catch(() => ({}));
  // /start helper: tells you your chat id (used once during setup)
  if (u.message && /^\/start|^\/id/.test(u.message.text || '')) {
    await tg(env, 'sendMessage', { chat_id: u.message.chat.id, text: 'Chat ID: ' + u.message.chat.id });
    return new Response('ok');
  }
  const cb = u.callback_query;
  if (!cb) return new Response('ok');
  if (String(cb.from && cb.from.id) !== String(env.TG_OWNER_ID)) {
    await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id, text: 'غير مصرّح' });
    return new Response('ok');
  }
  const [act, id] = String(cb.data || '').split(':');
  const msg = cb.message;
  const edit = (text, kb) => tg(env, 'editMessageText', { chat_id: msg.chat.id, message_id: msg.message_id, parse_mode: 'HTML', text, reply_markup: { inline_keyboard: kb || [] } });
  const pend = await env.REVIEWS.get('pend:' + id);

  if (act === 'a') {
    if (!pend) { await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id, text: 'غير موجود أو تمت معالجته' }); return new Response('ok'); }
    const { item, label } = JSON.parse(pend);
    const key = item.kind === 'rating' ? 'feed:ratings' : 'feed:comments';
    const list = await readList(env, key);
    list.unshift(item);
    await env.REVIEWS.put(key, JSON.stringify(list.slice(0, LIMITS.feed)));
    await env.REVIEWS.delete('pend:' + id);
    await env.REVIEWS.put('done:' + id, pend, { expirationTtl: LIMITS.pendingDays * 86400 });
    await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id, text: 'تم النشر' });
    await edit('✅ <b>منشور</b>\n\n' + summary(item, label), [[{ text: '↩️ إلغاء النشر', callback_data: 'd:' + id }]]);
  } else if (act === 'r') {
    await env.REVIEWS.delete('pend:' + id);
    await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id, text: 'تم الحذف' });
    await edit('❌ <b>محذوف</b>');
  } else if (act === 'd') {
    const done = await env.REVIEWS.get('done:' + id);
    for (const key of ['feed:ratings', 'feed:comments']) {
      const list = await readList(env, key);
      const next = list.filter((x) => x.id !== id);
      if (next.length !== list.length) await env.REVIEWS.put(key, JSON.stringify(next));
    }
    await env.REVIEWS.delete('done:' + id);
    await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id, text: 'أُلغي النشر' });
    await edit('🚫 <b>أُلغي نشره</b>' + (done ? '\n\n' + summary(JSON.parse(done).item, JSON.parse(done).label) : ''));
  }
  return new Response('ok');
}

async function setup(env, url) {
  if (url.pathname !== '/setup/' + env.TG_WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
  const hook = `${url.origin}/tg/${env.TG_WEBHOOK_SECRET}`;
  const r = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/setWebhook?url=${encodeURIComponent(hook)}&allowed_updates=${encodeURIComponent('["message","callback_query"]')}`);
  const body = await r.text();
  return new Response(r.ok ? 'Webhook registered. You can close this page.' : 'Failed: ' + body, { status: r.ok ? 200 : 500 });
}
