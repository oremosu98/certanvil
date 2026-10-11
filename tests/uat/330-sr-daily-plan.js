// tests/uat/330-sr-daily-plan.js
// Scope: spaced-repetition reviews come as a daily plan, not a backlog (v8.160.0).
//
// Why this module exists: on 2026-10-11 Home said "Review 62 cards · 31 min".
// Two causes. SR_SESSION_CAP became closure-private when features/sr-review.js
// was split out of app.js, so home.js's typeof guard fell back to the whole
// backlog (and _computeNextBestMove's bare reference threw inside its try, so
// reviews never became the next best move). And the queue had no daily plan:
// 65 of the founder's 69 cards had never been reviewed, because finishing 30
// just put the next 30 on Home. Spec:
// docs/superpowers/specs/2026-10-11-sr-daily-plan-design.md

const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Spaced repetition: daily review plan ──\x1b[0m');
  try {
    function fn(name) {
      var m = new RegExp('function\\s+' + name + '\\s*\\(').exec(js);
      if (!m) throw new Error('missing fn ' + name);
      var i = js.indexOf('{', m.index), d = 0, j = i;
      for (; j < js.length; j++) { var c = js[j]; if (c === '{') d++; else if (c === '}') { d--; if (d === 0) { j++; break; } } }
      return js.slice(m.index, j);
    }
    var C = { SR_SESSION_CAP: 30, SR_PLAN_CEILING: 50, Math: Math, Date: Date, Infinity: Infinity, isFinite: isFinite };
    vm.createContext(C);
    vm.runInContext([fn('_srPerDay'), fn('_srPlanDays'), fn('_srLeastLoadedDay'), fn('_srSpreadPhrase')].join('\n'), C);

    // ── How many reviews a day ──
    test('SR plan: reviews per day is the chosen session size (default 30), "All due" means no plan',
      C._srPerDay(30, null, 0) === 30 && C._srPerDay(10, null, 0) === 10 && C._srPerDay(undefined, null, 0) === 30
        && C._srPerDay('all', null, 0) === Infinity && C._srPerDay(99, null, 0) === 30);
    test('SR plan: with an exam booked, the rate rises only if the cards due before exam day would not fit',
      C._srPerDay(30, 5, 69) === 30            // founder 2026-10-11: 69 cards, 5 days -> 14/day fits in 30
        && C._srPerDay(30, 2, 90) === 45       // 90 cards, 2 days -> 45/day
        && C._srPerDay(10, 4, 60) === 15
        && C._srPerDay(30, 1, 200) === 50);    // never more than the ceiling in one day

    // ── Overflow is spread, not shown as one pile ──
    var p1 = C._srPlanDays([62, 8, 0, 0, 0, 0, 0], 30, 30);
    test('SR plan: 62 due today at 30 a day -> 30 today, 30 tomorrow, 10 the day after (the 2026-10-11 Home case)',
      JSON.stringify(p1.counts) === JSON.stringify([30, 30, 10, 0, 0, 0, 0]) && p1.spillDays === 2 && p1.carryLeft === 0);
    var p2 = C._srPlanDays([32, 8, 0, 0, 0, 0, 0], 30, 0);
    test('SR plan: once today\'s plan is done, today shows 0 and the rest carries forward',
      JSON.stringify(p2.counts) === JSON.stringify([0, 30, 10, 0, 0, 0, 0]) && p2.spillDays === 2);
    var p3 = C._srPlanDays([400, 0, 0, 0, 0, 0, 0], 30, 30);
    test('SR plan: a backlog bigger than a week reports what is still left after day 7',
      p3.counts.every(function (n) { return n === 30; }) && p3.carryLeft === 400 - 210);
    var p4 = C._srPlanDays([62, 8, 0, 0, 0, 0, 0], Infinity, 62);
    test('SR plan: "All due" shows the raw schedule',
      JSON.stringify(p4.counts) === JSON.stringify([62, 8, 0, 0, 0, 0, 0]) && p4.spillDays === 0);

    // ── Plain-English spread line ──
    test('SR plan: spread phrase reads plainly ("32 more over the next 2 days", "1 more tomorrow", "next week")',
      C._srSpreadPhrase(32, 2, 0) === '32 more over the next 2 days'
        && C._srSpreadPhrase(1, 1, 0) === '1 more tomorrow'
        && C._srSpreadPhrase(190, 6, 190) === '190 more across the next week'
        && C._srSpreadPhrase(0, 0, 0) === ''
        && C._srSpreadPhrase(32, 2, 0, 'rest') === 'the rest is spread over the next 2 days'
        && C._srSpreadPhrase(5, 1, 0, 'rest') === 'the rest moves to tomorrow'
        && C._srSpreadPhrase(32, 2, 0, 'sentence') === '32 more come up over the next 2 days.'
        && C._srSpreadPhrase(1, 1, 0, 'sentence') === '1 more comes up tomorrow.');

    // ── Load balancing: intervals avoid already-busy days ──
    var now = new Date(); now.setHours(12, 0, 0, 0); now = now.getTime();
    var DAY = 86400000, t0 = new Date(now); t0.setHours(0, 0, 0, 0); t0 = t0.getTime();
    function onDay(d, n, tag) { var a = []; for (var k = 0; k < n; k++) a.push({ qHash: tag + k, nextReview: t0 + d * DAY + 3600000 }); return a; }
    var q = onDay(9, 2, 'a').concat(onDay(10, 5, 'b'));
    var me = { qHash: 'me' };
    test('SR plan: a 10-day interval moves to the lightest day within ±1 (day 11 has nothing due)',
      C._srLeastLoadedDay(q, me, 10, 180, now) === 11);
    test('SR plan: ties keep the exact interval, and short intervals (< 3 days) are never moved',
      C._srLeastLoadedDay([], me, 10, 180, now) === 10 && C._srLeastLoadedDay(onDay(2, 9, 'c'), me, 2, 180, now) === 2);
    test('SR plan: balancing never pushes a card past the exam cap',
      C._srLeastLoadedDay(q, me, 10, 10, now) <= 10);

    // ── End to end: the founder's 2026-10-11 Home case through the real planner ──
    var D = { SR_SESSION_CAP: 30, SR_PLAN_CEILING: 50, SR_DAY_KEY: 'nplus_sr_day', SR_FREE_DAILY_CAP: 5, Math: Math, Date: Date, JSON: JSON, Infinity: Infinity, isFinite: isFinite };
    var store = {}, qq = [], n2 = Date.now();
    for (var a = 0; a < 62; a++) qq.push({ qHash: 'd' + a, nextReview: n2 - 3600000, topic: 'T' });
    var tm = new Date(n2); tm.setHours(0, 0, 0, 0); tm = tm.getTime() + 86400000 + 7200000;
    for (var b = 0; b < 8; b++) qq.push({ qHash: 't' + b, nextReview: tm, topic: 'T' });
    D.localStorage = { getItem: function (k) { return store[k] || null; }, setItem: function (k, v) { store[k] = v; } };
    D.loadSrPrefs = function () { return { sessionSize: 30 }; };
    D.loadSrQueue = function () { return qq; };
    vm.createContext(D);
    vm.runInContext(['_srLocalDay', '_srReviewedToday', '_srBumpReviewedToday', '_srPerDay', '_srPlanDays', 'buildSrForecast', 'getSrTodayPlan'].map(fn).join('\n'), D);
    var plan = vm.runInContext('getSrTodayPlan()', D);
    test('SR plan: 62 due + 8 tomorrow -> Home asks for 30 today, 32 more over the next 2 days',
      plan.todo === 30 && plan.later === 32 && plan.spillDays === 2 && plan.counts[0] === 30 && plan.counts[1] === 30 && plan.counts[2] === 10);
    vm.runInContext('for (var i = 0; i < 30; i++) _srBumpReviewedToday();', D);
    var after = vm.runInContext('getSrTodayPlan()', D);
    test('SR plan: after 30 reviews today (queue unchanged in this fixture) Home asks for nothing more today',
      after.todo === 0 && after.done === 30);

    // ── Wiring ──
    var sched = _fnBody(js, '_srSchedule'), upd = _fnBody(js, 'updateSrEntry');
    test('SR plan: _srSchedule balances only when it is given the queue (vm fixtures without it are unchanged)',
      /function\s+_srSchedule\(entry,\s*outcome,\s*queue\)/.test(js) && /if\s*\(queue\s*&&/.test(sched) && /_srSchedule\(queue\[idx\],\s*outcome,\s*queue\)/.test(upd));
    var start = _fnBody(js, 'startSrReview(');
    test('SR plan: a review session serves today\'s plan; once done, a session started by hand reviews one day ahead',
      /getSrTodayPlan/.test(start) && /_srPlanToday\.todo\s*>\s*0/.test(start));
    var mark = _fnBody(js, 'srMarkConfidence');
    test('SR plan: real review marks count toward today; practice top-ups do not',
      /!_srSession\.practice\s*&&\s*typeof _srBumpReviewedToday === 'function'/.test(mark));
    var home = (function () { try { return require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'features', 'home.js'), 'utf8'); } catch (e) { return ''; } })();
    test('SR plan: Home\'s Recommended tile leads with today\'s plan, not the backlog',
      /getSrTodayPlan/.test(home) && !/typeof SR_SESSION_CAP/.test(home));
    var nbm = _fnBody(js, '_computeNextBestMove');
    test('SR plan: next-best-move reads the plan and no longer touches the closure-private SR_SESSION_CAP (it threw)',
      /getSrTodayPlan/.test(nbm) && !/SR_SESSION_CAP/.test(nbm));
    test('SR plan: the planner is exposed for Home, next-best-move and the forecast',
      /window\.getSrTodayPlan\s*=\s*getSrTodayPlan/.test(js) && /window\._srSpreadPhrase\s*=\s*_srSpreadPhrase/.test(js));
  } catch (err) {
    test('SR plan: block (threw)', false);
    results.errors.push('330 SR daily plan block threw: ' + err.message);
  }
})();
