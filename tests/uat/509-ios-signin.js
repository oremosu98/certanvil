// Stage 5b (28 Oct): sign in by email code inside the iOS app (features/ios-signin.js). The welcome, sign-in,
// typo check, code screen and lock toast as pure views run in a vm sandbox, plus the wiring checks.
const { _fnBody, fs, path, ROOT, test, results, vm } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Stage 5b sign in by email code ──\x1b[0m');
  try {
    const read = (p) => { const f = path.join(ROOT, p); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
    const src = read('features/ios-signin.js');
    const NAMES = ['_isiSignInHtml', '_isiCodeHtml', '_isiToastHtml', '_isiSuggest'];
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Number, Date, RegExp });
    vm.runInContext(NAMES.map(n => _fnBody(src, n) || '').join('\n'), ctx);
    const run = (expr, s) => { ctx.__s = s; try { return vm.runInContext(expr, ctx); } catch (_) { return ''; } };
    const noInline = (h) => !/\son[a-z]+=/.test(h);

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

    // Stage 5c: providers on the sign-in screen and the welcome line
    const sp = run('_isiSignInHtml(__s)', { email: '', typo: null, apple: true, google: true });
    const sperr = run('_isiSignInHtml(__s)', { email: '', typo: null, apple: true, google: false, providerErr: 'apple' });
    test('sign-in: Apple first then Google when both are ready; the 5b look when neither',
      sp.indexOf('data-act="apple"') > 0 && sp.indexOf('data-act="google"') > sp.indexOf('data-act="apple"') && !/data-act="apple"[^>]*hidden/.test(sp)
      && sp.indexOf('>Continue with Google<') > 0 && s.indexOf('data-act="google"') < 0 && /data-act="apple"[^>]*hidden/.test(s));
    test('sign-in: the provider failure line, verbatim',
      sperr.indexOf("Apple sign-in didn't finish. Try again, or use your email.") >= 0 && sperr.indexOf('data-act="google"') < 0
      && run('_isiSignInHtml(__s)', { apple: true, google: true, providerErr: 'google' }).indexOf("Google sign-in didn't finish. Try again, or use your email.") >= 0);
    // F3 Task 2: first-run and signed-out variants; the 735 welcome is gone
    const fr = run('_isiSignInHtml(__s)', { email: '', from: 'firstrun', cert: 'Network+', back: true });
    const frNo = run('_isiSignInHtml(__s)', { email: '', from: 'firstrun', cert: 'Network+', back: false });
    const so = run('_isiSignInHtml(__s)', { email: '', from: 'signedout', cert: 'Network+', back: true });
    const hm = run('_isiSignInHtml(__s)', { email: '', from: 'home' });
    const BACK = 'data-act="back"';
    test('first-run: Create your account to start, the cert named, Back only when asked',
      fr.indexOf('Create your account to start') >= 0 && fr.indexOf('Your <b>Network+</b> progress is saved to it, so you keep it if you switch phones.') >= 0
      && fr.indexOf(BACK) >= 0 && frNo.indexOf(BACK) < 0 && run('_isiSignInHtml(__s)', { from: 'firstrun', cert: 'N' }).indexOf(BACK) < 0);
    test('signed-out: Sign in to keep studying, never a Back',
      so.indexOf('Sign in to keep studying') >= 0 && so.indexOf('Your <b>Network+</b> progress is waiting in your account.') >= 0 && so.indexOf(BACK) < 0);
    test('every other entry keeps today\'s copy and Back; the cert name is escaped',
      hm.indexOf('Sign in or create your account') >= 0 && hm.indexOf('<b>Free to start.</b>') >= 0 && hm.indexOf(BACK) >= 0
      && run('_isiSignInHtml(__s)', { from: 'picker' }).indexOf(BACK) >= 0
      && run('_isiSignInHtml(__s)', { from: 'firstrun', cert: 'A<b>', back: true }).indexOf('A&lt;b&gt;') >= 0);
    test('the welcome screen is gone and the pending record carries where the user came from',
      src.indexOf('_isiWelcomeHtml') < 0 && src.indexOf("Know when you're ready") < 0 && src.indexOf('IS.welcome') < 0 && src.indexOf("'start'") < 0
      && /writePending\(email, Date\.now\(\), st\.from\)/.test(src) && /st\.from = p\.from \|\| 'picker'/.test(src)
      && /st\.from === 'firstrun'[\s\S]{0,80}IS\._backToPicker/.test(src));
    const SG = (v) => run('_isiSuggest(__s)', v);
    const MAP = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gamil.com': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com',
      'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'iclod.com': 'icloud.com', 'icoud.com': 'icloud.com' };
    test('typo check: every listed domain maps, a correct or malformed address does not',
      Object.keys(MAP).every((d) => SG('sam@' + d) === 'sam@' + MAP[d]) && SG('Sam@GMIAL.com ') === 'sam@gmail.com'
      && SG('sam@gmail.com') === null && SG('nope') === null && SG('') === null);

    // 28 Oct (founder test): "htomail.com" slipped through the fixed list; closeness now catches one-or-two-letter slips
    test('typo check: swapped, missing, extra or wrong letters near a common provider are caught',
      SG('simi@htomail.com') === 'simi@hotmail.com' && SG('a@hotmal.com') === 'a@hotmail.com' && SG('a@gmaill.com') === 'a@gmail.com'
      && SG('a@outlool.com') === 'a@outlook.com' && SG('a@icluod.com') === 'a@icloud.com' && SG('a@yahooo.co.uk') === 'a@yahoo.co.uk'
      && SG('a@hotmial.co.uk') === 'a@hotmail.co.uk');
    test('typo check: real addresses are left alone (other real providers, regional domains, work domains)',
      ['mail.com', 'ymail.com', 'gmx.com', 'live.com', 'live.co.uk', 'hotmail.co.uk', 'me.com', 'mac.com', 'aol.com', 'msn.com', 'proton.me', 'btinternet.com', 'certanvil.com', 'nhs.net', 'ac.uk', 'outlook.de', 'hotmail.fr', 'yahoo.de']
        .every((d) => SG('a@' + d) === null));
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
      [s, st, c, cx, t].every((h) => h.length > 0 && noInline(h) && h.indexOf('—') < 0));
    // Task 3: the lock rule (spec §After sign-in)
    const ns = read('native-shell.js'), cl = read('lib/cert-lock.js');
    test('native-shell records the free cert for signed-out users only (never over an account\'s)',
      /whenSignedOut\(function \(\) \{\s*try \{ if \(typeof STORAGE === 'object' && !localStorage\.getItem\(STORAGE\.FREE_CERT_ID\)\)/.test(ns) && /if \(s === false\) \{ fn\(\); return; \}/.test(ns));
    test('cert-lock check() falls back to the hydrated local STORAGE.FREE_CERT_ID',
      /meta\(opts\.profile\)\.freeCertId \|\| local \|\| null/.test(cl) && /localStorage\.getItem\(STORAGE\.FREE_CERT_ID\)/.test(cl));
    const bv = src.indexOf('IS._beforeVerify = function'), sub = src.indexOf('onStatusChange(', bv), call = src.indexOf('_beforeVerify ? IS._beforeVerify() : null'), vo = src.indexOf('verifyOtp(', call);
    test('the hydrate listener goes on before verifyOtp is called', bv > 0 && sub > bv && call > 0 && vo > call);
    // Task 5: the website signs in with the same code
    const la = read('landing/auth.js');
    const PAGES = ['index.html', 'pricing.html', 'account.html', 'analytics.html', 'manage-subscription.html'];
    const linkCopy = PAGES.filter((f) => /Check your inbox|sign-in link|one-click|magic link/i.test(read('landing/' + f)));
    test('no landing sign-in surface still talks about links (privacy/terms legal text is the founder\'s)', linkCopy.length === 0);
    test('landing/auth.js sends a code with no emailRedirectTo and verifies type email',
      la.indexOf('emailRedirectTo') < 0 && /signInWithOtp\(\{ email: email \}\)/.test(la) && /verifyOtp\(\{ email: email, token: token, type: 'email' \}\)/.test(la));
    const sentIds = (h) => ['auth-sent', 'auth-sent-email', 'auth-otp-boxes', 'auth-otp-error', 'auth-otp-new', 'auth-resend', 'auth-resend-wait', 'auth-different-email'].every((id) => h.indexOf('id="' + id + '"') >= 0);
    test('index.html and pricing.html share the code screen\'s ids', sentIds(read('landing/index.html')) && sentIds(read('landing/pricing.html')));
    // Legal pages (28 Oct): sign-in is described as a one-time email code; v1.1 recorded in each page's history
    const pv = read('landing/privacy.html'), tm = read('landing/terms.html');
    test('privacy and terms no longer describe magic links and record v1.1 (privacy may be v1.2)',
      ![pv, tm].some((h) => /magic[- ]link|sign-in link|one-use sign-in/i.test(h)) && /one-time/.test(pv) && /one-time/.test(tm)
      && /<strong>v1\.[12]<\/strong>/.test(pv) && /<strong>v1\.1<\/strong> \(28 October 2026\)/.test(pv) && /<strong>v1\.1<\/strong>/.test(tm) && /expires after 15 minutes/.test(pv));
    const stg = read('features/ios-settings.js');
    test('iOS Settings has an About section with Privacy Policy and Terms links that open in the in-app sheet',
      /ist-sect reveal">About</.test(stg) && stg.indexOf("legal('https://certanvil.com/privacy'") > 0 && stg.indexOf("legal('https://certanvil.com/terms'") > 0 && /target="_blank" rel="noopener" data-ext>/.test(stg)
      && stg.indexOf('ist-sect reveal">About') < stg.indexOf('Danger zone'));
    const html = read('index.html');
    test('index.html loads features/ios-signin.js and has the #ios-signin host',
      /<script defer src="features\/ios-signin\.js"><\/script>/.test(html) && /<div id="ios-signin"[^>]*hidden><\/div>/.test(html));
  } catch (err) {
    test('Stage 5b sign-in: block (threw)', false);
    results.errors.push('509 ios-signin block threw: ' + err.message);
  }
})();
