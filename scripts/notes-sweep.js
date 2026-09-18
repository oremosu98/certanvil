#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// Notes sweep — the deterministic half of the study-notes → exemplars pipeline
// ══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS (2026-09-18)
//
// The founder studies Sec+ daily and writes it up in Notion. Telling an agent
// what changed each time is friction he will not sustain, so the pipeline has
// to work it out for itself. This script is the part that can be computed:
// what is new, what the pack already teaches, and what the pack has room for.
//
// It does NOT talk to Notion — that needs the MCP connector, which only exists
// inside a Claude session. The session saves the pages to disk, then runs this.
// See .claude/skills/secplus-sweep/SKILL.md for the orchestration around it.
//
// THE RULE THIS ENCODES: the queue is ordered by what the PACK needs, not by
// what was studied most recently. Adding items to an over-target domain makes
// an under-target domain's deficit worse (the denominator grows), so "author
// everything he wrote" actively degrades the bank. Selection is the product.
//
// USAGE
//   node scripts/notes-sweep.js --cert secplus \
//     --notes <file.md> [--notes <file2.md>] [--json] [--commit]
//
//   --commit   write the updated manifest back (otherwise it is a dry run)
//
// Exits 0 always; this is a reporting tool, not a gate.
// ══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

// ── args ──────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
function flag(name, def) {
  const i = argv.indexOf('--' + name);
  return i === -1 ? def : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true);
}
function flagAll(name) {
  const out = [];
  argv.forEach((a, i) => { if (a === '--' + name && argv[i + 1]) out.push(argv[i + 1]); });
  return out;
}
const CERT = flag('cert', 'secplus');
const NOTES = flagAll('notes');
const AS_JSON = argv.includes('--json');
const COMMIT = argv.includes('--commit');
const MANIFEST = path.join(ROOT, 'docs/research', `${CERT}-notes-manifest.json`);
const DOMAIN_MAP_FILE = path.join(ROOT, 'docs/research', `${CERT}-topic-domain-map.json`);
// Explicit, human-owned. A section absent from it is reported UNMAPPED, never
// guessed — see the _why note in that file for what guessing cost us.
const DOMAIN_MAP = fs.existsSync(DOMAIN_MAP_FILE)
  ? JSON.parse(fs.readFileSync(DOMAIN_MAP_FILE, 'utf8')).map : {};

if (!NOTES.length) {
  console.error('notes-sweep: need at least one --notes <file.md>');
  console.error('  (a Claude session saves the Notion pages to disk first — see the secplus-sweep skill)');
  process.exit(0);
}

// ── the pack ──────────────────────────────────────────────────────────────
const packSrc = fs.readFileSync(path.join(ROOT, 'certs', `${CERT}.js`), 'utf8');
const sandbox = { window: {} };
new vm.Script(packSrc).runInNewContext(sandbox);
const PACK = sandbox.window.CERT_PACKS[CERT];
const EXEMPLARS = PACK.questionExemplars || [];
const RETENTION = PACK.retentionGapConcepts || [];

// ── domain headroom (mirrors the guard in tests/uat/120 exactly) ──────────
// The guard counts the compact JSON form by regex, so we do too — a count
// derived any other way can disagree with CI, which is the number that bites.
const TARGET = { 1: 12, 2: 22, 3: 18, 4: 28, 5: 20 };
const TOLERANCE = { 1: 19, 2: 10, 3: 10, 4: 10, 5: 10 };

