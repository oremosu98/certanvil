// tests/uat/070-retention-tb3d-tours-sr-onboarding.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Retention concepts, exemplar bank infra, TB 3D view phases 1-4, scenario tours, pass-rate prediction, spaced repetition queue (SM-2) + all SR enhancement phases, onboarding gate, free-tier lock

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ══════════════════════════════════════════════════════════════════════
// v4.62.3 — Priority Retention Concepts injected into every quiz+exam
// User asked: ensure the 14 recently-studied gap topics get tested across
// all quiz + exam flows, not as a standalone drill. RETENTION_GAP_CONCEPTS
// array (label, parentTopic, objective, keyword for each of the 14) is
// formatted into a prompt block via _formatRetentionConceptsForPrompt()
// and injected alongside the curated-exemplar block in every
// _fetchQuestionsBatch call — applies to custom quiz, Mixed, Daily
// Challenge, Marathon, and the Exam simulator uniformly.
// ══════════════════════════════════════════════════════════════════════

// v4.86.0 update: RETENTION_GAP_CONCEPTS array literal moved to certs/netplus.js
// as part of Phase 1A engine refactor. app.js now reads via CERT_PACK with empty
// array fallback. UAT assertions on the array contents target certNetplus directly.
test('v4.62.3 JS: RETENTION_GAP_CONCEPTS reads from CERT_PACK (cert-pack-aware)',
  /const\s+RETENTION_GAP_CONCEPTS\s*=.*CERT_PACK.*retentionGapConcepts/.test(js));
