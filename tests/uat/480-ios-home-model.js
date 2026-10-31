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
        ...(o.quiz ? { quizResumeState: () => o.quiz } : {}), ...(o.outcome ? { outcomeDue: () => true, getExamDate: () => o.outcome.date } : {}),
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
    const rd = { predicted: 553, recentAccuracy: 70, recentAnswers: 200, passProbability: 0.55, examReady: false, whatIf: [{ topic: 'VLANs' }] };

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
    test('Tier: Exam ready / Pass level / On track / Close / Behind',
      mk({ history: hist, readiness: Object.assign({}, rd, { examReady: true }) }).readiness.tier === 'Exam ready'
      && mk({ history: hist, readiness: Object.assign({}, rd, { predicted: 760 }) }).readiness.tier === 'Pass level'
      && ret.readiness.tier === 'On track'
      && mk({ history: hist, readiness: Object.assign({}, rd, { passProbability: 0.25 }) }).readiness.tier === 'Close'
      && mk({ history: hist, readiness: Object.assign({}, rd, { passProbability: 0.05 }) }).readiness.tier === 'Behind');

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
      ret.rec.kind === 'weak' && ret.rec.title === '15-min Weak Spots' && ret.rec.min === 15 && ret.rec.sub === '10 questions, exam level, on Ethernet Basics (around 46%).');
    test('The weak sub falls back to the readiness topic when the plan is empty',
      mk({ history: hist, readiness: rd, plan: [] }).rec.sub === '10 questions, exam level, on VLANs.');

    test('Momentum: done/goal, alive streak not yet studied today, no Pick up line',
      ret.momentum.done === 0 && ret.momentum.goal === 20 && ret.momentum.streakLine === '1-day streak. Study today to keep it.' && !('pick' in ret.momentum));
    test('Streak line: studied today -> "5-day streak. Today\'s done."',
      mk({ history: hist, readiness: rd, streak: { current: 5, best: 5 }, done: 3 }).momentum.streakLine === "5-day streak. Today's done."
      && mk({ history: hist, readiness: rd, streak: { current: 5, best: 5, last: '2026-10-20' } }).momentum.streakLine === "5-day streak. Today's done.");
    test('Streak line: ended -> "Your 5-day streak ended. Your best is 5. A quick set starts a new one."',
      mk({ history: hist, readiness: rd, streak: { current: 0, best: 5, ended: true, endedFrom: 5 } }).momentum.streakLine === 'Your 5-day streak ended. Your best is 5. A quick set starts a new one.');
    test('Streak line: none -> "No streak yet. Finish a set today to start one."', nu.momentum.streakLine === 'No streak yet. Finish a set today to start one.');
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
    // One next step (30 Oct): exam > quiz > reviews > outcome > first > warmup > weak
    const quiz = { topicLabel: 'Ports & Protocols', answered: 7, total: 10, left: 3, savedAt: 1 };
    const q = mk({ history: hist, readiness: rd, quiz, sr: { todo: 7, later: 0, counts: [7, 0, 0, 0, 0, 0, 0] } });
    test('A saved quiz beats reviews: "Finish your quiz · 3 left", 3 LEFT, "Ports & Protocols · 7 of 10 answered"',
      q.rec.kind === 'quiz' && q.rec.title === 'Finish your quiz · 3 left' && q.rec.badge === '3' && q.rec.unit === 'LEFT'
      && q.rec.kick === 'Pick up where you left off' && q.rec.sub === 'Ports & Protocols · 7 of 10 answered');
    const qr = mk({ history: hist, readiness: rd, quiz: { topicLabel: 'Ports & Protocols', answered: 10, total: 10, left: 0, savedAt: 1, ready: true } });
    test('A saved quiz with every question answered reads "See your results", "Ports & Protocols · all 10 answered" (never "0 left")',
      qr.rec.kind === 'quiz' && qr.rec.title === 'See your results' && qr.rec.sub === 'Ports & Protocols · all 10 answered' && !/0 left/.test(qr.rec.title));
    test('Ready quiz badge is a tick: no numeric badge, no LEFT unit, icon "tick"',
      qr.rec.badge == null && qr.rec.unit == null && qr.rec.icon === 'tick' && !/\d|LEFT/i.test(String(qr.rec.badge || '') + String(qr.rec.unit || '')));
    test('A mid-quiz card keeps its number badge and LEFT unit, no icon', q.rec.badge === '3' && q.rec.unit === 'LEFT' && !q.rec.icon);
    test('Home never finishes the quiz itself (no finish() call in the Home model or its actions)', !/\bfinish\(\)/.test(_fnBody(js, '_iosHomeModel')));
    test('A paused exam still beats a saved quiz', mk({ history: hist, readiness: rd, quiz, store: { nplus_exam_state: paused } }).rec.kind === 'exam');
    const oc = mk({ history: hist, readiness: rd, outcome: { date: '2026-10-19' } });
    test('Outcome due: "How did your Network+ exam go?" with the kicker and sub, beats first/warmup/weak',
      oc.rec.kind === 'outcome' && oc.rec.kick === 'Your exam was yesterday' && oc.rec.title === 'How did your Network+ exam go?' && oc.rec.sub === "Tell us and we'll update your plan.");
    test('Reviews due beat the outcome card', mk({ history: hist, readiness: rd, outcome: { date: '2026-10-19' }, sr: { todo: 2, later: 0, counts: [2, 0, 0, 0, 0, 0, 0] } }).rec.kind === 'review');
    test('Outcome kicker counts days from the exam date: 2 days -> "Your exam was 2 days ago"; no date -> "Your exam date has passed"',
      mk({ outcome: { date: '2026-10-18' } }).rec.kick === 'Your exam was 2 days ago' && mk({ outcome: { date: null } }).rec.kick === 'Your exam date has passed');
    test('Outcome due beats the first quiz', mk({ outcome: { date: '2026-10-18' } }).rec.kind === 'outcome');
    test('Missing producers: no quiz or outcome card appears, rec falls through', ret.rec.kind === 'weak' && nu.rec.kind === 'first');
    const away3 = [Object.assign(row('Ethernet Basics', 8, 10), { date: new Date(TUE_9AM.getTime() - 3 * 86400000).toISOString() })];
    const aw = mk({ history: away3, readiness: rd });
    test('Away 3 days, no reviews: kind warmup, "5-min Warmup", "Ease back in. 5 questions, foundational."',
      aw.rec.kind === 'warmup' && aw.rec.title === '5-min Warmup' && aw.rec.min === 5 && aw.rec.sub === 'Ease back in. 5 questions, foundational.');
    test('Away 3 days WITH reviews due: reviews win; away only 1 day: weak spots',
      mk({ history: away3, readiness: rd, sr: { todo: 3, later: 0, counts: [3, 0, 0, 0, 0, 0, 0] } }).rec.kind === 'review' && ret.rec.kind === 'weak');
    test('Away 3 days with a saved quiz: the quiz wins', mk({ history: away3, readiness: rd, quiz }).rec.kind === 'quiz');
    const outc = (o) => ({ nplus_exam_outcomes: JSON.stringify({ netplus: o }) });
    const ps = mk({ history: hist, readiness: rd, store: outc({ outcome: 'passed', score: 812, predicted: 553, date: '2026-10-19' }) });
    test('Passed: passed flag, rec nextcert "Pick your next cert", kicker "Network+ passed · scored 812", prediction + streak sub',
      ps.passed === true && ps.rec.kind === 'nextcert' && ps.rec.title === 'Pick your next cert' && ps.rec.kick === 'Network+ passed · scored 812'
      && ps.rec.sub === 'We predicted 553 on exam day. Your streak carries on with your next cert.' && ret.passed === false);
    test('Passed with reviews due: reviews still lead (kind review)', mk({ history: hist, readiness: rd, store: outc({ outcome: 'passed' }), sr: { todo: 2, later: 0, counts: [2, 0, 0, 0, 0, 0, 0] } }).rec.kind === 'review');
    test('Passed with an outcome due: outcome card leads', mk({ history: hist, readiness: rd, store: outc({ outcome: 'passed' }), outcome: { date: '2026-10-19' } }).rec.kind === 'outcome');
    test('Didn\'t pass is not "passed"', mk({ history: hist, readiness: rd, store: outc({ outcome: 'failed' }) }).passed === false);
    // Stage 5b (28 Oct): the iOS app can be used signed out, so its Home shows Sign in too (no native override)
    test('Signed out: signedIn false on the web and in the iOS app; signed in: true',
      mk({ signedIn: false }).signedIn === false && mk({ signedIn: false, native: true }).signedIn === false && mk({ signedIn: true, native: true }).signedIn === true);
  } catch (err) {
    test('Lift A Home model: block (threw)', false);
    results.errors.push('480 ios-home-model block threw: ' + err.message);
  }
})();
