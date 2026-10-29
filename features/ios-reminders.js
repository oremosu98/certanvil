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
})();
