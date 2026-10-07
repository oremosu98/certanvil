#!/usr/bin/env node
// Validator A/B — runs the REAL aiValidateQuestions pipeline from app.js
// (prompt, chunking, retry, parser, verdict application) against two models
// and reports how each one judges a fixed question set.
//
//   ANTHROPIC_API_KEY=… node scripts/validator-ab.js [modelA] [modelB|-] [runs]
//   (pass "-" as modelB to test one model only)
//
// Defaults: claude-sonnet-4-6 vs claude-sonnet-5-5, 2 runs each.
//
// Question sets:
//   broken — the 17 shouldBeCaught items from tests/validation-audit.js (Net+)
//            + 6 hand-made broken Sec+ items below. Caught = removed or re-keyed.
//   good   — the 6 shouldBeCaught:false audit items + 24 random Sec+ curated
//            exemplars. False positive = removed or re-keyed.
// Also reports format compliance (questions with no parseable verdict) and
// wall-clock latency, so it doubles as the pre-ship check that a model follows
// the v8.116.0 reason-first line format.
//
// Costs a few cents per run. Never commit a key; the script reads it from env.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error('Set ANTHROPIC_API_KEY in your shell first (never paste it into chat or commit it).'); process.exit(1); }

const [modelA = 'claude-sonnet-4-6', modelB = 'claude-sonnet-5-5', runsArg = '2'] = process.argv.slice(2);
const RUNS = Math.max(1, parseInt(runsArg, 10) || 1);

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
const pipelineSrc = [
  extractFunction(appJs, '_parseValidatorVerdicts'),
  extractFunction(appJs, '_applyValidatorVerdicts'),
  'async ' + extractFunction(appJs, 'aiValidateQuestions'),
].join('\n');
const chunkSize = parseInt((appJs.match(/const VALIDATOR_CHUNK_SIZE = (\d+)/) || [])[1] || '5', 10);
const maxTokens = parseInt((appJs.match(/const MAX_TOKENS_VALIDATION\s*=\s*(\d+)/) || [])[1] || '1000', 10);

// ── Question sets ──
const auditSrc = fs.readFileSync(path.join(ROOT, 'tests', 'validation-audit.js'), 'utf8');
const cStart = auditSrc.indexOf('const corpus = [');
const cEnd = auditSrc.indexOf('\n];', cStart);
const corpus = vm.runInNewContext('(' + auditSrc.slice(cStart + 'const corpus = '.length, cEnd + 2) + ')');
const netBroken = corpus.filter(c => c.shouldBeCaught).map(c => c.q);
const netGood = corpus.filter(c => !c.shouldBeCaught).map(c => c.q);

