// Lift B3b1 (22 Oct): practice Sim Lab on phones (features/ios-simlab.js). Pure model/view pairs for
// the start screen and the verdict, run in a vm sandbox, plus source checks on the sim-lab.js hooks.
const { _fnBody, fs, path, ROOT, results, test, vm } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift B3b1 Sim Lab (phone) ──\x1b[0m');
  try {
    const src = fs.readFileSync(path.join(ROOT, 'features', 'ios-simlab.js'), 'utf8');
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Number, isFinite });
    vm.runInContext(['_iosSlEntryModel', '_iosSlEntryHtml'].map(n => _fnBody(src, n) || '').join('\n'), ctx);
    const base = (o) => Object.assign({ cert: { mark: 'N+', name: 'Network+', code: 'N10-009' }, mode: 'practice', rounds: 5, pro: false, tierKnown: true, examNote: null }, o || {});
    const H = (o) => { ctx.__s = base(o); return vm.runInContext('_iosSlEntryHtml(_iosSlEntryModel(__s))', ctx); };

    // ── start screen ──
    const free = H();
    const pressed = (free.match(/data-act="rounds"[^>]*aria-pressed="true"/g) || []);
    test('Start: free practice at 5 presses exactly one rounds button, 5',
      pressed.length === 1 && /data-rounds="5"/.test(pressed[0]));
    test('Start: free user sees 10 locked (data-locked + lock icon)',
      /data-rounds="10"[^>]*data-locked="1"[^>]*>\s*<svg/.test(free));
    test('Start: free cap line, exact copy',
      free.indexOf('Free covers <b>one Sim Lab session a day</b>. 10 rounds, the exam length, needs Pro.') > 0);
    test('Start: Start reads "Start the sim" with "5 rounds", summary is the practice line',
      /Start the sim\s*<span class="isl-qc">5 rounds<\/span>/.test(free) && free.indexOf('Practice mode, mixed topics, a count-up timer.') > 0);
    test('Start: free user sees the Pro tag on the Exam card, the tick on Practice',
      /data-mode="exam"[^]*?isl-pro-tag[^]*?Pro<\/span>/.test(free) && /data-mode="practice" aria-pressed="true"[^]*?isl-tick/.test(free));
    const pro = H({ pro: true });
    test('Start: Pro sees no lock on 10, no Pro tag, no cap line',
      !/data-locked/.test(pro) && !/isl-pro-tag/.test(pro) && !/Free covers/.test(pro));
    const unknown = H({ tierKnown: false });
    test('Start: tier not known yet shows no lock, Pro tag or cap line',
      !/data-locked/.test(unknown) && !/isl-pro-tag/.test(unknown) && !/Free covers/.test(unknown));
    const exam = H({ pro: true, mode: 'exam', rounds: 10, examNote: 'Pro · one clock for all 10 rounds · budget 50:00 (tightened to exam pace)' });
    test('Start: Exam (Pro) presses the Exam card, Start reads "Start exam sim", summary is the exam note',
      /data-mode="exam" aria-pressed="true"[^]*?isl-tick/.test(exam) && /Start exam sim\s*<span class="isl-qc">10 rounds<\/span>/.test(exam)
      && exam.indexOf('Pro · one clock for all 10 rounds · budget 50:00 (tightened to exam pace)') > 0);
    test('Start: the big count shows the picked rounds',
      /<span class="isl-bn">3<\/span>/.test(H({ rounds: 3 })));
    const esc = H({ cert: { mark: 'N<', name: 'Net & <x>', code: 'C"1' } });
    test('Start: cert identity is escaped',
      esc.indexOf('Net &amp; &lt;x&gt;') > 0 && esc.indexOf('N&lt;') > 0 && esc.indexOf('C&quot;1') > 0 && esc.indexOf('<x>') < 0);
    test('Start: no inline on*= handlers, no em-dash, no arrow glyph',
      [free, pro, exam].every(h => !/\son[a-z]+=/.test(h) && h.indexOf('—') < 0 && h.indexOf('→') < 0));
    test('Start: back, start, both modes and three round options are data-act buttons',
      /<button[^>]*data-act="back"/.test(free) && /<button[^>]*data-act="start"/.test(free)
      && (free.match(/<button[^>]*data-act="mode"/g) || []).length === 2 && (free.match(/<button[^>]*data-act="rounds"/g) || []).length === 3);

    // ── the round: hooks in sim-lab.js ──
    const sl = fs.readFileSync(path.join(ROOT, 'features', 'sim-lab.js'), 'utf8');
    test('Round: decorate gives Tap to enlarge to exactly the five passive reference kinds',
      /var PASSIVE = \{ network: 'Network map', timeline: 'Timeline', layered: 'Layers', slots: 'Slots', swatch: 'Sample' \};/.test(src)
      && !/PASSIVE[^;]*(terminal|faceplate|wiremap)/.test(src));
    const mount = _fnBody(sl, '_slMountScenario') || '';
    test('Round: _slMountScenario asks in the sheet only for opts.lift on a phone, else confirm()',
      /if \(opts\.lift && isl && isl\.isPhone && isl\.isPhone\(\) && isl\.askReset\)/.test(mount) && /window\.confirm\('Clear your answers on this PBQ and start it again\?'\)/.test(mount)
      && /opts && opts\.lift && isl && isl\.decorate/.test(mount));
    test('Round: the Reset sheet copy is exact',
      /title: 'Start this PBQ again\?', body: 'Your answers on this question will be cleared\.', go: 'Clear answers', stay: 'Keep them'/.test(src));
    test('Round: a round ending, the verdict and Leave all dismiss an open sheet',
      /onSubmit: function \(result\) \{\s*if \(window\.iosSheet\) window\.iosSheet\.dismiss\(\);/.test(_fnBody(sl, '_slRunRound') || '')
      && /iosSheet\.dismiss\(\)/.test(_fnBody(sl, '_slRenderSummary') || '') && /iosSheet\.dismiss\(\)/.test(_fnBody(sl, 'simLabExit') || ''));
    test('Round: the phone loader reads "Building round N of M…" with the June skeleton; desktop keeps its spinner',
      /' of ' \+ total/.test(_fnBody(sl, '_slRenderLoader') || '') && /isl-skel/.test(_fnBody(sl, '_slRenderLoader') || '') && /slr-spin/.test(_fnBody(sl, '_slRenderLoader') || ''));
  } catch (err) {
    test('Lift B3b1 Sim Lab: block (threw)', false);
    results.errors.push('500 ios-simlab block threw: ' + err.message);
  }
})();
