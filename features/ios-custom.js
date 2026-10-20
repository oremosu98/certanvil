// features/ios-custom.js — Lift A: the phone Custom quiz (E2E cert-ios-custom-quiz.html, c75e41e8).
// A view over the existing #custom-quiz-section controls: _iosCustomSource scrapes them, the pure
// _iosCustomModel / _iosCustomHtml render #ios-custom, and every tap clicks the real hidden control.
// Spec: docs/superpowers/specs/2026-10-20-ios-custom-quiz-design.md. Desktop is untouched.
(function () {
  'use strict';
  if (!window._certanvilFeatures) window._certanvilFeatures = {};

  // Pure: src (plain data scraped from the hidden panel) + now -> view model. Self-contained so UAT
  // can run it in a bare vm via _fnBody.
  function _iosCustomModel(src, now) {
    now = now || new Date();
    var WEEK = 7 * 864e5;
    var DIFF_LABEL = { 'Foundational': 'Foundational', 'Exam Level': 'Exam level', 'Hard / Tricky': 'Hard', 'Mixed': 'Mixed' };
    var DIFF_TEXT = { 'Foundational': 'foundational', 'Exam Level': 'exam level', 'Hard / Tricky': 'hard', 'Mixed': 'mixed difficulty' };
    var MODE_COPY = {
      smart: ['Smart', 'Targets the topics you keep getting wrong.'],
      mixed: ['Mixed', 'A random spread across every topic.'],
      catchup: ['Catch-up', "Topics you haven't seen lately."]
    };
    var domainsIn = src.domains || [];
    var domains = domainsIn.map(function (d) {
      var topics = (d.topics || []).map(function (t) { return { v: t.v, label: t.label, on: !!t.on }; });
      var picked = topics.filter(function (t) { return t.on; }).length;
      var allOn = topics.length > 0 && picked === topics.length;
      return {
        idx: d.idx, name: d.name, short: d.short, weight: d.weight || '', topicCount: topics.length,
        picked: picked, pickedLabel: picked ? (allOn ? 'all picked' : picked + ' picked') : '',
        allOn: allOn, expanded: picked > 0, topics: topics
      };
    });
    var modes = (src.modes || []).map(function (m) {
      var c = MODE_COPY[m.kind] || [m.v, ''];
      return { kind: m.kind, v: m.v, on: !!m.on, title: c[0], sub: c[1] };
    });

    // Catch-up: topics whose latest history row is 7+ days old, or never seen.
    var history = src.history || [];
    var last = {};
    history.forEach(function (r) {
      if (!r || typeof r.topic !== 'string') return;
      var t = Date.parse(r.date);
      if (!isFinite(t)) return;
      if (!(r.topic in last) || t > last[r.topic]) last[r.topic] = t;
    });
    var stale = 0;
    domains.forEach(function (d) {
      d.topics.forEach(function (t) {
        var seen = last[t.v];
        if (!(typeof seen === 'number' && now.getTime() - seen < WEEK)) stale++;
      });
    });
    var catchup = history.length === 0 ? { show: false, n: 0, text: '' }
      : { show: true, n: stale, text: stale === 0 ? 'All practised this week.' : 'not practised in a week' };

    var diffs = (src.diffs || []).map(function (x) { return { v: x.v, label: DIFF_LABEL[x.v] || x.v, on: !!x.on }; });
    var diffOn = diffs.filter(function (x) { return x.on; })[0];
    var diffText = diffOn ? (DIFF_TEXT[diffOn.v] || String(diffOn.label).toLowerCase()) : 'mixed difficulty';
    var counts = (src.counts || []).map(function (x) { return { v: String(x.v), on: !!x.on }; });
    var countOn = counts.filter(function (x) { return x.on; })[0];

    var nTopics = 0, from = [];
    domains.forEach(function (d) { if (d.picked) { nTopics += d.picked; from.push(d.short || d.name); } });
    var foot;
    if (nTopics) {
      var where = from.length > 2 ? from.length + ' domains'
        : (from.length === 2 ? from[0] + ' and ' + from[1] : from[0]);
      foot = nTopics + (nTopics === 1 ? ' topic' : ' topics') + ' from ' + where + ', ' + diffText + '.';
    } else {
      var modeOn = modes.filter(function (m) { return m.on; })[0];
      var kind = modeOn ? modeOn.kind : 'mixed';
      foot = kind === 'smart' ? 'Your weakest topics, ' + diffText + '.'
        : kind === 'catchup' ? "The topics you've gone longest without, " + diffText + '.'
        : 'Mixed spread across all topics, ' + diffText + '.';
    }

    return {
      cert: src.cert || { mark: 'CA', name: '', code: '' },
      domains: domains, modes: modes, catchup: catchup, diffs: diffs, counts: counts,
      count: countOn ? parseInt(countOn.v, 10) : 10, foot: foot, err: src.err || ''
    };
  }

  window._iosCustomModel = _iosCustomModel;
})();
