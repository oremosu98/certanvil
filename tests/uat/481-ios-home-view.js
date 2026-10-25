// tests/uat/481-ios-home-view.js
// Scope: Lift A Home view (features/ios-home.js _iosHomeHtml): the June E2E Home markup and copy
// rendered from the model, with every interpolated string escaped.
const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Lift A Home view ──\x1b[0m');
  try {
    const ctx = vm.createContext({ Math, String, Array, Object });
    vm.runInContext("function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');}\n" + (_fnBody(js, '_iosHomeHtml') || ''), ctx);
    const base = {
      state: 'returning', signedIn: true, cert: { mark: 'N+', name: 'Network+', code: 'N10-009' }, streak: 12,
      greeting: 'Tuesday morning. Pick up where you left off.',
      readiness: { score: 553, max: 900, pass: 720, tier: 'On track', fillPct: 61.4, passPct: 80, insight: 'About 167 points to a pass.', meta: 'Last 200 answers: 70% right · 34 days to exam' },
      rec: { kind: 'review', min: 4, title: 'Review 7 cards', sub: 'Spaced repetition. Re-encounter what you forgot.' },
      week: [{ label: 'Today', count: 7, isToday: true, isExam: false }, { label: 'Wed', count: 2, isToday: false, isExam: false }],
      momentum: { done: 0, goal: 20, streakLine: '1 day streak, best is 4. One short session adds another.', pick: { topic: 'Ethernet Basics', detail: 'around 46% accuracy' } },
      mistakes: 9, domains: [{ key: 'concepts', name: 'Networking Concepts', weightPct: 23, mastery: 100, untouched: false }],
    };
    const html = (m) => vm.runInContext('_iosHomeHtml(__m)', Object.assign(ctx, { __m: m }));
    const h = html(base);
    test('Header: cert mark, name, code, streak 12, settings and theme buttons',
      h.includes('class="ih-tb-mark">N+<') && h.includes('<b>Network+</b><span>N10-009</span>') && /class="ih-tb-streak"[^>]*>[\s\S]*?12<\/span>/.test(h)
      && h.includes('data-act="settings"') && h.includes('data-act="theme"'));
    test('Readiness card: 553 / 900, tier, fill 61.4%, pass tick 80%, legend "Pass 720", insight + meta line',
      h.includes('class="ih-rd-num">553<') && h.includes('/ 900') && h.includes('>On track<') && h.includes('width:61.4%') && h.includes('left:80%')
      && h.includes('Pass 720') && h.includes('About 167 points to a pass.') && h.includes('class="ih-rd-meta">Last 200 answers: 70% right · 34 days to exam<'));
    test('Recommended next: badge 4 MIN, kicker, title, sub, data-act="rec"',
      h.includes('data-act="rec"') && /ih-rc-badge">4<small>MIN<\/small>/.test(h) && h.includes('Recommended next') && h.includes('>Review 7 cards<'));
    test('Coming up strip: Today first with its count', h.includes('Coming up') && /ih-day ih-today[\s\S]*?<b>7<\/b>[\s\S]*?Today/.test(h));
    test('Momentum: ring "0 of 20", goal line, streak line, Pick up topic + Practise it button',
      h.includes('0 / 20 questions today') && h.includes('1 day streak, best is 4.') && h.includes('Pick up: <b>Ethernet Basics</b>, around 46% accuracy')
      && h.includes('data-act="practise"') && h.includes('Practise it · 10 questions'));
    test('Quick start: 5-min Warmup, Daily Challenge, Drill Mistakes (9 saved)',
      h.includes('data-act="warmup"') && h.includes('data-act="daily"') && h.includes('data-act="mistakes"') && h.includes('9 saved') && h.includes('Clear the 9 wrong answers you have saved.'));
    test('Study menus: Practice (Deep Scan / 30 / 45), Exam simulation (60-Question SIM / Full Exam Simulator), Drill by domain, custom quiz',
      ['data-act="grind"', 'data-act="bulk30"', 'data-act="bulk45"', 'data-act="bulk60"', 'data-act="exam"', 'data-act="custom"', '20-min Deep Scan', '60-Question SIM', 'Full Exam Simulator', 'Build a custom quiz', 'Drill by domain']
        .every(s => h.includes(s)) && /data-act="domain" data-key="concepts"/.test(h) && h.includes('23% of exam') && h.includes('Mastery <b>100%</b>'));
    test('Exam simulation subtitle uses the cert scale ("scored 100 to 900.")', h.includes('Pressure-test readiness, scored 100 to 900.'));
    test('No Pro lock pills on Home (E2E)', !/pro-lock/.test(h));
    const nu = html(Object.assign({}, base, { state: 'new', streak: 0, readiness: { score: null, max: 900, pass: 720, tier: 'Locked', fillPct: 0, passPct: 80, insight: 'Take a quiz to unlock your readiness score and a pass forecast.', meta: null },
      rec: { kind: 'first', min: 10, title: 'Start your first quiz', sub: '10 questions, easy mix, about 10 minutes.' }, week: null, mistakes: 0,
      momentum: { done: 0, goal: 20, streakLine: '0 day streak. Finish today to start one.', pick: null } }));
    test('New user: locked readiness "--", no meta line, no Coming up, no Drill Mistakes, first-quiz line',
      nu.includes('ih-rd ih-locked') && nu.includes('class="ih-rd-num">--<') && !nu.includes('ih-rd-meta') && !nu.includes('Coming up')
      && !nu.includes('data-act="mistakes"') && nu.includes('First quiz finds your weak spots.') && nu.includes('ih-tb-streak ih-zero'));
    const out = html(Object.assign({}, base, { signedIn: false }));
    test('Signed out (web): Sign in pill instead of the streak', out.includes('class="ih-tb-signin" data-act="signin"') && !out.includes('ih-tb-streak'));
    const x = html(Object.assign({}, base, { greeting: '<img src=x onerror=alert(1)>', momentum: Object.assign({}, base.momentum, { pick: { topic: '<b>x</b>', detail: '' } }) }));
    test('Interpolated strings are escaped', !x.includes('<img src=x') && x.includes('&lt;img') && x.includes('&lt;b&gt;x&lt;/b&gt;'));
  } catch (err) {
    test('Lift A Home view: block (threw)', false);
    results.errors.push('481 ios-home-view block threw: ' + err.message);
  }
})();

// Reveal rules must rest visible and animate FROM hidden (fill backwards). WebKit never starts the
// animation on content drawn while its page is display:none, so a rule whose resting state is
// opacity 0 with fill forwards leaves the content invisible (blank Home after a tab round-trip).
(function () {
  try {
    const fs = require('fs'), path = require('path');
    const css = fs.readFileSync(path.join(__dirname, '..', '..', 'lift-ios.css'), 'utf8');
    const bad = css.split('\n').filter(l => /\{[^}]*opacity:\s*0[;\s][^}]*animation:[^;}]*\bforwards\b/.test(l));
    test('lift-ios.css: no reveal rests at opacity 0 waiting on a forwards animation (WebKit blank Home)', bad.length === 0);
    if (bad.length) console.log('    ' + bad.map(l => l.trim().slice(0, 90)).join('\n    '));
  } catch (err) {
    test('Lift A reveal guard: block (threw)', false);
    results.errors.push('481 reveal guard threw: ' + err.message);
  }
})();
