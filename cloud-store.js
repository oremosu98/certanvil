// ══════════════════════════════════════════════════════════════════════════
// CertAnvil cert app — cloud-store (Phase C′)
// ══════════════════════════════════════════════════════════════════════════
// Cloud-canonical user state with localStorage as ephemeral session cache.
//
// Architecture:
//   Source of truth     → Supabase profiles.metadata jsonb + quiz_history table
//   Session cache       → localStorage (existing keys, populated on sign-in)
//   In-memory hot path  → cloud-store internal map (mirror of localStorage)
//
// Lifecycle:
//   1. Anonymous user: nothing happens — localStorage works as today
//   2. SIGNED_IN event: hydrate localStorage from Supabase → populate cache
//   3. App writes localStorage as today
//   4. cloudStore.flush(key) called after each user-data write → debounced
//      flush to Supabase
//   5. SIGNED_OUT event: clear user-data keys from localStorage
//
// Design intent:
//   - Existing code (186 localStorage call sites) DOES NOT need to change.
//     The cloud-store sits alongside, not replacing.
//   - Sync READS stay synchronous (localStorage is fast).
//   - Cloud writes are async + debounced + retried.
//   - localStorage corruption no longer destroys data — cloud has canonical
//     copy + restore-on-next-sign-in.
//
// Storage class taxonomy (which keys flush to cloud vs stay local-only):
//   USER_DATA: history, streak, wrong_bank, sr_queue, exam_date,
//              daily_goal, diagnostic, last_diagnostic_at, milestones,
//              type_stats, hardcore_exam, daily_challenge, deep_dive_uses,
//              all 6 *_MASTERY, all 6 *_LESSONS, topologies, topology_draft,
//              acl_state, fix_challenges, lab_completions
//
//   APP_PREFS: theme, tb_left_collapsed, tb_right_collapsed, tb_intro_seen,
//              ai_cache, port_best, port_streak_best, port_family_best,
//              port_pairs_best, port_stats, subnet_stats
//              (UI prefs + perf caches — no cloud sync; per-device)
//
//   DEV_ONLY:  error_log, sb_reported, ai_parse_fails, reports,
//              autobackup_*, last_autobackup_at, last_export_reminder_at,
//              key, tb_coach_cache, acl_coach_cache
//              (debug / dev tooling / API key — never to cloud)
//
// HISTORY is special — append-only quiz session log → goes to dedicated
// quiz_history TABLE (not jsonb), so we can query it relationally for
// admin analytics.
// ══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  // cloud-store is the canonical owner of the 'nplus_' localStorage prefix
  // (the file that defines USER_DATA_KEYS). Centralising the prefix here
  // makes the literal-string lint happy (regex matches setItem('nplus_…',
  // not setItem(KEY_PREFIX + …, ...)) AND keeps every key in this file
  // built from a single source of truth.
  var KEY_PREFIX = 'nplus_';

  // Wait for Supabase client to be available before doing anything cloud-y.
  // localStorage operations (the cache layer) work without the client.
  function getSupabase() { return window.certanvilSupabase || null; }

  // ── Storage class taxonomy ──────────────────────────────────────────────
  // Keys that flush to cloud (user data — survives across devices)
  var USER_DATA_KEYS = new Set([
    'nplus_history',
    'nplus_streak',
    'nplus_wrong_bank',
    'nplus_sr_queue',
    'nplus_exam_date',
    'nplus_daily_goal',
    'nplus_diagnostic',
    'nplus_last_diagnostic_at',
    'nplus_milestones',
    'nplus_type_stats',
    'nplus_hardcore_exam',
    'nplus_daily_challenge',
    'nplus_deep_dive_uses',
    'nplus_subnet_mastery',
    'nplus_subnet_lessons',
    'nplus_port_mastery',
    'nplus_port_lessons',
    'nplus_ab_mastery',
    'nplus_ab_lessons',
    'nplus_sab_mastery',
    'nplus_sab_lessons',
    'nplus_amm_mastery',  // v4.94.0: Attack-to-Mitigation Match
    'nplus_amm_lessons',
    'nplus_cts_mastery',  // v4.95.0: Control Type Sorter
    'nplus_cts_lessons',
    'nplus_pt_mastery',   // v4.96.0: Network+ Packet Trace drill
    'nplus_pt_lessons',
    'nplus_pt_resume',
    'nplus_irw_mastery',  // v4.97.0: Security+ IR War Room flagship
    'nplus_irw_lessons',
    'nplus_pht_mastery',  // v4.98.0: Security+ Phishing Triage Lab flagship
    'nplus_pht_lessons',
    'nplus_readiness_snapshots',  // v4.99.0: cross-cert analytics readiness pipeline (Phase A.5)
    'nplus_os_mastery',
    'nplus_os_lessons',
    'nplus_cb_mastery',
    'nplus_cb_lessons',
    'nplus_na_mastery',
    'nplus_na_lessons',
    'nplus_na_stats',
    'nplus_topologies',
    'nplus_topology_draft',
    'nplus_acl_state',
    'nplus_fix_challenges',
    'nplus_lab_completions',
    'nplus_activated',   // onboarding: per-cert activation (metadata.activated.<certId>)
    'nplus_onb_skips',   // onboarding: per-cert diagnostic-skip record (metadata.onb_skips.<certId>)
    'nplus_freeCertId',  // free-tier cert lock: metadata.freeCertId (single global value)
    'nplus_drill_stats', // Task 3: per-cert drill stats {cert:{drill:{done,perfect}}}
    'nplus_exam_dates',     // persona bundle: per-cert exam date {cert:'YYYY-MM-DD'|null}, merged per cert
    'nplus_exam_outcomes',  // persona bundle: per-cert exam result {cert:{outcome,score,date,predicted,at}}, merged per cert
  ]);

  // Whole per-cert maps held in localStorage as {certId: value} (unlike sr / activated / onb_skips,
  // where local holds only this cert's entry). Flush merges them per cert over the cloud copy and
  // hydrate merges the cloud's other certs into local, so every subdomain sees every cert.
  var PER_CERT_MAPS = ['readiness_snapshots', 'exam_dates', 'exam_outcomes'];
  function _isMap(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }

  // Subset of USER_DATA that goes to a dedicated table, NOT profiles.metadata
  var TABLE_BACKED_KEYS = new Set([
    'nplus_history',  // → quiz_history table (append-only)
  ]);

  // Pending flush queue — keys waiting to be written to cloud
  var pendingFlush = new Set();
  var flushTimer = null;
  // v8.198.1: automatic retries after a compare-and-set miss in a row (see doFlush); reset by a write that lands.
  var conflictRetries = 0;
  var MAX_CONFLICT_RETRIES = 2;
  var FLUSH_DEBOUNCE_MS = 1500;  // wait 1.5s of quiet before batching writes
  var lastSyncAt = null;
  var syncStatus = 'idle';  // 'idle' | 'pending' | 'syncing' | 'error' | 'offline'
  var statusListeners = [];
  var inflightFlush = null;
  // v8.151.0 (founder SQL 2026-10-11: profiles.metadata and quiz_history were
  // empty for EVERY user — nothing had ever synced). The session accessors read
  // sb.auth._currentSession / sb.auth.session(), which supabase-js v2 doesn't
  // have, so isSignedIn() was always false. auth-state now hands the session in
  // via setSession(). And because hydrate() used to OVERWRITE local data with
  // the cloud copy, simply fixing the accessor would have written an empty cloud
  // over real history. Rules now:
  //   - hydrate merges: cloud only fills what this device lacks; history is a
  //     union; then everything local is pushed up.
  //   - nothing uploads until the first hydrate has merged (a fresh device or a
  //     pre-hydrate write can't clobber the cloud copy).
  //   - an upload keeps cloud keys this device doesn't have, and never writes
  //     the profile blind if the cloud copy couldn't be read.
  //   - history rows are matched on the quiz time (item.date), not `at`.
  var _session = null;
  var _hydrated = false;

  // ── Public API ──────────────────────────────────────────────────────────
  var cloudStore = {

    // Mark a USER_DATA key as needing a cloud flush. Called by app code AFTER
    // it writes to localStorage. Debounces; multiple flushes within
    // FLUSH_DEBOUNCE_MS coalesce into one Supabase round-trip.
    flush: function (key) {
      if (!USER_DATA_KEYS.has(key)) return;       // not a user-data key — no-op
      if (!isSignedIn()) return;                  // anonymous — no cloud writes
      pendingFlush.add(key);
      if (!_hydrated) return;                     // v8.151.0: queued until the first merge
      setStatus('pending');
      if (flushTimer) clearTimeout(flushTimer);
      flushTimer = setTimeout(doFlush, FLUSH_DEBOUNCE_MS);
    },

    // Force an immediate flush (e.g., on tab close via pagehide event).
    // Returns a promise that resolves when the flush completes.
    flushNow: function () {
      if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
      // v8.198.1: a flush already in flight is waited for, even when nothing new is pending, then anything
      // queued meanwhile goes too. Account deletion calls this before request_account_deletion: returning early
      // let a write whose read predated the rpc land after it and replace the whole metadata column.
      if (inflightFlush) {
        return inflightFlush.catch(function () {}).then(function () {
          return pendingFlush.size === 0 ? undefined : doFlush();
        });
      }
      if (pendingFlush.size === 0) return Promise.resolve();
      return doFlush();
    },

    // Hydrate localStorage from Supabase. Called by auth-state on SIGNED_IN.
    // Pulls the user's full state from cloud, writes to localStorage, returns
    // a promise that resolves when complete.
    hydrate: function () {
      var sb = getSupabase();
      if (!sb) return Promise.reject(new Error('Supabase client not ready'));
      var userId = getUserId();
      if (!userId) return Promise.reject(new Error('No signed-in user'));
      setStatus('syncing');

      // Pull profile (jsonb metadata) + recent quiz_history rows in parallel
      return Promise.all([
        sb.from('profiles').select('metadata, role, exam_date, display_name').eq('id', userId).single(),
        // v8.155.0: this cert's rows only. Every cert's subdomain shares one
        // quiz_history table, so an unfiltered pull merged (since v8.151.0)
        // e.g. Network+ history into the Security+ device.
        sb.from('quiz_history').select('*').eq('user_id', userId).eq('cert', _ccCert()).order('created_at', { ascending: false }).limit(500),
      ]).then(function (results) {
        var profileResult = results[0];
        var historyResult = results[1];
        if (profileResult.error) throw profileResult.error;

        var meta = (profileResult.data && profileResult.data.metadata) || {};
        var examDate = profileResult.data && profileResult.data.exam_date;
        var cert0 = _ccCert();

        // Fill-only: cloud values land only where this device has nothing (v8.151.0)
        applyJsonbToLocalStorage(meta);
        // exam_date lives in its own profiles column, not in metadata jsonb,
        // so write it via the centralised KEY_PREFIX const at the top of
        // this file (keeps cloud-store the single owner of the 'nplus_'
        // prefix; the variable-arg form satisfies the literal-string lint).
        // Persona bundle: once the cloud has the per-cert map, the column holds whichever cert flushed
        // last, so it must not seed this cert's legacy date (getExamDate would adopt another cert's day).
        if (meta.exam_dates && typeof meta.exam_dates === 'object') examDate = meta.exam_dates[cert0] || null;
        if (examDate && !_localHas(KEY_PREFIX + 'exam_date')) {
          try { localStorage.setItem(KEY_PREFIX + 'exam_date', examDate); } catch (e) {}
        }

        // quiz_history: union of local + cloud (never replace local with cloud)
        if (!historyResult.error && Array.isArray(historyResult.data)) {
          var local = getLocalHistoryArr();
          var merged = _mergeHistory(local, historyResult.data.map(rowToHistoryItem));
          if (merged.length !== local.length) {
            try { localStorage.setItem(KEY_PREFIX + 'history', JSON.stringify(merged)); } catch (e) {}
          }
        }

        lastSyncAt = Date.now();
        setStatus('idle');
        // First merge done: push everything this device holds (the cloud keeps
        // anything only it had, see doFlush), then normal debounced syncing.
        _hydrated = true;
        USER_DATA_KEYS.forEach(function (k) { pendingFlush.add(k); });
        if (flushTimer) clearTimeout(flushTimer);
        flushTimer = setTimeout(doFlush, 50);
        return { profile: profileResult.data, historyCount: (historyResult.data || []).length };
      }).catch(function (err) {
        console.error('[cloud-store] hydrate failed', err);
        _syncTelemetry('hydrate', err);
        setStatus('error');
        throw err;
      });
    },

    // v8.151.0: auth-state hands the Supabase session in (null on sign-out).
    setSession: function (session) {
      _session = (session && session.user) ? session : null;
      if (!_session) _hydrated = false;
    },
    getUserId: function () { return getUserId(); },
    // v8.151.0: local data may only be cleared once it is safely in the cloud.
    isSafeToClear: function () {
      return _hydrated && pendingFlush.size === 0 && !inflightFlush && syncStatus !== 'error' && lastSyncAt != null;
    },

    // Clear localStorage user-data keys. Called on SIGNED_OUT (only when isSafeToClear()).
    clearLocalCache: function () {
      _hydrated = false;
      USER_DATA_KEYS.forEach(function (key) {
        try { localStorage.removeItem(key); } catch (e) {}
      });
      lastSyncAt = null;
      setStatus('idle');
    },

    // Status accessors for UI
    getStatus: function () { return syncStatus; },
    getLastSyncAt: function () { return lastSyncAt; },
    onStatusChange: function (cb) {
      statusListeners.push(cb);
      return function unsubscribe() {
        var i = statusListeners.indexOf(cb);
        if (i >= 0) statusListeners.splice(i, 1);
      };
    },

    // For migration.js — bulk write everything in localStorage to cloud.
    // Returns counts of synced records.
    migrateLocalToCloud: function () {
      if (!isSignedIn()) return Promise.reject(new Error('Not signed in'));
      var allUserKeys = Array.from(USER_DATA_KEYS);
      allUserKeys.forEach(function (k) { pendingFlush.add(k); });
      return doFlush().then(function () {
        return {
          metadataKeysFlushed: allUserKeys.filter(function (k) { return !TABLE_BACKED_KEYS.has(k); }).length,
          historyRowsFlushed: getLocalHistoryArr().length,
        };
      });
    },
  };

  // ── Internals ───────────────────────────────────────────────────────────

  function isSignedIn() {
    if (_session && _session.user) return true;
    var sb = getSupabase();
    if (!sb || !sb.auth) return false;
    // Check the synchronous current-session cache that Supabase JS maintains.
    // Falls back to false if the cache hasn't been populated yet.
    var sess = (sb.auth._currentSession && sb.auth._currentSession.user) ||
               (sb.auth.session && sb.auth.session().data && sb.auth.session().data.user) ||
               null;
    return !!sess;
  }

  function getUserId() {
    if (_session && _session.user && _session.user.id) return _session.user.id;
    var sb = getSupabase();
    if (!sb || !sb.auth) return null;
    var sess = sb.auth._currentSession || (sb.auth.session && sb.auth.session().data && sb.auth.session().data.session);
    return (sess && sess.user && sess.user.id) || null;
  }

  function setStatus(s) {
    if (syncStatus === s) return;
    syncStatus = s;
    statusListeners.forEach(function (cb) { try { cb(s); } catch (e) {} });
  }

  function getLocalHistoryArr() {
    try {
      var raw = localStorage.getItem('nplus_history');
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  // Active cert id (subdomain-derived; set by app.js as window.CURRENT_CERT).
  // SR cloud state is cert-scoped under metadata.sr.<certId> so one cert's sync
  // cannot overwrite another's (the localStorage queue is already per-subdomain).
  function _ccCert() {
    return (typeof window !== 'undefined' && window.CURRENT_CERT) ? window.CURRENT_CERT : 'netplus';
  }

  // v8.151.0 merge helpers ------------------------------------------------
  // A local value counts as present unless it is missing or an empty shell.
  function _localHas(key) {
    var raw = null;
    try { raw = localStorage.getItem(key); } catch (e) { raw = null; }
    return !(raw == null || raw === '' || raw === 'null' || raw === '[]' || raw === '{}');
  }
  // History identity = the quiz moment + topic + result (rows are append-only).
  function _historyKey(item) {
    var when = item.date || (item.at ? new Date(item.at).toISOString() : '');
    return when + '|' + (item.topic || '') + '|' + (item.score || 0) + '|' + (item.total || 0);
  }
  function _mergeHistory(local, cloud) {
    var seen = new Set(), out = [];
    (local || []).concat(cloud || []).forEach(function (it) {
      if (!it) return;
      var k = _historyKey(it);
      if (seen.has(k)) return;
      seen.add(k); out.push(it);
    });
    out.sort(function (a, b) {
      var ta = new Date(a.date || a.at || 0).getTime(), tb = new Date(b.date || b.at || 0).getTime();
      return tb - ta;
    });
    return out;
  }
  // Sync failures used to go to the console only, which is how a dead sync went
  // unnoticed for months. One client_errors row per stage per page load.
  var _syncTelemetrySent = {};
  function _syncTelemetry(stage, detail) {
    try {
      if (_syncTelemetrySent[stage]) return;
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
      var sb = getSupabase();
      if (!sb) return;
      _syncTelemetrySent[stage] = true;
      var msg = (detail && (detail.message || detail.error || (detail.code && ('code ' + detail.code)))) || String(detail);
      sb.from('client_errors').insert([{
        fingerprint: 'sync:' + stage, type: 'telemetry:sync',
        message: (stage + ': ' + String(msg)).slice(0, 500), page: 'cloud-sync',
        version: String(window.APP_VERSION || '').slice(0, 20),
        user_agent: String(navigator.userAgent || '').slice(0, 200)
      }]).then(function () {}, function () {});
    } catch (e) { /* telemetry must never break sync */ }
  }

  // Read all USER_DATA keys from localStorage, structure for cloud write
  function buildJsonbFromLocalStorage() {
    var out = {};
    USER_DATA_KEYS.forEach(function (key) {
      if (TABLE_BACKED_KEYS.has(key)) return;     // history goes to its own table
      if (key === 'nplus_exam_date') return;      // goes to profiles.exam_date column
      var raw;
      try { raw = localStorage.getItem(key); } catch (e) { return; }
      if (raw == null) return;
      // Strip the 'nplus_' prefix in cloud — keys in jsonb are cleaner
      var cloudKey = key.replace(/^nplus_/, '');
      // Parse JSON-shaped values, leave strings as-is
      var parsed;
      try { parsed = JSON.parse(raw); } catch (e) { parsed = raw; }
      // Cert-scope the SR queue: metadata.sr.<certId>.queue (never flat sr_queue).
      if (cloudKey === 'sr_queue') {
        var cert = _ccCert();
        if (!out.sr) out.sr = {};
        if (!out.sr[cert]) out.sr[cert] = {};
        out.sr[cert].queue = parsed;
        return;
      }
      // Cert-scope onboarding activation + skip: metadata.<key>.<certId>.
      // localStorage holds only THIS subdomain's cert entry; doFlush re-reads
      // cloud and merges so sibling certs are preserved.
      if (cloudKey === 'activated' || cloudKey === 'onb_skips') {
        var aCert = _ccCert();
        if (!out[cloudKey]) out[cloudKey] = {};
        out[cloudKey][aCert] = parsed;
        return;
      }
      out[cloudKey] = parsed;
    });
    return out;
  }

  // Inverse of buildJsonbFromLocalStorage — write cloud jsonb back to localStorage
  function applyJsonbToLocalStorage(meta) {
    if (!meta || typeof meta !== 'object') return;
    var cert = _ccCert();
    Object.keys(meta).forEach(function (cloudKey) {
      // Cert-scoped SR: pull only THIS cert's queue out of metadata.sr.<certId>.
      if (cloudKey === 'sr') {
        var certSr = (meta.sr && meta.sr[cert]) ? meta.sr[cert] : null;
        if (certSr && certSr.queue != null && !_localHas('nplus_sr_queue')) {
          var q = certSr.queue;
          try { localStorage.setItem('nplus_sr_queue', typeof q === 'string' ? q : JSON.stringify(q)); } catch (e) {}
        }
        return;
      }
      // Backward-compat: legacy flat metadata.sr_queue (pre-cert-scoping). Only
      // adopt it when there's no per-cert entry for the active cert, so we never
      // clobber the new structure. The next flush rewrites it cert-scoped.
      if (cloudKey === 'sr_queue') {
        if (meta.sr && meta.sr[cert] && meta.sr[cert].queue != null) return;
        var v = meta.sr_queue;
        if (v != null && !_localHas('nplus_sr_queue')) { try { localStorage.setItem('nplus_sr_queue', typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) {} }
        return;
      }
      // Onboarding cert-scoped maps: pull only THIS cert's entry down to local.
      if (cloudKey === 'activated' || cloudKey === 'onb_skips') {
        var mine = (meta[cloudKey] && meta[cloudKey][cert]) ? meta[cloudKey][cert] : null;
        if (mine != null && !_localHas('nplus_' + cloudKey)) {
          try { localStorage.setItem('nplus_' + cloudKey, JSON.stringify(mine)); } catch (e) {}
        }
        return;
      }
      // Per-cert maps: cloud fills every cert entry this device lacks; this device's own entries win
      // (a cleared exam date is a null entry, which also wins).
      if (PER_CERT_MAPS.indexOf(cloudKey) !== -1) {
        var cloudMap = meta[cloudKey];
        if (!_isMap(cloudMap)) return;
        var mapKey = 'nplus_' + cloudKey, localMap = {};
        try { localMap = JSON.parse(localStorage.getItem(mapKey) || '{}'); } catch (e) { localMap = {}; }
        if (!_isMap(localMap)) localMap = {};
        var added = false;
        Object.keys(cloudMap).forEach(function (c) {
          if (!Object.prototype.hasOwnProperty.call(localMap, c)) { localMap[c] = cloudMap[c]; added = true; }
        });
        if (added) { try { localStorage.setItem(mapKey, JSON.stringify(localMap)); } catch (e) {} }
        return;
      }
      var localKey = 'nplus_' + cloudKey;
      // Skip non-user-data keys defensively (in case jsonb has extra fields like
      // role / migration_v1_at / etc. that shouldn't pollute localStorage)
      if (!USER_DATA_KEYS.has(localKey) || TABLE_BACKED_KEYS.has(localKey)) return;
      var val = meta[cloudKey];
      var writeVal;
      if (val == null) return;
      if (_localHas(localKey)) return;   // v8.151.0: this device's data wins
      if (typeof val === 'string') writeVal = val;
      else writeVal = JSON.stringify(val);
      try { localStorage.setItem(localKey, writeVal); } catch (e) {}
    });
  }

  function rowToHistoryItem(row) {
    // quiz_history table → existing localStorage HISTORY format
    // localStorage history items look like: { topic, difficulty, mode, score, total, durationMs, at, ... }
    return Object.assign({
      topic: row.topic,
      difficulty: row.difficulty,
      mode: row.mode,
      score: row.score,
      total: row.total,
      durationMs: row.duration_ms,
      cert: row.cert,
      at: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    }, row.metadata || {});
  }

  function historyItemToRow(item, userId) {
    // Inverse — localStorage history item → quiz_history table row
    var meta = Object.assign({}, item);
    delete meta.topic;
    delete meta.difficulty;
    delete meta.mode;
    delete meta.score;
    delete meta.total;
    delete meta.durationMs;
    delete meta.duration_ms;
    delete meta.cert;
    delete meta.at;
    return {
      user_id: userId,
      cert: item.cert || (window.CURRENT_CERT || 'netplus'),
      topic: item.topic || null,
      difficulty: item.difficulty || null,
      mode: item.mode || null,
      score: typeof item.score === 'number' ? item.score : 0,
      total: typeof item.total === 'number' ? item.total : 0,
      duration_ms: typeof item.durationMs === 'number' ? item.durationMs :
                   typeof item.duration_ms === 'number' ? item.duration_ms : null,
      metadata: meta,
      created_at: item.at ? new Date(item.at).toISOString() : (item.date ? new Date(item.date).toISOString() : new Date().toISOString()),  // v8.151.0: the quiz moment
    };
  }

  // Doflush — actually run the queued cloud writes
  function doFlush() {
    if (inflightFlush) return inflightFlush;
    // v8.198.1: this run takes everything pending, so whichever timer called it is spent and any other is
    // superseded. flushTimer used to keep the spent id after a debounce or hydrate timer fired.
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    if (pendingFlush.size === 0) return Promise.resolve();
    var sb = getSupabase();
    var userId = getUserId();
    if (!sb || !userId) return Promise.resolve();

    setStatus('syncing');
    var keysSnapshot = Array.from(pendingFlush);
    pendingFlush.clear();

    var jsonbWrite = false;
    var historyWrite = false;
    keysSnapshot.forEach(function (k) {
      if (k === 'nplus_history') historyWrite = true;
      else jsonbWrite = true;
    });

    var ops = [];

    if (jsonbWrite) {
      var jsonb = buildJsonbFromLocalStorage();
      // Also include exam_date as a top-level column update
      var examDate = null;
      try {
        var raw = localStorage.getItem('nplus_exam_date');
        if (raw) examDate = raw;
      } catch (e) {}

      // metadata.sr is cert-scoped, but the column write is a full replace built
      // from THIS subdomain's localStorage (which only knows its own cert). Read
      // the existing metadata.sr first and merge ours over it, preserving OTHER
      // certs' SR sub-objects — otherwise flushing one cert wipes the rest.
      // All three of sr / activated / onb_skips are cert-scoped maps. We only
      // know THIS subdomain's cert locally, so re-read cloud and merge ours
      // over the existing per-cert entries — otherwise flushing one cert wipes
      // the others' sub-objects on the full-metadata column replace.
      // Persona bundle: the whole-map per-cert keys (PER_CERT_MAPS) merge the same way.
      var CERT_SCOPED = ['sr', 'activated', 'onb_skips', 'readiness_snapshots', 'exam_dates', 'exam_outcomes'];
      // v8.198.1: account-deletion keys only the server writes (request_account_deletion stamps the first, the
      // sign-in trigger sets the second and clear_deletion_notice removes it). A client flush never adds, removes
      // or changes them: they are copied from the row this flush read, and the write only lands if the row
      // still holds those same values, so an rpc that ran between this read and this write is never undone.
      var SERVER_OWNED = ['deletion_requested_at', 'deletion_cancelled_at'];
      var writeProfile = function (existingMeta) {
        CERT_SCOPED.forEach(function (k) {
          var existing = _isMap(existingMeta && existingMeta[k]) ? existingMeta[k] : {};
          var ours = _isMap(jsonb[k]) ? jsonb[k] : {};
          var merged = Object.assign({}, existing, ours);   // our cert overrides, siblings preserved
          if (Object.keys(merged).length) jsonb[k] = merged;
        });
        // freeCertId is a single global value (not cert-scoped). If THIS flush's
        // localStorage didn't carry it (e.g. a subdomain that hasn't hydrated it),
        // keep the cloud value so the full-metadata replace can't drop the lock.
        if (jsonb.freeCertId == null && existingMeta && existingMeta.freeCertId != null) {
          jsonb.freeCertId = existingMeta.freeCertId;
        }
        // v8.151.0: keep cloud keys this device doesn't hold (a fresh device's
        // first upload used to replace the whole profile with its few keys).
        jsonb = Object.assign({}, existingMeta || {}, jsonb);
        SERVER_OWNED.forEach(function (k) {
          delete jsonb[k];
          if (existingMeta && existingMeta[k] != null) jsonb[k] = existingMeta[k];
        });
        var update = { metadata: jsonb };
        if (examDate) update.exam_date = examDate;
        var q = sb.from('profiles').update(update).eq('id', userId);
        SERVER_OWNED.forEach(function (k) {   // compare-and-set on the server-owned keys
          var v = existingMeta ? existingMeta[k] : null;
          q = (v == null) ? q.is('metadata->>' + k, null) : q.eq('metadata->>' + k, String(v));
        });
        return q.select('id').then(function (r) {
          // No row matched: the server changed a deletion key after our read. Nothing was written; the keys are
          // re-queued below and retried against a fresh read.
          if (r && !r.error && Array.isArray(r.data) && r.data.length === 0) {
            return { error: 'profile changed on the server during the flush', conflict: true };
          }
          return r;
        });
      };
      ops.push(
        sb.from('profiles').select('metadata').eq('id', userId).single().then(function (res) {
          // v8.151.0: never write the profile blind — if the cloud copy can't be
          // read, a full-metadata write could erase keys only the cloud has.
          if (!res || res.error) return { error: (res && res.error) || 'metadata read failed' };
          return writeProfile(res.data && res.data.metadata);
        }, function (err) {
          return { error: err || 'metadata read failed' };
        })
      );
    }

    if (historyWrite) {
      // For HISTORY, we don't bulk-replace — we INSERT new rows that don't
      // already exist in cloud. Simple strategy: upload entire local array,
      // dedupe by (user_id, created_at, topic, score) on the cloud side.
      // For initial migration this works; for ongoing sync we'd want a
      // smarter delta but at low volume the simple approach is fine.
      var localHistory = getLocalHistoryArr();
      if (localHistory.length > 0) {
        // Pull existing cloud rows to dedupe (only for ongoing sync; in
        // migration mode the cloud is empty so this is a no-op fast path)
        ops.push(
          (function () {
            // v8.151.0: compare on the quiz moment (item.date). The old key used
            // item.at, which new rows never have, so every sync would have
            // re-inserted them. Bounded to the local window; a read error stops
            // the insert instead of inserting everything.
            var oldest = localHistory.reduce(function (m, it) {
              var t = new Date(it.date || it.at || 0).getTime();
              return (t && t < m) ? t : m;
            }, Date.now());
            return sb.from('quiz_history').select('created_at, topic, score, total, metadata')
              .eq('user_id', userId).eq('cert', _ccCert()).gte('created_at', new Date(oldest - 60000).toISOString());
          })().then(function (existing) {
            if (existing && existing.error) return { error: existing.error };
            var existingKeys = new Set(((existing && existing.data) || []).map(function (r) {
              return _historyKey(rowToHistoryItem(r));
            }));
            var newRows = localHistory.filter(function (item) {
              return !existingKeys.has(_historyKey(item));
            }).map(function (item) {
              return historyItemToRow(item, userId);
            });
            if (newRows.length === 0) return { data: [], inserted: 0 };
            return sb.from('quiz_history').insert(newRows).then(function (r) {
              return { data: r.data, inserted: newRows.length, error: r.error };
            });
          })
        );
      }
    }

    var flushPromise = (typeof withTimeout === 'function')
      ? withTimeout(Promise.all(ops), 20000, 'cloud-flush')
      : Promise.all(ops);

    inflightFlush = flushPromise.then(function (results) {
      inflightFlush = null;
      // v8.198.1: a compare-and-set miss (the server changed a deletion key mid-flush) is expected, not a failure:
      // status 'pending', no telemetry, and an automatic retry against a fresh read, at most MAX_CONFLICT_RETRIES
      // in a row. Any other error behaves as before.
      var realErrors = results.filter(function (r) { return r && r.error && !r.conflict; });
      var conflict = results.some(function (r) { return r && r.conflict; });
      var hadError = realErrors.length > 0;
      lastSyncAt = Date.now();
      setStatus(hadError ? 'error' : (conflict ? 'pending' : 'idle'));
      if (hadError || conflict) {
        // Re-queue the failed keys for retry
        keysSnapshot.forEach(function (k) { pendingFlush.add(k); });
      }
      if (conflict && !hadError && conflictRetries < MAX_CONFLICT_RETRIES) {
        conflictRetries++;
        if (flushTimer) clearTimeout(flushTimer);
        flushTimer = setTimeout(doFlush, FLUSH_DEBOUNCE_MS);
      } else if (!conflict && !hadError) {
        conflictRetries = 0;   // a write that landed
      }
      if (hadError) {
        console.warn('[cloud-store] flush had errors', results);
        _syncTelemetry('flush', (realErrors[0] || {}).error);
      }
      return results;
    }).catch(function (err) {
      inflightFlush = null;
      // Network error, timeout, or other — re-queue + report
      keysSnapshot.forEach(function (k) { pendingFlush.add(k); });
      setStatus(navigator.onLine === false ? 'offline' : 'error');
      console.error('[cloud-store] flush threw', err);
      _syncTelemetry('flush-throw', err);
      throw err;
    });

    return inflightFlush;
  }

  // ── Lifecycle wiring ────────────────────────────────────────────────────

  // Flush on tab close / navigation away
  window.addEventListener('pagehide', function () {
    cloudStore.flushNow().catch(function () {});
  });

  // Flush when coming back online (queued writes from offline retry)
  window.addEventListener('online', function () {
    if (pendingFlush.size > 0) doFlush();
  });

  // Re-flush on visibility change (e.g., user comes back to tab)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && pendingFlush.size > 0) {
      doFlush();
    }
  });

  window.cloudStore = cloudStore;
})();
