// tests/uat/543-cert-lists.js
// Scope: cert-registry Part 1, Task 1.4. Every visible cert list, badge, picker, gate and switcher target reads
// window.CertRegistry. The local per-cert maps (MARKS, PICK_*, NAMES, certLabel, CERT_HOST, HUB_SCALE_1000, _DL_CERTS,
// _SL_PBQ_CERTS_HOME, _DL_SEED_FILES, getAvailableCerts' literal list, tadSwitchCert's host ternary) are gone.
// Each surface's own function is cut out of the real source and run in a vm next to the real registry, with a hidden fake
// cert injected through the test-only _add, so a surface that still carries its own list cannot pass.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Cert lists, gating and switching read the registry ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

  // Brace-balanced slice starting at `start`.
  function braced(src, start, what) {
    const open = start < 0 ? -1 : src.indexOf('{', start);
    if (open < 0) throw new Error('543: ' + what + ' not found');
    let depth = 1, i = open + 1;
    while (i < src.length && depth > 0) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; i++; }
    return src.slice(start, i);
  }
  function fn(file, name) {
    const m = new RegExp('function\\s+' + name + '\\s*\\(').exec(read(file));
    if (!m) throw new Error('543: function ' + name + ' not found in ' + file);
    return braced(read(file), m.index, name + ' in ' + file);
  }

  const REG = read('lib/cert-registry.js');
  const FAKE = {
    id: 'zz', name: 'Zed Hidden Cert', shortName: 'Zed Short', code: 'ZZ-1', vendor: 'Zed Org', mark: 'ZZ', glyph: 'ZG', hidden: true,
    hostPrefix: 'zz', tier: 'pro', simLab: true, decisionLab: true, decisionLabSeed: 'features/zz-seed.js',
    scale: { min: 1, max: 777, pass: 500, format: 'scaled' },
    labels: { signin: 'ZZ Signin', firstrun: 'Zed Short', onboardingName: 'ZZ Onb', onboardingVendor: 'Zed · ZZ-1', onboardingHomeSub: 'ZZ Sub', certLock: 'ZZ Lock', gate: 'ZZ Gate Label' }
  };
  // A sandbox: window + the real registry (+ the hidden fake when withFake) + any extra globals.
  function box(extra, withFake) {
    const sb = Object.assign({ console: { log() {}, warn() {}, error() {} } }, extra || {});
    sb.window = sb.window || {};
    sb.window.window = sb.window;
    vm.createContext(sb);
    vm.runInContext(REG, sb, { filename: 'lib/cert-registry.js' });
    if (withFake !== false) sb.window.CertRegistry._add(FAKE);
    return sb;
  }
  const run = (sb, code, file) => vm.runInContext(code, sb, { filename: file || 'surface' });

  const R0 = box({}, false).window.CertRegistry;
  const PUBLIC = R0.listed(false).map((e) => e.id);
  const ALL = R0.all().map((e) => e.id);
  test('Sanity: the real registry lists the eight certs, and a hidden fake is excluded for non-admins',
    PUBLIC.length === 8 && ALL.length === 12 && (() => { const r = box({}).window.CertRegistry; return r.listed(false).length === 8 && r.listed(true).length === 13 && r.visible().length === 8; })());   // 12 = the eight + four hidden new certs
  test('visible(): follows window._certanvilIsAdmin, hidden before the profile loads',
    (() => { const sb = box({}); const r = sb.window.CertRegistry; const a = r.visible().length; sb.window._certanvilIsAdmin = true; const b = r.visible().length; return a === 8 && b === 13; })());

  // ── list surfaces: each returns the registry's visible ids, in registry order; hidden only for admins ──
  const surfaces = [];
  // 1. auth-state getAvailableCerts (switcher, hub, settings, diagnostic). A+ rows stay last, as the switcher has always had them.
  surfaces.push({
    name: 'auth-state getAvailableCerts',
    ids: (sb) => run(sb, fn('auth-state.js', 'getAvailableCerts') + '\ngetAvailableCerts("user")').map((c) => c.id),
    // single exams by vendor group, then the family pairs (A+, PSM) last
    order: (r) => { const g = r.vendorGroups(r.visible()), out = []; g.forEach((x) => x.entries.forEach((e) => { if (!e.family) out.push(e.id); })); g.forEach((x) => x.entries.forEach((e) => { if (e.family) out.push(e.id); })); return out; }
  });
  // 2. iOS first-run picker
  surfaces.push({
    name: 'ios-firstrun pickCerts',
    ids: (sb) => run(sb, fn('features/ios-firstrun.js', 'pickRow') + '\n' + fn('features/ios-firstrun.js', 'pickCerts') + '\npickCerts()').map((c) => c.id),
    order: (r) => [].concat.apply([], r.vendorGroups(r.visible()).map((g) => g.entries.map((e) => e.id)))   // grouped by vendor
  });
  // 3 + 4. onboarding first-run and onboarding home
  ['lib/onboarding-firstrun.js', 'lib/onboarding-home.js'].forEach((f) => surfaces.push({
    name: f + ' certs',
    ids: (sb) => run(sb, fn(f, 'row') + '\n' + fn(f, 'certs') + '\ncerts()').map((c) => c.id),
    order: (r) => r.visible().map((e) => e.id)
  }));
  surfaces.forEach((s) => {
    const sbA = box({ window: {} });
    const non = s.ids(sbA).join();
    test(s.name + ': non-admin gets the visible ids in registry order, hidden fake excluded',
      non === s.order(sbA.window.CertRegistry).join() && non.split(',').length === 8 && non.indexOf('zz') === -1);
    const sbB = box({ window: {} }); sbB.window._certanvilIsAdmin = true;
    const adm = s.ids(sbB);
    test(s.name + ': admin also gets the hidden fake (and the four hidden new certs)', adm.indexOf('zz') !== -1 && adm.length === 13);
    const sbC = box({ window: {} }, false); delete sbC.window.CertRegistry;
    let safe = null, threw = false;
    try { safe = s.ids(sbC); } catch (e) { threw = true; }
    test(s.name + ': no registry on the page fails safe (no throw, never more than the Network+ default)', !threw && Array.isArray(safe) && safe.length <= 1 && safe.every((i) => i === 'netplus'));
  });

  // The literal order of the eight current certs on each list. New certs may be interleaved or appended later, so filter to these ids first.
  const EIGHT = ['netplus', 'secplus', 'az900', 'ai900', 'sc900', 'clfc02', 'aplus-core1', 'aplus-core2'];
  const EIGHT_PICK = ['netplus', 'secplus', 'aplus-core1', 'aplus-core2', 'az900', 'ai900', 'sc900', 'clfc02'];
  const rel = (list, want) => list.filter((i) => want.indexOf(i) !== -1).join();
  const sbO = box({});
  test('Literal order, switcher/hub/settings: netplus, secplus, az900, ai900, sc900, clfc02, aplus-core1, aplus-core2',
    rel(surfaces[0].ids(sbO), EIGHT) === EIGHT.join());
  test('Literal order, picker + both onboarding lists: netplus, secplus, aplus-core1, aplus-core2, az900, ai900, sc900, clfc02',
    surfaces.slice(1).every((s) => rel(s.ids(sbO), EIGHT_PICK) === EIGHT_PICK.join()));
  // v8.205.0: where the four new certs sit (admin view, since they are hidden): SecAI+ with CompTIA, PRINCE2 after AWS, PSM pair last.
  const sbN = box({}, false); sbN.window._certanvilIsAdmin = true;
  test('New certs in the switcher: netplus, secplus, secai, az900, ai900, sc900, clfc02, prince2, aplus-core1, aplus-core2, psm1, psm2',
    surfaces[0].ids(sbN).join() === 'netplus,secplus,secai,az900,ai900,sc900,clfc02,prince2,aplus-core1,aplus-core2,psm1,psm2');
  test('New certs in the first-run picker, by vendor: CompTIA (netplus, secplus, secai, A+), Microsoft, AWS, PeopleCert, Scrum.org',
    surfaces[1].ids(sbN).join() === 'netplus,secplus,secai,aplus-core1,aplus-core2,az900,ai900,sc900,clfc02,prince2,psm1,psm2');
  // The picker draws one vendor heading per group, in order, and PSM rows show the full name as their second line.
  const pickHtml = run(sbN, fn('features/ios-firstrun.js', 'pickRow') + '\n' + fn('features/ios-firstrun.js', 'pickCerts') + '\n' + fn('features/ios-firstrun.js', '_ifrPickerHtml') + '\n_ifrPickerHtml({ certs: pickCerts(), selected: "psm1", first: true })');
  test('Picker shows vendor headings CompTIA, Microsoft, AWS, PeopleCert, Scrum.org (in that order) and "Lock in PSM I"',
    (pickHtml.match(/<div class="ifr-sect">([^<]+)<\/div>/g) || []).map((h) => h.replace(/<[^>]+>/g, '')).join() === 'CompTIA,Microsoft,AWS,PeopleCert,Scrum.org' &&
    /Lock in PSM I</.test(pickHtml) && /<span class="ifr-nm">PSM II<\/span><span class="ifr-cd">Professional Scrum Master II<\/span>/.test(pickHtml) && !/Choose one to study/.test(pickHtml));

  // ── the ACTIVE cert resolves from its own entry, not the filtered list: a non-admin on a hidden cert's host sees its own name ──
  (() => {
    const sb = box({ window: {} });
    sb.window.CURRENT_CERT = 'zz';
    test('Active hidden cert: onboarding-home certById and onboarding-firstrun certById return its own label (not Network+)',
      run(sb, fn('lib/onboarding-home.js', 'row') + fn('lib/onboarding-home.js', 'certs') + '\n' + fn('lib/onboarding-home.js', 'certById') + '\ncertById("zz").name + "|" + certById("zz").vendor + "|" + certs().length') === 'ZZ Onb|ZZ Sub|8'
      && run(sb, fn('lib/onboarding-firstrun.js', 'row') + fn('lib/onboarding-firstrun.js', 'certs') + '\n' + fn('lib/onboarding-firstrun.js', 'certById') + '\ncertById("zz").name') === 'ZZ Onb');
    test('Active hidden cert: first-run picker pickName resolves it although pickCerts() excludes it',
      run(sb, fn('features/ios-firstrun.js', 'pickRow') + fn('features/ios-firstrun.js', 'pickCerts') + '\n' + fn('features/ios-firstrun.js', 'pickName') + '\npickName("zz") + "|" + pickCerts().some(function(c){return c.id==="zz";})') === 'Zed Short|false');
    // auth-state: the "Free tier . <name> active" label. Run the real renderSignedIn line pair by source: it must read get(activeCertId).
    const src = read('auth-state.js');
    test('Active hidden cert: auth-state tier label reads CertRegistry.get(activeCertId), not the filtered list',
      /var activeCert = \(window\.CertRegistry && window\.CertRegistry\.get\(activeCertId\)\)/.test(src) && !/getAvailableCerts\(role\)\.filter/.test(src)
      && run(sb, 'var activeCertId = "zz"; var activeCert = (window.CertRegistry && window.CertRegistry.get(activeCertId)) || { name: "Network+" }; activeCert.name') === 'Zed Hidden Cert');
    // ios-hub: the active hidden cert is added to the hub's certs so its card still renders
    test('Active hidden cert: the hub adds the current cert when the visible list lacks it', /ce && !certs\.some\(function \(c\) \{ return c\.id === current; \}\)/.test(read('features/ios-hub.js')));
  })();
  test('mockups/onboarding-sandbox.html loads the registry before the consumers',
    (() => { const h = read('mockups/onboarding-sandbox.html'); const i = h.indexOf('../lib/cert-registry.js'); return i > -1 && i < h.indexOf('../lib/router.js') && i < h.indexOf('../lib/onboarding-firstrun.js'); })());

  // ── per-id label surfaces: a registry-only fake cert shows its registry labels ──
  const sb1 = box({});
  test('ios-signin certName reads labels.signin (and falls back to the id)',
    run(sb1, fn('features/ios-signin.js', 'certName') + '\ncertName("zz") + "|" + certName("az900") + "|" + certName("nope")') === 'ZZ Signin|Microsoft Azure Fundamentals|nope');
  test('cert-lock certLabel reads labels.certLock (and falls back to the id)',
    run(sb1, fn('lib/cert-lock.js', 'certLabel') + '\ncertLabel("zz") + "|" + certLabel("clfc02") + "|" + certLabel("nope")') === 'ZZ Lock|AWS CLF-C02|nope');
  (() => {
    const rsb = box({ module: { exports: {} }, global: undefined });
    run(rsb, read('lib/router.js'), 'lib/router.js');
    const R = rsb.window.certanvilRouter;
    const want = { netplus: 'https://networkplus.certanvil.com/', secplus: 'https://secplus.certanvil.com/', az900: 'https://azure.certanvil.com/', ai900: 'https://ai.certanvil.com/', sc900: 'https://sc900.certanvil.com/', clfc02: 'https://clfc02.certanvil.com/', 'aplus-core1': 'https://aplus.certanvil.com/?exam=core1', 'aplus-core2': 'https://aplus.certanvil.com/?exam=core2' };
    test('router certHost builds each live address from the registry host (+ ?exam= for a family)',
      Object.keys(want).every((id) => R.certHost(id) === want[id]) && R.certHost('zz') === 'https://zz.certanvil.com/');
    test('router certHost: unknown id gives the Network+ address', R.certHost('nope') === 'https://networkplus.certanvil.com/');
    const bare = { window: {}, module: { exports: {} } }; bare.window.window = bare.window; vm.createContext(bare);
    vm.runInContext(read('lib/router.js'), bare);
    test('router certHost with no registry on the page: Network+ address, no throw', bare.window.certanvilRouter.certHost('az900') === 'https://networkplus.certanvil.com/');
  })();

  // Marks: the six iOS surfaces read entry.mark.
  (() => {
    const g = { CURRENT_CERT: 'zz', CERT_PACK: { meta: { name: 'Zed Hidden Cert', code: 'ZZ-1' } }, CERT_CODE: 'ZZ-1', window: {}, document: { documentElement: { getAttribute: () => 'dark' } } };
    const sb = box(g);
    const out = [
      run(sb, fn('features/ios-progress.js', '_ipCert') + '\n_ipCert().mark'),
      run(sb, fn('features/ios-analytics.js', '_inCert') + '\n_inCert().mark'),
      run(sb, fn('features/ios-custom.js', 'iosCertIdentity') + '\niosCertIdentity().mark'),
      run(sb, fn('features/ios-firstrun.js', 'certInfo') + '\nfunction certId(){return CURRENT_CERT;}\nfunction packMeta(){return CERT_PACK.meta;}\ncertInfo("zz").glyph')
    ];
    test('ios-progress / analytics / custom / firstrun marks come from entry.mark', out.join() === 'ZZ,ZZ,ZZ,ZZ');
    ['features/ios-analytics.js', 'features/ios-custom.js', 'features/ios-firstrun.js', 'features/ios-home.js', 'features/ios-log-result.js', 'features/ios-progress.js'].forEach((f) => {
      const src = read(f);
      test(f + ': no local MARKS map, reads CertRegistry', !/\bMARKS\b/.test(src) && /CertRegistry/.test(src));
    });
    const sbNone = box({ CURRENT_CERT: 'az900', CERT_PACK: { meta: { name: 'Microsoft Azure Fundamentals' } }, window: {}, document: g.document }, false);
    delete sbNone.window.CertRegistry;
    test('mark falls back to CA when the registry is missing (no throw)', run(sbNone, fn('features/ios-progress.js', '_ipCert') + '\n_ipCert().mark') === 'CA');
  })();

  // Hub score scale reads the registry.
  (() => {
    const sb = box({});
    const code = fn('features/ios-hub.js', '_hubMax') + '\n[_hubMax("az900"), _hubMax("clfc02"), _hubMax("netplus"), _hubMax("zz"), _hubMax("nope")].join()';
    test('ios-hub _hubMax reads scale.max (1000 / 1000 / 900 / fake 777 / unknown 900)', run(sb, code) === '1000,1000,900,777,900');
    test('ios-hub: HUB_SCALE_1000 is gone', !/HUB_SCALE_1000/.test(read('features/ios-hub.js')));
  })();

  // First-run picker names/codes: labels.firstrun and the one code (A+ approved at 220-1201 / 220-1202).
  (() => {
    const sb = box({});
    const rows = run(sb, fn('features/ios-firstrun.js', 'pickRow') + '\n' + fn('features/ios-firstrun.js', 'pickCerts') + '\npickCerts()');
    const byId = {}; rows.forEach((r) => { byId[r.id] = r; });
    test('ios-firstrun picker rows: glyph = mark, name = labels.firstrun, code = entry.code',
      byId['aplus-core1'].code === '220-1201' && byId['aplus-core2'].code === '220-1202' && byId.clfc02.glyph === 'CLF' && byId.az900.name === 'Azure Fundamentals' && byId.netplus.code === 'N10-009');
    const src = read('features/ios-firstrun.js');
    test('ios-firstrun: PICK_IDS / PICK_NAMES / PICK_CODES are gone', !/PICK_(IDS|NAMES|CODES)/.test(src));
    const o1 = run(sb, fn('lib/onboarding-firstrun.js', 'row') + fn('lib/onboarding-firstrun.js', 'certs') + '\ncerts()'), o2 = run(sb, fn('lib/onboarding-home.js', 'row') + fn('lib/onboarding-home.js', 'certs') + '\ncerts()');
    const a1 = o1.filter((c) => c.id === 'aplus-core1')[0], c2 = o2.filter((c) => c.id === 'clfc02')[0], z2 = o2.filter((c) => c.id === 'az900')[0];
    test('onboarding rows: names/vendors/marks from labels (first-run A+ vendor says 220-1201; home sub-lines as today)',
      a1.name === 'A+ Core 1' && a1.vendor === 'CompTIA · 220-1201' && a1.mark === 'A+' && c2.vendor === 'CLF-C02' && z2.vendor === 'Azure Fundamentals');
    test('onboarding files: no local CERTS array literal', !/var\s+CERTS\s*=\s*\[/.test(read('lib/onboarding-firstrun.js')) && !/var\s+CERTS\s*=\s*\[/.test(read('lib/onboarding-home.js')));
  })();

  // ── tadSwitchCert: Pro gate from entry.tier + labels.gate, target from hostFor ──
  function switcher(host, gateResult) {
    const calls = [], store = {}; let reloaded = 0;
    const win = { location: { hostname: host, href: '', reload() { reloaded++; } }, _gateProOnly: (label) => { calls.push(label); return gateResult !== false; } };
    const sb = box({ window: win, localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } } });
    const src = read('auth-state.js');
    const sm = /window\.tadSwitchCert\s*=\s*function/.exec(src);
    run(sb, "var CERT_OVERRIDE_KEY = 'nplus_' + 'dev_cert';\n" + braced(src, sm.index, 'tadSwitchCert') + ';');
    return { win, sb, calls, store, reloaded: () => reloaded };
  }
  const ids = R0.listed(true).map((e) => e.id).concat(['zz']);
  const bad = [];
  ids.forEach((id) => {
    const t = switcher('example.com');
    const R = t.win.CertRegistry, e = R.get(id);
    t.win.tadSwitchCert(id);
    const want = 'https://' + R.hostFor(id) + '/' + (e.family ? '?exam=' + e.examSlug : '');
    if (t.win.location.href !== want) bad.push(id + ' target ' + t.win.location.href + ' != ' + want);
    const gated = e.tier === 'pro';
    if (gated && (t.calls.length !== 1 || t.calls[0] !== (e.labels.gate || e.name))) bad.push(id + ' gate label ' + JSON.stringify(t.calls));
    if (!gated && t.calls.length !== 0) bad.push(id + ' free cert was gated');
    const f = switcher('example.com', false); f.win.tadSwitchCert(id);
    if (gated && f.win.location.href !== '') bad.push(id + ' navigated although the gate refused');
  });
  test('tadSwitchCert: every cert (and a hidden fake) targets hostFor(id), gates on entry.tier with labels.gate' + (bad.length ? ' — ' + bad.slice(0, 4).join(' | ') : ''), bad.length === 0);
  (() => {
    const t = switcher('example.com');
    test('tadSwitchCert: unknown id is refused, no navigation, no gate', t.win.tadSwitchCert('nope') === false && t.win.location.href === '' && t.calls.length === 0);
    const same = switcher('aplus.certanvil.com'); same.win.tadSwitchCert('aplus-core2');
    test('tadSwitchCert: A+ Core 1 -> Core 2 on the A+ host stays put (override + reload), as before',
      same.win.location.href === '' && same.reloaded() === 1 && same.store.nplus_dev_cert === 'aplus-core2');
    const other = switcher('azure.certanvil.com'); other.win.tadSwitchCert('aplus-core2');
    test('tadSwitchCert: from another host to A+ clears the override and carries ?exam=', other.win.location.href === 'https://aplus.certanvil.com/?exam=core2' && !('nplus_dev_cert' in other.store));
    const loc = switcher('localhost'); loc.win.tadSwitchCert('secplus');
    test('tadSwitchCert: localhost keeps the override + reload', loc.reloaded() === 1 && loc.store.nplus_dev_cert === 'secplus' && loc.win.location.href === '');
    const src = read('auth-state.js').replace(/\/\/.*$/gm, '');
    test('auth-state: no host ternary, no per-cert gate chain left in tadSwitchCert', !/azure\.certanvil\.com|ai\.certanvil\.com|sc900\.certanvil\.com|clfc02\.certanvil\.com|secplus\.certanvil\.com/.test(src) && !/certId === 'secplus'/.test(src));
    const noReg = switcher('example.com'); delete noReg.win.CertRegistry;
    test('tadSwitchCert with no registry: refuses, never throws', noReg.win.tadSwitchCert('az900') === false);
  })();

  // ── app.js: Sim Lab / Decision Lab tiles and the Decision Lab seed ──
  (() => {
    const app = read('app.js');
    ['_SL_PBQ_CERTS_HOME', '_DL_CERTS', '_DL_SEED_FILES'].forEach((n) => test('app.js: ' + n + ' is gone', app.indexOf(n) === -1));
    const mkEl = () => { const c = new Set(); return { classList: { add: (x) => c.add(x), remove: (x) => c.delete(x), contains: (x) => c.has(x) }, textContent: '' }; };
    const results = [];
    R0.listed(true).concat([{ id: 'zz' }]).forEach((e) => {
      const els = { 'sl-home-opt': mkEl(), 'sl-home-sub': mkEl(), 'dl-home-opt': mkEl(), 'dl-home-sub': mkEl() };
      const sb = box({ CURRENT_CERT: e.id, document: { getElementById: (i) => els[i] || null }, _pbqFreeRunsToday: () => 0, PBQ_FREE_DAILY_CAP: 1, _dlFreeRunsToday: () => 0 });
      sb.window.CURRENT_CERT = e.id;
      run(sb, fn('app.js', 'renderSimLabHomeEntry') + '\n' + fn('app.js', 'renderDecisionLabHomeEntry') + '\nrenderSimLabHomeEntry(); renderDecisionLabHomeEntry();');
      const reg = sb.window.CertRegistry.get(e.id);
      results.push([e.id, els['sl-home-opt'].classList.contains('is-hidden') === !reg.simLab, els['dl-home-opt'].classList.contains('is-hidden') === !reg.decisionLab]);
    });
    test('Sim Lab and Decision Lab tiles show exactly where the registry says (incl. a fake cert)', results.every((r) => r[1] && r[2]));
    const sb2 = box({ CURRENT_CERT: 'zz', document: { head: { appendChild: (s) => { sb2.__src = s.src; if (s.onload) s.onload(); } }, createElement: () => ({}) }, _ensureSimLabLoaded: (cb) => cb() });
    sb2.window.CURRENT_CERT = 'zz';
    run(sb2, fn('app.js', '_ensureDecisionLabLoaded') + '\n_ensureDecisionLabLoaded(function () {});');
    test('Decision Lab seed path comes from entry.decisionLabSeed', sb2.__src === 'features/zz-seed.js');
    const sb3 = box({ CURRENT_CERT: 'az900', document: { head: { appendChild: (s) => { sb3.__src = s.src; if (s.onload) s.onload(); } }, createElement: () => ({}) }, _ensureSimLabLoaded: (cb) => cb() });
    sb3.window.CURRENT_CERT = 'az900';
    run(sb3, fn('app.js', '_ensureDecisionLabLoaded') + '\n_ensureDecisionLabLoaded(function () {});');
    test('Decision Lab seed path for AZ-900 is unchanged', sb3.__src === 'features/decision-lab-seed-az900.js');
    const drills = read('features/ios-drills.js');
    test('ios-drills reads simLab/decisionLab from the registry', /CertRegistry/.test(drills) && !/_SL_PBQ_CERTS_HOME|_DL_CERTS/.test(drills));
  })();

  // ── Step 4b: the exam vendor and the word "official" in the AI question prompt ──
  (() => {
    const app = read('app.js');
    const prompt = (pack, certId, withReg) => {
      const sb = box({ CERT_PACK: pack, CURRENT_CERT: certId }, false);
      sb.window.CURRENT_CERT = certId;
      if (!withReg) delete sb.window.CertRegistry; else sb.window.CertRegistry._add({ id: 'psm', name: 'Professional Scrum Master I', vendor: 'Scrum.org', hostPrefix: 'psm' });
      return run(sb, fn('app.js', '_examPromptBits') + '\n_examPromptBits()');
    };
    const est = prompt({ meta: { name: 'Professional Scrum Master I', weightsAreEstimates: true } }, 'psm', true);
    test('Estimated-weights pack: vendor from the registry, no "official"', est.vendor === 'Scrum.org' && est.official === '');
    const prince = prompt({ meta: { name: 'PRINCE2 Foundation', weightsAreEstimates: true, vendor: 'Axelos' } }, 'nope', true);
    test('Unknown to the registry: vendor falls back to meta.vendor, still no "official" for estimates', prince.vendor === 'Axelos' && prince.official === '');
    const std = prompt({ meta: { name: 'CompTIA Security+' } }, 'secplus', true);
    test('Published-weights pack keeps "official " and CompTIA', std.vendor === 'CompTIA' && std.official === 'official ');
    const legacy = prompt({ meta: { name: 'Microsoft Azure Fundamentals' } }, 'nope', false);
    test('No registry, no meta.vendor: first word of the pack name, as before', legacy.vendor === 'Microsoft' && legacy.official === 'official ');
    test('The domains sentence uses the helper and never hard-codes "official"',
      /across all \$\{Object\.keys\(DOMAIN_WEIGHTS\)\.length\} \$\{_official\}\$\{_examVendor\} domains/.test(app) && !/official \$\{_examVendor\} domains/.test(app));
  })();

  // ── app.js must not grow ──
  test('app.js did not grow past the 8235-line baseline', read('app.js').split('\n').length - 1 <= 8235);
})();
