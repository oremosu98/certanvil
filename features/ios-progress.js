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

  // ── View (pure): the E2E markup with ip- classes. cert = {mark, name, code}.
  function _iosProgressHtml(m, cert) {
    var e = function (v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var ICON = {
      gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L16.5 2h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5a7 7 0 0 0 .1-1z"></path></svg>',
      theme: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path></svg>',
      bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"></path></svg>',
      go: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>',
      chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>',
      sort: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h12M3 12h9M3 18h5M17 8V18M17 18l3-3M17 18l-3-3"></path></svg>'
    };
    var tier = function (pct) { return pct === null ? 'untouched' : pct >= 80 ? 'strong' : pct >= 60 ? 'partial' : 'weak'; };
    var fill = function (pct) {
      if (pct === null) return '';
      var t = tier(pct), cls = t === 'strong' ? ' class="ip-pass"' : t === 'weak' ? ' class="ip-miss"' : '';
      return '<span' + cls + ' style="width:' + (t === 'weak' ? Math.max(pct, 4) : pct) + '%"></span>';
    };
    var pctTxt = function (pct) { return pct === null ? '--' : pct + '%'; };
    var ago = function (d) { return d == null ? '' : d <= 0 ? 'Today' : d === 1 ? '1 day ago' : d + ' days ago'; };
    var row = function (r) {
      return '<button class="ip-trow ip-' + tier(r.pct) + '" type="button" data-act="drill" data-t="' + e(r.t) + '"><span class="ip-tdot"></span>'
        + '<span class="ip-tnm">' + e(r.label) + '</span><span class="ip-bar ip-tbar">' + fill(r.pct) + '</span><span class="ip-tval">' + pctTxt(r.pct) + '</span></button>';
    };
    var lrow = function (r, right) {
      return '<button class="ip-lrow ip-' + tier(r.pct) + '" type="button" data-act="drill" data-t="' + e(r.t) + '"><span class="ip-tdot"></span>'
        + '<span class="ip-lt"><b>' + e(r.label) + '</b><span>' + e(r.domain) + '</span></span>' + right + '</button>';
    };
    var h = '<div class="ip-topbar"><span class="ip-tb-mark">' + e(cert.mark) + '</span>'
      + '<span class="ip-tb-name"><b>' + e(cert.name) + '</b><span>' + e(cert.code) + '</span></span>'
      + '<button class="ip-tb-set" type="button" data-act="settings" aria-label="Settings">' + ICON.gear + '</button>'
      + '<button class="ip-app-theme" type="button" data-act="theme" aria-label="Switch theme">' + ICON.theme + '</button></div>'
      + '<div class="ip-view-switch" role="group" aria-label="View"><button type="button" data-view="progress" aria-pressed="true">Progress</button>'
      + '<button type="button" data-view="analytics" aria-pressed="false">Analytics</button></div>';
    h += '<div class="ip-seg" role="tablist" aria-label="Progress sections">' + m.pages.map(function (p, i) {
      return '<button class="ip-chip' + (i === 0 ? ' ip-on' : '') + '" type="button" role="tab" aria-selected="' + (i === 0) + '" data-page="' + i + '">' + e(p.label) + '</button>';
    }).join('') + '</div><div class="ip-pager">';
    m.pages.forEach(function (p, i) {
      h += '<section class="ip-page" data-page="' + i + '" role="tabpanel" aria-label="' + e(p.label) + '">';
      if (p.key === 'overview') {
        var n = m.next, s = m.stand;
        if (n) {
          h += '<div class="ip-hero ip-reveal"><span class="ip-hero-kick">' + ICON.bolt + 'Drill this next</span><h2 class="ip-hero-topic">' + e(n.label) + '</h2>'
            + '<span class="ip-hero-obj">' + e(n.domain) + (n.obj ? ' · Objective ' + e(n.obj) : '') + '</span>'
            + '<p class="ip-hero-line">Your weakest studied topic. Drilling here moves your readiness fastest per minute.</p>'
            + '<div class="ip-hero-foot"><span class="ip-hero-mast"><b>' + n.pct + '%</b><span>Mastery</span></span>'
            + '<button class="ip-hero-btn" type="button" data-act="start" data-t="' + e(n.t) + '">Start drill' + ICON.go + '</button></div></div>';
        }
        var off = (194.8 * (1 - s.coveredPct / 100)).toFixed(1);
        h += '<div class="ip-stand ip-reveal"><div class="ip-stand-top"><div class="ip-st-cell ip-st-ring"><div class="ip-ring">'
          + '<svg viewBox="0 0 72 72" aria-hidden="true"><circle class="ip-track" cx="36" cy="36" r="31" fill="none" stroke-width="5"></circle>'
          + '<circle class="ip-fill" cx="36" cy="36" r="31" fill="none" stroke-width="5" stroke-dasharray="194.8" stroke-dashoffset="194.8" data-off="' + off + '"></circle></svg>'
          + '<b class="ip-ring-n">' + s.coveredPct + '%</b></div><span class="ip-st-l">Covered</span></div>'
          + '<div class="ip-st-cell"><b class="ip-st-v">' + pctTxt(s.avgMastery) + '</b><span class="ip-st-l">Avg mastery</span></div>'
          + '<div class="ip-st-cell"><b class="ip-st-v">' + s.seen + '<small> of ' + s.total + '</small></b><span class="ip-st-l">Topics seen</span></div></div>'
          + '<div class="ip-stand-counts"><div class="ip-count ip-weak"><b>' + s.weak + '</b><span>Weak</span></div>'
          + '<div class="ip-count ip-untouched"><b>' + s.untouched + '</b><span>Untouched</span></div>'
          + '<div class="ip-count ip-strong"><b>' + s.strong + '</b><span>Strong</span></div></div></div>';
        h += '<div class="ip-toolbar ip-reveal"><div class="ip-ftabs" role="group" aria-label="Filter topics">'
          + [['all', 'All'], ['weak', 'Weak'], ['untouched', 'Untouched'], ['strong', 'Strong']].map(function (f) {
            return '<button class="ip-ftab" type="button" data-filter="' + f[0] + '" aria-pressed="' + (m.filter === f[0]) + '">' + f[1] + '</button>';
          }).join('') + '<span class="ip-ftab-ink" aria-hidden="true"></span></div>'
          + '<button class="ip-fsort" type="button" data-act="sort" aria-label="Sort topics">' + ICON.sort + '<span>' + (m.sort === 'best' ? 'Best first' : 'Worst first') + '</span></button></div>';
      } else if (p.key === 'insights') {
        var ins = m.insights;
        if (ins.weakest.length) h += '<div class="ip-sect ip-reveal">Your weakest topics</div><div class="ip-listcard ip-reveal">'
          + ins.weakest.map(function (r) { return lrow(r, '<span class="ip-lpct">' + r.pct + '%</span>'); }).join('') + '</div>';
        if (ins.strong.length) h += '<div class="ip-sect ip-reveal">Strong and mastered</div><div class="ip-listcard ip-reveal">'
          + ins.strong.map(function (r) { return lrow(r, '<span class="ip-lchip">' + r.pct + '% mastered</span>'); }).join('') + '</div>';
        if (ins.untouchedCount) h += '<div class="ip-sect ip-reveal">Untouched · ' + ins.untouchedCount + ' never studied</div><div class="ip-cloud ip-reveal">'
          + ins.untouched.map(function (r) { return '<button class="ip-tag" type="button" data-act="drill" data-t="' + e(r.t) + '">' + e(r.label) + '</button>'; }).join('') + '</div>';
        if (ins.recent.length) h += '<div class="ip-sect ip-reveal">Recently studied</div><div class="ip-strip ip-reveal">'
          + ins.recent.map(function (r) {
            return '<button class="ip-rcard" type="button" data-act="drill" data-t="' + e(r.t) + '"><b>' + e(r.label) + '</b><span class="ip-bar ip-rbar">' + fill(r.pct) + '</span>'
              + '<span class="ip-rmeta"><span class="ip-rpct' + (tier(r.pct) === 'weak' ? ' ip-miss-t' : '') + '">' + r.pct + '%</span><span class="ip-rago">' + ago(r.daysSince) + '</span></span></button>';
          }).join('') + '</div>';
      } else {
        var mt = p.mastery;
        h += '<div class="ip-sect ip-reveal">' + e(p.name) + '</div><div class="ip-domain ip-open ip-reveal">'
          + '<button class="ip-dhead" type="button" data-act="dhead" aria-expanded="true"><span class="ip-dhead-main">'
          + '<span class="ip-dhead-row"><b>' + e(p.name) + '</b><span class="ip-exam">' + p.examPct + '% of exam</span></span>'
          + '<span class="ip-dhead-bar"><span class="ip-bar">' + fill(mt) + '</span><span class="ip-dhead-pct">' + pctTxt(mt) + '</span></span>'
          + '<span class="ip-dhead-count">' + p.studied + ' of ' + p.total + ' studied · ' + p.untouched + ' untouched</span></span>'
          + '<span class="ip-dchev">' + ICON.chev + '</span></button><div class="ip-dbody">' + p.rows.map(row).join('');
        if (p.untouchedRows.length) {
          var only = m.filter === 'untouched';
          h += '<button class="ip-disclose' + (only ? ' ip-open' : '') + '" type="button" data-act="disclose" aria-expanded="' + only + '">' + ICON.chev
            + p.untouchedRows.length + ' untouched topic' + (p.untouchedRows.length === 1 ? '' : 's') + '</button>'
            + '<div class="ip-untouched-list' + (only ? ' ip-open' : '') + '">' + p.untouchedRows.map(row).join('') + '</div>';
        }
        if (!p.rows.length && !p.untouchedRows.length) h += '<p class="ip-none">No topics match this filter.</p>';
        h += '</div></div>';
      }
      h += '</section>';
    });
    return h + '</div>';
  }

  // ── Mount: phone width only, into #ios-progress. Reads the rows renderProgressPage just built.
  var _ipState = { filter: 'all', sort: 'worst' };
  function _ipIsPhone() { return !!(window.matchMedia && window.matchMedia('(max-width: 899px)').matches); }
  function _ipCert() {
    var id = (typeof CURRENT_CERT === 'string' && CURRENT_CERT) || 'netplus';
    var MARKS = { netplus: 'N+', secplus: 'S+', 'aplus-core1': 'A+', 'aplus-core2': 'A+', az900: 'AZ', ai900: 'AI', sc900: 'SC', clfc02: 'CLF' };
    var raw = (typeof CERT_PACK === 'object' && CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.name) || 'CompTIA Network+';
    return { mark: MARKS[id] || 'CA', name: String(raw).replace(/^(CompTIA|Microsoft|Amazon|AWS)\s+/, ''), code: (typeof CERT_CODE === 'string' && CERT_CODE) || 'N10-009' };
  }
  function _ipDomains() {
    var w = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS) || {}, l = (typeof DOMAIN_LABELS === 'object' && DOMAIN_LABELS) || {};
    return Object.keys(w).map(function (k) { return { key: k, name: l[k] || k, examPct: Math.round(w[k] * 100) }; });
  }
  // Same order as lift-shell navTo(): paint the page's content, then show it (a bare showPage only swaps pages).
  function _ipNav(name) {
    var R = { analytics: 'renderAnalytics', settings: 'renderSettingsPage' };
    try { if (typeof window[R[name]] === 'function') window[R[name]](); } catch (_) {}
    if (typeof window.showPage === 'function') window.showPage(name);
  }
  function _ipReduce() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  function renderIosProgress(keep) {
    var root = document.getElementById('ios-progress');
    if (!root) return false;
    if (!_ipIsPhone()) { if (root.innerHTML) root.innerHTML = ''; return false; }
    var rows = (typeof progressState === 'object' && progressState && progressState.rows) || [];
    var pager = root.querySelector('.ip-pager'), left = keep && pager ? pager.scrollLeft : 0;
    root.classList.toggle('ip-static', !!keep);
    root.innerHTML = _iosProgressHtml(_iosProgressModel(rows, _ipDomains(), _ipState), _ipCert());
    _ipWire(root, left, !!keep);
    return true;
  }

  function _ipWire(root, left, keep) {
    var reduce = _ipReduce();
    var pager = root.querySelector('.ip-pager'), chips = [].slice.call(root.querySelectorAll('.ip-chip'));
    var pages = [].slice.call(root.querySelectorAll('.ip-page'));
    var setActive = function (i) {
      chips.forEach(function (c, j) { c.classList.toggle('ip-on', j === i); c.setAttribute('aria-selected', String(j === i)); });
      if (chips[i] && chips[i].scrollIntoView) chips[i].scrollIntoView({ inline: 'center', block: 'nearest' });
    };
    if (left) { pager.scrollLeft = left; setActive(Math.round(left / (pager.clientWidth || 1))); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting && en.intersectionRatio >= 0.6) setActive(+en.target.getAttribute('data-page')); });
      }, { root: pager, threshold: 0.6 });
      pages.forEach(function (p) { io.observe(p); });
    }
    // coverage ring sweeps to its value (BRAND §6 chart sweep); filters re-render without replaying it
    var ring = root.querySelector('.ip-ring .ip-fill');
    if (ring) {
      var off = ring.getAttribute('data-off');
      if (reduce || keep) ring.style.strokeDashoffset = off;
      else requestAnimationFrame(function () { requestAnimationFrame(function () { ring.style.strokeDashoffset = off; }); });
    }
    // one accent underline under the selected filter (transform only); placed without a transition first
    var bar = root.querySelector('.ip-ftabs');
    if (bar) {
      var ink = bar.querySelector('.ip-ftab-ink'), on = bar.querySelector('.ip-ftab[aria-pressed="true"]') || bar.querySelector('.ip-ftab');
      requestAnimationFrame(function () {
        ink.style.transform = 'translateX(' + on.offsetLeft + 'px) scaleX(' + on.offsetWidth + ')';
        requestAnimationFrame(function () { ink.classList.add('ip-ready'); });
      });
    }
    root.onclick = function (ev) {
      var b = ev.target.closest('button'); if (!b || !root.contains(b)) return;
      var act = b.getAttribute('data-act');
      if (b.hasAttribute('data-page')) { var pg = pages[+b.getAttribute('data-page')]; if (pg) pager.scrollTo({ left: pg.offsetLeft, behavior: reduce ? 'auto' : 'smooth' }); return; }
      if (b.hasAttribute('data-view')) { if (b.getAttribute('data-view') === 'analytics') _ipNav('analytics'); return; }
      if (b.hasAttribute('data-filter')) {
        var f = b.getAttribute('data-filter'); if (f === _ipState.filter) return;
        _ipState.filter = f;
        var ink2 = root.querySelector('.ip-ftab-ink');
        root.querySelectorAll('.ip-ftab').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        if (ink2) ink2.style.transform = 'translateX(' + b.offsetLeft + 'px) scaleX(' + b.offsetWidth + ')';
        setTimeout(function () { renderIosProgress(true); }, reduce ? 0 : 220);
        return;
      }
      if (act === 'sort') { _ipState.sort = _ipState.sort === 'best' ? 'worst' : 'best'; renderIosProgress(true); return; }
      if (act === 'drill') { if (typeof window.drillTopic === 'function') window.drillTopic(b.getAttribute('data-t')); return; }
      if (act === 'start') { if (typeof window.focusTopic === 'function') window.focusTopic(b.getAttribute('data-t')); return; }
      if (act === 'settings') { _ipNav('settings'); return; }
      if (act === 'theme') { if (typeof toggleTheme === 'function') toggleTheme(); return; }
      if (act === 'dhead') { var d = b.closest('.ip-domain'), o = d.classList.toggle('ip-open'); b.setAttribute('aria-expanded', String(o)); return; }
      if (act === 'disclose') { var o2 = b.classList.toggle('ip-open'); b.setAttribute('aria-expanded', String(o2)); if (b.nextElementSibling) b.nextElementSibling.classList.toggle('ip-open', o2); }
    };
  }

  window._iosProgressModel = _iosProgressModel;
  window._iosProgressHtml = _iosProgressHtml;
  window.renderIosProgress = renderIosProgress;
  // leaving phone width clears the screen so the desktop page shows again
  if (window.matchMedia) { var mq = window.matchMedia('(max-width: 899px)'); var onMq = function () { var p = document.getElementById('page-progress'); if (!mq.matches || (p && p.classList.contains('active'))) renderIosProgress(); }; if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq); }
})();
