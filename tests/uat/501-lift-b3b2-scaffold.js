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
  } catch (err) {
    test('Lift B3b2 scaffold: block (threw)', false);
    results.errors.push('501 lift-b3b2-scaffold block threw: ' + err.message);
  }
})();
