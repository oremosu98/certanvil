// tests/uat/190-simlab-configure-reference-assets.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Sim Lab configure step type/scoring/renderer, reference asset model, faceplate/wiremap/slots reference renderers

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── v7.61.x: Sim Lab — configure step type validation (Task 1) ──
// Behavioral smoke: extract simLabValidateScenario + its helpers into a vm
// sandbox and prove the configure step contract is enforced correctly.
(function () {
  console.log('\n\x1b[1m── Sim Lab: configure step type validation ──\x1b[0m');
  try {
    // Pull the three helpers out of the (already-dedented) features source.
    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };
    var isNonEmptyStrBody = grab('_isNonEmptyStr');
    var validatePayloadBody = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');
    // Also need STEP_TYPES — grab the array declaration from the dedented source.
    var stepTypesDecl = (js.match(/var STEP_TYPES = \[[^\]]*\];/) || [''])[0];

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody || !stepTypesDecl) {
      test('configure: extraction of sim-lab validation helpers', false);
      results.errors.push('could not extract sim-lab helpers from js; check dedenting');
      return;
    }

    var ctx = {};
    vm.createContext(ctx);
    vm.runInContext(stepTypesDecl, ctx);
    vm.runInContext(isNonEmptyStrBody, ctx);
    vm.runInContext(validatePayloadBody, ctx);
    vm.runInContext(validateScenarioBody, ctx);
    vm.runInContext('globalThis.__slValidate = simLabValidateScenario;', ctx);
    var slValidate = ctx.__slValidate;

    // Canonical valid configure scenario.
    var cfgStep = {
      id: 's1', type: 'configure', prompt: 'p', explanation: 'e', points: 1,
      payload: { slots: [{ id: 'ip', label: 'IP', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] }] },
      answer: { slots: { ip: 'a' } }
    };
    var cfgScn = { id: 'c1', cert: 'netplus', scenario: 'prose', estMinutes: 3, steps: [cfgStep] };

    test('configure: valid scenario passes',
      slValidate(cfgScn).ok === true);

    // answer references an option id that does not exist in the slot.
    var bad1 = JSON.parse(JSON.stringify(cfgScn));
    bad1.steps[0].answer.slots.ip = 'zzz';
    test('configure: rejects unknown option id in answer',
      slValidate(bad1).ok === false);

    // slot has only 1 option (minimum is 2).
    var bad2 = JSON.parse(JSON.stringify(cfgScn));
    bad2.steps[0].payload.slots[0].options.pop();
    test('configure: rejects slot with fewer than 2 options',
      slValidate(bad2).ok === false);

  } catch (err) {
    test('configure: vm smoke test (threw)', false);
    results.errors.push('configure vm smoke test threw: ' + err.message);
  }
})();

// ── v7.62.x: Sim Lab — configure per-slot scoring (Task 2) ──
// Behavioral smoke: extract simLabScoreScenario + its helpers into a vm
// sandbox and prove configure steps score per-slot while other types stay 1-per-step.
(function () {
  console.log('\n\x1b[1m── Sim Lab: configure per-slot scoring ──\x1b[0m');
  try {
    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };
    var normBody             = grab('_norm');
    var normalizeMatchBody   = grab('_simLabNormalizeMatch');
    var arrEqBody            = grab('_arrEq');
    var setEqBody            = grab('_setEq');
    var scoreSlotsBody       = grab('_scoreConfigureSlots');
    var scoreStepBody        = grab('_scoreStep');
    var scoreScenarioBody    = grab('simLabScoreScenario');

    if (!normBody || !normalizeMatchBody || !arrEqBody || !setEqBody ||
        !scoreSlotsBody || !scoreStepBody || !scoreScenarioBody) {
      test('configure scoring: extraction of sim-lab scoring helpers', false);
      results.errors.push('could not extract sim-lab scoring helpers from js; check function names/dedenting');
      return;
    }

    var ctx = {};
    vm.createContext(ctx);
    vm.runInContext(normBody, ctx);
    vm.runInContext(normalizeMatchBody, ctx);
    vm.runInContext(arrEqBody, ctx);
    vm.runInContext(setEqBody, ctx);
    vm.runInContext(scoreSlotsBody, ctx);
    vm.runInContext(scoreStepBody, ctx);
    vm.runInContext(scoreScenarioBody, ctx);
    vm.runInContext('globalThis.__slScore = simLabScoreScenario;', ctx);
    var simLabScoreScenario = ctx.__slScore;

    // 3-slot configure: 2 correct, 1 wrong → correct:2, total:3
    var _scn3 = { id:'c2', cert:'netplus', scenario:'p', estMinutes:3, steps:[{
      id:'s', type:'configure', prompt:'p', explanation:'e', points:1,
      payload:{ slots:[
        {id:'a',label:'A',options:[{id:'x',text:'x'},{id:'y',text:'y'}]},
        {id:'b',label:'B',options:[{id:'x',text:'x'},{id:'y',text:'y'}]},
        {id:'c',label:'C',options:[{id:'x',text:'x'},{id:'y',text:'y'}]} ]},
      answer:{ slots:{ a:'x', b:'x', c:'x' } } }] };
    var _r = simLabScoreScenario(_scn3, { s: { slots:{ a:'x', b:'x', c:'y' } } });
    test('configure scores per-slot (2/3)',
      _r.correct === 2 && _r.total === 3);

    // non-configure (order): must still score 1 point per step
    var _ord = { id:'c3', cert:'netplus', scenario:'p', estMinutes:3, steps:[{
      id:'o', type:'order', prompt:'p', explanation:'e', points:1,
      payload:{ items:[{id:'1',label:'1'},{id:'2',label:'2'}] }, answer:{ correctOrder:['1','2'] } }] };
    var _ro = simLabScoreScenario(_ord, { o:{ order:['1','2'] } });
    test('non-configure unchanged (1 per step)',
      _ro.correct === 1 && _ro.total === 1);

  } catch (err) {
    test('configure scoring: vm smoke test (threw)', false);
    results.errors.push('configure scoring vm smoke test threw: ' + err.message);
  }
})();

