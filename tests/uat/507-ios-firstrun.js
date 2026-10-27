// Lift C (26 Oct): first run on phones (features/ios-firstrun.js). The state rules and every screen as pure
// model/view functions run in a vm sandbox, plus the wiring checks of the phone host.
const { _fnBody, fs, path, ROOT, test, results, vm } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift C first run (phone) ──\x1b[0m');
  try {
    const p = path.join(ROOT, 'features', 'ios-firstrun.js');
    const src = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    const NAMES = ['_ifrState', '_ifrScale', '_ifrDay0Html', '_ifrCappedHtml', '_ifrCheckHtml', '_ifrScoreHtml',
      '_ifrLimitHtml', '_ifrOfflineHtml', '_ifrPickerHtml', '_ifrLockSheetHtml', '_ifrLastCheckHtml', '_ifrRestoreHtml'];
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Number, Date });
    vm.runInContext(NAMES.map(n => _fnBody(src, n) || '').join('\n'), ctx);
    const run = (expr, s) => { ctx.__s = s; return vm.runInContext(expr, ctx); };
    const noDash = (h) => h.indexOf('—') < 0 && h.indexOf('→') < 0;
    const ST = (o) => run('_ifrState(__s)', Object.assign({ cert: 'netplus', historyRows: 0, snapshot: null, skipped: false, pro: false, signedIn: true, remaining: 15 }, o));

    test('first run state: no history and no snapshot is day-0; a snapshot alone is placed; a skip ends day-0',
      ST({}).day0 === true && ST({}).placed === false && ST({ snapshot: { score: 465 } }).placed === true && ST({ snapshot: { score: 465 } }).day0 === false
      && ST({ skipped: true }).day0 === false && ST({ historyRows: 3 }).placed === true);
    test('first run state: free signed in with 0 left is capped; Pro or signed out never is',
      ST({ historyRows: 3, remaining: 0 }).capped === true && ST({ historyRows: 3, remaining: 0, pro: true }).capped === false
      && ST({ historyRows: 3, remaining: 0, signedIn: false }).capped === false);

    const sc = run('_ifrScale(__s)', { examPassScore: 700, examMaxScore: 1000, examMinScore: 1 });
    const scN = run('_ifrScale(__s)', { examPassScore: 720, examMaxScore: 900 });
    test('the scale comes from the cert pack (min defaults to 100 only when the pack has none)',
      sc.min === 1 && sc.max === 1000 && sc.pass === 700 && scN.min === 100 && scN.max === 900 && scN.pass === 720);

    const D = (o) => run('_ifrDay0Html(__s)', Object.assign({ cert: { name: 'Network+', code: 'N10-009', glyph: 'N+' }, pro: false, remaining: 15, scale: scN }, o));
    const d0 = D({}), d0p = D({ pro: true });
    test('day-0 Home (free): headline, quota rows, the check and today\'s 15, the cert\'s own scale',
      d0.indexOf('Your exam is set') >= 0 && d0.indexOf("Let's place your readiness.") >= 0 && d0.indexOf('15 of 15 ready') >= 0
      && d0.indexOf('Scored 100 to 900, with 720 to pass.') >= 0 && /data-act="check"/.test(d0) && /data-act="today"[^>]*>Start today's 15</.test(d0)
      && d0.indexOf('never counts against <b>your daily 15</b>') >= 0);
    test('day-0 Home (Pro): no quota rows, no "daily 15", Start a quiz',
      d0p.indexOf('New practice') < 0 && d0p.indexOf('daily 15') < 0 && />Start a quiz</.test(d0p) && />Pro</.test(d0p));

    const cap = run('_ifrCappedHtml(__s)', { cert: { name: 'Network+', code: 'N10-009', glyph: 'N+' }, due: 5, hours: 5 });
    test('capped Home: Done for today, Start review, See Pro, the reset hours',
      cap.indexOf('Done for today') >= 0 && cap.indexOf("That's today's 15 done.") >= 0 && cap.indexOf('15 fresh questions unlock in about 5 hours') >= 0
      && /data-act="review"/.test(cap) && /data-act="gopro"/.test(cap));

    const Q = { text: 'Which port does A&B <x> use?', options: ['80', '443', '22', '3389'], topic: 'Ports' };
    const ck = run('_ifrCheckHtml(__s)', { n: 1, total: 5, q: Q, picked: null, pro: false, code: 'N10-009' });
    const ckP = run('_ifrCheckHtml(__s)', { n: 2, total: 5, q: Q, picked: 'B', pro: false, code: 'N10-009' });
    test('the check: Question 1 of 5, escaped text, Next disabled until a pick, Skip the check',
      ck.indexOf('Question 1 of 5') >= 0 && ck.indexOf('A&amp;B &lt;x&gt;') >= 0 && /data-act="next"[^>]*disabled/.test(ck)
      && !/data-act="next"[^>]*disabled/.test(ckP) && /data-act="pick" data-l="B"[^>]*aria-pressed="true"/.test(ckP) && /data-act="skip"/.test(ck));

    const so = run('_ifrScoreHtml(__s)', { score: 512, scale: sc, cert: { name: 'Azure AI Fundamentals', code: 'AI-901', glyph: 'AI' }, pro: true });
    test('the score: the cert\'s scale, no 720/900 literal, Start practising, no readiness-explainer link',
      so.indexOf('/ 1000 readiness') >= 0 && so.indexOf('Pass 700') >= 0 && so.indexOf('720') < 0 && so.indexOf('900') < 0
      && so.indexOf('A starting point, not a grade.') >= 0 && /data-act="practise"/.test(so) && so.indexOf('See how readiness works') < 0);

    const lim = run('_ifrLimitHtml(__s)', { picked: 25, remaining: 7 });
    test('daily limit: the picked size, "Start a 7-question set", Go Pro for unlimited',
      lim.indexOf('<b>25-question</b>') >= 0 && />Start a 7-question set</.test(lim) && />Go Pro for unlimited</.test(lim) && lim.indexOf('instead') < 0);

    const CERTS = [{ id: 'netplus', glyph: 'N+', name: 'Network+', code: 'N10-009' }, { id: 'ai900', glyph: 'AI', name: 'A&B <x>', code: 'AI-901' }];
    const pk = run('_ifrPickerHtml(__s)', { certs: CERTS, selected: 'netplus', pro: false });
    const pkP = run('_ifrPickerHtml(__s)', { certs: CERTS, selected: 'netplus', pro: true });
    const lk = run('_ifrLockSheetHtml(__s)', { name: 'Network+' });
    test('picker: AI-901 label, escaped names, Lock in for free; Pro reads Start with and has no lock action',
      pk.indexOf('AI-901') >= 0 && pk.indexOf('AI-900') < 0 && pk.indexOf('A&amp;B &lt;x&gt;') >= 0 && /data-act="lock"[^>]*>Lock in Network\+</.test(pk)
      && />Start with Network\+</.test(pkP) && !/data-act="lock"/.test(pkP));
    test('lock-in sheet: the three June terms, Lock in and Go back',
      lk.indexOf('Lock in Network+?') >= 0 && lk.indexOf('20 questions a day') >= 0 && lk.indexOf('A fresh set each morning') >= 0
      && /data-act="lock-go"/.test(lk) && /data-act="lock-back"/.test(lk));

    const lc = run('_ifrLastCheckHtml(__s)', { name: 'A&B' });
    test('stage 5a: the last check before a free exam is locked (escaped, exact copy, both actions)',
      lc.indexOf('One last check') >= 0 && lc.indexOf("<b>A&amp;B</b> will be your exam on Free. You can't switch to another exam unless you go Pro.") >= 0
      && />Yes, lock in A&amp;B</.test(lc) && /data-act="last-go"/.test(lc) && /data-act="last-back"[^>]*>Go back</.test(lc) && lc.indexOf('—') < 0);
    const off = run('_ifrOfflineHtml()', {}), rs = run('_ifrRestoreHtml()', {});
    test('offline and restore: June copy',
      off.indexOf("You're offline.") >= 0 && off.indexOf('Saved locally, will sync') >= 0 && rs.indexOf('Picking up where you left off') >= 0);
    test('no em-dash or arrow in any Lift C output, and no inline handlers in the module',
      [d0, d0p, cap, ck, so, lim, pk, pkP, lk, off, rs].every(noDash) && !/\son[a-z]+=/.test(src));
    const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
    const dg = fs.readFileSync(path.join(ROOT, 'features', 'diagnostic.js'), 'utf8');
    test('the check stays off the daily 15: the batch fetch reads _metered from the Lift C flag, app.js within its ratchet',
      /_metered: !window\._ifrUnmetered/.test(appSrc) && appSrc.split('\n').length <= 8302);
    test('diagnostic.js has no 720 pass-mark fallback; the phone check hooks in through onReady and _diagApi',
      !/:\s*720\b/.test(dg) && /opts\.onReady/.test(dg) && /window\._diagApi\s*=/.test(dg));
    const R = require(path.join(ROOT, 'lib', 'router.js'));
    const free = (meta) => ({ metadata: meta || {} });
    test('router (free): a detected cert with no saved choice and no activation is first-run "no-cert"; a saved choice is used',
      R.routeOnLaunch({ isLoggedIn: true, profile: free({}), detectedCert: 'netplus' }).reason === 'no-cert'
      && R.routeOnLaunch({ isLoggedIn: true, profile: free({ freeCertId: 'secplus' }), detectedCert: 'netplus' }).certId === 'secplus');
    test('router (free): an already-activated detected cert is cert-home, never the picker',
      R.routeOnLaunch({ isLoggedIn: true, profile: free({ activated: { netplus: true } }), detectedCert: 'netplus' }).kind === 'cert-home'
      && R.routeOnLaunch({ isLoggedIn: true, profile: free({ readiness_snapshots: { netplus: { score: 500 } } }), detectedCert: 'netplus' }).kind === 'cert-home');
    const fr = fs.readFileSync(path.join(ROOT, 'lib', 'onboarding-firstrun.js'), 'utf8');
    const ob = fs.readFileSync(path.join(ROOT, 'lib', 'onboarding-boot.js'), 'utf8');
    test('first run: no 720 fallback; boot marks a cert with history as activated and carries the saved free cert',
      !/\|\|\s*720\b/.test(fr) && /STORAGE\.HISTORY|nplus_history/.test(ob) && /freeCertId/.test(ob));
  } catch (err) {
    test('Lift C first run: block (threw)', false);
    results.errors.push('507 ios-firstrun block threw: ' + err.message);
  }
})();
