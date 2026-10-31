// tests/uat/400-history-split-count.js
// Scope: counting today's questions without counting Mixed quizzes and exams twice (v8.176.0).
//
// Founder, 15 Oct: "i did 15 questions today so far but the momentum box is saying
// i did 30". A Mixed quiz saves a summary row (topic = MIXED_TOPIC, total = 15) AND a
// per-topic row for each topic it covered (via 'mixed-split', totals summing to 15);
// an exam does the same with 'exam-split'. getTodayQuestionCount summed every row, so
// each of those sessions counted twice. Reproduced on localhost: 15 answers -> 30.

const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Today\'s question count (split rows) ──\x1b[0m');
  try {
    const now = new Date().toISOString();
    const MIXED = 'Mixed — All Topics', EXAM = 'Exam Simulation';
    // Row shapes copied from the real writers: quiz-engine.js finish() and exam.js.
    const rows = [
      // a 15-question Mixed quiz: summary + 5 per-topic splits of 3
      { date: now, topic: MIXED, score: 13, total: 15, mode: 'quiz' },
      ...['A', 'B', 'C', 'D', 'E'].map(t => ({ date: now, topic: t, score: 2, total: 3, mode: 'quiz', via: 'mixed-split' })),
      // a single-topic quiz: one row
      { date: now, topic: 'Security Monitoring & SIEM', score: 9, total: 10, mode: 'quiz' },
      // a 2-topic custom quiz: per-topic rows only, no summary (v4.57.1)
      { date: now, topic: 'F', score: 2, total: 2, mode: 'quiz', multi: true },
      { date: now, topic: 'G', score: 1, total: 3, mode: 'quiz', multi: true },
      // a 90-question exam: summary + per-topic splits (one legacy split without `via`)
      { date: now, topic: EXAM, score: 760, total: 90, mode: 'exam' },
      { date: now, topic: 'H', score: 40, total: 50, mode: 'exam', via: 'exam-split' },
      { date: now, topic: 'I', score: 30, total: 40, mode: 'exam' },
      // yesterday's Mixed quiz must not count today
      { date: new Date(Date.now() - 2 * 86400000).toISOString(), topic: MIXED, score: 5, total: 5, mode: 'quiz' },
    ];
    const ctx = vm.createContext({ EXAM_TOPIC: EXAM, MIXED_TOPIC: MIXED, loadHistory: () => rows });
    vm.runInContext((_fnBody(js, '_localDay') || '') + '\n' + (_fnBody(js, 'isHistorySplitRow') || '') + '\n' + (_fnBody(js, 'getTodayQuestionCount') || ''), ctx);
    const count = vm.runInContext('getTodayQuestionCount()', ctx);
    test('Today count: a Mixed quiz and an exam count once each (15 + 10 + 5 + 90 = 120, not 225)', count === 120);
    test('Split rows: mixed-split, exam-split and legacy exam splits are split rows; summaries, single-topic and Multi rows are not',
      vm.runInContext('[isHistorySplitRow(' + JSON.stringify(rows[1]) + '), isHistorySplitRow(' + JSON.stringify(rows[10]) + '), isHistorySplitRow(' + JSON.stringify(rows[11]) + ')].every(Boolean)', ctx)
        && vm.runInContext('[' + [0, 6, 7, 9].map(i => 'isHistorySplitRow(' + JSON.stringify(rows[i]) + ')').join(',') + '].every(x => x === false)', ctx));

    // The writers must keep marking their per-topic rows, or the count doubles again.
    test('Writers still mark their per-topic rows (quiz "mixed-split", exam "exam-split")',
      /via: 'mixed-split'/.test(js) && /via: 'exam-split'/.test(js));

    const recap = _fnBody(js, '_maybeShowDailyRecap') || '';
    test('Daily recap: today\'s total skips split rows too, so it agrees with the Momentum tile',
      /isHistorySplitRow\(e\)\) return;/.test(recap));
  } catch (err) {
    test('Today count: block (threw)', false);
    results.errors.push('400 history-split-count block threw: ' + err.message);
  }
})();
