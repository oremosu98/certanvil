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
    function svg(p, cls) { return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; }
    var LOCK = svg('<rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>');
    var TICK = '<span class="isl-tick">' + svg('<path d="M20 6 9 17l-5-5"></path>') + '</span>';
    var SIM = svg('<rect x="3" y="4" width="18" height="16" rx="2.5"></rect><path d="M7 9l3 3-3 3M12 15h5"></path>');
    var CLOCK = svg('<circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2.5 2M9 2h6"></path>');
    var BACK = svg('<path d="M15 18l-6-6 6-6"></path>');
    var PLAY = svg('<path d="M6 4l14 8-14 8V4z"></path>');
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
  var ENL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>';
  function decorate(wrap, scn, opts) {
    var ref = scn && scn.assets && scn.assets.reference;
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
  }
  function askReset() {
    if (!window.iosSheet) return Promise.resolve(window.confirm('Clear your answers on this PBQ and start it again?'));
    return window.iosSheet({ title: 'Start this PBQ again?', body: 'Your answers on this question will be cleared.', go: 'Clear answers', stay: 'Keep them' });
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
  window.renderIosSimLabEntry = renderIosSimLabEntry;
  window._iosSlEntryModel = _iosSlEntryModel;
  window._iosSlEntryHtml = _iosSlEntryHtml;
})();
