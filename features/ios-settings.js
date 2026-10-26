// Lift B4 (v8.193.0): Settings on phones (the Account tab), in the June E2E language (mockups/cert-ios-settings.html).
// Pure model/view pairs for the page and its two sheets, plus the phone host that features/settings.js calls from
// renderSettingsPage. Every action runs today's function; desktop Settings is untouched.
(function () {
  var MQ = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
  function isPhone() { return !!(MQ && MQ.matches); }

  // s = {signedIn, email, pro, cert: {name, code}, passPlanHtml, glance: {sync, exam: {date, days}|null, goal, today},
  //      goal, review: {size: 10|20|30|5|'all', topUp}, backups: [{iso, bytes, capturedAt}], wrongCount, still}
  function _iosStModel(s) {
    var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    function day(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? (parseInt(p[2], 10) + ' ' + MON[parseInt(p[1], 10) - 1]) : String(iso || ''); }
    var g = s.glance || {}, ex = g.exam;
    var examLabel = 'Not set';
    if (ex && ex.date) {
      var p = String(ex.date).split('-');
      examLabel = parseInt(p[2], 10) + ' ' + MON[parseInt(p[1], 10) - 1].slice(0, 3) + (typeof ex.days === 'number' ? ' · ' + ex.days + (ex.days === 1 ? ' day' : ' days') : '');
    }
    return {
      out: !s.signedIn, email: s.email || '', pro: !!s.pro, certName: (s.cert && s.cert.name) || '', certCode: (s.cert && s.cert.code) || '',
      passPlanHtml: s.passPlanHtml || '', sync: !!g.sync && !!s.signedIn, examLabel: examLabel, goal: Number(s.goal) || 15, glanceGoal: Number(g.goal) || Number(s.goal) || 15,
      today: Number(g.today) || 0, review: s.review || { size: 5, topUp: false }, wrongCount: Number(s.wrongCount) || 0, still: !!s.still,
      backups: (s.backups || []).map(function (b) {
        var t = String(b.capturedAt || '').slice(11, 16);
        return { iso: b.iso, date: b.label || day(b.iso), meta: (Math.round((Number(b.bytes) || 0) / 102.4) / 10).toFixed(1) + ' KB' + (t ? ' · saved ' + t : '') };
      })
    };
  }

  function _iosStHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function svg(p, n) { return '<svg viewBox="0 0 24 24" aria-hidden="true" width="' + (n || 16) + '" height="' + (n || 16) + '" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
    var I = {
      chev: '<path d="M9 6l6 6-6 6"></path>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>',
      cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.8A3.6 3.6 0 0 1 17.5 18z"></path>', cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"></rect><path d="M3.5 10h17M8 3v4M16 3v4"></path>',
      goal: '<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="4"></circle>', today: '<path d="M4 19l5-6 4 3 7-9"></path>',
      swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"></path>', star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"></path>',
      bin: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"></path>',
      trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>',
      theme: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>'
    };
    function row(act, icon, label, sub, val, o) {
      o = o || {};
      return '<' + (act ? 'button type="button" data-act="' + act + '"' : 'div') + ' class="ist-row' + (o.cls ? ' ' + o.cls : '') + '">'
        + (icon ? '<span class="ist-ri">' + svg(I[icon]) + '</span>' : '')
        + '<span class="ist-rl">' + label + (sub ? '<span>' + sub + '</span>' : '') + '</span>'
        + (val != null ? '<span class="ist-rv' + (o.vcls ? ' ' + o.vcls : '') + '">' + val + '</span>' : '')
        + (act ? svg(I.chev, 16) : '') + '</' + (act ? 'button' : 'div') + '>';
    }
    function seg(act, vals, on) {
      return '<div class="ist-seg" role="group">' + vals.map(function (v) {
        var n = v === 'All due' ? 'all' : v;
        return '<button type="button" data-act="' + act + '" data-n="' + n + '" aria-pressed="' + (n === on) + '">' + v + '</button>';
      }).join('') + '</div>';
    }
    var h = '<div class="ist-hdr"><span class="ist-tt"><h1>Settings</h1><span class="ist-cc">' + e(m.certName) + ' · ' + e(m.certCode) + '</span></span>'
      + '<button type="button" class="ist-theme" data-act="theme" aria-label="Switch theme">' + svg(I.theme, 18) + '</button></div><div class="ist-body">';
    h += '<div class="ist-sect reveal">Account</div>';
    if (m.out) {
      h += '<div class="ist-acct out reveal"><h2>Sign in to keep your progress</h2>'
        + '<p>Right now your progress lives only on this phone, so deleting the app would lose it. Sign in to back it up and carry on from any device.</p>'
        + '<button type="button" class="ist-signin" data-act="signin">Sign in</button></div>';
    } else {
      h += '<div class="ist-group reveal"><div class="ist-row ist-who"><span class="ist-av" aria-hidden="true">' + e((m.email || '?').charAt(0).toUpperCase()) + '</span>'
        + '<span class="ist-rl ist-em">' + e(m.email) + '<span>Signed in</span></span><span class="ist-plan' + (m.pro ? ' pro">Pro' : '">Free') + '</span></div>'
        + row('cert', 'swap', 'Cert', null, e(m.certName))
        + (m.pro ? '' : row('gopro', 'star', 'Go Pro', 'Unlimited questions and every cert', null, { cls: 'pro' }))
        + '</div>';
    }
    h += '<div class="ist-sect reveal">Your Pass Plan</div><div class="ist-card ist-pp reveal">' + m.passPlanHtml + '</div>';
    h += '<div class="ist-sect reveal">Study setup</div><div class="ist-group reveal">'
      + row(null, 'cloud', 'Cloud sync', null, m.sync ? 'On' : 'Off', { vcls: m.sync ? 'ok' : 'warn' })
      + row('exam', 'cal', 'Exam date', null, e(m.examLabel))
      + row(null, 'goal', 'Daily goal', null, m.glanceGoal + ' a day')
      + row(null, 'today', 'Today', null, m.today + ' of ' + m.glanceGoal) + '</div>';
    h += '<div class="ist-card reveal"><div class="ist-k">Daily goal' + (m.pro ? '' : '<span class="ist-lock">' + svg(I.lock, 10) + 'Pro</span>') + '</div>'
      + '<div class="ist-big"><b>' + (m.pro ? m.goal : 15) + '</b><span>questions a day</span></div>'
      + (m.pro ? seg('goal-pick', [10, 20, 30, 50], m.goal) + '<button type="button" class="ist-pri ist-wide" data-act="goal-save">Save</button><p class="ist-note">This sets the Today card on Home. Pick a number you can hit every day.</p>'
        : '<div class="ist-free">Free is fixed at <b>15 questions a day</b>. Go Pro to set a higher goal.</div><button type="button" class="ist-sec ist-wide" data-act="gopro">Go Pro</button>')
      + '</div>';
    var size = m.review.size;
    h += '<div class="ist-card reveal"><div class="ist-k">Daily Review' + (m.pro ? '' : '<span class="ist-lock">' + svg(I.lock, 10) + 'Pro</span>') + '</div>'
      + '<div class="ist-big"><b>' + (m.pro ? (size === 'all' ? 'All' : size) : 5) + '</b><span>' + (m.pro && size === 'all' ? 'due cards' : 'cards a day') + '</span></div>'
      + (m.pro ? seg('review-pick', [10, 20, 30, 'All due'], size) + '<div class="ist-tog"><span class="ist-tl">Top up on light days<span>When few cards are due, add practice on your weakest topics.</span></span>'
          + '<button type="button" class="ist-sw" data-act="topup" aria-pressed="' + !!m.review.topUp + '" aria-label="Top up on light days"></button></div>'
        : '<div class="ist-free">Free review is <b>5 cards a day</b>. Pro lets you review everything that’s due and top up on light days.</div><button type="button" class="ist-sec ist-wide" data-act="gopro">Go Pro</button>')
      + '</div>';
    h += '<div class="ist-sect reveal">Data and backups</div><div class="ist-card reveal"><div class="ist-k">Export and import</div>'
      + '<div class="ist-btns"><button type="button" class="ist-sec" data-act="export">Export data</button><button type="button" class="ist-sec" data-act="import">Import data</button></div>'
      + '<p class="ist-note">Export saves your history, streaks, drill stats and saved work as a JSON file. Import merges a file into what’s here.</p></div>';
    h += m.backups.length
      ? '<div class="ist-group reveal">' + m.backups.map(function (b) {
          return '<button type="button" class="ist-bk" data-act="restore" data-date="' + e(b.iso) + '"><span class="ist-bl">' + e(b.date) + '<span>' + e(b.meta) + '</span></span><span class="ist-bv">Restore</span></button>';
        }).join('') + '</div>'
      : '<p class="ist-note reveal">No automatic backups yet. One will be made on your next visit.</p>';
    h += '<div class="ist-btns reveal"><button type="button" class="ist-sec" data-act="download">Download latest</button><button type="button" class="ist-sec" data-act="snapshot">Snapshot now</button></div>'
      + '<p class="ist-note reveal">We keep a snapshot from each of the last 7 days. Restoring one saves today first, so you can undo it.</p>';
    h += '<div class="ist-sect danger reveal">Danger zone</div><div class="ist-group reveal">'
      + row('clear', 'bin', 'Clear wrong answers bank', 'Drill Mistakes uses these', String(m.wrongCount), { cls: 'danger' })
      + (m.out ? '' : row('delete', 'trash', 'Delete account', 'Deleted 7 days after you confirm', null, { cls: 'danger' })) + '</div>';
    if (!m.out) h += '<div class="ist-group ist-outg reveal"><button type="button" class="ist-row ist-out" data-act="signout">Sign out</button></div>';
    return h + '</div>';
  }

  // m = {certs: [{id, glyph, name, code, tier}], active, pro}
  function _iosStCertSheetHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var TICK = '<svg class="ist-tick" viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>';
    return '<div class="ist-grip"></div><h3 id="ist-sheet-title">Switch cert</h3><p>Your progress stays with each cert.</p><div class="ist-list">'
      + (m.certs || []).map(function (c) {
        var on = c.id === m.active;
        var inner = '<span class="ist-g">' + e(c.glyph) + '</span><span class="ist-n">' + e(c.name) + '<span>' + e(c.code) + '</span></span>'
          + (on ? TICK : (c.tier === 'pro' && !m.pro ? '<span class="ist-pro-tag"><svg viewBox="0 0 24 24" aria-hidden="true" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>Pro</span>' : ''));
        return on ? '<div class="ist-cert on" aria-current="true">' + inner + '</div>'
          : '<button type="button" class="ist-cert" data-act="pick-cert" data-id="' + e(c.id) + '">' + inner + '</button>';
      }).join('') + '</div>';
  }

  // m = {code, year, month (0-11), selected: 'YYYY-MM-DD'|null, today: 'YYYY-MM-DD'}
  function _iosStExamSheetHtml(m) {
    var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    var first = new Date(Date.UTC(m.year, m.month, 1)).getUTCDay(), blanks = (first + 6) % 7;
    var days = new Date(Date.UTC(m.year, m.month + 1, 0)).getUTCDate();
    var cells = '';
    for (var b = 0; b < blanks; b++) cells += '<span class="ist-blank"></span>';
    for (var d = 1; d <= days; d++) {
      var iso = m.year + '-' + pad(m.month + 1) + '-' + pad(d);
      cells += '<button type="button" class="ist-day' + (iso === m.selected ? ' sel' : '') + (iso === m.today ? ' today' : '') + '" data-act="cal-day" data-iso="' + iso + '"' + (iso < m.today ? ' disabled' : '') + '>' + d + '</button>';
    }
    var sel = m.selected ? m.selected.split('-') : null;
    var CH = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="' + p + '"></path></svg>'; };
    return '<div class="ist-grip"></div><h3 id="ist-sheet-title">Set your exam date</h3><p>Pick the day you sit ' + String(m.code || '').replace(/</g, '&lt;') + '. You can change it any time.</p>'
      + '<div class="ist-cal-head"><span class="ist-cal-month">' + MON[m.month] + ' ' + m.year + '</span><span class="ist-cal-nav">'
      + '<button type="button" data-act="cal-prev" aria-label="Previous month">' + CH('M15 6l-6 6 6 6') + '</button><button type="button" data-act="cal-next" aria-label="Next month">' + CH('M9 6l6 6-6 6') + '</button></span></div>'
      + '<div class="ist-cal-grid">' + ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (x) { return '<span class="ist-dow">' + x + '</span>'; }).join('') + cells + '</div>'
      + '<button type="button" class="ist-pri ist-wide" data-act="cal-save"' + (sel ? '' : ' disabled') + '>' + (sel ? 'Save ' + parseInt(sel[2], 10) + ' ' + MON[parseInt(sel[1], 10) - 1] : 'Save') + '</button>'
      + (m.selected ? '<button type="button" class="ist-clear" data-act="cal-remove">Remove exam date</button>' : '');
  }

  // ── Phone host ──
  // render(state, actions): draws the page into #ios-settings and marks #page-settings.ist-on (the CSS hook; never a
  // :has(:not(:empty)) rule, which WebKit misses on an in-place refill). False on desktop, where today's page shows.
  var _acts = {}, _state = null;
  function render(state, actions) {
    var host = document.getElementById('ios-settings'), page = document.getElementById('page-settings');
    if (!host || !page) return false;
    if (!isPhone()) { host.innerHTML = ''; page.classList.remove('ist-on'); closeSheet(true); return false; }
    _state = state; _acts = actions || {};
    if (typeof _subscribeAuth === 'function') _subscribeAuth();   // the client may not have existed when this file ran
    host.innerHTML = _iosStHtml(_iosStModel(state));
    host.classList.toggle('ist-still', !!state.still);   // a redraw after a state change does not replay the reveal
    page.classList.add('ist-on');
    if (!host.__istBound) {
      host.__istBound = true;
      host.addEventListener('click', function (ev) {
        var b = ev.target.closest && ev.target.closest('[data-act]');
        if (!b || !host.contains(b) || b.disabled) return;
        var fn = window.iosSettings._on[b.getAttribute('data-act')];
        if (typeof fn === 'function') fn(b, _acts, _state);
      });
    }
    return true;
  }
  // #ist-sheet: the list / calendar sheet (two-button asks use iosSheet). Built like B3c1's #igt-topics.
  var _sheetBack = null, _sheetKey = null;
  function openSheet(html, onTap) {
    var sheet = document.getElementById('ist-sheet'), scrim = document.getElementById('ist-sheet-scrim');
    if (!sheet || !scrim) return;
    _hookDismiss();
    _sheetBack = document.activeElement;
    sheet.innerHTML = html;
    sheet.__istTap = onTap || null;
    if (!sheet.__istBound) {
      sheet.__istBound = true;
      sheet.addEventListener('click', function (ev) {
        var b = ev.target.closest && ev.target.closest('[data-act]');
        if (b && sheet.contains(b) && !b.disabled && typeof sheet.__istTap === 'function') sheet.__istTap(b);
      });
      scrim.addEventListener('click', function () { closeSheet(); });
    }
    sheet.hidden = false; scrim.hidden = false;
    void sheet.offsetWidth;
    sheet.classList.add('open'); scrim.classList.add('open');
    if (_sheetKey) window.removeEventListener('keydown', _sheetKey, true);
    _sheetKey = function (e) { if (e.key === 'Escape') { e.preventDefault(); closeSheet(); } };
    window.addEventListener('keydown', _sheetKey, true);
    var first = sheet.querySelector('button:not([disabled])');
    if (first) { try { first.focus({ preventScroll: true }); } catch (_) {} }
  }
  function closeSheet(instant) {
    var sheet = document.getElementById('ist-sheet'), scrim = document.getElementById('ist-sheet-scrim');
    if (!sheet || !scrim || sheet.hidden) return;
    if (_sheetKey) { window.removeEventListener('keydown', _sheetKey, true); _sheetKey = null; }
    sheet.classList.remove('open'); scrim.classList.remove('open');
    var done = function () { if (!sheet.classList.contains('open')) { sheet.hidden = true; scrim.hidden = true; } };
    if (instant) done(); else setTimeout(done, 200);   // BRAND §6: sheet out 200ms
    if (_sheetBack && _sheetBack.isConnected && _sheetBack.focus) { try { _sheetBack.focus({ preventScroll: true }); } catch (_) {} }
    _sheetBack = null;
  }
  // Data that lands just after a draw (the email, the lazily loaded Pass Plan) patches in place: a full redraw would
  // cancel the entrance reveal (final review, Important 1).
  function patch(p) {
    var host = document.getElementById('ios-settings');
    if (!host || !host.innerHTML || !_state) return false;
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    if (p.email != null) {
      _state.email = p.email;
      var em = host.querySelector('.ist-em'), av = host.querySelector('.ist-av');
      if (em && em.firstChild && em.firstChild.nodeType === 3) em.firstChild.nodeValue = p.email;
      else if (em) em.innerHTML = e(p.email) + '<span>Signed in</span>';
      if (av) av.textContent = (p.email || '?').charAt(0).toUpperCase();
    }
    if (p.passPlanHtml != null) {
      _state.passPlanHtml = p.passPlanHtml;
      var pp = host.querySelector('.ist-pp');
      if (pp) pp.innerHTML = p.passPlanHtml;
    }
    return true;
  }
  function isSheetOpen() { var s = document.getElementById('ist-sheet'); return !!(s && !s.hidden); }
  // iosSheet.dismiss() closes the other sheets that go with their screen; close ours too. ios-sheet.js loads after
  // this file, so the hook attaches on first use.
  function _hookDismiss() {
    if (!window.iosSheet || typeof window.iosSheet.dismiss !== 'function' || window.iosSheet.dismiss.__ist) return;
    var _dismiss = window.iosSheet.dismiss;
    window.iosSheet.dismiss = function () { closeSheet(true); return _dismiss.apply(this, arguments); };
    window.iosSheet.dismiss.__ist = true;
  }

  // ── Task 3: study setup, the account card and the cert sheet (today's functions do the work) ──
  function _call(name) { var f = window[name]; return typeof f === 'function' ? f.apply(null, [].slice.call(arguments, 1)) : undefined; }
  function _repaint() { if (typeof window.iosSettingsRepaint === 'function') window.iosSettingsRepaint(); }
  function _pad(n) { return (n < 10 ? '0' : '') + n; }
  function _todayIso() { var d = new Date(); return d.getFullYear() + '-' + _pad(d.getMonth() + 1) + '-' + _pad(d.getDate()); }
  var _cal = null;   // {year, month, selected} while the exam sheet is open
  function _drawExam() {
    var sheet = document.getElementById('ist-sheet');
    var code = (_state && _state.cert && _state.cert.code) || '';
    var html = _iosStExamSheetHtml({ code: code, year: _cal.year, month: _cal.month, selected: _cal.selected, today: _todayIso() });
    if (sheet && !sheet.hidden && sheet.classList.contains('open')) sheet.innerHTML = html;   // a tap redraws in place
    else openSheet(html, _onExamTap);
  }
  function _onExamTap(b) {
    var act = b.getAttribute('data-act');
    if (act === 'cal-day') { _cal.selected = b.getAttribute('data-iso'); _drawExam(); }
    else if (act === 'cal-prev' || act === 'cal-next') {
      var m = _cal.month + (act === 'cal-next' ? 1 : -1);
      _cal.year += Math.floor(m / 12); _cal.month = ((m % 12) + 12) % 12; _drawExam();
    } else if (act === 'cal-save' && _cal.selected) { _call('setExamDate', _cal.selected); closeSheet(); _cal = null; _repaint(); }
    else if (act === 'cal-remove') { _call('setExamDate', ''); closeSheet(); _cal = null; _repaint(); }
  }
  window.iosSettings = window.iosSettings || {};   // the namespace exists before the handlers attach to it
  var ON = window.iosSettings._on = window.iosSettings._on || {};
  ON.theme = function () { _call('toggleTheme'); _repaint(); };
  ON.signin = function () { var u = _call('buildSignInUrl'); if (u) window.location.href = u; };
  // Sign out is today's account-menu link: it uploads first and only clears this device once the cloud has it all.
  ON.signout = function () { var l = document.getElementById('topbar-signout-link'); if (l) l.click(); };
  ON.gopro = function () { window.open('https://certanvil.com/pricing', '_blank', 'noopener'); };   // today's Settings Go Pro link
  ON['goal-pick'] = function (b) {
    var n = parseInt(b.getAttribute('data-n'), 10);
    _call('pickSettingsDailyPreset', n);   // writes today's hidden #settings-daily-input; Save reads it
    if (_state) { _state.goal = n; _state.still = true; render(_state, _acts); }
  };
  ON['goal-save'] = function () { _call('saveSettingsDailyGoal'); _repaint(); };
  ON['review-pick'] = function (b) { var v = b.getAttribute('data-n'); _call('pickSrSessionSize', v === 'all' ? 'all' : parseInt(v, 10)); _repaint(); };
  ON.topup = function () { _call('toggleSrTopUp'); _repaint(); };
  ON.exam = function () {
    var cur = _call('getExamDate') || null, base = cur ? cur.split('-') : null, now = new Date();
    _cal = { year: base ? parseInt(base[0], 10) : now.getFullYear(), month: base ? parseInt(base[1], 10) - 1 : now.getMonth(), selected: cur };
    _drawExam();
  };
  ON.cert = function () {
    var certs = _call('getAvailableCerts') || [];
    openSheet(_iosStCertSheetHtml({ certs: certs, active: window.CURRENT_CERT || 'netplus', pro: !!(_state && _state.pro) }), function (b) {
      if (b.getAttribute('data-act') !== 'pick-cert') return;
      var id = b.getAttribute('data-id');
      closeSheet(true);   // never stack today's Pro gate over the sheet
      _call('tadSwitchCert', id);
    });
  };

  // ── Task 4: data, the danger zone and the Pass Plan asks (the in-app sheet, never confirm()) ──
  function _ask(o) { return typeof window.iosSheet === 'function' ? window.iosSheet(o) : Promise.resolve(window.confirm(o.title + '\n\n' + o.body)); }
  ON.export = function () { _call('exportData'); };
  ON.import = function () { var i = document.getElementById('import-file-input'); if (i) i.click(); };   // today's input; importData asks on phones
  ON.download = function () { var b = _state && _state.backups && _state.backups[0]; if (b) _call('downloadAutoBackup', b.iso); };
  ON.snapshot = function (b, acts) { if (acts && acts.snapshot) acts.snapshot(); };
  ON.restore = function (b) {
    var iso = b.getAttribute('data-date'), row = null;
    var rows = _iosStModel(_state || {}).backups;
    for (var i = 0; i < rows.length; i++) if (rows[i].iso === iso) row = rows[i];
    _ask({ title: 'Restore ' + (row ? row.date : iso) + '?', body: 'This replaces your history, streak, goals, review queue and drill progress with that day’s copy. Today is saved first, so you can undo it.', go: 'Restore', stay: 'Keep my data' })
      .then(function (go) { if (go) _call('restoreFromAutoBackup', iso, { confirmed: true }); });
  };
  ON.clear = function () {
    var n = (_state && _state.wrongCount) || 0;
    if (!n) return;   // today's clearWrongBank does nothing on an empty bank
    _ask({ title: 'Clear ' + n + ' wrong answers?', body: 'Drill Mistakes loses its questions and their review cards reset. Today’s backup can bring them back.', go: 'Clear them', stay: 'Keep them' })
      .then(function (go) { if (go) { _call('clearWrongBank', { confirmed: true }); _repaint(); } });
  };
  ON.delete = function (b, acts) { if (acts && acts.deleteAccount) acts.deleteAccount(); };
  // Today's Pass Plan markup inside the card: the same targets as settings.js _wirePassPlanSection, with the two
  // diagnostic confirm() calls asked in the sheet first.
  ON['pp-view'] = function () { _call('viewPassPlan'); };
  ON['pp-pro'] = function () { _call('_showProWaitlist'); };
  ON['pp-add'] = function () { _call('_showPassPlanCertPicker'); };
  ON['pp-open-cert'] = function (b) { var id = b.getAttribute('data-cert'); if (id) _call('tadSwitchCert', id); };
  ON['pp-empty'] = function () {
    _ask({ title: 'Take the baseline diagnostic?', body: '20 questions in one sitting, about 30 minutes. If you stop partway, it won’t be saved.', go: 'Start', stay: 'Not now' })
      .then(function (go) { if (go) _call('startDiagnostic', { skipConfirm: true }); });
  };
  ON['pp-retake'] = function () {
    var ago = _call('_retakeAgoDays');
    if (ago == null) { _call('retakeDiagnostic'); return; }   // today's retake asks nothing here either
    _ask({ title: 'Retake the diagnostic?', body: 'Your last one was ' + ago + (ago === 1 ? ' day' : ' days') + ' ago. Waiting a week lets your Pass Plan settle, but you can retake now.', go: 'Retake', stay: 'Keep my plan' })
      .then(function (go) { if (go) _call('retakeDiagnostic', { skipConfirm: true }); });
  };

  // ── Task 5: the page follows auth, tier and width (still repaints, only while Settings is shown) ──
  function _settingsShown() { var p = document.getElementById('page-settings'); return !!(p && p.classList.contains('active')); }
  function _repaintIfShown() { if (_settingsShown()) _repaint(); }
  // Sign-in and sign-out: auth-state.js subscribes first (its init), so _certanvilSignedIn is set when ours runs.
  // (Wrapping window.certanvilAuthState would never fire: auth-state calls its own local functions.)
  var _authSubbed = false;
  function _subscribeAuth() {
    var sb = window.certanvilSupabase;
    if (_authSubbed || !sb || !sb.auth || typeof sb.auth.onAuthStateChange !== 'function') return;
    _authSubbed = true;
    sb.auth.onAuthStateChange(function (ev) { if (ev !== 'INITIAL_SESSION') setTimeout(_repaintIfShown, 0); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _subscribeAuth); else _subscribeAuth();
  // The tier hydrates after Settings may have drawn: app.js re-runs renderGauntletDrillsCard then (B3b1 / B3c3 chain).
  (function () {
    var f = window.renderGauntletDrillsCard;
    if (typeof f !== 'function' || f._istChained) return;
    var chained = function () { var r = f.apply(this, arguments); _repaintIfShown(); return r; };
    chained._istChained = true; chained._islChained = f._islChained; chained._idlChained = f._idlChained;
    window.renderGauntletDrillsCard = chained;
  })();
  // Crossing 899px on Settings: the sheets close and the page redraws in the new layout (render clears ist-on on desktop).
  if (MQ && MQ.addEventListener) MQ.addEventListener('change', function () {
    if (!_settingsShown()) return;
    closeSheet(true);
    if (window.iosSheet && typeof window.iosSheet.dismiss === 'function') { try { window.iosSheet.dismiss(); } catch (_) {} }
    _repaint();
  });

  window._iosStModel = _iosStModel; window._iosStHtml = _iosStHtml;
  window._iosStCertSheetHtml = _iosStCertSheetHtml; window._iosStExamSheetHtml = _iosStExamSheetHtml;
  window.iosSettings = window.iosSettings || {};
  window.iosSettings.isPhone = isPhone;
  window.iosSettings.render = render;
  window.iosSettings.openSheet = openSheet;
  window.iosSettings.closeSheet = closeSheet;
  window.iosSettings.isSheetOpen = isSheetOpen;
  window.iosSettings.patch = patch;
  window.iosSettings._on = window.iosSettings._on || {};   // data-act handlers (Tasks 3 and 4)
})();
