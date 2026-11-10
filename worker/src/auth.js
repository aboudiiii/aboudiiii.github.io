import { clean, normEmail, now, sha, randomHex, safeEqual, hit, visitor, botCheck, salt } from './util.js';
import { sendMail, codeMail } from './mail.js';
import { ordersOf } from './orders.js';

const CODE_TTL = 10 * 60 * 1000, SESSION_TTL = 12 * 3600 * 1000, RESEND_MS = 60 * 1000;
const codeHash = (env, email, code) => sha(`${code}|${email}|${salt(env)}`, 40);

export async function requestCode(req, env) {
  let b;
  try { b = await req.json(); } catch { return [{ ok: false, error: 'bad_json' }, 400]; }
  const early = botCheck(b);
  if (early) return early;
  const email = normEmail(b.email);
  if (!email) return [{ ok: false, error: 'bad_email' }, 400];
  const who = await visitor(req, env), hour = new Date().toISOString().slice(0, 13);
  if (!(await hit(env, `a:i:${who}:${hour}`, 5, 3700)) || !(await hit(env, `a:e:${await sha(email, 16)}:${hour}`, 3, 3700))) return [{ ok: false, error: 'rate_limited' }, 429];
  const prev = await env.DB.prepare('SELECT sent_at FROM login_codes WHERE email = ?').bind(email).first();
  if (prev && now() - prev.sent_at < RESEND_MS) return [{ ok: true }, 200]; // cooldown, say nothing more
  const code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
  await env.DB.prepare('INSERT OR REPLACE INTO login_codes (email, code_hash, expires_at, attempts, sent_at) VALUES (?, ?, ?, 0, ?)')
    .bind(email, await codeHash(env, email, code), now() + CODE_TTL, now()).run();
  const sent = await sendMail(env, { to: email, subject: 'رمز الدخول · Login code', html: codeMail(code) });
  return sent ? [{ ok: true }, 200] : [{ ok: false, error: 'mail_failed' }, 502];
}

// Telegram login: the site gets a secret `s`, the user opens the bot with it, the bot marks the row, the site polls.
export async function tgStart(req, env) {
  let b;
  try { b = await req.json(); } catch { b = {}; }
  const early = botCheck(b);
  if (early) return early;
  const who = await visitor(req, env), hour = new Date().toISOString().slice(0, 13);
  if (!(await hit(env, `a:tg:${who}:${hour}`, 10, 3700))) return [{ ok: false, error: 'rate_limited' }, 429];
  const s = randomHex(16);
  await env.DB.prepare('INSERT INTO login_codes (email, code_hash, expires_at, attempts, sent_at) VALUES (?, ?, ?, 0, ?)')
    .bind('tgq:' + (await sha(s, 40)), '', now() + CODE_TTL, now()).run();
  return [{ ok: true, s }, 200];
}

export async function tgPoll(req, env) {
  let b;
  try { b = await req.json(); } catch { return [{ ok: false, error: 'bad_json' }, 400]; }
  const s = clean(b.s, 40);
  if (!/^[a-f0-9]{32}$/.test(s)) return [{ ok: false, error: 'invalid_code' }, 400];
  const who = await visitor(req, env);
  if (!(await hit(env, `a:tgp:${who}:${new Date().toISOString().slice(0, 13)}`, 400, 3700))) return [{ ok: false, error: 'rate_limited' }, 429];
  const key = 'tgq:' + (await sha(s, 40));
  const row = await env.DB.prepare('SELECT code_hash, expires_at FROM login_codes WHERE email = ?').bind(key).first();
  if (!row || row.expires_at < now()) return [{ ok: false, error: 'expired' }, 400];
  if (!/^ok:\d{1,20}$/.test(row.code_hash)) return [{ ok: true, pending: true }, 200];
  await env.DB.prepare('DELETE FROM login_codes WHERE email = ?').bind(key).run();
  const email = 'tg:' + row.code_hash.slice(3), token = randomHex(32);
  await env.DB.prepare('INSERT INTO sessions (token_hash, email, expires_at) VALUES (?, ?, ?)').bind(await sha(token, 64), email, now() + SESSION_TTL).run();
  return [{ ok: true, token, email }, 200];
}

export async function verifyCode(req, env) {
  let b;
  try { b = await req.json(); } catch { return [{ ok: false, error: 'bad_json' }, 400]; }
  const email = normEmail(b.email), code = clean(b.code, 6);
  const bad = [{ ok: false, error: 'invalid_code' }, 400];
  if (!email || !/^\d{6}$/.test(code)) return bad;
  const row = await env.DB.prepare('SELECT code_hash, expires_at, attempts FROM login_codes WHERE email = ?').bind(email).first();
  if (!row || row.expires_at < now() || row.attempts >= 5) return bad;
  if (!safeEqual(row.code_hash, await codeHash(env, email, code))) {
    await env.DB.prepare('UPDATE login_codes SET attempts = attempts + 1 WHERE email = ?').bind(email).run();
    return bad;
  }
  await env.DB.prepare('DELETE FROM login_codes WHERE email = ?').bind(email).run();
  const token = randomHex(32);
  await env.DB.prepare('INSERT INTO sessions (token_hash, email, expires_at) VALUES (?, ?, ?)').bind(await sha(token, 64), email, now() + SESSION_TTL).run();
  return [{ ok: true, token, email }, 200];
}

async function sessionOf(req, env) {
  const m = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.get('Authorization') || '');
  if (!m) return null;
  const s = await env.DB.prepare('SELECT email, expires_at FROM sessions WHERE token_hash = ?').bind(await sha(m[1], 64)).first();
  return s && s.expires_at > now() ? { email: s.email, hash: await sha(m[1], 64) } : null;
}

export async function me(req, env) {
  const s = await sessionOf(req, env);
  if (!s) return [{ ok: false, error: 'unauthorized' }, 401];
  return [{ ok: true, email: s.email, orders: await ordersOf(env, s.email) }, 200];
}

export async function logout(req, env) {
  const s = await sessionOf(req, env);
  if (s) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(s.hash).run();
  return [{ ok: true }, 200];
}
