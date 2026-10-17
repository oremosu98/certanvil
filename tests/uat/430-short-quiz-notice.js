// tests/uat/430-short-quiz-notice.js
// Scope: tell the learner when a quiz comes back short (v8.178.0).
//
// Founder, 13 Oct: asked for 20 questions, got 16 (the API credit ran out mid-
// generation) and nothing on screen said so. A toast on start gives the reason and a
// "16 of 20" pill stays in the quiz header until the next quiz or Home.

const { _fnBody, dgCss, html, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Short-quiz notice ──\x1b[0m');
  try {
    const toasts = [], pill = { cls: new Set(), textContent: '', title: '', classList: null, removeAttribute(k) { this[k] = ''; } };
    pill.classList = { toggle: (c, on) => { if (on) pill.cls.add(c); else pill.cls.delete(c); } };
    const ctx = vm.createContext({ document: { getElementById: id => id === 'short-notice' ? pill : null }, showErrorToast: m => toasts.push(m) });
    vm.runInContext((_fnBody(js, '_shortReason') || '') + '\n' + (_fnBody(js, '_noteShortQuiz') || ''), ctx);
    const run = (a, g, rounds) => vm.runInContext('_noteShortQuiz(' + a + ',' + g + ',' + JSON.stringify(rounds || []) + ')', ctx);

    run(20, 16, [{ error: 'Your credit balance is too low to access the Anthropic API' }]);
    test('Short set, credit ran out: toast names it and the pill reads "16 of 20"',
      toasts[0] === "16 of 20 questions came through. Your API credit ran out partway, so 4 weren't made."
        && pill.textContent === '16 of 20' && pill.cls.has('show'));
    run(10, 9, [{ error: 'Failed to fetch' }]);
    test('Short set, API error: "the AI stopped responding", singular for one missing',
      toasts[1] === "9 of 10 questions came through. The AI stopped responding partway, so 1 wasn't made.");
    run(20, 17, [{ asked: 6, added: 2 }]);
    test('Short set, no error: the rest failed the quality checks',
      toasts[2] === "17 of 20 questions came through. 3 didn't pass the quality checks.");
    run(20, 20, []);
    test('Full set: no toast and the pill hides', toasts.length === 3 && !pill.cls.has('show') && pill.textContent === '');

    test('Wired: custom quizzes and marathons report after generation; every new quiz or session step clears the pill',
      /_noteShortQuiz\(qCount, questions\.length, _fill\.rounds\);/.test(_fnBody(js, 'startQuiz') || '')
        && /_noteShortQuiz\(count, collected\.length, _fillRounds\)/.test(js)
        && /_noteShortQuiz\(0, 0\);/.test(_fnBody(js, '_resetDrillModes') || '')
        && /_noteShortQuiz\(0, 0\)/.test(_fnBody(js, 'runSessionStep') || ''));
    test('Header pill sits beside Cached, warn-coloured, hidden unless shown',
      /<span class="cache-notice short-notice" id="short-notice" role="status"><\/span>/.test(html)
        && /#page-quiz #short-notice\{[^}]*color:var\(--warn\)!important/.test(dgCss)
        && /#page-quiz #short-notice:not\(\.show\)\{display:none!important;\}/.test(dgCss));
  } catch (err) {
    test('Short-quiz notice: block (threw)', false);
    results.errors.push('430 short-quiz-notice block threw: ' + err.message);
  }
})();
