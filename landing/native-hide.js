/* landing/native-hide.js — Stage 5a (27 Oct 2026). The landing site is its own Vercel project, so it carries this
   small copy of native-shell.js's detection: inside the CertAnvil iOS app (Capacitor, or the CertAnvilApp UA suffix)
   it marks html.is-native, and landing/dg-system.css hides every web purchase link (Apple Guideline 3.1.1) until
   in-app purchase lands in stage 6. On the website it does nothing. */
(function () {
  var C = window.Capacitor;
  var native = !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform())
    || /CertAnvilApp/.test(navigator.userAgent || '');
  if (native) document.documentElement.classList.add('is-native');
})();
