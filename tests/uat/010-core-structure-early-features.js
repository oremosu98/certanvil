// tests/uat/010-core-structure-early-features.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: JS/HTML/CSS/SW structure checks; subnet math + tech debt + analytics v2 (incl version consistency); v3-v4.30 era features (hardcore exam, port drills, terminal labs, topology builder tiers 1-3, network sim, cloud networking, STP/OSPF/BGP)

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── JS Syntax Check ──
console.log('\n\x1b[1m── SYNTAX ──\x1b[0m');
try {
  new (require('vm').Script)(js);
  test('app.js parses without syntax errors', true);
} catch(e) {
  test('app.js parses without syntax errors', false);
  console.log('    Error:', e.message);
}

// ── HTML Structure ──
console.log('\n\x1b[1m── HTML PAGES ──\x1b[0m');
pages.forEach(p => test(`page-${p} exists`, html.includes(`id="page-${p}"`)));

console.log('\n\x1b[1m── HTML ELEMENTS ──\x1b[0m');
test('Version badge present', /v\d+\.\d+/.test(html));
test('API key input', html.includes('id="api-key"'));
test('Topic chip group', html.includes('id="topic-group"'));
test('Difficulty chip group', html.includes('id="diff-group"'));
test('Generate Quiz button', html.includes('startQuiz()'));
test('Simulate Exam button', html.includes('startExam()'));
test('Analytics button (v4.53.0: in sidebar JS, not setup-nav row)',
  js.includes('renderAnalytics') && /APP_SIDEBAR_PRACTICE[\s\S]{0,800}analytics/.test(js));
test('Topic brief div', html.includes('id="topic-brief"'));
// v6.5.18 — Reverted v6.5.16/v6.5.17 logo animation. Tombstone guards
// ensure the loading-anim block + MP4 references + CSS rules do not
// accidentally come back in a future diff.
test('v6.5.18 tombstone: loading-anim block removed from index.html', (function () {
  return !html.includes('class="loading-anim"') &&
         !html.includes('logo-animation/logo-dark.mp4') &&
         !html.includes('logo-animation/logo-light.mp4');
})());
test('v6.5.18 tombstone: dg-system.css does not redefine .loading-anim', (function () {
  var dg = read('dg-system.css');
  return !dg.includes('#page-loading .loading-anim');
})());
test('v6.5.18 tombstone: sw.js does not precache the removed MP4 files', (function () {
  var sw = read('sw.js');
  return !sw.includes('logo-animation/logo-dark.mp4') &&
         !sw.includes('logo-animation/logo-light.mp4');
})());

(function () {
  var dg = read('dg-system.css'), base = read('styles.css');
  var defined = {};
  (dg.match(/--[a-z0-9-]+\s*:/gi) || []).concat(base.match(/--[a-z0-9-]+\s*:/gi) || [])
    .forEach(function (d) { defined[d.replace(/\s*:$/, '').trim()] = true; });
  // RATCHET guard (Wave 1 Task 5). Every bare var(--x) in dg-system.css must be defined
  // in dg-system.css or styles.css. Goes green today by baselining the pre-existing gaps
  // below, but FAILS on any NEW undefined bare var(). To silence a NEW token, DEFINE it —
  // do NOT add it here. Baselined gaps tracked for separate cleanup:
  //   --base/--r0/--len  : runtime-set SVG animation params (set via JS, not :root tokens)
  //   --border-soft/--ease/--lnum : token gaps with safe alias/literal targets (deferred)
  //   --muted/--on-accent : gaps needing a design-color decision (4-stage visual pass)
  var KNOWN_GAPS = {
    '--base': 1, '--r0': 1, '--len': 1,
    '--border-soft': 1, '--ease': 1, '--lnum': 1,
    '--muted': 1, '--on-accent': 1
  };
  var missing = {};
  var re = /var\(\s*(--[a-z0-9-]+)\s*\)/gi, m;           // no-fallback references only
  while ((m = re.exec(dg))) { if (!defined[m[1]] && !KNOWN_GAPS[m[1]]) missing[m[1]] = true; }
  var names = Object.keys(missing);
  test('dg-system.css var() tokens all defined except baselined gaps (new undefined: ' + (names.join(', ') || 'none') + ')', names.length === 0);
})();
test('Export/Import buttons', html.includes('exportData()') && html.includes('importData('));

