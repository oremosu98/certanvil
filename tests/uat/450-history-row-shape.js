// tests/uat/450-history-row-shape.js
// Scope: #498 — every history reader gets one canonical row shape (v8.180.0).
//
// A profile whose history rows keyed the time as `ts` ({topic, correct, ts, q}) made
// getTodayQuestionCount call new Date(undefined).toISOString() and throw, which aborted
// goSetup (Home and the sidebar streak did nothing) and left readiness/Progress at NaN.
// Cloud rows mapped by rowToHistoryItem carry `at` (ms) and may lack `date` too.
// loadHistory() now normalises every row: date from date | at | ts, total/score/pct filled,
// rows with no usable time dropped.

const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── History row shape (#498) ──\x1b[0m');
  try {
    const now = Date.now(), iso = new Date(now).toISOString();
    const rows = [
      { date: iso, topic: 'A', score: 8, total: 10, pct: 80, mode: 'quiz' },          // canonical
      { topic: 'B', correct: true, ts: now, q: 'x' },                                 // the #498 shape
      { topic: 'C', score: 3, total: 4, at: now },                                    // cloud row, no date
      { topic: 'D', score: 1, total: 2 },                                             // no time at all
      { date: 'not a date', topic: 'E', score: 1, total: 1 },                         // bad time
      null,
    ];
    const store = { nplus_history: JSON.stringify(rows) };
    const ctx = vm.createContext({ STORAGE: { HISTORY: 'nplus_history' }, localStorage: { getItem: k => store[k] ?? null } });
    vm.runInContext((_fnBody(js, '_normHistoryRow') || '') + '\n' + (_fnBody(js, 'loadHistory') || ''), ctx);
    const h = vm.runInContext('loadHistory()', ctx);
    test('loadHistory: every row it returns has a valid ISO date and numeric score/total/pct',
      h.length === 3 && h.every(e => !isNaN(new Date(e.date).getTime()) && typeof e.score === 'number' && typeof e.total === 'number' && typeof e.pct === 'number'));
    test('loadHistory: a ts-keyed one-question row becomes a 1/1 row dated from ts; a cloud row is dated from at',
      h[1].topic === 'B' && h[1].date === iso && h[1].total === 1 && h[1].score === 1 && h[1].pct === 100 && h[2].date === iso && h[2].pct === 75);
    test('loadHistory: rows with no usable time are dropped; a canonical row passes through unchanged',
      h.length === 3 && !h.some(e => e.topic === 'D' || e.topic === 'E') && h[0].topic === 'A' && h[0].pct === 80 && h[0].date === iso);

    // The original crash: getTodayQuestionCount over these rows must not throw.
    vm.runInContext((_fnBody(js, '_localDay') || '') + "\nvar isHistorySplitRow = function () { return false; };\n" + (_fnBody(js, 'getTodayQuestionCount') || ''), ctx);
    let threw = false, n = -1;
    try { n = vm.runInContext('getTodayQuestionCount()', ctx); } catch (_) { threw = true; }
    test('getTodayQuestionCount no longer throws on ts-keyed history (the goSetup crash)', !threw && n === 15);
  } catch (err) {
    test('History row shape: block (threw)', false);
    results.errors.push('450 history-row-shape block threw: ' + err.message);
  }
})();
