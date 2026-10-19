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
    test('Analytics readiness tile shows "—" instead of a negative day count',
      /r\.daysToExam != null && r\.daysToExam >= 0 \? r\.daysToExam : '—'/.test(js));
  } catch (err) {
    test('Past exam date: block (threw)', false);
    results.errors.push('460 past-exam-date block threw: ' + err.message);
  }
})();
