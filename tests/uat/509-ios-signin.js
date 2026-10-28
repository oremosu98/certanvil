// Stage 5b (28 Oct): sign in by email code inside the iOS app (features/ios-signin.js). The welcome, sign-in,
// typo check, code screen and lock toast as pure views run in a vm sandbox, plus the wiring checks.
const { _fnBody, fs, path, ROOT, test, results, vm } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Stage 5b sign in by email code ──\x1b[0m');
  try {
    const read = (p) => { const f = path.join(ROOT, p); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
    const src = read('features/ios-signin.js');
    const NAMES = ['_isiWelcomeHtml', '_isiSignInHtml', '_isiCodeHtml', '_isiToastHtml', '_isiSuggest'];
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Number, Date, RegExp });
    vm.runInContext(NAMES.map(n => _fnBody(src, n) || '').join('\n'), ctx);
    const run = (expr, s) => { ctx.__s = s; try { return vm.runInContext(expr, ctx); } catch (_) { return ''; } };
    const noInline = (h) => !/\son[a-z]+=/.test(h);

    const w = run('_isiWelcomeHtml()');
    test('welcome: June\'s copy, Get started, the 5b email line and Already have an account',
      w.indexOf("Know when you're ready") >= 0 && w.indexOf('>Get started<') >= 0 && w.indexOf('Sign in with email') >= 0
      && w.indexOf('Apple') < 0 && /Already have an account\? <b>Sign in<\/b>/.test(w) && /data-act="start"/.test(w) && /data-act="signin"/.test(w));

    const s = run('_isiSignInHtml(__s)', { email: '', typo: null });
    const st = run('_isiSignInHtml(__s)', { email: 'sam@gmial.com', typo: { fix: 'sam@gmail.com' } });
    test('sign-in: one screen, exact copy, the Apple button drawn but hidden until 5c',
      s.indexOf('Sign in or create your account') >= 0 && s.indexOf('<b>Free to start.</b> No password to remember.') >= 0
      && s.indexOf('>Email<') >= 0 && s.indexOf('>Continue<') >= 0 && s.indexOf("We'll email you a 6-digit code.") >= 0
      && s.indexOf('By continuing you agree to our') >= 0 && /<button[^>]*data-act="apple"[^>]*\shidden/.test(s)
      && /id="isi-email"/.test(s) && s.indexOf('Did you mean') < 0);
    test('sign-in: the typo check offers the fix with Yes, fix it / No, keep mine',
      st.indexOf('Did you mean <b>sam@gmail.com</b>?') >= 0 && /data-act="fix-yes"[^>]*>Yes, fix it</.test(st) && /data-act="fix-no"[^>]*>No, keep mine</.test(st)
      && st.indexOf('value="sam@gmial.com"') >= 0);

    const SG = (v) => run('_isiSuggest(__s)', v);
    const MAP = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gamil.com': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com',
      'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'iclod.com': 'icloud.com', 'icoud.com': 'icloud.com' };
    test('typo check: every listed domain maps, a correct or malformed address does not',
      Object.keys(MAP).every((d) => SG('sam@' + d) === 'sam@' + MAP[d]) && SG('Sam@GMIAL.com ') === 'sam@gmail.com'
      && SG('sam@gmail.com') === null && SG('nope') === null && SG('') === null);

    const c = run('_isiCodeHtml(__s)', { email: 'sam@example.test', left: 60, msg: '', kind: '', expired: false });
    const cx = run('_isiCodeHtml(__s)', { email: 'sam@example.test', left: 0, msg: 'That code has expired.', kind: 'err', expired: true });
    const c0 = run('_isiCodeHtml(__s)', { email: 'a<b@x.test', left: 0, msg: '', kind: '', expired: false });
    test('code screen: exact copy, six numeric boxes with one-time-code on the first, the 60s line and Change it',
      c.indexOf('Check your email') >= 0 && c.indexOf('We sent a 6-digit code to <b>sam@example.test</b>.') >= 0
      && (c.match(/inputmode="numeric"/g) || []).length === 6 && (c.match(/autocomplete="one-time-code"/g) || []).length === 1
      && c.indexOf('You can resend in <b>60s</b>.') >= 0 && /data-act="change"[^>]*>Wrong email\? Change it</.test(c) && /id="isi-msg"[^>]*role="alert"/.test(c));
    test('code screen: expired shows Send a new code and no resend line; at 0s Resend code; the email is escaped',
      cx.indexOf('That code has expired.') >= 0 && /data-act="send-new"[^>]*>Send a new code</.test(cx) && cx.indexOf('id="isi-resend"') < 0
      && /data-act="resend"[^>]*>Resend code</.test(c0) && c0.indexOf('a&lt;b@x.test') >= 0);

    const t = run('_isiToastHtml(__s)', 'Network+');
    test('lock toast: the account\'s exam, said plainly',
      t.indexOf('Your free exam on this account is <b>Network+</b>, so we\'ve opened it.') >= 0 && /role="status"/.test(t));

    test('no view has an inline handler or a dash flourish',
      [w, s, st, c, cx, t].every((h) => h.length > 0 && noInline(h) && h.indexOf('—') < 0));
    // Task 3: the lock rule (spec §After sign-in)
    const ns = read('native-shell.js'), cl = read('lib/cert-lock.js');
    test('native-shell records the free cert for signed-out users only (never over an account\'s)',
      /whenSignedOut\(function \(\) \{\s*try \{ if \(typeof STORAGE === 'object' && !localStorage\.getItem\(STORAGE\.FREE_CERT_ID\)\)/.test(ns) && /if \(s === false\) \{ fn\(\); return; \}/.test(ns));
    test('cert-lock check() falls back to the hydrated local STORAGE.FREE_CERT_ID',
      /meta\(opts\.profile\)\.freeCertId \|\| local \|\| null/.test(cl) && /localStorage\.getItem\(STORAGE\.FREE_CERT_ID\)/.test(cl));
    const bv = src.indexOf('IS._beforeVerify = function'), sub = src.indexOf('onStatusChange(', bv), call = src.indexOf('_beforeVerify ? IS._beforeVerify() : null'), vo = src.indexOf('verifyOtp(', call);
    test('the hydrate listener goes on before verifyOtp is called', bv > 0 && sub > bv && call > 0 && vo > call);
    const html = read('index.html');
    test('index.html loads features/ios-signin.js and has the #ios-signin host',
      /<script defer src="features\/ios-signin\.js"><\/script>/.test(html) && /<div id="ios-signin"[^>]*hidden><\/div>/.test(html));
  } catch (err) {
    test('Stage 5b sign-in: block (threw)', false);
    results.errors.push('509 ios-signin block threw: ' + err.message);
  }
})();
