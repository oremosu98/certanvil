// tests/uat/525-forecast-pbq.js
// Scope: persona bundle Task 10. The forecast projects to the exam date and can go down; the PBQ note.
// Spec: docs/superpowers/specs/2026-10-30-reminders-forecast-pbq-design.md sections 2-3
const fs = require('fs');
const path = require('path');
const { _fnBody, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Honest forecast and the PBQ note ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const rd = fs.readFileSync(path.join(ROOT, 'features', 'readiness.js'), 'utf8');
  const ex = fs.readFileSync(path.join(ROOT, 'features', 'exam.js'), 'utf8');
  const an = fs.readFileSync(path.join(ROOT, 'features', 'analytics.js'), 'utf8');
  const ia = fs.readFileSync(path.join(ROOT, 'features', 'ios-analytics.js'), 'utf8');
  const DAY = 86400000, NOW = Date.UTC(2026, 9, 31, 12, 0, 0);

  const ctx = vm.createContext({ Math, Date, Object, Array, String, Number, isNaN, EXAM_PASS_SCORE: 720, EXAM_MIN_SCORE: 100, EXAM_MAX_SCORE: 900,
    EXAM_TOPIC: 'Exam Simulation', READINESS_BAND: [420, 870],
    window: { _localDay: (d) => d.toISOString().slice(0, 10), _SL_SEED_FILES: { secplus: 'x' }, CURRENT_CERT: 'secplus' } });
  vm.runInContext('function scaledExamScore(c, t) { return t > 0 ? Math.round(100 + (c / t) * 800) : 100; }\n'
    + _fnBody(rd, 'getReadinessPace') + '\n' + _fnBody(rd, 'examHasPbqs') + '\n' + _fnBody(rd, 'getPbqNote'), ctx);
  const P = (hist, r, days, date) => { ctx.__h = hist; ctx.__r = r; ctx.__d = days; ctx.__e = date; return vm.runInContext('getReadinessPace(' + NOW + ', { hist: __h, r: __r, daysToExam: __d, examDate: __e })', ctx); };
  // one row a day for 7 days, accuracy moving by `step` points of percent a day
  const rows = (start, step, n) => Array.from({ length: n || 7 }, (_, i) => ({ date: new Date(NOW - ((n || 7) - 1 - i) * DAY).toISOString(), topic: 'T', score: Math.round(start + step * i), total: 100, mode: 'quiz' }));
  const R = { predicted: 600, ciHalfWidth: 45 };

  const up = P(rows(50, 2), R, 14, '2026-11-14');
  test('Pace: a rising history reads a positive weekly slope (2 pts of 100 a day = 112 scaled points a week)', up && up.pointsPerWeek > 100 && up.pointsPerWeek < 125);
  test('Pace: projected is clamped to the cert band', P(rows(50, 2), R, 60, '2026-12-30').projected === 870 && up.projected > 800 && up.projected < 870);
  const mid = P(rows(60, 0.5), R, 14, '2026-11-14');
  test('Pace: a gentle climb projects from the score by the weeks left (two weeks ahead)', mid && mid.projected === Math.round(600 + mid.pointsPerWeek * 2) && mid.projected > 600);
  test('Pace: the range is the score\'s confidence half-width either side', mid && mid.low === mid.projected - 45 && mid.high === mid.projected + 45);
  const dn = P(rows(80, -1), R, 14, '2026-11-14');
  test('Pace: a falling history has a negative slope and NO max with today: it projects below today', dn && dn.pointsPerWeek < 0 && dn.projected < 600);
  test('Pace: short is true when the projection is under the pass mark, false at or over it', dn && dn.short === true && up.short === false);
  test('Pace: under 5 summary rows is null', P(rows(50, 2, 4), R, 14, '2026-11-14') === null);
  test('Pace: no exam date is null', P(rows(50, 2), R, null, null) === null);
  test('Pace: rows older than 14 local days are ignored (5 recent + old rows still reads the recent ones)',
    P(rows(50, 2, 4).concat([{ date: new Date(NOW - 20 * DAY).toISOString(), topic: 'T', score: 90, total: 100, mode: 'quiz' }]), R, 14, '2026-11-14') === null);
  test('Pace: an exam in the past is null', P(rows(50, 2), R, -1, '2026-10-01') === null);
  test('Pace: exam day is today projects from today\'s score only', (function () { var p = P(rows(50, 2), R, 0, '2026-10-31'); return p && p.projected === 600; })());
  test('Pace: getReadinessPace has no max(predicted, trend) and analytics.js no longer takes one',
    !/Math\.max\(predicted, projScaled\)/.test(an) && /getReadinessPace\(/.test(an));

  // ── PBQ persisted ──
  test('Exam: the summary history row carries pbq {right, count}, right = fully right', /pbqRight\+\+/.test(ex) && /pbq: pbqCount \? \{ right: pbqRight, count: pbqCount \}/.test(ex));

  // ── PBQ note ──
  const exam = (daysAgo, right, count) => ({ date: new Date(NOW - daysAgo * DAY).toISOString(), topic: 'Exam Simulation', mode: 'exam', score: 60, total: 90, pbq: count ? { right, count } : undefined });
  const N = (h, has) => { ctx.__h = h; ctx.__x = has; return vm.runInContext('getPbqNote(__h, __x)', ctx); };
  const three = N([exam(1, 2, 4), exam(5, 3, 4), exam(9, 1, 1), exam(30, 4, 4)], true);
  test('PBQ note: sums the last 3 exam rows (newest first)', three.n === 3 && three.right === 6 && three.count === 9);
  test('PBQ note: rows without a PBQ tally are skipped', N([exam(1, 0, 0), exam(2, 3, 4)], true).n === 1);
  test('PBQ note: no exams is n 0', N([], true).n === 0);
  test('PBQ note: hidden (null) on a cert without PBQs', N([exam(1, 2, 4)], false) === null);
  test('PBQ note: a cert has PBQs only if it has a Sim Lab seed bank (same source as the exam builder)',
    vm.runInContext('examHasPbqs("secplus")', ctx) === true && vm.runInContext('examHasPbqs("az900")', ctx) === false);
  const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const seedKeys = (/_SL_SEED_FILES = \{([^}]*)\}/.exec(appSrc) || [0, ''])[1].match(/'?([a-z0-9-]+)'?\s*:/g).map(k => k.replace(/['\s:]/g, ''));
  test('PBQ note: the cert list matches the Sim Lab seed banks in app.js', seedKeys.length >= 4 && seedKeys.every(k => vm.runInContext('examHasPbqs("' + k + '")', ctx)));

  // ── Copy on the phone ──
  const cx = vm.createContext({ Math, String, Array, Object, JSON, Date, isFinite, Number });
  vm.runInContext(_fnBody(ia, '_iosAnalyticsHtml') || '', cx);
  const base = { predicted: 600, passScore: 720, maxScore: 900, forecast: 600, tier: 'Building', pointsToPass: 120, barPct: 50, passTickPct: 80, stats: {}, spark: {} };
  vm.runInContext(_fnBody(ia, '_iosAnalyticsModel'), cx);
  const D0 = { passTrend: { passAcc: 72, yMin: 40, yMax: 100, data: { week: [], month: [], all: [] } }, difficulty: [], examVsQuiz: null, whyScore: {}, wrongPatterns: [], streak: { week: [] },
    heatmap: [], milestones: { unlocked: 0, total: 0, recent: [], locked: [] }, domains: [{ idx: 1, name: 'A', accuracy: 80, questions: 4, weight: 23 }], examHistory: [] };
  const MAP = { rows: [], weakest: [], studied: 0, total: 0, mastered: 0 };
  const H = (r) => { cx.__d = Object.assign({}, D0, { readiness: r }); cx.__map = MAP; try { return vm.runInContext('_iosAnalyticsHtml(_iosAnalyticsModel(__d, __map, null), { mark: "S+", name: "Security+", code: "SY0-701" })', cx); } catch (e) { return 'ERR ' + e.message; } };
  const pace = (ppw, proj, short) => ({ pointsPerWeek: ppw, projected: proj, low: proj - 45, high: proj + 45, examDate: '2026-12-03', daysToExam: 33, short });
  const onp = H({ ...base, daysToExam: 33, pace: pace(40, 745, false) });
  test('Copy, on pace: up about 40 points a week, around 745 on 3 Dec, over the 720 pass mark',
    onp.includes('Up about <b>40 points a week</b>. On this pace you\'d be around <b>745 on 3 Dec</b>, over the 720 pass mark.'));
  test('Copy, tile: "Forecast for 3 Dec", 745, "likely 700 to 790"', onp.includes('Forecast for 3 Dec') && onp.includes('<span class="in-fv">745</span>') && onp.includes('likely 700 to 790'));
  test('Copy, short: "short of the 720 pass mark. Study more each week, or move the date."',
    H({ ...base, daysToExam: 18, pace: pace(40, 655, true) }).includes('At this pace you\'d be around <b>655 on 3 Dec</b>, short of the 720 pass mark. Study more each week, or move the date.'));
  const falling = H({ ...base, daysToExam: 33, pace: pace(-10, 505, true) });
  test('Copy, falling: "Down about 10 points a week lately. On this pace ... A few short sets a week turns it round."',
    falling.includes('Down about <b>10 points a week</b> lately. On this pace you\'d be around <b>505 on 3 Dec</b>. A few short sets a week turns it round.'));
  const nod = H({ ...base, daysToExam: null, pace: null });
  test('Copy, no date: "Set your exam date to see where you\'ll be on the day." and a dim "Set a date" tile',
    nod.includes('<b>120 points</b> to the pass mark. Set your exam date to see where you\'ll be on the day.') && nod.includes('Set a date'));
  test('Copy: "Hold your pace and you\'ll cross it" is gone', !/Hold your pace/.test(onp + falling + nod));
  const pb = H({ ...base, daysToExam: 33, pace: pace(40, 745, false), pbqNote: { n: 3, right: 6, count: 9 } });
  test('Copy, PBQ note: "Readiness counts multiple-choice only. PBQs: 6 of 9 fully right in your last 3 full exams."',
    pb.includes('Readiness counts multiple-choice only. <b>PBQs: 6 of 9 fully right</b> in your last 3 full exams.'));
  test('Copy, PBQ note with no exams: "Take a full exam to practise PBQs too."',
    H({ ...base, daysToExam: 33, pace: null, pbqNote: { n: 0, right: 0, count: 0 } }).includes('<b>Take a full exam</b> to practise PBQs too.'));
  test('Copy, PBQ note hidden on a cert without PBQs', !H({ ...base, daysToExam: 33, pace: null, pbqNote: null }).includes('Readiness counts multiple-choice only'));
  test('Copy: no em dashes in the forecast strings', !/—/.test(onp + falling + nod + pb));
})();
