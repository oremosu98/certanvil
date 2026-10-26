// Lift B4 (26 Oct): Settings on phones (features/ios-settings.js). The page and its two sheets as pure model/view
// pairs run in a vm sandbox, plus the markup and wiring checks of the phone host.
const { _fnBody, fs, html, path, ROOT, results, test, vm } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift B4 Settings (phone) ──\x1b[0m');
  try {
    const p = path.join(ROOT, 'features', 'ios-settings.js');
    const src = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Number, Date });
    vm.runInContext(['_iosStModel', '_iosStHtml', '_iosStCertSheetHtml', '_iosStExamSheetHtml'].map(n => _fnBody(src, n) || '').join('\n'), ctx);
    const run = (expr, s) => { ctx.__s = s; return vm.runInContext(expr, ctx); };
    const S = (o) => Object.assign({
      signedIn: true, email: 'simi@example.com', pro: false, cert: { name: 'Network+', code: 'N10-009' }, passPlanHtml: '<div class="pp">PLAN</div>',
      glance: { sync: true, exam: null, goal: 15, today: 6 }, goal: 15, review: { size: 5, topUp: false },
      backups: [{ iso: '2026-06-08', bytes: 198451, capturedAt: '2026-06-08T18:36:00' }], wrongCount: 9, still: false
    }, o);
    const H = (o) => run('_iosStHtml(_iosStModel(__s))', S(o));
    const count = (h, re) => (h.match(re) || []).length;

    const out = H({ signedIn: false, email: null });
    test('Settings phone: signed out shows the sign-in card, Cloud sync Off, no Sign out or Delete account',
      out.indexOf('Sign in to keep your progress') >= 0
      && out.indexOf('Right now your progress lives only on this phone, so deleting the app would lose it. Sign in to back it up and carry on from any device.') >= 0
      && /data-act="signin"/.test(out) && !/data-act="signout"/.test(out) && !/data-act="delete"/.test(out) && /Cloud sync[\s\S]*?>Off</.test(out));

    const free = H({ email: 'a&b<c>@x.io' });
    test('Settings phone: free signed in escapes the email, shows Free, the Go Pro row and both free lines',
      free.indexOf('a&amp;b&lt;c&gt;@x.io') >= 0 && free.indexOf('a&b<c>') < 0 && />Free</.test(free)
      && free.indexOf('Unlimited questions and every cert') >= 0 && count(free, /data-act="gopro"/g) === 3
      && free.indexOf('Free is fixed at <b>15 questions a day</b>. Go Pro to set a higher goal.') >= 0
      && free.indexOf('Free review is <b>5 cards a day</b>. Pro lets you review everything that’s due and top up on light days.') >= 0
      && !/data-act="goal-save"/.test(free) && /data-act="signout"/.test(free) && /data-act="delete"/.test(free));

    const pro = H({ pro: true, goal: 30, review: { size: 'all', topUp: true } });
    test('Settings phone: Pro shows the Pro pill, presets with the saved goal pressed, All due pressed and the top-up switch on',
      />Pro</.test(pro) && !/data-act="gopro"/.test(pro) && /data-act="goal-pick" data-n="30" aria-pressed="true"/.test(pro)
      && /data-act="goal-save"/.test(pro) && /data-act="review-pick" data-n="all" aria-pressed="true"/.test(pro)
      && /data-act="topup"[^>]*aria-pressed="true"/.test(pro) && pro.indexOf('<div class="pp">PLAN</div>') >= 0);

    test('Settings phone: backup rows read "8 June" and "193.8 KB · saved 18:36"; none reads the empty line',
      free.indexOf('8 June') >= 0 && free.indexOf('193.8 KB · saved 18:36') >= 0 && /data-act="restore" data-date="2026-06-08"/.test(free)
      && H({ backups: [] }).indexOf('No automatic backups yet. One will be made on your next visit.') >= 0);

    test('Settings phone: the exam glance row reads "14 Dec · 49 days", or "Not set"',
      H({ glance: { sync: true, exam: { date: '2026-12-14', days: 49 }, goal: 15, today: 6 } }).indexOf('14 Dec · 49 days') >= 0
      && free.indexOf('Not set') >= 0);

    const CERTS = [{ id: 'netplus', glyph: 'N+', name: 'Network+', code: 'N10-009', tier: 'free' }, { id: 'secplus', glyph: 'S+', name: 'Security+', code: 'SY0-701', tier: 'pro' }, { id: 'az900', glyph: 'AZ', name: 'A&Z <x>', code: 'AZ-900', tier: 'pro' }];
    const cs = run('_iosStCertSheetHtml(__s)', { certs: CERTS, active: 'netplus', pro: false });
    test('Settings phone: the cert sheet ticks the active cert (no action), tags Pro certs for free users, escapes names',
      count(cs, /class="ist-pro-tag"/g) === 2 && !/data-id="netplus"/.test(cs) && /data-act="pick-cert" data-id="secplus"/.test(cs)
      && cs.indexOf('A&amp;Z &lt;x&gt;') >= 0 && cs.indexOf('Switch cert') >= 0 && cs.indexOf('Your progress stays with each cert.') >= 0
      && count(run('_iosStCertSheetHtml(__s)', { certs: CERTS, active: 'netplus', pro: true }), /class="ist-pro-tag"/g) === 0);

    const ex = run('_iosStExamSheetHtml(__s)', { code: 'N10-009', year: 2026, month: 11, selected: '2026-12-14', today: '2026-12-10' });
    const firstCells = ex.slice(ex.indexOf('class="ist-cal-grid"'));
    test('Settings phone: the exam sheet starts December 2026 on a Tuesday, selects 14, disables past days, offers Remove',
      /ist-cal-grid[^>]*>(<span class="ist-dow">[A-Z]<\/span>){7}<span class="ist-blank"><\/span><button/.test(firstCells)
      && /class="ist-day sel"[^>]*data-iso="2026-12-14"/.test(ex) && /data-iso="2026-12-09"[^>]*disabled/.test(ex)
      && ex.indexOf('Save 14 December') >= 0 && ex.indexOf('Remove exam date') >= 0 && ex.indexOf('Pick the day you sit N10-009. You can change it any time.') >= 0
      && run('_iosStExamSheetHtml(__s)', { code: 'N10-009', year: 2026, month: 11, selected: null, today: '2026-12-10' }).indexOf('Remove exam date') < 0);

    test('Settings phone: no em-dash or arrow glyph in any phone output',
      [out, free, pro, cs, ex].every(h => h.indexOf('—') < 0 && h.indexOf('→') < 0));

    const auth = fs.readFileSync(path.join(ROOT, 'auth-state.js'));
    test('auth-state.js (gated lane) is untouched by Lift B4',
      require('crypto').createHash('sha256').update(auth).digest('hex') === '87af4f136c474b725d2144de8258597665cf6aacc0bd5b65761ffb0e0625a86d');
  } catch (err) {
    test('Lift B4 Settings: block (threw)', false);
    results.errors.push('506 ios-settings block threw: ' + err.message);
  }
})();
