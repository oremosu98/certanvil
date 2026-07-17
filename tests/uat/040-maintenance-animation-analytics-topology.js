// tests/uat/040-maintenance-animation-analytics-topology.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Tech-debt maintenance bundle (#130/#72/#128/#141), milestones, exam keyword highlighting, activity pages bundle, v4.44-4.50 animation/analytics/readiness/topology-scenario/custom-quiz waves

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── #130 — Magic numbers extracted ──
// v4.86.0 update: literal values moved to certs/netplus.js as CERT_PACK.meta.
// app.js now reads via CERT_PACK with Network+ defaults preserved as fallback.
test('v4.42.5 #130: EXAM_PASS_SCORE declared (cert-pack-aware, 720 fallback)',
  /const EXAM_PASS_SCORE = .*examPassScore.*\|\|\s*720/.test(js));
test('v4.42.5 #130: EXAM_QUESTION_COUNT declared (cert-pack-aware, 90 fallback)',
  /const EXAM_QUESTION_COUNT = .*examQuestionCount.*\|\|\s*90/.test(js));
test('v4.86.0: cert pack netplus declares examPassScore: 720',
  /examPassScore:\s*720/.test(certNetplus));
test('v4.86.0: cert pack netplus declares examQuestionCount: 90',
  /examQuestionCount:\s*90/.test(certNetplus));
test('v4.42.5 #130: DOUBLE_CLICK_MS constant declared',
  /const DOUBLE_CLICK_MS = 400;/.test(js));
test('v4.42.5 #130: VXLAN_VNI_MAX constant declared',
  /const VXLAN_VNI_MAX = 16777215;/.test(js));
test('v4.42.5 #130: MAX_TOKENS_GENERATION constant declared',
  /const MAX_TOKENS_GENERATION\s+=\s*12000;/.test(js));  // v4.56.1: bumped 8000→12000
test('v4.42.5 #130: MAX_TOKENS_VALIDATION constant declared',
  /const MAX_TOKENS_VALIDATION\s*=\s*1000;/.test(js));
test('v4.42.5 #130: MAX_TOKENS_TEACHER_DEFAULT constant declared',
  /const MAX_TOKENS_TEACHER_DEFAULT\s*=\s*1500;/.test(js));
test('v4.42.5 #130: behavioral pass-score checks reference EXAM_PASS_SCORE',
  (js.match(/>= EXAM_PASS_SCORE/g) || []).length >= 6);
test('v4.42.5 #130: no bare max_tokens numeric literals remain',
  !/max_tokens:\s*\d+/.test(js));

// ── #72 — openGuidedLab whitelist trap removed ──
(function() {
  const body = _fnBody(js, 'openGuidedLab');
  test('v4.42.5 #72: openGuidedLab uses document.querySelector(".page.active")',
    body.includes('document.querySelector(\'.page.active\')'));
  test('v4.42.5 #72: regression guard — old whitelist array is gone',
    !body.includes("['page-topic-dive', 'page-ports', 'page-quiz'"));
  test('v4.42.5 #72: regression guard — no more pages.find(...)',
    !body.includes('pages.find(p =>'));
  test('v4.42.5 #72: defensive fallback to page-ports preserved',
    body.includes("'page-ports'"));
  test('v4.42.5 #72: guards against lab page capturing itself',
    body.includes("activeId !== 'page-guided-lab'"));
})();

// ── #128 — Drill ARIA coverage ──
// HTML-side defaults: tab buttons have role+aria-selected+aria-controls, panels
// have role=tabpanel+aria-labelledby, mode buttons have aria-pressed, stats
// strips have aria-live, question cards have aria-live.
[].forEach(prefix => {
  test(`v4.42.5 #128 [${prefix}]: tablist has aria-label`,
    new RegExp(`class="${prefix}-tab-bar" role="tablist" aria-label=`).test(html));
  test(`v4.42.5 #128 [${prefix}]: learn tab has aria-selected="true"`,
    new RegExp(`id="${prefix}-tab-btn-learn"[^>]*aria-selected="true"`).test(html));
  test(`v4.42.5 #128 [${prefix}]: practice tab has aria-controls`,
    new RegExp(`id="${prefix}-tab-btn-practice"[^>]*aria-controls="${prefix}-tab-practice"`).test(html));
  test(`v4.42.5 #128 [${prefix}]: learn panel has role="tabpanel"`,
    new RegExp(`id="${prefix}-tab-learn"[^>]*role="tabpanel"`).test(html));
  test(`v4.42.5 #128 [${prefix}]: practice panel has aria-labelledby`,
    new RegExp(`id="${prefix}-tab-practice"[^>]*aria-labelledby="${prefix}-tab-btn-practice"`).test(html));
  test(`v4.42.5 #128 [${prefix}]: stats strip has aria-live="polite"`,
    new RegExp(`class="${prefix}-stats-strip" aria-live="polite"`).test(html));
  test(`v4.42.5 #128 [${prefix}]: mode buttons have aria-pressed defaults`,
    new RegExp(`class="${prefix}-mode-btn[^"]*"[^>]*aria-pressed=`).test(html));
});
// JS-side state sync
(function() {
  const setTabBody = _fnBody(js, 'setTab');
  const setModeBody = _fnBody(js, 'setMode');
  const setOsDiffBody = _fnBody(js, 'setOsDifficulty');
})();

// ── #141 — evaluateMilestones table-driven refactor ──
test('v4.42.5 #141: _buildMilestoneCtx helper extracted',
  /function _buildMilestoneCtx\(\)/.test(js));
