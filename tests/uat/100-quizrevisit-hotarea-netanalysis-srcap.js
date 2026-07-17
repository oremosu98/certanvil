// tests/uat/100-quizrevisit-hotarea-netanalysis-srcap.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: SR queue scrub + interactive review, Quiz Revisit nav, loading progress bar, Hot-Area question type, Network Analysis Drill, SR session cap, SR quality scrub

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// v4.81.31: SR queue scrub for legacy non-reviewable cards + Playwright E2E
// coverage for SR review flow. User dogfood after v4.81.30 deploy: an
// order-type question still in the queue from before v4.81.28's enrollment
// filter rendered as a stem-only card with empty body. The v4.81.28 filter
// only prevented NEW order/cli-sim/topology cards from entering — pre-filter
// entries persisted. Solution: defensive filter at session start in
// startSrReview() AND a silent migration that writes the cleaned queue back.
//
// Process critique that drove the Playwright additions: "this has happened
// a few times where you ship something and then we see its broken in live."
// vm-fixtures pass the structure but real-browser DOM rendering of the SR
// page wasn't covered. Three new Playwright tests now exercise the full
// flow end-to-end (MCQ pick → reveal → confidence → completion;
// multi-select toggle → submit → reveal markers; legacy order-card scrub).
test('v4.81.31 SRScrub: scrub helper filters cards to mcq + multi-select only (v4.85.7: extracted to _srScrubQueue)',
  (() => {
    const body = _fnBody(js, '_srScrubQueue');
    if (!body) return false;
    const hasReviewableSet = /const reviewable = new Set\(\['mcq', 'multi-select'\]\)/.test(body);
    const filtersDue = /const dueOk = due\.filter\(c => reviewable\.has\(c\.type \|\| 'mcq'\)\)/.test(body);
    return hasReviewableSet && filtersDue;
  })());
test('v4.81.31 SRScrub: scrub helper persists scrubbed queue to localStorage (v4.85.7: extracted to _srScrubQueue)',
  (() => {
    const body = _fnBody(js, '_srScrubQueue');
    if (!body) return false;
    return /loadSrQueue\(\)/.test(body)
      && /saveSrQueue\(cleaned\)/.test(body)
      && /reviewable\.has\(c\.type \|\| 'mcq'\)/.test(body);
  })());
test('v4.81.31 SRScrub: scrub is wrapped in try/catch (defensive) (v4.85.7: extracted to _srScrubQueue)',
  (() => {
    const body = _fnBody(js, '_srScrubQueue');
    if (!body) return false;
    return /tolerate scrub errors/.test(body) || /catch \(_\)/.test(body);
  })());

// vm fixture — startSrReview filters out order/cli-sim/topology cards from
// the session AND scrubs them from storage. This is the exact regression
// the user reported on prod (order question rendering as empty stem).
test('v4.81.31 SRScrub: vm fixture — order/cli-sim cards filtered out, mcq retained, queue scrubbed',
  (() => {
    try {
      const body = _fnBody(js, 'startSrReview');
      const scrubBody = _fnBody(js, '_srScrubQueue');
      if (!body || !scrubBody) return false;
      const vm = require('vm');
      let savedPayload = null;
      const fakeQueue = [
        { id: 'order-legacy', type: 'order', question: 'Arrange steps', nextReview: 0, graduated: false, items: ['a', 'b', 'c'], correctOrder: [0, 1, 2] },
        { id: 'cli-legacy', type: 'cli-sim', question: 'Run a command', nextReview: 0, graduated: false },
        { id: 'topo-legacy', type: 'topology', question: 'Place devices', nextReview: 0, graduated: false },
        { id: 'mcq-good', type: 'mcq', question: 'Real Q?', options: { A: 'a', B: 'b' }, answer: 'A', nextReview: 0, graduated: false },
        { id: 'multi-good', type: 'multi-select', question: 'Pick 2', options: { A: 'a', B: 'b', C: 'c' }, answers: ['A', 'C'], nextReview: 0, graduated: false }
      ];
      const stemBody = _fnBody(js, '_stemNumericMatchesAnswerCount');
      const gtBody = _fnBody(js, '_multiSelectGroundTruthOk');
      const getQTypeBody = _fnBody(js, 'getQType');
      const ctx = {
        getSrDueEntries: () => fakeQueue.slice(),
        loadSrQueue: () => fakeQueue.slice(),
        saveSrQueue: (q) => { savedPayload = q; },
        loadSrPrefs: () => ({ sessionSize: 30, topUp: true }),
        showToast: () => {},
        showPage: () => {},
        document: {
          getElementById: () => ({ hidden: true, textContent: '', style: {} })
        },
        _renderSrCard: () => {},
        _srSession: null,
        _stemNumericMatchesAnswerCount: null,
        _multiSelectGroundTruthOk: null,
        _srScrubQueue: null,
        getQType: null,
        _STEM_NUMBER_WORDS: { two: 2, three: 3, four: 4, five: 5 },
        SR_SESSION_CAP: 30,
        Math, parseInt, Number,
        Set, Object, Array, String, console, RegExp
      };
      vm.createContext(ctx);
      if (getQTypeBody) vm.runInContext(getQTypeBody, ctx);
      if (stemBody) vm.runInContext(stemBody, ctx);
      if (gtBody) vm.runInContext(gtBody, ctx);
      vm.runInContext(scrubBody, ctx);
      vm.runInContext(body, ctx);
      vm.runInContext('startSrReview()', ctx);

      // Session should contain ONLY the mcq + multi-select cards (2), in original order.
      const session = ctx._srSession;
      if (!session) return false;
      const sessionIds = session.cards.map(c => c.id);
      const correctSession = sessionIds.length === 2
        && sessionIds.includes('mcq-good')
        && sessionIds.includes('multi-good')
        && !sessionIds.includes('order-legacy')
        && !sessionIds.includes('cli-legacy')
        && !sessionIds.includes('topo-legacy');

      // Queue scrub: saveSrQueue called with the 3 legacy cards removed.
      const scrubbed = savedPayload !== null
        && savedPayload.length === 2
        && savedPayload.every(c => c.type === 'mcq' || c.type === 'multi-select')
        && !savedPayload.some(c => ['order', 'cli-sim', 'topology'].includes(c.type));

      return correctSession && scrubbed;
    } catch (e) { return false; }
  })());

// vm fixture — when ALL due cards are reviewable (mcq + multi-select),
// startSrReview should NOT call saveSrQueue (no scrub work needed).
test('v4.81.31 SRScrub: vm fixture — clean queue triggers no scrub write',
  (() => {
    try {
      const body = _fnBody(js, 'startSrReview');
      const scrubBody = _fnBody(js, '_srScrubQueue');
      if (!body || !scrubBody) return false;
      const vm = require('vm');
      let saveCallCount = 0;
      const stemBody = _fnBody(js, '_stemNumericMatchesAnswerCount');
      const gtBody = _fnBody(js, '_multiSelectGroundTruthOk');
      const getQTypeBody = _fnBody(js, 'getQType');
      const fakeQueue = [
        { id: 'mcq-1', type: 'mcq', question: 'What is DNS?', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, answer: 'A', nextReview: 0, graduated: false },
        { id: 'multi-1', type: 'multi-select', question: '(Choose TWO) Pick two.', options: { A: 'a', B: 'b', C: 'c' }, answers: ['A', 'B'], nextReview: 0, graduated: false }
      ];
      const ctx = {
        getSrDueEntries: () => fakeQueue.map(c => Object.assign({}, c)),
        loadSrQueue: () => fakeQueue.map(c => Object.assign({}, c)),
        saveSrQueue: () => { saveCallCount++; },
        loadSrPrefs: () => ({ sessionSize: 30, topUp: true }),
        showToast: () => {},
        showPage: () => {},
        document: {
          getElementById: () => ({ hidden: true, textContent: '', style: {} })
        },
        _renderSrCard: () => {},
        _srSession: null,
        _stemNumericMatchesAnswerCount: null,
        _multiSelectGroundTruthOk: null,
        _srScrubQueue: null,
        getQType: null,
        _STEM_NUMBER_WORDS: { two: 2, three: 3, four: 4, five: 5 },
        SR_SESSION_CAP: 30,
        Math, parseInt, Number,
        Set, Object, Array, String, console, RegExp
      };
      vm.createContext(ctx);
      if (getQTypeBody) vm.runInContext(getQTypeBody, ctx);
      if (stemBody) vm.runInContext(stemBody, ctx);
      if (gtBody) vm.runInContext(gtBody, ctx);
      vm.runInContext(scrubBody, ctx);
      vm.runInContext(body, ctx);
      vm.runInContext('startSrReview()', ctx);
      return saveCallCount === 0 && ctx._srSession && ctx._srSession.cards.length === 2;
    } catch (e) { return false; }
  })());

// Playwright E2E coverage check — ensures the v4.81.31 SR review tests
// actually exist in the spec file. This is a meta-guard against the
// regression class the user called out: "ship something and we see its
// broken in live." If a future ship retires the SR review or refactors it
// without updating Playwright, this fails fast at UAT time.
test('v4.81.31 SRScrub: Playwright spec covers SR Review MCQ happy path',
  (() => {
    try {
      const fs = require('fs');
      const path = require('path');
      const specPath = path.join(require('path').join(__dirname, '..'), 'e2e', 'app.spec.js');
      const spec = fs.readFileSync(specPath, 'utf8');
      // v7.17.0 (home bento): the SR entry moved from the hidden #sr-review-card
      // home prompt to the bento recommend cell (#primaryLaunch → startSrReview).
      // The guard still proves the full flow is covered: bento entry → SR page →
      // confidence advance.
      return /SR Review.*MCQ happy path/.test(spec)
        && /primaryLaunch/.test(spec)
        && /page-sr-review/.test(spec)
        && /sr-confidence-confident/.test(spec);
    } catch (e) { return false; }
  })());
test('v4.81.31 SRScrub: Playwright spec covers SR Review multi-select flow',
  (() => {
    try {
      const fs = require('fs');
      const path = require('path');
      const specPath = path.join(require('path').join(__dirname, '..'), 'e2e', 'app.spec.js');
      const spec = fs.readFileSync(specPath, 'utf8');
      return /Multi-select happy path/.test(spec)
        && /sr-multi-submit-btn/.test(spec)
        && /is-missed/.test(spec);
    } catch (e) { return false; }
  })());
test('v4.81.31 SRScrub: Playwright spec covers v4.81.31 legacy-card scrub regression',
  (() => {
    try {
      const fs = require('fs');
      const path = require('path');
      const specPath = path.join(require('path').join(__dirname, '..'), 'e2e', 'app.spec.js');
      const spec = fs.readFileSync(specPath, 'utf8');
      return /v4\.81\.31 legacy-card scrub/.test(spec)
        && /'sr-legacy-order'/.test(spec)
        && /toHaveLength\(1\)/.test(spec);
    } catch (e) { return false; }
  })());

// v4.82.0: Quiz Revisit — Prev/Next nav arrows + clickable dots + editable
// re-pick across all question types. User feature request: "ability to revisit
// a previously answered question whilst ur in a quiz session." Editable
// (re-pick allowed), prev/next + dots (matches exam-mode UX), all qTypes
// covered (mcq + multi-select + order + cli-sim + topology).
//
// Truth-up rules: score + answered recompute from log on every re-pick.
// Streak intentionally NOT touched (re-picks happen after seeing the answer).
// Wrong-bank reflects current pick: wrong→right graduates from bank,
// right→wrong adds to bank.
test('v4.82.0 Revisit: _findLogEntryFor helper defined',
  /function _findLogEntryFor\(q\)/.test(js));
