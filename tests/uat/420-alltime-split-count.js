// tests/uat/420-alltime-split-count.js
// Scope: all-time and Analytics totals count each Mixed quiz and exam once (v8.178.0).
//
// Follow-up to v8.176.0 (today's count). A Mixed quiz saves a summary row plus a
// per-topic row per topic it covered; an exam does the same. Counters that summed
// every row reported those sessions twice. Per-topic views still use every row.

const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── All-time totals (split rows) ──\x1b[0m');
  try {
    const MIXED = 'Mixed — All Topics', EXAM = 'Exam Simulation', now = new Date().toISOString();
    const rows = [
      { date: now, topic: MIXED, score: 8, total: 10, pct: 80, mode: 'quiz' },
      ...['A', 'B'].map(t => ({ date: now, topic: t, score: 4, total: 5, pct: 80, mode: 'quiz', via: 'mixed-split' })),
      { date: now, topic: 'C', score: 9, total: 10, pct: 90, mode: 'quiz' },
    ];
    const ctx = vm.createContext({ EXAM_TOPIC: EXAM, MIXED_TOPIC: MIXED, loadHistory: () => rows, scaledExamScore: () => 0 });
    vm.runInContext((_fnBody(js, 'isHistorySplitRow') || '') + '\n' + (_fnBody(js, 'getStudyStats') || ''), ctx);
    const st = vm.runInContext('getStudyStats()', ctx);
    test('Study stats: a 10-question Mixed quiz plus a 10-question topic quiz is 20 questions over 2 sessions (not 30 over 4)',
      st.totalQ === 20 && st.sessions === 2 && st.avgPct === 85);

    const bento = _fnBody(js, '_anaBentoData') || '';
    test('Analytics: totals, sessions, weekly series, accuracy over time, difficulty, heatmap and recent sessions use one row per session',
      /const hs = h\.filter\(e => !\(typeof isHistorySplitRow === 'function' && isHistorySplitRow\(e\)\)\);/.test(bento)
        && ['const totalQ = hs.reduce(', 'const totalCorrect = hs.reduce(', '_weeklyStatSeries(hs, 12)', 'sessions: hs.length',
          'const ent = hs.filter(', 'const recent = hs.slice(0, 5)']
          .every(x => bento.includes(x))
        && /const diffAgg = \{\};\s*hs\.forEach\(/.test(bento) && /const dayQ = new Map\(\);\s*hs\.forEach\(/.test(bento));
    test('Analytics: per-topic and per-domain views still read every row',
      /computeDomainRawAccuracy\(h\)/.test(bento) && /_computeConstellationData\(h\)/.test(bento) && /_anaBtWrongData\(h\)/.test(bento));
    test('Milestones: the question-count milestones skip split rows',
      /const totalQs = h\.filter\(e => !\(typeof isHistorySplitRow === 'function' && isHistorySplitRow\(e\)\)\)\.reduce/.test(_fnBody(js, '_buildMilestoneCtx') || ''));
  } catch (err) {
    test('All-time totals: block (threw)', false);
    results.errors.push('420 alltime-split-count block threw: ' + err.message);
  }
})();
