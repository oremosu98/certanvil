// F3 (30 Oct): the four-tip tour on the first normal Home (features/ios-tour.js), and Account's "Replay the tour".
// The bubble view and the steps run in a vm sandbox; the start rules and the Settings row are checked as wiring.
const { _fnBody, fs, html, path, ROOT, results, test, vm } = require('./_context');
(function () {
  console.log('\n\x1b[1m── F3 first-Home tour ──\x1b[0m');
  try {
    const p = path.join(ROOT, 'features', 'ios-tour.js');
    const src = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    // The module exports its pure parts before it touches the DOM, so it loads in a sandbox with no document.
    const win = { CERT_PACK: { meta: { examPassScore: 720, examMaxScore: 900 } } };
    const ifr = fs.readFileSync(path.join(ROOT, 'features', 'ios-firstrun.js'), 'utf8');
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Number, window: win });
    vm.runInContext((_fnBody(ifr, '_ifrScale') || '') + '\nwindow._ifrScale = _ifrScale;', ctx);
    if (src) vm.runInContext(src, ctx);
    const H = (m) => (typeof win._itTourHtml === 'function' ? win._itTourHtml(m) : '');
    const S = win._IT_STEPS || [];

    const h1 = H({ step: 1, total: 4, h: 'Your readiness score', p: 'It runs <b>x</b>' });
    test('tour bubble: "1 of 4", the X labelled "Close tour", the heading, the text, and Next',
      h1.indexOf('<span class="tt-count">1 of 4</span>') >= 0
      && /<button[^>]*class="tt-x"[^>]*data-act="close"[^>]*aria-label="Close tour"/.test(h1)
      && /<h3 class="tt-h" id="it-h">Your readiness score<\/h3>/.test(h1)
      && h1.indexOf('<p class="tt-p">It runs <b>x</b></p>') >= 0
      && /<button[^>]*class="tt-next"[^>]*data-act="next"[^>]*>Next<\/button>/.test(h1));
    const h4 = H({ step: 4, total: 4, h: 'A & B', p: 'q' });
    test('tour bubble: step 4 says "4 of 4" and Done; the heading is escaped',
      h4.indexOf('4 of 4') >= 0 && />Done<\/button>/.test(h4) && !/>Next</.test(h4) && h4.indexOf('A &amp; B') >= 0);
    test('tour bubble: no em dashes or arrows', [h1, h4].every((h) => h.indexOf('—') < 0 && h.indexOf('→') < 0));

    test('tour steps: four anchors in order (readiness, Recommended next, the Drills and Progress tabs)',
      S.length === 4 && S[0].sel === '#ios-home .ih-rd' && S[1].sel === '#ios-home .ih-rec'
      && S[2].sel === '#lift-tabbar .lift-tab[data-page="drills"]' && S[3].sel === '#lift-tabbar .lift-tab[data-page="progress"]');
    test('tour steps: the four headings as drawn',
      S.length === 4 && S[0].h === 'Your readiness score' && S[1].h === 'Not sure what to do?'
      && S[2].h === 'Drills for weak spots' && S[3].h === 'See how you’re doing');
    test('tour steps: the copy as drawn',
      S.length === 4 && S[0].p === 'It runs from 100 to 900, and <b>720 is a pass</b>. It unlocks after your first quiz and climbs as you answer.'
      && S[1].p === 'Tap <b>Recommended next</b>. It picks your next session from what you’ve answered so far.'
      && S[2].p === 'Go back over the questions you got wrong, or practise one topic at a time.'
      && S[3].p === 'Progress shows your score over time and how each exam topic is going. You can replay this tour any time from <b>Account</b>.');
    win.CERT_PACK = { meta: { examPassScore: 700, examMaxScore: 1000, examMinScore: 1 } };
    test('tour step 1 takes its numbers from the cert pack, not literals',
      S.length === 4 && S[0].p.indexOf('It runs from 1 to 1000, and <b>700 is a pass</b>.') === 0 && !/100 to 900|720 is a pass/.test(src));

    const ms = _fnBody(src, 'maybeStart');
    test('tour starts only on the normal Home: phone, Home active, homeState() === null, not offline, signed in, not seen, not open',
      /homeState\(\) === null/.test(ms) && /_certanvilSignedIn === true/.test(ms) && /ifr-offline/.test(ms)
      && /page-setup/.test(ms) && /isPhone\(\)/.test(ms) && /seen/.test(ms));
    test('tour "seen": app Preferences tourSeen, website localStorage ca_tour_seen; opening marks it seen',
      /caNative\.get\('tourSeen'\)/.test(src) && /caNative\.set\('tourSeen'/.test(src) && /'ca_tour_seen'/.test(src) && /markSeen\(\)/.test(_fnBody(src, 'open')));
    test('tour host: one fixed dialog, aria-modal, labelled by its heading',
      /id="ios-tour"|\.id = 'ios-tour'/.test(src) && /'aria-modal', 'true'/.test(src) && /'aria-labelledby', 'it-h'/.test(src));
    test('tour re-places on resize, Home scroll (passive) and ca:home-shown without restarting',
      /addEventListener\('resize'/.test(src) && /addEventListener\('scroll'[\s\S]{0,240}passive: true/.test(src) && /addEventListener\('ca:home-shown'/.test(src));
    test('index.html loads features/ios-tour.js right after ios-reminders.js',
      /<script defer src="features\/ios-reminders\.js"><\/script>\s*<script defer src="features\/ios-tour\.js"><\/script>/.test(html));

    // Settings: the row is the last in Study setup, signed in only
    const sp = fs.readFileSync(path.join(ROOT, 'features', 'ios-settings.js'), 'utf8');
    const sctx = vm.createContext({ Math, String, Array, Object, JSON, Number, Date });
    vm.runInContext(['_iosStModel', '_iosStHtml', '_iosStMethodsLabel'].map(n => _fnBody(sp, n) || '').join('\n'), sctx);
    const SH = (o) => { sctx.__s = Object.assign({ signedIn: true, email: 'a@b.c', cert: { name: 'Network+', code: 'N10-009' }, glance: { goal: 15, today: 0 }, review: { size: 5 }, backups: [] }, o); return vm.runInContext('_iosStHtml(_iosStModel(__s))', sctx); };
    const sin = SH({}), sout = SH({ signedIn: false });
    const grp = (h) => { const a = h.indexOf('Study setup</div>'); return a < 0 ? '' : h.slice(a, h.indexOf('<div class="ist-card', a)); };
    test('Settings: "Replay the tour" is the last row of Study setup when signed in',
      /data-act="tour"[\s\S]*Replay the tour<span>Four quick tips on Home<\/span>/.test(grp(sin))
      && grp(sin).indexOf('data-act="tour"') > grp(sin).indexOf('Today') && (grp(sin).match(/class="ist-row/g) || []).length >= 5);
    test('Settings: no tour row when signed out', sout.indexOf('data-act="tour"') < 0 && sout.indexOf('Replay the tour') < 0);
    test('Settings: ON.tour goes Home and starts the tour on the next ca:home-shown',
      /ON\.tour = function/.test(sp) && /iosTour\.start\(\)/.test(sp) && /ca:home-shown/.test(sp));
  } catch (err) {
    test('F3 tour: block (threw)', false);
    results.errors.push('514 ios-tour block threw: ' + err.message);
  }
})();
