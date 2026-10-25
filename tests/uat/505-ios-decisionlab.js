// Lift B3c3 (26 Oct): Decision Lab on phones (features/ios-decisionlab.js). The entry and the results as pure
// model/view pairs run in a vm sandbox, plus the markup and wiring checks of the phone hosts.
const { _fnBody, fs, html, path, ROOT, results, test, vm } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift B3c3 Decision Lab (phone) ──\x1b[0m');
  try {
    const p = path.join(ROOT, 'features', 'ios-decisionlab.js');
    const src = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Number });
    vm.runInContext(['_iosDlEntryModel', '_iosDlEntryHtml', '_iosDlResultModel', '_iosDlResultHtml'].map(n => _fnBody(src, n) || '').join('\n'), ctx);
    const run = (expr, s) => { ctx.__s = s; return vm.runInContext(expr, ctx); };

    // ── entry ──
    const E = (o) => run('_iosDlEntryHtml(_iosDlEntryModel(__s))', Object.assign({ mode: 'practice', decisions: 10, target: 'Azure & AZ-900', back: 'drills', free: false }, o));
    const pro = E();
    test('Entry: headline, lede, escaped target, Practice and 10 pressed, Start counts, no free bits for Pro',
      pro.indexOf('Make the <em>right call</em>') >= 0 && pro.indexOf('Three of four options look right. The buried constraint picks the winner.') >= 0
      && pro.indexOf('Azure &amp; AZ-900') >= 0 && (pro.match(/class="idl-mode"/g) || []).length === 2
      && /data-mode="practice"[^>]*aria-pressed="true"/.test(pro) && /data-n="10"[^>]*aria-pressed="true"/.test(pro)
      && pro.indexOf('idl-pro') < 0 && pro.indexOf('idl-cap') < 0 && pro.indexOf('locked') < 0 && /<span class="idl-qc">10 decisions<\/span>/.test(pro));
    const free = E({ free: true });
    test('Entry: free gets the Pro pill, the Exam-style Pro tag, 20 locked and the cap line',
      free.indexOf('idl-pro') >= 0 && free.indexOf('idl-protag') >= 0 && /class="locked"[^>]*data-n="20"|data-n="20"[^>]*class="locked"|locked" type="button" data-act="count" data-n="20"/.test(free)
      && free.indexOf('Free covers <b>one set a day</b>, with the full reasoning on every miss.') >= 0);
    test('Entry model: back label names the destination; Exam-style 5 pressed when picked',
      run('_iosDlEntryModel(__s)', { mode: 'practice', decisions: 10, target: 'x', back: 'drills' }).backLabel === 'Back to Drills'
      && run('_iosDlEntryModel(__s)', { mode: 'practice', decisions: 10, target: 'x', back: 'setup' }).backLabel === 'Back to Home'
      && /data-mode="exam"[^>]*aria-pressed="true"/.test(E({ mode: 'exam', decisions: 5 })) && /data-n="5"[^>]*aria-pressed="true"/.test(E({ mode: 'exam', decisions: 5 })));

    // ── results ──
    const D = (o) => Object.assign({ title: 'Lift and shift SQL Server', family: 'Databases', right: true, kind: 'pick', pick: 'SQL MI', rightCall: 'SQL MI', tell: 'Agent jobs need the instance.' }, o);
    const R = (o) => Object.assign({ mode: 'practice', code: 'AZ-900', timeUp: false, passed: 7, rounds: 10, back: 'drills',
      pairs: [{ label: 'SQL Database vs SQL Managed Instance', count: 2 }], families: ['Databases', 'Storage'],
      decisions: [D(), D({ right: false, pick: 'SQL Database' }), D({ right: false, pick: null }), D({ kind: 'other', pick: null, rightCall: '' })] }, o);
    const rm = run('_iosDlResultModel(__s)', R()), rh = run('_iosDlResultHtml(_iosDlResultModel(__s))', R());
    const det = (h, i) => { const a = h.indexOf('id="idl-sdet-' + i + '"'); const b = h.indexOf('id="idl-sdet-' + (i + 1) + '"'); return h.slice(a, b > 0 ? b : undefined); };
    test('Results: title, kicker, a look-alike pair with its count, family chips, rows, Run another set; no arrow glyph',
      rm.title === '<em>7 of 10</em> right calls' && rm.kick === 'Decision Lab · Practice · AZ-900'
      && rh.indexOf('<b>SQL Database</b> vs <b>SQL Managed Instance</b>') >= 0 && rh.indexOf('Missed ×2') >= 0
      && (rh.match(/class="idl-srow"/g) || []).length === 4 && /data-act="again"[^>]*>Run another set/.test(rh) && /data-act="exit"[^>]*>Back to Drills/.test(rh)
      && rh.indexOf('→') < 0 && rh.indexOf('Look-alikes you still confuse') >= 0 && rh.indexOf('Weak service families') >= 0);
    test('Results kicker: Exam-style, and Time\'s up when the clock ran out',
      run('_iosDlResultModel(__s)', R({ mode: 'exam' })).kick === 'Decision Lab · Exam-style · AZ-900'
      && run('_iosDlResultModel(__s)', R({ mode: 'exam', timeUp: true })).kick === 'Decision Lab · Exam-style · Time’s up');
    test('Results rows: a wrong pick shows Your pick, Right call and The tell; no answer reads No answer; another step type shows only The tell',
      /Your pick/.test(det(rh, 1)) && /SQL Database/.test(det(rh, 1)) && /Right call/.test(det(rh, 1)) && /The tell/.test(det(rh, 1))
      && /No answer/.test(det(rh, 2)) && !/Your pick|Right call/.test(det(rh, 3)) && /The tell/.test(det(rh, 3)) && /idl-sdet-1"[^>]*hidden/.test(rh));
    test('Results: no look-alike or family section when there are none',
      run('_iosDlResultHtml(_iosDlResultModel(__s))', R({ pairs: [], families: [] })).indexOf('Look-alikes') < 0
      && run('_iosDlResultHtml(_iosDlResultModel(__s))', R({ pairs: [], families: [] })).indexOf('Weak service families') < 0);
    const bad = run('_iosDlResultHtml(_iosDlResultModel(__s))', R({ pairs: [{ label: '<i> vs &', count: 1 }], families: ['<u>'], decisions: [D({ title: 'A&B <x>', tell: '<s>', right: false, pick: '<b>' })] }));
    test('Escaping: titles, picks, tells, pairs and families are escaped',
      bad.indexOf('A&amp;B &lt;x&gt;') >= 0 && bad.indexOf('&lt;s&gt;') >= 0 && bad.indexOf('&lt;i&gt;') >= 0 && bad.indexOf('&lt;u&gt;') >= 0
      && bad.indexOf('<i>') < 0 && bad.indexOf('<s>') < 0 && bad.indexOf('<u>') < 0);
  } catch (err) {
    test('Lift B3c3 Decision Lab: block (threw)', false);
    results.errors.push('505 ios-decisionlab block threw: ' + err.message);
  }
})();
