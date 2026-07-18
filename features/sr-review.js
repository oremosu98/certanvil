(function () {
  'use strict';
  if (!window._certanvilFeatures) window._certanvilFeatures = {};

  // ══════════════════════════════════════════
  // v4.74.0 — Spaced Repetition Queue (SM-2-style)
  // Every wrong answer auto-enrolls into a scheduled review queue. Items
  // resurface on a growing interval (1d → 3d → 7d → 14d → 30d → 60d…) until
  // the user gets them correct N times in a row at high confidence — then
  // they graduate out of the queue.
  //
  // Algorithm: simplified SM-2 (the same engine Anki has used since 1987).
  // 3-tier confidence per answer (correct-confident / correct-uncertain /
  // wrong) drives the interval growth and the ease-factor adjustment.
  //
  // Lives parallel to the Wrong Bank — Wrong Bank is a flat list for
  // drill, SR Queue is a scheduler for retention. Different mechanics,
  // different surfaces, can co-exist without conflict.
  // ══════════════════════════════════════════
  const SR_QUEUE_CAP = 500;
  const SR_SESSION_CAP = 30;            // #8: max cards per review session (was 20; ~15 min at 30)
  const SR_GRADUATION_STREAK = 3;       // correct streak needed to graduate
  const SR_GRADUATION_EASE = 2.5;       // ease factor needed at graduation
  const SR_GRADUATION_INTERVAL = 30;    // days interval needed at graduation
  const SR_EXAM_BUFFER_PCT = 0.15;      // #7: leave 15% of days-to-exam as a final-pass buffer
  const SR_LAPSE_FACTOR = 0.30;         // #3: a wrong answer drops the interval to ~30% of prior (floor 1d), not a hard reset to 1
  const SR_LIGHT_DAY_THRESHOLD = 8;     // #8: fewer than this many due cards = a "light day" that offers top-up practice
  const SR_FREE_DAILY_CAP = 5;          // GAP-1 (2026-06-11): free tier reviews 5 cards/day
                                        // (cert-ios-daily-limit mockup: "15 practice + 5 review").
                                        // Gentle queue, not a wall — extra due cards simply wait
                                        // for tomorrow. Pro/admin and anonymous users are uncapped
                                        // (anonymous = BYOK self-pay; cap applies to free accounts).

  // ── GAP-1: free-tier review-cap helpers ─────────────────────────────────
  // The 5/day cap is enforced client-side on purpose: review cards are saved
  // questions with zero AI spend, so this is product gating, not cost
  // protection (the 15/day question quota is the server-enforced half).
  // Counter is a per-day localStorage cell; resets implicitly when the
  // stored date rolls over.
  function _srIsFreeTier() {
    return !!(_quotaState && _quotaState.tier === 'free');
  }
  function _srFreeReviewedToday() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE.SR_FREE_COUNT) || 'null');
      if (raw && raw.date === new Date().toISOString().slice(0, 10)) return raw.count || 0;
    } catch (_) {}
    return 0;
  }
  function _srBumpFreeReviewed() {
    if (!_srIsFreeTier()) return;
    try {
      localStorage.setItem(STORAGE.SR_FREE_COUNT, JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        count: _srFreeReviewedToday() + 1
      }));
    } catch (_) {}
  }

  // #8: review session preferences (session size + top-up). Cloud-flushed like
  // the queue. sessionSize is 10 | 20 | 30 | 'all' (capped at SR_SESSION_CAP).
  function loadSrPrefs() {
    try { return Object.assign({ sessionSize: 30, topUp: true }, JSON.parse(localStorage.getItem(STORAGE.SR_PREFS) || '{}')); }
    catch (e) { return { sessionSize: 30, topUp: true }; }
  }
  function saveSrPrefs(prefs) {
    try { localStorage.setItem(STORAGE.SR_PREFS, JSON.stringify(prefs)); } catch (e) {}
    if (typeof _cloudFlush === 'function') _cloudFlush(STORAGE.SR_PREFS);
  }

  function loadSrQueue() {
    try { return JSON.parse(localStorage.getItem(STORAGE.SR_QUEUE) || '[]'); }
    catch { return []; }
  }
  function saveSrQueue(queue) {
    try { localStorage.setItem(STORAGE.SR_QUEUE, JSON.stringify(queue)); _cloudFlush(STORAGE.SR_QUEUE); }
    catch { showToast('Storage full · SR queue not saved', 'error'); }
  }

  // Stable hash for question identity. Reuses the djb2 + base36 pattern
  // already used by _aiCacheKey.
  function _srHash(text) {
    if (!text) return '0';
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  // Apply SM-2 scheduling to an entry based on the user's outcome.
  // outcome: 'correct-confident' | 'correct-uncertain' | 'wrong'
  // Mutates entry in place AND returns it.
  function _srSchedule(entry, outcome) {
    const now = Date.now();
    entry.lastSeen = now;
    entry.attempts = (entry.attempts || 0) + 1;

    if (outcome === 'wrong') {
      // #3 lapse-aware partial reset: mature cards relearn faster than fresh
      // failures, so drop the interval to ~30% of its prior value (floor 1d)
      // instead of a hard reset to 1. A 30d card returns in ~9d; a young 1-2d
      // card still returns next day, so the downside stays bounded.
      const prior = entry.intervalDays || 1;
      entry.intervalDays = Math.max(1, Math.round(prior * SR_LAPSE_FACTOR));
      entry.easeFactor = Math.max(1.3, (entry.easeFactor || 2.5) - 0.20);
      entry.correctStreak = 0;
      entry.lapses = (entry.lapses || 0) + 1;   // #5: powers the "Rebuilding" microcopy
      entry.graduated = false;
    } else if (outcome === 'correct-uncertain') {
      // Same growth direction but slower (×1.5 vs ×ease). Ease unchanged
      // because the user wasn't confident — don't reward the easy growth.
      const baseInterval = entry.intervalDays || 1;
      entry.intervalDays = Math.max(1, baseInterval * 1.5);
      entry.correctStreak = (entry.correctStreak || 0) + 1;
    } else {
      // 'correct-confident'
      const baseInterval = entry.intervalDays || 1;
      const ef = entry.easeFactor || 2.5;
      entry.intervalDays = Math.max(1, baseInterval * ef);
      entry.easeFactor = Math.min(2.8, ef + 0.10);
      entry.correctStreak = (entry.correctStreak || 0) + 1;
    }

    // Cap interval at 180 days — beyond that, just keep it at 180.
    entry.intervalDays = Math.min(180, entry.intervalDays);

    // #7 exam-aware: when an exam date is set for this cert, cap the interval so
    // every review lands before exam day. One continuous dial — the closer the
    // date, the harder it compresses (a 2-week date pins to ~1d, a 2-month date
    // barely bites). Reuses the existing per-cert exam date (subdomain-isolated
    // localStorage via getDaysToExam); no new field. days<=0/null reverts to the
    // open-ended schedule above.
    const _daysToExam = (typeof getDaysToExam === 'function') ? getDaysToExam() : null;
    if (_daysToExam != null && _daysToExam > 0) {
      const buffer = Math.max(1, Math.round(_daysToExam * SR_EXAM_BUFFER_PCT));
      entry.intervalDays = Math.min(entry.intervalDays, Math.max(1, _daysToExam - buffer));
    }

    entry.nextReview = now + entry.intervalDays * 86400000;

    // Graduation: sustained mastery means it leaves the active queue.
    if (entry.correctStreak >= SR_GRADUATION_STREAK
        && entry.easeFactor >= SR_GRADUATION_EASE
        && entry.intervalDays >= SR_GRADUATION_INTERVAL) {
      entry.graduated = true;
    }

    return entry;
  }

  // Add a question to the SR queue on a wrong answer. If already present,
  // re-schedule the existing entry as 'wrong' (resets interval, drops ease).
  //
  // v4.81.28 Fix 3: filter to MCQ + multi-select only. Order / cli-sim /
  // topology PBQs have schemas the SR review surface can't render
  // (no `options`), and even if they could, drag-drop / terminal-sim
  // review doesn't fit the flashcard model. Returning null without
  // enrolling is the correct outcome — the wrong-bank still tracks the
  // miss, but SR stays focused on review-able question types.
  function addToSrQueue(q) {
    if (!q) return null;
    const allowedTypes = new Set(['mcq', 'multi-select']);
    const qType = q.type || 'mcq';
    if (!allowedTypes.has(qType)) return null;

    const queue = loadSrQueue();
    const stem = q.question || '';
    const qHash = _srHash(stem);
    let entry = queue.find(e => e.qHash === qHash);

    if (entry) {
      // v4.81.28 Fix 2: refresh the question payload on re-enrollment.
      // Pre-fix the existing entry was rescheduled but the cached
      // options/answer/explanation stayed at whatever they were when
      // first enrolled — including the `answer: null` corruption from
      // the v4.81.27-fixed `addToSrQueue` type-guard bug. Now any
      // re-encounter (which fires on every wrong answer in a quiz)
      // overwrites the payload with the fresh question shape, so
      // legacy corrupt entries self-heal.
      entry.options = q.options || entry.options || null;
      entry.answer = (q.answer != null) ? q.answer : entry.answer;
      entry.answers = q.answers || entry.answers || null;
      entry.items = q.items || entry.items || null;
      entry.correctOrder = q.correctOrder || entry.correctOrder || null;
      entry.type = q.type || entry.type || 'mcq';
      entry.topic = q.topic || entry.topic || null;
      entry.difficulty = q.difficulty || entry.difficulty || null;
      entry.explanation = q.explanation || entry.explanation || '';
      _srSchedule(entry, 'wrong');
      saveSrQueue(queue);
      return entry;
    }

    // Brand new entry — preserve the question payload so the review surface
    // can re-render it without re-fetching from the API.
    // v4.81.27 FIX: pre-fix `answer` had a type guard `typeof q.answer === 'number'`
    // that always evaluated false for MCQs (our app stores answers as letter
    // strings 'A'/'B'/etc., not numeric indices). Result: every MCQ ever
    // enrolled had `answer: null`, breaking auto-grade in _renderSrCard.
    // Now preserves the answer as-is (string letter or number index).
    entry = {
      qHash,
      question: stem,
      options: q.options || null,
      answer: (q.answer != null) ? q.answer : null,
      answers: q.answers || null,
      items: q.items || null,
      correctOrder: q.correctOrder || null,
      type: q.type || 'mcq',
      topic: q.topic || (typeof activeQuizTopic !== 'undefined' ? activeQuizTopic : null),
      difficulty: q.difficulty || (typeof diff !== 'undefined' ? diff : null),
      explanation: q.explanation || '',
      createdAt: Date.now(),
      lastSeen: Date.now(),
      intervalDays: 1,
      easeFactor: 2.5,
      attempts: 0,
      correctStreak: 0,
      lapses: 0,                         // #5 data: count of wrong outcomes, powers "Rebuilding" microcopy
      graduated: false,
      nextReview: Date.now() + 86400000  // due tomorrow by default
    };
    queue.push(entry);

    // LRU cap — drop oldest by createdAt if we exceed capacity.
    if (queue.length > SR_QUEUE_CAP) {
      queue.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      queue.length = SR_QUEUE_CAP;
    }

    saveSrQueue(queue);
    return entry;
  }

  // Update an existing entry after a review answer (correct/uncertain/wrong).
  // Returns the updated entry, or null if not found.
  function updateSrEntry(qHash, outcome) {
    const queue = loadSrQueue();
    const idx = queue.findIndex(e => e.qHash === qHash);
    if (idx === -1) return null;
    _srSchedule(queue[idx], outcome);
    saveSrQueue(queue);
    return queue[idx];
  }

  // Count of due (non-graduated, nextReview <= now) entries.
  function getSrDueCount() {
    const queue = loadSrQueue();
    const now = Date.now();
    return queue.filter(e => !e.graduated && (e.nextReview || 0) <= now).length;
  }

  // Get the actual due entries, sorted oldest-first (longest-overdue first).
  function getSrDueEntries(limit) {
    const queue = loadSrQueue();
    const now = Date.now();
    const due = queue
      .filter(e => !e.graduated && (e.nextReview || 0) <= now)
      .sort((a, b) => (a.nextReview || 0) - (b.nextReview || 0));
    return typeof limit === 'number' ? due.slice(0, limit) : due;
  }

  // Graduated count + active count + total — for analytics + homepage card.
  function getSrStats() {
    const queue = loadSrQueue();
    const now = Date.now();
    const total = queue.length;
    const graduated = queue.filter(e => e.graduated).length;
    const due = queue.filter(e => !e.graduated && (e.nextReview || 0) <= now).length;
    const active = total - graduated;
    return { total, graduated, active, due };
  }

  // #6 — Review forecast. Build a 7-day projection of upcoming due cards by
  // reading nextReview straight off the live queue, so a card answered earlier
  // today already counts toward its own future due-day (true projection, not the
  // simplified mock view). Today's bucket = everything due now or overdue, so it
  // equals getSrDueCount(); future buckets are exact local-calendar-day windows.
  // Returns { days:[{label, count, isToday, topics:[...]}], total, maxCount }.
  function buildSrForecast() {
    const queue = loadSrQueue();
    const now = Date.now();
    const DAY = 86400000;
    const t0 = new Date(now); t0.setHours(0, 0, 0, 0);
    const startOfToday = t0.getTime();
    const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const active = queue.filter(e => !e.graduated);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const winStart = startOfToday + i * DAY;
      const winEnd = winStart + DAY;
      const inBucket = active.filter(e => {
        const nr = e.nextReview || 0;
        return i === 0 ? nr <= now : (nr >= winStart && nr < winEnd);
      });
      const topics = [];
      inBucket.forEach(e => {
        const t = e.topic || 'Review';
        if (topics.indexOf(t) === -1) topics.push(t);
      });
      const d = new Date(winStart);
      days.push({ label: i === 0 ? 'Today' : WD[d.getDay()], count: inBucket.length, isToday: i === 0, topics: topics });
    }
    const maxCount = days.reduce((m, x) => Math.max(m, x.count), 0);
    const total = days.reduce((s, x) => s + x.count, 0);
    return { days: days, total: total, maxCount: maxCount };
  }

  // Render the forecast into `container`. opts.compact = home-tile mini strip
  // (bars only); the full surface adds a caption + an agenda of the next busy
  // days. Display-only — no event handlers to bind (Sec-P7: nothing inline).
  function renderSrForecast(container, opts) {
    if (!container) return;
    opts = opts || {};
    const fc = buildSrForecast();
    const max = fc.maxCount;
    let strip = '<div class="sr-fc-strip">';
    fc.days.forEach((d, i) => {
      const pct = (max > 0 && d.count > 0) ? Math.max(10, Math.round((d.count / max) * 100)) : 0;
      const todayCls = d.isToday ? ' sr-fc-day-today' : '';
      let countHtml;
      if (d.isToday) {
        countHtml = d.count > 0
          ? '<span class="sr-fc-count">' + d.count + ' due</span>'
          : '<span class="sr-fc-count sr-fc-done">&#10003; done</span>';
      } else {
        countHtml = d.count > 0
          ? '<span class="sr-fc-count">' + d.count + ' due</span>'
          : '<span class="sr-fc-count sr-fc-zero">0</span>';
      }
      // Bar grows 0 → --h via a CSS keyframe (see dg-system.css). Target height
      // and stagger index ride in the style attribute, so there are no JS .style
      // writes and the sweep stays declarative.
      strip += '<div class="sr-fc-day' + todayCls + '">'
        + '<span class="sr-fc-lbl">' + d.label + '</span>'
        + '<div class="sr-fc-track"><div class="sr-fc-bar" style="--fi:' + i + ';--h:' + pct + '%"></div></div>'
        + countHtml + '</div>';
    });
    strip += '</div>';

    // #7 exam-aware: when an exam is booked, lead with a countdown pill and swap
    // the caption to explain the continuous compression.
    const _exDays = (typeof getDaysToExam === 'function') ? getDaysToExam() : null;
    const _examOn = (_exDays != null && _exDays > 0);
    let header = (opts.eyebrow ? '<span class="sr-fc-eyebrow">' + opts.eyebrow + '</span>' : '');
    if (_examOn) {
      let dateLabel = '';
      try {
        const raw = (typeof getExamDate === 'function') ? getExamDate() : null;
        if (raw) dateLabel = ' · ' + new Date(raw).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      } catch (_) {}
      header += '<div class="sr-fc-exam"><span class="sr-fc-exam-pill">Exam in ' + _exDays + (_exDays === 1 ? ' day' : ' days') + dateLabel + '</span></div>';
    }

    let html = header + strip;
    if (!opts.compact) {
      html += '<p class="sr-fc-cap">' + (_examOn
        ? 'Intervals are capped to land before exam day, so the closer the exam the harder it works: two weeks out runs intensive, a month is steadier, two months barely changes anything.'
        : 'Intervals expand freely: a few days, then a couple of weeks, then a month. The load stays light and gaps are fine.') + '</p>';
      const upcoming = fc.days.filter((d, i) => i > 0 && d.count > 0);
      if (upcoming.length > 0) {
        let rows = '';
        upcoming.forEach(d => {
          const topicTxt = d.topics.slice(0, 3).map(t => escHtml(t)).join(' · ');
          rows += '<div class="sr-fc-arow">'
            + '<span class="sr-fc-when">' + d.label + '</span>'
            + '<span class="sr-fc-topics">' + (topicTxt || 'Review') + '</span>'
            + '<span class="sr-fc-n">' + d.count + '</span></div>';
        });
        html += '<div class="sr-fc-agenda">' + rows + '</div>';
      }
    }
    container.innerHTML = html;
    // The bar sweep (0 → --h) is a pure CSS keyframe; it collapses to instant
    // under prefers-reduced-motion via the gate in dg-system.css.
  }

  // ── SR Review session state ──
  // Module-scoped state for the daily-review flow. Tracks the active
  // session (loaded due cards + position + per-card answer state).
  let _srSession = null;

  function renderSrReviewCard() {
    // Homepage card surfacing — only visible when there are due cards.
    const card = document.getElementById('sr-review-card');
    if (!card) return;
    const stats = getSrStats();
    if (stats.due === 0) {
      card.classList.add('is-hidden');
      return;
    }
    card.classList.remove('is-hidden');
    const headline = document.getElementById('sr-review-card-headline');
    const statsEl = document.getElementById('sr-review-card-stats');
    if (headline) {
      if (stats.due <= SR_SESSION_CAP) {
        headline.textContent = stats.due === 1
          ? '1 card due for review'
          : stats.due + ' cards due for review';
      } else {
        headline.textContent = SR_SESSION_CAP + ' of ' + stats.due + ' cards due for review';
      }
    }
    if (statsEl) {
      const parts = [];
      if (stats.active > 0) parts.push(stats.active + ' active');
      if (stats.graduated > 0) parts.push(stats.graduated + ' graduated');
      statsEl.textContent = parts.length > 0 ? parts.join(' · ') : '';
    }
    // #6 — the home mini-forecast renders from renderBentoRecommended (the live
    // bento home surface); #sr-review-card is a hidden legacy stub.
  }

  // v4.85.7: SR queue scrub helper — extracted from startSrReview() to keep that
  // function under the 80-line tech-debt threshold. Runs both scrub passes:
  //   (1) v4.81.31 type-based: remove non-reviewable types (only mcq + multi-select)
  //   (2) v4.85.2 quality:     remove cards that fail current validators
  // Both passes also persist their scrubs to storage so bad cards don't resurface.
  // All errors swallowed defensively — scrub failure must never block a session.
  function _srScrubQueue(due) {
    // Pass 1: type-based scrub
    const reviewable = new Set(['mcq', 'multi-select']);
    const dueOk = due.filter(c => reviewable.has(c.type || 'mcq'));
    if (dueOk.length < due.length) {
      try {
        const queue = loadSrQueue();
        const cleaned = queue.filter(c => reviewable.has(c.type || 'mcq'));
        if (cleaned.length < queue.length) saveSrQueue(cleaned);
      } catch (_) { /* tolerate scrub errors — defensive only */ }
      due = dueOk;
    }
    // Pass 2: quality-based scrub
    try {
      const qualityOk = due.filter(c => {
        if (typeof _stemNumericMatchesAnswerCount === 'function' && !_stemNumericMatchesAnswerCount(c)) return false;
        if (typeof _multiSelectGroundTruthOk === 'function' && !_multiSelectGroundTruthOk(c)) return false;
        return true;
      });
      if (qualityOk.length < due.length) {
        const badIds = new Set(due.filter(c => !qualityOk.includes(c)).map(c => c.id || c.question));
        try {
          const queue = loadSrQueue();
          const cleaned = queue.filter(c => !badIds.has(c.id || c.question));
          if (cleaned.length < queue.length) saveSrQueue(cleaned);
        } catch (_) { /* tolerate scrub errors */ }
        due = qualityOk;
      }
    } catch (_) { /* tolerate quality-scrub errors */ }
    return due;
  }

  // #7 exam-aware front-load score (higher = review earlier). Combines weakness
  // (low streak, low ease, more lapses) with blueprint weight (the topic's exam
  // domain weight). Only used when an exam date is set; pure read of the entry.
  function _srExamPriority(e) {
    if (!e) return 0;
    const streak = e.correctStreak || 0;
    const ease = (typeof e.easeFactor === 'number') ? e.easeFactor : 2.5;
    const lapses = e.lapses || 0;
    let weak = (3 - Math.min(3, streak)) * 1.0 + (2.8 - ease) * 0.8 + Math.min(3, lapses) * 0.5;
    let bp = 0;
    try {
      if (typeof TOPIC_DOMAINS === 'object' && TOPIC_DOMAINS && typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS) {
        const dk = TOPIC_DOMAINS[e.topic];
        bp = (dk && DOMAIN_WEIGHTS[dk]) ? DOMAIN_WEIGHTS[dk] : 0;
      }
    } catch (_) {}
    return weak + bp * 2;   // blueprint nudge on top of weakness
  }

  function startSrReview() {
    let due = _srScrubQueue(getSrDueEntries());

    if (due.length === 0) {
      showToast('No cards due for review right now', 'info');
      return;
    }
    // #7 exam-aware front-load: when an exam is booked, surface weak + high-
    // blueprint-weight cards earlier (the cap below still bounds session length).
    // No exam set -> getSrDueEntries' oldest-first order is preserved untouched.
    const _examDays = (typeof getDaysToExam === 'function') ? getDaysToExam() : null;
    if (_examDays != null && _examDays > 0 && typeof _srExamPriority === 'function') {
      due.sort((a, b) => _srExamPriority(b) - _srExamPriority(a));
    }
    // v4.85.1: cap session size to SR_SESSION_CAP (20) to prevent review fatigue.
    // Queue stays intact — remaining cards surface on the next session or the
    // homepage "N remaining" prompt. 20 cards × ~30s = ~10 min, which is the
    // sweet spot for SR retention without fatigue (Anki best-practice range).
    const totalDueCount = due.length;
    // #8: cap to the user's chosen session size (default 30; hard ceiling SR_SESSION_CAP).
    const _srPrefs = loadSrPrefs();
    let _srCap = (_srPrefs.sessionSize === 'all')
      ? due.length
      : Math.min(_srPrefs.sessionSize || SR_SESSION_CAP, SR_SESSION_CAP);
    // GAP-1: free tier reviews 5 cards/day — gentle queue, extras wait for
    // tomorrow. If today's 5 are already done, say so instead of starting.
    // typeof guard: UAT vm fixtures eval this body without the helpers.
    if (typeof _srIsFreeTier === 'function' && _srIsFreeTier()) {
      const _freeLeft = Math.max(0, SR_FREE_DAILY_CAP - _srFreeReviewedToday());
      if (_freeLeft === 0) {
        showToast("Today's " + SR_FREE_DAILY_CAP + ' free reviews are done. ' + due.length + ' card' + (due.length === 1 ? ' is' : 's are') + ' saved for tomorrow · Pro clears the whole queue daily.', 'info');
        return;
      }
      _srCap = Math.min(_srCap, _freeLeft);
    }
    if (due.length > _srCap) {
      due = due.slice(0, _srCap);
    }
    _srSession = {
      cards: due,
      totalDueCount: totalDueCount,  // original queue size (for "N remaining" on completion)
      index: 0,
      answersGiven: 0,
      correctConfident: 0,
      correctUncertain: 0,
      wrong: 0,
      results: [],               // #2: per-card outcomes for the missed-card recap
      pickedLetter: null,        // v4.81.27 — letter-keyed pick for MCQ + commit-then-self-grade modes
      pickedLetters: new Set(),  // v4.81.30 — multi-letter picks for multi-select auto-grade mode
      pickedIdx: null,           // legacy — kept for any external observer
      revealed: false
    };
    showPage('sr-review');
    document.getElementById('sr-empty').hidden = true;
    document.getElementById('sr-complete').hidden = true;
    document.getElementById('sr-progress-row').hidden = false;
    _renderSrCard();
  }

  // v4.81.30: rewritten for commit-before-reveal across all 3 review modes.
  // User feedback: "im just reading the answers and self grading the risk of
  // this is that someone can just lie and say yeah i knew that when deep down
  // they didnt." Right — the v4.81.27/28 self-grade path showed the
  // explanation immediately, structurally encouraging self-deception.
  //
  // Three render modes now, all gated behind user commitment:
  //   1. MCQ AUTO-GRADE — pick one → reveal → auto-check (✓/✗) → confidence
  //   2. MULTI-SELECT AUTO-GRADE — toggle picks → Submit → reveal with
  //      ✓ correct picks, ✗ wrong picks, ⚠ missed correct → confidence
  //   3. COMMIT-THEN-SELF-GRADE (legacy null-answer fallback) — pick one
  //      → reveal explanation (no correctness markers) → self-grade buttons.
  //      Used only for cards where we lost the answer key (the v4.81.27
  //      addToSrQueue type-guard bug). User still commits before seeing
  //      the explanation, so the self-deception loophole is closed even
  //      in this fallback case.
  function _renderSrCard() {
    const host = document.getElementById('sr-card-host');
    if (!host || !_srSession) return;
    const i = _srSession.index;
    const total = _srSession.cards.length;
    const card = _srSession.cards[i];

    // Update progress
    const pTxt = document.getElementById('sr-progress-text');
    const pFill = document.getElementById('sr-progress-fill');
    if (pTxt) pTxt.textContent = (i + 1) + ' of ' + total;
    if (pFill) pFill.style.width = (((i + 1) / total) * 100).toFixed(1) + '%';

    if (!card) { _srEndReview(); return; }

    const stem = card.question || '';
    const topicLabel = card.topic || 'Unknown topic';
    const intervalLabel = card.intervalDays
      ? 'last interval ' + (card.intervalDays < 1 ? '<1' : Math.round(card.intervalDays)) + 'd'
      : 'first review';

    // #5 — why-it's-due microcopy (read-only from the entry).
    const _srRefreshIco = '<svg class="sr-why-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>';
    const _srStreak = card.correctStreak || 0;
    const _srLapses = card.lapses || 0;
    const _srIv = Math.round(card.intervalDays || 0);
    let whyDueHtml;
    if (_srStreak === 0 && _srLapses > 0) {
      whyDueHtml = '<div class="sr-why-due sr-why-rebuild">' + _srRefreshIco + 'Rebuilding · you missed this one last time</div>';
    } else if (_srIv >= 7) {
      whyDueHtml = '<div class="sr-why-due">' + _srRefreshIco + 'Last seen ' + _srIv + 'd ago</div>';
    } else {
      whyDueHtml = '<div class="sr-why-due">First few reviews</div>';
    }

    // #1 — retry pill (only on the wrong reveal of a card that has not already been retried).
    const srRetryPillHtml = !card._retry
      ? '<div class="sr-retry-pill">' + _srRefreshIco + 'We\'ll bring this back once more before you finish</div>'
      : '';

    const cardType = card.type || 'mcq';

    // Normalise options shape — accept either letter-keyed object {A:'..'}
    // or legacy array form.
    let optionLetters = [];
    let optionMap = {};
    if (card.options && typeof card.options === 'object' && !Array.isArray(card.options)) {
      optionMap = card.options;
      optionLetters = Object.keys(optionMap).sort();
    } else if (Array.isArray(card.options)) {
      card.options.forEach((o, idx) => {
        const letter = String.fromCharCode(65 + idx);
        optionMap[letter] = o;
      });
      optionLetters = Object.keys(optionMap).sort();
    }

    // Decide render mode.
    const hasMcqAnswer = (typeof card.answer === 'string' || typeof card.answer === 'number')
      && card.answer !== null && card.answer !== '';
    const hasMultiAnswers = cardType === 'multi-select'
      && Array.isArray(card.answers) && card.answers.length > 0;

    let renderMode;
    if (cardType === 'mcq' && hasMcqAnswer && optionLetters.length > 0) {
      renderMode = 'mcq-auto';
    } else if (cardType === 'multi-select' && hasMultiAnswers && optionLetters.length > 0) {
      renderMode = 'multi-auto';
    } else {
      renderMode = 'commit-self-grade';
    }

    let optionsHtml = '';
    let confidenceHtml = '';

    if (renderMode === 'mcq-auto') {
      // ── MCQ auto-grade: pick one → reveal → confidence ──
      const correctLetter = (typeof card.answer === 'number')
        ? String.fromCharCode(65 + card.answer)
        : String(card.answer);
      optionsHtml = '<div class="sr-options">' + optionLetters.map(letter => {
        let cls = 'sr-option';
        if (_srSession.revealed) {
          if (letter === correctLetter) cls += ' is-correct';
          else if (letter === _srSession.pickedLetter) cls += ' is-wrong';
        } else if (_srSession.pickedLetter === letter) {
          cls += ' is-picked';
        }
        const disabled = _srSession.revealed ? 'disabled' : '';
        return '<button type="button" class="' + cls + '" ' + disabled
          + ' onclick="srPickAnswer(\'' + letter + '\')" data-letter="' + letter + '">'
          + '<span class="sr-option-letter">' + letter + '</span>'
          + '<span class="sr-option-text">' + escHtml(optionMap[letter] || '') + '</span>'
          + '</button>';
      }).join('') + '</div>';

      if (_srSession.revealed) {
        const pickedCorrect = _srSession.pickedLetter === correctLetter;
        const explanation = card.explanation
          ? '<div class="sr-explanation"><strong>Why:</strong> ' + escHtml(card.explanation) + '</div>'
          : '';
        if (pickedCorrect) {
          confidenceHtml = explanation
            + '<div class="sr-confidence-row">'
            + '<div class="sr-confidence-label">How did that feel?</div>'
            + '<button type="button" class="sr-confidence-btn sr-confidence-confident" onclick="srMarkConfidence(\'correct-confident\')">'
            + 'Got it · was confident'
            + '<span class="sr-confidence-hint">interval grows fast</span></button>'
            + '<button type="button" class="sr-confidence-btn sr-confidence-uncertain" onclick="srMarkConfidence(\'correct-uncertain\')">'
            + 'Got it · was unsure'
            + '<span class="sr-confidence-hint">interval grows slowly</span></button>'
            + '</div>';
        } else {
          confidenceHtml = explanation
            + '<div class="sr-confidence-row">'
            + '<div class="sr-confidence-label" style="color: var(--red); font-weight: 600;">'
            + '✗ Wrong. This card resets to tomorrow.</div>'
            + srRetryPillHtml
            + '<button type="button" class="sr-confidence-btn sr-confidence-wrong" onclick="srMarkConfidence(\'wrong\')">'
            + 'Got it wrong → next card</button>'
            + '</div>';
        }
      }
    } else if (renderMode === 'multi-auto') {
      // ── Multi-select auto-grade: toggle picks → Submit → reveal with markers ──
      const correctSet = new Set(card.answers);
      const expectedCount = correctSet.size;
      const pickedSet = (_srSession.pickedLetters instanceof Set)
        ? _srSession.pickedLetters
        : new Set();

      optionsHtml = '<div class="sr-options sr-options-multi">' + optionLetters.map(letter => {
        let cls = 'sr-option';
        if (_srSession.revealed) {
          const isCorrect = correctSet.has(letter);
          const wasPicked = pickedSet.has(letter);
          if (isCorrect && wasPicked) cls += ' is-correct';
          else if (!isCorrect && wasPicked) cls += ' is-wrong';
          else if (isCorrect && !wasPicked) cls += ' is-missed';
        } else if (pickedSet.has(letter)) {
          cls += ' is-picked';
        }
        const disabled = _srSession.revealed ? 'disabled' : '';
        const onclick = _srSession.revealed
          ? ''
          : ' onclick="srToggleMultiPick(\'' + letter + '\')"';
        return '<button type="button" class="' + cls + '" ' + disabled + onclick + ' data-letter="' + letter + '">'
          + '<span class="sr-option-letter">' + letter + '</span>'
          + '<span class="sr-option-text">' + escHtml(optionMap[letter] || '') + '</span>'
          + '</button>';
      }).join('') + '</div>';

      if (!_srSession.revealed) {
        // Submit row — enabled when user picks at least 2 (or matches expected count if known)
        const pickedCount = pickedSet.size;
        const canSubmit = pickedCount >= 2;
        optionsHtml += '<div class="sr-multi-submit-row">'
          + '<span class="sr-multi-hint">Pick ' + expectedCount + ' answer'
          + (expectedCount === 1 ? '' : 's') + ' · ' + pickedCount + ' selected</span>'
          + '<button type="button" class="sr-multi-submit-btn"' + (canSubmit ? '' : ' disabled')
          + ' onclick="srSubmitMultiPick()">Reveal answer →</button>'
          + '</div>';
      } else {
        // Compute correctness — all-or-nothing
        const correctlyPicked = [...correctSet].every(l => pickedSet.has(l));
        const noWrongPicks = [...pickedSet].every(l => correctSet.has(l));
        const fullyCorrect = correctlyPicked && noWrongPicks;
        const explanation = card.explanation
          ? '<div class="sr-explanation"><strong>Why:</strong> ' + escHtml(card.explanation) + '</div>'
          : '';
        if (fullyCorrect) {
          confidenceHtml = explanation
            + '<div class="sr-confidence-row">'
            + '<div class="sr-confidence-label">How did that feel?</div>'
            + '<button type="button" class="sr-confidence-btn sr-confidence-confident" onclick="srMarkConfidence(\'correct-confident\')">'
            + 'Got it · was confident'
            + '<span class="sr-confidence-hint">interval grows fast</span></button>'
            + '<button type="button" class="sr-confidence-btn sr-confidence-uncertain" onclick="srMarkConfidence(\'correct-uncertain\')">'
            + 'Got it · was unsure'
            + '<span class="sr-confidence-hint">interval grows slowly</span></button>'
            + '</div>';
        } else {
          // Partial credit counts as wrong for SR purposes (forces re-review).
          const correctList = [...correctSet].sort().join(', ');
          confidenceHtml = explanation
            + '<div class="sr-confidence-row">'
            + '<div class="sr-confidence-label" style="color: var(--red); font-weight: 600;">'
            + '✗ Not quite. Correct answers were ' + escHtml(correctList) + '. This card resets to tomorrow.</div>'
            + srRetryPillHtml
            + '<button type="button" class="sr-confidence-btn sr-confidence-wrong" onclick="srMarkConfidence(\'wrong\')">'
            + 'Got it wrong → next card</button>'
            + '</div>';
        }
      }
    } else {
      // ── Commit-then-self-grade: pick one → reveal explanation → self-grade ──
      // For legacy null-answer cards (the v4.81.27-fixed addToSrQueue bug).
      // User still commits before seeing the explanation — the self-deception
      // loophole from v4.81.27/28 is closed even in this fallback.
      optionsHtml = '<div class="sr-options">' + optionLetters.map(letter => {
        let cls = 'sr-option';
        if (_srSession.pickedLetter === letter) cls += ' is-picked';
        const disabled = _srSession.revealed ? 'disabled' : '';
        const onclick = _srSession.revealed
          ? ''
          : ' onclick="srPickAnswer(\'' + letter + '\')"';
        return '<button type="button" class="' + cls + '" ' + disabled + onclick + ' data-letter="' + letter + '">'
          + '<span class="sr-option-letter">' + letter + '</span>'
          + '<span class="sr-option-text">' + escHtml(optionMap[letter] || '') + '</span>'
          + '</button>';
      }).join('') + '</div>';

      if (_srSession.revealed) {
        const explanation = card.explanation
          ? '<div class="sr-explanation"><strong>Why:</strong> ' + escHtml(card.explanation) + '</div>'
          : '';
        confidenceHtml = '<div class="sr-self-grade-banner">'
          + 'No saved answer key for this card · read the explanation, then mark how you actually did.'
          + '</div>'
          + explanation
          + '<div class="sr-confidence-row">'
          + '<div class="sr-confidence-label">How did you do?</div>'
          + '<button type="button" class="sr-confidence-btn sr-confidence-confident" onclick="srMarkConfidence(\'correct-confident\')">'
          + 'Got it · was confident'
          + '<span class="sr-confidence-hint">interval grows fast</span></button>'
          + '<button type="button" class="sr-confidence-btn sr-confidence-uncertain" onclick="srMarkConfidence(\'correct-uncertain\')">'
          + 'Got it · was unsure'
          + '<span class="sr-confidence-hint">interval grows slowly</span></button>'
          + '<button type="button" class="sr-confidence-btn sr-confidence-wrong" onclick="srMarkConfidence(\'wrong\')">'
          + '✗ Got it wrong'
          + '<span class="sr-confidence-hint">resets to tomorrow</span></button>'
          + '</div>';
      }
    }

    host.innerHTML = '<div class="sr-card">'
      + '<div class="sr-card-meta">'
      + '<span class="sr-meta-topic">' + escHtml(topicLabel) + '</span>'
      + '<span class="sr-meta-sep">·</span>'
      + '<span class="sr-meta-interval">' + intervalLabel + '</span>'
      + '<span class="sr-meta-sep">·</span>'
      + '<span class="sr-meta-streak">streak ' + (card.correctStreak || 0) + '</span>'
      + '</div>'
      + whyDueHtml
      + '<div class="sr-question">' + escHtml(stem) + '</div>'
      + optionsHtml
      + confidenceHtml
      + '</div>';
  }

  function srPickAnswer(letter) {
    if (!_srSession || _srSession.revealed) return;
    _srSession.pickedLetter = letter;
    _srSession.revealed = true;
    _renderSrCard();
  }

  // v4.81.30: multi-select review handlers — toggle picks + submit-to-reveal.
  // Multi-select is 2-3 correct answers from 5 options; user toggles picks
  // freely until clicking Submit, then the reveal shows correct/wrong/missed
  // markers per option. Caps "submit" at minimum 2 picks (enforces engagement
  // — clicking submit with 0 picks would be a self-deception loophole back).
  function srToggleMultiPick(letter) {
    if (!_srSession || _srSession.revealed) return;
    if (!(_srSession.pickedLetters instanceof Set)) {
      _srSession.pickedLetters = new Set();
    }
    if (_srSession.pickedLetters.has(letter)) {
      _srSession.pickedLetters.delete(letter);
    } else {
      _srSession.pickedLetters.add(letter);
    }
    _renderSrCard();
  }

  function srSubmitMultiPick() {
    if (!_srSession || _srSession.revealed) return;
    const picks = (_srSession.pickedLetters instanceof Set) ? _srSession.pickedLetters : new Set();
    if (picks.size < 2) return; // guard — Submit button is disabled in this case anyway
    _srSession.revealed = true;
    _renderSrCard();
  }

  function srMarkConfidence(outcome) {
    if (!_srSession || !_srSession.revealed) return;
    const card = _srSession.cards[_srSession.index];
    if (!card) return;

    if (card._retry) {
      // #1: retry pass — re-exposure only. The card was already scheduled and
      // tallied on its first attempt this session, so do not re-do either, and
      // do not append it again (one retry per card, max).
      _srSession.index++;
    } else {
      // Apply SM-2 scheduling — skipped in #8 top-up practice mode so extra
      // practice never reschedules real cards early (spacing stays pure).
      if (!_srSession.practice) updateSrEntry(card.qHash, outcome);

      // GAP-1: real (non-practice) reviews count against the free 5/day cap.
      // Retries don't reach this branch, so a card costs exactly one credit.
      // typeof guard: UAT vm fixtures eval this body without the helpers.
      if (!_srSession.practice && typeof _srBumpFreeReviewed === 'function') _srBumpFreeReviewed();

      // Tally
      _srSession.answersGiven++;
      if (outcome === 'correct-confident') _srSession.correctConfident++;
      else if (outcome === 'correct-uncertain') _srSession.correctUncertain++;
      else _srSession.wrong++;

      // #2: record the outcome for the end-of-session recap.
      _srSession.results.push({ card: card, outcome: outcome });

      // Advance
      _srSession.index++;

      // #1: a wrong answer comes back once more before the session ends — a
      // second active retrieval while it is fresh. The persisted reschedule
      // (reset to tomorrow, above) is unchanged; this clone is in-session only.
      if (outcome === 'wrong') {
        _srSession.cards.push(Object.assign({}, card, { _retry: true }));
      }
    }

    _srSession.pickedLetter = null;
    _srSession.pickedLetters = new Set(); // v4.81.30 — clear multi-select picks for next card
    _srSession.pickedIdx = null;          // legacy — kept for any external observer
    _srSession.revealed = false;

    if (_srSession.index >= _srSession.cards.length) {
      _srEndReview();
    } else {
      _renderSrCard();
    }
  }

  // #2 helper: resolve the human-readable correct answer for a recap row.
  function _srCorrectText(card) {
    let opts = {};
    if (card.options && typeof card.options === 'object' && !Array.isArray(card.options)) {
      opts = card.options;
    } else if (Array.isArray(card.options)) {
      card.options.forEach((o, i) => { opts[String.fromCharCode(65 + i)] = o; });
    }
    if (card.type === 'multi-select' && Array.isArray(card.answers) && card.answers.length) {
      return card.answers.map(l => opts[l]).filter(Boolean).join(', ');
    }
    if (card.answer != null && card.answer !== '') {
      const letter = (typeof card.answer === 'number') ? String.fromCharCode(65 + card.answer) : String(card.answer);
      return opts[letter] || '';
    }
    return '';
  }

  function _srEndReview() {
    document.getElementById('sr-card-host').innerHTML = '';
    document.getElementById('sr-progress-row').hidden = true;
    const completeEl = document.getElementById('sr-complete');
    const stats = document.getElementById('sr-complete-stats');
    if (stats && _srSession) {
      const total = _srSession.answersGiven;
      const cc = _srSession.correctConfident;
      const cu = _srSession.correctUncertain;
      const w = _srSession.wrong;

      let html = total === 0
        ? 'No cards reviewed.'
        : '<strong>' + total + ' cards reviewed.</strong> '
          + '<span style="color: var(--green)">' + cc + ' confident</span> · '
          + '<span style="color: var(--yellow)">' + cu + ' uncertain</span> · '
          + '<span style="color: var(--red)">' + w + ' wrong</span>.';

      // #4 — finishing a review credits the daily streak (idempotent per day,
      // gated on at least one card marked). Reuses updateStreak()'s same-day guard.
      if (total > 0) {
        const beforeStreak = getStreak().current;
        const s = updateStreak();
        const gained = s.current > beforeStreak;
        if (gained) _pendingStreakPulse = true;
        const flame = '<svg class="sr-streak-flame" viewBox="0 0 32 38" aria-hidden="true">'
          + '<defs><linearGradient id="srEndFlame" x1="0" y1="0" x2="0" y2="1">'
          + '<stop offset="0" stop-color="#ffb24d"/><stop offset="0.55" stop-color="#f9852f"/>'
          + '<stop offset="1" stop-color="#e0561c"/></linearGradient></defs>'
          + '<path fill="url(#srEndFlame)" d="M16 1c3 6-2 9-2 13 0 0-3-2-3-6C7 11 4 17 4 23a12 12 0 0 0 24 0c0-7-6-10-8-15-1-3-3-5-4-7z"/></svg>';
        html += '<div class="sr-streak">' + flame
          + '<div class="sr-streak-txt"><strong>Today\'s review counts.</strong><br>'
          + s.current + '-day streak · today\'s review keeps it going.</div>'
          + (gained ? '<span class="sr-streak-plus">+1</span>' : '')
          + '</div>';
      }

      // #2 — missed-card recap: wrong + uncertain, each with the correct answer
      // and a one-line why. Reads in-memory session results before they're discarded.
      const misses = (_srSession.results || []).filter(r => r.outcome === 'wrong' || r.outcome === 'correct-uncertain');
      if (misses.length > 0) {
        const queue = loadSrQueue();
        // Collapsed by default on phones, open on tablet/desktop.
        const open = (typeof window !== 'undefined' && window.matchMedia
          && window.matchMedia('(min-width: 601px)').matches) ? ' open' : '';
        let rows = '';
        misses.forEach(r => {
          const c = r.card;
          const entry = queue.find(e => e.qHash === c.qHash);
          const iv = entry ? Math.round(entry.intervalDays || 1) : 1;
          const chip = iv <= 1 ? 'back tomorrow' : ('back in ~' + iv + 'd');
          const chipCls = iv <= 1 ? 'sr-miss-resched' : 'sr-miss-resched sr-miss-later';
          const ans = _srCorrectText(c);
          const ansHtml = ans
            ? '<div class="sr-miss-ans"><span class="sr-miss-ok">✓</span> ' + escHtml(ans) + '</div>'
            : '';
          const whyHtml = c.explanation
            ? '<div class="sr-miss-why">' + escHtml(c.explanation) + '</div>'
            : '';
          rows += '<div class="sr-miss">'
            + '<div class="sr-miss-top"><span class="sr-miss-topic">' + escHtml(c.topic || 'Review') + '</span>'
            + '<span class="' + chipCls + '">' + chip + '</span></div>'
            + '<div class="sr-miss-stem">' + escHtml(c.question || '') + '</div>'
            + ansHtml + whyHtml
            + '</div>';
        });
        html += '<details class="sr-recap"' + open + '>'
          + '<summary class="sr-recap-summary">Review what you missed'
          + '<span class="sr-recap-count">' + misses.length + '</span></summary>'
          + rows + '</details>';
      }

      // v4.85.1: show remaining cards count + "Continue" button when session was capped
      const remaining = (typeof getSrStats === 'function') ? getSrStats().due : 0;
      if (remaining > 0) {
        if (typeof _srIsFreeTier === 'function' && _srIsFreeTier()
            && (SR_FREE_DAILY_CAP - _srFreeReviewedToday()) <= 0) {
          // GAP-1: today's 5 free reviews are spent — gentle queue note instead
          // of a Continue button that would bounce off the cap.
          html += '<div class="sr-remaining-row">'
            + '<span class="sr-remaining-text">' + remaining + ' more card' + (remaining === 1 ? '' : 's') + ' waiting · ready tomorrow. Pro clears the whole queue daily.</span>'
            + '<a class="btn btn-primary sr-continue-btn" href="https://certanvil.com/pricing" target="_blank" rel="noopener">Go Pro →</a>'
            + '</div>';
        } else {
          const remMin = Math.max(2, Math.round(Math.min(remaining, SR_SESSION_CAP) * 0.5));
          html += '<div class="sr-remaining-row">'
            + '<span class="sr-remaining-text">' + remaining + ' more card' + (remaining === 1 ? '' : 's') + ' still due</span>'
            + '<button class="btn btn-primary sr-continue-btn" onclick="startSrReview()">Continue · ~' + remMin + ' min →</button>'
            + '</div>';
        }
      }
      // #8 top-up — on a light day, offer extra practice on weak topics (helper
      // returns the block or ''). Never shown after a practice session itself.
      if (!_srSession.practice && typeof _srTopUpHtml === 'function') html += _srTopUpHtml(remaining);
      stats.innerHTML = html;
      // Bind the top-up launcher in JS (Sec-P7: no inline on*= handlers).
      const _topBtn = document.getElementById('sr-topup-btn');
      if (_topBtn) _topBtn.addEventListener('click', function () { if (typeof startSrTopUp === 'function') startSrTopUp(); });
      // #8 AI-fallback launcher (generate fresh weak-topic practice).
      const _genBtn = document.getElementById('sr-topup-gen-btn');
      if (_genBtn) _genBtn.addEventListener('click', function () { if (typeof startSrGenTopUp === 'function') startSrGenTopUp(); });
    }
    if (completeEl) completeEl.hidden = false;
    // #6 — show the next-7-days forecast on the complete screen (full variant).
    const fcEl = document.getElementById('sr-forecast-complete');
    if (fcEl && typeof renderSrForecast === 'function') renderSrForecast(fcEl, {});
    // Refresh the homepage card since the queue changed
    if (typeof renderSrReviewCard === 'function') renderSrReviewCard();
  }

  // #8 top-up source (decision #3): ahead-of-schedule weak SR cards for this cert,
  // weakest first. These are real cards practiced WITHOUT rescheduling, so the
  // top-up never pulls a not-yet-due card into the real review path.
  function _srBuildTopUp(limit) {
    const queue = (typeof loadSrQueue === 'function') ? loadSrQueue() : [];
    const now = Date.now();
    const lim = limit || SR_SESSION_CAP;
    const ahead = queue.filter(e => e && !e.graduated && (e.nextReview || 0) > now);
    const clean = (typeof _srScrubQueue === 'function') ? _srScrubQueue(ahead) : ahead;
    clean.sort((a, b) => _srExamPriority(b) - _srExamPriority(a));
    return clean.slice(0, lim).map(c => Object.assign({}, c));
  }

  // #8 top-up block on the complete screen — only on a light day (due below the
  // threshold) when the user has top-up enabled and weak ahead-of-schedule cards
  // exist. Returns the block html or '' (clearly separate "extra practice" panel).
  function _srTopUpHtml(remaining) {
    const prefs = (typeof loadSrPrefs === 'function') ? loadSrPrefs() : { topUp: true };
    if (!prefs.topUp || remaining >= SR_LIGHT_DAY_THRESHOLD) return '';
    const extra = _srBuildTopUp(SR_SESSION_CAP);
    if (extra.length) {
      const n = Math.min(extra.length, 10);
      return '<div class="sr-topup">'
        + '<div class="sr-topup-eyebrow">Light day · extra practice</div>'
        + '<div class="sr-topup-body">Top up with ' + n + ' weak-topic card' + (n === 1 ? '' : 's') + '. Practice only, it won\'t change your review schedule.</div>'
        + '<button type="button" class="btn sr-topup-btn" id="sr-topup-btn">Top up · extra practice &rarr;</button>'
        + '</div>';
    }
    // Fallback (decision #3): too few ahead-of-schedule cards to practice. Offer
    // a freshly generated weak-topic set instead — but only when an API key is
    // set, since it runs the same validated quiz pipeline (fetchQuestions ->
    // aiValidateQuestions -> validateQuestions). No key -> hide (nothing to do).
    const _key = (typeof getApiKey === 'function')
      ? getApiKey()
      : (function () { try { return localStorage.getItem(STORAGE.KEY) || ''; } catch (e) { return ''; } })();
    if (!_key) return '';
    return '<div class="sr-topup">'
      + '<div class="sr-topup-eyebrow">Light day · extra practice</div>'
      + '<div class="sr-topup-body">No spare review cards right now. Generate a fresh 10-question set on your weakest topics, checked the same way as every quiz.</div>'
      + '<button type="button" class="btn sr-topup-btn" id="sr-topup-gen-btn">Generate weak-topic practice &rarr;</button>'
      + '</div>';
  }

  // #8 top-up AI fallback — generate a fresh weak-topic practice quiz through the
  // standard validated pipeline. Reuses the 'focused' preset (weakest topic ->
  // fetchQuestions -> aiValidateQuestions -> validateQuestions -> quiz), so the
  // questions get the identical 7-layer validation as every other quiz, and any
  // the user misses enrol into the SR queue (the normal learning loop).
  function startSrGenTopUp() {
    if (typeof applyPreset === 'function') applyPreset('focused');
  }

  // #8 launch a top-up practice session. Reuses the review UI but flags the
  // session as practice so srMarkConfidence skips rescheduling.
  function startSrTopUp() {
    const cards = _srBuildTopUp(SR_SESSION_CAP);
    if (!cards.length) { showToast('No extra practice cards available right now', 'info'); return; }
    _srSession = {
      cards: cards,
      totalDueCount: cards.length,
      index: 0,
      answersGiven: 0,
      correctConfident: 0,
      correctUncertain: 0,
      wrong: 0,
      results: [],
      pickedLetter: null,
      pickedLetters: new Set(),
      pickedIdx: null,
      revealed: false,
      practice: true   // #8: extra practice — never reschedules real cards
    };
    showPage('sr-review');
    document.getElementById('sr-empty').hidden = true;
    document.getElementById('sr-complete').hidden = true;
    document.getElementById('sr-progress-row').hidden = false;
    _renderSrCard();
  }

  // ── Public API (window exposure) ─────────────────────────────────────────
  // SR prefs / queue persistence
  window.loadSrPrefs              = loadSrPrefs;
  window.saveSrPrefs              = saveSrPrefs;
  window.loadSrQueue              = loadSrQueue;
  window.saveSrQueue              = saveSrQueue;
  // SR queue manipulation
  window.addToSrQueue             = addToSrQueue;
  window.updateSrEntry            = updateSrEntry;
  window._srScrubQueue            = _srScrubQueue;
  // SR stats / query
  window.getSrDueCount            = getSrDueCount;
  window.getSrDueEntries          = getSrDueEntries;
  window.getSrStats               = getSrStats;
  // SR forecast
  window.buildSrForecast          = buildSrForecast;
  window.renderSrForecast         = renderSrForecast;
  // SR review UI
  window.renderSrReviewCard       = renderSrReviewCard;
  window.startSrReview            = startSrReview;
  window._renderSrCard            = _renderSrCard;
  window.srPickAnswer             = srPickAnswer;
  window.srToggleMultiPick        = srToggleMultiPick;
  window.srSubmitMultiPick        = srSubmitMultiPick;
  window.srMarkConfidence         = srMarkConfidence;
  window._srEndReview             = _srEndReview;
  // SR top-up (AI)
  window.startSrGenTopUp          = startSrGenTopUp;
  window.startSrTopUp             = startSrTopUp;

  window._certanvilFeatures['sr-review'] = {
    loadSrPrefs: loadSrPrefs,
    saveSrPrefs: saveSrPrefs,
    loadSrQueue: loadSrQueue,
    addToSrQueue: addToSrQueue,
    getSrDueCount: getSrDueCount,
    getSrDueEntries: getSrDueEntries,
    getSrStats: getSrStats,
    buildSrForecast: buildSrForecast,
    renderSrForecast: renderSrForecast,
    renderSrReviewCard: renderSrReviewCard,
    startSrReview: startSrReview,
  };

  // ── SR eager init ────────────────────────────────────────────────────────
  // Pattern E hazard (#138 wave 10): home.js loads BEFORE this module (script
  // order in index.html) and its own self-trigger (_homeInit) calls
  // renderHeroV2() -> renderBentoRecommended() synchronously at parse time,
  // which reads getSrStats() to decide whether the home "Recommended" tile
  // should show due SR reviews. At that moment this module hasn't executed
  // yet, so getSrStats is undefined and the tile falls through to its
  // no-reviews-due branch even when cards ARE due. Re-render the tile here,
  // now that getSrStats is available, so it corrects itself immediately
  // after this script's own execution (still before DOMContentLoaded).
  function _srReviewInit() {
    try {
      if (typeof renderBentoRecommended === 'function') renderBentoRecommended();
    } catch (e) {
      console.warn('[sr-review.js init]', e && e.message);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _srReviewInit);
  } else {
    _srReviewInit();
  }
})();
