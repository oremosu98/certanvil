// Admin data layer (31 Oct): pure grouping helpers and never-throwing fetchers behind the Admin screen.
// The real features/admin-data.js runs in tests/uat/_admin-data-async.js against a stubbed client.
const { path, test, results } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Admin data module ──\x1b[0m');
  try {
    const cp = require('child_process');
    const out = JSON.parse(cp.execFileSync(process.execPath, [path.join(__dirname, '_admin-data-async.js')], { encoding: 'utf8' }).trim().split('\n').pop());
    out.forEach(([name, ok]) => test(name, ok));
  } catch (err) {
    test('Admin data: block (threw)', false);
    results.errors.push('535 admin-data block threw: ' + err.message);
  }
})();
