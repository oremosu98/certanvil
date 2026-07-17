// tests/uat/200-simlab-fidelity-validators-renderers.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Guarded analyze extension, subnetting/wireless/firewall/SOHO fidelity validators, network/timeline/defense-in-depth reference renderers

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── Wave 2 Task 3: guarded analyze extension — mode branch + lenient scoring ──
(function () {
  var vm = require('vm');
  var grab = function (n) { return _fnBody(js, n); };
  var pieces = [grab('_arrEq'), grab('_setEq'), grab('_scoreConfigureSlots'), grab('_scoreAnalyzeLenient'), grab('_scoreStep'), grab('_simLabNormalizeMatch') || '', grab('simLabScoreScenario')].join('\n');
  var sCtx = {}; vm.createContext(sCtx); vm.runInContext(pieces, sCtx);
  vm.runInContext('globalThis.__score = simLabScoreScenario;', sCtx);
  var score = sCtx.__score;

  // lenient analyze: partial credit, false picks never subtract
  var lenientScn = { steps: [ { id: 'ev', type: 'analyze', points: 1,
    payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
    answer: { selected: ['l1', 'l2', 'l3'] } } ] };
  test('analyze lenient: all-correct scores total===correct',
    score(lenientScn, { ev: { selected: ['l1', 'l2', 'l3'] } }).correct === 3);
  test('analyze lenient: partial scores correct<total, no negative',
    (function () { var r = score(lenientScn, { ev: { selected: ['l1'] } }); return r.correct === 1 && r.total === 3; })());
  test('analyze lenient: a FALSE pick does not subtract earned credit',
    (function () { var r = score(lenientScn, { ev: { selected: ['l1', 'l2', 'l3', 'lX'] } }); return r.correct === 3 && r.total === 3; })());

  // regression: an analyze step WITHOUT scoring flag stays exact-set boolean
  var exactScn = { steps: [ { id: 'a', type: 'analyze', points: 1,
    payload: { multi: false, lines: [{ id: 'x' }, { id: 'y' }] }, answer: { selected: ['x'] } } ] };
  test('analyze default: exact-set match still scores 1/1',
    score(exactScn, { a: { selected: ['x'] } }).correct === 1);
  test('analyze default: wrong exact-set still scores 0/1',
    score(exactScn, { a: { selected: ['y'] } }).correct === 0);
})();

