import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../src/index.js';

export function fakeD1() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(readFileSync(new URL('../migrations/0001_init.sql', import.meta.url), 'utf8'));
  const prepare = (sql) => {
    let args = [];
    const st = {
      bind: (...a) => { args = a; return st; },
      first: async () => db.prepare(sql).get(...args) ?? null,
      all: async () => ({ results: db.prepare(sql).all(...args) }),
      run: async () => { const r = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(r.changes) } }; },
      _run: () => db.prepare(sql).run(...args),
    };
    return st;
  };
  return { db, prepare, batch: async (stmts) => { db.exec('BEGIN'); try { stmts.forEach((s) => s._run()); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } return []; } };
}

export function setup(over = {}) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    const body = init && init.body ? JSON.parse(init.body) : null;
    calls.push({ url: u, body, headers: init && init.headers });
    const status = over.tgFail && over.tgFail(u, body) ? 403 : 200;
    return new Response('{"ok":true}', { status });
  };
  const env = { DB: fakeD1(), TG_TOKEN: 'T', TG_OWNER_ID: '111', TG_WEBHOOK_SECRET: 'sec', RATE_SALT: 's', BOT_API_KEY: 'botkey', BREVO_API_KEY: 'bk', MAIL_FROM: 'me@example.com', SITE_URL: 'https://aboudiiii.github.io', ALLOWED_ORIGINS: 'https://aboudiiii.github.io' };
  return { env, calls, mails: () => calls.filter((c) => c.url.includes('brevo')), tgCalls: (m) => calls.filter((c) => c.url.includes('/' + m)) };
}
export const old = () => Date.now() - 10000;
export const call = (env, method, path, body, { ip = '1.1.1.1', headers = {} } = {}) =>
  worker.fetch(new Request('https://w.test' + path, { method, headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip, Origin: 'https://aboudiiii.github.io', ...headers }, body: body ? JSON.stringify(body) : undefined }), env);
export const post = (env, path, body, o) => call(env, 'POST', path, body, o);
export const get = (env, path, o) => call(env, 'GET', path, undefined, o);
export const hook = (env, body, secret = 'sec') => worker.fetch(new Request('https://w.test/tg/' + secret, { method: 'POST', body: JSON.stringify(body) }), env);
export const press = (env, data, from = 111) => hook(env, { callback_query: { id: 'q', from: { id: from }, data, message: { chat: { id: from }, message_id: 7 } } });
export const say = (env, text, from = 111) => hook(env, { message: { text, from: { id: from }, chat: { id: from } } });
