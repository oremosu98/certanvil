// Async half of UAT 535 (not auto-loaded). Runs the real features/admin-data.js in a vm with a stubbed Supabase
// client and prints a JSON array of [name, passed].
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'features', 'admin-data.js'), 'utf8');
const results = [];
const test = (n, ok) => results.push([n, !!ok]);

// Chainable, thenable query stub. resolver(table, calls) -> {data,error,count}
function load(opts) {
  opts = opts || {};
  const queries = [];
  const fetches = [];
  const sb = {
    auth: { getSession: async () => ({ data: { session: opts.noSession ? null : { access_token: 'tok' } } }) },
    from(table) {
      const q = { table, calls: [] };
      queries.push(q);
      const proxy = new Proxy({}, {
        get(_, m) {
          if (m === 'then') return (res, rej) => Promise.resolve().then(() => {
            if (opts.throwOn && opts.throwOn(table)) throw new Error('offline');
            return (opts.resolve ? opts.resolve(table, q.calls) : { data: [], error: null, count: 0 });
          }).then(res, rej);
          return (...a) => { q.calls.push([m, a]); return proxy; };
        },
      });
      return proxy;
    },
  };
  const win = { certanvilSupabase: sb, location: { origin: 'https://app.test', hostname: 'app.test' } };
  const ctx = vm.createContext({
    window: win, console, Date, Math, JSON, Promise, Number, isFinite, String, Array, Object, encodeURIComponent,
    fetch: async (url, init) => { fetches.push([url, init]); return opts.fetch(url, init, fetches.length); },
  });
  vm.runInContext(src, ctx);
  return { m: win.adminData, queries, fetches };
}
const has = (q, name, pred) => q.calls.some(c => c[0] === name && (!pred || pred(c[1])));
const json = (o, ok) => ({ ok: ok !== false, status: ok === false ? 500 : 200, json: async () => o });

