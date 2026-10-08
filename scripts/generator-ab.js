#!/usr/bin/env node
// Generator A/B — sends the app's REAL question-writing prompts to several
// generator setups, then scores what comes back with the app's own parsing
// and the REAL Sonnet checker (aiValidateQuestions from app.js).
//
//   ANTHROPIC_API_KEY=… node scripts/generator-ab.js [runs]
//
// Prompts: scripts/generator-ab-prompts.json — captured from a local copy of
// the app (Security+, six quiz shapes incl. two attack-heavy topics) by
// intercepting _claudeFetch, so they are byte-identical to what quizzes send.
//
// Arms:
//   A  haiku-4.5 + the pre-v8.118 prompt (hard-coded Network+ identity) = today's prod
//   B  haiku-4.5 + the fixed cert-aware prompt
//   C  haiku-5.5 + fixed prompt, default effort (what a plain model swap sends)
//   D  haiku-5.5 + fixed prompt, effort "low" (needs a proxy change to ship)
//
// Per arm it reports: questions written vs requested, JSON failures, refusals,
// truncation, whether the app's current "first content block" read would have
// worked, Sonnet checker pass rate, Security+ objective validity, latency and
// real cost from the usage block. Full outputs go to
// scripts/generator-ab-results.json (gitignored) for side-by-side reading.
//
// Costs roughly $1.50 per run. Never commit a key; it is read from env.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error('Set ANTHROPIC_API_KEY in your shell first (never paste it into chat or commit it).'); process.exit(1); }
const RUNS = Math.max(1, parseInt(process.argv[2] || '1', 10) || 1);

const captured = JSON.parse(fs.readFileSync(path.join(__dirname, 'generator-ab-prompts.json'), 'utf8'));

// Rebuild the pre-v8.118 prompt from the fixed one (exact inverse of the edit).
const toOldPrompt = p => p
  .replace('You are a CompTIA Security+ SY0-701 exam question writer. You ONLY write questions that map to the official SY0-701 exam objectives. Never write questions about content outside the SY0-701 blueprint.',
           'You are a CompTIA Network+ N10-009 exam question writer. You ONLY write questions that map to the official N10-009 exam objectives. Never write questions about content outside the N10-009 blueprint.')
  .replace('MANDATORY SY0-701 OBJECTIVE TAGGING:', 'MANDATORY N10-009 OBJECTIVE TAGGING:')
  .replace(/- Valid objectives are 1\.1–1\.4 \(General Security Concepts\)[^\n]*/, '- Valid objectives are 1.1–1.8 (Concepts), 2.1–2.4 (Implementation), 3.1–3.5 (Operations), 4.1–4.5 (Security), 5.1–5.5 (Troubleshooting)')
  .replace('to a specific SY0-701 objective, do NOT write', 'to a specific N10-009 objective, do NOT write')
  .replace('reasoning through the technical concept.', 'reasoning through the networking concept.')
  .replace('This mirrors real SY0-701 exam framing', 'This mirrors real N10-009 exam framing');

const ARMS = [
  { id: 'A', label: 'Haiku 4.5 + old prompt (today)', model: 'claude-haiku-4-5-20251001', oldPrompt: true, price: { in: 1, out: 5 } },
  { id: 'B', label: 'Haiku 4.5 + fixed prompt', model: 'claude-haiku-4-5-20251001', price: { in: 1, out: 5 } },
  { id: 'C', label: 'Haiku 5.5 default effort', model: 'claude-haiku-5-5', price: { in: 0.10, out: 0.50 } },
  { id: 'D', label: 'Haiku 5.5 effort low', model: 'claude-haiku-5-5', extra: { output_config: { effort: 'low' } }, price: { in: 0.10, out: 0.50 } },
];
const SONNET = 'claude-sonnet-4-6';
const SONNET_PRICE = { in: 3, out: 15 };

