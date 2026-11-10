export const LIMITS = { name: 40, text: 400 };
export const KEY_RE = /^[a-z0-9_-]{1,12}$/;

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}
export function html(body, status = 200) {
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui,sans-serif;max-width:520px;margin:15vh auto;padding:0 20px;text-align:center;line-height:1.7">${body}</body>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
export function corsHeaders(req, env) {
  const allowed = String(env.ALLOWED_ORIGINS || 'https://aboudiiii.github.io').split(',').map((s) => s.trim());
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
export const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f‎‏‪-‮]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
export const hasLink = (s) => /(https?:\/\/|www\.|t\.me\/|@\w{4,}|\b[a-z0-9-]+\.(com|net|org|io|ru|ir|xyz|me|info)\b)/i.test(s);
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const normEmail = (s) => {
  const e = String(s || '').trim().toLowerCase();
  return e.length <= 120 && /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/.test(e) ? e : '';
};
export const now = () => Date.now();
export const isoDate = (t) => new Date(t).toISOString().slice(0, 10);

const toHex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
export async function sha(s, len = 32) {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))).slice(0, len);
}
export function randomHex(bytes = 16) {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}
export function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length || !a.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
// Fail closed: never fall back to a guessable salt.
export function salt(env) {
  if (!env.RATE_SALT) throw new Error('RATE_SALT is not configured');
  return env.RATE_SALT;
}
export async function visitor(req, env) {
  return sha((req.headers.get('CF-Connecting-IP') || 'unknown') + '|' + salt(env), 16);
}
// Atomic fixed-window counter in D1. The conditional UPSERT makes checking the
// limit and incrementing the counter one database operation, avoiding races
// between concurrent requests. A missing RETURNING row means the limit is hit.
export async function hit(env, key, limit, ttlSec) {
  const t = now();
  const row = await env.DB.prepare(`
    INSERT INTO rate (k, n, expires_at)
    VALUES (?, 1, ?)
    ON CONFLICT(k) DO UPDATE SET
      n = CASE WHEN rate.expires_at <= ? THEN 1 ELSE rate.n + 1 END,
      expires_at = CASE WHEN rate.expires_at <= ? THEN excluded.expires_at ELSE rate.expires_at END
    WHERE rate.expires_at <= ? OR rate.n < ?
    RETURNING n
  `).bind(key, t + ttlSec * 1000, t, t, t, limit).first();
  if (Math.random() < 0.02) {
    await env.DB.prepare('DELETE FROM rate WHERE expires_at < ?').bind(t).run();
  }
  return row !== null;
}
// Common anti-bot checks for public forms. Returns an error response tuple or null.
export function botCheck(body) {
  if (body.website) return [{ ok: true }, 200]; // honeypot filled: pretend success
  const t = Number(body.t);
  if (!(t > 0) || now() - t < 2500) return [{ ok: false, error: 'too_fast' }, 429];
  return null;
}
