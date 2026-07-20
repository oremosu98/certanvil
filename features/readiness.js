/* Readiness system — extracted from app.js (#138 wave 7).
 * Eager-loaded feature (script defer after app.js, before quiz-engine).
 * Mechanical move: function bodies identical to app.js @ 8cfba59.
 * Regions: EXAM READINESS SCORE (L7803–L8355) + streak/subtopics (L8420–L8496)
 *   + readiness cards + session plan (L9480–L9869) + hero-v2 readiness (L13933–L14057).
 * STAYS in app.js: _scaledExamScore (MILESTONE_CHECKS lambda ref), MILESTONE_CHECKS,
 *   evaluateMilestones (refs MILESTONE_CHECKS), computeWeakSpotScores (shared hub),
 *   _sampleTopicsForMixedBatch/_parseMultiTopicSentinel (quiz engine callers). */
(function () {
  'use strict';
  function diffWeight(d) {
    if (!d) return 1.5;
    const s = d.toLowerCase();
    if (s.includes('hard'))  return 2.0;
    if (s.includes('exam'))  return 1.5;
    if (s.includes('found')) return 1.0;
    return 1.3;
  }

  // Build a per-topic weighted-accuracy map from history entries.
  // Weights: difficulty × exam-mode boost (1.3 for exam mode) × recency boost
  // (2.0 for sessions in the last 7 days). Extracted from getReadinessScore (#18).
  function buildWeightedTopicMap(historyEntries, now) {
    const SEVEN_DAYS_MS = 7 * 86400000;
    const topicMap = {};
    historyEntries.forEach(e => {
      if (!topicMap[e.topic]) topicMap[e.topic] = { wCorrect: 0, wTotal: 0, lastDate: 0 };
      const sessionTime = new Date(e.date).getTime();
      const isRecent = (now - sessionTime) <= SEVEN_DAYS_MS;
      const examBoost = (e.mode === 'exam') ? 1.3 : 1.0;
      const recencyBoost = isRecent ? 2.0 : 1.0;
      const w = diffWeight(e.difficulty) * examBoost * recencyBoost;
      topicMap[e.topic].wCorrect += e.score * w;
      topicMap[e.topic].wTotal   += e.total * w;
      if (sessionTime > topicMap[e.topic].lastDate) topicMap[e.topic].lastDate = sessionTime;
    });
    return topicMap;
  }

  function getReadinessScore() {
    const allTopics = Array.from(document.querySelectorAll('#topic-group .chip'))
      .map(c => c.dataset.v)
      .filter(v => !v.includes('Mixed') && !v.includes('Smart'));
    const totalTopics = allTopics.length;

    // v4.85.15: dropped the `e.total >= 3` filter. v4.85.8's TOPIC LOTTERY +
    // v4.85.15's mixed-split now produce 1-Q-per-topic split rows; the >=3
    // filter was throwing those away, so a 20-Q Mixed quiz contributed 0
    // topics to coverage. Aggregation in buildWeightedTopicMap sums across
    // sessions per topic, so noise control still works at the topic level.
    // MIXED + EXAM summary rows still filtered explicitly to avoid double-
    // counting (the per-topic splits cover them).
    // v7.2.3: cert-filter so readiness reflects only the current cert's exam.
    // Pre-v7.2.3 this was unfiltered → Sec+ users saw Net+ topics leak into their
    // whatIf chips (e.g. PKI showing on Net+) AND the Sec+ readiness card stayed
    // hidden because the downstream TOPIC_DOMAINS lookup filtered every cross-cert
    // history entry out anyway. _isCurrentCertTopic is the canonical helper for
    // this (see v4.99.26 buildSessionPlan, v5.5.7 renderHeroV2 lede +
    // renderContinueCard for the same class-of-bug-grep precedent).
    const h = loadHistory().filter(e =>
      e.topic !== MIXED_TOPIC && e.topic !== EXAM_TOPIC && _isCurrentCertTopic(e.topic)
    );
    if (h.length === 0) return null;

    const now = Date.now();
    const topicMap = buildWeightedTopicMap(h, now);

    const studiedTopics = Object.keys(topicMap);
    const studiedCount  = studiedTopics.length;

    // Domain-weighted accuracy — each CompTIA domain contributes its official weight.
    // Unstudied domains contribute 0, which drags the score down and incentivizes coverage.
    //
    // v4.42.4: Within-domain aggregation fix. Previously this computed the simple
    // average of per-topic accuracies (`pctSum / count`), which gave equal weight
    // to a topic with 2 questions and one with 200. The real CompTIA exam weights
    // every question equally — so if you're 95% on OSPF (20 Q's) and 50% on BGP
    // (4 Q's), your real-exam-equivalent implementation accuracy is (19+2)/(20+4)
    // = 87.5%, not the simple average of 72.5%. The v4.42.3 catalog expansion
    // made this flaw more visible because new child topics start with 0 questions
    // while parent umbrellas have lots. Now aggregates weighted-correct /
    // weighted-total across all topics in the domain, so question count properly
    // influences domain-level accuracy.
    const domainBuckets = {};
    Object.keys(DOMAIN_WEIGHTS).forEach(d => { domainBuckets[d] = { wCorrect: 0, wTotal: 0 }; });
    studiedTopics.forEach(t => {
      const domain = TOPIC_DOMAINS[t];
      if (!domain) return; // topics not in map (e.g. Mixed) are excluded
      domainBuckets[domain].wCorrect += topicMap[t].wCorrect;
      domainBuckets[domain].wTotal   += topicMap[t].wTotal;
    });
    const domainAccuracy = {};
    let accuracyScore = 0;
    Object.keys(DOMAIN_WEIGHTS).forEach(d => {
      const bucket = domainBuckets[d];
      const avg = bucket.wTotal > 0 ? (bucket.wCorrect / bucket.wTotal) * 100 : 0;
      domainAccuracy[d] = avg;
      accuracyScore += avg * DOMAIN_WEIGHTS[d];
    });

    const coverageRaw = (studiedCount / totalTopics) * 100;
    const coverageScore = studiedCount < 5 ? coverageRaw * 0.5 : coverageRaw;

    const recencyScore = studiedTopics.reduce((sum, t) => {
      const daysSince = (now - topicMap[t].lastDate) / 86400000;
      return sum + Math.max(0, 1 - daysSince / 14) * 100;
    }, 0) / totalTopics;

    const totalQs    = h.reduce((sum, e) => sum + e.total, 0);
    const volumeScore = Math.min(totalQs / 500, 1) * 100;

    const raw = (accuracyScore * 0.40) + (coverageScore * 0.25) + (recencyScore * 0.20) + (volumeScore * 0.15);
    const predicted = Math.round(420 + (raw / 100) * 450);

    let worstTopic = null, worstPct = 101;
    allTopics.forEach(t => {
      if (!topicMap[t]) {
        if (worstTopic === null) { worstTopic = t; worstPct = -1; }
      } else {
        const pct = Math.round((topicMap[t].wCorrect / topicMap[t].wTotal) * 100);
        if (worstPct === -1) return;
        if (pct < worstPct) { worstPct = pct; worstTopic = t; }
      }
    });

    // ── v4.73.0: Pass-rate prediction extras ──
    // Confidence interval, pass probability, what-if attribution, trajectory.
    // The data quality (sample size + coverage + recency) drives the CI width.
    // The wider the CI, the less confidently we can predict the real exam score.
    const sampleWidth = 60 / Math.sqrt(1 + totalQs / 50);
    const coverageFactor = totalTopics > 0 ? studiedCount / totalTopics : 0;
    const recencyFactor = recencyScore / 100;
    const coverageWidth = 30 * (1 - coverageFactor);
    const recencyWidth = 15 * (1 - recencyFactor);
    let ciHalfWidth = sampleWidth + coverageWidth + recencyWidth;
    ciHalfWidth = Math.max(15, Math.min(100, Math.round(ciHalfWidth)));
    const lowerBound = Math.max(420, predicted - ciHalfWidth);
    const upperBound = Math.min(870, predicted + ciHalfWidth);

    // Pass probability via logistic centered on the pass line. Sigma derived
    // from CI half-width (90% CI ≈ ±1.645σ). Result is 0-1.
    const sigma = ciHalfWidth / 1.645;
    const z = (predicted - EXAM_PASS_SCORE) / sigma;
    const passProbability = 1 / (1 + Math.exp(-z));

    // What-if attribution: for each studied topic, compute the predicted-score
    // delta if that topic improved to 80% accuracy. Surfaces the highest-leverage
    // topics — not just the lowest-mastery, but the ones whose mastery would
    // most move the final score (factors in domain weight + question count).
    const TARGET_ACC = 0.80;
    const whatIfsRaw = [];
    studiedTopics.forEach(t => {
      const tData = topicMap[t];
      const domain = TOPIC_DOMAINS[t];
      if (!domain) return;
      const bucket = domainBuckets[domain];
      if (!bucket || bucket.wTotal === 0) return;

      const currentAcc = tData.wTotal > 0 ? tData.wCorrect / tData.wTotal : 0;
      const currentPct = Math.round(currentAcc * 100);
      if (currentAcc >= TARGET_ACC) return;

      const newWCorrect = TARGET_ACC * tData.wTotal;
      const deltaWCorrect = newWCorrect - tData.wCorrect;
      // New domain accuracy if THIS topic improved to TARGET_ACC
      const newDomainAcc = ((bucket.wCorrect + deltaWCorrect) / bucket.wTotal) * 100;
      const oldDomainAcc = (bucket.wCorrect / bucket.wTotal) * 100;
      const deltaDomainAccPts = newDomainAcc - oldDomainAcc;
      // Score delta: deltaDomainAcc * domain weight * accuracy weight (0.40) * scale (4.5)
      const deltaAccScore = deltaDomainAccPts * DOMAIN_WEIGHTS[domain];
      const deltaPredicted = Math.round(deltaAccScore * 0.40 * 4.5);

      if (deltaPredicted >= 1) {
        whatIfsRaw.push({ topic: t, domain, currentPct, targetPct: 80, deltaPredicted });
      }
    });
    whatIfsRaw.sort((a, b) => b.deltaPredicted - a.deltaPredicted);
    const whatIf = whatIfsRaw.slice(0, 3);

    // Days to exam + the gap to a confident pass (lower CI bound above 720).
    const daysToExam = (typeof getDaysToExam === 'function') ? getDaysToExam() : null;
    const targetGap = Math.max(0, EXAM_PASS_SCORE - lowerBound);

    // v4.85.14: stale-topic list for the "Why your score?" breakdown card.
    // Sorted oldest-first so the renderer can take the top N stalest topics
    // and seed a refresh quiz to lift the recency component back up. Topics
    // not yet studied (no entry in topicMap) are not included — they're a
    // coverage problem, not a recency problem.
    const staleTopics = studiedTopics
      .map(t => ({ topic: t, daysSince: Math.round((now - topicMap[t].lastDate) / 86400000) }))
      .sort((a, b) => b.daysSince - a.daysSince);

    return {
      predicted, raw,
      accuracyScore, coverageScore, recencyScore, volumeScore,
      domainAccuracy,
      worstTopic,
      worstPct: worstPct === -1 ? null : worstPct,
      studiedCount,
      totalTopics,
      totalQs,
      // v4.73.0 prediction extras
      ciHalfWidth,
      lowerBound,
      upperBound,
      passProbability,
      whatIf,
      daysToExam,
      targetGap,
      // v4.85.14 — stale-topic list for the score-breakdown card
      staleTopics
    };
  }

  // v4.99.0 — readiness snapshot writer (cross-cert analytics Phase A.5).
  // v4.99.1 — enriched with weak_topic + weak_pct + weak_domain + days_to_exam
  //           + total_qs so landing's Panel 3 ranker (Phase C) can produce
  //           specific recommendations rather than generic "continue studying."
  //
  // Computes the user's current readiness for the active cert and writes a
  // per-cert snapshot under a single STORAGE.READINESS_SNAPSHOTS key shaped
  // like { netplus: {score, computed_at, weak_topic, ...}, secplus: {...} }.
  // Triggered from finish() (quiz complete) and submitExam() (exam complete)
  // — natural moments where readiness changes meaningfully.
  //
  // Cloud-flushed via existing Phase C′ pattern so landing's /analytics page
  // reads it from profile.metadata.nplus_readiness_snapshots and renders
  // live readiness gauges + actionable next-up recommendations across the
  // user's whole portfolio.
  //
  // Defensive: silently no-ops on any failure so a snapshot write never
  // blocks a quiz/exam from finishing. The score will get rewritten on the
  // next quiz finish anyway.
  // v7.52.0: read the per-cert readiness snapshot map for the Pro multi-plan list.
  function _readReadinessSnapshots() {
    try { return JSON.parse(localStorage.getItem(STORAGE.READINESS_SNAPSHOTS) || '{}') || {}; }
    catch (_) { return {}; }
  }

  function _writeReadinessSnapshot() {
    try {
      var readiness = getReadinessScore();
      if (!readiness || typeof readiness.predicted !== 'number') return;
      var raw = localStorage.getItem(STORAGE.READINESS_SNAPSHOTS);
      var snapshots = {};
      if (raw) {
        try { snapshots = JSON.parse(raw) || {}; } catch (_) { snapshots = {}; }
      }
      // Resolve the weak topic's domain via the existing TOPIC_DOMAINS map
      // (cert-app source of truth for topic → domain). null if unmapped.
      var weakDomain = null;
      if (readiness.worstTopic && typeof TOPIC_DOMAINS !== 'undefined') {
        weakDomain = TOPIC_DOMAINS[readiness.worstTopic] || null;
      }
      snapshots[CURRENT_CERT] = {
        score: readiness.predicted,
        computed_at: new Date().toISOString(),
        // v4.99.1: ranker signals for Panel 3
        weak_topic: readiness.worstTopic || null,
        weak_pct: typeof readiness.worstPct === 'number' ? readiness.worstPct : null,
        weak_domain: weakDomain,
        days_to_exam: typeof readiness.daysToExam === 'number' ? readiness.daysToExam : null,
        total_qs: typeof readiness.totalQs === 'number' ? readiness.totalQs : null
      };
      localStorage.setItem(STORAGE.READINESS_SNAPSHOTS, JSON.stringify(snapshots));
      if (typeof _cloudFlush === 'function') _cloudFlush(STORAGE.READINESS_SNAPSHOTS);
    } catch (_) { /* non-fatal — never block quiz finish */ }
  }

  // ── Exam date storage + forecast ──
  function getExamDate() {
    const raw = localStorage.getItem(STORAGE.EXAM_DATE);
    return raw || null;
  }
  function setExamDate(isoDate) {
    if (!isoDate) { localStorage.removeItem(STORAGE.EXAM_DATE); _cloudFlush(STORAGE.EXAM_DATE); return; }
    localStorage.setItem(STORAGE.EXAM_DATE, isoDate);
    _cloudFlush(STORAGE.EXAM_DATE);
  }
  function getDaysToExam() {
    const raw = getExamDate();
    if (!raw) return null;
    const examMs = new Date(raw).getTime();
    if (isNaN(examMs)) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return Math.ceil((examMs - today) / 86400000);
  }
  function getReadinessForecast() {
    // Linear regression on raw score over the last N sessions to project when we
    // hit the pass threshold. Returns null if insufficient data or flat/negative trend.
    // v7.2.3: cert-filter mirrors getReadinessScore — forecast projects the
    // current cert's exam only (the only sensible semantic since each cert has
    // its own pass mark + domain weights).
    const h = loadHistory().filter(e =>
      e.topic !== MIXED_TOPIC && e.topic !== EXAM_TOPIC && e.total >= 3 && _isCurrentCertTopic(e.topic)
    );
    if (h.length < 5) return null;
    // Use the last 14 sessions (history is newest-first, so take .slice(0, 14).reverse())
    const recent = h.slice(0, 14).reverse();
    // Compute cumulative raw-score trajectory: for each session endpoint, what was raw?
    // Approximation: use per-session pct as the proxy (avoids re-running full getReadinessScore per session)
    const points = recent.map((e, i) => ({ x: i, y: e.pct }));
    const n = points.length;
    const sumX  = points.reduce((a, p) => a + p.x, 0);
    const sumY  = points.reduce((a, p) => a + p.y, 0);
    const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
    const sumXX = points.reduce((a, p) => a + p.x * p.x, 0);
    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return null;
    const slope     = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    const currentProj = slope * (n - 1) + intercept;

    // Target: 75% avg pct → roughly correlates with a 720 pass score when coverage is decent
    const TARGET_PCT = 75;
    if (slope <= 0.1) {
      return { slope, currentProj, sessionsToTarget: null, trendFlat: true };
    }
    const sessionsNeeded = Math.max(0, Math.ceil((TARGET_PCT - currentProj) / slope));
    // Convert sessions to days using observed session cadence
    const firstDate = new Date(recent[0].date).getTime();
    const lastDate  = new Date(recent[recent.length - 1].date).getTime();
    const daySpan   = Math.max(1, (lastDate - firstDate) / 86400000);
    const sessionsPerDay = n / daySpan; // sessions per calendar day in the window
    const daysToTarget = sessionsPerDay > 0 ? Math.ceil(sessionsNeeded / sessionsPerDay) : null;
    return { slope, currentProj, sessionsToTarget: sessionsNeeded, daysToTarget, trendFlat: false };
  }

  // ── Per-question-type accuracy tracking (MCQ vs PBQ) ──
  function getTypeStats() {
    try { return JSON.parse(localStorage.getItem(STORAGE.TYPE_STATS) || '{}'); } catch { return {}; }
  }
  function updateTypeStat(type, wasCorrect) {
    if (!type) type = 'mcq';
    try {
      const stats = getTypeStats();
      if (!stats[type]) stats[type] = { seen: 0, correct: 0 };
      stats[type].seen++;
      if (wasCorrect) stats[type].correct++;
      localStorage.setItem(STORAGE.TYPE_STATS, JSON.stringify(stats));
      _cloudFlush(STORAGE.TYPE_STATS);
    } catch {}
  }

  // ── Milestones tracking ──
  // Canonical cert key for namespacing (falls back to 'netplus' = legacy cert).
  function _certKey() {
    try { return (window.CURRENT_CERT || CURRENT_CERT || 'netplus'); } catch (_) { return 'netplus'; }
  }
  // Read the whole {cert:{id:ts}} map, migrating the legacy flat shape on the fly.
  // opts.prune (default off) is passed straight through to _migrateMilestoneShape:
  // callers that DISPLAY want the pruned view; the WRITE path must NOT prune
  // (see unlockMilestone) so a write never deletes other certs'/devices' ids.
  function _allMilestones(opts) {
    let raw;
    try { raw = JSON.parse(localStorage.getItem(STORAGE.MILESTONES) || '{}'); } catch { raw = {}; }
    return _migrateMilestoneShape(raw, opts);
  }
  // Old shape = {id: ISOstring}. New shape = {cert: {id: ISOstring}}.
  // Detect old: every value is a string (and there's at least one). The flat→nested
  // wrap ALWAYS happens; orphan-pruning (delete ids not in the live-defs set) is
  // OPT-IN via opts.prune === true so it can be kept off the write path.
  // Pure: references only its args + (opts.liveIds || MILESTONE_DEFS) — vm-testable.
  // Idempotent: object values pass through; empty {} stays {} (not {netplus:{}}).
  function _migrateMilestoneShape(raw, opts) {
    if (!raw || typeof raw !== 'object') return {};
    const vals = Object.values(raw);
    const isOldFlat = vals.length > 0 && vals.every(v => typeof v === 'string');
    let map = isOldFlat ? { netplus: raw } : raw;
    if (opts && opts.prune === true) {
      const liveIds = (opts && opts.liveIds) ? opts.liveIds
        : (typeof MILESTONE_DEFS !== 'undefined' ? new Set(MILESTONE_DEFS.map(d => d.id)) : null);
      if (liveIds) {
        Object.keys(map).forEach(cert => {
          const sub = map[cert];
          if (sub && typeof sub === 'object') {
            Object.keys(sub).forEach(id => { if (!liveIds.has(id)) delete sub[id]; });
          }
        });
      }
    }
    return map;
  }
  function getMilestones() {
    // Display path: prune orphaned (no-longer-defined) ids from the current cert's
    // view. Return a shallow copy so callers can't mutate the freshly-parsed map.
    const all = _allMilestones({ prune: true });
    return { ...(all[_certKey()] || {}) };
  }
  function unlockMilestone(key) {
    // Persist the UNPRUNED map: an unlock must never delete other ids/certs from
    // the cloud-flushed blob (cloud is source of truth on iOS/Safari; a staged
    // rollout where this device has a newer MILESTONE_DEFS could otherwise wipe
    // another device's still-valid entries). Orphan-pruning is display-only.
    const all = _allMilestones(); // no prune
    const cert = _certKey();
    const sub = all[cert] || (all[cert] = {});
    if (sub[key]) return false;
    sub[key] = new Date().toISOString();
    // _cloudFlush relies on cloudStore.flush being hydration-gated, so a
    // pre-hydrate unlock can't clobber cloud with a stale/partial map.
    try { localStorage.setItem(STORAGE.MILESTONES, JSON.stringify(all)); _cloudFlush(STORAGE.MILESTONES); } catch {}
    return true;
  }

  // ── Task 3: per-cert drill stats ─────────────────────────────────────────────
  // Shape: { cert: { simlab:{done,perfect}, decision:{done,perfect}, whynot:{done,perfect},
  //                  gauntlet:{done,perfect} } }
  function _allDrillStats() {
    try { return JSON.parse(localStorage.getItem(STORAGE.DRILL_STATS) || '{}'); } catch { return {}; }
  }
  function getDrillStats() {
    const all = _allDrillStats();
    return all[_certKey()] || {};
  }
  // drill: 'simlab'|'decision'|'whynot'|'gauntlet'; field: 'done'|'perfect'
  function bumpDrillStat(drill, field, by) {
    const all = _allDrillStats();
    const cert = _certKey();
    const sub = all[cert] || (all[cert] = {});
    const d = sub[drill] || (sub[drill] = { done: 0, perfect: 0 });
    d[field] = (d[field] || 0) + (by || 1);
    try { localStorage.setItem(STORAGE.DRILL_STATS, JSON.stringify(all)); _cloudFlush(STORAGE.DRILL_STATS); } catch {}
    return d;
  }

  // Milestone definitions — keyed by id, evaluated against current state
  const MILESTONE_DEFS = [
    // v7.50.x: decorative emoji icons removed — the .ana-milestone-icon slot is
    // display:none in the editorial theme (dg-system.css), so these were dead
    // markup (BRAND §9 · no emoji-as-icons). Labels/descs are the real surface.
    { id: 'first_quiz',       label: 'First steps',         desc: 'Complete your first quiz' },
    { id: 'hundred_qs',       label: 'Century',             desc: 'Answer 100 questions' },
    { id: 'five_hundred_qs',  label: 'Grinder',             desc: 'Answer 500 questions' },
    { id: 'thousand_qs',      label: 'Iron will',           desc: 'Answer 1,000 questions' },
    { id: 'first_exam',       label: 'Exam rehearsal',      desc: 'Complete your first exam simulation' },
    { id: 'exam_pass',        label: 'Passing grade',       desc: `Score ${EXAM_PASS_SCORE}+ on any exam simulation` },
    { id: 'all_domains',      label: 'Full coverage',       desc: 'Study at least one topic in all 5 domains' },
    { id: 'all_topics',       label: 'Completionist',       desc: 'Attempt every topic at least once' },
    { id: 'streak_7',         label: 'Week warrior',        desc: '7-day study streak' },
    { id: 'streak_30',        label: 'Month master',        desc: '30-day study streak' },
    { id: 'ready_650',        label: 'Getting close',       desc: 'Reach a readiness score of 650' },
    { id: 'ready_720',        label: 'Exam ready',          desc: `Reach a readiness score of ${EXAM_PASS_SCORE} (pass)` },
    { id: 'perfect_port',     label: 'Port master',         desc: 'Perfect round on Port Drill (40 correct)' },
    { id: 'streak_port_25',   label: 'Streak keeper',       desc: 'Reach a 25+ streak in Port Drill Endless mode' },
    // ── v4.10 expansion ──
    { id: 'perfect_quiz',     label: 'Flawless',            desc: 'Score 100% on a 10+ question quiz' },
    { id: 'five_exams',       label: 'Exam veteran',        desc: 'Complete 5 exam simulations' },
    { id: 'ten_exams',        label: 'Exam marathon',       desc: 'Complete 10 exam simulations' },
    { id: 'first_subnet',     label: 'Subnet initiate',     desc: 'Complete your first subnet drill' },
    { id: 'subnet_50',        label: 'Subnet surgeon',      desc: 'Answer 50 subnet drill questions' },
    { id: 'first_port_drill', label: 'Port pioneer',        desc: 'Complete your first Port Drill run' },
    { id: 'all_ports_seen',   label: 'Port cartographer',   desc: 'See every port in the Port Drill bank' },
    { id: 'first_session',    label: 'Plan starter',        desc: "Complete your first Study Plan" },
    { id: 'night_owl',        label: 'Night owl',           desc: 'Study between midnight and 5am' },
    { id: 'early_bird',       label: 'Early bird',          desc: 'Study before 7am' },
    { id: 'weekend_warrior',  label: 'Weekend warrior',     desc: 'Study on both Saturday and Sunday of the same week' },
    { id: 'diversity_5',      label: 'Renaissance',         desc: 'Study 5 different topics in a single day' },
    { id: 'deep_dive_10',     label: 'Curious mind',          desc: 'Use Explain Further 10 times' },
    { id: 'daily_challenge_7',label: 'Daily disciple',      desc: '7-day Daily Challenge streak' },
    { id: 'daily_challenge_30',label:'Daily devotee',       desc: '30-day Daily Challenge streak' },
    // ── v4.13: Hardcore exam (#48) ──
    { id: 'hardcore_pass',    label: 'Hardcore pass',       desc: `Score ${EXAM_PASS_SCORE}+ on a Hardcore exam simulation` },
    // ── v4.30.2: Lab milestones ──
    { id: 'first_lab',        label: 'Lab rat',             desc: 'Complete your first topology lab' },
    { id: 'labs_5',            label: 'Lab regular',         desc: 'Complete 5 different labs' },
    { id: 'labs_10',           label: 'Lab master',          desc: 'Complete 10 different labs' },
    { id: 'labs_all',          label: 'Lab completionist',   desc: 'Complete every available lab' },
    { id: 'simlab_first',      label: 'First console',    desc: 'Finish your first Sim Lab PBQ.' },
    { id: 'simlab_25',         label: 'Bench hours',      desc: 'Work through 25 Sim Lab PBQs.' },
    { id: 'simlab_ace',        label: 'Clean board',      desc: 'Finish a Sim Lab run with nothing wrong.' },
    { id: 'decision_first',    label: 'First call',       desc: 'Finish your first Decision Lab scenario.' },
    { id: 'decision_25',       label: 'On the clock',     desc: 'Work through 25 Decision Lab scenarios.' },
    { id: 'decision_flawless', label: 'Right every time', desc: 'Clear a Decision Lab scenario with no missed calls.' },
    { id: 'whynot_first',      label: 'First round',      desc: 'Finish your first Why-Not round.' },
    { id: 'whynot_25',         label: 'Why-Not regular',  desc: 'Work through 25 Why-Not rounds.' },
    { id: 'whynot_master',     label: 'Reads the trap',   desc: 'Clear a Why-Not round without a single wrong rule-out.' },
    { id: 'gauntlet_first',    label: 'First gauntlet',   desc: 'Finish your first Gauntlet.' },
    { id: 'gauntlet_25',       label: 'Goes the distance',desc: 'Run 25 Gauntlets to the end.' },
    { id: 'gauntlet_survivor', label: 'Walks out clean',  desc: 'Finish a full Gauntlet without a single miss.' },
  ];

  // ── Milestone evaluation — table-driven (v4.42.5) ───────────────────────
  // Previously `evaluateMilestones` was a 151-line function with 29 `maybe(id, cond)`
  // calls interleaved with context-building logic (fetching history, computing
  // weekMap, reading localStorage, defensive try/catch around optional drill APIs).
  // Refactored into three pieces:
  //   1. `_buildMilestoneCtx()` — gathers ALL the data once into one context object
  //   2. `MILESTONE_CHECKS` — declarative table of { id, check(ctx) } predicates
  //   3. `evaluateMilestones()` — tight loop, under 10 lines
  // Same 47 milestones, same behavior, same return shape. Table form makes it
  // trivial to add a new milestone (one entry) and keeps the function under the
  // 80-line threshold (#141).

  function _buildMilestoneCtx() {
    const h = loadHistory();
    const totalQs = h.reduce((a, e) => a + e.total, 0);
    const studied = new Set(h.filter(e => e.topic !== MIXED_TOPIC && e.topic !== EXAM_TOPIC).map(e => e.topic));
    // v4.85.20: count actual exam SUMMARY entries only (one per exam, topic === EXAM_TOPIC).
    // Without this filter, the per-topic splits (~50 per 90-Q exam) inflate milestone
    // counts like "10 exams completed" — a single exam would unlock it.
    const exams = h.filter(e => e.mode === 'exam' && e.topic === EXAM_TOPIC);
    const readiness = (typeof document !== 'undefined' && document.querySelector('#topic-group')) ? getReadinessScore() : null;
    const streak = getStreakData();
    const allDomainsHit = new Set(Array.from(studied).map(t => TOPIC_DOMAINS[t]).filter(Boolean));
    const allTopicCount = Object.keys(TOPIC_DOMAINS).length;
    const subStats = (typeof getSubnetStats === 'function') ? getSubnetStats() : { seen: 0 };
    const portBest = parseInt(localStorage.getItem(STORAGE.PORT_BEST) || '0');
    const portStreakBest = parseInt(localStorage.getItem(STORAGE.PORT_STREAK_BEST) || '0');
    const portStats = (typeof getPortStatsSummary === 'function') ? getPortStatsSummary() : { uniqueSeen: 0, totalPorts: 0 };
    const ddUses = parseInt(localStorage.getItem(STORAGE.DEEP_DIVE_USES) || '0');
    const dc = getDailyChallenge();

    // Time-of-day + weekend + diversity computations
    const nightOwl = h.some(e => { const hr = new Date(e.date).getHours(); return hr >= 0 && hr < 5; });
    const earlyBird = h.some(e => new Date(e.date).getHours() < 7);
    const weekMap = {};
    h.forEach(e => {
      const d = new Date(e.date), dow = d.getDay();
      if (dow !== 0 && dow !== 6) return;
      const yr = d.getFullYear();
      const start = new Date(yr, 0, 1);
      const key = yr + '-' + Math.floor((d - start) / (7 * 86400000));
      weekMap[key] = weekMap[key] || { sat: false, sun: false };
      if (dow === 6) weekMap[key].sat = true;
      if (dow === 0) weekMap[key].sun = true;
    });
    const weekendWarrior = Object.values(weekMap).some(w => w.sat && w.sun);
    const dayTopics = {};
    h.forEach(e => {
      if (e.topic === MIXED_TOPIC || e.topic === EXAM_TOPIC) return;
      const day = new Date(e.date).toISOString().slice(0, 10);
      dayTopics[day] = dayTopics[day] || new Set();
      dayTopics[day].add(e.topic);
    });
    const diversity5 = Object.values(dayTopics).some(s => s.size >= 5);

    const drill = _buildMilestoneDrillCtx();

    return {
      h, totalQs, studied, exams, readiness, streak, allDomainsHit, allTopicCount,
      subStats, portBest, portStreakBest, portStats, ddUses, dc,
      nightOwl, earlyBird, weekendWarrior, diversity5,
      drill: getDrillStats(),  // Task 3: per-cert drill stats map (ctx.drill.simlab?.done etc.)
      ...drill,
    };
  }

  // v4.85.7: extracted from _buildMilestoneCtx() — defensive reads for the
  // per-drill mastery counters (labs, A/B drills, OSI drills, cable/connector,
  // fix-it). Each block is wrapped in try/catch so a missing optional API or
  // stored payload can't break the whole milestone evaluation.
  function _buildMilestoneDrillCtx() {
    let labsDone = 0, totalLabs = 22;
    try {
      labsDone = Object.keys(JSON.parse(localStorage.getItem(STORAGE.LAB_COMPLETIONS) || '{}')).length;
      totalLabs = (typeof TB_LABS !== 'undefined') ? TB_LABS.length : 22;
    } catch (_) {}
    return {
      labsDone, totalLabs,
    };
  }


  function getStreakData() {
    const h = loadHistory();
    if (h.length === 0) return { currentStreak: 0, longestStreak: 0, lastStudyDate: null };
    // Collect unique study days (YYYY-MM-DD)
    const daySet = new Set(h.map(e => new Date(e.date).toISOString().slice(0, 10)));
    const days = Array.from(daySet).sort((a, b) => b.localeCompare(a)); // newest first

    // Current streak: count back from today (or yesterday, if today has no activity)
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const yestKey  = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
    let currentStreak = 0;
    let cursor = daySet.has(todayKey) ? new Date(today) : (daySet.has(yestKey) ? new Date(today.getTime() - 86400000) : null);
    while (cursor) {
      const key = cursor.toISOString().slice(0, 10);
      if (daySet.has(key)) {
        currentStreak++;
        cursor = new Date(cursor.getTime() - 86400000);
      } else {
        break;
      }
    }
    // Longest streak: scan all days for the longest consecutive run
    const sortedAsc = [...daySet].sort();
    let longestStreak = 0, run = 0, prev = null;
    sortedAsc.forEach(d => {
      if (prev === null) { run = 1; }
      else {
        const gap = (new Date(d).getTime() - new Date(prev).getTime()) / 86400000;
        run = (gap === 1) ? run + 1 : 1;
      }
      if (run > longestStreak) longestStreak = run;
      prev = d;
    });
    return { currentStreak, longestStreak, lastStudyDate: days[0] };
  }

  // ── Subtopic weak-spot mining from wrong bank (keyword frequency) ──
  const SUBTOPIC_KEYWORDS = [
    // Routing
    'OSPF', 'BGP', 'EIGRP', 'RIP', 'LSA', 'route summarization', 'autonomous system',
    // Subnetting
    'subnet mask', 'CIDR', 'VLSM', 'supernet', 'broadcast address', 'usable hosts',
    // Switching
    'VLAN', 'trunk', 'spanning tree', 'STP', 'RSTP', 'port-channel', 'EtherChannel', 'native VLAN',
    // IPv6
    'EUI-64', 'SLAAC', 'link-local', 'anycast', 'IPv6 header',
    // Wireless
    'WPA3', 'WPA2', 'EAP', 'PSK', '802.11', 'roaming', 'channel bonding',
    // Security
    'IPsec', 'IKE', 'ESP', 'AH', 'tunnel mode', 'transport mode', 'RADIUS', 'TACACS', 'Kerberos',
    // DNS / DHCP
    'DHCP relay', 'scope', 'reservation', 'DNS record', 'PTR', 'MX', 'SRV', 'CNAME', 'DNSSEC',
    // Tools
    'ping', 'traceroute', 'nmap', 'netstat', 'Wireshark', 'tcpdump', 'SNMP', 'syslog',
    // NAT
    'PAT', 'static NAT', 'port forwarding', 'NAT overload', 'inside local',
    // PBQ-specific
    'topology', 'firewall zone', 'DMZ'
  ];
  function mineSubtopicWeakSpots(limit = 8) {
    const bank = loadWrongBank();
    if (bank.length === 0) return [];
    const counts = {};
    bank.forEach(b => {
      const text = ((b.question || '') + ' ' + (b.explanation || '')).toLowerCase();
      SUBTOPIC_KEYWORDS.forEach(kw => {
        if (text.includes(kw.toLowerCase())) {
          counts[kw] = (counts[kw] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([keyword, count]) => ({ keyword, count }));
  }

  function renderReadinessCard() {
    const data     = getReadinessScore();
    const numEl    = document.getElementById('readiness-num');
    const badgeEl  = document.getElementById('readiness-badge');
    const barEl    = document.getElementById('readiness-bar-fill');
    const actionEl = document.getElementById('readiness-action');
    if (!numEl) return;

    if (!data) {
      numEl.textContent    = '\u2014';
      numEl.style.color    = 'var(--text-dim)';
      badgeEl.textContent  = 'Not started';
      badgeEl.style.background = 'var(--surface3)';
      badgeEl.style.color  = 'var(--text-dim)';
      barEl.style.width    = '0%';
      actionEl.innerHTML   = 'Complete your first quiz to activate your readiness score.';
      return;
    }

    const { predicted, raw, worstTopic, worstPct } = data;

    let tierLabel, tierColor, tierBg;
    if (predicted >= EXAM_PASS_SCORE) {
      tierLabel = '\ud83d\udfe2 Exam Ready'; tierColor = 'var(--green)'; tierBg = 'rgba(34,197,94,.15)';
    } else if (predicted >= 650) {
      tierLabel = '\ud83d\udfe0 Getting Close'; tierColor = 'var(--orange)'; tierBg = 'rgba(251,146,60,.15)';
    } else if (predicted >= 500) {
      tierLabel = '\ud83d\udfe1 Building'; tierColor = 'var(--yellow)'; tierBg = 'rgba(251,191,36,.15)';
    } else {
      tierLabel = '\ud83d\udd34 Not Ready'; tierColor = 'var(--red)'; tierBg = 'rgba(248,113,113,.15)';
    }

    const barPct = Math.max(0, Math.min(100, ((predicted - 420) / 450) * 100));

    // v4.42.1: first-render-per-session intro. Number counts from 0 → predicted
    // over 1.4s, bar fills from empty using a slower 1.1s cubic-bezier reveal,
    // then default transitions restore so subsequent updates (quiz return
    // roll-ups from v4.42.0) stay snappy. The flag is consumed on first call
    // with live data so returning from a quiz doesn't replay the intro.
    if (_readinessIntroArmed) {
      _readinessIntroArmed = false;
      animateCount('readiness-num', 0, predicted, 1400);
      barEl.style.transition = 'none';
      barEl.style.width = '0%';
      void barEl.offsetWidth; // force reflow so the next assignment animates
      setTimeout(() => {
        barEl.style.transition = 'width 1.1s cubic-bezier(0.2, 0.8, 0.2, 1)';
        barEl.style.width = barPct + '%';
        setTimeout(() => { barEl.style.transition = ''; }, 1200);
      }, 100);
    } else {
      // v4.42.0: animated roll-up of the readiness score so users see the
      // number climb after a quiz instead of a silent hot-swap. animateCount
      // already no-ops when the value is unchanged or NaN.
      const oldReadinessVal = parseInt(numEl.textContent, 10);
      if (!isNaN(oldReadinessVal) && oldReadinessVal !== predicted) {
        animateCount('readiness-num', oldReadinessVal, predicted, 900);
      } else {
        numEl.textContent = predicted;
      }
      barEl.style.width = barPct + '%';
    }
    numEl.style.color    = tierColor;
    badgeEl.textContent  = tierLabel;
    badgeEl.style.background = tierBg;
    badgeEl.style.color  = tierColor;
    barEl.style.background = tierColor;

    if (worstTopic) {
      const gapText = worstPct === null
        ? '<strong>' + escHtml(worstTopic) + '</strong> \u2014 never studied'
        : '<strong>' + escHtml(worstTopic) + '</strong> \u2014 ' + worstPct + '% avg';
      actionEl.innerHTML = '\u25b2 Biggest gap: ' + gapText + '. Drill it to move the score.';
    } else {
      actionEl.innerHTML = '\u2728 All topics covered. Keep your scores up!';
    }

    // v4.46.1: Exam-date chip — shared builder with Analytics hero card. One
    // click target, merged date + countdown display, no more visible native
    // date input.
    const examRow = document.getElementById('readiness-exam-row');
    if (examRow) {
      const dateStr = getExamDate();
      const days = getDaysToExam();
      examRow.innerHTML = _buildExamDateChipHtml(dateStr, days, 'readiness-exam-input');
    }

    // ── v4.73.0: prediction line + what-if + trajectory ──
    // Populate the new prediction card pieces. Falls back to hidden when the
    // data isn't yet ready (early-session, no questions answered).
    const predEl = document.getElementById('readiness-prediction');
    if (predEl && data.passProbability !== undefined) {
      const probPct = Math.round(data.passProbability * 100);
      let probClass = 'high';
      if (probPct < 50) probClass = 'low';
      else if (probPct < 80) probClass = 'med';
      predEl.innerHTML = '<strong>' + predicted + '</strong> '
        + '<span class="ci">± ' + data.ciHalfWidth + '</span> '
        + '<span class="sep">·</span> '
        + '<span class="prob ' + probClass + '">' + probPct + '% pass probability</span>';
      predEl.hidden = false;
    } else if (predEl) {
      predEl.hidden = true;
    }

    // What-if chips — top 3 highest-leverage topics
    const whatIfEl = document.getElementById('readiness-whatif');
    const whatIfRow = document.getElementById('readiness-whatif-row');
    if (whatIfEl && whatIfRow && data.whatIf && data.whatIf.length > 0) {
      whatIfRow.innerHTML = data.whatIf.map(w => {
        const safeTopic = (w.topic || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return '<button type="button" class="readiness-whatif-chip" '
          + 'onclick="focusTopic(\'' + safeTopic + '\')" '
          + 'title="Drill ' + escHtml(w.topic) + ' to push your score up">'
          + '<span class="pts">+' + w.deltaPredicted + ' pts</span> '
          + '<span class="topic">' + escHtml(w.topic) + '</span> '
          + '<span class="delta">(' + w.currentPct + '% → 80%)</span>'
          + '</button>';
      }).join('');
      whatIfEl.hidden = false;
    } else if (whatIfEl) {
      whatIfEl.hidden = true;
    }

    // Trajectory: time-bound + confident-pass gap
    const trajEl = document.getElementById('readiness-trajectory');
    if (trajEl) {
      if (data.daysToExam !== null && data.daysToExam !== undefined) {
        if (data.targetGap > 0) {
          const cls = data.targetGap > 60 ? 'warn' : (data.targetGap > 20 ? 'mid' : 'good');
          trajEl.innerHTML = '<strong>' + data.daysToExam + ' days</strong> to exam &middot; '
            + 'need <strong>+' + data.targetGap + ' pts</strong> for confident pass '
            + '<span class="hint">(lower bound → ' + EXAM_PASS_SCORE + ')</span>';
          trajEl.className = 'readiness-trajectory ' + cls;
          trajEl.hidden = false;
        } else {
          trajEl.innerHTML = '<strong>' + data.daysToExam + ' days</strong> to exam &middot; '
            + 'already confidently above pass.';
          trajEl.className = 'readiness-trajectory good';
          trajEl.hidden = false;
        }
      } else {
        trajEl.hidden = true;
      }
    }
  }

  // ══════════════════════════════════════════
  // TODAY'S SESSION
  // ══════════════════════════════════════════
  // v4.81.18: rewritten to compose 2 weak + 3 stale (= 5 topics) via the same
  // signals already powering the homepage Weak Spots widget and the v4.81.15
  // rotation chip row. Falls back to the legacy _scoreTopicNeed ranker when
  // either signal is sparse (new users with no history yet) so the plan stays
  // non-empty in early-stage usage. Keeps the original return shape
  // { topic, reason, color } so all existing consumers (renderTodayPlan,
  // startSession, isStudyPlanDoneToday, runSessionStep) work unchanged.
  // v4.99.26 — Cert-aware topic filter. Returns true if topic is in the current
  // cert's TOPIC_DOMAINS catalog. Prevents cross-cert leakage (e.g., Network+
  // 'Network Models & OSI' showing up in Today's Plan when user is on Sec+).
  // Quiz history + wrong bank are global per user (one localStorage namespace
  // across certs); the active cert filters which topics are surfaced. Defensive
  // fallback: if TOPIC_DOMAINS is empty/undefined, allow through so the home
  // page never goes blank when called pre-init.
  function _isCurrentCertTopic(topic) {
    if (!topic) return false;
    if (typeof TOPIC_DOMAINS === 'undefined' || !TOPIC_DOMAINS) return true;
    const keys = Object.keys(TOPIC_DOMAINS);
    if (!keys.length) return true;
    return Object.prototype.hasOwnProperty.call(TOPIC_DOMAINS, topic);
  }

  function buildSessionPlan(n) {
    const target = (typeof n === 'number' && n > 0) ? n : SESSION_TOPICS;
    const items = [];
    const taken = new Set();

    const weakColor = '#fbbf24';   // yellow accent — matches consolidated Today card
    const staleColor = '#f59e0b';  // amber — matches v4.81.15 rotation chips

    // ── Top weak spots (recency-decayed wrong-bank + accuracy gap) ──
    // v4.99.26: filter cross-cert leakage — quiz history is global per user
    // but topics belong to a specific cert. Only surface topics in the
    // current cert's TOPIC_DOMAINS catalog.
    let weakRows = [];
    try {
      if (typeof computeWeakSpotScores === 'function') {
        weakRows = computeWeakSpotScores().filter(w => w && _isCurrentCertTopic(w.topic));
      }
    } catch (_) {}
    weakRows.slice(0, TODAY_PLAN_WEAK_COUNT).forEach(w => {
      if (!w || !w.topic || taken.has(w.topic)) return;
      const pct = Math.round((w.posterior || 0) * 100);
      items.push({
        topic: w.topic,
        reason: '~' + pct + '% accuracy',
        color: weakColor,
        signal: 'weak',
        meta: '~' + pct + '% accuracy'
      });
      taken.add(w.topic);
    });

    // ── Stale topics (not seen in WEAK_STALENESS_DAYS+, deduped against weak) ──
    // v4.99.26: same cert-aware filter as weak rows above.
    let staleRows = [];
    try {
      if (typeof _computeStaleTopics === 'function' && typeof loadHistory === 'function') {
        const hist = loadHistory();
        // Request 2× the stale slots so dedup overhead doesn't starve the plan
        staleRows = _computeStaleTopics(hist, TODAY_PLAN_STALE_COUNT * 2)
          .filter(s => s && _isCurrentCertTopic(s.topic));
      }
    } catch (_) {}
    let staleAdded = 0;
    for (const s of staleRows) {
      if (staleAdded >= TODAY_PLAN_STALE_COUNT) break;
      if (!s || !s.topic || taken.has(s.topic)) continue;
      const meta = s.neverStudied ? 'never studied' : (s.daysSince + 'd stale');
      items.push({
        topic: s.topic,
        reason: meta,
        color: staleColor,
        signal: 'stale',
        meta
      });
      taken.add(s.topic);
      staleAdded++;
    }

    // ── Top up with remaining weak spots if still short of target ──
    if (items.length < target) {
      weakRows.slice(TODAY_PLAN_WEAK_COUNT).forEach(w => {
        if (items.length >= target) return;
        if (!w || !w.topic || taken.has(w.topic)) return;
        const pct = Math.round((w.posterior || 0) * 100);
        items.push({
          topic: w.topic,
          reason: '~' + pct + '% accuracy',
          color: weakColor,
          signal: 'weak',
          meta: '~' + pct + '% accuracy'
        });
        taken.add(w.topic);
      });
    }

    // ── Final fallback for sparse-history users: legacy _scoreTopicNeed ranker ──
    // Without this, brand-new users with no weak/stale signal would see an
    // empty plan card. The fallback ensures the plan always has something
    // actionable while the user builds history.
    if (items.length < target && typeof _getAllStudyTopics === 'function' && typeof _scoreTopicNeed === 'function') {
      const allTopics = _getAllStudyTopics();
      const h = (typeof loadHistory === 'function') ? loadHistory().filter(e => e.topic !== MIXED_TOPIC && e.topic !== EXAM_TOPIC) : [];
      const now = Date.now();
      const fallback = allTopics
        .map(t => {
          const { score, reason, color } = _scoreTopicNeed(t, h, now);
          return { topic: t, score, reason, color };
        })
        .sort((a, b) => b.score - a.score);
      for (const f of fallback) {
        if (items.length >= target) break;
        if (taken.has(f.topic)) continue;
        items.push({
          topic: f.topic,
          reason: f.reason,
          color: f.color,
          signal: 'fallback',
          meta: f.reason
        });
        taken.add(f.topic);
      }
    }

    return items.slice(0, target);
  }

  // Study Plan is "addressed for the day" if the user completed a multi-topic
  // session run today, OR they've already drilled each of today's plan topics
  // individually today (covered via any non-wrong-drill history entry).
  function isStudyPlanDoneToday() {
    const today = new Date().toISOString().slice(0, 10);
    const h = loadHistory();
    const todayEntries = h.filter(e => new Date(e.date).toISOString().slice(0, 10) === today);
    if (todayEntries.some(e => e.mode === 'session')) return true;
    const plan = buildSessionPlan(SESSION_TOPICS);
    if (!plan.length) return false;
    const studiedTopicsToday = new Set(todayEntries.map(e => e.topic));
    return plan.every(item => studiedTopicsToday.has(item.topic));
  }

  // v4.81.23: legacy renderSessionBanner removed. Was a thin shim that
  // delegated to renderTodayPlan. Callers now invoke renderTodayPlan directly.

  // v4.81.18 / v4.81.23: consolidated Today's Plan card — collapses what
  // were 4 stacked surfaces (#todays-focus weak-spots row + #rotation-row
  // stale chips + #session-banner study plan + v4.54.0 #focus-banner) into
  // ONE prescriptive card. v4.81.23 removed all 4 legacy elements + their
  // shim render functions. Eliminates
  // topic-name repetition + "never studied" stutter + 3 competing CTAs.
  // Mockup at mockups/today-consolidation-concept.html.
  function renderTodayPlan() {
    const card = document.getElementById('today-plan');
    if (!card) return;
    // Hide if today's plan has already been addressed (multi-topic session
    // run today, or every plan topic individually drilled today).
    let done = false;
    try { done = (typeof isStudyPlanDoneToday === 'function') ? isStudyPlanDoneToday() : false; } catch (_) {}
    if (done) {
      card.classList.add('is-hidden');
      card.innerHTML = '';
      return;
    }
    const plan = buildSessionPlan(SESSION_TOPICS);
    if (!plan || plan.length === 0) {
      card.classList.add('is-hidden');
      card.innerHTML = '';
      return;
    }
    // Persist into module state so startSession picks up the same plan
    sessionPlan = plan;

    const weakCount = plan.filter(i => i.signal === 'weak').length;
    const staleCount = plan.filter(i => i.signal === 'stale').length;
    const fallbackCount = plan.length - weakCount - staleCount;
    // Time estimate: ~36s per question (rounded from real session telemetry)
    const totalMin = Math.max(1, Math.round((plan.length * SESSION_QUESTIONS) * 0.6));

    // Sub-line composition prose — tailored to which signals contributed
    let subProse = '';
    if (weakCount > 0 && staleCount > 0) {
      subProse = `Hits your ${weakCount === 1 ? 'weakest topic' : weakCount + ' weakest topics'} from recent quizzes plus ${staleCount === 1 ? 'a topic' : staleCount + ' topics'} you haven't touched in a while.`;
    } else if (weakCount > 0) {
      subProse = `Targets your ${weakCount === 1 ? 'weakest topic' : weakCount + ' weakest topics'} from recent quizzes.`;
    } else if (staleCount > 0) {
      subProse = `Surfaces ${staleCount === 1 ? 'a topic' : staleCount + ' topics'} you haven't touched in a while so coverage stays even.`;
    } else {
      subProse = 'A balanced starter mix while you build up history.';
    }
    subProse += ` Mixed difficulty, ${SESSION_QUESTIONS} questions per topic.`;

    // Compose the chip strip
    const chipsHtml = plan.map(item => {
      const icon = item.signal === 'weak' ? '🎯'
                 : item.signal === 'stale' ? '🕒'
                 : '✨';
      const safeTopic = String(item.topic).replace(/'/g, "\\'");
      const tipPrefix = item.signal === 'weak' ? 'Weak spot — '
                      : item.signal === 'stale' ? 'Stale — '
                      : 'Recommended — ';
      const title = tipPrefix + (item.meta || '');
      return '<button type="button" class="tplan-chip" data-signal="' + item.signal + '" title="' + escHtml(title) + '" onclick="focusTopic(\'' + safeTopic + '\')">'
        + '<span class="tplan-chip-icon" aria-hidden="true">' + icon + '</span>'
        + '<span class="tplan-chip-name">' + escHtml(item.topic) + '</span>'
        + '<span class="tplan-chip-arrow" aria-hidden="true">→</span>'
      + '</button>';
    }).join('');

    // Composition meta — "2 weak · 3 stale · Mixed difficulty"
    const compParts = [];
    if (weakCount > 0) compParts.push(weakCount + ' weak');
    if (staleCount > 0) compParts.push(staleCount + ' stale');
    if (fallbackCount > 0) compParts.push(fallbackCount + ' recommended');
    compParts.push('Mixed difficulty');

    // v4.81.21: Subnet Trainer bridge re-integration. Restored from v4.43.1
    // (was retired in v4.81.18 consolidation). When the plan includes a
    // subnet-heavy topic (Subnetting & IP Addressing / IPv6 / NAT & IP
    // Services), surface a small "Drill in Subnet Trainer →" bridge link
    // so users get the deeper binary-breakdown affordance instead of just
    // the regular MCQ quiz drill. Dedupe by kind+labId so we don't show
    // multiple identical buttons when 2 subnet topics are in the plan.
    // MVP-QUIZ-ONLY (Ship 6): weak-spot drill bridge buttons removed (the
    // Subnet Trainer they routed to is deleted). The weak-spot topics now
    // surface only via the regular drill-this-topic quiz flow.
    const bridgesHtml = '';

    card.innerHTML = ''
      + '<div class="tplan-eyebrow">Today\'s plan</div>'
      + '<div class="tplan-headline">' + plan.length + ' topics · ~' + totalMin + ' min · <em>fastest</em> route to exam-ready</div>'
      + '<p class="tplan-sub">' + escHtml(subProse) + '</p>'
      + '<div class="tplan-chips">' + chipsHtml + '</div>'
      + bridgesHtml
      + '<div class="tplan-foot">'
      +   '<div class="tplan-foot-meta">' + escHtml(compParts.join(' · ')) + '</div>'
      +   '<button type="button" class="tplan-cta" onclick="startSession()">Begin plan →</button>'
      + '</div>';
    card.classList.remove('is-hidden');
  }

  function renderReadinessCardV2() {
    const _rc = document.getElementById('readiness-card-v2'); if (_rc) _rc.dataset.animated = '';
    const numEl = document.getElementById('rc-v2-num');
    const barEl = document.getElementById('rc-v2-bar-fill');
    const deltaEl = document.getElementById('rc-v2-delta');
    const card = document.getElementById('readiness-card-v2');
    // v4.73.0: prediction extras
    const predEl = document.getElementById('rc-v2-prediction');
    const whatIfEl = document.getElementById('rc-v2-whatif');
    const whatIfRow = document.getElementById('rc-v2-whatif-row');
    const trajEl = document.getElementById('rc-v2-trajectory');

    if (!numEl || !barEl || !deltaEl || !card) return;
    // v7.34.0: styling-only hook for the no-score state (compresses the desktop
    // hero so the empty card isn't a 2-row dead box - see dg-system.css). Cleared
    // by default; re-added below only when there's no quiz history yet.
    card.classList.remove('is-pending');
    // Phone one-line strip: wire card tap \u2192 Progress page on phones only.
    // matchMedia guard ensures the onclick is never active on desktop/tablet.
    const _stripEl = document.getElementById('rc-strip-text');
    if (window.matchMedia('(max-width:620px)').matches) {
      card.onclick = function() { showPage('progress'); };
    } else {
      card.onclick = null;
    }
    const history = (typeof loadHistory === 'function') ? loadHistory() : [];
    if (history.length === 0 || typeof getReadinessScore !== 'function') {
      numEl.textContent = '\u2014';
      barEl.style.width = '0%';
      deltaEl.textContent = 'first quiz pending';
      if (predEl) predEl.hidden = true;
      if (whatIfEl) whatIfEl.hidden = true;
      if (trajEl) trajEl.hidden = true;
      if (_stripEl) _stripEl.textContent = 'Readiness \u2014/900 \u00b7 take a quiz to unlock';
      card.classList.add('is-pending');
      return;
    }
    try {
      // getReadinessScore returns { predicted, raw, ciHalfWidth, passProbability, whatIf, ... }
      const r = getReadinessScore();
      if (r && typeof r.predicted === 'number') {
        numEl.textContent = r.predicted;
        // Phone strip: compact one-liner shown <=620px
        if (_stripEl) {
          if (typeof r.passProbability === 'number') {
            _stripEl.textContent = 'Readiness ' + r.predicted + '/900 \u00b7 ' + Math.round(r.passProbability * 100) + '% pass';
          } else {
            _stripEl.textContent = 'Readiness ' + r.predicted + '/900';
          }
        }
        const pct = Math.max(0, Math.min(100, ((r.predicted - 420) / 450) * 100));
        barEl.style.width = pct + '%';
        queueReadinessAnimation(r.predicted, pct);
        const pm = document.getElementById('rc-v2-passmark'); if (pm) pm.textContent = EXAM_PASS_SCORE;

        // v4.73.0: prediction line \u2014 pass probability + CI inside the dark card
        if (predEl && typeof r.passProbability === 'number') {
          const probPct = Math.round(r.passProbability * 100);
          let probClass = 'high';
          if (probPct < 50) probClass = 'low';
          else if (probPct < 80) probClass = 'med';
          predEl.innerHTML = '<span class="prob ' + probClass + '">'
            + probPct + '% pass probability</span>'
            + '<span class="ci">\u00b1 ' + r.ciHalfWidth + ' pts</span>';
          predEl.hidden = false;
        } else if (predEl) {
          predEl.hidden = true;
        }

        // Delta line (compact): show range under bar
        if (typeof r.lowerBound === 'number' && typeof r.upperBound === 'number') {
          deltaEl.textContent = 'range ' + r.lowerBound + '\u2013' + r.upperBound;
        } else {
          deltaEl.textContent = '';
        }

        // v4.73.0: what-if chips below the dark card
        if (whatIfEl && whatIfRow && Array.isArray(r.whatIf) && r.whatIf.length > 0) {
          whatIfRow.innerHTML = r.whatIf.map(w => {
            const safeTopic = (w.topic || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            return '<button type="button" class="rc-v2-whatif-chip" '
              + 'onclick="focusTopic(\'' + safeTopic + '\')" '
              + 'title="Drill ' + escHtml(w.topic) + ' to push your score up">'
              + '<span class="pts">+' + w.deltaPredicted + ' pts</span>'
              + '<span class="topic">' + escHtml(w.topic) + '</span>'
              + '<span class="delta">' + w.currentPct + '% \u2192 80%</span>'
              + '</button>';
          }).join('');
          whatIfEl.hidden = false;
        } else if (whatIfEl) {
          whatIfEl.hidden = true;
        }

        // v4.73.0: trajectory line below the chips
        if (trajEl) {
          if (r.daysToExam !== null && r.daysToExam !== undefined) {
            if (r.targetGap > 0) {
              const cls = r.targetGap > 60 ? 'warn' : (r.targetGap > 20 ? 'mid' : 'good');
              trajEl.innerHTML = '<strong>' + r.daysToExam + ' days</strong> to exam &middot; '
                + 'need <strong>+' + r.targetGap + ' pts</strong> for confident pass';
              trajEl.className = 'rc-v2-trajectory ' + cls;
              trajEl.hidden = false;
            } else {
              trajEl.innerHTML = '<strong>' + r.daysToExam + ' days</strong> to exam &middot; '
                + 'already confidently above pass.';
              trajEl.className = 'rc-v2-trajectory good';
              trajEl.hidden = false;
            }
          } else {
            trajEl.hidden = true;
          }
        }
      } else {
        numEl.textContent = '\u2014';
        if (predEl) predEl.hidden = true;
        if (whatIfEl) whatIfEl.hidden = true;
        if (trajEl) trajEl.hidden = true;
      }
    } catch (_) {
      numEl.textContent = '\u2014';
      if (predEl) predEl.hidden = true;
      if (whatIfEl) whatIfEl.hidden = true;
      if (trajEl) trajEl.hidden = true;
    }
  }
  window.diffWeight                = diffWeight;
  window.buildWeightedTopicMap     = buildWeightedTopicMap;
  window.getReadinessScore         = getReadinessScore;
  window._readReadinessSnapshots   = _readReadinessSnapshots;
  window._writeReadinessSnapshot   = _writeReadinessSnapshot;
  window.getExamDate               = getExamDate;
  window.setExamDate               = setExamDate;
  window.getDaysToExam             = getDaysToExam;
  window.getReadinessForecast      = getReadinessForecast;
  window.getTypeStats              = getTypeStats;
  window.updateTypeStat            = updateTypeStat;
  window.getMilestones             = getMilestones;
  window.unlockMilestone           = unlockMilestone;
  // v7.79.2: missed in the original wave-7 extraction — MILESTONE_DEFS is a
  // const inside this IIFE and doesn't leak to the shared classic-script
  // scope the way top-level `let`/`function` declarations in separate
  // <script> tags do. analytics.js (lazy-loaded) reads it as a bare
  // identifier via a typeof guard, which silently returned '' (no thrown
  // error) instead of rendering the Drills milestones group.
  window.MILESTONE_DEFS            = MILESTONE_DEFS;
  window.getDrillStats             = getDrillStats;
  window.bumpDrillStat             = bumpDrillStat;
  window._buildMilestoneCtx        = _buildMilestoneCtx;
  window.getStreakData             = getStreakData;
  window.mineSubtopicWeakSpots     = mineSubtopicWeakSpots;
  window.renderReadinessCard       = renderReadinessCard;
  window._isCurrentCertTopic       = _isCurrentCertTopic;
  window.buildSessionPlan          = buildSessionPlan;
  window.isStudyPlanDoneToday      = isStudyPlanDoneToday;
  window.renderTodayPlan           = renderTodayPlan;
  window.renderReadinessCardV2     = renderReadinessCardV2;

  window._certanvilFeatures = window._certanvilFeatures || {};
  window._certanvilFeatures['readiness'] = { getReadinessScore: getReadinessScore };

  // Boot gap: _v454Init ran before this module loaded (defer order).
  // Re-trigger readiness renders if the home page is already active.
  (function _readinessEagerInit() {
    try {
      var setupPage = document.getElementById('page-setup');
      if (setupPage && setupPage.classList.contains('active')) {
        renderReadinessCard();
        renderTodayPlan();
        renderReadinessCardV2();
      }
    } catch (_) {}
  })();
})();