test('v4.82.0 Revisit: _recomputeQuizCounters helper defined',
  /function _recomputeQuizCounters\(\)/.test(js));
test('v4.82.0 Revisit: _renderQuizNavArrows helper defined',
  /function _renderQuizNavArrows\(\)/.test(js));
test('v4.82.0 Revisit: jumpToQuestion handler defined',
  /function jumpToQuestion\(idx\)/.test(js));
test('v4.82.0 Revisit: prevQuestion handler defined',
  /function prevQuestion\(\)/.test(js));
test('v4.82.0 Revisit: nextQuestion handler defined',
  /function nextQuestion\(\)/.test(js));
test('v4.82.0 Revisit: _restoreAnsweredQuizState helper defined',
  /function _restoreAnsweredQuizState\(q, entry\)/.test(js));
test('v4.82.0 Revisit: _renderRevisitBanner helper defined',
  /function _renderRevisitBanner\(hasEntry\)/.test(js));

// HTML: prev/next nav arrows + revisit banner element
test('v4.82.0 Revisit HTML: #quiz-prev-btn exists',
  /id="quiz-prev-btn"[\s\S]{0,200}onclick="prevQuestion\(\)"/.test(html));
test('v4.82.0 Revisit HTML: #quiz-next-arrow-btn exists',
  /id="quiz-next-arrow-btn"[\s\S]{0,200}onclick="nextQuestion\(\)"/.test(html));
test('v4.82.0 Revisit HTML: #quiz-revisit-banner element exists',
  /class="quiz-revisit-banner is-hidden"[\s\S]{0,80}id="quiz-revisit-banner"/.test(html));