const secBroken = [
  { type: 'multi-select', question: '(Choose TWO) Which of the following are valid mitigation techniques for preventing phishing attacks within an organization?',
    options: { A: 'Implementing DMARC, SPF and DKIM to reject spoofed inbound email', B: 'Deploying a DNS sinkhole for malware C2 traffic', C: 'Requiring out-of-band verification of payment or account changes using pre-registered contact details', D: 'Blocking all incoming email attachments', E: 'Installing a honeypot on the internal network' },
    answers: ['A', 'C'], explanation: 'DMARC/SPF/DKIM stop spoofing; out-of-band verification stops BEC payment fraud.', topic: 'Social Engineering', objective: '2.2' },
  { type: 'mcq', question: 'A company has already enabled full-disk encryption on every laptop. Which control protects data on a lost laptop that is powered off?',
    options: { A: 'Remote wipe', B: 'Full-disk encryption is not enabled, so enable it', C: 'Full-disk encryption', D: 'Screen lock timeout' },
    answer: 'B', explanation: 'Because full-disk encryption is not enabled, the company must enable it first.', topic: 'Data Protection', objective: '3.3' },
  { type: 'mcq', question: 'Which protocol uses TCP port 3389 by default?',
    options: { A: 'SSH', B: 'RDP', C: 'SMB', D: 'LDAPS' },
    answer: 'A', explanation: 'RDP (Remote Desktop Protocol) listens on TCP 3389 by default; SSH uses 22, SMB 445, LDAPS 636.', topic: 'Network Security Architecture', objective: '3.2' },
  { type: 'mcq', question: 'Which access control model assigns permissions based on a user\'s job function?',
    options: { A: 'Mandatory access control', B: 'Role-based access control', C: 'Discretionary access control', D: 'Rule-based access control' },
    answer: 'A', explanation: 'Role-based access control assigns permissions according to job roles, so users in the same role get the same access.', topic: 'Identity & Access Management', objective: '4.6' },
  { type: 'multi-select', question: '(Choose TWO) Which of the following are asymmetric encryption algorithms?',
    options: { A: 'RSA', B: 'AES', C: 'ECC', D: 'Diffie-Hellman', E: 'SHA-256' },
    answers: ['A', 'C'], explanation: 'RSA and ECC are asymmetric. AES is symmetric and SHA-256 is a hash.', topic: 'Cryptography Fundamentals', objective: '1.4' },
  { type: 'mcq', question: 'What is the PRIMARY purpose of a hashing algorithm?',
    options: { A: 'Verify integrity', B: 'Provide confidentiality by encrypting data reversibly', C: 'Exchange keys', D: 'Authenticate users with certificates' },
    answer: 'B', explanation: 'Hashing produces a fixed-length digest used to verify integrity; it is one-way and not reversible.', topic: 'Cryptography Fundamentals', objective: '1.4' },
];
// Why each Sec+ item is broken: [0] needs an unstated BEC scenario (check 8),
// [1] answer contradicts the stem's premise, [2]/[3]/[5] explanation backs a
// different letter, [4] distractor leak (Diffie-Hellman is also asymmetric).

global.window = global;
require(path.join(ROOT, 'certs', 'secplus.js'));
const secPack = window.CERT_PACKS && window.CERT_PACKS.secplus;
const exemplars = (secPack.questionExemplars || []).filter(e => e && (e.type === 'mcq' || e.type === 'multi-select') && !e.pbqArchetype);
const shuffled = exemplars.slice().sort(() => Math.random() - 0.5);
const secGood = shuffled.slice(0, 24).map(e => JSON.parse(JSON.stringify(e)));

// ── Runner ──
function makeCtx(model, certName, sink) {
  const ctx = vm.createContext({
    getQType: q => q.type || 'mcq', Map, Object, String, Promise, JSON, Math,
    CERT_NAME_FULL: certName, CLAUDE_VALIDATOR_MODEL: model, MAX_TOKENS_VALIDATION: maxTokens,
    VALIDATOR_CHUNK_SIZE: chunkSize, CURRENT_CERT: 'ab',
    _logValidatorTelemetry: rows => sink.push(...rows),
    _claudeFetch: async init => {
      const body = JSON.parse(init.body);
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: body.model, max_tokens: body.max_tokens, messages: body.messages }),
      });
      if (!r.ok) { sink.push({ type: 'http-error', message: r.status + ' ' + (await r.clone().text()).slice(0, 200) }); return r; }
      // Keep any reply the parser can't fully read, so format drift is visible.
      try {
        const text = ((await r.clone().json()).content || [])[0]?.text || '';
        const expected = (body.messages[0].content.match(/^Q\d+( \[MULTI-SELECT\])?: "/gm) || []).length;
        const got = Object.keys(ctx._parseValidatorVerdicts(text)).length;
        if (got < expected) sink.push({ type: 'raw-miss', message: `parsed ${got}/${expected}`, text });
      } catch (_) {}
      return r;
    },
  });
  vm.runInContext(pipelineSrc, ctx);
  return ctx;
}

