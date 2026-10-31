// Task 16: api/ai/generate.js limits. fetch is stubbed throughout: no Supabase, Resend or Anthropic is ever called.
// Run: node tests/api/generate-limits.test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const BASE = { SUPABASE_URL: 'https://proj.supabase.co', SUPABASE_ANON_KEY: 'anon', ANTHROPIC_API_KEY: 'ak' };
const OPT = ['AI_GLOBAL_DAILY_LIMIT', 'RESEND_API_KEY', 'FOUNDER_EMAIL', 'NOTIFY_FROM_EMAIL'];
const setEnv = (o) => { for (const k of OPT) delete process.env[k]; Object.assign(process.env, BASE, o); };
setEnv({});
const mod = require('../../api/ai/generate.js');
const handler = mod;
const { GLOBAL_DAILY_LIMIT_DEFAULT } = mod._internal;

const _log = console.log; console.log = () => {};
let n = 0;
const t = async (name, fn) => { try { await fn(); n++; } catch (e) { console.error('FAILED: ' + name); throw e; } };

let calls = [];
// counts: current_count per rl key prefix; block: which rl keys answer allowed=false; alertUsed: alert gate already spent
function stub({ counts = {}, block = [], alertSeen = false, resendHangs = false, resendStatus = 200 } = {}) {
  calls = [];
  let alertSent = alertSeen;
  globalThis.fetch = async (url, init = {}) => {
    url = String(url); calls.push({ url, init });
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'user-1' }), { status: 200 });
    if (url.includes('/rpc/ai_rl_check_and_increment')) {
      const { p_key, p_limit } = JSON.parse(init.body);
      let allowed = !block.some((b) => p_key.startsWith(b));
      if (p_key === 'alert:global80') { allowed = !alertSent; alertSent = true; }
      const cur = p_key.startsWith('global') ? (counts.global ?? 1) : 1;
      return new Response(JSON.stringify([{ allowed, current_count: cur, limit: p_limit }]), { status: 200 });
    }
    if (url.includes('/rpc/consume_daily_quota')) return new Response('true', { status: 200 });
    if (url === 'https://api.anthropic.com/v1/messages') {
      return new Response(JSON.stringify({ content: [{ type: 'text', text: 'hi' }], usage: { input_tokens: 11, output_tokens: 22, cache_read_input_tokens: 3 } }), { status: 200 });
    }
    if (url === 'https://api.resend.com/emails') {
      if (resendHangs) return new Promise(() => {});
      return new Response('{"id":"m"}', { status: resendStatus });
    }
    throw new Error('unexpected fetch ' + url);
  };
}
function call() {
  const res = { code: 0, body: '', headers: {}, status(c) { this.code = c; return this; }, setHeader(k, v) { this.headers[k] = v; }, send(b) { this.body = b; } };
  const req = { method: 'POST', headers: { authorization: 'Bearer tok', 'x-forwarded-for': '1.2.3.4' }, body: { model: 'claude-haiku-5-5', max_tokens: 100, messages: [{ role: 'user', content: 'q' }] } };
  return handler(req, res).then(() => res);
}
const rlLimit = (prefix) => { const c = calls.find((x) => x.url.includes('ai_rl_check') && JSON.parse(x.init.body).p_key.startsWith(prefix)); return c && JSON.parse(c.init.body).p_limit; };
const emails = () => calls.filter((c) => c.url === 'https://api.resend.com/emails');
const settle = () => new Promise((r) => setTimeout(r, 20));

