// tests/uat/482-ios-quiz.js
// Scope: Lift A quiz-loop screens at phone width (features/ios-quiz.js): generating, question,
// answered, results, review answers. E2E source: feat/cert-ios-e2e mockups/cert-ios-quiz.html,
// cert-ios-results.html, cert-ios-review-answers.html.
const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Lift A quiz loop (phone) ──\x1b[0m');
  try {
    const ctx = vm.createContext({ Math, String, Array, Object, JSON });
    vm.runInContext((_fnBody(js, '_iosLoadingLine') || ''), ctx);
    const line = (o) => vm.runInContext('_iosLoadingLine(__o)', Object.assign(ctx, { __o: o }));
    test('Generating line: three topics read "A, B and C" with the E2E\'s three dots',
      line({ count: 10, diff: 'Exam Level', topics: ['Subnetting', 'VLANs', 'DNS'] }) === 'Generating 10 Exam level questions on Subnetting, VLANs and DNS...');
    test('Generating line: one topic', line({ count: 5, diff: 'Foundational', topics: ['Subnetting'] }) === 'Generating 5 Foundational questions on Subnetting...');
    test('Generating line: Mixed (no topics) reads "a mix of topics"', line({ count: 20, diff: 'Mixed', topics: [] }) === 'Generating 20 Mixed questions on a mix of topics...');
    test('Generating line: more than three topics name three and count the rest',
      line({ count: 15, diff: 'Exam Level', topics: ['A', 'B', 'C', 'D', 'E'] }) === 'Generating 15 Exam level questions on A, B, C and 2 more topics...');
    test('Generating line: catch-up uses its label', line({ count: 10, diff: 'Exam Level', topics: null, label: 'topics you haven’t seen lately' })
      === 'Generating 10 Exam level questions on topics you haven’t seen lately...');
  } catch (err) {
    test('Lift A quiz loop: generating block (threw)', false);
    results.errors.push('482 ios-quiz generating block threw: ' + err.message);
  }
})();
