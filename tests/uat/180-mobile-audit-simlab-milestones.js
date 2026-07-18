// tests/uat/180-mobile-audit-simlab-milestones.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Mobile UX audit items, Why-Not drill, Sim Lab + Decision Lab structural pins, per-cert milestone storage, drills analytics

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── audit 1.6: >=44px tap targets on touch devices ──
(function(){
  const dg = read('dg-system.css');
  test('v7.x Tap targets >=44px coarse-pointer block present',
    /@media\s*\(hover:none\)\s*and\s*\(pointer:coarse\)\{[\s\S]{0,800}44px/.test(dg));
  test('v7.x Tap targets: .sb-mobile-toggle in touch block',
    /hover:none[\s\S]{0,2000}sb-mobile-toggle/.test(dg));
  test('v7.x Tap targets: .diag-conf-tier in touch block',
    /hover:none[\s\S]{0,2000}diag-conf-tier/.test(dg));
  test('v7.x Tap targets: .pass-plan-weak-btn in touch block',
    /hover:none[\s\S]{0,2000}pass-plan-weak-btn/.test(dg));
  test('v7.x Tap targets: .a2hs-banner-dismiss in touch block',
    /hover:none[\s\S]{0,2000}a2hs-banner-dismiss/.test(dg));
})();

// ── audit 1.7: sticky "Start today's session" CTA on Pass Plan result screen (phone-only) ──
(function(){
  const dg = read('dg-system.css');
  test('v7.x Pass Plan primary CTA is sticky on phones',
    /passplan-cta-bar/.test(js + html) && /@media\s*\(max-width:620px\)[\s\S]{0,500}passplan-cta-bar[\s\S]{0,200}position:sticky/.test(dg.replace(/\n/g,' ')));
  test('v7.x Pass Plan sticky CTA safe-area padding present',
    /passplan-cta-bar[\s\S]{0,400}safe-area-inset-bottom/.test(dg.replace(/\n/g,' ')));
  test('v7.x Pass Plan sticky CTA scoped to #page-diagnostic-result (desktop unchanged)',
    /#page-diagnostic-result\s*\.passplan-cta-bar/.test(dg));
})();

// ── audit 5: signed-out gate renders in-view sign-in prompt ──
(function(){
  test('v7.x Signed-out gate shows an in-view sign-in prompt (helper present)',
    /function _showSignInPrompt\b/.test(js));
  test('v7.x showSetupError scrolls the message into view (no off-screen gate)',
    /function showSetupError[\s\S]{0,500}scrollIntoView/.test(js));
})();

// ── audit 7: readiness card phone strip ──
(function(){
  const dg = read('dg-system.css');
  test('v7.x Readiness phone strip line present (markup + populated)',
    /readiness-strip-line/.test(html) && /rc-strip-text/.test(js));
  test('v7.x Readiness gauge hidden on phones',
    /@media\s*\(max-width:620px\)[\s\S]{0,600}readiness-bar-track[\s\S]{0,40}display:none/.test(dg.replace(/\n/g,' '))
    || /readiness-bar-track,?\s*[^{]*\{display:none/.test(dg.replace(/\n/g,' ')));
})();

// ── audit 8: phone home leads with Start action (bento reorder via CSS order) ──
(function(){
  const dg = read('dg-system.css');
  test('v7.x Phone Home leads with Start (cell-recommend order:1)',
    /@media\s*\(max-width:620px\)[\s\S]{0,1200}cell-recommend\{order:1/.test(dg.replace(/\n/g,' ')));
})();

// ── audit 9: phone-only collapsible home sections (Practice / Exam / Drill) ──
(function(){
  const dg = read('dg-system.css');
  test('v7.x Home Practice/Exam/Drill collapsible on phone (mechanism present)',
    /home-collaps/.test(js) || /home-collaps/.test(html) || /home-collaps/.test(dg));
  test('v7.x Home collapse is phone-gated (matchMedia 620 or max-width:620 css)',
    /matchMedia\(['"]\(max-width:\s*620px\)['"]\)/.test(js) || /@media\s*\(max-width:620px\)[\s\S]{0,800}home-collaps/.test(dg.replace(/\n/g,' ')));
})();

// ── audit 10: new-user Start tile shows "Start your first quiz" (10-Q mixed warm-up) ──
(function(){
  test('v7.x New-user Start = first-quiz 10-Q mixed (not weak-spots)',
    /loadHistory\(\)\.length\s*===\s*0/.test(js) && /Start your first quiz/.test(js));
})();

// ── v7.48.1: option-shape contract — renderMCQ reads q.options[letter], so
//    every AI sub-prompt that returns positional ARRAYS must letterize at
//    the boundary (the live 'undefined options' Gauntlet incident) ──
(function(){
  test('v7.48.1 OptShape: _letterizeOptions helper defined (array → {A..D})',
    /function _letterizeOptions\([\s\S]{0,300}String\.fromCharCode\(65/.test(js));
  test('v7.48.1 OptShape: gauntlet rung mapping letterizes options before the quiz engine',
    /options:\s*_letterizeOptions\(r\.options\)/.test(js));
  test('v7.48.1 OptShape: reworded variant assignment letterizes options',
    /q\.options\s*=\s*_letterizeOptions\(v\.options\)/.test(js));
  test('v7.48.1 OptShape: reword eligibility accepts house letter-keyed options (no Array.isArray-only filter)',
    /_optionCount\(q\.options\)\s*>=\s*3/.test(js));
  test('v7.48.1 OptShape: gauntlet run validation rejects non-string/empty option elements',
    /r\.options\.every\(o => typeof o === 'string' && o\.length > 0\)/.test(js));
})();

// ── v7.50.0: Why-Not — the second flagship drill ──
(function(){
  test('v7.50.0 WhyNot: core functions defined (start/fetch/picker/verdict)',
    js.includes('function startWhyNot(') && js.includes('async function _fetchWhyNotSession(') &&
    js.includes('function whyNotPickReason(') && js.includes('function renderWhyNotVerdict('));
  test('v7.50.0 WhyNot: finish() branches to the reason picker in whyNotMode',
    /function finish\(\)[\s\S]{0,900}whyNotMode && _wnSession[\s\S]{0,80}\) \{ _wnFinishQuestion\(\); return; \}/.test(js));
  test('v7.50.0 WhyNot: round question letterizes options before the quiz engine',
    /options: _letterizeOptions\(r\.options\),[\s\S]{0,400}_wnSession\.topic/.test(js) || /_wnBeginRound[\s\S]{0,800}_letterizeOptions\(r\.options\)/.test(js));
  test('v7.50.0 WhyNot: wrong-bank no-ops during sessions (parallel to bank/SR)',
    /function addToWrongBank\([\s\S]{0,700}whyNotMode !== 'undefined' && whyNotMode\) return;/.test(js));
  test('v7.50.0 WhyNot: follow-up drill suppressed in whyNot runs',
    /!gauntletMode && !whyNotMode && typeof followUpOnMistake/.test(js));
  test('v7.50.0 WhyNot: session validation pins 3 rounds + 2 factually-false fakes per wrong option',
    /WHY_NOT_ROUNDS = 3/.test(js) && /k\.fakes\) && k\.fakes\.length === 2/.test(js));
  test('v7.50.0 WhyNot: pages present (entry, round, verdict)',
    html.includes('id="page-whynot"') && html.includes('id="page-whynot-round"') && html.includes('id="page-whynot-verdict"'));
  test('v7.50.0 WhyNot: entries wired via data-action (Sec-P7, no inline onclick)',
    html.includes('data-action="startWhyNot"') && /data-action="whyNotPickReason"/.test(js));
})();

// ── v7.55.x: Sim Lab — structural pins (Task 11) ──
(function(){
  test('v7.56 Session: entry page present in index.html',
    html.includes('id="page-sim-lab-entry"'));
  test('v7.56 Session: result page present in index.html',
    html.includes('id="page-sim-lab-result"'));
  test('v7.56 Session: round pill present in index.html',
    html.includes('id="sl-round-pill"'));
  test('v7.56 Session: _slSessionStart defined in sim-lab source',
    js.includes('function _slSessionStart('));
  test('v7.56 Session: _slAggregateSession defined in sim-lab source',
    js.includes('function _slAggregateSession('));
  test('v7.56 Session: _slStartPrefetch defined in sim-lab source',
    js.includes('function _slStartPrefetch('));
  test('v7.56 Session: _slRecordWeakSpots defined in app.js',
    js.includes('function _slRecordWeakSpots('));
})();

// ── v7.57: Sim Lab — Exam mode structural pins (Task 12) ──
(function(){
  var dgCss = fs.readFileSync(path.join(ROOT, 'dg-system.css'), 'utf8');
  var pricingHtml = fs.readFileSync(path.join(ROOT, 'landing/pricing.html'), 'utf8');
  test('v7.57 Exam: entry mode toggle present in index.html',
    html.includes('id="sle-mode"') && html.includes('data-mode="exam"'));
  test('v7.57 Exam: exam topbar clock + badge slots present',
    html.includes('id="sl-clock-slot"') && html.includes('id="sl-exam-badge"'));
  test('v7.57 Exam: question palette container present',
    html.includes('id="sl-palette"'));
  test('v7.57 Exam: result page pace markers present in css',
    dgCss.includes('.slp-pace-card') && dgCss.includes('.slp-par-track'));
  test('v7.57 Exam: exam-mode path defined in sim-lab source',
    js.includes('function _slExamStart(') && js.includes("mode: 'exam'") &&
    js.includes('function _slStartCountdown(') && js.includes('function _slComputePace(') &&
    js.includes('function _slExamSubmit('));
  test('v7.57 Exam: countdown is deadline-derived, not decremented',
    js.includes('_slSession.deadlineMs - Date.now()'));
  test('v7.57 Exam: exam never calls _bumpPbqFreeRun (Pro/unlimited)',
    js.includes('function _slExamStart(') &&
    !js.replace(/\/\/.*/g, '').match(/function _slExamStart[\s\S]{0,2000}window\._bumpPbqFreeRun\(\)/));
  test('v7.57 Exam: exact Pro gate copy present',
    js.includes('The real exam is timed. Practice that way.'));
  test('v7.57 Exam: pricing carries the exam-mode Pro bullet',
    pricingHtml.includes('a real timed PBQ simulation with a pacing report'));
})();

// ── v7.59: Decision Lab — structural pins ──
(function(){
  var dgCss = fs.readFileSync(path.join(ROOT, 'dg-system.css'), 'utf8');
  var pricingHtml = fs.readFileSync(path.join(ROOT, 'landing/pricing.html'), 'utf8');
  test('v7.59 Decision Lab: entry + result pages present in index.html',
    html.includes('id="page-decision-lab-entry"') && html.includes('id="page-decision-lab-result"'));
  test('v7.59 Decision Lab: runner page + Home tile present in index.html',
    html.includes('id="page-decision-lab"') && html.includes('id="dl-home-opt"'));
  test('v7.59 Decision Lab: _DL_CERTS allowlist defined (engine + app gate)',
    js.includes("_DL_CERTS = ['az900', 'ai900', 'sc900', 'clfc02']"));
  test('v7.59 Decision Lab: _dlBank + shared _seedBank resolver defined',
    js.includes('function _dlBank(') && js.includes('function _seedBank('));
  test('v7.59 Decision Lab: per-option why render path (_dlGradeAnalyze) defined',
    js.includes('function _dlGradeAnalyze('));
  test('v7.59 Decision Lab: uses _dlBumpFreeRun, not _bumpPbqFreeRun',
    js.includes('function _dlBumpFreeRun(') &&
    !js.replace(/\/\/.*/g, '').match(/_dlSessionStartDispatch[\s\S]{0,1500}window\._bumpPbqFreeRun\(\)/));
  test('v7.59 Decision Lab: exact §4 gate copy present',
    js.includes('Exam-style mode is Pro') &&
    js.includes('The full 20-decision set is Pro') &&
    js.includes("That's today's free set"));
  test('v7.59 Decision Lab: Home tile gated to _DL_CERTS in app.js',
    js.includes('function renderDecisionLabHomeEntry(') && js.includes("_DL_CERTS.indexOf(window.CURRENT_CERT)"));
  test('v7.59 Decision Lab: verdict + sorter markers present in css',
    dgCss.includes('.dl-confrow') && dgCss.includes('.dl-srv-sel') && dgCss.includes('.dl-graded'));
  test('v7.59 Decision Lab: pricing carries the Decision Lab Pro bullet',
    pricingHtml.includes('cloud-cert scenario drills with per-distractor reasoning'));
})();

// ── Per-cert milestone storage (Task 1) ──
console.log('\n\x1b[1m── Per-cert milestone storage (M1) ──\x1b[0m');
test('M1: _certKey() helper exists',
  /function _certKey\s*\(/.test(js));
test('M1: _migrateMilestoneShape() exists',
  /function _migrateMilestoneShape\s*\(/.test(js));
test('M1: getMilestones reads current cert submap',
  /getMilestones\s*\([^)]*\)\s*\{[\s\S]*?_certKey\(\)/.test(js));
test('M1: unlockMilestone writes under current cert',
  /unlockMilestone[\s\S]*?_certKey\(\)/.test(js));
// Write-path decoupling: getMilestones DISPLAYS the pruned view; unlockMilestone
// persists the UNPRUNED map (prune must never run on the cloud-flushed write).
test('M1: getMilestones uses the pruned ({prune:true}) view',
  /getMilestones\s*\([^)]*\)\s*\{[\s\S]*?_allMilestones\(\s*\{\s*prune:\s*true\s*\}\s*\)/.test(js));
test('M1: getMilestones returns a shallow copy (non-owned sub-object)',
  /getMilestones\s*\([^)]*\)\s*\{[\s\S]*?return\s*\{\s*\.\.\.\(all\[_certKey\(\)\]\s*\|\|\s*\{\}\)\s*\}/.test(js));
test('M1: unlockMilestone persists the UNPRUNED map (_allMilestones() no prune)',
  /unlockMilestone\s*\([^)]*\)\s*\{[\s\S]*?_allMilestones\(\)\s*;\s*\/\/\s*no prune/.test(js));
test('M1: _migrateMilestoneShape prune is opt-in (opts.prune === true)',
  /_migrateMilestoneShape\s*\(\s*raw\s*,\s*opts\s*\)[\s\S]*?opts\.prune\s*===\s*true/.test(js));

// Behavioral smoke: extract _migrateMilestoneShape into a vm sandbox (no globals
// beyond an injected MILESTONE_DEFS) and prove the migration/prune contract.
try {
  const migBody = (js.match(/function _migrateMilestoneShape\(raw, opts\) \{[\s\S]*?\n\}/) || [''])[0];
  if (migBody) {
    const ctx = {};
    vm.createContext(ctx);
    // Inject a known live-defs set so prune behavior is deterministic.
    vm.runInContext('const MILESTONE_DEFS = [{id:"a"},{id:"b"}];', ctx);
    vm.runInContext(migBody, ctx);
    vm.runInContext('globalThis.__mig = _migrateMilestoneShape;', ctx);
    const mig = ctx.__mig;
    const deepEq = (x, y) => JSON.stringify(x) === JSON.stringify(y);

    // (a) old flat {a:'ts'} → {netplus:{a:'ts'}}
    test('M1 behavioral: old flat wraps under netplus',
      deepEq(mig({ a: 'ts' }), { netplus: { a: 'ts' } }));
    // (b) idempotency: migrate(migrate(x)) deep-equals migrate(x)
    const once = mig({ a: 'ts', b: 'ts2' });
    test('M1 behavioral: migrate is idempotent',
      deepEq(mig(JSON.parse(JSON.stringify(once))), once));
    // (c) empty {} → {} (NOT {netplus:{}})
    test('M1 behavioral: empty stays empty (no netplus wrap)',
      deepEq(mig({}), {}));
    // (d) already-nested passes through unchanged
    test('M1 behavioral: already-nested passes through',
      deepEq(mig({ netplus: { a: 'ts' } }), { netplus: { a: 'ts' } }));
    // (e) prune:true removes ids not in live set; prune:false preserves them
    const live = new Set(['a', 'b']);
    test('M1 behavioral: prune:true drops orphaned id',
      deepEq(mig({ netplus: { a: 'ts', zzz: 'ts' } }, { prune: true, liveIds: live }),
             { netplus: { a: 'ts' } }));
    test('M1 behavioral: prune:false preserves orphaned id',
      deepEq(mig({ netplus: { a: 'ts', zzz: 'ts' } }, { prune: false, liveIds: live }),
             { netplus: { a: 'ts', zzz: 'ts' } }));
    // bonus: default (no opts) does NOT prune — protects the write path
    test('M1 behavioral: default (no opts) does not prune',
      deepEq(mig({ netplus: { a: 'ts', zzz: 'ts' } }),
             { netplus: { a: 'ts', zzz: 'ts' } }));
  } else {
    test('M1 behavioral: _migrateMilestoneShape extraction', false);
    results.errors.push('could not extract _migrateMilestoneShape from app.js');
  }
} catch (err) {
  test('M1 behavioral: _migrateMilestoneShape smoke test', false);
  results.errors.push('_migrateMilestoneShape smoke test threw: ' + err.message);
}

// Behavioral smoke (Task 8): per-cert ISOLATION. Seed a multi-cert milestone
// blob, then prove getMilestones() returns ONLY the active cert's submap and
// that flipping the active cert (window.CURRENT_CERT) flips which milestones
// read as earned — a netplus unlock must NOT leak into the secplus view.
// Extracts the real _certKey/_allMilestones/_migrateMilestoneShape/getMilestones
// into a vm sandbox with a stub localStorage + switchable CURRENT_CERT.
try {
  const grab = (name) => {
    const re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
    return (js.match(re) || [''])[0];
  };
  const certKeyBody = grab('_certKey');
  const allMsBody   = grab('_allMilestones');
  const migBody2    = grab('_migrateMilestoneShape');
  const getMsBody   = grab('getMilestones');
  if (certKeyBody && allMsBody && migBody2 && getMsBody) {
    const ctx = {};
    vm.createContext(ctx);
    // Seed a two-cert blob: netplus earned simlab_first; secplus earned nothing.
    const seeded = JSON.stringify({
      netplus: { simlab_first: '2026-01-01T00:00:00.000Z' },
      secplus: { decision_first: '2026-02-02T00:00:00.000Z' },
    });
    vm.runInContext(`
      const MILESTONE_DEFS = [{id:'simlab_first'},{id:'decision_first'}];
      const STORAGE = { MILESTONES: 'nplus_milestones' };
      const _store = { 'nplus_milestones': ${JSON.stringify(seeded)} };
      const localStorage = { getItem: (k) => (k in _store ? _store[k] : null) };
      let CURRENT_CERT = 'netplus';
      const window = {};            // _certKey reads window.CURRENT_CERT first
      function _cloudFlush() {}
      globalThis.__setCert = (c) => { window.CURRENT_CERT = c; };
    `, ctx);
    vm.runInContext(certKeyBody, ctx);
    vm.runInContext(migBody2, ctx);
    vm.runInContext(allMsBody, ctx);
    vm.runInContext(getMsBody, ctx);
    vm.runInContext('globalThis.__getMs = getMilestones;', ctx);
    const getMs = ctx.__getMs, setCert = ctx.__setCert;

    setCert('netplus');
    const npView = getMs();
    test('M1 isolation: netplus view sees its own earned milestone',
      !!npView.simlab_first);
    test('M1 isolation: netplus view does NOT leak secplus milestones',
      !npView.decision_first);

    setCert('secplus');
    const spView = getMs();
    test('M1 isolation: secplus view sees only its own earned milestone',
      !!spView.decision_first && !spView.simlab_first);
    test('M1 isolation: a netplus unlock reads as NOT earned under secplus',
      !spView.simlab_first);

    setCert('aplus'); // a cert with no seeded submap
    test('M1 isolation: a cert with no submap reads as empty (no leakage)',
      Object.keys(getMs()).length === 0);
  } else {
    test('M1 isolation: per-cert getMilestones extraction', false);
    results.errors.push('could not extract per-cert milestone fns from app.js');
  }
} catch (err) {
  test('M1 isolation: per-cert getMilestones smoke test', false);
  results.errors.push('per-cert isolation smoke test threw: ' + err.message);
}

// ── M2: orphaned milestone ids removed (drills deleted long ago) ──
console.log('\n\x1b[1m── M2: ORPHANED MILESTONE REMOVAL ──\x1b[0m');
['ab_first','ab_50','ab_all_seen','ab_streak_15',
 'os_first','os_50','os_all_seen','os_streak_10',
 'cb_first','cb_50','cb_all_seen','cb_streak_10',
 'fix_first','fix_5','fix_all_easy',
].forEach(id => test(`M2: orphan '${id}' removed from app.js`,
  !new RegExp("id:\\s*'" + id + "'").test(js)));

// M2 regression guard: every MILESTONE_PROGRESS key must be a real MILESTONE_DEFS id
// (this is the guard that would have caught the orphaned ab_50/os_50/cb_50/fix_5 progress entries).
(function() {
  const defsSrc = (js.match(/const MILESTONE_DEFS = \[[\s\S]*?\];/) || [''])[0];
  const progSrc = (js.match(/const MILESTONE_PROGRESS = \{[\s\S]*?\n\};/) || [''])[0];
  const defIds = new Set([...defsSrc.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]));
  // progress keys: `key: c =>` at entry start (strip the arrow-fn bodies first via key-position match)
  const progKeys = [...progSrc.matchAll(/(?:^|[\s{,])([a-z][a-z0-9_]*)\s*:\s*c\s*=>/gi)].map(m => m[1]);
  test('M2 guard: MILESTONE_DEFS + MILESTONE_PROGRESS both extracted',
    defIds.size > 0 && progKeys.length > 0);
  const orphanProg = progKeys.filter(k => !defIds.has(k));
  test(`M2 guard: no MILESTONE_PROGRESS key orphaned from MILESTONE_DEFS (orphans: ${orphanProg.join(',') || 'none'})`,
    orphanProg.length === 0);
})();

// ── M3: DRILL_STATS per-cert tracking ──
console.log('\n\x1b[1m── M3: DRILL_STATS TRACKING ──\x1b[0m');
test('M3: DRILL_STATS storage key defined', /DRILL_STATS:\s*'nplus_drill_stats'/.test(js));
test('M3: getDrillStats() exists', /function getDrillStats\s*\(/.test(js));
test('M3: bumpDrillStat() exists', /function bumpDrillStat\s*\(/.test(js));
// Structural: ctx.drill wired into _buildMilestoneCtx return
test('M3: ctx.drill wired in _buildMilestoneCtx', /drill:\s*getDrillStats\(\)/.test(js));
// Cloud sync: nplus_drill_stats in cloud-store USER_DATA_KEYS
test('M3: nplus_drill_stats in cloud-store USER_DATA_KEYS', cloudStoreJs.includes("'nplus_drill_stats'"));

// ── M5: drill completion wiring — bump + evaluate + celebrate ──
console.log('\n\x1b[1m── M5: DRILL COMPLETION WIRING ──\x1b[0m');
// Sim Lab (practice mode) — _slRenderSummary fires exactly once per practice session
const _m5SlSummaryBody = _fnBody(js, '_slRenderSummary');
test("M5: Sim Lab _slRenderSummary calls bumpDrillStat('simlab')",
  /bumpDrillStat\(\s*'simlab'/.test(_m5SlSummaryBody));
test('M5: Sim Lab _slRenderSummary calls evaluateMilestones()',
  _m5SlSummaryBody.includes('evaluateMilestones()'));
test('M5: Sim Lab _slRenderSummary calls showMilestoneCelebration',
  _m5SlSummaryBody.includes('showMilestoneCelebration'));
// Sim Lab (exam mode) — _slRenderExamResult fires exactly once per exam session
const _m5SlExamBody = _fnBody(js, '_slRenderExamResult');
test("M5: Sim Lab _slRenderExamResult calls bumpDrillStat('simlab')",
  /bumpDrillStat\(\s*'simlab'/.test(_m5SlExamBody));
test('M5: Sim Lab _slRenderExamResult calls evaluateMilestones()',
  _m5SlExamBody.includes('evaluateMilestones()'));
test('M5: Sim Lab _slRenderExamResult calls showMilestoneCelebration',
  _m5SlExamBody.includes('showMilestoneCelebration'));
// Decision Lab — _dlRenderResult fires exactly once per session
const _m5DlBody = _fnBody(js, '_dlRenderResult');
test("M5: Decision Lab _dlRenderResult calls bumpDrillStat('decision')",
  /bumpDrillStat\(\s*'decision'/.test(_m5DlBody));
test('M5: Decision Lab _dlRenderResult calls evaluateMilestones()',
  _m5DlBody.includes('evaluateMilestones()'));
test('M5: Decision Lab _dlRenderResult calls showMilestoneCelebration',
  _m5DlBody.includes('showMilestoneCelebration'));
// Why-Not — whyNotFinishSession fires exactly once per 3-round session
const _m5WnBody = _fnBody(js, 'whyNotFinishSession');
test("M5: Why-Not whyNotFinishSession calls bumpDrillStat('whynot')",
  /bumpDrillStat\(\s*'whynot'/.test(_m5WnBody));
test('M5: Why-Not whyNotFinishSession calls evaluateMilestones()',
  _m5WnBody.includes('evaluateMilestones()'));
test('M5: Why-Not whyNotFinishSession calls showMilestoneCelebration',
  _m5WnBody.includes('showMilestoneCelebration'));
// Gauntlet — _finishGauntlet fires exactly once per gauntlet session
const _m5GntBody = _fnBody(js, '_finishGauntlet');
test("M5: Gauntlet _finishGauntlet calls bumpDrillStat('gauntlet')",
  /bumpDrillStat\(\s*'gauntlet'/.test(_m5GntBody));
test('M5: Gauntlet _finishGauntlet calls evaluateMilestones()',
  _m5GntBody.includes('evaluateMilestones()'));
test('M5: Gauntlet _finishGauntlet calls showMilestoneCelebration',
  _m5GntBody.includes('showMilestoneCelebration'));

// ── T6: Analytics milestone display is per-cert ──
// Guard: the analytics milestones renderers must derive their unlocked map from
// getMilestones() (the cert-scoped, pruned view) — NOT from a raw
// localStorage.getItem or the all-certs blob. Task 1 made getMilestones()
// cert-scoped; this guard ensures the analytics renderers stay wired to that
// path. v7.61.0: also assert the LIVE bento data path _anaBtMilestoneData()
// (the function that actually renders milestones on #page-analytics) is wired
// the same way — _renderAnaMilestones() is a retained legacy renderer.
console.log('\n\x1b[1m── T6: ANALYTICS MILESTONE DISPLAY (per-cert guard) ──\x1b[0m');
(function() {
  const anaBody = _fnBody(js, '_renderAnaMilestones');
  test('T6: _renderAnaMilestones exists',
    anaBody.length > 0);
  test('T6: _renderAnaMilestones calls getMilestones() for unlocked map (per-cert)',
    /getMilestones\s*\(/.test(anaBody));
  test('T6: _renderAnaMilestones does NOT read localStorage directly',
    !anaBody.includes('localStorage.getItem'));
  // v7.61.0: the LIVE analytics milestones path must also be per-cert wired.
  const liveBody = _fnBody(js, '_anaBtMilestoneData');
  test('T6: _anaBtMilestoneData (live path) calls getMilestones() per-cert',
    /getMilestones\s*\(/.test(liveBody) && !liveBody.includes('localStorage.getItem'));
  // All 12 drill milestone ids must be present in MILESTONE_DEFS
  const drillIds = [
    'simlab_first','simlab_25','simlab_ace',
    'decision_first','decision_25','decision_flawless',
    'whynot_first','whynot_25','whynot_master',
    'gauntlet_first','gauntlet_25','gauntlet_survivor'
  ];
  drillIds.forEach(id => test(`T6: drill milestone '${id}' in MILESTONE_DEFS`,
    new RegExp("id:\\s*'" + id + "'").test(js)));
  // No orphaned pt_* milestone ids in MILESTONE_DEFS
  test('T6: no pt_first/pt_25/pt_master orphans in MILESTONE_DEFS',
    !new RegExp("id:\\s*'pt_(first|25|master)'").test(js));
})();

// ── T7: v7.60.0 — Drills analytics group + final copy + bronze celebration toast ──
console.log('\n\x1b[1m── T7: DRILLS ANALYTICS GROUP + FINAL COPY + BRONZE TOAST ──\x1b[0m');
(function() {
  // (a) The 12 final approved labels are present in app.js MILESTONE_DEFS
  const finalLabels = [
    'First console', 'Bench hours', 'Clean board',
    'First call', 'On the clock', 'Right every time',
    'First round', 'Why-Not regular', 'Reads the trap',
    'First gauntlet', 'Goes the distance', 'Walks out clean',
  ];
  finalLabels.forEach(label => test(`T7: final label '${label}' in MILESTONE_DEFS`,
    js.includes(`'${label}'`)));

  // (b) dg-system.css contains a .celebration-toast override AND the override
  // block itself uses no purple tokens (forged-bronze only per BRAND §3).
  // Note: dg-system.css has pre-existing prose outside comment delimiters that
  // mentions old purple hex values as documentation — we scope the check to the
  // celebration-toast override block only (the new v7.60.0 addition).
  const dgCss = read('dg-system.css');
  test('T7: dg-system.css contains .celebration-toast override',
    dgCss.includes('.celebration-toast'));
  // Extract the celebration-toast override section for the purple check
  const toastBlockStart = dgCss.indexOf('/* ── v7.60.0: Celebration toast');
  const toastBlock = toastBlockStart >= 0 ? dgCss.slice(toastBlockStart) : '';
  const purplePatterns = ['5b4fdb','7c6ff7','124,111,247','99,85,224'];
  purplePatterns.forEach(p => test(`T7: celebration-toast override contains NO purple token '${p}'`,
    !toastBlock.includes(p)));

  // (c) The drills group is rendered by the LIVE analytics path.
  // _anaDrillsGroupHtml() is the single source of the drills markup; it is
  // mounted by renderAnalytics() (the live bento renderer) below the grid.
  // NOTE: the legacy _renderAnaMilestones() is NOT wired into the live page —
  // the live analytics page is the bento board (_anaBt* + _anaBtWire).
  const drillsBody = _fnBody(js, '_anaDrillsGroupHtml');
  test('T7: _anaDrillsGroupHtml() exists (single source of drills markup)',
    drillsBody.length > 0);
  test('T7: _anaDrillsGroupHtml emits ana-drills-group class',
    drillsBody.includes('ana-drills-group'));
  test('T7: _anaDrillsGroupHtml emits DRILL_GROUPS structure',
    drillsBody.includes('DRILL_GROUPS'));
  test('T7: _anaDrillsGroupHtml emits dg-eyebrow Drills label',
    drillsBody.includes('Drills'));
  test('T7: _anaDrillsGroupHtml emits dg-slots for 3-per-row layout',
    drillsBody.includes('dg-slots'));
  test('T7: _anaDrillsGroupHtml emits .dg-drill.reveal rows + data-fill bars',
    /dg-drill reveal/.test(drillsBody) && drillsBody.includes('data-fill'));

  // (c2) renderAnalytics (LIVE bento page) actually mounts the drills group.
  // NOTE: _fnBody(js,'renderAnalytics') prefix-matches renderAnalyticsActionHeadline
  // (the CLAUDE.md gotcha), so extract the exact "function renderAnalytics()" body.
  const renderAnaIdx = js.indexOf('function renderAnalytics()');
  let renderAnaBody = '';
  if (renderAnaIdx !== -1) {
    let bs = js.indexOf('{', renderAnaIdx), depth = 1, i = bs + 1;
    while (i < js.length && depth > 0) { if (js[i] === '{') depth++; else if (js[i] === '}') depth--; i++; }
    renderAnaBody = js.slice(renderAnaIdx, i);
  }
  test('T7: exact renderAnalytics() body extracted (not the ActionHeadline prefix match)',
    renderAnaBody.startsWith('function renderAnalytics()'));
  test('T7: renderAnalytics() mounts _anaDrillsGroupHtml() into the page',
    /_anaDrillsGroupHtml\s*\(\s*\)/.test(renderAnaBody));

  // (c3) CRITICAL visibility wiring — the #page-setup reveal IIFE is scoped to
  // #page-setup and never reveals #page-analytics. _anaBtWire() MUST add
  // .visible to the .dg-drill.reveal rows (and fill the bars) or the group
  // renders at opacity:0 forever. Guard the visibility wiring so it can't regress.
  const wireBody = _fnBody(js, '_anaBtWire');
  test('T7: _anaBtWire() selects the drills section rows',
    wireBody.includes('#ana-ms-drills-section') && /\.dg-drill\.reveal/.test(wireBody));
  test('T7: _anaBtWire() adds .visible to drill rows (not left reveal-gated)',
    /classList\.add\(\s*['"]visible['"]\s*\)/.test(wireBody));
  test('T7: _anaBtWire() fills the n/25 ms-fill bars (data-fill → width)',
    wireBody.includes('ms-fill') && wireBody.includes('data-fill'));
  test('T7: _anaBtWire() respects reduced-motion for the drills reveal',
    /reduce/.test(wireBody));
})();