function domainState() {
  const matches = packSrc.match(/"objective":"(\d+)\.\d+"/g) || [];
  const count = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const m of matches) count[m.match(/"objective":"(\d+)\./)[1]]++;
  const total = matches.length;
  const state = {};
  for (const d of [1, 2, 3, 4, 5]) {
    const pct = (count[d] / total) * 100;
    const floor = TARGET[d] - TOLERANCE[d];
    const ceil = TARGET[d] + TOLERANCE[d];
    // How many items can this domain absorb before IT breaches its own ceiling?
    // (n + c) / (n + total) <= ceil/100  →  solve for n.
    const c = count[d], t = total, k = ceil / 100;
    const absorb = k >= 1 ? Infinity : Math.floor((k * t - c) / (1 - k));
    // How many NON-domain items can land before this domain breaches its floor?
    const kf = floor / 100;
    const budget = kf <= 0 ? Infinity : Math.floor(c / kf - t);
    state[d] = { count: c, pct, delta: pct - TARGET[d], floor, ceil, absorb, nonDomainBudget: budget };
  }
  return { total, state };
}

// ── is a concept KEYED, not merely mentioned? ─────────────────────────────
// The distinction that matters: a term appearing in a distractor teaches
// nothing. It has to be the correct answer somewhere to count as covered.
function keyedCount(term) {
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  let mentions = 0, keyed = 0;
  for (const e of EXEMPLARS) {
    if (re.test(JSON.stringify(e))) mentions++;
    const keys = Array.isArray(e.answers) ? e.answers : [e.answer];
    if (keys.some(k => re.test((e.options && e.options[k]) || ''))) keyed++;
  }
  const inRetention = RETENTION.some(r => re.test(JSON.stringify(r)));
  return { mentions, keyed, inRetention };
}

// ── parse notes into ### sections under ## domain headings ───────────────
const STOP = new Set(['the','and','for','you','not','but','with','that','this','from','are','its',
  'one','two','all','can','has','was','who','why','how','what','when','vs','or','a','an','is','it',
  'exam','clue','memory','note','notes','key','tip','watch','out','same','only','never','always']);

// Simi's notes use a consistent scaffold — "One line memory", "Common exam traps",
// "The full process". Those are furniture, not concepts, and they polluted the very
// first queue badly enough to make it untrustworthy. Drop anything that reads as
// structure rather than subject matter.
const FURNITURE = /^(the|one|two|three|four|five|a|an)\b.*\b(process|version|line|memory|distinction|distinctions|goals?|roles?|flow|traps?|steps?|way|ways|rule|rules|point|points|takeaway|idea|thing|things)\b|^(one line|exam|common|key|quick|full|short|in short|worth|watch|remember|note)\b|\b(exam (clue|trap|traps|scenario|scenarios|mapping|angle|angles)|memory (hook|aid|device)|mnemonic|cheat sheet|recap|summary)\b/i;

function parseSections(md, source) {
  const lines = md.split('\n');
  const out = [];
  let domain = null, cur = null;
  for (const ln of lines) {
    const d = ln.match(/^##\s+Domain\s+(\d)/i);
    if (d) { domain = d[1]; continue; }
    const h = ln.match(/^###\s+(.+?)\s*$/);
    if (h) {
      if (cur) out.push(cur);
      const title = h[1].trim();
      // "### Backups (3.4)" — an explicit objective wins over inference
      const objM = title.match(/\((\d\.\d+)\)\s*$/);
      const clean = title.replace(/\s*\(\d\.\d+\)\s*$/, '');
      // Precedence: an explicit (N.M) in the heading > the curated map > nothing.
      // The enclosing '## Domain N' heading is deliberately NOT a fallback: Part 2
      // carries one at the top and 60+ unrelated sections beneath it.
      const mapped = DOMAIN_MAP[clean];
      cur = {
        source,
        title: clean,
        domain: objM ? objM[1].split('.')[0] : (mapped ? String(mapped) : null),
        domainSource: objM ? 'heading' : (mapped ? 'map' : null),
        noteDomain: domain,
        objective: objM ? objM[1] : null,
        body: [],
      };
      continue;
    }
    if (cur) cur.body.push(ln);
  }
  if (cur) out.push(cur);
  return out.map(s => {
    const body = s.body.join('\n').trim();
    return {
      ...s,
      body: undefined,
      chars: body.length,
      hash: crypto.createHash('sha1').update(body).digest('hex').slice(0, 12),
      concepts: extractConcepts(body),
    };
  });
}

// Candidate concepts = the things the notes emphasise. Bolded phrases and
// acronyms are what Simi actually bolds when a term matters; this is a
// heuristic on purpose — the session judges, this only shortlists.
function extractConcepts(body) {
  const set = new Set();
  for (const m of body.matchAll(/\*\*(.+?)\*\*/g)) {
    const t = m[1].replace(/[—:·|]/g, ' ').replace(/\s+/g, ' ').trim();
    if (t.length >= 3 && t.length <= 40 && !STOP.has(t.toLowerCase()) && !FURNITURE.test(t)) set.add(t);
  }
  for (const m of body.matchAll(/\b([A-Z][A-Z0-9-]{1,7})\b/g)) {
    if (!STOP.has(m[1].toLowerCase())) set.add(m[1]);
  }
  return [...set].slice(0, 60);
}

// ── manifest ──────────────────────────────────────────────────────────────
function loadManifest() {
  if (!fs.existsSync(MANIFEST)) {
    return { cert: CERT, updated: null, note: 'Seeded on first run. status: pending|queued|shipped|redundant|overflow', sections: {} };
  }
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
}

// ══ main ══════════════════════════════════════════════════════════════════
const { total, state } = domainState();
const manifest = loadManifest();

let sections = [];
for (const f of NOTES) {
  if (!fs.existsSync(f)) { console.error('notes-sweep: missing notes file ' + f); continue; }
  sections = sections.concat(parseSections(fs.readFileSync(f, 'utf8'), path.basename(f)));
}

const report = [];
for (const s of sections) {
  const key = `${s.domain || '?'}|${s.title}`;
  const prev = manifest.sections[key];
  const changed = !prev || prev.hash !== s.hash;
  const settled = prev && ['shipped', 'redundant'].includes(prev.status) && !changed;

  // Measure the gap only for things still in play — settled sections are skipped
  // so a sweep stays cheap as the notes grow.
  let unkeyed = [], keyedAlready = 0;
  if (!settled) {
    for (const c of s.concepts) {
      const k = keyedCount(c);
      if (k.keyed > 0) keyedAlready++;
      else if (!k.inRetention) unkeyed.push(c);
    }
  }

  const unmapped = !s.domain;
  const d = s.domain && state[s.domain] ? state[s.domain] : null;
  const canExemplar = d ? d.absorb > 0 : false;
  // Score: what the pack needs × how much this section adds × exam weight.
  // Deliberately NOT weighted by recency — study order must not drive the queue.
  const deficit = d ? Math.max(0, -d.delta) : 0;
  const score = settled || unmapped ? 0
    : Math.round(unkeyed.length * (1 + deficit) * (d ? TARGET[s.domain] / 10 : 1) * (canExemplar ? 1 : 0.35));

  report.push({
    key, title: s.title, source: s.source, domain: s.domain, objective: s.objective,
    chars: s.chars, hash: s.hash,
    status: unmapped ? 'unmapped' : (settled ? prev.status : (prev && !changed ? prev.status : (prev ? 'changed' : 'new'))),
    unmapped, domainSource: s.domainSource, noteDomain: s.noteDomain,
    unkeyed: unkeyed.length, unkeyedSample: unkeyed.slice(0, 10), keyedAlready,
    route: unmapped ? 'unmapped' : (settled ? prev.status : (unkeyed.length === 0 ? 'redundant' : (canExemplar ? 'exemplar' : 'overflow'))),
    score,
  });

  manifest.sections[key] = {
    hash: s.hash, domain: s.domain, objective: s.objective,
    status: prev && settled ? prev.status : (unkeyed.length === 0 ? 'redundant' : (prev && prev.status === 'shipped' && !changed ? 'shipped' : 'pending')),
    lastSeen: new Date().toISOString().slice(0, 10),
  };
}

report.sort((a, b) => b.score - a.score);

if (COMMIT) {
  manifest.updated = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}

if (AS_JSON) {
  console.log(JSON.stringify({ total, domains: state, queue: report }, null, 2));
  process.exit(0);
}

const C = { g: '\x1b[32m', y: '\x1b[33m', r: '\x1b[31m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' };
console.log(`${C.b}Notes sweep — ${CERT}${C.x}`);
console.log('═'.repeat(74));
console.log(`${C.b}Pack capacity${C.x}  (${total} exemplars)`);
for (const d of [1, 2, 3, 4, 5]) {
  const s = state[d];
  const room = s.absorb === Infinity ? 'unbounded' : `${s.absorb} more`;
  const col = s.absorb <= 0 ? C.r : (s.absorb < 12 ? C.y : C.g);
  console.log(`  D${d}  ${String(s.count).padStart(3)}  ${s.pct.toFixed(1).padStart(5)}%  ` +
    `${(s.delta >= 0 ? '+' : '') + s.delta.toFixed(1).padStart(5)}pp   ${col}room: ${room}${C.x}`);
}
const tightest = [1, 2, 3, 4, 5].map(d => [d, state[d].nonDomainBudget])
  .filter(([, b]) => b !== Infinity).sort((a, b) => a[1] - b[1])[0];
if (tightest) console.log(`  ${C.d}tightest floor: D${tightest[0]} — ${tightest[1]} more non-D${tightest[0]} items before it breaches${C.x}`);

// 'pending' matters as much as 'new': a section seen by an earlier sweep but never
// authored is still outstanding work. Only 'shipped' and 'redundant' leave the queue.
const fresh = report.filter(r => ['new', 'changed', 'pending'].includes(r.status) && r.score > 0);
const redundant = report.filter(r => r.route === 'redundant').length;
const overflow = report.filter(r => r.route === 'overflow' && r.score > 0);

console.log(`\n${C.b}New or changed since last sweep${C.x}: ${fresh.length}   ` +
  `${C.d}(already-covered: ${redundant} · settled: ${report.filter(r => r.score === 0).length})${C.x}`);

if (!fresh.length) {
  console.log(`\n${C.g}Nothing new worth authoring.${C.x}`);
} else {
  console.log(`\n${C.b}Queue — ranked by what the pack needs, not by study order${C.x}`);
  for (const r of fresh.slice(0, 12)) {
    const tag = r.route === 'exemplar' ? `${C.g}exemplar${C.x}` : `${C.y}overflow→retention${C.x}`;
    console.log(`  ${String(r.score).padStart(4)}  D${r.domain || '?'}${r.objective ? ' ' + r.objective : '   '}  ${tag}  ${C.b}${r.title}${C.x}`);
    console.log(`        ${C.d}${r.unkeyed} unkeyed · ${r.keyedAlready} already covered · ${r.unkeyedSample.slice(0, 6).join(', ')}${C.x}`);
  }
  if (fresh.length > 12) console.log(`  ${C.d}… and ${fresh.length - 12} more${C.x}`);
}
const unmappedRows = report.filter(r => r.unmapped);
if (unmappedRows.length) {
  console.log(`\n${C.y}${C.b}${unmappedRows.length} section(s) not in the domain map — NOT queued, not guessed${C.x}`);
  for (const r of unmappedRows.slice(0, 15)) console.log(`  ${C.y}?${C.x}  ${r.title}  ${C.d}(${r.source})${C.x}`);
  console.log(`  ${C.d}add them to docs/research/${CERT}-topic-domain-map.json to bring them into the queue${C.x}`);
}
if (overflow.length) {
  console.log(`\n${C.d}${overflow.length} section(s) route to retention concepts — their domain is at ceiling.${C.x}`);
}
console.log(`\n${COMMIT ? 'Manifest written to' : 'DRY RUN — rerun with --commit to record.'} ${COMMIT ? path.relative(ROOT, MANIFEST) : ''}`);
