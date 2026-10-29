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
    var p = window.CERT_PACK, n = (p && (p.shortName || p.name)) || '';
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
    return IR.load().then(function (st) {
      IR._offerPending = true;
      return IR.save({ quizzes: (st.quizzes || 0) + 1, lastStudiedDay: localDay() });
    }).then(function () { return IR.reschedule(); }).catch(function () {});
  };

  if (!window.CA_NATIVE) return;
  window.addEventListener('ca:quiz-finished', function () { IR.onQuizFinished(); });
  window.addEventListener('ca:app-active', function () { IR.reschedule(); });
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
