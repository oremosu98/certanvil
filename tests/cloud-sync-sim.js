// tests/cloud-sync-sim.js — drives the REAL cloud-store.js against an in-memory
// fake Supabase and prints one JSON object of scenario results. Run by
// tests/uat/310-cloud-sync-merge-first.js (UAT is synchronous; this is async).
//
// Why (v8.151.0): sync had never worked (session accessor read a supabase-js v1
// field), and hydrate() overwrote local data with the cloud copy. These
// scenarios pin the merge-first rules so fixing the accessor can never wipe a
// student's only copy of their history.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'cloud-store.js'), 'utf8');

function makeLocal(init) {
  const m = new Map(Object.entries(init || {}));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    key: (i) => Array.from(m.keys())[i] || null,
    get length() { return m.size; },
    _m: m
  };
}

// Minimal PostgREST-ish fake. db = { profile: {metadata, exam_date}, history: [rows], failMetaRead }
function makeSupabase(db, userId) {
  const calls = { profileUpdates: 0, historyInserts: 0, inserted: 0 };
  function builder(table) {
    const st = { table, op: 'select', filters: [], payload: null, single: false };
    const api = {
      select() { st.op = st.op === 'select' ? 'select' : st.op; return api; },
      eq(col, val) { st.filters.push(['eq', col, val]); return api; },
      gte(col, val) { st.filters.push(['gte', col, val]); return api; },
      order() { return api; },
      limit() { return api; },
      single() { st.single = true; return api; },
      update(obj) { st.op = 'update'; st.payload = obj; return api; },
      insert(rows) { st.op = 'insert'; st.payload = rows; return api; },
      then(res, rej) { return Promise.resolve().then(run).then(res, rej); }
    };
    function run() {
      if (table === 'profiles') {
        if (st.op === 'update') { calls.profileUpdates++; Object.assign(db.profile, st.payload); return { data: null, error: null }; }
        if (db.failMetaRead) return { data: null, error: { message: 'read failed' } };
        return { data: { metadata: db.profile.metadata, exam_date: db.profile.exam_date || null, role: 'user' }, error: null };
      }
      if (table === 'quiz_history') {
        if (st.op === 'insert') { calls.historyInserts++; calls.inserted += st.payload.length; st.payload.forEach(r => db.history.push(r)); return { data: st.payload, error: null }; }
        let rows = db.history.filter(r => r.user_id === userId);
        st.filters.forEach(([op, col, val]) => {
          if (op === 'gte') rows = rows.filter(r => r[col] >= val);
          if (op === 'eq' && col !== 'user_id') rows = rows.filter(r => r[col] === val);
        });
        return { data: rows.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1)), error: null };
      }
      if (table === 'client_errors') return { data: null, error: null };
      return { data: null, error: null };
    }
    return api;
  }
  return { client: { from: builder, auth: {} }, calls };
}

function boot(localInit, db, cert) {
  const userId = 'u1';
  const ls = makeLocal(localInit);
  const sb = makeSupabase(db, userId);
  const timers = [];
  const win = { certanvilSupabase: sb.client, CURRENT_CERT: cert || 'secplus', addEventListener() {} };
  const ctx = {
    window: win, localStorage: ls, location: { hostname: 'localhost' },
    navigator: { onLine: true, userAgent: 'sim' },
    document: { addEventListener() {}, visibilityState: 'visible' },
    setTimeout: (fn) => { timers.push(fn); return timers.length; }, clearTimeout: () => {},
    console: { log() {}, warn() {}, error() {} },
    Promise, Date, Set, Map, JSON, Object, Array, String, Number, Math
  };
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  const cs = win.cloudStore;
  return { cs, ls, db, calls: sb.calls, session: { user: { id: userId } }, timers };
}

const H = (date, topic, score, total) => ({ date, topic, difficulty: 'Exam Level', score, total, pct: Math.round(100 * score / total), mode: 'quiz' });

