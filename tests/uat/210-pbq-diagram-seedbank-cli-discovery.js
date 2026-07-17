// tests/uat/210-pbq-diagram-seedbank-cli-discovery.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Diagram PBQ vertical slice + seed-bank validation, wireless/firewall/CLI/network-discovery seed-banks

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── Task 11 (PBQ archetypes plan): end-to-end diagram PBQ vertical slice ──
// Proves reference + configure steps compose through the EXISTING Practice
// mount path — no new mode code. Mounts a Net+ "diagram" archetype scenario
// (network reference with one out-of-subnet device + a diagnose configure
// step + a reconfigure configure×3 step) via _slMountScenario, drives the
// rendered <select> elements exactly like a real user (Task 3 pattern),
// then scores the captured responses via simLabScoreScenario (Task 2).
// Same vm-sandbox + DOM shim as the Task 5 mount test — no shim expansion.
//
// *** DEV FIXTURE ONLY — NOT real content. Do not add to any seed bank. ***
(function () {
  console.log('\n\x1b[1m── Sim Lab: end-to-end diagram PBQ vertical slice (Task 11) ──\x1b[0m');
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

    // ── Task-11 DEV FIXTURE — Net+ diagram PBQ ──
    // VLAN 10 (192.168.10.0/24). PC-2 is deliberately mis-configured with an
    // out-of-subnet IP/mask/gateway (VLAN 20 values). Step 1 (diagnose) asks
    // which device is misconfigured; step 2 (reconfigure) asks for the
    // correct IP/mask/gateway to re-home it. Mirrors the Task 9 fixture
    // shape/convention (deviceId + ip/mask/gateway slot ids) so it also
    // passes simLabValidateNetworkFidelity.
    var fx11NetworkRef = function () {
      return {
        kind: 'network',
        devices: [
          { id: 'pc1', label: 'PC-1', type: 'pc', zone: 'v10', ip: '192.168.10.10', mask: '255.255.255.0', gateway: '192.168.10.1', x: 10, y: 10 },
          { id: 'pc2', label: 'PC-2', type: 'pc', zone: 'v10', ip: '192.168.20.45', mask: '255.255.255.0', gateway: '192.168.20.1', x: 40, y: 10 },
          { id: 'gw1', label: 'Gateway', type: 'router', zone: 'v10', ip: '192.168.10.1', mask: '255.255.255.0', gateway: '192.168.10.1', x: 70, y: 10 }
        ],
        links: [{ from: 'pc1', to: 'gw1' }, { from: 'pc2', to: 'gw1' }],
        given: { networkId: '192.168.10.0', mask: '255.255.255.0' }
      };
    };

    var fx11DiagnoseStep = function () {
      return {
        id: 'diag1', type: 'configure', prompt: 'Which device is misconfigured?', explanation: 'PC-2 is on the wrong VLAN (192.168.20.0/24 instead of .10.0/24).', points: 1,
        payload: {
          slots: [
            { id: 'device', label: 'Misconfigured device', options: [{ id: 'd_pc1', text: 'PC-1' }, { id: 'd_pc2', text: 'PC-2' }, { id: 'd_gw1', text: 'Gateway' }] }
          ]
        },
        answer: { slots: { device: 'd_pc2' } }
      };
    };

    var fx11ReconfigureStep = function () {
      return {
        id: 'fix1', type: 'configure', prompt: 'Correct PC-2’s IP configuration', explanation: 'PC-2 was on 192.168.20.0/24 — the wrong VLAN for this zone.', points: 1,
        deviceId: 'pc2',
        payload: {
          slots: [
            { id: 'ip', label: 'IP Address', options: [{ id: 'ip_bad', text: '192.168.20.45' }, { id: 'ip_good', text: '192.168.10.45' }] },
            { id: 'mask', label: 'Subnet Mask', options: [{ id: 'm_good', text: '255.255.255.0' }, { id: 'm_bad', text: '255.255.0.0' }] },
            { id: 'gateway', label: 'Gateway', options: [{ id: 'gw_good', text: '192.168.10.1' }, { id: 'gw_bad', text: '192.168.20.1' }] }
          ]
        },
        answer: { slots: { ip: 'ip_good', mask: 'm_good', gateway: 'gw_good' } }
      };
    };

    var fx11Scenario = function () {
      return {
        id: 'e2e-diagram-1', cert: 'netplus', archetype: 'diagram',
        scenario: 'A help desk ticket reports PC-2 cannot reach the file server. Diagnose and correct the misconfiguration.',
        estMinutes: 4,
        assets: { reference: fx11NetworkRef() },
        steps: [fx11DiagnoseStep(), fx11ReconfigureStep()]
      };
    };

    // ── Sanity: fixture is well-formed per the existing Task 1/9 validators ──
    var isNonEmptyStrBody   = grabLine('_isNonEmptyStr') || grab('_isNonEmptyStr');
    var validatePayloadBody = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    var ipToIntBody      = grab('_ipToInt');
    var maskToIntBody    = grab('_maskToInt');
    var inSubnetBody     = grab('_inSubnet');
    var resolveSlotBody  = grab('_slFidelityResolveSlot');
    var fidelityBody     = grab('simLabValidateNetworkFidelity');

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody ||
        !ipToIntBody || !maskToIntBody || !inSubnetBody || !resolveSlotBody || !fidelityBody) {
      test('e2e diagram: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Task 11 e2e test; check names/indenting');
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
    vm.runInContext(fidelityBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario; globalThis.__fidelity = simLabValidateNetworkFidelity;', vCtx);
    var simLabValidateScenario = vCtx.__validate;
    var simLabValidateNetworkFidelity = vCtx.__fidelity;

    var _fxScn = fx11Scenario();
    var _fxValidate = simLabValidateScenario(_fxScn);
    test('e2e diagram fixture: passes simLabValidateScenario',
      _fxValidate && _fxValidate.ok === true);
    if (!_fxValidate || !_fxValidate.ok) {
      results.errors.push('Task 11 fixture failed simLabValidateScenario: ' + JSON.stringify(_fxValidate && _fxValidate.errors));
    }

    var _fxFidelity = simLabValidateNetworkFidelity(fx11NetworkRef(), fx11ReconfigureStep());
    test('e2e diagram fixture: passes simLabValidateNetworkFidelity',
      _fxFidelity && _fxFidelity.ok === true);
    if (!_fxFidelity || !_fxFidelity.ok) {
      results.errors.push('Task 11 fixture failed simLabValidateNetworkFidelity: ' + JSON.stringify(_fxFidelity && _fxFidelity.errors));
    }

    // ── Mount via the EXISTING Practice path: _slMountScenario ──
    // Same DOM shim as the Task 5 mount test (getter-backed _children so it
    // tracks live children after innerHTML resets), plus addEventListener/
    // dispatchEvent for the configure renderer's <select> elements (Task 3).
    var elBody         = grab('_el');
    var escBody        = grabLine('_esc');
    var slAttrBody     = grabLine('_slAttr');
    var renderCfgBody  = grab('_slRenderConfigure');
    var renderStepBody = grab('simLabRenderStep');
    var refNetBody     = grab('_slRenderRefNetwork');
    var refTimeBody    = grab('_slRenderRefTimeline');
    var refLayBody     = grab('_slRenderRefLayered');
    var refDispBody    = grab('_slRenderReference');
    var mountBody      = grab('_slMountScenario');
    var scoreSlotsBody    = grab('_scoreConfigureSlots');
    var scoreStepBody     = grab('_scoreStep');
    var scoreScenarioBody = grab('simLabScoreScenario');
    var normBody          = grab('_norm');
    var normalizeMatchBody = grab('_simLabNormalizeMatch');
    var arrEqBody         = grab('_arrEq');
    var setEqBody         = grab('_setEq');

    if (!elBody || !escBody || !mountBody || !refDispBody || !refNetBody ||
        !renderCfgBody || !renderStepBody || !scoreScenarioBody || !scoreSlotsBody || !scoreStepBody) {
      test('e2e diagram: mount/score vm extraction succeeded', false);
      results.errors.push('could not extract _slMountScenario/score helpers for Task 11 e2e test; check names/indenting');
      return;
    }

    var makeEl = function (tag) {
      var attrs = {}, listeners = {}, children = [], cls = '', inner = '', val = '';
      var el = {
        tagName: tag.toUpperCase(),
        get className() { return cls; },
        set className(v) { cls = v; },
        get innerHTML() { return inner; },
        set innerHTML(v) { inner = v; children = []; },
        get value() { return val; },
        set value(v) { val = v; },
        selected: false,
        textContent: '',
        style: {},
        get _children() { return children; },
        setAttribute: function (k, v) { attrs[k] = v; },
        getAttribute: function (k) { return attrs[k] || null; },
        appendChild: function (c) { children.push(c); return c; },
        querySelector: function (sel) {
          for (var i = 0; i < children.length; i++) {
            var c = children[i];
            if (!c || !c.tagName) continue;
            if (sel.toLowerCase() === c.tagName.toLowerCase()) return c;
            if (c._children) {
              for (var j = 0; j < c._children.length; j++) {
                var gc = c._children[j];
                if (gc && gc.tagName && sel.toLowerCase() === gc.tagName.toLowerCase()) return gc;
              }
            }
          }
          return null;
        },
        querySelectorAll: function (sel) {
          var hits = [];
          var search = function (node) {
            if (!node || !node._children) return;
            node._children.forEach(function (c) {
              if (!c || !c.tagName) return;
              var tag = sel.replace(/^\..*/, '').toUpperCase();
              if (c.tagName === (tag || c.tagName)) hits.push(c);
              search(c);
            });
          };
          search(el);
          return hits;
        },
        addEventListener: function (ev, fn) { listeners[ev] = (listeners[ev] || []); listeners[ev].push(fn); },
        dispatchEvent: function (evObj) { var fns = listeners[evObj.type] || []; fns.forEach(function (fn) { fn(evObj); }); },
        closest: function () { return null; },
        remove: function () {}
      };
      return el;
    };

    var docShim = {
      createElement: function (tag) { return makeEl(tag); },
      createTextNode: function (t) { return { textContent: t, tagName: '#text' }; }
    };
    var windowShim = { CSS: null };

    var mCtx = { document: docShim, window: windowShim, Object: Object, Array: Array, String: String, JSON: JSON };
    vm.createContext(mCtx);
    vm.runInContext(elBody, mCtx);
    vm.runInContext(escBody, mCtx);
    vm.runInContext(slAttrBody, mCtx);
    vm.runInContext(renderCfgBody, mCtx);
    vm.runInContext(renderStepBody, mCtx);
    vm.runInContext(refNetBody, mCtx);
    if (refTimeBody) vm.runInContext(refTimeBody, mCtx);
    if (refLayBody) vm.runInContext(refLayBody, mCtx);
    vm.runInContext(refDispBody, mCtx);
    vm.runInContext(mountBody, mCtx);
    vm.runInContext(normBody, mCtx);
    vm.runInContext(normalizeMatchBody, mCtx);
    vm.runInContext(arrEqBody, mCtx);
    vm.runInContext(setEqBody, mCtx);
    vm.runInContext(scoreSlotsBody, mCtx);
    vm.runInContext(scoreStepBody, mCtx);
    vm.runInContext(scoreScenarioBody, mCtx);

    var host = makeEl('div');
    mCtx.host = host;
    mCtx.e2eScn = fx11Scenario();
    var e2eResult = null;
    mCtx.e2eOnSubmit = function (r) { e2eResult = r; };
    vm.runInContext('globalThis.__e2eOpts = { onSubmit: e2eOnSubmit }; _slMountScenario(host, e2eScn, __e2eOpts);', mCtx);

    // wrap._children layout: [sl-scn-prose, sl-ref, ...sl-step wraps, submit]
    var wrap = host._children[0];
    var refPanelFound = wrap && wrap._children.some(function (c) { return c && c.className === 'sl-ref'; });
    test('e2e diagram: mounted DOM contains a .sl-ref reference panel',
      refPanelFound === true);

    var allSelects = (wrap && wrap.querySelectorAll('select')) || [];
    // 1 slot (diagnose) + 3 slots (reconfigure) = 4 selects total
    test('e2e diagram: mounted DOM contains the configure <select> elements',
      allSelects.length === 4);

    // Drive every select to its correct option (Task 3 pattern: set .value,
    // dispatch a 'change' event) so the captured responses are all correct.
    var correctBySlot = { device: 'd_pc2', ip: 'ip_good', mask: 'm_good', gateway: 'gw_good' };
    allSelects.forEach(function (sel) {
      var slotId = sel.getAttribute('data-slot');
      var correctVal = correctBySlot[slotId];
      if (correctVal) {
        sel.value = correctVal;
        sel.dispatchEvent({ type: 'change' });
      }
    });

    // Submit via the same window.__slActiveSubmit path _slMountScenario wires
    // up (mirrors the real "Submit answers" button's data-action handler).
    vm.runInContext('window.__slActiveSubmit();', mCtx);

    test('e2e diagram: simLabScoreScenario reports correct === total after correct answers',
      e2eResult && e2eResult.correct === e2eResult.total && e2eResult.total === 4);

    // Negative control: an all-wrong pass must NOT score correct === total,
    // proving the assertion above isn't vacuously true.
    var host2 = makeEl('div');
    mCtx.host2 = host2;
    mCtx.e2eScn2 = fx11Scenario();
    var e2eResult2 = null;
    mCtx.e2eOnSubmit2 = function (r) { e2eResult2 = r; };
    vm.runInContext('globalThis.__e2eOpts2 = { onSubmit: e2eOnSubmit2 }; _slMountScenario(host2, e2eScn2, __e2eOpts2);', mCtx);
    var wrap2 = host2._children[0];
    var allSelects2 = (wrap2 && wrap2.querySelectorAll('select')) || [];
    var wrongBySlot = { device: 'd_pc1', ip: 'ip_bad', mask: 'm_bad', gateway: 'gw_bad' };
    allSelects2.forEach(function (sel) {
      var slotId = sel.getAttribute('data-slot');
      var wrongVal = wrongBySlot[slotId];
      if (wrongVal) {
        sel.value = wrongVal;
        sel.dispatchEvent({ type: 'change' });
      }
    });
    vm.runInContext('window.__slActiveSubmit();', mCtx);
    test('e2e diagram: negative control (wrong answers) does not score correct === total',
      !(e2eResult2 && e2eResult2.correct === e2eResult2.total));

  } catch (err) {
    test('e2e diagram vertical slice: vm smoke test (threw)', false);
    results.errors.push('e2e diagram vertical slice smoke test threw: ' + err.message);
  }
})();

