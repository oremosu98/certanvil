// features/ios-exam.js — Lift B2: the June CertAnvil E2E exam results at phone width.
// Design: branch feat/cert-ios-e2e, mockups/cert-ios-exam-results.html (47147981). Spec: docs/superpowers/specs/2026-10-21-ios-lift-b2-design.md
(function () {
  'use strict';

  // ── Model (pure, UAT vm-testable). d comes from submitExam(): scores on the cert's own scale, the
  //    per-domain breakdown, the Sim Lab questions and the topics answered wrong.
  function _iosExamResultsModel(d) {
    var passed = d.scaled >= d.passScore, gap = d.passScore - d.scaled, over = d.scaled - d.passScore;
    var span = (d.maxScore - d.minScore) || 1;
    var pctOf = function (v) { return Math.round((v - d.minScore) / span * 1000) / 10; };
    var tone = function (p) { return p === null ? 'none' : p >= 70 ? 'pass' : p >= 60 ? 'mid' : 'miss'; };
    var asked = d.domains.filter(function (x) { return x.total > 0; });
    var byLow = asked.slice().sort(function (a, b) { return a.pct - b.pct; });
    var weak = asked.filter(function (x) { return tone(x.pct) === 'miss'; });
    var lowTwo = byLow.slice(0, 2).map(function (x) { return x.label; });

    var headline = passed ? { lead: 'Pass mark', em: 'cleared.' } : gap <= 100 ? { lead: 'So', em: 'close.' } : { lead: 'More', em: 'work needed.' };
    var sub = passed ? over + ' points over the line.'
      : (weak.length === 1 || weak.length === 2) ? gap + ' points off a pass. The gap is ' + (weak.length === 1 ? 'one domain' : 'two domains') + ', not the whole exam.'
      : gap + ' points off a pass.' + (byLow.length ? ' Start with ' + byLow[0].label + '.' : '');
    var msg = passed ? '<b>' + over + ' points</b> above the line.'
      : '<b>' + gap + ' points</b> from the line' + (lowTwo.length ? ', and most of it is ' + lowTwo.join(' and ') + '.' : '.');

    var tags = [{ kind: passed ? 'pass' : 'fail', text: passed ? 'Pass' : 'Fail' }];
    if (d.pauses > 0) tags.push({ kind: 'mode', text: 'Paused ' + Math.max(1, Math.round(d.pausedMs / 60000)) + ' min' });

    var domains = d.domains.slice().sort(function (a, b) {
      if (a.total === 0 || b.total === 0) return (a.total === 0) - (b.total === 0);
      return b.pct - a.pct;
    }).map(function (x) {
      return { label: x.label, pct: x.total ? x.pct : null, tone: x.total ? tone(x.pct) : 'none',
        detail: x.total ? x.correct + ' of ' + x.total + ' correct' : 'Not in this exam' };
    });

    var pbq = null;
    if (d.pbqs && d.pbqs.length) {
      var rows = d.pbqs.map(function (q) {
        var v = q.skipped ? 'Skipped' : q.fraction >= 1 ? 'Right' : q.fraction > 0 ? 'Partly' : 'Wrong';
        return { title: q.title, topic: q.topic, verdict: v, tone: v === 'Right' ? 'ok' : v === 'Skipped' ? 'skip' : 'no',
          detail: q.correct + ' of ' + q.total + ' steps right.' };
      });
      pbq = { right: rows.filter(function (r) { return r.verdict === 'Right'; }).length, count: rows.length, rows: rows };
    }

    var lowSet = {};
    byLow.slice(0, 2).forEach(function (x) { lowSet[x.label] = 1; });
    var gapTopics = (d.wrongTopics || []).filter(function (w) { return lowSet[w.domain]; })
      .sort(function (a, b) { return b.wrong - a.wrong; }).slice(0, 4).map(function (w) { return w.topic; });

    return {
      passed: passed, gap: gap, over: over, headline: headline, sub: sub, label: 'Scaled score · ' + d.certLabel, tags: tags, msg: msg,
      note: "An estimate: the real exam's scaling isn't published.",
      meter: { fill: Math.max(0, Math.min(100, pctOf(d.scaled))), tick: pctOf(d.passScore), min: d.minScore, pass: d.passScore, max: d.maxScore },
      scaled: d.scaled, maxScore: d.maxScore, total: d.total,
      tiles: [{ n: d.correct, l: 'Correct', kind: 'good' }, { n: d.wrong, l: 'Wrong', kind: 'bad' }, { n: d.skipped, l: 'Skipped', kind: '' }, { n: d.pct + '%', l: 'Raw', kind: '' }],
      domains: domains, pbq: pbq, gapTopics: gapTopics
    };
  }

  // ── View (pure): the E2E markup with ie- classes.
  function _iosExamResultsHtml(m) {
    var e = function (v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var svg = function (dd) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + dd + '</svg>'; };
    var CHECK = svg('<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>');
    var CHEV = svg('<path d="M9 6l6 6-6 6"></path>');
    var h = '<div class="ie-app-chrome"><button class="ie-app-theme" type="button" data-act="theme" aria-label="Switch theme">' + svg(m.light
      ? '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>'
      : '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>') + '</button></div>'
      + '<div class="ie-body"><div class="ie-done-head ie-reveal"><span class="ie-done-kick">' + CHECK + 'Exam · ' + m.total + ' questions · complete</span>'
      + '<h2 class="ie-done-title">' + e(m.headline.lead) + ' <em>' + e(m.headline.em) + '</em></h2><p class="ie-done-sub">' + e(m.sub) + '</p></div>';
    h += '<div class="ie-scorecard ie-reveal' + (m.passed ? ' ie-passed' : '') + '"><div class="ie-sc-top"><div class="ie-sc-lbl">' + e(m.label) + '</div>'
      + '<div><span class="ie-sc-num" data-to="' + m.scaled + '">' + m.scaled + '</span><span class="ie-sc-of">/ ' + m.maxScore + '</span></div>'
      + '<div class="ie-sc-tags">' + m.tags.map(function (t) { return '<span class="ie-sc-tag ie-' + t.kind + '">' + e(t.text) + '</span>'; }).join('') + '</div>'
      + '<p class="ie-sc-msg">' + m.msg.replace(/<b>/g, '\u0001').replace(/<\/b>/g, '\u0002').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u0001/g, '<b>').replace(/\u0002/g, '</b>') + '</p>'
      + '<div class="ie-sc-meter"><div class="ie-sc-meter-track"><span class="ie-sc-meter-fill" data-w="' + m.meter.fill + '"></span><span class="ie-sc-meter-tick" style="left:' + m.meter.tick + '%"></span></div>'
      + '<div class="ie-sc-meter-legend"><span>' + m.meter.min + '</span><span class="ie-p">Pass ' + m.meter.pass + '</span><span>' + m.meter.max + '</span></div>'
      + '<p class="ie-sc-note">' + e(m.note) + '</p></div></div>'
      + '<div class="ie-sc-stats">' + m.tiles.map(function (t) { return '<div class="ie-sc-stat' + (t.kind ? ' ie-' + t.kind : '') + '"><span class="ie-sn">' + e(t.n) + '</span><span class="ie-sl">' + t.l + '</span></div>'; }).join('') + '</div></div>';
    h += '<p class="ie-sect-kick">Where the points went</p><h3 class="ie-sect-title">By <em>domain.</em></h3>'
      + m.domains.map(function (dm) {
        var t = dm.tone === 'none' ? '' : dm.tone;
        return '<div class="ie-drow ie-reveal"><div class="ie-dmid"><div class="ie-dn">' + e(dm.label) + '</div><div class="ie-dc">' + e(dm.detail) + '</div></div>'
          + '<div class="ie-dbar"><span' + (t ? ' class="ie-' + t + '-bg"' : '') + ' data-w="' + (dm.pct || 0) + '"></span></div><div class="ie-dpct' + (t ? ' ie-' + t + '-c' : '') + '">' + (dm.pct === null ? '--' : dm.pct + '%') + '</div></div>';
      }).join('');
    if (m.pbq) {
      h += '<p class="ie-sect-kick">Performance-based · ' + m.pbq.right + ' of ' + m.pbq.count + ' right</p><h3 class="ie-sect-title">Sim Lab <em>questions.</em></h3>'
        + m.pbq.rows.map(function (r) {
          return '<button class="ie-srow" type="button" data-act="pbq" aria-expanded="false"><span class="ie-sn2"><span class="ie-st">' + e(r.title) + '</span><span class="ie-ss">' + e(r.topic) + '</span></span>'
            + '<span class="ie-sv ie-' + r.tone + '">' + r.verdict + '</span>' + CHEV + '</button><div class="ie-sdet">' + e(r.detail) + '</div>';
        }).join('');
    }
    h += '</div><div class="ie-rfoot"><button class="ie-btn-ghost" type="button" data-act="menu">Menu</button><button class="ie-btn-ghost" type="button" data-act="review">Review all</button>'
      + (m.gapTopics.length ? '<button class="ie-btn-primary" type="button" data-act="drill-gap">Drill the gap</button>' : '')
      + '<button class="ie-retry-link" type="button" data-act="retry">Retry the exam</button></div>';
    return h;
  }

  // ── Mount: phone width only, into #ios-exam-results. submitExam() passes d (features/exam.js).
  function _ieIsPhone() { return !!(window.matchMedia && window.matchMedia('(max-width: 899px)').matches); }
  var _ieLast = null;
  function renderIosExamResults(d) {
    var root = document.getElementById('ios-exam-results');
    if (!root) return false;
    if (d) _ieLast = d;
    if (!_ieIsPhone() || !_ieLast) { if (root.innerHTML) root.innerHTML = ''; return false; }
    var m = _iosExamResultsModel(_ieLast);
    m.light = document.documentElement.getAttribute('data-theme') === 'light';
    root.innerHTML = _iosExamResultsHtml(m);
    _ieWire(root, m);
    return true;
  }
  function _ieWire(root, m) {
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var bars = [].slice.call(root.querySelectorAll('[data-w]'));
    var fill = function () { bars.forEach(function (b) { b.style.width = b.getAttribute('data-w') + '%'; }); };
    if (reduce) fill(); else requestAnimationFrame(function () { requestAnimationFrame(fill); });
    var num = root.querySelector('.ie-sc-num');
    if (num && !reduce) {
      var to = +num.getAttribute('data-to'), t0 = null;
      num.textContent = '0';
      var step = function (t) { if (!t0) t0 = t; var p = Math.min((t - t0) / 950, 1); num.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    root.onclick = function (ev) {
      var b = ev.target.closest('button'); if (!b || !root.contains(b)) return;
      var act = b.getAttribute('data-act');
      if (act === 'pbq') { b.setAttribute('aria-expanded', String(b.getAttribute('aria-expanded') !== 'true')); return; }
      if (act === 'menu') { if (typeof window.goSetup === 'function') window.goSetup(); return; }
      if (act === 'review') { if (typeof window.showReview === 'function') window.showReview(true); return; }
      if (act === 'retry') { if (typeof window.startExam === 'function') window.startExam(); return; }
      if (act === 'drill-gap') {
        var go = function () { if (typeof window._startTopicsQuiz === 'function') window._startTopicsQuiz(m.gapTopics.slice()); };
        if (typeof window._startTopicsQuiz === 'function') go();
        else if (typeof window._loadFeature === 'function') window._loadFeature('analytics').then(go);   // the quiz path lives in analytics.js
        return;
      }
      if (act === 'theme') { if (typeof window.toggleTheme === 'function') window.toggleTheme(); renderIosExamResults(); }
    };
  }

  window._iosExamResultsModel = _iosExamResultsModel;
  window.renderIosExamResults = renderIosExamResults;
  if (window.matchMedia) { var mq = window.matchMedia('(max-width: 899px)'); var onMq = function () { var p = document.getElementById('page-exam-results'); if (!mq.matches || (p && p.classList.contains('active'))) renderIosExamResults(); }; if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq); }
  window._iosExamResultsHtml = _iosExamResultsHtml;
})();
