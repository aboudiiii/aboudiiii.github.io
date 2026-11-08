import { LIMITS, KEY_RE, clean, hasLink, now, isoDate, hit, visitor, botCheck } from './util.js';
import { notifyOwnerFeedback } from './tg.js';

const RATE = { perHour: 4, perDay: 12 };

export async function feed(env) {
  const r = await env.DB.prepare("SELECT id, product, rating, created_at FROM feedback WHERE kind = 'rating' AND status = 'approved' ORDER BY created_at DESC LIMIT 500").all();
  const c = await env.DB.prepare("SELECT id, product, name, body, created_at FROM feedback WHERE kind = 'comment' AND status = 'approved' ORDER BY created_at DESC LIMIT 100").all();
  return {
    ok: true, updated: now(),
    ratings: r.results.map((x) => ({ id: x.id, p: [x.product], r: x.rating, date: isoDate(x.created_at) })),
    comments: c.results.map((x) => ({ id: x.id, p: x.product ? [x.product] : [], name: x.name, text: x.body, date: isoDate(x.created_at) })),
  };
}

export async function submit(req, env, kind) {
  let body;
  try { body = await req.json(); } catch { return [{ ok: false, error: 'bad_json' }, 400]; }
  const early = botCheck(body);
  if (early) return early;

  const p = clean(body.p, 12).toLowerCase();
  if (kind === 'rating' ? !KEY_RE.test(p) : p && !KEY_RE.test(p)) return [{ ok: false, error: 'bad_product' }, 400];
  const name = clean(body.name, LIMITS.name);
  if (name && hasLink(name)) return [{ ok: false, error: 'links_not_allowed' }, 400];

  let rating = null, text = null;
  if (kind === 'rating') {
    rating = Math.round(Number(body.r));
    if (!(rating >= 1 && rating <= 5)) return [{ ok: false, error: 'bad_rating' }, 400];
  } else {
    text = clean(body.text, LIMITS.text);
    if (text.length < 3) return [{ ok: false, error: 'text_short' }, 400];
    if (!name) return [{ ok: false, error: 'name_required' }, 400];
    if (hasLink(text)) return [{ ok: false, error: 'links_not_allowed' }, 400];
  }

  const who = await visitor(req, env);
  const day = new Date().toISOString().slice(0, 10), hour = new Date().toISOString().slice(0, 13);
  if (kind === 'rating' && !(await hit(env, `r:${who}:${p}:${day}`, 1, 90000))) return [{ ok: false, error: 'already_rated' }, 429];
  if (!(await hit(env, `h:${who}:${hour}`, RATE.perHour, 3700)) || !(await hit(env, `d:${who}:${day}`, RATE.perDay, 90000))) return [{ ok: false, error: 'rate_limited' }, 429];

  const id = now().toString(36) + Math.random().toString(36).slice(2, 6);
  await env.DB.prepare("INSERT INTO feedback (id, kind, product, rating, name, body, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)")
    .bind(id, kind, p || null, rating, name || null, text, now()).run();
  const ok = await notifyOwnerFeedback(env, { id, kind, product: p, rating, name, body: text });
  if (!ok) return [{ ok: false, error: 'notify_failed' }, 502];
  return [{ ok: true, id }, 200];
}
