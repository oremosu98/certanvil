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
    if (!root || !isPhone()) return;
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
    var gap = o.pass - o.scaled;
    return {
      headline: { lead: em ? em[1].trim() : String(o.headlineHtml || ''), em: em ? em[2] : '' },
      sub: String(o.sub || '').replace(/\s*—\s*/g, ', '),
      scaledLabel: 'Scaled score - ' + o.vendorCode, scaled: o.scaled, max: o.max,
      verdict: gap > 0 ? { text: gap + ' below pass, keep going', dir: 'down' } : { text: 'Pass mark cleared', dir: 'up' },
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

  var CHECK = '<path d="M20 6L9 17l-5-5"></path>';
  var DOWN = '<path d="M12 5v14M5 12l7 7 7-7"></path>';
  var UP = '<path d="M12 19V5M5 12l7-7 7 7"></path>';
  var SUN = '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>';
  var MOON = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>';
  function _iosThemeIcon() { return document.documentElement.getAttribute('data-theme') === 'light' ? MOON : SUN; }

  function renderIosResults() {
    var root = document.getElementById('ios-results');
    if (!root || !isPhone() || typeof log === 'undefined' || !log.length) return;
    var total = log.length, pct = Math.round(score / total * 100);
    var scaled = (typeof scaledExamScore === 'function') ? scaledExamScore(pct, 100) : Math.round(100 + pct * 8);
    var rawName = (typeof CERT_PACK === 'object' && CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.name) || 'CompTIA';
    var hl = document.getElementById('result-headline'), sub = document.getElementById('result-sub'), el = document.getElementById('r-elapsed');
    var m = _iosResultsModel({ score: score, total: total, pct: pct, scaled: scaled,
      pass: (typeof EXAM_PASS_SCORE === 'number') ? EXAM_PASS_SCORE : 720, max: (typeof EXAM_MAX_SCORE === 'number') ? EXAM_MAX_SCORE : 900,
      vendorCode: String(rawName).split(/\s+/)[0] + ' ' + ((typeof CERT_CODE === 'string' && CERT_CODE) || ''),
      headlineHtml: hl ? hl.innerHTML : '', sub: sub ? sub.textContent : '', elapsed: el ? el.textContent : '',
      bestStreak: (typeof bestStreak === 'number') ? bestStreak : 0, log: log,
      topicDomains: (typeof TOPIC_DOMAINS === 'object' && TOPIC_DOMAINS) || {} });
    var e = function (s) { return escHtml(String(s)); };
    var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; };
    root.innerHTML =
      '<div class="ir-app-chrome"><button class="ir-app-theme" type="button" data-act="theme" aria-label="Switch theme">' + svg(_iosThemeIcon()) + '</button></div>'
      + '<div class="ir-body">'
      + '<div class="ir-done-head ir-reveal"><span class="ir-done-kick">' + svg(CHECK) + 'Session complete</span>'
      + '<h2 class="ir-done-title">' + e(m.headline.lead) + (m.headline.em ? ' <em>' + e(m.headline.em) + '</em>' : '') + '</h2>'
      + '<p class="ir-done-sub">' + e(m.sub) + '</p></div>'
      + '<div class="ir-scaled ir-reveal' + (m.verdict.dir === 'up' ? ' ir-pass' : '') + '"><span class="ir-scaled-lbl">' + e(m.scaledLabel) + '</span>'
      + '<div class="ir-scaled-row"><span class="ir-scaled-num">' + e(m.scaled) + '</span><span class="ir-scaled-of">/ ' + e(m.max) + '</span></div>'
      + '<span class="ir-scaled-pill">' + svg(m.verdict.dir === 'up' ? UP : DOWN) + e(m.verdict.text) + '</span></div>'
      + '<div class="ir-stats ir-reveal">' + m.rows.map(function (r) { return '<div class="ir-stat"><span class="ir-sl">' + e(r.k) + '</span><span class="ir-sv' + (r.tone ? ' ir-' + r.tone : '') + '">' + e(r.v) + '</span></div>'; }).join('') + '</div>'
      + (m.split.length ? '<div class="ir-split ir-reveal">' + m.split.map(function (c) { return '<div class="ir-split-cell"><span class="ir-cn">' + e(c.num) + '</span><span class="ir-cl">' + e(c.label) + '</span></div>'; }).join('') + '</div>' : '')
      + '<div class="ir-sect ir-reveal"><p class="ir-sect-kick">Review - this session</p><h3 class="ir-sect-title">Every <em>answer.</em></h3>'
      + m.review.map(function (r, i) { return '<button type="button" class="ir-qrow" data-act="row" data-i="' + i + '"><span class="ir-qno">' + e(r.n) + '</span><span class="ir-qmid"><span class="ir-qstem">' + e(r.stem) + '</span><span class="ir-qmeta">' + e(r.meta) + '</span></span><span class="ir-qtag ' + (r.verdict === 'Correct' ? 'ir-right' : 'ir-wrong') + '">' + e(r.verdict) + '</span></button>'; }).join('')
      + '</div></div>'
      + '<div class="ir-rfoot"><button class="ir-btn-primary" type="button" data-act="redo">Redo this quiz</button><div class="ir-sec-row">'
      + (m.mistakes > 0 ? '<button class="ir-btn-ghost" type="button" data-act="drill">Drill my ' + m.mistakes + ' mistake' + (m.mistakes === 1 ? '' : 's') + '</button>' : '')
      + '<button class="ir-btn-ghost" type="button" data-act="review">Review answers</button><button class="ir-btn-ghost" type="button" data-act="menu">Back to menu</button></div></div>';
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
  window.renderIosResults = renderIosResults;

  window._iosLoadingLine = _iosLoadingLine;
  window.renderIosLoading = renderIosLoading;
  window.iosLoadingCaption = iosLoadingCaption;
})();
