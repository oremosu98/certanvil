// tests/uat/521-streak-honest.js
// Scope: persona bundle Task 3. Streak and today's question count follow the phone's local day;
// getStreak() is honest when read (ended, endedFrom) and never writes; a UTC-stored `last` is
// tolerated as today/yesterday so the switch itself costs nobody a streak.
const { _fnBody, js, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Honest local-day streak ──\x1b[0m');
  const FNS = ['_localDay', '_readStreakRaw', '_streakDayKeys', 'getStreak(', 'updateStreak', 'getTodayQuestionCount'];
  // Run with a fixed clock in a given timezone. Date fields are real; only "now" is pinned.
  function run(tz, nowIso, store0, history, fn) {
    const prevTz = process.env.TZ; process.env.TZ = tz;
    try {
      const NOW = new Date(nowIso).getTime();
      class FD extends Date { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } }
      const store = new Map(Object.entries(store0 || {})); const writes = [];
      const ctx = vm.createContext({
        Date: FD, JSON, Math, Object, Array, String,
        window: {}, STORAGE: { STREAK: 'nplus_streak' },
        localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { writes.push(k); store.set(k, String(v)); } },
        _cloudFlush: () => {}, loadHistory: () => history || [], isHistorySplitRow: () => false
      });
      vm.runInContext(FNS.map((n) => _fnBody(js, n)).join('\n'), ctx);
      return fn(ctx, store, writes);
    } finally { if (prevTz === undefined) delete process.env.TZ; else process.env.TZ = prevTz; }
  }
  const S = (o) => ({ nplus_streak: JSON.stringify(o) });
  const ev = (c, k) => vm.runInContext(c, k);

  // 23:50 and 00:10 London (BST) are two local days, though 22:50Z and 23:10Z share a UTC day.
  const r1 = run('Europe/London', '2026-07-10T22:50:00Z', S({ current: 0, best: 0, last: null }), null, (c, st) => {
    ev('updateStreak()', c); return JSON.parse(st.get('nplus_streak'));
  });
  test('Local day: 23:50 local starts the streak on that local date', r1.current === 1 && r1.last === '2026-07-10');
  const r2 = run('Europe/London', '2026-07-10T23:10:00Z', S({ current: 1, best: 1, last: '2026-07-10' }), null, (c, st) => {
    ev('updateStreak()', c); return JSON.parse(st.get('nplus_streak'));
  });
  test('Local day: 00:10 local next day makes it 2 (UTC would call it one day)', r2.current === 2 && r2.last === '2026-07-11');

  const r3 = run('Europe/London', '2026-07-14T10:00:00Z', S({ current: 5, best: 5, last: '2026-07-11' }), null, (c, st, w) => {
    const g = ev('getStreak()', c); return { g, raw: st.get('nplus_streak'), writes: w.length };
  });
  test('Stale streak reads as ended: current 0, ended, endedFrom 5, best kept',
    r3.g.current === 0 && r3.g.ended === true && r3.g.endedFrom === 5 && r3.g.best === 5);
  test('Stale streak: getStreak() does not write storage',
    r3.writes === 0 && JSON.parse(r3.raw).current === 5);

  const r4 = run('Europe/London', '2026-07-12T10:00:00Z', S({ current: 5, best: 5, last: '2026-07-11' }), null, (c) => ev('getStreak()', c));
  test('Yesterday keeps the streak alive (not ended)', r4.current === 5 && r4.ended === false && r4.endedFrom === 0);

  // US Pacific evening 8pm Jul 10 = 03:00Z Jul 11: UTC is ahead. `last` stored as the UTC date.
  const r5 = run('America/Los_Angeles', '2026-07-11T03:00:00Z', S({ current: 3, best: 3, last: '2026-07-11' }), null, (c, st, w) => {
    const g = ev('getStreak()', c); const u = ev('updateStreak()', c); return { g, u, writes: w.length };
  });
  test('UTC-stored last (UTC ahead of local) still counts as today: alive, no increment, no write',
    r5.g.current === 3 && r5.g.ended === false && r5.u.current === 3 && r5.writes === 0);
  const r6 = run('America/Los_Angeles', '2026-07-11T03:00:00Z', S({ current: 3, best: 3, last: '2026-07-10' }), null, (c) => ev('updateStreak()', c));
  test('Last two days back restarts at 1; last from 2026-07-09... see next',
    run('America/Los_Angeles', '2026-07-11T03:00:00Z', S({ current: 3, best: 3, last: '2026-07-09' }), null, (c) => ev('updateStreak()', c)).current === 4
    && r6.current === 3);

  const hist = [
    { date: '2026-07-10T22:30:00Z', total: 4 },   // 23:30 BST Jul 10: not today (Jul 11)
    { date: '2026-07-10T23:30:00Z', total: 6 },   // 00:30 BST Jul 11: today
    { date: '2026-07-11T08:00:00Z', total: 5 }    // 09:00 BST Jul 11: today
  ];
  test('getTodayQuestionCount counts by local day', run('Europe/London', '2026-07-11T12:00:00Z', null, hist, (c) => ev('getTodayQuestionCount()', c)) === 11);
  test('Source: no toISOString left in the streak and today-count functions',
    !/toISOString/.test(_fnBody(js, 'getStreak(') + _fnBody(js, 'updateStreak') + _fnBody(js, 'getTodayQuestionCount')) || /toISOString\(\)\.slice\(0, 10\)/.test(_fnBody(js, '_streakDayKeys')));
})();
