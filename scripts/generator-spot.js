#!/usr/bin/env node
// Generator spot-check for ONE cert — the acceptance test for a cert's question
// writer. Captures the app's REAL writer prompts for that cert (headless
// Chromium against a local static server, intercepting _claudeFetch, so they
// are byte-identical to what quizzes send today), sends them to the live
// writer model, and scores the output with the app's own Sonnet checker.
//
//   node scripts/generator-spot.js --cert ai900 --capture-only   # no key, no cost
//   ANTHROPIC_API_KEY=… node scripts/generator-spot.js --cert ai900
//
// Scores: questions written vs requested, Sonnet checker pass rate, objective
// tags inside the pack's objectiveRanges, topics that exist in the pack,
// domain split on mixed prompts, answer-letter spread, how often the correct
// option is the longest, retired/off-cert terms, and real cost.
// Full outputs → scripts/generator-spot-results-<cert>.json (gitignored).
// Roughly $0.30 per run for six prompts. Never commit a key; it is read from env.
//
// Sibling of scripts/generator-ab.js (Sec+-only model A/B, v8.118.0).

const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i === -1 ? d : process.argv[i + 1]; };
const CERT = arg('--cert', 'ai900');
const CAPTURE_ONLY = process.argv.includes('--capture-only');
const KEY = process.env.ANTHROPIC_API_KEY;
if (!CAPTURE_ONLY && !KEY) { console.error('Set ANTHROPIC_API_KEY in your shell first (never paste it into chat or commit it), or pass --capture-only.'); process.exit(1); }

// ── Cert pack (topics, domains, objective ranges) ──
const sb = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'certs', CERT + '.js'), 'utf8'), sb);
const PACK = sb.window.CERT_PACKS && sb.window.CERT_PACKS[CERT];
if (!PACK) { console.error('No cert pack for ' + CERT); process.exit(1); }
const TOPICS = Object.keys(PACK.topicDomains || {});
const DOMAIN_OF = PACK.topicDomains || {};
// "1.1–1.3 (…), 2.1–2.4 (…)" → valid set {1.1,1.2,1.3,2.1,…}
const VALID_OBJ = new Set();
String(PACK.meta.objectiveRanges || '').replace(/(\d+)\.(\d+)\s*[–-]\s*\d+\.(\d+)/g, (_, d, a, b) => {
  for (let i = +a; i <= +b; i++) VALID_OBJ.add(d + '.' + i);
});

// Terms that must not appear in this cert's questions (retired names + other certs).
const BANNED = {
  ai900: ['Custom Vision', 'Form Recognizer', 'Azure AI Studio', 'Azure OpenAI Studio', 'LUIS', 'Language Understanding', 'QnA Maker',
    'Azure Machine Learning designer', 'Cognitive Services', 'AI-900', 'CompTIA', 'N10-009', 'SY0-701', 'subnet', 'VLAN', 'OSI'],
};
const banned = BANNED[CERT] || ['CompTIA N10-009'];

// Six quiz shapes: two mixed (exam + mixed difficulty) and four single topics,
// split across the pack's domains so both halves of the blueprint are exercised.
function pickConfigs() {
  const byDom = {};
  TOPICS.forEach(t => { (byDom[DOMAIN_OF[t]] = byDom[DOMAIN_OF[t]] || []).push(t); });
  const doms = Object.keys(PACK.domainWeights || byDom);
  const singles = [];
  for (let i = 0; singles.length < 4 && i < 8; i++) {
    const pool = byDom[doms[i % doms.length]] || [];
    const t = pool[Math.floor(i / doms.length) * 3 % Math.max(1, pool.length)];
    if (t && !singles.includes(t)) singles.push(t);
  }
  return [
    { id: 'mixed-exam', topic: '__MIXED__', diff: 'Exam Level', n: 10 },
    { id: 'mixed-mixed', topic: '__MIXED__', diff: 'Mixed', n: 10 },
    ...singles.map((t, i) => ({ id: 'topic-' + (i + 1), topic: t, diff: i % 2 ? 'Mixed' : 'Exam Level', n: 10 })),
  ];
}

// ── Capture: static server + headless Chromium ──
function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

