// tests/uat/160-tbv2-ships-tbv3-reachability.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Topology Builder V2 ships 3-8, CLAUDE.md size ceiling, bug-report pure functions, TB v3 pure functions + reachability engine (phases 1-3)

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── v5.0.5 — TB V2 Ship #3: Device interaction ──
const _featureV2Js = (() => {
  try { return fs.readFileSync(path.join(ROOT, 'features/topology-builder-v2.js'), 'utf8'); }
  catch (_) { return ''; }
})();

// ── v5.0.7 — TB V2 Ship #4: Simulate mode panel ──
const _featureV1Js = (() => {
  try { return fs.readFileSync(path.join(ROOT, 'features/topology-builder.js'), 'utf8'); }
  catch (_) { return ''; }
})();


// ── v5.0.8 — TB V2 Ship #5: Trace mode panel ──
console.log('\n\x1b[1m── v5.0.8 — TB V2 Ship #5: Trace mode panel ──\x1b[0m');


// ── v5.1.0 — TB V2 Ship #6: Labs mode ──────────────────────────────────────


// ── v5.2.0 Ship #7 — TB V2 3D View mode ──────────────────────────────
// V1 bridge: tbV2Open3DView (async, calls enter(tbState, opts)) + tbV2Close3DView (calls exit())


// (removed: TB V2 3D-view tests — Topology Builder V2 deleted in MVP quiz-only pivot)


// V2 CSS: overlay structure, V1 chrome hidden, canvas top override


// ── v5.3.0: TB V2 Ship #8 — Coach mode ─────────────────────────────


test('v4.99.59 EnvStrategy: ENVIRONMENT_STRATEGY.md exists at repo root', (() => {
  try { return fs.statSync(path.join(ROOT, 'ENVIRONMENT_STRATEGY.md')).isFile(); }
  catch (_) { return false; }
})());

test('v4.99.59 EnvStrategy: CLAUDE.md Branching Strategy is the risk-tiered model (old trigger-list retired)', (() => {
  let cm = '';
  try { cm = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8'); } catch (_) { return false; }
  return /Branching Strategy\s*—\s*Risk-Tiered/.test(cm) &&
         /ENVIRONMENT_STRATEGY\.md/.test(cm) &&
         !/Add a `stage` branch only when one of these fires/.test(cm); // tombstone: old stance gone
})());

test('v4.99.59 EnvStrategy: SHIP_CHECKLIST.md has the Phase 0.5 risk-tier gate', (() => {
  let sc = '';
  try { sc = fs.readFileSync(path.join(ROOT, 'SHIP_CHECKLIST.md'), 'utf8'); } catch (_) { return false; }
  return /Phase 0\.5 — Risk-tier gate/.test(sc) && /gated lane/i.test(sc);
})());

test('v4.99.59 EnvStrategy: PR template exists with the gated-lane checklist', (() => {
  let pt = '';
  try { pt = fs.readFileSync(path.join(ROOT, '.github', 'pull_request_template.md'), 'utf8'); }
  catch (_) { return false; }
  return /Risk tier/i.test(pt) && /Supabase branch DB/.test(pt) && /-- ROLLBACK/.test(pt);
})());

// ── CLAUDE.md size ceiling (docs slim-down enforcement, 2026-05-29) ──
// CLAUDE.md auto-loads on every tool call, so bloat taxes every session. If
// these fail, move detail to docs/ or CHANGELOG.md — never grow the always-
// loaded file. The 122-row, 530KB Version History bloat is what these prevent.
(function _claudeMdCeiling() {
  let md = '';
  try { md = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8'); } catch (_) {}
  const lineCount = md ? md.split('\n').length : 0;
  const byteCount = Buffer.byteLength(md, 'utf8');
  test('CLAUDE.md ceiling: <= 250 lines (move detail to docs/ or CHANGELOG.md)',
    lineCount > 0 && lineCount <= 250);
  test('CLAUDE.md ceiling: <= 30KB (move detail to docs/ or CHANGELOG.md)',
    byteCount > 0 && byteCount <= 30 * 1024);
  // No multi-paragraph version rows: each `| v` row stays a terse one-liner.
  const fatRows = (md.match(/^\| v.*$/gm) || []).filter((r) => r.length > 320);
  test('CLAUDE.md Version History: no fat version rows (each <= 320 chars; full detail -> CHANGELOG.md)',
    fatRows.length === 0);
})();

// ────────────────────────────────────────────────────────────
// v5.6.x · Bug-Report Pure Functions (4 fixtures)
// ────────────────────────────────────────────────────────────
(function _reportFixtures() {
  // Local bridge: this file uses test(name, condition); plan uses assert(cond, msg).
  // Wrap test() with arg-swap so the verbatim fixture code from the plan runs unchanged.
  function assert(cond, msg) { test(msg, !!cond); }

  const reportsSrc = fs.readFileSync(path.join(require('path').join(__dirname, '..'),'..','features','reports.js'),'utf8');

  // ── 1. buildPayload(form, ctx) ───────────────────────────
  // NOTE: _fnBody returns the FULL "function NAME(args) { ... }" declaration,
  // not just the inner body. Inline the declaration directly inside the
  // sandbox template — matches the existing pattern at uat.js:277-290.
  const buildPayloadDecl = _fnBody(reportsSrc, 'buildPayload');
  assert(buildPayloadDecl, 'buildPayload exists');

  const sandbox = { result: null };
  const code = `
    ${buildPayloadDecl}
    result = buildPayload(
      { title: '  streak issue  ', desc: 'detail', steps: null },
      { cert: 'netplus-N10-009', theme: 'light', version: 'v5.5.12',
        page: '#page-setup', viewport: '1440x900',
        last_quiz: { topic: 'subnetting', score: '7/10', minutes_ago: 2 },
        wrong_bank_size: 4 }
    );
  `;
  vm.runInNewContext(code, sandbox);
  const p = sandbox.result;
  assert(p && typeof p === 'object', 'buildPayload returns object');
  assert(/^rpt_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}_[a-f0-9]{4}$/.test(p.id), 'id format rpt_<iso-no-colons>_<4hex>');
  assert(p.title === 'streak issue', 'title trimmed');
  assert(p.description === 'detail', 'description present');
  assert(p.steps === null, 'steps null passes through');
  assert(p.context && p.context.version === 'v5.5.12', 'context.version');
  assert(p.context.cert === 'netplus-N10-009', 'context.cert');
  assert(p.context.last_quiz && p.context.last_quiz.score === '7/10', 'context.last_quiz nested');
  assert(p.context.wrong_bank_size === 4, 'context.wrong_bank_size');
  assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(p.submitted_at), 'submitted_at ISO Z');
  assert(p.attempt_count === 1, 'attempt_count starts at 1');

  // ── 2. renderIssueBody(payload) ──────────────────────────
  const renderBodyDecl = _fnBody(reportsSrc, 'renderIssueBody');
  assert(renderBodyDecl, 'renderIssueBody exists');

  const rbSandbox = { result: null };
  const rbCode = `
    ${renderBodyDecl}
    result = renderIssueBody({
      id: 'rpt_2026-05-20T14-32-07_a3f9',
      title: 'streak does not update',
      description: 'finished a 10-q session, streak stale',
      steps: null,
      context: { version: 'v5.5.12', page: '#page-setup', cert: 'netplus-N10-009',
                 theme: 'light', viewport: '1440x900',
                 last_quiz: { topic: 'subnetting', score: '7/10', minutes_ago: 2 },
                 wrong_bank_size: 4 },
      submitted_at: '2026-05-20T14:32:07Z',
      attempt_count: 1
    });
  `;
  vm.runInNewContext(rbCode, rbSandbox);
  const md = sandbox.result = rbSandbox.result;
  assert(typeof md === 'string', 'renderIssueBody returns string');
  assert(md.indexOf('## What happened') > -1, 'has What happened section');
  assert(md.indexOf('finished a 10-q session') > -1, 'has description text');
  assert(md.indexOf('## Steps to reproduce') > -1, 'has Steps section');
  assert(md.indexOf('_not provided_') > -1, 'null steps render as italic not provided');
  assert(md.indexOf('<details>') > -1, 'auto-context collapsible');
  assert(md.indexOf('Auto-attached context') > -1, 'summary text');
  assert(md.indexOf('| version | v5.5.12 |') > -1, 'context table row');
  assert(md.indexOf('| cert | netplus-N10-009 |') > -1, 'cert row');
  assert(md.indexOf('rpt_2026-05-20T14-32-07_a3f9') > -1, 'footer id');

  // ── 3. classifyError(resp) ───────────────────────────────
  const classifyDecl = _fnBody(reportsSrc, 'classifyError');
  assert(classifyDecl, 'classifyError exists');

  function callClassify(input) {
    var s = { result: null };
    vm.runInNewContext(
      classifyDecl + ' result = classifyError(' + JSON.stringify(input) + ');',
      s
    );
    return s.result;
  }

  var c201 = callClassify({ status: 201 });
  assert(c201.type === 'success' && c201.queueAction === 'clear' && c201.terminal === false, '201 → success/clear');

  var cOff = callClassify({ status: 0, network: true });
  assert(cOff.type === 'offline' && cOff.queueAction === 'enqueue' && cOff.terminal === false, 'offline → enqueue transient');

  var c5xx = callClassify({ status: 503 });
  assert(c5xx.type === 'server' && c5xx.queueAction === 'enqueue' && c5xx.terminal === false, '503 → transient');

  var cRl = callClassify({ status: 403, ratelimit_remaining: 0, ratelimit_reset: 1716200000 });
  assert(cRl.type === 'ratelimit' && cRl.queueAction === 'requeue' && cRl.terminal === false, '403 + rl:0 → requeue');

  var cScope = callClassify({ status: 403 });
  assert(cScope.type === 'scope' && cScope.queueAction === 'enqueue' && cScope.terminal === true, '403 no rl → scope, terminal');

  var c401 = callClassify({ status: 401 });
  assert(c401.type === 'auth' && c401.queueAction === 'enqueue' && c401.terminal === true, '401 → auth, terminal');

  var c422 = callClassify({ status: 422, body: { message: 'validation' } });
  assert(c422.type === 'payload' && c422.queueAction === 'enqueue' && c422.terminal === true, '422 → payload, terminal');

  // ── 4. enqueueReport(rpt, store) ─────────────────────────
  const enqueueDecl = _fnBody(reportsSrc, 'enqueueReport');
  assert(enqueueDecl, 'enqueueReport exists');

  function callEnq(rpt, store) {
    var s = { result: null };
    vm.runInNewContext(
      enqueueDecl + ' result = enqueueReport(' +
        JSON.stringify(rpt) + ', ' + JSON.stringify(store) + ');',
      s
    );
    return s.result;
  }

  // A: empty store + new rpt
  var sA = callEnq({ id: 'rpt_x', payload: { title: 'a' }, attempts: 1, terminal: false }, []);
  assert(sA.length === 1 && sA[0].id === 'rpt_x', 'A: empty + new → 1 entry');

  // B: store has rpt with same id → updates in-place + attempts++
  var sB = callEnq(
    { id: 'rpt_x', payload: { title: 'a' }, attempts: 2, terminal: false },
    [{ id: 'rpt_x', payload: { title: 'a' }, attempts: 1, terminal: false }]
  );
  assert(sB.length === 1 && sB[0].attempts === 2, 'B: same id → updates in place');

  // C: store at cap=25, adds new → LRU drops oldest
  var bigStore = [];
  for (var i = 0; i < 25; i++) bigStore.push({ id: 'rpt_' + i, payload: {}, attempts: 1, terminal: false });
  var sC = callEnq({ id: 'rpt_new', payload: {}, attempts: 1, terminal: false }, bigStore);
  assert(sC.length === 25, 'C: stays at cap 25');
  assert(sC.find(function(x){ return x.id === 'rpt_new'; }), 'C: new entry present');
  assert(!sC.find(function(x){ return x.id === 'rpt_0'; }), 'C: oldest (rpt_0) dropped');
})(); // close _reportFixtures IIFE