// Security+ objective ranges (SY0-701): domain → highest sub-objective.
const SEC_MAX = { 1: 4, 2: 5, 3: 4, 4: 9, 5: 6 };
const objValid = o => { const m = /^([1-5])\.(\d+)$/.exec(String(o || '')); return !!m && +m[2] >= 1 && +m[2] <= SEC_MAX[m[1]]; };

// ── The real checker pipeline from app.js ──
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
function extractFunction(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start === -1) throw new Error('Could not find function ' + name);
  let depth = 0, i = src.indexOf('{', start);
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}
const checkerSrc = [extractFunction(appJs, '_claudeText'), extractFunction(appJs, '_parseValidatorVerdicts'), extractFunction(appJs, '_applyValidatorVerdicts'), 'async ' + extractFunction(appJs, 'aiValidateQuestions')].join('\n');
const chunkSize = parseInt((appJs.match(/const VALIDATOR_CHUNK_SIZE = (\d+)/) || [])[1] || '5', 10);
const valMax = parseInt((appJs.match(/const MAX_TOKENS_VALIDATION\s*=\s*(\d+)/) || [])[1] || '1000', 10);

async function callApi(body) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

async function sonnetCheck(questions) {
  const usage = { in: 0, out: 0 };
  const telemetry = [];
  const ctx = vm.createContext({
    getQType: q => q.type || 'mcq', Map, Object, String, Promise, JSON, Math,
    CERT_NAME_FULL: 'CompTIA Security+ SY0-701', CLAUDE_VALIDATOR_MODEL: SONNET, MAX_TOKENS_VALIDATION: valMax,
    VALIDATOR_CHUNK_SIZE: chunkSize, CURRENT_CERT: 'secplus',
    _logValidatorTelemetry: rows => telemetry.push(...rows),
    _claudeFetch: async init => {
      const b = JSON.parse(init.body);
      const res = await callApi({ model: b.model, max_tokens: b.max_tokens, messages: b.messages });
      if (res.data.usage) { usage.in += res.data.usage.input_tokens || 0; usage.out += res.data.usage.output_tokens || 0; }
      return { ok: res.ok, json: async () => res.data };
    },
  });
  vm.runInContext(checkerSrc, ctx);
  ctx.input = questions;
  const kept = await vm.runInContext('aiValidateQuestions("x", input)', ctx);
  const run = telemetry.find(r => r.type === 'telemetry:validator-run');
  const rejections = telemetry.filter(r => r.type === 'telemetry:validator').map(r => ({ verdict: r.fingerprint, reason: r.message, stem: r.extra.stem }));
  return { kept, stats: run ? run.extra : {}, rejections, usage };
}

function parseQuestions(text) {
  const m = String(text || '').match(/\[[\s\S]*\]/);
  if (!m) return { error: 'no JSON array' };
  try { const arr = JSON.parse(m[0]); return Array.isArray(arr) ? { questions: arr } : { error: 'not an array' }; }
  catch (e) { return { error: 'JSON.parse: ' + e.message.slice(0, 80) }; }
}

