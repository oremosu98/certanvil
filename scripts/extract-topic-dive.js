#!/usr/bin/env node
// Wave 11: extract Topic Deep Dive + Guided Lab + fetchTopicBrief to features/topic-dive.js (#138)
// Run: node scripts/extract-topic-dive.js
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP  = path.join(ROOT, 'app.js');
const OUT  = path.join(ROOT, 'features', 'topic-dive.js');

const appLines = fs.readFileSync(APP, 'utf8').split('\n');
const total = appLines.length;
console.log(`app.js: ${total} lines`);

// Find exact boundaries dynamically so the script is line-count-independent.
// We extract everything from the "TOPIC DEEP DIVE PANEL" header block through
// the closing } of fetchTopicBrief (just before FEATURE 4 header).
let regionStart = -1;
let regionEnd   = -1;

for (let i = 1; i <= total; i++) {
  const line = appLines[i - 1];
  if (regionStart === -1 && line.includes('TOPIC DEEP DIVE PANEL')) {
    // Back up to the preceding separator line (═══...)
    regionStart = i - 1; // the ══ line before the header
  }
  if (regionStart !== -1 && line.includes('FEATURE 4: PERFORMANCE ANALYTICS DASHBOARD')) {
    // Back up past the separator line and any blank line before it
    // regionEnd should be the last non-blank line before this separator
    let j = i - 1; // ══ line before FEATURE 4
    // include the ══ line of FEATURE 3 end but stop before FEATURE 4's ══
    regionEnd = j - 1; // blank line before FEATURE 4's separator
    // trim trailing blanks from region
    while (regionEnd >= regionStart && appLines[regionEnd - 1].trim() === '') regionEnd--;
    break;
  }
}

if (regionStart === -1 || regionEnd === -1) {
  console.error('ERROR: could not find region boundaries');
  process.exit(1);
}

console.log(`Extracting lines ${regionStart}–${regionEnd}`);

const inRegion = new Set();
for (let i = regionStart; i <= regionEnd; i++) inRegion.add(i);

const extracted = [];
for (let i = regionStart; i <= regionEnd; i++) extracted.push(appLines[i - 1]);

// Build app.js remainder — collapse runs of >2 blank lines to 2
// Also insert LAZY loader stubs where the functions were removed.
// We'll insert stubs at the position where the region started.
const remaining = [];
let blankRun = 0;
let stubsInserted = false;

for (let i = 1; i <= total; i++) {
  if (inRegion.has(i)) {
    blankRun = 0;
    if (!stubsInserted) {
      // Insert loader stubs at the extraction point
      remaining.push('// #138 wave 11: loader stubs — features/topic-dive.js overwrites these on lazy load.');
      remaining.push('function showTopicDeepDive(topicName) {');
      remaining.push('  _loadFeature(\'topic-dive\').then(function(m) { m.showTopicDeepDive(topicName); });');
      remaining.push('}');
      remaining.push('function openGuidedLab(topicName) {');
      remaining.push('  _loadFeature(\'topic-dive\').then(function(m) { m.openGuidedLab(topicName); });');
      remaining.push('}');
      remaining.push('async function fetchTopicBrief(key, topicName) {');
      remaining.push('  var m = await _loadFeature(\'topic-dive\');');
      remaining.push('  return m.fetchTopicBrief(key, topicName);');
      remaining.push('}');
      stubsInserted = true;
    }
    continue;
  }
  const line = appLines[i - 1];
  if (line.trim() === '') {
    blankRun++;
    if (blankRun <= 2) remaining.push(line);
  } else {
    blankRun = 0;
    remaining.push(line);
  }
}

// ── Build features/topic-dive.js ─────────────────────────────────────────────

// 2-space indent each extracted line (UAT concat strips exactly 2 leading spaces)
const indented = extracted.map(l => (l === '' ? '' : '  ' + l));

const HEADER = `(function () {
  'use strict';
  if (!window._certanvilFeatures) window._certanvilFeatures = {};
`;

const WINDOW_EXPOSE = `
  // ── Public API (window exposure) ─────────────────────────────────────────
  window.buildTopicDivePrompt          = buildTopicDivePrompt;
  window.showTopicDeepDive             = showTopicDeepDive;
  window.renderTopicDive               = renderTopicDive;
  window.openGuidedLab                 = openGuidedLab;
  window.copyCmd                       = copyCmd;
  window.fetchTopicBrief               = fetchTopicBrief;

  window._certanvilFeatures['topic-dive'] = {
    showTopicDeepDive: showTopicDeepDive,
    openGuidedLab: openGuidedLab,
    fetchTopicBrief: fetchTopicBrief,
  };
`;

const FOOTER = `})();
`;

const tdContent = HEADER + '\n' + indented.join('\n') + '\n' + WINDOW_EXPOSE + FOOTER;

fs.writeFileSync(OUT, tdContent, 'utf8');
const tdLines = tdContent.split('\n').length;
console.log(`features/topic-dive.js: ${tdLines} lines written`);

fs.writeFileSync(APP, remaining.join('\n'), 'utf8');
const newAppLines = remaining.join('\n').split('\n').length;
console.log(`app.js: ${newAppLines} lines after extraction`);
console.log('Done.');