// ─── Bug-report structural guards (v4.99.x Stage 8) ─────────────────────────
// Lock in the structural shape of the bug-report popup feature so future
// refactors can't silently regress these surfaces. Sits OUTSIDE the
// _reportFixtures IIFE — uses the global test() helper directly.
const reportsModule = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'reports.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'index.html'), 'utf8');

// Topbar iconbtn exists
test('topbar bug iconbtn exists', indexHtml.includes('id="topbar-bug-report"'));
test('bug iconbtn lazy-loads reports module', indexHtml.includes("_loadFeature('reports')"));

// STORAGE.BUG_REPORTS key
test('STORAGE.BUG_REPORTS key registered', /BUG_REPORTS:\s*'nplus_bug_reports'/.test(appJs));

// Feature module contract
test('reports.js registers on _certanvilFeatures', reportsModule.includes('window._certanvilFeatures.reports'));
test('reports.js exports all 4 pure functions',
  reportsModule.includes('function buildPayload') &&
  reportsModule.includes('function renderIssueBody') &&
  reportsModule.includes('function classifyError') &&
  reportsModule.includes('function enqueueReport'));

// DOMContentLoaded drain hook in app.js
test('app.js drainQueue hook on DOMContentLoaded',
  /DOMContentLoaded[\s\S]{0,400}_loadFeature\('reports'\)[\s\S]{0,200}drainQueue/.test(appJs));

// CSS — drawer + toast classes present
test('drawer CSS scoped to #bug-report-drawer', dgCss.includes('#bug-report-drawer'));
test('toast CSS exists', dgCss.includes('.br-toast'));
test('mobile bottom-sheet breakpoint present', dgCss.includes('@media (max-width: 767px)'));
test('reduced-motion gate present', dgCss.includes('prefers-reduced-motion'));

// Tombstone — STORAGE.BUG_REPORTS must not collide with STORAGE.REPORTS string
test('BUG_REPORTS does not collide with REPORTS key', !/BUG_REPORTS:\s*'nplus_reports'/.test(appJs));

// ────────────────────────────────────────────────────────────
// v6.x · Topology Builder v3 Pure Functions (4 fixtures)
// ────────────────────────────────────────────────────────────
(function _tbv3Fixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  function assert(cond, msg) { test(msg, !!cond); }

  let tbv3Src = '';
  try { tbv3Src = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), 'utf8'); }
  catch (_) { return; /* MVP-quiz-only: TB v3 deleted, skip fixtures */ }

  // ── 1. buildDevice(type, x, y) ─────────────────────────
  const buildDeviceDecl = _fnBody(tbv3Src, 'buildDevice');
  assert(buildDeviceDecl, 'buildDevice exists');

  const sandbox = { result: null };
  vm.runInNewContext(buildDeviceDecl + ' result = buildDevice("router", 100, 200);', sandbox);
  const d = sandbox.result;
  assert(d && typeof d === 'object', 'buildDevice returns object');
  assert(/^dev_[a-z0-9]+_[a-z0-9]{2}$/.test(d.id), 'id matches dev_<hex>_<2hex> pattern');
  assert(d.type === 'router', 'type passthrough');
  assert(d.x === 100 && d.y === 200, 'coords passthrough');
  assert(d.label === '', 'label defaults empty');
  assert(typeof d.config === 'object', 'config is object');

  // ── 2. buildCable(from, fromPort, to, toPort) ──────────
  const buildCableDecl = _fnBody(tbv3Src, 'buildCable');
  assert(buildCableDecl, 'buildCable exists');
  const csb = { result: null };
  vm.runInNewContext(buildCableDecl + ' result = buildCable("dev_a", 0, "dev_b", 1);', csb);
  const c = csb.result;
  assert(c && /^cbl_/.test(c.id), 'cable id has cbl_ prefix');
  assert(c.fromId === 'dev_a' && c.toId === 'dev_b', 'endpoints passthrough');
  assert(c.fromPort === 0 && c.toPort === 1, 'ports passthrough');

  // ── 3. serialiseState(state) ───────────────────────────
  const serDecl = _fnBody(tbv3Src, 'serialiseState');
  assert(serDecl, 'serialiseState exists');
  const ssb = { result: null };
  vm.runInNewContext(serDecl + ' result = serialiseState({ devices: [{id:"d1",x:0,y:0,type:"router"}], cables: [], viewport: {x:0,y:0,zoom:1}, intent: "free-build", mode: "design", selectedId: "d1" });', ssb);
  assert(typeof ssb.result === 'string', 'serialiseState returns string');
  const parsed = JSON.parse(ssb.result);
  assert(Array.isArray(parsed.devices) && parsed.devices.length === 1, 'devices preserved');
  assert(parsed.intent === 'free-build', 'intent preserved');
  assert(!('selectedId' in parsed), 'selectedId NOT serialised (transient only)');

  // ── 4. parseState(json) ────────────────────────────────
  const parseDecl = _fnBody(tbv3Src, 'parseState');
  assert(parseDecl, 'parseState exists');

  function callParse(input) {
    const psb = { result: null };
    vm.runInNewContext(parseDecl + ' result = parseState(' + JSON.stringify(input) + ');', psb);
    return psb.result;
  }
  const pA = callParse('{"devices":[{"id":"d1"}],"cables":[],"viewport":{"x":50,"y":-30,"zoom":1.5},"intent":"lab","mode":"trace"}');
  assert(pA.devices.length === 1 && pA.viewport.zoom === 1.5 && pA.intent === 'lab', 'A: full valid input round-trips');

  const pB = callParse('not json at all');
  assert(pB.devices.length === 0 && pB.viewport.zoom === 1 && pB.intent === 'free-build', 'B: invalid JSON falls back to defaults');

  const pC = callParse('{}');
  assert(pC.devices.length === 0 && pC.intent === 'free-build' && pC.selectedId === null, 'C: empty object → defaults + selectedId null');
})();

// ─── Topology Builder v3 structural guards ────────────────
let tbv3Module = "";
try { tbv3Module = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }
let tbv3Css = "";
try { tbv3Css = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.css'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }
const tbv3IndexHtml = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'index.html'), 'utf8');
const tbv3AppJs = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'app.js'), 'utf8');

test('v6.x TB v3: STORAGE.TB_V3_DRAFT key registered', /TB_V3_DRAFT:\s*'nplus_tb_v3_draft'/.test(tbv3AppJs));
test('v6.x TB v3: STORAGE.TB_V3_DRAFT does not collide with REPORTS', !/TB_V3_DRAFT:\s*'nplus_(bug_)?reports'/.test(tbv3AppJs));

// ─── Topology Builder v3 Phase 2 structural guards ─────────
test('phase2: TB_V3_FREEBUILD_BACKUP key registered', /TB_V3_FREEBUILD_BACKUP:\s*'nplus_tb_v3_freebuild_backup'/.test(tbv3AppJs));
test('phase2: TB_V3_FREEBUILD_BACKUP does not collide with TB_V3_DRAFT', !/TB_V3_FREEBUILD_BACKUP:\s*'nplus_tb_v3_draft'/.test(tbv3AppJs));

