// tests/uat/539-readiness-pass-level.js
// Scope: "Pass level" + "Before you book" (fix/readiness-pass-level, drawing readiness-bookit-stamp option C).
// At or above the pass mark without all four book-it points: "Pass level" in the pass colour and the next step.
// At 4 of 4: "Exam ready" with the celebration. Below the pass mark: unchanged. Behaviour: tests/e2e/readiness-pass-level.spec.js.
const fs = require('fs');
const path = require('path');
const { _fnBody, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Readiness: Pass level and Before you book ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const rd = fs.readFileSync(path.join(ROOT, 'features', 'readiness.js'), 'utf8');
  const ih = fs.readFileSync(path.join(ROOT, 'features', 'ios-home.js'), 'utf8');
  const an = fs.readFileSync(path.join(ROOT, 'features', 'analytics.js'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'dg-system.css'), 'utf8');
  const ios = fs.readFileSync(path.join(ROOT, 'lift-ios.css'), 'utf8');
  const DAY = 86400000, NOW = Date.UTC(2026, 9, 31, 12, 0, 0);

  const ctx = vm.createContext({ Math, Date, Object, Array, String, Number, isNaN,
    EXAM_PASS_SCORE: 750, EXAM_TOPIC: 'Exam Simulation', MIXED_TOPIC: 'Mixed', DOMAIN_LABELS: { a: 'General Security Concepts', b: 'Security Operations' } });
  vm.runInContext('function scaledExamScore(c, t) { return t > 0 ? Math.round(100 + (c / t) * 800) : 100; }\n'
    + _fnBody(rd, 'getBookItChecklist') + '\n' + _fnBody(rd, 'getBookItNextStep'), ctx);
  const B = (r, h) => { ctx.__r = r; ctx.__h = h; ctx.__n = NOW; return vm.runInContext('getBookItChecklist(__r, __h, __n)', ctx); };
  const N = (b) => { ctx.__b = b; return vm.runInContext('getBookItNextStep(__b)', ctx); };

  const good = { lowerBound: 811, passAccuracy: 80, domainAccuracy: { a: 92, b: 85 } };
  const vol = (n) => ({ topic: 'T', mode: 'quiz', date: new Date(NOW - DAY).toISOString(), score: 1, total: n, byDiff: { E: [0, n] } });
  const mock = (daysAgo) => ({ topic: 'Exam Simulation', mode: 'exam', date: new Date(NOW - daysAgo * DAY).toISOString(), score: 80, total: 90 });

  // the next-step copy, one per checklist item, in checklist order (range, volume, areas, mocks)
  test('Next step: mocks with no pass in 14 days reads "Do 2 full exams and pass them"', N(B(good, [vol(412)])) === 'Do 2 full exams and pass them');
  test('Next step: mocks with one pass reads "Do 1 more full exam and pass it"', N(B(good, [vol(412), mock(3)])) === 'Do 1 more full exam and pass it');
  test('Next step: areas names the weakest area and the pass accuracy',
    N(B({ ...good, domainAccuracy: { a: 92, b: 64 } }, [vol(412)])) === 'Get Security Operations to 80%');
  test('Next step: volume says how many exam-level answers are left', N(B(good, [vol(120)])) === 'Answer 180 more exam-level questions');
  test('Next step: range names the pass mark', N(B({ ...good, lowerBound: 702 }, [vol(412)])) === 'Lift your low end above 750');
  test('Next step: the first unmet item in checklist order wins (range before volume, areas and mocks)',
    N(B({ lowerBound: 700, passAccuracy: 80, domainAccuracy: { a: 50 } }, [vol(10)])) === 'Lift your low end above 750'
    && N(B({ ...good, domainAccuracy: { a: 50, b: 90 } }, [vol(10)])) === 'Answer 290 more exam-level questions'
    && N(B({ ...good, domainAccuracy: { a: 50, b: 90 } }, [vol(300)])) === 'Get General Security Concepts to 80%');
  test('Next step: 4 of 4 has no next step', (() => { const b = B(good, [vol(412), mock(1), mock(4)]); return b.ready === true && N(b) === null; })());
  test('Next step: no em dash in any next-step copy', !/—/.test(_fnBody(rd, 'getBookItNextStep') + _fnBody(rd, 'getBookItRowHtml')));
  test('Next step: one shared exported function, used by both layouts',
    /window\.getBookItNextStep = getBookItNextStep/.test(rd) && /getBookItNextStep\(bi\)/.test(ih) && /getBookItNextStep\(bi\)/.test(rd) && /getBookItNextStep\(bi\)/.test(an));

  // desktop stamp (app.js): Pass level is green with no ring or confetti; 4 of 4 keeps "Exam ready" and the celebration
  const anim = _fnBody(app, 'animateReadinessCardV2');
  test('Desktop stamp: at or above the pass mark without 4 of 4 reads "Pass level" in the pass colour (warn only below the mark)',
    /showReadinessStamp\(card,scaled>=passLine\?'Pass level':\(passLine-scaled\)\+' pts to pass',scaled<passLine\)/.test(anim));
  test('Desktop stamp: 4 of 4 keeps "Exam ready", the ring and the confetti; Pass level gets neither',
    /if\(passed\)\{ drawReadinessRing\(card\); showReadinessStamp\(card,'Exam ready',false\); try\{ if\(typeof launchConfetti/.test(anim)
    && /const passed=scaled>=passLine && pending\.ready!==false;/.test(anim));
  test('Desktop stamp: reduced motion fades only (no scale or rotate change)',
    /prefers-reduced-motion: reduce\)'\)\.matches\?\[\{opacity:0,transform:'rotate\(-6deg\)'\},\{opacity:1,transform:'rotate\(-6deg\)'\}\]/.test(_fnBody(app, 'showReadinessStamp')));

  // desktop Before you book row (Home card + Analytics tile)
  test('Desktop row: Home card has the row under the footer, hidden by default',
    /<div class="readiness-range">[\s\S]{0,200}<\/div>\s*<button type="button" class="rc-v2-book" id="rc-v2-book" hidden><\/button>/.test(html));
  const row = _fnBody(rd, '_renderBookItRow');
  test('Desktop row: shown only at or above the pass mark and not 4 of 4; tapping opens Why this score',
    /r\.predicted >= pass\) \? getBookItChecklist\(r, hist\)/.test(row) && /bi && !bi\.ready \? getBookItNextStep\(bi\)/.test(row)
    && /if \(!step\) \{ row\.hidden = true; return; \}/.test(row) && /ev\.stopPropagation\(\); if \(typeof window\.openWhyScore === 'function'\) window\.openWhyScore\(\);/.test(row));
  test('Desktop row: three-or-four dots (met = on), "Before you book:", the step in bold, "{met} of 4 ›"', (() => {
    const c2 = vm.createContext({ String });
    vm.runInContext(_fnBody(rd, 'getBookItRowHtml'), c2);
    c2.__bi = { met: 3, items: [{ met: true }, { met: true }, { met: true }, { met: false }] };
    const h = vm.runInContext('getBookItRowHtml(__bi, "Do 2 full exams and pass them")', c2);
    return (h.match(/<i class="on"><\/i>/g) || []).length === 3 && (h.match(/<i><\/i>/g) || []).length === 1
      && h.includes('Before you book: <strong>Do 2 full exams and pass them</strong>') && h.includes('3 of 4 <span aria-hidden="true">›</span>');
  })());
  test('Desktop row: Analytics tile shows "Pass level" (pass colour) and the same row opening Why this score',
    /else if \(predicted >= PASS\) tier = 'Pass level';/.test(an) && /class="rc-v2-book read-book" onclick="openWhyScore\(\)"/.test(an)
    && /#page-analytics \.read-tier\.is-pass\{[^}]*color:var\(--pass\)/.test(css));
  test('Desktop row CSS: at least 44px tall, met dots in the pass colour, hover gated to fine pointers, reduced motion drops the press',
    /#readiness-card-v2 \.rc-v2-book,#page-analytics \.rc-v2-book\{[^}]*min-height:44px/.test(css)
    && /\.rc-v2-book-dots i\.on\{background:var\(--pass\)\}/.test(css)
    && /@media \(hover:hover\) and \(pointer:fine\)\{#readiness-card-v2 \.rc-v2-book:hover/.test(css)
    && /@media \(prefers-reduced-motion:reduce\)\{#readiness-card-v2 \.rc-v2-book,#page-analytics \.rc-v2-book\{transition:none\}/.test(css));

  // phone Home
  test('Phone: ready is the checklist at 4 of 4, the pill reads "Exam ready" then "Pass level" above the mark',
    /var ready = bi \? bi\.ready : !!r\.examReady;/.test(ih) && /ready \? 'Exam ready' : \(r\.predicted >= pass \? 'Pass level' : \(r\.passProbability >= 0\.5 \? 'On track'/.test(ih));
  test('Phone: Pass level shows "Before you book · {met} of 4" and "{next step}." in place of the insight',
    /readiness\.book = \{ label: 'Before you book · ' \+ bi\.met \+ ' of 4', step: step \+ '\.' \}/.test(ih)
    && /r\.book \? '<div class="ih-rd-book"><span class="ih-rd-book-k">'/.test(ih));
  test('Phone: the green celebration card is for "Exam ready" only, and its pill stays visible',
    /r\.tier === 'Exam ready' \? ' ih-passed' : ''/.test(ih) && !/\.ih-rd\.ih-passed \.ih-rd-tier \{ display: none; \}/.test(ios));
  test('Phone: the card still opens Why on tap', /data-act="readiness" role="button"/.test(ih) && /readiness: function \(\) \{ _openWhy\(\); \}/.test(ih));
  test('Old copy is gone everywhere: no "Not book-ready yet" or "Pass ready"',
    !/Not book-ready yet/.test(app + rd + ih + an) && !/'Pass ready'/.test(ih));
})();
