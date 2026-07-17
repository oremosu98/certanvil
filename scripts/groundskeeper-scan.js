#!/usr/bin/env node
// ══════════════════════════════════════════
// scripts/groundskeeper-scan.js
//
// Read-only weekly maintenance scanner. Prints a structured report of the
// repo's standing tidy-up policies that currently rely on humans
// remembering them: FACTS-block freshness, graphify staleness, regression-
// guard retirement candidates, CLAUDE.md Version History length, and repo
// clutter (playwright-report/, test-results/, untracked files).
//
// NO file mutations. NO network calls. NO git writes. Findings are not
// failures — this script always exits 0. It is driven weekly by the
// `groundskeeper` project skill (.claude/skills/groundskeeper/SKILL.md).
//
// Usage:
//   node scripts/groundskeeper-scan.js
// ══════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// ── color helpers (matches scripts/stamp-facts.js / bump-version.js style) ──
const c = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const summaryLines = [];
function summary(status, text) {
  // status: 'ok' | 'warn'
  const icon = status === 'ok' ? '✅' : '⚠️';
  summaryLines.push(`GK-SUMMARY: ${icon} ${text}`);
}

function section(title) {
  console.log('\n' + c.bold(c.cyan(`── ${title} ──`)));
}

function run(cmd, opts) {
  opts = opts || {};
  try {
    const out = execSync(cmd, {
      cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'], timeout: opts.timeout || 60000,
    }).toString();
    return { ok: true, code: 0, stdout: out, stderr: '' };
  } catch (err) {
    return {
      ok: false,
      code: typeof err.status === 'number' ? err.status : 1,
      stdout: err.stdout ? err.stdout.toString() : '',
      stderr: err.stderr ? err.stderr.toString() : '',
    };
  }
}

function safeRead(relPath) {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  } catch (_) {
    return null;
  }
}

// ══════════════════════════════════════════
// 1. FACTS freshness
// ══════════════════════════════════════════
function checkFactsFreshness() {
  section('1. FACTS freshness (CLAUDE.md auto-stamped block)');
  const res = run('node scripts/stamp-facts.js --check');
  const output = (res.stdout + res.stderr).trim();
  if (res.ok) {
    console.log(c.green('✓ fresh') + ' — ' + output);
    summary('ok', 'FACTS block fresh (CLAUDE.md matches disk)');
  } else {
    console.log(c.yellow('⚠ stale') + ' — run `node scripts/stamp-facts.js` to refresh');
    console.log(c.dim(output.split('\n').slice(0, 10).join('\n')));
    summary('warn', 'FACTS block stale — run `node scripts/stamp-facts.js`');
  }
}

// ══════════════════════════════════════════
// 2. Graphify staleness
// ══════════════════════════════════════════
function checkGraphify() {
  section('2. Graphify staleness (code map)');
  const graphDir = path.join(ROOT, 'graphify-out');
  if (!fs.existsSync(path.join(graphDir, 'graph.json'))) {
    console.log(c.yellow('⚠ graphify-out/graph.json not found') + ' — run `graphify .` to build the code map.');
    summary('warn', 'graphify-out/ missing — run `graphify .`');
    return;
  }
  const res = run('node scripts/graphq.js stale --json');
  let parsed = null;
  try { parsed = JSON.parse(res.stdout); } catch (_) { /* fall through */ }

  if (!parsed) {
    console.log(c.yellow('⚠ could not parse `graphq.js stale` output'));
    console.log(c.dim((res.stdout + res.stderr).trim()));
    summary('warn', 'graphify stale-check did not return parseable JSON');
    return;
  }

  console.log(`  repo HEAD:        ${parsed.head}`);
  console.log(`  structure built:  ${parsed.structure_commit}  ${parsed.structure_stale ? c.yellow('⚠ STALE — run `graphify .`') : c.green('✓ fresh')}`);
  console.log(`  labels (names):   ${parsed.unlabeled_pct}% unlabeled (${parsed.unlabeled} communities)  ${parsed.labels_stale ? c.yellow('⚠ needs re-label') : c.green('✓ named')}`);

  if (parsed.labels_stale) {
    console.log(c.yellow('  → re-label with: ') + 'export ANTHROPIC_API_KEY=…; graphify label . --backend claude --model claude-sonnet-4-6');
  }
  // Documented gotcha, always printed as a reminder regardless of outcome.
  console.log(c.dim('  Gotcha: re-labeling silently no-ops if ANTHROPIC_API_KEY is not exported in-shell —'));
  console.log(c.dim('  it falls back to generic "Community N" names with no error.'));

  if (parsed.structure_stale || parsed.labels_stale) {
    const bits = [];
    if (parsed.structure_stale) bits.push('structure stale');
    if (parsed.labels_stale) bits.push(`${parsed.unlabeled_pct}% communities unlabeled`);
    summary('warn', `Graphify needs attention — ${bits.join(', ')}`);
  } else {
    summary('ok', 'Graphify structure + labels fresh');
  }
}

