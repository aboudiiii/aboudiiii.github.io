import { clean, now, randomHex, hit, visitor } from './util.js';
import { ownerSession } from './auth.js';

const EVENTS = new Set(['page_view','product_view','add_to_cart','begin_checkout','telegram_click']);
const SOURCES = new Set(['direct','search','social','email','referral','campaign']);

export async function trackAnalytics(req, env) {
  const ipKey = await visitor(req, env);
  if (!(await hit(env, 'an:' + ipKey, 90, 60))) return [{ ok: false, error: 'rate_limited' }, 429];
  const length = Number(req.headers.get('Content-Length') || 0);
  if (length > 2048) return [{ ok: false, error: 'payload_too_large' }, 413];
  let b;
  try { b = await req.json(); } catch { return [{ ok: false, error: 'bad_json' }, 400]; }
  const session = clean(b.session_id, 32);
  const event = clean(b.event, 24);
  const page = clean(b.page, 160);
  const product = clean(b.product, 100).toLowerCase();
  const source = SOURCES.has(b.source) ? b.source : 'direct';
  const campaign = clean(b.campaign, 60);
  if (!/^[a-f0-9]{32}$/.test(session) || !EVENTS.has(event) ||
      !/^\/(?!\/)[a-zA-Z0-9_./-]{0,159}$/.test(page) ||
      (product && !/^[a-z0-9-]{1,100}$/.test(product)) ||
      (event === 'product_view' && !product)) return [{ ok: false, error: 'invalid_event' }, 400];
  await env.DB.prepare(
    'INSERT INTO analytics_events (id, session_id, event, page, product, source, campaign, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(randomHex(16), session, event, page, product || null, source, campaign || null, now()).run();
  return [{ ok: true }, 202];
}

export async function adminAnalytics(req, env) {
  const auth = await ownerSession(req, env);
  if (!auth.ok) return [{ ok: false, error: auth.error }, auth.status];
  const since = now() - 30 * 86400000;
  await env.DB.prepare('DELETE FROM analytics_events WHERE created_at < ?').bind(now() - 90 * 86400000).run();
  const [visitors, views, funnel, sources, products, daily] = await Promise.all([
    env.DB.prepare("SELECT COUNT(DISTINCT session_id) AS n FROM analytics_events WHERE created_at >= ? AND event = 'page_view'").bind(since).first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM analytics_events WHERE created_at >= ? AND event = 'page_view'").bind(since).first(),
    env.DB.prepare("SELECT event, COUNT(DISTINCT session_id) AS sessions, COUNT(*) AS events FROM analytics_events WHERE created_at >= ? GROUP BY event").bind(since).all(),
    env.DB.prepare("SELECT source, COUNT(DISTINCT session_id) AS sessions FROM analytics_events WHERE created_at >= ? AND event = 'page_view' GROUP BY source ORDER BY sessions DESC LIMIT 10").bind(since).all(),
    env.DB.prepare("SELECT product, COUNT(DISTINCT session_id) AS sessions, SUM(CASE WHEN event = 'product_view' THEN 1 ELSE 0 END) AS views, SUM(CASE WHEN event = 'add_to_cart' THEN 1 ELSE 0 END) AS adds FROM analytics_events WHERE created_at >= ? AND product IS NOT NULL GROUP BY product ORDER BY views DESC LIMIT 12").bind(since).all(),
    env.DB.prepare("SELECT strftime('%Y-%m-%d', created_at / 1000, 'unixepoch') AS day, COUNT(DISTINCT CASE WHEN event = 'page_view' THEN session_id END) AS visitors, SUM(CASE WHEN event = 'page_view' THEN 1 ELSE 0 END) AS views FROM analytics_events WHERE created_at >= ? GROUP BY day ORDER BY day").bind(since).all(),
  ]);
  const byEvent = Object.fromEntries((funnel?.results || []).map(x => [x.event, { sessions: x.sessions, events: x.events }]));
  return [{
    ok: true,
    generated_at: now(),
    period_days: 30,
    retention_days: 90,
    visitors: Number(visitors?.n || 0),
    page_views: Number(views?.n || 0),
    funnel: ['product_view','add_to_cart','begin_checkout','telegram_click'].map(event => ({
      event, sessions: Number(byEvent[event]?.sessions || 0), events: Number(byEvent[event]?.events || 0)
    })),
    sources: sources.results,
    products: products.results,
    daily: daily.results,
  }, 200];
}