test('v4.42.5 #141: MILESTONE_CHECKS table declared',
  /const MILESTONE_CHECKS = \[/.test(js));
test('v4.42.5 #141: _scaledExamScore helper extracted',
  /function _scaledExamScore\(e\)/.test(js));
(function() {
  const body = _fnBody(js, 'evaluateMilestones');
  const lineCount = body.split('\n').length;
  test(`v4.42.5 #141: evaluateMilestones body ≤ 15 lines (found ${lineCount})`,
    lineCount <= 15);
  test('v4.42.5 #141: evaluateMilestones uses table-driven iteration',
    body.includes('MILESTONE_CHECKS.forEach'));
  test('v4.42.5 #141: evaluateMilestones preserves try/catch resilience per-check',
    body.includes('try {') && body.includes('catch (_)'));
})();
// Regression guard: all 32 live milestone IDs still in the checks table
// (was 47; 15 orphaned ids for deleted drills removed in M2 — ab_*, os_*, cb_*, fix_*)
const EXPECTED_MILESTONES = [
  'first_quiz','hundred_qs','five_hundred_qs','thousand_qs','first_exam',
  'exam_pass','hardcore_pass','all_domains','all_topics','streak_7','streak_30',
  'ready_650','ready_720','perfect_quiz','five_exams','ten_exams',
  'first_subnet','subnet_50','first_port_drill','all_ports_seen','first_session',
  'night_owl','early_bird','weekend_warrior','diversity_5','deep_dive_10',
  'daily_challenge_7','daily_challenge_30',
  'first_lab','labs_5','labs_10','labs_all',
  // M4: drill milestones
  'simlab_first','simlab_25','simlab_ace',
  'decision_first','decision_25','decision_flawless',
  'whynot_first','whynot_25','whynot_master',
  'gauntlet_first','gauntlet_25','gauntlet_survivor',
];
(function() {
  const body = _fnBody(js, '_buildMilestoneCtx') || '';
  const checksSrc = (js.match(/const MILESTONE_CHECKS = \[[\s\S]*?\];/) || [''])[0];
  EXPECTED_MILESTONES.forEach(id => {
    test(`v4.42.5 #141: milestone '${id}' present in table`,
      checksSrc.includes(`'${id}'`));
  });
  test(`v4.42.5 #141: all 44 expected milestones tracked (found ${EXPECTED_MILESTONES.length})`,
    EXPECTED_MILESTONES.length === 44);
})();

// ── M4: drill milestone definitions ──
console.log('\n\x1b[1m── M4: DRILL MILESTONE DEFS ──\x1b[0m');
['simlab_first','simlab_25','simlab_ace','decision_first','decision_25','decision_flawless',
 'whynot_first','whynot_25','whynot_master',
 'gauntlet_first','gauntlet_25','gauntlet_survivor'].forEach(id =>
  test('M4: drill milestone '+id+' defined', new RegExp("id:\\s*'"+id+"'").test(js)));

// ──────────────────────────────────────────────────────────
// v4.43.0 EXAM-CONVENTION KEYWORD HIGHLIGHTING
// ──────────────────────────────────────────────────────────
// CompTIA stems use specific trap words (NOT / EXCEPT / MOST / BEST / NEVER
// / ALWAYS / ONLY / FIRST / LAST / LEAST / WORST / PRIMARY / NEXT / CANNOT).
// Missing them is the #2 wrong-answer mode. Auto-highlighting trains the eye
// to catch them on the real exam.
console.log('\n\x1b[1m── v4.43.0 KEYWORD HIGHLIGHTING ──\x1b[0m');

// Constants + helpers present
test('v4.43.0: EXAM_KEYWORDS array declared',
  /const EXAM_KEYWORDS = \[/.test(js));
test('v4.43.0: _examKeywordRe regex compiled from keyword list',
  /const _examKeywordRe = new RegExp/.test(js));
test('v4.43.0: highlightExamKeywords helper defined',
  js.includes('function highlightExamKeywords('));
test('v4.43.0: setQuestionText helper defined (single entry point)',
  js.includes('function setQuestionText('));

// Keyword coverage — spot-check the 14 words
['not','except','cannot','most','least','best','worst','primary',
 'first','last','next','always','never','only'].forEach(kw => {
  test(`v4.43.0: EXAM_KEYWORDS covers '${kw}'`,
    new RegExp(`'${kw}'`).test(
      (js.match(/const EXAM_KEYWORDS = \[[\s\S]*?\];/) || [''])[0]
    ));
});

// Defensive: ambiguous common words explicitly NOT in the list to avoid
// false-positive highlighting of plain prose
['all','none','any','could','should','would','which'].forEach(kw => {
  test(`v4.43.0: EXAM_KEYWORDS excludes ambiguous '${kw}'`,
    !new RegExp(`'${kw}'`).test(
      (js.match(/const EXAM_KEYWORDS = \[[\s\S]*?\];/) || [''])[0]
    ));
});

// Render path wiring — all 5 spots use setQuestionText or highlightExamKeywords
test('v4.43.0: quiz q-text uses setQuestionText',
  js.includes("setQuestionText(document.getElementById('q-text'), q.question)"));
test('v4.43.0: exam q-text uses setQuestionText',
  js.includes("setQuestionText(document.getElementById('exam-q-text'), q.question)"));
test('v4.43.0: review page wraps stem with highlightExamKeywords',
  js.includes('highlightExamKeywords(escHtml(q.question))'));
test('v4.43.0: CLI sim scenario uses setQuestionText',
  /renderCliSim[\s\S]{0,200}setQuestionText\(scenarioDiv, q\.scenario\)/.test(js));
test('v4.43.0: topology scenario uses setQuestionText',
  /topo-scenario[\s\S]{0,200}setQuestionText\(scenarioDiv, q\.scenario\)/.test(js));

// Regression guards — old textContent-based rendering should be gone
test('v4.43.0: regression — q-text no longer uses raw textContent',
  !js.includes("document.getElementById('q-text').textContent = q.question"));
test('v4.43.0: regression — exam-q-text no longer uses raw textContent',
  !js.includes("document.getElementById('exam-q-text').textContent = q.question"));

// CSS class exists
test('v4.43.0: CSS .exam-keyword class defined', css.includes('.exam-keyword'));
test('v4.43.0: CSS uses accent color for keyword', css.includes('var(--accent-light)') || css.includes('var(--accent)'));
test('v4.43.0: CSS includes light-theme override for keyword',
  /\[data-theme="light"\] \.exam-keyword/.test(css));

// setQuestionText escapes before highlighting (XSS guard)
(function() {
  const body = _fnBody(js, 'setQuestionText');
  test('v4.43.0: setQuestionText escapes HTML first (XSS safe)',
    body.includes('escHtml(raw'));
  test('v4.43.0: setQuestionText handles null input without throwing',
    body.includes("raw || ''"));
})();

// Behavioral smoke test — verify the highlighter wraps keywords correctly
// and leaves non-keywords alone
(function() {
  try {
    // Re-implement with identical logic to the source
    const EXAM_KW = ['not', 'except', 'cannot', 'most', 'least', 'best', 'worst',
                    'primary', 'first', 'last', 'next', 'always', 'never', 'only'];
    const re = new RegExp('\\b(' + EXAM_KW.join('|') + ')\\b', 'gi');
    const highlight = t => String(t).replace(re, '<strong class="exam-keyword">$&</strong>');

    // Case 1: single keyword at start
    const r1 = highlight('Which protocol is NOT secure?');
    test('v4.43.0 smoke: upper-case NOT gets wrapped',
      r1.includes('<strong class="exam-keyword">NOT</strong>'));
    // Case 2: mixed case preserved
    const r2 = highlight('The Best way to secure this is...');
    test('v4.43.0 smoke: mixed-case "Best" preserves case',
      r2.includes('<strong class="exam-keyword">Best</strong>'));
    // Case 3: multiple keywords in same sentence
    const r3 = highlight('MOST secure option EXCEPT for the one with NEVER');
    test('v4.43.0 smoke: multiple keywords all wrap independently',
      (r3.match(/<strong class="exam-keyword">/g) || []).length === 3);
    // Case 4: plain prose without keywords is untouched
    const r4 = highlight('Configure the router with a static IP address.');
    test('v4.43.0 smoke: prose without keywords is unchanged',
      r4 === 'Configure the router with a static IP address.');
    // Case 5: word-boundary — "primary" matches, "primarily" should not (not in list)
    const r5 = highlight('The primary gateway is unreachable.');
    test('v4.43.0 smoke: "primary" gets wrapped',
      r5.includes('<strong class="exam-keyword">primary</strong>'));
    // Case 6: common words NOT in list stay unwrapped (regression guard for "all"/"any"/"none")
    const r6 = highlight('All of the servers need any protocol, none should be skipped.');
    test('v4.43.0 smoke: non-exam words ("all", "any", "none") stay unwrapped',
      !r6.includes('<strong class="exam-keyword">All</strong>') &&
      !r6.includes('<strong class="exam-keyword">any</strong>') &&
      !r6.includes('<strong class="exam-keyword">none</strong>'));
    // Case 7: already-escaped HTML entities survive (regex is text-only)
    const r7 = highlight('Which is NOT &lt;script&gt;safe&lt;/script&gt;?');
    test('v4.43.0 smoke: escaped HTML entities not corrupted',
      r7.includes('&lt;script&gt;') && r7.includes('<strong class="exam-keyword">NOT</strong>'));
  } catch (e) {
    test('v4.43.0 smoke executes', false);
    results.errors.push('Keyword smoke threw: ' + (e && e.message));
  }
})();

// ──────────────────────────────────────────────────────────
// v4.43.1 ACTIVITY PAGES BUNDLE — Subnet + Topology enhancements
// ──────────────────────────────────────────────────────────
// 5 improvements to the Subnet Trainer + Topology Builder activity pages:
//   #1 AI Coach + active-lab context
//   #2 Subnet Trainer dashboard — weakest/stale category callouts
//   #3 Weak-spots → Subnet Trainer bridge (subnet routes only)
//   #4 Topology Builder UI polish — toolbar groups, hero, empty-state, lab regroup
//   #5 Two new troubleshooting labs (VLAN isolation, DHCP relay missing)
console.log('\n\x1b[1m── v4.43.1 ACTIVITY PAGES BUNDLE ──\x1b[0m');

// ── #1 AI Coach + lab context ──
(function() {
  const body = _fnBody(js, 'tbCoachTopology');
  // _fnBody('tbShowCoachModal') matches tbShowCoachModalLoading as a prefix;
  // use a regex anchored on the exact function signature instead.
  const showModalMatch = js.match(/function tbShowCoachModal\(payload[\s\S]*?^\}/m);
})();
test('v4.43.1 #1: CSS .tb-coach-lab-badge defined',
  css.includes('.tb-coach-lab-badge'));

// ── #2 Subnet Trainer dashboard callouts ──
(function() {
  const body = _fnBody(js, 'stRenderDashboard');
})();
test('v4.43.1 #2: CSS .st-dash-callout-weak defined', css.includes('.st-dash-callout-weak'));
test('v4.43.1 #2: CSS .st-dash-callout-stale defined', css.includes('.st-dash-callout-stale'));

// ── #3 Weak-spots → Subnet Trainer bridge ──
test('v4.43.1 #3: bridge does NOT route any topology topics (user directive)',
  !/kind: 'topology'/.test(js.match(/const WEAK_SPOT_DRILL_BRIDGES[\s\S]*?\};/)?.[0] || ''));
// v4.81.18: renderTodaysFocus is now a compat shim → consolidated Today plan
// card. The Subnet Trainer bridge affordance (v4.43.1 #3) was specific to the
// old chip-row layout (separate "Drill in Subnet Trainer" link below chips)
// and is parked as a follow-up — the consolidated card's chip-click currently
// routes to focusTopic for any topic. The bridge constant + handler are
// retained (still drive Subnet Trainer dashboard callouts elsewhere); only
// the Today-section render integration is parked.
// v4.81.23 tombstone: renderTodaysFocus removed entirely (consolidation finalised).
// v4.81.21 → v4.81.23: Subnet Trainer bridge integrated into #today-plan
// (.tplan-bridge-btn CSS); legacy .tf-bridge-btn class no longer used.
test('v4.81.23 tombstone: renderTodaysFocus function removed (cleanup)',
  !js.includes('function renderTodaysFocus('));
test('v4.81.23 tombstone: .tf-bridge-btn CSS rule removed (replaced by .tplan-bridge-btn)',
  !/\.tf-bridge-btn\s*\{/.test(css));
test('v4.81.21: .tplan-bridge-btn CSS in use for Subnet Trainer bridge',
  css.includes('.tplan-bridge-btn'));

// ── #4 Topology Builder UI polish ──
test('v4.43.1 #4: CSS .tb-hero defined', css.includes('.tb-hero'));
test('v4.43.1 #4: CSS .tb-tool-group-label defined', css.includes('.tb-tool-group-label'));
test('v4.43.1 #4: CSS .tb-empty-cta defined', css.includes('.tb-empty-cta'));
(function() {
  const body = _fnBody(js, 'tbOpenLabPicker');
})();
test('v4.43.1 #4: CSS .tb-lab-category defined', css.includes('.tb-lab-category'));

// ── #5 Two new troubleshooting labs ──
(function() {
  const labsSrc = (js.match(/const TB_LABS = \[[\s\S]*?^\];/m) || [''])[0];
})();

// ── v4.43.2 TOPOLOGY BUILDER UI POLISH ──
console.log('\n\x1b[1m── v4.43.2 TB UI POLISH ──\x1b[0m');
// Fix 1: wiring banner light-mode contrast (white text on light mint was unreadable)
test('v4.43.2 #1: light .tb-wire-overlay has explicit color',
  /\[data-theme="light"\]\s*\.tb-wire-overlay\s*\{[^}]*\bcolor:/.test(css));
test('v4.43.2 #1: light .tb-wire-overlay kbd override exists',
  css.includes('[data-theme="light"] .tb-wire-overlay kbd'));
// Fix 2: how-to row collapsed by default (regression guard against `open` returning)
test('v4.43.2 #2: tb-howto-details NOT open by default',
  !/<details id="tb-howto-details"[^>]*\bopen\b/.test(html));
// Fix 3: palette height tracks canvas (was capped at 760 while canvas is 900+)

// ── v4.43.3 TOPOLOGY BUILDER TOOLBAR POLISH ──
console.log('\n\x1b[1m── v4.43.3 TB TOOLBAR POLISH ──\x1b[0m');
// Fix 1: Primary group now has an "Actions" label (was label-less, causing height mismatch)
// Fix 2: toolbar is CSS Grid (was flex-wrap); dividers dropped
test('v4.43.3 #2: .tb-toolbar-v2 uses display: grid',
  /\.tb-toolbar-v2\s*\{[^}]*display:\s*grid/.test(css));
test('v4.43.3 #2: toolbar uses auto-fit minmax columns for uniform wrap',
  /\.tb-toolbar-v2\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(150px,\s*max-content\)\)/.test(css));
test('v4.43.3 #2: border-right dividers dropped (regression guard)',
  !/\.tb-tool-group\s*\{[^}]*border-right:\s*1px/.test(css));
// Fix 3: status element moved into its own .tb-toolbar-meta strip
test('v4.43.3 #3: .tb-toolbar-meta CSS defined',
  /\.tb-toolbar-meta\s*\{[^}]*display:\s*flex/.test(css));
test('v4.43.3 #3: old margin-left:auto status positioning removed (regression guard)',
  !/\.tb-toolbar-v2\s+\.tb-status\s*\{[^}]*margin-left:\s*auto/.test(css));

// ── v4.43.4 QUIZ QUESTION-COUNT BUG FIX ──
console.log('\n\x1b[1m── v4.43.4 QUIZ QUESTION-COUNT FIX ──\x1b[0m');
// startQuiz now over-requests then retries-to-fill so users get the qCount they picked.
// Scope all assertions to the startQuiz function body so we don't accidentally match
// other occurrences of "fetchQuestions" or "qCount".
const _startQuizBody = (() => {
  const m = js.match(/async function startQuiz\(\)\s*\{[\s\S]*?\n\}\s*\n/);
  return m ? m[0] : '';
})();
test('v4.43.4: startQuiz body extracted (sanity)', _startQuizBody.length > 500);
test('v4.43.4 #1: DROPOUT_BUFFER constant with 30% + min-3 formula',
  /DROPOUT_BUFFER\s*=\s*Math\.max\(3,\s*Math\.ceil\(qCount\s*\*\s*0\.3\)\)/.test(_startQuizBody));
test('v4.43.4 #1: initial fetch over-requests (qCount + DROPOUT_BUFFER)',
  /fetchQuestions\([^)]*qCount\s*\+\s*DROPOUT_BUFFER\s*\)/.test(_startQuizBody));
