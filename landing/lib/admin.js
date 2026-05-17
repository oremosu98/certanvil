// ══════════════════════════════════════════════════════════════════════════
// CertAnvil — Admin Dashboard logic (/admin)
// ══════════════════════════════════════════════════════════════════════════
// Loaded after lib/supabase-umd.min.js + lib/supabase.js + auth.js.
//
// Three-state auth gate:
//   1. Anonymous → show "Sign in to access admin" card.
//   2. Signed in but role ≠ 'admin' → show 403 "Admin access required" card.
//   3. Signed in + role === 'admin' → render dashboard.
//
// Server-side enforcement: profiles RLS allows SELECT on all rows when
// is_admin() returns true (Phase C′ migration). Without admin role, the
// users-table query returns just the user's own row, so the dashboard
// would be near-empty even if a non-admin somehow hit the page. The JS
// gate above is UX, not security.
//
// Sections:
//   - 4-stat hero (total users, active this week, cert packs live, app version)
//   - Users table (one row per profile)
//   - Cert packs table (static for now — public/private/coming-soon)
//   - Recent ships (last 10 commits via GitHub REST API, no auth needed for public repo)
//   - Telemetry placeholder (no backing data yet)
// ══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var supabase = window.certanvilSupabase;
  if (!supabase) {
    console.warn('[certanvil-admin] Supabase client missing — page disabled');
    return;
  }

  // ── DOM refs ────────────────────────────────────────────────────────────
  var elLoading = document.getElementById('admin-loading');
  var elAnonGate = document.getElementById('admin-anon-gate');
  var el403 = document.getElementById('admin-403-gate');
  var elContent = document.getElementById('admin-content');

  var elStatTotalUsers = document.getElementById('stat-total-users');
  var elStatTotalUsersDelta = document.getElementById('stat-total-users-delta');
  var elStatActiveWeek = document.getElementById('stat-active-week');
  var elStatActiveWeekDelta = document.getElementById('stat-active-week-delta');
  var elStatCertPacks = document.getElementById('stat-cert-packs');
  var elStatCertPacksDelta = document.getElementById('stat-cert-packs-delta');
  var elStatAppVersion = document.getElementById('stat-app-version');
  var elStatAppVersionDelta = document.getElementById('stat-app-version-delta');

  var elUsersTbody = document.getElementById('users-tbody');
  var elUsersTableMeta = document.getElementById('users-table-meta');
  var elCertsTbody = document.getElementById('certs-tbody');
  var elShipsTbody = document.getElementById('ships-tbody');

  // ── Init: auth gate ────────────────────────────────────────────────────
  function init() {
    supabase.auth.getSession().then(function (r) {
      var session = r && r.data ? r.data.session : null;
      if (!session || !session.user) {
        showAnon();
        return;
      }
      // Signed in — check admin role
      supabase.from('profiles').select('id, email, role').eq('id', session.user.id).single().then(function (pr) {
        var role = pr.data && pr.data.role;
        if (role === 'admin') {
          show403Or200(true, session.user);
        } else {
          show403Or200(false, session.user);
        }
      }).catch(function (err) {
        console.error('[certanvil-admin] role check failed', err);
        show403Or200(false, session.user);
      });
    }).catch(function (err) {
      console.error('[certanvil-admin] getSession failed', err);
      showAnon();
    });
  }

  function showAnon() {
    if (elLoading) elLoading.setAttribute('hidden', '');
    if (elAnonGate) elAnonGate.removeAttribute('hidden');
  }

  function show403Or200(isAdmin, user) {
    if (elLoading) elLoading.setAttribute('hidden', '');
    if (!isAdmin) {
      if (el403) el403.removeAttribute('hidden');
      return;
    }
    if (elContent) elContent.removeAttribute('hidden');
    loadDashboard(user);
  }

  // ── Dashboard data fetch + render ──────────────────────────────────────
  function loadDashboard(user) {
    // 4 parallel data sources
    Promise.all([
      fetchUsers(),
      fetchAppVersion(),
      fetchRecentShips(),
    ]).then(function (results) {
      var users = results[0];
      var appVersion = results[1];
      var ships = results[2];

      renderStats(users, appVersion);
      renderUsers(users);
      renderCertPacks();
      renderShips(ships);
    }).catch(function (err) {
      console.error('[certanvil-admin] dashboard load failed', err);
    });
  }

  function fetchUsers() {
    return supabase.from('profiles').select('id, email, display_name, role, active_cert, exam_date, metadata, created_at, updated_at').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) {
        console.error('[certanvil-admin] users fetch failed', r.error);
        return [];
      }
      return r.data || [];
    });
  }

  function fetchAppVersion() {
    // Read APP_VERSION from the cert app — same origin family, no CORS issue
    return fetch('https://networkplus.certanvil.com/app.js?v=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (src) {
        var m = src.match(/const APP_VERSION = '([0-9.]+)'/);
        return m ? m[1] : '';
      })
      .catch(function () { return ''; });
  }

  function fetchRecentShips() {
    // Public GitHub REST API — no auth required for public repo commits
    return fetch('https://api.github.com/repos/oremosu98/networkplus-quiz/commits?per_page=10')
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map(function (c) {
          var msg = (c.commit && c.commit.message) ? c.commit.message.split('\n')[0] : '(no message)';
          var sha = (c.sha || '').slice(0, 7);
          var date = c.commit && c.commit.author && c.commit.author.date ? c.commit.author.date : '';
          return { sha: sha, msg: msg, date: date, url: c.html_url || '' };
        });
      })
      .catch(function () { return []; });
  }

  function renderStats(users, appVersion) {
    var totalUsers = users.length;
    if (elStatTotalUsers) elStatTotalUsers.textContent = totalUsers.toLocaleString();
    if (elStatTotalUsersDelta) {
      var newThisMonth = users.filter(function (u) {
        if (!u.created_at) return false;
        return (Date.now() - new Date(u.created_at).getTime()) < 30 * 86400000;
      }).length;
      elStatTotalUsersDelta.textContent = newThisMonth > 0
        ? ('+' + newThisMonth + ' this month')
        : 'no new users this month';
    }

    var activeWeek = users.filter(function (u) {
      var ts = u.updated_at || u.created_at;
      if (!ts) return false;
      return (Date.now() - new Date(ts).getTime()) < 7 * 86400000;
    }).length;
    if (elStatActiveWeek) elStatActiveWeek.textContent = activeWeek.toLocaleString();
    if (elStatActiveWeekDelta) {
      var pct = totalUsers > 0 ? Math.round((activeWeek / totalUsers) * 100) : 0;
      elStatActiveWeekDelta.textContent = totalUsers > 0
        ? (pct + '% of all users')
        : '—';
    }

    if (elStatCertPacks) elStatCertPacks.textContent = '2';
    if (elStatCertPacksDelta) elStatCertPacksDelta.textContent = 'Network+ public · Security+ private';

    if (elStatAppVersion) elStatAppVersion.textContent = appVersion ? ('v' + appVersion) : 'v—';
    if (elStatAppVersionDelta) elStatAppVersionDelta.textContent = appVersion ? 'live on networkplus.certanvil.com' : 'unable to read version';

    // Update the SELECT meta hint with the row count
    if (elUsersTableMeta) elUsersTableMeta.textContent = 'SELECT * FROM profiles · ' + totalUsers + ' rows';
  }

  function renderUsers(users) {
    if (!elUsersTbody) return;
    if (!users.length) {
      elUsersTbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty">No users yet.</td></tr>';
      return;
    }
    elUsersTbody.innerHTML = users.map(function (u) {
      var role = u.role || 'user';
      var roleClass = role === 'admin' ? 'admin' : 'user';
      var roleLabel = role === 'admin' ? 'Admin' : 'User';
      var displayName = u.display_name || '—';
      var activeCert = u.active_cert || '—';
      var lastSeen = u.updated_at || u.created_at;
      var lastSeenLabel = lastSeen ? formatRelative(lastSeen) : '—';
      var tier = (u.metadata && u.metadata.tier) || 'Free';
      return ''
        + '<tr>'
        +   '<td class="mono">' + escapeHtml(u.email || '—') + '</td>'
        +   '<td><span class="admin-role-pill ' + roleClass + '">' + roleLabel + '</span></td>'
        +   '<td>' + escapeHtml(tier) + '</td>'
        +   '<td>' + escapeHtml(displayName) + '</td>'
        +   '<td>' + escapeHtml(activeCert) + '</td>'
        +   '<td class="mono">' + escapeHtml(lastSeenLabel) + '</td>'
        + '</tr>';
    }).join('');
  }

  function renderCertPacks() {
    if (!elCertsTbody) return;
    var packs = [
      { name: 'Network+', code: 'N10-009', visibility: 'Public', bank: '320 exemplars', status: 'Live · public tile + auto-deploy' },
      { name: 'Security+', code: 'SY0-701', visibility: 'Private (admin-only)', bank: '77 exemplars + Phase 2 growing', status: 'Hidden tile · admin-only via role check' },
      { name: 'AZ-900', code: 'AZ-900', visibility: 'Coming-soon tile', bank: '—', status: 'Notify-me CTA' },
      { name: 'Cisco CCNA', code: '200-301', visibility: 'Coming-soon tile', bank: '—', status: 'Notify-me CTA' },
      { name: 'AWS SAA', code: 'SAA-C03', visibility: 'Coming-soon tile', bank: '—', status: 'Notify-me CTA' },
      { name: 'Azure Admin', code: 'AZ-104', visibility: 'Coming-soon tile', bank: '—', status: 'Notify-me CTA' },
    ];
    elCertsTbody.innerHTML = packs.map(function (p) {
      return ''
        + '<tr' + (p.code !== 'N10-009' && p.code !== 'SY0-701' ? ' style="opacity:.65"' : '') + '>'
        +   '<td><strong>' + escapeHtml(p.name) + '</strong></td>'
        +   '<td class="mono">' + escapeHtml(p.code) + '</td>'
        +   '<td>' + escapeHtml(p.visibility) + '</td>'
        +   '<td class="mono">' + escapeHtml(p.bank) + '</td>'
        +   '<td>' + escapeHtml(p.status) + '</td>'
        + '</tr>';
    }).join('');
  }

  function renderShips(ships) {
    if (!elShipsTbody) return;
    if (!ships.length) {
      elShipsTbody.innerHTML = '<tr><td colspan="3" class="admin-table-empty">Couldn\'t load commits from GitHub.</td></tr>';
      return;
    }
    elShipsTbody.innerHTML = ships.map(function (s) {
      var dateStr = s.date ? formatRelative(s.date) : '—';
      var msgEsc = escapeHtml(s.msg);
      // Truncate very long messages for the table
      if (msgEsc.length > 100) msgEsc = msgEsc.slice(0, 100) + '…';
      return ''
        + '<tr>'
        +   '<td class="mono"><a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.sha) + '</a></td>'
        +   '<td>' + msgEsc + '</td>'
        +   '<td class="mono">' + escapeHtml(dateStr) + '</td>'
        + '</tr>';
    }).join('');
  }

  // ── Helpers ──────────────────────────────────────────────────────────
  function formatRelative(iso) {
    try {
      var d = new Date(iso);
      var diff = Date.now() - d.getTime();
      var seconds = Math.floor(diff / 1000);
      if (seconds < 60) return 'just now';
      if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
      if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
      if (seconds < 7 * 86400) return Math.floor(seconds / 86400) + 'd ago';
      return d.toISOString().slice(0, 10);
    } catch (e) { return iso; }
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

  init();
})();
