// tests/uat/494-lift-b2-scaffold.js
// Scope: Lift B2 phone scaffold. #ios-exam-results lives inside #page-exam-results and, once rendered,
// hides the desktop results and becomes a fixed one-viewport screen. Spec: docs/superpowers/specs/2026-10-21-ios-lift-b2-design.md
const { fs, html, path, ROOT, results, test } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift B2 scaffold (exam, results) ──\x1b[0m');
  try {
    const ios = fs.readFileSync(path.join(ROOT, 'lift-ios.css'), 'utf8');
    test('#ios-exam-results is the first child of #page-exam-results, ios-only iq-screen',
      /<div id="page-exam-results" class="page">\s*<section id="ios-exam-results" class="ios-only iq-screen" aria-label="Exam results"><\/section>/.test(html));
    test('features/ios-exam.js loads deferred after ios-analytics.js',
      /<script defer src="features\/ios-analytics\.js"><\/script>\s*<script defer src="features\/ios-exam\.js"><\/script>/.test(html));
    test('lift-ios.css hides the desktop results beside a rendered #ios-exam-results',
      /#page-exam-results:has\(#ios-exam-results:not\(:empty\)\) > :not\(#ios-exam-results\)\s*\{\s*display:\s*none\s*!important;?\s*\}/.test(ios));
    test('lift-ios.css makes the results a fixed one-viewport screen with the page animation off',
      ios.includes('#page-exam-results.active #ios-exam-results:not(:empty) { position: fixed; inset: 0;') &&
      ios.includes('#page-exam-results.active:has(#ios-exam-results:not(:empty)) { animation: none !important; transform: none !important; }'));
    test('the submit dialog eyebrow no longer prints a literal \\u00b7', !html.includes('Exam \\u00b7 end of session'));
    // Task 4: phone hooks on the exam page, hidden on desktop
    test('exam top bar carries hidden .ix-cn / .ix-cs counter spans', /<span class="ix-cn" hidden><\/span><span class="ix-cs" hidden><\/span>/.test(html));
    test('End reads "End Exam" on desktop and "End" on phones', html.includes('<span class="ix-long">End Exam</span><span class="ix-short" hidden>End</span>'));
    test('the dock Flag sits before Next, hidden on desktop', /<button type="button" class="ix-flag" hidden aria-pressed="false">Flag<\/button>\s*<button class="btn btn-primary" id="exam-next-btn"/.test(html));
    test('the question card has a hidden Flagged chip', html.includes('<span class="ix-flagged" hidden>Flagged</span>'));
    test('lift-ios.css makes #page-exam one fixed viewport with the page animation off',
      ios.includes('html[data-theme] body #page-exam.active { position: fixed !important; inset: 0 !important;') && /#page-exam\.active \{[^}]*animation: none !important; transform: none !important;/.test(ios));
    test('lift-ios.css hides the navigator, kbd hints and top-bar Flag on phones',
      ios.includes('#page-exam .qnav-toggle, html[data-theme] body #page-exam .qnav-grid, html[data-theme] body #page-exam .quiz-kbd-hints, html[data-theme] body #page-exam #exam-flag-btn { display: none !important; }'));
    // Task 5: End dialog grid + in-app sheets (phones); desktop keeps confirm()
    const ex = fs.readFileSync(path.join(ROOT, 'features/exam.js'), 'utf8');
    test('features/exam.js exports examJumpTo and examReviewFirst', /window\.examJumpTo\s*=\s*examJumpTo;/.test(ex) && /window\.examReviewFirst\s*=\s*examReviewFirst;/.test(ex));
    test('features/exam.js has the _examSheet bottom sheet, used by leave and abandon on phones',
      /function _examSheet\(o\)/.test(ex) && /_examSheet\(\{ title: 'Leave the exam\?'/.test(ex) && /_examSheet\(\{ title: 'Abandon this exam\?'/.test(ex));
    test('desktop leave and abandon still use confirm()', /confirm\('Leave the exam\? The clock keeps running/.test(ex) && /confirm\('Abandon this exam and return to the menu\?/.test(ex));
    test('index.html has the sheet, its scrim and the jump grid, all hidden by default',
      html.includes('<div id="exam-sheet-scrim" class="ix-scrim" hidden></div>') && /<div id="exam-sheet" class="ix-sheet" role="dialog" aria-modal="true" aria-labelledby="exam-sheet-title" hidden>/.test(html) && html.includes('<div class="ix-jump" hidden>'));
    const appLines = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8').split('\n').length;
    test('app.js stays at its 8301-line ratchet (B2 adds nothing there)', appLines === 8249);  // was 8334 (8301 + 33 persona-bundle T3); -85 for cert-registry Task 1.3 (detectCert reads the registry)
  } catch (err) {
    test('Lift B2 scaffold: block (threw)', false);
    results.errors.push('494 lift-b2-scaffold block threw: ' + err.message);
  }
})();
