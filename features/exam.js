/* Exam mode — extracted from app.js (#138 wave 6).
 * Lazy-loaded feature. Mechanical move: function bodies identical to app.js @ edfa740.
 * State vars (_examWakeLock, _examHiddenAt) moved here.
 * Shared state (examMode, examHardcore, examQuestions, examAnswers, examCurrent,
 * examTimer, examTimeLeft, examEndTime) STAYS in app.js (quiz engine reads them).
 * _scaledExamScore STAYS in app.js (used by MILESTONE_CHECKS). */
(function () {
  'use strict';

  let _examWakeLock = null;
  let _examHiddenAt = null;
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
                       (ans.topoState && Object.keys(ans.topoState).length > 0);
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

  // v4.54.8: track quiz session start time for elapsed-time row in Results.
  let _sessionStartTs = 0;
  function _formatElapsed(ms) {
    if (!ms || ms < 0) return '\u2014';
    const s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return m > 0 ? `${m}m ${String(rs).padStart(2,'0')}s` : `${rs}s`;
  }

  // ══════════════════════════════════════════
  // START EXAM SIMULATION
  // ══════════════════════════════════════════
  async function startExam() {
    // v7.46.0: the Exam Simulator is Pro-only (Simi, 2026-06-11). The quota
    // and size gates below only matter for Pro edge states now.
    if (!_gateProOnly('The Exam Simulator', {
      title: 'The Exam Simulator is a Pro feature',
      body: '90 questions against a 90-minute clock, scored 100-900 like test day. Free covers your daily practice; the full rehearsal is Pro.'
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
    // Hardcore mode (#48): read the persisted checkbox state at start time
    examHardcore = localStorage.getItem(STORAGE.HARDCORE_EXAM) === '1';
    const examPage = document.getElementById('page-exam');
    if (examPage) examPage.classList.toggle('hardcore-active', examHardcore);
    wrongDrillMode = false;
    examQuestions = [];
    examAnswers   = [];
    examCurrent   = 0;
    examTimeLeft  = EXAM_TIME_SECONDS;
    navOpen       = false;

    showPage('loading');
    document.getElementById('loading-msg').textContent = 'Building 90-question exam\u2026';
    // v4.82.1: use the unified smooth loading-progress module so exam mode
    // gets the same eased transition + shimmer overlay as quiz/diagnostic.
    // The label updates per-batch use _loadingProgressUpdate(label, pct).
    _loadingProgressBegin('Building 90-question exam\u2026');
    const lbl = document.getElementById('load-progress-label'); // kept for legacy textContent writes

    // v4.43.5 — Exam now runs the same validation pipeline as quiz mode (was
    // shipping raw Haiku batches). Per-batch: over-request → Sonnet semantic pass
    // → programmatic validator → retry-to-fill if short. Graceful degradation:
    // if BOTH rounds drop heavily on a batch, ship what we have and surface a
    // banner on the exam page (score scaling is correct/total so a shortfall
    // scales proportionally — 720 pass threshold stays honest).
    const BATCHES = 5, EXAM_BATCH_BASE = 18, EXAM_BATCH_BUFFER = 5, MAX_RETRIES = 2;
    try {
      for (let i = 0; i < BATCHES; i++) {
        _loadingProgressUpdate(`Batch ${i + 1} / ${BATCHES} \u2014 generating\u2026`, (i / BATCHES) * 100);

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
            rawBatch = await fetchQuestions(key, MIXED_TOPIC, 'Mixed', EXAM_BATCH_BASE + EXAM_BATCH_BUFFER, i);
            break;
          } catch(retryErr) {
            if (attempt === MAX_RETRIES) throw retryErr;
            lbl.textContent = `Batch ${i + 1} failed, retrying (${attempt + 1}/${MAX_RETRIES})\u2026`;
            await new Promise(r => setTimeout(r, 1500));
          }
        }

        // Step 2: Validate — Sonnet semantic pass + programmatic checks
        // (same pipeline as startQuiz, per v4.43.5 parity decision)
        lbl.textContent = `Batch ${i + 1} / ${BATCHES} \u2014 verifying\u2026`;
        const aiValidated = await aiValidateQuestions(key, rawBatch);
        let batch = validateQuestions(aiValidated);

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
            const extraRaw = await fetchQuestions(key, MIXED_TOPIC, 'Mixed', deficit + EXAM_BATCH_BUFFER, i);
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

        // Step 4: Slice batch to EXAM_BATCH_BASE (truncate overage, accept shortage).
        // If still < EXAM_BATCH_BASE here, the final exam will be short of 90 — handled below.
        examQuestions = examQuestions.concat(batch.slice(0, EXAM_BATCH_BASE));
      }
      _loadingProgressUpdate('Finalizing…', 98);
      // Inject 2 CLI/topo PBQs into exam (predefined bank — already known good, skip validation)
      examQuestions = injectPBQs(examQuestions, MIXED_TOPIC, 2);
      // Defensive truncate: if injectPBQs somehow grew past 90 (shouldn't — it splices 1-for-1)
      if (examQuestions.length > EXAM_QUESTION_COUNT) {
        examQuestions = examQuestions.slice(0, EXAM_QUESTION_COUNT);
      }
      // Capture final count before render so we can surface the shortfall banner if needed
      const examShortfall = examQuestions.length < EXAM_QUESTION_COUNT;

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

  // v4.99.49 Phase 10: pause exam timer when tab loses visibility, resume on
  // regain. Tracks "time hidden" so examEndTime is extended by the same
  // amount — student doesn't lose seconds to a notification interrupt.

  function _examOnVisibilityChange() {
    if (!examMode || !examTimer) return;  // only act during an exam
    if (document.visibilityState === 'hidden') {
      _examHiddenAt = Date.now();
    } else if (document.visibilityState === 'visible' && _examHiddenAt) {
      const hiddenMs = Date.now() - _examHiddenAt;
      _examHiddenAt = null;
      if (hiddenMs > 250) {  // ignore quick focus/blur glitches
        examEndTime += hiddenMs;  // extend deadline by hidden duration
      }
      // Wake Lock auto-released on hide — re-acquire
      _acquireExamWakeLock();
    }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', _examOnVisibilityChange);
  }

  function startExamTimer() {
    if (examTimer) clearInterval(examTimer);
    examEndTime = Date.now() + examTimeLeft * 1000;
    _acquireExamWakeLock();  // Phase 10: keep phone screen on for 90 min
    examTimer = setInterval(() => {
      examTimeLeft = Math.max(0, Math.round((examEndTime - Date.now()) / 1000));
      updateTimerDisplay();
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

    const answeredCount = examAnswers.filter(a => a.chosen !== null || a.msChosen.length > 0 || a.orderSeq.length > 0 || Object.keys(a.topoState || {}).length > 0).length;
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

    if (qType === 'multi-select') {
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
  }

  function examNext() { if (examCurrent < examQuestions.length - 1) { examCurrent++; renderExam(); window.scrollTo(0,0); } }
  function examPrev() {
    // Hardcore mode locks question order — no going back (#48)
    if (examHardcore) return;
    if (examCurrent > 0) { examCurrent--; renderExam(); window.scrollTo(0,0); }
  }

  function examToggleFlag() {
    // Flagging is disabled in hardcore mode (#48)
    if (examHardcore) return;
    examAnswers[examCurrent].flagged = !examAnswers[examCurrent].flagged;
    renderExam();
  }

  // ══════════════════════════════════════════
  // QUESTION NAVIGATOR
  // ══════════════════════════════════════════
  function toggleNav() {
    // Question navigator is disabled in hardcore mode (#48)
    if (examHardcore) return;
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
      const hasAnswer = a.chosen !== null || a.msChosen.length > 0 || a.orderSeq.length > 0 || Object.keys(a.topoState || {}).length > 0;
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
    const answeredCount = examAnswers.filter(a => a.chosen !== null || a.msChosen.length > 0 || a.orderSeq.length > 0 || Object.keys(a.topoState || {}).length > 0).length;
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
    _releaseExamWakeLock();  // Phase 10: phone can sleep now
    hideExamModal();

    const total = examQuestions.length;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    examAnswers.forEach((a, i) => {
      const q = examQuestions[i];
      const qType = getQType(q);
      let qCorrect = false, qSkipped = false;

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

    const pct = Math.round((correct / total) * 100);
    const scaledScore = Math.round(100 + (correct / total) * 800);
    const passed      = scaledScore >= EXAM_PASS_SCORE;

    // Build log for review
    log = examQuestions.map((q, i) => {
      const a = examAnswers[i];
      const qType = getQType(q);
      let isRight, chosen, correctVal, isSkipped;

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
    saveToHistory({ date: new Date().toISOString(), topic: EXAM_TOPIC, difficulty: 'Mixed', score: correct, total, pct, mode: 'exam', hardcore: examHardcore });
    // v4.81.13 (Codex r∞ user request): also write per-topic split rows so the
    // exam contributes to readiness / progress / weak-spots / what-if /
    // domain mastery — pre-fix the rolled-up EXAM_TOPIC sentinel was filtered
    // OUT by getReadinessScore (and every other surface that reads history
    // per-topic), so a 90-question exam was a "standalone entity" with zero
    // signal contribution beyond the wrong-bank + SR seed.
    try { _saveExamPerTopicSplit(log, examHardcore); } catch (e) { console.warn('[exam-split]', e); }
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
    // Hardcore badge on results hero (#48)
    const hcBadge = document.getElementById('exam-hardcore-badge');
    if (hcBadge) hcBadge.classList.toggle('is-hidden', !examHardcore);

    document.getElementById('exam-result-msg').textContent = passed
      ? `Score ${scaledScore}/900 \u2014 above the ${EXAM_PASS_SCORE} pass mark. Exam-ready!`
      : `Score ${scaledScore}/900 \u2014 need ${EXAM_PASS_SCORE - scaledScore} more points. Keep drilling!`;

    animateCount('exam-r-correct', 0, correct, 800);
    animateCount('exam-r-wrong', 0, wrong, 800);
    animateCount('exam-r-skipped', 0, skipped, 600);
    document.getElementById('exam-r-pct').textContent     = pct + '%';

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
  function _saveExamPerTopicSplit(log, hardcore) {
    if (!Array.isArray(log) || log.length === 0) return 0;
    const byTopic = {};
    log.forEach(entry => {
      const q = entry && entry.q;
      if (!q) return;
      const t = q.topic;
      if (!t || t === MIXED_TOPIC || t === EXAM_TOPIC) return;
      if (!byTopic[t]) byTopic[t] = { correct: 0, total: 0 };
      byTopic[t].total++;
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
        mode: 'exam', hardcore: !!hardcore,
        via: 'exam-split'
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

  window._certanvilFeatures['exam'] = {
    enter: startExam,
    startExam: startExam
  };
})();
