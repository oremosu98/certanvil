// tests/uat/492-ios-analytics.js
// Scope: the phone Analytics screen (features/ios-analytics.js) and the topic Map, Lift B1. E2E source:
// feat/cert-ios-e2e mockups/cert-ios-analytics.html (b31c7df6). Spec: docs/superpowers/specs/2026-10-21-ios-lift-b1-design.md.
// Map statuses come from analytics.js _computeConstellationData tiers; mastery null = untouched, novice = weak.
const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Lift B1 Analytics + Map (phone) ──\x1b[0m');
  try {
    // ── Desktop Hands-on group: data split must leave the HTML identical (guard) ──
    const DRILL_IDS = ['simlab_first', 'simlab_25', 'simlab_ace', 'decision_first', 'decision_25', 'decision_flawless',
      'whynot_first', 'whynot_25', 'whynot_master', 'gauntlet_first', 'gauntlet_25', 'gauntlet_survivor'];
    const dctx = vm.createContext({ Math, String, Array, Object, JSON, Date, isFinite, Number,
      MILESTONE_DEFS: DRILL_IDS.map(id => ({ id, label: 'L ' + id, desc: 'D ' + id })),
      getMilestones: () => ({ simlab_first: new Date(Date.now() - 3 * 864e5).toISOString() }),
      _buildMilestoneCtx: () => ({}), MILESTONE_PROGRESS: { simlab_25: () => [8, 25] }, evaluateMilestones: () => {} });
    vm.runInContext(['_anaBtEsc', '_anaDrillsGroupData', '_anaDrillsGroupHtml'].map(n => _fnBody(js, n) || '').join('\n'), dctx);
    const dh = vm.runInContext('_anaDrillsGroupHtml()', dctx);
    test('Desktop Hands-on HTML: 1 earned, 1 in progress, 10 locked, "1 of 12 earned" (guard)',
      (dh.match(/class="ms ms-earned/g) || []).length === 1 && (dh.match(/class="ms ms-prog"/g) || []).length === 1 &&
      (dh.match(/class="ms ms-locked"/g) || []).length === 10 && dh.includes('<span class="n">1</span><span class="of">of 12 earned</span>'));
    const dd = vm.runInContext('_anaDrillsGroupData()', dctx);
    test('Hands-on data: four drills, three steps each, in the desktop order',
      dd && dd.groups.length === 4 && dd.groups.every(g => g.steps.length === 3) && dd.groups.map(g => g.name).join() === 'Sim Lab,Decision Lab,Why-Not,Gauntlet');
    test('Hands-on data: step states are earned / prog (with cur/tar) / locked',
      dd.groups[0].steps.map(s => s.state).join() === 'earned,prog,locked' && dd.groups[0].steps[1].cur === 8 && dd.groups[0].steps[1].tar === 25);
    test('Hands-on data: earned and total counts', dd.earned === 1 && dd.total === 12);
    test('analytics.js exports the data the phone screen reads',
      ['_anaBentoData', '_computeConstellationData', '_anaDrillsGroupData', '_startTopicsQuiz'].every(n => js.includes('window.' + n + ' = ' + n)));

    // ── Map model ──
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Date, isFinite, Number });
    vm.runInContext(['_iosMapModel', '_iosAnalyticsModel'].map(n => _fnBody(js, n) || '').join('\n'), ctx);
    const S = (topic, domain, mastery, tier, lastDays) => ({ topic, domain, mastery, tier: tier || 'novice', attempts: mastery === null ? 0 : 10, lastDays: mastery === null ? null : lastDays });
    const STARS = [S('OSI', 'concepts', 90, 'mastered', 2), S('DNS', 'concepts', 74, 'proficient', 3), S('IPv6', 'concepts', null),
      S('OSPF', 'implementation', 60, 'developing', 5), S('BGP', 'implementation', 30, 'novice', 9), S('VLANs', 'implementation', null), S('STP', 'implementation', null)];
    const DOMS = [{ key: 'concepts', name: 'Networking Concepts', examPct: 23 }, { key: 'implementation', name: 'Network Implementation', examPct: 20 }];
    const MM = (stars) => vm.runInContext('_iosMapModel(__s, __d)', Object.assign(ctx, { __s: stars, __d: DOMS }));
    const map = MM(STARS);
    test('Map model: studied and mastered counts', map.studied === 4 && map.total === 7 && map.mastered === 1);
    test('Map model: one row per domain with its exam weight', map.rows.length === 2 && map.rows[1].name === 'Network Implementation' && map.rows[1].examPct === 20);
    test('Map model: tile statuses (null = untouched, novice = weak)',
      map.rows[0].tiles.map(t => t.status).join() === 'mastered,proficient,untouched' && map.rows[1].tiles.map(t => t.status).join() === 'developing,weak,untouched,untouched');
    test('Map model: weakest = weak then developing, lowest first, at most 3', map.weakest.join() === 'BGP,OSPF');
    test('Map model: a tile carries pct, attempts and last seen', map.rows[1].tiles[1].pct === 30 && map.rows[1].tiles[1].attempts === 10 && map.rows[1].tiles[1].lastDays === 9);
    const none = MM(STARS.map(s => Object.assign({}, s, { mastery: null, attempts: 0, lastDays: null })));
    test('Map model: nothing studied gives no weakest topics', none.weakest.length === 0 && none.studied === 0);

    // ── Analytics model ──
    const D = { readiness: { predicted: 553, stats: { sessions: 3 } }, passTrend: {}, difficulty: [], examVsQuiz: null, whyScore: {}, wrongPatterns: [],
      streak: {}, heatmap: [], milestones: { unlocked: 0, total: 0, recent: [], locked: [] },
      domains: [{ idx: 1, name: 'A', accuracy: 80, questions: 4, weight: 23 }, { idx: 2, name: 'B', accuracy: 0, questions: 0, weight: 20 }, { idx: 3, name: 'C', accuracy: 40, questions: 3, weight: 19 }] };
    const AM = (d) => vm.runInContext('_iosAnalyticsModel(__D, __m, __w)', Object.assign(ctx, { __D: d, __m: map, __w: dd }));
    const am = AM(D);
    test('Analytics model: six pages in the E2E order', am.pages.map(p => p.label).join() === 'Readiness,Map,Trends,Domains,Activity,Wins');
    test('Analytics model: domains worst first, unstudied first, weakest studied tagged',
      am.domains.rows.map(r => r.name).join() === 'B,C,A' && am.domains.rows[1].weakest === true && !am.domains.rows[0].weakest);
    test('Analytics model: Wins carries badges and the Hands-on drills', am.wins.handsOn.groups.length === 4 && am.wins.badges === D.milestones);
    test('Analytics model: no history is the empty state', AM(null).empty === true && am.empty === false);

    // ── View ──
    vm.runInContext((_fnBody(js, '_iosAnalyticsHtml') || ''), ctx);
    const CERT = { mark: 'N+', name: 'Network+', code: 'N10-009' };
    const FULL = Object.assign({}, D, {
      readiness: { predicted: 553, passScore: 720, maxScore: 900, forecast: 553, daysToExam: null, tier: 'Building', pointsToPass: 167, barPct: 61.4, passTickPct: 80,
        stats: { sessions: 23, questions: 75, accuracy: 92, studyDays: 7 }, spark: { sessions: [1, 2, 3], questions: [4, 5, 6], accuracy: [70, 80, 90], studyDays: [1, 1, 2] } },
      passTrend: { passAcc: 72, yMin: 40, yMax: 100, data: { week: [{ acc: 60 }], month: [{ acc: 55 }, { acc: 60 }], all: [{ acc: 50 }, { acc: 60 }] } },
      difficulty: [{ label: 'Easy', accuracy: 73, count: 15 }], whyScore: { headline: 'Drill B next.', body: 'B is weakest.', leverage: '+25 pts', factors: [{ label: 'B at 0%', effect: 'down', note: 'biggest drag' }] },
      wrongPatterns: [{ label: 'B', domain: 'B', note: 'Ethernet', count: 2 }],
      streak: { current: 0, longest: 4, totalActiveDays: 7, lastStudy: '16 May', week: [{ dayLabel: 'M', studied: true }] },
      heatmap: Array.from({ length: 365 }, (_, i) => ({ daysAgo: 364 - i, count: i % 30 === 0 ? 8 : 0 })),
      examHistory: [] });
    const AH = (model) => vm.runInContext('_iosAnalyticsHtml(__m, __c)', Object.assign(ctx, { __m: model, __c: CERT }));
    const ah = AH(vm.runInContext('_iosAnalyticsModel(__D, __m, __w)', Object.assign(ctx, { __D: FULL, __m: map, __w: dd })));
    test('Analytics view: six pills, Readiness selected', (ah.match(/class="in-chip[^"]*" type="button" role="tab"/g) || []).length === 6 && ah.includes('aria-selected="true" data-page="0">Readiness<'));
    test('Analytics view: the switch has Analytics pressed', ah.includes('data-view="analytics" aria-pressed="true"'));
    test('Analytics view: one Map row per domain and one tile per topic',
      (ah.match(/class="in-map-dom"/g) || []).length === 2 && (ah.match(/<button class="in-mtile /g) || []).length === 7);
    test('Analytics view: tile labels read "<topic>, <status>, <pct>%" or "<topic>, untouched"',
      ah.includes('aria-label="BGP, weak, 30%"') && ah.includes('aria-label="IPv6, untouched"'));
    test('Analytics view: the action line counts the weakest topics it names',
      ah.includes('<b>Your 2 weakest topics</b>') && ah.includes('>BGP, OSPF</span>'));
    const one = vm.runInContext('_iosAnalyticsModel(__D, __m, __w)', Object.assign(ctx, { __D: FULL, __m: Object.assign({}, map, { weakest: ['BGP'] }), __w: dd }));
    test('Analytics view: one weak topic reads "Your weakest topic"', AH(one).includes('<b>Your weakest topic</b>'));
    const zero = vm.runInContext('_iosAnalyticsModel(__D, __m, __w)', Object.assign(ctx, { __D: FULL, __m: Object.assign({}, map, { weakest: [] }), __w: dd }));
    test('Analytics view: no weak topics hides the action box', !AH(zero).includes('in-map-act'));
    test('Analytics view: Wins lists one Hands-on row per drill with three steps',
      (ah.match(/class="in-ho"/g) || []).length === 4 && (ah.match(/class="in-ho-step in-(earned|prog|locked)"/g) || []).length === 12);
    test('Analytics view: readiness reads "<b>167 points</b> to the pass mark"', ah.includes('<b>167 points</b> to the pass mark.'));
    test('Analytics view: the heatmap has 26 weeks of cells', (ah.match(/<i class="in-hm[^"]*"><\/i>/g) || []).length === 182);
    const em = AH(vm.runInContext('_iosAnalyticsModel(null, __m, __w)', Object.assign(ctx, { __m: map, __w: dd })));
    test('Analytics view: no history renders the empty card and no pager', em.includes('in-empty-card') && !em.includes('in-pager'));
  } catch (err) {
    test('Lift B1 Analytics: block (threw)', false);
    results.errors.push('492 ios-analytics block threw: ' + err.message);
  }
})();
