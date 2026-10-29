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
    // Task 3: Settings → Sign-in methods (pure view, copy verbatim; the row only in the app)
    const { _fnBody, vm } = require('./_context');
    const st = read('features/ios-settings.js');
    const ctx = vm.createContext({ String, Array, Object });
    vm.runInContext(['_iosStMethodsLabel', '_iosStMethodsSheetHtml'].map((n) => _fnBody(st, n) || '').join('\n'), ctx);
    const run = (e, m) => { ctx.__m = m; try { return vm.runInContext(e, ctx); } catch (_) { return ''; } };
    const sh = run('_iosStMethodsSheetHtml(__m)', { email: 'a@b.test', methods: ['email'], apple: true, google: true });
    const shx = run('_iosStMethodsSheetHtml(__m)', { email: 'a@b.test', methods: ['email', 'apple'], apple: true, google: false, err: 'That Apple ID already has its own CertAnvil account. To use it, sign out and continue with Apple.' });
    test('Sign-in methods: title, sub, Email on, Apple and Google Add, the Hide My Email note',
      sh.indexOf('>Sign-in methods<') > 0 && sh.indexOf('Any of these opens this account.') > 0 && sh.indexOf('Email code') > 0
      && /data-act="add-apple"[^>]*>Add</.test(sh) && /data-act="add-google"[^>]*>Add</.test(sh)
      && sh.indexOf("Signed up with Apple's Hide My Email? Add Apple here so both open this account.") > 0);
    test('Sign-in methods: Connected once linked; Google hidden when not ready; the error line',
      shx.indexOf('Connected') > 0 && shx.indexOf('add-apple') < 0 && shx.indexOf('Google') < 0 && /ist-merr" role="alert">That Apple ID already/.test(shx)
      && run('_iosStMethodsLabel(__m)', ['email', 'apple', 'google']) === 'Email, Apple, Google' && run('_iosStMethodsLabel(__m)', null) === 'Email');
    test('the Sign-in methods row is app-only and signed-in only',
      /methodsRow: signedIn && !!window\.CA_NATIVE/.test(read('features/settings.js')) && /m\.methodsRow \? row\('methods'/.test(st));
    // Task 5: the website buttons
    const li = read('landing/index.html'), lp = read('landing/pricing.html'), la = read('landing/auth.js'), ldg = read('landing/dg-system.css');
    test('the landing modal on index and pricing has Apple and Google and no Soon pill',
      [li, lp].every((h) => /id="auth-apple"/.test(h) && /id="auth-google"/.test(h) && h.indexOf('coming-soon-pill">Soon') < 0 && h.indexOf('Coming soon · Google OAuth') < 0));
    test('website providers use signInWithOAuth back to the landing; hidden inside the app',
      /signInWithOAuth\(\{ provider: provider, options: \{ redirectTo: /.test(la) && /html\.is-native #auth-providers/.test(ldg));
    // Task 6: the real Google client IDs and the reversed iOS client ID as a URL scheme (GIDSignIn needs it)
    const plist = read('ios/App/App/Info.plist');
    const iosId = (ns.match(/googleIOS: '([^']+)'/) || [])[1] || '';
    test('Google iOS client ID is set and its reversed form is an app URL scheme',
      /\.apps\.googleusercontent\.com$/.test(iosId) && /googleWeb: '[^']+\.apps\.googleusercontent\.com'/.test(ns)
      && plist.indexOf('<string>com.googleusercontent.apps.' + iosId.replace('.apps.googleusercontent.com', '') + '</string>') > 0);
    test('the website build still excludes the native project', /'ios'/.test(read('scripts/build.js')));
  } catch (err) {
    test('Stage 5c social: block (threw)', false);
    results.errors.push('510 ios-social block threw: ' + err.message);
  }
})();
