// tests/uat/480-ios-home-model.js
// Scope: Lift A Home model (features/ios-home.js _iosHomeModel). Pure: data in, plain object out.
// The view (Task 3) renders the June E2E Home from this object, so every string here is E2E copy.
const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Lift A Home model ──\x1b[0m');
  try {
    const body = _fnBody(js, '_iosHomeModel') || '';
    const TUE_9AM = new Date(2026, 9, 20, 9, 0, 0);   // Tuesday 20 Oct 2026, 09:00 local
    const row = (topic, score, total) => ({ date: new Date(TUE_9AM.getTime() - 86400000).toISOString(), topic, score, total, pct: Math.round(score / total * 100) });
    function mk(o) {
      o = o || {};
      const store = Object.assign({}, o.store || {});
      const ctx = vm.createContext({
        Math, JSON, Date, String, Number, Array, Object,
        CURRENT_CERT: o.cert || 'netplus', CERT_CODE: o.code || 'N10-009',
        CERT_PACK: { meta: { name: o.name || 'CompTIA Network+' } },
        EXAM_MIN_SCORE: o.min ?? 100, EXAM_MAX_SCORE: o.max ?? 900, EXAM_PASS_SCORE: o.pass ?? 720,
        DOMAIN_WEIGHTS: { concepts: 0.23, implementation: 0.20 },
        DOMAIN_LABELS: { concepts: 'Networking Concepts', implementation: 'Network Implementation' },
        TOPIC_DOMAINS: { 'Ethernet Basics': 'concepts', 'VLANs': 'implementation' },
        localStorage: { getItem: k => (k in store ? store[k] : null) },
        window: { _certanvilSignedIn: o.signedIn !== false },
        document: { documentElement: { classList: { contains: c => c === 'is-native' && !!o.native } } },
        loadHistory: () => o.history || [],
        isHistorySplitRow: e => !!(e && e.via),
        getReadinessScore: () => o.readiness || null,
        getSrTodayPlan: () => o.sr || { todo: 0, later: 0, counts: [0, 0, 0, 0, 0, 0, 0] },
        _srSpreadPhrase: () => '',
        getStreak: () => o.streak || { current: 0, best: 0 },
        getTodayQuestionCount: () => o.done || 0,
        getDailyGoal: () => o.goal || 20,
        buildSessionPlan: () => o.plan || [],
        loadWrongBank: () => o.bank || [],
        getDaysToExam: () => (o.days === undefined ? 34 : o.days),
      });
      vm.runInContext(body, ctx);
      ctx.__now = o.now || TUE_9AM;
      return vm.runInContext('_iosHomeModel(__now)', ctx);
    }
    const hist = [row('Ethernet Basics', 8, 10), row('VLANs', 1, 2), Object.assign(row('Ethernet Basics', 8, 10), { via: 'mixed-split' })];
    const rd = { predicted: 553, recentAccuracy: 70, recentAnswers: 200, passProbability: 55, examReady: false, whatIf: [{ topic: 'VLANs' }] };

    const nu = mk({});
    test('New user: state new, readiness Locked with no score, rec "Start your first quiz"',
      nu.state === 'new' && nu.readiness.tier === 'Locked' && nu.readiness.score === null && nu.readiness.meta === null
      && nu.rec.kind === 'first' && nu.rec.title === 'Start your first quiz' && nu.rec.sub === '10 questions, easy mix, about 10 minutes.' && nu.rec.min === 10);
    test('New user greeting names the cert', nu.greeting === 'Welcome to Network+. Your first session sets the baseline.');

    const ret = mk({ history: hist, readiness: rd, streak: { current: 1, best: 4 }, done: 0, plan: [{ topic: 'Ethernet Basics', signal: 'weak', meta: '~46% accuracy' }], bank: [1, 2, 3] });
    test('Returning on Tuesday 09:00: greeting "Tuesday morning. Pick up where you left off."', ret.state === 'returning' && ret.greeting === 'Tuesday morning. Pick up where you left off.');
    test('Greeting turns afternoon at 12:00 and evening at 17:00',
      mk({ history: hist, readiness: rd, now: new Date(2026, 9, 20, 12, 0) }).greeting === 'Tuesday afternoon. Pick up where you left off.'
      && mk({ history: hist, readiness: rd, now: new Date(2026, 9, 20, 17, 0) }).greeting === 'Tuesday evening. Pick up where you left off.');
    test('Readiness on Net+: 553 of 900, pass 720, fill ~61.4%, pass tick at 80%',
      ret.readiness.score === 553 && ret.readiness.max === 900 && ret.readiness.pass === 720
      && Math.abs(ret.readiness.fillPct - 61.4) < 0.1 && ret.readiness.passPct === 80);
    test('Readiness on AI-901 uses its own scale (max 1000, pass 700, tick at 70%)', (() => {
      const m = mk({ cert: 'ai900', code: 'AI-901', name: 'Microsoft Azure AI Fundamentals', min: 1, max: 1000, pass: 700, history: hist, readiness: rd });
      return m.readiness.max === 1000 && m.readiness.pass === 700 && m.readiness.passPct === 70 && m.cert.mark === 'AI';
    })());
    test('Readiness meta: "Last 200 answers: 70% right · 34 days to exam"', ret.readiness.meta === 'Last 200 answers: 70% right · 34 days to exam');
    test('Readiness meta drops the day count once the exam date has passed',
      mk({ history: hist, readiness: rd, days: -3 }).readiness.meta === 'Last 200 answers: 70% right');
    test('Insight below the pass mark: "About 167 points to a pass."', ret.readiness.insight === 'About 167 points to a pass.');
    test('Insight at or above the pass mark: "Above the pass mark. Keep it there."',
      mk({ history: hist, readiness: Object.assign({}, rd, { predicted: 760 }) }).readiness.insight === 'Above the pass mark. Keep it there.');
    test('Tier: Pass ready / On track / Close / Behind',
      mk({ history: hist, readiness: Object.assign({}, rd, { examReady: true }) }).readiness.tier === 'Pass ready'
      && ret.readiness.tier === 'On track'
      && mk({ history: hist, readiness: Object.assign({}, rd, { passProbability: 25 }) }).readiness.tier === 'Close'
      && mk({ history: hist, readiness: Object.assign({}, rd, { passProbability: 5 }) }).readiness.tier === 'Behind');

    const paused = JSON.stringify({ questions: new Array(90).fill({}), answered: 31, paused: true, timeLeft: 2520, savedAt: TUE_9AM.getTime() - 3600000, endTime: TUE_9AM.getTime() });
    const ex = mk({ history: hist, readiness: rd, store: { nplus_exam_state: paused }, sr: { todo: 7, later: 0, counts: [7, 2, 0, 0, 0, 0, 0] } });
    test('Paused exam outranks reviews: "Resume your exam", 42 MIN, "31 of 90 answered. Paused with 42 minutes left."',
      ex.rec.kind === 'exam' && ex.rec.min === 42 && ex.rec.title === 'Resume your exam' && ex.rec.sub === '31 of 90 answered. Paused with 42 minutes left.');
    const running = JSON.stringify({ questions: new Array(90).fill({}), answered: 31, endTime: TUE_9AM.getTime() + 600000 });
    test('Running exam: "31 of 90 answered. The clock is still running."',
      mk({ history: hist, readiness: rd, store: { nplus_exam_state: running } }).rec.sub === '31 of 90 answered. The clock is still running.');
    const over = JSON.stringify({ questions: new Array(90).fill({}), answered: 31, endTime: TUE_9AM.getTime() - 60000 });
    const ov = mk({ history: hist, readiness: rd, store: { nplus_exam_state: over } });
    test('Exam time up: "Your exam time is up" / "31 of 90 answered. See your result."', ov.rec.title === 'Your exam time is up' && ov.rec.sub === '31 of 90 answered. See your result.');

    const sr = mk({ history: hist, readiness: rd, sr: { todo: 7, later: 0, counts: [7, 2, 0, 0, 0, 0, 0] } });
    test('Reviews due: "Review 7 cards", 4 MIN, "Spaced repetition. Re-encounter what you forgot."',
      sr.rec.kind === 'review' && sr.rec.title === 'Review 7 cards' && sr.rec.min === 4 && sr.rec.sub === 'Spaced repetition. Re-encounter what you forgot.');
    test('Coming up: 7 days, Today first, counts from the review plan, exam day marked',
      sr.week.length === 7 && sr.week[0].label === 'Today' && sr.week[0].count === 7 && sr.week[1].label === 'Wed' && sr.week[1].count === 2
      && mk({ history: hist, readiness: rd, days: 2, sr: { todo: 7, later: 0, counts: [7, 2, 0, 0, 0, 0, 0] } }).week[2].isExam === true);
    test('Coming up is hidden when no reviews are scheduled in the next 7 days', ret.week === null);
    test('No reviews, returning: "15-min Weak Spots" on the weakest topic',
      ret.rec.kind === 'weak' && ret.rec.title === '15-min Weak Spots' && ret.rec.min === 15 && ret.rec.sub === '10 questions, exam level, on VLANs.');

    test('Momentum: done/goal, "1 day streak, best is 4. One short session adds another.", pick Ethernet Basics around 46%',
      ret.momentum.done === 0 && ret.momentum.goal === 20 && ret.momentum.streakLine === '1 day streak, best is 4. One short session adds another.'
      && ret.momentum.pick && ret.momentum.pick.topic === 'Ethernet Basics' && ret.momentum.pick.detail === 'around 46% accuracy');
    test('Momentum with no streak: "0 day streak. Finish today to start one."', nu.momentum.streakLine === '0 day streak. Finish today to start one.');
    test('Mistakes = wrong-bank size', ret.mistakes === 3 && nu.mistakes === 0);
    test('Domains: exam weight %, mastery from non-split history, untouched flag',
      ret.domains.length === 2 && ret.domains[0].name === 'Networking Concepts' && ret.domains[0].weightPct === 23
      && ret.domains[0].mastery === 80 && ret.domains[1].mastery === 50 && nu.domains[0].untouched === true);
    test('Domain mastery counts Mixed/exam practice (split rows), the same as the desktop bento', (() => {
      const mixed = [Object.assign(row('Mixed', 2, 4), {}), Object.assign(row('VLANs', 1, 2), { via: 'mixed-split' }), Object.assign(row('Ethernet Basics', 1, 2), { via: 'mixed-split' })];
      const m = mk({ history: mixed, readiness: rd });
      return m.domains[0].mastery === 50 && m.domains[1].mastery === 50 && m.domains[1].untouched === false;
    })());
    test('Cert header: mark N+, name Network+ (vendor prefix dropped), code N10-009',
      ret.cert.mark === 'N+' && ret.cert.name === 'Network+' && ret.cert.code === 'N10-009' && ret.streak === 1);
    // Stage 5b (28 Oct): the iOS app can be used signed out, so its Home shows Sign in too (no native override)
    test('Signed out: signedIn false on the web and in the iOS app; signed in: true',
      mk({ signedIn: false }).signedIn === false && mk({ signedIn: false, native: true }).signedIn === false && mk({ signedIn: true, native: true }).signedIn === true);
  } catch (err) {
    test('Lift A Home model: block (threw)', false);
    results.errors.push('480 ios-home-model block threw: ' + err.message);
  }
})();
