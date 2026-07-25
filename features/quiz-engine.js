// #138 wave 8: quiz engine — extracted from app.js
// Eager-loaded feature; <script defer> in index.html; in sw.js SHELL_ASSETS.
// All exports are exposed via window.* so callers in app.js, exam.js,
// flagship-drills.js, diagnostic.js and HTML onclick attributes keep working.
(function () {
  'use strict';

  // ══════════════════════════════════════════
  // START REGULAR QUIZ
  // ══════════════════════════════════════════
  async function startQuiz() {
    if (!_gateActivityForQuota('practice quizzes')) return;
    // v7.46.0: free custom quizzes cap at 15 questions — the full daily
    // allowance in one set (Simi, 2026-06-11). The count-chip interceptor
    // blocks the picker; this is the enforcement behind it.
    if (qCount > 15 && typeof _srIsFreeTier === 'function' && _srIsFreeTier()) {
      if (!_gateProOnly('Bigger sets', {
        title: 'Bigger sets are a Pro feature',
        body: 'Free tops out at 15 questions a set · your whole daily allowance in one go. Pro goes as big as you like.'
      })) return;
    }
    if (!_gateSessionSizeForQuota(qCount, { mode: 'quiz' })) return;
    const key = document.getElementById('api-key').value.trim();
    const errBox = document.getElementById('setup-err');
    errBox.classList.add('is-hidden');
    const keyErr = validateApiKey(key);
    if (keyErr) {
      errBox.textContent = keyErr; errBox.classList.remove('is-hidden');
      showSetupError();
      // v7.x: if this is the signed-out gate (no key, not signed in), surface an
      // in-view prompt anchored to the Generate Quiz CTA or the primaryLaunch tile.
      if (window._certanvilSignedIn !== true && !key) {
        var anchor = document.querySelector('.cq-summary-cta') ||
                     document.getElementById('primaryLaunch');
        _showSignInPrompt(anchor, keyErr);
      }
      return;
    }
    apiKey = key;
    localStorage.setItem(STORAGE.KEY, key);
    examMode = false;
    wrongDrillMode = false;
  
    // v4.54.15: Smart + Multi: handled alongside single-topic + Mixed.
    activeQuizTopic = topic.includes('Smart')
      ? getSpacedRepTopic()
      : topic;
  
    // v7.65.1: dismiss the Custom Quiz picker before navigating. It's a <details>
    // overlay portaled to <body> (z-index 140) that only closes on Escape /
    // backdrop / summary — nothing here closed it, so showPage('loading') below
    // swapped the underlying page WHILE the picker stayed on top. Generation then
    // ran behind the picker: the user saw "nothing happens", or a lag until the
    // picker was incidentally dismissed. Setting .open = false reuses the modal's
    // own teardown (un-portal + restore <html> overflow). Placed AFTER the gates
    // and key check so early-returns (quota / sign-in prompt anchored in the
    // modal) still leave it open; harmless no-op if already closed.
    var _cqPicker = document.getElementById('custom-quiz-section');
    if (_cqPicker && _cqPicker.open) _cqPicker.open = false;
  
    document.getElementById('load-progress').classList.add('is-hidden');
    showPage('loading');
    // v4.81.19: comma-safe count — naive split(',') over-counts when any
    // topic name contains commas (e.g. "NTP, ICMP & Traffic Types").
    const _multiCount = topic.startsWith('Multi: ')
      ? (typeof _parseMultiTopicSentinel === 'function'
          ? _parseMultiTopicSentinel(topic).length
          : topic.slice(7).split(',').length)
      : 0;
    document.getElementById('loading-msg').textContent = topic.includes('Smart')
      ? '\ud83e\udde0 Smart pick: ' + activeQuizTopic + '\u2026'
      : _multiCount >= 2
        ? `Generating ${qCount} ${diff} questions across ${_multiCount} topics\u2026`
        : 'Generating ' + qCount + ' ' + diff + ' questions on ' + activeQuizTopic + '\u2026';
  
    // v4.82.1: surface the smooth loading progress bar with stage milestones.
    _loadingProgressBegin('Generating questions\u2026');
  
    showCacheNotice(false);
    // Fire topic brief in parallel (non-blocking). Skip for Mixed AND Multi
    // modes \u2014 a brief only makes sense for a single focused topic.
    const briefTopic = activeQuizTopic;
    if (!briefTopic.includes('Mixed') && !briefTopic.startsWith('Multi: ')) {
      fetchTopicBrief(key, briefTopic);
    } else {
      const tb = document.getElementById('topic-brief');
      if (tb) tb.classList.add('is-hidden');
    }
    try {
      // v4.43.4 — over-request to absorb validation dropout + retry-to-fill if short.
      // The 4-layer validation pipeline (prompt self-check → Sonnet validator →
      // programmatic validateQuestions → GT guards) typically drops 10–40% of
      // generated questions. Pre-v4.43.4 the code tolerated shortfalls as
      // "acceptable", which consistently shipped 6-9 questions for a requested 10.
      // Now: over-request by 30% (min +3), then if we're still short after validation,
      // do ONE retry for the exact deficit + buffer, then slice to qCount.
      const DROPOUT_BUFFER = Math.max(3, Math.ceil(qCount * 0.3));
      document.getElementById('loading-msg').textContent =
        'Generating ' + qCount + ' ' + diff + ' questions on ' + activeQuizTopic + '\u2026';
      let raw = await fetchQuestions(key, activeQuizTopic, diff, qCount + DROPOUT_BUFFER);
      _loadingProgressUpdate('Verifying quality\u2026', 45);
      // Enhancement 1: AI second-pass validation
      document.getElementById('loading-msg').textContent = 'Verifying question accuracy\u2026';
      raw = await aiValidateQuestions(key, raw);
      _loadingProgressUpdate('Finalizing\u2026', 80);
      // Enhancement 2 + 4: Programmatic validation + reported question exclusion
      questions = validateQuestions(raw);
      if (questions.length === 0) throw new Error('All generated questions failed validation. Try again.');
  
      // Retry-to-fill: if validation left us short of qCount, fetch the deficit + buffer.
      if (questions.length < qCount) {
        const deficit = qCount - questions.length;
        _loadingProgressUpdate('Topping up (' + deficit + ' more)\u2026', 85);
        document.getElementById('loading-msg').textContent =
          'Generating ' + deficit + ' more to complete your ' + qCount + '-question set\u2026';
        try {
          const extraRaw = await fetchQuestions(key, activeQuizTopic, diff, deficit + DROPOUT_BUFFER);
          const extraValidated = validateQuestions(await aiValidateQuestions(key, extraRaw));
          questions = questions.concat(extraValidated);
        } catch (retryErr) {
          // If the retry fails (network/API hiccup), ship what we have — better than
          // blocking the user entirely. They'll see a slight shortfall rather than an error.
          console.warn('Retry fetch failed, shipping what we have:', retryErr);
        }
      }
  
      // Slice to exact count — truncates buffer overage from the initial over-request
      // and/or retry overage. If we're STILL short after retry (rare — both rounds
      // dropped heavily), ship what we have rather than error out.
      if (questions.length > qCount) {
        questions = questions.slice(0, qCount);
      }
    } catch(e) {
      const cached = getCachedQuestions(activeQuizTopic, diff, qCount);
      if (cached) {
        questions = cached.slice(0, qCount);
        showCacheNotice(true);
      } else {
        _loadingProgressFinish(); // hide bar before returning to setup
        showPage('setup');
        errBox.textContent = '\u26a0\ufe0f ' + (e.message || 'Failed. Check your API key.');
        errBox.classList.remove('is-hidden');
        return;
      }
    }
    // Inject CLI sim / topology PBQs from predefined bank
    const pbqInjectCount = qCount >= 10 ? 1 : 0;
    if (pbqInjectCount > 0) {
      questions = injectPBQs(questions, activeQuizTopic, pbqInjectCount);
    }
    current = 0; score = 0; streak = 0; bestStreak = 0; answered = 0; log = [];
    quizFlags = new Array(questions.length).fill(false);
    // v4.54.8: mark session start for the elapsed-time row on Results
    _sessionStartTs = Date.now();
    // v4.82.1: snap progress bar to 100% then hide before the quiz renders.
    _loadingProgressFinish();
    showPage('quiz');
    render();
  }
  
  // v4.54.8: render segmented per-question progress dots. Derives state
  // from `log` entries (which store isRight per answered question) + `current`
  // for the active-question pill. Pending questions get a small grey dot.
  // v4.82.0: dots are now clickable <button>s wired to jumpToQuestion(i).
  // Numbered labels, hover lift, full keyboard reachability. The visual
  // styling for the new circular treatment lives in `#quiz-prog-dots .qpd-cell`
  // (scoped to quiz only — exam dots stay thin since exam has its own
  // navigator UI).
  function _renderQuizProgressDots() {
    const el = document.getElementById('quiz-prog-dots');
    if (!el || !Array.isArray(questions)) return;
    const n = questions.length;
    // Build a quick lookup of question -> log index (log entries are in answered order;
    // we match on the question object identity since log.push({q, ...}) preserves refs).
    const logByQ = new Map();
    (log || []).forEach(entry => { if (entry && entry.q) logByQ.set(entry.q, entry); });
    const cells = [];
    for (let i = 0; i < n; i++) {
      const q = questions[i];
      const entry = logByQ.get(q);
      let cls = 'qpd-cell';
      let aria;
      let stateLabel;
      // v4.82.0: classes are no longer mutually exclusive — when revisiting a
      // previously-answered question, the dot is BOTH qpd-now AND qpd-done/wrong
      // so styling can show "you're here, and here's the past outcome."
      if (i === current) cls += ' qpd-now';
      if (entry && entry.isRight === true) { cls += ' qpd-done'; stateLabel = 'correct'; }
      else if (entry && entry.isRight === false) { cls += ' qpd-wrong'; stateLabel = 'wrong'; }
      else stateLabel = 'pending';
      aria = `Question ${i + 1}, ${stateLabel}` + (i === current ? ' (current)' : '');
      cells.push(`<button type="button" class="${cls}" onclick="jumpToQuestion(${i})" title="${aria}" aria-label="${aria}">${i + 1}</button>`);
    }
    el.innerHTML = cells.join('');
  }
  

  // ══════════════════════════════════════════
  // v4.82.0 — Quiz revisit nav helpers
  // ══════════════════════════════════════════
  // All three helpers are pure index navigation. They re-render and refresh
  // the prev/next arrow enabled-state. `render()` checks for an existing
  // log entry on the target question and restores its answered-state UI
  // (markers + explanation + revisit banner + re-enabled inputs) so the
  // user can re-pick.
  
  // Find the existing log entry for a question (by object identity, matching
  // how _renderQuizProgressDots builds its map). Returns { entry, idx } or null.
  function _findLogEntryFor(q) {
    if (!Array.isArray(log) || !q) return null;
    for (let i = 0; i < log.length; i++) {
      if (log[i] && log[i].q === q) return { entry: log[i], idx: i };
    }
    return null;
  }
  
  // v4.82.0: recompute score + answered from `log` after a re-pick. Streak
  // is intentionally NOT recomputed — we treat streak as a forward-only
  // "you got X correct in a row on first attempt" signal. Re-picks after
  // seeing the answer don't move it.
  function _recomputeQuizCounters() {
    if (!Array.isArray(log)) return;
    answered = log.length;
    score = log.filter(e => e && e.isRight === true).length;
    _setLiveScore(score, answered);
    // recompute is a truth-up after a re-pick, not a new value arriving — no break shake
    _setLiveStreak(streak, false);
  }
  
  // v4.82.0: enable/disable prev/next arrows based on current position.
  // Prev: enabled when current > 0.
  // Next-arrow: enabled when current < questions.length - 1 AND the current
  //             question is either answered OR a future question is answered
  //             (so user can navigate over already-answered questions freely
  //             without being forced to re-answer pending ones first).
  function _renderQuizNavArrows() {
    const prevBtn = document.getElementById('quiz-prev-btn');
    const nextBtn = document.getElementById('quiz-next-arrow-btn');
    if (!prevBtn || !nextBtn || !Array.isArray(questions)) return;
    const total = questions.length;
    prevBtn.disabled = current <= 0;
    // Enable next-arrow if there's any answered or current question after this one,
    // OR this question is already answered (so we can move forward).
    const thisAnswered = !!_findLogEntryFor(questions[current]);
    let canForward = false;
    if (current < total - 1) {
      if (thisAnswered) {
        canForward = true;
      } else {
        // Pending current — only allow forward if any LATER question is also answered.
        // (This handles the case where user jumped over a pending and came back.)
        for (let i = current + 1; i < total; i++) {
          if (_findLogEntryFor(questions[i])) { canForward = true; break; }
        }
      }
    }
    nextBtn.disabled = !canForward;
  }
  
  // v8.0.0 (motion lift wave 2) — directional question navigation.
  //
  // DEVIATION FROM THE MOCKUP, deliberate. The mockup builds a fresh .t-page
  // per question and appends it into a .t-slide container, so the incoming and
  // outgoing pages briefly coexist. The live engine cannot do that as-is: the
  // whole card is addressed by fixed ids (#q-text, #options, #exp-box, …) that
  // ~40 call sites write to, and cloning it would duplicate every one of them.
  // A full two-page rewrite of the app's most-used surface is a bigger change
  // than wave 2 should carry — see the wave 7/8 extraction regressions.
  //
  // So the card stays a single element and we sequence instead of overlap:
  // the outgoing content slides out along --dgm-dir, then the new question
  // renders and rides slice 1's staggered reveal back in. Because the card
  // never leaves the flow, the container cannot collapse mid-transition —
  // which is the failure the mockup's "join before leaving" rule exists to
  // prevent, avoided here by construction rather than by ordering.
  const _NAV_EXIT_MS = 200;   // matches .is-hiding's fade in dg-system.css
  let _navInFlight = false;

  function _navigateTo(idx, after) {
    const card = document.querySelector('#page-quiz .q-card');
    const commit = () => {
      current = idx;
      render();
      if (typeof after === 'function') after();
      window.scrollTo(0, 0);
    };
    if (!card) { commit(); return; }
    // Direction MUST be resolved BEFORE `current` moves — comparing against an
    // already-updated index animates back-navigation forwards.
    card.style.setProperty('--dgm-dir', idx < current ? '-1' : '1');
    if (_navInFlight) { commit(); return; }   // double-tap: land immediately, don't queue
    _navInFlight = true;
    card.classList.add('is-hiding');
    setTimeout(() => {
      card.classList.remove('is-hiding');
      _navInFlight = false;
      commit();
    }, _NAV_EXIT_MS);
  }

  function jumpToQuestion(idx) {
    if (!Array.isArray(questions)) return;
    if (typeof idx !== 'number' || idx < 0 || idx >= questions.length) return;
    if (idx === current) return;
    _navigateTo(idx);
  }
  
  // v4.82.0: TEST-ONLY hook so Playwright can drop us into a quiz session
  // without making real Haiku API calls. The top-level `let questions` etc.
  // aren't reachable via `window.questions = ...` (let-declared vars don't
  // attach to window), so without this hook the E2E flow can't seed state.
  // Always safe — no destructive behavior; just resets module state.
  window._testInjectQuiz = function(qs) {
    if (!Array.isArray(qs) || qs.length === 0) return false;
    questions = qs;
    current = 0;
    score = 0;
    streak = 0;
    bestStreak = 0;
    answered = 0;
    log = [];
    quizFlags = qs.map(() => false);
    msSelections = [];
    orderSequence = [];
    topoDevices = {};
    topic = MIXED_TOPIC;
    activeQuizTopic = MIXED_TOPIC;
    showPage('quiz');
    render();
    return true;
  };
  
  function prevQuestion() {
    if (current > 0) jumpToQuestion(current - 1);
  }
  
  function nextQuestion() {
    if (!Array.isArray(questions)) return;
    if (current < questions.length - 1) jumpToQuestion(current + 1);
    else if (current === questions.length - 1 && _findLogEntryFor(questions[current])) {
      // Last question + answered → show results.
      finish();
    }
  }
  
  // v4.82.0: surface/hide the revisit banner. Visible whenever the rendered
  // question has a log entry (i.e. user is looking at a question they've
  // already answered). Inert affordance — just sets expectation.
  function _renderRevisitBanner(hasEntry) {
    const banner = document.getElementById('quiz-revisit-banner');
    if (!banner) return;
    if (hasEntry) banner.classList.remove('is-hidden');
    else banner.classList.add('is-hidden');
  }
  

  // ══════════════════════════════════════════
  // v4.82.1 — Smooth quiz/diagnostic loading progress
  // ══════════════════════════════════════════
  // User feature request: "when the questions are loading there needs to be
  // some kind of loading bar aswell." Pre-fix, regular quizzes showed only a
  // skeleton + status text — exam mode had a per-batch percentage bar but
  // quizzes/diagnostic flows didn't. This module surfaces the existing
  // #load-progress element on the loading page with a determinate stage-based
  // fill that smoothly eases between milestones.
  //
  // Smoothness is the key UX requirement. Three patterns combined:
  //   1. Each milestone is a real event (Haiku resolved, Sonnet resolved,
  //      programmatic validation done) — no fakery.
  //   2. The fill width transitions via cubic-bezier(0.16, 1, 0.3, 1) over
  //      1.6s — races forward then decelerates. Makes the bar feel responsive
  //      at first then settle near the milestone (creates anticipation for
  //      the next jump).
  //   3. A shimmer overlay (CSS pseudo-element + @keyframes) animates
  //      continuously regardless of width changes, so the bar always feels
  //      "alive" even between real events.
  //
  // Stage milestones (default for `startQuiz`):
  //   Start   →   8% (immediate visual "we're working")
  //   Generating questions   →   45%
  //   Verifying quality   →   80%
  //   Finalizing   →   95%
  //   Complete   →   100% (fade out)
  //
  // For multi-batch flows (n>10 parallel batches OR exam mode), call
  // `_loadingProgressUpdate(label, pct)` directly with real per-batch %.
  
  let _loadingProgressBar = null;
  let _loadingProgressLabel = null;
  
  function _loadingProgressBegin(initialLabel) {
    const prog = document.getElementById('load-progress');
    _loadingProgressBar = document.getElementById('load-bar-fill');
    _loadingProgressLabel = document.getElementById('load-progress-label');
    if (!prog || !_loadingProgressBar) return;
    prog.classList.remove('is-hidden');
    // Reset to 0 instantly, then fade to initial milestone after a tiny tick.
    _loadingProgressBar.style.transition = 'none';
    _loadingProgressBar.style.width = '0%';
    // Force reflow so the next transition fires from 0 cleanly.
    void _loadingProgressBar.offsetWidth;
    _loadingProgressBar.style.transition = ''; // restore CSS-defined transition
    // Initial visual nudge so the bar shows immediate progress on click.
    setTimeout(() => {
      if (_loadingProgressBar) _loadingProgressBar.style.width = '8%';
    }, 30);
    if (_loadingProgressLabel && initialLabel) _loadingProgressLabel.textContent = initialLabel;
  }
  
  function _loadingProgressUpdate(label, pct) {
    if (!_loadingProgressBar) return;
    if (typeof pct === 'number') {
      const clamped = Math.max(0, Math.min(100, pct));
      _loadingProgressBar.style.width = clamped + '%';
    }
    if (_loadingProgressLabel && label) _loadingProgressLabel.textContent = label;
  }
  
  function _loadingProgressFinish() {
    if (!_loadingProgressBar) return;
    // Snap to 100% then schedule hide. The 100% bump uses the same eased
    // transition so it doesn't feel jarring relative to the prior milestones.
    _loadingProgressBar.style.width = '100%';
    if (_loadingProgressLabel) _loadingProgressLabel.textContent = 'Ready!';
    setTimeout(() => {
      const prog = document.getElementById('load-progress');
      if (prog) prog.classList.add('is-hidden');
      _loadingProgressBar = null;
      _loadingProgressLabel = null;
    }, 400);
  }
  
  // #138 wave 6: loader stub — features/exam.js overwrites window.startExam on load.

  // ══════════════════════════════════════════
  // QUESTION TYPE HELPERS
  // ══════════════════════════════════════════
  function getQType(q) {
    return q.type || 'mcq';
  }
  
  // v4.56.0 — Scenario context block helper. Exam-realism practice: real N10-009
  // questions lean on scenario framing ("A technician is configuring X..."). We
  // render an optional 1-3 sentence context block between the question stem and
  // the answer grid. Only fires for MCQ / multi-select types — cli-sim
  // and topology already have their own scenario containers inside the options
  // box. Rule enforced by authors: scenario describes ENVIRONMENT, never restates
  // the subject of the question (avoid the "L2 switch → which layer?" trap).
  function _renderScenarioBlock(elId, q, qType) {
    const el = document.getElementById(elId);
    if (!el) return;
    const scenario = typeof q.scenario === 'string' ? q.scenario.trim() : '';
    const isNestedType = qType === 'cli-sim' || qType === 'topology';
    if (!scenario || isNestedType) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    // escape user-facing text (questions can be AI-generated) — no keyword highlighting
    // here since scenario is setup prose, not the stem that keyword emphasis helps with
    el.innerHTML = '<span class="q-scenario-rule" aria-hidden="true"></span>' +
                   '<span class="q-scenario-body">' + escHtml(scenario) + '</span>';
  }
  

  // ══════════════════════════════════════════
  // REGULAR QUIZ RENDER
  // ══════════════════════════════════════════
  function render() {
    const q     = questions[current];
    const total = questions.length;
    const pct   = Math.round((current / total) * 100);
    const qType = getQType(q);
  
    _setLiveScore(score, answered);
    _setLiveStreak(streak, false);
    document.getElementById('q-label').textContent     = `Question ${current + 1} of ${total}`;
    _swapText(document.getElementById('q-pct'), pct + '%');
    document.getElementById('prog-fill').style.width   = pct + '%';
    document.getElementById('q-num').textContent       = `Q${current + 1}`;
    // v4.54.8: segmented per-question progress dots. State derived from `log` entries.
    _renderQuizProgressDots();
  
    const badge = document.getElementById('diff-badge');
    const dc    = (q.difficulty || DEFAULT_DIFF).replace(/[^a-zA-Z]/g, '');
    badge.className   = `diff-badge diff-${dc}`;
    badge.textContent = q.difficulty || DEFAULT_DIFF;
  
    // PBQ badge
    const pbqBadge = document.getElementById('pbq-badge');
    if (pbqBadge) {
      if (qType === 'multi-select') { pbqBadge.textContent = 'Multi-Select'; pbqBadge.classList.remove('is-hidden'); }
      else if (qType === 'order') { pbqBadge.textContent = 'Ordering'; pbqBadge.classList.remove('is-hidden'); }
      else if (qType === 'cli-sim') { pbqBadge.textContent = 'CLI Sim'; pbqBadge.classList.remove('is-hidden'); }
      else if (qType === 'topology') { pbqBadge.textContent = 'Topology'; pbqBadge.classList.remove('is-hidden'); }
      else if (qType === 'hot-area') {
        // v4.83.0 — sub-shape-aware label
        const sub = q.subShape === 'osi' ? 'OSI' : q.subShape === 'cable-grid' ? 'Cable' : 'Topology';
        pbqBadge.textContent = 'Hot Area · ' + sub;
        pbqBadge.classList.remove('is-hidden');
      }
      else { pbqBadge.classList.add('is-hidden'); }
    }
  
    setQuestionText(document.getElementById('q-text'), q.question);
  
    // v4.56.0 — optional scenario context block. Only rendered for MCQ / multi-select /
    // order types; cli-sim and topology already render their own scenario container
    // inside the options box via renderCliSim/renderTopology, so skip to avoid doubling.
    _renderScenarioBlock('q-scenario', q, qType);
  
    // Flag button
    const flagBtn = document.getElementById('quiz-flag-btn');
    flagBtn.className = 'flag-btn' + (quizFlags[current] ? ' flagged' : '');
    flagBtn.textContent = quizFlags[current] ? 'Flagged' : 'Flag';
    flagBtn.setAttribute('aria-pressed', quizFlags[current] ? 'true' : 'false');
  
    const box = document.getElementById('options');
    box.innerHTML = '';
  
    if (qType === 'multi-select') {
      renderMultiSelect(q, box);
    } else if (qType === 'order') {
      renderOrder(q, box);
    } else if (qType === 'cli-sim') {
      renderCliSim(q, box);
    } else if (qType === 'topology') {
      renderTopology(q, box);
    } else if (qType === 'hot-area') {
      // v4.83.0 — hot-area click-on-diagram PBQ
      renderHotArea(q, box);
    } else {
      renderMCQ(q, box);
    }
  
    const expBox = document.getElementById('exp-box');
    expBox.className = 'explanation-box';
    expBox.classList.add('is-hidden');
    // Collapse before the box is hidden so the next answer opens from closed
    // rather than flashing the previous question's reasoning already expanded.
    _setExplanationAccordion(false);
  
    const btnNext = document.getElementById('btn-next');
    btnNext.className = 'btn-next';
    btnNext.textContent = current === total - 1 ? 'See Results' : 'Next \u2192';
    btnNext.onclick = current === total - 1 ? finish : advance;
  
    // v8.0.0 (motion lift wave 2) — question reveal now rides the shared
    // .t-reveal primitive (dg-system.css, wave 1) instead of the v4.44.0
    // .q-text-reveal + .option-stagger-in pair. One vocabulary, one curve,
    // one reduced-motion collapse — see BRAND.md §6.
    //
    // Stagger is CSS-driven off data-i (the 60ms --dgm-step unit), so the
    // per-element inline animationDelay writes are gone. data-i mirrors the
    // mockup: stem 0, scenario 1, options 1..n. Scenario and option A sharing
    // step 1 is the mockup's own choice — they read as one band.
    //
    // The legacy .q-text-reveal / .option-stagger-in rules stay in styles.css
    // deliberately: tests/uat/040 pins them inside that file's reduced-motion
    // block. Nothing carries the classes any more, so they are inert.
    const qCard   = document.querySelector('#page-quiz .q-card');
    const qTextEl = document.getElementById('q-text');
    const scenEl  = document.getElementById('q-scenario');

    if (qTextEl) { qTextEl.classList.add('t-reveal'); qTextEl.setAttribute('data-i', '0'); }
    if (scenEl && !scenEl.hidden) { scenEl.classList.add('t-reveal'); scenEl.setAttribute('data-i', '1'); }
    else if (scenEl) scenEl.classList.remove('t-reveal');

    const allOptionEls = box.querySelectorAll('.option, .ms-option, .order-item');
    allOptionEls.forEach((el, i) => {
      el.classList.add('t-reveal');
      // dg-system.css defines delay steps 1..6; past that they land together
      // rather than trailing off, which is the right read for a long list.
      el.setAttribute('data-i', String(Math.min(i + 1, 6)));
    });

    // Re-arm: drop .is-shown, force a reflow so the pre-reveal style is
    // actually flushed, then flip it back synchronously. NEVER rAF-gate this
    // — rAF does not fire in a backgrounded tab, so a user who switches away
    // mid-render would come back to a question stuck at opacity 0.
    if (qCard) {
      qCard.classList.remove('is-shown');
      void qCard.offsetWidth;
      qCard.classList.add('is-shown');
    }
  
    // v4.82.0: refresh score/streak header (in case re-pick recomputed them)
    // and refresh prev/next arrow enabled-state.
    _recomputeQuizCounters();
    _renderQuizNavArrows();
  
    // v4.82.0: if this question is already in the log, restore its answered-
    // state UI on top of the pristine render — markers, explanation, revisit
    // banner, and re-enabled inputs so the user can re-pick.
    const existingEntry = _findLogEntryFor(q);
    if (existingEntry) {
      _restoreAnsweredQuizState(q, existingEntry.entry);
      _renderRevisitBanner(true);
      const qLabelEl = document.getElementById('q-label');
      if (qLabelEl) qLabelEl.textContent = `Question ${current + 1} of ${total} · revisiting`;
    } else {
      _renderRevisitBanner(false);
    }
  
    // Focus the question text for screen readers, first option for keyboard users
    setTimeout(() => {
      const firstOption = box.querySelector('.option, .ms-option, .order-item, button');
      if (firstOption) firstOption.focus();
    }, 150);
  }
  
  // v4.82.0: restore the answered-state UI on top of a pristine render. Walks
  // the just-rendered options and applies correct/wrong/reveal-correct/dimmed
  // markers based on q's answer key + entry.chosen. Crucially does NOT
  // disable the option click handlers — re-picks are allowed. Then surfaces
  // showExplanation so the user sees their previous outcome + the correct
  // answer + the explanation. Submit buttons for PBQ types are kept visible
  // so the user can re-submit after re-arranging.
  function _restoreAnsweredQuizState(q, entry) {
    if (!q || !entry) return;
    const qType = getQType(q);
    const box = document.getElementById('options');
    if (!box) return;
    // Tag the options container so CSS can re-enable clickable affordance.
    box.classList.add('is-revisiting');
  
    if (qType === 'mcq' || qType === 'cli-sim') {
      const chosen = entry.chosen;
      const correct = q.answer;
      const optionEls = box.querySelectorAll('.option');
      optionEls.forEach((btn, i) => {
        const l = ['A', 'B', 'C', 'D'][i];
        btn.classList.remove('correct', 'wrong', 'reveal-correct', 'dimmed');
        if (l === correct && l === chosen) btn.classList.add('correct');
        else if (l === chosen && l !== correct) btn.classList.add('wrong');
        else if (l === correct) btn.classList.add('reveal-correct');
        else btn.classList.add('dimmed');
      });
      if (qType === 'cli-sim') {
        const diag = document.getElementById('cli-diagnosis');
        if (diag) diag.classList.remove('is-hidden');
      }
    } else if (qType === 'multi-select') {
      const chosenSet = new Set((entry.chosen || '').split(',').filter(Boolean));
      const correctSet = new Set(q.answers || []);
      msSelections = [...chosenSet];
      const optBtns = box.querySelectorAll('.option');
      optBtns.forEach(btn => {
        const l = btn.dataset.letter;
        if (!l) return;
        btn.classList.remove('correct', 'wrong', 'reveal-correct', 'dimmed', 'ms-selected');
        const cb = btn.querySelector('.ms-checkbox');
        if (chosenSet.has(l)) { btn.classList.add('ms-selected'); if (cb) cb.textContent = '✓'; }
        else if (cb) cb.textContent = '';
        if (correctSet.has(l) && chosenSet.has(l)) btn.classList.add('correct');
        else if (chosenSet.has(l) && !correctSet.has(l)) btn.classList.add('wrong');
        else if (correctSet.has(l)) btn.classList.add('reveal-correct');
        else btn.classList.add('dimmed');
      });
      const submitBtn = document.getElementById('ms-submit-btn');
      if (submitBtn) {
        submitBtn.classList.remove('is-hidden');
        const reqCount = (q.answers || []).length || 2;
        submitBtn.disabled = msSelections.length !== reqCount;
        submitBtn.classList.toggle('is-dimmed', submitBtn.disabled);
      }
    } else if (qType === 'order') {
      const chosen = (entry.chosen || '').split(',').filter(Boolean).map(Number);
      orderSequence = chosen.slice();
      const items = q.items || [];
      document.querySelectorAll('#order-items .order-item').forEach(btn => {
        const idx = parseInt(btn.dataset.idx);
        btn.classList.toggle('placed', orderSequence.includes(idx));
      });
      const list = document.getElementById('order-placed-list');
      if (list) {
        if (orderSequence.length === 0) {
          list.innerHTML = '<span style="color:var(--text-dim);font-size:13px">Click items above in the correct order</span>';
        } else {
          list.innerHTML = orderSequence.map((idx, pos) =>
            `<div class="order-placed-item"><span class="order-placed-num">${pos + 1}</span>${escHtml(items[idx])}</div>`
          ).join('');
        }
      }
      const submitBtn = document.getElementById('order-submit-btn');
      if (submitBtn) {
        submitBtn.classList.remove('is-hidden');
        submitBtn.disabled = orderSequence.length !== items.length;
        submitBtn.classList.toggle('is-dimmed', submitBtn.disabled);
      }
    } else if (qType === 'topology') {
      try { topoDevices = JSON.parse(entry.chosen || '{}'); }
      catch (_) { topoDevices = {}; }
      const zones = q.zones || [];
      zones.forEach(zone => {
        const zoneId = 'topo-zone-' + zone.replace(/[^a-zA-Z0-9]/g, '-');
        const el = document.getElementById(zoneId);
        if (!el) return;
        const placed = topoDevices[zone] || [];
        el.innerHTML = placed.map(d => `<span class="topo-placed">${escHtml(d)}</span>`).join('');
      });
      const submitBtn = document.getElementById('topo-submit-btn');
      if (submitBtn) submitBtn.classList.remove('is-hidden');
      const resetBtn = document.querySelector('.topo-controls .btn-ghost');
      if (resetBtn) resetBtn.classList.remove('is-hidden');
    } else if (qType === 'hot-area') {
      // v4.83.0 — hot-area revisit: re-apply reveal markers based on stored entry
      _restoreAnsweredHotAreaState(q, entry);
    }
  
    // Show explanation populated from THIS log entry (not log[log.length-1] which
    // is the most-recently-pushed entry — could be a different question now).
    showExplanation(q, entry.isRight, entry);
  }
  
  // ── MCQ Render (unified quiz + exam mode) ──
  function renderMCQ(q, box, ans) {
    box.setAttribute('role', 'radiogroup');
    box.setAttribute('aria-label', 'Answer options');
    ['A','B','C','D'].forEach(l => {
      const btn = document.createElement('button');
      const isSelected = ans && ans.chosen === l;
      btn.className = 'option' + (isSelected ? ' exam-selected' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      btn.setAttribute('aria-label', `Option ${l}: ${q.options[l]}`);
      btn.innerHTML = `<span class="opt-letter">${l}</span><span class="opt-text">${escHtml(q.options[l])}</span>`;
      if (ans) {
        btn.onclick = () => { examAnswers[examCurrent].chosen = l; renderExam(); };
      } else {
        btn.onclick = () => pick(l, q);
      }
      box.appendChild(btn);
    });
  }
  
  // ── Multi-Select Render (unified quiz + exam mode) ──
  function renderMultiSelect(q, box, ans) {
    const letters = Object.keys(q.options).sort();
    const reqCount = (q.answers || []).length || 2;
    if (!ans) msSelections = [];
  
    letters.forEach(l => {
      const btn = document.createElement('button');
      const isSelected = ans ? ans.msChosen.includes(l) : false;
      btn.className = 'option' + (isSelected ? ' ms-selected' : '');
      btn.dataset.letter = l;
      btn.setAttribute('role', 'checkbox');
      btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      btn.setAttribute('aria-label', `Option ${l}: ${q.options[l]}`);
      btn.innerHTML = `<span class="ms-checkbox">${isSelected ? '\u2713' : ''}</span><span class="opt-text">${escHtml(q.options[l])}</span>`;
      btn.onclick = () => {
        if (ans) {
          const idx = ans.msChosen.indexOf(l);
          if (idx >= 0) ans.msChosen.splice(idx, 1);
          else ans.msChosen.push(l);
          renderExam();
        } else {
          // v4.82.0: removed the post-submit click-guard so re-picks are
          // possible during revisit. submitMultiSelect's update-branch
          // handles truth-up.
          const idx = msSelections.indexOf(l);
          if (idx >= 0) {
            msSelections.splice(idx, 1);
            btn.classList.remove('ms-selected');
            btn.querySelector('.ms-checkbox').textContent = '';
            btn.setAttribute('aria-checked', 'false');
          } else {
            msSelections.push(l);
            btn.classList.add('ms-selected');
            btn.querySelector('.ms-checkbox').textContent = '\u2713';
            btn.setAttribute('aria-checked', 'true');
          }
          updateMsSubmitBtn(reqCount);
        }
      };
      box.appendChild(btn);
    });
  
    if (ans) {
      // Exam: selection hint only
      const hint = document.createElement('div');
      hint.className = 'ms-hint';
      hint.style.marginTop = '8px';
      hint.textContent = `Select ${reqCount} answers (${ans.msChosen.length} selected)`;
      box.appendChild(hint);
    } else {
      // Quiz: submit row
      const row = document.createElement('div');
      row.className = 'ms-submit-row';
      row.innerHTML = `<span class="ms-hint">Select ${reqCount} answers</span>`;
      const submitBtn = document.createElement('button');
      submitBtn.className = 'btn btn-primary';
      submitBtn.id = 'ms-submit-btn';
      submitBtn.textContent = 'Submit';
      submitBtn.disabled = true;
      submitBtn.classList.add('is-dimmed');
      submitBtn.onclick = () => submitMultiSelect(q);
      row.appendChild(submitBtn);
      box.appendChild(row);
    }
  }
  
  function updateMsSubmitBtn(reqCount) {
    const btn = document.getElementById('ms-submit-btn');
    if (!btn) return;
    const ready = msSelections.length === reqCount;
    btn.disabled = !ready;
    btn.classList.toggle('is-dimmed', !ready);
  }
  
  function submitMultiSelect(q) {
    const correctAnswers = (q.answers || []).sort();
    const chosen = [...msSelections].sort();
    const isRight = JSON.stringify(chosen) === JSON.stringify(correctAnswers);
    const existing = _findLogEntryFor(q);
  
    if (existing) {
      // v4.82.0: re-submit path — update existing entry, recompute counters, truth-up wrong-bank
      const wasRight = existing.entry.isRight === true;
      log[existing.idx] = { q, chosen: chosen.join(','), correct: correctAnswers.join(','), isRight, flagged: quizFlags[current] };
      if (!isRight && wasRight) addToWrongBank(q, chosen.join(','));
      else if (isRight && !wasRight) graduateFromBank(q.question);
      _recomputeQuizCounters();
    } else {
      answered++;
      updateTypeStat('multi-select', isRight);
      if (isRight) { score++; streak++; if (streak > bestStreak) bestStreak = streak; }
      else { streak = 0; }
      log.push({ q, chosen: chosen.join(','), correct: correctAnswers.join(','), isRight, flagged: quizFlags[current] });
      if (!isRight) addToWrongBank(q._bankOrig || q, chosen.join(','));  // v7.47.0: a missed variant re-triggers SR for its ORIGINAL (bank dedup no-ops)
      else if (wrongDrillMode) graduateFromBank(q._bankKey || q.question);  // v7.47.0: variant graduates its original
      _setLiveScore(score, answered);
      _setLiveStreak(streak, !isRight);
    }
  
    // Highlight options. v4.82.0: don't disable — re-picks via toggle remain possible.
    const optBtns = document.querySelectorAll('#options .option');
    optBtns.forEach(btn => {
      const l = btn.dataset.letter;
      if (!l) return;
      btn.classList.remove('correct', 'wrong', 'reveal-correct', 'dimmed');
      if (correctAnswers.includes(l) && chosen.includes(l)) btn.classList.add('correct');
      else if (chosen.includes(l) && !correctAnswers.includes(l)) btn.classList.add('wrong');
      else if (correctAnswers.includes(l)) btn.classList.add('reveal-correct');
      else btn.classList.add('dimmed');
    });
  
    // v4.82.0: keep the options container tagged for revisit affordance.
    const optionsBox = document.getElementById('options');
    if (optionsBox) optionsBox.classList.add('is-revisiting');
  
    // v4.82.0: keep submit button visible (re-submittable). It re-disables based
    // on whether selection still matches reqCount when user toggles.
    const submitBtn = document.getElementById('ms-submit-btn');
    if (submitBtn) submitBtn.classList.remove('is-hidden');
  
    _renderQuizProgressDots();
    _renderQuizNavArrows();
  
    const currentEntry = _findLogEntryFor(q);
    showExplanation(q, isRight, currentEntry ? currentEntry.entry : null);
  }
  
  // ── Order Render (unified quiz + exam mode) ──
  function renderOrder(q, box, ans) {
    const items = q.items || [];
    if (!ans) orderSequence = [];
    const currentSeq = () => ans ? ans.orderSeq : orderSequence;
  
    // Items to pick from
    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'order-items';
    itemsDiv.id = 'order-items';
  
    items.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.className = 'order-item' + (currentSeq().includes(idx) ? ' placed' : '');
      btn.dataset.idx = idx;
      btn.setAttribute('aria-label', `Item ${idx + 1}: ${item}`);
      btn.innerHTML = `<span class="order-num">${idx + 1}</span><span class="order-item-text">${escHtml(item)}</span>`;
      btn.onclick = () => {
        if (ans) {
          if (!ans.orderSeq.includes(idx)) { ans.orderSeq.push(idx); renderExam(); }
        } else {
          addToOrderSequence(idx, items, q);
        }
      };
      itemsDiv.appendChild(btn);
    });
    box.appendChild(itemsDiv);
  
    // Sequence display
    const seqDiv = document.createElement('div');
    seqDiv.className = 'order-sequence';
    if (ans) {
      let seqHtml = '<h4>Your Order:</h4><div class="order-placed-list">';
      if (ans.orderSeq.length === 0) {
        seqHtml += '<span style="color:var(--text-dim);font-size:13px">Click items above in order</span>';
      } else {
        seqHtml += ans.orderSeq.map((idx, pos) =>
          `<div class="order-placed-item"><span class="order-placed-num">${pos + 1}</span>${escHtml(items[idx])}</div>`
        ).join('');
      }
      seqHtml += '</div>';
      seqDiv.innerHTML = seqHtml;
    } else {
      seqDiv.innerHTML = '<h4>Your Order:</h4><div class="order-placed-list" id="order-placed-list"><span style="color:var(--text-dim);font-size:13px">Click items above in the correct order</span></div>';
    }
    box.appendChild(seqDiv);
  
    // Controls
    if (ans) {
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn btn-ghost';
      resetBtn.style.cssText = 'font-size:13px;margin-top:8px';
      resetBtn.textContent = 'Reset Order';
      resetBtn.onclick = () => { ans.orderSeq = []; renderExam(); };
      box.appendChild(resetBtn);
    } else {
      const controls = document.createElement('div');
      controls.className = 'order-controls';
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn btn-ghost';
      resetBtn.style.fontSize = '13px';
      resetBtn.textContent = 'Reset';
      resetBtn.onclick = () => { orderSequence = []; renderOrderState(items, q); };
      controls.appendChild(resetBtn);
  
      const submitBtn = document.createElement('button');
      submitBtn.className = 'btn btn-primary';
      submitBtn.id = 'order-submit-btn';
      submitBtn.textContent = 'Submit Order';
      submitBtn.disabled = true;
      submitBtn.classList.add('is-dimmed');
      submitBtn.onclick = () => submitOrder(q);
      controls.appendChild(submitBtn);
      box.appendChild(controls);
    }
  }
  
  function addToOrderSequence(idx, items, q) {
    if (orderSequence.includes(idx)) return;
    orderSequence.push(idx);
    renderOrderState(items, q);
  }
  
  function renderOrderState(items, q) {
    // Update item buttons
    const itemBtns = document.querySelectorAll('#order-items .order-item');
    itemBtns.forEach(btn => {
      const idx = parseInt(btn.dataset.idx);
      btn.classList.toggle('placed', orderSequence.includes(idx));
    });
  
    // Update placed list
    const list = document.getElementById('order-placed-list');
    if (orderSequence.length === 0) {
      list.innerHTML = '<span style="color:var(--text-dim);font-size:13px">Click items above in the correct order</span>';
    } else {
      list.innerHTML = orderSequence.map((idx, pos) =>
        `<div class="order-placed-item"><span class="order-placed-num">${pos + 1}</span>${escHtml(items[idx])}</div>`
      ).join('');
    }
  
    // Update submit button
    const btn = document.getElementById('order-submit-btn');
    if (btn) {
      const ready = orderSequence.length === items.length;
      btn.disabled = !ready;
      btn.classList.toggle('is-dimmed', !ready);
    }
  }
  
  function submitOrder(q) {
    const correctOrder = q.correctOrder || [];
    const isRight = JSON.stringify(orderSequence) === JSON.stringify(correctOrder);
    const existing = _findLogEntryFor(q);
  
    if (existing) {
      // v4.82.0: re-submit path
      const wasRight = existing.entry.isRight === true;
      log[existing.idx] = { q, chosen: orderSequence.join(','), correct: correctOrder.join(','), isRight, flagged: quizFlags[current] };
      if (!isRight && wasRight) addToWrongBank(q, orderSequence.join(','));
      else if (isRight && !wasRight) graduateFromBank(q.question);
      _recomputeQuizCounters();
    } else {
      answered++;
      updateTypeStat('order', isRight);
      if (isRight) { score++; streak++; if (streak > bestStreak) bestStreak = streak; }
      else { streak = 0; }
      log.push({ q, chosen: orderSequence.join(','), correct: correctOrder.join(','), isRight, flagged: quizFlags[current] });
      if (!isRight) addToWrongBank(q._bankOrig || q, orderSequence.join(','));  // v7.47.0: original identity preserved
      else if (wrongDrillMode) graduateFromBank(q._bankKey || q.question);  // v7.47.0: variant graduates its original
      _setLiveScore(score, answered);
      _setLiveStreak(streak, !isRight);
    }
  
    // v4.82.0: keep items + submit button clickable so user can re-arrange + re-submit.
    // (Previous behavior was to disable everything after first submit.)
    document.querySelectorAll('#order-items .order-item').forEach(btn => { btn.style.pointerEvents = ''; });
    const orderSubmitBtn = document.getElementById('order-submit-btn');
    if (orderSubmitBtn) orderSubmitBtn.classList.remove('is-hidden');
    const orderResetBtn = document.querySelector('.order-controls .btn-ghost');
    if (orderResetBtn) orderResetBtn.classList.remove('is-hidden');
    const optionsBox = document.getElementById('options');
    if (optionsBox) optionsBox.classList.add('is-revisiting');
    _renderQuizProgressDots();
    _renderQuizNavArrows();
  
    // Show correct vs wrong in placed list
    const items = q.items || [];
    const list = document.getElementById('order-placed-list');
    if (isRight) {
      // All correct — show green ticks
      list.innerHTML = orderSequence.map((idx, pos) => {
        return `<div class="order-placed-item order-correct"><span class="order-placed-num">${pos + 1}</span>${escHtml(items[idx])} \u2713</div>`;
      }).join('');
    } else {
      // Wrong — show user's order with X marks, then animate to correct order
      list.innerHTML = orderSequence.map((idx, pos) => {
        const isCorrectPos = correctOrder[pos] === idx;
        return `<div class="order-placed-item ${isCorrectPos ? 'order-correct' : 'order-wrong'}"><span class="order-placed-num">${pos + 1}</span>${escHtml(items[idx])} ${isCorrectPos ? '\u2713' : '\u2717'}</div>`;
      }).join('');
      // After a brief pause, reorder to show the CORRECT sequence
      setTimeout(() => {
        list.innerHTML = '<div class="order-correct-label">\u2705 Correct order:</div>' +
          correctOrder.map((idx, pos) => {
            const wasCorrect = orderSequence[pos] === idx;
            return `<div class="order-placed-item order-reveal${wasCorrect ? '' : ' order-highlight'}"><span class="order-placed-num">${pos + 1}</span>${escHtml(items[idx])}</div>`;
          }).join('');
      }, 1500);
    }
  
    const submittedEntry = _findLogEntryFor(q);
    showExplanation(q, isRight, submittedEntry ? submittedEntry.entry : null);
  }
  

  // ══════════════════════════════════════════
  // ANSWER SELECTION (MCQ)
  // ══════════════════════════════════════════
  function pick(chosen, q) {
    // v4.82.0: previously this guarded against re-picks via DOM state
    // (`document.querySelector('#options .option.correct, .option.wrong')`),
    // which made re-picks silently noop. Replaced with a proper revisit path:
    // if a log entry already exists for this question, UPDATE it instead of
    // pushing a new entry, then truth-up score/answered/wrong-bank.
    const isRight = chosen === q.answer;
    const existing = _findLogEntryFor(q);
  
    if (existing) {
      // ── Re-pick path: update existing log entry, recompute counters, truth-up wrong-bank ──
      const wasRight = existing.entry.isRight === true;
      log[existing.idx] = { q, chosen, correct: q.answer, isRight, flagged: quizFlags[current] };
      // Wrong-bank truth-up: reflect current answer truth, not first-attempt
      if (!isRight && wasRight) addToWrongBank(q, chosen);
      else if (isRight && !wasRight) graduateFromBank(q.question);
      // Recompute score + answered from log; streak intentionally untouched
      _recomputeQuizCounters();
    } else {
      // ── First-pick path (existing behavior) ──
      answered++;
      updateTypeStat(q.type || 'mcq', isRight);
      if (isRight) { score++; streak++; if (streak > bestStreak) bestStreak = streak; }
      else { streak = 0; }
      log.push({ q, chosen, correct: q.answer, isRight, flagged: quizFlags[current] });
      if (!isRight) addToWrongBank(q._bankOrig || q, chosen);  // v7.47.0: original identity preserved
      else if (wrongDrillMode) graduateFromBank(q._bankKey || q.question);  // v7.47.0: variant graduates its original
      _setLiveScore(score, answered);
      _setLiveStreak(streak, !isRight);
    }
  
    // Walk option buttons: apply markers WITHOUT disabling so re-picks remain possible.
    document.querySelectorAll('#options .option').forEach((btn, i) => {
      const l = ['A','B','C','D'][i];
      btn.classList.remove('correct', 'wrong', 'reveal-correct', 'dimmed');
      // v8.0.0 (wave 2): .t-shake is kept ORTHOGONAL to .wrong on purpose —
      // dropping both together would restart the colour treatment every time
      // the shake replays on a re-pick, so the option would flicker.
      btn.classList.remove('t-shake');
      if (l === q.answer && l === chosen)      btn.classList.add('correct');
      else if (l === chosen && !isRight)       btn.classList.add('wrong');
      else if (l === q.answer)                 btn.classList.add('reveal-correct');
      else                                     btn.classList.add('dimmed');
      if (l === chosen && !isRight) {
        // reflow between remove and add, or the browser coalesces the toggle
        // and the animation never re-fires on a repeat wrong pick
        void btn.offsetWidth;
        btn.classList.add('t-shake');
      }
    });
  
    // v4.82.0: keep the options container tagged for the revisit affordance
    // so future re-picks render with the right cursor/hover styling.
    const optionsBox = document.getElementById('options');
    if (optionsBox) optionsBox.classList.add('is-revisiting');
  
    // Refresh dot strip + nav arrow state since the log changed.
    _renderQuizProgressDots();
    _renderQuizNavArrows();
  
    // Pass the current entry to showExplanation so the wrong-explain block
    // reads the right chosen-letter (not log[log.length-1] which could be a
    // different question if user is revisiting).
    const currentEntry = _findLogEntryFor(q);
    showExplanation(q, isRight, currentEntry ? currentEntry.entry : null);
  }
  
  // v8.0.0 (motion lift wave 2) — text-states-swap.
  //
  // The THIRD numeric idiom, and the reason all three coexist:
  //   counting = accumulation      -> animateCount(), results tallies
  //   popping  = a new value       -> .t-digit, the live streak
  //   swapping = same slot, new    -> this, the topbar percent + score
  //
  // Contract from dg-system.css: add .is-exit, wait, swap the text and add
  // .is-enter-start, reflow, release. The timeout matches --dgm-press (150ms);
  // it is the exit half of the transition, not an arbitrary delay.
  const _SWAP_MS = 150;
  function _swapText(el, next) {
    if (!el) return;
    next = String(next);
    // No swap when nothing changed — render() runs on every question and
    // navigation, and swapping an identical value is motion for its own sake.
    if (el.textContent === next) return;
    el.classList.add('is-exit');
    setTimeout(() => {
      el.textContent = next;
      el.classList.remove('is-exit');
      el.classList.add('is-enter-start');   // pre-enter pose, transitions off
      void el.offsetWidth;                  // flush it, then release
      el.classList.remove('is-enter-start');
    }, _SWAP_MS);
  }

  // Score pill. Seven call sites wrote this as raw textContent (five here, two
  // in app.js) — exactly the spread that would have flattened the inner span,
  // the same trap _setLiveStreak closes.
  function _setLiveScore(scoreVal, answeredVal) {
    const host = document.getElementById('live-score');
    if (!host) return;
    let slot = document.getElementById('live-score-val');
    if (!slot) {                       // stale cached index.html — rebuild it
      host.textContent = '';
      slot = document.createElement('span');
      slot.className = 't-swap';
      slot.id = 'live-score-val';
      host.appendChild(slot);
    }
    _swapText(slot, `${scoreVal} / ${answeredVal}`);
  }

  // v8.1.0 (#495) — render the Deep Dive panel into the explanation accordion.
  //
  // Lives here, not in app.js's explainFurther(), for two reasons: this module
  // already owns the explanation surface the panel renders into, and app.js is
  // under the #138 extraction ratchet — building this markup there pushed the
  // file past its line cap, which is the ratchet doing exactly its job.
  //
  // `formatted` arrives already escHtml'd and section-tagged by app.js; it is
  // re-sanitised there via sanitizeHTML before it reaches the DOM.
  function _prepareDeepDive(el, formatted, wasCached) {
    // Split on the section headers so the six returned sections can stagger
    // in individually. Lookahead keeps each header attached to its body.
    const sectioned = String(formatted)
      .split(/(?=<span class="deep-section-header">)/)
      .filter(part => part.trim())
      .map((part, i) => '<span class="dd-sec" data-s="' + Math.min(i, 5) + '">' + part + '</span>')
      .join('');

    // .t-acc gives the panel grid-rows growth so the page reflows around it
    // instead of 250-350 words landing in a single frame. It starts CLOSED —
    // _openDeepDive grows it once it has a laid-out "from" state.
    const html = '<div class="t-acc-panel"><div class="t-acc-panel-inner">' +
                   '<strong>Deep Dive</strong>' +
                   (wasCached ? '<span class="dd-cached">Cached</span>' : '') +
                   '<div class="deep-explain-text">' + sectioned + '</div>' +
                 '</div></div>';
    el.className = 'deep-explain show t-acc';
    el.dataset.open = 'false';
    // Sec-P4/M6: DOMPurify backstop over the already-escHtml'd AI text.
    // Called UNCONDITIONALLY on purpose — no `typeof` fallback to raw html.
    // A missing sanitizer must fail loudly, never silently degrade into
    // injecting unsanitised model output into the page.
    el.innerHTML = sanitizeHTML(html);
  }

  // The three Deep Dive button states, in one place so they cannot drift.
  //   pending — orb + shimmer, and the label NAMES THE STATE (antalik's rule).
  //             "Loading" says nothing about what is happening during a
  //             multi-second teacher call. Only ever shown on a cache MISS.
  //   failed  — reuses the wrong-answer shake vocabulary. .t-shake is dropped
  //             and re-added around a reflow so a repeat failure replays it.
  //   done    — plain label; the panel below carries the payload.
  function _deepDiveBtnState(btn, state) {
    if (!btn) return;
    btn.classList.remove('t-shake');
    if (state === 'pending') {
      btn.disabled = true;
      btn.innerHTML =
        '<svg class="orb" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.3" stroke-dasharray="1.6 2.6" stroke-linecap="round" role="img" ' +
        'aria-label="Consulting the teacher"><circle cx="12" cy="12" r="9"/>' +
        '<ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="3.6" ry="9"/></svg>' +
        '<span class="t-shimmer" data-text="Consulting the teacher…">Consulting the teacher…</span>';
    } else if (state === 'failed') {
      btn.textContent = 'Failed — try again';
      btn.disabled = false;
      void btn.offsetWidth;
      btn.classList.add('t-shake');
    } else {
      btn.textContent = 'Explained';
      btn.disabled = true;
      btn.classList.add('explained');
    }
  }

  // Open it from closed. The reflow is load-bearing: without a laid-out "from"
  // state the 0fr->1fr growth settles at 0px and the panel opens to nothing —
  // the trap the verdict badge and the explanation accordion both hit. Never
  // rAF-gate it; rAF is dead in a backgrounded tab, which is exactly where a
  // slow teacher call finishes.
  function _openDeepDive(deepDiv, btn) {
    if (!deepDiv) return;
    void deepDiv.offsetHeight;
    deepDiv.dataset.open = 'true';
    deepDiv.classList.add('is-dd-shown');
    _deepDiveBtnState(btn, 'done');
  }

  // v8.0.0 (motion lift wave 2) — the explanation accordion.
  //
  // Wired lazily rather than at module load: quiz-engine.js is eager but the
  // listener only matters once an explanation has been shown, and a lazy wire
  // cannot lose the race against index.html parse order. Inline onclick is
  // deliberately not used — v7.79.0 removed those and v7.97.0 guards against
  // reintroducing them.
  let _expAccWired = false;
  function _wireExplanationAccordion() {
    if (_expAccWired) return;
    const acc  = document.getElementById('exp-acc');
    const head = document.getElementById('exp-acc-head');
    if (!acc || !head) return;
    head.addEventListener('click', () => {
      _setExplanationAccordion(acc.dataset.open !== 'true');
    });
    _expAccWired = true;
  }

  function _setExplanationAccordion(open) {
    const acc  = document.getElementById('exp-acc');
    const head = document.getElementById('exp-acc-head');
    if (!acc) return;
    if (open) {
      // #exp-box goes display:none -> block on the same turn as this open.
      // Without flushing layout first, the panel has no laid-out "from" state:
      // the 0fr->1fr transition starts from an unresolved track and settles at
      // 0px, so the panel opens to nothing and the explanation is invisible.
      // Reading offsetHeight forces the reflow. Same class of bug as the
      // verdict badge above — both were caught live, not by UAT.
      const panel = document.getElementById('exp-acc-panel');
      if (panel) void panel.offsetHeight;
    }
    acc.dataset.open = open ? 'true' : 'false';
    if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  // v8.0.0 (motion lift wave 2) — the live streak pill.
  //
  // Six call sites used to write `Streak N` as raw textContent (four here,
  // two in app.js's hot-area + topology submit paths). Any one of them would
  // have flattened the digit spans this needs, so they all route through here
  // now — the duplication was the bug waiting to happen.
  //
  // Two idioms, deliberately distinct (locked founder decision):
  //   popping  = a NEW VALUE ARRIVING  -> .t-digit, which is this
  //   counting = accumulation          -> animateCount(), results tallies
  // The pill also shakes when a streak BREAKS. .t-shake is kept orthogonal to
  // the value update so the shake can replay without disturbing the digits.
  // `isWrong` is the raw answer outcome, NOT "did a streak break". The helper
  // derives the break itself from the value it last rendered: a wrong answer
  // when the streak was already 0 breaks nothing, and shaking there would be
  // punishing the user for standing still. Deriving it here also means no
  // call site has to capture the pre-update streak.
  function _setLiveStreak(n, isWrong) {
    const pill = document.getElementById('live-streak');
    if (!pill) return;
    const prev  = parseInt(pill.dataset.v, 10);
    const broke = isWrong === true && Number.isFinite(prev) && prev > 0 && n === 0;

    // First call replaces the static "Streak 0" text with a stable structure:
    // a literal "Streak " text node plus a .t-digits host. Rebuilt only once,
    // so the text node is not re-created on every answer.
    let digits = pill.querySelector('.t-digits');
    if (!digits) {
      pill.textContent = '';
      pill.appendChild(document.createTextNode('Streak '));
      digits = document.createElement('span');
      digits.className = 't-digits';
      pill.appendChild(digits);
    }

    // Only pop when the value actually CHANGED. render() and the nav paths
    // call this on every question, and popping an unchanged streak on each
    // paint turns a signal into wallpaper.
    const changed = pill.dataset.v !== String(n);
    pill.dataset.v = String(n);

    digits.classList.remove('is-animating');
    digits.replaceChildren();
    String(n).split('').forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 't-digit';
      // dg-system.css stages delays for data-s 1 and 2; a 3-digit streak is
      // already implausible, so clamping is safe and keeps the cascade small.
      s.setAttribute('data-s', String(Math.min(i, 2)));
      s.textContent = c;
      digits.appendChild(s);
    });
    if (changed) {
      void digits.offsetWidth;   // flush, then animate — never rAF (dead in a background tab)
      digits.classList.add('is-animating');
    }

    pill.classList.remove('t-shake');
    if (broke) { void pill.offsetWidth; pill.classList.add('t-shake'); }
  }

  // v8.0.0 (motion lift wave 2) — the verdict badge's stroke-draw.
  // Both outcomes get a real glyph: a tick for right, a cross for wrong. An
  // outlined circle with nothing drawn inside it reads as a broken icon, not
  // as a state, and BRAND allows semantic marks.
  //
  // stroke-dasharray is measured with getTotalLength() every time rather than
  // hardcoded — the two paths differ in length, and a stale dasharray leaves
  // the stroke either pre-drawn or permanently short. This is the transitions
  // skill's #1 flagged SVG mistake.
  function _drawVerdictCheck(isRight) {
    const check = document.getElementById('exp-verdict-check');
    if (!check) return;
    const path = check.querySelector('path');
    if (!path || typeof path.getTotalLength !== 'function') return;

    check.style.color = isRight ? 'var(--pass)' : 'var(--fail)';
    path.setAttribute('d', isRight ? 'M7.5 12.4l3.1 3.1 6-6.4' : 'M9 9l6 6M15 9l-6 6');

    let len = 26;
    try { len = Math.ceil(path.getTotalLength()) + 1; } catch (_) { /* detached/hidden — keep the fallback */ }
    path.style.strokeDasharray  = len;
    path.style.strokeDashoffset = len;

    // Re-arm so a re-pick replays the draw: clear state, flush it with a
    // reflow, then set it back synchronously (not via rAF — dead in a
    // backgrounded tab, which is exactly when a slow answer lands).
    check.dataset.state = 'out';
    void check.offsetWidth;
    check.dataset.state = 'in';
  }

  function showExplanation(q, isRight, entryOverride) {
    const expBox = document.getElementById('exp-box');
    const qType = getQType(q);
    let label;
    if (qType === 'multi-select') {
      label = isRight ? 'Correct!' : `Wrong \u2014 correct answers: ${(q.answers || []).join(', ')}`;
    } else if (qType === 'order') {
      label = isRight ? 'Correct order!' : 'Wrong order \u2014 see correct positions above';
    } else {
      label = isRight ? 'Correct!' : `Wrong \u2014 correct answer: ${q.answer}`;
    }
    // v7.48.0 Reword Gauntlet: name the hinge in the verdict, freeze the rung
    // result on the FIRST answer (re-picks stay study aids, not crack edits),
    // highlight the hinge word in the stem, repaint the ladder.
    if (gauntletMode && _gauntletRun) {
      if (q.hinge) label = (isRight ? 'Correct' : 'Wrong') + ' \u00b7 the hinge: \u201c' + q.hinge + '\u201d';
      if (_gauntletRun.results[current] === undefined) _gauntletRun.results[current] = isRight;
      if (typeof _gauntletApplyHinge === 'function') _gauntletApplyHinge(q);
      if (typeof _renderGauntletLadder === 'function') _renderGauntletLadder();
    }
    // v7.50.0 Why-Not: freeze the answer point on the FIRST answer, same
    // contract as the Gauntlet (re-picks stay study aids).
    if (whyNotMode && _wnRound && _wnRound.answerRight === undefined) {
      _wnRound.answerRight = isRight;
    }
    document.getElementById('exp-label').textContent = label;
    document.getElementById('exp-text').textContent  = q.explanation;
    // v4.54.8: per-choice wrongExplain paragraph. If the question carries a
    // wrongExplain map keyed by option letter AND the user picked one of them,
    // surface the targeted explanation as an italic muted block.
    // v4.82.0: prefer entryOverride (passed by re-pick + restore paths) so we
    // read THIS question's chosen letter, not log[log.length-1] which could be
    // a different question's entry when user is revisiting.
    const wrongExplainEl = document.getElementById('exp-wrong-explain');
    if (wrongExplainEl) {
      const sourceEntry = entryOverride || ((Array.isArray(log) && log.length > 0) ? log[log.length - 1] : null);
      const chosenLetter = sourceEntry ? sourceEntry.chosen : null;
      const pickExplain = (q.wrongExplain && typeof q.wrongExplain === 'object') ? q.wrongExplain[chosenLetter] : null;
      if (!isRight && pickExplain && typeof pickExplain === 'string') {
        wrongExplainEl.textContent = `On your choice (${chosenLetter}): ${pickExplain}`;
        wrongExplainEl.classList.remove('is-hidden');
      } else {
        wrongExplainEl.textContent = '';
        wrongExplainEl.classList.add('is-hidden');
      }
    }
  
    // Resource link — opens in-app Topic Deep Dive
    const qTopic = q.topic || activeQuizTopic;
    const res = topicResources[qTopic];
    let extraHtml = '';
    if (res) {
      extraHtml += '<div class="resource-link"><button class="resource-dive-btn" onclick="showTopicDeepDive(\'' + escHtml(qTopic).replace(/'/g, "\\'") + '\')">Study: ' + escHtml(res.title) + ' (Obj ' + res.obj + ')</button></div>';
    }
  
    // Explain Further button (Enhancement 5)
    extraHtml += '<button class="explain-btn" onclick="explainFurther()">Explain Further</button>';
    // v4.54.17: on wrong answers, offer a "Drill this concept" button that
    // injects 2 follow-up questions into the current session immediately
    // after the current question.
    // v7.48.0: suppressed in gauntlet runs — injecting follow-up questions
    // would corrupt the fixed 5-rung structure.
    if (!isRight && !gauntletMode && !whyNotMode && typeof followUpOnMistake === 'function') {
      extraHtml += '<button class="explain-btn explain-btn-followup" onclick="followUpOnMistake()">Drill this concept</button>';
    }
  
    // Report button
    const reportCount = getReportCount(q.question);
    if (reportCount > 0) {
      extraHtml += '<button class="report-btn reported" disabled>Reported (' + reportCount + ')</button>';
    } else {
      extraHtml += '<button class="report-btn" onclick="reportIssue()">Report Issue</button>';
    }
  
    // Clean up previous extra HTML (resource links, buttons) before inserting new.
    //
    // v8.0.0 fix: this used to walk `expTextEl.nextSibling` and remove every
    // following sibling. #exp-wrong-explain sits after #exp-text in index.html,
    // so the loop deleted it on the first answer — permanently. The per-choice
    // wrongExplain pullquote shipped in v4.54.8 was populated a few lines above
    // and then destroyed before it could ever paint. Scoping the teardown to a
    // dedicated container fixes it and stops the next element added to this box
    // from being silently eaten the same way.
    const expTextEl = document.getElementById('exp-text');
    const extrasEl  = document.getElementById('exp-extras');
    if (extrasEl) {
      extrasEl.innerHTML = extraHtml;
    } else {
      // Defensive: older cached index.html without #exp-extras. Rebuild the
      // container rather than falling back to the sibling-nuking loop.
      const host = document.createElement('div');
      host.className = 'exp-extras';
      host.id = 'exp-extras';
      host.innerHTML = extraHtml;
      expTextEl.parentNode.appendChild(host);
    }
    // #deep-explain is appended to #exp-box itself (app.js explainFurther), not
    // into the extras container, so it still needs clearing by hand.
    const deepEl = document.getElementById('deep-explain');
    if (deepEl) deepEl.remove();
  
    expBox.className   = 'explanation-box show ' + (isRight ? 'correct' : 'wrong');
    expBox.classList.remove('is-hidden');
    // MUST come after the box is visible. .explanation-box is display:none
    // until now, and a CSS animation does not start on a display:none
    // element — flipping data-state any earlier left the badge stuck at
    // opacity 0 with its stroke undrawn. (Caught in live-verify, not UAT:
    // every source-level assertion still passed.)
    _drawVerdictCheck(isRight);
    // Open the reasoning automatically — you just answered, so the "why" is
    // what you want next. Collapsing it again is the user's call.
    _wireExplanationAccordion();
    _setExplanationAccordion(true);
    const nextBtn = document.getElementById('btn-next');
    nextBtn.classList.add('show');
    // Focus the Next button for keyboard users
    setTimeout(() => nextBtn.focus(), 100);
  }
  
  function advance() {
    _navigateTo(current + 1, () => {
      if (gauntletMode && typeof _renderGauntletLadder === 'function') _renderGauntletLadder();
    });
  }
  
  function toggleFlag() {
    quizFlags[current] = !quizFlags[current];
    const flagBtn = document.getElementById('quiz-flag-btn');
    flagBtn.className = 'flag-btn' + (quizFlags[current] ? ' flagged' : '');
    flagBtn.textContent = quizFlags[current] ? 'Flagged' : 'Flag';
  }
  

  // ══════════════════════════════════════════
  // REGULAR QUIZ RESULTS
  // ══════════════════════════════════════════
  // Build the per-difficulty score breakdown shown on the results page.
  // Extracted from finish() (#18) so the parent function fits the long-function budget.
  function renderResultsDifficultyBreakdown() {
    const byDiff = {};
    log.forEach(entry => {
      const d = (entry.q.difficulty || DEFAULT_DIFF).trim();
      if (!byDiff[d]) byDiff[d] = { right: 0, total: 0 };
      byDiff[d].total++;
      if (entry.isRight) byDiff[d].right++;
    });
    const diffOrder = ['Foundational', 'Exam Level', 'Hard / Tricky', 'Hard', 'Mixed'];
    const diffColors = { 'Foundational': 'var(--blue)', 'Exam Level': 'var(--yellow)', 'Hard / Tricky': 'var(--red)', 'Hard': 'var(--red)', 'Mixed': 'var(--accent-light)' };
    const diffEl = document.getElementById('diff-breakdown');
    const diffKeys = diffOrder.filter(d => byDiff[d]);
    // v8.0.0 (motion lift wave 2) — bars replace the `1/1` fraction tiles.
    // Founder call, made against screenshots: the mockup's breakdown bars won
    // over the app's fraction tiles. This is a redesign target, not drift —
    // do not "correct" it back. The raw fraction survives as the row's
    // accessible name, so nothing is actually lost, it just stops being the
    // primary read: a bar answers "how did I do" faster than "3/4" does.
    if (diffKeys.length <= 1) { diffEl.innerHTML = ''; return; }
    diffEl.innerHTML = diffKeys.map((d, i) => {
      const { right, total: t } = byDiff[d];
      const col = diffColors[d] || 'var(--text)';
      const pctD = t > 0 ? Math.round((right / t) * 100) : 0;
      const shortLabel = d.replace(' / Tricky', '').replace('Foundational', 'Basic');
      // dg-system.css stages delays for data-i 1 and 2 only; beyond that rows
      // land together rather than trailing off down a long list.
      return `<div class="dstat-row t-bar-row" data-i="${Math.min(i, 2)}" role="group" aria-label="${shortLabel}: ${right} of ${t} correct">` +
               `<span class="dstat-label">${shortLabel}</span>` +
               `<span class="dstat-track t-bar-track">` +
                 `<span class="dstat-fill t-bar-fill" style="background:${col}" data-pct="${pctD}"></span>` +
               `</span>` +
               `<span class="dstat-val">${pctD}%</span>` +
             `</div>`;
    }).join('');

    // Fill from 0 -> pct. NEVER rAF-gate this: rAF does not fire in a
    // backgrounded tab, so a user who switches away while the results render
    // comes back to permanently empty bars. Forced reflow to flush the 0-width
    // start state, then a synchronous write — correct whether visible or not.
    void diffEl.offsetWidth;
    diffEl.querySelectorAll('.t-bar-fill').forEach(fill => {
      fill.style.width = (fill.dataset.pct || 0) + '%';
    });
  }
  
  function finish() {
    // v7.48.0: a Gauntlet run has its own verdict surface (cracked / near-miss)
    // instead of the standard results page.
    if (gauntletMode && _gauntletRun && typeof _finishGauntlet === 'function') { _finishGauntlet(); return; }
    // v7.50.0: a Why-Not round's question finishing hands off to phase two
    // (the reason picker) instead of the results page.
    if (whyNotMode && _wnSession && typeof _wnFinishQuestion === 'function') { _wnFinishQuestion(); return; }
    // v4.42.0: snapshot streak BEFORE updateStreak so we can detect an
    // increment and flag a pulse animation for the next goSetup() render.
    const _prevStreakBefore = (function(){ try { return getStreak().current || 0; } catch (_) { return 0; } })();
    const total = questions.length;
    const pct   = total > 0 ? Math.round((score / total) * 100) : 0;
    const grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';
    const gradeColor = { A:'#22c55e', B:'#60a5fa', C:'#fbbf24', D:'#fb923c', F:'#f87171' }[grade];
  
    // v4.54.3: legacy grade-ring retired from HTML. Keep the writes guarded so
    // if any consumer DOM gets reintroduced elsewhere (e.g. exam results) it still
    // works, but the absence here is a no-op instead of a TypeError.
    const ringFill = document.getElementById('grade-fill');
    if (ringFill) {
      ringFill.style.stroke = gradeColor;
      ringFill.style.strokeDashoffset = '326.73';
      const targetOffset = 326.73 - (326.73 * pct / 100);
      requestAnimationFrame(() => { ringFill.style.strokeDashoffset = targetOffset; });
    }
    const gradeLetterEl = document.getElementById('grade-letter');
    if (gradeLetterEl) {
      gradeLetterEl.textContent = grade;
      gradeLetterEl.style.color = gradeColor;
    }
    const gradePctEl = document.getElementById('grade-pct');
    if (gradePctEl) gradePctEl.textContent = pct + '%';
  
    // Animated score count-up
    animateCount('r-correct', 0, score, 800);
    animateCount('r-wrong', 0, total - score, 800);
    animateCount('r-streak', 0, bestStreak, 600);
  
    // v4.54.3: editorial display headings with italic-accent em for the key word.
    // Each row: [headline with <em> accent (innerHTML), lede paragraph].
    // Italic em uses the app-wide accent-light colour via CSS.
    const headlines = {
      A: ['Crushing <em>it.</em>',       "You're exam-ready on this topic."],
      B: ['Solid <em>session.</em>',     'A few gaps \u2014 keep at it.'],
      C: ['Getting <em>there.</em>',     'Review your weak spots and retry.'],
      D: ['Keep <em>studying.</em>',     'Go back to the notes then come back.'],
      F: ['More <em>work needed.</em>',  'Rewatch the Messer videos on this topic.']
    };
    const headlineEl = document.getElementById('result-headline');
    if (headlineEl) headlineEl.innerHTML = headlines[grade][0];
    document.getElementById('result-sub').textContent = headlines[grade][1];
    document.getElementById('r-correct').textContent = score;
    document.getElementById('r-wrong').textContent   = total - score;
    document.getElementById('r-streak').textContent  = bestStreak;
  
    // v4.54.3 results-v2 additions: scaled score (100-900), verdict line, raw pct.
    // Scaled-score formula matches CompTIA N10-009 convention from the exam-
    // results screen: 100 + (raw / 100) * 800, rounded.
    const scaled = Math.max(100, Math.min(900, Math.round(100 + (pct / 100) * 800)));
    const passed = scaled >= EXAM_PASS_SCORE;
    const scoreEl = document.getElementById('r-v2-score');
    const verdictEl = document.getElementById('r-v2-verdict');
    const rawPctEl = document.getElementById('r-v2-pct');
    if (scoreEl) {
      // Animated count-up from current (or 0) to scaled
      const cur = parseInt(scoreEl.textContent, 10);
      if (typeof animateCount === 'function') {
        animateCount('r-v2-score', isNaN(cur) ? 0 : cur, scaled, 1100);
      } else {
        scoreEl.textContent = scaled;
      }
    }
    if (verdictEl) {
      if (passed) {
        verdictEl.innerHTML = '\u2191 Pass mark cleared \u00b7 ' + EXAM_PASS_SCORE;
        verdictEl.classList.remove('results-v2-verdict-fail');
        verdictEl.classList.add('results-v2-verdict-pass');
      } else {
        const gap = EXAM_PASS_SCORE - scaled;
        verdictEl.innerHTML = `\u2193 ${gap} below pass \u00b7 keep going`;
        verdictEl.classList.remove('results-v2-verdict-pass');
        verdictEl.classList.add('results-v2-verdict-fail');
      }
    }
    if (rawPctEl) rawPctEl.textContent = pct + '%';
  
    // v4.54.8: elapsed-time row
    const elapsedEl = document.getElementById('r-elapsed');
    if (elapsedEl) {
      const elapsedMs = _sessionStartTs ? (Date.now() - _sessionStartTs) : 0;
      elapsedEl.textContent = _formatElapsed(elapsedMs);
    }
  
    // v4.54.8: inline "Review \u00b7 Every answer" list + "Drill my mistakes" CTA
    if (typeof _renderResultsReviewList === 'function') _renderResultsReviewList();
    const drillBtn = document.getElementById('btn-drill-mistakes');
    if (drillBtn) {
      const wrongCount = total - score;
      drillBtn.style.display = wrongCount > 0 ? '' : 'none';
      drillBtn.innerHTML = `Drill my ${wrongCount} mistake${wrongCount === 1 ? '' : 's'}`;
    }
  
    document.getElementById('btn-review').classList.toggle('is-hidden', log.length === 0);
  
    renderResultsDifficultyBreakdown();
  
    updateStreak();
    renderStreakBadge();
    // v4.42.0: if the streak incremented, flag a pulse for goSetup() to replay
    // on the newly-visible streak badge. Can't animate here because #page-setup
    // is hidden while we're on the results page.
    try {
      if ((getStreak().current || 0) > _prevStreakBefore) _pendingStreakPulse = true;
    } catch (_) {}
  
    if (!wrongDrillMode) {
      const entryMode = dailyChallengeMode ? 'daily' : (sessionMode ? 'session' : 'quiz');
      const now = new Date().toISOString();
      // v4.57.1: Multi-topic sessions (selected via Custom Quiz with 2+ chips)
      // used to save ONE history entry under the "Multi: Topic A, Topic B, …"
      // sentinel string. Progress page's `h.filter(e => e.topic === t)` never
      // matched that sentinel against individual topic keys, so every
      // constituent topic showed as "Untouched" despite the user studying it.
      // Fix: split the session into per-topic entries using each question's
      // Haiku-assigned `q.topic` field. Weak-spot scoring, domain-mastery
      // aggregation, and readiness all become more accurate too.
      if (typeof activeQuizTopic === 'string' && activeQuizTopic.startsWith('Multi: ')) {
        const byTopic = {};
        log.forEach(entry => {
          const t = (entry.q && entry.q.topic) || 'Unknown';
          if (!byTopic[t]) byTopic[t] = { total: 0, score: 0 };
          byTopic[t].total++;
          if (entry.isRight) byTopic[t].score++;
        });
        Object.keys(byTopic).forEach(t => {
          const { total: tTotal, score: tScore } = byTopic[t];
          const tPct = tTotal > 0 ? Math.round((tScore / tTotal) * 100) : 0;
          saveToHistory({ date: now, topic: t, difficulty: diff, score: tScore, total: tTotal, pct: tPct, mode: entryMode, multi: true });
        });
      } else if (activeQuizTopic === MIXED_TOPIC) {
        // v4.85.15: Mixed-mode per-topic split — pre-fix, Mixed quizzes (Deep
        // Scan, Marathon 30/45, Warmup, Diagnostic) saved a single summary
        // entry with topic = MIXED_TOPIC. getReadinessScore filters those out
        // → 326+ questions of practice were invisible to coverage/recency/
        // volume. Now we save BOTH the summary (for chronological history +
        // anything that filters on MIXED_TOPIC explicitly) AND a per-topic
        // split row per Haiku-assigned q.topic so readiness sees the actual
        // topics studied. Same pattern as the v4.81.13 exam-split. Marker
        // `via: 'mixed-split'` distinguishes from Multi: splits.
        saveToHistory({ date: now, topic: activeQuizTopic, difficulty: diff, score, total, pct, mode: entryMode });
        const byTopicMixed = {};
        log.forEach(entry => {
          const t = (entry.q && entry.q.topic) || null;
          if (!t || t === MIXED_TOPIC) return;
          if (!byTopicMixed[t]) byTopicMixed[t] = { total: 0, score: 0 };
          byTopicMixed[t].total++;
          if (entry.isRight) byTopicMixed[t].score++;
        });
        Object.keys(byTopicMixed).forEach(t => {
          const { total: tTotal, score: tScore } = byTopicMixed[t];
          const tPct = tTotal > 0 ? Math.round((tScore / tTotal) * 100) : 0;
          saveToHistory({ date: now, topic: t, difficulty: diff, score: tScore, total: tTotal, pct: tPct, mode: entryMode, via: 'mixed-split' });
        });
      } else {
        saveToHistory({ date: now, topic: activeQuizTopic, difficulty: diff, score, total, pct, mode: entryMode });
      }
    }
    // v4.54.17: if this quiz pushed the user past their daily goal for the
    // first time today, show an end-of-day recap card.
    try { if (typeof _maybeShowDailyRecap === 'function') _maybeShowDailyRecap(); } catch (_) {}
    // v4.42.0: refresh the homepage cards that depend on history state, so
    // re-entering goSetup() renders them fresh. renderReadinessCard rolls the
    // score from its previous value to the new one via animateCount. The
    // renderTodaysFocus call that used to live here has moved — goSetup() is
    // the only caller now, which lets the FLIP rerank animation capture real
    // old positions instead of re-rendering to an already-updated DOM.
    try { renderStatsCard(); } catch (_) {}
    try { renderReadinessCard(); } catch (_) {}
    try { if (typeof renderSrReviewCard === 'function') renderSrReviewCard(); } catch (_) {}
    // v4.42.0: fire milestone celebration toasts for anything we just unlocked.
    // Pre-v4.42 evaluateMilestones was never called from finish() — milestones
    // only unlocked lazily when the user opened Analytics. We now capture the
    // newly-unlocked list and stagger celebration toasts + mini confetti.
    try {
      const _newlyUnlocked = evaluateMilestones();
      if (_newlyUnlocked && _newlyUnlocked.length) {
        _newlyUnlocked.forEach((id, i) => setTimeout(() => showMilestoneCelebration(id), 500 + i * 900));
      }
    } catch (_) {}
  
    // v4.99.0: snapshot readiness for cross-cert analytics (Phase A.5).
    // Writes per-cert score to STORAGE.READINESS_SNAPSHOTS and cloud-flushes
    // so landing's /analytics page can render the live gauge for this cert.
    _writeReadinessSnapshot();
  
    // Daily challenge completion hook — count any finished daily-challenge run
    if (dailyChallengeMode) {
      completeDailyChallenge();
      dailyChallengeMode = false;
    }
  
    if (sessionMode) {
      sessionResults.push({ topic: activeQuizTopic, score, total, pct });
      sessionStep++;
      if (sessionStep >= sessionPlan.length) {
        sessionMode = false;
        renderSessionComplete();
      } else {
        renderSessionTransition();
      }
      return;
    }
  
    showPage('results');
  }
  

  // ══════════════════════════════════════════
  // RETRY
  // ══════════════════════════════════════════
  async function retryQuiz() {
    if (wrongDrillMode) { startWrongDrill(); return; }
  
    const key = apiKey || document.getElementById('api-key').value.trim();
    if (!key) {
      showPage('setup');
      const err = document.getElementById('setup-err');
      err.textContent = '\u26a0\ufe0f Please enter your API key to retry.';
      err.classList.remove('is-hidden');
      return;
    }
    apiKey = key;
  
    activeQuizTopic = topic.includes('Smart') ? getSpacedRepTopic() : topic;
  
    document.getElementById('load-progress').classList.add('is-hidden');
    showPage('loading');
    document.getElementById('loading-msg').textContent = 'Generating ' + qCount + ' fresh ' + diff + ' questions on ' + activeQuizTopic + '\u2026';
  
    showCacheNotice(false);
    try {
      questions = await fetchQuestions(key, activeQuizTopic, diff, qCount);
      document.getElementById('loading-msg').textContent = 'Verifying question accuracy\u2026';
      questions = await aiValidateQuestions(key, questions);
      questions = validateQuestions(questions);
      if (questions.length === 0) throw new Error('All generated questions failed validation. Try again.');
    } catch(e) {
      const cached = getCachedQuestions(activeQuizTopic, diff, qCount);
      if (cached) {
        questions = cached;
        showCacheNotice(true);
      } else {
        showPage('setup');
        const err = document.getElementById('setup-err');
        err.textContent = '\u26a0\ufe0f ' + e.message;
        err.classList.remove('is-hidden');
        return;
      }
    }
    // Inject PBQs on retry too
    const retryPbqCount = qCount >= 10 ? 1 : 0;
    if (retryPbqCount > 0) {
      questions = injectPBQs(questions, activeQuizTopic, retryPbqCount);
    }
    current = 0; score = 0; streak = 0; bestStreak = 0; answered = 0; log = [];
    quizFlags = new Array(questions.length).fill(false);
    showPage('quiz');
    render();
  }
  

  // ══════════════════════════════════════════
  // REVIEW
  // ══════════════════════════════════════════
  // v4.85.17: filter state for the exam-review screen. One of:
  //   'all' | 'correct' | 'incorrect' | 'flagged' | 'skipped'
  // Module-level so chip clicks can re-render against the same log[].
  let _reviewFilter = 'all';
  
  function showReview(fromExam) {
    document.getElementById('review-back-btn').onclick = () => showPage(fromExam ? 'exam-results' : 'results');
    // Reset filter when entering a fresh review (don't leak state from a previous session)
    _reviewFilter = 'all';
    _renderReviewList();
    showPage('review');
  }
  
  // v4.85.17: extracted from showReview() so chip clicks can re-render the
  // list without leaving + re-entering the page. Reads `log[]` (the global
  // session log, populated by finish() / submitExam()) and `_reviewFilter`.
  // Computes counts once + renders the filter chip row + filtered item list
  // (or empty state when count = 0).
  function _renderReviewList() {
    const host = document.getElementById('review-list');
    if (!host || !Array.isArray(log)) return;
  
    // Count each filter category
    const counts = { all: log.length, correct: 0, incorrect: 0, flagged: 0, skipped: 0 };
    log.forEach(entry => {
      if (entry.skipped) counts.skipped++;
      else if (entry.isRight) counts.correct++;
      else counts.incorrect++;
      if (entry.flagged) counts.flagged++;
    });
  
    // If active filter has 0 results (defensive), fall back to 'all'.
    if (_reviewFilter !== 'all' && counts[_reviewFilter] === 0) _reviewFilter = 'all';
  
    // Apply current filter
    const filtered = log.filter(entry => {
      if (_reviewFilter === 'all') return true;
      if (_reviewFilter === 'correct') return entry.isRight && !entry.skipped;
      if (_reviewFilter === 'incorrect') return !entry.isRight && !entry.skipped;
      if (_reviewFilter === 'flagged') return !!entry.flagged;
      if (_reviewFilter === 'skipped') return !!entry.skipped;
      return true;
    });
  
    // Filter chip row
    const chipDef = [
      // \u2713/\u2717 stay \u2014 semantic verdict marks (BRAND \u00A79 allows \u2713 \u2717 \u2192). The Flagged \u2691
      // and Skipped \u21B7 glyphs were off the allowed set + decorative; the labels carry
      // the meaning, so the icons are dropped (v7.50.x).
      { key: 'all',       label: 'All',         icon: '' },
      { key: 'correct',   label: 'Correct',     icon: '\u2713 ' },
      { key: 'incorrect', label: 'Incorrect',   icon: '\u2717 ' },
      { key: 'flagged',   label: 'Flagged',     icon: '' },
      { key: 'skipped',   label: 'Skipped',     icon: '' }
    ];
    const filterRowHtml = `<div class="review-filter-row">
      <span class="review-filter-eyebrow">Filter</span>
      ${chipDef.map(c => {
        const isActive = _reviewFilter === c.key;
        const isDisabled = c.key !== 'all' && counts[c.key] === 0;
        const cls = ['review-filter-chip', 'is-' + c.key, isActive ? 'is-active' : '', isDisabled ? 'is-disabled' : ''].filter(Boolean).join(' ');
        const onclick = isDisabled ? '' : `onclick="_setReviewFilter('${c.key}')"`;
        const aria = isDisabled ? 'aria-disabled="true"' : (isActive ? 'aria-pressed="true"' : 'aria-pressed="false"');
        return `<button type="button" class="${cls}" ${aria} ${onclick}>${c.icon}${c.label} <span class="chip-count">${counts[c.key]}</span></button>`;
      }).join('')}
      <span class="review-filter-meta">Showing <strong>${filtered.length}</strong> of <strong>${log.length}</strong></span>
    </div>`;
  
    // Empty state when filter returns 0
    if (filtered.length === 0) {
      host.innerHTML = filterRowHtml + `
        <div class="review-filter-empty">
          <span class="review-filter-empty-ico"></span>
          <div class="review-filter-empty-title">No answers to show yet</div>
          <div class="review-filter-empty-body">Try a different filter to review your answers.</div>
          <button type="button" class="review-filter-empty-cta" onclick="_setReviewFilter('all')">Show all ${log.length} \u2192</button>
        </div>`;
      return;
    }
  
    // Build all item HTML up front (avoids per-item DOM cost)
    const itemsHtml = filtered.map(entry => _buildReviewItemHtml(entry, log.indexOf(entry), log.length)).join('');
    host.innerHTML = filterRowHtml + itemsHtml;
  }
  
  // v4.85.17: chip click handler. Sets filter state then re-renders.
  function _setReviewFilter(key) {
    _reviewFilter = key;
    _renderReviewList();
    // Scroll the host into view so the user lands at the top of the filtered list
    try {
      const host = document.getElementById('review-list');
      if (host) host.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (_) { /* defensive */ }
  }
  
  // v4.85.17: per-question item builder, extracted so the renderer can rebuild
  // items in different filter states without duplicating markup. `i` is the
  // 0-based original question index; `total` is full log length so the
  // "Q N of M" badge stays accurate even after filtering.
  function _buildReviewItemHtml(entry, i, total) {
    const { q, chosen, isRight, flagged, skipped } = entry;
    const qType = getQType(q);
  
    let cls = 'review-item ';
    if (skipped)      cls += 'skipped';
    else if (isRight) cls += 'correct';
    else              cls += 'missed';
    if (flagged) cls += ' flagged-item';
  
    let optsHtml;
    if (qType === 'order') {
      const items = q.items || [];
      const correctOrd = q.correctOrder || [];
      optsHtml = '<div class="review-options">' +
        correctOrd.map((idx, pos) => `<div class="review-opt is-correct"><span class="r-letter">${pos+1})</span><span>${escHtml(items[idx])}</span></div>`).join('') +
        '</div>';
    } else if (qType === 'topology') {
      const cp = q.correctPlacements || {};
      optsHtml = '<div class="review-options">' +
        Object.entries(cp).map(([dev, zone]) => `<div class="review-opt is-correct"><span class="r-letter">\u2192</span><span>${escHtml(dev)} \u2192 ${escHtml(zone)}</span></div>`).join('') +
        '</div>';
    } else {
      const letters = Object.keys(q.options || {}).sort();
      const correctArr = qType === 'multi-select' ? (q.answers || []) : [q.answer];
      const chosenArr = typeof chosen === 'string' ? chosen.split(',') : [];
      optsHtml = '<div class="review-options">' + letters.map(l => {
        let optCls = '';
        if (correctArr.includes(l)) optCls = 'is-correct';
        else if (chosenArr.includes(l) && !isRight) optCls = 'was-chosen';
        return `<div class="review-opt ${optCls}"><span class="r-letter">${l})</span><span>${escHtml(q.options[l])}</span></div>`;
      }).join('') + '</div>';
    }
  
    // Meta-tag row above question stem - status + flag + domain
    const statusTag = skipped
      ? '<span class="q-tag tag-skipped">\u21B7 Skipped</span>'
      : (isRight
        ? '<span class="q-tag tag-correct">\u2713 Correct</span>'
        : '<span class="q-tag tag-incorrect">\u2717 Incorrect</span>');
    const flagTag = flagged ? '<span class="q-tag tag-flagged">\u2691 Flagged</span>' : '';
    const reviewTopic = q.topic || activeQuizTopic;
    const reviewRes = topicResources[reviewTopic];
    const domainTag = reviewTopic && reviewTopic !== MIXED_TOPIC && reviewTopic !== EXAM_TOPIC
      ? '<span class="q-tag tag-domain">' + escHtml(reviewTopic) + '</span>'
      : '';
  
    const typeLabels = { 'multi-select': 'Multi-Select', 'order': 'Ordering', 'cli-sim': 'CLI Sim', 'topology': 'Topology' };
    const typeBadge = qType !== 'mcq' ? `<span class="pbq-badge" style="margin-left:6px">${typeLabels[qType] || qType}</span>` : '';
  
    const resLink = reviewRes ? `<div class="resource-link" style="margin-top:8px"><button class="resource-dive-btn" onclick="showTopicDeepDive('${escHtml(reviewTopic).replace(/'/g, "\\'")}')">Study: ${escHtml(reviewRes.title)} (Obj ${reviewRes.obj})</button></div>` : '';
  
    return `<div class="${cls}">
      <div class="review-q-meta-row">
        <span class="q-num-pill">Q ${i+1} of ${total}</span>
        ${statusTag}
        ${flagTag}
        ${domainTag}
        ${typeBadge}
      </div>
      <div class="review-q">${i+1}. ${highlightExamKeywords(escHtml(q.question))}</div>
      ${optsHtml}
      <div class="review-exp">${escHtml(q.explanation)}${resLink}</div>
    </div>`;
  }
  

  // ══════════════════════════════════════════
  // KEYBOARD SHORTCUTS
  // ══════════════════════════════════════════
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
  
    const key     = e.key.toUpperCase();
    const onQuiz  = document.getElementById('page-quiz').classList.contains('active');
    const onExam  = document.getElementById('page-exam').classList.contains('active');
  
    if (['A','B','C','D','E'].includes(key)) {
      if (onQuiz) {
        const q = questions[current];
        const qType = getQType(q);
        if (qType === 'mcq' && key !== 'E') pick(key, q);
        else if (qType === 'multi-select' && q.options && q.options[key]) {
          // Toggle multi-select option via keyboard
          const optBtn = document.querySelector(`#options .option[data-letter="${key}"]`);
          if (optBtn) optBtn.click();
        }
      } else if (onExam) {
        const q = examQuestions[examCurrent];
        const qType = getQType(q);
        if (qType === 'mcq' && key !== 'E') {
          examAnswers[examCurrent].chosen = key;
          renderExam();
        } else if (qType === 'multi-select' && q.options && q.options[key]) {
          const ms = examAnswers[examCurrent].msChosen || [];
          const idx = ms.indexOf(key);
          if (idx >= 0) ms.splice(idx, 1); else ms.push(key);
          examAnswers[examCurrent].msChosen = ms;
          renderExam();
        }
      }
      return;
    }
  
    if (e.key === 'Enter') {
      if (onQuiz) {
        const btn = document.getElementById('btn-next');
        if (btn.classList.contains('show')) btn.click();
      } else if (onExam) {
        document.getElementById('exam-next-btn').click();
      }
      return;
    }
  
    if (key === 'F') {
      if (onQuiz)  toggleFlag();
      if (onExam)  examToggleFlag();
      return;
    }
  
    if (e.key === 'ArrowRight' && onExam) { examNext(); return; }
    if (e.key === 'ArrowLeft'  && onExam) { examPrev(); return; }
    // v4.82.0: quiz prev/next via arrow keys for revisit nav.
    if (e.key === 'ArrowRight' && onQuiz) { nextQuestion(); return; }
    if (e.key === 'ArrowLeft'  && onQuiz) { prevQuestion(); return; }
  });
  

  // ── Window exposure ──────────────────────────────────────────────────────
  window.startQuiz = startQuiz;
  window.render = render;
  window.getQType = getQType;
  window._renderScenarioBlock = _renderScenarioBlock;
  window.renderMCQ = renderMCQ;
  window.renderMultiSelect = renderMultiSelect;
  window.renderOrder = renderOrder;
  window.pick = pick;
  window.showExplanation = showExplanation;
  window.advance = advance;
  window.retryQuiz = retryQuiz;
  window.showReview = showReview;
  window._setReviewFilter = _setReviewFilter;
  window.jumpToQuestion = jumpToQuestion;
  window.nextQuestion = nextQuestion;
  window.prevQuestion = prevQuestion;
  window._loadingProgressBegin = _loadingProgressBegin;
  window._loadingProgressUpdate = _loadingProgressUpdate;
  window._loadingProgressFinish = _loadingProgressFinish;
  // v7.79.2: these four were missed in the original wave-8 extraction —
  // still called as bare identifiers from app.js's hot-area/topology
  // revisit + submit paths (submitHotArea, _restoreAnsweredHotAreaState,
  // submitTopology), which were never extracted themselves. Without window
  // exposure those calls threw ReferenceError, silently breaking hot-area
  // PBQ scoring end-to-end (caught by window.onerror, no visible symptom
  // beyond the UI staying stuck at "is-picked").
  window._findLogEntryFor = _findLogEntryFor;
  window._renderQuizProgressDots = _renderQuizProgressDots;
  window._renderQuizNavArrows = _renderQuizNavArrows;
  window._recomputeQuizCounters = _recomputeQuizCounters;
  // v7.97.0: index.html's #quiz-flag-btn onclick="toggleFlag()" — missed in
  // the original wave-8 extraction, same closure-captive-call class as the
  // v7.96.0 renderExam fix. Quiz Flag button has been dead since wave 8.
  window.toggleFlag = toggleFlag;
  // v8.0.0 wave 2: app.js's hot-area + topology submit paths call this, and
  // they were never extracted — same closure-captive-call class as the
  // v7.79.2 and v7.97.0 fixes. Without the exposure both throw ReferenceError
  // and the streak pill silently stops updating on those two PBQ types.
  window._setLiveStreak = _setLiveStreak;
  window._setLiveScore  = _setLiveScore;
  // #495: app.js's explainFurther() calls these across the extraction boundary
  window._prepareDeepDive = _prepareDeepDive;
  window._openDeepDive   = _openDeepDive;
  window._deepDiveBtnState = _deepDiveBtnState;

  window._certanvilFeatures = window._certanvilFeatures || {};
  window._certanvilFeatures['quiz-engine'] = { render: render, startQuiz: startQuiz };
})();
