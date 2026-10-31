// tests/uat/310-cloud-sync-merge-first.js
// Scope: cloud sync never loses a student's local data (v8.151.0).
//
// Why this module exists: founder SQL on 2026-10-11 showed profiles.metadata
// and quiz_history empty for EVERY user. cloud-store.js read the session from
// sb.auth._currentSession / sb.auth.session(), which supabase-js v2 does not
// have, so isSignedIn() was always false and nothing ever synced. Fixing only
// that would have been catastrophic: hydrate() replaced local data with the
// cloud copy on every page load and token refresh, so the first working sync
// would have written an EMPTY cloud over real history, and sign-out cleared
// local data unconditionally. tests/cloud-sync-sim.js drives the real
// cloud-store.js against an in-memory Supabase; run against the pre-fix file
// (with a working accessor) it reports localUntouched:false, historyUploaded:
// false, localWins:false and duplicate rows, i.e. exactly the data loss.

const { authStateJs, test, vm, path } = require('./_context');

(function () {
  let r = {};
  try {
    const { execFileSync } = require('child_process');
    r = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, '..', 'cloud-sync-sim.js')], { encoding: 'utf8', timeout: 30000 }));
  } catch (e) { r = { crashed: String(e) }; }
  const s1 = r.s1 || {}, s2 = r.s2 || {}, s3 = r.s3 || {}, s4 = r.s4 || {}, s5 = r.s5 || {};

  test('v8.151.0 sync: first sync with an EMPTY cloud leaves local history, review cards, mistakes and exam date untouched',
    !r.crashed && s1.localUntouched === true);
  test('v8.151.0 sync: nothing uploads before the first merge (a pre-hydrate write cannot clobber the cloud)',
    s1.preHydrateNoUpload === true);
  test('v8.151.0 sync: after the merge, local data goes UP (review cards per cert, mistakes, streak, exam date, history)',
    s1.cloudGotSr && s1.cloudGotBank && s1.cloudGotStreak && s1.cloudGotExamDate && s1.historyUploaded === true);
  test('v8.151.0 sync: history rows are stored at the quiz time and never duplicated by re-syncs or token-refresh hydrates',
    s1.createdAtIsQuizTime && s2.noDuplicates && s2.secondHydrateSafe);
  test('v8.151.0 sync: a fresh device is filled from the cloud without re-uploading duplicates',
    s3.filled && s3.cloudNotDuplicated);
  test('v8.151.0 sync: when both sides have data, this device wins per key, history is a union, cloud-only keys survive',
    s4.localWins && s4.historyUnion && s4.cloudOnlyKeysKept && s4.cloudHistoryComplete);
  test('v8.151.0 sync: if the cloud profile cannot be read, the profile is not written blind',
    s5.noBlindWrite === true);
  test('v8.151.0 sync: local data counts as safe to clear only after a successful sync',
    s1.notSafeBeforeSync && s1.safeAfterSync && s5.notSafeAfterError);

  const s6 = r.s6 || {};
  test('v8.155.0 sync: a device only pulls its own cert\'s history (no Network+ rows on the Security+ site)',
    s6.onlyThisCert === true && s6.noReupload === true);

  const s7a = r.s7a || {}, s7b = r.s7b || {}, s7c = r.s7c || {}, s7d = r.s7d || {};
  test('v8.198.1 sync: flushNow() waits for a flush already in flight (the delete flow relies on it)',
    s7a.waitsForInflight === true);
  test('v8.198.1 sync: a flush that read the profile before request_account_deletion cannot erase the deletion mark',
    s7b.markKept === true && s7b.dataStillSynced === true);
  test('v8.198.1 sync: a flush that read the profile before clear_deletion_notice cannot bring the notice back',
    s7c.noticeNotResurrected === true);
  test('v8.198.1 sync: an ordinary flush never adds, removes or changes deletion_requested_at / deletion_cancelled_at',
    s7d.unchanged === true);

  const s8a = r.s8a || {}, s8b = r.s8b || {};
  test('v8.198.1 sync: a flush refused by the compare-and-set retries once by itself and then syncs',
    s8a.retried === true && s8a.synced === true);
  test('v8.198.1 sync: a compare-and-set miss shows as pending, not an error, and sends no telemetry',
    s8a.pendingNotError === true && s8a.noTelemetry === true);
  test('v8.198.1 sync: a conflict that never clears stops after two automatic retries',
    s8b.capped === true);

  // Persona bundle: per-cert maps (readiness_snapshots, exam_dates, exam_outcomes) merge per cert both ways.
  const s9a = r.s9a || {}, s9b = r.s9b || {}, s9c = r.s9c || {}, s9d = r.s9d || {};
  test('persona sync: per-cert maps survive a sibling flush (exam dates and readiness snapshots of both certs kept)',
    s9a.bothKept === true);
  test('persona sync: hydrate merges sibling certs into the local map, this device keeps its own entries (a cleared date too)',
    s9b.siblingsIn === true && s9b.localWins === true && s9b.cloudAfter === true);
  test('persona sync: once the cloud has exam_dates, profiles.exam_date never seeds another cert\'s local date',
    s9c.noLeak === true);
  test('persona sync: a legacy single exam date is adopted into exam_dates for the current cert',
    s9d.adopted === true);

  // v8.198.1: offline, the delete flows clear the session with supabase-js's private _removeSession(). A supabase-js
  // upgrade that renames it would quietly drop them to the storage fallback, so pin it in both vendored bundles.
  test('v8.198.1 deletion: the vendored supabase-js (app and website) still defines auth._removeSession()', (() => {
    try {
      const fs = require('fs');
      return ['lib/supabase-umd.min.js', 'landing/lib/supabase-umd.min.js'].every((f) =>
        /async _removeSession\(\)\{/.test(fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8')));
    } catch (e) { return false; }
  })());

  test('v8.151.0 auth-state: sign-out clears local data only when cloud-store says it is backed up', (() => {
    try {
      const m = authStateJs.match(/function\s+_clearLocalIfSafe\(cs\)\s*\{[\s\S]*?\n\s\s\}/);
      if (!m) return false;
      const run = (safe) => {
        let cleared = 0, sess = 'x';
        const cs = { isSafeToClear: () => safe, clearLocalCache: () => { cleared++; }, setSession: (s) => { sess = s; } };
        const ctx = { console: { warn() {} } };
        vm.createContext(ctx);
        vm.runInContext(m[0] + '; _clearLocalIfSafe(cs);', Object.assign(ctx, { cs }));
        return { cleared, sess };
      };
      const unsafe = run(false), safe = run(true);
      return unsafe.cleared === 0 && safe.cleared === 1 && unsafe.sess === null && safe.sess === null
        && /_clearLocalIfSafe\(cs\);\s*\n\s*renderAnonymous\(\);/.test(authStateJs)
        && /_csS\.setSession\(session\)/.test(authStateJs)
        && !/if \(cs\) cs\.clearLocalCache\(\);/.test(authStateJs);
    } catch (e) { return false; }
  })());
})();