(async () => {
  const results = { ranAt: new Date().toISOString(), runs: RUNS, appVersionCaptured: captured.appVersion, arms: {} };
  console.log(`Generator A/B · ${captured.configs.length} real Sec+ prompts × ${ARMS.length} arms × ${RUNS} run(s) · checker ${SONNET}\n`);
  for (const arm of ARMS) {
    const agg = { requested: 0, written: 0, jsonFail: 0, refusals: 0, truncated: 0, firstBlockNotText: 0, httpErrors: [],
      checked: 0, passed: 0, objInvalid: 0, ms: [], genIn: 0, genOut: 0, valIn: 0, valOut: 0, samples: [], rejections: [] };
    for (let r = 0; r < RUNS; r++) {
      // The six prompts in an arm run concurrently; arms run one after another.
      const perConfig = await Promise.all(captured.configs.map(async c => {
        const out = { c, problems: [] };
        const prompt = arm.oldPrompt ? toOldPrompt(c.prompt) : c.prompt;
        const body = Object.assign({ model: arm.model, max_tokens: c.max_tokens, messages: [{ role: 'user', content: prompt }] }, arm.extra || {});
        const t0 = Date.now();
        const res = await callApi(body);
        out.ms = Date.now() - t0;
        if (!res.ok) { out.problems.push(`${c.id}: ${res.status} ${JSON.stringify(res.data.error || {}).slice(0, 160)}`); return out; }
        const d = res.data;
        out.usage = d.usage || {};
        if (d.stop_reason === 'refusal') { out.refusal = true; return out; }
        out.truncated = d.stop_reason === 'max_tokens';
        const blocks = d.content || [];
        out.firstBlockNotText = !blocks[0] || blocks[0].type !== 'text';
        const text = blocks.filter(b => b.type === 'text').map(b => b.text).join('\n');
        const parsed = parseQuestions(text);
        if (parsed.error) { out.jsonFail = true; out.problems.push(`${c.id}: ${parsed.error} (stop_reason ${d.stop_reason})`); return out; }
        out.qs = parsed.questions.filter(q => q && typeof q === 'object');
        out.check = await sonnetCheck(out.qs);
        return out;
      }));
      for (const o of perConfig) {
        agg.requested += o.c.n;
        agg.ms.push(o.ms);
        agg.httpErrors.push(...o.problems);
        if (o.usage) { agg.genIn += o.usage.input_tokens || 0; agg.genOut += o.usage.output_tokens || 0; }
        if (o.refusal) { agg.refusals++; continue; }
        if (o.truncated) agg.truncated++;
        if (o.firstBlockNotText) agg.firstBlockNotText++;
        if (o.jsonFail) agg.jsonFail++;
        if (!o.qs) continue;
        agg.written += o.qs.length;
        agg.objInvalid += o.qs.filter(q => !objValid(q.objective)).length;
        agg.valIn += o.check.usage.in; agg.valOut += o.check.usage.out;
        agg.checked += o.qs.filter(q => (q.type || 'mcq') === 'mcq' || q.type === 'multi-select').length;
        agg.passed += o.check.stats.kept || 0;
        agg.rejections.push(...o.check.rejections.map(x => Object.assign({ config: o.c.id }, x)));
        if (r === 0) agg.samples.push({ config: o.c.id, questions: o.qs, keptStems: o.check.kept.map(q => q.question) });
      }
    }
    const genCost = (agg.genIn * arm.price.in + agg.genOut * arm.price.out) / 1e6;
    const valCost = (agg.valIn * SONNET_PRICE.in + agg.valOut * SONNET_PRICE.out) / 1e6;
    const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
    results.arms[arm.id] = Object.assign({ label: arm.label, model: arm.model, genCost, valCost }, agg);
    const perQ = agg.passed ? (genCost + valCost) / agg.passed : 0;
    console.log(`${arm.id} · ${arm.label}`);
    console.log(`  written / requested:        ${agg.written}/${agg.requested}`);
    console.log(`  passed Sonnet checker:      ${agg.passed}/${agg.checked} = ${agg.checked ? (100 * agg.passed / agg.checked).toFixed(1) : '0'}%`);
    console.log(`  bad Sec+ objective tags:    ${agg.objInvalid}/${agg.written}`);
    console.log(`  JSON failures / refusals / cut off: ${agg.jsonFail} / ${agg.refusals} / ${agg.truncated}`);
    console.log(`  reply didn't start with text (would break today's app): ${agg.firstBlockNotText}`);
    console.log(`  median generation time:    ${(med(agg.ms) / 1000).toFixed(1)}s`);
    console.log(`  cost: writing $${genCost.toFixed(3)} + checking $${valCost.toFixed(3)} · per usable question $${perQ.toFixed(4)}`);
    if (agg.httpErrors.length) console.log(`  problems: ${agg.httpErrors.slice(0, 3).join(' | ')}`);
    console.log('');
  }
  const out = path.join(__dirname, 'generator-ab-results.json');
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`Full outputs saved to ${path.relative(ROOT, out)} — tell Claude it's done.`);
})().catch(e => { console.error(e); process.exit(1); });
