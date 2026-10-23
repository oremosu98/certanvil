/* Lift B3b1 (v8.188.0): practice Sim Lab on phones (cert-ios-simlab.html). Loaded eagerly (defer);
 * features/sim-lab.js is lazy and calls in here only on phones, only when a caller passes opts.lift.
 * Desktop never reaches any of this. */
(function () {
  'use strict';
  var MQ = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
  function isPhone() { return !!(MQ && MQ.matches); }

  // ── Start screen (#isl-entry) ──────────────────────────────────────────────
  // Pure: live state -> view model. s = {cert:{mark,name,code}, mode, rounds, pro, tierKnown, examNote}
  function _iosSlEntryModel(s) {
    var gate = !!s.tierKnown && !s.pro;
    var exam = s.mode === 'exam';
    return {
      cert: s.cert || { mark: 'CA', name: '', code: '' },
      mode: exam ? 'exam' : 'practice',
      rounds: s.rounds === 3 || s.rounds === 10 ? s.rounds : 5,
      locked10: gate,
      examLocked: gate,
      capLine: gate,
      startLabel: exam ? 'Start exam sim' : 'Start the sim',
      summary: exam ? (s.examNote || '') : 'Practice mode, mixed topics, a count-up timer.'
    };
  }
  // Pure: model -> markup of the E2E start screen (isl- prefixed). Self-contained.
  function _iosSlEntryHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function svg(p, n, fill) { return '<svg viewBox="0 0 24 24" aria-hidden="true" width="' + n + '" height="' + n + '" fill="' + (fill ? 'currentColor' : 'none') + '" stroke="' + (fill ? 'none' : 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
    var LOCK = svg('<rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>', 11);
    var TICK = '<span class="isl-tick">' + svg('<path d="M20 6 9 17l-5-5"></path>', 16) + '</span>';
    var SIM = svg('<rect x="3" y="4" width="18" height="16" rx="2.5"></rect><path d="M7 9l3 3-3 3M12 15h5"></path>', 18);
    var CLOCK = svg('<circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2.5 2M9 2h6"></path>', 18);
    var BACK = svg('<path d="M15 18l-6-6 6-6"></path>', 16);
    var PLAY = svg('<path d="M6 4l14 8-14 8V4z"></path>', 14, true);
    function mode(id, icon, name, line) {
      var on = m.mode === id, locked = id === 'exam' && m.examLocked;
      return '<button class="isl-mode" type="button" data-act="mode" data-mode="' + id + '" aria-pressed="' + on + '">'
        + '<span class="isl-mi">' + icon + '</span>'
        + '<b>' + name + (locked ? ' <span class="isl-pro-tag">' + LOCK + 'Pro</span>' : (on ? ' ' + TICK : '')) + '</b>'
        + '<span class="isl-ml">' + line + '</span></button>';
    }
    function rounds(n) {
      var locked = n === 10 && m.locked10;
      return '<button type="button" data-act="rounds" data-rounds="' + n + '" aria-pressed="' + (m.rounds === n) + '"'
        + (locked ? ' data-locked="1" aria-label="10 rounds, Pro">' + LOCK : '>') + n + '</button>';
    }
    var c = m.cert;
    var h = '<div class="isl-hdr"><button class="isl-back" type="button" data-act="back" aria-label="Back">' + BACK + '</button>'
      + '<span class="isl-title"><h1>Sim Lab</h1><span>Practice the hands-on PBQs</span></span></div>';
    h += '<div class="isl-body">'
      + '<div class="isl-cert-strip isl-reveal"><span class="isl-cm">' + e(c.mark) + '</span><span class="isl-cn"><b>' + e(c.name) + '</b><span>' + e(c.code) + '</span></span></div>'
      + '<p class="isl-lede isl-reveal">The exam opens with them. Run a few back to back and the format stops being a surprise.</p>'
      + '<div class="isl-sect isl-reveal">Mode</div>'
      + '<div class="isl-modes isl-reveal" role="group" aria-label="Sim Lab mode">'
      + mode('practice', SIM, 'Practice', 'Relaxed, a count-up timer.')
      + mode('exam', CLOCK, 'Exam', 'One clock, flag and return.') + '</div>'
      + '<div class="isl-sect isl-reveal">Length</div>'
      + '<div class="isl-count isl-reveal"><span class="isl-bn">' + m.rounds + '</span><span class="isl-bl">rounds</span></div>'
      + '<div class="isl-cseg isl-reveal" role="group" aria-label="Rounds">' + rounds(3) + rounds(5) + rounds(10) + '</div>'
      + (m.capLine ? '<p class="isl-cap isl-reveal">Free covers <b>one Sim Lab session a day</b>. 10 rounds, the exam length, needs Pro.</p>' : '')
      + '</div>';
    h += '<div class="isl-dock"><button class="isl-start" type="button" data-act="start">' + PLAY + e(m.startLabel)
      + ' <span class="isl-qc">' + m.rounds + ' rounds</span></button>'
      + (m.summary ? '<p class="isl-foot">' + e(m.summary) + '</p>' : '') + '</div>';
    return h;
  }
  function _islText(el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  // Live state comes from the real (hidden) start screen, so mode, rounds and gates stay sim-lab.js's own.
  function _islEntryState() {
    var q = function (sel) { return document.querySelector(sel); };
    var modeEl = q('#sle-mode .sle-seg-opt.is-on[data-mode]'), roundsEl = q('#sle-rounds .sle-chip.is-on[data-rounds]');
    var note = q('#sle-note');
    var qs = window._quotaState;
    var pro = !!(qs && (qs.tier === 'pro' || qs.tier === 'admin'));
    return {
      cert: typeof window.iosCertIdentity === 'function' ? window.iosCertIdentity() : { mark: 'CA', name: '', code: '' },
      mode: modeEl ? modeEl.getAttribute('data-mode') : 'practice',
      rounds: roundsEl ? parseInt(roundsEl.getAttribute('data-rounds'), 10) : 5,
      pro: pro,
      tierKnown: !!qs || document.body.classList.contains('is-state-resolved'),
      examNote: note && !note.classList.contains('is-hidden') ? _islText(note) : null
    };
  }
  function renderIosSimLabEntry(opts) {
    var root = document.getElementById('isl-entry');
    if (!root) return;
    root.classList.toggle('isl-static', !!(opts && opts.still));
    if (!isPhone()) { root.innerHTML = ''; return; }
    try {
      root.innerHTML = _iosSlEntryHtml(_iosSlEntryModel(_islEntryState()));
      if (!root._islWired) { root._islWired = true; root.addEventListener('click', _islEntryTap); }
    } catch (err) { root.innerHTML = ''; try { console.warn('[ios-simlab]', err); } catch (_) {} }   // the old screen shows instead
  }
  function _islEntryTap(ev) {
    var b = ev.target.closest && ev.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act'), real = null;
    if (act === 'mode') real = document.querySelector('#sle-mode .sle-seg-opt[data-mode="' + b.getAttribute('data-mode') + '"]');
    else if (act === 'rounds') real = document.querySelector('#sle-rounds .sle-chip[data-rounds="' + b.getAttribute('data-rounds') + '"]');
    else if (act === 'start') real = document.getElementById('sle-start');
    else if (act === 'back') real = document.querySelector('#page-sim-lab-entry [data-action="simLabEntryBack"]');
    if (real) real.click();   // the real handlers apply the gates and update their own state
    if (act === 'mode' || act === 'rounds') renderIosSimLabEntry({ still: true });
  }
  // ── The round (sim-lab.js _slMountScenario calls these when opts.lift on a phone) ──
  // Passive references hold no answers, so a copy can open full size. terminal / faceplate / wiremap
  // are answer surfaces (excerptLines / facePorts / wiremapPins) and stay inline only.
  var PASSIVE = { network: 'Network map', timeline: 'Timeline', layered: 'Layers', slots: 'Slots', swatch: 'Sample' };
  var ENL = '<svg viewBox="0 0 24 24" aria-hidden="true" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>';
  var SCN = '<svg viewBox="0 0 24 24" aria-hidden="true" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"></rect><path d="M7 9l3 3-3 3M12 15h5"></path></svg>';
  function decorate(wrap, scn, opts) {
    var ref = scn && scn.assets && scn.assets.reference;
    // A new round rises in after the skeleton; a Reset re-mount (same opts) and the exam's per-question
    // re-renders do not replay it.
    if (opts && !opts.__islEntered && !(wrap.closest && wrap.closest('.exam-pbq'))) { opts.__islEntered = true; wrap.classList.add('isl-enter'); }
    var prose = wrap.querySelector('.sl-scn-prose');
    if (prose && !prose.querySelector('.isl-scn-k')) prose.insertAdjacentHTML('afterbegin', '<span class="isl-scn-k">' + SCN + 'Scenario</span>');
    var panel = wrap.querySelector('.sl-ref');
    if (ref && panel && PASSIVE[ref.kind] && !panel.querySelector('.isl-ref-head')) {
      var title = PASSIVE[ref.kind], node = panel.firstElementChild;
      var head = document.createElement('div');
      head.className = 'isl-ref-head';
      head.innerHTML = '<span>' + title + '</span><button class="isl-enlarge" type="button">' + ENL + 'Tap to enlarge</button>';
      panel.insertBefore(head, panel.firstChild);
      head.querySelector('.isl-enlarge').addEventListener('click', function () {
        if (window.iosEnlarge && node) window.iosEnlarge(node, title);
      });
    }
    // Inside the full exam the B2 dock (Prev · Flag · Next) stays, so Reset moves: into the console
    // bar when the reference is a terminal, otherwise a compact pill at the top right of step 1.
    var reset = wrap.closest && wrap.closest('.exam-pbq') ? wrap.querySelector('.sl-actions .sl-reset') : null;
    if (reset) {
      var bar = ref && ref.kind === 'terminal' ? wrap.querySelector('.term-head') : null;
      var step = wrap.querySelector('.sl-step');
      reset.classList.add('isl-reset-pill');
      if (bar) bar.appendChild(reset);
      else if (step) { reset.classList.add('isl-reset-step'); step.insertBefore(reset, step.firstChild); }
    }
  }
  function askReset() {
    if (!window.iosSheet) return Promise.resolve(window.confirm('Clear your answers on this PBQ and start it again?'));
    return window.iosSheet({ title: 'Start this PBQ again?', body: 'Your answers on this question will be cleared.', go: 'Clear answers', stay: 'Keep them' });
  }

  // ── Exam mode (Lift B3b2): the bar, the dock and the End dialog. Pure; s = {idx, rounds, answered[], flagged[]}. ──
  function _iosSlExamBarModel(s) {
    var ticks = [], k = 0;
    for (var i = 0; i < s.rounds; i++) {
      if (s.answered[i]) k++;
      ticks.push(i === s.idx ? 'cur' : s.flagged[i] ? 'flag' : s.answered[i] ? 'done' : '');
    }
    return { cn: 'Round ' + (s.idx + 1) + ' of ' + s.rounds, cs: k + ' answered', ticks: ticks };
  }
  function _iosSlExamBarHtml(m) {
    return { mid: '<span class="isl-xcn">' + m.cn + '</span><span class="isl-xcs">' + m.cs + '</span>',
      strip: m.ticks.map(function (t) { return '<i class="' + t + '"></i>'; }).join('') };
  }
  function _iosSlExamDockHtml(d) {
    function svg(p, n) { return '<svg viewBox="0 0 24 24" aria-hidden="true" width="' + n + '" height="' + n + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
    return '<button type="button" class="isl-xprev" data-act="prev" aria-label="Previous round"' + (d.first ? ' disabled' : '') + '>' + svg('<path d="M15 18l-6-6 6-6"></path>', 18) + '</button>'
      + '<button type="button" class="isl-xflag' + (d.flagged ? ' is-on' : '') + '" data-act="flag" aria-pressed="' + (d.flagged ? 'true' : 'false') + '">' + svg('<path d="M5 21V4h11l-1.5 4L16 12H5"></path>', 15) + (d.flagged ? 'Flagged' : 'Flag') + '</button>'
      + '<button type="button" class="isl-xnext" data-act="next">' + (d.last ? 'Review' : 'Next' + svg('<path d="M5 12h14M13 6l6 6-6 6"></path>', 17)) + '</button>';
  }
  function _iosSlEndModel(s) {
    var answered = 0, flagged = 0, firstSkip = -1, firstFlag = -1, grid = [];
    for (var i = 0; i < s.rounds; i++) {
      var a = !!s.answered[i], f = !!s.flagged[i], cur = i === s.idx;
      if (a) answered++; else if (firstSkip < 0) firstSkip = i;
      if (f) { flagged++; if (firstFlag < 0) firstFlag = i; }
      grid.push({ n: i + 1, cls: ((f ? 'f' : a ? 'a' : '') + (cur ? ' c' : '')).trim(),
        label: 'Round ' + (i + 1) + ', ' + (cur ? 'current' : f ? 'flagged' : a ? 'answered' : 'skipped') });
    }
    var skipped = s.rounds - answered, review = null;
    if (skipped) review = { label: 'Review the ' + skipped + ' you skipped first', target: firstSkip };
    else if (flagged) review = { label: 'Review the ' + flagged + ' you flagged first', target: firstFlag };
    return { answered: answered, skipped: skipped, flagged: flagged, review: review, grid: grid };
  }
  function _iosSlEndHtml(m) {
    return '<div class="modal-box">'
      + '<div class="ed-modalhead"><div class="ed-modalhead-eyebrow">Sim Lab exam · end of session</div><h2 class="ed-modalhead-title" id="isl-end-title">Submit <em>exam?</em></h2></div>'
      + '<div class="modal-stats"><div class="modal-stat"><div class="ms-val">' + m.answered + '</div><div class="ms-lbl">Answered</div></div>'
      + '<div class="modal-stat"><div class="ms-val isl-ms-skip">' + m.skipped + '</div><div class="ms-lbl">Skipped</div></div>'
      + '<div class="modal-stat"><div class="ms-val isl-ms-flag">' + m.flagged + '</div><div class="ms-lbl">Flagged</div></div></div>'
      + '<div class="modal-actions">' + (m.review ? '<button type="button" class="ix-review" data-act="review">' + m.review.label + '</button>' : '')
      + '<button type="button" class="btn btn-primary" data-act="submit">Submit and see results</button>'
      + '<button type="button" class="btn btn-danger" data-act="abandon">Abandon exam</button></div>'
      + '<div class="ix-jump"><button type="button" class="ix-jump-t" aria-expanded="false" aria-controls="isl-jgrid">Jump to a round</button>'
      + '<div class="ix-jgrid" id="isl-jgrid" role="list">' + m.grid.map(function (g, i) {
        return '<button type="button" role="listitem"' + (g.cls ? ' class="' + g.cls + '"' : '') + ' data-i="' + i + '" aria-label="' + g.label + '">' + g.n + '</button>';
      }).join('') + '</div>'
      + '<div class="ix-jkey" aria-hidden="true"><span><i class="a"></i>Answered</span><span><i></i>Skipped</span><span><i class="f"></i>Flagged</span></div></div>'
      + '</div>';
  }

  // ── The verdict (#sl-result-root on phones) ──
  // Pure: s = {rounds:[{title, topic, correct, total, fraction, panelHtml}], pct, passed, stepsCorrect, stepsTotal, slip, pro}.
  // panelHtml comes from sim-lab.js's own answer panel (already escaped there) and passes through.
  function _iosSlVerdictModel(s) {
    var rounds = (s.rounds || []).map(function (r) {
      var f = Number(r.fraction) || 0;
      var tone = f >= 1 ? 'ok' : (r.correct > 0 ? 'part' : 'no');
      return { title: r.title, topic: r.topic, score: r.correct + '/' + r.total, tone: tone,
        label: tone === 'ok' ? 'Right' : tone === 'part' ? 'Partly' : 'Wrong', panelHtml: r.panelHtml || '' };
    });
    var pct = Math.max(0, Math.min(100, Math.round(Number(s.pct) || 0)));
    var m = { n: rounds.length, passed: s.passed || 0, pct: pct, stepsCorrect: s.stepsCorrect || 0, stepsTotal: s.stepsTotal || 0,
      rounds: rounds, slip: s.slip || null, upsell: !s.pro };
    if (s.mode !== 'exam') return m;
    // v8.189.0 Lift B3b2: Sim Lab exam: no upsell, a time-up kicker, and the Pace card (today's contents).
    function fmt(ms) { var t = Math.max(0, Math.round(ms / 1000)), mm = Math.floor(t / 60); return mm + ':' + String(t % 60).padStart(2, '0'); }
    var p = s.pace || { totalMs: 0, budgetMs: 0, deltaMs: 0, timeUp: !!s.timeUp, perRound: [] };
    var up = !!(s.timeUp || p.timeUp), worst = 0, worstOver = -Infinity;
    (p.perRound || []).forEach(function (r, i) { var o = r.roundMs - r.parMs; if (o > worstOver) { worstOver = o; worst = i; } });
    m.upsell = false;
    m.timeUp = up;
    m.kick = (up ? "Time's up · " : 'Sim Lab exam · ') + m.n + ' rounds';
    m.pace = {
      total: fmt(p.totalMs), pill: up ? 'Out of time' : 'On exam pace', over: up,
      sub: up ? 'Round ' + (worst + 1) + " ran long. On test day that's the round to triage: flag it and move."
        : fmt(p.deltaMs) + ' to spare. On the real exam that leaves room to revisit a hard PBQ.',
      pct: p.budgetMs ? Math.min(100, Math.round(p.totalMs / p.budgetMs * 100)) : 0,
      target: 'Target ' + fmt(p.budgetMs), yours: 'your time ' + fmt(p.totalMs),
      rows: (p.perRound || []).map(function (r, i) {
        return { label: 'Round ' + (i + 1) + ' · ' + ((rounds[i] && rounds[i].topic) || 'PBQ'), time: fmt(r.roundMs), par: 'par ' + fmt(r.parMs), over: r.roundMs > r.parMs };
      })
    };
    return m;
  }
  // Pure: model -> markup of the E2E verdict (isl- prefixed). Self-contained.
  function _iosSlVerdictHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function svg(p, n) { return '<svg viewBox="0 0 24 24" aria-hidden="true" width="' + n + '" height="' + n + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
    var DONE = svg('<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>', 14);
    var CHEV = svg('<path d="M9 6l6 6-6 6"></path>', 16);
    var CLOCK = svg('<circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2M9 2h6"></path>', 14);
    var SPARK = svg('<path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path><circle cx="12" cy="12" r="4"></circle>', 13);
    var h = '<div class="isl-vbody">'
      + '<div class="isl-vkick">' + (m.timeUp ? CLOCK : DONE) + (m.kick ? e(m.kick) : 'Sim Lab · ' + m.n + ' rounds') + '</div>'
      + '<h2 class="isl-vtitle">' + m.passed + ' of ' + m.n + ' <em>passed.</em></h2>'
      + '<p class="isl-vsub">' + m.stepsCorrect + ' of ' + m.stepsTotal + ' steps right.</p>'
      + '<div class="isl-vscore"><b>' + m.pct + '</b><span>%</span></div><div class="isl-vmeter"><i style="width:' + m.pct + '%"></i></div>';
    if (m.pace) {
      var P = m.pace;
      h += '<div class="isl-pace"><div class="isl-pk">Pace</div><div class="isl-ph"><span class="isl-pt">' + P.total + '</span><span class="isl-pv' + (P.over ? ' over' : '') + '">' + P.pill + '</span></div>'
        + '<p class="isl-ps">' + e(P.sub) + '</p>'
        + '<div class="isl-ptrack"><i class="isl-pfill' + (P.over ? ' over' : '') + '" style="width:' + P.pct + '%"></i><span class="isl-ptick"><b>' + P.target + '</b></span></div>'
        + '<div class="isl-pscale"><span>0:00</span><span>' + P.yours + '</span></div><div class="isl-prows">'
        + P.rows.map(function (r) { return '<div class="isl-prow"><span class="isl-prn">' + e(r.label) + '</span><span class="isl-prt' + (r.over ? ' over' : '') + '">' + r.time + '</span><span class="isl-prp">' + r.par + '</span></div>'; }).join('')
        + '</div></div>';
    }
    h += '<div class="isl-sect">Your rounds</div>';
    m.rounds.forEach(function (r, i) {
      h += '<button class="isl-srow" type="button" aria-expanded="false" aria-controls="isl-sdet-' + i + '">'
        + '<span class="isl-sn2"><span class="isl-st">' + e(r.title) + '</span><span class="isl-ss">' + e(r.topic) + ' · ' + e(r.score) + '</span></span>'
        + '<span class="isl-sv isl-' + r.tone + '">' + r.label + '</span>' + CHEV + '</button>'
        + '<div class="isl-sdet" id="isl-sdet-' + i + '" hidden>' + r.panelHtml + '</div>';
    });
    if (m.slip) h += '<div class="isl-slip"><span class="isl-k">' + SPARK + 'Where you slipped</span><p>' + e(m.slip) + '</p></div>';
    if (m.upsell) h += '<button class="isl-upsell" type="button" data-action="simLabSummaryUpsell"><span>Go Pro for exam-length runs</span>' + CHEV + '</button>';
    h += '</div><div class="isl-vdock"><button class="isl-vback" type="button" data-action="simLabExit">Back to Practice</button></div>';
    return h;
  }
  function verdictHtml(s) { return _iosSlVerdictHtml(_iosSlVerdictModel(s)); }
  // One delegated listener: a row opens and closes its answer panel.
  function wireVerdict(root) {
    if (!root || root._islWired) return;
    root._islWired = true;
    root.addEventListener('click', function (ev) {
      var row = ev.target.closest && ev.target.closest('.isl-srow');
      if (!row || !root.contains(row)) return;
      var panel = document.getElementById(row.getAttribute('aria-controls'));
      var open = row.getAttribute('aria-expanded') !== 'true';
      row.setAttribute('aria-expanded', String(open));
      if (panel) panel.hidden = !open;
    });
  }

  // Tier hydrates after the start screen can first paint: app.js re-runs renderGauntletDrillsCard then
  // (B3a's hook), so chain onto it and repaint the locks, Pro tag and cap line in place.
  function _islChainTier() {
    var f = window.renderGauntletDrillsCard;
    if (typeof f !== 'function' || f._islChained) return;
    var chained = function () {
      var r = f.apply(this, arguments);
      var root = document.getElementById('isl-entry');
      if (root && root.innerHTML) renderIosSimLabEntry({ still: true });
      return r;
    };
    chained._islChained = true;
    if (f._idChained) chained._idChained = true;
    window.renderGauntletDrillsCard = chained;
  }
  _islChainTier();
  if (MQ) {
    var onMq = function () { var p = document.getElementById('page-sim-lab-entry'); if (!MQ.matches || (p && p.classList.contains('active'))) renderIosSimLabEntry(); };
    if (MQ.addEventListener) MQ.addEventListener('change', onMq); else if (MQ.addListener) MQ.addListener(onMq);
  }

  window.iosSimLab = window.iosSimLab || {};
  window.iosSimLab.isPhone = isPhone;
  window.iosSimLab.decorate = decorate;
  window.iosSimLab.askReset = askReset;
  window.iosSimLab.verdictHtml = verdictHtml;
  window.iosSimLab.wireVerdict = wireVerdict;
  window._iosSlVerdictModel = _iosSlVerdictModel;
  window._iosSlVerdictHtml = _iosSlVerdictHtml;
  window._iosSlExamBarModel = _iosSlExamBarModel;
  window._iosSlExamBarHtml = _iosSlExamBarHtml;
  window._iosSlExamDockHtml = _iosSlExamDockHtml;
  window._iosSlEndModel = _iosSlEndModel;
  window._iosSlEndHtml = _iosSlEndHtml;
  window.renderIosSimLabEntry = renderIosSimLabEntry;
  window._iosSlEntryModel = _iosSlEntryModel;
  window._iosSlEntryHtml = _iosSlEntryHtml;
})();
