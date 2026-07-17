// tests/uat/230-pbq-vertical-slice-wave1-2.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Wave 1 (wireless/firewall/soho) and Wave 2 (cli/discovery/triage) archetype vertical-slice mount+score tests

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── Task 9 (Sim Lab PBQ Wave 1 plan): archetype vertical-slice mount+score ──
// Proves the three NEW archetypes (wireless, firewall, soho) actually render
// and score through the REAL Practice mount path with ZERO new renderers —
// same _slMountScenario / simLabScoreScenario vm-sandbox + DOM-shim pattern
// as the Task 11 diagram vertical slice above (grab() extraction + guard
// clauses), but driven against the REAL shipped bank scenarios (np-wifi-01,
// np-fw-01, a1-soho-01) resolved from the actual vm-eval'd banks — not a
// hand-authored fixture. This exercises the real gated content end to end.
(function () {
  console.log('\n\x1b[1m── Sim Lab: Wave 1 archetype vertical slices (Task 9) ──\x1b[0m');
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

    // ── Extract the SAME render + score helpers as the Task 11 e2e block,
    // PLUS _slRenderAnalyze / _slRenderOrder — wireless/firewall use 'analyze'
    // and 'order' steps that the Task 11 diagram fixture didn't exercise.
    // No new renderer: these are the same functions simLabRenderStep already
    // dispatches to for every archetype. ──
    var elBody         = grab('_el');
    var escBody        = grabLine('_esc');
    var slAttrBody     = grabLine('_slAttr');
    var renderCfgBody     = grab('_slRenderConfigure');
    var renderOrderBody   = grab('_slRenderOrder');
    var renderAnalyzeBody = grab('_slRenderAnalyze');
    var renderStepBody = grab('simLabRenderStep');
    var refNetBody     = grab('_slRenderRefNetwork');
    var refTimeBody    = grab('_slRenderRefTimeline');
    var refLayBody     = grab('_slRenderRefLayered');
    var refDispBody    = grab('_slRenderReference');
    var mountBody      = grab('_slMountScenario');
    var scoreSlotsBody    = grab('_scoreConfigureSlots');
    var scoreStepBody     = grab('_scoreStep');
    var scoreScenarioBody = grab('simLabScoreScenario');
    var normBody           = grab('_norm');
    var normalizeMatchBody = grab('_simLabNormalizeMatch');
    var arrEqBody          = grab('_arrEq');
    var setEqBody          = grab('_setEq');

    if (!elBody || !escBody || !mountBody || !refDispBody || !refNetBody ||
        !renderCfgBody || !renderOrderBody || !renderAnalyzeBody || !renderStepBody ||
        !scoreScenarioBody || !scoreSlotsBody || !scoreStepBody) {
      test('Task 9: mount/score vm extraction succeeded', false);
      results.errors.push('could not extract _slMountScenario/render/score helpers for Task 9 archetype vertical slices; check names/indenting');
      return;
    }

    // ── Load the REAL seed banks (same vm-eval approach as the Task 12 bank
    // test) — resolve the target scenarios from the ACTUAL shipped content,
    // never a hand-typed literal. ──
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

    test('Task 9: both real seed banks loaded as arrays',
      Array.isArray(netplusBank) && Array.isArray(aplusCore1Bank));
    if (!Array.isArray(netplusBank) || !Array.isArray(aplusCore1Bank)) {
      results.errors.push('Task 9: could not load real seed banks (SIM_LAB_SEED_NETPLUS / SIM_LAB_SEED_APLUS_CORE1)');
      return;
    }

    var wirelessScn = netplusBank.filter(function (s) { return s && s.archetype === 'wireless'; })[0];
    var firewallScn = netplusBank.filter(function (s) { return s && s.archetype === 'firewall'; })[0];
    var sohoScn      = aplusCore1Bank.filter(function (s) { return s && s.archetype === 'soho'; })[0];

    test('Task 9: first wireless-archetype scenario resolved from the real bank (np-wifi-01)',
      wirelessScn && wirelessScn.id === 'np-wifi-01');
    test('Task 9: first firewall-archetype scenario resolved from the real bank (np-fw-01)',
      firewallScn && firewallScn.id === 'np-fw-01');
    test('Task 9: first soho-archetype scenario resolved from the real bank (a1-soho-01)',
      sohoScn && sohoScn.id === 'a1-soho-01');

    if (!wirelessScn || !firewallScn || !sohoScn) {
      results.errors.push('Task 9: could not resolve one or more archetype scenarios from the real banks; check archetype tagging');
      return;
    }

    // ── Same DOM shim as Task 11, PLUS: a `children` getter (the analyze
    // renderer's click handler walks `block.children` — real DOM property
    // name — to repaint `.sl-sel`; Task 11's fixture never drove an analyze
    // step so this was never needed) and a no-op `classList` (the same
    // handler calls `.classList.toggle('sl-sel', …)` purely for visual
    // state; scoring only reads the onChange-captured `selected` array,
    // asserted independently below, so a no-op is sufficient and doesn't
    // change what's being proven). ──
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
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
        get _children() { return children; },
        get children() { return children; },
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
    vm.runInContext(renderOrderBody, mCtx);
    vm.runInContext(renderAnalyzeBody, mCtx);
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

    // ── Shared drive helpers (generalise the Task 11 select-driving pattern
    // across step types, scoped PER STEP so same-named slots in different
    // configure steps — e.g. firewall's two rule-builder steps both using
    // {action,src,svc} — don't collide). ──
    function stepWraps(wrap) {
      return (wrap ? wrap._children : []).filter(function (c) { return c && c.className === 'sl-step'; });
    }
    // Drive every configure step to its keyed-correct slots, except
    // wrongSlot { stepIndex, slotId } (optional) which is driven to any
    // OTHER option — the negative control.
    function driveConfigureCorrectly(wrap, scn, wrongSlot) {
      var wraps = stepWraps(wrap);
      scn.steps.forEach(function (st, i) {
        if (st.type !== 'configure') return;
        var selects = wraps[i].querySelectorAll('select');
        selects.forEach(function (sel) {
          var slotId = sel.getAttribute('data-slot');
          var correctVal = st.answer.slots[slotId];
          var val = correctVal;
          if (wrongSlot && wrongSlot.stepIndex === i && wrongSlot.slotId === slotId) {
            var slotDef = st.payload.slots.filter(function (s) { return s.id === slotId; })[0];
            var wrongOpt = slotDef.options.filter(function (o) { return o.id !== correctVal; })[0];
            val = wrongOpt.id;
          }
          sel.value = val;
          sel.dispatchEvent({ type: 'change' });
        });
      });
    }
    // Drive every analyze step to its keyed-correct "select all that apply" set.
    function driveAnalyzeCorrectly(wrap, scn) {
      var wraps = stepWraps(wrap);
      scn.steps.forEach(function (st, i) {
        if (st.type !== 'analyze') return;
        var analyzeRoot = wraps[i]._children[1];
        var block = analyzeRoot && analyzeRoot._children[1];
        if (!block) return;
        block._children.forEach(function (row) {
          if (st.answer.selected.indexOf(row.getAttribute('data-line')) !== -1) {
            row.dispatchEvent({ type: 'click' });
          }
        });
      });
    }
    // Drive every order step to its keyed-correct order via the renderer's
    // documented test hook (`root.__moveTo`) — the only programmatic handle
    // exposed for the row-nudge reorder UI a real user drives by clicking.
    function driveOrderCorrectly(wrap, scn) {
      var wraps = stepWraps(wrap);
      scn.steps.forEach(function (st, i) {
        if (st.type !== 'order') return;
        var orderRoot = wraps[i]._children[1];
        if (!orderRoot || typeof orderRoot.__moveTo !== 'function') return;
        st.answer.correctOrder.forEach(function (itemId, idx) { orderRoot.__moveTo(itemId, idx); });
      });
    }
    function driveAllCorrectly(wrap, scn, wrongSlot) {
      driveConfigureCorrectly(wrap, scn, wrongSlot);
      driveAnalyzeCorrectly(wrap, scn);
      driveOrderCorrectly(wrap, scn);
    }
    function firstConfigureStepIndex(scn) {
      for (var i = 0; i < scn.steps.length; i++) { if (scn.steps[i].type === 'configure') return i; }
      return -1;
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
    function expectedSelectCount(scn) {
      return scn.steps.filter(function (s) { return s.type === 'configure'; })
        .reduce(function (sum, s) { return sum + s.payload.slots.length; }, 0);
    }

    // ── Wireless (np-wifi-01): 'analyze' select-all step + 'configure' step
    // (apId-scoped band/channel/security/ssid slots). ──
    var wMount = mountOnly(wirelessScn);
    test('Task 9 wireless: mounted DOM contains the configure <select> elements for every configure-step slot',
      (wMount.wrap.querySelectorAll('select') || []).length === expectedSelectCount(wirelessScn));
    driveAllCorrectly(wMount.wrap, wirelessScn);
    submitActive();
    var wResult = wMount.getResult();
    test('Task 9 wireless: simLabScoreScenario reports correct === total after every keyed-correct answer',
      wResult && wResult.total > 0 && wResult.correct === wResult.total);

    var wirelessClone = JSON.parse(JSON.stringify(wirelessScn));
    var wCfgIdx = firstConfigureStepIndex(wirelessClone);
    var wMount2 = mountOnly(wirelessClone);
    driveAllCorrectly(wMount2.wrap, wirelessClone,
      { stepIndex: wCfgIdx, slotId: wirelessClone.steps[wCfgIdx].payload.slots[0].id });
    submitActive();
    var wResult2 = wMount2.getResult();
    test('Task 9 wireless negative control: one wrong configure slot (runtime clone+mutation of the real scenario) scores correct < total',
      wResult2 && wResult2.correct < wResult2.total);

    // ── Firewall (np-fw-01): configure×2 (rule builders) + 'order' step
    // (first-match-wins table) + 'analyze' select-all step. ──
    var fMount = mountOnly(firewallScn);
    test('Task 9 firewall: mounted DOM contains the configure <select> elements for every configure-step slot',
      (fMount.wrap.querySelectorAll('select') || []).length === expectedSelectCount(firewallScn));

    var fOrderStepIdx = -1;
    firewallScn.steps.forEach(function (st, i) { if (st.type === 'order') fOrderStepIdx = i; });
    var fOrderWraps = stepWraps(fMount.wrap);
    var fOrderRoot = fOrderStepIdx !== -1 ? fOrderWraps[fOrderStepIdx]._children[1] : null;
    var fOrderList = fOrderRoot && fOrderRoot._children[1];
    var fRenderedItemIds = (fOrderList ? fOrderList._children : []).map(function (row) { return row.getAttribute('data-item'); });
    var fExpectedItemIds = fOrderStepIdx !== -1 ? firewallScn.steps[fOrderStepIdx].payload.items.map(function (it) { return it.id; }) : [];
    test('Task 9 firewall: mounted DOM contains the order step\'s rendered items (one row per payload item, matching ids)',
      fOrderStepIdx !== -1 && fRenderedItemIds.length === fExpectedItemIds.length &&
      fExpectedItemIds.every(function (id) { return fRenderedItemIds.indexOf(id) !== -1; }));

    driveAllCorrectly(fMount.wrap, firewallScn);
    submitActive();
    var fResult = fMount.getResult();
    test('Task 9 firewall: simLabScoreScenario reports correct === total after every keyed-correct answer (configure×2 + order + analyze)',
      fResult && fResult.total > 0 && fResult.correct === fResult.total);

    var firewallClone = JSON.parse(JSON.stringify(firewallScn));
    var fCfgIdx = firstConfigureStepIndex(firewallClone);
    var fMount2 = mountOnly(firewallClone);
    driveAllCorrectly(fMount2.wrap, firewallClone,
      { stepIndex: fCfgIdx, slotId: firewallClone.steps[fCfgIdx].payload.slots[0].id });
    submitActive();
    var fResult2 = fMount2.getResult();
    test('Task 9 firewall negative control: one wrong rule-tuple slot (runtime clone+mutation of the real scenario) scores correct < total',
      fResult2 && fResult2.correct < fResult2.total);

    // ── SOHO (a1-soho-01): configure×2 (wireless/guest section + DHCP pool +
    // port-forward). No order/analyze steps — pure configure archetype. ──
    var sMount = mountOnly(sohoScn);
    test('Task 9 soho: mounted DOM contains the configure <select> elements for every configure-step slot',
      (sMount.wrap.querySelectorAll('select') || []).length === expectedSelectCount(sohoScn));
    driveAllCorrectly(sMount.wrap, sohoScn);
    submitActive();
    var sResult = sMount.getResult();
    test('Task 9 soho: simLabScoreScenario reports correct === total after every keyed-correct answer',
      sResult && sResult.total > 0 && sResult.correct === sResult.total);

    var sohoClone = JSON.parse(JSON.stringify(sohoScn));
    var sCfgIdx = firstConfigureStepIndex(sohoClone);
    var sMount2 = mountOnly(sohoClone);
    driveAllCorrectly(sMount2.wrap, sohoClone,
      { stepIndex: sCfgIdx, slotId: sohoClone.steps[sCfgIdx].payload.slots[0].id });
    submitActive();
    var sResult2 = sMount2.getResult();
    test('Task 9 soho negative control: one wrong DHCP/SSID slot (runtime clone+mutation of the real scenario) scores correct < total',
      sResult2 && sResult2.correct < sResult2.total);

  } catch (err) {
    test('Task 9: archetype vertical-slice smoke test (threw)', false);
    results.errors.push('Task 9 archetype vertical-slice smoke test threw: ' + err.message);
  }
})();

