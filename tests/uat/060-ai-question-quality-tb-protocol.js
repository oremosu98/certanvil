// tests/uat/060-ai-question-quality-tb-protocol.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Question scenario context, AI batching + Sonnet escalation, question-quality hardening, multi-topic history, topology builder protocol inspector/collapse/packet-trace/STP visualisation, troubleshooting order guard

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ══════════════════════════════════════════════════════════════════════
// v4.56.0 — Question scenario context block
// Optional 1-2 sentence exam-realism setup rendered between the stem
// and the options grid. Teaches reading comprehension for wordy N10-009
// question framing.
// ══════════════════════════════════════════════════════════════════════

// HTML — both quiz + exam pages carry the scenario container
test('v4.56.0 HTML: quiz mode has #q-scenario container',
  /<div\s+class="q-scenario"\s+id="q-scenario"\s+hidden><\/div>/.test(html));
test('v4.56.0 HTML: exam mode has #exam-q-scenario container',
  /<div\s+class="q-scenario"\s+id="exam-q-scenario"\s+hidden><\/div>/.test(html));

// JS — render helper + call sites in quiz + exam
test('v4.56.0 JS: _renderScenarioBlock helper defined',
  /function\s+_renderScenarioBlock\s*\(\s*elId\s*,\s*q\s*,\s*qType\s*\)/.test(js));