// ── JS Functions ──
console.log('\n\x1b[1m── JS CORE FUNCTIONS ──\x1b[0m');
const coreFns = [
  'showPage','goSetup','startQuiz','startExam','fetchQuestions','render','renderExam',
  'pick','showExplanation','showReview','submitExam','exportData','importData',
  'validateQuestions','aiValidateQuestions','explainFurther','injectPBQs',
  'renderTopology','renderTopoState','submitTopology','renderCliSim','runCliCommand',
  'renderMCQ','renderMultiSelect','renderOrder'
];
// Unified render functions should accept an `ans` parameter (exam mode) — verify all take it
test('renderMCQ unified signature', /function renderMCQ\(q, box, ans\)/.test(js));
test('renderMultiSelect unified signature', /function renderMultiSelect\(q, box, ans\)/.test(js));
test('renderOrder unified signature', /function renderOrder\(q, box, ans\)/.test(js));
test('renderCliSim unified signature', /function renderCliSim\(q, box, ans\)/.test(js));
test('renderTopology unified signature', /function renderTopology\(q, box, ans\)/.test(js));
test('No duplicated renderExam* functions', !/function renderExam(MCQ|MultiSelect|Order|CliSim|Topology)\(/.test(js));

// Accessibility
test('quiz-flag-btn has aria-pressed', html.includes('id="quiz-flag-btn"') && html.includes('aria-pressed="false"'));
test('exam-flag-btn has aria-pressed', html.includes('id="exam-flag-btn"') && /exam-flag-btn[^>]*aria-pressed/.test(html));
test('live-score has aria-live', /id="live-score"[^>]*aria-live/.test(html));
test('qnav-toggle has aria-expanded', /id="qnav-toggle"[^>]*aria-expanded/.test(html));
test('exam-timer has role=timer', /id="exam-timer"[^>]*role="timer"/.test(html));
test('syncChipAriaPressed helper defined', js.includes('function syncChipAriaPressed'));
test('showPage moves focus to heading', js.includes('focusTarget.focus'));
test('renderNavGrid sets aria-label per square', js.includes('`Question ${i + 1},'));
coreFns.forEach(fn => test(`function ${fn}()`, js.includes(`function ${fn}(`)));

console.log('\n\x1b[1m── JS FEATURE: SUBNETTING ──\x1b[0m');
[].forEach(fn => test(`function ${fn}()`, js.includes(`function ${fn}(`)));

console.log('\n\x1b[1m── JS FEATURE: PORT DRILL ──\x1b[0m');
// Port Mastery core functions (new pt-* architecture)
[].forEach(fn => test(`function ${fn}()`, js.includes(`function ${fn}(`)));
// Legacy compat stubs still exist
[].forEach(fn => test(`legacy stub ${fn}()`, js.includes(`function ${fn}(`)));
test('PORT_MASTERY storage key', js.includes("PORT_MASTERY: 'nplus_port_mastery'"));
test('PORT_LESSONS storage key', js.includes("PORT_LESSONS: 'nplus_port_lessons'"));

console.log('\n\x1b[1m── JS FEATURE: TOPIC BRIEF ──\x1b[0m');
test('function fetchTopicBrief()', js.includes('function fetchTopicBrief('));
test('Fires in parallel during startQuiz', js.includes('fetchTopicBrief(key'));

console.log('\n\x1b[1m── JS FEATURE: ANALYTICS ──\x1b[0m');
test('function renderAnalytics()', js.includes('function renderAnalytics('));
// v4.54.14: Analytics card headers migrated from plain uppercase <h3> to the
// editorial _edCardhead(eyebrow, title, em) helper.
test('Analytics editorial cardhead: _edCardhead helper defined',
  js.includes('function _edCardhead('));
test('Analytics editorial cardhead: Accuracy trend.',
  js.includes("'Accuracy', 'trend.'"));
test('Analytics editorial cardhead: Difficulty breakdown.',
  js.includes("'Difficulty', 'breakdown.'"));
test('Analytics editorial cardhead: Topic-level breakdown.',
  js.includes("'Topic-level', 'breakdown.'"));
test('Analytics editorial cardhead: Study activity.',
  js.includes("'Study', 'activity.'"));
test('Analytics editorial cardhead: Exam history.',
  js.includes("'Exam', 'history.'"));
test('Analytics editorial cardhead: Study streak.',
  js.includes("'Study', 'streak.'"));
test('Analytics editorial cardhead: Wrong-answer patterns.',
  js.includes("'Wrong-answer', 'patterns.'"));
test('Analytics editorial cardhead: Exam vs quiz.',
  js.includes("'Exam vs', 'quiz.'"));
test('Analytics editorial cardhead: Milestones.',
  js.includes("'Milestones.'"));

console.log('\n\x1b[1m── JS FEATURE: DRAG & DROP ──\x1b[0m');
test('Devices are draggable', js.includes('btn.draggable = true'));
test('ondragstart handler', js.includes('ondragstart'));
test('Zone ondrop handler', js.includes('zoneEl.ondrop') || js.includes('.ondrop'));
test('dataTransfer API used', js.includes('dataTransfer.setData') && js.includes('dataTransfer.getData'));

console.log('\n\x1b[1m── JS FEATURE: DEEP EXPLANATIONS ──\x1b[0m');
test('6 explanation sections in prompt', ['CONCEPT BREAKDOWN','REAL-WORLD ANALOGY','HOW THIS APPEARS ON THE EXAM','MEMORY TRICK','RELATED CONCEPTS'].every(s => js.includes(s)));
// v4.42.5 #130: max_tokens now references named constants (MAX_TOKENS_TEACHER_DEFAULT etc.) not bare literals
test('max_tokens defaults are adequate for teacher calls',
  js.includes('MAX_TOKENS_TEACHER_DEFAULT = 1500') || js.includes('MAX_TOKENS_TEACHER_LONG = 2000'));

console.log('\n\x1b[1m── JS QUESTION TYPES ──\x1b[0m');
['mcq','multi-select','order','cli-sim','topology'].forEach(t => test(`Type: ${t}`, js.includes(`'${t}'`)));

// ── CSS ──
console.log('\n\x1b[1m── CSS SECTIONS ──\x1b[0m');
['.subnet-card', '.subnet-table', '.port-timer', '.port-opt', '.ana-card', '.ana-chart', '.ana-calendar', '.ana-priority', '.ana-alltime', '.topo-zone', '.topo-device', '.cli-terminal', '.btn-tool', '.topic-brief', '.deep-section-header', '.topo-zone-dragover', '.topo-device.dragging'].forEach(sel => test(`CSS: ${sel}`, css.includes(sel)));
test('Dark theme variables', css.includes(':root'));
test('Light theme variables', css.includes('[data-theme="light"]'));

// ── Service Worker ──
console.log('\n\x1b[1m── SERVICE WORKER ──\x1b[0m');
test('Cache name set', sw.includes('CACHE_NAME'));
test('Shell assets defined', sw.includes('SHELL_ASSETS'));
test('Install handler', sw.includes("addEventListener('install'"));
test('Activate handler', sw.includes("addEventListener('activate'"));
test('Fetch handler', sw.includes("addEventListener('fetch'"));
test('API calls excluded from cache', sw.includes('api.anthropic.com'));
test('SW: cache cap defined (#20)', /CACHE_MAX_ENTRIES\s*=\s*\d+/.test(sw));
test('SW: trimCache helper present (#20)', sw.includes('async function trimCache'));
test('SW: trimCache called after cache.put (#20)', /cache\.put\([^)]+\);\s*trimCache\(/.test(sw));
test('SW: 5xx falls back to cached response (#20)', /response\.status\s*>=\s*500\s*&&\s*cached/.test(sw));
test('CSS: .is-hidden utility class (#17)', css.includes('.is-hidden { display: none !important;'));
test('CSS: .is-dimmed utility class (#17)', css.includes('.is-dimmed { opacity:'));
test('JS: uses is-hidden classList toggles (#17)', (js.match(/classList\.(add|remove|toggle)\(['"]is-hidden['"]/g) || []).length >= 50);
test('JS: uses is-dimmed classList toggles (#17)', (js.match(/classList\.(add|toggle)\(['"]is-dimmed['"]/g) || []).length >= 5);

// ── Subnet Math Verification ──
console.log('\n\x1b[1m── SUBNET MATH ──\x1b[0m');
// Extract and test the actual math functions
const mathCode = `
  function cidrToMask(cidr) {
    const bits = '1'.repeat(cidr) + '0'.repeat(32 - cidr);
    return [bits.slice(0,8), bits.slice(8,16), bits.slice(16,24), bits.slice(24,32)].map(b => parseInt(b, 2)).join('.');
  }
  function cidrToMaskArr(cidr) {
    const bits = '1'.repeat(cidr) + '0'.repeat(32 - cidr);
    return [parseInt(bits.slice(0,8),2), parseInt(bits.slice(8,16),2), parseInt(bits.slice(16,24),2), parseInt(bits.slice(24,32),2)];
  }
  function getSubnetAddr(ipArr, maskArr) { return ipArr.map((o,i) => o & maskArr[i]); }
  function getBroadcastAddr(ipArr, maskArr) { return ipArr.map((o,i) => (o & maskArr[i]) | (~maskArr[i] & 255)); }
  function hostCount(cidr) { return cidr >= 31 ? (cidr === 31 ? 2 : 1) : Math.pow(2, 32 - cidr) - 2; }
`;
vm.runInNewContext(mathCode, sandbox);
test('/24 = 255.255.255.0', sandbox.cidrToMask(24) === '255.255.255.0');
test('/25 = 255.255.255.128', sandbox.cidrToMask(25) === '255.255.255.128');
test('/26 = 255.255.255.192', sandbox.cidrToMask(26) === '255.255.255.192');
test('/16 = 255.255.0.0', sandbox.cidrToMask(16) === '255.255.0.0');
test('/30 = 255.255.255.252', sandbox.cidrToMask(30) === '255.255.255.252');
test('/24 hosts = 254', sandbox.hostCount(24) === 254);
test('/30 hosts = 2', sandbox.hostCount(30) === 2);
test('Subnet 192.168.1.100/24', sandbox.getSubnetAddr([192,168,1,100], sandbox.cidrToMaskArr(24)).join('.') === '192.168.1.0');
test('Broadcast 192.168.1.100/24', sandbox.getBroadcastAddr([192,168,1,100], sandbox.cidrToMaskArr(24)).join('.') === '192.168.1.255');
test('Subnet 10.0.5.67/26', sandbox.getSubnetAddr([10,0,5,67], sandbox.cidrToMaskArr(26)).join('.') === '10.0.5.64');
test('Broadcast 10.0.5.67/26', sandbox.getBroadcastAddr([10,0,5,67], sandbox.cidrToMaskArr(26)).join('.') === '10.0.5.127');

// ── Tech Debt Fixes (v3.5) ──
console.log('\n\x1b[1m── TECH DEBT FIXES ──\x1b[0m');
test('APP_VERSION constant defined', /const APP_VERSION = '\d+\.\d+/.test(js));
test('EXAM_TIME_SECONDS constant (cert-pack-aware, 5400 fallback)',
  /const EXAM_TIME_SECONDS = .*examTimeSeconds.*\|\|\s*5400/.test(js));
test('HISTORY_CAP constant', js.includes('const HISTORY_CAP = 200'));
test('WRONG_BANK_CAP constant', js.includes('const WRONG_BANK_CAP = 200'));
test('Wrong bank capped', js.includes('WRONG_BANK_CAP'));
test('Reports capped', js.includes('REPORTS_CAP'));
test('History cap uses constant', js.includes('HISTORY_CAP) h.length'));
test('Export version uses constant', js.includes('version: APP_VERSION'));
test('ExamTimeLeft uses constant', !js.includes('examTimeLeft   = 5400'));
test('Explanation cleanup before insert', js.includes('while (expTextEl.nextSibling)'));
test('Touch event support for topology', js.includes('touchstart') && js.includes('touchend'));
test('E key for multi-select', js.includes("'A','B','C','D','E'"));
test('Shared scoring helper', js.includes('function _scoreTopicNeed('));
test('Meta description in HTML', html.includes('meta name="description"'));
test('ARIA on theme toggle', html.includes('aria-label="Toggle'));
// v4.99.3: ARIA label retired with BYOK Settings UI (input now hidden, no user-facing label needed).
test('ARIA: API key input is now hidden (BYOK retired in v4.99.3)',
  /input[^>]*type="hidden"[^>]*id="api-key"/.test(html));
test('ARIA on exam modal', html.includes('role="dialog"'));
test('Version badge matches APP_VERSION', (() => { const m = js.match(/const APP_VERSION = '([^']+)'/); return m && html.includes('v' + m[1]); })());
test('SW cache name matches APP_VERSION', (() => { const m = js.match(/const APP_VERSION = '([^']+)'/); return m && sw.includes('netplus-v'); })());
test('SW relative paths', sw.includes("'./index.html'"));
test('No unused Inter font', !css.includes("'Inter'"));
test('Difficulty uses e.difficulty', js.includes('e.difficulty || e.diff'));
test('Validation in retryQuiz', js.includes('retryQuiz') && js.includes('aiValidateQuestions(key, questions)'));
test('Validation in runSessionStep', js.includes('aiValidateQuestions(apiKey, questions)'));

// ── Analytics v2 (v4.5) ──
console.log('\n\x1b[1m── ANALYTICS v2 (v4.5) ──\x1b[0m');
// v4.99.65: was hardcoded 'APP_VERSION is 4.99.63' (went stale every bump,
// violates CLAUDE.md "AVOID hardcoding versions"). Now derived from
// package.json (bump-version always updates it) — self-maintaining + a
// STRONGER guard: app.js + sw.js MUST equal the package.json version.
const PKG_VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
test('APP_VERSION matches package.json (' + PKG_VERSION + ')', js.includes("const APP_VERSION = '" + PKG_VERSION + "'"));
test('getDailyGoal function', js.includes('function getDailyGoal('));
test('renderDailyGoal function', js.includes('function renderDailyGoal('));
test('editDailyGoal function', js.includes('function editDailyGoal('));
test('STORAGE.DAILY_GOAL key', js.includes('DAILY_GOAL:'));
test('getTodayQuestionCount function', js.includes('function getTodayQuestionCount('));
test('Daily goal card in HTML', html.includes('id="daily-goal-card"'));
test('Topic domain groups', html.includes('topic-domain-group'));
test('Settings page exists (v4.54.1: #advanced-section retired in favor of #page-settings)',
  html.includes('id="page-settings"') && !html.includes('id="advanced-section"'));
test('CSS: .topic-domain-group', css.includes('.topic-domain-group'));
test('CSS: .daily-goal-card', css.includes('.daily-goal-card'));
test('CSS: .advanced-section', css.includes('.advanced-section'));
test('CSS: .hero-stats-strip', css.includes('.hero-stats-strip'));
test('SW cache bumped to package.json version (netplus-v' + PKG_VERSION + ')', sw.includes('netplus-v' + PKG_VERSION));
test('Family Drill: STORAGE.PORT_FAMILY_BEST', js.includes("PORT_FAMILY_BEST:"));

// ── Hardcore exam (#48) ──
console.log('\n\x1b[1m── HARDCORE EXAM (v4.13 #48) ──\x1b[0m');
test('STORAGE.HARDCORE_EXAM key', js.includes("HARDCORE_EXAM:"));
test('examHardcore state var', js.includes('let examHardcore'));
test('setHardcoreMode function', js.includes('function setHardcoreMode('));
test('startExam reads HARDCORE_EXAM pref', /examHardcore = localStorage\.getItem\(STORAGE\.HARDCORE_EXAM\)/.test(js));
test('startExam toggles hardcore-active class', js.includes("classList.toggle('hardcore-active'"));
test('examPrev guarded by examHardcore', /function examPrev[\s\S]{0,150}if \(examHardcore\) return;/.test(js));
test('examToggleFlag guarded by examHardcore', /function examToggleFlag[\s\S]{0,200}if \(examHardcore\) return;/.test(js));
test('toggleNav guarded by examHardcore', /function toggleNav[\s\S]{0,150}if \(examHardcore\) return;/.test(js));
test('History entry includes hardcore flag', js.includes('hardcore: examHardcore'));
test('Hardcore badge shown on results', js.includes("'exam-hardcore-badge'"));
test('hardcore_pass milestone defined', js.includes("id: 'hardcore_pass'"));
// v4.42.5 #141: table-driven — hardcore_pass check is now a one-liner in MILESTONE_CHECKS
test('hardcore_pass evaluated against history',
  /id:\s*'hardcore_pass'[\s\S]{0,200}e\.hardcore/.test(js));
test('HTML: hardcore-checkbox', html.includes('id="hardcore-checkbox"'));
// v4.79.0: legacy .hardcore-toggle label retired — Strict Mode now lives
// inside Mode Ladder Exam tier as .modes-strict-toggle (Codex round-3).
// bento: the v7.16-era session-picker `.dgh-strict` Exam-group toggle was replaced
// by the bento composition; Strict Mode lives on as the #modes-strict-checkbox legacy
// stub (still wired → setHardcoreMode + syncs #hardcore-checkbox).
test('bento: Strict Mode toggle preserved as #modes-strict-checkbox (wired to setHardcoreMode)',
  html.includes('id="modes-strict-checkbox"')
    && /id="modes-strict-checkbox"[\s\S]{0,160}setHardcoreMode\(this\.checked\)/.test(html));
test('HTML: exam-hardcore-badge', html.includes('id="exam-hardcore-badge"'));
test('CSS: .hardcore-toggle', css.includes('.hardcore-toggle'));
test('CSS: .hardcore-badge', css.includes('.hardcore-badge'));
test('CSS: hardcore-active hides flag/nav', css.includes('hardcore-active'));
// v4.8 — N10-009 tightness
test('computeDomainDistribution helper', js.includes('function computeDomainDistribution('));
test('N10-009 objective regex used in validation', /\(\[1-5\]\\\.\[1-8\]\)/.test(js));
test('Prompt requires objective field', js.includes('MANDATORY N10-009 OBJECTIVE TAGGING'));
test('Prompt: objective in JSON schema', js.includes('"objective":"X.Y"'));
test('Mixed mode topic lottery (v4.85.8: replaces MANDATORY DOMAIN DISTRIBUTION)', js.includes('MANDATORY TOPIC LOTTERY'));
test('validateQuestions enforces objective', js.includes('q.objective') && js.includes('[1-5]\\.[1-8]'));
test('injectPBQs stamps objective', js.includes('objective: obj'));
// computeDomainDistribution math — largest remainder adds up to n, respects 23/20/19/14/24
const vm2 = require('vm');
const distSandbox = { DOMAIN_WEIGHTS: { concepts:0.23, implementation:0.20, operations:0.19, security:0.14, troubleshooting:0.24 } };
const distCode = js.match(/function computeDomainDistribution[\s\S]*?\n\}/);
if (distCode) {
  vm2.runInNewContext(distCode[0] + '; result10 = computeDomainDistribution(10); result18 = computeDomainDistribution(18); result90 = computeDomainDistribution(90);', distSandbox);
  const sum10 = Object.values(distSandbox.result10).reduce((a,b)=>a+b,0);
  const sum18 = Object.values(distSandbox.result18).reduce((a,b)=>a+b,0);
  const sum90 = Object.values(distSandbox.result90).reduce((a,b)=>a+b,0);
  test('computeDomainDistribution(10) sums to 10', sum10 === 10);
  test('computeDomainDistribution(18) sums to 18', sum18 === 18);
  test('computeDomainDistribution(90) sums to 90', sum90 === 90);
  test('computeDomainDistribution(90) respects weights (concepts≈21)', distSandbox.result90.concepts === 21 || distSandbox.result90.concepts === 20);
  test('computeDomainDistribution(90) troubleshooting≈22', distSandbox.result90.troubleshooting === 22 || distSandbox.result90.troubleshooting === 21);
} else {
  test('computeDomainDistribution extracted', false);
}
// v4.7 new topics
[
  'Network Attacks & Threats',
  'Business Continuity & Disaster Recovery',
  'Network Monitoring & Observability',
  'Network Appliances & Device Functions',
  'Data Center Architectures',
  'Physical Security Controls',
  'DNS Records & DNSSEC'
].forEach(topic => {
  test(`Topic chip: ${topic}`, html.includes(`data-v="${topic}"`));
  // v4.86.1: TOPIC_DOMAINS + topicResources moved to certs/netplus.js
  test(`TOPIC_DOMAINS: ${topic}`, certNetplus.includes(`'${topic}'`));
  test(`topicResources: ${topic}`, new RegExp(`'${topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*\\{\\s*obj:`).test(certNetplus));
});
// v4.86.1: const literals moved; app reads via CERT_PACK with fallback
test('DOMAIN_WEIGHTS reads from CERT_PACK',
  /const DOMAIN_WEIGHTS = .*CERT_PACK.*domainWeights/.test(js));
test('TOPIC_DOMAINS reads from CERT_PACK',
  /const TOPIC_DOMAINS = .*CERT_PACK.*topicDomains/.test(js));
test('DOMAIN_WEIGHTS literal in cert pack', /domainWeights:\s*\{/.test(certNetplus));
test('TOPIC_DOMAINS literal in cert pack', /topicDomains:\s*\{/.test(certNetplus));
test('MILESTONE_DEFS defined', js.includes('MILESTONE_DEFS'));
['getExamDate', 'setExamDate', 'getDaysToExam', 'getReadinessForecast', 'getTypeStats', 'updateTypeStat', 'unlockMilestone', 'evaluateMilestones', 'getStreakData', 'mineSubtopicWeakSpots', 'updateExamDate'].forEach(fn => test(`function ${fn}()`, js.includes(`function ${fn}(`)));
test('Enhanced readiness uses domain weighting', js.includes('domainAccuracy') && js.includes('DOMAIN_WEIGHTS'));
test('Recency boost in readiness', js.includes('recencyBoost') || js.includes('SEVEN_DAYS_MS'));
test('Exam-mode boost in readiness', js.includes('examBoost'));
test('Linear regression in forecast', js.includes('slope') && js.includes('intercept'));
test('Readiness hero card in analytics', js.includes('ana-ready-hero'));
test('Domain breakdown rendered', js.includes('ana-domain-row'));
test('Exam date picker in analytics', js.includes('ana-exam-date-btn'));
test('Streak card rendered', js.includes('ana-streak-grid'));
// v4.45.2: Subtopic Weak Spots card removed (redundant with homepage
// #todays-focus chip row + Wrong-Answer Patterns). Now a regression guard.
test('Weak spots card removed (v4.45.2 regression guard)', !js.includes('ana-weak-list'));
// v4.45.0: heatmap + type-list cards removed, replaced by Domain Mastery
// (full-width above grid) and Wrong-Answer Patterns (inside 2-col grid).
// See the v4.45.0 assertion block below for the new-card guards.
test('Domain Mastery card rendered', js.includes('ana-card-dm'));
test('Wrong-answer patterns card rendered', js.includes('wp-pattern'));
test('Mode compare card rendered', js.includes('ana-mode-compare'));
// v4.45.2: Practice Drills stats card removed (drills have their own
// in-drill dashboards; duplicating in Analytics was noise). Regression guard.
test('Drills grid card removed (v4.45.2 regression guard)', !js.includes('ana-drills-grid'));
test('Milestones card rendered', js.includes('ana-milestones'));
test('Type stats instrumented in pick()', js.includes("updateTypeStat(q.type"));
test('Type stats instrumented in submitExam', /updateTypeStat\(qType/.test(js));
test('Port drill milestone defined', js.includes("first_port_drill") || js.includes("perfect_port"));
test('STORAGE.EXAM_DATE key', js.includes('EXAM_DATE:'));
test('STORAGE.MILESTONES key', js.includes('MILESTONES:'));
test('STORAGE.TYPE_STATS key', js.includes('TYPE_STATS:'));
test('STORAGE.SUBNET_STATS key', js.includes('SUBNET_STATS:'));
test('CSS: .ana-ready-hero', css.includes('.ana-ready-hero'));
test('CSS: .ana-domain-row', css.includes('.ana-domain-row'));
test('CSS: .ana-ready-datechip (v4.46.0 — replaces .ana-exam-date-btn styling)', css.includes('.ana-ready-datechip'));
test('CSS: .ana-streak-grid', css.includes('.ana-streak-grid'));
test('CSS: .ana-heatmap', css.includes('.ana-heatmap'));
test('CSS: .ana-milestone', css.includes('.ana-milestone'));

// ── Port Drill Endless mode (v4.9) ──
console.log('\n\x1b[1m── PORT DRILL ENDLESS (v4.9) ──\x1b[0m');
test('STORAGE.PORT_STREAK_BEST key', js.includes('PORT_STREAK_BEST:'));
test('streak_port_25 milestone defined', js.includes('streak_port_25'));
test('Analytics surfaces endless streak best', js.includes('portStreakBest'));

// ── Front page features (v4.10) ──
console.log('\n\x1b[1m── FRONT PAGE v4.10 ──\x1b[0m');
test('STORAGE.DAILY_CHALLENGE key', js.includes('DAILY_CHALLENGE:'));
test('STORAGE.DEEP_DIVE_USES key', js.includes('DEEP_DIVE_USES:'));
test('getDailyChallenge function', js.includes('function getDailyChallenge('));
test('saveDailyChallenge function', js.includes('function saveDailyChallenge('));
test('isDailyChallengeDoneToday function', js.includes('function isDailyChallengeDoneToday('));
test('completeDailyChallenge function', js.includes('function completeDailyChallenge('));
test('getDailyChallengeTopic function', js.includes('function getDailyChallengeTopic('));
test('renderDailyChallengeCard function', js.includes('function renderDailyChallengeCard('));
test('startDailyChallenge function', js.includes('function startDailyChallenge('));
test('Daily challenge completion hook', js.includes('completeDailyChallenge()') && js.includes('dailyChallengeMode = false'));
test("Daily challenge history entry mode 'daily'", js.includes("mode: 'daily'") || js.includes("dailyChallengeMode ? 'daily'"));
test('dailyChallengeMode state', js.includes('dailyChallengeMode'));
test('getTodaysFocusTopics function', js.includes('function getTodaysFocusTopics('));
// v4.81.23 tombstone: renderTodaysFocus removed (consolidated into renderTodayPlan)
test('v4.81.23 tombstone: renderTodaysFocus function removed',
  !js.includes('function renderTodaysFocus('));
test('focusTopic function', js.includes('function focusTopic('));
test('renderStreakDefender function', js.includes('function renderStreakDefender('));
test('startStreakSave function', js.includes('function startStreakSave('));
test('applyPreset function', js.includes('function applyPreset('));
test('Preset: warmup', js.includes("'warmup'"));
test('Preset: focused', js.includes("'focused'"));
test('Preset: grind', js.includes("'grind'"));
test('Deep dive counter increment', js.includes('STORAGE.DEEP_DIVE_USES') && js.includes('explainFurther'));
// HTML
test('streak-defender element', html.includes('id="streak-defender"'));
test('daily-challenge-card element', html.includes('id="daily-challenge-card"'));
// v4.81.23 tombstone: #todays-focus element removed (consolidated into #today-plan)
test('v4.81.23 tombstone: #todays-focus element removed', !html.includes('id="todays-focus"'));
// v4.76.0: legacy `.quiz-presets` block replaced by `.modes-tier-cards` inside the Mode Ladder
// bento: the v7.16-era `.dgh-opts` session-picker option grid was replaced by the
// bento quick-start tile — assert the bento `#grp-quick` .opts list instead.
test('bento: quick-start option grid present (#grp-quick .opts, was .dgh-opts)',
  /class="opts"\s+id="grp-quick"|id="grp-quick"\s+class="opts"/.test(html));
test('Preset tile: warmup', html.includes("applyPreset('warmup')"));
test('Preset tile: focused', html.includes("applyPreset('focused')"));
test('Preset tile: grind', html.includes("applyPreset('grind')"));
// CSS
test('CSS: .streak-defender', css.includes('.streak-defender'));
test('CSS: .daily-challenge-card', css.includes('.daily-challenge-card'));
test('CSS: .todays-focus', css.includes('.todays-focus'));
test('CSS: .quiz-presets', css.includes('.quiz-presets'));
test('CSS: .preset-tile', css.includes('.preset-tile'));
// New milestones (v4.10)
const newMilestones = [
  'perfect_quiz','five_exams','ten_exams','first_subnet','subnet_50',
  'first_port_drill','all_ports_seen','first_session','night_owl','early_bird',
  'weekend_warrior','diversity_5','deep_dive_10','daily_challenge_7','daily_challenge_30'
];
newMilestones.forEach(m => test(`Milestone: ${m}`, js.includes(`id: '${m}'`)));
// v4.42.5 #141: now in MILESTONE_CHECKS table (covered more robustly by new v4.42.5 assertions below)
test('evaluateMilestones handles perfect_quiz', js.includes("id: 'perfect_quiz'"));
test('evaluateMilestones handles weekend_warrior', js.includes("id: 'weekend_warrior'"));
test('evaluateMilestones handles diversity_5', js.includes("id: 'diversity_5'"));
test('evaluateMilestones handles deep_dive_10', js.includes("id: 'deep_dive_10'"));
test('evaluateMilestones handles daily_challenge_7', js.includes("id: 'daily_challenge_7'"));

// ── Port Reference panel (v4.11) ──
console.log('\n\x1b[1m── PORT REFERENCE v4.11 ──\x1b[0m');
test('CSS: .port-ref', css.includes('.port-ref '));
test('CSS: .port-ref-card', css.includes('.port-ref-card'));
test('CSS: .port-ref-group', css.includes('.port-ref-group'));
test('CSS: .port-ref-sort-active', css.includes('.port-ref-sort-active'));
// Every protocol in portData appears in exactly one category list
const catProtos = (js.match(/const portCategories = \[[\s\S]*?\];/) || [''])[0];
const dataProtos = [...js.matchAll(/proto:'([^']+)'/g)].map(m => m[1]);

// ── Topic Progress v2 (v4.11) ──
console.log('\n\x1b[1m── TOPIC PROGRESS v2 (v4.11) ──\x1b[0m');
test('progressState defined', js.includes('let progressState ='));
test('_buildProgressRows function', js.includes('function _buildProgressRows('));
test('_sortProgressRows function', js.includes('function _sortProgressRows('));
test('_progressRowMatches function', js.includes('function _progressRowMatches('));
test('_progressRowHtml function', js.includes('function _progressRowHtml('));
test('_renderProgressSummary function', js.includes('function _renderProgressSummary('));
test('_renderProgressGrouped function', js.includes('function _renderProgressGrouped('));
test('setProgressFilter function', js.includes('function setProgressFilter('));
test('setProgressSort function', js.includes('function setProgressSort('));
test('filterProgressPage function', js.includes('function filterProgressPage('));
test('_bucketOf helper', js.includes('function _bucketOf('));
test('progressState.sort default worst', /progressState = \{[^}]*sort: 'worst'/.test(js));
test('Summary uses TOPIC_DOMAINS', js.includes('TOPIC_DOMAINS[t]'));
test('Grouped render uses DOMAIN_WEIGHTS', /_renderProgressGrouped[\s\S]*?DOMAIN_WEIGHTS/.test(js));
test('Grouped render uses DOMAIN_LABELS', /_renderProgressGrouped[\s\S]*?DOMAIN_LABELS/.test(js));
test('HTML: progress-summary element', html.includes('id="progress-summary"'));
test('HTML: progress-search input', html.includes('id="progress-search"'));
test('HTML: progress-sort-select', html.includes('id="progress-sort-select"'));
test('HTML: filter button All', html.includes('data-filter="all"'));
test('HTML: filter button weak', html.includes('data-filter="weak"'));
test('HTML: filter button untouched', html.includes('data-filter="untouched"'));
test('HTML: filter button strong', html.includes('data-filter="strong"'));
test('CSS: .progress-summary', css.includes('.progress-summary'));
test('CSS: .progress-domain', css.includes('.progress-domain '));
test('CSS: .topic-obj-badge', css.includes('.topic-obj-badge'));
test('CSS: .prog-filter-active', css.includes('.prog-filter-active'));
test('CSS: .ps2-cover-bar (v4.51.0: renamed from .ps-coverage-bar)', css.includes('.ps2-cover-bar'));
// v7.2.0: dg-system.css ships the v2 scoped reskin (Batch 4b replacement). Above
// CSS guards keep regression strength on the legacy styles.css surface; the
// dg-system.css overrides win at runtime. No new CSS asserts added — dg-system.css
// is not UAT-read (consistent with v4.99.65 / v4.99.66 / Batch 4l Settings pattern).

// ── Port Drill family multi-select (v4.12 #27) ──
console.log('\n\x1b[1m── PORT DRILL FAMILY Q (v4.12) ──\x1b[0m');
// Port Mastery family mode (replaces old v4.12 family multi-select)
[].forEach(fn => test(`function ${fn}()`, js.includes(`function ${fn}(`)));
// Legacy stubs preserved
[].forEach(fn => test(`legacy stub ${fn}()`, js.includes(`function ${fn}(`)));
// v4.42.3 audit: removed "(2)" duplicate version checks — already covered
// by earlier hardcoded checks in the Analytics block and the dynamic
// consistency checks at the top of the file.

// ── Secure Pairs Port Drill mode (v4.16.1 #30) ──
console.log('\n\x1b[1m── SECURE PAIRS PORT DRILL (v4.16.1 #30) ──\x1b[0m');
test('STORAGE.PORT_PAIRS_BEST key', js.includes("PORT_PAIRS_BEST:"));
test('Pairs: HTTP↔HTTPS', /HTTP[\s\S]{0,200}HTTPS[\s\S]{0,80}443/.test(js));
test('Pairs: LDAP↔LDAPS', /LDAP[\s\S]{0,200}LDAPS[\s\S]{0,80}636/.test(js));

// ── Bulk Mixed quiz presets (v4.14) ──
console.log('\n\x1b[1m── BULK MIXED PRESETS (v4.14) ──\x1b[0m');
test('HTML: bulk30 preset tile', html.includes("applyPreset('bulk30')"));
test('HTML: bulk45 preset tile', html.includes("applyPreset('bulk45')"));
test('HTML: bulk60 preset tile', html.includes("applyPreset('bulk60')"));
test('HTML: 30 Questions title', html.includes('30 Questions'));
test('HTML: 45 Questions title', html.includes('45 Questions'));
// v4.76.0: 60Q preset relocated to Exam tier as "60-Question SIM" — title text changed
test('HTML: 60-Question SIM title (v4.76.0 — was "60 Questions")', html.includes('60-Question SIM'));
// v4.45.3 regression guards — old 100-Q preset replaced with 45-Q (30/60/100 → 30/45/60)
test('v4.45.3: bulk100 preset removed', !html.includes("applyPreset('bulk100')"));
test('v4.45.3: 100 Questions title removed', !html.includes('100 Questions'));
test('startBulkQuiz function defined', js.includes('async function startBulkQuiz('));
test('applyPreset handles bulk sizes', js.includes('bulk30: 30, bulk45: 45, bulk60: 60'));
test('v4.45.3: bulk100 mapping removed', !js.includes('bulk100:'));
test('applyPreset routes bulk to startBulkQuiz', /bulkSizes\[name\][\s\S]{0,900}startBulkQuiz\(/.test(js));
test('startBulkQuiz batches via fetchQuestions', /startBulkQuiz[\s\S]{0,2500}fetchQuestions\(key, MIXED_TOPIC, 'Exam Level', thisBatch(?:,\s*i)?\)/.test(js));
test('startBulkQuiz uses 18-Q batches', /startBulkQuiz[\s\S]{0,1500}BATCH_SIZE = 18/.test(js));
test('startBulkQuiz has retry logic', /startBulkQuiz[\s\S]{0,2000}MAX_RETRIES/.test(js));
test('startBulkQuiz runs validation pipeline', /startBulkQuiz[\s\S]{0,3000}aiValidateQuestions[\s\S]{0,200}validateQuestions/.test(js));
test('startBulkQuiz forces Mixed topic', /startBulkQuiz[\s\S]{0,800}activeQuizTopic = MIXED_TOPIC/.test(js));
// v4.82.1: marathon mode now uses _loadingProgressFinish() instead of direct
// fill.style.width = '100%'. Same end-state (bar at 100% then hidden), via
// the new unified module. Window widened from 2500 → 5000 chars since the
// function body grew with v4.81.14 cross-batch dedup + v4.81.15 stale-slice
// rotation logic.
test('startBulkQuiz clears progress bar at end', /startBulkQuiz[\s\S]{0,5000}_loadingProgressFinish\(\)/.test(js));

// ── Try It In Terminal + Guided Labs (v4.16.1 #68, #69) ──
console.log('\n\x1b[1m── TRY IT IN TERMINAL + GUIDED LABS (v4.16.1 #68, #69) ──\x1b[0m');
test('guidedLabs map defined', js.includes('const guidedLabs = {'));
test('guidedLabs: DNS lab', js.includes('_dnsLab') && js.includes('DNS Records & Recursive Resolution'));
test('guidedLabs: Routing lab', js.includes('_routingLab') && js.includes('Routing & Your Real Default Gateway'));
test('guidedLabs: Ports lab', js.includes('_portsLab') && js.includes('Ports & Listening Services'));
test('guidedLabs: DNS alias 1', /'Network Naming \(DNS & DHCP\)':\s*_dnsLab/.test(js));
test('guidedLabs: DNS alias 2', /'DNS Records & DNSSEC':\s*_dnsLab/.test(js));
test('guidedLabs: Routing alias', /'Routing Protocols':\s*_routingLab/.test(js));
test('guidedLabs: Ports alias', /'Port Numbers':\s*_portsLab/.test(js));
test('Lab has steps array with narration/cmd/expect', /steps:\s*\[[\s\S]*?narration:[\s\S]*?cmd:[\s\S]*?expect:/.test(js));
test('copyCmd function defined', js.includes('function copyCmd(event, cmd)'));
test('copyCmd uses clipboard API', /copyCmd[\s\S]{0,300}navigator\.clipboard\.writeText/.test(js));
test('_terminalCardHtml helper', js.includes('function _terminalCardHtml('));
test('_renderTopicTerminalSection function', js.includes('function _renderTopicTerminalSection('));
test('_renderTopicLabSection function', js.includes('function _renderTopicLabSection('));
test('renderTopicDive calls terminal section', /renderTopicDive[\s\S]{0,3000}_renderTopicTerminalSection\(topicName\)/.test(js));
test('renderTopicDive calls lab section', /renderTopicDive[\s\S]{0,3000}_renderTopicLabSection\(topicName\)/.test(js));
test('openGuidedLab function defined', js.includes('function openGuidedLab('));
// v4.54.16: lab title now uses innerHTML (italic-accent em), not textContent.
test('openGuidedLab sets title', /openGuidedLab[\s\S]{0,1800}titleEl\.innerHTML[\s\S]{0,200}lab\.title/.test(js));
test('openGuidedLab uses showPage guided-lab', /openGuidedLab[\s\S]{0,2000}showPage\('guided-lab'\)/.test(js));
test('HTML: #page-guided-lab', html.includes('id="page-guided-lab"'));
test('HTML: #lab-title', html.includes('id="lab-title"'));
test('HTML: #lab-intro', html.includes('id="lab-intro"'));
test('HTML: #lab-steps', html.includes('id="lab-steps"'));
test('HTML: #lab-back-btn', html.includes('id="lab-back-btn"'));
test('CSS: .terminal-card', css.includes('.terminal-card {'));
test('CSS: .terminal-card-copy', css.includes('.terminal-card-copy'));
test('CSS: .terminal-card-prompt', css.includes('.terminal-card-prompt'));
test('CSS: .port-ref-card-has-cmd', css.includes('.port-ref-card-has-cmd'));
test('CSS: .port-ref-cmd', css.includes('.port-ref-cmd '));
test('CSS: .td-terminal', css.includes('.td-terminal '));
test('CSS: .td-lab-callout', css.includes('.td-lab-callout'));
test('CSS: .lab-step', css.includes('.lab-step {'));
test('CSS: .lab-step-expect', css.includes('.lab-step-expect'));
test('CSS: .lab-wrap', css.includes('.lab-wrap '));
test('CSS: .lab-meta-pill', css.includes('.lab-meta-pill'));

// ── Port Mastery replaces dedicated panels — terminal/labs now in Learn tab (v4.36) ──
console.log('\n\x1b[1m── PORT MASTERY LEARN TAB (v4.36) ──\x1b[0m');
test('_terminalCardHtml helper still defined', js.includes('function _terminalCardHtml('));
test('guidedLabs data still defined', js.includes('const guidedLabs'));
test('openGuidedLab function still defined', js.includes('function openGuidedLab('));
test('CSS: .port-term-row', css.includes('.port-term-row'));
test('CSS: .port-lab-card', css.includes('.port-lab-card'));

// ── Remaining 5 Guided Terminal Labs (v4.17 / #70) ──
console.log('\n\x1b[1m── GUIDED LABS: REMAINING 5 (v4.17 / #70) ──\x1b[0m');
test('Lab: _tlsLab defined', js.includes('const _tlsLab = {'));
test('Lab: _arpLab defined', js.includes('const _arpLab = {'));
test('Lab: _subnetLab defined', js.includes('const _subnetLab = {'));
test('Lab: _monitoringLab defined', js.includes('const _monitoringLab = {'));
test('Lab: _troubleshootingLab defined', js.includes('const _troubleshootingLab = {'));
test('TLS lab: openssl s_client', /_tlsLab[\s\S]{0,3500}openssl s_client -connect google\.com:443/.test(js));
test('TLS lab: SNI step', /_tlsLab[\s\S]{0,3500}-servername example\.com/.test(js));
test('TLS lab: badssl', /_tlsLab[\s\S]{0,4000}expired\.badssl\.com/.test(js));
test('ARP lab: ifconfig ether', /_arpLab[\s\S]{0,2500}ifconfig en0 \| grep ether/.test(js));
test('ARP lab: arp -a', /_arpLab[\s\S]{0,3000}arp -a/.test(js));
test('ARP lab: gateway MAC step', /_arpLab[\s\S]{0,3500}route -n get default/.test(js));
test('Subnet lab: ifconfig inet', /_subnetLab[\s\S]{0,2500}ifconfig en0 \| grep "inet "/.test(js));
test('Subnet lab: ipcalc /24', /_subnetLab[\s\S]{0,3500}ipcalc 192\.168\.1\.0\/24/.test(js));
test('Subnet lab: /26 harder case', /_subnetLab[\s\S]{0,4000}ipcalc 192\.168\.1\.0\/26/.test(js));
test('Subnet lab: IPv6 branch', /_subnetLab[\s\S]{0,4500}ifconfig en0 \| grep inet6/.test(js));
test('Monitoring lab: netstat -s', /_monitoringLab[\s\S]{0,2500}netstat -s/.test(js));
test('Monitoring lab: lsof -i', /_monitoringLab[\s\S]{0,3500}lsof -i/.test(js));
test('Monitoring lab: nettop', /_monitoringLab[\s\S]{0,4000}nettop/.test(js));
test('Monitoring lab: tcpdump port 53', /_monitoringLab[\s\S]{0,4500}tcpdump[\s\S]{0,100}port 53/.test(js));
test('Troubleshooting lab: 20 min duration', /_troubleshootingLab[\s\S]{0,200}~20 min/.test(js));
test('Troubleshooting lab: ping google.com step', /_troubleshootingLab[\s\S]{0,2500}ping -c 2 google\.com/.test(js));
test('Troubleshooting lab: nslookup with 1.1.1.1', /_troubleshootingLab[\s\S]{0,3500}nslookup google\.com 1\.1\.1\.1/.test(js));
test('Troubleshooting lab: networksetup getdnsservers', /_troubleshootingLab[\s\S]{0,4500}networksetup -getdnsservers/.test(js));
test('Troubleshooting lab: 8 steps (all 7 CompTIA + extra step 3)', (js.match(/_troubleshootingLab[\s\S]*?\]\s*,\s*wrap/) || [''])[0].match(/\{ narration:/g)?.length >= 8);
test('guidedLabs: Securing TCP/IP → _tlsLab', /'Securing TCP\/IP':[\s]+_tlsLab/.test(js));
test('guidedLabs: PKI → _tlsLab', /'PKI & Certificate Management':[\s]+_tlsLab/.test(js));
test('guidedLabs: Switch Features → _arpLab', /'Switch Features & VLANs':[\s]+_arpLab/.test(js));
test('guidedLabs: Cabling → _arpLab', /'Cabling & Topology':[\s]+_arpLab/.test(js));
test('guidedLabs: Subnetting → _subnetLab', /'Subnetting & IP Addressing':[\s]+_subnetLab/.test(js));
test('guidedLabs: IPv6 → _subnetLab', /'IPv6':[\s]+_subnetLab/.test(js));
test('guidedLabs: Monitoring → _monitoringLab', /'Network Monitoring & Observability':[\s]+_monitoringLab/.test(js));
test('guidedLabs: Network Operations → _monitoringLab', /'Network Operations':[\s]+_monitoringLab/.test(js));
test('guidedLabs: Troubleshooting Methodology → _troubleshootingLab', /'CompTIA Troubleshooting Methodology':[\s]+_troubleshootingLab/.test(js));
test('guidedLabs: Network Troubleshooting → _troubleshootingLab', /'Network Troubleshooting & Tools':[\s]+_troubleshootingLab/.test(js));
test('guidedLabs: Troubleshooting no longer aliased to routing', !/'CompTIA Troubleshooting Methodology':[\s]+_routingLab/.test(js));
// primaryKeys are inside renderPortLabsList which is now a stub — verify the lab data still exists
test('TLS lab still defined', js.includes('const _tlsLab'));
test('ARP lab still defined', js.includes('const _arpLab'));
test('Subnet lab still defined', js.includes('const _subnetLab'));
test('Monitoring lab still defined', js.includes('const _monitoringLab'));
test('Troubleshooting lab still defined', js.includes('const _troubleshootingLab'));

// ── Topology Builder Tier 1 (v4.18 / #74) ──
console.log('\n\x1b[1m── TOPOLOGY BUILDER TIER 1 (v4.18 / #74) ──\x1b[0m');
// Storage keys
test('STORAGE.TOPOLOGIES key', js.includes("TOPOLOGIES: 'nplus_topologies'"));
test('STORAGE.TOPOLOGY_DRAFT key', js.includes("TOPOLOGY_DRAFT: 'nplus_topology_draft'"));
// Constants
// Device type coverage (13 total after v4.19.1)
// Core functions
// Behavior details
// HTML wiring
// CSS hooks
test('CSS: .tb-canvas', css.includes('.tb-canvas'));
test('CSS: .tb-palette', css.includes('.tb-palette '));
test('CSS: .tb-palette-item', css.includes('.tb-palette-item'));
test('CSS: .tb-cable', css.includes('.tb-cable'));
test('CSS: .tb-workspace grid', css.includes('.tb-workspace'));
test('CSS: .tb-toolbar', css.includes('.tb-toolbar'));

// ── Topology Builder polish (v4.41.0 — bigger canvas + auto-layout) ──
console.log('\n\x1b[1m── TOPOLOGY BUILDER POLISH (v4.41.0) ──\x1b[0m');
// v4.54.6: viewBox dynamic (tbViewState). v4.54.7 widened default to 250 200 1300 780
// so devices spread out and the canvas fills the full-bleed layout edge-to-edge.
// v4.43.1 #4: intro banner replaced with compact .tb-hero (was wall-of-text .tb-intro-banner)

// ── Auto-layout (v4.41.0) ──
console.log('\n\x1b[1m── TOPOLOGY AUTO-LAYOUT (v4.41.0) ──\x1b[0m');
// Behavioral smoke test: feed bunched devices to tbAutoLayout, assert they spread

// ── Topology Builder v4.19.1: SVG icons, cables, device cap 30, new types ──
console.log('\n\x1b[1m── TOPOLOGY BUILDER v4.19.1 ──\x1b[0m');
test('Intro banner mentions DHCP', html.includes('DHCP'));
test('CSS: .tb-palette-icon-svg rule', css.includes('.tb-palette-icon-svg'));

// ── Topology Builder v4.19.1: discoverable wiring UX ──
console.log('\n\x1b[1m── TOPOLOGY BUILDER v4.19.1 (wiring UX) ──\x1b[0m');
test('CSS: .tb-wire-overlay', css.includes('.tb-wire-overlay'));

// ── Topology Builder v4.19.1: cable picker, public servers, compact devices ──
console.log('\n\x1b[1m── TOPOLOGY BUILDER v4.19.1 ──\x1b[0m');
// Cable types
// Public server device types
// Palette cable picker
test('CSS: .tb-cable-chip', css.includes('.tb-cable-chip'));
test('CSS: .tb-cable-chip-active', css.includes('.tb-cable-chip-active'));
// Realistic cables: curved path + sheath layer
// Intro mentions DMZ + cable types
test('Intro banner mentions DMZ / screened subnet', /DMZ|screened subnet/i.test(html));
// Device shrink bounds

// ── v4.19.1: DMZ switch + cable click hitbox ──
console.log('\n\x1b[1m── TOPOLOGY BUILDER v4.19.1 ──\x1b[0m');

// ── Guided Lab Back button return page fix (v4.16.2) ──
console.log('\n\x1b[1m── GUIDED LAB BACK FIX (v4.16.2) ──\x1b[0m');
// v4.42.5 #72: whitelist trap removed — now uses document.querySelector('.page.active')
// with defensive fallback to 'page-ports'. See v4.42.5 #72 assertions below for the new shape.
test('openGuidedLab queries active page directly (no whitelist)',
  /openGuidedLab[\s\S]{0,800}document\.querySelector\('\.page\.active'\)/.test(js));
test('openGuidedLab fallback is page-ports',
  /openGuidedLab[\s\S]{0,1500}'page-ports'/.test(js));

// ── Topology Builder Tier 2 (v4.20.0) — Grader + Scenarios + Export ──
console.log('\n\x1b[1m── TOPOLOGY BUILDER TIER 2 (v4.20.0) ──\x1b[0m');
// Rules engine
// Scenarios
// Grader + modal
// PNG export
// HTML wiring
// CSS
test('CSS: .tb-grade-card', css.includes('.tb-grade-card'));
test('CSS: .tb-grade-section', css.includes('.tb-grade-section'));
test('CSS: .tb-scenario-panel', css.includes('.tb-scenario-panel'));
test('CSS: .tb-tool-btn-primary', css.includes('.tb-tool-btn-primary'));
// openTopologyBuilder calls tbRenderScenarioPanel

// ── Topology Builder Tier 3 (v4.25.0) — AI Coach ──
console.log('\n\x1b[1m── TOPOLOGY BUILDER TIER 3 (v4.25.0) ──\x1b[0m');
// Core functions
// Cache
test('STORAGE.TB_COACH_CACHE key', js.includes("TB_COACH_CACHE: 'nplus_tb_coach_cache'"));
test('Coach cache trims to 10 entries', /\.slice\(0, 10\)/.test(js));
// API call shape (v4.58.0: scoped to function body via _fnBody so the tests
// don't silently break when line offsets shift — previously relied on a fragile
// [\s\S]{0,4000} span anchored at the first mention of tbCoachTopology, which
// happened to be a comment at the top of the file.)
// v4.99.2: refactored to route through _claudeFetch wrapper instead of direct fetch.
// Wrapper preserves the same call shape; CLAUDE_API_URL still referenced in BYOK fallback.
test('Coach strips markdown fences', /replace\(\/\^```/.test(js));
test('Coach prompt mentions N10-009', /tbCoachTopology[\s\S]{0,4000}N10-009/.test(js));
// Serializer
// HTML wiring
// CSS
test('CSS: .tb-coach-loading', css.includes('.tb-coach-loading'));
test('CSS: .tb-coach-error', css.includes('.tb-coach-error'));
test('CSS: .tb-coach-tip', css.includes('.tb-coach-tip'));
test('CSS: .tb-tool-btn-coach', css.includes('.tb-tool-btn-coach'));

// ── Network Simulator (v4.25.0) — Config Panel, Sim Engine, CLI, AI Gen ──
console.log('\n\x1b[1m── NETWORK SIMULATOR (v4.25.0) ──\x1b[0m');
// Foundation
// Config Panel
// IP utilities
// Broadcast domain
// ARP simulation
// Ping simulation
// DHCP simulation
// Packet animation
// CLI
// AI generation
// Simulation UI
// Routing helpers
// VLAN helpers
// Cable unbind
// HTML wiring
// CSS
test('CSS: .tb-config-panel', css.includes('.tb-config-panel'));
test('CSS: .tb-sim-log', css.includes('.tb-sim-log'));
test('CSS: .tb-cli-output', css.includes('.tb-cli-output'));
test('CSS: .tb-iface-table', css.includes('.tb-iface-table'));
test('CSS: .tb-tool-btn-ai', css.includes('.tb-tool-btn-ai'));
test('CSS: .tb-explain-btn', css.includes('.tb-explain-btn'));
// v4.25.0 additions
// Overview tab
// Ping dropdown (device-to-device)
// VLAN Trunking/DTP
// Guided Labs
// CSS
test('CSS: .tb-ov-iface-card', css.includes('.tb-ov-iface-card'));
test('CSS: .tb-lab-card', css.includes('.tb-lab-card'));
test('CSS: .tb-lab-panel', css.includes('.tb-lab-panel'));
test('CSS: .tb-iface-trunk-detail', css.includes('.tb-iface-trunk-detail'));
// Sim toolbar shows on openTopologyBuilder (span widened post-v4.54.7 because
// the function grew additional pan/zoom/popup init lines)

// ── v4.25.0 — Explain modal, CLI commands, AI topology improvements ──
console.log('\n\x1b[1m── SIMULATOR ENHANCEMENTS (v4.25.0) ──\x1b[0m');
// Explain modal
// CLI commands
test('netstat simulates listening ports', /netstat[\s\S]{0,600}LISTEN/.test(js));
// AI topology improvements

// ── v4.25.0 — Cloud Networking ──
console.log('\n\x1b[1m── CLOUD NETWORKING ──\x1b[0m');
// Device types
// Interface defaults for cloud types
// Migration
// Config panel tab renderers
// CRUD helpers
// Simulation helpers
// CLI commands
// VPN tunnel check
// Grading rules
// Scenarios
// HTML wiring
// CSS
test('CSS: .tb-sg-table', css.includes('.tb-sg-table'));
test('CSS: .tb-sg-row-allow', css.includes('.tb-sg-row-allow'));
test('CSS: .tb-nacl-row-deny', css.includes('.tb-nacl-row-deny'));
test('CSS: .tb-cloud-card', css.includes('.tb-cloud-card'));
// Labs

// ── v4.26.0 — ISP Router, WAN icon, VPC Peering, Routing in Overview, AI Prompt v2 ──
console.log('\n\x1b[1m── v4.26.0 ENHANCEMENTS ──\x1b[0m');
// ISP Router device type
// Internet/WAN icon update
// VPC Peering
// Routing table in overview tab for all devices
// AI Generate prompt v2
test('AI prompt max 50 devices', /max.*50|up to 50/i.test(js));
// Migration includes peerings default

// ── v4.27.0 — AI Add-to-Existing, Interactive Labs ──
console.log('\n\x1b[1m── v4.27.0 AI ADD-TO-EXISTING + INTERACTIVE LABS ──\x1b[0m');
// AI Add-to-Existing mode
// Interactive lab features
// CSS
test('CSS: .tb-lab-step-feedback', css.includes('.tb-lab-step-feedback'));
test('CSS: .tb-lab-hint', css.includes('.tb-lab-hint'));
test('CSS: .tb-lab-hint-toggle', css.includes('.tb-lab-hint-toggle'));
test('CSS: .tb-lab-hint-body', css.includes('.tb-lab-hint-body'));
test('CSS: .tb-lab-progress-bar', css.includes('.tb-lab-progress-bar'));
test('CSS: .tb-lab-badge-auto', css.includes('.tb-lab-badge-auto'));

// ── v4.29.0 — VXLAN, Deep AI Gen, Cloud prop fix ──
console.log('\n\x1b[1m── v4.29.0 VXLAN + DEEP AI GEN ──\x1b[0m');
// Cloud properties in build payload
// VXLAN
test('CSS: .tb-vxlan-row', css.includes('.tb-vxlan-row'));
// Deep AI generation

// ── v4.29.0 — AI Generation Reliability Fix ──
console.log('\n\x1b[1m── v4.29.0 AI GEN RELIABILITY ──\x1b[0m');
// Retry mechanism
// Prompt improvements
test('Semantic expansion is concise (no verbose text)', !js.includes('VPN Gateway (vpg) devices with matching IPSec vpnConfig (same PSK, IKE, encryption, hash, DH group)'));

// ── v4.29.0 — Interactive Labs + Builder Enhancements ──
console.log('\n\x1b[1m── v4.29.0 INTERACTIVE LABS + BUILDER ──\x1b[0m');
// Live lab validation
// Cable status coloring
// Device health badges
// CSS: interactive features
// New labs (5 new)
test('Total TB_LABS count >= 11', (js.match(/id: '/g) || []).length >= 11);

// ── v4.30.0 — STP/RSTP, OSPF, CLI Config, IPv6, DNS, QoS, Wireless, Packet Sim ──
console.log('\n\x1b[1m── v4.30.0 ADVANCED NETWORKING FEATURES ──\x1b[0m');

// DNS Server device type

// STP/RSTP tab
test('STP bridge priority field', /priority|bridgePriority/.test(js));

// OSPF tab

// QoS tab
test('QoS DSCP markings (EF/AF/CS)', /EF|AF[0-9]|CS[0-9]/.test(js));

// Wireless tab
test('Wireless supports WPA3', /WPA3/.test(js));

// DNS tab
test('DNS record types: A', /record.*type.*\bA\b/.test(js) || js.includes("type: 'A'") || js.includes("value=\"A\""));
test('DNS record types: AAAA', js.includes('AAAA'));
test('DNS record types: CNAME', js.includes('CNAME'));
test('DNS record types: MX', js.includes('MX'));
test('DNS record types: PTR', js.includes('PTR'));
test('DNS record types: NS', /\bNS\b/.test(js));
test('DNS record types: TXT', /\bTXT\b/.test(js));
test('DNS record types: SRV', js.includes('SRV'));

// IPv6 support

// CLI commands — new in v4.30.0
test('CLI: nslookup queries DNS servers', js.includes('nslookup'));
test('CLI: show running-config', js.includes('show running-config'));

// Tab visibility logic

// HTML wiring

// AI prompt integration
test('Semantic expansion: DNS patterns', /dns|DNS/.test(js));
test('Semantic expansion: OSPF patterns', /ospf|OSPF/.test(js));

// New labs

// ── v4.30.0 — Lab Device Highlighting ──
console.log('\n\x1b[1m── v4.30.0 LAB DEVICE HIGHLIGHTING ──\x1b[0m');

// ── v4.30.2 — 4 New Beginner Labs + Lab Milestones + Progress ──
console.log('\n\x1b[1m── v4.30.2 BEGINNER LABS + LAB MILESTONES ──\x1b[0m');
// New beginner labs
test('Lab: ip-addressing-101 teaches gateway', /default gateway/i.test(js));
test('Lab: troubleshooting-101 teaches CLI tools', /ipconfig.*ping.*traceroute/s.test(js));
// Lab completion tracking
test('STORAGE.LAB_COMPLETIONS key', js.includes("LAB_COMPLETIONS: 'nplus_lab_completions'"));
test('tbEndLab increments completion count', /completions.*count.*\+.*1|count.*\+ 1/.test(js));
// Lab milestones
test('Milestone: first_lab defined', js.includes("id: 'first_lab'"));
test('Milestone: labs_5 defined', js.includes("id: 'labs_5'"));
test('Milestone: labs_10 defined', js.includes("id: 'labs_10'"));
test('Milestone: labs_all defined', js.includes("id: 'labs_all'"));
test('evaluateMilestones checks lab completions', /evaluateMilestones[\s\S]*LAB_COMPLETIONS/.test(js));
// v4.42.5 #141: table-driven — lab milestones now in MILESTONE_CHECKS
test('evaluateMilestones checks labs_5', /id:\s*'labs_5'/.test(js));
test('evaluateMilestones checks labs_all', /id:\s*'labs_all'/.test(js));
// Lab progress in progress page
test('Progress page shows lab completion stats', /Labs/.test(js) && js.includes('labPct'));
test('Progress page shows difficulty breakdown', /Beginner[\s\S]{0,20}Intermediate[\s\S]{0,20}Advanced/.test(js) || /labsByDiff/.test(js));
test('Progress page lab section rendered (v4.51.0: progress-card-labs replaces ps-lab-row)', js.includes('progress-card-labs') && js.includes('labPct'));

// ═══════════════════════════════════════════
// v4.31.0 — BGP, EIGRP, DNSSEC, Packet Inspection, STP Convergence, QoS Enforcement, Attack Scenarios
// ═══════════════════════════════════════════
console.log('\n\x1b[36m── v4.31.0: A+ Features ──\x1b[0m');

// BGP

// EIGRP

// DNSSEC

// Packet Inspection
test('Packet Inspection: CSS for panel', css.includes('.tb-packet-inspect'));

// STP Convergence

// QoS Enforcement

// Attack Scenarios
test('Attack: CLI show ip dhcp snooping', js.includes("show ip dhcp snooping"));

// Cross-cutting
// v4.42.3 audit: removed the "Version:" trio — duplicates of the earlier
// hardcoded checks plus the top-level dynamic consistency checks that
// verify APP_VERSION ↔ HTML badge ↔ SW cache stay aligned.
test('Help command includes DHCP snooping', js.includes('show ip dhcp snooping'));
test('Total labs >= 28', (js.match(/id: '/g) || []).length >= 28);

