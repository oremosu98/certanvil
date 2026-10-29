/* native-shell.js — makes the web app aware it runs inside the CertAnvil iOS app.
   ADR-004 (19 Oct 2026): the iOS app loads the live cert sites inside a Capacitor shell.
   On the website this file does nothing. Inside the app it:
     - sets html.is-native so CSS can hide web-only UI (every web purchase link: Apple Guideline 3.1.1,
       until in-app purchase lands in stage 6; the add-to-home-screen banner);
     - Stage 5a (27 Oct): opens the cert picker on first launch, saves the choice app-wide (Preferences:
       chosenCert, lockedCert for a free pick, lastCertHost) through window.caNative, holds a free user's lock
       with the cert-lock wall, and records the free cert on the locked cert's own page;
     - reopens the last cert on the next launch; opens links that leave *.certanvil.com in the in-app browser;
     - keeps the status bar readable for the theme; a light haptic on an answer pick, one success haptic at results.
   Plugins are reached through window.Capacitor.Plugins (injected by the native shell). */
(function () {
  var C = window.Capacitor;
  var native = !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform())
    || /CertAnvilApp/.test(navigator.userAgent || '');
  window.CA_NATIVE = native;
  if (!native) return;
  document.documentElement.classList.add('is-native');
  var P = (C && C.Plugins) || {};
  var OURS = /(^|\.)certanvil\.com$/i;
  var host = location.hostname;

  // ── Preferences (app-wide; each cert subdomain has its own web storage) ──
  function pget(k) { return P.Preferences ? P.Preferences.get({ key: k }).then(function (r) { return (r && r.value) || null; }, function () { return null; }) : Promise.resolve(null); }
  function pset(k, v) { return P.Preferences ? P.Preferences.set({ key: k, value: v }).catch(function () {}) : Promise.resolve(); }
  function pdel(k) { return P.Preferences && P.Preferences.remove ? P.Preferences.remove({ key: k }).catch(function () {}) : Promise.resolve(); }
  function hostOf(certId) {
    var R = window.certanvilRouter, url = R && R.certHost ? R.certHost(certId) : '';
    try { return new URL(url).hostname; } catch (_) { return ''; }
  }
  // Stage 5c (28 Oct): Sign in with Apple and Google through @capgo/capacitor-social-login (8.7.5). The Google client IDs
  // are public (not secrets); empty means Google stays hidden. window.CA_SOCIAL_IDS overrides them (tests).
  var SOCIAL = { googleIOS: '614075733544-jra264mi2kev9sshpr9pbf3fvhd00r7u.apps.googleusercontent.com',
                 googleWeb: '614075733544-fvsfvvovt37tqu75pj8cf7a71ja2789v.apps.googleusercontent.com' };   // Google Cloud, 28 Oct
  function socialIds() { return window.CA_SOCIAL_IDS || SOCIAL; }
  var socialInit = null;
  function socialPlugin() { return P.SocialLogin || null; }
  function initSocial() {
    if (socialInit) return socialInit;
    // useProperTokenExchange: Apple's authorization code comes back as authorizationCode (the revoke needs it)
    var ids = socialIds(), cfg = { apple: { clientId: 'com.certanvil.app', useProperTokenExchange: true } };
    if (ids.googleIOS && ids.googleWeb) cfg.google = { iOSClientId: ids.googleIOS, iOSServerClientId: ids.googleWeb };
    socialInit = Promise.resolve(socialPlugin().initialize(cfg));
    return socialInit;
  }
  // Stage 5d (29 Oct): study reminders through @capacitor/local-notifications (8.3.1) and the app's iOS settings page
  // through @capacitor/app-launcher (8.0.1). Ids 5001-5007 are the reminders' only ids.
  var REMINDER_IDS = [5001, 5002, 5003, 5004, 5005, 5006, 5007];
  function notifPlugin() { return P.LocalNotifications || null; }
  function permOf(r) { var d = r && r.display; return d === 'granted' || d === 'denied' ? d : 'prompt'; }   // prompt-with-rationale → prompt
  var reminders = {
    ready: function () { return !!notifPlugin(); },
    permission: function () { return notifPlugin() ? notifPlugin().checkPermissions().then(permOf, function () { return 'prompt'; }) : Promise.resolve('denied'); },
    request: function () { return notifPlugin() ? notifPlugin().requestPermissions().then(function (r) { return permOf(r) === 'granted' ? 'granted' : 'denied'; }, function () { return 'denied'; }) : Promise.resolve('denied'); },
    schedule: function (list) {
      if (!notifPlugin() || !list || !list.length) return Promise.resolve();
      return notifPlugin().schedule({ notifications: list.map(function (n) { return { id: n.id, title: n.title, body: n.body, schedule: { at: n.at } }; }) }).then(function () {});
    },
    cancelAll: function () {
      return notifPlugin() ? notifPlugin().cancel({ notifications: REMINDER_IDS.map(function (id) { return { id: id }; }) }).then(function () {}, function () {}) : Promise.resolve();
    }
  };
  // Returning to the foreground: features re-plan on this (ca:app-active)
  try {
    if (P.App && P.App.addListener) P.App.addListener('appStateChange', function (s) {
      if (s && s.isActive) { try { window.dispatchEvent(new Event('ca:app-active')); } catch (_) {} }
    });
  } catch (_) {}
  window.caNative = {
    reminders: reminders,
    canOpenAppSettings: function () { return !!P.AppLauncher; },
    openAppSettings: function () { return P.AppLauncher ? P.AppLauncher.openUrl({ url: 'app-settings:' }).then(function () {}, function () {}) : Promise.resolve(); },
    // The plugin passes the nonce through untouched: callers send sha256(raw) here and the raw nonce to Supabase.
    // Resolves { idToken, authorizationCode?, givenName?, familyName? }; rejects { cancelled: true } on a user cancel.
    social: function (provider, opts) {
      if (!socialPlugin()) return Promise.reject({ cancelled: false, message: 'unavailable' });
      opts = opts || {};
      var o = { scopes: opts.scopes || (provider === 'apple' ? ['name', 'email'] : ['email', 'profile']) };
      if (opts.nonce) o.nonce = opts.nonce;
      return initSocial().then(function () { return socialPlugin().login({ provider: provider, options: o }); }).then(function (res) {
        var r = (res && res.result) || {}, pf = r.profile || {};
        if (!r.idToken) throw { cancelled: false, message: 'no token' };
        var code = r.authorizationCode || (provider === 'apple' && r.accessToken && r.accessToken.token) || undefined;   // legacy envelope
        return { idToken: r.idToken, authorizationCode: code, givenName: pf.givenName || null, familyName: pf.familyName || null };
      }, function (e) {
        throw { cancelled: !!(e && e.code === 'USER_CANCELLED'), message: (e && e.message) || 'failed' };
      });
    },
    socialReady: function (provider) {
      if (!socialPlugin()) return false;
      if (provider === 'google') { var ids = socialIds(); return !!(ids.googleIOS && ids.googleWeb); }
      return provider === 'apple';
    },
    // Resolves once every write is done, so the next page's launch check sees the new host.
    choose: function (certId, opts) {
      var locked = !!(opts && opts.locked);
      return Promise.all([pset('chosenCert', certId), pset('lastCertHost', hostOf(certId)), locked ? pset('lockedCert', certId) : pdel('lockedCert')])
        .then(function () {});
    },
    // Stage 5b: read a one-time key and remove it (the lock toast)
    take: function (k) { return pget(k).then(function (v) { if (v) pdel(k); return v; }); },
    get: function (k) { return pget(k); },   // Stage 5d: the reminders' settings
    set: function (k, v) { return pset(k, v); },
    forget: function (k) { return pdel(k); },
    chosen: function () {
      return Promise.all([pget('chosenCert'), pget('lockedCert'), pget('lastCertHost')])
        .then(function (a) { return { chosenCert: a[0], lockedCert: a[1], lastCertHost: a[2] }; });
    }
  };

  // Reopen the last cert, on a cold launch only: the first page of this origin in the session, reached with no
  // certanvil.com referrer (an in-app cert switch arrives with one and must not bounce back). Only on our own hosts.
  function shouldReopen(here, last, referrer, launched) {
    if (launched || !last || last === here || !OURS.test(last) || !OURS.test(here)) return false;
    var ref = ''; try { ref = referrer ? new URL(referrer).hostname : ''; } catch (_) { ref = ''; }
    return !(ref && OURS.test(ref));
  }
  window.caNative._shouldReopen = shouldReopen;
  try {
    if (P.Preferences && OURS.test(host) && host !== 'certanvil.com') {
      var launched = !!sessionStorage.getItem('ca_launched');
      sessionStorage.setItem('ca_launched', '1');
      pget('lastCertHost').then(function (last) { if (shouldReopen(host, last, document.referrer, launched)) location.replace('https://' + last + '/'); });
    }
  } catch (_) {}

  // ── First launch, the lock, and the free cert record (once the page's own scripts have run) ──
  function tier() { var q = window._quotaState; return q && q.tier ? q.tier : null; }
  // The shell holds the lock for SIGNED-OUT users only, once sign-in has settled (auth-state.js sets
  // _certanvilSignedIn = false on every anonymous render). Signed-in users are lib/cert-lock.js's (it reads the
  // account's freeCertId), so the two walls can never disagree. Unresolved after 15s: fail open.
  function holdLock(locked) {
    var t0 = Date.now();
    function decide() {
      var s = window._certanvilSignedIn;
      if (s === true) return;
      if (s === false) { wall(locked); return; }
      if (Date.now() - t0 < 15000) setTimeout(decide, 250);
    }
    decide();
  }
  function whenSignedOut(fn) {
    var t0 = Date.now();
    (function decide() {
      var s = window._certanvilSignedIn;
      if (s === false) { fn(); return; }
      if (s !== true && Date.now() - t0 < 15000) setTimeout(decide, 250);
    })();
  }
  function wall(locked) { if (window._certLock && window._certLock.showWall) window._certLock.showWall(locked); }
  function onReady() {
    var here = window.CURRENT_CERT || null;
    window.caNative.chosen().then(function (c) {
      if (!c.chosenCert) {
        // Stage 5b: June's welcome first (Get started opens the picker); a pending code screen keeps its place.
        var S = window.iosSignIn;
        if (S && S.welcome) { if (!(S._pending && S._pending())) S.welcome(); return; }
        if (window.iosFirstRun && window.iosFirstRun.picker) window.iosFirstRun.picker({ tier: tier() === 'pro' ? 'pro' : 'free', native: true });
        return;
      }
      if (c.lockedCert && here && here !== c.lockedCert) { holdLock(c.lockedCert); return; }
      // Signed-out users only: a signed-in account's free exam comes from the cloud (Stage 5b), and a local write
      // here would be flushed over it. Waits for sign-in to settle, like holdLock; unresolved after 15s: no write.
      if (c.lockedCert && here === c.lockedCert) whenSignedOut(function () {
        try { if (typeof STORAGE === 'object' && !localStorage.getItem(STORAGE.FREE_CERT_ID)) localStorage.setItem(STORAGE.FREE_CERT_ID, here); } catch (_) {}
      });
      if (OURS.test(host) && host !== 'certanvil.com') pset('lastCertHost', host);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady); else setTimeout(onReady, 0);

  // Links: stay in the app for our own sites, open everything else in the browser sheet.
  function external(href) {
    var u; try { u = new URL(href, location.href); } catch (_) { return null; }
    if (!/^https?:$/.test(u.protocol) || OURS.test(u.hostname)) return null;
    return u.href;
  }
  function openSheet(url) {
    if (P.Browser) P.Browser.open({ url: url }).catch(function () {}); else location.href = url;
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var ext = external(a.href) || (a.hasAttribute('data-ext') ? a.href : null);   // data-ext: our page, but in the sheet (no way back otherwise)
    if (ext) { e.preventDefault(); openSheet(ext); return; }
    if (a.target === '_blank') { e.preventDefault(); location.href = a.href; }   // our own site: same webview
  }, true);
  var _open = window.open;
  window.open = function (url) {
    var ext = url ? external(url) : null;
    if (ext) { openSheet(ext); return null; }
    if (url) { location.href = new URL(url, location.href).href; return null; }
    return _open.apply(window, arguments);
  };

  // Status bar follows the theme (light text on the dark theme, dark text on light).
  function syncBar() {
    if (!P.StatusBar) return;
    var dark = document.documentElement.getAttribute('data-theme') !== 'light';
    P.StatusBar.setStyle({ style: dark ? 'DARK' : 'LIGHT' }).catch(function () {});
  }
  syncBar();
  try { new MutationObserver(syncBar).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch (_) {}

  // Haptics: a light tick on an answer pick; one success tap when a quiz, an exam or the first-run check reaches results.
  document.addEventListener('click', function (e) {
    if (!P.Haptics || !e.target || !e.target.closest) return;
    if (e.target.closest('#options .option, .sl-item, .dl-option, .ifr-opt')) P.Haptics.impact({ style: 'LIGHT' }).catch(function () {});
  }, true);
  function success() { if (P.Haptics && P.Haptics.notification) P.Haptics.notification({ type: 'SUCCESS' }).catch(function () {}); }
  function watchResults() {
    ['page-results', 'page-exam-results'].forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      var was = el.classList.contains('active');
      new MutationObserver(function () { var now = el.classList.contains('active'); if (now && !was) success(); was = now; })
        .observe(el, { attributes: true, attributeFilter: ['class'] });
    });
    var chk = document.getElementById('ios-check');
    if (chk) {
      var shown = false;
      new MutationObserver(function () { var s = !!chk.querySelector('.ifr-score'); if (s && !shown) success(); shown = s; })
        .observe(chk, { childList: true });
    }
  }
  try { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchResults); else watchResults(); } catch (_) {}
})();
