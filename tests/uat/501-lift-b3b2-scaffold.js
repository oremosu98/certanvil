// Lift B3b2 (23 Oct): Sim Lab Exam mode on phones. The exam scope class, the pace fixes that apply
// on every width (real budget in the target, "Out of time" when the clock ran out), and the
// sim-lab.js hooks that wire the phone chrome.
const { _fnBody, fs, path, ROOT, results, test, vm } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift B3b2 scaffold (Sim Lab Exam) ──\x1b[0m');
  try {
    const sl = fs.readFileSync(path.join(ROOT, 'features', 'sim-lab.js'), 'utf8');
    test('_slSetPractice toggles isl-exam opposite isl-practice',
      /isl-practice/.test(_fnBody(sl, '_slSetPractice') || '') && /isl-exam/.test(_fnBody(sl, '_slSetPractice') || ''));

    const ctx = vm.createContext({ Math, Number });
    vm.runInContext(_fnBody(sl, '_slComputePace') || '', ctx);
    const onTime = vm.runInContext('_slComputePace([], [60000, 60000], 180000, 120000, [90000, 90000])', ctx);
    test('pace returns the budget it was given, on pace with time to spare',
      onTime.budgetMs === 180000 && onTime.onPace === true && onTime.deltaMs === 60000 && onTime.timeUp === false);
    const up = vm.runInContext('_slComputePace([], [90000, 90000], 180000, 180000, [90000, 90000], true)', ctx);
    test('a time-up exam is not on pace, whatever the delta', up.onPace === false && up.timeUp === true && up.budgetMs === 180000);
    const over = vm.runInContext('_slComputePace([], [100000], 60000, 90000, [60000])', ctx);
    test('over budget without time-up is still not on pace', over.onPace === false && over.deltaMs === -30000);

    test('_slRenderExamResult passes _slSession.timeUp to the pace math',
      /_slComputePace\([^;]*_slSession\.timeUp\)/.test(_fnBody(sl, '_slRenderExamResult') || ''));
    test('_slRenderPaceBlock reads "Out of time" when the clock ran out',
      /pace\.timeUp[^;]*'Out of time'/.test(_fnBody(sl, '_slRenderPaceBlock') || ''));

    // An untouched configure step saves {slots:{}}: it is not an answer (it read as one, so the End
    // dialog said "3 answered, 0 skipped" for an exam nobody touched).
    const actx = vm.createContext({ Object, Array, String });
    vm.runInContext(_fnBody(sl, '_slIsAnswered') || '', actx);
    const ans = (a) => { actx._slSession = { answers: [a] }; return vm.runInContext('_slIsAnswered(0)', actx); };
    test('_slIsAnswered: empty nested slots are not an answer; a filled slot, a pick or an order is',
      ans({ d1: { slots: {} }, f1: { slots: {} } }) === false && ans(null) === false && ans({ a: '' }) === false
      && ans({ d1: { slots: { s1: 'VLAN 20' } } }) === true && ans({ p: 'B' }) === true && ans({ o: [2, 0, 1] }) === true);
    const er = _fnBody(sl, '_slRenderExamResult') || '';
    test('exam results: phones get the verdict with mode exam; weak spots, drill stats and milestones run on both widths',
      /verdictHtml\(\{\s*mode: 'exam'/.test(er) && er.lastIndexOf('_slRecordWeakSpots') > er.lastIndexOf("'Back to Practice'")
      && er.lastIndexOf('bumpDrillStat') > er.lastIndexOf("'Back to Practice'"));
  } catch (err) {
    test('Lift B3b2 scaffold: block (threw)', false);
    results.errors.push('501 lift-b3b2-scaffold block threw: ' + err.message);
  }
})();
