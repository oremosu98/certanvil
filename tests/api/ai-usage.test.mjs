// Admin-only GET /api/ai/usage. fetch is stubbed: no Supabase is ever called.
// Run: node tests/api/ai-usage.test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

process.env.SUPABASE_URL = 'https://proj.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon';
delete process.env.AI_GLOBAL_DAILY_LIMIT;
const handler = require('../../api/ai/usage.js');

let n = 0;
const t = async (name, fn) => { try { await fn(); n++; } catch (e) { console.error('FAILED: ' + name); throw e; } };

let calls = [];
function stub({ role = 'admin', row = null, authOk = true } = {}) {
  calls = [];
  globalThis.fetch = async (url, init = {}) => {
    url = String(url); calls.push({ url, init });
    if (url.endsWith('/auth/v1/user')) return authOk ? new Response(JSON.stringify({ id: 'u1' }), { status: 200 }) : new Response('{}', { status: 401 });
    if (url.includes('/rest/v1/profiles')) return new Response(JSON.stringify(role ? [{ role }] : []), { status: 200 });
    if (url.includes('/rest/v1/ai_proxy_rate_limit')) return new Response(JSON.stringify(row ? [row] : []), { status: 200 });
    throw new Error('unexpected fetch ' + url);
  };
}
function call(method = 'GET', auth = 'Bearer tok') {
  const res = { code: 0, body: null, headers: {}, status(c) { this.code = c; return this; }, setHeader(k, v) { this.headers[k] = v; }, json(b) { this.body = b; return this; }, send(b) { this.body = b; return this; }, end() { return this; } };
  const req = { method, headers: auth ? { authorization: auth } : {}, query: {} };
  return handler(req, res).then(() => res);
}
const today = () => new Date().toISOString();
const yesterday = () => new Date(Date.now() - 36 * 3600e3).toISOString();

await t('403 for a non-admin', async () => {
  stub({ role: 'user', row: { call_count: 5, window_start: today() } });
  const r = await call(); assert.equal(r.code, 403);
  assert.ok(!calls.some((c) => c.url.includes('ai_proxy_rate_limit')), 'must not read the counter');
});
await t('401 without a token', async () => { stub(); const r = await call('GET', ''); assert.equal(r.code, 401); });
await t('401 when the token does not verify', async () => { stub({ authOk: false }); const r = await call(); assert.equal(r.code, 401); });
await t('returns used and the env override limit (AI_GLOBAL_DAILY_LIMIT=300 -> 300)', async () => {
  process.env.AI_GLOBAL_DAILY_LIMIT = '300';
  stub({ row: { call_count: 42, window_start: today() } });
  const r = await call(); delete process.env.AI_GLOBAL_DAILY_LIMIT;
  assert.equal(r.code, 200); assert.equal(r.body.used, 42); assert.equal(r.body.limit, 300);
  assert.ok(!Number.isNaN(Date.parse(r.body.resetsAt)));
});
await t('default limit is 614', async () => { stub({ row: { call_count: 1, window_start: today() } }); const r = await call(); assert.equal(r.body.limit, 614); });
await t('a window from yesterday reads 0', async () => {
  stub({ row: { call_count: 99, window_start: yesterday() } });
  const r = await call(); assert.equal(r.code, 200); assert.equal(r.body.used, 0);
});
await t('no row reads 0', async () => { stub({ row: null }); const r = await call(); assert.equal(r.body.used, 0); });
await t('reads the caller token, not a service key', async () => {
  stub({ row: { call_count: 1, window_start: today() } }); await call();
  for (const c of calls) assert.equal(c.init.headers.Authorization, 'Bearer tok');
});
await t('405 for non-GET', async () => { stub(); const r = await call('POST'); assert.equal(r.code, 405); });
await t('503 when Supabase env is missing', async () => {
  const u = process.env.SUPABASE_URL; delete process.env.SUPABASE_URL;
  stub(); const r = await call(); process.env.SUPABASE_URL = u; assert.equal(r.code, 503);
});
console.log('ai-usage: ' + n + ' passed');
