// tests/uat/380-pickup-quiz.js
// Scope: the Home Momentum tile's "Pick up" quiz button (v8.171.0).
//
// Founder, 13 Oct: "there should be a button that takes me right to a quiz based
// on what the 'todays momentum' says i should pick up... a 10 question mixed
// difficulty for that topic". The line reads "Pick up: <topic> · ~66% accuracy."
// from buildSessionPlan(1); the button starts a quiz on exactly that topic.

const { _fnBody, dgCss, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Momentum "Pick up" quiz ──\x1b[0m');
  try {
    const mo = _fnBody(js, 'renderBentoMomentum') || '';
    test('Pick up: the button is added only when the line names a plan topic (not the done-today / start-fresh fallbacks)',
      /pickTopic = plan\[0\]\.topic;/.test(mo) && /if \(pickTopic\) \{[\s\S]{0,200}className = 'mo-pick-go'/.test(mo)
        && mo.indexOf('pickTopic = plan[0].topic') < mo.indexOf("if (!ctx) ctx = done > 0"));
    test('Pick up: the button says what it does and is bound in JS (no inline handler)',
      /Practise it · 10 questions/.test(mo) && /aria-label', 'Start a 10-question mixed-difficulty quiz on ' \+ pickTopic/.test(mo)
        && /addEventListener\('click', \(\) => _startPickUpQuiz\(pickTopic\)\)/.test(mo));

    // Run the real starter in a sandbox.
    const body = _fnBody(js, '_startPickUpQuiz') || '';
    const ctx = vm.createContext({ topic: null, diff: null, qCount: null, started: 0, synced: [],
      document: { querySelectorAll: () => [] }, syncChipAriaPressed: (g) => ctx.synced.push(g) });
    vm.runInContext('var startQuiz = function () { started++; };\n' + body, ctx);
    vm.runInContext('_startPickUpQuiz("Security Governance")', ctx);
    test('Pick up: starts a 10-question Mixed-difficulty quiz on exactly the named topic, with the setup chips synced',
      ctx.topic === 'Security Governance' && ctx.diff === 'Mixed' && ctx.qCount === 10 && ctx.started === 1
        && ['#topic-group', '#diff-group', '#count-group'].every(g => ctx.synced.includes(g)));
    vm.runInContext('_startPickUpQuiz(null)', ctx);
    test('Pick up: does nothing without a topic', ctx.started === 1);

    test('Pick up CSS: the same text-link look as the custom quiz tile\'s "Configure" (bronze text + arrow, no box), hover gated, 44px on touch, reduced-motion safe',
      /#page-setup \.mo-resume \.mo-pick-go\{display:flex;align-items:center;gap:8px;margin-top:10px;padding:0;background:none;border:0;font:600 12px Inter,sans-serif;color:var\(--accent\);/.test(dgCss)
        && /#page-setup \.cu-foot\{[^}]*gap:8px;font:600 12px Inter,sans-serif;color:var\(--accent\)\}/.test(dgCss)
        && /@media \(hover:hover\) and \(pointer:fine\)\{#page-setup \.mo-resume \.mo-pick-go:hover \.mo-pick-arrow\{transform:translateX\(3px\);\}\}/.test(dgCss)
        && /@media \(hover:none\) and \(pointer:coarse\)\{#page-setup \.mo-resume \.mo-pick-go\{min-height:44px;\}\}/.test(dgCss)
        && /@media \(prefers-reduced-motion:reduce\)\{#page-setup \.mo-resume \.mo-pick-arrow/.test(dgCss));
    test('Pick up: uses the same arrow icon as "Configure"', /class="mo-pick-arrow"[^>]*><path d="M5 12h14M13 6l6 6-6 6"\/><\/svg>/.test(mo));
  } catch (err) {
    test('Pick up: block (threw)', false);
    results.errors.push('380 pickup-quiz block threw: ' + err.message);
  }
})();
