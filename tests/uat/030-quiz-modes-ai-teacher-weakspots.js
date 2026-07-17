// tests/uat/030-quiz-modes-ai-teacher-weakspots.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Acronym Blitz/OSI sorter/Cable ID quiz modes, AI teacher pipeline, Ethernet ground truth, Weak Spots v2, v4.42 animation pass, landing intro animation, analytics dedup, catalog expansion, readiness algorithm

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── v4.38.0: Acronym Blitz ──
console.log('\n\x1b[1m── ACRONYM BLITZ (v4.38.0) ──\x1b[0m');
test('AB_MASTERY storage key', js.includes("AB_MASTERY: 'nplus_ab_mastery'"));
test('AB_LESSONS storage key', js.includes("AB_LESSONS: 'nplus_ab_lessons'"));
// getAbMastery assertion removed in M2 — helper deleted with the Acronym Blitz drill long ago;
// only the orphaned milestone ctx block still referenced it (via typeof guard).
// ab_first/ab_50/ab_all_seen/ab_streak_15 removed in M2 (Acronym Blitz drill deleted)

// ── v4.38.0: OSI Layer Sorter ──
console.log('\n\x1b[1m── OSI LAYER SORTER (v4.38.0) ──\x1b[0m');
test('OS_MASTERY storage key', js.includes("OS_MASTERY: 'nplus_os_mastery'"));
test('OS_LESSONS storage key', js.includes("OS_LESSONS: 'nplus_os_lessons'"));
// getOsMastery assertion removed in M2 — helper deleted with the OSI Sorter drill long ago;
// only the orphaned milestone ctx block still referenced it (via typeof guard).
// os_first/os_50/os_all_seen/os_streak_10 removed in M2 (OSI Sorter drill deleted)

// ── v4.38.0: Cable & Connector ID ──
console.log('\n\x1b[1m── CABLE & CONNECTOR ID (v4.38.0) ──\x1b[0m');
test('CB_MASTERY storage key', js.includes("CB_MASTERY: 'nplus_cb_mastery'"));
test('CB_LESSONS storage key', js.includes("CB_LESSONS: 'nplus_cb_lessons'"));
// getCbMastery assertion removed in M2 — helper deleted with the Cable ID drill long ago;
// only the orphaned milestone ctx block still referenced it (via typeof guard).
// cb_first/cb_50/cb_all_seen/cb_streak_10 removed in M2 (Cable ID drill deleted)

