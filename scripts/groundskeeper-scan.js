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

// version tag like v4.42.3 or v7.65 (minor required, patch optional) — used
// only to IDENTIFY a line as a versioned regression guard, never for age.
const VERSION_TAG_RE = /\bv(\d{1,2})\.(\d{1,3})(?:\.(\d{1,3}))?\b/;
const NEGATIVE_ASSERTION_RE = /!\s*(?:js|html|css)\.includes\(/;
const INCLUDES_LITERAL_RE = /\.includes\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;

// Guard age is no longer judged by version-number distance — the v4→v7
// jumps make "N minor versions behind" meaningless (everything looks
// ancient, producing 36 unreviewable candidates in practice). A candidate
// must now be BOTH provably dead (its asserted literal has zero
// occurrences anywhere in live code) AND old by real time (git-blame
// author-date on the guard line > 1 year).
const GUARD_AGE_DAYS_THRESHOLD = 365;
const GUARD_DISPLAY_CAP = 5;

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

// Concatenates every LIVE code surface a retired pattern could still be
// referenced from — if the literal shows up here, the guard isn't
// guarding a ghost yet.
function loadLiveSurfaces() {
  let combined = '';
  ['app.js', 'index.html', 'styles.css', 'dg-system.css'].forEach((f) => {
    combined += '\n' + (safeRead(f) || '');
  });
  ['features', 'certs'].forEach((dir) => {
    const dirPath = path.join(ROOT, dir);
    try {
      fs.readdirSync(dirPath)
        .filter((f) => f.endsWith('.js'))
        .forEach((f) => { combined += '\n' + (safeRead(path.join(dir, f)) || ''); });
    } catch (_) { /* dir may not exist */ }
  });
  return combined;
}

// git-blame author-time (unix seconds) for a single line, or null if it
// can't be determined (uncommitted line, git failure, etc).
function blameLineAuthorTime(relFilePath, lineNum) {
  const res = run(`git blame -L ${lineNum},${lineNum} --porcelain -- "${relFilePath}"`);
  if (!res.ok) return null;
  const m = res.stdout.match(/^author-time (\d+)$/m);
  return m ? parseInt(m[1], 10) : null;
}

function scanRegressionGuards(tombstoneText, liveSurfaceText) {
  const uatDir = path.join(ROOT, 'tests', 'uat');
  const files = fs.readdirSync(uatDir).filter((f) => /^\d+-.*\.js$/.test(f)).sort();
  const candidates = [];
  const nowSeconds = Date.now() / 1000;

  files.forEach((file) => {
    const filePath = path.join(uatDir, file);
    const relPath = path.join('tests', 'uat', file);
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
      if (!verMatch) { i = j; continue; } // not a versioned regression guard

      const litMatch = chunk.match(INCLUDES_LITERAL_RE);
      const literal = litMatch ? litMatch[2] : null;
      if (!literal) { i = j; continue; } // can't confirm dead-token without a literal — skip, don't guess

      if (isTombstoned(literal, tombstoneText)) { i = j; continue; }
      if (liveSurfaceText.includes(literal)) { i = j; continue; } // still referenced live — not dead

      const authorTime = blameLineAuthorTime(relPath, i + 1);
      if (authorTime === null) { i = j; continue; } // uncommitted / unblameable — can't confirm age
      const ageDays = Math.floor((nowSeconds - authorTime) / 86400);
      if (ageDays <= GUARD_AGE_DAYS_THRESHOLD) { i = j; continue; }

      const nameMatch = chunk.match(/test\(\s*(['"`])((?:\\.|(?!\1).)*)\1/);
      const testName = nameMatch ? nameMatch[2] : chunk.trim().slice(0, 60);

      candidates.push({
        file, line: i + 1, testName,
        versionTag: `v${verMatch[1]}.${verMatch[2]}${verMatch[3] ? '.' + verMatch[3] : ''}`,
        ageDays,
      });

      i = j;
    }
  });

  return candidates;
}

function checkRegressionGuards() {
  section('3. Regression-guard retirement candidates');
  console.log(c.dim(`  Rule: a candidate must be BOTH dead (asserted literal has zero live references) AND`));
  console.log(c.dim(`  old (git-blame age > ${GUARD_AGE_DAYS_THRESHOLD} days) — version-number distance is no longer used (v4→v7 jumps made it meaningless).`));
  console.log(c.dim('  Tombstoned guards (docs/conventions/regression-tombstones.md) are PERMANENT — never retire those, listed or not.'));
  console.log(c.dim('  REPORT ONLY — this script never deletes a guard. Human decision required for every line below.'));

  const tombstoneText = loadTombstones();
  const liveSurfaceText = loadLiveSurfaces();
  const candidates = scanRegressionGuards(tombstoneText, liveSurfaceText);

  if (candidates.length === 0) {
    console.log(c.green('✓ no retirement-eligible guards found'));
    summary('ok', 'No regression-guard retirement candidates');
    return;
  }

  const shown = candidates.slice(0, GUARD_DISPLAY_CAP);
  shown.forEach((cand) => {
    console.log(`  tests/uat/${cand.file}:${cand.line}  [${cand.versionTag}, ${cand.ageDays}d old, dead-token]  ${cand.testName}`);
  });
  if (candidates.length > GUARD_DISPLAY_CAP) {
    console.log(c.dim(`  +${candidates.length - GUARD_DISPLAY_CAP} more suppressed (cap ${GUARD_DISPLAY_CAP}/week)`));
  }
  summary('warn', `${shown.length} (of ${candidates.length}) regression-guard retirement candidate(s) — human review needed`);
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
// 6. Unpushed work (main ahead of origin/main)
// ══════════════════════════════════════════
function checkUnpushed() {
  section('6. Unpushed work');
  console.log(c.dim('  Compares against the LOCAL origin/main ref only — no network fetch.'));

  const countRes = run('git rev-list --count origin/main..main');
  if (!countRes.ok) {
    console.log(c.yellow('⚠ could not determine — no local origin/main ref (try `git fetch` first)'));
    summary('warn', 'Unpushed-work check skipped — no local origin/main ref');
    return;
  }

  const count = parseInt(countRes.stdout.trim(), 10) || 0;
  if (count === 0) {
    console.log(c.green('✓ main is even with origin/main'));
    summary('ok', 'Nothing unpushed');
    return;
  }

  console.log(c.yellow(`⚠ ${count} commit(s) on main not pushed to origin`));
  const logRes = run('git log --oneline origin/main..main -5');
  if (logRes.ok) {
    logRes.stdout.trim().split('\n').filter(Boolean).forEach((l) => console.log(`    ${l}`));
    if (count > 5) console.log(c.dim(`    +${count - 5} more`));
  }
  console.log(c.dim('  Reminder: git↔prod drift once cost 6 versions (v4.39→v4.43.1) — push before it stacks up.'));
  summary('warn', `${count} commit(s) on main not pushed to origin`);
}

// ══════════════════════════════════════════
// 7. Debt headroom & trend
// ══════════════════════════════════════════
function parseAppJsLinesFromClaudeMd(md) {
  if (!md) return null;
  const m = md.match(/\|\s*app\.js\s*\|\s*(\d+)\s*\|/);
  return m ? parseInt(m[1], 10) : null;
}

function checkDebtHeadroom() {
  section('7. Debt headroom & trend');

  const res = run('node tests/tech-debt.js --json');
  let parsed = null;
  if (res.stdout) {
    try { parsed = JSON.parse(res.stdout); } catch (_) { parsed = null; }
  }

  if (!parsed || !Array.isArray(parsed.metrics)) {
    console.log(c.yellow('⚠ could not run/parse `node tests/tech-debt.js --json`'));
    summary('warn', 'Debt headroom check failed — see script output');
    return;
  }

  parsed.metrics.forEach((m) => {
    const tight = m.limit > 0 && m.headroom / m.limit < 0.10;
    const line = `  ${m.name}: ${m.value} / ${m.limit} (headroom ${m.headroom})`;
    console.log(tight ? c.yellow(line) : line);
  });

  // app.js week-over-week trend, sourced from CLAUDE.md's FACTS block history
  // (no separate metrics-log file needed — git already has the time series).
  const currentMd = safeRead('CLAUDE.md');
  const currentLines = parseAppJsLinesFromClaudeMd(currentMd);
  let trendLine = null;
  if (currentLines !== null) {
    const shaRes = run('git rev-list -1 --before="7 days ago" main');
    if (shaRes.ok && shaRes.stdout.trim()) {
      const sha = shaRes.stdout.trim();
      const oldMdRes = run(`git show ${sha}:CLAUDE.md`);
      const oldLines = oldMdRes.ok ? parseAppJsLinesFromClaudeMd(oldMdRes.stdout) : null;
      if (oldLines !== null) {
        const delta = currentLines - oldLines;
        trendLine = `  app.js: ${currentLines} lines (Δ ${delta >= 0 ? '+' : ''}${delta} this week)`;
      }
    }
  }
  console.log(trendLine || c.dim('  app.js weekly trend: unavailable (no FACTS block 7 days ago, or history unreadable)'));

  // Extraction ratchet (#138 Phase 0+) — silent skip until the baseline file lands.
  const baselineRaw = safeRead('tests/appjs-baseline.json');
  if (baselineRaw) {
    try {
      const baseline = JSON.parse(baselineRaw);
      if (currentLines !== null && typeof baseline.lines === 'number') {
        const remaining = (baseline.lines + (baseline.allowance || 0)) - currentLines;
        console.log(`  extraction ratchet: baseline ${baseline.lines} + allowance ${baseline.allowance || 0} → ${remaining} lines remaining`);
      }
    } catch (_) { /* malformed baseline file — not this script's job to fix */ }
  }

  const rankable = parsed.metrics.filter((m) => m.limit > 0);
  if (rankable.length === 0) {
    summary('ok', 'Debt headroom OK (no rankable metrics)');
    return;
  }
  const tightest = rankable.reduce((a, b) => (a.headroom / a.limit <= b.headroom / b.limit ? a : b));
  if (tightest.headroom / tightest.limit < 0.10) {
    summary('warn', `${tightest.name} within 10% of limit (${tightest.headroom} left of ${tightest.limit})`);
  } else {
    summary('ok', `Debt headroom OK (tightest: ${tightest.name}, ${tightest.headroom} left)`);
  }
}

// ══════════════════════════════════════════
// 8. GitHub debt (the board nobody looks at)
// ══════════════════════════════════════════
function checkGithubDebt() {
  section('8. GitHub tech-debt board');

  const res = run('gh issue list --label tech-debt --state open --json number,title,updatedAt --limit 100');
  if (!res.ok) {
    console.log(c.yellow('⚠ gh unavailable — GitHub debt not scanned (offline or not authenticated)'));
    summary('warn', 'gh unavailable — GitHub debt not scanned');
    return;
  }

  let issues = [];
  try { issues = JSON.parse(res.stdout); } catch (_) {
    console.log(c.yellow('⚠ could not parse `gh issue list` output'));
    summary('warn', 'GitHub debt scan failed — unparseable gh output');
    return;
  }

  if (issues.length === 0) {
    console.log(c.green('✓ no open tech-debt issues'));
    summary('ok', 'tech-debt board empty');
    return;
  }

  const now = Date.now();
  const sorted = issues
    .map((iss) => ({ ...iss, untouchedDays: Math.floor((now - new Date(iss.updatedAt).getTime()) / 86400000) }))
    .sort((a, b) => b.untouchedDays - a.untouchedDays);

  console.log(`  ${issues.length} open issue(s) — 3 least-recently-updated:`);
  sorted.slice(0, 3).forEach((iss) => {
    console.log(`    #${iss.number} ${iss.title} (untouched ${iss.untouchedDays}d)`);
  });
  summary('warn', `${issues.length} open tech-debt issue(s) (oldest untouched ${sorted[0].untouchedDays}d)`);
}

// ══════════════════════════════════════════
// main
// ══════════════════════════════════════════
function main() {
  console.log(c.bold('\n🧹 Groundskeeper scan — ' + new Date().toISOString().slice(0, 10) + '\n'));

  checkFactsFreshness();
  checkGraphify();
  checkRegressionGuards();
  checkVersionHistory();
  checkClutter();
  checkUnpushed();
  checkDebtHeadroom();
  checkGithubDebt();

  console.log('\n' + c.bold(c.cyan('── 9. Summary ──')));
  summaryLines.forEach((l) => console.log(l));
  console.log('');

  process.exit(0);
}

main();
