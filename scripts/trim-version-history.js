#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// Trim CLAUDE.md's Version History back to the last 3 ships — safely
// ══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS (2026-10-01)
//
// bump-version.js prepends one row to CLAUDE.md's Version History table on
// every ship, and the file's own rule is "inline only the last 3". Nothing
// enforced the trim, so ~20 ships in one session pushed CLAUDE.md past the
// 30KB ceiling and the pre-commit UAT refused the next commit.
//
// The trap in doing it by hand: 19 rows (v8.2.1 - v8.13.0) existed ONLY in
// CLAUDE.md — CHANGELOG had silently fallen behind for those releases — so a
// blind cut would have deleted that history. This script never drops a row
// that CHANGELOG lacks: it moves it there first, in version order.
//
// Run after bump-version.js and after the CHANGELOG row is added. Idempotent.
// USAGE: node scripts/trim-version-history.js [--keep 3]
// ══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CLAUDE = path.join(ROOT, 'CLAUDE.md');
const CHANGELOG = path.join(ROOT, 'CHANGELOG.md');
const i = process.argv.indexOf('--keep');
const KEEP = i === -1 ? 3 : parseInt(process.argv[i + 1], 10);

const ROW = /^\| (v\d+\.\d+\.\d+) \|/;
const key = v => v.slice(1).split('.').map(Number);
const older = (a, b) => { const x = key(a), y = key(b); for (let k = 0; k < 3; k++) if (x[k] !== y[k]) return x[k] < y[k]; return false; };

const claude = fs.readFileSync(CLAUDE, 'utf8').split('\n');
const changelog = fs.readFileSync(CHANGELOG, 'utf8').split('\n');

const rows = claude.map((l, idx) => { const m = l.match(ROW); return m ? { idx, line: l, v: m[1] } : null; }).filter(Boolean);
if (rows.length <= KEEP) { console.log(`Version History already at ${rows.length} rows — nothing to trim.`); process.exit(0); }

const keep = new Set(rows.slice(0, KEEP).map(r => r.v));
const inChangelog = new Set(changelog.map(l => (l.match(ROW) || [])[1]).filter(Boolean));

// Move any row CHANGELOG lacks into it first, newest first, at its version slot.
const moved = [];
for (const r of rows.filter(r => !keep.has(r.v) && !inChangelog.has(r.v))) {
  const slots = changelog.map((l, idx) => { const m = l.match(ROW); return m ? { idx, v: m[1] } : null; }).filter(Boolean);
  const at = slots.find(s => older(s.v, r.v));
  changelog.splice(at ? at.idx : (slots.length ? slots[slots.length - 1].idx + 1 : changelog.length), 0, r.line);
  moved.push(r.v);
}

const drop = new Set(rows.filter(r => !keep.has(r.v)).map(r => r.idx));
const trimmed = claude.filter((_, idx) => !drop.has(idx));

// Refuse to finish if any version would vanish from both files.
const finalC = new Set(trimmed.map(l => (l.match(ROW) || [])[1]).filter(Boolean));
const finalH = new Set(changelog.map(l => (l.match(ROW) || [])[1]).filter(Boolean));
const lost = rows.map(r => r.v).filter(v => !finalC.has(v) && !finalH.has(v));
if (lost.length) { console.error('ABORT — would lose history for: ' + lost.join(', ')); process.exit(1); }

fs.writeFileSync(CHANGELOG, changelog.join('\n'));
fs.writeFileSync(CLAUDE, trimmed.join('\n'));
console.log(`Version History trimmed ${rows.length} -> ${KEEP} rows` +
  (moved.length ? `; moved ${moved.length} row(s) CHANGELOG lacked: ${moved.join(', ')}` : '') +
  `. CLAUDE.md is now ${fs.statSync(CLAUDE).size} bytes.`);
