// tests/uat/240-simlab-feedback-portmap-wiremap-raid-final.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Sim Lab configure-step feedback fix, port-map/wiremap/PC-build fidelity validators + seed-banks, RAID workbench seed-bank, Wave 3 final vertical slice

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── v7.61.1: Sim Lab — _slRenderFeedback configure-step partial-credit fix ──
// Live-browser verification (Task 10, Wave 1 build) caught a real defect:
// simLabScoreScenario stores perStep[st.id] as an OBJECT {total,correct} for
// 'configure' steps (a partial-credit breakdown) but as a plain BOOLEAN for
// every other step type. _slRenderFeedback's `var ok = score.perStep[st.id]`
// then does `ok ? 'sl-ok' : 'sl-bad'` — any non-null object is truthy, so a
// configure step with SOME-but-not-all slots correct (correct < total) still
// rendered the green ✓ / 'sl-ok' row and hid the explanation behind the
// "You nailed this one" lock, even though the student got part of it wrong.
// This proves both directions: a partial configure step must render sl-bad
// + the explanation, and a fully-correct configure step must still render
// sl-ok (positive control, so the fix doesn't just flip the class always).
(function () {
  console.log('\n\x1b[1m── Sim Lab: _slRenderFeedback configure-step partial-credit (v7.61.1) ──\x1b[0m');
  try {
    var vm = require('vm');

    // _esc collides with a same-named (but DOM-independent) helper in
    // features/reports.js, which sorts before sim-lab.js in the concatenated
    // `js` blob — a plain _fnBody(js, '_esc') would grab the WRONG one. The
    // real sim-lab _esc is single-line, so grabLine (same trick Task 11 uses)
    // uniquely picks it out; reports.js's version is multi-line and won't match.
    var grabLine = function (name) {
      var re = new RegExp('function ' + name + '\\([^\\n]*\\)\\s*\\{[^\\n]*\\}');
      return (js.match(re) || [''])[0];
    };

    var elBody             = _fnBody(js, '_el');
    var escBody             = grabLine('_esc');
    var scoreSlotsBody      = _fnBody(js, '_scoreConfigureSlots');
    var scoreScenarioBody   = _fnBody(js, 'simLabScoreScenario');
    var renderFeedbackBody  = _fnBody(js, '_slRenderFeedback');

    if (!elBody || !escBody || !scoreSlotsBody || !scoreScenarioBody || !renderFeedbackBody) {
      test('feedback partial-credit: vm extraction succeeded', false);
      results.errors.push('could not extract _el/_esc/_scoreConfigureSlots/simLabScoreScenario/_slRenderFeedback; check names/indenting');
      return;
    }

    // Minimal DOM shim — same pattern as the Task 6 net-renderer test: _esc()
    // does `d.textContent = s; return d.innerHTML;`, so textContent must
    // populate innerHTML for escaping (and _el's third arg, the icon glyph)
    // to round-trip correctly.
    var htmlEsc = function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    var makeEl = function (tag) {
      var attrs = {}, children = [], cls = '', inner = '';
      var el = {
        tagName: tag.toUpperCase(),
        get className() { return cls; },
        set className(v) { cls = v; },
        get innerHTML() { return inner; },
        set innerHTML(v) { inner = v; children = []; },
        get textContent() { return ''; },
        set textContent(v) { inner = htmlEsc(v); },
        style: {},
        get _children() { return children; },
        setAttribute: function (k, v) { attrs[k] = v; },
        getAttribute: function (k) { return attrs[k] || null; },
        appendChild: function (c) { children.push(c); return c; }
      };
      return el;
    };
    var docShim = { createElement: function (tag) { return makeEl(tag); } };

    var fCtx = { document: docShim, window: { CSS: null }, Object: Object, Array: Array, String: String, Math: Math };
    vm.createContext(fCtx);
    vm.runInContext(elBody, fCtx);
    vm.runInContext(escBody, fCtx);
    vm.runInContext(scoreSlotsBody, fCtx);
    vm.runInContext(scoreScenarioBody, fCtx);
    vm.runInContext(renderFeedbackBody, fCtx);
    vm.runInContext('globalThis.__score = simLabScoreScenario; globalThis.__render = _slRenderFeedback;', fCtx);
    var fScoreScenario = fCtx.__score;
    var fRenderFeedback = fCtx.__render;

    // Fixture: two configure steps — one partial (1 of 2 slots correct), one
    // fully correct. No other step types needed; _scoreStep is never reached
    // since every step here is 'configure'.
    var fScn = {
      id: 'fb-partial-fixture',
      steps: [
        {
          id: 'cfgPartial', type: 'configure', prompt: 'Configure the partial step',
          explanation: 'Slot B needed the other value.',
          answer: { slots: { a: 'a_good', b: 'b_good' } }
        },
        {
          id: 'cfgFull', type: 'configure', prompt: 'Configure the fully-correct step',
          explanation: 'Both slots were right.',
          answer: { slots: { c: 'c_good', d: 'd_good' } }
        }
      ]
    };
    var fResponses = {
      cfgPartial: { slots: { a: 'a_good', b: 'b_bad' } },  // 1 of 2 correct
      cfgFull:    { slots: { c: 'c_good', d: 'd_good' } }  // 2 of 2 correct
    };

    var fScore = fScoreScenario(fScn, fResponses);

    // Sanity: the NUMERIC scoring (untouched by this fix) is correct —
    // confirms the bug is purely in the feedback renderer's truthiness check.
    test('feedback partial-credit fixture: numeric scoring reports correct < total for the partial configure step',
      fScore.perStep.cfgPartial && fScore.perStep.cfgPartial.correct === 1 && fScore.perStep.cfgPartial.total === 2);
    test('feedback partial-credit fixture: numeric scoring reports correct === total for the fully-correct configure step',
      fScore.perStep.cfgFull && fScore.perStep.cfgFull.correct === 2 && fScore.perStep.cfgFull.total === 2);

    var fHost = makeEl('div');
    fRenderFeedback(fHost, fScn, fScore, { mode: 'free' });

    var fRoot = fHost._children[0];
    var fRows = fRoot ? fRoot._children.filter(function (c) { return /sl-fb-row/.test(c.className); }) : [];
    test('feedback partial-credit: renderer produced one row per step (2)', fRows.length === 2);

    var rowPartial = fRows[0];
    var rowFull = fRows[1];

    // ── The bug, made concrete: partial configure step must be sl-bad ──
    test('feedback partial-credit: partial configure-step row is sl-bad (NOT sl-ok) when correct < total',
      !!rowPartial && rowPartial.className === 'sl-fb-row sl-bad');

    var partialIcon = rowPartial && rowPartial._children[0];
    test('feedback partial-credit: partial configure-step row shows the ✗ icon (NOT ✓)',
      !!partialIcon && partialIcon.innerHTML === '✗');

    var partialWhy = rowPartial && rowPartial._children.filter(function (c) { return c.className === 'sl-fb-why'; })[0];
    var partialLocked = rowPartial && rowPartial._children.filter(function (c) { return c.className === 'sl-fb-locked'; })[0];
    test('feedback partial-credit: partial configure-step row reveals the explanation (NOT the locked message)',
      !!partialWhy && !partialLocked);

    // ── Positive control: a fully-correct configure step must still be sl-ok ──
    test('feedback partial-credit: fully-correct configure-step row is sl-ok (positive control)',
      !!rowFull && rowFull.className === 'sl-fb-row sl-ok');

    var fullIcon = rowFull && rowFull._children[0];
    test('feedback partial-credit: fully-correct configure-step row shows the ✓ icon',
      !!fullIcon && fullIcon.innerHTML === '✓');

  } catch (err) {
    test('feedback partial-credit: vm smoke test (threw)', false);
    results.errors.push('feedback partial-credit smoke test threw: ' + err.message);
  }
})();

