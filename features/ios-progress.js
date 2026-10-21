// features/ios-progress.js — Lift B1: the June CertAnvil E2E Progress screen at phone width.
// Design: branch feat/cert-ios-e2e, mockups/cert-ios-progress.html. Spec: docs/superpowers/specs/2026-10-21-ios-lift-b1-design.md
(function () {
  'use strict';

  // ── Model (pure, UAT vm-testable): rows from progress.js _buildProgressRows(), domains as
  //    [{key, name, examPct}], state {filter, sort}. Buckets match app.js _bucketOf.
  function _iosProgressModel(rows, domains, state) {
    var st = state || {};
    var filter = st.filter || 'all', sort = st.sort === 'best' ? 'best' : 'worst';
    var studied = rows.filter(function (r) { return r.pct !== null; });
    var untouched = rows.filter(function (r) { return r.pct === null; });
    var nameOf = {};
    domains.forEach(function (d) { nameOf[d.key] = d.name; });
    var byLabel = function (a, b) { return String(a.label || a.t).localeCompare(String(b.label || b.t)); };
    var low = function (a, b) { return (a.pct - b.pct) || byLabel(a, b); };
    var mean = function (list) { return list.length ? Math.round(list.reduce(function (n, r) { return n + r.pct; }, 0) / list.length) : null; };
    var withDomain = function (r) { return { t: r.t, label: r.label, pct: r.pct, domain: nameOf[r.domainKey] || '', obj: r.obj || '', daysSince: r.daysSince }; };
    var keep = function (r) {
      if (filter === 'weak') return r.pct < 60;
      if (filter === 'strong') return r.pct >= 80;
      if (filter === 'untouched') return false;
      return true;
    };

    var weakest = studied.slice().sort(low);
    var next = weakest.length ? withDomain(weakest[0]) : null;

    var pages = [{ key: 'overview', label: 'Overview' }];
    domains.forEach(function (d) {
      var all = rows.filter(function (r) { return r.domainKey === d.key; });
      var done = all.filter(function (r) { return r.pct !== null; });
      var shown = done.filter(keep).sort(low);
      if (sort === 'best') shown.reverse();
      pages.push({
        key: d.key, label: String(d.name).replace(/^Network(ing)?\s+/, ''), name: d.name, examPct: d.examPct,
        mastery: mean(done), studied: done.length, total: all.length, untouched: all.length - done.length,
        rows: shown.map(withDomain),
        untouchedRows: (filter === 'all' || filter === 'untouched') ? all.filter(function (r) { return r.pct === null; }).sort(byLabel).map(withDomain) : []
      });
    });
    pages.push({ key: 'insights', label: 'Insights' });

    return {
      next: next,
      stand: {
        coveredPct: rows.length ? Math.round(studied.length / rows.length * 100) : 0,
        avgMastery: mean(studied), seen: studied.length, total: rows.length,
        weak: studied.filter(function (r) { return r.pct < 60; }).length,
        untouched: untouched.length,
        strong: studied.filter(function (r) { return r.pct >= 80; }).length
      },
      pages: pages,
      insights: {
        weakest: weakest.slice(0, 5).map(withDomain),
        strong: studied.filter(function (r) { return r.pct >= 80; }).sort(function (a, b) { return (b.pct - a.pct) || byLabel(a, b); }).map(withDomain),
        untouched: untouched.slice().sort(byLabel).map(withDomain),
        untouchedCount: untouched.length,
        recent: studied.slice().sort(function (a, b) { return (b.lastDate - a.lastDate) || byLabel(a, b); }).map(withDomain)
      },
      filter: filter, sort: sort
    };
  }

  window._iosProgressModel = _iosProgressModel;
})();
