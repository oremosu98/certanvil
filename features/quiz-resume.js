// Persona bundle Task 6: resume a practice quiz after the app closes.
// Spec: docs/superpowers/specs/2026-10-30-quiz-resume-design.md
// Eager classic <script defer> after quiz-engine.js, so the quiz state lets in app.js
// (questions, current, log, ...) are read and written directly as globals.
//
// The rule the founder called critical: a resumed quiz is EXACTLY the quiz that was
// started. The saved questions are restored as they were (wording, options, answers,
// explanations, order) with the answers and flags kept. Nothing is regenerated or
// fetched. A save that can't be restored exactly is discarded, never half-restored.
//
// Saved after every answer and when the app goes to the background (pagehide,
// visibilitychange → hidden). Cleared on finish, on leaving with ✕, and when a new
// quiz starts. Local only: one per subdomain, which is one per cert, and the cert is
// checked as well (A+ Core 1 / Core 2 share a subdomain). Not cloud-synced.
// Skipped: the Exam Simulator (its own pause), Gauntlet and Why-Not (timed runs), and
// guided sessions (a single step can't be restored without the rest of the plan).
(function () {
  'use strict';

  const QUIZ_RESUME_KEY = 'nplus_quiz_resume';
  const QUIZ_RESUME_TTL_MS = 24 * 60 * 60 * 1000;

  // A quiz this feature may save: a live practice quiz, not one of the excluded modes.
  function _quizResumeEligible() {
    if (typeof examMode !== 'undefined' && examMode) return false;
    if (typeof gauntletMode !== 'undefined' && gauntletMode) return false;
    if (typeof whyNotMode !== 'undefined' && whyNotMode) return false;
    if (typeof sessionMode !== 'undefined' && sessionMode) return false;
    return Array.isArray(questions) && questions.length > 0;
  }

  // The stored shape. Log entries keep every field but swap the question object for its
  // index (qi), so a restored entry points at the restored question by identity — the
  // quiz engine finds answers with log.find(e => e.q === q).
  function _quizResumeSnapshot(now) {
    const qs = questions;
    return {
      v: 1, cert: CURRENT_CERT, savedAt: now,
      questions: qs, current, score, streak, bestStreak, answered,
      log: log.map(function (e) {
        const o = Object.assign({}, e); delete o.q; o.qi = qs.indexOf(e.q); return o;
      }),
      quizFlags, topic, activeQuizTopic, diff, qCount, dailyChallengeMode, wrongDrillMode,
      msSelections, orderSequence,
      elapsed: (typeof _sessionStartTs === 'number' && _sessionStartTs > 0) ? Math.max(0, now - _sessionStartTs) : 0
    };
  }

  function quizResumeSave() {
    try {
      if (!_quizResumeEligible()) return false;
      localStorage.setItem(QUIZ_RESUME_KEY, JSON.stringify(_quizResumeSnapshot(Date.now())));
      return true;
    } catch (_) { return false; }   // storage full or an unserialisable question: the quiz still runs
  }

  function quizResumeClear() {
    try { localStorage.removeItem(QUIZ_RESUME_KEY); } catch (_) {}
  }

  // Pure: can this save be restored exactly? Fresh (<24h), same cert, every question
  // whole, every answer pointing at a real question, nothing out of range.
  function _quizResumeValid(st, cert, now) {
    if (!st || typeof st !== 'object' || st.v !== 1) return false;
    if (st.cert !== cert) return false;
    if (typeof st.savedAt !== 'number' || !(now - st.savedAt < QUIZ_RESUME_TTL_MS) || st.savedAt > now + 60000) return false;
    const qs = st.questions;
    if (!Array.isArray(qs) || !qs.length) return false;
    if (!qs.every(function (q) { return q && typeof q === 'object' && typeof q.question === 'string' && q.question && (Array.isArray(q.options) || typeof q.options === 'object' && q.options || typeof q.type === 'string' && q.type); })) return false;
    if (!Array.isArray(st.log) || st.log.length > qs.length) return false;
    const seen = {};
    for (let i = 0; i < st.log.length; i++) {
      const e = st.log[i];
      if (!e || !Number.isInteger(e.qi) || e.qi < 0 || e.qi >= qs.length || seen[e.qi]) return false;
      seen[e.qi] = true;
    }
    if (!Number.isInteger(st.current) || st.current < 0 || st.current >= qs.length) return false;
    if (st.quizFlags !== undefined && !Array.isArray(st.quizFlags)) return false;
    return true;
  }

  // Pure: what Home shows.
  function _quizResumeSummary(st) {
    const total = st.questions.length;
    const done = st.log.length;
    const t = String(st.activeQuizTopic || st.topic || '');
    // Home writes "{topicLabel} · {n} of {m} answered", so the label carries no middle dot or dash.
    const label = st.dailyChallengeMode ? 'Daily Challenge'
      : st.wrongDrillMode ? 'Mistakes drill'
      : t.indexOf('Multi: ') === 0 && typeof _parseMultiTopicSentinel === 'function' ? _parseMultiTopicSentinel(t).join(', ')
      : t.indexOf('Mixed') === 0 ? 'Mixed topics'
      : t.replace(/\s*[—·]\s*/g, ', ');
    return { topicLabel: label, answered: done, total, left: Math.max(0, total - done), savedAt: st.savedAt };
  }

  // The saved quiz, or null. One that can't be restored exactly is discarded quietly.
  function _quizResumeRead() {
    let st = null;
    try { st = JSON.parse(localStorage.getItem(QUIZ_RESUME_KEY) || 'null'); } catch (_) { st = null; }
    if (!st) { quizResumeClear(); return null; }
    if (!_quizResumeValid(st, CURRENT_CERT, Date.now())) { quizResumeClear(); return null; }
    return st;
  }

  function quizResumeState() {
    const st = _quizResumeRead();
    return st ? _quizResumeSummary(st) : null;
  }

  // Put the saved quiz back exactly as it was and show the question it was on.
  // Never refetches. Returns false (and discards the save) when there is nothing to resume.
  function resumeQuiz() {
    const st = _quizResumeRead();
    if (!st) return false;
    if (typeof _resetDrillModes === 'function') _resetDrillModes();
    gauntletMode = false; whyNotMode = false; examMode = false; sessionMode = false;
    questions = st.questions;
    log = st.log.map(function (e) {
      const o = Object.assign({}, e); const qi = o.qi; delete o.qi; o.q = questions[qi]; return o;
    });
    current = st.current;
    score = +st.score || 0; streak = +st.streak || 0; bestStreak = +st.bestStreak || 0;
    answered = (typeof st.answered === 'number') ? st.answered : log.length;
    quizFlags = questions.map(function (_, i) { return !!(st.quizFlags && st.quizFlags[i]); });
    if (st.topic) topic = st.topic;
    if (st.activeQuizTopic) activeQuizTopic = st.activeQuizTopic;
    if (st.diff) diff = st.diff;
    if (st.qCount) qCount = st.qCount;
    dailyChallengeMode = !!st.dailyChallengeMode;
    wrongDrillMode = !!st.wrongDrillMode;
    msSelections = Array.isArray(st.msSelections) ? st.msSelections : [];
    orderSequence = Array.isArray(st.orderSequence) ? st.orderSequence : [];
    topoDevices = {};
    _sessionStartTs = Date.now() - (+st.elapsed || 0);
    window._quizResumeRestored = true;   // render(): phones keep pick-then-confirm on a resumed quiz
    if (typeof showCacheNotice === 'function') showCacheNotice(false);
    showPage('quiz');
    render();
    return true;
  }

  // The app going to the background: save the quiz on screen. iOS can close a
  // backgrounded app without another event, so this is the last chance.
  function _quizResumeOnHide() {
    const page = document.getElementById('page-quiz');
    if (page && page.classList.contains('active')) quizResumeSave();
  }
  window.addEventListener('pagehide', _quizResumeOnHide);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') _quizResumeOnHide();
  });

  window.QUIZ_RESUME_KEY = QUIZ_RESUME_KEY;
  window.quizResumeSave = quizResumeSave;
  window.quizResumeClear = quizResumeClear;
  window.quizResumeState = quizResumeState;
  window.resumeQuiz = resumeQuiz;
  window._quizResumeValid = _quizResumeValid;
  window._quizResumeSummary = _quizResumeSummary;
})();
