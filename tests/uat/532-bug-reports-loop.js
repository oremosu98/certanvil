// Bug report loop (31 Oct): the database half (supabase/migrations/20261031_bug_reports_loop.sql) runs in PGlite.
// tests/bug-reports-db.test.mjs loads the real schema, the real migrations and the loop migration, unchanged.
const { path, ROOT, test, results } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Bug report loop ──\x1b[0m');
  try {
    const { spawnSync } = require('child_process');
    const rv = spawnSync(process.execPath, ['--experimental-detect-module', path.join(ROOT, 'tests/bug-reports-db.test.mjs')], { encoding: 'utf8', timeout: 120000 });
    test('bug reports database suite passes (' + ((rv.stdout || '').match(/bug-reports-db: (\d+\/\d+) passed/) || [, 'no result'])[1] + ')',
      rv.status === 0 && /bug-reports-db: (\d+)\/\1 passed/.test(rv.stdout || ''));
    if (rv.status !== 0) results.errors.push('bug-reports-db: ' + ((rv.stdout || '') + (rv.stderr || '')).split('\n').filter((l) => /FAIL|Error|error/.test(l)).slice(0, 5).join(' | '));
  } catch (err) {
    test('Bug report loop: block (threw)', false);
    results.errors.push('532 bug-reports-loop block threw: ' + err.message);
  }
})();
