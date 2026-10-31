// Persona bundle Task 14: the phone "Suggest a cert" sheet (June E2E drawing: mockups/cert-ios-settings.html, suggestSheet).
// Opened from Settings (Study setup) and from the My certs hub. Rows and picks come from lib/cert-requests.js; this file
// only draws the sheet and wires it. Own host, so it layers above the hub and takes its own Escape.
(function () {
  var _host = null, _scrim = null, _picks = [], _q = '', _back = null, _keyFn = null, _closing = null;

  function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var CHK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';

  function _html(sent) {
    if (sent) {
      var first = _picks[0] || '', second = _picks[1];
      return '<div class="sg-grip"></div><div class="sg-done"><div class="sg-stack">'
        + _picks.slice(0, 4).map(function (n) { return '<span class="sg-g">' + e(window._certReqGlyph(n)) + '</span>'; }).join('') + '</div>'
        + '<h3 id="sg-title" tabindex="-1">Thanks, noted.</h3><p>When ' + (second ? e(first) + ' or ' + e(second) : e(first || 'yours')) + ' lands, we’ll tell you.</p></div>'
        + '<button class="sg-pri" type="button" data-act="done">Done</button>';
    }
    var m = window._certReqRows(_q, _picks), list = '';
    function row(cls, badge, name, sub, on, data) {
      return '<button class="sg-row' + cls + (on ? ' on' : '') + '" type="button" data-act="pick" data-c="' + e(data) + '" aria-pressed="' + !!on + '"><span class="sg-g">' + badge
        + '</span><span class="sg-n">' + name + '<span>' + sub + '</span></span><span class="sg-tick" aria-hidden="true">' + CHK + '</span></button>';
    }
    m.groups.forEach(function (g) {
      list += '<div class="sg-vendor">' + e(g.vendor) + '</div>';
      g.rows.forEach(function (r) { list += row('', e(r.badge), e(r.name), e(g.vendor) + ' · ' + e(r.code), r.on, r.name); });
    });
    if (m.typed) list += row(' sg-add', '+', 'Suggest “' + e(m.typed.label) + '”', 'Not on our list yet', m.typed.on, m.typed.label);
    m.mine.forEach(function (x) { list += row(' sg-add', '+', e(x.label), 'Your suggestion', true, x.label); });
    if (m.else) list += '<button class="sg-row sg-else" type="button" data-act="else"><span class="sg-g">+</span><span class="sg-n">Something else?<span>Type any exam in the box above</span></span></button>';
    var n = _picks.length;
    return '<div class="sg-grip"></div><span class="sg-eyebrow">Help shape CertAnvil</span><h3 id="sg-title">Which exam should we add next?</h3><p class="sg-sub">Tap any you’d study. We build the most-asked first.</p>'
      + '<label class="sg-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg><input id="sg-q" type="text" maxlength="120" placeholder="Search or type an exam" value="' + e(_q) + '" aria-label="Search or type an exam" autocomplete="off" autocapitalize="off" enterkeyhint="search"></label>'
      + '<div class="sg-list">' + list + '</div>'
      + '<button class="sg-pri" type="button" data-act="send"' + (n ? '' : ' disabled') + '>' + window._certReqSendText(n) + '</button>'
      + '<p class="sg-note">Only we see these. One vote per exam.</p>';
  }

  function _draw(sent, keepCaret) {
    if (!_host) return;
    var hadFocus = document.activeElement && document.activeElement.id === 'sg-q', pos = 0;
    if (hadFocus) pos = document.activeElement.selectionStart;
    var list = _host.querySelector('.sg-list'), top = list ? list.scrollTop : 0;
    _host.innerHTML = _html(sent);
    var l2 = _host.querySelector('.sg-list'); if (l2) l2.scrollTop = top;
    if (hadFocus && keepCaret) { var i = document.getElementById('sg-q'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (_) {} } }
  }

  function _pick(c) {
    var i = _picks.indexOf(c);
    if (i >= 0) _picks.splice(i, 1); else _picks.push(c);
    // a typed exam you just picked or dropped: clear the box so the list returns
    var m = window._certReqRows(_q, []); if (m.typed && m.typed.label === c) _q = '';
  }

  function _send() {
    if (!_picks.length) return;
    var btn = _host.querySelector('[data-act="send"]'); if (btn) btn.disabled = true;
    var labels = _picks.slice();
    var p = (typeof window.sendCertRequests === 'function') ? window.sendCertRequests(labels) : Promise.resolve({ ok: false, failed: labels });
    // Thanks either way: a failed send is queued and retried on the next Home, so the person's tap is never lost.
    Promise.resolve(p).then(function () {}, function () {}).then(function () {
      if (!_host) return;
      _draw(true);
      var h = document.getElementById('sg-title'); if (h) { try { h.focus({ preventScroll: true }); } catch (_) {} }
    });
  }

  function close(instant) {
    if (!_host) return;
    var host = _host, scrim = _scrim, back = _back;
    if (_keyFn) { window.removeEventListener('keydown', _keyFn, true); _keyFn = null; }
    _host = _scrim = _back = null;
    host.classList.remove('open'); scrim.classList.remove('open');
    var done = function () { if (host.parentNode) host.parentNode.removeChild(host); if (scrim.parentNode) scrim.parentNode.removeChild(scrim); };
    if (instant) done(); else setTimeout(done, 220);
    if (back && back.isConnected && back.focus) { try { back.focus({ preventScroll: true }); } catch (_) {} }
  }

  function open() {
    if (_host) return;
    if (window._certanvilSignedIn === false) {   // signed in only: the Settings row is hidden, the hub link should never reach here
      if (window.caNative && typeof window.caNative.requireAccount === 'function') window.caNative.requireAccount('signedout');
      return;
    }
    if (typeof window._certReqRows !== 'function') return;
    _back = document.activeElement; _picks = []; _q = '';
    _scrim = document.createElement('div'); _scrim.id = 'ios-suggest-scrim'; _scrim.className = 'sg-scrim';
    _host = document.createElement('div'); _host.id = 'ios-suggest'; _host.className = 'sg-sheet'; _host.tabIndex = -1;
    _host.setAttribute('role', 'dialog'); _host.setAttribute('aria-modal', 'true'); _host.setAttribute('aria-labelledby', 'sg-title');
    document.body.appendChild(_scrim); document.body.appendChild(_host);
    _host.innerHTML = _html(false);
    var host = _host;
    _scrim.addEventListener('click', function () { close(); });
    host.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-act]'); if (!b || b.disabled) return;
      var a = b.getAttribute('data-act');
      if (a === 'pick') { _pick(b.getAttribute('data-c')); _draw(false); }
      else if (a === 'else') { var i = document.getElementById('sg-q'); if (i) i.focus(); }
      else if (a === 'send') _send();
      else if (a === 'done') close();
    });
    host.addEventListener('input', function (ev) {
      if (ev.target && ev.target.id === 'sg-q') { _q = ev.target.value; _draw(false, true); }
    });
    _keyFn = function (ev) {
      if (ev.key !== 'Escape') return;
      ev.preventDefault();   // the hub (and anything below) ignores a defaultPrevented Escape: one layer per press
      close();
    };
    window.addEventListener('keydown', _keyFn, true);
    void host.offsetWidth;
    host.classList.add('open'); _scrim.classList.add('open');
    try { host.focus({ preventScroll: true }); } catch (_) {}   // the sheet itself: no keyboard pops until they tap the box
  }

  window.openSuggestCert = open;
  window.iosSuggest = { open: open, close: close, isOpen: function () { return !!_host; } };
})();
