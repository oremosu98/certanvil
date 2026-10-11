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
    vm.runInContext('var examMode = true, examTimer = 7, examHardcore = false, examCurrent = 4, examEndTime = Date.now() + 3000000, _examLastSave = 0;' +
      'var examQuestions = [], examAnswers = []; for (var i = 0; i < 10; i++) { examQuestions.push(' + mcq.toString() + '(i)); examAnswers.push(' + blank.toString() + '()); }' +
      'examAnswers[2].chosen = "A";', S);
    vm.runInContext([fn('_examSaveState'), fn('examSavedState'), fn('_examClearState')].join('\n'), S);
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
      vm.runInContext('var examMode = ' + running + ', examTimer = ' + (running ? 7 : 'null') + ', examHardcore = false, examCurrent = 0, examEndTime = Date.now() + 60000, _examLastSave = 0;' +
        'var examQuestions = [' + JSON.stringify(mcq(1)) + '], examAnswers = [' + JSON.stringify(blank()) + '];' +
        'function _releaseExamWakeLock() {}' +
        'var _EXAM_OWN_PAGES = ["exam", "exam-results", "review", "loading"];', L);
      vm.runInContext([fn('_examSaveState'), fn('_examInProgress'), fn('examLeaveOk')].join('\n'), L);
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
    vm.runInContext([fn('_examAnswered'), fn('_examParSeconds'), fn('_examPaceText')].join('\n'), P);
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
  } catch (err) {
    test('Exam simulator: block (threw)', false);
    results.errors.push('340 exam simulator block threw: ' + err.message);
  }
})();
