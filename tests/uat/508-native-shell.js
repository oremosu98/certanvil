// Stage 5a (27 Oct): the iOS native shell (ADR-004). The Capacitor config, the iPhone-only project, the build
// exclusions, and native-shell.js staying a no-op on the website.
const { fs, path, ROOT, test, results } = require('./_context');
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
  } catch (err) {
    test('Stage 5a native shell: block (threw)', false);
    results.errors.push('508 native-shell block threw: ' + err.message);
  }
})();
