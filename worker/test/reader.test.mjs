import test from 'node:test';
import assert from 'node:assert/strict';
import { readerPage, readerShell } from '../src/reader.js';

test('reader shell is no-store and includes Telegram Mini App bootstrap', () => {
  const response = readerShell();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  return response.text().then(html => {
    assert.match(html, /telegram-web-app\.js/);
    assert.match(html, /api\/shop\/reader\/session/);
    assert.match(html, /نسخة مرخصة/);
  });
});

test('reader page rejects missing bearer token and invalid page before storage access', async () => {
  const missing = await readerPage(new Request('https://example.test'), {}, 1);
  assert.equal(missing.status, 403);
  const invalid = await readerPage(new Request('https://example.test', { headers:{ Authorization:'Bearer abc' } }), {}, 0);
  assert.equal(invalid.status, 403);
});
