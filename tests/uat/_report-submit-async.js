// Async half of UAT 533 (not auto-loaded). Runs the real features/reports.js in a vm with a stubbed Supabase
// client and prints a JSON array of [name, passed].
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'features', 'reports.js'), 'utf8');
const results = [];
const test = (n, ok) => results.push([n, !!ok]);

function load(opts) {
  const store = {};
  const calls = [];
  const sb = {
    auth: { getUser: async () => ({ data: { user: opts.currentUser ? { id: opts.currentUser } : null } }) },
    rpc: async (name, args) => {
      calls.push([name, args]);
      if (opts.throwNetwork) throw new Error('offline');
      return opts.rpcResult || { data: 42, error: null };
    },
  };
  const win = { certanvilSupabase: opts.noClient ? null : sb, innerWidth: 400, innerHeight: 800 };
  const ctx = vm.createContext({
    window: win, STORAGE: { BUG_REPORTS: 'bugq' }, console, Date, Math, JSON, Promise, Number, isFinite, String,
    document: { documentElement: { getAttribute: () => 'dark' }, querySelectorAll: () => [], getElementById: () => null },
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } },
  });
  vm.runInContext(src, ctx);
  return { mod: win._certanvilFeatures.reports, calls, store };
}

(async () => {
  const L = load({});
  const long = 'x'.repeat(120);
  const p1 = L.mod.buildPayload({ title: '', desc: '  ' + long + '\nsecond line' }, { user_id: 'A' });
  test('title falls back to the first line of the description (80 max)', p1.title === 'x'.repeat(80));
  const p2 = L.mod.buildPayload({ title: '  Mine  ', desc: 'd' }, {});
  test('an explicit title is kept and trimmed', p2.title === 'Mine');
  test("payload carries the writer's id", p1.user_id === 'A' && p2.user_id === null);

  const S = load({ currentUser: 'B' });
  const pay = S.mod.buildPayload({ title: 't', desc: 'd' }, { user_id: 'A' });
  const r = await S.mod.submitReport(pay);
  test('submit calls the RPC with p_user_id from the payload, not from the current session',
    S.calls.length === 1 && S.calls[0][0] === 'submit_bug_report' && S.calls[0][1].p_user_id === 'A' && S.calls[0][1].p_report_id === pay.id);
  test('success returns reportNo from the RPC', r.type === 'success' && r.reportNo === 42);

  const old = S.mod.buildPayload({ title: 't', desc: 'd' }, {});
  delete old.user_id;
  await S.mod.submitReport(old);
  test('a queued payload with no writer sends p_user_id null even when someone else is signed in', S.calls[1][1].p_user_id === null);

  const N = load({ throwNetwork: true, currentUser: 'A' });
  const r2 = await N.mod.submitReportNow({ title: 't', desc: 'd', steps: null });
  const q = JSON.parse(N.store.bugq || '[]');
  test('an RPC network error enqueues with the payload\'s user_id intact', r2.queued === true && q.length === 1 && q[0].payload.user_id === 'A');

  const O = load({ noClient: true });
  const r3 = await O.mod.submitReportNow({ title: 't', desc: 'd' });
  test('submitReportNow offline gives ok:false, queued:true, reportNo:null', r3.ok === false && r3.queued === true && r3.reportNo === null);

  const G = load({ currentUser: 'A' });
  const r4 = await G.mod.submitReportNow({ title: 't', desc: 'd' });
  test('submitReportNow online gives ok:true, queued:false and the number', r4.ok === true && r4.queued === false && r4.reportNo === 42 && G.calls[0][1].p_user_id === 'A');

  const E = load({ rpcResult: { data: null, error: { message: 'x' } } });
  const r5 = await E.mod.submitReport(E.mod.buildPayload({ title: 't', desc: 'd' }, {}));
  test('an RPC error is a retryable failure with no number', r5.type === 'server' && r5.reportNo == null);
  const F = load({ rpcResult: { data: null, error: { message: 'denied' }, status: 400 } });
  const r6 = await F.mod.submitReportNow({ title: 't', desc: 'd' });
  test('a server rejection while online is not queued and not ok', r6.ok === false && r6.queued === false && JSON.parse(F.store.bugq || '[]').length === 0);
  const Z = load({ rpcResult: { data: null, error: { message: 'TypeError: Failed to fetch' }, status: 0 } });
  const r7 = await Z.mod.submitReportNow({ title: 't', desc: 'd' });
  test('a failed fetch (status 0) counts as offline and is queued', r7.result.type === 'offline' && r7.queued === true && JSON.parse(Z.store.bugq || '[]').length === 1);
  console.log(JSON.stringify(results));
})();