// ── v7.63.x: Sim Lab — configure step renderer (Task 3) ──
// Structural + behavioral smoke using a minimal DOM shim (same pattern as
// _renderDiagnosticQuestion). Verifies _slRenderConfigure exists, is wired
// into simLabRenderStep('configure'), renders one <select> per slot, and
// calls onChange with the correct response shape on user interaction.
(function () {
  console.log('\n\x1b[1m── Sim Lab: configure step renderer ──\x1b[0m');
  try {
    // js is app.js + dedented feature files (2 spaces stripped per line),
    // so closing braces are \n} not \n  } — match Task 1/2 grab pattern exactly.
    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    // Structural: function exists and simLabRenderStep routes to it
    test('configure renderer: _slRenderConfigure defined',
      /function _slRenderConfigure\(/.test(js));
    test('configure renderer: simLabRenderStep routes configure type',
      /case 'configure'\s*:\s*return _slRenderConfigure\(/.test(js));
    test('configure renderer: uses .sl-cfg root class',
      js.includes("'sl-cfg'") || js.includes('"sl-cfg"'));
    test('configure renderer: uses native <select> element',
      /createElement\(\s*['"]select['"]\s*\)/.test(js) && js.includes('sl-cfg-select'));

    // Behavioral smoke: extract renderer + helpers into a vm with a DOM shim.
    // _el/_esc/_slAttr are one-liners so we grab them by line rather than by
    // brace-depth (the multi-line grab regex overshoots on inline functions).
    var grabLine = function (name) {
      var re = new RegExp('function ' + name + '\\([^\\n]*\\)\\s*\\{[^\\n]*\\}');
      return (js.match(re) || [''])[0];
    };
    var elBody         = grab('_el');       // multi-line: use brace-depth grab
    var escBody        = grabLine('_esc');  // one-liner: use single-line grab
    var slAttrBody     = grabLine('_slAttr'); // one-liner: use single-line grab
    var renderCfgBody  = grab('_slRenderConfigure');
    var renderStepBody = grab('simLabRenderStep');

    if (!elBody || !escBody || !slAttrBody || !renderCfgBody || !renderStepBody) {
      test('configure renderer: vm extraction succeeded', false);
      results.errors.push('could not extract configure renderer helpers; check function names/indenting');
      return;
    }

    var vm  = require('vm');
    // Minimal DOM shim — enough for _el, _esc, createElement('select'), addEventListener, dispatchEvent
    var makeEl = function (tag) {
      var attrs = {}, listeners = {}, children = [], cls = '', inner = '', val = '';
      var el = {
        tagName: tag.toUpperCase(),
        get className() { return cls; },
        set className(v) { cls = v; },
        get innerHTML() { return inner; },
        set innerHTML(v) { inner = v; },
        get value() { return val; },
        set value(v) { val = v; },
        selected: false,
        textContent: '',
        style: {},
        _children: children,
        setAttribute: function (k, v) { attrs[k] = v; },
        getAttribute: function (k) { return attrs[k] || null; },
        appendChild: function (c) { children.push(c); return c; },
        querySelector: function (sel) {
          // Simple: find first child matching tag or class
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
        dispatchEvent: function (evObj) {
          var fns = listeners[evObj.type] || [];
          fns.forEach(function (fn) { fn(evObj); });
        },
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

    var ctx = { document: docShim, window: windowShim, Object: Object, Array: Array, String: String };
    vm.createContext(ctx);
    vm.runInContext(elBody, ctx);
    vm.runInContext(escBody, ctx);
    vm.runInContext(slAttrBody, ctx);
    vm.runInContext(renderCfgBody, ctx);
    vm.runInContext(renderStepBody, ctx);

    var cfgStep = {
      id: 's1', type: 'configure', prompt: 'Set the IP mode', explanation: 'e', points: 1,
      payload: { slots: [
        { id: 'ip', label: 'IP Mode', options: [{ id: 'a', text: 'Static' }, { id: 'b', text: 'DHCP' }] }
      ]},
      answer: { slots: { ip: 'a' } }
    };

    var captured = null;
    ctx.cfgStep = cfgStep;
    ctx.capturedRef = function (r) { captured = r; };
    vm.runInContext('globalThis.__node = simLabRenderStep(cfgStep, capturedRef);', ctx);
    var node = ctx.__node;

    // 1. Root element has sl-cfg class
    test('configure renderer: root has sl-cfg class',
      node && node.className === 'sl-cfg');

    // 2. One select rendered per slot
    var selects = (node && node.querySelectorAll('select')) || [];
    test('configure renderer: renders one select per slot',
      selects.length === 1);

    // 3. onChange called on mount with empty slots (no pre-selection)
    test('configure renderer: reports initial state on mount',
      captured !== null && captured.slots !== undefined);

    // 4. Firing the select's change event updates the response
    var sel = selects[0];
    if (sel) {
      sel.value = 'b';
      sel.dispatchEvent({ type: 'change' });
    }
    test('configure renderer: onChange reports selection after change',
      captured && captured.slots && captured.slots.ip === 'b');

    // 5. Re-hydration: initial pre-selects the right option
    var captured2 = null;
    ctx.capturedRef2 = function (r) { captured2 = r; };
    vm.runInContext('globalThis.__node2 = simLabRenderStep(cfgStep, capturedRef2, { slots: { ip: "a" } });', ctx);
    test('configure renderer: re-hydrates from initial response',
      captured2 && captured2.slots && captured2.slots.ip === 'a');

  } catch (err) {
    test('configure renderer: vm smoke test (threw)', false);
    results.errors.push('configure renderer vm smoke test threw: ' + err.message);
  }
})();

// ── Task 5: reference asset model + validation + mount wiring ──
// Validation tests use the existing simLabValidateScenario extracted from `js`.
// Mount test uses a vm-sandbox + DOM shim (same pattern as configure renderer).
(function () {
  console.log('\n\x1b[1m── Sim Lab: reference asset model (Task 5) ──\x1b[0m');
  try {
    var vm = require('vm');

    // grab() pattern: matches dedented feature file functions (\n} closing brace)
    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };
    var grabLine = function (name) {
      var re = new RegExp('function ' + name + '\\([^\\n]*\\)\\s*\\{[^\\n]*\\}');
      return (js.match(re) || [''])[0];
    };

    // ── Structural checks ──
    test('reference: _slRenderReference defined',
      /function _slRenderReference\(/.test(js));
    test('reference: _slRenderRefNetwork defined',
      /function _slRenderRefNetwork\(/.test(js));
    test('reference: _slRenderRefTimeline defined',
      /function _slRenderRefTimeline\(/.test(js));
    test('reference: _slRenderRefLayered defined',
      /function _slRenderRefLayered\(/.test(js));
    test('reference: _slMountScenario wires _slRenderReference',
      /scn\.assets && scn\.assets\.reference/.test(js) && /_slRenderReference\(/.test(js));
    test('reference: simLabValidateScenario checks reference kind',
      /reference: bad kind/.test(js));

    // ── Validation tests — extract simLabValidateScenario + helpers into vm ──
    var isNonEmptyStrBody = grabLine('_isNonEmptyStr') || grab('_isNonEmptyStr');
    var validatePayloadBody = grab('_validateStepPayload');
    var validateScenarioBody = grab('simLabValidateScenario');

    // STEP_TYPES array — grab from source
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    var stepTypesDecl = stepTypesMatch ? stepTypesMatch[0] + ';' : "var STEP_TYPES = ['order','categorize','match','analyze','fillin','configure'];";

    // _SWATCH_DEFECTS array (Wave 4 Task 1) — grab from source
    var swatchDefectsMatch = js.match(/var _SWATCH_DEFECTS\s*=\s*\[[^\]]+\]/);
    var swatchDefectsDecl = swatchDefectsMatch ? swatchDefectsMatch[0] + ';' : "var _SWATCH_DEFECTS = ['spots','streak','smear','ghost','skew'];";

    if (!isNonEmptyStrBody || !validatePayloadBody || !validateScenarioBody) {
      test('reference validation: helper extraction succeeded', false);
      results.errors.push('could not extract simLabValidateScenario helpers; check names/indenting');
      return;
    }

    var vCtx = {};
    vm.createContext(vCtx);
    vm.runInContext(stepTypesDecl, vCtx);
    vm.runInContext(swatchDefectsDecl, vCtx);
    vm.runInContext(isNonEmptyStrBody, vCtx);
    vm.runInContext(validatePayloadBody, vCtx);
    vm.runInContext(validateScenarioBody, vCtx);
    vm.runInContext('globalThis.__validate = simLabValidateScenario;', vCtx);
    var simLabValidateScenario = vCtx.__validate;

    // Minimal valid configure scenario used as base for all reference tests
    var _baseScn = function () {
      return {
        id: 'r1', cert: 'netplus', scenario: 'Configure the router', estMinutes: 3,
        steps: [{
          id: 's1', type: 'configure', prompt: 'Set IP mode', explanation: 'e', points: 1,
          payload: { slots: [{ id: 'ip', label: 'IP Mode', options: [{ id: 'a', text: 'Static' }, { id: 'b', text: 'DHCP' }] }] },
          answer: { slots: { ip: 'a' } }
        }]
      };
    };

    // 1. Scenario without assets.reference still validates fine
    var _plain = _baseScn();
    test('reference validation: scenario without reference passes',
      simLabValidateScenario(_plain).ok === true);

    // 2. Valid network reference passes
    var _scnNet = _baseScn();
    _scnNet.assets = { reference: { kind: 'network', devices: [{ id: 'd1', label: 'PC', type: 'pc', zone: 'v10', x: 10, y: 10 }], links: [] } };
    test('reference validation: valid network reference passes',
      simLabValidateScenario(_scnNet).ok === true);

    // 3. Unknown kind rejected
    var _scnBad = _baseScn();
    _scnBad.assets = { reference: { kind: 'nope' } };
    var _badResult = simLabValidateScenario(_scnBad);
    test('reference validation: unknown reference kind rejected',
      _badResult.ok === false && _badResult.errors.some(function (e) { return /reference.*bad kind/i.test(e); }));

    // 4. Network reference without devices[] rejected
    var _scnNoDevs = _baseScn();
    _scnNoDevs.assets = { reference: { kind: 'network' } };
    var _noDevsResult = simLabValidateScenario(_scnNoDevs);
    test('reference validation: network without devices[] rejected',
      _noDevsResult.ok === false && _noDevsResult.errors.some(function (e) { return /devices/.test(e); }));

    // 5. Valid timeline reference passes
    var _scnTl = _baseScn();
    _scnTl.assets = { reference: { kind: 'timeline', stages: [{ id: 'p', icon: '!', label: 'Prep', severity: 'low' }] } };
    test('reference validation: valid timeline reference passes',
      simLabValidateScenario(_scnTl).ok === true);

    // 6. Valid layered reference passes
    var _scnLy = _baseScn();
    _scnLy.assets = { reference: { kind: 'layered', layers: [{ id: 'l1', label: 'Perimeter', state: 'ok' }], core: { label: 'Core', assets: [] } } };
    test('reference validation: valid layered reference passes',
      simLabValidateScenario(_scnLy).ok === true);

    // 6b. layout:'stacked' layered scenario validates (stacked-bands layout)
    var _scnStacked = _baseScn();
    _scnStacked.assets = { reference: { kind: 'layered', layout: 'stacked', layers: [{ id: 'l1', label: 'Perimeter', state: 'present' }], core: { label: 'Core', assets: [] } } };
    test('reference validation: layout:"stacked" layered reference passes',
      simLabValidateScenario(_scnStacked).ok === true);

    // 6c. layout:'nested' is also explicitly valid (not just absent)
    var _scnNested = _baseScn();
    _scnNested.assets = { reference: { kind: 'layered', layout: 'nested', layers: [{ id: 'l1', label: 'Perimeter', state: 'present' }], core: { label: 'Core', assets: [] } } };
    test('reference validation: layout:"nested" layered reference passes',
      simLabValidateScenario(_scnNested).ok === true);

    // 6d. Invalid layout value rejected
    var _scnBadLayout = _baseScn();
    _scnBadLayout.assets = { reference: { kind: 'layered', layout: 'sideways', layers: [{ id: 'l1', label: 'Perimeter', state: 'present' }], core: { label: 'Core', assets: [] } } };
    var _badLayoutResult = simLabValidateScenario(_scnBadLayout);
    test('reference validation: invalid layout value rejected',
      _badLayoutResult.ok === false && _badLayoutResult.errors.some(function (e) { return /layout/i.test(e); }));

    // ── Task 10: optional scenario.archetype tag ──
    // 7. Absent archetype still passes (backward compat — all existing scenarios).
    var _scnNoArch = _baseScn();
    test('archetype validation: absent archetype still passes',
      simLabValidateScenario(_scnNoArch).ok === true);

    // 8. Known archetype passes.
    var _scnGoodArch = _baseScn();
    _scnGoodArch.archetype = 'incident';
    test('archetype validation: known archetype passes',
      simLabValidateScenario(_scnGoodArch).ok === true);

    // 9. Unknown archetype rejected.
    var _scnBadArch = _baseScn();
    _scnBadArch.archetype = 'not-a-real-archetype';
    var _badArchResult = simLabValidateScenario(_scnBadArch);
    test('archetype validation: unknown archetype rejected',
      _badArchResult.ok === false && _badArchResult.errors.some(function (e) { return /archetype/i.test(e); }));

    // 10. New archetype tags ('wireless'/'firewall'/'soho') accepted; unknown still rejected.
    ['wireless', 'firewall', 'soho'].forEach(function (tag) {
      var _s = _baseScn(); _s.archetype = tag;
      test('archetype validation: archetype ' + tag + ' accepted',
        simLabValidateScenario(_s).ok === true);
    });
    var _sx = _baseScn(); _sx.archetype = 'printer';
    test('archetype validation: unknown archetype "printer" still rejected',
      simLabValidateScenario(_sx).ok === false);

    // 11. New archetype tags ('cli'/'discovery'/'triage') accepted; unknown still rejected.
    ['cli', 'discovery', 'triage'].forEach(function (tag) {
      var _s2 = _baseScn(); _s2.archetype = tag;
      test('archetype validation: archetype ' + tag + ' accepted',
        simLabValidateScenario(_s2).ok === true);
    });
    var _sx2 = _baseScn(); _sx2.archetype = 'logscan';
    test('archetype validation: unknown archetype "logscan" still rejected',
      simLabValidateScenario(_sx2).ok === false);

    // ── Wave 3 Task 1: New archetype tags ('portmap'/'wiremap'/'pcbuild'/'raid') accepted; unknown still rejected. ──
    ['portmap', 'wiremap', 'pcbuild', 'raid'].forEach(function (tag) {
      var _s3 = _baseScn(); _s3.archetype = tag;
      test('archetype validation: archetype ' + tag + ' accepted',
        simLabValidateScenario(_s3).ok === true);
    });
    var _sx3 = _baseScn(); _sx3.archetype = 'diskclinic';
    test('archetype validation: unknown archetype "diskclinic" still rejected',
      simLabValidateScenario(_sx3).ok === false);

    // ── Wave 4 Task 1: 'swatch' reference kind + archetype tag ──
    // 12. Valid swatch reference passes.
    var _scnSwatch = _baseScn();
    _scnSwatch.assets = { reference: { kind: 'swatch', title: 'Sample output', defect: 'spots' } };
    test('reference validation: valid swatch reference passes',
      simLabValidateScenario(_scnSwatch).ok === true);

    // 13. swatch reference with bad defect rejected.
    var _scnSwatchBadDefect = _baseScn();
    _scnSwatchBadDefect.assets = { reference: { kind: 'swatch', title: 'Sample output', defect: 'banding' } };
    var _swBadDefectResult = simLabValidateScenario(_scnSwatchBadDefect);
    test('reference validation: swatch bad defect rejected',
      _swBadDefectResult.ok === false && _swBadDefectResult.errors.some(function (e) { return /swatch.*defect/i.test(e); }));

    // 14. swatch reference missing title rejected.
    var _scnSwatchNoTitle = _baseScn();
    _scnSwatchNoTitle.assets = { reference: { kind: 'swatch', defect: 'spots' } };
    var _swNoTitleResult = simLabValidateScenario(_scnSwatchNoTitle);
    test('reference validation: swatch missing title rejected',
      _swNoTitleResult.ok === false && _swNoTitleResult.errors.some(function (e) { return /swatch.*title/i.test(e); }));

    // 15. swatch reference with empty caption rejected.
    var _scnSwatchEmptyCaption = _baseScn();
    _scnSwatchEmptyCaption.assets = { reference: { kind: 'swatch', title: 'Sample output', defect: 'spots', caption: '' } };
    var _swEmptyCaptionResult = simLabValidateScenario(_scnSwatchEmptyCaption);
    test('reference validation: swatch empty caption rejected',
      _swEmptyCaptionResult.ok === false && _swEmptyCaptionResult.errors.some(function (e) { return /swatch.*caption/i.test(e); }));

    // 16. New archetype tag 'swatch' accepted.
    var _scnSwatchArch = _baseScn(); _scnSwatchArch.archetype = 'swatch';
    test('archetype validation: archetype swatch accepted',
      simLabValidateScenario(_scnSwatchArch).ok === true);

    // ── Wave 2 Task 3: analyze mode step validates without payload.lines ──
    var _modeStep = { id: 'm', type: 'analyze', prompt: 'p', explanation: 'e', points: 1,
      payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' }, answer: { selected: ['l1'] } };
    var _modeScn = _baseScn(); _modeScn.steps = [_modeStep];
    _modeScn.assets = { reference: { kind: 'terminal', host: 'h', session: 's',
      excerpts: [{ id: 'e', promptLine: 'p', lines: [{ id: 'l1', text: 't', select: true, evidence: true }, { id: 'l2', text: 'u', select: false }] }] } };
    test('analyze mode step validates without payload.lines',
      simLabValidateScenario(_modeScn).ok === true);

    // ── Mount test — vm-sandbox + DOM shim ──
    var elBody            = grab('_el');
    var escBody           = grabLine('_esc');
    var slAttrBody        = grabLine('_slAttr');
    var renderCfgBody     = grab('_slRenderConfigure');
    var renderStepBody    = grab('simLabRenderStep');
    var refNetBody        = grab('_slRenderRefNetwork');
    var refTimeBody       = grab('_slRenderRefTimeline');
    var refLayBody        = grab('_slRenderRefLayered');
    var refDispBody       = grab('_slRenderReference');
    var mountBody         = grab('_slMountScenario');

    if (!elBody || !escBody || !mountBody || !refDispBody || !refNetBody) {
      test('reference mount: vm extraction succeeded', false);
      results.errors.push('could not extract _slMountScenario / reference helpers; check names/indenting');
      return;
    }

    // Minimal DOM shim (same as configure renderer test, with _children as getter
    // so it tracks the live `children` array even after innerHTML resets it)
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

    var mCtx = { document: docShim, window: windowShim, Object: Object, Array: Array, String: String };
    vm.createContext(mCtx);
    vm.runInContext(elBody, mCtx);
    vm.runInContext(escBody, mCtx);
    if (slAttrBody) vm.runInContext(slAttrBody, mCtx);
    if (renderCfgBody) vm.runInContext(renderCfgBody, mCtx);
    if (renderStepBody) vm.runInContext(renderStepBody, mCtx);
    vm.runInContext(refNetBody, mCtx);
    if (refTimeBody) vm.runInContext(refTimeBody, mCtx);
    if (refLayBody) vm.runInContext(refLayBody, mCtx);
    vm.runInContext(refDispBody, mCtx);
    vm.runInContext(mountBody, mCtx);

    // Scenario with a network reference
    var _mountScn = {
      id: 'r1', cert: 'netplus', scenario: 'Configure the router', estMinutes: 3,
      assets: { reference: { kind: 'network', devices: [{ id: 'd1', label: 'PC', type: 'pc', zone: 'v10', x: 10, y: 10 }], links: [] } },
      steps: [{
        id: 's1', type: 'configure', prompt: 'Set IP mode', explanation: 'e', points: 1,
        payload: { slots: [{ id: 'ip', label: 'IP Mode', options: [{ id: 'a', text: 'Static' }, { id: 'b', text: 'DHCP' }] }] },
        answer: { slots: { ip: 'a' } }
      }]
    };

    var host = makeEl('div');
    mCtx.host = host;
    mCtx.mountScn = _mountScn;
    mCtx.mountOpts = { onSubmit: function () {} };
    vm.runInContext('_slMountScenario(host, mountScn, mountOpts);', mCtx);

    // host._children[0] is the sl-scenario wrap div
    // wrap._children layout: [sl-scn-prose, sl-ref, ...steps, submit]
    var wrap = host._children[0];
    var refPanelFound = wrap && wrap._children.some(function (c) {
      return c && c.className === 'sl-ref';
    });
    test('reference mount: _slMountScenario renders a .sl-ref panel',
      refPanelFound === true);

    // Verify reference panel comes before first step wrap
    if (wrap) {
      var refIdx = -1, stepIdx = -1;
      wrap._children.forEach(function (c, i) {
        if (c && c.className === 'sl-ref' && refIdx === -1) refIdx = i;
        if (c && c.className === 'sl-step' && stepIdx === -1) stepIdx = i;
      });
      test('reference mount: reference panel is before first step',
        refIdx !== -1 && stepIdx !== -1 && refIdx < stepIdx);
    }

    // Scenario WITHOUT reference: must still mount fine (no regression)
    var _plainScn = {
      id: 'r2', cert: 'netplus', scenario: 'Plain scenario', estMinutes: 3,
      steps: [{
        id: 's1', type: 'configure', prompt: 'Set IP mode', explanation: 'e', points: 1,
        payload: { slots: [{ id: 'ip', label: 'IP Mode', options: [{ id: 'a', text: 'Static' }, { id: 'b', text: 'DHCP' }] }] },
        answer: { slots: { ip: 'a' } }
      }]
    };
    var host2 = makeEl('div');
    mCtx.host2 = host2;
    mCtx.plainScn = _plainScn;
    vm.runInContext('_slMountScenario(host2, plainScn, mountOpts);', mCtx);
    var wrap2 = host2._children[0];
    var hasNoRefPanel = wrap2 && !wrap2._children.some(function (c) { return c && c.className === 'sl-ref'; });
    test('reference mount: scenario without reference has no .sl-ref panel',
      hasNoRefPanel === true);

  } catch (err) {
    test('reference asset model: vm smoke test (threw)', false);
    results.errors.push('reference asset model smoke test threw: ' + err.message);
  }
})();

(function () {
  var grab = function (name) { return _fnBody(js, name); };
  var grabLine = function (name) {
    var re = new RegExp('function ' + name + '\\([^\\n]*\\)\\s*\\{[^\\n]*\\}');
    return (js.match(re) || [''])[0];
  };
  var elBody       = grab('_el');
  var escBody      = grabLine('_esc');
  var termLineBody = grab('_termLineHtml');
  var termPmtBody  = grab('_termPromptHtml');
  var termBody     = grab('_slRenderRefTerminal');
  var dispBody     = grab('_slRenderReference');
  if (!termBody || !dispBody) { results.errors.push('could not extract _slRenderRefTerminal/_slRenderReference'); return; }

  var htmlEsc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  var makeEl = function (tag) {
    var attrs = {}, listeners = {}, children = [], cls = '', inner = '';
    var clsSet = {};
    var el = {
      tagName: tag.toUpperCase(),
      get className() { return cls; }, set className(v) { cls = v; },
      get innerHTML() { return inner; }, set innerHTML(v) { inner = v; children = []; },
      get textContent() { return ''; }, set textContent(v) { inner = htmlEsc(v); },
      style: {},
      get _children() { return children; },
      classList: {
        add: function (c) { clsSet[c] = true; cls = (cls ? cls + ' ' : '') + c; },
        remove: function (c) { delete clsSet[c]; },
        toggle: function (c, on) { if (on) clsSet[c] = true; else delete clsSet[c]; },
        contains: function (c) { return !!clsSet[c]; }
      },
      setAttribute: function (k, v) { attrs[k] = v; },
      getAttribute: function (k) { return (k in attrs) ? attrs[k] : null; },
      removeAttribute: function (k) { delete attrs[k]; },
      appendChild: function (c) { children.push(c); return c; },
      insertBefore: function (c) { children.unshift(c); return c; },
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
      _fire: function (ev) { (listeners[ev] || []).forEach(function (fn) { fn({}); }); }
    };
    return el;
  };
  var mCtx = { document: { createElement: makeEl },
    window: { matchMedia: function () { return { matches: false }; } },
    Object: Object, Array: Array, String: String };
  vm.createContext(mCtx);
  vm.runInContext(elBody + '\n' + escBody + '\n' + termLineBody + '\n' + termPmtBody + '\n' + termBody + '\n' + dispBody, mCtx);

  var ref = { kind: 'terminal', host: 'WS-14 · admin', session: 'read-only', reveal: 'external',
    excerpts: [
      { id: 'a', promptLine: 'C:\\> ipconfig', reveal: 'a', necessary: true,
        lines: [ { id: 'l1', text: '169.254.1.1 <script>x</script>', highlight: 'hot', select: true, evidence: true },
                 { id: 'l2', text: 'Media connected', select: false, ctx: true } ] },
      { id: 'b', promptLine: 'C:\\> ping 1.1.1.1', reveal: 'b',
        lines: [ { id: 'l3', text: 'timeout', select: true, evidence: false } ] }
    ] };
  mCtx.ref = ref;
  vm.runInContext('globalThis.__panel = _slRenderReference(ref);', mCtx);
  var panel = mCtx.__panel;

  test('terminal: _slRenderReference returns a .sl-ref panel for kind terminal',
    !!panel && panel.className === 'sl-ref');
  var termNode = panel._children.filter(function (c) { return c.className && c.className.split(' ').indexOf('term') !== -1; })[0];
  test('terminal: panel contains a .term component', !!termNode);
  var lineBtns = panel.querySelectorAll('button');
  var termLines = lineBtns.filter(function (b) { return b.className && b.className.split(' ').indexOf('term-line') !== -1; });
  test('terminal: select:true lines render as focusable BUTTONs with data-line',
    termLines.length === 2 && termLines[0].getAttribute('data-line') === 'l1');
  var l1html = termLines[0].innerHTML;
  test('terminal: line text is ESCAPED (no raw <script>)', l1html.indexOf('<script>') === -1 && l1html.indexOf('&lt;script&gt;') !== -1);
  test('terminal: highlight wraps the ESCAPED text in a .hot span', l1html.indexOf('class="hot"') !== -1);
  var scrolls = panel.querySelectorAll('.term-scroll');
  test('terminal: each excerpt body is inside a .term-scroll container', scrolls.length === 2);
  // external reveal: keyed excerpts start hidden; revealExcerpt unhides
  var blocks = panel.querySelectorAll('.term-block');
  test('terminal: external-mode keyed excerpts start [hidden]',
    blocks.length === 2 && blocks[0].getAttribute('hidden') !== null && blocks[1].getAttribute('hidden') !== null);
  panel.revealExcerpt('a');
  test('terminal: revealExcerpt(key) unhides its excerpt block',
    blocks[0].getAttribute('hidden') === null && blocks[1].getAttribute('hidden') !== null);
  test('terminal: revealExcerpt is also published on window.__slRevealExcerpt',
    typeof mCtx.window.__slRevealExcerpt === 'function');
})();

// ── Wave 3 Task 2: faceplate reference renderer + facePorts analyze mode ──
(function () {
  var grab = function (name) { return _fnBody(js, name); };
  var grabLine = function (name) {
    var re = new RegExp('function ' + name + '\\([^\\n]*\\)\\s*\\{[^\\n]*\\}');
    return (js.match(re) || [''])[0];
  };
  var elBody = grab('_el'), escBody = grabLine('_esc');
  var fpBody = grab('_slRenderRefFaceplate'), dispBody = grab('_slRenderReference');
  if (!fpBody || !dispBody) { results.errors.push('could not extract _slRenderRefFaceplate/_slRenderReference'); return; }

  var htmlEsc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  var makeEl = function (tag) {
    var attrs = {}, listeners = {}, children = [], cls = '', inner = '';
    var clsSet = {};
    var el = {
      tagName: tag.toUpperCase(),
      get className() { return cls; }, set className(v) { cls = v; },
      get innerHTML() { return inner; }, set innerHTML(v) { inner = v; children = []; },
      get textContent() { return ''; }, set textContent(v) { inner = htmlEsc(v); },
      style: {},
      get _children() { return children; },
      classList: {
        add: function (c) { clsSet[c] = true; cls = (cls ? cls + ' ' : '') + c; },
        remove: function (c) { delete clsSet[c]; },
        toggle: function (c, on) { if (on) clsSet[c] = true; else delete clsSet[c]; },
        contains: function (c) { return !!clsSet[c]; }
      },
      setAttribute: function (k, v) { attrs[k] = v; },
      getAttribute: function (k) { return (k in attrs) ? attrs[k] : null; },
      removeAttribute: function (k) { delete attrs[k]; },
      appendChild: function (c) { children.push(c); return c; },
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
      _fire: function (ev) { (listeners[ev] || []).forEach(function (fn) { fn({}); }); }
    };
    return el;
  };
  var mCtx = { document: { createElement: makeEl }, Object: Object, Array: Array, String: String };
  vm.createContext(mCtx);
  vm.runInContext(elBody + '\n' + escBody + '\n' + fpBody + '\n' + dispBody, mCtx);

  var ref = { kind: 'faceplate', host: 'SW-1 · 8-port', ports: [
    { id: 'gi0-1', label: 'Gi0/1', led: 'up', select: true },
    { id: 'gi0-2', label: 'Gi0/2 <script>x</script>', led: 'poe-fault', select: true },
    { id: 'gi0-3', label: 'Gi0/3', led: 'down', select: false }
  ] };
  mCtx.ref = ref;
  vm.runInContext('globalThis.__panel = _slRenderReference(ref);', mCtx);
  var panel = mCtx.__panel;

  test('faceplate: _slRenderReference returns a .sl-ref panel for kind faceplate', !!panel && panel.className === 'sl-ref');
  var btns = panel.querySelectorAll('button');
  var portBtns = btns.filter(function (b) { return b.className && b.className.indexOf('port') !== -1; });
  test('faceplate: select:true ports render as focusable BUTTONs with data-port',
    portBtns.length === 2 && portBtns[0].getAttribute('data-port') === 'gi0-1');
  test('faceplate: fault-LED port carries a fault class', portBtns[1].className.indexOf('poe-fault') !== -1);
  // VISIBLE content is the short port NUMBER only (extracted from id, e.g. 'gi0-2' -> '2') —
  // the full descriptive label never reaches innerHTML, so it can't overflow the fixed
  // 40x52 .port box. The full label instead lives in aria-label (screen readers) and
  // title (mouse hover tooltip).
  test('faceplate: visible port innerHTML is the SHORT number extracted from id, not the full label',
    portBtns[0].innerHTML === '1' && portBtns[1].innerHTML === '2');
  test('faceplate: port label is ESCAPED (no raw <script> reaches visible innerHTML, even via a malicious label)',
    portBtns[1].innerHTML.indexOf('<script>') === -1 && portBtns[1].innerHTML.indexOf('script') === -1);
  test('faceplate: full descriptive label lives in aria-label for screen-reader users',
    portBtns[1].getAttribute('aria-label').indexOf('Gi0/2 <script>x</script>') !== -1);
  test('faceplate: full descriptive label ALSO lives in title for mouse-hover tooltip',
    portBtns[0].getAttribute('title') === 'Gi0/1' && portBtns[1].getAttribute('title') === 'Gi0/2 <script>x</script>');
  var inertEls = panel.querySelectorAll('div').filter(function (d) { return d.getAttribute('aria-hidden') === 'true'; });
  test('faceplate: select:false ports render as inert aria-hidden divs, not buttons', inertEls.length === 1);
  test('faceplate: inert (select:false) ports also show the short number, not the full label',
    inertEls.length === 1 && inertEls[0].innerHTML === '3');
})();

// ── Wave 3 Task 3: wiremap reference renderer + wiremapPins analyze mode ──
(function () {
  var grab = function (name) { return _fnBody(js, name); };
  var grabLine = function (name) {
    var re = new RegExp('function ' + name + '\\([^\\n]*\\)\\s*\\{[^\\n]*\\}');
    return (js.match(re) || [''])[0];
  };
  var elBody = grab('_el'), escBody = grabLine('_esc');
  var wmBody = grab('_slRenderRefWiremap'), dispBody = grab('_slRenderReference');
  if (!wmBody || !dispBody) { results.errors.push('could not extract _slRenderRefWiremap/_slRenderReference'); return; }

  var htmlEsc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  var makeEl = function (tag) {
    var attrs = {}, listeners = {}, children = [], cls = '', inner = '';
    var clsSet = {};
    var el = {
      tagName: tag.toUpperCase(),
      get className() { return cls; }, set className(v) { cls = v; },
      get innerHTML() { return inner; }, set innerHTML(v) { inner = v; children = []; },
      get textContent() { return ''; }, set textContent(v) { inner = htmlEsc(v); },
      style: {},
      get _children() { return children; },
      classList: {
        add: function (c) { clsSet[c] = true; cls = (cls ? cls + ' ' : '') + c; },
        remove: function (c) { delete clsSet[c]; },
        toggle: function (c, on) { if (on) clsSet[c] = true; else delete clsSet[c]; },
        contains: function (c) { return !!clsSet[c]; }
      },
      setAttribute: function (k, v) { attrs[k] = v; },
      getAttribute: function (k) { return (k in attrs) ? attrs[k] : null; },
      removeAttribute: function (k) { delete attrs[k]; },
      appendChild: function (c) { children.push(c); return c; },
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
      _fire: function (ev) { (listeners[ev] || []).forEach(function (fn) { fn({}); }); }
    };
    return el;
  };
  var mCtx = { document: { createElement: makeEl }, Object: Object, Array: Array, String: String };
  vm.createContext(mCtx);
  vm.runInContext(elBody + '\n' + escBody + '\n' + wmBody + '\n' + dispBody, mCtx);

  var ref = { kind: 'wiremap', pins: [
    { pin: 1, pairId: 2, endBPin: 1, select: true },
    { pin: 2, pairId: 2, endBPin: 3, select: true },
    { pin: 3, pairId: 3, endBPin: 2, select: true },
    { pin: 4, pairId: 1, endBPin: 4, select: true },
    { pin: 5, pairId: 1, endBPin: 5, select: true },
    { pin: 6, pairId: 3, endBPin: 6, select: true },
    { pin: 7, pairId: 4, endBPin: null, select: true },
    { pin: 8, pairId: 4, endBPin: 8, select: true }
  ] };
  mCtx.ref = ref;
  vm.runInContext('globalThis.__panel = _slRenderReference(ref);', mCtx);
  var panel = mCtx.__panel;

  test('wiremap: _slRenderReference returns a .sl-ref panel for kind wiremap', !!panel && panel.className === 'sl-ref');
  var pinBtns = panel.querySelectorAll('button').filter(function (b) { return b.className && b.className.indexOf('wm-pin') !== -1; });
  test('wiremap: all 8 End-A pins render as focusable BUTTONs with data-pin',
    pinBtns.length === 8 && pinBtns[0].getAttribute('data-pin') === '1');
  test('wiremap: each selectable pin carries its real pairId as a class',
    pinBtns[1].className.indexOf('wm-pair-2') !== -1);
  test('wiremap: the open pin (pin 7) is distinguishable in its End-B rendering',
    panel.querySelectorAll('.wm-endb')[6].innerHTML.toLowerCase().indexOf('open') !== -1);
})();

// ── Wave 3 Task 4: slots reference renderer (static/illustrative, zero interaction) ──
(function () {
  var vm = require('vm');
  var grab = function (name) { return _fnBody(js, name); };
  var grabLine = function (name) {
    var re = new RegExp('function ' + name + '\\([^\\n]*\\)\\s*\\{[^\\n]*\\}');
    return (js.match(re) || [''])[0];
  };
  var elBody = grab('_el'), escBody = grabLine('_esc');
  var slBody = grab('_slRenderRefSlots'), dispBody = grab('_slRenderReference');
  if (!slBody || !dispBody) { results.errors.push('could not extract _slRenderRefSlots/_slRenderReference'); return; }

  var htmlEsc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  var makeEl = function (tag) {
    var attrs = {}, listeners = {}, children = [], cls = '', inner = '';
    var clsSet = {};
    var el = {
      tagName: tag.toUpperCase(),
      get className() { return cls; }, set className(v) { cls = v; },
      get innerHTML() { return inner; }, set innerHTML(v) { inner = v; children = []; },
      get textContent() { return ''; }, set textContent(v) { inner = htmlEsc(v); },
      style: {},
      get _children() { return children; },
      classList: {
        add: function (c) { clsSet[c] = true; cls = (cls ? cls + ' ' : '') + c; },
        remove: function (c) { delete clsSet[c]; },
        toggle: function (c, on) { if (on) clsSet[c] = true; else delete clsSet[c]; },
        contains: function (c) { return !!clsSet[c]; }
      },
      setAttribute: function (k, v) { attrs[k] = v; },
      getAttribute: function (k) { return (k in attrs) ? attrs[k] : null; },
      removeAttribute: function (k) { delete attrs[k]; },
      appendChild: function (c) { children.push(c); return c; },
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
      _fire: function (ev) { (listeners[ev] || []).forEach(function (fn) { fn({}); }); }
    };
    return el;
  };
  var mCtx = { document: { createElement: makeEl }, Object: Object, Array: Array, String: String };
  vm.createContext(mCtx);
  vm.runInContext(elBody + '\n' + escBody + '\n' + slBody + '\n' + dispBody, mCtx);

  var ref = { kind: 'slots',
    bays: [ { id: 'cpu', label: 'CPU socket' }, { id: 'gpu', label: 'GPU bay <script>x</script>' } ],
    notes: [ 'Budget: $700' ] };
  mCtx.ref = ref;
  vm.runInContext('globalThis.__panel = _slRenderReference(ref);', mCtx);
  var panel = mCtx.__panel;

  test('slots: _slRenderReference returns a .sl-ref panel for kind slots', !!panel && panel.className === 'sl-ref');
  test('slots: panel contains ZERO buttons (deliberately non-interactive)', panel.querySelectorAll('button').length === 0);
  var bayLabels = panel.querySelectorAll('.slot-bay-label');
  test('slots: renders one label per bay', bayLabels.length === 2);
  test('slots: bay label text is ESCAPED (no raw <script>)',
    bayLabels[1].innerHTML.indexOf('<script>') === -1 && bayLabels[1].innerHTML.indexOf('&lt;script&gt;') !== -1);
  var notes = panel.querySelectorAll('.slot-note');
  test('slots: renders constraint-note chips', notes.length === 1 && notes[0].innerHTML.indexOf('$700') !== -1);
})();

