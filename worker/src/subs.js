import { clean, esc, normEmail, now, randomHex, hit, visitor, botCheck, html } from './util.js';
import { sendMail, sendMany, layout } from './mail.js';
import { tg } from './tgapi.js';

const TG_BATCH = 30, EMAIL_BATCH = 90, EMAIL_CALLS = 3;

/* ---------- email subscribers (double opt-in) ---------- */
export async function subscribeEmail(req, env) {
  let b;
  try { b = await req.json(); } catch { return [{ ok: false, error: 'bad_json' }, 400]; }
  const early = botCheck(b);
  if (early) return early;
  const email = normEmail(b.email);
  if (!email) return [{ ok: false, error: 'bad_email' }, 400];
  const who = await visitor(req, env), hour = new Date().toISOString().slice(0, 13);
  if (!(await hit(env, `s:${who}:${hour}`, 5, 3700))) return [{ ok: false, error: 'rate_limited' }, 429];
  const old = await env.DB.prepare("SELECT confirmed, token FROM subscribers WHERE channel = 'email' AND address = ?").bind(email).first();
  if (old && old.confirmed) return [{ ok: true }, 200]; // already subscribed; reveal nothing
  const token = old ? old.token : randomHex(16);
  if (!old) await env.DB.prepare("INSERT INTO subscribers (channel, address, confirmed, token, created_at) VALUES ('email', ?, 0, ?, ?)").bind(email, token, now()).run();
  const link = `${new URL(req.url).origin}/api/confirm?t=${token}`;
  const sent = await sendMail(env, {
    to: email, subject: 'أكّد اشتراكك · Confirm your subscription',
    html: layout(`<p>اضغط الزر لتأكيد اشتراكك في أخبار مكتبة الحيالي الرقمية (كتب جديدة فقط):</p><p><a href="${link}" style="background:#e3b95c;color:#1b2b2b;padding:10px 22px;border-radius:10px;text-decoration:none;font-weight:700">تأكيد الاشتراك</a></p><p dir="ltr" style="color:#667">Tap the button to confirm. If you did not ask for this, ignore this email.</p>`),
  });
  return sent ? [{ ok: true }, 200] : [{ ok: false, error: 'mail_failed' }, 502];
}
export async function confirmEmail(env, token) {
  const r = await env.DB.prepare('UPDATE subscribers SET confirmed = 1 WHERE token = ?').bind(clean(token, 40)).run();
  return html(r.meta && r.meta.changes ? '<h2>تم تأكيد اشتراكك ✅</h2><p>سنخبرك عند صدور كتاب جديد.</p><p dir="ltr">Subscription confirmed.</p>' : '<h2>الرابط غير صالح</h2><p dir="ltr">Invalid link.</p>', r.meta && r.meta.changes ? 200 : 404);
}
export async function unsubscribe(env, token) {
  const r = await env.DB.prepare('DELETE FROM subscribers WHERE token = ?').bind(clean(token, 40)).run();
  return html(r.meta && r.meta.changes ? '<h2>أُلغي اشتراكك</h2><p dir="ltr">You have been unsubscribed.</p>' : '<h2>الرابط غير صالح</h2><p dir="ltr">Invalid link.</p>', r.meta && r.meta.changes ? 200 : 404);
}

/* ---------- telegram subscribers (public bot: /start, /stop) ---------- */
export async function addTelegram(env, chatId) {
  const r = await env.DB.prepare("INSERT OR IGNORE INTO subscribers (channel, address, confirmed, token, created_at) VALUES ('telegram', ?, 1, ?, ?)").bind(String(chatId), randomHex(16), now()).run();
  return !!(r.meta && r.meta.changes);
}
export async function removeTelegram(env, chatId) {
  await env.DB.prepare("DELETE FROM subscribers WHERE channel = 'telegram' AND address = ?").bind(String(chatId)).run();
}

/* ---------- announcements (owner sends /announce text to the bot) ---------- */
export async function createAnnouncement(env, text) {
  const id = now().toString(36) + Math.random().toString(36).slice(2, 5);
  await env.DB.prepare("INSERT INTO announcements (id, body, status, created_at) VALUES (?, ?, 'draft', ?)").bind(id, text.slice(0, 1500), now()).run();
  const c = await counts(env);
  return { id, ...c };
}
export async function counts(env) {
  const e = await env.DB.prepare("SELECT COUNT(*) AS n FROM subscribers WHERE channel = 'email' AND confirmed = 1").first();
  const t = await env.DB.prepare("SELECT COUNT(*) AS n FROM subscribers WHERE channel = 'telegram' AND confirmed = 1").first();
  return { email: e.n, telegram: t.n };
}
export async function cancelAnnouncement(env, id) {
  await env.DB.prepare("UPDATE announcements SET status = 'cancelled' WHERE id = ? AND status = 'draft'").bind(id).run();
}
// Sends in limited batches because a Worker invocation can only make a few dozen outgoing requests.
export async function sendAnnouncement(env, id, siteUrl, origin) {
  const a = await env.DB.prepare('SELECT id, body, status, emailed, tg_offset FROM announcements WHERE id = ?').bind(id).first();
  if (!a || a.status === 'cancelled' || a.status === 'done') return { error: 'unavailable' };
  await env.DB.prepare("UPDATE announcements SET status = 'sending' WHERE id = ?").bind(id).run();
  let emailSent = 0, tgSent = 0;
  if (!a.emailed) {
    const subs = (await env.DB.prepare("SELECT address, token FROM subscribers WHERE channel = 'email' AND confirmed = 1").all()).results;
    for (let i = 0, calls = 0; i < subs.length && calls < EMAIL_CALLS; i += EMAIL_BATCH, calls++) {
      const chunk = subs.slice(i, i + EMAIL_BATCH);
      const ok = await sendMany(env, {
        subject: 'جديد في مكتبة الحيالي الرقمية',
        versions: chunk.map((s) => ({ to: s.address, html: layout(`<p>${esc(a.body).replace(/\n/g, '<br>')}</p><p><a href="${siteUrl}">${siteUrl.replace('https://', '')}</a></p><hr><p style="font-size:13px;color:#667"><a href="${env.WORKER_URL || origin}/api/unsubscribe?t=${s.token}">إلغاء الاشتراك · Unsubscribe</a></p>`) })),
      });
      if (ok) emailSent += chunk.length;
    }
    await env.DB.prepare('UPDATE announcements SET emailed = 1 WHERE id = ?').bind(id).run();
  }
  const tgSubs = (await env.DB.prepare("SELECT id, address FROM subscribers WHERE channel = 'telegram' AND confirmed = 1 AND id > ? ORDER BY id LIMIT ?").bind(a.tg_offset, TG_BATCH).all()).results;
  let last = a.tg_offset;
  for (const s of tgSubs) {
    const r = await tg(env, 'sendMessage', { chat_id: s.address, text: a.body });
    if (r.ok) tgSent++;
    else if (r.status === 403) await removeTelegram(env, s.address); // user blocked the bot
    last = s.id;
  }
  const rest = (await env.DB.prepare("SELECT COUNT(*) AS n FROM subscribers WHERE channel = 'telegram' AND confirmed = 1 AND id > ?").bind(last).first()).n;
  await env.DB.prepare('UPDATE announcements SET tg_offset = ?, status = ? WHERE id = ?').bind(last, rest ? 'sending' : 'done', id).run();
  return { emailSent, tgSent, rest };
}