// ── Task 12 (PBQ archetypes plan): Net+ Diagram seed-bank validation ──
// The 16 consensus-approved Net+ Diagram scenarios now live for real in
// features/sim-lab-seed-netplus.js (window.SIM_LAB_SEED_NETPLUS). This proves
// every one of them is real, production-ready content: each passes the same
// pure validators that gate the dev fixture above (simLabValidateScenario +
// simLabValidateNetworkFidelity), extracted from features/sim-lab.js by the
// same brace-matching approach as .superpowers/sdd/validate-drafts.js (no
// reimplementation of validator logic). Not a fixture — this is the real bank.
(function () {
  console.log('\n\x1b[1m── Sim Lab: Net+ Diagram seed-bank validation (Task 12) ──\x1b[0m');
  try {
    var vm = require('vm');

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    // ── Extract the REAL pure validators from features/sim-lab.js, exactly
    // as .superpowers/sdd/validate-drafts.js does ──
    var isNonEmptyStrBody   = grab('_isNonEmptyStr');
    var validatePayloadBody = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    var ipToIntBody      = grab('_ipToInt');
    var maskToIntBody    = grab('_maskToInt');
    var inSubnetBody     = grab('_inSubnet');
    var resolveSlotBody  = grab('_slFidelityResolveSlot');
    var fidelityBody     = grab('simLabValidateNetworkFidelity');

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody ||
        !ipToIntBody || !maskToIntBody || !inSubnetBody || !resolveSlotBody || !fidelityBody) {
      test('Net+ Diagram bank: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Task 12 bank test; check names/indenting');
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
    vm.runInContext(fidelityBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario; globalThis.__fidelity = simLabValidateNetworkFidelity;', vCtx);
    var simLabValidateScenario = vCtx.__validate;
    var simLabValidateNetworkFidelity = vCtx.__fidelity;

    // ── Load the real seed bank: eval features/sim-lab-seed-netplus.js in a
    // sandbox with `var window = {}` so window.SIM_LAB_SEED_NETPLUS populates ──
    var seedSrc = read('features/sim-lab-seed-netplus.js');
    var seedCtx = {};
    vm.createContext(seedCtx);
    vm.runInContext('var window = {};\n' + seedSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_NETPLUS;', seedCtx);
    var seedBank = seedCtx.__seed;

    test('Net+ Diagram bank: window.SIM_LAB_SEED_NETPLUS loaded as an array',
      Array.isArray(seedBank));
    if (!Array.isArray(seedBank)) {
      results.errors.push('could not load window.SIM_LAB_SEED_NETPLUS from features/sim-lab-seed-netplus.js');
      return;
    }

    var diagramScenarios = seedBank.filter(function (s) { return s && s.archetype === 'diagram'; });
    test('Net+ Diagram bank: at least 16 diagram-archetype scenarios present',
      diagramScenarios.length >= 16);

    var allValidateOk = true, allFidelityOk = true;
    diagramScenarios.forEach(function (s) {
      var vr = simLabValidateScenario(s);
      if (!vr || vr.ok !== true) {
        allValidateOk = false;
        results.errors.push('Net+ Diagram bank: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
      if (s && s.assets && s.assets.reference) {
        var cfgStep = (s.steps || []).filter(function (st) { return st.type === 'configure' && st.deviceId; })[0];
        if (cfgStep) {
          var fr = simLabValidateNetworkFidelity(s.assets.reference, cfgStep);
          if (!fr || fr.ok !== true) {
            allFidelityOk = false;
            results.errors.push('Net+ Diagram bank: ' + (s && s.id) + ' failed simLabValidateNetworkFidelity: ' + JSON.stringify(fr && fr.errors));
          }
        }
      }
    });

    test('Net+ Diagram bank: every diagram scenario passes simLabValidateScenario',
      allValidateOk);
    test('Net+ Diagram bank: every diagram scenario\'s configure(deviceId) step passes simLabValidateNetworkFidelity',
      allFidelityOk);

  } catch (err) {
    test('Net+ Diagram bank: vm smoke test (threw)', false);
    results.errors.push('Net+ Diagram bank smoke test threw: ' + err.message);
  }
})();

// ── Wave 1 Task 6: Net+ Wireless Deployment seed-bank validation ──
// The 12 consensus-approved Net+ Wireless scenarios now live for real in
// features/sim-lab-seed-netplus.js (window.SIM_LAB_SEED_NETPLUS). This proves
// every one of them is real, production-ready content: each passes the same
// pure validators that gate the dev fixtures above (simLabValidateScenario +
// simLabValidateWirelessFidelity), extracted from features/sim-lab.js by the
// same brace-matching approach as .superpowers/sdd/validate-drafts.js (no
// reimplementation of validator logic). Not a fixture — this is the real
// bank. Mirrors the Task 12 diagram-bank block's structure, swapping the
// network fidelity oracle for the wireless one (Wave 1 Task 2's vm wiring).
(function () {
  console.log('\n\x1b[1m── Sim Lab: Net+ Wireless Deployment seed-bank validation (Wave 1 Task 6) ──\x1b[0m');
  try {
    var vm = require('vm');
    function assert(cond, msg) { test(msg, !!cond); }

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };
    var grabVar = function (name) {
      var re = new RegExp('var ' + name + ' = [^;]*;');
      return (js.match(re) || [''])[0];
    };

    // ── Extract the REAL pure validators from features/sim-lab.js, exactly
    // as .superpowers/sdd/validate-drafts.js does ──
    var isNonEmptyStrBody    = grab('_isNonEmptyStr');
    var validatePayloadBody  = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    var resolveSlotBody   = grab('_slFidelityResolveSlot');
    var wifi24Var          = grabVar('_WIFI_24_CLEAR');
    var wifi5Var            = grabVar('_WIFI_5_CHANNELS');
    var wifiFidelityBody  = grab('simLabValidateWirelessFidelity');

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody ||
        !resolveSlotBody || !wifi24Var || !wifi5Var || !wifiFidelityBody) {
      test('Net+ Wireless bank: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Wave 1 Task 6 bank test; check names/indenting');
      return;
    }

    var vCtx = {};
    vm.createContext(vCtx);
    vm.runInContext(stepTypesDecl, vCtx);
    vm.runInContext(isNonEmptyStrBody, vCtx);
    vm.runInContext(validatePayloadBody, vCtx);
    vm.runInContext(validateScenarioBody, vCtx);
    vm.runInContext(resolveSlotBody, vCtx);
    vm.runInContext(wifi24Var, vCtx);
    vm.runInContext(wifi5Var, vCtx);
    vm.runInContext(wifiFidelityBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario; globalThis.__wifiFidelity = simLabValidateWirelessFidelity;', vCtx);
    var simLabValidateScenario = vCtx.__validate;
    var simLabValidateWirelessFidelity = vCtx.__wifiFidelity;

    // ── Load the real seed bank: eval features/sim-lab-seed-netplus.js in a
    // sandbox with `var window = {}` so window.SIM_LAB_SEED_NETPLUS populates ──
    var seedSrc = read('features/sim-lab-seed-netplus.js');
    var seedCtx = {};
    vm.createContext(seedCtx);
    vm.runInContext('var window = {};\n' + seedSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_NETPLUS;', seedCtx);
    var seedBank = seedCtx.__seed;

    test('Net+ Wireless bank: window.SIM_LAB_SEED_NETPLUS loaded as an array',
      Array.isArray(seedBank));
    if (!Array.isArray(seedBank)) {
      results.errors.push('could not load window.SIM_LAB_SEED_NETPLUS from features/sim-lab-seed-netplus.js');
      return;
    }

    var wirelessScenarios = seedBank.filter(function (s) { return s && s.archetype === 'wireless'; });
    test('Net+ Wireless bank: at least 10 wireless-archetype scenarios present',
      wirelessScenarios.length >= 10);

    var allValidateOk = true, allFidelityOk = true;
    wirelessScenarios.forEach(function (s) {
      var vr = simLabValidateScenario(s);
      if (!vr || vr.ok !== true) {
        allValidateOk = false;
        results.errors.push('Net+ Wireless bank: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
      if (s && s.assets && s.assets.reference) {
        var cfgSteps = (s.steps || []).filter(function (st) { return st.type === 'configure' && st.apId; });
        cfgSteps.forEach(function (cfgStep) {
          var fr = simLabValidateWirelessFidelity(s.assets.reference, cfgStep);
          if (!fr || fr.ok !== true) {
            allFidelityOk = false;
            results.errors.push('Net+ Wireless bank: ' + (s && s.id) + ' failed simLabValidateWirelessFidelity: ' + JSON.stringify(fr && fr.errors));
          }
        });
      }
    });

    test('Net+ Wireless bank: every wireless scenario passes simLabValidateScenario',
      allValidateOk);
    test('Net+ Wireless bank: every wireless scenario\'s configure(apId) step passes simLabValidateWirelessFidelity',
      allFidelityOk);

  } catch (err) {
    test('Net+ Wireless bank: vm smoke test (threw)', false);
    results.errors.push('Net+ Wireless bank smoke test threw: ' + err.message);
  }
})();

// ── Wave 1 Task 7: Net+ Firewall Rule Table seed-bank validation ──
// The 12 consensus-approved Net+ Firewall scenarios now live for real in
// features/sim-lab-seed-netplus.js (window.SIM_LAB_SEED_NETPLUS). This proves
// every one of them is real, production-ready content: each passes the same
// pure validators that gate the dev fixtures above (simLabValidateScenario +
// simLabValidateFirewallFidelity), extracted from features/sim-lab.js by the
// same brace-matching approach as .superpowers/sdd/wave1/validate-drafts.js
// (no reimplementation of validator logic). Not a fixture — this is the real
// bank. Mirrors the Task 6 wireless-bank block's structure, swapping the
// wireless fidelity oracle for the firewall one, and adds an order-consistency
// assertion tying each scenario's `order` step to its fwSpec.rules ordering.
(function () {
  console.log('\n\x1b[1m── Sim Lab: Net+ Firewall Rule Table seed-bank validation (Wave 1 Task 7) ──\x1b[0m');
  try {
    var vm = require('vm');
    function assert(cond, msg) { test(msg, !!cond); }

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };
    var grabVar = function (name) {
      var re = new RegExp('var ' + name + ' = [^;]*;');
      return (js.match(re) || [''])[0];
    };

    // ── Extract the REAL pure validators from features/sim-lab.js, exactly
    // as .superpowers/sdd/wave1/validate-drafts.js does ──
    var isNonEmptyStrBody    = grab('_isNonEmptyStr');
    var validatePayloadBody  = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    var ipToIntBody       = grab('_ipToInt');
    var fwMatchAddrBody    = grab('_fwMatchAddr');
    var fwRuleMatchesBody  = grab('_fwRuleMatches');
    var fwFidelityBody     = grab('simLabValidateFirewallFidelity');

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody ||
        !ipToIntBody || !fwMatchAddrBody || !fwRuleMatchesBody || !fwFidelityBody) {
      test('Net+ Firewall bank: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Wave 1 Task 7 bank test; check names/indenting');
      return;
    }

    var vCtx = {};
    vm.createContext(vCtx);
    vm.runInContext(stepTypesDecl, vCtx);
    vm.runInContext(isNonEmptyStrBody, vCtx);
    vm.runInContext(validatePayloadBody, vCtx);
    vm.runInContext(validateScenarioBody, vCtx);
    vm.runInContext(ipToIntBody, vCtx);
    vm.runInContext(fwMatchAddrBody, vCtx);
    vm.runInContext(fwRuleMatchesBody, vCtx);
    vm.runInContext(fwFidelityBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario; globalThis.__fwFidelity = simLabValidateFirewallFidelity;', vCtx);
    var simLabValidateScenario = vCtx.__validate;
    var simLabValidateFirewallFidelity = vCtx.__fwFidelity;

    // ── Load the real seed bank: eval features/sim-lab-seed-netplus.js in a
    // sandbox with `var window = {}` so window.SIM_LAB_SEED_NETPLUS populates ──
    var seedSrc = read('features/sim-lab-seed-netplus.js');
    var seedCtx = {};
    vm.createContext(seedCtx);
    vm.runInContext('var window = {};\n' + seedSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_NETPLUS;', seedCtx);
    var seedBank = seedCtx.__seed;

    test('Net+ Firewall bank: window.SIM_LAB_SEED_NETPLUS loaded as an array',
      Array.isArray(seedBank));
    if (!Array.isArray(seedBank)) {
      results.errors.push('could not load window.SIM_LAB_SEED_NETPLUS from features/sim-lab-seed-netplus.js');
      return;
    }

    var bankFw = seedBank.filter(function (s) { return s && s.archetype === 'firewall'; });
    test('Net+ Firewall bank: at least 10 firewall-archetype scenarios present',
      bankFw.length >= 10);

    var allValidateOk = true, allFidelityOk = true;
    bankFw.forEach(function (s) {
      var vr = simLabValidateScenario(s);
      if (!vr || vr.ok !== true) {
        allValidateOk = false;
        results.errors.push('Net+ Firewall bank: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
      var fr = simLabValidateFirewallFidelity(s);
      if (!fr || fr.ok !== true) {
        allFidelityOk = false;
        results.errors.push('Net+ Firewall bank: ' + (s && s.id) + ' failed simLabValidateFirewallFidelity: ' + JSON.stringify(fr && fr.errors));
      }
    });

    test('Net+ Firewall bank: every firewall scenario passes simLabValidateScenario',
      allValidateOk);
    test('Net+ Firewall bank: every firewall scenario passes simLabValidateFirewallFidelity',
      allFidelityOk);

    bankFw.forEach(function (s) {
      var ord = (s.steps || []).filter(function (st) { return st.type === 'order'; })[0];
      if (ord) {
        var want = s.fwSpec.rules.map(function (r) { return r.id; }).join(',');
        test('fw ' + s.id + ': order key matches fwSpec order',
          ord.answer.correctOrder.join(',') === want);
      }
    });

  } catch (err) {
    test('Net+ Firewall bank: vm smoke test (threw)', false);
    results.errors.push('Net+ Firewall bank smoke test threw: ' + err.message);
  }
})();

// ── Wave 2 Task 8: Net+ CLI Fault Isolation seed-bank validation ──
// The 12 consensus-approved (two-agent gated) Net+ CLI scenarios now live for
// real in features/sim-lab-seed-netplus.js (window.SIM_LAB_SEED_NETPLUS).
// This proves every one of them is real, production-ready content: each
// passes the same pure validators that gate the dev fixtures above
// (simLabValidateScenario + simLabValidateCliFaultFidelity), extracted from
// features/sim-lab.js the same way the Wave 1 bank blocks do. Mirrors the
// Wave 1 Task 6/7 bank-block structure, swapping in the CLI fault oracle.
(function () {
  console.log('\n\x1b[1m── Sim Lab: Net+ CLI Fault Isolation seed-bank validation (Wave 2 Task 8) ──\x1b[0m');
  try {
    var vm = require('vm');
    function assert(cond, msg) { test(msg, !!cond); }

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    // ── Extract the REAL pure validators from features/sim-lab.js, exactly
    // as the Wave 1 bank blocks do ──
    var isNonEmptyStrBody    = grab('_isNonEmptyStr');
    var validatePayloadBody  = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    var resolveSlotBody = grab('_slFidelityResolveSlot');
    var sigVar = (js.match(/var _CLI_FAULT_SIG = \{[\s\S]*?\n\s*\};/) || [''])[0];
    var cliExcerptTextBody = grab('_cliExcerptText');
    var cliNeedlesMetBody  = grab('_cliNeedlesMet');
    var cliFidelityBody    = grab('simLabValidateCliFaultFidelity');

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody ||
        !resolveSlotBody || !sigVar || !cliExcerptTextBody || !cliNeedlesMetBody || !cliFidelityBody) {
      test('Net+ CLI bank: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Wave 2 Task 8 bank test; check names/indenting');
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
    vm.runInContext(cliExcerptTextBody, vCtx);
    vm.runInContext(cliNeedlesMetBody, vCtx);
    vm.runInContext(cliFidelityBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario; globalThis.__cliFidelity = simLabValidateCliFaultFidelity;', vCtx);
    var simLabValidateScenario = vCtx.__validate;
    var simLabValidateCliFaultFidelity = vCtx.__cliFidelity;

    // ── Load the real seed bank: eval features/sim-lab-seed-netplus.js in a
    // sandbox with `var window = {}` so window.SIM_LAB_SEED_NETPLUS populates ──
    var seedSrc = read('features/sim-lab-seed-netplus.js');
    var seedCtx = {};
    vm.createContext(seedCtx);
    vm.runInContext('var window = {};\n' + seedSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_NETPLUS;', seedCtx);
    var seedBank = seedCtx.__seed;

    test('Net+ CLI bank: window.SIM_LAB_SEED_NETPLUS loaded as an array',
      Array.isArray(seedBank));
    if (!Array.isArray(seedBank)) {
      results.errors.push('could not load window.SIM_LAB_SEED_NETPLUS from features/sim-lab-seed-netplus.js');
      return;
    }

    var cliScenarios = seedBank.filter(function (s) { return s && s.archetype === 'cli'; });
    test('Net+ CLI bank: at least 10 cli-archetype scenarios present',
      cliScenarios.length >= 10);

    var allValidateOk = true, allFidelityOk = true, allCertOk = true;
    cliScenarios.forEach(function (s) {
      var vr = simLabValidateScenario(s);
      if (!vr || vr.ok !== true) {
        allValidateOk = false;
        results.errors.push('Net+ CLI bank: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
      var fr = simLabValidateCliFaultFidelity(s);
      if (!fr || fr.ok !== true) {
        allFidelityOk = false;
        results.errors.push('Net+ CLI bank: ' + (s && s.id) + ' failed simLabValidateCliFaultFidelity: ' + JSON.stringify(fr && fr.errors));
      }
      if (!s || s.cert !== 'netplus') {
        allCertOk = false;
        results.errors.push('Net+ CLI bank: ' + (s && s.id) + ' has cert !== netplus: ' + JSON.stringify(s && s.cert));
      }
    });

    test('Net+ CLI bank: every cli scenario passes simLabValidateScenario',
      allValidateOk);
    test('Net+ CLI bank: every cli scenario passes simLabValidateCliFaultFidelity',
      allFidelityOk);
    test('Net+ CLI bank: every cli scenario has cert === netplus',
      allCertOk);

  } catch (err) {
    test('Net+ CLI bank: vm smoke test (threw)', false);
    results.errors.push('Net+ CLI bank smoke test threw: ' + err.message);
  }
})();

// ── Wave 2 Task 9: Net+ Network Discovery Audit seed-bank validation ──
// The 11 consensus-approved (two-agent gated) Net+ Network Discovery Audit
// scenarios now live for real in features/sim-lab-seed-netplus.js
// (window.SIM_LAB_SEED_NETPLUS). This proves every one of them is real,
// production-ready content: each passes the same pure validators that gate
// the dev fixtures above (simLabValidateScenario +
// simLabValidateDiscoveryAuditFidelity), extracted from features/sim-lab.js
// the same way the Wave 2 Task 8 CLI bank block does.
(function () {
  console.log('\n\x1b[1m── Sim Lab: Net+ Network Discovery Audit seed-bank validation (Wave 2 Task 9) ──\x1b[0m');
  try {
    var vm = require('vm');
    function assert(cond, msg) { test(msg, !!cond); }

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    // ── Extract the REAL pure validators from features/sim-lab.js, exactly
    // as the Wave 2 Task 8 CLI bank block does ──
    var isNonEmptyStrBody    = grab('_isNonEmptyStr');
    var validatePayloadBody  = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    var resolveSlotBody     = grab('_slFidelityResolveSlot');
    var discoLineFactsBody  = grab('_discoLineFacts');
    var discoDerivePortBody = grab('_discoDerivePort');
    var discoFidelityBody   = grab('simLabValidateDiscoveryAuditFidelity');

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody ||
        !resolveSlotBody || !discoLineFactsBody || !discoDerivePortBody || !discoFidelityBody) {
      test('Net+ Discovery bank: validator helper extraction succeeded', false);
      results.errors.push('could not extract validator helpers for Wave 2 Task 9 bank test; check names/indenting');
      return;
    }

    var vCtx = {};
    vm.createContext(vCtx);
    vm.runInContext(stepTypesDecl, vCtx);
    vm.runInContext(isNonEmptyStrBody, vCtx);
    vm.runInContext(validatePayloadBody, vCtx);
    vm.runInContext(validateScenarioBody, vCtx);
    vm.runInContext(resolveSlotBody, vCtx);
    vm.runInContext(discoLineFactsBody, vCtx);
    vm.runInContext(discoDerivePortBody, vCtx);
    vm.runInContext(discoFidelityBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario; globalThis.__discoFidelity = simLabValidateDiscoveryAuditFidelity;', vCtx);
    var simLabValidateScenario = vCtx.__validate;
    var simLabValidateDiscoveryAuditFidelity = vCtx.__discoFidelity;

    // ── Load the real seed bank: eval features/sim-lab-seed-netplus.js in a
    // sandbox with `var window = {}` so window.SIM_LAB_SEED_NETPLUS populates ──
    var seedSrc = read('features/sim-lab-seed-netplus.js');
    var seedCtx = {};
    vm.createContext(seedCtx);
    vm.runInContext('var window = {};\n' + seedSrc + '\nglobalThis.__seed = window.SIM_LAB_SEED_NETPLUS;', seedCtx);
    var seedBank = seedCtx.__seed;

    test('Net+ Discovery bank: window.SIM_LAB_SEED_NETPLUS loaded as an array',
      Array.isArray(seedBank));
    if (!Array.isArray(seedBank)) {
      results.errors.push('could not load window.SIM_LAB_SEED_NETPLUS from features/sim-lab-seed-netplus.js');
      return;
    }

    var discoScenarios = seedBank.filter(function (s) { return s && s.archetype === 'discovery'; });
    test('Net+ Discovery bank: at least 10 discovery-archetype scenarios present',
      discoScenarios.length >= 10);

    var allValidateOk = true, allFidelityOk = true, allCertOk = true;
    discoScenarios.forEach(function (s) {
      var vr = simLabValidateScenario(s);
      if (!vr || vr.ok !== true) {
        allValidateOk = false;
        results.errors.push('Net+ Discovery bank: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
      var fr = simLabValidateDiscoveryAuditFidelity(s);
      if (!fr || fr.ok !== true) {
        allFidelityOk = false;
        results.errors.push('Net+ Discovery bank: ' + (s && s.id) + ' failed simLabValidateDiscoveryAuditFidelity: ' + JSON.stringify(fr && fr.errors));
      }
      if (!s || s.cert !== 'netplus') {
        allCertOk = false;
        results.errors.push('Net+ Discovery bank: ' + (s && s.id) + ' has cert !== netplus: ' + JSON.stringify(s && s.cert));
      }
    });

    test('Net+ Discovery bank: every discovery scenario passes simLabValidateScenario',
      allValidateOk);
    test('Net+ Discovery bank: every discovery scenario passes simLabValidateDiscoveryAuditFidelity',
      allFidelityOk);
    test('Net+ Discovery bank: every discovery scenario has cert === netplus',
      allCertOk);

    // ── Extra cross-check: every records-audit answer.selected has length 1,
    // and the reconcile configure step defines a <port>__ip slot for every
    // scn.disco.ports[*].port ──
    discoScenarios.forEach(function (s) {
      var cfg = s.steps.filter(function (st) { return st.type === 'configure'; })[0];
      var aud = s.steps.filter(function (st) { return st.type === 'analyze'; })[0];
      var haveIpSlots = s.disco.ports.every(function (p) {
        return cfg.payload.slots.some(function (sl) { return sl.id === p.port + '__ip'; });
      });
      test('disco ' + s.id + ': every port has an __ip reconcile slot + single audit pick',
        haveIpSlots && aud && aud.answer.selected.length === 1);
    });

  } catch (err) {
    test('Net+ Discovery bank: vm smoke test (threw)', false);
    results.errors.push('Net+ Discovery bank smoke test threw: ' + err.message);
  }
})();

