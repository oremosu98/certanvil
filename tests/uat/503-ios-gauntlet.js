// Lift B3c1 (23 Oct): Reword Gauntlet on phones (features/ios-gauntlet.js). The entry and the results
// as pure model/view pairs run in a vm sandbox, plus the markup and wiring checks of the phone hosts.
const { _fnBody, fs, html, path, ROOT, results, test, vm } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift B3c1 Reword Gauntlet (phone) ──\x1b[0m');
  try {
    const p = path.join(ROOT, 'features', 'ios-gauntlet.js');
    const src = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Number });
    vm.runInContext(['_iosGtEntryModel', '_iosGtEntryHtml', '_iosGtResultModel', '_iosGtResultHtml'].map(n => _fnBody(src, n) || '').join('\n'), ctx);
    const run = (expr, s) => { ctx.__s = s; return vm.runInContext(expr, ctx); };
    const E = (o) => run('_iosGtEntryHtml(_iosGtEntryModel(__s))', Object.assign({ topic: 'Ports & Protocols', why: 'Your weakest topic right now', back: 'drills', cracked: 3, free: false, topics: ['A', 'Ports & Protocols'] }, o));

    // ── entry ──
    const pro = E();
    test('Entry: headline, escaped topic, cracked count, five rungs, no cap line for Pro',
      pro.indexOf('Beat the concept in <em>every</em> disguise') >= 0 && pro.indexOf('Ports &amp; Protocols') >= 0 && /<b>3<\/b>/.test(pro)
      && (pro.match(/class="igt-rg"/g) || []).length === 5 && pro.indexOf('Free covers') < 0 && /data-act="start"[^>]*>[^]*Start the Gauntlet/.test(pro));
    const free = E({ free: true, cracked: 0 });
    test('Entry: free user sees the cap line; nothing cracked hides the row',
      free.indexOf('Free covers <b>one Gauntlet a day</b>, on top of your 15 questions.') >= 0 && free.indexOf('concepts cracked') < 0);
    const em = run('_iosGtEntryModel(__s)', { topic: 'Ports & Protocols', why: 'x', back: 'drills', cracked: 0, free: false, topics: ['A', 'Ports & Protocols'] });
    test('Entry model: current topic is on; back label names the destination',
      em.topics[1].on === true && em.topics[0].on === false && em.backLabel === 'Back to Drills'
      && run('_iosGtEntryModel(__s)', { topic: 'A', why: 'x', back: 'setup', cracked: 0, free: false, topics: ['A'] }).backLabel === 'Back to Home');

    // ── results ──
    const RK = [['Plain', 'Straight definition'], ['Scenario', 'Real-world setup'], ['Best-of', 'One word decides it'], ['Not-trap', 'The negation flip'], ['Twisted', 'Trickiest phrasing']];
    const rung = (i, ok, extra) => Object.assign({ key: RK[i][0], sub: RK[i][1], ok: ok, question: 'Question ' + i + ' about RDP?', hinge: 'RDP', yours: ok ? '3389' : '80', answer: '3389', explanation: 'Why ' + i }, extra || {});
    const R = (o) => Object.assign({ cracked: false, concept: 'Remote Desktop listens on TCP 3389', topic: 'Ports & Protocols', attempts: 1, collection: 4, back: 'drills', free: false, used: false, rungs: [0, 1, 2, 3, 4].map(i => rung(i, true)) }, o);
    const cm = run('_iosGtResultModel(__s)', R({ cracked: true }));
    const ch = run('_iosGtResultHtml(_iosGtResultModel(__s))', R({ cracked: true }));
    test('Cracked: kicker, collection line, Next target primary, no arrow glyph',
      cm.kick === 'Reword Gauntlet · Ports & Protocols' && /That’s 4 in your collection\./.test(cm.sub)
      && cm.primary.label === 'Next target' && cm.primary.act === 'next' && cm.secondary.label === 'Back to Drills' && ch.indexOf('→') < 0
      && ch.indexOf('Concept cracked') >= 0 && (ch.match(/<i><\/i>/g) || []).length >= 5);
    test('Cracked after several runs: "Took N runs. Earned."',
      /Took 3 runs\. <b>Earned\.<\/b>/.test(run('_iosGtResultModel(__s)', R({ cracked: true, attempts: 3 })).sub));
    const two = R({ rungs: [0, 1, 2, 3, 4].map(i => rung(i, i !== 2 && i !== 3)) });
    const mm = run('_iosGtResultModel(__s)', two), mh = run('_iosGtResultHtml(_iosGtResultModel(__s))', two);
    test('Missed: Cracked 3 of 5, two-rung callout, Run it again / Different concept',
      mm.title === 'Cracked <em>3 of 5</em>' && mm.callout === 'The <b>Best-of</b> and the <b>Not-trap</b> got you.'
      && mm.primary.act === 'again' && mm.secondary.label === 'Different concept' && mm.secondary.act === 'different');
    test('Missed callouts for one and three misses',
      /One rung from the seal\./.test(run('_iosGtResultModel(__s)', R({ rungs: [0, 1, 2, 3, 4].map(i => rung(i, i !== 2)) })).callout)
      && run('_iosGtResultModel(__s)', R({ rungs: [0, 1, 2, 3, 4].map(i => rung(i, i < 2)) })).callout === '3 rungs got you this time.');
    const d2 = mh.slice(mh.indexOf('id="igt-sdet-2"'), mh.indexOf('id="igt-sdet-3"')), d0 = mh.slice(mh.indexOf('id="igt-sdet-0"'), mh.indexOf('id="igt-sdet-1"'));
    test('Missed rows: Right/Wrong pills; a wrong row shows Your answer and Answer, a right row only Your answer',
      (mh.match(/igt-sv no">Wrong</g) || []).length === 2 && (mh.match(/igt-sv ok">Right</g) || []).length === 3
      && /Your answer/.test(d2) && />Answer</.test(d2) && /Your answer/.test(d0) && !/>Answer</.test(d0) && /aria-expanded="false"/.test(mh) && /igt-sdet-2"[^>]*hidden/.test(mh));
    const esc = run('_iosGtResultHtml(_iosGtResultModel(__s))', R({ topic: 'T<x>', rungs: [0, 1, 2, 3, 4].map(i => rung(i, false, { question: 'Use A&B <now>', hinge: i === 0 ? 'A&B' : 'zzz', explanation: '<script>' })) }));
    test('Escaping: hinge marked after escaping, only where found; topic and explanation escaped',
      esc.indexOf('Use <mark class="igt-hg">A&amp;B</mark> &lt;now&gt;') >= 0 && (esc.match(/igt-hg/g) || []).length === 1
      && esc.indexOf('<script>') < 0 && esc.indexOf('T&lt;x&gt;') >= 0);
    test('Free note after today\'s run, and only then',
      /That was today’s free run\. The next one is free tomorrow, or Pro runs it again now\./.test(run('_iosGtResultHtml(_iosGtResultModel(__s))', R({ free: true, used: true })))
      && run('_iosGtResultHtml(_iosGtResultModel(__s))', R({ free: false, used: true })).indexOf('free run') < 0
      && run('_iosGtResultHtml(_iosGtResultModel(__s))', R({ free: true, used: false })).indexOf('free run') < 0);

    // ── Task 2: the phone hosts ──
    test('index.html: #igt-entry is the first child of #page-gauntlet (ios-only iq-screen)',
      /<div id="page-gauntlet" class="page">\s*<section id="igt-entry" class="ios-only iq-screen" aria-label="Reword Gauntlet"><\/section>/.test(html));
    test('index.html: #igt-topics sheet with its scrim, labelled, hidden',
      /<div id="igt-topics-scrim" class="isl-scrim" hidden><\/div>\s*<div id="igt-topics" class="ix-sheet igt-tsheet" role="dialog" aria-modal="true" aria-labelledby="igt-topics-title" hidden>/.test(html)
      && /<h3 id="igt-topics-title">Pick a topic<\/h3>/.test(html));
    test('features/ios-gauntlet.js loads deferred right after ios-simlab.js',
      /<script defer src="features\/ios-simlab\.js"><\/script>\s*<script defer src="features\/ios-gauntlet\.js"><\/script>/.test(html));
    test('ios-gauntlet.js exports renderEntry, pickTopic, closeTopics; no inline on*= in its markup',
      ['renderEntry', 'pickTopic', 'closeTopics'].every(n => new RegExp('window\\.iosGauntlet\\.' + n + ' = ').test(src)) && !/\son[a-z]+=/.test(src));
    const fd = fs.readFileSync(path.join(ROOT, 'features', 'flagship-drills.js'), 'utf8');
    test('renderGauntletEntry hands phones to iosGauntlet.renderEntry; Start and the entry close the topic sheet',
      /iosGauntlet/.test(_fnBody(fd, 'renderGauntletEntry') || '') && /\.renderEntry\(/.test(_fnBody(fd, 'renderGauntletEntry') || '') && /closeTopics/.test(_fnBody(fd, 'startRewordGauntlet') || '') && /closeTopics/.test(_fnBody(fd, 'gauntletStart') || ''));
    test('iosSheet.dismiss also closes the Gauntlet topic sheet',
      /iosGauntlet[^;]*closeTopics/.test(fs.readFileSync(path.join(ROOT, 'features', 'ios-sheet.js'), 'utf8')));
  } catch (err) {
    test('Lift B3c1 Reword Gauntlet: block (threw)', false);
    results.errors.push('503 ios-gauntlet block threw: ' + err.message);
  }
})();