// ────────────────────────────────────────────────────────────
// v6.x · Topology Builder v3 Phase 2 — Pure Functions (4 fixtures)
// ────────────────────────────────────────────────────────────
(function _tbv3Phase2Fixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  function assert(cond, msg) { test(msg, !!cond); }

  let tbv3Src = '';
  try { tbv3Src = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), 'utf8'); }
  catch (_) { return; /* MVP-quiz-only: TB v3 deleted, skip fixtures */ }

  // ── 1. validateScenarioShape(s) ─────────────────────────
  const vssDecl = _fnBody(tbv3Src, 'validateScenarioShape');
  assert(vssDecl, 'phase2: validateScenarioShape exists');

  function callVss(s) {
    const sb = { result: null };
    vm.runInNewContext(vssDecl + ' result = validateScenarioShape(' + JSON.stringify(s) + ');', sb);
    return sb.result;
  }

  assert(callVss({ id:'x', title:'X', category:'topology', objectiveRefs:[], startingState:{devices:[],cables:[],viewport:{x:0,y:0,zoom:1}}, completion:{requiredDevices:[]} }) === true, 'A: minimal valid passes');
  assert(callVss(null) === false, 'B: null fails');
  assert(callVss({}) === false, 'C: empty object fails');
  assert(callVss({ id:'x', title:'X', category:'bogus', objectiveRefs:[], startingState:{devices:[],cables:[],viewport:{x:0,y:0,zoom:1}}, completion:{requiredDevices:[]} }) === false, 'D: bad category fails');
  assert(callVss({ id:'x', title:'X', category:'topology', objectiveRefs:[], startingState:{devices:'no'}, completion:{requiredDevices:[]} }) === false, 'E: bad startingState fails');
  assert(callVss({ id:'', title:'X', category:'topology', objectiveRefs:[], startingState:{devices:[],cables:[],viewport:{x:0,y:0,zoom:1}}, completion:{requiredDevices:[]} }) === false, 'F: empty id fails');
  assert(callVss({ id:'x', title:'X', category:'wan', objectiveRefs:['1.6'], startingState:{devices:[],cables:[],viewport:{x:0,y:0,zoom:1}}, completion:{requiredDevices:['router']} }) === true, 'G: wan category valid');
  assert(callVss({ id:'x', title:'X', category:'topology', objectiveRefs:[], startingState:{devices:[],cables:[],viewport:{x:0,y:0,zoom:1}}, completion:null }) === false, 'H: null completion fails');

  // ── 2. loadScenarioOnCanvas(state, scenario) ─────────────
  const lsoDecl = _fnBody(tbv3Src, 'loadScenarioOnCanvas');
  assert(lsoDecl, 'phase2: loadScenarioOnCanvas exists');

  function callLso(state, scenario) {
    const sb = { result: null };
    vm.runInNewContext(vssDecl + ' ' + lsoDecl + ' result = loadScenarioOnCanvas(' + JSON.stringify(state) + ', ' + JSON.stringify(scenario) + ');', sb);
    return sb.result;
  }

  const emptyState = { devices:[], cables:[], viewport:{x:0,y:0,zoom:1}, intent:'free-build', mode:'design', selectedId:null };
  const sampleScen = {
    id:'star-topology', title:'Star topology', category:'topology', objectiveRefs:['1.2'],
    startingState:{
      devices:[
        { id:'sc_star_1', type:'switch', x:400, y:300, label:'SW1' },
        { id:'sc_star_2', type:'server', x:200, y:200, label:'SRV' },
        { id:'sc_star_3', type:'workstation', x:600, y:400, label:'WS1' }
      ],
      cables:[
        { id:'sc_star_c1', fromId:'sc_star_1', toId:'sc_star_2', type:'cat6' },
        { id:'sc_star_c2', fromId:'sc_star_1', toId:'sc_star_3', type:'cat6' }
      ],
      viewport:{x:0,y:0,zoom:1}
    },
    brief:'…', examRelevance:{}, completion:{requiredDevices:['switch','server','workstation']}
  };

  const loaded = callLso(emptyState, sampleScen);
  assert(loaded.devices.length === 3, 'A: 3 devices loaded');
  assert(loaded.cables.length === 2, 'B: 2 cables loaded');
  assert(loaded.intent === 'lab', 'C: intent flipped to lab');
  assert(loaded.activeScenarioId === 'star-topology', 'D: activeScenarioId set');
  assert(loaded.selectedId === null, 'E: selectedId reset');
  assert(loaded.devices[0].id === 'sc_star_1', 'F: device ids preserved');

  // ── 3. checkCompletion(state, completion) ────────────────
  const ccDecl = _fnBody(tbv3Src, 'checkCompletion');
  assert(ccDecl, 'phase2: checkCompletion exists');

  function callCc(state, completion) {
    const sb = { result: null };
    vm.runInNewContext(ccDecl + ' result = checkCompletion(' + JSON.stringify(state) + ', ' + JSON.stringify(completion) + ');', sb);
    return sb.result;
  }

  const ccComp = {
    requiredDevices: ['switch','server','workstation'],
    expectedCount: { switch:1, server:1, workstation:3 },
    requiredCables: [
      { from:'switch', to:'server' },
      { from:'switch', to:'workstation' }
    ]
  };

  // A: empty → incomplete
  const eA = callCc({ devices:[], cables:[] }, ccComp);
  assert(eA && eA.complete === false, 'A: empty incomplete');
  assert(eA.missingDevices.length === 3, 'A: 3 missing device types');

  // B: only 1 workstation present → still incomplete
  const eB = callCc({ devices:[
    { id:'a', type:'switch' }, { id:'b', type:'server' }, { id:'c', type:'workstation' }
  ], cables:[
    { id:'c1', fromId:'a', toId:'b' }, { id:'c2', fromId:'a', toId:'c' }
  ]}, ccComp);
  assert(eB.complete === false, 'B: 1 ws but need 3');
  assert(eB.deviceCountMismatch.indexOf('workstation') !== -1, 'B: workstation count flagged');

  // C: all 3 workstations + cables present → complete
  const eC = callCc({ devices:[
    { id:'a', type:'switch' }, { id:'b', type:'server' },
    { id:'c', type:'workstation' }, { id:'d', type:'workstation' }, { id:'e', type:'workstation' }
  ], cables:[
    { id:'c1', fromId:'a', toId:'b' },
    { id:'c2', fromId:'a', toId:'c' },
    { id:'c3', fromId:'a', toId:'d' },
    { id:'c4', fromId:'a', toId:'e' }
  ]}, ccComp);
  assert(eC.complete === true, 'C: all goals met');
  assert(eC.missingCables.length === 0, 'C: no missing cables');

  // D: devices present but no cables → required cables surface
  const eD = callCc({ devices:[
    { id:'a', type:'switch' }, { id:'b', type:'server' },
    { id:'c', type:'workstation' }, { id:'d', type:'workstation' }, { id:'e', type:'workstation' }
  ], cables:[]}, ccComp);
  assert(eD.complete === false, 'D: incomplete on missing cables');
  assert(eD.missingCables.length === 2, 'D: both required pair types flagged');

  // ── 4. backupFreeBuild / restoreFreeBuild ────────────────
  // These are wrappers over localStorage so we extract bodies + simulate the
  // localStorage via a stub injected into the sandbox.
  const bfbDecl = _fnBody(tbv3Src, 'backupFreeBuild');
  const rfbDecl = _fnBody(tbv3Src, 'restoreFreeBuild');
  // Dependencies: backup calls serialiseState; restore calls parseState. Prepend both.
  const ssDecl = _fnBody(tbv3Src, 'serialiseState');
  const psDecl = _fnBody(tbv3Src, 'parseState');
  assert(bfbDecl && rfbDecl, 'phase2: backup/restore fns exist');

  // Round-trip in the same sandbox:
  const sandbox = {
    _store: {},
    localStorage: null,
    STORAGE: { TB_V3_FREEBUILD_BACKUP: 'nplus_tb_v3_freebuild_backup' },
    out: null,
  };
  sandbox.localStorage = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(sandbox._store, k) ? sandbox._store[k] : null; },
    setItem: function (k, v) { sandbox._store[k] = String(v); },
    removeItem: function (k) { delete sandbox._store[k]; },
  };

  const fbState = { devices:[{ id:'d1', type:'router', x:100, y:100, label:'R1' }], cables:[], viewport:{x:0,y:0,zoom:1}, intent:'free-build', mode:'design', selectedId:null, activeScenarioId:null };
  vm.runInNewContext(ssDecl + ' ' + bfbDecl + ' out = backupFreeBuild(' + JSON.stringify(fbState) + ');', sandbox);
  assert(sandbox._store['nplus_tb_v3_freebuild_backup'], 'A: backup wrote to STORAGE.TB_V3_FREEBUILD_BACKUP');

  vm.runInNewContext(psDecl + ' ' + rfbDecl + ' out = restoreFreeBuild();', sandbox);
  assert(sandbox.out && Array.isArray(sandbox.out.devices) && sandbox.out.devices.length === 1, 'B: restore returns prior state');
  assert(sandbox.out.devices[0].id === 'd1', 'C: device id preserved through round-trip');

  // After restore, the backup is cleared (one-shot).
  vm.runInNewContext(psDecl + ' ' + rfbDecl + ' out = restoreFreeBuild();', sandbox);
  assert(sandbox.out === null, 'D: subsequent restore returns null (one-shot)');
})();

