// Stage 5d (29 Oct): study reminders in the iOS app, as local notifications (no push server).
// Spec: docs/superpowers/specs/2026-10-29-ios-stage5d-study-reminders-design.md. Design: june-e2e @ ed2ab300 (HUD "5d ›").
// The plugins are reached only through window.caNative.reminders (native-shell.js). Nothing here runs on the website.
(function () {
  'use strict';
  var IR = window.iosReminders = window.iosReminders || {};

  // <planner>
  // Up to 7 reminders, one per local day at s.time, each with that day's most useful line:
  // the exam countdown (14 / 7 / 3 / 1 days), else the day's planned reviews, else the practice nudge.
  // Pure: everything it needs arrives in s and d. d.counts = getSrTodayPlan().counts (planned reviews, day 0 = today).
  function planReminders(now, s, d) {
    if (!s || !s.on) return [];
    var hm = String(s.time || '19:00').split(':'), hh = parseInt(hm[0], 10) || 0, mm = parseInt(hm[1], 10) || 0;
    var counts = (d && d.counts) || [], dte = d && typeof d.daysToExam === 'number' ? d.daysToExam : null;
    var cert = (d && d.certName) || 'CertAnvil', out = [];
    for (var k = 0; k < 7; k++) {
      if (k === 0 && d && d.studiedToday) continue;
      // local Date fields, so a clock-change week keeps the chosen hour
      var at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k, hh, mm, 0, 0);
      if (at.getTime() - now.getTime() < 60000) continue;
      var left = dte == null ? null : dte - k, n = counts[k] || 0, body;
      if (left === 1) body = 'Your ' + cert + ' exam is tomorrow. One last warm-up?';
      else if (left === 14 || left === 7 || left === 3) body = 'Your ' + cert + ' exam is in ' + left + ' days. A quick session keeps you on track.';
      else if (n === 1) body = '1 review card is due. About 2 minutes.';
      else if (n > 1) body = n + ' review cards are due. About ' + Math.max(2, Math.round(n * 0.5)) + ' minutes.';
      else body = d && d.pro ? 'Your daily practice is waiting.' : 'Your 15 questions for today are waiting.';
      out.push({ id: 5001 + k, at: at, title: 'CertAnvil', body: body });
    }
    return out;
  }
  // </planner>
  IR.plan = planReminders;

  // ── State: one Preferences key, app-wide (every cert subdomain sees the same reminders) ──
  var KEY = 'reminders';
  var DEFAULTS = { on: false, time: '19:00', asked: 'never', quizzes: 0, laterAtQuiz: null, lastStudiedDay: null };
  function N() { return window.caNative; }
  function active() { var n = N(); return !!(window.CA_NATIVE && n && n.reminders && n.reminders.ready() && n.get); }
  function localDay(dt) {   // local calendar date, never toISOString (a UTC day drifts from the person's day)
    dt = dt || new Date();
    return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
  }
  IR.localDay = localDay;
  IR.load = function () {
    if (!active()) return Promise.resolve(Object.assign({}, DEFAULTS));
    return N().get(KEY).then(function (v) {
      var o = {}; try { o = v ? JSON.parse(v) : {}; } catch (_) { o = {}; }
      return Object.assign({}, DEFAULTS, o);
    }, function () { return Object.assign({}, DEFAULTS); });
  };
  IR.save = function (patch) {
    return IR.load().then(function (st) {
      var next = Object.assign(st, patch || {});
      return active() ? N().set(KEY, JSON.stringify(next)).then(function () { return next; }) : next;
    });
  };

  // ── Rescheduling: replace the 7 reminders with a fresh plan. Serialised, never throws. ──
  function certName() {
    var p = window.CERT_PACK, n = (p && p.meta && p.meta.name) || '';   // the pack's name lives in meta
    return String(n).replace(/^(CompTIA|Microsoft|AWS)\s+/, '') || 'CertAnvil';
  }
  function isPro() {
    var q = window._quotaState;
    return !!((q && (q.tier === 'pro' || (typeof q.daily_limit === 'number' && q.daily_limit < 0))) || (document.body && document.body.classList.contains('is-pro-tier')));
  }
  function inputs(st) {
    var counts = [0, 0, 0, 0, 0, 0, 0], dte = null;
    try { var plan = typeof window.getSrTodayPlan === 'function' ? window.getSrTodayPlan() : null; if (plan && plan.counts) counts = plan.counts; } catch (_) {}
    try { dte = typeof window.getDaysToExam === 'function' ? window.getDaysToExam() : null; } catch (_) { dte = null; }
    return { counts: counts, daysToExam: typeof dte === 'number' && isFinite(dte) ? dte : null, certName: certName(), pro: isPro(), studiedToday: st.lastStudiedDay === localDay() };
  }
  function doReschedule() {
    if (!active()) return Promise.resolve();
    var R = N().reminders;
    return Promise.all([IR.load(), R.permission()]).then(function (a) {
      var st = a[0], perm = a[1];
      return R.cancelAll().then(function () {
        if (!st.on || perm !== 'granted') return;
        return R.schedule(planReminders(new Date(), st, inputs(st)));
      });
    });
  }
  var chain = Promise.resolve();
  IR.reschedule = function () {
    chain = chain.then(doReschedule).catch(function () {});
    return chain;
  };

  // A finished practice quiz or exam (ios-quiz / ios-exam results): count it, mark today studied, offer on the next Home.
  IR._offerPending = false;
  IR.onQuizFinished = function () {
    if (!active()) return Promise.resolve();
    IR._offerPending = true;   // set now: Home may show before the save below lands
    return IR.load().then(function (st) {
      return IR.save({ quizzes: (st.quizzes || 0) + 1, lastStudiedDay: localDay() });
    }).then(function () { return IR.reschedule(); }).catch(function () {});
  };

  // ── Time helpers: 'HH:MM' (stored) ↔ { h 1-12, m, ap } (the wheel) ↔ '7:00 pm' (shown) ──
  function toParts(t) {
    var hm = String(t || '19:00').split(':'), H = (parseInt(hm[0], 10) || 0) % 24, m = parseInt(hm[1], 10) || 0;
    return { h: H % 12 === 0 ? 12 : H % 12, m: m, ap: H < 12 ? 'am' : 'pm' };
  }
  function fromParts(p) { var H = (p.h % 12) + (p.ap === 'pm' ? 12 : 0); return ('0' + H).slice(-2) + ':' + ('0' + p.m).slice(-2); }
  function fmtTime(t) { var p = toParts(t); return p.h + ':' + ('0' + p.m).slice(-2) + ' ' + p.ap; }
  IR.fmtTime = fmtTime;

  // ── The time picker (approved drawing rem-time): hour, minute, am/pm wheels; Done calls back with 'HH:MM' ──
  var ICON = {
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.7 21a2 2 0 0 1-3.4 0"></path>',
    bolt: '<path d="M13 2L3 14h7l-1 8 10-12h-7z"></path>',
    redo: '<path d="M21 12a9 9 0 1 1-3-6.7"></path><path d="M21 4v4h-4"></path>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M3 9h18M8 3v4M16 3v4"></path>',
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    note: '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
    chev: '<path d="M9 6l6 6-6 6"></path>'
  };
  function svg(k, cls) { return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" aria-hidden="true">' + ICON[k] + '</svg>'; }
  function root() {
    var r = document.getElementById('irm-root');
    if (!r) { r = document.createElement('div'); r.id = 'irm-root'; document.body.appendChild(r); }
    return r;
  }
  IR.openTimePicker = function (time, onDone) {
    var r = root(), draft = toParts(time);
    var H = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], M = []; for (var i = 0; i < 60; i++) M.push(i);
    function col(key, vals, cur, label) {
      var at = vals.indexOf(cur), out = '';
      for (var k = -2; k <= 2; k++) {
        var j = at + k, v = vals[(j + vals.length) % vals.length];
        if (key === 'ap' && (j < 0 || j >= vals.length)) { out += '<button type="button" tabindex="-1" aria-hidden="true" style="visibility:hidden"></button>'; continue; }
        out += '<button type="button" class="d' + Math.abs(k) + '" data-k="' + key + '" data-v="' + v + '"' + (k === 0 ? ' aria-current="true"' : '') + '>' + (key === 'm' ? ('0' + v).slice(-2) : v) + '</button>';
      }
      return '<div class="irm-wcol" role="listbox" aria-label="' + label + '">' + out + '</div>';
    }
    var old = document.getElementById('irm-tsheet'); if (old) old.remove();
    var oldS = document.getElementById('irm-tscrim'); if (oldS) oldS.remove();
    r.insertAdjacentHTML('beforeend', '<div class="irm-tscrim" id="irm-tscrim"></div><div class="irm-tsheet" id="irm-tsheet" role="dialog" aria-modal="true" aria-labelledby="irm-ts-t">'
      + '<div class="irm-ts-head"><button class="irm-ts-btn" type="button" id="irm-ts-cancel">Cancel</button><h3 id="irm-ts-t">Reminder time</h3><button class="irm-ts-btn done" type="button" id="irm-ts-done">Done</button></div>'
      + '<div class="irm-wheel" id="irm-wheel"></div><p class="irm-ts-note">You can change it any time in Settings.</p></div>');
    var wheel = document.getElementById('irm-wheel'), sheet = document.getElementById('irm-tsheet'), scrim = document.getElementById('irm-tscrim');
    function draw() {
      wheel.innerHTML = col('h', H, draft.h, 'Hour') + col('m', M, draft.m, 'Minute') + col('ap', ['am', 'pm'], draft.ap, 'am or pm');
    }
    wheel.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('button[data-k]'); if (!b) return;
      var k = b.getAttribute('data-k'), v = b.getAttribute('data-v'); draft[k] = k === 'ap' ? v : +v; draw();
    });
    function close() { sheet.classList.remove('open'); scrim.classList.remove('open'); setTimeout(function () { sheet.remove(); scrim.remove(); }, 220); }
    document.getElementById('irm-ts-cancel').addEventListener('click', close);
    scrim.addEventListener('click', close);
    document.getElementById('irm-ts-done').addEventListener('click', function () { var t = fromParts(draft); close(); if (onDone) onDone(t); });
    draw();
    requestAnimationFrame(function () { sheet.classList.add('open'); scrim.classList.add('open'); });
  };

  // ── The ask (approved drawing rem-prime / rem-prime-pro): a sheet over Home after a finished quiz or exam ──
  function busy() {   // another sheet, the first-run picker or the sign-in screen is up: wait for the next Home
    var s = document.getElementById('ist-sheet'), c = document.documentElement.classList;
    return !!((s && s.classList.contains('open')) || c.contains('ifr-picking') || c.contains('ifr-check') || c.contains('isi-open') || c.contains('itr-open'));   // F3: or the first-Home tour
  }
  function primeHtml(st, pro) {
    var lede = pro ? 'A daily nudge for your practice and any reviews that are due, plus a heads-up as your exam gets close.'
                   : 'A daily nudge for your 15 questions and any reviews that are due, plus a heads-up as your exam gets close.';
    var nudge = pro ? 'One reminder a day for your practice, at the time you pick.' : 'One reminder a day for <b>your 15</b>, at the time you pick.';
    return '<div class="irm-grip"></div><div class="irm-hdr"><h1>Stay on track</h1></div><div class="irm-body">'
      + '<div class="irm-hero"><div class="irm-bell">' + svg('bell') + '</div><h2>Keep your streak going</h2><p>' + lede + '</p></div>'
      + '<ul class="irm-covers">'
      + '<li><span class="irm-ci">' + svg('bolt') + '</span><div><div class="irm-ct">A daily practice nudge</div><div class="irm-cs">' + nudge + '</div></div></li>'
      + '<li><span class="irm-ci">' + svg('redo') + '</span><div><div class="irm-ct">Daily Review when cards are due</div><div class="irm-cs">A quick ping when the cards you\'ve missed come back around, so nothing slips.</div></div></li>'
      + '<li><span class="irm-ci">' + svg('cal') + '</span><div><div class="irm-ct">An exam countdown</div><div class="irm-cs">A heads-up as <b>your exam</b> gets close, so the days don\'t sneak up on you.</div></div></li>'
      + '</ul>'
      + '<button class="irm-timerow" type="button" id="irm-time"><span class="irm-ci">' + svg('clock') + '</span><span class="irm-tl">Remind me at</span><span class="irm-tv" id="irm-time-val">' + fmtTime(st.time) + '</span>' + svg('chev', 'irm-chev') + '</button>'
      + '<div class="irm-quiet">' + svg('note') + '<span>One a day at most. Turn it off any time in Settings.</span></div>'
      + '</div><div class="irm-footer"><button class="irm-btn" type="button" id="irm-on">Turn on reminders</button><button class="irm-ghost" type="button" id="irm-later">Maybe later</button></div>';
  }
  function showPrime(st) {
    var r = root();
    r.innerHTML = '<div class="irm-scrim" id="irm-scrim"></div><div class="irm-sheet" id="irm-sheet" role="dialog" aria-modal="true" aria-label="Turn on reminders">' + primeHtml(st, isPro()) + '</div>';
    var sheet = document.getElementById('irm-sheet'), scrim = document.getElementById('irm-scrim'), time = st.time;
    function close() { sheet.classList.remove('open'); scrim.classList.remove('open'); setTimeout(function () { if (!sheet.classList.contains('open')) r.innerHTML = ''; }, 320); }
    document.getElementById('irm-time').addEventListener('click', function () {
      IR.openTimePicker(time, function (t) { time = t; document.getElementById('irm-time-val').textContent = fmtTime(t); IR.save({ time: t }); });
    });
    document.getElementById('irm-on').addEventListener('click', function () {
      var b = this; b.disabled = true;
      N().reminders.request().then(function (ans) {
        return IR.save(ans === 'granted' ? { on: true, asked: 'done', time: time } : { asked: 'done', time: time });
      }).then(function () { close(); return IR.reschedule(); }).catch(function () { close(); });
    });
    document.getElementById('irm-later').addEventListener('click', function () {
      IR.load().then(function (s) { return IR.save(s.asked === 'never' ? { asked: 'later', laterAtQuiz: s.quizzes || 0 } : { asked: 'done' }); }).then(close, close);
    });
    requestAnimationFrame(function () { scrim.classList.add('open'); sheet.classList.add('open'); });
  }
  // On Home: show the ask when a finished session is pending and the rules allow it (asked never, or a
  // "Maybe later" four finished sessions ago). iOS answering the prompt ends it for good.
  IR.maybeOffer = function () {
    if (!active() || !IR._offerPending || document.getElementById('irm-sheet')) return Promise.resolve();
    if (busy()) return Promise.resolve();   // stays pending for the next Home
    IR._offerPending = false;
    return Promise.all([IR.load(), N().reminders.permission()]).then(function (a) {
      var st = a[0], perm = a[1];
      if (st.asked === 'done') return;
      if (perm !== 'prompt') return IR.save({ asked: 'done' });
      if (!(st.asked === 'never' || (st.asked === 'later' && (st.quizzes || 0) >= (st.laterAtQuiz || 0) + 4))) return;
      if (busy() || document.getElementById('irm-sheet')) { IR._offerPending = true; return; }   // something opened meanwhile: next Home
      showPrime(st);
    }).catch(function () {});
  };

  // ── Settings → Reminders (features/ios-settings.js draws the row and sheet; the logic lives here) ──
  IR.rowShown = function () { return active(); };
  IR._label = null;
  IR.rowLabel = function () {
    if (!active()) return Promise.resolve('Off');
    return Promise.all([IR.load(), N().reminders.permission()]).then(function (a) { return a[0].on && a[1] === 'granted' ? fmtTime(a[0].time) : 'Off'; });
  };
  IR.refreshRow = function () {
    return IR.rowLabel().then(function (l) {
      IR._label = l;
      var el = document.querySelector('#ios-settings .ist-rmv'); if (el) el.textContent = l;
    }).catch(function () {});
  };
  IR.sheetModel = function () {
    return Promise.all([IR.load(), active() ? N().reminders.permission() : Promise.resolve('denied')]).then(function (a) {
      var st = a[0], perm = a[1];
      return { perm: perm, on: !!st.on && perm === 'granted', time: fmtTime(st.time), parts: toParts(st.time), canOpen: !!(N() && N().canOpenAppSettings && N().canOpenAppSettings()) };
    });
  };
  // Turning on asks iOS if it never has; a refusal leaves reminders off (the sheet then shows the denied state).
  IR.setOn = function (on) {
    if (!active()) return Promise.resolve();
    var R = N().reminders;
    var p = !on ? IR.save({ on: false }) : R.permission().then(function (perm) {
      if (perm === 'granted') return IR.save({ on: true });
      if (perm === 'prompt') return R.request().then(function (ans) { return IR.save(ans === 'granted' ? { on: true, asked: 'done' } : { asked: 'done' }); });
      return IR.save({ on: true });   // denied: stays effectively off until iOS allows it
    });
    return p.then(function () { return IR.reschedule(); }).then(function () { return IR.refreshRow(); }).catch(function () {});
  };
  IR.setTime = function (parts) {
    return IR.save({ time: fromParts(parts) }).then(function () { return IR.reschedule(); }).then(function () { return IR.refreshRow(); }).catch(function () {});
  };

  if (!window.CA_NATIVE) return;
  window.addEventListener('ca:home-shown', function () { IR.maybeOffer(); });
  window.addEventListener('ca:quiz-finished', function () { IR.onQuizFinished(); });
  window.addEventListener('ca:app-active', function () { IR.reschedule().then(function () { return IR.refreshRow(); }); });   // e.g. allowed in iPhone Settings
  window.addEventListener('ca:exam-date', function () { IR.reschedule(); });
  // At launch, once the page's data has loaded; again when the account's tier resolves (a Pro user's first plan may
  // have used the free line).
  function start() {
    setTimeout(function () { IR.reschedule(); }, 400);
    try {
      var body = document.body, seen = body.classList.contains('is-state-resolved');
      if (!seen && window.MutationObserver) {
        var mo = new MutationObserver(function () {
          if (body.classList.contains('is-state-resolved')) { mo.disconnect(); IR.reschedule(); }
        });
        mo.observe(body, { attributes: true, attributeFilter: ['class'] });
      }
    } catch (_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
