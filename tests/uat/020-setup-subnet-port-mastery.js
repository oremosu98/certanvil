// tests/uat/020-setup-subnet-port-mastery.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: v4.32 setup page restructure, label clarity, homepage density, v4.33 analytics/progress redesign, v4.34 topology builder UI, subnet + port mastery revamps

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── v4.32 Setup Page Restructure ──
console.log('\n\x1b[1m── v4.32 LAYOUT RESTRUCTURE ──\x1b[0m');
test('HTML: today-section wrapper exists', html.includes('id="today-section"'));
test('HTML: today-section contains daily-goal-card', html.includes('today-section') && html.indexOf('id="daily-goal-card"') > html.indexOf('id="today-section"'));
test('HTML: today-section contains streak-defender', html.indexOf('id="streak-defender"') > html.indexOf('id="today-section"'));
// bento: the v7.16-era codex-home `.col-side` rail was replaced by the bento board;
// #daily-challenge-card survives as a hidden legacy stub, still filled by
// renderDailyChallengeCard. Assert the stub exists (action preserved, layout gone).
test('bento: #daily-challenge-card preserved as hidden legacy stub (was .col-side rail)',
  html.includes('id="daily-challenge-card"')
    && /id="daily-challenge-card"[^>]*\bis-hidden\b/.test(html)
    && /function renderDailyChallengeCard\s*\(/.test(js));
// v4.81.23 tombstones: legacy chip rows + session banner removed; #today-plan
// is now the single canonical card inside #today-section.
test('v4.81.23 tombstone: #todays-focus removed from today-section', !html.includes('id="todays-focus"'));
test('v4.81.23 tombstone: #session-banner removed from today-section', !html.includes('id="session-banner"'));
// bento: the v7.16-era codex-home `.col-main` placement was replaced by the bento
// board; #today-plan survives as a hidden legacy stub, still filled by renderTodayPlan.
test('bento: #today-plan preserved as hidden legacy stub (was .col-main, + renderTodayPlan defined)',
  html.includes('id="today-plan"')
    && /id="today-plan"[^>]*\bis-hidden\b/.test(html)
    && /function renderTodayPlan\s*\(/.test(js));
// v4.41.0: #weak-banner removed from Today section (redundant with #todays-focus chip row)
test('HTML: weak-banner REMOVED (v4.41.0 density pass)', !html.includes('id="weak-banner"'));
test('HTML: persistent sidebar exists (v4.53.0 replaces old setup-nav row)',
  html.includes('id="app-sidebar"') && html.includes('class="app-sidebar"'));
test('HTML: regression \u2014 old .setup-nav toolbar removed', !html.includes('class="setup-nav"'));
test('HTML: sidebar has \u22655 Practice+Drills items (JS-rendered via APP_SIDEBAR_PRACTICE + APP_SIDEBAR_DRILLS)',
  js.includes('APP_SIDEBAR_PRACTICE') && js.includes('APP_SIDEBAR_DRILLS'));
test('HTML: sidebar has Progress entry', /APP_SIDEBAR_PRACTICE[\s\S]{0,800}label:\s*'Progress'/.test(js));
// v4.53.0: sidebar exposes individual drill entries (Port Drill / Acronym Blitz / OSI / Cable ID) instead of a launcher.
test('HTML: sidebar has Analytics entry', /APP_SIDEBAR_PRACTICE[\s\S]{0,800}label:\s*'Analytics'/.test(js));
// v4.76.0 tombstone: presets-section + Quick Start \u00a701 + Marathon \u00a702 retired
// in favor of the unified Mode Ladder (Quick / Practice / Exam tiers). The
// Mode Ladder takes the \u00a701 number now. Marathon presets live in the Practice
// tier as `.modes-card-marathon` instances. Keeping these tombstones so the
// markup doesn't accidentally come back.
test('v4.76.0 tombstone: legacy .presets-section class removed',
  !html.includes('class="presets-section"') && !html.includes('class="presets-section ed-section"'));
test('v4.76.0 tombstone: legacy "Quick start" \u00a701 heading replaced',
  !/Quick\s*<em>start<\/em>/.test(html));
test('v4.76.0 tombstone: legacy "Marathon mode" \u00a702 heading replaced',
  !/Marathon\s*<em>mode<\/em>/.test(html));
// bento: the v7.16-era "\u00a7 01 \u00b7 Pick your session" editorial head was replaced by the
// bento command bar; the "Pick your session" picker survives as the #modes-ladder
// legacy stub (aria-label preserved).
test('bento: session picker preserved as #modes-ladder "Pick your session" stub (was \u00a7 01 numbered head)',
  /id="modes-ladder"[^>]*aria-label="Pick your session"/.test(html)
    && /<header class="cmd-bar/.test(html));
test('HTML: wrong-preset-tile exists', html.includes('id="wrong-preset-tile"'));
test('HTML: custom-quiz-section details exists', html.includes('id="custom-quiz-section"'));
test('HTML: topic-group inside custom-quiz-section', html.indexOf('id="topic-group"') > html.indexOf('id="custom-quiz-section"'));
test('HTML: diff-group inside custom-quiz-section', html.indexOf('id="diff-group"') > html.indexOf('id="custom-quiz-section"'));
test('HTML: count-group inside custom-quiz-section', html.indexOf('id="count-group"') > html.indexOf('id="custom-quiz-section"'));
// v4.79.0: legacy .exam-section retired (was duplicating Mode Ladder Exam tier per Codex round-3).
test('v4.79.0 tombstone: legacy .exam-section removed from home',
  !html.includes('class="exam-section"'));
test('HTML: setup-err inside custom-quiz-section', html.indexOf('id="setup-err"') > html.indexOf('id="custom-quiz-section"'));
test('CSS: .today-section styles', css.includes('.today-section'));
test('CSS: .setup-nav styles', css.includes('.setup-nav'));
test('CSS: .setup-nav-btn styles', css.includes('.setup-nav-btn'));
test('CSS: .presets-section styles', css.includes('.presets-section'));
test('CSS: .presets-heading styles', css.includes('.presets-heading'));
test('CSS: .custom-quiz-section styles', css.includes('.custom-quiz-section'));
test('CSS: .preset-wrong styles', css.includes('.preset-wrong'));
test('CSS: .exam-section styles', css.includes('.exam-section'));
test('JS: renderTodaySection function exists', js.includes('function renderTodaySection'));
test('JS: showSetupError function exists', js.includes('function showSetupError'));
test('JS: goSetup calls renderTodaySection', js.includes('renderTodaySection()'));
test('JS: renderWrongBankBtn updates wrong-preset-tile', js.includes('wrong-preset-tile'));
test('JS: drillTopic opens custom-quiz-section', js.includes('custom-quiz-section'));

// ── v4.40.0 Label clarity pass ──
console.log('\n\x1b[1m── LABEL CLARITY PASS (v4.40.0) ──\x1b[0m');
test('Label: preset "15-min Weak Spots" (was Focused)', html.includes('15-min Weak Spots'));
test('Label: no legacy "15-min Focused" preset text', !html.includes('15-min Focused'));
test('Label: preset "20-min Deep Scan" (v4.50.1: time corrected from 30-min to honest 20-min estimate)', html.includes('20-min Deep Scan'));
test('Label: no legacy "30-min Grind" preset text', !html.includes('30-min Grind'));
test('Label: exam toggle "Strict Mode" (was Hardcore)', html.includes('Strict Mode'));
test('Label: no legacy "Hardcore Mode" UI text', !html.includes('Hardcore Mode <span class="hardcore-sub"'));
// v7.18.0: Settings page header is now the bento mono kicker (matches Analytics/Progress).
test('Label: Settings page bento kicker heading (v7.18.0: Network+ N10-009 · Settings)',
  /id="page-settings"[\s\S]{0,800}ana-pagehead-title[^>]*><span class="ana-ph-cert">Network\+ N10-009<\/span>\s*<span class="ana-ph-dot"[^>]*>&middot;<\/span>\s*Settings/.test(html));
test('codex-home: legacy #marathon-section stub + Marathon presets in session picker', html.includes('id="marathon-section"') && html.includes("applyPreset('bulk30')") && html.includes("applyPreset('bulk45')"));
// Internal code identifiers must NOT have been renamed
test('Code: examHardcore state var preserved', js.includes('let examHardcore'));
test('Code: setHardcoreMode function preserved', js.includes('function setHardcoreMode('));
test('Code: HARDCORE_EXAM storage key preserved', js.includes('HARDCORE_EXAM'));
test('Code: hardcore_pass milestone preserved', js.includes('hardcore_pass'));

// ── v4.41.0 Homepage Density Tier 1 ──
console.log('\n\x1b[1m── HOMEPAGE DENSITY TIER 1 (v4.41.0) ──\x1b[0m');
// Weak banner removal (redundant with Weak Spots chip row)
test('Tier1: #weak-banner HTML block removed', !html.includes('id="weak-banner"'));
test('Tier1: renderWeakBanner function removed from app.js', !js.match(/function\s+renderWeakBanner\s*\(/));
// Strip comments before checking for active callers so the v4.41.0 removal note doesn't trigger false positives
(() => {
  const jsNoComments = js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  test('Tier1: no live callers of renderWeakBanner() remain', !/\brenderWeakBanner\s*\(\s*\)/.test(jsNoComments));
  // renderTodaySection should not query #weak-banner in its active body
  const rts = jsNoComments.match(/function renderTodaySection\s*\([\s\S]*?\n\}/);
  test('Tier1: renderTodaySection no longer queries #weak-banner', !!rts && !rts[0].includes('#weak-banner'));
})();
// Legacy wrong-bank row removal (replaced by preset tile + Settings clear)
test('Tier1: legacy #wrong-bank-row HTML block removed', !html.includes('id="wrong-bank-row"'));
test('Tier1: legacy #wrong-bank-btn HTML block removed', !html.includes('id="wrong-bank-btn"'));
test('Tier1: Clear Wrong Answers Bank button moved to Settings', html.includes('Clear Wrong Answers Bank') && html.includes('id="wrong-bank-clear"'));
test('Tier1: wrong-bank-clear button still wired to clearWrongBank()', html.indexOf('id="wrong-bank-clear"') !== -1 && html.includes('onclick="clearWrongBank()"'));
test('Tier1: clearWrongBank() function still exists', js.includes('function clearWrongBank('));
test('Tier1: startWrongDrill() function still exists', js.includes('function startWrongDrill('));
(() => {
  // Extract the renderWrongBankBtn function body (comments retained is fine — we're searching for live refs)
  const rwb = js.match(/function renderWrongBankBtn\s*\([\s\S]*?\n\}/);
  test('Tier1: renderWrongBankBtn function still exists', !!rwb);
  // Strip comments before checking for legacy row refs
  const body = (rwb ? rwb[0] : '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  test('Tier1: renderWrongBankBtn no longer references wrong-bank-row', !body.includes('wrong-bank-row'));
  test('Tier1: renderWrongBankBtn no longer references wrong-bank-btn', !body.includes("getElementById('wrong-bank-btn')"));
  test('Tier1: renderWrongBankBtn still updates wrong-preset-tile', body.includes('wrong-preset-tile'));
})();
test('Tier1: renderWrongBankBtn updates Settings clear-count badge', js.includes('wrong-bank-clear-count'));
// Drills consolidation (4 buttons → 1 launcher + new #page-drills)
test('Tier1: drills-grid CSS class', css.includes('.drills-grid'));
test('Tier1: drills-tile CSS class', css.includes('.drills-tile'));
// Setup nav no longer carries 4 separate drill buttons
test('Tier1: no standalone Port Drill button in setup nav', !html.includes('setup-nav-label">Port Drill'));
test('Tier1: no standalone Acronyms button in setup nav', !html.includes('setup-nav-label">Acronyms'));
test('Tier1: no standalone OSI Sorter button in setup nav', !html.includes('setup-nav-label">OSI Sorter'));
test('Tier1: no standalone Cables button in setup nav', !html.includes('setup-nav-label">Cables'));
test('Tier1: no second Interactive drills nav row', !html.includes('aria-label="Interactive drills"'));
// Drill entry points preserved — functions still exist, just reached via the drills page
// Marathon Mode progressive disclosure (hidden until first quiz)
test('Tier1: #marathon-section wrapper exists', html.includes('id="marathon-section"'));
test('Tier1: #marathon-section starts hidden (is-hidden class)', /id="marathon-section"[^>]*class="[^"]*is-hidden/.test(html));
test('Tier1: renderMarathonSection() function exists', js.includes('function renderMarathonSection('));
test('Tier1: renderMarathonSection checks loadHistory().length', js.match(/renderMarathonSection[\s\S]{0,300}loadHistory\(\)\.length/));
test('Tier1: renderMarathonSection called in goSetup',
  // v4.99.39: window 1500 → 2500. goSetup has accumulated 3 teardown hooks
  // (_portDrillTeardown, _irwTeardown) pushing renderMarathonSection further
  // down the function body.
  // v7.50.0: window 2500 → 2900 after the gauntlet + why-not mode-reset blocks.
  js.match(/function goSetup\(\)[\s\S]{0,2900}renderMarathonSection\(\)/));
test('Tier1: renderMarathonSection called on DOMContentLoaded', js.match(/DOMContentLoaded[\s\S]{0,3000}renderMarathonSection\(\)/));
// Marathon preset buttons still present inside the wrapper
test('Tier1: Marathon 30-question preset still wired', html.includes("applyPreset('bulk30')"));
test('Tier1: Marathon 45-question preset still wired', html.includes("applyPreset('bulk45')"));
test('Tier1: Marathon 60-question preset still wired', html.includes("applyPreset('bulk60')"));

// ── v4.33 Analytics + Progress Redesign ──
console.log('\n\x1b[1m── v4.33 ANALYTICS + PROGRESS ──\x1b[0m');
// Analytics nav
test('Analytics: nav bar rendered', js.includes('ana-nav'));
test('Analytics: nav pills exist', js.includes('ana-nav-pill'));
test('Analytics: nav has Readiness link', js.includes("ana-s-readiness"));
test('Analytics: nav has Trend link', js.includes("ana-s-trend"));
// v4.42.2: Topics pill deleted with Topic Mastery. Now just a regression
// guard that the target section id is gone too.
test('Analytics: nav Topics link removed (v4.42.2)', !js.includes("ana-s-topics"));
test('Analytics: nav has Activity link', js.includes("ana-s-activity"));
// v4.45.2: Drills nav pill removed with the card. Regression guard.
test('Analytics: nav has NO Drills link (v4.45.2 regression guard)', !js.includes("ana-s-drills"));
test('Analytics: nav has Milestones link', js.includes("ana-s-milestones"));
// Analytics removals + merges
test('Analytics: Weekly Volume removed', !js.includes('WEEKLY VOLUME'));
test('Analytics: All-Time Stats card removed', !js.includes("ALL-TIME STATS"));
test('Analytics: Priority Study Areas card removed', !js.includes('PRIORITY STUDY AREAS'));
test('Analytics: hero-stats merged into hero', js.includes('ana-hero-stats'));
test('Analytics: hero has Sessions stat', js.includes('ana-hero-stat-val') && js.includes('Sessions'));
test('Analytics: hero has Questions stat', js.includes('Questions'));
test('Analytics: hero has Accuracy stat', js.includes('Accuracy'));
test('Analytics: hero has Study Days stat', js.includes('Study Days'));
// v4.42.2: Topic Mastery card deleted — topic-level accuracy now lives
// exclusively on Progress. Analytics gets a CTA to Progress instead.
test('Analytics: Topic Mastery card removed (no _renderAnaTopics call)',
  !js.includes('_renderAnaTopics(h)'));
test('Analytics: _renderAnaTopicsCta helper defined',
  js.includes('function _renderAnaTopicsCta('));
test('Analytics: CTA links to Progress page',
  js.includes("showPage('progress');renderProgressPage()") || js.includes('showPage("progress");renderProgressPage()'));
test('Analytics: ana-topics-cta-btn rendered',
  js.includes('ana-topics-cta-btn'));
test('Analytics: Topics pill removed from ana-nav',
  !js.includes("scrollIntoView({behavior:'smooth',block:'start'})\">Topics<"));
test('Analytics: no lingering ana-topic-alert in renderAnalytics body',
  !js.includes('ana-topic-alert'));
// Analytics 2-col grid
test('Analytics: bento grid wrapper', js.includes('ana-bento'));
// CSS
test('CSS: .ana-nav styles', css.includes('.ana-nav'));
test('CSS: .ana-nav-pill styles', css.includes('.ana-nav-pill'));
test('CSS: .ana-grid-2col styles', css.includes('.ana-grid-2col'));
test('CSS: .ana-hero-stats styles', css.includes('.ana-hero-stats'));
// v4.42.2: .ana-topic-alert no longer rendered (Topic Mastery deleted).
// New CSS covers the Progress-CTA button + the new trend arrow.
test('CSS: .ana-topics-cta-btn styles (v4.42.2 CTA)', css.includes('.ana-topics-cta-btn'));
test('CSS: .topic-trend styles (v4.42.2 Progress row trend)', css.includes('.topic-trend'));
// Progress page improvements (v7.2.0 MIGRATED: spec Q3-A removed the 26x26
// inner .topic-play-btn — the whole .t-row IS the click target. Asserts the
// v2 contract: whole-row button + data-topic for delegated drillTopic.)
test('Progress: row IS the click target (v7.2.0: whole-row <button> per spec Q3-A)',
  /_progressRowHtml[\s\S]{0,4500}<button[^>]*class="t-row[^>]*data-topic/.test(js));
test('Progress: play calls focusTopic', js.includes("focusTopic('"));
test('Progress: domain header mini-bar', js.includes('pd-bar'));
test('Progress: domain header bar fill', js.includes('pd-bar-fill'));
test('CSS: .topic-play-btn styles', css.includes('.topic-play-btn'));
test('CSS: .pd-bar styles', css.includes('.pd-bar'));
test('CSS: .ps2-grid-mastery layout (v4.51.0: renamed from .ps-row)', css.includes('.ps2-grid-mastery'));
test('CSS: .progress-card-labs (v4.51.0: renamed from .ps-lab-row)', css.includes('.progress-card-labs'));
test('Progress: summary uses .ps2-grid (v4.51.0: renamed from ps-row)', js.includes('ps2-grid'));

// ── v4.34 Topology Builder UI (v4.43.1 REFRESH — v4.34 assertions updated to v4.43.1 shapes) ──
console.log('\n\x1b[1m── v4.34/v4.43.1 TOPOLOGY BUILDER UI ──\x1b[0m');
// v4.43.1: intro banner replaced with compact .tb-hero (collapsible <details> removed —
// the hero is always visible but small enough that it doesn't need to collapse).
test('CSS: legacy .tb-hero rules retained but force-hidden (regression tombstone)', css.includes('.tb-hero'));
test('CSS: legacy .tb-hero-pill styles retained (regression tombstone)', css.includes('.tb-hero-pill'));
// 2. Collapsible how-to strip (still collapsible — kept)
test('CSS: .tb-howto-details styles', css.includes('.tb-howto-details'));
// 3. Unified toolbar (v4.43.1 grouped variant — all buttons inside tb-toolbar-v2)
// 4. Toolbar groups (v4.43.1 replaces flat dividers with labeled groups)
test('CSS: .tb-tool-group styles', css.includes('.tb-tool-group'));
// 5. Config tab dividers
// 6. Palette grouped by category
test('CSS: .tb-palette-group-head styles', css.includes('.tb-palette-group-head'));

// ══════════════════════════════════════════
// v4.38.0 — Subnet Mastery Revamp
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.35 SUBNET MASTERY ──\x1b[0m');

// Storage keys
test('STORAGE.SUBNET_MASTERY key', js.includes("SUBNET_MASTERY: 'nplus_subnet_mastery'"));
test('STORAGE.SUBNET_LESSONS key', js.includes("SUBNET_LESSONS: 'nplus_subnet_lessons'"));

// HTML structure

// JS functions

// JS data structures

// Utility functions

// CSS classes
test('CSS: .st-binary-grid styles', css.includes('.st-binary-grid'));

// ══════════════════════════════════════════
// v4.38.0 — Port Mastery Revamp
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.36 PORT MASTERY ──\x1b[0m');

// Storage keys
test('STORAGE.PORT_MASTERY key', js.includes("PORT_MASTERY: 'nplus_port_mastery'"));
test('STORAGE.PORT_LESSONS key', js.includes("PORT_LESSONS: 'nplus_port_lessons'"));

// HTML structure

// JS functions

// JS data structures

// CSS classes

// v4.38.0 — Ambient Packets + Fix This Network
console.log('\n\x1b[1m── AMBIENT PACKETS (v4.38.0) ──\x1b[0m');
test('showPage stops ambient on nav', js.includes('tbStopAmbient'));
test('CSS: .tb-ambient-dot', css.includes('.tb-ambient-dot'));

console.log('\n\x1b[1m── FIX THIS NETWORK (v4.38.0) ──\x1b[0m');
// Fault types

// Challenges (all 15)
// TB_FIX_CHALLENGES array assertion removed in M2 — the data table was deleted with the
// Fix This Network drill long ago; only the orphaned milestone ctx block still name-dropped it.

// Engine functions
test('STORAGE.FIX_CHALLENGES key', js.includes("FIX_CHALLENGES"));

// Milestones — fix_first/fix_5/fix_all_easy removed in M2 (Fix This Network drill deleted)

// HTML wiring

// CSS
test('CSS: .tb-tool-btn-fix', css.includes('.tb-tool-btn-fix'));
test('CSS: .tb-fix-tabs', css.includes('.tb-fix-tabs'));
test('CSS: .tb-fix-tab', css.includes('.tb-fix-tab'));
test('CSS: .tb-fix-card', css.includes('.tb-fix-card'));
test('CSS: .tb-fix-panel', css.includes('.tb-fix-panel'));
test('CSS: .tb-fix-panel-head', css.includes('.tb-fix-panel-head'));
test('CSS: .tb-fix-timer', css.includes('.tb-fix-timer'));
test('CSS: .tb-fix-symptom', css.includes('.tb-fix-symptom'));
test('CSS: .tb-fix-progress-bar', css.includes('.tb-fix-progress-bar'));
test('CSS: .tb-fix-fault-row', css.includes('.tb-fix-fault-row'));
test('CSS: .tb-fix-hint-btn', css.includes('.tb-fix-hint-btn'));
test('CSS: .tb-fix-toast', css.includes('.tb-fix-toast'));
test('CSS: .tb-fix-complete-hero', css.includes('.tb-fix-complete-hero'));
test('CSS: .tb-fix-complete-grade', css.includes('.tb-fix-complete-grade'));
test('CSS: .tb-fix-start-btn', css.includes('.tb-fix-start-btn'));

// v4.38.0 — Draggable Fix Panel, Enhanced Packets, Lab Tabs
console.log('\n\x1b[1m── v4.38.0 POLISH ──\x1b[0m');

// v4.38.0 — Give Up & Reveal Answers
console.log('\n\x1b[1m── GIVE UP & REVEAL (v4.38.0) ──\x1b[0m');
test('CSS: .tb-fix-giveup-btn', css.includes('.tb-fix-giveup-btn'));
test('CSS: .tb-fix-reveal-hero', css.includes('.tb-fix-reveal-hero'));
test('CSS: .tb-fix-reveal-fault', css.includes('.tb-fix-reveal-fault'));
test('CSS: .tb-fix-reveal-diagnosis', css.includes('.tb-fix-reveal-diagnosis'));
test('CSS: .tb-fix-reveal-fix', css.includes('.tb-fix-reveal-fix'));
test('CSS: .tb-fix-reveal-tip', css.includes('.tb-fix-reveal-tip'));

// v4.38.0 — Light Mode comprehensive fix
console.log('\n\x1b[1m── LIGHT MODE FIX (v4.38.0) ──\x1b[0m');
test('Light: [data-theme="light"] vars block', css.includes('[data-theme="light"]'));
test('Light: terminal-card override', css.includes('[data-theme="light"] .terminal-card'));
test('Light: port-ref-cmd override', css.includes('[data-theme="light"] .port-ref-cmd'));
test('Light: cli-terminal override', css.includes('[data-theme="light"] .cli-terminal'));
test('Light: tb-cli-output override', css.includes('[data-theme="light"] .tb-cli-output'));
test('Light: tb-grade-card override', css.includes('[data-theme="light"] .tb-grade-card'));
test('Light: tb-grade-scenario override', css.includes('[data-theme="light"] .tb-grade-scenario'));
test('Light: tb-grade-section override', css.includes('[data-theme="light"] .tb-grade-section'));
test('Light: tb-grade-item-label override', css.includes('[data-theme="light"] .tb-grade-item-label'));
test('Light: tb-coach-tour override', css.includes('[data-theme="light"] .tb-coach-tour'));
test('Light: tb-coach-section override', css.includes('[data-theme="light"] .tb-coach-section'));
test('Light: tb-coach-list override', css.includes('[data-theme="light"] .tb-coach-list'));
test('Light: tb-tool-btn-coach override', css.includes('[data-theme="light"] .tb-tool-btn-coach'));
test('Light: tb-tool-btn-ai override', css.includes('[data-theme="light"] .tb-tool-btn-ai'));
test('Light: tb-palette-item override', css.includes('[data-theme="light"] .tb-palette-item'));
test('Light: tb-cable-chip override', css.includes('[data-theme="light"] .tb-cable-chip'));
test('Light: tb-fix-panel shadow override', css.includes('[data-theme="light"] .tb-fix-panel'));
test('Light: tb-fix-timer override', css.includes('[data-theme="light"] .tb-fix-timer'));
test('Light: tb-packet-inspect override', css.includes('[data-theme="light"] .tb-packet-inspect'));
test('Light: end-exam-btn hover override', css.includes('[data-theme="light"] .end-exam-btn:hover'));
test('Light: st-binary-grid override', css.includes('[data-theme="light"] .st-binary-grid'));
test('Light: tb-canvas-wrap override', css.includes('[data-theme="light"] .tb-canvas-wrap'));
test('Light: tb-fix-reveal-fix override', css.includes('[data-theme="light"] .tb-fix-reveal-fix'));
test('Light: tb-coach-error-title override', css.includes('[data-theme="light"] .tb-coach-error-title'));

// v4.38.0 — TB light mode polish + how-to layout
console.log('\n\x1b[1m── TB LIGHT MODE POLISH (v4.38.0) ──\x1b[0m');
test('Light: tb-toolbar override', css.includes('[data-theme="light"] .tb-toolbar'));
test('Light: tb-palette override', css.includes('[data-theme="light"] .tb-palette'));
test('Light: tb-intro-details override', css.includes('[data-theme="light"] .tb-intro-details'));
test('Light: tb-howto-details override', css.includes('[data-theme="light"] .tb-howto-details'));
test('Light: tb-howto-step override (v4.49.1: replaced .tb-howto-item)', css.includes('[data-theme="light"] .tb-howto-step'));
test('Light: tb-howto kbd override (v4.49.1: now scoped to .tb-howto-step kbd)', css.includes('[data-theme="light"] .tb-howto-step kbd'));
test('Light: tb-sim-log-content override', css.includes('[data-theme="light"] .tb-sim-log-content'));
test('Light: tb-fix-diff-easy override', css.includes('[data-theme="light"] .tb-fix-diff-easy'));
test('Light: tb-fix-tab override', css.includes('[data-theme="light"] .tb-fix-tab'));
test('Light: tb-grade-backdrop override', css.includes('[data-theme="light"] .tb-grade-backdrop'));
test('Light: tb-scenario-panel override', css.includes('[data-theme="light"] .tb-scenario-panel'));
test('How-to strip uses CSS grid', css.includes('grid-template-columns: repeat(auto-fit'));

// v4.38.0 — Comprehensive light mode audit
console.log('\n\x1b[1m── LIGHT MODE AUDIT (v4.38.0) ──\x1b[0m');

// Lab card overrides
test('Light: lab card background', css.includes('[data-theme="light"] .tb-lab-card'));
test('Light: lab card meta text', css.includes('[data-theme="light"] .tb-lab-card-meta'));
test('Light: lab card desc text', css.includes('[data-theme="light"] .tb-lab-card-desc'));
test('Light: lab badge auto', css.includes('[data-theme="light"] .tb-lab-badge-auto'));

// Lab step panel overrides
test('Light: lab panel head', css.includes('[data-theme="light"] .tb-lab-panel-head'));
test('Light: lab step title', css.includes('[data-theme="light"] .tb-lab-step-title'));
test('Light: lab step instructions', css.includes('[data-theme="light"] .tb-lab-step-instr'));
test('Light: lab step pending', css.includes('[data-theme="light"] .tb-lab-step-pending'));
test('Light: lab step feedback', css.includes('[data-theme="light"] .tb-lab-step-feedback'));
test('Light: lab hint toggle', css.includes('[data-theme="light"] .tb-lab-hint-toggle'));
test('Light: lab hint body', css.includes('[data-theme="light"] .tb-lab-hint-body'));
test('Light: lab progress', css.includes('[data-theme="light"] .tb-lab-progress'));
test('Light: lab nav', css.includes('[data-theme="light"] .tb-lab-nav'));

// Config panel overrides
test('Light: config head', css.includes('[data-theme="light"] .tb-config-head'));
test('Light: config close', css.includes('[data-theme="light"] .tb-config-close'));
test('Light: config body labels', css.includes('[data-theme="light"] .tb-config-body label'));
test('Light: config body inputs', css.includes('[data-theme="light"] .tb-config-body input'));
test('Light: iface table headers', css.includes('[data-theme="light"] .tb-iface-table th'));
test('Light: iface table inputs', css.includes('[data-theme="light"] .tb-iface-table input'));
test('Light: sg table headers', css.includes('[data-theme="light"] .tb-sg-table th'));

// Overview tab overrides
test('Light: overview hostname', css.includes('[data-theme="light"] .tb-ov-hostname'));
test('Light: overview stat labels', css.includes('[data-theme="light"] .tb-ov-stat span'));
test('Light: overview stat values', css.includes('[data-theme="light"] .tb-ov-stat strong'));
test('Light: overview section label', css.includes('[data-theme="light"] .tb-ov-section-label'));
test('Light: overview iface card', css.includes('[data-theme="light"] .tb-ov-iface-card'));
test('Light: overview iface detail', css.includes('[data-theme="light"] .tb-ov-iface-detail'));

// Other missing overrides
test('Light: route type connected', css.includes('[data-theme="light"] .tb-route-type-connected'));
test('Light: route type static', css.includes('[data-theme="light"] .tb-route-type-static'));
test('Light: vlan row', css.includes('[data-theme="light"] .tb-vlan-row'));
test('Light: cloud card', css.includes('[data-theme="light"] .tb-cloud-card'));
test('Light: tool btn primary', css.includes('[data-theme="light"] .tb-tool-btn-primary'));
test('Light: fix hint btn', css.includes('[data-theme="light"] .tb-fix-hint-btn'));
test('Light: fix giveup btn', css.includes('[data-theme="light"] .tb-fix-giveup-btn'));

// Device label theme detection in app.js
test('Device labels: theme-aware fill', js.includes("const isLight = document.documentElement.getAttribute('data-theme') === 'light'"));

// v4.38.0 — Solid range color: amber → blue
console.log('\n\x1b[1m── SOLID RANGE COLOR FIX (v4.38.0) ──\x1b[0m');
// v7.2.0 MIGRATED: Progress v2 dropped rag-blue/--blue per-row coloring in
// favor of a single accent tier system (.o = solid bronze, .s = strong pass
// green, .w = weak warn yellow). Asserts the v2 contract: pct-class system
// in _progressRowHtml. styles.css still carries .rag-blue + var(--blue) for
// other surfaces (Domain Mastery, etc.) so those guards stay green below.
test('Solid range mapped to .o tier in v2 row markup (v7.2.0 supersedes v4.38.0 rag-blue rule)',
  /_progressRowHtml[\s\S]{0,4500}tierCls\s*=\s*'o'/.test(js));
test('CSS has rag-blue class', css.includes('.rag-blue'));
test('No rag-yellow in CSS', !css.includes('.rag-yellow'));
test('No pct >= 60 with var(--yellow) in JS', !js.match(/>=\s*60.*var\(--yellow\)/));
// v7.15.0: the Solid ledger tile renders emoji-free (the v4.51.0 \u{1F535}
// blue-disc lived only in the removed dead _renderProgressSummary template;
// the live .ps2-solid / .pm-led tile is icon-free per the no-emoji design
// rule). Assert the live structure: the .ps2-solid tile carries the solid
// bucket count + label and NO emoji disc anywhere on the page surface.
test('Solid ledger tile renders emoji-free (v7.15.0: \\u{1F535} blue disc removed)', /ps2-solid[\s\S]{0,160}buckets\.solid/.test(js) && !js.includes('\\u{1F535}'));

