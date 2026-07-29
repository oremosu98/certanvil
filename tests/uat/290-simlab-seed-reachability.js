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

const { _fnBody, js, results, test, vm } = require('./_context');

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
