#!/usr/bin/env node
// Wave 10: extract SR Queue to features/sr-review.js (#138)
// Run: node scripts/extract-sr-review.js
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP  = path.join(ROOT, 'app.js');
const OUT  = path.join(ROOT, 'features', 'sr-review.js');

const appLines = fs.readFileSync(APP, 'utf8').split('\n');
const total = appLines.length;
console.log(`app.js: ${total} lines`);

// Region to extract (1-indexed inclusive).
// L3256: // ══ header through L4336: closing } of startSrTopUp/last SR function
const REGIONS = [
  [3256, 4336],
];

const inRegion = new Set();
for (const [s, e] of REGIONS) {
  for (let i = s; i <= e; i++) inRegion.add(i);
}

const extracted = [];
for (const [s, e] of REGIONS) {
  for (let i = s; i <= e; i++) extracted.push(appLines[i - 1]);
}

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

// ── Build features/sr-review.js ──────────────────────────────────────────────

// 2-space indent each extracted line (UAT concat strips exactly 2 leading spaces)
const indented = extracted.map(l => (l === '' ? '' : '  ' + l));

const HEADER = `(function () {
  'use strict';
  if (!window._certanvilFeatures) window._certanvilFeatures = {};
`;

const WINDOW_EXPOSE = `
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
`;

const FOOTER = `})();
`;

const srContent = HEADER + '\n' + indented.join('\n') + '\n' + WINDOW_EXPOSE + FOOTER;

fs.writeFileSync(OUT, srContent, 'utf8');
const srLines = srContent.split('\n').length;
console.log(`features/sr-review.js: ${srLines} lines written`);

fs.writeFileSync(APP, remaining.join('\n'), 'utf8');
const newAppLines = remaining.join('\n').split('\n').length;
console.log(`app.js: ${newAppLines} lines after extraction`);
console.log('Done.');
