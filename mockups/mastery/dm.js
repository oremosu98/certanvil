/* ============================================================
   "Domain Mastery" — shared base renderer
   Mirrors production markup (.dm-row > .dm-bar-track > .dm-bar-fill
   + .dm-bar-target at 80%, tier badge, pct, attempts, drill button).
   Data matches the real screenshot. Every mockup gets the identical
   list so you're judging MOTION, not data.

   Exposes window.DomainMastery after render(mountSel):
     .card, .list, .threshold (80)
     .rows [{ el, domain{id,label,weight,color}, pct, tier{label,cls},
              correct, attempts, fillEl, pctEl, badgeEl, trackEl,
              targetEl, btnEl, stage(0|1) }]
     .tierFor(pct), .el helpers
   ============================================================ */
(function () {
  const THRESHOLD = 80;
  const DOMAINS = [
    { id: 'concepts',        label: '1.0 Networking Concepts',     weight: 23, color: '#7c6ff7', c: 2, t: 2 },
    { id: 'implementation',  label: '2.0 Network Implementation',  weight: 20, color: '#46a86a', c: 0, t: 1 },
    { id: 'operations',      label: '3.0 Network Operations',      weight: 19, color: '#4f7fd6', c: 1, t: 1 },
    { id: 'security',        label: '4.0 Network Security',        weight: 14, color: '#d68a28', c: 3, t: 4 },
    { id: 'troubleshooting', label: '5.0 Network Troubleshooting', weight: 24, color: '#d84632', c: 1, t: 2 },
  ];

  function tierFor(pct) {
    if (pct >= 80) return { label: 'Mastered', cls: 'dm-badge-mastered' };
    if (pct >= 70) return { label: 'Proficient', cls: 'dm-badge-proficient' };
    if (pct >= 55) return { label: 'Developing', cls: 'dm-badge-developing' };
    return { label: 'Novice', cls: 'dm-badge-novice' };
  }

  function render(mountSel) {
    const mount = document.querySelector(mountSel);
    const card = document.createElement('div');
    card.className = 'dm-card';
    card.id = 'dm-card';
    card.innerHTML =
      '<h3>Domain Mastery</h3>' +
      '<div class="dm-subtitle">How close each N10-009 domain is to the 80% mastery threshold</div>' +
      '<div class="dm-list"></div>' +
      '<div class="dm-footer">Weights from official CompTIA N10-009 exam blueprint.</div>';
    const list = card.querySelector('.dm-list');

    const rows = DOMAINS.map(d => {
      const pct = Math.round((d.c / d.t) * 100);
      const tier = tierFor(pct);
      const row = document.createElement('div');
      row.className = 'dm-row';
      row.setAttribute('style', '--dm-accent:' + d.color);
      row.setAttribute('data-id', d.id);
      row.innerHTML =
        '<div class="dm-row-label"><span class="dm-dot"></span>' +
          '<span class="dm-row-text"><span class="dm-row-name">' + d.label + '</span>' +
          '<span class="dm-row-weight">' + d.weight + '% of exam</span></span></div>' +
        '<div class="dm-row-badge ' + tier.cls + '">' + tier.label + '</div>' +
        '<div class="dm-bar-wrap"><div class="dm-bar-track">' +
          '<div class="dm-bar-fill" style="width:' + Math.min(pct, 100) + '%"></div>' +
          '<div class="dm-bar-target" style="left:80%" title="80% mastery threshold"></div>' +
        '</div><div class="dm-bar-pct">' + pct + '%</div></div>' +
        '<div class="dm-row-foot"><span class="dm-row-stats">' + d.c + ' correct of ' + d.t +
          ' attempt' + (d.t === 1 ? '' : 's') + '</span>' +
          '<button class="dm-drill-btn">' + (pct >= 80 ? 'Review →' : 'Drill weakest →') + '</button></div>';
      list.appendChild(row);
      return {
        el: row, domain: d, pct, tier, correct: d.c, attempts: d.t,
        fillEl: row.querySelector('.dm-bar-fill'),
        pctEl: row.querySelector('.dm-bar-pct'),
        badgeEl: row.querySelector('.dm-row-badge'),
        trackEl: row.querySelector('.dm-bar-track'),
        targetEl: row.querySelector('.dm-bar-target'),
        btnEl: row.querySelector('.dm-drill-btn'),
        stage: 0,
      };
    });

    mount.appendChild(card);

    window.DomainMastery = {
      card, list, threshold: THRESHOLD, rows, tierFor,
      el: (t, a) => { const e = document.createElement(t); if (a) for (const k in a) e.setAttribute(k, a[k]); return e; },
    };
    return window.DomainMastery;
  }

  window.DomainMastery = { render };
})();
