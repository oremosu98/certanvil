// Admin in the app, Task 6: the data layer behind the Admin screen. Pure helpers (groupReports, topErrors, firstLine)
// plus fetchers that read with the admin's own session. Every fetcher resolves {ok:true,data} or {ok:false,error} and
// never throws, so one failing section (RLS error, offline mid-load) cannot blank the others.
// Loaded on demand: `await _loadFeature('admin-data')` (also exposed as window.adminData).
(function () {
  var PAGE = 20;
  var OPEN = ['open', 'triaged'];
  var DAY = 86400000;

  function sb() { return window.certanvilSupabase; }
  function fail(e) { return { ok: false, error: (e && e.message) || String(e || 'Something went wrong') }; }
  function ok(d) { return { ok: true, data: d }; }
  function weekAgo() { return new Date(Date.now() - 7 * DAY).toISOString(); }
  function midnight() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[%,()*\\]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function pageRange(p) { var n = Math.max(0, p | 0); return [n * PAGE, n * PAGE + PAGE - 1]; }

  function firstLine(s, max) {
    var line = String(s == null ? '' : s).split(/\r?\n/)[0].trim();
    if (max && line.length > max) line = line.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
    return line;
  }

  // Reports with the same screen+cert+version are one problem seen by several people.
  function groupReports(rows) {
    var map = {}, order = [];
    (rows || []).forEach(function (r) {
      var c = r.context || null;
      var screen = c ? (c.page || c.screen || 'unknown') : null;
      var cert = c ? (c.cert || 'unknown') : null;
      var ver = c ? (c.version || 'unknown') : null;
      var key = c ? screen + '|' + cert + '|' + ver : 'solo|' + r.id;
      var g = map[key];
      if (!g) {
        g = map[key] = { key: key, screen: screen || 'unknown', cert: cert || 'unknown', ver: ver || 'unknown', n: 0, reach: 0, newest: r.created_at, ids: [], rows: [], _u: {}, _anon: 0 };
        order.push(g);
      }
      g.n++; g.ids.push(r.id); g.rows.push(r);
      if (String(r.created_at) > String(g.newest)) g.newest = r.created_at;
      if (r.user_id) g._u[r.user_id] = 1; else g._anon++;
    });
    order.forEach(function (g) { g.reach = Object.keys(g._u).length + g._anon; delete g._u; delete g._anon; });
    order.sort(function (a, b) { return String(b.newest).localeCompare(String(a.newest)); });
    return order;
  }

  function topErrors(rows, k) {
    var map = {}, list = [];
    (rows || []).forEach(function (r) {
      var key = r.message;
      var e = map[key];
      if (!e) { e = map[key] = { message: key, count: 0, lastVersion: r.version, _t: '' }; list.push(e); }
      e.count++;
      if (String(r.created_at) >= e._t) { e._t = String(r.created_at); e.lastVersion = r.version; }
    });
    list.sort(function (a, b) { return b.count - a.count || b._t.localeCompare(a._t); });
    return list.slice(0, k == null ? 5 : k).map(function (e) { return { message: e.message, count: e.count, lastVersion: e.lastVersion }; });
  }

  async function token() {
    var r = await sb().auth.getSession();
    return r && r.data && r.data.session && r.data.session.access_token;
  }

  async function headCount(table, build) {
    try {
      var q = sb().from(table).select('*', { count: 'exact', head: true });
      if (build) q = build(q);
      var r = await q;
      if (r.error) return { err: r.error.message || 'read failed' };
      return { n: r.count || 0 };
    } catch (e) { return { err: e.message || 'offline' }; }
  }

  async function aiUsage() {
    try {
      var t = await token();
      if (!t) return { err: 'Not signed in' };
      var res = await fetch(window.location.origin + '/api/ai/usage', { headers: { Authorization: 'Bearer ' + t } });
      if (!res.ok) return { err: 'usage ' + res.status };
      var j = await res.json();
      return { v: { used: j.used, limit: j.limit, resetsAt: j.resetsAt == null ? null : j.resetsAt } };
    } catch (e) { return { err: e.message || 'offline' }; }
  }

  async function today() {
    try {
      var wk = weekAgo();
      var parts = await Promise.all([
        headCount('profiles'),
        headCount('profiles', function (q) { return q.gte('created_at', wk); }),
        headCount('profiles', function (q) { return q.gte('updated_at', wk); }),
        headCount('client_errors', function (q) { return q.gte('created_at', midnight()); }),
        aiUsage(),
      ]);
      var partial = [];
      var users = (parts[0].err || parts[1].err || parts[2].err)
        ? (partial.push('users'), null)
        : { total: parts[0].n, new7: parts[1].n, active7: parts[2].n };
      var errors = parts[3].err ? (partial.push('errors'), null) : parts[3].n;
      var ai = parts[4].err ? (partial.push('ai'), null) : parts[4].v;
      if (partial.length === 3) return { ok: false, error: parts[0].err || parts[3].err || parts[4].err };
      return ok({ users: users, errors: errors, ai: ai, partial: partial });
    } catch (e) { return fail(e); }
  }

  async function requests(o) {
    o = o || {};
    try {
      var rg = pageRange(o.page);
      var q = sb().from('cert_request_tally').select('*');
      var s = esc(o.q);
      if (s) q = q.ilike('label', '%' + s + '%');
      if (o.notTold) q = q.gt('pending', 0);
      if (o.written) q = q.eq('typed', true);
      if (o.thisWeek) q = q.gt('new_7d', 0);
      var r = await q.order('votes', { ascending: false }).order('last_at', { ascending: false }).range(rg[0], rg[1]);
      if (r.error) return fail(r.error);
      var rows = r.data || [];
      return ok({ rows: rows, page: Math.max(0, o.page | 0), more: rows.length === PAGE });
    } catch (e) { return fail(e); }
  }

  async function reports(o) {
    o = o || {};
    try {
      var rg = pageRange(o.page);
      var q = sb().from('user_bug_reports')
        .select('id,created_at,title,description,status,context,user_id,fixed_notified_at');
      if (o.open !== false) q = q.in('status', OPEN);
      var s = esc(o.q);
      if (s) q = q.or('title.ilike.%' + s + '%,description.ilike.%' + s + '%');
      if (o.canHear) q = q.not('user_id', 'is', null).is('fixed_notified_at', null);
      if (o.cert) q = q.eq('context->>cert', o.cert);
      if (o.thisWeek) q = q.gte('created_at', weekAgo());
      var r = await q.order('created_at', { ascending: false }).range(rg[0], rg[1]);
      if (r.error) return fail(r.error);
      var rows = r.data || [];
      return ok({ rows: rows, page: Math.max(0, o.page | 0), more: rows.length === PAGE });
    } catch (e) { return fail(e); }
  }

  async function openCount() {
    var r = await headCount('user_bug_reports', function (q) { return q.in('status', OPEN); });
    return r.err ? fail(r.err) : ok(r.n);
  }

  async function errorsWeek() {
    try {
      var r = await sb().from('client_errors').select('message,version,created_at')
        .gte('created_at', weekAgo()).order('created_at', { ascending: false }).limit(500);
      if (r.error) return fail(r.error);
      var rows = r.data || [];
      return ok({ top: topErrors(rows, 5), capped: rows.length === 500, sample: rows.length });
    } catch (e) { return fail(e); }
  }

  function landingUrl() {
    var h = window.location && window.location.hostname;
    var base = (h === 'localhost' || h === '127.0.0.1') ? 'http://localhost:3140' : 'https://certanvil.com';
    return base + '/api/admin/bug-report';
  }

  // Close or "fixed"-notify the given reports. ids are split into chunks of 200 (the endpoint's cap); per chunk the
  // server works in batches, so keep calling while it says more remains. On a failure the work already done is
  // returned as `partial` so the screen can say how far it got.
  async function act(action, ids) {
    var sum = { closed: 0, sent: 0, skipped: 0, failed: 0, remaining: 0, next: null, paused: false };
    function bad(msg) { var r = fail(msg); r.partial = sum; return r; }
    try {
      var t = await token();
      if (!t) return fail('Not signed in');
      var list = ids || [], chunks = [];
      for (var i = 0; i < list.length; i += 200) chunks.push(list.slice(i, i + 200));
      for (var c = 0; c < chunks.length && !sum.paused; c++) {
        var after = null, guard = 0, rem;
        do {
          var body = { action: action, ids: chunks[c] };
          if (after != null) body.after = after;
          var res = await fetch(landingUrl(), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify(body) });
          var j = await res.json().catch(function () { return {}; });
          if (!res.ok) return bad(j.error || ('Request failed (' + res.status + ')'));
          sum.closed += j.closed || 0; sum.sent += j.sent || 0; sum.skipped += j.skipped || 0; sum.failed += j.failed || 0;
          rem = j.remaining || 0; after = j.next == null ? null : j.next; sum.paused = !!j.paused;
        } while (rem > 0 && !sum.paused && after != null && ++guard < 100);
        // remaining = what is left unprocessed: this chunk's leftover plus every chunk not yet started
        sum.remaining = rem + chunks.slice(c + 1).reduce(function (n, x) { return n + x.length; }, 0);
        sum.next = after;
        if (!sum.paused && rem > 0 && after == null) break;
      }
      if (!chunks.length) sum.remaining = 0;
      return ok(sum);
    } catch (e) { return bad(e && e.message); }
  }

  var api = { groupReports: groupReports, topErrors: topErrors, firstLine: firstLine, today: today, requests: requests, reports: reports, openCount: openCount, errorsWeek: errorsWeek, act: act, PAGE_SIZE: PAGE };
  window.adminData = api;
  window._certanvilFeatures = window._certanvilFeatures || {};
  window._certanvilFeatures['admin-data'] = api;
})();
