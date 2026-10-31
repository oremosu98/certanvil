// Async half of UAT 530 (not auto-loaded). Runs the real _claudeFetch from app.js against a fake proxy 429 and prints
// a JSON array of [name, passed].
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'app.js'), 'utf8');
function body(name) {
  const i = src.indexOf('async function ' + name + '('); let d = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1); }
  return '';
}
const results = [];
const test = (n, ok) => results.push([n, !!ok]);
async function run(payload) {
  const seen = { toast: [], modal: [] };
  const win = { certanvilSupabase: { auth: { getSession: async () => ({ data: { session: { access_token: 't' } } }) } } };
  const ctx = vm.createContext({ window: win, JSON, Promise, console, setTimeout,
    logError() {}, _genSignal: undefined,
    fetchWithTimeout: async () => ({ status: 429, ok: false, clone() { return { json: async () => payload }; } }),
    showToast: (m, t) => seen.toast.push([m, t]), _showQuotaExceededUI: (d) => seen.modal.push(d) });
  vm.runInContext(body('_claudeFetch'), ctx);
  await vm.runInContext('_claudeFetch({ body: JSON.stringify({ _metered: true }) })', ctx);
  return seen;
}
(async () => {
  const busy = await run({ error: 'rate_limited', scope: 'global', message: 'x' });
  test('client: rate_limited 429 shows the busy toast', busy.toast.length === 1 && busy.toast[0][0] === "We're very busy right now. Your questions will be back shortly.");
  test('client: rate_limited 429 does not open the quota modal', busy.modal.length === 0);
  const quota = await run({ error: 'quota_exceeded', reset_at: '2026-11-01T00:00:00Z' });
  test('client: quota_exceeded 429 still opens the quota modal', quota.modal.length === 1 && quota.modal[0].error === 'quota_exceeded');
  test('client: quota_exceeded 429 shows no busy toast', quota.toast.length === 0);
  console.log(JSON.stringify(results));
})();
