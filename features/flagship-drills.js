/* Flagship drills (Reword Gauntlet + Why-Not) — extracted from app.js (#138 wave 4).
 * Lazy-loaded feature. Mechanical move: function bodies identical to app.js @ 29e7d3e.
 * Note: gauntletMode/_gauntletRun/whyNotMode/_wnSession state stays in app.js
 * (quiz engine reads it); module mutates via shared global lexical scope. */
(function () {
  'use strict';

  // ── moved functions, 2-space indent ──
  // ── Block A: weak topic + gauntlet data ──
  function getWeakTopic() {
    const h = loadHistory().filter(e => e.topic !== MIXED_TOPIC && e.topic !== EXAM_TOPIC && e.total >= 5);
    if (h.length < 1) return null;
    const map = {};
    h.forEach(e => {
      if (!map[e.topic]) map[e.topic] = { correct: 0, total: 0 };
      map[e.topic].correct += e.score;
      map[e.topic].total   += e.total;
    });
    let weakest = null, lowestPct = 100;
    Object.entries(map).forEach(([t, s]) => {
      const pct = (s.correct / s.total) * 100;
      if (pct < lowestPct) { lowestPct = pct; weakest = t; }
    });
    return weakest && lowestPct < 75 ? { topic: weakest, pct: Math.round(lowestPct) } : null;
  }

  const GAUNTLET_RUNGS = [
    { key: 'Plain',    sub: 'Straight definition' },
    { key: 'Scenario', sub: 'Real-world setup' },
    { key: 'Best-of',  sub: 'One word decides it' },
    { key: 'Not-trap', sub: 'The negation flip' },
    { key: 'Twisted',  sub: 'Trickiest phrasing' }
  ];

  function _bumpGauntletFreeRun() {
    // Only the free tier accrues a count; Pro / admin / anonymous never do.
    if (!(_quotaState && _quotaState.tier === 'free')) return;
    try {
      localStorage.setItem(STORAGE.GAUNTLET_FREE_COUNT, JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        count: _gauntletFreeRunsToday() + 1
      }));
    } catch (_) {}
  }

  function _gateGauntletDaily() {
    // State still hydrating, or anonymous BYOK (self-pay) → allow. Matches the
    // optimistic-allow contract in _gateProOnly; anonymous users are uncapped.
    if (!_quotaState) return true;
    // Pro / admin / unlimited → always allow.
    if (_quotaState.tier === 'pro') return true;
    if (typeof _quotaState.daily_limit === 'number' && _quotaState.daily_limit < 0) return true;
    // Free tier → one run a day.
    if (_gauntletFreeRunsToday() >= GAUNTLET_FREE_DAILY_CAP) {
      if (typeof _showProOnlyUI === 'function') {
        _showProOnlyUI({
          feature: 'Reword Gauntlet',
          title: "That's today's free Gauntlet done",
          body: 'Free includes one Reword Gauntlet run a day, a bonus on top of your 15 questions. Your next free run unlocks at midnight UTC. Go Pro to run it as often as you like, on every cert.'
        });
      }
      return false;
    }
    return true;
  }

  // ── Block B: Reword Gauntlet ──
  function startRewordGauntlet() {
    _gauntletTopic = null;
    // v7.48.1: remember the entry origin — Back must never route a desktop
    // user to the mobile-only drills page.
    const active = document.querySelector('.page.active');
    _gauntletReturn = (active && active.id === 'page-drills') ? 'drills' : 'setup';
    renderGauntletEntry();
    showPage('gauntlet');
  }

  function gauntletBack() {
    if (_gauntletReturn === 'drills') showPage('drills');
    else goSetup();
  }

  function renderGauntletEntry() {
    // v7.48.1: back label names the actual destination
    const backLabel = document.getElementById('gnt-back-label');
    if (backLabel) backLabel.textContent = _gauntletReturn === 'drills' ? 'Drills' : 'Home';
    const w = getWeakTopic();
    let topicName = _gauntletTopic || (w && w.topic) || null;
    if (!topicName && typeof getTodaysFocusTopics === 'function') {
      const f = getTodaysFocusTopics(1);
      const first = Array.isArray(f) ? f[0] : null;
      topicName = typeof first === 'string' ? first : (first && first.topic) || null;
    }
    if (!topicName) topicName = Object.keys((typeof TOPIC_DOMAINS !== 'undefined' && TOPIC_DOMAINS) || {})[0] || MIXED_TOPIC;
    const nameEl = document.getElementById('gnt-topic-name');
    if (nameEl) nameEl.textContent = topicName;
    const whyEl = document.getElementById('gnt-topic-why');
    if (whyEl) whyEl.textContent = _gauntletTopic ? 'Your pick' : ((w && w.topic === topicName) ? 'Your weakest topic right now' : 'A good place to start');
    const n = loadGauntletCracked().length;
    const row = document.getElementById('gnt-cracked-row');
    if (row) row.classList.toggle('is-hidden', n === 0);
    const nEl = document.getElementById('gnt-cracked-n');
    if (nEl) nEl.textContent = n;
    const listEl = document.getElementById('gnt-topic-list');
    if (listEl) listEl.classList.add('is-hidden');
  }

  function gauntletToggleTopicList() {
    const el = document.getElementById('gnt-topic-list');
    if (!el) return;
    if (!el.classList.contains('is-hidden')) { el.classList.add('is-hidden'); return; }
    const topics = Object.keys((typeof TOPIC_DOMAINS !== 'undefined' && TOPIC_DOMAINS) || {});
    el.innerHTML = topics.map(t =>
      // data-action delegation (Sec-P7): no inline onclick in generated HTML
      '<button type="button" class="gnt-topic-opt" data-action="gauntletChooseTopic" data-args="' + escAttr(JSON.stringify([t])) + '">' + escHtml(t) + '</button>'
    ).join('');
    el.classList.remove('is-hidden');
  }

  function gauntletChooseTopic(t) {
    _gauntletTopic = t;
    renderGauntletEntry();
  }

  async function _fetchGauntletRun(topicName, forcedConcept, errorSurface) {
    const exemplars = (typeof _pickExemplarsForTopic === 'function') ? _pickExemplarsForTopic(topicName, 3) : [];
    const exemplarBlock = (exemplars && exemplars.length && typeof _formatExemplarsForPrompt === 'function')
      ? _formatExemplarsForPrompt(exemplars) : '';
    const rungSpecs =
      '1. Plain — a direct, plainly worded question on the concept. hinge = the concept term itself.\n' +
      '2. Scenario — a short real-world scenario (2-3 sentences) where the concept is the answer. hinge = the scenario detail that points to the concept.\n' +
      '3. Best-of — several options are partially workable; a BEST/MOST-style qualifier decides it. hinge = the qualifier word.\n' +
      '4. Not-trap — a negation question (NOT / EXCEPT / LEAST). hinge = the negation word.\n' +
      '5. Twisted — the trickiest wording: inverted framing, double qualifier, or distractor-heavy phrasing. hinge = the word or phrase the whole question pivots on.';
    const prompt = (forcedConcept
        ? 'Write a fresh 5-question "Reword Gauntlet" run about this exact concept: "' + forcedConcept + '" (exam topic: ' + topicName + '). Brand-new wordings — reuse nothing from any previous phrasing.\n\n'
        : 'Pick ONE precise, testable concept inside the certification exam topic "' + topicName + '" — a single fact or decision a candidate must know cold, not the whole topic. Then write a 5-question "Reword Gauntlet" run about THAT concept only.\n\n') +
      'All five questions test the SAME concept and the SAME underlying fact, each in a different disguise:\n' + rungSpecs + '\n\n' +
      'Rules: 4 plausible options per question (plain text, no letter prefixes), exactly one correct, vary which position is correct across the five. ' +
      'The hinge must be copied VERBATIM from that question\'s own text. Add a 1-2 sentence explanation per question that says why the hinge decides it.\n' +
      (exemplarBlock ? '\n' + exemplarBlock + '\n' : '') +
      '\nReturn ONLY JSON:\n{"concept":"...","rungs":[{"question":"...","options":["...","...","...","..."],"answer":"A","explanation":"...","hinge":"..."}]}\n' +
      '"answer" is the letter (A-D) of the correct option by position. Exactly 5 rungs, in the order above.';

    const res = await _claudeFetch({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      // v7.54.0: the free-tier daily Gauntlet is a BONUS, separate from the
      // 15-question quota, so it is sent NON-metered for free users. Pro
      // (unlimited) and anonymous (BYOK) keep _metered: true exactly as before.
      body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: MAX_TOKENS_GENERATION, messages: [{ role: 'user', content: prompt }], _metered: !(_quotaState && _quotaState.tier === 'free') }),
      _errorSurface: errorSurface || undefined
    });
    if (!res.ok) throw new Error('gauntlet API error ' + res.status);
    const data = await res.json();
    const raw = (data.content && data.content[0] && data.content[0].text) || '';
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('gauntlet: no JSON object in response');
    const parsed = JSON.parse(m[0]);
    // Per-rung shape validation — any bad rung fails the WHOLE run (a 4-rung
    // gauntlet would be a lie). Caller shows a friendly retry; nothing recorded.
    const rungs = (parsed && Array.isArray(parsed.rungs)) ? parsed.rungs : [];
    const ok = parsed && typeof parsed.concept === 'string' && parsed.concept.length >= 3 &&
      rungs.length === 5 && rungs.every(r =>
        r && typeof r.question === 'string' && r.question.length > 20 &&
        Array.isArray(r.options) && r.options.length === 4 &&
        r.options.every(o => typeof o === 'string' && o.length > 0) &&
        typeof r.answer === 'string' && /^[A-D]$/.test(r.answer.trim().toUpperCase()) &&
        typeof r.explanation === 'string' && r.explanation.length > 0 &&
        typeof r.hinge === 'string' && r.hinge.length > 0);
    if (!ok) throw new Error('gauntlet: malformed run shape');
    return { concept: parsed.concept, rungs };
  }

  async function gauntletStart(opts) {
    opts = opts || {};
    if (_gauntletBusy) return; // double-tap guard
    // v7.54.0: free users get one Gauntlet run a day (was Pro-only). _gateGauntletDaily
    // allows Pro / anonymous freely and caps the free tier at 1/day with its own modal.
    if (typeof _gateGauntletDaily === 'function' && !_gateGauntletDaily()) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      showToast('The Gauntlet forges fresh questions, so it needs a connection.', 'info');
      return;
    }
    // v7.54.0: the free daily Gauntlet is non-metered (a bonus separate from the
    // 15-question quota), so the metered-quota gate must not block free users.
    // Pro (unlimited) and anonymous (BYOK) still pass through it unchanged.
    if (!(_quotaState && _quotaState.tier === 'free') && typeof _canMakeMeteredCall === 'function' && !_canMakeMeteredCall('Reword Gauntlet')) return;

    let topicName = opts.topic || _gauntletTopic || null;
    if (!topicName) { const w = getWeakTopic(); topicName = (w && w.topic) || null; }
    if (!topicName && typeof getTodaysFocusTopics === 'function') {
      const f = getTodaysFocusTopics(1);
      const first = Array.isArray(f) ? f[0] : null;
      topicName = typeof first === 'string' ? first : (first && first.topic) || null;
    }
    if (!topicName) topicName = Object.keys((typeof TOPIC_DOMAINS !== 'undefined' && TOPIC_DOMAINS) || {})[0] || MIXED_TOPIC;

    apiKey = (document.getElementById('api-key') || { value: '' }).value.trim();
    _gauntletBusy = true;
    const lp = document.getElementById('load-progress');
    if (lp) lp.classList.add('is-hidden');
    showPage('loading');
    const lm = document.getElementById('loading-msg');
    if (lm) lm.textContent = 'Forging five disguises…';
    if (typeof _loadingProgressBegin === 'function') _loadingProgressBegin('Forging five disguises…');

    const _gauntletErrSurface = {
      container: (typeof document !== 'undefined' ? document.getElementById('page-loading') : null),
      onRetry: () => { _gauntletBusy = false; gauntletStart(opts); }
    };
    let run;
    try {
      run = await _fetchGauntletRun(topicName, opts.concept || null, _gauntletErrSurface);
    } catch (e) {
      if (e && e.surfaced) { _gauntletBusy = false; return; }
      // Friendly error + retry — no crack, no attempt, nothing recorded.
      _gauntletBusy = false;
      if (typeof _loadingProgressFinish === 'function') { try { _loadingProgressFinish(); } catch (_) {} }
      renderGauntletEntry();
      showPage('gauntlet');
      try { showToast('The forge misfired. Nothing was used up. Hit Start to try again.', 'error'); } catch (_) {}
      return;
    }
    if (typeof _loadingProgressFinish === 'function') { try { _loadingProgressFinish(); } catch (_) {} }
    _gauntletBusy = false;

    _gauntletRun = { concept: run.concept, topic: topicName, results: [], attempts: (opts.attempts || 0) + 1 };
    // v7.54.0: consume the free-tier daily Gauntlet allowance. After a successful
    // fetch only, so a forge misfire (caught above) never burns the free run.
    if (typeof _bumpGauntletFreeRun === 'function') _bumpGauntletFreeRun();
    gauntletMode = true;
    wrongDrillMode = false;
    examMode = false;
    sessionMode = false;
    activeQuizTopic = topicName;
    questions = run.rungs.map((r, i) => ({
      question: r.question,
      // v7.48.1: letterize — renderMCQ reads q.options[letter], the AI returns
      // a positional array. Raw arrays render four 'undefined' options.
      options: _letterizeOptions(r.options),
      answer: r.answer.trim().toUpperCase(),
      explanation: r.explanation,
      hinge: r.hinge,
      topic: topicName,
      difficulty: 'Exam Level',
      type: 'mcq',
      _rung: i
    }));
    current = 0; score = 0; streak = 0; bestStreak = 0; answered = 0; log = [];
    quizFlags = new Array(questions.length).fill(false);
    _sessionStartTs = Date.now();
    showCacheNotice(false);
    showPage('quiz');
    render();
    _renderGauntletLadder();
  }

  function _renderGauntletLadder() {
    const el = document.getElementById('gauntlet-ladder');
    const dots = document.getElementById('quiz-prog-dots');
    const chip = document.getElementById('gauntlet-rung-chip');
    const topicEl = document.getElementById('gauntlet-run-topic');
    if (!el) return;
    if (!gauntletMode || !_gauntletRun) {
      el.classList.add('is-hidden');
      if (dots) dots.classList.remove('is-hidden');
      if (chip) chip.classList.add('is-hidden');
      if (topicEl) topicEl.classList.add('is-hidden');
      return;
    }
    if (dots) dots.classList.add('is-hidden');
    el.classList.remove('is-hidden');
    // v7.49.0: name the battlefield — topic visible throughout the run (Simi).
    // The precise concept stays hidden until the verdict: it IS the answer key.
    if (topicEl) {
      topicEl.innerHTML = '<span>The Gauntlet</span> · ' + escHtml(_gauntletRun.topic);
      topicEl.classList.remove('is-hidden');
    }
    // Build the five rung nodes ONCE, then reconcile classes in place — an
    // innerHTML rebuild would restart the bar-fill transition on every
    // already-done rung at each advance (emil pass 2, 2026-06-12).
    if (el.children.length !== GAUNTLET_RUNGS.length) {
      el.innerHTML = GAUNTLET_RUNGS.map(r =>
        '<div class="gnt-rung"><div class="gnt-rung-bar"><i></i></div><div class="gnt-rung-name">' + r.key + '</div></div>'
      ).join('');
    }
    GAUNTLET_RUNGS.forEach((r, i) => {
      const node = el.children[i];
      if (!node) return;
      const res = _gauntletRun.results[i];
      node.classList.toggle('done', res === true);
      node.classList.toggle('missed', res === false);
      node.classList.toggle('live', i === current && current < GAUNTLET_RUNGS.length);
    });
    if (chip) {
      chip.textContent = GAUNTLET_RUNGS[current] ? GAUNTLET_RUNGS[current].key : '';
      chip.classList.toggle('is-hidden', !GAUNTLET_RUNGS[current]);
    }
  }

  function _gauntletApplyHinge(q) {
    if (!q || !q.hinge) return;
    const el = document.getElementById('q-text');
    if (!el) return;
    const esc = escHtml(q.question);
    const escHinge = escHtml(q.hinge);
    if (escHinge && esc.indexOf(escHinge) !== -1) {
      el.innerHTML = esc.replace(escHinge, '<mark class="gnt-hinge">' + escHinge + '</mark>');
    }
  }

  function _finishGauntlet() {
    const results = GAUNTLET_RUNGS.map((_, i) => _gauntletRun.results[i] === true);
    const crackCount = results.filter(Boolean).length;
    const cracked = crackCount === 5;
    const total = questions.length;
    const pct = total > 0 ? Math.round((crackCount / total) * 100) : 0;
    try { saveToHistory({ date: new Date().toISOString(), topic: _gauntletRun.topic, difficulty: 'Exam Level', score: crackCount, total, pct, mode: 'gauntlet' }); } catch (_) {}
    try { updateStreak(); renderStreakBadge(); } catch (_) {}
    if (cracked) {
      try {
        const list = loadGauntletCracked();
        list.unshift({
          concept: _gauntletRun.concept,
          topic: _gauntletRun.topic,
          certId: (typeof CURRENT_CERT !== 'undefined' && CURRENT_CERT) || 'netplus',
          date: new Date().toISOString(),
          attempts: _gauntletRun.attempts
        });
        localStorage.setItem(STORAGE.GAUNTLET_CRACKED, JSON.stringify(list));
        _cloudFlush(STORAGE.GAUNTLET_CRACKED);
      } catch (_) { try { showToast('Storage full · crack not saved', 'error'); } catch (_) {} }
    }
    try { if (typeof _writeReadinessSnapshot === 'function') _writeReadinessSnapshot(); } catch (_) {}
    try { renderStatsCard(); renderReadinessCard(); } catch (_) {}
    try { if (typeof _maybeShowDailyRecap === 'function') _maybeShowDailyRecap(); } catch (_) {}
    gauntletMode = false;
    try {
      if (typeof bumpDrillStat === 'function') {
        bumpDrillStat('gauntlet', 'done', 1);
        if (cracked) bumpDrillStat('gauntlet', 'perfect', 1);
      }
      if (typeof evaluateMilestones === 'function') {
        const _nu = evaluateMilestones();
        _nu.forEach((id, i) => setTimeout(() => showMilestoneCelebration(id), 500 + i * 900));
      }
    } catch (_) {}
    _renderGauntletLadder();
    renderGauntletResult(cracked, results);
    showPage('gauntlet-result');
  }

  function renderGauntletResult(cracked, results) {
    const root = document.getElementById('gnt-result-root');
    if (!root) return;
    if (cracked) {
      const n = loadGauntletCracked().length;
      const subLine = _gauntletRun.attempts > 1
        ? 'Took ' + _gauntletRun.attempts + ' runs. <b>Earned.</b>'
        : 'Five wordings, five answers. <b>That’s ' + n + ' in your collection.</b>';
      root.innerHTML =
        '<div class="gnt-seal-wrap">' +
          '<div class="gnt-seal"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div>' +
          '<div class="gnt-seal-k">Concept cracked</div>' +
          '<div class="gnt-seal-concept">' + escHtml(_gauntletRun.concept) + '</div>' +
          '<div class="gnt-seal-ladder"><i></i><i></i><i></i><i></i><i></i></div>' +
          '<p class="gnt-seal-sub">' + subLine + '</p>' +
          '<span class="gnt-streak-line"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> Streak +1 · 5 questions toward today’s goal</span>' +
        '</div>' +
        '<div class="gnt-result-footer">' +
          '<button type="button" class="btn btn-primary gnt-cta" data-action="gauntletNextTarget">Next target →</button>' +
          '<button type="button" class="btn gnt-ghost" data-action="gauntletExit">' + (_gauntletReturn === 'drills' ? 'Back to Drills' : 'Back to Home') + '</button>' +
        '</div>';
    } else {
      const crackCount = results.filter(Boolean).length;
      const missed = GAUNTLET_RUNGS.filter((r, i) => !results[i]).map(r => '<b>' + r.key + '</b>');
      const missPhrase = missed.length === 1
        ? 'The ' + missed[0] + ' got you. One rung from the seal.'
        : missed.length === 2
          ? 'The ' + missed[0] + ' and the ' + missed[1] + ' got you.'
          : missed.length + ' rungs got you this time.';
      const rows = GAUNTLET_RUNGS.map((r, i) => {
        const ok = results[i];
        return '<div class="gnt-rr ' + (ok ? 'ok' : 'bad') + '"><span class="gnt-rr-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' +
          (ok ? '<path d="M20 6 9 17l-5-5"/>' : '<path d="M18 6 6 18M6 6l12 12"/>') +
          '</svg></span><span class="gnt-rr-t"><b>' + r.key + '</b><span>' + r.sub + '</span></span></div>';
      }).join('');
      root.innerHTML =
        '<div class="gnt-miss-head">' +
          '<div class="gnt-miss-score">Cracked <b>' + crackCount + ' of 5</b></div>' +
          '<p class="gnt-miss-callout">' + missPhrase + '</p>' +
        '</div>' +
        '<div class="gnt-rung-report">' + rows + '</div>' +
        '<p class="gnt-miss-promise">Run it again and every question is re-worded from scratch. There’s nothing to memorize. That’s the point.</p>' +
        '<div class="gnt-result-footer">' +
          '<button type="button" class="btn btn-primary gnt-cta" data-action="gauntletRunAgain">Run it again</button>' +
          '<button type="button" class="btn gnt-ghost" data-action="gauntletDifferentConcept">Different concept</button>' +
        '</div>';
    }
  }

  function gauntletRunAgain() {
    if (!_gauntletRun) { startRewordGauntlet(); return; }
    gauntletStart({ topic: _gauntletRun.topic, concept: _gauntletRun.concept, attempts: _gauntletRun.attempts });
  }

  function gauntletDifferentConcept() {
    if (!_gauntletRun) { startRewordGauntlet(); return; }
    gauntletStart({ topic: _gauntletRun.topic });
  }

  function gauntletNextTarget() {
    _gauntletTopic = null;
    _gauntletRun = null;
    gauntletStart({});
  }

  function gauntletExit() {
    _gauntletRun = null;
    if (typeof renderGauntletDrillsCard === 'function') { try { renderGauntletDrillsCard(); } catch (_) {} }
    if (typeof window.renderSimLabDrillsCard === 'function') { try { window.renderSimLabDrillsCard(); } catch (_) {} }
    gauntletBack(); // v7.48.1: origin-aware — never the unstyled drills page on desktop
  }

  // ── Block C: Why-Not ──
  function startWhyNot() {
    _wnTopic = null;
    const active = document.querySelector('.page.active');
    _wnReturn = (active && active.id === 'page-drills') ? 'drills' : 'setup';
    renderWhyNotEntry();
    showPage('whynot');
  }

  function whyNotBack() {
    if (_wnReturn === 'drills') showPage('drills');
    else goSetup();
  }

  function renderWhyNotEntry() {
    const backLabel = document.getElementById('wn-back-label');
    if (backLabel) backLabel.textContent = _wnReturn === 'drills' ? 'Drills' : 'Home';
    const w = getWeakTopic();
    let topicName = _wnTopic || (w && w.topic) || null;
    if (!topicName && typeof getTodaysFocusTopics === 'function') {
      const f = getTodaysFocusTopics(1);
      const first = Array.isArray(f) ? f[0] : null;
      topicName = typeof first === 'string' ? first : (first && first.topic) || null;
    }
    if (!topicName) topicName = Object.keys((typeof TOPIC_DOMAINS !== 'undefined' && TOPIC_DOMAINS) || {})[0] || MIXED_TOPIC;
    const nameEl = document.getElementById('wn-topic-name');
    if (nameEl) nameEl.textContent = topicName;
    const whyEl = document.getElementById('wn-topic-why');
    if (whyEl) whyEl.textContent = _wnTopic ? 'Your pick' : ((w && w.topic === topicName) ? 'Your weakest topic right now' : 'A good place to start');
    const listEl = document.getElementById('wn-topic-list');
    if (listEl) listEl.classList.add('is-hidden');
  }

  function whyNotToggleTopicList() {
    const el = document.getElementById('wn-topic-list');
    if (!el) return;
    if (!el.classList.contains('is-hidden')) { el.classList.add('is-hidden'); return; }
    const topics = Object.keys((typeof TOPIC_DOMAINS !== 'undefined' && TOPIC_DOMAINS) || {});
    el.innerHTML = topics.map(t =>
      '<button type="button" class="gnt-topic-opt" data-action="whyNotChooseTopic" data-args="' + escAttr(JSON.stringify([t])) + '">' + escHtml(t) + '</button>'
    ).join('');
    el.classList.remove('is-hidden');
  }

  function whyNotChooseTopic(t) {
    _wnTopic = t;
    renderWhyNotEntry();
  }

  async function _fetchWhyNotSession(topicName, errorSurface) {
    const exemplars = (typeof _pickExemplarsForTopic === 'function') ? _pickExemplarsForTopic(topicName, 3) : [];
    const exemplarBlock = (exemplars && exemplars.length && typeof _formatExemplarsForPrompt === 'function')
      ? _formatExemplarsForPrompt(exemplars) : '';
    const prompt =
      'Write a 3-question "Why-Not" drill session for the certification exam topic "' + topicName + '". ' +
      'Each question is a 4-option multiple-choice exam question (plain text options, no letter prefixes, exactly one correct, vary the correct position across the three).\n\n' +
      'For EACH of the three WRONG options of each question, provide an interrogation kit:\n' +
      '- "reason": the one TRUE reason that option loses, stated in one plain sentence\n' +
      '- "fakes": exactly 2 tempting but FACTUALLY FALSE reasons. A fake must be false about the option itself, not merely a weaker argument. Make them genuinely tempting.\n' +
      '- "note": 1-2 sentences shown after the pick, naming why the true reason decides it and why the fakes are false.\n\n' +
      'Wrong options should lose for DIFFERENT kinds of reasons across a question (different job, missing a must-have the question demands, wrong scope, true-but-not-best, wrong layer).\n' +
      (exemplarBlock ? '\n' + exemplarBlock + '\n' : '') +
      '\nReturn ONLY JSON:\n' +
      '{"rounds":[{"question":"...","options":["...","...","...","..."],"answer":"A","explanation":"...","whynot":{"B":{"reason":"...","fakes":["...","..."],"note":"..."},"C":{...},"D":{...}}}]}\n' +
      '"answer" is the letter (A-D) of the correct option by position. The "whynot" object has EXACTLY the three wrong letters as keys. Exactly 3 rounds.';

    const res = await _claudeFetch({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      // _metered: true — counts toward quota + the global kill-switch.
      body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: MAX_TOKENS_GENERATION, messages: [{ role: 'user', content: prompt }], _metered: true }),
      _errorSurface: errorSurface || undefined
    });
    if (!res.ok) throw new Error('whynot API error ' + res.status);
    const data = await res.json();
    const raw = (data.content && data.content[0] && data.content[0].text) || '';
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('whynot: no JSON object in response');
    const parsed = JSON.parse(m[0]);
    const rounds = (parsed && Array.isArray(parsed.rounds)) ? parsed.rounds : [];
    const isStr = s => typeof s === 'string' && s.length > 0;
    const ok = rounds.length === WHY_NOT_ROUNDS && rounds.every(r => {
      if (!r || typeof r.question !== 'string' || r.question.length <= 20) return false;
      if (!Array.isArray(r.options) || r.options.length !== 4 || !r.options.every(o => isStr(o))) return false;
      if (typeof r.answer !== 'string' || !/^[A-D]$/.test(r.answer.trim().toUpperCase())) return false;
      if (!isStr(r.explanation)) return false;
      const ans = r.answer.trim().toUpperCase();
      const wrong = ['A', 'B', 'C', 'D'].filter(l => l !== ans);
      if (!r.whynot || typeof r.whynot !== 'object') return false;
      return wrong.every(l => {
        const k = r.whynot[l];
        return k && isStr(k.reason) && Array.isArray(k.fakes) && k.fakes.length === 2 &&
          k.fakes.every(f => isStr(f)) && isStr(k.note);
      });
    });
    if (!ok) throw new Error('whynot: malformed session shape');
    return rounds;
  }

  async function whyNotStart(opts) {
    opts = opts || {};
    if (_wnBusy) return; // double-tap guard
    if (typeof _gateProOnly === 'function' && !_gateProOnly('Why-Not', {
      title: 'Why-Not is a Pro feature',
      body: 'The right answer is one point. Knowing why the wrong ones are wrong is the other three. Go Pro to run Why-Not on every cert in the library.'
    })) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      showToast('Why-Not builds fresh case files, so it needs a connection.', 'info');
      return;
    }
    if (typeof _canMakeMeteredCall === 'function' && !_canMakeMeteredCall('Why-Not')) return;

    let topicName = opts.topic || _wnTopic || null;
    if (!topicName) { const w = getWeakTopic(); topicName = (w && w.topic) || null; }
    if (!topicName && typeof getTodaysFocusTopics === 'function') {
      const f = getTodaysFocusTopics(1);
      const first = Array.isArray(f) ? f[0] : null;
      topicName = typeof first === 'string' ? first : (first && first.topic) || null;
    }
    if (!topicName) topicName = Object.keys((typeof TOPIC_DOMAINS !== 'undefined' && TOPIC_DOMAINS) || {})[0] || MIXED_TOPIC;

    apiKey = (document.getElementById('api-key') || { value: '' }).value.trim();
    _wnBusy = true;
    const lp = document.getElementById('load-progress');
    if (lp) lp.classList.add('is-hidden');
    showPage('loading');
    const lm = document.getElementById('loading-msg');
    if (lm) lm.textContent = 'Building the case files…';
    if (typeof _loadingProgressBegin === 'function') _loadingProgressBegin('Building the case files…');

    const _wnErrSurface = {
      container: (typeof document !== 'undefined' ? document.getElementById('page-loading') : null),
      onRetry: () => { _wnBusy = false; whyNotStart(opts); }
    };
    let rounds;
    try {
      rounds = await _fetchWhyNotSession(topicName, _wnErrSurface);
    } catch (e) {
      if (e && e.surfaced) { _wnBusy = false; return; }
      _wnBusy = false;
      if (typeof _loadingProgressFinish === 'function') { try { _loadingProgressFinish(); } catch (_) {} }
      renderWhyNotEntry();
      showPage('whynot');
      try { showToast('The forge misfired. Nothing was used up. Hit Start to try again.', 'error'); } catch (_) {}
      return;
    }
    if (typeof _loadingProgressFinish === 'function') { try { _loadingProgressFinish(); } catch (_) {} }
    _wnBusy = false;

    _wnSession = { topic: topicName, rounds, roundIdx: 0, points: 0, roundResults: [] };
    _wnBeginRound(0);
  }

  function _wnBeginRound(i) {
    const r = _wnSession.rounds[i];
    _wnSession.roundIdx = i;
    _wnRound = { answerRight: undefined, wrongLetters: [], wrongIdx: 0, reasons: {}, map: null };
    whyNotMode = true;
    gauntletMode = false;
    wrongDrillMode = false;
    examMode = false;
    sessionMode = false;
    activeQuizTopic = _wnSession.topic;
    questions = [{
      question: r.question,
      // letterize — renderMCQ reads q.options[letter] (the v7.48.1 contract)
      options: _letterizeOptions(r.options),
      answer: r.answer.trim().toUpperCase(),
      explanation: r.explanation,
      topic: _wnSession.topic,
      difficulty: 'Exam Level',
      type: 'mcq'
    }];
    current = 0; score = 0; streak = 0; bestStreak = 0; answered = 0; log = [];
    quizFlags = [false];
    if (i === 0) _sessionStartTs = Date.now();
    showCacheNotice(false);
    showPage('quiz');
    render();
    _wnQuizChrome();
  }

  function _wnQuizChrome() {
    const topicEl = document.getElementById('gauntlet-run-topic');
    const dots = document.getElementById('quiz-prog-dots');
    if (topicEl) {
      topicEl.innerHTML = '<span>Why-Not</span> · ' + escHtml(_wnSession.topic) + ' · Round ' + (_wnSession.roundIdx + 1) + ' of ' + WHY_NOT_ROUNDS;
      topicEl.classList.remove('is-hidden');
    }
    if (dots) dots.classList.add('is-hidden');
  }

  function _wnFinishQuestion() {
    const r = _wnSession.rounds[_wnSession.roundIdx];
    const ans = r.answer.trim().toUpperCase();
    if (_wnRound.answerRight === undefined) _wnRound.answerRight = false;
    _wnRound.wrongLetters = ['A', 'B', 'C', 'D'].filter(l => l !== ans);
    _wnRound.wrongIdx = 0;
    renderWhyNotPicker();
    showPage('whynot-round');
  }

  function renderWhyNotPicker() {
    const root = document.getElementById('wn-round-root');
    if (!root || !_wnSession || !_wnRound) return;
    const r = _wnSession.rounds[_wnSession.roundIdx];
    const letter = _wnRound.wrongLetters[_wnRound.wrongIdx];
    const kit = r.whynot[letter];
    const optText = r.options[['A', 'B', 'C', 'D'].indexOf(letter)];
    // shuffle [true, fake, fake]; remember where the true reason landed
    const entries = [{ t: kit.reason, real: true }, { t: kit.fakes[0], real: false }, { t: kit.fakes[1], real: false }]
      .sort(() => Math.random() - 0.5);
    _wnRound.map = entries;
    const segs = ['answer'].concat(_wnRound.wrongLetters).map((k, i) => {
      if (i === 0) return '<i class="' + (_wnRound.answerRight ? 'done' : 'bad') + '"></i>';
      const li = i - 1;
      if (li < _wnRound.wrongIdx) return '<i class="' + (_wnRound.reasons[_wnRound.wrongLetters[li]] ? 'done' : 'bad') + '"></i>';
      return '<i class="' + (li === _wnRound.wrongIdx ? 'live' : '') + '"></i>';
    }).join('');
    root.innerHTML =
      '<p class="wn-strip"><span>Why-Not</span> · ' + escHtml(_wnSession.topic) + ' · Round ' + (_wnSession.roundIdx + 1) + ' of ' + WHY_NOT_ROUNDS + '</p>' +
      '<div class="wn-answered">' + (_wnRound.answerRight
        ? '<span class="wn-tick ok">✓</span><span>You answered: <b>' + escHtml(r.options[['A','B','C','D'].indexOf(r.answer.trim().toUpperCase())]) + '</b>. Right. Now earn the other three points.</span>'
        : '<span class="wn-tick bad">✗</span><span>The answer was <b>' + escHtml(r.options[['A','B','C','D'].indexOf(r.answer.trim().toUpperCase())]) + '</b>. The reasons below still score.</span>') +
      '</div>' +
      '<div class="wn-card">' +
        '<div class="wn-target"><span class="wn-lt">' + letter + '</span><b>' + escHtml(optText) + '</b></div>' +
        '<p class="wn-ask">Why does it lose?</p>' +
        entries.map((e, i) =>
          '<button type="button" class="wn-reason" id="wn-reason-' + i + '" data-action="whyNotPickReason" data-args="[' + i + ']">' + escHtml(e.t) + '</button>'
        ).join('') +
        '<div class="wn-note is-hidden" id="wn-note"></div>' +
      '</div>' +
      '<div class="wn-prog">' + segs + '</div>' +
      '<div class="gnt-result-footer">' +
        '<button type="button" class="btn btn-primary gnt-cta is-hidden" id="wn-next-btn" data-action="whyNotNextTarget">Next →</button>' +
        '<button type="button" class="btn gnt-ghost" data-action="whyNotExit">Leave session</button>' +
      '</div>';
  }

  function whyNotPickReason(i) {
    if (!_wnSession || !_wnRound || !_wnRound.map) return;
    if (_wnRound.reasons[_wnRound.wrongLetters[_wnRound.wrongIdx]] !== undefined) return; // already picked
    const r = _wnSession.rounds[_wnSession.roundIdx];
    const letter = _wnRound.wrongLetters[_wnRound.wrongIdx];
    const kit = r.whynot[letter];
    const pick = _wnRound.map[i];
    const right = !!(pick && pick.real);
    _wnRound.reasons[letter] = right;
    if (right) _wnSession.points++;
    _wnRound.map.forEach((e, j) => {
      const btn = document.getElementById('wn-reason-' + j);
      if (!btn) return;
      btn.setAttribute('disabled', '');
      if (e.real) btn.classList.add('is-right');
      else if (j === i) btn.classList.add('is-wrong-pick');
    });
    const note = document.getElementById('wn-note');
    if (note) {
      note.className = 'wn-note ' + (right ? 'good' : 'bad');
      note.innerHTML = '<b>' + (right ? 'Right reason' : 'Wrong reason') + '</b>' + escHtml(kit.note);
    }
    const nextBtn = document.getElementById('wn-next-btn');
    if (nextBtn) {
      const last = _wnRound.wrongIdx >= _wnRound.wrongLetters.length - 1;
      nextBtn.textContent = last ? 'See the round verdict →'
        : 'Next: why does ' + _wnRound.wrongLetters[_wnRound.wrongIdx + 1] + ' lose? →';
      nextBtn.classList.remove('is-hidden');
    }
    // progress segment repaint
    const prog = document.querySelector('#wn-round-root .wn-prog');
    if (prog && prog.children[_wnRound.wrongIdx + 1]) {
      prog.children[_wnRound.wrongIdx + 1].className = right ? 'done' : 'bad';
    }
  }

  function whyNotNextTarget() {
    if (!_wnSession || !_wnRound) return;
    if (_wnRound.wrongIdx < _wnRound.wrongLetters.length - 1) {
      _wnRound.wrongIdx++;
      renderWhyNotPicker();
      const sh = document.querySelector('#page-whynot-round .gnt-shell');
      if (sh) sh.scrollTop = 0;
      window.scrollTo(0, 0);
    } else {
      _wnFinishRound();
    }
  }

  function _wnFinishRound() {
    const answerPt = _wnRound.answerRight ? 1 : 0;
    if (_wnRound.answerRight) _wnSession.points++;
    const reasonPts = _wnRound.wrongLetters.filter(l => _wnRound.reasons[l]).length;
    _wnSession.roundResults.push({
      answerRight: !!_wnRound.answerRight,
      reasons: Object.assign({}, _wnRound.reasons),
      points: answerPt + reasonPts
    });
    renderWhyNotVerdict();
    showPage('whynot-verdict');
  }

  function renderWhyNotVerdict() {
    const root = document.getElementById('wn-verdict-root');
    if (!root || !_wnSession) return;
    const i = _wnSession.roundIdx;
    const r = _wnSession.rounds[i];
    const res = _wnSession.roundResults[i];
    const ans = r.answer.trim().toUpperCase();
    const lastRound = i >= WHY_NOT_ROUNDS - 1;
    const missedReasons = _wnRound.wrongLetters.filter(l => !res.reasons[l]);
    const optName = l => escHtml(r.options[['A', 'B', 'C', 'D'].indexOf(l)]);
    const callout = res.points === 4
      ? 'Clean sweep. Answer and all three reasons.'
      : (!res.answerRight && missedReasons.length === 0)
        ? 'You missed the answer but diagnosed every wrong option. The understanding is there.'
        : missedReasons.length === 1 && res.answerRight
          ? 'You knew the answer. You misdiagnosed why <b>' + optName(missedReasons[0]) + '</b> loses.'
          : missedReasons.length
            ? 'The reasons need work: ' + missedReasons.map(optName).join(' and ') + ' got past you.'
            : 'The reasons were all right. The answer got away.';
    const rows = [
      '<div class="gnt-rr ' + (res.answerRight ? 'ok' : 'bad') + '"><span class="gnt-rr-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' +
        (res.answerRight ? '<path d="M20 6 9 17l-5-5"/>' : '<path d="M18 6 6 18M6 6l12 12"/>') +
        '</svg></span><span class="gnt-rr-t"><b>The answer: ' + escHtml(r.options[['A','B','C','D'].indexOf(ans)]) + '</b><span>' + (res.answerRight ? 'Picked first time' : 'Missed on the first pick') + '</span></span></div>'
    ].concat(_wnRound.wrongLetters.map(l => {
      const ok = !!res.reasons[l];
      const optText = r.options[['A', 'B', 'C', 'D'].indexOf(l)];
      return '<div class="gnt-rr ' + (ok ? 'ok' : 'bad') + '"><span class="gnt-rr-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' +
        (ok ? '<path d="M20 6 9 17l-5-5"/>' : '<path d="M18 6 6 18M6 6l12 12"/>') +
        '</svg></span><span class="gnt-rr-t"><b>' + escHtml(optText) + '</b><span>' + escHtml(r.whynot[l].reason) + '</span></span></div>';
    })).join('');
    root.innerHTML =
      '<div class="wn-vd-head">' +
        '<div class="wn-vd-score">You earned <b>' + res.points + ' of 4</b></div>' +
        '<p class="wn-vd-call">' + callout + '</p>' +
      '</div>' +
      '<div class="gnt-rung-report">' + rows + '</div>' +
      '<div class="gnt-result-footer">' +
        '<button type="button" class="btn btn-primary gnt-cta" data-action="' + (lastRound ? 'whyNotFinishSession' : 'whyNotNextRound') + '">' + (lastRound ? 'Session verdict →' : 'Next round →') + '</button>' +
        '<button type="button" class="btn gnt-ghost" data-action="whyNotExit">Leave session</button>' +
      '</div>';
  }

  function whyNotNextRound() {
    if (!_wnSession) { startWhyNot(); return; }
    // bounds guard: past the last round, the only valid move is the session
    // verdict (the real button already says so; this protects double-fires)
    if (_wnSession.roundIdx + 1 >= WHY_NOT_ROUNDS) { whyNotFinishSession(); return; }
    _wnBeginRound(_wnSession.roundIdx + 1);
  }

  function whyNotFinishSession() {
    if (!_wnSession) { startWhyNot(); return; }
    const answersRight = _wnSession.roundResults.filter(x => x.answerRight).length;
    const pct = Math.round((answersRight / WHY_NOT_ROUNDS) * 100);
    try { saveToHistory({ date: new Date().toISOString(), topic: _wnSession.topic, difficulty: 'Exam Level', score: answersRight, total: WHY_NOT_ROUNDS, pct, mode: 'whynot' }); } catch (_) {}
    try { updateStreak(); renderStreakBadge(); } catch (_) {}
    try { if (typeof _writeReadinessSnapshot === 'function') _writeReadinessSnapshot(); } catch (_) {}
    try { renderStatsCard(); renderReadinessCard(); } catch (_) {}
    whyNotMode = false;
    if (typeof _renderGauntletLadder === 'function') { try { _renderGauntletLadder(); } catch (_) {} }
    const root = document.getElementById('wn-verdict-root');
    if (root) {
      const pts = _wnSession.points;
      const perRound = _wnSession.roundResults.map((x, i) =>
        '<div class="gnt-rr ' + (x.points === 4 ? 'ok' : 'bad') + '"><span class="gnt-rr-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' +
        (x.points === 4 ? '<path d="M20 6 9 17l-5-5"/>' : '<path d="M18 6 6 18M6 6l12 12"/>') +
        '</svg></span><span class="gnt-rr-t"><b>Round ' + (i + 1) + '</b><span>' + x.points + ' of 4</span></span></div>'
      ).join('');
      root.innerHTML =
        '<div class="wn-vd-head">' +
          '<div class="wn-vd-score">Session: <b>' + pts + ' of 12</b></div>' +
          '<p class="wn-vd-call">' + escHtml(_wnSession.topic) + ' · 3 questions answered toward today’s goal</p>' +
        '</div>' +
        '<div class="gnt-rung-report">' + perRound + '</div>' +
        '<div class="gnt-result-footer">' +
          '<button type="button" class="btn btn-primary gnt-cta" data-action="whyNotNextTopic">Next target →</button>' +
          '<button type="button" class="btn gnt-ghost" data-action="whyNotExit">' + (_wnReturn === 'drills' ? 'Back to Drills' : 'Back to Home') + '</button>' +
        '</div>';
    }
    try {
      if (typeof bumpDrillStat === 'function') {
        bumpDrillStat('whynot', 'done', 1);
        if (answersRight === WHY_NOT_ROUNDS) bumpDrillStat('whynot', 'perfect', 1);
      }
      if (typeof evaluateMilestones === 'function') {
        const _nu = evaluateMilestones();
        _nu.forEach((id, i) => setTimeout(() => showMilestoneCelebration(id), 500 + i * 900));
      }
    } catch (_) {}
    _wnSession = null;
    _wnRound = null;
    // the user is usually ALREADY on the verdict page (round verdict re-uses
    // it) — re-showing the active page can race the transition animation
    var _act = document.querySelector('.page.active');
    if (!_act || _act.id !== 'page-whynot-verdict') showPage('whynot-verdict');
  }

  function whyNotNextTopic() {
    _wnTopic = null;
    _wnSession = null;
    _wnRound = null;
    whyNotStart({});
  }

  function whyNotExit() {
    whyNotMode = false;
    _wnSession = null;
    _wnRound = null;
    if (typeof _renderGauntletLadder === 'function') { try { _renderGauntletLadder(); } catch (_) {} }
    whyNotBack();
  }

  // ── window re-exposure (HTML data-action via event-actions.js window[name] dispatch
  //    + quiz-engine typeof-guarded hooks) ──
  // static + generated data-action targets
  window.startRewordGauntlet = startRewordGauntlet;   // overwrites the app.js loader stub
  window.gauntletBack = gauntletBack;
  window.gauntletStart = gauntletStart;
  window.gauntletToggleTopicList = gauntletToggleTopicList;
  window.gauntletChooseTopic = gauntletChooseTopic;
  window.gauntletRunAgain = gauntletRunAgain;
  window.gauntletDifferentConcept = gauntletDifferentConcept;
  window.gauntletNextTarget = gauntletNextTarget;
  window.gauntletExit = gauntletExit;
  window.startWhyNot = startWhyNot;                   // overwrites the app.js loader stub
  window.whyNotBack = whyNotBack;
  window.whyNotStart = whyNotStart;
  window.whyNotToggleTopicList = whyNotToggleTopicList;
  window.whyNotChooseTopic = whyNotChooseTopic;
  window.whyNotPickReason = whyNotPickReason;
  window.whyNotNextTarget = whyNotNextTarget;
  window.whyNotNextRound = whyNotNextRound;
  window.whyNotFinishSession = whyNotFinishSession;
  window.whyNotNextTopic = whyNotNextTopic;
  window.whyNotExit = whyNotExit;
  // quiz-engine hooks (typeof-guarded call sites in app.js)
  window._renderGauntletLadder = _renderGauntletLadder;
  window._gauntletApplyHinge = _gauntletApplyHinge;
  window._finishGauntlet = _finishGauntlet;
  window._wnFinishQuestion = _wnFinishQuestion;

  // ── feature registry ──
  window._certanvilFeatures = window._certanvilFeatures || {};
  window._certanvilFeatures['flagship-drills'] = {
    startRewordGauntlet: startRewordGauntlet,
    startWhyNot: startWhyNot
  };
})();
