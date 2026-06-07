// lib/onboarding-home.js — Onboarding tier chrome (Phase 2): home bar + cert switcher.
//
// The post-activation home surfaces lifted from mockups/onboarding-batch2-concept.html:
//   • Free home — quota meter (Daily Review due · New practice X/15) + "Add an exam · Pro".
//   • Pro home  — a cert switcher pill that opens the "Your exams" sheet (per-cert
//     readiness, Take-diagnostic for an exam not started yet).
//   • Wires the upgrade-sheet triggers (daily cap / add a cert) onto STUBBED tier +
//     quota state. Entitlements are saas-gated (#136), so this is display + a soft
//     daily counter only — no hard enforcement, no Stripe.
//
// GUARDED — OFF BY DEFAULT. Inert unless the onboarding flag is on (localStorage
// 'onb_router', set by ?onb=1). Tier is a preview stub: ?onbtier=pro|free (persisted)
// lets a preview exercise both homes; default follows the router stub ('free').
//
// It injects ONE element — .onb-home-bar — as the first child of the home bento
// (main.board inside #page-setup). It never rewrites the existing home. Mount /
// unmount is driven by wrapping window.showPage, patched at DOMContentLoaded AFTER
// app.js has defined it; app.js itself stays untouched (keeps this off the files
// that overlap the in-flight mobile-fit2 branch).
//
// Sec-P7: no inline on* handlers. Delegated clicks read data-home-action.

