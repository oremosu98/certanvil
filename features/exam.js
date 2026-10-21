/* Exam mode — extracted from app.js (#138 wave 6).
 * Lazy-loaded feature. Mechanical move: function bodies identical to app.js @ edfa740.
 * State vars (_examWakeLock, _examHiddenAt) moved here.
 * Shared state (examMode, examQuestions, examAnswers, examCurrent,
 * examTimer, examTimeLeft, examEndTime) STAYS in app.js (quiz engine reads them).
 * _scaledExamScore STAYS in app.js (used by MILESTONE_CHECKS). */
(function () {
  'use strict';

  let _examWakeLock = null;

  // ── v8.162.0: saved exam state ─────────────────────────────────────────
  // The exam lived only in memory, so a refresh, a crash, iOS evicting the tab
  // or the "New version → Refresh" banner lost up to 90 minutes. It is now
  // saved on every render and every 5s, and Home offers to resume it. Local
  // only (per-subdomain key, so per cert). Spec:
  // docs/superpowers/specs/2026-10-11-exam-simulator-hardening-design.md
  const EXAM_STATE_KEY = 'nplus_exam_state';
  let _examLastSave = 0;
  function _examSaveState() {
    if (!examMode || !Array.isArray(examQuestions) || !examQuestions.length) return;
    try {
      localStorage.setItem(EXAM_STATE_KEY, JSON.stringify({
        v: 1, savedAt: Date.now(), endTime: examEndTime, current: examCurrent,
        questions: examQuestions, answers: examAnswers,
        answered: examAnswers.filter(_examAnswered).length,  // for Home's resume tile
        paused: !!_examPausedAt, pausedAt: _examPausedAt || 0, timeLeft: examTimeLeft,   // v8.164.0
        pausedMs: _examPausedMs, pauses: _examPauses
      }));
      _examLastSave = Date.now();
    } catch (_) { /* storage full: the exam still runs, it just can't be resumed */ }
  }
  function _examClearState() { try { localStorage.removeItem(EXAM_STATE_KEY); } catch (_) {} }
  // The saved exam, or null. One that ended over a day ago is dropped.
  function examSavedState() {
    try {
      const st = JSON.parse(localStorage.getItem(EXAM_STATE_KEY) || 'null');
      if (!st || !Array.isArray(st.questions) || !st.questions.length || !Array.isArray(st.answers) || typeof st.endTime !== 'number') return null;
      // Running exams expire a day after their deadline; a paused one keeps a week.
      const stale = st.paused ? (st.savedAt || 0) < Date.now() - 7 * 86400000 : st.endTime < Date.now() - 86400000;
      if (stale) { _examClearState(); return null; }
      return st;
    } catch (_) { return null; }
  }
  // ── v8.164.0: pause ──────────────────────────────────────────────────
  // Founder: "what if i have something critical come up like a phone call".
  // Pause stops the clock and covers the questions (no reading ahead while
  // paused); Resume restarts it with the time that was left. Leaving while
  // paused keeps it paused; Home offers resume. The result says how long the
  // exam was paused, since the real exam has no pause.
  let _examPausedAt = 0, _examPausedMs = 0, _examPauses = 0;
  function examIsPaused() { return !!_examPausedAt; }
  function examTogglePause() {
    if (_examPausedAt) _examResumeFromPause(); else _examPause();
  }
  function _examPause() {
    if (!examMode || !examTimer) return;
    clearInterval(examTimer); examTimer = null;
    examTimeLeft = Math.max(0, Math.round((examEndTime - Date.now()) / 1000));
    _examPausedAt = Date.now(); _examPauses++;
    _releaseExamWakeLock();
    _examSaveState();
    _examRenderPaused();
  }
  function _examResumeFromPause() {
    if (!_examPausedAt) return;
    _examPausedMs += Date.now() - _examPausedAt; _examPausedAt = 0;
    _examRenderPaused();
    startExamTimer();   // deadline = now + the time that was left
  }
  function _examBindPause() {
    const pb = document.getElementById('exam-pause-btn');
    if (pb && !pb._examBound) { pb._examBound = true; pb.addEventListener('click', examTogglePause); }
  }
  function _examRenderPaused() {
    const page = document.getElementById('page-exam');
    if (!page) return;
    const on = !!_examPausedAt;
    page.classList.toggle('is-paused', on);
    const pb = document.getElementById('exam-pause-btn');
    if (pb) { pb.textContent = on ? 'Resume' : 'Pause'; pb.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    let card = document.getElementById('exam-paused');
    if (!on) { if (card) card.remove(); return; }
    if (!card) {
      card = document.createElement('div');
      card.id = 'exam-paused'; card.className = 'exam-paused'; card.setAttribute('role', 'status');
      const bar = page.querySelector('.exam-topbar');
      if (bar) bar.insertAdjacentElement('afterend', card); else page.appendChild(card);
    }
    const m = Math.floor(examTimeLeft / 60), sec = examTimeLeft % 60;
    card.innerHTML = '<div class="exam-paused-k">Exam paused</div>'
      + '<div class="exam-paused-t">' + m + ':' + String(sec).padStart(2, '0') + ' left. The clock is stopped.</div>'
      + '<button type="button" class="btn btn-primary exam-paused-btn">Resume exam</button>'
      + '<p class="exam-paused-note">The real exam has no pause, so keep this for real interruptions.</p>';
    card.querySelector('.exam-paused-btn').addEventListener('click', _examResumeFromPause);
  }
  function _examInProgress() { return !!(examMode && examTimer); }
  // Leaving a running exam asks first. Yes = suspend: the in-page clock stops,
  // the saved deadline keeps running (like the real exam), Home offers resume.
  // Called by showPage(target) and goSetup(); the exam's own pages pass through.
  const _EXAM_OWN_PAGES = ['exam', 'exam-results', 'review', 'loading'];
  function examLeaveOk(target) {
    if (_EXAM_OWN_PAGES.indexOf(target) !== -1) return true;
    if (examMode && _examPausedAt) { _examSaveState(); examMode = false; return true; }   // paused: the clock is already stopped
    if (!_examInProgress()) return true;
    if (!confirm('Leave the exam? The clock keeps running, and you can resume from Home.')) return false;
    _examSaveState();
    clearInterval(examTimer); examTimer = null; examMode = false;
    _releaseExamWakeLock();
    return true;
  }
  async function resumeExam() {
    const st = examSavedState();
    if (!st) { if (typeof goSetup === 'function') goSetup(); return; }
    if (st.questions.some(q => q && q.type === 'simlab')) await _examEnsureSimLab();   // v8.163.0
    examMode = true;
    if (typeof _resetDrillModes === 'function') _resetDrillModes();
    wrongDrillMode = false; navOpen = false;
    examQuestions = st.questions; examAnswers = st.answers;
    examCurrent = Math.max(0, Math.min(st.current || 0, examQuestions.length - 1));
    _examPauses = st.pauses || 0; _examPausedMs = st.pausedMs || 0; _examPausedAt = 0;
    if (st.paused) {   // v8.164.0: a paused exam resumes with the time it had; the pause ends now
      examTimeLeft = Math.max(0, st.timeLeft || 0);
      _examPausedMs += Math.max(0, Date.now() - (st.pausedAt || Date.now()));
    } else {
      examTimeLeft = Math.max(0, Math.round((st.endTime - Date.now()) / 1000));
    }
    _examRenderPaused(); _examBindPause();
    if (examTimeLeft <= 0) { submitExam(); return; }   // time ran out while away: mark what was answered
    showPage('exam');
    renderExam();
    startExamTimer();
  }
  // Answered = any answer recorded (shared by the pace line).
  function _examAnswered(a) {
    return !!a && (a.chosen !== null && a.chosen !== undefined || (a.msChosen || []).length > 0 ||
      (a.orderSeq || []).length > 0 || Object.keys(a.topoState || {}).length > 0 || _examPbqTouched(a.sl));
  }
  // Seconds budgeted per question: a PBQ gets its Sim Lab par (estMinutes x 0.9),
  // the multiple-choice questions share the rest of the clock evenly.
  function _examParSeconds() {
    let pbqSec = 0, nMcq = 0;
    const pars = examQuestions.map(q => {
      if (q && q.type === 'simlab') { const sec = Math.round((((q.simlab && q.simlab.estMinutes) || 6) * 0.9) * 60); pbqSec += sec; return sec; }
      nMcq++; return null;
    });
    const mcq = nMcq ? Math.max(30, (EXAM_TIME_SECONDS - pbqSec) / nMcq) : 0;
    return pars.map(p => (p === null ? mcq : p));
  }
  // "on pace" within 2 minutes, else "N min behind" / "N min ahead".
  function _examPaceText() {
    if (!Array.isArray(examQuestions) || !examQuestions.length) return '';
    const elapsed = EXAM_TIME_SECONDS - examTimeLeft;
    if (elapsed < 60) return '';
    const pars = _examParSeconds();
    let used = 0;
    examAnswers.forEach((a, i) => { if (_examAnswered(a)) used += pars[i]; });
    const diff = used - elapsed;
    if (Math.abs(diff) < 120) return 'on pace';
    const m = Math.round(Math.abs(diff) / 60);
    return diff > 0 ? m + ' min ahead' : m + ' min behind';
  }

  // ── v8.163.0: Sim Lab PBQs inside the exam ──────────────────────────────
  // The real SY0-701 opens with a few PBQs. Security+ had none here (the old
  // injectPBQs banks are Network+ only), so the exam now opens with
  // EXAM_PBQ_COUNT Sim Lab PBQs that share the navigator, flags and clock.
  const EXAM_PBQ_COUNT = 4;
  // Sim Lab is lazy-loaded; never let a slow load hold up the exam build.
  function _examEnsureSimLab() {
    return new Promise(function (resolve) {
      if (window._simLab && window._simLab.mountScenario) { resolve(true); return; }
      const t = setTimeout(function () { resolve(false); }, 8000);
      if (typeof _ensureSimLabLoaded !== 'function') { clearTimeout(t); resolve(false); return; }
      _ensureSimLabLoaded(function () { clearTimeout(t); resolve(!!(window._simLab && window._simLab.mountScenario)); });
    });
  }
  // A PBQ counts as answered once any step holds a real answer.
  function _examPbqTouched(sl) {
    function filled(v) {
      if (v === null || v === undefined || v === '' || v === false) return false;
      if (Array.isArray(v)) return v.some(filled);
      if (typeof v === 'object') return Object.keys(v).some(function (k) { return filled(v[k]); });
      return true;
    }
    return !!sl && filled(sl);
  }
  function _examScorePbq(q, a) {
    try {
      if (typeof simLabScoreScenario === 'function' && q && q.simlab) return simLabScoreScenario(q.simlab, (a && a.sl) || {});
    } catch (_) {}
    return { perStep: {}, correct: 0, total: 0, fraction: 0 };
  }
  // Mount the PBQ into the exam card. Its own Submit button goes (the exam
  // submits everything at the end); answers are captured live and restored
  // when you come back, exactly as Sim Lab's own exam mode does.
  function _examRenderPbq(q, box, ans) {
    const host = document.createElement('div');
    host.className = 'exam-pbq';
    box.appendChild(host);
    if (!window._simLab || typeof window._simLab.mountScenario !== 'function' || !q.simlab) {
      host.textContent = 'This PBQ could not load. Move on; it counts as unanswered.';
      return;
    }
    const prior = ans.sl || null;
    window._simLab.mountScenario(host, q.simlab, {
      initial: prior, onSubmit: function () {},
      onReset: function () { ans.sl = null; renderExam(); }   // v8.166.0: Reset clears this PBQ's saved answers too
    });
    const own = host.querySelector('[data-action="simLabSubmitScenario"]');
    if (own) own.remove();
    const live = window.__slResponses || {};
    if (prior) Object.keys(prior).forEach(function (k) { if (!(k in live)) live[k] = prior[k]; });
    ans.sl = live;   // the object every step writes into
  }
  // v4.54.9: exam-mode segmented progress dots. Mirrors the quiz version but
  // reads examAnswers[i].chosen/msChosen/orderSeq to decide per-question state.
  // In exam mode we can't know correct/wrong until submit, so we only distinguish
  // "answered" (green-ish) vs "flagged" (yellow) vs "current" vs "pending".
  function _renderExamProgressDots() {
    const el = document.getElementById('exam-prog-dots');
    if (!el || !Array.isArray(examQuestions)) return;
    const n = examQuestions.length;
    const cells = [];
    for (let i = 0; i < n; i++) {
      const ans = examAnswers[i] || {};
      const answered = (ans.chosen !== null && ans.chosen !== undefined) ||
                       (Array.isArray(ans.msChosen) && ans.msChosen.length > 0) ||
                       (Array.isArray(ans.orderSeq) && ans.orderSeq.length > 0) ||
                       (ans.topoState && Object.keys(ans.topoState).length > 0) ||
                       _examPbqTouched(ans.sl);   // v8.163.0
      let cls = 'qpd-cell';
      let aria;
      if (i === examCurrent) { cls += ' qpd-now'; aria = `Question ${i + 1}, current`; }
      else if (ans.flagged) { cls += ' qpd-flagged'; aria = `Question ${i + 1}, flagged`; }
      else if (answered) { cls += ' qpd-done'; aria = `Question ${i + 1}, answered`; }
      else { aria = `Question ${i + 1}, pending`; }
      cells.push(`<span class="${cls}" role="presentation" title="${aria}"></span>`);
    }
    el.innerHTML = cells.join('');
  }

  // v7.96.0: _sessionStartTs (app.js top level) and _formatElapsed (app.js
  // top level, see comment there) moved out of this closure — this file is
  // lazy-loaded, so a helper declared only here is unusable by eager modules
  // that call it as a bare identifier (e.g. quiz-engine.js's finish()).

  // ══════════════════════════════════════════
  // START EXAM SIMULATION
  // ══════════════════════════════════════════
  async function startExam() {
    // v7.46.0: the Exam Simulator is Pro-only (Simi, 2026-06-11). The quota
    // and size gates below only matter for Pro edge states now.
    if (!_gateProOnly('The Exam Simulator', {
      title: 'The Exam Simulator is a Pro feature',
      body: `${EXAM_QUESTION_COUNT} questions against a ${Math.round(EXAM_TIME_SECONDS / 60)}-minute clock, scored ${EXAM_MIN_SCORE}-${EXAM_MAX_SCORE} like test day. Free covers your daily practice; the full rehearsal is Pro.`  // v8.128.0: per-cert format
    })) return;
    if (!_gateActivityForQuota('exam simulator')) return;
    if (!_gateSessionSizeForQuota(90, { mode: 'exam' })) return;
    const key = document.getElementById('api-key').value.trim();
    const errBox = document.getElementById('setup-err');
    errBox.classList.add('is-hidden');
    const keyErr = validateApiKey(key);
    if (keyErr) { errBox.textContent = keyErr; errBox.classList.remove('is-hidden'); showSetupError(); return; }
    apiKey = key;
    localStorage.setItem(STORAGE.KEY, key);

    examMode = true;
    if (typeof _resetDrillModes === 'function') _resetDrillModes();  // v8.153.0
    wrongDrillMode = false;
    examQuestions = [];
    examAnswers   = [];
    examCurrent   = 0;
    examTimeLeft  = EXAM_TIME_SECONDS;
    navOpen       = false;
    _examPausedAt = 0; _examPausedMs = 0; _examPauses = 0;   // v8.164.0
    _examRenderPaused(); _examBindPause();

    showPage('loading');
    document.getElementById('loading-msg').textContent = 'Building 90-question exam\u2026';
    // v4.82.1: use the unified smooth loading-progress module so exam mode
    // gets the same eased transition + shimmer overlay as quiz/diagnostic.
    // The label updates per-batch use _loadingProgressUpdate(label, pct).
    _loadingProgressBegin('Building 90-question exam\u2026');
    // v8.164.0: Cancel on the loading screen. Checked after every await so a
    // cancelled build never fills examQuestions or opens the exam later.
    const _g = (typeof _genToken === 'function') ? _genToken() : null;
    const _alive = () => typeof _genAlive !== 'function' || _genAlive(_g);
    const lbl = document.getElementById('load-progress-label'); // kept for legacy textContent writes

    // v4.43.5 — Exam now runs the same validation pipeline as quiz mode (was
    // shipping raw Haiku batches). Per-batch: over-request → Sonnet semantic pass
    // → programmatic validator → retry-to-fill if short. Graceful degradation:
    // if BOTH rounds drop heavily on a batch, ship what we have and surface a
    // banner on the exam page (score scaling is correct/total so a shortfall
    // scales proportionally — 720 pass threshold stays honest).
    const BATCHES = 5, EXAM_BATCH_BASE = 18, EXAM_BATCH_BUFFER = 5, MAX_RETRIES = 2;
    // v8.145.0: per-batch fill telemetry + a final top-up (same as Marathon /
    // startQuiz). A batch whose writer call fails every retry no longer
    // aborts the whole exam; the top-up refills it.
    const _fillRounds = []; let _lastBatchErr = null;
    // v8.163.0: pick the opening PBQs first, so the MCQs fill the rest of the 90.
    let _pbqs = [];
    try {
      _loadingProgressUpdate('Choosing the PBQs\u2026', 2);
      if (await _examEnsureSimLab() && window._simLab.pickExamPbqs) _pbqs = window._simLab.pickExamPbqs(window.CURRENT_CERT || 'netplus', EXAM_PBQ_COUNT) || [];
    } catch (_) { _pbqs = []; }
    const MCQ_TARGET = EXAM_QUESTION_COUNT - _pbqs.length;
    window._mixedPickMode = 'random';  // v8.146.0: exam rehearsal draws topics at random, never Catch-up
    try {
      for (let i = 0; i < BATCHES; i++) {
        if (!_alive()) return;
        _loadingProgressUpdate(`Batch ${i + 1} / ${BATCHES} \u2014 generating\u2026`, (i / BATCHES) * 100);
        // v8.162.0: exam-level questions, the last batch hard (~80/20). "Mixed"
        // included easy recall the real exam doesn't ask, which flattered the score.
        const batchDiff = (i === BATCHES - 1) ? 'Hard / Tricky' : 'Exam Level';

        // Step 1: Generate (over-request) with fetch-retry on throw
        document.getElementById('loading-msg').textContent =
          `Generating questions (${examQuestions.length} / 90)\u2026`;
        let rawBatch = null;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            // v4.81.15: pass batch index `i` (0..4) as staleSliceIdx so each
            // of the 5 sequential exam batches sees a different rotating
            // window of stale topics. Without this all 5 batches would see
            // the SAME stale-topic top-N and Haiku would cluster picks at
            // the top, defeating the breadth goal across a 90-Q exam.
            rawBatch = await fetchQuestions(key, MIXED_TOPIC, batchDiff, EXAM_BATCH_BASE + EXAM_BATCH_BUFFER, i);
            break;
          } catch(retryErr) {
            if (!_alive()) return;
            if (attempt === MAX_RETRIES) { _lastBatchErr = retryErr; rawBatch = []; break; }
            lbl.textContent = `Batch ${i + 1} failed, retrying (${attempt + 1}/${MAX_RETRIES})\u2026`;
            await new Promise(r => setTimeout(r, 1500));
          }
        }

        // Step 2: Validate — Sonnet semantic pass + programmatic checks
        // (same pipeline as startQuiz, per v4.43.5 parity decision)
        lbl.textContent = `Batch ${i + 1} / ${BATCHES} \u2014 verifying\u2026`;
        const _r = { label: 'b' + (i + 1), asked: EXAM_BATCH_BASE + EXAM_BATCH_BUFFER, written: rawBatch.length };
        if (!rawBatch.length && _lastBatchErr) _r.error = String(_lastBatchErr.message || _lastBatchErr).slice(0, 80);
        const aiValidated = rawBatch.length ? await aiValidateQuestions(key, rawBatch) : [];
        if (!_alive()) return;
        let batch = validateQuestions(aiValidated);
        _r.afterChecker = aiValidated.length; _r.afterLocal = batch.length;

        // v4.81.14: cross-batch dedup (user report: same questions repeating
        // across the 5 exam batches). fetchQuestions dedupes within a single
        // call; this catches duplicates between sequential exam batches where
        // Haiku has no state from prior batches. Drop duplicates here so the
        // retry-to-fill logic below treats them as deficit and refills.
        if (examQuestions.length > 0) {
          const seenStems = new Set(examQuestions.map(q => _normalizeStemForDedup(q && q.question)));
          const before = batch.length;
          batch = batch.filter(q => {
            const norm = _normalizeStemForDedup(q && q.question);
            if (!norm) return true; // keep questions with no stem (defensive)
            if (seenStems.has(norm)) return false;
            seenStems.add(norm);
            return true;
          });
          if (batch.length < before) {
            console.info(`[exam] batch ${i + 1}: dropped ${before - batch.length} duplicate stem(s) already in earlier batches`);
          }
        }

        // Step 3: Retry-to-fill if post-validation short — ONE retry per batch
        if (batch.length < EXAM_BATCH_BASE) {
          const deficit = EXAM_BATCH_BASE - batch.length;
          lbl.textContent = `Batch ${i + 1} / ${BATCHES} \u2014 filling ${deficit} more\u2026`;
          try {
            // v4.81.15: retry-to-fill stays on the same staleSliceIdx as
            // the parent batch so we keep filling the same rotation window.
            const extraRaw = await fetchQuestions(key, MIXED_TOPIC, batchDiff, deficit + EXAM_BATCH_BUFFER, i);
            let extraValidated = validateQuestions(await aiValidateQuestions(key, extraRaw));
            // v4.81.14: dedupe the retry-to-fill payload against accumulated
            // examQuestions + the current batch's already-deduped contents.
            // Otherwise we'd undo the dedup we just did.
            const seenStemsRetry = new Set([
              ...examQuestions.map(q => _normalizeStemForDedup(q && q.question)),
              ...batch.map(q => _normalizeStemForDedup(q && q.question))
            ]);
            extraValidated = extraValidated.filter(q => {
              const norm = _normalizeStemForDedup(q && q.question);
              if (!norm) return true;
              if (seenStemsRetry.has(norm)) return false;
              seenStemsRetry.add(norm);
              return true;
            });
            batch = batch.concat(extraValidated);
          } catch(retryErr) {
            console.warn(`Exam batch ${i + 1} retry-to-fill failed, continuing with partial batch:`, retryErr);
          }
        }

        if (!_alive()) return;
        // Step 4: Slice batch to EXAM_BATCH_BASE (truncate overage, accept shortage).
        // If still < EXAM_BATCH_BASE here, the final exam will be short of 90 — handled below.
        const _before = examQuestions.length;
        examQuestions = examQuestions.concat(batch.slice(0, EXAM_BATCH_BASE));
        _r.added = examQuestions.length - _before; _fillRounds.push(_r);
      }
      if (examQuestions.length < MCQ_TARGET && typeof _topUpToCount === 'function') {
        const _topped = await _topUpToCount(key, MIXED_TOPIC, 'Exam Level', examQuestions, MCQ_TARGET, _fillRounds, (round, deficit) => {
          _loadingProgressUpdate(`Filling the last ${deficit} question${deficit === 1 ? '' : 's'}\u2026`, 92 + round * 2);
        });
        if (!_alive()) return;
        examQuestions = _topped;
      }
      if (!_alive()) return;
      if (!examQuestions.length) throw (_lastBatchErr || new Error('No questions could be generated. Try again.'));
      // v8.162.0: shuffle so the hard batch doesn't cluster at the end.
      for (let k = examQuestions.length - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); const t = examQuestions[k]; examQuestions[k] = examQuestions[r]; examQuestions[r] = t; }
      _loadingProgressUpdate('Finalizing…', 98);
      examQuestions = examQuestions.slice(0, MCQ_TARGET);
      if (_pbqs.length) {
        // v8.163.0: Sim Lab PBQs open the exam, as on the real thing.
        examQuestions = _pbqs.map(s => ({ type: 'simlab', simlab: s, question: s.title, topic: s.topic, objective: s.objective, explanation: '' })).concat(examQuestions);
      } else {
        // Inject 2 CLI/topo PBQs into exam (predefined bank — already known good, skip validation)
        examQuestions = injectPBQs(examQuestions, MIXED_TOPIC, 2);
      }
      // Defensive truncate: if injectPBQs somehow grew past 90 (shouldn't — it splices 1-for-1)
      if (examQuestions.length > EXAM_QUESTION_COUNT) {
        examQuestions = examQuestions.slice(0, EXAM_QUESTION_COUNT);
      }
      // Capture final count before render so we can surface the shortfall banner if needed
      const examShortfall = examQuestions.length < EXAM_QUESTION_COUNT;
      if (typeof _logQuizFill === 'function') _logQuizFill(EXAM_QUESTION_COUNT, examQuestions.length, 'fresh (exam)', _fillRounds, null);

      examAnswers = examQuestions.map(() => ({ chosen: null, flagged: false, msChosen: [], orderSeq: [], cliRan: [], topoState: {} }));
      // v4.82.1: hide loading bar before swapping to the exam page.
      _loadingProgressFinish();
      showPage('exam');
      renderExam();
      startExamTimer();
      // Option B (user-approved, v4.43.5): graceful degradation — ship the exam
      // with what we have rather than error out. Show a non-blocking banner.
      if (examShortfall) showExamShortfallBanner(examQuestions.length);
    } catch(e) {
      if (!_alive()) return;   // cancelled: Cancel already went Home
      if (typeof _logQuizFill === 'function') _logQuizFill(EXAM_QUESTION_COUNT, 0, 'error (exam)', _fillRounds, String((e && e.message) || e).slice(0, 120));
      examMode = false;
      _loadingProgressFinish();
      showPage('setup');
      errBox.textContent = e.message;
      errBox.classList.remove('is-hidden');
    }
  }

  // v4.43.5: surface a subtle banner when exam ships fewer than 90 questions
  // because both the initial generation and the retry-to-fill dropped questions.
  // Non-blocking — user can dismiss and take the exam. Scaling (correct/total)
  // handles the shortfall proportionally so the 720 pass mark stays honest.
  function showExamShortfallBanner(actualCount) {
    const examPage = document.getElementById('page-exam');
    if (!examPage) return;
    const existing = document.getElementById('exam-shortfall-banner');
    if (existing) existing.remove();
    const filtered = EXAM_QUESTION_COUNT - actualCount;
    const banner = document.createElement('div');
    banner.id = 'exam-shortfall-banner';
    banner.className = 'exam-shortfall-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = `
      <span class="exam-shortfall-icon" aria-hidden="true"></span>
      <span class="exam-shortfall-text">This exam has <strong>${actualCount} of ${EXAM_QUESTION_COUNT}</strong> questions \u2014 ${filtered} were filtered out by the quality validator. Your score scales against the actual count, so the ${EXAM_PASS_SCORE} pass mark stays accurate.</span>
      <button class="exam-shortfall-dismiss" onclick="document.getElementById('exam-shortfall-banner')?.remove()" aria-label="Dismiss">\u00D7</button>
    `;
    examPage.insertBefore(banner, examPage.firstChild);
  }


  // v4.99.49 Phase 10: Wake Lock keeps the phone screen on during the 90-min
  // exam (default lock-screen is 30s on iOS, 60-120s on Android). Acquired
  // when startExamTimer fires, released on submitExam/timeout. Auto-releases
  // when the tab loses visibility (browser behaviour); _examOnVisibilityChange
  // re-acquires when the tab regains visibility. Browser support ~85%
  // (Chrome, Edge, Safari 16.4+, Firefox 126+); gracefully no-ops elsewhere.

  async function _acquireExamWakeLock() {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        _examWakeLock = await navigator.wakeLock.request('screen');
        // Auto-released by browser on tab hide — re-acquire on visible
        _examWakeLock.addEventListener('release', () => { _examWakeLock = null; });
      }
    } catch (_) {
      // Permission denied, battery saver, unsupported — silent no-op
      _examWakeLock = null;
    }
  }

  async function _releaseExamWakeLock() {
    try {
      if (_examWakeLock) {
        await _examWakeLock.release();
        _examWakeLock = null;
      }
    } catch (_) { _examWakeLock = null; }
  }

  // v8.162.0: the clock no longer pauses while the tab is hidden (it extended
  // the deadline by the time away). The real exam never stops, and the
  // deadline-based timer already counts that time. Save on hide (iOS can evict
  // the tab) and re-acquire the wake lock on return.
  function _examOnVisibilityChange() {
    if (!examMode || !examTimer) return;  // only act during an exam
    _examSaveState();
    if (document.visibilityState === 'visible') _acquireExamWakeLock();
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', _examOnVisibilityChange);
  }

  function startExamTimer() {
    if (examTimer) clearInterval(examTimer);
    examEndTime = Date.now() + examTimeLeft * 1000;
    _acquireExamWakeLock();  // Phase 10: keep phone screen on for 90 min
    _examSaveState();        // v8.162.0: deadline is known now
    examTimer = setInterval(() => {
      examTimeLeft = Math.max(0, Math.round((examEndTime - Date.now()) / 1000));
      updateTimerDisplay();
      if (Date.now() - _examLastSave > 5000) _examSaveState();
      if (examTimeLeft <= 0) { clearInterval(examTimer); examTimer = null; _releaseExamWakeLock(); submitExam(); }
    }, 1000);
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    const el = document.getElementById('exam-timer');
    if (!el) return;
    const m = Math.floor(examTimeLeft / 60), s = examTimeLeft % 60;
    el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    el.className = 'exam-timer' + (examTimeLeft <= 300 ? ' danger' : examTimeLeft <= 600 ? ' warning' : '');
    // v8.162.0: pace line next to "N / 90 answered".
    const pc = document.getElementById('exam-pace');
    if (pc) {
      const t = _examPaceText();
      pc.textContent = t;
      pc.classList.toggle('is-behind', / behind$/.test(t));
    }
  }

  // ══════════════════════════════════════════
  // EXAM RENDER (with PBQ support)
  // ══════════════════════════════════════════
  function renderExam() {
    const q     = examQuestions[examCurrent];
    const ans   = examAnswers[examCurrent];
    const total = examQuestions.length;
    const qType = getQType(q);

    document.getElementById('exam-q-num').textContent = `Q${examCurrent + 1} / ${total}`;
    document.getElementById('exam-q-label').textContent = `Q${examCurrent + 1}`;
    document.getElementById('exam-topic-lbl').textContent = q.topic || '';

    const answeredCount = examAnswers.filter(a => a.chosen !== null || a.msChosen.length > 0 || a.orderSeq.length > 0 || Object.keys(a.topoState || {}).length > 0 || _examPbqTouched(a.sl)).length;
    document.getElementById('exam-answered-lbl').textContent = `${answeredCount} / ${total} answered`;
    document.getElementById('exam-prog-fill').style.width = ((examCurrent / total) * 100) + '%';
    // v4.54.9: segmented per-question progress dots (exam parity with quiz)
    if (typeof _renderExamProgressDots === 'function') _renderExamProgressDots();

    const flagBtn = document.getElementById('exam-flag-btn');
    flagBtn.className = 'exam-flag-btn' + (ans.flagged ? ' flagged' : '');
    flagBtn.textContent = ans.flagged ? '\u2691 Flagged' : '\u2691 Flag';
    flagBtn.setAttribute('aria-pressed', ans.flagged ? 'true' : 'false');

    setQuestionText(document.getElementById('exam-q-text'), q.question);

    // v4.56.0 — optional scenario context block (exam parity with quiz). Skipped for
    // cli-sim / topology which render their own scenario inside the options box.
    _renderScenarioBlock('exam-q-scenario', q, qType);

    const box = document.getElementById('exam-options');
    box.innerHTML = '';

    // v8.164.0: the A-D "pick" hint means nothing on a PBQ
    const _pickHint = document.getElementById('exam-kbd-pick');
    if (_pickHint) _pickHint.style.display = (qType === 'simlab') ? 'none' : '';   // inline: the hints row's CSS overrides [hidden]
    if (qType === 'simlab') {
      _examRenderPbq(q, box, ans);   // v8.163.0
    } else if (qType === 'multi-select') {
      renderMultiSelect(q, box, ans);
    } else if (qType === 'order') {
      renderOrder(q, box, ans);
    } else if (qType === 'cli-sim') {
      renderCliSim(q, box, ans);
    } else if (qType === 'topology') {
      renderTopology(q, box, ans);
    } else {
      renderMCQ(q, box, ans);
    }

    document.getElementById('exam-prev-btn').disabled = examCurrent === 0;
    const isLast = examCurrent === total - 1;
    const nextBtn = document.getElementById('exam-next-btn');
    nextBtn.textContent = isLast ? 'Submit Exam' : 'Next \u2192';
    nextBtn.onclick = isLast ? showExamModal : examNext;

    if (navOpen) renderNavGrid();
    updateTimerDisplay();
    _examSaveState();   // v8.162.0: every answer and every move is resumable
  }

  function examNext() { if (examCurrent < examQuestions.length - 1) { examCurrent++; renderExam(); window.scrollTo(0,0); } }
  function examPrev() {
    if (examCurrent > 0) { examCurrent--; renderExam(); window.scrollTo(0,0); }
  }

  function examToggleFlag() {
    examAnswers[examCurrent].flagged = !examAnswers[examCurrent].flagged;
    renderExam();
  }

  // ══════════════════════════════════════════
  // QUESTION NAVIGATOR
  // ══════════════════════════════════════════
  function toggleNav() {
    navOpen = !navOpen;
    const grid = document.getElementById('qnav-grid');
    document.getElementById('qnav-arrow').textContent = navOpen ? '\u25b2' : '\u25bc';
    grid.classList.toggle('open', navOpen);
    const toggleBtn = document.getElementById('qnav-toggle');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', navOpen ? 'true' : 'false');
    if (navOpen) renderNavGrid();
  }

  function renderNavGrid() {
    const grid = document.getElementById('qnav-grid');
    grid.innerHTML = '';
    grid.setAttribute('role', 'list');
    examAnswers.forEach((a, i) => {
      const sq = document.createElement('button');
      const hasAnswer = a.chosen !== null || a.msChosen.length > 0 || a.orderSeq.length > 0 || Object.keys(a.topoState || {}).length > 0 || _examPbqTouched(a.sl);
      let cls = 'qnav-sq';
      let stateLbl = 'unanswered';
      if (i === examCurrent)    { cls += ' current';  stateLbl = 'current'; }
      else if (a.flagged)       { cls += ' flagged';  stateLbl = 'flagged'; }
      else if (hasAnswer)       { cls += ' answered'; stateLbl = 'answered'; }
      sq.className   = cls;
      sq.textContent = i + 1;
      sq.setAttribute('aria-label', `Question ${i + 1}, ${stateLbl}`);
      sq.setAttribute('aria-current', i === examCurrent ? 'true' : 'false');
      sq.onclick     = () => { examCurrent = i; renderExam(); window.scrollTo(0,0); };
      grid.appendChild(sq);
    });
  }

  // ══════════════════════════════════════════
  // EXAM MODAL
  // ══════════════════════════════════════════
  function showExamModal() {
    const answeredCount = examAnswers.filter(a => a.chosen !== null || a.msChosen.length > 0 || a.orderSeq.length > 0 || Object.keys(a.topoState || {}).length > 0 || _examPbqTouched(a.sl)).length;
    const unanswered    = examAnswers.length - answeredCount;
    const flaggedCount  = examAnswers.filter(a => a.flagged).length;
    document.getElementById('modal-answered').textContent   = answeredCount;
    document.getElementById('modal-unanswered').textContent = unanswered;
    document.getElementById('modal-flagged').textContent    = flaggedCount;
    const flagBtn = document.getElementById('modal-flagged-btn');
    flagBtn.disabled = flaggedCount === 0;
    flagBtn.classList.toggle('is-dimmed', flaggedCount === 0);
    const modal = document.getElementById('exam-modal');
    modal.classList.remove('hidden');
    // Focus first button in modal for keyboard users
    setTimeout(() => {
      const firstBtn = modal.querySelector('button:not([disabled])');
      if (firstBtn) firstBtn.focus();
    }, 100);
    // Trap focus inside modal
    modal._trapHandler = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = modal.querySelectorAll('button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    modal.addEventListener('keydown', modal._trapHandler);
    // Close on Escape
    modal._escHandler = (e) => { if (e.key === 'Escape') hideExamModal(); };
    document.addEventListener('keydown', modal._escHandler);
  }

  function hideExamModal() {
    const modal = document.getElementById('exam-modal');
    modal.classList.add('hidden');
    if (modal._trapHandler) { modal.removeEventListener('keydown', modal._trapHandler); modal._trapHandler = null; }
    if (modal._escHandler) { document.removeEventListener('keydown', modal._escHandler); modal._escHandler = null; }
    // Return focus to the End Exam button
    const endBtn = document.querySelector('.end-exam-btn');
    if (endBtn) endBtn.focus();
  }

  function goToFirstFlagged() {
    hideExamModal();
    const idx = examAnswers.findIndex(a => a.flagged);
    if (idx >= 0) { examCurrent = idx; renderExam(); window.scrollTo(0,0); }
  }

  function abandonExam() {
    if (confirm('Abandon this exam and return to the menu? All progress will be lost.')) {
      clearInterval(examTimer); examTimer = null; examMode = false;
      _examClearState();   // v8.162.0
      hideExamModal();
      renderHistoryPanel();
      showPage('setup');
    }
  }

  // ══════════════════════════════════════════
  // EXAM SUBMIT & RESULTS (with PBQ scoring)
  // ══════════════════════════════════════════
  function submitExam() {
    // v4.42.0: snapshot streak BEFORE updateStreak so we can flag a pulse for
    // goSetup() on increment.
    const _prevStreakBefore = (function(){ try { return getStreak().current || 0; } catch (_) { return 0; } })();
    if (examTimer) { clearInterval(examTimer); examTimer = null; }
    _examClearState();       // v8.162.0: a submitted exam is never offered for resume
    _releaseExamWakeLock();  // Phase 10: phone can sleep now
    if (_examPausedAt) { _examPausedMs += Date.now() - _examPausedAt; _examPausedAt = 0; _examRenderPaused(); }   // v8.164.0
    hideExamModal();

    const total = examQuestions.length;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    // v8.163.0: a PBQ earns partial credit (fraction of steps right). Fully right
    // counts as correct, otherwise wrong; the partial fraction is added to the
    // points the score is built from. pbqPartial = sum of those partial fractions.
    let pbqPartial = 0, pbqPoints = 0, pbqCount = 0;

    examAnswers.forEach((a, i) => {
      const q = examQuestions[i];
      const qType = getQType(q);
      let qCorrect = false, qSkipped = false;

      if (qType === 'simlab') {
        pbqCount++;
        const sc = _examScorePbq(q, a);
        if (!_examPbqTouched(a.sl)) { skipped++; return; }
        pbqPoints += sc.fraction;
        if (sc.fraction === 1) correct++;
        else { wrong++; pbqPartial += sc.fraction; }
        return;   // PBQs stay out of the MCQ type stats
      }
      if (qType === 'multi-select') {
        const correctAns = (q.answers || []).sort();
        const chosen = [...(a.msChosen || [])].sort();
        if (chosen.length === 0) { skipped++; qSkipped = true; }
        else if (JSON.stringify(chosen) === JSON.stringify(correctAns)) { correct++; qCorrect = true; }
        else wrong++;
      } else if (qType === 'order') {
        const correctOrd = q.correctOrder || [];
        if (a.orderSeq.length === 0) { skipped++; qSkipped = true; }
        else if (JSON.stringify(a.orderSeq) === JSON.stringify(correctOrd)) { correct++; qCorrect = true; }
        else wrong++;
      } else if (qType === 'topology') {
        const correctP = q.correctPlacements || {};
        const state = a.topoState || {};
        if (Object.keys(state).length === 0) { skipped++; qSkipped = true; }
        else {
          let allRight = true;
          Object.entries(correctP).forEach(([dev, zone]) => {
            const placed = Object.entries(state).find(([z, devs]) => devs.includes(dev));
            if (!placed || placed[0] !== zone) allRight = false;
          });
          if (allRight) { correct++; qCorrect = true; }
          else wrong++;
        }
      } else {
        // mcq and cli-sim both use chosen + answer
        if (a.chosen === null) { skipped++; qSkipped = true; }
        else if (a.chosen === q.answer) { correct++; qCorrect = true; }
        else wrong++;
      }
      // Type stats (skipped answers don't count toward accuracy denominator)
      if (!qSkipped) updateTypeStat(qType, qCorrect);
    });

    const points = correct + pbqPartial;
    const pct = Math.round((points / total) * 100);
    const scaledScore = scaledExamScore(points, total);  // v8.128.0: cert's own scale; v8.163.0: PBQ partial credit
    const passed      = scaledScore >= EXAM_PASS_SCORE;

    // Build log for review
    log = examQuestions.map((q, i) => {
      const a = examAnswers[i];
      const qType = getQType(q);
      let isRight, chosen, correctVal, isSkipped;

      if (qType === 'simlab') {   // v8.163.0: no wrong bank / SR for PBQs
        const sc = _examScorePbq(q, a);
        const touched = _examPbqTouched(a.sl);
        return { q, chosen: '', correct: '', isRight: touched && sc.fraction === 1, flagged: a.flagged, skipped: !touched, pbq: sc };
      }
      if (qType === 'multi-select') {
        const correctAns = (q.answers || []).sort();
        chosen = (a.msChosen || []).sort().join(',');
        correctVal = correctAns.join(',');
        isSkipped = a.msChosen.length === 0;
        isRight = JSON.stringify((a.msChosen || []).sort()) === JSON.stringify(correctAns);
      } else if (qType === 'order') {
        chosen = (a.orderSeq || []).join(',');
        correctVal = (q.correctOrder || []).join(',');
        isSkipped = a.orderSeq.length === 0;
        isRight = JSON.stringify(a.orderSeq) === JSON.stringify(q.correctOrder || []);
      } else if (qType === 'topology') {
        chosen = JSON.stringify(a.topoState || {});
        correctVal = JSON.stringify(q.correctPlacements || {});
        isSkipped = Object.keys(a.topoState || {}).length === 0;
        isRight = !isSkipped;
        if (!isSkipped) {
          Object.entries(q.correctPlacements || {}).forEach(([dev, zone]) => {
            const placed = Object.entries(a.topoState || {}).find(([z, devs]) => devs.includes(dev));
            if (!placed || placed[0] !== zone) isRight = false;
          });
        }
      } else {
        // mcq and cli-sim
        chosen = a.chosen;
        correctVal = q.answer;
        isSkipped = a.chosen === null;
        isRight = a.chosen === q.answer;
      }

      // Track wrong for bank
      if (!isRight && !isSkipped) addToWrongBank(q, chosen);

      return { q, chosen, correct: correctVal, isRight, flagged: a.flagged, skipped: isSkipped };
    });

    updateStreak();
    // v4.42.0: flag streak-pulse for goSetup() if the exam finish incremented
    // the streak counter.
    try {
      if ((getStreak().current || 0) > _prevStreakBefore) _pendingStreakPulse = true;
    } catch (_) {}
    saveToHistory({ date: new Date().toISOString(), topic: EXAM_TOPIC, difficulty: 'Mixed', score: Math.round(points), total, pct, mode: 'exam', pausedMs: _examPausedMs || undefined });
    // v4.81.13 (Codex r∞ user request): also write per-topic split rows so the
    // exam contributes to readiness / progress / weak-spots / what-if /
    // domain mastery — pre-fix the rolled-up EXAM_TOPIC sentinel was filtered
    // OUT by getReadinessScore (and every other surface that reads history
    // per-topic), so a 90-question exam was a "standalone entity" with zero
    // signal contribution beyond the wrong-bank + SR seed.
    try { _saveExamPerTopicSplit(log); } catch (e) { console.warn('[exam-split]', e); }
    // v4.81.13 (C): render the per-domain breakdown card on the exam-results
    // page so the user sees their domain split immediately after submit.
    try { if (typeof renderExamDomainBreakdown === 'function') renderExamDomainBreakdown(log); } catch (e) { console.warn('[exam-domain]', e); }
    // v4.54.17: end-of-day recap check after exam too
    try { if (typeof _maybeShowDailyRecap === 'function') _maybeShowDailyRecap(); } catch (_) {}
    // v4.42.0: refresh the homepage cards that depend on history state so
    // returning to setup renders them fresh with the new signal. The
    // renderTodaysFocus call that used to live here has moved — goSetup() is
    // the only caller now, which lets the FLIP rerank animation capture real
    // old positions instead of re-rendering against an already-updated DOM.
    try { renderStatsCard(); } catch (_) {}
    try { renderReadinessCard(); } catch (_) {}
    try { if (typeof renderSrReviewCard === 'function') renderSrReviewCard(); } catch (_) {}

    const scoreEl = document.getElementById('exam-scaled-score');
    scoreEl.style.color  = passed ? 'var(--green)' : 'var(--red)';
    animateCount('exam-scaled-score', 0, scaledScore, 1200);

    const badge = document.getElementById('exam-pass-badge');
    badge.textContent = passed ? 'PASS' : 'FAIL';
    badge.className   = 'pass-badge ' + (passed ? 'badge-pass' : 'badge-fail');
    // v4.54.9: editorial headline mirrors the pass/fail verdict with italic-accent em
    const headlineEl = document.getElementById('exam-result-headline');
    if (headlineEl) {
      headlineEl.innerHTML = passed
        ? 'Pass mark <em>cleared.</em>'
        : 'More <em>work needed.</em>';
    }

    // v8.162.0: the 100-900 conversion is linear and the real scaling is
    // unpublished, so say what the pass mark means here and call it an estimate.
    const _passPct = Math.round(((EXAM_PASS_SCORE - EXAM_MIN_SCORE) / (EXAM_MAX_SCORE - EXAM_MIN_SCORE)) * 100);
    document.getElementById('exam-result-msg').textContent = (passed
      ? `Score ${scaledScore}/${EXAM_MAX_SCORE}, above the ${EXAM_PASS_SCORE} pass mark.`
      : `Score ${scaledScore}/${EXAM_MAX_SCORE}, ${EXAM_PASS_SCORE - scaledScore} points short of the ${EXAM_PASS_SCORE} pass mark.`)
      + ` Here, ${EXAM_PASS_SCORE} is about ${_passPct}% correct. The real exam's scaling isn't published, so treat this as an estimate.`
      + (pbqCount ? ` PBQs earned ${Math.round(pbqPoints * 10) / 10} of ${pbqCount} points, with partial credit per step.` : '')
      + (_examPauses ? ` Paused ${_examPauses === 1 ? 'once' : _examPauses === 2 ? 'twice' : _examPauses + ' times'}, ${Math.max(1, Math.round(_examPausedMs / 60000))} min in total. The real exam has no pause.` : '');

    animateCount('exam-r-correct', 0, correct, 800);
    animateCount('exam-r-wrong', 0, wrong, 800);
    animateCount('exam-r-skipped', 0, skipped, 600);
    document.getElementById('exam-r-pct').textContent     = pct + '%';

    // v8.186.0 Lift B2: the June E2E results at phone width (features/ios-exam.js)
    try { if (typeof window.renderIosExamResults === 'function') window.renderIosExamResults(_examPhoneResultsData(log, { scaled: scaledScore, total, correct, wrong, skipped, pct })); } catch (e) { console.warn('[ios-exam]', e); }
    showPage('exam-results');
    if (passed) setTimeout(() => launchConfetti(), 400);
    // v4.42.0: evaluate + celebrate unlocked milestones. Delayed 900ms so it
    // doesn't collide with the exam-pass confetti burst; staggered by 900ms
    // between individual milestones so each celebration is readable.
    try {
      const _newlyUnlocked = evaluateMilestones();
      if (_newlyUnlocked && _newlyUnlocked.length) {
        _newlyUnlocked.forEach((id, i) => setTimeout(() => showMilestoneCelebration(id), 900 + i * 900));
      }
    } catch (_) {}

    // v4.99.0: snapshot readiness for cross-cert analytics (Phase A.5).
    // Mirror finish() — exam completion is a major readiness moment.
    _writeReadinessSnapshot();
  }

  // exam summary row tagged `topic: EXAM_TOPIC` was filtered out by every
  // per-topic surface (readiness, progress, analytics, weak-spots,
  // what-if attribution). The wrong-bank + SR queue seeded fine but
  // the headline metrics ignored the exam entirely. Fix: after the
  // summary row is saved, group log[] by q.topic and write one history
  // row per topic with `mode: 'exam'` (so the existing 1.3× exam boost
  // in buildWeightedTopicMap applies) and `via: 'exam-split'` (marker
  // so we can distinguish these from regular exam summary rows).
  //
  // No double-counting: getReadinessScore filters EXAM_TOPIC (the
  // summary) explicitly, so only the per-topic splits contribute.
  function _saveExamPerTopicSplit(log) {
    if (!Array.isArray(log) || log.length === 0) return 0;
    const byTopic = {};
    log.forEach(entry => {
      const q = entry && entry.q;
      if (!q || q.type === 'simlab') return;   // v8.163.0: PBQs aren't calibrated like MCQs
      const t = q.topic;
      if (!t || t === MIXED_TOPIC || t === EXAM_TOPIC) return;
      if (!byTopic[t]) byTopic[t] = { correct: 0, total: 0, entries: [] };
      byTopic[t].total++;
      byTopic[t].entries.push(entry);
      if (entry.isRight && !entry.isSkipped) byTopic[t].correct++;
    });
    const date = new Date().toISOString();
    let written = 0;
    Object.keys(byTopic).forEach(topic => {
      const b = byTopic[topic];
      if (b.total < 1) return;
      const pct = Math.round((b.correct / b.total) * 100);
      saveToHistory({
        date, topic, difficulty: 'Mixed',
        score: b.correct, total: b.total, pct,
        mode: 'exam',
        via: 'exam-split',
        byDiff: (typeof byDiffFromLog === 'function') ? byDiffFromLog(b.entries, 'Mixed', e => !!(e.isRight && !e.isSkipped)) : undefined  // v8.149.0
      });
      written++;
    });
    return written;
  }

  // v4.81.13: per-domain breakdown for the exam-results page. Same input
  // (log[]) as _saveExamPerTopicSplit. Returns { domainKey: {correct,
  // total, pct} } for all 5 N10-009 domains. Domains with zero questions
  // contribute an empty bucket so the rendered grid stays consistent
  // (renders as "—" rather than missing entirely).
  // v8.186.0 Lift B2: what the phone results screen reads (features/ios-exam.js _iosExamResultsModel).
  function _examPhoneResultsData(log, n) {
    const b = _buildExamDomainBreakdown(log);
    const order = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS) ? Object.keys(DOMAIN_WEIGHTS) : Object.keys(b);
    const meta = (typeof CERT_PACK === 'object' && CERT_PACK && CERT_PACK.meta) || {};
    const vendor = String(meta.name || 'CompTIA').split(' ')[0];
    const wrongBy = {};
    (log || []).forEach(en => {
      if (!en || !en.q || en.pbq || en.isRight || en.skipped || !en.q.topic) return;
      wrongBy[en.q.topic] = (wrongBy[en.q.topic] || 0) + 1;
    });
    return {
      scaled: n.scaled, minScore: EXAM_MIN_SCORE, maxScore: EXAM_MAX_SCORE, passScore: EXAM_PASS_SCORE,
      certLabel: vendor + ' ' + ((typeof CERT_CODE === 'string' && CERT_CODE) || ''),
      total: n.total, correct: n.correct, wrong: n.wrong, skipped: n.skipped, pct: n.pct,
      pauses: _examPauses || 0, pausedMs: _examPausedMs || 0,
      domains: order.filter(k => b[k]).map(k => ({ key: k, label: b[k].label || k, correct: b[k].correct, total: b[k].total, pct: b[k].pct })),
      pbqs: (log || []).filter(en => en && en.pbq).map(en => ({
        title: (en.q.simlab && (en.q.simlab.title || en.q.simlab.name)) || en.q.question || 'Sim Lab question', topic: en.q.topic || '',
        correct: en.pbq.correct || 0, total: en.pbq.total || 0, fraction: en.pbq.fraction || 0, skipped: !!en.skipped })),
      wrongTopics: Object.keys(wrongBy).map(t => ({ topic: t, domain: (DOMAIN_LABELS && DOMAIN_LABELS[TOPIC_DOMAINS[t]]) || '', wrong: wrongBy[t] }))
    };
  }

  function _buildExamDomainBreakdown(log) {
    const buckets = {};
    Object.keys(DOMAIN_WEIGHTS).forEach(d => {
      buckets[d] = { key: d, label: DOMAIN_LABELS[d], correct: 0, total: 0 };
    });
    if (!Array.isArray(log)) return buckets;
    log.forEach(entry => {
      const q = entry && entry.q;
      if (!q || !q.topic) return;
      const domain = (typeof TOPIC_DOMAINS !== 'undefined') ? TOPIC_DOMAINS[q.topic] : null;
      if (!domain || !buckets[domain]) return;
      buckets[domain].total++;
      if (entry.isRight && !entry.isSkipped) buckets[domain].correct++;
    });
    Object.keys(buckets).forEach(d => {
      const b = buckets[d];
      b.pct = b.total > 0 ? Math.round((b.correct / b.total) * 100) : null;
      // tier mirrors the v4.85.11 anchored thresholds (55/70/80; lowered from 85)
      if (b.pct === null) b.tier = 'empty';
      else if (b.pct >= 80) b.tier = 'mastered';
      else if (b.pct >= 70) b.tier = 'proficient';
      else if (b.pct >= 55) b.tier = 'developing';
      else b.tier = 'novice';
    });
    return buckets;
  }

  function renderExamDomainBreakdown(log) {
    const host = document.getElementById('exam-domain-breakdown');
    const grid = document.getElementById('exam-domain-breakdown-grid');
    if (!host || !grid) return;
    const buckets = _buildExamDomainBreakdown(log);
    // Show domains in CompTIA blueprint order (concepts → troubleshooting for
    // Network+, concepts → governance for Security+).
    // v4.88.2: cert-aware ordering so the post-exam breakdown shows the right
    // 5 domains for the active cert.
    const order = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS)
      ? Object.keys(DOMAIN_WEIGHTS)
      : ['concepts', 'implementation', 'operations', 'security', 'troubleshooting'];
    const html = order.map(d => {
      const b = buckets[d];
      const pctStr = b.pct === null ? '—' : (b.pct + '%');
      const detail = b.total > 0 ? (b.correct + ' of ' + b.total + ' correct') : 'No questions in this exam';
      return '<div class="exam-domain-row exam-domain-' + b.tier + '">' +
        '<div class="exam-domain-row-meta">' +
        '<div class="exam-domain-row-name">' + escHtml(b.label) + '</div>' +
        '<div class="exam-domain-row-detail">' + escHtml(detail) + '</div>' +
        '</div>' +
        '<div class="exam-domain-row-pct">' + pctStr + '</div>' +
        '</div>';
    }).join('');
    grid.innerHTML = html;
    host.hidden = false;
  }

  // Window expose — HTML onclick targets and loader stub.
  window.startExam         = startExam;
  window.examToggleFlag    = examToggleFlag;
  window.showExamModal     = showExamModal;
  window.examPrev          = examPrev;
  window.examNext          = examNext;
  window.goToFirstFlagged  = goToFirstFlagged;
  window.submitExam        = submitExam;
  window.abandonExam       = abandonExam;
  // v7.96.0: quiz-engine.js's per-question-type render paths (MCQ/multi-select/
  // ordering/topology option clicks) call renderExam() as a bare identifier to
  // redraw the exam UI after recording an answer — a closure-captive-call
  // landmine caught by the extended tests/uat/270 sweep (same class as the
  // _formatElapsed bug this version also fixes).
  window.renderExam        = renderExam;
  // v7.97.0: index.html's #qnav-toggle onclick="toggleNav()" — closure-
  // captive-call landmine, same class as the renderExam fix above. Exam
  // navigator toggle dead since wave 6.
  window.toggleNav         = toggleNav;
  // v8.162.0: resume + leave guard (showPage / goSetup call examLeaveOk).
  window.resumeExam        = resumeExam;
  window.examLeaveOk       = examLeaveOk;
  window.examSavedState    = examSavedState;
  window.examIsPaused      = examIsPaused;      // v8.164.0: keyboard shortcuts stand down while paused
  window.examTogglePause   = examTogglePause;

  window._certanvilFeatures['exam'] = {
    enter: startExam,
    startExam: startExam,
    resumeExam: resumeExam
  };
})();
