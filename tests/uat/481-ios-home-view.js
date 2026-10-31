// tests/uat/481-ios-home-view.js
// Scope: Lift A Home view (features/ios-home.js _iosHomeHtml): the June E2E Home markup and copy
// rendered from the model, with every interpolated string escaped.
const { _fnBody, fs, js, path, results, ROOT, test, vm } = require('./_context');

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
      momentum: { done: 0, goal: 20, streakLine: '4-day streak. Study today to keep it.' },
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
    test('Momentum: ring "0 of 20", goal line, streak line; no Pick up line and no Practise it button',
      h.includes('0 / 20 questions today') && h.includes('4-day streak. Study today to keep it.') && !h.includes('Pick up:') && !/class="ih-mo-go"/.test(h) && !h.includes('data-act="practise"') && !h.includes('Practise it'));
    test('Quick start: 5-min Warmup, Daily Challenge, Drill Mistakes (9 saved)',
      h.includes('data-act="warmup"') && h.includes('data-act="daily"') && h.includes('data-act="mistakes"') && h.includes('9 saved') && h.includes('Clear the 9 wrong answers you have saved.'));
    test('Study menus: Practice (Deep Scan / 30 / 45), Exam simulation (60-Question SIM / Full Exam Simulator), Drill by domain, custom quiz',
      ['data-act="grind"', 'data-act="bulk30"', 'data-act="bulk45"', 'data-act="bulk60"', 'data-act="exam"', 'data-act="custom"', '20-min Deep Scan', '60-Question SIM', 'Full Exam Simulator', 'Build a custom quiz', 'Drill by domain']
        .every(s => h.includes(s)) && /data-act="domain" data-key="concepts"/.test(h) && h.includes('23% of exam') && h.includes('Mastery <b>100%</b>'));
    test('Exam simulation subtitle uses the cert scale ("scored 100 to 900.")', h.includes('Pressure-test readiness, scored 100 to 900.'));
    test('No Pro lock pills on Home (E2E)', !/pro-lock/.test(h));
    const nu = html(Object.assign({}, base, { state: 'new', streak: 0, readiness: { score: null, max: 900, pass: 720, tier: 'Locked', fillPct: 0, passPct: 80, insight: 'Take a quiz to unlock your readiness score and a pass forecast.', meta: null },
      rec: { kind: 'first', min: 10, title: 'Start your first quiz', sub: '10 questions, easy mix, about 10 minutes.' }, week: null, mistakes: 0,
      momentum: { done: 0, goal: 20, streakLine: 'No streak yet. Finish a set today to start one.', pick: null } }));
    test('New user: locked readiness "--", no meta line, no Coming up, no Drill Mistakes, first-quiz line',
      nu.includes('ih-rd ih-locked') && nu.includes('class="ih-rd-num">--<') && !nu.includes('ih-rd-meta') && !nu.includes('Coming up')
      && !nu.includes('data-act="mistakes"') && nu.includes('First quiz finds your weak spots.') && nu.includes('ih-tb-streak ih-zero'));
    const nuOut = html(Object.assign({}, base, { state: 'new', signedIn: false, readiness: { score: null, max: 900, pass: 720, tier: 'Locked', insight: 'x' }, week: null, mistakes: 0 }));
    test('Locked readiness (30 Oct): signed in offers "Or take the 30-second check"; signed out and scored do not',
      /<button class="ih-rd-check" type="button" data-act="check">Or take the 30-second check/.test(nu) && !nuOut.includes('data-act="check"') && !h.includes('data-act="check"'));
    test('Home mount (30 Oct): data-act="check" opens the 30-second check',
      /check: function \(\) \{ if \(window\.iosFirstRun && iosFirstRun\.startCheck\) iosFirstRun\.startCheck\(\); \}/.test(fs.readFileSync(path.join(ROOT, 'features', 'ios-home.js'), 'utf8')));
    const out = html(Object.assign({}, base, { signedIn: false }));
    test('Signed out (web): Sign in pill instead of the streak', out.includes('class="ih-tb-signin" data-act="signin"') && !out.includes('ih-tb-streak'));
    const x = html(Object.assign({}, base, { greeting: '<img src=x onerror=alert(1)>', rec: { kind: 'weak', min: 15, title: '<b>x</b>', sub: 's' } }));
    test('Interpolated strings are escaped', !x.includes('<img src=x') && x.includes('&lt;img') && x.includes('&lt;b&gt;x&lt;/b&gt;'));
    const rv = (rec, extra) => html(Object.assign({}, base, extra || {}, { rec }));
    const qz = rv({ kind: 'quiz', kick: 'Pick up where you left off', badge: '3', unit: 'LEFT', title: 'Finish your quiz · 3 left', sub: 'Ports & Protocols · 7 of 10 answered' });
    test('Resume card: 3 LEFT badge, kicker, Start fresh link, rec action',
      /ih-rc-badge">3<small>LEFT<\/small>/.test(qz) && qz.includes('Pick up where you left off') && qz.includes('Finish your quiz · 3 left') && qz.includes('data-act="fresh"') && qz.includes('Start fresh') && qz.includes('data-act="rec"'));
    const ocH = rv({ kind: 'outcome', kick: 'Your exam was yesterday', title: 'How did your Network+ exam go?', sub: "Tell us and we'll update your plan." });
    test('Outcome card: Passed, Didn\'t pass, I haven\'t sat it yet; no ih-rec button',
      ['data-act="oc-passed"', 'data-act="oc-failed"', 'data-act="oc-notyet"', '>Passed<', 'Didn&#39;t pass'.replace('&#39;', "'"), "I haven't sat it yet", 'Your exam was yesterday'].every(s => ocH.includes(s)) && !ocH.includes('class="ih-rec'));
    const nc = rv({ kind: 'nextcert', kick: 'Network+ passed · scored 812', title: 'Pick your next cert', sub: 'We predicted 553 on exam day. Your streak carries on with your next cert.' }, { passed: true });
    test('Next cert card + Passed badge: Choose a cert, badge beside the cert name',
      nc.includes('Choose a cert') && nc.includes('Pick your next cert') && nc.includes('Network+ passed · scored 812') && nc.includes('class="ih-tb-passed">Passed<') && !h.includes('ih-tb-passed'));
    test('Warmup rec renders as the normal rec button', rv({ kind: 'warmup', min: 5, title: '5-min Warmup', sub: 'Ease back in. 5 questions, foundational.' }).includes('>5-min Warmup<'));
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