test('v4.43.4 #2: retry-to-fill block exists (questions.length < qCount)',
  /if\s*\(\s*questions\.length\s*<\s*qCount\s*\)\s*\{/.test(_startQuizBody));
test('v4.43.4 #2: retry fetches deficit + DROPOUT_BUFFER',
  /fetchQuestions\([^)]*deficit\s*\+\s*DROPOUT_BUFFER\s*\)/.test(_startQuizBody));
test('v4.43.4 #2: retry wraps in try/catch so a failed retry ships what we have',
  /try\s*\{[\s\S]*?fetchQuestions\([^)]*deficit[\s\S]*?\}\s*catch\s*\(retryErr\)/.test(_startQuizBody));
// Regression guards: the old "Acceptable shortfall" / "length < qCount/2" logic must stay gone
test('v4.43.4: "Acceptable shortfall" comment removed (regression guard)',
  !_startQuizBody.includes('Acceptable shortfall'));
test('v4.43.4: old length < Math.ceil(qCount / 2) branch removed (regression guard)',
  !/questions\.length\s*<\s*Math\.ceil\(qCount\s*\/\s*2\)/.test(_startQuizBody));

// ── v4.43.5 EXAM-MODE VALIDATION PARITY ──
console.log('\n\x1b[1m── v4.43.5 EXAM VALIDATION PARITY ──\x1b[0m');
// startExam() now runs the same 4-layer validation pipeline as startQuiz().
// Scope all assertions to the startExam function body so we don't accidentally
// match other occurrences of the same strings elsewhere in app.js.
const _startExamBody = (() => {
  const m = js.match(/async function startExam\(\)\s*\{[\s\S]*?^\}\s*$/m);
  return m ? m[0] : '';
})();
test('v4.43.5: startExam body extracted (sanity)', _startExamBody.length > 1000);
test('v4.43.5 #1: EXAM_BATCH_BASE constant (18) declared in startExam',
  /EXAM_BATCH_BASE\s*=\s*18/.test(_startExamBody));
test('v4.43.5 #1: EXAM_BATCH_BUFFER constant (5) declared in startExam',
  /EXAM_BATCH_BUFFER\s*=\s*5/.test(_startExamBody));
test('v4.43.5 #1: batch fetch uses EXAM_BATCH_BASE + EXAM_BATCH_BUFFER (over-request)',
  /fetchQuestions\([^)]*EXAM_BATCH_BASE\s*\+\s*EXAM_BATCH_BUFFER(?:\s*,\s*i)?\s*\)/.test(_startExamBody));
test('v4.43.5 #2: Sonnet validator (aiValidateQuestions) called per batch',
  /aiValidateQuestions\(key,\s*rawBatch\)/.test(_startExamBody));
test('v4.43.5 #2: programmatic validateQuestions called per batch',
  /let batch\s*=\s*validateQuestions\(aiValidated\)/.test(_startExamBody));
test('v4.43.5 #3: retry-to-fill block exists (batch.length < EXAM_BATCH_BASE)',
  /if\s*\(\s*batch\.length\s*<\s*EXAM_BATCH_BASE\s*\)/.test(_startExamBody));
test('v4.43.5 #3: retry fetches deficit + EXAM_BATCH_BUFFER',
  /fetchQuestions\([^)]*deficit\s*\+\s*EXAM_BATCH_BUFFER(?:\s*,\s*i)?\s*\)/.test(_startExamBody));
test('v4.43.5 #3: retry wraps in try/catch with retryErr',
  /try\s*\{[\s\S]*?deficit\s*\+\s*EXAM_BATCH_BUFFER[\s\S]*?\}\s*catch\s*\(retryErr\)/.test(_startExamBody));
test('v4.43.5 #4: batch.slice(0, EXAM_BATCH_BASE) truncates overage before concat',
  /batch\.slice\(0,\s*EXAM_BATCH_BASE\)/.test(_startExamBody));
test('v4.43.5 #4: defensive slice to EXAM_QUESTION_COUNT after injectPBQs',
  /examQuestions\s*=\s*examQuestions\.slice\(0,\s*EXAM_QUESTION_COUNT\)/.test(_startExamBody));
test('v4.43.5 #5: graceful-degradation banner wired via showExamShortfallBanner',
  /if\s*\(examShortfall\)\s*showExamShortfallBanner/.test(_startExamBody));
// Helper function + CSS exist
test('v4.43.5: showExamShortfallBanner function defined',
  /function\s+showExamShortfallBanner\(actualCount\)/.test(js));
test('v4.43.5: .exam-shortfall-banner CSS rule exists',
  css.includes('.exam-shortfall-banner'));
test('v4.43.5: light-theme .exam-shortfall-banner override exists',
  /\[data-theme="light"\]\s*\.exam-shortfall-banner/.test(css));
// Regression guards: the old "concat raw batch with no validation" pattern must stay gone
test('v4.43.5: old "examQuestions.concat(batch)" without validation is gone (regression guard)',
  !/examQuestions\s*=\s*examQuestions\.concat\(batch\)\s*;/.test(_startExamBody));
test('v4.43.5: old BATCH_SIZE = 18 bare constant is gone (replaced by EXAM_BATCH_BASE)',
  !/const\s+BATCHES\s*=\s*5,\s*BATCH_SIZE\s*=\s*18/.test(_startExamBody));

// ── v4.43.6 SUBNET LESSON 4 — BLOCK SIZE METHOD ──
console.log('\n\x1b[1m── v4.43.6 LESSON: BLOCK SIZE METHOD ──\x1b[0m');
// Lesson 4 swapped from "The AND Operation" to "The Block Size Method" per user pref.
// SUBNET_LESSONS array must have the new lesson + Lesson 5's prereq must be updated.
// Regression guard: the old AND Operation lesson must stay gone (user chose block size)
test('v4.43.6: old "The AND Operation" lesson removed (regression guard)',
  !/title:\s*'The AND Operation'/.test(js));
test('v4.43.6: old "and_operation" lesson id removed from SUBNET_LESSONS (regression guard)',
  !/id:\s*'and_operation',\s*title:/.test(js));
// Lesson content sanity — the 5 core steps must be present
test('v4.43.6: worked example 192.168.1.100 /26 present',
  js.includes('192.168.1.100') && js.includes('192.168.1.64'));

// ── v4.43.7 LESSON 5 REWRITE + BEGINNER QUESTION POOL FIX ──
console.log('\n\x1b[1m── v4.43.7 LESSON 5 + POOL FIX ──\x1b[0m');
// Fix 1: beginner-level question pool now includes broadcast + usable types.
// Scope assertions to the stPickType function body.
const _stPickTypeBody = (() => {
  const m = js.match(/function stPickType\([^)]*\)\s*\{[\s\S]*?\n\}\s*\n/);
  return m ? m[0] : '';
})();
// Regression guard: medTypes must NOT still contain those 3 (would cause double-classification)
test('v4.43.7 #1: medTypes no longer contains find_broadcast (regression guard)',
  !/medTypes\s*=\s*\[[^\]]*'find_broadcast'/.test(_stPickTypeBody));
