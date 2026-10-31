// Bug report submit (31 Oct): reports go through the submit_bug_report RPC, keep the writer's id as captured at
// write time, and return the report number. The real features/reports.js runs in tests/uat/_report-submit-async.js.
const { path, test, results } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Report submit via RPC ──\x1b[0m');
  try {
    const cp = require('child_process');
    const out = JSON.parse(cp.execFileSync(process.execPath, [path.join(__dirname, '_report-submit-async.js')], { encoding: 'utf8' }).trim().split('\n').pop());
    out.forEach(([name, ok]) => test(name, ok));
  } catch (err) {
    test('Report submit: block (threw)', false);
    results.errors.push('533 report-submit block threw: ' + err.message);
  }
})();
