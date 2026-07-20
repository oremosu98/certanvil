(function () {
  'use strict';
  if (!window._certanvilFeatures) window._certanvilFeatures = {};

  // ══════════════════════════════════════════
  // v4.10 FRONT PAGE FEATURES
  // ══════════════════════════════════════════

  // ── Daily Challenge ──
  function getDailyChallenge() {
    try {
      const raw = localStorage.getItem(STORAGE.DAILY_CHALLENGE);
      if (!raw) return { lastCompletedDate: null, currentStreak: 0, bestStreak: 0, totalDone: 0 };
      const obj = JSON.parse(raw);
      return {
        lastCompletedDate: obj.lastCompletedDate || null,
        currentStreak: obj.currentStreak || 0,
        bestStreak: obj.bestStreak || 0,
        totalDone: obj.totalDone || 0,
      };
    } catch { return { lastCompletedDate: null, currentStreak: 0, bestStreak: 0, totalDone: 0 }; }
  }
  function saveDailyChallenge(data) {
    try { localStorage.setItem(STORAGE.DAILY_CHALLENGE, JSON.stringify(data)); _cloudFlush(STORAGE.DAILY_CHALLENGE); } catch {}
  }
  function isDailyChallengeDoneToday() {
    const today = new Date().toISOString().slice(0, 10);
    return getDailyChallenge().lastCompletedDate === today;
  }
  function completeDailyChallenge() {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const dc = getDailyChallenge();
    if (dc.lastCompletedDate === today) return dc; // already counted
    dc.currentStreak = (dc.lastCompletedDate === yesterday) ? dc.currentStreak + 1 : 1;
    dc.bestStreak = Math.max(dc.bestStreak, dc.currentStreak);
    dc.lastCompletedDate = today;
    dc.totalDone = (dc.totalDone || 0) + 1;
    saveDailyChallenge(dc);
    return dc;
  }
  // Deterministic topic for the day: hash YYYY-MM-DD into the topic list
  function getDailyChallengeTopic() {
    const today = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) hash = ((hash << 5) - hash + today.charCodeAt(i)) | 0;
    const topics = Object.keys(TOPIC_DOMAINS);
    return topics[Math.abs(hash) % topics.length];
  }

  // v5.5.5 — Continue anchor. The right rail's ALWAYS-present bottom: on a
  // low-data account #hero-v2-cta (NBM) + #sr-review-card collapse and the
  // tall left column leaves dead space below Daily Challenge. This card is
  // always rendered (never is-hidden) so the rail can't collapse, and it is
  // always prescriptive — re-entry + proof of motion (the one job nothing
  // else on Home has: NBM = what's optimal, SR = cards due, Daily Challenge
  // = the 1-Q habit, Today's Plan = the 5-topic route; this = pick your
  // thread back up). Reads existing signals only; zero new storage.
  function renderContinueCard() {
    const card = document.getElementById('continue-card');
    if (!card) return;
    let hist = [];
    // v5.5.7: cert-scope. Quiz history + wrong bank are global per user but
    // topics belong to a specific cert (the v4.99.26 cross-cert pattern).
    // Filtering to the current cert means a cert with no own history correctly
    // falls to the "fresh" first-action state instead of leaking the OTHER
    // cert's last session (was showing N10-009 "Cable Issues" in Security+).
    try { hist = (loadHistory() || []).filter(e => e && _isCurrentCertTopic(e.topic)); } catch (_) {}
    const last = (hist && hist.length) ? hist[0] : null;
    const totalQ = (hist || []).reduce((s, e) => s + (parseInt(e && e.total, 10) || 0), 0);
    const hasHistory = !!last && totalQ > 0;

    const setTxt  = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const setHtml = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v; };
    const btn = document.getElementById('cc-action');

    // Zero/low: no real history -> one confident first move (never an empty
    // card; this is what makes the rail un-collapsible).
    if (!hasHistory) {
      card.setAttribute('data-state', 'fresh');
      setTxt('cc-eyebrow-t', 'Start here');
      setTxt('cc-headline', 'You have not built a streak yet');
      setTxt('cc-context', 'A five-minute warm-up sets your first readiness score and starts the chain.');
      setTxt('cc-action-t', 'Take the 5-min Warmup');
      if (btn) btn.onclick = function () { try { applyPreset('warmup'); } catch (_) {} };
      return;
    }

    card.setAttribute('data-state', 'returning');
    let streak = 0;
    try { streak = getStreak().current || 0; } catch (_) {}
    const todayN = (typeof getTodayQuestionCount === 'function') ? (getTodayQuestionCount() || 0) : 0;
    setTxt('cc-m1n', streak);
    setTxt('cc-m2n', todayN);
    setTxt('cc-m3n', totalQ);
    // v7.13.0: ease-out count-up on the resume metrics (bigger target → longer).
    // animateCount writes textContent, so the setTxt above stays the fallback.
    if (typeof animateCount === 'function') {
      animateCount('cc-m1n', 0, streak, 700);
      animateCount('cc-m2n', 0, todayN, 700);
      animateCount('cc-m3n', 0, totalQ, 850);
    }

    let daysAgo = 0;
    try {
      const t = new Date(last.date).getTime();
      if (!isNaN(t)) daysAgo = Math.max(0, Math.floor((Date.now() - t) / 86400000));
    } catch (_) {}
    const whenStr = daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : daysAgo + ' days ago';
    const lastScore = (parseInt(last.score, 10) || 0) + ' / ' + (parseInt(last.total, 10) || 0);
    const lastTopic = String(last.topic || 'your last topic');

    let wrongN = 0;
    // v5.5.7: cert-scope the wrong-bank count too (entries carry .topic) so
    // "N still in your wrong bank" / "Drill the N you missed" reflect only the
    // current cert. If the current cert has 0 wrongs the wrong-path is skipped
    // (gated on wrongN > 0) and the cert-filtered weak path takes over.
    try { wrongN = (loadWrongBank() || []).filter(w => w && _isCurrentCertTopic(w.topic)).length; } catch (_) {}

    setTxt('cc-eyebrow-t', 'Pick up where you left off');

    if (wrongN > 0) {
      // Highest-leverage re-entry: re-test the misses.
      setTxt('cc-headline', lastTopic);
      setHtml('cc-context', 'Last session <b>' + escHtml(lastScore) + '</b> · ' + escHtml(whenStr) + ' · ' + wrongN + ' still in your wrong bank.');
      setTxt('cc-action-t', wrongN === 1 ? 'Drill the 1 you missed' : 'Drill the ' + wrongN + ' you missed');
      if (btn) btn.onclick = function () { try { startWrongDrill(); } catch (_) {} };
      return;
    }

    // No pending misses -> resume the weakest topic from the same plan
    // signals Today's Plan uses.
    let weakTopic = null;
    try {
      const plan = (typeof buildSessionPlan === 'function') ? buildSessionPlan(SESSION_TOPICS) : null;
      if (plan && plan.length) { const w = plan.find(i => i && i.signal === 'weak') || plan[0]; weakTopic = w && w.topic; }
    } catch (_) {}

    if (weakTopic) {
      setTxt('cc-headline', String(weakTopic));
      setHtml('cc-context', 'Last session <b>' + escHtml(lastScore) + '</b> on ' + escHtml(lastTopic) + ' · ' + escHtml(whenStr) + '. This is your weakest area now.');
      setTxt('cc-action-t', 'Resume weak spots');
      if (btn) btn.onclick = function () { try { focusTopic(weakTopic); } catch (_) {} };
    } else {
      setTxt('cc-headline', lastTopic);
      setHtml('cc-context', 'Last session <b>' + escHtml(lastScore) + '</b> · ' + escHtml(whenStr) + '. Keep the chain going.');
      setTxt('cc-action-t', 'Continue weak spots');
      if (btn) btn.onclick = function () { try { applyPreset('focused'); } catch (_) {} };
    }
  }

  function renderDailyChallengeCard() {
    const card = document.getElementById('daily-challenge-card');
    if (!card) return;
    // Once today's challenge is done, hide the card entirely until tomorrow.
    if (isDailyChallengeDoneToday()) {
      card.classList.add('is-hidden');
      card.classList.remove('dc-done', 'dc-pending');
      return;
    }
    const dc = getDailyChallenge();
    const topicToday = getDailyChallengeTopic();
    const streakText = dc.currentStreak > 0
      ? `${dc.currentStreak}-day streak${dc.bestStreak > dc.currentStreak ? ' · Best ' + dc.bestStreak : ''}`
      : 'Start your streak today';
    card.innerHTML = `
      <div class="dc-body">
        <div class="dc-title">DAILY CHALLENGE</div>
        <div class="dc-sub">One question · Topic: <strong>${escHtml(topicToday)}</strong> · ${escHtml(streakText)}</div>
      </div>
      <button class="dc-btn" onclick="startDailyChallenge()">Play →</button>
    `;
    card.classList.add('dc-pending');
    card.classList.remove('dc-done');
    card.classList.remove('is-hidden');
  }
  async function startDailyChallenge() {
    const key = (document.getElementById('api-key').value || localStorage.getItem(STORAGE.KEY) || '').trim();
    const errBox = document.getElementById('setup-err');
    if (errBox) errBox.classList.add('is-hidden');
    const keyErr = validateApiKey(key);
    if (keyErr) {
      if (errBox) { errBox.textContent = keyErr; errBox.classList.remove('is-hidden'); }
      return;
    }
    // Configure the quiz: 1 question, Exam Level, date-seeded topic
    const dcTopic = getDailyChallengeTopic();
    topic = dcTopic;
    diff = DEFAULT_DIFF;
    qCount = 1;
    dailyChallengeMode = true;
    document.querySelectorAll('#topic-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === dcTopic));
    document.querySelectorAll('#diff-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === DEFAULT_DIFF));
    document.querySelectorAll('#count-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === '1' || c.dataset.v === '5'));
    syncChipAriaPressed('#topic-group');
    syncChipAriaPressed('#diff-group');
    syncChipAriaPressed('#count-group');
    startQuiz();
  }


  // Backward-compat shim — existing callers (Focused preset, etc.) still expect
  // just the top N topic names. New detail-view code uses computeWeakSpotScores
  // directly.
  function getTodaysFocusTopics(limit = 2) {
    return computeWeakSpotScores().slice(0, limit).map(r => r.topic);
  }

  function focusTopic(t) {
    topic = t;
    diff = DEFAULT_DIFF;
    qCount = 10;
    document.querySelectorAll('#topic-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === t));
    document.querySelectorAll('#diff-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === DEFAULT_DIFF));
    document.querySelectorAll('#count-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === '10'));
    syncChipAriaPressed('#topic-group');
    syncChipAriaPressed('#diff-group');
    syncChipAriaPressed('#count-group');
    startQuiz();
  }

  // ── Streak Defender (amber warning if streak at risk) ──
  function renderStreakDefender() {
    const card = document.getElementById('streak-defender');
    if (!card) return;
    const s = getStreak();
    const today = new Date().toISOString().slice(0, 10);
    // Active threat: current streak ≥ 3 AND no activity today yet
    if (s.current >= 3 && s.last !== today) {
      card.innerHTML = `
        <div class="sd-body">
          <div class="sd-title">Don't break your ${s.current}-day streak!</div>
          <div class="sd-sub">One question is all it takes to keep it alive.</div>
        </div>
        <button class="sd-btn" onclick="startStreakSave()">Save streak →</button>
      `;
      card.classList.remove('is-hidden');
    } else {
      card.classList.add('is-hidden');
    }
  }
  function startStreakSave() {
    // Configure a minimum quiz: 5 questions, mixed, exam level
    topic = MIXED_TOPIC;
    diff = DEFAULT_DIFF;
    qCount = 5;
    document.querySelectorAll('#topic-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === MIXED_TOPIC));
    document.querySelectorAll('#diff-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === DEFAULT_DIFF));
    document.querySelectorAll('#count-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === '5'));
    syncChipAriaPressed('#topic-group');
    syncChipAriaPressed('#diff-group');
    syncChipAriaPressed('#count-group');
    startQuiz();
  }

  // ── Quiz Presets (3 one-click starting configs) ──
  function applyPreset(name) {
    // v7.46.0: Deep Scan + all marathon presets are Pro-only (Simi, 2026-06-11).
    // Free stays on Warmup (5), Focused (10), and custom sets up to 15.
    // v7.46.1: per-preset modal copy (the shared template broke on plurals).
    const PRO_PRESETS = {
      grind: {
        feature: 'The 20-min Deep Scan',
        title: 'The Deep Scan is a Pro feature',
        body: '20 exam-level questions across every topic in one sitting · more than the free day holds.'
      },
      bulk30: {
        feature: 'The 30-question marathon',
        title: 'The 30-question marathon is a Pro feature',
        body: 'One marathon burns past the free day’s 15 questions. Pro takes the cap off.'
      },
      bulk45: {
        feature: 'The 45-question marathon',
        title: 'The 45-question marathon is a Pro feature',
        body: 'One marathon burns past the free day’s 15 questions. Pro takes the cap off.'
      },
      bulk60: {
        feature: 'The 60-Question SIM',
        title: 'The 60-Question SIM is a Pro feature',
        body: 'The closest thing to the real exam, minus the timer. Full-length sims are Pro.'
      }
    };
    const _proPreset = PRO_PRESETS[name];
    if (_proPreset && typeof _gateProOnly === 'function' &&
        !_gateProOnly(_proPreset.feature, { title: _proPreset.title, body: _proPreset.body })) return;
    // Bulk Mixed presets — large counts that exceed the single-call ceiling are
    // batched via startBulkQuiz so the AI never gets asked for >20 Qs at once.
    const bulkSizes = { bulk30: 30, bulk45: 45, bulk60: 60 };
    if (bulkSizes[name]) {
      topic = MIXED_TOPIC; diff = 'Exam Level'; qCount = bulkSizes[name];
      document.querySelectorAll('#topic-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === topic));
      document.querySelectorAll('#diff-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === diff));
      document.querySelectorAll('#count-group .chip').forEach(c => c.classList.remove('on'));
      syncChipAriaPressed('#topic-group');
      syncChipAriaPressed('#diff-group');
      syncChipAriaPressed('#count-group');
      startBulkQuiz(qCount);
      return;
    }
    if (name === 'warmup') {
      topic = MIXED_TOPIC; diff = 'Foundational'; qCount = 5;
    } else if (name === 'focused') {
      // Focused: use weakest topic if known, otherwise Smart spaced-rep
      const weakest = (getTodaysFocusTopics(1)[0]) || getSpacedRepTopic() || MIXED_TOPIC;
      topic = weakest; diff = 'Exam Level'; qCount = 10;
    } else if (name === 'grind') {
      topic = MIXED_TOPIC; diff = 'Exam Level'; qCount = 20;
    } else { return; }
    document.querySelectorAll('#topic-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === topic));
    document.querySelectorAll('#diff-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === diff));
    document.querySelectorAll('#count-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === String(qCount)));
    syncChipAriaPressed('#topic-group');
    syncChipAriaPressed('#diff-group');
    syncChipAriaPressed('#count-group');
    startQuiz();
  }

  // ══════════════════════════════════════════
  // v4.81.17: DOMAIN DRILL — fast-path quizzing on all topics in one of the 5
  // N10-009 domains. Two surfaces:
  //   1. Mode Ladder tile  → applyDomainPreset(key) — fires a 10-Q Exam Level
  //      quiz on that domain immediately (one-click flow).
  //   2. Custom Quiz pill  → prefillDomainTopics(key) — selects all topic
  //      chips in that domain so the user can then customise diff + count
  //      and hit Generate (deep-config flow).
  // Both reuse the existing multi-topic Custom Quiz infrastructure (chip
  // selection state + 'Multi: ...' topic sentinel + startQuiz pipeline) —
  // no new fetch path, no new validation surface.
  // ══════════════════════════════════════════
  let _DOMAIN_TOPICS_CACHE = null;
  function _topicsInDomain(domainKey) {
    if (!_DOMAIN_TOPICS_CACHE) {
      _DOMAIN_TOPICS_CACHE = {};
      Object.keys(TOPIC_DOMAINS).forEach(t => {
        const d = TOPIC_DOMAINS[t];
        if (!_DOMAIN_TOPICS_CACHE[d]) _DOMAIN_TOPICS_CACHE[d] = [];
        _DOMAIN_TOPICS_CACHE[d].push(t);
      });
    }
    return _DOMAIN_TOPICS_CACHE[domainKey] || [];
  }

  // v4.87.1: cert-aware domain index. Network+ has 5 domains:
  //   concepts(1), implementation(2), operations(3), security(4), troubleshooting(5)
  // Security+ has 5 different domains:
  //   concepts(1), threats(2), architecture(3), operations(4), governance(5)
  // The 1-5 numeric index is a UI affordance (matches data-domain-idx CSS color
  // coding); the actual domain key strings differ per cert. Built from
  // CERT_PACK.domainWeights insertion order — JS object key order is preserved
  // so this matches the order topics were declared per-domain.
  const _DOMAIN_IDX = (() => {
    const idx = {};
    if (CERT_PACK && CERT_PACK.domainWeights) {
      Object.keys(CERT_PACK.domainWeights).forEach((k, i) => { idx[k] = i + 1; });
    } else {
      // Network+ fallback if CERT_PACK failed to load
      idx.concepts = 1; idx.implementation = 2; idx.operations = 3; idx.security = 4; idx.troubleshooting = 5;
    }
    return idx;
  })();

  // v4.88.0: substitute cert-specific copy in user-visible HTML elements.
  // Static HTML ships with Network+ wording (correct for the customer-facing
  // deploy). When CURRENT_CERT === 'secplus' this function rewrites strings
  // to the active cert's name + code + pass mark. Network+ mode is no-op.
  //
  // Why post-load substitution: the static HTML stays human-readable (no
  // template syntax), Network+ has zero flash, Security+ accepts a tiny
  // flash on initial load — acceptable trade-off. v7.1.0 Sec+ now publicly
  // launched at secplus.certanvil.com (Pro tier).
  //
  // Targets — the user-visible Network+/N10-009 hardcodes that swap:
  //   - .diagnostic-cta-title       "🧪 Where do you stand on N10-009?"
  //   - #pass-plan-sub              "...all 5 N10-009 domains"
  //   - .results-v2-big-label       "Scaled Score · CompTIA N10-009"
  //   - .exam-results-v2-big-label  same
  //   - .exam-results-v2-threshold  "Pass mark: 720 / 900 · CompTIA N10-009"
  //   - .exam-domain-breakdown-sub  "...each N10-009 domain"
  //   - .ed-pagehead-lede (drills)  "Drills for the rote parts of Network+..."
  //   - .ed-section-meta            "N10-009 exam weighting"
  //   - .hero.is-hidden h1          "Network+ AI Quiz" (legacy hero)
  function _renderCertAwareCopy() {
    if (!CERT_PACK || !CERT_PACK.meta) return;
    if (CURRENT_CERT === 'netplus') return; // static HTML correct for Network+
    try {
      const code = CERT_PACK.meta.code; // e.g., 'SY0-701' or 'AZ-900'
      // v7.3.0 — vendor extracted from name's first word so the static HTML's
      // "CompTIA" prefix gets rewritten correctly per cert (Sec+ stays
      // "CompTIA", AZ-900 becomes "Microsoft"). Pre-v7.3.0 the vendor was
      // hardcoded "CompTIA" on the threshold line + implicitly preserved by
      // the .replace(/N10-009/g, code) substitutions on the labels.
      // Net+: 'CompTIA Network+'.split(' ')[0]  = 'CompTIA'
      // Sec+: 'CompTIA Security+'.split(' ')[0] = 'CompTIA'
      // AZ-900: 'Microsoft Azure Fundamentals'.split(' ')[0] = 'Microsoft'
      const vendor = (CERT_PACK.meta.name.split(' ')[0]) || 'CompTIA';
      // Cert short name for HTML lede: strip leading vendor word so "Network+"
      // and "Security+" stay clean, and AZ-900 reads "Azure Fundamentals".
      const name = CERT_PACK.meta.name.replace(/^(CompTIA|Microsoft)\s+/, '');
      const passMark = CERT_PACK.meta.examPassScore;
      const maxScore = CERT_PACK.meta.examMaxScore;

      // 1. Diagnostic CTA title
      const diagTitle = document.querySelector('.diagnostic-cta-title');
      if (diagTitle && diagTitle.textContent.indexOf('N10-009') !== -1) {
        diagTitle.innerHTML = diagTitle.innerHTML.replace(/N10-009/g, code);
      }

      // 2. Pass plan sub
      const passPlanSub = document.getElementById('pass-plan-sub');
      if (passPlanSub && passPlanSub.textContent.indexOf('N10-009') !== -1) {
        passPlanSub.textContent = passPlanSub.textContent.replace(/N10-009/g, code);
      }

      // 3 + 4. Scaled Score · CompTIA N10-009 labels (results + exam-results).
      // v7.3.0 — also rewrite the vendor prefix so AZ-900 reads "Microsoft AZ-900"
      // instead of "CompTIA AZ-900". For Net+/Sec+ the CompTIA→CompTIA replace
      // is a no-op so behaviour is unchanged.
      document.querySelectorAll('.results-v2-big-label, .exam-results-v2-big-label').forEach(function(el) {
        if (el.innerHTML.indexOf('N10-009') !== -1) {
          el.innerHTML = el.innerHTML.replace(/N10-009/g, code).replace(/CompTIA/g, vendor);
        }
      });

      // 5. Pass mark text — also swap the score (Network+ 720 → Security+ 750
      // → AZ-900 700) AND the vendor word for AZ-900.
      const threshold = document.querySelector('.exam-results-v2-threshold');
      if (threshold) {
        threshold.innerHTML = 'Pass mark: ' + passMark + ' / ' + maxScore + ' &middot; ' + vendor + ' ' + code + ' scaled score';
      }

      // 6. Domain breakdown sub
      const domainSub = document.querySelector('.exam-domain-breakdown-sub');
      if (domainSub && domainSub.textContent.indexOf('N10-009') !== -1) {
        domainSub.textContent = domainSub.textContent.replace(/N10-009/g, code);
      }

      // 7. Drills pagehead lede
      document.querySelectorAll('.ed-pagehead-lede').forEach(function(el) {
        if (el.textContent.indexOf('Network+') !== -1) {
          el.innerHTML = el.innerHTML.replace(/Network\+/g, name);
        }
      });

      // 8. Section meta "N10-009 exam weighting" (anywhere)
      document.querySelectorAll('.ed-section-meta').forEach(function(el) {
        if (el.textContent.indexOf('N10-009') !== -1) {
          el.textContent = el.textContent.replace(/N10-009/g, code);
        }
      });

      // 9. Legacy hero h1 (hidden via .is-hidden, kept for regression-guards)
      const legacyHeroH1 = document.querySelector('.hero.is-hidden h1');
      if (legacyHeroH1 && legacyHeroH1.textContent === 'Network+ AI Quiz') {
        legacyHeroH1.textContent = name + ' AI Quiz';
      }
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[cert] _renderCertAwareCopy failed:', e.message);
    }
  }

  // v4.87.1: re-render topic chips + domain pills + Mode Ladder tiles for the
  // active cert. Static HTML in index.html is hardcoded for Network+ topics
  // (50 chips across 5 N+ domains). When CURRENT_CERT === 'secplus' this
  // function rebuilds:
  //   1. The 5 <details class="topic-domain-group"> accordions (chip lists)
  //   2. The 5 .tdp-pill domain-prefill buttons (label + onclick handler)
  //   3. The 5 .dgh-db domain-preset buttons (label + onclick + title)
  // Network+ mode is no-op — static HTML is correct for it.
  //
  // Why re-render at runtime instead of dynamic HTML from scratch: keeps the
  // Network+ static HTML untouched (zero behavioral risk for the customer-
  // facing deploy) while letting Security+ override at boot. The data-cert
  // attribute on <html> set by the inline <head> script controls visibility
  // of the per-cert banner; this function controls the chip content.
  function _renderTopicChipsForActiveCert() {
    if (!CERT_PACK || !CERT_PACK.topicDomains || !CERT_PACK.domainLabels) return;
    if (CURRENT_CERT === 'netplus') return; // static HTML is correct
    try {
      const domainKeys = Object.keys(CERT_PACK.domainWeights || {});
      // v7.3.0 — was `!== 5` (Net+/Sec+ both have 5 domains); AZ-900 has 3
      // (cloud-concepts / azure-architecture / azure-management). Accept any
      // 1-5 domain blueprint; unused domain-idx accordions/pills/buttons in
      // the static HTML are hidden via dg-system.css scoped to data-cert.
      if (domainKeys.length < 1 || domainKeys.length > 5) return; // unexpected blueprint shape

      // Build per-domain topic lists from CERT_PACK.topicDomains
      const topicsByDomain = {};
      Object.keys(CERT_PACK.topicDomains).forEach(t => {
        const d = CERT_PACK.topicDomains[t];
        if (!topicsByDomain[d]) topicsByDomain[d] = [];
        topicsByDomain[d].push(t);
      });

      const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      // 1. Update the 5 topic-domain-group accordions
      domainKeys.forEach((dKey, i) => {
        const idx = i + 1;
        const accordion = document.querySelector('details.topic-domain-group[data-domain-idx="' + idx + '"]');
        if (!accordion) return;
        const summary = accordion.querySelector('summary');
        const grid = accordion.querySelector('.chip-grid');
        const label = CERT_PACK.domainLabels[dKey] || dKey;
        const weight = CERT_PACK.domainWeights[dKey];
        const weightStr = weight ? Math.round(weight * 100) + '%' : '';
        if (summary) {
          summary.innerHTML = '<span class="dom-name">' + idx + '.0 ' + escHtml(label) + '</span><span class="dom-weight">' + weightStr + '</span>';
        }
        if (grid) {
          const topics = topicsByDomain[dKey] || [];
          grid.innerHTML = topics.map(t => '<button class="chip" data-v="' + escHtml(t) + '">' + escHtml(t) + '</button>').join('');
        }
      });

      // 2. Update the 5 .tdp-pill domain-prefill buttons
      document.querySelectorAll('.tdp-pill').forEach((pill) => {
        const idx = parseInt(pill.dataset.domainIdx, 10);
        const dKey = domainKeys[idx - 1];
        if (!dKey) return;
        const label = CERT_PACK.domainLabels[dKey] || dKey;
        const count = (topicsByDomain[dKey] || []).length;
        pill.textContent = idx + '.0 ' + label;
        pill.setAttribute('onclick', "prefillDomainTopics('" + dKey + "')");
        pill.setAttribute('title', 'Select all ' + count + ' ' + label + ' topics');
      });

      // 3. Update the 5 .dgh-db domain-preset buttons. Inner structure:
      //   <span class="dbk">1.0 · 23%</span>
      //   <span class="dbn">Networking Concepts</span>
      //   <span class="dbm">10 Qs</span>
      document.querySelectorAll('.dgh-db').forEach((btn) => {
        const idx = parseInt(btn.dataset.domainIdx, 10);
        const dKey = domainKeys[idx - 1];
        if (!dKey) return;
        const label = CERT_PACK.domainLabels[dKey] || dKey;
        const weight = CERT_PACK.domainWeights[dKey];
        const count = (topicsByDomain[dKey] || []).length;
        btn.setAttribute('onclick', "applyDomainPreset('" + dKey + "')");
        btn.setAttribute('title', '10 Qs · Exam Level · all ' + count + ' ' + label + ' topics');
        var kSpan = btn.querySelector('.dbk');
        var nSpan = btn.querySelector('.dbn');
        var mSpan = btn.querySelector('.dbm');
        if (kSpan) kSpan.textContent = idx + '.0 · ' + (weight ? Math.round(weight * 100) + '%' : '');
        if (nSpan) nSpan.textContent = label;
        if (mSpan) mSpan.textContent = '10 Qs';
      });
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[chips] _renderTopicChipsForActiveCert failed:', e.message);
    }
  }

  function applyDomainPreset(domainKey) {
    const topics = _topicsInDomain(domainKey);
    if (!topics.length) return;
    topic = 'Multi: ' + topics.join(', ');
    diff = 'Exam Level';
    qCount = 10;
    // Sync chip state so the Custom Quiz section reflects what's running.
    const g = document.getElementById('topic-group');
    if (g) {
      g.querySelectorAll('.chip.cq-mode-card').forEach(c => {
        c.classList.remove('on');
        c.setAttribute('aria-pressed', 'false');
      });
      g.querySelectorAll('.chip:not(.cq-mode-card)').forEach(c => {
        const isInDomain = topics.includes(c.dataset.v);
        c.classList.toggle('on', isInDomain);
        c.setAttribute('aria-pressed', isInDomain ? 'true' : 'false');
      });
    }
    document.querySelectorAll('#diff-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === diff));
    document.querySelectorAll('#count-group .chip').forEach(c => c.classList.toggle('on', c.dataset.v === String(qCount)));
    syncChipAriaPressed('#topic-group');
    syncChipAriaPressed('#diff-group');
    syncChipAriaPressed('#count-group');
    startQuiz();
  }

  function prefillDomainTopics(domainKey) {
    const topics = _topicsInDomain(domainKey);
    if (!topics.length) return;
    const g = document.getElementById('topic-group');
    if (!g) return;
    // Mode cards (Smart / Mixed) contradict explicit domain selection — clear them
    g.querySelectorAll('.chip.cq-mode-card').forEach(c => {
      c.classList.remove('on');
      c.setAttribute('aria-pressed', 'false');
    });
    g.querySelectorAll('.chip:not(.cq-mode-card)').forEach(c => {
      const isInDomain = topics.includes(c.dataset.v);
      c.classList.toggle('on', isInDomain);
      c.setAttribute('aria-pressed', isInDomain ? 'true' : 'false');
    });
    // Update the topic state via the same computer the multi-select handler uses
    if (typeof _computeTopicFromChips === 'function') {
      topic = _computeTopicFromChips();
    }
    // Auto-open the corresponding accordion so the user sees the selection
    const idx = _DOMAIN_IDX[domainKey];
    if (idx) {
      const accordion = g.querySelector('details[data-domain-idx="' + idx + '"]');
      if (accordion) accordion.setAttribute('open', '');
    }
    // Refresh the Custom Quiz summary bar + jump into view
    if (typeof updateCqSummaryBar === 'function') updateCqSummaryBar();
    if (typeof _jumpToCustomQuiz === 'function') _jumpToCustomQuiz();
  }

  // v7.52.0: open the Custom Quiz builder pre-loaded with a weak domain's topics (no auto-start).
  function _drillWeakDomainToBuilder(domainKey) {
    const rem = _quotaRemainingToday();              // Infinity for Pro/admin; N for free
    if (rem === 0) {                                 // free user out of questions today: show the wall, do not open a builder they cannot run
      if (typeof _gateActivityForQuota === 'function') _gateActivityForQuota('practice quizzes');
      return;
    }
    prefillDomainTopics(domainKey);                  // selects topics + opens builder, no auto-start
    const want = (rem === Infinity) ? 15 : Math.max(5, Math.min(15, rem));
    qCount = want;
    document.querySelectorAll('#count-group .chip').forEach(c =>
      c.classList.toggle('on', c.dataset.v === String(want)));
    syncChipAriaPressed('#count-group');
    _renderBuilderQuotaLine();
  }

  // ══════════════════════════════════════════
  // START BULK MIXED QUIZ (batched, for 30/60/100 presets)
  // ══════════════════════════════════════════
  // Batched mixed quiz for the large preset tiles. The single fetchQuestions
  // call is unreliable above ~20 Qs, so we mirror the exam-mode batching: chunk
  // the request into 18-Q calls, show a progress bar, and concatenate. The flow
  // after assembly is identical to startQuiz() (validation pipeline + render).
  async function startBulkQuiz(count) {
    const key = document.getElementById('api-key').value.trim();
    const errBox = document.getElementById('setup-err');
    errBox.classList.add('is-hidden');
    const keyErr = validateApiKey(key);
    if (keyErr) {
      errBox.textContent = keyErr; errBox.classList.remove('is-hidden'); showSetupError();
      // v7.x: signed-out gate — anchor to primaryLaunch tile (bulk presets live on home)
      if (window._certanvilSignedIn !== true && !key) {
        _showSignInPrompt(document.getElementById('primaryLaunch'), keyErr);
      }
      return;
    }
    apiKey = key;
    localStorage.setItem(STORAGE.KEY, key);
    examMode = false;
    wrongDrillMode = false;

    activeQuizTopic = MIXED_TOPIC;
    topic = MIXED_TOPIC;
    diff = 'Exam Level';
    qCount = count;

    // v7.46.0: marathons are Pro-only — belt behind the applyPreset gate so a
    // direct startBulkQuiz() call can't sidestep it. The GAP-2 gates below
    // only matter for Pro edge states now.
    if (typeof _gateProOnly === 'function' && !_gateProOnly('Marathon sets', {
      title: 'Marathon sets are a Pro feature',
      body: 'One marathon burns past the free day’s 15 questions. Pro takes the cap off.'
    })) return;
    // GAP-2: bulk presets previously had no quota gate (free user would 429 mid-run)
    if (!_gateActivityForQuota('practice quizzes')) return;
    if (!_gateSessionSizeForQuota(count, { mode: 'bulk' })) return;

    showPage('loading');
    document.getElementById('loading-msg').textContent = `Generating ${count} mixed Exam Level questions\u2026`;
    const tb = document.getElementById('topic-brief');
    if (tb) tb.classList.add('is-hidden');

    // v4.82.1: smooth loading bar across marathon mode too.
    _loadingProgressBegin('Generating questions\u2026');
    const lbl = document.getElementById('load-progress-label'); // legacy textContent writes for retry banner

    const BATCH_SIZE = 18, MAX_RETRIES = 2;
    const batches = Math.ceil(count / BATCH_SIZE);
    let collected = [];
    try {
      for (let i = 0; i < batches; i++) {
        const remaining = count - collected.length;
        const thisBatch = Math.min(BATCH_SIZE, remaining);
        _loadingProgressUpdate(`Batch ${i + 1} / ${batches}\u2026`, (i / batches) * 100);
        document.getElementById('loading-msg').textContent = `Generating questions (${collected.length + thisBatch} / ${count})\u2026`;
        let batch = null;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            // v4.81.15: pass batch index as staleSliceIdx so each marathon
            // batch sees a different rotating window of stale topics \u2014
            // same rotation amplifier as the exam simulator's 5 batches.
            batch = await fetchQuestions(key, MIXED_TOPIC, 'Exam Level', thisBatch, i);
            break;
          } catch(retryErr) {
            if (attempt === MAX_RETRIES) throw retryErr;
            if (lbl) lbl.textContent = `Batch ${i + 1} failed, retrying (${attempt + 1}/${MAX_RETRIES})\u2026`;
            await new Promise(r => setTimeout(r, 1500));
          }
        }
        collected = collected.concat(batch);
      }
      _loadingProgressUpdate('Verifying quality\u2026', 88);
      document.getElementById('loading-msg').textContent = 'Verifying question accuracy\u2026';
      collected = await aiValidateQuestions(key, collected);
      collected = validateQuestions(collected);
      if (collected.length === 0) throw new Error('All generated questions failed validation. Try again.');
      _loadingProgressUpdate('Finalizing…', 95);
      // Enforce target count — truncate extras from AI
      if (collected.length > count) collected = collected.slice(0, count);
    } catch(e) {
      _loadingProgressFinish();
      showPage('setup');
      errBox.textContent = '\u26a0\ufe0f ' + (e.message || 'Failed. Check your API key.');
      errBox.classList.remove('is-hidden');
      return;
    }
    questions = injectPBQs(collected, MIXED_TOPIC, 2);
    current = 0; score = 0; streak = 0; bestStreak = 0; answered = 0; log = [];
    quizFlags = new Array(questions.length).fill(false);
    // v4.82.1: hide loading bar before swapping to the quiz page.
    _loadingProgressFinish();
    showPage('quiz');
    render();
  }


  async function startSession() {
    const key = document.getElementById('api-key').value.trim();
    const errBox = document.getElementById('setup-err');
    errBox.classList.add('is-hidden');
    const keyErr = validateApiKey(key);
    if (keyErr) { errBox.textContent = keyErr; errBox.classList.remove('is-hidden'); showSetupError(); return; }
    apiKey = key;
    localStorage.setItem(STORAGE.KEY, key);

    sessionMode    = true;
    sessionStep    = 0;
    sessionResults = [];
    sessionPlan    = buildSessionPlan(SESSION_TOPICS);
    examMode       = false;
    wrongDrillMode = false;

    runSessionStep();
  }

  async function runSessionStep() {
    const step  = sessionPlan[sessionStep];
    const sTopic = step.topic;
    activeQuizTopic = sTopic;
    topic = sTopic;

    document.getElementById('load-progress').classList.add('is-hidden');
    showPage('loading');
    document.getElementById('loading-msg').textContent =
      'Session ' + (sessionStep + 1) + '/' + SESSION_TOPICS + ' \u2014 ' + sTopic + '\u2026';

    showCacheNotice(false);
    try {
      questions = await fetchQuestions(apiKey, sTopic, 'Mixed', SESSION_QUESTIONS);
      document.getElementById('loading-msg').textContent = 'Verifying question accuracy\u2026';
      questions = await aiValidateQuestions(apiKey, questions);
      questions = validateQuestions(questions);
      if (questions.length === 0) throw new Error('All generated questions failed validation. Try again.');
    } catch(e) {
      const cached = getCachedQuestions(sTopic, 'Mixed', SESSION_QUESTIONS);
      if (cached) { questions = cached; showCacheNotice(true); }
      else {
        sessionMode = false;
        showPage('setup');
        const err = document.getElementById('setup-err');
        err.textContent = '\u26a0\ufe0f ' + (e.message || 'Failed. Check your API key.');
        err.classList.remove('is-hidden');
        return;
      }
    }
    current = 0; score = 0; streak = 0; bestStreak = 0; answered = 0; log = [];
    quizFlags = new Array(questions.length).fill(false);
    diff = 'Mixed';
    showPage('quiz');
    render();
  }

  function renderSessionTransition() {
    const prev   = sessionResults[sessionResults.length - 1];
    const next   = sessionPlan[sessionStep];
    const color  = prev.pct >= 80 ? 'var(--green)' : prev.pct >= 60 ? 'var(--blue)' : 'var(--red)';
    const emoji  = prev.pct >= 80 ? '\u2705' : prev.pct >= 60 ? '\ud83d\udcaa' : '\ud83d\udcda';

    document.getElementById('st-emoji').textContent   = emoji;
    document.getElementById('st-heading').textContent = 'Topic ' + sessionStep + ' done!';
    document.getElementById('st-sub').textContent     = prev.pct + '% on ' + prev.topic;
    document.getElementById('st-topic-done').textContent = prev.topic;
    document.getElementById('st-pct').textContent    = prev.pct + '%';
    document.getElementById('st-pct').style.color    = color;

    const fill = document.getElementById('st-bar-fill');
    fill.style.width      = prev.pct + '%';
    fill.style.background = color;

    document.getElementById('st-next-topic').textContent  = next.topic;
    document.getElementById('st-next-reason').textContent = next.reason;
    showPage('session-transition');
  }

  function renderSessionComplete() {
    const total    = sessionResults.length;
    const overall  = Math.round(sessionResults.reduce((a, r) => a + r.pct, 0) / total);

    document.getElementById('sc-sub').textContent =
      'Overall ' + overall + '% across ' + total + ' topics';

    const scResults = document.getElementById('sc-results');
    scResults.innerHTML = sessionResults.map(r => {
      const c = r.pct >= 80 ? 'var(--green)' : r.pct >= 60 ? 'var(--blue)' : 'var(--red)';
      return `<div class="session-result-row">
        <div>
          <div class="session-result-topic">${escHtml(r.topic)}</div>
          <div class="session-result-bar"><div class="session-result-fill" style="width:${r.pct}%;background:${c}"></div></div>
        </div>
        <div class="session-result-pct" style="color:${c}">${r.pct}%</div>
      </div>`;
    }).join('');

    showPage('session-complete');
  }

  function endSessionEarly() {
    sessionMode = false;
    sessionPlan = [];
    sessionStep = 0;
    sessionResults = [];
    goSetup();
  }

  // ══════════════════════════════════════════
  // v4.53.0 — EDITORIAL REDESIGN
  // ══════════════════════════════════════════
  // Persistent left sidebar + setup-page focus banner + domain grid.
  // User asked for this after reviewing a Claude Design prototype — kept our
  // brand palette + Inter font + dark/light modes, but adopted the prototype's
  // sidebar IA (Practice / Drills sections) and editorial numbered-section
  // pattern for the setup page.

  // ── Sidebar structure ──
  // Two sections: Practice (core study surfaces) + Drills (muscle-memory reps).
  // Each item carries page-id + handler + optional icon. Active state is synced
  // from showPage() via updateSidebarActiveState().
  // v4.98.6: Practice section is cert-aware so each cert's flagships sit in
  // the top-level practice slot \u2014 Network+ shows TB + ACL (its flagships),
  // Sec+ shows IR War Room + Phishing Triage (its flagships). Previously TB
  // + ACL leaked onto Sec+ because the Practice array was unconditional.
  const APP_SIDEBAR_PRACTICE_BASE = [
    { page: 'setup',             label: 'Home',             icon: '\u2302', handler: () => goSetup() },
    { page: 'progress',          label: 'Progress',         icon: '\u25A4', handler: () => { showPage('progress'); if (typeof renderProgressPage === 'function') renderProgressPage(); } },
    { page: 'analytics',         label: 'Analytics',        icon: '\u25A9', handler: () => { showPage('analytics'); if (typeof renderAnalytics === 'function') renderAnalytics(); } }
  ];
  const APP_SIDEBAR_PRACTICE_NETPLUS_TAIL = [
    // MVP-QUIZ-ONLY (Ship 2): Network Builder v3/v1/v2 sidebar entries removed.
    // TB v3 + Coach v2 preserved on branch feat/tb-v3-coach-v2 via tag
    // tb-v3-coach-v2-snapshot-2026-05-26 for post-MVP reinstatement.
    // MVP-QUIZ-ONLY (Ship 3): 'acl' (ACL Builder flagship) sidebar entry removed.
  ];
  // MVP-QUIZ-ONLY: Sec+ flagship sidebar entries (IRW + PHT) removed.
  // AMM + CTS entries handled in the next AMM/CTS deletion pass.
  const APP_SIDEBAR_PRACTICE_SECPLUS_TAIL = [
  ];
  const APP_SIDEBAR_PRACTICE = [
    ...APP_SIDEBAR_PRACTICE_BASE,
    ...((typeof CURRENT_CERT !== 'undefined' && CURRENT_CERT === 'secplus')
      ? APP_SIDEBAR_PRACTICE_SECPLUS_TAIL
      : APP_SIDEBAR_PRACTICE_NETPLUS_TAIL)
  ];
  // v4.54.1: Settings section (own sidebar section so it's visually separate from study tools)
  const APP_SIDEBAR_SETTINGS = [
    { page: 'settings',          label: 'Settings',         icon: '\u2699', handler: () => { showPage('settings'); if (typeof renderSettingsPage === 'function') renderSettingsPage(); } }
  ];
  // MVP-QUIZ-ONLY (Ships 4+5): all drills deleted (Net+ subnet/ports/acronyms/
  // osi-sorter/cables/network-analysis/packet-trace + Sec+ Acronym Blitz).
  // Empty arrays kept so renderAppSidebar's cert-aware spread still works.
  const APP_SIDEBAR_DRILLS = [];
  const APP_SIDEBAR_DRILLS_SECPLUS = [];

  // Map arbitrary page names to their sidebar highlight target. Quiz/exam/review
  // etc. all highlight "Home" because they're part of the setup\u2192study flow.
  const SIDEBAR_ACTIVE_MAP = {
    'setup': 'setup', 'quiz': 'setup', 'exam': 'setup',
    'results': 'setup', 'exam-results': 'setup', 'review': 'setup',
    'session-transition': 'setup', 'session-complete': 'setup', 'loading': 'setup',
    'progress': 'progress',
    'analytics': 'analytics',
    // MVP-QUIZ-ONLY (Ship 2): 'topology-builder' highlight removed.
    // 'guided-lab' still exists (Topic Deep Dive CLI labs); maps to 'setup' instead.
    'guided-lab': 'setup',
    // MVP-QUIZ-ONLY (Ship 3): 'acl' highlight entry removed.
    // MVP-QUIZ-ONLY (Ships 4+5): drill highlight entries removed (subnet/ports/
    // acronyms/osi-sorter/cables/network-analysis/ptr/drills launcher).
    'topic-dive': 'progress',
    'settings': 'settings'
  };

  // v4.99.86: monoline SVG icons for sidebar nav items (editorial rebrand).
  // Same pattern as _ctsLineIcon / tbPaletteLineIcon — returns a 16x16 SVG string.
  function _sbNavIcon(pageId) {
    var icons = {
      'setup': '<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h10M4 18h7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
      'progress': '<svg viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 14l4-4 4 4 5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      'analytics': '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/></svg>',
      // MVP-QUIZ-ONLY (Ship 2): 'topology-builder' sidebar nav icon removed.
      // MVP-QUIZ-ONLY (Ship 3): 'acl' sidebar nav icon removed.
      // MVP-QUIZ-ONLY (Ship 1): 'irw' + 'pht' sidebar nav icons removed.
      // MVP-QUIZ-ONLY (Ships 4+5): drill sidebar nav icons removed
      // (subnet/ports/acronyms/osi-sorter/cables/network-analysis/ptr).
      'settings': '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z" stroke="currentColor" stroke-width="1.4"/></svg>',
      // MVP-QUIZ-ONLY (Ship 1): 'amm' + 'cts' sidebar nav icons removed.
      // MVP-QUIZ-ONLY (Ship 2): 'topology-builder-v2' nav icon removed.
    };
    return icons[pageId] || '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>';
  }

  // Stash the click handlers on a global so inline onclick="..." can reach them.
  // Not elegant but avoids wiring every button with a JS reference.
  window.__aclSidebarHandlers = {};

  function renderAppSidebar() {
    const el = document.getElementById('app-sidebar');
    if (!el) return;
    // Register handlers keyed by page id, then generate HTML with onclick refs.
    const reg = window.__aclSidebarHandlers;
    // v4.91.0: include Security+ drill list in handler registration so the
    // Acronym Blitz entry's onclick wires up regardless of which cert is
    // active (Network+ AB and Security+ AB share the 'acronyms' page id;
    // the scaffold itself is cert-aware via _USE_SECPLUS_AB).
    [...APP_SIDEBAR_PRACTICE, ...APP_SIDEBAR_DRILLS, ...APP_SIDEBAR_DRILLS_SECPLUS, ...APP_SIDEBAR_SETTINGS].forEach(it => {
      reg[it.page] = it.handler;
    });
    // v4.54.9: sidebar nav-count pills retired per user request \u2014 the numbers
    // weren't actionable; the drill entries read cleaner without them.
    // v4.99.8 — Pro-only locked indicator. Reads PRO_ONLY_PAGES at render time
    // (static); body.is-state-resolved + body.is-pro-tier classes drive visibility
    // dynamically via CSS. Pro users + Pro-tier admins see no locks; Free users
    // and anonymous see 🔒 on every locked entry. The body classes are managed
    // in _renderQuotaChip (signed-in path) + the auth listener SIGNED_OUT branch.
    const renderItem = it => {
      const isLocked = (typeof PRO_ONLY_PAGES !== 'undefined') && PRO_ONLY_PAGES[it.page];
      const lockClass = isLocked ? ' is-pro-only' : '';
      const lockBadge = isLocked
        ? '<span class="sb-item-lock" aria-label="Pro only" title="Pro only">PRO</span>'
        : '';
      return `<button type="button" class="sb-item${lockClass}" data-sb-page="${it.page}" onclick="__aclSidebarHandlers['${it.page}'] && __aclSidebarHandlers['${it.page}']()">
        <span class="sb-item-icon" aria-hidden="true">${_sbNavIcon(it.page)}</span>
        <span class="sb-item-label">${escHtml(it.label)}</span>
        ${lockBadge}
      </button>`;
    };
    // Streak badge in footer — reuses existing getStreak()
    let streakHtml = '';
    // v5.5.8: founder's brand flame (07_study_streak.svg, trimmed —
    // namespaced gradient, no <filter>/<title>/<style> so it is safe to
    // inline: the OTHER flame's internal global .line/.orange CSS would
    // leak). Outline rides currentColor (theme-adaptive); .sb-streak-core
    // carries the brand orange (dg-system.css dims it in the empty state).
    // One const, reused active + empty.
    const streakFlameSvg = '<svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="sbStreakFlame" x1="22" y1="18" x2="106" y2="110" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#E27822"/><stop offset="1" stop-color="#C95500"/></linearGradient></defs><path d="M67 19c12 18-2 29 13 41 5 4 11 10 11 22 0 18-13 31-28 31S35 100 35 82c0-14 8-25 19-34 8-7 11-15 13-29z" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path class="sb-streak-core" d="M66 57c8 10-1 17 8 25 3 3 5 6 5 11 0 9-7 16-16 16s-16-7-16-16c0-8 5-14 11-19 5-5 7-9 8-17z" fill="url(#sbStreakFlame)" stroke="#C95500" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    try {
      const s = (typeof getStreak === 'function') ? getStreak() : { current: 0, best: 0 };
      if (s && s.current >= 1) {
        const _best = (s && typeof s.best === 'number') ? s.best : 0;
        const _streakSub = (_best > s.current) ? `Longest <b>${_best} days</b>` : 'Your best run yet';
        streakHtml = `<button type="button" class="sb-streak sb-streak-active" onclick="goSetup()" title="View full streak history">
          <span class="sb-streak-ico" aria-hidden="true">${streakFlameSvg}</span>
          <span class="sb-streak-text">
            <span class="sb-streak-top"><span class="sb-streak-num">${s.current}</span><span class="sb-streak-label">day streak</span></span>
            <span class="sb-streak-sub">${_streakSub}</span>
          </span>
        </button>`;
      } else {
        streakHtml = `<div class="sb-streak sb-streak-empty">
          <span class="sb-streak-ico" aria-hidden="true">${streakFlameSvg}</span>
          <span class="sb-streak-text">
            <span class="sb-streak-empty-t">Start a streak</span>
            <span class="sb-streak-empty-s">Take your first quiz today</span>
          </span>
        </div>`;
      }
    } catch (_) { streakHtml = ''; }

    // v4.87.3 → v4.87.4: CertAnvil brand architecture — parent product brand
    // is CertAnvil; the active cert (Network+ / Security+) shows as a sub-line.
    // v4.87.4: brand mark upgraded from "CA" text to the M14 hammer + anvil +
    // spark SVG lockup. Tells the full forge story per pixel.
    const certShortLabel = (CERT_PACK && CERT_PACK.meta)
      ? CERT_PACK.meta.name.replace('CompTIA ', '') + ' ' + CERT_PACK.meta.code
      : 'Network+ N10-009';
    // C/A monogram inline SVG: stylised C upper-left, diagonal slash, A lower-right.
    // Stroke-only design per the locked mockup at mockups/certanvil-ca-monogram-concept.html.
    // Uses CSS classes so dg-system.css can theme strokes across dark/light.
    const brandSvg = '<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
      + '<path d="M58 12 C42 6, 16 16, 14 34 C12 52, 22 62, 42 64" class="sb-brand-c" stroke-width="7" stroke-linecap="round"/>'
      + '<line x1="30" y1="84" x2="70" y2="16" class="sb-brand-slash" stroke-width="5" stroke-linecap="round"/>'
      + '<path d="M46 88 L64 50 L82 88 M53 74 L75 74" class="sb-brand-a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
      + '</svg>';
    el.innerHTML = `
      <a class="sb-brand sb-brand-link" href="https://certanvil.com/" title="Back to CertAnvil home">
        <div class="sb-brand-mark" aria-hidden="true">${brandSvg}</div>
        <div class="sb-brand-text">
          <span class="sb-brand-name">CertAnvil</span>
          <span class="sb-brand-cert">${certShortLabel}</span>
          <span class="sb-brand-version">v${typeof APP_VERSION !== 'undefined' ? APP_VERSION : '4.53.0'}</span>
        </div>
      </a>
      <div class="sb-section">
        <div class="sb-section-label">Practice</div>
        ${APP_SIDEBAR_PRACTICE.map(renderItem).join('')}
      </div>
      ${/* MVP-quiz-only: Drills sidebar section hidden — all drills deleted */ ''}
      <div class="sb-section">
        <div class="sb-section-label">Account</div>
        ${APP_SIDEBAR_SETTINGS.map(renderItem).join('')}
      </div>
      <div class="sb-foot">${streakHtml}</div>`;
    // Initial active-state sync
    const active = document.querySelector('.page.active');
    if (active) {
      const pageName = active.id.replace(/^page-/, '');
      updateSidebarActiveState(pageName);
    }
  }

  function updateSidebarActiveState(pageName) {
    const target = SIDEBAR_ACTIVE_MAP[pageName] || pageName;
    document.querySelectorAll('.sb-item').forEach(btn => {
      btn.classList.toggle('sb-item-active', btn.getAttribute('data-sb-page') === target);
    });
  }

  function toggleSidebarMobile() {
    const open = document.body.classList.toggle('sidebar-open');
    // v4.79.0: a11y polish per Codex round-3 — when the mobile nav is
    // closed, mark the sidebar `inert` so screen readers + keyboard nav
    // skip the off-screen drawer entirely. When open, remove inert so
    // assistive tech can focus the drawer's links.
    const sb = document.getElementById('app-sidebar');
    if (sb) {
      if (open) {
        sb.removeAttribute('inert');
        sb.setAttribute('aria-hidden', 'false');
      } else {
        // On wide viewports the sidebar is always visible — only set inert
        // when we're actually in the mobile drawer regime (<768px).
        // v4.99.47 Phase 7: lowered from 900→768 to align with the CSS
        // breakpoint that pins the sidebar starting at iPad portrait.
        if (window.innerWidth < 768) {
          sb.setAttribute('inert', '');
          sb.setAttribute('aria-hidden', 'true');
        }
      }
    }
    // Sync the toggle button's aria-expanded
    const tgl = document.getElementById('sb-mobile-toggle');
    if (tgl) tgl.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  // v4.79.0: initial a11y state for the mobile sidebar — mark it inert on
  // load if we're in the mobile-drawer regime. Re-evaluates on resize so
  // switching from mobile to desktop properly removes inert.
  // v4.99.47 Phase 7: breakpoint lowered to <768 so iPad portrait keeps
  // sidebar visible + interactive (no inert/aria-hidden treatment).
  function _syncSidebarA11y() {
    const sb = document.getElementById('app-sidebar');
    if (!sb) return;
    const isMobile = window.innerWidth < 768;
    const isOpen = document.body.classList.contains('sidebar-open');
    if (isMobile && !isOpen) {
      sb.setAttribute('inert', '');
      sb.setAttribute('aria-hidden', 'true');
    } else {
      sb.removeAttribute('inert');
      sb.setAttribute('aria-hidden', 'false');
    }
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => { try { _syncSidebarA11y(); } catch (_) {} });
    window.addEventListener('resize', () => { try { _syncSidebarA11y(); } catch (_) {} });
  }


  // ══════════════════════════════════════════
  // v4.54.0 \u2014 Editorial hero + top bar + sidebar collapse
  // ══════════════════════════════════════════

  // ── Top bar ──
  // Updated breadcrumb on every page change + live clock + theme toggle that mirrors state.
  // The top bar is persistent across all pages.
  const TOPBAR_CRUMBS = {
    'setup': 'Home',
    'quiz': 'Home / Quiz Session',
    'exam': 'Home / Exam Simulation',
    'review': 'Home / Review',
    'results': 'Home / Quiz Session / Results',
    'exam-results': 'Home / Exam Simulation / Results',
    'session-transition': 'Home / Study Plan',
    'session-complete': 'Home / Study Plan / Complete',
    'loading': 'Home / Loading',
    'progress': 'Progress',
    'analytics': 'Analytics',
    // MVP-QUIZ-ONLY (Ship 2): 'topology-builder' crumb removed.
    'guided-lab': 'Topic Deep Dive / Lab',  // CLI lab (ipconfig/ping/etc) from Topic Deep Dive
    'topic-dive': 'Progress / Topic Dive',
    // MVP-QUIZ-ONLY (Ship 3): 'acl' crumb label removed.
    // MVP-QUIZ-ONLY (Ships 4+5): drill crumb labels removed
    // (subnet/ports/acronyms/osi-sorter/cables/network-analysis/ptr/drills).
    'settings': 'Settings',
    'monitor': 'Production Monitor'
  };

  function updateTopbarCrumb(pageName) {
    const el = document.getElementById('topbar-crumb');
    if (!el) return;
    el.textContent = TOPBAR_CRUMBS[pageName] || pageName;
  }

  function _topbarTick() {
    const el = document.getElementById('topbar-time');
    if (!el) return;
    const d = new Date();
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const day = days[d.getDay()];
    const h = d.getHours();
    const m = d.getMinutes();
    const hour12 = ((h + 11) % 12) + 1;
    const suffix = h >= 12 ? 'pm' : 'am';
    el.textContent = `${day} \u00B7 ${hour12}:${m.toString().padStart(2, '0')}${suffix}`;
    // v4.54.17: also refresh the exam countdown chip (so crossing midnight
    // decrements the day count without a page reload).
    if (typeof renderTopbarCountdown === 'function') renderTopbarCountdown();
  }

  // v4.89.7: populate the topbar version pill once on init. Static contract \u2014
  // reads APP_VERSION (which the bump-version script keeps in lockstep with
  // every other surface). Mirrors the landing's #foot-version setup.
  function _renderTopbarVersionPill() {
    const el = document.getElementById('topbar-version-pill');
    if (!el) return;
    const v = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : '';
    if (!v) return;
    el.textContent = 'v' + v;
  }

  // v4.54.17: persistent exam countdown chip in the topbar. Hidden until the
  // user sets a date. Mirrors the urgency tiers used in .ana-ready-datechip.
  // v4.54.17: end-of-day recap. Shown once per calendar day when the user
  // finishes a quiz that pushes them past their daily goal for the first
  // time. Pulls today's + yesterday's stats from loadHistory().
  const STORAGE_DAILY_RECAP_SHOWN = 'nplus_daily_recap_shown';
  function _maybeShowDailyRecap() {
    try {
      const h = (typeof loadHistory === 'function') ? loadHistory() : [];
      const goal = (typeof getDailyGoal === 'function') ? getDailyGoal() : 20;
      const todayKey = new Date().toISOString().slice(0, 10);
      const shown = localStorage.getItem(STORAGE_DAILY_RECAP_SHOWN);
      if (shown === todayKey) return; // already shown today
      // Sum today's questions (exclude wrong-bank drills since they're reviews)
      let todayQ = 0, todayScore = 0, todayCount = 0;
      let yesterdayQ = 0, yesterdayScore = 0;
      const yesterdayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      h.forEach(e => {
        const k = new Date(e.date).toISOString().slice(0, 10);
        if (k === todayKey) { todayQ += (e.total || 0); todayScore += (e.score || 0); todayCount += 1; }
        else if (k === yesterdayKey) { yesterdayQ += (e.total || 0); yesterdayScore += (e.score || 0); }
      });
      if (todayQ < goal) return; // not yet at the goal
      localStorage.setItem(STORAGE_DAILY_RECAP_SHOWN, todayKey);

      const todayAcc = todayQ > 0 ? Math.round(todayScore / todayQ * 100) : 0;
      const yesterdayAcc = yesterdayQ > 0 ? Math.round(yesterdayScore / yesterdayQ * 100) : null;
      const deltaAcc = (yesterdayAcc !== null) ? (todayAcc - yesterdayAcc) : null;
      let streak = 0;
      try { streak = (typeof getStreak === 'function') ? (getStreak().current || 0) : 0; } catch (_) {}
      const daysToExam = (typeof getDaysToExam === 'function') ? getDaysToExam() : null;

      const deltaHtml = deltaAcc === null
        ? '<span class="dr-stat-delta dr-stat-delta-neutral">new baseline</span>'
        : deltaAcc > 0
          ? `<span class="dr-stat-delta dr-stat-delta-up">\u2191 ${deltaAcc} pts</span>`
          : deltaAcc < 0
            ? `<span class="dr-stat-delta dr-stat-delta-down">\u2193 ${Math.abs(deltaAcc)} pts</span>`
            : '<span class="dr-stat-delta dr-stat-delta-neutral">\u2194 flat</span>';
      const examRow = (daysToExam !== null && daysToExam >= 0)
        ? `<div class="dr-stat-row"><span class="dr-stat-k">Days to exam</span><span class="dr-stat-v">${daysToExam}</span></div>`
        : '';
      const stats = `
        <div class="dr-stat-row"><span class="dr-stat-k">Questions today</span><span class="dr-stat-v"><strong>${todayQ}</strong> of ${goal} goal</span></div>
        <div class="dr-stat-row"><span class="dr-stat-k">Accuracy today</span><span class="dr-stat-v"><strong>${todayAcc}%</strong> ${deltaHtml}</span></div>
        <div class="dr-stat-row"><span class="dr-stat-k">Sessions</span><span class="dr-stat-v">${todayCount}</span></div>
        <div class="dr-stat-row"><span class="dr-stat-k">Current streak</span><span class="dr-stat-v">${streak} day${streak === 1 ? '' : 's'}</span></div>
        ${examRow}
      `;
      const statsEl = document.getElementById('dr-stats');
      const eyebrowEl = document.getElementById('dr-eyebrow');
      if (statsEl) statsEl.innerHTML = stats;
      if (eyebrowEl) eyebrowEl.textContent = `Day \u00b7 ${todayQ}Q logged`;
      const modal = document.getElementById('daily-recap-modal');
      if (modal) {
        modal.hidden = false;
        modal.classList.add('daily-recap-modal-visible');
      }
    } catch (e) {
      console.warn('[daily recap]', e && e.message);
    }
  }
  function dismissDailyRecap() {
    const modal = document.getElementById('daily-recap-modal');
    if (!modal) return;
    modal.hidden = true;
    modal.classList.remove('daily-recap-modal-visible');
  }

  // #acl-hint-modal close handler (its onclick referenced this; was undefined →
  // ReferenceError left the modal stuck). Same dismiss shape as dismissDailyRecap.
  function dismissHintModal() {
    const modal = document.getElementById('acl-hint-modal');
    if (!modal) return;
    modal.hidden = true;
    modal.classList.remove('daily-recap-modal-visible');
  }

  function renderTopbarCountdown() {
    const btn = document.getElementById('topbar-countdown');
    const val = document.getElementById('topbar-countdown-val');
    if (!btn || !val) return;
    const dateStr = (typeof getExamDate === 'function') ? getExamDate() : '';
    const days = (typeof getDaysToExam === 'function') ? getDaysToExam() : null;
    if (!dateStr) {
      btn.classList.add('is-hidden');
      return;
    }
    btn.classList.remove('is-hidden');
    // Urgency tier + icon
    btn.classList.remove('topbar-countdown-urgent', 'topbar-countdown-soon', 'topbar-countdown-ok', 'topbar-countdown-past');
    if (days === null || days > 30) { btn.classList.add('topbar-countdown-ok'); }
    else if (days > 7) { btn.classList.add('topbar-countdown-soon'); }
    else if (days > 0) { btn.classList.add('topbar-countdown-urgent'); }
    else if (days === 0) { btn.classList.add('topbar-countdown-urgent'); }
    else { btn.classList.add('topbar-countdown-past'); }
    // Value label
    if (days === null) val.textContent = '\u2014';
    else if (days === 0) val.textContent = 'Today';
    else if (days > 0) val.textContent = `${days}d`;
    else val.textContent = `+${Math.abs(days)}d`;
    // Tooltip
    const dateLabel = new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    btn.title = `Exam: ${dateLabel}`;
  }
  let _topbarTickInterval = null;
  function _topbarStartClock() {
    if (_topbarTickInterval) return;
    _topbarTick();
    // v4.89.7: populate the version pill on first clock tick (cheap; reads
    // APP_VERSION const, no async). Runs once per page load — pill is static.
    _renderTopbarVersionPill();
    _topbarTickInterval = setInterval(_topbarTick, 30000); // refresh every 30s
  }

  // v4.54.1: Settings is its own page now — topbar gear button navigates there.

  // v4.54.1: Settings page render (updates the wrong-bank count badge).
  // Inputs (#api-key + Export/Import) are stateless and just work.

  // v4.81.11: Study Setup Health card (Codex r9 #5) — top-of-Settings
  // status panel. Read-only. 5 rows:
  //   • API key      — connected (sk-ant-…XXXX) / not set
  //   • Exam date    — set + days-away / not set
  //   • Daily goal   — N questions/day / not set
  //   • Auto-backup  — last snapshot timestamp / no backups yet
  //   • Today        — N/goal questions answered today (% complete)
  // Each row has a status icon (✓ green / ⚠ amber / ✗ red).

  // v4.54.16: render the exam-date chip on the Settings page. Reuses the
  // same `_buildExamDateChipHtml` helper that Home + Analytics use, so the
  // chip styling + urgency tiers (urgent/soon/ok/past) + clear-\u00d7 affordance
  // are identical across all three surfaces.
  function syncSettingsExamDate() {
    const row = document.getElementById('settings-exam-row');
    if (!row) return;
    const dateStr = (typeof getExamDate === 'function') ? getExamDate() : '';
    const days = (typeof getDaysToExam === 'function') ? getDaysToExam() : null;
    if (typeof _buildExamDateChipHtml === 'function') {
      row.innerHTML = _buildExamDateChipHtml(dateStr, days, 'settings-exam-input');
    }
  }

  // v4.54.10 \u2014 Daily Goal editor on Settings page

  // #8: Daily Review (spaced repetition) settings — session size + top-up.

  // ── GAP-6 (v7.45.0): in-app account deletion (Apple 5.1.1(v)) ───────────
  // Settings danger-zone row, signed-in users only. Same 7-day-grace
  // mechanism as the /account danger zone: stamps
  // profiles.metadata.deletion_requested_at, then signs the user out.
  // Mockup: onboarding-account-deletion.html (row → honest confirm sheet
  // with type-your-email → deleting state → goodbye).


  function _confirmDeleteAccount(modal, userId) {
    var sb = window.certanvilSupabase;
    if (!sb) return;
    var card = modal.querySelector('.dla-card');
    if (card) {
      card.innerHTML =
        '<h2 class="dlpb-title">Deleting your account&hellip;</h2>' +
        '<p class="dlpb-lede">Scheduling removal. This takes a moment.</p>';
    }
    // Read metadata fresh so we don't clobber keys written since page load
    // (cloud-store debounce flushes into the same jsonb column).
    sb.from('profiles').select('metadata').eq('id', userId).single().then(function (pr) {
      var meta = (pr && pr.data && pr.data.metadata) || {};
      var nextMeta = Object.assign({}, meta, { deletion_requested_at: new Date().toISOString() });
      return sb.from('profiles').update({ metadata: nextMeta }).eq('id', userId);
    }).then(function (r) {
      if (r && r.error) throw r.error;
      return sb.auth.signOut();
    }).then(function () {
      if (card) {
        card.innerHTML =
          '<h2 class="dlpb-title">Account scheduled for deletion</h2>' +
          '<p class="dlpb-lede">You&rsquo;re signed out. Sign back in within <b>7 days</b> if you change your mind &mdash; after that, your data is permanently purged.</p>' +
          '<div class="dlpb-actions"><button type="button" class="dlpb-ghost" id="dla-done">Done</button></div>';
        var done = document.getElementById('dla-done');
        if (done) done.addEventListener('click', function () { modal.remove(); window.location.reload(); });
      }
    }).catch(function () {
      if (card) {
        card.innerHTML =
          '<h2 class="dlpb-title">Couldn&rsquo;t schedule deletion</h2>' +
          '<p class="dlpb-lede">Something went wrong on our side. Nothing was deleted &mdash; try again in a minute.</p>' +
          '<div class="dlpb-actions"><button type="button" class="dlpb-ghost" id="dla-err-close">Close</button></div>';
        var closeBtn = document.getElementById('dla-err-close');
        if (closeBtn) closeBtn.addEventListener('click', function () { modal.remove(); });
      }
    });
  }

  // ── Sidebar collapse ──
  const STORAGE_SIDEBAR_COLLAPSED = 'nplus_sidebar_collapsed';
  function toggleSidebarCollapsed() {
    const collapsed = document.body.classList.toggle('sidebar-collapsed');
    try { localStorage.setItem(STORAGE_SIDEBAR_COLLAPSED, collapsed ? '1' : '0'); } catch (_) {}
    // Also close mobile drawer if somehow open
    document.body.classList.remove('sidebar-open');
    const btn = document.getElementById('topbar-toggle');
    if (btn) btn.setAttribute('aria-pressed', String(collapsed));
  }
  function _initSidebarCollapsed() {
    try {
      if (localStorage.getItem(STORAGE_SIDEBAR_COLLAPSED) === '1') {
        document.body.classList.add('sidebar-collapsed');
      }
    } catch (_) {}
  }

  // ── Hero v2: display heading + lede + dark readiness card + mini cards ──
  function renderHeroV2() {
    // Enable the v2 layout styles (hides legacy hero + old readiness-card + old daily-goal-card)
    document.body.classList.add('hero-v2-active');

    // ── Eyebrow: "TUESDAY \u00B7 APRIL 18 \u00B7 4:18PM" ──
    const eb = document.getElementById('hero-v2-eyebrow');
    if (eb) {
      const d = new Date();
      const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const h = d.getHours();
      const m = d.getMinutes();
      const hour12 = ((h + 11) % 12) + 1;
      const suffix = h >= 12 ? 'PM' : 'AM';
      eb.textContent = `${dayNames[d.getDay()].toUpperCase()} \u00B7 ${monthNames[d.getMonth()].toUpperCase()} ${d.getDate()} \u00B7 ${hour12}:${m.toString().padStart(2, '0')}${suffix}`;
    }

    // ── Display heading: greeting + name ──
    // v4.99.18 — display name now per-user (set via /account "Display name" field).
    // Resolution chain: window._certanvilDisplayName (set by auth-state.js after
    // profile fetch) → localStorage cache (set by previous session for fast first-paint)
    // → email-prefix (signed-in but profile not fetched yet) → "there" (anonymous fallback).
    // Listens for 'certanvil:display-name-resolved' event so name updates if it
    // lands after first paint.
    const disp = document.getElementById('hero-v2-display');
    if (disp) {
      const renderGreeting = () => {
        const hour = new Date().getHours();
        const greeting = hour < 5 ? 'Working late' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Working late';
        let name = 'there';
        try {
          if (window._certanvilDisplayName) {
            name = String(window._certanvilDisplayName).slice(0, 60);
          } else {
            const cached = localStorage.getItem('certanvil_display_name_cache');
            if (cached) name = String(cached).slice(0, 60);
          }
        } catch (_) {}
        // Escape name to prevent XSS via the user-controlled display_name field
        const safeName = (typeof escHtml === 'function') ? escHtml(name) : name;
        disp.innerHTML = `${greeting}, <span class="name">${safeName}.</span>`;
      };
      renderGreeting();
      // Re-render once auth-state.js resolves the profile (in case first paint
      // showed the cached / email-prefix name and the actual display_name differs)
      window.addEventListener('certanvil:display-name-resolved', renderGreeting);
    }

    // ── Lede paragraph: data-driven (weakest topics) or friendly fallback ──
    const lede = document.getElementById('hero-v2-lede');
    if (lede) {
      const history = (typeof loadHistory === 'function') ? loadHistory() : [];
      if (history.length === 0) {
        lede.innerHTML = `Complete your first quiz to activate your readiness score. <strong>Fifteen focused minutes</strong> now compounds more than an hour tomorrow.`;
      } else {
        let weakInline = '';
        try {
          if (typeof computeWeakSpotScores === 'function') {
            // v5.5.7: cert-scope. Quiz history is global per user but topics
            // belong to a specific cert. Mirror the v4.99.26 buildSessionPlan
            // filter so the lede never names a wrong-cert topic (was leaking
            // N10-009 topics like "Cable Issues" while in Security+ mode).
            const weak = (computeWeakSpotScores() || []).filter(w => w && _isCurrentCertTopic(w.topic));
            if (weak && weak.length >= 2) {
              weakInline = `Yesterday you wobbled on <strong>${escHtml(weak[0].topic)}</strong> and <strong>${escHtml(weak[1].topic)}</strong>. `;
            } else if (weak && weak.length === 1) {
              weakInline = `Your weakest area right now is <strong>${escHtml(weak[0].topic)}</strong>. `;
            }
          }
        } catch (_) {}
        lede.innerHTML = `${weakInline}Fifteen focused minutes now would lift your readiness to the pass line.`;
      }
    }

    // KEEPER readiness hero (lives in bento .cell-hero; unchanged).
    // #138 wave 7: typeof guard — features/readiness.js may not have loaded at _v454Init time.
    if (typeof renderReadinessCardV2 === 'function') renderReadinessCardV2();

    // Today + Streak mini-cards now write to hidden legacy #mc-* stubs (kept
    // callable); the bento momentum cell is the live surface.
    renderHeroV2MiniCards();

    // v7.17.0 Bento board population (mockup-3 port). Each helper wires a tile's
    // real ids to real data; the real onclick actions are baked into the markup.
    try { renderBentoTopbar(); } catch (_) {}
    try { renderBentoRecommended(); } catch (_) {}
    try { renderBentoMomentum(); } catch (_) {}
    try { renderBentoQuickStart(); } catch (_) {}
    try { renderBentoDomains(); } catch (_) {}
  }

  // v7.17.0 — HOME BENTO BOARD renderers (faithful port of mockup-3-bento.html).
  // Populate the bento tiles in #page-setup with real data + real actions.
  // Motion is CSS-driven; JS sets initial inline values, animates via class/
  // transition + a textContent count-up (mockup countUp + setTimeout(dur+90)
  // settle). No per-frame inline-style rAF loops (tech-debt cap honoured).

  // Mockup-faithful count-up: writes textContent each frame, settles at dur+90ms.
  function _bentoCountUp(id, to, dur) {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { el.textContent = to; return; }
    const st = performance.now();
    (function step(n) {
      const t = Math.min((n - st) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    })(st);
    setTimeout(function () { el.textContent = to; }, dur + 90);
  }

  // TOP BAR — cert name + code (CERT_PACK.meta), days-to-exam + streak chips.
  // (Theme toggle dropped; the app topbar #topbar-theme already owns it.)
  function renderBentoTopbar() {
    try {
      const certEl = document.getElementById('cb-cert');
      if (certEl) {
        const name = (typeof CERT_PACK === 'object' && CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.name) ? CERT_PACK.meta.name : 'CompTIA Network+';
        const code = (typeof CERT_CODE !== 'undefined' && CERT_CODE) ? CERT_CODE : 'N10-009';
        // Drop vendor prefix for a tighter eyebrow; keep the code in <b>.
        // v7.89.0 (Lighthouse-90 TASK 1): the inline synchronous script beside
        // #cb-cert in index.html now already paints this exact markup from
        // data-cert at parse time — guard so a matching value is a no-op
        // (avoids a redundant late DOM write on top of the correct static text).
        const html = `${escHtml(String(name).replace(/^(CompTIA|Microsoft|Amazon|AWS)\s+/, ''))} <b>${escHtml(code)}</b>`;
        if (certEl.innerHTML !== html) certEl.innerHTML = html;
      }
      const daysEl = document.getElementById('cb-days');
      if (daysEl) {
        const d = (typeof getDaysToExam === 'function') ? getDaysToExam() : null;
        if (typeof d === 'number' && d >= 0) _bentoCountUp('cb-days', d, 900);
        else daysEl.textContent = '—';
      }
      const streakEl = document.getElementById('cb-streak');
      if (streakEl && typeof getStreak === 'function') {
        const s = getStreak();
        _bentoCountUp('cb-streak', (s && s.current) ? s.current : 0, 900);
      }
    } catch (_) {}
  }

  // #6 — the home mini-forecast lives in a slim strip directly beneath the
  // Recommended-next tile, shown only when SR cards are due (driven by
  // renderBentoRecommended). #sr-review-card is a hidden legacy stub.
  function _renderHomeForecast(show) {
    const el = document.getElementById('sr-forecast-home');
    if (!el) return;
    if (show && typeof renderSrForecast === 'function') {
      renderSrForecast(el, { compact: true, eyebrow: 'Coming up · next 7 days' });
      el.hidden = false;
    } else {
      el.hidden = true;
      el.innerHTML = '';
    }
  }

  // RECOMMENDED-NEXT tile — the focused preset (onclick=applyPreset('focused')
  // baked into markup). Meta nods to the weakest topic when readiness has one.
  function renderBentoRecommended() {
    const minEl = document.getElementById('pl-min');
    const titleEl = document.getElementById('pl-title');
    const metaEl = document.getElementById('pl-meta');
    const launchEl = document.getElementById('primaryLaunch');

    // v7.17.0: when spaced-repetition cards are due, the recommend tile becomes
    // the SR-review entry. The old #sr-review-card home prompt + Next-Best-Move
    // CTA are hidden legacy stubs in the bento, so this cell is the only home
    // surface that can launch a review. "Recommended next" should lead with
    // overdue reviews over a fresh weak-spots set. We override the click handler
    // via the .onclick PROPERTY (the static onclick="applyPreset('focused')"
    // attribute stays in the markup as the not-due default + UAT contract).
    let srDue = 0;
    try {
      if (typeof getSrStats === 'function') {
        const s = getSrStats();
        srDue = (s && typeof s.due === 'number') ? s.due : 0;
      }
    } catch (_) { srDue = 0; }

    if (srDue > 0) {
      const cap = (typeof SR_SESSION_CAP === 'number') ? SR_SESSION_CAP : srDue;
      const sessionN = Math.min(srDue, cap);
      const mins = Math.max(2, Math.round(sessionN * 0.5));
      if (minEl) minEl.textContent = String(mins);
      if (titleEl) titleEl.textContent = srDue === 1 ? 'Review 1 card' : `Review ${srDue} cards`;
      if (metaEl) {
        metaEl.textContent = srDue > cap
          ? `spaced repetition · ${cap} of ${srDue} due now`
          : 'spaced repetition · re-encounter what you forgot';
      }
      if (launchEl) launchEl.onclick = function () { if (typeof startSrReview === 'function') startSrReview(); };
      _renderHomeForecast(true);   // #6 — slim 7-day strip under the tile
      return;
    }

    _renderHomeForecast(false);    // #6 — no reviews due, hide the strip

    // v7.x: new user has no weak-spot data — show a friendly first-quiz CTA instead.
    // v7.89.0 (Lighthouse-90 TASK 2): index.html's static #pl-* defaults now
    // ALREADY carry this exact copy (the anonymous/fresh-visitor default —
    // matches what Lighthouse's clean profile and most real first-time users
    // see), so guard each write with a same-value check. Assigning identical
    // textContent still replaces the text node and was re-flagging span.rc-body
    // as a fresh LCP paint candidate at whatever point in the ~15-script defer
    // chain features/home.js happened to run — measured locally as ~100% of
    // LCP being pure render-delay on already-visible, unchanged text.
    const _isNewUser = (typeof loadHistory === 'function') && loadHistory().length === 0;
    if (_isNewUser) {
      if (minEl && minEl.textContent !== '10') minEl.textContent = '10';
      if (titleEl && titleEl.textContent !== 'Start your first quiz') titleEl.textContent = 'Start your first quiz';
      if (metaEl && metaEl.textContent !== '10 questions · easy mix · ~10 min') metaEl.textContent = '10 questions · easy mix · ~10 min';
      if (launchEl) launchEl.onclick = function () {
        if (typeof applyPreset === 'function') {
          // v7.x: first-ever quiz is a gentle 10-Q mixed Foundational warm-up (no
          // weak-spot data yet, and Exam Level is discouraging on question one).
          // Set globals then call startQuiz directly (same path applyPreset uses).
          topic = MIXED_TOPIC; diff = 'Foundational'; qCount = 10;
          document.querySelectorAll('#topic-group .chip').forEach(function (c) { c.classList.toggle('on', c.dataset.v === topic); });
          document.querySelectorAll('#diff-group .chip').forEach(function (c) { c.classList.toggle('on', c.dataset.v === diff); });
          document.querySelectorAll('#count-group .chip').forEach(function (c) { c.classList.toggle('on', c.dataset.v === String(qCount)); });
          if (typeof syncChipAriaPressed === 'function') { syncChipAriaPressed('#topic-group'); syncChipAriaPressed('#diff-group'); syncChipAriaPressed('#count-group'); }
          if (typeof startQuiz === 'function') startQuiz();
        }
      };
      return;
    }

    if (minEl) minEl.textContent = '15';
    if (titleEl) titleEl.textContent = '15-min Weak Spots';
    if (metaEl) {
      let meta = '10 questions, exam level, your weakest topic';
      try {
        const r = (typeof getReadinessScore === 'function') ? getReadinessScore() : null;
        if (r && Array.isArray(r.whatIf) && r.whatIf.length && r.whatIf[0].topic) {
          meta = `10 questions, exam level · ${r.whatIf[0].topic}`;
        }
      } catch (_) {}
      metaEl.textContent = meta;
    }
    if (launchEl) launchEl.onclick = function () { if (typeof applyPreset === 'function') applyPreset('focused'); };
  }

  // MOMENTUM tile — today done/goal + streak + ring + resume context. Ring fill
  // and count-ups gate on scroll-into-view (mockup IntersectionObserver).
  function renderBentoMomentum() {
    const done = (typeof getTodayQuestionCount === 'function') ? getTodayQuestionCount() : 0;
    const goal = (typeof getDailyGoal === 'function') ? getDailyGoal() : 20;
    const s = (typeof getStreak === 'function') ? getStreak() : { current: 0, best: 0 };
    const cur = (s && s.current) ? s.current : 0;
    const best = (s && s.best) ? s.best : 0;
    const pct = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0;

    const goalEl = document.getElementById('moGoal'); if (goalEl) goalEl.textContent = goal;
    const bestEl = document.getElementById('moBest'); if (bestEl) bestEl.textContent = best;

    // Resume context: top weak/stale plan item, else a today/fresh fallback.
    const resumeEl = document.getElementById('moResume');
    if (resumeEl) {
      let ctx = '';
      try {
        const plan = (typeof buildSessionPlan === 'function') ? buildSessionPlan(1) : null;
        if (plan && plan[0] && plan[0].topic) {
          ctx = `<b>Pick up:</b> ${escHtml(plan[0].topic)} · ${escHtml(plan[0].meta || plan[0].reason || '')}`.replace(/\s*·\s*$/, '') + '.';
        }
      } catch (_) {}
      if (!ctx) ctx = done > 0 ? `<b>Pick up:</b> ${done} of ${goal} done today.` : '<b>Start fresh:</b> a quick warmup keeps the streak.';
      resumeEl.innerHTML = ctx;
    }

    const moFill = document.getElementById('moFill');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const C = 2 * Math.PI * 31;
    // Use setProperty (CSS transitions the stroke-dashoffset) — no per-frame loop.
    if (moFill) { moFill.style.setProperty('stroke-dasharray', C); moFill.style.setProperty('stroke-dashoffset', C); }

    const fill = () => {
      _bentoCountUp('moDone', done, 900);
      _bentoCountUp('moStreak', cur, 900);
      _bentoCountUp('moPct', pct, 1000);
      if (moFill) moFill.style.setProperty('stroke-dashoffset', C * (1 - pct / 100));
    };

    if (reduce || !moFill) {
      const d = document.getElementById('moDone'); if (d) d.textContent = done;
      const st = document.getElementById('moStreak'); if (st) st.textContent = cur;
      const p = document.getElementById('moPct'); if (p) p.textContent = pct;
      if (moFill) moFill.style.setProperty('stroke-dashoffset', C * (1 - pct / 100));
      return;
    }
    const host = moFill.closest('.tile') || moFill;
    try {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { fill(); io.disconnect(); }
      }), { threshold: 0.4 });
      io.observe(host);
    } catch (_) { fill(); }
  }

  // QUICK-START tile — reveal Drill Mistakes only when the wrong bank is non-empty
  // (mockup hides at zero) + show real count. Warmup/Daily onclicks in markup.
  function renderBentoQuickStart() {
    try {
      const opt = document.getElementById('bento-wrong-opt');
      const sub = document.getElementById('bento-wrong-sub');
      if (!opt) return;
      const bank = (typeof loadWrongBank === 'function') ? loadWrongBank() : [];
      const n = Array.isArray(bank) ? bank.length : 0;
      if (n > 0) {
        if (sub) sub.textContent = `${n} wrong answer${n === 1 ? '' : 's'} saved`;
        opt.classList.remove('is-hidden');
      } else {
        opt.classList.add('is-hidden');
      }
    } catch (_) {}
  }

  // DOMAIN quick-pick tile — 5 domains. Weights from DOMAIN_WEIGHTS; mastery
  // aggregated exactly as renderSetupDomainGrid (sum score/total over history via
  // TOPIC_DOMAINS). Each → applyDomainPreset(key). Bars reveal on scroll-in.
  function renderBentoDomains() {
    const grid = document.getElementById('domainGrid');
    if (!grid) return;
    const order = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS) ? Object.keys(DOMAIN_WEIGHTS) : ['concepts', 'implementation', 'operations', 'security', 'troubleshooting'];
    // Aggregate mastery per domain — same shape as renderSetupDomainGrid.
    const history = (typeof loadHistory === 'function') ? loadHistory() : [];
    const stats = {};
    order.forEach(d => { stats[d] = { score: 0, total: 0 }; });
    history.forEach(e => {
      const dk = (typeof TOPIC_DOMAINS !== 'undefined') ? TOPIC_DOMAINS[e.topic] : null;
      if (!dk || !stats[dk]) return;
      stats[dk].score += e.score || 0;
      stats[dk].total += e.total || 0;
    });

    const labels = (typeof DOMAIN_LABELS === 'object' && DOMAIN_LABELS) ? DOMAIN_LABELS : {};
    const html = order.map((dk, i) => {
      const weight = Math.round(((DOMAIN_WEIGHTS && DOMAIN_WEIGHTS[dk]) || 0) * 100);
      const mastery = stats[dk].total > 0 ? Math.round((stats[dk].score / stats[dk].total) * 100) : 0;
      const name = labels[dk] || dk;
      const weak = mastery > 0 && mastery < 50 ? ' weak' : '';
      return `<button type="button" class="ld${weak}" onclick="applyDomainPreset('${String(dk).replace(/'/g, "\\'")}')">`
        + `<span class="ld-k">${i + 1}.0 &middot; ${weight}%</span>`
        + `<span class="ld-n">${escHtml(name)}</span>`
        + `<span class="ld-bar"><i data-w="${mastery}" style="width:0%"></i></span>`
        + `<span class="ld-m"><span>10 Qs</span><b>${mastery}%</b></span>`
        + `</button>`;
    }).join('');
    grid.innerHTML = html;

    // Animate bars to their width on scroll-into-view (CSS transitions the width;
    // we only flip the initial inline 0% → data-w%). Reduced-motion: set directly.
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bars = grid.querySelectorAll('.ld-bar i');
    // setProperty (CSS transitions width) — flips initial 0% → data-w%, no rAF.
    const paint = () => bars.forEach(i => i.style.setProperty('width', (i.dataset.w || 0) + '%'));
    if (reduce) { paint(); return; }
    try {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { paint(); io.disconnect(); }
      }), { threshold: 0.3 });
      io.observe(grid);
    } catch (_) { paint(); }
  }


  function renderHeroV2MiniCards() {
    // Today — pull from daily-goal helpers (existing v4.42.x infra)
    try {
      const doneEl = document.getElementById('mc-today-done');
      const goalEl = document.getElementById('mc-today-goal');
      const subEl = document.getElementById('mc-today-sub');
      if (doneEl && goalEl && subEl && typeof getDailyGoal === 'function') {
        const dg = getDailyGoal();
        const done = (typeof getTodayQuestionCount === 'function') ? getTodayQuestionCount() : 0;
        doneEl.textContent = done;
        goalEl.textContent = dg;
        const pct = dg > 0 ? Math.round((done / dg) * 100) : 0;
        subEl.textContent = `daily goal \u00B7 ${Math.min(100, pct)}%`;
        // v7.13.0: ease-out count-up (textContent above stays the fallback)
        if (typeof animateCount === 'function') animateCount('mc-today-done', 0, done, 700);
      }
    } catch (_) {}

    // Streak
    try {
      const numEl = document.getElementById('mc-streak-num');
      const subEl = document.getElementById('mc-streak-sub');
      if (numEl && subEl && typeof getStreak === 'function') {
        const s = getStreak();
        const cur = (s && s.current) ? s.current : 0;
        numEl.textContent = cur;
        const best = (s && s.best) ? s.best : 0;
        subEl.textContent = `longest \u00B7 ${best} days`;
        // v7.13.0: ease-out count-up (textContent above stays the fallback)
        if (typeof animateCount === 'function') animateCount('mc-streak-num', 0, cur, 700);
      }
    } catch (_) {}
  }

  // ── Render topbar theme button to reflect current theme ──
  function _syncTopbarTheme() {
    const btn = document.getElementById('topbar-theme');
    if (!btn) return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    // Monoline SVG (sun in dark, moon in light) matching the other topbar icons.
    // A bare \u2600/\u263E glyph rendered near-invisibly at 15px (the old bug).
    const sun = '<svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    const moon = '<svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    btn.innerHTML = isLight ? moon : sun;
  }

  // Page-header cert label (Progress / Analytics / Settings). Those titles are
  // static "Network+ N10-009" in index.html; populate them from the active cert
  // pack so each cert subdomain shows its own name + code (mirrors the bento
  // topbar's vendor-prefix strip).
  function _syncPageHeaderCert() {
    const els = document.querySelectorAll('.ana-ph-cert');
    if (!els.length) return;
    const name = (typeof CERT_PACK === 'object' && CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.name) ? CERT_PACK.meta.name : 'CompTIA Network+';
    const code = (typeof CERT_CODE !== 'undefined' && CERT_CODE) ? CERT_CODE : 'N10-009';
    const label = String(name).replace(/^(CompTIA|Microsoft|Amazon|AWS)\s+/, '') + ' ' + code;
    els.forEach(function (el) { el.textContent = label; });
  }

  // ── Vertical-bar domain grid (setup page \u00a7 03) ──
  // Aggregates recent history per N10-009 domain, renders 5 cells with
  // vertical bars sized to mastery %, click drills into weakest topic.
  function renderSetupDomainGrid() {
    const el = document.getElementById('setup-domain-grid');
    const section = document.getElementById('domain-grid-section');
    if (!el || !section) return;
    const history = (typeof loadHistory === 'function') ? loadHistory() : [];
    // Hide the entire section if there's no data — don't show an empty grid
    if (history.length === 0) {
      section.classList.add('is-hidden');
      return;
    }
    section.classList.remove('is-hidden');
    // v4.99.80: cert-aware domain grid. Reads domain keys from DOMAIN_WEIGHTS
    // (already populated from the active cert pack) so Network+ and Security+
    // each render their own 5-domain grid with correct labels + weights.
    const domainOrder = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS)
      ? Object.keys(DOMAIN_WEIGHTS)
      : ['concepts', 'implementation', 'operations', 'security', 'troubleshooting'];
    // Aggregate score per domain via TOPIC_DOMAINS
    const stats = {};
    domainOrder.forEach(d => { stats[d] = { score: 0, total: 0 }; });
    history.forEach(e => {
      const dk = (typeof TOPIC_DOMAINS !== 'undefined') ? TOPIC_DOMAINS[e.topic] : null;
      if (!dk || !stats[dk]) return;
      stats[dk].score += e.score || 0;
      stats[dk].total += e.total || 0;
    });
    // Compute weight percentages from DOMAIN_WEIGHTS (cert-aware)
    const weightPct = {};
    domainOrder.forEach(dk => { weightPct[dk] = Math.round((DOMAIN_WEIGHTS[dk] || 0) * 100); });
    // v4.54.10: replaced wrap-chips with vertical list of 5 canonical topics
    // per domain (matches prototype). Each topic marked as weak if it shows up
    // in computeWeakSpotScores() for the session. Weak = accent text + dot; rest
    // = muted text + muted dot. Fixed topic list keeps the cells consistent-height
    // and covers the syllabus vocabulary a student expects to see per domain.
    //
    // `label` is what renders to screen; `key` is the exact TOPIC_DOMAINS key used
    // for weak-spot matching. If the weak-spot key isn't in this canonical list,
    // it's still counted (the weakness scores used by other surfaces are unchanged).
    // v4.99.80: cert-aware canonical topic maps. Network+ uses N10-009 domains;
    // Security+ uses SY0-701 domains. Each array of 5 canonical topics per
    // domain matches the locked home mockup (netplus-home-concept.html /
    // secplus-home-concept.html). The key must be an exact TOPIC_DOMAINS key
    // so weak-spot matching works.
    const _CANONICAL_NETPLUS = {
      concepts: [
        { label: 'OSI Model',       key: 'Network Models & OSI' },
        { label: 'TCP/IP Basics',   key: 'TCP/IP Basics' },
        { label: 'Subnetting',      key: 'Subnetting & IP Addressing' },
        { label: 'DNS & DHCP',      key: 'Network Naming (DNS & DHCP)' },
        { label: 'IPv6',            key: 'IPv6' },
      ],
      implementation: [
        { label: 'Routing',         key: 'Routing Protocols' },
        { label: 'OSPF',            key: 'OSPF' },
        { label: 'BGP',             key: 'BGP' },
        { label: 'VLANs',           key: 'Switch Features & VLANs' },
        { label: 'STP',             key: 'STP/RSTP' },
      ],
      operations: [
        { label: 'Monitoring',      key: 'Network Monitoring & Observability' },
        { label: 'Data Centres',    key: 'Data Centres' },
        { label: 'WAN',             key: 'WAN Connectivity' },
        { label: 'SD-WAN',          key: 'SD-WAN & SASE' },
        { label: 'BCDR',            key: 'Business Continuity & Disaster Recovery' },
      ],
      security: [
        { label: 'TCP/IP Security', key: 'Securing TCP/IP' },
        { label: 'AAA',             key: 'AAA & Authentication' },
        { label: 'IPsec',           key: 'IPsec VPN' },
        { label: 'PKI',             key: 'PKI & Certificate Management' },
        { label: 'Firewalls',       key: 'Firewalls, DMZ & Security Zones' },
      ],
      troubleshooting: [
        { label: '7-Step Method',   key: 'CompTIA Troubleshooting Methodology' },
        { label: 'Cable Issues',    key: 'Cable Issues' },
        { label: 'Service Issues',  key: 'Service Issues' },
        { label: 'Perf Issues',     key: 'Perf Issues' },
        { label: 'Connection Issues', key: 'Connection Issues' },
      ],
    };
    const _CANONICAL_SECPLUS = {
      concepts: [
        { label: 'Security Controls', key: 'Security Controls' },
        { label: 'CIA Triad & AAA',   key: 'CIA Triad & AAA' },
        { label: 'Change Mgmt',       key: 'Change Management' },
        { label: 'Technical Change Mgmt', key: 'Technical Change Management' },
        { label: 'Cryptography',      key: 'Cryptography Fundamentals' },
        { label: 'PKI',               key: 'PKI & Certificate Management' },
      ],
      threats: [
        { label: 'Threat Actors',     key: 'Threat Actors & Motivations' },
        { label: 'Attack Vectors',    key: 'Attack Vectors & Surfaces' },
        { label: 'Social Engineering', key: 'Social Engineering' },
        { label: 'Malware Types',     key: 'Malware Types' },
        { label: 'Mitigation',        key: 'Mitigation Techniques' },
      ],
      architecture: [
        { label: 'Architecture Models', key: 'Architecture Models' },
        { label: 'Zero Trust & SDN',   key: 'Zero Trust & SDN' },
        { label: 'Cloud Security',     key: 'Cloud Security & Shared Responsibility' },
        { label: 'Data Protection',    key: 'Data Protection' },
        { label: 'Resilience',         key: 'Resilience & Recovery' },
      ],
      operations: [
        { label: 'Hardening',         key: 'Endpoint & Server Hardening' },
        { label: 'Vuln Mgmt',         key: 'Vulnerability Management' },
        { label: 'Monitoring & SIEM', key: 'Security Monitoring & SIEM' },
        { label: 'IAM',               key: 'Identity & Access Management' },
        { label: 'Incident Response', key: 'Incident Response' },
      ],
      governance: [
        { label: 'Governance',        key: 'Security Governance' },
        { label: 'Risk Mgmt',         key: 'Risk Management' },
        { label: 'Third-Party Risk',  key: 'Third-Party Risk Management' },
        { label: 'Compliance',        key: 'Compliance Frameworks' },
        { label: 'Audits',            key: 'Audits & Assessments' },
      ],
    };
    // v7.3.0 — AZ-900 canonical topic shortlist (5 representative topics per
    // domain) for the home-page domain grid. Mirrors the _CANONICAL_NETPLUS +
    // _CANONICAL_SECPLUS shape verbatim — { domainKey: [{ label, key }, …] }
    // where `key` matches CERT_PACK.topicDomains[key] for weak-spot routing.
    const _CANONICAL_AZ900 = {
      'cloud-concepts': [
        { label: 'Cloud Basics',          key: 'Cloud Computing Basics' },
        { label: 'Shared Responsibility', key: 'Shared Responsibility Model' },
        { label: 'Deployment Models',     key: 'Cloud Deployment Models' },
        { label: 'Service Models',        key: 'Cloud Service Models' },
        { label: 'Serverless',            key: 'Serverless Computing' },
      ],
      'azure-architecture': [
        { label: 'Regions & Pairs',       key: 'Azure Regions & Region Pairs' },
        { label: 'Resource Groups',       key: 'Resource Groups & Subscriptions' },
        { label: 'Virtual Machines',      key: 'Azure Virtual Machines' },
        { label: 'VNets & Subnets',       key: 'Virtual Networks & Subnets' },
        { label: 'Entra ID',              key: 'Microsoft Entra ID & Authentication' },
      ],
      'azure-management': [
        { label: 'Cost Management',       key: 'Azure Cost Management' },
        { label: 'Tags',                  key: 'Tags & Resource Organization' },
        { label: 'Azure Policy',          key: 'Azure Policy' },
        { label: 'ARM & IaC',             key: 'ARM Templates & IaC' },
        { label: 'Monitor & Logs',        key: 'Azure Monitor & Log Analytics' },
      ],
    };
    // v7.5.0 — AI-900 canonical topic shortlist (5 representative topics per
    // domain) for the home-page domain grid. Mirrors the _CANONICAL_AZ900 +
    // _CANONICAL_SECPLUS shape — { domainKey: [{ label, key }, …] } where
    // `key` matches CERT_PACK.topicDomains[key] for weak-spot routing. Domain 5
    // (GenAI) emphasises Foundry + Azure OpenAI per VoC §13.6 competitor gap.
    const _CANONICAL_AI900 = {
      'ai-workloads': [
        { label: 'Workload Types',        key: 'AI Workload Types' },
        { label: 'Responsible AI',        key: 'Responsible AI Principles' },
        { label: 'Fairness',              key: 'Fairness in AI' },
        { label: 'Reliability & Safety',  key: 'Reliability & Safety in AI' },
        { label: 'Privacy & Inclusiveness', key: 'Privacy, Security & Inclusiveness in AI' },
      ],
      'ml-fundamentals': [
        { label: 'ML Types',              key: 'Common Machine Learning Types' },
        { label: 'Regression',            key: 'Regression Workloads' },
        { label: 'Classification',        key: 'Classification Workloads' },
        { label: 'Clustering',            key: 'Clustering Workloads' },
        { label: 'Confusion Matrix',      key: 'Confusion Matrix & Model Evaluation' },
      ],
      'computer-vision': [
        { label: 'CV Solutions',          key: 'Computer Vision Common Solutions' },
        { label: 'Image Classification',  key: 'Image Classification' },
        { label: 'Object Detection',      key: 'Object Detection' },
        { label: 'OCR',                   key: 'Optical Character Recognition (OCR)' },
        { label: 'Face Detection',        key: 'Facial Detection & Analysis' },
      ],
      'nlp-workloads': [
        { label: 'NLP Solutions',         key: 'NLP Common Solutions' },
        { label: 'Sentiment Analysis',    key: 'Sentiment Analysis' },
        { label: 'Language Modeling',     key: 'Language Modeling' },
        { label: 'Speech',                key: 'Speech Recognition & Synthesis' },
        { label: 'Translation',           key: 'Translation & Transliteration' },
      ],
      'genai-workloads': [
        { label: 'GenAI Features',        key: 'Generative AI Common Features' },
        { label: 'Foundation vs Fine-tuned', key: 'Foundation Models vs Fine-tuned Models' },
        { label: 'RAG / Grounding',       key: 'Grounding & RAG (Retrieval-Augmented Generation)' },
        { label: 'Azure OpenAI',          key: 'Azure OpenAI Service' },
        { label: 'AI Foundry',            key: 'Azure AI Foundry & Model Catalog' },
      ],
    };
    // v7.6.0 — fifth cert family CompTIA A+ (dual-exam). 5 canonical topics per
    // domain for the home-page domain grid. Mirrors the _CANONICAL_* shape
    // verbatim — { domainKey: [{ label, key }, …] } where key matches a
    // topicDomains key in certs/aplus-core1.js exactly. 5 domains (matches Net+).
    const _CANONICAL_APLUS_CORE1 = {
      'mobile-devices': [
        { label: 'Mobile Hardware',       key: 'Mobile Device Hardware & Replacement' },
        { label: 'Connectivity',          key: 'Mobile Accessories & Connectivity' },
        { label: 'Network Connectivity',  key: 'Mobile Network Connectivity' },
        { label: 'MDM',                   key: 'Mobile Device Management (MDM)' },
        { label: 'Synchronization',       key: 'Mobile Synchronization' },
      ],
      'networking': [
        { label: 'Ports & Protocols',     key: 'Ports & Protocols' },
        { label: 'Wireless Standards',    key: 'Wireless Networking Standards' },
        { label: 'DNS Records',           key: 'DNS Records & Configuration' },
        { label: 'Network Hardware',      key: 'Networking Hardware Devices' },
        { label: 'SOHO Config',           key: 'SOHO Network Configuration' },
      ],
      'hardware': [
        { label: 'RAID',                  key: 'RAID Configurations' },
        { label: 'Storage Devices',       key: 'Storage Devices' },
        { label: 'Motherboards',          key: 'Motherboards & Form Factors' },
        { label: 'Printer Config',        key: 'Printers — Deploy & Configure' },
        { label: 'Printer Maintenance',   key: 'Printer Maintenance' },
      ],
      'virt-cloud': [
        { label: 'Virtualization',        key: 'Virtualization Concepts' },
        { label: 'Service Models',        key: 'Cloud Service Models' },
        { label: 'Deployment Models',     key: 'Cloud Deployment Models' },
        { label: 'Cloud Characteristics', key: 'Cloud Characteristics' },
        { label: 'Containers & VDI',      key: 'Containers & VDI' },
      ],
      'troubleshooting-hw-net': [
        { label: 'Methodology',           key: 'Troubleshooting Methodology' },
        { label: 'Drives & RAID',         key: 'Troubleshoot Drives & RAID' },
        { label: 'Mobile Issues',         key: 'Troubleshoot Mobile Device Issues' },
        { label: 'Network Issues',        key: 'Troubleshoot Network Issues' },
        { label: 'Printer Issues',        key: 'Troubleshoot Printer Issues' },
      ],
    };
    // v7.6.0 — A+ Core 2. 4 domains (fewer than the 5-domain certs).
    const _CANONICAL_APLUS_CORE2 = {
      'operating-systems': [
        { label: 'Windows Editions',      key: 'Windows Editions Features' },
        { label: 'Command-Line',          key: 'Windows Command-Line Tools' },
        { label: 'Windows Tools',         key: 'Windows Tools & MMC Snap-ins' },
        { label: 'Linux Commands',        key: 'Linux Features & Commands' },
        { label: 'macOS',                 key: 'macOS Features & Tools' },
      ],
      'security': [
        { label: 'Social Engineering',    key: 'Social Engineering Attacks' },
        { label: 'Malware Types',         key: 'Malware Types & Tools' },
        { label: 'Logical Security & MFA', key: 'Logical Security & MFA' },
        { label: 'Windows Security',      key: 'Windows OS Security Settings' },
        { label: 'Malware Removal',       key: 'SOHO Malware Removal Procedure' },
      ],
      'software-troubleshooting': [
        { label: 'Windows OS Issues',     key: 'Troubleshoot Windows OS Issues' },
        { label: 'Malware Symptoms',      key: 'Malware Symptom Diagnosis' },
        { label: 'Mobile OS Issues',      key: 'Troubleshoot Mobile OS & App Issues' },
        { label: 'PC Security Issues',    key: 'Troubleshoot PC Security Issues' },
        { label: 'Browser Symptoms',      key: 'Browser Symptom Troubleshooting' },
      ],
      'operational-procedures': [
        { label: 'Change Management',     key: 'Change Management Procedures' },
        { label: 'Backup & Recovery',     key: 'Backup & Recovery Methods' },
        { label: 'Documentation',         key: 'Documentation & Ticketing' },
        { label: 'Scripting',             key: 'Scripting Basics' },
        { label: 'Remote Access',         key: 'Remote Access Technologies' },
      ],
    };
    // v7.7.0 — sixth cert SC-900. 4 domains (matches A+ Core 2's 4-domain shape).
    // 5 canonical topics per domain for the home-page domain grid. Mirrors the
    // _CANONICAL_* shape verbatim — { domainKey: [{ label, key }, …] } where key
    // matches a topicDomains key in certs/sc900.js exactly.
    const _CANONICAL_SC900 = {
      'sci-concepts': [
        { label: 'Zero Trust',            key: 'Zero Trust Model' },
        { label: 'Defense in Depth',      key: 'Defense in Depth' },
        { label: 'Shared Responsibility', key: 'Shared Responsibility Model' },
        { label: 'AuthN vs AuthZ',        key: 'Authentication vs Authorization' },
        { label: 'Encryption & Hashing',  key: 'Encryption & Hashing' },
      ],
      'entra': [
        { label: 'Entra ID',              key: 'Entra ID Function & Identity Types' },
        { label: 'Conditional Access',    key: 'Conditional Access' },
        { label: 'MFA',                   key: 'Multifactor Authentication (Entra)' },
        { label: 'PIM',                   key: 'Privileged Identity Management (PIM)' },
        { label: 'ID Protection',         key: 'Entra ID Protection' },
      ],
      'security-solutions': [
        { label: 'Defender XDR',          key: 'Microsoft Defender XDR' },
        { label: 'Defender for Cloud',    key: 'Microsoft Defender for Cloud' },
        { label: 'Sentinel',              key: 'Microsoft Sentinel' },
        { label: 'Azure Firewall',        key: 'Azure Firewall' },
        { label: 'Key Vault',             key: 'Azure Key Vault' },
      ],
      'compliance-solutions': [
        { label: 'Purview Portal',        key: 'Microsoft Purview Portal' },
        { label: 'Compliance Manager',    key: 'Compliance Manager & Compliance Score' },
        { label: 'Sensitivity Labels',    key: 'Sensitivity Labels & Policies' },
        { label: 'DLP',                   key: 'Data Loss Prevention (DLP)' },
        { label: 'Insider Risk',          key: 'Insider Risk Management' },
      ],
    };
    // v7.8.0 — seventh cert AWS Cloud Practitioner CLF-C02 (4 domains × 5 canon
    // topics; keys match topicDomains in certs/clfc02.js exactly).
    const _CANONICAL_CLFC02 = {
      'cloud-concepts': [
        { label: 'Cloud Benefits',        key: 'Benefits of the AWS Cloud' },
        { label: 'Well-Architected',      key: 'Well-Architected Framework' },
        { label: 'Sustainability',        key: 'Sustainability Pillar' },
        { label: 'Migration (7 Rs)',      key: 'Cloud Migration Strategies (7 Rs)' },
        { label: 'Cloud Economics',       key: 'Cloud Economics' },
      ],
      'security-compliance': [
        { label: 'Shared Responsibility', key: 'Shared Responsibility Model' },
        { label: 'IAM',                   key: 'IAM Users, Groups & Roles' },
        { label: 'Organizations',         key: 'AWS Organizations' },
        { label: 'GuardDuty',             key: 'Amazon GuardDuty' },
        { label: 'KMS & Encryption',      key: 'AWS KMS & Encryption' },
      ],
      'cloud-tech-services': [
        { label: 'Global Infra',          key: 'AWS Global Infrastructure' },
        { label: 'EC2',                   key: 'Amazon EC2 & Instance Types' },
        { label: 'S3 Classes',            key: 'Amazon S3 Storage Classes' },
        { label: 'RDS/Aurora',            key: 'Relational Databases (RDS/Aurora)' },
        { label: 'VPC/Route 53/CDN',      key: 'Networking (VPC/Route 53/CloudFront)' },
      ],
      'billing-pricing-support': [
        { label: 'Pricing Models',        key: 'EC2 Pricing Models' },
        { label: 'Support Plans',         key: 'AWS Support Plans' },
        { label: 'Trusted Advisor',       key: 'AWS Trusted Advisor & Compute Optimizer' },
        { label: 'Billing & Budgets',     key: 'Consolidated Billing & Budgets' },
        { label: 'Free Tier',             key: 'AWS Free Tier & Pricing Calculator' },
      ],
    };
    // v7.8.0 — 8-way cert selector (was 7-way ternary). Falls through to Net+
    // when CURRENT_CERT isn't recognised (defensive; preserves prior behavior).
    const CANONICAL_DOMAIN_TOPICS = (typeof CURRENT_CERT !== 'undefined' && CURRENT_CERT === 'secplus')
      ? _CANONICAL_SECPLUS
      : ((typeof CURRENT_CERT !== 'undefined' && CURRENT_CERT === 'az900')
          ? _CANONICAL_AZ900
          : ((typeof CURRENT_CERT !== 'undefined' && CURRENT_CERT === 'ai900')
              ? _CANONICAL_AI900
              : ((typeof CURRENT_CERT !== 'undefined' && CURRENT_CERT === 'sc900')
                  ? _CANONICAL_SC900
                  : ((typeof CURRENT_CERT !== 'undefined' && CURRENT_CERT === 'aplus-core1')
                      ? _CANONICAL_APLUS_CORE1
                      : ((typeof CURRENT_CERT !== 'undefined' && CURRENT_CERT === 'aplus-core2')
                          ? _CANONICAL_APLUS_CORE2
                          : ((typeof CURRENT_CERT !== 'undefined' && CURRENT_CERT === 'clfc02')
                              ? _CANONICAL_CLFC02
                              : _CANONICAL_NETPLUS))))));
    // Build a set of weak topic keys for quick lookup
    const weakSet = new Set();
    try {
      if (typeof computeWeakSpotScores === 'function') {
        (computeWeakSpotScores() || []).forEach(ws => { if (ws && ws.topic) weakSet.add(ws.topic); });
      }
    } catch (_) {}

    // v4.85.18: build a set of topics the user has actually attempted, so the
    // chip rendering can distinguish "studied + strong" from "never studied"
    // (pre-fix both rendered the same dim greyed-out style, making it look
    // like the user hadn't practised topics they actually had).
    const studiedSet = new Set();
    history.forEach(e => {
      if (!e.topic) return;
      if (e.topic === MIXED_TOPIC || e.topic === EXAM_TOPIC) return;
      if ((e.total || 0) > 0) studiedSet.add(e.topic);
    });

    const html = domainOrder.map((dk, idx) => {
      const s = stats[dk];
      const pct = s.total > 0 ? Math.round((s.score / s.total) * 100) : null;
      const barH = pct !== null ? Math.max(6, Math.min(100, pct)) : 6;
      const pctTxt = pct !== null ? pct : '\u2014';
      const pctSub = pct !== null ? '%' : '';
      const status = pct === null ? 'Not studied' : pct >= 80 ? 'Mastered' : pct >= 70 ? 'Proficient' : pct >= 55 ? 'Developing' : 'Novice';
      // v4.54.10: vertical canonical-topic list per domain
      // v4.85.18: 3 states per topic \u2014 weak (accent + bold) / studied (normal)
      // / untouched (dim italic). Was 2 states which conflated mastered + untouched.
      const topics = CANONICAL_DOMAIN_TOPICS[dk] || [];
      const topicsHtml = `<ul class="dg-topic-list" aria-label="Topics in this domain">${topics.map(t => {
        const isWeak = weakSet.has(t.key);
        const isStudied = studiedSet.has(t.key);
        let stateClass = '';
        if (isWeak) stateClass = ' dg-topic-weak';
        else if (isStudied) stateClass = ' dg-topic-studied';
        else stateClass = ' dg-topic-untouched';
        const ariaLabel = isWeak ? ' (weak \u2014 needs work)' : (isStudied ? ' (practised)' : ' (not yet studied)');
        return `<li class="dg-topic${stateClass}" aria-label="${escHtml(t.label)}${ariaLabel}"><span class="dg-topic-dot" aria-hidden="true"></span><span class="dg-topic-label">${escHtml(t.label)}</span></li>`;
      }).join('')}</ul>`;
      // v4.99.80: data-tier attribute for CSS semantic mastery colouring
      const tier = pct === null ? 'none' : pct >= 80 ? 'mastered' : pct >= 70 ? 'proficient' : pct >= 55 ? 'developing' : 'novice';
      // v4.99.80: cert-aware display name via DOMAIN_LABELS (was hardcoded domainDisplay)
      const displayName = (typeof DOMAIN_LABELS === 'object' && DOMAIN_LABELS[dk]) ? DOMAIN_LABELS[dk] : dk;
      return `<button type="button" class="domain-cell" data-domain-idx="${idx + 1}" data-domain-key="${dk}" data-tier="${tier}" onclick="drillDomain('${displayName.replace(/'/g, "\\'")}')">
        <span class="dg-weight">${weightPct[dk]}% exam</span>
        <div class="dg-bar-col">
          <div class="dg-bar" style="height:${barH}%"></div>
        </div>
        <div class="dg-body">
          <div class="dg-num">Domain ${idx + 1}</div>
          <div class="dg-name">${escHtml(displayName)}</div>
          ${topicsHtml}
        </div>
        <div class="dg-pct-wrap">
          <span class="dg-pct">${pctTxt}</span><span class="dg-pct-sub">${pctSub}</span>
        </div>
        <div class="dg-status">${status}</div>
      </button>`;
    }).join('');
    el.innerHTML = html;
  }

  // v4.54.8: live-update the customizer prose-summary CTA bar whenever the user
  // changes topic / difficulty / count. Reads from the current chip `.on` state
  // and writes a human-readable summary above the Generate button. Wired via
  // updateCqSummaryBar() invocations patched into the existing chip toggle flow.
  function updateCqSummaryBar() {
    const proseEl = document.getElementById('cq-summary-prose');
    if (!proseEl) return;
    // v4.54.15: support multi-select topics. Read ALL .on chips; handle the
    // three states: mode card on (Smart/Mixed), single domain chip, or
    // multiple domain chips.
    const topicGroup = document.getElementById('topic-group');
    const modeOn = topicGroup ? topicGroup.querySelector('.cq-mode-card.on') : null;
    const domainOn = topicGroup
      ? Array.from(topicGroup.querySelectorAll('.chip.on:not(.cq-mode-card)')).map(c => (c.getAttribute('data-v') || '').replace(/&mdash;/g, '\u2014'))
      : [];
    const diffActive = document.querySelector('#diff-group .chip.on');
    const countActive = document.querySelector('#count-group .chip.on');
    const diffLabel = diffActive ? (diffActive.getAttribute('data-v') || 'Exam Level') : 'Exam Level';
    const count = countActive ? (countActive.getAttribute('data-v') || '10') : '10';
    const diffShort = diffLabel.toLowerCase().replace('/ tricky', '').replace(' level', '-level').replace(/\s+/g, ' ').trim();
    const esc = (typeof escHtml === 'function') ? escHtml : (s => s);
    let topicProse;
    if (modeOn) {
      const label = (modeOn.getAttribute('data-v') || '').replace(/&mdash;/g, '\u2014');
      if (/smart/i.test(label)) topicProse = '<em>AI-picked weak spots</em>';
      else topicProse = '<em>Mixed across all topics</em>';
    } else if (domainOn.length === 1) {
      topicProse = `on <em>${esc(domainOn[0])}</em>`;
    } else if (domainOn.length >= 2) {
      const preview = domainOn.slice(0, 3).map(esc).join(', ');
      const extra = domainOn.length > 3 ? `, +${domainOn.length - 3} more` : '';
      topicProse = `across <em>${domainOn.length} topics</em> (${preview}${extra})`;
    } else {
      topicProse = '<em>Mixed across all topics</em>';
    }
    const estMin = Math.max(3, Math.round(parseInt(count, 10) || 10));
    proseEl.innerHTML = `<strong>${count}</strong> ${diffShort} questions &middot; ${topicProse} &middot; est. ~${estMin} min`;
  }

  // ── Public API (window exposure) ─────────────────────────────────────────
  // Daily Challenge
  window.getDailyChallenge           = getDailyChallenge;
  window.saveDailyChallenge          = saveDailyChallenge;
  window.isDailyChallengeDoneToday   = isDailyChallengeDoneToday;
  window.completeDailyChallenge      = completeDailyChallenge;
  window.getDailyChallengeTopic      = getDailyChallengeTopic;
  window.renderContinueCard          = renderContinueCard;
  window.renderDailyChallengeCard    = renderDailyChallengeCard;
  window.startDailyChallenge         = startDailyChallenge;
  // Weak-spot / focus
  window.getTodaysFocusTopics        = getTodaysFocusTopics;
  // Quiz presets & streak
  window.focusTopic                  = focusTopic;
  window.renderStreakDefender        = renderStreakDefender;
  window.startStreakSave             = startStreakSave;
  window.applyPreset                 = applyPreset;
  // Domain drill
  window._renderCertAwareCopy        = _renderCertAwareCopy;
  window._renderTopicChipsForActiveCert = _renderTopicChipsForActiveCert;
  window.applyDomainPreset           = applyDomainPreset;
  window.prefillDomainTopics         = prefillDomainTopics;
  window._drillWeakDomainToBuilder   = _drillWeakDomainToBuilder;
  // Marathon / session
  window.startBulkQuiz               = startBulkQuiz;
  window.startSession                = startSession;
  window.renderSessionTransition     = renderSessionTransition;
  window.renderSessionComplete       = renderSessionComplete;
  window.endSessionEarly             = endSessionEarly;
  // Sidebar
  window.renderAppSidebar            = renderAppSidebar;
  window.updateSidebarActiveState    = updateSidebarActiveState;
  window.toggleSidebarMobile         = toggleSidebarMobile;
  window._syncSidebarA11y            = _syncSidebarA11y;
  // Topbar / hero / bento
  window.updateTopbarCrumb           = updateTopbarCrumb;
  window._maybeShowDailyRecap        = _maybeShowDailyRecap;
  window.dismissDailyRecap           = dismissDailyRecap;
  window.dismissHintModal            = dismissHintModal;
  window.renderTopbarCountdown       = renderTopbarCountdown;
  window._topbarStartClock           = _topbarStartClock;
  window.syncSettingsExamDate        = syncSettingsExamDate;
  window._confirmDeleteAccount       = _confirmDeleteAccount;
  window.toggleSidebarCollapsed      = toggleSidebarCollapsed;
  window._initSidebarCollapsed       = _initSidebarCollapsed;
  window.renderHeroV2                = renderHeroV2;
  window.renderBentoTopbar           = renderBentoTopbar;
  window.renderBentoRecommended      = renderBentoRecommended;
  window.renderBentoMomentum         = renderBentoMomentum;
  window.renderBentoQuickStart       = renderBentoQuickStart;
  window.renderBentoDomains          = renderBentoDomains;
  window._syncTopbarTheme            = _syncTopbarTheme;
  window._syncPageHeaderCert         = _syncPageHeaderCert;
  // Setup page
  window.renderSetupDomainGrid       = renderSetupDomainGrid;
  window.updateCqSummaryBar          = updateCqSummaryBar;

  window._certanvilFeatures['home'] = { renderHeroV2: renderHeroV2, renderAppSidebar: renderAppSidebar };

  // ── Home eager init ───────────────────────────────────────────────────────
  // app.js _v454Init / _v453Init ran before this module loaded; their typeof
  // guards no-opped. Re-trigger here so sidebar, topbar, hero, etc. render.
  function _homeInit() {
    try {
      _initSidebarCollapsed();
      _topbarStartClock();
      _syncTopbarTheme();
      _syncPageHeaderCert();
      renderTopbarCountdown();
      var obs = new MutationObserver(_syncTopbarTheme);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      var active = document.querySelector('.page.active');
      if (active) updateTopbarCrumb(active.id.replace(/^page-/, ''));
      renderAppSidebar();
      _syncSidebarA11y();
      var setup = document.getElementById('page-setup');
      if (setup && setup.classList.contains('active')) {
        renderSetupDomainGrid();
        renderHeroV2();
      }
    } catch (e) {
      console.warn('[home.js init]', e && e.message);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _homeInit);
  } else {
    _homeInit();
  }
})();