// ── Wave 3 Task 5: port-map fidelity validator ──
(function () {
  var vm = require('vm');
  var grab = function (n) { return _fnBody(js, n); };
  var sigVar = (js.match(/var _PORTMAP_FAULT_SIG = \{[\s\S]*?\n\s*\};/) || [''])[0];
  var body = [grab('_isNonEmptyStr'), grab('_slFidelityResolveSlot'), sigVar, grab('simLabValidatePortMapFidelity')].join('\n');
  if (!sigVar || body.indexOf('simLabValidatePortMapFidelity') === -1) { results.errors.push('could not extract portmap validator'); return; }
  var pCtx = {}; vm.createContext(pCtx); vm.runInContext(body, pCtx);
  vm.runInContext('globalThis.__pm = simLabValidatePortMapFidelity;', pCtx);
  var pm = pCtx.__pm;

  var scn = {
    portmap: { faultPort: 'gi0-8' },
    assets: { reference: { kind: 'faceplate', host: 'h', ports: [
      { id: 'gi0-1', label: 'Gi0/1', led: 'up', select: true },
      { id: 'gi0-8', label: 'Gi0/8', led: 'poe-fault', select: true },
      { id: 'gi0-18', label: 'Gi0/18', led: 'up', select: true }
    ] } },
    steps: [
      { id: 'prov', type: 'configure', points: 1, payload: { slots: [
        { id: 'gi0-1__vlan', label: 'v', options: [{ id: 'a', text: 'VLAN 10' }, { id: 'b', text: 'VLAN 20' }] },
        { id: 'gi0-1__poe', label: 'p', options: [{ id: 'a', text: 'Off' }, { id: 'b', text: 'On' }] },
        { id: 'gi0-8__vlan', label: 'v', options: [{ id: 'a', text: 'VLAN 40' }, { id: 'b', text: 'VLAN 10' }] },
        { id: 'gi0-8__poe', label: 'p', options: [{ id: 'a', text: 'On' }, { id: 'b', text: 'Off' }] }
      ] }, answer: { slots: { 'gi0-1__vlan': 'a', 'gi0-1__poe': 'a', 'gi0-8__vlan': 'a', 'gi0-8__poe': 'a' } } },
      { id: 'diag', type: 'analyze', points: 1, payload: { multi: false, mode: 'facePorts' }, answer: { selected: ['gi0-8'] } },
      { id: 'fix', type: 'configure', points: 1, payload: { slots: [
        { id: 'rootCause', label: 'r', options: [{ id: 'a', text: 'PoE overcurrent: the camera draw exceeds the port class' }, { id: 'b', text: 'Wrong VLAN' }] },
        { id: 'fix', label: 'f', options: [{ id: 'a', text: 'Move to a port with a higher PoE power budget' }, { id: 'b', text: 'Change VLAN' }] }
      ] }, answer: { slots: { rootCause: 'a', fix: 'a' } } }
    ],
    portmapTickets: [ { port: 'gi0-1', vlan: '10', poe: false }, { port: 'gi0-8', vlan: '40', poe: true } ]
  };
  test('portmap: sound PoE-overcurrent scenario passes', pm(scn).ok === true);
  var bad1 = JSON.parse(JSON.stringify(scn)); bad1.steps[0].answer.slots['gi0-1__vlan'] = 'b';
  test('portmap: keyed VLAN not matching the ticket rejected', pm(bad1).ok === false);
  var bad2 = JSON.parse(JSON.stringify(scn)); bad2.assets.reference.ports[2].led = 'poe-fault';
  test('portmap: a second port sharing the fault LED breaks fault-port uniqueness', pm(bad2).ok === false);
  var bad3 = JSON.parse(JSON.stringify(scn)); bad3.steps[2].answer.slots.rootCause = 'b';
  test('portmap: keyed rootCause not matching the LED-signaled fault rejected', pm(bad3).ok === false);
})();

