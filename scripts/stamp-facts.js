#!/usr/bin/env node
// ══════════════════════════════════════════
// scripts/stamp-facts.js
//
// Computes hand-maintained-fact rot out of existence. CLAUDE.md used to carry
// hardcoded file sizes / line counts / UAT check totals that went stale the
// moment anyone shipped ("~964 KB / ~19K lines" long after app.js hit 22K).
// This script recomputes those numbers from disk and stamps a compact block
// into CLAUDE.md between the `<!-- FACTS:AUTO:BEGIN -->` / `...:END -->`
// markers. It is idempotent — running it twice with no repo changes in
// between produces a byte-identical file.
//
// Usage:
//   node scripts/stamp-facts.js            # rewrite the block in place
//   node scripts/stamp-facts.js --check     # exit 0 if the stamped block
//                                            # matches freshly computed
//                                            # values (within tolerance),
//                                            # exit 1 if stale/missing.
//
// Also usable as a library (see tests/uat/250-facts-freshness.js):
//   const { computeFacts, renderBlock, parseBlock } = require('./stamp-facts');
// ══════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CLAUDE_MD = path.join(ROOT, 'CLAUDE.md');

const BEGIN_MARKER = '<!-- FACTS:AUTO:BEGIN -->';
const END_MARKER = '<!-- FACTS:AUTO:END -->';

// Tolerance used both by `--check` here and by the UAT freshness assertions
// in tests/uat/250-facts-freshness.js — kept in one place so the two never
// drift apart.
const TOLERANCE_PCT = 0.03;

// ── helpers ──────────────────────────────────────────────────────────

function fileStats(relPath) {
  const p = path.join(ROOT, relPath);
  const content = fs.readFileSync(p, 'utf8');
  const lines = content.split('\n').length;
  const kb = Math.round(Buffer.byteLength(content, 'utf8') / 1024);
  return { lines, kb };
}

function uatSuiteLines() {
  const entryLines = fs.readFileSync(path.join(ROOT, 'tests/uat.js'), 'utf8').split('\n').length;
  const domainDir = path.join(ROOT, 'tests/uat');
  const domainFiles = fs.readdirSync(domainDir).filter((f) => f.endsWith('.js'));
  let domainLines = 0;
  domainFiles.forEach((f) => {
    domainLines += fs.readFileSync(path.join(domainDir, f), 'utf8').split('\n').length;
  });
  const numberedCount = domainFiles.filter((f) => /^\d+-.*\.js$/.test(f)).length;
  return { totalLines: entryLines + domainLines, moduleCount: numberedCount };
}

function e2eTestCount() {
  const e2eDir = path.join(ROOT, 'tests/e2e');
  let total = 0;
  let files = [];
  try {
    files = fs.readdirSync(e2eDir).filter((f) => f.endsWith('.spec.js'));
  } catch (_) {
    return 0;
  }
  files.forEach((f) => {
    const src = fs.readFileSync(path.join(e2eDir, f), 'utf8');
    const matches = src.match(/\btest\(/g);
    total += matches ? matches.length : 0;
  });
  return total;
}

function appVersion() {
  const js = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  // Same pattern scripts/bump-version.js uses to locate/replace it.
  const m = js.match(/const APP_VERSION = '([^']*)'/);
  return m ? m[1] : 'unknown';
}

function gitStampedAt() {
  try {
    const status = execSync('git status --porcelain', {
      cwd: ROOT, stdio: ['pipe', 'pipe', 'ignore'],
    }).toString();
    // A dirty tree means the numbers we just computed reflect uncommitted
    // work, not the frozen state of any single commit — say so plainly
    // rather than stamping a sha that doesn't actually match what's on disk.
    if (status.trim().length > 0) return 'worktree';
    const sha = execSync('git rev-parse --short HEAD', {
      cwd: ROOT, stdio: ['pipe', 'pipe', 'ignore'],
    }).toString().trim();
    return sha || 'worktree';
  } catch (_) {
    return 'worktree';
  }
}

