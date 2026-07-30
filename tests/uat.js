#!/usr/bin/env node
// tests/uat.js
// Slim entry point for the UAT suite. Loads the shared context (source
// strings + test framework + cross-domain helpers) then requires every
// numbered domain module in tests/uat/ IN ORDER, so execution order (and
// therefore test output order) is identical to the pre-split monolithic
// tests/uat.js. Domain modules mutate the shared `results` object exported
// by tests/uat/_context.js as they run.
//
// Usage:
//   node tests/uat.js                 # run everything (same as before the split)
//   node tests/uat.js --only foo,bar  # run only domain files whose filename
//                                      # contains "foo" or "bar" (comma-separated
//                                      # substrings). NOTE: shared helpers/consts
//                                      # still all live in _context.js, so a
//                                      # filtered run never crashes on a missing
//                                      # cross-domain dependency -- it just runs a
//                                      # subset of the assertions (fewer of the
//                                      # 4714 total checks, by design).

const fs = require('fs');
const path = require('path');

const ctx = require('./uat/_context');
const { results } = ctx;

const DOMAIN_DIR = path.join(__dirname, 'uat');
const allDomainFiles = fs.readdirSync(DOMAIN_DIR)
  .filter(f => /^\d+-.*\.js$/.test(f))
  .sort();

const onlyIdx = process.argv.indexOf('--only');
let domainFiles = allDomainFiles;
if (onlyIdx !== -1 && process.argv[onlyIdx + 1]) {
  const filters = process.argv[onlyIdx + 1].split(',').map(s => s.trim()).filter(Boolean);
  domainFiles = allDomainFiles.filter(f => filters.some(sub => f.includes(sub)));
  console.log(`\n\x1b[36m--only filter (${filters.join(', ')}) matched ${domainFiles.length}/${allDomainFiles.length} domain files:\x1b[0m`);
  domainFiles.forEach(f => console.log('  - ' + f));
  if (domainFiles.length === 0) {
    console.log('\x1b[33mNo domain files matched --only filter; nothing to run.\x1b[0m');
  }
}

for (const f of domainFiles) {
  require(path.join(DOMAIN_DIR, f));
}

// ── Summary ──
console.log('\n' + '═'.repeat(50));
const total = results.pass + results.fail;
if (results.fail === 0) {
  console.log(`\x1b[32m\x1b[1m  UAT: ${results.pass}/${total} ALL PASS ✓\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m  UAT: ${results.pass}/${total} — ${results.fail} FAILED\x1b[0m`);
  console.log('\n  Failed tests:');
  results.errors.forEach(e => console.log(`    - ${e}`));
}
console.log('═'.repeat(50) + '\n');

// STRICT GATE — any failure fails the build. Restored 2026-07-29 (v8.9.3).
//
// History: the v7.0.0 MVP-quiz-only transition widened this from strict to a
// 2,700-failure baseline, because the Ships 1-5 deletion sweep left ~2,647 stale
// assertions pointing at deleted drills/flagship code. Those are long gone — the
// suite now runs 5,001/5,001 — but the tolerance outlived them, and a gate that
// green-lights 2,700 failures is not a gate.
//
// It cost something real: three assertions (two in 060, one in 140) went stale
// when v7.80.0 added a 4th param to attempt() and the AI proxy moved from
// fetch() to fetchWithTimeout(). All three sat red on main for weeks while CI
// reported success, because 3 < 2700. They were only noticed by reading the
// output by eye.
//
// If a legitimate transition ever needs slack again, prefer quarantining the
// specific known-bad assertions over re-raising a global ceiling — a numeric
// tolerance hides the next regression as effectively as it hides the last one.
if (results.fail > 0) {
  console.log(`\x1b[31m\x1b[1m  REGRESSION: ${results.fail} failing assertion(s) — the UAT gate is strict.\x1b[0m`);
  process.exit(1);
}
process.exit(0);
