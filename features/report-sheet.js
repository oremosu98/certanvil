// Admin in the app, Task 3: the one "Report a problem" form (drawing: mockups/cert-ios-report.html, phone and ?v=desktop).
// A bottom sheet below 900px (the iOS app and mobile web), the shared centred dialog (caDialogFrame) at 900px and up.
// Sending lives in features/reports.js (submitReportNow, lazy-loaded); this file draws the form, wires it and shows the
// thanks. Opened from Settings (phone Help row, desktop reports section), the desktop top bar (reports.openDrawer) and
// the "Something wrong? Tell us" link under a failed start (#setup-err).
(function () {
  var _cur = null;   // the open form's state; async callbacks check it is still the current one
  var DRAFT = 'ca_report_draft';   // sessionStorage: what you typed survives the sign-in round trip
  var MAX = 5000;

  function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function svg(p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; }
  var I = {
    flag: '<path d="M5 21V4h11l-1.5 4L16 12H5"></path>', x: '<path d="M6 6l12 12M18 6L6 18"></path>',
    mail: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"></rect><path d="M3 7l9 6 9-6"></path>',
    pin: '<path d="M12 21s7-5.4 7-11a7 7 0 0 0-14 0c0 5.6 7 11 7 11z"></path><circle cx="12" cy="10" r="2.5"></circle>',
    plus: '<path d="M12 5v14M5 12h14"></path>', send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>', check: '<path d="M20 6L9 17l-5-5"></path>'
  };
  var SCREENS = { setup: 'Home', quiz: 'Quiz', exam: 'Exam', results: 'Results', review: 'Review', settings: 'Settings', progress: 'Progress',
    analytics: 'Analytics', drills: 'Drills', mycerts: 'My certs', subnet: 'Subnetting', ports: 'Ports' };

  function _signedIn() { return window._certanvilSignedIn === true; }
  function _certName() {
    var n = (typeof CERT_PACK === 'object' && CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.name) || '';
    return String(n).replace(/^(CompTIA|Microsoft)\s+/, '');
  }
  function _screen() {
    var p = document.querySelector('.page.active'), id = p ? String(p.id || '').replace(/^page-/, '') : '';
    if (SCREENS[id]) return SCREENS[id];
    id = id.replace(/[-_]+/g, ' ');
    return id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Home';
  }
  function _fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  var DRAFT_TTL = 30 * 60 * 1000;   // a draft older than this belongs to some other moment: drop it
  function _dropDraft() { try { sessionStorage.removeItem(DRAFT); } catch (_) {} }
  function _readDraft() {   // read once: opening the form always consumes it
    var d = null;
    try { d = JSON.parse(sessionStorage.getItem(DRAFT) || 'null'); } catch (_) { d = null; }
    _dropDraft();
    if (!d || typeof d !== 'object' || typeof d.at !== 'number' || Date.now() - d.at > DRAFT_TTL || Date.now() < d.at) return null;
    return d;
  }
  function _saveDraft(d) { d.at = Date.now(); try { sessionStorage.setItem(DRAFT, JSON.stringify(d)); } catch (_) {} }

  function _html(S) {
    var hear = S.signedIn ? 'We’ll email you when it’s fixed.'
      : '<button class="irp-link" type="button" data-act="signin">Sign in</button> to hear back when it’s fixed. What you’ve typed stays here.';
    return '<div class="irp-grab" aria-hidden="true"></div>'
      + '<div class="irp-head"><span class="irp-eyebrow">' + svg(I.flag) + 'Help</span>'
      + '<button class="irp-close" type="button" data-act="close" data-ca-close aria-label="Close">' + svg(I.x) + '</button></div>'
      + '<div class="irp-scroll">'
      + '<h2 class="irp-title" id="irp-title">Report a problem</h2>'
      + '<p class="irp-sub">Tell us what went wrong. A real person reads every report.</p>'
      + '<p class="irp-hearback">' + svg(I.mail) + '<span>' + hear + '</span></p>'
      + '<div class="irp-context">' + svg(I.pin) + '<span>From <b>' + e(S.cert) + '</b> · ' + e(S.from) + '</span></div>'
      + '<div class="irp-field"><div class="irp-ftop"><label class="irp-label" for="irp-desc">What happened?<span class="irp-req" aria-hidden="true">*</span></label>'
      + '<span class="irp-count" aria-hidden="true">0 / 5,000</span></div>'
      + '<textarea class="irp-ta" id="irp-desc" maxlength="' + MAX + '" aria-required="true" placeholder="What you were doing, and what went wrong."></textarea></div>'
      + '<button class="irp-steps-link" type="button" data-act="steps"><span class="irp-plus">' + svg(I.plus) + '</span>Add the steps, if you remember them</button>'
      + '<div class="irp-field irp-steps" hidden><div class="irp-ftop"><label class="irp-label" for="irp-steps">Steps</label><span class="irp-opt">optional</span></div>'
      + '<textarea class="irp-ta" id="irp-steps" maxlength="2000" placeholder="1. Open the exam&#10;2. Tap End&#10;3. ..."></textarea></div>'
      + '<p class="irp-err" role="status"></p>'
      + '</div>'
      + '<div class="irp-foot"><button class="irp-cancel" type="button" data-act="cancel">Cancel</button>'
      + '<button class="irp-send" type="button" data-act="send" disabled>Send report' + svg(I.send) + '</button></div>';
  }

  function _refresh(S) {
    var d = S.host.querySelector('#irp-desc'), c = S.host.querySelector('.irp-count'), b = S.host.querySelector('[data-act="send"]');
    var n = d.value.length;
    c.textContent = _fmt(n) + ' / 5,000'; c.classList.toggle('warn', n > 4750);
    b.disabled = S.sending || !d.value.trim();
  }
  function _showSteps(S, focus) {
    var f = S.host.querySelector('.irp-steps'), l = S.host.querySelector('[data-act="steps"]');
    f.hidden = false; l.hidden = true;
    if (focus) { var t = f.querySelector('textarea'); try { t.focus({ preventScroll: true }); } catch (_) {} }
  }

  // ── the thanks: the form has gone, then this enters (drawing: 220ms gap) ──
  function _toast(t, sub, queued) {
    [].forEach.call(document.querySelectorAll('.irp-toast'), function (n) { n.remove(); });
    var el = document.createElement('div');
    el.className = 'irp-toast' + (queued ? ' queued' : ''); el.setAttribute('role', 'status');
    el.innerHTML = '<span class="irp-toast-i">' + svg(I.check) + '</span><span><span class="irp-toast-t">' + t + '</span><span class="irp-toast-l">' + e(sub) + '</span></span>';
    document.body.appendChild(el);
    void el.offsetWidth; el.classList.add('open');
    setTimeout(function () { el.classList.remove('open'); setTimeout(function () { el.remove(); }, 260); }, 3200);
  }
  function _thanks(S, out, first) {
    if (out.queued && !out.ok) return _toast('Saved', 'We’ll send it when you’re back online.', true);
    var no = out.reportNo != null ? ' Report <span class="irp-toast-n">#' + e(out.reportNo) + '</span>' : '';
    _toast('Thanks, ' + (first ? e(first) + ', ' : '') + 'got it.' + no, S.signedIn ? 'We’ll email you when it’s fixed.' : 'We read every report.');
  }
  function _first(S) {
    if (!S.signedIn || typeof window._hubFirstName !== 'function') return Promise.resolve('');
    var name = '';
    try { name = window._certanvilDisplayName || localStorage.getItem('certanvil_display_name_cache') || ''; } catch (_) { name = window._certanvilDisplayName || ''; }
    var sb = window.certanvilSupabase;
    var p = (sb && sb.auth && sb.auth.getSession) ? sb.auth.getSession().then(function (r) { var u = r && r.data && r.data.session && r.data.session.user; return (u && u.email) || ''; }, function () { return ''; }) : Promise.resolve('');
    return p.then(function (email) { return window._hubFirstName(name, email); }, function () { return ''; });
  }
  function _reports() {
    var m = window._certanvilFeatures && window._certanvilFeatures.reports;
    if (m && m.submitReportNow) return Promise.resolve(m);
    return typeof _loadFeature === 'function' ? _loadFeature('reports') : Promise.reject(new Error('no reports'));
  }
  function _send(S) {
    var d = S.host.querySelector('#irp-desc'), st = S.host.querySelector('#irp-steps');
    if (S.sending || !d.value.trim()) return;
    S.sending = true; _refresh(S); S.host.querySelector('.irp-err').textContent = '';
    var form = { desc: d.value, steps: st.value.trim() ? st.value : null };
    Promise.all([_reports().then(function (m) { return m.submitReportNow(form); }), _first(S)]).then(function (r) {
      var out = r[0] || {};
      if (!out.ok && !out.queued) throw new Error('not sent');
      _dropDraft();   // sent (or safely queued): nothing typed earlier may come back
      if (_cur === S) close();
      setTimeout(function () { _thanks(S, out, r[1]); }, 220);
    }).catch(function () {
      if (_cur !== S) return;
      S.sending = false; _refresh(S);
      S.host.querySelector('.irp-err').textContent = 'That didn’t send. Try again in a moment.';
    });
  }
  function _signIn(S) {
    var d = S.host.querySelector('#irp-desc'), st = S.host.querySelector('#irp-steps');
    _saveDraft({ desc: d.value, steps: st.value, from: S.fromOpt || '' });
    close(true);
    if (window.iosSignIn && typeof window.iosSignIn.go === 'function') { window.iosSignIn.go('report'); return; }
    var u = typeof window.buildSignInUrl === 'function' ? window.buildSignInUrl() : null;
    if (u) window.location.href = u;
  }

  // ── inert behind + focus trap on phones (the ios-suggest pattern; un-inert FIRST on close so focus can land back) ──
  function _inertBehind(S) {
    S.inerted = [];
    [].forEach.call(document.body.children, function (el) {
      if (el === S.host || el === S.scrim || el.inert || el.tagName === 'SCRIPT' || (el.classList && (el.classList.contains('il-toast') || el.classList.contains('irp-toast')))) return;
      el.inert = true; S.inerted.push(el);
    });
  }
  function _focusables(S) {
    return [].filter.call(S.host.querySelectorAll('button, textarea, [tabindex]:not([tabindex="-1"])'), function (x) { return !x.disabled && !x.hidden && x.getClientRects().length; });
  }

  function close(instant) {
    var S = _cur; if (!S) return;
    _cur = null;
    if (S.keyFn) window.removeEventListener('keydown', S.keyFn, true);
    if (S.frame) S.frame.release(instant === true);
    S.inerted.forEach(function (el) { el.inert = false; });
    S.host.classList.remove('open'); if (S.scrim) S.scrim.classList.remove('open');
    var done = function () { S.host.remove(); if (S.scrim) S.scrim.remove(); };
    if (instant === true) done(); else setTimeout(done, 220);
    if (S.back && S.back.isConnected && S.back.focus) { try { S.back.focus({ preventScroll: true }); } catch (_) {} }
  }

  function open(opts) {
    if (_cur) return;
    opts = opts || {};
    [].forEach.call(document.querySelectorAll('#ios-report, .irp-scrim'), function (n) { n.remove(); });   // one still fading out
    var draft = _readDraft();
    var fromOpt = opts.from || (draft && draft.from) || '';
    var S = _cur = { back: document.activeElement, signedIn: _signedIn(), cert: _certName(), from: fromOpt || _screen(), fromOpt: fromOpt, sending: false, inerted: [] };
    var desk = typeof window.caDialogFrame === 'function' && typeof window.caIsDesk === 'function' && window.caIsDesk();
    if (!desk) { S.scrim = document.createElement('div'); S.scrim.className = 'irp-scrim'; document.body.appendChild(S.scrim); }
    S.host = document.createElement('div'); S.host.id = 'ios-report'; S.host.className = 'irp-sheet'; S.host.tabIndex = -1;
    S.host.setAttribute('role', 'dialog'); S.host.setAttribute('aria-modal', 'true'); S.host.setAttribute('aria-labelledby', 'irp-title');
    S.host.innerHTML = _html(S);
    document.body.appendChild(S.host);   // body level: the dialog frame needs a direct child of <body>
    if (draft) {
      S.host.querySelector('#irp-desc').value = String(draft.desc || '').slice(0, MAX);
      if (draft.steps) { S.host.querySelector('#irp-steps').value = String(draft.steps).slice(0, 2000); _showSteps(S, false); }
    }
    _refresh(S);
    if (!desk) _inertBehind(S);
    if (S.scrim) S.scrim.addEventListener('click', function () { if (_cur === S) close(); });
    S.host.addEventListener('input', function (ev) { if (ev.target && ev.target.id === 'irp-desc' && _cur === S) _refresh(S); });
    S.host.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-act]'); if (!b || b.disabled || _cur !== S) return;
      var a = b.getAttribute('data-act');
      if (a === 'close' || a === 'cancel') close();
      else if (a === 'steps') _showSteps(S, true);
      else if (a === 'send') _send(S);
      else if (a === 'signin') _signIn(S);
    });
    S.keyFn = function (ev) {
      if (_cur !== S) return;
      if (ev.key === 'Escape') { ev.preventDefault(); close(); return; }   // preventDefault: one Escape closes one layer
      if (ev.key !== 'Tab') return;
      var f = _focusables(S); if (!f.length) { ev.preventDefault(); return; }
      var i = f.indexOf(document.activeElement), n = f.length;
      ev.preventDefault();   // move focus ourselves: WebKit skips buttons on Tab, which would walk out of the sheet
      f[i < 0 ? (ev.shiftKey ? n - 1 : 0) : (i + (ev.shiftKey ? n - 1 : 1)) % n].focus();
    };
    if (!desk) window.addEventListener('keydown', S.keyFn, true);
    void S.host.offsetWidth;
    // Both widths arm the frame's 900px watch, so neither layout is left over the other after a resize.
    if (typeof window.caDialogFrame === 'function') {
      S.frame = window.caDialogFrame(S.host, { size: 'sm', onClose: function (o) { if (_cur === S) close(o && o.instant); } });
      if (S.frame.isDialog) { var t = S.host.querySelector('#irp-desc'); try { t.focus({ preventScroll: true }); } catch (_) {} return; }   // desktop: no on-screen keyboard, so the box takes focus
    }
    S.host.classList.add('open'); S.scrim.classList.add('open');
    try { S.host.focus({ preventScroll: true }); } catch (_) {}   // phones: the sheet itself, so no keyboard pops until they tap the box
  }

  // ── "Something wrong? Tell us" under a failed start: whoever fills #setup-err, the link follows the message ──
  var TELL = 'Something wrong? Tell us';
  // Only under a real failure. Messages that tell you what to do get no link. Every #setup-err fill site, classified:
  //   validateApiKey (home.js, exam.js, quiz-engine.js): "Sign in to study free…", "Invalid API key format…",
  //     "API key looks too short…" → guidance. _claudeFetch's no-session throw "Sign in to study · 15 free…" → guidance.
  //   Daily limit / quota (the quota modal's copy, a 429 that reaches a catch) → guidance.
  //   Generation catches (quiz-engine.js, home.js marathon + session, exam.js): "All generated questions failed
  //     validation", "Couldn't make new questions", "No questions could be generated", "AI returned malformed data",
  //     timeouts, network/server errors, the empty-message fallback → failures, so the link shows.
  var GUIDANCE = [
    /^\W*sign in to study/i,              // signed out: the sign-in prompt
    /invalid api key format/i, /api key looks too short/i,   // the old bring-your-own-key setup prompts
    /free questions today|daily limit|daily cap|quota|upgrade to pro|\b429\b/i   // the daily limit / quota block
  ];
  function isFailure(text) {
    text = String(text || '').replace(/\s+/g, ' ').trim();
    if (!text) return false;
    for (var i = 0; i < GUIDANCE.length; i++) if (GUIDANCE[i].test(text)) return false;
    return true;
  }
  function _wireSetupErr() {
    var box = document.getElementById('setup-err'); if (!box || box.__irp) return;
    box.__irp = true;
    function sync() {
      var link = box.querySelector('[data-irp-tell]');
      var text = [].map.call(box.childNodes, function (n) { return n === link ? '' : n.textContent; }).join('').trim();
      if (link || !isFailure(text) || box.classList.contains('is-hidden')) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'irp-tell'; b.setAttribute('data-irp-tell', ''); b.textContent = TELL;
      b.addEventListener('click', function () { open(); });
      box.appendChild(b);
    }
    new MutationObserver(sync).observe(box, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _wireSetupErr); else _wireSetupErr();

  window.openReportSheet = open;
  window.iosReport = { open: open, close: close, isOpen: function () { return !!_cur; }, isFailure: isFailure };
})();