(async () => {
  const L = load();
  const rows = [
    { id: 1, created_at: '2026-10-01T10:00:00Z', user_id: 'a', context: { page: 'quiz', cert: 'sec', version: 'v1' } },
    { id: 2, created_at: '2026-10-03T10:00:00Z', user_id: 'b', context: { page: 'quiz', cert: 'sec', version: 'v1' } },
    { id: 3, created_at: '2026-10-02T10:00:00Z', user_id: 'a', context: { page: 'quiz', cert: 'sec', version: 'v1' } },
    { id: 4, created_at: '2026-10-04T10:00:00Z', user_id: null, context: { page: 'home', cert: 'net', version: 'v2' } },
    { id: 5, created_at: '2026-10-05T10:00:00Z', user_id: null, context: null },
  ];
  const g = L.m.groupReports(rows);
  const quiz = g.find(x => x.key === 'quiz|sec|v1');
  test('groupReports groups by screen+cert+version and counts reach',
    g.length === 3 && quiz && quiz.n === 3 && quiz.reach === 2 && quiz.ids.length === 3 && quiz.newest === '2026-10-03T10:00:00Z'
    && quiz.screen === 'quiz' && quiz.cert === 'sec' && quiz.ver === 'v1' && quiz.rows.length === 3);
  test('groupReports orders groups by newest report first', g.map(x => x.n).join() === '1,1,3' && g[0].ids[0] === 5);
  const solo = g.find(x => x.ids.length === 1 && x.ids[0] === 5);
  test('a report with no context is its own group', !!solo && solo.n === 1 && g.filter(x => x.ids.includes(5)).length === 1);

  const errs = [
    { message: 'A', version: 'v1', created_at: '2026-10-01T00:00:00Z' },
    { message: 'B', version: 'v2', created_at: '2026-10-02T00:00:00Z' },
    { message: 'A', version: 'v3', created_at: '2026-10-05T00:00:00Z' },
    { message: 'C', version: 'v4', created_at: '2026-10-09T00:00:00Z' },
    { message: 'B', version: 'v5', created_at: '2026-10-03T00:00:00Z' },
  ];
  const te = L.m.topErrors(errs, 2);
  test('topErrors orders by count then recency and keeps the newest version',
    te.length === 2 && te[0].message === 'A' && te[0].count === 2 && te[0].lastVersion === 'v3' && te[1].message === 'B' && te[1].lastVersion === 'v5');
  test('topErrors puts a newer single above an older single on equal counts', L.m.topErrors([errs[0], errs[3]], 5)[0].message === 'C');
  test('firstLine trims to first line and max', L.m.firstLine('hello\nworld', 10) === 'hello' && L.m.firstLine('abcdefghij', 5).length <= 5 && L.m.firstLine(null, 5) === '');

  // today(): one failing read does not blank the others
  const T = load({
    resolve: (t, calls) => (t === 'client_errors' ? { data: null, error: { message: 'rls' } } : { data: [], error: null, count: 7 }),
    fetch: async () => json({ used: 3, limit: 10, resetsAt: null }),
  });
  let tr, threw = false;
  try { tr = await T.m.today(); } catch (e) { threw = true; }
  test('today() returns partial data when one read fails, without throwing',
    !threw && tr && tr.ok === true && tr.data.users.total === 7 && tr.data.errors === null && tr.data.ai && tr.data.ai.used === 3 && tr.data.ai.resetsAt === null && tr.data.partial.indexOf('errors') >= 0);
  const T2 = load({ throwOn: () => true, fetch: async () => { throw new Error('offline'); } });
  let tr2, threw2 = false;
  try { tr2 = await T2.m.today(); } catch (e) { threw2 = true; }
  test('today() with everything offline still resolves and never throws', !threw2 && tr2 && typeof tr2.ok === 'boolean');
  test('today() reads AI usage from the app origin with the admin token',
    T.fetches[0][0] === 'https://app.test/api/ai/usage' && /Bearer tok/.test(JSON.stringify(T.fetches[0][1])));

  // reports(): paging + filters
  const R = load();
  await R.m.reports({ page: 0 });
  await R.m.reports({ page: 1, q: 'crash', canHear: true, cert: 'sec', thisWeek: true });
  const q0 = R.queries[0], q1 = R.queries[1];
  test('reports() builds range(0,19) for page 0 and range(20,39) for page 1',
    has(q0, 'range', a => a[0] === 0 && a[1] === 19) && has(q1, 'range', a => a[0] === 20 && a[1] === 39));
  test('reports() defaults to open+triaged, newest first',
    has(q0, 'in', a => a[0] === 'status' && a[1].join() === 'open,triaged') && has(q0, 'order', a => a[0] === 'created_at' && a[1].ascending === false));
  test('reports() applies search, canHear, cert and week filters',
    has(q1, 'or', a => /title\.ilike/.test(a[0]) && /description\.ilike/.test(a[0])) && has(q1, 'not', a => a[0] === 'user_id') && has(q1, 'gte', a => a[0] === 'created_at'));
  const RC = load({ resolve: () => ({ data: null, error: { message: 'boom' } }) });
  const rc = await RC.m.reports({});
  test('reports() resolves ok:false on error', rc.ok === false && !!rc.error);

  // requests()
  const Q = load();
  await Q.m.requests({ q: 'aws', page: 1, notTold: true, thisWeek: true });
  test('requests() reads cert_request_tally 20 per page with ilike on label',
    Q.queries[0].table === 'cert_request_tally' && has(Q.queries[0], 'range', a => a[0] === 20 && a[1] === 39) && has(Q.queries[0], 'ilike', a => a[0] === 'label'));

  // openCount / errorsWeek
  const O = load({ resolve: () => ({ data: null, error: null, count: 12 }) });
  const oc = await O.m.openCount();
  test('openCount() is a head count of open+triaged', oc.ok && oc.data === 12 && has(O.queries[0], 'select', a => a[1] && a[1].head === true && a[1].count === 'exact'));
  const many = []; for (let i = 0; i < 500; i++) many.push({ message: 'm' + (i % 3), version: 'v', created_at: '2026-10-05T00:00:00Z' });
  const E = load({ resolve: () => ({ data: many, error: null }) });
  const ew = await E.m.errorsWeek();
  test('errorsWeek() caps at 500 and flags capped', ew.ok && ew.data.capped === true && ew.data.top.length === 3 && has(E.queries[0], 'limit', a => a[0] === 500));

  // act(): loops, sums, stops on paused / on failure
  const seq = [
    { closed: 200, sent: 150, skipped: 40, failed: 10, remaining: 100, next: 200, paused: false },
    { closed: 100, sent: 90, skipped: 10, failed: 0, remaining: 0, next: null, paused: false },
  ];
  const A = load({ fetch: async (u, i, n) => json(seq[n - 1]) });
  const ar = await A.m.act('close', [1, 2, 3]);
  const body2 = JSON.parse(A.fetches[1][1].body);
  test('act loops until remaining is 0 and sums the result',
    ar.ok && A.fetches.length === 2 && ar.data.closed === 300 && ar.data.sent === 240 && ar.data.skipped === 50 && ar.data.failed === 10 && ar.data.remaining === 0
    && body2.after === 200 && body2.action === 'close' && A.fetches[0][0].indexOf('/api/admin/bug-report') > 0 && /Bearer tok/.test(A.fetches[0][1].headers.Authorization));
  const P = load({ fetch: async () => json({ closed: 50, sent: 50, skipped: 0, failed: 0, remaining: 300, next: 50, paused: true }) });
  const pr = await P.m.act('fixed', [1]);
  test('act stops on paused and reports it', pr.ok && P.fetches.length === 1 && pr.data.paused === true && pr.data.remaining === 300);
  const F = load({ fetch: async () => json({ error: 'nope' }, false) });
  const fr = await F.m.act('close', [1]);
  test('act resolves ok:false on a failed call', fr.ok === false && !!fr.error);

  // fix round 1
  const ids450 = Array.from({ length: 450 }, (_, i) => i + 1);
  const C = load({ fetch: async (u, i) => { const n = JSON.parse(i.body).ids.length; return json({ closed: n, sent: n, skipped: 0, failed: 0, remaining: 0, next: null, paused: false }); } });
  const cr = await C.m.act('close', ids450);
  const sizes = C.fetches.map(f => JSON.parse(f[1].body).ids.length);
  test('act chunks 450 ids into requests of <=200 and sums the totals',
    cr.ok && sizes.join() === '200,200,50' && cr.data.closed === 450 && cr.data.sent === 450 && cr.data.remaining === 0 && C.fetches.every(f => !('after' in JSON.parse(f[1].body))));
  const CP = load({ fetch: async () => json({ closed: 200, sent: 0, skipped: 0, failed: 0, remaining: 0, next: null, paused: true }) });
  const cp = await CP.m.act('close', ids450);
  test('act stops all chunks on paused and counts the unstarted ids as remaining', cp.ok && CP.fetches.length === 1 && cp.data.paused && cp.data.remaining === 250);
  const MF = load({ fetch: async (u, i, n) => (n === 1 ? json({ closed: 200, sent: 200, skipped: 0, failed: 0, remaining: 0, next: null, paused: false }) : json({ error: 'boom' }, false)) });
  const mf = await MF.m.act('close', ids450);
  test('act keeps partial progress on a non-2xx mid-run', mf.ok === false && mf.error === 'boom' && mf.partial && mf.partial.closed === 200);
  const MT = load({ fetch: async (u, i, n) => { if (n === 2) throw new Error('offline'); return json({ closed: 200, sent: 0, skipped: 0, failed: 0, remaining: 0, next: null, paused: false }); } });
  const mt = await MT.m.act('close', ids450);
  test('act keeps partial progress when the network drops', mt.ok === false && mt.partial && mt.partial.closed === 200);

  const H = load();
  await H.m.reports({ q: 'a,b)(*%\\' });
  const orArg = H.queries[0].calls.find(c => c[0] === 'or')[1][0];
  const inner = orArg.replace('title.ilike.%', '').replace(',description.ilike.%', '|');
  test('hostile search text adds no commas, parens or stars to the or filter', orArg.split(',').length === 2 && !/[()*\\]/.test(orArg) && inner.indexOf('a b') >= 0);
  const W = load();
  await W.m.reports({ q: '  Network+   (N10-009)  ' });
  test('search text collapses whitespace so "Network+ (N10-009)" matches', W.queries[0].calls.find(c => c[0] === 'or')[1][0].indexOf('%Network+ N10-009%') >= 0);

  const NS = load({ noSession: true, resolve: () => ({ data: [], error: null, count: 2 }), fetch: async () => { throw new Error('should not fetch'); } });
  const ns = await NS.m.today();
  test('today() does not call the usage endpoint without a session', ns.ok && ns.data.ai === null && NS.fetches.length === 0);
  const nsa = await NS.m.act('close', [1]);
  test('act without a session fails before fetching', nsa.ok === false && NS.fetches.length === 0);
  // today(): users null, ai null, all-fail
  const UN = load({ resolve: (t) => (t === 'profiles' ? { data: null, error: { message: 'rls' } } : { data: [], error: null, count: 4 }), fetch: async () => json({ used: 1, limit: 2, resetsAt: '2026-11-01T00:00:00Z' }) });
  const un = await UN.m.today();
  test('today() users null when profiles reads fail', un.ok && un.data.users === null && un.data.errors === 4 && un.data.ai.limit === 2 && un.data.partial.join() === 'users');
  const AN = load({ resolve: () => ({ data: [], error: null, count: 4 }), fetch: async () => json({}, false) });
  const an = await AN.m.today();
  test('today() ai null when the usage call fails', an.ok && an.data.ai === null && an.data.users.total === 4 && an.data.partial.join() === 'ai');
  const AF = load({ resolve: () => ({ data: null, error: { message: 'rls' } }), fetch: async () => json({}, false) });
  const af = await AF.m.today();
  test('today() is ok:false when all three sections fail', af.ok === false && !!af.error);

  console.log(JSON.stringify(results));
})().catch(e => { console.log(JSON.stringify([['admin-data async harness crashed: ' + e.message, false]])); });
