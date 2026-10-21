// features/ios-analytics.js — Lift B1: the June CertAnvil E2E Analytics screen at phone width.
// Design: branch feat/cert-ios-e2e, mockups/cert-ios-analytics.html (b31c7df6). Spec: docs/superpowers/specs/2026-10-21-ios-lift-b1-design.md
(function () {
  'use strict';

  // ── Map model (pure): stars from analytics.js _computeConstellationData(h), domains as [{key, name, examPct}].
  //    mastery null = untouched; the 'novice' tier with a score is weak.
  function _iosMapModel(stars, domains) {
    var STATUS = { mastered: 'mastered', proficient: 'proficient', developing: 'developing' };
    var tile = function (s) {
      var st = s.mastery === null || s.mastery === undefined ? 'untouched' : (STATUS[s.tier] || 'weak');
      return { topic: s.topic, status: st, pct: st === 'untouched' ? null : s.mastery, attempts: s.attempts || 0, lastDays: st === 'untouched' ? null : s.lastDays };
    };
    var rows = domains.map(function (d) {
      return { key: d.key, name: d.name, examPct: d.examPct, tiles: stars.filter(function (s) { return s.domain === d.key; }).map(tile) };
    });
    var all = [];
    rows.forEach(function (r) { all = all.concat(r.tiles); });
    var rank = function (status) { return all.filter(function (t) { return t.status === status; }).sort(function (a, b) { return a.pct - b.pct; }); };
    return {
      studied: all.filter(function (t) { return t.status !== 'untouched'; }).length,
      total: all.length,
      mastered: all.filter(function (t) { return t.status === 'mastered'; }).length,
      weakest: rank('weak').concat(rank('developing')).slice(0, 3).map(function (t) { return t.topic; }),
      rows: rows
    };
  }

  // ── Analytics model (pure): D from analytics.js _anaBentoData(h) (null with no history), the Map model,
  //    and the Hands-on data from _anaDrillsGroupData().
  function _iosAnalyticsModel(D, map, drills) {
    var pages = ['Readiness', 'Map', 'Trends', 'Domains', 'Activity', 'Wins'].map(function (l) { return { key: l.toLowerCase(), label: l }; });
    if (!D) return { empty: true, pages: pages, map: map };
    var doms = D.domains.slice().sort(function (a, b) {
      var au = a.questions > 0 ? 1 : 0, bu = b.questions > 0 ? 1 : 0;
      return (au - bu) || (a.accuracy - b.accuracy) || (a.idx - b.idx);
    });
    var weakest = doms.filter(function (d) { return d.questions > 0; })[0];
    return {
      empty: false, pages: pages,
      readiness: D.readiness,
      map: map,
      trends: { passTrend: D.passTrend, difficulty: D.difficulty, examVsQuiz: D.examVsQuiz },
      domains: { rows: doms.map(function (d) { return Object.assign({}, d, { weakest: d === weakest }); }), why: D.whyScore, slips: D.wrongPatterns },
      activity: { streak: D.streak, heatmap: D.heatmap },
      wins: { badges: D.milestones, handsOn: drills || { groups: [], earned: 0, total: 0 } }
    };
  }

  window._iosMapModel = _iosMapModel;
  window._iosAnalyticsModel = _iosAnalyticsModel;
})();
