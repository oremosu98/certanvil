// features/ios-hub.js: persona bundle Task 12: "My certs", the hub above any single cert.
// A phone-width lift of mockups/cert-ios-hub.html (30 Oct): Studying, Passed, Not started, and one folded
// "Unlock every cert with Pro" row on Free. Spec: docs/superpowers/specs/2026-10-30-my-certs-hub-design.md
// Opened from Home (the cert name) and from the exam-outcome flow ("See it in your hub").
// Reads only: per-cert readiness snapshots, exam dates and exam outcomes. Never writes user state.
(function () {
  'use strict';

  var MQ = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
  function isPhone() { return !!(MQ && MQ.matches); }

  // ── Pure model (UAT vm-testable; no DOM, no storage) ──
  var HUB_DAY = 86400000;
  var HUB_STALE_DAYS = 14;          // a snapshot older than this says so
  var HUB_SCALE_1000 = { az900: 1, ai900: 1, sc900: 1, clfc02: 1 };   // the Microsoft and AWS certs score out of 1000

  // "CompTIA A+ Core 1" -> "A+ Core 1"; "Microsoft Azure Fundamentals" -> "Azure Fundamentals". AWS stays: it is the brand.
  function _hubShort(name) { return String(name || '').replace(/^(CompTIA|Microsoft)\s+/, ''); }

  // whole days from today to a YYYY-MM-DD exam date (local midnight to local midnight); null when there is no usable date
  function _hubDays(iso, now) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]), t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((d.getTime() - t.getTime()) / HUB_DAY);
  }

  // whole days since a snapshot was computed; null when unknown
  function _hubAgeDays(iso, now) {
    if (!iso) return null;
    var t = new Date(iso).getTime();
    if (!isFinite(t)) return null;
    return Math.floor((now.getTime() - t) / HUB_DAY);
  }

  function _hubExamLine(days) {
    if (days === null || days < 0) return 'No date';   // none set, or the date has passed and nothing was logged
    if (days === 0) return 'Exam today';
    return 'Exam in ' + days + (days === 1 ? ' day' : ' days');
  }

  function _iosHubModel(o) {
    o = o || {};
    var certs = o.certs || [], snaps = o.snaps || {}, dates = o.dates || {}, outcomes = o.outcomes || {};
    var now = o.now instanceof Date ? o.now : new Date(o.now || Date.now());
    var cur = o.current, scale = o.scale || {};
    var studying = [], passed = [], notStarted = [], active = null;
    var passedCount = 0, nextExam = null;

    certs.forEach(function (c) {
      var id = c.id, snap = snaps[id] || null, oc = outcomes[id] || null;
      var isPassed = !!(oc && oc.outcome === 'passed');
      var hasSnap = !!(snap && typeof snap.score === 'number' && isFinite(snap.score));
      var days = _hubDays(dates[id], now);
      var max = HUB_SCALE_1000[id] ? 1000 : 900;
      if (id === cur && typeof scale.max === 'number') max = scale.max;
      var row = { id: id, name: _hubShort(c.name), code: c.code || '', glyph: c.glyph || '', max: max, score: hasSnap ? snap.score : null, days: days };
      if (isPassed) passedCount++;
      else if (days !== null && days >= 0 && (nextExam === null || days < nextExam)) nextExam = days;   // the soonest future date, only for certs still being studied

      if (id === cur) {   // the active cert gets the rich card, not a list row
        row.passed = isPassed;
        row.hasScore = hasSnap;
        row.pass = typeof scale.pass === 'number' ? scale.pass : (max === 1000 ? 700 : 720);
        row.min = typeof scale.min === 'number' ? scale.min : 100;
        row.sub = isPassed ? (oc && typeof oc.score === 'number' && isFinite(oc.score) ? 'Scored ' + oc.score : 'No score logged') : _hubExamLine(days);
        active = row;
        return;
      }
      if (!o.pro) return;   // Free sees one folded row instead of the library

      if (isPassed) {
        row.sub = oc && typeof oc.score === 'number' && isFinite(oc.score) ? 'Scored ' + oc.score : 'No score logged';
        row.scored = oc && typeof oc.score === 'number' && isFinite(oc.score) ? oc.score : null;
        passed.push(row);
      } else if (hasSnap) {
        var age = _hubAgeDays(snap.computed_at, now);
        row.stale = age !== null && age > HUB_STALE_DAYS;
        row.sub = _hubExamLine(days) + (row.stale ? ' · last studied ' + Math.floor(age / 7) + ' weeks ago' : '');
        studying.push(row);
      } else {
        row.sub = row.code;
        notStarted.push(row);
      }
    });

    // nearest exam first; no date (or a past one) last; the same day falls back to the registry order (stable)
    function key(r) { return r.days !== null && r.days >= 0 ? r.days : Infinity; }
    studying = studying.map(function (r, i) { return { r: r, i: i }; }).sort(function (a, b) {
      var ka = key(a.r), kb = key(b.r);
      if (ka === kb) return a.i - b.i;
      return ka < kb ? -1 : 1;
    }).map(function (x) { return x.r; });

    var freeRow = null;
    if (!o.pro) {
      var names = certs.filter(function (c) { return c.id !== cur; }).slice(0, 3).map(function (c) { return _hubShort(c.name); });
      var others = certs.filter(function (c) { return c.id !== cur; });
      freeRow = { title: 'Unlock every cert with Pro', list: names.join(', ') + (others.length > 3 ? ' and more' : '') };
    }
    // greeting: time of day from the local hour; the name only when we have one; the cards clause only when something is due
    var hr = now.getHours(), part = hr < 12 ? 'Morning' : (hr < 17 ? 'Afternoon' : 'Evening');
    // only a real profile name: auth falls back to the email's local part, so drop anything that matches it or carries a digit
    var rawName = String(o.name || '').trim(), nl = rawName.toLowerCase();
    var loc = String(o.email || '').split('@')[0].toLowerCase(), locFirst = loc.split(/[._+\-]+/)[0];
    var first = rawName.split(/[\s._]+/)[0];
    if (!first || nl === 'tester' || rawName.indexOf('@') !== -1 || /\d/.test(rawName) || (loc && (nl === loc || nl === locFirst))) first = '';
    else first = first.charAt(0).toUpperCase() + first.slice(1);
    var due = typeof o.due === 'number' && o.due > 0 ? Math.floor(o.due) : 0;
    var greeting = { lead: part + (first ? ', ' + first : '') + '.', bold: '', rest: '' };
    if (due && active) { greeting.bold = due + (due === 1 ? ' card' : ' cards'); greeting.rest = (due === 1 ? ' is' : ' are') + ' due on ' + active.name + '.'; }
    return {
      stats: { nextExamDays: nextExam, passed: passedCount, streak: o.streak || 0, readiness: active && active.hasScore ? active.score : null, due: due },
      greeting: greeting,
      active: active, studying: studying, passed: passed, notStarted: notStarted, freeRow: freeRow, pro: !!o.pro
    };
  }

  // ── Reads (never writes) ──
  function _readMap(key) {
    try { var m = JSON.parse(localStorage.getItem(key) || '{}'); return (m && typeof m === 'object' && !Array.isArray(m)) ? m : {}; }
    catch (_) { return {}; }
  }
  function _isPro() {
    try { return typeof _quotaState !== 'undefined' && !!_quotaState && (_quotaState.tier === 'pro' || (typeof _quotaState.daily_limit === 'number' && _quotaState.daily_limit < 0)); }
    catch (_) { return false; }
  }
  var _email = '', _emailAsked = false;
  function _askEmail() {   // the session email, so the greeting can tell a real name from the email fallback
    if (_emailAsked || !window.certanvilSupabase || !window.certanvilSupabase.auth) return;
    _emailAsked = true;
    window.certanvilSupabase.auth.getSession().then(function (r) {
      var u = r && r.data && r.data.session && r.data.session.user;
      _email = (u && u.email) || '';
      var root = document.getElementById('ios-hub');
      if (_email && root && !root.hidden) openHub();   // re-draw in place once
    }).catch(function () { _emailAsked = false; });
  }
  function _input() {
    var dates = {};
    try { dates = typeof window.getExamDates === 'function' ? (window.getExamDates() || {}) : {}; } catch (_) { dates = {}; }
    var streak = 0;
    try { streak = (typeof getStreak === 'function' && getStreak().current) || 0; } catch (_) { streak = 0; }
    var scale = {
      min: typeof EXAM_MIN_SCORE === 'number' ? EXAM_MIN_SCORE : undefined,
      max: typeof EXAM_MAX_SCORE === 'number' ? EXAM_MAX_SCORE : undefined,
      pass: typeof EXAM_PASS_SCORE === 'number' ? EXAM_PASS_SCORE : undefined
    };
    var name = '', due = 0;
    try { name = window._certanvilDisplayName || localStorage.getItem('certanvil_display_name_cache') || ''; } catch (_) { name = ''; }
    try { var plan = typeof getSrTodayPlan === 'function' ? getSrTodayPlan() : null; due = plan && typeof plan.todo === 'number' ? plan.todo : 0; } catch (_) { due = 0; }
    var certs = [];
    try { certs = typeof getAvailableCerts === 'function' ? getAvailableCerts() : []; } catch (_) { certs = []; }
    return {
      certs: certs, snaps: _readMap(STORAGE.READINESS_SNAPSHOTS), dates: dates, outcomes: _readMap(STORAGE.EXAM_OUTCOMES),
      current: (typeof CURRENT_CERT === 'string' && CURRENT_CERT) || 'netplus', pro: _isPro(), now: new Date(), streak: streak, scale: scale,
      name: name, due: due, email: _email
    };
  }

  // ── View ──
  function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>';
  var TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg>';
  var LOCK = '<svg class="ihb-ua" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>';
  var FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1.5 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.8-2.5C9 10 9 11 10 11.5 9.5 9 11 5.5 12 3z"></path></svg>';
  var GEAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L16.5 2h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5a7 7 0 0 0 .1-1z"></path></svg>';
  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>';

  function _html(m, suggest) {
    var n = 0;
    function rv() { var d = Math.min(n++, 9); return ' ihb-rv" style="--d:' + d + '"'; }
    function sect(label, count) { return '<div class="ihb-sect' + rv() + '><b>' + _esc(label) + '</b><span class="ihb-count">' + _esc(count) + '</span></div>'; }
    function row(r, kind) {
      var right;
      if (kind === 'passed') right = '<span class="ihb-state">' + TICK + 'Passed</span><span class="ihb-score">' + (r.scored != null ? 'Scored <b>' + _esc(r.scored) + '</b>' : 'No score logged') + '</span>';
      else if (kind === 'fresh') right = '<span class="ihb-state">Start ' + CHEV + '</span>';
      else right = '<span class="ihb-state">Open ' + CHEV + '</span><span class="ihb-score"><b>' + _esc(r.score) + '</b> / ' + _esc(r.max) + '</span>';
      var sub = kind === 'passed' ? _esc(r.code) : (kind === 'fresh' ? _esc(r.code) : _esc(r.sub));
      return '<button class="ihb-row ihb-' + kind + (r.stale ? ' ihb-stale' : '') + rv() + ' type="button" data-act="open-cert" data-id="' + _esc(r.id) + '">'
        + '<span class="ihb-mark' + (kind === 'passed' ? ' ihb-is-pass' : '') + '">' + _esc(r.glyph) + '</span>'
        + '<span class="ihb-meta"><span class="ihb-nm">' + _esc(r.name) + '</span><span class="ihb-cd' + (kind === 'studying' ? ' ihb-ex' : '') + '">' + sub + '</span></span>'
        + '<span class="ihb-right">' + right + '</span></button>';
    }

    var s = m.stats, a = m.active;
    var h = '<div class="ihb-hdr"><button class="ihb-back" type="button" data-act="back" aria-label="Back">' + CHEV.replace('M9 6l6 6-6 6', 'M15 18l-6-6 6-6') + '</button>'
      + '<h1 class="ihb-h1" tabindex="-1">My certs</h1>'
      + '<button class="ihb-theme" type="button" data-act="theme" aria-label="Switch between light and dark">' + SUN + '</button></div>'
      + '<div class="ihb-body">';

    var g = m.greeting;
    h += '<p class="ihb-greet' + rv() + '>' + _esc(g.lead) + (g.bold ? ' <b>' + _esc(g.bold) + '</b>' + _esc(g.rest) : '') + '</p>';
    var flame = '<div class="ihb-stat"><b class="ihb-flame">' + FLAME + _esc(s.streak) + '</b><span>Day streak</span></div>';
    if (m.pro) {
      h += '<div class="ihb-stats' + rv() + '>'
        + '<div class="ihb-stat"><b>' + (s.nextExamDays === null ? '<small>None set</small>' : _esc(s.nextExamDays) + '<small> ' + (s.nextExamDays === 1 ? 'day' : 'days') + '</small>') + '</b><span>Next exam</span></div>'
        + '<div class="ihb-stat ihb-pass"><b>' + _esc(s.passed) + '</b><span>Passed</span></div>' + flame + '</div>';
    } else {
      h += '<div class="ihb-stats' + rv() + '>'
        + '<div class="ihb-stat"><b>' + (s.readiness === null ? '<small>None yet</small>' : _esc(s.readiness)) + '</b><span>Readiness</span></div>'
        + '<div class="ihb-stat"><b>' + _esc(s.due) + '</b><span>Due today</span></div>' + flame + '</div>';
    }

    h += sect(m.pro ? 'My certs' : 'Your cert', m.pro ? 'all certs' : 'Free plan');
    if (a) {
      var pct = a.hasScore ? Math.max(0, Math.min(100, Math.round((a.score - a.min) / (a.max - a.min) * 100))) : 0;
      var tick = Math.max(0, Math.min(100, Math.round((a.pass - a.min) / (a.max - a.min) * 100)));
      h += '<div class="ihb-active' + (a.passed ? ' ihb-done' : '') + rv() + '>'
        + '<div class="ihb-ac-top"><span class="ihb-mark' + (a.passed ? ' ihb-is-pass' : '') + '">' + _esc(a.glyph) + '</span>'
        + '<span class="ihb-meta"><span class="ihb-nm">' + _esc(a.name) + '</span><span class="ihb-cd">' + _esc(a.code) + '</span></span>'
        + '<span class="ihb-badge">' + (a.passed ? 'Passed' : 'Active') + '</span></div>';
      if (a.passed) h += '<p class="ihb-ac-line">' + _esc(a.sub) + '</p>';
      else if (a.hasScore) {
        h += '<div class="ihb-ac-score"><span class="ihb-num">' + _esc(a.score) + '</span><span class="ihb-of">/ ' + _esc(a.max) + ' readiness</span></div>'
          + '<div class="ihb-bar"><span style="width:' + pct + '%"></span><span class="ihb-tick" style="left:' + tick + '%"></span></div>'
          + '<div class="ihb-legend"><span>' + _esc(a.min) + '</span><span class="ihb-p">Pass ' + _esc(a.pass) + '</span><span>' + _esc(a.max) + '</span></div>'
          + (m.pro ? '<p class="ihb-ac-line">' + _esc(a.sub) + '</p>' : '');
      } else h += '<p class="ihb-ac-line">No readiness yet. Your first quiz sets the baseline.</p>';
      h += '<button class="ihb-primary" type="button" data-act="continue">' + (a.passed ? 'Review ' : 'Continue ') + _esc(a.name) + '</button>'
        + (a.passed ? '' : '<button class="ihb-logresult" type="button" data-act="log">Took your exam? Log your result</button>')
        + '</div>';
    }

    if (m.freeRow) {
      h += sect('Other certs', 'Pro');
      h += '<button class="ihb-row ihb-locked' + rv() + ' type="button" data-act="unlock"><span class="ihb-mark">' + LOCK + '</span>'
        + '<span class="ihb-meta"><span class="ihb-nm">' + _esc(m.freeRow.title) + '</span><span class="ihb-cd ihb-ua-list">' + _esc(m.freeRow.list) + '</span></span>'
        + '<span class="ihb-right"><span class="ihb-pill">Pro</span></span></button>';
    } else {
      if (m.studying.length) { h += sect('Studying', m.studying.length + ' · nearest exam first'); m.studying.forEach(function (r) { h += row(r, 'studying'); }); }
      if (m.passed.length) { h += sect('Passed', String(m.passed.length)); m.passed.forEach(function (r) { h += row(r, 'passed'); }); }
      if (m.notStarted.length) { h += sect('Not started', String(m.notStarted.length)); m.notStarted.forEach(function (r) { h += row(r, 'fresh'); }); }
      if (suggest) h += '<button class="ihb-suggest' + rv() + ' type="button" data-act="suggest">Don\'t see yours? Suggest a cert</button>';   // Task 14 hook: openSuggestCert
    }

    var links = !!document.querySelector('.lift-tab[data-page="settings"]') || typeof showPage === 'function';
    if (links) h += sect('More', '');
    var ACC = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg>';
    function link(act, icon, t, sub) { return '<button class="ihb-link" type="button" data-act="' + act + '"><span class="ihb-li">' + icon + '</span><span class="ihb-lt"><b>' + t + '</b><span>' + sub + '</span></span><span class="ihb-lg">' + CHEV + '</span></button>'; }
    if (links) h += '<div class="ihb-links' + rv() + '>' + link('settings', GEAR, 'Settings', 'Theme, notifications, daily review size') + link('account', ACC, 'Account', 'Sign-in, subscription, plan') + '</div>';
    return h + '</div>';
  }

  // ── Overlay: host, inert-behind, focus restore (same pattern as ios-log-result.js) ──
  var _prevFocus = null, _host = null, _inerted = [];
  function _inertBehind(on) {
    if (on) {
      [].forEach.call(document.body.children, function (el) {
        if (el === _host || el.id === 'ios-log-result' || el.id === 'pro-only-modal' || (el.classList && el.classList.contains('il-toast')) || el.inert) return;
        el.inert = true; _inerted.push(el);
      });
    } else { _inerted.forEach(function (el) { el.inert = false; }); _inerted = []; }
  }
  function _ensureHost() {
    if (_host && document.body.contains(_host)) return _host;
    _host = document.getElementById('ios-hub');
    if (!_host) { _host = document.createElement('section'); _host.id = 'ios-hub'; _host.hidden = true; document.body.appendChild(_host); }
    _host.setAttribute('role', 'dialog'); _host.setAttribute('aria-modal', 'true'); _host.setAttribute('aria-label', 'My certs');
    return _host;
  }
  function _onKey(ev) {
    if (ev.key !== 'Escape' || ev.defaultPrevented || document.getElementById('pro-only-modal')) return;   // a layer above already took this Escape
    var lr = document.getElementById('ios-log-result');
    if (lr && !lr.hidden) return;   // the log screen sits on top and closes itself
    _close();
  }
  function _close() {
    var root = document.getElementById('ios-hub'); if (!root || root.hidden) return;
    document.removeEventListener('keydown', _onKey);
    _inertBehind(false);   // un-inert first, so focus can land back on Home
    root.hidden = true; root.innerHTML = '';
    if (_prevFocus && _prevFocus.focus) { try { _prevFocus.focus(); } catch (_) {} }
    _prevFocus = null;
  }

  function _tab(p) {
    var b = document.querySelector('.lift-tab[data-page="' + p + '"]');
    if (b) b.click(); else if (typeof showPage === 'function') showPage(p);
  }

  function openHub() {
    if (!isPhone()) return false;
    var root = _ensureHost(), wasOpen = !root.hidden;
    _askEmail();
    var m = _iosHubModel(_input());
    if (!wasOpen) _prevFocus = document.activeElement;   // an in-place refresh keeps the original return target
    var suggest = typeof openSuggestCert === 'function';
    root.innerHTML = _html(m, suggest);
    root.hidden = false;
    if (!wasOpen) _inertBehind(true);
    root.onclick = function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'back' || act === 'continue') _close();
      else if (act === 'theme') { if (typeof toggleTheme === 'function') toggleTheme(); }
      else if (act === 'log') { b.focus(); if (typeof openLogResult === 'function') openLogResult({ preselect: null }); }
      else if (act === 'settings' || act === 'account') { _close(); _tab('settings'); }
      else if (act === 'suggest') { if (typeof openSuggestCert === 'function') openSuggestCert(); }
      else if (act === 'unlock') {
        if (typeof _showProOnlyUI === 'function') _showProOnlyUI({ feature: 'Every cert', title: 'Every cert comes with Pro',
          body: 'You’re studying <b>' + _esc(m.active ? m.active.name : 'your cert') + '</b>. Pro adds every other exam, and your progress here stays exactly where it is.' });
      }
      else if (act === 'open-cert') {
        var id = b.getAttribute('data-id');
        var ok = typeof window.tadSwitchCert === 'function' ? window.tadSwitchCert(id) : false;
        if (ok !== false) _close();   // false = gated or invalid (the Pro sheet is already up); anything else is a switch under way
      }
    };
    if (!wasOpen) document.addEventListener('keydown', _onKey);   // on document: focus can sit on body after a sheet closes
    if (!wasOpen) { var h1 = root.querySelector('.ihb-h1'); if (h1) h1.focus(); }
    return true;
  }

  window._iosHubModel = _iosHubModel;
  window.openHub = openHub;
  window.iosHub = { close: _close };
})();
