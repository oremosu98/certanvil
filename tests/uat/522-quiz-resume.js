// tests/uat/522-quiz-resume.js
// Scope: persona bundle Task 6. A practice quiz the app closed in the middle of resumes with EXACTLY
// the same questions, in the same order, with the answers and flags kept (features/quiz-resume.js).
// Spec: docs/superpowers/specs/2026-10-30-quiz-resume-design.md
const { _fnBody, js, html, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Quiz resume (same questions) ──\x1b[0m');
  const FNS = ['_quizResumeEligible', '_quizResumeSnapshot', 'quizResumeSave', 'quizResumeClear', '_quizResumeValid',
    '_quizResumeSummary', '_quizResumeRead', 'quizResumeState', 'resumeQuiz'];
  const src = FNS.map((n) => _fnBody(js, n)).join('\n');
  const HOUR = 3600000;

  // A sandbox standing in for the page: the quiz lets, localStorage, showPage/render and a fetch spy.
  function sandbox(cert, store0) {
    const store = new Map(Object.entries(store0 || {}));
    const calls = { fetch: 0, pages: [], renders: 0 };
    const ctx = vm.createContext({
      JSON, Math, Object, Array, String, Number, Date,
      window: {}, CURRENT_CERT: cert || 'netplus',
      localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
      fetch: () => { calls.fetch++; return Promise.reject(new Error('no network')); },
      showPage: (p) => calls.pages.push(p), render: () => { calls.renders++; }
    });
    vm.runInContext(`
      const QUIZ_RESUME_KEY = 'nplus_quiz_resume'; const QUIZ_RESUME_TTL_MS = 24 * 60 * 60 * 1000;
      var questions = [], current = 0, score = 0, streak = 0, bestStreak = 0, answered = 0, log = [], quizFlags = [];
      var topic = 'Subnetting', activeQuizTopic = 'Subnetting', diff = 'Exam Level', qCount = 10;
      var examMode = false, gauntletMode = false, whyNotMode = false, sessionMode = false, dailyChallengeMode = false, wrongDrillMode = false;
      var msSelections = [], orderSequence = [], topoDevices = {}, _sessionStartTs = 0;
      ${src}`, ctx);
    return { ctx, store, calls, ev: (c) => vm.runInContext(c, ctx) };
  }
  const QS = (n) => Array.from({ length: n }, (_, i) => ({
    question: 'Stem ' + (i + 1) + ': which port?', options: ['A ' + i, 'B ' + i, 'C ' + i, 'D ' + i], answer: 'ABCD'[i % 4],
    explanation: 'Because ' + i, topic: 'Subnetting', difficulty: 'Exam Level'
  }));
  // Play a quiz: 10 questions, answer 7 (the engine's own log shape), move to the 8th, flag the 3rd.
  function played(s) {
    s.ctx.__qs = QS(10);
    s.ev(`questions = __qs; quizFlags = questions.map(() => false); quizFlags[2] = true; _sessionStartTs = Date.now() - 90000;
      for (let i = 0; i < 7; i++) { const q = questions[i]; const ch = i % 2 ? q.answer : 'A'; const ok = ch === q.answer;
        answered++; if (ok) { score++; streak++; bestStreak = Math.max(bestStreak, streak); } else streak = 0;
        log.push({ q, chosen: ch, correct: q.answer, isRight: ok, flagged: quizFlags[i] }); }
      current = 7;`);
    return s.ev('quizResumeSave()');
  }

  // ── same questions, same order, answers kept ──
  const a = sandbox();
  test('Save: a practice quiz saves under nplus_quiz_resume with v:1 and the cert', played(a) === true
    && JSON.parse(a.store.get('nplus_quiz_resume')).v === 1 && JSON.parse(a.store.get('nplus_quiz_resume')).cert === 'netplus');
  const saved = JSON.parse(a.store.get('nplus_quiz_resume'));
  test('Save: the stored shape carries every field the brief lists',
    ['v', 'cert', 'savedAt', 'questions', 'current', 'log', 'score', 'streak', 'bestStreak', 'answered', 'quizFlags', 'topic', 'activeQuizTopic',
      'diff', 'qCount', 'dailyChallengeMode', 'wrongDrillMode', 'msSelections', 'orderSequence'].every((k) => k in saved));
  test('Save: log entries point at their question by index, not a copy', saved.log.every((e, i) => e.qi === i && !('q' in e)));
  const original = JSON.stringify(QS(10));
  // "Reload": a fresh page with only localStorage.
  const b = sandbox('netplus', Object.fromEntries(a.store));
  const st = b.ev('quizResumeState()');
  test('State: Home reads topic, 7 of 10 answered, 3 left', st && st.topicLabel === 'Subnetting' && st.answered === 7 && st.total === 10 && st.left === 3 && typeof st.savedAt === 'number');
  test('Resume: returns true, shows the quiz page and renders once', b.ev('resumeQuiz()') === true && b.calls.pages.join() === 'quiz' && b.calls.renders === 1);
  test('Resume: the questions are deep-equal to the ones started, in the same order', JSON.stringify(b.ev('questions')) === original);
  test('Resume: log.length === 7 and current === 7', b.ev('log.length') === 7 && b.ev('current') === 7);
  test('Resume: each answer points at the restored question by identity (the engine finds answers by q ===)',
    b.ev('log.every((e, i) => e.q === questions[i])') && b.ev('log[1].chosen') === 'B' && b.ev('log[0].isRight') === true && b.ev('log[2].isRight') === false);
  test('Resume: score, streaks, answered and the flag are kept', b.ev('score') === 5 && b.ev('answered') === 7
    && b.ev('bestStreak') === 3 && b.ev('quizFlags[2]') === true && b.ev('quizFlags.filter(Boolean).length') === 1);
  test('Resume: elapsed time carries on from the save', b.ev('Date.now() - _sessionStartTs') >= 89000);
  test('Resume: never touches the network', b.calls.fetch === 0 && !/fetch|_claudeFetch|fetchQuestions/.test(_fnBody(js, 'resumeQuiz')));

  // ── discarded saves ──
  const old = sandbox('netplus', { nplus_quiz_resume: JSON.stringify(Object.assign({}, saved, { savedAt: Date.now() - 25 * HOUR })) });
  test('Expired: a 25h-old save is discarded (state null, resume false, key removed)',
    old.ev('quizResumeState()') === null && old.ev('resumeQuiz()') === false && !old.store.has('nplus_quiz_resume') && old.calls.renders === 0);
  const young = sandbox('netplus', { nplus_quiz_resume: JSON.stringify(Object.assign({}, saved, { savedAt: Date.now() - 23 * HOUR })) });
  test('Expiry: a 23h-old save is still offered', young.ev('quizResumeState()') !== null);
  const foreign = sandbox('secplus', Object.fromEntries(a.store));
  test('Foreign cert: a Network+ save is discarded on Security+', foreign.ev('quizResumeState()') === null && !foreign.store.has('nplus_quiz_resume'));
  const bad = (mut) => { const o = JSON.parse(JSON.stringify(saved)); mut(o); const s = sandbox('netplus', { nplus_quiz_resume: JSON.stringify(o) }); return s.ev('quizResumeState()') === null && s.ev('resumeQuiz()') === false && !s.store.has('nplus_quiz_resume'); };
  test('Malformed: a question without its stem is discarded', bad((o) => { delete o.questions[4].question; }));
  test('Malformed: a question with neither options nor type is discarded', bad((o) => { delete o.questions[0].options; }));
  test('Malformed: more answers than questions is discarded', bad((o) => { o.questions = o.questions.slice(0, 5); o.current = 4; }));
  test('Malformed: an answer pointing at a missing question is discarded', bad((o) => { o.log[0].qi = 42; }));
  test('Malformed: current out of range is discarded', bad((o) => { o.current = 10; }));
  test('Malformed: unparseable JSON is discarded', (() => { const s = sandbox('netplus', { nplus_quiz_resume: '{oops' }); return s.ev('quizResumeState()') === null && !s.store.has('nplus_quiz_resume'); })());
  test('Valid: a PBQ with a type but no options is restorable', (() => { const o = JSON.parse(JSON.stringify(saved)); delete o.questions[9].options; o.questions[9].type = 'order';
    const s = sandbox('netplus', { nplus_quiz_resume: JSON.stringify(o) }); return s.ev('resumeQuiz()') === true; })());

  // ── modes that never save ──
  for (const m of ['examMode', 'gauntletMode', 'whyNotMode', 'sessionMode']) {
    const s = sandbox(); s.ev(m + ' = true');
    test('Never saves: ' + m, played(s) === false && !s.store.has('nplus_quiz_resume'));
  }
  const dc = sandbox(); dc.ev('dailyChallengeMode = true'); played(dc);
  test('Daily Challenge saves and reads as "Daily Challenge"', dc.ev('quizResumeState()').topicLabel === 'Daily Challenge');
  const wd = sandbox(); wd.ev("wrongDrillMode = true; activeQuizTopic = 'Session \\u00b7 mistakes drill'"); played(wd);
  test('Mistake drill saves; label carries no middle dot (Home adds its own)', wd.ev('quizResumeState()').topicLabel === 'Mistakes drill');
  const mx = sandbox(); mx.ev("activeQuizTopic = 'Mixed \\u2014 All Topics'"); played(mx);
  test('Mixed quiz label reads "Mixed topics"', mx.ev('quizResumeState()').topicLabel === 'Mixed topics');

  // ── final review M1: an abandoned quiz's answers still count as seen ──
  const spy = (s) => { s.ctx.__seen = []; s.ev('window.seenRecord = (qs, t) => { __seen.push({ n: qs.length, t, stems: qs.map((q) => q.question) }); return qs.length; }'); return s.ctx.__seen; };
  const ab = sandbox(); const abSeen = spy(ab); played(ab); ab.ev('quizResumeClear()');
  test('Seen (M1): ✕ / a new quiz over a left one records the 7 answered questions once, under the quiz topic, and removes the save',
    abSeen.length === 1 && abSeen[0].n === 7 && abSeen[0].t === 'Subnetting' && abSeen[0].stems[6] === 'Stem 7: which port?' && !ab.store.has('nplus_quiz_resume'));
  const fin = sandbox(); const finSeen = spy(fin); played(fin); fin.ev('quizResumeClear({ record: false })');
  test('Seen (M1): finish() clears with { record: false } and records nothing here (finish records its own log)',
    finSeen.length === 0 && !fin.store.has('nplus_quiz_resume'));
  const exp = sandbox('netplus', { nplus_quiz_resume: JSON.stringify(Object.assign({}, saved, { savedAt: Date.now() - 25 * HOUR })) }); const expSeen = spy(exp);
  exp.ev('quizResumeState()');
  test('Seen (M1): an expired save is recorded as it is discarded', expSeen.length === 1 && expSeen[0].n === 7);
  const fr = sandbox('secplus', Object.fromEntries(a.store)); const frSeen = spy(fr); fr.ev('quizResumeState()');
  test('Seen (M1): another cert\'s save is discarded without recording', frSeen.length === 0);
  const wdr = sandbox(); const wdrSeen = spy(wdr); wdr.ev('wrongDrillMode = true'); played(wdr); wdr.ev('quizResumeClear()');
  test('Seen (M1): a mistakes drill is never recorded (same rule as finish)', wdrSeen.length === 0);

  // ── final review M3: resuming stops a still-running fast-start fill ──
  const ff = sandbox('netplus', Object.fromEntries(a.store));
  ff.ctx.__live = QS(4);
  ff.ev("questions = __live; var __ff = []; window._ffAbandon = () => { __ff.push(questions === __live); }");
  test('Resume (M3): calls _ffAbandon once, while the live quiz is still on screen, then restores the save',
    ff.ev('resumeQuiz()') === true && ff.ev('__ff.length') === 1 && ff.ev('__ff[0]') === true && ff.ev('questions.length') === 10);
  test('Resume (M3): a missing save does not cancel anything', (() => { const s = sandbox(); s.ev('var __n = 0; window._ffAbandon = () => { __n++; }'); return s.ev('resumeQuiz()') === false && s.ev('__n') === 0; })());

  // ── wiring: when it saves and clears ──
  const qe = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'features', 'quiz-engine.js'), 'utf8');
  const saveAfterPush = (fn) => /log\.push\([^\n]*\n\s*if \(typeof quizResumeSave === 'function'\) quizResumeSave\(\);/.test(_fnBody(qe, fn));
  test('Saves after each answer: pick, submitMultiSelect, submitOrder', saveAfterPush('pick(') && saveAfterPush('submitMultiSelect') && saveAfterPush('submitOrder'));
  const appSrc = require('./_context').appJs;
  const saveAfterPushApp = (fn) => /log\.push\([^\n]*\);\s*if \(typeof quizResumeSave === 'function'\) quizResumeSave\(\);/.test(_fnBody(appSrc, fn));
  test('Saves after each PBQ answer too: submitHotArea and submitTopology', saveAfterPushApp('submitHotArea') && saveAfterPushApp('submitTopology'));
  const done = sandbox(); done.ctx.__qs = QS(3);
  done.ev("questions = __qs; quizFlags = [false,false,false]; log = questions.map((q) => ({ q, chosen: q.answer, correct: q.answer, isRight: true })); answered = 3; current = 2; quizResumeSave()");
  const dst = done.ev('quizResumeState()');
  test('State: all answered, results never opened → ready: true, left 0 (other fields kept)',
    dst.ready === true && dst.left === 0 && dst.total === 3 && dst.answered === 3 && dst.topicLabel === 'Subnetting' && typeof dst.savedAt === 'number');
  test('State: mid-quiz → ready: false', young.ev('quizResumeState()').ready === false);
  const rq = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'features', 'quiz-resume.js'), 'utf8');
  test('Saves when the app goes to the background: pagehide + visibilitychange hidden',
    /addEventListener\('pagehide'/.test(rq) && /visibilitychange[\s\S]{0,120}visibilityState === 'hidden'/.test(rq));
  test('Background save skips an outgoing quiz page (.active + .page-exit) so ✕ / finish stay cleared',
    /classList\.contains\('active'\) && !page\.classList\.contains\('page-exit'\)/.test(_fnBody(rq, '_quizResumeOnHide')));
  test('Clears on finish (after the drill hand-offs), on ✕ leave, and when startQuiz commits a new quiz',
    /quizResumeClear\(\{ record: false \}\)/.test(_fnBody(qe, 'finish()')) && _fnBody(qe, 'finish()').indexOf('quizResumeClear') > _fnBody(qe, 'finish()').indexOf('_wnFinishQuestion')
    && /seenRecord\(log\.map/.test(_fnBody(qe, 'finish()'))
    && /quizResumeClear\(\); goSetup\(\)/.test(_fnBody(js, 'confirmBack')) && /quizResumeClear\(\)/.test(_fnBody(qe, 'startQuiz')));
  test('Not cloud-synced: nplus_quiz_resume is absent from cloud-store', !require('./_context').cloudStoreJs.includes('nplus_quiz_resume'));
  test('index.html loads quiz-resume.js right after quiz-engine.js',
    html.indexOf('<script defer src="features/quiz-resume.js"></script>') === html.indexOf('<script defer src="features/quiz-engine.js"></script>') + '<script defer src="features/quiz-engine.js"></script>\n'.length);
})();
