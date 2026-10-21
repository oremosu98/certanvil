// tests/uat/495-ios-exam-results.js
// Scope: the phone exam results (features/ios-exam.js), Lift B2. E2E: feat/cert-ios-exam-results.html @ 47147981.
// Spec: docs/superpowers/specs/2026-10-21-ios-lift-b2-design.md. Plan: docs/superpowers/plans/2026-10-21-ios-lift-b2.md (Task 2 copy rules).
const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Lift B2 exam results (phone) ──\x1b[0m');
  try {
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Number, isFinite });
    vm.runInContext(['_iosExamResultsModel', '_iosExamResultsHtml'].map(n => _fnBody(js, n) || '').join('\n'), ctx);
    const DOM = (label, correct, total) => ({ key: label.toLowerCase(), label, correct, total, pct: total ? Math.round(correct / total * 100) : null });
    const base = (o) => Object.assign({
      scaled: 620, minScore: 100, maxScore: 900, passScore: 720, certLabel: 'CompTIA N10-009', total: 90, correct: 58, wrong: 32, skipped: 0, pct: 64,
      pauses: 0, pausedMs: 0,
      domains: [DOM('Networking Concepts', 22, 30), DOM('Network Operations', 6, 9), DOM('Network Implementation', 13, 20), DOM('Network Security', 6, 11), DOM('Network Troubleshooting', 11, 20)],
      pbqs: [], wrongTopics: [{ topic: 'PKI & Certificates', domain: 'Network Security', wrong: 3 }, { topic: 'Cable Issues', domain: 'Network Troubleshooting', wrong: 4 },
        { topic: 'Firewalls & DMZ', domain: 'Network Security', wrong: 2 }, { topic: 'Service Issues', domain: 'Network Troubleshooting', wrong: 1 },
        { topic: 'AAA & Authentication', domain: 'Network Security', wrong: 1 }, { topic: 'OSPF', domain: 'Network Implementation', wrong: 5 }]
    }, o || {});
    const M = (o) => vm.runInContext('_iosExamResultsModel(__d)', Object.assign(ctx, { __d: base(o) }));
    const H = (o) => vm.runInContext('_iosExamResultsHtml(_iosExamResultsModel(__d))', Object.assign(ctx, { __d: base(o) }));

    const near = M();
    test('Exam results: a near miss reads "So close."', !near.passed && near.gap === 100 && near.headline.lead === 'So' && near.headline.em === 'close.');
    test('Exam results: two weak domains → "The gap is two domains, not the whole exam."', near.sub === '100 points off a pass. The gap is two domains, not the whole exam.');
    test('Exam results: the message names the two lowest domains',
      near.msg === '<b>100 points</b> from the line, and most of it is Network Security and Network Troubleshooting.');
    test('Exam results: score label and tags', near.label === 'Scaled score · CompTIA N10-009' && near.tags.map(t => t.text).join() === 'Fail');
    test('Exam results: meter fill and pass tick on the cert scale', near.meter.fill === 65 && near.meter.tick === 77.5 && near.meter.pass === 720);
    test('Exam results: tiles are Correct, Wrong, Skipped, Raw', near.tiles.map(t => t.l + ':' + t.n).join() === 'Correct:58,Wrong:32,Skipped:0,Raw:64%');
    test('Exam results: domains high to low with tones (>=70 pass, >=60 mid, else miss)',
      near.domains.map(d => d.label + ':' + d.tone).join() === 'Networking Concepts:pass,Network Operations:mid,Network Implementation:mid,Network Security:miss,Network Troubleshooting:miss');
    test('Exam results: gap topics come from the two lowest domains, most wrong first, at most 4',
      near.gapTopics.join() === 'Cable Issues,PKI & Certificates,Firewalls & DMZ,Service Issues');
    test('Exam results: the estimate note is kept', near.note === "An estimate: the real exam's scaling isn't published.");

    const far = M({ scaled: 400, correct: 30, wrong: 60, pct: 33 });
    test('Exam results: a far miss reads "More work needed." and names where to start',
      far.headline.lead === 'More' && far.headline.em === 'work needed.' && far.sub === '320 points off a pass. The gap is two domains, not the whole exam.');
    const far3 = M({ scaled: 400, domains: [DOM('A', 1, 10), DOM('B', 2, 10), DOM('C', 3, 10)] });
    test('Exam results: with more than two weak domains the sub names the lowest', far3.sub === '320 points off a pass. Start with A.');
    const pass = M({ scaled: 760 });
    test('Exam results: a pass reads "Pass mark cleared." and "40 points over the line."',
      pass.passed && pass.headline.lead === 'Pass mark' && pass.headline.em === 'cleared.' && pass.sub === '40 points over the line.' && pass.msg === '<b>40 points</b> above the line.' && pass.tags[0].kind === 'pass');
    const sec = M({ passScore: 750, certLabel: 'CompTIA SY0-701' });
    test('Exam results: another cert uses its own pass mark and name', sec.meter.tick === 81.3 && sec.label === 'Scaled score · CompTIA SY0-701');
    test('Exam results: a paused exam gets "Paused 4 min"', M({ pauses: 2, pausedMs: 240000 }).tags.map(t => t.text).join() === 'Fail,Paused 4 min');
    const pb = M({ pbqs: [{ title: 'Trunk the uplink', topic: 'Switch & VLANs', correct: 4, total: 4, fraction: 1, skipped: false },
      { title: 'Fix the ACL', topic: 'Firewalls & DMZ', correct: 2, total: 4, fraction: 0.5, skipped: false },
      { title: 'Patch panel', topic: 'Cabling', correct: 0, total: 3, fraction: 0, skipped: false },
      { title: 'Routing table', topic: 'Routing', correct: 0, total: 2, fraction: 0, skipped: true }] });
    test('Exam results: Sim Lab rows read Right / Partly / Wrong / Skipped',
      pb.pbq.rows.map(r => r.verdict).join() === 'Right,Partly,Wrong,Skipped' && pb.pbq.right === 1 && pb.pbq.count === 4 && pb.pbq.rows[1].detail.indexOf('2 of 4 steps right.') === 0);
    // final review I2: a row opens to the answer, not just the step count
    const pe = M({ pbqs: [{ title: 'Fix the ACL', topic: 'Firewalls & DMZ', correct: 2, total: 4, fraction: 0.5, skipped: false, explain: 'Rule 3 must sit above rule 1.' },
      { title: 'Trunk', topic: 'Switch & VLANs', correct: 1, total: 1, fraction: 1, skipped: false, explain: '' },
      { title: 'Patch', topic: 'Cabling', correct: 0, total: 2, fraction: 0, skipped: true, explain: 'Pin 1 is white-orange.' }] }).pbq.rows;
    test('Exam results: a Sim Lab row explains the first step you missed', pe[0].detail === '2 of 4 steps right. Rule 3 must sit above rule 1.');
    test('Exam results: one step reads "1 of 1 step right."', pe[1].detail === '1 of 1 step right.');
    test('Exam results: a skipped Sim Lab row says so and shows the answer', pe[2].detail === "You didn't answer this one. Pin 1 is white-orange.");
    test('Exam results: the Sim Lab kicker counts the right ones', H({ pbqs: [{ title: 'T', topic: 'X', correct: 1, total: 1, fraction: 1, skipped: false }] }).includes('Performance-based · 1 of 1 right'));
    test('Exam results: no Sim Lab questions means no Sim Lab block', near.pbq === null && !H().includes('ie-srow'));
    test('Exam results: nothing wrong means no Drill the gap button', !H({ wrongTopics: [] }).includes('data-act="drill-gap"') && H().includes('data-act="drill-gap"'));
    test('Exam results: the buttons are Menu, Review all, Drill the gap and a Retry link',
      /data-act="menu"[^>]*>Menu<[\s\S]*data-act="review"[^>]*>Review all<[\s\S]*data-act="drill-gap"[^>]*>Drill the gap<[\s\S]*data-act="retry"[^>]*>Retry the exam</.test(H()));
    const nasty = H({ domains: [DOM('A & <B>', 1, 4)], pbqs: [{ title: 'X <y>', topic: 'T', correct: 0, total: 1, fraction: 0, skipped: false }] });
    test('Exam results: names are escaped', nasty.includes('A &amp; &lt;B&gt;') && nasty.includes('X &lt;y&gt;') && !nasty.includes('<B>') && !nasty.includes('<y>'));
  } catch (err) {
    test('Lift B2 exam results: block (threw)', false);
    results.errors.push('495 ios-exam-results block threw: ' + err.message);
  }
})();
