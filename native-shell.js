/* native-shell.js — makes the web app aware it runs inside the CertAnvil iOS app.
   ADR-004 (19 Oct 2026): the iOS app loads the live cert sites inside a Capacitor shell.
   On the website this file does nothing. Inside the app it:
     - sets html.is-native so CSS can hide web-only UI (Go-Pro links: Apple Guideline 3.1.1,
       until in-app purchase lands in G-3; the add-to-home-screen banner);
     - opens links that leave *.certanvil.com in the in-app browser sheet;
     - remembers the last cert subdomain and reopens it on the next launch;
     - keeps the status bar readable for the theme, and adds a light haptic on answer taps.
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

  // Reopen the last cert. The app always launches on secplus; the first page of a launch
  // (no session flag yet on this origin) jumps to the remembered subdomain if it differs.
  var host = location.hostname;
  try {
    if (P.Preferences && OURS.test(host) && host !== 'certanvil.com') {
      if (!sessionStorage.getItem('ca_launched')) {
        sessionStorage.setItem('ca_launched', '1');
        P.Preferences.get({ key: 'lastCertHost' }).then(function (r) {
          var last = r && r.value;
          if (last && last !== host && OURS.test(last)) location.replace('https://' + last + '/');
          else P.Preferences.set({ key: 'lastCertHost', value: host });
        }).catch(function () {});
      } else {
        P.Preferences.set({ key: 'lastCertHost', value: host }).catch(function () {});
      }
    }
  } catch (_) {}

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
    var ext = external(a.href);
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

  // A light haptic tick when an answer is picked.
  document.addEventListener('click', function (e) {
    if (!P.Haptics || !e.target || !e.target.closest) return;
    if (e.target.closest('#options .option, .sl-item, .dl-option')) P.Haptics.impact({ style: 'LIGHT' }).catch(function () {});
  }, true);
})();
