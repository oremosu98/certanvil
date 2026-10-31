// Async half of UAT 528 (not auto-loaded: the runner only picks up NNN-*.js). Run as a child process by 528-suggest-cert.js,
// prints a JSON array of [name, passed] so the synchronous UAT can report them.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'lib', 'cert-requests.js'), 'utf8');
const results = [];
const test = (n, ok) => results.push([n, !!ok]);
const clock = { t: 1.8e12 };

function load(sb) {
  const store = {}, listeners = {};
  const win = { certanvilSupabase: sb || null, addEventListener: (n, f) => { (listeners[n] = listeners[n] || []).push(f); } };
  const ctx = vm.createContext({ window: win, Date: { now: () => clock.t },
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    Promise, JSON, Math, Object, Array, String, Number, RegExp });
  vm.runInContext(src, ctx);
  return { win, store, fire: (n) => (listeners[n] || []).forEach((f) => f()) };
}
// handler(callNumber, rows) -> {error, status}|Promise|throws
function fakeSb(handler, uid) {
  const calls = [];
  const sb = { auth: { getSession: () => Promise.resolve({ data: { session: uid === null ? null : { user: { id: uid || 'u1' } } } }) } };
  sb.from = () => ({ upsert: (rows, opts) => { calls.push({ rows, opts }); return Promise.resolve().then(() => handler(calls.length, rows)); } });
  return { sb, calls };
}
const OK = { error: null }, tick = () => new Promise((r) => setTimeout(r, 5));
const q = (L) => JSON.parse(L.store.nplus_cert_req_pending || '[]');

