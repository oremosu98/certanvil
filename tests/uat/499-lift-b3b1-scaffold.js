// Lift B3b1 (22 Oct): the phone Sim Lab chrome. No app top bar on the three Sim Lab pages, no tab
// bar on the round and the verdict, the phone start screen's host, and the practice scope guard.
const { _fnBody, fs, html, path, ROOT, results, test } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift B3b1 scaffold (Sim Lab) ──\x1b[0m');
  try {
    const ios = fs.readFileSync(path.join(ROOT, 'lift-ios.css'), 'utf8');
    const shell = fs.readFileSync(path.join(ROOT, 'lift-shell.js'), 'utf8');
    const sl = fs.readFileSync(path.join(ROOT, 'features', 'sim-lab.js'), 'utf8');
    test('#isl-entry is the first child of #page-sim-lab-entry, ios-only iq-screen',
      /<div id="page-sim-lab-entry" class="page">\s*<section id="isl-entry" class="ios-only iq-screen" aria-label="Sim Lab"><\/section>/.test(html));
    const i = html.indexOf('<div id="page-sim-lab-entry"'), j = html.indexOf('<div id="page-sim-lab"', 0);
    const end = html.indexOf('<!--', html.indexOf('data-action="simLabSessionStart"', i));
    test('#page-sim-lab-entry carries no inline on*= handlers (Sec-P7)', i > 0 && !/\son[a-z]+=/.test(html.slice(i, end)));
    test('features/ios-simlab.js loads deferred right after ios-drills.js',
      /<script defer src="features\/ios-drills\.js"><\/script>\s*<script defer src="features\/ios-simlab\.js"><\/script>/.test(html));
    test('lift-shell HIDE_ON hides the tab bar on the round and the verdict, not the start screen',
      /'sim-lab': 1/.test(shell) && /'sim-lab-result': 1/.test(shell) && !/'sim-lab-entry': 1/.test(shell));
    test('lift-ios.css hides the app top bar on all three Sim Lab pages',
      ['#page-sim-lab-entry.active', '#page-sim-lab.active', '#page-sim-lab-result.active'].every(function (p) {
        return new RegExp('body:has\\(' + p.replace(/[.#-]/g, '\\$&') + '\\) #app-topbar').test(ios);
      }));
    test('lift-ios.css hides the old start screen beside a rendered #isl-entry',
      /#page-sim-lab-entry:has\(#isl-entry:not\(:empty\)\) > :not\(#isl-entry\)\s*\{\s*display:\s*none\s*!important;?\s*\}/.test(ios));
    const ss = _fnBody(sl, '_slSessionStart') || '', pp = _fnBody(sl, '_slRenderPracticePage') || '', es = _fnBody(sl, '_slExamStart') || '';
    test('practice session and the legacy single PBQ mark #page-sim-lab isl-practice; Exam mode clears it',
      /_slSetPractice\(true\)/.test(ss) && /_slSetPractice\(true\)/.test(pp) && /_slSetPractice\(false\)/.test(es));
    const rr = _fnBody(sl, '_slRunRound') || '', rd = _fnBody(sl, '_slRenderRound') || '', dl = _fnBody(sl, '_dlRunRound') || '';
    test('lift: true is passed by the two practice callers only (not Exam mode, not Decision Lab)',
      /\{ lift: true,\s*onReset: function \(\) \{ _slMountScenario\(body, scn, this\); \}/.test(rr)
      && /\{ lift: true,\s*onReset: function \(\) \{ _slMountScenario\(body, scn, this\); \}/.test(pp)
      && !/lift: true/.test(rd) && !/lift: true/.test(dl) && (sl.match(/lift: true/g) || []).length === 2);
  } catch (err) {
    test('Lift B3b1 scaffold: block (threw)', false);
    results.errors.push('499 lift-b3b1-scaffold block threw: ' + err.message);
  }
})();