async function capture() {
  const { chromium } = require('@playwright/test');
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  try {
    const page = await (await browser.newContext({ serviceWorkers: 'block' })).newPage();
    await page.goto(base + '/');
    await page.evaluate(c => localStorage.setItem('nplus_dev_cert', c), CERT);
    await page.goto(base + '/');
    await page.waitForFunction(c => window.CURRENT_CERT === c && window.CERT_PACK && typeof _fetchQuestionsBatch === 'function', CERT, { timeout: 20000 });
    const configs = pickConfigs();
    const out = await page.evaluate(async cfgs => {
      const res = [];
      for (const c of cfgs) {
        let body = null;
        const orig = window._claudeFetch;
        window._claudeFetch = async init => { body = JSON.parse(init.body); return { ok: false, status: 599, json: async () => ({ error: { message: 'captured' } }) }; };
        try { await _fetchQuestionsBatch('sk-capture', c.topic === '__MIXED__' ? MIXED_TOPIC : c.topic, c.diff, c.n, undefined, 0); } catch (e) {}
        window._claudeFetch = orig;
        res.push(Object.assign({}, c, { body }));
      }
      return { appVersion: APP_VERSION, certName: CERT_NAME_FULL, configs: res };
    }, configs);
    out.configs.forEach(c => { if (!c.body) throw new Error('No request captured for ' + c.id); });
    return out;
  } finally { await browser.close(); srv.close(); }
}

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
const VALIDATOR = (appJs.match(/const CLAUDE_VALIDATOR_MODEL\s*=\s*'([^']+)'/) || [])[1] || 'claude-sonnet-4-6';
const chunkSize = parseInt((appJs.match(/const VALIDATOR_CHUNK_SIZE = (\d+)/) || [])[1] || '5', 10);
const valMax = parseInt((appJs.match(/const MAX_TOKENS_VALIDATION\s*=\s*(\d+)/) || [])[1] || '1000', 10);
const PRICE = { 'claude-haiku-5-5': { in: 0.10, out: 0.50 }, 'claude-haiku-4-5-20251001': { in: 1, out: 5 }, 'claude-sonnet-4-6': { in: 3, out: 15 } };

async function callApi(body) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

