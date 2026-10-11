// tests/uat/350-cancel-generation.js
// Scope: any build on the loading screen can be cancelled (v8.164.0).
//
// Why this module exists: founder, 2026-10-11 — "when you are generating a
// quiz/exam/anything on the app, whilst its loading you need to allow the
// option to cancel and go back to the home page". A cancel has to do three
// things: go Home, stop the in-flight AI requests (no paying for questions
// nobody sees), and make sure the cancelled build can never finish later and
// write the shared quiz state or take over the screen (the class of bug behind
// "a new quiz shows the old quiz", fixed in v8.148.0).

const { _fnBody, html, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Cancel while generating ──\x1b[0m');
  try {
    function fn(name) {
      var m = new RegExp('function\\s+' + name + '\\s*\\(').exec(js);
      if (!m) throw new Error('missing fn ' + name);
      var i = js.indexOf('{', m.index), d = 0, j = i;
      for (; j < js.length; j++) { var c = js[j]; if (c === '{') d++; else if (c === '}') { d--; if (d === 0) { j++; break; } } }
      return js.slice(m.index, j);
    }

    // ── Session rules ──
    var G = { AbortController: AbortController, __home: 0 };
    vm.createContext(G);
    vm.runInContext('var _gen = { id: 0, ctrl: null, cancelled: false, live: false };' +
      'function _loadingProgressFinish() { _genEnd(); } function goSetup() { __home++; }' +
      [fn('_genBegin'), fn('_genToken'), fn('_genEnd'), fn('_genAlive'), fn('_genSignal'), fn('cancelGeneration')].join('\n'), G);
    var r = vm.runInContext('(function () {' +
      'var t1 = _genBegin(); var s1 = _genSignal(); var alive1 = _genAlive(t1);' +
      'cancelGeneration(); var dead1 = !_genAlive(t1), aborted1 = s1.aborted, home = __home;' +
      'var t2 = _genBegin(); var oldStillDead = !_genAlive(t1), alive2 = _genAlive(t2);' +
      '_genEnd(); var noSignalAfterEnd = _genSignal() === undefined, stillAlive = _genAlive(t2);' +
      'return { alive1: alive1, dead1: dead1, aborted1: aborted1, home: home, oldStillDead: oldStillDead, alive2: alive2, noSignalAfterEnd: noSignalAfterEnd, stillAlive: stillAlive, outside: _genAlive(null) };' +
      '})()', G);
    test('Cancel: Cancel aborts the build\'s AI requests, marks it dead and goes Home',
      r.alive1 && r.dead1 && r.aborted1 && r.home === 1);
    test('Cancel: a cancelled build stays dead after a new one starts; the new one is alive',
      r.oldStillDead && r.alive2);
    test('Cancel: once the loading screen closes, later AI calls (teacher content etc.) carry no cancel signal',
      r.noSignalAfterEnd && r.stillAlive && r.outside === true);

    // ── The AI request path honours the cancel ──
    // (fetchWithTimeout is async and the UAT runner reports synchronously, so the
    // two lines that matter are pinned: the cancel signal aborts the request, and
    // an abort caused by it is reported as AbortError, never as a timeout.)
    var fwt = _fnBody(js, 'fetchWithTimeout') || '';
    test('Cancel: fetchWithTimeout stops on the cancel signal and reports AbortError (not a timeout)',
      /const ext = opts\.signal; if \(ext\) \{ if \(ext\.aborted\) ctrl\.abort\(\); else ext\.addEventListener\('abort', \(\) => ctrl\.abort\(\)/.test(fwt)
        && /e\.name === 'AbortError' && !\(ext && ext\.aborted\)\) throw _timeoutError/.test(fwt));
    var fail = _fnBody(js, '_claudeFail') || '';
    test('Cancel: _claudeFail re-throws a cancel straight away (no error log, no error card)',
      /if \(e && e\.name === 'AbortError'\) throw e;/.test(fail) && fail.indexOf("throw e;") < fail.indexOf('logError'));
    var cf = _fnBody(js, '_claudeFetch') || '';
    test('Cancel: every AI request made from the loading screen carries the build\'s signal',
      (cf.match(/signal: \(typeof _genSignal === 'function'\) \? _genSignal\(\) : undefined/g) || []).length === 2);

    // ── Every builder checks its session ──
    var builders = { startQuiz: 'startQuiz(', startExam: 'startExam', startDiagnostic: 'startDiagnostic', startBulkQuiz: 'startBulkQuiz',
      runSessionStep: 'runSessionStep', gauntletStart: 'gauntletStart', whyNotStart: 'whyNotStart' };
    var missing = [];
    Object.keys(builders).forEach(function (k) {
      var b = _fnBody(js, builders[k]) || '';
      if (!/_genToken\(\)|_genBegin\(\)/.test(b) || !/_genAlive\(_g\)|_alive\(\)/.test(b)) missing.push(k);
    });
    var rew = js.slice(js.indexOf("_loadingProgressBegin('Re-wording your mistakes…')"), js.indexOf("_loadingProgressBegin('Re-wording your mistakes…')") + 1600);
    if (!/_genToken\(\)/.test(rew) || !/!_genAlive\(_g\)\) return;/.test(rew)) missing.push('drill-mistakes reword');
    test('Cancel: every build on the loading screen checks it is still wanted before it touches the page (quiz, exam, diagnostic, marathon, guided session, Gauntlet, Why-Not, Drill Mistakes)',
      missing.length === 0);
    if (missing.length) results.errors.push('builders without a cancel check: ' + missing.join(', '));

    // ── The button ──
    test('Cancel: the loading screen has a Cancel button, bound in JS (no inline handler)',
      /id="load-cancel"[^>]*>(?:<svg[\s\S]*?<\/svg>)?<span>Cancel<\/span><\/button>/.test(html) && !/id="load-cancel"[^>]*onclick/.test(html) && /getElementById\('load-cancel'\)/.test(js));
    // It sat under the progress line at first and fell below the fold on a 768px
    // laptop screen. The skeleton's top bar is always on screen.
    var bar = (html.match(/<div class="skel-topbar">[\s\S]*?<\/div>\s*<div class="skel-progress">/) || [''])[0];
    test('Cancel: the button sits in the top bar (top-left, where the quiz\'s own exit is), never below the fold',
      bar.indexOf('id="load-cancel"') !== -1 && (html.match(/id="load-cancel"/g) || []).length === 1);
  } catch (err) {
    test('Cancel: block (threw)', false);
    results.errors.push('350 cancel block threw: ' + err.message);
  }
})();
