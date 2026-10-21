// tests/uat/340-exam-simulator.js
// Scope: the Full Exam Simulator is safe to sit and honest to score (v8.162.0+).
//
// Why this module exists: a 2026-10-11 analysis (founder sits SY0-701 on
// Fri 16 Oct and planned daily sims) found that a reload lost the whole exam
// (state lived only in memory), the live sidebar left it silently with the
// clock still running, the clock paused while the tab was hidden, the
// questions were "Mixed" difficulty (easier than the real exam) and the
// result said "Exam-ready!" off a linear 100-900 conversion.
// Spec: docs/superpowers/specs/2026-10-11-exam-simulator-hardening-design.md

const { _fnBody, js, read, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Full Exam Simulator: safe to sit, honest to score ──\x1b[0m');
  try {
    function fn(name) {
      var m = new RegExp('function\\s+' + name + '\\s*\\(').exec(js);
      if (!m) throw new Error('missing fn ' + name);
      var i = js.indexOf('{', m.index), d = 0, j = i;
      for (; j < js.length; j++) { var c = js[j]; if (c === '{') d++; else if (c === '}') { d--; if (d === 0) { j++; break; } } }
      return js.slice(m.index, j);
    }
    function ctx(extra) {
      var store = {};
      var C = Object.assign({
        Math: Math, Date: Date, JSON: JSON, Array: Array, Object: Object,
        EXAM_STATE_KEY: 'nplus_exam_state', EXAM_TIME_SECONDS: 5400,
        localStorage: { getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } },
        clearInterval: function () {}, __store: store
      }, extra || {});
      vm.createContext(C);
      return C;
    }
    var mcq = function (i) { return { type: 'mcq', question: 'Q' + i, options: { A: 'a', B: 'b' }, answer: 'A' }; };
    var blank = function () { return { chosen: null, flagged: false, msChosen: [], orderSeq: [], cliRan: [], topoState: {} }; };

    // ── Saved progress ──
    var S = ctx();
    vm.runInContext('var examMode = true, examTimer = 7, examHardcore = false, examCurrent = 4, examEndTime = Date.now() + 3000000, _examLastSave = 0, examTimeLeft = 3000, _examPausedAt = 0, _examPausedMs = 0, _examPauses = 0;' +
      'var examQuestions = [], examAnswers = []; for (var i = 0; i < 10; i++) { examQuestions.push(' + mcq.toString() + '(i)); examAnswers.push(' + blank.toString() + '()); }' +
      'examAnswers[2].chosen = "A";', S);
    vm.runInContext([fn('_examPbqTouched'), fn('_examAnswered'), fn('_examSaveState'), fn('examSavedState'), fn('_examClearState')].join('\n'), S);
    vm.runInContext('_examSaveState();', S);
    var saved = vm.runInContext('examSavedState()', S);
    test('Exam: progress is saved (questions, answers, current question, deadline) and reads back',
      saved && saved.questions.length === 10 && saved.answers[2].chosen === 'A' && saved.current === 4 && saved.endTime > Date.now());
    vm.runInContext('_examClearState();', S);
    test('Exam: clearing the saved state leaves nothing to resume', vm.runInContext('examSavedState()', S) === null);
    S.__store.nplus_exam_state = JSON.stringify({ v: 1, endTime: Date.now() - 30 * 3600000, questions: [mcq(1)], answers: [blank()], current: 0 });
    test('Exam: a saved exam that ended more than a day ago is dropped, not offered for resume',
      vm.runInContext('examSavedState()', S) === null);
    S.__store.nplus_exam_state = '{not json';
    test('Exam: a corrupt saved state is ignored (never throws)', vm.runInContext('examSavedState()', S) === null);

    // ── Leaving asks first; yes = suspend (clock keeps running, state kept) ──
    function leaveRun(running, answer) {
      var L = ctx({ confirm: function () { L.__asked = true; return answer; } });
      vm.runInContext('var examMode = ' + running + ', examTimer = ' + (running ? 7 : 'null') + ', examHardcore = false, examCurrent = 0, examEndTime = Date.now() + 60000, _examLastSave = 0, examTimeLeft = 60, _examPausedAt = 0, _examPausedMs = 0, _examPauses = 0;' +
        'var examQuestions = [' + JSON.stringify(mcq(1)) + '], examAnswers = [' + JSON.stringify(blank()) + '];' +
        'function _releaseExamWakeLock() {}' +
        'var _EXAM_OWN_PAGES = ["exam", "exam-results", "review", "loading"];', L);
      vm.runInContext([fn('_examPbqTouched'), fn('_examAnswered'), fn('_examSaveState'), fn('_examInProgress'), fn('_examSuspend'), fn('examLeaveOk')].join('\n'), L);
      var ok = vm.runInContext('examLeaveOk()', L);
      return { ok: ok, asked: !!L.__asked, mode: vm.runInContext('examMode', L), timer: vm.runInContext('examTimer', L), saved: !!L.__store.nplus_exam_state };
    }
    var stay = leaveRun(true, false), go = leaveRun(true, true), idle = leaveRun(false, false);
    test('Exam: leaving a running exam asks first; "Cancel" keeps you in it with the clock running',
      stay.asked && stay.ok === false && stay.mode === true && stay.timer === 7);
    test('Exam: "OK" leaves, stops the in-page clock and keeps the saved exam to resume from Home',
      go.asked && go.ok === true && go.mode === false && go.timer === null && go.saved);
    test('Exam: with no exam running, navigation never prompts', idle.ok === true && !idle.asked);
    test('Exam: every way out is guarded (showPage away from the exam, and goSetup)',
      /examLeaveOk\(name\)/.test(_fnBody(js, 'showPage') || '') && /examLeaveOk\(\)/.test(_fnBody(js, 'goSetup') || '')
        && /_EXAM_OWN_PAGES\s*=\s*\['exam', 'exam-results', 'review', 'loading'\]/.test(js));

    // ── Real clock ──
    var vis = _fnBody(js, '_examOnVisibilityChange') || '';
    test('Exam: the clock no longer pauses while the tab is hidden (the real exam never stops)',
      vis && !/examEndTime\s*\+=/.test(vis) && /_examSaveState\(\)/.test(vis));

    // ── Exam-level questions ──
    var start = _fnBody(js, 'startExam') || '';
    test('Exam: batches ask for Exam Level, the last batch Hard; "Mixed" (easy recall) is gone',
      /'Hard \/ Tricky'/.test(start) && /'Exam Level'/.test(start) && !/MIXED_TOPIC,\s*'Mixed'/.test(start));

    // ── Pace ──
    var P = ctx();
    vm.runInContext('var examQuestions = [], examAnswers = [], examTimeLeft = 5400; for (var i = 0; i < 90; i++) { examQuestions.push({ type: "mcq" }); examAnswers.push({ chosen: null, msChosen: [], orderSeq: [], topoState: {} }); }' +
      'function setRun(mins, answered) { examTimeLeft = 5400 - mins * 60; examAnswers.forEach(function (a, i) { a.chosen = i < answered ? "A" : null; }); }', P);
    vm.runInContext([fn('_examPbqTouched'), fn('_examAnswered'), fn('_examParSeconds'), fn('_examPaceText')].join('\n'), P);
    function pace(m, a) { vm.runInContext('setRun(' + m + ',' + a + ')', P); return vm.runInContext('_examPaceText()', P); }
    test('Exam: pace reads "on pace" / "N min behind" / "N min ahead" (90 questions in 90 minutes)',
      pace(30, 30) === 'on pace' && pace(30, 25) === '5 min behind' && pace(30, 34) === '4 min ahead' && pace(0.5, 0) === '');

    // ── Honest score ──
    var sub = _fnBody(js, 'submitExam') || '';
    test('Exam: the result says the 100-900 score is an estimate and drops "Exam-ready!"',
      /treat this as an estimate/.test(sub) && !/Exam-ready!/.test(sub));

    // ── Resume on Home ──
    var home = read('features/home.js');
    test('Exam: Home offers "Resume your exam" from the saved state, or "see your result" once time is up',
      /nplus_exam_state/.test(home) && /Resume your exam/.test(home) && /resumeExam/.test(home) && /window\.resumeExam\s*=\s*resumeExam|resumeExam:\s*resumeExam/.test(js));

    // ══ Release 2 (v8.163.0): Sim Lab PBQs open the exam ══
    var PK = ctx({ simLabValidateScenario: function (s) { return { ok: !s.bad }; } });
    var bank = [];
    ['firewall', 'firewall', 'cli', 'cli', 'diagram', 'wireless', 'incident', 'incident'].forEach(function (a, i) { bank.push({ id: a + i, archetype: a }); });
    bank.push({ id: 'gen1' }, { id: 'gen2' }, { id: 'broken', archetype: 'vpntunnel', bad: true });
    PK.__bank = bank;
    vm.runInContext('var _SL_SERVED_KEY = "nplus_simlab_served"; function _slBank() { return __bank; }', PK);
    vm.runInContext([fn('_slServedFor'), fn('_slMarkServed'), fn('_slLeastServed'), fn('_slPickExamPbqs')].join('\n'), PK);
    var picks = vm.runInContext('_slPickExamPbqs("secplus", 4)', PK);
    var fmts = picks.map(function (s) { return s.archetype || 'generic'; });
    test('Exam PBQs: 4 picked, each a different format, never an invalid seed',
      picks.length === 4 && fmts.filter(function (f, i) { return fmts.indexOf(f) === i; }).length === 4 && fmts.indexOf('vpntunnel') === -1);
    var servedNow = JSON.parse(PK.__store.nplus_simlab_served || '{}').secplus || {};
    test('Exam PBQs: the picked seeds are marked served (the next sim gets different ones)',
      picks.every(function (s) { return servedNow[s.id] > 0; }));
    var picks2 = vm.runInContext('_slPickExamPbqs("secplus", 4)', PK);
    test('Exam PBQs: the next sim prefers formats it has not just used',
      picks2.filter(function (s) { return picks.some(function (p) { return p.id === s.id; }); }).length === 0);

    var ex = read('features/exam.js');
    test('Exam PBQs: the exam picks them before generating, fills the rest with MCQs, and keeps the old injector only as a fallback',
      /pickExamPbqs\(/.test(start) && /MCQ_TARGET\s*=\s*EXAM_QUESTION_COUNT\s*-\s*_pbqs\.length/.test(start)
        && /type:\s*'simlab'/.test(start) && /else \{[\s\S]{0,160}injectPBQs\(examQuestions, MIXED_TOPIC, 2\)/.test(start));
    test('Exam PBQs: a PBQ renders in the exam card through Sim Lab (own Submit removed, answers captured live)',
      /_examRenderPbq\(q, box, ans\)/.test(_fnBody(js, 'renderExam') || '') && /mountScenario\(host, q\.simlab/.test(ex) && /simLabSubmitScenario"\]'\)/.test(ex));

    // Scoring: partial credit per PBQ
    var T = ctx();
    vm.runInContext(fn('_examPbqTouched'), T);
    test('Exam PBQs: a PBQ counts as answered only once a step holds a real answer',
      vm.runInContext('!_examPbqTouched(null) && !_examPbqTouched({s1:{slots:{}}, s2:{selected:[]}}) && _examPbqTouched({s1:{slots:{a:"x"}}})', T));
    test('Exam PBQs: score = MCQs right + PBQ step fractions; PBQs stay out of the wrong bank and topic splits',
      /const points = correct \+ pbqPartial/.test(sub) && /scaledExamScore\(points, total\)/.test(sub)
        && /no wrong bank \/ SR for PBQs/.test(sub) && /q\.type === 'simlab'\) return;/.test(ex));
    test('Exam PBQs: review shows each PBQ step with ✓/✗ and its explanation',
      /qType === 'simlab' && q\.simlab/.test(js) && /'simlab': 'PBQ'/.test(js));

    // Styling: every page-scoped Sim Lab rule also styles the exam's PBQ panel
    var dg = read('dg-system.css').replace(/\/\*[\s\S]*?\*\//g, '');
    var missing = [];
    (dg.match(/[^{}]+\{/g) || []).forEach(function (pre) {
      var sel = pre.slice(0, -1).trim();
      if (sel.charAt(0) === '@' || !/#page-sim-lab(?![\w-])/.test(sel)) return;
      var parts = sel.split(',').map(function (x) { return x.trim(); });
      parts.forEach(function (x) {
        if (/#page-sim-lab(?![\w-])/.test(x) && parts.indexOf(x.replace(/#page-sim-lab(?![\w-])/g, '#page-exam .exam-pbq')) === -1) missing.push(x);
      });
    });
    test('Exam PBQs: every #page-sim-lab rule in dg-system.css has a "#page-exam .exam-pbq" twin (else exam PBQs render half-styled)',
      missing.length === 0);
    if (missing.length) results.errors.push('Sim Lab selectors with no exam-PBQ twin: ' + missing.slice(0, 5).join(' | '));

    // ══ v8.164.0: pause (founder: "what if i have something critical come up like a phone call") ══
    var PZ = ctx();
    vm.runInContext('var examMode = true, examTimer = 7, examHardcore = false, examCurrent = 0, examEndTime = Date.now() + 600000, examTimeLeft = 600, _examLastSave = 0;' +
      'var examQuestions = [' + JSON.stringify(mcq(1)) + '], examAnswers = [' + JSON.stringify(blank()) + '];' +
      'var _EXAM_OWN_PAGES = ["exam", "exam-results", "review", "loading"];' +
      'var __started = 0; function startExamTimer() { __started++; examEndTime = Date.now() + examTimeLeft * 1000; examTimer = 9; }' +
      'function _releaseExamWakeLock() {} function _examRenderPaused() {} var document = { getElementById: function () { return null; } };', PZ);
    vm.runInContext('var _examPausedAt = 0, _examPausedMs = 0, _examPauses = 0;' + [fn('_examPbqTouched'), fn('_examAnswered'), fn('_examSaveState'), fn('examSavedState'),
      fn('examIsPaused'), fn('examTogglePause'), fn('_examPause'), fn('_examResumeFromPause'), fn('_examInProgress'), fn('_examSuspend'), fn('examLeaveOk')].join('\n'), PZ);
    vm.runInContext('examTogglePause();', PZ);
    var paused = vm.runInContext('({ p: examIsPaused(), timer: examTimer, left: examTimeLeft, st: examSavedState() })', PZ);
    test('Exam pause: Pause stops the clock, keeps the time left and saves the exam as paused',
      paused.p === true && paused.timer === null && paused.left >= 599 && paused.st && paused.st.paused === true && paused.st.timeLeft === paused.left);
    var leftQuietly = vm.runInContext('(function () { var asked = false; confirm = function () { asked = true; return false; }; var ok = examLeaveOk("setup"); return { ok: ok, asked: asked, mode: examMode }; })()', PZ);
    test('Exam pause: leaving while paused needs no prompt (the clock is already stopped) and keeps it saved',
      leftQuietly.ok === true && leftQuietly.asked === false && leftQuietly.mode === false && vm.runInContext('examSavedState().paused', PZ) === true);
    vm.runInContext('examMode = true; examTogglePause();', PZ);
    var resumed = vm.runInContext('({ p: examIsPaused(), started: __started, timer: examTimer, pauses: _examPauses })', PZ);
    test('Exam pause: Resume restarts the clock from the time that was left and counts the pause',
      resumed.p === false && resumed.started === 1 && resumed.timer === 9 && resumed.pauses === 1);
    PZ.__store.nplus_exam_state = JSON.stringify({ v: 1, paused: true, savedAt: Date.now() - 3 * 86400000, endTime: Date.now() - 2 * 86400000, timeLeft: 1500, questions: [mcq(1)], answers: [blank()] });
    test('Exam pause: a paused exam stays resumable for a week even though its old deadline has passed',
      !!vm.runInContext('examSavedState()', PZ));
    var resumeBody = _fnBody(js, 'resumeExam') || '';
    test('Exam pause: resuming a paused exam uses the saved time left, not the old deadline',
      /if \(st\.paused\)[\s\S]{0,120}examTimeLeft = Math\.max\(0, st\.timeLeft/.test(resumeBody));
    test('Exam pause: available in every exam (Strict Mode removed); answer shortcuts stand down while paused; the result reports the pause',
      !/examHardcore/.test(_fnBody(js, 'examTogglePause') || '') && !/hardcore-active/.test(read('dg-system.css'))
        && /examIsPaused\(\)\) return;/.test(read('features/quiz-engine.js')) && /The real exam has no pause\./.test(_fnBody(js, 'submitExam') || ''));
    test('Exam pause: Home shows "paused, N min left" for a paused exam',
      /paused, \$\{left\} min left/.test(read('features/home.js')));
  } catch (err) {
    test('Exam simulator: block (threw)', false);
    results.errors.push('340 exam simulator block threw: ' + err.message);
  }
})();
