// tests/uat/320-secplus-simlab-content.js
// Scope: the Security+ Sim Lab bank carries real exam-format PBQs (firewall,
// terminal, secure design, wireless), each passing the same deterministic
// checks the Network+ bank passes.
//
// Why this module exists: at v8.155.0 the Sec+ bank (87 seeds) had no firewall,
// terminal, network-design or wireless PBQs even though the renderers and
// validators shipped for Network+. The 2026-10-11 content waves add them
// (docs/superpowers/specs/2026-10-11-secplus-simlab-content-waves-design.md).
// Every seed also passed a two-reviewer content gate before merge; these tests
// are the part of that gate a machine can re-run on every commit.

const { js, read, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Sim Lab: Security+ exam-format PBQ banks ──\x1b[0m');
  try {
    function fn(name) {
      var m = new RegExp('function\\s+' + name + '\\s*\\(').exec(js);
      if (!m) throw new Error('missing fn ' + name);
      var i = js.indexOf('{', m.index), d = 0, j = i;
      for (; j < js.length; j++) { var c = js[j]; if (c === '{') d++; else if (c === '}') { d--; if (d === 0) { j++; break; } } }
      return js.slice(m.index, j);
    }
    function v(name) {
      var m = new RegExp('var\\s+' + name + '\\s*=\\s*[\\[{][\\s\\S]*?[\\]}];').exec(js);
      if (!m) throw new Error('missing var ' + name);
      return m[0];
    }
    var parts = [v('STEP_TYPES'), v('_WIFI_24_CLEAR'), v('_WIFI_5_CHANNELS'), v('_CLI_FAULT_SIG')];
    ['_isNonEmptyStr', '_validateStepPayload', 'simLabValidateScenario', '_ipToInt', '_maskToInt', '_inSubnet',
      '_slFidelityResolveSlot', 'simLabValidateNetworkFidelity', 'simLabValidateWirelessFidelity', '_fwMatchAddr',
      '_fwRuleMatches', 'simLabValidateFirewallFidelity', '_arrEq', '_setEq', '_cliExcerptText', '_cliNeedlesMet',
      'simLabValidateCliFaultFidelity'].forEach(function (n) { parts.push(fn(n)); });
    var V = {}; vm.createContext(V); vm.runInContext(parts.join('\n\n'), V);

    var S = {}; vm.createContext(S);
    vm.runInContext('var window = {};\n' + read('features/sim-lab-seed-secplus.js') + '\nglobalThis.__b = window.SIM_LAB_SEED_SECPLUS;', S);
    var bank = S.__b || [];
    function of(arch) { return bank.filter(function (s) { return s && s.archetype === arch; }); }
    function fidelity(s) {
      if (s.archetype === 'firewall') return V.simLabValidateFirewallFidelity(s);
      if (s.archetype === 'cli') return V.simLabValidateCliFaultFidelity(s);
      var key = s.archetype === 'wireless' ? 'apId' : 'deviceId';
      var step = (s.steps || []).filter(function (st) { return st.type === 'configure' && st[key]; })[0];
      if (s.archetype === 'wireless') {
        return step ? V.simLabValidateWirelessFidelity(s.assets.reference, step) : { ok: false, errors: ['no configure step with apId'] };
      }
      // Sec+ design seeds place devices by drag (no deviceId step), so the
      // reference itself is what gets checked.
      return V.simLabValidateNetworkFidelity(s.assets.reference, step || null);
    }
    function allPass(list, label) {
      var ok = true;
      list.forEach(function (s) {
        var r = V.simLabValidateScenario(s), f = fidelity(s);
        if (!r.ok || !f.ok) {
          ok = false;
          results.errors.push('Sec+ ' + label + ' ' + s.id + ': ' + (r.errors || []).concat(f.errors || []).join('; '));
        }
      });
      return ok;
    }

    // ── v8.158.0: firewall-rule PBQs ──
    var fw = of('firewall');
    test('Sec+ firewall bank: at least 10 firewall-rule PBQs', fw.length >= 10);
    test('Sec+ firewall bank: every seed passes simLabValidateScenario + simLabValidateFirewallFidelity (simulated traffic)',
      fw.length > 0 && allPass(fw, 'firewall'));
    test('Sec+ firewall bank: the order step\'s key is the fwSpec rule order (the table the traffic test ran on)',
      fw.length > 0 && fw.every(function (s) {
        var ord = (s.steps || []).filter(function (st) { return st.type === 'order'; })[0];
        var ids = (s.fwSpec.rules || []).map(function (r) { return r.id; });
        return ord && JSON.stringify(ord.answer.correctOrder) === JSON.stringify(ids);
      }));
    test('Sec+ firewall bank: no rule id or label names the answer (no "shadow"/"wrong"/"broken" giveaways)',
      fw.length > 0 && fw.every(function (s) {
        // Rule ids and the table rows the student sorts (field NAMES like
        // shadowTable are schema, not content). Analyze-step options may say
        // "shadowed", right and wrong ones alike, so they are not checked.
        var spec = s.fwSpec || {}, rows = [];
        (spec.rules || []).concat((spec.shadowTable || {}).rules || []).forEach(function (r) { rows.push(r.id); });
        (s.steps || []).filter(function (st) { return st.type === 'order'; }).forEach(function (st) {
          (st.payload.items || []).forEach(function (it) { rows.push(it.id, it.label); });
        });
        var txt = rows.join(' | ');
        return !/shadow|wrong|broken|never fires|dead rule/i.test(txt);
      }));
    test('Sec+ firewall bank: tagged to SY0-701 objectives 3.x/4.x and cert secplus',
      fw.length > 0 && fw.every(function (s) { return s.cert === 'secplus' && /^[34]\.\d$/.test(s.objective); }));

    // ── v8.156.0: terminal / log-analysis PBQs ──
    var cli = of('cli');
    test('Sec+ terminal bank: at least 8 log / command-output PBQs', cli.length >= 8);
    test('Sec+ terminal bank: every seed passes simLabValidateScenario + simLabValidateCliFaultFidelity (evidence carries the fault)',
      cli.length > 0 && allPass(cli, 'cli'));
    test('Sec+ terminal bank: every seed keys a Security+ fault type (not a Network+ duplex/gateway/dns/vlan fault)',
      cli.length > 0 && cli.every(function (s) { return s.cliFault && !/^(duplex|gateway|dns|vlan)$/.test(s.cliFault.fault); }));

    // ── v8.156.0: secure network design PBQs ──
    var dg = of('diagram');
    test('Sec+ design bank: at least 8 secure network design PBQs', dg.length >= 8);
    test('Sec+ design bank: every seed passes simLabValidateScenario + simLabValidateNetworkFidelity',
      dg.length > 0 && allPass(dg, 'diagram'));
    test('Sec+ design bank: tagged to SY0-701 domain 3 (architecture) and cert secplus',
      dg.length > 0 && dg.every(function (s) { return s.cert === 'secplus' && /^3\.\d$/.test(s.objective); }));

    // ── v8.157.0: wireless security PBQs ──
    var wl = of('wireless');
    test('Sec+ wireless bank: at least 6 wireless security PBQs', wl.length >= 6);
    test('Sec+ wireless bank: every seed passes simLabValidateScenario + simLabValidateWirelessFidelity',
      wl.length > 0 && allPass(wl, 'wireless'));

    // ── v8.157.0: governance (D5) + threat (D2) PBQs on generic steps ──
    var gov = bank.filter(function (s) { return /^sp-(gv|th)-\d\d$/.test(s.id); });
    test('Sec+ governance/threat set: 10 seeds, each passes simLabValidateScenario',
      gov.length === 10 && gov.every(function (s) { return V.simLabValidateScenario(s).ok; }));
    test('Sec+ governance/threat set: 6 target domain 5 and 4 target domain 2',
      gov.filter(function (s) { return /^5\./.test(s.objective); }).length === 6 &&
      gov.filter(function (s) { return /^2\./.test(s.objective); }).length === 4);

    // ── v8.156.0: configure dropdowns are shuffled on screen ──
    // 303 of 313 Network+ configure dropdowns list the keyed answer first, and
    // the renderer showed options as authored, so "pick the top one" scored.
    var X = {}; vm.createContext(X); vm.runInContext(fn('_slShuffledOptions'), X);
    var sl = { options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }, { id: 'd', text: 'D' }] };
    var firsts = {}, intact = true;
    for (var k = 0; k < 400; k++) {
      var out = X._slShuffledOptions(sl);
      firsts[out[0].id] = true;
      if (out.map(function (o) { return o.id; }).sort().join('') !== 'abcd') intact = false;
    }
    test('Sim Lab configure: options come out in random order (every option leads sometimes), none lost or duplicated',
      Object.keys(firsts).length === 4 && intact && sl.options[0].id === 'a');
    var cfgBody = fn('_slRenderConfigure'), dpBody = fn('_slRenderConfigureDualPanel');
    test('Sim Lab configure: both dropdown renderers build options from _slShuffledOptions, not the authored order',
      /_slShuffledOptions\(sl\) : sl\.options\)\.forEach/.test(cfgBody) && /shown\[sl\.id\]\.forEach/.test(dpBody) &&
      /shown\[sl\.id\] = typeof _slShuffledOptions === 'function' \? _slShuffledOptions\(sl\)/.test(dpBody) &&
      !/sl\.options\.forEach\(function \(o\) \{\s*var op/.test(cfgBody + dpBody));

    // ── v8.156.0: network diagrams lay out on the grid whatever the seed gave ──
    // Sec+ incident seeds gave pixel x/y (rendered ~72,000px wide, nodes as
    // specks); Sec+ VPN and A+ SOHO seeds gave none (every node on one spot).
    var G = {}; vm.createContext(G); vm.runInContext(fn('_slNetGrid'), G);
    var gridBad = [];
    ['sim-lab-seed-netplus.js', 'sim-lab-seed-secplus.js', 'sim-lab-seed-aplus-core1.js', 'sim-lab-seed-aplus-core2.js'].forEach(function (f) {
      var C = {}; vm.createContext(C);
      vm.runInContext('var window = {};\n' + read('features/' + f) + '\nglobalThis.__w = window;', C);
      var b = Object.keys(C.__w).map(function (k) { return C.__w[k]; }).filter(Array.isArray)[0] || [];
      b.forEach(function (sc) {
        var r = sc.assets && sc.assets.reference;
        if (!r || r.kind !== 'network' || !Array.isArray(r.devices)) return;
        var g = G._slNetGrid(r.devices), cells = {};
        g.forEach(function (c) {
          var k = c.x + ',' + c.y;
          if (!(c.x >= 0 && c.x <= 12 && c.y >= 0 && c.y <= 12) || cells[k]) gridBad.push(sc.id);
          cells[k] = 1;
        });
      });
    });
    test('Sim Lab diagrams: every network reference in every bank lands on distinct grid cells (no specks, no stacked nodes)',
      gridBad.length === 0);
    if (gridBad.length) results.errors.push('grid layout problems: ' + gridBad.join(', '));
    var authored = [{ x: 0, y: 0 }, { x: 2, y: 1 }];
    test('Sim Lab diagrams: seeds that already use grid cells keep their exact layout',
      JSON.stringify(G._slNetGrid(authored)) === JSON.stringify(authored) &&
      /_slNetGrid\(devices\)/.test(fn('_slRenderRefNetwork')));

    // ── v8.159.0: every firewall PBQ in every bank has ONE right order ──
    // The order step only accepts fwSpec order, so if another permutation
    // passes every flow, a learner who built a working table is marked wrong.
    // Measured 2026-10-11: 11 of 12 Network+ firewall seeds had 2-30 passing
    // orders, some with an allow below deny-all that no flow ever exercised.
    var FW = {}; vm.createContext(FW);
    vm.runInContext(['_ipToInt', '_fwMatchAddr', '_fwRuleMatches'].map(fn).join('\n'), FW);
    function verdict(rules, f) { for (var i = 0; i < rules.length; i++) { if (FW._fwRuleMatches(rules[i], f)) return rules[i].action; } return 'deny'; }
    function perms(a) { if (a.length <= 1) return [a]; var o = []; a.forEach(function (x, i) { perms(a.slice(0, i).concat(a.slice(i + 1))).forEach(function (q) { o.push([x].concat(q)); }); }); return o; }
    var multi = [], ported = [];
    ['sim-lab-seed-netplus.js', 'sim-lab-seed-secplus.js'].forEach(function (f) {
      var C = {}; vm.createContext(C);
      vm.runInContext('var window = {};\n' + read('features/' + f) + '\nglobalThis.__w = window;', C);
      var b = Object.keys(C.__w).map(function (k) { return C.__w[k]; }).filter(Array.isArray)[0] || [];
      b.filter(function (sc) { return sc.archetype === 'firewall'; }).forEach(function (sc) {
        var ok = perms(sc.fwSpec.rules).filter(function (pm) { return sc.fwSpec.flows.every(function (fl) { return verdict(pm, fl) === fl.expect; }); });
        if (ok.length !== 1) multi.push(sc.id + ':' + ok.length);
        ((sc.assets.reference || {}).devices || []).forEach(function (d) {
          if (/·\s*\d/.test(String(d.ip || '') + ' ' + String(d.label || ''))) ported.push(sc.id);
        });
      });
    });
    test('Firewall PBQs (all banks): exactly one rule order passes every flow, so a working table is never marked wrong',
      multi.length === 0);
    if (multi.length) results.errors.push('firewall seeds with more than one passing order: ' + multi.join(', '));
    test('Firewall PBQs (all banks): the diagram never prints the ports the configure steps ask for',
      ported.length === 0);
    if (ported.length) results.errors.push('firewall diagrams printing ports: ' + ported.filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', '));
  } catch (err) {
    test('Sec+ PBQ banks: content block (threw)', false);
    results.errors.push('320 Sec+ PBQ content block threw: ' + err.message);
  }
})();
