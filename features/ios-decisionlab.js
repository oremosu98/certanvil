// Lift B3c3 (v8.192.0): Decision Lab on phones, in the June E2E language (mockups/cert-ios-decisionlab.html).
// Pure model/view pairs for the entry and the results, plus the phone hosts that features/sim-lab.js calls from
// its Decision Lab section. The runs reuse the Sim Lab round card (B3b1) and exam bar / End dialog (B3b2).
(function () {
  var MQ = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
  function isPhone() { return !!(MQ && MQ.matches); }

  // ── Entry ── s = {mode: 'practice'|'exam', decisions: 5|10|20, target, back: 'drills'|'setup', free}
  function _iosDlEntryModel(s) {
    return { mode: s.mode === 'exam' ? 'exam' : 'practice', decisions: Number(s.decisions) || 10, target: s.target, free: !!s.free,
      backLabel: s.back === 'drills' ? 'Back to Drills' : 'Back to Home' };
  }
  function _iosDlEntryHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function svg(p, n, fill) { return '<svg viewBox="0 0 24 24" aria-hidden="true" width="' + n + '" height="' + n + '" fill="' + (fill ? 'currentColor' : 'none') + '" stroke="' + (fill ? 'none' : 'currentColor') + '" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
    var LOCK = '<rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>';
    var CHECK = svg('<path d="M20 6L9 17l-5-5"></path>', 16);
    function mode(id, icon, name, line, tag) {
      return '<button class="idl-mode" type="button" data-act="mode" data-mode="' + id + '" aria-pressed="' + (m.mode === id) + '"><span class="idl-mi">' + svg(icon, 18) + '</span>'
        + '<b>' + name + (tag || '<span class="idl-tick">' + CHECK + '</span>') + '</b><span class="idl-ml">' + line + '</span></button>';
    }
    function count(n) {
      var lock = m.free && n === 20;
      return '<button' + (lock ? ' class="locked"' : '') + ' type="button" data-act="count" data-n="' + n + '" aria-pressed="' + (m.decisions === n) + '">' + (lock ? svg(LOCK, 11) : '') + n + '</button>';
    }
    return '<div class="idl-hdr"><button type="button" class="idl-back" data-act="back" aria-label="' + e(m.backLabel) + '">' + svg('<path d="M15 6l-6 6 6 6"></path>', 16) + '</button><h1>Decision Lab</h1>'
      + (m.free ? '<span class="idl-pro">' + svg(LOCK, 10) + 'Pro</span>' : '') + '</div>'
      + '<div class="idl-body"><div class="idl-hero"><div class="idl-mark">' + svg('<path d="M6 3v6a3 3 0 0 0 3 3h6"></path><path d="M18 9V3M15 6l3-3 3 3M18 12v9"></path>', 26) + '</div>'
      + '<h2>Make the <em>right call</em></h2><p>Three of four options look right. The buried constraint picks the winner.</p></div>'
      + '<div class="idl-target"><div class="idl-k">Today’s target</div><div class="idl-v">Mixed services</div><div class="idl-w">' + e(m.target) + '</div></div>'
      + '<div class="idl-sect">Mode</div><div class="idl-modes" role="group" aria-label="Decision Lab mode">'
      + mode('practice', '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"></path><path d="M8 7h6"></path>', 'Practice', 'Why each wrong option is wrong.')
      + mode('exam', '<circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2.5 1.5M9 2h6"></path>', 'Exam-style', 'Timed, no feedback till the end.',
        m.free ? '<span class="idl-protag">' + svg(LOCK, 9) + 'Pro</span>' : null)
      + '</div><div class="idl-sect">How many decisions</div><div class="idl-count"><span class="idl-bn">' + m.decisions + '</span><span class="idl-bl">decisions</span></div>'
      + '<div class="idl-seg" role="group" aria-label="Decisions">' + count(5) + count(10) + count(20) + '</div>'
      + (m.free ? '<p class="idl-cap">Free covers <b>one set a day</b>, with the full reasoning on every miss.</p>' : '') + '</div>'
      + '<div class="idl-dock"><button type="button" class="idl-start" data-act="start">' + svg('<path d="M6 4l14 8-14 8V4z"></path>', 14, true) + 'Start the drill <span class="idl-qc">' + m.decisions + ' decisions</span></button></div>';
  }

  // ── Results ── s = {mode, code, timeUp, passed, rounds, pairs: [{label, count}], families: [], back,
  //                   decisions: [{title, family, right, kind: 'pick'|'other', pick, rightCall, tell}]}
  function _iosDlResultModel(s) {
    return {
      kick: 'Decision Lab · ' + (s.mode === 'exam' ? 'Exam-style' : 'Practice') + ' · ' + (s.timeUp ? 'Time’s up' : (s.code || '')),
      title: '<em>' + (Number(s.passed) || 0) + ' of ' + (Number(s.rounds) || 0) + '</em> right calls',
      pairs: (s.pairs || []).map(function (p) { var parts = String(p.label).split(' vs '); return { a: parts[0], b: parts.length > 1 ? parts.slice(1).join(' vs ') : null, count: p.count }; }),
      families: s.families || [], rows: s.decisions || [], n: (s.decisions || []).length,
      backLabel: s.back === 'drills' ? 'Back to Drills' : 'Back to Home'
    };
  }
  function _iosDlResultHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function svg(p, n) { return '<svg viewBox="0 0 24 24" aria-hidden="true" width="' + n + '" height="' + n + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
    var h = '<div class="idl-vbody"><div class="idl-vkick">' + svg('<path d="M6 3v6a3 3 0 0 0 3 3h6"></path><path d="M18 9V3M15 6l3-3 3 3M18 12v9"></path>', 14) + e(m.kick) + '</div>'
      + '<h2 class="idl-vtitle">' + m.title + '</h2>';
    if (m.pairs.length) {
      h += '<div class="idl-sect">Look-alikes you still confuse</div>' + m.pairs.map(function (p) {
        return '<div class="idl-conf"><span class="idl-pr"><b>' + e(p.a) + '</b>' + (p.b != null ? ' vs <b>' + e(p.b) + '</b>' : '') + '</span><span class="idl-tag">Missed ×' + (Number(p.count) || 0) + '</span></div>';
      }).join('');
    }
    if (m.families.length) h += '<div class="idl-sect">Weak service families</div><div class="idl-chips">' + m.families.map(function (f) { return '<span>' + e(f) + '</span>'; }).join('') + '</div>';
    h += '<div class="idl-sect">Your ' + m.n + ' decisions</div>';
    m.rows.forEach(function (r, i) {
      var tell = '<div class="idl-lab n">The tell</div><p class="idl-why">' + e(r.tell) + '</p>';
      var body = r.kind === 'pick'
        ? '<div class="idl-lab ' + (r.right ? 'ok' : 'no') + '">Your pick</div><div class="idl-val">' + (r.pick == null ? 'No answer' : e(r.pick)) + '</div>'
          + (r.right ? '' : '<div class="idl-lab ok">Right call</div><div class="idl-val">' + e(r.rightCall) + '</div>') + tell
        : tell;
      h += '<button type="button" class="idl-srow" aria-expanded="false" aria-controls="idl-sdet-' + i + '"><span class="idl-sn"><span class="idl-st">' + e(r.title) + '</span><span class="idl-ss">' + e(r.family) + '</span></span>'
        + '<span class="idl-sv ' + (r.right ? 'ok">Right' : 'no">Wrong') + '</span>' + svg('<path d="M9 6l6 6-6 6"></path>', 16) + '</button>'
        + '<div class="idl-sdet" id="idl-sdet-' + i + '" hidden>' + body + '</div>';
    });
    return h + '</div><div class="idl-vdock"><button type="button" class="idl-primary" data-act="again">Run another set</button>'
      + '<button type="button" class="idl-ghost" data-act="exit">' + e(m.backLabel) + '</button></div>';
  }

  // ── Phone hosts ──
  function _call(name, arg) { if (typeof window[name] === 'function') window[name](arg); }
  // Renders the phone entry into #idl-entry and wires it (one delegated listener). False on desktop.
  function renderEntry(s) {
    var host = document.getElementById('idl-entry');
    if (!host) return false;
    if (!isPhone()) { host.innerHTML = ''; return false; }
    host.innerHTML = _iosDlEntryHtml(_iosDlEntryModel(s));
    if (!host.__idlBound) {
      host.__idlBound = true;
      host.addEventListener('click', function (ev) {
        var b = ev.target.closest && ev.target.closest('[data-act]');
        if (!b || !host.contains(b)) return;
        var act = b.getAttribute('data-act');
        if (act === 'back') _call('decisionLabEntryBack');
        else if (act === 'mode') _call('decisionLabPickMode', b.getAttribute('data-mode'));
        else if (act === 'count') _call('decisionLabPickDecisions', b.getAttribute('data-n'));
        else if (act === 'start') _call('decisionLabSessionStart');
      });
    }
    return true;
  }

  window._iosDlEntryModel = _iosDlEntryModel; window._iosDlEntryHtml = _iosDlEntryHtml;
  window._iosDlResultModel = _iosDlResultModel; window._iosDlResultHtml = _iosDlResultHtml;
  window.iosDecisionLab = window.iosDecisionLab || {};
  window.iosDecisionLab.isPhone = isPhone;
  window.iosDecisionLab.renderEntry = renderEntry;
})();
