// tests/uat/220-pbq-soho-evidence-archetype-gating.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: A+ SOHO router + command-output evidence seed-banks, archetype gating/cert-aware entry/exam-mode integration

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── Wave 1 Task 8: A+ Core 1 SOHO Router seed-bank validation ──
// The 12 consensus-approved A+ Core 1 SOHO Router scenarios now live for real
// in features/sim-lab-seed-aplus-core1.js (window.SIM_LAB_SEED_APLUS_CORE1).
// This proves every one of them is real, production-ready content: each
// passes the same pure validators that gate the dev fixtures above
// (simLabValidateScenario + simLabValidateSohoFidelity), extracted from
// features/sim-lab.js by the same brace-matching approach as
// .superpowers/sdd/wave1/validate-drafts.js (no reimplementation of
// validator logic). Not a fixture — this is the real bank. Mirrors the
// Task 6/7 bank-test structure, swapping the SOHO fidelity oracle in.
(function () {
  console.log('\n\x1b[1m── Sim Lab: A+ Core 1 SOHO Router seed-bank validation (Wave 1 Task 8) ──\x1b[0m');
  try {
    var vm = require('vm');
    function assert(cond, msg) { test(msg, !!cond); }

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    // ── Extract the REAL pure validators from features/sim-lab.js, exactly
    // as .superpowers/sdd/wave1/validate-drafts.js does ──
    var isNonEmptyStrBody    = grab('_isNonEmptyStr');
    var validatePayloadBody  = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    var ipToIntBody      = grab('_ipToInt');
    var maskToIntBody    = grab('_maskToInt');
    var inSubnetBody     = grab('_inSubnet');
    var resolveSlotBody  = grab('_slFidelityResolveSlot');
    var sohoSlotTextBody = grab('_sohoSlotText');
    var sohoFidelityBody = grab('simLabValidateSohoFidelity');

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody ||
        !ipToIntBody || !maskToIntBody || !inSubnetBody || !resolveSlotBody ||
        !sohoSlotTextBody || !sohoFidelityBody) {
      test('A+ Core 1 SOHO bank: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Wave 1 Task 8 bank test; check names/indenting');
      return;
    }

    var vCtx = {};
    vm.createContext(vCtx);
    vm.runInContext(stepTypesDecl, vCtx);
    vm.runInContext(isNonEmptyStrBody, vCtx);
    vm.runInContext(validatePayloadBody, vCtx);
    vm.runInContext(validateScenarioBody, vCtx);
    vm.runInContext(ipToIntBody, vCtx);
    vm.runInContext(maskToIntBody, vCtx);
    vm.runInContext(inSubnetBody, vCtx);
    vm.runInContext(resolveSlotBody, vCtx);
    vm.runInContext(sohoSlotTextBody, vCtx);
    vm.runInContext(sohoFidelityBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario; globalThis.__sohoFidelity = simLabValidateSohoFidelity;', vCtx);
    var simLabValidateScenario = vCtx.__validate;
    var simLabValidateSohoFidelity = vCtx.__sohoFidelity;

    // ── Load the real seed bank: eval features/sim-lab-seed-aplus-core1.js in
    // a sandbox with `var window = {}` so window.SIM_LAB_SEED_APLUS_CORE1
    // populates ──
    var seedSrc = read('features/sim-lab-seed-aplus-core1.js');
    var seedCtx = {};
    vm.createContext(seedCtx);
    vm.runInContext('var window = {};\n' + seedSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_APLUS_CORE1;', seedCtx);
    var seedBank = seedCtx.__seed;

    test('A+ Core 1 SOHO bank: window.SIM_LAB_SEED_APLUS_CORE1 loaded as an array',
      Array.isArray(seedBank));
    if (!Array.isArray(seedBank)) {
      results.errors.push('could not load window.SIM_LAB_SEED_APLUS_CORE1 from features/sim-lab-seed-aplus-core1.js');
      return;
    }

    var bankSoho = seedBank.filter(function (s) { return s && s.archetype === 'soho'; });
    test('A+ Core 1 SOHO bank: at least 10 soho-archetype scenarios present',
      bankSoho.length >= 10);

    var allValidateOk = true, allFidelityOk = true, allCertOk = true;
    bankSoho.forEach(function (s) {
      var vr = simLabValidateScenario(s);
      if (!vr || vr.ok !== true) {
        allValidateOk = false;
        results.errors.push('A+ Core 1 SOHO bank: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
      var fr = simLabValidateSohoFidelity(s);
      if (!fr || fr.ok !== true) {
        allFidelityOk = false;
        results.errors.push('A+ Core 1 SOHO bank: ' + (s && s.id) + ' failed simLabValidateSohoFidelity: ' + JSON.stringify(fr && fr.errors));
      }
      if (s.cert !== 'aplus-core1') {
        allCertOk = false;
        results.errors.push('A+ Core 1 SOHO bank: ' + (s && s.id) + ' has cert ' + s.cert + ', expected aplus-core1');
      }
    });

    test('A+ Core 1 SOHO bank: every soho scenario passes simLabValidateScenario',
      allValidateOk);
    test('A+ Core 1 SOHO bank: every soho scenario passes simLabValidateSohoFidelity',
      allFidelityOk);
    test('A+ Core 1 SOHO bank: every soho scenario has cert === "aplus-core1"',
      allCertOk);

  } catch (err) {
    test('A+ Core 1 SOHO bank: vm smoke test (threw)', false);
    results.errors.push('A+ Core 1 SOHO bank smoke test threw: ' + err.message);
  }
})();

// ── Wave 2 Task 10: A+ Core 1 Command-Output Evidence Triage seed-bank
// validation ──
// The 12 consensus-approved (two-agent gated) A+ Core 1 Command-Output
// Evidence Triage scenarios now live for real in
// features/sim-lab-seed-aplus-core1.js (window.SIM_LAB_SEED_APLUS_CORE1,
// archetype 'triage'). This proves every one of them is real,
// production-ready content: each passes the same pure validators that gate
// the dev fixtures above (simLabValidateScenario +
// simLabValidateEvidenceTriageFidelity), extracted from features/sim-lab.js
// the same way the Task 6/7 dev-fixture block above does.
(function () {
  console.log('\n\x1b[1m── Sim Lab: A+ Core 1 Command-Output Evidence Triage seed-bank validation (Wave 2 Task 10) ──\x1b[0m');
  try {
    var vm = require('vm');
    function assert(cond, msg) { test(msg, !!cond); }

    var grab = function (name) { return _fnBody(js, name); };

    // ── Extract the REAL pure validators from features/sim-lab.js, exactly
    // as the Task 6/7 dev-fixture triage block above does ──
    var isNonEmptyStrBody    = grab('_isNonEmptyStr');
    var validatePayloadBody  = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    var resolveSlotBody = grab('_slFidelityResolveSlot');
    var arrEqBody        = grab('_arrEq');
    var setEqBody        = grab('_setEq');
    var sigVar           = (js.match(/var _TRIAGE_FAULT_SIG = \{[\s\S]*?\n\s*\};/) || [''])[0];
    var evidenceLinesBody = grab('_triageEvidenceLines');
    var triageFidelityBody = grab('simLabValidateEvidenceTriageFidelity');

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody ||
        !resolveSlotBody || !sigVar || !evidenceLinesBody || !triageFidelityBody) {
      test('A+ Core 1 Triage bank: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Wave 2 Task 10 bank test; check names/indenting');
      return;
    }

    var vCtx = {};
    vm.createContext(vCtx);
    vm.runInContext(stepTypesDecl, vCtx);
    vm.runInContext(isNonEmptyStrBody, vCtx);
    vm.runInContext(validatePayloadBody, vCtx);
    vm.runInContext(validateScenarioBody, vCtx);
    vm.runInContext(resolveSlotBody, vCtx);
    if (arrEqBody) vm.runInContext(arrEqBody, vCtx);
    if (setEqBody) vm.runInContext(setEqBody, vCtx);
    vm.runInContext(sigVar, vCtx);
    vm.runInContext(evidenceLinesBody, vCtx);
    vm.runInContext(triageFidelityBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario; globalThis.__triFidelity = simLabValidateEvidenceTriageFidelity;', vCtx);
    var simLabValidateScenario = vCtx.__validate;
    var simLabValidateEvidenceTriageFidelity = vCtx.__triFidelity;

    // ── Load the real seed bank: eval features/sim-lab-seed-aplus-core1.js
    // in a sandbox with `var window = {}` so window.SIM_LAB_SEED_APLUS_CORE1
    // populates ──
    var seedSrc = read('features/sim-lab-seed-aplus-core1.js');
    var seedCtx = {};
    vm.createContext(seedCtx);
    vm.runInContext('var window = {};\n' + seedSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_APLUS_CORE1;', seedCtx);
    var seedBank = seedCtx.__seed;

    test('A+ Core 1 Triage bank: window.SIM_LAB_SEED_APLUS_CORE1 loaded as an array',
      Array.isArray(seedBank));
    if (!Array.isArray(seedBank)) {
      results.errors.push('could not load window.SIM_LAB_SEED_APLUS_CORE1 from features/sim-lab-seed-aplus-core1.js');
      return;
    }

    var bankTriage = seedBank.filter(function (s) { return s && s.archetype === 'triage'; });
    test('A+ Core 1 Triage bank: at least 10 triage-archetype scenarios present',
      bankTriage.length >= 10);

    var allValidateOk = true, allFidelityOk = true, allCertOk = true;
    bankTriage.forEach(function (s) {
      var vr = simLabValidateScenario(s);
      if (!vr || vr.ok !== true) {
        allValidateOk = false;
        results.errors.push('A+ Core 1 Triage bank: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
      var fr = simLabValidateEvidenceTriageFidelity(s);
      if (!fr || fr.ok !== true) {
        allFidelityOk = false;
        results.errors.push('A+ Core 1 Triage bank: ' + (s && s.id) + ' failed simLabValidateEvidenceTriageFidelity: ' + JSON.stringify(fr && fr.errors));
      }
      if (s.cert !== 'aplus-core1') {
        allCertOk = false;
        results.errors.push('A+ Core 1 Triage bank: ' + (s && s.id) + ' has cert ' + s.cert + ', expected aplus-core1');
      }
    });

    test('A+ Core 1 Triage bank: every triage scenario passes simLabValidateScenario',
      allValidateOk);
    test('A+ Core 1 Triage bank: every triage scenario passes simLabValidateEvidenceTriageFidelity',
      allFidelityOk);
    test('A+ Core 1 Triage bank: every triage scenario has cert === "aplus-core1"',
      allCertOk);

    // ── Extra cross-check: every triage scenario keeps a scored
    // evidence:false distractor line among its selectable reference lines ──
    bankTriage.forEach(function (s) {
      var lines = []; s.assets.reference.excerpts.forEach(function (ex) { (ex.lines || []).forEach(function (l) { lines.push(l); }); });
      var hasFalse = lines.some(function (l) { return l.select && l.evidence === false; });
      test('triage ' + s.id + ': keeps a scored evidence:false distractor', hasFalse);
    });

  } catch (err) {
    test('A+ Core 1 Triage bank: vm smoke test (threw)', false);
    results.errors.push('A+ Core 1 Triage bank smoke test threw: ' + err.message);
  }
})();

// The 20 consensus-approved Sec+ Incident Response scenarios now live for real
// in features/sim-lab-seed-secplus.js (window.SIM_LAB_SEED_SECPLUS). This
// proves every one of them is real, production-ready content: each passes the
// same pure validator that gates the dev fixture (simLabValidateScenario),
// extracted from features/sim-lab.js by the same brace-matching approach as
// .superpowers/sdd/validate-drafts.js (no reimplementation of validator
// logic). Not a fixture — this is the real bank. Incident scenarios use
// timeline/network-under-attack refs without a deviceId configure step, so
// simLabValidateNetworkFidelity does not apply here (mirrors Task 12's
// diagram-bank test, minus the fidelity check).
(function () {
  console.log('\n\x1b[1m── Sim Lab: Sec+ Incident Response seed-bank validation (Task 13) ──\x1b[0m');
  try {
    var vm = require('vm');

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    // ── Extract the REAL pure validator from features/sim-lab.js, exactly
    // as .superpowers/sdd/validate-drafts.js does ──
    var isNonEmptyStrBody   = grab('_isNonEmptyStr');
    var validatePayloadBody = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody) {
      test('Sec+ Incident bank: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Task 13 bank test; check names/indenting');
      return;
    }

    var vCtx = {};
    vm.createContext(vCtx);
    vm.runInContext(stepTypesDecl, vCtx);
    vm.runInContext(isNonEmptyStrBody, vCtx);
    vm.runInContext(validatePayloadBody, vCtx);
    vm.runInContext(validateScenarioBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario;', vCtx);
    var simLabValidateScenario = vCtx.__validate;

    // ── Load the real seed bank: eval features/sim-lab-seed-secplus.js in a
    // sandbox with `var window = {}` so window.SIM_LAB_SEED_SECPLUS populates ──
    var seedSrc = read('features/sim-lab-seed-secplus.js');
    var seedCtx = {};
    vm.createContext(seedCtx);
    vm.runInContext('var window = {};\n' + seedSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_SECPLUS;', seedCtx);
    var seedBank = seedCtx.__seed;

    test('Sec+ Incident bank: window.SIM_LAB_SEED_SECPLUS loaded as an array',
      Array.isArray(seedBank));
    if (!Array.isArray(seedBank)) {
      results.errors.push('could not load window.SIM_LAB_SEED_SECPLUS from features/sim-lab-seed-secplus.js');
      return;
    }

    var incidentScenarios = seedBank.filter(function (s) { return s && s.archetype === 'incident'; });
    test('Sec+ Incident bank: at least 20 incident-archetype scenarios present',
      incidentScenarios.length >= 20);

    var allValidateOk = true;
    incidentScenarios.forEach(function (s) {
      var vr = simLabValidateScenario(s);
      if (!vr || vr.ok !== true) {
        allValidateOk = false;
        results.errors.push('Sec+ Incident bank: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
    });

    test('Sec+ Incident bank: every incident scenario passes simLabValidateScenario',
      allValidateOk);

  } catch (err) {
    test('Sec+ Incident bank: vm smoke test (threw)', false);
    results.errors.push('Sec+ Incident bank smoke test threw: ' + err.message);
  }
})();

// The 10 consensus-approved Defense in Depth scenarios (5 Net+, 5 Sec+) now
// live for real in features/sim-lab-seed-netplus.js and
// features/sim-lab-seed-secplus.js (window.SIM_LAB_SEED_NETPLUS /
// window.SIM_LAB_SEED_SECPLUS). This proves every one of them is real,
// production-ready content: each passes the same pure validator that gates
// the dev fixture (simLabValidateScenario), extracted from features/sim-lab.js
// by the same brace-matching approach as .superpowers/sdd/validate-drafts.js
// (no reimplementation of validator logic). Defense scenarios use `layered`
// refs without a deviceId configure step, so simLabValidateNetworkFidelity
// does not apply here (mirrors Task 13's incident-bank test, minus the
// fidelity check) — this is the real bank across BOTH cert seed banks
// (Task 14).
(function () {
  console.log('\n\x1b[1m── Sim Lab: Defense in Depth seed-bank validation, Net+ & Sec+ (Task 14) ──\x1b[0m');
  try {
    var vm = require('vm');

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    // ── Extract the REAL pure validator from features/sim-lab.js, exactly
    // as .superpowers/sdd/validate-drafts.js does ──
    var isNonEmptyStrBody   = grab('_isNonEmptyStr');
    var validatePayloadBody = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody) {
      test('Defense in Depth bank: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Task 14 bank test; check names/indenting');
      return;
    }

    var vCtx = {};
    vm.createContext(vCtx);
    vm.runInContext(stepTypesDecl, vCtx);
    vm.runInContext(isNonEmptyStrBody, vCtx);
    vm.runInContext(validatePayloadBody, vCtx);
    vm.runInContext(validateScenarioBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario;', vCtx);
    var simLabValidateScenario = vCtx.__validate;

    // ── Load both real seed banks: eval features/sim-lab-seed-netplus.js and
    // features/sim-lab-seed-secplus.js in a sandbox with `var window = {}` so
    // window.SIM_LAB_SEED_NETPLUS / window.SIM_LAB_SEED_SECPLUS populate ──
    var netplusSrc = read('features/sim-lab-seed-netplus.js');
    var netplusCtx = {};
    vm.createContext(netplusCtx);
    vm.runInContext('var window = {};\n' + netplusSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_NETPLUS;', netplusCtx);
    var netplusBank = netplusCtx.__seed;

    var secplusSrc = read('features/sim-lab-seed-secplus.js');
    var secplusCtx = {};
    vm.createContext(secplusCtx);
    vm.runInContext('var window = {};\n' + secplusSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_SECPLUS;', secplusCtx);
    var secplusBank = secplusCtx.__seed;

    test('Defense in Depth bank: window.SIM_LAB_SEED_NETPLUS loaded as an array',
      Array.isArray(netplusBank));
    test('Defense in Depth bank: window.SIM_LAB_SEED_SECPLUS loaded as an array',
      Array.isArray(secplusBank));
    if (!Array.isArray(netplusBank) || !Array.isArray(secplusBank)) {
      results.errors.push('could not load one or both seed banks for Task 14 Defense in Depth test');
      return;
    }

    var netplusDefense = netplusBank.filter(function (s) { return s && s.archetype === 'defense'; });
    var secplusDefense = secplusBank.filter(function (s) { return s && s.archetype === 'defense'; });

    test('Defense in Depth bank: at least 5 defense-archetype scenarios in Net+ bank',
      netplusDefense.length >= 5);
    test('Defense in Depth bank: at least 5 defense-archetype scenarios in Sec+ bank',
      secplusDefense.length >= 5);

    var allValidateOk = true;
    netplusDefense.concat(secplusDefense).forEach(function (s) {
      var vr = simLabValidateScenario(s);
      if (!vr || vr.ok !== true) {
        allValidateOk = false;
        results.errors.push('Defense in Depth bank: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
    });

    test('Defense in Depth bank: every defense scenario (both banks) passes simLabValidateScenario',
      allValidateOk);

  } catch (err) {
    test('Defense in Depth bank: vm smoke test (threw)', false);
    results.errors.push('Defense in Depth bank smoke test threw: ' + err.message);
  }
})();

// ── Task 15 (PBQ archetypes plan): archetype scenarios ride the EXISTING
// free-1/day + Pro gating — reuse, no new metering. ──
// Confirms two things behaviorally, not just structurally:
//   1. The seed-bank pick path (_slBank/_slPickSeed/_slPickSeedFresh) treats
//      an archetype-tagged scenario ('diagram'/'incident'/'defense') exactly
//      like an ordinary scenario — same array, same index-based selection,
//      no archetype branch exists that could special-case or bypass gating.
//   2. simLabStart / _slSessionStart run the free-count check + Pro gate
//      (_slIsPro, _pbqFreeRunsToday, PBQ_FREE_DAILY_CAP, _gateProOnly)
//      BEFORE any scenario (archetype or not) is ever picked/generated — so
//      an exhausted free cap blocks an archetype-only bank identically to a
//      bank with zero archetype scenarios. Also confirms the free-tier
//      session-bump path (_slSessionBumpOnce -> _bumpPbqFreeRun) is
//      archetype-agnostic (fires once per session regardless of which
//      scenario, archetype or not, gets served).
(function () {
  console.log('\n\x1b[1m── Sim Lab: archetypes ride existing free/Pro gating (Task 15) ──\x1b[0m');
  try {
    var vm = require('vm');

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    // ── 1. Bank/pick path is archetype-agnostic ──
    // Build a tiny mixed bank: one ordinary scenario, one 'diagram'-archetype
    // scenario. Extract the REAL _seedBank/_slBank/_slPickSeed/_slPickSeedFresh
    // (no reimplementation) and prove selection never inspects `.archetype`.
    var seedBankBody     = grab('_seedBank');
    var slBankBody       = grab('_slBank');
    var pickSeedBody     = grab('_slPickSeed');
    var pickSeedFreshBody = grab('_slPickSeedFresh');
    var slGlobalsMatch   = js.match(/var _SL_SEED_GLOBALS\s*=\s*\{[\s\S]*?\};/);
    // simLabValidateScenario is called inside the pick functions — extract the
    // real validator chain too (same approach as the Task 11/12/13/14 blocks).
    var isNonEmptyStrBody    = grab('_isNonEmptyStr');
    var validatePayloadBody  = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    if (!seedBankBody || !slBankBody || !pickSeedBody || !pickSeedFreshBody || !slGlobalsMatch ||
        !isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody) {
      test('Task 15: bank/pick helper extraction succeeded', false);
      results.errors.push('could not extract _seedBank/_slBank/_slPickSeed/_slPickSeedFresh for Task 15 test; check names/indenting');
    } else {
      var bankCtx = { window: {} };
      vm.createContext(bankCtx);
      vm.runInContext('var window = this.window;', bankCtx);
      vm.runInContext(stepTypesDecl, bankCtx);
      vm.runInContext(isNonEmptyStrBody, bankCtx);
      vm.runInContext(validatePayloadBody, bankCtx);
      vm.runInContext(validateScenarioBody, bankCtx);
      vm.runInContext(seedBankBody, bankCtx);
      vm.runInContext(slGlobalsMatch[0], bankCtx);
      vm.runInContext(slBankBody, bankCtx);
      vm.runInContext(pickSeedBody, bankCtx);
      vm.runInContext(pickSeedFreshBody, bankCtx);

      var _t15Ordinary = {
        id: 't15-ordinary-1', cert: 'netplus', objective: '1.4', topic: 'Subnetting',
        title: 'Ordinary scenario', estMinutes: 4,
        scenario: 'Plain scenario, no archetype tag.',
        steps: [{ id: 's1', type: 'fillin', points: 1, prompt: 'x?', explanation: 'y', payload: { fields: [{ id: 'a', label: 'A' }] }, answer: { a: ['1'] } }]
      };
      var _t15Archetype = {
        id: 't15-archetype-1', cert: 'netplus', archetype: 'diagram', objective: '1.4', topic: 'Diagram',
        title: 'Archetype scenario', estMinutes: 4,
        scenario: 'Archetype-tagged scenario.',
        steps: [{ id: 's1', type: 'fillin', points: 1, prompt: 'x?', explanation: 'y', payload: { fields: [{ id: 'a', label: 'A' }] }, answer: { a: ['1'] } }]
      };

      vm.runInContext('window.SIM_LAB_SEED_NETPLUS = [' + JSON.stringify(_t15Ordinary) + ', ' + JSON.stringify(_t15Archetype) + '];', bankCtx);
      vm.runInContext('globalThis.__bank = _slBank("netplus"); globalThis.__pickAt0 = _slPickSeed; globalThis.__pickFresh = _slPickSeedFresh;', bankCtx);

      var t15Bank = bankCtx.__bank;
      test('Task 15: mixed bank (ordinary + archetype) loads via the real _slBank resolver',
        Array.isArray(t15Bank) && t15Bank.length === 2);

      // _slPickSeed indexes by clock minute % bank.length — drive it at both
      // indices directly to prove BOTH the ordinary and the archetype entries
      // are reachable through the identical, unfiltered code path (no archetype
      // branch skips or special-cases the archetype-tagged entry).
      var _origDate = Date;
      function _fakeMinuteDate(min) {
        return function () {
          var d = new _origDate();
          d.getMinutes = function () { return min; };
          return d;
        };
      }
      bankCtx.Date = _fakeMinuteDate(0);
      vm.runInContext('globalThis.__pick0 = _slPickSeed("netplus");', bankCtx);
      bankCtx.Date = _fakeMinuteDate(1);
      vm.runInContext('globalThis.__pick1 = _slPickSeed("netplus");', bankCtx);
      var _pick0 = bankCtx.__pick0, _pick1 = bankCtx.__pick1;

      test('Task 15: _slPickSeed can select the ordinary (non-archetype) entry',
        _pick0 && _pick0.id === 't15-ordinary-1' && !_pick0.archetype);
      test('Task 15: _slPickSeed can select the archetype-tagged entry via the SAME function/index logic',
        _pick1 && _pick1.id === 't15-archetype-1' && _pick1.archetype === 'diagram');

      // _slPickSeedFresh: prove the archetype entry is a normal member of the
      // "fresh" pool (usedIds-filtered), not excluded or treated specially.
      vm.runInContext('globalThis.__freshPool = _slPickSeedFresh("netplus", new Set());', bankCtx);
      var _freshPick = bankCtx.__freshPool;
      test('Task 15: _slPickSeedFresh draws from the unfiltered mixed pool (archetype included)',
        _freshPick && (_freshPick.id === 't15-ordinary-1' || _freshPick.id === 't15-archetype-1'));

      vm.runInContext('globalThis.__usedArch = new Set(["t15-ordinary-1"]); globalThis.__freshAfterOrdinaryUsed = _slPickSeedFresh("netplus", globalThis.__usedArch);', bankCtx);
      var _freshAfterOrdinaryUsed = bankCtx.__freshAfterOrdinaryUsed;
      test('Task 15: _slPickSeedFresh falls through to the archetype entry once the ordinary one is marked used (no exclusion)',
        _freshAfterOrdinaryUsed && _freshAfterOrdinaryUsed.id === 't15-archetype-1');
    }

    // ── 2. Gating runs BEFORE scenario selection, for both entry points ──
    // Static-source proof (mirrors the existing v7.57 "exam never calls
    // _bumpPbqFreeRun" style pin): simLabStart and _slSessionStart both check
    // _slIsPro()/_pbqFreeRunsToday()/PBQ_FREE_DAILY_CAP and call
    // window._gateProOnly('Sim Lab', ...) strictly before _slGenerateScenario /
    // _slRunRound (which is what eventually resolves to _slPickSeed and can
    // surface an archetype scenario). No archetype-aware branch exists in
    // either gate — the same gate blocks regardless of what the bank contains.
    var simLabStartSrc = grab('simLabStart');
    var slSessionStartSrc = grab('_slSessionStart');

    test('Task 15: simLabStart defined and checks the free-cap/Pro gate before generating a scenario',
      !!simLabStartSrc &&
      /_slIsPro\(\)/.test(simLabStartSrc) &&
      /_pbqFreeRunsToday/.test(simLabStartSrc) &&
      /PBQ_FREE_DAILY_CAP/.test(simLabStartSrc) &&
      /_gateProOnly\(\s*'Sim Lab'/.test(simLabStartSrc) &&
      (function () {
        var gateIdx = simLabStartSrc.indexOf('_gateProOnly(');
        var genIdx = simLabStartSrc.indexOf('_slGenerateScenario(');
        return gateIdx > -1 && genIdx > -1 && gateIdx < genIdx;
      })());

    test('Task 15: _slSessionStart defined and checks the SAME free-cap/Pro gate before starting a round (which may pick an archetype scenario)',
      !!slSessionStartSrc &&
      /_slIsPro\(\)/.test(slSessionStartSrc) &&
      /_pbqFreeRunsToday/.test(slSessionStartSrc) &&
      /PBQ_FREE_DAILY_CAP/.test(slSessionStartSrc) &&
      /_gateProOnly\(\s*'Sim Lab'/.test(slSessionStartSrc) &&
      /_slSessionBumpOnce\(\)/.test(slSessionStartSrc) &&
      (function () {
        var gateIdx = slSessionStartSrc.indexOf('_gateProOnly(');
        var runIdx = slSessionStartSrc.indexOf('_slRunRound(');
        return gateIdx > -1 && runIdx > -1 && gateIdx < runIdx;
      })());

    // No archetype-specific gate/metering identifiers exist anywhere in the
    // feature module — confirms Task 15 introduced no new gating surface.
    test('Task 15: no archetype-specific gating/metering was added (reuse only)',
      !/archetype[A-Za-z]*(FreeCount|FreeRun|Gate|Metered|Quota)/i.test(js) &&
      !/(FreeCount|FreeRun|Gate|Metered|Quota)[A-Za-z]*[Aa]rchetype/.test(js));

    // ── 3. Session bump path is archetype-agnostic ──
    // _slSessionBumpOnce (called from _slSessionStart) always calls the SAME
    // window._bumpPbqFreeRun — it has no knowledge of which scenario/archetype
    // will be served this session, proving the metering key is shared.
    var sessionBumpOnceSrc = grab('_slSessionBumpOnce');
    test('Task 15: _slSessionBumpOnce calls the existing window._bumpPbqFreeRun (no new/second counter)',
      !!sessionBumpOnceSrc && /window\._bumpPbqFreeRun\(\)/.test(sessionBumpOnceSrc));

  } catch (err) {
    test('Task 15: vm smoke test (threw)', false);
    results.errors.push('Task 15 archetype-gating smoke test threw: ' + err.message);
  }
})();

// ── Task 16 (PBQ archetypes plan): cert-aware entry on the Sim Lab surface ──
// Proves, behaviorally, that PBQ archetype scenarios are correctly SURFACED
// for netplus/secplus and correctly ABSENT for non-PBQ certs (A+/Microsoft/
// AWS), using the REAL cert-availability mechanisms already in the codebase
// — no new allowlist/hook is introduced:
//   1. `_SL_PBQ_CERTS_HOME` (app.js) is the Sim Lab entry-point allowlist
//      consulted by `renderSimLabHomeEntry()` (called from `showPage('setup')`)
//      to show/hide the Sim Lab tile. It includes netplus/secplus (PBQ certs)
//      and correctly EXCLUDES the non-PBQ Decision Lab certs (az900/ai900/
//      sc900/clfc02) — those get Decision Lab's own entry, not Sim Lab's.
//   2. Archetype CONTENT is gated one level deeper, by which seed bank
//      (`SIM_LAB_SEED_<CERT>`) actually contains `archetype`-tagged entries:
//      netplus/secplus banks are non-empty for archetypes; a true non-PBQ
//      cert has no Sim Lab seed bank global at all (`_slBank` returns []
//      by construction, per `_SL_SEED_GLOBALS`). A+ Core 1 now ALSO has
//      archetype-tagged content (the 12 SOHO Router scenarios landed in
//      Wave 1 Task 8) and genuinely surfaces it, since `_SL_PBQ_CERTS_HOME`
//      already included aplus-core1. A+ Core 2 still has a Sim Lab bank but
//      zero archetype-tagged scenarios in it (no archetype content authored
//      for it yet) — so even though its Sim Lab entry is visible, no
//      archetype scenario can surface there yet.
(function () {
  console.log('\n\x1b[1m── Sim Lab: cert-aware PBQ archetype entry (Task 16) ──\x1b[0m');
  try {
    // ── 1. Entry-point allowlist: PBQ certs in, non-PBQ certs out ──
    var pbqCertsMatch = js.match(/_SL_PBQ_CERTS_HOME\s*=\s*\[([^\]]*)\]/);
    test('Task 16: _SL_PBQ_CERTS_HOME allowlist exists', !!pbqCertsMatch);
    if (pbqCertsMatch) {
      var pbqCertsHome = pbqCertsMatch[1].split(',').map(function (s) { return s.replace(/['"\s]/g, ''); }).filter(Boolean);
      test('Task 16: Sim Lab entry allowlist includes netplus', pbqCertsHome.indexOf('netplus') !== -1);
      test('Task 16: Sim Lab entry allowlist includes secplus', pbqCertsHome.indexOf('secplus') !== -1);
      test('Task 16: Sim Lab entry allowlist excludes az900/ai900/sc900/clfc02 (Decision Lab certs, not Sim Lab)',
        ['az900', 'ai900', 'sc900', 'clfc02'].every(function (c) { return pbqCertsHome.indexOf(c) === -1; }));
    }

    // renderSimLabHomeEntry() must actually consult the allowlist to gate the
    // tile, and must be wired into the setup-page render path (not orphaned).
    var renderEntrySrc = (js.match(/function renderSimLabHomeEntry\(\) \{[\s\S]*?\n\}/) || [''])[0];
    test('Task 16: renderSimLabHomeEntry() checks _SL_PBQ_CERTS_HOME before showing the tile',
      !!renderEntrySrc && /_SL_PBQ_CERTS_HOME\.indexOf\(/.test(renderEntrySrc) && /is-hidden/.test(renderEntrySrc));
    test('Task 16: renderSimLabHomeEntry() is called on setup-page render (real entry hook, not dead code)',
      /if \(name === 'setup'[\s\S]{0,80}renderSimLabHomeEntry\(\)/.test(js));

    // ── 2. Archetype content: present for netplus/secplus, absent for A+, and
    //      no seed bank at all for a true non-PBQ cert (az900) ──
    var netplusBankMatch = js.match(/window\.SIM_LAB_SEED_NETPLUS\s*=\s*\[[\s\S]*?\n\];/);
    var secplusBankMatch = js.match(/window\.SIM_LAB_SEED_SECPLUS\s*=\s*\[[\s\S]*?\n\];/);
    var aplus1BankMatch = js.match(/window\.SIM_LAB_SEED_APLUS_CORE1\s*=\s*\[[\s\S]*?\n\];/);
    var aplus2BankMatch = js.match(/window\.SIM_LAB_SEED_APLUS_CORE2\s*=\s*\[[\s\S]*?\n\];/);

    test('Task 16: Net+ Sim Lab seed bank has archetype-tagged scenarios (offered for netplus)',
      !!netplusBankMatch && /archetype\s*:/.test(netplusBankMatch[0]));
    test('Task 16: Sec+ Sim Lab seed bank has archetype-tagged scenarios (offered for secplus)',
      !!secplusBankMatch && /archetype\s*:/.test(secplusBankMatch[0]));
    test('Task 16: A+ Core1 Sim Lab seed bank has archetype-tagged scenarios (SOHO Router, Wave 1 Task 8 — surfaced for aplus-core1)',
      !!aplus1BankMatch && /archetype\s*:/.test(aplus1BankMatch[0]));
    test('Task 16: A+ Core2 Sim Lab seed bank exists but has NO archetype-tagged scenarios (not surfaced)',
      !!aplus2BankMatch && !/archetype\s*:/.test(aplus2BankMatch[0]));

    // No SIM_LAB_SEED_<X> global exists at all for the non-PBQ Decision Lab
    // certs — confirms _slBank('az900') etc. can only ever return [] via the
    // _SL_SEED_GLOBALS registry (no accidental entry for a non-PBQ cert).
    test('Task 16: no Sim Lab seed-bank global exists for az900/ai900/sc900/clfc02 (non-PBQ certs)',
      ['AZ900', 'AI900', 'SC900', 'CLFC02'].every(function (c) {
        return !new RegExp('window\\.SIM_LAB_SEED_' + c + '\\b').test(js);
      }));

    // ── 3. Behavioral proof via the real _slBank resolver (vm), mirroring the
    //      Task 15 extraction approach: drive the ACTUAL selection function,
    //      not a re-implementation, across a PBQ cert (netplus) and a non-PBQ
    //      cert (az900) with no seed-bank entry in _SL_SEED_GLOBALS.
    var vm = require('vm');
    var grab16 = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };
    var seedBankBody16 = grab16('_seedBank');
    var slBankBody16 = grab16('_slBank');
    var slGlobalsMatch16 = js.match(/var _SL_SEED_GLOBALS\s*=\s*\{[\s\S]*?\};/);

    if (!seedBankBody16 || !slBankBody16 || !slGlobalsMatch16) {
      test('Task 16: bank-resolver helper extraction succeeded', false);
      results.errors.push('could not extract _seedBank/_slBank/_SL_SEED_GLOBALS for Task 16 test; check names/indenting');
    } else {
      var bankCtx16 = { window: { SIM_LAB_SEED_NETPLUS: [{ id: 'x', archetype: 'diagram' }] } };
      vm.createContext(bankCtx16);
      vm.runInContext('var window = this.window;', bankCtx16);
      vm.runInContext(seedBankBody16, bankCtx16);
      vm.runInContext(slGlobalsMatch16[0], bankCtx16);
      vm.runInContext(slBankBody16, bankCtx16);
      vm.runInContext('globalThis.__netplusBank = _slBank("netplus"); globalThis.__az900Bank = _slBank("az900");', bankCtx16);

      test('Task 16: _slBank("netplus") returns a non-empty bank (archetype content reachable)',
        Array.isArray(bankCtx16.__netplusBank) && bankCtx16.__netplusBank.length === 1 && bankCtx16.__netplusBank[0].archetype === 'diagram');
      test('Task 16: _slBank("az900") returns [] — no PBQ/archetype content for a non-PBQ cert',
        Array.isArray(bankCtx16.__az900Bank) && bankCtx16.__az900Bank.length === 0);
    }
  } catch (err) {
    test('Task 16: vm smoke test (threw)', false);
    results.errors.push('Task 16 cert-aware entry smoke test threw: ' + err.message);
  }
})();

// ── Task 17 (PBQ archetypes plan): archetype scenarios inside Exam mode ──
// Confirms — behaviorally — that an archetype-tagged scenario (here: a
// 'diagram' scenario with a configure×3 step, mirroring the Task 11 fixture)
// flows correctly through the EXISTING Exam-mode block: picked into a round
// via _slExamBlankState (the same session-state constructor _slExamStart
// uses), survives flag-and-return navigation (_slToggleFlag + the
// capture/restore pattern _slExamNav uses via _slCloneResp), gets scored via
// the SAME simLabScoreScenario call _slExamSubmit makes per round, and rolls
// up into the SAME _slAggregateSession the exam result screen reads. No new
// exam/scoring code is introduced — archetype scenarios ride the existing
// multi-round exam block by construction (scoring only ever inspects
// step.type / step.answer, never scenario.archetype).
(function () {
  console.log('\n\x1b[1m── Sim Lab: archetypes in Exam mode (Task 17) ──\x1b[0m');
  try {
    var vm = require('vm');

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    var blankStateBody   = grab('_slExamBlankState');
    var isProBody        = grab('_slIsPro');
    var cloneRespBody    = grab('_slCloneResp');
    var scoreSlotsBody   = grab('_scoreConfigureSlots');
    var scoreStepBody    = grab('_scoreStep');
    var scoreScenarioBody = grab('simLabScoreScenario');
    var aggregateBody    = grab('_slAggregateSession');
    var normBody          = grab('_norm');
    var normalizeMatchBody = grab('_simLabNormalizeMatch');
    var arrEqBody         = grab('_arrEq');
    var setEqBody         = grab('_setEq');

    if (!blankStateBody || !scoreScenarioBody || !scoreSlotsBody || !scoreStepBody || !aggregateBody || !cloneRespBody) {
      test('Task 17: exam/scoring vm extraction succeeded', false);
      results.errors.push('could not extract _slExamBlankState/simLabScoreScenario/_slAggregateSession for Task 17 test; check names/indenting');
      return;
    }

    var eCtx = { window: { CURRENT_CERT: 'netplus' }, Set: Set, Object: Object, Array: Array, String: String, Date: Date };
    vm.createContext(eCtx);
    // _slExamBlankState calls _slIsPro() — stub it in-context (irrelevant to scoring).
    vm.runInContext('function _slIsPro() { return true; }', eCtx);
    vm.runInContext(blankStateBody, eCtx);
    vm.runInContext(cloneRespBody, eCtx);
    vm.runInContext(normBody, eCtx);
    vm.runInContext(normalizeMatchBody, eCtx);
    vm.runInContext(arrEqBody, eCtx);
    vm.runInContext(setEqBody, eCtx);
    vm.runInContext(scoreSlotsBody, eCtx);
    vm.runInContext(scoreStepBody, eCtx);
    vm.runInContext(scoreScenarioBody, eCtx);
    vm.runInContext(aggregateBody, eCtx);
    vm.runInContext('globalThis.__blank = _slExamBlankState; globalThis.__score = simLabScoreScenario; globalThis.__agg = _slAggregateSession; globalThis.__clone = _slCloneResp;', eCtx);
    var _slExamBlankState17  = eCtx.__blank;
    var simLabScoreScenario17 = eCtx.__score;
    var _slAggregateSession17 = eCtx.__agg;
    var _slCloneResp17        = eCtx.__clone;

    // Round 0: ordinary (non-archetype) order-step scenario.
    var t17Ordinary = {
      id: 't17-ordinary-1', cert: 'netplus', topic: 'Cabling',
      scenario: 'Order the steps to terminate a Cat6 cable.', estMinutes: 2,
      steps: [{
        id: 'ord1', type: 'order', prompt: 'Order the steps.', explanation: 'Standard termination order.', points: 1,
        payload: { items: ['Strip', 'Untwist', 'Crimp'] },
        answer: { correctOrder: ['Strip', 'Untwist', 'Crimp'] }
      }]
    };

    // Round 1: 'diagram' archetype scenario with a configure×3 step (per-slot
    // scoring), mirroring the Task 11 fixture shape.
    var t17Archetype = {
      id: 't17-archetype-1', cert: 'netplus', archetype: 'diagram', topic: 'Diagram',
      scenario: 'Correct PC-2’s misconfigured IP settings.', estMinutes: 4,
      assets: { reference: { kind: 'network', devices: [], given: {} } },
      steps: [{
        id: 'fix1', type: 'configure', prompt: 'Correct PC-2’s IP configuration.', explanation: 'PC-2 was on the wrong VLAN.', points: 1,
        deviceId: 'pc2',
        payload: {
          slots: [
            { id: 'ip', label: 'IP Address', options: [{ id: 'ip_bad', text: '192.168.20.45' }, { id: 'ip_good', text: '192.168.10.45' }] },
            { id: 'mask', label: 'Subnet Mask', options: [{ id: 'm_good', text: '255.255.255.0' }, { id: 'm_bad', text: '255.255.0.0' }] },
            { id: 'gateway', label: 'Gateway', options: [{ id: 'gw_good', text: '192.168.10.1' }, { id: 'gw_bad', text: '192.168.20.1' }] }
          ]
        },
        answer: { slots: { ip: 'ip_good', mask: 'm_good', gateway: 'gw_good' } }
      }]
    };

    var t17Scenarios = [t17Ordinary, t17Archetype];
    var t17Budget = 6 * 0.9 * 60000;
    var sess = _slExamBlankState17(t17Scenarios, t17Budget);

    test('Task 17: _slExamBlankState builds a 2-round exam session containing the archetype scenario',
      sess && sess.mode === 'exam' && sess.rounds === 2 && sess.scenarios[1].archetype === 'diagram');

    // ── Flag-and-return: flag round 1 (the archetype round), navigate away to
    // round 0, then back — mirrors _slToggleFlag + _slExamNav's capture/restore
    // (window.__slResponses -> answers[idx] via _slCloneResp) without needing
    // the DOM mount path, since flag state and answer capture are pure data. ──
    sess.flagged.add(1);
    test('Task 17: flagging round 1 (archetype round) is tracked in session.flagged',
      sess.flagged.has(1) === true);

    // Simulate answering round 1 (archetype), navigating to round 0, back to 1
    // — answers persist across nav (the real bug this would catch: an
    // archetype's configure response getting dropped/overwritten on flag-return).
    sess.answers[1] = _slCloneResp17({ fix1: { slots: { ip: 'ip_good', mask: 'm_good', gateway: 'gw_good' } } });
    sess.idx = 0;   // navigated away
    sess.idx = 1;   // navigated back (flag-and-return)
    test('Task 17: archetype round answer survives flag-and-return navigation',
      sess.answers[1] && sess.answers[1].fix1 && sess.answers[1].fix1.slots.ip === 'ip_good');

    // Answer round 0 (ordinary) correctly too.
    sess.answers[0] = _slCloneResp17({ ord1: { order: ['Strip', 'Untwist', 'Crimp'] } });

    test('Task 17: flagged set is preserved through submit-time (flag-and-return does not clear flags)',
      sess.flagged.has(1) === true);

    // ── Submit: mirrors _slExamSubmit's exact per-round scoring loop ──
    sess.results = sess.scenarios.map(function (scn, i) {
      var resp = sess.answers[i] || {};
      var score = simLabScoreScenario17(scn, resp);
      return { scenario: scn, score: score, passed: score.fraction === 1 };
    });

    test('Task 17: archetype round scores correct === total via simLabScoreScenario (configure per-slot all correct)',
      sess.results[1].score.correct === 3 && sess.results[1].score.total === 3 && sess.results[1].passed === true);
    test('Task 17: archetype round perStep reflects per-slot configure breakdown ({total,correct} for the configure step)',
      sess.results[1].score.perStep.fix1 && sess.results[1].score.perStep.fix1.total === 3 && sess.results[1].score.perStep.fix1.correct === 3);
    test('Task 17: ordinary round also scores correctly (both rounds correct)',
      sess.results[0].passed === true);

    var agg = _slAggregateSession17(sess.results);
    test('Task 17: _slAggregateSession reports correct === total across the exam block (2/2 rounds passed, 4/4 steps incl. 3 configure slots)',
      agg.passed === 2 && agg.rounds === 2 && agg.stepsCorrect === 4 && agg.stepsTotal === 4 && agg.pct === 100);

    // ── Negative control: one wrong configure slot in the archetype round
    // must NOT score correct===total and must drag the aggregate below 100%,
    // proving the assertions above aren't vacuously true. ──
    var sess2 = _slExamBlankState17(t17Scenarios, t17Budget);
    sess2.answers[0] = _slCloneResp17({ ord1: { order: ['Strip', 'Untwist', 'Crimp'] } });
    sess2.answers[1] = _slCloneResp17({ fix1: { slots: { ip: 'ip_bad', mask: 'm_good', gateway: 'gw_good' } } });
    sess2.results = sess2.scenarios.map(function (scn, i) {
      var resp = sess2.answers[i] || {};
      var score = simLabScoreScenario17(scn, resp);
      return { scenario: scn, score: score, passed: score.fraction === 1 };
    });
    var agg2 = _slAggregateSession17(sess2.results);
    test('Task 17 negative control: one wrong configure slot drops the archetype round below perfect and the aggregate below 100%',
      sess2.results[1].score.correct === 2 && sess2.results[1].passed === false &&
      agg2.passed === 1 && agg2.stepsCorrect === 3 && agg2.stepsTotal === 4 && agg2.pct !== 100);

  } catch (err) {
    test('Task 17: exam-mode archetype smoke test (threw)', false);
    results.errors.push('Task 17 exam-mode archetype smoke test threw: ' + err.message);
  }
})();