// ── Task 9: subnetting/CIDR fidelity validator ──
// Pure-logic check: given a `network` reference model + a `configure` step,
// confirm the flagged device is out-of-subnet and the step's correct answer
// re-homes it in-subnet. No DOM — extract via vm same as other Sim Lab tests.
(function () {
  console.log('\n\x1b[1m── Sim Lab: network fidelity validator (Task 9) ──\x1b[0m');
  try {
    var vm = require('vm');
    function assert(cond, msg) { test(msg, !!cond); }

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    var ipToIntBody = grab('_ipToInt');
    var maskToIntBody = grab('_maskToInt');
    var inSubnetBody = grab('_inSubnet');
    var resolveSlotBody = grab('_slFidelityResolveSlot');
    var fidelityBody = grab('simLabValidateNetworkFidelity');

    if (!ipToIntBody || !maskToIntBody || !inSubnetBody || !resolveSlotBody || !fidelityBody) {
      test('fidelity: vm extraction succeeded', false);
      results.errors.push('could not extract fidelity validator helpers; check names/indenting');
      return;
    }

    var fCtx = {};
    vm.createContext(fCtx);
    vm.runInContext(ipToIntBody, fCtx);
    vm.runInContext(maskToIntBody, fCtx);
    vm.runInContext(inSubnetBody, fCtx);
    vm.runInContext(resolveSlotBody, fCtx);
    vm.runInContext(fidelityBody, fCtx);
    vm.runInContext('globalThis.__ipToInt = _ipToInt; globalThis.__maskToInt = _maskToInt; ' +
      'globalThis.__inSubnet = _inSubnet; globalThis.__fidelity = simLabValidateNetworkFidelity;', fCtx);
    var _ipToInt = fCtx.__ipToInt;
    var _maskToInt = fCtx.__maskToInt;
    var _inSubnet = fCtx.__inSubnet;
    var simLabValidateNetworkFidelity = fCtx.__fidelity;

    // ── helpers ──
    assert(_ipToInt('192.168.10.1') === (((192 << 24) | (168 << 16) | (10 << 8) | 1) >>> 0), 'ipToInt');
    assert(_inSubnet('192.168.10.45', '192.168.10.0', '255.255.255.0') === true, 'inSubnet true');
    assert(_inSubnet('192.168.20.45', '192.168.10.0', '255.255.255.0') === false, 'inSubnet false');

    // ── Task-9 dev fixture ──
    // Net+ diagram: VLAN 10 (192.168.10.0/24) with PC-1 correctly homed and
    // PC-2 mis-configured with an out-of-subnet IP (192.168.20.45). The
    // configure step's correct answer re-homes PC-2 into .10.x with an
    // in-subnet gateway.
    //
    // Slot -> field convention (kept minimal for this validator):
    //   - The configure step carries a `deviceId` naming which device it
    //     corrects.
    //   - Slot ids are literally 'ip' / 'mask' / 'gateway'; each slot's
    //     correct option (per step.answer.slots[slotId]) is resolved to its
    //     option `text`, which is the corrected value for that field.
    var fxNetworkRef = function () {
      return {
        kind: 'network',
        devices: [
          { id: 'pc1', label: 'PC-1', type: 'pc', zone: 'v10', ip: '192.168.10.10', mask: '255.255.255.0', gateway: '192.168.10.1', x: 10, y: 10 },
          { id: 'pc2', label: 'PC-2', type: 'pc', zone: 'v10', ip: '192.168.20.45', mask: '255.255.255.0', gateway: '192.168.10.1', x: 40, y: 10 },
          { id: 'gw1', label: 'Gateway', type: 'router', zone: 'v10', ip: '192.168.10.1', mask: '255.255.255.0', gateway: '192.168.10.1', x: 70, y: 10 }
        ],
        links: [{ from: 'pc1', to: 'gw1' }, { from: 'pc2', to: 'gw1' }],
        given: { networkId: '192.168.10.0', mask: '255.255.255.0' }
      };
    };
    var fxConfigureStep = function () {
      return {
        id: 'fix1', type: 'configure', prompt: 'Correct PC-2’s IP configuration',
        explanation: 'PC-2 was on 192.168.20.0/24 — the wrong VLAN for this zone.', points: 1,
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

    var _fx = { ref: fxNetworkRef(), step: fxConfigureStep() };
    var _fxResult = simLabValidateNetworkFidelity(_fx.ref, _fx.step);
    assert(_fxResult && _fxResult.ok === true, 'Net+ fixture is fidelity-sound');

    // ── Negative case: "correct" answer is itself out-of-subnet ──
    var _badFx = { ref: fxNetworkRef(), step: fxConfigureStep() };
    // corrected IP still lands in the wrong subnet (192.168.30.x, not 192.168.10.x)
    _badFx.step.payload.slots[0].options[1].text = '192.168.30.45';
    var _badResult = simLabValidateNetworkFidelity(_badFx.ref, _badFx.step);
    assert(_badResult && _badResult.ok === false, 'rejects a "correct" answer that is itself out-of-subnet');
    assert(_badResult && Array.isArray(_badResult.errors) && _badResult.errors.length > 0, 'negative case reports errors');

  } catch (err) {
    test('fidelity validator: vm smoke test (threw)', false);
    results.errors.push('fidelity validator smoke test threw: ' + err.message);
  }
})();

// ── Wireless fidelity validator (Wave 1 Task 2) ──
// Pure-logic check: given a `network` reference model + a wireless `configure`
// step, confirm the KEYED answer is RF-sound (legal 2.4/5 GHz channel, clear
// of any other device carrying a numeric `channel`, band/security satisfy
// `require`). No DOM — extract via vm same as the Task 9 fidelity tests.
(function () {
  console.log('\n\x1b[1m── Sim Lab: wireless fidelity validator (Wave 1 Task 2) ──\x1b[0m');
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

    var resolveSlotBody = grab('_slFidelityResolveSlot');
    var wifi24Var = grabVar('_WIFI_24_CLEAR');
    var wifi5Var = grabVar('_WIFI_5_CHANNELS');
    var wifiFidelityBody = grab('simLabValidateWirelessFidelity');

    if (!resolveSlotBody || !wifiFidelityBody || !wifi24Var || !wifi5Var) {
      test('wifi fidelity: vm extraction succeeded', false);
      results.errors.push('could not extract wireless fidelity validator helpers; check names/indenting');
      return;
    }

    var wCtx = { _isNonEmptyStr: function (v) { return typeof v === 'string' && v.trim().length > 0; } };
    vm.createContext(wCtx);
    vm.runInContext(resolveSlotBody, wCtx);
    vm.runInContext(wifi24Var, wCtx);
    vm.runInContext(wifi5Var, wCtx);
    vm.runInContext(wifiFidelityBody, wCtx);
    vm.runInContext('globalThis.__wifiFidelity = simLabValidateWirelessFidelity;', wCtx);
    var simLabValidateWirelessFidelity = wCtx.__wifiFidelity;

    var _wref = { kind:'network', devices:[
      { id:'ap2', label:'AP-2', type:'ap', zone:'wh', x:0, y:0 },
      { id:'nbr', label:'Neighbor AP', type:'ap', zone:'out', x:1, y:0, state:'compromised', channel: 6 } ], links:[] };
    var _wstep = { id:'w1', type:'configure', points:1, apId:'ap2',
      require:{ band:'2.4', security:'WPA3-Personal' },
      prompt:'p', explanation:'e',
      payload:{ slots:[
        { id:'band', label:'Band', options:[{id:'a',text:'2.4 GHz'},{id:'b',text:'5 GHz'}] },
        { id:'channel', label:'Channel', options:[{id:'a',text:'11'},{id:'b',text:'6'},{id:'c',text:'8'}] },
        { id:'security', label:'Security', options:[{id:'a',text:'WPA3-Personal'},{id:'b',text:'WEP'}] } ] },
      answer:{ slots:{ band:'a', channel:'a', security:'a' } } };
    assert(simLabValidateWirelessFidelity(_wref, _wstep).ok === true, 'wifi: sound keyed config passes');
    var _bad1 = JSON.parse(JSON.stringify(_wstep)); _bad1.answer.slots.channel = 'b';   // keyed onto neighbor's 6
    assert(simLabValidateWirelessFidelity(_wref, _bad1).ok === false, 'wifi: keyed channel colliding with neighbor rejected');
    var _bad2 = JSON.parse(JSON.stringify(_wstep)); _bad2.answer.slots.channel = 'c';   // 8 = overlapping channel
    assert(simLabValidateWirelessFidelity(_wref, _bad2).ok === false, 'wifi: keyed non-1/6/11 2.4GHz channel rejected');
    var _bad3 = JSON.parse(JSON.stringify(_wstep)); _bad3.answer.slots.security = 'b';
    assert(simLabValidateWirelessFidelity(_wref, _bad3).ok === false, 'wifi: keyed security below requirement rejected');

  } catch (err) {
    test('wireless fidelity validator: vm smoke test (threw)', false);
    results.errors.push('wireless fidelity validator smoke test threw: ' + err.message);
  }
})();

// ── Sim Lab: firewall fidelity validator (Wave 1 Task 3) ──
// Runs the scenario's acceptance flows through the KEYED rule table with
// first-match-wins + implicit deny, and proves the phase-3 shadow exhibit is
// genuinely shadowed. Pure-logic, no DOM — extract via vm same as Task 2.
(function () {
  console.log('\n\x1b[1m── Sim Lab: firewall fidelity validator (Wave 1 Task 3) ──\x1b[0m');
  try {
    var vm = require('vm');
    function assert(cond, msg) { test(msg, !!cond); }

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    var ipToIntBody = grab('_ipToInt');
    var fwMatchAddrBody = grab('_fwMatchAddr');
    var fwRuleMatchesBody = grab('_fwRuleMatches');
    var fwFidelityBody = grab('simLabValidateFirewallFidelity');

    if (!ipToIntBody || !fwMatchAddrBody || !fwRuleMatchesBody || !fwFidelityBody) {
      test('fw fidelity: vm extraction succeeded', false);
      results.errors.push('could not extract firewall fidelity validator helpers; check names/indenting');
      return;
    }

    var fwCtx = {};
    vm.createContext(fwCtx);
    vm.runInContext(ipToIntBody, fwCtx);
    vm.runInContext(fwMatchAddrBody, fwCtx);
    vm.runInContext(fwRuleMatchesBody, fwCtx);
    vm.runInContext(fwFidelityBody, fwCtx);
    vm.runInContext('globalThis.__fwFidelity = simLabValidateFirewallFidelity;', fwCtx);
    var simLabValidateFirewallFidelity = fwCtx.__fwFidelity;

    var _fwScn = { fwSpec: {
      rules: [
        { id:'ssh',  action:'allow', proto:'tcp', src:'10.10.10.5/32', dst:'10.10.30.20/32', port:22 },
        { id:'web',  action:'allow', proto:'tcp', src:'10.10.10.0/24', dst:'10.10.30.10/32', port:443 },
        { id:'deny', action:'deny',  proto:'any', src:'any', dst:'any', port:'any' } ],
      flows: [
        { name:'admin ssh',   proto:'tcp', src:'10.10.10.5',  dst:'10.10.30.20', port:22,  expect:'allow' },
        { name:'staff https', proto:'tcp', src:'10.10.10.77', dst:'10.10.30.10', port:443, expect:'allow' },
        { name:'staff ssh',   proto:'tcp', src:'10.10.10.77', dst:'10.10.30.20', port:22,  expect:'deny' } ],
      shadowTable: {
        rules: [
          { id:'ssh',  action:'allow', proto:'tcp', src:'10.10.10.5/32', dst:'10.10.30.20/32', port:22 },
          { id:'blk',  action:'deny',  proto:'any', src:'10.10.10.0/24', dst:'any', port:'any' },
          { id:'web',  action:'allow', proto:'tcp', src:'10.10.10.0/24', dst:'10.10.30.10/32', port:443 } ],
        shadowedRuleId: 'web' } } };
    assert(simLabValidateFirewallFidelity(_fwScn).ok === true, 'fw: sound spec passes');
    var _fwBad = JSON.parse(JSON.stringify(_fwScn));
    _fwBad.fwSpec.rules[2] = _fwBad.fwSpec.rules[0]; _fwBad.fwSpec.rules[0] = { id:'deny', action:'deny', proto:'any', src:'any', dst:'any', port:'any' };
    assert(simLabValidateFirewallFidelity(_fwBad).ok === false, 'fw: deny-first table fails its own flows');
    var _fwBad2 = JSON.parse(JSON.stringify(_fwScn));
    _fwBad2.fwSpec.shadowTable.rules[1].src = '10.10.99.0/24';   // no longer shadows web
    assert(simLabValidateFirewallFidelity(_fwBad2).ok === false, 'fw: declared-shadowed rule that actually fires is rejected');

  } catch (err) {
    test('firewall fidelity validator: vm smoke test (threw)', false);
    results.errors.push('firewall fidelity validator smoke test threw: ' + err.message);
  }
})();

// ── Sim Lab: SOHO fidelity validator (Wave 1 Task 4) ──
// Pure arithmetic proof that the KEYED router config satisfies the scenario's
// machine-readable facts: DHCP pool inside the subnet, sized for the client
// count, excluding router + statics; forward target on the LAN; ssid/security
// matching scenario.soho.require. Pure-logic, no DOM — extract via vm same as
// Task 2/3.
(function () {
  console.log('\n\x1b[1m── Sim Lab: SOHO fidelity validator (Wave 1 Task 4) ──\x1b[0m');
  try {
    var vm = require('vm');
    function assert(cond, msg) { test(msg, !!cond); }

    var grab = function (name) {
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };

    var ipToIntBody = grab('_ipToInt');
    var maskToIntBody = grab('_maskToInt');
    var inSubnetBody = grab('_inSubnet');
    var resolveSlotBody = grab('_slFidelityResolveSlot');
    var sohoSlotTextBody = grab('_sohoSlotText');
    var sohoFidelityBody = grab('simLabValidateSohoFidelity');

    if (!ipToIntBody || !maskToIntBody || !inSubnetBody || !resolveSlotBody || !sohoSlotTextBody || !sohoFidelityBody) {
      test('soho fidelity: vm extraction succeeded', false);
      results.errors.push('could not extract soho fidelity validator helpers; check names/indenting');
      return;
    }

    var soCtx = {};
    vm.createContext(soCtx);
    vm.runInContext(ipToIntBody, soCtx);
    vm.runInContext(maskToIntBody, soCtx);
    vm.runInContext(inSubnetBody, soCtx);
    vm.runInContext(resolveSlotBody, soCtx);
    vm.runInContext(sohoSlotTextBody, soCtx);
    vm.runInContext(sohoFidelityBody, soCtx);
    vm.runInContext('globalThis.__sohoFidelity = simLabValidateSohoFidelity;', soCtx);
    var simLabValidateSohoFidelity = soCtx.__sohoFidelity;

    var _soScn = { soho: { subnet:{ networkId:'192.168.1.0', mask:'255.255.255.0' }, routerIp:'192.168.1.1',
        statics:[{ ip:'192.168.1.200' }], clientCount: 18, require:{ ssid:'BluebirdOffice', security:'WPA3-Personal' } },
      steps: [
        { id:'w', type:'configure', points:1, prompt:'p', explanation:'e',
          payload:{ slots:[
            { id:'ssid', label:'SSID', options:[{id:'a',text:'BluebirdOffice'},{id:'b',text:'Bluebird-Guest'}] },
            { id:'security', label:'Security', options:[{id:'a',text:'WPA3-Personal'},{id:'b',text:'WEP'}] } ] },
          answer:{ slots:{ ssid:'a', security:'a' } } },
        { id:'l', type:'configure', points:1, prompt:'p', explanation:'e',
          payload:{ slots:[
            { id:'dhcpStart', label:'Start', options:[{id:'a',text:'192.168.1.100'},{id:'b',text:'192.168.1.1'}] },
            { id:'dhcpEnd', label:'End', options:[{id:'a',text:'192.168.1.199'},{id:'b',text:'192.168.1.254'}] },
            { id:'fwdTo', label:'Forward', options:[{id:'a',text:'192.168.1.200 : 443'},{id:'b',text:'10.0.0.9 : 443'}] } ] },
          answer:{ slots:{ dhcpStart:'a', dhcpEnd:'a', fwdTo:'a' } } } ] };
    assert(simLabValidateSohoFidelity(_soScn).ok === true, 'soho: sound keyed config passes');
    var _soBad = JSON.parse(JSON.stringify(_soScn)); _soBad.steps[1].answer.slots.dhcpEnd = 'b';   // .254 swallows the NVR .200
    assert(simLabValidateSohoFidelity(_soBad).ok === false, 'soho: pool covering a static reservation rejected');
    var _soBad2 = JSON.parse(JSON.stringify(_soScn)); _soBad2.steps[1].answer.slots.fwdTo = 'b';   // off-subnet target
    assert(simLabValidateSohoFidelity(_soBad2).ok === false, 'soho: forward target outside the LAN rejected');
    var _soBad3 = JSON.parse(JSON.stringify(_soScn)); _soBad3.steps[0].answer.slots.ssid = 'b';
    assert(simLabValidateSohoFidelity(_soBad3).ok === false, 'soho: keyed ssid mismatching requirement rejected');

  } catch (err) {
    test('soho fidelity validator: vm smoke test (threw)', false);
    results.errors.push('soho fidelity validator smoke test threw: ' + err.message);
  }
})();

(function () {
  var grab = function (n) { return _fnBody(js, n); };
  var cliBody = grab('simLabValidateCliFaultFidelity');
  var sigVar = (js.match(/var _CLI_FAULT_SIG = \{[\s\S]*?\n\s*\};/) || [''])[0];
  if (!cliBody || !sigVar) { results.errors.push('could not extract simLabValidateCliFaultFidelity/_CLI_FAULT_SIG'); return; }
  var vm = require('vm');
  var cCtx = {}; vm.createContext(cCtx);
  vm.runInContext(grab('_isNonEmptyStr') + '\n' + grab('_slFidelityResolveSlot') + '\n' + sigVar + '\n' + grab('_cliExcerptText') + '\n' + grab('_cliNeedlesMet') + '\n' + cliBody, cCtx);
  vm.runInContext('globalThis.__cli = simLabValidateCliFaultFidelity;', cCtx);
  var cli = cCtx.__cli;
  var assert = function (cond, msg) { test(msg, !!cond); };

  var scn = { cliFault: { fault: 'duplex' },
    assets: { reference: { kind: 'terminal', host: 'h', session: 's', reveal: 'external',
      excerpts: [
        { id: 'ipconfig', promptLine: 'C:\\> ipconfig', reveal: 'ipconfig', necessary: true,
          lines: [ { id: 'i1', text: 'Link Speed: 1.0 Gbps / Full Duplex', highlight: 'good', select: false } ] },
        { id: 'showint', promptLine: 'SW-2# show interfaces Gi0/14', reveal: 'showint', necessary: true,
          lines: [ { id: 's1', text: 'Half-duplex, 100Mb/s', highlight: 'hot', select: false },
                   { id: 's2', text: '2471 late collisions', highlight: 'hot', select: false } ] },
        { id: 'tracert', promptLine: 'C:\\> tracert 8.8.8.8', reveal: 'tracert', necessary: false,
          lines: [ { id: 't1', text: 'path intact', select: false } ] }
      ] } },
    steps: [ { id: 'dx', type: 'configure', points: 1,
      payload: { slots: [
        { id: 'rootCause', label: 'Root cause', options: [{ id: 'a', text: 'Duplex mismatch' }, { id: 'b', text: 'DNS failure' }] },
        { id: 'fix', label: 'Fix', options: [{ id: 'a', text: 'Set both ends to auto-negotiate duplex' }, { id: 'b', text: 'Flush DNS cache' }] } ] },
      answer: { slots: { rootCause: 'a', fix: 'a' } } } ] };
  assert(cli(scn).ok === true, 'cli: sound duplex scenario passes');
  var bad1 = JSON.parse(JSON.stringify(scn)); bad1.steps[0].answer.slots.rootCause = 'b';
  assert(cli(bad1).ok === false, 'cli: rootCause not matching fault signature rejected');
  var bad2 = JSON.parse(JSON.stringify(scn));
  bad2.assets.reference.excerpts[1].lines = [{ id: 's1', text: 'Full-duplex, 1000Mb/s', select: false }];
  assert(cli(bad2).ok === false, 'cli: necessary excerpt missing the fault signature fact rejected');
  var bad3 = JSON.parse(JSON.stringify(scn)); bad3.assets.reference.excerpts[0].necessary = true;
  bad3.assets.reference.excerpts[2].necessary = true;   // tracert (redundant) marked necessary
  assert(cli(bad3).ok === false, 'cli: a redundant excerpt marked necessary breaks minimal-cover');
})();

(function () {
  var grab = function (n) { return _fnBody(js, n); };
  var body = [grab('_isNonEmptyStr'), grab('_slFidelityResolveSlot'),
    grab('_discoLineFacts'), grab('_discoDerivePort'), grab('simLabValidateDiscoveryAuditFidelity')].join('\n');
  if (body.indexOf('simLabValidateDiscoveryAuditFidelity') === -1) { results.errors.push('could not extract discovery validator'); return; }
  var vm = require('vm');
  var dCtx = {}; vm.createContext(dCtx); vm.runInContext(body, dCtx);
  vm.runInContext('globalThis.__disco = simLabValidateDiscoveryAuditFidelity;', dCtx);
  var disco = dCtx.__disco;
  var assert = function (cond, msg) { test(msg, !!cond); };

  var scn = {
    disco: { legacyExcerptId: 'csv',
      ports: [ { port: 'Gi0/1', device: 'AP-2', mgmt: '10.0.0.12', source: 'lldp' },
               { port: 'Gi0/5', device: 'silent-host', mgmt: '10.0.0.30', source: 'macarp' } ] },
    assets: { reference: { kind: 'terminal', host: 'SW', session: 's', reveal: 'tabs',
      excerpts: [
        { id: 'lldp', promptLine: 'SW# show lldp', tab: 'lldp', lines: [
          { id: 'll1', text: 'Gi0/1  AP-2  10.0.0.12', select: false, fact: { port: 'Gi0/1', device: 'AP-2', mgmt: '10.0.0.12' } } ] },
        { id: 'mac', promptLine: 'SW# show mac', tab: 'mac', lines: [
          { id: 'm1', text: 'e8ff.1e44.2b90  Gi0/5', select: false, fact: { mac: 'e8ff.1e44.2b90', port: 'Gi0/5' } } ] },
        { id: 'arp', promptLine: 'SW# show arp', tab: 'arp', lines: [
          { id: 'a1', text: '10.0.0.30  e8ff.1e44.2b90', select: false, fact: { ip: '10.0.0.30', mac: 'e8ff.1e44.2b90' } } ] },
        { id: 'csv', promptLine: 'legacy asset CSV', tab: 'csv', lines: [
          { id: 'c1', text: 'Gi0/1,AP-2,10.0.0.12', select: true, fact: { port: 'Gi0/1', device: 'AP-2', mgmt: '10.0.0.12' } },
          { id: 'c2', text: 'Gi0/5,PrintSrv,10.0.0.99', select: true, fact: { port: 'Gi0/5', device: 'PrintSrv', mgmt: '10.0.0.99' } } ] }
      ] } },
    steps: [
      { id: 'rec', type: 'configure', points: 1, payload: { slots: [
        { id: 'Gi0/1__dev', label: 'Gi0/1 dev', options: [{ id: 'a', text: 'AP-2' }, { id: 'b', text: 'PC-9' }] },
        { id: 'Gi0/1__ip', label: 'Gi0/1 ip', options: [{ id: 'a', text: '10.0.0.12' }, { id: 'b', text: '10.0.0.99' }] },
        { id: 'Gi0/5__ip', label: 'Gi0/5 ip', options: [{ id: 'a', text: '10.0.0.30' }, { id: 'b', text: '10.0.0.99' }] } ] },
        answer: { slots: { 'Gi0/1__dev': 'a', 'Gi0/1__ip': 'a', 'Gi0/5__ip': 'a' } } },
      { id: 'aud', type: 'analyze', points: 1, payload: { multi: false, mode: 'excerptLines' },
        answer: { selected: ['c2'] } } ] };
  assert(disco(scn).ok === true, 'disco: sound cross-referenced scenario passes');
  var bad1 = JSON.parse(JSON.stringify(scn)); bad1.steps[0].answer.slots['Gi0/5__ip'] = 'b';   // 10.0.0.99, not the ARP join
  assert(disco(bad1).ok === false, 'disco: keyed silent-host IP not derivable from MAC×ARP rejected');
  var bad2 = JSON.parse(JSON.stringify(scn)); bad2.steps[1].answer.slots = undefined; bad2.steps[1].answer.selected = ['c1'];  // wrong contradicting row
  assert(disco(bad2).ok === false, 'disco: keyed audit line is not the contradicting row rejected');
  var bad3 = JSON.parse(JSON.stringify(scn)); bad3.assets.reference.excerpts[3].lines[1].fact = { port: 'Gi0/5', device: 'silent-host', mgmt: '10.0.0.30' };  // now consistent → zero contradictions
  assert(disco(bad3).ok === false, 'disco: exactly-one-contradiction invariant enforced (zero contradictions rejected)');
})();

(function () {
  var grab = function (n) { return _fnBody(js, n); };
  var sigVar = (js.match(/var _TRIAGE_FAULT_SIG = \{[\s\S]*?\n\s*\};/) || [''])[0];
  var body = [grab('_slFidelityResolveSlot'), grab('_arrEq'), grab('_setEq'), sigVar, grab('_triageEvidenceLines'), grab('simLabValidateEvidenceTriageFidelity')].join('\n');
  if (!sigVar || body.indexOf('simLabValidateEvidenceTriageFidelity') === -1) { results.errors.push('could not extract triage validator'); return; }
  var vm = require('vm');
  var tCtx = {}; vm.createContext(tCtx); vm.runInContext(body, tCtx);
  vm.runInContext('globalThis.__tri = simLabValidateEvidenceTriageFidelity;', tCtx);
  var tri = tCtx.__tri;
  var assert = function (cond, msg) { test(msg, !!cond); };

  var scn = { triage: { fault: 'apipa' },
    assets: { reference: { kind: 'terminal', host: 'LAPTOP', session: 's',
      excerpts: [ { id: 'ipcfg', promptLine: 'C:\\> ipconfig /all', lines: [
        { id: 'e1', text: 'Media State: Media connected', select: true, evidence: false },
        { id: 'e2', text: 'IPv4 Address: 169.254.83.12(Preferred)', select: true, evidence: true },
        { id: 'e3', text: 'Default Gateway:', select: true, evidence: true },
        { id: 'e4', text: 'Description: Intel Wi-Fi 6', select: false, ctx: true } ] } ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1, payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['e2', 'e3'] } },
      { id: 'dx', type: 'configure', points: 1, payload: { slots: [
        { id: 'diagnosis', label: 'Diagnosis', options: [{ id: 'a', text: 'APIPA — no DHCP lease' }, { id: 'b', text: 'Bad DNS server' }] },
        { id: 'firstMove', label: 'First move', options: [{ id: 'a', text: 'Run ipconfig /renew' }, { id: 'b', text: 'Replace the NIC' }] } ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } } ] };
  assert(tri(scn).ok === true, 'triage: sound APIPA scenario passes');
  var bad1 = JSON.parse(JSON.stringify(scn)); bad1.steps[0].answer.selected = ['e1', 'e2', 'e3'];  // includes the false trap
  assert(tri(bad1).ok === false, 'triage: keyed selected including an evidence:false trap rejected');
  var bad2 = JSON.parse(JSON.stringify(scn));
  bad2.assets.reference.excerpts[0].lines[0].evidence = true;   // no false distractor left among selectable lines
  bad2.steps[0].answer.selected = ['e1', 'e2', 'e3'];
  assert(tri(bad2).ok === false, 'triage: all-true selectable set (no scored distractor) rejected');
  var bad3 = JSON.parse(JSON.stringify(scn)); bad3.steps[1].answer.slots.firstMove = 'b';
  assert(tri(bad3).ok === false, 'triage: firstMove not following from evidence rejected');
})();

// ── Sim Lab: network reference renderer (Task 6) ──
// The renderer builds SVG as a STRING mounted via _el('div','sl-net', svg), so
// assertions run against that string (read from the .sl-net child's innerHTML),
// plus shim-queried child blocks for the given/CLI panels. Same vm-sandbox +
// DOM-shim pattern as the Task 5 mount test. Read-only: no listeners to drive.
(function () {
  console.log('\n\x1b[1m── Sim Lab: network reference renderer (Task 6) ──\x1b[0m');
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

    // Structural: the stub is gone, real SVG-building landed
    test('net renderer: stub replaced (no sl-ref-stub network branch)',
      !/_slRenderRefNetwork\(ref\)\s*\{\s*return _el\('div', 'sl-ref-stub', 'network'\)/.test(js));
    test('net renderer: builds an sl-net-svg element',
      /sl-net-svg/.test(js));
    test('net renderer: defines the attack arrow marker',
      /id="sl-net-arrow"/.test(js));
    test('net renderer: glyph map present',
      /_SL_NET_GLYPHS/.test(js));

    // ── DEV FIXTURE — Net+ Mercer & Hale branch (derived from
    // mockups/diagram-pbq-concept.html). LABELED dev fixture for this test only.
    // PC-2 is the flagged host → state 'compromised'; one synthetic 'attack'
    // link exercises that path. Two distinct zones (v10 Staff, v20 Guest);
    // RTR-1 has no zone (sits outside both, like the mockup gateway).
    var _netFix = {
      kind: 'network',
      devices: [
        { id: 'rtr', label: 'RTR-1', type: 'router', x: 1, y: 0, ip: 'gw .10.1 / .20.1' },
        { id: 'swa', label: 'SW-A', type: 'switch', zone: 'VLAN 10 Staff', x: 0, y: 1, ip: 'access v10' },
        { id: 'swb', label: 'SW-B', type: 'switch', zone: 'VLAN 20 Guest', x: 2, y: 1, ip: 'access v20' },
        { id: 'fs1', label: 'FS-1', type: 'server', zone: 'VLAN 10 Staff', x: 0, y: 2, ip: '.10.20' },
        { id: 'pc2', label: 'PC-2', type: 'pc', zone: 'VLAN 10 Staff', x: 1, y: 2, ip: '.20.45 ?', state: 'compromised' },
        { id: 'pc7', label: 'PC-7', type: 'pc', zone: 'VLAN 20 Guest', x: 2, y: 2, ip: '.20.31' }
      ],
      links: [
        { from: 'rtr', to: 'swa' },
        { from: 'rtr', to: 'swb' },
        { from: 'swa', to: 'fs1' },
        { from: 'swa', to: 'pc2', kind: 'attack' },
        { from: 'swb', to: 'pc7' }
      ],
      given: {
        networkId: '192.168.10.0',
        mask: '255.255.255.0  (/24)',
        cli: ['PC-2> ipconfig', '  IPv4 Address . . : 192.168.20.45', 'PC-2> ping 192.168.10.20', '  Request timed out.']
      }
    };

    var refNetBody = grab('_slRenderRefNetwork');
    var elBody     = grab('_el');
    var escBody    = grabLine('_esc');

    if (!refNetBody || !elBody || !escBody) {
      test('net renderer: vm extraction succeeded', false);
      results.errors.push('could not extract _slRenderRefNetwork / helpers; check names/indenting');
      return;
    }

    // Minimal DOM shim — _el needs createElement + className/innerHTML/appendChild.
    // _esc() does `d.textContent = s; return d.innerHTML;`, so the textContent
    // setter must populate innerHTML with HTML-escaped text for escaping to work.
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

    var nCtx = { document: docShim, window: { CSS: null }, Object: Object, Array: Array, String: String };
    vm.createContext(nCtx);
    vm.runInContext(elBody, nCtx);
    vm.runInContext(escBody, nCtx);
    vm.runInContext(refNetBody, nCtx);
    nCtx.fix = _netFix;
    var rootEl = vm.runInContext('_slRenderRefNetwork(fix);', nCtx);

    // .sl-net child holds the SVG string in innerHTML
    var netDiv = rootEl._children.filter(function (c) { return c.className === 'sl-net'; })[0];
    var svg = netDiv ? netDiv.innerHTML : '';

    test('net renderer: returns an sl-net-ref root', rootEl && rootEl.className === 'sl-net-ref');
    test('net renderer: emits an <svg> with a computed viewBox',
      /<svg class="sl-net-svg" viewBox="0 0 \d+ \d+"/.test(svg));

    // one .sl-node group per device (6) — match the <g> opener, not sub-elements
    var nodeCount = (svg.match(/<g class="sl-node/g) || []).length;
    test('net renderer: one .sl-node per device (6)', nodeCount === 6);

    // compromised device gets the compromised class
    test('net renderer: compromised device gets compromised class',
      /class="sl-node compromised"/.test(svg));

    // attack link gets the attack class + arrow marker
    test('net renderer: attack link gets .sl-link.attack class',
      /class="sl-link attack"/.test(svg));
    test('net renderer: attack link references the arrow marker',
      /marker-end="url\(#sl-net-arrow\)"/.test(svg));

    // one zone rect per distinct zone (2: v10, v20)
    var zoneCount = (svg.match(/class="sl-vlan-zone"/g) || []).length;
    test('net renderer: one zone rect per distinct zone (2)', zoneCount === 2);
    test('net renderer: zone label uppercased', /VLAN 10 STAFF/.test(svg));

    // RTR-1 has no zone → still rendered as a node, but not inside a zone count
    test('net renderer: zoneless device still renders (RTR-1 node present)',
      /sl-node-name[^>]*>RTR-1</.test(svg));

    // node labels + ips escaped & present
    test('net renderer: device label rendered', /sl-node-name[^>]*>PC-2</.test(svg));
    test('net renderer: device ip rendered', /sl-node-ip[^>]*>\.20\.45 \?</.test(svg));

    // glyph per node type (router/switch/server/pc all drawn)
    test('net renderer: node glyph paths drawn', (svg.match(/class="sl-glyph"/g) || []).length === 6);

    // given panel
    var givenDiv = rootEl._children.filter(function (c) { return c.className === 'sl-net-given'; })[0];
    test('net renderer: given panel rendered with Network ID + mask',
      !!givenDiv && /Network ID/.test(givenDiv.innerHTML) && /192\.168\.10\.0/.test(givenDiv.innerHTML) && /255\.255\.255\.0/.test(givenDiv.innerHTML));

    // CLI block lines present + escaped
    var cliDiv = rootEl._children.filter(function (c) { return c.className === 'sl-net-cli'; })[0];
    test('net renderer: given CLI lines appear',
      !!cliDiv && /PC-2&gt; ipconfig/.test(cliDiv.innerHTML) && /Request timed out\./.test(cliDiv.innerHTML));

    // ── arbitrary-scenario smoke: a totally different shape still renders ──
    var _altFix = {
      kind: 'network',
      devices: [
        { id: 'fw', label: 'FW', type: 'firewall', x: 1, y: 0 },
        { id: 'srv', label: 'SRV', type: 'server', zone: 'DMZ', x: 0, y: 1 },
        { id: 'wks', label: 'WKS', type: 'pc', zone: 'LAN', x: 2, y: 1, state: 'affected' }
      ],
      links: [{ from: 'fw', to: 'srv' }, { from: 'fw', to: 'wks' }]
    };
    nCtx.alt = _altFix;
    var altRoot = vm.runInContext('_slRenderRefNetwork(alt);', nCtx);
    var altNet = altRoot._children.filter(function (c) { return c.className === 'sl-net'; })[0];
    var altSvg = altNet ? altNet.innerHTML : '';
    test('net renderer: arbitrary scenario renders all nodes',
      (altSvg.match(/<g class="sl-node/g) || []).length === 3);
    test('net renderer: affected device gets affected class',
      /class="sl-node affected"/.test(altSvg));
    test('net renderer: arbitrary scenario zones (DMZ + LAN)',
      (altSvg.match(/class="sl-vlan-zone"/g) || []).length === 2);
    test('net renderer: unknown-coordinate firewall glyph drawn (no crash, 3 glyphs)',
      (altSvg.match(/class="sl-glyph"/g) || []).length === 3);
    test('net renderer: scenario without given renders no given/cli panel',
      altRoot._children.every(function (c) { return c.className !== 'sl-net-given' && c.className !== 'sl-net-cli'; }));

  } catch (err) {
    test('net renderer: vm smoke test (threw)', false);
    results.errors.push('network renderer smoke test threw: ' + err.message);
  }
})();

// ── Sim Lab: timeline reference renderer (Task 7) ──
// The renderer builds HTML as a STRING mounted via _el('div','sl-timeline', str),
// so assertions run against innerHTML strings. Same vm-sandbox + DOM-shim pattern
// as the Task 6 network renderer. Read-only: no listeners.
(function () {
  console.log('\n\x1b[1m── Sim Lab: timeline reference renderer (Task 7) ──\x1b[0m');
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

    // Structural: stub is gone, real markup builder landed
    test('tl renderer: stub replaced (no sl-ref-stub timeline branch)',
      !/_slRenderRefTimeline\(ref\)\s*\{\s*return _el\('div', 'sl-ref-stub', 'timeline'\)/.test(js));
    test('tl renderer: builds an sl-timeline element',
      /sl-timeline/.test(js));
    test('tl renderer: builds sl-stage elements',
      /sl-stage/.test(js));
    test('tl renderer: builds sl-dot elements',
      /sl-dot/.test(js));
    test('tl renderer: builds sl-sevtag elements',
      /sl-sevtag/.test(js));

    // ── DEV FIXTURE — IR scenario (4 stages, mixed severities, derived from
    // mockups/incident-response-pbq-concept.html). LABELED dev fixture: Task 7.
    var _tlFix = {
      kind: 'timeline',
      stages: [
        { id: 's1', icon: '!', label: 'User on WKS-04 opened the attachment "Invoice_4471.xlsm" and enabled macros.', time: '09:14', severity: 'med' },
        { id: 's2', icon: '!', label: 'WKS-04 ran an unsigned executable; EDR flagged a known dropper hash.', time: '09:21', severity: 'high' },
        { id: 's3', icon: '!', label: 'WKS-04 opened SMB sessions to SRV-FILE using a finance account.', time: '09:48', severity: 'high' },
        { id: 's4', icon: '!', label: 'SRV-FILE began bulk file writes, then a large outbound transfer to an external host (185.x.x.x).', time: '10:05', severity: 'crit' }
      ]
    };

    var refTlBody = grab('_slRenderRefTimeline');
    var elBody    = grab('_el');
    var escBody   = grabLine('_esc');

    if (!refTlBody || !elBody || !escBody) {
      test('tl renderer: vm extraction succeeded', false);
      results.errors.push('could not extract _slRenderRefTimeline / helpers; check names/indenting');
      return;
    }

    // Minimal DOM shim — identical to Task 6 network renderer pattern.
    // _el needs createElement + className/innerHTML/appendChild.
    // _esc() does `d.textContent = s; return d.innerHTML;` so the textContent
    // setter must populate innerHTML with HTML-escaped text for escaping to work.
    var htmlEscTl = function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    var makeElTl = function (tag) {
      var attrs = {}, children = [], cls = '', inner = '';
      var el = {
        tagName: tag.toUpperCase(),
        get className() { return cls; },
        set className(v) { cls = v; },
        get innerHTML() { return inner; },
        set innerHTML(v) { inner = v; children = []; },
        get textContent() { return ''; },
        set textContent(v) { inner = htmlEscTl(v); },
        style: {},
        get _children() { return children; },
        setAttribute: function (k, v) { attrs[k] = v; },
        getAttribute: function (k) { return attrs[k] || null; },
        appendChild: function (c) { children.push(c); return c; }
      };
      return el;
    };
    var docShimTl = { createElement: function (tag) { return makeElTl(tag); } };

    var tCtx = { document: docShimTl, window: { CSS: null }, Object: Object, Array: Array, String: String };
    vm.createContext(tCtx);
    vm.runInContext(elBody, tCtx);
    vm.runInContext(escBody, tCtx);
    vm.runInContext(refTlBody, tCtx);
    tCtx.fix = _tlFix;
    var rootEl = vm.runInContext('_slRenderRefTimeline(fix);', tCtx);

    // Root is an sl-timeline container. The renderer uses _el('div','sl-timeline',markupStr)
    // which sets innerHTML to the markup string — stages live in innerHTML, not _children.
    test('tl renderer: returns an sl-timeline root', rootEl && rootEl.className === 'sl-timeline');

    var markup = rootEl ? rootEl.innerHTML : '';

    // Count stage divs by matching the class attribute opener
    var stageCount = (markup.match(/class="sl-stage /g) || []).length;
    test('tl renderer: one .sl-stage per stage entry (4)', stageCount === 4);

    // Each severity class appears at the right index
    // The stages are emitted in order; check the markup has each sev class
    test('tl renderer: sev-med class present (stage 1)', /sev-med/.test(markup));
    test('tl renderer: sev-high class present (stages 2+3)', /sev-high/.test(markup));
    test('tl renderer: sev-crit class present (stage 4)', /sev-crit/.test(markup));

    // Last stage has no .sl-line.  Split on </div> boundaries to isolate the last stage.
    // The last stage div (sev-crit) appears last in markup; verify sl-line is absent in it.
    var lastStagePart = markup.slice(markup.lastIndexOf('sev-crit'));
    test('tl renderer: last stage has no .sl-line', !/sl-line/.test(lastStagePart));

    // Earlier stages DO have an sl-line — first stage (sev-med) contains sl-line
    var firstStagePart = markup.slice(markup.indexOf('sev-med'));
    test('tl renderer: non-last stage has .sl-line', /sl-line/.test(firstStagePart));

    // Labels escaped and present
    test('tl renderer: labels present (SMB sessions text found)', /SMB sessions/.test(markup));
    test('tl renderer: labels present (185\.x\.x\.x text found)', /185\.x\.x\.x/.test(markup));

    // Time values present
    test('tl renderer: time values rendered (09:14 present)', /09:14/.test(markup));
    test('tl renderer: time values rendered (10:05 present)', /10:05/.test(markup));

    // sevtag elements present
    test('tl renderer: sevtag elements present in markup', /sl-sevtag/.test(markup));

    // Stage with no time field — graceful render (no crash, no sl-when element)
    var _tlNoTime = {
      kind: 'timeline',
      stages: [
        { id: 'x1', icon: '!', label: 'Alert fired.', severity: 'low' },
        { id: 'x2', icon: '!', label: 'Analyst investigated.', severity: 'high' }
      ]
    };
    tCtx.fix2 = _tlNoTime;
    var rootEl2 = vm.runInContext('_slRenderRefTimeline(fix2);', tCtx);
    var markup2 = rootEl2 ? rootEl2.innerHTML : '';
    var stageCount2 = (markup2.match(/class="sl-stage /g) || []).length;
    test('tl renderer: renders without time field (2 stages)', stageCount2 === 2);
    test('tl renderer: first stage of no-time fix gets sev-low', /sev-low/.test(markup2));
    test('tl renderer: no sl-when rendered when time is absent', !/sl-when/.test(markup2));

  } catch (err) {
    test('tl renderer: vm smoke test (threw)', false);
    results.errors.push('timeline renderer smoke test threw: ' + err.message);
  }
})();

// ── Sim Lab: layered defense-in-depth reference renderer (Task 8) ──
// Renderer builds an SVG string mounted via _el('div','sl-layered',svgStr).
// Same vm-sandbox + DOM-shim pattern as Tasks 6 & 7. Read-only.
(function () {
  console.log('\n\x1b[1m── Sim Lab: layered defense-in-depth reference renderer (Task 8) ──\x1b[0m');
  try {
    var vm = require('vm');

    var grab = function (name) {
      // De-indented feature source: function closes at \n} (0 spaces, same as Task 6/7)
      var re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}');
      return (js.match(re) || [''])[0];
    };
    var grabLine = function (name) {
      var re = new RegExp('function ' + name + '\\([^\\n]*\\)\\s*\\{[^\\n]*\\}');
      return (js.match(re) || [''])[0];
    };

    // Structural: stub is gone, real markup builder landed
    test('layered renderer: stub replaced (no sl-ref-stub layered branch)',
      !/_slRenderRefLayered\(ref\)\s*\{\s*return _el\('div', 'sl-ref-stub', 'layered'\)/.test(js));
    test('layered renderer: builds an sl-layered element',
      /sl-layered/.test(js));
    test('layered renderer: builds sl-layer elements',
      /sl-layer/.test(js));
    test('layered renderer: builds sl-misslayer elements',
      /sl-misslayer/.test(js));
    test('layered renderer: builds sl-core element',
      /sl-core/.test(js));
    test('layered renderer: builds sl-dev elements',
      /sl-dev/.test(js));

    // ── DEV FIXTURE A — Net+ DID scenario ──
    // Derived from defense-in-depth-netplus-concept.html:
    // perimeter present, DMZ/VLAN layer missing, exposed asset in core.
    var _netFix = {
      kind: 'layered',
      layers: [
        { id: 'perimeter', label: 'Perimeter',  control: 'Firewall / IDS', state: 'present' },
        { id: 'dmz',       label: 'DMZ',         control: 'Proxy / WAF',   state: 'missing' }
      ],
      core: {
        label: 'Internal LAN',
        assets: [
          { id: 'web1', label: 'WEB-1', exposed: true },
          { id: 'db1',  label: 'DB-1',  exposed: false }
        ]
      }
    };

    // ── DEV FIXTURE B — Sec+ DID scenario ──
    // Derived from defense-in-depth-secplus-concept.html:
    // perimeter present, 3 inner layers missing, 2 exposed core assets.
    var _secFix = {
      kind: 'layered',
      layers: [
        { id: 'perimeter', label: 'Perimeter',  state: 'present' },
        { id: 'endpoint',  label: 'Endpoint',   control: 'EDR / hardening',        state: 'missing' },
        { id: 'data',      label: 'Data',        control: 'encryption + DLP',       state: 'missing' },
        { id: 'identity',  label: 'Identity',    control: 'MFA / least privilege',  state: 'missing' }
      ],
      core: {
        label: 'Crown-jewel data',
        assets: [
          { id: 'hr',  label: 'HR DB',   exposed: true },
          { id: 'fin', label: 'FIN SRV', exposed: true }
        ]
      }
    };

    var refLyrBody = grab('_slRenderRefLayered');
    var elBody     = grab('_el');
    var escBody    = grabLine('_esc');

    if (!refLyrBody || !elBody || !escBody) {
      test('layered renderer: vm extraction succeeded', false);
      results.errors.push('could not extract _slRenderRefLayered / helpers; check names/indenting');
      return;
    }

    // Minimal DOM shim (same pattern as Tasks 6 & 7)
    var htmlEscLyr = function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    var makeElLyr = function (tag) {
      var attrs = {}, children = [], cls = '', inner = '';
      var el = {
        tagName: tag.toUpperCase(),
        get className() { return cls; },
        set className(v) { cls = v; },
        get innerHTML() { return inner; },
        set innerHTML(v) { inner = v; children = []; },
        get textContent() { return ''; },
        set textContent(v) { inner = htmlEscLyr(v); },
        style: {},
        get _children() { return children; },
        setAttribute: function (k, v) { attrs[k] = v; },
        getAttribute: function (k) { return attrs[k] || null; },
        appendChild: function (c) { children.push(c); return c; }
      };
      return el;
    };
    var docShimLyr = { createElement: function (tag) { return makeElLyr(tag); } };

    var lCtx = { document: docShimLyr, window: { CSS: null }, Object: Object, Array: Array, String: String, Math: Math };
    vm.createContext(lCtx);
    vm.runInContext(elBody, lCtx);
    vm.runInContext(escBody, lCtx);
    vm.runInContext(refLyrBody, lCtx);

    // ── Fixture A (Net+) assertions ──
    lCtx.fixA = _netFix;
    var rootA = vm.runInContext('_slRenderRefLayered(fixA);', lCtx);

    test('layered renderer A: returns an sl-layered root',
      rootA && rootA.className === 'sl-layered');

    var svgA = rootA ? rootA.innerHTML : '';

    // SVG present with viewBox
    test('layered renderer A: SVG emitted with viewBox',
      /viewBox="0 0 \d+ \d+"/.test(svgA));

    // One frame rect per layer (2 layers)
    var layerRectsA = (svgA.match(/class="sl-layer"/g) || []).length;
    var missRectsA  = (svgA.match(/class="sl-misslayer"/g) || []).length;
    test('layered renderer A: present layer gets sl-layer rect (1)',  layerRectsA === 1);
    test('layered renderer A: missing layer gets sl-misslayer rect (1)', missRectsA === 1);

    // Core present
    test('layered renderer A: core rect rendered',
      /sl-core/.test(svgA));

    // Exposed asset gets exposed class
    test('layered renderer A: exposed asset gets exposed class on <g>',
      /class="sl-dev exposed"/.test(svgA));

    // Labels present and escaped
    test('layered renderer A: perimeter label rendered',  /Perimeter/.test(svgA));
    test('layered renderer A: DMZ label rendered',        /DMZ/.test(svgA));
    test('layered renderer A: core label rendered',       /Internal LAN/.test(svgA));
    test('layered renderer A: asset label WEB-1 rendered', /WEB-1/.test(svgA));

    // missing tag shown on the missing layer label
    test('layered renderer A: missing marker on DMZ label',
      /sl-misslayer-tag/.test(svgA));

    // ── Fixture B (Sec+) assertions — proves data-driven, not hardcoded ──
    lCtx.fixB = _secFix;
    var rootB = vm.runInContext('_slRenderRefLayered(fixB);', lCtx);

    test('layered renderer B: returns an sl-layered root',
      rootB && rootB.className === 'sl-layered');

    var svgB = rootB ? rootB.innerHTML : '';

    // 1 present + 3 missing layers
    var layerRectsB = (svgB.match(/class="sl-layer"/g) || []).length;
    var missRectsB  = (svgB.match(/class="sl-misslayer"/g) || []).length;
    test('layered renderer B: 1 present layer rect',       layerRectsB === 1);
    test('layered renderer B: 3 missing layer rects',      missRectsB === 3);

    // Core is exposed (both assets exposed → core-exposed class)
    test('layered renderer B: core-exposed class rendered', /sl-core-exposed/.test(svgB));

    // Both exposed assets get exposed class
    var expDevsB = (svgB.match(/class="sl-dev exposed"/g) || []).length;
    test('layered renderer B: 2 exposed asset nodes', expDevsB === 2);

    // Labels from Sec+ fixture
    test('layered renderer B: Identity label rendered', /Identity/.test(svgB));
    test('layered renderer B: Crown-jewel data label rendered', /Crown-jewel data/.test(svgB));
    test('layered renderer B: FIN SRV asset label rendered', /FIN SRV/.test(svgB));

    // viewBox is larger for Sec+ (4 layers) than Net+ (2 layers) — proves scaling
    var vbA = svgA.match(/viewBox="0 0 (\d+) (\d+)"/);
    var vbB = svgB.match(/viewBox="0 0 (\d+) (\d+)"/);
    test('layered renderer: Sec+ (4 layers) viewBox wider than Net+ (2 layers)',
      vbA && vbB && parseInt(vbB[1], 10) > parseInt(vbA[1], 10));
    test('layered renderer: Sec+ (4 layers) viewBox taller than Net+ (2 layers)',
      vbA && vbB && parseInt(vbB[2], 10) > parseInt(vbA[2], 10));

    // XSS: label escaping
    var xssFix = {
      kind: 'layered',
      layers: [{ id: 'x', label: '<script>alert(1)</script>', state: 'present' }],
      core: { label: '<b>core</b>', assets: [{ id: 'a', label: '<img>', exposed: false }] }
    };
    lCtx.xssFix = xssFix;
    var rootX = vm.runInContext('_slRenderRefLayered(xssFix);', lCtx);
    var svgX  = rootX ? rootX.innerHTML : '';
    test('layered renderer: layer label XSS-escaped',
      !/<script>/.test(svgX) && /&lt;script&gt;/.test(svgX));
    test('layered renderer: core label XSS-escaped',
      !/<b>/.test(svgX) && /&lt;b&gt;/.test(svgX));

  } catch (err) {
    test('layered renderer: vm smoke test (threw)', false);
    results.errors.push('layered renderer smoke test threw: ' + err.message);
  }
})();

// ── Sim Lab: layered defense-in-depth "stacked-bands" reference renderer ──
// Faithful lift of mockups/defense-in-depth-secplus-concept.html: a
// perimeter frame + a vertical stack of interior bands + an exposed-core
// band. Data-driven via ref.layout — 'stacked' routes here, absent/other
// (e.g. 'nested') keeps routing to the existing nested renderer (Task 8).
// Same vm-sandbox + DOM-shim pattern as Task 8. Read-only.
(function () {
  console.log('\n\x1b[1m── Sim Lab: layered defense-in-depth stacked-bands renderer ──\x1b[0m');
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

    test('stacked renderer: _slRenderRefLayeredStacked defined',
      /function _slRenderRefLayeredStacked\(/.test(js));

    // ── DEV FIXTURE — Sec+ DID scenario, stacked layout ──
    // layers[0] = perimeter (present), layers[1..] = 3 interior bands
    // (2 missing, 1 present — proves present/missing both render), core has
    // 2 assets, 1 exposed.
    var _stackedFix = {
      kind: 'layered',
      layout: 'stacked',
      layers: [
        { id: 'perimeter', label: 'Perimeter', control: 'Next-gen firewall', state: 'present' },
        { id: 'endpoint',  label: 'Endpoint',  control: 'EDR / hardening',       state: 'missing' },
        { id: 'data',      label: 'Data',      control: 'encryption + DLP',      state: 'present' },
        { id: 'identity',  label: 'Identity',  control: 'MFA / least privilege', state: 'missing' }
      ],
      core: {
        label: 'Crown-jewel data',
        assets: [
          { id: 'db1', label: 'DB-1', exposed: true },
          { id: 'dc1', label: 'DC-1', exposed: false }
        ]
      }
    };

    var refStackedBody = grab('_slRenderRefLayeredStacked');
    var elBody          = grab('_el');
    var escBody         = grabLine('_esc');

    if (!refStackedBody || !elBody || !escBody) {
      test('stacked renderer: vm extraction succeeded', false);
      results.errors.push('could not extract _slRenderRefLayeredStacked / helpers; check names/indenting');
      return;
    }

    var htmlEscSt = function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    var makeElSt = function (tag) {
      var attrs = {}, children = [], cls = '', inner = '';
      var el = {
        tagName: tag.toUpperCase(),
        get className() { return cls; },
        set className(v) { cls = v; },
        get innerHTML() { return inner; },
        set innerHTML(v) { inner = v; children = []; },
        get textContent() { return ''; },
        set textContent(v) { inner = htmlEscSt(v); },
        style: {},
        get _children() { return children; },
        setAttribute: function (k, v) { attrs[k] = v; },
        getAttribute: function (k) { return attrs[k] || null; },
        appendChild: function (c) { children.push(c); return c; }
      };
      return el;
    };
    var docShimSt = { createElement: function (tag) { return makeElSt(tag); } };

    var sCtx = { document: docShimSt, window: { CSS: null }, Object: Object, Array: Array, String: String, Math: Math };
    vm.createContext(sCtx);
    vm.runInContext(elBody, sCtx);
    vm.runInContext(escBody, sCtx);
    vm.runInContext(refStackedBody, sCtx);

    sCtx.fixStacked = _stackedFix;
    var rootSt = vm.runInContext('_slRenderRefLayeredStacked(fixStacked);', sCtx);

    test('stacked renderer: returns an sl-stacked root',
      rootSt && rootSt.className === 'sl-stacked');

    var svgSt = rootSt ? rootSt.innerHTML : '';

    test('stacked renderer: SVG emitted with viewBox',
      /viewBox="0 0 \d+ \d+"/.test(svgSt));

    // Perimeter frame present
    test('stacked renderer: perimeter frame rendered (sl-perim)',
      /class="sl-perim"/.test(svgSt));
    test('stacked renderer: perimeter label rendered',
      /Perimeter/.test(svgSt));

    // One band per interior layer (3 bands: endpoint missing, data present, identity missing)
    var bandRects = (svgSt.match(/class="sl-band"/g) || []).length;
    var missBandRects = (svgSt.match(/class="sl-band-missing"/g) || []).length;
    test('stacked renderer: 1 present interior band (sl-band)', bandRects === 1);
    test('stacked renderer: 2 missing interior bands (sl-band-missing)', missBandRects === 2);
    test('stacked renderer: total interior bands === layers.length - 1',
      (bandRects + missBandRects) === (_stackedFix.layers.length - 1));

    // Band labels rendered
    test('stacked renderer: Endpoint band label rendered', /Endpoint/.test(svgSt));
    test('stacked renderer: Data band label rendered', /Data/.test(svgSt));
    test('stacked renderer: Identity band label rendered', /Identity/.test(svgSt));

    // Exposed core (one asset exposed => core-exposed class)
    test('stacked renderer: exposed-core class rendered (sl-core-exposed)',
      /sl-core-exposed/.test(svgSt));
    test('stacked renderer: core label rendered', /Crown-jewel data/.test(svgSt));

    // Device boxes for core assets, exposed one flagged
    test('stacked renderer: DB-1 device box rendered', /DB-1/.test(svgSt));
    test('stacked renderer: DC-1 device box rendered', /DC-1/.test(svgSt));
    test('stacked renderer: exposed device gets exposed class',
      /class="sl-dev exposed"/.test(svgSt));

    // ── Perimeter device box (FW-1, WAF-1, ...) — optional, data-driven ──
    // _stackedFix's perimeter layer has no `device` field, so no .sl-fw
    // should render (backward-compatible default).
    test('stacked renderer: no perimeter device configured => no .sl-fw rendered',
      !/class="sl-fw"/.test(svgSt));

    var _stackedFwFix = {
      kind: 'layered',
      layout: 'stacked',
      layers: [
        { id: 'perimeter', label: 'Perimeter', control: 'Next-gen firewall', state: 'present', device: { label: 'FW-1' } }
      ],
      core: { label: 'Core', assets: [] }
    };
    sCtx.fixStackedFw = _stackedFwFix;
    var rootStFw = vm.runInContext('_slRenderRefLayeredStacked(fixStackedFw);', sCtx);
    var svgStFw = rootStFw ? rootStFw.innerHTML : '';
    test('stacked renderer: perimeter device configured => .sl-fw rendered',
      /class="sl-fw"/.test(svgStFw));
    test('stacked renderer: .sl-fw contains the escaped device label (FW-1)',
      /class="sl-fw"[\s\S]*?FW-1/.test(svgStFw));

    var _stackedFwXssFix = {
      kind: 'layered',
      layout: 'stacked',
      layers: [
        { id: 'perimeter', label: 'Perimeter', state: 'present', device: { label: '<script>alert(1)</script>' } }
      ],
      core: { label: 'Core', assets: [] }
    };
    sCtx.fixStackedFwXss = _stackedFwXssFix;
    var rootStFwX = vm.runInContext('_slRenderRefLayeredStacked(fixStackedFwXss);', sCtx);
    var svgStFwX = rootStFwX ? rootStFwX.innerHTML : '';
    test('stacked renderer: .sl-fw device label is XSS-escaped',
      !/<script>/.test(svgStFwX) && /&lt;script&gt;/.test(svgStFwX));

    // ── Safe-core fixture: no assets exposed => sl-core (not sl-core-exposed) ──
    var _safeCoreFix = {
      kind: 'layered', layout: 'stacked',
      layers: [{ id: 'perimeter', label: 'Perimeter', state: 'present' }],
      core: { label: 'Safe core', assets: [{ id: 'a1', label: 'SRV-1', exposed: false }] }
    };
    sCtx.fixSafe = _safeCoreFix;
    var rootSafe = vm.runInContext('_slRenderRefLayeredStacked(fixSafe);', sCtx);
    var svgSafe = rootSafe ? rootSafe.innerHTML : '';
    test('stacked renderer: safe core (no exposed assets) gets sl-core, not sl-core-exposed',
      /class="sl-core"/.test(svgSafe) && !/sl-core-exposed/.test(svgSafe));

    // XSS: label escaping
    var xssStFix = {
      kind: 'layered', layout: 'stacked',
      layers: [
        { id: 'x', label: '<script>alert(1)</script>', state: 'present' },
        { id: 'y', label: '<i>band</i>', state: 'missing' }
      ],
      core: { label: '<b>core</b>', assets: [{ id: 'a', label: '<img>', exposed: false }] }
    };
    sCtx.xssStFix = xssStFix;
    var rootStX = vm.runInContext('_slRenderRefLayeredStacked(xssStFix);', sCtx);
    var svgStX  = rootStX ? rootStX.innerHTML : '';
    test('stacked renderer: perimeter label XSS-escaped',
      !/<script>/.test(svgStX) && /&lt;script&gt;/.test(svgStX));
    test('stacked renderer: band label XSS-escaped',
      !/<i>band<\/i>/.test(svgStX) && /&lt;i&gt;band&lt;\/i&gt;/.test(svgStX));
    test('stacked renderer: core label XSS-escaped',
      !/<b>core<\/b>/.test(svgStX) && /&lt;b&gt;core&lt;\/b&gt;/.test(svgStX));

    // ── Regression: layered ref WITHOUT layout still routes to nested renderer ──
    var refNestedBody = grab('_slRenderRefLayered');
    var refDispBody    = grab('_slRenderReference');
    if (!refNestedBody || !refDispBody) {
      test('stacked renderer: dispatch regression vm extraction succeeded', false);
      results.errors.push('could not extract _slRenderRefLayered / _slRenderReference for dispatch regression check');
    } else {
      var dCtx = { document: docShimSt, window: { CSS: null }, Object: Object, Array: Array, String: String, Math: Math };
      vm.createContext(dCtx);
      vm.runInContext(elBody, dCtx);
      vm.runInContext(escBody, dCtx);
      vm.runInContext(refNestedBody, dCtx);
      vm.runInContext(refStackedBody, dCtx);
      vm.runInContext(grab('_slRenderRefNetwork'), dCtx);
      vm.runInContext(grab('_slRenderRefTimeline'), dCtx);
      vm.runInContext(refDispBody, dCtx);

      var _noLayoutFix = {
        kind: 'layered',
        layers: [{ id: 'l1', label: 'Perimeter', state: 'present' }],
        core: { label: 'Core', assets: [] }
      };
      dCtx.noLayoutFix = _noLayoutFix;
      var panelNoLayout = vm.runInContext('_slRenderReference(noLayoutFix);', dCtx);
      var childNoLayout = panelNoLayout && panelNoLayout._children && panelNoLayout._children[0];
      test('reference dispatch: layered ref WITHOUT layout still routes to nested renderer (sl-layered)',
        childNoLayout && childNoLayout.className === 'sl-layered');

      dCtx.stackedFix2 = _stackedFix;
      var panelStacked = vm.runInContext('_slRenderReference(stackedFix2);', dCtx);
      var childStacked = panelStacked && panelStacked._children && panelStacked._children[0];
      test('reference dispatch: layered ref WITH layout:"stacked" routes to stacked renderer (sl-stacked)',
        childStacked && childStacked.className === 'sl-stacked');
    }

  } catch (err) {
    test('stacked renderer: vm smoke test (threw)', false);
    results.errors.push('stacked renderer smoke test threw: ' + err.message);
  }
})();

