// tests/uat/524-bookit.js
// Scope: persona bundle Task 9. The book-it checklist decides "Exam ready"; the "Why this score?" sheet shows it.
// Spec: docs/superpowers/specs/2026-10-30-why-score-bookit-repeats-design.md §1-2
const fs = require('fs');
const path = require('path');
const { _fnBody, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Book-it checklist and Why this score ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const rd = fs.readFileSync(path.join(ROOT, 'features', 'readiness.js'), 'utf8');
  const ih = fs.readFileSync(path.join(ROOT, 'features', 'ios-home.js'), 'utf8');
  const DAY = 86400000, NOW = Date.UTC(2026, 9, 31, 12, 0, 0);

  const ctx = vm.createContext({ Math, Date, Object, Array, String, Number, isNaN,
    EXAM_PASS_SCORE: 720, EXAM_MIN_SCORE: 100, EXAM_MAX_SCORE: 900, EXAM_TOPIC: 'Exam Simulation', MIXED_TOPIC: 'Mixed',
    DOMAIN_LABELS: { a: 'Alpha', b: 'Bravo' }, DOMAIN_WEIGHTS: { a: 0.6, b: 0.4 } });
  vm.runInContext(
    'function scaledExamScore(c, t) { return t > 0 ? Math.round(100 + (c / t) * 800) : 100; }\n'
    + _fnBody(rd, 'getBookItChecklist') + '\n' + _fnBody(ih, '_iosWhyModel') + '\n' + _fnBody(ih, '_iosWhyHtml'), ctx);
  const B = (r, h, now) => { ctx.__r = r; ctx.__h = h; ctx.__n = now || NOW; return vm.runInContext('getBookItChecklist(__r, __h, __n)', ctx); };

  const good = { lowerBound: 720, passAccuracy: 78, domainAccuracy: { a: 80, b: 78 } };
  const vol = (n) => ({ topic: 'T', mode: 'quiz', date: new Date(NOW - DAY).toISOString(), score: 1, total: n, byDiff: { E: [0, n - 1], H: [0, 1], F: [0, 50] } });
  const mock = (daysAgo, score) => ({ topic: 'Exam Simulation', mode: 'exam', date: new Date(NOW - daysAgo * DAY).toISOString(), score, total: 90, pct: Math.round(score / 90 * 100) });
  const pass2 = [mock(1, 70), mock(5, 72)];

  test('Book-it: range is met at 720 and unmet at 719', B(good, []).items[0].met === true && B({ ...good, lowerBound: 719 }, []).items[0].met === false);
  test('Book-it: volume counts exam-level and harder only, 299 fails and 300 passes (Foundational does not count)',
    B(good, [vol(299)]).items[1].met === false && B(good, [vol(300)]).items[1].met === true && B(good, [vol(300)]).items[1].detail === '300 so far');
  test('Book-it: volume sums across rows', B(good, [vol(150), vol(150)]).items[1].met === true);
  test('Book-it: areas needs every domain at the pass line, one short fails',
    B(good, []).items[2].met === true && B({ ...good, domainAccuracy: { a: 90, b: 77 } }, []).items[2].met === false);
  test('Book-it: areas detail names the weakest domain and its percentage',
    B({ ...good, domainAccuracy: { a: 90, b: 62 } }, []).items[2].detail === 'Bravo is at 62%');
  test('Book-it: mocks needs two passing full exams, one fails, two pass',
    B(good, [mock(1, 70)]).items[3].met === false && B(good, pass2).items[3].met === true);
  test('Book-it: a failing mock does not count (68/90 scores 707)', B(good, [mock(1, 70), mock(2, 68)]).items[3].met === false);
  test('Book-it: mocks window is 14 days: day 14 counts, day 15 does not',
    B(good, [mock(1, 70), mock(14, 72)]).items[3].met === true && B(good, [mock(1, 70), mock(15, 72)]).items[3].met === false);
  test('Book-it: only full exam summary rows count as mocks (a quiz or a split row does not)',
    B(good, [mock(1, 70), { ...mock(2, 72), topic: 'Network Security' }, { ...mock(3, 72), mode: 'quiz' }]).items[3].met === false);
  test('Book-it: mocks detail reads "1 so far, scored 688"-style', B(good, [mock(1, 70)]).items[3].detail === '1 so far, scored 722');
  const all = B(good, [vol(300), ...pass2]);
  test('Book-it: ready only when all four hold, 4 of 4', all.ready === true && all.met === 4 && all.total === 4);
  test('Book-it: three of four is not ready', B(good, [vol(300)]).ready === false && B(good, [vol(300)]).met === 3);
  test('Book-it: next sits on exactly one item, the first unmet one that has a next step',
    (() => { const b = B(good, [vol(300), mock(1, 70)]); return b.items.filter((i) => i.next).length === 1 && !!b.items[3].next; })());
  test('Book-it: range unmet plus mocks unmet still puts the button on mocks',
    (() => { const b = B({ ...good, lowerBound: 500 }, [vol(300)]); return !b.items[0].next && b.items[3].next && b.items[3].next.label === 'Start a full exam'; })());
  test('Book-it: mocks next is "Start a full exam"', B(good, [vol(300)]).items[3].next.label === 'Start a full exam');
  test('Book-it: areas next is "Practise {weakest domain}"',
    B({ ...good, domainAccuracy: { a: 90, b: 62 } }, [vol(300)]).items[2].next.label === 'Practise Bravo');
  test('Book-it: volume next is "Start an exam-level set"', B(good, []).items[1].next.label === 'Start an exam-level set');
  test('Book-it: range unmet carries no next step itself', B({ ...good, lowerBound: 500 }, []).items[0].next === undefined);
  test('Book-it: all four met carries no next', B(good, [vol(300), ...pass2]).items.every((i) => !i.next));

  // examReady comes from the checklist; the formula is untouched
  test('Readiness: examReady is the checklist result',
    /const examReady = getBookItChecklist\(\{ lowerBound, domainAccuracy, passAccuracy \}, loadHistory\(\)\)\.ready/.test(rd));
  test('Readiness: the score still comes from the same prediction line (#139 untouched)',
    /const predicted = Math\.round\(EXAM_MIN_SCORE \+ expectedAcc \* _range\)/.test(rd));
  test('Home: tier "Exam ready" only at 4 of 4, "Pass level" above the pass mark otherwise',
    /var ready = bi \? bi\.ready : !!r\.examReady;/.test(ih) && /ready \? 'Exam ready' : \(r\.predicted >= pass \? 'Pass level'/.test(ih));

  test('Why sheet: the exam-level set uses the ungated focused preset', /applyPreset\('focused'\)/.test(ih) && !/applyPreset\('grind'\)/.test(_fnBody(ih, '_openWhy')));
  const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  test('Desktop stamp: scored above the line but not book-ready reads "Pass level" (no more "Not book-ready yet")',
    appSrc.includes("'Pass level'") && !appSrc.includes('Not book-ready yet') && !appSrc.includes('Recent accuracy below pass'));

  // the sheet
  const r = { predicted: 553, lowerBound: 505, upperBound: 600, passProbability: 0.08, totalQs: 1240, studiedCount: 41, totalTopics: 50,
    passAccuracy: 78, domainAccuracy: { a: 81, b: 62 } };
  const hist = [vol(300), mock(9, 69)];
  ctx.__r = r; ctx.__h = hist; ctx.__b = B(r, hist);
  const m = vm.runInContext('_iosWhyModel(__r, __h, __b, new Date())', ctx);
  const html = vm.runInContext('_iosWhyHtml(__m)', Object.assign(ctx, { __m: m }));
  test('Why sheet: title "Why 553?" and the lede with range, chance and evidence',
    m.title === 'Why 553?' && m.lede.bold === '553, likely between 505 and 600.' && m.lede.rest === ' Pass chance 8%. Based on 1,240 answers across 41 of 50 topics.');
  test('Why sheet: verdict "Not yet · N of 4" counts the met items', /^Not yet · \d of 4$/.test(m.verdict));
  test('Why sheet: verdict reads "Ready to book · 4 of 4" when ready',
    (() => { ctx.__b = B(good, [vol(300), ...pass2]); return vm.runInContext('_iosWhyModel(__r, __h, __b, new Date())', ctx).verdict === 'Ready to book · 4 of 4'; })());
  test('Why sheet: exam areas carry weight and accuracy, weakest marked',
    m.areas.length === 2 && m.areas[0].weightPct === 60 && m.areas[0].accPct === 81 && !m.areas[0].weak && m.areas[1].weak === true);
  test('Why sheet: "How hard" share and last full exam line',
    /^\d+% of your answers were exam-level or hard\.$/.test(m.hardLine) && /^\d+ on 22 Oct$/.test(m.lastLine));
  test('Why sheet: no exam yet reads "None yet"', (() => { ctx.__h = [vol(10)]; return vm.runInContext('_iosWhyModel(__r, __h, __b, new Date())', ctx).lastLine === 'None yet'; })());
  const rA = { ...r, lowerBound: 720, upperBound: 780 };
  Object.assign(ctx, { __r: rA, __h: [vol(300)], __b: B(rA, [vol(300)]) });
  const html2 = vm.runInContext('_iosWhyHtml(_iosWhyModel(__r, __h, __b, new Date()))', ctx);
  test('Why sheet: html has the next-step button and the how-it-works line',
    html2.includes('data-act="why-areas"') && html2.includes('data-key="b"') && html2.includes('Practise Bravo') && html.includes("count topics you haven't studied as 40%"));
  test('Why sheet: no em dashes in the sheet code or CSS', !/—/.test(_fnBody(ih, '_iosWhyModel') + _fnBody(ih, '_iosWhyHtml')));
  test('Home: the readiness card opens the sheet through iosSettings.openSheet',
    /readiness: function \(\) \{ _openWhy\(\); \}/.test(ih) && /iosSettings\.openSheet\(_iosWhyHtml/.test(ih));
})();
