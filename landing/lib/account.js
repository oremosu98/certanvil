// ══════════════════════════════════════════════════════════════════════════
// CertAnvil — Account page logic (/account)
// ══════════════════════════════════════════════════════════════════════════
// Loaded after lib/supabase-umd.min.js + lib/supabase.js + auth.js.
//
// Responsibilities:
//   1. Auth-gate the page — anonymous users see the Sign-in CTA card.
//   2. Fetch the user's profile from Supabase (role + display_name + metadata)
//      and populate the identity card + Profile + Subscription sections.
//   3. Wire the 4 notification toggles to profiles.metadata.notifications.*
//      (toggles save immediately on click; visual state = persisted state).
//   4. Wire the data-export button to bundle profile + cert metadata + a
//      slice of quiz_history into a downloadable JSON.
//   5. Wire the sign-out-everywhere + delete-account flows.
//
// What this DOES NOT do (yet):
//   - Stripe billing portal integration (button is disabled with title hint;
//     Phase G ships the actual handoff).
//   - Email change flow (button disabled; needs Supabase RPC + verification).
//   - Multi-device session display (Supabase JS exposes only the current
//     session via getSession; admin-side sessions table query needs the
//     service-role key, which is server-only).
//   - Display-name edit (button shows a prompt() for now; Phase G replaces
//     with proper inline editing).
//
// All cross-cert account state is canonical here on certanvil.com.
// Cert-app /settings stays for app-prefs (exam date, daily goal, API key).
// ══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var supabase = window.certanvilSupabase;
  if (!supabase) {
    console.warn('[certanvil-account] Supabase client missing — page disabled');
    return;
  }

  // ── DOM refs ────────────────────────────────────────────────────────────
  var elLoading = document.getElementById('account-loading');
  var elAnonGate = document.getElementById('account-anon-gate');
  var elContent = document.getElementById('account-content');
  var elAdminCtaBanner = document.getElementById('admin-cta-banner');

  var elIdAvatar = document.getElementById('id-avatar');
  var elIdEmail = document.getElementById('id-email');
  var elIdTierPill = document.getElementById('id-tier-pill');
  var elIdTierLabel = document.getElementById('id-tier-label');
  var elIdAdminPill = document.getElementById('id-admin-pill');
  var elIdMetaText = document.getElementById('id-meta-text');

  var elProfileEmail = document.getElementById('profile-email-display');
  var elProfileDisplayName = document.getElementById('profile-display-name');
  var elBtnEditDisplayName = document.getElementById('btn-edit-display-name');
  var elBtnChangeEmail = document.getElementById('btn-change-email');

  var elSubTierPill = document.getElementById('sub-tier-pill');
  var elSubTierLabel = document.getElementById('sub-tier-label');
  var elBtnUpgrade = document.getElementById('btn-upgrade');
  var elEntList = document.getElementById('ent-list');

  var elSecurityEmailMono = document.getElementById('security-email-mono');
  var elSessionList = document.getElementById('session-list');
  var elBtnSignOutEverywhere = document.getElementById('btn-sign-out-everywhere');

  var elNotifyCertLaunch = document.getElementById('notify-cert-launch');
  var elNotifyWeeklyProgress = document.getElementById('notify-weekly-progress');
  var elNotifyExamApproaching = document.getElementById('notify-exam-approaching');
  var elNotifyMarketing = document.getElementById('notify-marketing');

  var elBtnExportData = document.getElementById('btn-export-data');
  var elBtnDeleteAccount = document.getElementById('btn-delete-account');
  var elDeletionStatus = document.getElementById('deletion-status');

  // ── State ──────────────────────────────────────────────────────────────
  var currentUser = null;
  var currentProfile = null;

  // Default notification preferences for a brand-new user. Marketing OFF
  // by default per user-respect default; everything else ON.
  var DEFAULT_NOTIFICATIONS = {
    cert_launch: true,
    weekly_progress: true,
    exam_approaching: true,
    marketing: false
  };

  // ── Toast helper ────────────────────────────────────────────────────────
  function toast(msg, kind) {
    var stack = document.getElementById('toast-stack');
    if (!stack) return;
    var t = document.createElement('div');
    t.className = 'toast toast-' + (kind || 'info');
    t.textContent = msg;
    stack.appendChild(t);
    setTimeout(function () { t.classList.add('is-fading'); }, 2400);
    setTimeout(function () { try { stack.removeChild(t); } catch (e) {} }, 3000);
  }

  // ── Cert pack catalog (local — same data as the landing's tile grid) ──
  // Phase G replaces with a query against cert_entitlements + a cert_packs
  // table. For now: hardcoded list of certs the user has access to, gated
  // by role for the admin's Security+ access.
  function getCertEntitlements(role) {
    var certs = [{
      id: 'netplus',
      name: 'Network+',
      code: 'N10-009',
      glyphClass: 'netplus',
      glyph: 'N+',
      meta: 'unlocked free · no expiry',
      // The user is the builder who passed Network+ — every signed-in user
      // sees Network+ as available; "passed" surfaces only if quiz_history
      // shows a successful exam attempt (Phase G refines via real query).
      status: 'active',  // 'active' | 'passed' | 'locked'
      cta: { label: 'Open →', href: 'https://networkplus.certanvil.com/?cert=netplus' }
    }];
    if (role === 'admin') {
      certs.push({
        id: 'secplus',
        name: 'Security+',
        code: 'SY0-701',
        glyphClass: 'secplus',
        glyph: 'S+',
        meta: 'private builder · target exam 2026-07-29',
        status: 'active',
        cta: { label: 'Resume →', href: 'https://networkplus.certanvil.com/?cert=secplus' }
      });
    } else {
      // Non-admin users see Security+ as locked (upgrade tease)
      certs.push({
        id: 'secplus',
        name: 'Security+',
        code: 'SY0-701',
        glyphClass: 'locked',
        glyph: 'S+',
        meta: 'upgrade to Pro to unlock',
        status: 'locked',
        cta: { label: 'Upgrade →', href: '#', disabled: true, title: 'Stripe billing coming with Phase G' }
      });
    }
    return certs;
  }

  // ── Render: identity + profile + subscription ─────────────────────────
  function renderEverything(user, profile) {
    var role = (profile && profile.role) || 'user';
    var displayName = (profile && profile.display_name) || (user && user.email && user.email.split('@')[0]) || 'You';
    var email = (user && user.email) || '';
    var initial = email ? email.charAt(0).toUpperCase() : 'U';
    var createdAt = user && user.created_at ? new Date(user.created_at) : null;
    var memberSince = createdAt ? createdAt.toISOString().slice(0, 10) : '—';

    // Identity card
    if (elIdAvatar) elIdAvatar.textContent = initial;
    if (elIdEmail) elIdEmail.textContent = email;
    if (elIdMetaText) {
      var pieces = ['Member since ' + memberSince];
      if (role === 'admin') pieces.push('owner');
      elIdMetaText.textContent = pieces.join(' · ');
    }
    // Tier pill — Free for everyone tonight (Stripe + Pro tier ships in Phase G)
    if (elIdTierLabel) elIdTierLabel.textContent = 'Free tier' + (role === 'admin' ? ' · all certs' : '');
    if (elIdAdminPill) {
      if (role === 'admin') elIdAdminPill.removeAttribute('hidden');
      else elIdAdminPill.setAttribute('hidden', '');
    }

    // Admin CTA banner above identity card
    if (elAdminCtaBanner) {
      if (role === 'admin') elAdminCtaBanner.removeAttribute('hidden');
      else elAdminCtaBanner.setAttribute('hidden', '');
    }

    // Profile section
    if (elProfileEmail) elProfileEmail.textContent = email;
    if (elProfileDisplayName) elProfileDisplayName.textContent = displayName;

    // Subscription tier
    if (elSubTierLabel) elSubTierLabel.textContent = 'Free tier' + (role === 'admin' ? ' · all certs' : '');

    // Cert entitlements
    if (elEntList) elEntList.innerHTML = renderEntitlements(role);

    // Security email
    if (elSecurityEmailMono) elSecurityEmailMono.textContent = email;

    // Active sessions — only the current one is exposed by Supabase JS
    if (elSessionList) elSessionList.innerHTML = renderCurrentSession();

    // Notifications
    var notif = (profile && profile.metadata && profile.metadata.notifications) || DEFAULT_NOTIFICATIONS;
    setToggleState(elNotifyCertLaunch, notif.cert_launch !== false);
    setToggleState(elNotifyWeeklyProgress, notif.weekly_progress !== false);
    setToggleState(elNotifyExamApproaching, notif.exam_approaching !== false);
    setToggleState(elNotifyMarketing, notif.marketing === true);

    // Deletion status
    var deletionRequestedAt = profile && profile.metadata && profile.metadata.deletion_requested_at;
    if (deletionRequestedAt && elDeletionStatus) {
      var d = new Date(deletionRequestedAt);
      var purgeDate = new Date(d.getTime() + 7 * 86400000);
      elDeletionStatus.textContent = 'Deletion scheduled for ' + purgeDate.toISOString().slice(0, 10) + ' — sign in any time before then to cancel.';
      elDeletionStatus.removeAttribute('hidden');
    }
  }

  function renderEntitlements(role) {
    var certs = getCertEntitlements(role);
    return certs.map(function (c) {
      var statusPill = '';
      if (c.status === 'passed') {
        statusPill = '<span class="ent-status-pill is-passed">✓ Passed</span>';
      } else if (c.status === 'active') {
        statusPill = '<span class="ent-status-pill is-active"><span aria-hidden="true">●</span> Active</span>';
      } else if (c.status === 'locked') {
        statusPill = '<span class="ent-status-pill is-locked">🔒 Locked</span>';
      }
      var ctaAttrs = c.cta.disabled
        ? 'disabled aria-disabled="true" title="' + escapeHtml(c.cta.title || '') + '"'
        : 'data-href="' + escapeHtml(c.cta.href) + '"';
      var btnClass = c.cta.disabled ? 'btn-ghost-sm' : (c.status === 'locked' ? 'btn-primary-sm' : 'btn-ghost-sm');
      return ''
        + '<div class="ent-row' + (c.status === 'locked' ? ' is-locked' : '') + '">'
        +   '<div class="ent-glyph ' + c.glyphClass + '">' + escapeHtml(c.glyph) + '</div>'
        +   '<div class="ent-info">'
        +     '<div class="ent-name-row">'
        +       '<span class="ent-name">' + escapeHtml(c.name) + '</span>'
        +       statusPill
        +     '</div>'
        +     '<div class="ent-meta">' + escapeHtml(c.code) + ' · ' + escapeHtml(c.meta) + '</div>'
        +   '</div>'
        +   '<button class="' + btnClass + ' ent-cta-btn" ' + ctaAttrs + '>' + escapeHtml(c.cta.label) + '</button>'
        + '</div>';
    }).join('');
  }

  function renderCurrentSession() {
    var ua = navigator.userAgent || '';
    var device = 'This browser';
    if (/iPhone|iPad/.test(ua)) device = 'iOS device';
    else if (/Android/.test(ua)) device = 'Android device';
    else if (/Mac OS X/.test(ua)) device = 'Mac';
    else if (/Windows/.test(ua)) device = 'Windows PC';
    else if (/Linux/.test(ua)) device = 'Linux machine';

    var browser = 'Browser';
    if (/Edg\//.test(ua)) browser = 'Edge';
    else if (/Chrome\//.test(ua)) browser = 'Chrome';
    else if (/Safari\//.test(ua)) browser = 'Safari';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';

    return ''
      + '<div class="session-row">'
      +   '<div class="session-icon" aria-hidden="true">💻</div>'
      +   '<div class="session-info">'
      +     '<div class="session-name">' + escapeHtml(device) + ' · ' + escapeHtml(browser)
      +       ' <span class="session-current-pill">This device</span>'
      +     '</div>'
      +     '<div class="session-meta">Active right now · cookie-backed session (cross-subdomain)</div>'
      +   '</div>'
      + '</div>';
  }

  function setToggleState(btn, on) {
    if (!btn) return;
    if (on) {
      btn.classList.add('is-on');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('is-on');
      btn.setAttribute('aria-pressed', 'false');
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── Notification toggle persistence ─────────────────────────────────────
  function wireNotificationToggle(btn, key) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      var nextOn = !btn.classList.contains('is-on');
      setToggleState(btn, nextOn);
      saveNotificationPref(key, nextOn);
    });
  }

  function saveNotificationPref(key, value) {
    if (!currentUser) return;
    var meta = (currentProfile && currentProfile.metadata) || {};
    var notif = meta.notifications || {};
    notif[key] = value;
    var nextMeta = Object.assign({}, meta, { notifications: notif });

    supabase.from('profiles').update({ metadata: nextMeta }).eq('id', currentUser.id).then(function (r) {
      if (r.error) {
        console.error('[certanvil-account] notification save failed', r.error);
        toast('Couldn\'t save notification preference. Try again.', 'error');
        // Roll back the visual state
        setToggleState(document.getElementById('notify-' + key.replace(/_/g, '-')), !value);
        return;
      }
      currentProfile.metadata = nextMeta;
      toast('Saved.', 'success');
    }).catch(function (err) {
      console.error('[certanvil-account] notification save threw', err);
      toast('Couldn\'t save. Try again.', 'error');
    });
  }

  // ── Display-name edit (simple prompt for now) ───────────────────────────
  function wireDisplayNameEdit() {
    if (!elBtnEditDisplayName) return;
    elBtnEditDisplayName.addEventListener('click', function () {
      var current = elProfileDisplayName ? elProfileDisplayName.textContent : '';
      var next = prompt('Display name:', current);
      if (next == null || next.trim() === '' || next.trim() === current) return;
      var trimmed = next.trim().slice(0, 60);  // cap
      supabase.from('profiles').update({ display_name: trimmed }).eq('id', currentUser.id).then(function (r) {
        if (r.error) { toast('Couldn\'t save name. Try again.', 'error'); return; }
        if (elProfileDisplayName) elProfileDisplayName.textContent = trimmed;
        if (currentProfile) currentProfile.display_name = trimmed;
        toast('Display name updated.', 'success');
      }).catch(function () { toast('Couldn\'t save name.', 'error'); });
    });
  }

  // ── Cert entitlement CTAs ──────────────────────────────────────────────
  function wireEntitlementCtas() {
    if (!elEntList) return;
    elEntList.addEventListener('click', function (e) {
      var btn = e.target.closest('.ent-cta-btn[data-href]');
      if (!btn || btn.hasAttribute('disabled')) return;
      var href = btn.getAttribute('data-href');
      if (!href || href === '#') return;
      window.location.href = href;
    });
  }

  // ── Data export ────────────────────────────────────────────────────────
  function wireDataExport() {
    if (!elBtnExportData) return;
    elBtnExportData.addEventListener('click', function () {
      if (!currentUser) return;
      elBtnExportData.disabled = true;
      var origText = elBtnExportData.textContent;
      elBtnExportData.textContent = 'Building archive…';

      // Pull the user's profile + recent quiz_history (latest 500 rows)
      Promise.all([
        supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
        supabase.from('quiz_history').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(500),
      ]).then(function (results) {
        var archive = {
          exported_at: new Date().toISOString(),
          exported_by: currentUser.email,
          source: 'certanvil.com/account · data export',
          profile: results[0].data || null,
          profile_error: results[0].error ? results[0].error.message : null,
          quiz_history: (results[1].data || []),
          quiz_history_count: (results[1].data || []).length,
          quiz_history_error: results[1].error ? results[1].error.message : null,
        };
        var json = JSON.stringify(archive, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'certanvil-account-' + currentUser.email.replace(/[^a-z0-9]/gi, '_') + '-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('Downloaded. Profile + ' + (archive.quiz_history.length) + ' quiz history rows.', 'success');
      }).catch(function (err) {
        console.error('[certanvil-account] export failed', err);
        toast('Export failed. Try again.', 'error');
      }).then(function () {
        elBtnExportData.disabled = false;
        elBtnExportData.textContent = origText;
      });
    });
  }

  // ── Sign out everywhere ────────────────────────────────────────────────
  function wireSignOutEverywhere() {
    if (!elBtnSignOutEverywhere) return;
    elBtnSignOutEverywhere.addEventListener('click', function () {
      if (!confirm('Sign out of every device, including this one? You\'ll need to sign in again next time.')) return;
      supabase.auth.signOut({ scope: 'global' }).then(function () {
        window.location.href = '/';
      }).catch(function () {
        // Fallback: local sign-out
        supabase.auth.signOut().then(function () { window.location.href = '/'; });
      });
    });
  }

  // ── Delete account (soft-delete via metadata flag) ─────────────────────
  function wireDeleteAccount() {
    if (!elBtnDeleteAccount) return;
    elBtnDeleteAccount.addEventListener('click', function () {
      if (!currentUser) return;
      var msg = 'Delete your CertAnvil account?\n\n'
        + 'This marks your account for deletion. After 7 days, your profile + quiz history are permanently purged.\n\n'
        + 'You can cancel during the grace window by signing in and clicking "Cancel deletion" below this button.\n\n'
        + 'Are you sure?';
      if (!confirm(msg)) return;

      var meta = (currentProfile && currentProfile.metadata) || {};
      var nextMeta = Object.assign({}, meta, {
        deletion_requested_at: new Date().toISOString(),
      });
      supabase.from('profiles').update({ metadata: nextMeta }).eq('id', currentUser.id).then(function (r) {
        if (r.error) { toast('Couldn\'t schedule deletion. Try again.', 'error'); return; }
        currentProfile.metadata = nextMeta;
        var purgeDate = new Date(Date.now() + 7 * 86400000);
        if (elDeletionStatus) {
          elDeletionStatus.textContent = 'Deletion scheduled for ' + purgeDate.toISOString().slice(0, 10) + ' — sign in any time before then to cancel.';
          elDeletionStatus.removeAttribute('hidden');
        }
        toast('Account marked for deletion. 7-day grace window.', 'info');
      }).catch(function () { toast('Couldn\'t schedule deletion.', 'error'); });
    });
  }

  // ── Init: auth-gate + populate ────────────────────────────────────────
  function init() {
    supabase.auth.getSession().then(function (r) {
      var session = r && r.data ? r.data.session : null;
      if (!session || !session.user) {
        // Anonymous — show gate
        if (elLoading) elLoading.setAttribute('hidden', '');
        if (elAnonGate) elAnonGate.removeAttribute('hidden');
        return;
      }
      currentUser = session.user;

      // Fetch profile (role, display_name, metadata)
      supabase.from('profiles').select('id, email, display_name, role, active_cert, exam_date, metadata, created_at, updated_at').eq('id', currentUser.id).single().then(function (pr) {
        currentProfile = pr.data || { role: 'user', display_name: null, metadata: {} };
        if (elLoading) elLoading.setAttribute('hidden', '');
        if (elContent) elContent.removeAttribute('hidden');
        renderEverything(currentUser, currentProfile);
      }).catch(function (err) {
        console.error('[certanvil-account] profile fetch failed', err);
        currentProfile = { role: 'user', display_name: null, metadata: {} };
        if (elLoading) elLoading.setAttribute('hidden', '');
        if (elContent) elContent.removeAttribute('hidden');
        renderEverything(currentUser, currentProfile);
      });
    }).catch(function (err) {
      console.error('[certanvil-account] getSession failed', err);
      if (elLoading) elLoading.setAttribute('hidden', '');
      if (elAnonGate) elAnonGate.removeAttribute('hidden');
    });
  }

  // Wire everything once on load — these don't depend on the auth result
  // so they're safe to attach before init() resolves.
  wireNotificationToggle(elNotifyCertLaunch, 'cert_launch');
  wireNotificationToggle(elNotifyWeeklyProgress, 'weekly_progress');
  wireNotificationToggle(elNotifyExamApproaching, 'exam_approaching');
  wireNotificationToggle(elNotifyMarketing, 'marketing');
  wireDisplayNameEdit();
  wireEntitlementCtas();
  wireDataExport();
  wireSignOutEverywhere();
  wireDeleteAccount();

  // Initial auth check
  init();
})();
