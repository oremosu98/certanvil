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
      select() { if (st.op !== 'select') st.returning = true; return api; },
      eq(col, val) { st.filters.push(['eq', col, val]); return api; },
      is(col, val) { st.filters.push(['is', col, val]); return api; },
      gte(col, val) { st.filters.push(['gte', col, val]); return api; },
      order() { return api; },
      limit() { return api; },
      single() { st.single = true; return api; },
      update(obj) { st.op = 'update'; st.payload = obj; return api; },
      insert(rows) { st.op = 'insert'; st.payload = rows; return api; },
      // v8.198.1: db.readHold (a promise) holds a profile read's answer back AFTER the row was read, so a test can
      // land a server change between an in-flight flush's read and its write.
      then(res, rej) {
        return Promise.resolve().then(run).then(function (out) {
          if (table === 'profiles' && st.op === 'select' && db.readHold) { const h = db.readHold; return h.then(function () { return out; }); }
          return out;
        }).then(res, rej);
      }
    };
    // metadata->>key filters on an update (a compare-and-set): true when the row still matches.
    function rowMatches() {
      return st.filters.every(([op, col, val]) => {
        const m = /^metadata->>(.+)$/.exec(col);
        if (!m) return true;
        const cur = db.profile.metadata ? db.profile.metadata[m[1]] : undefined;
        if (op === 'is') return cur == null && val === null;
        if (op === 'eq') return cur != null && String(cur) === String(val);
        return true;
      });
    }
    function run() {
      if (table === 'profiles') {
        if (st.op === 'update') {
          if (!rowMatches()) { calls.refusedUpdates = (calls.refusedUpdates || 0) + 1; return { data: st.returning ? [] : null, error: null }; }
          calls.profileUpdates++; Object.assign(db.profile, JSON.parse(JSON.stringify(st.payload))); return { data: st.returning ? [{ id: userId }] : null, error: null };
        }
        if (db.failMetaRead) return { data: null, error: { message: 'read failed' } };
        if (db.afterRead) {   // v8.198.1: a server change that lands after this read is answered
          const snap = JSON.parse(JSON.stringify(db.profile.metadata || {}));
          db.afterRead();
          return { data: { metadata: snap, exam_date: db.profile.exam_date || null, role: 'user' }, error: null };
        }
        // a copy, like a real response: a later server change must not reach a read that already happened
        return { data: { metadata: JSON.parse(JSON.stringify(db.profile.metadata || {})), exam_date: db.profile.exam_date || null, role: 'user' }, error: null };
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
      if (table === 'client_errors') { calls.telemetry = (calls.telemetry || 0) + 1; return { data: null, error: null }; }
      return { data: null, error: null };
    }
    return api;
  }
  return { client: { from: builder, auth: {} }, calls };
}