// ══════════════════════════════════════════
// 3. Regression-guard retirement candidates
// ══════════════════════════════════════════

// version tag like v4.42.3 or v7.65 (minor required, patch optional)
const VERSION_TAG_RE = /\bv(\d{1,2})\.(\d{1,3})(?:\.(\d{1,3}))?\b/;
const NEGATIVE_ASSERTION_RE = /!\s*(?:js|html|css)\.includes\(/;
const INCLUDES_LITERAL_RE = /\.includes\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;

function versionScore(major, minor) {
  // Comparable-version implementation: major dominates (a major bump is a
  // much bigger jump than any run of minors), minor breaks ties within a
  // major. Patch is ignored for "age" — the task's own example (v7.50.x vs
  // v7.65.x) only compares major.minor.
  return major * 1000 + minor;
}

function parseAppVersion() {
  const js = safeRead('app.js') || '';
  const m = js.match(/const APP_VERSION = '([^']*)'/);
  if (!m) return null;
  const parts = m[1].split('.').map((n) => parseInt(n, 10));
  return { raw: m[1], major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
}

function loadTombstones() {
  return safeRead('docs/conventions/regression-tombstones.md') || '';
}

// Returns true if the guard's asserted literal (or a >=6-char identifier
// pulled out of it) shows up in the tombstones doc — treated as a
// permanent, intentionally-kept guard.
function isTombstoned(literal, tombstoneText) {
  if (!literal || !tombstoneText) return false;
  if (tombstoneText.includes(literal)) return true;
  const idents = literal.match(/[A-Za-z_$][A-Za-z0-9_$]{5,}/g) || [];
  return idents.some((id) => tombstoneText.includes(id));
}

function scanRegressionGuards(currentVersion, tombstoneText) {
  const uatDir = path.join(ROOT, 'tests', 'uat');
  const files = fs.readdirSync(uatDir).filter((f) => /^\d+-.*\.js$/.test(f)).sort();
  const candidates = [];
  const currentScore = versionScore(currentVersion.major, currentVersion.minor);

  files.forEach((file) => {
    const filePath = path.join(uatDir, file);
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/\btest\(/.test(line)) continue;

      // Join lines until the statement looks closed (balanced parens or a
      // line ending in ");"), capped so a malformed file can't hang us.
      let chunk = line;
      let depth = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
      let j = i;
      let guard = 0;
      while (depth > 0 && guard < 8 && j + 1 < lines.length) {
        j++;
        chunk += '\n' + lines[j];
        depth += (lines[j].match(/\(/g) || []).length - (lines[j].match(/\)/g) || []).length;
        guard++;
      }

      // Preceding comment lines (walk upward while they're `//` comments).
      let commentText = '';
      let k = i - 1;
      let cguard = 0;
      while (k >= 0 && /^\s*\/\//.test(lines[k]) && cguard < 3) {
        commentText = lines[k] + '\n' + commentText;
        k--;
        cguard++;
      }

      const searchText = commentText + chunk;
      const isNegative = NEGATIVE_ASSERTION_RE.test(chunk);
      if (!isNegative) { i = j; continue; }

      const verMatch = searchText.match(VERSION_TAG_RE);
      if (!verMatch) { i = j; continue; }

      const major = parseInt(verMatch[1], 10);
      const minor = parseInt(verMatch[2], 10);
      const score = versionScore(major, minor);
      const ageMinorVersions = currentScore - score;
      if (ageMinorVersions <= 10) { i = j; continue; }

      const litMatch = chunk.match(INCLUDES_LITERAL_RE);
      const literal = litMatch ? litMatch[2] : null;
      if (isTombstoned(literal, tombstoneText)) { i = j; continue; }

      const nameMatch = chunk.match(/test\(\s*(['"`])((?:\\.|(?!\1).)*)\1/);
      const testName = nameMatch ? nameMatch[2] : chunk.trim().slice(0, 60);

      candidates.push({
        file, line: i + 1, testName,
        versionTag: `v${verMatch[1]}.${verMatch[2]}${verMatch[3] ? '.' + verMatch[3] : ''}`,
        ageMinorVersions,
      });

      i = j;
    }
  });

  return candidates;
}

function checkRegressionGuards(currentVersion) {
  section('3. Regression-guard retirement candidates');
  console.log(c.dim('  Rule: guards keep 3-4 versions after the deletion they guard, then retire (tests/uat/_context.js philosophy header).'));
  console.log(c.dim('  Tombstoned guards (docs/conventions/regression-tombstones.md) are PERMANENT — never retire those, listed or not.'));
  console.log(c.dim('  REPORT ONLY — this script never deletes a guard. Human decision required for every line below.'));

  if (!currentVersion) {
    console.log(c.yellow('⚠ could not parse APP_VERSION from app.js — skipping'));
    summary('warn', 'Regression-guard scan skipped — APP_VERSION unreadable');
    return;
  }

  const tombstoneText = loadTombstones();
  const candidates = scanRegressionGuards(currentVersion, tombstoneText);

  console.log(`  current APP_VERSION: v${currentVersion.raw} — flagging guards tagged ≤10 minor versions behind current minor`);

  if (candidates.length === 0) {
    console.log(c.green('✓ no retirement-eligible guards found'));
    summary('ok', 'No regression-guard retirement candidates');
    return;
  }

  const shown = candidates.slice(0, 30);
  shown.forEach((cand) => {
    console.log(`  tests/uat/${cand.file}:${cand.line}  [${cand.versionTag}, ${cand.ageMinorVersions} minor-versions behind]  ${cand.testName}`);
  });
  if (candidates.length > 30) {
    console.log(c.dim(`  +${candidates.length - 30} more`));
  }
  summary('warn', `${candidates.length} regression-guard retirement candidate(s) — human review needed`);
}

// ══════════════════════════════════════════
// 4. CLAUDE.md Version History length
// ══════════════════════════════════════════
function checkVersionHistory() {
  section('4. CLAUDE.md Version History length');
  const md = safeRead('CLAUDE.md');
  if (!md) {
    console.log(c.yellow('⚠ could not read CLAUDE.md'));
    summary('warn', 'Version History check skipped — CLAUDE.md unreadable');
    return;
  }
  const headingIdx = md.indexOf('## Version History');
  if (headingIdx === -1) {
    console.log(c.yellow('⚠ "## Version History" section not found'));
    summary('warn', 'Version History section not found in CLAUDE.md');
    return;
  }
  const nextHeadingIdx = md.indexOf('\n## ', headingIdx + 1);
  const section_ = md.slice(headingIdx, nextHeadingIdx === -1 ? md.length : nextHeadingIdx);
  const rowRe = /^\|\s*(v[\d.]+)\s*\|(.*)\|/gm;
  const rows = [];
  let m;
  while ((m = rowRe.exec(section_)) !== null) {
    if (/^-+$/.test(m[1].trim())) continue; // skip separator rows like |---|---|
    rows.push({ version: m[1].trim(), desc: m[2].trim() });
  }

  console.log(`  rows found: ${rows.length} (policy: keep last 3, trim the rest to CHANGELOG.md)`);
  rows.forEach((r) => console.log(`    ${r.version} — ${r.desc.slice(0, 70)}`));

  if (rows.length <= 3) {
    console.log(c.green('✓ within policy'));
    summary('ok', `Version History within policy (${rows.length}/3 rows)`);
    return;
  }

  const excess = rows.slice(3);
  const changelog = safeRead('CHANGELOG.md') || '';
  console.log(c.yellow(`⚠ ${excess.length} row(s) over the 3-row cap:`));
  excess.forEach((r) => {
    const versionEsc = r.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tableRowRe = new RegExp(`\\|\\s*${versionEsc}\\s*\\|`);
    const narrativeRe = new RegExp(`\\b${versionEsc}\\b`);
    const hasRow = tableRowRe.test(changelog);
    const hasNarrative = !hasRow && narrativeRe.test(changelog);
    let verdict;
    if (hasRow) verdict = c.green('safe to trim (row already in CHANGELOG.md)');
    else if (hasNarrative) verdict = c.yellow('needs CHANGELOG entry first (only mentioned in prose, no table row)');
    else verdict = c.yellow('needs CHANGELOG entry first (no mention at all)');
    console.log(`    ${r.version} — ${verdict}`);
  });
  summary('warn', `Version History ${rows.length}/3 rows — ${excess.length} excess (${excess.map((r) => r.version).join(', ')})`);
}

// ══════════════════════════════════════════
// 5. Repo clutter
// ══════════════════════════════════════════
function dirSize(relPath) {
  const res = run(`du -sh "${relPath}" 2>/dev/null`);
  if (!res.ok || !res.stdout.trim()) return null;
  return res.stdout.trim().split('\t')[0];
}

const KNOWN_FINE_UNTRACKED_PREFIXES = [
  '.claude/skills/feature-lane/',
  'graphify-out/',
  'playwright-report/',
  'test-results/',
  'node_modules/',
];

function checkClutter() {
  section('5. Repo clutter');

  ['playwright-report', 'test-results'].forEach((dir) => {
    if (fs.existsSync(path.join(ROOT, dir))) {
      const size = dirSize(dir);
      console.log(`  ${dir}/  ${size ? size : '(present, size unknown)'}`);
    } else {
      console.log(`  ${dir}/  ${c.dim('not present')}`);
    }
  });

  const gitRes = run('git status --porcelain');
  const statusLines = gitRes.ok ? gitRes.stdout.split('\n').filter(Boolean) : [];
  const dirty = statusLines.length > 0;

  const untracked = statusLines
    .filter((l) => l.startsWith('??'))
    .map((l) => l.slice(3).trim());
  const flaggedUntracked = untracked.filter(
    (f) => !KNOWN_FINE_UNTRACKED_PREFIXES.some((p) => f.startsWith(p))
  );
  const knownFineUntracked = untracked.filter(
    (f) => KNOWN_FINE_UNTRACKED_PREFIXES.some((p) => f.startsWith(p))
  );
  const nonUntracked = statusLines.filter((l) => !l.startsWith('??'));

  console.log(`  working tree: ${dirty ? c.yellow('dirty') : c.green('clean')} (${statusLines.length} status line(s))`);
  if (knownFineUntracked.length) {
    console.log(c.dim(`  known-fine untracked (ignored): ${knownFineUntracked.join(', ')}`));
  }
  if (nonUntracked.length) {
    console.log(c.yellow('  staged/modified/deleted (not untracked):'));
    nonUntracked.forEach((l) => console.log(`    ${l}`));
  }
  if (flaggedUntracked.length) {
    console.log(c.yellow('  untracked files needing attention:'));
    flaggedUntracked.forEach((f) => console.log(`    ?? ${f}`));
  }

  const problems = [];
  if (nonUntracked.length) problems.push(`${nonUntracked.length} staged/modified file(s)`);
  if (flaggedUntracked.length) problems.push(`${flaggedUntracked.length} untracked file(s)`);
  if (problems.length) {
    summary('warn', `Repo clutter — ${problems.join(', ')}`);
  } else {
    summary('ok', 'Repo clean (only known-fine untracked items, if any)');
  }
}

// ══════════════════════════════════════════
// main
// ══════════════════════════════════════════
function main() {
  console.log(c.bold('\n🧹 Groundskeeper scan — ' + new Date().toISOString().slice(0, 10) + '\n'));

  checkFactsFreshness();
  checkGraphify();
  const currentVersion = parseAppVersion();
  checkRegressionGuards(currentVersion);
  checkVersionHistory();
  checkClutter();

  console.log('\n' + c.bold(c.cyan('── 6. Summary ──')));
  summaryLines.forEach((l) => console.log(l));
  console.log('');

  process.exit(0);
}

main();
