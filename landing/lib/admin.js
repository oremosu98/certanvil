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
//   - Cert requests (Suggest a cert tally, sorted by votes; "Mark live & tell them" POSTs to /api/admin/notify-cert-live)
//   - Cert packs table (static roster — 8 live + 3 on the anvil; exemplar
//     counts mirror certs/*.js questionExemplars lengths, hand-synced on ship)
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
  var elRequestsTbody = document.getElementById('requests-tbody');
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
      fetchCertRequests(),
    ]).then(function (results) {
      var users = results[0];
      var appVersion = results[1];
      var ships = results[2];

      renderStats(users, appVersion);
      renderUsers(users);
      renderCertRequests(results[3]);
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

  // Cert requests (Suggest a cert). Read with the admin's own JWT: RLS lets is_admin() see the tally view. Postgres does
  // not promise a view's ORDER BY survives, so the order is asked for explicitly. The view carries pending (people not yet
  // told) and labels (every way the exam was written), so no per-person rows are read here.
  function fetchCertRequests() {
    return supabase.from('cert_request_tally').select('exam_key, label, votes, new_7d, last_at, typed, pending, labels')
      .order('votes', { ascending: false }).order('last_at', { ascending: false }).then(function (r) {
        if (r.error) { console.error('[certanvil-admin] cert tally fetch failed', r.error); return null; }
        return r.data || [];
      });
  }

  // Pure view model for the section: strip numbers + one row per exam. Exposed for tests.
  function buildCertRequestsModel(tally, now) {
    tally = tally || [];
    var max = 0, total = 0, week = 0, typedCount = 0;
    tally.forEach(function (t) {
      var v = Number(t.votes) || 0;
      if (v > max) max = v;
      total += v; week += Number(t.new_7d) || 0;
      if (t.typed) typedCount++;
    });
    var rows = tally.map(function (t) {
      var votes = Number(t.votes) || 0;
      var label = String(t.label || t.exam_key || '');
      var others = (Array.isArray(t.labels) ? t.labels : []).map(String).filter(function (l) { return l && l !== label; });
      return {
        examKey: String(t.exam_key || ''), label: label, votes: votes, new7: Number(t.new_7d) || 0,
        lastAt: t.last_at, typed: !!t.typed, pending: Number(t.pending) || 0,
        pct: max ? Math.max(4, Math.round(votes / max * 100)) : 0, others: others
      };
    });
    return { rows: rows, total: total, week: week, exams: tally.length, typedCount: typedCount, next: nextMonday(now || new Date()) };
  }

  // The Monday digest goes at 08:00 UTC on Mondays (vercel.json cron). Label: "Mon 2 Nov".
  function nextMonday(now) {
    var d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    var add = (8 - d.getUTCDay()) % 7;
    if (add === 0 && now.getUTCHours() >= 8) add = 7;
    d.setUTCDate(d.getUTCDate() + add);
    var mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
    return 'Mon ' + d.getUTCDate() + ' ' + mon;
  }

  function glyph(label) {
    var s = String(label || '').replace(/[^A-Za-z0-9]/g, '');
    return (s.slice(0, 2) || '?').toUpperCase();
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

    if (elStatCertPacks) elStatCertPacks.textContent = '8';
    if (elStatCertPacksDelta) elStatCertPacksDelta.textContent = '8 live · 3 on the anvil';

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
    elUsersTbody.innerHTML = sanitizeRows(users.map(function (u) {
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
    }).join(''));
  }

  function renderCertRequests(tally) {
    if (!elRequestsTbody) return;
    var m = buildCertRequestsModel(tally);
    function put(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
    if (tally == null) {
      elRequestsTbody.innerHTML = '<tr><td colspan="5" class="admin-table-empty">Could not load cert requests.</td></tr>';
      return;
    }
    put('cr-total', String(m.total));
    put('cr-week', '+' + m.week);
    put('cr-exams', String(m.exams));
    put('cr-typed', m.typedCount + ' typed in');
    put('cr-next', m.next);
    renderMailPreview(m);
    if (!m.rows.length) {
      elRequestsTbody.innerHTML = '<tr><td colspan="5" class="admin-table-empty">No requests yet.</td></tr>';
      return;
    }
    elRequestsTbody.innerHTML = sanitizeRows(m.rows.map(function (r) {
      var sub = r.typed
        ? (r.others.length ? 'Also written: ' + r.others.join(', ') : 'Typed in')
        : r.examKey;
      var tag = r.typed ? '<span class="cr-tag">Typed</span>' : '';
      var act = r.pending > 0
        ? '<button class="cr-act" type="button" data-key="' + escapeHtml(r.examKey) + '" data-label="' + escapeHtml(r.label) + '" data-pending="' + r.pending + '">Mark live &amp; tell them</button>'
        : '<span class="cr-sent">Everyone told</span>';
      return ''
        + '<tr>'
        +   '<td><div class="cr-exam"><span class="cr-g' + (r.typed ? ' typed' : '') + '">' + (r.typed ? '+' : escapeHtml(glyph(r.label))) + '</span>'
        +     '<span><span class="cr-name">' + escapeHtml(r.label) + tag + '</span><span class="cr-sub">' + escapeHtml(sub) + '</span></span></div></td>'
        +   '<td><div class="cr-votes"><b>' + r.votes + '</b><span class="cr-bar"><i style="width:' + r.pct + '%"></i></span></div></td>'
        +   '<td>' + (r.new7 > 0 ? '<span class="cr-new">+' + r.new7 + '</span>' : '<span class="cr-new zero">None</span>') + '</td>'
        +   '<td class="mono">' + escapeHtml(r.lastAt ? formatRelative(r.lastAt) : '—') + '</td>'
        +   '<td class="cr-cell">' + act + '</td>'
        + '</tr>';
    }).join(''));
  }

  // Same wording as the Monday email (api/admin/cert-requests-digest.js), drawn from the live numbers.
  function renderMailPreview(m) {
    var box = document.getElementById('requests-mail');
    var subj = document.getElementById('cr-mail-subject');
    var body = document.getElementById('cr-mail-body');
    if (!box || !subj || !body) return;
    subj.textContent = 'Cert requests this week: ' + m.week + ' new';
    if (!m.rows.length) { body.textContent = 'No new requests this week.'; box.hidden = false; return; }
    var top = m.rows.slice(0, 3).map(function (r) {
      return '<li><b>' + escapeHtml(r.label) + '</b> · ' + r.votes + (r.new7 > 0 ? ' (+' + r.new7 + ')' : '') + '</li>';
    }).join('');
    var typed = m.rows.filter(function (r) { return r.typed && r.new7 > 0; }).map(function (r) { return escapeHtml(r.label); });
    body.innerHTML = '<span class="cr-mail-k">Most asked</span><ol>' + top + '</ol>'
      + (typed.length ? '<span class="cr-mail-k">New typed in</span>' + typed.join(', ') + '<br><br>' : '')
      + 'See them all on your dashboard.';
    box.hidden = false;
  }

  // "Mark live & tell them": an inline Send / Cancel in the row (no browser dialog), then POSTs with the admin's access
  // token, one batch per call, until the server says nothing remains. The server re-checks admin and does the sending.
  function people(n) { return n + (n === 1 ? ' person' : ' people'); }

  function onRequestsClick(e) {
    var t = e.target;
    var act = t && t.closest ? t.closest('.cr-act') : null;
    if (act && !act.disabled) { askConfirm(act); return; }
    var no = t && t.closest ? t.closest('.cr-confirm .no') : null;
    if (no) { cancelConfirm(no.closest('.cr-cell')); return; }
    var yes = t && t.closest ? t.closest('.cr-confirm .yes') : null;
    if (yes && !yes.disabled) startSend(yes.closest('.cr-cell'));
  }

  function askConfirm(btn) {
    var cell = btn.parentNode;
    var n = parseInt(btn.getAttribute('data-pending'), 10) || 0;
    cell._btn = btn;
    var box = document.createElement('div');
    box.className = 'cr-confirm';
    box.setAttribute('role', 'group');
    var msg = document.createElement('span');
    msg.textContent = 'Email ' + people(n) + ' that ' + (btn.getAttribute('data-label') || '') + ' is live?';
    var yes = document.createElement('button'); yes.type = 'button'; yes.className = 'yes'; yes.textContent = 'Send';
    var no = document.createElement('button'); no.type = 'button'; no.className = 'no'; no.textContent = 'Cancel';
    box.appendChild(msg); box.appendChild(yes); box.appendChild(no);
    cell.innerHTML = '';
    cell.appendChild(box);
    yes.focus();
  }

  function cancelConfirm(cell) {
    if (!cell || !cell._btn) return;
    cell.innerHTML = '';
    cell.appendChild(cell._btn);
    cell._btn.focus();
  }

  function startSend(cell) {
    var btn = cell._btn;
    var key = btn.getAttribute('data-key') || '', label = btn.getAttribute('data-label') || '';
    var tot = { sent: 0, failed: 0, skipped: 0 };
    var box = cell.querySelector('.cr-confirm');
    var yes = box.querySelector('.yes'), no = box.querySelector('.no');
    yes.disabled = true; no.disabled = true; yes.textContent = 'Sending…';
    var msg = box.querySelector('span');
    function progress() { msg.textContent = 'Sent to ' + people(tot.sent) + '…'; msg.setAttribute('role', 'status'); }
    function stop(text, retry) {
      cell.innerHTML = '';
      var d = document.createElement('div');
      d.className = retry ? 'cr-err' : 'cr-sent'; d.setAttribute('role', retry ? 'alert' : 'status'); d.textContent = text;
      if (retry) {
        btn.setAttribute('data-pending', String(Math.max(1, tot.failed + tot.skipped)));
        cell.appendChild(btn); cell.appendChild(d);
      } else cell.appendChild(d);
    }
    function summary() {
      var lost = tot.failed + tot.skipped;
      return 'Sent to ' + people(tot.sent) + '.' + (lost ? ' ' + lost + ' couldn\'t' + ' be reached.' : '');
    }
    function step(after) {
      return supabase.auth.getSession().then(function (r) {
        var token = r && r.data && r.data.session ? r.data.session.access_token : '';
        if (!token) throw new Error('auth');
        return fetch('/api/admin/notify-cert-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ exam_key: key, label: label, after: after || undefined })
        });
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, status: res.status, body: j }; });
      }).then(function (out) {
        if (!out.ok) { var err = new Error('http'); err.status = out.status; err.code = out.body && out.body.error; throw err; }
        var b = out.body;
        tot.sent += Number(b.sent) || 0; tot.failed += Number(b.failed) || 0; tot.skipped += Number(b.skipped) || 0;
        progress();
        if (b.paused) { stop(summary() + ' Email is busy, try again in a minute.', true); return; }
        if ((Number(b.remaining) || 0) > 0 && b.next && b.next !== after) return step(b.next);
        if (tot.failed + tot.skipped > 0) { stop(summary(), true); return; }
        stop(summary(), false);
      });
    }
    step('').catch(function (err) {
      var why = err && err.message === 'auth' ? 'Sign in again, then retry.'
        : err && err.status === 503 ? 'Email is not set up yet.'
        : err && err.status === 409 ? 'That exam changed. Reload the page.'
        : 'Could not finish. Try again.';
      stop('Sent to ' + people(tot.sent) + ' so far. ' + why, true);
    });
  }
  if (elRequestsTbody) elRequestsTbody.addEventListener('click', onRequestsClick);

  function renderCertPacks() {
    if (!elCertsTbody) return;
    var packs = [
      { name: 'Network+', code: 'N10-009', visibility: 'Public · Free', bank: '320 exemplars', status: 'Live · networkplus.certanvil.com', live: true },
      { name: 'Security+', code: 'SY0-701', visibility: 'Public · Pro', bank: '237 exemplars', status: 'Live · secplus.certanvil.com', live: true },
      { name: 'Azure Fundamentals', code: 'AZ-900', visibility: 'Public · Pro', bank: '194 exemplars', status: 'Live · azure.certanvil.com', live: true },
      { name: 'Azure AI Fundamentals', code: 'AI-901', visibility: 'Public · Pro', bank: '200 exemplars', status: 'Live · ai.certanvil.com', live: true },
      { name: 'CompTIA A+ Core 1', code: '220-1201', visibility: 'Public · Pro', bank: '200 exemplars', status: 'Live · aplus.certanvil.com', live: true },
      { name: 'CompTIA A+ Core 2', code: '220-1202', visibility: 'Public · Pro', bank: '200 exemplars', status: 'Live · aplus.certanvil.com', live: true },
      { name: 'Microsoft SC-900', code: 'SC-900', visibility: 'Public · Pro', bank: '200 exemplars', status: 'Live · sc900.certanvil.com', live: true },
      { name: 'AWS Cloud Practitioner', code: 'CLF-C02', visibility: 'Public · Pro', bank: '200 exemplars', status: 'Live · clfc02.certanvil.com', live: true },
      { name: 'Cisco CCNA', code: '200-301', visibility: 'Coming-soon tile', bank: '—', status: 'Notify-me CTA', live: false },
      { name: 'AWS Solutions Architect', code: 'SAA-C03', visibility: 'Coming-soon tile', bank: '—', status: 'Notify-me CTA', live: false },
      { name: 'Azure Administrator', code: 'AZ-104', visibility: 'Coming-soon tile', bank: '—', status: 'Notify-me CTA', live: false },
    ];
    elCertsTbody.innerHTML = packs.map(function (p) {
      return ''
        + '<tr' + (p.live ? '' : ' style="opacity:.65"') + '>'
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
    elShipsTbody.innerHTML = sanitizeRows(ships.map(function (s) {
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
    }).join(''));
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

  // Sec-P4/M6: DOMPurify defence-in-depth backstop over the innerHTML sinks
  // rendering cross-user / remote data (admin user rows from Supabase profiles,
  // ship commits from the GitHub API). escapeHtml above is the primary, always-on
  // escape; this is the second layer that still neutralises an injected
  // <script>/<img onerror>/<iframe> if a single escape is ever missed upstream.
  //
  // The sinks emit bare <tr>…</tr> fragments. DOMPurify parses input in a
  // detached context where table rows outside a <table> are DROPPED by the HTML
  // parser (verified: a bare <tr> collapses to its text node). So wrap the rows
  // in a <table> to preserve parser context, sanitize, then hand back the
  // sanitized <tbody> HTML. ADD_ATTR:['target'] keeps the GitHub ship links
  // opening in a new tab (rel="noopener" already guards tabnabbing). DOMPurify
  // is vendored at landing/lib/dompurify.min.js, loaded before this file in
  // admin.html. Fails OPEN (returns input) if the bundle didn't load — escapeHtml
  // still applies.
  function sanitizeRows(rowsHtml) {
    if (rowsHtml == null) return '';
    var s = String(rowsHtml);
    var DP = (typeof window !== 'undefined') ? window.DOMPurify : null;
    if (!DP || typeof DP.sanitize !== 'function') return s;
    var clean = DP.sanitize('<table><tbody>' + s + '</tbody></table>', { ADD_ATTR: ['target'] });
    var tmp = document.createElement('div');
    tmp.innerHTML = clean;
    var tb = tmp.querySelector('tbody');
    return tb ? tb.innerHTML : s;
  }

  if (typeof window !== 'undefined') window._adminCertRequests = { build: buildCertRequestsModel, nextMonday: nextMonday };

  init();
})();
