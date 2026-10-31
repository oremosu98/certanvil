// features/reports.js — bug-report sending + retry queue
// Lazy-loaded via _loadFeature('reports') from the topbar bug iconbtn,
// the report form (features/report-sheet.js) and DOMContentLoaded (queue drain).
//
// No `enter` / `leave` lifecycle (the standard feature-module pattern)
// because this is a queue feature, not a page. Entry points are
// `openDrawer()` (the topbar: opens the one Report a problem form),
// `submitReportNow()` (the form's Send) and `drainQueue()` (DOMContentLoaded).

(function () {
  'use strict';

  // ───────────────────────────────────────────────────────────
  // PURE FUNCTIONS (testable in isolation via vm-sandbox)
  // ───────────────────────────────────────────────────────────

  function buildPayload(form, ctx) {
    // ISO-no-colons + 4-char hex random for stable ID across retries
    var iso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'); // strip ms
    var idIso = iso.replace(/:/g, '-');
    var hex = Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
    var id = 'rpt_' + idIso.replace(/Z$/, '') + '_' + hex;

    function trim(s) { return (s == null ? '' : String(s)).trim(); }

    var desc = trim(form && form.desc);
    var title = trim(form && form.title);
    if (!title) title = trim(desc.split('\n')[0]).slice(0, 80);

    return {
      id: id,
      title: title,
      description: desc,
      user_id: (ctx && ctx.user_id) || null,
      steps: form && form.steps ? trim(form.steps) : null,
      context: {
        version: (ctx && ctx.version) || 'unknown',
        page: (ctx && ctx.page) || 'unknown',
        cert: (ctx && ctx.cert) || 'unknown',
        theme: (ctx && ctx.theme) || 'unknown',
        viewport: (ctx && ctx.viewport) || 'unknown',
        last_quiz: (ctx && ctx.last_quiz) || null,
        wrong_bank_size: (ctx && typeof ctx.wrong_bank_size === 'number') ? ctx.wrong_bank_size : 0,
      },
      submitted_at: iso,
      attempt_count: 1,
    };
  }
  function renderIssueBody(payload) {
    var p = payload || {};
    var c = p.context || {};
    var lq = c.last_quiz;
    var lqLine = lq ? (lq.topic + ' · ' + lq.score + ' · ' + lq.minutes_ago + 'm ago') : 'none';
    var stepsBlock = p.steps ? p.steps : '_not provided_';

    var out = [];
    out.push('## What happened');
    out.push('');
    out.push(p.description || '');
    out.push('');
    out.push('## Steps to reproduce');
    out.push('');
    out.push(stepsBlock);
    out.push('');
    out.push('<details>');
    out.push('<summary>Auto-attached context</summary>');
    out.push('');
    out.push('| field | value |');
    out.push('|---|---|');
    out.push('| version | ' + (c.version || '') + ' |');
    out.push('| page | ' + (c.page || '') + ' |');
    out.push('| cert | ' + (c.cert || '') + ' |');
    out.push('| theme | ' + (c.theme || '') + ' |');
    out.push('| viewport | ' + (c.viewport || '') + ' |');
    out.push('| last quiz | ' + lqLine + ' |');
    out.push('| wrong-bank | ' + (typeof c.wrong_bank_size === 'number' ? c.wrong_bank_size : 0) + ' |');
    out.push('');
    out.push('</details>');
    out.push('');
    out.push('---');
    out.push('_Filed via in-app reporter · id: ' + (p.id || '') + '_');
    return out.join('\n');
  }
  function classifyError(resp) {
    var r = resp || {};
    var status = r.status;

    if (status === 200 || status === 201) {
      return { type: 'success', queueAction: 'clear', toast: { tone: 'ok', title: 'Report filed' }, terminal: false };
    }
    if (status === 0 || r.network) {
      return { type: 'offline', queueAction: 'enqueue',
        toast: { tone: 'amber', title: 'Saved offline · retries on next visit' }, terminal: false };
    }
    if (status >= 500) {
      return { type: 'server', queueAction: 'enqueue',
        toast: { tone: 'amber', title: 'GitHub error · retries on next visit' }, terminal: false };
    }
    if (status === 403 && typeof r.ratelimit_remaining === 'number' && r.ratelimit_remaining === 0) {
      return { type: 'ratelimit', queueAction: 'requeue',
        toast: { tone: 'amber', title: 'Rate-limited · retries soon' },
        next_try: r.ratelimit_reset || null, terminal: false };
    }
    if (status === 403) {
      return { type: 'scope', queueAction: 'enqueue',
        toast: { tone: 'red', title: 'Token lacks scope · update in Settings' }, terminal: true };
    }
    if (status === 401) {
      return { type: 'auth', queueAction: 'enqueue',
        toast: { tone: 'red', title: 'Token rejected · open Settings' }, terminal: true };
    }
    if (status === 422) {
      return { type: 'payload', queueAction: 'enqueue',
        toast: { tone: 'red', title: "Couldn't send · check console" }, terminal: true };
    }
    // Unknown 4xx — treat as terminal payload error
    return { type: 'unknown', queueAction: 'enqueue',
      toast: { tone: 'red', title: "Couldn't send (HTTP " + status + ')' }, terminal: true };
  }
  function enqueueReport(rpt, store) {
    var QUEUE_CAP = 25;
    var s = (store || []).slice();
    // Update in place if same id
    var idx = -1;
    for (var i = 0; i < s.length; i++) { if (s[i].id === rpt.id) { idx = i; break; } }
    if (idx > -1) {
      s[idx] = rpt;
      return s;
    }
    // Append
    s.push(rpt);
    // LRU: drop oldest non-terminal first, else oldest period
    while (s.length > QUEUE_CAP) {
      var dropAt = -1;
      for (var j = 0; j < s.length; j++) { if (!s[j].terminal) { dropAt = j; break; } }
      if (dropAt === -1) dropAt = 0;
      s.splice(dropAt, 1);
    }
    return s;
  }

  function _getCtx() {
    function safeRead(fn) { try { return fn(); } catch (e) { return null; } }
    var theme = safeRead(function(){ return document.documentElement.getAttribute('data-theme') || 'dark'; });
    var page = safeRead(function(){
      var pages = document.querySelectorAll('.page.active'); return pages.length ? '#' + pages[0].id : 'unknown';
    });
    var cert = safeRead(function(){
      // Read from CERT_PACK if available; fall back to localStorage CURRENT_CERT.
      // CERT_PACK.meta.code is the objective code ('N10-009', 'SY0-701'), NOT
      // 'objectiveCode' (which doesn't exist on the meta object).
      if (window.CERT_PACK && window.CERT_PACK.meta && window.CERT_PACK.meta.code) {
        return (window.CURRENT_CERT || 'netplus') + '-' + window.CERT_PACK.meta.code;
      }
      return (window.CURRENT_CERT || 'unknown');
    });
    var version = safeRead(function(){ return window.APP_VERSION || 'unknown'; });
    var viewport = window.innerWidth + 'x' + window.innerHeight;
    var lastQuiz = safeRead(function(){
      if (typeof loadHistory !== 'function') return null;
      var h = loadHistory();
      if (!h || !h.length) return null;
      var last = h[0];
      var minsAgo = Math.round((Date.now() - last.timestamp) / 60000);
      return { topic: last.topic, score: last.correct + '/' + last.total, minutes_ago: minsAgo };
    });
    var wrongBankSize = safeRead(function(){
      if (typeof loadWrongBank !== 'function') return 0;
      return (loadWrongBank() || []).length;
    }) || 0;

    return {
      version: version, page: page, cert: cert, theme: theme,
      viewport: viewport, last_quiz: lastQuiz, wrong_bank_size: wrongBankSize,
    };
  }

  // Admin in the app Task 3: the old desktop drawer is gone; every entry opens the one form (features/report-sheet.js).
  function openDrawer(opts) {
    if (typeof window.openReportSheet === 'function') window.openReportSheet(opts);
  }

  // ───────────────────────────────────────────────────────────
  // SUBMIT HELPERS (TASK 4.1)
  // ───────────────────────────────────────────────────────────

  function _showToast(opts) {
    var existing = document.querySelector('.br-toast');
    if (existing) existing.parentNode.removeChild(existing);
    var t = document.createElement('div');
    var tone = opts.tone || 'ok';
    t.className = 'br-toast ' + tone;
    var icon = tone === 'ok' ? '&check;' : (tone === 'amber' ? '&#8635;' : '&times;');
    t.innerHTML =
      '<div class="br-toast-i">' + icon + '</div>' +
      '<div><div class="br-toast-t">' + (opts.title || '') + '</div>' +
      (opts.sub ? '<div class="br-toast-l">' + opts.sub + '</div>' : '') + '</div>';
    if (opts.url) {
      t.classList.add('br-toast-link');
      t.addEventListener('click', function(){ window.open(opts.url, '_blank', 'noopener'); });
    }
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add('open'); });
    setTimeout(function(){
      t.classList.remove('open');
      setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, opts.duration || 5000);
  }

  function _loadQueue() {
    try { return JSON.parse(localStorage.getItem(STORAGE.BUG_REPORTS) || '[]'); }
    catch (e) { return []; }
  }
  function _saveQueue(q) {
    try { localStorage.setItem(STORAGE.BUG_REPORTS, JSON.stringify(q)); } catch (e) {}
  }

  function _updateTopbarDot() {
    var btn = document.getElementById('topbar-bug-report');
    if (!btn) return;
    var q = _loadQueue();
    btn.classList.toggle('has-queue', q.length > 0);
  }

  // ───────────────────────────────────────────────────────────
  // SUBMIT + RETRY (TASK 5.x, 6.x)
  // ───────────────────────────────────────────────────────────

  // v7.79.0: routes to Supabase (user_bug_reports table) instead of the
  // GitHub Issues REST API. The prior design read a personal access token
  // from localStorage — a token no real user's browser ever had (the only
  // UI that could set it was a founder-only monitor panel, since removed
  // as a security fix). upsert on report_id makes offline-queue retries
  // idempotent instead of creating duplicate rows.
  async function submitReport(payload) {
    var sb = window.certanvilSupabase;
    if (!sb) return classifyError({ status: 0, network: true });

    var body = renderIssueBody(payload);
    try {
      // p_user_id is the writer captured when the report was written, never the
      // current session: a queued report sent after someone else signs in must
      // not pick up the new person's id. Old queue entries have no user_id.
      var res = await sb.rpc('submit_bug_report', {
        p_report_id: payload.id,
        p_title: payload.title,
        p_description: payload.description,
        p_steps: payload.steps,
        p_body: body,
        p_context: payload.context,
        p_user_id: payload.user_id || null,
      });
      if (!res.error) {
        var out = classifyError({ status: 201 });
        var n = Number(res.data);
        out.reportNo = (res.data != null && isFinite(n)) ? n : null;
        return out;
      }
      // supabase-js answers a failed fetch with status 0 rather than throwing: that is the network, not the server.
      if (res.status === 0 || (typeof navigator !== 'undefined' && navigator.onLine === false)) return classifyError({ status: 0, network: true });
      return classifyError({ status: 500 });
    } catch (e) {
      return classifyError({ status: 0, network: true });
    }
  }
  async function _currentUserId() {
    var sb = window.certanvilSupabase;
    try {
      if (sb && sb.auth && sb.auth.getUser) {
        var u = await sb.auth.getUser();
        return (u && u.data && u.data.user && u.data.user.id) || null;
      }
    } catch (e) {}
    return null;
  }
  // Build, send and (on failure) queue one report. The report form's Send.
  async function submitReportNow(form) {
    var ctx = _getCtx();
    ctx.user_id = await _currentUserId();
    var payload = buildPayload(form, ctx);
    var result = await submitReport(payload);
    var queued = false;
    if (result.type === 'success') {
      _saveQueue(_loadQueue().filter(function(r){ return r.id !== payload.id; }));
    } else if (result.type === 'offline' || result.type === 'ratelimit') {
      // Only a network failure is queued from the form. A server rejection while online is a hard failure: the form
      // stays open with what was typed, so a retry there cannot also send a queued copy later.
      _saveQueue(enqueueReport({
        id: payload.id, payload: payload,
        attempts: 1, last_try: payload.submitted_at,
        next_try: result.next_try || null,
        terminal: !!result.terminal,
      }, _loadQueue()));
      queued = true;
    }
    _updateTopbarDot();
    return { ok: result.type === 'success', queued: queued, reportNo: result.reportNo == null ? null : result.reportNo, result: result };
  }
  async function drainQueue() {
    var q = _loadQueue();
    if (!q.length) return;

    var keep = [];
    var landed = 0;
    for (var i = 0; i < q.length; i++) {
      var entry = q[i];
      if (entry.terminal) { keep.push(entry); continue; }
      if (entry.next_try && Date.now() < entry.next_try * 1000) {
        keep.push(entry); continue;
      }
      // One attempt — 10s timeout so a hung Supabase call doesn't block the drain loop.
      var result;
      try {
        result = await (typeof withTimeout === 'function'
          ? withTimeout(submitReport(entry.payload), 10000, 'report-drain')
          : submitReport(entry.payload));
      } catch (te) {
        result = classifyError({ status: 0, network: true });
      }
      if (result.type === 'success') {
        landed++;
        continue; // don't keep
      }
      entry.attempts = (entry.attempts || 1) + 1;
      entry.last_try = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      entry.next_try = result.next_try || null;
      entry.terminal = !!result.terminal;
      keep.push(entry);
    }
    _saveQueue(keep);
    _updateTopbarDot();

    if (landed > 0) {
      _showToast({ tone: 'ok',
        title: 'Filed offline ' + (landed === 1 ? 'report' : 'reports'),
        sub: landed + ' queued ' + (landed === 1 ? 'report' : 'reports') + ' just landed',
      });
    }
  }

  // ───────────────────────────────────────────────────────────
  // SETTINGS PANEL (TASK 7.x)
  // ───────────────────────────────────────────────────────────

  function renderSettingsReportsPanel(host) {
    if (!host) return;
    var q = _loadQueue();
    var rows = q.map(function(r){
      var status = r.terminal ? 'hf' : 'tr';
      var statusLabel = r.terminal ? 'Failed' : 'Pending';
      var ago = r.last_try ? _ago(r.last_try) : '';
      return (
        '<div class="br-sp-row" data-id="' + r.id + '">' +
          '<div class="br-sp-status br-sp-' + status + '"><span class="br-sp-dot"></span>' + statusLabel + '</div>' +
          '<div class="br-sp-body"><div class="br-sp-title">' + _esc(r.payload.title) + '</div>' +
            '<div class="br-sp-sub">' + r.id + ' · ' + (r.attempts || 1) + ' attempt' + ((r.attempts || 1) === 1 ? '' : 's') + '</div></div>' +
          '<div class="br-sp-when">' + ago + '</div>' +
          '<div class="br-sp-acts">' +
            '<button class="br-sp-retry" data-id="' + r.id + '">Retry</button>' +
            '<button class="br-sp-del" data-id="' + r.id + '">Delete</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    host.innerHTML =
      '<div class="br-sp-hd"><div class="br-sp-eyb">&sect; Reports</div>' +
      '<h4>Pending reports</h4><div class="br-sp-meta">' + q.length + ' queued · drains on next page load</div></div>' +
      '<div class="br-sp-list">' + (rows || '<div class="br-sp-empty">No queued reports.</div>') + '</div>';

    // Wire retry/delete
    host.querySelectorAll('.br-sp-retry').forEach(function(b){
      b.addEventListener('click', async function(){
        var id = b.getAttribute('data-id');
        var qNow = _loadQueue();
        var entry = qNow.find(function(x){ return x.id === id; });
        if (!entry) return;
        var result = await submitReport(entry.payload);
        if (result.type === 'success') {
          _saveQueue(qNow.filter(function(x){ return x.id !== id; }));
        } else {
          entry.attempts = (entry.attempts || 1) + 1;
          entry.terminal = !!result.terminal;
          _saveQueue(qNow);
        }
        renderSettingsReportsPanel(host);
        _updateTopbarDot();
      });
    });
    host.querySelectorAll('.br-sp-del').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-id');
        _saveQueue(_loadQueue().filter(function(x){ return x.id !== id; }));
        renderSettingsReportsPanel(host);
        _updateTopbarDot();
      });
    });
  }

  function _ago(iso) {
    try {
      var t = new Date(iso).getTime(); var s = Math.floor((Date.now() - t) / 1000);
      if (s < 60) return s + 's ago';
      if (s < 3600) return Math.floor(s/60) + 'm ago';
      if (s < 86400) return Math.floor(s/3600) + 'h ago';
      return Math.floor(s/86400) + 'd ago';
    } catch (e) { return ''; }
  }
  function _esc(s) {
    return String(s || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
  }

  // Register on the standard feature-modules contract
  window._certanvilFeatures = window._certanvilFeatures || {};
  window._certanvilFeatures.reports = {
    // Pure (exposed for testing)
    buildPayload: buildPayload,
    renderIssueBody: renderIssueBody,
    classifyError: classifyError,
    enqueueReport: enqueueReport,
    // UI
    openDrawer: openDrawer,
    // Pipeline
    submitReport: submitReport,
    submitReportNow: submitReportNow,
    drainQueue: drainQueue,
    // Settings
    renderSettingsReportsPanel: renderSettingsReportsPanel,
  };
})();
