#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// Exemplar gate — the safety net for the Fast-lane exemplar workflow
// ══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS (2026-08-22)
//
// Five exemplar lessons shipped in one day (v8.14.0-v8.18.0). The heavyweight
// spec+plan+SDD process caught nothing; the ADVERSARIAL REVIEW and the ad-hoc
// SCRIPTED CHECKS caught everything. This script is those checks, made
// permanent so they cannot be skipped or half-run.
//
// Every check here exists because something got through without it:
//   - domain guard     : the balance guard is the one hard CI gate on content
//   - length bias      : a draft shipped 12 of 14 keys as the longest option
//   - letter spread    : D was the correct answer in 15 of 322 items pack-wide
//   - true distractors : a padded distractor became factually TRUE of passkeys
//   - persona/prop     : a rename collided with the pack's canonical "David from IT"
//   - objective spread : an off-by-one in expected counts blocked a task
//
// USAGE
//   node scripts/exemplar-gate.js --cert secplus --version 8.18.0
//   node scripts/exemplar-gate.js --cert secplus --version 8.18.0 --json
//
// Exits 0 if every gate passes, 1 otherwise. Safe to run any time; reads only.
// ══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const argVal = (f, d) => { const i = args.indexOf(f); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const CERT = argVal('--cert', 'secplus');
const VERSION = argVal('--version', null);
const JSON_OUT = args.includes('--json');

const src = fs.readFileSync(path.join(ROOT, 'certs', `${CERT}.js`), 'utf8');
const sandbox = { window: {} };
new vm.Script(src).runInNewContext(sandbox);
const PACK = sandbox.window.CERT_PACKS[CERT];
if (!PACK) { console.error(`Could not load CERT_PACKS.${CERT}`); process.exit(1); }

const ALL = PACK.questionExemplars || [];
const NEW = VERSION ? ALL.filter(e => e.addedVersion === VERSION) : [];

const results = [];
const pass = (name, ok, detail) => results.push({ name, ok, detail });

