// Account deletion (29 Oct): the database half (supabase/migrations/20261029_account_deletion.sql) runs in PGlite.
// tests/deletion-db.test.mjs loads the real schema, the real migrations and the deletion migration, unchanged.
const { path, ROOT, test, results } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Account deletion ──\x1b[0m');
  try {
    const { spawnSync } = require('child_process');
    const rv = spawnSync(process.execPath, ['--experimental-detect-module', path.join(ROOT, 'tests/deletion-db.test.mjs')], { encoding: 'utf8', timeout: 120000 });
    test('account deletion database suite passes (' + ((rv.stdout || '').match(/deletion-db: (\d+\/\d+) passed/) || [, 'no result'])[1] + ')',
      rv.status === 0 && /deletion-db: (\d+)\/\1 passed/.test(rv.stdout || ''));
    if (rv.status !== 0) results.errors.push('deletion-db: ' + ((rv.stdout || '') + (rv.stderr || '')).split('\n').filter((l) => /FAIL|Error|error/.test(l)).slice(0, 5).join(' | '));
  } catch (err) {
    test('Account deletion: block (threw)', false);
    results.errors.push('512 account-deletion block threw: ' + err.message);
  }
})();

// Privacy v1.2 (29 Oct): Self-delete describes the 7-day erase, not Stripe or browser cache.
(function () {
  const pv = require('fs').readFileSync(path.join(ROOT, 'landing/privacy.html'), 'utf8');
  const self = (pv.match(/<p><strong>Self-delete<\/strong>.*?<\/p>/s) || [''])[0];
  test('privacy.html is v1.2 and Self-delete no longer says Stripe or browser cache',
    /· v1\.2/.test(pv) && /<strong>v1\.2<\/strong> \(29 October 2026\)/.test(pv) && /Signing back in within 7 days cancels it/.test(self) && !/Stripe|browser cache/i.test(self));
})();
