// Stage 5a (27 Oct): the iOS native shell (ADR-004). The Capacitor config, the iPhone-only project, the build
// exclusions, and native-shell.js staying a no-op on the website.
const { fs, path, ROOT, test, results, vm, _fnBody } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Stage 5a native shell ──\x1b[0m');
  try {
    const read = (p) => { const f = path.join(ROOT, p); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
    const cfgRaw = read('capacitor.config.json');
    const cfg = cfgRaw ? JSON.parse(cfgRaw) : {};
    const srv = cfg.server || {};
    test('capacitor.config: com.certanvil.app loads the live Network+ site, keeps *.certanvil.com in the app, falls back to the bundled offline page',
      cfg.appId === 'com.certanvil.app' && srv.url === 'https://networkplus.certanvil.com'
      && (srv.allowNavigation || []).indexOf('*.certanvil.com') >= 0 && (srv.allowNavigation || []).indexOf('certanvil.com') >= 0
      && srv.errorPath === 'index.html' && cfg.webDir === 'native-shell' && (cfg.ios || {}).appendUserAgent === 'CertAnvilApp');
    const pbx = read('ios/App/App.xcodeproj/project.pbxproj');
    test('the iOS project is iPhone only', /TARGETED_DEVICE_FAMILY = 1;/.test(pbx) && !/TARGETED_DEVICE_FAMILY = "1,2";/.test(pbx));
    const build = read('scripts/build.js');
    test('the website build never ships the native project, its offline page or the Capacitor config',
      /'ios'/.test(build) && /'native-shell'/.test(build) && /'capacitor\.config\.json'/.test(build));
    const html = read('index.html');
    const head = html.slice(0, html.indexOf('</head>'));
    const ns = read('native-shell.js');
    test('index.html loads native-shell.js in <head>; it returns early on the website',
      /<script src="native-shell\.js"><\/script>/.test(head) && /if \(!native\) return;/.test(ns) && /CertAnvilApp/.test(ns));
    const off = read('native-shell/index.html');
    test('the offline page has no inline handlers', off.length > 0 && !/\son[a-z]+=/.test(off));
    // Task 4: Apple Guideline 3.1.1 — no web purchase link inside the app
    const dg = read('dg-system.css');
    const SEL = ['.a2hs-banner', '#ios-settings [data-act="gopro"]', '.ifr-see', '#ios-check [data-act="limit-pro"]', '.settings-go-pro-btn', 'a[href*="certanvil.com/pricing"]', 'a[href*="manage-subscription"]'];
    test('every web purchase link is hidden under html.is-native in the app (3.1.1)',
      SEL.every((x) => dg.indexOf('html.is-native ' + x) >= 0));
    const lh = read('landing/native-hide.js'), ldg = read('landing/dg-system.css');
    const pages = ['index.html', 'pricing.html', 'account.html', 'manage-subscription.html'].map((f) => read('landing/' + f));
    test('the landing pages load their own native-hide.js (same CertAnvilApp UA test) and hide purchase links in the app',
      /CertAnvilApp/.test(lh) && /is-native/.test(lh) && /html\.is-native a\[href\*="pricing"\]/.test(ldg)
      && pages.every((h) => { const head = h.slice(0, h.indexOf('</head>')); return /<script src="native-hide\.js"><\/script>/.test(head); }));
    // Task 5: June's offline page (the app's errorPath)
    test("the app's offline page is June's: exact copy, Try again, no network fetch",
      off.indexOf("You're offline.") >= 0 && off.indexOf('Your progress is <b>saved on this device</b> and will sync when you') >= 0
      && off.indexOf('Saved locally, will sync') >= 0 && />Try again</.test(off) && !/<link[^>]+https?:/.test(off) && !/fetch\(/.test(off)
      && /lastCertHost/.test(off) && /networkplus\.certanvil\.com/.test(off));
    const all = fs.readdirSync(path.join(ROOT, 'landing')).filter((f) => /\.html$/.test(f)).map((f) => [f, read('landing/' + f)]);
    const missing = all.filter(([, h]) => /href="dg-system\.css/.test(h) && !/<script src="native-hide\.js"><\/script>/.test(h.slice(0, h.indexOf('</head>')))).map(([f]) => f);
    test('every landing page that loads dg-system.css also loads native-hide.js (no pricing link anywhere in the app)', missing.length === 0);
    // F3 Task 3: the app opens on the picker; requireAccount guards a signed-out launch, never an offline signed-in one
    const sfn = _fnBody(ns, 'settledSignedOut');
    const sctx = vm.createContext({});
    vm.runInContext(sfn + '\nthis.f = settledSignedOut;', sctx);
    const SS = (e) => sctx.f(e);
    test('_nsSettledSignedOut: true only when the flag is false, no stored session and online',
      !!sfn && SS({ flag: false }) === true && SS({ flag: false, hasSession: true }) === false && SS({ flag: false, offline: true }) === false
      && SS({ flag: true }) === false && SS({ flag: undefined }) === false && /window\._nsSettledSignedOut\s*=\s*settledSignedOut/.test(ns));
    const ready = _fnBody(ns, 'onReady');
    test('onReady with no chosenCert opens the picker directly (no S.welcome) and keeps the pending-code guard',
      !!ready && !/welcome/.test(ready) && /_pending/.test(ready) && /iosFirstRun\.picker|IFR\.picker|window\.iosFirstRun\.picker/.test(ready)
      && ready.indexOf('_pending') < ready.indexOf('.picker('));
    test('onReady with a chosenCert runs requireAccount only after the lockedCert holdLock branch has returned',
      ready.indexOf('holdLock(c.lockedCert); return;') > 0 && ready.indexOf("caNative.requireAccount(") > ready.indexOf('holdLock(c.lockedCert); return;'));
    test('requireAccount: native only, not twice (isi-open), cert name from iosFirstRun.certName, back only on firstrun with empty history; unchoose + _backToPicker defined',
      /caNative\.requireAccount\s*=\s*function/.test(ns) && /isi-open/.test(ns) && /iosFirstRun\.certName/.test(ns) && /hasStoredSession\(\)/.test(ns)
      && /ifr-offline/.test(ns) && /unchoose: function/.test(ns) && /_backToPicker\s*=/.test(ns) && /STORAGE\.HISTORY/.test(ns) && /STORAGE\.FREE_CERT_ID/.test(ns));
    const hfn = _fnBody(ns, 'storedSession'), hctx = vm.createContext({});
    vm.runInContext(hfn + '\nthis.f = storedSession;', hctx);
    const HS = (c, k) => hctx.f(c, k);
    test('_nsHasStoredSession: certanvil cookie (plain or chunked) or sb-*-auth(-token) key counts; unrelated or empty does not',
      !!hfn && HS('a=1; sb-certanvil-auth=abc', []) === true && HS('sb-certanvil-auth.0=abc; sb-certanvil-auth.1=def', []) === true
      && HS('', ['sb-xyz-auth-token']) === true && HS('', ['sb-certanvil-auth']) === true
      && HS('a=1; theme=dark', ['nplus_history', 'sb-xyz-other']) === false && HS('sb-certanvil-auth=', []) === false && HS('', []) === false && HS() === false
      && /window\._nsHasStoredSession\s*=\s*storedSession/.test(ns));
    test('_backToPicker continues whether or not unchoose resolves', /Promise\.resolve\(u\)\.then\(go, go\)/.test(ns));
    const fr = read('features/ios-firstrun.js');
    test('iosFirstRun.certName returns the cert name', /IFR\.certName\s*=\s*function\s*\(\)\s*\{\s*return certInfo\(\)\.name;\s*\}/.test(fr));
  } catch (err) {
    test('Stage 5a native shell: block (threw)', false);
    results.errors.push('508 native-shell block threw: ' + err.message);
  }
})();