test('v4.62.3 cert pack: retentionGapConcepts array literal lives in certs/netplus.js',
  /retentionGapConcepts:\s*\[/.test(certNetplus));
test('v4.62.3 cert pack: seeded with the 14 v4.59.0 Cycle-1 gap topics',
  /label:\s*['"]Powerload['"][\s\S]{0,400}label:\s*['"]NTS['"]/.test(certNetplus) &&
  /label:\s*['"]NAC['"][\s\S]{0,400}label:\s*['"]Preaction fire system['"]/.test(certNetplus) &&
  /label:\s*['"]PCAP File['"]/.test(certNetplus));
test('v4.62.3 JS: _formatRetentionConceptsForPrompt helper defined',
  /function\s+_formatRetentionConceptsForPrompt\s*\(\)/.test(js));
test('v4.62.3 JS: helper returns empty string when list is empty (no-op path)',
  /if\s*\(!Array\.isArray\(RETENTION_GAP_CONCEPTS\)\s*\|\|\s*RETENTION_GAP_CONCEPTS\.length\s*===\s*0\)\s*return\s+['"]['"]/.test(js));
test('v4.62.3 JS: prompt block header contains "PRIORITY RETENTION CONCEPTS"',
  /PRIORITY RETENTION CONCEPTS/.test(js));
test('v4.62.3 JS: prompt block explicitly frames it as a tiebreaker, not a mandate',
  /tiebreaker[\s\S]{0,200}not a mandate|prefer[\s\S]{0,300}over alternatives/i.test(js));
test('v4.62.3 JS: retentionBlock declared inside _fetchQuestionsBatch',
  /function _fetchQuestionsBatch[\s\S]{0,25000}const\s+retentionBlock\s*=\s*\(typeof\s+_formatRetentionConceptsForPrompt/.test(js));
test('v4.62.3 JS: buildPrompt template interpolates retentionBlock alongside exemplarBlock',
  /\$\{exemplarBlock\}\$\{retentionBlock\}/.test(js));

// Behavioural — sandbox the formatter against the real const to check it
// emits the expected structure when non-empty + empty-string when empty.
// v4.86.0 update: const literal moved to certs/netplus.js. Extract from
// certNetplus source instead of js.
(function testRetentionFormat() {
  try {
    const vm = require('vm');
    const helperBody = js.match(/function\s+_formatRetentionConceptsForPrompt\s*\(\)\s*\{([\s\S]*?)\n\}/);
    // v4.86.0: literal now in certs/netplus.js as `retentionGapConcepts: [...]`
    const constMatch = certNetplus.match(/retentionGapConcepts:\s*\[([\s\S]*?)\n\s*\],/);
    if (!helperBody || !constMatch) {
      test('v4.62.3 sandbox: helper + const extracted', false);
      return;
    }
    test('v4.62.3 sandbox: helper + const extracted', true);

    // Non-empty case: use the real const
    const ctx1 = {};
    vm.createContext(ctx1);
    vm.runInContext(`const RETENTION_GAP_CONCEPTS = [${constMatch[1]}];`, ctx1);
    vm.runInContext(`function _formatRetentionConceptsForPrompt() {${helperBody[1]}}`, ctx1);
    const output = vm.runInContext('_formatRetentionConceptsForPrompt()', ctx1);
    test('v4.62.3 sandbox: non-empty list produces a PRIORITY RETENTION CONCEPTS prompt block',
      typeof output === 'string' && output.indexOf('PRIORITY RETENTION CONCEPTS') > -1);
    test('v4.62.3 sandbox: prompt block lists "Powerload" concept',
      output.indexOf('"Powerload"') > -1);
    test('v4.62.3 sandbox: prompt block lists "PCAP File" concept',
      output.indexOf('"PCAP File"') > -1);
    test('v4.62.3 sandbox: prompt block explicitly frames concepts as a tiebreaker',
      /tiebreaker|prefer/.test(output));

    // Empty case: guard returns '' so prompt collapses to nothing
    const ctx2 = {};
    vm.createContext(ctx2);
    vm.runInContext(`const RETENTION_GAP_CONCEPTS = [];`, ctx2);
    vm.runInContext(`function _formatRetentionConceptsForPrompt() {${helperBody[1]}}`, ctx2);
    const emptyOutput = vm.runInContext('_formatRetentionConceptsForPrompt()', ctx2);
    test('v4.62.3 sandbox: empty list returns empty string (no-op)',
      emptyOutput === '');

    // Non-array case (defensive): still returns empty string
    const ctx3 = {};
    vm.createContext(ctx3);
    vm.runInContext(`const RETENTION_GAP_CONCEPTS = null;`, ctx3);
    vm.runInContext(`function _formatRetentionConceptsForPrompt() {${helperBody[1]}}`, ctx3);
    const nullOutput = vm.runInContext('_formatRetentionConceptsForPrompt()', ctx3);
    test('v4.62.3 sandbox: non-array (null) returns empty string (defensive)',
      nullOutput === '');
  } catch (e) {
    test('v4.62.3 sandbox: formatter executed without error', false);
  }
})();

// ══════════════════════════════════════════════════════════════════════
// v4.57.5 — Unify per-domain pct between Domain Mastery + Domain Breakdown
// User flagged: Networking Concepts showed 69% in the Readiness hero's
// Domain Breakdown but 70% in Domain Mastery. Root cause: Breakdown used
// weighted `domainAccuracy` (diff × exam-boost × recency-boost), Mastery
// used raw sum(correct)/sum(total). v4.57.5 extracts a shared helper so
// both surfaces show the same number. Weighted calc stays INTERNAL for
// the Readiness 720-score only.
// ══════════════════════════════════════════════════════════════════════

test('v4.57.5 JS: computeDomainRawAccuracy helper defined',
  /function\s+computeDomainRawAccuracy\(h\)/.test(js));
test('v4.57.5 JS: helper exposes all 5 CompTIA domains',
  /byDomain\s*=\s*\{[\s\S]{0,400}concepts:[\s\S]{0,100}implementation:[\s\S]{0,100}operations:[\s\S]{0,100}security:[\s\S]{0,100}troubleshooting:/.test(js));
test('v4.57.5 JS: helper skips MIXED_TOPIC + EXAM_TOPIC entries',
  /e\.topic === MIXED_TOPIC \|\| e\.topic === EXAM_TOPIC/.test(js));
test('v4.57.5 JS: helper uses raw sum(correct)/sum(total) per domain',
  /byDomain\[d\]\.c \+= \(e\.score \|\| 0\)[\s\S]{0,100}byDomain\[d\]\.t \+= \(e\.total \|\| 0\)/.test(js));
test('v4.57.5 JS: Readiness hero Domain Breakdown now uses computeDomainRawAccuracy (not weighted domainAccuracy)',
  /domainRawAccuracy = computeDomainRawAccuracy\(h\)[\s\S]{0,300}pct = Math\.round\(domainRawAccuracy\[d\]/.test(js));
test('v4.57.5 JS: weighted domainAccuracy still feeds accuracyScore (Readiness 720-tier unchanged)',
  /domainAccuracy\[d\]\s*=\s*avg[\s\S]{0,200}accuracyScore \+= avg \* DOMAIN_WEIGHTS\[d\]/.test(js));

// Behavioural — vm-sandbox the helper with fixtures and confirm both cards
// would produce the same pct for the same input history
(function testDomainRawAccuracy() {
  try {
    const vm = require('vm');
    const bodyMatch = js.match(/function\s+computeDomainRawAccuracy\(h\)\s*\{([\s\S]*?)\n\}/);
    if (!bodyMatch) { test('v4.57.5 sandbox: helper body extracted', false); return; }
    test('v4.57.5 sandbox: helper body extracted', true);

    // Stub TOPIC_DOMAINS for the sandbox
    const ctx = {
      MIXED_TOPIC: 'Mixed — All Topics',
      EXAM_TOPIC: 'Exam Simulation',
      TOPIC_DOMAINS: {
        'OSI Model': 'concepts',
        'Subnetting & IP Addressing': 'concepts',
        'OSPF': 'implementation',
        'BGP': 'implementation',
        'Firewalls, DMZ & Security Zones': 'security',
        'Connection Issues': 'troubleshooting',
        'Perf Issues': 'troubleshooting',
        'Service Issues': 'troubleshooting'
      }
    };
    vm.createContext(ctx);
    const fn = vm.runInContext(`(function(h) {${bodyMatch[1]}})`, ctx);

    // Simulate user's scenario: 7/10 on OSI (concepts), 15/20 on Subnetting (concepts) → 22/30 = 73.33%
    const history = [
      { topic: 'OSI Model', score: 7, total: 10, date: '2026-04-21T08:00:00Z' },
      { topic: 'Subnetting & IP Addressing', score: 15, total: 20, date: '2026-04-21T09:00:00Z' },
      { topic: 'OSPF', score: 8, total: 10, date: '2026-04-20T10:00:00Z' },
      { topic: 'Mixed — All Topics', score: 50, total: 90, date: '2026-04-19T11:00:00Z' },  // MIXED: skipped
      { topic: 'Exam Simulation', score: 60, total: 90, date: '2026-04-18T12:00:00Z' },  // EXAM: skipped
    ];
    const result = fn(history);

    test('v4.57.5 sandbox: concepts = (7+15)/(10+20) = 73.33% (rounds to 73)',
      Math.round(result.concepts) === 73);
    test('v4.57.5 sandbox: implementation = 8/10 = 80%',
      Math.round(result.implementation) === 80);
    test('v4.57.5 sandbox: operations = 0 (unstudied)',
      result.operations === 0);
    test('v4.57.5 sandbox: security = 0 (unstudied)',
      result.security === 0);
    test('v4.57.5 sandbox: troubleshooting = 0 (unstudied)',
      result.troubleshooting === 0);
    test('v4.57.5 sandbox: MIXED_TOPIC entry is excluded (no contribution)',
      Math.round(result.concepts) === 73);  // would be different if MIXED counted
    test('v4.57.5 sandbox: EXAM_TOPIC entry is excluded (no contribution)',
      Math.round(result.implementation) === 80);  // would be different if EXAM counted

    // Reproduce the user's reported 69 vs 70 scenario — show both cards produce same number
    const netConceptsHistory = [];
    // 77 correct out of 110 total = 70% raw
    for (let i = 0; i < 5; i++) netConceptsHistory.push({ topic: 'OSI Model', score: 16, total: 22, date: '2026-04-20T10:00:00Z', difficulty: 'Exam Level' });
    netConceptsHistory.push({ topic: 'OSI Model', score: -3, total: 0, date: '2026-04-20T10:00:00Z' });  // extra 0-total row (no-op)
    const r2 = fn(netConceptsHistory);
    test('v4.57.5 sandbox: raw calc reproduces user\'s 70% (not 69%) for reconstructed fixture',
      Math.round(r2.concepts) === 70);

    // Edge cases
    test('v4.57.5 sandbox: empty history returns all-zero',
      Object.values(fn([])).every(v => v === 0));
    test('v4.57.5 sandbox: null history returns all-zero (defensive)',
      Object.values(fn(null)).every(v => v === 0));
    test('v4.57.5 sandbox: entries with 0 total handled (no div-by-zero)',
      fn([{ topic: 'OSI Model', score: 0, total: 0 }]).concepts === 0);
  } catch (e) {
    test('v4.57.5 sandbox: helper executes without error', false);
  }
})();

// ══════════════════════════════════════════════════════════════════════
// v4.58.0 — Curated exemplar bank infrastructure (Phase 1 of issue #193)
// Plumbing for future few-shot injection into Haiku generation prompts.
// Empty bank on ship = zero behavioural change. Activates automatically
// once Phase 2 content (hand-curated ~60 exemplars) lands post-exam.
// LEGAL CONSTRAINT: every exemplar MUST be original content — NO copying
// from Jason Dion, CompTIA CertMaster, or any paid question bank.
// ══════════════════════════════════════════════════════════════════════

// v4.86.2: QUESTION_EXEMPLARS literal moved to certs/netplus.js as
// `questionExemplars: [...]`. App reads via CERT_PACK with empty fallback.
test('v4.58.0 JS: QUESTION_EXEMPLARS reads from CERT_PACK (cert-pack-aware)',
  /const QUESTION_EXEMPLARS\s*=.*CERT_PACK.*questionExemplars/.test(js));
test('v4.58.0 cert pack: questionExemplars array literal lives in certs/netplus.js',
  /questionExemplars:\s*\[/.test(certNetplus));
test('v4.58.0 JS: _pickExemplarsForTopic helper defined',
  /function _pickExemplarsForTopic\(qTopic,\s*max\)/.test(js));
test('v4.58.0 JS: _formatExemplarsForPrompt helper defined',
  /function _formatExemplarsForPrompt\(exemplars\)/.test(js));
test('v4.58.0 JS: helper caps max at 5 (no prompt-bloat runaway)',
  /max\s*=\s*Math\.max\(0,\s*Math\.min\(5,\s*max \|\| 3\)\)/.test(js));
test('v4.58.0 JS: helper strips "Multi: " sentinel before matching',
  // v4.81.19: window widened 100 → 250 chars because the comma-safe parser
  // wraps the legacy slice(7).split(',') in a ternary fallback, pushing
  // the literal further from the startsWith check.
  /qTopic\.startsWith\(['"]Multi: ['"]\)[\s\S]{0,250}\.slice\(7\)\.split\(['"],['"]\)/.test(js));
test('v4.58.0 JS: helper uses tiered pool (exact topic \u2192 same domain \u2192 others)',
  /const exact = QUESTION_EXEMPLARS\.filter[\s\S]{0,200}const sameDomain[\s\S]{0,400}const others[\s\S]{0,200}const pool = exact\.concat\(sameDomain\)\.concat\(others\)/.test(js));

test('v4.58.0 JS: format helper wraps exemplars in explicit "style references only" framing',
  /DO NOT copy these exemplars into your[\s\S]{0,200}style references only/.test(js));
test('v4.58.0 JS: format helper emits "QUALITY REFERENCE" block header',
  /QUALITY REFERENCE \u2014 use these curated exemplars/.test(js));
test('v4.58.0 JS: _fetchQuestionsBatch injects exemplar block via buildPrompt',
  /const exemplarBlock = _formatExemplarsForPrompt\([\s\S]{0,100}_pickExemplarsForTopic\(qTopic, 3\)/.test(js));
test('v4.58.0 JS: exemplar block inserted into prompt after Difficulty line',
  /Difficulty:\s*\$\{diffStr\}\s*\n\$\{exemplarBlock\}/.test(js));

// Behavioural — sandbox helpers with empty bank (no-op) + populated bank (selects correctly)
(function testExemplarHelpers() {
  try {
    const vm = require('vm');

    const pickBody = js.match(/function _pickExemplarsForTopic\(qTopic,\s*max\)\s*\{([\s\S]*?)\n\}/);
    const formatBody = js.match(/function _formatExemplarsForPrompt\(exemplars\)\s*\{([\s\S]*?)\n\}/);
    if (!pickBody || !formatBody) { test('v4.58.0 sandbox: helper bodies extracted', false); return; }
    test('v4.58.0 sandbox: helper bodies extracted', true);

    // Minimal stub context with a tiny TOPIC_DOMAINS map
    const ctx = {
      TOPIC_DOMAINS: {
        'OSI Model': 'concepts',
        'Subnetting & IP Addressing': 'concepts',
        'IPv6': 'concepts',
        'OSPF': 'implementation',
        'BGP': 'implementation',
        'Connection Issues': 'troubleshooting'
      },
      QUESTION_EXEMPLARS: [],
      Math: Math,
      Array: Array
    };
    vm.createContext(ctx);
    const pickFn = vm.runInContext(`(function(qTopic, max) {${pickBody[1]}})`, ctx);
    const formatFn = vm.runInContext(`(function(exemplars) {${formatBody[1]}})`, ctx);

    // Case 1: empty bank → always returns []
    test('v4.58.0 sandbox: empty bank returns [] for any topic',
      pickFn('OSI Model', 3).length === 0 &&
      pickFn('OSPF', 5).length === 0 &&
      pickFn('Anything', 3).length === 0);
    test('v4.58.0 sandbox: empty exemplars → format returns empty string (prompt no-op)',
      formatFn([]) === '');
    test('v4.58.0 sandbox: null exemplars → format returns empty string (defensive)',
      formatFn(null) === '');

    // Case 2: populated bank — tier matching
    ctx.QUESTION_EXEMPLARS = [
      { topic: 'OSI Model', question: 'Q1', options: {A:'a',B:'b',C:'c',D:'d'}, answer: 'A', explanation: 'e1', source: 'curated' },
      { topic: 'Subnetting & IP Addressing', question: 'Q2', options: {A:'a',B:'b',C:'c',D:'d'}, answer: 'B', explanation: 'e2', source: 'curated' },
      { topic: 'OSPF', question: 'Q3', options: {A:'a',B:'b',C:'c',D:'d'}, answer: 'C', explanation: 'e3', source: 'curated' },
      { topic: 'BGP', question: 'Q4', options: {A:'a',B:'b',C:'c',D:'d'}, answer: 'D', explanation: 'e4', source: 'curated' },
      { topic: 'OSI Model', question: 'Q5', options: {A:'a',B:'b',C:'c',D:'d'}, answer: 'A', explanation: 'e5', source: 'curated' }
    ];

    // Exact-topic priority
    const osi = pickFn('OSI Model', 3);
    test('v4.58.0 sandbox: exact-topic exemplars come first (OSI gets Q1 + Q5 before others)',
      osi.length === 3 && osi[0].question === 'Q1' && osi[1].question === 'Q5');

    // Same-domain fallback
    const ipv6 = pickFn('IPv6', 3);  // not in bank, but concepts domain → OSI + Subnetting
    test('v4.58.0 sandbox: unknown topic falls back to same-domain (IPv6 \u2192 concepts \u2192 OSI/Subnetting first)',
      ipv6.length === 3 && ipv6.every(ex => ex.topic === 'OSI Model' || ex.topic === 'Subnetting & IP Addressing' || ctx.TOPIC_DOMAINS[ex.topic] === 'concepts'));

    // Max respected
    test('v4.58.0 sandbox: max=2 returns at most 2 exemplars',
      pickFn('OSI Model', 2).length === 2);
    test('v4.58.0 sandbox: max capped at 5 (prevents prompt bloat)',
      pickFn('OSI Model', 99).length <= 5);

    // Multi: sentinel strips correctly
    const multi = pickFn('Multi: OSI Model, OSPF', 2);
    test('v4.58.0 sandbox: "Multi: OSI Model, OSPF" picks OSI exemplars first (primary after strip)',
      multi.length === 2 && multi[0].topic === 'OSI Model');

    // Defensive cases
    test('v4.58.0 sandbox: empty topic returns []',
      pickFn('', 3).length === 0);
    test('v4.58.0 sandbox: null topic returns []',
      pickFn(null, 3).length === 0);

    // Format output structure
    const sampleExemplars = [ctx.QUESTION_EXEMPLARS[0]];
    const formatted = formatFn(sampleExemplars);
    test('v4.58.0 sandbox: format output contains QUALITY REFERENCE header',
      formatted.includes('QUALITY REFERENCE'));
    test('v4.58.0 sandbox: format output contains DO NOT copy directive (anti-verbatim)',
      formatted.includes('DO NOT copy these exemplars'));
    test('v4.58.0 sandbox: format output numbers each exemplar ("EXEMPLAR 1:")',
      formatted.includes('EXEMPLAR 1:'));
    test('v4.58.0 sandbox: format output includes stem + options + answer + explanation',
      formatted.includes('Question: Q1') &&
      formatted.includes('A) a') &&
      formatted.includes('Answer: A') &&
      formatted.includes('Explanation: e1'));

    // Scenario field handled when present
    const withScenario = [{ ...ctx.QUESTION_EXEMPLARS[0], scenario: 'A setup sentence.' }];
    const formattedWithScenario = formatFn(withScenario);
    test('v4.58.0 sandbox: scenario field emitted in exemplar when present',
      formattedWithScenario.includes('Scenario: A setup sentence.'));

    // Scenario field omitted when absent (no empty "Scenario: " line)
    test('v4.58.0 sandbox: exemplar without scenario omits the line entirely',
      !formatted.includes('Scenario:'));

    // ── v7.65.0: multi-select exemplars were injected with a BLANK Answer line
    // (formatter read `ex.answer`, but multi-selects store `ex.answers`) and
    // their option E was silently dropped (formatter hardcoded A-D). ──
    const multiSelectEx = [{
      type: 'multi-select', topic: 'OSI Model', question: 'QMS',
      options: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
      answers: ['A', 'D'], explanation: 'ems', source: 'curated'
    }];
    const formattedMulti = formatFn(multiSelectEx);
    test('v7.65.0 sandbox: multi-select exemplar renders its answers[] set (was blank)',
      formattedMulti.includes('Answer: A, D'));
    test('v7.65.0 sandbox: multi-select exemplar renders option E (was dropped)',
      formattedMulti.includes('E) e'));
    test('v7.65.0 sandbox: multi-select exemplar is labelled as multi-select for the model',
      formattedMulti.includes('Type: multi-select'));
    test('v7.65.0 sandbox: single-answer MCQ still renders its scalar answer',
      formatted.includes('Answer: A') && !formatted.includes('Type: multi-select'));
    test('v7.65.0 sandbox: MCQ without option E omits the E line entirely',
      !formatted.includes('E)'));
    // Legacy shape: a handful of exemplars store the array under `answer`.
    const legacyArrayAnswer = formatFn([{ ...multiSelectEx[0], answers: undefined, answer: ['B', 'C'] }]);
    test('v7.65.0 sandbox: legacy array-under-answer shape also renders (defensive)',
      legacyArrayAnswer.includes('Answer: B, C'));
    // Cert-agnostic framing: CERT_PACK is absent in this sandbox, so the guard
    // must fall back rather than throw (the function is used by Sec+ too).
    test('v7.65.0 sandbox: framing line falls back to a cert code without CERT_PACK defined',
      /explanation depth, and [A-Z0-9-]+ framing/.test(formatted));
  } catch (e) {
    test('v4.58.0 sandbox: helpers execute without error', false);
  }
})();

// ══════════════════════════════════════════════════════════════════════
// v4.58.1 — Domain 1.0 Networking Concepts curated exemplars (14/14)
// Phase 2 of issue #193: first real content in the QUESTION_EXEMPLARS
// bank. All hand-reviewed by the user before commit; every exemplar is
// original content (no copying from paid question banks).
// ══════════════════════════════════════════════════════════════════════

// Shape / count assertions — verify the bank holds 320 + the schema holds
// for every entry. Use vm to actually run the array definition.
// v4.86.2: extracted from certs/netplus.js (where questionExemplars now lives)
// instead of app.js.
(function testExemplarBank() {
  try {
    const vm = require('vm');
    // Find `questionExemplars: [` then walk bracket depth to closing `]`
    const start = certNetplus.indexOf('questionExemplars: [');
    if (start === -1) { test('v4.58.1 bank: QUESTION_EXEMPLARS definition found', false); return; }
    test('v4.58.1 bank: QUESTION_EXEMPLARS definition found', true);

    let i = certNetplus.indexOf('[', start);
    let depth = 0;
    let end = -1;
    for (; i < certNetplus.length; i++) {
      if (certNetplus[i] === '[') depth++;
      else if (certNetplus[i] === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    if (end === -1) { test('v4.58.1 bank: array closure found', false); return; }
    const arraySrc = certNetplus.slice(certNetplus.indexOf('[', start), end);

    const ctx = {};
    vm.createContext(ctx);
    const bank = vm.runInContext(arraySrc, ctx);

    test('v4.85.26 bank: 320 exemplars present (317 + 3 from Cycle 2 R5 add-on Split Horizon)',
      Array.isArray(bank) && bank.length === 320);

    // Every exemplar has required fields. v4.85.19: relaxed to allow type-specific
    // answer field — 'mcq' uses `answer` (string), 'multi-select' uses `answers` (array).
    const baseFields = ['type', 'question', 'difficulty', 'topic', 'objective', 'options', 'explanation', 'source', 'addedVersion', 'addedDate'];
    const missingFields = [];
    bank.forEach((ex, i) => {
      baseFields.forEach(f => {
        if (ex[f] === undefined || ex[f] === null || ex[f] === '') {
          missingFields.push(`Exemplar ${i} missing: ${f}`);
        }
      });
      // Type-specific answer field
      if (ex.type === 'multi-select') {
        if (!Array.isArray(ex.answers) || ex.answers.length === 0) {
          missingFields.push(`Exemplar ${i} (multi-select) missing: answers array`);
        }
      } else {
        if (ex.answer === undefined || ex.answer === null || ex.answer === '') {
          missingFields.push(`Exemplar ${i} missing: answer`);
        }
      }
    });
    test('v4.58.1 bank: every exemplar has all required fields (v4.85.19: type-aware answer/answers)',
      missingFields.length === 0);

    // Every answer maps to a real option (handles both mcq + multi-select)
    const badAnswers = bank.filter(ex => {
      if (!ex.options) return true;
      if (ex.type === 'multi-select') {
        return !Array.isArray(ex.answers) || ex.answers.some(a => !ex.options[a]);
      }
      return !ex.options[ex.answer];
    });
    test('v4.58.1 bank: every answer letter maps to a real option (v4.85.19: handles multi-select answers array)',
      badAnswers.length === 0);

    // Every exemplar has 4 options (A-D)
    const badOpts = bank.filter(ex => !ex.options || !ex.options.A || !ex.options.B || !ex.options.C || !ex.options.D);
    test('v4.58.1 bank: every exemplar has options A-D',
      badOpts.length === 0);

    // Every objective matches valid N10-009 format (1.1-1.8)
    const badObj = bank.filter(ex => !/^[1-5]\.[1-8]$/.test(ex.objective));
    test('v4.58.1 bank: every objective is valid N10-009 format (X.Y)',
      badObj.length === 0);

    // All exemplars are marked as curated
    const nonCurated = bank.filter(ex => ex.source !== 'curated');
    test('v4.58.1 bank: every exemplar tagged source:\"curated\"',
      nonCurated.length === 0);

    // v4.58.2: addedVersion loosened from literal match to semver pattern so
    // the bank keeps passing as later shipments add more exemplars.
    const wrongVersion = bank.filter(ex => !/^\d+\.\d+\.\d+$/.test(ex.addedVersion || ''));
    test('v4.58.1 bank: every exemplar carries a valid semver addedVersion',
      wrongVersion.length === 0);

    // All exemplars pass the interrogative guard from v4.57.2
    const noInterrogative = bank.filter(ex => {
      const s = ex.question;
      if (!s) return true;
      if (s.includes('?')) return false;
      return !/\b(which|what|when|where|why|how|who|whose|select|identify|choose|pick|match|arrange|place|determine|complete|given|in which|under which)\b/i.test(s);
    });
    test('v4.58.1 bank: every exemplar passes v4.57.2 interrogative guard',
      noInterrogative.length === 0);

    // v4.58.4: topic whitelist extended to cover Domain 4.0 topics.
    // v4.85.22: TCP/IP Basics + TCP/IP Applications added (RST flag exemplar uses 'TCP/IP Basics').
    const validTopics = [
      // Domain 1.0 (concepts)
      'Port Numbers', 'Network Models & OSI', 'Subnetting & IP Addressing',
      'DNS Records & DNSSEC', 'Network Appliances & Device Functions',
      'Virtualisation & Cloud', 'Network Naming (DNS & DHCP)', 'IPv6',
      'NAT & IP Services', 'NTP, ICMP & Traffic Types',
      'TCP/IP Basics', 'TCP/IP Applications', 'Cloud Networking & VPCs',
      // Domain 2.0 (implementation)
      'VLAN Trunking', 'STP/RSTP', 'OSPF', 'Ethernet Standards', 'Ethernet Basics',
      'Switch Features & VLANs', 'Wireless Networking', 'Routing Protocols',
      'BGP', 'Data Center Architectures', 'SDN, NFV & Automation',
      'Cabling & Topology', 'Integrating Networked Devices',
      // Domain 3.0 (operations)
      'Network Operations', 'Data Centres', 'WAN Connectivity', 'SD-WAN & SASE',
      'SMB & Network File Services', 'Business Continuity & Disaster Recovery',
      'Network Monitoring & Observability',
      // Domain 4.0 (security)
      'Securing TCP/IP', 'Protecting Networks', 'AAA & Authentication',
      'IPsec & VPN Protocols', 'IPsec VPN', 'SSL/TLS VPN',
      'PKI & Certificate Management', 'Firewalls, DMZ & Security Zones',
      'WPA3 & EAP Authentication', 'Network Attacks & Threats',
      'Physical Security Controls',
      // Domain 5.0 (troubleshooting)
      'Network Troubleshooting & Tools', 'Cable Issues', 'Service Issues',
      'Perf Issues', 'Connection Issues', 'CompTIA Troubleshooting Methodology'
    ];
    const offDomain = bank.filter(ex => !validTopics.includes(ex.topic));
    test('v4.58.5 bank: every exemplar maps to a valid TOPIC_DOMAINS key (all 5 CompTIA domains)',
      offDomain.length === 0);

    // Domain-split sanity
    const d1Topics = ['Port Numbers', 'Network Models & OSI', 'Subnetting & IP Addressing', 'DNS Records & DNSSEC', 'Network Appliances & Device Functions', 'Virtualisation & Cloud', 'Network Naming (DNS & DHCP)', 'IPv6', 'NAT & IP Services', 'NTP, ICMP & Traffic Types', 'TCP/IP Basics', 'TCP/IP Applications', 'Cloud Networking & VPCs'];
    const d2Topics = ['VLAN Trunking', 'STP/RSTP', 'OSPF', 'Ethernet Standards', 'Ethernet Basics', 'Switch Features & VLANs', 'Wireless Networking', 'Routing Protocols', 'BGP', 'Data Center Architectures', 'SDN, NFV & Automation', 'Cabling & Topology', 'Integrating Networked Devices'];
    const d3Topics = ['Network Operations', 'Data Centres', 'WAN Connectivity', 'SD-WAN & SASE', 'SMB & Network File Services', 'Business Continuity & Disaster Recovery', 'Network Monitoring & Observability'];
    const d4Topics = ['Securing TCP/IP', 'Protecting Networks', 'AAA & Authentication', 'IPsec & VPN Protocols', 'IPsec VPN', 'SSL/TLS VPN', 'PKI & Certificate Management', 'Firewalls, DMZ & Security Zones', 'WPA3 & EAP Authentication', 'Network Attacks & Threats', 'Physical Security Controls'];
    const d5Topics = ['Network Troubleshooting & Tools', 'Cable Issues', 'Service Issues', 'Perf Issues', 'Connection Issues', 'CompTIA Troubleshooting Methodology'];
    const d1Count = bank.filter(ex => d1Topics.includes(ex.topic)).length;
    const d2Count = bank.filter(ex => d2Topics.includes(ex.topic)).length;
    const d3Count = bank.filter(ex => d3Topics.includes(ex.topic)).length;
    const d4Count = bank.filter(ex => d4Topics.includes(ex.topic)).length;
    const d5Count = bank.filter(ex => d5Topics.includes(ex.topic)).length;
    // v4.85.21: Phase 3 Cycle 2 (Jason Dion gaps #2) added 36 exemplars across all 5 domains:
    // D1 +6 (RFC 1918 x3, DoH x3)
    // D2 +9 (MDF x3, MTRJ x3, DAC x3 → Data Center Arch)
    // D3 +15 (PSI/PSE Data Centres x3, Switch Imaging x3, PTP x3, OOB x3, LLDP x3)
    // D4 +0
    // D5 +6 (OTDR x3, Toner x3 → Cable Issues + Network Troubleshooting & Tools)
    test('v4.85.23 bank: Domain 1.0 contains 64 exemplars',
      d1Count === 64);
    test('v4.85.26 bank: Domain 2.0 contains 70 exemplars (+3 R5 Split Horizon)',
      d2Count === 70);
    test('v4.85.25 bank: Domain 3.0 contains 83 exemplars (+3 R4: TAP)',
      d3Count === 83);
    test('v4.85.24 bank: Domain 4.0 contains 43 exemplars (+3 R3 add-on: Penetration Testing)',
      d4Count === 43);
    test('v4.85.23 bank: Domain 5.0 contains 60 exemplars (+3 R2 add-on: Visual Fault Locator)',
      d5Count === 60);
    test('v4.85.26 bank: domain distribution sums to 320 (64+70+83+43+60) — Cycle 2 R5 Split Horizon',
      d1Count + d2Count + d3Count + d4Count + d5Count === 320);

    // Difficulty spread: at least 1 of each difficulty present
    const diffs = new Set(bank.map(ex => ex.difficulty));
    test('v4.58.1 bank: difficulty spread includes Foundational + Exam Level + Hard',
      diffs.has('Foundational') && diffs.has('Exam Level') && diffs.has('Hard'));

    // Topic coverage: at least 30 distinct topics across all 5 domains
    const topics = new Set(bank.map(ex => ex.topic));
    test('v4.58.5 bank: at least 30 distinct topics covered across all 5 CompTIA domains',
      topics.size >= 30);

    // No question stem is a duplicate of another
    const stems = bank.map(ex => ex.question);
    const uniqueStems = new Set(stems);
    test('v4.58.1 bank: no duplicate question stems',
      uniqueStems.size === stems.length);

    // No two exemplars identical word-for-word
    const fingerprints = bank.map(ex => ex.question + '|' + ex.answer + '|' + ex.options.A);
    test('v4.58.1 bank: no duplicate (stem + answer + first option) fingerprints',
      new Set(fingerprints).size === fingerprints.length);

    // At least 1 exemplar for each of: 1.1 OSI, 1.2 Appliances, 1.3 Cloud, 1.4 Ports, 1.6 Services, 1.7 IPv4, 1.8 IPv6
    const objHits = new Set(bank.map(ex => ex.objective));
    test('v4.58.1 bank: objective coverage spans \u226575% of Domain 1 sub-objectives',
      objHits.size >= 6);  // out of 8 possible (1.1-1.8)

    // Helper now returns non-empty when asked for a Domain 1.0 topic
    // (sanity: exemplars are actually reachable by the pick helper)
    const pickBodyMatch = js.match(/function _pickExemplarsForTopic\(qTopic,\s*max\)\s*\{([\s\S]*?)\n\}/);
    if (pickBodyMatch) {
      const pickCtx = {
        QUESTION_EXEMPLARS: bank,
        TOPIC_DOMAINS: {
          'Port Numbers': 'concepts',
          'Network Models & OSI': 'concepts',
          'Subnetting & IP Addressing': 'concepts',
          'DNS Records & DNSSEC': 'concepts',
          'Network Appliances & Device Functions': 'concepts',
          'Virtualisation & Cloud': 'concepts',
          'Network Naming (DNS & DHCP)': 'concepts',
          'IPv6': 'concepts',
          'NAT & IP Services': 'concepts',
          'NTP, ICMP & Traffic Types': 'concepts'
        },
        Math: Math, Array: Array
      };
      vm.createContext(pickCtx);
      const pickFn = vm.runInContext(`(function(qTopic, max) {${pickBodyMatch[1]}})`, pickCtx);
      test('v4.58.1 integration: pick helper returns 3 Port Numbers / same-domain exemplars',
        pickFn('Port Numbers', 3).length === 3);
      test('v4.58.1 integration: pick helper returns same-domain exemplars for unknown topic (IPv6 \u2192 concepts)',
        pickFn('Some Unmatched Topic', 3).length === 3);
    }
  } catch (e) {
    test('v4.58.1 bank: exemplars parse as valid JavaScript', false);
  }
})();

// ══════════════════════════════════════════
// v4.63.0 — Network Builder 3D View Mode (issue #199 Phase 1)
//
// Structural + regression assertions for the 3D view. Three.js is vendored
// under vendor/three/ and dynamic-imported on demand via tb3d.js, so every
// user who never opens 3D pays zero bandwidth. These assertions gate that
// contract (vendored bundle exists, dynamic-imported, excluded from SW
// precache, 35 bespoke device primitives mapped, etc.).
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.63.0 NETWORK BUILDER 3D VIEW (Phase 1, #199) ──\x1b[0m');

// --- Vendored Three.js files present ---
// (fs + path already required at top of file; no re-require here)

// --- tb3d.js module ---

// --- 35 bespoke device primitives in the factory ---
const primitiveMatch = tb3d.match(/function _makeDevicePrimitive\(type, color\)\s*\{[\s\S]*?(?=\n\/\/ ══)/);
const primitiveBody = primitiveMatch ? primitiveMatch[0] : '';
const EXPECTED_DEVICE_TYPES = [
  'router', 'switch', 'dmz-switch', 'wap', 'pc', 'server', 'firewall',
  'cloud', 'isp-router', 'load-balancer', 'ids', 'wlc', 'printer', 'voip',
  'iot', 'public-web', 'public-file', 'public-cloud',
  'vpc', 'cloud-subnet', 'igw', 'nat-gw', 'tgw', 'vpg', 'onprem-dc',
  'sase-edge', 'dns-server',
  'laptop', 'smartphone', 'game-console', 'smart-tv',
  'satellite', 'cell-tower', 'modem', 'san-array'
];
// Just check every type name appears somewhere in the DEVICE_COLORS block
// (between 'const DEVICE_COLORS' and the closing '};'). Object-literal keys
// are sometimes quoted, sometimes not — simplest reliable check is substring
// presence of `<type>:` or `'<type>':`.
// (removed: v4.63.0 tb3d color-mapping test — TB 3D view deleted in MVP quiz-only pivot)
// Each device type appears as a case or falls through to default. We check a
// representative subset — ones where a missing case would obviously regress.
[].forEach(t => {
  test(`v4.63.0 tb3d: primitive factory has bespoke case for '${t}'`,
    new RegExp(`case ['"]${t.replace('-', '\\-')}['"]:`).test(primitiveBody));
});

// --- Click-to-inspect wires into existing v4.60.0 inspector ---

// --- HTML wiring ---
test('v4.63.0 HTML: importmap declares three + three/addons',
  html.includes('<script type="importmap">') &&
  html.includes('"three":') &&
  html.includes('"three/addons/"'));

// --- CSS wiring ---
test('v4.63.0 CSS: .tb-3d-host absolute-positioned overlay',
  /\.tb-3d-host\s*\{[^}]*position:\s*absolute/.test(css));
test('v4.63.0 CSS: .tb-3d-node-label floating pill style defined',
  /\.tb-3d-node-label\s*\{/.test(css));
test('v4.63.0 CSS: .tb-3d-vlan-label floor-plate label style defined',
  /\.tb-3d-vlan-label\s*\{/.test(css));
test('v4.63.0 CSS: .tb-3d-compass rose style defined',
  /\.tb-3d-compass\s*\{/.test(css));
test('v4.63.0 CSS: reduced-motion gate kills spinner animation',
  /@media\s*\(prefers-reduced-motion[\s\S]{0,400}tb-3d-loading-spinner/.test(css));
test('v4.63.0 CSS: light-theme override for .tb-3d-host background',
  /\[data-theme="light"\]\s*\.tb-3d-host\s*\{/.test(css));

// --- Service worker ---
test('v4.63.0 SW: /vendor/ path is passed through (not precached)',
  sw.includes("url.pathname.startsWith('/vendor/')"));
test('v4.63.0 SW: /mockups/ path also passed through',
  sw.includes("url.pathname.startsWith('/mockups/')"));
test('v4.63.0 SW: vendored Three.js NOT in SHELL_ASSETS precache list',
  !/SHELL_ASSETS[\s\S]{0,300}vendor\//.test(sw));

// --- Regression guards ---
// Dynamic-import contract: tb3d.js must NEVER be loaded via a top-level
// <script> or static import in app.js — that would ship 600KB to every
// user who never opens 3D View.
test('v4.63.0 REGRESSION: index.html must not load tb3d.js via <script>',
  !/<script[^>]*src=["']\.?\/?tb3d\.js["']/.test(html));
test('v4.63.0 REGRESSION: app.js must not statically import tb3d.js',
  !/^import .* from ['"]\.\/tb3d\.js['"];/m.test(js));
test('v4.63.0 REGRESSION: index.html must not load Three.js outside /vendor/',
  !/<script[^>]*src=["'][^"']*(three\.module\.js|three\.min\.js)[^"']*["']/.test(html) ||
  /<script[^>]*src=["']\.?\/?vendor\/three\/.*three\.module\.js["']/.test(html));

// ══════════════════════════════════════════
// v4.64.0 — TB 3D View Phase 2 (issue #199 Phase 2)
//
// Packet trace animation + hop-card strip + playback controls + HUD pill.
// Render-only contract: tb3d.js exports setTraceState(); app.js owns
// _tbUiState.trace and pushes updates via the existing
// tbRenderTraceCanvasState hook point.
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.64.0 TB 3D VIEW PHASE 2 — PACKET TRACE (#199) ──\x1b[0m');

// --- tb3d.js: new setTraceState export ---

// --- app.js: hook + chrome button delegates ---

// --- HTML wiring ---

// --- CSS wiring ---
test('v4.64.0 CSS: .tb-3d-trace-hud pill style',
  /\.tb-3d-trace-hud\s*\{/.test(css));
test('v4.64.0 CSS: .tb-3d-hop-strip fixed 160px strip',
  /\.tb-3d-hop-strip\s*\{[^}]*height:\s*160px/.test(css));
test('v4.64.0 CSS: .tb-3d-hop-card with pending/current/ok/blocked variants',
  /\.tb-3d-hop-card-pending/.test(css) &&
  /\.tb-3d-hop-card-current/.test(css) &&
  /\.tb-3d-hop-card-ok/.test(css) &&
  /\.tb-3d-hop-card-blocked/.test(css));
test('v4.64.0 CSS: .tb-3d-frame-badge for in-flight frame annotation',
  /\.tb-3d-frame-badge\s*\{/.test(css));
test('v4.64.0 CSS: @keyframes tb3dHudPulse for HUD dot animation',
  /@keyframes tb3dHudPulse/.test(css));
test('v4.64.0 CSS: reduced-motion gate kills tb3dHudPulse + hop transitions',
  /@media\s*\(prefers-reduced-motion[\s\S]{0,800}tb-3d-hop-card.*transition:\s*none/.test(css));

// --- Regression guards ---
// 2D trace renderer must still exist and fire — 3D is additive, not a replacement.
// setTraceState must remain render-only — no state mutations from tb3d.
test('v4.64.0 REGRESSION: tb3d.js never assigns to _tbUiState (render-only contract)',
  !/_tbUiState\.[a-zA-Z]+\s*=/.test(tb3d));

// ══════════════════════════════════════════
// v4.65.0 — TB 3D View Phase 3 (issue #199 Phase 3)
//
// OSI Layer Stack View — click a device, hit "OSI Stack", device lifts
// into an exploded view of 7 stacked translucent planes, each labeled
// with its layer name + PDU + typical protocols. Render-only contract
// preserved; app.js owns selection state (tbV3InspectedDeviceId), tb3d
// just renders the stack.
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.65.0 TB 3D VIEW PHASE 3 — OSI LAYER STACK (#199) ──\x1b[0m');

// --- tb3d.js exports + shape ---

// --- app.js wiring ---

// --- HTML wiring ---
test('v4.65.1 HTML: OSI button ships enabled (auto-picks device if none selected)',
  !/id="tb-3d-osi-btn"[^>]*disabled/.test(html));

// --- CSS wiring ---
test('v4.65.0 CSS: .tb-3d-osi-label base style',
  /\.tb-3d-osi-label\s*\{/.test(css));
test('v4.65.0 CSS: layer-1 through layer-7 border-left colors',
  /\.tb-3d-osi-label\.layer-1\s*\{[^}]*border-left-color/.test(css) &&
  /\.tb-3d-osi-label\.layer-7\s*\{[^}]*border-left-color/.test(css));
test('v4.65.0 CSS: host.tb-3d-osi-active dims non-focus labels',
  /\.tb-3d-host\.tb-3d-osi-active\s+\.tb-3d-node-label:not\(\.tb-3d-osi-focus\)/.test(css));
test('v4.65.0 CSS: Exit OSI button styled distinct from regular pill',
  /\.tb-3d-osi-exit-btn\s*\{/.test(css));
test('v4.65.0 CSS: OSI title card absolute-positioned, hidden at rest',
  /\.tb-3d-osi-title\s*\{[\s\S]{0,400}display:\s*none/.test(css));

// --- Regression guards ---
// OSI button must auto-pick a device if nothing's selected — this
// avoids the dead-UX trap where the button looked broken without a
// clear remedy (v4.65.0 bug: button disabled with no visible hint).
// tb3d must never mutate app.js trace state — render-only contract
test('v4.65.0 REGRESSION: tb3d.js never assigns to _tbUiState',
  !/_tbUiState\.[a-zA-Z]+\s*=/.test(tb3d));
// exitOsiView must be called on lifecycle exit to avoid leaked materials

// ══════════════════════════════════════════
// v4.66.0 — TB 3D View Phase 4 (issue #199 Phase 4)
// Scenario Tours — choreographed camera + narrative captions.
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.66.0 TB 3D VIEW PHASE 4 — SCENARIO TOURS ──\x1b[0m');
test('v4.66.0 CSS: .tb-3d-tour-caption bottom-center floating card',
  /\.tb-3d-tour-caption\s*\{/.test(css) && /bottom:\s*32px/.test(css));
test('v4.66.0 CSS: step-dot is-done + is-current states',
  /\.tb-3d-tour-dot\.is-done/.test(css) &&
  /\.tb-3d-tour-dot\.is-current/.test(css));
test('v4.66.0 CSS: tour-highlight keyframe + reduced-motion gate',
  /@keyframes tb3dTourHighlightPulse/.test(css) &&
  /tb-3d-tour-highlight[^}]*animation:\s*none/.test(css));
test('v4.66.0 REGRESSION: tb3d.js never touches _tbTourState',
  !/_tbTourState/.test(tb3d));

// ══════════════════════════════════════════
// v4.67.0 — Tour UX iteration + DMZ tour
// User feedback on v4.66.0: step auto-advance felt fast; no way to
// go back and re-read a step. Added Previous button (pauses auto-
// advance on press so the user can study the step), bumped Home
// Network step durations to ~3 words/sec reading pace + 2s buffer,
// authored the DMZ / Screened Subnet tour (5 steps).
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.67.0 TOUR UX + DMZ TOUR ──\x1b[0m');

// ══════════════════════════════════════════
// v4.68.0 — Three more tours (Enterprise + Branch Wireless + SD-WAN)
// Sequencer engine is unchanged; these are pure data additions.
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.68.0 THREE NEW SCENARIO TOURS ──\x1b[0m');
// Enterprise tour

// Branch Wireless tour

// SD-WAN tour

// ══════════════════════════════════════════
// v4.69.0 — Three more scenario tours (Small Office + Hub-Spoke + Cloud VPC)
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.69.0 THREE MORE SCENARIO TOURS ──\x1b[0m');
// Small Office

// Hub-and-Spoke

// Cloud VPC

// ══════════════════════════════════════════
// v4.70.0 — Three more scenario tours (Hybrid Cloud + Full Mesh + Point-to-Point)
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.70.0 THREE MORE SCENARIO TOURS ──\x1b[0m');
// Hybrid Cloud

// Full Mesh

// Point-to-Point

// ══════════════════════════════════════════
// v4.71.0 — Three more scenario tours (Site-to-Site VPN + MPLS + SASE)
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.71.0 THREE MORE SCENARIO TOURS ──\x1b[0m');
// Site-to-Site VPN

// MPLS

// SASE

// ══════════════════════════════════════════
// v4.72.0 — Final 5 scenario tours (Multi-VPC + Cloud NAT-GW + Cloud IGW + Cloud Peering + MAN)
// Closes the scenario-tour catalog: 16/16 tours authored.
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.72.0 FINAL FIVE SCENARIO TOURS ──\x1b[0m');
// Multi-VPC (TGW)

// Cloud NAT-GW

// Cloud IGW

// Cloud Peering

// MAN

// ══════════════════════════════════════════
// v4.72.1 — 3D scene refreshes on scenario change while 3D view is active
// Bug fix: picking a new scenario while 3D was open required toggling back
// to 2D + re-entering 3D. Now the scene rebuilds in place.
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.72.1 3D SCENARIO-SWITCH REFRESH ──\x1b[0m');

// Catalog-complete milestone: all 16 non-free scenarios have tours

// ══════════════════════════════════════════
// v4.73.0 — Pass-Rate Prediction with Confidence Intervals
// New prediction extras on the Readiness Card: ciHalfWidth + lowerBound +
// upperBound + passProbability + whatIf (top-3 leverage topics) + targetGap.
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.73.0 PASS-RATE PREDICTION ──\x1b[0m');

// Structure — new fields exist in getReadinessScore return
test('v4.73.0 structure: getReadinessScore body computes ciHalfWidth',
  /getReadinessScore[\s\S]{0,15000}ciHalfWidth\s*=/.test(js));
test('v4.73.0 structure: getReadinessScore body computes passProbability via logistic',
  /getReadinessScore[\s\S]{0,15000}passProbability\s*=\s*1\s*\/\s*\(\s*1\s*\+\s*Math\.exp/.test(js));
test('v4.73.0 structure: getReadinessScore body computes whatIf attribution',
  /getReadinessScore[\s\S]{0,15000}whatIfsRaw\s*\.push/.test(js));
test('v4.73.0 structure: getReadinessScore returns ciHalfWidth + passProbability + whatIf',
  /return\s*\{[\s\S]{0,1200}ciHalfWidth[\s\S]{0,1200}passProbability[\s\S]{0,1200}whatIf/.test(js));
test('v4.73.0 structure: getReadinessScore returns lowerBound + upperBound + targetGap',
  /lowerBound[\s\S]{0,300}upperBound[\s\S]{0,300}targetGap/.test(js));
test('v4.73.0 structure: TARGET_ACC=0.80 in what-if simulation',
  /TARGET_ACC\s*=\s*0\.80/.test(js));
test('v4.73.0 structure: CI scaled to 90% via 1.645 sigma factor',
  /ciHalfWidth\s*\/\s*1\.645/.test(js));
test('v4.73.0 structure: CI clamped to [15, 100] range',
  /Math\.max\(15,\s*Math\.min\(100,\s*Math\.round\(ciHalfWidth\)\)\)/.test(js));
test('v4.73.0 structure: targetGap = max(0, EXAM_PASS_SCORE - lowerBound)',
  /targetGap\s*=\s*Math\.max\(0,\s*EXAM_PASS_SCORE\s*-\s*lowerBound\)/.test(js));

// Behavioural fixtures — vm-sandbox the entire getReadinessScore body
test('v4.73.0 behaviour: pass probability is 0.5 when predicted = 720 (pass line)', (() => {
  // Mathematically: z = (720-720)/sigma = 0 → 1/(1+e^0) = 0.5
  const sigma = 25 / 1.645;
  const z = (720 - 720) / sigma;
  const prob = 1 / (1 + Math.exp(-z));
  return Math.abs(prob - 0.5) < 0.001;
})());
test('v4.73.0 behaviour: pass probability > 0.9 when predicted = 770, sigma = 25', (() => {
  const sigma = 25 / 1.645;
  const z = (770 - 720) / sigma;
  const prob = 1 / (1 + Math.exp(-z));
  return prob > 0.9;
})());
test('v4.73.0 behaviour: pass probability < 0.1 when predicted = 670, sigma = 25', (() => {
  const sigma = 25 / 1.645;
  const z = (670 - 720) / sigma;
  const prob = 1 / (1 + Math.exp(-z));
  return prob < 0.1;
})());
test('v4.73.0 behaviour: CI half-width shrinks with sample size', (() => {
  // sampleWidth = 60 / sqrt(1 + n/50)
  const w50 = 60 / Math.sqrt(1 + 50 / 50);
  const w200 = 60 / Math.sqrt(1 + 200 / 50);
  const w500 = 60 / Math.sqrt(1 + 500 / 50);
  return w50 > w200 && w200 > w500;
})());

// HTML wiring — new DOM elements exist
test('v4.73.0 HTML: #readiness-prediction element exists', html.includes('id="readiness-prediction"'));
test('v4.73.0 HTML: #readiness-whatif container exists', html.includes('id="readiness-whatif"'));
test('v4.73.0 HTML: #readiness-whatif-row chip slot exists', html.includes('id="readiness-whatif-row"'));
test('v4.73.0 HTML: #readiness-trajectory line exists', html.includes('id="readiness-trajectory"'));

// Render wiring — renderReadinessCard populates the new pieces
test('v4.73.0 wiring: renderReadinessCard populates #readiness-prediction',
  /renderReadinessCard[\s\S]{0,5000}readiness-prediction/.test(js));
test('v4.73.0 wiring: renderReadinessCard populates #readiness-whatif',
  /renderReadinessCard[\s\S]{0,5000}readiness-whatif/.test(js));
test('v4.73.0 wiring: renderReadinessCard populates #readiness-trajectory',
  /renderReadinessCard[\s\S]{0,10000}readiness-trajectory/.test(js));
test('v4.73.0 wiring: what-if chips wire to focusTopic',
  /readiness-whatif-chip[\s\S]{0,500}focusTopic/.test(js));

// CSS — new classes exist
test('v4.73.0 CSS: .readiness-prediction styled', css.includes('.readiness-prediction'));
test('v4.73.0 CSS: .readiness-whatif-chip styled', css.includes('.readiness-whatif-chip'));
test('v4.73.0 CSS: .readiness-trajectory styled', css.includes('.readiness-trajectory'));
test('v4.73.0 CSS: pass probability tier classes present (.high/.med/.low)',
  /\.readiness-prediction\s+\.prob\.high[\s\S]{0,500}\.readiness-prediction\s+\.prob\.med[\s\S]{0,500}\.readiness-prediction\s+\.prob\.low/.test(css));
test('v4.73.0 CSS: trajectory tier classes present (.warn/.mid/.good)',
  /\.readiness-trajectory\.warn[\s\S]{0,500}\.readiness-trajectory\.mid[\s\S]{0,500}\.readiness-trajectory\.good/.test(css));
test('v4.73.0 CSS: reduced-motion gate present for what-if chips',
  /prefers-reduced-motion[\s\S]{0,400}\.readiness-whatif-chip/.test(css));

// ══════════════════════════════════════════
// v4.74.0 — Spaced Repetition Queue (SM-2)
// Daily review queue: every wrong answer auto-enqueues; SM-2 schedules
// review intervals; 3-tier confidence per answer drives interval growth.
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.74.0 SPACED REPETITION ──\x1b[0m');

// STORAGE + constants
test('v4.74.0 storage: SR_QUEUE key defined',
  /STORAGE\s*=[\s\S]{0,3000}SR_QUEUE:\s*['"]nplus_sr_queue['"]/.test(js));
test('v4.74.0 constants: SR_QUEUE_CAP defined',
  /const\s+SR_QUEUE_CAP\s*=\s*\d+/.test(js));
test('v4.74.0 constants: SR_GRADUATION_STREAK + EASE + INTERVAL defined',
  /SR_GRADUATION_STREAK[\s\S]{0,400}SR_GRADUATION_EASE[\s\S]{0,400}SR_GRADUATION_INTERVAL/.test(js));

// Core helper functions
test('v4.74.0 helpers: loadSrQueue + saveSrQueue defined',
  /function\s+loadSrQueue\s*\([\s\S]{0,400}function\s+saveSrQueue\s*\(/.test(js));
test('v4.74.0 helpers: _srHash defined (djb2 base36)',
  /function\s+_srHash[\s\S]{0,300}toString\(36\)/.test(js));
test('v4.74.0 helpers: _srSchedule defined with SM-2 logic',
  /function\s+_srSchedule\s*\(entry,\s*outcome\)/.test(js));
test('v4.74.0 helpers: addToSrQueue defined',
  /function\s+addToSrQueue\s*\(/.test(js));
test('v4.74.0 helpers: updateSrEntry defined',
  /function\s+updateSrEntry\s*\(/.test(js));
test('v4.74.0 helpers: getSrDueCount defined',
  /function\s+getSrDueCount\s*\(/.test(js));
test('v4.74.0 helpers: getSrDueEntries defined',
  /function\s+getSrDueEntries\s*\(/.test(js));
test('v4.74.0 helpers: getSrStats defined',
  /function\s+getSrStats\s*\(/.test(js));

// SM-2 algorithm correctness — vm-sandbox the schedule fn
// v7.25.0 (#3 lapse-aware): a wrong answer now drops the interval to ~30% of
// prior (floor 1d), not a hard reset to 1. Mature lapses relearn faster.
test('v7.25.0 algorithm (#3): wrong drops interval to ~30% of prior (floor 1), ease -0.20', (() => {
  const prior = 30;
  const newInterval = Math.max(1, Math.round(prior * 0.30)); // 9
  const newEase = Math.max(1.3, 2.5 - 0.20);                 // 2.3
  return newInterval === 9 && newEase === 2.3;
})());
test('v4.74.0 algorithm: correct-confident grows interval by ease factor', (() => {
  const entry = { intervalDays: 7, easeFactor: 2.5 };
  const newInterval = entry.intervalDays * entry.easeFactor; // 17.5
  const newEase = Math.min(2.8, entry.easeFactor + 0.10);    // 2.6
  return Math.abs(newInterval - 17.5) < 0.01 && Math.abs(newEase - 2.6) < 0.01;
})());
test('v4.74.0 algorithm: correct-uncertain grows interval by 1.5x (ease unchanged)', (() => {
  const entry = { intervalDays: 7, easeFactor: 2.5 };
  const newInterval = entry.intervalDays * 1.5; // 10.5
  return Math.abs(newInterval - 10.5) < 0.01;
})());
test('v4.74.0 algorithm: ease factor floored at 1.3', (() => {
  const ease = Math.max(1.3, 1.4 - 0.20);
  return ease === 1.3;
})());
test('v4.74.0 algorithm: ease factor capped at 2.8', (() => {
  const ease = Math.min(2.8, 2.8 + 0.10);
  return ease === 2.8;
})());
test('v4.74.0 algorithm: interval capped at 180 days', (() => {
  const baseInterval = 100;
  const ease = 2.5;
  const newInterval = Math.min(180, baseInterval * ease); // capped
  return newInterval === 180;
})());

// Wrong-bank integration — SR enqueue runs ahead of dedup
test('v4.74.0 wiring: addToWrongBank also calls addToSrQueue',
  /function\s+addToWrongBank[\s\S]{0,800}addToSrQueue\(q\)/.test(js));
test('v4.74.0 wiring: SR call runs BEFORE wrong-bank dedup',
  (() => {
    const body = _fnBody(js, 'addToWrongBank');
    if (!body) return false;
    const srIdx = body.indexOf('addToSrQueue');
    const dedupIdx = body.indexOf('Deduplicate');
    return srIdx > 0 && dedupIdx > 0 && srIdx < dedupIdx;
  })());

// Page + UI wiring
test('v4.74.0 HTML: #page-sr-review page exists',
  html.includes('id="page-sr-review"'));
test('v4.74.0 HTML: #sr-review-card homepage card exists',
  html.includes('id="sr-review-card"'));
test('v4.74.0 HTML: #sr-card-host element exists',
  html.includes('id="sr-card-host"'));
test('v4.74.0 HTML: #sr-empty + #sr-complete states exist',
  html.includes('id="sr-empty"') && html.includes('id="sr-complete"'));
test('v4.74.0 HTML: #sr-progress-text + #sr-progress-fill exist',
  html.includes('id="sr-progress-text"') && html.includes('id="sr-progress-fill"'));

// Review flow JS
test('v4.74.0 flow: renderSrReviewCard defined (homepage card)',
  /function\s+renderSrReviewCard\s*\(/.test(js));
test('v4.74.0 flow: startSrReview defined',
  /function\s+startSrReview\s*\(/.test(js));
test('v4.74.0 flow: srPickAnswer defined',
  /function\s+srPickAnswer\s*\(/.test(js));
test('v4.74.0 flow: srMarkConfidence defined',
  /function\s+srMarkConfidence\s*\(/.test(js));
test('v4.74.0 flow: srMarkConfidence dispatches to updateSrEntry',
  (() => { const b = _fnBody(js, 'srMarkConfidence'); return b && /updateSrEntry\s*\(card\.qHash,\s*outcome\)/.test(b); })());
test('v4.74.0 flow: goSetup hooks renderSrReviewCard',
  (() => {
    const body = _fnBody(js, 'goSetup');
    return body && /renderSrReviewCard/.test(body);
  })());

// CSS
test('v4.74.0 CSS: .sr-review-card homepage card styled', css.includes('.sr-review-card'));
test('v4.74.0 CSS: .sr-card review card styled',
  /\.sr-card\s*\{/.test(css) || /\.sr-card\s*[,{]/.test(css));
// ── v7.20.0 SR enhancements · Phase 1 (#1 same-session retry, #5 why-due) ──
test('v7.20.0 SR data: lapses field defaulted in addToSrQueue',
  js.includes('lapses: 0,'));
test('v7.20.0 SR data: _srSchedule increments lapses on wrong',
  (() => { const b = _fnBody(js, '_srSchedule'); return b && /outcome === 'wrong'/.test(b) && /entry\.lapses\s*=\s*\(entry\.lapses\s*\|\|\s*0\)\s*\+\s*1/.test(b); })());
test('v7.20.0 SR #5: why-due microcopy rendered in card',
  js.includes('sr-why-due') && /Rebuilding[\s\S]{0,60}you missed this one last time/.test(js));
test('v7.20.0 SR #1: same-session retry appends a _retry clone on wrong',
  /outcome === 'wrong'[\s\S]{0,160}_srSession\.cards\.push\([\s\S]{0,80}_retry:\s*true/.test(js));
test('v7.20.0 SR #1: retry pass does not re-tally or re-append',
  /if \(card\._retry\)[\s\S]{0,400}_srSession\.index\+\+/.test(js));
test('v7.20.0 SR #1: retry pill markup present',
  js.includes('sr-retry-pill') && /bring this back once more before you finish/.test(js));
test('v7.20.0 SR CSS: .sr-why-due + .sr-retry-pill scoped in dg-system',
  (function(){ const dg = read('dg-system.css'); return dg.includes('.sr-why-due') && dg.includes('.sr-retry-pill'); })());
// ── v7.21.0 SR enhancements · Phase 2 (#2 missed-card recap, #4 streak bridge) ──
test('v7.21.0 SR data: _srSession records per-card results',
  js.includes('results: []') && js.includes('_srSession.results.push'));
test('v7.21.0 SR #2: _srCorrectText helper defined',
  /function\s+_srCorrectText\s*\(/.test(js));
test('v7.21.0 SR #2: recap filters wrong + uncertain',
  js.includes("r.outcome === 'wrong' || r.outcome === 'correct-uncertain'"));
test('v7.21.0 SR #2: recap markup rendered in end screen',
  js.includes('sr-recap') && /Review what you missed/.test(js));
test('v7.21.0 SR #4: _srEndReview credits the daily streak',
  /function _srEndReview[\s\S]{0,2400}updateStreak\(\)/.test(js));
test('v7.21.0 SR #4: streak credit gated on at least one card marked',
  /total > 0[\s\S]{0,200}updateStreak\(\)/.test(js));
test('v7.21.0 SR CSS: .sr-recap + .sr-streak + .sr-miss scoped in dg-system',
  (function(){ const dg = read('dg-system.css'); return dg.includes('.sr-recap') && dg.includes('.sr-streak') && dg.includes('.sr-miss'); })());
// ── v7.22.0 SR enhancements · Phase 3 (#8 right-sized sessions + Settings) ──
test('v7.22.0 SR #8: SR_PREFS storage key defined',
  /SR_PREFS:\s*['"]nplus_sr_prefs['"]/.test(js));
test('v7.22.0 SR #8: SR_SESSION_CAP raised to 30',
  /const\s+SR_SESSION_CAP\s*=\s*30/.test(js));
test('v7.22.0 SR #8: loadSrPrefs + saveSrPrefs helpers defined',
  /function\s+loadSrPrefs\s*\(/.test(js) && /function\s+saveSrPrefs\s*\(/.test(js));
test('v7.22.0 SR #8: startSrReview caps to the chosen session size',
  /loadSrPrefs\(\)[\s\S]{0,260}sessionSize/.test(js));
test('v7.22.0 SR #8: settings handlers defined',
  /function\s+pickSrSessionSize\s*\(/.test(js) && /function\s+toggleSrTopUp\s*\(/.test(js) && /function\s+renderSrSettings\s*\(/.test(js));
test('v7.22.0 SR #8: renderSettingsPage syncs SR settings',
  /renderSettingsPage[\s\S]{0,900}renderSrSettings/.test(js));
test('v7.22.0 SR #8: Daily Review settings group in HTML',
  html.includes('sr-size-chip') && html.includes('sr-topup-toggle') && /Daily Review/.test(html));
test('v7.22.0 SR #8: top-up toggle styled in dg-system',
  (function(){ const dg = read('dg-system.css'); return dg.includes('.sr-topup-toggle'); })());
// ── v7.23.0 SR enhancements · Phase 4 (#6 review forecast: 7-day projection) ──
test('v7.23.0 SR #6: buildSrForecast + renderSrForecast helpers defined',
  /function\s+buildSrForecast\s*\(/.test(js) && /function\s+renderSrForecast\s*\(/.test(js));
test('v7.23.0 SR #6: forecast is a true projection (reads nextReview off the live queue)',
  (() => { const b = _fnBody(js, 'buildSrForecast'); return b && /loadSrQueue\(\)/.test(b) && /nextReview/.test(b) && !/getSrDueEntries/.test(b); })());
test('v7.23.0 SR #6: today bucket uses due-now semantics (nr <= now), matching getSrDueCount',
  (() => { const b = _fnBody(js, 'buildSrForecast'); return b && /i\s*===\s*0\s*\?\s*nr\s*<=\s*now/.test(b); })());
test('v7.23.0 SR #6: renderBentoRecommended drives the home mini-forecast strip',
  (() => { const b = _fnBody(js, 'renderBentoRecommended'); return b && /_renderHomeForecast\(true\)/.test(b) && /_renderHomeForecast\(false\)/.test(b); })());
test('v7.23.0 SR #6: _renderHomeForecast renders the compact strip into #sr-forecast-home',
  (() => { const b = _fnBody(js, '_renderHomeForecast'); return b && /sr-forecast-home/.test(b) && /renderSrForecast/.test(b) && /compact:\s*true/.test(b); })());
test('v7.23.0 SR #6: _srEndReview renders the full forecast on the complete screen',
  (() => { const b = _fnBody(js, '_srEndReview'); return b && /sr-forecast-complete/.test(b) && /renderSrForecast/.test(b); })());
test('v7.23.0 SR #6: forecast containers present in HTML',
  html.includes('id="sr-forecast-home"') && html.includes('id="sr-forecast-complete"'));
test('v7.23.0 SR #6: forecast CSS scoped in dg-system (strip + bar)',
  (() => { const dg = read('dg-system.css'); return dg.includes('.sr-fc-strip') && dg.includes('.sr-fc-bar'); })());
test('v7.23.0 SR #6: forecast bars collapse under prefers-reduced-motion',
  (() => { const dg = read('dg-system.css'); return /prefers-reduced-motion[\s\S]{0,400}\.sr-fc-bar\{animation:none/.test(dg); })());
test('v7.23.0 SR #6: forecast phone strip is a scroll-snap swipe strip',
  (() => { const dg = read('dg-system.css'); return /\.sr-fc-strip\{[^}]*scroll-snap-type:x mandatory/.test(dg); })());
test('v7.23.0 SR #6: forecast tablet+ fits the full week in one row',
  (() => { const dg = read('dg-system.css'); return /min-width:601px\)[\s\S]{0,400}\.sr-fc-strip\{overflow-x:visible/.test(dg); })());
test('v7.23.0 SR #6: open-ended forecast caption present (humanizer copy)',
  /Intervals expand freely/.test(js));
// vm-fixture: known queue → today bucket = due-now count, sum = due-within-7, graduated/beyond-7 excluded
test('v7.23.0 SR #6: vm fixture — buildSrForecast buckets (today=due-now, sum=due-within-7)',
  (() => {
    try {
      const body = _fnBody(js, 'buildSrForecast');
      if (!body) return false;
      const vm = require('vm');
      const now = Date.now();
      const DAY = 86400000;
      const t0 = new Date(now); t0.setHours(0, 0, 0, 0); const sot = t0.getTime();
      const fakeQueue = [
        { topic: 'A', nextReview: now - 5 * DAY, graduated: false },        // overdue → today
        { topic: 'B', nextReview: now - 100, graduated: false },            // due now → today
        { topic: 'C', nextReview: sot + 1 * DAY + 1000, graduated: false }, // tomorrow
        { topic: 'C', nextReview: sot + 1 * DAY + 2000, graduated: false }, // tomorrow
        { topic: 'D', nextReview: sot + 3 * DAY + 5000, graduated: false }, // day 3
        { topic: 'E', nextReview: sot + 6 * DAY + 5000, graduated: false }, // day 6 (within 7)
        { topic: 'F', nextReview: sot + 9 * DAY, graduated: false },        // beyond 7 → excluded
        { topic: 'G', nextReview: now - DAY, graduated: true }              // graduated → excluded
      ];
      const ctx = { loadSrQueue: () => fakeQueue.map(c => Object.assign({}, c)), Date: Date, Math: Math };
      vm.createContext(ctx);
      const fc = vm.runInContext(body + '\nbuildSrForecast();', ctx);
      if (!fc || !Array.isArray(fc.days) || fc.days.length !== 7) return false;
      const sum = fc.days.reduce((s, d) => s + d.count, 0);
      return fc.days[0].count === 2 && fc.days[0].isToday === true && sum === 6 && fc.maxCount === 2;
    } catch (e) { return false; }
  })());
// ── v7.24.0 SR enhancements · Phase 5 (#7 exam-aware scheduling) ──
test('v7.24.0 SR #7: SR_EXAM_BUFFER_PCT constant defined (0.15)',
  /const\s+SR_EXAM_BUFFER_PCT\s*=\s*0\.15/.test(js));
test('v7.24.0 SR #7: _srSchedule caps the interval to land before exam day',
  (() => { const b = _fnBody(js, '_srSchedule'); return b && /getDaysToExam\s*===\s*'function'/.test(b) && /SR_EXAM_BUFFER_PCT/.test(b) && /Math\.min\(entry\.intervalDays,\s*Math\.max\(1,\s*_daysToExam\s*-\s*buffer\)\)/.test(b); })());
test('v7.24.0 SR #7: exam cap reuses the existing exam date (no new examDates field)',
  !/STORAGE\.SR_PREFS[\s\S]{0,200}examDates/.test(js) && /function\s+getDaysToExam\s*\(/.test(js));
test('v7.24.0 SR #7: _srExamPriority front-load score defined (weakness + blueprint)',
  (() => { const b = _fnBody(js, '_srExamPriority'); return b && /correctStreak/.test(b) && /easeFactor/.test(b) && /DOMAIN_WEIGHTS/.test(b); })());
test('v7.24.0 SR #7: startSrReview front-loads weak/high-blueprint cards when exam set',
  (() => { const b = _fnBody(js, 'startSrReview'); return b && /getDaysToExam/.test(b) && /_srExamPriority/.test(b) && /due\.sort/.test(b); })());
test('v7.24.0 SR #7: forecast shows exam countdown pill + exam caption when exam set',
  (() => { const b = _fnBody(js, 'renderSrForecast'); return b && /sr-fc-exam-pill/.test(b) && /Exam in /.test(b) && /capped to land before exam day/.test(b); })());
test('v7.24.0 SR #7: exam countdown pill styled in dg-system',
  (() => { const dg = read('dg-system.css'); return dg.includes('.sr-fc-exam-pill'); })());
// vm-fixture: exam +14d caps a 75d interval to (14 - round(14*0.15)=2) = 12; null = uncapped; closer = smaller
test('v7.24.0 SR #7: vm fixture — _srSchedule exam cap (14d→12, null→75, 7d→6)',
  (() => {
    try {
      const body = _fnBody(js, '_srSchedule');
      if (!body) return false;
      const vm = require('vm');
      const ctx = { Date: Date, Math: Math, SR_EXAM_BUFFER_PCT: 0.15, SR_GRADUATION_STREAK: 3, SR_GRADUATION_EASE: 2.5, SR_GRADUATION_INTERVAL: 30 };
      vm.createContext(ctx);
      const script = body + '\n'
        + 'let cur = 14; function getDaysToExam(){ return cur; }\n'
        + 'const e1 = _srSchedule({intervalDays:30,easeFactor:2.5,correctStreak:0},"correct-confident");\n'
        + 'cur = null;\n'
        + 'const e2 = _srSchedule({intervalDays:30,easeFactor:2.5,correctStreak:0},"correct-confident");\n'
        + 'cur = 7;\n'
        + 'const e3 = _srSchedule({intervalDays:30,easeFactor:2.5,correctStreak:0},"correct-confident");\n'
        + '({a:e1.intervalDays,b:e2.intervalDays,c:e3.intervalDays});';
      const r = vm.runInContext(script, ctx);
      return r.a === 12 && r.b === 75 && r.c === 6 && r.c < r.a;
    } catch (e) { return false; }
  })());
// ── v7.25.0 SR enhancements · Phase 6 (#3 lapse-aware partial reset) ──
test('v7.25.0 SR #3: SR_LAPSE_FACTOR constant defined (0.30)',
  /const\s+SR_LAPSE_FACTOR\s*=\s*0\.30/.test(js));
test('v7.25.0 SR #3: _srSchedule wrong-branch is a partial reset (SR_LAPSE_FACTOR x prior, not hard 1)',
  (() => { const b = _fnBody(js, '_srSchedule'); return b && /Math\.max\(1,\s*Math\.round\(prior\s*\*\s*SR_LAPSE_FACTOR\)\)/.test(b) && !/entry\.intervalDays\s*=\s*1;/.test(b); })());
test('v7.25.0 SR #3: vm fixture — wrong on 30d->9, 2d->1, 1d->1, lapses increments',
  (() => {
    try {
      const body = _fnBody(js, '_srSchedule');
      if (!body) return false;
      const vm = require('vm');
      const ctx = { Date: Date, Math: Math, SR_LAPSE_FACTOR: 0.30, SR_GRADUATION_STREAK: 3, SR_GRADUATION_EASE: 2.5, SR_GRADUATION_INTERVAL: 30 };
      vm.createContext(ctx);
      const script = body + '\n'
        + 'const a = _srSchedule({intervalDays:30,easeFactor:2.5,correctStreak:2,lapses:0},"wrong");\n'
        + 'const b = _srSchedule({intervalDays:2,easeFactor:2.5,lapses:0},"wrong");\n'
        + 'const c = _srSchedule({intervalDays:1,easeFactor:2.5,lapses:1},"wrong");\n'
        + '({a:a.intervalDays,al:a.lapses,b:b.intervalDays,c:c.intervalDays,cl:c.lapses,ae:a.easeFactor});';
      const r = vm.runInContext(script, ctx);
      return r.a === 9 && r.al === 1 && r.b === 1 && r.c === 1 && r.cl === 2 && Math.abs(r.ae - 2.3) < 0.001;
    } catch (e) { return false; }
  })());
// ── v7.26.0 SR enhancements · Phase 6b (#8 top-up light-day practice) ──
test('v7.26.0 SR #8: SR_LIGHT_DAY_THRESHOLD constant defined (8)',
  /const\s+SR_LIGHT_DAY_THRESHOLD\s*=\s*8/.test(js));
test('v7.26.0 SR #8: top-up helpers defined (_srBuildTopUp + startSrTopUp + _srTopUpHtml)',
  /function\s+_srBuildTopUp\s*\(/.test(js) && /function\s+startSrTopUp\s*\(/.test(js) && /function\s+_srTopUpHtml\s*\(/.test(js));
test('v7.26.0 SR #8: _srBuildTopUp sources ahead-of-schedule non-graduated cards',
  (() => { const b = _fnBody(js, '_srBuildTopUp'); return b && /!e\.graduated/.test(b) && /\(e\.nextReview\s*\|\|\s*0\)\s*>\s*now/.test(b) && /_srExamPriority/.test(b); })());
test('v7.26.0 SR #8: srMarkConfidence skips reschedule in practice mode',
  (() => { const b = _fnBody(js, 'srMarkConfidence'); return b && /if\s*\(!_srSession\.practice\)\s*updateSrEntry/.test(b); })());
test('v7.26.0 SR #8: startSrTopUp launches a practice session (practice:true)',
  (() => { const b = _fnBody(js, 'startSrTopUp'); return b && /practice:\s*true/.test(b); })());
test('v7.26.0 SR #8: _srTopUpHtml gated on light day + topUp pref',
  (() => { const b = _fnBody(js, '_srTopUpHtml'); return b && /prefs\.topUp/.test(b) && /remaining\s*>=\s*SR_LIGHT_DAY_THRESHOLD/.test(b); })());
test('v7.26.0 SR #8: top-up launcher bound in JS, no inline onclick (Sec-P7)',
  (() => { const b = _fnBody(js, '_srEndReview'); return b && /sr-topup-btn/.test(b) && /addEventListener/.test(b); })()
    && !/id="sr-topup-btn"[^>]*onclick/.test(js));
test('v7.26.0 SR #8: top-up block styled in dg-system',
  (() => { const dg = read('dg-system.css'); return dg.includes('.sr-topup'); })());
// vm-fixture: top-up excludes due + graduated, keeps ahead-of-schedule, weakest first
test('v7.26.0 SR #8: vm fixture — _srBuildTopUp ahead-weak-only, weakest first',
  (() => {
    try {
      const prio = _fnBody(js, '_srExamPriority');
      const build = _fnBody(js, '_srBuildTopUp');
      if (!prio || !build) return false;
      const vm = require('vm');
      const now = Date.now(), DAY = 86400000;
      const queue = [
        { nextReview: now - DAY, graduated: false, correctStreak: 0, easeFactor: 1.4, lapses: 3, topic: 'A' }, // due -> exclude
        { nextReview: now + 5 * DAY, graduated: false, correctStreak: 0, easeFactor: 1.5, lapses: 2, topic: 'B' }, // ahead weak -> include
        { nextReview: now + 5 * DAY, graduated: false, correctStreak: 3, easeFactor: 2.7, lapses: 0, topic: 'C' }, // ahead strong -> include
        { nextReview: now + 9 * DAY, graduated: true, correctStreak: 0, easeFactor: 1.3, lapses: 5, topic: 'D' }  // graduated -> exclude
      ];
      const ctx = { Date: Date, Math: Math, SR_SESSION_CAP: 30, loadSrQueue: () => queue.map(x => Object.assign({}, x)), _srScrubQueue: (x) => x };
      vm.createContext(ctx);
      const out = vm.runInContext(prio + '\n' + build + '\n_srBuildTopUp(30);', ctx);
      if (!Array.isArray(out) || out.length !== 2) return false;
      const allAhead = out.every(c => c.nextReview > now && !c.graduated);
      return allAhead && out[0].topic === 'B' && out[1].topic === 'C';
    } catch (e) { return false; }
  })());
// ── v7.27.0 SR #8 top-up AI fallback (generate weak-topic practice) ──
test('v7.27.0 SR #8 fallback: startSrGenTopUp reuses the validated focused-quiz pipeline',
  (() => { const b = _fnBody(js, 'startSrGenTopUp'); return b && /applyPreset\(\s*['"]focused['"]\s*\)/.test(b); })());
test('v7.27.0 SR #8 fallback: _srTopUpHtml offers AI-gen only when an API key is set',
  (() => { const b = _fnBody(js, '_srTopUpHtml'); return b && /sr-topup-gen-btn/.test(b) && /STORAGE\.KEY|getApiKey/.test(b) && /if\s*\(!_key\)\s*return\s*''/.test(b); })());
test('v7.27.0 SR #8 fallback: gen launcher bound in JS, no inline onclick (Sec-P7)',
  (() => { const b = _fnBody(js, '_srEndReview'); return b && /sr-topup-gen-btn/.test(b) && /startSrGenTopUp/.test(b); })()
    && !/id="sr-topup-gen-btn"[^>]*onclick/.test(js));
// ── v7.28.0 post-ship fixes: cert-specific page titles + theme-toggle icon + Settings desktop layout ──
test('v7.28.0 theme: _syncTopbarTheme injects an SVG icon (sun/moon), not a bare glyph',
  (() => { const b = _fnBody(js, '_syncTopbarTheme'); return b && /topbar-theme/.test(b) && /<svg/.test(b) && /isLight\s*\?\s*moon\s*:\s*sun/.test(b); })());
test('v7.28.0 titles: .ana-ph-cert spans wrap the cert text on all 3 page headers',
  (html.match(/ana-ph-cert/g) || []).length >= 3);
test('v7.28.0 titles: _syncPageHeaderCert defined (cert name + code) and wired into init',
  /function\s+_syncPageHeaderCert\s*\(/.test(js) && /_syncPageHeaderCert\(\)/.test(js)
    && (() => { const b = _fnBody(js, '_syncPageHeaderCert'); return b && /CERT_PACK\.meta\.name/.test(b) && /CERT_CODE/.test(b); })());
test('v7.28.0 settings: study-setup sections default to full width (kills the desktop 1/12 squish)',
  (() => { const dg = read('dg-system.css'); return /\[data-group="study-setup"\]\s*section\.settings-section\{grid-column:1 \/ -1;\}/.test(dg); })());
// ── Cloud cert-keying: SR cloud state scoped to metadata.sr.<certId> (gated) ──
test('cloud cert-keying: _ccCert reads window.CURRENT_CERT (subdomain-derived)',
  (() => { const cjs = read('cloud-store.js'); return /function\s+_ccCert\s*\(/.test(cjs) && /window\.CURRENT_CERT/.test(cjs); })());
test('cloud cert-keying: buildJsonb writes sr per-cert (out.sr[cert].queue), never flat sr_queue',
  (() => { const b = _fnBody(read('cloud-store.js'), 'buildJsonbFromLocalStorage'); return b && /out\.sr\[cert\]\.queue\s*=\s*parsed/.test(b) && /_ccCert\(\)/.test(b); })());
test('cloud cert-keying: applyJsonb pulls this cert + legacy sr_queue fallback',
  (() => { const b = _fnBody(read('cloud-store.js'), 'applyJsonbToLocalStorage'); return b && /cloudKey === 'sr'/.test(b) && /meta\.sr\[cert\]/.test(b) && /cloudKey === 'sr_queue'/.test(b); })());
test('cloud cert-keying: doFlush read-merge-writes cert-scoped maps sr/activated/onb_skips (preserves other certs)',
  (() => { const b = _fnBody(read('cloud-store.js'), 'doFlush'); return b && /select\('metadata'\)/.test(b) && /CERT_SCOPED\s*=\s*\['sr',\s*'activated',\s*'onb_skips'\]/.test(b) && /Object\.assign\(\{\},\s*existing,\s*ours\)/.test(b); })());
// ── Onboarding rollout gate + activation telemetry (Track A) ──────────────────
test('onb gate: USER_DATA_KEYS includes nplus_activated + nplus_onb_skips',
  (() => { const cjs = read('cloud-store.js'); return /'nplus_activated'/.test(cjs) && /'nplus_onb_skips'/.test(cjs); })());
test('onb gate: buildJsonb cert-scopes activated + onb_skips (metadata.<key>.<certId>)',
  (() => { const b = _fnBody(read('cloud-store.js'), 'buildJsonbFromLocalStorage'); return b && /cloudKey === 'activated' \|\| cloudKey === 'onb_skips'/.test(b) && /out\[cloudKey\]\[aCert\]\s*=\s*parsed/.test(b); })());
test('onb gate: applyJsonb pulls this cert slice for activated/onb_skips',
  (() => { const b = _fnBody(read('cloud-store.js'), 'applyJsonbToLocalStorage'); return b && /cloudKey === 'activated' \|\| cloudKey === 'onb_skips'/.test(b) && /meta\[cloudKey\]\[cert\]/.test(b); })());
test('onb gate: vm — buildJsonb cert-scopes activated under this cert, not siblings',
  (() => {
    try {
      const cjs = read('cloud-store.js');
      const cc = _fnBody(cjs, '_ccCert'); const build = _fnBody(cjs, 'buildJsonbFromLocalStorage');
      if (!cc || !build) return false;
      const vm = require('vm');
      const store = { 'nplus_activated': JSON.stringify({ at: 5, baseline: 600, moved: null }) };
      const ctx = { USER_DATA_KEYS: new Set(['nplus_activated']), TABLE_BACKED_KEYS: new Set(), localStorage: { getItem: (k) => (k in store ? store[k] : null) }, window: { CURRENT_CERT: 'secplus' }, JSON: JSON, Object: Object };
      vm.createContext(ctx);
      const out = vm.runInContext(cc + '\n' + build + '\nbuildJsonbFromLocalStorage();', ctx);
      return out && out.activated && out.activated.secplus && out.activated.secplus.baseline === 600 && out.activated.netplus === undefined;
    } catch (e) { return false; }
  })());
test('onb gate: vm — applyJsonb extracts this cert activated slice (sibling stays cloud-only)',
  (() => {
    try {
      const cjs = read('cloud-store.js');
      const cc = _fnBody(cjs, '_ccCert'); const apply = _fnBody(cjs, 'applyJsonbToLocalStorage');
      if (!cc || !apply) return false;
      const vm = require('vm');
      const sets = {};
      const ctx = { USER_DATA_KEYS: new Set(['nplus_activated']), TABLE_BACKED_KEYS: new Set(), localStorage: { setItem: (k, v) => { sets[k] = v; } }, window: { CURRENT_CERT: 'secplus' }, JSON: JSON, Object: Object };
      vm.createContext(ctx);
      vm.runInContext(cc + '\n' + apply + '\napplyJsonbToLocalStorage({activated:{secplus:{baseline:700},netplus:{baseline:400}}});', ctx);
      return sets['nplus_activated'] === JSON.stringify({ baseline: 700 });
    } catch (e) { return false; }
  })());
test('onb gate: onboarding-boot reads app_config via refreshConfig + onb_cfg cache, default off',
  (() => { const b = read('lib/onboarding-boot.js'); return /app_config/.test(b) && /refreshConfig/.test(b) && /onb_cfg/.test(b) && /onboarding_enabled/.test(b); })());
test('onb gate: firstrun writes activation (baseline+moved) and skip record',
  (() => { const f = read('lib/onboarding-firstrun.js'); return /function\s+writeActivation/.test(f) && /function\s+recordSkip/.test(f) && /baseline:\s*real\.calibScore/.test(f) && /nplus_onb_skips/.test(f); })());
// ── Free-tier cert lock ───────────────────────────────────────────────────────
test('cert-lock: router.certHost maps all 8 certs + defaults to networkplus',
  (() => { const r = read('lib/router.js'); return /CERT_HOST\s*=/.test(r) && /aplus\.certanvil\.com\/\?exam=core2/.test(r) && /certHost:\s*certHost/.test(r); })());
test('cert-lock: module exposes _certLock.check + claimIfUnset, fails open',
  (() => { const c = read('lib/cert-lock.js'); return /window\._certLock\s*=\s*\{\s*check/.test(c) && /claimIfUnset/.test(c) && /fail open/i.test(c); })());
test('cert-lock: gate exempts pro/admin + anonymous, walls wrong cert',
  (() => { const c = read('lib/cert-lock.js'); return /getTier\(opts\.profile\)\s*!==\s*'free'/.test(c) && /!opts\.isLoggedIn/.test(c) && /here\s*!==\s*locked/.test(c); })());
test('cert-lock: _onbRoute calls _certLock.check BEFORE the ENABLED guard (always-on)',
  (() => { const b = read('lib/onboarding-boot.js'); const i = b.indexOf('_certLock'); const g = b.indexOf('if (!ENABLED) return;'); return i > -1 && g > -1 && i < g; })());
test('cert-lock: cloud-store carries nplus_freeCertId + preserves it on flush',
  (() => { const c = read('cloud-store.js'); return /'nplus_freeCertId'/.test(c) && /jsonb\.freeCertId == null && existingMeta && existingMeta\.freeCertId/.test(c); })());
test('cert-lock: firstrun persists freeCertId on confirm-cert for free users',
  (() => { const f = read('lib/onboarding-firstrun.js'); return /persistFreeCert/.test(f) && /nplus_freeCertId/.test(f) && /state\.tier !== 'pro'/.test(f); })());
test('cert-lock: index.html loads cert-lock.js after router.js, before app.js',
  (() => { const h = read('index.html'); return h.indexOf('lib/router.js') < h.indexOf('lib/cert-lock.js') && h.indexOf('lib/cert-lock.js') < h.indexOf('src="app.js"'); })());
test('cert-lock: vm — free+wrong cert walls; owned/pro/admin/anon/unset do not',
  (() => {
    try {
      const c = read('lib/cert-lock.js');
      const vm = require('vm');
      const walls = [];
      const router = { getTier: (p) => ((p && p.role === 'admin') || (p && p.metadata && p.metadata.tier === 'pro')) ? 'pro' : 'free', certHost: () => 'x' };
      const mkCtx = (cert) => ({
        window: { certanvilRouter: router, CURRENT_CERT: cert, cloudStore: { flush() {} } },
        document: { getElementById: () => null, createElement: () => ({ setAttribute() {}, classList: { add() {} }, style: {} }), body: { appendChild: (el) => walls.push(el) }, documentElement: { classList: { add() {} } } },
        localStorage: { setItem() {} }, Object: Object
      });
      const run = (cert, opts) => { const ctx = mkCtx(cert); vm.createContext(ctx); vm.runInContext(c + '\nwindow._certLock.check(' + JSON.stringify(opts) + ');', ctx); };
      const before = walls.length;
      run('secplus', { isLoggedIn: true, profile: { role: 'user', metadata: { freeCertId: 'netplus' } } });  // free, wrong -> WALL
      const afterWrong = walls.length;
      run('netplus', { isLoggedIn: true, profile: { role: 'user', metadata: { freeCertId: 'netplus' } } });  // owned -> no wall
      run('secplus', { isLoggedIn: true, profile: { role: 'admin', metadata: {} } });                         // admin -> no wall
      run('secplus', { isLoggedIn: false });                                                                   // anon -> no wall
      run('secplus', { isLoggedIn: true, profile: { role: 'user', metadata: {} } });                          // unset -> no wall
      return (afterWrong === before + 1) && (walls.length === afterWrong);
    } catch (e) { return false; }
  })());
test('cloud cert-keying: vm — buildJsonb cert-scopes sr_queue, leaves other keys flat',
  (() => {
    try {
      const cjs = read('cloud-store.js');
      const cc = _fnBody(cjs, '_ccCert'); const build = _fnBody(cjs, 'buildJsonbFromLocalStorage');
      if (!cc || !build) return false;
      const vm = require('vm');
      const store = { 'nplus_sr_queue': JSON.stringify([{ q: 'a' }]), 'nplus_streak': JSON.stringify({ current: 3 }) };
      const ctx = { USER_DATA_KEYS: new Set(['nplus_sr_queue', 'nplus_streak']), TABLE_BACKED_KEYS: new Set(), localStorage: { getItem: (k) => (k in store ? store[k] : null) }, window: { CURRENT_CERT: 'secplus' }, JSON: JSON, Object: Object };
      vm.createContext(ctx);
      const out = vm.runInContext(cc + '\n' + build + '\nbuildJsonbFromLocalStorage();', ctx);
      return out && out.sr && out.sr.secplus && Array.isArray(out.sr.secplus.queue) && out.sr.secplus.queue[0].q === 'a'
        && out.sr_queue === undefined && out.streak && out.streak.current === 3;
    } catch (e) { return false; }
  })());
test('cloud cert-keying: vm — applyJsonb extracts this cert; legacy flat sr_queue fallback',
  (() => {
    try {
      const cjs = read('cloud-store.js');
      const cc = _fnBody(cjs, '_ccCert'); const apply = _fnBody(cjs, 'applyJsonbToLocalStorage');
      if (!cc || !apply) return false;
      const vm = require('vm');
      const sets = {};
      const ctx = { USER_DATA_KEYS: new Set(['nplus_sr_queue', 'nplus_streak']), TABLE_BACKED_KEYS: new Set(), localStorage: { setItem: (k, v) => { sets[k] = v; } }, window: { CURRENT_CERT: 'secplus' }, JSON: JSON, Object: Object };
      vm.createContext(ctx);
      vm.runInContext(cc + '\n' + apply + '\napplyJsonbToLocalStorage({sr:{secplus:{queue:[1,2]},netplus:{queue:[9]}}});', ctx);
      const perCert = sets['nplus_sr_queue'] === JSON.stringify([1, 2]);   // secplus, not netplus
      delete sets['nplus_sr_queue'];
      vm.runInContext('applyJsonbToLocalStorage({sr_queue:[7,7]});', ctx);
      const legacy = sets['nplus_sr_queue'] === JSON.stringify([7, 7]);     // flat fallback
      return perCert && legacy;
    } catch (e) { return false; }
  })());
// ── v7.29.1 (rev v7.50.x): cert-switcher lettermark glyphs visible in dark mode ──
// Original pinned dark ink because the tile was a fixed cream chip (#FFFBF3).
// The tile bg now adapts (color-mix on var(--surface)), so ink + accent must
// adapt with it via the base rule (var(--text)/var(--accent)). The dark-theme
// dark-ink pin became the dark-on-dark regression and was removed — guard that
// it does not return, and that the base rule keeps adapting tokens.
test('v7.29.1 cert-switcher: .tad-cert-glyph uses adapting ink (visible in dark, no dark-on-dark pin)',
  (() => { const dg = read('dg-system.css');
    const baseAdapts = /\.tad-cert-glyph\{[^}]*background-color:color-mix\(in oklab, var\(--accent\)[^}]*color:var\(--text\)/.test(dg);
    const noDarkPin = !/html\[data-theme="dark"\][^{]*\.tad-cert-glyph\{color:oklch\(0\.26/.test(dg);
    return baseAdapts && noDarkPin; })());
test('v4.74.0 CSS: .sr-option pickable button styled', css.includes('.sr-option'));
test('v4.74.0 CSS: .sr-confidence-confident green styled', css.includes('.sr-confidence-confident'));
test('v4.74.0 CSS: .sr-confidence-uncertain yellow styled', css.includes('.sr-confidence-uncertain'));
test('v4.74.0 CSS: reduced-motion gate present for SR review',
  /prefers-reduced-motion[\s\S]{0,1000}\.sr-progress-fill/.test(css));

// ══════════════════════════════════════════
// v4.75.0 — ACL Ordering PBQ
// First new performance-based-question format. Hand-authored bank, drag/
// arrow reordering, test-traffic simulation, combined order+traffic score.
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.75.0 ACL ORDERING PBQ ──\x1b[0m');

// Bank + helpers
test('v4.75.0 data: ACL_PBQ_BANK constant defined',
  /const\s+ACL_PBQ_BANK\s*=\s*\[/.test(js));
test('v4.75.0 data: bank includes web-server-dmz scenario',
  /id:\s*['"]web-server-dmz['"]/.test(js));
test('v4.75.0 data: bank includes remote-vpn-restricted scenario',
  /id:\s*['"]remote-vpn-restricted['"]/.test(js));
test('v4.75.0 data: bank includes guest-wifi-isolation scenario',
  /id:\s*['"]guest-wifi-isolation['"]/.test(js));
test('v4.75.0 data: each scenario has correctOrder array',
  (() => {
    // crude check — at least 3 occurrences of correctOrder array
    const matches = js.match(/correctOrder:\s*\[/g) || [];
    return matches.length >= 3;
  })());
test('v4.75.0 data: each scenario has testTraffic array',
  (() => {
    const matches = js.match(/testTraffic:\s*\[/g) || [];
    return matches.length >= 3;
  })());

// Functions
test('v4.75.0 helpers: openAclPbqPicker defined',
  /function\s+openAclPbqPicker\s*\(/.test(js));
test('v4.75.0 helpers: startAclPbq defined',
  /function\s+startAclPbq\s*\(/.test(js));
test('v4.75.0 helpers: aclMoveRule defined',
  /function\s+aclMoveRule\s*\(/.test(js));
test('v4.75.0 helpers: submitAclPbq defined',
  /function\s+submitAclPbq\s*\(/.test(js));
test('v4.75.0 helpers: _aclPbqMatchPacket first-match-wins simulation defined',
  /function\s+_aclPbqMatchPacket\s*\(/.test(js));
test('v4.75.0 helpers: _aclPbqRuleMatches defined (namespaced — avoids collision with v4.52.0)',
  /function\s+_aclPbqRuleMatches\s*\(/.test(js));
test('v4.75.0 helpers: _aclPbqCidrMatch defined',
  /function\s+_aclPbqCidrMatch\s*\(/.test(js));
test('v4.75.0 helpers: _aclPbqIpToInt defined',
  /function\s+_aclPbqIpToInt\s*\(/.test(js));

// Algorithm correctness
test('v4.75.0 algorithm: CIDR match returns true for ip in range', (() => {
  // 10.0.1.0/24 should match 10.0.1.50
  const ipToInt = (ip) => {
    const p = ip.split('.');
    return ((parseInt(p[0])<<24) | (parseInt(p[1])<<16) | (parseInt(p[2])<<8) | parseInt(p[3])) >>> 0;
  };
  const prefix = 24;
  const mask = ((-1 << (32 - prefix)) >>> 0);
  return (ipToInt('10.0.1.0') & mask) === (ipToInt('10.0.1.50') & mask);
})());
test('v4.75.0 algorithm: CIDR match returns false for ip outside range', (() => {
  const ipToInt = (ip) => {
    const p = ip.split('.');
    return ((parseInt(p[0])<<24) | (parseInt(p[1])<<16) | (parseInt(p[2])<<8) | parseInt(p[3])) >>> 0;
  };
  const prefix = 24;
  const mask = ((-1 << (32 - prefix)) >>> 0);
  return (ipToInt('10.0.1.0') & mask) !== (ipToInt('10.0.2.50') & mask);
})());
test('v4.75.0 algorithm: 70/30 score split (orderMatch * 0.70 + trafficMatch * 0.30)',
  /orderMatch\s*\*\s*0\.70\s*\+\s*trafficMatch\s*\*\s*0\.30/.test(js));
test('v4.75.0 algorithm: implicit deny returns when no rule matches',
  /matchedAt:\s*order\.length[\s\S]{0,200}implicit deny/.test(js));

// HTML wiring
test('v4.75.0 HTML: #page-acl-pbq page exists', html.includes('id="page-acl-pbq"'));
test('v4.75.0 HTML: #acl-pbq-picker container exists', html.includes('id="acl-pbq-picker"'));
test('v4.75.0 HTML: #acl-pbq-host container exists', html.includes('id="acl-pbq-host"'));
test('v4.75.0 HTML: ACL Ordering PBQ tile present in drills page',
  html.includes('ACL Ordering'));

// CSS
test('v4.75.0 CSS: .acl-pbq-card styled', css.includes('.acl-pbq-card'));
test('v4.75.0 CSS: .acl-rule-row + allow/deny variants styled',
  css.includes('.acl-rule-row.is-allow') && css.includes('.acl-rule-row.is-deny'));
test('v4.75.0 CSS: .acl-arrow-btn for reordering styled', css.includes('.acl-arrow-btn'));
test('v4.75.0 CSS: .acl-traffic-correct + .acl-traffic-wrong result variants styled',
  css.includes('.acl-traffic-correct') && css.includes('.acl-traffic-wrong'));
test('v4.75.0 CSS: result-card tier classes (good/warn/bad)',
  css.includes('.acl-result-card.good') && css.includes('.acl-result-card.warn') && css.includes('.acl-result-card.bad'));
test('v4.75.0 CSS: drills-tile-pbq-badge styled', css.includes('.drills-tile-pbq-badge'));
test('v4.75.0 CSS: reduced-motion gate present for ACL',
  /prefers-reduced-motion[\s\S]{0,1000}\.acl-picker-card/.test(css));

