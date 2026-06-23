/* ============================================================
   "Milestones" — shared base renderer
   Mirrors production: head + progress, "Recently unlocked" group,
   "Show all N" toggle, ruled grid of all milestones (text-only,
   unlocked vs locked). Data matches the screenshot (a handful
   unlocked incl. the 4 recent). Every mockup gets the identical
   section so you're judging MOTION.

   Exposes window.Milestones after render(mountSel):
     .card, .grid, .recentEl, .toggleBtn, .barFill, .countEl, .pctEl
     .total, .unlockedCount
     .tiles    [{ el, def, unlocked, recent, progress|null }]  (full grid)
     .recent   [{ el, def }]  (recently-unlocked group)
     .el(tag,attrs)
   ============================================================ */
(function () {
  // id, label, desc — emoji omitted (the live editorial reskin hides icons).
  // `u` = unlocked, `r` = recently-unlocked (date order), `p` = [cur,target] progress for locked.
  const DEFS = [
    { id: 'first_quiz', label: 'First steps', desc: 'Complete your first quiz', u: true },
    { id: 'hundred_qs', label: 'Century', desc: 'Answer 100 questions', p: [73, 100] },
    { id: 'five_hundred_qs', label: 'Grinder', desc: 'Answer 500 questions', p: [73, 500] },
    { id: 'thousand_qs', label: 'Iron will', desc: 'Answer 1,000 questions' },
    { id: 'first_exam', label: 'Exam rehearsal', desc: 'Complete your first exam simulation' },
    { id: 'exam_pass', label: 'Passing grade', desc: 'Score 720+ on any exam simulation' },
    { id: 'all_domains', label: 'Full coverage', desc: 'Study at least one topic in all 5 domains', u: true, r: 2 },
    { id: 'all_topics', label: 'Completionist', desc: 'Attempt every topic at least once', u: true, r: 1 },
    { id: 'streak_7', label: 'Week warrior', desc: '7-day study streak', p: [4, 7] },
    { id: 'streak_30', label: 'Month master', desc: '30-day study streak', p: [4, 30] },
    { id: 'ready_650', label: 'Getting close', desc: 'Reach a readiness score of 650', p: [612, 650] },
    { id: 'ready_720', label: 'Exam ready', desc: 'Reach a readiness score of 720 (pass)' },
    { id: 'perfect_port', label: 'Port master', desc: 'Perfect round on Port Drill (40 correct)' },
    { id: 'streak_port_25', label: 'Streak keeper', desc: 'Reach a 25+ streak in Port Drill Endless mode' },
    { id: 'perfect_quiz', label: 'Flawless', desc: 'Score 100% on a 10+ question quiz', u: true },
    { id: 'five_exams', label: 'Exam veteran', desc: 'Complete 5 exam simulations' },
    { id: 'ten_exams', label: 'Exam marathon', desc: 'Complete 10 exam simulations' },
    { id: 'first_subnet', label: 'Subnet initiate', desc: 'Complete your first subnet drill' },
    { id: 'subnet_50', label: 'Subnet surgeon', desc: 'Answer 50 subnet drill questions' },
    { id: 'first_port_drill', label: 'Port pioneer', desc: 'Complete your first Port Drill run' },
    { id: 'all_ports_seen', label: 'Port cartographer', desc: 'See every port in the Port Drill bank' },
    { id: 'first_session', label: 'Plan starter', desc: 'Complete your first Study Plan' },
    { id: 'night_owl', label: 'Night owl', desc: 'Study between midnight and 5am' },
    { id: 'early_bird', label: 'Early bird', desc: 'Study before 7am' },
    { id: 'weekend_warrior', label: 'Weekend warrior', desc: 'Study on both Saturday and Sunday of the same week', u: true, r: 3 },
    { id: 'diversity_5', label: 'Renaissance', desc: 'Study 5 different topics in a single day', u: true, r: 4 },
    { id: 'deep_dive_10', label: 'Curious mind', desc: 'Use Explain Further 10 times', p: [6, 10] },
    { id: 'daily_challenge_7', label: 'Daily disciple', desc: '7-day Daily Challenge streak' },
    { id: 'daily_challenge_30', label: 'Daily devotee', desc: '30-day Daily Challenge streak' },
    { id: 'hardcore_pass', label: 'Hardcore pass', desc: 'Score 720+ on a Hardcore exam simulation' },
    { id: 'first_lab', label: 'Lab rat', desc: 'Complete your first topology lab', u: true },
    { id: 'labs_5', label: 'Lab regular', desc: 'Complete 5 different labs', p: [2, 5] },
    { id: 'labs_10', label: 'Lab master', desc: 'Complete 10 different labs' },
    { id: 'labs_all', label: 'Lab completionist', desc: 'Complete every available lab' },
    { id: 'fix_first', label: 'First responder', desc: 'Complete your first Fix This Network challenge' },
    { id: 'fix_5', label: 'Network medic', desc: 'Complete 5 Fix This Network challenges' },
    { id: 'fix_all_easy', label: 'Easy sweep', desc: 'Complete every Easy Fix challenge' },
    { id: 'ab_first', label: 'Acronym rookie', desc: 'Answer your first Acronym Blitz question', u: true },
    { id: 'ab_50', label: 'Acronym adept', desc: 'Answer 50 Acronym Blitz questions' },
    { id: 'ab_all_seen', label: 'Acronym encyclopedia', desc: 'See every acronym at least once' },
    { id: 'ab_streak_15', label: 'Acronym streak', desc: 'Reach a 15 streak in Acronym Blitz' },
    { id: 'os_first', label: 'OSI initiate', desc: 'Answer your first OSI Sorter question' },
    { id: 'os_50', label: 'OSI scholar', desc: 'Answer 50 OSI Sorter questions' },
    { id: 'os_all_seen', label: 'OSI master', desc: 'See every OSI item at least once' },
    { id: 'os_streak_10', label: 'OSI streak', desc: 'Reach a 10 streak in OSI Sorter' },
    { id: 'cb_first', label: 'Cable spotter', desc: 'Answer your first Cable ID question' },
    { id: 'cb_50', label: 'Cable expert', desc: 'Answer 50 Cable ID questions' },
    { id: 'cb_all_seen', label: 'Cable encyclopedia', desc: 'See every cable and connector at least once' },
    { id: 'cb_streak_10', label: 'Cable streak', desc: 'Reach a 10 streak in Cable ID' },
  ];

  function el(tag, attrs) { const e = document.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function tileHTML(d) {
    const on = !!d.u;
    return '<div class="ms-tile ' + (on ? 'ms-tile-on' : 'ms-tile-off') + '" data-id="' + d.id + '" title="' + esc(d.desc) + '">' +
      '<div class="ms-tile-label">' + esc(d.label) + '</div>' +
      '<div class="ms-tile-desc">' + esc(d.desc) + '</div>' +
      '</div>';
  }

  function render(mountSel) {
    const mount = document.querySelector(mountSel);
    const total = DEFS.length;
    const unlocked = DEFS.filter(d => d.u);
    const unlockedCount = unlocked.length;
    const pct = Math.round((unlockedCount / total) * 100);
    const recent = unlocked.filter(d => d.r).sort((a, b) => a.r - b.r); // r=1 most recent

    const card = el('div', { class: 'ms-card', id: 'ms-card' });
    card.innerHTML =
      '<div class="ms-head"><div>' +
        '<p class="ms-eyebrow">Badges · ' + unlockedCount + ' of ' + total + ' unlocked</p>' +
        '<h1 class="ms-title">Recently <em>unlocked.</em></h1>' +
      '</div><div class="ms-progress">' +
        '<span class="ms-count" data-count>' + unlockedCount + '<span class="ms-total"> / ' + total + '</span></span>' +
        '<div class="ms-bar-track"><div class="ms-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="ms-pct" data-pct>' + pct + '%</span>' +
      '</div></div>' +
      '<div class="ms-section-title">Recently unlocked</div>' +
      '<div class="ms-recent">' + recent.map(tileHTML).join('') + '</div>' +
      '<button class="ms-toggle" aria-expanded="true">Show all ' + total + ' milestones</button>' +
      '<div class="ms-grid">' + DEFS.map(tileHTML).join('') + '</div>';

    mount.appendChild(card);

    const grid = card.querySelector('.ms-grid');
    const recentEl = card.querySelector('.ms-recent');
    const tiles = Array.prototype.slice.call(grid.querySelectorAll('.ms-tile')).map((node, i) => {
      const d = DEFS[i];
      return { el: node, def: d, unlocked: !!d.u, recent: !!d.r, progress: d.p || null };
    });
    const recentTiles = Array.prototype.slice.call(recentEl.querySelectorAll('.ms-tile')).map((node, i) => ({ el: node, def: recent[i] }));

    // native-ish toggle (mockups may override)
    const toggleBtn = card.querySelector('.ms-toggle');
    toggleBtn.addEventListener('click', () => {
      const open = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', String(!open));
      grid.style.display = open ? 'none' : '';
    });

    window.Milestones = {
      card, grid, recentEl, toggleBtn,
      barFill: card.querySelector('.ms-bar-fill'),
      countEl: card.querySelector('[data-count]'),
      pctEl: card.querySelector('[data-pct]'),
      total, unlockedCount, pct,
      tiles, recent: recentTiles, el,
    };
    return window.Milestones;
  }

  window.Milestones = { render };
})();
