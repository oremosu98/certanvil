// tests/uat/520-per-cert-maps.js
// Scope: persona bundle Task 1. One exam date per cert (STORAGE.EXAM_DATES) and the per-cert
// maps cloud-store merges per cert (readiness_snapshots, exam_dates, exam_outcomes). Sync
// behaviour itself is driven for real in tests/cloud-sync-sim.js (asserted in UAT 310).
const { _fnBody, js, cloudStoreJs, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Per-cert exam dates and maps ──\x1b[0m');

  test('STORAGE declares EXAM_DATES and EXAM_OUTCOMES',
    /EXAM_DATES:\s*'nplus_exam_dates'/.test(js) && /EXAM_OUTCOMES:\s*'nplus_exam_outcomes'/.test(js));
  test('cloud-store: exam_dates and exam_outcomes are user data that syncs',
    /'nplus_exam_dates'/.test(cloudStoreJs) && /'nplus_exam_outcomes'/.test(cloudStoreJs));
  test('cloud-store: CERT_SCOPED merges readiness_snapshots, exam_dates and exam_outcomes per cert',
    /var CERT_SCOPED = \['sr', 'activated', 'onb_skips', 'readiness_snapshots', 'exam_dates', 'exam_outcomes'\]/.test(cloudStoreJs));

  // Behaviour: run the real readiness.js exam-date functions against a fake localStorage.
  function make(cert, init) {
    const store = new Map(Object.entries(init || {}));
    const flushed = [], events = [], dirty = [];
    const ctx = vm.createContext({
      window: { CURRENT_CERT: cert, dispatchEvent: (e) => events.push(e.type), cloudStore: { markCertDirty: (k, c) => dirty.push(k + ':' + c) } },
      Event: function (t) { this.type = t; },
      localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
      STORAGE: { EXAM_DATE: 'nplus_exam_date', EXAM_DATES: 'nplus_exam_dates' },
      _cloudFlush: (k) => flushed.push(k),
      JSON, Object, Array, Math, Date, String, isNaN
    });
    vm.runInContext(['_certKey', '_readExamDates', 'getExamDate', 'setExamDate', 'examDatesByCert', 'parseExamDate', 'getDaysToExam']
      .map((n) => _fnBody(js, n)).join('\n'), ctx);
    return { run: (src) => vm.runInContext(src, ctx), store, flushed, events, dirty };
  }
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  try {
    const a = make('netplus');
    a.run("setExamDate('2026-11-17')");
    a.run("setExamDate('2026-12-03', 'secplus')");
    const map = JSON.parse(a.store.get('nplus_exam_dates'));
    test("setExamDate('2026-12-03','secplus') leaves netplus untouched (map and the legacy single date)",
      map.netplus === '2026-11-17' && map.secplus === '2026-12-03' && a.store.get('nplus_exam_date') === '2026-11-17'
      && a.run('getExamDate()') === '2026-11-17' && a.run("getExamDate('secplus')") === '2026-12-03');
    test('setExamDate for another cert marks that cert dirty for sync (and only that one)',
      JSON.stringify(a.dirty) === JSON.stringify(['nplus_exam_dates:secplus']));
    test('setExamDate flushes the map and the legacy key, and fires ca:exam-date',
      a.flushed.indexOf('nplus_exam_dates') !== -1 && a.flushed.indexOf('nplus_exam_date') !== -1 && a.events.indexOf('ca:exam-date') !== -1);
    test('getExamDates() lists every cert with a date',
      JSON.stringify(a.run('examDatesByCert()')) === JSON.stringify({ netplus: '2026-11-17', secplus: '2026-12-03' })
      && /window\.getExamDates\s*=\s*examDatesByCert/.test(js));
    a.run("setExamDate('')");
    test('clearing the current cert keeps a null entry (so the clear survives the cloud merge) and drops the legacy date',
      JSON.parse(a.store.get('nplus_exam_dates')).netplus === null && !a.store.has('nplus_exam_date')
      && a.run('getExamDate()') === null && JSON.stringify(a.run('examDatesByCert()')) === JSON.stringify({ secplus: '2026-12-03' }));

    const t = new Date(); t.setDate(t.getDate() + 10);
    const o = new Date(); o.setDate(o.getDate() + 40);
    const b = make('secplus', { nplus_exam_dates: JSON.stringify({ netplus: iso(o), secplus: iso(t) }) });
    test('getDaysToExam() uses the current cert\'s date', b.run('getDaysToExam()') === 10);
    const c = make('az900', { nplus_exam_dates: JSON.stringify({ netplus: iso(o) }) });
    test('getDaysToExam() is null when only another cert has a date', c.run('getDaysToExam()') === null);
    const d = make('netplus', { nplus_exam_date: '2026-11-17' });
    test('a legacy single date is adopted for the current cert only',
      d.run("getExamDate('secplus')") === null && d.run('getExamDate()') === '2026-11-17'
      && JSON.parse(d.store.get('nplus_exam_dates')).netplus === '2026-11-17');
  } catch (e) {
    test('per-cert exam date behaviour (crashed: ' + e.message + ')', false);
  }
})();
