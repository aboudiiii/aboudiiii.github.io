// Cloudflare Worker for aboudiiii.github.io: feedback, orders/stats, subscribers, customer accounts.
// Storage: D1 (binding DB). No dependencies.
import { json, corsHeaders } from './util.js';
import { feed, submit } from './feedback.js';
import { ingest, stats } from './orders.js';
import { requestCode, verifyCode, me, logout } from './auth.js';
import { subscribeEmail, confirmEmail, unsubscribe } from './subs.js';
import { webhook, setup } from './tg.js';

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname, m = req.method;
    const cors = corsHeaders(req, env);
    if (m === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const reply = async (fn) => { const [b, s] = await fn(); return json(b, s, cors); };
    try {
      if (p === '/api/feed' && m === 'GET') return json(await feed(env), 200, { ...cors, 'Cache-Control': 'no-store' });
      if (p === '/api/stats' && m === 'GET') return json(await stats(env), 200, { ...cors, 'Cache-Control': 'public, max-age=300' });
      if (p === '/api/rating' && m === 'POST') return reply(() => submit(req, env, 'rating'));
      if (p === '/api/comment' && m === 'POST') return reply(() => submit(req, env, 'comment'));
      if (p === '/api/orders' && m === 'POST') return reply(() => ingest(req, env));
      if (p === '/api/auth/request' && m === 'POST') return reply(() => requestCode(req, env));
      if (p === '/api/auth/verify' && m === 'POST') return reply(() => verifyCode(req, env));
      if (p === '/api/auth/logout' && m === 'POST') return reply(() => logout(req, env));
      if (p === '/api/me' && m === 'GET') return reply(() => me(req, env));
      if (p === '/api/subscribe' && m === 'POST') return reply(() => subscribeEmail(req, env));
      if (p === '/api/confirm' && m === 'GET') return confirmEmail(env, url.searchParams.get('t'));
      if (p === '/api/unsubscribe' && m === 'GET') return unsubscribe(env, url.searchParams.get('t'));
      if (p.startsWith('/tg/') && m === 'POST') return webhook(req, env, url);
      if (p.startsWith('/setup/') && m === 'GET') return setup(env, url);
      return json({ ok: false, error: 'not_found' }, 404, cors);
    } catch (e) {
      return json({ ok: false, error: 'server_error' }, 500, cors);
    }
  },
};