await t('default limit is 160 (budget-sized), and env unset uses it', async () => {
  assert.equal(GLOBAL_DAILY_LIMIT_DEFAULT, 160);
  setEnv({}); stub(); await call();
  assert.equal(rlLimit('global'), 160);
});
await t('env AI_GLOBAL_DAILY_LIMIT is honoured', async () => {
  setEnv({ AI_GLOBAL_DAILY_LIMIT: '321' }); stub(); await call();
  assert.equal(rlLimit('global'), 321);
});
await t('invalid, zero or negative env falls back to the default', async () => {
  for (const v of ['abc', '0', '-5', '']) { setEnv({ AI_GLOBAL_DAILY_LIMIT: v }); stub(); await call(); assert.equal(rlLimit('global'), 160, v); }
});
await t('user and ip limits are untouched', async () => {
  setEnv({}); stub(); await call();
  assert.equal(rlLimit('user:'), 500); assert.equal(rlLimit('ip:'), 200);
});
await t('every blocked path carries the right scope and the kinder message', async () => {
  for (const [key, scope] of [['user:', 'user'], ['ip:', 'ip'], ['global', 'global']]) {
    setEnv({}); stub({ block: [key] });
    const r = await call(); const b = JSON.parse(r.body);
    assert.equal(r.code, 429); assert.equal(b.error, 'rate_limited'); assert.equal(b.scope, scope);
    assert.equal(b.message, "We're very busy right now. Your questions will be back shortly.");
  }
});
await t('80% email: sent exactly once at the threshold, with limit and count', async () => {
  setEnv({ AI_GLOBAL_DAILY_LIMIT: '100', RESEND_API_KEY: 'rk', FOUNDER_EMAIL: 'f@example.com' });
  stub({ counts: { global: 80 } });
  let r = await call(); await settle();
  assert.equal(r.code, 200); assert.equal(emails().length, 1);
  const e = emails()[0]; const body = JSON.parse(e.init.body);
  assert.equal(body.subject, "CertAnvil AI at 80% of today's limit");
  assert.deepEqual(body.to, ['f@example.com']);
  assert.ok(body.text.includes('80 of 100'));
  assert.equal(e.init.headers.Authorization, 'Bearer rk');
  await call(); await settle(); // gate already spent in the stub
  assert.equal(emails().length, 1);
});
await t('no email below the threshold', async () => {
  setEnv({ AI_GLOBAL_DAILY_LIMIT: '100', RESEND_API_KEY: 'rk', FOUNDER_EMAIL: 'f@example.com' });
  stub({ counts: { global: 79 } }); await call(); await settle();
  assert.equal(emails().length, 0);
  assert.ok(!calls.some((c) => c.url.includes('ai_rl_check') && JSON.parse(c.init.body).p_key === 'alert:global80'));
});
await t('no email (and no alert counter) when RESEND_API_KEY or FOUNDER_EMAIL is missing', async () => {
  for (const env of [{ FOUNDER_EMAIL: 'f@example.com' }, { RESEND_API_KEY: 'rk' }, {}]) {
    setEnv({ AI_GLOBAL_DAILY_LIMIT: '100', ...env }); stub({ counts: { global: 95 } });
    const r = await call(); await settle();
    assert.equal(r.code, 200); assert.equal(emails().length, 0);
  }
});
await t('a failing or hanging Resend never delays or fails the AI response', async () => {
  setEnv({ AI_GLOBAL_DAILY_LIMIT: '100', RESEND_API_KEY: 'rk', FOUNDER_EMAIL: 'f@example.com' });
  stub({ counts: { global: 90 }, resendHangs: true });
  const r = await Promise.race([call(), new Promise((res) => setTimeout(() => res('TIMEOUT'), 1500))]);
  assert.notEqual(r, 'TIMEOUT'); assert.equal(r.code, 200); assert.ok(JSON.parse(r.body).content);
  stub({ counts: { global: 90 }, resendStatus: 500 });
  const r2 = await call(); assert.equal(r2.code, 200);
});
await t('usage is logged as one structured line with no prompt text or user id', async () => {
  setEnv({}); stub();
  const logs = []; const orig = console.log; console.log = (...a) => logs.push(a.join(' '));
  try { await call(); } finally { console.log = orig; }
  const line = logs.find((l) => l.includes('"ai_usage"'));
  assert.ok(line); const o = JSON.parse(line);
  assert.equal(o.model, 'claude-haiku-5-5'); assert.equal(o.input_tokens, 11); assert.equal(o.output_tokens, 22); assert.equal(o.cache_read_input_tokens, 3);
  assert.ok(!line.includes('user-1') && !line.includes('"q"'));
});

console.log = _log;
console.log('generate-limits: ' + n + ' passed');
