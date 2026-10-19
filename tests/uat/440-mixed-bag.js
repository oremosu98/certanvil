// tests/uat/440-mixed-bag.js
// Scope: the Mixed card draws a true mixed bag (v8.179.0).
//
// Founder, 19 Oct: Mixed should "just select a random mix, not trying to fit in every
// exam domain". Plain Mixed quizzes now draw from a shuffled deck of every topic: no
// domain quotas, no repeats until the deck runs out. The Full Exam Simulator and the
// Marathon presets keep the exam-weighted draw; Catch-up keeps least-recently-seen.

const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Mixed bag ──\x1b[0m');
  try {
    const topics = { A: 'd1', B: 'd1', C: 'd1', D: 'd1', E: 'd2' };   // d1 heavy, d2 light
    const ctx = vm.createContext({ TOPIC_DOMAINS: topics, window: {} });
    vm.runInContext(_fnBody(js, '_sampleTopicsBag') || '', ctx);
    const first = vm.runInContext('_sampleTopicsBag(3)', ctx), second = vm.runInContext('_sampleTopicsBag(3)', ctx);
    const firstFive = first.concat(second).slice(0, 5);
    test('Bag: draws without repeats until every topic has come up, then reshuffles',
      first.length === 3 && second.length === 3 && new Set(firstFive).size === 5 && Object.keys(topics).every(t => firstFive.includes(t)));
    // No domain quotas: over many fresh 1-topic draws, the light domain shows up about as
    // often as any single topic (1 in 5), not forced into every quiz.
    let lightHits = 0;
    for (let i = 0; i < 400; i++) { ctx.window._mixedBagDeck = null; if (vm.runInContext('_sampleTopicsBag(1)', ctx)[0] === 'E') lightHits++; }
    test('Bag: every topic equally likely, no domain guaranteed a slot', lightHits > 40 && lightHits < 130);

    test('Wired: plain Mixed quizzes use the bag and start a fresh deck; Catch-up keeps least-recently-seen',
      /window\._mixedPickMode = _catchUp \? 'lrs' : 'bag';/.test(js) && /window\._mixedBagDeck = null;/.test(_fnBody(js, 'startQuiz') || ''));
    test('Wired: the generation prompt lists bag topics without domain blocks; Exam and Marathon still draw exam-weighted',
      /window\._mixedPickMode === 'bag' && typeof _sampleTopicsBag === 'function'/.test(js)
        && /const domainBlocks = bag \? 'Topics \(one question each\):\\n' \+ fmt\(_sampleTopicsBag\(n\)\)/.test(js)
        && /window\._mixedPickMode = 'random';\s*\/\/ v8\.146\.0: exam rehearsal/.test(js)
        && /window\._mixedPickMode = 'random';\s*\/\/ v8\.146\.0: Marathon/.test(js));
  } catch (err) {
    test('Mixed bag: block (threw)', false);
    results.errors.push('440 mixed-bag block threw: ' + err.message);
  }
})();
