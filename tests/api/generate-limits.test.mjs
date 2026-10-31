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
const { GLOBAL_DAILY_LIMIT_DEFAULT, ALERT_TIMEOUT_MS } = mod._internal;

const _log = console.log; console.log = () => {};
let n = 0;
const t = async (name, fn) => { try { await fn(); n++; } catch (e) { console.error('FAILED: ' + name); throw e; } };

let calls = [];
// counts: current_count per rl key prefix; block: which rl keys answer allowed=false; alertUsed: alert gate already spent
function stub({ counts = {}, block = [], alertSeen = false, resendHangs = false, resendStatus = 200, resendThrows = false, gateFails = false } = {}) {
  calls = [];
  let alertSent = alertSeen;
  globalThis.fetch = async (url, init = {}) => {
    url = String(url); calls.push({ url, init });
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'user-1' }), { status: 200 });
    if (url.includes('/rpc/ai_rl_check_and_increment')) {
      const { p_key, p_limit } = JSON.parse(init.body);
      let allowed = !block.some((b) => p_key.startsWith(b));
      if (p_key.startsWith('alert:global80')) {
        if (gateFails) return new Response('{}', { status: 500 });
        allowed = !alertSent; alertSent = true;
      }
      const cur = p_key.startsWith('global') ? (counts.global ?? 1) : 1;
      return new Response(JSON.stringify([{ allowed, current_count: cur, limit: p_limit }]), { status: 200 });
    }
    if (url.includes('/rpc/consume_daily_quota')) return new Response('true', { status: 200 });
    if (url === 'https://api.anthropic.com/v1/messages') {
      return new Response(JSON.stringify({ content: [{ type: 'text', text: 'hi' }], usage: { input_tokens: 11, output_tokens: 22, cache_read_input_tokens: 3 } }), { status: 200 });
    }
    if (url === 'https://api.resend.com/emails') {
      if (resendThrows) throw new Error('network down');
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

await t('default limit is 614 (budget-sized from the fast-start call structure), and env unset uses it', async () => {
  assert.equal(GLOBAL_DAILY_LIMIT_DEFAULT, 614);
  setEnv({}); stub(); await call();
  assert.equal(rlLimit('global'), 614);
});
await t('env AI_GLOBAL_DAILY_LIMIT is honoured', async () => {
  setEnv({ AI_GLOBAL_DAILY_LIMIT: '321' }); stub(); await call();
  assert.equal(rlLimit('global'), 321);
});
await t('invalid, zero or negative env falls back to the default', async () => {
  for (const v of ['abc', '0', '-5', '']) { setEnv({ AI_GLOBAL_DAILY_LIMIT: v }); stub(); await call(); assert.equal(rlLimit('global'), 614, v); }
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
await t('alert gate is keyed on the UTC date and the email states the 24-hour window', async () => {
  setEnv({ AI_GLOBAL_DAILY_LIMIT: '100', RESEND_API_KEY: 'rk', FOUNDER_EMAIL: 'f@example.com' });
  stub({ counts: { global: 80 } }); await call(); await settle();
  const keys = calls.map((c) => c.url.includes('ai_rl_check') ? JSON.parse(c.init.body).p_key : '').filter((k) => k.startsWith('alert:'));
  assert.deepEqual(keys, ['alert:global80:' + new Date().toISOString().slice(0, 10)]);
  const text = JSON.parse(emails()[0].init.body).text;
  assert.ok(text.includes('24 hours') && !text.includes('midnight UTC'));
});
await t('alert fires only at exactly the threshold, not past it', async () => {
  setEnv({ AI_GLOBAL_DAILY_LIMIT: '100', RESEND_API_KEY: 'rk', FOUNDER_EMAIL: 'f@example.com' });
  stub({ counts: { global: 81 } }); await call(); await settle();
  assert.equal(emails().length, 0);
  assert.ok(!calls.some((c) => c.url.includes('ai_rl_check') && JSON.parse(c.init.body).p_key.startsWith('alert:')));
});
await t('non-integer threshold rounds up: limit 7 alerts at 6', async () => {
  setEnv({ AI_GLOBAL_DAILY_LIMIT: '7', RESEND_API_KEY: 'rk', FOUNDER_EMAIL: 'f@example.com' });
  stub({ counts: { global: 5 } }); await call(); await settle(); assert.equal(emails().length, 0);
  stub({ counts: { global: 6 } }); await call(); await settle(); assert.equal(emails().length, 1);
});
await t('Resend throwing, a non-ok Resend, or the gate RPC failing never touches the AI response', async () => {
  setEnv({ AI_GLOBAL_DAILY_LIMIT: '100', RESEND_API_KEY: 'rk', FOUNDER_EMAIL: 'f@example.com' });
  const errs = []; const oe = console.error; console.error = (...a) => errs.push(a.join(' '));
  try {
    stub({ counts: { global: 80 }, resendThrows: true }); let r = await call(); await settle(); assert.equal(r.code, 200);
    stub({ counts: { global: 80 }, gateFails: true }); r = await call(); await settle(); assert.equal(r.code, 200); assert.equal(emails().length, 0);
    stub({ counts: { global: 80 }, resendStatus: 422 }); r = await call(); await settle(); assert.equal(r.code, 200);
    assert.ok(errs.some((e) => e.includes('resend status 422') && !e.includes('f@example.com') && !e.includes('rk')));
  } finally { console.error = oe; }
});
await t('env limit must be a positive integer up to 100000', async () => {
  for (const v of ['1.5', '100001', '1e3x', ' ', 'Infinity']) { setEnv({ AI_GLOBAL_DAILY_LIMIT: v }); stub(); await call(); assert.equal(rlLimit('global'), 614, v); }
  setEnv({ AI_GLOBAL_DAILY_LIMIT: '100000' }); stub(); await call(); assert.equal(rlLimit('global'), 100000);
});
await t('no email below the threshold', async () => {
  setEnv({ AI_GLOBAL_DAILY_LIMIT: '100', RESEND_API_KEY: 'rk', FOUNDER_EMAIL: 'f@example.com' });
  stub({ counts: { global: 79 } }); await call(); await settle();
  assert.equal(emails().length, 0);
  assert.ok(!calls.some((c) => c.url.includes('ai_rl_check') && JSON.parse(c.init.body).p_key.startsWith('alert:global80')));
});
await t('no email (and no alert counter) when RESEND_API_KEY or FOUNDER_EMAIL is missing', async () => {
  for (const env of [{ FOUNDER_EMAIL: 'f@example.com' }, { RESEND_API_KEY: 'rk' }, {}]) {
    setEnv({ AI_GLOBAL_DAILY_LIMIT: '100', ...env }); stub({ counts: { global: 80 } });
    const r = await call(); await settle();
    assert.equal(r.code, 200); assert.equal(emails().length, 0);
  }
});
await t('the 80% alert is awaited: the email is sent before the handler returns', async () => {
  setEnv({ AI_GLOBAL_DAILY_LIMIT: '100', RESEND_API_KEY: 'rk', FOUNDER_EMAIL: 'f@example.com' });
  stub({ counts: { global: 80 } });
  const r = await call();   // no settle(): an un-awaited alert would not have fetched yet
  assert.equal(r.code, 200); assert.equal(emails().length, 1);
  assert.ok(emails()[0].init.signal, 'the Resend fetch carries an abort signal');
});
await t('a failing or hanging Resend delays the AI response by at most the alert timeout, never fails it', async () => {
  assert.equal(ALERT_TIMEOUT_MS, 3000);
  setEnv({ AI_GLOBAL_DAILY_LIMIT: '100', RESEND_API_KEY: 'rk', FOUNDER_EMAIL: 'f@example.com' });
  const oe = console.error; console.error = () => {};
  stub({ counts: { global: 80 }, resendHangs: true });
  const t0 = Date.now();
  let r;
  try { r = await Promise.race([call(), new Promise((res) => setTimeout(() => res('TIMEOUT'), ALERT_TIMEOUT_MS + 1500))]); } finally { console.error = oe; }
  assert.notEqual(r, 'TIMEOUT'); assert.equal(r.code, 200); assert.ok(JSON.parse(r.body).content);
  assert.ok(Date.now() - t0 >= ALERT_TIMEOUT_MS - 50, 'waited for the capped alert');
  stub({ counts: { global: 80 }, resendStatus: 500 });
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
