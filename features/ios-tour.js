// F3 (30 Oct): the first-Home tour on phones (mockups/cert-ios-home.html ?v=tour). Four tips, each pointing at the
// real thing: a ring cuts the element out of a dimmed screen and a bubble sits beside it. Shown once on the first
// normal Home (opening marks it seen, so closing at any step counts); Account's "Replay the tour" starts it again.
// Anchors are selectors, re-queried on every placement, because the real Home re-renders.
(function () {
  function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // m = {step: 1..4, total: 4, h, p}; p is trusted copy that may carry <b>
  function _itTourHtml(m) {
    var last = m.step >= m.total;
    return '<div class="tt-top"><span class="tt-count">' + m.step + ' of ' + m.total + '</span>'
      + '<button type="button" class="tt-x" data-act="close" aria-label="Close tour"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button></div>'
      + '<h3 class="tt-h" id="it-h">' + e(m.h) + '</h3>'
      + '<p class="tt-p">' + m.p + '</p>'
      + '<div class="tt-foot"><button type="button" class="tt-next" data-act="next">' + (last ? 'Done' : 'Next') + '</button></div>';
  }

  // Tip 1's numbers come from the cert pack's own scale (features/ios-firstrun.js)
  function packMeta() { var p = window.CERT_PACK; return (p && p.meta) || {}; }
  function scaleLine() {
    var s = typeof window._ifrScale === 'function' ? window._ifrScale(packMeta()) : null;
    return (s ? 'It runs from ' + s.min + ' to ' + s.max + ', and <b>' + s.pass + ' is a pass</b>. ' : '') + 'It unlocks after your first quiz and climbs as you answer.';
  }
  var _IT_STEPS = [
    { sel: '#ios-home .ih-rd', h: 'Your readiness score', get p() { return scaleLine(); } },
    { sel: '#ios-home .ih-rec', h: 'Not sure what to do?', p: 'Tap <b>Recommended next</b>. It picks your next session from what you’ve answered so far.' },
    { sel: '#lift-tabbar .lift-tab[data-page="drills"]', h: 'Drills for weak spots', p: 'Go back over the questions you got wrong, or practise one topic at a time.' },
    { sel: '#lift-tabbar .lift-tab[data-page="progress"]', h: 'See how you’re doing', p: 'Progress shows your score over time and how each exam topic is going. You can replay this tour any time from <b>Account</b>.' }
  ];
  window._itTourHtml = _itTourHtml;
  window._IT_STEPS = _IT_STEPS;
  if (typeof document === 'undefined') return;   // the UAT sandbox stops here

  var PHONE = '(max-width: 899px)', SEEN_KEY = 'ca_tour_seen', SETTLE_MS = 650;   // Home's cards finish rising by then
  var host = null, ring = null, tip = null, i = 0, starting = false, stepT = 0, settleT = 0, hideT = 0, lastFocus = null;
  function isPhone() { try { return window.matchMedia(PHONE).matches; } catch (_) { return false; } }
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } }
  function html() { return document.documentElement; }
  function isOpen() { return !!(host && host.classList.contains('open')); }

  // Seen: Preferences in the app (survives a WebView storage purge), localStorage on the website.
  function native() { return !!(window.CA_NATIVE && window.caNative && window.caNative.get); }
  function seen() {
    if (native()) return window.caNative.get('tourSeen').then(function (v) { return !!v; }, function () { return false; });
    try { return Promise.resolve(!!localStorage.getItem(SEEN_KEY)); } catch (_) { return Promise.resolve(false); }
  }
  function markSeen() {
    if (native()) { try { window.caNative.set('tourSeen', '1'); } catch (_) {} return; }
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (_) {}
  }
  // Another sheet or full screen is up: the tour waits for a later Home rather than stacking on it
  function blocked() {
    var c = html().classList, s = document.getElementById('ist-sheet');
    return !!(document.getElementById('irm-sheet') || (s && s.classList.contains('open'))
      || c.contains('ifr-picking') || c.contains('ifr-check') || c.contains('isi-open') || c.contains('ic-open'));
  }

  function build() {
    if (host) return;
    host = document.createElement('div');
    host.id = 'ios-tour';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-labelledby', 'it-h');
    host.hidden = true;
    host.innerHTML = '<div class="tour-ring" aria-hidden="true"></div><div class="tour-tip"></div>';
    ring = host.firstChild; tip = host.lastChild;
    document.body.appendChild(host);
    // X, Done or a tap anywhere outside the bubble closes it
    host.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-act]');
      if (b && tip.contains(b)) { if (b.getAttribute('data-act') === 'next') next(); else close(); return; }
      if (!tip.contains(ev.target)) close();
    });
  }
  function anchor(k) {
    var el = document.querySelector(_IT_STEPS[k].sel);
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return (r.width || r.height) ? el : null;   // a hidden anchor (display:none) counts as missing
  }
  function firstFrom(k) { for (; k < _IT_STEPS.length; k++) if (anchor(k)) return k; return -1; }
  function draw() {
    var t = _IT_STEPS[i];
    tip.innerHTML = _itTourHtml({ step: i + 1, total: _IT_STEPS.length, h: t.h, p: t.p });
    var el = anchor(i);
    if (el && !el.closest('#lift-tabbar')) { try { el.scrollIntoView({ block: 'nearest' }); } catch (_) {} }
    place();
  }
  // Fixed positioning against the real viewport. html carries `zoom: 1.10` (styles-critical.css), so rects come back in
  // zoomed pixels while left/top are laid out in CSS pixels: divide by k, measured off the full-screen host itself
  // (the drawing's own scale trick), so it holds whichever way an engine reports zoom.
  // The bubble sits below the anchor, above it when it would cross the tabs.
  function place() {
    if (!host || host.hidden) return;
    var el = anchor(i);
    if (!el) { var k = firstFrom(i + 1); if (k < 0) { close(); return; } i = k; draw(); return; }
    var hr = host.getBoundingClientRect(), z = (host.offsetWidth && hr.width / host.offsetWidth) || 1;
    var vw = host.offsetWidth || window.innerWidth, vh = host.offsetHeight || window.innerHeight;
    function cv(b) { return { left: (b.left - hr.left) / z, top: (b.top - hr.top) / z, width: b.width / z, height: b.height / z, bottom: (b.bottom - hr.top) / z }; }
    var r = cv(el.getBoundingClientRect()), inBar = !!el.closest('#lift-tabbar'), pad = inBar ? 2 : 5;
    ring.style.left = (r.left - pad) + 'px'; ring.style.top = (r.top - pad) + 'px';
    ring.style.width = (r.width + pad * 2) + 'px'; ring.style.height = (r.height + pad * 2) + 'px';
    ring.style.borderRadius = inBar ? '14px' : '20px';
    var bar = document.getElementById('lift-tabbar'), br = bar && !bar.hidden ? cv(bar.getBoundingClientRect()) : null;
    var colL = br && br.width ? br.left : 0, colW = br && br.width ? br.width : vw;
    var limit = br && br.height ? br.top : vh;
    var tw = colW - 32;
    tip.style.left = (colL + 16) + 'px'; tip.style.width = tw + 'px';
    var th = tip.offsetHeight, below = r.bottom + pad + 14 + th < limit - 8;
    tip.classList.toggle('above', !below);
    tip.style.top = (below ? r.bottom + pad + 12 : r.top - pad - 12 - th) + 'px';
    tip.style.setProperty('--tip-ox', Math.max(26, Math.min(tw - 26, r.left + r.width / 2 - colL - 16)) + 'px');
  }
  function settle() { place(); clearTimeout(settleT); settleT = setTimeout(place, SETTLE_MS); }
  function focusNext() { var n = tip && tip.querySelector('[data-act="next"]'); if (n) { try { n.focus({ preventScroll: true }); } catch (_) {} } }

  function open() {
    var k = firstFrom(0);
    if (k < 0) return;
    build();
    clearTimeout(hideT); clearTimeout(stepT);
    i = k;
    markSeen();
    lastFocus = document.activeElement;
    host.classList.remove('stepping');
    host.classList.add('entering');
    host.hidden = false;
    html().classList.add('itr-open');
    draw();
    void tip.offsetWidth;
    host.classList.add('open');
    requestAnimationFrame(function () { requestAnimationFrame(function () { host.classList.remove('entering'); }); });
    focusNext();
    clearTimeout(settleT); settleT = setTimeout(place, SETTLE_MS);
  }
  function close() {
    if (!isOpen()) return;
    clearTimeout(stepT); clearTimeout(settleT);
    host.classList.remove('open', 'stepping', 'entering');
    html().classList.remove('itr-open');
    hideT = setTimeout(function () { if (!isOpen()) host.hidden = true; }, 180);
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) { try { lastFocus.focus({ preventScroll: true }); } catch (_) {} }
    lastFocus = null;
  }
  function next() {
    if (host.classList.contains('stepping')) return;
    var k = firstFrom(i + 1);
    if (k < 0) { close(); return; }
    var go = function () { i = k; draw(); host.classList.remove('stepping'); focusNext(); };
    if (reduced()) { go(); return; }
    host.classList.add('stepping');
    stepT = setTimeout(function () { go(); }, 120);
  }

  // Runs on every ca:home-shown. Only the first normal Home of a signed-in phone, once.
  function maybeStart() {
    function ready() {
      var p = document.getElementById('page-setup');
      return isPhone() && !!(p && p.classList.contains('active'))
        && !!(window.iosFirstRun && window.iosFirstRun.homeState && window.iosFirstRun.homeState() === null)
        && !html().classList.contains('ifr-offline') && window._certanvilSignedIn === true
        && document.body.classList.contains('is-state-resolved')   // the quota is known, so a capped Home can't flash a normal one first
        && !!document.querySelector('#ios-home .ih-rd') && !blocked();
    }
    if (isOpen() || starting || !ready()) return;
    starting = true;
    seen().then(function (s) {
      if (s) { starting = false; return; }
      setTimeout(function () { starting = false; if (!isOpen() && ready()) open(); }, SETTLE_MS);   // after Home's own reveal
    });
  }
  // Replay: Home re-renders before showPage reveals it, so wait (up to 2s) until the readiness card is really on screen
  function start() {
    if (isOpen()) close();
    var t0 = Date.now();
    (function tick() {
      var p = document.getElementById('page-setup');
      if (p && p.classList.contains('active') && anchor(0)) { open(); return; }
      if (Date.now() - t0 < 2000) setTimeout(tick, 50); else open();
    })();
  }

  window.iosTour = { start: start, maybeStart: maybeStart, isOpen: isOpen };

  window.addEventListener('ca:home-shown', function () {
    if (!isOpen()) { maybeStart(); return; }
    // Home re-rendered under an open tour: keep the step, re-place on the new elements. Day-0, capped or offline ends it.
    var st = window.iosFirstRun && window.iosFirstRun.homeState ? window.iosFirstRun.homeState() : null;
    if (st !== null || html().classList.contains('ifr-offline')) { close(); return; }
    settle();
  });
  window.addEventListener('resize', function () { if (isOpen()) place(); });
  var raf = 0;
  // Capture catches whichever element scrolls Home (the document or .ih-body); rebuilt scrollers need no rebinding
  document.addEventListener('scroll', function () {
    if (!isOpen() || raf) return;
    raf = requestAnimationFrame(function () { raf = 0; place(); });
  }, { passive: true, capture: true });
  document.addEventListener('keydown', function (ev) {
    if (!isOpen()) return;
    if (ev.key === 'Escape') { ev.preventDefault(); close(); return; }
    if (ev.key === 'Tab') {   // keep focus inside the bubble while it is modal
      var f = tip.querySelectorAll('button'), a = f[0], z = f[f.length - 1];
      if (!f.length) return;
      if (ev.shiftKey && document.activeElement === a) { ev.preventDefault(); z.focus(); }
      else if (!ev.shiftKey && document.activeElement === z) { ev.preventDefault(); a.focus(); }
      else if (!tip.contains(document.activeElement)) { ev.preventDefault(); a.focus(); }
    }
  });
})();