// ── Wave 3 Task 10: Net+ Switch Port-Map Grid seed-bank validation ──
// The 12 consensus-approved (two-agent gated) Net+ Port-Map scenarios now
// live for real in features/sim-lab-seed-netplus.js
// (window.SIM_LAB_SEED_NETPLUS). This proves every one of them is real,
// production-ready content: each passes the same pure validators that gate
// the dev fixtures above (simLabValidateScenario +
// simLabValidatePortMapFidelity), extracted from features/sim-lab.js the
// same way the Wave 2 Task 8/9 bank blocks do.
(function () {
  console.log('\n\x1b[1m── Sim Lab: Net+ Switch Port-Map Grid seed-bank validation (Wave 3 Task 10) ──\x1b[0m');
  try {
    var vm = require('vm');

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    // ── Extract the REAL pure validators from features/sim-lab.js, exactly
    // as the Wave 2 CLI/discovery bank blocks do ──
    var isNonEmptyStrBody    = grab('_isNonEmptyStr');
    var validatePayloadBody  = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    var resolveSlotBody   = grab('_slFidelityResolveSlot');
    var sigVar             = (js.match(/var _PORTMAP_FAULT_SIG = \{[\s\S]*?\n\s*\};/) || [''])[0];
    var portmapFidelityBody = grab('simLabValidatePortMapFidelity');

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody ||
        !resolveSlotBody || !sigVar || !portmapFidelityBody) {
      test('Net+ Port-Map bank: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Wave 3 Task 10 bank test; check names/indenting');
      return;
    }

    var vCtx = {};
    vm.createContext(vCtx);
    vm.runInContext(stepTypesDecl, vCtx);
    vm.runInContext(isNonEmptyStrBody, vCtx);
    vm.runInContext(validatePayloadBody, vCtx);
    vm.runInContext(validateScenarioBody, vCtx);
    vm.runInContext(resolveSlotBody, vCtx);
    vm.runInContext(sigVar, vCtx);
    vm.runInContext(portmapFidelityBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario; globalThis.__pmFidelity = simLabValidatePortMapFidelity;', vCtx);
    var simLabValidateScenario = vCtx.__validate;
    var simLabValidatePortMapFidelity = vCtx.__pmFidelity;

    // ── Load the real seed bank: eval features/sim-lab-seed-netplus.js in a
    // sandbox with `var window = {}` so window.SIM_LAB_SEED_NETPLUS populates ──
    var seedSrc = read('features/sim-lab-seed-netplus.js');
    var seedCtx = {};
    vm.createContext(seedCtx);
    vm.runInContext('var window = {};\n' + seedSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_NETPLUS;', seedCtx);
    var seedBank = seedCtx.__seed;

    test('Net+ Port-Map bank: window.SIM_LAB_SEED_NETPLUS loaded as an array',
      Array.isArray(seedBank));
    if (!Array.isArray(seedBank)) {
      results.errors.push('could not load window.SIM_LAB_SEED_NETPLUS from features/sim-lab-seed-netplus.js');
      return;
    }

    var portmapScenarios = seedBank.filter(function (s) { return s && s.archetype === 'portmap'; });
    test('Net+ Port-Map bank: at least 10 portmap-archetype scenarios present',
      portmapScenarios.length >= 10);

    var allValidateOk = true, allFidelityOk = true, allCertOk = true;
    portmapScenarios.forEach(function (s) {
      var vr = simLabValidateScenario(s);
      if (!vr || vr.ok !== true) {
        allValidateOk = false;
        results.errors.push('Net+ Port-Map bank: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
      var fr = simLabValidatePortMapFidelity(s);
      if (!fr || fr.ok !== true) {
        allFidelityOk = false;
        results.errors.push('Net+ Port-Map bank: ' + (s && s.id) + ' failed simLabValidatePortMapFidelity: ' + JSON.stringify(fr && fr.errors));
      }
      if (!s || s.cert !== 'netplus') {
        allCertOk = false;
        results.errors.push('Net+ Port-Map bank: ' + (s && s.id) + ' has cert !== netplus: ' + JSON.stringify(s && s.cert));
      }
    });

    test('Net+ Port-Map bank: every portmap scenario passes simLabValidateScenario',
      allValidateOk);
    test('Net+ Port-Map bank: every portmap scenario passes simLabValidatePortMapFidelity',
      allFidelityOk);
    test('Net+ Port-Map bank: every portmap scenario has cert === netplus',
      allCertOk);

  } catch (err) {
    test('Net+ Port-Map bank: vm smoke test (threw)', false);
    results.errors.push('Net+ Port-Map bank smoke test threw: ' + err.message);
  }
})();

// ── Wave 3 Task 11: Net+ Cable-Test Wiremap seed-bank validation ──
// The 12 consensus-approved (two-agent gated) Net+ Wiremap scenarios now
// live for real in features/sim-lab-seed-netplus.js
// (window.SIM_LAB_SEED_NETPLUS). This proves every one of them is real,
// production-ready content: each passes the same pure validators that gate
// the dev fixtures above (simLabValidateScenario +
// simLabValidateWiremapFidelity), extracted from features/sim-lab.js the
// same way the Wave 3 Task 10 bank block does.
(function () {
  console.log('\n\x1b[1m── Sim Lab: Net+ Cable-Test Wiremap seed-bank validation (Wave 3 Task 11) ──\x1b[0m');
  try {
    var vm = require('vm');

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    // ── Extract the REAL pure validators from features/sim-lab.js, exactly
    // as the Wave 3 Task 10 bank block does ──
    var isNonEmptyStrBody    = grab('_isNonEmptyStr');
    var validatePayloadBody  = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    var resolveSlotBody   = grab('_slFidelityResolveSlot');
    var faultSigVar = (js.match(/var _WIREMAP_FAULT_SIG = \{[\s\S]*?\n\s*\};/) || [''])[0];
    var expectedPairVar = (js.match(/var _WM_EXPECTED_PAIR = \{[\s\S]*?\n\s*\};/) || [''])[0];
    var wiremapFidelityBody = grab('simLabValidateWiremapFidelity');

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody ||
        !resolveSlotBody || !faultSigVar || !expectedPairVar || !wiremapFidelityBody) {
      test('Net+ Wiremap bank: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Wave 3 Task 11 bank test; check names/indenting');
      return;
    }

    var vCtx = {};
    vm.createContext(vCtx);
    vm.runInContext(stepTypesDecl, vCtx);
    vm.runInContext(isNonEmptyStrBody, vCtx);
    vm.runInContext(validatePayloadBody, vCtx);
    vm.runInContext(validateScenarioBody, vCtx);
    vm.runInContext(resolveSlotBody, vCtx);
    vm.runInContext(faultSigVar, vCtx);
    vm.runInContext(expectedPairVar, vCtx);
    vm.runInContext(wiremapFidelityBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario; globalThis.__wmFidelity = simLabValidateWiremapFidelity;', vCtx);
    var simLabValidateScenario = vCtx.__validate;
    var simLabValidateWiremapFidelity = vCtx.__wmFidelity;

    // ── Load the real seed bank: eval features/sim-lab-seed-netplus.js in a
    // sandbox with `var window = {}` so window.SIM_LAB_SEED_NETPLUS populates ──
    var seedSrc = read('features/sim-lab-seed-netplus.js');
    var seedCtx = {};
    vm.createContext(seedCtx);
    vm.runInContext('var window = {};\n' + seedSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_NETPLUS;', seedCtx);
    var seedBank = seedCtx.__seed;

    test('Net+ Wiremap bank: window.SIM_LAB_SEED_NETPLUS loaded as an array',
      Array.isArray(seedBank));
    if (!Array.isArray(seedBank)) {
      results.errors.push('could not load window.SIM_LAB_SEED_NETPLUS from features/sim-lab-seed-netplus.js');
      return;
    }

    var wmScenarios = seedBank.filter(function (s) { return s && s.archetype === 'wiremap'; });
    test('Net+ Wiremap bank: at least 10 wiremap-archetype scenarios present',
      wmScenarios.length >= 10);

    var allValidateOk = true, allFidelityOk = true, allCertOk = true;
    wmScenarios.forEach(function (s) {
      var vr = simLabValidateScenario(s);
      if (!vr || vr.ok !== true) {
        allValidateOk = false;
        results.errors.push('Net+ Wiremap bank: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
      var fr = simLabValidateWiremapFidelity(s);
      if (!fr || fr.ok !== true) {
        allFidelityOk = false;
        results.errors.push('Net+ Wiremap bank: ' + (s && s.id) + ' failed simLabValidateWiremapFidelity: ' + JSON.stringify(fr && fr.errors));
      }
      if (!s || s.cert !== 'netplus') {
        allCertOk = false;
        results.errors.push('Net+ Wiremap bank: ' + (s && s.id) + ' has cert !== netplus: ' + JSON.stringify(s && s.cert));
      }
    });

    test('Net+ Wiremap bank: every wiremap scenario passes simLabValidateScenario',
      allValidateOk);
    test('Net+ Wiremap bank: every wiremap scenario passes simLabValidateWiremapFidelity',
      allFidelityOk);
    test('Net+ Wiremap bank: every wiremap scenario has cert === netplus',
      allCertOk);

    ['open', 'short', 'splitPair', 'reversedPair'].forEach(function (ft) {
      test('Net+ Wiremap bank: covers fault type ' + ft,
        wmScenarios.some(function (s) { return s.wiremap && s.wiremap.fault === ft; }));
    });

  } catch (err) {
    test('Net+ Wiremap bank: vm smoke test (threw)', false);
    results.errors.push('Net+ Wiremap bank smoke test threw: ' + err.message);
  }
})();

// ── Wave 3 Task 12: A+ Core 1 Two-Client PC Build Spec-Off seed-bank validation ──
// The 11 consensus-approved (two-agent gated) pcbuild scenarios now live for
// real in features/sim-lab-seed-aplus-core1.js (window.SIM_LAB_SEED_APLUS_CORE1).
// This proves every one of them is real, production-ready content: each passes
// the same pure validators that gate the dev fixtures above
// (simLabValidateScenario + simLabValidatePcBuildFidelity), extracted from
// features/sim-lab.js the same way the Wave 3 Task 7/11 blocks do, plus a
// catalog-key cross-check that also covers every DISTRACTOR option id, not
// just the keyed-correct one the fidelity validator alone would exercise.
(function () {
  console.log('\n\x1b[1m── Sim Lab: A+ Core 1 Two-Client PC Build Spec-Off seed-bank validation (Wave 3 Task 12) ──\x1b[0m');
  try {
    var vm = require('vm');
    var grab = function (n) { return _fnBody(js, n); };

    var catVar = (js.match(/var _PARTS_CATALOG = \{[\s\S]*?\n\s*\};/) || [''])[0];
    var isNonEmptyStrBody    = grab('_isNonEmptyStr');
    var validatePayloadBody  = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";
    var resolveSlotBody   = grab('_slFidelityResolveSlot');
    var resolveSlotIdBody = grab('_slFidelityResolveSlotId');
    var pcbFidelityBody   = grab('simLabValidatePcBuildFidelity');

    if (!catVar || !isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody ||
        !resolveSlotBody || !resolveSlotIdBody || !pcbFidelityBody) {
      test('A+ Core 1 PC Build bank: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Wave 3 Task 12 bank test; check names/indenting');
      return;
    }

    var vCtx = {};
    vm.createContext(vCtx);
    vm.runInContext(stepTypesDecl, vCtx);
    vm.runInContext(isNonEmptyStrBody, vCtx);
    vm.runInContext(validatePayloadBody, vCtx);
    vm.runInContext(validateScenarioBody, vCtx);
    vm.runInContext(resolveSlotBody, vCtx);
    vm.runInContext(resolveSlotIdBody, vCtx);
    vm.runInContext(catVar, vCtx);
    vm.runInContext(pcbFidelityBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario; globalThis.__pcbFidelity = simLabValidatePcBuildFidelity; globalThis.__catalog = _PARTS_CATALOG;', vCtx);
    var simLabValidateScenario = vCtx.__validate;
    var simLabValidatePcBuildFidelity = vCtx.__pcbFidelity;
    var PARTS_CATALOG = vCtx.__catalog;
    var PARTS_CATALOG_KEYS = Object.keys(PARTS_CATALOG);

    // ── Load the real seed bank: eval features/sim-lab-seed-aplus-core1.js in
    // a sandbox with `var window = {}` so window.SIM_LAB_SEED_APLUS_CORE1 populates ──
    var seedSrc = read('features/sim-lab-seed-aplus-core1.js');
    var seedCtx = {};
    vm.createContext(seedCtx);
    vm.runInContext('var window = {};\n' + seedSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_APLUS_CORE1;', seedCtx);
    var seedBank = seedCtx.__seed;

    test('A+ Core 1 PC Build bank: window.SIM_LAB_SEED_APLUS_CORE1 loaded as an array',
      Array.isArray(seedBank));
    if (!Array.isArray(seedBank)) {
      results.errors.push('could not load window.SIM_LAB_SEED_APLUS_CORE1 from features/sim-lab-seed-aplus-core1.js');
      return;
    }

    var pcbScenarios = seedBank.filter(function (s) { return s && s.archetype === 'pcbuild'; });
    test('A+ Core 1 PC Build bank: at least 10 pcbuild-archetype scenarios present',
      pcbScenarios.length >= 10);

    var allValidateOk = true, allFidelityOk = true, allCertOk = true;
    pcbScenarios.forEach(function (s) {
      var vr = simLabValidateScenario(s);
      if (!vr || vr.ok !== true) {
        allValidateOk = false;
        results.errors.push('A+ Core 1 PC Build bank: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
      var fr = simLabValidatePcBuildFidelity(s);
      if (!fr || fr.ok !== true) {
        allFidelityOk = false;
        results.errors.push('A+ Core 1 PC Build bank: ' + (s && s.id) + ' failed simLabValidatePcBuildFidelity: ' + JSON.stringify(fr && fr.errors));
      }
      if (!s || s.cert !== 'aplus-core1') {
        allCertOk = false;
        results.errors.push('A+ Core 1 PC Build bank: ' + (s && s.id) + ' has cert !== aplus-core1: ' + JSON.stringify(s && s.cert));
      }
    });

    test('A+ Core 1 PC Build bank: every pcbuild scenario passes simLabValidateScenario',
      allValidateOk);
    test('A+ Core 1 PC Build bank: every pcbuild scenario passes simLabValidatePcBuildFidelity',
      allFidelityOk);
    test('A+ Core 1 PC Build bank: every pcbuild scenario has cert === aplus-core1',
      allCertOk);

    // Catalog-key cross-check: every slot option id across BOTH clients
    // (including distractors, not just the keyed-correct option) must resolve
    // in the shared _PARTS_CATALOG — catches a typo'd distractor part id that
    // the fidelity validator alone would never exercise.
    pcbScenarios.forEach(function (s) {
      ['clientA', 'clientB'].forEach(function (ck) {
        var cfg = s.steps.filter(function (st) { return st.id === ck; })[0];
        var allKnown = !!cfg && cfg.payload.slots.every(function (sl) {
          return sl.options.every(function (o) { return PARTS_CATALOG_KEYS.indexOf(o.id) !== -1; });
        });
        test('pcbuild ' + s.id + ' ' + ck + ': every slot option id (incl. distractors) resolves in the shared catalog', allKnown);
      });
    });

  } catch (err) {
    test('A+ Core 1 PC Build bank: vm smoke test (threw)', false);
    results.errors.push('A+ Core 1 PC Build bank smoke test threw: ' + err.message);
  }
})();

// ── Wave 3 Task 6: wiremap fidelity validator ──
(function () {
  var vm = require('vm');
  var grab = function (n) { return _fnBody(js, n); };
  var sigVar = (js.match(/var _WIREMAP_FAULT_SIG = \{[\s\S]*?\n\s*\};/) || [''])[0];
  var pairVar = (js.match(/var _WM_EXPECTED_PAIR = \{[\s\S]*?\n\s*\};/) || [''])[0];
  var body = [grab('_isNonEmptyStr'), grab('_slFidelityResolveSlot'), sigVar, pairVar, grab('simLabValidateWiremapFidelity')].join('\n');
  if (!sigVar || !pairVar || body.indexOf('simLabValidateWiremapFidelity') === -1) { results.errors.push('could not extract wiremap validator/_WIREMAP_FAULT_SIG/_WM_EXPECTED_PAIR'); return; }
  var wCtx = {}; vm.createContext(wCtx); vm.runInContext(body, wCtx);
  vm.runInContext('globalThis.__wm = simLabValidateWiremapFidelity;', wCtx);
  var wm = wCtx.__wm;

  // TIA/EIA-568B: Pair1=4,5 Pair2=1,2 Pair3=3,6 Pair4=7,8. Split pair: pins 2&3 cross.
  var scn = { wiremap: { fault: 'splitPair' },
    assets: { reference: { kind: 'wiremap', pins: [
      { pin: 1, pairId: 2, endBPin: 1, select: true },
      { pin: 2, pairId: 2, endBPin: 3, select: true },
      { pin: 3, pairId: 3, endBPin: 2, select: true },
      { pin: 4, pairId: 1, endBPin: 4, select: true },
      { pin: 5, pairId: 1, endBPin: 5, select: true },
      { pin: 6, pairId: 3, endBPin: 6, select: true },
      { pin: 7, pairId: 4, endBPin: 7, select: true },
      { pin: 8, pairId: 4, endBPin: 8, select: true }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1, payload: { multi: true, mode: 'wiremapPins' }, answer: { selected: ['2', '3'] } },
      { id: 'dx', type: 'configure', points: 1, payload: { slots: [
        { id: 'faultType', label: 'f', options: [{ id: 'a', text: 'Split pair' }, { id: 'b', text: 'Open circuit' }] },
        { id: 'fix', label: 'x', options: [{ id: 'a', text: 'Re-terminate so the real pairs land on their correct pins' }, { id: 'b', text: 'Replace the cable' }] }
      ] }, answer: { slots: { faultType: 'a', fix: 'a' } } }
    ] };
  test('wiremap: sound split-pair scenario passes', wm(scn).ok === true);
  var bad1 = JSON.parse(JSON.stringify(scn)); bad1.steps[0].answer.selected = ['3'];
  test('wiremap: keyed selection missing one of the two crossed pins rejected', wm(bad1).ok === false);
  var bad2 = JSON.parse(JSON.stringify(scn)); bad2.assets.reference.pins[1].endBPin = 2; bad2.assets.reference.pins[2].endBPin = 3;
  test('wiremap: a second, accidental fault (pin data no longer matches keyed splitPair) rejected', wm(bad2).ok === false);
  var bad3 = JSON.parse(JSON.stringify(scn)); bad3.steps[1].answer.slots.faultType = 'b';
  test('wiremap: keyed faultType not matching the actual pin-data fault rejected', wm(bad3).ok === false);

  // Open: pin 6 has no End-B connection at all (all others straight-through).
  var openScn = { wiremap: { fault: 'open' },
    assets: { reference: { kind: 'wiremap', pins: [
      { pin: 1, pairId: 2, endBPin: 1, select: true },
      { pin: 2, pairId: 2, endBPin: 2, select: true },
      { pin: 3, pairId: 3, endBPin: 3, select: true },
      { pin: 4, pairId: 1, endBPin: 4, select: true },
      { pin: 5, pairId: 1, endBPin: 5, select: true },
      { pin: 6, pairId: 3, endBPin: null, select: true },
      { pin: 7, pairId: 4, endBPin: 7, select: true },
      { pin: 8, pairId: 4, endBPin: 8, select: true }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1, payload: { multi: true, mode: 'wiremapPins' }, answer: { selected: ['6'] } },
      { id: 'dx', type: 'configure', points: 1, payload: { slots: [
        { id: 'faultType', label: 'f', options: [{ id: 'a', text: 'Open circuit' }, { id: 'b', text: 'Split pair' }] },
        { id: 'fix', label: 'x', options: [{ id: 'a', text: 'Reseat and re-terminate the connector' }, { id: 'b', text: 'Replace the cable' }] }
      ] }, answer: { slots: { faultType: 'a', fix: 'a' } } }
    ] };
  test('wiremap: sound open-circuit scenario passes', wm(openScn).ok === true);

  // Short: pins 1 and 2 both land on End-B pin 1 (pin 2's own slot goes unclaimed).
  var shortScn = { wiremap: { fault: 'short' },
    assets: { reference: { kind: 'wiremap', pins: [
      { pin: 1, pairId: 2, endBPin: 1, select: true },
      { pin: 2, pairId: 2, endBPin: 1, select: true },
      { pin: 3, pairId: 3, endBPin: 3, select: true },
      { pin: 4, pairId: 1, endBPin: 4, select: true },
      { pin: 5, pairId: 1, endBPin: 5, select: true },
      { pin: 6, pairId: 3, endBPin: 6, select: true },
      { pin: 7, pairId: 4, endBPin: 7, select: true },
      { pin: 8, pairId: 4, endBPin: 8, select: true }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1, payload: { multi: true, mode: 'wiremapPins' }, answer: { selected: ['1', '2'] } },
      { id: 'dx', type: 'configure', points: 1, payload: { slots: [
        { id: 'faultType', label: 'f', options: [{ id: 'a', text: 'Short' }, { id: 'b', text: 'Open circuit' }] },
        { id: 'fix', label: 'x', options: [{ id: 'a', text: 'Re-terminate the cable' }, { id: 'b', text: 'Reseat the connector' }] }
      ] }, answer: { slots: { faultType: 'a', fix: 'a' } } }
    ] };
  test('wiremap: sound short scenario passes', wm(shortScn).ok === true);
  var shortBad = JSON.parse(JSON.stringify(shortScn)); shortBad.steps[1].answer.slots.faultType = 'b';
  test('wiremap: keyed faultType not matching the actual short rejected', wm(shortBad).ok === false);

  // Reversed pair: pins 1 & 2 (same pairId) swap End-B destinations.
  var reversedScn = { wiremap: { fault: 'reversedPair' },
    assets: { reference: { kind: 'wiremap', pins: [
      { pin: 1, pairId: 2, endBPin: 2, select: true },
      { pin: 2, pairId: 2, endBPin: 1, select: true },
      { pin: 3, pairId: 3, endBPin: 3, select: true },
      { pin: 4, pairId: 1, endBPin: 4, select: true },
      { pin: 5, pairId: 1, endBPin: 5, select: true },
      { pin: 6, pairId: 3, endBPin: 6, select: true },
      { pin: 7, pairId: 4, endBPin: 7, select: true },
      { pin: 8, pairId: 4, endBPin: 8, select: true }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1, payload: { multi: true, mode: 'wiremapPins' }, answer: { selected: ['1', '2'] } },
      { id: 'dx', type: 'configure', points: 1, payload: { slots: [
        { id: 'faultType', label: 'f', options: [{ id: 'a', text: 'Reversed pair' }, { id: 'b', text: 'Split pair' }] },
        { id: 'fix', label: 'x', options: [{ id: 'a', text: 'Re-terminate the pair in the correct orientation' }, { id: 'b', text: 'Replace the cable' }] }
      ] }, answer: { slots: { faultType: 'a', fix: 'a' } } }
    ] };
  test('wiremap: sound reversed-pair scenario passes', wm(reversedScn).ok === true);
  var reversedBad = JSON.parse(JSON.stringify(reversedScn)); reversedBad.steps[0].answer.selected = ['1'];
  test('wiremap: keyed selection missing one of the two reversed pins rejected', wm(reversedBad).ok === false);

  // Textbook cross-check: a "clean" (non-faulty) pin mislabeled with the wrong
  // pairId must be rejected — pin 7 is straight-through in openScn but here its
  // pairId is corrupted from 4 (textbook) to 3.
  var badPairId = JSON.parse(JSON.stringify(openScn)); badPairId.assets.reference.pins[6].pairId = 3;
  test('wiremap: clean pin with pairId not matching textbook mapping rejected', wm(badPairId).ok === false);
})();

// ── Wave 3 Task 7: PC-build fidelity validator ──
(function () {
  var vm = require('vm');
  var grab = function (n) { return _fnBody(js, n); };
  var catVar = (js.match(/var _PARTS_CATALOG = \{[\s\S]*?\n\s*\};/) || [''])[0];
  var body = [grab('_isNonEmptyStr'), grab('_slFidelityResolveSlot'), grab('_slFidelityResolveSlotId'), catVar, grab('simLabValidatePcBuildFidelity')].join('\n');
  if (!catVar || body.indexOf('simLabValidatePcBuildFidelity') === -1) { results.errors.push('could not extract pcbuild validator/_PARTS_CATALOG'); return; }
  var cCtx = {}; vm.createContext(cCtx); vm.runInContext(body, cCtx);
  vm.runInContext('globalThis.__pcb = simLabValidatePcBuildFidelity;', cCtx);
  var pcb = cCtx.__pcb;

  // Option ids ARE the catalog keys directly (e.g. option.id === 'cpu-creator') — the
  // shared catalog is looked up by id, never by the option's human-readable `text` label.
  // This is a deliberate content-authoring convention for THIS archetype only (every
  // other archetype in the program uses arbitrary 'a'/'b' option ids with a keyed
  // answer.slots pointer, since their validators regex against the resolved TEXT —
  // pcbuild is the one place a validator needs an exact machine key, so its ids carry
  // that key directly instead of introducing a second resolve-by-id code path everywhere).
  function slots(v) { return { id: 'clientA', type: 'configure', points: 1, payload: { slots: Object.keys(v).map(function (k) {
    return { id: k, label: k, options: [{ id: v[k], text: 'Option ' + v[k] }, { id: 'placeholder-' + k, text: 'placeholder' }] };
  }) }, answer: { slots: Object.keys(v).reduce(function (acc, k) { acc[k] = v[k]; return acc; }, {}) } }; }

  // NOTE: budgetUsd/caseMaxGpuLengthMm/part picks below are chosen (not lifted verbatim
  // from the plan's illustrative fixture) so each assertion actually crosses its threshold
  // against the locked _PARTS_CATALOG values (e.g. the plan's original $1500 budget and
  // gpu-4060's 220W draw never exceed any real catalog swap) — the catalog itself is
  // byte-identical to the plan's locked table.
  var scn = { pcbuild: { clientA: { budgetUsd: 1200, caseMaxGpuLengthMm: 320, minCpuTier: 2, minGpuTier: 2 } },
    steps: [ slots({ cpu: 'cpu-creator', gpu: 'gpu-4070', ram: 'ram-32', psu: 'psu-450', storage: 'storage-1tb-nvme', cooling: 'cool-120-air' }) ] };
  test('pcbuild: sound clientA build passes', pcb(scn).ok === true);
  var bad1 = JSON.parse(JSON.stringify(scn));
  bad1.steps[0].payload.slots.find(function (s) { return s.id === 'cpu'; }).options[0].id = 'cpu-flagship';
  bad1.steps[0].answer.slots.cpu = 'cpu-flagship';
  test('pcbuild: over-budget CPU swap rejected', pcb(bad1).ok === false);
  var bad2 = JSON.parse(JSON.stringify(scn)); bad2.pcbuild.clientA.caseMaxGpuLengthMm = 200;
  test('pcbuild: GPU longer than the case limit rejected', pcb(bad2).ok === false);
  var bad3 = JSON.parse(JSON.stringify(scn));
  bad3.steps[0].payload.slots.find(function (s) { return s.id === 'psu'; }).options[0].id = 'psu-250';
  bad3.steps[0].answer.slots.psu = 'psu-250';
  test('pcbuild: PSU wattage below CPU+GPU draw rejected', pcb(bad3).ok === false);
  // cpu-office is tier 1 (< minCpuTier: 2). Swap keeps every other check clean: total
  // $175(cpu)+$550(gpu-4070)+$85(ram-32)+$45(psu-450)+$75(storage-1tb-nvme)+$35(cool-120-air)
  // = $965, under the $1200 budget; draw 65W(cpu)+200W(gpu)=265W stays under psu-450's
  // 450W; gpu-4070's 310mm stays under the 320mm case max — so this isolates the CPU-tier
  // branch specifically.
  var bad4 = JSON.parse(JSON.stringify(scn));
  bad4.steps[0].payload.slots.find(function (s) { return s.id === 'cpu'; }).options[0].id = 'cpu-office';
  bad4.steps[0].answer.slots.cpu = 'cpu-office';
  test('pcbuild: CPU tier below minCpuTier rejected', pcb(bad4).ok === false);
  // gpu-1650 is tier 1 (< minGpuTier: 2). Swap keeps every other check clean: total
  // $310(cpu-creator)+$150(gpu)+$85(ram-32)+$45(psu-450)+$75(storage-1tb-nvme)+$35(cool-120-air)
  // = $700, under the $1200 budget; draw 105W(cpu)+75W(gpu)=180W stays under psu-450's
  // 450W; gpu-1650's 170mm stays under the 320mm case max — so this isolates the GPU-tier
  // branch specifically.
  var bad5 = JSON.parse(JSON.stringify(scn));
  bad5.steps[0].payload.slots.find(function (s) { return s.id === 'gpu'; }).options[0].id = 'gpu-1650';
  bad5.steps[0].answer.slots.gpu = 'gpu-1650';
  test('pcbuild: GPU tier below minGpuTier rejected', pcb(bad5).ok === false);
})();

(function () {
  var assert = function (cond, msg) { test(msg, !!cond); };
  var grab = function (n) { return _fnBody(js, n); };
  var metaVar = (js.match(/var _RAID_LEVEL_META = \{[\s\S]*?\n\s*\};/) || [''])[0];
  var body = [grab('_isNonEmptyStr'), grab('_slFidelityResolveSlot'), metaVar, grab('_raidLevelKey'), grab('simLabValidateRaidFidelity')].join('\n');
  if (!metaVar || body.indexOf('simLabValidateRaidFidelity') === -1) { results.errors.push('could not extract raid validator/_RAID_LEVEL_META/_raidLevelKey'); return; }
  var rCtx = {}; vm.createContext(rCtx); vm.runInContext(body, rCtx);
  vm.runInContext('globalThis.__raid = simLabValidateRaidFidelity;', rCtx);
  var raid = rCtx.__raid;

  var scn = { raid: { targetUsableTb: 4, targetTolerance: 1, failedDriveCount: 1 },
    steps: [
      { id: 'build', type: 'configure', points: 1, payload: { slots: [
        { id: 'level', label: 'l', options: [{ id: 'a', text: 'RAID 5' }, { id: 'b', text: 'RAID 10' }] },
        { id: 'driveCount', label: 'c', options: [{ id: 'a', text: '3' }, { id: 'b', text: '4' }] },
        { id: 'driveSize', label: 's', options: [{ id: 'a', text: '2' }, { id: 'b', text: '1' }] }
      ] }, answer: { slots: { level: 'a', driveCount: 'a', driveSize: 'a' } } },
      { id: 'degrade', type: 'configure', points: 1, payload: { slots: [
        { id: 'arrayStatus', label: 'a', options: [{ id: 'a', text: 'Degraded' }, { id: 'b', text: 'Failed' }] },
        { id: 'recoveryAction', label: 'r', options: [{ id: 'a', text: 'Hot-swap and rebuild' }, { id: 'b', text: 'Restore from backup' }] }
      ] }, answer: { slots: { arrayStatus: 'a', recoveryAction: 'a' } } }
    ] };
  assert(raid(scn).ok === true, 'raid: sound RAID5 3x2TB scenario passes');
  var bad1 = JSON.parse(JSON.stringify(scn)); bad1.steps[0].answer.slots.driveCount = 'b'; bad1.steps[0].payload.slots[1].options[0].text = '2';
  assert(raid(bad1).ok === false, 'raid: keyed build that misses the capacity target rejected');
  var bad2 = JSON.parse(JSON.stringify(scn)); bad2.raid.failedDriveCount = 2;
  assert(raid(bad2).ok === false, 'raid: 2 failed drives against RAID5 tolerance-1 must NOT stay keyed degraded/rebuild');
  var bad3 = JSON.parse(JSON.stringify(scn)); bad3.steps[0].answer.slots.level = 'b'; bad3.steps[0].payload.slots[2].options[0].text = '4';
  // NOTE: this fixture keys RAID10 with only 3 drives, which is below raid10's own
  // minDrives (4) — it short-circuits on the minDrives guard and never reaches the
  // cheaperExists same-level loop. It genuinely exercises the minDrives-below-level-min
  // rejection path, not "non-minimal drive count" (a valid-but-wasteful over-provisioned
  // build) — see the dedicated cheaperExists coverage below.
  assert(raid(bad3).ok === false, 'raid: keyed build below the level\'s own minDrives rejected');
  // Genuinely exercises the same-level cheaperExists loop (not the minDrives guard):
  // RAID10 keyed with 8x2TB (usable = floor(8/2)*2 = 8TB) against a 4TB/tolerance-1
  // target. 8 drives clears minDrives (4) and both targets, but a same-level 4-drive
  // build (floor(4/2)*2 = 4TB, tolerance 1) already clears the same targets — so the
  // keyed 8-drive build is valid-but-not-minimal and must be rejected by cheaperExists.
  var bad3b = raidBuildScn('RAID 10', '8', '2', 4, 1);
  assert(raid(bad3b).ok === false, 'raid: same-level RAID10 over-provisioned build (8 drives when 4 would clear the target) rejected via cheaperExists');

  // Per-level build-slot coverage: raid0/raid1/raid6's capacity formulas are otherwise
  // unverified (only raid5's pass case and raid10's minDrives-fail case exercised above).
  // failedDriveCount is kept at 0 in each fixture so neither the "Failed" nor "Degraded"
  // degrade-status branch is entered — these fixtures isolate the capacity/tolerance math,
  // not the degrade-phase keying (already covered by the RAID5 fixture above).
  function raidBuildScn(levelText, driveCountText, driveSizeText, targetUsableTb, targetTolerance) {
    return { raid: { targetUsableTb: targetUsableTb, targetTolerance: targetTolerance, failedDriveCount: 0 },
      steps: [
        { id: 'build', type: 'configure', points: 1, payload: { slots: [
          { id: 'level', label: 'l', options: [{ id: 'a', text: levelText }] },
          { id: 'driveCount', label: 'c', options: [{ id: 'a', text: driveCountText }] },
          { id: 'driveSize', label: 's', options: [{ id: 'a', text: driveSizeText }] }
        ] }, answer: { slots: { level: 'a', driveCount: 'a', driveSize: 'a' } } },
        { id: 'degrade', type: 'configure', points: 1, payload: { slots: [
          { id: 'arrayStatus', label: 'a', options: [{ id: 'a', text: 'Healthy' }] },
          { id: 'recoveryAction', label: 'r', options: [{ id: 'a', text: 'None' }] }
        ] }, answer: { slots: { arrayStatus: 'a', recoveryAction: 'a' } } }
      ] };
  }
  // raid0 (striping, no tolerance): capacity = driveCount*driveSize = 2*2 = 4TB, meets a
  // 4TB/tolerance-0 target with the minimum 2 drives (no fewer-drive combo of any level
  // can also clear it, since every level's minDrives is >= 2).
  assert(raid(raidBuildScn('RAID 0', '2', '2', 4, 0)).ok === true, 'raid: sound RAID0 2x2TB scenario passes');
  // raid1 (mirroring): capacity = driveSize = 4TB regardless of driveCount, meets a
  // 4TB/tolerance-1 target with the minimum 2 drives.
  assert(raid(raidBuildScn('RAID 1', '2', '4', 4, 1)).ok === true, 'raid: sound RAID1 2x4TB scenario passes');
  // raid6 (dual parity): capacity = (driveCount-2)*driveSize = (4-2)*2 = 4TB, meets a
  // 4TB/tolerance-2 target with the minimum 4 drives (no other level reaches tolerance
  // 2 at all, so no fewer-drive combo can satisfy the minimal-cost check).
  assert(raid(raidBuildScn('RAID 6', '4', '2', 4, 2)).ok === true, 'raid: sound RAID6 4x2TB scenario passes');
})();

// ── Wave 3 Task 13: A+ Core 1 RAID Workbench seed-bank validation ──
// The 13 consensus-approved (two-agent gated) raid scenarios now live for real
// in features/sim-lab-seed-aplus-core1.js (window.SIM_LAB_SEED_APLUS_CORE1).
// This proves every one of them is real, production-ready content: each
// passes the same pure validators that gate the dev fixture above
// (simLabValidateScenario + simLabValidateRaidFidelity), extracted from
// features/sim-lab.js the same way the Task 12 block does, plus a RAID-level
// coverage cross-check that all 5 RAID levels appear at least once in the
// keyed 'build' answer.
(function () {
  console.log('\n\x1b[1m── Sim Lab: A+ Core 1 RAID Workbench seed-bank validation (Wave 3 Task 13) ──\x1b[0m');
  try {
    var vm = require('vm');
    var grab = function (n) { return _fnBody(js, n); };

    var isNonEmptyStrBody    = grab('_isNonEmptyStr');
    var validatePayloadBody  = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";
    var resolveSlotBody = grab('_slFidelityResolveSlot');
    var metaVar = (js.match(/var _RAID_LEVEL_META = \{[\s\S]*?\n\s*\};/) || [''])[0];
    var raidLevelKeyBody = grab('_raidLevelKey');
    var raidFidelityBody = grab('simLabValidateRaidFidelity');

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody ||
        !resolveSlotBody || !metaVar || !raidLevelKeyBody || !raidFidelityBody) {
      test('A+ Core 1 RAID bank: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Wave 3 Task 13 bank test; check names/indenting');
      return;
    }

    var vCtx = {};
    vm.createContext(vCtx);
    vm.runInContext(stepTypesDecl, vCtx);
    vm.runInContext(isNonEmptyStrBody, vCtx);
    vm.runInContext(validatePayloadBody, vCtx);
    vm.runInContext(validateScenarioBody, vCtx);
    vm.runInContext(resolveSlotBody, vCtx);
    vm.runInContext(metaVar, vCtx);
    vm.runInContext(raidLevelKeyBody, vCtx);
    vm.runInContext(raidFidelityBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario; globalThis.__raidFidelity = simLabValidateRaidFidelity;', vCtx);
    var simLabValidateScenario = vCtx.__validate;
    var simLabValidateRaidFidelity = vCtx.__raidFidelity;

    // ── Load the real seed bank: eval features/sim-lab-seed-aplus-core1.js in
    // a sandbox with `var window = {}` so window.SIM_LAB_SEED_APLUS_CORE1 populates ──
    var seedSrc = read('features/sim-lab-seed-aplus-core1.js');
    var seedCtx = {};
    vm.createContext(seedCtx);
    vm.runInContext('var window = {};\n' + seedSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_APLUS_CORE1;', seedCtx);
    var bank = seedCtx.__seed;

    test('A+ Core 1 RAID bank: window.SIM_LAB_SEED_APLUS_CORE1 loaded as an array',
      Array.isArray(bank));
    if (!Array.isArray(bank)) {
      results.errors.push('could not load window.SIM_LAB_SEED_APLUS_CORE1 from features/sim-lab-seed-aplus-core1.js');
      return;
    }

    var raidScenarios = bank.filter(function (s) { return s && s.archetype === 'raid'; });
    test('A+ Core 1 RAID bank: at least 10 raid-archetype scenarios present',
      raidScenarios.length >= 10);

    var allValidateOk = true, allFidelityOk = true, allCertOk = true;
    raidScenarios.forEach(function (s) {
      var vr = simLabValidateScenario(s);
      if (!vr || vr.ok !== true) {
        allValidateOk = false;
        results.errors.push('A+ Core 1 RAID bank: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
      var fr = simLabValidateRaidFidelity(s);
      if (!fr || fr.ok !== true) {
        allFidelityOk = false;
        results.errors.push('A+ Core 1 RAID bank: ' + (s && s.id) + ' failed simLabValidateRaidFidelity: ' + JSON.stringify(fr && fr.errors));
      }
      if (!s || s.cert !== 'aplus-core1') {
        allCertOk = false;
        results.errors.push('A+ Core 1 RAID bank: ' + (s && s.id) + ' has cert !== aplus-core1: ' + JSON.stringify(s && s.cert));
      }
    });

    test('A+ Core 1 RAID bank: every raid scenario passes simLabValidateScenario',
      allValidateOk);
    test('A+ Core 1 RAID bank: every raid scenario passes simLabValidateRaidFidelity',
      allFidelityOk);
    test('A+ Core 1 RAID bank: every raid scenario has cert === aplus-core1',
      allCertOk);

    // Coverage cross-check: every RAID level (0/1/5/6/10) appears at least
    // once as the keyed 'build' answer somewhere in the bank.
    ['RAID 0', 'RAID 1', 'RAID 5', 'RAID 6', 'RAID 10'].forEach(function (lvl) {
      test('raid bank covers ' + lvl, raidScenarios.some(function (s) {
        var cfg = s.steps.filter(function (st) { return st.id === 'build'; })[0];
        var keyedText = cfg.payload.slots.filter(function (sl) { return sl.id === 'level'; })[0].options
          .filter(function (o) { return o.id === cfg.answer.slots.level; })[0].text;
        return keyedText.indexOf(lvl) !== -1;
      }));
    });

  } catch (err) {
    test('A+ Core 1 RAID bank: vm smoke test (threw)', false);
    results.errors.push('A+ Core 1 RAID bank smoke test threw: ' + err.message);
  }
})();

// ── Wave 3 Task 14: archetype vertical-slice mount + score, through the REAL
// faceplate/wiremap/slots-reference + guarded-analyze-mode Practice path ──
// Proves the four NEW Wave 3 archetypes (portmap, wiremap, pcbuild, raid)
// actually mount and score through _slMountScenario end to end — including
// the three new reference renderers (Task 2/3/4), the facePorts/wiremapPins
// guarded analyze-mode extensions (Task 3), and per-slot configure scoring —
// against the REAL shipped bank scenarios, not a hand-authored fixture.
// Mirrors the Wave 2 Task 11 pattern (grab() extraction + guard clauses +
// stateful classList/removeAttribute/_fire DOM shim), but drives .port and
// .wm-pin buttons instead of .sl-cmd/.term-line.
(function () {
  console.log('\n\x1b[1m── Sim Lab: Wave 3 archetype vertical slices — portmap/wiremap/pcbuild/raid (Task 14) ──\x1b[0m');
  try {
    var vm = require('vm');

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };
    var grabLine = function (name) {
      var re = new RegExp('function ' + name + '\\([^\\n]*\\)\\s*\\{[^\\n]*\\}');
      return (js.match(re) || [''])[0];
    };

    var elBody               = grab('_el');
    var escBody               = grabLine('_esc');
    var slAttrBody            = grabLine('_slAttr');
    var renderCfgBody         = grab('_slRenderConfigure');
    var renderAnalyzeModeBody = grab('_slRenderAnalyzeMode');
    var renderAnalyzeBody     = grab('_slRenderAnalyze');
    var renderStepBody        = grab('simLabRenderStep');
    var refNetBody            = grab('_slRenderRefNetwork');
    var refTimeBody           = grab('_slRenderRefTimeline');
    var refLayBody            = grab('_slRenderRefLayered');
    var refLayStackBody       = grab('_slRenderRefLayeredStacked');
    var termLineBody          = grab('_termLineHtml');
    var termPmtBody           = grab('_termPromptHtml');
    var refTermBody           = grab('_slRenderRefTerminal');
    var refFaceplateBody      = grab('_slRenderRefFaceplate');
    var refWiremapBody        = grab('_slRenderRefWiremap');
    var refSlotsBody          = grab('_slRenderRefSlots');
    var refDispBody           = grab('_slRenderReference');
    var mountBody             = grab('_slMountScenario');
    var scoreSlotsBody          = grab('_scoreConfigureSlots');
    var scoreAnalyzeLenientBody = grab('_scoreAnalyzeLenient');
    var scoreStepBody           = grab('_scoreStep');
    var scoreScenarioBody       = grab('simLabScoreScenario');
    var normBody           = grab('_norm');
    var normalizeMatchBody = grab('_simLabNormalizeMatch');
    var arrEqBody          = grab('_arrEq');
    var setEqBody          = grab('_setEq');

    if (!elBody || !escBody || !mountBody || !refDispBody ||
        !refFaceplateBody || !refWiremapBody || !refSlotsBody ||
        !renderCfgBody || !renderAnalyzeBody || !renderAnalyzeModeBody || !renderStepBody ||
        !scoreScenarioBody || !scoreSlotsBody || !scoreStepBody || !scoreAnalyzeLenientBody) {
      test('Task 14 (Wave 3): mount/score vm extraction succeeded', false);
      results.errors.push('could not extract _slMountScenario/render/score/faceplate/wiremap/slots helpers for Wave 3 Task 14 archetype vertical slices; check names/indenting');
      return;
    }

    // ── Load the REAL seed banks. ──
    var netplusSrc = read('features/sim-lab-seed-netplus.js');
    var netplusCtx = {};
    vm.createContext(netplusCtx);
    vm.runInContext('var window = {};\n' + netplusSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_NETPLUS;', netplusCtx);
    var netplusBank = netplusCtx.__seed;

    var aplusCore1Src = read('features/sim-lab-seed-aplus-core1.js');
    var aplusCore1Ctx = {};
    vm.createContext(aplusCore1Ctx);
    vm.runInContext('var window = {};\n' + aplusCore1Src + '\nglobalThis.__seed = window.SIM_LAB_SEED_APLUS_CORE1;', aplusCore1Ctx);
    var aplusCore1Bank = aplusCore1Ctx.__seed;

    test('Task 14 (Wave 3): both real seed banks loaded as arrays',
      Array.isArray(netplusBank) && Array.isArray(aplusCore1Bank));
    if (!Array.isArray(netplusBank) || !Array.isArray(aplusCore1Bank)) {
      results.errors.push('Task 14 (Wave 3): could not load real seed banks (SIM_LAB_SEED_NETPLUS / SIM_LAB_SEED_APLUS_CORE1)');
      return;
    }

    var portmapScn = netplusBank.filter(function (s) { return s && s.archetype === 'portmap'; })[0];
    var wiremapScn = netplusBank.filter(function (s) { return s && s.archetype === 'wiremap'; })[0];
    var pcbuildScn = aplusCore1Bank.filter(function (s) { return s && s.archetype === 'pcbuild'; })[0];
    var raidScn    = aplusCore1Bank.filter(function (s) { return s && s.archetype === 'raid'; })[0];

    test('Task 14 (Wave 3): first portmap-archetype scenario resolved from the real bank',
      !!portmapScn);
    test('Task 14 (Wave 3): first wiremap-archetype scenario resolved from the real bank',
      !!wiremapScn);
    test('Task 14 (Wave 3): first pcbuild-archetype scenario resolved from the real bank',
      !!pcbuildScn);
    test('Task 14 (Wave 3): first raid-archetype scenario resolved from the real bank',
      !!raidScn);

    if (!portmapScn || !wiremapScn || !pcbuildScn || !raidScn) {
      results.errors.push('Task 14 (Wave 3): could not resolve one or more archetype scenarios from the real banks; check archetype tagging');
      return;
    }

    // ── DOM shim: same stateful classList/removeAttribute/_fire shim as
    // Wave 2 Task 11 / Wave 3 Tasks 2-4's renderer tests. ──
    var htmlEsc = function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    var makeEl = function (tag) {
      var attrs = {}, listeners = {}, children = [], cls = '', inner = '', val = '';
      var clsSet = {};
      var el = {
        tagName: tag.toUpperCase(),
        get className() { return cls; }, set className(v) { cls = v; },
        get innerHTML() { return inner; }, set innerHTML(v) { inner = v; children = []; },
        get textContent() { return ''; }, set textContent(v) { inner = htmlEsc(v); },
        get value() { return val; }, set value(v) { val = v; },
        selected: false,
        style: {},
        get _children() { return children; },
        classList: {
          add: function (c) { clsSet[c] = true; },
          remove: function (c) { delete clsSet[c]; },
          toggle: function (c, on) { if (on) clsSet[c] = true; else delete clsSet[c]; },
          contains: function (c) { return !!clsSet[c]; }
        },
        setAttribute: function (k, v) { attrs[k] = v; },
        getAttribute: function (k) { return (k in attrs) ? attrs[k] : null; },
        removeAttribute: function (k) { delete attrs[k]; },
        appendChild: function (c) { children.push(c); return c; },
        insertBefore: function (c) { children.unshift(c); return c; },
        querySelector: function (sel) {
          var want = sel.replace(/^\./, '');
          var hit = null;
          var walk = function (n) {
            if (hit || !n || !n._children) return;
            n._children.forEach(function (c) {
              if (hit || !c || !c.tagName) return;
              if (want.toUpperCase() === c.tagName || (c.className && c.className.split(' ').indexOf(want) !== -1)) { hit = c; return; }
              walk(c);
            });
          };
          walk(el);
          return hit;
        },
        querySelectorAll: function (sel) {
          var hits = [], want = sel.replace(/^\./, '');
          var walk = function (n) { (n._children || []).forEach(function (c) {
            if (!c || !c.tagName) return;
            if (want.toUpperCase() === c.tagName || (c.className && c.className.split(' ').indexOf(want) !== -1)) hits.push(c);
            walk(c);
          }); };
          walk(el); return hits;
        },
        addEventListener: function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
        dispatchEvent: function (evObj) { (listeners[evObj.type] || []).forEach(function (fn) { fn(evObj); }); },
        _fire: function (ev) { (listeners[ev] || []).forEach(function (fn) { fn({}); }); },
        closest: function () { return null; },
        remove: function () {}
      };
      return el;
    };

    var docShim = {
      createElement: function (tag) { return makeEl(tag); },
      createTextNode: function (t) { return { textContent: t, tagName: '#text' }; }
    };
    var windowShim = { CSS: null, matchMedia: function () { return { matches: false }; } };

    var mCtx = { document: docShim, window: windowShim, Object: Object, Array: Array, String: String, JSON: JSON };
    vm.createContext(mCtx);
    vm.runInContext(elBody, mCtx);
    vm.runInContext(escBody, mCtx);
    vm.runInContext(slAttrBody, mCtx);
    vm.runInContext(renderCfgBody, mCtx);
    vm.runInContext(renderAnalyzeModeBody, mCtx);
    vm.runInContext(renderAnalyzeBody, mCtx);
    vm.runInContext(renderStepBody, mCtx);
    vm.runInContext(refNetBody, mCtx);
    if (refTimeBody) vm.runInContext(refTimeBody, mCtx);
    if (refLayBody) vm.runInContext(refLayBody, mCtx);
    if (refLayStackBody) vm.runInContext(refLayStackBody, mCtx);
    if (termLineBody) vm.runInContext(termLineBody, mCtx);
    if (termPmtBody) vm.runInContext(termPmtBody, mCtx);
    if (refTermBody) vm.runInContext(refTermBody, mCtx);
    vm.runInContext(refFaceplateBody, mCtx);
    vm.runInContext(refWiremapBody, mCtx);
    vm.runInContext(refSlotsBody, mCtx);
    vm.runInContext(refDispBody, mCtx);
    vm.runInContext(mountBody, mCtx);
    vm.runInContext(normBody, mCtx);
    vm.runInContext(normalizeMatchBody, mCtx);
    vm.runInContext(arrEqBody, mCtx);
    vm.runInContext(setEqBody, mCtx);
    vm.runInContext(scoreSlotsBody, mCtx);
    vm.runInContext(scoreAnalyzeLenientBody, mCtx);
    vm.runInContext(scoreStepBody, mCtx);
    vm.runInContext(scoreScenarioBody, mCtx);

    function expectedSelectCount(scn) {
      return scn.steps.filter(function (s) { return s.type === 'configure'; })
        .reduce(function (sum, s) { return sum + s.payload.slots.length; }, 0);
    }
    function mountOnly(scn) {
      var host = makeEl('div');
      mCtx.__host = host;
      mCtx.__scn = scn;
      var result = null;
      mCtx.__onSubmit = function (r) { result = r; };
      vm.runInContext('globalThis.__opts = { onSubmit: __onSubmit }; _slMountScenario(__host, __scn, __opts);', mCtx);
      return { wrap: host._children[0], getResult: function () { return result; } };
    }
    function submitActive() { vm.runInContext('window.__slActiveSubmit();', mCtx); }

    // Drive every configure step to its keyed-correct slots, except
    // wrongSlot { stepId, slotId } (optional) which is driven to any OTHER
    // option — the negative control.
    function driveConfigureCorrectly(wrap, scn, wrongSlot) {
      var stepWraps = wrap._children.filter(function (c) { return c && c.className === 'sl-step'; });
      scn.steps.forEach(function (st, i) {
        if (st.type !== 'configure') return;
        var selects = stepWraps[i].querySelectorAll('select');
        selects.forEach(function (sel) {
          var slotId = sel.getAttribute('data-slot');
          var correctVal = st.answer.slots[slotId];
          var v = correctVal;
          if (wrongSlot && wrongSlot.stepId === st.id && wrongSlot.slotId === slotId) {
            var slotDef = st.payload.slots.filter(function (s) { return s.id === slotId; })[0];
            var wrongOpt = slotDef.options.filter(function (o) { return o.id !== correctVal; })[0];
            v = wrongOpt.id;
          }
          sel.value = v;
          sel.dispatchEvent({ type: 'change' });
        });
      });
    }

    // Fire real .port / .wm-pin button clicks (as rendered by the actual
    // faceplate/wiremap renderers and bound by _slRenderAnalyzeMode's
    // facePorts/wiremapPins branches) for the given ids, on top of any
    // already-flagged picks — NOT a stubbed handler, the real bound click
    // listener each renderer + mode wires together.
    function clickSelectorIds(wrap, selector, attr, ids) {
      var btns = wrap.querySelectorAll(selector);
      ids.forEach(function (id) {
        var btn = btns.filter(function (b) { return b.getAttribute(attr) === id; })[0];
        if (btn) btn._fire('click');
      });
    }

    // ── (1) Port-Map: faceplate reference + facePorts diagnose step + two
    // configure steps (provision, fix). ──
    var pmMount = mountOnly(portmapScn);
    var pmWrap = pmMount.wrap;
    test('Task 14 portmap: mounted DOM contains a .faceplate component and every configure <select>',
      !!pmWrap.querySelector('.faceplate') && pmWrap.querySelectorAll('select').length === expectedSelectCount(portmapScn));

    // (b) fire a REAL .port button click for the keyed fault port, exercising
    // the actual bound click listener wired by _slRenderAnalyzeMode's
    // facePorts branch (through window.__slFaceplatePanel), not a stub.
    var pmDiagStep = portmapScn.steps.filter(function (s) { return s.type === 'analyze' && s.payload && s.payload.mode === 'facePorts'; })[0];
    clickSelectorIds(pmWrap, '.port', 'data-port', pmDiagStep.answer.selected);
    driveConfigureCorrectly(pmWrap, portmapScn);
    submitActive();
    var pmResult = pmMount.getResult();
    test('Task 14 portmap: real .port click + fully-correct configure answers scores correct === total',
      pmResult && pmResult.total > 0 && pmResult.correct === pmResult.total);

    var portmapClone = JSON.parse(JSON.stringify(portmapScn));
    var pmCfgStep = portmapClone.steps.filter(function (s) { return s.type === 'configure'; })[0];
    var pmMount2 = mountOnly(portmapClone);
    clickSelectorIds(pmMount2.wrap, '.port', 'data-port', pmDiagStep.answer.selected);
    driveConfigureCorrectly(pmMount2.wrap, portmapClone,
      { stepId: pmCfgStep.id, slotId: pmCfgStep.payload.slots[0].id });
    submitActive();
    var pmResult2 = pmMount2.getResult();
    test('Task 14 portmap negative control: one wrong provision/fix slot scores correct < total',
      pmResult2 && pmResult2.correct < pmResult2.total);

    // ── (2) Wiremap: wiremap reference + wiremapPins flag step (EXACT-SET
    // scoring — the odd one out vs CLI/triage's lenient scoring) + one
    // configure step. ──
    var wmMount = mountOnly(wiremapScn);
    var wmWrap = wmMount.wrap;
    test('Task 14 wiremap: mounted DOM contains a .wiremap component and every configure <select>',
      !!wmWrap.querySelector('.wiremap') && wmWrap.querySelectorAll('select').length === expectedSelectCount(wiremapScn));

    var wmFlagStep = wiremapScn.steps.filter(function (s) { return s.type === 'analyze' && s.payload && s.payload.mode === 'wiremapPins'; })[0];

    // (c) exact-set path: flag EXACTLY the keyed fault pin(s) via real
    // .wm-pin clicks — must score full credit.
    clickSelectorIds(wmWrap, '.wm-pin', 'data-pin', wmFlagStep.answer.selected);
    driveConfigureCorrectly(wmWrap, wiremapScn);
    submitActive();
    var wmResult = wmMount.getResult();
    test('Task 14 wiremap: flagging exactly the keyed fault pin(s) + correct configure scores correct === total',
      wmResult && wmResult.total > 0 && wmResult.correct === wmResult.total);

    // Dedicated over-selection assertion: the keyed pin(s) PLUS one wrong
    // extra pin must score correct < total. Wiremap uses default (non-
    // lenient) analyze scoring, so its exact-set contract genuinely
    // penalizes a false extra pick — unlike CLI/triage's lenient scoring,
    // making wiremap the one archetype in the whole program where
    // over-selecting costs credit.
    var wiremapPins = (wiremapScn.assets.reference.pins || []).map(function (p) { return String(p.pin); });
    var wrongExtraPin = wiremapPins.filter(function (p) { return wmFlagStep.answer.selected.indexOf(p) === -1; })[0];
    test('Task 14 wiremap: fixture sanity — a real non-keyed pin exists to drive the over-selection negative pick',
      !!wrongExtraPin);
    var wiremapClone = JSON.parse(JSON.stringify(wiremapScn));
    var wmMount2 = mountOnly(wiremapClone);
    clickSelectorIds(wmMount2.wrap, '.wm-pin', 'data-pin', wmFlagStep.answer.selected.concat([wrongExtraPin]));
    driveConfigureCorrectly(wmMount2.wrap, wiremapClone);
    submitActive();
    var wmResult2 = wmMount2.getResult();
    test('Task 14 wiremap over-selection negative control: keyed pin(s) PLUS one wrong extra pin scores correct < total (exact-set penalizes, unlike lenient CLI/triage)',
      wmResult2 && wmResult2.correct < wmResult2.total);

    // ── (3) PC-Build: slots reference (rendered once, both clients share
    // the panel) + two independent configure steps (clientA, clientB). ──
    var pcMount = mountOnly(pcbuildScn);
    var pcWrap = pcMount.wrap;
    test('Task 14 pcbuild: mounted DOM contains a .slots-diagram component and every configure <select>',
      !!pcWrap.querySelector('.slots-diagram') && pcWrap.querySelectorAll('select').length === expectedSelectCount(pcbuildScn));

    var pcClientAStep = pcbuildScn.steps.filter(function (s) { return s.id === 'clientA'; })[0];
    var pcClientBStep = pcbuildScn.steps.filter(function (s) { return s.id === 'clientB'; })[0];
    driveConfigureCorrectly(pcWrap, pcbuildScn,
      { stepId: pcClientBStep.id, slotId: pcClientBStep.payload.slots[0].id });
    submitActive();
    var pcResult = pcMount.getResult();
    test('Task 14 pcbuild: Client A fully correct + Client B one deliberate wrong pick scores COMBINED correct < total',
      pcResult && pcResult.correct < pcResult.total);
    var pcClientATally = pcResult && pcResult.perStep && pcResult.perStep[pcClientAStep.id];
    test('Task 14 pcbuild: Client A\'s own per-client tally is still full credit (neither client\'s build rescues/penalizes the other)',
      pcClientATally && pcClientATally.total > 0 && pcClientATally.correct === pcClientATally.total);

    // ── (4) RAID: slots reference (static illustrative bay panel) + build
    // then degrade configure steps. ──
    var raidMount = mountOnly(raidScn);
    var raidWrap = raidMount.wrap;
    test('Task 14 raid: mounted DOM contains a .slots-diagram component and every configure <select>',
      !!raidWrap.querySelector('.slots-diagram') && raidWrap.querySelectorAll('select').length === expectedSelectCount(raidScn));

    driveConfigureCorrectly(raidWrap, raidScn);
    submitActive();
    var raidResult = raidMount.getResult();
    test('Task 14 raid: fully-correct build + degrade configure answers scores correct === total',
      raidResult && raidResult.total > 0 && raidResult.correct === raidResult.total);

    var raidClone = JSON.parse(JSON.stringify(raidScn));
    var raidDegradeStep = raidClone.steps.filter(function (s) { return s.id === 'degrade'; })[0];
    var raidMount2 = mountOnly(raidClone);
    driveConfigureCorrectly(raidMount2.wrap, raidClone,
      { stepId: raidDegradeStep.id, slotId: 'recoveryAction' });
    submitActive();
    var raidResult2 = raidMount2.getResult();
    test('Task 14 raid negative control: wrong recoveryAction pick scores correct < total',
      raidResult2 && raidResult2.correct < raidResult2.total);

  } catch (err) {
    test('Task 14 (Wave 3): archetype vertical-slice smoke test (threw)', false);
    results.errors.push('Task 14 (Wave 3) archetype vertical-slice smoke test threw: ' + err.message);
  }
})();

