// features/ios-home.js — Lift A: the June CertAnvil E2E Home at phone width.
// Spec: docs/superpowers/specs/2026-10-19-ios-launch-june-design.md (Fidelity rule).
// Design: branch feat/cert-ios-e2e, mockups/cert-ios-home.html (+ the post-June additions).
// _iosHomeModel is pure (data in, plain object out) and self-contained: UAT runs its
// body in a bare vm sandbox, so every global it reads is typeof-guarded.
(function () {
  if (!window._certanvilFeatures) window._certanvilFeatures = {};

  function _iosHomeModel(now) {
    now = now || new Date();
    var has = function (f) { return typeof f === 'function'; };
    var history = [];
    try { history = (typeof loadHistory === 'function' ? loadHistory() : []) || []; } catch (_) { history = []; }
    var rows = history.filter(function (e) { return e && !(typeof isHistorySplitRow === 'function' && isHistorySplitRow(e)); });
    var isNew = rows.length === 0;
    var certId = (typeof CURRENT_CERT === 'string' && CURRENT_CERT) || 'netplus';
    var MARKS = { netplus: 'N+', secplus: 'S+', 'aplus-core1': 'A+', 'aplus-core2': 'A+', az900: 'AZ', ai900: 'AI', sc900: 'SC', clfc02: 'CLF' };
    var rawName = (typeof CERT_PACK === 'object' && CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.name) || 'CompTIA Network+';
    var cert = {
      mark: MARKS[certId] || 'CA',
      name: String(rawName).replace(/^(CompTIA|Microsoft|Amazon|AWS)\s+/, ''),
      code: (typeof CERT_CODE === 'string' && CERT_CODE) || 'N10-009'
    };
    var max = (typeof EXAM_MAX_SCORE === 'number') ? EXAM_MAX_SCORE : 900;
    var pass = (typeof EXAM_PASS_SCORE === 'number') ? EXAM_PASS_SCORE : 720;
    var days = null;
    try { days = (typeof getDaysToExam === 'function') ? getDaysToExam() : null; } catch (_) { days = null; }

    // ── greeting ──
    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var hr = now.getHours();
    var part = hr < 12 ? 'morning' : (hr < 17 ? 'afternoon' : 'evening');
    var greeting = isNew ? ('Welcome to ' + cert.name + '. Your first session sets the baseline.')
      : (DAYS[now.getDay()] + ' ' + part + '. Pick up where you left off.');

    // ── readiness ──
    var readiness = { score: null, max: max, pass: pass, tier: 'Locked', fillPct: 0, passPct: Math.round(pass / max * 1000) / 10,
      insight: 'Take a quiz to unlock your readiness score and a pass forecast.', meta: null };
    var r = null;
    if (!isNew) { try { r = (typeof getReadinessScore === 'function') ? getReadinessScore() : null; } catch (_) { r = null; } }
    if (r && typeof r.predicted === 'number') {
      readiness.score = r.predicted;
      readiness.fillPct = Math.round(Math.min(1, Math.max(0, r.predicted / max)) * 1000) / 10;
      readiness.tier = r.examReady ? 'Pass ready' : (r.passProbability >= 50 ? 'On track' : (r.passProbability >= 20 ? 'Close' : 'Behind'));
      readiness.insight = r.predicted >= pass ? 'Above the pass mark. Keep it there.' : ('About ' + (pass - r.predicted) + ' points to a pass.');
      if (typeof r.recentAccuracy === 'number') {
        var n = Math.min(200, r.recentAnswers || 200);
        readiness.meta = 'Last ' + n + ' answers: ' + r.recentAccuracy + '% right'
          + (typeof days === 'number' && days >= 0 ? (days === 0 ? ' · exam today' : ' · ' + days + (days === 1 ? ' day' : ' days') + ' to exam') : '');
      }
    }

    // ── recommended next: unfinished exam > reviews > first quiz > weak spots ──
    var rec = null;
    var ex = null;
    try { ex = JSON.parse((typeof localStorage !== 'undefined' && localStorage.getItem('nplus_exam_state')) || 'null'); } catch (_) { ex = null; }
    var t = now.getTime();
    if (ex && Array.isArray(ex.questions) && ex.questions.length && typeof ex.endTime === 'number'
        && (ex.paused ? (ex.savedAt || 0) > t - 7 * 86400000 : ex.endTime > t - 86400000)) {
      var left = ex.paused ? Math.max(1, Math.round((ex.timeLeft || 0) / 60)) : Math.max(0, Math.round((ex.endTime - t) / 60000));
      var answered = (typeof ex.answered === 'number') ? ex.answered : (ex.answers || []).filter(function (a) {
        return a && ((a.chosen !== null && a.chosen !== undefined) || (a.msChosen || []).length || (a.orderSeq || []).length || Object.keys(a.topoState || {}).length);
      }).length;
      var of = answered + ' of ' + ex.questions.length + ' answered. ';
      rec = { kind: 'exam', min: left, title: left > 0 ? 'Resume your exam' : 'Your exam time is up',
        sub: ex.paused ? of + 'Paused with ' + left + (left === 1 ? ' minute' : ' minutes') + ' left.'
          : (left > 0 ? of + 'The clock is still running.' : of + 'See your result.') };
    }
    var plan = null;
    try { plan = (typeof getSrTodayPlan === 'function') ? getSrTodayPlan() : null; } catch (_) { plan = null; }
    var due = plan && typeof plan.todo === 'number' ? plan.todo : 0;
    if (!rec && due > 0) {
      var spread = '';
      try { spread = (plan.later > 0 && typeof _srSpreadPhrase === 'function') ? (_srSpreadPhrase(plan.later, plan.spillDays, plan.carryLeft, 'rest') || '') : ''; } catch (_) { spread = ''; }
      rec = { kind: 'review', min: Math.max(2, Math.round(due * 0.5)), title: due === 1 ? 'Review 1 card' : 'Review ' + due + ' cards',
        sub: spread ? 'Spaced repetition. ' + spread.charAt(0).toUpperCase() + spread.slice(1) + '.' : 'Spaced repetition. Re-encounter what you forgot.' };
    }
    if (!rec && isNew) rec = { kind: 'first', min: 10, title: 'Start your first quiz', sub: '10 questions, easy mix, about 10 minutes.' };
    if (!rec) {
      var weakTopic = r && Array.isArray(r.whatIf) && r.whatIf[0] && r.whatIf[0].topic;
      rec = { kind: 'weak', min: 15, title: '15-min Weak Spots', sub: weakTopic ? '10 questions, exam level, on ' + weakTopic + '.' : '10 questions, exam level, your weakest topic.' };
    }

    // ── coming up: 7-day review plan (returning only) ──
    var week = null;
    if (!isNew && plan && Array.isArray(plan.counts)) {
      var SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      week = plan.counts.slice(0, 7).map(function (c, i) {
        var d = new Date(t + i * 86400000);
        return { label: i === 0 ? 'Today' : SHORT[d.getDay()], count: c || 0, isToday: i === 0, isExam: typeof days === 'number' && days >= 0 && days === i };
      });
    }

    // ── momentum ──
    var streak = { current: 0, best: 0 };
    try { streak = (typeof getStreak === 'function' ? getStreak() : streak) || streak; } catch (_) {}
    var cur = streak.current || 0, best = streak.best || 0;
    var done = 0, goal = 20;
    try { done = (typeof getTodayQuestionCount === 'function') ? getTodayQuestionCount() : 0; } catch (_) {}
    try { goal = (typeof getDailyGoal === 'function') ? getDailyGoal() : 20; } catch (_) {}
    var pick = null;
    if (!isNew) {
      try {
        var p = (typeof buildSessionPlan === 'function') ? buildSessionPlan(1) : null;
        if (p && p[0] && p[0].topic) {
          var meta = String(p[0].meta || p[0].reason || '');
          var m = meta.match(/~?(\d+)% accuracy/), st = meta.match(/(\d+)d stale/);
          pick = { topic: p[0].topic, detail: m ? 'around ' + m[1] + '% accuracy' : (st ? 'last seen ' + st[1] + ' days ago' : (/never/.test(meta) ? 'not studied yet' : '')) };
        }
      } catch (_) { pick = null; }
    }
    var momentum = { done: done, goal: goal, pick: pick,
      streakLine: cur > 0 ? cur + ' day streak, best is ' + best + '. One short session adds another.' : '0 day streak. Finish today to start one.' };

    // ── mistakes + domains ──
    var mistakes = 0;
    try { var bank = (typeof loadWrongBank === 'function') ? loadWrongBank() : []; mistakes = Array.isArray(bank) ? bank.length : 0; } catch (_) {}
    var weights = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS) || {};
    var labels = (typeof DOMAIN_LABELS === 'object' && DOMAIN_LABELS) || {};
    var td = (typeof TOPIC_DOMAINS === 'object' && TOPIC_DOMAINS) || {};
    var agg = {};
    Object.keys(weights).forEach(function (k) { agg[k] = { s: 0, n: 0 }; });
    rows.forEach(function (e) { var k = td[e.topic]; if (k && agg[k]) { agg[k].s += e.score || 0; agg[k].n += e.total || 0; } });
    var domains = Object.keys(weights).map(function (k) {
      return { key: k, name: labels[k] || k, weightPct: Math.round((weights[k] || 0) * 100),
        mastery: agg[k].n > 0 ? Math.round(agg[k].s / agg[k].n * 100) : 0, untouched: agg[k].n === 0 };
    });

    var native = false;
    try { native = !!(typeof document !== 'undefined' && document.documentElement && document.documentElement.classList.contains('is-native')); } catch (_) {}
    var signedIn = native || !!(typeof window !== 'undefined' && window._certanvilSignedIn);

    return { state: isNew ? 'new' : 'returning', signedIn: signedIn, cert: cert, streak: cur, greeting: greeting,
      readiness: readiness, rec: rec, week: week, momentum: momentum, mistakes: mistakes, domains: domains };
  }

  window._iosHomeModel = _iosHomeModel;
})();