(async () => {
  // ── send ──
  const f = fakeSb(() => OK);
  const A = load(f.sb);
  const r = await A.win.sendCertRequests(['CCNA', '  Cisco CCNA ', 'ITIL 4']);
  const c = f.calls[0];
  test('send: one upsert into cert_requests with onConflict user_id,exam_key and ignoreDuplicates',
    f.calls.length === 1 && c.opts.onConflict === 'user_id,exam_key' && c.opts.ignoreDuplicates === true);
  test('send: rows carry exactly user_id, exam_key, label, typed; duplicates by key collapse; keys lowercase/trimmed',
    c.rows.length === 2 && c.rows.every((x) => Object.keys(x).sort().join() === 'exam_key,label,typed,user_id' && x.exam_key === x.exam_key.toLowerCase().trim() && x.user_id === 'u1')
    && c.rows[0].exam_key === 'ccna' && c.rows[0].typed === false && c.rows[1].exam_key === 'itil 4' && c.rows[1].typed === true);
  test('send: success accepts everything and leaves nothing queued', r.ok && r.accepted.length === 2 && !r.queued && !('nplus_cert_req_pending' in A.store));

  const dr = await load(fakeSb(() => ({ error: { code: '23505' } })).sb).win.sendCertRequests(['CCNA']);
  test('duplicate: only code 23505 counts as ok', dr.ok && dr.accepted.length === 1);
  const d409 = load(fakeSb(() => ({ error: { message: 'conflict' }, status: 409 })).sb);
  const r409 = await d409.win.sendCertRequests(['CCNA']);
  test('a bare 409 is NOT success: nothing accepted, nothing queued', !r409.ok && r409.accepted.length === 0 && !('nplus_cert_req_pending' in d409.store));

  // retryable: table missing, 5xx, 401, network (thrown) -> accepted + queued, never lost
  for (const [name, h] of [['missing table', () => ({ error: { code: '42P01', message: 'relation "cert_requests" does not exist' }, status: 404 })],
    ['500', () => ({ error: { message: 'boom' }, status: 503 })], ['401', () => ({ error: { message: 'JWT expired' }, status: 401 })],
    ['network', () => { throw new Error('offline'); }]]) {
    const L = load(fakeSb(h).sb);
    const x = await L.win.sendCertRequests(['CCNA', 'ITIL 4']);
    test('retryable (' + name + '): both queued for this user, thanks is safe, not ok', !x.ok && x.queued && x.accepted.length === 2 && q(L).length === 2 && q(L)[0].u === 'u1');
  }
  // permanent: 400, 403, CHECK, FK -> not queued, not accepted
  for (const [name, h] of [['400', () => ({ error: { code: '22001', message: 'bad' }, status: 400 })], ['403', () => ({ error: { code: '42501' }, status: 403 })],
    ['CHECK 23514', () => ({ error: { code: '23514' }, status: 400 })], ['FK 23503', () => ({ error: { code: '23503' }, status: 409 })]]) {
    const L = load(fakeSb(h).sb);
    const x = await L.win.sendCertRequests(['CCNA']);
    test('permanent (' + name + '): not queued, not accepted, reported dropped', !x.ok && !x.queued && x.accepted.length === 0 && x.dropped.length === 1 && !('nplus_cert_req_pending' in L.store));
  }
  // one bad label must not sink the others
  const SP = fakeSb((n, rows) => (rows.length > 1 || rows[0].label === 'BAD' ? { error: { code: '23514' }, status: 400 } : OK));
  const sp = await load(SP.sb).win.sendCertRequests(['CCNA', 'BAD', 'CISSP']);
  test('one refused label does not block the rest (batch splits)', JSON.stringify(sp.accepted) === JSON.stringify(['CCNA', 'CISSP']) && JSON.stringify(sp.dropped) === JSON.stringify(['BAD']) && SP.calls.length === 4);

  // no session: the outcome, not just !ok
  const NS = load(fakeSb(() => { throw new Error('should not be called'); }, null).sb);
  const nr = await NS.win.sendCertRequests(['CCNA']);
  test('no session: nothing sent, nothing accepted (so no Thanks), flagged noUser, nothing queued without an owner',
    !nr.ok && nr.noUser === true && nr.accepted.length === 0 && nr.failed.length === 1 && !('nplus_cert_req_pending' in NS.store));
  const NA = load(null);
  test('undefined auth is not signed in', (await NA.win.certReqUid()) === null);

  // ── retry ──
  let mode = 'fail', mid = null;
  const R = fakeSb(() => { mid = R.snapshot(); return mode === 'fail' ? { error: { code: '42P01' }, status: 404 } : mode === 'bad' ? { error: { code: '23514' }, status: 400 } : OK; });
  const RL = load(R.sb); R.snapshot = () => RL.store.nplus_cert_req_pending;
  await RL.win.sendCertRequests(['CCNA']);
  R.calls.length = 0;
  RL.fire('ca:home-shown'); await tick();
  test('retry: still failing keeps the queue, one call', q(RL).length === 1 && R.calls.length === 1);
  RL.fire('ca:home-shown'); await tick();
  test('retry backoff: a second ca:home-shown inside 10 minutes makes no call', R.calls.length === 1);
  clock.t += 11 * 60 * 1000; mode = 'ok';
  RL.fire('ca:home-shown'); await tick();
  test('retry: after the wait it sends and empties the queue', R.calls.length === 2 && R.calls[1].rows[0].exam_key === 'ccna' && !('nplus_cert_req_pending' in RL.store));
  test('retry: the entry was still queued while the send was in flight (deleted only after success)', JSON.parse(mid || '[]').length === 1);

  // refused entry is dropped and does not block the others
  const R2 = fakeSb((n, rows) => (rows[0].label === 'BAD' ? { error: { code: '23514' }, status: 400 } : OK));
  const R2L = load(R2.sb);
  R2L.store.nplus_cert_req_pending = JSON.stringify([{ u: 'u1', label: 'BAD' }, { u: 'u1', label: 'CCNA' }, { u: 'other', label: 'CISSP' }]);
  clock.t += 11 * 60 * 1000;
  R2L.fire('ca:home-shown'); await tick(); await tick();
  test('retry: a refused label is dropped, the next one still sends, another user\'s entry is untouched',
    R2.calls.length === 2 && q(R2L).length === 1 && q(R2L)[0].u === 'other');
  console.log(JSON.stringify(results));
})().catch((e) => { console.log(JSON.stringify([['async block threw: ' + e.message, false]])); });
