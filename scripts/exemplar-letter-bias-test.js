#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// Exemplar answer-letter bias — controlled A/B test
// ══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS (2026-08-22)
//
// Every cert pack's curated exemplar bank is heavily skewed in which option
// letter is correct. Pooled across all eight packs (n=1664): A 37.0%,
// B 44.2%, C 16.3%, D 2.4%. Under a uniform expectation that is chi-square
// 732 against a p=0.001 critical value of 16.3. aplus-core1 has D correct in
// 0 of 189; sc900 has A correct in 3.0% and B in 73.2%.
//
// `_formatExemplarsForPrompt` emits `Answer: <letter>` for each exemplar, so
// the generator sees those letters. The generation prompt separately tells it
// to "Vary the correct answer letter across questions". Whether the explicit
// instruction beats the implicit few-shot pattern is an empirical question,
// and it is the ONLY thing that decides whether the bank needs rebalancing.
//
// This script answers it with a controlled A/B: identical prompts, identical
// model, differing ONLY in whether the exemplar block is present. If arm B
// (with exemplars) skews toward A/B and arm A (without) does not, the
// exemplars are causing it. If both arms look the same, the bank is not the
// cause and the exemplars should be left alone.
//
// USAGE
//   ANTHROPIC_API_KEY=sk-ant-... node scripts/exemplar-letter-bias-test.js
//   ANTHROPIC_API_KEY=sk-ant-... node scripts/exemplar-letter-bias-test.js --batches 6 --cert secplus
//
// COST: ~$0.02-0.05 total on Haiku at the default 4 batches x 10 questions
// x 2 arms. Nothing is written to the repo and no app state is touched.
// ══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODEL = 'claude-haiku-4-5-20251001';   // must match CLAUDE_MODEL in app.js

const args = process.argv.slice(2);
const argVal = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : dflt;
};
const CERT = argVal('--cert', 'secplus');
const BATCHES = parseInt(argVal('--batches', '4'), 10);
const PER_BATCH = parseInt(argVal('--n', '10'), 10);

const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) {
  console.error('\x1b[31mANTHROPIC_API_KEY is not set.\x1b[0m');
  console.error('Run: ANTHROPIC_API_KEY=sk-ant-... node scripts/exemplar-letter-bias-test.js');
  process.exit(1);
}

// ── Load the cert pack the same way the browser does ──────────────────────
const packSrc = fs.readFileSync(path.join(ROOT, 'certs', `${CERT}.js`), 'utf8');
const sandbox = { window: {} };
new (require('vm').Script)(packSrc).runInNewContext(sandbox);
const PACK = sandbox.window.CERT_PACKS[CERT];
if (!PACK) { console.error(`Could not load CERT_PACKS.${CERT}`); process.exit(1); }

const EXEMPLARS = PACK.questionExemplars || [];
const CERT_CODE = PACK.meta.code;

// ── Baseline: what the bank itself looks like ─────────────────────────────
const bankDist = {};
EXEMPLARS.forEach(ex => {
  if (ex.type === 'multi-select') return;
  if (typeof ex.answer === 'string') bankDist[ex.answer] = (bankDist[ex.answer] || 0) + 1;
});

// ── Reproduce _formatExemplarsForPrompt exactly (app.js) ──────────────────
function formatExemplars(exemplars) {
  if (!Array.isArray(exemplars) || exemplars.length === 0) return '';
  const blocks = exemplars.map((ex, i) => {
    const opts = (ex && ex.options) || {};
    const answerText = Array.isArray(ex.answers) ? ex.answers.join(', ')
      : Array.isArray(ex.answer) ? ex.answer.join(', ')
      : (ex.answer || '');
    const optLines = ['A', 'B', 'C', 'D', 'E', 'F']
      .filter(k => opts[k]).map(k => `${k}) ${opts[k]}`);
    return [
      `EXEMPLAR ${i + 1}:`,
      `Question: ${ex.question || ''}`,
      ex.scenario ? `Scenario: ${ex.scenario}` : null,
      ex.type === 'multi-select' ? 'Type: multi-select (more than one correct answer)' : null
    ].concat(optLines).concat([
      `Answer: ${answerText}`,
      `Explanation: ${ex.explanation || ''}`
    ]).filter(Boolean).join('\n');
  }).join('\n\n');
  return `
QUALITY REFERENCE — use these curated exemplars as the bar for stem clarity,
distractor plausibility (every option must be tempting, not throwaways),
explanation depth, and ${CERT_CODE} framing. DO NOT copy these exemplars into your
output — they are style references only. Write NEW questions of equal quality:

${blocks}
`;
}

// Same tiering as _pickExemplarsForTopic: exact topic first, shuffled, slice 3.
function pickExemplars(topic, max = 3) {
  const shuffled = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const exact = EXEMPLARS.filter(e => e && e.topic === topic);
  const others = EXEMPLARS.filter(e => e && e.topic !== topic);
  return shuffled(exact).concat(shuffled(others)).slice(0, max);
}

