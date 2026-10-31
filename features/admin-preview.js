// Admin in the app, Task 7: Preview as Free (drawing: mockups/cert-ios-admin.html, the Free bar; spec 2026-10-31-admin-in-app-design.md).
// While on, the admin account reports Free with a daily limit of 15 at the one switch point (_refreshQuotaChip runs
// every quota answer through wrap()), so every screen that reads _quotaState behaves as Free with no per-screen changes.
// The counter is questions answered today on this device, from history, because the server does not count for a Pro
// account. The flag lives on this device only (never in cloud-store's synced keys) and sign-out clears it.
// The Admin screen's switch (Task 8) calls set(); "Back to Pro" on the bar turns it off.
(function () {
  var KEY = 'nplus_' + 'admin_free_preview';         // '1' while on; device only
  var KG_KEY = 'nplus_' + 'admin_free_preview_kg';   // {day, count}: questions answered before the last Keep going tap
  var LIMIT = 15;
  var real = null;   // the account's own quota state, kept so Back to Pro restores it without a reload
  var fake = null;   // the Free state we last handed out

  function _get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function _put(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (_) {} }
  function _day() { return typeof window._localDay === 'function' ? window._localDay() : new Date().toISOString().slice(0, 10); }
  function _answered() { try { return typeof getTodayQuestionCount === 'function' ? getTodayQuestionCount() : 0; } catch (_) { return 0; } }

  function on() { return window._certanvilIsAdmin === true && _get(KEY) === '1'; }

  // Questions answered today on this device, minus those before a Keep going tap.
  function _usedToday() {
    var n = _answered(), kg = null;
    try { kg = JSON.parse(_get(KG_KEY) || 'null'); } catch (_) { kg = null; }
    if (kg && kg.day === _day() && typeof kg.count === 'number') n -= kg.count;
    return Math.max(0, n);
  }

  function wrap(state) {
    if (!on()) return state;
    real = state;
    fake = { tier: 'free', daily_limit: LIMIT, used_today: _usedToday() };
    return fake;
  }

  // Swap the cached quota state in place, repaint the chip and sidebar locks, tell the hub, then fetch the real answer.
  function _apply() {
    try {
      var cur = window._quotaState;
      if (on()) { window._quotaState = wrap(cur === fake && fake ? real : cur); }
      else if (fake && cur === fake) { window._quotaState = real; fake = null; }
      if (typeof _renderQuotaChip === 'function') _renderQuotaChip();
      if (!on() && window._quotaState == null && window._certanvilIsAdmin === true) {
        document.body.classList.add('is-pro-tier');   // admin counts as Pro: never left looking Free while the real answer loads
      }
      window.dispatchEvent(new Event('ca:quota-ready'));
      if (typeof window.renderIosHome === 'function' && _phoneHomeShown()) window.renderIosHome();
    } catch (_) {}
    try { if (typeof _refreshQuotaChip === 'function') _refreshQuotaChip(); } catch (_) {}
  }
  function _phoneHomeShown() { var h = document.getElementById('ios-home'); return !!(h && h.offsetParent && h.innerHTML); }

  // ── The bar: under the status bar on phones, across the top of the main area on desktop ──
  var EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"></path></svg>';
  var bar = null, leaving = null;
  function _bar() {
    if (bar && bar.isConnected) return bar;
    bar = document.createElement('div');
    bar.id = 'ap-freebar';
    bar.className = 'ap-freebar';
    bar.setAttribute('role', 'status');
    bar.hidden = true;
    bar.innerHTML = EYE + '<span class="ap-freebar-tx"></span><button type="button" class="ap-freebar-back">Back to Pro</button>';
    bar.querySelector('.ap-freebar-back').addEventListener('click', _backToPro);
    // Back to Pro stays reachable over every screen: phone overlays (hub, sheets) inert the page behind them.
    try { new MutationObserver(function () { if (bar.inert) bar.inert = false; }).observe(bar, { attributes: true, attributeFilter: ['inert'] }); } catch (_) {}
    var top = document.getElementById('app-topbar');
    if (top && top.parentNode) top.parentNode.insertBefore(bar, top.nextSibling); else document.body.insertBefore(bar, document.body.firstChild);
    return bar;
  }
  function _draw(announce) {
    if (!document.body) return;
    var b = _bar(), show = on(), tx = b.querySelector('.ap-freebar-tx');
    if (leaving) { clearTimeout(leaving); leaving = null; b.classList.remove('leaving'); }
    document.documentElement.classList.toggle('ap-free', show);
    if (!show) { b.hidden = true; tx.textContent = ''; return; }
    if (!b.hidden && tx.textContent) return;
    b.hidden = false;
    if (announce) {
      // the live region is in the page empty first, then filled: announced once, on turning on
      tx.textContent = '';
      b.classList.remove('enter'); void b.offsetWidth; b.classList.add('enter');
      setTimeout(function () { if (on()) tx.textContent = 'Previewing as Free'; }, 60);
    } else {
      tx.textContent = 'Previewing as Free';
    }
  }
  function _backToPro() {
    var b = _bar();
    if (leaving) return;
    b.classList.add('leaving');
    leaving = setTimeout(function () { leaving = null; b.classList.remove('leaving'); set(false); }, 150);
  }

  function set(v) {
    var want = !!v;
    if (want && window._certanvilIsAdmin !== true) return;   // only the admin account can preview
    var was = on();
    _put(KEY, want ? '1' : null);
    if (!want) _put(KG_KEY, null);
    _draw(want && !was);
    _apply();
  }

  // Sign-out: the flag goes, and the next account on this device never starts in a preview.
  function clear() {
    _put(KEY, null); _put(KG_KEY, null);
    real = null; fake = null;
    _draw(false);
  }

  // auth-state sets window._certanvilIsAdmin once the profile lands (after the first quota answer, usually), so a
  // flag that survived a restart takes effect then.
  var _isAdmin = window._certanvilIsAdmin === true;
  try {
    Object.defineProperty(window, '_certanvilIsAdmin', {
      configurable: true, enumerable: true,
      get: function () { return _isAdmin; },
      set: function (v) {
        var was = on();
        _isAdmin = v === true;
        if (was !== on()) { _draw(false); _apply(); }
      }
    });
  } catch (_) {}

  // ── At 15: the Free "today's 15 are done" popup gets one extra link, only while previewing ──
  function _keepGoing() {
    _put(KG_KEY, JSON.stringify({ day: _day(), count: _answered() }));
    var m = document.getElementById('quota-exceeded-modal');
    if (m) m.remove();
    _apply();
    if (typeof window.startQuiz === 'function') window.startQuiz();
  }
  function _decorateLimit() {
    if (!on()) return;
    var m = document.getElementById('quota-exceeded-modal');
    var acts = m && m.querySelector('.quota-exceeded-actions');
    if (!acts || acts.querySelector('.ap-keep')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'quota-exceeded-dismiss ap-keep';
    b.textContent = 'Keep going (admin preview)';
    b.addEventListener('click', _keepGoing);
    acts.appendChild(b);
  }

  function _init() {
    _draw(false);
    try { new MutationObserver(_decorateLimit).observe(document.body, { childList: true }); } catch (_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _init); else _init();

  window._adminPreview = { on: on, set: set, wrap: wrap, clear: clear };
})();