// ────────────────────────────────────────────────────────────
// v6.0 · Topology Builder v3 Phase 3 — Reachability engine (5 pure fns)
// ────────────────────────────────────────────────────────────
(function _tbv3Phase3Fixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  function assert(cond, msg) { test(msg, !!cond); }

  let tbv3SrcP3 = "";
  try { tbv3SrcP3 = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  // ── 1. parseCidr(input) ───────────────────────────────────
  const pcDecl = _fnBody(tbv3SrcP3, 'parseCidr');
  assert(pcDecl, 'phase3: parseCidr exists');

  function callPc(input) {
    const sb = { result: null };
    vm.runInNewContext(pcDecl + ' result = parseCidr(' + JSON.stringify(input) + ');', sb);
    return sb.result;
  }

  const ok = callPc('192.168.10.5/24');
  assert(ok && Array.isArray(ok.ip) && ok.ip.join('.') === '192.168.10.5' && ok.mask === 24, 'pc-A: valid /24 parses');
  assert(callPc('10.0.0.1/30') && callPc('10.0.0.1/30').mask === 30, 'pc-B: /30 parses');
  assert(callPc('0.0.0.0/0') && callPc('0.0.0.0/0').mask === 0, 'pc-C: /0 parses');
  assert(callPc('255.255.255.255/32') && callPc('255.255.255.255/32').mask === 32, 'pc-D: /32 parses');
  assert(callPc('') === null, 'pc-E: empty returns null');
  assert(callPc(null) === null, 'pc-F: null returns null');
  assert(callPc('192.168.10.5') === null, 'pc-G: no mask returns null');
  assert(callPc('192.168.10.5/33') === null, 'pc-H: mask >32 returns null');
  assert(callPc('192.168.10.5/-1') === null, 'pc-I: mask <0 returns null');
  assert(callPc('192.168.300.5/24') === null, 'pc-J: octet >255 returns null');

  // ── 2. inSameSubnet(ipA, ipB, mask) ──────────────────────
  const issDecl = _fnBody(tbv3SrcP3, 'inSameSubnet');
  assert(issDecl, 'phase3: inSameSubnet exists');

  function callIss(a, b, m) {
    const sb = { result: null };
    vm.runInNewContext(issDecl + ' result = inSameSubnet(' + JSON.stringify(a) + ',' + JSON.stringify(b) + ',' + m + ');', sb);
    return sb.result;
  }

  assert(callIss([192,168,10,1], [192,168,10,254], 24) === true,  'iss-A: /24 same subnet');
  assert(callIss([192,168,10,1], [192,168,11,1],   24) === false, 'iss-B: /24 different subnet');
  assert(callIss([10,0,0,1],     [10,0,0,2],       30) === true,  'iss-C: /30 point-to-point same');
  assert(callIss([10,0,0,1],     [10,0,0,5],       30) === false, 'iss-D: /30 different /30');
  assert(callIss([1,2,3,4],      [5,6,7,8],         0) === true,  'iss-E: /0 always matches');
  assert(callIss([192,168,10,5], [192,168,10,5],   32) === true,  'iss-F: /32 exact match');

  // ── 3. routeNextHop(srcIp, dstIp, device) ────────────────
  const rnhDecl = _fnBody(tbv3SrcP3, 'routeNextHop');
  assert(rnhDecl, 'phase3: routeNextHop exists');

  function callRnh(srcIp, dstIp, device) {
    const sb = { result: null };
    vm.runInNewContext(
      pcDecl + ' ' + issDecl + ' ' + rnhDecl +
      ' result = routeNextHop(' + JSON.stringify(srcIp) + ',' + JSON.stringify(dstIp) + ',' + JSON.stringify(device) + ');',
      sb
    );
    return sb.result;
  }

  const endpointDirect = { type:'workstation', config:{ ip:'192.168.10.10', mask:24, gateway:'192.168.10.1' } };
  assert(callRnh('192.168.10.10', '192.168.10.254', endpointDirect).via === 'direct', 'rnh-A: endpoint same-subnet returns direct');

  const offSub = callRnh('192.168.10.10', '192.168.20.5', endpointDirect);
  assert(offSub.via === 'gateway' && offSub.gateway === '192.168.10.1', 'rnh-B: endpoint off-subnet returns gateway');

  const noGw = { type:'workstation', config:{ ip:'192.168.10.10', mask:24 } };
  assert(callRnh('192.168.10.10', '192.168.20.5', noGw) === null, 'rnh-C: endpoint off-subnet no-gateway returns null');

  const router = { type:'router', interfaces:[
    { ip:'192.168.10.1', mask:24 },
    { ip:'192.168.20.1', mask:24 },
  ]};
  assert(callRnh('192.168.10.1', '192.168.10.20', router).via === 'direct', 'rnh-D: router subnet on iface returns direct');
  assert(callRnh('192.168.10.1', '192.168.20.20', router).via === 'direct', 'rnh-E: router second subnet on iface returns direct');
  assert(callRnh('192.168.10.1', '10.0.0.5', router) === null, 'rnh-F: router with no matching interface returns null');

  const endpointNoIp = { type:'workstation', config:{} };
  assert(callRnh(null, '192.168.10.20', endpointNoIp) === null, 'rnh-G: endpoint with no IP returns null');

  const noConfig = { type:'workstation' };
  assert(callRnh(null, '192.168.10.20', noConfig) === null, 'rnh-H: endpoint with no config returns null');

  // ── 4. computePath(srcId, dstId, state) ──────────────────
  const cpDecl = _fnBody(tbv3SrcP3, 'computePath');
  assert(cpDecl, 'phase3: computePath exists');

  function callCp(srcId, dstId, state) {
    const sb = { result: null };
    vm.runInNewContext(
      pcDecl + ' ' + issDecl + ' ' + rnhDecl + ' ' + cpDecl +
      ' result = computePath(' + JSON.stringify(srcId) + ',' + JSON.stringify(dstId) + ',' + JSON.stringify(state) + ');',
      sb
    );
    return sb.result;
  }

  // Same-subnet simple LAN: ws-1 → ws-2 via switch
  const lan = {
    devices: [
      { id:'sw',  type:'switch' },
      { id:'ws1', type:'workstation', config:{ ip:'192.168.10.10', mask:24, gateway:'192.168.10.1' } },
      { id:'ws2', type:'workstation', config:{ ip:'192.168.10.11', mask:24, gateway:'192.168.10.1' } },
    ],
    cables: [
      { id:'c1', fromId:'sw', toId:'ws1' },
      { id:'c2', fromId:'sw', toId:'ws2' },
    ],
  };
  const okA = callCp('ws1', 'ws2', lan);
  assert(okA.ok === true, 'cp-A: same-subnet via switch succeeds');
  assert(Array.isArray(okA.hops) && okA.hops[0] === 'ws1' && okA.hops[okA.hops.length-1] === 'ws2', 'cp-A2: hops start at src end at dst');

  // No IP failure
  const noIp = {
    devices: [
      { id:'ws1', type:'workstation' },
      { id:'ws2', type:'workstation', config:{ ip:'192.168.10.11', mask:24 } },
    ],
    cables: [],
  };
  const failB = callCp('ws1', 'ws2', noIp);
  assert(failB.ok === false && failB.reason === 'no-ip' && failB.failedAt === 'ws1', 'cp-B: no-ip fails at source');

  // Different subnet, no gateway
  const cpNoGw = {
    devices: [
      { id:'ws1', type:'workstation', config:{ ip:'192.168.10.10', mask:24 } },
      { id:'ws2', type:'workstation', config:{ ip:'192.168.20.10', mask:24, gateway:'192.168.20.1' } },
    ],
    cables: [],
  };
  const failC = callCp('ws1', 'ws2', cpNoGw);
  assert(failC.ok === false && failC.reason === 'no-gateway', 'cp-C: off-subnet no-gateway fails');

  // Different subnet, valid router
  const routed = {
    devices: [
      { id:'sw1', type:'switch' },
      { id:'sw2', type:'switch' },
      { id:'r1',  type:'router', interfaces:[
        { ip:'192.168.10.1', mask:24 },
        { ip:'192.168.20.1', mask:24 },
      ]},
      { id:'ws1', type:'workstation', config:{ ip:'192.168.10.10', mask:24, gateway:'192.168.10.1' } },
      { id:'srv', type:'server',      config:{ ip:'192.168.20.10', mask:24, gateway:'192.168.20.1' } },
    ],
    cables: [
      { id:'c1', fromId:'ws1', toId:'sw1' },
      { id:'c2', fromId:'sw1', toId:'r1' },
      { id:'c3', fromId:'r1',  toId:'sw2' },
      { id:'c4', fromId:'sw2', toId:'srv' },
    ],
  };
  const okD = callCp('ws1', 'srv', routed);
  assert(okD.ok === true, 'cp-D: off-subnet via router succeeds');
  assert(okD.hops.indexOf('r1') !== -1, 'cp-D2: router appears in hops');

  // Off-subnet, gateway IP unreachable via cables
  const orphan = {
    devices: [
      { id:'ws1', type:'workstation', config:{ ip:'192.168.10.10', mask:24, gateway:'192.168.10.1' } },
      { id:'srv', type:'server',      config:{ ip:'192.168.20.10', mask:24, gateway:'192.168.20.1' } },
    ],
    cables: [],
  };
  const failE = callCp('ws1', 'srv', orphan);
  assert(failE.ok === false && (failE.reason === 'no-cable-path' || failE.reason === 'no-route'), 'cp-E: no cable path to gateway fails');

  // Same-subnet but disconnected (no cables)
  const lan2 = {
    devices: [
      { id:'ws1', type:'workstation', config:{ ip:'192.168.10.10', mask:24, gateway:'192.168.10.1' } },
      { id:'ws2', type:'workstation', config:{ ip:'192.168.10.11', mask:24, gateway:'192.168.10.1' } },
    ],
    cables: [],
  };
  const failF = callCp('ws1', 'ws2', lan2);
  assert(failF.ok === false && failF.reason === 'no-cable-path', 'cp-F: same-subnet no cable returns no-cable-path');

  // Gateway points at a non-router device
  const fakeGw = {
    devices: [
      { id:'sw1', type:'switch' },
      { id:'ws1', type:'workstation', config:{ ip:'192.168.10.10', mask:24, gateway:'192.168.10.99' } },
      { id:'ws2', type:'workstation', config:{ ip:'192.168.10.99', mask:24 } },
      { id:'srv', type:'server',      config:{ ip:'192.168.20.10', mask:24 } },
    ],
    cables: [
      { id:'c1', fromId:'ws1', toId:'sw1' },
      { id:'c2', fromId:'sw1', toId:'ws2' },
    ],
  };
  const failG = callCp('ws1', 'srv', fakeGw);
  assert(failG.ok === false && failG.reason === 'no-router-between', 'cp-G: gateway pointing at non-router fails no-router-between');

  // Source equals destination — trivially reachable
  assert(callCp('ws1', 'ws1', lan).ok === true, 'cp-H: src===dst trivially ok');

  // ── 5. computeReachability(state, completion) ────────────
  const crDecl = _fnBody(tbv3SrcP3, 'computeReachability');
  assert(crDecl, 'phase3: computeReachability exists');

  function callCr(state, completion) {
    const sb = { result: null };
    vm.runInNewContext(
      pcDecl + ' ' + issDecl + ' ' + rnhDecl + ' ' + cpDecl + ' ' + crDecl +
      ' result = computeReachability(' + JSON.stringify(state) + ',' + JSON.stringify(completion) + ');',
      sb
    );
    return sb.result;
  }

  // Empty requiredCables → trivially complete
  assert(callCr({devices:[], cables:[]}, {}).complete === true, 'cr-A: empty completion is complete');
  assert(callCr({devices:[], cables:[]}, {requiredCables: []}).complete === true, 'cr-B: empty requiredCables array is complete');

  // Reachable scenario — star (switch + server + 3 workstations all same subnet)
  const starOk = {
    devices: [
      { id:'sw',   type:'switch' },
      { id:'srv',  type:'server',      config:{ ip:'192.168.10.10', mask:24, gateway:'192.168.10.1' } },
      { id:'ws1',  type:'workstation', config:{ ip:'192.168.10.20', mask:24, gateway:'192.168.10.1' } },
      { id:'ws2',  type:'workstation', config:{ ip:'192.168.10.21', mask:24, gateway:'192.168.10.1' } },
      { id:'ws3',  type:'workstation', config:{ ip:'192.168.10.22', mask:24, gateway:'192.168.10.1' } },
    ],
    cables: [
      { id:'c1', fromId:'sw', toId:'srv' },
      { id:'c2', fromId:'sw', toId:'ws1' },
      { id:'c3', fromId:'sw', toId:'ws2' },
      { id:'c4', fromId:'sw', toId:'ws3' },
    ],
  };
  const compStar = { requiredCables: [
    { from:'switch', to:'server' },
    { from:'switch', to:'workstation' },
  ]};
  assert(callCr(starOk, compStar).complete === true, 'cr-C: star reachable scenario complete');
  assert(callCr(starOk, compStar).failures.length === 0, 'cr-D: star no failures');

  // Broken — workstation moved to a different subnet with no router
  const starBroken = JSON.parse(JSON.stringify(starOk));
  starBroken.devices[2].config.ip = '10.0.0.20';
  starBroken.devices[2].config.mask = 24;
  delete starBroken.devices[2].config.gateway;
  const brokenResult = callCr(starBroken, compStar);
  assert(brokenResult.complete === false, 'cr-E: broken scenario incomplete');
  assert(brokenResult.failures.length > 0, 'cr-F: broken scenario reports failures');
  assert(brokenResult.failures[0].reason && brokenResult.failures[0].failedAt, 'cr-G: failures carry reason + failedAt');

  // No matching device for a type-pair → graceful handling
  const noServer = { devices:[{ id:'sw', type:'switch' }], cables:[] };
  const compNoServer = { requiredCables: [{ from:'switch', to:'server' }] };
  const noSrvResult = callCr(noServer, compNoServer);
  assert(typeof noSrvResult.complete === 'boolean', 'cr-H: no-representative-device returns boolean complete');
})();

