// tests/uat/360-judgement-cases.js
// Scope: the writer prompt asks for judgement-case questions (v8.165.0).
//
// Why this module exists: founder, 2026-10-11, aiming for 900 on SY0-701.
// Generated Exam Level questions were mostly recognition ("which malware type
// is this?"): in the 8 Oct writer run only 13-24% paired a setup line with a
// best/first question, and real cases (setting + constraint) were rare. The
// scenario block (now _scenarioPromptBlock in quiz-engine.js) asks for about
// 4 in 10 Exam Level and Hard MCQs as short cases. Gate before shipping:
// scripts/generator-spot.js --compare.

const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Judgement-case questions ──\x1b[0m');
  try {
    var body = _fnBody(js, '_scenarioPromptBlock') || '';
    var ctx = vm.createContext({});
    vm.runInContext('function _scenarioPromptBlock' + body.slice(body.indexOf('(')), ctx);
    var block = vm.runInContext('_scenarioPromptBlock("SY0-701", "CompTIA")', ctx);

    test('Judgement cases: the scenario block is built by _scenarioPromptBlock and keeps the v4.56.0 rules',
      /SCENARIO CONTEXT FIELD/.test(block) && /scenario describes the ENVIRONMENT/.test(block) && /telegraphs the answer/.test(block)
        && /DO NOT include scenario on: pure recall/.test(block));
    test('Judgement cases: about 4 in 10 Exam Level and Hard MCQs, never Foundational or multi-select',
      /about 4 in 10 of the Exam Level and Hard MCQs/.test(block) && /Foundational questions and multi-select stay as they are/.test(block));
    test('Judgement cases: who, where and one or two constraints, then BEST / MOST / FIRST in the vendor\'s style',
      /names WHO/.test(block) && /and WHERE/.test(block) && /ONE or TWO concrete constraints/.test(block)
        && /BEST, MOST appropriate, MOST likely or FIRST/.test(block) && /in CompTIA style/.test(block));
    test('Judgement cases: two sound options, the constraints decide, the explanation names the runner-up',
      /At least TWO options must be sound practice/.test(block) && /exactly ONE of them the best answer/.test(block)
        && /explanation must name the runner-up/.test(block) && /never from unstated context/.test(block));
    test('Judgement cases: under about 60 words, roles not names, and the examples don\'t set the mix',
      /under about 60 words/.test(block) && /never people's names or brand names/.test(block) && /show format and accuracy, not this mix/.test(block));
    test('Judgement cases: the cert code and vendor are substituted (no Network+ leak on other certs)',
      /real SY0-701 exam framing/.test(block) && !/N10-009/.test(block) && !/\$\{/.test(block));

    var fb = _fnBody(js, '_fetchQuestionsBatch') || '';
    test('Judgement cases: the writer prompt takes its scenario block from _scenarioPromptBlock and still drops it on retry',
      /const scenarioInstructions = \(typeof _scenarioPromptBlock === 'function'\) \? _scenarioPromptBlock\(CERT_CODE, _examVendor\) : ''/.test(fb)
        && /\$\{includeScenario \? scenarioInstructions : ''\}/.test(fb) && /buildPrompt\(false\)/.test(fb));
    test('Judgement cases: the old "~30-40% of Exam Level / Hard" scenario quota is gone from the writer prompt',
      !/30-40%/.test(fb) && !/30-40%/.test(block) && /the setup of a judgement case/.test(fb));

    // v8.169.0: giveaway conditions (founder, 13 Oct: "(Choose TWO) Which TWO techniques make stored
    // data unreadable to anyone who ... does not hold the required key or token vault?" named both
    // answers' ingredients, and masking also fit the wording). Writer and checker both learn the pattern.
    test('Giveaway conditions: the writer must not name an ingredient only the correct options have',
      /never name the ingredient that only the correct options have/.test(fb) && /check that no distractor also satisfies the stem as worded/.test(fb));
    test('Giveaway conditions: the multi-select rules carry the same point',
      /No giveaway conditions: the stem must not name a key, vault, tool or feature that only the correct options share/.test(fb));
    var vb = _fnBody(js, 'aiValidateQuestions') || '';
    test('Giveaway conditions: the checker rejects a stem that names the ingredient only the answers have (check 9)',
      /9\. ANSWER ECHO:[^\n]*names the ingredient or condition that only the correct options have/.test(vb));
  } catch (err) {
    test('Judgement cases: block (threw)', false);
    results.errors.push('360 judgement-cases block threw: ' + err.message);
  }
})();