async function judge(model, qs, certName) {
  const sink = [];
  const ctx = makeCtx(model, certName, sink);
  const copies = qs.map(q => JSON.parse(JSON.stringify(q)));
  const originals = copies.map(q => q.type === 'multi-select' ? q.answers.join(',') : q.answer);
  ctx.input = copies;
  const t0 = Date.now();
  const kept = await vm.runInContext('aiValidateQuestions("x", input)', ctx);
  const ms = Date.now() - t0;
  const keptSet = new Set(kept);
  let removed = 0, rekeyed = 0;
  copies.forEach((q, i) => {
    if (!keptSet.has(q)) removed++;
    else if ((q.type === 'multi-select' ? q.answers.join(',') : q.answer) !== originals[i]) rekeyed++;
  });
  const run = sink.find(r => r.type === 'telemetry:validator-run');
  const unverified = run ? run.extra.unverified : 0;
  removed -= unverified;  // unreadable ≠ judged: report it separately, never as a catch
  const httpErrors = sink.filter(r => r.type === 'http-error').map(r => r.message);
  const reasons = sink.filter(r => r.type === 'telemetry:validator').map(r => `${r.fingerprint} — ${r.message} — "${r.extra.stem.slice(0, 70)}"`);
  const rawMisses = sink.filter(r => r.type === 'raw-miss');
  return { n: qs.length, removed, rekeyed, unverified, ms, httpErrors, reasons, rawMisses };
}

(async () => {
  console.log(`Validator A/B · ${modelA} vs ${modelB} · ${RUNS} run(s) · chunk ${chunkSize}`);
  console.log(`broken: ${netBroken.length} Net+ + ${secBroken.length} Sec+ · good: ${netGood.length} Net+ + ${secGood.length} Sec+\n`);
  const summary = {};
  for (const model of [modelA, modelB]) {
    if (model === '-') continue;
    const agg = { caught: 0, broken: 0, fp: 0, good: 0, unverified: 0, ms: 0, calls: 0, errors: [], rawMisses: [] };
    for (let r = 0; r < RUNS; r++) {
      const sets = [
        ['broken', netBroken, 'CompTIA Network+ N10-009'], ['broken', secBroken, 'CompTIA Security+ SY0-701'],
        ['good', netGood, 'CompTIA Network+ N10-009'], ['good', secGood, 'CompTIA Security+ SY0-701'],
      ];
      for (const [kind, qs, cert] of sets) {
        const res = await judge(model, qs, cert);
        agg.ms += res.ms; agg.calls++; agg.unverified += res.unverified; agg.errors.push(...res.httpErrors); agg.rawMisses.push(...res.rawMisses);
        if (kind === 'broken') { agg.broken += res.n; agg.caught += res.removed + res.rekeyed; }
        else { agg.good += res.n; agg.fp += res.removed + res.rekeyed; if (r === 0 && res.reasons.length) { console.log(`  [${model}] flagged GOOD questions (${cert}):`); res.reasons.forEach(x => console.log('    ' + x)); } }
      }
    }
    summary[model] = agg;
    console.log(`${model}`);
    console.log(`  catch rate (broken judged bad): ${agg.caught}/${agg.broken} = ${(100 * agg.caught / agg.broken).toFixed(1)}%`);
    console.log(`  false positives (good judged bad): ${agg.fp}/${agg.good} = ${(100 * agg.fp / agg.good).toFixed(1)}%`);
    console.log(`  unreadable verdicts (dropped, not judged): ${agg.unverified}/${agg.broken + agg.good}`);
    console.log(`  avg latency per set:          ${(agg.ms / agg.calls / 1000).toFixed(1)}s`);
    if (agg.errors.length) console.log(`  HTTP errors: ${[...new Set(agg.errors)].slice(0, 3).join(' | ')}`);
    agg.rawMisses.slice(0, 2).forEach((m, i) => {
      console.log(`  --- unreadable reply ${i + 1} (${m.message}) ---`);
      console.log(m.text.split('\n').slice(0, 14).map(l => '  > ' + l.slice(0, 160)).join('\n'));
    });
    console.log('');
  }
})().catch(e => { console.error(e); process.exit(1); });
