// tests/uat/460-past-exam-date.js
// Scope: once the exam date has passed, nothing counts down into negative days (v8.181.0).
// Founder, 19 Oct (3 days after the 16 Oct exam): the readiness card read "-3 days to your exam".
const { _fnBody, js, results, test } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Past exam date ──\x1b[0m');
  try {
    const v2 = _fnBody(js, 'renderReadinessCardV2') || '', v1 = _fnBody(js, 'renderReadinessCard') || '';
    test('Readiness trajectory line only shows while the exam is today or ahead (both cards)',
      /r\.daysToExam !== undefined && r\.daysToExam >= 0\)/.test(v2) && /data\.daysToExam !== undefined && data\.daysToExam >= 0\)/.test(v1));
    // Desktop catch-up Task 6 (founder 31 Oct): a past date now reads "N days ago", as on the phone, never a negative count
    test('Analytics readiness tile never shows a negative day count: a past date reads "N days ago", no date "—"',
      /dte < 0\) \? -dte : 0/.test(js) && /\$\{ago\} day\$\{ago === 1 \? '' : 's'\} ago/.test(js) && /dte != null && dte >= 0 \? dte : '—'/.test(js));
  } catch (err) {
    test('Past exam date: block (threw)', false);
    results.errors.push('460 past-exam-date block threw: ' + err.message);
  }
})();
