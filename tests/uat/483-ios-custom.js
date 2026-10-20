// tests/uat/483-ios-custom.js
// Scope: the phone Custom quiz (features/ios-custom.js), part of Lift A. E2E source: feat/cert-ios-e2e
// mockups/cert-ios-custom-quiz.html (c75e41e8). Spec: docs/superpowers/specs/2026-10-20-ios-custom-quiz-design.md.
const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Lift A custom quiz (phone) ──\x1b[0m');
  try {
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Date, isFinite, Number });
    vm.runInContext((_fnBody(js, '_iosCustomModel') || ''), ctx);
    const NOW = new Date('2026-10-20T12:00:00Z');
    const T = (v, on) => ({ v, label: v, on: !!on });
    const dom = (idx, name, short, weight, names, onSet) => ({ idx, name, short, weight, topics: names.map(n => T(n, onSet && onSet.indexOf(n) >= 0)) });
    const D1 = ['OSI', 'Subnetting', 'DNS', 'IPv6'], D2 = ['OSPF', 'BGP', 'VLANs', 'STP'], D3 = ['PKI', 'AAA', 'Firewalls', 'VPN'];
    const DIFFS = ['Foundational', 'Exam Level', 'Hard / Tricky', 'Mixed'];
    const src = (o) => Object.assign({
      cert: { mark: 'N+', name: 'Network+', code: 'N10-009' },
      domains: [dom(1, '1.0 Networking Concepts', 'Concepts', '23% of exam', D1, o.p1), dom(2, '2.0 Network Implementation', 'Implementation', '20% of exam', D2, o.p2),
        dom(3, '4.0 Network Security', 'Security', '14% of exam', D3, o.p3)],
      modes: [{ kind: 'smart', v: 'Smart', on: o.mode === 'smart' }, { kind: 'mixed', v: 'Mixed — All Topics', on: o.mode === 'mixed' },
        { kind: 'catchup', v: 'Mixed — Catch-up', on: o.mode === 'catchup' }],
      diffs: DIFFS.map(v => ({ v, on: v === (o.diff || 'Mixed') })),
      counts: ['5', '10', '15', '20'].map(v => ({ v, on: v === (o.count || '10') })),
      history: o.history || [], err: ''
    }, o.extra || {});
    const M = (o) => vm.runInContext('_iosCustomModel(__s, __n)', Object.assign(ctx, { __s: src(o), __n: NOW }));

    test('Custom model: Mixed + Mixed difficulty footer', M({ mode: 'mixed' }).foot === 'Mixed spread across all topics, mixed difficulty.');
    test('Custom model: Smart + Exam Level footer', M({ mode: 'smart', diff: 'Exam Level' }).foot === 'Your weakest topics, exam level.');
    test('Custom model: Catch-up + Hard footer', M({ mode: 'catchup', diff: 'Hard / Tricky' }).foot === "The topics you've gone longest without, hard.");
    test('Custom model: 3 topics in 2 domains footer',
      M({ p1: ['OSI', 'DNS'], p3: ['PKI'], diff: 'Exam Level' }).foot === '3 topics from Concepts and Security, exam level.');
    test('Custom model: 1 topic footer is singular', M({ p1: ['Subnetting'], diff: 'Foundational' }).foot === '1 topic from Concepts, foundational.');
    test('Custom model: more than 2 domains collapses to "from N domains"',
      M({ p1: ['OSI'], p2: ['BGP'], p3: ['VPN', 'AAA'], diff: 'Mixed' }).foot === '4 topics from 3 domains, mixed difficulty.');

    const m = M({ p1: ['OSI', 'DNS'], p3: D3 });
    test('Custom model: pickedLabel is "", "2 picked" or "all picked"',
      m.domains[1].pickedLabel === '' && m.domains[0].pickedLabel === '2 picked' && m.domains[2].pickedLabel === 'all picked');
    test('Custom model: allOn only when every topic in the domain is on',
      m.domains[2].allOn === true && m.domains[0].allOn === false && m.domains[1].allOn === false);
    test('Custom model: expanded = domains with a picked topic',
      m.domains.map(d => d.expanded).join() === 'true,false,true');
    test('Custom model: topicCount + weight carried through', m.domains[0].topicCount === 4 && m.domains[0].weight === '23% of exam');

    const day = (n) => new Date(NOW.getTime() - n * 864e5).toISOString();
    test('Custom model: no history hides the Catch-up line', M({ mode: 'mixed' }).catchup.show === false);
    const c1 = M({ mode: 'mixed', history: [{ topic: 'OSI', date: day(2) }, { topic: 'BGP', date: day(30) }] }).catchup;
    test('Custom model: Catch-up counts topics not seen in 7 days (never seen counts)', c1.show === true && c1.n === 11 && c1.text === 'not practised in a week');
    const all = D1.concat(D2, D3).map((t, i) => ({ topic: t, date: day(i % 6) }));
    const c2 = M({ mode: 'mixed', history: all }).catchup;
    test('Custom model: everything seen this week reads "All practised this week."', c2.show === true && c2.n === 0 && c2.text === 'All practised this week.');
    const c3 = M({ mode: 'mixed', history: [{ topic: 'OSI', date: 'garbage' }, { topic: 'DNS' }, { topic: 'IPv6', date: day(1) }, { topic: 'IPv6', date: day(20) }] }).catchup;
    test('Custom model: invalid or missing dates count as never seen; latest row per topic wins', c3.show === true && c3.n === 11);

    const d = M({ mode: 'mixed', diff: 'Hard / Tricky', count: '15' });
    test('Custom model: difficulty labels Foundational / Exam level / Hard / Mixed',
      d.diffs.map(x => x.label).join('|') === 'Foundational|Exam level|Hard|Mixed' && d.diffs[2].on === true);
    test('Custom model: count is the selected number', d.count === 15 && M({ mode: 'mixed' }).count === 10);
    test('Custom model: mode copy (E2E wins)',
      d.modes[0].title === 'Smart' && d.modes[0].sub === 'Targets the topics you keep getting wrong.'
      && d.modes[1].title === 'Mixed' && d.modes[1].sub === 'A random spread across every topic.'
      && d.modes[2].title === 'Catch-up' && d.modes[2].sub === "Topics you haven't seen lately.");
  } catch (err) {
    test('Lift A custom quiz: model block (threw)', false);
    results.errors.push('483 ios-custom model block threw: ' + err.message);
  }

  // ── View ──
  try {
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Date, isFinite, Number });
    vm.runInContext("function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');}\n"
      + (_fnBody(js, '_iosCustomModel') || '') + '\n' + (_fnBody(js, '_iosCustomHtml') || ''), ctx);
    const base = {
      cert: { mark: 'N+', name: 'Network+', code: 'N10-009' },
      domains: [{ idx: 1, name: '1.0 Networking Concepts', short: 'Concepts', weight: '23% of exam',
        topics: [{ v: '<img src=x onerror=1>', label: '<img src=x onerror=1>', on: true }, { v: 'DNS', label: 'DNS', on: false }] }],
      modes: [{ kind: 'smart', v: 'Smart', on: false }, { kind: 'mixed', v: 'Mixed — All Topics', on: false }, { kind: 'catchup', v: 'Mixed — Catch-up', on: false }],
      diffs: ['Foundational', 'Exam Level', 'Hard / Tricky', 'Mixed'].map(v => ({ v, on: v === 'Exam Level' })),
      counts: ['5', '10', '15', '20'].map(v => ({ v, on: v === '10' })), history: [], err: ''
    };
    const H = (over) => vm.runInContext('_iosCustomHtml(_iosCustomModel(__s, new Date("2026-10-20")))',
      Object.assign(ctx, { __s: Object.assign({}, base, over || {}) }));
    const h = H();
    const count = (re) => (h.match(re) || []).length;
    test('Custom view: topic labels are escaped', h.indexOf('<img src=x') < 0 && h.indexOf('&lt;img src=x onerror=1&gt;') >= 0);
    test('Custom view: Catch-up is the wide tile', /class="ic-mode ic-mode-wide[^"]*"[^>]*data-act="mode"/.test(h) || /ic-mode-wide/.test(h));
    test('Custom view: no Catch-up live line without history', h.indexOf('ic-live') < 0);
    test('Custom view: Catch-up live line with history',
      /ic-live[^>]*>\s*<b>2<\/b> not practised in a week/.test(H({ history: [{ topic: 'x', date: '2026-01-01' }] })));
    test('Custom view: 4 difficulty and 4 count buttons', count(/data-act="diff"/g) === 4 && count(/data-act="count"/g) === 4
      && /data-act="count" data-v="5"/.test(h) && /data-act="count" data-v="20"/.test(h));
    test('Custom view: Start quiz with the count', h.indexOf('Start quiz') >= 0 && h.indexOf('10 Q') >= 0);
    test('Custom view: no cap note and no over-cap dimming before Stage 6', h.indexOf('needs Pro') < 0 && h.indexOf('data-overcap') < 0);
    test('Custom view: error card only when err is set', h.indexOf('ic-err') < 0 && H({ err: 'Add your API key first.' }).indexOf('ic-err') >= 0
      && H({ err: 'Add your API key first.' }).indexOf('Add your API key first.') >= 0);
    test('Custom view: no em dash in the copy (mode data-v values excepted)', !/—/.test(h.replace(/data-v="[^"]*"/g, '')));
    test('Custom view: every hook present', ['close', 'theme', 'mode', 'domain', 'acc', 'topic', 'diff', 'count', 'start']
      .every(a => h.indexOf('data-act="' + a + '"') >= 0));
    test('Custom view: picked domain renders expanded with "1 picked"', /class="ic-dom[^"]*" aria-expanded="true"/.test(h) && h.indexOf('1 picked') >= 0);
  } catch (err) {
    test('Lift A custom quiz: view block (threw)', false);
    results.errors.push('483 ios-custom view block threw: ' + err.message);
  }
})();
