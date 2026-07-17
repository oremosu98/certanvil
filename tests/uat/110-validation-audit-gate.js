// tests/uat/110-validation-audit-gate.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Regression gate that shells out to tests/validation-audit.js and asserts a clean exit

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// --- Validation audit regression gate ---
// The programmatic validator has a known catch-rate floor (60%) and a
// zero-tolerance false-positive rate. A refactor to validateQuestions()
// must not silently regress either. Runs the audit script as a subprocess
// so any exit 1 from it fails the UAT run.
try {
  const { execSync } = require('child_process');
  execSync('node tests/validation-audit.js', { cwd: ROOT, stdio: 'pipe' });
  test('Validation audit: regression gate', true);
} catch (err) {
  test('Validation audit: regression gate', false);
  results.errors.push('validation-audit.js exited non-zero — run `node tests/validation-audit.js` for details');
}

