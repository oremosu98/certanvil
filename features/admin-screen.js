// Admin in the app, Task 8: the Admin screen. One module, two layouts (drawing mockups/cert-ios-admin.html, phone views and
// every ?v=desktop* view; spec docs/superpowers/specs/2026-10-31-admin-in-app-design.md, sections 2 and 2b).
//   Phone (≤899px): a full-screen overlay (#ios-admin) opened from My certs → More → Admin; report and group details are
//     bottom sheets (#adm-sheet). The hub overlay pattern: inert behind, un-inert first on close, Escape handled once.
//   Desktop (≥900px): the #page-admin page, opened from the sidebar "Admin" item; two columns with Today across the top;
//     report and group details are centred dialogs (caDialogFrame); See all replaces the main view with a back arrow.
// Only the admin account (profiles.role = 'admin', window._certanvilIsAdmin) ever sees an entry point; openAdmin() returns
// false for everyone else, and the database refuses non-admins anyway (RLS). Data comes from window.adminData (Task 6):
// every fetcher resolves {ok, data|error}, so each section loads, fails and retries on its own.
// Every piece of user-written text (titles, descriptions, steps, labels, cert names, error messages) goes through _esc.
(function () {
  'use strict';

  var MQ = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
  function isPhone() { return !!(MQ && MQ.matches); }
  function isAdmin() { return window._certanvilIsAdmin === true; }
  function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var Q = '’';   // the drawing's apostrophe

  var DASH_URL = 'https://certanvil.com/admin';
  function _landing(path) {
    var h = window.location && window.location.hostname;
    return ((h === 'localhost' || h === '127.0.0.1') ? 'http://localhost:3140' : 'https://certanvil.com') + path;
  }

  function svg(d, cls) { return '<svg class="adm-i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; }
  var CHEV = svg('<path d="M9 6l6 6-6 6"></path>', 'adm-chev');
  var BACK = svg('<path d="M15 6l-6 6 6 6"></path>');
  var XI = svg('<path d="M6 6l12 12M18 6L6 18"></path>');
  var MAIL = svg('<rect x="2.5" y="5" width="19" height="14" rx="2.5"></rect><path d="M3 7l9 6 9-6"></path>');
  var PERSON = svg('<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>');
  var SEARCH = svg('<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path>');
  var OFFLINE = svg('<path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0"></path><path d="M3 3l18 18"></path>');
  var CHECK = svg('<path d="M20 6L9 17l-5-5"></path>');
  var SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"></path><path d="M9 12l2 2 4-4"></path></svg>';

  // ── Small pure helpers ──
  function people(n) { return n + (n === 1 ? ' person' : ' people'); }
  function emails(n) { return n + (n === 1 ? ' email' : ' emails'); }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function ago(iso, now) {
    var t = Date.parse(iso); if (!isFinite(t)) return '';
    var s = Math.max(0, ((now || Date.now()) - t) / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (m < 1) return 'just now';
    if (h < 1) return m === 1 ? '1 minute ago' : m + ' minutes ago';
    if (d < 1) return h === 1 ? '1 hour ago' : h + ' hours ago';
    if (d === 1) return 'yesterday';
    if (d < 7) return d + ' days ago';
    if (d < 14) return 'last week';
    if (d < 60) return Math.floor(d / 7) + ' weeks ago';
    return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function known(v) { return v != null && v !== '' && v !== 'unknown'; }
  function canHear(r) { return !!(r && r.user_id && !r.fixed_notified_at); }
  function line(s, max) {
    var a = String(s == null ? '' : s).split(/\r?\n/)[0].trim();
    return max && a.length > max ? a.slice(0, max - 1).trim() + '…' : a;
  }
  function titleOf(r) { return line(r.title, 90) || line(r.description, 90) || 'Untitled report'; }
  function fixedTitle(r) { var t = Array.from(titleOf(r)); return t.length > 50 ? t.slice(0, 50).join('') + '…' : t.join(''); }   // the email's subject cut (landing bug-report.js)

  function D() { return window.adminData ? Promise.resolve(window.adminData) : _loadFeature('admin-data'); }

  // ── State ──
  var S = {
    layout: null, root: null, view: 'admin', offline: false,
    sec: { today: {}, req: {}, rep: {}, err: {} },
    totals: null, openN: null, confirmFor: null, send: null,
    list: null, groups: [], byId: {}, emails: {},
    prevFocus: null, inerted: [], from: null
  };

  // ── Section builders (shared by both layouts) ──
  function sect(key, label, count, hot) {
    return '<div class="adm-sect"><h2 class="adm-sect-h" id="adm-s-' + key + '">' + label + '</h2>' + (count ? '<span class="adm-count' + (hot ? ' adm-hot' : '') + '">' + count + '</span>' : '') + '</div>';
  }
  function rv(d) { return ' adm-rv" style="--d:' + d + '"'; }
  function skel() { return '<div class="adm-skel" aria-hidden="true"></div>'; }
  function stateErr(key, d) { return '<div class="adm-state' + rv(d) + '><p>Couldn' + Q + 't load this.</p><button type="button" data-retry="' + key + '">Retry</button></div>'; }
  function stateMsg(msg, d) { return '<div class="adm-state' + rv(d) + '><p>' + msg + '</p></div>'; }

  function todayHtml(st) {
    var h = sect('today', 'Today');
    if (st.err) return h + stateErr('today', 1);
    if (!st.data) return h + skel();
    var d = st.data, cells = '';
    if (d.users) {
      cells += '<div class="adm-stat"><b>' + fmt(d.users.total) + '</b><span>Users</span>' + (d.users.new7 > 0 ? '<small>+' + fmt(d.users.new7) + ' this week</small>' : '') + '</div>'
        + '<div class="adm-stat"><b>' + fmt(d.users.active7) + '</b><span>Active this week</span></div>';
    }
    if (d.errors != null) cells += '<div class="adm-stat"><b>' + fmt(d.errors) + '</b><span>Errors today</span></div>';
    if (cells) h += '<div class="adm-stats' + rv(1) + '>' + cells + '</div>';
    if (d.ai) {
      var used = Number(d.ai.used) || 0, lim = Number(d.ai.limit) || 0, pct = lim > 0 ? Math.max(0, Math.min(100, used / lim * 100)) : 0, p = Math.round(pct);
      var reset = d.ai.resetsAt ? new Date(d.ai.resetsAt) : null;
      var resetTx = reset && isFinite(reset.getTime()) ? 'Resets at ' + reset.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
      h += '<div class="adm-ai' + rv(2) + '><div class="adm-ai-top"><b>' + fmt(used) + '</b><span>of ' + fmt(lim) + ' AI requests</span>' + (resetTx ? '<em>' + _esc(resetTx) + '</em>' : '') + '</div>'
        + '<div class="adm-bar" role="img" aria-label="' + fmt(used) + ' of ' + fmt(lim) + ' used, ' + p + ' percent"><span style="width:' + pct.toFixed(1) + '%"></span><i class="adm-tick"></i></div>'
        + '<div class="adm-bar-legend"><span>' + p + '% used</span><span>Warning email at 80%</span></div></div>';
    }
    if (d.partial && d.partial.length) h += stateErr('today', 3);
    return h;
  }

  function reqRow(r) {
    var k = String(r.exam_key), open = S.confirmFor === k, v = Number(r.votes) || 0, w = Number(r.new_7d) || 0;
    var h = '<button class="adm-row" type="button" data-req="' + _esc(k) + '" aria-expanded="' + open + '"><span class="adm-m"><span class="adm-t">' + _esc(r.label || k) + '</span>'
      + '<span class="adm-s">' + (r.typed ? 'Written in · ' : '') + (w ? '+' + w + ' this week · ' : '') + 'last asked ' + _esc(ago(r.last_at)) + '</span></span>'
      + '<span class="adm-v"><b>' + fmt(v) + '</b><span>' + (v === 1 ? 'vote' : 'votes') + '</span></span>' + CHEV + '</button>';
    if (!open) return h;
    var n = Number(r.pending) || 0, busy = S.send && S.send.key === k && S.send.busy, msg = S.send && S.send.key === k && S.send.msg;
    h += '<div class="adm-confirm adm-fade">';
    if (!n) return h + '<p>Everyone who asked for <b>' + _esc(r.label || k) + '</b> has been told.</p><div class="adm-btns"><button class="adm-btn-sec" type="button" data-act="cr-cancel">Close</button></div></div>';
    return h + '<p>Email the <b>' + people(n) + '</b> who asked for ' + _esc(r.label || k) + ' to say it' + Q + 's live?</p>'
      + (msg ? '<p class="adm-err" role="alert">' + _esc(msg) + '</p>' : '')
      + '<div class="adm-btns"><button class="adm-btn-pri" type="button" data-act="cr-send" data-key="' + _esc(k) + '"' + (busy ? ' disabled' : '') + '>' + (busy ? 'Sending…' : 'Send ' + emails(n)) + '</button>'
      + '<button class="adm-btn-sec" type="button" data-act="cr-cancel"' + (busy ? ' disabled' : '') + '>Cancel</button></div></div>';
  }
  function reqHtml(st) {
    var t = S.totals, h = sect('req', 'Cert requests', t ? fmt(t.exams) + ' exams · ' + fmt(t.votes) + ' votes' : '');
    if (st.err) return h + stateErr('req', 4);
    if (!st.data) return h + skel();
    var rows = st.data.rows.slice(0, 5);
    if (!rows.length) return h + stateMsg('No cert requests yet.', 4);
    h += '<div class="adm-list' + rv(4) + '>' + rows.map(reqRow).join('')
      + '<button class="adm-seeall" type="button" data-act="all-requests">' + (t ? 'See all ' + fmt(t.exams) + ' exams' : 'See all exams') + CHEV + '</button></div>';
    return h + '<p class="adm-note' + rv(4) + '>Tap an exam once it' + Q + 's live to email everyone who asked.</p>';
  }

  function repRow(r) {
    var c = r.context || {};
    return '<button class="adm-row" type="button" data-rep="' + _esc(r.id) + '"><span class="adm-m"><span class="adm-t">' + _esc(titleOf(r)) + '</span>'
      + '<span class="adm-s">#' + _esc(r.id) + (known(c.cert) ? ' · ' + _esc(c.cert) : '') + ' · ' + _esc(ago(r.created_at)) + '</span>'
      + (canHear(r) ? '<span class="adm-cue">Can hear back</span>' : '') + '</span>' + CHEV + '</button>';
  }
  function repHtml(st) {
    var n = S.openN, h = sect('rep', 'Bug reports', n == null ? '' : fmt(n) + ' open', n > 0);
    if (st.err) return h + stateErr('rep', 6);
    if (!st.data) return h + skel();
    var rows = st.data.rows.slice(0, 3);
    rows.forEach(function (r) { S.byId[r.id] = r; });
    if (!rows.length) return h + stateMsg('No open reports. New ones show up here and in Monday' + Q + 's email.', 6);
    return h + '<div class="adm-list' + rv(6) + '>' + rows.map(repRow).join('')
      + '<button class="adm-seeall" type="button" data-act="all-reports">' + (n == null ? 'See all open' : 'See all ' + fmt(n) + ' open') + CHEV + '</button></div>';
  }

  function errHtml(st) {
    var h = sect('err', 'Top errors', 'last 7 days');
    if (st.err) return h + stateErr('err', 8);
    if (!st.data) return h + skel();
    var top = st.data.top || [];
    if (!top.length) return h + stateMsg('No errors in the last 7 days.', 8);
    h += '<div class="adm-list' + rv(8) + '>' + top.map(function (e) {
      return '<div class="adm-row adm-static adm-errrow"><span class="adm-m"><span class="adm-t" title="' + _esc(e.message) + '">' + _esc(e.message) + '</span>'
        + '<span class="adm-s">Last seen on v' + _esc(e.lastVersion) + '</span></span><span class="adm-v"><b>' + fmt(e.count) + '</b><span>' + (e.count === 1 ? 'time' : 'times') + '</span></span></div>';
    }).join('') + '</div>';
    return h + (st.data.capped ? '<p class="adm-note">Based on the latest 500 errors.</p>' : '');
  }

  function prevHtml() {
    var on = !!(window._adminPreview && window._adminPreview.on());
    return sect('prev', 'Preview') + '<div class="adm-list' + rv(9) + '><div class="adm-row adm-static"><span class="adm-m"><span class="adm-t">Preview as Free</span>'
      + '<span class="adm-s">See the locks and the 15-a-day counter. You can still study as much as you like.</span></span>'
      + '<button class="adm-sw" type="button" role="switch" id="adm-free-sw" data-act="free" aria-checked="' + on + '" aria-label="Preview as Free"></button></div></div>'
      + '<div class="adm-list adm-dash' + rv(10) + '><a class="adm-row" href="' + DASH_URL + '" target="_blank" rel="noopener"><span class="adm-m"><span class="adm-t">Full dashboard on certanvil.com</span>'
      + '<span class="adm-s">Users, cert packs and recent ships</span></span>' + CHEV + '</a></div>';
  }

  var BUILD = { today: todayHtml, req: reqHtml, rep: repHtml, err: errHtml };
  function paint(key) {
    var el = S.root && S.root.querySelector('#adm-sec-' + key); if (!el) return;
    var st = S.sec[key];
    if (st.data || st.err) { if (el.getAttribute('data-filled')) el.setAttribute('data-still', ''); else el.setAttribute('data-filled', ''); }   // reveal on first paint only
    var keep = _focusKey(el);
    el.innerHTML = BUILD[key](st);
    el.setAttribute('aria-busy', st.data || st.err ? 'false' : 'true');
    _refocus(el, keep);
  }
  function _focusKey(el) {
    var a = document.activeElement; if (!a || !el.contains(a)) return null;
    var at = ['data-req', 'data-rep', 'data-grp', 'data-act', 'data-retry', 'data-chip'];
    for (var i = 0; i < at.length; i++) if (a.hasAttribute(at[i])) return '[' + at[i] + '="' + String(a.getAttribute(at[i])).replace(/"/g, '\\"') + '"]';
    return null;
  }
  function _refocus(el, sel) {
    if (!sel) return;
    var b = null; try { b = el.querySelector(sel); } catch (_) {}
    if (!b) b = el.querySelector('[data-retry], button');
    if (b) { try { b.focus({ preventScroll: true }); } catch (_) {} }
  }

  // ── Loading: each section on its own ──
  var LOAD = {
    today: function (d) { return d.today().then(function (r) { return r; }); },
    req: function (d) {
      return Promise.all([d.requests({ page: 0 }), d.requestTotals ? d.requestTotals() : Promise.resolve({ ok: false })]).then(function (x) {
        S.totals = x[1] && x[1].ok ? x[1].data : S.totals; return x[0];
      });
    },
    rep: function (d) {
      return Promise.all([d.reports({ page: 0 }), d.openCount()]).then(function (x) {
        if (x[1] && x[1].ok) _setOpenN(x[1].data);
        return x[0];
      });
    },
    err: function (d) { return d.errorsWeek(); }
  };
  function load(key, quiet) {
    var st = S.sec[key], tok = {};
    st.tok = tok;
    if (!quiet || !st.data) { st.data = null; st.err = null; paint(key); }
    return D().then(LOAD[key]).then(function (r) {
      if (st.tok !== tok) return;
      if (r && r.ok) { st.data = r.data; st.err = null; } else { st.err = (r && r.error) || 'failed'; if (!quiet) st.data = null; }
      if (S.view === 'admin') paint(key);
    }).catch(function (e) { if (st.tok !== tok) return; st.err = (e && e.message) || 'failed'; if (S.view === 'admin') paint(key); });
  }
  function loadAll(quiet) { ['today', 'req', 'rep', 'err'].forEach(function (k) { load(k, quiet); }); }

  // ── The open-report count: hub pill, sidebar item, the Bug reports heading ──
  function _setOpenN(n) {
    S.openN = typeof n === 'number' ? n : S.openN;
    var hub = document.querySelector('#ios-hub [data-act="admin"]');
    if (hub && S.openN != null) {
      var pill = hub.querySelector('.ihb-count-pill');
      if (pill) { pill.textContent = fmt(S.openN) + ' open'; pill.hidden = false; }
      hub.setAttribute('aria-label', 'Admin, ' + fmt(S.openN) + ' open bug report' + (S.openN === 1 ? '' : 's'));
    }
    var sb = document.querySelector('#app-sidebar .sb-item[data-sb-page="admin"]');
    if (sb && S.openN != null) {
      var c = sb.querySelector('.sb-item-n');
      if (c) { c.textContent = fmt(S.openN); c.hidden = false; }
      sb.setAttribute('aria-label', 'Admin, ' + fmt(S.openN) + ' open bug report' + (S.openN === 1 ? '' : 's'));
    }
  }
  function refreshCount() {
    if (!isAdmin()) return Promise.resolve(null);
    if (S.openN != null) _setOpenN(S.openN);   // a redrawn hub row or sidebar shows the last count at once
    return D().then(function (d) { return d.openCount(); }).then(function (r) { if (r && r.ok) _setOpenN(r.data); return S.openN; }).catch(function () { return null; });
  }

  // ── Shell and views ──
  function hdrHtml() {
    var title = S.view === 'reports' ? 'Bug reports' : S.view === 'requests' ? 'Cert requests' : 'Admin';
    var lbl = S.view !== 'admin' ? 'Back to Admin' : (S.from === 'hub' ? 'Back to My certs' : 'Back');
    var hideBack = S.layout === 'desk' && S.view === 'admin';
    return '<div class="adm-hdr"><button class="adm-back" type="button" data-act="back" aria-label="' + lbl + '"' + (hideBack ? ' hidden' : '') + '>' + BACK + '</button>'
      + '<h1 class="adm-h1" tabindex="-1">' + title + '</h1></div>';
  }
  function mainHtml() {
    return '<section class="adm-sec adm-today" id="adm-sec-today" aria-labelledby="adm-s-today"></section>'
      + '<section class="adm-sec" id="adm-sec-req" aria-labelledby="adm-s-req"></section>'
      + '<section class="adm-sec" id="adm-sec-rep" aria-labelledby="adm-s-rep"></section>'
      + '<section class="adm-sec" id="adm-sec-err" aria-labelledby="adm-s-err"></section>'
      + '<section class="adm-sec" id="adm-sec-prev" aria-labelledby="adm-s-prev">' + prevHtml() + '</section>';
  }
  function offlineHtml() {
    return '<div class="adm-state adm-offline adm-rv" role="status">' + OFFLINE + '<h2>You' + Q + 're offline</h2><p>Admin needs a connection. Your studying still works.</p>'
      + '<button type="button" data-act="offline-retry">Retry</button></div>';
  }
  function draw(fresh) {
    var root = S.root; if (!root) return;
    S.offline = navigator.onLine === false && S.view === 'admin';
    root.classList.toggle('adm-main', S.view === 'admin' && !S.offline);
    root.innerHTML = hdrHtml() + '<div class="adm-body' + (fresh ? ' adm-first' : '') + '">' + (S.offline ? offlineHtml() : S.view === 'admin' ? mainHtml() : listShellHtml()) + '</div>';
    if (S.offline) return;
    if (S.view === 'admin') {
      ['today', 'req', 'rep', 'err'].forEach(function (k) {
        if (S.sec[k].data || S.sec[k].err) { var el = root.querySelector('#adm-sec-' + k); el.setAttribute('data-filled', ''); if (!fresh) el.setAttribute('data-still', ''); }
        paint(k);
      });
      if (!fresh) root.querySelector('#adm-sec-prev').setAttribute('data-still', '');
    } else { paintChips(); paintList(); }
  }
  function go(view) {
    S.view = view; S.confirmFor = null; S.send = null;
    if (view !== 'admin') S.list = view === 'reports'
      ? { kind: 'reports', q: '', f: { open: true, canHear: false, thisWeek: false, cert: null }, page: 0, rows: [], more: false, st: 'loading', certs: [] }
      : { kind: 'requests', q: '', f: { notTold: true, written: false, thisWeek: false }, page: 0, rows: [], more: false, st: 'loading' };
    draw(false);
    var body = S.root.querySelector('.adm-body'); if (body) body.scrollTop = 0;
    if (S.layout === 'desk') { try { window.scrollTo(0, 0); } catch (_) {} }
    if (view === 'admin') loadAll(true); else loadList(false);
    var h1 = S.root.querySelector('.adm-h1'); if (h1) { try { h1.focus({ preventScroll: true }); } catch (_) {} }
  }

  // ── See all: search, chips, 20 at a time ──
  function listShellHtml() {
    var L = S.list, ph = L.kind === 'reports' ? 'Search reports' : 'Search exams';
    return '<label class="adm-search">' + SEARCH + '<input type="search" placeholder="' + ph + '" aria-label="' + ph + '" value="' + _esc(L.q) + '"></label>'
      + '<div class="adm-chips" role="group" aria-label="Filters"></div><div class="adm-listbody" aria-live="polite"></div>';
  }
  function chipDefs() {
    var L = S.list;
    if (L.kind === 'requests') return [['notTold', 'Not told yet', L.f.notTold], ['written', 'Written in', L.f.written], ['thisWeek', 'This week', L.f.thisWeek]];
    var c = [['open', 'Open', L.f.open], ['canHear', 'Can hear back', L.f.canHear], ['thisWeek', 'This week', L.f.thisWeek]];
    var certs = L.certs.slice(); if (L.f.cert && certs.indexOf(L.f.cert) < 0) certs.push(L.f.cert);
    certs.forEach(function (x) { c.push(['cert:' + x, x, L.f.cert === x]); });
    return c;
  }
  function paintChips() {
    var el = S.root && S.root.querySelector('.adm-chips'); if (!el) return;
    var keep = _focusKey(el);
    el.innerHTML = chipDefs().map(function (c) { return '<button class="adm-chip" type="button" data-chip="' + _esc(c[0]) + '" aria-pressed="' + !!c[2] + '">' + _esc(c[1]) + '</button>'; }).join('');
    _refocus(el, keep);
  }
  function groupRow(g, i) {
    var many = g.n > 1, hear = g.rows.filter(canHear).length;
    var r = g.rows.filter(function (x) { return x.created_at === g.newest; })[0] || g.rows[0];
    var bits = [g.screen, g.cert, known(g.ver) ? 'v' + g.ver : ''].filter(known);
    var s = (many ? bits : (known((r.context || {}).cert) ? ['#' + r.id, r.context.cert] : ['#' + r.id])).map(_esc).join(' · ') + ' · ' + _esc(ago(g.newest));
    return '<button class="adm-row" type="button" ' + (many ? 'data-grp="' + i + '"' : 'data-rep="' + _esc(r.id) + '"') + '><span class="adm-m"><span class="adm-t">' + _esc(titleOf(r)) + '</span><span class="adm-s">' + s + '</span>'
      + (hear ? '<span class="adm-cue">' + (many ? hear + ' can hear back' : 'Can hear back') + '</span>' : '') + '</span>'
      + (many ? '<span class="adm-grp" aria-label="' + g.n + ' reports">' + g.n + '</span>' : '') + CHEV + '</button>';
  }
  function paintList() {
    var L = S.list, el = S.root && S.root.querySelector('.adm-listbody'); if (!el || !L) return;
    var keep = _focusKey(el), h = '';
    if (L.st === 'error' && !L.rows.length) h = stateErr('list', 0);
    else if (L.st === 'loading' && !L.rows.length) h = skel();
    else if (L.kind === 'reports') {
      L.rows.forEach(function (r) { S.byId[r.id] = r; });
      var gs = S.groups = window.adminData ? window.adminData.groupReports(L.rows) : [];
      var plain = L.f.open && !L.f.canHear && !L.f.thisWeek && !L.f.cert && !L.q, gl = gs.length + (gs.length === 1 ? ' group' : ' groups') + ' shown';
      var head = plain && S.openN != null ? fmt(S.openN) + ' open · ' + gl : fmt(L.rows.length) + (L.more ? '+' : '') + (L.rows.length === 1 ? ' report · ' : ' reports · ') + gl;
      h = '<div class="adm-sect"><b>' + head + '</b><span class="adm-count">newest first</span></div>';
      h += gs.length ? '<div class="adm-list">' + gs.map(groupRow).join('') + '</div>' : stateMsg('Nothing matches.', 0);
      if (L.more) h += '<button class="adm-more" type="button" data-act="more"' + (L.st === 'loading' ? ' disabled' : '') + '>' + (L.st === 'loading' ? 'Loading…' : 'Show 20 more') + '</button>';
      h += '<p class="adm-note">Reports from the same screen, cert and version are grouped, so one action handles them all.</p>';
    } else {
      var t = S.totals;
      h = '<div class="adm-sect"><b>' + (t ? fmt(t.exams) + ' exams · ' + fmt(t.votes) + ' votes' : 'Cert requests') + '</b><span class="adm-count">most votes first</span></div>';
      h += L.rows.length ? '<div class="adm-list">' + L.rows.map(reqRow).join('') + '</div>' : stateMsg('Nothing matches.', 0);
      if (L.more) h += '<button class="adm-more" type="button" data-act="more"' + (L.st === 'loading' ? ' disabled' : '') + '>' + (L.st === 'loading' ? 'Loading…' : 'Show 20 more') + '</button>';
    }
    if (L.st === 'error' && L.rows.length) h += '<div class="adm-state"><p>Couldn' + Q + 't load this.</p><button type="button" data-retry="list">Retry</button></div>';
    el.innerHTML = h;
    _refocus(el, keep);
  }
  function loadList(append) {
    var L = S.list; if (!L) return;
    var tok = L.tok = {}, page = append ? L.page + 1 : 0;
    if (!append) { L.rows = []; L.page = 0; L.more = false; }
    L.st = 'loading'; paintList();
    var q = L.kind === 'reports'
      ? { q: L.q, open: L.f.open, canHear: L.f.canHear, thisWeek: L.f.thisWeek, cert: L.f.cert, page: page }
      : { q: L.q, notTold: L.f.notTold, written: L.f.written, thisWeek: L.f.thisWeek, page: page };
    D().then(function (d) {
      if (L.kind === 'requests' && !S.totals && d.requestTotals) d.requestTotals().then(function (r) { if (r && r.ok) { S.totals = r.data; if (S.list === L) paintList(); } });
      return L.kind === 'reports' ? d.reports(q) : d.requests(q);
    }).then(function (r) {
      if (L.tok !== tok || S.list !== L) return;
      if (!r || !r.ok) { L.st = 'error'; paintList(); return; }
      L.rows = append ? L.rows.concat(r.data.rows) : r.data.rows.slice();
      L.page = page; L.more = !!r.data.more; L.st = 'ok';
      if (L.kind === 'reports') {
        var seen = {};
        L.certs.forEach(function (c) { seen[c] = 1; });
        L.rows.forEach(function (x) { var c = x.context && x.context.cert; if (known(c) && !seen[c]) { seen[c] = 1; L.certs.push(String(c)); } });
        paintChips();
      }
      paintList();
    }).catch(function () { if (L.tok === tok) { L.st = 'error'; paintList(); } });
  }
  function toggleChip(key) {
    var L = S.list;
    if (key.indexOf('cert:') === 0) { var c = key.slice(5); L.f.cert = L.f.cert === c ? null : c; }
    else L.f[key] = !L.f[key];
    paintChips(); loadList(false);
  }
  var _qTimer = 0;
  function onSearch(v) { clearTimeout(_qTimer); _qTimer = setTimeout(function () { if (!S.list || S.list.q === v) return; S.list.q = v; loadList(false); }, 250); }

  // ── Tell them it's live (cert requests): the landing notify-cert-live loop (landing/lib/admin.js startSend) ──
  function _rowByKey(k) {
    var all = (S.sec.req.data ? S.sec.req.data.rows : []).concat(S.list && S.list.kind === 'requests' ? S.list.rows : []);
    return all.filter(function (r) { return String(r.exam_key) === k; })[0] || null;
  }
  function redrawReq() { if (S.view === 'admin') paint('req'); else if (S.list && S.list.kind === 'requests') paintList(); }
  function sendLive(k) {
    var r = _rowByKey(k); if (!r || (S.send && S.send.busy)) return;
    var label = r.label || k, tot = { sent: 0, failed: 0, skipped: 0 };
    S.send = { key: k, busy: true, msg: '' }; redrawReq();
    function stop(msg) { S.send = { key: k, busy: false, msg: msg }; redrawReq(); }
    function step(after) {
      return window.certanvilSupabase.auth.getSession().then(function (s) {
        var token = s && s.data && s.data.session ? s.data.session.access_token : '';
        if (!token) throw new Error('auth');
        return fetch(_landing('/api/admin/notify-cert-live'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ exam_key: k, label: label, after: after || undefined }) });
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (j) { if (!res.ok) { var e = new Error('http'); e.status = res.status; throw e; } return j; });
      }).then(function (b) {
        tot.sent += Number(b.sent) || 0; tot.failed += Number(b.failed) || 0; tot.skipped += Number(b.skipped) || 0;
        var rem = Number(b.remaining) || 0, lost = tot.failed + tot.skipped;
        var sum = 'Sent to ' + people(tot.sent) + '.' + (lost ? ' ' + lost + ' couldn' + Q + 't be reached.' : '');
        if (b.paused) return stop(sum + ' Email is busy, try again in a minute.');
        if (rem > 0) { if (b.next && b.next !== after) return step(b.next); return stop(sum + ' Stopped early, try again.'); }
        if (lost) return stop(sum);
        S.send = null; S.confirmFor = null; redrawReq();
        toast('Sent ' + emails(tot.sent), 'Everyone who asked for ' + label + ' now knows it' + Q + 's live.');
        load('req', true); if (S.list && S.list.kind === 'requests') loadList(false);
      });
    }
    step('').catch(function (e) {
      var why = e && e.message === 'auth' ? 'Sign in again, then retry.' : e && e.status === 503 ? 'Email is not set up yet.' : e && e.status === 409 ? 'That exam changed. Reload and try again.' : 'Could not finish. Try again.';
      stop('Sent to ' + people(tot.sent) + ' so far. ' + why);
    });
  }

  // ── Report and group sheets: a bottom sheet on phones, a centred dialog on desktop ──
  var SH = { host: null, scrim: null, frame: null, kind: null, id: null, step: null, busy: false, err: '', back: null, more: false, hideT: 0 };
  function _sheetHosts() {
    if (!SH.host || !SH.host.isConnected) {
      SH.scrim = document.createElement('div'); SH.scrim.id = 'adm-scrim'; SH.scrim.className = 'adm-scrim'; SH.scrim.hidden = true;
      SH.scrim.addEventListener('click', function () { closeSheet(); });
      SH.host = document.createElement('aside'); SH.host.id = 'adm-sheet'; SH.host.className = 'adm-sheet'; SH.host.hidden = true;
      SH.host.setAttribute('role', 'dialog'); SH.host.setAttribute('aria-modal', 'true'); SH.host.setAttribute('aria-labelledby', 'adm-sh-title');
      SH.host.addEventListener('click', onSheetClick);
      document.body.appendChild(SH.scrim); document.body.appendChild(SH.host);
    }
  }
  function sheetOpen() { return !!(SH.host && !SH.host.hidden && SH.kind); }
  function _shHead(eyebrow, title, when) {
    return '<div class="adm-grab" aria-hidden="true"></div><button class="adm-sh-x" type="button" data-act="sh-close" data-ca-close aria-label="Close">' + XI + '</button><div class="adm-sh-scroll">'
      + '<span class="adm-sh-eyebrow">' + eyebrow + '</span><h2 class="adm-sh-title" id="adm-sh-title">' + title + '</h2><span class="adm-sh-when">' + when + '</span>';
  }
  function _btn(cls, act, label, busyLabel) { return '<button class="' + cls + '" type="button" data-act="' + act + '"' + (SH.busy ? ' disabled' : '') + '>' + (SH.busy && busyLabel ? busyLabel : label) + '</button>'; }
  function reportHtml(r) {
    var c = r.context || {}, hear = canHear(r), em = r.user_id ? S.emails[r.user_id] : null, who = em ? _esc(em) : 'They';
    var meta = [['Cert', c.cert], ['Screen', c.page || c.screen], ['Version', c.version], ['Device', c.device], ['Theme', c.theme ? String(c.theme).charAt(0).toUpperCase() + String(c.theme).slice(1) : '']]
      .filter(function (m) { return known(m[1]); }).map(function (m) { return '<dt>' + m[0] + '</dt><dd>' + _esc(m[1]) + '</dd>'; }).join('');
    var h = _shHead('Bug report #' + _esc(r.id), _esc(titleOf(r)), _esc(ago(r.created_at)))
      + (r.description ? '<div class="adm-sh-k">What happened</div><p class="adm-sh-p">' + _esc(r.description) + '</p>' : '')
      + (r.steps ? '<div class="adm-sh-k">Steps</div><p class="adm-sh-p">' + _esc(r.steps) + '</p>' : '')
      + (meta ? '<div class="adm-sh-k">Sent from</div><dl class="adm-meta">' + meta + '</dl>' : '');
    if (hear) h += '<div class="adm-reach">' + MAIL + '<span><b>' + who + '</b> can hear back when it' + Q + 's fixed.</span></div>';
    else if (r.user_id) h += '<div class="adm-reach adm-anon">' + MAIL + '<span>Already told it' + Q + 's fixed.</span></div>';
    else h += '<div class="adm-reach adm-anon">' + PERSON + '<span>Sent while signed out, so there' + Q + 's no one to email.</span></div>';
    h += '</div><div class="adm-sh-foot">' + (SH.err ? '<p class="adm-err" role="alert">' + _esc(SH.err) + '</p>' : '');
    if (SH.step === 'confirm' && hear) {
      h += '<div class="adm-fade"><p class="adm-sh-confirm">Emails <b>' + (em ? _esc(em) : 'them') + '</b> “Fixed: ' + _esc(fixedTitle(r)) + '” and closes the report.</p></div>'
        + _btn('adm-btn-pri', 'r-send', 'Send and close', 'Sending…') + _btn('adm-btn-sec', 'r-cancel', 'Cancel');
    } else {
      h += (hear ? _btn('adm-btn-pri', 'r-tell', 'Fixed, tell them') : '') + _btn('adm-btn-sec', 'r-close', 'Close, no email', 'Closing…');
    }
    return h + '</div>';
  }
  function groupHtml(g) {
    var hear = g.rows.filter(canHear).length, n = g.n;
    var items = g.rows.map(function (r, k) {
      return '<li' + (k >= 4 && !SH.more ? ' hidden' : '') + '><button type="button" data-rep="' + _esc(r.id) + '">' + _esc(titleOf(r)) + '<span>#' + _esc(r.id) + ' · ' + _esc(ago(r.created_at)) + (canHear(r) ? ' · can hear back' : '') + '</span></button></li>';
    }).join('');
    if (n > 4 && !SH.more) items += '<li><button type="button" class="adm-sh-more" data-act="g-more"><span>and ' + (n - 4) + ' more, tap one to read it in full</span></button></li>';
    var h = _shHead(n + ' reports', [g.screen, g.cert].filter(known).map(_esc).join(' · ') || 'Reports', (known(g.ver) ? 'Version ' + _esc(g.ver) + ' · ' : '') + 'newest ' + _esc(ago(g.newest)))
      + '<div class="adm-sh-k">What people said</div><ul class="adm-sh-list">' + items + '</ul>'
      + (hear ? '<div class="adm-reach">' + MAIL + '<span><b>' + hear + ' of ' + n + '</b> can hear back when it' + Q + 's fixed.</span></div>'
        : '<div class="adm-reach adm-anon">' + PERSON + '<span>No one here can hear back, so there' + Q + 's no one to email.</span></div>')
      + '</div><div class="adm-sh-foot">' + (SH.err ? '<p class="adm-err" role="alert">' + _esc(SH.err) + '</p>' : '');
    if (SH.step === 'confirm' && hear) {
      h += '<div class="adm-fade"><p class="adm-sh-confirm">Emails <b>' + people(hear) + '</b> “Fixed: …” with their own report' + Q + 's title, and closes all ' + n + '.</p></div>'
        + _btn('adm-btn-pri', 'g-send', 'Send ' + emails(hear) + ' and close', 'Sending…') + _btn('adm-btn-sec', 'g-cancel', 'Cancel');
    } else {
      h += (hear ? _btn('adm-btn-pri', 'g-tell', 'Fixed, tell all ' + hear) : '') + _btn('adm-btn-sec', 'g-close', 'Close all ' + n + ', no email', 'Closing…');
    }
    return h + '</div>';
  }
  function renderSheet(focusSel) {
    if (!SH.kind) return;
    var g = SH.kind === 'group' ? S.groups[SH.id] : null, r = SH.kind === 'report' ? S.byId[SH.id] : null;
    if (!g && !r) { closeSheet(); return; }
    var keep = focusSel || _focusKey(SH.host);
    var sc = SH.host.querySelector('.adm-sh-scroll'), top = sc ? sc.scrollTop : 0;
    SH.host.innerHTML = g ? groupHtml(g) : reportHtml(r);
    var sc2 = SH.host.querySelector('.adm-sh-scroll'); if (sc2) sc2.scrollTop = top;
    if (SH.frame) SH.frame.ensureClose();
    if (keep) _refocus(SH.host, keep);
  }
  function openSheet(kind, id, opener) {
    _sheetHosts();
    var was = sheetOpen();
    clearTimeout(SH.hideT);
    SH.kind = kind; SH.id = id; SH.step = null; SH.busy = false; SH.err = ''; SH.more = false;
    if (!was) SH.back = opener || null;
    renderSheet();
    if (kind === 'report') {
      var r = S.byId[id];
      if (r && r.user_id && S.emails[r.user_id] === undefined) {
        D().then(function (d) { return d.reporterEmail ? d.reporterEmail(r.user_id) : { ok: false }; }).then(function (x) {
          S.emails[r.user_id] = x && x.ok ? x.data : null;
          if (SH.kind === 'report' && SH.id === id) renderSheet();
        }).catch(function () {});
      }
    }
    if (was) { var x = SH.host.querySelector('.adm-sh-x'); if (x) { try { x.focus({ preventScroll: true }); } catch (_) {} } return; }
    SH.host.hidden = false;
    if (S.layout === 'desk' && typeof window.caDialogFrame === 'function') {
      SH.frame = window.caDialogFrame(SH.host, { size: 'md', onClose: function (o) { SH.frame = null; _sheetGone(o && o.instant); } });
      return;
    }
    SH.scrim.hidden = false;
    if (S.root) S.root.inert = true;
    void SH.host.offsetWidth;
    SH.scrim.classList.add('open'); SH.host.classList.add('open');
    var xb = SH.host.querySelector('.adm-sh-x'); if (xb) { try { xb.focus({ preventScroll: true }); } catch (_) {} }
  }
  function closeSheet(instant) {
    if (!SH.host || !SH.kind) return;
    if (SH.frame) { SH.frame.close(); return; }   // desktop: the frame tears down, then _sheetGone
    _sheetGone(instant);
  }
  function _sheetGone(instant) {
    var back = SH.back; SH.kind = null; SH.back = null; SH.busy = false;
    if (S.root) S.root.inert = false;   // un-inert first, so focus can land back
    if (SH.scrim) SH.scrim.classList.remove('open');
    SH.host.classList.remove('open');
    var host = SH.host, scrim = SH.scrim;
    var hide = function () { if (!SH.kind) { host.hidden = true; host.innerHTML = ''; if (scrim) scrim.hidden = true; } };
    if (instant) hide(); else SH.hideT = setTimeout(hide, 230);
    if (back && S.root) {
      var b = null; try { b = S.root.querySelector(back); } catch (_) {}
      if (b) { try { b.focus({ preventScroll: true }); } catch (_) {} }
    }
  }
  function _selFor(el) {
    if (el.hasAttribute('data-rep')) return '[data-rep="' + el.getAttribute('data-rep') + '"]';
    if (el.hasAttribute('data-grp')) return '[data-grp="' + el.getAttribute('data-grp') + '"]';
    return null;
  }

  // Close or fixed-notify reports. The result shows only after the server answers (iOS can cut requests off in the background).
  function runAct(action, ids, done) {
    if (SH.busy) return;
    SH.busy = true; SH.err = ''; renderSheet();
    D().then(function (d) { return d.act(action, ids); }).then(function (res) {
      SH.busy = false;
      var p = res && res.ok ? res.data : res && res.partial;
      var did = p ? (p.closed || 0) : 0;
      if (res && res.ok && !p.paused && !(p.remaining > 0) && !p.failed) { closeSheet(); setTimeout(function () { done(p); }, 230); }
      else {
        var tail = did ? ' ' + did + ' closed so far.' : '';
        SH.err = res && res.ok ? (p.paused ? 'Email is busy, try again in a minute.' + tail : p.failed ? p.failed + ' couldn' + Q + 't be emailed.' + tail + ' Try again.' : 'Stopped early.' + tail + ' Try again.')
          : 'That didn' + Q + 't go through.' + tail + ' Try again.';
        renderSheet();
      }
      afterAct();
    }).catch(function () { SH.busy = false; SH.err = 'That didn' + Q + 't go through. Try again.'; renderSheet(); });
  }
  function afterAct() {
    refreshCount();
    if (S.view === 'admin') load('rep', true);
    else if (S.list && S.list.kind === 'reports') loadList(false);
  }

  function onSheetClick(ev) {
    var b = ev.target.closest && ev.target.closest('button'); if (!b || !SH.host.contains(b) || b.disabled) return;
    var a = b.getAttribute('data-act');
    if (a === 'sh-close') { if (!SH.frame) closeSheet(); return; }   // desktop: the frame's own [data-ca-close] handler closes
    if (b.hasAttribute('data-rep') && SH.kind === 'group') { var id = +b.getAttribute('data-rep'); SH.kind = 'report'; SH.id = id; SH.step = null; SH.err = ''; openSheet('report', id); return; }
    if (a === 'g-more') { SH.more = true; renderSheet('[data-rep]'); return; }
    var r = SH.kind === 'report' ? S.byId[SH.id] : null, g = SH.kind === 'group' ? S.groups[SH.id] : null;
    if (a === 'r-tell' || a === 'g-tell') { SH.step = 'confirm'; SH.err = ''; renderSheet('[data-act="' + (a === 'r-tell' ? 'r-send' : 'g-send') + '"]'); }
    else if (a === 'r-cancel' || a === 'g-cancel') { SH.step = null; SH.err = ''; renderSheet('[data-act="' + (a === 'r-cancel' ? 'r-tell' : 'g-tell') + '"]'); }
    else if (a === 'r-send' && r) {
      var em = S.emails[r.user_id];
      runAct('fixed', [r.id], function () { toast('Email sent. Report #' + r.id + ' closed.', em ? 'Sent to ' + em + '.' : 'They' + Q + 'll get it in a minute.'); });
    }
    else if (a === 'r-close' && r) runAct('close', [r.id], function () { toast('Report #' + r.id + ' closed', 'No email sent.'); });
    else if (a === 'g-send' && g) runAct('fixed', g.ids.slice(), function (p) { toast('Sent ' + emails(p.sent || 0) + '. ' + (p.closed || 0) + ' reports closed.', 'Each person got their own report' + Q + 's title.'); });
    else if (a === 'g-close' && g) runAct('close', g.ids.slice(), function (p) { toast((p.closed || 0) + ' reports closed', 'No emails sent.'); });
  }

  // ── Toast ──
  var _tt = 0;
  function toast(b, s) {
    var t = document.getElementById('adm-toast');
    if (!t) {
      t = document.createElement('div'); t.id = 'adm-toast'; t.className = 'adm-toast'; t.setAttribute('role', 'status');
      t.innerHTML = '<span class="adm-toast-i">' + CHECK + '</span><span><b class="adm-toast-b"></b><span class="adm-toast-s"></span></span>';
      document.body.appendChild(t);
    }
    t.classList.toggle('adm-desk', S.layout === 'desk');
    t.querySelector('.adm-toast-b').textContent = b; t.querySelector('.adm-toast-s').textContent = s;
    t.hidden = false; void t.offsetWidth; t.classList.add('open');
    clearTimeout(_tt); _tt = setTimeout(function () { t.classList.remove('open'); }, 3200);
  }

  // ── Clicks and keys on the screen ──
  function onClick(ev) {
    var b = ev.target.closest && ev.target.closest('button, a'); if (!b || !S.root.contains(b) || b.disabled) return;
    var a = b.getAttribute('data-act');
    if (a === 'back') { if (S.view !== 'admin') go('admin'); else close(); }
    else if (b.hasAttribute('data-retry')) { var k = b.getAttribute('data-retry'); if (k === 'list') loadList(S.list && S.list.rows.length > 0); else load(k); }
    else if (a === 'all-reports') go('reports');
    else if (a === 'all-requests') go('requests');
    else if (b.hasAttribute('data-req')) { var key = b.getAttribute('data-req'); if (S.send && S.send.busy) return; S.confirmFor = S.confirmFor === key ? null : key; S.send = null; redrawReq(); }
    else if (a === 'cr-cancel') { if (S.send && S.send.busy) return; var was = S.confirmFor; S.confirmFor = null; S.send = null; redrawReq(); _refocus(S.root, '[data-req="' + was + '"]'); }
    else if (a === 'cr-send') sendLive(b.getAttribute('data-key'));
    else if (b.hasAttribute('data-rep')) { try { b.focus({ preventScroll: true }); } catch (_) {} openSheet('report', +b.getAttribute('data-rep'), _selFor(b)); }
    else if (b.hasAttribute('data-grp')) { try { b.focus({ preventScroll: true }); } catch (_) {} openSheet('group', +b.getAttribute('data-grp'), _selFor(b)); }
    else if (b.hasAttribute('data-chip')) toggleChip(b.getAttribute('data-chip'));
    else if (a === 'more') loadList(true);
    else if (a === 'free') { if (window._adminPreview) window._adminPreview.set(!window._adminPreview.on()); _syncSwitch(); }
    else if (a === 'offline-retry') { if (navigator.onLine !== false) { draw(true); loadAll(false); } }
  }
  function onInput(ev) { if (ev.target && ev.target.matches && ev.target.matches('.adm-search input')) onSearch(ev.target.value.trim()); }
  function _syncSwitch() {
    var sw = document.getElementById('adm-free-sw');
    if (sw) sw.setAttribute('aria-checked', String(!!(window._adminPreview && window._adminPreview.on())));
  }
  function onKey(ev) {
    if (ev.key !== 'Escape' || ev.defaultPrevented || S.layout !== 'phone' || !S.root || S.root.hidden) return;
    if (document.getElementById('pro-only-modal')) return;
    ev.preventDefault();   // handled once: the hub under Admin checks defaultPrevented
    if (sheetOpen()) closeSheet();
    else if (S.view !== 'admin') go('admin');
    else close();
  }

  // ── Phone overlay (the hub pattern) ──
  function _inertBehind(on) {
    if (on) {
      [].forEach.call(document.body.children, function (el) {
        if (el === S.root || el === SH.host || el === SH.scrim || el.id === 'adm-toast' || el.id === 'ap-freebar' || el.inert) return;
        el.inert = true; S.inerted.push(el);
      });
    } else { S.inerted.forEach(function (el) { el.inert = false; }); S.inerted = []; }
  }
  function _phoneHost() {
    var h = document.getElementById('ios-admin');
    if (!h) {
      h = document.createElement('section'); h.id = 'ios-admin'; h.hidden = true;
      h.setAttribute('role', 'dialog'); h.setAttribute('aria-modal', 'true'); h.setAttribute('aria-label', 'Admin');
      h.addEventListener('click', onClick); h.addEventListener('input', onInput);
      document.body.appendChild(h);
    }
    return h;
  }
  function _openPhone(view) {
    var root = _phoneHost(), wasOpen = !root.hidden && S.layout === 'phone';
    if (!wasOpen) {
      S.prevFocus = document.activeElement;
      S.from = S.prevFocus && S.prevFocus.closest && S.prevFocus.closest('#ios-hub') ? 'hub' : null;
    }
    S.layout = 'phone'; S.root = root; S.view = view; S.confirmFor = null; S.send = null;
    if (view !== 'admin') { S.view = 'admin'; draw(!wasOpen); go(view); } else draw(!wasOpen);
    root.hidden = false;
    if (!wasOpen) { _inertBehind(true); document.addEventListener('keydown', onKey, true); }
    if (view === 'admin' && !S.offline) loadAll(false);
    var h1 = root.querySelector('.adm-h1'); if (h1) { try { h1.focus({ preventScroll: true }); } catch (_) {} }
    refreshCount();
    return true;
  }
  function close() {
    if (S.layout !== 'phone') return;
    var root = document.getElementById('ios-admin'); if (!root || root.hidden) return;
    if (sheetOpen()) closeSheet(true);
    document.removeEventListener('keydown', onKey, true);
    _inertBehind(false);   // un-inert first, so focus can land back on the hub
    root.hidden = true; root.innerHTML = ''; root.inert = false;
    var back = S.prevFocus;
    if (!back || !back.isConnected) back = document.querySelector('#ios-hub [data-act="admin"]');
    if (back && back.focus) { try { back.focus({ preventScroll: true }); } catch (_) {} }
    S.prevFocus = null; S.layout = null; S.root = null;
  }

  // ── Desktop page ──
  function _openDesk(view) {
    var page = document.getElementById('page-admin'), host = document.getElementById('desk-admin');
    if (!page || !host || typeof showPage !== 'function') return false;
    if (!host.__admWired) { host.__admWired = true; host.addEventListener('click', onClick); host.addEventListener('input', onInput); }
    var showing = page.classList.contains('active') && S.layout === 'desk';
    S.layout = 'desk'; S.root = host; S.from = null;
    if (view !== 'admin') { S.view = 'admin'; draw(!showing); go(view); } else { S.view = 'admin'; draw(!showing); loadAll(showing); }
    if (!page.classList.contains('active')) showPage('admin');
    refreshCount();
    return true;
  }

  function openAdmin(view) {
    if (!isAdmin()) return false;
    view = view === 'reports' || view === 'requests' ? view : 'admin';
    return isPhone() ? _openPhone(view) : _openDesk(view);
  }

  // ── Desktop sidebar: an "Admin" item with the open count, admin only. home.js renderAppSidebar calls this after drawing. ──
  function sidebar() {
    var sb = document.getElementById('app-sidebar'); if (!sb) return;
    var cur = sb.querySelector('.sb-admin');
    if (!isAdmin()) { if (cur) cur.remove(); return; }
    if (!cur) {
      cur = document.createElement('div'); cur.className = 'sb-section sb-admin';
      cur.innerHTML = '<button type="button" class="sb-item" data-sb-page="admin" aria-label="Admin"><span class="sb-item-icon" aria-hidden="true">' + SHIELD + '</span>'
        + '<span class="sb-item-label">Admin</span><span class="sb-item-n" aria-hidden="true" hidden></span></button>';
      cur.querySelector('button').addEventListener('click', function () { openAdmin('admin'); });
      var foot = sb.querySelector('.sb-foot');
      if (foot) sb.insertBefore(cur, foot); else sb.appendChild(cur);
    }
    var p = document.getElementById('page-admin');
    cur.querySelector('.sb-item').classList.toggle('sb-item-active', !!(p && p.classList.contains('active')));
    if (S.openN != null) _setOpenN(S.openN);
    refreshCount();
  }

  // Crossing 900px swaps the layouts, like the hub: one tick late so a desktop dialog releases first.
  function _swap() {
    if (isPhone()) {
      var p = document.getElementById('page-admin');
      if (S.layout === 'desk' && p && p.classList.contains('active')) { var v = S.view; if (typeof showPage === 'function') showPage('setup'); S.layout = null; if (isAdmin()) _openPhone(v); }
    } else if (S.layout === 'phone') { var v2 = S.view; close(); if (isAdmin()) _openDesk(v2); }
  }
  if (MQ) { var _onBreak = function () { if (sheetOpen() && !SH.frame) closeSheet(true); setTimeout(_swap, 0); }; if (MQ.addEventListener) MQ.addEventListener('change', _onBreak); else if (MQ.addListener) MQ.addListener(_onBreak); }

  window.addEventListener('ca:quota-ready', _syncSwitch);   // Back to Pro on the Free bar turns the preview off by itself
  window.addEventListener('ca:admin', function () {
    sidebar();
    if (!isAdmin()) {
      close();
      var p = document.getElementById('page-admin');
      if (p && p.classList.contains('active') && typeof showPage === 'function') showPage('setup');
      S.openN = null; S.sec = { today: {}, req: {}, rep: {}, err: {} }; S.totals = null; S.byId = {}; S.emails = {};
    }
  });
  function _init() { sidebar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _init); else _init();

  window.openAdmin = openAdmin;
  window._adminSidebar = sidebar;
  window.adminScreen = { close: close, refreshCount: refreshCount, ago: ago, SHIELD: SHIELD };
})();
