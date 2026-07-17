#!/usr/bin/env node
/**
 * scripts/test-impact.js — impact-scoped test selection.
 *
 * Looks at what actually changed in the working tree (or branch) and runs
 * only the test suites that could plausibly be affected, instead of the
 * full Playwright matrix on every save. UAT is dirt cheap (~1.4s for 4714
 * checks) so it ALWAYS runs in full, every time, no matter what changed —
 * this script only ever narrows the Playwright side, and only when it is
 * confident about the mapping.
 *
 * ── How "changed files" is determined ────────────────────────────────────
 *   1. Uncommitted changes (staged + unstaged) vs HEAD: `git diff --name-only HEAD`
 *      plus untracked files from `git status --porcelain`.
 *   2. If that's empty, fall back to the branch diff against the merge base
 *      with origin/main: `git diff --name-only origin/main...HEAD`.
 *      Override the comparison ref with `--base <ref>`.
 *   3. If STILL empty, or the diff is "huge" (> HUGE_DIFF_THRESHOLD files),
 *      that's treated as "can't confidently scope it" -> full suite.
 *
 * ── How changed files map to test suites ─────────────────────────────────
 * See FILE_RULES below for the authoritative, commented mapping table. In
 * short:
 *   - docs/mockups/design/dogfood/graphify-out only  -> UAT only (no e2e)
 *   - tests/** (excluding tests/e2e/**) or scripts/** only
 *       -> UAT only (no e2e). Rationale documented next to TESTS_SCRIPTS_ONLY
 *          below — these files aren't part of the shipped app surface that
 *          Playwright drives, so there is nothing new for a browser test to
 *          exercise; UAT (which the changed test/script files usually assert
 *          against each other, e.g. tests/tech-debt.js, tests/uat/**) is the
 *          suite that actually covers them.
 *   - landing/**                                    -> landing.spec.js (project=landing)
 *   - features/sim-lab*.js                          -> sim-lab.spec.js (chromium)
 *   - features/decision-lab-seed-*.js                -> decision-lab.spec.js (chromium)
 *   - features/reports.js                            -> app.spec.js (chromium)
 *   - app.js/index.html/styles.css/dg-system.css/sw.js/
 *     certs/*.js/manifest.json/lib/** (non-landing)   -> app.spec.js + sim-lab.spec.js +
 *                                                        decision-lab.spec.js (chromium) —
 *                                                        these are core shared chrome/state
 *                                                        every page (incl. the labs) loads.
 *   - anything else unrecognized, or a mix that can't
 *     be safely narrowed                              -> FULL suite (safety fallback)
 *
 * ── Usage ─────────────────────────────────────────────────────────────────
 *   npm run test:impact                  # scope from working-tree changes
 *   node scripts/test-impact.js --base develop
 *   node scripts/test-impact.js --only sim-lab,pbq   # fast UAT preview filter
 *                                                     # (full UAT still always runs after)
 *
 * Exit code is non-zero if any selected run fails.
 */

'use strict';

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const HUGE_DIFF_THRESHOLD = 40; // more files than this and we stop trying to be clever

function sh(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    // git diff against a ref that doesn't exist locally, etc. -- treat as "no info"
    return '';
  }
}

