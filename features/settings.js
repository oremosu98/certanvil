/* Settings page — extracted from app.js (#138 wave 3). Lazy-loaded feature.
 * Mechanical move: function bodies identical to app.js @ pre-extraction. */
(function () {
  'use strict';

  // ── moved state vars ──
  let _apiKeyDebounceTimer = null;

  // ── moved functions, 2-space indent ──
  function renderPassPlanSection() {
    var host = document.getElementById('passplan-section');
    if (!host) return;
    var isPro = !!_quotaState && (_quotaState.tier === 'pro' ||
      (typeof _quotaState.daily_limit === 'number' && _quotaState.daily_limit < 0));
    // Installed app (iOS PWA) shows all certs' plans; a plain browser tab is one
    // cert per subdomain, so Settings shows only the current cert's plan.
    var standalone = document.body.classList.contains('is-standalone');
    if (standalone) {
      host.innerHTML = isPro ? _renderPassPlanProHtml() : _renderPassPlanFreeHtml();
    } else {
      host.innerHTML = isPro ? _renderPassPlanBrowserProHtml() : _renderPassPlanFreeHtml();
    }
    _wirePassPlanSection(host);
  }

  function _renderPassPlanFreeHtml() {
    return '<div class="sub-label">Your Pass Plan</div>' +
      _passPlanCurrentCertCardHtml() + _passPlanLockedCertsHtml();
  }

  function _renderPassPlanBrowserProHtml() {
    return '<div class="sub-label">Your Pass Plan</div>' + _passPlanCurrentCertCardHtml();
  }

  function _renderPassPlanProHtml() {
    var snaps = _readReadinessSnapshots();
    var certs = (typeof window.getAvailableCerts === 'function') ? window.getAvailableCerts('user') : [];
    var byId = {};
    certs.forEach(function (c) { byId[c.id] = c; });
    var ids = Object.keys(snaps).filter(function (id) { return snaps[id]; });
    var rows = ids.map(function (id) {
      var s = snaps[id];
      var meta = byId[id] || { name: id, code: '', glyph: '' };
      var score = (typeof s.score === 'number') ? Math.round(s.score) : null;
      var when = '';
      if (s.computed_at) {
        try { when = 'Taken ' + new Date(s.computed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
        catch (_) { when = ''; }
      }
      var bits = [];
      if (when) bits.push(when);
      if (s.weak_domain) bits.push('weakest: ' + escHtml(s.weak_domain));
      var ringPct = (score !== null) ? score : 0;
      var name = escHtml(meta.name) + (meta.code ? ' ' + escHtml(meta.code) : '');
      return '<div class="plan-item" data-act="pp-open-cert" data-cert="' + escHtml(id) + '" role="button" tabindex="0">' +
        '<span class="pi-ring" style="background:conic-gradient(var(--accent) 0 ' + ringPct + '%, var(--surface3) ' + ringPct + '% 100%)">' +
          '<span class="pi-ring-inner">' + (score !== null ? score : '&ndash;') + '</span></span>' +
        '<span class="pi-body"><span class="pi-cert">' + name + '</span>' +
          '<div class="pi-meta">' + (bits.length ? bits.join(' &middot; ') : 'Open this cert') + '</div></span>' +
        '<span class="pi-go" aria-hidden="true">&rsaquo;</span></div>';
    }).join('');
    if (!rows) {
      rows = '<div class="plan-card pp-empty"><p class="pp-empty-h">No diagnostics yet</p>' +
        '<p class="pp-empty-sub">Run a baseline diagnostic on any cert to start building plans here.</p></div>';
    }
    return '<div class="sub-label">Your Pass Plans</div>' +
      '<div class="plan-list">' + rows + '</div>' +
      '<button type="button" class="add-cert" data-act="pp-add">' +
        '<svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">' +
          '<path d="M5 12h14M12 5v14" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/></svg>' +
        'Diagnose another cert</button>';
  }

  function _wirePassPlanSection(host) {
    host.querySelectorAll('[data-act]').forEach(function (el) {
      var act = el.getAttribute('data-act');
      var run = function (e) {
        if (e) e.preventDefault();
        if (act === 'pp-view') { viewPassPlan(); }
        else if (act === 'pp-retake') { retakeDiagnostic(); }
        else if (act === 'pp-empty') { startDiagnostic(); }
        else if (act === 'pp-pro') { _showProWaitlist(); }
        else if (act === 'pp-add') { _showPassPlanCertPicker(); }
        else if (act === 'pp-open-cert') {
          var id = el.getAttribute('data-cert');
          if (id && typeof tadSwitchCert === 'function') tadSwitchCert(id);
        }
      };
      el.addEventListener('click', run);
      if (el.getAttribute('role') === 'button') {
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') run(e);
        });
      }
    });
  }

  function clearWrongBank() {
    const bank = loadWrongBank();
    if (bank.length === 0) return;
    // v4.81.11: stronger confirmation copy (Codex r9 #3) — explicit
    // about what gets removed + the recovery path via auto-backup.
    const msg = 'Delete ' + bank.length + ' saved wrong answers?\n\n' +
      'This will:\n' +
      '  • Remove your "Drill Mistakes" study material from the home page\n' +
      '  • Reset which questions appear in the Spaced Repetition queue\n' +
      '  • Clear the wrong-answer counter\n\n' +
      'Cannot be undone via Edit menu. If you have an automatic backup ' +
      'from today (Settings → Automatic backups), you can restore from ' +
      'there if you change your mind.';
    if (!confirm(msg)) return;
    localStorage.removeItem(STORAGE.WRONG_BANK);
    renderWrongBankBtn();
  }

  function exportData() {
    const data = {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      history: loadHistory(),
      streak: getStreak(),
      wrongBank: loadWrongBank()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'networkplus-quiz-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.history || !Array.isArray(data.history)) {
          alert('Invalid backup file.');
          return;
        }
        if (!confirm(`Import ${data.history.length} history entries? This will MERGE with your existing data.`)) return;

        const existing = loadHistory();
        const existingKeys = new Set(existing.map(e => e.date + '|' + e.topic));
        const newEntries = data.history.filter(e => !existingKeys.has(e.date + '|' + e.topic));
        const merged = existing.concat(newEntries);
        merged.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (merged.length > HISTORY_CAP) merged.length = HISTORY_CAP;
        localStorage.setItem(STORAGE.HISTORY, JSON.stringify(merged));

        if (data.streak) {
          const current = getStreak();
          if ((data.streak.best || 0) > (current.best || 0)) {
            current.best = data.streak.best;
            localStorage.setItem(STORAGE.STREAK, JSON.stringify(current));
          }
        }

        if (data.wrongBank && Array.isArray(data.wrongBank)) {
          const existingBank = loadWrongBank();
          const existingQs = new Set(existingBank.map(b => b.question));
          const newBank = data.wrongBank.filter(b => !existingQs.has(b.question));
          saveWrongBank(existingBank.concat(newBank));
        }

        alert(`Imported ${newEntries.length} new entries.`);
        renderHistoryPanel();
        renderStatsCard();
        renderReadinessCard();
        renderStreakBadge();
        renderWrongBankBtn();
      } catch(err) {
        alert('Failed to parse backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function _captureSnapshot() {
    const snap = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('nplus_')) continue;
      if (k.startsWith(STORAGE.AUTOBACKUP_PREFIX)) continue; // don't snapshot snapshots
      if (k === STORAGE.LAST_AUTOBACKUP_AT) continue;
      snap[k] = localStorage.getItem(k);
    }
    return snap;
  }

  function _takeAutoBackup() {
    try {
      const todayKey = _autoBackupTodayKey();
      if (localStorage.getItem(todayKey)) {
        // Already snapshotted today — skip.
        return false;
      }
      const snap = _captureSnapshot();
      if (Object.keys(snap).length === 0) {
        // Empty state — no point snapshotting.
        return false;
      }
      const payload = {
        version: (typeof APP_VERSION !== 'undefined') ? APP_VERSION : 'unknown',
        capturedAt: new Date().toISOString(),
        keyCount: Object.keys(snap).length,
        snapshot: snap
      };
      localStorage.setItem(todayKey, JSON.stringify(payload));
      localStorage.setItem(STORAGE.LAST_AUTOBACKUP_AT, String(Date.now()));
      _pruneAutoBackups();
      return true;
    } catch (e) {
      // Storage quota exceeded? Try pruning + retrying once.
      try {
        _pruneAutoBackups(true); // aggressive: drop to 3 days on quota error
        const todayKey = _autoBackupTodayKey();
        const snap = _captureSnapshot();
        const payload = {
          version: (typeof APP_VERSION !== 'undefined') ? APP_VERSION : 'unknown',
          capturedAt: new Date().toISOString(),
          keyCount: Object.keys(snap).length,
          snapshot: snap
        };
        localStorage.setItem(todayKey, JSON.stringify(payload));
        localStorage.setItem(STORAGE.LAST_AUTOBACKUP_AT, String(Date.now()));
        return true;
      } catch (e2) {
        console.warn('[autobackup] failed:', e2 && e2.message);
        return false;
      }
    }
  }

  function _pruneAutoBackups(aggressive) {
    const keep = aggressive ? 3 : AUTOBACKUP_KEEP_DAYS;
    const all = listAutoBackups();
    if (all.length <= keep) return;
    // listAutoBackups returns newest first; drop from the tail.
    all.slice(keep).forEach(b => {
      try { localStorage.removeItem(b.key); } catch (_) {}
    });
  }

  function listAutoBackups() {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(STORAGE.AUTOBACKUP_PREFIX)) continue;
      try {
        const raw = localStorage.getItem(k);
        const parsed = JSON.parse(raw || '{}');
        out.push({
          key: k,
          date: k.slice(STORAGE.AUTOBACKUP_PREFIX.length),
          capturedAt: parsed.capturedAt || null,
          keyCount: parsed.keyCount || (parsed.snapshot ? Object.keys(parsed.snapshot).length : 0),
          version: parsed.version || 'unknown',
          bytes: raw ? raw.length : 0
        });
      } catch (_) { /* skip malformed */ }
    }
    out.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return out;
  }

  function restoreFromAutoBackup(dateOrKey) {
    const key = dateOrKey.startsWith(STORAGE.AUTOBACKUP_PREFIX) ? dateOrKey : (STORAGE.AUTOBACKUP_PREFIX + dateOrKey);
    const raw = localStorage.getItem(key);
    if (!raw) {
      showToast('Snapshot not found', 'error');
      return false;
    }
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { showToast('Snapshot is corrupted', 'error'); return false; }
    const snap = parsed.snapshot || {};
    const count = Object.keys(snap).length;
    const date = key.slice(STORAGE.AUTOBACKUP_PREFIX.length);
    // v4.81.11: enumerate what gets replaced (Codex r9 #4). Pre-fix the
    // dialog said "Your current state will be overwritten" — accurate but
    // vague. Now lists the data categories explicitly so the user knows
    // exactly what's about to change before they confirm.
    const captured = parsed.capturedAt
      ? new Date(parsed.capturedAt).toLocaleString()
      : date;
    const prettyDate = /^pre-restore-/.test(date)
      ? 'pre-restore safety snapshot from ' + new Date(parseInt(date.replace('pre-restore-', ''), 10)).toLocaleString()
      : 'snapshot of ' + captured;
    const msg = 'Restore from ' + prettyDate + '?\n\n' +
      'This will REPLACE your current:\n' +
      '  • Quiz history + streak + readiness score\n' +
      '  • Daily goal + exam date\n' +
      '  • Wrong bank + Spaced Repetition queue\n' +
      '  • All drill mastery (Subnet / Port / Acronym / OSI / Cable)\n' +
      '  • Topology saves + ACL Builder state\n' +
      '  • API key, milestones, type stats\n\n' +
      'Your CURRENT state will be auto-snapshotted first as a "pre-restore" ' +
      'safety backup, so you can roll forward again if this restore makes ' +
      'things worse.\n\n' +
      'Continue?';
    if (!confirm(msg)) {
      return false;
    }
    // Snapshot the CURRENT state under a "pre-restore" key so the user
    // can roll back if the restore makes things worse.
    try {
      const preRestoreKey = STORAGE.AUTOBACKUP_PREFIX + 'pre-restore-' + Date.now();
      const cur = _captureSnapshot();
      const curPayload = {
        version: (typeof APP_VERSION !== 'undefined') ? APP_VERSION : 'unknown',
        capturedAt: new Date().toISOString(),
        keyCount: Object.keys(cur).length,
        snapshot: cur,
        note: 'pre-restore safety snapshot'
      };
      localStorage.setItem(preRestoreKey, JSON.stringify(curPayload));
    } catch (_) { /* don't block restore on this */ }
    // Now wipe every nplus_* key (except autobackup namespace + cooldown)
    const toDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('nplus_')) continue;
      if (k.startsWith(STORAGE.AUTOBACKUP_PREFIX)) continue;
      if (k === STORAGE.LAST_AUTOBACKUP_AT) continue;
      toDelete.push(k);
    }
    toDelete.forEach(k => localStorage.removeItem(k));
    // And write the snapshot's keys back
    Object.keys(snap).forEach(k => {
      try { localStorage.setItem(k, snap[k]); } catch (_) {}
    });
    showToast('Restored ' + count + ' keys from ' + date, 'success');
    setTimeout(() => location.reload(), 600);
    return true;
  }

  function downloadAutoBackup(dateOrKey) {
    let key = dateOrKey;
    if (!key) {
      const all = listAutoBackups();
      if (all.length === 0) {
        _takeAutoBackup();
        const fresh = listAutoBackups();
        if (fresh.length === 0) { showToast('No backup to download', 'error'); return; }
        key = fresh[0].key;
      } else {
        key = all[0].key;
      }
    } else if (!key.startsWith(STORAGE.AUTOBACKUP_PREFIX)) {
      key = STORAGE.AUTOBACKUP_PREFIX + key;
    }
    const raw = localStorage.getItem(key);
    if (!raw) { showToast('Snapshot not found', 'error'); return; }
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'networkplus-autobackup-' + key.slice(STORAGE.AUTOBACKUP_PREFIX.length) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function renderAutoBackupList() {
    const host = document.getElementById('autobackup-list');
    if (!host) return;
    const all = listAutoBackups();
    if (all.length === 0) {
      host.innerHTML = '<div class="ab-empty">No automatic backups yet — one will be created on your next page load.</div>';
      return;
    }
    host.innerHTML = all.map(b => {
      const sizeKb = (b.bytes / 1024).toFixed(1);
      const captured = b.capturedAt ? new Date(b.capturedAt).toLocaleString() : b.date;
      const isPreRestore = /pre-restore-/.test(b.date);
      const dateLabel = isPreRestore ? 'Pre-restore safety (' + new Date(parseInt(b.date.replace('pre-restore-', ''), 10)).toLocaleString() + ')' : b.date;
      return '<div class="ab-row">' +
        '<div class="ab-row-info">' +
        '<div class="ab-row-date">' + escHtml(dateLabel) + '</div>' +
        '<div class="ab-row-meta">' + b.keyCount + ' keys · ' + sizeKb + ' KB · ' + escHtml(b.version) + ' · captured ' + escHtml(captured) + '</div>' +
        '</div>' +
        '<div class="ab-row-actions">' +
        '<button class="btn btn-sm btn-ghost" onclick="downloadAutoBackup(\'' + b.key + '\')" aria-label="Download this snapshot">Download</button>' +
        '<button class="btn btn-sm" onclick="restoreFromAutoBackup(\'' + b.key + '\')" aria-label="Restore from this snapshot">Restore</button>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  function _apiKeyDebouncedSave() {
    if (_apiKeyDebounceTimer) clearTimeout(_apiKeyDebounceTimer);
    _apiKeyDebounceTimer = setTimeout(() => {
      autoSaveApiKey();
      _apiKeyDebounceTimer = null;
    }, API_KEY_AUTOSAVE_DEBOUNCE_MS);
  }

  function autoSaveApiKey() {
    try {
      const input = document.getElementById('api-key');
      if (!input) return;
      const raw = input.value || '';
      const key = raw.trim();
      const status = document.getElementById('api-key-status');
      if (key.length === 0) {
        // Empty — clear the saved key + show neutral status
        try { localStorage.removeItem(STORAGE.KEY); } catch (_) {}
        if (typeof apiKey !== 'undefined') apiKey = '';
        if (status) {
          status.classList.add('is-hidden');
          status.textContent = '';
        }
        return;
      }
      // Validate format — Anthropic keys start with sk-ant-
      if (!key.startsWith('sk-ant-')) {
        if (status) {
          status.classList.remove('is-hidden');
          status.className = 'api-key-status api-key-status-warn';
          status.textContent = '⚠ Doesn\'t look like an Anthropic key (should start with sk-ant-)';
        }
        return; // don't save malformed input
      }
      // Persist + update in-memory
      localStorage.setItem(STORAGE.KEY, key);
      if (typeof apiKey !== 'undefined') apiKey = key;
      // If the input had whitespace, replace its value with the trimmed
      // version so what the user sees matches what's saved.
      if (raw !== key) input.value = key;
      if (status) {
        status.classList.remove('is-hidden');
        status.className = 'api-key-status api-key-status-ok';
        status.textContent = '✓ Saved · ' + key.slice(0, 12) + '…' + key.slice(-4);
      }
      // v4.85.16: clear any stale "invalid x-api-key" / similar API-error
      // banners now that a fresh valid key is on file. Defensive sweep —
      // the user-visible setup-err DIV could be lingering from a quiz that
      // failed before they fixed the key, and there's no other code path
      // that re-hides it once shown. Also clears any other .err-box on the
      // page in case future surfaces use the same pattern.
      if (typeof _clearStaleErrBoxes === 'function') _clearStaleErrBoxes();
    } catch (_) { /* defensive */ }
  }

  function _renderApiKeyStatusOnLoad() {
    try {
      const status = document.getElementById('api-key-status');
      const input = document.getElementById('api-key');
      if (!status || !input) return;
      const saved = localStorage.getItem(STORAGE.KEY) || '';
      if (saved.length > 0 && saved.startsWith('sk-ant-')) {
        // Note: we deliberately DO NOT mirror the saved key back into the
        // type=password input on load — that's standard browser behaviour
        // for credentials and changing it would be confusing. The status
        // pill just confirms a key is on file.
        status.classList.remove('is-hidden');
        status.className = 'api-key-status api-key-status-ok';
        status.textContent = '✓ Key saved · ' + saved.slice(0, 12) + '…' + saved.slice(-4);
      }
    } catch (_) {}
  }

  function scrollToSettings() {
    showPage('settings');
    if (typeof renderSettingsPage === 'function') renderSettingsPage();
  }

  function renderSettingsPage() {
    // v7.52.0: account Pass Plan home (Free one-plan + upsell, Pro plan-per-cert)
    if (typeof renderPassPlanSection === 'function') renderPassPlanSection();
    if (typeof renderWrongBankBtn === 'function') renderWrongBankBtn();
    // v4.54.10: sync the editable Daily Goal input with current value
    if (typeof syncSettingsDailyGoal === 'function') syncSettingsDailyGoal();
    // v4.54.16: render the exam-date chip using the shared _buildExamDateChipHtml helper
    if (typeof syncSettingsExamDate === 'function') syncSettingsExamDate();
    // #8: sync the Daily Review session-size chips + top-up toggle
    if (typeof renderSrSettings === 'function') renderSrSettings();
    // v7.45.0 GAP-6: show the Delete-my-account row for signed-in users
    if (typeof _syncDeleteAccountRow === 'function') _syncDeleteAccountRow();
    // v4.81.2: refresh the auto-backup list every time Settings opens so the
    // user sees what's available + can restore/download from any snapshot.
    if (typeof renderAutoBackupList === 'function') renderAutoBackupList();
    // v4.81.4: show the "✓ Key saved" status pill on Settings open if a key
    // is already on file — gives the user immediate confirmation.
    if (typeof _renderApiKeyStatusOnLoad === 'function') _renderApiKeyStatusOnLoad();
    // v4.81.11: top-of-page glanceable health (Codex r9 #5) — surfaces
    // exam date / daily goal / API key / backup status in one card so
    // the user can see whether their setup is safe at a glance.
    if (typeof renderSettingsHealthCard === 'function') renderSettingsHealthCard();
    // Stage 6 (bug-report popup): Reports recovery surface. Appended as a
    // new section at the bottom of .settings-layout (after § 03 Danger Zone)
    // on every Settings render — idempotent via #settings-reports-section.
    // The reports module is lazy-loaded; if its panel renderer is present,
    // it paints the queued reports list with Retry/Delete actions.
    try {
      var settingsLayout = document.querySelector('#page-settings .settings-layout');
      if (settingsLayout) {
        var reportsSection = document.getElementById('settings-reports-section');
        if (!reportsSection) {
          reportsSection = document.createElement('section');
          reportsSection.className = 'card settings-section';
          reportsSection.id = 'settings-reports-section';
          settingsLayout.appendChild(reportsSection);
        }
        if (typeof _loadFeature === 'function') {
          _loadFeature('reports').then(function(m){
            if (m && typeof m.renderSettingsReportsPanel === 'function') {
              m.renderSettingsReportsPanel(reportsSection);
            }
          }).catch(function(){});
        }
      }
    } catch (_) {}
  }

  function renderSettingsHealthCard() {
    const host = document.getElementById('settings-health-grid');
    if (!host) return;
    const rows = [];

    // 1. Cloud sync (v4.99.6 — _quotaState is the truth source).
    // If _quotaState is populated, the user IS signed in (we successfully
    // called the get_daily_quota_usage RPC, which requires an auth.uid()).
    // No localStorage probing or window-flag dependency.
    if (typeof _quotaState !== 'undefined' && _quotaState) {
      rows.push({
        icon: '✓', tier: 'ok', label: 'Cloud sync',
        value: 'Active. Your progress is saved across devices'
      });
    } else {
      rows.push({
        icon: '⚠', tier: 'warn', label: 'Cloud sync',
        value: 'Sign in to sync your progress to the cloud'
      });
    }

    // 2. Exam date
    let examDate = null;
    try { examDate = (typeof getExamDate === 'function') ? getExamDate() : null; } catch (_) {}
    if (examDate) {
      let daysToExam = null;
      try { daysToExam = (typeof getDaysToExam === 'function') ? getDaysToExam() : null; } catch (_) {}
      const formatted = new Date(examDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      const tier = daysToExam !== null && daysToExam < 0 ? 'warn' : 'ok';
      const suffix = daysToExam !== null
        ? (daysToExam > 0 ? ' · ' + daysToExam + ' day' + (daysToExam === 1 ? '' : 's') + ' away' : daysToExam === 0 ? ' · today!' : ' · passed')
        : '';
      rows.push({ icon: tier === 'ok' ? '✓' : '⚠', tier, label: 'Exam date', value: formatted + suffix });
    } else {
      rows.push({
        icon: '⚠', tier: 'warn', label: 'Exam date',
        value: 'Not set. Add it to start your exam countdown'
      });
    }

    // 3. Daily goal
    // v4.99.6 FIX: previous direct-parseInt logic broke when the stored value
    // was a JSON object (legacy format from pre-v4.81.11). parseInt('{"goal":20...')
    // returns NaN, isUserSetGoal becomes false, row reports "Not set" even though
    // the goal IS set (and visible in the Daily Goal input below). Now uses
    // getDailyGoal() which handles both formats correctly + treats anything
    // explicitly stored as user-set.
    let goal = 0;
    let isUserSetGoal = false;
    try {
      const rawStored = localStorage.getItem(STORAGE.DAILY_GOAL);
      const fromHelper = (typeof getDailyGoal === 'function') ? getDailyGoal() : 0;
      isUserSetGoal = rawStored !== null && Number.isFinite(fromHelper) && fromHelper > 0;
      goal = isUserSetGoal ? fromHelper : 0;
    } catch (_) { isUserSetGoal = false; goal = 0; }
    if (isUserSetGoal) {
      rows.push({
        icon: '✓', tier: 'ok', label: 'Daily goal',
        value: goal + ' question' + (goal === 1 ? '' : 's') + ' / day'
      });
    } else {
      rows.push({
        icon: '⚠', tier: 'warn', label: 'Daily goal',
        value: 'Not set. Pick one you can hit every day'
      });
    }

    // 4. Local backup tile retired in v4.99.6 — cloud sync (Phase C′) is the
    // primary recovery path, so the local safety net info became redundant
    // for users. Backups still run quietly in the background (v4.81.2
    // _takeAutoBackup), accessible via Settings → Data & Backups → Restore.

    // 5. Today's progress
    // v4.81.26 FIX: this section was reading today's progress from a JSON
    // object stored at STORAGE.DAILY_GOAL with a `current` + `date` field —
    // same v4.81.11 schema-mismatch bug as section 3 above. Today's question
    // count actually comes from `getTodayQuestionCount()` (sum of e.total
    // across history rows with today's date — see app.js:4793). Switched
    // to use that helper, matching what `renderDailyGoalCard()` does on
    // the homepage so the two surfaces stay in sync.
    try {
      const todayCount = (typeof getTodayQuestionCount === 'function') ? getTodayQuestionCount() : 0;
      if (isUserSetGoal && goal > 0) {
        const pct = Math.min(100, Math.round((todayCount / goal) * 100));
        const tier = todayCount >= goal ? 'ok' : todayCount >= goal * 0.5 ? 'mid' : 'warn';
        const icon = tier === 'ok' ? '✓' : tier === 'mid' ? '◐' : '○';
        rows.push({
          icon, tier, label: 'Today',
          value: todayCount + ' / ' + goal + ' questions · ' + pct + '%'
        });
      } else {
        rows.push({ icon: '○', tier: 'warn', label: 'Today', value: 'Set a daily goal first' });
      }
    } catch (_) {}

    host.innerHTML = rows.map(r =>
      '<div class="settings-health-row settings-health-' + r.tier + '">' +
      '<span class="settings-health-icon">' + r.icon + '</span>' +
      '<div class="settings-health-text">' +
      '<div class="settings-health-label">' + escHtml(r.label) + '</div>' +
      '<div class="settings-health-value">' + escHtml(r.value) + '</div>' +
      '</div>' +
      '</div>'
    ).join('');
  }

  function syncSettingsDailyGoal() {
    const input = document.getElementById('settings-daily-input');
    if (!input) return;
    const current = (typeof getDailyGoal === 'function') ? getDailyGoal() : 20;
    input.value = current;
    // Highlight any matching preset chip
    document.querySelectorAll('.settings-daily-chip').forEach(c => {
      c.classList.toggle('is-active', parseInt(c.getAttribute('data-goal'), 10) === current);
    });
  }

  function pickSettingsDailyPreset(n) {
    const input = document.getElementById('settings-daily-input');
    if (input) input.value = n;
    document.querySelectorAll('.settings-daily-chip').forEach(c => {
      c.classList.toggle('is-active', parseInt(c.getAttribute('data-goal'), 10) === n);
    });
  }

  function saveSettingsDailyGoal() {
    // GAP-3: free tier has a fixed 15/day allowance — controls are CSS-hidden,
    // this guard is the enforcement behind the curtain.
    if (typeof _srIsFreeTier === 'function' && _srIsFreeTier()) return;
    const input = document.getElementById('settings-daily-input');
    if (!input) return;
    const v = parseInt(input.value, 10);
    if (!Number.isFinite(v) || v <= 0 || v > 500) {
      if (typeof showErrorToast === 'function') showErrorToast('Enter a number between 1 and 500.');
      return;
    }
    if (typeof setDailyGoal === 'function') setDailyGoal(v);
    // Refresh the homepage cards that read daily goal so next visit is in sync
    try { if (typeof renderReadinessCard === 'function') renderReadinessCard(); } catch (_) {}
    try { if (typeof renderHeroV2MiniCards === 'function') renderHeroV2MiniCards(); } catch (_) {}
    // Re-sync preset highlight
    syncSettingsDailyGoal();
    if (typeof showSuccessToast === 'function') showSuccessToast(`Daily goal saved — ${v} questions/day`);
  }

  function pickSrSessionSize(n) {
    // GAP-3: free tier reviews a fixed 5 cards/day (SR_FREE_DAILY_CAP)
    if (typeof _srIsFreeTier === 'function' && _srIsFreeTier()) return;
    const prefs = loadSrPrefs();
    prefs.sessionSize = n;
    saveSrPrefs(prefs);
    renderSrSettings();
    if (typeof showSuccessToast === 'function') {
      showSuccessToast('Review session size: ' + (n === 'all' ? 'all due cards' : n + ' cards'));
    }
  }

  function toggleSrTopUp() {
    // GAP-3: light-day top-ups are Pro-only
    if (typeof _srIsFreeTier === 'function' && _srIsFreeTier()) return;
    const prefs = loadSrPrefs();
    prefs.topUp = !prefs.topUp;
    saveSrPrefs(prefs);
    renderSrSettings();
  }

  function renderSrSettings() {
    const prefs = loadSrPrefs();
    // Bind listeners once (no inline on* handlers — keeps the Sec-P7 ratchet falling).
    document.querySelectorAll('.sr-size-chip').forEach(c => {
      const v = c.getAttribute('data-size');
      if (!c._srBound) {
        c._srBound = true;
        c.addEventListener('click', () => pickSrSessionSize(v === 'all' ? 'all' : parseInt(v, 10)));
      }
      const match = (v === 'all') ? (prefs.sessionSize === 'all') : (parseInt(v, 10) === prefs.sessionSize);
      c.classList.toggle('is-active', match);
    });
    const tog = document.getElementById('sr-topup-toggle');
    if (tog) {
      if (!tog._srBound) { tog._srBound = true; tog.addEventListener('click', toggleSrTopUp); }
      tog.classList.toggle('is-on', !!prefs.topUp);
      tog.setAttribute('aria-checked', prefs.topUp ? 'true' : 'false');
    }
  }

  function _syncDeleteAccountRow() {
    var section = document.getElementById('settings-delete-account');
    if (!section) return;
    var signedIn = (typeof window !== 'undefined' && window._certanvilSignedIn === true);
    if (signedIn) section.removeAttribute('hidden');
    else section.setAttribute('hidden', '');
    var btn = document.getElementById('btn-app-delete-account');
    if (btn && !btn._dlaBound) {
      btn._dlaBound = true;
      btn.addEventListener('click', function () {
        if (typeof _showDeleteAccountConfirmUI === 'function') _showDeleteAccountConfirmUI();
      });
    }
  }

  function _showDeleteAccountConfirmUI() {
    var sb = window.certanvilSupabase;
    if (!sb) return;
    sb.auth.getSession().then(function (s) {
      var session = s && s.data && s.data.session;
      if (!session || !session.user) return;
      var email = session.user.email || '';
      var userId = session.user.id;

      var prev = document.getElementById('delete-account-modal');
      if (prev) prev.remove();

      var modal = document.createElement('div');
      modal.id = 'delete-account-modal';
      modal.className = 'quota-exceeded-modal';  // reuse overlay scrim
      modal.innerHTML =
        '<div class="dlpb-card dla-card" role="dialog" aria-modal="true" aria-label="Delete your account">' +
          '<div class="dlpb-lockmark dla-mark" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path>' +
            '</svg>' +
          '</div>' +
          '<h2 class="dlpb-title">Delete your account?</h2>' +
          '<p class="dlpb-lede">Here is exactly what gets removed after the 7-day grace window:</p>' +
          '<div class="dlpb-allow dla-terms">' +
            '<div class="dlpb-row"><span class="dlpb-row-tx"><b>Progress and history</b><span>Quiz history, streaks, and readiness scores</span></span></div>' +
            '<div class="dlpb-row"><span class="dlpb-row-tx"><b>Review queue</b><span>Saved cards and their schedule</span></span></div>' +
            '<div class="dlpb-row"><span class="dlpb-row-tx"><b>Your profile</b><span>Email, exam date, and cert results</span></span></div>' +
          '</div>' +
          '<p class="dlpb-pro-line">Sign in any time in the next <b>7 days</b> to cancel. After that it&rsquo;s gone for good.</p>' +
          '<div class="dla-confirm">' +
            '<label for="dla-email">Type <b>' + email.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</b> to confirm</label>' +
            '<input id="dla-email" type="email" inputmode="email" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Your email" />' +
          '</div>' +
          '<div class="dlpb-actions">' +
            '<button type="button" class="dla-danger-btn" id="dla-confirm" disabled>Delete account</button>' +
            '<button type="button" class="dlpb-ghost" id="dla-cancel">Cancel</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);

      var input = document.getElementById('dla-email');
      var confirmBtn = document.getElementById('dla-confirm');
      if (input && confirmBtn) {
        input.addEventListener('input', function () {
          confirmBtn.disabled = (input.value.trim().toLowerCase() !== email.toLowerCase());
        });
      }
      var cancelBtn = document.getElementById('dla-cancel');
      if (cancelBtn) cancelBtn.addEventListener('click', function () { modal.remove(); });
      modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
      if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {
          if (confirmBtn.disabled) return;
          if (typeof _confirmDeleteAccount === 'function') _confirmDeleteAccount(modal, userId);
        });
      }
    });
  }

  // ── window re-exposure (HTML onclick/onchange/oninput) ──
  window.scrollToSettings = scrollToSettings;
  window.renderSettingsPage = renderSettingsPage;
  window.saveSettingsDailyGoal = saveSettingsDailyGoal;
  window.pickSettingsDailyPreset = pickSettingsDailyPreset;
  window.pickSrSessionSize = pickSrSessionSize;
  window.toggleSrTopUp = toggleSrTopUp;
  window.downloadAutoBackup = downloadAutoBackup;
  window.restoreFromAutoBackup = restoreFromAutoBackup;
  window.autoSaveApiKey = autoSaveApiKey;
  window.exportData = exportData;
  window.importData = importData;
  window.clearWrongBank = clearWrongBank;

  // ── feature registry ──
  window._certanvilFeatures = window._certanvilFeatures || {};
  window._certanvilFeatures['settings'] = { enter: renderSettingsPage };
})();
