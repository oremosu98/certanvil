// tests/uat/390-readiness-trajectory.js
// Scope: the Home readiness card's trajectory line (v8.173.0).
//
// Founder, 13 Oct, on "3 days to exam · already confidently above pass." in a
// green box: "this here needs a cleaner look.... its a little corny". It is now a
// plain line (no tinted box, no mono) with a status dot, and the copy says what
// the state means: the LOW end of the predicted range clears the pass mark.

const { _fnBody, dgCss, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Readiness trajectory line ──\x1b[0m');
  try {
    const ctx = vm.createContext({});
    vm.runInContext(_fnBody(js, '_trajDays') || '', ctx);
    const d = n => vm.runInContext('_trajDays(' + n + ')', ctx);
    test('Trajectory: the lead reads "N days to your exam", with 1 day and exam day handled',
      d(3) === '<strong>3 days</strong> to your exam' && d(1) === '<strong>1 day</strong> to your exam' && d(0) === '<strong>Exam day</strong>');

    const v2 = _fnBody(js, 'renderReadinessCardV2') || '';
    test('Trajectory: plain wording on the Home card (no "confidently above pass")',
      /even your low estimate clears the pass mark/.test(v2) && /your low estimate needs <strong>\+'/.test(v2)
        && !/confidently above pass|for confident pass/.test(js));

    // Block, not flex: as a flex row each <strong> and text node became its own item and the
    // sentence wrapped into four stacked pieces. The dot sits inline at the start of the text.
    test('Trajectory CSS: a plain Inter line with no box, and an inline status dot in the brand pass/warn tokens',
      /#page-setup \.rc-v2-trajectory\{display:block;[^}]*background:none!important;border:0!important;[^}]*font:500 12\.5px\/1\.5 Inter,sans-serif!important;/.test(dgCss)
        && /#page-setup \.rc-v2-trajectory::before\{content:"";display:inline-block;[^}]*vertical-align:middle;/.test(dgCss)
        && /#page-setup \.rc-v2-trajectory\.good::before\{background:var\(--pass\);\}/.test(dgCss)
        && /#page-setup \.rc-v2-trajectory\.mid::before,html\[data-theme\] body #page-setup \.rc-v2-trajectory\.warn::before\{background:var\(--warn\);\}/.test(dgCss));
    test('Trajectory CSS: the CLS height reservation is kept (now invisible without a box)',
      /#page-setup \.readiness-traj,#page-setup \.rc-v2-trajectory\{min-height:60px;\}/.test(dgCss));
  } catch (err) {
    test('Trajectory: block (threw)', false);
    results.errors.push('390 readiness-trajectory block threw: ' + err.message);
  }
})();