function boot(localInit, db, cert, hostname) {
  const userId = 'u1';
  const ls = makeLocal(localInit);
  const sb = makeSupabase(db, userId);
  const timers = [];
  const win = { certanvilSupabase: sb.client, CURRENT_CERT: cert || 'secplus', addEventListener() {} };
  const ctx = {
    window: win, localStorage: ls, location: { hostname: hostname || 'localhost' },
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

  // 7. v8.198.1: account deletion vs an in-flight flush. The server stamps metadata.deletion_requested_at (rpc) and
  // removes metadata.deletion_cancelled_at (clear_deletion_notice); a client flush must never undo either.
  {
    const hold = () => { let release; const p = new Promise((r) => { release = r; }); return { p, release }; };
    const tick = () => new Promise((r) => setTimeout(r, 0));
    const settle = async () => { for (let i = 0; i < 10; i++) await tick(); };   // lets a released write land
    const start = async (b) => {      // start a debounced flush and let it read the row
      b.cs.flush('nplus_streak');
      const fn = b.timers.pop(); fn();
      await tick(); await tick();
    };

    // 7a. flushNow() waits for a flush already in flight, even with nothing new pending.
    {
      const db = { profile: { metadata: { streak: { best: 1 } } }, history: [] };
      const b = boot({ nplus_streak: JSON.stringify({ current: 2, best: 2 }) }, db);
      b.cs.setSession(b.session);
      await b.cs.hydrate();
      const h = hold(); db.readHold = h.p;
      await start(b);
      let settled = false;
      const p = b.cs.flushNow().then(() => { settled = true; });
      await tick(); await tick();
      const settledEarly = settled;
      h.release(); db.readHold = null;
      await p;
      out.s7a = { waitsForInflight: settledEarly === false && settled === true && b.calls.profileUpdates >= 1 };
    }

    // 7b. A flush that read the row before the rpc and writes after it does not erase the mark.
    {
      const db = { profile: { metadata: { streak: { best: 1 } } }, history: [] };
      const b = boot({ nplus_streak: JSON.stringify({ current: 2, best: 2 }) }, db);
      b.cs.setSession(b.session);
      await b.cs.hydrate();
      const h = hold(); db.readHold = h.p;
      await start(b);
      db.profile.metadata = Object.assign({}, db.profile.metadata, { deletion_requested_at: '2026-10-29T12:00:00.000Z' });   // the rpc lands
      h.release(); db.readHold = null;
      await b.cs.flushNow().catch(() => {}); await settle();
      const markAfterRace = db.profile.metadata.deletion_requested_at;
      await b.cs.flushNow().catch(() => {}); await settle();      // the refused write's keys retry against the fresh row
      out.s7b = {
        markKept: markAfterRace === '2026-10-29T12:00:00.000Z' && db.profile.metadata.deletion_requested_at === '2026-10-29T12:00:00.000Z',
        dataStillSynced: db.profile.metadata.streak && db.profile.metadata.streak.best === 2
      };
    }

    // 7c. A flush that read the row before clear_deletion_notice does not bring deletion_cancelled_at back.
    {
      const db = { profile: { metadata: { streak: { best: 1 }, deletion_cancelled_at: '2026-10-29T09:00:00.000Z' } }, history: [] };
      const b = boot({ nplus_streak: JSON.stringify({ current: 2, best: 2 }) }, db);
      b.cs.setSession(b.session);
      await b.cs.hydrate();
      const h = hold(); db.readHold = h.p;
      await start(b);
      const m = Object.assign({}, db.profile.metadata); delete m.deletion_cancelled_at; db.profile.metadata = m;   // clear_deletion_notice lands
      h.release(); db.readHold = null;
      await b.cs.flushNow().catch(() => {}); await settle();
      await b.cs.flushNow().catch(() => {}); await settle();
      out.s7c = { noticeNotResurrected: !('deletion_cancelled_at' in db.profile.metadata) && db.profile.metadata.streak.best === 2 };
    }

    // 7d. An ordinary flush leaves both server-owned keys exactly as the server has them, whatever this device holds.
    {
      const db = { profile: { metadata: { deletion_requested_at: '2026-10-29T12:00:00.000Z' } }, history: [] };
      const b = boot({ nplus_streak: JSON.stringify({ current: 3, best: 3 }) }, db);
      b.cs.setSession(b.session);
      await b.cs.hydrate();
      b.cs.flush('nplus_streak');
      await b.cs.flushNow();
      out.s7d = { unchanged: db.profile.metadata.deletion_requested_at === '2026-10-29T12:00:00.000Z' && !('deletion_cancelled_at' in db.profile.metadata)
        && db.profile.metadata.streak.best === 3 };
    }
  }

  // 8. v8.198.1 review: a compare-and-set miss retries by itself, through the real timer path, and only twice.
  // Here the stubbed setTimeout's callbacks are run by the test (runTimers), never a manual flushNow().
  {
    const tick = () => new Promise((r) => setTimeout(r, 0));
    const settle = async () => { for (let i = 0; i < 10; i++) await tick(); };
    const runTimers = async (b) => { let n = 0; while (b.timers.length) { const fn = b.timers.shift(); fn(); n++; await settle(); } return n; };

    // 8a. hydrate's post-merge flush races clear_deletion_notice (the welcome-back sign-in): one conflict, one automatic retry.
    {
      const db = { profile: { metadata: { streak: { best: 1 }, deletion_cancelled_at: '2026-10-29T09:00:00.000Z' } }, history: [] };
      const b = boot({ nplus_streak: JSON.stringify({ current: 2, best: 2 }) }, db, 'secplus', 'networkplus.certanvil.com');
      b.cs.setSession(b.session);
      await b.cs.hydrate();
      let fired = false;
      db.afterRead = () => { if (fired) return; fired = true; const m = Object.assign({}, db.profile.metadata); delete m.deletion_cancelled_at; db.profile.metadata = m; };
      const fn = b.timers.shift(); fn(); await settle();          // hydrate's 50ms flush: reads, the rpc lands, the write is refused
      const statusAfterConflict = b.cs.getStatus();
      const refused = b.calls.refusedUpdates || 0;
      const retries = await runTimers(b);                         // the retry the conflict scheduled
      out.s8a = {
        retried: refused === 1 && retries === 1 && b.calls.profileUpdates === 1,
        synced: db.profile.metadata.streak.best === 2 && !('deletion_cancelled_at' in db.profile.metadata),
        pendingNotError: statusAfterConflict === 'pending' && b.cs.getStatus() === 'idle',
        noTelemetry: !(b.calls.telemetry > 0)
      };
    }

    // 8b. A conflict that never clears stops after two retries.
    {
      const db = { profile: { metadata: { streak: { best: 1 }, deletion_cancelled_at: 't0' } }, history: [] };
      const b = boot({ nplus_streak: JSON.stringify({ current: 2, best: 2 }) }, db);
      b.cs.setSession(b.session);
      await b.cs.hydrate();
      let n = 0;
      db.afterRead = () => { n++; db.profile.metadata = Object.assign({}, db.profile.metadata, { deletion_cancelled_at: 't' + n }); };
      const ran = await runTimers(b);                             // hydrate's flush + every retry it schedules
      out.s8b = { capped: ran === 3 && b.calls.refusedUpdates === 3 && b.calls.profileUpdates === 0 && b.timers.length === 0 };
    }
  }

  // 9. Persona bundle: per-cert maps (readiness_snapshots, exam_dates, exam_outcomes) merge per cert.
  {
    // 9a. per-cert maps survive a sibling flush: a secplus device's write lands after this netplus device
    // hydrated, then netplus flushes its own map. The cloud keeps both certs in both maps.
    {
      const db = { profile: { metadata: {} }, history: [] };
      const b = boot({ nplus_exam_dates: JSON.stringify({ netplus: '2026-11-17' }),
        nplus_readiness_snapshots: JSON.stringify({ netplus: { score: 553 } }) }, db, 'netplus');
      b.cs.setSession(b.session);
      await b.cs.hydrate();
      await b.cs.flushNow();
      db.profile.metadata = Object.assign({}, db.profile.metadata, {   // the sibling subdomain's flush
        exam_dates: { secplus: '2026-12-03' }, readiness_snapshots: { secplus: { score: 612 } } });
      b.cs.flush('nplus_exam_dates'); b.cs.flush('nplus_readiness_snapshots');
      await b.cs.flushNow();
      const m = db.profile.metadata;
      out.s9a = { bothKept: !!(m.exam_dates && m.exam_dates.secplus === '2026-12-03' && m.exam_dates.netplus === '2026-11-17'
        && m.readiness_snapshots && m.readiness_snapshots.secplus && m.readiness_snapshots.secplus.score === 612
        && m.readiness_snapshots.netplus && m.readiness_snapshots.netplus.score === 553) };
    }
    // 9b. hydrate merges sibling certs into the local map: cloud fills the certs this device lacks,
    // this device keeps its own entries (a cleared date, null, included), an empty local map is filled.
    {
      const outcome = { outcome: 'passed', score: 790, date: '2026-10-20', predicted: 760, at: '2026-10-20T15:00:00.000Z' };
      const db = { profile: { metadata: {
        exam_dates: { secplus: '2026-12-03', netplus: '2099-01-01', az900: '2026-12-20' },
        readiness_snapshots: { secplus: { score: 612 }, netplus: { score: 1 } },
        exam_outcomes: { secplus: outcome } } }, history: [] };
      const b = boot({ nplus_exam_dates: JSON.stringify({ netplus: '2026-11-17', az900: null }),
        nplus_readiness_snapshots: JSON.stringify({ netplus: { score: 553 } }) }, db, 'netplus');
      b.cs.setSession(b.session);
      await b.cs.hydrate();
      const ed = JSON.parse(b.ls.getItem('nplus_exam_dates') || '{}');
      const rs = JSON.parse(b.ls.getItem('nplus_readiness_snapshots') || '{}');
      const eo = JSON.parse(b.ls.getItem('nplus_exam_outcomes') || '{}');
      await b.cs.flushNow();
      out.s9b = {
        siblingsIn: ed.secplus === '2026-12-03' && rs.secplus && rs.secplus.score === 612 && eo.secplus && eo.secplus.score === 790,
        localWins: ed.netplus === '2026-11-17' && rs.netplus.score === 553,
        siblingFromCloud: ed.az900 === '2026-12-20',   // a sibling entry this device never wrote follows the cloud
        cloudAfter: db.profile.metadata.exam_dates.netplus === '2026-11-17' && db.profile.metadata.exam_dates.az900 === '2026-12-20'
          && db.profile.metadata.exam_dates.secplus === '2026-12-03'
      };
    }
    // 9c. once the cloud has the map, profiles.exam_date (whichever cert flushed last) does not seed
    // another cert's legacy date; this cert's map entry does.
    {
      const db = { profile: { metadata: { exam_dates: { secplus: '2026-12-03' } }, exam_date: '2026-12-03' }, history: [] };
      const b = boot({}, db, 'netplus');
      b.cs.setSession(b.session);
      await b.cs.hydrate();
      const db2 = { profile: { metadata: { exam_dates: { secplus: '2026-12-03', netplus: '2026-11-17' } }, exam_date: '2026-12-03' }, history: [] };
      const b2 = boot({}, db2, 'netplus');
      b2.cs.setSession(b2.session);
      await b2.cs.hydrate();
      const db3 = { profile: { metadata: {} , exam_date: '2026-11-17' }, history: [] };   // pre-map cloud: the column still seeds
      const b3 = boot({}, db3, 'netplus');
      b3.cs.setSession(b3.session);
      await b3.cs.hydrate();
      out.s9c = { noLeak: b.ls.getItem('nplus_exam_date') === null && b2.ls.getItem('nplus_exam_date') === '2026-11-17'
        && b3.ls.getItem('nplus_exam_date') === '2026-11-17' };
    }
    // 9e. Fix round 1 regression: a stale sibling copy never goes back up. netplus holds secplus:A, the cloud
    // moves to secplus:B (a secplus session), netplus flushes after its own quiz: the cloud keeps B, and a
    // later netplus hydrate shows B.
    {
      const db = { profile: { metadata: { readiness_snapshots: { secplus: { score: 612 } }, exam_dates: { secplus: '2026-12-03' } } }, history: [] };
      const b = boot({ nplus_readiness_snapshots: JSON.stringify({ netplus: { score: 553 } }) }, db, 'netplus');
      b.cs.setSession(b.session);
      await b.cs.hydrate();
      await b.cs.flushNow();
      const pulledA = JSON.parse(b.ls.getItem('nplus_readiness_snapshots')).secplus.score === 612;
      db.profile.metadata = Object.assign({}, db.profile.metadata, {   // the secplus subdomain flushes newer values
        readiness_snapshots: Object.assign({}, db.profile.metadata.readiness_snapshots, { secplus: { score: 700 } }),
        exam_dates: Object.assign({}, db.profile.metadata.exam_dates, { secplus: '2026-12-10' }) });
      const rs = JSON.parse(b.ls.getItem('nplus_readiness_snapshots')); rs.netplus = { score: 560 };   // netplus quiz
      b.ls.setItem('nplus_readiness_snapshots', JSON.stringify(rs));
      b.cs.flush('nplus_readiness_snapshots'); b.cs.flush('nplus_exam_dates');
      await b.cs.flushNow();
      const m = db.profile.metadata;
      const cloudKeepsB = m.readiness_snapshots.secplus.score === 700 && m.exam_dates.secplus === '2026-12-10' && m.readiness_snapshots.netplus.score === 560;
      await b.cs.hydrate();
      await b.cs.flushNow();
      const local = JSON.parse(b.ls.getItem('nplus_readiness_snapshots'));
      const ld = JSON.parse(b.ls.getItem('nplus_exam_dates') || '{}');
      out.s9e = { pulledA, cloudKeepsB, hydrateShowsB: local.secplus.score === 700 && ld.secplus === '2026-12-10' && local.netplus.score === 560 };
    }
    // 9f. A sibling cert this device explicitly wrote (marked dirty) goes up once, then follows the cloud again;
    // a cleared current-cert date (null) wins over the cloud on hydrate and goes up; the legacy date follows the map.
    {
      const db = { profile: { metadata: { exam_dates: { secplus: '2026-12-03', netplus: '2026-11-17' } }, exam_date: '2026-11-17' }, history: [] };
      const b = boot({ nplus_exam_dates: JSON.stringify({ netplus: null }), nplus_exam_date: '2026-01-01' }, db, 'netplus');
      b.cs.setSession(b.session);
      await b.cs.hydrate();
      const legacyGone = b.ls.getItem('nplus_exam_date') === null;   // map entry null wins over the stale legacy date
      await b.cs.flushNow();
      const nullUp = db.profile.metadata.exam_dates.netplus === null;
      const ed = JSON.parse(b.ls.getItem('nplus_exam_dates')); ed.secplus = '2027-01-15';   // setExamDate('2027-01-15','secplus')
      b.ls.setItem('nplus_exam_dates', JSON.stringify(ed));
      b.cs.markCertDirty('nplus_exam_dates', 'secplus');
      b.cs.flush('nplus_exam_dates');
      await b.cs.flushNow();
      const dirtyUp = db.profile.metadata.exam_dates.secplus === '2027-01-15';
      const dirtyCleared = b.ls.getItem('nplus_cert_dirty') === null;
      db.profile.metadata = Object.assign({}, db.profile.metadata, { exam_dates: Object.assign({}, db.profile.metadata.exam_dates, { secplus: '2027-02-01' }) });
      b.cs.flush('nplus_exam_dates');
      await b.cs.flushNow();
      out.s9f = { legacyGone, nullUp, dirtyUp, dirtyCleared, afterwardsCloudWins: db.profile.metadata.exam_dates.secplus === '2027-02-01' };
    }
    // 9g. hydrate: the legacy single date is synced from this cert's map entry.
    {
      const db = { profile: { metadata: {} , exam_date: '2026-09-09' }, history: [] };
      const b = boot({ nplus_exam_dates: JSON.stringify({ netplus: '2026-11-17' }), nplus_exam_date: '2026-01-01' }, db, 'netplus');
      b.cs.setSession(b.session);
      await b.cs.hydrate();
      out.s9g = { legacyFollowsMap: b.ls.getItem('nplus_exam_date') === '2026-11-17' };
    }
    // 9d. legacy exam date adopts the current cert (features/readiness.js getExamDate, run for real).
    {
      const RS = fs.readFileSync(path.join(__dirname, '..', 'features', 'readiness.js'), 'utf8');
      const fn = (name) => {
        const i = RS.indexOf('function ' + name + '(');
        if (i === -1) return '';
        let j = RS.indexOf('{', i), d = 1; j++;
        while (j < RS.length && d > 0) { if (RS[j] === '{') d++; else if (RS[j] === '}') d--; j++; }
        return RS.slice(i, j);
      };
      const ls = makeLocal({ nplus_exam_date: '2026-11-17' });
      const flushed = [];
      const ctx = { window: { CURRENT_CERT: 'netplus' }, localStorage: ls, JSON, Object, Array,
        STORAGE: { EXAM_DATE: 'nplus_exam_date', EXAM_DATES: 'nplus_exam_dates' }, _cloudFlush: (k) => flushed.push(k) };
      vm.createContext(ctx);
      vm.runInContext(['_certKey', '_readExamDates', 'getExamDate'].map(fn).join('\n'), ctx);
      const got = vm.runInContext('getExamDate()', ctx);
      const map = JSON.parse(ls.getItem('nplus_exam_dates') || '{}');
      out.s9d = { adopted: got === '2026-11-17' && map.netplus === '2026-11-17' && flushed.indexOf('nplus_exam_dates') !== -1 };
    }
  }

  return out;
}

main().then(r => { process.stdout.write(JSON.stringify(r)); }, e => { process.stdout.write(JSON.stringify({ crashed: String(e && e.stack || e) })); });