// Runs the UAT suite and parses its `N/N ALL PASS` (or `N/T — F FAILED`)
// summary line for the total check count. On any failure to run/parse,
// returns null so the caller can fall back to the previously-stamped value
// instead of clobbering it with garbage.
function runUatAndGetTotal() {
  try {
    const out = execSync('node tests/uat.js', {
      cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000,
    }).toString();
    const m = out.match(/UAT:\s*\d+\/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  } catch (err) {
    // Non-zero exit (e.g. mid-edit worktree with a real failure). Try to
    // still parse a total out of stdout/stderr before giving up entirely.
    const out = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
    const m = out.match(/UAT:\s*\d+\/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }
}

// ── core: compute / render / parse ──────────────────────────────────

// opts.runUat (default true) — set false to skip shelling out to
// `node tests/uat.js` (used by the UAT domain file itself, to avoid
// recursively re-running the whole suite from inside the suite).
function computeFacts(opts) {
  opts = opts || {};
  const runUat = opts.runUat !== false;

  const appJs = fileStats('app.js');
  const stylesCss = fileStats('styles.css');
  const indexHtml = fileStats('index.html');
  const dgSystemCss = fileStats('dg-system.css');
  const uatSuite = uatSuiteLines();
  const e2eTests = e2eTestCount();
  const version = appVersion();
  const stampedAt = gitStampedAt();

  let uatChecks = null;
  if (runUat) {
    uatChecks = runUatAndGetTotal();
    if (uatChecks === null) {
      // Fall back to whatever is currently stamped so a transient UAT
      // failure doesn't blow away a good number.
      const prev = parseBlock(readClaudeMdSafe());
      uatChecks = prev ? prev.uatChecks : null;
    }
  }

  return {
    appJs, stylesCss, indexHtml, dgSystemCss,
    uatSuiteLines: uatSuite.totalLines,
    uatModuleCount: uatSuite.moduleCount,
    uatChecks,
    e2eTests,
    version,
    stampedAt,
  };
}

function renderBlock(facts) {
  const lines = [];
  lines.push(BEGIN_MARKER);
  lines.push('<!-- machine-owned — run `node scripts/stamp-facts.js` to refresh; do not hand-edit -->');
  lines.push('| Metric | Lines | Size |');
  lines.push('|---|---|---|');
  lines.push(`| app.js | ${facts.appJs.lines} | ${facts.appJs.kb} KB |`);
  lines.push(`| styles.css | ${facts.stylesCss.lines} | ${facts.stylesCss.kb} KB |`);
  lines.push(`| index.html | ${facts.indexHtml.lines} | ${facts.indexHtml.kb} KB |`);
  lines.push(`| dg-system.css | ${facts.dgSystemCss.lines} | ${facts.dgSystemCss.kb} KB |`);
  lines.push(`| tests/uat.js + tests/uat/ (${facts.uatModuleCount} modules) | ${facts.uatSuiteLines} | — |`);
  const uatChecksStr = facts.uatChecks === null || facts.uatChecks === undefined ? 'unknown' : facts.uatChecks;
  lines.push(`UAT checks: ${uatChecksStr} · E2E \`test(\` count: ${facts.e2eTests} · APP_VERSION: ${facts.version} · stamped-at: ${facts.stampedAt}`);
  lines.push(END_MARKER);
  return lines.join('\n');
}

function parseBlock(md) {
  if (!md) return null;
  const beginIdx = md.indexOf(BEGIN_MARKER);
  const endIdx = md.indexOf(END_MARKER);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) return null;
  const block = md.slice(beginIdx, endIdx + END_MARKER.length);

  const num = (re) => {
    const m = block.match(re);
    return m ? parseInt(m[1], 10) : null;
  };

  const appJsLines = num(/\|\s*app\.js\s*\|\s*(\d+)\s*\|/);
  const appJsKb = num(/\|\s*app\.js\s*\|\s*\d+\s*\|\s*(\d+)\s*KB\s*\|/);
  const stylesCssLines = num(/\|\s*styles\.css\s*\|\s*(\d+)\s*\|/);
  const stylesCssKb = num(/\|\s*styles\.css\s*\|\s*\d+\s*\|\s*(\d+)\s*KB\s*\|/);
  const indexHtmlLines = num(/\|\s*index\.html\s*\|\s*(\d+)\s*\|/);
  const indexHtmlKb = num(/\|\s*index\.html\s*\|\s*\d+\s*\|\s*(\d+)\s*KB\s*\|/);
  const dgSystemCssLines = num(/\|\s*dg-system\.css\s*\|\s*(\d+)\s*\|/);
  const dgSystemCssKb = num(/\|\s*dg-system\.css\s*\|\s*\d+\s*\|\s*(\d+)\s*KB\s*\|/);
  const uatSuiteLines = num(/tests\/uat\.js \+ tests\/uat\/ \(\d+ modules\)\s*\|\s*(\d+)\s*\|/);
  const uatModuleCount = num(/tests\/uat\.js \+ tests\/uat\/ \((\d+) modules\)/);
  const uatChecks = num(/UAT checks:\s*(\d+)/);
  const e2eTests = num(/E2E `test\(` count:\s*(\d+)/);
  const versionMatch = block.match(/APP_VERSION:\s*([\d.]+)/);
  const stampedAtMatch = block.match(/stamped-at:\s*(\S+)/);

  return {
    appJs: { lines: appJsLines, kb: appJsKb },
    stylesCss: { lines: stylesCssLines, kb: stylesCssKb },
    indexHtml: { lines: indexHtmlLines, kb: indexHtmlKb },
    dgSystemCss: { lines: dgSystemCssLines, kb: dgSystemCssKb },
    uatSuiteLines,
    uatModuleCount,
    uatChecks,
    e2eTests,
    version: versionMatch ? versionMatch[1] : null,
    stampedAt: stampedAtMatch ? stampedAtMatch[1] : null,
  };
}

function readClaudeMdSafe() {
  try {
    return fs.readFileSync(CLAUDE_MD, 'utf8');
  } catch (_) {
    return '';
  }
}

// within `tol` relative tolerance (both null => equal; one null => mismatch)
function withinTolerance(a, b, tol) {
  if (a === null || a === undefined || b === null || b === undefined) return a === b;
  if (a === b) return true;
  const denom = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / denom <= tol;
}

// ── CLI ──────────────────────────────────────────────────────────────

function writeBlock(facts) {
  const md = readClaudeMdSafe();
  if (!md) {
    console.error('ERROR: could not read CLAUDE.md');
    process.exit(1);
  }
  const beginIdx = md.indexOf(BEGIN_MARKER);
  const endIdx = md.indexOf(END_MARKER);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    console.error(`ERROR: FACTS markers not found in CLAUDE.md (expected ${BEGIN_MARKER} / ${END_MARKER})`);
    process.exit(1);
  }
  const newBlock = renderBlock(facts);
  const newMd = md.slice(0, beginIdx) + newBlock + md.slice(endIdx + END_MARKER.length);
  if (newMd === md) {
    console.log('CLAUDE.md FACTS block already up to date — no changes.');
    return;
  }
  fs.writeFileSync(CLAUDE_MD, newMd);
  console.log('CLAUDE.md FACTS block updated.');
}

