#!/usr/bin/env node
// Wave 9: extract home/setup UI to features/home.js (#138)
// Run: node scripts/extract-home.js
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP  = path.join(ROOT, 'app.js');
const OUT  = path.join(ROOT, 'features', 'home.js');

const appLines = fs.readFileSync(APP, 'utf8').split('\n');
const total = appLines.length;
console.log(`app.js: ${total} lines`);

// Regions to extract (1-indexed inclusive).
// Listed in ascending order so deletions don't shift indices.
const REGIONS = [
  [6206, 6401],   // R1: FRONT PAGE FEATURES header + Daily Challenge funcs
  [6542, 6547],   // R2: getTodaysFocusTopics (+ backward-compat comment)
  [6673, 6780],   // R3: focusTopic, renderStreakDefender, startStreakSave, applyPreset
  [6782, 7087],   // R4: DOMAIN DRILL header + consts + functions
  [7089, 7295],   // R5: START BULK MIXED QUIZ header + marathon session funcs
  [10315, 10564], // R6a: EDITORIAL REDESIGN header + sidebar funcs + a11y listeners
  [10624, 11310], // R6b: v4.54.0 top-bar/hero/bento section through _syncPageHeaderCert
  [11347, 11753], // R7: renderSetupDomainGrid (+ doc comment)
  [11755, 11792], // R8: updateCqSummaryBar (+ doc comment)
];

// Mark every line that belongs to a region
const inRegion = new Set();
for (const [s, e] of REGIONS) {
  for (let i = s; i <= e; i++) inRegion.add(i);
}

// Collect extracted lines (0-indexed: line N is at index N-1)
const extracted = [];
for (const [s, e] of REGIONS) {
  for (let i = s; i <= e; i++) extracted.push(appLines[i - 1]);
  extracted.push(''); // blank separator between regions
}
// Drop the trailing extra blank
if (extracted[extracted.length - 1] === '') extracted.pop();

// Build app.js remainder — collapse runs of >2 blank lines to 2
const remaining = [];
let blankRun = 0;
for (let i = 1; i <= total; i++) {
  if (inRegion.has(i)) { blankRun = 0; continue; }
  const line = appLines[i - 1];
  if (line.trim() === '') {
    blankRun++;
    if (blankRun <= 2) remaining.push(line);
  } else {
    blankRun = 0;
    remaining.push(line);
  }
}

// ── Build features/home.js ────────────────────────────────────────────────

// 2-space indent each extracted line (UAT concat strips exactly 2 leading spaces)
const indented = extracted.map(l => (l === '' ? '' : '  ' + l));

const HEADER = `(function () {
  'use strict';
  if (!window._certanvilFeatures) window._certanvilFeatures = {};
`;

const WINDOW_EXPOSE = `
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
`;

// Self-trigger: re-runs what _v454Init + _v453Init attempted at app.js parse
// time (all with typeof guards). Runs immediately since defer scripts execute
// while readyState === 'interactive' (before DOMContentLoaded fires).
const SELF_TRIGGER = `
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
`;

const FOOTER = `})();
`;

const homeContent = HEADER + '\n' + indented.join('\n') + '\n' + WINDOW_EXPOSE + SELF_TRIGGER + FOOTER;

fs.writeFileSync(OUT, homeContent, 'utf8');
const homeLines = homeContent.split('\n').length;
console.log(`features/home.js: ${homeLines} lines written`);

// Write updated app.js
fs.writeFileSync(APP, remaining.join('\n'), 'utf8');
const newAppLines = remaining.join('\n').split('\n').length;
console.log(`app.js: ${newAppLines} lines after extraction`);
console.log('Done.');