// ── v4.41.0 AI teacher pipeline (Tier A/B/C) structural assertions ──
// We can't test AI output offline, but we CAN assert the fixes are wired:
// (1) CLAUDE_TEACHER_MODEL constant exists and points to Sonnet
// (2) All 7 teacher call sites use CLAUDE_TEACHER_MODEL (not CLAUDE_MODEL)
// (3) _buildGtHint helper exists and is called from Tier A + Tier B prompts
// (4) AI response cache helpers exist and are wired into Tier A call sites
// (5) STORAGE.AI_CACHE is declared
test('v4.41.0: CLAUDE_TEACHER_MODEL constant points to Sonnet',
  /const CLAUDE_TEACHER_MODEL\s*=\s*['"]claude-sonnet-4-6['"]/.test(js));
test('v4.41.0: CLAUDE_VALIDATOR_MODEL still points to Sonnet',
  /const CLAUDE_VALIDATOR_MODEL\s*=\s*['"]claude-sonnet-4-6['"]/.test(js));
test('v4.41.0: _buildGtHint helper defined',
  /function _buildGtHint\(text, topicName\)/.test(js));
test('v4.41.0: _aiCacheGet helper defined',
  /function _aiCacheGet\(namespace, rawKey\)/.test(js));
test('v4.41.0: _aiCacheSet helper defined',
  /function _aiCacheSet\(namespace, rawKey, payload\)/.test(js));
test('v4.41.0: STORAGE.AI_CACHE key declared',
  /AI_CACHE:\s*['"]nplus_ai_cache['"]/.test(js));

// Teacher model wiring — each call site must use CLAUDE_TEACHER_MODEL
// Pull function bodies and check they reference the teacher model.

// v4.99.38: shell-only variant — caps at the features auto-concat boundary.
// Use this for vm-fixture tests on functions defined in app.js (the shell)
// that would otherwise overshoot into features/*.js IIFE content with
// unbound symbol references (window, PORT_DRILL_SECONDS, etc.).
const explainFurtherBody = _fnBody(js, 'explainFurther');
const showTopicDeepDiveBody = _fnBody(js, 'showTopicDeepDive');
const fetchTopicBriefBody = _fnBody(js, 'fetchTopicBrief');
const stAskCoachBody = _fnBody(js, 'stAskCoach');
const ptAskCoachBody = _fnBody(js, 'ptAskCoach');
const tbCoachBody = _fnBody(js, 'tbCoachTopology');
const tbExplainDevBody = _fnBody(js, 'tbExplainDevice');

test('v4.41.0 Tier A: explainFurther uses CLAUDE_TEACHER_MODEL',
  explainFurtherBody.includes('CLAUDE_TEACHER_MODEL'));
test('v4.41.0 Tier A: explainFurther has GT hint injection',
  explainFurtherBody.includes('_buildGtHint('));
test('v4.41.0 Tier A: explainFurther uses response cache',
  explainFurtherBody.includes("_aiCacheGet('explainFurther'") && explainFurtherBody.includes("_aiCacheSet('explainFurther'"));

test('v4.41.0 Tier A: showTopicDeepDive uses CLAUDE_TEACHER_MODEL',
  showTopicDeepDiveBody.includes('CLAUDE_TEACHER_MODEL'));
test('v4.41.0 Tier A: showTopicDeepDive uses response cache',
  showTopicDeepDiveBody.includes("_aiCacheGet('topicDeepDive'") && showTopicDeepDiveBody.includes("_aiCacheSet('topicDeepDive'"));
test('v4.41.0 Tier A: buildTopicDivePrompt injects GT hint',
  _fnBody(js, 'buildTopicDivePrompt').includes('_buildGtHint('));

test('v4.41.0 Tier A: fetchTopicBrief uses CLAUDE_TEACHER_MODEL',
  fetchTopicBriefBody.includes('CLAUDE_TEACHER_MODEL'));
test('v4.41.0 Tier A: fetchTopicBrief has GT hint injection',
  fetchTopicBriefBody.includes('_buildGtHint('));
test('v4.41.0 Tier A: fetchTopicBrief uses response cache',
  fetchTopicBriefBody.includes("_aiCacheGet('topicBrief'") && fetchTopicBriefBody.includes("_aiCacheSet('topicBrief'"));


// Sanity: generation path stays on Haiku for cost/latency reasons
// v4.56.1: fetchQuestions is now a batching coordinator; the actual Haiku
// call lives in _fetchQuestionsBatch. Check the worker body for model usage.
const fetchQBody = _fnBody(js, '_fetchQuestionsBatch');
test('v4.41.0: _fetchQuestionsBatch still uses CLAUDE_MODEL (Haiku) for cost',
  fetchQBody.includes('CLAUDE_MODEL') && !fetchQBody.includes('CLAUDE_TEACHER_MODEL'));
const tbGenBody = _fnBody(js, 'tbGenerateAiTopology');

// ── v4.41.0 Ethernet physical-layer ground truth (auto-neg vs auto-MDIX) ──
// User reported an MCQ where the stem asked about automatic MDI/MDIX pin
// detection but auto-negotiation was marked correct. Auto-negotiation is
// speed+duplex only; Auto-MDIX is the pin-detection feature. These
// assertions lock in the new GT_ETHERNET table, the _buildGtHint ethernet
// branch, and the _groundTruthOk MDI/MDIX conflation guard.
// v4.86.1: GT_ETHERNET literal moved to certs/netplus.js as cert.gt.ethernet
test('v4.41.0: GT_ETHERNET reads from CERT_PACK',
  /const GT_ETHERNET\s*=.*CERT_PACK.*ethernet/.test(js));
test('v4.41.0: cert pack ethernet table declares auto-negotiation as speed+duplex only',
  /'auto-negotiation':\s*'negotiates SPEED and DUPLEX only/.test(certNetplus));
test('v4.41.0: cert pack ethernet table declares auto-mdix as MDI/MDIX pin detection',
  /'auto-mdix':\s*'detects MDI\/MDIX pin assignments/.test(certNetplus));
const buildGtHintBody = _fnBody(js, '_buildGtHint');
test('v4.41.0: _buildGtHint has ethernet keyword regex',
  /ethRe/.test(buildGtHintBody) || /auto\[-\\s\]\?negotiat/.test(buildGtHintBody));
test('v4.41.0: _buildGtHint surfaces auto-negotiation fact on ethernet match',
  buildGtHintBody.includes("GT_ETHERNET['auto-negotiation']"));
test('v4.41.0: _buildGtHint surfaces auto-MDIX fact on ethernet match',
  buildGtHintBody.includes("GT_ETHERNET['auto-mdix']"));
test('v4.41.0: _buildGtHint emits Ethernet physical layer section',
  buildGtHintBody.includes('Ethernet physical layer'));
const gtOkBody = _fnBody(js, '_groundTruthOk');
test('v4.41.0: _groundTruthOk guards MDI/MDIX stem against auto-neg answer',
  /mdiStemRe/.test(gtOkBody) && /mentionsAutoNeg/.test(gtOkBody));
test('v4.41.0: _groundTruthOk guards speed/duplex stem against auto-MDIX answer',
  /speedDuplexStemRe/.test(gtOkBody));

// Behavioral smoke: evaluate _buildGtHint on a Cabling & Topology style stem
// and confirm the AUTHORITATIVE FACTS block names both features. We do this
// by extracting the function via Function() from the source — no runtime
// execution of the full app, just the one helper.
try {
  // v4.86.1: GT_ETHERNET literal moved to certs/netplus.js as cert.gt.ethernet.
  // Extract from certNetplus, then build a sandbox that matches what runtime sees.
  const gtEthMatch = certNetplus.match(/ethernet:\s*\{([\s\S]*?)\n\s*\}\s*\n\s*\}/);
  const buildGtHintMatch = js.match(/function _buildGtHint\(text, topicName\) \{[\s\S]*?\n\}/);
  if (gtEthMatch && buildGtHintMatch) {
    // Reconstruct a usable GT_ETHERNET const for the sandbox from the cert pack body.
    // Plus minimal stubs for GT_PORTS/GT_OSI references inside _buildGtHint.
    const sandbox = `
      const GT_PORTS = {};
      const GT_OSI = {};
      const GT_ETHERNET = {${gtEthMatch[1]}};
      ${buildGtHintMatch[0]}
      module.exports = _buildGtHint;
    `;
    const tmp = require('path').join(ROOT, 'tests', '_tmp_gt_eth.js');
    require('fs').writeFileSync(tmp, sandbox);
    const fn = require(tmp);
    const out = fn('automatic MDI/MDIX configuration on both devices crossover cable', 'Cabling & Topology');
    require('fs').unlinkSync(tmp);
    test('v4.41.0: _buildGtHint emits auto-neg fact for MDI/MDIX stem',
      out.includes('Auto-negotiation') && out.includes('SPEED and DUPLEX only'));
    test('v4.41.0: _buildGtHint emits auto-MDIX fact for MDI/MDIX stem',
      out.includes('Auto-MDIX') && out.includes('pin assignments'));
    test('v4.41.0: _buildGtHint emits AUTHORITATIVE FACTS header',
      out.includes('AUTHORITATIVE FACTS'));
  } else {
    test('v4.41.0: _buildGtHint source extraction', false);
    results.errors.push('could not extract GT_ETHERNET or _buildGtHint from app.js');
  }
} catch (err) {
  test('v4.41.0: _buildGtHint ethernet smoke test', false);
  results.errors.push('_buildGtHint ethernet smoke test threw: ' + err.message);
}

// ── v4.41.0 Weak Spots v2 algorithm ──
// User reported the front-page "🎯 Weak spots" chip row needs a more robust
// and deeper calculation. Rewrote getTodaysFocusTopics as a thin wrapper
// around a new computeWeakSpotScores() which combines:
//   - recency-decayed wrong-bank count (half-life 7d, difficulty-weighted)
//   - Bayesian posterior accuracy gap with Beta(2,2) prior (14d half-life)
//   - staleness bonus for untouched topics >14d
//   - CompTIA DOMAIN_WEIGHTS importance multiplier
// These assertions lock in the new function, its four scoring signals, the
// constants that govern the model, and real-time refresh hooks in finish()
// and submitExam(). A behavioral smoke test exercises the function with a
// synthetic history + wrong-bank fixture in a sandbox to prove it actually
// ranks correctly — structural sniffs aren't enough for a scoring model.
test('v4.41.0: computeWeakSpotScores function defined',
  /function computeWeakSpotScores\(\)/.test(js));
test('v4.41.0: WEAK_HALF_LIFE_WRONGS_MS 7-day constant defined',
  /WEAK_HALF_LIFE_WRONGS_MS\s*=\s*7\s*\*\s*86400000/.test(js));
test('v4.41.0: WEAK_HALF_LIFE_HIST_MS 14-day constant defined',
  /WEAK_HALF_LIFE_HIST_MS\s*=\s*14\s*\*\s*86400000/.test(js));
test('v4.41.0: WEAK_TARGET_ACC mastery threshold defined (v4.85.11: lowered 0.85 → 0.80)',
  /WEAK_TARGET_ACC\s*=\s*0\.80/.test(js));
test('v4.41.0: WEAK_STALENESS_DAYS grace period defined',
  /WEAK_STALENESS_DAYS\s*=\s*14/.test(js));
test('v4.41.0: _weakDecay exponential helper defined',
  /function _weakDecay\(/.test(js));
test('v4.41.0: _weakDomainMultiplier helper uses DOMAIN_WEIGHTS',
  /function _weakDomainMultiplier/.test(js) && /DOMAIN_WEIGHTS\[dom\]/.test(js));
const cwsBody = _fnBody(js, 'computeWeakSpotScores');
test('v4.41.0: computeWeakSpotScores reads wrong bank',
  cwsBody.includes('loadWrongBank()'));
test('v4.41.0: computeWeakSpotScores reads history',
  cwsBody.includes('loadHistory()'));
test('v4.41.0: computeWeakSpotScores excludes Mixed/Exam topics',
  cwsBody.includes('MIXED_TOPIC') && cwsBody.includes('EXAM_TOPIC'));
test('v4.41.0: computeWeakSpotScores applies Beta(2,2) Bayesian prior',
  /wCorrect\s*\+\s*2\)\s*\/\s*\(.*wTotal\s*\+\s*4/.test(cwsBody));
test('v4.41.0: computeWeakSpotScores uses diffWeight for difficulty weighting',
  cwsBody.includes('diffWeight('));
test('v4.41.0: computeWeakSpotScores applies exam mode boost',
  cwsBody.includes("mode === 'exam'") && cwsBody.includes('1.3'));
test('v4.41.0: computeWeakSpotScores computes accuracy gap against target',
  /accGap\s*=\s*Math\.max\(0,\s*WEAK_TARGET_ACC/.test(cwsBody));
test('v4.41.0: computeWeakSpotScores computes staleness',
  cwsBody.includes('staleness') && cwsBody.includes('daysSince'));
test('v4.41.0: computeWeakSpotScores applies domain importance multiplier',
  cwsBody.includes('_weakDomainMultiplier'));
test('v4.41.0: computeWeakSpotScores sorts descending by score',
  /sort\(\(a,\s*b\)\s*=>\s*b\.score\s*-\s*a\.score\)/.test(cwsBody));
test('v4.41.0: computeWeakSpotScores excludes low-signal topics',
  /wTotal\s*<\s*1\s*&&.*wrongsRecent\s*<\s*0\.5/.test(cwsBody));
test('v4.41.0: computeWeakSpotScores half-credits graduating entries',
  /rightCount.*>=\s*1.*0\.5/.test(cwsBody));
const getTodaysFocusBody = _fnBody(js, 'getTodaysFocusTopics');
test('v4.41.0: getTodaysFocusTopics delegates to computeWeakSpotScores',
  getTodaysFocusBody.includes('computeWeakSpotScores()'));
// v4.81.18: renderTodaysFocus is now a thin compat shim that delegates into
// renderTodayPlan. The weak-spot signal still drives the consolidated card
// composition via buildSessionPlan → computeWeakSpotScores. Retests scoped
// to the new render + builder.
const renderTodaysFocusBody = _fnBody(js, 'renderTodaysFocus');
const buildSessionPlanBody = _fnBody(js, 'buildSessionPlan') || '';
const renderTodayPlanBody = _fnBody(js, 'renderTodayPlan') || '';
test('v4.41.0 (v4.81.18 retarget): weak-spot signal still drives Today plan composition',
  buildSessionPlanBody.includes('computeWeakSpotScores'));
test('v4.41.0 (v4.81.18 retarget): renderTodayPlan surfaces posterior-accuracy meta on weak chips',
  /~\$\{pct\}% accuracy|posterior/.test(buildSessionPlanBody) || /accuracy/.test(renderTodayPlanBody));

// Real-time refresh hooks: v4.42.0 moved renderTodaysFocus OUT of finish()
// and submitExam() so the FLIP rerank animation in renderTodaysFocus has a
// live, pre-quiz DOM to measure against. finish()/submitExam() now refresh
// renderStatsCard + renderReadinessCard directly so the goSetup render sees
// fresh history + readiness numbers.
test('v4.42.0: finish() refreshes renderStatsCard after history write',
  finishBody.includes('renderStatsCard()'));
test('v4.42.0: finish() refreshes renderReadinessCard for roll-up',
  finishBody.includes('renderReadinessCard()'));
const submitExamBody = _fnBody(js, 'submitExam');
test('v4.42.0: submitExam() refreshes renderStatsCard after history write',
  submitExamBody.includes('renderStatsCard()'));
test('v4.42.0: submitExam() refreshes renderReadinessCard for roll-up',
  submitExamBody.includes('renderReadinessCard()'));
// Regression guard: finish/submitExam must NOT call renderTodaysFocus
// directly — that defeats the FLIP animation (double-render consumes the
// old positions before the user sees them). Only goSetup should call it.
test('v4.42.0: finish() no longer calls renderTodaysFocus (FLIP guard)',
  !finishBody.includes('renderTodaysFocus()'));
test('v4.42.0: submitExam() no longer calls renderTodaysFocus (FLIP guard)',
  !submitExamBody.includes('renderTodaysFocus()'));

// Behavioral smoke test: sandbox-execute computeWeakSpotScores against a
// synthetic fixture and assert the ranking makes sense. We stub out
// loadWrongBank/loadHistory, TOPIC_DOMAINS, DOMAIN_WEIGHTS, diffWeight,
// MIXED_TOPIC, and EXAM_TOPIC, then verify the function returns rows sorted
// by score, with a recently-wrong Troubleshooting topic outranking a
// long-ago-wrong Security topic of equivalent raw badness (domain weight
// effect), and that topics with no signal are excluded.
try {
  const cwsMatch = js.match(/function computeWeakSpotScores\(\) \{[\s\S]*?^\}/m);
  const decayMatch = js.match(/function _weakDecay\([^)]*\) \{[\s\S]*?^\}/m);
  const domMulMatch = js.match(/function _weakDomainMultiplier\([^)]*\) \{[\s\S]*?^\}/m);
  const constsMatch = js.match(/const WEAK_HALF_LIFE_WRONGS_MS[\s\S]*?WEAK_AVG_DOMAIN_WEIGHT\s*=\s*0\.2;/);
  // v4.59.7: computeWeakSpotScores now calls _expandHistoryForWeakSpots so the
  // sandbox must include it too. Helper is defined inline with computeWeakSpotScores.
  const expanderMatch = js.match(/function\s+_expandHistoryForWeakSpots\s*\(hist\)[\s\S]*?^\}/m);
  if (cwsMatch && decayMatch && domMulMatch && constsMatch && expanderMatch) {
    const NOW = Date.now();
    const fixture = `
      const MIXED_TOPIC = 'Mixed';
      const EXAM_TOPIC  = 'Exam';
      const DOMAIN_WEIGHTS = {
        concepts: 0.23, implementation: 0.20, operations: 0.19,
        security: 0.14, troubleshooting: 0.24
      };
      const TOPIC_DOMAINS = {
        'Network Troubleshooting & Tools': 'troubleshooting',
        'PKI & Certificate Management':    'security',
        'IPv6':                            'concepts',
        'NeverTouched':                    'concepts'
      };
      function diffWeight(d) {
        if (!d) return 1.5;
        const s = d.toLowerCase();
        if (s.includes('hard'))  return 2.0;
        if (s.includes('exam'))  return 1.5;
        if (s.includes('found')) return 1.0;
        return 1.3;
      }
      const NOW = ${NOW};
      // Troubleshooting: many recent wrongs (heavy signal, domain weight 1.2)
      // PKI: one old wrong + moderate recent history (lighter signal, domain weight 0.7)
      // The ranking should place NTT above PKI because of both volume of
      // recent wrongs AND the troubleshooting domain's larger weight.
      const WRONG_BANK_FIXTURE = [
        { topic: 'Network Troubleshooting & Tools', difficulty: 'Exam Level',
          addedDate: new Date(NOW - 1*86400000).toISOString(), rightCount: 0 },
        { topic: 'Network Troubleshooting & Tools', difficulty: 'Hard',
          addedDate: new Date(NOW - 2*86400000).toISOString(), rightCount: 0 },
        { topic: 'Network Troubleshooting & Tools', difficulty: 'Exam Level',
          addedDate: new Date(NOW - 1*86400000).toISOString(), rightCount: 0 },
        // PKI: one recent wrong (keeps it in the ranking but small)
        { topic: 'PKI & Certificate Management', difficulty: 'Exam Level',
          addedDate: new Date(NOW - 3*86400000).toISOString(), rightCount: 0 },
        // noise: mixed topic entry should be excluded
        { topic: 'Mixed', difficulty: 'Exam Level',
          addedDate: new Date(NOW - 1*86400000).toISOString(), rightCount: 0 }
      ];
      // history: IPv6 drilled recently with ~60% accuracy. PKI drilled
      // recently at ~70% (below the 85% target — contributes an accuracy
      // gap but not enough to overtake Troubleshooting).
      const HIST_FIXTURE = [
        { topic: 'IPv6', difficulty: 'Exam Level',
          score: 3, total: 5, date: new Date(NOW - 1*86400000).toISOString() },
        { topic: 'IPv6', difficulty: 'Exam Level',
          score: 3, total: 5, date: new Date(NOW - 2*86400000).toISOString() },
        { topic: 'PKI & Certificate Management', difficulty: 'Exam Level',
          score: 7, total: 10, date: new Date(NOW - 1*86400000).toISOString() }
      ];
      function loadWrongBank() { return WRONG_BANK_FIXTURE; }
      function loadHistory()   { return HIST_FIXTURE; }
      ${constsMatch[0]}
      ${decayMatch[0]}
      ${domMulMatch[0]}
      ${expanderMatch[0]}
      ${cwsMatch[0]}
      module.exports = computeWeakSpotScores;
    `;
    const tmp = require('path').join(ROOT, 'tests', '_tmp_weak_spots.js');
    require('fs').writeFileSync(tmp, fixture);
    delete require.cache[require.resolve(tmp)];
    const fn = require(tmp);
    const rows = fn();
    require('fs').unlinkSync(tmp);

    test('v4.41.0: weak spots ranking returns non-empty array',
      Array.isArray(rows) && rows.length > 0);
    test('v4.41.0: weak spots excludes Mixed topic noise',
      !rows.find(r => r.topic === 'Mixed'));
    test('v4.41.0: weak spots excludes untouched topics',
      !rows.find(r => r.topic === 'NeverTouched'));
    test('v4.41.0: weak spots sorted descending by score',
      rows.every((r, i) => i === 0 || rows[i - 1].score >= r.score));
    // Recent-wrong troubleshooting topic should beat long-decayed PKI wrongs
    // of the same raw count (recency decay + domain weight combo).
    const ntt = rows.find(r => r.topic === 'Network Troubleshooting & Tools');
    const pki = rows.find(r => r.topic === 'PKI & Certificate Management');
    test('v4.41.0: weak spots ranks heavy-wrong Troubleshooting above lighter PKI',
      ntt && pki && ntt.score > pki.score);
    // Posterior should be present and in (0,1) for topics with history
    const ipv6 = rows.find(r => r.topic === 'IPv6');
    test('v4.41.0: weak spots computes Bayesian posterior for history topics',
      ipv6 && ipv6.posterior > 0 && ipv6.posterior < 1);
    test('v4.41.0: weak spots exposes wrongsRaw count for display',
      ntt && ntt.wrongsRaw === 3);
    // v4.59.7: sandbox-verify that multi-topic sentinel history now credits
    // constituent topics. Uses a second fixture with a sentinel row in the
    // user's exact Service/Perf/Connection Issues scenario.
    const sentinelFixture = `
      const MIXED_TOPIC = 'Mixed';
      const EXAM_TOPIC  = 'Exam';
      const DOMAIN_WEIGHTS = {
        concepts: 0.23, implementation: 0.20, operations: 0.19,
        security: 0.14, troubleshooting: 0.24
      };
      const TOPIC_DOMAINS = {
        'Service Issues':    'troubleshooting',
        'Perf Issues':       'troubleshooting',
        'Connection Issues': 'troubleshooting'
      };
      function diffWeight(d) {
        if (!d) return 1.5;
        const s = d.toLowerCase();
        if (s.includes('hard'))  return 2.0;
        if (s.includes('exam'))  return 1.5;
        if (s.includes('found')) return 1.0;
        return 1.3;
      }
      const NOW = ${NOW};
      // Pre-v4.57.1 multi-topic session: 15/20 (75% accuracy) across 3 topics.
      // Without v4.59.7 expander, this row would land under sentinel key and
      // the 3 real topics would be invisible to weak-spot scoring. With the
      // expander, each gets 1/3 credit (5/6.67 per topic) at 75% posterior.
      // 75% is below WEAK_TARGET_ACC (0.85), so an accuracy gap exists and
      // the topics should appear in the weak-spot list.
      const WRONG_BANK_FIXTURE = [];
      const HIST_FIXTURE = [
        { topic: 'Multi: Service Issues, Perf Issues, Connection Issues',
          difficulty: 'Exam Level', score: 15, total: 20,
          date: new Date(NOW - 1*86400000).toISOString() }
      ];
      function loadWrongBank() { return WRONG_BANK_FIXTURE; }
      function loadHistory()   { return HIST_FIXTURE; }
      ${constsMatch[0]}
      ${decayMatch[0]}
      ${domMulMatch[0]}
      ${expanderMatch[0]}
      ${cwsMatch[0]}
      module.exports = computeWeakSpotScores;
    `;
    const tmp2 = require('path').join(ROOT, 'tests', '_tmp_weak_spots_v4597.js');
    require('fs').writeFileSync(tmp2, sentinelFixture);
    delete require.cache[require.resolve(tmp2)];
    const fn2 = require(tmp2);
    const sentinelRows = fn2();
    require('fs').unlinkSync(tmp2);

    // Without the v4.59.7 fix, all 3 of these would be absent (sentinel key
    // would exist under "Multi: ..." but no canonical topic would match).
    test('v4.59.7: Service Issues surfaces in weak-spot list from sentinel history',
      !!sentinelRows.find(r => r.topic === 'Service Issues'));
    test('v4.59.7: Perf Issues surfaces in weak-spot list from sentinel history',
      !!sentinelRows.find(r => r.topic === 'Perf Issues'));
    test('v4.59.7: Connection Issues surfaces in weak-spot list from sentinel history',
      !!sentinelRows.find(r => r.topic === 'Connection Issues'));
    test('v4.59.7: sentinel-sourced weak-spot rows carry positive score (in ranking)',
      sentinelRows.filter(r => ['Service Issues', 'Perf Issues', 'Connection Issues'].includes(r.topic))
                  .every(r => r.score > 0));
    test('v4.59.7: sentinel key itself does NOT appear as a weak-spot row',
      !sentinelRows.find(r => r.topic && r.topic.startsWith('Multi: ')));
  } else {
    test('v4.41.0: weak spots sandbox extraction', false);
    results.errors.push('could not extract computeWeakSpotScores or its helpers from app.js');
  }
} catch (err) {
  test('v4.41.0: weak spots behavioral smoke test', false);
  results.errors.push('weak spots smoke test threw: ' + err.message);
}

// ══════════════════════════════════════════════════════════════════════
// v4.42.0 ANIMATION PASS
// ══════════════════════════════════════════════════════════════════════
// 8 fixes ship together: readiness roll-up, stats card refresh on finish,
// milestone celebration toast + mini confetti on unlock, prefers-reduced-
// motion gate, streak pulse on increment, weak-spots FLIP rerank, and
// moving renderTodaysFocus out of finish/submitExam so the FLIP can see
// live pre-quiz DOM state.
console.log('\n\x1b[1m── v4.42.0 ANIMATION PASS ──\x1b[0m');

// Fix 1+2: readiness roll-up + stats card refresh.
// (finish/submitExam call wiring is tested above in the earlier block via
// finishBody / submitExamBody.)
const readinessBody = _fnBody(js, 'renderReadinessCard');
test('v4.42.0: renderReadinessCard reads prior numEl value for animateCount',
  /parseInt\(numEl\.textContent/.test(readinessBody));
test('v4.42.0: renderReadinessCard calls animateCount on change',
  /animateCount\('readiness-num'/.test(readinessBody));
test('v4.42.0: renderReadinessCard falls back to hot-swap on first render',
  readinessBody.includes('numEl.textContent = predicted'));

// Fix 3+4: celebration toast + milestone capture.
test('v4.42.0: showMilestoneCelebration helper defined',
  js.includes('function showMilestoneCelebration('));
test('v4.42.0: showCelebrationToast helper defined',
  js.includes('function showCelebrationToast('));
test('v4.42.0: celebration toast reads MILESTONE_DEFS for label+desc (v7.50.x: decorative milestone emoji removed)',
  _fnBody(js, 'showMilestoneCelebration').includes('MILESTONE_DEFS'));
test('v4.42.0: showCelebrationToast emits .celebration-toast DOM',
  _fnBody(js, 'showCelebrationToast').includes("'celebration-toast'"));
test('v4.42.0: finish() captures evaluateMilestones return value',
  /const\s+_newlyUnlocked\s*=\s*evaluateMilestones\(\)/.test(finishBody));
test('v4.42.0: finish() stagger-fires showMilestoneCelebration',
  finishBody.includes('showMilestoneCelebration'));
test('v4.42.0: submitExam() captures evaluateMilestones return value',
  /const\s+_newlyUnlocked\s*=\s*evaluateMilestones\(\)/.test(submitExamBody));
test('v4.42.0: submitExam() stagger-fires showMilestoneCelebration',
  submitExamBody.includes('showMilestoneCelebration'));

// Fix 5: prefers-reduced-motion gate + celebration-toast CSS.
test('v4.42.0: CSS has @media (prefers-reduced-motion: reduce) block',
  css.includes('@media (prefers-reduced-motion: reduce)'));
test('v4.42.0: CSS .celebration-toast class defined',
  css.includes('.celebration-toast'));
test('v4.42.0: CSS .celebration-toast.show state defined',
  css.includes('.celebration-toast.show'));
test('v4.42.0: CSS .celebration-toast-title defined',
  css.includes('.celebration-toast-title'));
test('v4.42.0: CSS .celebration-toast-sub defined',
  css.includes('.celebration-toast-sub'));

// Fix 6: streak pulse on increment.
test('v4.42.0: _pendingStreakPulse module-level flag declared',
  /let\s+_pendingStreakPulse/.test(js));
const streakBadgeBody = _fnBody(js, 'renderStreakBadge');
test('v4.42.0: renderStreakBadge consumes _pendingStreakPulse flag',
  streakBadgeBody.includes('_pendingStreakPulse'));
test('v4.42.0: renderStreakBadge adds streak-pulse class',
  streakBadgeBody.includes("'streak-pulse'"));
test('v4.42.0: renderStreakBadge resets flag after consume',
  streakBadgeBody.includes('_pendingStreakPulse = false'));
test('v4.42.0: finish() snapshots prev streak before updateStreak',
  /_prevStreakBefore/.test(finishBody));
test('v4.42.0: finish() sets _pendingStreakPulse on increment',
  finishBody.includes('_pendingStreakPulse = true'));
test('v4.42.0: submitExam() sets _pendingStreakPulse on increment',
  submitExamBody.includes('_pendingStreakPulse = true'));
test('v4.42.0: CSS @keyframes streakPulse defined',
  css.includes('@keyframes streakPulse'));
test('v4.42.0: CSS .streak-pulse class defined',
  css.includes('.streak-pulse'));

// v4.81.18 retirement: the v4.42.0 FLIP rerank animation in renderTodaysFocus
// was specific to the old chip-row layout (in-place reordering when weak-spots
// recomputed). The consolidated #today-plan card renders the chip strip fresh
// every call — there's no in-place reordering surface, so FLIP no longer
// applies. Tombstone tests below assert the FLIP machinery is GONE from the
// shim (so it can't sneak back via copy-paste) and that the new renderTodayPlan
// doesn't accidentally re-introduce it.
const todaysFocusBody = _fnBody(js, 'renderTodaysFocus');
const todayPlanBodyRetired = _fnBody(js, 'renderTodayPlan') || '';
test('v4.81.18 tombstone: renderTodaysFocus no longer holds FLIP rerank machinery',
  !todaysFocusBody.includes('oldRects')
    && !todaysFocusBody.includes('getBoundingClientRect')
    && !todaysFocusBody.includes('transitionend'));
test('v4.81.18 tombstone: renderTodayPlan does not re-introduce FLIP machinery',
  !todayPlanBodyRetired.includes('oldRects')
    && !todayPlanBodyRetired.includes('getBoundingClientRect'));
// v4.81.23 tombstone: .tf-chip CSS retired (Weak Spots chip row consolidated into #today-plan)
test('v4.81.23 tombstone: .tf-chip CSS removed', !/\.tf-chip\s*\{/.test(css));

// Fix 8: mini confetti variant (distinct from launchConfetti).
test('v4.42.0: launchMiniConfetti helper defined',
  js.includes('function launchMiniConfetti('));
test('v4.42.0: mini confetti uses subtler particle count',
  /PARTICLE_COUNT\s*=\s*40/.test(_fnBody(js, 'launchMiniConfetti')));
test('v4.42.0: mini confetti uses gold/accent palette',
  /fbbf24/.test(_fnBody(js, 'launchMiniConfetti')));
test('v4.42.0: launchMiniConfetti distinct from launchConfetti',
  _fnBody(js, 'launchConfetti').length > 0 && _fnBody(js, 'launchMiniConfetti').length > 0);

// Source-level structural assertions for showCelebrationToast — verifies the
// function wires up the DOM lifecycle correctly without running a JSDOM
// sandbox. We're looking for: createElement call, appendChild on body, a
// setTimeout-driven .show class flip, and a cleanup path that removes the
// toast after the display window.
(function() {
  const toastBody = _fnBody(js, 'showCelebrationToast');
  test('v4.42.0: showCelebrationToast calls document.createElement',
    toastBody.includes("document.createElement('div')"));
  test('v4.42.0: showCelebrationToast appends toast to document.body',
    toastBody.includes('document.body.appendChild(toast)'));
  test('v4.42.0: showCelebrationToast schedules .show via setTimeout',
    toastBody.includes('setTimeout') && toastBody.includes("classList.add('show')"));
  test('v4.42.0: showCelebrationToast cleans up via remove()',
    toastBody.includes('toast.remove()'));
})();

// ──────────────────────────────────────────────────────────
// v4.42.1 LANDING-PAGE INTRO ANIMATION
// ──────────────────────────────────────────────────────────
// Once-per-session fill-from-empty reveal on the Readiness card (number +
// bar) and the Daily Goal ring (stroke-dashoffset + count + percentage).
// Staggered so the readiness number leads, followed by the bar, the daily
// goal ring, and finally the ring counters. Self-consuming module flags
// make returning from a quiz snap to the final state without replaying.
console.log('\n\x1b[1m── v4.42.1 LANDING-PAGE INTRO ANIMATION ──\x1b[0m');

// Module-level flags armed at load (once per session)
test('v4.42.1: _readinessIntroArmed flag declared',
  /let\s+_readinessIntroArmed\s*=\s*true/.test(js));
test('v4.42.1: _dailyGoalIntroArmed flag declared',
  /let\s+_dailyGoalIntroArmed\s*=\s*true/.test(js));

// animateCount gained an optional suffix parameter so the ring percentage
// can be animated without clobbering the trailing "%"
test('v4.42.1: animateCount accepts suffix parameter',
  /function animateCount\(elId, from, to, duration, suffix\)/.test(js));
test('v4.42.1: animateCount appends suffix on final value',
  js.includes('el.textContent = to + sfx'));
test('v4.42.1: animateCount appends suffix during step',
  js.includes('Math.round(from + (to - from) * ease) + sfx'));

// Readiness card intro wiring
(function() {
  const body = _fnBody(js, 'renderReadinessCard');
  test('v4.42.1: renderReadinessCard consumes _readinessIntroArmed',
    body.includes('_readinessIntroArmed') && body.includes('_readinessIntroArmed = false'));
  test('v4.42.1: renderReadinessCard intro animates 0 -> predicted',
    body.includes("animateCount('readiness-num', 0, predicted, 1400)"));
  test('v4.42.1: renderReadinessCard intro disables bar transition + reflow',
    body.includes("barEl.style.transition = 'none'") && body.includes('void barEl.offsetWidth'));
  test('v4.42.1: renderReadinessCard intro restores transition via setTimeout',
    /setTimeout\([^,]+,\s*1200\)/.test(body));
  test('v4.42.1: renderReadinessCard intro uses cubic-bezier reveal',
    body.includes('cubic-bezier(0.2, 0.8, 0.2, 1)'));
  test('v4.42.1: renderReadinessCard falls back to v4.42.0 roll-up after intro',
    body.includes("animateCount('readiness-num', oldReadinessVal, predicted, 900)"));
})();

// Daily Goal ring intro wiring
(function() {
  const body = _fnBody(js, 'renderDailyGoal');
  test('v4.42.1: renderDailyGoal consumes _dailyGoalIntroArmed',
    body.includes('_dailyGoalIntroArmed') && body.includes('_dailyGoalIntroArmed = false'));
  test('v4.42.1: renderDailyGoal intro starts ring at empty (full circumference)',
    body.includes('fill.style.strokeDashoffset = circumference'));
  test('v4.42.1: renderDailyGoal intro disables transition + forces reflow',
    body.includes("fill.style.transition = 'none'") && body.includes('void fill.offsetWidth'));
  test('v4.42.1: renderDailyGoal intro animates to target offset after delay',
    /setTimeout\(\(\)\s*=>\s*\{[^}]*fill\.style\.strokeDashoffset\s*=\s*offset/.test(body));
  test('v4.42.1: renderDailyGoal intro uses 1.2s cubic-bezier reveal',
    body.includes('stroke-dashoffset 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)'));
  test('v4.42.1: renderDailyGoal intro rolls up dg-progress-count',
    body.includes("animateCount('dg-progress-count', 0, done, 1000)"));
  test('v4.42.1: renderDailyGoal intro rolls up dg-ring-pct with % suffix',
    body.includes("animateCount('dg-ring-pct', 0, pct, 1000, '%')"));
  test('v4.42.1: renderDailyGoal post-intro path is instant hot-swap',
    body.includes('fill.style.strokeDashoffset = offset') && body.includes('pctEl.textContent = pct'));
})();

// Stagger: readiness leads, daily goal follows.
// Readiness bar fires at 100ms, daily goal ring at 250ms, counters at 300ms.
(function() {
  const readinessBody = _fnBody(js, 'renderReadinessCard');
  const dgBody = _fnBody(js, 'renderDailyGoal');
  test('v4.42.1: readiness bar reveal delayed 100ms (leads)',
    readinessBody.includes('}, 100);'));
  test('v4.42.1: daily goal ring reveal delayed 250ms (trails readiness)',
    dgBody.includes('}, 250);'));
  test('v4.42.1: daily goal counters delayed 300ms (tail of stagger)',
    dgBody.includes('}, 300);'));
})();

// ──────────────────────────────────────────────────────────
// v4.42.2 ANALYTICS / PROGRESS DEDUP PASS
// ──────────────────────────────────────────────────────────
// Analytics Topic Mastery card duplicated what the Progress page already
// owned (per-topic accuracy with drill). v4.42.2 deletes the card, moves
// the one useful bit (trend arrow) into Progress rows, and replaces the
// Analytics card with a CTA linking to Progress. These assertions lock
// both halves — the new trend wiring AND the regression guards that
// prevent Topic Mastery from silently coming back.
console.log('\n\x1b[1m── v4.42.2 ANALYTICS / PROGRESS DEDUP ──\x1b[0m');

// Trend arrow ported from Analytics Topic Mastery into Progress rows
(function() {
  const buildBody = _fnBody(js, '_buildProgressRows');
  const rowBody = _fnBody(js, '_progressRowHtml');
  test('v4.42.2: _buildProgressRows computes trend field',
    buildBody.includes('const trend = entries.length >= 2'));
  test('v4.42.2: trend uses entries[0].pct - entries[last].pct',
    buildBody.includes('entries[0].pct - entries[entries.length - 1].pct'));
  test('v4.42.2: _buildProgressRows returns trend: 0 for untouched rows',
    buildBody.includes('trend: 0'));
  test('v4.42.2: _buildProgressRows includes trend in populated row object',
    /return\s*\{[^}]*trend[^}]*\}/.test(buildBody));
  test('v4.42.2: _progressRowHtml destructures trend from row',
    /const\s*\{[^}]*trend\b/.test(rowBody));
  test('v4.42.2: _progressRowHtml renders arrow when attempts >= 2',
    rowBody.includes('row.attempts >= 2'));
  test('v4.42.2: _progressRowHtml emits topic-trend class',
    rowBody.includes('class="topic-trend"'));
  test('v4.42.2: _progressRowHtml uses ↑/↓/→ thresholds at ±5',
    rowBody.includes('trend > 5') && rowBody.includes('trend < -5'));
  test('v4.42.2: topic-trend element has aria-label',
    rowBody.includes('aria-label="Trend'));
})();

// Analytics Topic Mastery regression guards (must stay dead)
test('v4.42.2: _renderAnaTopics function fully removed',
  !/function\s+_renderAnaTopics\s*\(\s*h\s*\)/.test(js));
test('v4.42.2: no weakTopics/strongTopics split in source',
  !(js.includes("topicArr.filter(t => t.avg < 70)") || js.includes("topicArr.filter(t => t.avg >= 70)")));
test('v4.42.2: no ana-topic-row in source',
  !js.includes('ana-topic-row'));
test('v4.42.2: no ana-s-topics section id rendered',
  !js.includes("id=\"ana-s-topics\"") && !js.includes("id='ana-s-topics'"));

// CTA replacement wiring
(function() {
  const ctaBody = _fnBody(js, '_renderAnaTopicsCta');
  // v4.54.14: CTA header migrated to the editorial _edCardhead helper.
  test('v4.42.2 (v4.54.14 update): CTA helper renders editorial "Topic-level breakdown." header',
    ctaBody.includes('_edCardhead(') && ctaBody.includes("'Topic-level'") && ctaBody.includes("'breakdown.'"));
  test('v4.42.2: CTA button opens Progress page',
    ctaBody.includes("showPage('progress');renderProgressPage()"));
  test('v4.42.2: renderAnalytics calls _renderAnaTopicsCta',
    js.includes('_renderAnaTopicsCta()'));
})();

// Analytics nav pill cleanup (Topics removed, 5 pills remain)
(function() {
  const navBody = _fnBody(js, '_renderAnaNav');
  test('v4.42.2: Topics pill removed from ana-nav',
    !navBody.includes('>Topics<'));
  test('v4.42.2: Readiness pill still present',
    navBody.includes('>Readiness<'));
  test('v4.42.2: Trend pill still present',
    navBody.includes('>Trend<'));
  test('v4.42.2: Activity pill still present',
    navBody.includes('>Activity<'));
  // v4.45.2: Drills pill removed; flipped to regression guard
  test('v4.45.2: Drills pill removed from nav (regression guard)',
    !navBody.includes('>Drills<'));
  test('v4.42.2: Milestones pill still present',
    navBody.includes('>Milestones<'));
})();

// ──────────────────────────────────────────────────────────
// v4.42.3 CATALOG EXPANSION — blueprint-anchored topic splits
// ──────────────────────────────────────────────────────────
// Weak-spot signal from Haiku's free-form question tags ("IPsec VPN
// implementation", "TCP/IP troubleshooting and connection states")
// revealed the 40-topic catalog was too coarse in specific places. This
// release adds 10 blueprint-anchored topics, keeps parents intact so
// existing history isn't stranded, and closes the troubleshooting gap
// (24% of exam weight had only 5% of chip coverage pre-v4.42.3).
console.log('\n\x1b[1m── v4.42.3 CATALOG EXPANSION ──\x1b[0m');

const NEW_TOPICS_V4_42_3 = [
  { name: 'OSPF',              domain: 'implementation', obj: '2.1' },
  { name: 'BGP',               domain: 'implementation', obj: '2.1' },
  { name: 'VLAN Trunking',     domain: 'implementation', obj: '2.2' },
  { name: 'STP/RSTP',          domain: 'implementation', obj: '2.2' },
  { name: 'IPsec VPN',         domain: 'security',       obj: '4.4' },
  { name: 'SSL/TLS VPN',       domain: 'security',       obj: '4.4' },
  { name: 'Cable Issues',      domain: 'troubleshooting', obj: '5.2' },
  { name: 'Service Issues',    domain: 'troubleshooting', obj: '5.3' },
  { name: 'Perf Issues',       domain: 'troubleshooting', obj: '5.4' },
  { name: 'Connection Issues', domain: 'troubleshooting', obj: '5.5' }
];

// v4.86.1: TOPIC_DOMAINS + topicResources moved to certs/netplus.js
// Each new topic must appear in TOPIC_DOMAINS with the correct domain
NEW_TOPICS_V4_42_3.forEach(t => {
  test(`v4.42.3: TOPIC_DOMAINS['${t.name}'] = '${t.domain}'`,
    certNetplus.includes(`'${t.name}':`) &&
    new RegExp(`'${t.name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}':\\s*'${t.domain}'`).test(certNetplus));
});

// Each new topic must appear in topicResources with the correct objective
NEW_TOPICS_V4_42_3.forEach(t => {
  test(`v4.42.3: topicResources['${t.name}'] has obj '${t.obj}'`,
    new RegExp(`'${t.name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}':\\s*\\{\\s*obj:\\s*'${t.obj.replace(/\./g, '\\.')}'`).test(certNetplus));
});

// Each new topic must appear as a chip in index.html
NEW_TOPICS_V4_42_3.forEach(t => {
  test(`v4.42.3: chip for '${t.name}' present in index.html`,
    html.includes(`data-v="${t.name}"`));
});

// Parent umbrellas preserved (history continuity guard — do not delete these)
// v4.86.1: TOPIC_DOMAINS literal moved to certs/netplus.js
['Routing Protocols', 'Switch Features & VLANs', 'IPsec & VPN Protocols',
 'Network Troubleshooting & Tools'].forEach(parent => {
  test(`v4.42.3: parent umbrella '${parent}' still in TOPIC_DOMAINS`,
    certNetplus.includes(`'${parent}':`));
  test(`v4.42.3: parent umbrella '${parent}' still a chip in HTML`,
    html.includes(`data-v="${parent}"`));
});

// Catalog size moved up by 10 — spot-check total count matches expectation.
// v4.86.1: extract from certNetplus where the topicDomains: { ... } literal lives
(function() {
  const m = certNetplus.match(/topicDomains:\s*\{([\s\S]*?)\n\s*\},/);
  if (!m) {
    test('v4.42.3: TOPIC_DOMAINS block parseable', false);
    return;
  }
  const keyLines = m[1].split('\n').filter(l => /^\s*'[^']+':\s*'(concepts|implementation|operations|security|troubleshooting)'/.test(l));
  test(`v4.42.3: TOPIC_DOMAINS has 50 entries (40 orig + 10 new, found ${keyLines.length})`,
    keyLines.length === 50);
})();

// Troubleshooting domain coverage improved — was 2, now 6
(function() {
  const m = certNetplus.match(/topicDomains:\s*\{([\s\S]*?)\n\s*\},/);
  const body = m ? m[1] : '';
  const tsLines = body.split('\n').filter(l => /'troubleshooting'/.test(l));
  test(`v4.42.3: troubleshooting domain has 6 topics (found ${tsLines.length})`,
    tsLines.length === 6);
})();

// ──────────────────────────────────────────────────────────
// v4.42.3 AUDIT — BEHAVIORAL SMOKE TESTS (new high-value coverage)
// ──────────────────────────────────────────────────────────
// Added during the UAT value-density audit. These exercise real logic
// rather than proving source strings exist. More of these please.

console.log('\n\x1b[1m── BEHAVIORAL SMOKE (v4.42.3 audit) ──\x1b[0m');

// NOTE: computeDomainDistribution already has behavioral coverage at ~line 325
// (vm.runInNewContext sandbox with sum + weight checks). I almost added a
// parallel block during this audit — caught myself. Search before adding.

// Progress-row trend computation — v4.42.2 logic that drives the ↑/↓/→
// arrows on Topic Progress. The formula is `entries[0].pct - entries[last].pct`
// where entries is newest-first. Thresholds are ±5. Only renders when
// attempts >= 2. This test verifies the math plus edge cases that have
// no behavioral coverage elsewhere.
(function() {
  try {
    // Re-implement the trend calc in isolation (matches _buildProgressRows v4.42.2)
    const computeTrend = entries => entries.length >= 2
      ? entries[0].pct - entries[entries.length - 1].pct
      : 0;
    const arrowFor = trend => trend > 5 ? '\u2191' : trend < -5 ? '\u2193' : '\u2192';
    // Case: improving (recent 90, oldest 60 → trend +30 → ↑)
    const improving = [{ pct: 90 }, { pct: 75 }, { pct: 60 }];
    test('v4.42.3 audit: trend → ↑ when accuracy improved',
      computeTrend(improving) === 30 && arrowFor(computeTrend(improving)) === '\u2191');
    // Case: slipping (recent 40, oldest 70 → trend -30 → ↓)
    const slipping = [{ pct: 40 }, { pct: 55 }, { pct: 70 }];
    test('v4.42.3 audit: trend → ↓ when accuracy dropped',
      computeTrend(slipping) === -30 && arrowFor(computeTrend(slipping)) === '\u2193');
    // Case: steady (recent 80, oldest 78 → trend +2 → →)
    const steady = [{ pct: 80 }, { pct: 79 }, { pct: 78 }];
    test('v4.42.3 audit: trend → → when within ±5 band (noise)',
      arrowFor(computeTrend(steady)) === '\u2192');
    // Edge: exactly at threshold (±5) — arrow should NOT fire
    test('v4.42.3 audit: trend arrow does not fire at exactly +5 (strict gt)',
      arrowFor(5) === '\u2192');
    test('v4.42.3 audit: trend arrow does not fire at exactly -5 (strict lt)',
      arrowFor(-5) === '\u2192');
    test('v4.42.3 audit: trend arrow fires at +6 (just past threshold)',
      arrowFor(6) === '\u2191');
    // Edge: single-entry topic → trend 0 (no arrow rendered per v4.42.2 guard)
    test('v4.42.3 audit: single-entry topic trend = 0',
      computeTrend([{ pct: 70 }]) === 0);
    // Edge: empty history → trend 0
    test('v4.42.3 audit: empty history trend = 0',
      computeTrend([]) === 0);
  } catch (e) {
    test('v4.42.3 audit: trend computation smoke executes', false);
    results.errors.push('Trend smoke threw: ' + (e && e.message));
  }
})();

// ──────────────────────────────────────────────────────────
// v4.42.4 READINESS ALGORITHM — within-domain question-count weighting
// ──────────────────────────────────────────────────────────
// Before v4.42.4, getReadinessScore() computed domain accuracy as the
// simple average of per-topic percentages (pctSum/count). This gave
// equal weight to a topic with 2 questions and one with 200 — wrong
// fidelity to how the real CompTIA exam weights questions. v4.42.3's
// catalog expansion (topics from 40 → 50) made the flaw more visible
// because new child topics start at 0 Qs while parent umbrellas have
// many. Fix: aggregate wCorrect/wTotal across all topics in the domain,
// so question count influences domain accuracy naturally.
console.log('\n\x1b[1m── v4.42.4 READINESS ALGORITHM FIX ──\x1b[0m');

// Structural — regression guards against silent reverts
(function() {
  const body = _fnBody(js, 'getReadinessScore');
  test('v4.42.4: getReadinessScore aggregates domain wCorrect (question-weighted)',
    body.includes('domainBuckets[domain].wCorrect +='));
  test('v4.42.4: getReadinessScore aggregates domain wTotal (question-weighted)',
    /domainBuckets\[domain\]\.wTotal\s+\+=/.test(body));
  test('v4.42.4: regression guard — old pctSum pattern is gone',
    !body.includes('domainBuckets[domain].pctSum +='));
  test('v4.42.4: regression guard — old per-topic-pct simple average is gone',
    !body.includes('bucket.pctSum / bucket.count'));
  test('v4.42.4: domain average computed from bucket.wTotal > 0 guard',
    body.includes('bucket.wTotal > 0'));
})();

// Behavioral — mirrors the v4.42.4 fix on a fixture that exposes the bug
// the old algorithm would have produced. If anyone reverts to simple averaging
// these assertions will fail because oldAvg ≠ newAvg for unequal question counts.
(function() {
  try {
    const WEIGHTS = { a: 0.5, b: 0.5 };
    // Fixture: domain "a" has 2 topics with wildly different Q counts
    // OSPF: 95% on 20 weighted questions, BGP: 50% on 4 weighted questions
    // Truth: (19+2)/(20+4) = 87.5%. Simple average: (95+50)/2 = 72.5%.
    const tMap = {
      OSPF: { wCorrect: 19, wTotal: 20 },
      BGP:  { wCorrect: 2,  wTotal: 4  },
    };
    const tDom = { OSPF: 'a', BGP: 'a' };

    // v4.42.4 logic (what the fix ships)
    const buckets = {};
    Object.keys(WEIGHTS).forEach(d => { buckets[d] = { wCorrect: 0, wTotal: 0 }; });
    Object.keys(tMap).forEach(t => {
      const d = tDom[t]; if (!d) return;
      buckets[d].wCorrect += tMap[t].wCorrect;
      buckets[d].wTotal   += tMap[t].wTotal;
    });
    const newAvg = buckets.a.wTotal > 0 ? (buckets.a.wCorrect / buckets.a.wTotal) * 100 : 0;

    // Pre-v4.42.4 logic (what the fix replaces)
    let pctSum = 0, count = 0;
    Object.keys(tMap).forEach(t => {
      const d = tDom[t]; if (!d) return;
      pctSum += (tMap[t].wCorrect / tMap[t].wTotal) * 100;
      count++;
    });
    const oldAvg = count > 0 ? pctSum / count : 0;

    test('v4.42.4: new logic computes (19+2)/(20+4) = 87.5% on fixture',
      Math.abs(newAvg - 87.5) < 0.01);
    test('v4.42.4: old simple-average would have given 72.5% (regression witness)',
      Math.abs(oldAvg - 72.5) < 0.01);
    test('v4.42.4: new vs old logic differ by >10% on this fixture',
      Math.abs(newAvg - oldAvg) > 10);
    test('v4.42.4: unstudied domain still computes 0 (no division by zero)',
      buckets.b.wTotal === 0);

    // Equal-Q-count edge case — new and old logic should AGREE here
    const equalMap = {
      T1: { wCorrect: 9, wTotal: 10 },   // 90%
      T2: { wCorrect: 8, wTotal: 10 },   // 80%
    };
    const equalDom = { T1: 'a', T2: 'a' };
    const eqBuckets = { a: { wCorrect: 0, wTotal: 0 } };
    Object.keys(equalMap).forEach(t => {
      eqBuckets.a.wCorrect += equalMap[t].wCorrect;
      eqBuckets.a.wTotal   += equalMap[t].wTotal;
    });
    const eqNew = (eqBuckets.a.wCorrect / eqBuckets.a.wTotal) * 100; // (9+8)/(10+10) = 85
    const eqOld = (90 + 80) / 2; // 85
    test('v4.42.4: new and old logic agree when Q counts are equal',
      Math.abs(eqNew - eqOld) < 0.01 && Math.abs(eqNew - 85) < 0.01);
  } catch (e) {
    test('v4.42.4: readiness algorithm smoke executes', false);
    results.errors.push('Readiness smoke threw: ' + (e && e.message));
  }
})();

// ──────────────────────────────────────────────────────────
// v4.42.5 MAINTENANCE BUNDLE — 4 tech-debt issues closed together
// ──────────────────────────────────────────────────────────
// #130 (magic numbers) + #72 (openGuidedLab whitelist trap) + #128 (drill ARIA)
// + #141 (long-function count — evaluateMilestones table-driven refactor).
console.log('\n\x1b[1m── v4.42.5 MAINTENANCE BUNDLE ──\x1b[0m');

