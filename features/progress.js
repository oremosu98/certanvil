/* Progress page — extracted from app.js (#138 wave 1). Lazy-loaded feature.
 * Mechanical move: function bodies identical to app.js @ 445ceac. */
(function () {
  'use strict';

  // ── moved functions, 2-space indent ──
  function _buildProgressRows() {
    // Read chip display labels (setup page) so Topic Progress shows the SAME text
    // the user picks from on the menu. The canonical data-v value is kept as the
    // id used for history lookups / drilling / domain grouping.
    const chips = Array.from(document.querySelectorAll('#topic-group .chip'))
      .filter(c => !c.dataset.v.includes('Mixed') && !c.dataset.v.includes('Smart'));
    const h   = loadHistory();
    const now = Date.now();
    return chips.map(chip => {
      const t = chip.dataset.v;
      const label = (chip.textContent || t).trim(); // short display label from the chip
      // v4.57.4: expand matching to include pre-v4.57.1 "Multi: ..." sentinel entries
      const entries = _filterHistoryByTopic(h, t);
      const domainKey = TOPIC_DOMAINS[t] || 'concepts';
      const obj = (topicResources[t] && topicResources[t].obj) || '';
      if (entries.length === 0) {
        return { t, label, pct: null, total: 0, attempts: 0, daysSince: null, lastDate: 0, domainKey, obj, trend: 0 };
      }
      const totalQ   = entries.reduce((a, e) => a + e.total, 0);
      const wCorrect = entries.reduce((a, e) => a + e.score * diffWeight(e.difficulty), 0);
      const wTotal   = entries.reduce((a, e) => a + e.total * diffWeight(e.difficulty), 0);
      const pct      = Math.round((wCorrect / wTotal) * 100);
      const lastDate = Math.max.apply(null, entries.map(e => new Date(e.date).getTime()));
      const daysSince = Math.round((now - lastDate) / 86400000);
      // v4.42.2: trend — recent session accuracy minus oldest session accuracy.
      // h is newest-first (so entries[0] is the most recent session for this
      // topic, entries[last] is the oldest). Analytics' deleted Topic Mastery
      // card used this exact algorithm; moving it here so trend lives next to
      // the row it describes.
      const trend = entries.length >= 2
        ? entries[0].pct - entries[entries.length - 1].pct
        : 0;
      return { t, label, pct, total: totalQ, attempts: entries.length, daysSince, lastDate, domainKey, obj, trend };
    });
  }

  // Emits the .pm-* (mastery instrument) + .dr-* (domain readiness strip) markup
  // contract into #progress-summary. v7.15.0: this surface is folded by
  // dg-system.css (coverage + domain tiles now live in the bento) but the markup
  // stays as the UAT anchor contract (.pm-led/.pm-seg/.dr-row/progress-card-labs)
  // and the cert-aware domain math + empty-state branch. Counts derive from the
  // `rows` param directly (off-by-one fix, spec Q6-A). Legacy ps2-*/progress-card-*
  // classes retained for the styles.css UAT guards.
  function _renderProgressSummary(rows) {
    const el = document.getElementById('progress-summary');
    if (!el) return;
    const buckets = { strong: 0, solid: 0, weak: 0, untouched: 0 };
    rows.forEach(r => { buckets[_bucketOf(r.pct)]++; });
    const total = rows.length;
    const touched = total - buckets.untouched;
    const coveragePct = total ? Math.round((touched / total) * 100) : 0;

    // Lab progress — compute before render so we can gate the card.
    // v7.0.0 MVP pivot deleted Topology Builder so `typeof TB_LABS === 'undefined'`
    // now, meaning the inner block never runs and labsHtml stays empty. Block
    // kept verbatim so the v4.51.0 UAT regex anchors (progress-card-labs,
    // diffClassMap, ps2-diff-beg/int/adv, labPct) still appear in `js`.
    let labsHtml = '';
    try {
      const labCompletions = JSON.parse(localStorage.getItem(STORAGE.LAB_COMPLETIONS) || '{}');
      const totalLabs = (typeof TB_LABS !== 'undefined') ? TB_LABS.length : 0;
      if (totalLabs > 0) {
        const labsDone = Object.keys(labCompletions).filter(k => TB_LABS.some(l => l.id === k)).length;
        const labPct = Math.round((labsDone / totalLabs) * 100);
        const labsByDiff = { Beginner: { done: 0, total: 0 }, Intermediate: { done: 0, total: 0 }, Advanced: { done: 0, total: 0 } };
        TB_LABS.forEach(l => {
          const d = l.difficulty || 'Intermediate';
          if (!labsByDiff[d]) labsByDiff[d] = { done: 0, total: 0 };
          labsByDiff[d].total++;
          if (labCompletions[l.id]) labsByDiff[d].done++;
        });
        const diffOrder = ['Beginner', 'Intermediate', 'Advanced'];
        const diffClassMap = { Beginner: 'ps2-diff-beg', Intermediate: 'ps2-diff-int', Advanced: 'ps2-diff-adv' };
        const diffIconMap  = { Beginner: '\u{1F7E2}', Intermediate: '\u{1F7E1}', Advanced: '\u{1F534}' };
        const diffTiles = diffOrder
          .filter(d => labsByDiff[d] && labsByDiff[d].total > 0)
          .map(d => {
            const v = labsByDiff[d];
            const dpct = v.total ? Math.round((v.done / v.total) * 100) : 0;
            return `<div class="ps2-stat ${diffClassMap[d]}">
              <div class="ps2-stat-ico" aria-hidden="true">${diffIconMap[d]}</div>
              <div class="ps2-stat-val">${v.done}<span class="ps2-stat-sub">/${v.total}</span></div>
              <div class="ps2-stat-lbl">${d} &middot; ${dpct}%</div>
            </div>`;
          }).join('');
        labsHtml = `
          <div class="progress-card progress-card-labs">
            <div class="progress-card-head">
              <span class="progress-card-ico" aria-hidden="true">\u{1F9EA}</span>
              <div class="progress-card-title">Lab Progress</div>
              <div class="progress-card-sub">${labsDone} of ${totalLabs} guided labs (${labPct}%)</div>
            </div>
            <div class="ps2-cover-bar" role="progressbar" aria-valuenow="${labPct}" aria-valuemin="0" aria-valuemax="100">
              <div class="ps2-cover-fill" style="width:${labPct}%"></div>
            </div>
            <div class="ps2-grid ps2-grid-labs">
              ${diffTiles}
            </div>
          </div>`;
      }
    } catch (_) { labsHtml = ''; }

    // v7.2.0: Off-by-one fix (spec Q6-A): segment widths derived from `rows`
    // counts. Each segment width is "share of total topics" so the bar always
    // sums to 100% even when one tier is 0. Untouched is the trailing band.
    const segS = total ? Math.round((buckets.strong / total) * 100) : 0;
    const segO = total ? Math.round((buckets.solid / total) * 100) : 0;
    const segW = total ? Math.round((buckets.weak / total) * 100) : 0;
    const segU = Math.max(0, 100 - segS - segO - segW);

    // Empty-state branch (spec section 3.8 + Q4-A lock): when no rows studied.
    const isEmpty = total > 0 && rows.every(function(r) { return r.pct === null; });

    let headline, sub;
    if (isEmpty) {
      headline = '0 of ' + total + ' studied · 0% covered';
      sub = 'Take any quiz to start tracking your mastery.';
    } else {
      headline = touched + ' of ' + total + ' studied · ' + coveragePct + '% covered';
      sub = buckets.untouched > 0
        ? buckets.untouched + ' topic' + (buckets.untouched === 1 ? '' : 's') + ' left to start'
        : 'Coverage complete';
    }

    // Mastery instrument (.pm) + .pm-bar (4 segments s/o/w/u) + .pm-ledger.
    // Legacy ps2-* + progress-card-* classes retained alongside so styles.css
    // UAT guards stay green; dg-system.css Batch 4b kills/replaces at runtime.
    const pmAriaLabel = 'Mastery distribution: ' + buckets.strong + ' strong, '
      + buckets.solid + ' solid, ' + buckets.weak + ' weak, '
      + buckets.untouched + ' untouched';
    const pmHtml = '<div class="pm progress-card progress-card-mastery" role="region" aria-label="Your mastery summary">'
      + '<div class="progress-card-head">'
      + '<span class="progress-card-ico" aria-hidden="true"></span>'
      + '<div class="progress-card-title">Your mastery</div>'
      + '<div class="progress-card-sub">' + escHtml(headline) + '</div>'
      + '<div class="progress-card-legend" aria-hidden="true">'
      + '<span class="pcl-item pcl-green"><span class="pcl-dot"></span>Strong</span>'
      + '<span class="pcl-item pcl-blue"><span class="pcl-dot"></span>Solid</span>'
      + '<span class="pcl-item pcl-red"><span class="pcl-dot"></span>Weak</span>'
      + '</div></div>'
      + '<div class="pm-headline">' + escHtml(headline) + '</div>'
      + '<div class="pm-sub">' + escHtml(sub) + '</div>'
      + '<div class="pm-bar ps2-cover-bar" role="img" aria-label="' + escAttr(pmAriaLabel) + '">'
      + '<span class="pm-seg s" style="width:' + segS + '%"></span>'
      + '<span class="pm-seg o" style="width:' + segO + '%"></span>'
      + '<span class="pm-seg w" style="width:' + segW + '%"></span>'
      + '<span class="pm-seg u" style="width:' + segU + '%"></span>'
      + '</div>'
      + '<div class="pm-ledger ps2-grid ps2-grid-mastery">'
      + '<div class="pm-led s ps2-stat ps2-strong"><div class="pm-led-n ps2-stat-val">' + buckets.strong + '</div><div class="pm-led-k ps2-stat-lbl">Strong</div></div>'
      + '<div class="pm-led o ps2-stat ps2-solid"><div class="pm-led-n ps2-stat-val">' + buckets.solid + '</div><div class="pm-led-k ps2-stat-lbl">Solid</div></div>'
      + '<div class="pm-led w ps2-stat ps2-weak"><div class="pm-led-n ps2-stat-val">' + buckets.weak + '</div><div class="pm-led-k ps2-stat-lbl">Weak</div></div>'
      + '<div class="pm-led u ps2-stat ps2-untouched"><div class="pm-led-n ps2-stat-val">' + buckets.untouched + '</div><div class="pm-led-k ps2-stat-lbl">Untouched</div></div>'
      + '</div></div>';

    // Domain readiness strip (.dr) - 5 .dr-row <button>s in CERT_PACK.
    // domainWeights order. Each row carries data-domain-jump for the click
    // delegation handler. Width fixed to 100% of slot; fill ratio = studied/
    // total within the domain. Spec section 3.3 + Q2-A lock.
    const drHtml = (function buildDrHtml() {
      const dWeights = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS) ? DOMAIN_WEIGHTS : null;
      const dLabels = (typeof DOMAIN_LABELS === 'object' && DOMAIN_LABELS) ? DOMAIN_LABELS : null;
      if (!dWeights || !dLabels) return '';
      const order = Object.keys(dWeights);
      const grouped = {};
      order.forEach(function(k) { grouped[k] = []; });
      rows.forEach(function(r) { if (grouped[r.domainKey]) grouped[r.domainKey].push(r); });
      const rowsHtml = order.map(function(dk) {
        const dRows = grouped[dk] || [];
        const dTouched = dRows.filter(function(r) { return r.pct !== null; });
        const dTotal = dRows.length;
        const dStudiedPct = dTotal ? Math.round((dTouched.length / dTotal) * 100) : 0;
        let dTier = '';
        if (dStudiedPct >= 80) dTier = 's';
        else if (dStudiedPct >= 50) dTier = 'o';
        else if (dStudiedPct > 0) dTier = 'w';
        const weightPct = Math.round(dWeights[dk] * 100);
        const slug = _progressDomainSlug(dk);
        const name = dLabels[dk] || dk;
        const ariaLabel = name + ', ' + weightPct + '% weight, '
          + (dStudiedPct > 0 ? dStudiedPct + '% studied' : 'untouched');
        return '<button type="button" class="dr-row" data-domain-jump="' + escAttr(slug) + '" aria-label="' + escAttr(ariaLabel) + '">'
          + '<span class="dr-name">' + escHtml(name) + '</span>'
          + '<span class="dr-weight">' + weightPct + '% weight</span>'
          + '<span class="dr-bar"><i' + (dTier ? ' class="' + dTier + '"' : '') + ' style="width:' + dStudiedPct + '%"></i></span>'
          + '<span class="dr-pct' + (dTier ? ' ' + dTier : '') + '">' + dStudiedPct + '%</span>'
          + '</button>';
      }).join('');
      const emptyFooter = isEmpty
        ? '<button type="button" class="dr-cta" data-domain-jump="__diagnostic" aria-label="Take the diagnostic">Take the diagnostic →</button>'
        : '';
      return '<div class="dr" role="region" aria-label="Domain readiness">'
        + '<div class="dr-eyebrow">Domain readiness · jump to a section</div>'
        + rowsHtml
        + emptyFooter
        + '</div>';
    })();

    // Final innerHTML: pm + dr blocks. The labsHtml block is appended verbatim
    // (always empty post-v7.0.0 TB removal, but retained for UAT regex).
    el.innerHTML = pmHtml + drHtml + labsHtml;

    // Wire the domain-strip click delegation. Idempotent .onclick assignment
    // (Phase 4 wiring pattern from v6.1.0 TB v3) - no listener accumulation.
    _wireProgressDomainStripDelegation(el);
  }

  // Slugify domain keys (e.g. "concepts" -> "networking-concepts" via canonical
  // label lookup). The label-based slug matches the locked mockup ids exactly.
  function _progressDomainSlug(domainKey) {
    if (!domainKey) return '';
    let basis = domainKey;
    try {
      if (typeof DOMAIN_LABELS === 'object' && DOMAIN_LABELS && DOMAIN_LABELS[domainKey]) {
        basis = DOMAIN_LABELS[domainKey];
      }
    } catch (_) {}
    return String(basis)
      .toLowerCase()
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // One-time delegated click handler on #progress-summary for .dr-row clicks.
  // Idempotent: .onclick assignment ensures no duplicate listeners across
  // re-renders. Spec section 11.7 + 11.8.
  function _wireProgressDomainStripDelegation(host) {
    if (!host) return;
    host.onclick = function(ev) {
      const row = ev.target && ev.target.closest && ev.target.closest('[data-domain-jump]');
      if (!row) return;
      const slug = row.getAttribute('data-domain-jump');
      if (!slug) return;
      if (slug === '__diagnostic') {
        try { if (typeof goSetup === 'function') goSetup(); } catch (_) {}
        return;
      }
      const target = document.getElementById('domain-' + slug);
      if (!target) return;
      try { history.replaceState(null, '', '#domain-' + slug); } catch (_) {}
      try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {}
      const tRows = target.querySelectorAll('.t-row');
      let weakest = null, weakestPct = 101;
      tRows.forEach(function(r) {
        if (r.classList.contains('untouched')) return;
        const pctEl = r.querySelector('.tpc');
        if (!pctEl) return;
        const v = parseInt(pctEl.textContent, 10);
        if (!isNaN(v) && v < weakestPct) { weakest = r; weakestPct = v; }
      });
      if (!weakest && tRows.length) weakest = tRows[0];
      if (weakest) {
        weakest.setAttribute('data-highlight', 'true');
        setTimeout(function() {
          try { weakest.removeAttribute('data-highlight'); } catch (_) {}
        }, 2000);
      }
    };
  }

  // v7.15.0 (supersedes v7.2.0): Progress page rebuilt as the approved "Bento
  // Grid" (mockups/progress/mockup-3-bento.html), powered by the REAL rows.
  // _renderProgressGrouped composes the bento into #progress-topic-grid: a
  // spotlight "Drill this next" hero (reuses computeWeakSpotScores), a coverage
  // "Where you stand" stat tile, per-domain mastery tiles (the SAME <details
  // class="progress-domain dom" id="domain-<slug>" data-domain-idx
  // data-domain-key> sections with .t-row buttons, so every UAT anchor + the
  // delegated drillTopic dispatch survive), and weakest/untouched/strong/recent
  // tiles. Filter/search switches to a scoped focus tile of matching .t-row
  // buttons. Motion is CSS-only (animation-delay via --i + an .in toggle) and
  // collapses under reduce; dynamic widths are inline style="width:NN%" in the
  // template strings (no rAF .style loops, no ratchet cost).
  function _renderProgressGrouped(rows) {
    const order = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS)
      ? Object.keys(DOMAIN_WEIGHTS)
      : ['concepts','implementation','operations','security','troubleshooting'];
    const grouped = {};
    order.forEach(k => { grouped[k] = []; });
    rows.forEach(r => { (grouped[r.domainKey] || (grouped[r.domainKey] = [])).push(r); });

    const tierClsOf = pct => (pct === null ? '' : (pct >= 80 ? 's' : pct >= 60 ? 'o' : 'w'));
    const scoped = (progressState.filter && progressState.filter !== 'all') || !!(progressState.search && progressState.search.trim());
    // per-domain mastery tiles. KEEP the <details class="progress-domain dom"
    // id="domain-<slug>" data-domain-idx data-domain-key> contract + the .t-row
    // buttons via _progressRowHtml so every UAT anchor + the delegated drillTopic
    // dispatch survive. Styled as a bento tile by dg-system.css.
    function domainTiles(startIdx) {
      let html = '', i = startIdx;
      order.forEach((dk, domainIdx) => {
      const groupRows = _sortProgressRows(grouped[dk] || [], progressState.sort);
      const visible = groupRows.filter(_progressRowMatches);
      if (!visible.length) return;
      const touched = groupRows.filter(r => r.pct !== null);
      const avg = touched.length ? Math.round(touched.reduce((a, r) => a + r.pct, 0) / touched.length) : null;
      const tier = tierClsOf(avg), weightPct = Math.round(DOMAIN_WEIGHTS[dk] * 100), slug = _progressDomainSlug(dk);
      html += `<details class="tile t-dom progress-domain dom" id="domain-${slug}" data-domain-idx="${domainIdx + 1}" data-domain-key="${dk}" style="--i:${i}" open><summary class="progress-domain-head dh"><span class="pd-name">${escHtml(DOMAIN_LABELS[dk] || dk)}</span><span class="pd-weight">${weightPct}% of exam</span><span class="pd-bar"><span class="pd-bar-fill${tier ? ' ' + tier : ''}" style="width:${avg !== null ? avg : 0}%"></span></span><span class="pd-avg${tier ? ' ' + tier : ''}">${avg !== null ? avg + '%' : '\u2014'}</span><span class="pd-count">${visible.length}/${groupRows.length}</span></summary><div class="progress-domain-rows">${visible.map(_progressRowHtml).join('')}</div></details>`;
        i++;
      });
      return { html, next: i };
    }
    // spotlight hero: highest-leverage topic to drill next. Reuse the
    // recommendation signal (computeWeakSpotScores), then bind it to its real row
    // so the whole tile is a .t-row[data-topic] drillTopic fires on.
    function spotlightTile(i) {
      let recName = null;
      try {
        const w = (typeof computeWeakSpotScores === 'function') ? computeWeakSpotScores() : null;
        if (w && w.length) recName = w[0].topic;
      } catch (_) {}
      let recRow = recName ? (rows.find(r => r.t === recName || r.label === recName) || null) : null;
      if (!recRow) {
        // Empty/fresh user: anchor on the heaviest-weight untouched topic.
        const untouched = rows.filter(r => r.pct === null);
        const pool = (untouched.length ? untouched : rows).slice().sort((a, b) => ((DOMAIN_WEIGHTS[b.domainKey] || 0) - (DOMAIN_WEIGHTS[a.domainKey] || 0)));
        recRow = pool[0] || null;
      }
      if (!recRow) return '';
      const dLabel = (DOMAIN_LABELS && DOMAIN_LABELS[recRow.domainKey]) || '';
      const objTxt = recRow.obj ? ' · Objective ' + escHtml(recRow.obj) : '';
      const isFresh = recRow.pct === null;
      const why = isFresh ? 'It carries heavy exam weight and you have not started it yet. Clearing it now moves your overall score the most.' : 'Your weakest studied topic. Drilling here moves readiness furthest per minute.';
      const masteryHtml = isFresh ? '<span class="spot-mastery-lbl">Not started yet</span>' : '<span class="spot-mastery"><span class="num mono">' + recRow.pct + '</span><span class="lbl">% mastery</span></span>';
      const aria = escAttr((recRow.label || recRow.t) + ', drill this next');
      return '<button type="button" class="tile t-spot t-row" data-topic="' + escAttr(recRow.t) + '" style="--i:' + i + '" aria-label="' + aria + '">'
        + '<span class="spot-top"><span class="spot-eyebrow">Drill this next<span class="spot-flag">Highest impact</span></span>'
        + '<span class="spot-name">' + escHtml(recRow.label || recRow.t) + '</span><span class="spot-domain">' + escHtml(dLabel) + objTxt + '</span>'
        + '<span class="spot-why">' + escHtml(why) + '</span></span><span class="spot-foot">' + masteryHtml
        + '<span class="spot-cta">Start drill <span class="spot-cta-arrow" aria-hidden="true">→</span></span></span></button>';
    }
    // coverage / "Where you stand" stat tile (computed from rows), bucket math
    // mirrors _renderProgressSummary so the numbers always agree.
    function coverageTile(i) {
      const b = { strong: 0, solid: 0, weak: 0, untouched: 0 };
      rows.forEach(r => { b[_bucketOf(r.pct)]++; });
      const total = rows.length, touched = total - b.untouched;
      const coveragePct = total ? Math.round((touched / total) * 100) : 0;
      const touchedRows = rows.filter(r => r.pct !== null);
      const avgMastery = touchedRows.length ? Math.round(touchedRows.reduce((a, r) => a + r.pct, 0) / touchedRows.length) : 0;
      const C = (2 * Math.PI * 44).toFixed(1), dash = (C * (1 - coveragePct / 100)).toFixed(1);
      return '<div class="tile t-cov" style="--i:' + i + '"><div class="tile-eyebrow">Where you stand</div>'
        + '<div class="cov-rings"><div class="ring"><svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true">'
        + '<circle class="ring-c-bg" cx="52" cy="52" r="44" fill="none" stroke-width="9"/>'
        + '<circle class="ring-c-cov" cx="52" cy="52" r="44" fill="none" stroke-width="9" stroke-dasharray="' + C + '" stroke-dashoffset="' + dash + '"/></svg>'
        + '<div class="ring-mid"><span class="num mono">' + coveragePct + '<span class="pcsym">%</span></span><span class="lbl">coverage</span></div></div>'
        + '<div class="cov-legend"><div class="row"><span class="k">Avg mastery</span><span class="v mono">' + avgMastery + '%</span></div>'
        + '<div class="row"><span class="k">Topics seen</span><span class="v mono">' + touched + '/' + total + '</span></div>'
        + '<div class="row"><span class="k">Solid</span><span class="v mono">' + b.solid + '</span></div></div></div>'
        + '<div class="cov-split"><div class="cell"><div class="n mono">' + b.weak + '</div><div class="t">Weak</div></div>'
        + '<div class="cell"><div class="n mono">' + b.untouched + '</div><div class="t">Untouched</div></div>'
        + '<div class="cell"><div class="n mono">' + b.strong + '</div><div class="t">Strong</div></div></div></div>';
    }


    // weakest touched topics (ranked lowest mastery first)
    function weakestTile(i) {
      const list = rows.filter(r => r.pct !== null).sort((a, b) => a.pct - b.pct).slice(0, 5);
      if (!list.length) return '';
      const items = list.map((r, n) => '<button type="button" class="weak-row t-row" data-topic="' + escAttr(r.t) + '" aria-label="' + escAttr((r.label || r.t) + ', ' + r.pct + ' percent mastery') + '"><span class="weak-rank mono">' + (n + 1) + '</span><span class="weak-name"><span class="n">' + escHtml(r.label || r.t) + '</span><span class="d">' + escHtml((DOMAIN_LABELS && DOMAIN_LABELS[r.domainKey]) || '') + '</span></span><span class="weak-pct mono">' + r.pct + '%</span></button>').join('');
      return '<div class="tile t-weak" style="--i:' + i + '"><div class="tile-eyebrow">Weakest topics <span class="tile-count">lowest ' + list.length + '</span></div><div class="weak-list">' + items + '</div></div>';
    }

    // untouched (pct === null) + strong (pct >= 80) chip tiles
    function untouchedTile(i) {
      const list = rows.filter(r => r.pct === null);
      if (!list.length) return '';
      const chips = list.map(r => '<button type="button" class="chip ghost t-row" data-topic="' + escAttr(r.t) + '">' + escHtml(r.label || r.t) + '</button>').join('');
      return '<div class="tile t-untouched" style="--i:' + i + '"><div class="tile-eyebrow">Untouched <span class="tile-count">' + list.length + ' never studied</span></div><div class="chips">' + chips + '</div></div>';
    }
    function strongTile(i) {
      const list = rows.filter(r => r.pct !== null && r.pct >= 80).sort((a, b) => b.pct - a.pct);
      if (!list.length) return '';
      const chips = list.map(r => '<button type="button" class="chip good t-row" data-topic="' + escAttr(r.t) + '">' + escHtml(r.label || r.t) + '<span class="m mono">' + r.pct + '%</span></button>').join('');
      return '<div class="tile t-strong" style="--i:' + i + '"><div class="tile-eyebrow">Strong and mastered <span class="tile-count">' + list.length + ' solid</span></div><div class="chips">' + chips + '</div></div>';
    }

    function recentTile(i) {  // recently studied (lowest daysSince)
      const list = rows.filter(r => r.pct !== null && r.daysSince != null).sort((a, b) => a.daysSince - b.daysSince).slice(0, 8);
      if (!list.length) return '';
      const cards = list.map(r => {
        const when = r.daysSince === 0 ? 'today' : r.daysSince === 1 ? '1 day ago' : r.daysSince + ' days ago';
        return '<button type="button" class="recent-card t-row" data-topic="' + escAttr(r.t) + '"><span class="rn">' + escHtml(r.label || r.t) + '</span><span class="rb"><span class="rm mono">' + r.pct + '% mastery</span><span class="rt mono">' + when + '</span></span></button>';
      }).join('');
      return '<div class="tile t-recent" style="--i:' + i + '"><div class="tile-eyebrow">Recently studied <span class="tile-count">last ' + list.length + '</span></div><div class="recent-track">' + cards + '</div></div>';
    }

    // scoped/filtered view: one focused tile of the matching .t-row buttons
    function scopedTile(i) {
      let visible = [];
      order.forEach(dk => { visible = visible.concat(_sortProgressRows(grouped[dk] || [], progressState.sort).filter(_progressRowMatches)); });
      const flabel = { weak: 'Weak only', untouched: 'Untouched', strong: 'Strong' }[progressState.filter] || 'All topics';
      const q = (progressState.search || '').trim();
      const head = '<div class="tile-eyebrow">' + escHtml(flabel) + (q ? ' \u00b7 matching \u201c' + escHtml(q) + '\u201d' : '') + ' <span class="tile-count">' + visible.length + ' of ' + rows.length + '</span></div>';
      const body = visible.length ? '<div class="scoped-list">' + visible.map(_progressRowHtml).join('') + '</div>' : '<div class="empty-note">No topics match this search and filter.</div>';
      return '<div class="tile t-scoped" style="--i:' + i + '">' + head + body + '</div>';
    }

    // compose: spotlight + coverage always lead; then either the scoped focus
    // tile (filter/search active) or the full domain + weakest/untouched/strong/
    // recent set.
    let html = spotlightTile(0) + coverageTile(1);
    if (scoped) {
      html += scopedTile(2);
    } else {
      const dom = domainTiles(2);
      let i = dom.next;
      html += dom.html + weakestTile(i++) + untouchedTile(i++) + strongTile(i++) + recentTile(i++);
    }

    const grid = document.getElementById('progress-topic-grid');
    if (!grid) return;
    grid.classList.add('progress-bento');
    grid.innerHTML = html || '<div class="tile t-scoped"><div class="empty-note">No topics match this filter.</div></div>';
    // Delegated click on the grid host: every clickable tile/row/chip carries
    // .t-row[data-topic], so this single idempotent handler fires drillTopic
    // for all of them (no listener accumulation across re-renders).
    grid.onclick = function(ev) {
      const row = ev.target && ev.target.closest && ev.target.closest('.t-row[data-topic]');
      const topicId = row && row.getAttribute('data-topic');
      if (topicId) { try { if (typeof drillTopic === 'function') drillTopic(topicId); } catch (_) {} }
    };
    // Entrance: toggle .in next frame so the staggered CSS transition (gated
    // behind prefers-reduced-motion: no-preference, driven by --i) plays. Under
    // reduce the CSS keeps tiles static, so this is a harmless no-op.
    requestAnimationFrame(() => requestAnimationFrame(() => grid.classList.add('in')));
    // Scroll-into-view on initial load when URL carries #domain-<slug>.
    try {
      const hash = (typeof window !== 'undefined' && window.location && window.location.hash) || '';
      if (hash && hash.indexOf('#domain-') === 0 && !window._progressHashConsumed) {
        window._progressHashConsumed = true;
        const target = document.getElementById('domain-' + hash.slice('#domain-'.length));
        if (target) setTimeout(function() { try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {} }, 80);
      }
    } catch (_) {}
  }

  function renderProgressPage() {
    progressState.rows = _buildProgressRows();
    _renderProgressSummary(progressState.rows);
    _renderProgressGrouped(progressState.rows);
    // v4.78.0: surface highest-leverage topic recommendation at top
    if (typeof renderProgressRecommendation === 'function') renderProgressRecommendation();
  }

  function setProgressFilter(name) {
    progressState.filter = name;
    document.querySelectorAll('.prog-filter-btn').forEach(btn => {
      const active = btn.getAttribute('data-filter') === name;
      btn.classList.toggle('prog-filter-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    _renderProgressGrouped(progressState.rows);
  }

  function setProgressSort(mode) {
    progressState.sort = mode;
    _renderProgressGrouped(progressState.rows);
  }

  function filterProgressPage() {
    const input = document.getElementById('progress-search');
    progressState.search = input ? input.value : '';
    _renderProgressGrouped(progressState.rows);
  }

  function drillTopic(t) {
    topic = t;
    document.querySelectorAll('#topic-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === t));
    syncChipAriaPressed('#topic-group');
    goSetup();
    // Reveal the selected chip: open its collapsed domain accordion, scroll to
    // it, and flash briefly so the landing target is obvious.
    requestAnimationFrame(() => {
      // Open the Custom Quiz section so topic chips are visible (v4.32)
      const customSection = document.getElementById('custom-quiz-section');
      if (customSection && !customSection.open) customSection.open = true;
      const chip = document.querySelector('#topic-group .chip.on');
      if (!chip) return;
      const domainGroup = chip.closest('details.topic-domain-group');
      if (domainGroup && !domainGroup.open) domainGroup.open = true;
      chip.scrollIntoView({ behavior: 'smooth', block: 'center' });
      chip.classList.add('chip-flash');
      setTimeout(() => chip.classList.remove('chip-flash'), 1400);
    });
  }

  // Single shared visual style (`.page-rec-card`) — each page picks its
  // own recommendation logic from existing data signals.
  // ══════════════════════════════════════════

  // Shared card-builder. Returns innerHTML string that any page can drop
  // into a host element. Mirrors the gradient-purple aesthetic of the
  // hero CTA + analytics action headline so users recognize the pattern
  // across pages.
  function _pageRecCard(opts) {
    const { eyebrow, icon, headline, sub, ctaLabel, ctaFn, reason } = opts;
    const safeIcon = icon || '';
    return '<div class="page-rec-card">'
      + '<div class="page-rec-eyebrow">'
      + '<span class="page-rec-icon">' + safeIcon + '</span>'
      + '<span class="page-rec-eyebrow-text">' + escHtml(eyebrow || 'Recommended next') + '</span>'
      + '</div>'
      + '<div class="page-rec-headline">' + escHtml(headline) + '</div>'
      + (sub ? '<div class="page-rec-sub">' + escHtml(sub) + '</div>' : '')
      + '<button type="button" class="page-rec-btn" onclick="' + ctaFn + '">'
      + escHtml(ctaLabel || 'Start →') + '</button>'
      + (reason ? '<div class="page-rec-reason">' + escHtml(reason) + '</div>' : '')
      + '</div>';
  }

  // ── Topic Progress page recommendation ──
  // v7.2.0 (supersedes v4.79.0): locked stop-slop copy from spec §4.2 — eyebrow
  // "WHERE TO DRILL NEXT" + sub "Drilling here moves readiness furthest per
  // minute." (the per-minute language names the unit; the "right now" filler
  // is dropped). Empty state swaps to "Start with the diagnostic" (the spec
  // Q4-A lock — diagnostic is the canonical first action for a fresh user).
  function _pickProgressRecommendation() {
    let weak = null;
    try { weak = (typeof computeWeakSpotScores === 'function') ? computeWeakSpotScores() : null; } catch (_) {}
    if (!weak || weak.length === 0) {
      // Empty-state CTA: "Start with the diagnostic" — the spec §3.8 + Q4-A
      // lock. Pre-v7.2.0 this routed to a Network Models & OSI starter quiz;
      // the v2 redesign anchors fresh users on the diagnostic surface instead.
      return {
        eyebrow: 'WHERE TO DRILL NEXT',
        icon: '',
        headline: 'Start with the diagnostic',
        sub: 'Take a short diagnostic to see where you stand. We will tailor your study plan from there.',
        ctaLabel: 'Take the diagnostic →',
        ctaFn: "goSetup();",
        reason: 'A 10-question diagnostic surfaces your weakest topics fast.'
      };
    }
    const top = weak[0];
    const topicName = top.topic || 'Unknown';
    return {
      eyebrow: 'WHERE TO DRILL NEXT',
      icon: '',
      headline: 'Drill ' + topicName,
      sub: 'Your weakest studied topic. Drilling here moves readiness furthest per minute.',
      ctaLabel: 'Drill ' + topicName + ' →',
      ctaFn: "focusTopic('" + topicName.replace(/'/g, "\\'") + "');",
      reason: 'Direct hit on your biggest score gap.'
    };
  }

  function renderProgressRecommendation() {
    const host = document.getElementById('progress-rec-host');
    if (!host) return;
    try {
      host.innerHTML = _pageRecCard(_pickProgressRecommendation());
      host.hidden = false;
    } catch (err) {
      console.warn('[progress rec] failed', err);
      host.hidden = true;
    }
  }

  // ── window re-exposure (HTML onclick/onchange/oninput) ──
  window.renderProgressPage = renderProgressPage;
  window.setProgressFilter = setProgressFilter;
  window.setProgressSort = setProgressSort;
  window.filterProgressPage = filterProgressPage;

  // ── feature registry ──
  window._certanvilFeatures = window._certanvilFeatures || {};
  window._certanvilFeatures['progress'] = { enter: renderProgressPage };
})();
