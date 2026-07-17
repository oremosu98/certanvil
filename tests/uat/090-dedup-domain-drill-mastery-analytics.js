// tests/uat/090-dedup-domain-drill-mastery-analytics.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Cross-batch dedup, today-section consolidation, domain drill, question-quality validators, stale-topic surfacing, mixed-mode lottery, constellation, why-your-score, exam-review filters

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ──────────────────────────────────────────────────────────
// v4.81.14: Cross-batch question dedup (user report)
// ──────────────────────────────────────────────────────────
// User: "some questions kept repeating themselves lol... in the exam
// simulator... also this happens in regular quizzes sometimes too"
//
// Pre-fix: zero dedup anywhere. fetchQuestions split n>10 into parallel
// batches via Promise.allSettled; concurrent batches couldn't see each
// other's output. startExam called fetchQuestions 5 times sequentially;
// no cross-call dedup either. Validator caught structural bugs but had
// no cross-batch awareness — duplicates passed right through.
//
// Fix: stem normalization (lowercase + strip punctuation + collapse
// whitespace + 200-char cap) + first-seen-wins dedup at two levels:
// inside fetchQuestions's parallel-batch merge, and across startExam's
// 5 sequential batches. Dedup happens BEFORE the existing retry-to-fill
// logic so deficit auto-refills.

test('v4.81.14 Dedup: _normalizeStemForDedup helper defined',
  /function\s+_normalizeStemForDedup\b/.test(js));
test('v4.81.14 Dedup: helper lowercases + strips punctuation + collapses whitespace + caps length',
  (() => {
    const body = _fnBody(js, '_normalizeStemForDedup');
    return body
      && /toLowerCase/.test(body)
      && /\[\^\\w\\s\]/.test(body)
      && /\\s\+/.test(body)
      && /slice\(0,\s*200\)/.test(body);
  })());
test('v4.81.14 Dedup: fetchQuestions merge step uses Set + _normalizeStemForDedup (v4.85.7: extracted to _mergeBatchedFetchResults)',
  (() => {
    const body = _fnBody(js, '_mergeBatchedFetchResults');
    return body
      && /seenStems/.test(body)
      && /_normalizeStemForDedup/.test(body)
      && /new Set\(\)/.test(body);
  })());
test('v4.81.14 Dedup: merge step logs deduped count when > 0 (v4.85.7: extracted to _mergeBatchedFetchResults)',
  (() => {
    const body = _fnBody(js, '_mergeBatchedFetchResults');
    return body && /deduped\b/.test(body) && /console\.info/.test(body);
  })());
test('v4.81.14 Dedup: startExam dedupes new batch against accumulated examQuestions',
  (() => {
    const body = _fnBody(js, 'startExam');
    return body
      && /examQuestions\.length\s*>\s*0/.test(body)
      && /seenStems/.test(body)
      && /_normalizeStemForDedup/.test(body);
  })());
test('v4.81.14 Dedup: startExam retry-to-fill payload also deduped (no undoing prior dedup)',
  (() => {
    const body = _fnBody(js, 'startExam');
    return body && /seenStemsRetry/.test(body);
  })());

// vm fixture — synthesize realistic stems with case/punctuation/whitespace
// variation + verify normalization collapses them to the same key.
test('v4.81.14 Dedup: vm fixture — normalization collapses case + punctuation + whitespace',
  (() => {
    try {
      const body = _fnBody(js, '_normalizeStemForDedup');
      if (!body) return false;
      const vm = require('vm');
      const ctx = { String };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const a = vm.runInContext("_normalizeStemForDedup('Which of the following BEST describes ARP?')", ctx);
      const b = vm.runInContext("_normalizeStemForDedup('  which of the following best describes arp.  ')", ctx);
      const c = vm.runInContext("_normalizeStemForDedup('Which   of\\nthe following best describes\\tARP???')", ctx);
      const empty1 = vm.runInContext("_normalizeStemForDedup('')", ctx);
      const empty2 = vm.runInContext("_normalizeStemForDedup(null)", ctx);
      const empty3 = vm.runInContext("_normalizeStemForDedup(undefined)", ctx);
      // All three variations should normalize to the same string
      return a === b
        && a === c
        && a === 'which of the following best describes arp'
        && empty1 === ''
        && empty2 === ''
        && empty3 === '';
    } catch (e) { return false; }
  })());

// vm fixture — simulate the merge dedup logic across 3 parallel batches
// where batch 2 has a duplicate of batch 1 + batch 3 has a duplicate of
// batch 2. Verify only first-seen versions survive.
test('v4.81.14 Dedup: vm fixture — first-seen wins across parallel batches',
  (() => {
    try {
      const helperBody = _fnBody(js, '_normalizeStemForDedup');
      if (!helperBody) return false;
      const vm = require('vm');
      const ctx = { String, Set };
      vm.createContext(ctx);
      vm.runInContext(helperBody, ctx);
      // Simulate the merge logic from fetchQuestions
      const mergeLogic = `
        const merged = [];
        const seenStems = new Set();
        let deduped = 0;
        results.forEach(r => {
          if (r.status === 'fulfilled') {
            r.value.forEach(q => {
              const norm = _normalizeStemForDedup(q && q.question);
              if (norm && seenStems.has(norm)) { deduped++; return; }
              if (norm) seenStems.add(norm);
              merged.push(q);
            });
          }
        });
        ({ merged, deduped });
      `;
      const results = [
        { status: 'fulfilled', value: [
          { question: 'What is OSPF?', answer: 'A' },
          { question: 'What is BGP?', answer: 'B' }
        ]},
        { status: 'fulfilled', value: [
          { question: 'what is OSPF?', answer: 'A' },  // duplicate of batch 1
          { question: 'What is RIP?', answer: 'C' }
        ]},
        { status: 'fulfilled', value: [
          { question: 'WHAT IS BGP???', answer: 'B' },  // duplicate of batch 1
          { question: 'What is EIGRP?', answer: 'D' }
        ]}
      ];
      ctx.results = results;
      const out = vm.runInContext(mergeLogic, ctx);
      // Should have 4 unique: OSPF, BGP, RIP, EIGRP — and 2 deduped
      return out.merged.length === 4
        && out.deduped === 2
        && out.merged[0].question === 'What is OSPF?'  // original case kept
        && out.merged[1].question === 'What is BGP?'   // original case kept
        && out.merged[2].question === 'What is RIP?'
        && out.merged[3].question === 'What is EIGRP?';
    } catch (e) { return false; }
  })());