// ─── Topology Builder v3 Phase 3 structural guards (10 asserts) ─────────
(function _tbv3Phase3StructuralGuards() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  let tbv3SrcP3g = "";
  try { tbv3SrcP3g = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }
  let tbv3CssP3g = "";
  try { tbv3CssP3g = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.css'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  test('phase3: parseCidr + inSameSubnet + routeNextHop + computePath + computeReachability exposed',
    tbv3SrcP3g.includes('parseCidr: parseCidr') &&
    tbv3SrcP3g.includes('inSameSubnet: inSameSubnet') &&
    tbv3SrcP3g.includes('routeNextHop: routeNextHop') &&
    tbv3SrcP3g.includes('computePath: computePath') &&
    tbv3SrcP3g.includes('computeReachability: computeReachability'));

  test('phase3: diagnostic drawer fns exposed',
    tbv3SrcP3g.includes('_openDiagnostic: _openDiagnostic') &&
    tbv3SrcP3g.includes('_closeDiagnostic: _closeDiagnostic') &&
    tbv3SrcP3g.includes('_renderDiagnosticDrawer: _renderDiagnosticDrawer'));

  test('phase3: diagnostic drawer CSS scoped', tbv3CssP3g.includes('#page-topology-builder-v3 .tb3-diagnostic'));

  test('phase3: drawer scroll constraints present (v5.9.1 lesson)',
    /\.tb3-diagnostic[^}]*min-height:\s*0/.test(tbv3CssP3g) &&
    /\.tb3-diagnostic[^}]*overflow:\s*hidden/.test(tbv3CssP3g) &&
    /tb3-diagnostic-list[^}]*min-height:\s*0/.test(tbv3CssP3g));

  test('phase3: 5 failure-reason templates present',
    tbv3SrcP3g.includes("'no-ip'") &&
    tbv3SrcP3g.includes("'no-gateway'") &&
    tbv3SrcP3g.includes("'no-route'") &&
    tbv3SrcP3g.includes("'no-cable-path'") &&
    tbv3SrcP3g.includes("'no-router-between'"));

  test('phase3: Inspector L3 fields render block present',
    tbv3SrcP3g.includes('tb3-insp-ip') &&
    tbv3SrcP3g.includes('tb3-insp-mask') &&
    tbv3SrcP3g.includes('tb3-insp-gw'));

  test('phase3: Inspector interface block present',
    tbv3SrcP3g.includes('tb3-insp-iface-row') &&
    tbv3SrcP3g.includes('tb3-insp-iface-add'));

  test('phase3: Inspector L2 caption present', tbv3SrcP3g.includes('Layer-2 device'));

  test('phase3: _autoFillIp helper present', tbv3SrcP3g.includes('function _autoFillIp'));

  test('phase3: all scenarios carry IP config or interfaces', (function () {
    const sandbox = {};
    (new Function('window', tbv3SrcP3g))(sandbox);
    const f = sandbox._certanvilFeatures['topology-builder-v3'];
    const L3 = ['router','l3-switch','firewall','vpn','cloud','internet'];
    const ENDPOINT = ['workstation','server','laptop','smartphone'];
    let n = 0;
    f.TB_V3_SCENARIOS.forEach(function (s) {
      const ok = s.startingState.devices.some(function (d) {
        if (L3.indexOf(d.type) !== -1) return Array.isArray(d.interfaces) && d.interfaces.length > 0;
        if (ENDPOINT.indexOf(d.type) !== -1) return d.config && d.config.ip;
        return true; // L2 stays unconfigured by design
      });
      if (ok) n++;
    });
    return n === f.TB_V3_SCENARIOS.length;
  })());
})();

