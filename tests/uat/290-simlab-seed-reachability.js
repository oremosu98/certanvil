// tests/uat/290-simlab-seed-reachability.js
// Scope: EVERY seed in a Sim Lab bank must be reachable by the pickers.
//
// Why this module exists: both selection paths used to be index-bounded, so a
// bank longer than the index range had a dead tail no learner could ever be
// served. Measured on prod at v8.9.0 — SIM_LAB_SEED_SECPLUS was 87 entries with
// `vpntunnel` at 75-86 and `defense` at 70, all invisible:
//   _slPickSeed      idx = minutes % bank.length      -> only 0..59
//   _slPickSeedFresh idx = usedIds.size % pool.length -> only 0..9 (max rounds)
// New waves are always APPENDED, so the dead tail grows with every wave. These
// tests are the ratchet that stops it coming back.

const { ROOT, _fnBody, dgCss, fs, html, js, path, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Sim Lab: every seed in the bank is reachable ──\x1b[0m');
  try {
    // Build a vm context holding the REAL picker source, with a fakeable clock.
    function mkCtx(bankLen) {
      var ctx = {};
      vm.createContext(ctx);
      var bank = [];
      for (var i = 0; i < bankLen; i++) bank.push({ id: 'seed-' + i, idx: i });
      ctx.__bank = bank;
      // Stub the collaborators the pickers close over.
      vm.runInContext('var _fakeNow = 0;', ctx);
      vm.runInContext('function simLabValidateScenario(s) { return { ok: true, errors: [] }; }', ctx);
      vm.runInContext('function _slBank(cert) { return __bank; }', ctx);
      vm.runInContext(_fnBody(js, '_slNowMinutes'), ctx);
      vm.runInContext(_fnBody(js, '_slRotationOffset'), ctx);
      // _fnBody prefix trap (CLAUDE.md): '_slPickSeed' is a prefix of
      // '_slPickSeedFresh' and _fnBody returns the LONGEST match, so the bare
      // name hands back the wrong body. Anchor on the full signature.
      vm.runInContext(_fnBody(js, '_slPickSeed(cert)'), ctx);
      vm.runInContext(_fnBody(js, '_slPickSeedFresh(cert, usedIds)'), ctx);
      // Drive the clock: _slNowMinutes reads Date, so replace Date wholesale.
      vm.runInContext(
        'function __setMinute(m) {' +
        '  var Real = Date;' +
        '  function F() { var d = new Real(0); d.getHours = function () { return Math.floor(m / 60); };' +
        '                 d.getMinutes = function () { return m % 60; }; return d; }' +
        '  F.now = function () { return m * 60000; };' +
        '  Date = F;' +
        '}', ctx);
      return ctx;
    }

    // ── 1. The taster path covers a bank far longer than 60 ──
    var BANK = 87;                       // the real Sec+ bank size at v8.9.0
    var ctx = mkCtx(BANK);
    var seen = {};
    for (var m = 0; m < 1440; m++) {     // one full day of minutes
      vm.runInContext('__setMinute(' + m + '); globalThis.__p = _slPickSeed("netplus");', ctx);
      var p = ctx.__p;
      if (p) seen[p.idx] = true;
    }
    var reached = Object.keys(seen).length;
    test('Reachability: _slPickSeed reaches EVERY index of an 87-seed bank across a day',
      reached === BANK);
    test('Reachability: _slPickSeed reaches the bank TAIL (index 75-86, where vpntunnel lives)',
      [75, 78, 81, 84, 86].every(function (i) { return seen[i]; }));
    test('Reachability: _slPickSeed reaches index 70 (where defense lives)', !!seen[70]);

    // ── 2. The session path reaches the tail within a real session ──
    // A session is at most 10 rounds. Across the day, the tail must be served.
    var ctx2 = mkCtx(BANK);
    var sessionSeen = {};
    for (var mm = 0; mm < 1440; mm += 7) {
      vm.runInContext('__setMinute(' + mm + ');' +
        'var used = new Set(); globalThis.__round = [];' +
        'for (var r = 0; r < 10; r++) { var s = _slPickSeedFresh("netplus", used);' +
        '  if (!s) break; used.add(s.id); __round.push(s.idx); }', ctx2);
      (ctx2.__round || []).forEach(function (i) { sessionSeen[i] = true; });
    }
    test('Reachability: a 10-round session can serve the bank TAIL (index 75-86)',
      [75, 78, 81, 84, 86].every(function (i) { return sessionSeen[i]; }));
    test('Reachability: a 10-round session can serve index 70 (defense)', !!sessionSeen[70]);

    // ── 3. The no-repeat contract still holds (this is why `fresh` exists) ──
    var ctx3 = mkCtx(BANK);
    vm.runInContext('__setMinute(613);' +
      'var used = new Set(); globalThis.__ids = [];' +
      'for (var r = 0; r < 10; r++) { var s = _slPickSeedFresh("netplus", used);' +
      '  used.add(s.id); __ids.push(s.id); }', ctx3);
    var ids = ctx3.__ids;
    test('Reachability: 10 rounds return 10 DISTINCT seeds (no-repeat contract intact)',
      ids.length === 10 && new Set(ids).size === 10);

    // ── 4. Small banks still behave — the pinned Task 15 shape ──
    var ctx4 = mkCtx(2);
    vm.runInContext('__setMinute(0); globalThis.__a = _slPickSeed("netplus");', ctx4);
    vm.runInContext('__setMinute(1); globalThis.__b = _slPickSeed("netplus");', ctx4);
    test('Reachability: a 2-seed bank still reaches both entries on consecutive minutes',
      ctx4.__a && ctx4.__b && ctx4.__a.idx === 0 && ctx4.__b.idx === 1);

    // ── 4b. v8.156.0 unseen-first: with a served history, never-served seeds come first ──
    (function () {
      var c = mkCtx(6);
      vm.runInContext('var __ls = {}; var localStorage = { getItem: function (k) { return __ls[k] === undefined ? null : __ls[k]; }, setItem: function (k, v) { __ls[k] = String(v); } };', c);
      vm.runInContext('var _SL_SERVED_KEY = "nplus_simlab_served";', c);
      vm.runInContext(_fnBody(js, '_slServedFor'), c);
      vm.runInContext(_fnBody(js, '_slMarkServed'), c);
      vm.runInContext(_fnBody(js, '_slLeastServed'), c);
      // seeds 0..4 served at increasing times; seed-5 never served
      vm.runInContext('__ls["nplus_simlab_served"] = JSON.stringify({ netplus: { "seed-0": 5, "seed-1": 4, "seed-2": 3, "seed-3": 2, "seed-4": 1 } });', c);
      vm.runInContext('__setMinute(10); globalThis.__u1 = _slPickSeed("netplus");', c);   // fake clock: Date.now() = 600000
      vm.runInContext('__setMinute(10); globalThis.__u2 = _slPickSeed("netplus");', c);   // seed-5 now served; oldest is seed-4
      vm.runInContext('__setMinute(3); var used = new Set(); globalThis.__sess = [];' +
        'for (var r = 0; r < 6; r++) { var s = _slPickSeedFresh("netplus", used); used.add(s.id); __sess.push(s.id); }', c);
      test('Unseen-first: the never-served seed is picked first, then the least-recently-served',
        c.__u1 && c.__u1.id === 'seed-5' && c.__u2 && c.__u2.id === 'seed-4');
      test('Unseen-first: a session still never repeats and covers the whole small bank',
        c.__sess.length === 6 && new Set(c.__sess).size === 6);
    })();

    // ── 4c. v8.156.0 timeline: no severity, no tag (and the Sec+ bank carries none) ──
    test('Timeline: a stage without severity renders no .sl-sevtag (renderer no longer defaults to "low")',
      /var sev = st\.severity \|\| '';/.test(js) && /var tagHtml\s*=\s*sev \? '<span class="sl-sevtag">'/.test(js));
    (function () {
      var sctx = { window: {} }; vm.createContext(sctx);
      vm.runInContext(fs.readFileSync(path.join(ROOT, 'features', 'sim-lab-seed-secplus.js'), 'utf8'), sctx);
      var tagged = (sctx.window.SIM_LAB_SEED_SECPLUS || []).filter(function (sd) {
        var r = sd.assets && sd.assets.reference;
        return r && r.kind === 'timeline' && (r.stages || []).some(function (st) { return st.severity; });
      }).length;
      test('Timeline: no Sec+ incident timeline shows a severity tag (they revealed or contradicted the answer)', tagged === 0);
    })();

    // ── 5. Degenerate inputs stay total ──
    var ctx5 = mkCtx(0);
    vm.runInContext('__setMinute(5); globalThis.__empty = _slPickSeed("netplus");' +
      'globalThis.__emptyFresh = _slPickSeedFresh("netplus", new Set());', ctx5);
    test('Reachability: an empty bank returns null from both pickers, no throw',
      ctx5.__empty === null && ctx5.__emptyFresh === null);
  } catch (err) {
    test('Reachability: Sim Lab seed-reachability block (threw)', false);
    results.errors.push('Sim Lab seed-reachability block threw: ' + err.message);
  }
})();