async function main() {
  const out = {};

  // 1. Empty cloud, real local data: hydrate must not touch local; then local goes UP.
  {
    const hist = [H('2026-10-10T10:00:00.000Z', 'Security Controls', 3, 4), H('2026-10-09T10:00:00.000Z', 'PKI', 2, 3), H('2026-10-08T10:00:00.000Z', 'IAM', 1, 2)];
    const local = { nplus_history: JSON.stringify(hist), nplus_sr_queue: JSON.stringify([{ qHash: 'a', question: 'Q1' }]),
      nplus_wrong_bank: JSON.stringify([{ question: 'W1' }]), nplus_streak: JSON.stringify({ current: 5, best: 9 }), nplus_exam_date: '2026-10-16' };
    const db = { profile: { metadata: {}, exam_date: null }, history: [] };
    const b = boot(local, db);
    b.cs.flush('nplus_streak');                    // pre-hydrate write: must NOT upload
    const preHydrateUpdates = b.calls.profileUpdates;
    const safeBefore = b.cs.isSafeToClear();
    b.cs.setSession(b.session);
    b.cs.flush('nplus_streak');
    await Promise.resolve();
    const preHydrateUpdates2 = b.calls.profileUpdates;
    await b.cs.hydrate();
    const localAfterHydrate = { hist: JSON.parse(b.ls.getItem('nplus_history')).length, sr: b.ls.getItem('nplus_sr_queue'), wb: b.ls.getItem('nplus_wrong_bank'), exam: b.ls.getItem('nplus_exam_date') };
    await b.cs.flushNow();
    out.s1 = {
      preHydrateNoUpload: preHydrateUpdates === 0 && preHydrateUpdates2 === 0,
      notSafeBeforeSync: safeBefore === false,
      localUntouched: localAfterHydrate.hist === 3 && localAfterHydrate.sr === local.nplus_sr_queue && localAfterHydrate.wb === local.nplus_wrong_bank && localAfterHydrate.exam === '2026-10-16',
      cloudGotSr: !!(db.profile.metadata.sr && db.profile.metadata.sr.secplus && db.profile.metadata.sr.secplus.queue[0].qHash === 'a'),
      cloudGotBank: Array.isArray(db.profile.metadata.wrong_bank) && db.profile.metadata.wrong_bank[0].question === 'W1',
      cloudGotStreak: db.profile.metadata.streak && db.profile.metadata.streak.best === 9,
      cloudGotExamDate: db.profile.exam_date === '2026-10-16',
      historyUploaded: db.history.length === 3,
      createdAtIsQuizTime: db.history.some(r => r.created_at === '2026-10-09T10:00:00.000Z'),
      safeAfterSync: b.cs.isSafeToClear() === true
    };
    // 2. Re-sync: no duplicate history rows.
    b.cs.flush('nplus_history');
    await b.cs.flushNow();
    await b.cs.flushNow();
    out.s2 = { noDuplicates: db.history.length === 3 };
    // 2b. A second hydrate (token refresh) is still merge-only and adds nothing.
    await b.cs.hydrate();
    await b.cs.flushNow();
    out.s2.secondHydrateSafe = JSON.parse(b.ls.getItem('nplus_history')).length === 3 && db.history.length === 3;
  }

  // 3. Fresh device: cloud fills an empty local.
  {
    const db = { profile: { metadata: { wrong_bank: [{ question: 'C1' }], streak: { current: 2, best: 4 }, sr: { secplus: { queue: [{ qHash: 'z' }] } } }, exam_date: '2026-10-16' },
      history: [{ user_id: 'u1', cert: 'secplus', topic: 'PKI', difficulty: 'Exam Level', mode: 'quiz', score: 2, total: 3, metadata: { date: '2026-10-09T10:00:00.000Z', pct: 67 }, created_at: '2026-10-09T10:00:00.000Z' }] };
    const b = boot({}, db);
    b.cs.setSession(b.session);
    await b.cs.hydrate();
    await b.cs.flushNow();
    out.s3 = {
      filled: JSON.parse(b.ls.getItem('nplus_wrong_bank') || '[]')[0]?.question === 'C1'
        && JSON.parse(b.ls.getItem('nplus_sr_queue') || '[]')[0]?.qHash === 'z'
        && JSON.parse(b.ls.getItem('nplus_history') || '[]').length === 1
        && b.ls.getItem('nplus_exam_date') === '2026-10-16',
      cloudNotDuplicated: db.history.length === 1
    };
  }

  // 4. Both sides have data: local wins per key; history is a union; cloud-only keys survive.
  {
    const db = { profile: { metadata: { wrong_bank: [{ question: 'CLOUD' }], milestones: { secplus: { first: 'x' } }, migration_v1_at: '2026-05-01' } },
      history: [
        { user_id: 'u1', cert: 'secplus', topic: 'PKI', difficulty: 'Exam Level', mode: 'quiz', score: 2, total: 3, metadata: { date: '2026-10-09T10:00:00.000Z' }, created_at: '2026-10-09T10:00:00.000Z' },
        { user_id: 'u1', cert: 'secplus', topic: 'IAM', difficulty: 'Exam Level', mode: 'quiz', score: 1, total: 1, metadata: { date: '2026-10-07T10:00:00.000Z' }, created_at: '2026-10-07T10:00:00.000Z' }] };
    const local = { nplus_wrong_bank: JSON.stringify([{ question: 'LOCAL' }]),
      nplus_history: JSON.stringify([H('2026-10-10T10:00:00.000Z', 'Security Controls', 3, 4), H('2026-10-09T10:00:00.000Z', 'PKI', 2, 3)]) };
    const b = boot(local, db);
    b.cs.setSession(b.session);
    await b.cs.hydrate();
    await b.cs.flushNow();
    const lh = JSON.parse(b.ls.getItem('nplus_history'));
    out.s4 = {
      localWins: JSON.parse(b.ls.getItem('nplus_wrong_bank'))[0].question === 'LOCAL',
      historyUnion: lh.length === 3 && lh[0].topic === 'Security Controls',
      cloudOnlyKeysKept: !!(db.profile.metadata.milestones && db.profile.metadata.milestones.secplus) && db.profile.metadata.migration_v1_at === '2026-05-01',
      cloudHistoryComplete: db.history.length === 3
    };
  }

  // 5. Metadata read failure: never write the profile blind.
  {
    const db = { profile: { metadata: { streak: { best: 50 } } }, history: [], failMetaRead: false };
    const b = boot({ nplus_streak: JSON.stringify({ current: 1, best: 1 }) }, db);
    b.cs.setSession(b.session);
    await b.cs.hydrate();
    db.failMetaRead = true;
    const before = b.calls.profileUpdates;
    await b.cs.flushNow();
    out.s5 = { noBlindWrite: b.calls.profileUpdates === before, notSafeAfterError: b.cs.isSafeToClear() === false };
  }

  // 6. Cross-cert: the Sec+ device must not pull Network+ history (v8.155.0).
  {
    const db = { profile: { metadata: {} }, history: [
      { user_id: 'u1', cert: 'netplus', topic: 'Subnetting', difficulty: 'Exam Level', mode: 'quiz', score: 1, total: 1, metadata: { date: '2026-10-09T10:00:00.000Z' }, created_at: '2026-10-09T10:00:00.000Z' },
      { user_id: 'u1', cert: 'secplus', topic: 'PKI', difficulty: 'Exam Level', mode: 'quiz', score: 1, total: 1, metadata: { date: '2026-10-08T10:00:00.000Z' }, created_at: '2026-10-08T10:00:00.000Z' }] };
    const b = boot({}, db, 'secplus');
    b.cs.setSession(b.session);
    await b.cs.hydrate();
    await b.cs.flushNow();
    const lh = JSON.parse(b.ls.getItem('nplus_history') || '[]');
    out.s6 = { onlyThisCert: lh.length === 1 && lh[0].topic === 'PKI', noReupload: db.history.length === 2 };
  }

  return out;
}

main().then(r => { process.stdout.write(JSON.stringify(r)); }, e => { process.stdout.write(JSON.stringify({ crashed: String(e && e.stack || e) })); });
