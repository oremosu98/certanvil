// Task 4: landing/api/admin/bug-report.js (Edge, ESM). fetch is stubbed throughout: no Supabase or Resend is ever called.
// Run: node --experimental-detect-module tests/api/bug-report.test.mjs
import assert from 'node:assert/strict';

const ENV = { SUPABASE_URL: 'https://proj.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service', RESEND_API_KEY: 'rk' };
const setEnv = (o) => { for (const k of Object.keys(ENV)) delete process.env[k]; Object.assign(process.env, o); };
setEnv(ENV);
const mod = await import('../../landing/api/admin/bug-report.js');
const handler = mod.default;
mod._tuning.gapMs = 0;

let n = 0;
const t = async (name, fn) => { try { await fn(); n++; } catch (e) { console.error('FAIL: ' + name); throw e; } };
let calls = [], db = [];
let opts = {};
function stub({ userOk = true, failClose = false, failRelease = false, noRange = false, lookupBoom = [], role = 'admin', reports = [], emails = {}, failSend = false, rate = [] } = {}) {
  calls = []; db = reports.map((r) => Object.assign({ status: 'open', user_id: null, fixed_notified_at: null, title: 'T' + r.id }, r));
  globalThis.fetch = async (url, init = {}) => {
    url = String(url); calls.push({ url, init });
    const method = init.method || 'GET';
    if (url.endsWith('/auth/v1/user')) return userOk ? new Response(JSON.stringify({ id: 'admin-1' }), { status: 200 }) : new Response('{}', { status: 401 });
    if (url.includes('/rest/v1/profiles')) return new Response(JSON.stringify([{ role }]), { status: 200 });
    if (url.includes('/rest/v1/admin_audit_log')) return new Response('', { status: 201 });
    if (url.includes('/rest/v1/user_bug_reports') && method === 'GET') {
      const ids = (url.match(/id=in\.\(([\d,]+)\)/) || [])[1].split(',').map(Number);
      const aft = Number((url.match(/id=gt\.(\d+)/) || [])[1] || 0), lim = Number((url.match(/limit=(\d+)/) || [])[1]);
      const pool = db.filter((r) => ids.includes(r.id) && r.id > aft).sort((a, b) => a.id - b.id);
      return new Response(JSON.stringify(pool.slice(0, lim)), { status: 206, headers: noRange ? {} : { 'content-range': '0-0/' + pool.length } });
    }
    if (url.includes('/rest/v1/user_bug_reports') && method === 'PATCH') {
      const data = JSON.parse(init.body);
      if (failClose && data.status === 'closed' && url.includes('id=eq.')) return new Response('{}', { status: 500 });
      if (failRelease && data.fixed_notified_at === null) return new Response('{}', { status: 500 });
      const inIds = (url.match(/id=in\.\(([\d,]+)\)/) || [])[1], eqId = (url.match(/id=eq\.(\d+)/) || [])[1];
      let hit = db.filter((r) => inIds ? inIds.split(',').map(Number).includes(r.id) : r.id === Number(eqId));
      if (url.includes('status=in.(open,triaged)')) hit = hit.filter((r) => r.status === 'open' || r.status === 'triaged');
      if (url.includes('fixed_notified_at=is.null')) hit = hit.filter((r) => r.fixed_notified_at == null);
      hit.forEach((r) => Object.assign(r, data));
      return new Response(JSON.stringify(hit), { status: 200 });
    }
    if (url.includes('/auth/v1/admin/users/')) {
      const id = decodeURIComponent(url.split('/auth/v1/admin/users/')[1]);
      if (lookupBoom.includes(id)) return new Response('{}', { status: 500 });
      return emails[id] ? new Response(JSON.stringify({ id, email: emails[id] }), { status: 200 }) : new Response('{}', { status: 404 });
    }
    if (url === 'https://api.resend.com/emails') {
      const b = JSON.parse(init.body);
      if (b.to.some((e) => rate.includes(e))) return new Response('{}', { status: 429 });
      return failSend ? new Response(JSON.stringify({ statusCode: 403, name: 'validation_error', message: 'You can only send to a@x.com until certanvil.com is verified.' }), { status: 403 }) : new Response('{"id":"m"}', { status: 200 });
    }
    throw new Error('unexpected fetch ' + url);
  };
}
const post = (body) => new Request('https://certanvil.com/api/admin/bug-report', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt' }, body: JSON.stringify(body) });
const mails = () => calls.filter((c) => c.url === 'https://api.resend.com/emails');
const audit = () => calls.filter((c) => c.url.includes('admin_audit_log')).map((c) => JSON.parse(c.init.body));

await t('non-admin gets 403', async () => {
  stub({ role: 'user', reports: [{ id: 1 }] });
  assert.equal((await handler(post({ action: 'close', ids: [1] }))).status, 403);
  assert.equal(db[0].status, 'open');
});
await t('bad body is 400, missing env is 503', async () => {
  stub();
  assert.equal((await handler(post({ action: 'nope', ids: [1] }))).status, 400);
  assert.equal((await handler(post({ action: 'close', ids: [] }))).status, 400);
  assert.equal((await handler(post({ action: 'close', ids: ['x'] }))).status, 400);
  assert.equal((await handler(post({ action: 'close', ids: Array.from({ length: 201 }, (_, i) => i + 1) }))).status, 400);
  const e = Object.assign({}, ENV); delete e.RESEND_API_KEY; setEnv(e); stub();
  assert.equal((await handler(post({ action: 'fixed', ids: [1] }))).status, 503);
  stub({ reports: [{ id: 1 }] }); assert.equal((await handler(post({ action: 'close', ids: [1] }))).status, 200);
  setEnv(ENV);
});
await t('close closes open and triaged, skips closed', async () => {
  stub({ reports: [{ id: 1 }, { id: 2, status: 'triaged' }, { id: 3, status: 'closed' }] });
  const j = await (await handler(post({ action: 'close', ids: [3, 2, 1] }))).json();
  assert.deepEqual([j.closed, j.skipped, j.sent, j.remaining, j.paused], [2, 1, 0, 0, false]);
  assert.deepEqual(db.map((r) => r.status), ['closed', 'closed', 'closed']);
  assert.equal(mails().length, 0);
  const a = audit(); assert.equal(a.length, 1); assert.equal(a[0].action, 'bug_report_close'); assert.equal(a[0].target_op, 'UPDATE'); assert.deepEqual(a[0].new_data, { ids: [1, 2, 3], closed: 2, sent: 0 });
});
await t('fixed emails each signed-in reporter once and closes; anonymous is skipped', async () => {
  stub({ reports: [{ id: 1, user_id: 'u1', title: 'Quiz freezes' }, { id: 2 }, { id: 3, user_id: 'u3', status: 'triaged' }], emails: { u1: 'a@x.com', u3: 'c@x.com' } });
  const j = await (await handler(post({ action: 'fixed', ids: [1, 2, 3] }))).json();
  assert.deepEqual([j.sent, j.closed, j.skipped, j.failed], [2, 2, 1, 0]);
  const ms = mails(); assert.equal(ms.length, 2);
  const b = JSON.parse(ms[0].init.body); assert.deepEqual(b.to, ['a@x.com']); assert.equal(b.subject, 'Fixed: Quiz freezes');
  assert.equal(ms[0].init.headers['Idempotency-Key'], 'bug-fixed:1');
  assert.deepEqual(db.map((r) => r.status), ['closed', 'open', 'closed']);
  assert.ok(db[0].fixed_notified_at && db[2].fixed_notified_at && !db[1].fixed_notified_at);
  assert.equal(audit()[0].action, 'bug_report_fixed');
});
await t('a second call for the same ids sends nothing', async () => {
  stub({ reports: [{ id: 1, user_id: 'u1' }], emails: { u1: 'a@x.com' } });
  await handler(post({ action: 'fixed', ids: [1] }));
  const before = mails().length;
  const j = await (await handler(post({ action: 'fixed', ids: [1] }))).json();
  assert.equal(mails().length, before); assert.equal(j.sent, 0); assert.equal(j.skipped, 1);
  // stamp guard alone: reopened but still stamped
  db[0].status = 'open';
  const j2 = await (await handler(post({ action: 'fixed', ids: [1] }))).json();
  assert.equal(mails().length, before); assert.equal(j2.sent, 0);
});
await t('a failed send clears the stamp and reports failed', async () => {
  stub({ reports: [{ id: 1, user_id: 'u1' }], emails: { u1: 'a@x.com' }, failSend: true });
  const j = await (await handler(post({ action: 'fixed', ids: [1] }))).json();
  assert.deepEqual([j.sent, j.failed, j.closed], [0, 1, 0]);
  assert.equal(db[0].fixed_notified_at, null); assert.equal(db[0].status, 'open');
});
await t('25 ids give 20 handled, remaining 5, next is the 20th id', async () => {
  const ids = Array.from({ length: 25 }, (_, i) => i + 1);
  stub({ reports: ids.map((id) => ({ id })) });
  const j = await (await handler(post({ action: 'close', ids }))).json();
  assert.deepEqual([j.closed, j.remaining, j.next], [20, 5, 20]);
  const j2 = await (await handler(post({ action: 'close', ids, after: j.next }))).json();
  assert.deepEqual([j2.closed, j2.remaining, j2.next], [5, 0, 25]);
});
await t('a 429 pauses without stamping the rest', async () => {
  stub({ reports: [{ id: 1, user_id: 'u1' }, { id: 2, user_id: 'u2' }, { id: 3, user_id: 'u3' }], emails: { u1: 'a@x.com', u2: 'b@x.com', u3: 'c@x.com' }, rate: ['b@x.com'] });
  const j = await (await handler(post({ action: 'fixed', ids: [1, 2, 3] }))).json();
  assert.equal(j.paused, true); assert.equal(j.sent, 1); assert.equal(j.remaining, 2); assert.equal(j.next, 1);
  assert.deepEqual(db.map((r) => r.fixed_notified_at != null), [true, false, false]);
});
await t('a 429 whose un-stamp fails counts failed and steps past that report', async () => {
  stub({ reports: [{ id: 1, user_id: 'u1' }, { id: 2, user_id: 'u2' }], emails: { u1: 'a@x.com', u2: 'b@x.com' }, rate: ['a@x.com'], failRelease: true });
  const err = console.error; const logged = []; console.error = (m) => logged.push(m);
  const j = await (await handler(post({ action: 'fixed', ids: [1, 2] }))).json();
  console.error = err;
  assert.deepEqual([j.paused, j.sent, j.failed, j.next, j.remaining], [true, 0, 1, 1, 1]);
  assert.ok(logged.some((m) => /report 1/.test(m)));
});
await t('a failed send whose un-stamp fails counts failed once and is logged', async () => {
  stub({ reports: [{ id: 1, user_id: 'u1' }], emails: { u1: 'a@x.com' }, failSend: true, failRelease: true });
  const err = console.error; const logged = []; console.error = (m) => logged.push(m);
  const j = await (await handler(post({ action: 'fixed', ids: [1] }))).json();
  console.error = err;
  assert.deepEqual([j.sent, j.failed, j.closed], [0, 1, 0]);
  assert.ok(logged.some((m) => /report 1/.test(m)));
});
await t('a rejected send logs Resend\'s status and reason, with addresses masked', async () => {
  stub({ reports: [{ id: 1, user_id: 'u1' }], emails: { u1: 'a@x.com' }, failSend: true });
  const err = console.error; const logged = []; console.error = (m) => logged.push(String(m));
  await handler(post({ action: 'fixed', ids: [1] }));
  console.error = err;
  const line = logged.find((m) => /resend/i.test(m)) || '';
  assert.ok(/403/.test(line) && /validation_error/.test(line) && /verified/.test(line), line);
  assert.ok(!line.includes('a@x.com'), line);
});
await t('a reporter lookup failure logs the report and the status', async () => {
  stub({ reports: [{ id: 7, user_id: 'u7' }], lookupBoom: ['u7'] });
  const err = console.error; const logged = []; console.error = (m) => logged.push(String(m));
  const j = await (await handler(post({ action: 'fixed', ids: [7] }))).json();
  console.error = err;
  assert.equal(j.failed, 1);
  assert.ok(logged.some((m) => /report 7/.test(m) && /500/.test(m)), logged.join(' | '));
});
await t('buildFixedEmail escapes the title and cuts to 50 plus an ellipsis', async () => {
  const e = mod.buildFixedEmail('<b>"x"</b>');
  assert.ok(e.html.includes('&lt;b&gt;&quot;x&quot;&lt;/b&gt;') && !e.html.includes('<b>'));
  const long = mod.buildFixedEmail('a'.repeat(70));
  assert.equal(long.subject, 'Fixed: ' + 'a'.repeat(50) + '…');
  const all = JSON.stringify(e) + JSON.stringify(long);
  assert.ok(!all.includes('—') && !/founder|simi/i.test(all));
  assert.ok(e.text.includes("It's fixed. Open CertAnvil and you'll have it. Thanks for telling us.") && e.text.trim().endsWith('CertAnvil'));
});

await t('two concurrent fixed calls send exactly one mail (atomic claim)', async () => {
  stub({ reports: [{ id: 1, user_id: 'u1' }], emails: { u1: 'a@x.com' } });
  const [a, b] = await Promise.all([handler(post({ action: 'fixed', ids: [1] })), handler(post({ action: 'fixed', ids: [1] }))]);
  const ja = await a.json(), jb = await b.json();
  assert.equal(mails().length, 1); assert.equal(ja.sent + jb.sent, 1); assert.equal(ja.skipped + jb.skipped, 1);
});
await t('a failed final close still counts sent, is not closed, counts failed', async () => {
  stub({ reports: [{ id: 1, user_id: 'u1' }], emails: { u1: 'a@x.com' }, failClose: true });
  const j = await (await handler(post({ action: 'fixed', ids: [1] }))).json();
  assert.deepEqual([j.sent, j.closed, j.failed], [1, 0, 1]);
});
await t('a failed un-stamp counts failed', async () => {
  stub({ reports: [{ id: 1, user_id: 'u1' }], emails: { u1: 'a@x.com' }, failSend: true, failRelease: true });
  const j = await (await handler(post({ action: 'fixed', ids: [1] }))).json();
  assert.deepEqual([j.sent, j.failed], [0, 1]);
  stub({ reports: [{ id: 1, user_id: 'u9' }], emails: {}, failRelease: true });
  const k = await (await handler(post({ action: 'fixed', ids: [1] }))).json();
  assert.deepEqual([k.skipped, k.failed], [0, 1]);
});
await t('a row closed after the read is not claimed or emailed', async () => {
  stub({ reports: [{ id: 1, user_id: 'u1' }], emails: { u1: 'a@x.com' } });
  const f = globalThis.fetch; let first = true;
  globalThis.fetch = async (u, i) => { const r = await f(u, i); if (first && String(u).includes('user_bug_reports') && !(i && i.method)) { first = false; db[0].status = 'closed'; } return r; };
  const j = await (await handler(post({ action: 'fixed', ids: [1] }))).json();
  assert.equal(mails().length, 0); assert.equal(j.skipped, 1);
});
await t('missing content-range is 502', async () => {
  stub({ reports: [{ id: 1 }], noRange: true });
  assert.equal((await handler(post({ action: 'close', ids: [1] }))).status, 502);
});
await t('a bad token is 401', async () => {
  stub({ userOk: false, reports: [{ id: 1 }] });
  assert.equal((await handler(post({ action: 'close', ids: [1] }))).status, 401);
});
await t('email lookup 404 is skipped and released; lookup failure is failed and released', async () => {
  stub({ reports: [{ id: 1, user_id: 'gone' }, { id: 2, user_id: 'boom' }], emails: {}, lookupBoom: ['boom'] });
  const j = await (await handler(post({ action: 'fixed', ids: [1, 2] }))).json();
  assert.deepEqual([j.skipped, j.failed, j.sent], [1, 1, 0]);
  assert.deepEqual(db.map((r) => r.fixed_notified_at), [null, null]);
});
await t('fixed paginates with after across batches', async () => {
  const ids = Array.from({ length: 25 }, (_, i) => i + 1);
  stub({ reports: ids.map((id) => ({ id, user_id: 'u' + id })), emails: Object.fromEntries(ids.map((id) => ['u' + id, id + '@x.com'])) });
  const j = await (await handler(post({ action: 'fixed', ids }))).json();
  assert.deepEqual([j.sent, j.remaining, j.next], [20, 5, 20]);
  const k = await (await handler(post({ action: 'fixed', ids, after: j.next }))).json();
  assert.deepEqual([k.sent, k.remaining, k.next], [5, 0, 25]); assert.equal(mails().length, 25);
});
await t('the time budget cuts a batch short', async () => {
  stub({ reports: [{ id: 1, user_id: 'u1' }, { id: 2, user_id: 'u2' }, { id: 3, user_id: 'u3' }], emails: { u1: 'a@x.com', u2: 'b@x.com', u3: 'c@x.com' } });
  mod._tuning.budgetMs = -1;
  const j = await (await handler(post({ action: 'fixed', ids: [1, 2, 3] }))).json();
  mod._tuning.budgetMs = 15000;
  assert.deepEqual([j.sent, j.remaining, j.next], [1, 2, 1]);
});

console.log('bug-report: ' + n + '/' + n + ' passed');
