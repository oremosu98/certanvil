// Task 15: landing/api/admin/notify-cert-live.js and cert-requests-digest.js (Edge, ESM). fetch is stubbed throughout:
// no Supabase, Resend or Vercel is ever called. Run: node --experimental-detect-module tests/api/notify-cert-live.test.mjs
import assert from 'node:assert/strict';

const ENV = { SUPABASE_URL: 'https://proj.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service',
  RESEND_API_KEY: 'rk', FOUNDER_EMAIL: 'founder@example.com', CRON_SECRET: 'cron-secret' };
const setEnv = (o) => { for (const k of Object.keys(ENV)) delete process.env[k]; Object.assign(process.env, o); };
setEnv(ENV);

const notifyMod = await import('../../landing/api/admin/notify-cert-live.js');
const digestMod = await import('../../landing/api/admin/cert-requests-digest.js');
const notify = notifyMod.default, digest = digestMod.default;

let n = 0;
const t = async (name, fn) => { await fn(); n++; };

let calls = [];
// requesters: rows from cert_requests; users: id -> {email} | 404 | 'boom'; role of the caller; failSend: emails that fail
function stub({ role = 'admin', userOk = true, requesters = [], users = {}, failSend = [], tally = [], stampFail = false, resendOk = true } = {}) {
  calls = [];
  globalThis.fetch = async (url, init = {}) => {
    url = String(url); calls.push({ url, init });
    if (url.endsWith('/auth/v1/user')) return userOk ? new Response(JSON.stringify({ id: 'admin-1' }), { status: 200 }) : new Response('{}', { status: 401 });
    if (url.includes('/rest/v1/profiles')) return new Response(JSON.stringify([{ role }]), { status: 200 });
    if (url.includes('/rest/v1/cert_request_tally')) return new Response(JSON.stringify(tally), { status: 200 });
    if (url.includes('/rest/v1/cert_requests') && (init.method || 'GET') === 'GET') return new Response(JSON.stringify(requesters), { status: 200 });
    if (url.includes('/rest/v1/cert_requests') && init.method === 'PATCH') return new Response('', { status: stampFail ? 500 : 204 });
    if (url.includes('/auth/v1/admin/users/')) {
      const id = decodeURIComponent(url.split('/auth/v1/admin/users/')[1]);
      const u = users[id];
      if (u === 404) return new Response('{}', { status: 404 });
      if (u === 'boom') return new Response('{}', { status: 500 });
      return new Response(JSON.stringify(u || { id }), { status: 200 });
    }
    if (url === 'https://api.resend.com/emails') {
      const body = JSON.parse(init.body);
      if (!resendOk || body.to.some((e) => failSend.includes(e))) return new Response('{}', { status: 422 });
      return new Response('{"id":"m"}', { status: 200 });
    }
    if (url.includes('/rest/v1/client_errors')) return new Response('', { status: 201 });
    throw new Error('unexpected fetch ' + url);
  };
}
const post = (body, token = 'admin-jwt') => new Request('https://certanvil.com/api/admin/notify-cert-live', {
  method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}), body: JSON.stringify(body) });
const mails = () => calls.filter((c) => c.url === 'https://api.resend.com/emails').map((c) => JSON.parse(c.init.body));
const stamps = () => calls.filter((c) => c.init.method === 'PATCH');
const reqs = [
  { id: 'r1', user_id: 'u1', label: 'CCNA' }, { id: 'r2', user_id: 'u2', label: 'CCNA' },
  { id: 'r3', user_id: 'u3', label: 'CCNA' }, { id: 'r4', user_id: 'u4', label: 'CCNA' },
];