// ── 1. Domain-distribution guard (mirrors tests/uat/120-*.js:664) ─────────
// Counted from the SOURCE text, exactly as the UAT guard does, so a missing
// quote or a stray space shows up here rather than in CI.
{
  const m = src.match(/"objective":"(\d+)\.\d+"/g) || [];
  const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  m.forEach(x => { const d = x.match(/"objective":"(\d+)\./)[1]; if (c[d] !== undefined) c[d]++; });
  const target = { 1: 12, 2: 22, 3: 18, 4: 28, 5: 20 };
  const tol = { 1: 19, 2: 10, 3: 10, 4: 10, 5: 10 };
  let ok = true;
  const rows = [1, 2, 3, 4, 5].map(k => {
    const pct = c[k] / m.length * 100, delta = pct - target[k];
    const good = Math.abs(delta) <= tol[k];
    if (!good) ok = false;
    // headroom: how many NON-k items can be added before k breaches its floor
    return `D${k} ${String(c[k]).padStart(3)} ${pct.toFixed(1)}% ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}pp${good ? '' : ' FAIL'}`;
  });
  pass('domain guard', ok, `n=${m.length}  ` + rows.join('  '));

  // Floor headroom on the tightest domain — the number that decides how much
  // more non-D4 content the pack can absorb.
  let tightest = null;
  for (const k of [1, 2, 3, 4, 5]) {
    const delta = c[k] / m.length * 100 - target[k];
    if (delta < 0 && (!tightest || delta < tightest.delta)) tightest = { k, delta, count: c[k] };
  }
  if (tightest) {
    let n = 0;
    while (tightest.count / (m.length + n + 1) * 100 - target[tightest.k] >= -tol[tightest.k]) n++;
    pass('floor headroom', true,
      `D${tightest.k} is tightest at ${tightest.delta.toFixed(1)}pp — ${n} more NON-D${tightest.k} items before it breaches`);
  }
}

// ── 2. Serialisation: every exemplar must be guard-countable ─────────────
// A space after the colon silently uncouples an entry from the guard.
{
  const bad = (src.match(/"objective":\s+"/g) || []).length;
  pass('compact form', bad === 0, bad === 0 ? 'no space-after-colon on objective' : `${bad} entries with a space after "objective":`);
}

// ── 3. multi-select key shape ─────────────────────────────────────────────
{
  const wrong = ALL.filter(e => e.type === 'multi-select' && !Array.isArray(e.answers));
  pass('multi-select shape', wrong.length === 0,
    wrong.length === 0 ? 'all multi-selects key answers[] (plural)' : `${wrong.length} multi-select(s) not keying answers[]`);
}

// ── 4. Answer key resolves to a real option ──────────────────────────────
{
  const broken = ALL.filter(e => {
    const keys = Array.isArray(e.answers) ? e.answers : [e.answer];
    return keys.some(k => !e.options || !e.options[k]);
  });
  pass('keys resolve', broken.length === 0,
    broken.length === 0 ? 'every answer key names an existing option' : `${broken.length} item(s) key a missing option`);
}

if (VERSION) {
  const mcq = NEW.filter(e => e.type === 'mcq');

  // ── 5. Length bias — the correct option must not be systematically longest
  {
    let longest = 0; const offenders = [];
    mcq.forEach((e, i) => {
      const lens = Object.values(e.options).map(v => v.length);
      const max = Math.max(...lens);
      const sole = e.options[e.answer].length === max && lens.filter(x => x === max).length === 1;
      if (sole) { longest++; offenders.push(`#${i + 1}(${(max / Math.max(...lens.filter(x => x < max))).toFixed(2)}x)`); }
    });
    const cap = Math.floor(mcq.length * 0.45);
    pass('length bias', longest <= cap,
      `correct-is-strictly-longest in ${longest} of ${mcq.length} (cap ${cap})` + (offenders.length ? ` — ${offenders.join(' ')}` : ''));
  }

  // ── 6. Letter spread ─────────────────────────────────────────────────────
  {
    const c = {};
    mcq.forEach(e => c[e.answer] = (c[e.answer] || 0) + 1);
    const counts = ['A', 'B', 'C', 'D'].map(k => c[k] || 0);
    const worst = Math.max(...counts), n = mcq.length;
    // no letter may carry more than half, and D must not be zero in a set of 4+
    const ok = worst <= Math.ceil(n / 2) && (n < 4 || (c.D || 0) > 0);
    pass('letter spread', ok, `A${counts[0]} B${counts[1]} C${counts[2]} D${counts[3]}` + (ok ? '' : ' — skewed, or D absent'));
  }

  // ── 7. Difficulty present and valid ──────────────────────────────────────
  {
    const valid = new Set(['Foundational', 'Exam Level', 'Hard']);
    const bad = NEW.filter(e => !valid.has(e.difficulty));
    const d = {}; NEW.forEach(e => d[e.difficulty] = (d[e.difficulty] || 0) + 1);
    pass('difficulty', bad.length === 0, JSON.stringify(d) + (bad.length ? ` — ${bad.length} invalid` : ''));
  }

  // ── 8. Metadata completeness ─────────────────────────────────────────────
  {
    const req = ['type', 'question', 'difficulty', 'topic', 'objective', 'options', 'explanation', 'source', 'addedVersion', 'addedDate'];
    const bad = NEW.filter(e => req.some(f => !e[f]));
    pass('metadata', bad.length === 0, bad.length === 0 ? `${NEW.length} new item(s), all fields present` : `${bad.length} item(s) missing fields`);
  }

  // ── 9. Topic exists in the catalog (drives the picker's exact-match tier)
  {
    const known = new Set(Object.keys(PACK.topicDomains || {}));
    const bad = [...new Set(NEW.map(e => e.topic))].filter(t => !known.has(t));
    pass('topic valid', bad.length === 0, bad.length === 0 ? 'all topics in topicDomains' : `unknown topic(s): ${bad.join(', ')}`);
  }

  // ── 10. House format — a rebuttal per distractor, and a closer ───────────
  {
    const bad = [];
    mcq.forEach((e, i) => {
      const distractors = Object.keys(e.options).filter(k => k !== e.answer);
      const missing = distractors.filter(k => !new RegExp(`\\(${k}\\)\\s*Wrong`, 'i').test(e.explanation));
      const closer = /Memory:|Exam clue:/.test(e.explanation);
      if (missing.length || !closer) bad.push(`#${i + 1}${missing.length ? ` no rebuttal for ${missing.join(',')}` : ''}${closer ? '' : ' no closer'}`);
    });
    pass('house format', bad.length === 0, bad.length === 0 ? 'per-distractor rebuttals + closer on all' : bad.join('; '));
  }

  // ── 11. Grounding heuristic — flag numbers/quoted names in the explanation
  //        that never appear in the stem or options. Catches the "radar
  //        designs" class of invented specific.
  {
    const bad = [];
    NEW.forEach((e, i) => {
      const stem = (e.question + ' ' + Object.values(e.options).join(' ')).toLowerCase();
      const caps = (e.explanation.match(/\b[A-Z][a-z]{3,}\b/g) || [])
        .filter(w => !/^(Wrong|Memory|Exam|The|This|That|Both|Neither|Note|Correct|Same|Every|When|Where|Which|What|Because|Since|While|After|Before|Their|There|These|Those|SY|CompTIA)$/.test(w))
        .filter(w => !stem.includes(w.toLowerCase()));
      if (caps.length) bad.push(`#${i + 1}: ${[...new Set(caps)].slice(0, 4).join(', ')}`);
    });
    pass('grounding (advisory)', true,
      bad.length === 0 ? 'no unexplained proper nouns in explanations' : `REVIEW: ${bad.join(' | ')}`);
  }

  // ── 12. Persona / prop collision across the WHOLE pack ──────────────────
  //        A rename once collided with the pack's canonical "David from IT".
  {
    const others = ALL.filter(e => e.addedVersion !== VERSION);
    const otherText = JSON.stringify(others);
    const names = new Set();
    NEW.forEach(e => (e.question.match(/\b[A-Z][a-z]{2,}\b/g) || [])
      .filter(w => !/^(A|An|The|Which|What|When|After|During|Before|Two|One|Incident|Wrong|Memory|Exam|Both|Neither|Security|Company|Attacker|Employee)$/.test(w))
      .forEach(w => names.add(w)));
    const collisions = [...names].filter(n => {
      const re = new RegExp(`\\b${n}\\b`, 'g');
      return (otherText.match(re) || []).length > 2;
    });
    pass('persona/prop reuse (advisory)', true,
      collisions.length === 0 ? 'no heavily-reused names or props' : `REVIEW heavy reuse: ${collisions.slice(0, 8).join(', ')}`);
  }

  // ── 13. Duplicate stems ─────────────────────────────────────────────────
  {
    const norm = s => s.toLowerCase().replace(/[^a-z ]/g, '').split(/\s+/).slice(0, 12).join(' ');
    const seen = new Map(); const dupes = [];
    ALL.forEach(e => {
      const k = norm(e.question);
      if (seen.has(k)) dupes.push(k.slice(0, 50)); else seen.set(k, 1);
    });
    pass('no duplicate stems', dupes.length === 0, dupes.length === 0 ? 'all stems distinct' : `${dupes.length} near-duplicate opening(s)`);
  }
}

// ── Report ────────────────────────────────────────────────────────────────
if (JSON_OUT) {
  console.log(JSON.stringify({ cert: CERT, version: VERSION, results }, null, 2));
} else {
  const W = 30;
  console.log(`\nExemplar gate — ${CERT}${VERSION ? ` @ v${VERSION} (${NEW.length} new)` : ''}\n${'═'.repeat(74)}`);
  results.forEach(r => console.log(`${r.ok ? ' \x1b[32mPASS\x1b[0m' : ' \x1b[31mFAIL\x1b[0m'}  ${r.name.padEnd(W)} ${r.detail}`));
  const failed = results.filter(r => !r.ok);
  console.log('═'.repeat(74));
  console.log(failed.length === 0
    ? '\x1b[32m✓ all gates pass\x1b[0m — advisory lines marked REVIEW still need a human read\n'
    : `\x1b[31m✗ ${failed.length} gate(s) failed\x1b[0m\n`);
}

process.exit(results.some(r => !r.ok) ? 1 : 0);
