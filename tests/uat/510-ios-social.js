// Stage 5c (28 Oct): Sign in with Apple and Google. The pinned plugin, the native entitlement, and the one place
// that names the plugin (native-shell.js caNative.social).
const { fs, path, ROOT, test, results } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Stage 5c Apple and Google ──\x1b[0m');
  try {
    const read = (p) => { const f = path.join(ROOT, p); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
    const pkg = JSON.parse(read('package.json') || '{}');
    test('the social-login plugin is pinned to exactly 8.7.5',
      ((pkg.dependencies || {})['@capgo/capacitor-social-login']) === '8.7.5');
    const ent = read('ios/App/App/App.entitlements'), pbx = read('ios/App/App.xcodeproj/project.pbxproj');
    test('the app carries the Sign in with Apple entitlement in both build configurations',
      /com\.apple\.developer\.applesignin/.test(ent) && /<string>Default<\/string>/.test(ent)
      && (pbx.match(/CODE_SIGN_ENTITLEMENTS = App\/App\.entitlements;/g) || []).length >= 2);
    const ns = read('native-shell.js');
    test('native-shell.js defines SOCIAL, caNative.social and caNative.socialReady',
      /var SOCIAL = /.test(ns) && /social: function \(provider, opts\)/.test(ns) && /socialReady: function \(provider\)/.test(ns) && /USER_CANCELLED/.test(ns));
    const others = ['features/ios-signin.js', 'features/ios-settings.js', 'features/home.js', 'features/settings.js', 'app.js'].filter((f) => /SocialLogin/.test(read(f)));
    test('only native-shell.js names the SocialLogin plugin', others.length === 0);
    test('the website build still excludes the native project', /'ios'/.test(read('scripts/build.js')));
  } catch (err) {
    test('Stage 5c social: block (threw)', false);
    results.errors.push('510 ios-social block threw: ' + err.message);
  }
})();
