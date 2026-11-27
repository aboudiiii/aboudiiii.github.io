// Cloudflare Worker for aboudiiii.github.io: feedback, orders/stats, subscribers, customer accounts.
// Storage: D1 (binding DB). No dependencies.
import { json, corsHeaders } from './util.js';
import { feed, submit } from './feedback.js';
import { ingest, stats } from './orders.js';
import { requestCode, verifyCode, tgStart, tgPoll, me, logout } from './auth.js';
import { subscribeEmail, confirmEmail, unsubscribe } from './subs.js';
import { webhook, setup } from './tg.js';
import { adminSummary, adminCoupons } from './admin.js';
import { sendScheduledReports } from './reports.js';
import { autopost } from './autopost.js';
import { trackAnalytics, adminAnalytics } from './analytics.js';
import { shopWebhook, setupShopWebhook } from './shopbot.js';
import { createReaderSession, readerPage, readerShell } from './reader.js';

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil((async () => {
      if (controller.cron === '0 5 * * *') await sendScheduledReports(env, controller.scheduledTime); // daily owner report
      await autopost(env, controller.scheduledTime);                                                     // channel post (3x/day)
      await env.DB.prepare('DELETE FROM analytics_events WHERE created_at < ?').bind(Date.now() - 90 * 86400000).run();
    })());
  },
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname, m = req.method;
    const cors = corsHeaders(req, env);
    if (m === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const reply = async (fn) => { const [b, s] = await fn(); return json(b, s, cors); };
    try {
      if (p === '/reader' && m === 'GET') return readerShell();
      if (p === '/api/shop/reader/session' && m === 'POST') return createReaderSession(req, env);
      const readerPageMatch = p.match(/^\/api\/shop\/reader\/page\/(\d+)$/);
      if (readerPageMatch && m === 'GET') return readerPage(req, env, Number(readerPageMatch[1]));
      if (p === '/api/feed' && m === 'GET') return json(await feed(env), 200, { ...cors, 'Cache-Control': 'no-store' });
      if (p === '/api/stats' && m === 'GET') return json(await stats(env), 200, { ...cors, 'Cache-Control': 'public, max-age=300' });
      if (p === '/api/admin/summary' && m === 'GET') return reply(() => adminSummary(req, env));
      if (p === '/api/admin/analytics' && m === 'GET') return reply(() => adminAnalytics(req, env));
      if (p === '/api/analytics' && m === 'POST') return reply(() => trackAnalytics(req, env));
      if (p === '/api/admin/coupons' && (m === 'GET' || m === 'POST')) return reply(() => adminCoupons(req, env));
      if (p === '/api/rating' && m === 'POST') return reply(() => submit(req, env, 'rating'));
      if (p === '/api/comment' && m === 'POST') return reply(() => submit(req, env, 'comment'));
      if (p === '/api/orders' && m === 'POST') return reply(() => ingest(req, env));
      if (p === '/api/auth/request' && m === 'POST') return reply(() => requestCode(req, env));
      if (p === '/api/auth/verify' && m === 'POST') return reply(() => verifyCode(req, env));
      if (p === '/api/auth/tg/start' && m === 'POST') return reply(() => tgStart(req, env));
      if (p === '/api/auth/tg/poll' && m === 'POST') return reply(() => tgPoll(req, env));
      if (p === '/api/auth/logout' && m === 'POST') return reply(() => logout(req, env));
      if (p === '/api/me' && m === 'GET') return reply(() => me(req, env));
      if (p === '/api/subscribe' && m === 'POST') return reply(() => subscribeEmail(req, env));
      if (p === '/api/confirm' && m === 'GET') return confirmEmail(env, url.searchParams.get('t'));
      if (p === '/api/unsubscribe' && m === 'GET') return unsubscribe(env, url.searchParams.get('t'));
      if (p.startsWith('/shop-tg/') && m === 'POST') return shopWebhook(req, env, url);
      if (p.startsWith('/setup-shop/') && m === 'GET') return setupShopWebhook(env, url);
      if (p.startsWith('/tg/') && m === 'POST') return webhook(req, env, url);
      if (p.startsWith('/setup/') && m === 'GET') return setup(env, url);
      return json({ ok: false, error: 'not_found' }, 404, cors);
    } catch (e) {
      return json({ ok: false, error: 'server_error' }, 500, cors);
    }
  },
};
