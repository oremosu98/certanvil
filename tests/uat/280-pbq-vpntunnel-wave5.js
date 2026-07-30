// tests/uat/280-pbq-vpntunnel-wave5.js
// Scope: Sim Lab PBQ Wave 5 — the `vpntunnel` archetype (Security+ SY0-701).
// Guarded configure extension: payload.layout:'dualpanel' + payload.scoring:'tunnel'.
// Plan: docs/superpowers/plans/2026-07-19-sim-lab-pbq-wave5.md

const {
  _fnBody, dgCss, js, read, results, test, vm
} = require('./_context');

// ── Wave 5: vpntunnel — payload validation, tunnel scorer, allowlist ──
// Bodies are extracted with the harness's brace-depth _fnBody rather than a
// non-greedy regex: _scoreTunnelStep nests an inner function, and a lazy
// /\n\s*\}\n/ terminator truncates the body at the INNER closing brace.
(function () {
  console.log('\n\x1b[1m── Sim Lab Wave 5: vpntunnel scorer + payload guard ──\x1b[0m');
  try {
    var src = _fnBody(js, '_scoreTunnelStep');
    test('W5: _scoreTunnelStep exists in sim-lab.js', !!src);
    var scoreTunnel = null;
    if (src) { scoreTunnel = new Function('return (' + src + ')')(); }

    var STEP = {
      id: 'p1', type: 'configure', points: 1,
      payload: {
        layout: 'dualpanel', scoring: 'tunnel',
        panels: [{ id: 'A', label: 'GW-A' }, { id: 'B', label: 'GW-B' }],
        slots: [
          { id: 'a-enc', panel: 'A', label: 'Encryption', options: [{ id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' }] },
          { id: 'b-enc', panel: 'B', label: 'Encryption', options: [{ id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' }] },
          { id: 'a-local', panel: 'A', label: 'Local subnet', options: [{ id: 'lon', text: '10.10.0.0/16' }, { id: 'fra', text: '10.20.0.0/16' }] },
          { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [{ id: 'lon', text: '10.10.0.0/16' }, { id: 'fra', text: '10.20.0.0/16' }] }
        ],
        symmetryPairs: [['a-enc', 'b-enc']],
        mirrorPairs: [['a-local', 'b-remote']]
      },
      answer: { slots: { 'a-enc': ['aes192', 'aes256'], 'b-enc': ['aes192', 'aes256'], 'a-local': ['lon'], 'b-remote': ['lon'] } }
    };
    // Hand-derived: 4 membership + 1 symmetry + 1 mirror = 6 units.
    var full = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc': 'aes256', 'b-enc': 'aes256', 'a-local': 'lon', 'b-remote': 'lon' } });
    test('W5: perfect response scores 6/6', !!full && full.total === 6 && full.correct === 6);

    // THE teaching-point fixture: both encs individually valid, but different →
    // membership 4/4 KEPT, symmetry unit LOST. (Spec §Runtime scoring.)
    var asym = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc': 'aes256', 'b-enc': 'aes192', 'a-local': 'lon', 'b-remote': 'lon' } });
    test('W5: asymmetric-but-valid picks lose ONLY the symmetry unit (5/6)', !!asym && asym.total === 6 && asym.correct === 5);

    // Matching pair of policy-VIOLATING values still earns its symmetry unit
    // (independent predicates — spec §Runtime scoring, fixture mandated).
    var weakSym = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc': 'aes128', 'b-enc': 'aes128', 'a-local': 'lon', 'b-remote': 'lon' } });
    test('W5: matching weak values fail membership but keep symmetry (4/6)', !!weakSym && weakSym.total === 6 && weakSym.correct === 4);

    // Mirror break: a-local=lon but b-remote=fra → mirror unit lost, b-remote membership lost.
    var mir = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc': 'aes256', 'b-enc': 'aes256', 'a-local': 'lon', 'b-remote': 'fra' } });
    test('W5: broken mirror loses mirror unit + its membership (4/6)', !!mir && mir.total === 6 && mir.correct === 4);

    // Unanswered slot: 0 membership, fails its pairs.
    var unans = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc': 'aes256', 'a-local': 'lon', 'b-remote': 'lon' } });
    test('W5: unanswered slot scores 0 and fails its pair (4/6)', !!unans && unans.total === 6 && unans.correct === 4);

    // Dangling pair reference = SKIPPED unit, never a throw (runtime scorer is total).
    var DANGLING = JSON.parse(JSON.stringify(STEP));
    DANGLING.payload.symmetryPairs.push(['a-enc', 'zz-nope']);
    var dang = null, threw = false;
    try { dang = scoreTunnel && scoreTunnel(DANGLING, { slots: { 'a-enc': 'aes256', 'b-enc': 'aes256', 'a-local': 'lon', 'b-remote': 'lon' } }); } catch (e) { threw = true; }
    test('W5: dangling pair reference is skipped, not thrown (still 6 units)', !threw && !!dang && dang.total === 6 && dang.correct === 6);

    // Null response is total.
    var nul = null; threw = false;
    try { nul = scoreTunnel && scoreTunnel(STEP, null); } catch (e) { threw = true; }
    test('W5: null response scores 0/6 without throwing', !threw && !!nul && nul.total === 6 && nul.correct === 0);

    // Source-level guards:
    var allowlist = (js.match(/if \(s\.archetype !== undefined && \[([^\]]*)\]/) || [])[1] || '';
    test('W5: vpntunnel in simLabValidateScenario archetype allowlist', /'vpntunnel'/.test(allowlist));
    test('W5: _scoreStep configure case branches on tunnel scoring', /case 'configure':[\s\S]{0,300}scoring === 'tunnel'/.test(js));
    test('W5: simLabScoreScenario branches on tunnel scoring', /function simLabScoreScenario[\s\S]{0,900}scoring === 'tunnel'/.test(js));
    test('W5: payload validation accepts array answers only under tunnel scoring', /p\.scoring === 'tunnel'/.test(js));
  } catch (err) {
    test('W5: vpntunnel scorer block (threw)', false);
    results.errors.push('W5 vpntunnel scorer block threw: ' + err.message);
  }
})();

// ── Wave 5: dualpanel renderer + .sl-dp CSS block ──
// NOTE the _fnBody prefix trap: '_slRenderConfigure' is a prefix of
// '_slRenderConfigureDualPanel' and _fnBody returns the LONGEST match, so the
// bare name would hand back the dualpanel body. Only the full name is asked for.
(function () {
  console.log('\n\x1b[1m── Sim Lab Wave 5: dualpanel renderer + CSS ──\x1b[0m');
  try {
    test('W5: _slRenderConfigure dispatches dualpanel layout',
      /_slRenderConfigure\(step, onChange, initial\) \{[\s\S]{0,400}layout === 'dualpanel'[\s\S]{0,120}_slRenderConfigureDualPanel/.test(js));

    var body = _fnBody(js, '_slRenderConfigureDualPanel');
    test('W5: _slRenderConfigureDualPanel exists', !!body);
    test('W5: dualpanel renderer escapes labels (_esc on label/prompt)', !!body && /_esc\(/.test(body));
    test('W5: dualpanel toggle buttons carry aria-pressed', !!body && /aria-pressed/.test(body));
    test('W5: mirror strip renders chips from the shared resp object',
      !!body && /sl-dp-mirror/.test(body) && /sl-dp-chip/.test(body));
    test('W5: dualpanel reports responses as a copied slots object (classic parity)',
      !!body && /onChange\(\{ slots: Object\.assign\(\{\}, resp\) \}\)/.test(body));
    test('W5: dualpanel chip text is set via textContent, never innerHTML',
      !!body && /chip\.textContent =/.test(body) && !/chip\.innerHTML/.test(body));
    // Mockup parity: the mirror heading reads "GW-FRA currently says", not the
    // whole panel label. The full label still goes to aria-label.
    test('W5: mirror heading uses the SHORT panel name (mockup parity)',
      !!body && /_panelShort\(other\) \+ ' currently says'/.test(body));
    test('W5: _panelShort splits the panel label on the middle-dot separator',
      /function _panelShort\(pn\) \{ return String\(pn\.label\)\.split\(' · '\)\[0\]; \}/.test(js));
    test('W5: mirror aria-label keeps the FULL panel label for screen readers',
      !!body && /aria-label', other\.label \+ ' current values'/.test(body));

    test('W5: dg-system defines .sl-dp-btn with 44px touch floor',
      /\.sl-dp-btn\{[^}]*min-height:44px/.test(dgCss));
    test('W5: dg-system .sl-dp block uses tokens only (no hex)',
      !/\.sl-dp[^}]*#[0-9a-fA-F]{3,6}/.test(dgCss));
    test('W5: .sl-dp-btn aria-pressed state styled',
      /\.sl-dp-btn\[aria-pressed="true"\]/.test(dgCss));
    test('W5: .sl-dp block collapses transform under reduced motion',
      /prefers-reduced-motion[\s\S]{0,400}\.sl-dp-btn:active\{transform:none\}/.test(dgCss));
  } catch (err) {
    test('W5: vpntunnel renderer block (threw)', false);
    results.errors.push('W5 vpntunnel renderer block threw: ' + err.message);
  }
})();

// ── Wave 5: simLabValidateTunnelFidelity (authoring-time seed sanity) ──
(function () {
  console.log('\n\x1b[1m── Sim Lab Wave 5: tunnel fidelity validator ──\x1b[0m');
  try {
    var src = _fnBody(js, 'simLabValidateTunnelFidelity');
    test('W5: simLabValidateTunnelFidelity exists', !!src);
    var validate = null;
    if (src) {
      // Inject the two outer-scope deps the body closes over.
      var FLOORS = ['no-psk', 'pfs', 'aes192-min', 'aes256-min', 'legacy-migration'];
      validate = new Function('_isNonEmptyStr', '_TUNNEL_POLICY_FLOORS', 'return (' + src + ')')(
        function (v) { return typeof v === 'string' && v.trim().length > 0; }, FLOORS);
    }
    test('W5: fidelity validator is exposed on window', /window\.simLabValidateTunnelFidelity = simLabValidateTunnelFidelity/.test(js));

    function mkSlot(id, panel, label, opts) {
      return { id: id, panel: panel, label: label, options: opts.map(function (t) { return { id: t[0], text: t[1] }; }) };
    }
    var ENC = [['aes128', 'AES-128'], ['aes192', 'AES-192'], ['aes256', 'AES-256']];
    var NET = [['lon', '10.10.0.0/16 · London'], ['fra', '10.20.0.0/16 · Frankfurt']];
    function mkScn() {
      return {
        id: 'sp-vpn-99', cert: 'secplus', archetype: 'vpntunnel', objective: '3.2',
        title: 't', estMinutes: 5, scenario: 's', policyFloor: ['no-psk', 'pfs', 'aes192-min'],
        assets: { reference: { kind: 'network', devices: [
          { id: 'siteA', label: 'London', subnet: '10.10.0.0/16' },
          { id: 'siteB', label: 'Frankfurt', subnet: '10.20.0.0/16' }
        ] } },
        steps: [
          { id: 'p1', type: 'configure', points: 1, prompt: 'x', explanation: 'x',
            payload: { layout: 'dualpanel', scoring: 'tunnel',
              panels: [{ id: 'A', label: 'GW-A' }, { id: 'B', label: 'GW-B' }],
              slots: [mkSlot('a-enc', 'A', 'Encryption', ENC), mkSlot('b-enc', 'B', 'Encryption', ENC)],
              symmetryPairs: [['a-enc', 'b-enc']], mirrorPairs: [] },
            answer: { slots: { 'a-enc': ['aes192', 'aes256'], 'b-enc': ['aes192', 'aes256'] } } },
          { id: 'p2', type: 'configure', points: 1, prompt: 'x', explanation: 'x',
            payload: { layout: 'dualpanel', scoring: 'tunnel',
              panels: [{ id: 'A', label: 'GW-A' }, { id: 'B', label: 'GW-B' }],
              slots: [mkSlot('a-local', 'A', 'Local subnet', NET), mkSlot('a-remote', 'A', 'Remote subnet', NET),
                mkSlot('b-local', 'B', 'Local subnet', NET), mkSlot('b-remote', 'B', 'Remote subnet', NET)],
              symmetryPairs: [], mirrorPairs: [['a-local', 'b-remote'], ['a-remote', 'b-local']] },
            answer: { slots: { 'a-local': ['lon'], 'a-remote': ['fra'], 'b-local': ['fra'], 'b-remote': ['lon'] } } }
        ]
      };
    }
    test('W5: fidelity — well-formed scenario accepted', !!validate && validate(mkScn()).ok);

    var bad1 = mkScn(); bad1.steps[0].payload.symmetryPairs = [['a-enc', 'a-enc']];
    test('W5: fidelity — same-panel pair rejected', !!validate && !validate(bad1).ok);

    var bad2 = mkScn(); bad2.steps[0].answer.slots['b-enc'] = ['aes256'];
    test('W5: fidelity — asymmetric acceptable sets rejected', !!validate && !validate(bad2).ok);

    var bad3 = mkScn(); bad3.steps[1].answer.slots['b-remote'] = ['fra'];
    test('W5: fidelity — mirror sets that do not cross-reference rejected', !!validate && !validate(bad3).ok);

    var bad4 = mkScn(); bad4.policyFloor = ['no-psk', 'quantum-safe'];
    test('W5: fidelity — unknown policyFloor tag rejected', !!validate && !validate(bad4).ok);

    var bad5 = mkScn(); bad5.steps = [bad5.steps[0]];
    test('W5: fidelity — fewer than 2 dualpanel steps rejected', !!validate && !validate(bad5).ok);

    var bad6 = mkScn(); bad6.assets.reference.devices[0].subnet = '10.99.0.0/16';
    test('W5: fidelity — Phase-2 subnets inconsistent with site subnets rejected', !!validate && !validate(bad6).ok);

    var bad7 = mkScn(); bad7.archetype = 'diagram';
    test('W5: fidelity — non-vpntunnel scenario rejected outright', !!validate && !validate(bad7).ok);

    var bad8 = mkScn(); bad8.steps[0].payload.slots[1].id = 'x-enc'; bad8.steps[0].payload.slots[1].panel = 'B';
    bad8.steps[0].answer.slots['x-enc'] = bad8.steps[0].answer.slots['b-enc'];
    test('W5: fidelity — slot id not prefixed by its panel rejected', !!validate && !validate(bad8).ok);

    var nul = null, threw = false;
    try { nul = validate && validate(null); } catch (e) { threw = true; }
    test('W5: fidelity — null scenario returns not-ok without throwing', !threw && !!nul && nul.ok === false);
  } catch (err) {
    test('W5: vpntunnel fidelity block (threw)', false);
    results.errors.push('W5 vpntunnel fidelity block threw: ' + err.message);
  }
})();

// ── Wave 5: the 12-seed vpntunnel bank ──
// Source-level axis coverage, then the FUNCTIONAL sweep — every seed is run
// through the real simLabValidateScenario AND simLabValidateTunnelFidelity,
// extracted from features/sim-lab.js into a vm context (the 210-*.js harness).
(function () {
  console.log('\n\x1b[1m── Sim Lab Wave 5: vpntunnel seed bank ──\x1b[0m');
  try {
    var seedSrcRaw = read('features/sim-lab-seed-secplus.js');
    var ids = [];
    var re = /id: 'sp-vpn-(\d\d)'/g, hit;
    while ((hit = re.exec(seedSrcRaw))) ids.push(hit[1]);
    test('W5: seed bank has exactly 12 sp-vpn scenarios', ids.length === 12);
    test('W5: sp-vpn ids are 01..12 with no gaps',
      ids.slice().sort().join(',') === '01,02,03,04,05,06,07,08,09,10,11,12');

    // Axis coverage is measured over the vpntunnel REGION of the file only, so
    // unrelated Sec+ seeds elsewhere in the bank can't satisfy a check for us.
    var regionStart = seedSrcRaw.indexOf("id: 'sp-vpn-01'");
    var vpnSrc = regionStart === -1 ? '' : seedSrcRaw.slice(regionStart);
    test('W5: >=1 seed uses each policyFloor family',
      /'no-psk'/.test(vpnSrc) && /'pfs'/.test(vpnSrc) &&
      /'aes192-min'/.test(vpnSrc) && /'aes256-min'/.test(vpnSrc) && /'legacy-migration'/.test(vpnSrc));
    test('W5: exactly 3 distractor seeds carry an analyze step',
      (vpnSrc.match(/type: 'analyze'/g) || []).length === 3);

    // ── Functional sweep ──
    var vCtx = {};
    vm.createContext(vCtx);
    var stepTypesMatch = js.match(/var STEP_TYPES\s*=\s*\[[^\]]+\]/);
    vm.runInContext((stepTypesMatch ? stepTypesMatch[0] : "var STEP_TYPES=['order','categorize','match','analyze','fillin','configure']") + ';', vCtx);
    var swatchMatch = js.match(/var _SWATCH_DEFECTS\s*=\s*\[[^\]]+\]/);
    vm.runInContext((swatchMatch ? swatchMatch[0] : 'var _SWATCH_DEFECTS=[]') + ';', vCtx);
    var floorsMatch = js.match(/var _TUNNEL_POLICY_FLOORS\s*=\s*\[[^\]]+\]/);
    test('W5: _TUNNEL_POLICY_FLOORS enum declared in sim-lab.js', !!floorsMatch);
    vm.runInContext((floorsMatch ? floorsMatch[0] : 'var _TUNNEL_POLICY_FLOORS=[]') + ';', vCtx);

    ['_isNonEmptyStr', '_validateStepPayload', 'simLabValidateScenario', 'simLabValidateTunnelFidelity']
      .forEach(function (n) { vm.runInContext(_fnBody(js, n), vCtx); });
    vm.runInContext('globalThis.__v = simLabValidateScenario; globalThis.__t = simLabValidateTunnelFidelity;', vCtx);
    var validateScenario = vCtx.__v, validateTunnel = vCtx.__t;

    var seedCtx = {};
    vm.createContext(seedCtx);
    vm.runInContext('var window = {};\n' + seedSrcRaw + '\nglobalThis.__seed = window.SIM_LAB_SEED_SECPLUS;', seedCtx);
    var bank = seedCtx.__seed;
    test('W5: window.SIM_LAB_SEED_SECPLUS still loads as an array', Array.isArray(bank));

    var vpn = (bank || []).filter(function (s) { return s && s.archetype === 'vpntunnel'; });
    test('W5 sweep: 12 vpntunnel-archetype scenarios resolve from the real bank', vpn.length === 12);

    var allScn = true, allFid = true, allCert = true, allObj = true;
    vpn.forEach(function (s) {
      var vr = validateScenario(s);
      if (!vr || vr.ok !== true) {
        allScn = false;
        results.errors.push('W5 sweep: ' + (s && s.id) + ' failed simLabValidateScenario: ' + JSON.stringify(vr && vr.errors));
      }
      var fr = validateTunnel(s);
      if (!fr || fr.ok !== true) {
        allFid = false;
        results.errors.push('W5 sweep: ' + (s && s.id) + ' failed simLabValidateTunnelFidelity: ' + JSON.stringify(fr && fr.errors));
      }
      if (s.cert !== 'secplus') allCert = false;
      if (['3.2', '1.4'].indexOf(s.objective) === -1) allObj = false;
    });
    test('W5 sweep: every vpntunnel seed passes simLabValidateScenario', allScn);
    test('W5 sweep: every vpntunnel seed passes simLabValidateTunnelFidelity', allFid);
    test('W5 sweep: every vpntunnel seed is cert secplus', allCert);
    test('W5 sweep: every vpntunnel seed targets objective 3.2 or 1.4', allObj);

    // Vendor neutrality — open-standard vocabulary only. The named-vendor list is
    // the easy half; the terms below it are the ones the two-agent gate actually
    // caught (proxy ID = Juniper/PAN, XAUTH = a Cisco IKEv1 draft that never
    // standardised, crypto map / transform set = Cisco config vocabulary).
    test('W5: seeds carry no vendor console vocabulary',
      !/\b(Cisco|Fortinet|FortiGate|Palo Alto|PAN-OS|Juniper|SonicWall|Meraki|ASA|pfSense|WatchGuard)\b/i.test(vpnSrc));
    test('W5: panel labels use the middle dot, never an em dash',
      !/label: 'GW-[A-Z]+ —/.test(vpnSrc));
    test('W5: seeds carry no vendor-specific IPSec jargon',
      !/\b(proxy[- ]?id|XAUTH|crypto map|transform set|encryption domain|interesting traffic|tunnel-group)\b/i.test(vpnSrc));

    // Post-gate structural guards — each pins a defect the two-agent gate found.
    test('W5: no seed pairs SA lifetime in symmetryPairs (IKEv2 does not negotiate it)',
      !/\['a-life','b-life'\]/.test(vpnSrc));
    test('W5: PFS is a Phase 2 slot, never a Phase 1 "no DH group" fiction',
      /'a-pfs'/.test(vpnSrc) && !/skip PFS/.test(vpnSrc));
    test('W5: every seed states a floor in prose, not only in policyFloor tags',
      vpn.length === 12 && vpn.every(function (s) { return /minimum|not negotiable|and nothing weaker/.test(s.scenario); }));
    test('W5: no seed claims IKE renegotiates down to a weaker common suite',
      !/renegotiates? (back )?down/i.test(vpnSrc));
    test('W5: every seed declares estMinutes in the 4-6 band',
      vpn.length === 12 && vpn.every(function (s) { return s.estMinutes >= 4 && s.estMinutes <= 6; }));
    test('W5: every seed declares a policyFloor array',
      vpn.length === 12 && vpn.every(function (s) { return Array.isArray(s.policyFloor) && s.policyFloor.length >= 1; }));
  } catch (err) {
    test('W5: vpntunnel seed bank block (threw)', false);
    results.errors.push('W5 vpntunnel seed bank block threw: ' + err.message);
  }
})();
