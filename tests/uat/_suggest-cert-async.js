// Async half of UAT 528 (not auto-loaded: the runner only picks up NNN-*.js). Run as a child process by 528-suggest-cert.js,
// prints a JSON array of [name, passed] so the synchronous UAT can report them.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'lib', 'cert-requests.js'), 'utf8');
const results = [];
const test = (n, ok) => results.push([n, !!ok]);
  function load(sb, uid) {
    const store = {}, listeners = {};
    const win = {
      certanvilSupabase: sb || null,
      addEventListener: (n, f) => { (listeners[n] = listeners[n] || []).push(f); },
    };
    const ctx = vm.createContext({ window: win, localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
      Promise, JSON, Math, Date, Object, Array, String, Number, RegExp });
    vm.runInContext(src, ctx);
    return { win, store, fire: (n) => (listeners[n] || []).forEach((f) => f()) };
  }
  const session = (id) => ({ auth: { getSession: () => Promise.resolve({ data: { session: id ? { user: { id } } : null } }) } });
  function fakeSb(handler) {
    const calls = [];
    const sb = session('u1');
    sb.from = (t) => ({ upsert: (rows, opts) => { calls.push({ t, rows, opts }); return Promise.resolve(handler(calls.length, rows)); } });
    return { sb, calls };
  }
  const tick = () => new Promise((r) => setTimeout(r, 5));

(async () => {
    const f = fakeSb(() => ({ error: null }));
    const A = load(f.sb);
    const r = await A.win.sendCertRequests(['CCNA', '  Cisco CCNA ', 'ITIL 4']);
    const c = f.calls[0];
    test('send: one upsert into cert_requests with onConflict user_id,exam_key and ignoreDuplicates',
      f.calls.length === 1 && c.t === 'cert_requests' && c.opts.onConflict === 'user_id,exam_key' && c.opts.ignoreDuplicates === true);
    test('send: rows carry exactly user_id, exam_key, label, typed; duplicates by key collapse; keys lowercase/trimmed',
      c.rows.length === 2 && c.rows.every((x) => Object.keys(x).sort().join() === 'exam_key,label,typed,user_id' && x.exam_key === x.exam_key.toLowerCase().trim() && x.user_id === 'u1')
      && c.rows[0].exam_key === 'ccna' && c.rows[0].typed === false && c.rows[1].exam_key === 'itil 4' && c.rows[1].typed === true);
    test('send: success leaves nothing queued', r.ok === true && r.failed.length === 0 && !('nplus_cert_req_pending' in A.store));

    const D = fakeSb(() => ({ error: { code: '23505' } }));
    const dr = await load(D.sb).win.sendCertRequests(['CCNA']);
    const D2 = fakeSb(() => ({ error: { status: 409 } }));
    const dr2 = await load(D2.sb).win.sendCertRequests(['CCNA']);
    test('duplicate (23505 or 409) counts as ok', dr.ok && dr2.ok && dr.failed.length === 0);

    // missing table / offline: queued, not lost, no throw
    const M = fakeSb(() => ({ error: { code: '42P01', message: 'relation "cert_requests" does not exist', status: 404 } }));
    const B = load(M.sb);
    const mr = await B.win.sendCertRequests(['CCNA', 'ITIL 4']);
    const q = JSON.parse(B.store.nplus_cert_req_pending || '[]');
    test('missing table: not ok, both queued under nplus_cert_req_pending for this user', !mr.ok && mr.failed.length === 2 && q.length === 2 && q[0].u === 'u1' && q[1].label === 'ITIL 4');
    const T = fakeSb(() => { throw new Error('network'); });
    const TT = load({ auth: T.sb.auth, from: () => ({ upsert: () => Promise.reject(new Error('offline')) }) });
    const tr = await TT.win.sendCertRequests(['CySA+']);
    test('network failure: queued, no throw', !tr.ok && JSON.parse(TT.store.nplus_cert_req_pending).length === 1);
    const NS = load({ auth: { getSession: () => Promise.resolve({ data: { session: null } }) }, from: () => { throw new Error('should not be called'); } });
    const nr = await NS.win.sendCertRequests(['CCNA']);
    test('no session: nothing sent, nothing thrown', !nr.ok && nr.failed.length === 1);

    // retry on ca:home-shown
    let fail = true;
    const R = fakeSb(() => (fail ? { error: { code: '42P01' } } : { error: null }));
    const RL = load(R.sb);
    await RL.win.sendCertRequests(['CCNA']);
    RL.fire('ca:home-shown'); await tick();
    test('retry: still failing keeps the queue (no duplicates)', JSON.parse(RL.store.nplus_cert_req_pending).length === 1 && R.calls.length === 2);
    fail = false; RL.fire('ca:home-shown'); await tick();
    test('retry: next ca:home-shown sends the queued request and empties the queue', R.calls.length === 3 && R.calls[2].rows[0].exam_key === 'ccna' && !('nplus_cert_req_pending' in RL.store));
    RL.store.nplus_cert_req_pending = JSON.stringify([{ u: 'someone-else', label: 'CISSP' }]);
    RL.fire('ca:home-shown'); await tick();
    test("retry: another person's queued entries are left alone", R.calls.length === 3 && JSON.parse(RL.store.nplus_cert_req_pending).length === 1);

  console.log(JSON.stringify(results));
})().catch((e) => { console.log(JSON.stringify([['async block threw: ' + e.message, false]])); });
