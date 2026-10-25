// Lift B3c2 (25 Oct): Why-Not on phones (features/ios-whynot.js). The entry, the reason step and both verdicts
// as pure model/view pairs run in a vm sandbox, plus the markup and wiring checks of the phone hosts.
const { _fnBody, fs, html, path, ROOT, results, test, vm } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift B3c2 Why-Not (phone) ──\x1b[0m');
  try {
    const p = path.join(ROOT, 'features', 'ios-whynot.js');
    const src = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Number });
    vm.runInContext(['_iosWnEntryModel', '_iosWnEntryHtml', '_iosWnReasonModel', '_iosWnReasonHtml', '_iosWnVerdictModel', '_iosWnVerdictHtml', '_iosWnSessionModel', '_iosWnSessionHtml']
      .map(n => _fnBody(src, n) || '').join('\n'), ctx);
    const run = (expr, s) => { ctx.__s = s; return vm.runInContext(expr, ctx); };

    // ── entry ──
    const E = (o) => run('_iosWnEntryHtml(_iosWnEntryModel(__s))', Object.assign({ topic: 'Ports & Protocols', why: 'Your weakest topic right now', back: 'drills', free: false }, o));
    const pro = E();
    test('Entry: headline, escaped topic, three rounds, Start, no Pro pill for Pro',
      pro.indexOf('Prove the wrong answers <em>wrong</em>') >= 0 && pro.indexOf('Ports &amp; Protocols') >= 0
      && (pro.match(/class="iwn-rd"/g) || []).length === 3 && /data-act="start"[^>]*>[^]*Start Why-Not/.test(pro) && pro.indexOf('iwn-pro') < 0);
    test('Entry: free shows the Pro pill; back label names the destination',
      E({ free: true }).indexOf('iwn-pro') >= 0 && run('_iosWnEntryModel(__s)', { topic: 'A', why: 'x', back: 'drills' }).backLabel === 'Back to Drills'
      && run('_iosWnEntryModel(__s)', { topic: 'A', why: 'x', back: 'setup' }).backLabel === 'Back to Home');

    // ── reason step ──
    const RS = [{ t: '445 only carries encrypted web traffic.', real: false }, { t: '445 is SMB, for file and printer sharing.', real: true }, { t: '445 is what RDP falls back to.', real: false }];
    const S = (o) => Object.assign({ topic: 'Ports & Protocols', round: 1, answerRight: true, answerText: '3389', letter: 'C', optionText: '445', wrong: ['B', 'C', 'D'],
      reasons: RS, picked: null, note: 'SMB shares run on 445.', segs: ['done', 'done', 'live', ''], nextLetter: 'D' }, o);
    const R = (o) => run('_iosWnReasonHtml(_iosWnReasonModel(__s))', S(o));
    const r0 = R();
    test('Reasons unpicked: three live reason buttons, Next waits, no note',
      (r0.match(/data-act="reason"/g) || []).length === 3 && !/iwn-reason[^"]*"[^>]*disabled/.test(r0) && /iwn-next wait/.test(r0) && r0.indexOf('iwn-note') < 0
      && r0.indexOf('You answered <b>3389</b>. Right. Now earn the other three points.') >= 0 && /data-act="leave"[^>]*>Leave session/.test(r0));
    const r1 = R({ picked: 1 });
    test('Reasons: the true pick turns right, the others dim, all lock; Right reason; Next names the next letter',
      /iwn-reason right"[^>]*disabled/.test(r1) && (r1.match(/iwn-reason dim"/g) || []).length === 2 && (r1.match(/disabled/g) || []).length === 3
      && r1.indexOf('Right reason') >= 0 && />Next: why does D lose\?</.test(r1) && !/iwn-next wait/.test(r1));
    const r2 = R({ picked: 0, nextLetter: null });
    test('Reasons: a fake pick is wrong, the true one right; Wrong reason; last option says See the round verdict',
      /iwn-reason wrong"/.test(r2) && /iwn-reason right"/.test(r2) && r2.indexOf('Wrong reason') >= 0 && />See the round verdict</.test(r2));
    test('Reasons: missed answer line and the bar labels are the wrong letters',
      R({ answerRight: false }).indexOf('The answer was <b>3389</b>. The reasons below still score.') >= 0 && /<span>Answer<\/span><span>B<\/span><span>C<\/span><span>D<\/span>/.test(r0));

    // ── round verdict ──
    const W = [{ letter: 'B', text: '22', right: true, picked: '22 is SSH.', reason: '22 is SSH.', note: 'n1' }, { letter: 'C', text: '445', right: true, picked: 'x', reason: 'SMB', note: 'n2' },
      { letter: 'D', text: '5900', right: false, picked: 'Windows blocks 5900.', reason: '5900 is VNC.', note: 'n3' }];
    const V = (o) => Object.assign({ topic: 'Ports & Protocols', round: 1, last: false, points: 3, callout: 'You knew the answer. You misdiagnosed why <b>5900</b> loses.',
      answer: { text: '3389', right: true, firstPick: '3389', explanation: 'RDP is 3389.' }, wrong: W }, o);
    const vm1 = run('_iosWnVerdictModel(__s)', V()), vh = run('_iosWnVerdictHtml(_iosWnVerdictModel(__s))', V());
    const det = (h, i) => h.slice(h.indexOf('id="iwn-sdet-' + i + '"'), i < 3 ? h.indexOf('id="iwn-sdet-' + (i + 1) + '"') : undefined);
    test('Verdict: You earned 3 of 4, four rows, Next round; no arrow glyph',
      vm1.title === 'You earned <em>3 of 4</em>' && (vh.match(/class="iwn-srow"/g) || []).length === 4 && vm1.primary.label === 'Next round' && vm1.primary.act === 'next-round' && vh.indexOf('→') < 0
      && vh.indexOf('Your four points') >= 0 && /<h2 class="iwn-vtitle">/.test(vh));
    test('Verdict rows: a wrong option shows Your reason and True reason; a right one only True reason; the answer row Your first pick',
      /Your reason/.test(det(vh, 3)) && /True reason/.test(det(vh, 3)) && !/Your reason/.test(det(vh, 1)) && /True reason/.test(det(vh, 1)) && /Your first pick/.test(det(vh, 0))
      && /Picked first time/.test(vh) && /iwn-sdet-2"[^>]*hidden/.test(vh) && /aria-expanded="false"/.test(vh));
    test('Verdict: missed answer sub; last round goes to the session verdict',
      run('_iosWnVerdictHtml(_iosWnVerdictModel(__s))', V({ answer: { text: '3389', right: false, firstPick: '22', explanation: 'x' } })).indexOf('Missed on the first pick') >= 0
      && JSON.stringify(run('_iosWnVerdictModel(__s)', V({ last: true })).primary) === JSON.stringify({ label: 'Session verdict', act: 'session' }));

    // ── session verdict ──
    const sh = run('_iosWnSessionHtml(_iosWnSessionModel(__s))', { topic: 'Ports & Protocols', points: 10, rounds: [{ points: 3 }, { points: 4 }, { points: 3 }], back: 'drills' });
    const meter = sh.slice(sh.indexOf('iwn-meter'), sh.indexOf('</div>', sh.indexOf('iwn-meter')));
    test('Session: 10 of 12, twelve meter points with ten on, ok pill only at 4 of 4, Back to Drills',
      sh.indexOf('Session: <em>10 of 12</em>') >= 0 && (meter.match(/<i/g) || []).length === 12 && (meter.match(/class="on"/g) || []).length === 10
      && (sh.match(/iwn-sv ok/g) || []).length === 1 && (sh.match(/iwn-sv nt/g) || []).length === 2 && /data-act="exit"[^>]*>Back to Drills/.test(sh)
      && /data-act="next-topic"[^>]*>Next target/.test(sh) && sh.indexOf('3 questions answered toward today’s goal.') >= 0);

    test('Session (side-by-side drift): the kicker carries the Why-Not mark',
      /<div class="iwn-vkick"><svg/.test(sh));
    // ── escaping ──
    const bad = R({ optionText: 'A&B <x>', reasons: [{ t: '<b>', real: true }, { t: 'y', real: false }, { t: 'z', real: false }], picked: 0, note: '& <i>' });
    const vbad = run('_iosWnVerdictHtml(_iosWnVerdictModel(__s))', V({ topic: 'T<x>', wrong: [{ letter: 'B', text: '<img>', right: false, picked: '<s>', reason: '&', note: '<u>' }].concat(W.slice(1)) }));
    test('Escaping: option, reason, note, topic and verdict strings are escaped',
      bad.indexOf('A&amp;B &lt;x&gt;') >= 0 && bad.indexOf('&lt;b&gt;') >= 0 && bad.indexOf('&amp; &lt;i&gt;') >= 0 && bad.indexOf('<i>') < 0
      && vbad.indexOf('&lt;img&gt;') >= 0 && vbad.indexOf('&lt;s&gt;') >= 0 && vbad.indexOf('&lt;u&gt;') >= 0 && vbad.indexOf('T&lt;x&gt;') >= 0 && vbad.indexOf('<img>') < 0);

    // ── Task 2: the entry host ──
    test('index.html: #iwn-entry is the first child of #page-whynot (ios-only iq-screen)',
      /<div id="page-whynot" class="page">\s*<section id="iwn-entry" class="ios-only iq-screen" aria-label="Why-Not"><\/section>/.test(html));
    test('features/ios-whynot.js loads deferred right after ios-gauntlet.js',
      /<script defer src="features\/ios-gauntlet\.js"><\/script>\s*<script defer src="features\/ios-whynot\.js"><\/script>/.test(html));
    test('ios-whynot.js exports renderEntry; no inline on*= in its markup',
      /window\.iosWhyNot\.renderEntry = /.test(src) && !/\son[a-z]+=/.test(src));
    const fd = fs.readFileSync(path.join(ROOT, 'features', 'flagship-drills.js'), 'utf8');
    test('renderWhyNotEntry hands phones to iosWhyNot.renderEntry; the topic list opens the sheet on phones; Start closes it',
      /iosWhyNot[^;]*\.renderEntry\(/.test(_fnBody(fd, 'renderWhyNotEntry') || '') && /pickTopic/.test(_fnBody(fd, 'whyNotToggleTopicList') || '')
      && /closeTopics/.test(_fnBody(fd, 'startWhyNot') || '') && /closeTopics/.test(_fnBody(fd, 'whyNotStart') || ''));
    test("lift-shell hides the tab bar on the reason step and the verdicts, not the entry",
      /'whynot-round': 1/.test(fs.readFileSync(path.join(ROOT, 'lift-shell.js'), 'utf8')) && /'whynot-verdict': 1/.test(fs.readFileSync(path.join(ROOT, 'lift-shell.js'), 'utf8'))
      && !/'whynot': 1/.test(fs.readFileSync(path.join(ROOT, 'lift-shell.js'), 'utf8')));
    test('ios-whynot.js: confirmLeave asks with the B2 sheet copy, then runs whyNotExit',
      /Leave Why-Not\?/.test(src) && /Your rounds so far won\u2019t count\.|Your rounds so far won’t count\./.test(src) && /whyNotExit/.test(_fnBody(src, 'confirmLeave') || ''));
  } catch (err) {
    test('Lift B3c2 Why-Not: block (threw)', false);
    results.errors.push('504 ios-whynot block threw: ' + err.message);
  }
})();