// ── Wave 2 Task 11: archetype vertical-slice mount + score, through the REAL
// terminal-reference + guarded-analyze-mode Practice path ──
// Proves the three NEW Wave 2 archetypes (cli, discovery, triage) actually
// mount and score through _slMountScenario end to end — including the
// terminal reference renderer (Wave 2 Task 2), the reveal-mode command menu
// and excerptLines mode (Wave 2 Task 3's guarded analyze extension), and
// lenient evidence scoring — against the REAL shipped bank scenarios, not a
// hand-authored fixture. Mirrors the Task 9 (Wave 1) vertical-slice pattern
// (grab() extraction + guard clauses), but the DOM shim additionally needs
// the Task 2 terminal-renderer shim's stateful classList/removeAttribute/
// _fire (Task 9's shim never exercised a terminal ref so it lacked both —
// revealExcerpt calls block.removeAttribute('hidden')).
(function () {
  console.log('\n\x1b[1m── Sim Lab: Wave 2 archetype vertical slices — cli/discovery/triage (Task 11) ──\x1b[0m');
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
    var termLineBody          = grab('_termLineHtml');
    var termPmtBody           = grab('_termPromptHtml');
    var refTermBody           = grab('_slRenderRefTerminal');
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

    if (!elBody || !escBody || !mountBody || !refDispBody || !refTermBody ||
        !renderCfgBody || !renderAnalyzeBody || !renderAnalyzeModeBody || !renderStepBody ||
        !scoreScenarioBody || !scoreSlotsBody || !scoreStepBody || !scoreAnalyzeLenientBody ||
        !termLineBody || !termPmtBody) {
      test('Task 11 (Wave 2): mount/score vm extraction succeeded', false);
      results.errors.push('could not extract _slMountScenario/render/score/terminal helpers for Wave 2 Task 11 archetype vertical slices; check names/indenting');
      return;
    }

    // ── Load the REAL seed banks (same vm-eval approach as the Task 9/10
    // Wave 2 bank tests) — resolve the target scenarios from the ACTUAL
    // shipped content, never a hand-typed literal. ──
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

    test('Task 11 (Wave 2): both real seed banks loaded as arrays',
      Array.isArray(netplusBank) && Array.isArray(aplusCore1Bank));
    if (!Array.isArray(netplusBank) || !Array.isArray(aplusCore1Bank)) {
      results.errors.push('Task 11 (Wave 2): could not load real seed banks (SIM_LAB_SEED_NETPLUS / SIM_LAB_SEED_APLUS_CORE1)');
      return;
    }

    var cliScn       = netplusBank.filter(function (s) { return s && s.archetype === 'cli'; })[0];
    var discoveryScn = netplusBank.filter(function (s) { return s && s.archetype === 'discovery'; })[0];
    var triageScn    = aplusCore1Bank.filter(function (s) { return s && s.archetype === 'triage'; })[0];

    test('Task 11 (Wave 2): first cli-archetype scenario resolved from the real bank (np-cli-01)',
      cliScn && cliScn.id === 'np-cli-01');
    test('Task 11 (Wave 2): first discovery-archetype scenario resolved from the real bank (np-disc-01)',
      discoveryScn && discoveryScn.id === 'np-disc-01');
    test('Task 11 (Wave 2): first triage-archetype scenario resolved from the real bank (a1-cot-01)',
      triageScn && triageScn.id === 'a1-cot-01');

    if (!cliScn || !discoveryScn || !triageScn) {
      results.errors.push('Task 11 (Wave 2): could not resolve one or more archetype scenarios from the real banks; check archetype tagging');
      return;
    }

    // ── DOM shim: the Task 9 select/change-driving surface merged with the
    // Task 2 terminal-renderer shim's stateful classList + removeAttribute +
    // _fire. ──
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
    vm.runInContext(termLineBody, mCtx);
    vm.runInContext(termPmtBody, mCtx);
    vm.runInContext(refTermBody, mCtx);
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

    function stepWraps(wrap) {
      return (wrap ? wrap._children : []).filter(function (c) { return c && c.className === 'sl-step'; });
    }
    function firstConfigureStepIndex(scn) {
      for (var i = 0; i < scn.steps.length; i++) { if (scn.steps[i].type === 'configure') return i; }
      return -1;
    }
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
    // wrongSlot { stepIndex, slotId } (optional) which is driven to any
    // OTHER option — the negative control.
    function driveConfigureCorrectly(wrap, scn, wrongSlot) {
      var wraps = stepWraps(wrap);
      scn.steps.forEach(function (st, i) {
        if (st.type !== 'configure') return;
        var selects = wraps[i].querySelectorAll('select');
        selects.forEach(function (sel) {
          var slotId = sel.getAttribute('data-slot');
          var correctVal = st.answer.slots[slotId];
          var v = correctVal;
          if (wrongSlot && wrongSlot.stepIndex === i && wrongSlot.slotId === slotId) {
            var slotDef = st.payload.slots.filter(function (s) { return s.id === slotId; })[0];
            var wrongOpt = slotDef.options.filter(function (o) { return o.id !== correctVal; })[0];
            v = wrongOpt.id;
          }
          sel.value = v;
          sel.dispatchEvent({ type: 'change' });
        });
      });
    }

    // Drive every guarded analyze-mode step ('reveal' or 'excerptLines') to
    // its keyed-correct picks, through the REAL DOM interaction each mode
    // exposes: 'reveal' clicks the .sl-cmd command-menu buttons (which is
    // what actually invokes window.__slRevealExcerpt + unhides the target
    // excerpt block); 'excerptLines' clicks the terminal's own rendered
    // .term-line buttons. extraFalsePickByStepId (optional, per stepId)
    // adds one extra line click on top of the keyed-correct set — the
    // lenient-scoring leniency contract under test.
    function driveAnalyzeModeCorrectly(wrap, scn, extraFalsePickByStepId) {
      scn.steps.forEach(function (st) {
        if (st.type !== 'analyze') return;
        var mode = st.payload && st.payload.mode;
        if (mode !== 'reveal' && mode !== 'excerptLines') return;
        var selector = (mode === 'reveal') ? '.sl-cmd' : '.term-line';
        var attr = (mode === 'reveal') ? 'data-cmd' : 'data-line';
        var btns = wrap.querySelectorAll(selector);
        var toClick = st.answer.selected.slice();
        if (extraFalsePickByStepId && extraFalsePickByStepId[st.id]) {
          toClick = toClick.concat([extraFalsePickByStepId[st.id]]);
        }
        toClick.forEach(function (id) {
          var btn = btns.filter(function (b) { return b.getAttribute(attr) === id; })[0];
          if (btn) btn._fire('click');
        });
      });
    }

    // Find a real FALSE-evidence line id for an excerptLines analyze step
    // (a select:true line NOT in answer.selected, i.e. keyed `evidence:
    // false`) so the leniency negative pick exercises a genuine keyed line,
    // not a synthetic id.
    function findFalseEvidenceLine(scn, stepId) {
      var st = scn.steps.filter(function (s) { return s.id === stepId; })[0];
      var ref = scn.assets && scn.assets.reference;
      if (!st || !ref || !Array.isArray(ref.excerpts)) return null;
      var falseLine = null;
      ref.excerpts.forEach(function (ex) {
        (ex.lines || []).forEach(function (ln) {
          if (falseLine) return;
          if (ln.select && st.answer.selected.indexOf(ln.id) === -1) falseLine = ln.id;
        });
      });
      return falseLine;
    }

    // ── CLI (np-cli-01): terminal ref (external reveal) + mode:'reveal'
    // LENIENT analyze step + configure step. ──
    var cMount = mountOnly(cliScn);
    var cWrap = cMount.wrap;
    test('Task 11 (Wave 2) cli: mounted DOM contains a .term terminal component and every configure <select>',
      !!cWrap.querySelector('.term') && cWrap.querySelectorAll('select').length === expectedSelectCount(cliScn));

    // (b) CLI reveal path — fire ONE real .sl-cmd button click and prove the
    // reveal wiring actually ran end to end: window.__slRevealExcerpt was
    // invoked AND the target excerpt block transitioned from hidden to
    // unhidden. A spy wraps the REAL published handle so this proves the
    // click handler calls the actual function, not merely that scoring ends
    // up correct some other way.
    var cCmdBtns = cWrap.querySelectorAll('.sl-cmd');
    var cFirstCmdId = cliScn.steps[0].answer.selected[0];
    var cFirstCmdBtn = cCmdBtns.filter(function (b) { return b.getAttribute('data-cmd') === cFirstCmdId; })[0];
    var cExcerpt = cliScn.assets.reference.excerpts.filter(function (ex) { return ex.id === cFirstCmdId; })[0];
    var cBlock = cWrap.querySelectorAll('.term-block').filter(function (b) { return b.getAttribute('data-excerpt') === cFirstCmdId; })[0];
    var cWasHidden = !!cBlock && cBlock.getAttribute('hidden') !== null;
    var cRevealCalledSpy = false;
    var cRealReveal = mCtx.window.__slRevealExcerpt;
    mCtx.window.__slRevealExcerpt = function (key) { cRevealCalledSpy = true; return cRealReveal(key); };
    if (cFirstCmdBtn) cFirstCmdBtn._fire('click');
    test('Task 11 (Wave 2) cli: firing a real .sl-cmd command-button click invokes window.__slRevealExcerpt AND unhides its target excerpt block',
      !!cFirstCmdBtn && !!cExcerpt && cExcerpt.reveal === cFirstCmdId && cWasHidden && cRevealCalledSpy &&
      !!cBlock && cBlock.getAttribute('hidden') === null);
    mCtx.window.__slRevealExcerpt = cRealReveal;

    driveAnalyzeModeCorrectly(cWrap, cliScn);
    driveConfigureCorrectly(cWrap, cliScn);
    submitActive();
    var cResult = cMount.getResult();
    test('Task 11 (Wave 2) cli: simLabScoreScenario reports correct === total after every keyed-correct reveal pick + configure answer',
      cResult && cResult.total > 0 && cResult.correct === cResult.total);

    var cliClone = JSON.parse(JSON.stringify(cliScn));
    var cCfgIdx = firstConfigureStepIndex(cliClone);
    var cMount2 = mountOnly(cliClone);
    driveAnalyzeModeCorrectly(cMount2.wrap, cliClone);
    driveConfigureCorrectly(cMount2.wrap, cliClone,
      { stepIndex: cCfgIdx, slotId: cliClone.steps[cCfgIdx].payload.slots[0].id });
    submitActive();
    var cResult2 = cMount2.getResult();
    test('Task 11 (Wave 2) cli negative control: one wrong root-cause/fix slot scores correct < total',
      cResult2 && cResult2.correct < cResult2.total);

    // ── Discovery (np-disc-01): terminal ref (tabs reveal) + configure step
    // + EXACT-SET excerptLines analyze step. ──
    var dMount = mountOnly(discoveryScn);
    var dWrap = dMount.wrap;
    test('Task 11 (Wave 2) discovery: mounted DOM contains a .term terminal component and every configure <select>',
      !!dWrap.querySelector('.term') && dWrap.querySelectorAll('select').length === expectedSelectCount(discoveryScn));
    driveAnalyzeModeCorrectly(dWrap, discoveryScn);
    driveConfigureCorrectly(dWrap, discoveryScn);
    submitActive();
    var dResult = dMount.getResult();
    test('Task 11 (Wave 2) discovery: simLabScoreScenario reports correct === total after every keyed-correct answer',
      dResult && dResult.total > 0 && dResult.correct === dResult.total);

    var discoveryClone = JSON.parse(JSON.stringify(discoveryScn));
    var dCfgIdx = firstConfigureStepIndex(discoveryClone);
    var dMount2 = mountOnly(discoveryClone);
    driveAnalyzeModeCorrectly(dMount2.wrap, discoveryClone);
    driveConfigureCorrectly(dMount2.wrap, discoveryClone,
      { stepIndex: dCfgIdx, slotId: discoveryClone.steps[dCfgIdx].payload.slots[0].id });
    submitActive();
    var dResult2 = dMount2.getResult();
    test('Task 11 (Wave 2) discovery negative control: one wrong reconciled-IP slot scores correct < total',
      dResult2 && dResult2.correct < dResult2.total);

    // ── Triage (a1-cot-01): terminal ref (no reveal gating) + configure
    // step + LENIENT excerptLines analyze step. ──
    var tMount = mountOnly(triageScn);
    var tWrap = tMount.wrap;
    test('Task 11 (Wave 2) triage: mounted DOM contains a .term terminal component and every configure <select>',
      !!tWrap.querySelector('.term') && tWrap.querySelectorAll('select').length === expectedSelectCount(triageScn));

    var tFlagStep = triageScn.steps.filter(function (s) { return s.type === 'analyze'; })[0];
    var tFalseLine = findFalseEvidenceLine(triageScn, tFlagStep.id);
    test('Task 11 (Wave 2) triage: fixture sanity — a real keyed evidence:false line exists to drive the leniency negative pick',
      !!tFalseLine);

    // (c) Lenient-evidence path: flag every keyed-correct evidence line PLUS
    // one extra REAL evidence:false line — the false pick must NOT subtract
    // credit (the Wave 2 Task 3 leniency contract), so the overall score
    // must still come out full.
    var tExtra = {}; tExtra[tFlagStep.id] = tFalseLine;
    driveAnalyzeModeCorrectly(tWrap, triageScn, tExtra);
    driveConfigureCorrectly(tWrap, triageScn);
    submitActive();
    var tResult = tMount.getResult();
    test('Task 11 (Wave 2) triage: LENIENT scoring still reports correct === total when an extra keyed evidence:false line is flagged alongside every keyed-correct line',
      tResult && tResult.total > 0 && tResult.correct === tResult.total);

    var triageClone = JSON.parse(JSON.stringify(triageScn));
    var tCfgIdx = firstConfigureStepIndex(triageClone);
    var tMount2 = mountOnly(triageClone);
    driveAnalyzeModeCorrectly(tMount2.wrap, triageClone);
    driveConfigureCorrectly(tMount2.wrap, triageClone,
      { stepIndex: tCfgIdx, slotId: triageClone.steps[tCfgIdx].payload.slots[0].id });
    submitActive();
    var tResult2 = tMount2.getResult();
    test('Task 11 (Wave 2) triage negative control: one wrong diagnosis/first-move slot scores correct < total',
      tResult2 && tResult2.correct < tResult2.total);

  } catch (err) {
    test('Task 11 (Wave 2): archetype vertical-slice smoke test (threw)', false);
    results.errors.push('Task 11 (Wave 2) archetype vertical-slice smoke test threw: ' + err.message);
  }
})();

