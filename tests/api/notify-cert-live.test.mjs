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
notifyMod._tuning.gapMs = 0;

let n = 0;
const t = async (name, fn) => { await fn(); n++; };

let calls = [];
// requesters: rows from cert_requests; users: id -> {email} | 404 | 'boom'; role of the caller; failSend: emails that fail
function stub({ role = 'admin', userOk = true, requesters = [], users = {}, failSend = [], tally = [], stampFail = false, resendOk = true, label = 'CCNA', rate = [], bugs = [], errs = [], bugsFail = false, errsFail = false } = {}) {
  calls = [];
  globalThis.fetch = async (url, init = {}) => {
    url = String(url); calls.push({ url, init });
    if (url.endsWith('/auth/v1/user')) return userOk ? new Response(JSON.stringify({ id: 'admin-1' }), { status: 200 }) : new Response('{}', { status: 401 });
    if (url.includes('/rest/v1/profiles')) return new Response(JSON.stringify([{ role }]), { status: 200 });
    if (url.includes('/rest/v1/cert_request_tally') && url.includes('exam_key=eq.')) return new Response(JSON.stringify(label === null ? [] : [{ label }]), { status: 200 });
    if (url.includes('/rest/v1/cert_request_tally')) return new Response(JSON.stringify(tally), { status: 200 });
    if (url.includes('/rest/v1/cert_requests') && (init.method || 'GET') === 'GET') {
      const lim = Number((url.match(/limit=(\d+)/) || [])[1]) || 1000, aft = (url.match(/id=gt\.([0-9a-f-]+)/) || [])[1];
      const pool = requesters.filter((r) => !aft || r.id > aft).sort((a, b) => (a.id < b.id ? -1 : 1));
      return new Response(JSON.stringify(pool.slice(0, lim)), { status: 206, headers: { 'content-range': '0-' + Math.max(0, Math.min(lim, pool.length) - 1) + '/' + pool.length } });
    }
    if (url.includes('/rest/v1/admin_audit_log')) return new Response('', { status: 201 });
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
      if (body.to.some((e) => rate.includes(e))) return new Response('{}', { status: 429 });
      if (!resendOk || body.to.some((e) => failSend.includes(e))) return new Response('{}', { status: 422 });
      return new Response('{"id":"m"}', { status: 200 });
    }
    if (url.includes('/rest/v1/user_bug_reports')) {
      if (bugsFail) return new Response('{}', { status: 500 });
      const open = bugs.filter((b) => ['open', 'triaged'].includes(b.status)).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      return new Response(JSON.stringify(open.slice(0, 3).map((b) => ({ title: b.title }))), { status: 206, headers: { 'content-range': '0-2/' + open.length } });
    }
    if (url.includes('/rest/v1/client_errors') && (init.method || 'GET') === 'GET') {
      if (errsFail) return new Response('{}', { status: 500 });
      return new Response(JSON.stringify(errs), { status: 200 });
    }
    if (url.includes('/rest/v1/client_errors')) return new Response('', { status: 201 });
    throw new Error('unexpected fetch ' + url);
  };
}
const post = (body, token = 'admin-jwt') => new Request('https://certanvil.com/api/admin/notify-cert-live', {
  method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}), body: JSON.stringify(body) });
const mails = () => calls.filter((c) => c.url === 'https://api.resend.com/emails').map((c) => JSON.parse(c.init.body));
const stamps = () => calls.filter((c) => c.init.method === 'PATCH');
const U = (n) => '00000000-0000-0000-0000-00000000000' + n;
const reqs = [1, 2, 3, 4].map((i) => ({ id: U(i), user_id: 'u' + i }));
const P = (o) => Object.assign({ exam_key: 'ccna', label: 'CCNA' }, o);

