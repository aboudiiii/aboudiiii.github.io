import test from 'node:test';
import assert from 'node:assert/strict';
import { fakeD1 } from './helpers.mjs';
import { hit } from '../src/util.js';

test('rate limiter enforces a fixed-window limit', async () => {
  const env = { DB: fakeD1() };
  assert.equal(await hit(env, 'client-a', 3, 60), true);
  assert.equal(await hit(env, 'client-a', 3, 60), true);
  assert.equal(await hit(env, 'client-a', 3, 60), true);
  assert.equal(await hit(env, 'client-a', 3, 60), false);
  assert.equal(env.DB.db.prepare('SELECT n FROM rate WHERE k = ?').get('client-a').n, 3);
});

test('rate limiter resets an expired window atomically', async () => {
  const env = { DB: fakeD1() };
  env.DB.db.prepare('INSERT INTO rate (k, n, expires_at) VALUES (?, ?, ?)').run('client-b', 99, Date.now() - 1);
  assert.equal(await hit(env, 'client-b', 2, 60), true);
  assert.equal(env.DB.db.prepare('SELECT n FROM rate WHERE k = ?').get('client-b').n, 1);
  assert.equal(await hit(env, 'client-b', 2, 60), true);
  assert.equal(await hit(env, 'client-b', 2, 60), false);
});

test('concurrent requests cannot exceed the configured rate limit', async () => {
  const env = { DB: fakeD1() };
  const results = await Promise.all(Array.from({ length: 30 }, () => hit(env, 'client-c', 5, 60)));
  assert.equal(results.filter(Boolean).length, 5);
  assert.equal(env.DB.db.prepare('SELECT n FROM rate WHERE k = ?').get('client-c').n, 5);
});
