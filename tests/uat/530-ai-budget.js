// tests/uat/530-ai-budget.js
// Scope: persona bundle Task 16. The app-wide AI limit sized to a $100 a month budget, the 80% founder email, the scope on every
// rate-limit 429 and the kinder busy message. Endpoint behaviour is in tests/api/generate-limits.test.mjs (fetch stubbed, run here
// as a child process); the client branch runs the real _claudeFetch in tests/uat/_ai-budget-async.js.
// Spec: 2026-10-30-ai-budget-fast-start-suggest-design.md section 1
const fs = require('fs');
const path = require('path');
const { test } = require('./_context');

(function () {
  console.log('\n\x1b[1m── AI budget ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const gen = fs.readFileSync(path.join(ROOT, 'api', 'ai', 'generate.js'), 'utf8');
  const cp = require('child_process');

  let apiOut = '';
  try { apiOut = cp.execFileSync(process.execPath, [path.join(ROOT, 'tests', 'api', 'generate-limits.test.mjs')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { apiOut = 'FAILED ' + String(e.stdout || '').slice(-300) + ' ' + String(e.stderr || e.message).slice(-500); }
  test('api tests (generate-limits) pass: ' + apiOut.trim().split('\n').pop(), /passed/.test(apiOut) && !/FAILED/.test(apiOut));

  let out = [];
  try { out = JSON.parse(cp.execFileSync(process.execPath, [path.join(__dirname, '_ai-budget-async.js')], { encoding: 'utf8' }).trim().split('\n').pop()); }
  catch (e) { out = [['async client checks ran: ' + e.message, false]]; }
  out.forEach(([n, ok]) => test(n, ok));

  test('proxy: env override read per call, default is a positive number with the arithmetic beside it',
    gen.includes('process.env.AI_GLOBAL_DAILY_LIMIT') && /GLOBAL_DAILY_LIMIT_DEFAULT = \d+/.test(gen) && gen.includes('PROVISIONAL') && gen.includes('100 / 30'));
  test('proxy: user and IP ceilings unchanged (500/day, 200/hour)', gen.includes('USER_DAILY_LIMIT   = 500') && gen.includes('IP_HOURLY_LIMIT    = 200'));
  test('proxy: 80% alert is deduped by alert:global80 and never awaited', gen.includes("'alert:global80:'") && /\n\s+maybeAlertFounder\(token/.test(gen) && !/await maybeAlertFounder/.test(gen));
  const dash = String.fromCharCode(0x2014);
  test('copy: no em dashes in the new tests, the busy toast or the alert email', !fs.readFileSync(path.join(ROOT, 'tests', 'api', 'generate-limits.test.mjs'), 'utf8').includes(dash) && !gen.slice(gen.indexOf('function maybeAlertFounder'), gen.indexOf('module.exports = async')).includes(dash));
})();