await t('notify: GET is 405, OPTIONS 204', async () => {
  stub();
  assert.equal((await notify(new Request('https://certanvil.com/x'))).status, 405);
  assert.equal((await notify(new Request('https://certanvil.com/x', { method: 'OPTIONS' }))).status, 204);
});
await t('notify: 503 when env is missing, nothing is fetched', async () => {
  for (const drop of ['SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']) {
    const e = Object.assign({}, ENV); delete e[drop]; setEnv(e); stub();
    const res = await notify(post({ exam_key: 'ccna' }));
    assert.equal(res.status, 503); assert.deepEqual((await res.json()).missing, [drop]); assert.equal(calls.length, 0);
  }
  setEnv(ENV);
});
await t('notify: no token is 401, a bad token is 401', async () => {
  stub(); assert.equal((await notify(post({ exam_key: 'ccna' }, ''))).status, 401);
  stub({ userOk: false }); assert.equal((await notify(post({ exam_key: 'ccna' }))).status, 401);
  assert.equal(mails().length, 0);
});
await t('notify: a non-admin is refused 403 and nothing is sent or stamped', async () => {
  stub({ role: 'user', requesters: reqs, users: { u1: { email: 'a@x.com' } } });
  const res = await notify(post({ exam_key: 'ccna' }));
  assert.equal(res.status, 403); assert.equal(mails().length, 0); assert.equal(stamps().length, 0);
  assert.ok(!calls.some((c) => c.url.includes('/rest/v1/cert_requests')));
});
await t('notify: exam_key must be normalised, 1 to 80', async () => {
  for (const bad of ['', 'CCNA', ' ccna', 'x'.repeat(81), 5, null, undefined]) {
    stub(); const res = await notify(post({ exam_key: bad })); assert.equal(res.status, 400, JSON.stringify(bad)); assert.equal(mails().length, 0);
  }
  stub({ requesters: [] }); assert.equal((await notify(post({ exam_key: 'x'.repeat(80) }))).status, 200);
});
await t('notify: reads only un-notified rows for that exam, emails each person once and stamps them', async () => {
  stub({ requesters: reqs, users: { u1: { email: 'a@x.com' }, u2: { email: 'b@x.com' }, u3: { email: 'c@x.com' }, u4: { email: 'd@x.com' } } });
  const res = await notify(post({ exam_key: 'ccna' }));
  assert.deepEqual(await res.json(), { sent: 4, failed: 0, skipped: 0 });
  const read = calls.find((c) => c.url.includes('/rest/v1/cert_requests') && !c.init.method);
  assert.ok(read.url.includes('notified_at=is.null') && read.url.includes('exam_key=eq.ccna'));
  assert.equal(mails().length, 4);
  assert.deepEqual(mails().map((m) => m.to), [['a@x.com'], ['b@x.com'], ['c@x.com'], ['d@x.com']]);
  assert.ok(mails().every((m) => m.subject === 'CCNA is now on CertAnvil' && !m.cc && !m.bcc && m.to.length === 1));
  assert.equal(stamps().length, 4);
  assert.ok(stamps().every((s) => s.url.includes('notified_at=is.null') && JSON.parse(s.init.body).notified_at));
});
await t('notify: no email ever lists another requester (one address per message)', async () => {
  stub({ requesters: reqs, users: { u1: { email: 'a@x.com' }, u2: { email: 'b@x.com' }, u3: { email: 'c@x.com' }, u4: { email: 'd@x.com' } } });
  await notify(post({ exam_key: 'ccna' }));
  for (const c of calls.filter((x) => x.url === 'https://api.resend.com/emails')) {
    const raw = c.init.body, own = JSON.parse(raw).to[0];
    for (const other of ['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com']) if (other !== own) assert.ok(!raw.includes(other));
  }
});
await t('notify: users with no auth record or no email are skipped and not stamped', async () => {
  stub({ requesters: reqs, users: { u1: { email: 'a@x.com' }, u2: 404, u3: { id: 'u3', email: '' }, u4: { id: 'u4' } } });
  const out = await (await notify(post({ exam_key: 'ccna' }))).json();
  assert.deepEqual(out, { sent: 1, failed: 0, skipped: 3 });
  assert.equal(mails().length, 1); assert.equal(stamps().length, 1); assert.ok(stamps()[0].url.includes('id=eq.r1'));
});
await t('notify: a failed send is counted and its row is not stamped; a lookup error is a failure', async () => {
  stub({ requesters: reqs, users: { u1: { email: 'a@x.com' }, u2: { email: 'bad@x.com' }, u3: 'boom', u4: { email: 'd@x.com' } }, failSend: ['bad@x.com'] });
  const out = await (await notify(post({ exam_key: 'ccna' }))).json();
  assert.deepEqual(out, { sent: 2, failed: 2, skipped: 0 });
  assert.deepEqual(stamps().map((s) => s.url.match(/id=eq\.(\w+)/)[1]).sort(), ['r1', 'r4']);
});
await t('notify: retry is idempotent, already-notified rows are not asked for and nobody is re-emailed', async () => {
  stub({ requesters: [], users: {} });
  const out = await (await notify(post({ exam_key: 'ccna' }))).json();
  assert.deepEqual(out, { sent: 0, failed: 0, skipped: 0 }); assert.equal(mails().length, 0);
});
await t('notify: the label is escaped in the HTML body', async () => {
  stub({ requesters: [{ id: 'r1', user_id: 'u1', label: '<img src=x onerror=1>&Co' }], users: { u1: { email: 'a@x.com' } } });
  await notify(post({ exam_key: 'k' }));
  const m = mails()[0];
  assert.ok(!m.html.includes('<img') && m.html.includes('&lt;img src=x onerror=1&gt;&amp;Co'));
  assert.equal(m.subject, '<img src=x onerror=1>&Co is now on CertAnvil');
});

