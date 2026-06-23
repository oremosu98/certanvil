/* ============================================================
   "Your Study Rhythm" — shared base renderer
   Mirrors production geometry (SVG rects, 7x53, CELL 11 / GAP 3,
   LEFT_PAD 28 / TOP_PAD 20). Deterministic activity that matches
   the real screenshot stats: 1 day streak · 4 best · 7 of last 30
   · 7 of last 90 — sparse year, recent burst. Every mockup gets
   the identical grid so you're judging MOTION, not data.

   Exposes window.Heatmap after render(mountSel):
     .svg, .card, .wrap, .el(tag,attrs)
     .geom { CELL, GAP, LEFT_PAD, TOP_PAD, WEEKS, W, H }
     .cells [{ rect, key, date, daysAgo, tier, q, c, col, row, x, y, active }]
     .byDaysAgo (Map daysAgo -> cell)
     .activeCells  (cells with tier>0)
     .stats { current, best, last30, last90 }
     .statEls { current, best, last30, last90 }   (the .hms-val nodes)
     .currentStreakCells, .bestStreakCells
   ============================================================ */
(function () {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const CELL = 11, GAP = 3, LEFT_PAD = 28, TOP_PAD = 20, WEEKS = 53;
  const W = WEEKS * (CELL + GAP) + 30;  // 772
  const H = 7 * (CELL + GAP) + 24;      // 122

  // activity by days-ago -> tier (1..4). Tuned to the screenshot's 1/4/7/7.
  // last 30 active days: 0,5,11,12,13,14,22  = 7   (also = last 90, nothing 30..90)
  // best streak: 11,12,13,14 (4 consecutive) · current streak: just today (0)
  // plus faint texture older than 90 days so the year isn't barren.
  const ACT = {
    0: 3, 5: 2, 11: 2, 12: 4, 13: 3, 14: 3, 22: 1,
    140: 1, 175: 1, 200: 2, 201: 1, 260: 1, 312: 1,
  };
  const Q_FOR = { 1: 4, 2: 11, 3: 26, 4: 52 };

  function el(tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  const two = (n) => (n < 10 ? '0' + n : '' + n);
  const keyOf = (d) => d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate());

  function render(mountSel) {
    const mount = document.querySelector(mountSel);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daySinceSunday = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - daySinceSunday - (WEEKS - 1) * 7);

    // ---- stats from ACT ----
    const activeSet = new Set(Object.keys(ACT).map(Number));
    let current = 0; while (activeSet.has(current)) current++;
    let best = 0, run = 0;
    for (let k = 0; k <= 364; k++) { if (activeSet.has(k)) { run++; best = Math.max(best, run); } else run = 0; }
    let last30 = 0, last90 = 0;
    activeSet.forEach(k => { if (k < 30) last30++; if (k < 90) last90++; });

    const card = document.createElement('div');
    card.className = 'hm-card'; card.id = 'hm-card';

    const statDefs = [
      ['current', current, 'day streak'], ['best', best, 'best streak'],
      ['last30', last30, 'of last 30'], ['last90', last90, 'of last 90'],
    ];
    card.innerHTML =
      '<div class="hm-head"><div>' +
        '<p class="hm-eyebrow">Activity · last 365 days</p>' +
        '<h1 class="hm-title">Your study <em>rhythm.</em></h1>' +
      '</div><div class="hm-stats">' +
        statDefs.map(s => '<div class="hm-stat"><div class="hms-val" data-stat="' + s[0] + '">' + s[1] + '</div><div class="hms-lbl">' + s[2] + '</div></div>').join('') +
      '</div></div>' +
      '<div class="hm-wrap"></div>' +
      '<div class="hm-legend"><span>Less</span>' +
        '<span class="sw sw0"></span><span class="sw sw1"></span><span class="sw sw2"></span><span class="sw sw3"></span><span class="sw sw4"></span>' +
        '<span>More</span></div>';

    const wrap = card.querySelector('.hm-wrap');
    const svg = el('svg', { class: 'hm-svg', viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMinYMid meet', role: 'img', 'aria-label': 'Daily study activity heatmap' });

    const monthLayer = el('g', {}), labelLayer = el('g', {}), cellLayer = el('g', {});
    svg.appendChild(monthLayer); svg.appendChild(labelLayer); svg.appendChild(cellLayer);

    const cells = [], byDaysAgo = new Map();
    let prevMonth = -1;
    for (let col = 0; col < WEEKS; col++) {
      for (let row = 0; row < 7; row++) {
        const d = new Date(start); d.setDate(start.getDate() + col * 7 + row);
        if (d > today) continue;
        const daysAgo = Math.round((today - d) / 86400000);
        const tier = ACT[daysAgo] || 0;
        const q = tier ? Q_FOR[tier] : 0;
        const c = q ? Math.round(q * 0.74) : 0;
        const x = LEFT_PAD + col * (CELL + GAP);
        const y = TOP_PAD + row * (CELL + GAP);
        const rect = el('rect', {
          x, y, width: CELL, height: CELL, rx: 2, ry: 2,
          class: 'hm-cell hm-cell-t' + tier, 'data-date': keyOf(d), 'data-days': daysAgo,
        });
        const dateLabel = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        const t = el('title', {});
        t.textContent = q > 0 ? (dateLabel + ' — ' + q + ' questions, ' + Math.round(c / q * 100) + '% accuracy') : (dateLabel + ' — no study');
        rect.appendChild(t);
        cellLayer.appendChild(rect);
        const cellObj = { rect, key: keyOf(d), date: d, daysAgo, tier, q, c, col, row, x, y, active: tier > 0 };
        cells.push(cellObj); byDaysAgo.set(daysAgo, cellObj);

        if (row === 0) {
          const month = d.getMonth();
          if (month !== prevMonth) {
            const mt = el('text', { x, y: 12, class: 'hm-month' });
            mt.textContent = d.toLocaleString(undefined, { month: 'short' });
            monthLayer.appendChild(mt);
            prevMonth = month;
          }
        }
      }
    }
    // M/W/F labels
    [1, 3, 5].forEach(row => {
      const y = TOP_PAD + row * (CELL + GAP) + CELL - 2;
      const lt = el('text', { x: 2, y, class: 'hm-dow' });
      lt.textContent = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][row];
      labelLayer.appendChild(lt);
    });

    wrap.appendChild(svg);
    mount.appendChild(card);

    // streak cell sets
    const currentStreakCells = [];
    for (let k = 0; k < current; k++) if (byDaysAgo.has(k)) currentStreakCells.push(byDaysAgo.get(k));
    // best run = 11..14 in our data; compute generically
    let bestStreakCells = [], curRun = [];
    for (let k = 364; k >= 0; k--) {
      if (activeSet.has(k)) { curRun.push(k); if (curRun.length > bestStreakCells.length) bestStreakCells = curRun.slice(); }
      else curRun = [];
    }
    bestStreakCells = bestStreakCells.map(k => byDaysAgo.get(k)).filter(Boolean);

    const statEls = {};
    card.querySelectorAll('.hms-val').forEach(n => { statEls[n.getAttribute('data-stat')] = n; });

    window.Heatmap = {
      svg, card, wrap, el,
      geom: { CELL, GAP, LEFT_PAD, TOP_PAD, WEEKS, W, H },
      cells, byDaysAgo,
      activeCells: cells.filter(c => c.active),
      stats: { current, best, last30, last90 },
      statEls,
      currentStreakCells, bestStreakCells,
    };
    return window.Heatmap;
  }

  window.Heatmap = { render };
})();
