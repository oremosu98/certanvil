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
    var re = (typeof window !== 'undefined' && window.CertRegistry) ? window.CertRegistry.get(certId) : null;
    var rawName = (typeof CERT_PACK === 'object' && CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.name) || 'CompTIA Network+';
    var cert = {
      mark: re ? re.mark : 'CA',
      name: String(rawName).replace(/^(CompTIA|Microsoft|Amazon|AWS)\s+/, ''),
      code: (typeof CERT_CODE === 'string' && CERT_CODE) || 'N10-009'
    };
    var max = (typeof EXAM_MAX_SCORE === 'number') ? EXAM_MAX_SCORE : 900;
    var pass = (typeof EXAM_PASS_SCORE === 'number') ? EXAM_PASS_SCORE : 720;
    var fmt = (typeof EXAM_SCORE_FORMAT === 'string' && EXAM_SCORE_FORMAT === 'percent') ? 'percent' : 'scaled';   // percent certs read '72%'
    var days = null;
    try { days = (typeof getDaysToExam === 'function') ? getDaysToExam() : null; } catch (_) { days = null; }

    // ── greeting ──
    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var hr = now.getHours();
    var part = hr < 12 ? 'morning' : (hr < 17 ? 'afternoon' : 'evening');
    var greeting = isNew ? ('Welcome to ' + cert.name + '. Your first session sets the baseline.')
      : (DAYS[now.getDay()] + ' ' + part + '. Pick up where you left off.');

    // ── readiness ──
    var readiness = { score: null, fmt: fmt, max: max, pass: pass, tier: 'Locked', fillPct: 0, passPct: Math.round(pass / max * 1000) / 10,
      insight: 'Take a quiz to unlock your readiness score and a pass forecast.', meta: null };
    var r = null;
    if (!isNew) { try { r = (typeof getReadinessScore === 'function') ? getReadinessScore() : null; } catch (_) { r = null; } }
    if (r && typeof r.predicted === 'number') {
      readiness.score = r.predicted;
      readiness.fillPct = Math.round(Math.min(1, Math.max(0, r.predicted / max)) * 1000) / 10;
      // Ready = the book-it checklist at 4 of 4. At or above the pass mark without it: "Pass level" plus the next step.
      var bi = null;
      try { bi = (typeof getBookItChecklist === 'function') ? getBookItChecklist(r, (typeof loadHistory === 'function') ? loadHistory() : []) : null; } catch (_) { bi = null; }
      var ready = bi ? bi.ready : !!r.examReady;
      readiness.tier = ready ? 'Exam ready' : (r.predicted >= pass ? 'Pass level' : (r.passProbability >= 0.5 ? 'On track' : (r.passProbability >= 0.2 ? 'Close' : 'Behind')));
      readiness.insight = r.predicted >= pass ? 'Above the pass mark. Keep it there.' : ('About ' + (pass - r.predicted) + ' points to a pass.');
      var step = (!ready && r.predicted >= pass && bi && typeof getBookItNextStep === 'function') ? getBookItNextStep(bi) : null;
      if (step) readiness.book = { label: 'Before you book · ' + bi.met + ' of 4', step: step + '.' };
      if (typeof r.recentAccuracy === 'number') {
        var n = Math.min(200, r.recentAnswers || 200);
        readiness.meta = 'Last ' + n + ' answers: ' + r.recentAccuracy + '% right'
          + (typeof days === 'number' && days >= 0 ? (days === 0 ? ' · exam today' : ' · ' + days + (days === 1 ? ' day' : ' days') + ' to exam') : '');
      }
    }

    // ── one next step: exam > quiz > reviews > outcome > nextcert (once passed) > first quiz > warmup > weak spots ──
    // The producers of quizResumeState / outcomeDue (and the openers) land in later tasks; a missing one
    // simply means that card never appears and the rec falls through.
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
    // a practice quiz the app closed in the middle of
    if (!rec && has(typeof quizResumeState === 'function' ? quizResumeState : null)) {
      var qs = null;
      try { qs = quizResumeState(); } catch (_) { qs = null; }
      if (qs) {
        var qTotal = qs.total || 0, qDone = qs.answered || 0, qLeft = (typeof qs.left === 'number') ? qs.left : Math.max(0, qTotal - qDone);
        var qTopic = qs.topicLabel || '';
        rec = (qs.ready || qLeft === 0)   // every question answered, results never opened: Resume lands on the last one
          ? { kind: 'quiz', kick: 'Pick up where you left off', badge: null, unit: null, icon: 'tick', title: 'See your results',
            sub: (qTopic ? qTopic + ' · ' : '') + 'all ' + qTotal + ' answered' }
          : { kind: 'quiz', kick: 'Pick up where you left off', badge: String(qLeft), unit: 'LEFT', title: 'Finish your quiz · ' + qLeft + ' left',
            sub: (qTopic ? qTopic + ' · ' : '') + qDone + ' of ' + qTotal + ' answered' };
      }
    }
    var plan = null;
    try { plan = (typeof getSrTodayPlan === 'function') ? getSrTodayPlan() : null; } catch (_) { plan = null; }
    var due = plan && typeof plan.todo === 'number' ? plan.todo : 0;
    // passed: read the saved outcome for this cert straight from the synced map
    var outcomeRec = null;
    try { var om = JSON.parse((typeof localStorage !== 'undefined' && localStorage.getItem('nplus_exam_outcomes')) || 'null'); outcomeRec = om && om[certId] || null; } catch (_) { outcomeRec = null; }
    var passedCert = !!(outcomeRec && outcomeRec.outcome === 'passed');
    if (!rec && due > 0) {
      var spread = '';
      try { spread = (plan.later > 0 && typeof _srSpreadPhrase === 'function') ? (_srSpreadPhrase(plan.later, plan.spillDays, plan.carryLeft, 'rest') || '') : ''; } catch (_) { spread = ''; }
      rec = { kind: 'review', min: Math.max(2, Math.round(due * 0.5)), title: due === 1 ? 'Review 1 card' : 'Review ' + due + ' cards',
        sub: spread ? 'Spaced repetition. ' + spread.charAt(0).toUpperCase() + spread.slice(1) + '.' : 'Spaced repetition. Re-encounter what you forgot.' };
    }
    if (!rec && has(typeof outcomeDue === 'function' ? outcomeDue : null)) {
      var od = false;
      try { od = !!outcomeDue(certId); } catch (_) { od = false; }
      if (od) {
        var ago = null;
        try {
          var xd = (typeof getExamDate === 'function') ? getExamDate(certId) : null, xp = xd && String(xd).split('-');
          if (xp && xp.length === 3) { var nw = new Date(t); ago = Math.round((new Date(nw.getFullYear(), nw.getMonth(), nw.getDate()) - new Date(+xp[0], +xp[1] - 1, +xp[2])) / 86400000); }
        } catch (_) { ago = null; }
        rec = { kind: 'outcome', kick: ago === 1 ? 'Your exam was yesterday' : (ago > 1 ? 'Your exam was ' + ago + ' days ago' : 'Your exam date has passed'),
          title: 'How did your ' + cert.name + ' exam go?', sub: "Tell us and we'll update your plan." };
      }
    }
    if (!rec && passedCert) {
      rec = { kind: 'nextcert', kick: cert.name + ' passed' + (typeof outcomeRec.score === 'number' ? ' · scored ' + outcomeRec.score + (fmt === 'percent' ? '%' : '') : ''), title: 'Pick your next cert',
        sub: (typeof outcomeRec.predicted === 'number' ? 'We predicted ' + outcomeRec.predicted + (fmt === 'percent' ? '%' : '') + ' on exam day. ' : '') + 'Your streak carries on with your next cert.' };
    }
    if (!rec && isNew) rec = { kind: 'first', min: 10, title: 'Start your first quiz', sub: '10 questions, easy mix, about 10 minutes.' };
    // days since the last study day (local midnights, so DST and time of day never matter)
    var away = 0;
    if (!isNew) {
      var newest = 0;
      rows.forEach(function (e) { var d = new Date(e.date).getTime(); if (d > newest) newest = d; });
      if (newest) {
        var nd = new Date(newest), nn = new Date(t);
        away = Math.round((new Date(nn.getFullYear(), nn.getMonth(), nn.getDate()) - new Date(nd.getFullYear(), nd.getMonth(), nd.getDate())) / 86400000);
      }
    }
    if (!rec && away >= 2 && due === 0) rec = { kind: 'warmup', min: 5, title: '5-min Warmup', sub: 'Ease back in. 5 questions, foundational.' };
    // the weakest topic to pick up, from the session plan (names the weak-spot card)
    var pick = null;
    if (!isNew) {
      try {
        var p = (typeof buildSessionPlan === 'function') ? buildSessionPlan(1) : null;
        if (p && p[0] && p[0].topic) {
          var meta = String(p[0].meta || p[0].reason || '');
          var m = meta.match(/~?(\d+)% accuracy/), st = meta.match(/(\d+)d stale/);
          pick = { topic: p[0].topic, pct: m ? +m[1] : null, detail: m ? 'around ' + m[1] + '% accuracy' : (st ? 'last seen ' + st[1] + ' days ago' : (/never/.test(meta) ? 'not studied yet' : '')) };
        }
      } catch (_) { pick = null; }
    }
    if (!rec) {
      var weakTopic = (pick && pick.topic) || (r && Array.isArray(r.whatIf) && r.whatIf[0] && r.whatIf[0].topic);
      var weakPct = pick && pick.topic && pick.pct != null ? ' (around ' + pick.pct + '%)' : '';
      rec = { kind: 'weak', min: 15, title: '15-min Weak Spots', sub: weakTopic ? '10 questions, exam level, on ' + weakTopic + weakPct + '.' : '10 questions, exam level, your weakest topic.' };
    }

    // ── coming up: 7-day review plan (returning only) ──
    var week = null;
    if (!isNew && plan && Array.isArray(plan.counts) && plan.counts.slice(0, 7).some(function (c) { return c > 0; })) {
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
    var ymd = function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
    var studiedToday = done > 0 || (!!streak.last && (streak.last === ymd(now) || streak.last === now.toISOString().slice(0, 10)));
    var streakLine = streak.ended ? 'Your ' + (streak.endedFrom || best) + '-day streak ended. Your best is ' + best + '. A quick set starts a new one.'
      : (cur > 0 ? cur + '-day streak. ' + (studiedToday ? "Today's done." : 'Study today to keep it.')
        : 'No streak yet. Finish a set today to start one.');
    var momentum = { done: done, goal: goal, streakLine: streakLine, ended: !!streak.ended, best: best, studiedToday: !!studiedToday, cur: cur };

    // ── mistakes + domains ──
    var mistakes = 0;
    try { var bank = (typeof loadWrongBank === 'function') ? loadWrongBank() : []; mistakes = Array.isArray(bank) ? bank.length : 0; } catch (_) {}
    var weights = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS) || {};
    var labels = (typeof DOMAIN_LABELS === 'object' && DOMAIN_LABELS) || {};
    var td = (typeof TOPIC_DOMAINS === 'object' && TOPIC_DOMAINS) || {};
    var agg = {};
    Object.keys(weights).forEach(function (k) { agg[k] = { s: 0, n: 0 }; });
    // Every row, like the desktop bento: Mixed sessions and exams keep their per-topic data only
    // in split rows (summary rows carry topic 'Mixed', which maps to no domain).
    history.forEach(function (e) { var k = e && td[e.topic]; if (k && agg[k]) { agg[k].s += e.score || 0; agg[k].n += e.total || 0; } });
    var domains = Object.keys(weights).map(function (k) {
      return { key: k, name: labels[k] || k, weightPct: Math.round((weights[k] || 0) * 100),
        mastery: agg[k].n > 0 ? Math.round(agg[k].s / agg[k].n * 100) : 0, untouched: agg[k].n === 0 };
    });

    // Stage 5b: the iOS app can be used signed out (Get started), so its Home shows Sign in like the web.
    var signedIn = !!(typeof window !== 'undefined' && window._certanvilSignedIn);

    var exam = { qs: (typeof EXAM_QUESTION_COUNT === 'number') ? EXAM_QUESTION_COUNT : 90,
      mins: Math.round(((typeof EXAM_TIME_SECONDS === 'number') ? EXAM_TIME_SECONDS : 5400) / 60),
      min: (typeof EXAM_MIN_SCORE === 'number') ? EXAM_MIN_SCORE : 100, max: max, fmt: fmt };

    return { state: isNew ? 'new' : 'returning', signedIn: signedIn, cert: cert, passed: passedCert, streak: cur, greeting: greeting, exam: exam,
      readiness: readiness, rec: rec, week: week, momentum: momentum, mistakes: mistakes, domains: domains };
  }


  // ── View: the June E2E Home markup (mockups/cert-ios-home.html), classes prefixed ih-
  // so the app's global .opt/.bar/.rec rules can never leak in. Pure: model in, HTML out.
  function _iosHomeHtml(m) {
    var e = function (s) { return escHtml(String(s == null ? '' : s)); };
    var I = {
      chev: '<path d="M9 6l6 6-6 6"></path>',
      down: '<path d="M6 9l6 6 6-6"></path>',
      flame: '<path d="M12 3c1.5 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.8-2.5C9 10 9 11 10 11.5 9.5 9 11 5.5 12 3z"></path>',
      gear: '<circle cx="12" cy="12" r="3"></circle><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L16.5 2h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5a7 7 0 0 0 .1-1z"></path>',
      sun: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>',
      moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>',
      bolt: '<path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z"></path>',
      star: '<path d="M12 2l2.4 6.9H22l-6 4.6 2.3 7L12 16.9 5.7 20.5l2.3-7-6-4.6h7.6L12 2z"></path>',
      warn: '<path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path>',
      search: '<circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.3-4.3"></path>',
      lines3: '<path d="M4 6h16M4 12h16M4 18h10"></path>',
      lines4: '<path d="M4 6h16M4 12h16M4 18h16"></path>',
      check: '<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>',
      clock: '<circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2.5 2.5M9 2h6"></path>',
      chart: '<path d="M3 3v18h18"></path><path d="M7 14l3-4 3 3 5-7"></path>',
      sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"></path>',
      arrow: '<path d="M5 12h14M13 6l6 6-6 6"></path>',
      tick: '<path d="M20 6L9 17l-5-5"></path>'   // the results screen's tick (ios-quiz.js CHECK)
    };
    var svg = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; };
    var light = (typeof document !== 'undefined' && document.documentElement && document.documentElement.getAttribute('data-theme') === 'light');
    var opt = function (act, icon, title, sub, meta, extra) {
      return '<button class="ih-opt' + (extra || '') + '" type="button" data-act="' + act + '"><span class="ih-oi">' + svg(icon) + '</span>'
        + '<span class="ih-ot"><b>' + e(title) + '</b><span>' + e(sub) + '</span></span><span class="ih-om">' + e(meta) + '</span>'
        + '<span class="ih-og">' + svg('chev') + '</span></button>';
    };
    var acc = function (icon, title, sub, inner) {
      return '<div class="ih-acc ih-reveal" data-acc><button class="ih-acc-head" type="button" aria-expanded="false"><span class="ih-acc-ic">' + svg(icon) + '</span>'
        + '<span class="ih-acc-ttl"><b>' + e(title) + '</b><span>' + e(sub) + '</span></span><span class="ih-acc-chev">' + svg('down') + '</span></button>'
        + '<div class="ih-acc-panel"><div class="ih-acc-inner"><div class="ih-acc-pad">' + inner + '</div></div></div></div>';
    };
    var r = m.readiness, ex = m.exam || { qs: 90, mins: 90, min: 100, max: r.max || 900 };
    var h = '';
    // top bar
    h += '<div class="ih-topbar"><span class="ih-tb-mark">' + e(m.cert.mark) + '</span>'
      + '<button class="ih-tb-name" type="button" data-act="cert"><b>' + e(m.cert.name) + (m.passed ? '<span class="ih-tb-passed">Passed</span>' : '') + '</b><span>' + e(m.cert.code) + '</span></button>'
      + (m.signedIn ? '<span class="ih-tb-streak' + (m.streak ? '' : ' ih-zero') + '">' + svg('flame') + e(m.streak) + '</span>'
        : '<button class="ih-tb-signin" data-act="signin" type="button">Sign in</button>')
      + '<button class="ih-tb-set" type="button" data-act="settings" aria-label="Settings">' + svg('gear') + '</button>'
      + '<button class="ih-app-theme" type="button" data-act="theme" aria-label="Switch theme">' + svg(light ? 'moon' : 'sun') + '</button></div>';
    h += '<div class="ih-body">';
    h += '<p class="ih-greeting ih-reveal">' + e(m.greeting) + '</p>';
    // readiness
    if (r.score === null) {
      h += '<div class="ih-rd ih-locked ih-reveal"><div class="ih-rd-top"><span class="ih-rd-eyebrow">Readiness</span><span class="ih-rd-tier ih-locked">Locked</span></div>'
        + '<div class="ih-rd-score"><span class="ih-rd-num">--</span><span class="ih-rd-of">' + (r.fmt === 'percent' ? '' : '/ ' + e(r.max)) + '</span></div><div class="ih-bar"></div>'
        + '<p class="ih-rd-insight">' + e(r.insight) + '</p>'
        + (m.signedIn ? '<button class="ih-rd-check" type="button" data-act="check">Or take the 30-second check' + svg('chev') + '</button>' : '') + '</div>';   // 30 Oct: the check after Skip
    } else {
      h += '<div class="ih-rd ih-reveal' + (r.tier === 'Exam ready' ? ' ih-passed' : '') + '" data-act="readiness" role="button" tabindex="0">'
        + '<div class="ih-rd-top"><span class="ih-rd-eyebrow">Readiness</span><span class="ih-rd-tier' + (r.tier === 'Close' ? ' ih-close' : (r.tier === 'Behind' ? ' ih-behind' : '')) + '">' + e(r.tier) + '</span></div>'
        + '<div class="ih-rd-score"><span class="ih-rd-num">' + e(r.score) + (r.fmt === 'percent' ? '%' : '') + '</span><span class="ih-rd-of">' + (r.fmt === 'percent' ? '' : '/ ' + e(r.max)) + '</span></div>'
        + '<div class="ih-bar"><span style="width:' + r.fillPct + '%"></span><span class="ih-tick" style="left:' + r.passPct + '%"></span></div>'
        + '<div class="ih-rd-legend"><span>Now</span><span class="ih-p">Pass ' + e(r.pass) + (r.fmt === 'percent' ? '%' : '') + '</span></div>'
        + (r.book ? '<div class="ih-rd-book"><span class="ih-rd-book-k">' + e(r.book.label) + '</span><p class="ih-rd-book-s">' + e(r.book.step) + '</p></div>'
          : '<p class="ih-rd-insight">' + e(r.insight) + '</p>')
        + (r.meta ? '<p class="ih-rd-meta">' + e(r.meta) + '</p>' : '') + '</div>';
    }
    // one next step: a button for most kinds, the "How did it go?" card for outcome and nextcert
    var rc = m.rec;
    if (rc.kind === 'outcome') {
      h += '<div class="ih-oc ih-reveal"><span class="ih-oc-kick">' + e(rc.kick) + '</span><span class="ih-oc-title">' + e(rc.title) + '</span><span class="ih-oc-sub">' + e(rc.sub) + '</span>'
        + '<div class="ih-oc-row"><button class="ih-oc-btn ih-pri" type="button" data-act="oc-passed">Passed</button><button class="ih-oc-btn" type="button" data-act="oc-failed">Didn\'t pass</button></div>'
        + '<button class="ih-oc-later" type="button" data-act="oc-notyet">I haven\'t sat it yet</button></div>';
    } else if (rc.kind === 'nextcert') {
      h += '<div class="ih-oc ih-reveal"><span class="ih-oc-kick">' + e(rc.kick) + '</span><span class="ih-oc-title">' + e(rc.title) + '</span><span class="ih-oc-sub">' + e(rc.sub) + '</span>'
        + '<div class="ih-oc-row"><button class="ih-oc-btn ih-pri" type="button" data-act="rec">Choose a cert</button></div></div>';
    } else {
      var rbtn = '<button class="ih-rec ih-reveal" type="button" data-act="rec" data-kind="' + e(rc.kind) + '"><span class="ih-rc-badge' + (rc.icon ? ' ih-rc-badge-ico' : '') + '">' + (rc.icon ? svg(rc.icon) : e(rc.badge != null ? rc.badge : rc.min) + '<small>' + e(rc.unit || 'MIN') + '</small>') + '</span>'
        + '<span class="ih-rc-txt"><span class="ih-rc-kick">' + e(rc.kick || 'Recommended next') + '</span><span class="ih-rc-title">' + e(rc.title) + '</span><span class="ih-rc-sub">' + e(rc.sub) + '</span></span>'
        + '<span class="ih-rc-go">' + svg('chev') + '</span></button>';
      h += rc.kind === 'quiz' ? '<div class="ih-rec-wrap ih-reveal">' + rbtn + '<button class="ih-rec-fresh" type="button" data-act="fresh">Start fresh</button></div>' : rbtn;
    }
    // coming up
    if (m.week && m.week.length) {
      var mx = m.week.reduce(function (a, d) { return Math.max(a, d.count); }, 0);
      h += '<div class="ih-sect ih-reveal">Coming up</div><div class="ih-week ih-reveal"><div class="ih-week-row">'
        + m.week.map(function (d) {
          var pct = mx > 0 ? Math.round(d.count / mx * 100) : 0;
          return '<div class="ih-day' + (d.isToday ? ' ih-today' : '') + (d.count ? '' : ' ih-empty') + (d.isExam ? ' ih-examday' : '') + '"><div class="ih-day-cell"><span class="ih-fillbar" style="height:' + pct + '%"></span><b>' + e(d.count) + '</b></div><span class="ih-day-name">' + e(d.isExam ? 'Exam' : d.label) + '</span></div>';
        }).join('') + '</div></div>';
    }
    // momentum
    var mo = m.momentum, C = 169.6, frac = mo.goal > 0 ? Math.min(1, mo.done / mo.goal) : 0;
    h += '<div class="ih-sect ih-reveal">Today\'s momentum</div><div class="ih-momentum ih-reveal"><div class="ih-ring">'
      + '<svg viewBox="0 0 66 66" aria-hidden="true"><circle class="ih-track-c" cx="33" cy="33" r="27" fill="none" stroke-width="6"></circle>'
      + '<circle class="ih-fill-c" cx="33" cy="33" r="27" fill="none" stroke-width="6" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - frac)).toFixed(1) + '"></circle></svg>'
      + '<div class="ih-rg-num"><b>' + e(mo.done) + '</b><span>of ' + e(mo.goal) + '</span></div></div><div class="ih-mo-txt">'
      + '<span class="ih-mo-goal">' + e(mo.done) + ' / ' + e(mo.goal) + ' questions today</span><span class="ih-mo-streak">' + e(mo.streakLine) + '</span>'
      + (m.state === 'new' ? '<span class="ih-mo-pick">First quiz finds your weak spots.</span>' : '')
      + '</div></div>';
    // quick start
    h += '<div class="ih-sect ih-reveal">Quick start</div><p class="ih-sect-sub ih-reveal">A daily habit that keeps your streak. 3 to 5 minutes.</p>'
      + opt('warmup', 'bolt', '5-min Warmup', '5 questions, foundational. Ease back in.', '5 Q', ' ih-reveal')
      + opt('daily', 'star', 'Daily Challenge', '1 question, about a minute. ' + (mo.ended ? 'Starts a new streak.' : 'Keeps the streak, +1.'), '1 Q', ' ih-reveal')
      + (m.mistakes > 0 ? opt('mistakes', 'warn', 'Drill Mistakes', 'Clear the ' + m.mistakes + ' wrong answer' + (m.mistakes === 1 ? '' : 's') + ' you have saved.', m.mistakes + ' saved', ' ih-reveal') : '');
    // study menus
    h += '<div class="ih-sect ih-reveal">Study menus</div><p class="ih-sect-sub ih-reveal">Tap to open. Everything is one tap away.</p>';
    h += acc('search', 'Practice', 'Deep Scan, 30 or 45 questions. 10 to 38 minutes.',
      opt('grind', 'search', '20-min Deep Scan', '20 questions, exam level, mixed topics.', '20 Q')
      + opt('bulk30', 'lines3', '30 Questions', 'Marathon, mixed. Around 25 minutes.', '30 Q')
      + opt('bulk45', 'lines4', '45 Questions', 'Marathon, mixed. Around 38 minutes.', '45 Q'));
    h += acc('check', 'Exam simulation', 'Pressure-test readiness, scored ' + (ex.fmt === 'percent' ? 'as a percentage' : ex.min + ' to ' + ex.max) + '.',
      opt('bulk60', 'check', '60-Question SIM', 'A long set at exam level. No timer.', '60 Q', ' ih-exam-lead')
      + opt('exam', 'clock', 'Full Exam Simulator', ex.qs + ' questions, ' + ex.mins + '-min timer, scored ' + (ex.fmt === 'percent' ? 'as a percentage' : ex.min + ' to ' + ex.max) + '.', ex.qs + ' Q'));
    h += acc('chart', 'Drill by domain', m.domains.length + ' domains by exam weighting, 10 questions each.',
      m.domains.map(function (d) {
        return '<div class="ih-domain" role="button" tabindex="0" data-act="domain" data-key="' + e(d.key) + '"><div class="ih-domain-top"><b>' + e(d.name) + '</b><span class="ih-domain-wt">' + e(d.weightPct) + '% of exam</span></div>'
          + '<div class="ih-domain-bar' + (d.mastery >= 100 ? ' ih-full' : '') + '"><span style="width:' + d.mastery + '%"></span></div>'
          + '<div class="ih-domain-mast">Mastery <b>' + e(d.mastery) + '%</b>' + (d.untouched ? ', untouched' : '') + '</div></div>';
      }).join(''));
    h += '<button class="ih-custom ih-reveal" type="button" data-act="custom"><span class="ih-ci">' + svg('sliders') + '</span>'
      + '<span class="ih-ct"><b>Build a custom quiz</b><span>Tune topic, difficulty and length, then launch.</span></span><span class="ih-cg">Configure</span></button>';
    h += '</div>';
    return h;
  }


  // ── "Why this score?" sheet (persona bundle Task 9). Pure: (readiness result, history, book-it checklist) in, plain object out.
  // Spec: docs/superpowers/specs/2026-10-30-why-score-bookit-repeats-design.md §1-2. Self-contained for UAT (_fnBody).
  function _iosWhyModel(r, hist, bookIt, now) {
    r = r || {}; hist = Array.isArray(hist) ? hist : [];
    var commas = function (n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
    var labels = (typeof DOMAIN_LABELS === 'object' && DOMAIN_LABELS) || {};
    var weights = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS) || {};
    var exTopic = (typeof EXAM_TOPIC === 'string') ? EXAM_TOPIC : 'Exam Simulation';
    var mixTopic = (typeof MIXED_TOPIC === 'string') ? MIXED_TOPIC : 'Mixed';
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var lede = { bold: r.predicted + ', likely between ' + r.lowerBound + ' and ' + r.upperBound + '.',
      rest: ' Pass chance ' + Math.round((r.passProbability || 0) * 100) + '%. Based on ' + commas(r.totalQs) + ' answers across ' + r.studiedCount + ' of ' + r.totalTopics + ' topics.' };
    var da = r.domainAccuracy || {};
    var keys = Object.keys(weights).filter(function (k) { return typeof da[k] === 'number'; });
    var weakKey = null;
    keys.forEach(function (k) { if (weakKey === null || da[k] < da[weakKey]) weakKey = k; });
    var areas = keys.map(function (k) {
      return { key: k, name: labels[k] || k, weightPct: Math.round((weights[k] || 0) * 100), accPct: Math.round(da[k]), weak: k === weakKey };
    });
    var hard = 0, all = 0, last = null;
    hist.forEach(function (e) {
      if (!e) return;
      if (e.mode === 'exam' && e.topic === exTopic) { if (!last || new Date(e.date) > new Date(last.date)) last = e; return; }
      if (e.topic === mixTopic || e.mode === 'gauntlet' || e.mode === 'whynot') return;
      if (typeof _isCurrentCertTopic === 'function' && !_isCurrentCertTopic(e.topic)) return;
      if (!e.byDiff || typeof e.byDiff !== 'object') return;
      Object.keys(e.byDiff).forEach(function (b) { var v = e.byDiff[b]; if (Array.isArray(v)) { all += (v[1] || 0); if (b === 'E' || b === 'H') hard += (v[1] || 0); } });
    });
    var hardLine = all > 0 ? Math.round(hard / all * 100) + '% of your answers were exam-level or hard.' : null;
    var lastLine = 'None yet';
    if (last) {
      var ld = new Date(last.date);
      var sc = (typeof scaledExamScore === 'function') ? scaledExamScore(last.score || 0, last.total || 0) : null;
      lastLine = (sc !== null ? sc : (last.pct + '%')) + ' on ' + ld.getDate() + ' ' + MONTHS[ld.getMonth()];
    }
    var items = (bookIt && bookIt.items) || [];
    return { title: 'Why ' + r.predicted + '?', lede: lede,
      verdict: bookIt && bookIt.ready ? 'Ready to book · 4 of 4' : 'Not yet · ' + ((bookIt && bookIt.met) || 0) + ' of 4',
      items: items, areas: areas, hardLine: hardLine, lastLine: lastLine,
      how: "How it works: we estimate your accuracy topic by topic, adjusted for how hard each question was, weight it like the real exam, and count topics you haven't studied as 40%." };
  }
  function _iosWhyHtml(m) {
    var e = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var tick = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg>';
    var h = '<div class="ist-grip"></div><div class="iw-body"><h3 id="ist-sheet-title">' + e(m.title) + '</h3>'
      + '<p class="iw-lede"><b>' + e(m.lede.bold) + '</b>' + e(m.lede.rest) + '</p>'
      + '<div class="iw-sect">Book it?<span>' + e(m.verdict) + '</span></div><ul class="iw-check">';
    m.items.forEach(function (i) {
      h += '<li' + (i.met ? ' class="ok"' : '') + '><i>' + tick + '</i><span>' + e(i.label) + '<small>' + e(i.detail) + '</small>'
        + (i.next ? '<button class="iw-next" type="button" data-act="why-' + e(i.next.act) + '"' + (i.next.domain ? ' data-key="' + e(i.next.domain) + '"' : '') + '>' + e(i.next.label) + '</button>' : '')
        + '</span></li>';
    });
    h += '</ul><div class="iw-sect">Exam areas</div><div class="iw-dom">';
    m.areas.forEach(function (a) { h += '<div' + (a.weak ? ' class="weak"' : '') + '><span>' + e(a.name) + '</span><span class="wt">' + e(a.weightPct) + '%</span><span class="ac">' + e(a.accPct) + '%</span></div>'; });
    h += '</div><div class="iw-sect">The evidence</div><p class="iw-facts">' + (m.hardLine ? e(m.hardLine) + '<br>' : '') + 'Last full exam: <b>' + e(m.lastLine) + '</b>.</p>'
      + '<p class="iw-how">' + e(m.how) + '</p></div>';
    return h;
  }
  function _openWhy() {
    if (!(window.iosSettings && typeof window.iosSettings.openSheet === 'function')) return;
    var r = null, hist = [];
    try { r = (typeof getReadinessScore === 'function') ? getReadinessScore() : null; hist = (typeof loadHistory === 'function') ? loadHistory() : []; } catch (_) { r = null; }
    if (!r || typeof r.predicted !== 'number') return;
    var bi = (typeof getBookItChecklist === 'function') ? getBookItChecklist(r, hist) : { items: [], met: 0, ready: false };
    var close = function () { try { window.iosSettings.closeSheet(true); } catch (_) {} };
    window.iosSettings.openSheet(_iosWhyHtml(_iosWhyModel(r, hist, bi, new Date())), function (b) {
      var act = b.getAttribute('data-act');
      if (act === 'why-mocks') { close(); if (typeof startExam === 'function') startExam(); }
      else if (act === 'why-areas') { close(); if (typeof applyDomainPreset === 'function') applyDomainPreset(b.getAttribute('data-key')); }
      else if (act === 'why-volume') { close(); if (typeof applyPreset === 'function') applyPreset('focused'); }
    }, { size: 'lg' });   // desktop: a 700px centred dialog (drawing why-sheet); phones ignore it
  }
  window.openWhyScore = _openWhy;   // desktop Analytics "Why this score?" (Task 6)

  // ── Mount: phone width only. Renders into #ios-home and binds each data-act to the
  // handler the desktop Home already uses, so behaviour (Pro gates, quotas) is identical.
  function renderIosHome() {
    var root = document.getElementById('ios-home');
    if (!root) return;
    if (!(window.matchMedia && matchMedia('(max-width: 899px)').matches)) { root.innerHTML = ''; if (window.iosFirstRun && iosFirstRun.clearPhoneState) iosFirstRun.clearPhoneState(); return; }
    if (window.iosFirstRun && iosFirstRun.renderHome) { try { if (iosFirstRun.renderHome(root)) { _ihShown(); return; } } catch (_) {} }   // Lift C: day-0 / capped Home
    var m;
    try { m = _iosHomeModel(new Date()); root.innerHTML = _iosHomeHtml(m); } catch (err) { root.innerHTML = ''; return; }   // empty = desktop Home shows
    var tab = function (p) { var b = document.querySelector('.lift-tab[data-page="' + p + '"]'); if (b) b.click(); else if (typeof showPage === 'function') showPage(p); };
    var ACT = {
      // Recommended next: the desktop tile's onclick already holds the right action
      // (resume exam / start reviews / first quiz / weak spots), set by renderBentoRecommended.
      // Each kind routes to its own opener; a missing one (later task) falls back to the desktop tile.
      rec: function () {
        var k = m.rec.kind;
        if (k === 'quiz' && typeof resumeQuiz === 'function') { resumeQuiz(); return; }
        if (k === 'outcome' && typeof openLogResult === 'function') { openLogResult({ preselect: null }); return; }
        if (k === 'warmup') { applyPreset('warmup'); return; }
        if (k === 'nextcert' && typeof openHub === 'function') { openHub(); return; }
        var t = document.getElementById('primaryLaunch'); if (t) t.click();
      },
      fresh: function () { if (typeof quizResumeClear === 'function') quizResumeClear(); renderIosHome(); },
      'oc-passed': function () { if (typeof openLogResult === 'function') openLogResult({ preselect: 'passed' }); },
      'oc-failed': function () { if (typeof openLogResult === 'function') openLogResult({ preselect: 'failed' }); },
      'oc-notyet': function () {
        var on = window.iosSettings && window.iosSettings._on;
        if (on && typeof on.exam === 'function') { tab('settings'); on.exam(); } else tab('settings');   // the exam-date sheet; Settings tab if it is not there
      },
      warmup: function () { applyPreset('warmup'); },
      daily: function () { startDailyChallenge(); },
      mistakes: function () { startWrongDrill(); },
      grind: function () { applyPreset('grind'); },
      bulk30: function () { applyPreset('bulk30'); },
      bulk45: function () { applyPreset('bulk45'); },
      bulk60: function () { applyPreset('bulk60'); },
      readiness: function () { _openWhy(); },
      exam: function () { startExam(); },
      custom: function () { _jumpToCustomQuiz(); },
      settings: function () { tab('settings'); },
      cert: function () { if (typeof openHub === 'function' && openHub()) return; tab('settings'); },
      theme: function () { if (typeof toggleTheme === 'function') toggleTheme(); renderIosHome(); },
      check: function () { if (window.iosFirstRun && iosFirstRun.startCheck) iosFirstRun.startCheck(); },
      signin: function () { if (window.iosSignIn && window.iosSignIn.go) { window.iosSignIn.go('home'); return; } var a = document.querySelector('a.topbar-signin-pill'); if (a && a.href) location.href = a.href; }
    };
    root.querySelectorAll('[data-act]').forEach(function (el) {
      var act = el.getAttribute('data-act');
      if (act === 'domain') { el.addEventListener('click', function () { applyDomainPreset(el.getAttribute('data-key')); }); return; }
      if (ACT[act]) el.addEventListener('click', function () { try { ACT[act](); } catch (_) {} });
    });
    root.querySelectorAll('[data-acc]').forEach(function (a) {
      var head = a.querySelector('.ih-acc-head');
      head.addEventListener('click', function () { var open = a.classList.toggle('ih-open'); head.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    });
    _ihShown();
  }
  // Stage 5d: Home is on screen (the reminders' ask waits for this)
  function _ihShown() { try { window.dispatchEvent(new Event('ca:home-shown')); } catch (_) {} }

  window._iosHomeModel = _iosHomeModel;
  window.renderIosHome = renderIosHome;
  // renderHeroV2 can run while home.js is still parsing (before this file loads), so render
  // once on our own when the page is ready; later Home visits re-render through renderHeroV2.
  function _iosHomeBoot() {
    renderIosHome();
    // Sign-in resolves after first paint and mounts the account pill; re-render so the
    // header swaps Sign in for the streak (auth-state.js is gated, so observe, don't edit).
    var mount = document.getElementById('topbar-account-mount');
    if (mount && window.MutationObserver) {
      var t = null;
      new MutationObserver(function () {
        clearTimeout(t);
        t = setTimeout(function () { var p = document.getElementById('page-setup'); if (p && p.classList.contains('active')) renderIosHome(); }, 60);
      }).observe(mount, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _iosHomeBoot);
  else _iosHomeBoot();
  window._iosHomeHtml = _iosHomeHtml;
  window._iosWhyModel = _iosWhyModel;
  window._iosWhyHtml = _iosWhyHtml;
})();