function runCheck() {
  const md = readClaudeMdSafe();
  const stamped = parseBlock(md);
  if (!stamped) {
    console.error('FACTS block missing or unparseable in CLAUDE.md — stale.');
    process.exit(1);
  }
  const fresh = computeFacts({ runUat: true });

  const checks = [
    ['app.js lines', stamped.appJs.lines, fresh.appJs.lines],
    ['app.js KB', stamped.appJs.kb, fresh.appJs.kb],
    ['styles.css lines', stamped.stylesCss.lines, fresh.stylesCss.lines],
    ['styles.css KB', stamped.stylesCss.kb, fresh.stylesCss.kb],
    ['index.html lines', stamped.indexHtml.lines, fresh.indexHtml.lines],
    ['index.html KB', stamped.indexHtml.kb, fresh.indexHtml.kb],
    ['dg-system.css lines', stamped.dgSystemCss.lines, fresh.dgSystemCss.lines],
    ['dg-system.css KB', stamped.dgSystemCss.kb, fresh.dgSystemCss.kb],
    ['UAT suite lines', stamped.uatSuiteLines, fresh.uatSuiteLines],
    ['UAT module count', stamped.uatModuleCount, fresh.uatModuleCount],
    ['UAT checks', stamped.uatChecks, fresh.uatChecks],
    ['E2E test( count', stamped.e2eTests, fresh.e2eTests],
  ];

  let stale = false;
  checks.forEach(([label, a, b]) => {
    if (!withinTolerance(a, b, TOLERANCE_PCT)) {
      console.error(`STALE: ${label} — stamped=${a} fresh=${b} (tolerance ${TOLERANCE_PCT * 100}%)`);
      stale = true;
    }
  });
  if (stamped.version !== fresh.version) {
    console.error(`STALE: APP_VERSION — stamped=${stamped.version} fresh=${fresh.version}`);
    stale = true;
  }

  if (stale) {
    console.error('\nFACTS block is stale — run `node scripts/stamp-facts.js` to refresh.');
    process.exit(1);
  }
  console.log('FACTS block is fresh.');
  process.exit(0);
}

if (require.main === module) {
  if (process.argv.includes('--check')) {
    runCheck();
  } else {
    const facts = computeFacts({ runUat: true });
    writeBlock(facts);
  }
}

module.exports = {
  ROOT, CLAUDE_MD, BEGIN_MARKER, END_MARKER, TOLERANCE_PCT,
  fileStats, uatSuiteLines, e2eTestCount, appVersion, gitStampedAt,
  computeFacts, renderBlock, parseBlock, withinTolerance, readClaudeMdSafe,
};
