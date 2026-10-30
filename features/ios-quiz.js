// features/ios-quiz.js — Lift A: the June CertAnvil E2E quiz loop at phone width.
// Spec: docs/superpowers/specs/2026-10-19-ios-launch-june-design.md (Fidelity rule, Lift A decisions).
// Design: branch feat/cert-ios-e2e, mockups/cert-ios-quiz.html, cert-ios-results.html,
// cert-ios-review-answers.html. Pure helpers (_ios*) are self-contained so UAT can run them in a vm.
(function () {
  if (!window._certanvilFeatures) window._certanvilFeatures = {};
  var PHONE = '(max-width: 899px)';
  function isPhone() { return !!(window.matchMedia && matchMedia(PHONE).matches); }

  // ── Generating ──────────────────────────────────────────────────────────
  // E2E: "Generating 10 Exam level questions on Subnetting, VLANs and DNS..."
  function _iosLoadingLine(o) {
    var d = String(o.diff || '');
    d = d ? d.charAt(0).toUpperCase() + d.slice(1).toLowerCase() : '';
    var on;
    if (!o.topics) on = o.label || 'a mix of topics';
    else if (!o.topics.length) on = 'a mix of topics';
    else if (o.topics.length === 1) on = o.topics[0];
    else if (o.topics.length <= 3) on = o.topics.slice(0, -1).join(', ') + ' and ' + o.topics[o.topics.length - 1];
    else on = o.topics.slice(0, 3).join(', ') + ' and ' + (o.topics.length - 3) + ' more topics';
    return 'Generating ' + o.count + (d ? ' ' + d : '') + ' questions on ' + on + '...';
  }

  var FLAG = '<path d="M5 21V4M5 4h11l-1.8 4L16 12H5"></path>';
  var X = '<path d="M6 6l12 12M18 6L6 18"></path>';
  function renderIosLoading(o) {
    var root = document.getElementById('ios-loading');
    if (!root) return;
    if (!isPhone()) { root.innerHTML = ''; return; }
    var e = function (s) { return escHtml(String(s)); };
    root.innerHTML =
      '<div class="iq-qbar"><button class="iq-exit" type="button" data-act="cancel" aria-label="Cancel and go back to Home"><svg viewBox="0 0 24 24" aria-hidden="true">' + X + '</svg></button>'
      + '<div class="iq-qprog"><div class="iq-qprog-track"><div class="iq-qprog-fill" style="width:8%"></div></div><span class="iq-qprog-num">Building set...</span></div>'
      + '<button class="iq-qflag" type="button" disabled aria-hidden="true" tabindex="-1"><svg viewBox="0 0 24 24" aria-hidden="true">' + FLAG + '</svg></button></div>'
      + '<div class="iq-body">'
      + '<div class="iq-sk iq-sk-stem iq-shimmer"></div><div class="iq-sk iq-sk-stem iq-shimmer"></div><div class="iq-sk iq-sk-stem iq-short iq-shimmer"></div>'
      + '<div class="iq-sk-opt iq-shimmer"></div><div class="iq-sk-opt iq-shimmer"></div><div class="iq-sk-opt iq-shimmer"></div><div class="iq-sk-opt iq-shimmer"></div>'
      + '<p class="iq-gen-line">' + e(_iosLoadingLine(o)) + '</p>'
      + '<div class="iq-gen-prog"><div class="iq-gen-prog-track"><div class="iq-gen-prog-bar"></div></div><span class="iq-gen-prog-cap" id="ios-loading-cap">Generating questions...</span></div>'
      + '</div><div class="iq-qfoot"><button class="iq-btn-primary" type="button" disabled>Preparing your set</button></div>';
    var c = root.querySelector('[data-act="cancel"]');
    // ✕ is the existing Cancel (v8.164.0): same handler, same behaviour.
    if (c) c.addEventListener('click', function () { var b = document.getElementById('load-cancel'); if (b) b.click(); });
  }
  // Caption mirrors the real stage labels from _loadingProgressBegin/_loadingProgressUpdate.
  function iosLoadingCaption(label) {
    var cap = document.getElementById('ios-loading-cap');
    if (cap && label) cap.textContent = String(label).replace(/…$/, '...');
  }

  // ── Results (cert-ios-results.html) ─────────────────────────────────────
  // Pure: the values finish() already computed in, the E2E's content out.
  function _iosResultsModel(o) {
    var em = String(o.headlineHtml || '').match(/^(.*?)\s*<em>(.*?)<\/em>/);
    var DIFF = { 'Foundational': 'Basic', 'Exam Level': 'Exam level', 'Hard / Tricky': 'Hard', 'Hard': 'Hard', 'Mixed': 'Mixed' };
    var order = ['Foundational', 'Exam Level', 'Hard / Tricky', 'Hard', 'Mixed'];
    var by = {};
    (o.log || []).forEach(function (e) {
      var d = String((e.q && e.q.difficulty) || 'Exam Level').trim();
      by[d] = by[d] || { r: 0, n: 0 }; by[d].n++; if (e.isRight) by[d].r++;
    });
    var keys = order.filter(function (d) { return by[d]; });
    var cap = function (s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
    return {
      headline: { lead: em ? em[1].trim() : String(o.headlineHtml || ''), em: em ? em[2] : '' },
      sub: String(o.sub || '').replace(/\s*—\s*/g, ', '),
      rows: [{ k: 'Correct', v: String(o.score), tone: 'good' }, { k: 'Wrong', v: String(o.total - o.score), tone: 'bad' },
        { k: 'Raw', v: o.pct + '%', tone: '' }, { k: 'Time', v: String(o.elapsed || '0s'), tone: '' }, { k: 'Best streak', v: String(o.bestStreak || 0), tone: '' }],
      split: keys.length > 1 ? keys.map(function (d) { return { num: by[d].r + '/' + by[d].n, label: DIFF[d] || d }; }) : [],
      review: (o.log || []).map(function (e, i) {
        var t = (e.q && e.q.topic) || '', dk = (o.topicDomains || {})[t];
        return { n: (i < 9 ? '0' : '') + (i + 1), stem: (e.q && e.q.question) || '', meta: t + (dk ? ' - ' + cap(dk) : ''), verdict: e.isRight ? 'Correct' : 'Wrong' };
      }),
      mistakes: o.total - o.score
    };
  }

  // 30 Oct: the readiness change card that replaced the scaled score. Pure: readiness before/after finish(),
  // whether it was a mistake drill, and the streak, in; the card's content out. null = no card.
  function _iosReadinessChangeModel(o) {
    var s = o.streak || {}, n = s.current || 0;
    var streak = (s.lastBefore && s.lastBefore === s.today) ? 'Day ' + n + ' · today already counted'
      : (n <= 1 ? 'Streak started · day 1' : 'Streak kept · day ' + n);
    var base = { kind: '', label: '', from: null, to: null, delta: null, tone: '', note: '', streak: streak };
    var set = function (k) { for (var i in k) base[i] = k[i]; return base; };
    if (o.practice) return set({ kind: 'practice', label: 'Practice only', note: "Mistake drills don't change your readiness. They're for fixing what you got wrong." });
    // Only a snapshot this finish wrote is a reading (it skips the write when readiness can't be computed), and the
    // onboarding estimate is not a "before": the first real quiz after it reads "placed", not a jump or a drop.
    var to = o.after, from = o.beforeSource === 'onb-calibration' ? null : o.before;
    if (typeof to !== 'number' || !isFinite(to)) return null;
    if (o.startedAt && !(o.afterAt && o.afterAt >= o.startedAt)) return null;
    if (typeof from !== 'number' || !isFinite(from)) return set({ kind: 'placed', label: 'Readiness placed · ' + o.cert, to: to,
      note: 'Your first reading on ' + o.cert + '. It moves with every set you finish.' });
    var d = Math.round(to - from);
    if (d === 0) return set({ kind: 'held', label: 'Readiness held · ' + o.cert, to: to, delta: 'No change', tone: 'held' });
    return set({ kind: d > 0 ? 'up' : 'down', label: 'Readiness · ' + o.cert, from: from, to: to,
      delta: (d > 0 ? '+' : '−') + Math.abs(d), tone: d > 0 ? 'up' : 'down' });
  }

  var CHECK = '<path d="M20 6L9 17l-5-5"></path>';
  var SUN = '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>';
  var MOON = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>';
  function _iosThemeIcon() { return document.documentElement.getAttribute('data-theme') === 'light' ? MOON : SUN; }

  var FLAME = '<path d="M12 3c1.5 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.8-2.5C9 10 9 11 10 11.5 9.5 9 11 5.5 12 3z"></path>';
  var _irFinishedLog = null;
  function renderIosResults() {
    var root = document.getElementById('ios-results');
    if (!root) return;
    if (!isPhone() || typeof log === 'undefined' || !log.length) { root.innerHTML = ''; return; }   // never leave a stale session behind
    var total = log.length, pct = Math.round(score / total * 100);
    // Stage 5d: a finished session, once per session (re-renders of the same log don't count again)
    var firstRender = _irFinishedLog !== log;
    if (firstRender) { _irFinishedLog = log; try { window.dispatchEvent(new Event('ca:quiz-finished')); } catch (_) {} }
    var rawName = (typeof CERT_PACK === 'object' && CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.name) || 'CompTIA';
    var hl = document.getElementById('result-headline'), sub = document.getElementById('result-sub'), el = document.getElementById('r-elapsed');
    var m = _iosResultsModel({ score: score, total: total, pct: pct,
      headlineHtml: hl ? hl.innerHTML : '', sub: sub ? sub.textContent : '', elapsed: el ? el.textContent : '',
      bestStreak: (typeof bestStreak === 'number') ? bestStreak : 0, log: log,
      topicDomains: (typeof TOPIC_DOMAINS === 'object' && TOPIC_DOMAINS) || {} });
    // 30 Oct: the readiness change card (before → after from finish(), the streak) in place of the scaled score
    var ctx = window._iosResultsCtx || {}, rc = null;
    try {
      var snap = (typeof _readReadinessSnapshots === 'function' ? _readReadinessSnapshots() : {})[CURRENT_CERT];
      var st = (typeof getStreak === 'function') ? getStreak() : {};
      rc = _iosReadinessChangeModel({ before: ctx.before, beforeSource: ctx.beforeSource || null, after: snap && snap.score,
        afterAt: snap && snap.computed_at, startedAt: ctx.at || null, practice: !!ctx.practice,
        cert: String(rawName).replace(/^(CompTIA|Microsoft|Amazon|AWS)\s+/, ''),
        streak: { current: st.current || 0, lastBefore: ctx.streakLastBefore || null, today: new Date().toISOString().slice(0, 10) } });
    } catch (_) { rc = null; }
    var e = function (s) { return escHtml(String(s)); };
    var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; };
    root.innerHTML =
      '<div class="ir-app-chrome"><button class="ir-app-theme" type="button" data-act="theme" aria-label="Switch theme">' + svg(_iosThemeIcon()) + '</button></div>'
      + '<div class="ir-body">'
      + '<div class="ir-done-head ir-reveal"><span class="ir-done-kick">' + svg(CHECK) + 'Session complete</span>'
      + '<h2 class="ir-done-title">' + e(m.headline.lead) + (m.headline.em ? ' <em>' + e(m.headline.em) + '</em>' : '') + '</h2>'
      + '<p class="ir-done-sub">' + e(m.sub) + '</p></div>'
      + (rc ? '<div class="ir-rch ir-reveal' + (rc.kind === 'practice' ? ' ir-practice' : '') + '"><span class="ir-rch-lbl">' + e(rc.label) + '</span>'
        + (rc.kind === 'practice' ? '' : '<div class="ir-rch-row">' + (rc.from !== null ? '<span class="ir-rch-from">' + e(rc.from) + '</span><span class="ir-rch-arrow" aria-hidden="true">&rarr;</span>' : '')
          + '<span class="ir-rch-num">' + e(rc.to) + '</span>' + (rc.delta ? '<span class="ir-rch-delta ir-' + rc.tone + '">' + e(rc.delta) + '</span>' : '') + '</div>')
        + (rc.note ? '<p class="ir-rch-note">' + e(rc.note) + '</p>' : '')
        + '<div class="ir-rch-streak">' + svg(FLAME) + '<span>' + e(rc.streak) + '</span></div></div>' : '')
      + '<div class="ir-stats ir-reveal">' + m.rows.map(function (r) { return '<div class="ir-stat"><span class="ir-sl">' + e(r.k) + '</span><span class="ir-sv' + (r.tone ? ' ir-' + r.tone : '') + '">' + e(r.v) + '</span></div>'; }).join('') + '</div>'
      + (m.split.length ? '<div class="ir-split ir-reveal">' + m.split.map(function (c) { return '<div class="ir-split-cell"><span class="ir-cn">' + e(c.num) + '</span><span class="ir-cl">' + e(c.label) + '</span></div>'; }).join('') + '</div>' : '')
      + '<div class="ir-sect ir-reveal"><p class="ir-sect-kick">Review - this session</p><h3 class="ir-sect-title">Every <em>answer.</em></h3>'
      + m.review.map(function (r, i) { return '<button type="button" class="ir-qrow" data-act="row" data-i="' + i + '"><span class="ir-qno">' + e(r.n) + '</span><span class="ir-qmid"><span class="ir-qstem">' + e(r.stem) + '</span><span class="ir-qmeta">' + e(r.meta) + '</span></span><span class="ir-qtag ' + (r.verdict === 'Correct' ? 'ir-right' : 'ir-wrong') + '">' + e(r.verdict) + '</span></button>'; }).join('')
      + '</div></div>'
      + '<div class="ir-rfoot"><button class="ir-btn-primary" type="button" data-act="redo">Redo this quiz</button><div class="ir-sec-row">'
      + (m.mistakes > 0 ? '<button class="ir-btn-ghost" type="button" data-act="drill">Drill my ' + m.mistakes + ' mistake' + (m.mistakes === 1 ? '' : 's') + '</button>' : '')
      + '<button class="ir-btn-ghost" type="button" data-act="review">Review answers</button><button class="ir-btn-ghost" type="button" data-act="menu">Back to menu</button></div></div>';
    // Count from the old readiness to the new one, once per finished session (BRAND §6 data motion, 900ms).
    var num = root.querySelector('.ir-rch-num');
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (num && rc && firstRender && !still && (rc.kind === 'up' || rc.kind === 'down')) {
      var from = rc.from, to = rc.to, t0 = null;
      num.textContent = from;
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / 900, 1);
        if (!num.isConnected) return;
        num.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    var ACT = {
      redo: function () { retryQuiz(); },
      drill: function () { drillMistakesFromResults(); },
      review: function () { showReview(false); },
      menu: function () { goSetup(); },
      theme: function () { if (typeof toggleTheme === 'function') toggleTheme(); renderIosResults(); }
    };
    root.querySelectorAll('[data-act]').forEach(function (b) {
      var a = b.getAttribute('data-act');
      b.addEventListener('click', function () {
        try { if (a === 'row') showReview(false, +b.getAttribute('data-i')); else if (ACT[a]) ACT[a](); } catch (_) {}
      });
    });
  }

  window._iosResultsModel = _iosResultsModel;
  window._iosReadinessChangeModel = _iosReadinessChangeModel;
  window.renderIosResults = renderIosResults;

  // ── Review answers (cert-ios-review-answers.html) ───────────────────────
  // Filters: All / Wrong only / Flagged (founder, 19 Oct). Skipped counts as wrong;
  // Flagged only appears when something was flagged.
  function _iosReviewModel(o) {
    var qs = o.questions || [], lg = o.log || [];
    var entryFor = function (q) { for (var i = 0; i < lg.length; i++) if (lg[i] && lg[i].q === q) return lg[i]; return null; };
    var right = 0, anyFlag = false;
    var cards = qs.map(function (q, i) {
      var en = entryFor(q), ok = !!(en && en.isRight), flagged = !!((en && en.flagged) || (o.flags && o.flags[i]));
      if (ok) right++;
      if (flagged) anyFlag = true;
      var keys = Object.keys(q.options || {}).sort();
      var correctSet = Array.isArray(q.answers) ? q.answers : [q.answer];
      // multi-select logs chosen as "A,C" (as desktop review reads it)
      var mine = en ? (Array.isArray(en.chosen) ? en.chosen : String(en.chosen == null ? '' : en.chosen).split(',').filter(Boolean)) : [];
      var opts = keys.map(function (k) {
        var isC = correctSet.indexOf(k) >= 0, isMineWrong = !ok && mine.indexOf(k) >= 0 && !isC;
        return { key: k, text: q.options[k], state: isC ? 'correct' : (isMineWrong ? 'yours-wrong' : ''), tag: isC ? 'Correct' : (isMineWrong ? 'Your pick' : '') };
      });
      // order / topology / CLI / hot-area / Sim Lab items have no options: render the desktop item
      return { n: i + 1, i: i, q: q.question || '', badge: ok ? 'Correct' : 'Missed', ok: ok, flagged: flagged, opts: opts, why: q.explanation || '', fallback: !keys.length };
    });
    var mode = o.mode || 'all';
    return {
      summary: (o.certName || 'Practice') + ' practice · ' + qs.length + ' question' + (qs.length === 1 ? '' : 's') + ' · ' + right + ' correct',
      showFlagged: anyFlag,
      cards: cards.filter(function (c) { return mode === 'all' || (mode === 'wrong' ? !c.ok : c.flagged); })
    };
  }

  var BACK = '<path d="M15 18l-6-6 6-6"></path>';
  var XS = '<path d="M6 6l12 12M18 6L6 18"></path>';
  var FLAGI = '<path d="M5 21V4M5 4h11l-1.8 4L16 12H5"></path>';
  var _iosReviewMode = 'all';
  function renderIosReview(fromExam, mode) {
    var root = document.getElementById('ios-review');
    if (!root) return;
    // Exam review stays on the desktop layout until Lift B lifts the exam.
    if (!isPhone() || fromExam || typeof questions === 'undefined') { root.innerHTML = ''; return; }
    _iosReviewMode = mode || 'all';
    var rawName = (typeof CERT_PACK === 'object' && CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.name) || 'CompTIA Network+';
    var m = _iosReviewModel({ questions: questions, log: (typeof log !== 'undefined' ? log : []), flags: (typeof quizFlags !== 'undefined' ? quizFlags : null),
      certName: String(rawName).replace(/^(CompTIA|Microsoft|Amazon|AWS)\s+/, ''), mode: _iosReviewMode });
    if (_iosReviewMode === 'flag' && !m.showFlagged) return renderIosReview(fromExam, 'all');
    var e = function (s) { return escHtml(String(s)); };
    var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; };
    var seg = function (k, label) { return '<button type="button" role="tab" data-mode="' + k + '" class="' + (_iosReviewMode === k ? 'ia-on' : '') + '" aria-selected="' + (_iosReviewMode === k) + '">' + label + '</button>'; };
    var _lg = (typeof log !== 'undefined' ? log : []);
    var cards = m.cards.length ? m.cards.map(function (c) {
      if (c.fallback && typeof window._buildReviewItemHtml === 'function') {
        var q0 = questions[c.i], en0 = null;
        for (var j = 0; j < _lg.length; j++) if (_lg[j] && _lg[j].q === q0) en0 = _lg[j];
        return '<div class="ia-qa ia-legacy">' + window._buildReviewItemHtml(en0 || { q: q0, chosen: null, isRight: false, flagged: c.flagged, skipped: true }, c.i, questions.length) + '</div>';
      }
      return '<div class="ia-qa"><div class="ia-qa-top"><span class="ia-qa-num">Question ' + c.n + (c.flagged ? '<span class="ia-qa-flag">' + svg(FLAGI) + 'Flagged</span>' : '') + '</span>'
        + '<span class="ia-qa-badge ' + (c.ok ? 'ia-ok' : 'ia-no') + '">' + svg(c.ok ? CHECK : XS) + (c.ok ? 'Correct' : 'Missed') + '</span></div>'
        + '<p class="ia-qa-q">' + e(c.q) + '</p><div class="ia-qa-opts">' + c.opts.map(function (op) {
          return '<div class="ia-qa-opt' + (op.state ? ' ia-' + op.state : '') + '"><span class="ia-mk">' + (op.state === 'correct' ? svg(CHECK) : (op.state === 'yours-wrong' ? svg(XS) : '')) + '</span>'
            + '<span>' + e(op.key) + '. ' + e(op.text) + '</span>' + (op.tag ? '<span class="ia-tag">' + e(op.tag) + '</span>' : '') + '</div>';
        }).join('') + '</div>' + (c.why ? '<p class="ia-qa-ex"><b>Why:</b> ' + e(c.why) + '</p>' : '') + '</div>';
    }).join('') : '<div class="ia-empty"><b>Nothing missed</b>Every answer was correct. Clean run.</div>';
    root.innerHTML =
      '<div class="ia-hdr"><button class="ia-back" type="button" data-act="back" aria-label="Back">' + svg(BACK) + '</button><h1>Review answers</h1>'
      + '<button class="ia-app-theme" type="button" data-act="theme" aria-label="Switch between light and dark">' + svg(_iosThemeIcon()) + '</button></div>'
      + '<div class="ia-summary"><p class="ia-sline">' + e(m.summary).replace(/ · (\d+ questions?) · (\d+ correct)$/, ' · <b>$1</b> · <b>$2</b>') + '</p>'
      + '<div class="ia-seg" role="tablist" aria-label="Filter answers">' + seg('all', 'All') + seg('wrong', 'Wrong only') + (m.showFlagged ? seg('flag', 'Flagged') : '') + '</div></div>'
      + '<div class="ia-body">' + cards + '</div>'
      + '<div class="ia-footer"><button class="ia-cta" type="button" data-act="done">Done</button></div>';
    var back = function () { showPage('results'); };
    root.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { renderIosReview(false, b.getAttribute('data-mode')); }); });
    root.querySelectorAll('[data-act]').forEach(function (b) {
      var a = b.getAttribute('data-act');
      b.addEventListener('click', function () {
        if (a === 'back' || a === 'done') back();
        else if (a === 'theme') { if (typeof toggleTheme === 'function') toggleTheme(); renderIosReview(false, _iosReviewMode); }
      });
    });
  }

  window._iosReviewModel = _iosReviewModel;
  window.renderIosReview = renderIosReview;

  window._iosLoadingLine = _iosLoadingLine;
  window.renderIosLoading = renderIosLoading;
  window.iosLoadingCaption = iosLoadingCaption;
})();