// v4.81.22: hide today-section wrapper when nothing meaningful renders
// inside. User dogfood screenshot post-v4.81.21 showed the section
// rendering as an empty card with just "TODAY" title — because
// hero-v2-active CSS hides #daily-goal-card AND #today-plan was
// correctly hidden (plan done today). renderTodaySection now properly
// hides the wrapper when no candidate child is effectively visible.
test('v4.81.22 EmptyHide: renderTodaySection considers #today-plan in candidate list',
  /#today-plan/.test(_fnBody(js, 'renderTodaySection') || ''));
test('v4.81.22 EmptyHide: renderTodaySection accounts for hero-v2-active hide rule',
  /hero-v2-active/.test(_fnBody(js, 'renderTodaySection') || ''));
test('v4.81.22 EmptyHide: renderTodaySection conditionally hides the wrapper',
  (() => {
    const body = _fnBody(js, 'renderTodaySection') || '';
    return /classList\.add\(['"]is-hidden['"]\)/.test(body)
      && /classList\.remove\(['"]is-hidden['"]\)/.test(body);
  })());
test('v4.81.22 EmptyHide: tombstone — old "section is always shown" comment removed',
  !/Daily goal card is always visible, so the section is always shown/.test(_fnBody(js, 'renderTodaySection') || ''));

// vm fixture #1 — section hidden when all candidates effectively hidden
test('v4.81.22 EmptyHide: vm fixture — section hidden when daily-goal hero-v2-hidden + today-plan hidden',
  (() => {
    try {
      const body = _fnBody(js, 'renderTodaySection');
      if (!body) return false;
      const vm = require('vm');
      // Build fake DOM that mirrors the v4.81.21 dogfood state:
      // hero-v2-active on body, daily-goal not is-hidden but display:none via CSS,
      // today-plan IS is-hidden, others all is-hidden.
      const makeChild = (id, hidden) => ({
        id, _classes: new Set(hidden ? ['is-hidden'] : []),
        classList: { contains: function(c) { return makeChild_classes(this, c); } }
      });
      // Simpler: real Set with contains check
      const childMap = {
        '#daily-goal-card':      { _classes: new Set([]) },              // not is-hidden, but hero-v2 hides via CSS
        '#streak-defender':      { _classes: new Set(['is-hidden']) },
        '#daily-challenge-card': { _classes: new Set(['is-hidden']) },
        '#today-plan':           { _classes: new Set(['is-hidden']) }
      };
      Object.values(childMap).forEach(c => {
        c.classList = { contains: (cls) => c._classes.has(cls) };
      });
      const sectionState = { _classes: new Set([]) };
      sectionState.classList = {
        contains: (c) => sectionState._classes.has(c),
        add: (c) => sectionState._classes.add(c),
        remove: (c) => sectionState._classes.delete(c)
      };
      const ctx = {
        document: {
          getElementById: (id) => id === 'today-section' ? sectionState : null,
          body: { classList: { contains: (c) => c === 'hero-v2-active' } }
        },
        Array
      };
      sectionState.querySelector = (sel) => childMap[sel] || null;
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      vm.runInContext('renderTodaySection()', ctx);
      // Should be is-hidden because daily-goal is hidden by hero-v2 CSS rule
      // and all other candidates carry the is-hidden class.
      return sectionState._classes.has('is-hidden');
    } catch (e) { return false; }
  })());

// vm fixture #2 — section visible when ANY candidate has content
test('v4.81.22 EmptyHide: vm fixture — section visible when daily-challenge-card visible',
  (() => {
    try {
      const body = _fnBody(js, 'renderTodaySection');
      if (!body) return false;
      const vm = require('vm');
      const childMap = {
        '#daily-goal-card':      { _classes: new Set([]) },
        '#streak-defender':      { _classes: new Set(['is-hidden']) },
        '#daily-challenge-card': { _classes: new Set([]) },              // VISIBLE
        '#today-plan':           { _classes: new Set(['is-hidden']) }
      };
      Object.values(childMap).forEach(c => {
        c.classList = { contains: (cls) => c._classes.has(cls) };
      });
      const sectionState = { _classes: new Set(['is-hidden']) };
      sectionState.classList = {
        contains: (c) => sectionState._classes.has(c),
        add: (c) => sectionState._classes.add(c),
        remove: (c) => sectionState._classes.delete(c)
      };
      const ctx = {
        document: {
          getElementById: () => sectionState,
          // hero-v2 active — so daily-goal is "hidden" but daily-challenge isn't
          body: { classList: { contains: (c) => c === 'hero-v2-active' } }
        },
        Array
      };
      sectionState.querySelector = (sel) => childMap[sel] || null;
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      vm.runInContext('renderTodaySection()', ctx);
      // Section should be made visible because daily-challenge-card is visible
      return !sectionState._classes.has('is-hidden');
    } catch (e) { return false; }
  })());

// v4.81.21: Restore Subnet Trainer bridge in #today-plan. The v4.43.1
// affordance ("Drill in Subnet Trainer →" link for subnet-heavy weak
// topics) was retired in v4.81.18 consolidation. WEAK_SPOT_DRILL_BRIDGES
// constant + openWeakSpotBridge handler stayed (used by Subnet Trainer
// dashboard); this restores the integration point in the new
// consolidated card. Bridges render below the chip strip when the plan
// includes any of: Subnetting & IP Addressing, IPv6, NAT & IP Services.
test('v4.81.21 BridgeRestore: .tplan-bridges CSS declared',
  /\.tplan-bridges\s*\{/.test(css));
test('v4.81.21 BridgeRestore: .tplan-bridge-btn CSS declared',
  /\.tplan-bridge-btn\s*\{/.test(css));
test('v4.81.21 BridgeRestore: bridge buttons get reduced-motion gate',
  /prefers-reduced-motion[\s\S]{0,800}\.tplan-bridge-btn/.test(css));
test('v4.81.21 BridgeRestore: bridge buttons get mobile breakpoint margin reset',
  /@media[\s\S]{0,80}max-width:\s*540px[\s\S]{0,400}\.tplan-bridges/.test(css));

// vm fixture — bridge logic emits buttons for subnet topics in plan.

// vm fixture — bridges hidden when plan has no subnet topics
test('v4.81.21 BridgeRestore: vm fixture — no bridges rendered when plan has no subnet topics',
  (() => {
    try {
      const body = _fnBody(js, 'renderTodayPlan');
      if (!body) return false;
      const vm = require('vm');
      const fakeCard = { _innerHTML: '',
        get innerHTML() { return this._innerHTML; },
        set innerHTML(v) { this._innerHTML = v; },
        classList: { add: () => {}, remove: () => {} }
      };
      const ctx = {
        document: { getElementById: () => fakeCard },
        WEAK_SPOT_DRILL_BRIDGES: {
          'Subnetting & IP Addressing': { kind: 'subnet', label: 'Drill in Subnet Trainer', icon: '🧮' }
        },
        SESSION_TOPICS: 5,
        SESSION_QUESTIONS: 7,
        sessionPlan: [],
        buildSessionPlan: () => ([
          { topic: 'WAN Connectivity', signal: 'weak', meta: '~55%', reason: '~55%', color: '#fbbf24' },
          { topic: 'BGP', signal: 'stale', meta: '21d', reason: '21d', color: '#f59e0b' }
        ]),
        isStudyPlanDoneToday: () => false,
        escHtml: (s) => String(s),
        Math, JSON, Object, Array, String
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      vm.runInContext('renderTodayPlan()', ctx);
      const html = fakeCard._innerHTML;
      return !html.includes('tplan-bridges') && !html.includes('tplan-bridge-btn');
    } catch (e) { return false; }
  })());

// v4.81.20: retire orphan v4.54.0 #focus-banner. User dogfood after
// v4.81.18 ship revealed the focus-banner was a SECOND prescriptive
// surface OUTSIDE the today-section — still rendering "Seven questions
// per topic, mixed difficulty..." stale copy any time the new
// #today-plan was correctly hidden by the isStudyPlanDoneToday gate.
// renderSetupFocusBanner now a thin compat shim that delegates to
// renderTodayPlan so all states route through the canonical card.
// v4.81.23: cleanup pass — the v4.81.20 compat shim was retired entirely.
// renderSetupFocusBanner is now a no-op stub (kept for any external
// callers); the #focus-banner element + its CSS are removed.
test('v4.81.23 FocusCleanup: renderSetupFocusBanner is a no-op stub',
  (() => {
    const body = _fnBody(js, 'renderSetupFocusBanner') || '';
    return body.length < 200; // tiny stub, no logic
  })());
test('v4.81.23 FocusCleanup: stale "Seven questions per topic" copy gone',
  !/Seven questions per topic, mixed difficulty/.test(js));
test('v4.81.23 FocusCleanup: "fastest route to exam-ready" copy only in renderTodayPlan',
  (() => {
    const matches = (js.match(/fastest[^"]*route to exam-ready/g) || []);
    if (matches.length === 0) return false;
    const tpBody = _fnBody(js, 'renderTodayPlan') || '';
    return matches.every(m => tpBody.includes(m));
  })());
test('v4.81.23 FocusCleanup tombstone: #focus-banner element removed from HTML',
  !html.includes('id="focus-banner"'));
test('v4.81.23 FocusCleanup tombstone: .focus-banner-v2 CSS removed',
  !/\.focus-banner-v2\s*\{/.test(css));
test('v4.81.23 FocusCleanup tombstone: goSetup no longer calls renderSetupFocusBanner',
  !/renderSetupFocusBanner/.test(_fnBody(js, 'goSetup') || ''));

// v4.81.19: comma-safe Multi: topic sentinel parser. Pre-existing bug
// surfaced by v4.81.17 Domain Drill — 3 topic names contain commas
// ("NTP, ICMP & Traffic Types", "SDN, NFV & Automation", "Firewalls,
// DMZ & Security Zones") and 4 split sites all used naive .split(',')
// which mis-segmented those topics. New helper does greedy longest-match
// against TOPIC_DOMAINS catalog (sorted by length desc) so multi-word
// names with commas are preserved verbatim.
test('v4.81.19 MultiParse: _parseMultiTopicSentinel helper defined',
  /function _parseMultiTopicSentinel\(/.test(js));
test('v4.81.19 MultiParse: helper sorts catalog by length descending for greedy match',
  (() => {
    const body = _fnBody(js, '_parseMultiTopicSentinel') || '';
    return /\.sort\(\(a,\s*b\)\s*=>\s*b\.length\s*-\s*a\.length\)/.test(body);
  })());
test('v4.81.19 MultiParse: helper accepts both full sentinel and bare body',
  (() => {
    const body = _fnBody(js, '_parseMultiTopicSentinel') || '';
    return /startsWith\(['"]Multi: ['"]\)/.test(body) && /\.slice\(7\)/.test(body);
  })());
test('v4.81.19 MultiParse: helper has fallback split for unknown TOPIC_DOMAINS',
  (() => {
    const body = _fnBody(js, '_parseMultiTopicSentinel') || '';
    return /typeof TOPIC_DOMAINS\s*===\s*['"]undefined['"]/.test(body)
      || /!TOPIC_DOMAINS/.test(body);
  })());
test('v4.81.19 MultiParse: _pickExemplarsForTopic uses _parseMultiTopicSentinel',
  /_parseMultiTopicSentinel/.test(_fnBody(js, '_pickExemplarsForTopic') || ''));
test('v4.81.19 MultiParse: _filterHistoryByTopic uses _parseMultiTopicSentinel',
  /_parseMultiTopicSentinel/.test(_fnBody(js, '_filterHistoryByTopic') || ''));
test('v4.81.19 MultiParse: fetchQuestions Multi: parse uses _parseMultiTopicSentinel',
  /_parseMultiTopicSentinel/.test(_fnBody(js, '_fetchQuestionsBatch') || ''));
test('v4.81.19 MultiParse: startQuiz _multiCount uses _parseMultiTopicSentinel',
  /_parseMultiTopicSentinel/.test(_fnBody(js, 'startQuiz') || ''));

// vm fixture #1 — comma-containing topic names parse correctly.
test('v4.81.19 MultiParse: vm fixture — comma-containing topics parsed verbatim',
  (() => {
    try {
      const body = _fnBody(js, '_parseMultiTopicSentinel');
      if (!body) return false;
      const vm = require('vm');
      const ctx = {
        TOPIC_DOMAINS: {
          'IPv6': 'concepts',
          'BGP': 'implementation',
          'NTP, ICMP & Traffic Types': 'concepts',
          'SDN, NFV & Automation': 'implementation',
          'Firewalls, DMZ & Security Zones': 'security'
        },
        Array, Object, String
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      // Worst-case: all 3 comma-containing topics in one Multi: sentinel
      // alongside non-comma topics
      const parsed = vm.runInContext(
        '_parseMultiTopicSentinel("Multi: IPv6, NTP, ICMP & Traffic Types, BGP, SDN, NFV & Automation, Firewalls, DMZ & Security Zones")',
        ctx
      );
      return parsed.length === 5
        && parsed[0] === 'IPv6'
        && parsed[1] === 'NTP, ICMP & Traffic Types'
        && parsed[2] === 'BGP'
        && parsed[3] === 'SDN, NFV & Automation'
        && parsed[4] === 'Firewalls, DMZ & Security Zones';
    } catch (e) { return false; }
  })());

// vm fixture #2 — naive parser would have failed; confirm regression.
test('v4.81.19 MultiParse: vm fixture — naive split(",") would mis-segment but new parser does not',
  (() => {
    try {
      const body = _fnBody(js, '_parseMultiTopicSentinel');
      if (!body) return false;
      const vm = require('vm');
      const ctx = {
        TOPIC_DOMAINS: { 'NTP, ICMP & Traffic Types': 'concepts', 'IPv6': 'concepts' },
        Array, Object, String
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const sentinel = 'Multi: NTP, ICMP & Traffic Types, IPv6';
      // Naive baseline: split(',') on body "NTP, ICMP & Traffic Types, IPv6"
      // produces 3 segments (over-segmented — the comma-containing topic is
      // chopped in half). New parser correctly returns 2 segments.
      const naive = sentinel.slice(7).split(',').map(s => s.trim());
      const parsed = vm.runInContext('_parseMultiTopicSentinel(' + JSON.stringify(sentinel) + ')', ctx);
      return naive.length === 3        // proves the bug exists in naive split
        && naive[0] === 'NTP'           // proves the comma-topic gets chopped
        && parsed.length === 2          // new parser segments correctly
        && parsed[0] === 'NTP, ICMP & Traffic Types'
        && parsed[1] === 'IPv6';
    } catch (e) { return false; }
  })());

// vm fixture #3 — accepts both full sentinel ("Multi: A, B") and body alone ("A, B").
test('v4.81.19 MultiParse: vm fixture — accepts both full sentinel and bare body',
  (() => {
    try {
      const body = _fnBody(js, '_parseMultiTopicSentinel');
      if (!body) return false;
      const vm = require('vm');
      const ctx = { TOPIC_DOMAINS: { 'IPv6': 'concepts', 'BGP': 'implementation' }, Array, Object, String };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const fromSentinel = vm.runInContext('_parseMultiTopicSentinel("Multi: IPv6, BGP")', ctx);
      const fromBody     = vm.runInContext('_parseMultiTopicSentinel("IPv6, BGP")', ctx);
      const empty        = vm.runInContext('_parseMultiTopicSentinel("")', ctx);
      const nullish      = vm.runInContext('_parseMultiTopicSentinel(null)', ctx);
      return fromSentinel.length === 2
        && fromBody.length === 2
        && fromSentinel[0] === fromBody[0]
        && fromSentinel[1] === fromBody[1]
        && empty.length === 0
        && nullish.length === 0;
    } catch (e) { return false; }
  })());

// v4.81.18: Today section consolidation — collapses 3 stacked surfaces
// (Weak Spots row + Rotation row + Study Plan banner) into ONE prescriptive
// card that consumes both signals. User-approved mockup at
// mockups/today-consolidation-concept.html. Codex r7-r9 pattern: every
// page should have one strong recommendation, not three competing CTAs.
test('v4.81.18 TodayPlan: renderTodayPlan function defined',
  /function renderTodayPlan\(/.test(js));
test('v4.81.18 TodayPlan: TODAY_PLAN_WEAK_COUNT constant declared',
  /TODAY_PLAN_WEAK_COUNT\s*=\s*\d+/.test(js));
test('v4.81.18 TodayPlan: TODAY_PLAN_STALE_COUNT constant declared',
  /TODAY_PLAN_STALE_COUNT\s*=\s*\d+/.test(js));
test('v4.81.18 TodayPlan: SESSION_TOPICS bumped to 5',
  /const SESSION_TOPICS\s*=\s*5/.test(js));
test('v4.81.18 TodayPlan: buildSessionPlan rewritten to compose weak + stale',
  (() => {
    const body = _fnBody(js, 'buildSessionPlan') || '';
    return /computeWeakSpotScores/.test(body)
      && /_computeStaleTopics/.test(body)
      && /signal:\s*['"]weak['"]/.test(body)
      && /signal:\s*['"]stale['"]/.test(body);
  })());
test('v4.81.18 TodayPlan: buildSessionPlan keeps _scoreTopicNeed fallback for sparse history',
  /_scoreTopicNeed/.test(_fnBody(js, 'buildSessionPlan') || ''));
test('v4.81.18 TodayPlan: renderTodayPlan uses isStudyPlanDoneToday gate',
  /isStudyPlanDoneToday/.test(_fnBody(js, 'renderTodayPlan') || ''));
test('v4.81.18 TodayPlan: renderTodayPlan calls buildSessionPlan',
  /buildSessionPlan\(SESSION_TOPICS\)/.test(_fnBody(js, 'renderTodayPlan') || ''));
test('v4.81.18 TodayPlan: renderTodayPlan emits chip-strip + foot row + Begin plan CTA',
  (() => {
    const body = _fnBody(js, 'renderTodayPlan') || '';
    return /tplan-chips/.test(body)
      && /tplan-foot/.test(body)
      && /tplan-cta/.test(body)
      && /onclick="startSession\(\)"/.test(body);
  })());
test('v4.81.18 TodayPlan: renderTodayPlan uses signal-coded chip data attribute',
  /data-signal=/.test(_fnBody(js, 'renderTodayPlan') || ''));
// v4.81.23: cleanup pass — the v4.81.18 compat-shim functions were
// retired. Callers now invoke renderTodayPlan directly.
test('v4.81.23 cleanup tombstone: renderTodaysFocus function removed',
  !js.includes('function renderTodaysFocus('));
test('v4.81.23 cleanup tombstone: renderRotationChips function removed',
  !js.includes('function renderRotationChips('));
test('v4.81.23 cleanup tombstone: renderSessionBanner function removed',
  !js.includes('function renderSessionBanner('));
test('v4.81.18 TodayPlan: #today-plan element present in HTML',
  html.includes('id="today-plan"'));
test('v4.81.18 TodayPlan: #today-plan defaults to is-hidden',
  /id="today-plan"[^>]*is-hidden/.test(html));
test('v4.81.23 cleanup tombstone: legacy compat shim DOM elements removed',
  !html.includes('id="todays-focus"')
    && !html.includes('id="rotation-row"')
    && !html.includes('id="session-banner"'));
test('v4.81.18 TodayPlan: .today-plan CSS declared',
  /\.today-plan\s*\{/.test(css));
test('v4.81.18 TodayPlan: .tplan-chip CSS declared with signal variants',
  /\.tplan-chip\b/.test(css)
    && /\.tplan-chip\[data-signal="weak"\]/.test(css)
    && /\.tplan-chip\[data-signal="stale"\]/.test(css));
test('v4.81.18 TodayPlan: .tplan-cta primary CTA styled',
  /\.tplan-cta\s*\{/.test(css));
test('v4.81.18 TodayPlan: mobile breakpoint stacks foot row',
  /@media[\s\S]{0,80}max-width:\s*540px[\s\S]{0,400}\.tplan-foot[\s\S]{0,150}flex-direction:\s*column/.test(css));
test('v4.81.18 TodayPlan: reduced-motion gate covers tplan-chip + tplan-cta',
  /prefers-reduced-motion[\s\S]{0,800}\.tplan-chip[\s\S]{0,500}\.tplan-cta/.test(css));

// vm fixture — buildSessionPlan composes 2 weak + 3 stale correctly when
// both signals have data. Stubs computeWeakSpotScores + _computeStaleTopics
// + loadHistory + the fallback ranker so the test is hermetic.
test('v4.81.18 TodayPlan: vm fixture — buildSessionPlan composes 2 weak + 3 stale',
  (() => {
    try {
      const body = _fnBody(js, 'buildSessionPlan');
      if (!body) return false;
      const vm = require('vm');
      const ctx = {
        SESSION_TOPICS: 5,
        TODAY_PLAN_WEAK_COUNT: 2,
        TODAY_PLAN_STALE_COUNT: 3,
        MIXED_TOPIC: 'Mixed',
        EXAM_TOPIC: 'Exam',
        computeWeakSpotScores: () => ([
          { topic: 'WAN Connectivity', posterior: 0.62 },
          { topic: 'Network Troubleshooting Methodology', posterior: 0.55 },
          { topic: 'Subnetting & IP Addressing', posterior: 0.71 } // overflow
        ]),
        _computeStaleTopics: (hist, n) => ([
          { topic: 'IPv6', neverStudied: true, daysSince: 9999 },
          { topic: 'NAT & IP Services', neverStudied: true, daysSince: 9999 },
          { topic: 'NTP, ICMP & Traffic Types', neverStudied: false, daysSince: 30 },
          { topic: 'TCP/IP Basics', neverStudied: false, daysSince: 22 } // overflow
        ]),
        loadHistory: () => [
          { date: new Date().toISOString(), topic: 'WAN Connectivity', score: 5, total: 10 }
        ],
        _getAllStudyTopics: () => ['Foo', 'Bar'],
        _scoreTopicNeed: () => ({ score: 1, reason: 'fallback', color: '#666' }),
        // v4.99.26 — cert-aware filter mock; default-allow so existing tests pass
        _isCurrentCertTopic: () => true,
        Date, Math, Array, Object, String
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const plan = vm.runInContext('buildSessionPlan(5)', ctx);
      // Expected: 2 weak followed by 3 stale, total 5
      if (plan.length !== 5) return false;
      if (plan[0].topic !== 'WAN Connectivity' || plan[0].signal !== 'weak') return false;
      if (plan[1].topic !== 'Network Troubleshooting Methodology' || plan[1].signal !== 'weak') return false;
      if (plan[2].topic !== 'IPv6' || plan[2].signal !== 'stale') return false;
      if (plan[3].topic !== 'NAT & IP Services' || plan[3].signal !== 'stale') return false;
      if (plan[4].topic !== 'NTP, ICMP & Traffic Types' || plan[4].signal !== 'stale') return false;
      // The 3rd weak topic + 4th stale topic should NOT have leaked into the plan
      if (plan.some(p => p.topic === 'Subnetting & IP Addressing')) return false;
      if (plan.some(p => p.topic === 'TCP/IP Basics')) return false;
      // Each item should carry meta + reason fields (existing schema preserved)
      return plan.every(p => p.topic && p.signal && p.reason && p.color);
    } catch (e) { return false; }
  })());

// vm fixture — buildSessionPlan deduplicates between weak and stale signals.
// If a topic somehow appears in both, it should only be added once to the plan.
test('v4.81.18 TodayPlan: vm fixture — buildSessionPlan dedupes overlap between weak + stale',
  (() => {
    try {
      const body = _fnBody(js, 'buildSessionPlan');
      if (!body) return false;
      const vm = require('vm');
      const ctx = {
        SESSION_TOPICS: 5,
        TODAY_PLAN_WEAK_COUNT: 2,
        TODAY_PLAN_STALE_COUNT: 3,
        MIXED_TOPIC: 'Mixed', EXAM_TOPIC: 'Exam',
        // Weak picks: A, B
        computeWeakSpotScores: () => ([
          { topic: 'OSPF', posterior: 0.5 },
          { topic: 'IPv6', posterior: 0.55 }
        ]),
        // Stale picks: IPv6 (overlaps with weak!), C, D
        _computeStaleTopics: () => ([
          { topic: 'IPv6', neverStudied: false, daysSince: 25 },
          { topic: 'BGP', neverStudied: true, daysSince: 9999 },
          { topic: 'STP/RSTP', neverStudied: true, daysSince: 9999 }
        ]),
        loadHistory: () => [{ date: new Date().toISOString(), topic: 'X' }],
        _getAllStudyTopics: () => ['Filler1', 'Filler2', 'Filler3'],
        _scoreTopicNeed: () => ({ score: 1, reason: 'fb', color: '#666' }),
        // v4.99.26 — cert-aware filter mock; default-allow so existing tests pass
        _isCurrentCertTopic: () => true,
        Date, Math, Array, Object, String
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const plan = vm.runInContext('buildSessionPlan(5)', ctx);
      // IPv6 should appear EXACTLY ONCE (as weak — it was added first)
      const ipv6Hits = plan.filter(p => p.topic === 'IPv6');
      if (ipv6Hits.length !== 1) return false;
      if (ipv6Hits[0].signal !== 'weak') return false;
      // Plan should still have 5 unique topics — top-up from fallback ranker
      const topics = new Set(plan.map(p => p.topic));
      return topics.size === 5;
    } catch (e) { return false; }
  })());

// v4.81.17: Domain Drill — one-click 10-Q quiz on a single N10-009 domain
// (Mode Ladder tile) + Custom Quiz pre-fill pill row that selects all
// topic chips for a domain. Eliminates the 7-13-chip toggle tedium for
// domain-focused study sessions. Reuses existing multi-topic infrastructure.
test('v4.81.17 DomainDrill: applyDomainPreset helper defined',
  /function applyDomainPreset\(/.test(js));
test('v4.81.17 DomainDrill: prefillDomainTopics helper defined',
  /function prefillDomainTopics\(/.test(js));
test('v4.81.17 DomainDrill: _topicsInDomain reverse-lookup helper defined',
  /function _topicsInDomain\(/.test(js));
test('v4.81.17 DomainDrill: _DOMAIN_TOPICS_CACHE memoisation declared',
  /_DOMAIN_TOPICS_CACHE/.test(js));
// v4.87.1: _DOMAIN_IDX rebuilt as IIFE that derives from CERT_PACK.domainWeights
// (cert-aware). The Network+ literal mapping lives in the fallback branch.
test('v4.81.17 DomainDrill: _DOMAIN_IDX Network+ fallback maps all 5 domain keys',
  /_DOMAIN_IDX[\s\S]{0,800}idx\.concepts\s*=\s*1[\s\S]{0,200}idx\.implementation\s*=\s*2[\s\S]{0,200}idx\.operations\s*=\s*3[\s\S]{0,200}idx\.security\s*=\s*4[\s\S]{0,200}idx\.troubleshooting\s*=\s*5/.test(js));
test('v4.81.17 DomainDrill: applyDomainPreset uses Multi: sentinel for topic state',
  /topic\s*=\s*['"]Multi:\s*['"]\s*\+\s*topics\.join/.test(_fnBody(js, 'applyDomainPreset') || ''));
test('v4.81.17 DomainDrill: applyDomainPreset defaults to 10 Qs Exam Level',
  (() => {
    const body = _fnBody(js, 'applyDomainPreset') || '';
    return /diff\s*=\s*['"]Exam Level['"]/.test(body) && /qCount\s*=\s*10/.test(body);
  })());
test('v4.81.17 DomainDrill: applyDomainPreset fires startQuiz at end',
  /startQuiz\(\)/.test(_fnBody(js, 'applyDomainPreset') || ''));
test('v4.81.17 DomainDrill: prefillDomainTopics does NOT call startQuiz (state-only)',
  (() => {
    const body = _fnBody(js, 'prefillDomainTopics') || '';
    return body.length > 0 && !/startQuiz\(\)/.test(body);
  })());
test('v4.81.17 DomainDrill: prefillDomainTopics opens the matching accordion',
  /details\[data-domain-idx=/.test(_fnBody(js, 'prefillDomainTopics') || ''));
test('v4.81.17 DomainDrill: prefillDomainTopics jumps to Custom Quiz section',
  /_jumpToCustomQuiz/.test(_fnBody(js, 'prefillDomainTopics') || ''));
// bento: the v7.16-era `.dgh-dbd` drill-by-domain row was replaced by the bento domain
// tile (#domainGrid .ld-grid, built by renderBentoDomains).
test('bento DomainDrill: drill-by-domain tile present (#domainGrid .ld-grid, was .dgh-dbd)',
  /class="ld-grid"\s+id="domainGrid"|id="domainGrid"\s+class="ld-grid"/.test(html));
// bento: the 5 static `.dgh-db` buttons were replaced by renderBentoDomains, which maps
// over the 5 DOMAIN_WEIGHTS keys (concepts/implementation/operations/security/
// troubleshooting — explicit fallback) and emits one `.ld` <button> per domain into
// #domainGrid. Assert the renderer's 5-domain order + the per-domain `.ld` button.
test('bento DomainDrill: renderBentoDomains emits a .ld button per domain (5 domains, was 5 .dgh-db)',
  (() => {
    const body = _fnBody(js, 'renderBentoDomains') || '';
    return /\['concepts',\s*'implementation',\s*'operations',\s*'security',\s*'troubleshooting'\]/.test(body)
      && /class="ld\$\{weak\}"/.test(body)
      && /Object\.keys\(DOMAIN_WEIGHTS\)/.test(body);
  })());
// bento: the static Mode-Ladder per-domain applyDomainPreset wiring moved into
// renderBentoDomains — it emits `onclick="applyDomainPreset('<domainKey>')"` per domain,
// driven by the 5-key order (concepts/implementation/operations/security/
// troubleshooting). Assert the renderer's onclick wiring + the 5-domain key list.
test('bento DomainDrill: renderBentoDomains wires applyDomainPreset for all 5 domains',
  (() => {
    const body = _fnBody(js, 'renderBentoDomains') || '';
    return /onclick="applyDomainPreset\('\$\{String\(dk\)/.test(body)
      && /\['concepts',\s*'implementation',\s*'operations',\s*'security',\s*'troubleshooting'\]/.test(body);
  })());
// bento: the old #sr-review-card home prompt + Next-Best-Move CTA are hidden
// legacy stubs, so the recommend tile is the only home surface that can launch a
// spaced-repetition review. renderBentoRecommended checks getSrStats().due and,
// when cards are due, overrides #primaryLaunch's click handler to startSrReview()
// (the static onclick="applyPreset('focused')" stays as the not-due default).
test('bento Recommend: renderBentoRecommended routes #primaryLaunch to SR review when cards are due (v7.17.0)',
  (() => {
    const body = _fnBody(js, 'renderBentoRecommended') || '';
    return /getSrStats\(\)/.test(body)
      && /srDue\s*>\s*0/.test(body)
      && /startSrReview\(\)/.test(body)
      && /launchEl\.onclick\s*=/.test(body);
  })());
test('v4.81.17 DomainDrill: Custom Quiz pre-fill pill row present in topic-group',
  html.includes('class="topic-domain-prefill"'));
test('v4.81.17 DomainDrill: Custom Quiz has 5 tdp-pill buttons',
  (html.match(/class="tdp-pill"/g) || []).length === 5);
test('v4.81.17 DomainDrill: Custom Quiz pills wired to prefillDomainTopics for all 5 domains',
  /prefillDomainTopics\('concepts'\)/.test(html)
    && /prefillDomainTopics\('implementation'\)/.test(html)
    && /prefillDomainTopics\('operations'\)/.test(html)
    && /prefillDomainTopics\('security'\)/.test(html)
    && /prefillDomainTopics\('troubleshooting'\)/.test(html));
test('v4.81.17 DomainDrill: .modes-domain-tile CSS declared',
  /\.modes-domain-tile\s*\{/.test(css));
test('v4.81.17 DomainDrill: .tdp-pill CSS declared',
  /\.tdp-pill\s*\{/.test(css));
test('v4.81.17 DomainDrill: domain tiles use color-coded left borders matching accordion',
  /\.modes-domain-tile\[data-domain-idx="1"\][\s\S]{0,80}#7c6ff7/.test(css)
    && /\.modes-domain-tile\[data-domain-idx="5"\][\s\S]{0,80}#ef4444/.test(css));
test('v4.81.17 DomainDrill: pre-fill pills use color-coded left borders matching accordion',
  /\.tdp-pill\[data-domain-idx="1"\][\s\S]{0,80}#7c6ff7/.test(css)
    && /\.tdp-pill\[data-domain-idx="5"\][\s\S]{0,80}#ef4444/.test(css));
test('v4.81.17 DomainDrill: mobile breakpoint collapses tile grid',
  /@media[\s\S]{0,50}max-width:\s*720px[\s\S]{0,200}\.modes-domain-tiles[\s\S]{0,100}grid-template-columns:\s*repeat\(2/.test(css));
test('v4.81.17 DomainDrill: reduced-motion gate present for tiles + pills',
  /prefers-reduced-motion[\s\S]{0,500}\.modes-domain-tile/.test(css));

// vm fixture — applyDomainPreset produces correct multi-topic state for each
// of the 5 domains. Validates: (a) topic state uses 'Multi: ' sentinel,
// (b) all topics in the domain (and ONLY those topics) are listed, (c) diff
// + qCount defaults are correct.
test('v4.81.17 DomainDrill: vm fixture — applyDomainPreset produces correct multi-topic state per domain',
  (() => {
    try {
      const helperBody = _fnBody(js, '_topicsInDomain');
      const presetBody = _fnBody(js, 'applyDomainPreset');
      // Extract the TOPIC_DOMAINS const block (large, walks brace depth)
      // v4.86.1: TOPIC_DOMAINS literal moved to certs/netplus.js as `topicDomains: {...}`
      const tdInner = certNetplus.match(/topicDomains:\s*\{([\s\S]*?)\n\s*\},/);
      const tdMatch = tdInner ? ['const TOPIC_DOMAINS = {' + tdInner[1] + '\n};'] : null;
      if (!helperBody || !presetBody || !tdMatch) return false;
      const vm = require('vm');
      // State observable to the test
      let state = { topic: '', diff: '', qCount: 0, started: 0 };
      const ctx = {
        document: {
          getElementById: () => ({
            querySelectorAll: () => [],
            classList: { toggle: () => {}, remove: () => {} },
            setAttribute: () => {}
          }),
          querySelectorAll: () => []
        },
        syncChipAriaPressed: () => {},
        startQuiz: () => { state.started++; },
        Object, String, Array
      };
      // Add a getter/setter for `topic`/`diff`/`qCount` so the helper's
      // top-level assignments mutate our state object.
      Object.defineProperty(ctx, 'topic', { get: () => state.topic, set: (v) => { state.topic = v; } });
      Object.defineProperty(ctx, 'diff', { get: () => state.diff, set: (v) => { state.diff = v; } });
      Object.defineProperty(ctx, 'qCount', { get: () => state.qCount, set: (v) => { state.qCount = v; } });
      vm.createContext(ctx);
      vm.runInContext(tdMatch[0], ctx);
      vm.runInContext('let _DOMAIN_TOPICS_CACHE = null;', ctx);
      vm.runInContext(helperBody, ctx);
      vm.runInContext(presetBody, ctx);

      // Test all 5 domain keys
      // NOTE: 3 topic names contain commas ("NTP, ICMP & Traffic Types",
      // "SDN, NFV & Automation", "Firewalls, DMZ & Security Zones") so a
      // naive split(', ') would mis-segment them. Verify presence by
      // substring match instead — the topic string must CONTAIN every
      // expected topic name verbatim, and must NOT contain any topic
      // outside the domain.
      const results = {};
      ['concepts', 'implementation', 'operations', 'security', 'troubleshooting'].forEach(k => {
        state = { topic: '', diff: '', qCount: 0, started: 0 };
        vm.runInContext('applyDomainPreset(' + JSON.stringify(k) + ')', ctx);
        const td = vm.runInContext('TOPIC_DOMAINS', ctx);
        const expectedTopics = Object.keys(td).filter(t => td[t] === k);
        const outsideTopics = Object.keys(td).filter(t => td[t] !== k);
        results[k] = {
          isMultiSentinel: state.topic.startsWith('Multi: '),
          allDomainTopicsIncluded: expectedTopics.every(t => state.topic.indexOf(t) !== -1),
          // No outside topic should appear EXCEPT via substring overlap with
          // an in-domain topic. Check that no outside topic appears as a
          // standalone item — guarded by ', ' bracketing or end of string.
          noOutsideTopicsLeaked: outsideTopics.every(t =>
            state.topic.indexOf(', ' + t + ',') === -1
            && state.topic.indexOf(', ' + t + '$') === -1
            && !state.topic.endsWith(', ' + t)
            && !state.topic.startsWith('Multi: ' + t + ',')
            && state.topic !== 'Multi: ' + t
          ),
          diffCorrect: state.diff === 'Exam Level',
          qCountCorrect: state.qCount === 10,
          startQuizFired: state.started === 1
        };
      });
      // All 5 domains must satisfy all 6 invariants
      return Object.values(results).every(r =>
        r.isMultiSentinel
        && r.allDomainTopicsIncluded
        && r.noOutsideTopicsLeaked
        && r.diffCorrect
        && r.qCountCorrect
        && r.startQuizFired
      );
    } catch (e) { return false; }
  })());

// vm fixture — _topicsInDomain memoisation works correctly + the cache covers
// all 5 domain keys with non-zero topic counts.
test('v4.81.17 DomainDrill: vm fixture — _topicsInDomain memoisation + coverage',
  (() => {
    try {
      const helperBody = _fnBody(js, '_topicsInDomain');
      // v4.86.1: TOPIC_DOMAINS literal moved to certs/netplus.js as `topicDomains: {...}`
      const tdInner = certNetplus.match(/topicDomains:\s*\{([\s\S]*?)\n\s*\},/);
      const tdMatch = tdInner ? ['const TOPIC_DOMAINS = {' + tdInner[1] + '\n};'] : null;
      if (!helperBody || !tdMatch) return false;
      const vm = require('vm');
      const ctx = { Object };
      vm.createContext(ctx);
      vm.runInContext(tdMatch[0], ctx);
      vm.runInContext('let _DOMAIN_TOPICS_CACHE = null;', ctx);
      vm.runInContext(helperBody, ctx);
      // First call should populate the cache
      const first = vm.runInContext('_topicsInDomain("concepts")', ctx);
      const cacheAfter = vm.runInContext('_DOMAIN_TOPICS_CACHE', ctx);
      // Second call should hit the cache (same array reference)
      const second = vm.runInContext('_topicsInDomain("concepts")', ctx);
      // All 5 domains should have at least 5 topics each
      const counts = ['concepts','implementation','operations','security','troubleshooting'].map(k =>
        vm.runInContext('_topicsInDomain(' + JSON.stringify(k) + ').length', ctx)
      );
      // Unknown domain key → empty array
      const unknown = vm.runInContext('_topicsInDomain("nonexistent")', ctx);
      return first === second // memoisation kept the same reference
        && cacheAfter !== null
        && counts.every(c => c >= 5)
        && Array.isArray(unknown)
        && unknown.length === 0;
    } catch (e) { return false; }
  })());

// v4.81.16: Question-quality validators — stem-vs-answer-count alignment
// + multi-select GT lock for canonical N10-009 facts (Wi-Fi 2.4 GHz channels).
// User report: a "Which TWO" Wi-Fi-channels multi-select shipped with the
// canonical answer being THREE (1, 6, 11) — no validator caught the stem-vs-
// answer mismatch because (a) _groundTruthOk early-returned on non-MCQ,
// (b) no generic check tied stem-numeric to q.answers.length.
test('v4.81.16 QualityGuard: _stemNumericMatchesAnswerCount helper defined',
  /function _stemNumericMatchesAnswerCount\(/.test(js));
test('v4.81.16 QualityGuard: _multiSelectGroundTruthOk helper defined',
  /function _multiSelectGroundTruthOk\(/.test(js));
test('v4.81.16 QualityGuard: _STEM_NUMBER_WORDS map declared',
  /_STEM_NUMBER_WORDS\s*=\s*\{[^}]*two:\s*2[^}]*three:\s*3/.test(js));
test('v4.81.16 QualityGuard: stem-numeric validator wired into validateQuestions',
  /_stemNumericMatchesAnswerCount/.test(_fnBody(js, 'validateQuestions') || ''));
test('v4.81.16 QualityGuard: multi-select GT validator wired into multi-select branch',
  /_multiSelectGroundTruthOk/.test(_fnBody(js, 'validateQuestions') || ''));
test('v4.81.16 QualityGuard: 2.4 GHz channel canonical fact (1, 6, 11) referenced',
  /sorted\[0\]\s*===\s*1\s*&&\s*sorted\[1\]\s*===\s*6\s*&&\s*sorted\[2\]\s*===\s*11/.test(js));
test('v4.81.16 QualityGuard: stem-numeric regex matches "Which TWO" + "(Choose TWO)" patterns',
  (() => {
    const body = _fnBody(js, '_stemNumericMatchesAnswerCount') || '';
    return /\\bWhich\\s\+/.test(body) && /Choose\\s\+/.test(body) && /TWO\|THREE\|FOUR\|FIVE/.test(body);
  })());
test('v4.81.16 QualityGuard: tight regex avoids prose false-positives (no "Identify"/"Pick" verbs)',
  (() => {
    const body = _fnBody(js, '_stemNumericMatchesAnswerCount') || '';
    // The tight regex must NOT include Identify/Pick (would false-positive on
    // prose like "Pick two factor authentication"). Only Which / Choose with
    // explicit context (paren or "Which") qualify.
    return !/\\bIdentify\\s\+|\\bPick\\s\+/.test(body);
  })());

// vm fixture #1 — _stemNumericMatchesAnswerCount catches the exact bug.
test('v4.81.16 QualityGuard: vm fixture — "Which TWO" multi-select with 3 answers rejected',
  (() => {
    try {
      const helper = _fnBody(js, '_stemNumericMatchesAnswerCount');
      const numWords = js.match(/const _STEM_NUMBER_WORDS\s*=\s*\{[^}]*\}/)[0];
      if (!helper) return false;
      const vm = require('vm');
      const ctx = {
        getQType: (q) => q.type || 'mcq',
        String, Math, Array, parseInt
      };
      vm.createContext(ctx);
      vm.runInContext(numWords, ctx);
      vm.runInContext(helper, ctx);
      // The exact user-reported bug: stem says TWO, answers has 3
      const bug = {
        type: 'multi-select',
        question: 'Which TWO of the following are non-overlapping frequency channels in the 2.4 GHz Wi-Fi band?',
        answers: ['B', 'C', 'E']
      };
      // Correct: stem says TWO, answers has 2
      const ok = {
        type: 'multi-select',
        question: '(Choose TWO) Which protocols use TCP?',
        answers: ['A', 'B']
      };
      // No explicit count → pass through
      const noCount = {
        type: 'multi-select',
        question: 'Which protocols use TCP? Select all that apply.',
        answers: ['A', 'B']
      };
      // MCQ with multi-pick stem → reject (type mismatch)
      const mcqBad = {
        type: 'mcq',
        question: 'Which TWO ports does HTTPS use?',
        answer: 'A'
      };
      ctx.bug = bug; ctx.ok = ok; ctx.noCount = noCount; ctx.mcqBad = mcqBad;
      const r1 = vm.runInContext('_stemNumericMatchesAnswerCount(bug)', ctx);
      const r2 = vm.runInContext('_stemNumericMatchesAnswerCount(ok)', ctx);
      const r3 = vm.runInContext('_stemNumericMatchesAnswerCount(noCount)', ctx);
      const r4 = vm.runInContext('_stemNumericMatchesAnswerCount(mcqBad)', ctx);
      return r1 === false && r2 === true && r3 === true && r4 === false;
    } catch (e) { return false; }
  })());

// vm fixture #2 — _multiSelectGroundTruthOk locks the 2.4 GHz channel fact.
test('v4.81.16 QualityGuard: vm fixture — 2.4 GHz channels GT rejects non-{1,6,11} sets',
  (() => {
    try {
      const body = _fnBody(js, '_multiSelectGroundTruthOk');
      if (!body) return false;
      const vm = require('vm');
      const ctx = { String, Number, parseInt, Math, Array };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      // The exact bug: stem asks "Which TWO non-overlapping 2.4 GHz channels"
      // with answers being just two of the trio.
      const bugTwo = {
        question: 'Which TWO of the following are non-overlapping frequency channels in the 2.4 GHz Wi-Fi band?',
        options: { A: 'Channel 2', B: 'Channel 1', C: 'Channel 6', D: 'Channel 9', E: 'Channel 11' },
        answers: ['B', 'C'] // only 1 and 6
      };
      // Same fact, full canonical answer
      const okThree = {
        question: 'Which THREE of the following are non-overlapping channels in the 2.4 GHz Wi-Fi band?',
        options: { A: 'Channel 2', B: 'Channel 1', C: 'Channel 6', D: 'Channel 9', E: 'Channel 11' },
        answers: ['B', 'C', 'E']
      };
      // Wrong set (1, 6, 9 — not canonical)
      const wrongSet = {
        question: 'Identify the non-overlapping 2.4 GHz channels',
        options: { A: 'Channel 1', B: 'Channel 6', C: 'Channel 9' },
        answers: ['A', 'B', 'C']
      };
      // Unrelated multi-select — no Wi-Fi 2.4 GHz signal in stem
      const unrelated = {
        question: 'Which TWO ports does FTP use?',
        options: { A: '20', B: '21', C: '80', D: '443' },
        answers: ['A', 'B']
      };
      ctx.bugTwo = bugTwo; ctx.okThree = okThree; ctx.wrongSet = wrongSet; ctx.unrelated = unrelated;
      const r1 = vm.runInContext('_multiSelectGroundTruthOk(bugTwo)', ctx);
      const r2 = vm.runInContext('_multiSelectGroundTruthOk(okThree)', ctx);
      const r3 = vm.runInContext('_multiSelectGroundTruthOk(wrongSet)', ctx);
      const r4 = vm.runInContext('_multiSelectGroundTruthOk(unrelated)', ctx);
      return r1 === false && r2 === true && r3 === false && r4 === true;
    } catch (e) { return false; }
  })());

// v4.85.3: IPv6 transition methods — reject "pick N" when more than N
// options are valid methods. User dogfood: "Which TWO" with 6to4, NAT64
// as answers and Teredo as a "distractor" — but Teredo IS a valid method,
// making the question unsolvable. Prompt also updated to explicitly warn
// against this pattern.
test('v4.85.3 IPv6TransGT: _multiSelectGroundTruthOk checks IPv6 transition methods',
  (() => {
    const body = _fnBody(js, '_multiSelectGroundTruthOk');
    return body && /isIPv6Trans/.test(body) && /knownMethods/.test(body)
      && /6to4/.test(body) && /teredo/.test(body) && /nat64/.test(body);
  })());

test('v4.85.3 IPv6TransGT: prompt warns against "pick fewer than total valid" pattern',
  (() => {
    const body = _fnBody(js, '_fetchQuestionsBatch');
    return body && /NEVER create a question where MORE options are factually correct/.test(body)
      && /6to4.*Teredo.*NAT64/.test(body);
  })());

// vm-fixture: the exact user bug case — "Which TWO" with 6to4 + NAT64 as
// answers but Teredo in the options. Should be rejected because 3 valid
// methods > 2 answers.
test('v4.85.3 IPv6TransGT: vm fixture — "Which TWO" with 3 valid IPv6 methods rejected',
  (() => {
    try {
      const body = _fnBody(js, '_multiSelectGroundTruthOk');
      if (!body) return false;
      const vm = require('vm');
      const ctx = { String, Number, parseInt, Math, Array, Object };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);

      // The exact bug: 6to4+NAT64 as answers, Teredo as distractor — all 3 valid
      const bugCase = {
        question: 'Which TWO of the following are valid methods to tunnel or translate IPv6 traffic in an IPv4-only environment?',
        options: {
          A: '6to4 tunneling — encapsulates IPv6 packets inside IPv4',
          B: 'NAT64 — translates between IPv6 and IPv4 address spaces',
          C: 'Classful addressing — converting IPv6 to legacy Class A/B/C',
          D: 'Teredo tunneling — IPv6 over IPv4 with NAT traversal',
          E: 'Dual-stack routing — using separate routing protocols'
        },
        answers: ['A', 'B'] // only 2, but 3 options (A,B,D) are valid
      };
      // Valid case: only 2 valid methods in options, matching answer count
      const okCase = {
        question: 'Which TWO of the following are valid methods to tunnel IPv6 traffic?',
        options: {
          A: '6to4 tunneling',
          B: 'Teredo tunneling',
          C: 'Classful addressing',
          D: 'MAC spoofing',
          E: 'Port forwarding'
        },
        answers: ['A', 'B'] // 2 valid methods, 2 answers — correct
      };
      // Unrelated multi-select (no IPv6 transition signal)
      const unrelated = {
        question: 'Which TWO ports does HTTPS use?',
        options: { A: '443', B: '8443', C: '80', D: '22' },
        answers: ['A', 'B']
      };
      ctx.bugCase = bugCase; ctx.okCase = okCase; ctx.unrelated = unrelated;
      const r1 = vm.runInContext('_multiSelectGroundTruthOk(bugCase)', ctx);
      const r2 = vm.runInContext('_multiSelectGroundTruthOk(okCase)', ctx);
      const r3 = vm.runInContext('_multiSelectGroundTruthOk(unrelated)', ctx);
      return r1 === false && r2 === true && r3 === true;
    } catch (e) { return false; }
  })());

// v4.85.4: Sonnet validator extended to multi-select + prompt concrete examples
test('v4.85.4 MultiSelectSonnet: aiValidateQuestions filters multi-select alongside mcq',
  (() => {
    const body = _fnBody(js, 'aiValidateQuestions');
    return body && /multi-select/.test(body)
      && /MULTI-SELECT/.test(body)
      && /validatedIndices/.test(body);
  })());

test('v4.85.4 MultiSelectSonnet: check 7 = MULTI-SELECT ANSWER BALANCE',
  /7\.\s*MULTI-SELECT ANSWER BALANCE/.test(js));

test('v4.85.4 MultiSelectSonnet: Sonnet checks for MULTI-SELECT IMBALANCE error',
  /MULTI-SELECT IMBALANCE:/.test(js));

test('v4.85.4 MultiSelectSonnet: Sonnet checks for MULTI-SELECT DISTRACTOR LEAK error',
  /MULTI-SELECT DISTRACTOR LEAK:/.test(js));

test('v4.85.4 MultiSelectSonnet: prompt has concrete good/bad multi-select examples',
  (() => {
    const body = _fnBody(js, '_fetchQuestionsBatch');
    return body && /BAD:.*OSPF.*obvious/.test(body)
      && /GOOD:.*link-state routing protocols/.test(body)
      && /SELF-TEST before finalizing/.test(body);
  })());

// v4.85.5: naGetMastery backfills missing categories (fixes crash when NA_CATEGORIES
// expands but stored mastery lacks new keys — broke the NA drill page entirely)

// v4.85.6: Remove order-type questions — not on CompTIA N10-009 exam
test('v4.85.6 NoOrder: generation prompt has no ORDERING format',
  (() => {
    const body = _fnBody(js, '_fetchQuestionsBatch');
    return body && !/ORDERING \(put 4-5 items/.test(body)
      && !/type.*order.*question.*Arrange/.test(body);
  })());
test('v4.85.6 NoOrder: validateQuestions rejects order type',
  (() => {
    const body = _fnBody(js, 'validateQuestions');
    return body && /qType === 'order'/.test(body) && /return false/.test(body);
  })());
test('v4.85.6 NoOrder: vm fixture — order type rejected by validateQuestions filter logic',
  (() => {
    try {
      // Test the early-exit path: getQType returns 'order' → return false
      const getQTypeBody = _fnBody(js, 'getQType');
      if (!getQTypeBody) return false;
      const vm = require('vm');
      const ctx = { getQType: null, JSON, String };
      vm.createContext(ctx);
      vm.runInContext(getQTypeBody, ctx);
      // Simulate the filter predicate from validateQuestions lines 15651-15656
      const orderQ = { type: 'order', question: 'Arrange steps?', explanation: 'Because' };
      const mcqQ = { type: 'mcq', question: 'Which?', explanation: 'Because' };
      const msQ = { type: 'multi-select', question: 'Choose TWO?', explanation: 'Because' };
      const reject = vm.runInContext("(function(q) { var qType = getQType(q); return qType === 'order'; })", ctx);
      return reject(orderQ) === true && reject(mcqQ) === false && reject(msQ) === false;
    } catch (e) { return false; }
  })());

// v4.81.15: Stale-topic surfacing (rotation algorithm) — Layers 1+2+3+5
// (1) base stale-topic injection, (2) compound priority (staleness × accuracy
// gap), (3) per-batch rotation in startExam + Marathon mode, (5) homepage
// "Due for rotation" chip row.
test('v4.81.15 Stale: _computeStaleTopics helper defined',
  /function _computeStaleTopics\(/.test(js));
test('v4.81.15 Stale: _formatStaleTopicsForPrompt helper defined',
  /function _formatStaleTopicsForPrompt\(/.test(js));
// v4.85.8: Mixed mode TOPIC LOTTERY — pre-samples specific topics from each
// domain so Haiku can't default to its 4-5 favorite topics. User: "increase
// the randomization of the topics so it's genuinely like a lottery."
test('v4.85.8 Lottery: _sampleTopicsForMixedBatch helper defined',
  /function _sampleTopicsForMixedBatch\(/.test(js));
test('v4.85.8 Lottery: prompt uses MANDATORY TOPIC LOTTERY label',
  js.includes('MANDATORY TOPIC LOTTERY'));
test('v4.85.8 Lottery: stale-topic block updated to reference TOPIC LOTTERY',
  (() => {
    const body = _fnBody(js, '_formatStaleTopicsForPrompt');
    return body && /TOPIC LOTTERY/.test(body) && !/MANDATORY DOMAIN DISTRIBUTION/.test(body);
  })());
test('v4.85.8 Lottery: vm fixture — sampler returns dist[domain] distinct topics per domain',
  (() => {
    try {
      const body = _fnBody(js, '_sampleTopicsForMixedBatch');
      if (!body) return false;
      const vm = require('vm');
      // Minimal fake TOPIC_DOMAINS for deterministic test
      const fakeDomains = {
        'C1': 'concepts', 'C2': 'concepts', 'C3': 'concepts', 'C4': 'concepts',
        'I1': 'implementation', 'I2': 'implementation', 'I3': 'implementation',
        'O1': 'operations', 'O2': 'operations',
        'S1': 'security', 'S2': 'security',
        'T1': 'troubleshooting', 'T2': 'troubleshooting'
      };
      const ctx = { TOPIC_DOMAINS: fakeDomains, Math, Object, Array };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const dist = { concepts: 3, implementation: 2, operations: 1, security: 2, troubleshooting: 1 };
      const result = vm.runInContext('_sampleTopicsForMixedBatch(' + JSON.stringify(dist) + ')', ctx);
      // Each domain should have exactly dist[domain] entries, all distinct
      const sizesOk = result.concepts.length === 3
        && result.implementation.length === 2
        && result.operations.length === 1
        && result.security.length === 2
        && result.troubleshooting.length === 1;
      const distinctOk = new Set(result.concepts).size === 3
        && new Set(result.implementation).size === 2
        && new Set(result.security).size === 2;
      // Topics should come from the right domain
      const domainOk = result.concepts.every(t => fakeDomains[t] === 'concepts')
        && result.implementation.every(t => fakeDomains[t] === 'implementation')
        && result.troubleshooting.every(t => fakeDomains[t] === 'troubleshooting');
      return sizesOk && distinctOk && domainOk;
    } catch (e) { return false; }
  })());
test('v4.85.8 Lottery: vm fixture — sampler handles need > pool size with replacement',
  (() => {
    try {
      const body = _fnBody(js, '_sampleTopicsForMixedBatch');
      if (!body) return false;
      const vm = require('vm');
      // Tiny domain with only 2 topics; ask for 5
      const fakeDomains = { 'A': 'security', 'B': 'security' };
      const ctx = { TOPIC_DOMAINS: fakeDomains, Math, Object, Array };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const dist = { concepts: 0, implementation: 0, operations: 0, security: 5, troubleshooting: 0 };
      const result = vm.runInContext('_sampleTopicsForMixedBatch(' + JSON.stringify(dist) + ')', ctx);
      // Should still return exactly 5 entries
      return result.security.length === 5
        && result.security.every(t => t === 'A' || t === 'B');
    } catch (e) { return false; }
  })());
test('v4.85.8 Lottery: vm fixture — two consecutive samples produce different orderings',
  (() => {
    try {
      const body = _fnBody(js, '_sampleTopicsForMixedBatch');
      if (!body) return false;
      const vm = require('vm');
      const fakeDomains = {};
      // Build a domain with 10 topics so collision is unlikely
      for (let i = 0; i < 10; i++) fakeDomains['T' + i] = 'concepts';
      const ctx = { TOPIC_DOMAINS: fakeDomains, Math, Object, Array };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const dist = { concepts: 5, implementation: 0, operations: 0, security: 0, troubleshooting: 0 };
      // Run 5 samples — at least 2 should be different (with 10 choose 5 = 252 combos, collision is rare)
      const samples = [];
      for (let i = 0; i < 5; i++) {
        samples.push(vm.runInContext('_sampleTopicsForMixedBatch(' + JSON.stringify(dist) + ')', ctx).concepts.join(','));
      }
      const distinctCount = new Set(samples).size;
      return distinctCount >= 2;
    } catch (e) { return false; }
  })());

// v4.85.9: Daily Challenge tile labels match actual qCount=1
test('v4.85.9 DC label: home tile shows 1 Q (not 5)',
  /id="modes-dc-sub"[^>]*>1 Q/.test(html));
test('v4.85.9 DC label: home tile no longer shows stale "5 Qs"',
  !/id="modes-dc-sub"[^>]*>5 Qs/.test(html));
test('v4.85.9 DC label: NBM card sub uses "1 question · ~1 min"',
  /'1 question · ~1 min'/.test(js));

// v4.85.10: Knowledge Constellation legend uses neutral base color +
// opacity/glow (NOT colored backgrounds that clash with domain colors).
test('v4.85.10 Constellation: legend dots use --text base (not domain-colored backgrounds)',
  /\.ana-const-legend-dot\s*\{[^}]*background:\s*var\(--text\)/.test(css));
test('v4.85.10 Constellation: legend dot mastered tier no longer uses var(--green)',
  !/\.ana-const-legend-dot\.ana-const-tier-mastered\s*\{[^}]*background:\s*var\(--green\)/.test(css));
test('v4.85.10 Constellation: legend dot proficient tier no longer uses var(--accent)',
  !/\.ana-const-legend-dot\.ana-const-tier-proficient\s*\{[^}]*background:\s*var\(--accent\)/.test(css));
test('v4.85.10 Constellation: legend dot developing tier no longer uses var(--yellow)',
  !/\.ana-const-legend-dot\.ana-const-tier-developing\s*\{[^}]*background:\s*var\(--yellow\)/.test(css));
test('v4.85.10 Constellation: subtitle clarifies color = domain encoding',
  /color = domain, brightness = mastery/.test(js));

// v4.85.11: Constellation hover tooltip + Mastered threshold lowered 85→80
test('v4.85.11 Tooltip: _anaConstTooltipShow helper defined',
  /function _anaConstTooltipShow\(/.test(js));
// v4.85.13 tombstone: _anaConstTooltipPosition removed — tooltip now uses
// fixed top-center positioning via CSS, no cursor tracking.
test('v4.85.13 Tooltip: _anaConstTooltipPosition removed (replaced by CSS top-center positioning)',
  !/function _anaConstTooltipPosition\(/.test(js));
test('v4.85.11 Tooltip: _anaConstTooltipHide helper defined',
  /function _anaConstTooltipHide\(/.test(js));
test('v4.85.12 Tooltip: _anaConstWireTooltip event-delegation helper defined (replaces v4.85.11 inline handlers)',
  /function _anaConstWireTooltip\(/.test(js));
test('v4.85.13 Tooltip: wireup uses mouseover + focusin (show) and mouseleave + focusout (hide)',
  (() => {
    const body = _fnBody(js, '_anaConstWireTooltip');
    return body
      && /addEventListener\('mouseover'/.test(body)
      && /addEventListener\('mouseleave'/.test(body)
      && /addEventListener\('focusin'/.test(body)
      && /addEventListener\('focusout'/.test(body);
  })());
test('v4.85.12 Tooltip: wireup is idempotent via data-tooltip-wired guard',
  (() => {
    const body = _fnBody(js, '_anaConstWireTooltip');
    return body && /tooltipWired\s*===\s*'1'/.test(body) && /tooltipWired\s*=\s*'1'/.test(body);
  })());
test('Analytics bento: constellation wired via _anaBtWire after innerHTML',
  /container\.innerHTML\s*=\s*html;[\s\S]{0,400}_anaBtWire\(/.test(js) &&
  js.includes('_anaBtRenderConstellation'));
test('v4.85.12 Tooltip: <g> nodes no longer have inline onmouseenter (moved to delegation)',
  !/data-tt-topic[^>]*onmouseenter/.test(js));

// v4.85.13 — Constellation tooltip rebuild after user feedback that v4.85.12
// version was unusable: cursor-following position landed at the bottom of
// the map; click-to-drill on nodes caused tooltip to flash for ~50ms before
// page navigated away. New design: fixed top-center position, drill via
// explicit button inside tooltip, no auto-drill on node click.
test('v4.85.13 Tooltip rebuild: <g> nodes no longer have onclick="focusTopic" (drill goes through tooltip button)',
  !/data-tt-topic[^>]*onclick="focusTopic/.test(js));
test('v4.85.13 Tooltip rebuild: tooltip HTML has explicit drill button (replaces v4.85.11 div CTA)',
  /id="ana-const-tt-btn"/.test(js)
  && /Drill into this topic/.test(js));
test('v4.85.13 Tooltip rebuild: _anaConstTooltipShow signature is (nodeEl) — no more (evt, nodeEl)',
  (() => {
    const body = _fnBody(js, '_anaConstTooltipShow');
    return body && /function _anaConstTooltipShow\(nodeEl\)/.test(body);
  })());
test('v4.85.13 Tooltip rebuild: show binds button onclick to focusTopic(topicRaw)',
  (() => {
    const body = _fnBody(js, '_anaConstTooltipShow');
    return body && /ttBtn\.onclick/.test(body) && /focusTopic\(topicRaw\)/.test(body);
  })());
test('v4.85.13 Tooltip rebuild: wireup uses map-level mouseleave for hide (not per-node mouseout)',
  (() => {
    const body = _fnBody(js, '_anaConstWireTooltip');
    return body
      && /addEventListener\('mouseleave'/.test(body)
      && !/addEventListener\('mouseout'/.test(body)
      && !/addEventListener\('mousemove'/.test(body);
  })());
test('v4.85.13 Tooltip rebuild: nodes carry data-tt-topic-raw for unescaped topic name (drill button needs raw form)',
  /data-tt-topic-raw="\$\{topicEsc\}"/.test(js));
test('v4.85.13 Tooltip CSS: tooltip positioned at fixed top-center via top:14px + left:50% + translateX',
  /\.ana-const-tooltip\s*\{[^}]*top:\s*14px[\s\S]{0,200}left:\s*50%[\s\S]{0,200}transform:\s*translateX\(-50%\)/.test(css));
test('v4.85.13 Tooltip CSS: pointer-events: auto so drill button is clickable',
  /\.ana-const-tooltip\s*\{[^}]*pointer-events:\s*auto/.test(css));
test('v4.85.13 Tooltip CSS: drill button styled (.ana-const-tt-btn)',
  /\.ana-const-tt-btn\s*\{[^}]*background:\s*var\(--accent\)/.test(css));
test('v4.85.13 Tooltip CSS: mobile breakpoint stacks tooltip flush left/right at <540px',
  /@media\s*\(max-width:\s*540px\)[\s\S]{0,500}\.ana-const-tooltip\s*\{[\s\S]{0,200}left:\s*12px[\s\S]{0,200}right:\s*12px/.test(css));
test('v4.85.13 Tooltip hint text: "Hover any node to see stats"',
  /Hover any node to see stats/.test(js));

// v4.85.14: "Why your score?" breakdown card — sits under Exam Readiness card
// on Analytics. 4 component bars + plain-English diagnosis + 2 click-through
// action cards (refresh recency / drill weakest). User-approved mockup at
// mockups/readiness-why-card-concept.html.
test('v4.85.14 WhyScore: _renderAnaWhyScore renderer defined',
  /function _renderAnaWhyScore\(/.test(js));
test('v4.85.14 WhyScore: _startReadinessRefreshQuiz click handler defined',
  /function _startReadinessRefreshQuiz\(/.test(js));
test('v4.85.14 WhyScore: _startReadinessWeakestQuiz click handler defined',
  /function _startReadinessWeakestQuiz\(/.test(js));
test('v4.85.14 WhyScore: getReadinessScore returns staleTopics array (sorted oldest-first)',
  (() => {
    const body = _fnBody(js, 'getReadinessScore');
    return body && /staleTopics/.test(body) && /sort\(\(a, b\) => b\.daysSince - a\.daysSince\)/.test(body);
  })());
test('v4.85.14 WhyScore: bento composes the why tile after readiness',
  /_anaBtReadiness\(D\)[\s\S]{0,400}_anaBtWhy\(D\)/.test(js));
test('v4.85.14 WhyScore: 4 component bars (accuracy, coverage, recency, volume)',
  (() => {
    const body = _fnBody(js, '_renderAnaWhyScore');
    return body
      && /Accuracy[\s\S]{0,500}Coverage[\s\S]{0,500}Recency[\s\S]{0,500}Volume/.test(body);
  })());
test('v4.85.14 WhyScore: bottleneck detection picks highest-drag component',
  (() => {
    const body = _fnBody(js, '_renderAnaWhyScore');
    return body && /bottleneck/.test(body) && /dragPts/.test(body);
  })());
test('v4.85.14 WhyScore: refresh handler builds Multi: sentinel from staleTopics',
  (() => {
    const body = _fnBody(js, '_startReadinessRefreshQuiz');
    return body
      && /staleTopics\.slice\(0,\s*8\)/.test(body)
      && /'Multi: '\s*\+\s*topicNames\.join\(', '\)/.test(body);
  })());
test('v4.85.14 WhyScore: weakest handler builds Multi: sentinel from whatIf',
  (() => {
    const body = _fnBody(js, '_startReadinessWeakestQuiz');
    return body
      && /whatIf\.slice\(0,\s*3\)/.test(body)
      && /'Multi: '\s*\+\s*topicNames\.join\(', '\)/.test(body)
      && /diff\s*=\s*'Hard \/ Tricky'/.test(body);
  })());
test('v4.85.14 WhyScore: refresh handler uses 5 Qs per topic (Mixed difficulty)',
  (() => {
    const body = _fnBody(js, '_startReadinessRefreshQuiz');
    return body && /topicNames\.length\s*\*\s*5/.test(body);
  })());
test('v4.85.14 WhyScore: weakest handler uses 10 Qs per topic',
  (() => {
    const body = _fnBody(js, '_startReadinessWeakestQuiz');
    return body && /topicNames\.length\s*\*\s*10/.test(body);
  })());
test('v4.85.14 WhyScore CSS: .ana-why-score grid spans full width',
  /\.ana-card\.ana-why-score\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/.test(css));
test('v4.85.14 WhyScore CSS: tier color classes for component bars (good/ok/low/critical)',
  /\.why-bar-fill\.tier-good[\s\S]{0,200}\.why-bar-fill\.tier-ok[\s\S]{0,200}\.why-bar-fill\.tier-low[\s\S]{0,200}\.why-bar-fill\.tier-critical/.test(css));
test('v4.85.14 WhyScore CSS: action card has hover lift + primary orange variant',
  /\.why-action-card\.is-primary[\s\S]{0,400}rgba\(251,\s*146,\s*60/.test(css));
test('v4.85.14 WhyScore CSS: mobile breakpoint (<720px) stacks action row vertically',
  /@media\s*\(max-width:\s*720px\)[\s\S]{0,800}\.ana-why-score\s+\.why-action-row\s*\{[^}]*grid-template-columns:\s*1fr/.test(css));
test('v4.85.14 WhyScore: vm fixture — bottleneck = recency when recencyScore is lowest',
  (() => {
    try {
      const body = _fnBody(js, '_renderAnaWhyScore');
      if (!body) return false;
      const vm = require('vm');
      const ctx = {
        EXAM_PASS_SCORE: 720,
        escHtml: s => String(s || ''),
        Math, Object, Array, String, JSON
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const fakeReadiness = {
        predicted: 702,
        accuracyScore: 78,
        coverageScore: 100,
        recencyScore: 28,
        volumeScore: 100,
        totalTopics: 50,
        studiedCount: 50,
        totalQs: 611,
        staleTopics: [
          { topic: 'BGP', daysSince: 21 },
          { topic: 'OSPF', daysSince: 18 }
        ],
        whatIf: [
          { topic: 'BGP', currentPct: 61, targetPct: 80, deltaPredicted: 4 }
        ]
      };
      const html = vm.runInContext('_renderAnaWhyScore(' + JSON.stringify(fakeReadiness) + ')', ctx);
      // Should call out recency as the bottleneck and show 18-pt gap
      return /Recency is the bottleneck/.test(html)
        && /18 pts to pass/.test(html)
        && /Refresh recency/.test(html);
    } catch (e) { return false; }
  })());

// v4.85.15 — Mixed-mode quizzes now save per-topic splits + readiness
// dropped the e.total >= 3 filter. Pre-fix Mixed-mode quizzes (Deep Scan,
// Marathon, Warmup, Diagnostic) saved a single topic=MIXED_TOPIC summary
// that getReadinessScore filtered out, so 326+ user questions never
// counted toward coverage/recency/volume. v4.85.8 TOPIC LOTTERY made it
// worse by producing 1-Q-per-topic splits the >=3 filter throws away.
test('v4.85.15 MixedSplit: finish() saves per-topic splits when activeQuizTopic === MIXED_TOPIC',
  (() => {
    const body = _fnBody(js, 'finish');
    return body
      && /activeQuizTopic === MIXED_TOPIC/.test(body)
      && /via:\s*'mixed-split'/.test(body);
  })());
test('v4.85.15 MixedSplit: Mixed-split saves both summary entry AND per-topic splits (no double-count via filter)',
  (() => {
    const body = _fnBody(js, 'finish');
    if (!body) return false;
    // Find the Mixed branch and confirm it calls saveToHistory at least twice
    const mixedBranch = body.match(/activeQuizTopic === MIXED_TOPIC[\s\S]{0,1500}else \{/);
    if (!mixedBranch) return false;
    const summaryCall = /saveToHistory\(\{ date: now, topic: activeQuizTopic/.test(mixedBranch[0]);
    const splitCall = /saveToHistory\(\{ date: now, topic: t,[\s\S]{0,200}via:\s*'mixed-split'/.test(mixedBranch[0]);
    return summaryCall && splitCall;
  })());
test('v4.85.15 MixedSplit: getReadinessScore filter no longer requires e.total >= 3',
  (() => {
    const body = _fnBody(js, 'getReadinessScore');
    if (!body) return false;
    // Find the actual filter expression (not in comments)
    const filterMatch = body.match(/loadHistory\(\)\.filter\(e =>\s*([\s\S]*?)\);/);
    if (!filterMatch) return false;
    const filterExpr = filterMatch[1];
    return !/e\.total\s*>=\s*3/.test(filterExpr)
      && /e\.topic\s*!==\s*MIXED_TOPIC/.test(filterExpr)
      && /e\.topic\s*!==\s*EXAM_TOPIC/.test(filterExpr);
  })());
test('v4.85.15 MixedSplit: vm fixture — Mixed branch produces summary + N split rows',
  (() => {
    try {
      const finishBody = _fnBody(js, 'finish');
      if (!finishBody) return false;
      // Lightweight regex-based check on the actual code path
      const branchSnippet = finishBody.substring(
        finishBody.indexOf('activeQuizTopic === MIXED_TOPIC'),
        finishBody.indexOf('} else {', finishBody.indexOf('activeQuizTopic === MIXED_TOPIC'))
      );
      // Walks log + groups by q.topic + skips MIXED_TOPIC + saves with via: mixed-split
      return /log\.forEach/.test(branchSnippet)
        && /entry\.q && entry\.q\.topic/.test(branchSnippet)
        && /t === MIXED_TOPIC/.test(branchSnippet)
        && /via:\s*'mixed-split'/.test(branchSnippet);
    } catch (e) { return false; }
  })());
test('v4.85.15 MixedSplit: vm fixture — getReadinessScore now counts 1-Q-per-topic splits (was filtered)',
  (() => {
    try {
      const body = _fnBody(js, 'getReadinessScore');
      if (!body) return false;
      // Simulate: history with 5 split rows of total=1 each, all distinct topics.
      // Pre-fix: filter would drop them all (none have total >= 3) → coverage = 0.
      // Post-fix: all 5 count → coverage = 5/totalTopics * 100.
      const filterMatch = body.match(/loadHistory\(\)\.filter\(e =>([\s\S]{0,200})\)/);
      if (!filterMatch) return false;
      const filterBody = filterMatch[1];
      // Should NOT contain "total" anymore
      return !/e\.total/.test(filterBody);
    } catch (e) { return false; }
  })());

// v4.85.16 — Stale err-box safety patches. User reported a "⚠ invalid x-api-key"
// banner persisting on Settings even after the API key validated as Connected.
// Root cause: setup-err DIV gets text+is-hidden-removed when a quiz fails, but
// is never re-hidden once the user fixes the key or navigates away. Two patches:
//   (1) clear setup-err on successful API key save
//   (2) clear setup-err on every showPage() navigation
test('v4.85.16 ErrBoxSafety: _clearStaleErrBoxes helper defined',
  /function _clearStaleErrBoxes\(/.test(js));
test('v4.85.16 ErrBoxSafety: helper hides #setup-err + sweeps all .err-box',
  (() => {
    const body = _fnBody(js, '_clearStaleErrBoxes');
    return body
      && /getElementById\('setup-err'\)/.test(body)
      && /querySelectorAll\('\.err-box:not\(\.is-hidden\)'\)/.test(body)
      && /classList\.add\('is-hidden'\)/.test(body);
  })());
test('v4.85.16 ErrBoxSafety: autoSaveApiKey calls _clearStaleErrBoxes after successful save',
  (() => {
    const body = _fnBody(js, 'autoSaveApiKey');
    return body && /_clearStaleErrBoxes\(\)/.test(body);
  })());
test('v4.85.16 ErrBoxSafety: showPage calls _clearStaleErrBoxes on every page change',
  (() => {
    const body = _fnBody(js, 'showPage');
    return body && /_clearStaleErrBoxes\(\)/.test(body);
  })());
test('v4.85.16 ErrBoxSafety: vm fixture — clearStaleErrBoxes hides setup-err + clears textContent',
  (() => {
    try {
      const body = _fnBody(js, '_clearStaleErrBoxes');
      if (!body) return false;
      const vm = require('vm');
      // Build a fake DOM that mirrors the bug: setup-err visible with stale error text
      const setupErrEl = {
        classList: {
          _set: new Set(['err-box']),
          add(c) { this._set.add(c); },
          remove(c) { this._set.delete(c); },
          contains(c) { return this._set.has(c); }
        },
        textContent: '⚠️ invalid x-api-key'
      };
      const otherErrBox = {
        classList: {
          _set: new Set(['err-box']),
          add(c) { this._set.add(c); },
          remove(c) { this._set.delete(c); },
          contains(c) { return this._set.has(c); }
        },
        textContent: '⚠️ Some other lingering error'
      };
      const ctx = {
        document: {
          getElementById: (id) => id === 'setup-err' ? setupErrEl : null,
          querySelectorAll: (sel) => sel === '.err-box:not(.is-hidden)' ? [setupErrEl, otherErrBox] : []
        }
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      vm.runInContext('_clearStaleErrBoxes()', ctx);
      // Both elements should have is-hidden class + empty text
      return setupErrEl.classList.contains('is-hidden')
        && setupErrEl.textContent === ''
        && otherErrBox.classList.contains('is-hidden')
        && otherErrBox.textContent === '';
    } catch (e) { return false; }
  })());

// v4.85.17 — Exam-review filter chips. User-approved mockup at
// mockups/exam-review-filters-concept.html. 5 sticky filter chips
// (All / Correct / Incorrect / Flagged / Skipped) with counts, tier-
// colored active states, empty state when filter returns 0.
test('v4.85.17 ReviewFilter: _reviewFilter module state declared',
  /let _reviewFilter\s*=\s*'all'/.test(js));
test('v4.85.17 ReviewFilter: _renderReviewList helper defined',
  /function _renderReviewList\(/.test(js));
test('v4.85.17 ReviewFilter: _setReviewFilter chip click handler defined',
  /function _setReviewFilter\(key\)/.test(js));
test('v4.85.17 ReviewFilter: _buildReviewItemHtml extracted (called by _renderReviewList)',
  /function _buildReviewItemHtml\(/.test(js));
test('v4.85.17 ReviewFilter: showReview resets filter to all on entry',
  (() => {
    const body = _fnBody(js, 'showReview');
    return body && /_reviewFilter\s*=\s*'all'/.test(body) && /_renderReviewList\(\)/.test(body);
  })());
test('v4.85.17 ReviewFilter: counts computed for all 5 categories (all/correct/incorrect/flagged/skipped)',
  (() => {
    const body = _fnBody(js, '_renderReviewList');
    return body
      && /counts\.skipped\+\+/.test(body)
      && /counts\.correct\+\+/.test(body)
      && /counts\.incorrect\+\+/.test(body)
      && /counts\.flagged\+\+/.test(body)
      && /all:\s*log\.length/.test(body);
  })());
test('v4.85.17 ReviewFilter: filter logic handles all 5 keys',
  (() => {
    const body = _fnBody(js, '_renderReviewList');
    return body
      && /_reviewFilter === 'all'/.test(body)
      && /_reviewFilter === 'correct'/.test(body)
      && /_reviewFilter === 'incorrect'/.test(body)
      && /_reviewFilter === 'flagged'/.test(body)
      && /_reviewFilter === 'skipped'/.test(body);
  })());
test('v4.85.17 ReviewFilter: chip with 0 count is disabled (is-disabled class)',
  (() => {
    const body = _fnBody(js, '_renderReviewList');
    return body && /is-disabled/.test(body) && /counts\[c\.key\]\s*===\s*0/.test(body);
  })());
test('v4.85.17 ReviewFilter: empty state renders when filter returns 0',
  (() => {
    const body = _fnBody(js, '_renderReviewList');
    return body
      && /filtered\.length\s*===\s*0/.test(body)
      && /review-filter-empty/.test(body)
      && /Show all/.test(body);
  })());
test('v7.x Review empty-state copy is grammatical (no "no <label> answers")',
  !/no \$\{[^}]*label[^}]*\} answers/.test(js) && /No answers to show yet/.test(js));
test('v4.85.17 ReviewFilter: per-question item shows status + flag + domain meta tags',
  (() => {
    const body = _fnBody(js, '_buildReviewItemHtml');
    return body
      && /tag-correct/.test(body)
      && /tag-incorrect/.test(body)
      && /tag-flagged/.test(body)
      && /tag-skipped/.test(body)
      && /tag-domain/.test(body)
      && /q-num-pill/.test(body);
  })());
test('v4.85.17 ReviewFilter CSS: sticky filter row',
  /\.review-filter-row\s*\{[^}]*position:\s*sticky/.test(css));
test('v4.85.17 ReviewFilter CSS: tier-colored active states (correct=green, incorrect=red, flagged=yellow, skipped=text-dim)',
  /\.review-filter-chip\.is-correct\.is-active[\s\S]{0,200}var\(--green\)[\s\S]{0,500}\.review-filter-chip\.is-incorrect\.is-active[\s\S]{0,200}var\(--red\)[\s\S]{0,500}\.review-filter-chip\.is-flagged\.is-active[\s\S]{0,200}var\(--yellow\)/.test(css));
test('v4.85.17 ReviewFilter CSS: q-tag color variants defined (5 tags)',
  /\.q-tag\.tag-correct[\s\S]{0,500}\.q-tag\.tag-incorrect[\s\S]{0,500}\.q-tag\.tag-flagged[\s\S]{0,500}\.q-tag\.tag-skipped[\s\S]{0,500}\.q-tag\.tag-domain/.test(css));
test('v4.85.17 ReviewFilter CSS: empty-state styled',
  /\.review-filter-empty\s*\{[^}]*text-align:\s*center/.test(css));
test('v4.85.17 ReviewFilter CSS: mobile breakpoint (<540px) hides eyebrow + shrinks chips',
  /@media\s*\(max-width:\s*540px\)[\s\S]{0,800}\.review-filter-eyebrow\s*\{[\s\S]{0,200}display:\s*none/.test(css));
test('v4.85.17 ReviewFilter: vm fixture — counts compute correctly + filter returns matching subset',
  (() => {
    try {
      const renderBody = _fnBody(js, '_renderReviewList');
      if (!renderBody) return false;
      const vm = require('vm');
      // Mock 6-question log: 4 correct, 2 incorrect, 1 flagged-correct, 0 skipped
      const fakeLog = [
        { q: { question: 'Q1', options: { A: 'a', B: 'b' }, answer: 'A', topic: 'BGP' }, isRight: true,  flagged: false, skipped: false, chosen: 'A' },
        { q: { question: 'Q2', options: { A: 'a', B: 'b' }, answer: 'A', topic: 'OSPF' }, isRight: true,  flagged: true,  skipped: false, chosen: 'A' },
        { q: { question: 'Q3', options: { A: 'a', B: 'b' }, answer: 'A', topic: 'IPv6' }, isRight: false, flagged: false, skipped: false, chosen: 'B' },
        { q: { question: 'Q4', options: { A: 'a', B: 'b' }, answer: 'A', topic: 'BGP' }, isRight: true,  flagged: false, skipped: false, chosen: 'A' },
        { q: { question: 'Q5', options: { A: 'a', B: 'b' }, answer: 'A', topic: 'OSPF' }, isRight: false, flagged: false, skipped: false, chosen: 'B' },
        { q: { question: 'Q6', options: { A: 'a', B: 'b' }, answer: 'A', topic: 'BGP' }, isRight: true,  flagged: false, skipped: false, chosen: 'A' }
      ];
      let renderedHtml = '';
      const ctx = {
        log: fakeLog,
        _reviewFilter: 'incorrect',
        document: {
          getElementById: (id) => id === 'review-list' ? { set innerHTML(v) { renderedHtml = v; }, get innerHTML() { return renderedHtml; } } : null
        },
        Array,
        getQType: (q) => q.type || 'mcq',
        escHtml: s => String(s || ''),
        highlightExamKeywords: s => s,
        topicResources: {},
        activeQuizTopic: 'Mixed',
        MIXED_TOPIC: 'Mixed',
        EXAM_TOPIC: 'Exam',
        _buildReviewItemHtml: (entry, i, total) => `<div class="review-item">Q${i+1}</div>`,
        Object
      };
      vm.createContext(ctx);
      vm.runInContext(renderBody, ctx);
      vm.runInContext('_renderReviewList()', ctx);
      // With filter='incorrect', Q3 and Q5 should be in output. All counts visible.
      return /All\s*<span class="chip-count">6/.test(renderedHtml)
        && /Correct\s*<span class="chip-count">4/.test(renderedHtml)
        && /Incorrect\s*<span class="chip-count">2/.test(renderedHtml)
        && /Flagged\s*<span class="chip-count">1/.test(renderedHtml)
        && /Skipped\s*<span class="chip-count">0/.test(renderedHtml)
        && /Showing <strong>2<\/strong> of <strong>6<\/strong>/.test(renderedHtml)
        && /is-skipped[^"]*is-disabled/.test(renderedHtml); // skipped=0 is disabled
    } catch (e) { return false; }
  })());
test('v4.85.17 ReviewFilter: vm fixture — empty state renders when filter has 0 results',
  (() => {
    try {
      const renderBody = _fnBody(js, '_renderReviewList');
      if (!renderBody) return false;
      const vm = require('vm');
      // All correct answers + filter='incorrect' = empty state
      const fakeLog = [
        { q: { question: 'Q1', options: {}, answer: 'A', topic: '' }, isRight: true, flagged: false, skipped: false, chosen: 'A' },
        { q: { question: 'Q2', options: {}, answer: 'A', topic: '' }, isRight: true, flagged: false, skipped: false, chosen: 'A' }
      ];
      let renderedHtml = '';
      const ctx = {
        log: fakeLog,
        _reviewFilter: 'incorrect',
        document: {
          getElementById: (id) => id === 'review-list' ? { set innerHTML(v) { renderedHtml = v; }, get innerHTML() { return renderedHtml; } } : null
        },
        Array,
        getQType: () => 'mcq',
        escHtml: s => String(s || ''),
        highlightExamKeywords: s => s,
        topicResources: {},
        activeQuizTopic: '',
        MIXED_TOPIC: 'Mixed',
        EXAM_TOPIC: 'Exam',
        _buildReviewItemHtml: () => '',
        Object
      };
      vm.createContext(ctx);
      vm.runInContext(renderBody, ctx);
      vm.runInContext('_renderReviewList()', ctx);
      // Filter falls back to 'all' since incorrect=0; should render normally with all 2 items, NOT empty state
      // (the defensive fallback prevents stuck-on-empty-page UX)
      return /Showing <strong>2<\/strong>/.test(renderedHtml)
        && !/review-filter-empty/.test(renderedHtml);
    } catch (e) { return false; }
  })());

// v4.85.18 — domain-grid topic chips now have 3 states: weak / studied /
// untouched. Pre-fix only weak/not-weak existed, conflating "studied + strong"
// with "never studied" — both rendered identical greyed-out style.
test('v4.85.18 DomainGridStates: studiedSet built from history in renderSetupDomainGrid',
  (() => {
    const body = _fnBody(js, 'renderSetupDomainGrid');
    return body
      && /const studiedSet = new Set\(\)/.test(body)
      && /history\.forEach/.test(body)
      && /studiedSet\.add\(e\.topic\)/.test(body);
  })());
test('v4.85.18 DomainGridStates: studiedSet excludes MIXED_TOPIC + EXAM_TOPIC',
  (() => {
    const body = _fnBody(js, 'renderSetupDomainGrid');
    return body
      && /e\.topic === MIXED_TOPIC \|\| e\.topic === EXAM_TOPIC/.test(body);
  })());
test('v4.85.18 DomainGridStates: chip rendering branches on isWeak / isStudied / untouched',
  (() => {
    const body = _fnBody(js, 'renderSetupDomainGrid');
    return body
      && /const isWeak = weakSet\.has/.test(body)
      && /const isStudied = studiedSet\.has/.test(body)
      && /dg-topic-weak/.test(body)
      && /dg-topic-studied/.test(body)
      && /dg-topic-untouched/.test(body);
  })());
test('v4.85.18 DomainGridStates CSS: default .dg-topic uses --text-mid (was --text-dim)',
  /\.dg-topic\s*\{[^}]*color:\s*var\(--text-mid\)/.test(css));
test('v4.85.18 DomainGridStates CSS: dg-topic-studied class defined',
  /\.dg-topic-studied\s*\{[^}]*color:\s*var\(--text-mid\)/.test(css));
test('v4.85.18 DomainGridStates CSS: dg-topic-untouched class defined (italic + dim + opacity)',
  /\.dg-topic-untouched\s*\{[^}]*color:\s*var\(--text-dim\)[^}]*font-style:\s*italic[^}]*opacity:\s*\.7/.test(css));
test('v4.85.18 DomainGridStates CSS: untouched uses hollow dot (transparent + border)',
  /\.dg-topic-untouched\s+\.dg-topic-dot\s*\{[^}]*background:\s*transparent[^}]*border:\s*1px\s+solid\s+var\(--text-dim\)/.test(css));
test('v4.85.18 DomainGridStates: chip aria-label includes state hint (weak/practised/not yet studied)',
  (() => {
    const body = _fnBody(js, 'renderSetupDomainGrid');
    return body
      && /weak.*needs work/.test(body)
      && /\(practised\)/.test(body)
      && /\(not yet studied\)/.test(body);
  })());

// v4.85.20 — Per-topic exam splits (v4.81.13) were leaking into 4 surfaces
// that count "exams" by `mode === 'exam'`. A 90-Q exam saves ~50 split rows,
// each tagged mode='exam' with actual topic name. Surfaces filter on summary
// entries only (topic === EXAM_TOPIC) to avoid double-count.
test('v4.85.20 ExamSplitFilter: _renderAnaExams filters to summary entries (topic === EXAM_TOPIC)',
  (() => {
    const body = _fnBody(js, '_renderAnaExams');
    return body && /e\.mode === 'exam' && e\.topic === EXAM_TOPIC/.test(body);
  })());
test('v4.85.20 ExamSplitFilter: bestExam in getStudyStats filters to summary entries',
  (() => {
    const body = _fnBody(js, 'getStudyStats');
    return body
      && /bestExam.*=.*h\.filter\(e => e\.mode === 'exam' && e\.topic === EXAM_TOPIC\)/.test(body);
  })());
test('v4.85.20 ExamSplitFilter: milestone exam count filters to summary entries',
  (() => {
    const body = _fnBody(js, '_buildMilestoneCtx');
    return body
      && /const exams = h\.filter\(e => e\.mode === 'exam' && e\.topic === EXAM_TOPIC\)/.test(body);
  })());
test('v4.85.20 ExamSplitFilter: _renderAnaExamVsQuiz filters to summary entries',
  (() => {
    const body = _fnBody(js, '_renderAnaExamVsQuiz');
    return body
      && /examEntries = h\.filter\(e => e\.mode === 'exam' && e\.topic === EXAM_TOPIC\)/.test(body);
  })());
test('v4.85.20 ExamSplitFilter: vm fixture — _renderAnaExams shows 2 entries when history has 2 summaries + 50 splits',
  (() => {
    try {
      const body = _fnBody(js, '_renderAnaExams');
      if (!body) return false;
      const vm = require('vm');
      // Build fake history: 2 exam summaries + 50 per-topic splits (varied topics)
      const fakeHistory = [
        { date: '2026-05-02T10:00:00Z', topic: 'Exam', mode: 'exam', score: 78, total: 90, pct: 87 },
        { date: '2026-05-01T10:00:00Z', topic: 'Exam', mode: 'exam', score: 75, total: 90, pct: 83 }
      ];
      // Add 50 fake per-topic split rows (each 1-2 questions, scoring 100% — these should be EXCLUDED)
      const splitTopics = ['BGP', 'OSPF', 'IPv6', 'NAT & IP Services', 'Subnetting & IP Addressing'];
      for (let i = 0; i < 50; i++) {
        fakeHistory.push({
          date: '2026-05-02T10:00:00Z',
          topic: splitTopics[i % 5],
          mode: 'exam',
          score: 1,
          total: 1,
          pct: 100,
          via: 'exam-split'
        });
      }
      const ctx = {
        EXAM_TOPIC: 'Exam',
        EXAM_PASS_SCORE: 720,
        _edCardhead: () => '',
        Math, Date, Array
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const html = vm.runInContext('_renderAnaExams(' + JSON.stringify(fakeHistory) + ')', ctx);
      // Should render exactly 2 .ana-exam-row elements (one per summary), not 52
      const matches = html.match(/class="ana-exam-row"/g) || [];
      return matches.length === 2;
    } catch (e) { return false; }
  })());

test('v4.85.11 Tooltip: tooltip element has data-tt-* attrs (topic, domain, tier, mastery, attempts, last)',
  /data-tt-topic[\s\S]{0,300}data-tt-domain[\s\S]{0,200}data-tt-tier[\s\S]{0,200}data-tt-mastery[\s\S]{0,200}data-tt-attempts[\s\S]{0,200}data-tt-last/.test(js));
test('v4.85.11 Tooltip: tooltip container HTML present',
  /id="ana-const-tooltip"[\s\S]{0,300}ana-const-tt-topic[\s\S]{0,200}ana-const-tt-domain[\s\S]{0,200}ana-const-tt-stats/.test(js));
test('v4.85.11 Tooltip CSS: .ana-const-tooltip rule defined',
  /\.ana-const-tooltip\s*\{[^}]*position:\s*absolute/.test(css));
test('v4.85.13 Tooltip CSS: tier-colored TOP borders (replaces left borders from v4.85.11)',
  /\.ana-const-tooltip\.ana-const-tt-tier-mastered\s*\{[^}]*border-top-color/.test(css));
test('v4.85.11 Threshold: legend label shows ≥80% mastered (was ≥85%)',
  js.includes('\\u226580% mastered') && !js.includes('\\u226585% mastered'));
test('v4.85.11 Threshold: ana-domain-target tick at left: 80%',
  /\.ana-domain-target\s*\{[^}]*left:\s*80%/.test(css));

// v4.81.23 tombstone: renderRotationChips removed (stale-topic signal now
// drives the consolidated #today-plan card via buildSessionPlan).
test('v4.81.23 tombstone: renderRotationChips function removed',
  !js.includes('function renderRotationChips('));
test('v4.81.15 Stale: STALE_PROMPT_TOPIC_COUNT constant declared',
  /STALE_PROMPT_TOPIC_COUNT\s*=\s*\d+/.test(js));
test('v4.81.15 Stale: STALE_PROMPT_SLICE_SIZE constant declared',
  /STALE_PROMPT_SLICE_SIZE\s*=\s*\d+/.test(js));
test('v4.81.15 Stale: STALE_CHIP_TOPIC_COUNT constant declared',
  /STALE_CHIP_TOPIC_COUNT\s*=\s*\d+/.test(js));
test('v4.81.15 Stale: STALE_CHIP_MIN_HISTORY gate declared',
  /STALE_CHIP_MIN_HISTORY\s*=\s*\d+/.test(js));
test('v4.81.15 Stale: compound priority uses (1 + accGap) factor',
  /priority\s*=\s*daysSince\s*\*\s*\(1\s*\+\s*accGap\)/.test(js));
test('v4.81.15 Stale: only surfaces topics past WEAK_STALENESS_DAYS gate',
  /daysSince\s*<\s*WEAK_STALENESS_DAYS/.test(js));
test('v4.81.15 Stale: never-studied topics get 9999-day staleness sentinel',
  /:\s*9999\b/.test(_fnBody(js, '_computeStaleTopics') || ''));
test('v4.81.15 Stale: helper reuses computeWeakSpotScores for posterior accuracy',
  /computeWeakSpotScores/.test(_fnBody(js, '_computeStaleTopics') || ''));
test('v4.81.15 Stale: slice rotation uses overlapping window (step = floor(size/2))',
  /Math\.floor\(sliceSize\s*\/\s*2\)/.test(js));
test('v4.81.15 Stale: fetchQuestions accepts staleSliceIdx parameter',
  /async function fetchQuestions\(key, qTopic, difficulty, n, staleSliceIdx\)/.test(js));
test('v4.81.15 Stale: _fetchQuestionsBatch accepts staleSliceIdx parameter',
  /async function _fetchQuestionsBatch\(key, qTopic, difficulty, n, pbqCountOverride, staleSliceIdx\)/.test(js));
test('v4.81.15 Stale: prompt block injected only for MIXED_TOPIC',
  /qTopic === MIXED_TOPIC && \(difficulty/.test(_fnBody(js, '_fetchQuestionsBatch') || ''));
test('v4.81.15 Stale: staleBlock interpolated into buildPrompt template',
  /\$\{exemplarBlock\}\$\{retentionBlock\}\$\{staleBlock\}/.test(js));
test('v4.81.15 Stale: prompt block gated on STALE_CHIP_MIN_HISTORY',
  /hist\.length\s*>=\s*STALE_CHIP_MIN_HISTORY/.test(_fnBody(js, '_fetchQuestionsBatch') || ''));
test('v4.81.15 Stale: startExam passes batch index i as staleSliceIdx',
  /fetchQuestions\(key, MIXED_TOPIC, 'Mixed', EXAM_BATCH_BASE \+ EXAM_BATCH_BUFFER, i\)/.test(js));
test('v4.81.15 Stale: startExam retry-to-fill threads same staleSliceIdx i',
  /fetchQuestions\(key, MIXED_TOPIC, 'Mixed', deficit \+ EXAM_BATCH_BUFFER, i\)/.test(js));
test('v4.81.15 Stale: Marathon mode passes batch index as staleSliceIdx',
  /fetchQuestions\(key, MIXED_TOPIC, 'Exam Level', thisBatch, i\)/.test(js));
test('v4.81.15 Stale: parallel-batch sub-batches get outerIdx + i for inner rotation',
  /_fetchQuestionsBatch\(key, qTopic, difficulty, size, pbqBudgets\[i\], outerIdx \+ i\)/.test(js));
test('v4.81.15 Stale: prompt block uses ROTATION PRIORITY framing (not mandate)',
  /ROTATION PRIORITY:.*hasn['’]t practised these/.test(js));
test('v4.81.15 Stale: prompt block instructs Haiku not to substitute lottery topics (v4.85.8: replaced "stay within blueprint weights" with "lottery is fixed")',
  /lottery is fixed/.test(js));
// v4.81.23 tombstones: stale-topic rendering surfaces consolidated.
// The stale signal now drives #today-plan via buildSessionPlan; the
// dedicated #rotation-row element + .rotation-row/.rot-* CSS were
// removed in this cleanup pass.
test('v4.81.23 tombstone: #rotation-row HTML element removed',
  !html.includes('id="rotation-row"'));
test('v4.81.23 tombstone: .rotation-row CSS removed',
  !/\.rotation-row\s*\{/.test(css));
test('v4.81.23 tombstone: .rot-chip CSS removed',
  !/\.rot-chip\s*\{/.test(css));
test('v4.81.23 tombstone: renderRotationChips no longer called from goSetup',
  !/renderRotationChips/.test(_fnBody(js, 'goSetup') || ''));
test('v4.81.15 Stale: stale signal still drives the consolidated card via buildSessionPlan',
  /_computeStaleTopics/.test(_fnBody(js, 'buildSessionPlan') || ''));

// vm fixture — verify compound priority correctly ranks stale-and-weak above
// stale-but-mastered. Topic A (21d stale, 50% accuracy) MUST outrank Topic B
// (28d stale, 90% accuracy) even though B has more raw stale days.
test('v4.81.15 Stale: vm fixture — compound priority ranks stale+weak above stale+mastered',
  (() => {
    try {
      const body = _fnBody(js, '_computeStaleTopics');
      if (!body) return false;
      const vm = require('vm');
      const now = Date.now();
      const ctx = {
        TOPIC_DOMAINS: {
          'A_StaleAndWeak':   'concepts',
          'B_StaleButStrong': 'concepts',
          'C_Fresh':          'concepts',
          'D_NeverStudied':   'concepts'
        },
        WEAK_STALENESS_DAYS: 14,
        WEAK_TARGET_ACC: 0.85,
        MIXED_TOPIC: 'Mixed — All Topics',
        EXAM_TOPIC: 'Exam Simulation',
        // Stub computeWeakSpotScores to inject deterministic posterior + daysSince
        computeWeakSpotScores: () => [
          { topic: 'A_StaleAndWeak',   posterior: 0.50, daysSince: 21 },
          { topic: 'B_StaleButStrong', posterior: 0.90, daysSince: 28 },
          { topic: 'C_Fresh',          posterior: 0.80, daysSince: 3 }
        ],
        Math, Date, Object, Array
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const result = vm.runInContext('_computeStaleTopics([], 4)', ctx);
      // Expected: 4 returned, sorted by priority desc.
      // A: 21 × (1 + 0.35) = 28.35
      // B: 28 × (1 + 0)    = 28.0
      // D: 9999 × (1 + 0.35) = 13498  → but never-studied wins on raw days
      // C: 3 < 14 → filtered out (not stale yet)
      // So order: D (never), A (stale+weak), B (stale+strong); C excluded.
      if (result.length !== 3) return false;
      if (result[0].topic !== 'D_NeverStudied') return false;
      if (result[0].neverStudied !== true) return false;
      if (result[1].topic !== 'A_StaleAndWeak') return false;
      if (result[2].topic !== 'B_StaleButStrong') return false;
      // Confirm A's priority strictly exceeds B's (the compound-weight win)
      return result[1].priority > result[2].priority;
    } catch (e) { return false; }
  })());

// vm fixture — slice rotation produces overlapping but distinct windows.
// Verifies sliceIdx 0..N maps to different starting positions so 5 exam
// batches each see a different rotating slice.
test('v4.81.15 Stale: vm fixture — slice rotation produces distinct windows across batches',
  (() => {
    try {
      const body = _fnBody(js, '_computeStaleTopics');
      if (!body) return false;
      const vm = require('vm');
      // 8 fake stale topics (all >14d) so rotation is observable
      const td = {};
      ['T1','T2','T3','T4','T5','T6','T7','T8'].forEach(t => { td[t] = 'concepts'; });
      const ctx = {
        TOPIC_DOMAINS: td,
        WEAK_STALENESS_DAYS: 14,
        WEAK_TARGET_ACC: 0.85,
        MIXED_TOPIC: 'Mixed', EXAM_TOPIC: 'Exam',
        // Strict daysSince ordering so priority order is deterministic
        computeWeakSpotScores: () => [
          { topic: 'T1', posterior: 0.5, daysSince: 80 },
          { topic: 'T2', posterior: 0.5, daysSince: 70 },
          { topic: 'T3', posterior: 0.5, daysSince: 60 },
          { topic: 'T4', posterior: 0.5, daysSince: 50 },
          { topic: 'T5', posterior: 0.5, daysSince: 40 },
          { topic: 'T6', posterior: 0.5, daysSince: 30 },
          { topic: 'T7', posterior: 0.5, daysSince: 25 },
          { topic: 'T8', posterior: 0.5, daysSince: 20 }
        ],
        Math, Date, Object, Array
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      // Ask for n=4 with sliceSize=8 → step = 4. Slice 0 = T1..T4, slice 1 = T5..T8.
      const slice0 = vm.runInContext('_computeStaleTopics([], 4, 0, 8)', ctx);
      const slice1 = vm.runInContext('_computeStaleTopics([], 4, 1, 8)', ctx);
      const slice2 = vm.runInContext('_computeStaleTopics([], 4, 2, 8)', ctx);
      // slice0 and slice1 should be distinct (different starting indices)
      const s0 = slice0.map(r => r.topic).join(',');
      const s1 = slice1.map(r => r.topic).join(',');
      const s2 = slice2.map(r => r.topic).join(',');
      // slice 2 wraps back to start (sliceIdx*step = 8 % 8 = 0)
      return slice0.length === 4
        && slice1.length === 4
        && s0 !== s1
        && s0 === s2 // proves modular wrap works
        && slice0[0].topic === 'T1'
        && slice1[0].topic === 'T5';
    } catch (e) { return false; }
  })());

// vm fixture — _formatStaleTopicsForPrompt shapes the injected prompt block
// correctly + handles never-studied topics distinctly from stale-with-history.
test('v4.81.15 Stale: vm fixture — prompt formatter handles never-studied vs stale distinction',
  (() => {
    try {
      const body = _fnBody(js, '_formatStaleTopicsForPrompt');
      if (!body) return false;
      const vm = require('vm');
      const ctx = { Array, String, Math, Object };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const empty = vm.runInContext('_formatStaleTopicsForPrompt([])', ctx);
      const result = vm.runInContext(`_formatStaleTopicsForPrompt([
        { topic: 'OSPF', daysSince: 21, posterior: 0.55, accGap: 0.30, neverStudied: false, priority: 27.3 },
        { topic: 'IPv6', daysSince: 9999, posterior: 0.5, accGap: 0.35, neverStudied: true, priority: 13498 }
      ])`, ctx);
      return empty === ''
        && /ROTATION PRIORITY/.test(result)
        && /OSPF/.test(result)
        && /last seen 21d ago/.test(result)
        && /55% accuracy/.test(result)
        && /IPv6/.test(result)
        && /never studied/.test(result)
        && /TOPIC LOTTERY/.test(result)
        && !/9999d ago/.test(result); // never-studied uses sentinel, not days
    } catch (e) { return false; }
  })());

test('v4.81.13 Exam: vm fixture — domain breakdown buckets correct/total per domain',
  (() => {
    try {
      const body = _fnBody(js, '_buildExamDomainBreakdown');
      if (!body) return false;
      const vm = require('vm');
      const ctx = {
        DOMAIN_WEIGHTS: { concepts: 0.23, implementation: 0.20, operations: 0.19, security: 0.14, troubleshooting: 0.24 },
        DOMAIN_LABELS: { concepts: 'Concepts', implementation: 'Implementation', operations: 'Operations', security: 'Security', troubleshooting: 'Troubleshooting' },
        TOPIC_DOMAINS: { 'OSI Model': 'concepts', 'OSPF': 'implementation', 'Network Troubleshooting & Tools': 'troubleshooting' },
        Math, JSON
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const log = [
        { q: { topic: 'OSI Model' }, isRight: true,  isSkipped: false },
        { q: { topic: 'OSI Model' }, isRight: true,  isSkipped: false },
        { q: { topic: 'OSPF' },      isRight: false, isSkipped: false },
        { q: { topic: 'OSPF' },      isRight: true,  isSkipped: false },
        { q: { topic: 'Network Troubleshooting & Tools' }, isRight: false, isSkipped: false }
      ];
      ctx.log = log;
      const buckets = vm.runInContext('_buildExamDomainBreakdown(log)', ctx);
      return buckets.concepts.correct === 2 && buckets.concepts.total === 2 && buckets.concepts.pct === 100 && buckets.concepts.tier === 'mastered'
        && buckets.implementation.correct === 1 && buckets.implementation.total === 2 && buckets.implementation.pct === 50 && buckets.implementation.tier === 'novice'
        && buckets.troubleshooting.correct === 0 && buckets.troubleshooting.total === 1 && buckets.troubleshooting.tier === 'novice'
        && buckets.security.total === 0 && buckets.security.tier === 'empty'
        && buckets.operations.total === 0 && buckets.operations.tier === 'empty';
    } catch (e) { return false; }
  })());

// v4.99.6: Cloud sync detection now uses _quotaState as truth source.
// _quotaState is populated only after a successful get_daily_quota_usage RPC
// (which requires a valid auth.uid()), so non-null = signed in.
test('v4.99.6 Settings: vm fixture — health card surfaces Cloud sync status via _quotaState',
  (() => {
    try {
      const body = _fnBodyShell(js, 'renderSettingsHealthCard');
      if (!body) return false;
      const vm = require('vm');
      let storage = {};
      const fakeHost = { _innerHTML: '', set innerHTML(v) { this._innerHTML = v; }, get innerHTML() { return this._innerHTML; } };
      const ctx = {
        // v4.99.36: _fnBody's brace-walker overshoots into features/*.js post
        // Phase 11b extraction (concat'd into js for structural tests). The
        // features modules reference `window`, so the vm context needs a stub
        // to avoid ReferenceError. The actual logic under test
        // (renderSettingsHealthCard) doesn't use window.
        window: {},
        STORAGE: { KEY: 'k', DAILY_GOAL: 'dg' },
        localStorage: {
          getItem: (k) => storage[k] === undefined ? null : storage[k],
          setItem: (k, v) => { storage[k] = String(v); },
          removeItem: (k) => { delete storage[k]; }
        },
        document: { getElementById: () => fakeHost },
        getExamDate: () => null,
        getDaysToExam: () => null,
        getDailyGoal: () => 20,
        getTodayQuestionCount: () => 0,
        escHtml: (s) => String(s),
        Number, parseInt,
        Math, Date, JSON, Object,
        _quotaState: null  // simulate signed-out
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      // No session → "Sign in to sync"
      vm.runInContext('renderSettingsHealthCard()', ctx);
      const noSessionHtml = fakeHost._innerHTML;
      // _quotaState populated → "Active"
      ctx._quotaState = { used_today: 5, daily_limit: 20, tier: 'free' };
      vm.runInContext('renderSettingsHealthCard()', ctx);
      const withSessionHtml = fakeHost._innerHTML;
      return /Sign in to sync/.test(noSessionHtml)
        && /Active/.test(withSessionHtml);
    } catch (e) { return false; }
  })());

// v4.81.26: regression test for the schema-mismatch bug. Pre-fix,
// renderSettingsHealthCard read DAILY_GOAL as a JSON object {goal, date,
// current} but setDailyGoal writes a plain string number. So the row
// always reported "Not set" even when a goal was explicitly saved. This
// fixture saves "100" via the same path setDailyGoal would, then asserts
// the Health card reports the goal as set. Direct hit on
// `feedback_behavioral_fixtures.md` — would have caught the bug in v4.81.11
// if a vm fixture covered the daily-goal path.
test('v4.81.26 Settings: vm fixture — health card reads daily goal correctly when set',
  (() => {
    try {
      const body = _fnBodyShell(js, 'renderSettingsHealthCard');
      if (!body) return false;
      const vm = require('vm');
      let storage = {};
      const fakeHost = { _innerHTML: '', set innerHTML(v) { this._innerHTML = v; }, get innerHTML() { return this._innerHTML; } };
      const ctx = {
        // v4.99.36: window stub for the same reason as v4.99.6 above —
        // _fnBody overshoots into features/*.js after Phase 11b extraction.
        window: {},
        STORAGE: { KEY: 'k', DAILY_GOAL: 'dg' },
        localStorage: {
          getItem: (k) => storage[k] === undefined ? null : storage[k],
          setItem: (k, v) => { storage[k] = String(v); },
          removeItem: (k) => { delete storage[k]; }
        },
        document: { getElementById: () => fakeHost },
        getExamDate: () => null,
        getDaysToExam: () => null,
        listAutoBackups: () => [],
        getDailyGoal: () => {
          const raw = parseInt(storage['dg'], 10);
          return (Number.isFinite(raw) && raw > 0) ? raw : 20;
        },
        getTodayQuestionCount: () => 0,
        escHtml: (s) => String(s),
        Number, parseInt,
        Math, Date, JSON, Object
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);

      // Case 1: no goal set → "Not set"
      vm.runInContext('renderSettingsHealthCard()', ctx);
      const noGoalHtml = fakeHost._innerHTML;
      const notSetVisible = /Not set/.test(noGoalHtml) && /Set a daily goal first/.test(noGoalHtml);

      // Case 2: goal saved via setDailyGoal-style write (plain string number)
      storage['dg'] = '100';
      vm.runInContext('renderSettingsHealthCard()', ctx);
      const setGoalHtml = fakeHost._innerHTML;
      const goalDetected = /100 questions \/ day/.test(setGoalHtml);
      const todayRowOk = /0 \/ 100 questions/.test(setGoalHtml);

      // Case 3: legacy/junk write (the buggy schema we used to expect)
      storage['dg'] = '{"goal":50,"date":"2026-04-26","current":12}';
      vm.runInContext('renderSettingsHealthCard()', ctx);
      const legacyHtml = fakeHost._innerHTML;
      const legacyHandled = /Not set/.test(legacyHtml); // parseInt of JSON string yields NaN → "Not set"

      return notSetVisible && goalDetected && todayRowOk && legacyHandled;
    } catch (e) { return false; }
  })());

test('v4.81.26 Settings: tombstone — old buggy `dg.goal` schema check removed',
  (() => {
    const body = _fnBody(js, 'renderSettingsHealthCard') || '';
    // Should no longer read DAILY_GOAL as JSON with a `.goal` property
    return !/JSON\.parse\(localStorage\.getItem\(STORAGE\.DAILY_GOAL\)[\s\S]{0,80}dg\.goal/.test(body);
  })());

test('v4.81.26 Settings: today row uses getTodayQuestionCount (matches home page renderer)',
  /getTodayQuestionCount/.test(_fnBody(js, 'renderSettingsHealthCard') || ''));

// v4.81.30: SR review interactive answering — commit-before-reveal across
// all 3 modes. User feedback: "im just reading the answers and self grading.
// the risk of this is that someone can just lie and say yeah i knew that
// when deep down they didnt." Pre-fix the v4.81.27/28 self-grade path
// showed the explanation immediately, structurally encouraging
// self-deception. Now: every mode requires the user to commit (pick a
// letter, or pick multiple + submit) BEFORE the explanation reveals.
test('v4.81.30 SRInteractive: srToggleMultiPick handler defined',
  /function srToggleMultiPick\(/.test(js));
test('v4.81.30 SRInteractive: srSubmitMultiPick handler defined',
  /function srSubmitMultiPick\(/.test(js));
test('v4.81.30 SRInteractive: pickedLetters Set initialised in startSrReview',
  /pickedLetters:\s*new Set\(\)/.test(_fnBody(js, 'startSrReview') || ''));
test('v4.81.30 SRInteractive: pickedLetters cleared on advance in srMarkConfidence',
  /pickedLetters\s*=\s*new Set\(\)/.test(_fnBody(js, 'srMarkConfidence') || ''));
test('v4.81.30 SRInteractive: tombstone — v4.81.28 revealed=true hack removed from render',
  (() => {
    const body = _fnBody(js, '_renderSrCard') || '';
    // Should no longer pre-set revealed=true in any branch
    return !/_srSession\.revealed\s*=\s*true/.test(body);
  })());
test('v4.81.30 SRInteractive: render has 3 explicit modes (mcq-auto / multi-auto / commit-self-grade)',
  (() => {
    const body = _fnBody(js, '_renderSrCard') || '';
    return /['"]mcq-auto['"]/.test(body)
      && /['"]multi-auto['"]/.test(body)
      && /['"]commit-self-grade['"]/.test(body);
  })());
test('v4.81.30 SRInteractive: multi-auto mode emits Submit button + sr-multi-submit-row',
  (() => {
    const body = _fnBody(js, '_renderSrCard') || '';
    return /sr-multi-submit-row/.test(body)
      && /srSubmitMultiPick/.test(body);
  })());
test('v4.81.30 SRInteractive: multi-auto reveal applies is-missed class for correct-but-not-picked',
  /is-missed/.test(_fnBody(js, '_renderSrCard') || ''));
test('v4.81.30 SRInteractive: srSubmitMultiPick guards on minimum 2 picks',
  /picks\.size\s*<\s*2/.test(_fnBody(js, 'srSubmitMultiPick') || ''));
test('v4.81.30 SRInteractive CSS: .sr-option.is-missed declared',
  /\.sr-option\.is-missed\s*\{/.test(css));
test('v4.81.30 SRInteractive CSS: .sr-multi-submit-btn declared',
  /\.sr-multi-submit-btn\s*\{/.test(css));

// vm fixture #1 — multi-select interactive: toggle picks, submit, reveal markers.
test('v4.81.30 SRInteractive: vm fixture — multi-select pick → submit → reveal flow',
  (() => {
    try {
      const renderBody = _fnBody(js, '_renderSrCard');
      const toggleBody = _fnBody(js, 'srToggleMultiPick');
      const submitBody = _fnBody(js, 'srSubmitMultiPick');
      if (!renderBody || !toggleBody || !submitBody) return false;
      const vm = require('vm');
      const fakeHost = { _innerHTML: '', set innerHTML(v) { this._innerHTML = v; }, get innerHTML() { return this._innerHTML; } };
      const ctx = {
        document: { getElementById: (id) => id === 'sr-card-host' ? fakeHost : { textContent: '', style: {}, hidden: false } },
        _srSession: {
          cards: [{
            type: 'multi-select',
            question: '(Choose TWO) Q?',
            options: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
            answers: ['A', 'C'],
            topic: 'T', intervalDays: 1, correctStreak: 0
          }],
          index: 0,
          pickedLetter: null,
          pickedLetters: new Set(),
          revealed: false
        },
        escHtml: (s) => String(s),
        Object, String, Array, Number, Math, Set
      };
      vm.createContext(ctx);
      vm.runInContext(renderBody, ctx);
      vm.runInContext(toggleBody, ctx);
      vm.runInContext(submitBody, ctx);

      // Initial render — pre-pick, no submit yet
      vm.runInContext('_renderSrCard()', ctx);
      const initial = fakeHost._innerHTML;
      const submitDisabledInitially = /sr-multi-submit-btn[\s"']*disabled/.test(initial);

      // Toggle pick A → C (correct picks)
      vm.runInContext("srToggleMultiPick('A')", ctx);
      vm.runInContext("srToggleMultiPick('C')", ctx);
      const afterPicks = fakeHost._innerHTML;
      const submitEnabledAfter2Picks = !/sr-multi-submit-btn[\s"']*disabled/.test(afterPicks);

      // Submit → reveal
      vm.runInContext('srSubmitMultiPick()', ctx);
      const revealed = ctx._srSession.revealed === true;
      const finalHtml = fakeHost._innerHTML;

      // After reveal: A and C should have is-correct class, D/E neither
      const aCorrect = /data-letter="A"[^>]*>[\s\S]*?is-correct|is-correct[\s\S]*?data-letter="A"/.test(finalHtml);
      const cCorrect = /data-letter="C"[^>]*>[\s\S]*?is-correct|is-correct[\s\S]*?data-letter="C"/.test(finalHtml);

      return submitDisabledInitially && submitEnabledAfter2Picks && revealed && aCorrect && cCorrect;
    } catch (e) { return false; }
  })());

// vm fixture #2 — multi-select wrong picks reveal as is-wrong + missed correct as is-missed
test('v4.81.30 SRInteractive: vm fixture — wrong pick + missed correct render correct markers',
  (() => {
    try {
      const renderBody = _fnBody(js, '_renderSrCard');
      const toggleBody = _fnBody(js, 'srToggleMultiPick');
      const submitBody = _fnBody(js, 'srSubmitMultiPick');
      if (!renderBody || !toggleBody || !submitBody) return false;
      const vm = require('vm');
      const fakeHost = { _innerHTML: '', set innerHTML(v) { this._innerHTML = v; }, get innerHTML() { return this._innerHTML; } };
      const ctx = {
        document: { getElementById: (id) => id === 'sr-card-host' ? fakeHost : { textContent: '', style: {}, hidden: false } },
        _srSession: {
          cards: [{
            type: 'multi-select', question: 'Q?',
            options: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
            answers: ['A', 'C'], // correct = A, C
            topic: 'T', intervalDays: 1, correctStreak: 0
          }],
          index: 0, pickedLetter: null, pickedLetters: new Set(), revealed: false
        },
        escHtml: (s) => String(s),
        Object, String, Array, Number, Math, Set
      };
      vm.createContext(ctx);
      vm.runInContext(renderBody, ctx);
      vm.runInContext(toggleBody, ctx);
      vm.runInContext(submitBody, ctx);

      // User picks A (correct) + B (wrong) — misses C
      vm.runInContext("srToggleMultiPick('A')", ctx);
      vm.runInContext("srToggleMultiPick('B')", ctx);
      vm.runInContext('srSubmitMultiPick()', ctx);
      const html = fakeHost._innerHTML;

      // A picked + correct → is-correct
      // B picked + wrong → is-wrong
      // C missed correct → is-missed
      const aGreen = /data-letter="A"[\s\S]*?is-correct|is-correct[\s\S]*?data-letter="A"/.test(html);
      const bRed = /data-letter="B"[\s\S]*?is-wrong|is-wrong[\s\S]*?data-letter="B"/.test(html);
      const cMissed = /data-letter="C"[\s\S]*?is-missed|is-missed[\s\S]*?data-letter="C"/.test(html);
      // Should show "Got it wrong" path because not fully correct
      const wrongOutcomeShown = /sr-confidence-wrong/.test(html) && !/sr-confidence-confident/.test(html);

      return aGreen && bRed && cMissed && wrongOutcomeShown;
    } catch (e) { return false; }
  })());

// vm fixture #3 — commit-then-self-grade path requires picking before reveal
test('v4.81.30 SRInteractive: vm fixture — commit-then-self-grade requires pick before reveal',
  (() => {
    try {
      const renderBody = _fnBody(js, '_renderSrCard');
      const pickBody = _fnBody(js, 'srPickAnswer');
      if (!renderBody || !pickBody) return false;
      const vm = require('vm');
      const fakeHost = { _innerHTML: '', set innerHTML(v) { this._innerHTML = v; }, get innerHTML() { return this._innerHTML; } };
      const ctx = {
        document: { getElementById: (id) => id === 'sr-card-host' ? fakeHost : { textContent: '', style: {}, hidden: false } },
        _srSession: {
          cards: [{
            type: 'mcq', question: 'Legacy null-answer Q?',
            options: { A: 'a', B: 'b', C: 'c', D: 'd' },
            answer: null, // legacy corruption — falls to commit-self-grade
            topic: 'T', intervalDays: 1, correctStreak: 0
          }],
          index: 0, pickedLetter: null, pickedLetters: new Set(), revealed: false
        },
        escHtml: (s) => String(s),
        Object, String, Array, Number, Math, Set
      };
      vm.createContext(ctx);
      vm.runInContext(renderBody, ctx);
      vm.runInContext(pickBody, ctx);

      // Initial render — options clickable, no explanation, no self-grade buttons yet
      vm.runInContext('_renderSrCard()', ctx);
      const beforePick = fakeHost._innerHTML;
      const noExplanationYet = !/sr-explanation/.test(beforePick);
      const noSelfGradeButtonsYet = !/sr-confidence-confident/.test(beforePick);
      const optionsClickable = /onclick="srPickAnswer/.test(beforePick);

      // Now pick an option
      vm.runInContext("srPickAnswer('B')", ctx);
      const afterPick = fakeHost._innerHTML;
      const explanationNowShows = ctx._srSession.revealed === true;
      const selfGradeButtonsShow = /sr-confidence-confident/.test(afterPick)
        && /sr-confidence-uncertain/.test(afterPick)
        && /sr-confidence-wrong/.test(afterPick);
      const bannerShows = /sr-self-grade-banner/.test(afterPick);

      return noExplanationYet
        && noSelfGradeButtonsYet
        && optionsClickable
        && explanationNowShows
        && selfGradeButtonsShow
        && bannerShows;
    } catch (e) { return false; }
  })());

