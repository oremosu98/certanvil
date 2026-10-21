// tests/uat/493-ios-review.js
// Scope: Daily Review at phone width (Lift B1): plan line, docked answer buttons with short labels,
// done-screen tiles + retry. E2E source: feat/cert-ios-e2e mockups/cert-ios-review.html (77f94eef).
// Spec: docs/superpowers/specs/2026-10-21-ios-lift-b1-design.md. Desktop keeps its markup; phone hooks ship hidden.
const { _fnBody, fs, html, js, path, ROOT, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Lift B1 Daily Review (phone) ──\x1b[0m');
  try {
    const ctx = vm.createContext({ Math, String, isFinite, Number });
    vm.runInContext(_fnBody(js, '_srPlanLine') || '', ctx);
    const P = (o) => vm.runInContext('_srPlanLine(__p)', Object.assign(ctx, { __p: o }));
    test('Review plan line: "5 today · 18 in queue"', P({ todo: 5, due: 18 }) === '5 today · 18 in queue');
    test('Review plan line: nothing due is blank', P({ todo: 0, due: 0 }) === '' && P(null) === '');

    const card = _fnBody(js, '_renderSrCard') || '';
    test('Review card: answer buttons carry phone short labels (Knew it / Guessed / Next card)',
      card.includes('Knew it') && card.includes('Guessed') && card.includes('Next card') && card.includes('iv-short'));
    test('Review card: before an answer the phone dock shows "Answer to continue"', card.includes('Answer to continue') && card.includes('iv-wait'));
    test('Review card: progress reads "Card N of M" on phone', card.includes('Card </span>'));
    const end = _fnBody(js, '_srEndReview') || '';
    test('Review done: phone tiles for reviewed, got right and to retry', end.includes('sr-done-tiles') && end.includes('Got right') && end.includes('To retry'));
    test('Review done: retry shows only when something was missed', /data-missed/.test(end));
    test('Review: srRetryMissed is exported', js.includes('window.srRetryMissed') && !!_fnBody(js, 'srRetryMissed'));

    // final review fix 3: retries cost no credit, so a spent free cap must not refuse them
    const rctx = vm.createContext({ Object, Array, String, Math, Set, SR_FREE_DAILY_CAP: 5,
      _srIsFreeTier: () => true, _srFreeReviewedToday: () => 5, showToast: () => {}, showPage: () => {}, _renderSrCard: () => {},
      document: { getElementById: () => ({ hidden: false }) } });
    vm.runInContext('var _srSession = { results: [{ card: { qHash: "a" }, outcome: "wrong" }, { card: { qHash: "b" }, outcome: "correct-confident" }] };\n'
      + (_fnBody(js, 'srRetryMissed') || ''), rctx);
    vm.runInContext('srRetryMissed()', rctx);
    const rs = vm.runInContext('_srSession', rctx);
    test('Review retry: a free user with the cap spent can still retry missed cards (they cost no credit)',
      rs.cards && rs.cards.length === 1 && rs.cards[0].qHash === 'a' && rs.cards[0]._retry === true && rs.retryPass === true);
    test('Review retry: a retry pass tallies answers for the recap without rescheduling',
      /if \(_srSession\.retryPass\)/.test(_fnBody(js, 'srMarkConfidence') || ''));
    test('index.html: phone header reads "Daily Review" with streak, theme and plan line hooks',
      /class="ed-pagehead-display iv-title" hidden>Daily Review</.test(html) && html.includes('id="iv-streak"') && html.includes('id="sr-plan-line"'));
    test('index.html: the done screen has the seal, "Review done" and the retry button',
      html.includes('class="iv-seal"') && /class="iv-done-t" hidden>Review done</.test(html) && html.includes('onclick="srRetryMissed()"'));
    const ios = fs.readFileSync(path.join(ROOT, 'lift-ios.css'), 'utf8');
    test('lift-ios.css docks the answer buttons and hides the mono meta row on phone',
      ios.includes('#page-sr-review .sr-confidence-row') && /#page-sr-review \.sr-card-meta\s*\{\s*display:\s*none\s*!important/.test(ios));
  } catch (err) {
    test('Lift B1 Daily Review: block (threw)', false);
    results.errors.push('493 ios-review block threw: ' + err.message);
  }
})();
