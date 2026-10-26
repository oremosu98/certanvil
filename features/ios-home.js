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
    // Every row, like the desktop bento: Mixed sessions and exams keep their per-topic data only
    // in split rows (summary rows carry topic 'Mixed', which maps to no domain).
    history.forEach(function (e) { var k = e && td[e.topic]; if (k && agg[k]) { agg[k].s += e.score || 0; agg[k].n += e.total || 0; } });
    var domains = Object.keys(weights).map(function (k) {
      return { key: k, name: labels[k] || k, weightPct: Math.round((weights[k] || 0) * 100),
        mastery: agg[k].n > 0 ? Math.round(agg[k].s / agg[k].n * 100) : 0, untouched: agg[k].n === 0 };
    });

    var native = false;
    try { native = !!(typeof document !== 'undefined' && document.documentElement && document.documentElement.classList.contains('is-native')); } catch (_) {}
    var signedIn = native || !!(typeof window !== 'undefined' && window._certanvilSignedIn);

    var exam = { qs: (typeof EXAM_QUESTION_COUNT === 'number') ? EXAM_QUESTION_COUNT : 90,
      mins: Math.round(((typeof EXAM_TIME_SECONDS === 'number') ? EXAM_TIME_SECONDS : 5400) / 60),
      min: (typeof EXAM_MIN_SCORE === 'number') ? EXAM_MIN_SCORE : 100, max: max };

    return { state: isNew ? 'new' : 'returning', signedIn: signedIn, cert: cert, streak: cur, greeting: greeting, exam: exam,
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
      arrow: '<path d="M5 12h14M13 6l6 6-6 6"></path>'
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
      + '<button class="ih-tb-name" type="button" data-act="cert"><b>' + e(m.cert.name) + '</b><span>' + e(m.cert.code) + '</span></button>'
      + (m.signedIn ? '<span class="ih-tb-streak' + (m.streak ? '' : ' ih-zero') + '">' + svg('flame') + e(m.streak) + '</span>'
        : '<button class="ih-tb-signin" data-act="signin" type="button">Sign in</button>')
      + '<button class="ih-tb-set" type="button" data-act="settings" aria-label="Settings">' + svg('gear') + '</button>'
      + '<button class="ih-app-theme" type="button" data-act="theme" aria-label="Switch theme">' + svg(light ? 'moon' : 'sun') + '</button></div>';
    h += '<div class="ih-body">';
    h += '<p class="ih-greeting ih-reveal">' + e(m.greeting) + '</p>';
    // readiness
    if (r.score === null) {
      h += '<div class="ih-rd ih-locked ih-reveal"><div class="ih-rd-top"><span class="ih-rd-eyebrow">Readiness</span><span class="ih-rd-tier ih-locked">Locked</span></div>'
        + '<div class="ih-rd-score"><span class="ih-rd-num">--</span><span class="ih-rd-of">/ ' + e(r.max) + '</span></div><div class="ih-bar"></div>'
        + '<p class="ih-rd-insight">' + e(r.insight) + '</p></div>';
    } else {
      h += '<div class="ih-rd ih-reveal' + (r.tier === 'Pass ready' ? ' ih-passed' : '') + '" data-act="readiness" role="button" tabindex="0">'
        + '<div class="ih-rd-top"><span class="ih-rd-eyebrow">Readiness</span><span class="ih-rd-tier' + (r.tier === 'Close' ? ' ih-close' : (r.tier === 'Behind' ? ' ih-behind' : '')) + '">' + e(r.tier) + '</span></div>'
        + '<div class="ih-rd-score"><span class="ih-rd-num">' + e(r.score) + '</span><span class="ih-rd-of">/ ' + e(r.max) + '</span></div>'
        + '<div class="ih-bar"><span style="width:' + r.fillPct + '%"></span><span class="ih-tick" style="left:' + r.passPct + '%"></span></div>'
        + '<div class="ih-rd-legend"><span>Now</span><span class="ih-p">Pass ' + e(r.pass) + '</span></div>'
        + '<p class="ih-rd-insight">' + e(r.insight) + '</p>'
        + (r.meta ? '<p class="ih-rd-meta">' + e(r.meta) + '</p>' : '') + '</div>';
    }
    // recommended next
    h += '<button class="ih-rec ih-reveal" type="button" data-act="rec"><span class="ih-rc-badge">' + e(m.rec.min) + '<small>MIN</small></span>'
      + '<span class="ih-rc-txt"><span class="ih-rc-kick">Recommended next</span><span class="ih-rc-title">' + e(m.rec.title) + '</span><span class="ih-rc-sub">' + e(m.rec.sub) + '</span></span>'
      + '<span class="ih-rc-go">' + svg('chev') + '</span></button>';
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
      + (mo.pick ? '<span class="ih-mo-pick">Pick up: <b>' + e(mo.pick.topic) + '</b>' + (mo.pick.detail ? ', ' + e(mo.pick.detail) : '') + '</span>'
          + '<button class="ih-mo-go" type="button" data-act="practise">Practise it · 10 questions' + svg('arrow') + '</button>'
        : '<span class="ih-mo-pick">First quiz finds your weak spots.</span>')
      + '</div></div>';
    // quick start
    h += '<div class="ih-sect ih-reveal">Quick start</div><p class="ih-sect-sub ih-reveal">A daily habit that keeps your streak. 3 to 5 minutes.</p>'
      + opt('warmup', 'bolt', '5-min Warmup', '5 questions, foundational. Ease back in.', '5 Q', ' ih-reveal')
      + opt('daily', 'star', 'Daily Challenge', '1 question, about a minute. Keeps the streak, +1.', '1 Q', ' ih-reveal')
      + (m.mistakes > 0 ? opt('mistakes', 'warn', 'Drill Mistakes', 'Clear the ' + m.mistakes + ' wrong answer' + (m.mistakes === 1 ? '' : 's') + ' you have saved.', m.mistakes + ' saved', ' ih-reveal') : '');
    // study menus
    h += '<div class="ih-sect ih-reveal">Study menus</div><p class="ih-sect-sub ih-reveal">Tap to open. Everything is one tap away.</p>';
    h += acc('search', 'Practice', 'Deep Scan, 30 or 45 questions. 10 to 38 minutes.',
      opt('grind', 'search', '20-min Deep Scan', '20 questions, exam level, mixed topics.', '20 Q')
      + opt('bulk30', 'lines3', '30 Questions', 'Marathon, mixed. Around 25 minutes.', '30 Q')
      + opt('bulk45', 'lines4', '45 Questions', 'Marathon, mixed. Around 38 minutes.', '45 Q'));
    h += acc('check', 'Exam simulation', 'Pressure-test readiness, scored ' + ex.min + ' to ' + ex.max + '.',
      opt('bulk60', 'check', '60-Question SIM', 'Closest to the real thing. No timer.', '60 Q', ' ih-exam-lead')
      + opt('exam', 'clock', 'Full Exam Simulator', ex.qs + ' questions, ' + ex.mins + '-min timer, scored ' + ex.min + ' to ' + ex.max + '.', ex.qs + ' Q'));
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


  // ── Mount: phone width only. Renders into #ios-home and binds each data-act to the
  // handler the desktop Home already uses, so behaviour (Pro gates, quotas) is identical.
  function renderIosHome() {
    var root = document.getElementById('ios-home');
    if (!root) return;
    if (!(window.matchMedia && matchMedia('(max-width: 899px)').matches)) { root.innerHTML = ''; if (window.iosFirstRun && iosFirstRun.clearPhoneState) iosFirstRun.clearPhoneState(); return; }
    if (window.iosFirstRun && iosFirstRun.renderHome) { try { if (iosFirstRun.renderHome(root)) return; } catch (_) {} }   // Lift C: day-0 / capped Home
    var m;
    try { m = _iosHomeModel(new Date()); root.innerHTML = _iosHomeHtml(m); } catch (err) { root.innerHTML = ''; return; }   // empty = desktop Home shows
    var tab = function (p) { var b = document.querySelector('.lift-tab[data-page="' + p + '"]'); if (b) b.click(); else if (typeof showPage === 'function') showPage(p); };
    var ACT = {
      // Recommended next: the desktop tile's onclick already holds the right action
      // (resume exam / start reviews / first quiz / weak spots), set by renderBentoRecommended.
      rec: function () { var t = document.getElementById('primaryLaunch'); if (t) t.click(); },
      warmup: function () { applyPreset('warmup'); },
      daily: function () { startDailyChallenge(); },
      mistakes: function () { startWrongDrill(); },
      grind: function () { applyPreset('grind'); },
      bulk30: function () { applyPreset('bulk30'); },
      bulk45: function () { applyPreset('bulk45'); },
      bulk60: function () { applyPreset('bulk60'); },
      exam: function () { startExam(); },
      custom: function () { _jumpToCustomQuiz(); },
      practise: function () { if (m.momentum.pick && typeof window._startPickUpQuiz === 'function') window._startPickUpQuiz(m.momentum.pick.topic); },
      settings: function () { tab('settings'); },
      cert: function () { tab('settings'); },
      theme: function () { if (typeof toggleTheme === 'function') toggleTheme(); renderIosHome(); },
      signin: function () { var a = document.querySelector('a.topbar-signin-pill'); if (a && a.href) location.href = a.href; }
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
  }

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
})();
