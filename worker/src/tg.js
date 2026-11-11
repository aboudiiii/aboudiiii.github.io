import { esc, safeEqual, sha } from './util.js';
import { productName } from './products.js';
import { tg } from './tgapi.js';
import { addTelegram, removeTelegram, createAnnouncement, cancelAnnouncement, sendAnnouncement } from './subs.js';

const SITE = (env) => env.SITE_URL || 'https://aboudiiii.github.io';

function summary(f) {
  const lines = [f.kind === 'rating' ? '⭐ <b>تقييم جديد</b>' : '💬 <b>تعليق جديد</b>'];
  if (f.product) lines.push('المنتج: ' + esc(productName(f.product)) + ' (' + esc(f.product) + ')');
  if (f.kind === 'rating') lines.push('التقييم: ' + '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating) + ' (' + f.rating + '/5)');
  if (f.name) lines.push('الاسم: ' + esc(f.name));
  if (f.body) lines.push('\n' + esc(f.body));
  return lines.join('\n');
}
export async function notifyOwnerFeedback(env, f) {
  const r = await tg(env, 'sendMessage', {
    chat_id: env.TG_OWNER_ID, parse_mode: 'HTML', text: summary(f), disable_web_page_preview: true,
    reply_markup: { inline_keyboard: [[{ text: '✅ نشر', callback_data: 'a:' + f.id }, { text: '❌ حذف', callback_data: 'r:' + f.id }]] },
  });
  return r.ok;
}

export async function webhook(req, env, url) {
  if (!safeEqual(url.pathname, '/tg/' + env.TG_WEBHOOK_SECRET)) return new Response('forbidden', { status: 403 });
  const u = await req.json().catch(() => ({}));
  if (u.message) await onMessage(env, u.message);
  if (u.callback_query) await onCallback(env, u.callback_query, url.origin);
  return new Response('ok');
}

async function onMessage(env, m) {
  const text = String(m.text || '').trim();
  const chat = m.chat && m.chat.id;
  if (!chat) return;
  const owner = String(m.from && m.from.id) === String(env.TG_OWNER_ID);
  const lg = /^\/start(?:@\w+)?\s+login_([a-f0-9]{32})\s*$/.exec(text);
  if (lg) {
    const key = 'tgq:' + (await sha(lg[1], 40));
    // Step 1: bind this chat to the pending login. It is NOT logged in until it types the code shown on the site.
    const r = await env.DB.prepare("UPDATE login_codes SET code_hash = 'p:' || ? || ':' || substr(code_hash, 3) WHERE email = ? AND expires_at > ? AND code_hash LIKE 'c:%'").bind(String(chat), key, Date.now()).run();
    const done = r && r.meta && r.meta.changes > 0;
    if (done) return void (await tg(env, 'sendMessage', { chat_id: chat, text: 'لتأكيد الدخول إلى الموقع أرسل هنا الرمز المكوّن من 6 أرقام الظاهر على الموقع.\nإذا لم تطلب الدخول أنت للتو فتجاهل هذه الرسالة، ولا ترسل الرمز لأي شخص.' }));
    return void (await tg(env, 'sendMessage', { chat_id: chat, text: done ? 'تم تسجيل دخولك ✅ ارجع إلى الموقع، ستفتح حسابك تلقائيًا.' : 'انتهت صلاحية رابط الدخول. ارجع للموقع واضغط الزر من جديد.' }));
  }
  if (/^\d{6}$/.test(text)) {
    // Step 2: the code typed by the same chat that opened the login link.
    const row = await env.DB.prepare("SELECT email, code_hash, attempts FROM login_codes WHERE email LIKE 'tgq:%' AND code_hash LIKE ? AND expires_at > ? ORDER BY sent_at DESC LIMIT 1").bind('p:' + chat + ':%', Date.now()).first();
    if (!row) return;
    if (row.attempts >= 5) return void (await tg(env, 'sendMessage', { chat_id: chat, text: 'تجاوزت عدد المحاولات. ابدأ من جديد من الموقع.' }));
    const want = row.code_hash.split(':')[2];
    if (!safeEqual(want, await sha(`${text}|${row.email}`, 16))) {
      await env.DB.prepare('UPDATE login_codes SET attempts = attempts + 1 WHERE email = ?').bind(row.email).run();
      return void (await tg(env, 'sendMessage', { chat_id: chat, text: 'الرمز غير صحيح.' }));
    }
    await env.DB.prepare('UPDATE login_codes SET code_hash = ? WHERE email = ?').bind('ok:' + chat, row.email).run();
    return void (await tg(env, 'sendMessage', { chat_id: chat, text: 'تم تسجيل دخولك ✅ ارجع إلى الموقع، ستفتح حسابك تلقائيًا.' }));
  }
  if (/^\/(start|id)\b/.test(text)) {
    if (String(env.TG_OWNER_ID) === '0') return void (await tg(env, 'sendMessage', { chat_id: chat, text: 'Chat ID: ' + chat }));
    const fresh = await addTelegram(env, chat);
    return void (await tg(env, 'sendMessage', { chat_id: chat, text: (fresh ? 'تم اشتراكك ✅ ' : 'أنت مشترك بالفعل ✅ ') + 'ستصلك رسالة عند صدور كتاب جديد في مكتبة الحيالي الرقمية.\nلإلغاء الاشتراك أرسل /stop\n\n' + SITE(env) }));
  }
  if (/^\/stop\b/.test(text)) {
    await removeTelegram(env, chat);
    return void (await tg(env, 'sendMessage', { chat_id: chat, text: 'أُلغي اشتراكك. أرسل /start للاشتراك من جديد.' }));
  }
  if (owner && /^\/announce\b/.test(text)) {
    const body = text.replace(/^\/announce(@\w+)?\s*/, '').trim();
    if (body.length < 5) return void (await tg(env, 'sendMessage', { chat_id: chat, text: 'اكتب نص الإعلان بعد الأمر، مثال:\n/announce صدر كتاب جديد: ...' }));
    const a = await createAnnouncement(env, body);
    return void (await tg(env, 'sendMessage', {
      chat_id: chat, parse_mode: 'HTML', text: `📣 <b>معاينة الإعلان</b>\n\n${esc(body)}\n\nسيصل إلى: ${a.email} بريد، ${a.telegram} تيليجرام.`,
      reply_markup: { inline_keyboard: [[{ text: '📣 أرسل للجميع', callback_data: 'n:' + a.id }, { text: '❌ إلغاء', callback_data: 'x:' + a.id }]] },
    }));
  }
}

async function onCallback(env, cb, origin) {
  const answer = (text) => tg(env, 'answerCallbackQuery', { callback_query_id: cb.id, text });
  if (String(cb.from && cb.from.id) !== String(env.TG_OWNER_ID)) return void (await answer('غير مصرّح'));
  const [act, id] = String(cb.data || '').split(':');
  const msg = cb.message;
  const edit = (text, kb) => tg(env, 'editMessageText', { chat_id: msg.chat.id, message_id: msg.message_id, parse_mode: 'HTML', text, reply_markup: { inline_keyboard: kb || [] } });
  const row = () => env.DB.prepare('SELECT id, kind, product, rating, name, body, status FROM feedback WHERE id = ?').bind(id).first();
  const set = (status) => env.DB.prepare('UPDATE feedback SET status = ?, decided_at = ? WHERE id = ?').bind(status, Date.now(), id).run();

  if (act === 'a') {
    const f = await row();
    if (!f || f.status !== 'pending') return void (await answer('غير موجود أو تمت معالجته'));
    await set('approved'); await answer('تم النشر');
    await edit('✅ <b>منشور</b>\n\n' + summary(f), [[{ text: '↩️ إلغاء النشر', callback_data: 'd:' + id }]]);
  } else if (act === 'r') {
    const f = await row();
    if (f && f.status === 'pending') await set('rejected');
    await answer('تم الحذف'); await edit('❌ <b>محذوف</b>');
  } else if (act === 'd') {
    const f = await row();
    if (f && f.status === 'approved') await set('removed');
    await answer('أُلغي النشر'); await edit('🚫 <b>أُلغي نشره</b>' + (f ? '\n\n' + summary(f) : ''));
  } else if (act === 'x') {
    await cancelAnnouncement(env, id); await answer('أُلغي'); await edit('❌ <b>أُلغي الإعلان</b>');
  } else if (act === 'n') {
    await answer('جارٍ الإرسال...');
    const r = await sendAnnouncement(env, id, SITE(env), origin);
    if (r.error) return void (await edit('الإعلان غير متاح (أُرسل أو أُلغي).'));
    const line = `بريد: ${r.emailSent} · تيليجرام: ${r.tgSent}`;
    await edit(r.rest ? `📣 أُرسلت دفعة (${line}). المتبقي ${r.rest}.` : `✅ <b>اكتمل الإرسال</b>\n${line}`, r.rest ? [[{ text: `أرسل الباقي (${r.rest})`, callback_data: 'n:' + id }]] : []);
  }
}

export async function setup(env, url) {
  if (!safeEqual(url.pathname, '/setup/' + env.TG_WEBHOOK_SECRET)) return new Response('forbidden', { status: 403 });
  const hook = `${url.origin}/tg/${env.TG_WEBHOOK_SECRET}`;
  const r = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/setWebhook?url=${encodeURIComponent(hook)}&allowed_updates=${encodeURIComponent('["message","callback_query"]')}`);
  const body = await r.text();
  return new Response(r.ok ? 'Webhook registered. You can close this page.' : 'Failed: ' + body, { status: r.ok ? 200 : 500 });
}