test('v4.56.0 JS: render() hooks scenario block for quiz mode',
  /_renderScenarioBlock\(['"]q-scenario['"],\s*q,\s*qType\)/.test(js));
test('v4.56.0 JS: renderExam() hooks scenario block for exam mode',
  /_renderScenarioBlock\(['"]exam-q-scenario['"],\s*q,\s*qType\)/.test(js));
test('v4.56.0 JS: helper skips cli-sim + topology types (nested scenario already)',
  /isNestedType\s*=\s*qType\s*===\s*['"]cli-sim['"]\s*\|\|\s*qType\s*===\s*['"]topology['"]/.test(js));
test('v4.56.0 JS: helper escapes scenario via escHtml (XSS guard)',
  /q-scenario-body[^]{0,80}escHtml\(scenario\)/.test(js));

// Behavioural — sandbox the helper + verify hide-when-absent + render-when-present
(function testScenarioHelper() {
  try {
    const vm = require('vm');
    const bodyMatch = js.match(/function\s+_renderScenarioBlock\s*\(\s*elId\s*,\s*q\s*,\s*qType\s*\)\s*\{([\s\S]*?)\n\}/);
    if (!bodyMatch) { test('v4.56.0 sandbox: helper body extracted', false); return; }
    test('v4.56.0 sandbox: helper body extracted', true);

    let elState = { hidden: false, innerHTML: '' };
    const ctx = {
      document: {
        getElementById: (id) => (id === 'q-scenario' || id === 'exam-q-scenario') ? elState : null
      },
      escHtml: (s) => String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;')
    };
    vm.createContext(ctx);
    const fn = vm.runInContext(`(function(elId, q, qType) {${bodyMatch[1]}})`, ctx);

    // Case 1: no scenario → hidden
    elState = { hidden: false, innerHTML: 'stale' };
    fn.call(ctx, 'q-scenario', { question: 'x' }, 'mcq');
    test('v4.56.0 sandbox: no scenario \u2192 element is hidden + cleared',
      elState.hidden === true && elState.innerHTML === '');

    // Case 2: scenario on MCQ → rendered with rule + body spans
    elState = { hidden: true, innerHTML: '' };
    fn.call(ctx, 'q-scenario', { question: 'x', scenario: 'A technician is troubleshooting a VLAN.' }, 'mcq');
    test('v4.56.0 sandbox: MCQ + scenario \u2192 hidden false + rule+body spans present',
      elState.hidden === false &&
      elState.innerHTML.includes('q-scenario-rule') &&
      elState.innerHTML.includes('q-scenario-body') &&
      elState.innerHTML.includes('troubleshooting a VLAN'));

    // Case 3: scenario on cli-sim → still hidden (nested renderer handles it)
    elState = { hidden: false, innerHTML: 'stale' };
    fn.call(ctx, 'q-scenario', { question: 'x', scenario: 'A user reports...' }, 'cli-sim');
    test('v4.56.0 sandbox: cli-sim skipped \u2192 hidden true (no double-render)',
      elState.hidden === true && elState.innerHTML === '');

    // Case 4: scenario on topology → also skipped
    elState = { hidden: false, innerHTML: 'stale' };
    fn.call(ctx, 'q-scenario', { question: 'x', scenario: 'Design a hybrid cloud.' }, 'topology');
    test('v4.56.0 sandbox: topology skipped \u2192 hidden true (no double-render)',
      elState.hidden === true && elState.innerHTML === '');

    // Case 5: whitespace-only scenario → treated as absent
    elState = { hidden: false, innerHTML: 'stale' };
    fn.call(ctx, 'q-scenario', { question: 'x', scenario: '   ' }, 'mcq');
    test('v4.56.0 sandbox: whitespace-only scenario \u2192 hidden (trim guard)',
      elState.hidden === true && elState.innerHTML === '');

    // Case 6: XSS guard — angle brackets in scenario get escaped
    elState = { hidden: true, innerHTML: '' };
    fn.call(ctx, 'q-scenario', { question: 'x', scenario: '<img src=x onerror=alert(1)>' }, 'mcq');
    test('v4.56.0 sandbox: scenario text is HTML-escaped (XSS guard)',
      !elState.innerHTML.includes('<img') &&
      elState.innerHTML.includes('&lt;img'));
  } catch (e) {
    test('v4.56.0 sandbox: helper executes without error', false);
  }
})();

// CSS — editorial aesthetic
test('v4.56.0 CSS: .q-scenario class defined with max-width cap',
  /\.q-scenario\s*\{[\s\S]{0,400}max-width:\s*680px/.test(css));
test('v4.56.0 CSS: .q-scenario-rule carries accent left bar',
  /\.q-scenario\s+\.q-scenario-rule\s*\{[\s\S]{0,200}background:\s*var\(--accent\)/.test(css));
test('v4.56.0 CSS: .q-scenario-body uses flex:1 1 auto (narrow + responsive)',
  /\.q-scenario\s+\.q-scenario-body\s*\{[\s\S]{0,200}flex:\s*1\s+1\s+auto/.test(css));
test('v4.56.0 CSS: qScenarioFade keyframe for entrance animation',
  /@keyframes\s+qScenarioFade\s*\{/.test(css));
test('v4.56.0 CSS: [hidden] rule so empty block takes no layout space',
  /\.q-scenario\[hidden\]\s*\{\s*display:\s*none/.test(css));
test('v4.56.0 CSS: reduced-motion neutralises qScenarioFade',
  /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]{0,600}\.q-scenario\s*\{\s*animation:\s*none/.test(css));
test('v4.56.0 CSS: light-theme override for .q-scenario-rule brand purple',
  /\[data-theme="light"\]\s+\.q-scenario\s+\.q-scenario-rule\s*\{[\s\S]{0,100}background:\s*#6355e0/.test(css));

// Prompt instructions — Haiku is told when to include scenario + the golden-rule
test('v4.56.0 prompt: fetchQuestions mentions optional SCENARIO CONTEXT FIELD',
  /SCENARIO\s+CONTEXT\s+FIELD/.test(js));
test('v4.56.0 prompt: enforces "environment, not subject" rule',
  /scenario\s+describes\s+the\s+ENVIRONMENT/.test(js));
test('v4.56.0 prompt: explicitly forbids telegraphing the answer',
  /telegraphs\s+the\s+answer/.test(js));
test('v4.56.0 prompt: MCQ format example carries scenario as optional',
  /"scenario":"\(optional/.test(js));

// ══════════════════════════════════════════════════════════════════════
// v4.56.1 — Batching + malformed-JSON resilience
// Large question requests (n > QUIZ_BATCH_THRESHOLD) split into concurrent
// batches of ≤QUIZ_BATCH_SIZE so each prompt stays in Haiku's comfort zone.
// Fixes the "AI returned malformed data" failure at n=20 with multi-topic.
// ══════════════════════════════════════════════════════════════════════

// Constants
test('v4.56.1 JS: QUIZ_BATCH_SIZE constant defined (10)',
  /const QUIZ_BATCH_SIZE\s*=\s*10/.test(js));
test('v4.56.1 JS: QUIZ_BATCH_THRESHOLD constant defined (12)',
  /const QUIZ_BATCH_THRESHOLD\s*=\s*12/.test(js));
test('v4.56.1 JS: MAX_TOKENS_GENERATION bumped to 12000 for scenario headroom',
  /MAX_TOKENS_GENERATION\s*=\s*12000/.test(js));

// Coordinator structure
test('v4.56.1 JS: fetchQuestions single-shot path when n <= threshold',
  /n\s*<=\s*QUIZ_BATCH_THRESHOLD[\s\S]{0,400}_fetchQuestionsBatch\(key,\s*qTopic,\s*difficulty,\s*n(?:\s*,\s*[a-zA-Z_$][\w$]*\s*,\s*[a-zA-Z_$][\w$]*)?\s*\)/.test(js));
test('v4.56.1 JS: fetchQuestions splits n into batches via numBatches + base + remainder',
  /const\s+numBatches\s*=\s*Math\.ceil\(n\s*\/\s*QUIZ_BATCH_SIZE\)/.test(js) &&
  /const\s+base\s*=\s*Math\.floor\(n\s*\/\s*numBatches\)/.test(js));
test('v4.56.1 JS: fetchQuestions fires batches concurrently via Promise.allSettled',
  /Promise\.allSettled\([\s\S]{0,400}_fetchQuestionsBatch/.test(js));
test('v4.56.1 JS: API errors bubble up immediately (no masking 401/429 as malformed)',
  /r\.reason[\s\S]{0,40}apiError/.test(js));
test('v4.56.1 JS: merged === 0 → throws user-facing malformed-data error',
  /merged\.length\s*===\s*0[\s\S]{0,100}AI returned malformed data/.test(js));
test('v4.56.1 JS: caching happens at outer coordinator (batched path)',
  /cacheQuestions\(qTopic,\s*difficulty,\s*n,\s*merged\)/.test(js));

// PBQ budget distribution
test('v4.56.1 JS: outer computes totalPbqBudget once at coordinator level',
  /const\s+totalPbqBudget\s*=\s*n\s*>=\s*10\s*\?\s*2/.test(js));
test('v4.56.1 JS: PBQ budget distributed across batches (round-robin to early batches)',
  /pbqBudgets\[i\s*%\s*numBatches\]\+\+/.test(js));

// Batch worker accepts override
test('v4.56.1 JS: _fetchQuestionsBatch accepts pbqCountOverride',
  /async function _fetchQuestionsBatch\(key,\s*qTopic,\s*difficulty,\s*n,\s*pbqCountOverride(?:,\s*[a-zA-Z_$][\w$]*)?\)/.test(js));
test('v4.56.1 JS: batch worker uses override when provided, falls back to formula otherwise',
  /typeof pbqCountOverride\s*===\s*['"]number['"][\s\S]{0,100}pbqCountOverride[\s\S]{0,60}n\s*>=\s*10\s*\?\s*2/.test(js));
test('v4.56.1 JS: inner batch no longer calls cacheQuestions (coordinator handles it)',
  !_fnBody(js, '_fetchQuestionsBatch').includes('cacheQuestions('));

// Storage key + logging
test('v4.56.1 JS: STORAGE.AI_PARSE_FAILS key added',
  /AI_PARSE_FAILS:\s*['"]nplus_ai_parse_fails['"]/.test(js));
test('v4.56.1 JS: _logAiParseFail helper defined',
  /function\s+_logAiParseFail\s*\(entry\)/.test(js));
test('v4.56.1 JS: _logAiParseFail caps rolling log at 5 entries',
  /arr\.slice\(0,\s*5\)/.test(js));
test('v4.56.1 JS: _logAiParseFail fires on primary parse failure',
  /_logAiParseFail\(\{\s*attempt:\s*['"]haiku-full['"]/.test(js));
test('v4.56.1 JS: _logAiParseFail fires on retry parse failure too',
  /_logAiParseFail\(\{\s*attempt:\s*['"]haiku-retry['"]/.test(js));

// Retry-without-scenario (middle-tier fallback inside each batch)
test('v4.56.1 JS: haiku-retry path calls buildPrompt(false) to strip scenario block',
  /buildPrompt\(false\)[\s\S]{0,120}haiku-retry/.test(js));

// ══════════════════════════════════════════════════════════════════════
// v4.56.2 — Sonnet escalation tier
// Last-ditch fallback inside each batch: when both Haiku attempts (full +
// no-scenario retry) fail the parse, escalate JUST this batch to Sonnet.
// Silent success on recovery; user-facing error only if Sonnet also fails.
// ══════════════════════════════════════════════════════════════════════

test('v4.56.2 JS: attempt() helper parameterized with model arg (3rd param)',
  /const attempt = async \(prompt,\s*label,\s*model\)/.test(js));
test('v4.56.2 JS: attempt() uses `model || CLAUDE_MODEL` fallback in fetch body',
  /body:\s*JSON\.stringify\(\{\s*model:\s*model\s*\|\|\s*CLAUDE_MODEL,\s*max_tokens:\s*MAX_TOKENS_GENERATION/.test(js));
test('v4.56.2 JS: primary Haiku attempt now labelled haiku-full + passes CLAUDE_MODEL',
  /attempt\(buildPrompt\(true\),\s*['"]haiku-full['"],\s*CLAUDE_MODEL\)/.test(js));
test('v4.56.2 JS: retry Haiku attempt labelled haiku-retry + passes CLAUDE_MODEL',
  /attempt\(buildPrompt\(false\),\s*['"]haiku-retry['"],\s*CLAUDE_MODEL\)/.test(js));
test('v4.56.2 JS: Sonnet escalation uses CLAUDE_VALIDATOR_MODEL (Sonnet 4.6)',
  /attempt\(buildPrompt\(false\),\s*['"]sonnet-escalation['"],\s*CLAUDE_VALIDATOR_MODEL\)/.test(js));
test('v4.56.2 JS: Sonnet escalation only fires after both Haiku attempts fail',
  /haiku-retry[\s\S]{0,2000}sonnet-escalation/.test(js));
test('v4.56.2 JS: Sonnet failure still logs + throws user-facing malformed-data',
  /sonnet-escalation[\s\S]{0,400}_logAiParseFail\([\s\S]{0,100}sonnet-escalation[\s\S]{0,300}AI returned malformed data/.test(js));
test('v4.56.2 JS: escalation emits console.info telemetry on fire (not silent)',
  /console\.info\(`\[fetchQuestions\] escalating batch[\s\S]{0,200}CLAUDE_VALIDATOR_MODEL/.test(js));
test('v4.56.2 JS: escalation uses buildPrompt(false) to keep call lightweight',
  /buildPrompt\(false\)[\s\S]{0,80}sonnet-escalation/.test(js));
test('v4.56.2 JS: Sonnet API error still bubbles up immediately (not masked)',
  /sonnetErr\.apiError/.test(js));

// Behavioural — verify the 3-tier cascade structure in source via body inspection
(function testCascadeStructure() {
  try {
    const body = _fnBody(js, '_fetchQuestionsBatch');
    // Order check: haiku-full appears before haiku-retry before sonnet-escalation
    const posFull = body.indexOf("'haiku-full'");
    const posRetry = body.indexOf("'haiku-retry'");
    const posSonnet = body.indexOf("'sonnet-escalation'");
    test('v4.56.2 cascade: haiku-full appears before haiku-retry',
      posFull >= 0 && posRetry >= 0 && posFull < posRetry);
    test('v4.56.2 cascade: haiku-retry appears before sonnet-escalation',
      posRetry >= 0 && posSonnet >= 0 && posRetry < posSonnet);
    test('v4.56.2 cascade: all three attempt labels logged via _logAiParseFail',
      body.match(/_logAiParseFail/g) && body.match(/_logAiParseFail/g).length >= 3);
    test('v4.56.2 cascade: only one user-facing malformed-data throw (at the very end)',
      (body.match(/AI returned malformed data/g) || []).length === 1);
  } catch (e) {
    test('v4.56.2 cascade: structure check executes without error', false);
  }
})();

// Behavioural — vm-sandbox the outer coordinator's batch-sizing logic
(function testBatchSizing() {
  try {
    const vm = require('vm');
    // Extract the n-to-batchSizes logic into a testable helper
    const helperBody = `
      const QUIZ_BATCH_SIZE = 10;
      const QUIZ_BATCH_THRESHOLD = 12;
      function splitN(n) {
        if (n <= QUIZ_BATCH_THRESHOLD) return [n];
        const numBatches = Math.ceil(n / QUIZ_BATCH_SIZE);
        const base = Math.floor(n / numBatches);
        const remainder = n - (base * numBatches);
        return Array.from({ length: numBatches }, (_, i) => base + (i < remainder ? 1 : 0));
      }
      function pbqDistribution(n, numBatches) {
        const totalPbqBudget = n >= 10 ? 2 : (n >= 7 ? 1 : 0);
        const pbqBudgets = new Array(numBatches).fill(0);
        for (let i = 0; i < totalPbqBudget; i++) pbqBudgets[i % numBatches]++;
        return { totalPbqBudget, pbqBudgets };
      }
    `;
    const ctx = {};
    vm.createContext(ctx);
    vm.runInContext(helperBody, ctx);

    // Common sizes
    test('v4.56.1 sandbox: n=5 → single-shot [5]',
      JSON.stringify(ctx.splitN(5)) === '[5]');
    test('v4.56.1 sandbox: n=10 → single-shot [10] (at threshold but <=)',
      JSON.stringify(ctx.splitN(10)) === '[10]');
    test('v4.56.1 sandbox: n=12 → single-shot [12] (at threshold exactly)',
      JSON.stringify(ctx.splitN(12)) === '[12]');
    test('v4.56.1 sandbox: n=13 → two batches, still balanced',
      ctx.splitN(13).length === 2 && ctx.splitN(13).reduce((a, b) => a + b, 0) === 13);
    test('v4.56.1 sandbox: n=20 → [10, 10] (user\'s failing case)',
      JSON.stringify(ctx.splitN(20)) === '[10,10]');
    test('v4.56.1 sandbox: n=26 (20 + DROPOUT_BUFFER) → 3 balanced batches',
      ctx.splitN(26).length === 3 && ctx.splitN(26).reduce((a, b) => a + b, 0) === 26);
    test('v4.56.1 sandbox: n=50 (marathon) → 5 batches of 10',
      JSON.stringify(ctx.splitN(50)) === '[10,10,10,10,10]');
    test('v4.56.1 sandbox: batched path (n > threshold) always keeps every batch ≤ QUIZ_BATCH_SIZE, and total = n',
      (() => {
        for (let n = 13; n <= 100; n++) {
          const sizes = ctx.splitN(n);
          if (sizes.some(s => s > 10)) return false;
          if (sizes.reduce((a, b) => a + b, 0) !== n) return false;
        }
        return true;
      })());

    // PBQ distribution
    const d20 = ctx.pbqDistribution(20, 2);
    test('v4.56.1 sandbox: n=20 gets totalPbqBudget=2, distributed [1, 1]',
      d20.totalPbqBudget === 2 && JSON.stringify(d20.pbqBudgets) === '[1,1]');
    const d50 = ctx.pbqDistribution(50, 5);
    test('v4.56.1 sandbox: n=50 gets totalPbqBudget=2, distributed [1, 1, 0, 0, 0]',
      d50.totalPbqBudget === 2 && JSON.stringify(d50.pbqBudgets) === '[1,1,0,0,0]');
    const d9 = ctx.pbqDistribution(9, 1);
    test('v4.56.1 sandbox: n=9 single-shot gets totalPbqBudget=1',
      d9.totalPbqBudget === 1 && JSON.stringify(d9.pbqBudgets) === '[1]');
    const d5 = ctx.pbqDistribution(5, 1);
    test('v4.56.1 sandbox: n=5 single-shot gets totalPbqBudget=0 (below 7 threshold)',
      d5.totalPbqBudget === 0 && JSON.stringify(d5.pbqBudgets) === '[0]');
  } catch (e) {
    test('v4.56.1 sandbox: batching logic executes without error', false);
  }
})();

// ══════════════════════════════════════════════════════════════════════
// v4.57.0 — Question-quality hardening (validator + generator prompts)
// Expands aiValidateQuestions from 3 correctness checks to 6 (adds conceptual
// coherence + framing match + distractor quality). Also adds explicit
// anti-conflation rules to the generation prompt so Haiku is less likely to
// produce sloppy questions (e.g. the "fundamental TCP/IP principle" →
// classful-addressing conflation that shipped in v4.56.x).
// ══════════════════════════════════════════════════════════════════════

// Validator prompt expansion
test('v4.57.0 validator: expanded from THREE checks to SEVEN checks (v4.85.4: +multi-select balance)',
  /Review each question below and check SEVEN things/.test(js));
test('v4.57.0 validator: check 4 = CONCEPTUAL COHERENCE',
  /4\.\s*CONCEPTUAL COHERENCE[\s\S]{0,300}different concept/i.test(js));
test('v4.57.0 validator: check 5 = FRAMING MATCH',
  /5\.\s*FRAMING MATCH[\s\S]{0,300}abstraction level/.test(js));
test('v4.57.0 validator: check 6 = DISTRACTOR QUALITY',
  /6\.\s*DISTRACTOR QUALITY[\s\S]{0,300}plausible alternatives/.test(js));
test('v4.57.0 validator: new failure modes listed in common-errors section',
  /CONCEPTUAL CONFLATION:/.test(js) &&
  /FRAMING DRIFT:/.test(js) &&
  /WEAK DISTRACTORS:/.test(js));
test('v4.57.0 validator: classful-addressing conflation explicitly called out as AMBIGUOUS trigger',
  /classful addressing[\s\S]{0,200}obsoleted by CIDR/.test(js));
test('v4.57.0 validator: OK requires passing all 7 checks (v4.85.4: +balanced for multi-select)',
  /Q1:OK[\s\S]{0,400}conceptually coherent[\s\S]{0,100}well-framed[\s\S]{0,100}plausible distractors/.test(js));
test('v4.57.0 validator: AMBIGUOUS trigger expanded to cover checks 4/5/6/7',
  /AMBIGUOUS[\s\S]{0,400}fails any of checks 4\/5\/6\/7/.test(js));

// Generation prompt hardening
test('v4.57.0 gen: CONCEPTUAL COHERENCE RULES section added',
  /CONCEPTUAL COHERENCE RULES \(v4\.57\.0/.test(js));
test('v4.57.0 gen: explicit anti-classful-vs-TCP/IP conflation rule',
  /Do NOT conflate deprecated classful addressing[\s\S]{0,200}CIDR/.test(js));
test('v4.57.0 gen: classful terminology guard ties to legacy/historical context',
  /legacy concepts or historical context[\s\S]{0,200}fundamental TCP\/IP principle/.test(js));
test('v4.57.0 gen: abstraction-level match rule present',
  /MATCH THE ABSTRACTION LEVEL[\s\S]{0,400}principle[\s\S]{0,200}configuration step/.test(js));
test('v4.57.0 gen: "stem must match what question tests" rule present',
  /STEM MUST MATCH WHAT THE QUESTION ACTUALLY TESTS/.test(js));
test('v4.57.0 gen: DISTRACTOR QUALITY RULES section added',
  /DISTRACTOR QUALITY RULES:[\s\S]{0,400}at least TWO[\s\S]{0,200}plausible/i.test(js));
test('v4.57.0 gen: distractor rule forbids 3-of-4 obviously-wrong pattern',
  /3 of 4 options are obviously wrong[\s\S]{0,200}giveaway/.test(js));

// ══════════════════════════════════════════════════════════════════════
// v4.57.1 — Multi-topic history entries split per constituent topic
// Pre-v4.57.1 bug: Multi-topic Custom Quiz sessions saved ONE history
// entry under "Multi: Topic A, Topic B, …" sentinel; Progress page's
// `h.filter(e => e.topic === t)` never matched it so every constituent
// topic showed as Untouched despite being studied.
// ══════════════════════════════════════════════════════════════════════

test('v4.57.1 JS: finish() detects Multi: prefix before saving history',
  /activeQuizTopic\.startsWith\(['"]Multi: ['"]\)/.test(js));
test('v4.57.1 JS: multi-topic save uses q.topic from each log entry',
  /byTopic\[\(entry\.q && entry\.q\.topic\)[\s\S]{0,200}byTopic\[t\]\.total\+\+/.test(js) ||
  /log\.forEach\([\s\S]{0,200}entry\.q && entry\.q\.topic/.test(js));
test('v4.57.1 JS: per-topic entries flagged with multi: true for future telemetry',
  /saveToHistory\(\{[\s\S]{0,300}multi:\s*true/.test(js));
test('v4.57.1 JS: single-topic path unchanged (else-branch preserves original behaviour)',
  /else\s*\{\s*saveToHistory\(\{\s*date:\s*now,\s*topic:\s*activeQuizTopic/.test(js));

// Behavioural — vm-sandbox the split logic with a fake `log` array
(function testMultiTopicSplit() {
  try {
    const vm = require('vm');
    // Extract the multi-topic branch as a standalone tester
    const helperBody = `
      function splitMultiTopic(log) {
        const byTopic = {};
        log.forEach(entry => {
          const t = (entry.q && entry.q.topic) || 'Unknown';
          if (!byTopic[t]) byTopic[t] = { total: 0, score: 0 };
          byTopic[t].total++;
          if (entry.isRight) byTopic[t].score++;
        });
        return Object.keys(byTopic).map(t => {
          const { total: tTotal, score: tScore } = byTopic[t];
          const tPct = tTotal > 0 ? Math.round((tScore / tTotal) * 100) : 0;
          return { topic: t, total: tTotal, score: tScore, pct: tPct };
        });
      }
    `;
    const ctx = {};
    vm.createContext(ctx);
    vm.runInContext(helperBody, ctx);

    // Simulate a 7/7/6 multi-topic session with varying accuracy per topic
    const fakeLog = [
      // 7 Connection Issues questions, 6 correct
      ...Array.from({ length: 7 }, (_, i) => ({ q: { topic: 'Connection Issues' }, isRight: i < 6 })),
      // 7 Perf Issues questions, 5 correct
      ...Array.from({ length: 7 }, (_, i) => ({ q: { topic: 'Perf Issues' }, isRight: i < 5 })),
      // 6 Service Issues questions, 4 correct
      ...Array.from({ length: 6 }, (_, i) => ({ q: { topic: 'Service Issues' }, isRight: i < 4 })),
    ];
    const result = ctx.splitMultiTopic(fakeLog);

    test('v4.57.1 sandbox: 20-Q multi-topic session splits into 3 per-topic entries',
      result.length === 3);
    test('v4.57.1 sandbox: Connection Issues entry = 7 total / 6 score / 86%',
      result.find(r => r.topic === 'Connection Issues')?.total === 7 &&
      result.find(r => r.topic === 'Connection Issues')?.score === 6 &&
      result.find(r => r.topic === 'Connection Issues')?.pct === 86);
    test('v4.57.1 sandbox: Perf Issues entry = 7 total / 5 score / 71%',
      result.find(r => r.topic === 'Perf Issues')?.total === 7 &&
      result.find(r => r.topic === 'Perf Issues')?.score === 5 &&
      result.find(r => r.topic === 'Perf Issues')?.pct === 71);
    test('v4.57.1 sandbox: Service Issues entry = 6 total / 4 score / 67%',
      result.find(r => r.topic === 'Service Issues')?.total === 6 &&
      result.find(r => r.topic === 'Service Issues')?.score === 4 &&
      result.find(r => r.topic === 'Service Issues')?.pct === 67);
    test('v4.57.1 sandbox: sum of per-topic scores = overall session score (invariant)',
      result.reduce((a, r) => a + r.score, 0) === 15 &&
      result.reduce((a, r) => a + r.total, 0) === 20);
    test('v4.57.1 sandbox: missing q.topic falls back to "Unknown" (defensive)',
      (() => {
        const r = ctx.splitMultiTopic([{ q: {}, isRight: true }]);
        return r.length === 1 && r[0].topic === 'Unknown';
      })());
    test('v4.57.1 sandbox: handles zero-question session gracefully',
      ctx.splitMultiTopic([]).length === 0);
  } catch (e) {
    test('v4.57.1 sandbox: split logic executes without error', false);
  }
})();

// ══════════════════════════════════════════════════════════════════════
// v4.57.2 — Interrogative guard on question stems
// Caught in the wild: a v4.56.x-era VPN question where the `question`
// field was pure declarative setup ("A system administrator is deploying
// a remote access VPN...") with no "which", "what", "?", or any cue
// asking the learner to choose. Programmatic guard rejects these before
// they reach the Sonnet validator.
// ══════════════════════════════════════════════════════════════════════

test('v4.57.2 JS: _stemHasInterrogative helper defined',
  /function\s+_stemHasInterrogative\(stem\)/.test(js));
test('v4.57.2 JS: validateQuestions calls _stemHasInterrogative on each question',
  /if\s*\(!_stemHasInterrogative\(q\.question\)\)\s*return false/.test(js));
test('v4.57.2 gen prompt: STEM MUST BE AN ACTUAL QUESTION section added',
  /STEM MUST BE AN ACTUAL QUESTION/.test(js));
test('v4.57.2 gen prompt: includes the VPN-style wrong example (the exact failure mode)',
  /system administrator is deploying a remote access VPN[\s\S]{0,400}pure setup/i.test(js));
test('v4.57.2 gen prompt: clarifies scenario field is additive, never a substitute',
  /Scenario \+ question is additive; scenario is never a substitute/.test(js));

// Behavioural — vm-sandbox the helper with a battery of fixtures
(function testInterrogativeGuard() {
  try {
    const vm = require('vm');
    const bodyMatch = js.match(/function\s+_stemHasInterrogative\s*\(stem\)\s*\{([\s\S]*?)\n\}/);
    if (!bodyMatch) { test('v4.57.2 sandbox: helper body extracted', false); return; }
    test('v4.57.2 sandbox: helper body extracted', true);

    const ctx = {};
    vm.createContext(ctx);
    const fn = vm.runInContext(`(function(stem) {${bodyMatch[1]}})`, ctx);

    // The actual failure-mode stem from the user's screenshot — must REJECT
    const vpnBuggy = 'A system administrator is deploying a remote access VPN solution that requires users to authenticate and access corporate resources through a web browser without installing additional VPN client software.';
    test('v4.57.2 sandbox: rejects declarative-only stem from real VPN bug report',
      fn(vpnBuggy) === false);

    // Legitimate questions — must ACCEPT
    test('v4.57.2 sandbox: accepts stem ending with "?"',
      fn('At which OSI layer does a switch operate?') === true);
    test('v4.57.2 sandbox: accepts "Which of the following..." (no ?)',
      fn('Which of the following is a stateful firewall') === true);
    test('v4.57.2 sandbox: accepts "What is the..." interrogative',
      fn('What is the primary function of ARP') === true);
    test('v4.57.2 sandbox: accepts CompTIA imperative "Select the..."',
      fn('Select the BEST VPN solution for browser-based access') === true);
    test('v4.57.2 sandbox: accepts "Identify..." imperative',
      fn('Identify the port number used by SSH') === true);
    test('v4.57.2 sandbox: accepts "Choose..." imperative',
      fn('Choose the protocol that operates at Layer 3') === true);
    test('v4.57.2 sandbox: accepts "Arrange..." (used by ordering PBQs)',
      fn('Arrange these steps in the correct troubleshooting order') === true);
    test('v4.57.2 sandbox: accepts "Place each..." (used by topology PBQs)',
      fn('Place each device in the correct network zone') === true);
    test('v4.57.2 sandbox: accepts "Given..." framing',
      fn('Given the network diagram, which device is misconfigured') === true);
    test('v4.57.2 sandbox: accepts "Why..." interrogative',
      fn('Why would an administrator choose OSPF over RIP') === true);
    test('v4.57.2 sandbox: accepts "How..." interrogative',
      fn('How does STP prevent broadcast storms') === true);
    test('v4.57.2 sandbox: accepts "Match each..." (PBQ format)',
      fn('Match each protocol with its default port number') === true);

    // Edge cases
    test('v4.57.2 sandbox: rejects empty string',
      fn('') === false);
    test('v4.57.2 sandbox: rejects whitespace-only',
      fn('   \n\t  ') === false);
    test('v4.57.2 sandbox: rejects null / non-string safely',
      fn(null) === false && fn(undefined) === false && fn(123) === false);
    test('v4.57.2 sandbox: word-boundary — "whichever" alone does NOT count as "which"',
      fn('The user inputs whichever value they prefer') === false);  // no real interrogative; "whichever" must NOT trigger "which"
    test('v4.57.2 sandbox: declarative setup with no interrogative word rejected',
      fn('A technician installed a new switch. The switch forwards frames based on MAC addresses. Devices on different VLANs cannot communicate directly.') === false);
  } catch (e) {
    test('v4.57.2 sandbox: interrogative guard executes without error', false);
  }
})();

// ══════════════════════════════════════════════════════════════════════
// v4.57.3 — topicHints entry for Network Appliances & Device Functions
// User flagged not seeing proxy/load-balancer/NIDS/NIPS questions. Root
// cause: no topicHints entry for this N10-009 1.2 topic, so Haiku had
// no guidance on which appliances to cover. Hint enumerates the full
// 1.2 appliance list including forward/reverse/transparent proxy types
// and load-balancer algorithms.
// ══════════════════════════════════════════════════════════════════════

test('v4.57.3 topicHints: entry exists for "Network Appliances & Device Functions"',
  /'Network Appliances & Device Functions':\s*'Load balancers/.test(js));
test('v4.57.3 topicHints: covers all 3 proxy types (forward, reverse, transparent)',
  /forward proxy[\s\S]{0,200}reverse proxy[\s\S]{0,200}transparent proxy/i.test(js));
test('v4.57.3 topicHints: covers load-balancer algorithms (round-robin, least-connections)',
  /round-robin[\s\S]{0,100}least-connections/i.test(js));
test('v4.57.3 topicHints: covers IDS/IPS/NIDS/NIPS distinctions',
  /IDS\/IPS\/NIDS\/NIPS/.test(js));
test('v4.57.3 topicHints: covers NGFW + UTM distinction',
  /NGFW[\s\S]{0,100}UTM/.test(js) || /Next-Generation Firewall \(NGFW\)[\s\S]{0,200}UTM/.test(js));
test('v4.57.3 topicHints: mentions wireless LAN controller (WLC) explicitly',
  /Wireless LAN Controller|WLC/.test(js));

// Behavioural — simulate the prompt generation for this topic, verify the
// hint actually lands in the prompt text via the "Specifically cover:" path
(function testTopicHintWired() {
  try {
    // The fetchQuestions body uses: topicHints[qTopic] ? ' Specifically cover: ' + topicHints[qTopic] : ''
    // So we just need to verify topicHints['Network Appliances & Device Functions'] evaluates truthy + contains 'proxy'
    const match = js.match(/'Network Appliances & Device Functions':\s*'([^']+)'/);
    if (!match) { test('v4.57.3 sandbox: hint text extracted', false); return; }
    test('v4.57.3 sandbox: hint text extracted', true);
    const hintText = match[1];
    test('v4.57.3 sandbox: hint is non-trivial (>100 chars)',
      hintText.length > 100);
    test('v4.57.3 sandbox: hint mentions proxy',
      /proxy/i.test(hintText));
    test('v4.57.3 sandbox: hint mentions load balancer',
      /load balancer/i.test(hintText));
    test('v4.57.3 sandbox: hint mentions IDS or IPS',
      /IDS|IPS/.test(hintText));
  } catch (e) {
    test('v4.57.3 sandbox: hint extraction executes without error', false);
  }
})();

// ══════════════════════════════════════════════════════════════════════
// v4.57.4 — _filterHistoryByTopic helper for pre-v4.57.1 sentinel entries
// User spotted Study Plan still showing "Never studied" for topics they'd
// studied via a multi-topic quiz before v4.57.1. v4.57.1 fixed the SAVE
// path (per-topic entries) but couldn't retroactively split existing
// sentinel entries. This helper fixes the READ path across 4 surfaces so
// old "Multi: A, B, C" entries retroactively credit each constituent topic.
// ══════════════════════════════════════════════════════════════════════

test('v4.57.4 JS: _filterHistoryByTopic helper defined',
  /function\s+_filterHistoryByTopic\s*\(history,\s*topic\)/.test(js));
test('v4.57.4 JS: helper handles exact-match case (post-v4.57.1 entries)',
  /if\s*\(e\.topic === topic\)\s*return true/.test(js));
test('v4.57.4 JS: helper handles Multi: sentinel case (pre-v4.57.1 entries)',
  // v4.81.19: window widened (200→500, 100→300) because comma-safe parser
  // wraps the legacy split(',') in a ternary fallback. The .includes(topic)
  // check is now on a `list.includes(...)` call instead of inline.
  /e\.topic\.startsWith\(['"]Multi: ['"]\)[\s\S]{0,500}\.split\(['"],['"]\)[\s\S]{0,300}\.includes\(topic\)/.test(js));

// Apply-site checks — all 4 exact-match sites should now use the helper
test('v4.57.4 JS: _scoreTopicNeed (Study Plan) uses _filterHistoryByTopic',
  /function _scoreTopicNeed[\s\S]{0,300}_filterHistoryByTopic\(historyEntries,\s*topic\)/.test(js));
test('v4.57.4 JS: _buildProgressRows (Topic Progress) uses _filterHistoryByTopic',
  /_filterHistoryByTopic\(h,\s*t\)[\s\S]{0,200}domainKey = TOPIC_DOMAINS/.test(js));
// v4.88.2: cert-aware domainOrder block pushed _filterHistoryByTopic past 400 chars.
test('v4.57.4 JS: _computeConstellationData (Analytics constellation) uses _filterHistoryByTopic',
  /_computeConstellationData[\s\S]{0,800}_filterHistoryByTopic\(h,\s*topic\)/.test(js));
test('v4.57.4 JS: domain drill-down uses _filterHistoryByTopic',
  /topicsInDomain\.forEach[\s\S]{0,200}_filterHistoryByTopic\(h,\s*t\)/.test(js));

// Behavioural — vm-sandbox the helper with the exact user scenario
(function testHistoryMatcher() {
  try {
    const vm = require('vm');
    const bodyMatch = js.match(/function\s+_filterHistoryByTopic\s*\(history,\s*topic\)\s*\{([\s\S]*?)\n\}/);
    if (!bodyMatch) { test('v4.57.4 sandbox: helper body extracted', false); return; }
    test('v4.57.4 sandbox: helper body extracted', true);

    const ctx = {};
    vm.createContext(ctx);
    const fn = vm.runInContext(`(function(history, topic) {${bodyMatch[1]}})`, ctx);

    // Simulate the user's exact history: one pre-v4.57.1 multi-topic entry
    const history = [
      { date: '2026-04-21T09:00:00Z', topic: 'Multi: Connection Issues, Perf Issues, Service Issues', score: 15, total: 20, pct: 75, mode: 'quiz' },
      { date: '2026-04-20T10:00:00Z', topic: 'OSPF', score: 7, total: 10, pct: 70, mode: 'quiz' },  // regular single-topic
    ];

    // All three constituent topics should now match the sentinel entry
    test('v4.57.4 sandbox: Connection Issues matches pre-v4.57.1 sentinel entry',
      fn(history, 'Connection Issues').length === 1);
    test('v4.57.4 sandbox: Perf Issues matches pre-v4.57.1 sentinel entry',
      fn(history, 'Perf Issues').length === 1);
    test('v4.57.4 sandbox: Service Issues matches pre-v4.57.1 sentinel entry',
      fn(history, 'Service Issues').length === 1);

    // Single-topic entry should still match exact
    test('v4.57.4 sandbox: OSPF (single-topic) matches via exact path',
      fn(history, 'OSPF').length === 1);

    // Unrelated topic should NOT match
    test('v4.57.4 sandbox: unrelated topic (VLAN Trunking) returns no matches',
      fn(history, 'VLAN Trunking').length === 0);

    // Mixed history: sentinel + new-style per-topic entries both present
    const mixedHistory = [
      { topic: 'Multi: Connection Issues, Perf Issues', score: 10, total: 15, pct: 67 },  // old style
      { topic: 'Perf Issues', score: 8, total: 10, pct: 80, multi: true },  // new style (post-v4.57.1)
      { topic: 'Perf Issues', score: 7, total: 10, pct: 70 },  // dedicated single-topic session
    ];
    test('v4.57.4 sandbox: mixed history — Perf Issues gets all 3 matching entries',
      fn(mixedHistory, 'Perf Issues').length === 3);
    test('v4.57.4 sandbox: mixed history — Connection Issues only gets the sentinel',
      fn(mixedHistory, 'Connection Issues').length === 1);

    // Edge cases
    test('v4.57.4 sandbox: empty history returns empty array',
      fn([], 'Any Topic').length === 0);
    test('v4.57.4 sandbox: null history returns empty array (defensive)',
      fn(null, 'Any Topic').length === 0);
    test('v4.57.4 sandbox: empty topic returns empty array (defensive)',
      fn(history, '').length === 0);
    test('v4.57.4 sandbox: entries with missing/non-string topic are skipped',
      fn([{ topic: null }, { topic: 123 }, { topic: 'OSPF' }], 'OSPF').length === 1);

    // Multi-topic parse robustness — whitespace tolerance
    test('v4.57.4 sandbox: "Multi: A, B, C" with inconsistent spaces still splits correctly',
      fn([{ topic: 'Multi: A,B , C  , D' }], 'C').length === 1 &&
      fn([{ topic: 'Multi: A,B , C  , D' }], 'D').length === 1);

    // Word-boundary — "Multi: Connection" topic shouldn't partial-match "Connection Issues"
    test('v4.57.4 sandbox: substring-not-identical — "Connection" topic does NOT match "Connection Issues" sentinel entry',
      fn([{ topic: 'Multi: Connection Issues, Perf Issues' }], 'Connection').length === 0);
  } catch (e) {
    test('v4.57.4 sandbox: helper executes without error', false);
  }
})();

// ══════════════════════════════════════════════════════════════════════
// v4.59.7 — 5th read-path fix: computeWeakSpotScores history loop
// User reported Service/Perf/Connection Issues greyed out on the home
// page domain grid despite having studied them. Root cause: pre-v4.57.1
// multi-topic sessions saved with sentinel "Multi: A, B, C" were not
// being credited to the constituent topics by computeWeakSpotScores'
// history loop (which uses e.topic directly as a key). v4.57.4 fixed
// 4 read paths via _filterHistoryByTopic but weak-spot scoring was
// explicitly NOT touched — that rationale (wrong-bank attribution) was
// incomplete because the scoring also reads history. This ship adds a
// sibling helper _expandHistoryForWeakSpots that splits sentinel rows
// into per-topic rows before the aggregate loop sees them.
// ══════════════════════════════════════════════════════════════════════

test('v4.59.7 JS: _expandHistoryForWeakSpots helper defined',
  /function\s+_expandHistoryForWeakSpots\s*\(hist\)/.test(js));
test('v4.59.7 JS: helper splits Multi: sentinel rows across constituent topics',
  /_expandHistoryForWeakSpots[\s\S]{0,1200}topics\.forEach\(t\s*=>\s*\{[\s\S]{0,300}topic:\s*t,\s*score:\s*scoreEach,\s*total:\s*totalEach/.test(js));
test('v4.59.7 JS: computeWeakSpotScores routes raw history through _expandHistoryForWeakSpots',
  /function computeWeakSpotScores[\s\S]{0,500}const\s+hist\s*=\s*_expandHistoryForWeakSpots\(rawHist\)/.test(js));

// Behavioural — vm-sandbox the expander with the exact user scenario
(function testHistoryExpander() {
  try {
    const vm = require('vm');
    const bodyMatch = js.match(/function\s+_expandHistoryForWeakSpots\s*\(hist\)\s*\{([\s\S]*?)\n\}/);
    if (!bodyMatch) { test('v4.59.7 sandbox: expander body extracted', false); return; }
    test('v4.59.7 sandbox: expander body extracted', true);

    const ctx = {};
    vm.createContext(ctx);
    const fn = vm.runInContext(`(function(hist) {${bodyMatch[1]}})`, ctx);

    // User's exact scenario: one pre-v4.57.1 multi-topic session with
    // Service/Perf/Connection Issues. Expander should split this into 3
    // per-topic rows with score/total divided by 3 each.
    const history = [
      { date: '2026-04-19T09:00:00Z', topic: 'Multi: Connection Issues, Perf Issues, Service Issues', score: 15, total: 20, pct: 75, mode: 'quiz' },
      { date: '2026-04-20T10:00:00Z', topic: 'OSPF', score: 7, total: 10, pct: 70, mode: 'quiz' },
    ];

    const expanded = fn(history);
    test('v4.59.7 sandbox: 3-topic sentinel + 1 plain = 4 output rows',
      expanded.length === 4);
    test('v4.59.7 sandbox: sentinel row split into 3 per-topic rows',
      expanded.filter(e => e._fromMultiSentinel).length === 3);
    test('v4.59.7 sandbox: Connection Issues present in expanded output',
      expanded.some(e => e.topic === 'Connection Issues' && e._fromMultiSentinel));
    test('v4.59.7 sandbox: Perf Issues present in expanded output',
      expanded.some(e => e.topic === 'Perf Issues' && e._fromMultiSentinel));
    test('v4.59.7 sandbox: Service Issues present in expanded output',
      expanded.some(e => e.topic === 'Service Issues' && e._fromMultiSentinel));
    test('v4.59.7 sandbox: each split row credits 1/3 of original score (15/3 = 5)',
      expanded.filter(e => e._fromMultiSentinel).every(e => e.score === 5));
    test('v4.59.7 sandbox: each split row credits 1/3 of original total (20/3)',
      expanded.filter(e => e._fromMultiSentinel).every(e => Math.abs(e.total - 20 / 3) < 0.001));
    test('v4.59.7 sandbox: plain OSPF row passes through unchanged',
      expanded.some(e => e.topic === 'OSPF' && e.score === 7 && e.total === 10 && !e._fromMultiSentinel));
    // Sum invariant: score and total across all expanded rows equals the original totals
    test('v4.59.7 sandbox: sum of expanded scores equals sum of originals (invariant)',
      Math.abs(expanded.reduce((a, e) => a + (e.score || 0), 0) - 22) < 0.001);
    test('v4.59.7 sandbox: sum of expanded totals equals sum of originals (invariant)',
      Math.abs(expanded.reduce((a, e) => a + (e.total || 0), 0) - 30) < 0.001);

    // Defensive edge cases
    test('v4.59.7 sandbox: empty history returns empty array',
      fn([]).length === 0);
    test('v4.59.7 sandbox: null history returns empty array (defensive)',
      fn(null).length === 0);
    test('v4.59.7 sandbox: entry with no topic passes through unchanged',
      fn([{ score: 5, total: 10 }]).length === 1);
    test('v4.59.7 sandbox: Multi: with no topics after parse passes through',
      fn([{ topic: 'Multi: ', score: 5, total: 10 }]).length === 1);
    test('v4.59.7 sandbox: Multi: with 1 topic gives full credit to that topic',
      (() => {
        const r = fn([{ topic: 'Multi: OSPF', score: 6, total: 10 }]);
        return r.length === 1 && r[0].topic === 'OSPF' && r[0].score === 6 && r[0].total === 10;
      })());
  } catch (e) {
    test('v4.59.7 sandbox: expander executes without error', false);
  }
})();

// ══════════════════════════════════════════════════════════════════════
// v4.60.0 — Topology Builder Live Protocol Inspector (issue #184)
// Clicking a device now shows live protocol state in the floating
// popup: routing / ARP / MAC / DHCP in a 4-section accordion. Rows
// flash on insert. Role-aware: switches show MAC tables, routers show
// routing + ARP, DHCP servers show pool config. Inapplicable sections
// render as friendly redirect stubs ("click a switch to see MAC table").
// Refreshed via tbSaveDraft() hook on every state mutation so pings
// populate ARP live.
// ══════════════════════════════════════════════════════════════════════


test('v4.60.0 CSS: accordion section + editorial head styles defined',
  /\.tb-insp-acc-section\s*\{/.test(css) &&
  /\.tb-insp-eyebrow\s*\{/.test(css) &&
  /\.tb-insp-title\s*\{/.test(css));
test('v4.60.0 CSS: row-flash keyframe animation defined',
  /@keyframes\s+tbInspRowFlash/.test(css) &&
  /tb-insp-row-flash\s+td\s*\{[\s\S]*?animation:\s*tbInspRowFlash/.test(css));
test('v4.60.0 CSS: reduced-motion neutralises row-flash',
  /prefers-reduced-motion[\s\S]{0,400}tb-insp-row-flash\s+td\s*\{\s*animation:\s*none/.test(css));
test('v4.60.0 CSS: light-theme overrides for inspector defined',
  /\[data-theme="light"\]\s+\.tb-insp-eyebrow/.test(css) &&
  /\[data-theme="light"\]\s+\.tb-insp-cell-iface/.test(css));
test('v4.60.0 CSS: inapplicable + empty stub styles defined',
  /\.tb-insp-inapplicable\s*\{/.test(css) &&
  /\.tb-insp-empty\s*\{/.test(css));

// Behavioural: vm-sandbox the pure table renderers against fixtures
(function testInspRenderers() {
  try {
    const vm = require('vm');
    const bodies = {};
    ['_tbRenderInspRouting', '_tbRenderInspArp', '_tbRenderInspMac', '_tbRenderInspDhcp'].forEach(fnName => {
      const m = js.match(new RegExp('function\\s+' + fnName + '\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}', ''));
      if (m) bodies[fnName] = m[1];
    });
    const inspAccBody = js.match(/function\s+_tbInspAccSection\s*\(icon,\s*label,\s*count,\s*bodyHtml\)\s*\{([\s\S]*?)\n\}/);
    const inspInapplicableBody = js.match(/function\s+_tbInspInapplicable\s*\(text\)\s*\{([\s\S]*?)\n\}/);
    const inspEmptyBody = js.match(/function\s+_tbInspEmpty\s*\(msg\)\s*\{([\s\S]*?)\n\}/);
    const inspRowClassBody = js.match(/function\s+_tbInspRowClass\s*\(isFlashing\)\s*\{([\s\S]*?)\n\}/);
    const inspEscBody = js.match(/function\s+_tbInspEsc\s*\(s\)\s*\{([\s\S]*?)\n\}/);

    if (!bodies._tbRenderInspArp || !bodies._tbRenderInspMac || !bodies._tbRenderInspRouting || !bodies._tbRenderInspDhcp || !inspAccBody || !inspInapplicableBody || !inspEmptyBody || !inspRowClassBody || !inspEscBody) {
      return;
    }

    const ctx = {};
    vm.createContext(ctx);
    // Stub escHtml (the renderers defer to _tbInspEsc which falls back to String)
    vm.runInContext(`function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }`, ctx);
    vm.runInContext(`function _tbInspEsc(s) {${inspEscBody[1]}}`, ctx);
    vm.runInContext(`function _tbInspRowClass(isFlashing) {${inspRowClassBody[1]}}`, ctx);
    vm.runInContext(`function _tbInspAccSection(icon, label, count, bodyHtml) {${inspAccBody[1]}}`, ctx);
    vm.runInContext(`function _tbInspInapplicable(text) {${inspInapplicableBody[1]}}`, ctx);
    vm.runInContext(`function _tbInspEmpty(msg) {${inspEmptyBody[1]}}`, ctx);
    vm.runInContext(`function _tbRenderInspRouting(dev, flashKeys) {${bodies._tbRenderInspRouting}}`, ctx);
    vm.runInContext(`function _tbRenderInspArp(dev, flashKeys) {${bodies._tbRenderInspArp}}`, ctx);
    vm.runInContext(`function _tbRenderInspMac(dev, flashKeys) {${bodies._tbRenderInspMac}}`, ctx);
    vm.runInContext(`function _tbRenderInspDhcp(dev) {${bodies._tbRenderInspDhcp}}`, ctx);

    // ── ARP renderer ──
    const arpDev = {
      arpTable: [
        { ip: '10.0.1.10', mac: 'aa:bb:cc:00:01:0a', iface: 'eth0', age: 42 },
        { ip: '10.0.254.2', mac: 'aa:bb:cc:fe:00:02', iface: 'eth1', age: 0 }
      ]
    };
    const arpHtml = vm.runInContext('_tbRenderInspArp(dev, null)', Object.assign(ctx, { dev: arpDev }));
    // HTML has 1 header row in thead + N data rows in tbody. Count tbody rows only.
    const arpTbodyRows = (arpHtml.match(/<tbody>([\s\S]*?)<\/tbody>/) || [])[1] || '';
    test('v4.60.0 sandbox: ARP renderer emits one row per entry',
      (arpTbodyRows.match(/<tr\b/g) || []).length === 2);
    test('v4.60.0 sandbox: ARP renderer shows IP + MAC + iface',
      arpHtml.includes('10.0.1.10') && arpHtml.includes('aa:bb:cc:00:01:0a') && arpHtml.includes('eth0'));

    // ── ARP with flashKeys: second row flashes ──
    const flashSet = new Set(['10.0.254.2|aa:bb:cc:fe:00:02']);
    vm.runInContext('dev = arpDev; flashSet = new Set(["10.0.254.2|aa:bb:cc:fe:00:02"]);', Object.assign(ctx, { arpDev, flashSet }));
    const arpFlashHtml = vm.runInContext('_tbRenderInspArp(arpDev, flashSet)', ctx);
    test('v4.60.0 sandbox: ARP row matching flashKey gets tb-insp-row-flash class',
      arpFlashHtml.includes('tb-insp-row-flash'));
    test('v4.60.0 sandbox: ARP row matching flashKey shows Learned label',
      arpFlashHtml.includes('tb-insp-learned'));
    test('v4.60.0 sandbox: ARP row NOT in flashKey does not flash',
      (arpFlashHtml.match(/tb-insp-row-flash/g) || []).length === 1);

    // ── ARP empty state ──
    const arpEmpty = vm.runInContext('_tbRenderInspArp({arpTable: []}, null)', ctx);
    test('v4.60.0 sandbox: ARP empty state friendly message',
      arpEmpty.includes('tb-insp-empty') && arpEmpty.includes('Send a ping'));

    // ── MAC renderer ──
    const macDev = {
      macTable: [
        { mac: 'aa:bb:cc:00:01:0a', vlan: 10, port: 'Gi0/1' },
        { mac: 'aa:bb:cc:00:01:0b', vlan: 10, port: 'Gi0/2' }
      ]
    };
    const macHtml = vm.runInContext('_tbRenderInspMac(macDev, null)', Object.assign(ctx, { macDev }));
    const macTbodyRows = (macHtml.match(/<tbody>([\s\S]*?)<\/tbody>/) || [])[1] || '';
    test('v4.60.0 sandbox: MAC renderer emits one row per entry',
      (macTbodyRows.match(/<tr\b/g) || []).length === 2);
    test('v4.60.0 sandbox: MAC renderer shows vlan + port',
      macHtml.includes('Gi0/1') && macHtml.includes('10'));

    // ── Routing renderer with 2 connected + 1 static ──
    const rtrDev = {
      routingTable: [
        { destination: '10.0.1.0', mask: 24, interface: 'eth0', source: 'C' },
        { destination: '10.0.2.0', mask: 24, nextHop: '10.0.254.2', interface: 'eth1', source: 'S' }
      ]
    };
    const rtrHtml = vm.runInContext('_tbRenderInspRouting(rtrDev, null)', Object.assign(ctx, { rtrDev }));
    test('v4.60.0 sandbox: routing renderer shows connected vs static distinction',
      rtrHtml.includes('connected') && rtrHtml.includes('10.0.254.2'));

    // ── DHCP renderer with pool config ──
    const dhcpDev = {
      dhcpServer: { name: 'LAN_POOL', network: '10.0.1.0', mask: '255.255.255.0',
                    gateway: '10.0.1.1', rangeStart: '10.0.1.100', rangeEnd: '10.0.1.200', dns: '1.1.1.1' }
    };
    const dhcpHtml = vm.runInContext('_tbRenderInspDhcp(dhcpDev)', Object.assign(ctx, { dhcpDev }));
    test('v4.60.0 sandbox: DHCP renderer shows pool network + range + gateway',
      dhcpHtml && dhcpHtml.includes('10.0.1.0') && dhcpHtml.includes('10.0.1.100') && dhcpHtml.includes('10.0.1.1'));

    // ── DHCP returns null when no pool configured ──
    const dhcpNull = vm.runInContext('_tbRenderInspDhcp({dhcpServer: null})', ctx);
    test('v4.60.0 sandbox: DHCP renderer returns null on non-DHCP device (renderer contract)',
      dhcpNull === null);

    // ── Inapplicable stub ──
    const inapp = vm.runInContext('_tbInspInapplicable("Not applicable — click a switch")', ctx);
    test('v4.60.0 sandbox: inapplicable stub emits friendly styled message',
      inapp.includes('tb-insp-inapplicable') && inapp.includes('Not applicable'));
  } catch (e) {
    test('v4.60.0 sandbox: all renderers executed without error', false);
  }
})();

// ══════════════════════════════════════════════════════════════════════
// v4.60.1 — TB side-pane collapse/expand toggles
// User polish ask after v4.60.0: make the left device palette AND the
// right scenarios pane collapsible so the canvas can reclaim space when
// working on a big topology. State persists per-pane via localStorage
// (STORAGE.TB_LEFT_COLLAPSED / STORAGE.TB_RIGHT_COLLAPSED).
// ══════════════════════════════════════════════════════════════════════

test('v4.60.1 STORAGE: TB_LEFT_COLLAPSED key defined',
  /TB_LEFT_COLLAPSED:\s*['"]nplus_tb_left_collapsed['"]/.test(js));
test('v4.60.1 STORAGE: TB_RIGHT_COLLAPSED key defined',
  /TB_RIGHT_COLLAPSED:\s*['"]nplus_tb_right_collapsed['"]/.test(js));


test('v4.60.1 CSS: collapsed grid-template-columns defined for .tb-left-collapsed',
  /\.tb-workspace\.tb-workspace-v3\.tb-left-collapsed\s*\{[\s\S]{0,200}grid-template-columns:\s*36px/.test(css));
test('v4.60.1 CSS: collapsed grid-template-columns defined for .tb-right-collapsed',
  /\.tb-workspace\.tb-workspace-v3\.tb-right-collapsed\s*\{[\s\S]{0,200}grid-template-columns:\s*260px[\s\S]{0,50}36px/.test(css));
test('v4.60.1 CSS: both-collapsed grid-template-columns defined',
  /tb-left-collapsed\.tb-right-collapsed[\s\S]{0,200}grid-template-columns:\s*36px\s+minmax\(0,\s*1fr\)\s+36px/.test(css));
test('v4.60.1 CSS: .tb-pane-collapse-btn styled as accent chip',
  /\.tb-pane-collapse-btn\s*\{[\s\S]{0,400}position:\s*absolute/.test(css));
test('v4.60.1 CSS: chevron rotates 180deg when pane is collapsed',
  /tb-left-collapsed\s+#tb-palette-collapse-btn\s*\{\s*transform:\s*rotate\(180deg\)/.test(css) &&
  /tb-right-collapsed\s+#tb-right-collapse-btn\s*\{\s*transform:\s*rotate\(180deg\)/.test(css));
test('v4.60.1 CSS: rail label uses vertical writing-mode, shown only when collapsed',
  /\.tb-pane-rail-label\s*\{[\s\S]{0,400}writing-mode:\s*vertical-rl/.test(css) &&
  /tb-left-collapsed[\s\S]{0,200}tb-pane-rail-label[\s\S]{0,100}display:\s*block/.test(css));
test('v4.60.1 CSS: pane content hides when collapsed (not(.tb-pane-collapse-btn):not(.tb-pane-rail-label))',
  /tb-left-collapsed[\s\S]{0,200}#tb-palette\s*>\s*\*:not\(\.tb-pane-collapse-btn\):not\(\.tb-pane-rail-label\)[\s\S]{0,200}display:\s*none/.test(css));
test('v4.60.1 CSS: grid-columns transition defined for smooth collapse/expand',
  /\.tb-workspace\.tb-workspace-v3\s*\{[\s\S]{0,400}transition:\s*grid-template-columns\s+280ms/.test(css));
test('v4.60.1 CSS: reduced-motion neutralises transitions on workspace + collapse btn',
  /prefers-reduced-motion[\s\S]{0,400}tb-workspace\.tb-workspace-v3[\s\S]{0,100}transition:\s*none/.test(css));
test('v4.60.1 CSS: light-theme overrides collapse button + rail hover colors',
  /\[data-theme="light"\]\s+\.tb-pane-collapse-btn/.test(css) &&
  /\[data-theme="light"\]\s+\.tb-pane-rail-label:hover/.test(css));

// Behavioural — vm-sandbox the toggle functions against a fake DOM + localStorage
(function testPaneToggle() {
  try {
    const vm = require('vm');
    const toggleLeftBody = js.match(/function\s+tbTogglePalette\s*\(\)\s*\{([\s\S]*?)\n\}/);
    const toggleRightBody = js.match(/function\s+tbToggleScenarios\s*\(\)\s*\{([\s\S]*?)\n\}/);
    const initBody = js.match(/function\s+tbInitPaneCollapseState\s*\(\)\s*\{([\s\S]*?)\n\}/);
    if (!toggleLeftBody || !toggleRightBody || !initBody) {
      return;
    }

    // Fake DOM + localStorage
    const fakeStore = {};
    const ctx = {
      STORAGE: { TB_LEFT_COLLAPSED: 'nplus_tb_left_collapsed', TB_RIGHT_COLLAPSED: 'nplus_tb_right_collapsed' },
      localStorage: {
        getItem: k => fakeStore[k] === undefined ? null : fakeStore[k],
        setItem: (k, v) => { fakeStore[k] = v; },
        removeItem: k => { delete fakeStore[k]; }
      },
      document: {
        getElementById: id => {
          if (id === 'tb-workspace-v3') {
            return ctx._ws;
          }
          return null; // buttons not needed for core test
        }
      }
    };
    // Fake workspace element with classList
    const classes = new Set();
    ctx._ws = {
      classList: {
        toggle: c => { if (classes.has(c)) classes.delete(c); else classes.add(c); },
        add: c => classes.add(c),
        remove: c => classes.delete(c),
        contains: c => classes.has(c)
      }
    };
    vm.createContext(ctx);
    vm.runInContext(`function tbTogglePalette() {${toggleLeftBody[1]}}`, ctx);
    vm.runInContext(`function tbToggleScenarios() {${toggleRightBody[1]}}`, ctx);
    vm.runInContext(`function tbInitPaneCollapseState() {${initBody[1]}}`, ctx);

    // Initially no classes
    test('v4.60.1 sandbox: workspace starts with no collapse classes',
      !classes.has('tb-left-collapsed') && !classes.has('tb-right-collapsed'));

    // Toggle left → adds class + persists '1'
    vm.runInContext('tbTogglePalette()', ctx);
    test('v4.60.1 sandbox: tbTogglePalette adds .tb-left-collapsed',
      classes.has('tb-left-collapsed'));
    test('v4.60.1 sandbox: tbTogglePalette persists "1" to TB_LEFT_COLLAPSED',
      fakeStore['nplus_tb_left_collapsed'] === '1');

    // Toggle right → adds class + persists
    vm.runInContext('tbToggleScenarios()', ctx);
    test('v4.60.1 sandbox: tbToggleScenarios adds .tb-right-collapsed',
      classes.has('tb-right-collapsed'));
    test('v4.60.1 sandbox: tbToggleScenarios persists "1" to TB_RIGHT_COLLAPSED',
      fakeStore['nplus_tb_right_collapsed'] === '1');

    // Toggle left again → removes class + persists '0'
    vm.runInContext('tbTogglePalette()', ctx);
    test('v4.60.1 sandbox: toggling left again removes .tb-left-collapsed',
      !classes.has('tb-left-collapsed'));
    test('v4.60.1 sandbox: toggling left again persists "0"',
      fakeStore['nplus_tb_left_collapsed'] === '0');

    // Init reads persisted state on fresh mount: left='1', right='0'
    classes.clear();
    fakeStore['nplus_tb_left_collapsed'] = '1';
    fakeStore['nplus_tb_right_collapsed'] = '0';
    vm.runInContext('tbInitPaneCollapseState()', ctx);
    test('v4.60.1 sandbox: init applies .tb-left-collapsed when persisted state is "1"',
      classes.has('tb-left-collapsed'));
    test('v4.60.1 sandbox: init does NOT apply .tb-right-collapsed when persisted is "0"',
      !classes.has('tb-right-collapsed'));

    // Init when both set
    classes.clear();
    fakeStore['nplus_tb_left_collapsed'] = '1';
    fakeStore['nplus_tb_right_collapsed'] = '1';
    vm.runInContext('tbInitPaneCollapseState()', ctx);
    test('v4.60.1 sandbox: init applies both collapse classes when both persisted',
      classes.has('tb-left-collapsed') && classes.has('tb-right-collapsed'));

    // Init when neither set (fresh first visit)
    classes.clear();
    delete fakeStore['nplus_tb_left_collapsed'];
    delete fakeStore['nplus_tb_right_collapsed'];
    vm.runInContext('tbInitPaneCollapseState()', ctx);
    test('v4.60.1 sandbox: init leaves classes off on first visit (no persisted state)',
      !classes.has('tb-left-collapsed') && !classes.has('tb-right-collapsed'));
  } catch (e) {
    test('v4.60.1 sandbox: toggle logic executed without error', false);
  }
})();

// ══════════════════════════════════════════════════════════════════════
// v4.61.0 — TB Per-Hop Packet Trace (issue #185)
// Click Trace pill → opens dialog → computes hop-by-hop trace via pure
// tbComputeTrace function → renders floating log panel + canvas packet
// pill + inline frame badge → auto-plays at 1500ms/hop. Each hop emits
// L2/L3/ARP/DELIVER/FAIL layer + decision copy + frame metadata
// (src/dst MAC, src/dst IP, TTL before/after, outIface, next-hop).
// ══════════════════════════════════════════════════════════════════════


test('v4.61.0 CSS: .tb-trace-panel styled + positioned absolutely over canvas',
  /\.tb-trace-panel\s*\{[\s\S]{0,400}position:\s*absolute/.test(css));
test('v4.61.0 CSS: hop layer chips styled for L2/L3/ARP/FAIL variants',
  /\.tb-trace-hop-layer-l2\s*\{/.test(css) &&
  /\.tb-trace-hop-layer-l3\s*\{/.test(css) &&
  /\.tb-trace-hop-layer-arp\s*\{/.test(css) &&
  /\.tb-trace-hop-layer-fail\s*\{/.test(css));
test('v4.61.0 CSS: current hop dot has pulse animation',
  /@keyframes\s+tbTraceCurrentPulse/.test(css) &&
  /tb-trace-hop-current\s+\.tb-trace-hop-dot[\s\S]{0,200}animation:\s*tbTraceCurrentPulse/.test(css));
test('v4.61.0 CSS: packet pill overlay with yellow fill + pulse animation',
  /\.tb-trace-packet\s*\{[\s\S]{0,200}fill:\s*#fbbf24/.test(css) &&
  /@keyframes\s+tbTracePacketPulse/.test(css));
test('v4.61.0 CSS: in-flight badge background + arrow + row text styles',
  /\.tb-trace-badge-bg\s*\{/.test(css) &&
  /\.tb-trace-badge-arrow\s*\{/.test(css) &&
  /\.tb-trace-badge-key\s*\{/.test(css) &&
  /\.tb-trace-badge-val\s*\{/.test(css));
test('v4.61.0 CSS: failure badge variant uses red stroke',
  /\.tb-trace-badge-bg-fail\s*\{[\s\S]{0,200}stroke:\s*#f87171/.test(css));
test('v4.61.0 CSS: device states (visited green / current pulse / pending dim) defined',
  /data-tb-device\]\.tb-trace-visited[\s\S]{0,400}stroke:\s*#4ade80/.test(css) &&
  /data-tb-device\]\.tb-trace-current[\s\S]{0,400}tbTraceNodeCurrentPulse/.test(css) &&
  /data-tb-device\]\.tb-trace-pending\s*\{[\s\S]{0,100}opacity:\s*0\.45/.test(css));
test('v4.61.0 CSS: reduced-motion neutralises trace animations',
  /prefers-reduced-motion[\s\S]{0,1000}tb-trace-packet[\s\S]{0,200}animation:\s*none/.test(css));
test('v4.61.0 CSS: light-theme overrides for trace panel + eyebrow + layer chips',
  /\[data-theme="light"\]\s+\.tb-trace-panel/.test(css) &&
  /\[data-theme="light"\]\s+\.tb-trace-eyebrow/.test(css));

// Behavioural: sandbox tbComputeTrace with a 3-device topology and assert
// the hop sequence + metadata look right.
(function testTraceComputation() {
  try {
    const vm = require('vm');
    // Match from the `{` of the function up to its column-0 `}` that closes it.
    // tbComputeTrace's closing brace is the first `}` on a line by itself.
    const body = js.match(/function\s+tbComputeTrace\s*\(state,\s*srcDeviceId,\s*dstIp,\s*maxTtl\)\s*\{([\s\S]*?)\n\}\n/);
    if (!body) {
      return;
    }

    const ctx = {};
    vm.createContext(ctx);
    // Minimal IP helper stubs — avoid chaining through the whole tbIpToArr/
    // tbArrToIp chain in app.js; self-contained implementations suffice for
    // the sandbox fixture. Fixture pre-populates ARP caches so the broadcast-
    // domain search path is a no-op stub (returns empty domain).
    vm.runInContext(`
      function tbIpToArr(ip) {
        if (!ip || typeof ip !== 'string') return null;
        const parts = ip.split('.').map(n => parseInt(n, 10));
        return parts.length === 4 && parts.every(p => !isNaN(p)) ? parts : null;
      }
      function tbArrToIp(arr) { return arr.join('.'); }
      function tbSubnetOf(ip, mask) {
        const ipA = tbIpToArr(ip), mA = tbIpToArr(mask);
        if (!ipA || !mA) return null;
        return tbArrToIp(ipA.map((o, i) => o & mA[i]));
      }
      function tbSameSubnet(ip1, ip2, mask) {
        return tbSubnetOf(ip1, mask) === tbSubnetOf(ip2, mask);
      }
      function tbMaskToCidr(mask) {
        const a = tbIpToArr(mask);
        if (!a) return 0;
        let bits = 0;
        for (const o of a) {
          for (let i = 7; i >= 0; i--) {
            if (o & (1 << i)) bits++; else return bits;
          }
        }
        return bits;
      }
      function tbGetBroadcastDomain(state, srcId, vlan) { return []; }
    `, ctx);
    vm.runInContext(`function tbComputeTrace(state, srcDeviceId, dstIp, maxTtl) {${body[1]}}`, ctx);

    // Host-A → Router-A → Host-B across two /24 subnets
    const state = {
      devices: [
        { id: 'hA', hostname: 'Host-A', type: 'host',
          interfaces: [{ name: 'eth0', ip: '10.0.1.10', mask: '255.255.255.0', mac: 'aa:bb:cc:00:01:10', enabled: true, gateway: '10.0.1.1' }],
          routingTable: [], arpTable: [{ ip: '10.0.1.1', mac: 'aa:bb:cc:00:01:01' }], macTable: []
        },
        { id: 'rA', hostname: 'Router-A', type: 'router',
          interfaces: [
            { name: 'eth0', ip: '10.0.1.1', mask: '255.255.255.0', mac: 'aa:bb:cc:00:01:01', enabled: true },
            { name: 'eth1', ip: '10.0.2.1', mask: '255.255.255.0', mac: 'aa:bb:cc:00:02:01', enabled: true }
          ],
          routingTable: [],
          arpTable: [{ ip: '10.0.2.20', mac: 'aa:bb:cc:00:02:20' }],
          macTable: []
        },
        { id: 'hB', hostname: 'Host-B', type: 'host',
          interfaces: [{ name: 'eth0', ip: '10.0.2.20', mask: '255.255.255.0', mac: 'aa:bb:cc:00:02:20', enabled: true, gateway: '10.0.2.1' }],
          routingTable: [], arpTable: [], macTable: []
        }
      ],
      cables: [
        { aDeviceId: 'hA', bDeviceId: 'rA', aIface: 'eth0', bIface: 'eth0' },
        { aDeviceId: 'rA', bDeviceId: 'hB', aIface: 'eth1', bIface: 'eth0' }
      ]
    };

    const result = vm.runInContext(`tbComputeTrace(${JSON.stringify(state)}, 'hA', '10.0.2.20', 64)`, ctx);
    test('v4.61.0 sandbox: trace returns hops array + success flag',
      Array.isArray(result.hops) && result.hops.length > 0 && typeof result.success === 'boolean');
    test('v4.61.0 sandbox: first hop is ARP at source (Host-A)',
      result.hops[0].layer === 'ARP' && result.hops[0].device === 'Host-A');
    test('v4.61.0 sandbox: first hop meta has src/dst IP + TTL=64',
      result.hops[0].meta && result.hops[0].meta.srcIp === '10.0.1.10' && result.hops[0].meta.dstIp === '10.0.2.20' && result.hops[0].meta.ttl === 64);
    test('v4.61.0 sandbox: middle hop is L3 at Router-A',
      result.hops.some(h => h.layer === 'L3' && h.device === 'Router-A'));
    const l3Hop = result.hops.find(h => h.layer === 'L3' && h.device === 'Router-A');
    test('v4.61.0 sandbox: L3 hop meta includes TTL decrement 64 → 63',
      l3Hop && l3Hop.meta.ttlBefore === 64 && l3Hop.meta.ttlAfter === 63);
    test('v4.61.0 sandbox: L3 hop meta shows src/dst MAC rewrite (contains arrow)',
      l3Hop && /→/.test(l3Hop.meta.srcMac) && /→/.test(l3Hop.meta.dstMac));
    test('v4.61.0 sandbox: final hop is DELIVER at Host-B',
      result.hops[result.hops.length - 1].layer === 'DELIVER' &&
      result.hops[result.hops.length - 1].device === 'Host-B');
    test('v4.61.0 sandbox: successful trace has success === true',
      result.success === true);
    test('v4.61.0 sandbox: path array includes all 3 devices in order',
      JSON.stringify(result.path) === JSON.stringify(['hA', 'rA', 'hB']));

    // ── Failure case: no route to unknown destination ──
    const failResult = vm.runInContext(`tbComputeTrace(${JSON.stringify(state)}, 'hA', '10.0.99.99', 64)`, ctx);
    test('v4.61.0 sandbox: unreachable destination produces failure hop',
      failResult.hops.some(h => h.layer === 'FAIL') && failResult.success === false);
    const failHop = failResult.hops.find(h => h.layer === 'FAIL');
    test('v4.61.0 sandbox: failure hop status is "fail" + includes reason string',
      failHop && failHop.status === 'fail' && typeof failHop.decision === 'string');

    // ── Missing source device ──
    const noSrc = vm.runInContext(`tbComputeTrace(${JSON.stringify(state)}, 'does-not-exist', '10.0.2.20', 64)`, ctx);
    test('v4.61.0 sandbox: missing source device produces single FAIL hop',
      noSrc.hops.length === 1 && noSrc.hops[0].layer === 'FAIL' && noSrc.success === false);
  } catch (e) {
    test('v4.61.0 sandbox: tbComputeTrace executed without error', false);
  }
})();

// ══════════════════════════════════════════════════════════════════════
// v4.62.0 — TB Spanning Tree Protocol Visualisation (issue #186)
// STP auto-enables on every L2 switch. tbComputeStpState elects a root
// bridge by lowest priority.MAC, runs BFS over switch-to-switch cables,
// assigns root/designated/blocked port roles per cable endpoint. Crown
// marker on root, red dashed cable on blocked segments, 800ms
// reconvergence pulse on switches whose role changed.
// ══════════════════════════════════════════════════════════════════════


test('v4.62.0 CSS: port dot role variants styled (root gold / designated green / blocked red)',
  /\.tb-stp-port-root[\s\S]{0,200}fill:\s*#f5b73b/.test(css) &&
  /\.tb-stp-port-designated[\s\S]{0,200}fill:\s*#4ade80/.test(css) &&
  /\.tb-stp-port-blocked[\s\S]{0,200}fill:\s*#f87171/.test(css));
test('v4.62.0 CSS: blocked cable stroke is red dashed via override',
  /\.tb-cable\.tb-cable-stp-blocked\s*\{[\s\S]{0,400}stroke:\s*#f87171[\s\S]{0,200}stroke-dasharray:/.test(css));
test('v4.62.0 CSS: root crown marker bg + label styled',
  /\.tb-stp-crown-bg\s*\{/.test(css) &&
  /\.tb-stp-crown-label\s*\{[\s\S]{0,200}fill:\s*#f5b73b/.test(css));
test('v4.62.0 CSS: blocked ✗ badge styled with red background + X strokes',
  /\.tb-stp-blocked-badge-bg\s*\{[\s\S]{0,200}stroke:\s*#f87171/.test(css) &&
  /\.tb-stp-blocked-badge-x\s*\{/.test(css));
test('v4.62.0 CSS: reconvergence pulse keyframe + rethink class defined',
  /@keyframes\s+tbStpRethink/.test(css) &&
  /data-tb-device\]\.tb-stp-rethink\s+circle[\s\S]{0,200}animation:\s*tbStpRethink/.test(css));
test('v4.62.0 CSS: reduced-motion neutralises rethink pulse',
  /prefers-reduced-motion[\s\S]{0,600}tb-stp-rethink\s+circle[\s\S]{0,100}animation:\s*none/.test(css));
test('v4.62.0 CSS: light-theme overrides crown + port dot stroke',
  /\[data-theme="light"\]\s+\.tb-stp-crown-bg/.test(css) &&
  /\[data-theme="light"\]\s+\.tb-stp-port-dot/.test(css));

// Behavioural: vm-sandbox tbComputeStpState against a 3-switch triangle +
// assert root election, root-port selection, and blocked-port logic.
(function testStpCompute() {
  try {
    const vm = require('vm');
    const body = js.match(/function\s+tbComputeStpState\s*\(state\)\s*\{([\s\S]*?)\n\}\n/);
    const bridgeMacBody = js.match(/function\s+_tbStpBridgeMac\s*\(dev\)\s*\{([\s\S]*?)\n\}/);
    const isSwitchBody = js.match(/function\s+_tbStpIsSwitch\s*\(dev\)\s*\{([\s\S]*?)\n\}/);
    const bridgeIdStrBody = js.match(/function\s+_tbStpBridgeIdStr\s*\(priority,\s*mac\)\s*\{([\s\S]*?)\n\}/);
    if (!body || !bridgeMacBody || !isSwitchBody || !bridgeIdStrBody) {
      return;
    }

    const ctx = {};
    vm.createContext(ctx);
    vm.runInContext(`function _tbStpBridgeMac(dev) {${bridgeMacBody[1]}}`, ctx);
    vm.runInContext(`function _tbStpIsSwitch(dev) {${isSwitchBody[1]}}`, ctx);
    vm.runInContext(`function _tbStpBridgeIdStr(priority, mac) {${bridgeIdStrBody[1]}}`, ctx);
    vm.runInContext(`function tbComputeStpState(state) {${body[1]}}`, ctx);

    // 3-switch triangle: SW-A / SW-B / SW-C all with default priority 32768.
    // MAC tiebreaker means SW-A (lowest MAC) becomes root.
    const state = {
      devices: [
        { id: 'swA', hostname: 'SW-A', type: 'switch', interfaces: [{ mac: '00:00:00:00:00:01' }] },
        { id: 'swB', hostname: 'SW-B', type: 'switch', interfaces: [{ mac: '00:00:00:00:00:02' }] },
        { id: 'swC', hostname: 'SW-C', type: 'switch', interfaces: [{ mac: '00:00:00:00:00:03' }] }
      ],
      cables: [
        { id: 'c-ab', from: 'swA', to: 'swB' },
        { id: 'c-ac', from: 'swA', to: 'swC' },
        { id: 'c-bc', from: 'swB', to: 'swC' }   // redundant — creates loop
      ]
    };

    const stp = vm.runInContext(`tbComputeStpState(${JSON.stringify(state)})`, ctx);
    test('v4.62.0 sandbox: converged flag set true',
      stp.converged === true);
    test('v4.62.0 sandbox: SW-A elected root (lowest MAC at default priority)',
      stp.rootId === 'swA' && stp.bridges.swA.isRoot === true);
    test('v4.62.0 sandbox: root cost-to-root is 0',
      stp.bridges.swA.costToRoot === 0);
    test('v4.62.0 sandbox: SW-B and SW-C each reach root in 1 hop',
      stp.bridges.swB.costToRoot === 1 && stp.bridges.swC.costToRoot === 1);
    test('v4.62.0 sandbox: exactly one cable is blocked (loop prevention)',
      stp.blockedCount === 1 && Object.values(stp.cables).filter(c => c.blocked).length === 1);

    // c-ab and c-ac are BFS-tree cables → one side root, other side designated
    test('v4.62.0 sandbox: SW-A ↔ SW-B cable forwarding (A designated, B root)',
      stp.cables['c-ab'].fromRole === 'designated' && stp.cables['c-ab'].toRole === 'root' &&
      stp.cables['c-ab'].blocked === false);
    test('v4.62.0 sandbox: SW-A ↔ SW-C cable forwarding (A designated, C root)',
      stp.cables['c-ac'].fromRole === 'designated' && stp.cables['c-ac'].toRole === 'root' &&
      stp.cables['c-ac'].blocked === false);

    // c-bc is the non-tree cable → one side blocked, the side with LOWER
    // bridge-ID wins designated. SW-B has lower MAC than SW-C.
    test('v4.62.0 sandbox: SW-B ↔ SW-C cable blocked (loop-prevention)',
      stp.cables['c-bc'].blocked === true);
    test('v4.62.0 sandbox: designated wins on lower-bridge-ID side (B); C blocks',
      stp.cables['c-bc'].fromRole === 'designated' && stp.cables['c-bc'].toRole === 'blocked');

    // ── Force root election via priority override ──
    const stateWithPriority = JSON.parse(JSON.stringify(state));
    stateWithPriority.devices[2].stpPriority = 4096;  // SW-C wins by low priority
    const stp2 = vm.runInContext(`tbComputeStpState(${JSON.stringify(stateWithPriority)})`, ctx);
    test('v4.62.0 sandbox: lowered priority overrides MAC tiebreaker (SW-C becomes root)',
      stp2.rootId === 'swC' && stp2.bridges.swC.isRoot === true);

    // ── Empty topology ──
    const emptyStp = vm.runInContext(`tbComputeStpState({ devices: [], cables: [] })`, ctx);
    test('v4.62.0 sandbox: empty topology still returns converged with no root',
      emptyStp.converged === true && emptyStp.rootId === null);

    // ── No switches (only hosts) ──
    const hostOnly = vm.runInContext(`tbComputeStpState(${JSON.stringify({
      devices: [{ id: 'h1', type: 'host', interfaces: [] }, { id: 'h2', type: 'host', interfaces: [] }],
      cables: [{ id: 'c1', from: 'h1', to: 'h2' }]
    })})`, ctx);
    test('v4.62.0 sandbox: no switches → no STP election (rootId null, no port roles on host cables)',
      hostOnly.rootId === null && (!hostOnly.cables['c1'] || hostOnly.cables['c1'].fromRole === null));

    // ── Mixed: one switch + one host ──
    const mixedStp = vm.runInContext(`tbComputeStpState(${JSON.stringify({
      devices: [
        { id: 'sw1', type: 'switch', interfaces: [{ mac: '00:00:00:00:00:10' }] },
        { id: 'h1', type: 'host', interfaces: [{ mac: '00:00:00:00:00:20' }] }
      ],
      cables: [{ id: 'c1', from: 'sw1', to: 'h1' }]
    })})`, ctx);
    test('v4.62.0 sandbox: single switch is elected root even with only host-connected cables',
      mixedStp.rootId === 'sw1');
    test('v4.62.0 sandbox: cable to non-switch endpoint gets no STP role (null)',
      mixedStp.cables['c1'] && mixedStp.cables['c1'].fromRole === null &&
      mixedStp.cables['c1'].toRole === null && mixedStp.cables['c1'].blocked === false);
  } catch (e) {
    test('v4.62.0 sandbox: tbComputeStpState executed without error', false);
  }
})();

// ══════════════════════════════════════════════════════════════════════
// v4.62.1 — Per-Hop Trace panel is draggable by its head
// User spotted during prod test: the trace panel sits over the canvas
// left-anchored, sometimes covering topology. Same drag-by-head pattern
// as the inspector popup + config panel floating popups.
// ══════════════════════════════════════════════════════════════════════

test('v4.62.1 CSS: .tb-trace-head has cursor: grab',
  /\.tb-trace-head\s*\{[\s\S]{0,400}cursor:\s*grab/.test(css));
test('v4.62.1 CSS: .tb-trace-head:active switches to cursor: grabbing',
  /\.tb-trace-head:active\s*\{\s*cursor:\s*grabbing/.test(css));

// ══════════════════════════════════════════════════════════════════════
// v4.62.2 — CompTIA troubleshooting-methodology order guard
// Bug: Haiku generated an `order` question listing the 5-step CompTIA
// methodology but `correctOrder` placed "Document findings, actions taken,
// and outcomes" at position 3 instead of the final position. Under the
// 7-step methodology, "Identify the problem" is ALWAYS first and "Document
// findings" is ALWAYS last — those are invariant. New programmatic guard
// in validateQuestions rejects any order question that violates either.
// ══════════════════════════════════════════════════════════════════════

test('v4.62.2 JS: _tbTroubleshootingOrderOk helper defined',
  /function\s+_tbTroubleshootingOrderOk\s*\(q\)/.test(js));
test('v4.62.2 JS: validateQuestions routes order questions through the guard',
  /function validateQuestions[\s\S]{0,2500}_tbTroubleshootingOrderOk\(q\)/.test(js));
test('v4.62.2 validation-audit.js extracts + includes the new helper in its sandbox',
  (() => {
    const fs = require('fs');
    const audit = fs.readFileSync(require('path').join(ROOT, 'tests', 'validation-audit.js'), 'utf8');
    return audit.includes('_tbTroubleshootingOrderOk');
  })());

// Behavioural sandbox fixtures — exercise the helper against the exact
// user-reported bug scenario + legitimate passing cases + edge cases.
(function testTsOrderOk() {
  try {
    const vm = require('vm');
    const body = js.match(/function\s+_tbTroubleshootingOrderOk\s*\(q\)\s*\{([\s\S]*?)\n\}\n/);
    if (!body) {
      test('v4.62.2 sandbox: helper body extracted', false);
      return;
    }
    test('v4.62.2 sandbox: helper body extracted', true);

    const ctx = {};
    vm.createContext(ctx);
    vm.runInContext(`function _tbTroubleshootingOrderOk(q) {${body[1]}}`, ctx);

    // ── User-reported bug scenario: Document at position 3 (idx 0) ──
    const buggy = {
      type: 'order',
      question: 'Arrange the following steps in the correct order for troubleshooting a network connectivity issue using the CompTIA Network+ methodology.',
      topic: 'CompTIA Troubleshooting Methodology',
      items: [
        'Document findings, actions taken, and outcomes for future reference',  // 0
        'Identify the problem by gathering information from the user',          // 1
        'Test the solution and verify that the user can access required',       // 2
        'Implement the most likely solution based on the identified cause',     // 3
        'Establish a theory of the probable cause'                              // 4
      ],
      correctOrder: [1, 4, 0, 3, 2]  // WRONG — Document at position 3 instead of last
    };
    test('v4.62.2 sandbox: rejects the user-reported bug (Document not last)',
      vm.runInContext('_tbTroubleshootingOrderOk(q)', Object.assign(ctx, { q: buggy })) === false);

    // ── Correct answer passes ──
    const correct = Object.assign({}, buggy, { correctOrder: [1, 4, 3, 2, 0] });
    test('v4.62.2 sandbox: accepts the correct methodology order (Identify, Theory, Implement, Test, Document)',
      vm.runInContext('_tbTroubleshootingOrderOk(q)', Object.assign(ctx, { q: correct })) === true);

    // ── Alt correct order (Test before Implement — also valid per 7-step) ──
    const altCorrect = Object.assign({}, buggy, { correctOrder: [1, 4, 2, 3, 0] });
    test('v4.62.2 sandbox: accepts alt order where Test comes before Implement (also valid)',
      vm.runInContext('_tbTroubleshootingOrderOk(q)', Object.assign(ctx, { q: altCorrect })) === true);

    // ── Identify not first ──
    const notIdentifyFirst = Object.assign({}, buggy, { correctOrder: [4, 1, 2, 3, 0] });
    test('v4.62.2 sandbox: rejects when Identify is not at position 0',
      vm.runInContext('_tbTroubleshootingOrderOk(q)', Object.assign(ctx, { q: notIdentifyFirst })) === false);

    // ── Theory before Identify ──
    const theoryBeforeIdentify = Object.assign({}, buggy, { correctOrder: [4, 1, 3, 2, 0] });
    test('v4.62.2 sandbox: rejects when Theory comes before Identify',
      vm.runInContext('_tbTroubleshootingOrderOk(q)', Object.assign(ctx, { q: theoryBeforeIdentify })) === false);

    // ── Non-methodology order question (should pass through untouched) ──
    const unrelated = {
      type: 'order',
      question: 'Arrange the OSI layers from bottom to top.',
      topic: 'Network Models & OSI',
      items: ['Physical', 'Data Link', 'Network', 'Transport'],
      correctOrder: [0, 1, 2, 3]
    };
    test('v4.62.2 sandbox: unrelated order questions pass through (not touched)',
      vm.runInContext('_tbTroubleshootingOrderOk(q)', Object.assign(ctx, { q: unrelated })) === true);

    // ── MCQ question (not order type) ──
    const mcq = {
      type: 'mcq', question: 'What is 2+2?', topic: 'Math',
      options: { A: '3', B: '4' }, answer: 'B'
    };
    test('v4.62.2 sandbox: MCQ questions skip the guard entirely',
      vm.runInContext('_tbTroubleshootingOrderOk(q)', Object.assign(ctx, { q: mcq })) === true);

    // ── Malformed: missing correctOrder ──
    const malformed = { type: 'order', question: 'CompTIA troubleshooting steps?', items: ['a','b'] };
    test('v4.62.2 sandbox: malformed questions (no correctOrder) pass through without throwing',
      vm.runInContext('_tbTroubleshootingOrderOk(q)', Object.assign(ctx, { q: malformed })) === true);

    // ── CompTIA stem mentioned but no Document item → guard only enforces what's present ──
    const noDocItem = {
      type: 'order',
      question: 'Order the CompTIA troubleshooting methodology steps.',
      topic: 'CompTIA Troubleshooting Methodology',
      items: ['Identify the problem', 'Establish a theory', 'Test the theory', 'Implement solution'],
      correctOrder: [0, 1, 2, 3]
    };
    test('v4.62.2 sandbox: guard tolerates missing Document item (only checks invariants that apply)',
      vm.runInContext('_tbTroubleshootingOrderOk(q)', Object.assign(ctx, { q: noDocItem })) === true);
  } catch (e) {
    test('v4.62.2 sandbox: helper executed without error', false);
  }
})();

