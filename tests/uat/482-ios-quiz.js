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
    // ── Results model ──
    vm.runInContext((_fnBody(js, '_iosResultsModel') || ''), ctx);
    const L = (q, ok, diff, topic) => ({ q: { question: q, difficulty: diff, topic }, isRight: ok });
    const log = [L('DHCP stem', false, 'Foundational', 'DNS & DHCP'), L('OSPF stem', false, 'Exam Level', 'OSPF'), L('Media stem', true, 'Exam Level', 'Cabling'),
      L('SD-WAN stem', true, 'Foundational', 'SD-WAN'), L('Proxy stem', false, 'Exam Level', 'Firewalls')];
    const R = (o) => vm.runInContext('_iosResultsModel(__o)', Object.assign(ctx, { __o: o }));
    const base = { score: 2, total: 5, pct: 40, scaled: 420, pass: 720, max: 900, vendorCode: 'CompTIA N10-009', headlineHtml: 'More <em>work needed.</em>',
      sub: 'Rewatch the Messer videos on this topic.', elapsed: '1m 13s', bestStreak: 2, log,
      topicDomains: { 'DNS & DHCP': 'concepts', 'OSPF': 'implementation' } };
    const r = R(base);
    test('Results: headline lead/em split, sub, "Scaled score - CompTIA N10-009", 420 / 900',
      r.headline.lead === 'More' && r.headline.em === 'work needed.' && r.sub === 'Rewatch the Messer videos on this topic.'
      && r.scaledLabel === 'Scaled score - CompTIA N10-009' && r.scaled === 420 && r.max === 900);
    test('Results: below pass reads "300 below pass, keep going" (down); cleared reads "Pass mark cleared" (up)',
      r.verdict.text === '300 below pass, keep going' && r.verdict.dir === 'down'
      && R(Object.assign({}, base, { scaled: 760 })).verdict.text === 'Pass mark cleared' && R(Object.assign({}, base, { scaled: 760 })).verdict.dir === 'up');
    test('Results: stat rows Correct / Wrong / Raw / Time / Best streak',
      JSON.stringify(r.rows.map(x => [x.k, x.v])) === JSON.stringify([['Correct', '2'], ['Wrong', '3'], ['Raw', '40%'], ['Time', '1m 13s'], ['Best streak', '2']]));
    test('Results: difficulty split cells "1/2 Basic" and "1/3 Exam level"',
      JSON.stringify(r.split) === JSON.stringify([{ num: '1/2', label: 'Basic' }, { num: '1/3', label: 'Exam level' }]));
    test('Results: one difficulty only → no split cells', R(Object.assign({}, base, { log: log.filter(x => x.q.difficulty === 'Exam Level') })).split.length === 0);
    test('Results: review rows numbered 01.., "Topic - Domain" meta, Correct/Wrong verdicts',
      r.review[0].n === '01' && r.review[0].meta === 'DNS & DHCP - Concepts' && r.review[0].verdict === 'Wrong' && r.review[2].verdict === 'Correct' && r.review[2].meta === 'Cabling');
    test('Results: mistakes = wrong answers this session; em-dash in a sub becomes a comma',
      r.mistakes === 3 && R(Object.assign({}, base, { sub: 'A few gaps \u2014 keep at it.' })).sub === 'A few gaps, keep at it.');
  } catch (err) {
    test('Lift A quiz loop: generating block (threw)', false);
    results.errors.push('482 ios-quiz generating block threw: ' + err.message);
  }
})();