await t('notify: GET is 405, OPTIONS 204', async () => {
  stub();
  assert.equal((await notify(new Request('https://certanvil.com/x'))).status, 405);
  assert.equal((await notify(new Request('https://certanvil.com/x', { method: 'OPTIONS' }))).status, 204);
});
await t('notify: 503 when env is missing, nothing is fetched', async () => {
  for (const drop of ['SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']) {
    const e = Object.assign({}, ENV); delete e[drop]; setEnv(e); stub();
    const res = await notify(post(P()));
    assert.equal(res.status, 503); const j = await res.json(); assert.deepEqual(j, { error: 'not-configured' }); assert.ok(!JSON.stringify(j).includes(drop)); assert.equal(calls.length, 0);
  }
  setEnv(ENV);
});
await t('notify: no token is 401, a bad token is 401', async () => {
  stub(); assert.equal((await notify(post(P(), ''))).status, 401);
  stub({ userOk: false }); assert.equal((await notify(post(P()))).status, 401);
  assert.equal(mails().length, 0);
});
await t('notify: a non-admin is refused 403 and nothing is sent or stamped', async () => {
  stub({ role: 'user', requesters: reqs, users: { u1: { email: 'a@x.com' } } });
  const res = await notify(post(P()));
  assert.equal(res.status, 403); assert.equal(mails().length, 0); assert.equal(stamps().length, 0);
  assert.ok(!calls.some((c) => c.url.includes('/rest/v1/cert_requests')));
});
await t('notify: exam_key must be normalised, 1 to 80', async () => {
  for (const bad of ['', 'CCNA', ' ccna', 'x'.repeat(81), 5, null, undefined]) {
    stub(); const res = await notify(post(P({ exam_key: bad }))); assert.equal(res.status, 400, JSON.stringify(bad)); assert.equal(mails().length, 0);
  }
  stub({ requesters: [] }); assert.equal((await notify(post(P({ exam_key: 'x'.repeat(80) })))).status, 200);
});
await t('notify: reads only un-notified rows for that exam, emails each person once and stamps them', async () => {
  stub({ requesters: reqs, users: { u1: { email: 'a@x.com' }, u2: { email: 'b@x.com' }, u3: { email: 'c@x.com' }, u4: { email: 'd@x.com' } } });
  const res = await notify(post(P()));
  assert.deepEqual(Object.assign({}, await res.json()), { sent: 4, failed: 0, skipped: 0, remaining: 0, next: U(4), paused: false });
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
  await notify(post(P()));
  for (const c of calls.filter((x) => x.url === 'https://api.resend.com/emails')) {
    const raw = c.init.body, own = JSON.parse(raw).to[0];
    for (const other of ['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com']) if (other !== own) assert.ok(!raw.includes(other));
  }
});
await t('notify: users with no auth record or no email are skipped and not stamped', async () => {
  stub({ requesters: reqs, users: { u1: { email: 'a@x.com' }, u2: 404, u3: { id: 'u3', email: '' }, u4: { id: 'u4' } } });
  const out = await (await notify(post(P()))).json();
  assert.deepEqual([out.sent, out.failed, out.skipped, out.remaining], [1, 0, 3, 0]);
  assert.equal(mails().length, 1); assert.equal(stamps().length, 1); assert.ok(stamps()[0].url.includes('id=eq.' + U(1)));
});
await t('notify: a failed send is counted and its row is not stamped; a lookup error is a failure', async () => {
  stub({ requesters: reqs, users: { u1: { email: 'a@x.com' }, u2: { email: 'bad@x.com' }, u3: 'boom', u4: { email: 'd@x.com' } }, failSend: ['bad@x.com'] });
  const out = await (await notify(post(P()))).json();
  assert.deepEqual([out.sent, out.failed, out.skipped], [2, 2, 0]);
  assert.deepEqual(stamps().map((s) => s.url.match(/id=eq\.([\w-]+)/)[1]).sort(), [U(1), U(4)]);
});
await t('notify: retry is idempotent, already-notified rows are not asked for and nobody is re-emailed', async () => {
  stub({ requesters: [], users: {} });
  const out = await (await notify(post(P()))).json();
  assert.deepEqual([out.sent, out.failed, out.skipped, out.remaining], [0, 0, 0, 0]); assert.equal(mails().length, 0);
});
await t('notify: the posted label must equal the tally label, else 409 and nothing is sent', async () => {
  stub({ requesters: reqs, users: { u1: { email: 'a@x.com' } }, label: 'CCNA' });
  const res = await notify(post(P({ label: 'Totally different' })));
  assert.equal(res.status, 409); assert.equal(mails().length, 0); assert.equal(stamps().length, 0);
  stub({ requesters: reqs, label: null }); assert.equal((await notify(post(P()))).status, 404);
  stub({ requesters: reqs }); assert.equal((await notify(post({ exam_key: 'ccna' }))).status, 400);
});
await t('notify: the label is cleaned (control chars, CR/LF, whitespace, 120 cap) and escaped in the HTML body', async () => {
  const evil = '<img src=x onerror=1>&Co\r\nBcc: evil@x.com\t' + 'z'.repeat(200);
  stub({ requesters: [reqs[0]], users: { u1: { email: 'a@x.com' } }, label: evil });
  await notify(post(P({ exam_key: 'k', label: evil })));
  const m = mails()[0];
  assert.ok(!/[\r\n]/.test(m.subject), 'no CR/LF in subject');
  assert.ok(Array.from(m.subject.replace(' is now on CertAnvil', '')).length <= 120);
  assert.ok(!m.html.includes('<img') && m.html.includes('&lt;img src=x onerror=1&gt;&amp;Co Bcc: evil@x.com'));
});
await t('notify: a batch is at most 20 people; remaining and the cursor let the caller continue; failures cannot loop forever', async () => {
  const many = Array.from({ length: 45 }, (_, i) => ({ id: '10000000-0000-0000-0000-' + String(i).padStart(12, '0'), user_id: 'm' + i }));
  const users = {}; many.forEach((r, i) => { users[r.user_id] = i === 3 ? 404 : { email: 'm' + i + '@x.com' }; });
  stub({ requesters: many, users });
  let out = await (await notify(post(P()))).json();
  assert.equal(out.sent + out.skipped + out.failed, 20); assert.equal(out.remaining, 25);
  const afterFirst = out.next; assert.equal(afterFirst, many[19].id);
  out = await (await notify(post(P({ after: out.next })))).json(); assert.equal(out.remaining, 5);
  out = await (await notify(post(P({ after: out.next })))).json(); assert.equal(out.remaining, 0); assert.equal(out.sent, 5);
  assert.equal((await notify(post(P({ after: 'nope' })))).status, 400);
});
await t('notify: user lookups run in parallel, before the first send', async () => {
  const order = []; stub({ requesters: reqs, users: { u1: { email: 'a@x.com' }, u2: { email: 'b@x.com' }, u3: { email: 'c@x.com' }, u4: { email: 'd@x.com' } } });
  const f = globalThis.fetch;
  globalThis.fetch = async (u, i) => { order.push(String(u).includes('/auth/v1/admin/users/') ? 'L' : String(u).includes('resend') ? 'S' : '-'); return f(u, i); };
  await notify(post(P())); const s = order.join('');
  assert.ok(s.indexOf('S') > s.lastIndexOf('L'), s);
});
await t('notify: a Resend 429 pauses the batch, is not a failure, and leaves the rest unstamped', async () => {
  stub({ requesters: reqs, users: { u1: { email: 'a@x.com' }, u2: { email: 'slow@x.com' }, u3: { email: 'c@x.com' }, u4: { email: 'd@x.com' } }, rate: ['slow@x.com'] });
  const out = await (await notify(post(P()))).json();
  assert.deepEqual([out.sent, out.failed, out.paused, out.remaining, out.next], [1, 0, true, 3, U(1)]);
  assert.deepEqual(stamps().map((s) => s.url.match(/id=eq\.([\w-]+)/)[1]), [U(1)]);
  assert.equal(mails().length, 2);
});
await t('notify: one audit row per call with the admin, the exam and the counts', async () => {
  stub({ requesters: reqs, users: { u1: { email: 'a@x.com' }, u2: 404, u3: { email: 'c@x.com' }, u4: { email: 'd@x.com' } } });
  await notify(post(P()));
  const a = calls.filter((c) => c.url.includes('/rest/v1/admin_audit_log')); assert.equal(a.length, 1);
  const row = JSON.parse(a[0].init.body);
  assert.equal(row.actor_id, 'admin-1'); assert.equal(row.target_id, 'ccna'); assert.equal(row.action, 'cert_live_notify'); assert.equal(row.new_data.sent, 3); assert.equal(row.new_data.skipped, 1);
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
    const res = await digest(dreq('cron-secret')); assert.equal(res.status, 503, drop); assert.ok(!(await res.text()).includes(drop)); assert.equal(calls.length, 0);
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

const bugs = [
  { title: 'Old one', status: 'open', created_at: '2026-10-01T00:00:00Z' },
  { title: 'Timer stuck', status: 'triaged', created_at: '2026-10-29T00:00:00Z' },
  { title: 'Fixed thing', status: 'resolved', created_at: '2026-10-30T00:00:00Z' },
  { title: 'Card flips twice', status: 'open', created_at: '2026-10-30T00:00:00Z' },
  { title: 'Wrong score', status: 'open', created_at: '2026-10-28T00:00:00Z' },
];
const errs = [
  { message: 'rare', version: '1', created_at: '2026-10-31T00:00:00Z' },
  { message: 'boom', version: '1', created_at: '2026-10-29T00:00:00Z' },
  { message: 'boom', version: '2', created_at: '2026-10-30T00:00:00Z' },
  { message: 'tie-old', version: '1', created_at: '2026-10-25T00:00:00Z' },
  { message: 'tie-old', version: '1', created_at: '2026-10-25T00:00:00Z' },
  { message: 'boom', version: '2', created_at: '2026-10-28T00:00:00Z' },
];
await t('digest lists open reports and top errors', async () => {
  stub({ tally, bugs, errs });
  assert.equal((await digest(dreq('cron-secret'))).status, 200);
  const m = mails()[0];
  assert.ok(m.text.includes('Open bug reports: 4') && m.text.includes('Card flips twice') && m.text.includes('Timer stuck') && m.text.includes('Wrong score') && !m.text.includes('Old one'));
  assert.ok(m.text.includes('Top errors this week'));
  assert.ok(m.text.indexOf('3× boom') < m.text.indexOf('2× tie-old') && m.text.indexOf('2× tie-old') < m.text.indexOf('1× rare'));
  assert.ok(m.html.includes('Open bug reports: 4') && m.html.includes('3× boom'));
  assert.ok(!/—/.test(m.html + m.text));
});
await t('a 0-new week still includes them', async () => {
  stub({ tally: [], bugs, errs });
  assert.equal((await digest(dreq('cron-secret'))).status, 200);
  const m = mails()[0]; assert.equal(m.subject, 'Cert requests this week: 0 new');
  assert.ok(m.text.includes('No new requests this week.') && m.text.includes('Open bug reports: 4') && m.text.includes('3× boom'));
  assert.ok(m.html.includes('Open bug reports: 4') && m.html.includes('3× boom'));
});
await t('a title with <script> is escaped', async () => {
  stub({ tally, bugs: [{ title: '<script>alert(1)</script>', status: 'open', created_at: 'z' }], errs: [{ message: '<img src=x onerror=1>', version: '1', created_at: 'z' }] });
  await digest(dreq('cron-secret'));
  const m = mails()[0];
  assert.ok(!m.html.includes('<script>') && m.html.includes('&lt;script&gt;') && !m.html.includes('<img') && m.html.includes('&lt;img'));
});
await t('a failing extra read still sends the cert-request part', async () => {
  for (const o of [{ bugsFail: true }, { errsFail: true }, { bugsFail: true, errsFail: true }]) {
    stub(Object.assign({ tally, bugs, errs }, o));
    const res = await digest(dreq('cron-secret')); assert.equal(res.status, 200);
    const m = mails()[0]; assert.equal(m.subject, 'Cert requests this week: 13 new'); assert.ok(m.html.includes('<b>CCNA</b>'));
  }
  stub({ tally, bugs, errs }); const f = globalThis.fetch;
  globalThis.fetch = async (u, i) => { if (String(u).includes('user_bug_reports')) throw new Error('net'); return f(u, i); };
  assert.equal((await digest(dreq('cron-secret'))).status, 200);
});

console.log('notify-cert-live + digest: ' + n + '/' + n + ' passed');
