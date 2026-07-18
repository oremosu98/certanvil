/* Analytics page — extracted from app.js (#138 wave 2). Lazy-loaded feature.
 * Mechanical move: function bodies identical to app.js @ f531df5. */
(function () {
  'use strict';

  // ── module-level state (moved from app.js) ──
  let _anaFlame = null;
  let _anaAccPulse = null;
  let _anaDMState = null;
  let _anaDriftRaf = null;
  let _anaMsState = null;

  // ── moved functions, 2-space indent ──
  function renderAnalyticsActionHeadline() {
    const host = document.getElementById('ana-action-headline');
    if (!host) return;
    let r = null;
    try { r = (typeof getReadinessScore === 'function') ? getReadinessScore() : null; } catch (_) {}
    if (!r || !Array.isArray(r.whatIf) || r.whatIf.length === 0) {
      host.hidden = true;
      return;
    }
    const top = r.whatIf[0];
    const safeTopic = (top.topic || '').replace(/'/g, "\\'");
    host.innerHTML = '<div class="ana-action-eyebrow">Your next 30 minutes</div>'
      + '<div class="ana-action-body">'
      + '<div class="ana-action-text">'
      + '<div class="ana-action-topic">' + escHtml(top.topic) + '</div>'
      + '<div class="ana-action-meta">+<strong>' + top.deltaPredicted + ' pts</strong> predicted &middot; '
      + top.currentPct + '% → 80% · biggest gap</div>'
      + '</div>'
      + '<button type="button" class="ana-action-btn" onclick="focusTopic(\'' + safeTopic + '\')">Drill now →</button>'
      + '</div>';
    host.hidden = false;
  }
  function _renderAnaNav() {
    return `<nav class="ana-nav" aria-label="Analytics sections">
      <button class="ana-nav-pill" onclick="document.getElementById('ana-s-readiness')?.scrollIntoView({behavior:'smooth',block:'start'})">Readiness</button>
      <button class="ana-nav-pill" onclick="document.getElementById('ana-s-trend')?.scrollIntoView({behavior:'smooth',block:'start'})">Trend</button>
      <button class="ana-nav-pill" onclick="document.getElementById('ana-s-activity')?.scrollIntoView({behavior:'smooth',block:'start'})">Activity</button>
      <button class="ana-nav-pill" onclick="document.getElementById('ana-s-milestones')?.scrollIntoView({behavior:'smooth',block:'start'})">Milestones</button>
    </nav>`;
  }

  // v4.54.8: compact sparkline path helper. Values array -> SVG `d` string.
  // Accepts optional w/h for the viewBox (defaults 300x40 matching prototype).
  // Returns empty string if values too small to plot.
  function _sparkPath(values, w = 300, h = 40) {
    if (!Array.isArray(values) || values.length < 2) return '';
    const padding = 3;
    const innerW = w - 2 * padding, innerH = h - 2 * padding;
    const min = Math.min(...values), max = Math.max(...values);
    const range = (max - min) || 1;
    let path = '';
    values.forEach((v, i) => {
      const x = padding + (i / (values.length - 1)) * innerW;
      const y = padding + (1 - (v - min) / range) * innerH;
      path += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    });
    return path;
  }

  // v4.54.8: build per-week time series for the 4 Readiness stats cells.
  // Buckets history by ISO week. Returns arrays of ~12 weeks by default.
  function _weeklyStatSeries(h, weeks = 12) {
    if (!Array.isArray(h) || h.length === 0) return { sessions: [], questions: [], accuracy: [], studyDays: [] };
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const startMs = now - weeks * weekMs;
    const buckets = Array.from({ length: weeks }, () => ({ s: 0, q: 0, c: 0, days: new Set() }));
    h.forEach(e => {
      const t = new Date(e.date).getTime();
      if (isNaN(t) || t < startMs) return;
      const idx = Math.min(weeks - 1, Math.floor((t - startMs) / weekMs));
      const b = buckets[idx];
      b.s += 1;
      b.q += (e.total || 0);
      b.c += (e.score || 0);
      b.days.add(new Date(e.date).toISOString().slice(0, 10));
    });
    return {
      sessions: buckets.map(b => b.s),
      questions: buckets.map(b => b.q),
      accuracy: buckets.map(b => b.q > 0 ? Math.round((b.c / b.q) * 100) : 0),
      studyDays: buckets.map(b => b.days.size)
    };
  }

  // v4.54.8: full Accuracy-over-time chart with pass-mark line + week/month/all tabs.
  // 960x220 SVG, dashed gridlines at 60/70/80/90, accent pass-mark line at 72%,
  // 6% opacity area fill, circle dots at each datapoint. Tabs are pure CSS
  // class-toggle on a data-tab attribute (no re-render needed; SVG holds all 3
  // series and tab click hides/shows via CSS).
  // v4.54.10: Daily Study Streak calendar heatmap (GitHub-contribution-graph
  // style). 52 weeks \u00d7 7 days = 364 cells covering the past year. Each cell's
  // tint is based on questions answered that day. Month labels across the top,
  // day-of-week labels down the left, native SVG <title> tooltips on hover.
  // Data source: loadHistory() aggregated by ISO date string.
  function _renderAnaStudyHeatmap(h) {
    if (!Array.isArray(h) || h.length === 0) return '';
    // Bucket history by ISO date
    const byDay = new Map();
    h.forEach(e => {
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      const cur = byDay.get(key) || { q: 0, c: 0 };
      cur.q += (e.total || 0);
      cur.c += (e.score || 0);
      byDay.set(key, cur);
    });
    // Build the 365-day window, ending today. Normalise start to the most
    // recent Sunday so columns align nicely by week.
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daySinceSunday = today.getDay(); // 0 = Sun
    // Start from a Sunday 52 weeks ago (so the grid is a clean 53 columns)
    const WEEKS = 53;
    const start = new Date(today); start.setDate(today.getDate() - daySinceSunday - (WEEKS - 1) * 7);
    const totalCells = WEEKS * 7;
    // Cell dims
    const CELL = 11, GAP = 3;
    const W = WEEKS * (CELL + GAP) + 30; // +30 for day labels
    const H = 7 * (CELL + GAP) + 24;     // +24 for month labels
    const LEFT_PAD = 28, TOP_PAD = 20;

    const examDate = (typeof getExamDate === 'function') ? getExamDate() : null;
    const examKey = examDate ? new Date(examDate).toISOString().slice(0, 10) : null;

    // Intensity threshold tiers (questions per day)
    const tierFor = (q) => {
      if (q === 0) return 0;
      if (q <= 5)  return 1;
      if (q <= 15) return 2;
      if (q <= 40) return 3;
      return 4;
    };
    // Accumulate streak + 30/90 study-day totals in the same pass
    let daysStudied30 = 0, daysStudied90 = 0, totalStudyDays = 0;
    let maxDayQ = 0;
    // v7.14.0 Streak Flame: find the longest consecutive active-day run (the
    // "best streak") so the reveal can ignite exactly those cells, oldest→newest.
    let _flameStart = -1, _flameEnd = -1;
    {
      let bestS = -1, bestL = 0, curS = -1, curL = 0;
      for (let di = 0; di < WEEKS * 7; di++) {
        const dd = new Date(start); dd.setDate(start.getDate() + di);
        if (dd > today) break;
        const e = byDay.get(dd.toISOString().slice(0, 10));
        if (e && e.q > 0) { if (curS === -1) { curS = di; curL = 0; } curL++; if (curL > bestL) { bestL = curL; bestS = curS; } }
        else { curS = -1; curL = 0; }
      }
      if (bestL > 0) { _flameStart = bestS; _flameEnd = bestS + bestL - 1; }
    }
    const cells = [];
    const monthLabels = [];
    let prevMonth = -1;
    for (let col = 0; col < WEEKS; col++) {
      for (let row = 0; row < 7; row++) {
        const d = new Date(start); d.setDate(start.getDate() + col * 7 + row);
        if (d > today) continue;
        const key = d.toISOString().slice(0, 10);
        const entry = byDay.get(key);
        const q = entry ? entry.q : 0;
        const c = entry ? entry.c : 0;
        const tier = tierFor(q);
        if (q > 0) totalStudyDays++;
        if (q > maxDayQ) maxDayQ = q;
        const daysAgo = Math.round((today - d) / (24 * 60 * 60 * 1000));
        if (q > 0 && daysAgo < 30) daysStudied30++;
        if (q > 0 && daysAgo < 90) daysStudied90++;
        const x = LEFT_PAD + col * (CELL + GAP);
        const y = TOP_PAD + row * (CELL + GAP);
        const dateLabel = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        const title = q > 0
          ? `${dateLabel} \u2014 ${q} question${q === 1 ? '' : 's'}, ${c > 0 ? Math.round(c / q * 100) : 0}% accuracy`
          : `${dateLabel} \u2014 no study`;
        const isToday = daysAgo === 0;
        const isExam = examKey && key === examKey;
        const extraCls = isExam ? ' hm-cell-exam' : (isToday && q > 0 ? ' hm-cell-today' : '');
        const dayIndex = col * 7 + row;
        const isFlame = _flameStart >= 0 && dayIndex >= _flameStart && dayIndex <= _flameEnd;
        const flameCls = isFlame ? (dayIndex === _flameEnd ? ' hm-cell-flame hm-cell-flame-end' : ' hm-cell-flame') : '';
        const flameAttr = isFlame ? ` data-flame-i="${dayIndex - _flameStart}"` : '';
        cells.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" ry="2" class="hm-cell hm-cell-t${tier}${extraCls}${flameCls}" data-date="${key}"${flameAttr}><title>${title}</title></rect>`);
        // Month labels \u2014 place one per month at the top when the Sunday of a
        // new month appears in the grid.
        if (row === 0) {
          const month = d.getMonth();
          if (month !== prevMonth) {
            monthLabels.push(`<text x="${x}" y="14" class="hm-month">${d.toLocaleString(undefined, { month: 'short' })}</text>`);
            prevMonth = month;
          }
        }
      }
    }
    // Day-of-week labels (M / W / F) on the left
    const dayLabels = [1, 3, 5].map(row => {
      const y = TOP_PAD + row * (CELL + GAP) + CELL - 2;
      const txt = ['S','M','T','W','T','F','S'][row];
      return `<text x="2" y="${y}" class="hm-dow">${txt}</text>`;
    }).join('');
    // Longest streak + current streak
    let streakCurr = 0, streakBest = 0, streakRun = 0;
    try {
      if (typeof getStreak === 'function') {
        const s = getStreak() || {};
        streakCurr = s.current || 0;
        streakBest = s.best || 0;
      }
    } catch (_) {}
    const legendTiers = [0, 1, 2, 3, 4].map(t =>
      `<rect width="${CELL}" height="${CELL}" rx="2" ry="2" class="hm-cell hm-cell-t${t}" x="${t * (CELL + 3)}" y="0"></rect>`
    ).join('');
    return `<div class="ana-card ana-heatmap-card" id="ana-s-heatmap">
      <div class="ana-heatmap-head">
        <div>
          <div class="ana-heatmap-eyebrow">Activity &middot; last 365 days</div>
          <h3 class="ana-heatmap-title">Your study <em>rhythm.</em></h3>
        </div>
        <div class="ana-heatmap-stats">
          <div class="ana-heatmap-stat"><div class="hms-val">${streakCurr}</div><div class="hms-lbl">day streak</div></div>
          <div class="ana-heatmap-stat"><div class="hms-val">${streakBest}</div><div class="hms-lbl">best streak</div></div>
          <div class="ana-heatmap-stat"><div class="hms-val">${daysStudied30}</div><div class="hms-lbl">of last 30</div></div>
          <div class="ana-heatmap-stat"><div class="hms-val">${daysStudied90}</div><div class="hms-lbl">of last 90</div></div>
        </div>
      </div>
      <div class="ana-heatmap-wrap">
        <svg class="ana-heatmap-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMid meet" role="img" aria-label="Daily study activity heatmap">
          ${monthLabels.join('')}
          ${dayLabels}
          ${cells.join('')}
        </svg>
      </div>
      <div class="ana-heatmap-legend">
        <span class="hm-legend-lbl">Less</span>
        <svg width="${5 * (CELL + 3) - 3}" height="${CELL}" aria-hidden="true">${legendTiers}</svg>
        <span class="hm-legend-lbl">More</span>
        ${examKey ? '<span class="hm-legend-exam-wrap"><span class="hm-legend-exam-swatch"></span>Exam day</span>' : ''}
      </div>
    </div>`;
  }

  // v7.14.0 — Study Rhythm "streak flame" reveal. Counts the four stat numbers
  // up, ignites the best-streak cells one by one (a fuse to today), lands an ember
  // flare, and leaves today softly glowing. Values locked in the tuning studio:
  // fuseStagger 140ms · emberGlow 6px (CSS) · cellPop 1.35 · flareRings 3 ·
  // countUp 700ms · today-glow on. The glow + transform-box live in CSS classes so
  // this adds no inline styles (stays under the inline-style budget). Re-bound on
  // each analytics render; the prior run is cancelled so nothing stacks. Skipped
  // under prefers-reduced-motion (final lit state shown, no motion).
  function _anaHeatmapPlayFlame() {
    if (_anaFlame) {
      _anaFlame.timers.forEach(clearTimeout);
      _anaFlame.anims.forEach(a => { try { a.cancel(); } catch (e) {} });
      if (_anaFlame.iv) clearInterval(_anaFlame.iv);
      _anaFlame = null;
    }
    const card = document.getElementById('ana-s-heatmap');
    if (!card) return;
    const svg = card.querySelector('.ana-heatmap-svg');
    const flameCells = Array.prototype.slice.call(card.querySelectorAll('.hm-cell-flame'))
      .sort((a, b) => (parseInt(a.getAttribute('data-flame-i'), 10) || 0) - (parseInt(b.getAttribute('data-flame-i'), 10) || 0));
    const endCell = card.querySelector('.hm-cell-flame-end');
    const todayCell = card.querySelector('.hm-cell-today');
    const statVals = Array.prototype.slice.call(card.querySelectorAll('.hms-val'));
    const finals = statVals.map(v => parseInt(v.textContent, 10) || 0);

    const FUSE = 140, POP = 1.35, RINGS = 3, COUNT = 700;
    const NS = 'http://www.w3.org/2000/svg';
    const timers = [], anims = [];
    _anaFlame = { timers, anims, iv: null };
    const at = (ms, fn) => { timers.push(setTimeout(fn, ms)); };

    // reset (cancel above already reverted WAAPI fills; just clear the lit glow)
    flameCells.forEach(r => r.classList.remove('lit'));
    if (todayCell) todayCell.classList.remove('lit-today');
    if (svg) svg.querySelectorAll('.hm-flame-ring,.hm-today-ring').forEach(n => n.remove());

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      statVals.forEach((v, i) => { v.textContent = finals[i]; });
      flameCells.forEach(r => r.classList.add('lit'));
      if (todayCell) todayCell.classList.add('lit-today');
      return;
    }

    // 1) count the four stat numbers up
    statVals.forEach((v, i) => at(i * 80, () => {
      const target = finals[i], t0 = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / COUNT);
        v.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick); else v.textContent = target;
      };
      requestAnimationFrame(tick);
    }));

    // 2) fuse — ignite the best-streak cells oldest -> newest
    flameCells.forEach((r, i) => at(COUNT + i * FUSE, () => {
      r.classList.add('lit');
      anims.push(r.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(' + POP + ')' }, { transform: 'scale(1.12)' }],
        { duration: 420, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards' }
      ));
    }));

    // 3) ember flare at the end of the run
    if (endCell && svg) {
      const ex = parseFloat(endCell.getAttribute('x')) + 5.5;
      const ey = parseFloat(endCell.getAttribute('y')) + 5.5;
      for (let i = 0; i < RINGS; i++) at(COUNT + flameCells.length * FUSE + i * 150, () => {
        const ring = document.createElementNS(NS, 'circle');
        ring.setAttribute('cx', ex); ring.setAttribute('cy', ey); ring.setAttribute('r', '6');
        ring.setAttribute('class', 'hm-flame-ring');
        svg.appendChild(ring);
        const a = ring.animate([{ transform: 'scale(1)', opacity: 0.85 }, { transform: 'scale(3.4)', opacity: 0 }],
          { duration: 650, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' });
        a.onfinish = () => ring.remove(); anims.push(a);
      });
    }

    // 4) today keeps a soft glow + a slow looping ring
    if (todayCell && svg) at(COUNT + flameCells.length * FUSE + 250, () => {
      todayCell.classList.add('lit-today');
      const tx = parseFloat(todayCell.getAttribute('x')) + 5.5;
      const ty = parseFloat(todayCell.getAttribute('y')) + 5.5;
      const emit = () => {
        const ring = document.createElementNS(NS, 'circle');
        ring.setAttribute('cx', tx); ring.setAttribute('cy', ty); ring.setAttribute('r', '6');
        ring.setAttribute('class', 'hm-today-ring');
        svg.appendChild(ring);
        const a = ring.animate([{ transform: 'scale(1)', opacity: 0.5 }, { transform: 'scale(2.6)', opacity: 0 }],
          { duration: 2200, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' });
        a.onfinish = () => ring.remove(); anims.push(a);
      };
      emit();
      if (_anaFlame) _anaFlame.iv = setInterval(emit, 2400);
    });
  }

  function _renderAnaAccuracyChart(h) {
    if (!Array.isArray(h) || h.length === 0) return '';
    // Build 3 series: last 7 days (daily), last 30 days (daily), all-time (weekly).
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;
    const series = {
      week: { label: 'Week', points: [] },
      month: { label: 'Month', points: [] },
      all: { label: 'All', points: [] }
    };
    // Week: 7 daily buckets
    for (let i = 6; i >= 0; i--) {
      const bStart = now - (i + 1) * day;
      const bEnd = now - i * day;
      const entries = h.filter(e => { const t = new Date(e.date).getTime(); return t >= bStart && t < bEnd; });
      const qs = entries.reduce((a, e) => a + (e.total || 0), 0);
      const cs = entries.reduce((a, e) => a + (e.score || 0), 0);
      series.week.points.push({ acc: qs > 0 ? (cs / qs) * 100 : null });
    }
    // Month: 30 daily buckets
    for (let i = 29; i >= 0; i--) {
      const bStart = now - (i + 1) * day;
      const bEnd = now - i * day;
      const entries = h.filter(e => { const t = new Date(e.date).getTime(); return t >= bStart && t < bEnd; });
      const qs = entries.reduce((a, e) => a + (e.total || 0), 0);
      const cs = entries.reduce((a, e) => a + (e.score || 0), 0);
      series.month.points.push({ acc: qs > 0 ? (cs / qs) * 100 : null });
    }
    // All-time: weekly buckets covering history span
    if (h.length > 0) {
      const oldest = Math.min(...h.map(e => new Date(e.date).getTime()));
      const weeks = Math.max(2, Math.min(26, Math.ceil((now - oldest) / week)));
      for (let i = weeks - 1; i >= 0; i--) {
        const bStart = now - (i + 1) * week;
        const bEnd = now - i * week;
        const entries = h.filter(e => { const t = new Date(e.date).getTime(); return t >= bStart && t < bEnd; });
        const qs = entries.reduce((a, e) => a + (e.total || 0), 0);
        const cs = entries.reduce((a, e) => a + (e.score || 0), 0);
        series.all.points.push({ acc: qs > 0 ? (cs / qs) * 100 : null });
      }
    }
    // Build a single SVG path per series + dots. viewBox 960x220, padding 50.
    const W = 960, H = 220, PAD = 50;
    const innerW = W - 2 * PAD, innerH = H - 2 * PAD;
    const passPct = (EXAM_PASS_SCORE - 420) / 450 * 100; // ~66.67 on 420-870 scale
    const passYRaw = 72; // 72% raw accuracy ~= pass mark heuristic used in prototype
    const yOf = (p) => PAD + (1 - p / 100) * innerH;
    const xOf = (i, n) => PAD + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
    const plot = (seriesKey) => {
      const pts = series[seriesKey].points;
      if (pts.length === 0) return { path: '', dots: '', area: '', lastX: 0, lastY: 0, accs: [] };
      let linePath = '', areaPath = '';
      let lastValidIdx = -1, lastX = 0, lastY = 0;
      const dots = [], accs = [];
      pts.forEach((p, i) => {
        if (p.acc === null) return;
        const x = xOf(i, pts.length);
        const y = yOf(p.acc);
        if (lastValidIdx === -1) {
          linePath += `M${x.toFixed(1)},${y.toFixed(1)}`;
          areaPath += `M${x.toFixed(1)},${yOf(0).toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)}`;
        } else {
          linePath += ` L${x.toFixed(1)},${y.toFixed(1)}`;
          areaPath += ` L${x.toFixed(1)},${y.toFixed(1)}`;
        }
        dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>`);
        accs.push(p.acc);
        lastX = x; lastY = y;
        lastValidIdx = i;
      });
      if (lastValidIdx >= 0) {
        const lastXx = xOf(lastValidIdx, pts.length);
        areaPath += ` L${lastXx.toFixed(1)},${yOf(0).toFixed(1)} Z`;
      }
      return { path: linePath, dots: dots.join(''), area: areaPath, lastX, lastY, accs };
    };
    const weekSeries = plot('week');
    const monthSeries = plot('month');
    const allSeries = plot('all');
    const gridlines = [60, 70, 80, 90].map(pct =>
      `<line x1="${PAD}" y1="${yOf(pct).toFixed(1)}" x2="${W - PAD}" y2="${yOf(pct).toFixed(1)}" stroke="var(--border)" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>
       <text x="${PAD - 8}" y="${yOf(pct).toFixed(1)}" text-anchor="end" dominant-baseline="middle" font-size="10" fill="var(--text-dim)" font-family="monospace">${pct}%</text>`
    ).join('');
    const passLine = `<line class="ana-accchart-pass" x1="${PAD}" y1="${yOf(passYRaw).toFixed(1)}" x2="${W - PAD}" y2="${yOf(passYRaw).toFixed(1)}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="6,4" opacity="0.8"/>
      <text x="${W - PAD + 4}" y="${yOf(passYRaw).toFixed(1)}" dominant-baseline="middle" font-size="10" fill="var(--accent-light)" font-family="monospace" font-weight="700">PASS</text>`;
    // v7.14.0 — "trending toward pass?" verdict per range. Least-squares projection
    // over the range's accuracy points decides the direction; the displayed number
    // is the latest accuracy (matches the tuned design). Drives the badge + dip pulse.
    const _accVerdict = (s) => {
      const a = (s && s.accs) || [];
      if (a.length < 2) return null;
      const n = a.length;
      let sx = 0, sy = 0, sxy = 0, sxx = 0;
      a.forEach((v, i) => { sx += i; sy += v; sxy += i * v; sxx += i * i; });
      const denom = (n * sxx - sx * sx) || 1;
      const m = (n * sxy - sx * sy) / denom;
      const b = (sy - m * sx) / n;
      const proj = m * (n - 1) + b;
      return { num: Math.round(a[a.length - 1]), willPass: proj >= passYRaw };
    };
    const _accBadge = (range, s) => {
      const v = _accVerdict(s);
      if (!v) return '';
      const hide = range === 'month' ? '' : ' ana-accv--hide';
      return `<div class="ana-accv${v.willPass ? ' is-good' : ''}${hide}" data-range="${range}">
        <div class="ana-accv-num">${v.num}<span>%</span></div>
        <div class="ana-accv-cap">projected at exam</div>
        <div class="ana-accv-pill">${v.willPass ? '▲ On track to pass' : '▼ Trending below pass'}</div>
      </div>`;
    };
    return `<div class="ana-card ana-accchart-card" id="ana-s-accchart">
      <div class="ana-accchart-head">
        <div>
          <div class="ana-accchart-eyebrow">Accuracy &middot; over time</div>
          <h3 class="ana-accchart-title">Are you trending <em>toward pass?</em></h3>
        </div>
        <div class="ana-accchart-tabs" role="tablist" aria-label="Time window">
          <button type="button" class="ana-accchart-tab" data-range="week" onclick="_anaAccChartTab('week')">Week</button>
          <button type="button" class="ana-accchart-tab ana-accchart-tab-active" data-range="month" onclick="_anaAccChartTab('month')">Month</button>
          <button type="button" class="ana-accchart-tab" data-range="all" onclick="_anaAccChartTab('all')">All</button>
        </div>
      </div>
      <div class="ana-accchart-wrap">
        <svg class="ana-accchart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Accuracy over time chart">
          ${gridlines}
          ${passLine}
          <g data-range="week" data-lastx="${weekSeries.lastX.toFixed(1)}" data-lasty="${weekSeries.lastY.toFixed(1)}" style="display:none">
            <path d="${weekSeries.area}" fill="var(--accent)" opacity="0.07"/>
            <path d="${weekSeries.path}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
            ${weekSeries.dots}
          </g>
          <g data-range="month" data-lastx="${monthSeries.lastX.toFixed(1)}" data-lasty="${monthSeries.lastY.toFixed(1)}">
            <path d="${monthSeries.area}" fill="var(--accent)" opacity="0.07"/>
            <path d="${monthSeries.path}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
            ${monthSeries.dots}
          </g>
          <g data-range="all" data-lastx="${allSeries.lastX.toFixed(1)}" data-lasty="${allSeries.lastY.toFixed(1)}" style="display:none">
            <path d="${allSeries.area}" fill="var(--accent)" opacity="0.07"/>
            <path d="${allSeries.path}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
            ${allSeries.dots}
          </g>
        </svg>
        ${_accBadge('week', weekSeries)}
        ${_accBadge('month', monthSeries)}
        ${_accBadge('all', allSeries)}
      </div>
    </div>`;
  }

  // Tab switcher for the accuracy chart \u2014 shows/hides range groups via display.
  function _anaAccChartTab(range) {
    const card = document.getElementById('ana-s-accchart');
    if (!card) return;
    card.querySelectorAll('.ana-accchart-tab').forEach(b => {
      b.classList.toggle('ana-accchart-tab-active', b.getAttribute('data-range') === range);
    });
    card.querySelectorAll('.ana-accchart-svg g[data-range]').forEach(g => {
      g.style.display = g.getAttribute('data-range') === range ? '' : 'none';
    });
    // v7.14.0: swap the verdict badge + replay the dip pulse for the new range
    if (typeof _anaAccChartPlay === 'function') _anaAccChartPlay(range);
  }

  // v7.14.0 — reveals the active range's "trending toward pass?" verdict badge and
  // plays the reveal motion: one confident PASS-line pulse + 3 attention rings on
  // the latest point (red below pass, bronze on track). Tuned in the combined
  // studio (3 beats, 1.0x). Re-bound on each call; previous pulse cancelled so
  // rapid range switches never stack rings. Skipped under prefers-reduced-motion
  // (the badge still resolves to its final state — it aids comprehension).
  function _anaAccChartPlay(range) {
    if (_anaAccPulse) {
      if (_anaAccPulse.iv) clearInterval(_anaAccPulse.iv);
      (_anaAccPulse.anims || []).forEach(a => { try { a.cancel(); } catch (e) {} });
      _anaAccPulse = null;
    }
    const card = document.getElementById('ana-s-accchart');
    if (!card) return;
    // reveal the active badge (kept even under reduced motion — comprehension aid)
    card.querySelectorAll('.ana-accv[data-range]').forEach(v => {
      const on = v.getAttribute('data-range') === range;
      v.classList.toggle('ana-accv--hide', !on);
      v.classList.toggle('ana-accv-show', on);
    });
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const svg = card.querySelector('.ana-accchart-svg');
    const g = card.querySelector('.ana-accchart-svg g[data-range="' + range + '"]');
    if (!svg || !g) return;

    const anims = [];
    // confident PASS-line pulse
    const passEl = card.querySelector('.ana-accchart-pass');
    if (passEl && passEl.animate) {
      anims.push(passEl.animate(
        [{ strokeWidth: 2, opacity: 0.8 }, { strokeWidth: 3, opacity: 1 }, { strokeWidth: 2, opacity: 0.8 }],
        { duration: 560, easing: 'cubic-bezier(0.23,1,0.32,1)' }
      ));
    }

    const cx = parseFloat(g.getAttribute('data-lastx'));
    const cy = parseFloat(g.getAttribute('data-lasty'));
    const badge = card.querySelector('.ana-accv[data-range="' + range + '"]');
    const ringColor = (badge && badge.classList.contains('is-good')) ? 'var(--accent)' : 'var(--red, #c2402f)';
    if (isNaN(cx) || isNaN(cy)) { _anaAccPulse = { iv: 0, anims }; return; }

    const NS = 'http://www.w3.org/2000/svg';
    let beats = 0; const MAX = 3;
    const fire = () => {
      if (beats >= MAX) { if (_anaAccPulse) { clearInterval(_anaAccPulse.iv); _anaAccPulse.iv = 0; } return; }
      beats++;
      const ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('cx', cx); ring.setAttribute('cy', cy); ring.setAttribute('r', '4');
      ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', ringColor); ring.setAttribute('stroke-width', '2');
      ring.setAttribute('class', 'ana-acc-ring');
      svg.appendChild(ring);
      const a = ring.animate(
        [{ transform: 'scale(1)', opacity: 0.85 }, { transform: 'scale(3.4)', opacity: 0 }],
        { duration: 750, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' }
      );
      a.onfinish = () => ring.remove();
      anims.push(a);
    };
    _anaAccPulse = { iv: setInterval(fire, 900), anims };
    fire();
  }

  function _renderAnaReadiness(h) {
    const readiness = getReadinessScore();
    const examDateStr = getExamDate();
    const daysToExam = getDaysToExam();
    const forecast = getReadinessForecast();

    // All-Time Stats (merged into hero in v4.32)
    const totalQ = h.reduce((a,e) => a + e.total, 0);
    const totalCorrect = h.reduce((a,e) => a + e.score, 0);
    const studyDays = new Set(h.map(e => new Date(e.date).toISOString().slice(0,10))).size;

    if (!readiness) return '';

    const { predicted, domainAccuracy } = readiness;
    let tier, tierColor, tierBg;
    if (predicted >= EXAM_PASS_SCORE)      { tier = 'Exam Ready';   tierColor = 'var(--green)';  tierBg = 'rgba(34,197,94,.12)'; }
    else if (predicted >= 650) { tier = 'Getting Close'; tierColor = 'var(--orange)'; tierBg = 'rgba(251,146,60,.12)'; }
    else if (predicted >= 500) { tier = 'Building';     tierColor = 'var(--yellow)'; tierBg = 'rgba(251,191,36,.12)'; }
    else                       { tier = 'Not Ready';    tierColor = 'var(--red)';    tierBg = 'rgba(248,113,113,.12)'; }
    const barPct = Math.max(0, Math.min(100, ((predicted - 420) / 450) * 100));

    // v4.46.0: merged date + countdown chip (built via shared _buildExamDateChipHtml)
    const dateChip = _buildExamDateChipHtml(examDateStr, daysToExam, 'ana-exam-date-input');

    // v4.46.0: PASS tick on the readiness bar. Bar scale is 420–870 (range 450),
    // pass is 720, so tick sits at (720-420)/450 = 66.67%. Pedagogically important:
    // users see at a glance how far past (or short of) the pass mark they are.
    const passTickPct = ((EXAM_PASS_SCORE - 420) / 450) * 100;

    // v4.46.0: Domain rows — tier-anchored color dots (matches Domain Mastery
    // thresholds 55/70/80; v4.85.11 lowered Mastered 85→80), weight as subtle
    // subtext under the domain name, 80% target tick on each bar.
    // v4.57.5: user-visible pct now comes from the shared computeDomainRawAccuracy
    // helper so this matches the Domain Mastery card (pre-v4.57.5 used the weighted
    // `domainAccuracy` from Readiness internals — disagreed by 1-2% with Domain
    // Mastery's raw calc and confused users). Weighted `domainAccuracy` stays
    // internal for the 720-tier Readiness score calculation below.
    const domainRawAccuracy = computeDomainRawAccuracy(h);
    const domainBars = Object.entries(DOMAIN_WEIGHTS).map(([d, w]) => {
      const pct = Math.round(domainRawAccuracy[d] || 0);
      let tier, barColor;
      if (pct >= 80)      { tier = 'mastered'; barColor = 'var(--green)'; }
      else if (pct >= 70) { tier = 'proficient'; barColor = 'var(--accent-light)'; }
      else if (pct >= 55) { tier = 'developing'; barColor = 'var(--yellow)'; }
      else if (pct > 0)   { tier = 'novice'; barColor = 'var(--red)'; }
      else                { tier = 'empty'; barColor = 'var(--surface3)'; }
      const label = DOMAIN_LABELS[d];
      return `<div class="ana-domain-row ana-domain-row-${tier}">
        <div class="ana-domain-info">
          <span class="ana-domain-dot" style="background:${barColor}" aria-hidden="true"></span>
          <div class="ana-domain-meta">
            <div class="ana-domain-name">${label}</div>
            <div class="ana-domain-weight">${Math.round(w * 100)}% of exam</div>
          </div>
        </div>
        <div class="ana-domain-bar">
          <div class="ana-domain-fill" style="width:${pct}%;background:${barColor}"></div>
          <div class="ana-domain-target" aria-hidden="true" title="80% mastery target"></div>
        </div>
        <div class="ana-domain-pct" style="color:${barColor}">${pct > 0 ? pct + '%' : '—'}</div>
      </div>`;
    }).join('');

    // v4.46.0: Stats strip — icons above numbers, hairline dividers between tiles.
    // v4.54.8: inline sparkline under each number showing ~12-week trend.
    const _series = _weeklyStatSeries(h, 12);
    // v7.13.0: cardiac-monitor sweep — a dim full trend line (.spark-base) plus a
    // bright phosphor scan (.spark-scan, same path) animated via stroke-dashoffset.
    // Per-card color + a stagger index keep the 4 cards out of sync. CSS drives the
    // sweep cadence; reduced-motion hides .spark-scan (static base only).
    const _SPARK_DUR = [2.6, 2.9, 2.3, 3.05];   // sessions, questions, accuracy, studyDays
    const _SPARK_DELAY = [0, 0.5, 0.25, 0.8];
    const _mkSpark = (vals, strokeVar, idx) => {
      const d = _sparkPath(vals, 160, 28);
      if (!d) return '';
      const i = idx || 0;
      const dur = _SPARK_DUR[i] || 2.6;
      const delay = _SPARK_DELAY[i] || 0;
      return `<svg class="ana-hero-stat-spark" viewBox="0 0 160 28" preserveAspectRatio="none" aria-hidden="true" style="--spark-color:${strokeVar};--sweep-dur:${dur}s;--sweep-delay:${delay}s">
        <path class="spark-base" d="${d}" pathLength="100" fill="none" stroke="${strokeVar}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
        <path class="spark-scan" d="${d}" pathLength="100" fill="none" stroke="${strokeVar}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
      </svg>`;
    };
    const statsHtml = `
        <div class="ana-hero-stat">
          <div class="ana-hero-stat-icon" aria-hidden="true">📚</div>
          <div class="ana-hero-stat-val">${h.length}</div>
          <div class="ana-hero-stat-lbl">Sessions</div>
          ${_mkSpark(_series.sessions, 'var(--accent-light)', 0)}
        </div>
        <div class="ana-hero-stat">
          <div class="ana-hero-stat-icon" aria-hidden="true"></div>
          <div class="ana-hero-stat-val">${totalQ.toLocaleString()}</div>
          <div class="ana-hero-stat-lbl">Questions</div>
          ${_mkSpark(_series.questions, 'var(--accent-light)', 1)}
        </div>
        <div class="ana-hero-stat">
          <div class="ana-hero-stat-icon" aria-hidden="true"></div>
          <div class="ana-hero-stat-val">${totalQ > 0 ? Math.round(totalCorrect/totalQ*100) : 0}%</div>
          <div class="ana-hero-stat-lbl">Accuracy</div>
          ${_mkSpark(_series.accuracy, 'var(--green)', 2)}
        </div>
        <div class="ana-hero-stat">
          <div class="ana-hero-stat-icon" aria-hidden="true"></div>
          <div class="ana-hero-stat-val">${studyDays}</div>
          <div class="ana-hero-stat-lbl">Study Days</div>
          ${_mkSpark(_series.studyDays, 'var(--orange)', 3)}
        </div>`;

    return `<div class="ana-card ana-ready-hero" id="ana-s-readiness">
      <div class="ana-ready-head">
        <div class="ana-ready-head-left">
          <h3 class="ana-ready-title">EXAM READINESS</h3>
          <div class="ana-subtitle">CompTIA-domain-weighted · ${EXAM_PASS_SCORE} = pass</div>
        </div>
        ${dateChip}
      </div>
      <div class="ana-ready-hero-row">
        <div class="ana-ready-score-block">
          <div class="ana-ready-num-wrap">
            <span class="ana-ready-num" style="color:${tierColor}">${predicted}</span>
            <span class="ana-ready-denom">/ 900</span>
          </div>
          <div class="ana-ready-badge" style="background:${tierBg};color:${tierColor}">${tier}</div>
        </div>
        <div class="ana-ready-bar-wrap">
          <div class="ana-ready-bar">
            <div class="ana-ready-bar-fill" style="width:${barPct}%;background:${tierColor}"></div>
            <div class="ana-ready-bar-passtick" style="left:${passTickPct}%" aria-hidden="true"></div>
            <div class="ana-ready-bar-passlabel" style="left:${passTickPct}%" aria-hidden="true">${EXAM_PASS_SCORE} PASS</div>
          </div>
          <div class="ana-ready-bar-scale" aria-hidden="true">
            <span>420</span>
            <span>870</span>
          </div>
        </div>
      </div>
      <div class="ana-domain-breakdown">
        <div class="ana-domain-header">CompTIA domain breakdown</div>
        ${domainBars}
      </div>
      <div class="ana-hero-stats">${statsHtml}
      </div>
    </div>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // v4.85.14 — "Why your score?" breakdown card
  //
  // Sits directly under the Exam Readiness card on the Analytics page and
  // surfaces the readiness formula as a 4-bar component breakdown + plain-
  // English diagnosis + 2 click-through action cards. Replaces the previous
  // "user asks Claude to explain why my score is X" feedback loop with a
  // permanent self-explaining UI surface.
  //
  // Reads existing data from getReadinessScore() — no new state, no new
  // computation pipeline. The two action cards reuse existing flows:
  //   - "Refresh recency" → multi-topic quiz seeded with the 8 staleest topics
  //   - "Drill 3 weakest" → multi-topic quiz seeded with whatIf top 3
  //
  // Concept-mockup-first per memory feedback_concept_mockup_first.md —
  // mockup at mockups/readiness-why-card-concept.html, user approved 2026-05-01.
  // ─────────────────────────────────────────────────────────────────────────
  function _renderAnaWhyScore(readiness) {
    if (!readiness) return '';
    const r = readiness;
    const esc = (typeof escHtml === 'function') ? escHtml : (s => s);
    const passLine = (typeof EXAM_PASS_SCORE === 'number') ? EXAM_PASS_SCORE : 720;
    const gap = Math.max(0, passLine - r.predicted);

    // Component drag = how many points each component is leaving on the table.
    // (100 - score) × weight × 4.5 → equivalent scaled-score points lost.
    const dragPts = {
      accuracy: Math.round((100 - r.accuracyScore) * 0.40 * 4.5),
      coverage: Math.round((100 - r.coverageScore) * 0.25 * 4.5),
      recency:  Math.round((100 - r.recencyScore)  * 0.20 * 4.5),
      volume:   Math.round((100 - r.volumeScore)   * 0.15 * 4.5)
    };
    const components = [
      { key: 'accuracy', name: 'Accuracy', meta: '40% weight · domain-weighted, recency-decayed', score: r.accuracyScore, drag: dragPts.accuracy },
      { key: 'coverage', name: 'Coverage', meta: '25% weight · how many of ' + r.totalTopics + ' topics studied', score: r.coverageScore, drag: dragPts.coverage },
      { key: 'recency',  name: 'Recency',  meta: '20% weight · 14-day half-life on every topic', score: r.recencyScore, drag: dragPts.recency },
      { key: 'volume',   name: 'Volume',   meta: '15% weight · capped at 500+ Qs', score: r.volumeScore, drag: dragPts.volume }
    ];
    // Bottleneck = component with the highest drag points.
    const bottleneck = Object.keys(dragPts).reduce((best, k) => dragPts[k] > dragPts[best] ? k : best, 'accuracy');

    const tierClass = (score) => {
      if (score >= 80) return 'tier-good';
      if (score >= 50) return 'tier-ok';
      if (score >= 25) return 'tier-low';
      return 'tier-critical';
    };
    const pctClass = (score) => score >= 50 ? '' : (score >= 25 ? 'is-low' : 'is-critical');

    const barsHtml = components.map(c => {
      const w = Math.max(2, Math.round(c.score));
      return `<div class="why-bar-row">
        <div class="why-bar-label">
          <div class="why-bar-name">${esc(c.name)}</div>
          <div class="why-bar-meta">${esc(c.meta)}</div>
        </div>
        <div class="why-bar-track">
          <div class="why-bar-fill ${tierClass(c.score)}" style="width: ${w}%"></div>
        </div>
        <div class="why-bar-pct ${pctClass(c.score)}">${Math.round(c.score)}%</div>
      </div>`;
    }).join('');

    // Diagnosis paragraph — generated from the bottleneck component.
    const stale7d = Array.isArray(r.staleTopics) ? r.staleTopics.filter(s => s.daysSince > 7).length : 0;
    const stale14d = Array.isArray(r.staleTopics) ? r.staleTopics.filter(s => s.daysSince > 14).length : 0;
    const unstudied = r.totalTopics - r.studiedCount;
    let diagnosisHtml = '';
    if (bottleneck === 'recency') {
      diagnosisHtml = `<strong>Recency is the bottleneck.</strong> ${stale7d} of your ${r.totalTopics} topics were last practised over a week ago${stale14d > 0 ? ` (${stale14d} of those over two weeks ago, fully decayed)` : ''}, so they're slipping out of the formula. Refreshing them is the fastest way to gain points.`;
    } else if (bottleneck === 'accuracy') {
      diagnosisHtml = `<strong>Accuracy is the bottleneck.</strong> Your domain-weighted accuracy is ${Math.round(r.accuracyScore)}%. Tightening your weakest topics moves the needle most — see the action cards below.`;
    } else if (bottleneck === 'coverage') {
      diagnosisHtml = `<strong>Coverage is the bottleneck.</strong> You've studied ${r.studiedCount} of ${r.totalTopics} topics. ${unstudied} topics with no practice yet are dragging the average down — even a few questions on each closes the gap quickly.`;
    } else {
      diagnosisHtml = `<strong>Volume is the bottleneck.</strong> ${r.totalQs} questions counted toward readiness so far. Volume caps at 500+ — keep practising and it's a free win.`;
    }

    // Action cards — the higher-leverage card gets the "is-primary" orange treatment.
    const refreshTopics = Array.isArray(r.staleTopics) ? r.staleTopics.slice(0, 8) : [];
    const refreshAvailable = refreshTopics.length > 0 && refreshTopics[0].daysSince > 0;
    const weakAvailable = Array.isArray(r.whatIf) && r.whatIf.length > 0;
    const refreshGain = dragPts.recency > 0 ? Math.round(dragPts.recency * 0.55) : 0; // ~55% recovery from refreshing top 8
    const weakGain = weakAvailable ? r.whatIf.reduce((s, w) => s + (w.deltaPredicted || 0), 0) : 0;
    const refreshIsPrimary = bottleneck === 'recency' || (refreshGain >= weakGain && refreshAvailable);

    const refreshCardHtml = refreshAvailable ? `
      <button type="button" class="why-action-card ${refreshIsPrimary ? 'is-primary' : ''}" onclick="_startReadinessRefreshQuiz()">
        <div class="why-action-eyebrow">Refresh recency · ${refreshTopics.length} stale topic${refreshTopics.length === 1 ? '' : 's'}</div>
        <div class="why-action-title">Refresh recency → +${refreshGain} pts</div>
        <div class="why-action-body">5 questions on each of your ${refreshTopics.length} staleest topics${refreshTopics[0] ? ` (oldest: ${esc(refreshTopics[0].topic)}, ${refreshTopics[0].daysSince}d ago)` : ''} — about ${Math.max(15, refreshTopics.length * 3)} minutes total.</div>
        <div class="why-action-cta">Start refresh quiz →</div>
      </button>` : `
      <div class="why-action-card is-disabled">
        <div class="why-action-eyebrow">Refresh recency</div>
        <div class="why-action-title">Already fresh</div>
        <div class="why-action-body">No topics older than today. Keep up the regular practice cadence.</div>
      </div>`;

    const weakCardHtml = weakAvailable ? `
      <button type="button" class="why-action-card ${!refreshIsPrimary ? 'is-primary' : ''}" onclick="_startReadinessWeakestQuiz()">
        <div class="why-action-eyebrow">Tighten accuracy · 3 weakest</div>
        <div class="why-action-title">Drill 3 weakest topics → +${weakGain} pts</div>
        <div class="why-action-body">${r.whatIf.map(w => esc(w.topic) + ' (' + w.currentPct + '%)').join(', ')}. 10 questions each at Hard difficulty.</div>
        <div class="why-action-cta">Start weakest drill →</div>
      </button>` : `
      <div class="why-action-card is-disabled">
        <div class="why-action-eyebrow">Tighten accuracy</div>
        <div class="why-action-title">All topics already strong</div>
        <div class="why-action-body">Every studied topic is at or above 80%. Focus on coverage or recency.</div>
      </div>`;

    return `<div class="ana-card ana-why-score" id="ana-s-why-score">
      <div class="why-head">
        <div>
          <div class="why-eyebrow">Score breakdown</div>
          <h3 class="why-title">Why you're at <em>${r.predicted}</em></h3>
          <div class="why-sub">CompTIA-blueprinted. 4 components contribute to your 100-900 scaled score.</div>
        </div>
        ${gap > 0 ? `<div class="why-gap-pill">${gap} pts to pass · ~5-10 min/day</div>` : `<div class="why-gap-pill is-passing">Above the pass line · keep it up</div>`}
      </div>

      <div class="why-section-label">Where your score comes from</div>
      <div class="why-bars">${barsHtml}</div>

      <div class="why-diagnosis">
        <div class="why-diagnosis-head"><svg class="why-diag-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.7 21.6 20.3 2.4 20.3Z"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="12" y1="16.8" x2="12.01" y2="16.8"/></svg>What's holding you back</div>
        <div class="why-diagnosis-body">${diagnosisHtml}</div>
      </div>

      <div class="why-actions">
        <div class="why-section-label">${gap > 0 ? `Closing the ${gap}-point gap` : 'Where to spend the next session'}</div>
        <div class="why-action-row">
          ${refreshCardHtml}
          ${weakCardHtml}
        </div>
      </div>

      <div class="why-foot">Updates live as you study · all four components recompute after every session</div>
    </div>`;
  }

  // v4.85.14 — Click handler for the "Refresh recency" action card. Seeds a
  // multi-topic quiz with the 8 staleest topics × 5 Qs each at Mixed difficulty.
  // Reuses the Custom Quiz Multi: sentinel + startQuiz pipeline.
  function _startReadinessRefreshQuiz() {
    try {
      const r = (typeof getReadinessScore === 'function') ? getReadinessScore() : null;
      if (!r || !Array.isArray(r.staleTopics) || r.staleTopics.length === 0) {
        if (typeof showToast === 'function') showToast('No stale topics to refresh · keep practising the rotation.', 'info');
        return;
      }
      const stale = r.staleTopics.slice(0, 8);
      const topicNames = stale.map(s => s.topic);
      if (topicNames.length === 0) return;
      topic = 'Multi: ' + topicNames.join(', ');
      activeQuizTopic = topic;
      diff = 'Exam Level';
      qCount = topicNames.length * 5; // 5 per topic
      // Sync chip state so Custom Quiz reflects what's running (matches applyDomainPreset pattern)
      const g = document.getElementById('topic-group');
      if (g) {
        g.querySelectorAll('.chip.cq-mode-card').forEach(c => { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
        g.querySelectorAll('.chip:not(.cq-mode-card)').forEach(c => {
          const isInList = topicNames.includes(c.dataset.v);
          c.classList.toggle('on', isInList);
          c.setAttribute('aria-pressed', isInList ? 'true' : 'false');
        });
      }
      document.querySelectorAll('#diff-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === diff));
      document.querySelectorAll('#count-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === String(qCount)));
      if (typeof syncChipAriaPressed === 'function') {
        syncChipAriaPressed('#topic-group');
        syncChipAriaPressed('#diff-group');
        syncChipAriaPressed('#count-group');
      }
      if (typeof startQuiz === 'function') startQuiz();
    } catch (e) {
      if (typeof showErrorToast === 'function') showErrorToast('Could not start refresh quiz: ' + (e && e.message ? e.message : 'unknown error'));
    }
  }

  // v4.85.14 — Click handler for the "Drill weakest" action card. Seeds a
  // multi-topic quiz with the top 3 highest-leverage weak topics from the
  // existing whatIf attribution × 10 Qs each at Hard difficulty.
  function _startReadinessWeakestQuiz() {
    try {
      const r = (typeof getReadinessScore === 'function') ? getReadinessScore() : null;
      if (!r || !Array.isArray(r.whatIf) || r.whatIf.length === 0) {
        if (typeof showToast === 'function') showToast('No weak topics identified yet · keep studying to surface them.', 'info');
        return;
      }
      const weak = r.whatIf.slice(0, 3);
      const topicNames = weak.map(w => w.topic).filter(Boolean);
      if (topicNames.length === 0) return;
      topic = 'Multi: ' + topicNames.join(', ');
      activeQuizTopic = topic;
      diff = 'Hard / Tricky';
      qCount = topicNames.length * 10;
      const g = document.getElementById('topic-group');
      if (g) {
        g.querySelectorAll('.chip.cq-mode-card').forEach(c => { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
        g.querySelectorAll('.chip:not(.cq-mode-card)').forEach(c => {
          const isInList = topicNames.includes(c.dataset.v);
          c.classList.toggle('on', isInList);
          c.setAttribute('aria-pressed', isInList ? 'true' : 'false');
        });
      }
      document.querySelectorAll('#diff-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === diff));
      document.querySelectorAll('#count-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === String(qCount)));
      if (typeof syncChipAriaPressed === 'function') {
        syncChipAriaPressed('#topic-group');
        syncChipAriaPressed('#diff-group');
        syncChipAriaPressed('#count-group');
      }
      if (typeof startQuiz === 'function') startQuiz();
    } catch (e) {
      if (typeof showErrorToast === 'function') showErrorToast('Could not start weakest drill: ' + (e && e.message ? e.message : 'unknown error'));
    }
  }

  // v4.54.14: reusable card-level editorial head (eyebrow + italic-accent
  // mini-title) \u2014 unifies the Analytics secondary cards that still had plain
  // `<h3>CAPS TITLE</h3>` with the editorial branding used everywhere else.
  // `eyebrow` = leading kicker ("Trend \u00b7 last 20 sessions" etc.), `title` is
  // the display phrase, `em` is the word that gets the italic accent.
  function _edCardhead(eyebrow, title, em) {
    const esc = (typeof escHtml === 'function') ? escHtml : (s => s);
    return `<div class="ed-cardhead">
      <div class="ed-cardhead-eyebrow">${esc(eyebrow || '')}</div>
      <h3 class="ed-cardhead-title">${esc(title || '')} ${em ? `<em>${esc(em)}</em>` : ''}</h3>
    </div>`;
  }

  function _renderAnaTrend(h) {
    const recent = h.slice(0, 20).reverse();
    return `<div class="ana-card" id="ana-s-trend">
      ${_edCardhead(`Trend \u00b7 last ${recent.length} sessions`, 'Accuracy', 'trend.')}
      <div class="ana-chart">
        <div class="ana-chart-line" style="bottom:80%"><span class="ana-chart-lbl">80%</span></div>
        <div class="ana-chart-line" style="bottom:60%"><span class="ana-chart-lbl">60%</span></div>
        <div class="ana-chart-bars">
          ${recent.map((e, i) => {
            const color = e.pct >= 80 ? 'var(--green)' : e.pct >= 60 ? 'var(--blue)' : 'var(--red)';
            const day = new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            return `<div class="ana-bar-wrap">
              <div class="ana-bar" style="height:${e.pct}%;background:${color};animation-delay:${i * 0.05}s">
                <div class="ana-bar-tip"><strong>${e.pct}%</strong><span>${day}</span></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="ana-avg">Average: <strong>${Math.round(h.reduce((a,e)=>a+e.pct,0)/h.length)}%</strong></div>
    </div>`;
  }

  function _renderAnaDifficulty(h) {
    const diffs = {};
    h.forEach(e => {
      const d = e.difficulty || e.diff || DEFAULT_DIFF;
      if (!diffs[d]) diffs[d] = { correct: 0, total: 0 };
      diffs[d].correct += e.score;
      diffs[d].total += e.total;
    });
    return `<div class="ana-card">
      ${_edCardhead('Tiers \u00b7 per-difficulty accuracy', 'Difficulty', 'breakdown.')}
      <div class="ana-diff-grid">
        ${Object.entries(diffs).map(([d, v], idx) => {
          const pct = v.total > 0 ? Math.round(v.correct / v.total * 100) : 0;
          const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--blue)' : 'var(--red)';
          return `<div class="ana-diff-item">
            <div class="ana-diff-name">${escHtml(d)}</div>
            <div class="ana-diff-bar"><div class="ana-diff-fill" style="width:${pct}%;background:${color};animation-delay:${idx * 0.15}s"></div></div>
            <div class="ana-diff-pct" style="color:${color}">${pct}%</div>
            <div class="ana-diff-count">${v.correct}/${v.total} correct</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // v4.42.2: _renderAnaTopics (Topic Mastery card) deleted. Topic-level accuracy
  // now lives exclusively on the Progress page, which has filter/sort/search +
  // per-row drill buttons the flat Topic Mastery card never had. Trend arrows
  // (the one genuinely useful bit of Topic Mastery) moved into Progress rows
  // via _buildProgressRows + _progressRowHtml. This helper replaces it with a
  // compact CTA that points the user at the Progress page.
  function _renderAnaTopicsCta() {
    return `<div class="ana-card ana-topics-cta">
      ${_edCardhead('Topics \u00b7 per-topic view', 'Topic-level', 'breakdown.')}
      <div class="ana-subtitle">Per-topic accuracy with domain grouping, search, filter + drill lives on the Progress page.</div>
      <button type="button" class="ana-topics-cta-btn" onclick="showPage('progress');renderProgressPage()">
        <span>\ud83d\udcc8 Open Progress page</span>
        <span class="ana-topics-cta-arrow">\u2192</span>
      </button>
    </div>`;
  }

  function _renderAnaActivity(h) {
    const today = new Date();
    const dayMap = {};
    h.forEach(e => {
      const d = new Date(e.date).toISOString().slice(0,10);
      dayMap[d] = (dayMap[d] || 0) + (e.total || 0);
    });
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      days.push({ date: key, count: dayMap[key] || 0, day: d.toLocaleDateString('en-US',{weekday:'short'}).charAt(0), num: d.getDate() });
    }
    const maxCount = Math.max(...days.map(d => d.count), 1);
    const totalQ30 = days.reduce((a, d) => a + d.count, 0);
    return `<div class="ana-card" id="ana-s-activity">
      ${_edCardhead(`Pulse \u00b7 ${totalQ30} questions in 30 days`, 'Study', 'activity.')}
      <div class="ana-calendar">
        ${days.map((d, idx) => {
          const intensity = d.count > 0 ? Math.max(0.2, d.count / maxCount) : 0;
          const bg = d.count > 0 ? `rgba(var(--accent-rgb),${intensity})` : 'var(--surface3)';
          const activeClass = d.count > 0 ? ' cal-active' : '';
          const hotClass = d.count === maxCount && d.count > 0 ? ' cal-hot' : '';
          return `<div class="ana-cal-day${activeClass}${hotClass}" style="background:${bg};animation-delay:${idx * 0.02}s" data-count="${d.count}">
            <span class="ana-cal-num">${d.num}</span>
            ${d.count > 0 ? `<span class="cal-tip">${d.count} Q's</span>` : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="ana-cal-legend">
        <span>Less</span>
        <div class="ana-cal-day-sm" style="background:var(--surface3)"></div>
        <div class="ana-cal-day-sm" style="background:rgba(var(--accent-rgb),.2)"></div>
        <div class="ana-cal-day-sm" style="background:rgba(var(--accent-rgb),.5)"></div>
        <div class="ana-cal-day-sm" style="background:rgba(var(--accent-rgb),.8)"></div>
        <div class="ana-cal-day-sm" style="background:rgba(var(--accent-rgb),1)"></div>
        <span>More</span>
      </div>
    </div>`;
  }

  function _renderAnaExams(h) {
    // v4.85.20: filter to actual exam SUMMARY entries only — exclude the per-topic
    // splits that v4.81.13 saves alongside each exam. Splits have actual topic names
    // (e.g., "BGP", "OSPF") while the summary uses topic === EXAM_TOPIC. Pre-v4.85.20
    // splits with 1-4 questions each were rendering as "900 PASS" rows, making one
    // 90-Q exam look like 50+ separate exams in the history list.
    const exams = h.filter(e => e.mode === 'exam' && e.topic === EXAM_TOPIC);
    if (exams.length === 0) return '';
    return `<div class="ana-card">
      ${_edCardhead('Exams \u00b7 scaled scores over time', 'Exam', 'history.')}
      <div class="ana-exams">
        ${exams.map(e => {
          const scaled = Math.round(100 + (e.score / e.total) * 800);
          const pass = scaled >= EXAM_PASS_SCORE;
          const date = new Date(e.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'});
          return `<div class="ana-exam-row">
            <div class="ana-exam-score" style="color:${pass ? 'var(--green)' : 'var(--red)'}">${scaled}</div>
            <div class="ana-exam-badge" style="background:${pass ? 'rgba(var(--green-rgb),.1)' : 'rgba(var(--red-rgb),.1)'};color:${pass ? 'var(--green)' : 'var(--red)'}">${pass ? 'PASS' : 'FAIL'}</div>
            <div class="ana-exam-details">${e.score}/${e.total} correct (${e.pct}%)</div>
            <div class="ana-exam-date">${date}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  function _renderAnaStreak() {
    const streak = getStreakData();
    const h = loadHistory();
    const isActive = streak.currentStreak > 0;

    // v4.46.1: heat tier drives left-tile gradient + flame pulse + num color.
    // Anchored to behavioural observation: 3 days = habit forming, 7 days = hot,
    // 14+ = on fire. Mirrors the Weak Spots 7/14-day half-life constants.
    let heatTier;
    if (!isActive)                       heatTier = 'cold';      // 0 days / dormant
    else if (streak.currentStreak < 3)   heatTier = 'starting';  // 1-2 days, fresh
    else if (streak.currentStreak < 7)   heatTier = 'warm';      // 3-6 days, habit forming
    else if (streak.currentStreak < 14)  heatTier = 'hot';       // 7-13 days, locked in
    else                                 heatTier = 'blazing';   // 14+ days, on fire

    // v7.50.x: brand-illustrative flame (07_study_streak.svg, trimmed per BRAND
    // §7B — no <filter>/<title>/<style>, gradient id namespaced to anaStreakFlame
    // to avoid colliding with the sidebar's sbStreakFlame, outline on currentColor
    // for theme adaptation). Replaces the decorative 🔥/💤 emoji (BRAND §9). The
    // active/dormant distinction is carried by the .ana-streak-card-${heatTier}
    // class (cold tier dims the flame), same convention as the sidebar streak.
    const flameIcon = '<svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="anaStreakFlame" x1="22" y1="18" x2="106" y2="110" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#E27822"/><stop offset="1" stop-color="#C95500"/></linearGradient></defs><path d="M67 19c12 18-2 29 13 41 5 4 11 10 11 22 0 18-13 31-28 31S35 100 35 82c0-14 8-25 19-34 8-7 11-15 13-29z" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path class="ana-streak-core" d="M66 57c8 10-1 17 8 25 3 3 5 6 5 11 0 9-7 16-16 16s-16-7-16-16c0-8 5-14 11-19 5-5 7-9 8-17z" fill="url(#anaStreakFlame)" stroke="#C95500" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    // v4.46.1: last-7-days dot row — visualises the week as filled/empty circles.
    // Today is the rightmost dot. Studied = filled (with flame on today if
    // active), not-studied = empty ring. Turns a static number into a quick
    // "what did my week look like" scan.
    const daySet = new Set(h.map(e => new Date(e.date).toISOString().slice(0, 10)));
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const week = [];
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const studied = daySet.has(key);
      const isToday = key === todayKey;
      week.push({
        studied,
        isToday,
        dayLabel: dayLabels[d.getDay()],
        dateLabel: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      });
    }
    const weekDots = week.map(w => `
      <div class="ana-streak-day${w.studied ? ' ana-streak-day-on' : ''}${w.isToday ? ' ana-streak-day-today' : ''}" title="${w.dateLabel}${w.studied ? ' — studied' : ' — no activity'}">
        <span class="ana-streak-day-lbl">${w.dayLabel}</span>
        <span class="ana-streak-day-dot" aria-hidden="true"></span>
      </div>`).join('');

    const streakMsg = streak.currentStreak === 0
      ? 'Study today to start a new streak'
      : streak.currentStreak === 1 ? 'First day — keep it going tomorrow!'
      : `${streak.currentStreak} days in a row`;

    const lastStudyLabel = streak.lastStudyDate
      ? new Date(streak.lastStudyDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : null;

    return `<div class="ana-card ana-streak-card ana-streak-card-${heatTier}">
      ${_edCardhead('Streak \u00b7 habit forming', 'Study', 'streak.')}
      <div class="ana-streak-grid">
        <div class="ana-streak-big ana-streak-big-${heatTier}">
          <div class="ana-streak-flame" aria-hidden="true">${flameIcon}</div>
          <div class="ana-streak-num">${streak.currentStreak}</div>
          <div class="ana-streak-lbl">${isActive ? 'Day' + (streak.currentStreak === 1 ? '' : 's') + ' strong' : 'Current streak'}</div>
        </div>
        <div class="ana-streak-info">
          <div class="ana-streak-msg">${streakMsg}</div>
          <div class="ana-streak-week" role="group" aria-label="Last 7 days activity">
            ${weekDots}
          </div>
          <div class="ana-streak-meta">
            <div class="ana-streak-stat" title="Longest consecutive study streak on record"><span class="ana-streak-stat-ico">🏆</span><strong>${streak.longestStreak}</strong> day${streak.longestStreak === 1 ? '' : 's'} longest</div>
            ${lastStudyLabel ? `<div class="ana-streak-stat ana-streak-last"><span class="ana-streak-stat-ico">📅</span>Last study: ${lastStudyLabel}</div>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }

  // v4.45.2 — _renderAnaWeakSpots removed per user feedback ("that keyword
  // weakspot is redundant, dont really need it"). The homepage #todays-focus
  // chip row + the new Wrong-Answer Patterns card (v4.45.0) both surface
  // weak areas with more actionable signal. Keyword-frequency from the
  // wrong bank was descriptive-only and duplicated the primary weak-spots
  // flow. mineSubtopicWeakSpots() is still defined in case a future feature
  // wants keyword-frequency analysis; it just doesn't render here anymore.

  // v4.45.0 — replaces the old Difficulty × Topic Heatmap. Prescriptive over
  // descriptive: for each of the 5 official N10-009 domains, shows current
  // accuracy as a progress bar toward the 80% mastery threshold (lowered from
  // 85% in v4.85.11), a tier badge (Novice / Developing / Proficient / Mastered),
  // and a one-click
  // v4.57.5: Shared raw-accuracy aggregator per CompTIA domain. Used by BOTH
  // the Domain Mastery card AND the Readiness hero's Domain Breakdown so the
  // two surfaces always agree. Uses simple sum(correct)/sum(total) across all
  // sessions in the domain — NOT difficulty-weighted or recency-boosted. That
  // weighted calc (see domainAccuracy in getReadinessScore) stays internal for
  // computing the 720-tier Readiness score; the user-visible per-domain % should
  // match how CompTIA actually grades you: raw accuracy. Pre-v4.57.5 the Domain
  // Breakdown used weighted `domainAccuracy[d]` while Domain Mastery used raw,
  // and the two disagreed by 1-2% (user flagged: "69% here, 70% there").
  // Sentinel "Multi: ..." entries skip domain attribution (TOPIC_DOMAINS lookup
  // returns undefined for them) — v4.57.4 handles those via the read-side
  // matcher for per-topic surfaces; domain aggregation stays conservative to
  // avoid double-counting across multi-domain multi-topic sessions.
  function computeDomainRawAccuracy(h) {
    const byDomain = {
      concepts:        { c: 0, t: 0 },
      implementation:  { c: 0, t: 0 },
      operations:      { c: 0, t: 0 },
      security:        { c: 0, t: 0 },
      troubleshooting: { c: 0, t: 0 }
    };
    (h || []).forEach(e => {
      if (!e || !e.topic || e.topic === MIXED_TOPIC || e.topic === EXAM_TOPIC) return;
      const d = TOPIC_DOMAINS[e.topic];
      if (!d || !byDomain[d]) return;
      byDomain[d].c += (e.score || 0);
      byDomain[d].t += (e.total || 0);
    });
    const out = {};
    Object.keys(byDomain).forEach(d => {
      out[d] = byDomain[d].t > 0 ? (byDomain[d].c / byDomain[d].t) * 100 : 0;
    });
    return out;
  }

  // v4.85.7: extracted from _renderAnaDomainMastery() — renders a single row.
  // Either the unstudied "Not started" state or the active progress bar with
  // tier badge + drill button. Pure HTML out.
  // v7.14.0 — Domain Mastery reveal + expand (locked in the combined studio).
  // Reveal on load: bars un-arm from 0 (CSS --dm-fill var + the base 800ms width
  // transition), the % counts up, the tier badge pops, and mastered bars flash as
  // the fill crosses the 80% line. Expand on hover/focus: the row lifts out of the
  // ledger into a card with a detail strip; neighbours dim. All class-driven +
  // WAAPI + textContent — NO inline .style writes (keeps the style budget at 80).
  // Re-bound each analytics render; prior timers cancelled. prefers-reduced-motion
  // shows the final state and keeps the expand (comprehension) without the motion.
  function _dmCountPct(el, target, dur) {
    if (!el) return;
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + '%';
      if (t < 1) requestAnimationFrame(tick); else el.textContent = target + '%';
    };
    requestAnimationFrame(tick);
  }
  function _dmBuildDetail(r) {
    if (r.querySelector('.dm-detail')) return;
    const pct = parseInt(r.getAttribute('data-pct'), 10) || 0;
    const met = pct >= 80;
    const wEl = r.querySelector('.dm-row-weight');
    const weight = wEl ? (parseInt(wEl.textContent, 10) || 0) : 0;
    const d = document.createElement('div');
    d.className = 'dm-detail';
    d.innerHTML = '<div class="dm-detail-inner">' +
      '<span class="dm-detail-item ' + (met ? 'met' : '') + '">' +
        (met ? '<strong>Mastered ✓</strong> at or above the 80% line'
             : '<strong>' + (80 - pct) + '% to mastery</strong> from ' + pct + '%') + '</span>' +
      '<span class="dm-detail-item"><strong>' + weight + '%</strong> of the exam blueprint</span>' +
      '<span class="dm-detail-item">Next: <span class="dm-detail-action">' +
        (met ? 'Review to keep it sharp' : 'Drill weakest topics first') + '</span></span>' +
      '</div>';
    r.appendChild(d);
  }
  function _anaDomainMasteryPlay() {
    if (_anaDMState) { _anaDMState.timers.forEach(clearTimeout); _anaDMState = null; }
    const card = document.getElementById('ana-s-domain-mastery');
    if (!card) return;
    const rows = Array.prototype.slice.call(card.querySelectorAll('.dm-row[data-pct]'));
    const allRows = Array.prototype.slice.call(card.querySelectorAll('.dm-row'));
    if (!rows.length) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const timers = [], anims = [];
    _anaDMState = { timers, anims };
    const at = (ms, fn) => { timers.push(setTimeout(fn, ms)); };

    // detail strips + hover/focus expand (kept under reduced motion — comprehension)
    rows.forEach(r => {
      _dmBuildDetail(r);
      r.setAttribute('tabindex', '0');
      const expand = (on) => {
        r.classList.toggle('dm-lifted', on);
        allRows.forEach(o => { if (o !== r) o.classList.toggle('dm-dim', on); });
        if (!reduce && fine) anims.push(r.animate(
          [{ transform: on ? 'translateY(0) scale(1)' : 'translateY(-2px) scale(1.01)' },
           { transform: on ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)' }],
          { duration: on ? 240 : 180, easing: on ? 'cubic-bezier(0.34,1.56,0.64,1)' : 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' }));
      };
      r.addEventListener('pointerenter', () => expand(true));
      r.addEventListener('pointerleave', () => expand(false));
      r.addEventListener('focus', () => expand(true));
      r.addEventListener('blur', () => expand(false));
    });

    if (reduce) { rows.forEach(r => r.classList.remove('dm-armed', 'dm-pre')); return; }

    // reveal: park bars at 0 + hide badges, then un-arm staggered
    rows.forEach(r => r.classList.add('dm-armed', 'dm-pre'));
    void card.offsetWidth; // reflow so the no-transition width:0 is the start point
    rows.forEach((r, i) => at(i * 110, () => {
      r.classList.remove('dm-armed');
      r.classList.remove('dm-pre');
      const badge = r.querySelector('.dm-row-badge');
      if (badge) anims.push(badge.animate(
        [{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'scale(1)' }],
        { duration: 300, delay: 120, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'backwards' }));
      const target = parseInt(r.getAttribute('data-pct'), 10) || 0;
      _dmCountPct(r.querySelector('.dm-bar-pct'), target, 800);
      if (target >= 80) {
        const tgt = r.querySelector('.dm-bar-target');
        if (tgt) at((80 / target) * 800, () => anims.push(tgt.animate(
          [{ boxShadow: '0 0 0 0 rgba(60,122,69,0.7)' }, { boxShadow: '0 0 0 7px rgba(60,122,69,0)' }],
          { duration: 560, easing: 'cubic-bezier(0.23,1,0.32,1)' })));
      }
    }));
  }

  function _renderAnaDomainMasteryRow(d, data, tierInfo) {
    if (data.t === 0) {
      return `<div class="dm-row dm-row-unstudied" style="--dm-accent:${d.color}">
        <div class="dm-row-head">
          <div class="dm-row-label"><span class="dm-dot"></span><span class="dm-row-text"><span class="dm-row-name">${d.label}</span><span class="dm-row-weight">${d.weight}% of exam</span></span></div>
          <div class="dm-row-badge dm-badge-unstudied">Not started</div>
        </div>
        <div class="dm-bar-wrap">
          <div class="dm-bar-track"><div class="dm-bar-target" style="left:80%" title="80% mastery threshold"></div></div>
          <div class="dm-bar-pct dm-bar-pct-empty">—</div>
        </div>
        <div class="dm-row-foot">
          <span class="dm-row-stats">No questions answered yet</span>
          <button class="dm-drill-btn" onclick="drillDomain('${d.id}')">Start drilling →</button>
        </div>
      </div>`;
    }
    const pct = Math.round((data.c / data.t) * 100);
    const tier = tierInfo(pct);
    return `<div class="dm-row" style="--dm-accent:${d.color}" data-pct="${pct}">
      <div class="dm-row-head">
        <div class="dm-row-label"><span class="dm-dot"></span><span class="dm-row-text"><span class="dm-row-name">${d.label}</span><span class="dm-row-weight">${d.weight}% of exam</span></span></div>
        <div class="dm-row-badge ${tier.cls}">${tier.label}</div>
      </div>
      <div class="dm-bar-wrap">
        <div class="dm-bar-track">
          <div class="dm-bar-fill" style="--dm-fill:${Math.min(pct, 100)}%"></div>
          <div class="dm-bar-target" style="left:80%" title="80% mastery threshold"></div>
        </div>
        <div class="dm-bar-pct">${pct}%</div>
      </div>
      <div class="dm-row-foot">
        <span class="dm-row-stats">${data.c} correct of ${data.t} attempts</span>
        <button class="dm-drill-btn" onclick="drillDomain('${d.id}')">${pct >= 80 ? 'Review →' : 'Drill weakest →'}</button>
      </div>
    </div>`;
  }

  // drill button that fires focusTopic() on the weakest topic within that
  // domain. Unstudied domains get a "Not started" state with a prompt.
  function _renderAnaDomainMastery(h) {
    const domains = [
      { id: 'concepts',        label: '1.0 Networking Concepts',     weight: 23, color: 'oklch(0.50 0.155 55)' },
      { id: 'implementation',  label: '2.0 Network Implementation',  weight: 20, color: '#22c55e' },
      { id: 'operations',      label: '3.0 Network Operations',      weight: 19, color: '#3b82f6' },
      { id: 'security',        label: '4.0 Network Security',        weight: 14, color: '#f59e0b' },
      { id: 'troubleshooting', label: '5.0 Network Troubleshooting', weight: 24, color: '#ef4444' }
    ];
    // v4.57.5: per-domain pct computation extracted to shared helper so Domain
    // Mastery and Readiness hero Domain Breakdown stay in sync. byDomain {c,t}
    // is kept here because this card's "Not started" empty-state and tier counts
    // need the raw totals, not just the pct.
    const byDomain = { concepts: {c:0,t:0}, implementation: {c:0,t:0}, operations: {c:0,t:0}, security: {c:0,t:0}, troubleshooting: {c:0,t:0} };
    h.forEach(e => {
      if (!e.topic || e.topic === MIXED_TOPIC || e.topic === EXAM_TOPIC) return;
      const d = TOPIC_DOMAINS[e.topic];
      if (!d || !byDomain[d]) return;
      byDomain[d].c += e.score;
      byDomain[d].t += e.total;
    });

    const hasAny = domains.some(d => byDomain[d.id].t > 0);
    if (!hasAny) return '';

    // v4.45.1 — tier thresholds shifted after user dispute. Originally 60/75/85
    // (even 15-pt bands above Novice) but that put users who'd likely pass the
    // real CompTIA exam (70-75% raw accuracy) into "Developing," which is
    // psychologically wrong — 70% is refining, not still-learning-fundamentals.
    // v4.45.1 set thresholds 55/70/85; v4.85.11 lowered Mastered 85→80 (user
    // request — 85% felt aspirational to the point of unreachable; 80% still
    // exceeds the real CompTIA pass equivalent (~70-75%) but is achievable
    // through normal practice instead of needing perfect runs).
    const tierInfo = (pct) => {
      if (pct >= 80) return { label: 'Mastered',   cls: 'dm-badge-mastered' };
      if (pct >= 70) return { label: 'Proficient', cls: 'dm-badge-proficient' };
      if (pct >= 55) return { label: 'Developing', cls: 'dm-badge-developing' };
      return           { label: 'Novice',     cls: 'dm-badge-novice' };
    };

    return `<div class="ana-card ana-card-dm" id="ana-s-domain-mastery">
      <h3>DOMAIN MASTERY</h3>
      <div class="ana-subtitle">How close each N10-009 domain is to the 80% mastery threshold</div>
      <div class="dm-list">
        ${domains.map(d => _renderAnaDomainMasteryRow(d, byDomain[d.id], tierInfo)).join('')}
      </div>
      <div class="dm-footer">Weights from official CompTIA N10-009 exam blueprint.</div>
    </div>`;
  }
  // ══════════════════════════════════════════
  // v4.54.2 — KNOWLEDGE CONSTELLATION (Analytics)
  // ══════════════════════════════════════════
  // Ported from the Claude Design prototype — topics as floating nodes,
  // grouped by domain, sized by practice count, inner-circle sized + colored
  // by mastery. Our brand variant: 5-domain palette (purple/green/blue/
  // amber/red) instead of the prototype's weak/ok/strong traffic-light tiers,
  // and anchored to our real history data via TOPIC_DOMAINS + loadHistory().

  // Aggregate per-topic stats for the constellation. Returns an array of
  // { topic, domain, domainIdx, attempts, correct, total, mastery, tier, lastDays }.
  function _computeConstellationData(h) {
    const topicNames = Object.keys(TOPIC_DOMAINS);
    // v4.88.2: cert-aware domain order. Pull from DOMAIN_WEIGHTS (insertion order
    // = CompTIA blueprint order) so Security+ topics map correctly to domain
    // indices instead of returning -1 (Network+ key fallback didn't include
    // 'threats' / 'architecture' / 'governance').
    const domainOrder = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS)
      ? Object.keys(DOMAIN_WEIGHTS)
      : ['concepts', 'implementation', 'operations', 'security', 'troubleshooting'];
    const now = Date.now();
    return topicNames.map(topic => {
      const domain = TOPIC_DOMAINS[topic];
      // v4.57.4: expand matching to include pre-v4.57.1 "Multi: ..." sentinel entries
      const entries = _filterHistoryByTopic(h, topic);
      const total = entries.reduce((a, e) => a + (e.total || 0), 0);
      const correct = entries.reduce((a, e) => a + (e.score || 0), 0);
      const mastery = total > 0 ? Math.round((correct / total) * 100) : null;
      const tier = mastery === null ? 'novice'
        : mastery >= 80 ? 'mastered'
        : mastery >= 70 ? 'proficient'
        : mastery >= 55 ? 'developing'
        : 'novice';
      const lastTs = entries.length
        ? Math.max.apply(null, entries.map(e => new Date(e.date).getTime()))
        : 0;
      const lastDays = lastTs > 0 ? Math.floor((now - lastTs) / 86400000) : null;
      return {
        topic,
        domain,
        domainIdx: domainOrder.indexOf(domain),
        attempts: total,
        correct,
        total,
        mastery,
        tier,
        lastDays
      };
    });
  }

  // Render the constellation card as an SVG. Topics cluster by domain, nodes are
  // sized by attempts (sqrt scale so a 50-question topic isn't 10x bigger than a
  // 5-question topic), inner fill is mastery %, outer halo is the full node size.
  // Click → drillTopic() which focuses the topic and jumps to setup. Hover shows
  // a title tooltip (native SVG, works cross-theme + cross-browser).
  function _renderAnaConstellation(h) {
    const data = _computeConstellationData(h);
    const studied = data.filter(d => d.attempts > 0).length;
    const totalTopics = data.length;
    // Empty-state: show friendly text if no studied topics yet
    if (studied === 0) {
      return `<div class="ana-card ana-constellation" id="ana-s-constellation">
        <div class="ana-card-head">
          <h3>\u2728 Knowledge <em>constellation</em></h3>
          <span class="ana-card-sub">size = times practised \u00b7 fill = mastery</span>
        </div>
        <div class="ana-const-empty">
          <span class="ana-const-empty-ico">\u2728</span>
          <p>Your constellation will light up as you study.</p>
          <p class="ana-const-empty-sub">Each topic becomes a star \u2014 brighter and bigger as you practise it.</p>
        </div>
      </div>`;
    }

    // Layout: 5 domain clusters positioned around the viewBox. Coordinates chosen
    // to give each cluster room for up to ~13 nodes without heavy overlap (the
    // app's topic catalog splits roughly evenly across 5 domains). Viewport is
    // 1000x440 to match the prototype proportions.
    const W = 1000, H = 440;
    // v4.88.2: cert-aware cluster construction. Build CLUSTERS from
    // DOMAIN_WEIGHTS (blueprint-ordered keys) + DOMAIN_LABELS (cert-specific
    // human names) so Security+ shows "General Security Concepts" / "Threats..."
    // / etc. instead of the Network+ "Concepts" / "Implementation" / etc.
    const _DOMAIN_POSITIONS = [
      { cx: W * 0.18, cy: H * 0.38, idx: 1 }, // top-left
      { cx: W * 0.42, cy: H * 0.68, idx: 2 }, // bottom-left
      { cx: W * 0.57, cy: H * 0.28, idx: 3 }, // top-middle
      { cx: W * 0.78, cy: H * 0.62, idx: 4 }, // bottom-right
      { cx: W * 0.92, cy: H * 0.32, idx: 5 }  // top-right
    ];
    const _domainKeysCC = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS)
      ? Object.keys(DOMAIN_WEIGHTS)
      : ['concepts', 'implementation', 'operations', 'security', 'troubleshooting'];
    const _domainLabelsCC = (typeof DOMAIN_LABELS === 'object' && DOMAIN_LABELS)
      ? DOMAIN_LABELS
      : {};
    const CLUSTERS = {};
    _domainKeysCC.forEach((key, i) => {
      const pos = _DOMAIN_POSITIONS[i];
      if (!pos) return;
      CLUSTERS[key] = {
        cx: pos.cx,
        cy: pos.cy,
        label: _domainLabelsCC[key] || key,
        idx: pos.idx
      };
    });
    // Group nodes by domain so we can jitter them around their cluster anchor.
    // Deterministic jitter (angle + radius from topic index) so layout is stable
    // between renders \u2014 matches the prototype's golden-angle trick.
    const nodesByDomain = {};
    Object.keys(CLUSTERS).forEach(d => { nodesByDomain[d] = []; });
    data.forEach(d => {
      if (!nodesByDomain[d.domain]) nodesByDomain[d.domain] = [];
      nodesByDomain[d.domain].push(d);
    });
    const nodes = [];
    Object.entries(nodesByDomain).forEach(([dom, topics]) => {
      const c = CLUSTERS[dom];
      if (!c) return;
      topics.forEach((t, i) => {
        // Golden-angle spiral around the cluster anchor so nodes spread evenly
        const angle = (i * 2.399) + (c.idx * 0.7);  // small per-cluster offset so patterns don't align
        const baseDist = 42 + (i % 4) * 20;          // 4 rings at 42/62/82/102 from center
        // Node radius: sqrt(attempts) scales gracefully 0->5->20
        const r = t.attempts > 0 ? Math.min(22, 6 + Math.sqrt(t.attempts) * 2.2) : 5;
        nodes.push({
          ...t,
          cx: c.cx + Math.cos(angle) * baseDist,
          cy: c.cy + Math.sin(angle) * baseDist,
          r
        });
      });
    });

    // Build SVG markup. Legend at bottom-right.
    const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const clusterLabels = Object.entries(CLUSTERS).map(([dom, c]) => {
      // v4.88.2: render full DOMAIN_LABELS text (e.g., "Networking Concepts" or
      // "General Security Concepts"). Pre-fix this stripped the leading token
      // assuming a "1.0 Concepts" format, which corrupted cert-pack labels.
      return `<g class="ana-const-cluster" data-domain-idx="${c.idx}">
        <text x="${c.cx}" y="${c.cy - 96}" text-anchor="middle" class="ana-const-cluster-num">DOMAIN ${c.idx}</text>
        <text x="${c.cx}" y="${c.cy - 80}" text-anchor="middle" class="ana-const-cluster-name">${esc(c.label)}</text>
      </g>`;
    }).join('');
    const tetherLines = nodes.map(n => {
      const c = CLUSTERS[n.domain];
      return `<line x1="${c.cx}" y1="${c.cy}" x2="${n.cx.toFixed(1)}" y2="${n.cy.toFixed(1)}" class="ana-const-tether" />`;
    }).join('');
    const nodeCircles = nodes.map((n, i) => {
      const masteryFrac = (n.mastery || 0) / 100;
      const innerR = Math.max(2, n.r * masteryFrac + 2);
      const titleParts = [
        `${n.topic}`,
        `Domain: ${CLUSTERS[n.domain].label}`,
        n.mastery !== null ? `Mastery: ${n.mastery}%` : 'Not studied yet',
        n.attempts > 0 ? `Attempts: ${n.attempts}` : null,
        n.lastDays !== null ? (n.lastDays === 0 ? 'Last: today' : n.lastDays === 1 ? 'Last: yesterday' : `Last: ${n.lastDays} days ago`) : null
      ].filter(Boolean);
      const title = esc(titleParts.join(' \u00b7 '));
      const topicEsc = esc(n.topic).replace(/'/g, "&#39;");
      // v4.85.11: data-tt-* attrs feed the custom tooltip helpers below
      const ttDomain = esc(CLUSTERS[n.domain].label);
      const ttMastery = n.mastery !== null ? esc(n.mastery + '%') : 'Not studied yet';
      const ttAttempts = n.attempts > 0 ? esc(String(n.attempts)) : '0';
      const ttLast = n.lastDays !== null
        ? (n.lastDays === 0 ? 'today' : n.lastDays === 1 ? 'yesterday' : esc(n.lastDays + ' days ago'))
        : '\u2014';
      // v4.85.13: removed onclick auto-drill — caused the "tooltip flashes then
      // page navigates" UX bug user reported. Drill action now lives on an
      // explicit button INSIDE the tooltip. Node hover/focus only SHOWS the
      // tooltip; user reads, then clicks the button to drill. Works cleanly
      // on both desktop and touch. Topic name stored on the node so the
      // wireup helper can pull it for the button.
      // v7.13.0: --tw gives each star a different twinkle phase (delay/duration)
      // so the field shimmers asynchronously instead of pulsing in unison.
      return `<g class="ana-const-node ana-const-tier-${n.tier}" data-domain-idx="${CLUSTERS[n.domain].idx}" style="--tw:${i % 7}" data-tt-topic="${esc(n.topic)}" data-tt-topic-raw="${topicEsc}" data-tt-domain="${ttDomain}" data-tt-tier="${esc(n.tier)}" data-tt-mastery="${ttMastery}" data-tt-attempts="${ttAttempts}" data-tt-last="${ttLast}" tabindex="0" aria-label="${title}">
        <title>${title}</title>
        <circle cx="${n.cx.toFixed(1)}" cy="${n.cy.toFixed(1)}" r="${n.r.toFixed(1)}" class="ana-const-halo" />
        <circle cx="${n.cx.toFixed(1)}" cy="${n.cy.toFixed(1)}" r="${innerR.toFixed(1)}" class="ana-const-core" />
      </g>`;
    }).join('');

    // Legend: tier dots matching v4.45.1 Domain Mastery thresholds
    const legendHtml = `
      <div class="ana-const-legend">
        <span class="ana-const-legend-item"><span class="ana-const-legend-dot ana-const-tier-mastered"></span>\u226580% mastered</span>
        <span class="ana-const-legend-item"><span class="ana-const-legend-dot ana-const-tier-proficient"></span>\u226570% proficient</span>
        <span class="ana-const-legend-item"><span class="ana-const-legend-dot ana-const-tier-developing"></span>\u226555% developing</span>
        <span class="ana-const-legend-item"><span class="ana-const-legend-dot ana-const-tier-novice"></span>\u003c55% / not studied</span>
      </div>`;

    return `<div class="ana-card ana-constellation" id="ana-s-constellation">
      <div class="ana-card-head">
        <h3>\u2728 Knowledge <em>constellation</em></h3>
        <span class="ana-card-sub">${studied} of ${totalTopics} topics studied \u00b7 size = practice, color = domain, brightness = mastery</span>
      </div>
      <div class="ana-const-map">
        <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="ana-const-svg" role="img" aria-label="Knowledge constellation map">
          ${clusterLabels}
          ${tetherLines}
          ${nodeCircles}
        </svg>
        <div class="ana-const-tooltip is-hidden" id="ana-const-tooltip" role="tooltip" aria-hidden="true">
          <div class="ana-const-tt-topic"></div>
          <div class="ana-const-tt-domain"></div>
          <div class="ana-const-tt-stats"></div>
          <button type="button" class="ana-const-tt-btn" id="ana-const-tt-btn">Drill into this topic \u2192</button>
        </div>
      </div>
      ${legendHtml}
      <div class="ana-const-hint">Hover any node to see stats \u00b7 use the button to drill</div>
    </div>`;
  }

  // v4.85.13: rebuilt event-delegation pattern after user feedback that v4.85.12
  // tooltip was buggy ("pops up at bottom, only on click, flashes then navigates").
  // New behavior:
  //   - Tooltip shows on mouseover/focusin of any node (delegation, not inline)
  //   - Tooltip stays visible while cursor is anywhere inside the .ana-const-map
  //     (including over the tooltip itself, so user can click the Drill button)
  //   - Tooltip hides only when cursor LEAVES the map entirely (mouseleave on map)
  //   - Click on node does NOTHING (auto-drill removed); drilling goes through
  //     the explicit Drill button inside the tooltip
  //   - Tooltip is positioned at fixed top-center via CSS, never follows the cursor
  // v7.14.0 — Living Constellation: ambient drift. Every star wanders a tiny,
  // individual orbit (two desynced sine waves), studied halos slowly breathe,
  // and a random core sparkles every few seconds. Values locked in the tuning
  // studio: amp 3.2 · speed 0.85 · spread 0.70 · breatheDepth 0.25 ·
  // breatheSpeed 0.60 · twinkleEvery 3.0s · twinkleGlow 9px. This replaces the
  // v7.13.0 CSS twinkle + pulsar (removed in styles.css) so motion never stacks.
  // One rAF loop, re-bound on each analytics re-render (the previous loop is
  // cancelled first) so detached nodes never leak. Transform/opacity/filter only
  // (GPU-friendly); the whole loop is skipped under prefers-reduced-motion.
  function _anaConstWireDrift() {
    if (_anaDriftRaf) { cancelAnimationFrame(_anaDriftRaf); _anaDriftRaf = null; }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const map = document.querySelector('#ana-s-constellation .ana-const-map');
    if (!map) return;
    const nodeEls = Array.prototype.slice.call(map.querySelectorAll('.ana-const-node'));
    if (!nodeEls.length) return;

    const TAU = Math.PI * 2;
    const AMP = 3.2, SPEED = 0.85, SPREAD = 0.70;        // wander
    const BREATHE_DEPTH = 0.25, BREATHE_SPEED = 0.60;    // halo opacity pulse
    const TWINKLE_EVERY = 3.0, TWINKLE_GLOW = 9;         // discrete core sparkle
    const tierBase = { mastered: 0.30, proficient: 0.24, developing: 0.18, novice: 0.12 };

    const stars = nodeEls.map((g, i) => {
      g.style.transition = 'none';        // don't smear per-frame drift through the .2s transform transition
      g.style.transformBox = 'fill-box';
      g.style.transformOrigin = 'center';
      const cls = (g.className && g.className.baseVal != null) ? g.className.baseVal : (g.getAttribute('class') || '');
      const tm = cls.match(/ana-const-tier-(\w+)/);
      const tier = tm ? tm[1] : 'novice';
      const s = i + (parseInt(g.dataset.domainIdx, 10) || 0) * 7.31;
      return {
        g,
        halo: g.querySelector('.ana-const-halo'),
        core: g.querySelector('.ana-const-core'),
        studied: (parseInt(g.dataset.ttAttempts, 10) || 0) > 0,
        base: tierBase[tier] != null ? tierBase[tier] : 0.15,
        fAmpX: 0.7 + ((s * 0.37) % 1) * 0.6,
        fAmpY: 0.7 + ((s * 0.61 + 0.4) % 1) * 0.6,
        fPerX: ((s * 0.53) % 1),
        fPerY: ((s * 0.29 + 0.3) % 1),
        phX: (s * 1.7) % TAU,
        phY: (s * 2.3 + 1.1) % TAU,
        fB: ((s * 0.41) % 1),
        bph: (s * 0.9 + 0.5) % TAU,
      };
    });
    const breathers = stars.filter(d => d.studied && d.halo);

    let nextTwinkle = 1500, tw = null;
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    function frame(now) {
      const t = now - t0;
      for (let k = 0; k < stars.length; k++) {
        const d = stars[k];
        const perX = (6000 + d.fPerX * (4000 * SPREAD + 1500)) / SPEED;
        const perY = (6500 + d.fPerY * (3500 * SPREAD + 1500)) / SPEED;
        const dx = Math.sin((t / perX) * TAU + d.phX) * AMP * d.fAmpX;
        const dy = Math.sin((t / perY) * TAU + d.phY) * AMP * d.fAmpY;
        d.g.style.transform = 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px)';
      }
      for (let k = 0; k < breathers.length; k++) {
        const d = breathers[k];
        // While hovered/focused, clear the inline opacity so the CSS hover state owns the halo.
        if (d.g.matches(':hover') || document.activeElement === d.g) { d.halo.style.opacity = ''; continue; }
        const bper = (4200 + d.fB * 3000) / BREATHE_SPEED;
        const sv = (Math.sin((t / bper) * TAU + d.bph) + 1) * 0.5;
        d.halo.style.opacity = (d.base + sv * BREATHE_DEPTH).toFixed(3);
      }
      if (t >= nextTwinkle && !tw && breathers.length) {
        const d = breathers[(Math.random() * breathers.length) | 0];
        if (d.core && !d.g.matches(':hover')) {
          d.core.style.filter = 'drop-shadow(0 0 ' + TWINKLE_GLOW + 'px rgba(255,255,255,0.9))';
          tw = { core: d.core, until: t + 420 };
        }
        nextTwinkle = t + TWINKLE_EVERY * 1000 * (0.6 + Math.random() * 0.8);
      }
      if (tw && t >= tw.until) { tw.core.style.filter = ''; tw = null; }  // revert to CSS tier filter

      _anaDriftRaf = requestAnimationFrame(frame);
    }
    _anaDriftRaf = requestAnimationFrame(frame);
  }

  function _anaConstWireTooltip() {
    try {
      const map = document.querySelector('#ana-s-constellation .ana-const-map');
      if (!map || map.dataset.tooltipWired === '1') return;
      map.dataset.tooltipWired = '1';
      const findNode = (target) => {
        let el = target;
        while (el && el !== map) {
          if (el.classList && el.classList.contains && el.classList.contains('ana-const-node')) return el;
          el = el.parentNode;
        }
        return null;
      };
      // Show on hover/focus of any node \u2014 delegation via bubbling events
      map.addEventListener('mouseover', (e) => {
        const node = findNode(e.target);
        if (!node) return;
        _anaConstTooltipShow(node);
      });
      map.addEventListener('focusin', (e) => {
        const node = findNode(e.target);
        if (!node) return;
        _anaConstTooltipShow(node);
      });
      // Hide ONLY when leaving the entire map (not when leaving a single node).
      // mouseleave does not bubble, so we listen directly on the map element.
      map.addEventListener('mouseleave', () => _anaConstTooltipHide());
      // Keyboard: hide when focus leaves the map entirely (relatedTarget outside)
      map.addEventListener('focusout', (e) => {
        if (e.relatedTarget && map.contains(e.relatedTarget)) return;
        _anaConstTooltipHide();
      });
    } catch (_) { /* defensive */ }
  }

  // v4.85.11: Knowledge Constellation custom tooltip \u2014 replaces the slow,
  // OS-styled native SVG `<title>` tooltip with a styled, instantly-visible
  // blurb on node hover/focus. Reads data-tt-* attributes from the hovered
  // node so we don't duplicate state in two places. Falls back gracefully
  // when the tooltip element is missing (e.g. constellation re-rendered
  // mid-hover). Mouse + keyboard surfaces both wired.
  // v4.85.13: simplified \u2014 tooltip lives at fixed top-center via CSS, no cursor
  // tracking. Show populates content + binds the Drill button to focusTopic for
  // the hovered topic. Hide just toggles visibility. Position fn removed.
  function _anaConstTooltipShow(nodeEl) {
    try {
      const tt = document.getElementById('ana-const-tooltip');
      if (!tt || !nodeEl) return;
      const d = nodeEl.dataset || {};
      const tiers = { mastered: '\u2605 Mastered', proficient: '\u25c6 Proficient', developing: '\u25d0 Developing', novice: '\u25cb Novice / not studied' };
      const tierBadge = tiers[d.ttTier] || d.ttTier || '';
      const ttTopic = tt.querySelector('.ana-const-tt-topic');
      const ttDomain = tt.querySelector('.ana-const-tt-domain');
      const ttStats = tt.querySelector('.ana-const-tt-stats');
      const ttBtn = tt.querySelector('.ana-const-tt-btn');
      if (ttTopic) ttTopic.textContent = d.ttTopic || '';
      if (ttDomain) ttDomain.textContent = d.ttDomain || '';
      if (ttStats) {
        const lines = [];
        if (tierBadge) lines.push(tierBadge);
        if (d.ttMastery && d.ttMastery !== 'Not studied yet') lines.push('Mastery: ' + d.ttMastery);
        else if (d.ttMastery === 'Not studied yet') lines.push(d.ttMastery);
        if (d.ttAttempts && d.ttAttempts !== '0') lines.push('Attempts: ' + d.ttAttempts);
        if (d.ttLast && d.ttLast !== '\u2014') lines.push('Last: ' + d.ttLast);
        ttStats.innerHTML = lines.map(l => '<div>' + l + '</div>').join('');
      }
      if (ttBtn) {
        // Wire the explicit drill action to this topic. Re-bind every show so
        // the button reflects whatever topic is currently displayed.
        const topicRaw = d.ttTopicRaw || d.ttTopic || '';
        ttBtn.textContent = 'Drill into ' + (d.ttTopic || 'this topic') + ' \u2192';
        ttBtn.onclick = function() {
          if (typeof focusTopic === 'function' && topicRaw) focusTopic(topicRaw);
        };
      }
      tt.className = 'ana-const-tooltip ana-const-tt-tier-' + (d.ttTier || 'novice');
      tt.setAttribute('aria-hidden', 'false');
    } catch (_) { /* defensive \u2014 tooltip is decorative */ }
  }

  function _anaConstTooltipHide() {
    try {
      const tt = document.getElementById('ana-const-tooltip');
      if (!tt) return;
      tt.className = 'ana-const-tooltip is-hidden';
      tt.setAttribute('aria-hidden', 'true');
    } catch (_) { /* defensive */ }
  }

  // v4.45.0 — replaces the old Question Type Breakdown. Clusters your last 20
  // wrong answers by signal (negation keywords, dominant domain, PBQ type,
  // Hard-difficulty concentration) and surfaces top 3-4 patterns with
  // coaching text + a drill button where action is possible. Fixes the
  // pattern, not just the topic.
  function _renderAnaWrongPatterns() {
    const bank = typeof loadWrongBank === 'function' ? loadWrongBank() : [];
    if (!bank || bank.length === 0) return '';
    // Recent-first; take last 20 wrongs
    const recent = bank.slice().sort((a, b) => new Date(b.addedDate || 0) - new Date(a.addedDate || 0)).slice(0, 20);
    if (recent.length === 0) return '';

    const negationRe = /\b(NOT|EXCEPT|CANNOT|NEVER|LEAST|WORST)\b/i;
    const domainLabels = {
      concepts:        '1.0 Networking Concepts',
      implementation:  '2.0 Network Implementation',
      operations:      '3.0 Network Operations',
      security:        '4.0 Network Security',
      troubleshooting: '5.0 Network Troubleshooting'
    };

    let negationCount = 0;
    const domainCount = {};
    const typeCount = {};
    let hardCount = 0;

    recent.forEach(w => {
      if (w.question && negationRe.test(w.question)) negationCount++;
      const d = TOPIC_DOMAINS[w.topic];
      if (d) domainCount[d] = (domainCount[d] || 0) + 1;
      if (w.type && w.type !== 'mcq') typeCount[w.type] = (typeCount[w.type] || 0) + 1;
      if ((w.difficulty || '').toLowerCase().includes('hard')) hardCount++;
    });

    const patterns = [];
    const total = recent.length;
    const pctStr = (n) => Math.round((n / total) * 100) + '%';

    if (negationCount >= 3) {
      patterns.push({
        icon: '\ud83c\udfaf',
        title: 'NEGATION TRAPS',
        count: negationCount,
        pctStr: pctStr(negationCount),
        desc: `Questions containing <strong>NOT / EXCEPT / CANNOT</strong> tripped you up. You're reading past the trap word. These are highlighted in <strong>bold purple</strong> on the question stem \u2014 slow down when you see one.`,
        drillBtn: null,
        accent: '#ef4444'
      });
    }

    // Dominant domain cluster
    const domEntries = Object.entries(domainCount).sort((a, b) => b[1] - a[1]);
    if (domEntries.length > 0 && domEntries[0][1] >= 3) {
      const [dId, count] = domEntries[0];
      const label = domainLabels[dId] || dId;
      patterns.push({
        icon: '\ud83c\udff7\ufe0f',
        title: 'DOMAIN \u2014 ' + label.toUpperCase(),
        count: count,
        pctStr: pctStr(count),
        desc: `${count} of your last ${total} wrongs cluster in this N10-009 domain. Focused drilling here will tighten the weakest block of your readiness score.`,
        drillBtn: { label: 'Drill ' + label.split(' ').slice(1).join(' ') + ' \u2192', onclick: `drillDomain('${dId}')` },
        accent: '#f59e0b'
      });
    }

    // Multi-select concentration (PBQ structure issues)
    const msCount = typeCount['multi-select'] || 0;
    if (msCount >= 2) {
      patterns.push({
        icon: '\ud83e\udd39',
        title: 'MULTI-SELECT (\u201cCHOOSE TWO\u201d)',
        count: msCount,
        pctStr: pctStr(msCount),
        desc: `You're picking the first correct answer but missing the second. Read <em>every</em> option before submitting \u2014 "Choose TWO" means don't stop at one.`,
        drillBtn: null,
        accent: '#8b5cf6'
      });
    }

    // Hard-difficulty concentration
    if (hardCount >= 4) {
      patterns.push({
        icon: '\ud83d\udd25',
        title: 'HARD-DIFFICULTY CONCENTRATION',
        count: hardCount,
        pctStr: pctStr(hardCount),
        desc: `Many of your recent wrongs are Hard-tier questions. If you're still under 75% on Exam-Level for any domain, drop back to Exam-Level until it's solid before grinding Hard.`,
        drillBtn: null,
        accent: '#3b82f6'
      });
    }

    if (patterns.length === 0) {
      return `<div class="ana-card ana-card-wp" id="ana-s-wrong-patterns">
        ${_edCardhead(`Patterns \u00b7 last ${recent.length} mistakes`, 'Wrong-answer', 'patterns.')}
        <div class="wp-empty">
          <div class="wp-empty-icon">\u2728</div>
          <div class="wp-empty-title">No strong pattern yet</div>
          <div class="wp-empty-body">Your ${recent.length} recent wrong${recent.length === 1 ? '' : 's'} are scattered across domains and question types. That's a good sign \u2014 no single failure mode dominates. Keep drilling and any patterns will surface if they exist.</div>
        </div>
      </div>`;
    }

    return `<div class="ana-card ana-card-wp" id="ana-s-wrong-patterns">
      ${_edCardhead(`Patterns \u00b7 ${recent.length} recent mistakes`, 'Wrong-answer', 'patterns.')}
      <div class="ana-subtitle">Clustered by cause. Fix the pattern, not only the topic.</div>
      <div class="wp-list">
        ${patterns.slice(0, 4).map((p, i) => `
          <div class="wp-pattern" style="--wp-accent:${p.accent}">
            <div class="wp-pattern-head">
              <span class="wp-pattern-rank">${i + 1}</span>
              <span class="wp-pattern-icon" aria-hidden="true">${p.icon}</span>
              <span class="wp-pattern-title">${p.title}</span>
              <span class="wp-pattern-count">${p.count} \u00b7 ${p.pctStr}</span>
            </div>
            <div class="wp-pattern-desc">${p.desc}</div>
            ${p.drillBtn ? `<button class="wp-drill-btn" onclick="${p.drillBtn.onclick}">${p.drillBtn.label}</button>` : ''}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  function _renderAnaExamVsQuiz(h) {
    // v4.85.20: filter exams to summary entries only (topic === EXAM_TOPIC) so the
    // exam-side avg reflects whole-exam scores, not per-topic split percentages
    // (which trend toward 100% on 1-Q rows and skew the comparison).
    const quizEntries = h.filter(e => e.mode !== 'exam' && e.topic !== MIXED_TOPIC && e.topic !== EXAM_TOPIC);
    const examEntries = h.filter(e => e.mode === 'exam' && e.topic === EXAM_TOPIC);
    if (quizEntries.length < 2 || examEntries.length < 1) return '';
    const quizAvg = Math.round(quizEntries.reduce((a, e) => a + e.pct, 0) / quizEntries.length);
    const examAvg = Math.round(examEntries.reduce((a, e) => a + e.pct, 0) / examEntries.length);
    const delta = quizAvg - examAvg;
    let insight, insightColor;
    if (Math.abs(delta) <= 3)      { insight = 'Consistent performance across modes — good sign.'; insightColor = 'var(--green)'; }
    else if (delta > 3)            { insight = `Quiz avg beats exam avg by ${delta} points — timed pressure is costing you. Practice more exam simulations.`; insightColor = 'var(--yellow)'; }
    else                           { insight = `Exam avg beats quiz avg by ${Math.abs(delta)} points — you rise to the occasion.`; insightColor = 'var(--green)'; }
    return `<div class="ana-card">
      ${_edCardhead('Modes \u00b7 timed vs practice', 'Exam vs', 'quiz.')}
      <div class="ana-subtitle">Does timed pressure hurt your performance?</div>
      <div class="ana-mode-compare">
        <div class="ana-mode-item">
          <div class="ana-mode-val" style="color:var(--accent-light)">${quizAvg}%</div>
          <div class="ana-mode-lbl">Quiz avg</div>
          <div class="ana-mode-n">${quizEntries.length} sessions</div>
        </div>
        <div class="ana-mode-divider">vs</div>
        <div class="ana-mode-item">
          <div class="ana-mode-val" style="color:var(--accent-light)">${examAvg}%</div>
          <div class="ana-mode-lbl">Exam avg</div>
          <div class="ana-mode-n">${examEntries.length} sessions</div>
        </div>
      </div>
      <div class="ana-mode-insight" style="color:${insightColor}">${insight}</div>
    </div>`;
  }

  // v4.45.2 — _renderAnaDrills removed per user feedback ("drills don't need
  // stats since they function as practice"). The 5 drill surfaces (Port /
  // Subnet / Acronym Blitz / OSI Sorter / Cable ID) each have their own
  // in-drill dashboards, so duplicating the stats in Analytics was noise.
  // Underlying storage (PORT_BEST / SUBNET_STATS / AB_MASTERY / OS_MASTERY /
  // CB_MASTERY) is untouched — milestones still consume it.

  // v4.45.2 — Milestones card rework per user feedback ("long block of
  // milestones ... better way of showing them"). New layout:
  //   1. Header strip: count + progress bar + %
  //   2. "Recently unlocked" row: up to 4 most-recent unlocks as tiles
  //   3. Collapsed <details> containing the full grid (all 49 milestones)
  // Users get the at-a-glance "how far along am I + what did I just earn"
  // read on the default view, and can expand for the full browse if they want.
  // v7.14.0 — locked-milestone progress [cur,tar] for the hover-detail reveal (numeric badges); guarded at call site.
  const MILESTONE_PROGRESS = {
    hundred_qs: c => [c.totalQs, 100], five_hundred_qs: c => [c.totalQs, 500], thousand_qs: c => [c.totalQs, 1000],
    streak_7: c => [c.streak.currentStreak, 7], streak_30: c => [c.streak.currentStreak, 30],
    ready_650: c => [Math.round(c.readiness.predicted), 650], ready_720: c => [Math.round(c.readiness.predicted), EXAM_PASS_SCORE],
    five_exams: c => [c.exams.length, 5], ten_exams: c => [c.exams.length, 10],
    subnet_50: c => [c.subStats.seen, 50], deep_dive_10: c => [c.ddUses, 10],
    daily_challenge_7: c => [c.dc.bestStreak, 7], daily_challenge_30: c => [c.dc.bestStreak, 30],
    labs_5: c => [c.labsDone, 5], labs_10: c => [c.labsDone, 10],
    simlab_25:   c => [c.drill.simlab && c.drill.simlab.done || 0, 25],
    decision_25: c => [c.drill.decision && c.drill.decision.done || 0, 25],
    whynot_25:   c => [c.drill.whynot && c.drill.whynot.done || 0, 25],
    gauntlet_25: c => [c.drill.gauntlet && c.drill.gauntlet.done || 0, 25],
  };
  // v7.14.0 — Milestones "Trophy Shine × Hover Detail". Shine: recent tiles get a
  // staggered gleam + sparkle on load. Detail: hover lifts + reveals earned-date /
  // progress / hint, neighbours dim. Class-driven + WAAPI (no inline styles);
  // re-bound each render; reduced-motion keeps lift/detail, drops the gleam.
  function _anaMilestonesPlay() {
    if (_anaMsState) { _anaMsState.timers.forEach(clearTimeout); _anaMsState = null; }
    const card = document.getElementById('ana-s-milestones');
    if (!card) return;
    const allTiles = Array.prototype.slice.call(card.querySelectorAll('.ana-milestone'));
    if (!allTiles.length) return;
    const recentTiles = Array.prototype.slice.call(card.querySelectorAll('.ana-ms-recent .ana-milestone'));
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const timers = [];
    _anaMsState = { timers };
    const at = (ms, fn) => { timers.push(setTimeout(fn, ms)); };

    // hover detail — build the extra line once + wire lift/dim
    allTiles.forEach(t => {
      if (!t.querySelector('.ms-extra')) {
        const earned = t.getAttribute('data-ms-earned');
        const prog = t.getAttribute('data-ms-progress');
        let inner;
        if (earned) inner = '<span class="ms-extra-earned">' + earned + '</span>';
        else if (prog) {
          const p = prog.split(','); const w = Math.round((+p[0]) / (+p[1]) * 100);
          inner = '<span class="ms-mini-label">' + p[0] + ' / ' + p[1] + '</span>' +
            '<div class="ms-mini-track"><div class="ms-mini-fill" style="--mp:' + w + '%"></div></div>';
        } else inner = 'Locked — keep going';
        const ex = document.createElement('div'); ex.className = 'ms-extra';
        ex.innerHTML = '<div class="ms-extra-inner">' + inner + '</div>';
        t.appendChild(ex);
      }
      t.setAttribute('tabindex', '0');
      const enter = () => {
        t.classList.add('ms-lift');
        allTiles.forEach(o => { if (o !== t) o.classList.add('ms-dim'); });
        if (!reduce && fine) t.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-3px) scale(1.03)' }], { duration: 240, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards' });
      };
      const leave = () => {
        t.classList.remove('ms-lift');
        allTiles.forEach(o => o.classList.remove('ms-dim'));
        if (!reduce && fine) t.animate([{ transform: 'translateY(-3px) scale(1.03)' }, { transform: 'translateY(0) scale(1)' }], { duration: 180, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' });
      };
      t.addEventListener('pointerenter', enter);
      t.addEventListener('pointerleave', leave);
      t.addEventListener('focus', enter);
      t.addEventListener('blur', leave);
    });

    // trophy shine on the recently-unlocked tiles
    recentTiles.forEach(el => { el.querySelectorAll('.ms-gleam,.ms-spark').forEach(n => n.remove()); el.classList.remove('ms-earned-static'); });
    if (reduce) { recentTiles.forEach(el => el.classList.add('ms-earned-static')); return; }
    recentTiles.forEach((el, i) => at(i * 260, () => {
      el.classList.add('ms-shining');
      el.animate([{ transform: 'scale(0.97)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(0.34,1.56,0.64,1)' });
      const g = document.createElement('div'); g.className = 'ms-gleam'; el.appendChild(g);
      const ga = g.animate([{ transform: 'translateX(-130%)' }, { transform: 'translateX(130%)' }], { duration: 650, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' });
      ga.onfinish = () => g.remove();
      [1, 2, 3].forEach((n, si) => {
        const sp = document.createElement('div'); sp.className = 'ms-spark ms-spark-' + n; el.appendChild(sp);
        const sa = sp.animate([{ opacity: 0, transform: 'scale(0.4) translateY(0)' }, { opacity: 1, transform: 'scale(1) translateY(-4px)' }, { opacity: 0, transform: 'scale(0.6) translateY(-10px)' }], { duration: 560, delay: 260 + si * 90, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' });
        sa.onfinish = () => sp.remove();
      });
      at(1100, () => el.classList.remove('ms-shining'));
    }));
  }

  // NOTE: _renderAnaMilestones() below is a legacy pre-bento full-card milestones
  // renderer that is NOT mounted on the live page (the live Analytics page is the
  // bento board: _anaBtMiles + _anaBtMilestoneData, with the Drills group from
  // _anaDrillsGroupHtml mounted by renderAnalytics + revealed by _anaBtWire).
  // It is retained because tests/uat.js asserts on its markup contract; do not
  // delete without repointing those guards.
  function _renderAnaMilestones() {
    evaluateMilestones(); // unlock any newly-earned milestones on render
    const unlockedMap = getMilestones();
    const totalMilestones = MILESTONE_DEFS.length;
    const unlockedDefs = MILESTONE_DEFS.filter(m => unlockedMap[m.id]);
    const unlockedCount = unlockedDefs.length;
    const pct = totalMilestones > 0 ? Math.round((unlockedCount / totalMilestones) * 100) : 0;
    const recent = unlockedDefs.slice().sort((a, b) => new Date(unlockedMap[b.id]) - new Date(unlockedMap[a.id])).slice(0, 4);
    let _msCtx = null;
    try { if (typeof _buildMilestoneCtx === 'function') _msCtx = _buildMilestoneCtx(); } catch (_) {}
    const _msRel = (iso) => {
      try {
        const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
        if (days <= 0) return 'Earned today';
        if (days === 1) return 'Earned yesterday';
        if (days < 7) return 'Earned ' + days + ' days ago';
        if (days < 14) return 'Earned last week';
        return 'Earned ' + new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } catch (_) { return 'Earned'; }
    };
    const _msProg = (id) => {
      try {
        const f = MILESTONE_PROGRESS[id];
        if (!f || !_msCtx) return '';
        const r = f(_msCtx);
        if (!r || !(r[1] > 0)) return '';
        const cur = Math.max(0, Math.min(r[0] || 0, r[1]));
        return cur >= r[1] ? '' : cur + ',' + r[1];
      } catch (_) { return ''; }
    };
    const renderTile = (m, unlocked) => {
      const dataAttr = unlocked
        ? ` data-ms-earned="${escHtml(_msRel(unlockedMap[m.id]))}"`
        : (function () { const p = _msProg(m.id); return p ? ` data-ms-progress="${p}"` : ''; })();
      return `<div class="ana-milestone ${unlocked ? 'ana-milestone-on' : 'ana-milestone-off'}" title="${escHtml(m.desc)}"${dataAttr}>
      <div class="ana-milestone-label">${escHtml(m.label)}</div>
      <div class="ana-milestone-desc">${escHtml(m.desc)}</div>
    </div>`;
    };
    const recentBlock = recent.length > 0
      ? `<div class="ana-ms-section-title">Recently unlocked</div>
         <div class="ana-ms-recent">${recent.map(m => renderTile(m, true)).join('')}</div>`
      : `<div class="ana-ms-empty">No milestones unlocked yet \u2014 complete a quiz to earn your first badge.</div>`;
    // Drills group shares the single-source helper (also used by the live bento path).
    const drillsGroup = (typeof _anaDrillsGroupHtml === 'function') ? _anaDrillsGroupHtml() : '';
    return `<div class="ana-card ana-card-ms" id="ana-s-milestones">
      <div class="ana-ms-head">
        ${_edCardhead(`Badges \u00b7 ${unlockedCount} of ${totalMilestones} unlocked`, '', 'Milestones.')}
        <div class="ana-ms-progress">
          <span class="ana-ms-count">${unlockedCount}<span class="ana-ms-total"> / ${totalMilestones}</span></span>
          <div class="ana-ms-bar-track"><div class="ana-ms-bar-fill" style="width:${pct}%"></div></div>
          <span class="ana-ms-pct">${pct}%</span>
        </div>
      </div>
      ${recentBlock}
      ${drillsGroup}
      <details class="ana-ms-details">
        <summary class="ana-ms-details-summary">Show all ${totalMilestones} milestones</summary>
        <div class="ana-milestones ana-ms-full-grid">
          ${MILESTONE_DEFS.map(m => renderTile(m, !!unlockedMap[m.id])).join('')}
        </div>
      </details>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // v7.16.0 — ANALYTICS BENTO BOARD
  // ──────────────────────────────────────────────────────────────────────────
  // Faithful lift-and-shift of mockups/analytics/mockup-3-bento.html into the
  // live Analytics page, powered by REAL app data. _anaBentoData(h) produces the
  // exact ANALYTICS_SAMPLE shape the mockup tiles consume; the _anaBt* renderers
  // reproduce the mockup's markup + class names verbatim (only the grid container
  // is renamed .bento → .ana-bento). Motion is CSS-driven (initial values live in
  // inline template styles; CSS classes/transitions animate them) so the JS
  // inline-style ratchet stays under budget. All theming is class + CSS-var only;
  // no literal colors are emitted here.
  // ══════════════════════════════════════════════════════════════════════════

  // Build the ANALYTICS_SAMPLE-shaped data object from real history `h`.
  function _anaBentoData(h) {
    const esc = (typeof escHtml === 'function') ? escHtml : (s => String(s));
    const PASS = (typeof EXAM_PASS_SCORE === 'number') ? EXAM_PASS_SCORE : 720;

    // ── Readiness ───────────────────────────────────────────────────────────
    const r = (typeof getReadinessScore === 'function') ? getReadinessScore() : null;
    const predicted = r ? r.predicted : 0;
    const examDate = (typeof getExamDate === 'function') ? getExamDate() : null;
    const daysToExam = (typeof getDaysToExam === 'function') ? getDaysToExam() : null;
    let tier;
    if (predicted >= PASS)      tier = 'Exam Ready';
    else if (predicted >= 650)  tier = 'Getting Close';
    else if (predicted >= 500)  tier = 'Building';
    else                        tier = 'Not Ready';
    const pointsToPass = Math.max(0, PASS - predicted);
    const barPct = Math.max(0, Math.min(100, ((predicted - 420) / 450) * 100));
    const passTickPct = ((PASS - 420) / 450) * 100;

    // Forecast: project a scaled score on current pace from the accuracy-trend
    // regression (getReadinessForecast). currentProj is a projected per-session
    // pct; map pct→scaled (100 + pct/100*800) and clamp to the 420-870 display
    // band. Falls back to predicted when the trend is flat / insufficient data.
    let forecast = predicted;
    try {
      const f = (typeof getReadinessForecast === 'function') ? getReadinessForecast() : null;
      if (f && !f.trendFlat && typeof f.currentProj === 'number') {
        const projScaled = Math.round(100 + (f.currentProj / 100) * 800);
        forecast = Math.max(420, Math.min(870, Math.max(predicted, projScaled)));
      }
    } catch (_) {}

    const totalQ = h.reduce((a, e) => a + (e.total || 0), 0);
    const totalCorrect = h.reduce((a, e) => a + (e.score || 0), 0);
    const studyDays = new Set(h.map(e => new Date(e.date).toISOString().slice(0, 10))).size;
    const accuracyPct = totalQ > 0 ? Math.round(totalCorrect / totalQ * 100) : 0;
    const _series = (typeof _weeklyStatSeries === 'function') ? _weeklyStatSeries(h, 12)
      : { sessions: [], questions: [], accuracy: [], studyDays: [] };

    const readiness = {
      predicted, passScore: PASS, forecast, daysToExam, examDate, tier, pointsToPass,
      barPct, passTickPct,
      stats: { sessions: h.length, questions: totalQ, accuracy: accuracyPct, studyDays },
      spark: {
        sessions: _series.sessions, questions: _series.questions,
        accuracy: _series.accuracy, studyDays: _series.studyDays,
      },
    };

    // ── Pass-trend accuracy series (week / month / all) ──────────────────────
    // Reuses _renderAnaAccuracyChart's bucketing. Each bucket is daily (week,
    // month) or weekly (all); null buckets are dropped, the last point is "Now".
    const now = Date.now(), DAY = 86400000, WK = 7 * DAY;
    const bucketAcc = (i, span) => {
      const bStart = now - (i + 1) * span, bEnd = now - i * span;
      const ent = h.filter(e => { const t = new Date(e.date).getTime(); return t >= bStart && t < bEnd; });
      const qs = ent.reduce((a, e) => a + (e.total || 0), 0);
      const cs = ent.reduce((a, e) => a + (e.score || 0), 0);
      return qs > 0 ? Math.round((cs / qs) * 100) : null;
    };
    const weekRaw = [];
    for (let i = 6; i >= 0; i--) weekRaw.push({ acc: bucketAcc(i, DAY), lbl: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][6 - i] });
    const monthRaw = [];
    for (let i = 29; i >= 0; i--) monthRaw.push({ acc: bucketAcc(i, DAY), wk: Math.floor((29 - i) / 7) });
    const allRaw = [];
    if (h.length > 0) {
      const oldest = Math.min(...h.map(e => new Date(e.date).getTime()));
      const weeks = Math.max(2, Math.min(26, Math.ceil((now - oldest) / WK)));
      for (let i = weeks - 1; i >= 0; i--) allRaw.push({ acc: bucketAcc(i, WK) });
    }
    // Map to {acc,label} arrays; drop nulls, label sparsely, last = "Now".
    const mkWeek = () => {
      const pts = weekRaw.filter(p => p.acc !== null).map(p => ({ acc: p.acc, label: p.lbl }));
      return pts;
    };
    const mkMonth = () => {
      const valid = monthRaw.filter(p => p.acc !== null);
      return valid.map((p, i) => {
        const isLast = i === valid.length - 1;
        const label = isLast ? 'Now' : (i % 4 === 0 ? 'W' + (Math.floor(i / 4) + 1) : '');
        return { acc: p.acc, label };
      });
    };
    const mkAll = () => {
      const valid = allRaw.filter(p => p.acc !== null);
      return valid.map((p, i) => ({ acc: p.acc, label: i === valid.length - 1 ? 'Now' : '' }));
    };
    let weekPts = mkWeek(), monthPts = mkMonth(), allPts = mkAll();
    // Y-axis bounds: pad around the data, clamp to a sensible 40-100 band.
    const allAcc = [].concat(weekPts, monthPts, allPts).map(p => p.acc);
    let yMin = 52, yMax = 96;
    if (allAcc.length) {
      yMin = Math.max(0, Math.min(60, Math.floor(Math.min.apply(null, allAcc) / 10) * 10 - 4));
      yMax = Math.min(100, Math.max(80, Math.ceil(Math.max.apply(null, allAcc) / 10) * 10 + 4));
    }
    const passTrend = {
      passAcc: 72, yMin, yMax, current: 'month',
      data: { week: weekPts, month: monthPts, all: allPts },
    };

    // ── Domains (5 N10-009 domains, real raw accuracy) ───────────────────────
    const rawAcc = (typeof computeDomainRawAccuracy === 'function') ? computeDomainRawAccuracy(h) : {};
    const domByKey = { concepts: { c: 0, t: 0 }, implementation: { c: 0, t: 0 }, operations: { c: 0, t: 0 }, security: { c: 0, t: 0 }, troubleshooting: { c: 0, t: 0 } };
    h.forEach(e => {
      if (!e.topic || e.topic === MIXED_TOPIC || e.topic === EXAM_TOPIC) return;
      const d = TOPIC_DOMAINS[e.topic];
      if (!d || !domByKey[d]) return;
      domByKey[d].c += (e.score || 0); domByKey[d].t += (e.total || 0);
    });
    const tierOf = (pct) => {
      if (pct >= 80) return 'mastered';
      if (pct >= 70) return 'proficient';
      if (pct >= 55) return 'developing';
      if (pct > 0)   return 'novice';
      return 'unstudied';
    };
    const DOMAIN_NUMS = { concepts: '1.0', implementation: '2.0', operations: '3.0', security: '4.0', troubleshooting: '5.0' };
    const domainKeys = Object.keys(DOMAIN_WEIGHTS);
    const domains = domainKeys.map((k, i) => {
      const pct = Math.round(rawAcc[k] || 0);
      return {
        idx: i + 1, id: k, num: DOMAIN_NUMS[k] || (i + 1) + '.0',
        name: DOMAIN_LABELS[k] || k, weight: Math.round((DOMAIN_WEIGHTS[k] || 0) * 100),
        accuracy: pct, tier: tierOf(pct), questions: domByKey[k] ? domByKey[k].t : 0,
      };
    });

    // ── Topics (constellation nodes) ─────────────────────────────────────────
    // Mirror _computeConstellationData: per-topic real history → mastery/tier.
    // tier 'unstudied' for zero attempts so the sky shows untouched stars.
    const topics = (typeof _computeConstellationData === 'function' ? _computeConstellationData(h) : [])
      .map(t => ({
        domainIdx: (t.domainIdx >= 0 ? t.domainIdx : 0) + 1,
        domainId: t.domain,
        topic: t.topic,
        attempts: t.attempts,
        mastery: t.attempts > 0 ? (t.mastery || 0) : 0,
        tier: t.attempts > 0 ? t.tier : 'unstudied',
      }));

    // ── Why-score (highest-leverage move) ────────────────────────────────────
    const whyScore = _anaBtWhyData(r, domains, esc);

    // ── Wrong-answer patterns ────────────────────────────────────────────────
    const wrongPatterns = _anaBtWrongData(h);

    // ── Difficulty breakdown ─────────────────────────────────────────────────
    const diffAgg = {};
    h.forEach(e => {
      const d = e.difficulty || e.diff || DEFAULT_DIFF;
      if (!diffAgg[d]) diffAgg[d] = { correct: 0, total: 0 };
      diffAgg[d].correct += (e.score || 0); diffAgg[d].total += (e.total || 0);
    });
    // Normalise the app's free-form difficulty labels into Easy/Medium/Hard buckets.
    const diffBuckets = { Easy: { correct: 0, total: 0 }, Medium: { correct: 0, total: 0 }, Hard: { correct: 0, total: 0 } };
    Object.entries(diffAgg).forEach(([label, v]) => {
      const l = label.toLowerCase();
      let key = 'Medium';
      if (l.includes('easy') || l.includes('found') || l.includes('begin')) key = 'Easy';
      else if (l.includes('hard') || l.includes('trick') || l.includes('expert') || l.includes('advanced')) key = 'Hard';
      diffBuckets[key].correct += v.correct; diffBuckets[key].total += v.total;
    });
    const difficulty = ['Easy', 'Medium', 'Hard'].map(label => {
      const v = diffBuckets[label];
      return { label, accuracy: v.total > 0 ? Math.round(v.correct / v.total * 100) : 0, count: v.total };
    }).filter(d => d.count > 0);

    // ── Streak + week dots + 365-day heatmap ─────────────────────────────────
    const sd = (typeof getStreakData === 'function') ? getStreakData() : { currentStreak: 0, longestStreak: 0, lastStudyDate: null };
    let heatTier;
    if (sd.currentStreak <= 0)       heatTier = 'cold';
    else if (sd.currentStreak < 3)   heatTier = 'starting';
    else if (sd.currentStreak < 7)   heatTier = 'warm';
    else if (sd.currentStreak < 14)  heatTier = 'hot';
    else                             heatTier = 'blazing';
    // 365-day count-per-day map (questions answered).
    const dayQ = new Map();
    h.forEach(e => {
      const d = new Date(e.date); if (isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      dayQ.set(key, (dayQ.get(key) || 0) + (e.total || 0));
    });
    const today0 = new Date(); today0.setHours(0, 0, 0, 0);
    const heatmap = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today0.getTime() - i * DAY);
      heatmap.push({ daysAgo: i, count: dayQ.get(d.toISOString().slice(0, 10)) || 0 });
    }
    const totalActiveDays = heatmap.filter(d => d.count > 0).length;
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const todayKey = today0.toISOString().slice(0, 10);
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today0.getTime() - i * DAY);
      const key = d.toISOString().slice(0, 10);
      week.push({ dayLabel: dayLabels[d.getDay()], studied: (dayQ.get(key) || 0) > 0, isToday: key === todayKey, questions: dayQ.get(key) || 0 });
    }
    const streak = {
      current: sd.currentStreak, longest: sd.longestStreak, heatTier,
      lastStudy: sd.lastStudyDate ? (sd.lastStudyDate === todayKey ? 'Today' : new Date(sd.lastStudyDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })) : 'never',
      totalActiveDays, week,
    };

    // ── Milestones (unlocked / total / recent / locked-with-progress) ────────
    const milestones = _anaBtMilestoneData();

    // ── Exam history (full simulations) ──────────────────────────────────────
    const examHistory = h.filter(e => e.mode === 'exam' && e.topic === EXAM_TOPIC).slice(0, 5).map((e, i) => {
      const scaled = Math.round(100 + (e.score / e.total) * 800);
      return {
        date: new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        label: 'Full exam', pct: e.pct, score: scaled, questions: e.total, mode: 'exam',
      };
    });

    // ── Exam vs quiz ─────────────────────────────────────────────────────────
    const quizEntries = h.filter(e => e.mode !== 'exam' && e.topic !== MIXED_TOPIC && e.topic !== EXAM_TOPIC);
    const examEntries = h.filter(e => e.mode === 'exam' && e.topic === EXAM_TOPIC);
    let examVsQuiz = null;
    if (quizEntries.length >= 2 && examEntries.length >= 1) {
      const quizAvg = Math.round(quizEntries.reduce((a, e) => a + e.pct, 0) / quizEntries.length);
      const examAvg = Math.round(examEntries.reduce((a, e) => a + e.pct, 0) / examEntries.length);
      const delta = quizAvg - examAvg;
      let insight;
      if (Math.abs(delta) <= 3) insight = 'Consistent performance across modes, a good sign that timed pressure is not costing you.';
      else if (delta > 3) insight = 'Your practice average beats your timed-exam average by ' + delta + ' points. Timed pressure is costing you a little, so book more full simulations before the real thing.';
      else insight = 'Your timed-exam average beats your practice average by ' + Math.abs(delta) + ' points. You rise to the occasion under pressure.';
      examVsQuiz = { quizAvg, examAvg, quizSessions: quizEntries.length, examSessions: examEntries.length, delta, insight };
    }

    // ── Recent sessions ──────────────────────────────────────────────────────
    const recent = h.slice(0, 5).map(e => ({
      date: new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      topic: e.topic === EXAM_TOPIC ? 'Full exam' : (e.topic === MIXED_TOPIC ? 'Mixed' : e.topic),
      pct: e.pct, n: e.total, mode: e.mode === 'exam' ? 'exam' : 'quiz',
    }));

    return {
      readiness, passTrend, domains, topics, whyScore, wrongPatterns, difficulty,
      streak, heatmap, milestones, examHistory, examVsQuiz, recent,
    };
  }

  // Why-score: highest-leverage move, derived from real readiness + domains.
  function _anaBtWhyData(r, domains, esc) {
    // Weakest studied domain by accuracy (carries weight) = the leverage target.
    const studied = domains.filter(d => d.questions > 0);
    const weakest = studied.slice().sort((a, b) => a.accuracy - b.accuracy)[0] || domains[0];
    const strongest = studied.slice().sort((a, b) => b.accuracy - a.accuracy)[0] || domains[0];
    // Leverage estimate: closing weakest domain to the 70% line, valued by weight.
    // deltaAccPts * weight * accuracyWeight(0.40) * scale(4.5) mirrors the readiness
    // what-if math; we approximate at the domain level for a headline number.
    let leveragePts = 0;
    if (weakest && weakest.accuracy < 70) {
      leveragePts = Math.max(1, Math.round((70 - weakest.accuracy) * (weakest.weight / 100) * 0.40 * 4.5));
    } else if (r && Array.isArray(r.whatIf) && r.whatIf.length) {
      leveragePts = r.whatIf.reduce((s, w) => s + (w.deltaPredicted || 0), 0);
    }
    const headline = weakest && weakest.accuracy < 70
      ? 'Drill ' + weakest.name + ' next.'
      : 'Keep your rotation fresh.';
    const body = weakest && weakest.accuracy < 70
      ? weakest.name + ' sits at ' + weakest.accuracy + '%, your weakest domain, and it carries ' + weakest.weight + '% of the exam. Lifting it toward the 70% line is the fastest single move you have right now.'
      : 'Every studied domain is holding above the developing line. Spread practice across topics and refresh the staleest ones to keep your score climbing.';
    const factors = [];
    if (weakest && weakest.questions > 0) factors.push({ label: weakest.name + ' at ' + weakest.accuracy + '%', effect: 'down', note: 'biggest drag on the score' });
    if (strongest && strongest.questions > 0 && strongest.id !== (weakest && weakest.id)) factors.push({ label: strongest.name + ' at ' + strongest.accuracy + '%', effect: 'up', note: 'carrying you, ' + strongest.weight + '% of exam' });
    if (r && typeof r.recencyScore === 'number') factors.push({ label: 'Recency at ' + Math.round(r.recencyScore) + '%', effect: r.recencyScore >= 60 ? 'up' : 'down', note: r.recencyScore >= 60 ? 'topics staying fresh' : 'some topics decaying' });
    return {
      headline, body,
      leverage: '+' + leveragePts + ' pts',
      targetDomain: weakest ? weakest.name : '',
      factors: factors.slice(0, 3),
    };
  }

  // Wrong-answer patterns: top clusters from the real wrong bank.
  function _anaBtWrongData(h) {
    const bank = (typeof loadWrongBank === 'function') ? loadWrongBank() : [];
    if (!bank || !bank.length) return [];
    const recent = bank.slice().sort((a, b) => new Date(b.addedDate || 0) - new Date(a.addedDate || 0)).slice(0, 40);
    // Cluster by domain (most actionable signal); note carries the topic spread.
    const byDomain = {};
    recent.forEach(w => {
      const d = TOPIC_DOMAINS[w.topic];
      if (!d) return;
      (byDomain[d] = byDomain[d] || { count: 0, topics: {} });
      byDomain[d].count++;
      if (w.topic) byDomain[d].topics[w.topic] = (byDomain[d].topics[w.topic] || 0) + 1;
    });
    const labels = { concepts: 'Networking Concepts', implementation: 'Network Implementation', operations: 'Network Operations', security: 'Network Security', troubleshooting: 'Network Troubleshooting' };
    return Object.entries(byDomain)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4)
      .map(([id, v]) => {
        const topTopics = Object.entries(v.topics).sort((a, b) => b[1] - a[1]).slice(0, 2).map(t => t[0]);
        return { label: labels[id] || id, count: v.count, domain: labels[id] || id, note: topTopics.length ? topTopics.join(', ') : 'mixed topics' };
      });
  }

  // Milestones: real unlocked/total + recent unlocks + next locked w/ progress.
  function _anaBtMilestoneData() {
    if (typeof MILESTONE_DEFS === 'undefined' || typeof getMilestones !== 'function') {
      return { unlocked: 0, total: 0, recent: [], locked: [] };
    }
    try { if (typeof evaluateMilestones === 'function') evaluateMilestones(); } catch (_) {}
    const unlockedMap = getMilestones();
    const total = MILESTONE_DEFS.length;
    const unlockedDefs = MILESTONE_DEFS.filter(m => unlockedMap[m.id]);
    const unlocked = unlockedDefs.length;
    const relDate = (iso) => {
      try {
        const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
        if (days <= 0) return 'Earned today';
        if (days === 1) return 'Earned yesterday';
        if (days < 7) return 'Earned ' + days + ' days ago';
        if (days < 14) return 'Earned last week';
        return 'Earned ' + new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } catch (_) { return 'Earned'; }
    };
    // Generic checkmark/star/badge icon paths so the tiles render stroke-only SVGs.
    const ICONS = ['M5 13l4 4L19 7', 'M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z', 'M12 2v20M2 12h20', 'M12 12m-9 0a9 9 0 1018 0a9 9 0 10-18 0'];
    const recent = unlockedDefs.slice()
      .sort((a, b) => new Date(unlockedMap[b.id]) - new Date(unlockedMap[a.id]))
      .slice(0, 4)
      .map((m, i) => ({ label: m.label, desc: m.desc, icon: ICONS[i % ICONS.length], earned: relDate(unlockedMap[m.id]) }));
    // Next locked milestones with numeric progress (reuse MILESTONE_PROGRESS).
    let ctx = null;
    try { if (typeof _buildMilestoneCtx === 'function') ctx = _buildMilestoneCtx(); } catch (_) {}
    const locked = [];
    if (ctx && typeof MILESTONE_PROGRESS !== 'undefined') {
      MILESTONE_DEFS.forEach(m => {
        if (unlockedMap[m.id]) return;
        const f = MILESTONE_PROGRESS[m.id];
        if (!f) return;
        try {
          const p = f(ctx);
          if (!p || !(p[1] > 0)) return;
          const cur = Math.max(0, Math.min(p[0] || 0, p[1]));
          if (cur >= p[1]) return;
          locked.push({ label: m.label, desc: m.desc, progress: [cur, p[1]], _ratio: cur / p[1] });
        } catch (_) {}
      });
      locked.sort((a, b) => b._ratio - a._ratio);
    }
    return { unlocked, total, recent, locked: locked.slice(0, 3) };
  }

  // ── Bento tile renderers (mockup markup, verbatim class names) ─────────────
  function _anaBtEsc(s) {
    return (typeof escHtml === 'function') ? escHtml(String(s)) : String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  // sparkline path over a fixed 60x18 viewbox (matches the mockup readiness sparks).
  function _anaBtSparkPath(vals, w, h) {
    if (!Array.isArray(vals) || vals.length < 2) return '';
    const min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), rng = (max - min) || 1;
    return vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - ((v - min) / rng) * h;
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
  }

  function _anaBtReadiness(D) {
    const r = D.readiness, s = r.stats, sp = r.spark;
    const esc = _anaBtEsc;
    const sparkSvg = (key) => {
      const d = _anaBtSparkPath(sp[key] || [], 60, 18);
      return d ? `<svg viewBox="0 0 60 18" preserveAspectRatio="none"><path d="${d}"/></svg>` : '';
    };
    return `<div class="tile s-read">
        <div>
          <div class="read-top">
            <div class="tile-eyebrow" style="margin:0">Readiness</div>
            <span class="read-tier">${esc(r.tier)}</span>
          </div>
          <div class="read-score"><span class="big mono" data-cnt="${r.predicted}">0</span><span class="of">/ 900</span></div>
          <p class="read-cap"><b>${r.pointsToPass} points</b> to the pass mark. Hold your pace and you cross it.</p>
          <div class="read-bar-wrap">
            <div class="read-bar">
              <i data-w="${r.barPct.toFixed(1)}" style="width:0"></i>
              <span class="read-tick" style="left:${r.passTickPct.toFixed(1)}%"></span>
            </div>
          </div>
          <div class="read-fore">
            <span>Forecast on this pace <span class="fv fg">${r.forecast}</span></span>
            <span><span class="fv">${r.daysToExam != null ? r.daysToExam : '—'}</span> days to exam</span>
          </div>
        </div>
        <div class="read-stats">
          <div class="rstat"><span class="n mono" data-cnt="${s.sessions}">0</span><span class="l">Sessions</span>${sparkSvg('sessions')}</div>
          <div class="rstat"><span class="n mono" data-cnt="${s.questions}">0</span><span class="l">Questions</span>${sparkSvg('questions')}</div>
          <div class="rstat"><span class="n mono" data-cnt="${s.accuracy}" data-suffix="%">0</span><span class="l">Accuracy</span>${sparkSvg('accuracy')}</div>
          <div class="rstat"><span class="n mono" data-cnt="${s.studyDays}">0</span><span class="l">Study days</span>${sparkSvg('studyDays')}</div>
        </div>
      </div>`;
  }

  function _anaBtConstellation(D) {
    return `<div class="tile s-const">
        <div>
          <div class="tile-eyebrow" style="margin-bottom:8px">Knowledge constellation <span class="count">${D.topics.length} topics · ${D.domains.length} domains</span></div>
          <h2>Your sky tonight</h2>
          <p class="const-sub">Each star is a topic. Bigger means more practiced, brighter means closer to mastered. Color marks the domain.</p>
        </div>
        <div class="const-mount" id="anaBtConstMount"></div>
        <div class="const-legend">
          <span><i></i>Mastered</span><span><i class="t2"></i>Proficient</span>
          <span><i class="t3"></i>Developing</span><span><i class="t4"></i>Untouched</span>
        </div>
      </div>`;
  }

  function _anaBtTrend(D) {
    const t = D.passTrend;
    const verdict = t.data.month.length ? t.data.month[t.data.month.length - 1].acc : (t.data.all.length ? t.data.all[t.data.all.length - 1].acc : t.passAcc);
    const climbing = verdict >= t.passAcc;
    return `<div class="tile s-trend">
        <div class="trend-head">
          <div class="trend-title">
            <div class="tile-eyebrow" style="margin-bottom:6px">Accuracy over time</div>
            <h2>Trending <em>toward pass</em></h2>
            <p class="trend-verdict">At <b>${verdict}%</b> now, ${climbing ? 'above' : 'below'} the ${t.passAcc}% line.</p>
          </div>
          <div class="acc-tabs" role="group" aria-label="Time range">
            <button class="acc-tab" data-range="week" aria-pressed="false">Week</button>
            <button class="acc-tab" data-range="month" aria-pressed="true">Month</button>
            <button class="acc-tab" data-range="all" aria-pressed="false">All</button>
          </div>
        </div>
        <div class="acc-wrap" id="anaBtAccWrap"></div>
      </div>`;
  }

  function _anaBtWhy(D) {
    const w = D.whyScore, esc = _anaBtEsc;
    const factors = w.factors.map(f => `
        <div class="why-f">
          <span class="ar ${f.effect}">${f.effect === 'up' ? '▲' : '▼'}</span>
          <span><span class="ft">${esc(f.label)}</span><span class="fn">${esc(f.note)}</span></span>
        </div>`).join('');
    return `<div class="tile s-why">
        <div>
          <div class="tile-eyebrow">Highest-leverage move</div>
          <div class="why-lev"><span class="v">${esc(w.leverage)}</span><span class="l">on your readiness score</span></div>
          <div class="why-head">${esc(w.headline)}</div>
          <p class="why-body">${esc(w.body)}</p>
        </div>
        <div class="why-factors">${factors}</div>
      </div>`;
  }

  function _anaBtDomains(D) {
    const esc = _anaBtEsc;
    const rows = D.domains.slice().sort((a, b) => a.accuracy - b.accuracy).map(d => {
      const weak = d.accuracy > 0 && d.accuracy < 60;
      return `<div class="dom-row">
          <div class="dl"><span class="obj mono">${d.num}</span><span class="txt">${esc(d.name)}</span></div>
          <div class="dm mono">${d.accuracy > 0 ? d.accuracy + '%' : '—'}</div>
          <div class="dom-bar"><i data-d="${d.idx}" data-w="${d.accuracy}" style="width:0"></i></div>
          <div class="dom-meta">${d.questions} questions · ${d.weight}% of exam${weak ? ' · <span class="flag">weakest, drill here</span>' : ''}</div>
        </div>`;
    }).join('');
    return `<div class="tile s-domains"><div class="tile-eyebrow">Mastery by domain <span class="count">${D.domains.length} domains · worst first</span></div><div class="dom-list">${rows}</div></div>`;
  }

  function _anaBtStreak(D) {
    const s = D.streak, esc = _anaBtEsc;
    const dots = s.week.map(d => `
        <div class="wd ${d.studied ? 'on' : ''} ${d.isToday ? 'today' : ''}">
          <span class="dot"></span><span class="wl">${d.dayLabel}</span>
        </div>`).join('');
    return `<div class="tile s-streak">
        <div class="tile-eyebrow" style="margin-bottom:8px">Study streak</div>
        <div class="streak-main"><span class="v mono" data-cnt="${s.current}">0</span><span class="l">day streak</span></div>
        <div class="streak-sub">Longest ${s.longest} · ${s.totalActiveDays} active days · last studied ${esc(String(s.lastStudy).toLowerCase())}</div>
        <div class="week-dots">${dots}</div>
      </div>`;
  }

  function _anaBtDiff(D) {
    const esc = _anaBtEsc;
    const cls = { Easy: 'e', Medium: 'm', Hard: 'h' };
    const rows = D.difficulty.map(d => `
        <div class="diff-row">
          <div class="diff-top"><span class="dk">${esc(d.label)}</span>
            <span><span class="dv">${d.accuracy}%</span> <span class="dc">${d.count}q</span></span></div>
          <div class="diff-bar"><i class="${cls[d.label] || 'm'}" data-w="${d.accuracy}" style="width:0"></i></div>
        </div>`).join('');
    return `<div class="tile s-diff"><div class="tile-eyebrow">By difficulty</div><div class="diff-list">${rows}</div></div>`;
  }

  function _anaBtEvq(D) {
    const e = D.examVsQuiz, esc = _anaBtEsc;
    if (!e) {
      return `<div class="tile s-evq">
        <div class="tile-eyebrow">Practice vs timed</div>
        <div class="evq-nums">
          <div class="evq-cell"><div class="n mono">—</div><div class="t">Quiz avg</div><div class="s">building data</div></div>
          <div class="evq-cell"><div class="n mono lo">—</div><div class="t">Exam avg</div><div class="s">no exams yet</div></div>
        </div>
        <p class="evq-note">Complete a few quizzes and at least one full exam simulation to compare timed pressure against practice.</p>
      </div>`;
    }
    return `<div class="tile s-evq">
        <div class="tile-eyebrow">Practice vs timed</div>
        <div class="evq-nums">
          <div class="evq-cell"><div class="n mono">${e.quizAvg}%</div><div class="t">Quiz avg</div><div class="s">${e.quizSessions} sessions</div></div>
          <div class="evq-cell"><div class="n mono lo">${e.examAvg}%</div><div class="t">Exam avg</div><div class="s">${e.examSessions} sessions</div></div>
        </div>
        <p class="evq-note">${esc(e.insight)}</p>
      </div>`;
  }

  function _anaBtHeat(D) {
    const days = D.heatmap.slice(-182);
    const lvl = c => c === 0 ? '' : c < 4 ? 'l1' : c < 10 ? 'l2' : c < 20 ? 'l3' : 'l4';
    const cells = days.map(d => `<span class="heat-cell ${lvl(d.count)}"></span>`).join('');
    const active = D.streak.totalActiveDays;
    return `<div class="tile s-heat">
        <div class="tile-eyebrow">Activity <span class="count">last 26 weeks · ${active} active days total</span></div>
        <div class="heat-wrap"><div class="heat-grid">${cells}</div></div>
        <div class="heat-foot">
          <span>Each cell is one day</span>
          <span class="heat-scale">Less <i class="heat-cell"></i><i class="heat-cell l1"></i><i class="heat-cell l2"></i><i class="heat-cell l3"></i><i class="heat-cell l4"></i> More</span>
        </div>
      </div>`;
  }

  function _anaBtWrong(D) {
    const esc = _anaBtEsc;
    if (!D.wrongPatterns.length) {
      return `<div class="tile s-wrong"><div class="tile-eyebrow">Where you slip most <span class="count">top patterns</span></div>
        <div class="wrong-list"><div class="wrong-row"><div class="wrong-mid"><div class="n">No clear pattern yet</div><div class="d">Your recent misses are scattered, a good sign. Keep drilling and patterns will surface if they exist.</div></div></div></div></div>`;
    }
    const rows = D.wrongPatterns.map((p, i) => `
        <div class="wrong-row">
          <div class="wrong-rank mono">${i + 1}</div>
          <div class="wrong-mid"><div class="n">${esc(p.label)}</div><div class="d">${esc(p.domain)} · ${esc(p.note)}</div></div>
          <div class="wrong-cnt"><b>${p.count}</b>missed</div>
        </div>`).join('');
    return `<div class="tile s-wrong"><div class="tile-eyebrow">Where you slip most <span class="count">top ${D.wrongPatterns.length} patterns</span></div><div class="wrong-list">${rows}</div></div>`;
  }

  function _anaBtMiles(D) {
    const m = D.milestones, esc = _anaBtEsc;
    const recent = m.recent.slice(0, 3).map(r => `
        <div class="mile-row">
          <div class="mile-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${r.icon}"/></svg></div>
          <div class="mile-txt"><div class="n">${esc(r.label)}</div><div class="d">${esc(r.earned)}</div></div>
        </div>`).join('');
    const next = m.locked[0];
    const lockRow = next ? `
        <div class="mile-row">
          <div class="mile-ic lock"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div>
          <div class="mile-txt"><div class="n">${esc(next.label)}</div><div class="lk mono">${next.progress[0]} / ${next.progress[1]} · ${esc(next.desc)}</div></div>
        </div>` : '';
    const pct = m.total > 0 ? (m.unlocked / m.total * 100).toFixed(0) : '0';
    return `<div class="tile s-miles">
        <div class="tile-eyebrow">Milestones <span class="mile-count">${m.unlocked} / ${m.total}</span></div>
        <div class="mile-prog"><i data-w="${pct}" style="width:0"></i></div>
        <div class="mile-list">${recent}${lockRow}</div>
      </div>`;
  }

  // ── v7.61.0: Analytics "Drills" milestone group (faithful lift of
  // mockups/milestone-drills-concept.html) — rendered as its own editorial
  // section appended below the bento grid in renderAnalytics(). De-carded
  // hairline rows, 3 slots/drill, earned/locked/in-progress states, n/25 bar.
  // Entrance (.dg-drill.reveal → .visible) + bar-fill are wired in _anaBtWire()
  // because the page-setup reveal IIFE is scoped to #page-setup only and never
  // touches #page-analytics. Returns '' when milestone plumbing is unavailable.
  function _anaDrillsGroupHtml() {
    if (typeof MILESTONE_DEFS === 'undefined' || typeof getMilestones !== 'function') return '';
    try { if (typeof evaluateMilestones === 'function') evaluateMilestones(); } catch (_) {}
    const esc = _anaBtEsc;
    const unlockedMap = getMilestones() || {};
    let ctx = null;
    try { if (typeof _buildMilestoneCtx === 'function') ctx = _buildMilestoneCtx(); } catch (_) {}
    // relDate: reuse the shared helper from _anaBtMilestoneData's data shape — same
    // wording ("Earned today" / "N days ago"). Inlined compactly here.
    const relDate = (iso) => {
      try {
        const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
        if (d <= 0) return 'Earned today';
        if (d === 1) return 'Earned yesterday';
        if (d < 7) return 'Earned ' + d + ' days ago';
        if (d < 14) return 'Earned last week';
        return 'Earned ' + new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } catch (_) { return 'Earned'; }
    };
    const progOf = (id) => {
      try {
        if (!ctx || typeof MILESTONE_PROGRESS === 'undefined') return null;
        const f = MILESTONE_PROGRESS[id]; if (!f) return null;
        const r = f(ctx); if (!r || !(r[1] > 0)) return null;
        const cur = Math.max(0, Math.min(r[0] || 0, r[1]));
        return cur >= r[1] ? null : [cur, r[1]];
      } catch (_) { return null; }
    };
    const DRILL_GROUPS = [
      { name: 'Sim Lab',      meta: 'PBQ console',      ids: ['simlab_first', 'simlab_25', 'simlab_ace'] },
      { name: 'Decision Lab', meta: 'cloud scenarios',  ids: ['decision_first', 'decision_25', 'decision_flawless'] },
      { name: 'Why-Not',      meta: 'distractor drill', ids: ['whynot_first', 'whynot_25', 'whynot_master'] },
      { name: 'Gauntlet',     meta: 'timed endurance',  ids: ['gauntlet_first', 'gauntlet_25', 'gauntlet_survivor'] },
    ];
    const allDefs = DRILL_GROUPS.flatMap(g => g.ids).map(id => MILESTONE_DEFS.find(m => m.id === id)).filter(Boolean);
    if (!allDefs.length) return '';
    const earnedCount = allDefs.filter(m => unlockedMap[m.id]).length;

    // A milestone slot: earned (dot+✓+gleam-if-today) / in-progress (n/25 bar) / locked.
    const tile = (m) => {
      if (unlockedMap[m.id]) {
        const rel = relDate(unlockedMap[m.id]); const fresh = rel === 'Earned today';
        return `<div class="ms ms-earned${fresh ? ' ms-fresh' : ''}">${fresh ? '<div class="ms-gleam"></div>' : ''}` +
          `<div class="ms-top"><span class="ms-dot"></span><span class="ms-label">${esc(m.label)}</span><span class="ms-check">✓</span></div>` +
          `<div class="ms-desc">${esc(m.desc)}</div><div class="ms-meta">${esc(rel)}</div></div>`;
      }
      const p = progOf(m.id);
      if (p) {
        const [cur, tar] = p; const pctFill = Math.round((cur / tar) * 100);
        const frac = tar === 1 ? 'In reach' : `${cur} <span class="of">/ ${tar}</span>`;
        return `<div class="ms ms-prog"><div class="ms-top"><span class="ms-dot"></span><span class="ms-label">${esc(m.label)}</span></div>` +
          `<div class="ms-desc">${esc(m.desc)}</div>` +
          `<div class="ms-prog-row"><div class="ms-track"><div class="ms-fill" data-fill="${pctFill}"></div></div>` +
          `<span class="ms-frac">${frac}</span></div></div>`;
      }
      return `<div class="ms ms-locked"><div class="ms-top"><span class="ms-dot"></span><span class="ms-label">${esc(m.label)}</span></div>` +
        `<div class="ms-desc">${esc(m.desc)}</div></div>`;
    };

    const rows = DRILL_GROUPS.map((g, i) => {
      const slots = g.ids.map(id => { const def = MILESTONE_DEFS.find(m => m.id === id); return def ? tile(def) : ''; }).join('');
      return `<div class="dg-drill reveal" style="--d:${i + 1}">` +
        `<div class="dg-drill-name">${esc(g.name)} <span class="meta">${esc(g.meta)}</span></div>` +
        `<div class="dg-slots">${slots}</div></div>`;
    }).join('');

    return `<div class="ana-drills-group" id="ana-ms-drills-section">
      <div class="dg-head">
        <div><p class="dg-eyebrow">Drills</p><h2 class="dg-title">Hands-on milestones</h2></div>
        <div class="dg-count"><span class="n">${earnedCount}</span><span class="of">of ${allDefs.length} earned</span></div>
      </div>
      <hr class="dg-rule">
      ${rows}
      <div class="dg-legend">
        <span class="legend-item"><span class="ms-dot" style="background:var(--accent)"></span> Earned</span>
        <span class="legend-item"><span class="ms-dot" style="background:color-mix(in oklab,var(--accent) 55%,transparent)"></span> In progress</span>
        <span class="legend-item"><span class="ms-dot" style="background:transparent;border:1px solid var(--border)"></span> Locked</span>
      </div>
    </div>`;
  }

  function _anaBtExam(D) {
    const esc = _anaBtEsc;
    const PASS = (typeof EXAM_PASS_SCORE === 'number') ? EXAM_PASS_SCORE : 720;
    if (!D.examHistory.length) {
      return `<div class="tile s-exam"><div class="tile-eyebrow">Full exams <span class="count">none yet</span></div>
        <div class="exam-list"><div class="exam-row"><div><div class="el">No exam simulations yet</div><div class="ed mono">run one to track scaled scores</div></div></div></div></div>`;
    }
    const rows = D.examHistory.map((e, i) => {
      const pass = e.score >= PASS;
      return `<div class="exam-row">
          <div><div class="el">${esc(e.label)} #${D.examHistory.length - i}</div><div class="ed mono">${esc(e.date)} · ${e.questions}q</div></div>
          <div class="es ${pass ? 'pass' : ''} mono">${e.score}</div>
          <div class="exam-bar"><i class="${pass ? 'pass' : ''}" data-w="${(e.pct).toFixed(0)}" style="width:0"></i></div>
        </div>`;
    }).join('');
    return `<div class="tile s-exam"><div class="tile-eyebrow">Full exams <span class="count">last ${D.examHistory.length}</span></div><div class="exam-list">${rows}</div></div>`;
  }

  // ── Bento interaction wiring (count-ups, constellation, trend) ─────────────
  function _anaBtReduce() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // count-up that writes textContent only (allowed under the inline-style ratchet).
  function _anaBtCountUp(el, target, suffix) {
    suffix = suffix || '';
    if (_anaBtReduce()) { el.textContent = target + suffix; return; }
    const dur = 820, t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    })(performance.now());
  }

  // Constellation starfield: golden-angle spiral, twinkle, pulsar, hover tooltip.
  function _anaBtRenderConstellation(mount, D) {
    if (!mount) return;
    const SVGNS = 'http://www.w3.org/2000/svg';
    const esc = _anaBtEsc;
    const reduce = _anaBtReduce();
    const svgEl = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
    const W = 1000, H = 440;
    const DOMAINS = [
      { idx: 1, cx: W * 0.16, cy: H * 0.40, kicker: 'DOMAIN 1', name: (D.domains[0] && D.domains[0].name) || 'Networking Concepts' },
      { idx: 2, cx: W * 0.40, cy: H * 0.72, kicker: 'DOMAIN 2', name: (D.domains[1] && D.domains[1].name) || 'Network Implementation' },
      { idx: 3, cx: W * 0.56, cy: H * 0.26, kicker: 'DOMAIN 3', name: (D.domains[2] && D.domains[2].name) || 'Network Operations' },
      { idx: 4, cx: W * 0.78, cy: H * 0.66, kicker: 'DOMAIN 4', name: (D.domains[3] && D.domains[3].name) || 'Network Security' },
      { idx: 5, cx: W * 0.92, cy: H * 0.32, kicker: 'DOMAIN 5', name: (D.domains[4] && D.domains[4].name) || 'Network Troubleshooting' },
    ];
    const clusters = {}; DOMAINS.forEach(c => clusters[c.idx] = c);
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Knowledge constellation: topics clustered by exam domain' });

    const grid = svgEl('g', { class: 'const-grid' });
    for (let x = 0; x <= W; x += 100) grid.appendChild(svgEl('line', { x1: x, y1: 0, x2: x, y2: H }));
    for (let y = 0; y <= H; y += 80) grid.appendChild(svgEl('line', { x1: 0, y1: y, x2: W, y2: y }));
    svg.appendChild(grid);

    const tetherLayer = svgEl('g', {}), nodeLayer = svgEl('g', {}), labelLayer = svgEl('g', {});
    svg.appendChild(tetherLayer); svg.appendChild(nodeLayer); svg.appendChild(labelLayer);

    DOMAINS.forEach(c => {
      const g = svgEl('g', { class: 'const-cluster-label' });
      const k = svgEl('text', { x: c.cx, y: c.cy - 104, 'text-anchor': 'middle', class: 'kicker' }); k.textContent = c.kicker;
      const n = svgEl('text', { x: c.cx, y: c.cy - 90, 'text-anchor': 'middle', class: 'name' }); n.textContent = c.name;
      g.appendChild(k); g.appendChild(n); labelLayer.appendChild(g);
    });

    const byDomain = {};
    D.topics.forEach(t => { (byDomain[t.domainIdx] = byDomain[t.domainIdx] || []).push(t); });

    const tierOpacity = { novice: .34, developing: .58, proficient: .82, mastered: 1, unstudied: .18 };
    const nodes = [];
    let igCount = 0;
    Object.entries(byDomain).forEach(([dom, topics]) => {
      const c = clusters[dom];
      if (!c) return;
      topics.forEach((t, i) => {
        const angle = (i * 2.399) + (c.idx * 0.7);            // golden-angle spiral
        const baseDist = 42 + (i % 4) * 20;
        const cx = c.cx + Math.cos(angle) * baseDist;
        const cy = c.cy + Math.sin(angle) * baseDist;
        const r = t.attempts > 0 ? Math.min(22, 6 + Math.sqrt(t.attempts) * 2.2) : 5;
        const innerR = Math.max(2, r * ((t.mastery || 0) / 100) + 2);
        const g = svgEl('g', { class: 'const-node', 'data-domain': c.idx, 'data-tier': t.tier, tabindex: 0,
          'aria-label': `${t.topic}, ${t.domainId}: ${t.mastery}% mastery, ${t.attempts} attempt${t.attempts === 1 ? '' : 's'}` });
        const halo = svgEl('circle', { cx, cy, r, class: 'const-halo' });
        const core = svgEl('circle', { cx, cy, r: innerR, class: 'const-core' });
        const base = tierOpacity[t.tier] || .3;
        if (!reduce && t.tier !== 'unstudied') {
          core.classList.add('twinkle');
          core.style.setProperty('--base', base);
          core.style.setProperty('--tw', (3.4 + (i % 5) * 0.5) + 's');
          core.style.setProperty('--td', ((i * 0.37) % 3).toFixed(2) + 's');
        }
        g.appendChild(halo); g.appendChild(core);
        g.style.setProperty('--ig', (igCount++ * 11) + 'ms');
        tetherLayer.appendChild(svgEl('line', { x1: c.cx, y1: c.cy, x2: cx, y2: cy, class: 'const-tether' }));
        nodeLayer.appendChild(g);
        nodes.push({ gEl: g, haloEl: halo, coreEl: core, cx, cy, r, mastery: t.mastery, attempts: t.attempts, topic: t.topic });
      });
    });

    // pulsar: brightest mastered star
    if (!reduce) {
      let best = null;
      nodes.forEach(n => { if (n.mastery >= 80 && (!best || n.mastery > best.mastery)) best = n; });
      if (best) { best.gEl.classList.add('const-pulsar'); best.haloEl.style.setProperty('--r0', best.r + 'px'); }
    }

    mount.appendChild(svg);

    // tooltip (a handful of .style writes — within the ratchet's tooltip allowance)
    const tt = document.createElement('div'); tt.className = 'const-tt'; mount.appendChild(tt);
    function showTip(n) {
      tt.innerHTML = `<b>${esc(n.topic)}</b><span class="tt-meta">${n.mastery}% mastery · ${n.attempts} attempt${n.attempts === 1 ? '' : 's'}</span>`;
      const rect = mount.getBoundingClientRect();
      const sx = (n.cx / W) * rect.width, sy = (n.cy / H) * rect.height;
      tt.style.setProperty('left', Math.min(rect.width - 160, Math.max(6, sx + 12)) + 'px');
      tt.style.setProperty('top', Math.max(4, sy - 48) + 'px');
      tt.classList.add('show');
    }
    function hideTip() { tt.classList.remove('show'); }
    nodes.forEach(n => {
      n.gEl.addEventListener('pointerenter', () => showTip(n));
      n.gEl.addEventListener('pointerleave', hideTip);
      n.gEl.addEventListener('focus', () => showTip(n));
      n.gEl.addEventListener('blur', hideTip);
    });
  }

  // Pass-trend chart: pass line, area+line draw-in, dots, week/month/all tabs.
  function _anaBtRenderTrend(wrap, D) {
    if (!wrap) return;
    const SVGNS = 'http://www.w3.org/2000/svg';
    const reduce = _anaBtReduce();
    const svgEl = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
    const W = 960, H = 240, PAD = 46;
    const innerW = W - 2 * PAD, innerH = H - 2 * PAD;
    const yMin = D.passTrend.yMin, yMax = D.passTrend.yMax, passAcc = D.passTrend.passAcc;
    const yOf = acc => PAD + (1 - (acc - yMin) / (yMax - yMin)) * innerH;
    const xOf = (i, n) => PAD + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
    const passY = yOf(passAcc);

    const svg = svgEl('svg', { class: 'acc-svg', viewBox: `0 0 ${W} ${H}` });

    const grid = svgEl('g', { class: 'acc-grid' });
    [60, 70, 80, 90].forEach(pct => {
      if (pct < yMin || pct > yMax) return;
      const y = yOf(pct);
      grid.appendChild(svgEl('line', { x1: PAD, y1: y, x2: W - PAD, y2: y }));
      const t = svgEl('text', { x: PAD - 10, y: y + 3, 'text-anchor': 'end' }); t.textContent = pct + '%';
      grid.appendChild(t);
    });
    svg.appendChild(grid);

    const passG = svgEl('g', {});
    passG.appendChild(svgEl('line', { class: 'acc-pass-line', x1: PAD, y1: passY, x2: W - PAD, y2: passY }));
    const pt = svgEl('text', { class: 'acc-pass-label', x: W - PAD + 6, y: passY + 4 }); pt.textContent = 'PASS';
    passG.appendChild(pt);
    svg.appendChild(passG);

    const dataLayer = svgEl('g', {}); svg.appendChild(dataLayer);
    const labelLayer = svgEl('g', {}); svg.appendChild(labelLayer);
    wrap.appendChild(svg);

    function ptsFor(key) {
      const arr = D.passTrend.data[key] || [];
      return arr.map((d, i) => ({ x: xOf(i, arr.length), y: yOf(d.acc), acc: d.acc, label: d.label }));
    }
    function buildLine(pts) { return pts.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' '); }
    function buildArea(pts) {
      if (!pts.length) return '';
      const base = (H - PAD).toFixed(1);
      return 'M' + pts[0].x.toFixed(1) + ' ' + base + ' ' + pts.map(p => 'L' + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ') +
        ' L' + pts[pts.length - 1].x.toFixed(1) + ' ' + base + ' Z';
    }
    function draw(key, animate) {
      dataLayer.innerHTML = ''; labelLayer.innerHTML = '';
      const pts = ptsFor(key);
      const area = svgEl('path', { class: 'acc-area', d: buildArea(pts) });
      const line = svgEl('path', { class: 'acc-line', d: buildLine(pts) });
      dataLayer.appendChild(area); dataLayer.appendChild(line);
      const dots = pts.map(p => {
        const c = svgEl('circle', { class: 'acc-dot', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 4 });
        dataLayer.appendChild(c); return c;
      });
      pts.forEach(p => { if (p.label) { const t = svgEl('text', { class: 'acc-xlabel', x: p.x.toFixed(1), y: H - PAD + 18, 'text-anchor': 'middle' }); t.textContent = p.label; labelLayer.appendChild(t); } });

      if (animate && !reduce && line.getTotalLength) {
        const len = line.getTotalLength();
        line.style.setProperty('--len', len);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          line.classList.add('drawn'); area.classList.add('drawn');
          dots.forEach((d, i) => { d.style.setProperty('transition-delay', (0.62 + i * 0.045) + 's'); d.classList.add('drawn'); });
        }));
      } else {
        // static final state (reduced motion): area + dots visible via .drawn class
        area.classList.add('drawn');
        dots.forEach(d => d.classList.add('drawn'));
      }
    }
    wrap._drawTrend = (animate) => draw('month', animate);
    if (reduce) draw('month', false);

    const tile = wrap.closest('.tile');
    const tabs = tile ? tile.querySelectorAll('.acc-tab') : [];
    tabs.forEach(b => b.addEventListener('click', () => {
      tabs.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      draw(b.dataset.range, true);
    }));
  }

  // After innerHTML: run all bento wiring. Motion gated by reduced-motion; under
  // reduced motion every tile resolves to its final values (nothing stays hidden).
  function _anaBtWire(D) {
    const reduce = _anaBtReduce();
    const bento = document.querySelector('.ana-bento');
    if (!bento) return;
    const tiles = Array.prototype.slice.call(bento.querySelectorAll('.tile'));
    tiles.forEach((t, i) => t.style.setProperty('--index', i));

    // Render the two interactive keepers into their mounts.
    _anaBtRenderConstellation(document.getElementById('anaBtConstMount'), D);
    _anaBtRenderTrend(document.getElementById('anaBtAccWrap'), D);

    function runFills(t) {
      t.querySelectorAll('[data-cnt]').forEach(n => _anaBtCountUp(n, +n.dataset.cnt, n.dataset.suffix || ''));
      t.querySelectorAll('[data-w]').forEach(i => { i.style.setProperty('width', i.dataset.w + '%'); });
      if (t.classList.contains('s-const')) t.classList.add('lit');
      if (t.classList.contains('s-trend')) {
        const w = t.querySelector('#anaBtAccWrap');
        if (w && w._drawTrend) w._drawTrend(!reduce);
      }
    }

    if (reduce || !('IntersectionObserver' in window)) {
      tiles.forEach(t => { t.classList.add('in', 'lit'); runFills(t); });
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          const idx = +(en.target.style.getPropertyValue('--index') || 0);
          const lead = 120 + Math.min(idx, 6) * 52;
          setTimeout(() => runFills(en.target), lead);
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    tiles.forEach(t => io.observe(t));

    // v7.61.0: Drills milestone group entrance + bar-fill. The #page-setup reveal
    // IIFE (index.html) is scoped to #page-setup and never reaches #page-analytics,
    // so the .dg-drill.reveal rows would otherwise stay at opacity:0 forever. Wire
    // the staggered .visible reveal + n/25 ms-fill widths here, matching the mockup.
    const drillRows = Array.prototype.slice.call(document.querySelectorAll('#ana-ms-drills-section .dg-drill.reveal'));
    if (drillRows.length) {
      const fillBars = (row) => {
        row.querySelectorAll('.ms-fill').forEach(f => {
          const w = f.getAttribute('data-fill');
          // Use setProperty to match the existing analytics fill pattern + stay
          // under the inline-style-assignment tech-debt gate.
          if (w != null && !f.style.width) f.style.setProperty('width', w + '%');
        });
      };
      if (reduce || !('IntersectionObserver' in window)) {
        // Visible immediately, bars at final width, no transform/animation.
        drillRows.forEach(r => { r.classList.add('visible'); fillBars(r); });
      } else {
        const dio = new IntersectionObserver((entries, obs) => {
          entries.forEach(en => {
            if (!en.isIntersecting) return;
            en.target.classList.add('visible');
            const d = +(en.target.style.getPropertyValue('--d') || 0);
            const lead = 360 + d * 70; // mirrors the mockup's bar-fill choreography
            setTimeout(() => fillBars(en.target), lead);
            obs.unobserve(en.target);
          });
        }, { threshold: 0.2 });
        drillRows.forEach(r => dio.observe(r));
        // Safety net: if IO never fires (e.g. tab hidden / display toggle race),
        // un-hide + fill after 1.6s so the group can never get stuck invisible.
        setTimeout(() => {
          drillRows.forEach(r => { r.classList.add('visible'); fillBars(r); });
        }, 1600);
      }
    }
  }

  // ── Analytics orchestrator ──

  function renderAnalytics() {
    const h = loadHistory();
    const container = document.getElementById('analytics-content');
    if (!container) return;
    // v4.54.10: Recent Performance card retired per user request \u2014 it was clogging
    // the page and duplicated info surfaced more usefully by the Accuracy Trend +
    // Accuracy-over-time chart + per-session Results page review list. Hide the
    // DOM element so CSS transitions + history-panel state don't affect Analytics.
    const histPanel = document.getElementById('history-panel');
    if (histPanel) histPanel.classList.add('is-hidden');
    if (h.length < 1) {
      // v4.77.0: motivational empty state per Codex round-2 review.
      // v4.79.0: hide the static page header so the action card BECOMES
      // the dominant H1 (per Codex round-3 — actionable text should be
      // the first thing the user sees, not the category label
      // "Performance analytics.").
      const pageHead = document.querySelector('#page-analytics > .ed-pagehead');
      if (pageHead) pageHead.classList.add('is-hidden');
      // v7.50.x: 📊 decorative emoji replaced with the monoline chart glyph from
      // the existing vocabulary (_sbNavIcon('progress') — axis + rising trend line,
      // stroke on currentColor). BRAND §7A · §9 (no emoji-as-icons).
      container.innerHTML = '<div class="ana-empty-card">'
        + '<div class="ana-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 14l4-4 4 4 5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
        + '<h1 class="ana-empty-title">Unlock your first insight</h1>'
        + '<p class="ana-empty-body">Complete one 5-minute warmup and we\'ll show your '
        + '<strong>weakest topic</strong>, <strong>readiness trend</strong>, and '
        + '<strong>next study move</strong>.</p>'
        + '<button type="button" class="btn btn-primary ana-empty-cta" '
        + 'onclick="applyPreset(\'warmup\')">Start 5-min Warmup</button>'
        + '<p class="ana-empty-foot">5 questions · ~3 min · foundational</p>'
        + '</div>';
      // Hide actionable headline in empty state
      if (typeof renderAnalyticsActionHeadline === 'function') renderAnalyticsActionHeadline();
      return;
    }
    // v4.79.0: data path — restore page header (was hidden if user previously hit empty state)
    const pageHead = document.querySelector('#page-analytics > .ed-pagehead');
    if (pageHead) pageHead.classList.remove('is-hidden');
    // v7.16.0: the action-headline band is removed from Analytics. Its
    // highest-leverage drill now lives in the bento "highest-leverage move" tile,
    // and its gradient clashed with the forged-bronze system. Keep it hidden + empty.
    (function () { var _ah = document.getElementById('ana-action-headline'); if (_ah) { _ah.hidden = true; _ah.innerHTML = ''; } })();
    // v7.16.0 — Bento board: faithful lift of mockups/analytics/mockup-3-bento.html
    // powered by real data. _anaBentoData(h) yields the ANALYTICS_SAMPLE shape; the
    // _anaBt* renderers reproduce the mockup markup. Tile order matches the mockup
    // grid children exactly (readiness, constellation, trend, why, domains, streak,
    // diff, evq, heat, wrong, miles, exam). The two keepers (constellation
    // starfield, pass-trend chart) and all motion are wired in _anaBtWire() below.
    const D = _anaBentoData(h);
    let html = '<div class="ana-bento">'
      + _anaBtReadiness(D)
      + _anaBtConstellation(D)
      + _anaBtTrend(D)
      + _anaBtWhy(D)
      + _anaBtDomains(D)
      + _anaBtStreak(D)
      + _anaBtDiff(D)
      + _anaBtEvq(D)
      + _anaBtHeat(D)
      + _anaBtWrong(D)
      + _anaBtMiles(D)
      + _anaBtExam(D)
      + '</div>'
      // v7.61.0: Drills milestone group — its own editorial section below the
      // bento grid (faithful lift of mockups/milestone-drills-concept.html).
      + _anaDrillsGroupHtml();
    container.innerHTML = html;
    // Wire the keepers + entrance choreography (count-ups, bar/ring fills,
    // constellation twinkle/pulsar/tooltip, trend tabs + draw-in). Reduced-motion
    // is handled inside: every tile resolves to its final values, nothing hidden.
    _anaBtWire(D);
  }

  // ── window re-exposure (HTML onclick + cross-file callers) ──
  window.renderAnalytics = renderAnalytics;
  window.renderAnalyticsActionHeadline = renderAnalyticsActionHeadline;
  window._anaAccChartTab = _anaAccChartTab;
  window._startReadinessRefreshQuiz = _startReadinessRefreshQuiz;
  window._startReadinessWeakestQuiz = _startReadinessWeakestQuiz;

  // ── feature registry ──
  window._certanvilFeatures = window._certanvilFeatures || {};
  window._certanvilFeatures['analytics'] = { enter: renderAnalytics };
})();