// CSS: clickable quiz dots + nav arrows + revisit banner
test('v4.82.0 Revisit CSS: #quiz-prog-dots .qpd-cell becomes clickable button',
  /#quiz-prog-dots \.qpd-cell\s*\{[\s\S]*?cursor:\s*pointer/.test(css));
test('v4.82.0 Revisit CSS: .progress-label .quiz-nav-arrow declared',
  /\.progress-label \.quiz-nav-arrow\s*\{/.test(css));
test('v4.82.0 Revisit CSS: .quiz-revisit-banner declared',
  /\.quiz-revisit-banner\s*\{/.test(css));
test('v4.82.0 Revisit CSS: .options.is-revisiting affordance class declared',
  /\.options\.is-revisiting\s+\.option/.test(css));
test('v4.82.0 Revisit CSS: reduced-motion gate added for new transitions',
  /#quiz-prog-dots \.qpd-cell[\s\S]{0,500}transition:\s*none\s*!important/.test(css));

// _renderQuizProgressDots — buttons with onclick + numbered labels
test('v4.82.0 Revisit: progress dots are <button> with onclick="jumpToQuestion(...)"',
  (() => {
    const body = _fnBody(js, '_renderQuizProgressDots');
    if (!body) return false;
    return /<button type="button"/.test(body)
      && /onclick="jumpToQuestion\(\$\{i\}\)"/.test(body);
  })());

// pick() — re-pick branch updates existing entry instead of pushing new one
// Note: avoid _fnBody('pick') because of prefix-collision with pickDiagnosticOption.
// Slice the file from `function pick(chosen, q)` to next top-level function.
const _pickBody = (() => {
  const m = js.match(/function pick\(chosen, q\)\s*\{[\s\S]*?\n\}\n/);
  return m ? m[0] : '';
})();
test('v4.82.0 Revisit: pick() has re-pick branch via _findLogEntryFor',
  /_findLogEntryFor\(q\)/.test(_pickBody)
    && /log\[existing\.idx\] = \{ q, chosen,/.test(_pickBody)
    && /_recomputeQuizCounters\(\)/.test(_pickBody));

// pick() — wrong-bank truth-up logic (wrong→right graduates, right→wrong adds)
test('v4.82.0 Revisit: pick() truth-ups wrong-bank on re-pick',
  /if \(!isRight && wasRight\) addToWrongBank/.test(_pickBody)
    && /else if \(isRight && !wasRight\) graduateFromBank/.test(_pickBody));

// submitMultiSelect — re-submit branch
test('v4.82.0 Revisit: submitMultiSelect has re-submit branch',
  (() => {
    const body = _fnBody(js, 'submitMultiSelect');
    if (!body) return false;
    return /_findLogEntryFor\(q\)/.test(body)
      && /log\[existing\.idx\]/.test(body)
      && /_recomputeQuizCounters\(\)/.test(body);
  })());

// submitOrder — re-submit branch
test('v4.82.0 Revisit: submitOrder has re-submit branch',
  (() => {
    const body = _fnBody(js, 'submitOrder');
    if (!body) return false;
    return /_findLogEntryFor\(q\)/.test(body)
      && /log\[existing\.idx\]/.test(body)
      && /_recomputeQuizCounters\(\)/.test(body);
  })());

// submitTopology — re-submit branch
test('v4.82.0 Revisit: submitTopology has re-submit branch',
  (() => {
    const body = _fnBody(js, 'submitTopology');
    if (!body) return false;
    return /_findLogEntryFor\(q\)/.test(body)
      && /log\[existing\.idx\]/.test(body)
      && /_recomputeQuizCounters\(\)/.test(body);
  })());

// pick() — guard removed (used to be `if (querySelector('.option.correct, .option.wrong')) return;`)
test('v4.82.0 Revisit: pick() no longer guards re-picks via DOM .correct/.wrong query',
  (() => {
    const body = _fnBody(js, 'pick');
    if (!body) return false;
    // The new comment about removing the guard should be present;
    // the actual pre-fix guard line should not.
    const hasOldGuard = /if \(document\.querySelector\('#options \.option\.correct, #options \.option\.wrong'\)\) return;/.test(body);
    return !hasOldGuard;
  })());

// streak intentionally untouched on re-pick
test('v4.82.0 Revisit: _recomputeQuizCounters explicitly does NOT touch streak',
  (() => {
    const body = _fnBody(js, '_recomputeQuizCounters');
    if (!body) return false;
    // Streak should not be assigned in this function; should only update score + answered
    return /answered\s*=\s*log\.length/.test(body)
      && /score\s*=\s*log\.filter/.test(body)
      && !/streak\s*=/.test(body);
  })());

// Keyboard ←/→ wired for onQuiz (was previously only for onExam)
test('v4.82.0 Revisit: ArrowRight on quiz calls nextQuestion()',
  /e\.key === 'ArrowRight' && onQuiz[\s\S]{0,80}nextQuestion\(\)/.test(js));
test('v4.82.0 Revisit: ArrowLeft on quiz calls prevQuestion()',
  /e\.key === 'ArrowLeft'\s*&& onQuiz[\s\S]{0,80}prevQuestion\(\)/.test(js));

// render() wires the new helpers
// Note: avoid _fnBody('render') prefix-collision with renderMCQ etc.
const _renderQuizBody = (() => {
  const m = js.match(/\nfunction render\(\)\s*\{[\s\S]*?\n\}\n/);
  return m ? m[0] : '';
})();
test('v4.82.0 Revisit: render() calls _restoreAnsweredQuizState when log entry exists',
  /_findLogEntryFor\(q\)/.test(_renderQuizBody)
    && /_restoreAnsweredQuizState\(q,/.test(_renderQuizBody)
    && /_renderQuizNavArrows\(\)/.test(_renderQuizBody));

// vm fixture #1 — _recomputeQuizCounters truth-ups score + answered from log
test('v4.82.0 Revisit: vm fixture — _recomputeQuizCounters recomputes from log, leaves streak',
  (() => {
    try {
      const body = _fnBody(js, '_recomputeQuizCounters');
      if (!body) return false;
      const vm = require('vm');
      const fakeScore = { textContent: '' };
      const fakeStreak = { textContent: '' };
      const ctx = {
        log: [
          { q: { question: 'a' }, isRight: true },
          { q: { question: 'b' }, isRight: false },
          { q: { question: 'c' }, isRight: true },
          { q: { question: 'd' }, isRight: true }
        ],
        score: 0,    // simulate stale state — should be recomputed to 3
        answered: 0, // should be recomputed to 4
        streak: 7,   // should NOT be touched
        document: { getElementById: (id) => id === 'live-score' ? fakeScore : id === 'live-streak' ? fakeStreak : null },
        Array, Number
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      vm.runInContext('_recomputeQuizCounters()', ctx);
      return ctx.score === 3 && ctx.answered === 4 && ctx.streak === 7
        && fakeScore.textContent === '3 / 4';
    } catch (e) { return false; }
  })());

// vm fixture #2 — _findLogEntryFor returns matching entry by object identity
test('v4.82.0 Revisit: vm fixture — _findLogEntryFor matches by question object identity',
  (() => {
    try {
      const body = _fnBody(js, '_findLogEntryFor');
      if (!body) return false;
      const vm = require('vm');
      const qA = { question: 'A?' };
      const qB = { question: 'B?' };
      const qC = { question: 'C?' };
      const ctx = {
        log: [
          { q: qA, chosen: 'A', isRight: false },
          { q: qB, chosen: 'C', isRight: true }
        ],
        qA, qB, qC,
        Array
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const resA = vm.runInContext('_findLogEntryFor(qA)', ctx);
      const resB = vm.runInContext('_findLogEntryFor(qB)', ctx);
      const resC = vm.runInContext('_findLogEntryFor(qC)', ctx);
      return resA && resA.idx === 0 && resA.entry.chosen === 'A'
        && resB && resB.idx === 1 && resB.entry.chosen === 'C'
        && resC === null;
    } catch (e) { return false; }
  })());

// vm fixture #3 + #4 — pick() re-pick paths: wrong→right and right→wrong both truth-up.
// Use _pickBody (regex-extracted via specific signature) to avoid prefix-collision.
test('v4.82.0 Revisit: vm fixture — pick re-pick wrong→right updates entry + graduates wrong-bank',
  (() => {
    try {
      const findBody = _fnBody(js, '_findLogEntryFor');
      const recomputeBody = _fnBody(js, '_recomputeQuizCounters');
      if (!_pickBody || !findBody || !recomputeBody) return false;
      const vm = require('vm');
      const q = { question: 'Test?', answer: 'C' };
      const graduateCalls = [];
      const addToBankCalls = [];
      const fakeScore = { textContent: '' };
      const fakeStreak = { textContent: '', classList: { remove: () => {}, add: () => {} }, offsetWidth: 0 };
      const ctx = {
        log: [{ q, chosen: 'B', correct: 'C', isRight: false, flagged: false }],
        score: 0, answered: 1, streak: 0, bestStreak: 0,
        quizFlags: [false],
        current: 0,
        wrongDrillMode: false,
        addToWrongBank: (q, ch) => addToBankCalls.push({ q, ch }),
        graduateFromBank: (qstr) => graduateCalls.push(qstr),
        updateTypeStat: () => {},
        getQType: () => 'mcq',
        q,
        document: {
          getElementById: (id) => id === 'live-score' ? fakeScore : id === 'live-streak' ? fakeStreak : id === 'options' ? { classList: { add: () => {} } } : null,
          querySelectorAll: () => []
        },
        showExplanation: () => {},
        _renderQuizProgressDots: () => {},
        _renderQuizNavArrows: () => {},
        Array, Number, JSON, Object
      };
      vm.createContext(ctx);
      vm.runInContext(findBody, ctx);
      vm.runInContext(recomputeBody, ctx);
      vm.runInContext(_pickBody, ctx);
      vm.runInContext("pick('C', q)", ctx);
      const entry = ctx.log[0];
      return entry.chosen === 'C'
        && entry.isRight === true
        && ctx.score === 1
        && ctx.answered === 1
        && ctx.streak === 0
        && graduateCalls.length === 1
        && addToBankCalls.length === 0;
    } catch (e) { return false; }
  })());

test('v4.82.0 Revisit: vm fixture — pick re-pick right→wrong downscores + adds to wrong-bank',
  (() => {
    try {
      const findBody = _fnBody(js, '_findLogEntryFor');
      const recomputeBody = _fnBody(js, '_recomputeQuizCounters');
      if (!_pickBody || !findBody || !recomputeBody) return false;
      const vm = require('vm');
      const q = { question: 'Test?', answer: 'C' };
      const graduateCalls = [];
      const addToBankCalls = [];
      const fakeScore = { textContent: '' };
      const fakeStreak = { textContent: '', classList: { remove: () => {}, add: () => {} }, offsetWidth: 0 };
      const ctx = {
        log: [{ q, chosen: 'C', correct: 'C', isRight: true, flagged: false }],
        score: 1, answered: 1, streak: 1, bestStreak: 1,
        quizFlags: [false],
        current: 0,
        wrongDrillMode: false,
        addToWrongBank: (q, ch) => addToBankCalls.push({ q, ch }),
        graduateFromBank: (qstr) => graduateCalls.push(qstr),
        updateTypeStat: () => {},
        getQType: () => 'mcq',
        q,
        document: {
          getElementById: (id) => id === 'live-score' ? fakeScore : id === 'live-streak' ? fakeStreak : id === 'options' ? { classList: { add: () => {} } } : null,
          querySelectorAll: () => []
        },
        showExplanation: () => {},
        _renderQuizProgressDots: () => {},
        _renderQuizNavArrows: () => {},
        Array, Number, JSON, Object
      };
      vm.createContext(ctx);
      vm.runInContext(findBody, ctx);
      vm.runInContext(recomputeBody, ctx);
      vm.runInContext(_pickBody, ctx);
      vm.runInContext("pick('A', q)", ctx);
      const entry = ctx.log[0];
      return entry.chosen === 'A'
        && entry.isRight === false
        && ctx.score === 0
        && ctx.answered === 1
        && ctx.streak === 1
        && graduateCalls.length === 0
        && addToBankCalls.length === 1
        && addToBankCalls[0].ch === 'A';
    } catch (e) { return false; }
  })());

// Playwright spec coverage check
test('v4.82.0 Revisit: Playwright spec covers Quiz Revisit flow',
  (() => {
    try {
      const fs = require('fs');
      const path = require('path');
      const specPath = path.join(require('path').join(__dirname, '..'), 'e2e', 'app.spec.js');
      const spec = fs.readFileSync(specPath, 'utf8');
      return /Quiz Revisit/.test(spec)
        && /quiz-prev-btn/.test(spec)
        && /quiz-revisit-banner/.test(spec);
    } catch (e) { return false; }
  })());

// v4.82.1: smooth loading progress bar — eased continuous fill + shimmer
// overlay across all question-fetching flows. User feature request: "when
// the questions are loading there needs to be some kind of loading bar
// aswel." Pre-fix only exam mode had a per-batch progress bar; regular
// quizzes/diagnostic/marathon showed only a skeleton + status text.
//
// Smoothness pattern: each milestone is a real event (Haiku resolved,
// Sonnet resolved, etc.) — no fakery. Width transitions via 1.6s
// cubic-bezier ease-out so the fill smoothly decelerates between
// milestones. Shimmer overlay (CSS pseudo-element) animates continuously
// regardless of width changes so the bar feels alive even between events.
test('v4.82.1 Loader: _loadingProgressBegin defined',
  /function _loadingProgressBegin\(initialLabel\)/.test(js));
test('v4.82.1 Loader: _loadingProgressUpdate defined',
  /function _loadingProgressUpdate\(label, pct\)/.test(js));
test('v4.82.1 Loader: _loadingProgressFinish defined',
  /function _loadingProgressFinish\(\)/.test(js));
test('v4.82.1 Loader: progress bar resets transition before first paint (avoids backflow)',
  (() => {
    const m = js.match(/function _loadingProgressBegin[\s\S]{0,1500}\}/);
    if (!m) return false;
    const body = m[0];
    return /style\.transition = 'none'/.test(body)
      && /style\.width = '0%'/.test(body)
      && /void _loadingProgressBar\.offsetWidth/.test(body);
  })());

// CSS: shimmer overlay + cubic-bezier easing
test('v4.82.1 Loader CSS: load-bar-fill has cubic-bezier transition',
  /\.load-bar-fill\s*\{[\s\S]*?cubic-bezier\(0\.16, 1, 0\.3, 1\)/.test(css));
test('v4.82.1 Loader CSS: shimmer overlay defined via ::after pseudo',
  /\.load-bar-fill::after\s*\{[\s\S]*?animation:\s*loadBarShimmer/.test(css));
test('v4.82.1 Loader CSS: @keyframes loadBarShimmer defined',
  /@keyframes loadBarShimmer\s*\{[\s\S]*?background-position/.test(css));
test('v4.82.1 Loader CSS: load-bar height bumped from 4px to 8px',
  /\.load-bar\s*\{[\s\S]*?height:\s*8px/.test(css));
test('v4.82.1 Loader CSS: reduced-motion gate kills shimmer animation',
  /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.load-bar-fill::after\s*\{[\s\S]*?animation:\s*none/.test(css));

// Wiring into all 4 flows
test('v4.82.1 Loader: startQuiz calls _loadingProgressBegin',
  (() => {
    const body = _fnBody(js, 'startQuiz');
    if (!body) return false;
    return /_loadingProgressBegin\(/.test(body)
      && /_loadingProgressUpdate\(/.test(body)
      && /_loadingProgressFinish\(\)/.test(body);
  })());
test('v4.82.1 Loader: startDiagnostic calls _loadingProgressBegin',
  (() => {
    const body = _fnBody(js, 'startDiagnostic');
    if (!body) return false;
    return /_loadingProgressBegin\(/.test(body)
      && /_loadingProgressFinish\(\)/.test(body);
  })());
test('v4.82.1 Loader: startExam uses unified loading-progress module',
  (() => {
    const body = _fnBody(js, 'startExam');
    if (!body) return false;
    return /_loadingProgressBegin\(/.test(body)
      && /_loadingProgressUpdate\(/.test(body)
      && /_loadingProgressFinish\(\)/.test(body);
  })());
test('v4.82.1 Loader: startBulkQuiz (marathon) uses unified loading-progress module',
  (() => {
    const body = _fnBody(js, 'startBulkQuiz');
    if (!body) return false;
    return /_loadingProgressBegin\(/.test(body)
      && /_loadingProgressUpdate\(/.test(body)
      && /_loadingProgressFinish\(\)/.test(body);
  })());

// Tombstone: legacy direct fill.style.width = '0%' on un-hide should be gone
// from startExam (replaced by _loadingProgressBegin which handles transition reset).
test('v4.82.1 Loader: tombstone — startExam no longer does manual fill.style.width = "0%" un-hide pattern',
  (() => {
    const body = _fnBody(js, 'startExam');
    if (!body) return false;
    // The pattern "fill.style.width = '0%';\n  prog.classList.remove('is-hidden')"
    // was the legacy un-hide. After v4.82.1 the helper handles both.
    return !/fill\.style\.width = '0%';\s*\n\s*prog\.classList\.remove\('is-hidden'\)/.test(body);
  })());

// vm fixture — _loadingProgressBegin resets transition + sets width=0% then
// nudges to 8% after a tick.
test('v4.82.1 Loader: vm fixture — _loadingProgressBegin resets bar then nudges to 8%',
  (() => {
    try {
      const beginBody = _fnBody(js, '_loadingProgressBegin');
      if (!beginBody) return false;
      const vm = require('vm');
      let widthHistory = [];
      let transitionHistory = [];
      const fakeBar = {
        style: {
          set transition(v) { transitionHistory.push(v); },
          get transition() { return transitionHistory[transitionHistory.length - 1] || ''; },
          set width(v) { widthHistory.push(v); },
          get width() { return widthHistory[widthHistory.length - 1] || ''; }
        },
        offsetWidth: 0
      };
      const fakeLabel = { textContent: '' };
      const fakeProg = { classList: { remove: () => {} } };
      const ctx = {
        document: {
          getElementById: (id) => {
            if (id === 'load-progress') return fakeProg;
            if (id === 'load-bar-fill') return fakeBar;
            if (id === 'load-progress-label') return fakeLabel;
            return null;
          }
        },
        setTimeout: (fn, ms) => fn(), // fire synchronously so we can assert the 8% bump
        _loadingProgressBar: null,
        _loadingProgressLabel: null
      };
      vm.createContext(ctx);
      vm.runInContext(beginBody, ctx);
      vm.runInContext("_loadingProgressBegin('Test label')", ctx);
      // Should have: transition='none', width='0%', then transition='', then setTimeout fired width='8%'
      return widthHistory.length >= 2
        && widthHistory[0] === '0%'
        && widthHistory[widthHistory.length - 1] === '8%'
        && transitionHistory.includes('none')
        && fakeLabel.textContent === 'Test label';
    } catch (e) { return false; }
  })());

// vm fixture — _loadingProgressFinish snaps to 100% then schedules hide
test('v4.82.1 Loader: vm fixture — _loadingProgressFinish snaps to 100% + hides container',
  (() => {
    try {
      const finishBody = _fnBody(js, '_loadingProgressFinish');
      if (!finishBody) return false;
      const vm = require('vm');
      let progHidden = false;
      const fakeBar = { style: {} };
      const fakeLabel = { textContent: '' };
      const fakeProg = { classList: { add: (c) => { if (c === 'is-hidden') progHidden = true; } } };
      const ctx = {
        document: {
          getElementById: (id) => {
            if (id === 'load-progress') return fakeProg;
            return null;
          }
        },
        setTimeout: (fn, ms) => fn(), // fire synchronously
        _loadingProgressBar: fakeBar,
        _loadingProgressLabel: fakeLabel
      };
      vm.createContext(ctx);
      vm.runInContext(finishBody, ctx);
      vm.runInContext('_loadingProgressFinish()', ctx);
      return fakeBar.style.width === '100%'
        && fakeLabel.textContent === 'Ready!'
        && progHidden === true;
    } catch (e) { return false; }
  })());

// v4.83.0: Hot-Area question type — three sub-shapes (topology / OSI / cable-grid)
// for click-on-diagram PBQs. Curated bank of 8 hand-authored questions with inline
// SVGs for cable connectors. Closes the realism gap vs the real CompTIA exam,
// which sometimes asks "click the misconfigured device" or "click the OSI layer
// where ARP operates." Single-click + Submit + reveal pattern matches our other
// PBQs (multi-select / order / topology). Revisit-aware via the v4.82.0
// infrastructure — clicking a dot back re-renders with previous pick highlighted
// and Submit re-enabled.
test('v4.83.0 HotArea: HOT_AREA_BANK constant defined',
  /const HOT_AREA_BANK = \[/.test(js));
test('v4.83.0 HotArea: bank has at least 8 questions',
  (() => {
    const m = js.match(/const HOT_AREA_BANK = \[([\s\S]*?)\n\];/);
    if (!m) return false;
    const entries = m[1].match(/type: 'hot-area'/g) || [];
    return entries.length >= 8;
  })());
test('v4.83.0 HotArea: bank covers all 3 sub-shapes (topology + osi + cable-grid)',
  (() => {
    const m = js.match(/const HOT_AREA_BANK = \[([\s\S]*?)\n\];/);
    if (!m) return false;
    return /subShape: 'topology'/.test(m[1])
      && /subShape: 'osi'/.test(m[1])
      && /subShape: 'cable-grid'/.test(m[1]);
  })());
test('v4.83.0 HotArea: CABLE_CONNECTORS icon library defined',
  /const CABLE_CONNECTORS = \{/.test(js));
test('v4.83.0 HotArea: CABLE_CONNECTORS covers 8 connector types',
  (() => {
    const m = js.match(/const CABLE_CONNECTORS = \{([\s\S]*?)\n\};/);
    if (!m) return false;
    const ids = ['rj45', 'rj11', 'lc', 'sc', 'st', 'f-type', 'bnc', 'usb-c'];
    return ids.every(id => m[1].includes("'" + id + "'"));
  })());
test('v4.83.0 HotArea: cable connector SVGs use currentColor for theme awareness',
  (() => {
    const m = js.match(/const CABLE_CONNECTORS = \{([\s\S]*?)\n\};/);
    if (!m) return false;
    // At least 4 of 8 should use currentColor (verifies pattern, not strict for every shape)
    const matches = m[1].match(/currentColor/g) || [];
    return matches.length >= 4;
  })());

// Renderer + dispatch
test('v4.83.0 HotArea: renderHotArea defined',
  /function renderHotArea\(q, box\)/.test(js));
test('v4.83.0 HotArea: 3 sub-renderers defined (topology + osi + cable-grid)',
  /function _renderHotAreaTopology\(q, box\)/.test(js)
    && /function _renderHotAreaOsi\(q, box\)/.test(js)
    && /function _renderHotAreaCableGrid\(q, box\)/.test(js));
test('v4.83.0 HotArea: submitHotArea defined',
  /function submitHotArea\(q\)/.test(js));
test('v4.83.0 HotArea: _restoreAnsweredHotAreaState defined',
  /function _restoreAnsweredHotAreaState\(q, entry\)/.test(js));
test('v4.83.0 HotArea: render() dispatches hot-area to renderHotArea',
  (() => {
    if (!_renderQuizBody) return false;
    return /qType === 'hot-area'/.test(_renderQuizBody)
      && /renderHotArea\(q, box\)/.test(_renderQuizBody);
  })());
test('v4.83.0 HotArea: render() PBQ badge handles hot-area sub-shapes',
  (() => {
    if (!_renderQuizBody) return false;
    return /Hot Area · /.test(_renderQuizBody);
  })());

// _restoreAnsweredQuizState routes hot-area
test('v4.83.0 HotArea: _restoreAnsweredQuizState handles hot-area',
  (() => {
    const body = _fnBody(js, '_restoreAnsweredQuizState');
    if (!body) return false;
    return /qType === 'hot-area'/.test(body)
      && /_restoreAnsweredHotAreaState\(q, entry\)/.test(body);
  })());

// injectPBQs pulls from HOT_AREA_BANK
test('v4.83.0 HotArea: getMatchingScenarios returns hotArea pool',
  (() => {
    const body = _fnBody(js, 'getMatchingScenarios');
    if (!body) return false;
    return /HOT_AREA_BANK\.filter/.test(body)
      && /hotArea/.test(body);
  })());
test('v4.83.0 HotArea: injectPBQs pool includes hotArea',
  (() => {
    const body = _fnBody(js, 'injectPBQs');
    if (!body) return false;
    return /\.\.\.\(hotArea \|\| \[\]\)/.test(body)
      || /\.\.\.hotArea/.test(body);
  })());

// submitHotArea uses v4.82.0 update-or-push pattern
test('v4.83.0 HotArea: submitHotArea has revisit re-submit branch',
  (() => {
    const body = _fnBody(js, 'submitHotArea');
    if (!body) return false;
    return /_findLogEntryFor\(q\)/.test(body)
      && /log\[existing\.idx\]/.test(body)
      && /_recomputeQuizCounters\(\)/.test(body);
  })());
test('v4.83.0 HotArea: submitHotArea truth-ups wrong-bank on re-submit',
  (() => {
    const body = _fnBody(js, 'submitHotArea');
    if (!body) return false;
    return /if \(!isCorrect && wasRight\) addToWrongBank/.test(body)
      && /else if \(isCorrect && !wasRight\) graduateFromBank/.test(body);
  })());

// CSS structural
test('v4.83.0 HotArea CSS: .hot-area-stage container declared',
  /\.hot-area-stage\s*\{/.test(css));
test('v4.83.0 HotArea CSS: .hot-region states (picked/correct/wrong/dimmed/reveal-correct)',
  /\.hot-region\.is-picked/.test(css)
    && /\.hot-region\.is-correct/.test(css)
    && /\.hot-region\.is-wrong/.test(css)
    && /\.hot-region\.is-reveal-correct/.test(css)
    && /\.hot-region\.is-dimmed/.test(css));
test('v4.83.0 HotArea CSS: .osi-stack + .osi-layer states declared',
  /\.osi-stack\s*\{/.test(css)
    && /\.osi-layer\.is-picked/.test(css)
    && /\.osi-layer\.is-correct/.test(css));
test('v4.83.0 HotArea CSS: .cable-grid + .cable-card states declared',
  /\.cable-grid\s*\{/.test(css)
    && /\.cable-card\.is-picked/.test(css)
    && /\.cable-card\.is-correct/.test(css));
test('v4.83.0 HotArea CSS: reduced-motion gate kills transitions',
  /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]{0,500}\.hot-region[\s\S]{0,200}transition: none/.test(css));

// vm fixture #1 — _haRegionIsCorrect for topology + osi + cable-grid
test('v4.83.0 HotArea: vm fixture — _haRegionIsCorrect dispatches by sub-shape',
  (() => {
    try {
      const correctIdsBody = _fnBody(js, '_haCorrectRegionIds');
      const isCorrectBody = _fnBody(js, '_haRegionIsCorrect');
      if (!correctIdsBody || !isCorrectBody) return false;
      const vm = require('vm');
      const ctx = { Array };
      vm.createContext(ctx);
      vm.runInContext(correctIdsBody, ctx);
      vm.runInContext(isCorrectBody, ctx);

      // Topology
      const topo = { subShape: 'topology', regions: [
        { id: 'r1', isCorrect: false }, { id: 'r2', isCorrect: true }, { id: 'r3', isCorrect: false }
      ]};
      const t1 = vm.runInContext('_haRegionIsCorrect(' + JSON.stringify(topo) + ", 'r2')", ctx);
      const t2 = vm.runInContext('_haRegionIsCorrect(' + JSON.stringify(topo) + ", 'r1')", ctx);

      // OSI dual-correct
      const osi = { subShape: 'osi', correctLayers: ['L2', 'L3'] };
      const o1 = vm.runInContext('_haRegionIsCorrect(' + JSON.stringify(osi) + ", 'L2')", ctx);
      const o2 = vm.runInContext('_haRegionIsCorrect(' + JSON.stringify(osi) + ", 'L3')", ctx);
      const o3 = vm.runInContext('_haRegionIsCorrect(' + JSON.stringify(osi) + ", 'L4')", ctx);

      // Cable-grid
      const cable = { subShape: 'cable-grid', cables: [
        { id: 'rj45', isCorrect: false }, { id: 'lc', isCorrect: true }
      ]};
      const c1 = vm.runInContext('_haRegionIsCorrect(' + JSON.stringify(cable) + ", 'lc')", ctx);
      const c2 = vm.runInContext('_haRegionIsCorrect(' + JSON.stringify(cable) + ", 'rj45')", ctx);

      return t1 === true && t2 === false
        && o1 === true && o2 === true && o3 === false  // dual-correct works
        && c1 === true && c2 === false;
    } catch (e) { return false; }
  })());

// vm fixture #2 — submitHotArea logs an entry on first-submit + recomputes on re-submit
test('v4.83.0 HotArea: vm fixture — submitHotArea logs entry on first submit, updates on re-submit',
  (() => {
    try {
      const submitBody = _fnBody(js, 'submitHotArea');
      const findBody = _fnBody(js, '_findLogEntryFor');
      const recomputeBody = _fnBody(js, '_recomputeQuizCounters');
      const correctIdsBody = _fnBody(js, '_haCorrectRegionIds');
      const isCorrectBody = _fnBody(js, '_haRegionIsCorrect');
      if (!submitBody || !findBody || !recomputeBody) return false;
      const vm = require('vm');
      const q = { type: 'hot-area', subShape: 'osi', question: 'ARP layer?', correctLayers: ['L2', 'L3'], explanation: 'L2/L3 boundary' };
      const graduateCalls = [];
      const addToBankCalls = [];
      const fakeScore = { textContent: '' };
      const fakeStreak = { textContent: '' };
      const ctx = {
        log: [], score: 0, answered: 0, streak: 0, bestStreak: 0,
        quizFlags: [false], current: 0, wrongDrillMode: false,
        addToWrongBank: (q, ch) => addToBankCalls.push({ q, ch }),
        graduateFromBank: (qstr) => graduateCalls.push(qstr),
        updateTypeStat: () => {},
        document: {
          getElementById: (id) => id === 'live-score' ? fakeScore : id === 'live-streak' ? fakeStreak : id === 'options' ? { classList: { add: () => {} } } : id === 'ha-submit-row' ? { classList: { add: () => {} } } : null,
          querySelectorAll: () => []
        },
        showExplanation: () => {},
        _renderQuizProgressDots: () => {},
        _renderQuizNavArrows: () => {},
        _hotAreaPick: 'L4', // user's first wrong pick
        q,
        Array, Number, JSON, Object
      };
      vm.createContext(ctx);
      vm.runInContext(findBody, ctx);
      vm.runInContext(recomputeBody, ctx);
      vm.runInContext(correctIdsBody, ctx);
      vm.runInContext(isCorrectBody, ctx);
      vm.runInContext(submitBody, ctx);

      // First submit: pick = L4 (wrong)
      vm.runInContext('submitHotArea(q)', ctx);
      const afterFirst = ctx.log.length === 1
        && ctx.log[0].chosen === 'L4'
        && ctx.log[0].isRight === false
        && ctx.score === 0
        && ctx.answered === 1
        && addToBankCalls.length === 1;

      // Re-submit: change pick to L2 (correct via dual-correct)
      ctx._hotAreaPick = 'L2';
      vm.runInContext('submitHotArea(q)', ctx);
      const afterResubmit = ctx.log.length === 1  // updated, not pushed
        && ctx.log[0].chosen === 'L2'
        && ctx.log[0].isRight === true
        && ctx.score === 1
        && ctx.answered === 1
        && graduateCalls.length === 1;

      return afterFirst && afterResubmit;
    } catch (e) { return false; }
  })());

// Playwright spec coverage check
test('v4.83.0 HotArea: Playwright spec covers Hot-Area flow',
  (() => {
    try {
      const fs = require('fs');
      const path = require('path');
      const specPath = path.join(require('path').join(__dirname, '..'), 'e2e', 'app.spec.js');
      const spec = fs.readFileSync(specPath, 'utf8');
      return /Hot-Area|Hot Area/.test(spec)
        && /ha-submit-btn/.test(spec)
        && /hot-area/.test(spec);
    } catch (e) { return false; }
  })());

// v4.84.0 — Network Analysis Drill (Phase 1, issue #270). 5th drill in the
// launcher row. 32-Q curated bank across 4 categories (tcpdump filters /
// Wireshark display filters / Nmap scan types / output reading) + 3 stepped
// lessons + Practice/Lessons/Dashboard mode tabs. Closes the N10-009 Domain
// 5.5 ("use the appropriate tool") gap.

// Storage keys + helpers
test('v4.84.0 NetAnalysis: STORAGE.NA_MASTERY key declared',
  /NA_MASTERY: 'nplus_na_mastery'/.test(js));
test('v4.84.0 NetAnalysis: STORAGE.NA_LESSONS key declared',
  /NA_LESSONS: 'nplus_na_lessons'/.test(js));
test('v4.84.0 NetAnalysis: STORAGE.NA_STATS key declared',
  /NA_STATS: 'nplus_na_stats'/.test(js));

// Renderer + handlers

// HTML structural

// CSS structural
test('v4.84.0 NetAnalysis CSS: .na-tabs declared',
  /\.na-tabs\s*\{/.test(css));
test('v4.84.0 NetAnalysis CSS: .na-question-card declared',
  /\.na-question-card\s*\{/.test(css));
test('v4.84.0 NetAnalysis CSS: .na-output-block + token color classes declared',
  /\.na-output-block\s*\{/.test(css)
    && /\.na-out-time/.test(css)
    && /\.na-out-ip/.test(css)
    && /\.na-out-port/.test(css)
    && /\.na-out-flag/.test(css));
test('v4.84.0 NetAnalysis CSS: .na-cat-card mastery states declared',
  /\.na-cat-bar-fill\.na-cat-high/.test(css)
    && /\.na-cat-bar-fill\.na-cat-mid/.test(css)
    && /\.na-cat-bar-fill\.na-cat-low/.test(css)
    && /\.na-cat-bar-fill\.na-cat-empty/.test(css));
test('v4.84.0 NetAnalysis CSS: .drills-tile-new + NEW badge declared',
  /\.drills-tile-new\s*\{/.test(css)
    && /\.drills-tile-new-badge\s*\{/.test(css));
test('v4.84.0 NetAnalysis CSS: .na-cheat-table declared',
  /\.na-cheat-table\s*\{/.test(css));
test('v4.84.0 NetAnalysis CSS: reduced-motion gate kills transitions',
  /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]{0,500}\.na-cat-card[\s\S]{0,200}transition: none/.test(css));

// vm fixture #1 — naSubmitAnswer updates mastery correctly

// vm fixture #2 — _naPickNextQuestion biases to weakest category

// Playwright spec coverage check

// v4.84.1 hotfix — Network Analysis drill must appear in the sidebar nav.
// v4.84.0 only wired the drill to the #page-drills tile launcher; the
// sidebar drills section (Subnet/Port/Acronym/OSI/Cable) was missing the
// 6th entry, causing user dogfood to immediately surface "cant see it."
// This regression-guard ensures Network Analysis is in the sidebar drills
// list AND the active-state map AND the breadcrumb label map — the three
// places that need to know about a new drill page for full discoverability.

// ══════════════════════════════════════════════════════════════════════════
// v4.85.0 — Network Analysis Phase 2 (descoped): Filter Recognition Qs +
// BPF vs Display Filter lesson. Original Phase 2 was a full filter-builder
// UI; descoped to filter-recognition MCQs + side-by-side cheatsheet after
// exam-prep review showed the N10-009 tests recognition, not construction.
// ══════════════════════════════════════════════════════════════════════════

// (removed: v4.85.0 Filter Recognition bpf-vs-display test — feature descoped/removed)

// vm fixture — filter questions test the BPF-vs-display-filter conceptual gap

// vm fixture — new filter category integrates into weighted picker

// ═══════════════════════════════════════════════════════════════════════
// v4.85.1 — SR Session Cap: cap SR review sessions to SR_SESSION_CAP (20)
// to prevent review fatigue. Queue stays intact; remaining cards surface
// on the next session or via the completion-screen "Continue" button.
// ═══════════════════════════════════════════════════════════════════════

test('v7.22.0 SRSessionCap: SR_SESSION_CAP constant declared at 30 (#8, was 20)',
  /const\s+SR_SESSION_CAP\s*=\s*30\b/.test(js));

test('v7.22.0 SRSessionCap: startSrReview caps due array to the chosen size (#8)',
  (() => {
    const body = _fnBody(js, 'startSrReview');
    return body && /loadSrPrefs\(\)/.test(body)
      && /due\.length\s*>\s*_srCap/.test(body)
      && /due\s*=\s*due\.slice\(0,\s*_srCap\)/.test(body);
  })());

test('v4.85.1 SRSessionCap: startSrReview records totalDueCount for completion screen',
  (() => {
    const body = _fnBody(js, 'startSrReview');
    return body && /totalDueCount/.test(body) && /totalDueCount:\s*totalDueCount/.test(body);
  })());

test('v4.85.1 SRSessionCap: renderSrReviewCard shows capped headline when due > cap',
  (() => {
    const body = _fnBody(js, 'renderSrReviewCard');
    return body && /SR_SESSION_CAP/.test(body)
      && /stats\.due\s*<=\s*SR_SESSION_CAP/.test(body);
  })());

test('v4.85.1 SRSessionCap: NBM (_computeNextBestMove) shows capped title',
  (() => {
    const body = _fnBody(js, '_computeNextBestMove');
    return body && /Math\.min\(srStats\.due,\s*SR_SESSION_CAP\)/.test(body)
      && /srStats\.due\s*<=\s*SR_SESSION_CAP/.test(body);
  })());

test('v4.85.1 SRSessionCap: _srEndReview shows remaining cards + Continue button',
  (() => {
    const body = _fnBody(js, '_srEndReview');
    return body && /sr-remaining-row/.test(body)
      && /sr-remaining-text/.test(body)
      && /sr-continue-btn/.test(body)
      && /startSrReview\(\)/.test(body)
      && /remaining\s*>\s*0/.test(body);
  })());

test('v4.85.1 SRSessionCap: CSS — .sr-remaining-row declared',
  /\.sr-remaining-row\s*\{/.test(css));

test('v4.85.1 SRSessionCap: CSS — .sr-remaining-text declared',
  /\.sr-remaining-text\s*\{/.test(css));

test('v4.85.1 SRSessionCap: CSS — mobile breakpoint for .sr-remaining-row',
  css.includes('.sr-remaining-row') && /flex-direction:\s*column/.test(css));

// vm-fixture: 40 due cards → session contains exactly 30 (cap) + totalDueCount=40
test('v7.22.0 SRSessionCap: vm fixture — session capped at SR_SESSION_CAP with totalDueCount preserved',
  (() => {
    try {
      const body = _fnBody(js, 'startSrReview');
      const scrubBody = _fnBody(js, '_srScrubQueue');
      if (!body || !scrubBody) return false;
      const vm = require('vm');
      const stemBody = _fnBody(js, '_stemNumericMatchesAnswerCount');
      const gtBody = _fnBody(js, '_multiSelectGroundTruthOk');
      const getQTypeBody = _fnBody(js, 'getQType');
      // Build 30 fake due mcq cards
      const fakeQueue = [];
      for (let i = 0; i < 40; i++) {
        fakeQueue.push({ id: 'card-' + i, type: 'mcq', question: 'Q' + i + '?', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, answer: 'A', nextReview: 0, graduated: false });
      }
      const ctx = {
        getSrDueEntries: () => fakeQueue.map(c => Object.assign({}, c)),
        loadSrQueue: () => fakeQueue.map(c => Object.assign({}, c)),
        saveSrQueue: () => {},
        loadSrPrefs: () => ({ sessionSize: 30, topUp: true }),
        showToast: () => {},
        showPage: () => {},
        document: {
          getElementById: () => ({ hidden: true, textContent: '', style: {} })
        },
        _renderSrCard: () => {},
        _srSession: null,
        _stemNumericMatchesAnswerCount: null,
        _multiSelectGroundTruthOk: null,
        _srScrubQueue: null,
        getQType: null,
        _STEM_NUMBER_WORDS: { two: 2, three: 3, four: 4, five: 5 },
        SR_SESSION_CAP: 30,
        Math, parseInt, Number,
        Set, Object, Array, String, console, RegExp
      };
      vm.createContext(ctx);
      if (getQTypeBody) vm.runInContext(getQTypeBody, ctx);
      if (stemBody) vm.runInContext(stemBody, ctx);
      if (gtBody) vm.runInContext(gtBody, ctx);
      vm.runInContext(scrubBody, ctx);
      vm.runInContext(body, ctx);
      vm.runInContext('startSrReview()', ctx);

      const session = ctx._srSession;
      if (!session) return false;
      // Session should have exactly SR_SESSION_CAP (30) cards
      const cappedCorrectly = session.cards.length === 30;
      // totalDueCount should preserve the original 40
      const totalPreserved = session.totalDueCount === 40;
      // First card should be card-0 (slice preserves order)
      const orderPreserved = session.cards[0].id === 'card-0'
        && session.cards[29].id === 'card-29';
      return cappedCorrectly && totalPreserved && orderPreserved;
    } catch (e) { return false; }
  })());

// vm-fixture: when due <= SR_SESSION_CAP, no capping occurs + totalDueCount matches
test('v4.85.1 SRSessionCap: vm fixture — small queue not capped, totalDueCount matches cards.length',
  (() => {
    try {
      const body = _fnBody(js, 'startSrReview');
      const scrubBody = _fnBody(js, '_srScrubQueue');
      if (!body || !scrubBody) return false;
      const vm = require('vm');
      const stemBody = _fnBody(js, '_stemNumericMatchesAnswerCount');
      const gtBody = _fnBody(js, '_multiSelectGroundTruthOk');
      const getQTypeBody = _fnBody(js, 'getQType');
      const fakeQueue = [];
      for (let i = 0; i < 5; i++) {
        fakeQueue.push({ id: 'card-' + i, type: 'mcq', question: 'Q' + i + '?', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, answer: 'A', nextReview: 0, graduated: false });
      }
      const ctx = {
        getSrDueEntries: () => fakeQueue.map(c => Object.assign({}, c)),
        loadSrQueue: () => fakeQueue.map(c => Object.assign({}, c)),
        saveSrQueue: () => {},
        loadSrPrefs: () => ({ sessionSize: 30, topUp: true }),
        showToast: () => {},
        showPage: () => {},
        document: {
          getElementById: () => ({ hidden: true, textContent: '', style: {} })
        },
        _renderSrCard: () => {},
        _srSession: null,
        _stemNumericMatchesAnswerCount: null,
        _multiSelectGroundTruthOk: null,
        _srScrubQueue: null,
        getQType: null,
        _STEM_NUMBER_WORDS: { two: 2, three: 3, four: 4, five: 5 },
        SR_SESSION_CAP: 30,
        Math, parseInt, Number,
        Set, Object, Array, String, console, RegExp
      };
      vm.createContext(ctx);
      if (getQTypeBody) vm.runInContext(getQTypeBody, ctx);
      if (stemBody) vm.runInContext(stemBody, ctx);
      if (gtBody) vm.runInContext(gtBody, ctx);
      vm.runInContext(scrubBody, ctx);
      vm.runInContext(body, ctx);
      vm.runInContext('startSrReview()', ctx);

      const session = ctx._srSession;
      if (!session) return false;
      // All 5 cards present (no capping)
      return session.cards.length === 5 && session.totalDueCount === 5;
    } catch (e) { return false; }
  })());

// ═══════════════════════════════════════════════════════════════════════
// v4.85.2 — SR Quality Scrub: remove pre-v4.81.16 bad cards from the
// SR queue at session start. User dogfood: "Which TWO non-overlapping
// 2.4 GHz channels" kept surfacing because the card was enrolled before
// the stem-vs-answer-count + GT facts validators were added.
// ═══════════════════════════════════════════════════════════════════════

test('v4.85.2 SRQualityScrub: scrub helper calls _stemNumericMatchesAnswerCount (v4.85.7: extracted to _srScrubQueue)',
  (() => {
    const body = _fnBody(js, '_srScrubQueue');
    return body && /_stemNumericMatchesAnswerCount/.test(body);
  })());

test('v4.85.2 SRQualityScrub: scrub helper calls _multiSelectGroundTruthOk (v4.85.7: extracted to _srScrubQueue)',
  (() => {
    const body = _fnBody(js, '_srScrubQueue');
    return body && /_multiSelectGroundTruthOk/.test(body);
  })());

test('v4.85.2 SRQualityScrub: quality scrub permanently removes bad cards from storage (v4.85.7: extracted to _srScrubQueue)',
  (() => {
    const body = _fnBody(js, '_srScrubQueue');
    return body && /qualityOk\.length\s*<\s*due\.length/.test(body)
      && /saveSrQueue/.test(body);
  })());

test('v4.85.2 SRQualityScrub: quality scrub wrapped in try/catch for safety (v4.85.7: extracted to _srScrubQueue)',
  (() => {
    const body = _fnBody(js, '_srScrubQueue');
    return body && /tolerate quality-scrub errors/.test(body);
  })());

// vm-fixture: "Which TWO" + 2 answers (bad stem-vs-count) gets scrubbed,
// valid mcq card survives.
test('v4.85.2 SRQualityScrub: vm fixture — stem-vs-answer-count mismatch scrubbed from session + storage',
  (() => {
    try {
      const body = _fnBody(js, 'startSrReview');
      const scrubBody = _fnBody(js, '_srScrubQueue');
      const stemBody = _fnBody(js, '_stemNumericMatchesAnswerCount');
      const gtBody = _fnBody(js, '_multiSelectGroundTruthOk');
      const getQTypeBody = _fnBody(js, 'getQType');
      if (!body || !scrubBody || !stemBody || !gtBody || !getQTypeBody) return false;
      const vm = require('vm');
      let savedQueue = null;
      // Bad card: "Which TWO" but only 2 answers when it should be 3
      const badCard = {
        id: 'bad-wifi-channels',
        type: 'multi-select',
        question: 'Which TWO of the following are non-overlapping frequency channels in the 2.4 GHz Wi-Fi band?',
        options: { A: 'Channel 2', B: 'Channel 1', C: 'Channel 6', D: 'Channel 9', E: 'Channel 11' },
        answers: ['B', 'C'],  // only 2 — but the stem says TWO and the real answer is 1,6,11 (THREE)
        nextReview: 0,
        graduated: false
      };
      const goodCard = {
        id: 'good-mcq',
        type: 'mcq',
        question: 'What does ARP stand for?',
        options: { A: 'Address Resolution Protocol', B: 'Application Routing Protocol', C: 'Automatic Resource Protocol', D: 'Access Relay Protocol' },
        answer: 'A',
        nextReview: 0,
        graduated: false
      };
      const fakeQueue = [badCard, goodCard];
      const ctx = {
        getSrDueEntries: () => fakeQueue.map(c => Object.assign({}, c)),
        loadSrQueue: () => fakeQueue.map(c => Object.assign({}, c)),
        saveSrQueue: (q) => { savedQueue = q; },
        loadSrPrefs: () => ({ sessionSize: 30, topUp: true }),
        showToast: () => {},
        showPage: () => {},
        document: {
          getElementById: () => ({ hidden: true, textContent: '', style: {} })
        },
        _renderSrCard: () => {},
        _srSession: null,
        _stemNumericMatchesAnswerCount: null,
        _multiSelectGroundTruthOk: null,
        _srScrubQueue: null,
        getQType: null,
        _STEM_NUMBER_WORDS: { two: 2, three: 3, four: 4, five: 5 },
        SR_SESSION_CAP: 30,
        Math, parseInt, Number,
        Set, Object, Array, String, console, RegExp
      };
      vm.createContext(ctx);
      vm.runInContext(getQTypeBody, ctx);
      vm.runInContext(stemBody, ctx);
      vm.runInContext(gtBody, ctx);
      vm.runInContext(scrubBody, ctx);
      vm.runInContext(body, ctx);
      vm.runInContext('startSrReview()', ctx);

      const session = ctx._srSession;
      if (!session) return false;
      // Session should have only the good card (bad one scrubbed)
      const sessionOk = session.cards.length === 1
        && session.cards[0].id === 'good-mcq';
      // Storage should have been permanently cleaned
      const storageOk = savedQueue !== null
        && savedQueue.length === 1
        && savedQueue[0].id === 'good-mcq';
      return sessionOk && storageOk;
    } catch (e) { return false; }
  })());

// vm-fixture: all-clean queue → no quality scrub write
test('v4.85.2 SRQualityScrub: vm fixture — clean queue triggers no quality-scrub write',
  (() => {
    try {
      const body = _fnBody(js, 'startSrReview');
      const scrubBody = _fnBody(js, '_srScrubQueue');
      const stemBody = _fnBody(js, '_stemNumericMatchesAnswerCount');
      const gtBody = _fnBody(js, '_multiSelectGroundTruthOk');
      const getQTypeBody = _fnBody(js, 'getQType');
      if (!body || !scrubBody || !stemBody || !gtBody || !getQTypeBody) return false;
      const vm = require('vm');
      let saveCallCount = 0;
      const goodCards = [
        { id: 'mcq-1', type: 'mcq', question: 'What is DNS?', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, answer: 'A', nextReview: 0, graduated: false },
        { id: 'mcq-2', type: 'mcq', question: 'What is DHCP?', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, answer: 'B', nextReview: 0, graduated: false }
      ];
      const ctx = {
        getSrDueEntries: () => goodCards.map(c => Object.assign({}, c)),
        loadSrQueue: () => goodCards.map(c => Object.assign({}, c)),
        saveSrQueue: () => { saveCallCount++; },
        loadSrPrefs: () => ({ sessionSize: 30, topUp: true }),
        showToast: () => {},
        showPage: () => {},
        document: {
          getElementById: () => ({ hidden: true, textContent: '', style: {} })
        },
        _renderSrCard: () => {},
        _srSession: null,
        _stemNumericMatchesAnswerCount: null,
        _multiSelectGroundTruthOk: null,
        _srScrubQueue: null,
        getQType: null,
        _STEM_NUMBER_WORDS: { two: 2, three: 3, four: 4, five: 5 },
        SR_SESSION_CAP: 30,
        Math, parseInt, Number,
        Set, Object, Array, String, console, RegExp
      };
      vm.createContext(ctx);
      vm.runInContext(getQTypeBody, ctx);
      vm.runInContext(stemBody, ctx);
      vm.runInContext(gtBody, ctx);
      vm.runInContext(scrubBody, ctx);
      vm.runInContext(body, ctx);
      vm.runInContext('startSrReview()', ctx);

      // No scrub writes should have fired (both type-scrub and quality-scrub skip)
      return saveCallCount === 0 && ctx._srSession && ctx._srSession.cards.length === 2;
    } catch (e) { return false; }
  })());

// v4.81.29: multi-select prompt quality criteria — user dogfood feedback
// that the second correct answer was almost always obscure while distractors
// were too plausible (typically borrowed from adjacent topics). Pre-fix the
// prompt only specified the schema, not quality criteria. Post-fix Haiku
// gets explicit guidance: both correct answers core/well-known, distractors
// factually wrong (not "less correct"), difficulty = breadth not obscurity,
// explanation must enumerate why each correct + why each wrong.
test('v4.81.29 MultiSelectQuality: prompt has CRITICAL — MULTI-SELECT QUALITY CRITERIA section',
  /CRITICAL\s*—\s*MULTI-SELECT QUALITY CRITERIA/.test(js));
test('v4.81.29 MultiSelectQuality: requires both correct answers be core/well-known',
  /(BOTH|both)[\s\S]{0,200}correct answers must be CORE, well-known facts/.test(js));
test('v4.81.29 MultiSelectQuality: forbids obscure/edge-case correct answers',
  /Do NOT make one correct answer obvious and the other obscure or edge-case/.test(js));
test('v4.81.29 MultiSelectQuality: requires distractors be factually wrong',
  /DISTRACTORS must be FACTUALLY WRONG/.test(js));
test('v4.81.29 MultiSelectQuality: warns against adjacent-topic distractor trap',
  /borrowed from an adjacent\/related topic|adjacent-topic distractors/i.test(js));
test('v4.81.29 MultiSelectQuality: explanation must enumerate each correct + each distractor',
  (() => {
    const matches = js.match(/WHY each correct answer is correct[\s\S]{0,400}WHY each distractor is wrong/);
    return matches !== null;
  })());
test('v4.81.29 MultiSelectQuality: criteria block lives inside _fetchQuestionsBatch (not orphan)',
  /_fetchQuestionsBatch[\s\S]{0,40000}CRITICAL\s*—\s*MULTI-SELECT QUALITY CRITERIA/.test(js));

// v4.81.28: SR review three follow-up fixes after v4.81.27 dogfood.
// (1) self-grade fallback shipped in v4.81.27 had a fatal flaw —
//     srMarkConfidence early-returned on `!_srSession.revealed`,
//     blocking the confidence buttons. User stuck on every multi-select
//     card. Fix: set _srSession.revealed = true in self-grade render.
// (2) addToSrQueue re-enrollment didn't refresh the payload, so any
//     legacy entry with the v4.81.27 fixed corruption (answer=null)
//     stayed corrupt forever. Fix: overwrite payload fields on
//     re-encounter so legacy entries self-heal.
// (3) addToSrQueue accepted any q.type, so order/cli-sim/topology PBQs
//     ended up in the queue but rendered with empty bodies (no options).
//     Fix: filter at enrollment to mcq + multi-select only.
// v4.81.30 retire: the v4.81.28 hack of pre-setting `revealed=true` in the
// self-grade render branch is gone. The new commit-then-self-grade mode
// flips revealed=true on user pick (via srPickAnswer), matching the MCQ
// auto-grade flow. Tombstone now: the hack must NOT be in the render.
test('v4.81.30 retire: v4.81.28 revealed=true hack removed from render',
  (() => {
    const body = _fnBody(js, '_renderSrCard') || '';
    return !/_srSession\.revealed\s*=\s*true/.test(body);
  })());
test('v4.81.28 SR: addToSrQueue refreshes payload on re-enrollment',
  (() => {
    const body = _fnBody(js, 'addToSrQueue') || '';
    // On re-encounter, payload fields should be overwritten so legacy
    // corrupt entries self-heal. Look for assignments to entry.options/
    // entry.answer in the existing-entry branch.
    return /entry\.options\s*=\s*q\.options/.test(body)
      && /entry\.answer\s*=/.test(body);
  })());
test('v4.81.28 SR: addToSrQueue filters non-reviewable types',
  (() => {
    const body = _fnBody(js, 'addToSrQueue') || '';
    // Should reject types that can't render in SR review.
    return /allowedTypes\s*=\s*new Set\(\[['"]mcq['"]/.test(body)
      && /multi-select/.test(body)
      && /!allowedTypes\.has\(qType\)\s*\)\s*return null/.test(body);
  })());

// v4.81.30 retire: this fixture asserted the v4.81.28 behavior (revealed=true
// auto-set on render → confidence button works). The v4.81.30 redesign requires
// commit BEFORE reveal (toggle picks → submit → reveal → confidence). Replaced
// by the v4.81.30 vm fixtures below.
test('v4.81.30 retire: v4.81.28 self-grade auto-reveal pattern is gone',
  (() => {
    const body = _fnBody(js, '_renderSrCard') || '';
    // Tombstone — the auto-reveal in render is no longer present.
    return !/_srSession\.revealed\s*=\s*true/.test(body);
  })());

// vm fixture #2 — re-enrollment refreshes corrupt legacy payload.
// Simulates an existing entry with answer=null (the pre-v4.81.27 bug)
// and verifies that re-enrolling with a fresh question fixes it.
test('v4.81.28 SR: vm fixture — re-enrollment heals legacy null-answer entry',
  (() => {
    try {
      const body = _fnBody(js, 'addToSrQueue');
      if (!body) return false;
      const vm = require('vm');
      let storage = {};
      const ctx = {
        STORAGE: { WRONG_BANK: 'wb', SR_QUEUE: 'srq' },
        localStorage: {
          getItem: (k) => storage[k] === undefined ? null : storage[k],
          setItem: (k, v) => { storage[k] = String(v); }
        },
        loadSrQueue: () => {
          try { return JSON.parse(storage['srq'] || '[]'); } catch { return []; }
        },
        saveSrQueue: (q) => { storage['srq'] = JSON.stringify(q); },
        loadSrPrefs: () => ({ sessionSize: 30, topUp: true }),
        _srHash: (s) => 'h_' + s.length, // stub hash
        _srSchedule: (entry) => { entry.intervalDays = 1; return entry; },
        SR_QUEUE_CAP: 200,
        Date, JSON, Set, Object, Array, Number
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);

      // Pre-seed queue with a corrupt legacy entry: answer=null, options={A,B,C,D}
      const corruptEntry = {
        qHash: 'h_5',
        question: 'stem1',
        options: { A: 'a', B: 'b', C: 'c', D: 'd' },
        answer: null, // corruption from pre-v4.81.27 bug
        type: 'mcq',
        intervalDays: 4,
        easeFactor: 2.5,
        attempts: 1,
        correctStreak: 0,
        graduated: false,
        nextReview: Date.now() - 86400000 // due
      };
      storage['srq'] = JSON.stringify([corruptEntry]);

      // Re-enroll with a fresh question that has a valid answer letter
      vm.runInContext("addToSrQueue({question: 'stem1', options: {A:'a',B:'b',C:'c',D:'d'}, answer: 'C', type: 'mcq', explanation: 'Because.'})", ctx);

      const updated = JSON.parse(storage['srq'])[0];
      return updated.answer === 'C' && updated.explanation === 'Because.';
    } catch (e) { return false; }
  })());

// vm fixture #3 — non-reviewable types are rejected at enrollment.
test('v4.81.28 SR: vm fixture — order/cli-sim/topology types not enrolled',
  (() => {
    try {
      const body = _fnBody(js, 'addToSrQueue');
      if (!body) return false;
      const vm = require('vm');
      let storage = {};
      const ctx = {
        STORAGE: { SR_QUEUE: 'srq' },
        localStorage: {
          getItem: (k) => storage[k] === undefined ? null : storage[k],
          setItem: (k, v) => { storage[k] = String(v); }
        },
        loadSrQueue: () => {
          try { return JSON.parse(storage['srq'] || '[]'); } catch { return []; }
        },
        saveSrQueue: (q) => { storage['srq'] = JSON.stringify(q); },
        loadSrPrefs: () => ({ sessionSize: 30, topUp: true }),
        _srHash: (s) => 'h_' + s.length,
        _srSchedule: (entry) => entry,
        SR_QUEUE_CAP: 200,
        Date, JSON, Set, Object, Array, Number
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);

      // Order question — should NOT enroll
      const orderResult = vm.runInContext("addToSrQueue({question: 'arrange these', items: ['a','b','c'], correctOrder: [0,1,2], type: 'order'})", ctx);
      // CLI-sim — should NOT enroll
      const cliResult = vm.runInContext("addToSrQueue({question: 'cli sim', type: 'cli-sim'})", ctx);
      // Topology — should NOT enroll
      const topoResult = vm.runInContext("addToSrQueue({question: 'topology q', type: 'topology'})", ctx);
      // MCQ — SHOULD enroll
      const mcqResult = vm.runInContext("addToSrQueue({question: 'a question?', options: {A:'a',B:'b',C:'c',D:'d'}, answer: 'A', type: 'mcq'})", ctx);
      // Multi-select — SHOULD enroll
      const multiResult = vm.runInContext("addToSrQueue({question: 'choose two', options: {A:'a',B:'b',C:'c',D:'d',E:'e'}, answers: ['A','C'], type: 'multi-select'})", ctx);

      const queue = JSON.parse(storage['srq'] || '[]');
      return orderResult === null
        && cliResult === null
        && topoResult === null
        && mcqResult !== null
        && multiResult !== null
        && queue.length === 2; // only mcq + multi-select got in
    } catch (e) { return false; }
  })());

// v4.81.27: SR review render fix — letter-keyed options + multi-select
// self-grade fallback + addToSrQueue answer-preservation bug.
// User screenshot: SR review showed a multi-select question stem but
// no answer options rendered (Array.isArray check on letter-keyed
// options object failed). Same bug class as v4.81.5 diagnostic-options
// schema mismatch. PLUS addToSrQueue had a type-guard bug that stored
// MCQ answers as null because `typeof 'A' === 'number'` is false.
test('v4.81.27 SR: addToSrQueue preserves MCQ letter answer (not null)',
  (() => {
    const body = _fnBody(js, 'addToSrQueue') || '';
    // The actual code line should be `answer: (q.answer != null) ? q.answer : null`.
    // The old buggy line was `answer: typeof q.answer === 'number' ? q.answer : null`.
    // Look for the new pattern as an actual assignment (with leading `answer:`)
    // — that excludes any comments documenting the historical pre-fix code.
    return /answer:\s*\(q\.answer\s*!=\s*null\)/.test(body)
      && !/answer:\s*typeof q\.answer\s*===\s*['"]number['"]/.test(body);
  })());
test('v4.81.27 SR tombstone: pickedIdx-based comparison removed from auto-grade',
  (() => {
    const body = _fnBody(js, '_renderSrCard') || '';
    // Old: `idx === card.answer` (number-based)
    // New: `letter === correctLetter` (string-based)
    return !/idx\s*===\s*card\.answer/.test(body) && /letter\s*===\s*correctLetter/.test(body);
  })());
test('v4.81.27 SR: _renderSrCard handles letter-keyed options object',
  (() => {
    const body = _fnBody(js, '_renderSrCard') || '';
    return /Object\.keys\(optionMap\)\.sort\(\)/.test(body)
      && /typeof card\.options === ['"]object['"]/.test(body);
  })());
test('v4.81.27 SR: srPickAnswer accepts letter (was idx)',
  (() => {
    const body = _fnBody(js, 'srPickAnswer') || '';
    return /pickedLetter\s*=\s*letter/.test(body);
  })());
// v4.81.30 retarget: v4.81.27 self-grade-fallback assertion replaced with
// the v4.81.30 commit-self-grade equivalent. Multi-select cards no longer
// fall back — they get full auto-grade (Bug 2 from user feedback).
test('v4.81.30 retarget: render has commit-self-grade mode for legacy null-answer cards',
  (() => {
    const body = _fnBody(js, '_renderSrCard') || '';
    return /['"]commit-self-grade['"]/.test(body)
      && /sr-self-grade-banner/.test(body);
  })());
test('v4.81.27 SR CSS: .sr-self-grade-banner declared (still used for commit-self-grade mode)',
  /\.sr-self-grade-banner\s*\{/.test(css));
test('v4.81.27 SR CSS: .sr-options-readonly declared (legacy class — retained)',
  /\.sr-options-readonly\s*\.sr-option-readonly/.test(css));

// vm fixture #1 — letter-keyed MCQ renders 4 option buttons
test('v4.81.27 SR: vm fixture — MCQ with letter-keyed options renders 4 buttons',
  (() => {
    try {
      const body = _fnBody(js, '_renderSrCard');
      if (!body) return false;
      const vm = require('vm');
      const fakeHost = { _innerHTML: '', set innerHTML(v) { this._innerHTML = v; }, get innerHTML() { return this._innerHTML; } };
      const ctx = {
        document: { getElementById: (id) => id === 'sr-card-host' ? fakeHost : { textContent: '', style: {} } },
        _srSession: {
          cards: [{
            type: 'mcq',
            question: 'Test stem?',
            options: { A: 'first', B: 'second', C: 'third', D: 'fourth' },
            answer: 'C',
            topic: 'Test',
            intervalDays: 1,
            correctStreak: 0
          }],
          index: 0,
          pickedLetter: null,
          revealed: false
        },
        escHtml: (s) => String(s),
        Object, String, Array, Number,
        Math
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      vm.runInContext('_renderSrCard()', ctx);
      const html = fakeHost._innerHTML;
      // Should render 4 sr-option buttons with letters A,B,C,D
      const buttons = (html.match(/onclick="srPickAnswer\('[A-D]'\)"/g) || []);
      return buttons.length === 4
        && /data-letter="A"/.test(html)
        && /data-letter="D"/.test(html)
        && !/sr-self-grade-banner/.test(html); // should NOT fall back
    } catch (e) { return false; }
  })());

// v4.81.30 retargets the v4.81.27 self-grade-fallback fixtures. Multi-select
// cards now go to multi-auto mode (Bug 2 from user feedback "im just reading
// the answers and self grading"). The new multi-auto + commit-self-grade
// fixtures live in the v4.81.30 block above. These two are kept as light
// regression guards confirming the OLD auto-reveal-on-render behavior is
// definitively gone — the user's self-deception loophole stays closed.
test('v4.81.30 retire: multi-select with valid answers no longer routes to self-grade fallback',
  (() => {
    const body = _fnBody(js, '_renderSrCard') || '';
    // Multi-select with valid answers should now hit the multi-auto mode,
    // not the commit-self-grade fallback. Look for the explicit branch.
    return /['"]multi-auto['"]/.test(body)
      && /hasMultiAnswers/.test(body);
  })());
test('v4.81.30 retire: legacy null-answer cards still get a fallback (now commit-self-grade, not auto-reveal)',
  (() => {
    const body = _fnBody(js, '_renderSrCard') || '';
    return /['"]commit-self-grade['"]/.test(body);
  })());


test('v4.81.7 Retake: vm fixture — corruption signature detected',
  (() => {
    try {
      const body = _fnBody(js, '_isCorruptedPassPlan');
      if (!body) return false;
      const vm = require('vm');
      const ctx = { Math, JSON };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      // Signature 1: accPct=0 + seededCount<questionCount
      const corrupt1 = { passPlan: { accPct: 0, seededCount: 2, questionCount: 20 } };
      // Signature 2: predicted=420 + correctCount>0
      const corrupt2 = { passPlan: { predicted: 420, correctCount: 18 } };
      // Healthy: matches both fields' invariants
      const healthy = { passPlan: { accPct: 90, seededCount: 2, questionCount: 20, predicted: 805, correctCount: 18 } };
      // Genuine 0%: would seed all 20
      const genuineZero = { passPlan: { accPct: 0, seededCount: 20, questionCount: 20, predicted: 420, correctCount: 0 } };
      ctx.corrupt1 = corrupt1; ctx.corrupt2 = corrupt2; ctx.healthy = healthy; ctx.genuineZero = genuineZero;
      const r1 = vm.runInContext('_isCorruptedPassPlan(corrupt1)', ctx);
      const r2 = vm.runInContext('_isCorruptedPassPlan(corrupt2)', ctx);
      const r3 = vm.runInContext('_isCorruptedPassPlan(healthy)', ctx);
      const r4 = vm.runInContext('_isCorruptedPassPlan(genuineZero)', ctx);
      return r1 === true && r2 === true && r3 === false && r4 === false;
    } catch (e) { return false; }
  })());

test('v4.81.5 Diagnostic: render produces 4 option buttons (vm fixture with letter-keyed options)',
  (() => {
    try {
      const renderBody = _fnBody(js, '_renderDiagnosticQuestion');
      if (!renderBody) return false;
      const vm = require('vm');
      // Minimal jsdom-lite shim for document + element ops the function uses
      const elements = {};
      const make = (id) => {
        const el = {
          id, hidden: false, _children: [], _innerHTML: '', _classList: new Set(), _attrs: {},
          dataset: {},
          get innerHTML() { return this._innerHTML; },
          set innerHTML(v) { this._innerHTML = v; this._children = []; },
          appendChild(child) { this._children.push(child); },
          classList: { add: function(c) { el._classList.add(c); }, remove: function(c) { el._classList.delete(c); }, toggle: function(c, on) { if (on) el._classList.add(c); else el._classList.delete(c); } },
          setAttribute(k, v) { el._attrs[k] = v; },
          textContent: '',
          style: {}
        };
        return el;
      };
      ['diag-quiz-progress-fill', 'diag-quiz-progress-lbl', 'diag-quiz-meta', 'diag-quiz-question', 'diag-quiz-options', 'diag-quiz-next-btn', 'diag-quiz-hint'].forEach(id => { elements[id] = make(id); });
      const ctx = {
        document: {
          getElementById: (id) => elements[id] || null,
          querySelectorAll: () => [],
          createElement: () => {
            const el = make('btn');
            el.type = ''; el.className = ''; el.onclick = null;
            return el;
          }
        },
        _diagnosticSession: {
          questions: [{
            question: 'Test stem?',
            options: { A: 'first', B: 'second', C: 'third', D: 'fourth' },
            answer: 'C',
            topic: 'Test',
            difficulty: 'Mid'
          }],
          answers: [null],
          currentIdx: 0,
          pickedLetter: null,
          confidence: null
        },
        setQuestionText: (el, t) => { el.textContent = t; },
        escHtml: (s) => String(s),
        _refreshDiagnosticActions: () => {},
        Object, String, Number, Math
      };
      vm.createContext(ctx);
      vm.runInContext(renderBody, ctx);
      vm.runInContext('_renderDiagnosticQuestion()', ctx);
      const optsHost = elements['diag-quiz-options'];
      // 4 buttons appended, each with a letter
      if (optsHost._children.length !== 4) return false;
      const letters = optsHost._children.map(b => b.dataset.letter);
      return letters.join('') === 'ABCD';
    } catch (e) { return false; }
  })());

test('v4.81.3 Safety: pre-commit hook scans for MCP+setItem risk patterns',
  (() => {
    try {
      const hook = require('fs').readFileSync(require('path').join(ROOT, '.githooks', 'pre-commit'), 'utf8');
      return /mcp__Claude_in_Chrome__javascript_tool/.test(hook) || /localStorage.*setItem/.test(hook);
    } catch (_) { return false; }
  })());

// v4.81.24: cross-check that deploy-verify.js's REQUIRED_IDS list matches
// what's actually in index.html. Caught the v4.81.23 deploy-verification
// failure where the verifier still expected #todays-focus after we removed
// it. Future ship that removes/renames a DOM element will now fail UAT
// locally before it can fail Deploy Verification post-deploy.
test('v4.81.24 DeploySync: deploy-verify REQUIRED_IDS match live index.html',
  (() => {
    try {
      const verifierSrc = require('fs').readFileSync(require('path').join(ROOT, 'tests', 'deploy-verify.js'), 'utf8');
      const m = verifierSrc.match(/const REQUIRED_IDS\s*=\s*\[([\s\S]*?)\];/);
      if (!m) return false;
      const ids = m[1].match(/'[^']+'/g).map(s => s.slice(1, -1));
      const missing = ids.filter(id => !html.includes('id="' + id + '"'));
      if (missing.length > 0) {
        results.errors.push('deploy-verify REQUIRED_IDS missing in index.html: ' + missing.join(', '));
        return false;
      }
      return true;
    } catch (e) { return false; }
  })());

// v4.81.25: Order-question quality fix — Implement-before-Verify invariant
// + conflated-step rejection. User dogfood: a Hard ordering question
// produced a "correct order" with item 4 = "Document findings AND implement
// a permanent solution" — items 5 (Implement) and 7 (Document) of the
// CompTIA methodology are non-adjacent (Step 6 Verify sits between them),
// so smashing them in one item is structurally malformed AND placing it
// after a Verify item creates an Implement-after-Verify ordering error.
// Existing _tbTroubleshootingOrderOk also missed it because the gate was
// too tight (required "comptia"/"methodology"/"X-step" in stem; user's
// stem just said "troubleshooting steps when diagnosing...").
test('v4.81.25 OrderGuard: gate widened to catch generic "troubleshooting steps" stems',
  (() => {
    const body = _fnBody(js, '_tbTroubleshootingOrderOk') || '';
    return /troubleshooting step/.test(body)
      && /\b(?:order|sequence|arrange)\b/.test(body);
  })());
test('v4.81.25 OrderGuard: gate widened to fire on Identify+Document item-keyword combo',
  (() => {
    const body = _fnBody(js, '_tbTroubleshootingOrderOk') || '';
    return /hasIdentifyKw\s*&&\s*hasDocumentKw/.test(body);
  })());
test('v4.81.25 OrderGuard: implementIdx + verifyIdx variables declared',
  (() => {
    const body = _fnBody(js, '_tbTroubleshootingOrderOk') || '';
    return /\bimplementIdx\b/.test(body) && /\bverifyIdx\b/.test(body);
  })());
test('v4.81.25 OrderGuard: Implement-before-Verify ordering invariant enforced',
  (() => {
    const body = _fnBody(js, '_tbTroubleshootingOrderOk') || '';
    return /posImpl\s*>=\s*posVer/.test(body) || /posVer\s*<=\s*posImpl/.test(body);
  })());
test('v4.81.25 OrderGuard: conflated Implement+Document item rejected',
  (() => {
    const body = _fnBody(js, '_tbTroubleshootingOrderOk') || '';
    return /conflatedImplementDocIdx/.test(body);
  })());

// vm fixture #1 — the EXACT user-reported bug case rejected.
test('v4.81.25 OrderGuard: vm fixture — exact user bug case rejected (Implement+Document conflated item)',
  (() => {
    try {
      const body = _fnBody(js, '_tbTroubleshootingOrderOk');
      if (!body) return false;
      const vm = require('vm');
      const ctx = { Array, String };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      // Reproduce the user's screenshot exactly:
      const bug = {
        type: 'order',
        question: 'Arrange the following troubleshooting steps in the correct order when diagnosing a network connectivity issue reported by an end user.',
        items: [
          'Document findings and implement a permanent solution or workaround',                         // 0 — conflated, malformed
          'Gather information about the problem, including when it started and what is affected',       // 1 — Identify (step 1)
          'Test the solution and verify that connectivity is restored',                                 // 2 — Verify (step 6)
          'Narrow the scope by testing basic connectivity (ping, ipconfig) and reviewing logs to identify the root cause' // 3 — Theory + Test (steps 2-3-4)
        ],
        correctOrder: [1, 3, 2, 0] // matches the app's "correct order" — 1=Identify, 3=Theory, 2=Verify, 0=Document+Implement
      };
      ctx.bug = bug;
      const r = vm.runInContext('_tbTroubleshootingOrderOk(bug)', ctx);
      return r === false; // rejected
    } catch (e) { return false; }
  })());

// vm fixture #2 — Implement-after-Verify (without conflation) rejected.
test('v4.81.25 OrderGuard: vm fixture — Implement-after-Verify rejected even when items are clean',
  (() => {
    try {
      const body = _fnBody(js, '_tbTroubleshootingOrderOk');
      if (!body) return false;
      const vm = require('vm');
      const ctx = { Array, String };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const bad = {
        type: 'order',
        question: 'Arrange these troubleshooting steps in the correct order:',
        items: [
          'Identify the problem by gathering information',                              // 0 — step 1
          'Establish a theory of probable cause',                                       // 1 — step 2
          'Verify full system functionality and that connectivity is restored',         // 2 — step 6 (VERIFY)
          'Implement the solution or workaround to the problem',                        // 3 — step 5 (IMPLEMENT)
          'Document findings and outcomes for future reference'                         // 4 — step 7
        ],
        correctOrder: [0, 1, 2, 3, 4] // wrong: implement should be BEFORE verify
      };
      ctx.bad = bad;
      const r = vm.runInContext('_tbTroubleshootingOrderOk(bad)', ctx);
      return r === false; // rejected
    } catch (e) { return false; }
  })());

// vm fixture #3 — correct ordering passes (regression guard, no false positive).
test('v4.81.25 OrderGuard: vm fixture — correct 5-step ordering accepted',
  (() => {
    try {
      const body = _fnBody(js, '_tbTroubleshootingOrderOk');
      if (!body) return false;
      const vm = require('vm');
      const ctx = { Array, String };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const good = {
        type: 'order',
        question: 'Arrange these troubleshooting steps in the correct order:',
        items: [
          'Identify the problem by gathering information',
          'Establish a theory of probable cause',
          'Test the theory to determine cause',
          'Implement the solution or workaround',
          'Verify full system functionality is restored',
          'Document findings, actions, and outcomes for future reference'
        ],
        correctOrder: [0, 1, 2, 3, 4, 5]
      };
      ctx.good = good;
      const r = vm.runInContext('_tbTroubleshootingOrderOk(good)', ctx);
      return r === true; // accepted
    } catch (e) { return false; }
  })());

// vm fixture #4 — non-troubleshooting order question untouched.
test('v4.81.25 OrderGuard: vm fixture — non-troubleshooting order question passes through',
  (() => {
    try {
      const body = _fnBody(js, '_tbTroubleshootingOrderOk');
      if (!body) return false;
      const vm = require('vm');
      const ctx = { Array, String };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const unrelated = {
        type: 'order',
        question: 'Arrange these OSI layers in correct top-to-bottom order:',
        items: ['Application', 'Transport', 'Network', 'Data Link'],
        correctOrder: [0, 1, 2, 3]
      };
      ctx.unrelated = unrelated;
      const r = vm.runInContext('_tbTroubleshootingOrderOk(unrelated)', ctx);
      return r === true;
    } catch (e) { return false; }
  })());