// ── The generation prompt, matching app.js's rules block ──────────────────
function buildPrompt(topic, exemplarBlock, n) {
  return `You are a CompTIA ${CERT_CODE} exam question writer. You ONLY write questions that map to the official ${CERT_CODE} exam objectives.

Topic: ${topic}
Difficulty: Exam Level
${exemplarBlock}
Generate exactly ${n} multiple choice questions. Requirements:
- 4 options each: A, B, C, D
- One correct answer only
- Distractors must be plausible - never obviously wrong
- Vary the correct answer letter across questions
- Each explanation must state WHY the answer is correct AND briefly why the main wrong option is wrong (2-3 sentences max)
- No repeated questions

Return ONLY a JSON array, no prose. Each element:
{"question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"B","explanation":"..."}`;
}

async function generate(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 8000, messages: [{ role: 'user', content: prompt }] })
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = (data.content || []).map(b => b.text || '').join('');
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('no JSON array in response');
  return JSON.parse(m[0]);
}

const TOPICS = Object.keys(PACK.topicDomains || {}).slice(0, BATCHES);

function tally(qs, into) { qs.forEach(q => { if (q && typeof q.answer === 'string') into[q.answer] = (into[q.answer] || 0) + 1; }); }
function pct(c) { const n = Object.values(c).reduce((a, b) => a + b, 0) || 1; return ['A', 'B', 'C', 'D'].map(k => `${k} ${((c[k] || 0) / n * 100).toFixed(1)}%`).join('  '); }
function chi(c) { const n = Object.values(c).reduce((a, b) => a + b, 0); if (!n) return 0; const e = n / 4; return ['A', 'B', 'C', 'D'].reduce((s, k) => s + Math.pow((c[k] || 0) - e, 2) / e, 0); }

(async () => {
  console.log(`\nExemplar answer-letter bias — controlled A/B\n${'='.repeat(66)}`);
  console.log(`cert ${CERT} (${CERT_CODE}) · model ${MODEL}`);
  console.log(`${BATCHES} topics x ${PER_BATCH} questions x 2 arms = ${BATCHES * PER_BATCH * 2} questions\n`);
  console.log(`BANK BASELINE (n=${Object.values(bankDist).reduce((a, b) => a + b, 0)}):  ${pct(bankDist)}`);
  console.log(`  chi-square vs uniform: ${chi(bankDist).toFixed(1)}  (critical at p=0.001 is 16.3)\n`);

  const withEx = {}, without = {};
  for (const topic of TOPICS) {
    process.stdout.write(`  ${topic.slice(0, 38).padEnd(40)}`);
    try {
      const a = await generate(buildPrompt(topic, '', PER_BATCH));
      tally(a, without); process.stdout.write('control ok  ');
      const b = await generate(buildPrompt(topic, formatExemplars(pickExemplars(topic)), PER_BATCH));
      tally(b, withEx); process.stdout.write('exemplars ok\n');
    } catch (e) { process.stdout.write(`FAILED: ${e.message}\n`); }
  }

  const nW = Object.values(withEx).reduce((a, b) => a + b, 0);
  const nO = Object.values(without).reduce((a, b) => a + b, 0);
  console.log(`\n${'='.repeat(66)}\nRESULTS\n`);
  console.log(`  arm A — NO exemplars   (n=${nO}):  ${pct(without)}   chi2 ${chi(without).toFixed(1)}`);
  console.log(`  arm B — WITH exemplars (n=${nW}):  ${pct(withEx)}   chi2 ${chi(withEx).toFixed(1)}`);
  console.log(`  the bank itself:                 ${pct(bankDist)}   chi2 ${chi(bankDist).toFixed(1)}`);

  const dW = (withEx.D || 0) / (nW || 1), dO = (without.D || 0) / (nO || 1);
  console.log(`\n  D-rate with exemplars: ${(dW * 100).toFixed(1)}%   without: ${(dO * 100).toFixed(1)}%   uniform: 25.0%`);
  console.log(`\nVERDICT`);
  if (chi(withEx) > 16.3 && chi(withEx) > chi(without) * 1.5) {
    console.log(`  Exemplars ARE driving the skew — arm B is materially more skewed than arm A.`);
    console.log(`  Rebalancing the bank is justified.`);
  } else if (chi(withEx) > 16.3 && chi(without) > 16.3) {
    console.log(`  BOTH arms are skewed. The model skews on its own; the exemplars are not`);
    console.log(`  the cause. Rebalancing the bank will NOT fix this — the fix belongs in the`);
    console.log(`  prompt or in a post-generation shuffle. Do not churn the bank.`);
  } else {
    console.log(`  Generated output is acceptably distributed. The bank's skew is NOT reaching`);
    console.log(`  users. Close this as a non-issue and leave the exemplars alone.`);
  }
  console.log('');
})();