(function () {
  'use strict';

  // ── guard + stubbed tier ────────────────────────────────────────────────────
  function guardOn() {
    try {
      var s = location.search || '';
      if (s.indexOf('onbtier=pro') !== -1) localStorage.setItem('onb_tier', 'pro');
      if (s.indexOf('onbtier=free') !== -1) localStorage.removeItem('onb_tier');
      return localStorage.getItem('onb_router') === '1';
    } catch (_) { return false; }
  }
  function tier() {
    // Prefer the router-computed tier (admin-aware; published by onboarding-boot
    // once auth resolves). Either signal can grant Pro; neither downgrades the
    // other — so the ?onbtier=pro preview stub still forces Pro for non-admins.
    try { if (window._onbTier === 'pro') return 'pro'; } catch (_) {}
    try { if (localStorage.getItem('onb_tier') === 'pro') return 'pro'; } catch (_) {}
    return 'free';
  }

  var ENABLED = guardOn();
  var REDUCE = false;
  try { REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) {}

  // The 8 certs (static metadata; mirrors onboarding-firstrun.js + the cert packs).
  var CERTS = [
    { id: 'netplus',     name: 'Network+',           vendor: 'N10-009',  mark: 'N+'  },
    { id: 'secplus',     name: 'Security+',          vendor: 'SY0-701',  mark: 'S+'  },
    { id: 'aplus-core1', name: 'A+ Core 1',          vendor: '220-1101', mark: 'A+'  },
    { id: 'aplus-core2', name: 'A+ Core 2',          vendor: '220-1102', mark: 'A+'  },
    { id: 'az900',       name: 'AZ-900',             vendor: 'Azure Fundamentals',    mark: 'AZ'  },
    { id: 'ai900',       name: 'AI-900',             vendor: 'Azure AI Fundamentals', mark: 'AI'  },
    { id: 'sc900',       name: 'SC-900',             vendor: 'Security Fundamentals',  mark: 'SC'  },
    { id: 'clfc02',      name: 'Cloud Practitioner', vendor: 'CLF-C02',  mark: 'CLF' }
  ];

  var NEW_Q_CAP = 15;   // free daily new-question cap (display only; #136 enforces)
  var REVIEW_CAP = 5;   // free daily review cap

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function certById(id) { for (var i = 0; i < CERTS.length; i++) if (CERTS[i].id === id) return CERTS[i]; return null; }
  function currentCertId() { return (window.CURRENT_CERT) || (state.certId) || 'netplus'; }

  var state = { certId: null };
  var enteredOnce = false;   // entrance animation plays only the first time the bar appears

  // ── real-ish data reads (cheap, read-only) ───────────────────────────────────
  // Per-cert readiness score from the shipped snapshot store; null if not scored.
  function readinessFor(certId) {
    try {
      var raw = localStorage.getItem('nplus_readiness_snapshots');
      if (!raw) return null;
      var snaps = JSON.parse(raw) || {};
      var s = snaps[certId];
      if (s && typeof s.score === 'number') return Math.round(s.score);
      if (typeof s === 'number') return Math.round(s);
    } catch (_) {}
    return null;
  }
  function isActivated(certId) { return readinessFor(certId) != null; }
  function dueCount() {
    try { if (typeof window.getSrDueCount === 'function') return window.getSrDueCount() | 0; } catch (_) {}
    return 0;
  }
  // Stubbed soft counter for new questions answered today (#136 owns the real one).
  function todayKey() { try { return (new Date()).toISOString().slice(0, 10); } catch (_) { return 'x'; } }
  function newUsed() {
    try { return Math.max(0, parseInt(localStorage.getItem('onb_q_new_' + todayKey()) || '0', 10) || 0); } catch (_) { return 0; }
  }
  function setNewUsed(n) {
    try { localStorage.setItem('onb_q_new_' + todayKey(), String(Math.max(0, n | 0))); } catch (_) {}
  }
  function hoursToReset() {
    try {
      var now = new Date();
      var end = new Date(now); end.setHours(24, 0, 0, 0);
      return Math.max(1, Math.ceil((end - now) / 3600000));
    } catch (_) { return 6; }
  }

  // ── coachmark tours (metadata.tours.<surfaceId>) ─────────────────────────────
  // Persisted locally as nplus_onb_tours = { <surfaceId>: {seen_at}, _skipAll }.
  // (Cloud-sync of tours can mirror the readiness/SR cert-keyed pattern later;
  // local-only is fine while the whole feature is gated behind ?onb=1.)
  function toursGet() { try { return JSON.parse(localStorage.getItem('nplus_onb_tours') || '{}') || {}; } catch (_) { return {}; } }
  function tourSeen(id) { var t = toursGet(); return !!(t._skipAll || t[id]); }
  function markTour(id) { try { var t = toursGet(); t[id] = { seen_at: (new Date()).toISOString() }; localStorage.setItem('nplus_onb_tours', JSON.stringify(t)); } catch (_) {} }
  function markSkipAllTips() { try { var t = toursGet(); t._skipAll = true; localStorage.setItem('nplus_onb_tours', JSON.stringify(t)); } catch (_) {} }

  // ── the home bar — free tier only ───────────────────────────────────────────
  // Pro injects no bar: the shipped CertAnvil-console cert id becomes the cert
  // switcher instead (see mountProConsole), so there is no Pro bar markup here.

  // Free-tier quota meter (Daily Review + soft new-question cap). Pro shows no
  // quota — see barHtml: the plan badge already says "Pro" and usage caps are a
  // free-tier concern, so the rows are just noise once you're paying.
  function quotaRows() {
    var due = dueCount();
    var reviewVal = due > REVIEW_CAP ? (REVIEW_CAP + ' of ' + REVIEW_CAP + ' today') : (due + (due === 1 ? ' card due' : ' cards due'));
    var used = Math.min(newUsed(), NEW_Q_CAP);
    var capped = used >= NEW_Q_CAP;
    var pctw = Math.round(used / NEW_Q_CAP * 100);
    var rv = capped
      ? '<button type="button" class="onb-hb-capbtn" data-home-action="cap-hit">Resets in ' + hoursToReset() + 'h</button>'
      : (used + ' / ' + NEW_Q_CAP + ' today');
    var newRow = '<div class="onb-hb-row"><span class="onb-hb-rn">New practice</span><span class="onb-hb-rv">' + rv + '</span></div>'
      + '<div class="onb-hb-meter" aria-hidden="true"><span style="width:' + pctw + '%"></span></div>';
    return '<div class="onb-hb-row"><span class="onb-hb-rn">Daily Review</span><span class="onb-hb-rv">' + esc(reviewVal) + '</span></div>' + newRow;
  }

  // Free-tier home bar only — Pro renders no bar (the console id is the switcher).
  function barHtml() {
    var c = certById(currentCertId()) || CERTS[0];
    var top = '<div class="onb-hb-top"><div class="onb-hb-cert"><span class="onb-hb-mark">' + esc(c.mark) + '</span>'
      + '<span class="onb-hb-ct"><span class="onb-hb-name">' + esc(c.name) + '</span><span class="onb-hb-code">' + esc(c.vendor) + '</span></span></div>'
      + '<span class="onb-hb-plan">Free</span></div>';
    var addCert = '<button type="button" class="onb-hb-add" data-home-action="add-cert"><span class="onb-hb-plus" aria-hidden="true">+</span><span>Add an exam</span><span class="onb-hb-protag">Pro</span></button>';
    return '<div class="onb-home-bar" data-onb-tier="free">'
      + top
      + '<div class="onb-hb-quota">' + quotaRows() + '</div>'
      + addCert
      + '</div>';
  }

  function mountTarget() {
    var setup = document.getElementById('page-setup');
    if (!setup) return null;
    return setup.querySelector('main.board') || setup;
  }
  function onHomeNow() { var s = document.getElementById('page-setup'); return !!(s && s.classList.contains('active')); }
  function consoleIdEl() { return document.querySelector('#page-setup .cmd-bar .cmd-id'); }

  // Remove the injected free-tier bar.
  function removeFreeBar() {
    var ex = document.getElementById('onb-home-bar-host');
    if (ex && ex.parentNode) ex.parentNode.removeChild(ex);
  }
  // Strip the Pro switcher affordance back off the shipped console bar.
  function unmountConsoleSwitch() {
    var bar = document.querySelector('.cmd-bar.onb-cmd-switch');
    if (!bar) return;
    bar.classList.remove('onb-cmd-switch');
    var idEl = bar.querySelector('.cmd-id');
    if (idEl) ['data-home-action', 'role', 'tabindex', 'aria-haspopup', 'aria-label'].forEach(function (a) { idEl.removeAttribute(a); });
  }
  // Full teardown (leaving home / disabling): remove both tiers' chrome.
  function unmount() { removeFreeBar(); unmountConsoleSwitch(); }

  function mount() {
    if (!ENABLED) return;
    if (tier() === 'pro') mountProConsole();
    else mountFreeBar();
  }

  // Free: inject the quota bar as the first child of the home bento.
  function mountFreeBar() {
    unmountConsoleSwitch();                     // tier may have flipped pro -> free
    var target = mountTarget();
    if (!target) return;
    removeFreeBar();
    var wrap = document.createElement('div');
    wrap.id = 'onb-home-bar-host';
    wrap.innerHTML = barHtml();
    if (!enteredOnce) {
      var bar = wrap.querySelector('.onb-home-bar');
      if (bar) bar.classList.add('onb-hb-enter');
      enteredOnce = true;
    }
    wrap.addEventListener('click', onBarClick);
    target.insertBefore(wrap, target.firstChild);
  }

  // Pro: no injected bar. Turn the shipped CertAnvil-console cert id into the
  // switcher (chevron + click) and anchor the one-time coachmark to it.
  function mountProConsole() {
    removeFreeBar();                            // no quota bar in Pro
    wireConsoleSwitch();
    var idEl = consoleIdEl();
    if (!idEl) return;
    var bar = idEl.closest('.cmd-bar');
    if (bar) bar.classList.add('onb-cmd-switch');
    idEl.setAttribute('data-home-action', 'open-switcher');
    idEl.setAttribute('role', 'button');
    idEl.setAttribute('tabindex', '0');
    idEl.setAttribute('aria-haspopup', 'dialog');
    idEl.setAttribute('aria-label', 'Switch exam');
    if (!tourSeen('switcher')) setTimeout(maybeShowCoach, REDUCE ? 0 : 700);
  }

  // Delegated, wired once: the console id is a shipped element re-rendered by
  // app.js (renderBentoTopbar), so we listen on document rather than binding it.
  var _consoleWired = false;
  function wireConsoleSwitch() {
    if (_consoleWired) return;
    _consoleWired = true;
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('.cmd-bar.onb-cmd-switch .cmd-id') : null;
      if (t) { e.preventDefault(); openSwitcher(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      var t = e.target && e.target.closest ? e.target.closest('.cmd-bar.onb-cmd-switch .cmd-id') : null;
      if (t) { e.preventDefault(); openSwitcher(); }
    });
  }

  function sync() { if (ENABLED && onHomeNow()) mount(); }

  function onBarClick(e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-home-action]') : null;
    if (!t) return;
    var action = t.getAttribute('data-home-action');
    if (action === 'open-switcher') { openSwitcher(); }
    else if (action === 'add-cert') { if (window.onbUpgrade) window.onbUpgrade.show('add-cert'); }
    else if (action === 'cap-hit') { if (window.onbUpgrade) window.onbUpgrade.show('cap'); }
  }

  // ── "Your exams" switcher sheet (reuses the #onb-overlay sheet mechanism) ─────
  function overlay() { return document.getElementById('onb-overlay'); }

  function switcherSheetHtml() {
    var cur = currentCertId();
    var rows = CERTS.map(function (c) {
      var score = readinessFor(c.id);
      var on = c.id === cur ? ' onb-sw-sel' : '';
      var right = score != null
        ? '<span class="onb-sw-score"><span class="onb-sw-v">' + score + '</span><span class="onb-sw-l">/ 900</span></span>'
        : '<span class="onb-sw-start">Take diagnostic</span>';
      var sub = score != null ? esc(c.vendor) : 'Not started yet';
      return '<button type="button" class="onb-sw-row' + on + '" data-home-action="pick-cert" data-home-cert="' + c.id + '">'
        + '<span class="onb-sw-mark">' + esc(c.mark) + '</span>'
        + '<span class="onb-sw-meta"><span class="onb-sw-cn">' + esc(c.name) + '</span><span class="onb-sw-cs">' + sub + '</span></span>'
        + right
        + '</button>';
    }).join('');
    return '<div class="onb-ov-scrim" data-home-action="dismiss"></div>'
      + '<div class="onb-sheet" role="dialog" aria-modal="true" aria-label="Your exams"><div class="onb-grab" aria-hidden="true"></div>'
      + '<h2 class="onb-sh-title">Your exams</h2>'
      + '<div class="onb-sw-list">' + rows + '</div>'
      + '<button type="button" class="onb-sw-add" data-home-action="add-cert"><span class="onb-sw-plus" aria-hidden="true">+</span><span>Add an exam</span></button>'
      + '<button type="button" class="onb-sw-link" data-home-action="see-all">See all your exams and progress</button>'
      + '</div>';
  }

  function openSheet(html) {
    var h = overlay();
    if (!h) return;
    if (!h._homeWired) { h.addEventListener('click', onSheetClick); h._homeWired = true; }
    h.innerHTML = html;
    h.hidden = false;
    if (!REDUCE) { void h.offsetWidth; h.classList.add('onb-ov-in'); }
  }
  function closeSheet() {
    var h = overlay();
    if (!h || h.hidden) return;
    h.classList.add('onb-ov-out');
    var done = function () { h.hidden = true; h.classList.remove('onb-ov-out', 'onb-ov-in'); h.innerHTML = ''; };
    if (REDUCE) { done(); return; }
    setTimeout(done, 340);
  }

  function openSwitcher() {
    if (tier() !== 'pro') { if (window.onbUpgrade) window.onbUpgrade.show('add-cert'); return; }
    openSheet(switcherSheetHtml());
  }

  // ── coachmark: one-time nav hint on the Pro switcher ─────────────────────────
  // Anchored under the switcher pill (highlighted above a light scrim). Shown once
  // per surface; "Got it" marks this tour, "Don't show tips" skips all. Reuses the
  // #onb-overlay container + its scrim fade.
  function coachHtml(rect) {
    var POP_W = 300;                                              // matches CSS max-width
    var vw = window.innerWidth || document.documentElement.clientWidth || 360;
    var top = Math.round(rect.bottom + 10);
    var left = Math.max(12, Math.min(Math.round(rect.left), Math.max(12, vw - POP_W - 12)));  // keep on-screen
    var arrow = Math.max(16, Math.min(Math.round(rect.left + rect.width / 2 - left), POP_W - 16));  // point at the pill
    return '<div class="onb-ov-scrim onb-coach-scrim" data-home-action="coach-got"></div>'
      + '<div class="onb-coach-pop" role="dialog" aria-label="Tip" style="top:' + top + 'px;left:' + left + 'px;--coach-arrow:' + arrow + 'px;">'
      + '<div class="onb-coach-title">Switch between your exams here</div>'
      + '<div class="onb-coach-body">We save your place in each one, including its readiness score and review deck.</div>'
      + '<div class="onb-coach-actions">'
      + '<button type="button" class="onb-coach-skip" data-home-action="coach-skip">Don’t show tips</button>'
      + '<button type="button" class="onb-coach-got" data-home-action="coach-got">Got it</button>'
      + '</div></div>';
  }

  function maybeShowCoach(attempt) {
    attempt = attempt || 0;
    if (!ENABLED || tier() !== 'pro' || tourSeen('switcher')) return;
    var h = overlay();
    var anchor = document.querySelector('.cmd-bar.onb-cmd-switch .cmd-id');  // the console switcher
    if (!h || !anchor || !h.hidden) return;   // skip if a sheet is already open
    var rect = anchor.getBoundingClientRect();
    // Layout not settled yet (degenerate rect mid-reflow) — retry briefly so the
    // popover anchors to the id's real position rather than a collapsed one.
    if ((rect.width < 20 || rect.bottom < 1) && attempt < 8) {
      setTimeout(function () { maybeShowCoach(attempt + 1); }, 250);
      return;
    }
    anchor.classList.add('onb-coach-target');
    if (!h._homeWired) { h.addEventListener('click', onSheetClick); h._homeWired = true; }
    h.innerHTML = coachHtml(rect);
    h.hidden = false;
    if (!REDUCE) { void h.offsetWidth; h.classList.add('onb-ov-in', 'onb-coach-on'); }
    else h.classList.add('onb-coach-on');
  }

  function hideCoach() {
    var pill = document.querySelector('.onb-coach-target');
    if (pill) pill.classList.remove('onb-coach-target');
    var h = overlay();
    if (!h || h.hidden) return;
    h.classList.add('onb-ov-out');
    var done = function () { h.hidden = true; h.classList.remove('onb-ov-out', 'onb-ov-in', 'onb-coach-on'); h.innerHTML = ''; };
    if (REDUCE) { done(); return; }
    setTimeout(done, 300);
  }

  function onSheetClick(e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-home-action]') : null;
    if (!t) return;
    var action = t.getAttribute('data-home-action');
    if (action === 'coach-got') { markTour('switcher'); hideCoach(); return; }
    if (action === 'coach-skip') { markSkipAllTips(); hideCoach(); return; }
    if (action === 'dismiss') { closeSheet(); return; }
    if (action === 'add-cert') { closeSheet(); if (window.onbUpgrade) setTimeout(function () { window.onbUpgrade.show('add-cert'); }, REDUCE ? 0 : 200); return; }
    if (action === 'see-all') { closeSheet(); try { if (typeof window.showMyCerts === 'function') window.showMyCerts(); } catch (_) {} return; }
    if (action === 'pick-cert') {
      var certId = t.getAttribute('data-home-cert');
      closeSheet();
      try { console.info('[onb] switch ->', (isActivated(certId) ? 'cert-home' : 'first-run'), certId); } catch (_) {}
      if (isActivated(certId)) {
        // Real switch — same mechanism as the account-menu switcher: tadSwitchCert
        // hops to the cert's subdomain (prod) or override-reloads (localhost), and
        // handles the Pro gate itself. Everything (quiz/readiness/review) follows.
        setTimeout(function () { try { if (typeof window.tadSwitchCert === 'function') window.tadSwitchCert(certId); } catch (_) {} }, REDUCE ? 0 : 160);
      } else {
        // Not diagnosed yet → run first-run (the calibration) for that cert.
        var R = window.certanvilRouter;
        var decision = (R && R.routeOnSwitch) ? R.routeOnSwitch({ metadata: { tier: tier() } }, certId) : { kind: 'first-run', certId: certId };
        setTimeout(function () { try { if (window.onbFirstRun) window.onbFirstRun.start(decision); } catch (_) {} }, REDUCE ? 0 : 200);
      }
    }
  }

  // ── mount wiring: wrap showPage so the bar tracks the home page ───────────────
  // app.js defines showPage inside its OWN DOMContentLoaded handler, which runs
  // after this module's (script order), so showPage may not exist on the first
  // try — retry briefly until it does, then wrap + mount if home is already up.
  function wireShowPage() {
    if (typeof window.showPage !== 'function' || window.showPage._onbHomeWrapped) return;
    var orig = window.showPage;
    window.showPage = function (p) {
      var r = orig.apply(this, arguments);
      try { if (p === 'setup') mount(); else unmount(); } catch (_) {}
      return r;
    };
    window.showPage._onbHomeWrapped = true;
  }

  function patch(tries) {
    if (!ENABLED) return;
    tries = tries || 0;
    if (typeof window.showPage !== 'function' && tries < 60) {
      setTimeout(function () { patch(tries + 1); }, 50);
      return;
    }
    wireShowPage();
    // If the home is already the active page at patch time, mount immediately.
    try {
      var setup = document.getElementById('page-setup');
      if (setup && setup.classList.contains('active')) mount();
    } catch (_) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { patch(0); });
  else patch(0);

  // ── public API (dev/preview helpers) ─────────────────────────────────────────
  window.onbHome = {
    sync: sync,
    mount: mount,
    unmount: unmount,
    openSwitcher: openSwitcher,
    capHit: function () { if (window.onbUpgrade) window.onbUpgrade.show('cap'); },
    // preview helper: simulate exhausting today's free new-question cap.
    simulateCap: function () { setNewUsed(NEW_Q_CAP); sync(); if (window.onbUpgrade) window.onbUpgrade.show('cap'); },
    showCoach: maybeShowCoach,
    // preview helper: clear the seen-tours flags so the coachmark shows again.
    resetTours: function () { try { localStorage.removeItem('nplus_onb_tours'); } catch (_) {} },
    _state: function () { return { tier: tier(), cert: currentCertId(), due: dueCount(), newUsed: newUsed(), tours: toursGet() }; }
  };
})();
