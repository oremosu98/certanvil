// tests/uat/526-exam-outcome.js
// Scope: persona bundle Task 11. "How did your exam go?" is one flow: outcomeDue, the score check on the cert's scale,
// saveExamOutcome (predicted, one-time toast, flush), and the Log your result screen's copy.
// Spec: docs/superpowers/specs/2026-10-30-exam-outcome-design.md
const fs = require('fs');
const path = require('path');
const { _fnBody, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Exam outcome: log how it went ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const src = fs.readFileSync(path.join(ROOT, 'features', 'ios-log-result.js'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'lift-ios.css'), 'utf8');

  const ctx = vm.createContext({ Math, Date, Object, Array, String, Number, isFinite, JSON });
  vm.runInContext(['_examOutcomeDue', '_examScoreCheck', '_examPredicted'].map((n) => _fnBody(src, n)).join('\n'), ctx);
  const due = (d, has, t) => { Object.assign(ctx, { __d: d, __h: has, __t: t }); return vm.runInContext('_examOutcomeDue(__d, __h, __t)', ctx); };
  const chk = (raw, a, b) => { Object.assign(ctx, { __r: raw, __a: a, __b: b }); return vm.runInContext('_examScoreCheck(__r, __a, __b)', ctx); };
  const pred = (s, c, l) => { Object.assign(ctx, { __s: s, __c: c, __l: l }); return vm.runInContext('_examPredicted(__s, __c, __l)', ctx); };

  test('Outcome due: false on the exam day, true the day after', due('2026-10-30', false, '2026-10-30') === false && due('2026-10-30', false, '2026-10-31') === true);
  test('Outcome due: false before the exam, with no date, or once an outcome is saved',
    due('2026-11-02', false, '2026-10-31') === false && due(null, false, '2026-10-31') === false && due('2026-10-01', true, '2026-10-31') === false);
  test('Score: blank is fine either way (null)', chk('', 100, 900).ok === true && chk('', 100, 900).score === null && chk(null, 100, 900).score === null);
  test('Score: in range passes as a number, bounds inclusive', chk('812', 100, 900).score === 812 && chk('100', 100, 900).ok && chk('900', 100, 900).ok);
  test('Score: out of range, fractional or non-numeric is rejected with the cert scale in the message',
    chk('901', 100, 900).ok === false && chk('99', 100, 900).ok === false && chk('7.5', 100, 900).ok === false && chk('abc', 100, 900).ok === false
    && chk('901', 100, 900).error === 'Scores run from 100 to 900.');
  test('Score: uses the cert scale, not 100-900 (AWS-style 100-1000)', chk('950', 100, 1000).ok === true && chk('950', 100, 900).ok === false && chk('50', 100, 1000).error === 'Scores run from 100 to 1000.');
  test('Predicted: the snapshot score, else the live score, else null',
    pred({ netplus: { score: 553 } }, 'netplus', 600) === 553 && pred({}, 'netplus', 600) === 600 && pred({}, 'netplus', null) === null);

  // ── saveExamOutcome behaviour against a fake store ──
  const store = {}; const flushed = []; let toasts = 0; let homeRepaints = 0;
  const sctx = vm.createContext({ Math, Date, Object, Array, String, Number, isFinite, JSON, document: { body: null },
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    CURRENT_CERT: 'netplus', EXAM_MIN_SCORE: 100, EXAM_MAX_SCORE: 900, EXAM_PASS_SCORE: 720, STORAGE: { EXAM_OUTCOMES: 'nplus_exam_outcomes', READINESS_SNAPSHOTS: 'nplus_readiness_snapshots' },
    window: { _localDay: () => '2026-10-31' }, _cloudFlush: (k) => flushed.push(k), renderIosHome: () => { homeRepaints++; },
    getReadinessScore: () => ({ predicted: 540 }), getExamDate: () => '2026-10-30' });
  sctx._passToast = () => { toasts++; };
  vm.runInContext(['_today', '_certId', '_scale', '_readOutcomes', '_examOutcomeDue', '_examScoreCheck', '_examPredicted', 'outcomeDue', 'saveExamOutcome'].map((n) => _fnBody(src, n)).join('\n'), sctx);
  // the real _passToast builds DOM; swap in a counter after the source is loaded
  vm.runInContext('_passToast = function () { __tc(); };', Object.assign(sctx, { __tc: () => { toasts++; } }));
  const save = (o) => { sctx.__o = o; return vm.runInContext('saveExamOutcome(__o)', sctx); };

  test('outcomeDue(): true the day after with the real wrappers', vm.runInContext('outcomeDue()', sctx) === true);
  store.nplus_readiness_snapshots = JSON.stringify({ netplus: { score: 553 } });
  const r1 = save({ outcome: 'passed', score: '812', date: '2026-10-30' });
  const saved = JSON.parse(store.nplus_exam_outcomes).netplus;
  test('Save passed: writes {outcome, score, date, predicted, at} for the current cert', r1.ok && saved.outcome === 'passed' && saved.score === 812 && saved.date === '2026-10-30' && saved.predicted === 553 && typeof saved.at === 'string');
  test('Save: flushes the outcomes key and repaints Home', flushed.includes('nplus_exam_outcomes') && homeRepaints === 1);
  test('Save: outcomeDue() is false afterwards', vm.runInContext('outcomeDue()', sctx) === false);
  test('Save passed: the celebration shows once, not again on an edit', toasts === 1 && (save({ outcome: 'passed', score: '815', date: '2026-10-30' }), toasts === 1));
  test('Save: a score is optional (null stored)', (save({ outcome: 'passed', score: '', date: '2026-10-30' }), JSON.parse(store.nplus_exam_outcomes).netplus.score === null));
  const before = store.nplus_exam_outcomes;
  test('Save: out-of-range score is rejected and nothing is written', save({ outcome: 'passed', score: '950', date: '2026-10-30' }).ok === false && store.nplus_exam_outcomes === before);
  test('Save: no outcome picked, a bad date and a future date are rejected',
    save({ outcome: null, score: '', date: '2026-10-30' }).ok === false && save({ outcome: 'passed', date: '' }).ok === false && save({ outcome: 'passed', date: '2026-11-05' }).ok === false);
  delete store.nplus_exam_outcomes; toasts = 0;
  const r2 = save({ outcome: 'failed', score: '640', date: '2026-10-30' });
  test('Save failed: stored as failed, no celebration', r2.ok && JSON.parse(store.nplus_exam_outcomes).netplus.outcome === 'failed' && toasts === 0 && r2.first === false);

  // ── Copy and wiring ──
  test('Screen copy is verbatim from the drawing and spec',
    src.includes('Sat the exam? Add your result. A pass marks the cert as passed in your hub.') && src.includes('Your score, if you have it') && src.includes('Date taken')
    && src.includes("Didn\\'t pass") && src.includes("That's a hard exam.") && src.includes('Set a new date') && src.includes('Not now') && src.includes('Save and keep studying')
    && src.includes('Your progress is all still here.') && src.includes('. Well done.') && src.includes("'You passed '"));
  test('No test-centre field and no em dashes in the screen', !/centre|center/i.test(src) && !/—/.test(src));
  test('Set a new date opens the exam-date sheet (iosSettings._on.exam)', /window\.iosSettings\._on/.test(src) && /on\.exam\(\)/.test(src) && /act === 'done-go'/.test(src));
  test('Score check reads the cert scale constants, not 100/900 literals in the view', /EXAM_MIN_SCORE/.test(src) && /EXAM_MAX_SCORE/.test(src) && !/max="900"/.test(src));
  test('Exports outcomeDue / openLogResult / saveExamOutcome on window; phone-gated', /window\.outcomeDue = outcomeDue/.test(src) && /window\.openLogResult = openLogResult/.test(src) && /window\.saveExamOutcome/.test(src) && /max-width: 899px/.test(src));
  test('index.html loads ios-log-result.js right after ios-home.js',
    html.indexOf('<script defer src="features/ios-log-result.js"></script>') === html.indexOf('<script defer src="features/ios-home.js"></script>') + '<script defer src="features/ios-home.js"></script>\n'.length);
  test('Overlay CSS: hidden by default, motion tokens only (curve + 520-560ms reveal), reduced-motion fallback',
    /#ios-log-result\[hidden\]/.test(css) && /il-enter \.54s var\(--ios-ease\)/.test(css) && /@media \(prefers-reduced-motion: reduce\) \{ #ios-log-result \.il-rv/.test(css));
  test('Cross-cert write needs no markCertDirty (the screen only writes the current cert)', !/markCertDirty/.test(src));
})();
