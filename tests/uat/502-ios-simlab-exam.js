// Lift B3b2 (23 Oct): Sim Lab Exam mode on phones (features/ios-simlab.js). The exam bar, the dock,
// the End dialog and the exam verdict with its Pace card, as pure model/view pairs run in a vm.
const { _fnBody, fs, path, ROOT, results, test, vm } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift B3b2 Sim Lab Exam (phone) ──\x1b[0m');
  try {
    const src = fs.readFileSync(path.join(ROOT, 'features', 'ios-simlab.js'), 'utf8');
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Number, isFinite });
    const names = ['_iosSlExamBarModel', '_iosSlExamBarHtml', '_iosSlExamDockHtml', '_iosSlEndModel', '_iosSlEndHtml', '_iosSlVerdictModel', '_iosSlVerdictHtml'];
    vm.runInContext(names.map(n => _fnBody(src, n) || '').join('\n'), ctx);
    const run = (expr, s) => { ctx.__s = s; return vm.runInContext(expr, ctx); };
    const B = (a) => a.map(Boolean);
    const drawn = { idx: 1, rounds: 5, answered: B([1, 1, 0, 1, 0]), flagged: B([0, 0, 0, 1, 0]) };

    // ── exam bar ──
    const bar = run('_iosSlExamBarModel(__s)', drawn);
    test('Bar: "Round 2 of 5", "3 answered", ticks done/cur/none/flag/none',
      bar.cn === 'Round 2 of 5' && bar.cs === '3 answered' && JSON.stringify(bar.ticks) === JSON.stringify(['done', 'cur', '', 'flag', '']));
    const barH = run('_iosSlExamBarHtml(_iosSlExamBarModel(__s))', drawn);
    test('Bar html: middle text and one tick per round',
      /<span class="isl-xcn">Round 2 of 5<\/span><span class="isl-xcs">3 answered<\/span>/.test(barH.mid)
      && (barH.strip.match(/<i /g) || []).length === 5 && /<i class="flag"><\/i>/.test(barH.strip));

    // ── dock ──
    const last = run('_iosSlExamDockHtml(__s)', { first: false, last: true, flagged: true });
    test('Dock: last round reads Review (no arrow), Flagged is pressed',
      />Review</.test(last) && !/M5 12h14/.test(last) && /isl-xflag is-on[^>]*aria-pressed="true"/.test(last) && />Flagged</.test(last));
    const first = run('_iosSlExamDockHtml(__s)', { first: true, last: false, flagged: false });
    test('Dock: round 1 disables Previous; Next carries the arrow; labels exact',
      /data-act="prev" aria-label="Previous round" disabled/.test(first) && /Next<svg[^>]*>[^]*M5 12h14/.test(first) && />Flag</.test(first));

    // ── End dialog ──
    const end = run('_iosSlEndModel(__s)', drawn);
    test('End: counts 3 answered / 2 skipped / 1 flagged',
      end.answered === 3 && end.skipped === 2 && end.flagged === 1);
    test('End: review targets the first skipped round', end.review && end.review.label === 'Review the 2 you skipped first' && end.review.target === 2);
    test('End: grid marks answered+current and flagged like B2', end.grid[1].cls === 'a c' && end.grid[3].cls === 'f' && end.grid[2].cls === ''
      && end.grid[1].label === 'Round 2, current' && end.grid[2].label === 'Round 3, skipped');
    const flagOnly = run('_iosSlEndModel(__s)', { idx: 0, rounds: 5, answered: B([1, 1, 1, 1, 1]), flagged: B([0, 0, 0, 1, 0]) });
    test('End: none skipped, one flagged, reviews the flagged one', flagOnly.review.label === 'Review the 1 you flagged first' && flagOnly.review.target === 3);
    const clean = run('_iosSlEndHtml(_iosSlEndModel(__s))', { idx: 0, rounds: 2, answered: B([1, 1]), flagged: B([0, 0]) });
    test('End html: nothing skipped or flagged, no review button', !/ix-review/.test(clean));
    const endH = run('_iosSlEndHtml(_iosSlEndModel(__s))', drawn);
    test('End html: the drawn copy and B2 structure',
      endH.indexOf('Sim Lab exam · end of session') > 0 && /id="isl-end-title"[^>]*>Submit <em>exam\?<\/em>/.test(endH)
      && /class="modal-box"/.test(endH) && /class="modal-stats"/.test(endH)
      && /data-act="review"[^>]*>Review the 2 you skipped first</.test(endH)
      && /class="btn btn-primary" data-act="submit">Submit and see results</.test(endH)
      && /class="btn btn-danger" data-act="abandon">Abandon exam</.test(endH)
      && /aria-controls="isl-jgrid">Jump to a round</.test(endH) && (endH.match(/data-i="/g) || []).length === 5
      && /isl-ms-skip">2</.test(endH) && /isl-ms-flag">1</.test(endH));

    // ── exam verdict + Pace ──
    const round = (t, tp, c, n) => ({ title: t, topic: tp, correct: c, total: n, fraction: n ? c / n : 0, panelHtml: '<p class="sls-r-why">why</p>' });
    const rounds5 = [round('Well-known ports', 'Well-known ports', 8, 8), round('CLI fault isolation', 'CLI fault isolation', 3, 5),
      round('VLAN access port', 'VLAN access port', 0, 3), round('Troubleshooting', 'Troubleshooting', 7, 7), round('Branch subnet', 'Branch subnet', 5, 5)];
    const per = [[192000, 270000], [400000, 324000], [245000, 270000], [178000, 216000], [335000, 270000]].map(p => ({ roundMs: p[0], parMs: p[1] }));
    const exam = (o) => Object.assign({ mode: 'exam', rounds: rounds5, pct: 82, passed: 3, stepsCorrect: 23, stepsTotal: 28, slip: null, pro: false }, o);
    const up = run('_iosSlVerdictModel(__s)', exam({ timeUp: true, pace: { totalMs: 1350000, budgetMs: 1350000, deltaMs: 0, timeUp: true, perRound: per } }));
    test('Verdict exam (time-up): kicker, Out of time, ran-long line naming round 2',
      up.kick === "Time's up · 5 rounds" && up.pace.pill === 'Out of time' && up.pace.over === true && /^Round 2 ran long\./.test(up.pace.sub));
    test('Verdict exam: Target 22:30, round 5 over par, no upsell even for free',
      up.pace.target === 'Target 22:30' && up.pace.rows[4].over === true && up.pace.rows[0].label === 'Round 1 · Well-known ports'
      && up.pace.rows[0].time === '3:12' && up.pace.rows[0].par === 'par 4:30' && up.upsell === false);
    const ok = run('_iosSlVerdictModel(__s)', exam({ timeUp: false, pace: { totalMs: 1122000, budgetMs: 1350000, deltaMs: 228000, timeUp: false, perRound: per } }));
    test('Verdict exam (on time): On exam pace, 3:48 to spare, 83%, your time 18:42',
      ok.kick === 'Sim Lab exam · 5 rounds' && ok.pace.pill === 'On exam pace' && ok.pace.over === false
      && /^3:48 to spare\. On the real exam/.test(ok.pace.sub) && ok.pace.pct === 83 && ok.pace.yours === 'your time 18:42' && ok.pace.total === '18:42');
    ctx.__s = exam({ timeUp: true, pace: { totalMs: 1350000, budgetMs: 1350000, deltaMs: 0, timeUp: true, perRound: per } });
    const vh = vm.runInContext('_iosSlVerdictHtml(_iosSlVerdictModel(__s))', ctx);
    test('Verdict exam html: Pace card before Your rounds, no upsell, why panels pass through',
      /Time&#39;s up · 5 rounds|Time's up · 5 rounds/.test(vh) && vh.indexOf('class="isl-pace"') > 0 && vh.indexOf('class="isl-pace"') < vh.indexOf('Your rounds')
      && /<span class="isl-pv over">Out of time<\/span>/.test(vh) && !/isl-upsell/.test(vh) && (vh.match(/sls-r-why/g) || []).length === 5
      && /<span class="isl-ptick"><b>Target 22:30<\/b><\/span>/.test(vh));
    ctx.__s = exam({ rounds: [round('A & <b>', 'A & <b>', 1, 2)], timeUp: false, pace: { totalMs: 60000, budgetMs: 120000, deltaMs: 60000, timeUp: false, perRound: [{ roundMs: 60000, parMs: 120000 }] } });
    const esc = vm.runInContext('_iosSlVerdictHtml(_iosSlVerdictModel(__s))', ctx);
    test('Verdict exam html: topics escaped in the pace rows and the round rows', !/A & <b>/.test(esc) && (esc.match(/A &amp; &lt;b&gt;/g) || []).length >= 3);
    ctx.__s = { rounds: rounds5.slice(0, 3), pct: 69, passed: 1, stepsCorrect: 11, stepsTotal: 16, slip: null, pro: false };
    const prac = vm.runInContext('_iosSlVerdictHtml(_iosSlVerdictModel(__s))', ctx);
    test('Verdict practice unchanged: Sim Lab kicker, no Pace card, free upsell', /Sim Lab · 3 rounds/.test(prac) && !/isl-pace/.test(prac) && /isl-upsell/.test(prac));
  } catch (err) {
    test('Lift B3b2 Sim Lab Exam: block (threw)', false);
    results.errors.push('502 ios-simlab-exam block threw: ' + err.message);
  }
})();