// ── Sim Lab header strip: the round pill must never wrap ──
// A long scenario topic used to squeeze "Round 1 of 3" until it broke across two
// lines (the Wave 5 topic "Secure enterprise infrastructure" is 32 chars, the
// longest in the Sec+ bank). The label is the shrink target; the pill is not.
(function () {
  console.log('\n\x1b[1m── Sim Lab: header strip does not wrap the round pill ──\x1b[0m');
  try {
    test('Header: the topic label is wrapped in its own .sl-strip-label element',
      /class="sl-strip-label"/.test(html));
    test('Header: .sl-strip-label sits inside .sl-strip and contains #sl-topic',
      /class="sl-strip"><span class="sl-strip-label">[\s\S]{0,120}id="sl-topic"[\s\S]{0,20}<\/span>/.test(html));

    // v8.163.0: each rule may carry a "#page-exam .exam-pbq" twin selector ([^{]*).
    var strip = (dgCss.match(/#page-sim-lab \.sl-strip(?:,[^{]*)?\{[^}]*\}/) || [])[0] || '';
    var label = (dgCss.match(/#page-sim-lab \.sl-strip-label(?:,[^{]*)?\{[^}]*\}/) || [])[0] || '';
    var pill = (dgCss.match(/#page-sim-lab \.slr-round-pill,\s*\n?#page-sim-lab \.sl-exam-badge(?:,[^{]*)?\{[^}]*\}/) || [])[0] || '';
    var btn = (dgCss.match(/#page-sim-lab \.sl-topbar > \.btn(?:,[^{]*)?\{[^}]*\}/) || [])[0] || '';

    test('Header: .sl-strip is a flex row that may shrink (min-width:0)',
      /display:flex/.test(strip) && /min-width:0/.test(strip));
    test('Header: the LABEL is the shrink target — min-width:0 + ellipsis',
      /min-width:0/.test(label) && /text-overflow:ellipsis/.test(label) && /overflow:hidden/.test(label));
    test('Header: the pill and exam badge never shrink and never wrap',
      /flex:0 0 auto/.test(pill) && /white-space:nowrap/.test(pill));
    // .gnt-ghost carries width:100%; without width:auto here the Leave button's
    // flex base is the whole bar and it starves the strip.
    test('Header: the Leave button is pinned to content width (width:auto + flex:0 0 auto)',
      /flex:0 0 auto/.test(btn) && /width:auto/.test(btn));
    test('Header: below 480px the label and exam badge are dropped',
      /@media \(max-width:480px\)\{[\s\S]{0,240}\.sl-strip-label\{display:none\}[\s\S]{0,240}\.sl-exam-badge\{display:none\}/.test(dgCss));
  } catch (err) {
    test('Header: sim-lab header strip block (threw)', false);
    results.errors.push('Sim Lab header strip block threw: ' + err.message);
  }
})();
