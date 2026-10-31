// Persona bundle Task 14: the phone "Suggest a cert" sheet (June E2E drawing: mockups/cert-ios-settings.html, suggestSheet).
// Opened from Settings (Study setup) and from the My certs hub. Rows and sending live in lib/cert-requests.js; this file draws
// the sheet and wires it. Own host, so it layers above the hub, inerts everything behind it, traps Tab and takes its own Escape.
(function () {
  var _cur = null;   // the open sheet's state; every async callback checks it is still the current one

  function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var CHK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
  var ERR_SEND = 'Couldn’t send that. Check your connection and try again.';
  var ERR_USER = 'We couldn’t confirm your account. Try again in a moment.';

  function _listHtml(S) {
    var m = window._certReqRows(S.q, S.picks), list = '';
    function row(cls, badge, name, sub, on, data) {
      return '<button class="sg-row' + cls + (on ? ' on' : '') + '" type="button" data-act="pick" data-c="' + e(data) + '" aria-pressed="' + !!on + '"' + (S.sending ? ' disabled' : '') + '><span class="sg-g">' + badge
        + '</span><span class="sg-n">' + name + '<span>' + sub + '</span></span><span class="sg-tick" aria-hidden="true">' + CHK + '</span></button>';
    }
    m.groups.forEach(function (g) {
      list += '<div class="sg-vendor">' + e(g.vendor) + '</div>';
      g.rows.forEach(function (r) { list += row('', e(r.badge), e(r.name), e(g.vendor) + ' · ' + e(r.code), r.on, r.name); });
    });
    if (m.typed) list += row(' sg-add', '+', 'Suggest “' + e(m.typed.label) + '”', 'Not on our list yet', m.typed.on, m.typed.label);
    m.mine.forEach(function (x) { list += row(' sg-add', '+', e(x.label), 'Your suggestion', true, x.label); });
    if (m.else) list += '<button class="sg-row sg-else" type="button" data-act="else"' + (S.sending ? ' disabled' : '') + '><span class="sg-g">+</span><span class="sg-n">Something else?<span>Type any exam in the box above</span></span></button>';
    return list;
  }
  function _sendDisabled(S) { return !S.picks.length || !S.uid || S.sending; }
  function _sendText(S) { return S.sending ? 'Sending' : window._certReqSendText(S.picks.length); }

  function _html(S) {
    if (S.done) {
      var first = S.sent[0] || '', second = S.sent[1];
      return '<div class="sg-grip"></div><div class="sg-done"><div class="sg-stack">'
        + S.sent.slice(0, 4).map(function (n) { return '<span class="sg-g">' + e(window._certReqGlyph(n)) + '</span>'; }).join('') + '</div>'
        + '<h3 id="sg-title" tabindex="-1">Thanks, noted.</h3><p>When ' + (second ? e(first) + ' or ' + e(second) : e(first || 'yours')) + ' lands, we’ll tell you.</p></div>'
        + '<button class="sg-pri" type="button" data-act="done">Done</button>';
    }
    // Desktop catch-up Task 5: the founder-approved desktop line says "Pick", the phone keeps "Tap"
    return '<div class="sg-grip"></div><span class="sg-eyebrow">Help shape CertAnvil</span><h3 id="sg-title">Which exam should we add next?</h3><p class="sg-sub">' + (S.desk ? 'Pick' : 'Tap') + ' any you’d study. We build the most-asked first.</p>'
      + '<label class="sg-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg><input id="sg-q" type="text" maxlength="120" placeholder="Search or type an exam" value="' + e(S.q) + '" aria-label="Search or type an exam" autocomplete="off" autocapitalize="off" enterkeyhint="search"></label>'
      + '<div class="sg-list">' + _listHtml(S) + '</div>'
      + '<p class="sg-err" role="status">' + e(S.err) + '</p>'
      + '<button class="sg-pri" type="button" data-act="send"' + (_sendDisabled(S) ? ' disabled' : '') + '>' + _sendText(S) + '</button>'
      + '<p class="sg-note">Only we see these. One vote per exam.</p>';
  }

  // Typing, picking, sending: touch only the list, the message and the Send button. The input itself is never replaced,
  // so its focus, caret and any IME composition survive.
  function _update(S, refocus) {
    if (_cur !== S || S.done) return;
    var host = S.host, list = host.querySelector('.sg-list'), btn = host.querySelector('[data-act="send"]'), err = host.querySelector('.sg-err'), inp = host.querySelector('#sg-q');
    if (!list || !btn) return;
    var top = list.scrollTop;
    list.innerHTML = _listHtml(S); list.scrollTop = top;
    if (inp && inp.value !== S.q && !S.composing) inp.value = S.q;
    if (inp) inp.readOnly = !!S.sending;
    err.textContent = S.err || (S.uidChecked && !S.uid ? ERR_USER : '');
    btn.disabled = _sendDisabled(S); btn.textContent = _sendText(S);
    if (refocus) { var r = [].filter.call(list.querySelectorAll('[data-act="pick"]'), function (x) { return x.getAttribute('data-c') === refocus; })[0]; if (r) { try { r.focus({ preventScroll: true }); } catch (_) {} } }
  }

  function _pick(S, c) {
    var i = S.picks.indexOf(c);
    if (i >= 0) S.picks.splice(i, 1); else S.picks.push(c);
    var m = window._certReqRows(S.q, []); if (m.typed && m.typed.label === c) S.q = '';   // a typed exam you just picked: clear the box so the list returns
    S.err = '';
  }

  function _send(S) {
    if (S.sending || S.done || _sendDisabled(S)) return;
    S.sending = true; S.err = ''; _update(S);
    var labels = S.picks.slice();
    var p = (typeof window.sendCertRequests === 'function') ? window.sendCertRequests(labels) : Promise.reject(new Error('no sender'));
    Promise.resolve(p).then(function (r) { return r || { accepted: [] }; }, function () { return { accepted: [] }; }).then(function (r) {
      if (_cur !== S) return;   // closed (or replaced by a newer sheet) while sending: the queue already holds what matters
      S.sending = false;
      // Thanks only for what is stored or safely queued. Otherwise stay put with the picks intact.
      if (r.accepted && r.accepted.length) {
        S.sent = r.accepted.slice(); S.done = true;
        S.host.innerHTML = _html(S);
        if (S.frame && S.frame.isDialog) S.frame.ensureClose();   // the rewrite dropped the Close X
        var h = document.getElementById('sg-title'); if (h) { try { h.focus({ preventScroll: true }); } catch (_) {} }
      } else {
        S.err = r.noUser ? ERR_USER : ERR_SEND;
        _update(S);
      }
    });
  }

  // ── inert behind + focus trap (the ios-log-result pattern; un-inert FIRST on close so focus can land back) ──
  function _inertBehind(S) {
    S.inerted = [];
    [].forEach.call(document.body.children, function (el) {
      if (el === S.host || el === S.scrim || el.inert || el.id === 'pro-only-modal' || (el.classList && el.classList.contains('il-toast')) || el.tagName === 'SCRIPT') return;
      el.inert = true; S.inerted.push(el);
    });
  }
  function _focusables(S) {
    return [].filter.call(S.host.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])'), function (x) { return !x.disabled && !x.hidden && x.offsetParent !== null; });
  }

  function close(instant) {
    var S = _cur; if (!S) return;
    _cur = null;
    if (S.keyFn) window.removeEventListener('keydown', S.keyFn, true);
    if (S.frame) S.frame.release(instant === true);   // desktop: un-inert first, then focus goes back (a frame-initiated close has released already)
    S.inerted.forEach(function (el) { el.inert = false; });   // first: the opener must be focusable again
    S.host.classList.remove('open'); if (S.scrim) S.scrim.classList.remove('open');
    var done = function () { if (S.host.parentNode) S.host.parentNode.removeChild(S.host); if (S.scrim && S.scrim.parentNode) S.scrim.parentNode.removeChild(S.scrim); };
    if (instant) done(); else setTimeout(done, 220);
    if (S.back && S.back.isConnected && S.back.focus) { try { S.back.focus({ preventScroll: true }); } catch (_) {} }
  }

  function open() {
    if (_cur) return;
    // Signed in only. Undefined auth counts as signed out.
    if (window._certanvilSignedIn !== true) {
      if (window.caNative && typeof window.caNative.requireAccount === 'function') window.caNative.requireAccount('signedout');
      return;
    }
    if (typeof window._certReqRows !== 'function') return;
    [].forEach.call(document.querySelectorAll('.sg-sheet, .sg-scrim'), function (n) { n.parentNode.removeChild(n); });   // a sheet still fading out: gone now, so there is never a second #sg-q
    var S = _cur = { picks: [], q: '', back: document.activeElement, uid: null, sending: false, done: false, sent: [], err: '', composing: false, inerted: [] };
    var desk = typeof window.caDialogFrame === 'function' && typeof window.caIsDesk === 'function' && window.caIsDesk();
    S.desk = desk;
    if (!desk) { S.scrim = document.createElement('div'); S.scrim.id = 'ios-suggest-scrim'; S.scrim.className = 'sg-scrim'; }
    S.host = document.createElement('div'); S.host.id = 'ios-suggest'; S.host.className = 'sg-sheet'; S.host.tabIndex = -1;
    S.host.setAttribute('role', 'dialog'); S.host.setAttribute('aria-modal', 'true'); S.host.setAttribute('aria-labelledby', 'sg-title');
    if (S.scrim) document.body.appendChild(S.scrim);
    document.body.appendChild(S.host);   // body level: the dialog frame needs a direct child of <body>
    if (!desk) _inertBehind(S);   // desktop: the dialog frame owns scrim, inert, Escape, Tab and focus
    S.host.innerHTML = _html(S);
    if (S.scrim) S.scrim.addEventListener('click', function () { if (_cur === S) close(); });
    S.host.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-act]'); if (!b || b.disabled || S.sending) return;
      var a = b.getAttribute('data-act');
      if (a === 'pick') { var c = b.getAttribute('data-c'); _pick(S, c); _update(S, c); }
      else if (a === 'else') { var i = S.host.querySelector('#sg-q'); if (i) i.focus(); }
      else if (a === 'send') _send(S);
      else if (a === 'done') close();
    });
    S.host.addEventListener('compositionstart', function () { S.composing = true; });
    S.host.addEventListener('compositionend', function (ev) { S.composing = false; if (ev.target && ev.target.id === 'sg-q') { S.q = ev.target.value; _update(S); } });
    S.host.addEventListener('input', function (ev) {
      if (!ev.target || ev.target.id !== 'sg-q' || ev.isComposing || S.composing) return;   // wait for the composition to end
      S.q = ev.target.value; _update(S);
    });
    S.keyFn = function (ev) {
      if (_cur !== S) return;
      if (ev.key === 'Escape') { ev.preventDefault(); close(); return; }   // preventDefault: the hub ignores a defaultPrevented Escape, so one press closes one layer
      if (ev.key !== 'Tab') return;
      var f = _focusables(S); if (!f.length) { ev.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1], at = document.activeElement;
      if (!S.host.contains(at)) { ev.preventDefault(); first.focus(); }
      else if (ev.shiftKey && (at === first || at === S.host)) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && at === last) { ev.preventDefault(); first.focus(); }
    };
    if (!desk) window.addEventListener('keydown', S.keyFn, true);
    // Send stays off until we know who is sending
    (typeof window.certReqUid === 'function' ? window.certReqUid() : Promise.resolve(null)).then(function (u) { if (_cur !== S) return; S.uid = u; S.uidChecked = true; _update(S); });
    void S.host.offsetWidth;
    // Both widths arm the frame's 900px watch, so neither layout is left over the other after a resize.
    if (typeof window.caDialogFrame === 'function') {
      var fr = window.caDialogFrame(S.host, { size: 'md', onClose: function (o) { if (_cur === S) close(o && o.instant); } });
      if (fr.isDialog) { S.frame = fr; return; }   // desktop: the frame shows it and focuses Close
      S.frame = fr;
    }
    S.host.classList.add('open'); S.scrim.classList.add('open');
    try { S.host.focus({ preventScroll: true }); } catch (_) {}   // the sheet itself: no keyboard pops until they tap the box
  }

  window.openSuggestCert = open;
  window.iosSuggest = { open: open, close: close, isOpen: function () { return !!_cur; } };
})();