// ── digest ──
const dreq = (token, method = 'GET') => new Request('https://certanvil.com/api/admin/cert-requests-digest', { method, headers: token ? { Authorization: 'Bearer ' + token } : {} });
const tally = [
  { exam_key: 'ccna', label: 'CCNA', votes: 41, new_7d: 5, last_at: '2026-10-30T10:00:00Z', typed: false },
  { exam_key: 'cysa+', label: 'CySA+', votes: 18, new_7d: 3, last_at: '2026-10-29T10:00:00Z', typed: false },
  { exam_key: 'saa', label: 'AWS Solutions Architect', votes: 15, new_7d: 2, last_at: '2026-10-29T09:00:00Z', typed: false },
  { exam_key: 'itil 4', label: 'ITIL 4', votes: 6, new_7d: 2, last_at: '2026-10-30T10:00:00Z', typed: true },
  { exam_key: 'ceh', label: 'CEH', votes: 3, new_7d: 1, last_at: '2026-10-28T10:00:00Z', typed: true },
];
await t('digest: refuses without the secret, with a wrong secret, and for non-GET', async () => {
  stub({ tally });
  assert.equal((await digest(dreq(''))).status, 401);
  assert.equal((await digest(dreq('wrong'))).status, 401);
  assert.equal((await digest(dreq('cron-secret', 'POST'))).status, 405);
  assert.equal(calls.length, 0);
});
await t('digest: 503 when any env var is missing, nothing is fetched', async () => {
  for (const drop of ['CRON_SECRET', 'FOUNDER_EMAIL', 'RESEND_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    const e = Object.assign({}, ENV); delete e[drop]; setEnv(e); stub({ tally });
    const res = await digest(dreq('cron-secret')); assert.equal(res.status, 503, drop); assert.equal(calls.length, 0);
  }
  setEnv(ENV);
});
await t('digest: asks for the tally in explicit order and builds the subject and body from it', async () => {
  stub({ tally });
  const res = await digest(dreq('cron-secret'));
  assert.equal(res.status, 200); assert.deepEqual(await res.json(), { sent: true, n: 13 });
  const read = calls.find((c) => c.url.includes('cert_request_tally'));
  assert.ok(read.url.includes('order=votes.desc,last_at.desc') && read.init.headers.Authorization === 'Bearer service');
  const m = mails(); assert.equal(m.length, 1);
  assert.deepEqual(m[0].to, ['founder@example.com']); assert.equal(m[0].subject, 'Cert requests this week: 13 new');
  assert.ok(m[0].html.includes('<b>CCNA</b> · 41 (+5)') && m[0].html.includes('<b>CySA+</b> · 18 (+3)') && m[0].html.includes('<b>AWS Solutions Architect</b> · 15 (+2)'));
  assert.ok(!m[0].html.includes('CEH</b>') && m[0].html.includes('ITIL 4, CEH'));
  assert.ok(m[0].text.includes('1. CCNA · 41 (+5)') && m[0].text.includes('ITIL 4, CEH'));
});
await t('digest: labels are escaped in the HTML body', async () => {
  stub({ tally: [{ exam_key: 'x', label: '<script>alert(1)</script>', votes: 2, new_7d: 2, last_at: 'z', typed: true }] });
  await digest(dreq('cron-secret'));
  const m = mails()[0]; assert.ok(!m.html.includes('<script>') && m.html.includes('&lt;script&gt;'));
});
await t('digest: with no requests it still sends a short "0 new" note', async () => {
  stub({ tally: [] });
  assert.equal((await digest(dreq('cron-secret'))).status, 200);
  const m = mails(); assert.equal(m.length, 1); assert.equal(m[0].subject, 'Cert requests this week: 0 new'); assert.ok(m[0].text.includes('No new requests this week.'));
});
await t('digest: a failed read or send answers 502', async () => {
  stub({ tally }); const f = globalThis.fetch;
  globalThis.fetch = async (u, i) => String(u).includes('cert_request_tally') ? new Response('{}', { status: 500 }) : f(u, i);
  assert.equal((await digest(dreq('cron-secret'))).status, 502);
  stub({ tally, resendOk: false }); assert.equal((await digest(dreq('cron-secret'))).status, 502);
});

console.log('notify-cert-live + digest: ' + n + '/' + n + ' passed');
