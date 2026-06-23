/* ============================================================
   "Are you trending toward PASS?" — shared base renderer
   Deterministic. Mirrors production geometry (960x220 viewBox,
   PAD 50) but frames the y-domain to 55–98% so the data reads
   like the real screenshot. Every mockup gets the identical
   chart so you're judging MOTION, not chart differences.

   Exposes window.AccChart after render(mountSel):
     .svg, .card, .mount
     .geom { W,H,PAD,innerW,innerH,yMin,yMax,xOf(i,n),yOf(acc), passAcc, passY }
     .ranges ['week','month','all']
     .current  (active range key)
     .data { week:[{acc,label}], month:[...], all:[...] }
     .series { week:{ areaEl, lineEl, groupEl, dotEls:[], pts:[{x,y,acc,label}] }, ... }
     .tabs [buttonEls]
     .setRange(r)            // base hard show/hide (mockups may override)
     .buildLine(pts) -> "M.."  .buildArea(pts) -> "M.. Z"
     .el(tag, attrs)
   ============================================================ */
(function () {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const W = 960, H = 220, PAD = 50;
  const innerW = W - 2 * PAD, innerH = H - 2 * PAD; // 860 x 120
  const yMin = 55, yMax = 98;                       // framed domain (%)
  const passAcc = 72;

  const yOf = (acc) => PAD + (1 - (acc - yMin) / (yMax - yMin)) * innerH;
  const xOf = (i, n) => PAD + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
  const passY = yOf(passAcc);

  // ---- three datasets, telling a coherent story ----
  // MONTH (default, matches the screenshot): strong start, fades, dips below pass.
  const DATA = {
    week: [
      { acc: 69, label: 'Mon' }, { acc: 72, label: 'Tue' }, { acc: 68, label: 'Wed' },
      { acc: 74, label: 'Thu' }, { acc: 71, label: 'Fri' }, { acc: 76, label: 'Sat' },
      { acc: 73, label: 'Sun' },
    ],
    month: [
      { acc: 92, label: 'W1' }, { acc: 93, label: '' }, { acc: 90, label: 'W2' },
      { acc: 91, label: '' }, { acc: 88, label: 'W3' }, { acc: 85, label: '' },
      { acc: 81, label: 'W4' }, { acc: 77, label: '' }, { acc: 73, label: 'W5' },
      { acc: 68, label: 'Now' },
    ],
    all: [
      { acc: 58, label: '' }, { acc: 61, label: '' }, { acc: 64, label: '' },
      { acc: 63, label: '' }, { acc: 68, label: '' }, { acc: 72, label: '' },
      { acc: 75, label: '' }, { acc: 79, label: '' }, { acc: 83, label: '' },
      { acc: 88, label: '' }, { acc: 91, label: '' }, { acc: 89, label: '' },
      { acc: 84, label: '' }, { acc: 78, label: '' }, { acc: 71, label: '' },
      { acc: 68, label: '' },
    ],
  };

  function el(tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function ptsFor(key) {
    const arr = DATA[key];
    return arr.map((d, i) => ({ x: xOf(i, arr.length), y: yOf(d.acc), acc: d.acc, label: d.label }));
  }
  function buildLine(pts) {
    return pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
  }
  function buildArea(pts) {
    if (!pts.length) return '';
    const base = (H - PAD).toFixed(1); // baseline at bottom padding
    return 'M' + pts[0].x.toFixed(1) + ' ' + base + ' ' +
      pts.map(p => 'L' + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ') +
      ' L' + pts[pts.length - 1].x.toFixed(1) + ' ' + base + ' Z';
  }

  function render(mountSel) {
    const mount = document.querySelector(mountSel);

    const card = document.createElement('div');
    card.className = 'acc-card';
    card.id = 'acc-card';

    // head
    const head = document.createElement('div');
    head.className = 'acc-head';
    const titleWrap = document.createElement('div');
    titleWrap.innerHTML =
      '<p class="acc-eyebrow">Accuracy · over time</p>' +
      '<h1 class="acc-title">Are you trending <em>toward pass?</em></h1>';
    const tabs = document.createElement('div');
    tabs.className = 'acc-tabs';
    ['week', 'month', 'all'].forEach(r => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'acc-tab' + (r === 'month' ? ' acc-tab-active' : '');
      b.dataset.range = r;
      b.textContent = r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1);
      tabs.appendChild(b);
    });
    head.appendChild(titleWrap);
    head.appendChild(tabs);

    // chart
    const wrap = document.createElement('div');
    wrap.className = 'acc-wrap';
    const svg = el('svg', { class: 'acc-svg', viewBox: `0 0 ${W} ${H}` });

    // gridlines + axis labels
    const grid = el('g', { class: 'acc-grid' });
    [60, 70, 80, 90].forEach(pct => {
      const y = yOf(pct);
      grid.appendChild(el('line', { x1: PAD, y1: y, x2: W - PAD, y2: y }));
      const t = el('text', { x: PAD - 10, y: y + 3, 'text-anchor': 'end' });
      t.textContent = pct + '%';
      grid.appendChild(t);
    });
    svg.appendChild(grid);

    // PASS threshold
    const passG = el('g', { class: 'acc-pass' });
    passG.appendChild(el('line', { class: 'acc-pass-line', x1: PAD, y1: passY, x2: W - PAD, y2: passY }));
    const passT = el('text', { class: 'acc-pass-label', x: W - PAD + 6, y: passY + 4 });
    passT.textContent = 'PASS';
    passG.appendChild(passT);
    svg.appendChild(passG);

    // series groups
    const series = {};
    ['week', 'month', 'all'].forEach(key => {
      const pts = ptsFor(key);
      const g = el('g', { 'data-range': key });
      if (key !== 'month') g.setAttribute('style', 'display:none');
      const area = el('path', { class: 'acc-area', d: buildArea(pts) });
      const line = el('path', { class: 'acc-line', d: buildLine(pts) });
      g.appendChild(area); g.appendChild(line);
      const dotEls = pts.map(p => {
        const c = el('circle', { class: 'acc-dot', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 4 });
        g.appendChild(c); return c;
      });
      svg.appendChild(g);
      series[key] = { groupEl: g, areaEl: area, lineEl: line, dotEls, pts };
    });

    wrap.appendChild(svg);
    card.appendChild(head);
    card.appendChild(wrap);
    mount.appendChild(card);

    const api = {
      svg, card, mount,
      geom: { W, H, PAD, innerW, innerH, yMin, yMax, xOf, yOf, passAcc, passY },
      ranges: ['week', 'month', 'all'],
      current: 'month',
      data: DATA,
      series,
      tabs: Array.prototype.slice.call(tabs.querySelectorAll('.acc-tab')),
      el, buildLine, buildArea,
      setRange(r) {
        if (!series[r]) return;
        this.current = r;
        this.tabs.forEach(b => b.classList.toggle('acc-tab-active', b.dataset.range === r));
        Object.keys(series).forEach(k => {
          series[k].groupEl.setAttribute('style', k === r ? '' : 'display:none');
        });
      },
    };
    // default wiring (mockups can replace these listeners)
    api.tabs.forEach(b => b.addEventListener('click', () => api.setRange(b.dataset.range)));

    window.AccChart = api;
    return api;
  }

  window.AccChart = { render };
})();