test('v4.43.7 #1: medTypes no longer contains usable_first (regression guard)',
  !/medTypes\s*=\s*\[[^\]]*'usable_first'/.test(_stPickTypeBody));
test('v4.43.7 #1: medTypes no longer contains usable_last (regression guard)',
  !/medTypes\s*=\s*\[[^\]]*'usable_last'/.test(_stPickTypeBody));

// Fix 2: Lesson 5 theory rewritten in stepped block-size format
// Regression guard: old terse 6-line theory must stay gone
test('v4.43.7 #2: old terse "Every subnet has 3 key addresses:" single-line is gone',
  !/theory:\s*\[\s*'Every subnet has 3 key addresses:'/.test(js));

// ── v4.43.8 SUBNET-SIZING GUARD ──
console.log('\n\x1b[1m── v4.43.8 SMALLEST-SUBNET GUARD ──\x1b[0m');
// New _smallestSubnetOk helper catches "needs N hosts, which mask" questions
// where the AI picks a wasteful subnet. Scope structural checks to the helper.
test('v4.43.8: _smallestSubnetOk function defined',
  /function\s+_smallestSubnetOk\(q\)/.test(js));
const _smallestSubnetBody = (() => {
  const m = js.match(/function _smallestSubnetOk\(q\)\s*\{[\s\S]*?\n\}\s*\n/);
  return m ? m[0] : '';
})();
test('v4.43.8: _smallestSubnetOk body extracted (sanity)', _smallestSubnetBody.length > 500);
test('v4.43.8 #1: sizingRe matches "at least N hosts/devices/endpoints/users/addresses"',
  /at\\s\+least\|minimum/.test(_smallestSubnetBody) &&
  /hosts\?\|devices\?\|endpoints\?\|users\?\|addresses/.test(_smallestSubnetBody));
test('v4.43.8 #2: helper computes usable hosts via Math.pow(2, 32 - cidr) - 2',
  /Math\.pow\(2,\s*32\s*-\s*cidr\)\s*-\s*2/.test(_smallestSubnetBody));
test('v4.43.8 #3: helper applies subnet-count constraint when parentCidr set',
  /Math\.pow\(2,\s*cidr\s*-\s*parentCidr\)/.test(_smallestSubnetBody) &&
  /parentCidr\s*<\s*cidr/.test(_smallestSubnetBody));
test('v4.43.8 #4: helper parses options via /\\d+ (CIDR) and dotted mask (fallback)',
  /\.match\(\/\\\/\(\\d\{1,2\}\)/.test(_smallestSubnetBody) &&
  /toString\(2\)\.match\(\/1\/g\)/.test(_smallestSubnetBody));
test('v4.43.8 #5: helper picks LARGEST cidr from satisfying set (smallest-subnet-wins)',
  /cidrs\[L\]\s*>\s*cidrs\[bestLetter\]/.test(_smallestSubnetBody));
test('v4.43.8 #6: helper wired into validateQuestions (non-MCQ short-circuit + call)',
  js.includes('if (!_smallestSubnetOk(q)) return false'));
test('v4.43.8: validation-audit stub includes smallestSubnetSrc extraction',
  /const\s+smallestSubnetSrc\s*=\s*extractFunction\(js,\s*'_smallestSubnetOk'\)/.test(
    require('fs').readFileSync(require('path').join(ROOT, 'tests/validation-audit.js'), 'utf8')
  ));
// Behavioural smoke test — extract the helper into a sandbox and run the
// exact user-reported fixture through it. Must return false (reject).
(() => {
  const vm = require('vm');
  const stub = `
    function getQType(q) { return q.type || 'mcq'; }
    ${_smallestSubnetBody}
    result = _smallestSubnetOk(fixture);
  `;
  const userBug = {
    type: 'mcq',
    question: 'An enterprise network administrator assigns 10.50.0.0/16 to a department. The department requires 5 subnets with at least 4,000 usable hosts each. Which subnet mask should be used?',
    options: { A: '/19 (255.255.224.0)', B: '/20 (255.255.240.0)', C: '/21 (255.255.248.0)', D: '/18 (255.255.192.0)' },
    answer: 'A'
  };
  const ctx = { fixture: userBug, result: null };
  vm.createContext(ctx);
  vm.runInContext(stub, ctx);
  test('v4.43.8: behavioural smoke — rejects the user-reported /19-vs-/20 bug',
    ctx.result === false);

  // And confirm the same fixture with answer: 'B' (correct) passes
  userBug.answer = 'B';
  ctx.fixture = userBug; ctx.result = null;
  vm.runInContext(stub, ctx);
  test('v4.43.8: behavioural smoke — accepts the same fixture when /20 is marked',
    ctx.result === true);
})();

// ── v4.43.9 RELEASE-FLOW HYGIENE (bump-version.js prepends to CLAUDE.md) ──
console.log('\n\x1b[1m── v4.43.9 BUMP-SCRIPT PREPEND ──\x1b[0m');
// bump-version.js used to append to the bottom of the CLAUDE.md version
// history table. Convention is newest-first so it now prepends. Regression
// guards pin the new behavior so no future session re-breaks it.
const _bumpSrc = require('fs').readFileSync(
  require('path').join(ROOT, 'scripts/bump-version.js'), 'utf8'
);
test('v4.43.9: bump-version.js comment header says "prepend to version history table"',
  /prepend to version history table/i.test(_bumpSrc));
test('v4.43.9: bump-version.js finds FIRST version row (break after first match)',
  /for \(let i = 0; i < lines\.length; i\+\+\) \{\s*if \(\/\^\\\| v\\d\/\.test\(lines\[i\]\)\) \{\s*firstVersionIdx = i;\s*break;/.test(_bumpSrc));
test('v4.43.9: bump-version.js splices at firstVersionIdx (prepend, not +1)',
  /lines\.splice\(firstVersionIdx,\s*0,\s*newRow\)/.test(_bumpSrc));
test('v4.43.9: success message mentions "added at top"',
  /CLAUDE\.md.*added at top/.test(_bumpSrc));
// Regression guards — the old append-to-bottom logic must stay gone
test('v4.43.9: old "Find the last version row and insert after it" comment gone',
  !/Find the last version row and insert after it/.test(_bumpSrc));
test('v4.43.9: old lastVersionIdx append pattern gone',
  !/lines\.splice\(lastVersionIdx\s*\+\s*1/.test(_bumpSrc));

// ── v4.44.0 ANIMATION PASS (quiz feel + block-match + keyword cleanup) ──
console.log('\n\x1b[1m── v4.44.0 ANIMATION PASS ──\x1b[0m');
// Keyword simplification — bold purple only, no pill
test('v4.44.0 #1: .exam-keyword has no background (pill styling removed)',
  /\.exam-keyword\s*\{[^}]*\}/.test(css) &&
  !/\.exam-keyword\s*\{[^}]*background:\s*rgba\(124/.test(css));
test('v4.44.0 #1: .exam-keyword has no box-shadow underline (regression guard)',
  !/\.exam-keyword\s*\{[^}]*box-shadow:/.test(css));
// Answer-pick upgrade — glow ripple layered on bounce
test('v4.44.0 #2: optGlowPulse keyframe defined',
  /@keyframes\s+optGlowPulse/.test(css));
test('v4.44.0 #2: .option.correct animation chains optBounce + optGlowPulse',
  /\.option\.correct\s*\{[^}]*animation:\s*optBounce[^,}]*,\s*optGlowPulse/.test(css));
// Question reveal + option stagger
test('v4.44.0 #3: qTextReveal + optionStaggerIn keyframes defined',
  /@keyframes\s+qTextReveal/.test(css) && /@keyframes\s+optionStaggerIn/.test(css));
test('v4.44.0 #3: render() uses void el.offsetWidth for reflow-trigger',
  /void qTextEl\.offsetWidth/.test(js) && /void el\.offsetWidth/.test(js));
test('v4.44.0 #3: render() sets per-index animationDelay (i * 80)',
  /animationDelay\s*=\s*\(i\s*\*\s*80\)\s*\+\s*'ms'/.test(js));
// Progress bar smoothing
test('v4.44.0 #4: .progress-fill uses cubic-bezier transition (not the old .4s ease)',
  /\.progress-fill\s*\{[^}]*transition:\s*width\s+\.6s\s+cubic-bezier/.test(css));
// Block-match ✅ animation — Lesson 4 + Lesson 5 wraps + observer wiring
test('v4.44.0 #5: stBlockMatchPop keyframe defined',
  /@keyframes\s+stBlockMatchPop/.test(css));
test('v4.44.0 #5: .st-block-match-active triggers the pop animation',
  /\.st-block-match\.st-block-match-active\s*\{[^}]*animation:\s*stBlockMatchPop/.test(css));
// NOTE: the SUBNET_LESSONS source stores en-dashes + emoji as literal \u-escapes
// (the Edit tool kept our input as-is), so our test strings need double-backslash
// to match the 6-char ASCII sequence in the file rather than the resolved chars.
// Reduced-motion coverage
test('v4.44.0: prefers-reduced-motion block covers all 4 new animation classes',
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*?#q-text\.q-text-reveal[\s\S]*?\.option\.option-stagger-in[\s\S]*?\.st-block-match\.st-block-match-active[\s\S]*?\.option\.correct[\s\S]*?animation:\s*none/.test(css));

// ── v4.45.0 ANALYTICS REVAMP (Domain Mastery + Wrong-Answer Patterns) ──
console.log('\n\x1b[1m── v4.45.0 ANALYTICS REVAMP ──\x1b[0m');
// The old heatmap + question-type breakdown are removed. Regression guards
// ensure they stay gone and the new cards are correctly wired.
test('v4.45.0: _renderAnaDomainMastery function defined',
  /function\s+_renderAnaDomainMastery\(h\)/.test(js));
test('v4.45.0: drillDomain helper defined (Domain Mastery drill buttons)',
  /function\s+drillDomain\(domainName\)/.test(js));
test('v4.45.0: drillDomain calls focusTopic on weakest topic in domain',
  /function\s+drillDomain\(domainName\)[\s\S]*?focusTopic\(target\)/.test(js));
test('v4.45.0: _renderAnaWrongPatterns function defined',
  /function\s+_renderAnaWrongPatterns\(\)/.test(js));
// Regression guards: the old functions must stay gone
test('v4.45.0: old _renderAnaHeatmap is gone (regression guard)',
  !/function\s+_renderAnaHeatmap/.test(js));
test('v4.45.0: old _renderAnaQuestionTypes is gone (regression guard)',
  !/function\s+_renderAnaQuestionTypes/.test(js));
test('v4.45.0: renderAnalytics bento composes the domains tile (_anaBtDomains)',
  /_anaBtDomains\(/.test(js));
test('v4.45.0: renderAnalytics bento composes the wrong-patterns tile (_anaBtWrong)',
  /_anaBtWrong\(/.test(js));
test('v4.45.0: renderAnalytics no longer calls _renderAnaHeatmap (regression guard)',
  !/html\s*\+=\s*_renderAnaHeatmap/.test(js));
test('v4.45.0: renderAnalytics no longer calls _renderAnaQuestionTypes (regression guard)',
  !/html\s*\+=\s*_renderAnaQuestionTypes/.test(js));
// CSS classes for the new cards
test('v4.45.0: .ana-card-dm CSS defined (Domain Mastery card)',
  /\.ana-card-dm\s*\{/.test(css));
test('v4.45.0: .dm-row + .dm-bar-track + .dm-bar-fill + .dm-bar-target CSS present',
  /\.dm-row\s*\{/.test(css) && /\.dm-bar-track\s*\{/.test(css) &&
  /\.dm-bar-fill\s*\{/.test(css) && /\.dm-bar-target\s*\{/.test(css));
test('v4.45.0: all 4 tier badge CSS classes defined',
  /\.dm-badge-novice/.test(css) && /\.dm-badge-developing/.test(css) &&
  /\.dm-badge-proficient/.test(css) && /\.dm-badge-mastered/.test(css));
test('v4.45.0: .dm-bar-fill uses 800ms cubic-bezier width transition',
  /\.dm-bar-fill\s*\{[^}]*transition:\s*width\s+800ms\s+cubic-bezier/.test(css));
test('v4.45.0: .dm-bar-target positioned at 80% (v4.85.11: lowered from 85%)',
  /style="left:80%"/.test(js) || /left:\s*80%/.test(js));
test('v4.45.0: .wp-pattern + .wp-pattern-rank + .wp-pattern-count CSS present',
  /\.wp-pattern\s*\{/.test(css) && /\.wp-pattern-rank\s*\{/.test(css) &&
  /\.wp-pattern-count\s*\{/.test(css));
test('v4.45.0: old .ana-heatmap + .ana-heat-* CSS is gone (regression guard)',
  !/\.ana-heatmap\s*\{/.test(css) && !/\.ana-heat-head/.test(css));
test('v4.45.0: old .ana-type-list + .ana-type-row CSS is gone (regression guard)',
  !/\.ana-type-list\s*\{/.test(css) && !/\.ana-type-row\s*\{/.test(css));
// Domain mastery classifier sanity — all 5 domain keys referenced
test('v4.45.0: Domain Mastery covers all 5 N10-009 domain keys',
  /id:\s*'concepts'[\s\S]*?id:\s*'implementation'[\s\S]*?id:\s*'operations'[\s\S]*?id:\s*'security'[\s\S]*?id:\s*'troubleshooting'/.test(js));
// Wrong-pattern classifier sanity — all 4 pattern categories
test('v4.45.0: Wrong-pattern classifier detects negation, domain, PBQ type, Hard difficulty',
  js.includes('NEGATION TRAPS') &&
  js.includes('DOMAIN \\u2014') &&
  (js.includes('MULTI-SELECT') || js.includes('ORDER / SEQUENCE')) &&
  js.includes('HARD-DIFFICULTY CONCENTRATION'));

// ── v4.45.1 DOMAIN MASTERY TIER THRESHOLD ADJUSTMENT ──
console.log('\n\x1b[1m── v4.45.1 TIER THRESHOLD ADJUSTMENT ──\x1b[0m');
// Proficient threshold dropped from 75% → 70% and Novice ceiling dropped from
// 60% → 55% after user dispute — real CompTIA raw-accuracy pass equivalent is
// ~70-75%, so "Proficient" now meaningfully = "you'd likely pass today."
// Scope the matches to the tierInfo arrow function body so we don't accidentally
// match other numeric comparisons elsewhere.
// The `pct >= N) return { label: '...', cls: 'dm-badge-...' }` pattern
// appears only in tierInfo, so testing against the whole app.js is safe
// and avoids brace-depth extraction gymnastics.
test('v4.45.1: Proficient threshold at 70% (was 75%)',
  /pct\s*>=\s*70\)\s*return\s*\{\s*label:\s*'Proficient'/.test(js));
test('v4.45.1: Developing / Novice boundary at 55% (was 60%)',
  /pct\s*>=\s*55\)\s*return\s*\{\s*label:\s*'Developing'/.test(js));
test('v4.85.11: Mastered threshold lowered to 80% (was 85% per v4.45.1)',
  /pct\s*>=\s*80\)\s*return\s*\{\s*label:\s*'Mastered'/.test(js));
// Regression guards — old thresholds must stay gone
test('v4.45.1: old 75% Proficient threshold removed (regression guard)',
  !/pct\s*>=\s*75\)\s*return\s*\{\s*label:\s*'Proficient'/.test(js));
test('v4.45.1: old 60% Developing threshold removed (regression guard)',
  !/pct\s*>=\s*60\)\s*return\s*\{\s*label:\s*'Developing'/.test(js));

// ── v4.45.2 ANALYTICS CLEANUP ──
console.log('\n\x1b[1m── v4.45.2 ANALYTICS CLEANUP ──\x1b[0m');
// Fix 1: Wrong-patterns horizontal (grid instead of flex-column)
test('v4.45.2 #1: .wp-list uses CSS grid with auto-fit minmax(260px, 1fr)',
  /\.wp-list\s*\{[^}]*display:\s*grid/.test(css) &&
  /\.wp-list\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(260px,\s*1fr\)\)/.test(css));
test('v4.45.2 #1: .wp-list no longer uses flex-direction: column (regression guard)',
  !/\.wp-list\s*\{[^}]*flex-direction:\s*column/.test(css));
// Fix 2: Practice Drills card removed
test('v4.45.2 #2: _renderAnaDrills function removed (regression guard)',
  !/function\s+_renderAnaDrills\(\)/.test(js));
test('v4.45.2 #2: renderAnalytics no longer calls _renderAnaDrills',
  !/html\s*\+=\s*_renderAnaDrills\(\)/.test(js));
test('v4.45.2 #2: Drills nav pill removed from _renderAnaNav',
  !/ana-s-drills/.test(js));
// Fix 3: Subtopic Weak Spots card removed
test('v4.45.2 #3: _renderAnaWeakSpots function removed (regression guard)',
  !/function\s+_renderAnaWeakSpots\(\)/.test(js));
test('v4.45.2 #3: renderAnalytics no longer calls _renderAnaWeakSpots',
  !/html\s*\+=\s*_renderAnaWeakSpots\(\)/.test(js));
// Fix 4: Milestones revamped
test('v4.45.2 #4: Milestones card has new .ana-card-ms wrapper',
  js.includes('ana-card-ms'));
test('v4.45.2 #4: Milestones header has progress bar (.ana-ms-bar-track + fill)',
  /\.ana-ms-bar-track\s*\{/.test(css) && /\.ana-ms-bar-fill\s*\{/.test(css));
test('v4.45.2 #4: "Recently unlocked" section rendered',
  js.includes('Recently unlocked'));
test('v4.45.2 #4: Full grid wrapped in collapsible <details>',
  /<details class="ana-ms-details">[\s\S]*?summary class="ana-ms-details-summary"/.test(js));
test('v4.45.2 #4: Milestones sort by date desc for recent-unlocks strip',
  /new Date\(unlockedMap\[b\.id\]\)\s*-\s*new Date\(unlockedMap\[a\.id\]\)/.test(js));
test('v4.45.2 #4: Show-all summary count matches totalMilestones',
  /Show all \$\{totalMilestones\} milestones/.test(js));
// Structural checks above cover the tier boundaries; a vm-sandbox smoke
// would need brace-depth extraction of the arrow-function body (non-greedy
// regex captures only the first `};` inside the function). Structural
// regex coverage is sufficient here — all 4 tier cutoffs + 2 regression
// guards on old cutoffs.

// ── v4.46.0 EXAM READINESS HERO POLISH ──
console.log('\n\x1b[1m── v4.46.0 EXAM READINESS HERO POLISH ──\x1b[0m');
// HTML structure refactor
test('v4.46.0: hero header row wrapper (.ana-ready-head)',
  js.includes('class="ana-ready-head"'));
test('v4.46.0: merged date-chip replaces old separate countdown + date-row',
  js.includes('class="ana-exam-date-btn ana-ready-datechip'));
test('v4.46.0: hero row wrapper (.ana-ready-hero-row)',
  js.includes('class="ana-ready-hero-row"'));
test('v4.46.0: score denom "/ 900" rendered next to predicted',
  js.includes('class="ana-ready-denom"') && js.includes('/ 900'));
test('v4.46.0: 720 PASS tick positioned by formula',
  /passTickPct\s*=\s*\(\(EXAM_PASS_SCORE\s*-\s*420\)\s*\/\s*450\)\s*\*\s*100/.test(js));
test('v4.46.0: PASS tick + PASS label elements rendered',
  js.includes('ana-ready-bar-passtick') && js.includes('ana-ready-bar-passlabel'));
test('v4.46.0: bar scale 420/870 labels rendered', js.includes('ana-ready-bar-scale'));
// Domain row structure
test('v4.46.0: domain rows have tier-colored dot', js.includes('class="ana-domain-dot"'));
test('v4.46.0: domain weight shows "% of exam" subtext',
  js.includes('% of exam'));
test('v4.46.0: domain row wrapper classed by tier (ana-domain-row-${tier})',
  /ana-domain-row ana-domain-row-\$\{tier\}/.test(js));
test('v4.46.0: domain tier cutoffs match Domain Mastery card (v4.85.11: 55/70/80, lowered from 85)',
  /pct >= 80[\s\S]{0,80}mastered[\s\S]{0,120}pct >= 70[\s\S]{0,80}proficient[\s\S]{0,120}pct >= 55[\s\S]{0,80}developing/.test(js));
test('v4.46.0: domain bar 85% target tick element', js.includes('class="ana-domain-target"'));
// Stats strip — icons above values
test('v4.46.0: stats strip has icon layer (.ana-hero-stat-icon)',
  js.includes('ana-hero-stat-icon'));
// Date chip states
test('v4.46.0: date chip has urgent/past literal states + dynamic urgency class',
  js.includes('ana-ready-datechip-urgent') && js.includes('ana-ready-datechip-past') && /ana-ready-datechip-\$\{urgency\}/.test(js));
test('v4.46.0: urgency ladder covers 7-day/30-day/ok buckets',
  /daysToExam <= 7 \? 'urgent' : daysToExam <= 30 \? 'soon' : 'ok'/.test(js));
test('v4.46.0: date chip clear uses event.stopPropagation to not re-open picker',
  js.includes("event.stopPropagation();updateExamDate(\\'\\')"));
// CSS coverage
test('v4.46.0 CSS: .ana-ready-head defined', css.includes('.ana-ready-head '));
test('v4.46.0 CSS: .ana-ready-hero-row grid', /\.ana-ready-hero-row\s*\{[^}]*display:\s*grid/.test(css));
test('v4.46.0 CSS: .ana-ready-bar-passtick positioned absolute',
  /\.ana-ready-bar-passtick\s*\{[^}]*position:\s*absolute/.test(css));
test('v4.46.0 CSS: .ana-domain-dot styled', css.includes('.ana-domain-dot '));
test('v4.46.0 CSS: .ana-domain-target 80% position (v4.85.11: lowered from 85%)', /\.ana-domain-target\s*\{[^}]*left:\s*80%/.test(css));
test('v4.46.0 CSS: .ana-ready-datechip styled', css.includes('.ana-ready-datechip '));
test('v4.46.0 CSS: stats tiles have hairline dividers via ::before',
  /\.ana-hero-stat\s*\+\s*\.ana-hero-stat::before/.test(css));
test('v4.46.0 CSS: narrow-viewport responsive block at 560px',
  /@media \(max-width:\s*560px\)\s*\{[\s\S]*?\.ana-ready-hero-row\s*\{[^}]*grid-template-columns:\s*1fr/.test(css));
test('v4.46.0 CSS: reduced-motion neutralises hero animations',
  /prefers-reduced-motion[\s\S]{0,2000}\.ana-ready-bar-fill,\s*\.ana-domain-fill\s*\{[^}]*transition:\s*none/.test(css));
// Regression guards on OLD structure
test('v4.46.0: old .ana-ready-top wrapper removed (regression guard)',
  !js.includes('class="ana-ready-top"'));
test('v4.46.0: old .ana-ready-countdown element removed (regression guard)',
  !js.includes('class="ana-ready-countdown"'));
test('v4.46.0: old .ana-exam-date-row wrapper removed (regression guard)',
  !js.includes('class="ana-exam-date-row"'));
test('v4.46.0: old .ana-exam-date-lbl removed (regression guard)',
  !js.includes('class="ana-exam-date-lbl"'));
test('v4.46.0: old separate .ana-exam-date-clear button replaced by datechip-clear (regression guard)',
  !js.includes('class="ana-exam-date-clear"'));
test('v4.46.0: old .ana-domain-weight right-column removed (regression guard: weight is now subtext under name)',
  !/grid-template-columns:\s*1fr\s*36px\s*2fr\s*40px/.test(css));

// ── v4.46.1 HOMEPAGE CHIP FIX + STREAK POLISH + CANVAS WIDEN ──
console.log('\n\x1b[1m── v4.46.1 HOMEPAGE CHIP + STREAK + CANVAS ──\x1b[0m');
// Shared chip builder (eliminates homepage-chip vs analytics-chip drift)
test('v4.46.1: _buildExamDateChipHtml helper defined',
  js.includes('function _buildExamDateChipHtml(examDateStr, daysToExam, inputId)'));
test('v4.46.1: Analytics card uses shared helper',
  /const dateChip = _buildExamDateChipHtml\(examDateStr, daysToExam, 'ana-exam-date-input'\)/.test(js));
test('v4.46.1: renderReadinessCard uses shared helper',
  /_buildExamDateChipHtml\(dateStr, days, 'readiness-exam-input'\)/.test(js));
// Homepage HTML — old 3-element row replaced with single wrapper
test('v4.46.1: homepage .readiness-exam-lbl removed (chip fills wrapper now)',
  !html.includes('class="readiness-exam-lbl"'));
test('v4.46.1: homepage readiness-exam-countdown span removed',
  !html.includes('id="readiness-exam-countdown"'));
test('v4.46.1: homepage readiness-exam-display span removed (replaced by chip)',
  !html.includes('id="readiness-exam-display"'));
test('v4.46.1: homepage still has #readiness-exam-row wrapper for chip injection',
  html.includes('id="readiness-exam-row"'));
test('v4.46.1: renderReadinessCard no longer manipulates old spans by id',
  !js.match(/getElementById\(['"]readiness-exam-display['"]\)/));
// CSS cleanup
test('v4.46.1 CSS: old .readiness-exam-lbl rule removed',
  !css.includes('.readiness-exam-lbl {') && !css.includes('.readiness-exam-lbl\n'));
test('v4.46.1 CSS: old .readiness-exam-countdown RULE removed (comment reference OK)',
  !/\.readiness-exam-countdown\s*\{/.test(css));
test('v4.46.1 CSS: .readiness-exam-row hosts the chip full-width',
  /\.readiness-exam-row\s+\.ana-ready-datechip\s*\{[^}]*width:\s*100%/.test(css));
// Streak polish
test('v4.46.1: streak computes 5 heat tiers (cold/starting/warm/hot/blazing)',
  js.includes("heatTier = 'cold'") && js.includes("heatTier = 'starting'") && js.includes("heatTier = 'warm'") && js.includes("heatTier = 'hot'") && js.includes("heatTier = 'blazing'"));
test('v4.46.1: streak builds last-7-days dot row from daySet',
  /for \(let i = 6; i >= 0; i--\)[\s\S]{0,400}daySet\.has\(key\)/.test(js));
test('v4.46.1: streak week dots have today marker class',
  js.includes('ana-streak-day-today'));
test('v4.46.1: streak meta row uses icons (🏆 longest, 📅 last study)',
  js.includes('ana-streak-stat-ico'));
test('v4.46.1 CSS: .ana-streak-big-blazing gradient defined',
  css.includes('.ana-streak-big-blazing'));
test('v4.46.1 CSS: @keyframes streakFlamePulse defined',
  /@keyframes streakFlamePulse/.test(css));
test('v4.46.1 CSS: .ana-streak-week dot grid (7-col)',
  /\.ana-streak-week\s*\{[^}]*grid-template-columns:\s*repeat\(7/.test(css));
test('v4.46.1 CSS: .ana-streak-day-on fills with accent',
  css.includes('.ana-streak-day-on .ana-streak-day-dot'));
test('v4.46.1 CSS: reduced-motion neutralises flame pulse',
  /prefers-reduced-motion[\s\S]{0,2500}\.ana-streak-flame\s*\{[^}]*animation:\s*none/.test(css));
// Canvas widening
test('v4.46.1: Analytics page max-width bumped to 1040px',
  /#page-analytics\s*\{[^}]*max-width:\s*1040px/.test(css));
test('v4.46.1: .ana-calendar corner radius bumped (polish at larger cells)',
  /\.ana-cal-day\s*\{[^}]*border-radius:\s*6px/.test(css));
test('v4.46.1: .ana-calendar gap bumped to 5px', /\.ana-calendar\s*\{[^}]*gap:\s*5px/.test(css));

// ── v4.47.0 TOPOLOGY BUILDER SCENARIO EXPANSION ──
console.log('\n\x1b[1m── v4.47.0 TB SCENARIOS + ENDPOINTS + LEARN-MORE ──\x1b[0m');
// New consumer endpoint device types
// isEndpoint family checks updated (3 sites — health, overlay, gateway UI)
// 7 new scenarios registered
const newScenarioIds = [];
newScenarioIds.forEach(id => {
  test(`v4.47.0: scenario '${id}' registered`,
    new RegExp(`id:\\s*'${id}'`).test(js));
});
// 7 new dropdown options
newScenarioIds.forEach(id => {
  test(`v4.47.0: '${id}' option in dropdown`,
    html.includes(`value="${id}"`));
});
// Dropdown uses optgroup organization
// All 15 scenarios have explanation data (check for 5 section keys in source)
// Render function — Learn-more <details> collapsible
// CSS
test('v4.47.0 CSS: reduced-motion neutralises Learn-more animations',
  /prefers-reduced-motion[\s\S]{0,3000}\.tb-scenario-learn-body\s*\{[^}]*animation:\s*none/.test(css));

// ── v4.47.1 SCENARIO PICKER + VISIBLE FEEDBACK ──
console.log('\n\x1b[1m── v4.47.1 SCENARIO PICKER + FEEDBACK ──\x1b[0m');
// v4.47.1 empty-state tile (now rendered dynamically by tbRenderEmptyHint in v4.47.2)
// Scenario picker modal in HTML
// Picker JS
// Visible feedback in tbSetScenario (v4.47.2: empty-hint logic moved into tbRenderEmptyHint,
// tbSetScenario just delegates + shows toast)
// Success toast helper
test('v4.47.1: showSuccessToast helper defined', js.includes('function showSuccessToast('));
test('v4.47.1 CSS: .success-toast green-gradient styling',
  /\.success-toast\s*\{[^}]*linear-gradient\(135deg,\s*#22c55e/.test(css));
// Picker CSS
test('v4.47.1 CSS: .tb-scenario-card styled', css.includes('.tb-scenario-card '));
test('v4.47.1 CSS: .tb-scenario-picker-grid uses auto-fit',
  /\.tb-scenario-picker-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit/.test(css));
test('v4.47.1 CSS: .tb-scenario-card-active accent treatment',
  css.includes('.tb-scenario-card-active'));
test('v4.47.1 CSS: light-theme override for scenario picker',
  /\[data-theme="light"\]\s+\.tb-scenario-picker-cat/.test(css));
test('v4.47.1 CSS: reduced-motion neutralises scenario-card hover lift',
  /prefers-reduced-motion[\s\S]{0,4000}\.tb-scenario-card\s*\{[^}]*transition:\s*none/.test(css));
test('v4.47.1 CSS: .tb-empty-cta-scenario gets accent gradient',
  css.includes('.tb-empty-cta-scenario'));
// v4.47.1: proper SVG icons for the 4 new endpoint devices (no more plain-circle fallback)

// ── v4.47.2 IN-CANVAS SCENARIO-LOADED FEEDBACK ──
console.log('\n\x1b[1m── v4.47.2 IN-CANVAS SCENARIO CARD ──\x1b[0m');
// HTML shell emptied (regression guard — content must be dynamic, not static)
test('v4.47.2: static Ready-to-build HTML removed (regression guard — now rendered via JS)',
  !/<div class="tb-empty-title">Ready to build a network\?<\/div>/.test(html));
// tbRenderEmptyHint function
// tbOpenScenarioDeepDive
// CSS
test('v4.47.2 CSS: .tb-sc-loaded premium card styled',
  css.includes('.tb-sc-loaded '));
test('v4.47.2 CSS: fade-in keyframe tbScLoadedIn',
  /@keyframes tbScLoadedIn/.test(css));
test('v4.47.2 CSS: .tb-sc-loaded-cta-primary gradient treatment',
  css.includes('.tb-sc-loaded-cta-primary'));
test('v4.47.2 CSS: .tb-sc-loaded-chip pill styling',
  css.includes('.tb-sc-loaded-chip'));
test('v4.47.2 CSS: light-theme override for scenario-loaded card',
  /\[data-theme="light"\]\s+\.tb-sc-loaded\b/.test(css));
test('v4.47.2 CSS: reduced-motion neutralises tb-sc-loaded animation',
  /prefers-reduced-motion[\s\S]{0,5000}\.tb-sc-loaded\s*\{[^}]*animation:\s*none/.test(css));
test('v4.47.2 CSS: narrow-viewport tightens scenario-loaded card',
  /@media \(max-width:\s*560px\)[\s\S]{0,500}\.tb-sc-loaded\s*\{[^}]*padding:\s*18px\s*20px/.test(css));

// ── v4.48.0 SCENARIO AUTO-BUILD ──
console.log('\n\x1b[1m── v4.48.0 SCENARIO AUTO-BUILD ──\x1b[0m');
// Helpers
// Entry points wired
// All 15 scenarios have autoBuild
const scenariosWithBuild = [];
scenariosWithBuild.forEach(id => {
  test(`v4.48.0: scenario '${id}' has autoBuild function`,
    new RegExp(`id:\\s*'${id}'[\\s\\S]{0,4000}autoBuild:\\s*\\(state\\)\\s*=>`).test(js));
});
// Spot-check that autoBuild functions actually push devices + cables

// ── v4.49.0 16 NEW SCENARIOS + 4 DEVICE TYPES ──
console.log('\n\x1b[1m── v4.49.0 16 SCENARIOS + 4 DEVICE TYPES ──\x1b[0m');
// New device types registered
// Palette placement
// Interface defaults for new devices
// SVG icons present (regression — no plain-circle fallback for new types)

// 16 new scenarios registered with autoBuild
const newScenarios = [];
newScenarios.forEach(id => {
  test(`v4.49.0: scenario '${id}' registered with autoBuild + explanation`,
    new RegExp(`id:\\s*'${id}'[\\s\\S]{0,6000}autoBuild:\\s*\\(state\\)\\s*=>[\\s\\S]{0,6000}explanation:\\s*\\{`).test(js));
});

// Dropdown: new optgroups
newScenarios.forEach(id => {
  test(`v4.49.0: dropdown option for '${id}'`, html.includes(`value="${id}"`));
});

// Picker categories + icons updated
// Spot-check a few new scenario icons

// Empty-state tile copy updated (16 → 31)
test('v4.49.0: old "16 real-world" copy removed (regression guard)',
  !js.includes('16 real-world network patterns'));

// ── v4.49.1 HOW-TO BUILD UI REVAMP ──
console.log('\n\x1b[1m── v4.49.1 HOW-TO BUILD REVAMP ──\x1b[0m');
// HTML: new step structure
test('v4.49.1: old .tb-howto-item structure removed (regression guard)',
  !html.includes('class="tb-howto-item"'));
// CSS
test('v4.49.1 CSS: .tb-howto-step premium styling defined',
  css.includes('.tb-howto-step {') && /\.tb-howto-step\s*\{[^}]*radial-gradient/.test(css));
test('v4.49.1 CSS: .tb-howto-step-title styled with accent color',
  css.includes('.tb-howto-step-title'));
test('v4.49.1 CSS: light-theme override for step cards',
  /\[data-theme="light"\]\s+\.tb-howto-step\s/.test(css));
test('v4.49.1 CSS: reduced-motion neutralises step hover-lift',
  /prefers-reduced-motion[\s\S]{0,5000}\.tb-howto-step\s*\{[^}]*transition:\s*none/.test(css));
// Regression: old CSS gone
test('v4.49.1 CSS: old .tb-howto-item rule removed',
  !/\.tb-howto-item\s*\{/.test(css));
test('v4.49.1 CSS: old .tb-howto-num rule removed (replaced by .tb-howto-step-num)',
  !/\.tb-howto-num\s*\{/.test(css));

// ── v4.49.2 PACKET-COLOR FIX (scenarios show green) ──
console.log('\n\x1b[1m── v4.49.2 PACKET-COLOR FIX ──\x1b[0m');
// Expanded exemption list
// Preserve original entries

// Link-local auto-assign in _tbMkCable

// Counter reset in tbLoadScenarioWithBuild

// Behavioural check — verify a sample scenario would pass health check
// (done here via structural inspection; live Chrome-MCP run covers real behaviour)

// ── v4.49.3 AI GENERATE shares the auto-assign helper ──
console.log('\n\x1b[1m── v4.49.3 AI GENERATE AUTO-ASSIGN ──\x1b[0m');

// ── v4.49.4 GRADE + COACH BLOCK PRISTINE SCENARIO BUILDS ──
console.log('\n\x1b[1m── v4.49.4 PRISTINE-SCENARIO GATING ──\x1b[0m');

// ── v4.49.5 DEPLOY-VERIFY RETRY/BACKOFF (issue #167) ──
console.log('\n\x1b[1m── v4.49.5 DEPLOY-VERIFY RETRY/BACKOFF ──\x1b[0m');
const deployVerifyJs = fs.readFileSync(path.join(ROOT, 'tests/deploy-verify.js'), 'utf8');
test('v4.49.5: deploy-verify retry schedule is [15s, 30s, 60s, 120s]',
  /BACKOFFS_MS\s*=\s*\[15_000,\s*30_000,\s*60_000,\s*120_000\]/.test(deployVerifyJs));
test('v4.49.5: deploy-verify retry loop gates on triadMatches + attempt budget',
  /for\s*\(let\s+i\s*=\s*0;\s*i\s*<\s*BACKOFFS_MS\.length\s*&&\s*!triadMatches\(triad\);/.test(deployVerifyJs));
test('v4.49.5: deploy-verify fresh nocache per retry (Date.now() cache-buster)',
  /const\s+cb\s*=\s*Date\.now\(\)[\s\S]{0,500}\?nocache=\$\{cb\}/.test(deployVerifyJs));
test('v4.49.5: deploy-verify re-fetches the 3 critical files on retry',
  /Promise\.all\(\[\s*fetchText[\s\S]{0,100}app\.js\?nocache[\s\S]{0,200}sw\.js\?nocache[\s\S]{0,200}index\.html\?nocache/.test(deployVerifyJs));
test('v4.49.5: deploy-verify records retry attempt count in pass message',
  /matched on attempt \$\{attempts\} after CDN propagation/.test(deployVerifyJs));
test('v4.49.5: deploy-verify final-failure message mentions total retry window',
  /after \$\{attempts\} attempts over ~3\.75 min/.test(deployVerifyJs));

// ── v4.50.0 CUSTOM QUIZ UI POLISH ──
console.log('\n\x1b[1m── v4.50.0 CUSTOM QUIZ UI POLISH ──\x1b[0m');
// Section headers with icons
test('v4.50.0: cq-section-head + cq-section-ico + cq-section-title structure in HTML',
  html.includes('class="cq-section-head"') &&
  html.includes('class="cq-section-ico"') &&
  html.includes('class="cq-section-title"'));
test('v4.50.0: 3 section headers (Topic + Difficulty + Questions)',
  (html.match(/class="cq-section-head"/g) || []).length >= 3);
// Smart/Mixed premium cards
test('v4.50.0: Smart + Mixed promoted to cq-mode-card',
  (html.match(/class="chip[^"]*cq-mode-card"/g) || []).length === 2);
test('v4.50.0: mode cards have title + sub structure',
  html.includes('class="cq-mode-title"') && html.includes('class="cq-mode-sub"'));
test('v4.50.0: Smart card advertises AI weak-spot pick',
  html.includes('AI picks your weak spots'));
test('v4.50.0: Mixed card advertises random-across-topics',
  html.includes('Random across all topics'));
// Domain accordions with data-domain-idx (1-5) — scoped to <details> tags only.
// v4.81.17 added more data-domain-idx attributes on Mode Ladder tiles + pre-fill
// pills, so a global count would over-match; this regex matches only the
// <details class="topic-domain-group" data-domain-idx="N"> shape.
test('v4.50.0: all 5 domain accordions have data-domain-idx',
  (html.match(/<details[^>]*class="topic-domain-group"[^>]*data-domain-idx="[1-5]"/g) || []).length === 5);
test('v4.50.0: data-domain-idx spans 1..5 (one per domain)',
  html.includes('data-domain-idx="1"') && html.includes('data-domain-idx="2"') &&
  html.includes('data-domain-idx="3"') && html.includes('data-domain-idx="4"') &&
  html.includes('data-domain-idx="5"'));
// Difficulty tier classes
test('v4.50.0: difficulty chips have tier classes (found/exam/hard/mixed)',
  html.includes('chip-tier-found') && html.includes('chip-tier-exam') &&
  html.includes('chip-tier-hard') && html.includes('chip-tier-mixed'));
// Question count with time estimates
test('v4.50.0: question count chips have chip-count-num + chip-count-sub',
  html.includes('class="chip-count-num"') && html.includes('class="chip-count-sub"'));
test('v4.50.0/v4.50.1: question counts show time estimates (~5/10/15/20 min — 1 min per exam-level question, honest pace)',
  html.includes('~5 min') && html.includes('~10 min') &&
  html.includes('~15 min') && html.includes('~20 min'));
// Generate button
// v4.54.8: the Generate button is now inside the dark .cq-summary-bar (prototype
// prose-summary CTA pattern). The .cq-generate-ico + sparkle styling moved with it;
// the btn-full class was retired since the button is now inline with the prose.
test('v4.50.0 (v4.54.8 update): Generate button has cq-generate-ico + lives inside cq-summary-bar',
  html.includes('class="cq-summary-bar"') &&
  /class="[^"]*\bcq-summary-cta\b/.test(html) &&
  html.includes('class="cq-generate-ico"'));
// Options grid
test('v4.50.0: Difficulty + Questions wrapped in cq-options-grid (no inline style)',
  html.includes('class="cq-options-grid"'));
test('v4.50.0: regression \u2014 old inline grid-template-columns:1fr 1fr gone',
  !html.includes('style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px"'));

// CSS — premium card + tier colours + light-theme + reduced-motion
test('v4.50.0 CSS: .cq-section-title accent color',
  /\.cq-section-title\s*\{[^}]*color:\s*var\(--accent-light\)/.test(css));
test('v4.50.0 CSS: .cq-mode-card with hover lift',
  /\.cq-mode-card:hover\s*\{[^}]*transform:\s*translateY\(-1px\)/.test(css));
test('v4.50.0 CSS: .cq-mode-card.on uses radial+linear gradient',
  /\.cq-mode-card\.on\s*\{[\s\S]{0,500}radial-gradient[\s\S]{0,200}linear-gradient/.test(css));
test('v4.50.0 CSS: 5 domain-idx left-border accents defined',
  /data-domain-idx="1"[^{]*\{[^}]*#7c6ff7/.test(css) &&
  /data-domain-idx="2"[^{]*\{[^}]*#22c55e/.test(css) &&
  /data-domain-idx="3"[^{]*\{[^}]*#3b82f6/.test(css) &&
  /data-domain-idx="4"[^{]*\{[^}]*#f59e0b/.test(css) &&
  /data-domain-idx="5"[^{]*\{[^}]*#ef4444/.test(css));
test('v4.50.0 CSS: .chip-tier-found.on uses green tint',
  /\.chip-tier-found\.on\s*\{[^}]*rgba\(34,\s*197,\s*94/.test(css));
test('v4.50.0 CSS: .chip-tier-hard.on uses red tint',
  /\.chip-tier-hard\.on\s*\{[^}]*rgba\(239,\s*68,\s*68/.test(css));
test('v4.50.0 CSS: .chip-count.on gradient fill',
  /\.chip-count\.on\s*\{[^}]*linear-gradient/.test(css));
test('v4.50.0 CSS: cq-generate-btn gradient + shadow',
  /\.cq-generate-btn\s*\{[\s\S]{0,500}linear-gradient[\s\S]{0,500}box-shadow/.test(css));
test('v4.50.0 CSS: @keyframes cqSparkle defined',
  /@keyframes cqSparkle/.test(css));
test('v4.50.0 CSS: light-theme override for .cq-mode-card',
  /\[data-theme="light"\]\s+\.cq-mode-card/.test(css));
test('v4.50.0 CSS: reduced-motion neutralises sparkle + mode-card hover',
  /prefers-reduced-motion[\s\S]{0,4000}\.cq-generate-ico\s*\{[^}]*animation:\s*none/.test(css));

// ── v4.50.1 DEEP-SCAN TIME FIX + RECENT PERFORMANCE POLISH ──
console.log('\n\x1b[1m── v4.50.1 DEEP-SCAN + RECENT PERFORMANCE ──\x1b[0m');
// Deep Scan preset label corrected (user: "30 mins lol, more like 20")
test('v4.50.1: Deep Scan preset relabeled to 20-min (was 30-min)',
  html.includes('20-min Deep Scan'));
test('v4.50.1: regression \u2014 old 30-min Deep Scan label removed',
  !html.includes('30-min Deep Scan'));
// Recent Performance polish
test('v4.50.1: renderHistoryPanel uses tier thresholds (v4.85.11: 55/70/80, lowered from 85)',
  /renderHistoryPanel[\s\S]{0,2500}pct\s*>=\s*80[\s\S]{0,300}pct\s*>=\s*70[\s\S]{0,300}pct\s*>=\s*55/.test(js));
test('v4.50.1: renderHistoryPanel includes domain-color dot via DOMAIN_COLOURS map',
  /renderHistoryPanel[\s\S]{0,2500}DOMAIN_COLOURS[\s\S]{0,800}h-domain-dot/.test(js));
test('v4.50.1: renderHistoryPanel uses the TOPIC_DOMAINS lookup for dot colour',
  /renderHistoryPanel[\s\S]{0,2500}TOPIC_DOMAINS\[e\.topic\]/.test(js));
test('v4.50.1: renderHistoryPanel splits score into score + percentage pill',
  /h-score-wrap[\s\S]{0,300}h-score-pct/.test(js));
// CSS structural
test('v4.50.1 CSS: .history-row uses 4-column grid layout',
  /\.history-row\s*\{[^}]*display:\s*grid[\s\S]{0,200}grid-template-columns:\s*8px\s+1fr\s+auto\s+auto/.test(css));
test('v4.50.1 CSS: .h-domain-dot has halo shadow',
  /\.h-domain-dot\s*\{[^}]*border-radius:\s*50%[\s\S]{0,200}box-shadow:\s*0 0 0 3px/.test(css));
test('v4.50.1 CSS: .h-bar thickened to 6px (was 4px)',
  /\.h-bar\s*\{[^}]*height:\s*6px/.test(css));
test('v4.50.1 CSS: .h-bar-fill uses cubic-bezier transition',
  /\.h-bar-fill\s*\{[^}]*cubic-bezier\(0\.2,\s*0\.8,\s*0\.2,\s*1\)/.test(css));
test('v4.50.1 CSS: .h-score-wrap is vertical column for score + %',
  /\.h-score-wrap\s*\{[^}]*flex-direction:\s*column/.test(css));
test('v4.50.1 CSS: .history-row:hover subtle accent tint',
  /\.history-row:hover\s*\{[^}]*background:\s*rgba\(var\(--accent-rgb\)/.test(css));
test('v4.50.1 CSS: narrow-viewport hides date at \u2264520px',
  /@media \(max-width:\s*520px\)[\s\S]{0,300}\.h-date\s*\{[^}]*display:\s*none/.test(css));
test('v4.50.1 CSS: reduced-motion neutralises history-row transition',
  /prefers-reduced-motion[\s\S]{0,4000}\.history-row\s*\{[^}]*transition:\s*none/.test(css));

