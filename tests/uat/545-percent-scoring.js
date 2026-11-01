// tests/uat/545-percent-scoring.js
// Scope: cert-registry Part 1, Task 1.6. Every score reader handles scale.format === 'percent' (PRINCE2 pass 60, Scrum
// PSM I / II pass 85): the predicted score is weighted accuracy 0-100, shown '72%', with the pass line at scale.pass. Scaled
// certs are unchanged (540 snapshot and the older UATs hold that). Also the known bug: the readiness min was
// `examMinScore || 100`, which turned a percent cert's real min of 0 into 100 and collapsed the band (NaN, -Infinity pass %).
// No percent cert exists in the registry yet, so a fake {min:0, max:100, pass:60, format:'percent'} entry goes in through
// the test-only _add. Real source is cut out of each file and run in a vm, so a reader that still hard-codes 900 cannot pass.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Percent scoring: every score reader ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const src = {};
  ['features/readiness.js', 'features/exam.js', 'features/ios-hub.js', 'features/ios-exam.js', 'features/ios-firstrun.js', 'features/ios-log-result.js',
    'features/ios-home.js', 'features/ios-analytics.js', 'features/analytics.js', 'features/diagnostic.js', 'features/home.js', 'features/quiz-engine.js',
    'features/ios-tour.js', 'features/settings.js', 'lib/onboarding-firstrun.js', 'lib/onboarding-home.js', 'app.js'].forEach((f) => { src[f] = read(f); });

  function braced(s, start, what) {
    const open = start < 0 ? -1 : s.indexOf('{', start);
    if (open < 0) throw new Error('545: ' + what + ' not found');
    let depth = 1, i = open + 1;
    while (i < s.length && depth > 0) { if (s[i] === '{') depth++; else if (s[i] === '}') depth--; i++; }
    return s.slice(start, i);
  }
  function fn(file, name) {
    const m = new RegExp('function\\s+' + name + '\\s*\\(').exec(src[file]);
    if (!m) throw new Error('545: function ' + name + ' not found in ' + file);
    return braced(src[file], m.index, name + ' in ' + file);
  }
  function between(file, from, to) {
    const i = src[file].indexOf(from), j = src[file].indexOf(to, i);
    if (i < 0 || j < 0) throw new Error('545: slice ' + from + ' .. ' + to + ' not found in ' + file);
    return src[file].slice(i, src[file].indexOf('\n', j));
  }
  function sandbox(extra) {
    const sb = Object.assign({ Math, Date, Object, Array, String, Number, JSON, isFinite, isNaN, Infinity, window: {} }, extra || {});
    sb.window.window = sb.window;
    vm.createContext(sb);
    return sb;
  }

  // The real registry, plus a fake percent cert.
  const regCtx = sandbox();
  vm.runInContext(read('lib/cert-registry.js'), regCtx);
  const R = regCtx.window.CertRegistry;
  R._add({ id: 'pctcert', name: 'Fake Percent Cert', scale: { min: 0, max: 100, pass: 60, format: 'percent' } });

  // ── 1. The registry: examScale and formatScore ──
  const sc = R.examScale('pctcert', { examPassScore: 720, examMaxScore: 900 });
  test('545 registry: examScale of a percent cert is the registry scale (meta never overrides it)',
    sc.min === 0 && sc.max === 100 && sc.pass === 60 && sc.format === 'percent');
  const net = R.examScale('netplus', {});
  test('545 registry: examScale of a scaled cert is unchanged (Network+ 100/900/720)', net.min === 100 && net.max === 900 && net.pass === 720 && net.format === 'scaled');
  const unk = R.examScale('nope', { examMinScore: 1, examMaxScore: 1000, examPassScore: 700 });
  test('545 registry: an unknown id falls back to the pack meta, then to CompTIA defaults, and never throws',
    unk.min === 1 && unk.max === 1000 && unk.pass === 700 && unk.format === 'scaled'
    && (() => { const d = R.examScale('nope'); return d.min === 100 && d.max === 900 && d.pass === 720; })()
    && (() => { try { R.examScale(undefined, null); return true; } catch (e) { return false; } })());
  test('545 registry: formatScore percent 72 reads 72%, scaled 684 reads 684',
    R.formatScore('pctcert', 72) === '72%' && R.formatScore('pctcert', 71.6) === '72%' && R.formatScore('netplus', 684) === '684');
  test('545 registry: formatScore with no score reads -- in both formats (never NaN, never 0%)',
    ['pctcert', 'netplus'].every((id) => [null, undefined, NaN, 'x'].every((n) => R.formatScore(id, n) === '--')));

  // ── 2. readiness.js: the scale, the band, the helpers (the real block, run in a vm) ──
  const scaleBlock = between('features/readiness.js', 'const EXAM_MIN_SCORE', 'function examScoreRangeText');
  const probe = ' this.out = { min: EXAM_MIN_SCORE, fmt: EXAM_SCORE_FORMAT, band: READINESS_BAND, r72: readinessFromRaw(72), r0: readinessFromRaw(0), r100: readinessFromRaw(100),'
    + ' barPass: readinessBarPct(EXAM_PASS_SCORE), ex: scaledExamScore(36, 50), ex0: scaledExamScore(0, 0), f72: formatExamScore(72), fNull: formatExamScore(null),'
    + ' fNaN: formatExamScore(NaN), fInf: formatExamScore(Infinity), of: examScoreOf(), pass: examPassText(), none: NO_SCORE, strip: readinessStrip(72), range: examScoreRangeText() };';
  function run(extra) {
    const sb = sandbox(Object.assign({ CERT_PACK: { meta: {} } }, extra));
    vm.runInContext(scaleBlock + probe, sb);
    return sb.out;
  }
  const pct = run({ CertRegistry: R, CURRENT_CERT: 'pctcert', EXAM_MAX_SCORE: 100, EXAM_PASS_SCORE: 60 });
  test('545 readiness: a percent cert reads min 0 from the registry (not 100) and the band is the whole 0-100 scale',
    pct.min === 0 && pct.fmt === 'percent' && pct.band[0] === 0 && pct.band[1] === 100);
  test('545 readiness: percent predicted === weighted accuracy (raw 72 -> 72, 0 -> 0, 100 -> 100; 36 of 50 right -> 72)',
    pct.r72 === 72 && pct.r0 === 0 && pct.r100 === 100 && pct.ex === 72 && pct.ex0 === 0);
  test('545 readiness: the pass line sits at its own place on the bar (60 -> 60%), no NaN or Infinity',
    pct.barPass === 60 && isFinite(pct.barPass));
  test('545 readiness: percent display helpers read 72%, 60%, no "/ 100" tail, and -- for no score (including NaN and Infinity)',
    pct.f72 === '72%' && pct.pass === '60%' && pct.of === '' && pct.fNull === '--' && pct.fNaN === '--' && pct.fInf === '--'
    && pct.strip === '72%' && pct.range === 'as a percentage' && pct.none === '--');
  const sca = run({ CertRegistry: R, CURRENT_CERT: 'netplus', EXAM_MAX_SCORE: 900, EXAM_PASS_SCORE: 720 });
  test('545 readiness: a scaled cert is untouched (Network+ band 420-870, 645 at raw 50, "684", "/ 900", "--" placeholder)',
    sca.min === 100 && sca.fmt === 'scaled' && sca.band[0] === 420 && sca.band[1] === 870 && sca.r72 === 744 && sca.f72 === '72' && sca.of === '/ 900'
    && sca.pass === '720' && sca.none === '--' && sca.strip === '72/900' && sca.range === '100-900' && sca.fNull === '--');
  const az = run({ CertRegistry: R, CURRENT_CERT: 'az900', EXAM_MAX_SCORE: 1000, EXAM_PASS_SCORE: 700 });
  test('545 readiness: a Microsoft cert keeps min 1 and its own relative band', az.min === 1 && az.fmt === 'scaled' && az.band[1] <= 1000 && az.band[0] >= 1);
  // Step 4b: the `examMinScore || 100` bug. No registry here, so this is the pack-meta path: a real 0 must survive.
  const metaZero = run({ CERT_PACK: { meta: { examMinScore: 0 } }, EXAM_MAX_SCORE: 100, EXAM_PASS_SCORE: 60 });
  test('545 readiness: a pack meta with examMinScore 0 keeps 0 (typeof check, not `|| 100`); no registry needed',
    metaZero.min === 0 && metaZero.fmt === 'scaled' && metaZero.band.every((n) => isFinite(n)) && metaZero.band[1] > metaZero.band[0]);
  test('545 readiness: the CompTIA packs (no examMinScore) still fall back to 100 with no registry',
    run({ EXAM_MAX_SCORE: 900, EXAM_PASS_SCORE: 720 }).min === 100);
  test('545 readiness: the old `examMinScore || 100` is gone', !/examMinScore\)? \|\| 100/.test(src['features/readiness.js']));

  // The readiness maths with a percent cert: predicted, pass accuracy, the band and the pass probability are all finite.
  const mathBlock = between('features/readiness.js', 'const _range = EXAM_MAX_SCORE - EXAM_MIN_SCORE;', 'const passAccuracy')
    + '\n' + between('features/readiness.js', 'const sampleWidth = 60', 'const passProbability');
  function maths(extra, acc) {
    const sb = sandbox(Object.assign({ CERT_PACK: { meta: {} }, totalQs: 120, studiedCount: 20, totalTopics: 40, recencyScore: 60, EXAM_QUESTION_COUNT: 60, expectedAcc: acc }, extra));
    vm.runInContext(scaleBlock + '\n' + mathBlock + '\nthis.out = { predicted, passAccuracy, ciHalfWidth, lowerBound, upperBound, sigma, passProbability, raw };', sb);
    return sb.out;
  }
  const pm = maths({ CertRegistry: R, CURRENT_CERT: 'pctcert', EXAM_MAX_SCORE: 100, EXAM_PASS_SCORE: 60 }, 0.72);
  test('545 readiness: percent predicted is the weighted accuracy (0.72 -> 72) and the pass accuracy is the pass line (60)',
    pm.predicted === 72 && pm.passAccuracy === 60 && pm.raw > 71.99 && pm.raw < 72.01);
  test('545 readiness: percent band, confidence range and pass probability are all finite, inside 0-100, with no NaN',
    [pm.ciHalfWidth, pm.lowerBound, pm.upperBound, pm.sigma, pm.passProbability].every((n) => typeof n === 'number' && isFinite(n))
    && pm.lowerBound >= 0 && pm.upperBound <= 100 && pm.lowerBound <= pm.predicted && pm.upperBound >= pm.predicted && pm.passProbability > 0 && pm.passProbability < 1);
  const pmEdge = [0, 1].map((a) => maths({ CertRegistry: R, CURRENT_CERT: 'pctcert', EXAM_MAX_SCORE: 100, EXAM_PASS_SCORE: 60 }, a));
  test('545 readiness: at 0% and 100% accuracy a percent cert stays finite (predicted 0 and 100)',
    pmEdge[0].predicted === 0 && pmEdge[1].predicted === 100 && pmEdge.every((o) => isFinite(o.passProbability) && isFinite(o.ciHalfWidth)));
  const sm = maths({ CertRegistry: R, CURRENT_CERT: 'netplus', EXAM_MAX_SCORE: 900, EXAM_PASS_SCORE: 720 }, 0.72);
  test('545 readiness: the scaled maths is unchanged (Network+ 0.72 -> 100 + 0.72 * 800 = 676, pass accuracy 78)', sm.predicted === 676 && sm.passAccuracy === 78);

  // Step 4b, exam.js: the pass percentage in the results message.
  const passPctLine = between('features/exam.js', 'const _passPct', 'const _passPct');
  function passPct(min, max, pass) {
    const sb = sandbox({ EXAM_MIN_SCORE: min, EXAM_MAX_SCORE: max, EXAM_PASS_SCORE: pass });
    vm.runInContext(passPctLine + '\nthis.out = _passPct;', sb);
    return sb.out;
  }
  test('545 exam: the pass percentage is finite for a percent cert (60) and unchanged for a scaled one (Network+ 78)',
    passPct(0, 100, 60) === 60 && passPct(100, 900, 720) === 78 && passPct(1, 1000, 700) === 70);
  test('545 exam: a zero-width band can never give NaN or -Infinity (the old `|| 100` collapse)', Number.isFinite(passPct(100, 100, 60)));

  // ── 3. Readers, one by one ──
  // readiness.js: book-it labels and the forecast copy
  const fmtCtx = (fmt) => ({ EXAM_PASS_SCORE: 60, EXAM_SCORE_FORMAT: fmt, EXAM_TOPIC: 'Exam Simulation', MIXED_TOPIC: 'Mixed', DOMAIN_LABELS: {},
    formatExamScore: (n) => (typeof n !== 'number' || n !== n ? '--' : fmt === 'percent' ? Math.round(n) + '%' : String(Math.round(n))) });
  const bk = sandbox(fmtCtx('percent'));
  vm.runInContext('function scaledExamScore(c, t) { return t > 0 ? Math.round((c / t) * 100) : 0; }\n' + fn('features/readiness.js', 'getBookItChecklist') + '\n' + fn('features/readiness.js', 'getBookItNextStep'), bk);
  bk.__r = { lowerBound: 52, passAccuracy: 60, domainAccuracy: {} }; bk.__n = Date.UTC(2026, 9, 31);
  const chk = vm.runInContext('getBookItChecklist(__r, [], __n)', bk);
  bk.__c = chk;
  test('545 book-it: a percent cert reads "Score clears 60%", "Low end is 52% today" and "Lift your low end above 60%"',
    chk.items[0].label === 'Score clears 60%, even at the low end' && chk.items[0].detail === 'Low end is 52% today'
    && vm.runInContext('getBookItNextStep(__c)', bk) === 'Lift your low end above 60%');
  const fc = sandbox(fmtCtx('percent'));
  vm.runInContext(fn('features/readiness.js', 'getForecastCopy'), fc);
  fc.__r = { pace: { pointsPerWeek: 3, projected: 74, low: 68, high: 80, examDate: '2026-12-01', short: false }, daysToExam: 30, pointsToPass: 0, passScore: 60 };
  const fcp = vm.runInContext('getForecastCopy(__r)', fc);
  test('545 forecast: a percent cert reads "around 74% on 1 Dec", "over the 60% pass mark", value 74%, range "likely 68% to 80%"',
    /around <b>74% on 1 Dec<\/b>/.test(fcp.line) && /over the 60% pass mark/.test(fcp.line) && fcp.value === '74%' && fcp.range === 'likely 68% to 80%');
  const fcS = sandbox({});
  vm.runInContext(fn('features/readiness.js', 'getForecastCopy'), fcS);
  fcS.__r = { pace: { pointsPerWeek: 3, projected: 744, low: 700, high: 790, examDate: '2026-12-01', short: false }, daysToExam: 30, pointsToPass: 0, passScore: 720 };
  const fcpS = vm.runInContext('getForecastCopy(__r)', fcS);
  test('545 forecast: a scaled cert is unchanged (numbers stay numbers, "over the 720 pass mark")', fcpS.value === 744 && /over the 720 pass mark/.test(fcpS.line) && fcpS.range === 'likely 700 to 790');

  // The hub / My certs: "72% · pass 60%" for a percent cert, "684 / 900" for a scaled one
  const hubCtx = sandbox({});
  vm.runInContext(read('lib/cert-registry.js'), hubCtx);
  hubCtx.window.CertRegistry._add({ id: 'pctcert', name: 'Fake Percent Cert', scale: { min: 0, max: 100, pass: 60, format: 'percent' } });
  vm.runInContext('var HUB_DAY = 86400000; var HUB_STALE_DAYS = 14;\nfunction _esc(s) { return String(s == null ? "" : s); }\n'
    + ['_hubFmt', '_hubRight', '_hubMax', '_hubFirstName', '_hubShort', '_hubDays', '_hubAgeDays', '_hubExamLine', '_iosHubModel'].map((n) => fn('features/ios-hub.js', n)).join('\n'), hubCtx);
  const NOW = new Date(2026, 9, 31, 12, 0, 0), ago = (d) => new Date(NOW.getTime() - d * 86400000).toISOString();
  hubCtx.__o = { certs: [{ id: 'netplus', name: 'Network+', code: 'N10-009', glyph: 'N+' }, { id: 'pctcert', name: 'Fake Percent Cert', code: 'PC-1', glyph: 'PC' }, { id: 'secplus', name: 'Security+', code: 'SY0-701', glyph: 'S+' }],
    snaps: { pctcert: { score: 72, computed_at: ago(1) }, secplus: { score: 684, computed_at: ago(1) }, netplus: { score: 600, computed_at: ago(1) } },
    dates: {}, outcomes: { }, current: 'netplus', pro: true, now: NOW, streak: 1 };
  const hm = vm.runInContext('_iosHubModel(__o)', hubCtx);
  const hp = hm.studying.find((r) => r.id === 'pctcert'), hs = hm.studying.find((r) => r.id === 'secplus');
  hubCtx.__p = hp; hubCtx.__s = hs;
  test('545 hub: a percent cert row carries fmt percent, its pass line and reads "72% · pass 60%"',
    hp.fmt === 'percent' && hp.pass === 60 && vm.runInContext('_hubRight(__p)', hubCtx) === '<b>72%</b> · pass 60%');
  test('545 hub: a scaled row keeps "684 / 900" exactly', hs.fmt === 'scaled' && vm.runInContext('_hubRight(__s)', hubCtx) === '<b>684</b> / 900');
  hubCtx.__o.outcomes = { pctcert: { outcome: 'passed', score: 85, date: '2026-10-01' } };
  const hm2 = vm.runInContext('_iosHubModel(__o)', hubCtx);
  test('545 hub: a passed percent cert reads "Scored 85%"; no score logged is unchanged',
    hm2.passed.find((r) => r.id === 'pctcert').sub === 'Scored 85%' && hm2.passed.find((r) => r.id === 'pctcert').scored === 85);
  hubCtx.__o.current = 'pctcert';
  const hm3 = vm.runInContext('_iosHubModel(__o)', hubCtx);
  test('545 hub: the active percent cert has min 0 / max 100 / pass 60 on its card and the Free readiness stat knows its format',
    hm3.active.fmt === 'percent' && hm3.active.max === 100 && hm3.active.pass === 60 && hm3.stats.readinessFmt === 'percent' && hm3.stats.readiness === 72
    && vm.runInContext('_hubFmt(__p, 72)', hubCtx) === '72%');
  // ios-firstrun: the score reveal
  const frCtx = sandbox({});
  vm.runInContext(read('lib/cert-registry.js'), frCtx);
  frCtx.window.CertRegistry._add({ id: 'pctcert', name: 'x', scale: { min: 0, max: 100, pass: 60, format: 'percent' } });
  vm.runInContext(fn('features/ios-firstrun.js', '_ifrScale') + '\n' + fn('features/ios-firstrun.js', '_ifrScoreHtml') + '\n' + fn('features/ios-firstrun.js', '_ifrDay0Html'), frCtx);
  frCtx.CURRENT_CERT = 'pctcert';
  frCtx.__s = vm.runInContext('_ifrScale({ examPassScore: 720, examMaxScore: 900 })', frCtx);
  test('545 first-run: the scale comes from the registry when the cert is known (percent: 0 / 100 / 60), else the pack meta',
    frCtx.__s.min === 0 && frCtx.__s.max === 100 && frCtx.__s.pass === 60 && frCtx.__s.format === 'percent'
    && (() => { const c = sandbox({}); vm.runInContext(fn('features/ios-firstrun.js', '_ifrScale'), c); const o = vm.runInContext('_ifrScale({ examPassScore: 700, examMaxScore: 1000, examMinScore: 1 })', c); return o.min === 1 && o.max === 1000 && o.pass === 700; })());
  frCtx.__m = { score: 72, scale: frCtx.__s, cert: { glyph: 'PC', name: 'Fake', code: 'PC-1' }, pro: true };
  const frH = vm.runInContext('_ifrScoreHtml(__m)', frCtx);
  test('545 first-run: the percent score card reads 72%, "readiness" with no "/ 100", and Pass 60% on a 0% to 100% legend',
    />72%<\/span><span class="ifr-ac-of">readiness</.test(frH) && /<span>0%<\/span><span class="p">Pass 60%<\/span><span>100%<\/span>/.test(frH) && !/\/ 100/.test(frH));
  frCtx.__m = { score: 684, scale: { min: 100, max: 900, pass: 720 }, cert: { glyph: 'N+', name: 'Net', code: 'N10-009' }, pro: true };
  const frS = vm.runInContext('_ifrScoreHtml(__m)', frCtx);
  test('545 first-run: the scaled score card is unchanged ("684", "/ 900 readiness", Pass 720)', />684<\/span><span class="ifr-ac-of">\/ 900 readiness</.test(frS) && /Pass 720<\/span><span>900<\/span>/.test(frS));
  frCtx.__d = { cert: { glyph: 'PC', name: 'Fake', code: 'PC-1' }, pro: true, remaining: 15, scale: frCtx.__s };
  test('545 first-run: the day-0 line says percent, not "Scored 0 to 100"',
    /Scored as a percentage, with 60% to pass/.test(vm.runInContext('_ifrDay0Html(__d)', frCtx)));

  // ios-log-result: the log screen
  const lg = sandbox({ CURRENT_CERT: 'pctcert' });
  vm.runInContext('function _esc(s) { return String(s == null ? "" : s); }\n' + fn('features/ios-log-result.js', '_html') + '\n' + fn('features/ios-log-result.js', '_examScoreCheck'), lg);
  lg.__m = { mark: 'PC', name: 'Fake', code: 'PC-1', min: 0, max: 100, pass: 60, fmt: 'percent', date: '2026-10-31', today: '2026-10-31', score: '' };
  const lgH = vm.runInContext('_html(__m)', lg);
  test('545 log result: a percent cert asks for a percentage (% suffix, "pass mark 60%", no "/ 100")',
    /<span class="il-of">%<\/span>/.test(lgH) && /pass mark<b>60%<\/b>/.test(lgH) && /scored as a percentage\. 60% is a pass\./.test(lgH) && !/\/ 100/.test(lgH));
  lg.__m = Object.assign({}, lg.__m, { min: 100, max: 900, pass: 720, fmt: 'scaled' });
  test('545 log result: a scaled cert is unchanged ("/ 900", "pass mark 720", "scored from 100 to 900")',
    (() => { const h = vm.runInContext('_html(__m)', lg); return /&nbsp;\/ 900<\/span>/.test(h) && /pass mark<b>720<\/b>/.test(h) && /scored from 100 to 900\. 720 is a pass\./.test(h); })());
  test('545 log result: a percent score of 0 to 100 validates, 101 does not',
    vm.runInContext('_examScoreCheck(85, 0, 100).ok && _examScoreCheck("0", 0, 100).ok && !_examScoreCheck(101, 0, 100).ok', lg));

  // ios-exam: the phone exam results
  const ie = sandbox({});
  vm.runInContext(fn('features/ios-exam.js', '_iosExamResultsModel'), ie);
  const dBase = { scaled: 72, passScore: 60, maxScore: 100, minScore: 0, certLabel: 'Fake', domains: [], pauses: 0, wrongTopics: [], pbqs: [], total: 50, correct: 36, wrong: 14, skipped: 0, pct: 72 };
  ie.__d = Object.assign({ fmt: 'percent' }, dBase);
  const im = vm.runInContext('_iosExamResultsModel(__d)', ie);
  test('545 exam results (phone): a percent cert is labelled "Score", has format percent, its tick at 60 and fill at 72, and passes',
    im.fmt === 'percent' && im.label === 'Score · Fake' && im.meter.tick === 60 && im.meter.fill === 72 && im.passed === true && im.over === 12);
  ie.__d = Object.assign({}, dBase, { scaled: 676, passScore: 720, maxScore: 900, minScore: 100 });
  const ims = vm.runInContext('_iosExamResultsModel(__d)', ie);
  test('545 exam results (phone): a scaled cert keeps "Scaled score", format scaled and its 0-100 mapping', ims.label === 'Scaled score · Fake' && ims.fmt === 'scaled' && ims.passed === false);
  const ieSrc = src['features/ios-exam.js'];
  // analytics (desktop list of exams) and the other desktop readers: through the shared formatter
  const an = sandbox({ EXAM_TOPIC: 'Exam', EXAM_PASS_SCORE: 60, _edCardhead: () => '', scaledExamScore: (c, t) => Math.round(c / t * 100),
    formatExamScore: (n) => Math.round(n) + '%' });
  vm.runInContext(fn('features/analytics.js', '_renderAnaExams'), an);
  const anH = vm.runInContext('_renderAnaExams(' + JSON.stringify([{ date: '2026-05-02T10:00:00Z', topic: 'Exam', mode: 'exam', score: 36, total: 50, pct: 72 }]) + ')', an);
  test('545 analytics: the exam list shows a percent score as 72% and PASS at the 60 line', />72%<\/div>/.test(anH) && />PASS<\/div>/.test(anH));
  const A = src['features/analytics.js'];
  test('545 analytics: the readiness hero and tile use the shared formatter, no "/ ${EXAM_MAX_SCORE}" tail, the pass tick reads the pass text',
    /formatExamScore\(predicted\)/.test(A) && /\$\{examScoreOf\(\)\}/.test(A) && /\$\{examPassText\(\)\} PASS/.test(A) && !/\/ \$\{EXAM_MAX_SCORE\}/.test(A)
    && /data-suffix="%"/.test(A) && /EXAM_SCORE_FORMAT === 'percent' \? EXAM_PASS_SCORE : 72/.test(A));
  const IA = src['features/ios-analytics.js'];
  test('545 analytics (phone): the readiness card reads 72% with Pass 60% and the count-up keeps the %',
    /r\.fmt === 'percent' \? '%' : ''/.test(IA) && /data-sfx="%"/.test(IA) && /getAttribute\('data-sfx'\)/.test(IA) && /fmt: \(typeof EXAM_SCORE_FORMAT/.test(IA));
  const IH = src['features/ios-home.js'];
  test('545 home (phone): the readiness card drops "/ max" and reads 72%, Pass 60%; the exam copy says percentage',
    /fmt: fmt/.test(IH) && /r\.fmt === 'percent' \? '%' : ''/.test(IH) && /ex\.fmt === 'percent' \? 'as a percentage'/.test(IH) && !/'\/ ' \+ e\(r\.max\) \+ '<\/span><\/div>'/.test(IH));
  test('545 diagnostic: the Pass Plan predicted score is formatted and has no "/ max" on a percent cert',
    /formatExamScore\(p\.predicted\) \+ \(EXAM_SCORE_FORMAT === 'percent' \? '' : ' \/ ' \+ EXAM_MAX_SCORE\)/.test(src['features/diagnostic.js']));
  const EX = src['features/exam.js'];
  test('545 exam (desktop): the results use the formatter, the count-up keeps the %, the pass-mark line reads percent',
    /formatExamScore\(scaledScore\)/.test(EX) && /animateCount\('exam-scaled-score', 0, scaledScore, 1200, EXAM_SCORE_FORMAT === 'percent'/.test(EX) && /examPassText\(\)/.test(EX) && /examScoreRangeText\(\)/.test(EX));
  const QE = src['features/quiz-engine.js'];
  test('545 quiz results: the scaled score animates with the % suffix, formats on the reduced-motion path, and the verdict reads the pass text',
    /animateCount\('r-v2-score'.*EXAM_SCORE_FORMAT === 'percent'/.test(QE) && /scoreEl\.textContent = formatExamScore\(scaled\)/.test(QE) && /Pass mark cleared \\u00b7 ' \+ examPassText\(\)/.test(QE));
  const HM = src['features/home.js'];
  test('545 home (desktop): the static "/ 900", "scaled 100-900" and the pass-mark line are rewritten for a percent cert',
    /pctCert/.test(HM) && /scored as a percentage/.test(HM) && /examPassText\(\)/.test(HM) && /data-sfx="%"/.test(HM));
  const APP = src['app.js'];
  test('545 app: EXAM_PASS_SCORE / EXAM_MAX_SCORE come from CertRegistry.examScale (meta fallback), and the readiness card counts from 0 with a % on a percent cert',
    /const EXAM_PASS_SCORE = window\.CertRegistry \? window\.CertRegistry\.examScale\(CURRENT_CERT, CERT_PACK && CERT_PACK\.meta\)\.pass/.test(APP)
    && /const EXAM_MAX_SCORE = window\.CertRegistry \? window\.CertRegistry\.examScale\(CURRENT_CERT, CERT_PACK && CERT_PACK\.meta\)\.max/.test(APP)
    && /animateCount\('rc-v2-num',EXAM_SCORE_FORMAT==='percent'\?0:100,scaled,1100,EXAM_SCORE_FORMAT==='percent'\?'%':''\)/.test(APP)
    && /n\.textContent=formatExamScore\(scaled\)/.test(APP) && /stats\.bestExam > 0 \? formatExamScore\(stats\.bestExam\)/.test(APP));
  test('545 app: app.js did not grow (baseline 8235 lines)', APP.split('\n').length <= 8236);   // split of a trailing newline counts one extra
  test('545 onboarding: the cert switcher reads "72% · pass 60%" per cert and the tour copy says percentage',
    /rs\.format === 'percent' \? '· pass ' \+ rs\.pass \+ '%'/.test(src['lib/onboarding-home.js']) && /One score, as a percentage/.test(src['lib/onboarding-home.js']));
  test('545 phone tour and Settings pass plans read the registry format',
    /s\.format === 'percent' \? 'It is a percentage/.test(src['features/ios-tour.js']) && /_rs\.format === 'percent' \? '%' : ''/.test(src['features/settings.js']));

  // ── Fix round 1: rendered-output checks (real views run in a vm) ──
  // Item 1: the "Getting close" milestone and its descriptions.
  function milestoneCtx(fmt, close, pass) {
    const sb = sandbox({ EXAM_PASS_SCORE: pass, READINESS_CLOSE: close, EXAM_SCORE_FORMAT: fmt, DOMAIN_WEIGHTS: { a: 1, b: 1 },
      formatExamScore: (n) => (fmt === 'percent' ? Math.round(n) + '%' : String(Math.round(n))) });
    vm.runInContext(between('features/readiness.js', 'const MILESTONE_DEFS = [', '  ];').replace('const MILESTONE_DEFS', 'var MILESTONE_DEFS'), sb);
    return sb;
  }
  const msP = milestoneCtx('percent', 51, 60), msS = milestoneCtx('scaled', 650, 720);
  const desc = (sb, id) => vm.runInContext('MILESTONE_DEFS.filter(function (m) { return m.id === "' + id + '"; })[0].desc', sb);
  test('545 milestones: a percent cert reads "Reach a readiness score of 51%" and "60% (pass)", "Score 60%+"',
    desc(msP, 'ready_650') === 'Reach a readiness score of 51%' && desc(msP, 'ready_720') === 'Reach a readiness score of 60% (pass)' && desc(msP, 'exam_pass') === 'Score 60%+ on any exam simulation');
  test('545 milestones: a scaled cert is unchanged ("650", "720 (pass)", "Score 720+")',
    desc(msS, 'ready_650') === 'Reach a readiness score of 650' && desc(msS, 'ready_720') === 'Reach a readiness score of 720 (pass)' && desc(msS, 'exam_pass') === 'Score 720+ on any exam simulation');
  const progLine = /ready_650: c => \[[^\n]*\],\s*ready_720: c => \[[^\n]*\],/.exec(src['features/analytics.js'])[0];
  function progress(fmt, close, pass, predicted) {
    const sb = sandbox({ EXAM_SCORE_FORMAT: fmt, READINESS_CLOSE: close, EXAM_PASS_SCORE: pass });
    sb.__c = { readiness: { predicted } };
    vm.runInContext('var P = {' + progLine + '};', sb);
    return [vm.runInContext('P.ready_650(__c)', sb), vm.runInContext('P.ready_720(__c)', sb)];
  }
  test('545 milestones: percent "Getting close" targets the close cut-off (45 / 51), "Exam ready" the pass line (45 / 60)',
    JSON.stringify(progress('percent', 51, 60, 45)) === '[[45,51],[45,60]]');
  test('545 milestones: scaled "Getting close" still targets 650, whatever READINESS_CLOSE is (Azure close is not 650)',
    JSON.stringify(progress('scaled', 640, 720, 600)) === '[[600,650],[600,720]]' && JSON.stringify(progress('scaled', 650, 720, 600)) === '[[600,650],[600,720]]');

  // Item 2: the first-run reveal / movement screens: the tick sits at the pass mark on the cert's own scale.
  function frScreens(id, fmt, score, from, to) {
    const e = R.examScale(id, {});
    const sb = sandbox({ EXAM_MIN_SCORE: e.min, EXAM_MAX_SCORE: e.max, EXAM_PASS_SCORE: e.pass, EXAM_SCORE_FORMAT: fmt,
      esc: (v) => String(v), certById: () => ({ name: 'X' }), state: { certId: id }, real: null });
    vm.runInContext('var real = { score: ' + score + ', pass: ' + e.pass + ', weakArea: "W", moveFrom: ' + from + ', moveTo: ' + to + ', reviewCards: 0 };\n'
      + ['sfx', 'outOf', 'tickPct', 'legend', 'data', 'screenScoreReveal', 'screenMovement'].map((n) => fn('lib/onboarding-firstrun.js', n)).join('\n'), sb);
    return { reveal: vm.runInContext('screenScoreReveal()', sb), move: vm.runInContext('screenMovement()', sb), e };
  }
  const tickOf = (h) => +/fr-bar-tick" style="left:([\d.]+)%/.exec(h)[1];
  const frP = frScreens('pctcert', 'percent', 72, 60, 66);
  test('545 first-run screens: a percent cert has no "out of", reads Pass 60% on 0%-100%, tick at 60, and moves from 60% in the count',
    !/out of/.test(frP.reveal + frP.move) && /<span>0%<\/span><span class="fr-pass">Pass 60%<\/span><span>100%<\/span>/.test(frP.reveal)
    && tickOf(frP.reveal) === 60 && tickOf(frP.move) === 60 && />60%<\/span><span class="fr-outof">/.test(frP.move));
  const frN = frScreens('netplus', 'scaled', 540, 540, 560);
  test('545 first-run screens: a scaled cert keeps "out of 900" and the 100 / 900 legend', /out of 900/.test(frN.reveal) && /<span>100<\/span><span class="fr-pass">Pass 720<\/span><span>900<\/span>/.test(frN.reveal));
  const shifts = R.all().map((c) => {
    const sc2 = R.examScale(c.id, {}), h = frScreens(c.id, 'scaled', 500, 500, 510).reveal, want = Math.round((sc2.pass - sc2.min) / (sc2.max - sc2.min) * 1000) / 10;
    return { id: c.id, tick: tickOf(h), want, ok: tickOf(h) === want };
  });
  test('545 first-run screens: for every registry cert the tick lines up with (pass - min) / (max - min), not a fixed 80%',
    shifts.every((x) => x.ok) && shifts.find((x) => x.id === 'netplus').tick === 77.5 && shifts.find((x) => x.id === 'secplus').tick === 81.3 && shifts.find((x) => x.id === 'clfc02').tick === 66.7);
  test('545 first-run screens: the CSS keeps its 80% only as the fallback, the inline left wins', /fr-bar-tick" style="left:/.test(src['lib/onboarding-firstrun.js']));

  // Item 3: the diagnostic's predicted score.
  function diag(fmt, allRight) {
    const min = fmt === 'percent' ? 0 : 100, max = fmt === 'percent' ? 100 : 900, pass = fmt === 'percent' ? 60 : 720;
    const sb = sandbox({ READINESS_BAND: fmt === 'percent' ? [0, 100] : [420, 870], EXAM_MIN_SCORE: min, EXAM_MAX_SCORE: max, EXAM_PASS_SCORE: pass, EXAM_SCORE_FORMAT: fmt, CERT_CODE: 'X',
      DOMAIN_WEIGHTS: { concepts: 0.5, other: 0.5 }, DOMAIN_LABELS: { concepts: 'C', other: 'O' }, TOPIC_DOMAINS: { A: 'concepts', B: 'other' },
      _buildWeekPlan: () => [], _resolveDomainForTopic: (t) => ({ A: 'concepts', B: 'other' })[t] || null });
    const questions = Array.from({ length: 20 }, (_, i) => ({ topic: i % 2 ? 'B' : 'A' }));
    sb.session = { questions, answers: questions.map(() => ({ correct: allRight, confidence: 'confident', answeredAt: 1 })) };
    vm.runInContext(fn('features/diagnostic.js', '_buildPassPlan'), sb);
    return vm.runInContext('_buildPassPlan(session)', sb);
  }
  test('545 diagnostic: percent predicted equals weighted accuracy (all right 100, all wrong 0); scaled keeps the 0.95 shrink (all right 100 + 800 * 0.95 = 860)',
    diag('percent', true).predicted === 100 && diag('percent', false).predicted === 0 && diag('scaled', true).predicted === 860);

  // Item 4: phone wording for percent certs.
  ie.__d = Object.assign({ fmt: 'percent' }, dBase);
  const imP = vm.runInContext('_iosExamResultsModel(__d)', ie);
  test('545 exam results (phone): a percent cert has no "scaling isn\'t published" note; a scaled cert keeps it',
    imP.note === 'Your score is the share you got right.' && !/scaling/.test(imP.note) && vm.runInContext('_iosExamResultsModel(__d)', Object.assign(ie, { __d: Object.assign({}, dBase, { scaled: 676, passScore: 720, maxScore: 900, minScore: 100 }) })).note === "An estimate: the real exam's scaling isn't published.");
  const ieHtml = sandbox({});
  vm.runInContext(fn('features/ios-exam.js', '_iosExamResultsHtml'), ieHtml);
  ieHtml.__m = imP;
  let ieOut = '';
  try { ieOut = vm.runInContext('_iosExamResultsHtml(__m)', ieHtml); } catch (e) { ieOut = 'THREW ' + e.message; }
  test('545 exam results (phone): the rendered scorecard reads 72%, no "/ 100", legend 0% / Pass 60% / 100%, the count-up keeps the %',
    />72%<\/span><span class="ie-sc-of"><\/span>/.test(ieOut) && /data-sfx="%"/.test(ieOut) && /<span>0%<\/span><span class="ie-p">Pass 60%<\/span><span>100%<\/span>/.test(ieOut) && !/\/ 100/.test(ieOut) && !/scaling/.test(ieOut));

  // ios-home: the readiness card and the next-cert line.
  const ihSrcFns = ['_iosHomeHtml'];
  const ih = sandbox({ escHtml: (v) => String(v), document: { documentElement: { getAttribute: () => 'dark' } } });
  vm.runInContext(ihSrcFns.map((n) => fn('features/ios-home.js', n)).join('\n'), ih);
  const ihModel = (fmt, score) => ({ signedIn: true, cert: { mark: 'P', name: 'Fake', code: 'PC' }, passed: false, streak: 1, greeting: 'Hi', exam: { qs: 50, mins: 60, min: 0, max: 100, fmt },
    readiness: { score, fmt, max: fmt === 'percent' ? 100 : 900, pass: fmt === 'percent' ? 60 : 720, tier: 'Close', fillPct: 50, passPct: 60, insight: 'x', book: null, meta: null },
    rec: { kind: 'first', min: 10, title: 't', sub: 's' }, week: { days: [], done: 0, goal: 5 }, momentum: { done: 0, goal: 10, streakLine: '' }, mistakes: { count: 0 }, domains: [] });
  function ihRender(m) { ih.__m = m; try { return vm.runInContext('_iosHomeHtml(__m)', ih); } catch (e) { return 'THREW ' + e.message; } }
  const ihP = ihRender(ihModel('percent', 72)), ihL = ihRender(ihModel('percent', null)), ihS = ihRender(ihModel('scaled', 684));
  test('545 home (phone): the percent readiness card reads 72% with no "/ 100" and "Pass 60%"; locked reads "--" with no tail; exam copy says percentage',
    !/THREW/.test(ihP) && /ih-rd-num">72%<\/span><span class="ih-rd-of"><\/span>/.test(ihP) && /Pass 60%/.test(ihP) && /scored as a percentage/.test(ihP)
    && /ih-rd-num">--<\/span><span class="ih-rd-of"><\/span>/.test(ihL));
  test('545 home (phone): the scaled readiness card is unchanged ("684", "/ 900", "Pass 720", "scored 0 to 100"-style range copy)',
    /ih-rd-num">684<\/span><span class="ih-rd-of">\/ 900<\/span>/.test(ihS) && /Pass 720/.test(ihS) && /scored 0 to 100/.test(ihS));
  const ihModelFn = fn('features/ios-home.js', '_iosHomeModel');
  test('545 home (phone): "We predicted N" carries the % on a percent cert (source of the next-cert line)',
    /'We predicted ' \+ outcomeRec\.predicted \+ \(fmt === 'percent' \? '%' : ''\)/.test(ihModelFn));

  // Item 5: the empty score reads "--" everywhere, in both formats (every surface changed).
  const idx = read('index.html');
  test('545 empty score: the static placeholders are "--" (Home readiness, the old readiness card, Pass Plan predicted, quiz results)',
    /id="rc-v2-num">--</.test(idx) && /id="readiness-num">--</.test(idx) && /id="pass-plan-predicted-score">--</.test(idx) && /id="r-v2-score">--</.test(idx));
  test('545 empty score: the scripted placeholders are "--" (readiness cards, strip, Best exam, Settings ring, welcome-back tile); no em dash is left on a score',
    /const NO_SCORE = '--'/.test(src['features/readiness.js']) && !/numEl\.textContent\s*=\s*'\\u2014'/.test(src['features/readiness.js']) && !/Readiness \\u2014/.test(src['features/readiness.js'])
    && /stats\.bestExam > 0 \? formatExamScore\(stats\.bestExam\) : '--'/.test(src['app.js']) && /: '--'\) \+ '<\/span><\/span>'/.test(src['features/settings.js']) && /\(v == null \? '--'/.test(src['features/home.js']));
})();