async function sonnetCheck(questions, certName) {
  const usage = { in: 0, out: 0 };
  const telemetry = [];
  const ctx = vm.createContext({
    getQType: q => q.type || 'mcq', Map, Object, String, Promise, JSON, Math,
    CERT_NAME_FULL: certName, CLAUDE_VALIDATOR_MODEL: VALIDATOR, MAX_TOKENS_VALIDATION: valMax,
    VALIDATOR_CHUNK_SIZE: chunkSize, CURRENT_CERT: CERT,
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
  try { const arr = JSON.parse(m[0]); return Array.isArray(arr) ? { questions: arr.filter(q => q && typeof q === 'object') } : { error: 'not an array' }; }
  catch (e) { return { error: 'JSON.parse: ' + e.message.slice(0, 80) }; }
}

function audit(qs) {
  const a = { objBad: [], topicBad: [], banned: [], letters: {}, longest: 0, mcq: 0, snippets: 0, domains: {} };
  qs.forEach(q => {
    const raw = JSON.stringify(q);
    if (!VALID_OBJ.has(String(q.objective))) a.objBad.push(q.objective);
    if (!TOPICS.includes(q.topic)) a.topicBad.push(q.topic);
    else a.domains[DOMAIN_OF[q.topic]] = (a.domains[DOMAIN_OF[q.topic]] || 0) + 1;
    banned.forEach(t => { if (new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(raw)) a.banned.push(t); });
    if (/```|client\.|import |\.create\(/.test(raw)) a.snippets++;
    if ((q.type || 'mcq') === 'mcq' && q.options && q.answer) {
      a.mcq++;
      a.letters[q.answer] = (a.letters[q.answer] || 0) + 1;
      const lens = Object.values(q.options).map(o => String(o).length);
      if (String(q.options[q.answer] || '').length === Math.max(...lens)) a.longest++;
    }
  });
  return a;
}

(async () => {
  console.log(`Generator spot-check · ${CERT} · capturing the app's real prompts…`);
  const cap = await capture();
  const promptsFile = path.join(__dirname, `generator-spot-prompts-${CERT}.json`);
  fs.writeFileSync(promptsFile, JSON.stringify({ capturedAt: new Date().toISOString(), cert: CERT, appVersion: cap.appVersion, configs: cap.configs.map(c => ({ id: c.id, topic: c.topic, diff: c.diff, n: c.n, model: c.body.model, max_tokens: c.body.max_tokens, prompt: c.body.messages[0].content })) }, null, 2));
  console.log(`  ${cap.configs.length} prompts from v${cap.appVersion} · writer ${cap.configs[0].body.model} · checker ${VALIDATOR}`);
  const leak = cap.configs.filter(c => /CompTIA|N10-009|Networking Concepts|undefined questions/.test(c.body.messages[0].content) && !/^CompTIA/.test(PACK.meta.name));
  if (leak.length) console.log(`  ⚠ prompt still carries another cert's wording: ${leak.map(c => c.id).join(', ')}`);
  if (CAPTURE_ONLY) { console.log(`  saved ${path.relative(ROOT, promptsFile)} (capture only, nothing sent)`); return; }

  const results = { ranAt: new Date().toISOString(), cert: CERT, appVersion: cap.appVersion, configs: [] };
  const tot = { requested: 0, written: 0, checked: 0, passed: 0, jsonFail: 0, refusals: 0, truncated: 0, genIn: 0, genOut: 0, valIn: 0, valOut: 0, ms: [], objBad: [], topicBad: [], banned: [], letters: {}, longest: 0, mcq: 0, snippets: 0, domains: {}, problems: [] };
  const model = cap.configs[0].body.model;
  await Promise.all(cap.configs.map(async c => {
    const body = Object.assign({}, c.body); delete body._metered;
    const t0 = Date.now();
    const res = await callApi(body);
    const row = { id: c.id, topic: c.topic, ms: Date.now() - t0 };
    tot.requested += c.n; tot.ms.push(row.ms);
    if (!res.ok) { tot.problems.push(`${c.id}: HTTP ${res.status} ${JSON.stringify(res.data.error || {}).slice(0, 140)}`); results.configs.push(row); return; }
    const d = res.data; const u = d.usage || {};
    tot.genIn += u.input_tokens || 0; tot.genOut += u.output_tokens || 0;
    if (d.stop_reason === 'refusal') { tot.refusals++; results.configs.push(row); return; }
    if (d.stop_reason === 'max_tokens') tot.truncated++;
    const text = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    const parsed = parseQuestions(text);
    if (parsed.error) { tot.jsonFail++; tot.problems.push(`${c.id}: ${parsed.error}`); results.configs.push(row); return; }
    row.questions = parsed.questions;
    const check = await sonnetCheck(parsed.questions, cap.certName);
    tot.valIn += check.usage.in; tot.valOut += check.usage.out;
    row.kept = check.kept.map(q => q.question); row.rejections = check.rejections;
    tot.written += parsed.questions.length;
    tot.checked += parsed.questions.filter(q => ['mcq', 'multi-select'].includes(q.type || 'mcq')).length;
    tot.passed += check.stats.kept || 0;
    const a = audit(parsed.questions); row.audit = a;
    tot.objBad.push(...a.objBad); tot.topicBad.push(...a.topicBad); tot.banned.push(...a.banned);
    tot.longest += a.longest; tot.mcq += a.mcq; tot.snippets += a.snippets;
    Object.entries(a.letters).forEach(([k, v]) => { tot.letters[k] = (tot.letters[k] || 0) + v; });
    if (c.topic === '__MIXED__') Object.entries(a.domains).forEach(([k, v]) => { tot.domains[k] = (tot.domains[k] || 0) + v; });
    results.configs.push(row);
  }));
  const pr = PRICE[model] || PRICE['claude-haiku-5-5'], pv = PRICE[VALIDATOR] || PRICE['claude-sonnet-4-6'];
  const genCost = (tot.genIn * pr.in + tot.genOut * pr.out) / 1e6, valCost = (tot.valIn * pv.in + tot.valOut * pv.out) / 1e6;
  const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const pct = (a, b) => b ? (100 * a / b).toFixed(0) + '%' : '-';
  const mixedTotal = Object.values(tot.domains).reduce((s, v) => s + v, 0);
  console.log('');
  console.log(`  written / requested:          ${tot.written}/${tot.requested}`);
  console.log(`  passed Sonnet checker:        ${tot.passed}/${tot.checked} = ${pct(tot.passed, tot.checked)}`);
  console.log(`  objective tags out of range:  ${tot.objBad.length}${tot.objBad.length ? '  (' + [...new Set(tot.objBad)].slice(0, 6).join(', ') + ')' : ''}`);
  console.log(`  topics not in the pack:       ${tot.topicBad.length}${tot.topicBad.length ? '  (' + [...new Set(tot.topicBad)].slice(0, 4).join(' | ') + ')' : ''}`);
  console.log(`  retired / off-cert terms:     ${tot.banned.length}${tot.banned.length ? '  (' + [...new Set(tot.banned)].join(', ') + ')' : ''}`);
  console.log(`  mixed-quiz domain split:      ${Object.keys(PACK.domainWeights).map(k => `${k} ${pct(tot.domains[k] || 0, mixedTotal)} (target ${Math.round(PACK.domainWeights[k] * 100)}%)`).join(' · ')}`);
  console.log(`  answer letters (MCQ):         ${['A', 'B', 'C', 'D'].map(l => `${l} ${tot.letters[l] || 0}`).join(' · ')}`);
  console.log(`  correct option is longest:    ${pct(tot.longest, tot.mcq)} of MCQs (about 25% is unbiased)`);
  console.log(`  questions with code snippets: ${tot.snippets}`);
  console.log(`  JSON failures / refusals / cut off: ${tot.jsonFail} / ${tot.refusals} / ${tot.truncated}`);
  console.log(`  median generation time:       ${(med(tot.ms) / 1000).toFixed(1)}s`);
  console.log(`  cost: writing $${genCost.toFixed(3)} + checking $${valCost.toFixed(3)}`);
  if (tot.problems.length) console.log(`  problems: ${tot.problems.slice(0, 3).join(' | ')}`);
  const out = path.join(__dirname, `generator-spot-results-${CERT}.json`);
  fs.writeFileSync(out, JSON.stringify(Object.assign(results, { totals: tot, genCost, valCost }), null, 2));
  console.log(`\nFull outputs saved to ${path.relative(ROOT, out)} — tell Claude it's done.`);
})().catch(e => { console.error(e); process.exit(1); });