function parseArgs(argv) {
  const args = { base: 'origin/main', only: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base' && argv[i + 1]) { args.base = argv[++i]; continue; }
    if (argv[i] === '--only' && argv[i + 1]) { args.only = argv[++i]; continue; }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

// ── 1. Determine changed files ─────────────────────────────────────────────
function getUncommittedFiles() {
  const diffOut = sh('git diff --name-only HEAD');
  const tracked = diffOut.split('\n').map(s => s.trim()).filter(Boolean);
  const statusOut = sh('git status --porcelain --untracked-files=all');
  const untracked = statusOut.split('\n')
    .filter(l => l.startsWith('??'))
    .map(l => l.slice(3).trim())
    .filter(Boolean);
  return Array.from(new Set([...tracked, ...untracked]));
}

function getBranchDiffFiles(base) {
  const out = sh(`git diff --name-only ${base}...HEAD`);
  return out.split('\n').map(s => s.trim()).filter(Boolean);
}

let changedFiles = getUncommittedFiles();
let source = 'uncommitted changes (staged + unstaged + untracked) vs HEAD';

if (changedFiles.length === 0) {
  changedFiles = getBranchDiffFiles(args.base);
  source = `branch diff vs ${args.base} (merge-base...HEAD)`;
}

const isEmpty = changedFiles.length === 0;
const isHuge = changedFiles.length > HUGE_DIFF_THRESHOLD;

// ── 2. Classification rules ─────────────────────────────────────────────
// Order matters: first matching rule wins for a given file.
const DOCS_ONLY_RE = /^(docs\/|mockups\/|design\/|dogfood\/|graphify-out\/|CHANGELOG\.md$|CLAUDE\.md$|.*\.md$)/;
// tests/** (excluding tests/e2e/**) and scripts/** -- see header comment for rationale.
const TESTS_SCRIPTS_ONLY_RE = /^(scripts\/|tests\/(?!e2e\/))/;
const E2E_SPEC_RE = /^tests\/e2e\//;
const LANDING_RE = /^landing\//;
const SIMLAB_RE = /^features\/sim-lab(-seed-[\w-]+)?\.js$/;
const DECISIONLAB_RE = /^features\/decision-lab-seed-[\w-]+\.js$/;
const REPORTS_RE = /^features\/reports\.js$/;
const CORE_APP_RE = /^(app\.js|index\.html|styles\.css|dg-system\.css|sw\.js|manifest\.json|vercel\.json)$/;
const CERT_PACK_RE = /^certs\/[\w-]+\.js$/;
const LIB_RE = /^lib\//; // root lib/ (non-landing) — cert-lock, onboarding, router, supabase client, web-vitals

const buckets = {
  docsOnly: [],
  testsScriptsOnly: [],
  e2eSpec: [],
  landing: [],
  simLab: [],
  decisionLab: [],
  reports: [],
  coreApp: [],
  unknown: [],
};

for (const f of changedFiles) {
  if (DOCS_ONLY_RE.test(f)) buckets.docsOnly.push(f);
  else if (E2E_SPEC_RE.test(f)) buckets.e2eSpec.push(f);
  else if (TESTS_SCRIPTS_ONLY_RE.test(f)) buckets.testsScriptsOnly.push(f);
  else if (LANDING_RE.test(f)) buckets.landing.push(f);
  else if (SIMLAB_RE.test(f)) buckets.simLab.push(f);
  else if (DECISIONLAB_RE.test(f)) buckets.decisionLab.push(f);
  else if (REPORTS_RE.test(f)) buckets.reports.push(f);
  else if (CORE_APP_RE.test(f) || CERT_PACK_RE.test(f) || LIB_RE.test(f) || /^features\//.test(f)) buckets.coreApp.push(f);
  else buckets.unknown.push(f);
}

// ── 3. Optional graphify refinement (best-effort, degrades gracefully) ────
let graphifyNote = null;
const graphJsonPath = path.join(ROOT, 'graphify-out', 'graph.json');
const changeImpactPath = path.join(ROOT, 'graphify-out', 'CHANGE_IMPACT.md');
if (fs.existsSync(graphJsonPath)) {
  if (fs.existsSync(changeImpactPath)) {
    graphifyNote = 'graphify-out/CHANGE_IMPACT.md is available — consult it (or `node scripts/graphq.js impact <fn>`) for a finer-grained blast radius than this file-path-based heuristic.';
  } else {
    graphifyNote = 'graphify-out/graph.json present but CHANGE_IMPACT.md missing — run `graphify .` to refresh.';
  }
} else {
  graphifyNote = 'graphify-out/ not present — skipping graph-based refinement (file-path heuristic only).';
}

// ── 4. Decide what to run ──────────────────────────────────────────────────
const plan = {
  runUatFull: true, // ALWAYS true — UAT is cheap, never skip it.
  uatOnlyPreview: null, // optional --only filter for a fast preview pass before the full run
  playwright: [], // list of { label, cmd: [...] }
  reason: [],
};

function addPlaywright(label, specFile, project) {
  if (plan.playwright.some(p => p.label === label)) return;
  plan.playwright.push({
    label,
    cmd: ['npx', 'playwright', 'test', `tests/e2e/${specFile}`, `--project=${project}`],
  });
}

function runFullSuite(why) {
  plan.reason.push(why);
  addPlaywright('app (chromium, full)', 'app.spec.js', 'chromium');
  addPlaywright('sim-lab (chromium, full)', 'sim-lab.spec.js', 'chromium');
  addPlaywright('decision-lab (chromium, full)', 'decision-lab.spec.js', 'chromium');
  addPlaywright('landing (landing project, full)', 'landing.spec.js', 'landing');
}

if (isEmpty) {
  runFullSuite('No changed files detected via either comparison — nothing to scope against, falling back to the full suite as a safe default.');
} else if (isHuge) {
  runFullSuite(`${changedFiles.length} files changed (> ${HUGE_DIFF_THRESHOLD}) — too large to confidently scope, falling back to the full suite.`);
} else if (buckets.unknown.length > 0) {
  runFullSuite(`${buckets.unknown.length} changed file(s) don't match any known mapping (${buckets.unknown.slice(0, 5).join(', ')}${buckets.unknown.length > 5 ? ', …' : ''}) — falling back to the full suite.`);
} else if (buckets.e2eSpec.length > 0) {
  // A Playwright spec file itself changed. We don't try to guess which of
  // its own tests are affected -- just run that spec (chromium, or landing
  // if it's landing.spec.js) plus anything else the rest of the diff maps to.
  for (const f of buckets.e2eSpec) {
    const base = path.basename(f);
    if (base === 'landing.spec.js') addPlaywright('landing (spec changed)', 'landing.spec.js', 'landing');
    else if (base === 'sim-lab.spec.js') addPlaywright('sim-lab (spec changed)', 'sim-lab.spec.js', 'chromium');
    else if (base === 'decision-lab.spec.js') addPlaywright('decision-lab (spec changed)', 'decision-lab.spec.js', 'chromium');
    else if (base === 'app.spec.js') addPlaywright('app (spec changed)', 'app.spec.js', 'chromium');
    else {
      // visual.spec.js or any future spec this script doesn't know about yet
      runFullSuite(`tests/e2e/${base} changed and isn't in the known spec list — falling back to the full suite.`);
    }
  }
  plan.reason.push(`Playwright spec file(s) changed directly: ${buckets.e2eSpec.join(', ')}.`);
  // still layer in the rest of the diff's mapping below
  if (buckets.landing.length) { addPlaywright('landing', 'landing.spec.js', 'landing'); plan.reason.push(`landing/** changed (${buckets.landing.length} file(s)) -> landing.spec.js.`); }
  if (buckets.simLab.length) { addPlaywright('sim-lab', 'sim-lab.spec.js', 'chromium'); plan.reason.push(`Sim Lab feature file(s) changed (${buckets.simLab.length}) -> sim-lab.spec.js.`); }
  if (buckets.decisionLab.length) { addPlaywright('decision-lab', 'decision-lab.spec.js', 'chromium'); plan.reason.push(`Decision Lab seed file(s) changed (${buckets.decisionLab.length}) -> decision-lab.spec.js.`); }
  if (buckets.reports.length) { addPlaywright('app', 'app.spec.js', 'chromium'); plan.reason.push('features/reports.js changed -> app.spec.js (bug-report drawer coverage).'); }
  if (buckets.coreApp.length) {
    addPlaywright('app', 'app.spec.js', 'chromium');
    addPlaywright('sim-lab', 'sim-lab.spec.js', 'chromium');
    addPlaywright('decision-lab', 'decision-lab.spec.js', 'chromium');
    plan.reason.push(`Core app/shared-chrome file(s) changed (${buckets.coreApp.length}) -> app.spec.js + sim-lab.spec.js + decision-lab.spec.js.`);
  }
} else if (
  buckets.docsOnly.length + buckets.testsScriptsOnly.length === changedFiles.length
) {
  // Everything changed is docs/mockups/design/dogfood/graphify-out and/or
  // tests+scripts (non-e2e). UAT-only, no Playwright needed.
  plan.reason.push('All changed files are docs/mockups/design/dogfood/graphify-out and/or tests/**+scripts/** (non-e2e) — UAT only, no e2e needed.');
} else {
  // Normal mapped case -- union of whatever buckets are non-empty.
  if (buckets.landing.length) { addPlaywright('landing', 'landing.spec.js', 'landing'); plan.reason.push(`landing/** changed (${buckets.landing.length} file(s)) -> landing.spec.js.`); }
  if (buckets.simLab.length) { addPlaywright('sim-lab', 'sim-lab.spec.js', 'chromium'); plan.reason.push(`Sim Lab feature file(s) changed (${buckets.simLab.length}) -> sim-lab.spec.js.`); }
  if (buckets.decisionLab.length) { addPlaywright('decision-lab', 'decision-lab.spec.js', 'chromium'); plan.reason.push(`Decision Lab seed file(s) changed (${buckets.decisionLab.length}) -> decision-lab.spec.js.`); }
  if (buckets.reports.length) { addPlaywright('app', 'app.spec.js', 'chromium'); plan.reason.push('features/reports.js changed -> app.spec.js (bug-report drawer coverage).'); }
  if (buckets.coreApp.length) {
    addPlaywright('app', 'app.spec.js', 'chromium');
    addPlaywright('sim-lab', 'sim-lab.spec.js', 'chromium');
    addPlaywright('decision-lab', 'decision-lab.spec.js', 'chromium');
    plan.reason.push(`Core app/shared-chrome file(s) changed (${buckets.coreApp.length}: e.g. ${buckets.coreApp.slice(0, 3).join(', ')}) -> app.spec.js + sim-lab.spec.js + decision-lab.spec.js.`);
  }
  if (buckets.docsOnly.length) plan.reason.push(`(${buckets.docsOnly.length} docs/mockups/design file(s) also changed — covered by UAT only, no e2e impact.)`);
  if (buckets.testsScriptsOnly.length) plan.reason.push(`(${buckets.testsScriptsOnly.length} tests/**+scripts/** file(s) also changed — covered by UAT only, no e2e impact.)`);
  if (plan.playwright.length === 0) {
    // Shouldn't normally happen (unknown bucket would have caught it), but
    // guard anyway: nothing mapped to e2e -> UAT-only is correct.
    plan.reason.push('No changed file maps to a Playwright spec — UAT only.');
  }
}

// Optional fast UAT preview narrowing, driven by which spec buckets are in play.
if (args.only) {
  plan.uatOnlyPreview = args.only;
} else if (!isEmpty && !isHuge && buckets.unknown.length === 0) {
  const previewTerms = [];
  if (buckets.simLab.length || buckets.coreApp.some(f => /sim-lab|pbq/i.test(f))) previewTerms.push('simlab', 'pbq');
  if (buckets.decisionLab.length) previewTerms.push('decision');
  if (buckets.landing.length) previewTerms.push('landing', 'webvitals');
  if (previewTerms.length) plan.uatOnlyPreview = previewTerms.join(',');
}

// ── 5. Print the plan ───────────────────────────────────────────────────
console.log('\n\x1b[1m\x1b[36m── test-impact: scope ──\x1b[0m');
console.log(`  Source of changed-file list: ${source}`);
console.log(`  Changed files (${changedFiles.length}): ${isEmpty ? '(none)' : changedFiles.slice(0, 15).join(', ') + (changedFiles.length > 15 ? `, … (+${changedFiles.length - 15} more)` : '')}`);
console.log(`  ${graphifyNote}`);
console.log('\n\x1b[1m\x1b[36m── test-impact: plan ──\x1b[0m');
plan.reason.forEach(r => console.log('  - ' + r));
console.log(`  UAT: ALWAYS runs in full (${plan.uatOnlyPreview ? `plus a fast --only ${plan.uatOnlyPreview} preview first` : 'no preview needed'}).`);
if (plan.playwright.length) {
  console.log('  Playwright runs:');
  plan.playwright.forEach(p => console.log(`    - ${p.label}: ${p.cmd.join(' ')}`));
} else {
  console.log('  Playwright runs: none.');
}
console.log('');

// ── 6. Execute ──────────────────────────────────────────────────────────
let failed = false;

function runStep(label, cmd, cmdArgs) {
  console.log(`\x1b[1m\x1b[36m▶ ${label}\x1b[0m  (${cmd} ${cmdArgs.join(' ')})`);
  const res = spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit' });
  if (res.status !== 0) {
    failed = true;
    console.log(`\x1b[31m✗ ${label} failed (exit ${res.status})\x1b[0m\n`);
  } else {
    console.log(`\x1b[32m✓ ${label} passed\x1b[0m\n`);
  }
}

if (plan.uatOnlyPreview) {
  runStep('UAT preview', 'node', ['tests/uat.js', '--only', plan.uatOnlyPreview]);
}
runStep('UAT (full)', 'node', ['tests/uat.js']);

for (const p of plan.playwright) {
  runStep(p.label, p.cmd[0], p.cmd.slice(1));
}

console.log(failed ? '\x1b[31m\x1b[1mtest-impact: FAILED\x1b[0m' : '\x1b[32m\x1b[1mtest-impact: all selected runs passed\x1b[0m');
process.exit(failed ? 1 : 0);
