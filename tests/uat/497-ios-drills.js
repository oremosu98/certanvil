// tests/uat/497-ios-drills.js
// Scope: the phone Drills tab model + view (features/ios-drills.js), Lift B3a. E2E: cert-ios-drills.html @ ab952bb4.
// Spec: docs/superpowers/specs/2026-10-22-ios-lift-b3a-design.md. Plan: docs/superpowers/plans/2026-10-22-ios-lift-b3a.md (Task 2).
const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Lift B3a Drills tab (phone) ──\x1b[0m');
  try {
    const fs = require('fs'), path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'features', 'ios-drills.js'), 'utf8');
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Number, isFinite });
    vm.runInContext(['_iosDrillsModel', '_iosDrillsHtml'].map(n => _fnBody(src, n) || '').join('\n'), ctx);
    const D = (label, weight, mastery, touched) => ({ key: label.slice(0, 3).toLowerCase(), label, weight, mastery, touched: touched !== false });
    const base = (o) => Object.assign({
      code: 'N10-009', pro: true, tierKnown: true, gauntletFree: false, wrongCount: 9,
      weak: [{ topic: 'OSPF vs RIP behaviour', pct: 41 }, { topic: 'Port security', pct: 48 }, { topic: 'QoS marking', pct: 55 }],
      domains: [D('Networking Concepts', 23, 100), D('Network Implementation', 20, 0, false), D('Network Operations', 19, 100), D('Network Security', 14, 75), D('Network Troubleshooting', 24, 50)],
      simLab: true, decisionLab: false, gauntletUsed: 0, gauntletCap: 1, pbqUsed: 0, pbqCap: 1
    }, o || {});
    const M = (o) => vm.runInContext('_iosDrillsModel(__s)', Object.assign(ctx, { __s: base(o) }));
    const H = (o) => vm.runInContext('_iosDrillsHtml(_iosDrillsModel(__s))', Object.assign(ctx, { __s: base(o) }));

    const pro = M();
    test('Drills: Mistakes pill, note and button (Pro)', pro.mistakes.pill === '9 saved' && pro.mistakes.lock === false
      && pro.mistakes.note === 'Clear the <b>9 wrong answers</b> in your bank. They come back re-worded, so you have to know the idea behind each one. Get one right twice in a row and it leaves the bank for good.'
      && pro.mistakes.button.label === 'Drill the 9 you missed' && pro.mistakes.button.disabled === false);
    test('Drills: one wrong answer reads singular', M({ wrongCount: 1 }).mistakes.note.indexOf('<b>1 wrong answer</b> in your bank') > 0);
    const em = M({ wrongCount: 0 });
    test('Drills: empty Mistakes reads "Nothing to drill yet", disabled', em.mistakes.pill === '0 saved' && em.mistakes.note === 'Questions you miss land here.'
      && em.mistakes.button.label === 'Nothing to drill yet' && em.mistakes.button.disabled === true);
    test('Drills: Weakest topics chips, note and button', pro.weak.chips.length === 3 && pro.weak.chips[0].topic === 'OSPF vs RIP behaviour' && pro.weak.chips[0].pct === 41
      && pro.weak.note === 'Your three lowest-mastery topics right now. The drill leads with the weakest of them.' && pro.weak.button === 'Drill weakest topics');
    const nw = M({ weak: [] }).weak;
    test('Drills: no weak topics yet', nw.chips.length === 0 && nw.note === 'Take a quiz and your weakest topics show up here.' && nw.button === null);
    test('Drills: domains carry weight, full and untouched', pro.domains[0].weight === '23% of exam' && pro.domains[0].full === true && pro.domains[1].untouched === true && pro.domains[3].full === false && pro.domains[3].mastery === 75);
    test('Drills: Pro rows are Sim Lab, Reword Gauntlet, Why-Not with no pills',
      pro.rows.map(r => r.id).join() === 'sim,gnt,why' && pro.rows.every(r => r.pill === null)
      && pro.rows.map(r => r.name + '|' + r.line).join(';') === 'Sim Lab|Hands-on PBQs, like the real exam;Reword Gauntlet|One idea, asked five ways;Why-Not|Say why each wrong answer loses');
    const free = M({ pro: false, gauntletFree: true });
    test('Drills: free user gets the Pro lock on Mistakes and free/Pro pills', free.mistakes.lock === true
      && JSON.stringify(free.rows.map(r => r.pill)) === JSON.stringify([{ kind: 'free', text: '1 free today' }, { kind: 'free', text: '1 free today' }, { kind: 'pro', text: 'Pro' }]));
    const spent = M({ pro: false, gauntletFree: true, gauntletUsed: 1, pbqUsed: 1 });
    test('Drills: used runs read "Done today"', spent.rows[0].pill.kind === 'done' && spent.rows[0].pill.text === 'Done today' && spent.rows[1].pill.text === 'Done today');
    const unk = M({ pro: false, tierKnown: false, gauntletFree: false });
    test('Drills: tier not known yet means no pills and no locks', unk.rows.every(r => r.pill === null) && unk.mistakes.lock === false);
    const anon = M({ pro: false, gauntletFree: false });
    test('Drills: anonymous users get no Gauntlet pill (uncapped), Sim Lab and Why-Not pills stay',
      anon.rows[0].pill.text === '1 free today' && anon.rows[1].pill === null && anon.rows[2].pill.text === 'Pro');
    const az = M({ code: 'AZ-900', simLab: false, decisionLab: true });
    test('Drills: AZ-900 shows Decision Lab, not Sim Lab', az.rows.map(r => r.id).join() === 'gnt,why,dl'
      && az.rows[2].name === 'Decision Lab' && az.rows[2].line === 'Read the constraint, rule out the lookalikes' && az.code === 'AZ-900');
    test('Drills: foot note', pro.foot === 'Drills don’t touch your daily review queue.');
    const nasty = H({ weak: [{ topic: 'DNS & <b>', pct: 30 }], domains: [D('A & B', 50, 10)] });
    test('Drills: names are escaped', nasty.indexOf('DNS &amp; &lt;b&gt;') > -1 && nasty.indexOf('A &amp; B') > -1 && nasty.indexOf('<b>DNS') === -1);
    const h = H({ pro: false, gauntletFree: true });
    test('Drills: rows and buttons route by data-act, no inline handlers',
      /data-act="row" data-id="sim"/.test(h) && /data-act="row" data-id="why"/.test(h) && /data-act="mistakes"/.test(h) && /data-act="weak"/.test(h)
      && /data-act="domain" data-key="net"/.test(h) && /data-act="theme"/.test(h) && !/\son[a-z]+=/.test(h));
    test('Drills: the view keeps June order', (function () { const a = h.indexOf('Drill Mistakes'), b = h.indexOf('Weakest topics'), c = h.indexOf('Drill by domain'), d = h.indexOf('More ways to practise'); return a > 0 && a < b && b < c && c < d; })());
  } catch (err) {
    test('Lift B3a Drills: block (threw)', false);
    results.errors.push('497 ios-drills block threw: ' + err.message);
  }
})();