(function _tbv3Phase4Fixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  let tbv3SrcP4 = "";
  try { tbv3SrcP4 = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  test('phase4: Simulate pill is no longer locked in _renderModeBar',
    !/\{\s*id:\s*'simulate',[^}]*locked:\s*true/.test(tbv3SrcP4));

  test('phase4: _renderSimulatePanel is defined',
    /function\s+_renderSimulatePanel\s*\(/.test(tbv3SrcP4));
  test('phase4: _openSimulate is defined',
    /function\s+_openSimulate\s*\(/.test(tbv3SrcP4));
  test('phase4: _closeSimulate is defined',
    /function\s+_closeSimulate\s*\(/.test(tbv3SrcP4));

  // Stage 2 guards
  test('phase4: device-drag mousedown bails on Simulate mode',
    /if\s*\(\s*state\.mode\s*===\s*'simulate'\s*\)\s*return/.test(tbv3SrcP4));
  test('phase4: _closeSimulate is called from each other rail-open path (Picker + Inspector + Drawer + Esc)',
    (tbv3SrcP4.match(/_closeSimulate\(\);/g) || []).length >= 4);

  // Stage 3 guards
  test('phase4: canvas click handler dispatches to Simulate-mode device picker',
    /state\.mode\s*===\s*'simulate'[\s\S]{0,400}closest\('\.tb3-dev'\)/.test(tbv3SrcP4));

  // Stage 4 guards
  test('phase4: animation engine + 3 per-protocol motion fns defined',
    /function\s+_motionPing\s*\(|var\s+_motionPing\s*=/.test(tbv3SrcP4) &&
    /function\s+_motionArp\s*\(|var\s+_motionArp\s*=/.test(tbv3SrcP4) &&
    /function\s+_motionDhcp\s*\(|var\s+_motionDhcp\s*=/.test(tbv3SrcP4) &&
    /function\s+_animatePacket\s*\(/.test(tbv3SrcP4)
  );
  test(
    'phase4: failure UX uses _failDevice + Phase 3 REACH_REASON_TEMPLATES',
    /_failDevice\s*\(/.test(tbv3SrcP4) && /REACH_REASON_TEMPLATES/.test(tbv3SrcP4)
  );

  // Stage 10.1 guards — reduced-motion paths
  test(
    'phase4: _reducedMotion check is used in motion fns',
    /_reducedMotion\s*\(\s*\)/.test(tbv3SrcP4)
  );

  test(
    'phase4: reduced-motion CSS gate covers packet + dev-failing + panel',
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?(tb3-dev-failing|tb3-packet|tb3-simulate-panel)/m.test(tbv3Css)
  );

  // Stage 10.2 guards — _simState schema + no-localStorage tombstone
  test(
    'phase4: _simState declares all expected keys',
    /var\s+_simState\s*=\s*\{[\s\S]*?drillSrcId[\s\S]*?drillDstId[\s\S]*?drillProtocol[\s\S]*?previewQueue[\s\S]*?currentPacket[\s\S]*?log[\s\S]*?playing/.test(tbv3SrcP4)
  );

  test(
    'phase4: _simState is module-scope only — no localStorage writes (ephemeral-state tombstone)',
    !/STORAGE\.[A-Z_]+\s*=[^;]*_simState/.test(tbv3SrcP4) &&
    !/localStorage\.[a-z]+Item\(['"]_simState/.test(tbv3SrcP4) &&
    !/localStorage\.[a-z]+Item\(['"]nplus_tb_v3_sim/.test(tbv3SrcP4)
  );
})();

// ═══════════════════════════════════════════════════════════════
// TB v3 Phase 5 (Trace mode) fixtures
// ═══════════════════════════════════════════════════════════════

(function _tbv3Phase5Fixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  let tbv3SrcP5 = "";
  try { tbv3SrcP5 = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  // ───── Stage 1: _traceState schema + pure-fn stubs ─────

  test('phase5: _traceState module-scope var declared',
    /var\s+_traceState\s*=\s*null\b/.test(tbv3SrcP5));

  test('phase5: _initTraceState defined',
    /function\s+_initTraceState\s*\(/.test(tbv3SrcP5));

  test('phase5: _resetTraceState defined',
    /function\s+_resetTraceState\s*\(/.test(tbv3SrcP5));

  // Schema fields locked per spec §5
  const initBody = _fnBody(tbv3SrcP5, '_initTraceState');

  test('phase5: _initTraceState declares srcId/dstId/protocol pair fields',
    /srcId:[\s\S]{0,80}dstId:[\s\S]{0,80}protocol:/.test(initBody));

  test('phase5: protocol defaults to ping',
    /protocol:\s*\(payload && payload\.protocol\)\s*\|\|\s*['"]ping['"]/.test(initBody));

  test('phase5: _initTraceState declares hops/reasons/failedAt path fields',
    /hops:\s*\[\][\s\S]{0,80}reasons:\s*\{\}[\s\S]{0,80}failedAt:\s*null/.test(initBody));

  test('phase5: _initTraceState declares currentHopIdx + mode + autoplayTimer',
    /currentHopIdx:\s*0[\s\S]{0,120}mode:\s*['"]idle['"][\s\S]{0,120}autoplayTimer:\s*null/.test(initBody));

  test('phase5: _initTraceState declares rafHandle (emil §8.6 interruptibility)',
    /rafHandle:\s*null/.test(initBody));

  test('phase5: _initTraceState declares packet + lastPayload',
    /packet:\s*null[\s\S]{0,200}lastPayload:\s*payload\s*\|\|\s*null/.test(initBody));

  const resetBody = _fnBody(tbv3SrcP5, '_resetTraceState');

  test('phase5: _resetTraceState cancels autoplayTimer',
    /clearTimeout\(_traceState\.autoplayTimer\)/.test(resetBody));

  test('phase5: _resetTraceState cancels rafHandle (emil §8.6 — both handles must clear)',
    /cancelAnimationFrame\(_traceState\.rafHandle\)/.test(resetBody));

  test('phase5: _resetTraceState despawns packet via Phase 4 helper',
    /_despawnPacket\(_traceState\.packet\)/.test(resetBody));

  test('phase5: _resetTraceState sets _traceState back to null',
    /_traceState\s*=\s*null/.test(resetBody));

  // Tombstones — Phase 5 state is transient like _simState
  test('phase5: _traceState transient — no STORAGE namespace key references trace state',
    !/STORAGE\.[A-Z_]*TRACE/.test(tbv3SrcP5));

  test('phase5: _traceState transient — no nplus_tb_v3_trace localStorage key',
    !/nplus_tb_v3_trace/.test(tbv3SrcP5));

  // ───── Stage 2: Modebar pill + open/close lifecycle ─────

  test('phase5: Trace pill is no longer locked in _renderModeBar',
    !/\{\s*id:\s*'trace',[^}]*locked:\s*true/.test(tbv3SrcP5));

  test('phase5: _renderModeBar click handler dispatches trace to _openTrace',
    /mode\s*===\s*['"]trace['"][\s\S]{0,80}_openTrace\(\)/.test(tbv3SrcP5));

  test('phase5: _openTrace defined and accepts payload',
    /function\s+_openTrace\s*\(\s*payload\s*\)/.test(tbv3SrcP5));

  test('phase5: _closeTrace defined',
    /function\s+_closeTrace\s*\(\s*\)/.test(tbv3SrcP5));

  test('phase5: _renderTracePanel defined (Stage 2 stub — controls/hops/anno ship in Stages 3/5/7)',
    /function\s+_renderTracePanel\s*\(/.test(tbv3SrcP5));

  // Cross-rail mutex (5 fns now: Inspector via _selectDevice, Picker, Diagnostic, Simulate, Trace)
  test('phase5: _openTrace closes other 4 rail panels (cross-rail mutex)',
    /body\.classList\.remove\(['"]picker-open['"]\)[\s\S]{0,400}body\.classList\.remove\(['"]inspector-open['"]\)[\s\S]{0,400}body\.classList\.remove\(['"]diagnostic-open['"]\)[\s\S]{0,400}body\.classList\.remove\(['"]simulate-open['"]\)/.test(_fnBody(tbv3SrcP5, '_openTrace')));

  test('phase5: _openTrace adds body.trace-open class',
    /body\.classList\.add\(['"]trace-open['"]\)/.test(_fnBody(tbv3SrcP5, '_openTrace')));

  test('phase5: _openTrace sets state.mode = "trace"',
    /state\.mode\s*=\s*['"]trace['"]/.test(_fnBody(tbv3SrcP5, '_openTrace')));

  test('phase5: _openTrace calls _initTraceState with payload',
    /_initTraceState\(payload/.test(_fnBody(tbv3SrcP5, '_openTrace')));

  test('phase5: _closeTrace removes body.trace-open + sets state.mode = "design"',
    /body\.classList\.remove\(['"]trace-open['"]\)[\s\S]{0,300}state\.mode\s*=\s*['"]design['"]/.test(_fnBody(tbv3SrcP5, '_closeTrace')));

  test('phase5: _closeTrace invokes _resetTraceState',
    /_resetTraceState\(\)/.test(_fnBody(tbv3SrcP5, '_closeTrace')));

  test('phase5: Esc key closes Trace when body.trace-open is set',
    /classList\.contains\(['"]trace-open['"]\)[\s\S]{0,100}_closeTrace\(\)/.test(_fnBody(tbv3SrcP5, '_wireGlobalKeys')));

  // Cross-rail symmetric — each other _open* fn now closes Trace
  test('phase5: Cross-rail mutex — _openPicker closes Trace',
    /_closeTrace\(\)/.test(_fnBody(tbv3SrcP5, '_openPicker')));

  test('phase5: Cross-rail mutex — _openDiagnostic closes Trace',
    /_closeTrace\(\)/.test(_fnBody(tbv3SrcP5, '_openDiagnostic')));

  test('phase5: Cross-rail mutex — _openSimulate calls _closeTrace() (Stage 12 — full teardown, not just class toggle)',
    /_closeTrace\(\)/.test(_fnBody(tbv3SrcP5, '_openSimulate')));

  test('phase5: Cross-rail mutex — _selectDevice closes Trace',
    /_closeTrace\(\)/.test(_fnBody(tbv3SrcP5, '_selectDevice')));

  // Feature module registration
  test('phase5: _openTrace exposed on feature module registration',
    /_openTrace:\s*_openTrace/.test(tbv3SrcP5));

  test('phase5: _closeTrace exposed on feature module registration',
    /_closeTrace:\s*function/.test(tbv3SrcP5));

  // Static panel DOM
  test('phase5: static #tb3-trace-panel aside emitted in workspace HTML',
    /id="tb3-trace-panel"/.test(tbv3SrcP5));

  test('phase5: trace panel has close button',
    /id="tb3-trace-close"/.test(tbv3SrcP5));

  test('phase5: trace panel has eyebrow + title + 3 section hosts (controls/hops/annotation)',
    /tb3-trace-eyebrow[\s\S]{0,200}tb3-trace-title[\s\S]{0,300}tb3-trace-controls-host[\s\S]{0,200}tb3-trace-hops-host[\s\S]{0,200}tb3-trace-annotation-host/.test(tbv3SrcP5));

  // ───── Stage 2: Scoped CSS ─────

  let tbv3CssP5 = "";
  try { tbv3CssP5 = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.css'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  test('phase5: #tb3-trace-panel CSS rules present',
    /#tb3-trace-panel\s*\{/.test(tbv3CssP5));

  test('phase5: body.trace-open shows panel via translateX(0)',
    /\.trace-open\s+#tb3-trace-panel[\s\S]{0,200}translateX\(0\)/.test(tbv3CssP5));

  test('phase5: panel slide-in 240ms (open) per emil §8.6',
    /#tb3-trace-panel[\s\S]{0,400}transition:\s*transform\s+240ms/.test(tbv3CssP5));

  test('phase5: --tb3-ease-out cubic-bezier token locked',
    /--tb3-ease-out:\s*cubic-bezier\(\s*0\.23\s*,\s*1\s*,\s*0\.32\s*,\s*1\s*\)/.test(tbv3CssP5));

  test('phase5: --tb3-ease-in-out cubic-bezier token locked',
    /--tb3-ease-in-out:\s*cubic-bezier\(\s*0\.77\s*,\s*0\s*,\s*0\.175\s*,\s*1\s*\)/.test(tbv3CssP5));

  test('phase5: #tb3-trace-close has scale(0.97) on :active (emil §8.6 press feedback)',
    /#tb3-trace-close:active[\s\S]{0,200}transform:\s*scale\(0\.97\)/.test(tbv3CssP5));

  test('phase5: hover state gated @media (hover: hover) and (pointer: fine) (emil §8.6)',
    /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)[\s\S]{0,400}#tb3-trace-close:hover/.test(tbv3CssP5));

  test('phase5: focus-visible 2px accent outline on close button',
    /#tb3-trace-close:focus-visible[\s\S]{0,200}outline:\s*2px\s+solid\s+var\(--tb3-accent\)/.test(tbv3CssP5));

  test('phase5: reduced-motion gate neutralizes #tb3-trace-panel transition',
    /prefers-reduced-motion:\s*reduce[\s\S]{0,800}#tb3-trace-panel[\s\S]{0,200}transition:\s*none/.test(tbv3CssP5));

  // ───── Stage 4: _startTrace + computePath integration ─────

  test('phase5: _startTrace function defined',
    /function _startTrace\(\)/.test(tbv3SrcP5));

  test('phase5: _startTrace calls computePath with srcId, dstId, state',
    /computePath\(_traceState\.srcId, _traceState\.dstId, state\)/.test(tbv3SrcP5));

  test('phase5: _startTrace populates hops from result.hops (NOT result.path — spec §10)',
    /Array\.isArray\(result\.hops\)/.test(tbv3SrcP5));

  test('phase5: _startTrace spawns amber packet (Phase 4 helper reuse)',
    /_spawnPacketSvg\('amber'\)/.test(tbv3SrcP5));

  // ───── Stage 6: _stepTrace + _movePacketTracked + settle pulse ─────

  test('phase5: _stepTrace function defined',
    /function _stepTrace\(\)/.test(tbv3SrcP5));

  test('phase5: _stepTrace cancels prior rAF before new step (emil §8.6 interruptibility)',
    /cancelAnimationFrame\(_traceState\.rafHandle\)/.test(tbv3SrcP5));

  test('phase5: _stepTrace uses _movePacketTracked wrapper for rAF capture',
    /_movePacketTracked\(_traceState\.packet/.test(tbv3SrcP5));

  test('phase5: step 250ms vs autoplay 600ms (spec §8.1 + §8.2)',
    /durMs\s*=\s*isAutoplay\s*\?\s*600\s*:\s*250/.test(tbv3SrcP5));

  // ───── Stage 7: _renderTraceAnnotation + locked copy ─────

  test('phase5: locked action copy — source emits ICMP echo (stop-slop §7.4)',
    /Originates ICMP echo request/.test(tbv3SrcP5));

  test('phase5: locked action copy — destination receives + replies (stop-slop §7.4)',
    /Receives ICMP echo, sends reply/.test(tbv3SrcP5));

  test('phase5: firewall action copy locked (stop-slop §7.4 — was "Inspects + forwards")',
    /Filters and forwards/.test(tbv3SrcP5));

  test('phase5: tombstone — "Inspects + forwards" replaced by "Filters and forwards"',
    !/Inspects \+ forwards/.test(tbv3SrcP5));

  test('phase5: firewall reason copy locked (stop-slop §7.4 — period breaks the chain)',
    /Permits per policy\. Egress/.test(tbv3SrcP5));

  // ───── Stage 8: _playTrace + _pauseTrace + _endTrace ─────

  test('phase5: _playTrace function defined',
    /function _playTrace\(\)/.test(tbv3SrcP5));

  test('phase5: autoplay uses 600ms hop + 120ms gap (spec §8.2)',
    /setTimeout\(tick,\s*600\s*\+\s*120\)/.test(tbv3SrcP5));

  test('phase5: _pauseTrace function defined',
    /function _pauseTrace\(\)/.test(tbv3SrcP5));

  test('phase5: _pauseTrace clears autoplayTimer',
    /clearTimeout\(_traceState\.autoplayTimer\)/.test(tbv3SrcP5));

  test('phase5: _pauseTrace also cancels rafHandle (emil §8.6 — both timers must clear)',
    /cancelAnimationFrame\(_traceState\.rafHandle\)/.test(tbv3SrcP5));

  // ───── Stage 9: _failHop + auto-pause + reason copy ─────

  test('phase5: _failHop function defined with hopIdx + reasonText params',
    /function _failHop\(hopIdx, reasonText\)/.test(tbv3SrcP5));

  test('phase5: _failHop reuses Phase 4 _failDevice (shake + glow)',
    /_failDevice\(hopId,\s*reasonText/.test(tbv3SrcP5));

  test('phase5: _failHop auto-pauses autoplay on failure (spec §3.5)',
    /_traceState\.mode === 'play'[\s\S]{0,300}_traceState\.mode = 'paused'/.test(tbv3SrcP5));

  // ───── Stage 10: Per-hop canvas badge ─────

  test('phase5: _updateHopBadge function defined',
    /function _updateHopBadge\(\)/.test(tbv3SrcP5));

  test('phase5: badge SVG group uses .tb3-trace-badge class',
    /classList\.add\('tb3-trace-badge'\)/.test(tbv3SrcP5));

  test('phase5: badge adds .is-failed class when on failedAt hop',
    /isFailed[\s\S]{0,200}classList\.add\('is-failed'\)/.test(tbv3SrcP5));

  // ───── Stage 12: Cross-rail mutex symmetry forEach lock ─────

  ['_selectDevice', '_openPicker', '_openDiagnostic', '_openSimulate'].forEach(function (fname) {
    test('phase5: cross-rail symmetry — ' + fname + ' calls _closeTrace() (Stage 12 forEach lock)',
      /_closeTrace\(\)/.test(_fnBody(tbv3SrcP5, fname)));
  });

  // ───── Stage 11: Sim→Trace handoff (failed-row chevron) ─────

  test('phase5: Sim→Trace chevron class emitted in _renderSimLog',
    /tb3-sim-log-trace-this/.test(tbv3SrcP5));

  test('phase5: chevron conditional on entry.failure AND entry.pair (failed-only per spec §3.8)',
    /entry\.failure && entry\.pair/.test(tbv3SrcP5));

  test('phase5: _motionPing failure entry includes pair.path for handoff',
    /pair:\s*\{[\s\S]{0,200}path:/.test(tbv3SrcP5));

  test('phase5: chevron click unpacks srcId/dstId from pair.path (spec §9.2)',
    /entry\.pair\.path\[0\][\s\S]{0,200}entry\.pair\.path\[entry\.pair\.path\.length - 1\]/.test(tbv3SrcP5));

  // ───── Stage 13: §12.1 consolidation guards ─────

  test('phase5: _renderTracePanel emits #tb3-trace-panel',
    /id\s*=\s*['"]?tb3-trace-panel['"]?/.test(tbv3SrcP5));

  // _renderTraceControls emits src/dst dropdowns + 4 buttons
  (function () {
    const ctrlBody = _fnBody(tbv3SrcP5, '_renderTraceControls');
    test('phase5: src dropdown emitted (#tb3-trace-src)',
      /tb3-trace-src/.test(ctrlBody));
    test('phase5: dst dropdown emitted (#tb3-trace-dst)',
      /tb3-trace-dst/.test(ctrlBody));
    test('phase5: Start button emitted (#tb3-trace-start)',
      /tb3-trace-start/.test(ctrlBody));
    test('phase5: Next button emitted (#tb3-trace-next)',
      /tb3-trace-next/.test(ctrlBody));
    test('phase5: Play button emitted (#tb3-trace-play)',
      /tb3-trace-play/.test(ctrlBody));
    test('phase5: End button emitted (#tb3-trace-end)',
      /tb3-trace-end/.test(ctrlBody));
    test('phase5: End button labeled "End trace" (stop-slop §7.4)',
      /End trace/.test(ctrlBody));
    test('phase5: tombstone — bare "End" button label must not return',
      !/['"]End['"]$/m.test(ctrlBody));
  })();

  // _renderHopList emits .is-current / .is-failed / .is-done states
  (function () {
    const hlBody = _fnBody(tbv3SrcP5, '_renderHopList');
    test('phase5: hop list .is-current state',
      /is-current/.test(hlBody));
    test('phase5: hop list .is-failed state',
      /is-failed/.test(hlBody));
    test('phase5: hop list .is-done state',
      /is-done/.test(hlBody));
  })();

  // _renderTraceAnnotation emits OSI chip + action + reason
  (function () {
    const annoBody = _fnBody(tbv3SrcP5, '_renderTraceAnnotation');
    test('phase5: annotation OSI chip class',
      /tb3-trace-anno-osi/.test(annoBody));
    test('phase5: annotation action class',
      /tb3-trace-anno-action/.test(annoBody));
    test('phase5: annotation reason class',
      /tb3-trace-anno-reason/.test(annoBody));
  })();

  // Reduced-motion CSS gate present
  test('phase5: reduced-motion gate applied to .tb3-trace-* rules',
    /prefers-reduced-motion: reduce[\s\S]{0,2000}tb3-trace/.test(tbv3CssP5));

  // Trace modebar pill — emitted via template concat data-mode="' + m.id + '"
  // where the modes array carries { id: 'trace', label: 'Trace', ... }
  test('phase5: modebar Trace pill entry in modes array',
    /\{\s*id:\s*['"]trace['"]\s*,\s*label:\s*['"]Trace['"]/.test(tbv3SrcP5));

})();

// ═══════════════════════════════════════════════════════════════
// TB v3 Phase 6 (OSI mode) fixtures
// ═══════════════════════════════════════════════════════════════

(function _tbv3Phase6Fixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  let tbv3SrcP6 = "";
  try { tbv3SrcP6 = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features/topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }
  let tbv3CssP6 = "";
  try { tbv3CssP6 = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features/topology-builder-v3.css'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  // ---- _initTraceState carries osiAnimHandle: null ----
  function loadTraceStateP6() {
    const initBody = _fnBody(tbv3SrcP6, '_initTraceState');
    const sandbox = {
      _traceState: null,
      _despawnPacket: function () {},
      clearTimeout: function () {},
      cancelAnimationFrame: function () {}
    };
    vm.runInNewContext(
      initBody + '\n' +
      '_initTraceState(null);\n' +
      '__out = _traceState;',
      sandbox
    );
    return sandbox.__out;
  }

  {
    const s = loadTraceStateP6();
    test('P6: _traceState carries osiAnimHandle field', s && Object.prototype.hasOwnProperty.call(s, 'osiAnimHandle'));
    test('P6: osiAnimHandle defaults to null', s && s.osiAnimHandle === null);
  }

  // ---- _resetTraceState cancels osiAnimHandle (mirror rafHandle) ----
  test(
    'P6: _resetTraceState cancels osiAnimHandle via cancelAnimationFrame',
    /_resetTraceState[\s\S]{0,400}cancelAnimationFrame\(\s*_traceState\.osiAnimHandle\s*\)/.test(tbv3SrcP6)
  );

  // ---- _stepTrace top-of-fn cancels osiAnimHandle ----
  test(
    'P6: _stepTrace top-of-fn cancels both rafHandle AND osiAnimHandle',
    /_stepTrace[\s\S]{0,600}cancelAnimationFrame\(\s*_traceState\.rafHandle\s*\)[\s\S]{0,400}cancelAnimationFrame\(\s*_traceState\.osiAnimHandle\s*\)/.test(tbv3SrcP6)
  );

  // ---- _pauseTrace + _endTrace clear osiAnimHandle ----
  test(
    'P6: _pauseTrace clears osiAnimHandle',
    /_pauseTrace[\s\S]{0,600}_traceState\.osiAnimHandle\s*=\s*null/.test(tbv3SrcP6)
  );
  test(
    'P6: _endTrace clears osiAnimHandle',
    /_endTrace[\s\S]{0,600}_traceState\.osiAnimHandle\s*=\s*null/.test(tbv3SrcP6)
  );

  // ---- 'osi' is a valid state.mode value (modebar pill no longer locked) ----
  test(
    "P6: modebar OSI pill no longer carries locked:true",
    !/id:\s*'osi'[\s\S]{0,400}locked:\s*true/.test(tbv3SrcP6)
  );

  // ---- Stage 2: _openOSI / _closeOSI lifecycle ----
  test(
    'P6: _openOSI defined',
    /function\s+_openOSI\s*\(/.test(tbv3SrcP6)
  );
  test(
    'P6: _openOSI guards _openTrace with alreadyInTrace then sets state.mode = "osi"',
    /_openOSI[\s\S]{0,600}alreadyInTrace[\s\S]{0,200}_openTrace[\s\S]{0,200}state\.mode\s*=\s*'osi'/.test(tbv3SrcP6)
  );
  test(
    "P6: _openOSI adds 'osi-open' to #tb3-body element",
    /_openOSI[\s\S]{0,600}classList\.add\('osi-open'\)/.test(tbv3SrcP6)
  );
  test(
    'P6: _closeOSI removes osi-open + delegates to _closeTrace',
    /_closeOSI[\s\S]{0,200}classList\.remove\('osi-open'\)[\s\S]{0,100}_closeTrace\s*\(/.test(tbv3SrcP6)
  );
  test(
    'P6: modebar wires osi branch to _openOSI',
    /mode\s*===\s*'osi'[\s\S]{0,80}_openOSI\s*\(/.test(tbv3SrcP6)
  );

  // Expose tbv3SrcP6 + tbv3CssP6 for downstream Phase 6 stages by reusing this block.

  // ---- Stage 3: _genMockMac determinism + format ----
  function loadGenMockMac() {
    const fnBody = _fnBody(tbv3SrcP6, '_genMockMac');
    const sandbox = { __out: null };
    vm.runInNewContext(
      fnBody + '\n' +
      '__out = {\n' +
      '  a1: _genMockMac("dev_a"),\n' +
      '  a2: _genMockMac("dev_a"),\n' +
      '  b:  _genMockMac("dev_b"),\n' +
      '  empty: _genMockMac(""),\n' +
      '  null:  _genMockMac(null)\n' +
      '};',
      sandbox
    );
    return sandbox.__out;
  }

  {
    const out = loadGenMockMac();
    test('P6: _genMockMac returns locally-administered MAC prefix 02:00:00:',
      out && /^02:00:00:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}$/.test(out.a1)
    );
    test('P6: _genMockMac is deterministic (same input → same MAC)',
      out && out.a1 === out.a2
    );
    test('P6: _genMockMac is injective on distinct ids',
      out && out.a1 !== out.b
    );
    test('P6: _genMockMac handles empty string defensively',
      out && /^02:00:00:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}$/.test(out.empty)
    );
    test('P6: _genMockMac handles null defensively',
      out && /^02:00:00:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}$/.test(out.null)
    );
  }

  // ---- Stage 4: _activeLayersForDev shape per role ----
  function loadActiveLayers() {
    const fnBody = _fnBody(tbv3SrcP6, '_activeLayersForDev');
    const sandbox = { __out: null };
    vm.runInNewContext(
      fnBody + '\n' +
      '__out = {\n' +
      '  pc:          _activeLayersForDev({type:"pc"}),\n' +
      '  server:      _activeLayersForDev({type:"server"}),\n' +
      '  laptop:      _activeLayersForDev({type:"laptop"}),\n' +
      '  smartphone:  _activeLayersForDev({type:"smartphone"}),\n' +
      '  switch:      _activeLayersForDev({type:"switch"}),\n' +
      '  router:      _activeLayersForDev({type:"router"}),\n' +
      '  l3switch:    _activeLayersForDev({type:"l3-switch"}),\n' +
      '  firewall:    _activeLayersForDev({type:"firewall"}),\n' +
      '  vpn:         _activeLayersForDev({type:"vpn"})\n' +
      '};',
      sandbox
    );
    return sandbox.__out;
  }

  {
    let out = null;
    try { out = loadActiveLayers(); } catch(e) { /* function not yet implemented */ }
    function eq(a, b) { return a && b && JSON.stringify(a.slice().sort()) === JSON.stringify(b.slice().sort()); }
    test('P6: endpoint pc active = [1,2,3,7] (ICMP)', out && eq(out.pc, [1,2,3,7]));
    test('P6: endpoint server active = [1,2,3,7]', out && eq(out.server, [1,2,3,7]));
    test('P6: endpoint laptop active = [1,2,3,7]', out && eq(out.laptop, [1,2,3,7]));
    test('P6: endpoint smartphone active = [1,2,3,7]', out && eq(out.smartphone, [1,2,3,7]));
    test('P6: switch active = [1,2]', out && eq(out.switch, [1,2]));
    test('P6: router active = [1,2,3]', out && eq(out.router, [1,2,3]));
    test('P6: l3-switch active = [1,2,3]', out && eq(out.l3switch, [1,2,3]));
    test('P6: firewall active = [1,2,3]', out && eq(out.firewall, [1,2,3]));
    test('P6: vpn active = [1,2,3]', out && eq(out.vpn, [1,2,3]));
  }

  // ---- Stage 4: locked stop-slop verb templates per spec §7.4 ----
  test("P6: locked verb 'Originates ICMP echo request'",
    tbv3SrcP6.includes("'Originates ICMP echo request'")
  );
  test("P6: locked verb 'Receives ICMP echo, sends reply'",
    tbv3SrcP6.includes("'Receives ICMP echo, sends reply'")
  );
  test("P6: locked verb 'n/a — ICMP runs directly on IP'",
    tbv3SrcP6.includes("'n/a — ICMP runs directly on IP'")
  );
  test("P6: locked verb 'Wraps payload with source/dest IP'",
    tbv3SrcP6.includes("'Wraps payload with source/dest IP'")
  );
  test("P6: locked verb 'Forwards via routing table'",
    tbv3SrcP6.includes("'Forwards via routing table'")
  );
  test("P6: locked verb 'Filters per policy. Forwards via routing table' (period load-bearing)",
    tbv3SrcP6.includes("'Filters per policy. Forwards via routing table'")
  );
  test("P6: locked verb 'Accepts packet for own IP'",
    tbv3SrcP6.includes("'Accepts packet for own IP'")
  );
  test("P6: locked verb 'Frames with source/next-hop MAC'",
    tbv3SrcP6.includes("'Frames with source/next-hop MAC'")
  );
  test("P6: locked verb 'Forwards via MAC table'",
    tbv3SrcP6.includes("'Forwards via MAC table'")
  );
  test("P6: locked verb 'Rewrites frame with own MAC + next-hop MAC'",
    tbv3SrcP6.includes("'Rewrites frame with own MAC + next-hop MAC'")
  );
  test("P6: locked verb 'Accepts frame for own MAC'",
    tbv3SrcP6.includes("'Accepts frame for own MAC'")
  );
  test("P6: locked verb 'Encodes frame as electrical signal'",
    tbv3SrcP6.includes("'Encodes frame as electrical signal'")
  );

  // ---- Tombstones: bare variants must NOT exist per spec §7.4 ----
  test("P6: tombstone — 'Wraps with IP' bare variant must not exist",
    !tbv3SrcP6.includes("'Wraps with IP'")
  );
  test("P6: tombstone — 'Rewrites MAC' bare variant must not exist",
    !tbv3SrcP6.includes("'Rewrites MAC'")
  );

  // ---- Stage 4: _hopRole returns 'source' | 'intermediate' | 'dest' ----
  function loadHopRole() {
    const fnBody = _fnBody(tbv3SrcP6, '_hopRole');
    const sandbox = {
      _traceState: { hops: ['a', 'b', 'c', 'd'] },
      __out: null
    };
    vm.runInNewContext(
      fnBody + '\n' +
      '__out = { src:_hopRole(0), mid:_hopRole(2), dst:_hopRole(3) };',
      sandbox
    );
    return sandbox.__out;
  }
  {
    let out = null;
    try { out = loadHopRole(); } catch(e) { /* function not yet implemented */ }
    test("P6: _hopRole returns 'source' at idx 0", out && out.src === 'source');
    test("P6: _hopRole returns 'intermediate' in middle", out && out.mid === 'intermediate');
    test("P6: _hopRole returns 'dest' at last idx", out && out.dst === 'dest');
  }

  // ---- Stage 4: _buildLayerStackForHop returns 7 rows ----
  test('P6: _buildLayerStackForHop is defined',
    /function\s+_buildLayerStackForHop\s*\(/.test(tbv3SrcP6)
  );

  // ---- Stage 5: _renderOSIPanel + dispatch ----
  test('P6: _renderOSIPanel is defined',
    /function\s+_renderOSIPanel\s*\(/.test(tbv3SrcP6)
  );
  test('P6: _renderTracePanel dispatches OSI vs annotation by state.mode',
    /state\.mode\s*===\s*'osi'[\s\S]{0,80}_renderOSIPanel\s*\([\s\S]{0,80}_renderTraceAnnotation\s*\(/.test(tbv3SrcP6)
  );
  test('P6: _renderOSIPanel emits <ol class="tb3-osi-stack">',
    /tb3-osi-stack/.test(tbv3SrcP6)
  );
  test('P6: _renderOSIPanel uses _escAttr only (no _escHtml)',
    !/_renderOSIPanel[\s\S]{0,2500}_escHtml/.test(tbv3SrcP6)
  );
  // ---- Stage 6: scoped CSS for OSI panel ----
  test('P6 CSS: .tb3-osi-panel scoped to #page-topology-builder-v3',
    /#page-topology-builder-v3\s+\.tb3-osi-panel/.test(tbv3CssP6)
  );
  test('P6 CSS: .tb3-osi-layer.is-active emits accent left-bar via ::before',
    /\.tb3-osi-layer\.is-active::before/.test(tbv3CssP6)
  );
  test('P6 CSS: .tb3-osi-layer.is-failure emits red tint',
    /\.tb3-osi-layer\.is-failure/.test(tbv3CssP6)
  );
  test('P6 CSS: tb3OSILayerSettle keyframe defined',
    /@keyframes\s+tb3OSILayerSettle/.test(tbv3CssP6)
  );
  test('P6 CSS: reduced-motion gates .tb3-osi-layer-firing',
    /prefers-reduced-motion[\s\S]{0,400}\.tb3-osi-layer-firing[\s\S]{0,200}animation:\s*none/.test(tbv3CssP6)
  );

  // ---- Stage 7: _failedReasonToLayer mapping per spec §8 ----
  function loadReasonMap() {
    const fnBody = _fnBody(tbv3SrcP6, '_failedReasonToLayer');
    if (!fnBody) return null;
    const sandbox = { __out: null };
    try {
      vm.runInNewContext(
        fnBody + '\n' +
        '__out = {\n' +
        '  noLink:           _failedReasonToLayer("no-link"),\n' +
        '  noCablePath:      _failedReasonToLayer("no-cable-path"),\n' +
        '  macNotFound:      _failedReasonToLayer("mac-not-found"),\n' +
        '  noL2Path:         _failedReasonToLayer("no-l2-path"),\n' +
        '  noIp:             _failedReasonToLayer("no-ip"),\n' +
        '  noGateway:        _failedReasonToLayer("no-gateway"),\n' +
        '  gatewayNotFound:  _failedReasonToLayer("gateway-not-found"),\n' +
        '  differentSubnet:  _failedReasonToLayer("different-subnet"),\n' +
        '  notL3:            _failedReasonToLayer("not-l3"),\n' +
        '  noRoute:          _failedReasonToLayer("no-route"),\n' +
        '  noRouterBetween:  _failedReasonToLayer("no-router-between"),\n' +
        '  unknown:          _failedReasonToLayer("totally-fake-reason"),\n' +
        '  nullReason:       _failedReasonToLayer(null)\n' +
        '};',
        sandbox
      );
    } catch (e) { return null; }
    return sandbox.__out;
  }

  {
    const out = loadReasonMap();
    test('P6: failure no-link → L1',          out && out.noLink === 1);
    test('P6: failure no-cable-path → L1',    out && out.noCablePath === 1);
    test('P6: failure mac-not-found → L2',    out && out.macNotFound === 2);
    test('P6: failure no-l2-path → L2',       out && out.noL2Path === 2);
    test('P6: failure no-ip → L3',            out && out.noIp === 3);
    test('P6: failure no-gateway → L3',       out && out.noGateway === 3);
    test('P6: failure gateway-not-found → L3', out && out.gatewayNotFound === 3);
    test('P6: failure different-subnet → L3', out && out.differentSubnet === 3);
    test('P6: failure not-l3 → L3',           out && out.notL3 === 3);
    test('P6: failure no-route → L3',         out && out.noRoute === 3);
    test('P6: failure no-router-between → L3', out && out.noRouterBetween === 3);
    test('P6: failure unknown defaults → L3', out && out.unknown === 3);
    test('P6: failure null defaults → L3',    out && out.nullReason === 3);
  }

  // ---- Stage 8: _animateEncap motion engine ----
  test('P6: _animateEncap is defined',
    /function\s+_animateEncap\s*\(/.test(tbv3SrcP6)
  );
  test('P6: _animateEncap captures rAF handle on osiAnimHandle',
    /_animateEncap[\s\S]{0,1500}_traceState\.osiAnimHandle\s*=\s*requestAnimationFrame/.test(tbv3SrcP6)
  );
  test('P6: _animateEncap calls _setOSILayerFiring per layer',
    /_animateEncap[\s\S]{0,1500}_setOSILayerFiring\s*\(/.test(tbv3SrcP6)
  );
  test('P6: _animateEncap reduced-motion fast-path lights all layers at once',
    /_animateEncap[\s\S]{0,400}_reducedMotion\s*\(\s*\)[\s\S]{0,200}forEach[\s\S]{0,80}_setOSILayerFiring/.test(tbv3SrcP6)
  );
  test('P6: _stepTrace dispatches OSI source role to _animateEncap',
    /_stepTrace[\s\S]{0,4000}state\.mode\s*===\s*'osi'[\s\S]{0,400}role\s*===\s*'source'[\s\S]{0,200}_animateEncap/.test(tbv3SrcP6)
  );

  // ---- Stage 9: _animateIntermediate motion engine ----
  test('P6: _animateIntermediate is defined',
    /function\s+_animateIntermediate\s*\(/.test(tbv3SrcP6)
  );
  test('P6: _animateIntermediate captures rAF on osiAnimHandle',
    /_animateIntermediate[\s\S]{0,2500}_traceState\.osiAnimHandle\s*=\s*requestAnimationFrame/.test(tbv3SrcP6)
  );
  test('P6: _animateIntermediate uses topLayer=2 for switch',
    /_animateIntermediate[\s\S]{0,500}deviceType\s*===\s*'switch'[\s\S]{0,200}topLayer\s*=\s*2/.test(tbv3SrcP6)
  );
  test('P6: _stepTrace dispatches OSI intermediate role to _animateIntermediate',
    /_stepTrace[\s\S]{0,4000}role\s*===\s*'intermediate'[\s\S]{0,200}_animateIntermediate/.test(tbv3SrcP6)
  );

  // ---- Stage 10: _animateDecap + reduced-motion coverage ----
  test('P6: _animateDecap is defined',
    /function\s+_animateDecap\s*\(/.test(tbv3SrcP6)
  );
  test('P6: _animateDecap captures rAF on osiAnimHandle',
    /_animateDecap[\s\S]{0,1500}_traceState\.osiAnimHandle\s*=\s*requestAnimationFrame/.test(tbv3SrcP6)
  );
  test('P6: _animateDecap sorts layers ascending (bottom-up L1 → L7)',
    /_animateDecap[\s\S]{0,800}sort\(function[\s\S]{0,80}return\s+a\s*-\s*b/.test(tbv3SrcP6)
  );
  test('P6: _stepTrace dispatches OSI dest role to _animateDecap',
    /_stepTrace[\s\S]{0,4000}role\s*===\s*'dest'[\s\S]{0,200}_animateDecap/.test(tbv3SrcP6)
  );

  // ---- Stage 11: 5-panel cross-rail mutex forEach lock ----
  // Every inspector-opener path (the 4 from Phase 5 + any new) MUST call
  // _closeTrace() AND _closeOSI() (the Trace mutex was Phase 5 Stage 12's
  // catch; OSI extends it). _openTrace itself does NOT call _closeOSI()
  // because they share state — switching between them is a mode flip.
  ['_selectDevice', '_openPicker', '_openDiagnostic', '_openSimulate'].forEach(function (openerName) {
    var body = _fnBody(tbv3SrcP6, openerName) || '';
    test(
      'P6 mutex: ' + openerName + ' calls _closeTrace()',
      /_closeTrace\s*\(/.test(body)
    );
    test(
      'P6 mutex: ' + openerName + ' calls _closeOSI()',
      /_closeOSI\s*\(/.test(body)
    );
  });

  // ---- Stage 11: _openTrace does NOT call _closeOSI (view-toggle invariant) ----
  {
    var openTraceBody = _fnBody(tbv3SrcP6, '_openTrace') || '';
    test(
      'P6 mutex: _openTrace does NOT call _closeOSI (Trace/OSI share state)',
      !/_closeOSI\s*\(/.test(openTraceBody)
    );
  }

  // ---- Stage 11: Esc handler closes OSI before Trace ----
  test(
    'P6 mutex: Esc handler closes osi-open before trace-open (more-specific first)',
    /classList\.contains\('osi-open'\)[\s\S]{0,200}_closeOSI[\s\S]{0,400}classList\.contains\('trace-open'\)[\s\S]{0,200}_closeTrace/.test(tbv3SrcP6)
  );
})();

