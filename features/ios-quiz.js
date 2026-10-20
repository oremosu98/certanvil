// features/ios-quiz.js — Lift A: the June CertAnvil E2E quiz loop at phone width.
// Spec: docs/superpowers/specs/2026-10-19-ios-launch-june-design.md (Fidelity rule, Lift A decisions).
// Design: branch feat/cert-ios-e2e, mockups/cert-ios-quiz.html, cert-ios-results.html,
// cert-ios-review-answers.html. Pure helpers (_ios*) are self-contained so UAT can run them in a vm.
(function () {
  if (!window._certanvilFeatures) window._certanvilFeatures = {};
  var PHONE = '(max-width: 899px)';
  function isPhone() { return !!(window.matchMedia && matchMedia(PHONE).matches); }

  // ── Generating ──────────────────────────────────────────────────────────
  // E2E: "Generating 10 Exam level questions on Subnetting, VLANs and DNS..."
  function _iosLoadingLine(o) {
    var d = String(o.diff || '');
    d = d ? d.charAt(0).toUpperCase() + d.slice(1).toLowerCase() : '';
    var on;
    if (!o.topics) on = o.label || 'a mix of topics';
    else if (!o.topics.length) on = 'a mix of topics';
    else if (o.topics.length === 1) on = o.topics[0];
    else if (o.topics.length <= 3) on = o.topics.slice(0, -1).join(', ') + ' and ' + o.topics[o.topics.length - 1];
    else on = o.topics.slice(0, 3).join(', ') + ' and ' + (o.topics.length - 3) + ' more topics';
    return 'Generating ' + o.count + (d ? ' ' + d : '') + ' questions on ' + on + '...';
  }

  var FLAG = '<path d="M5 21V4M5 4h11l-1.8 4L16 12H5"></path>';
  var X = '<path d="M6 6l12 12M18 6L6 18"></path>';
  function renderIosLoading(o) {
    var root = document.getElementById('ios-loading');
    if (!root || !isPhone()) return;
    var e = function (s) { return escHtml(String(s)); };
    root.innerHTML =
      '<div class="iq-qbar"><button class="iq-exit" type="button" data-act="cancel" aria-label="Cancel and go back to Home"><svg viewBox="0 0 24 24" aria-hidden="true">' + X + '</svg></button>'
      + '<div class="iq-qprog"><div class="iq-qprog-track"><div class="iq-qprog-fill" style="width:8%"></div></div><span class="iq-qprog-num">Building set...</span></div>'
      + '<button class="iq-qflag" type="button" disabled aria-hidden="true" tabindex="-1"><svg viewBox="0 0 24 24" aria-hidden="true">' + FLAG + '</svg></button></div>'
      + '<div class="iq-body">'
      + '<div class="iq-sk iq-sk-stem iq-shimmer"></div><div class="iq-sk iq-sk-stem iq-shimmer"></div><div class="iq-sk iq-sk-stem iq-short iq-shimmer"></div>'
      + '<div class="iq-sk-opt iq-shimmer"></div><div class="iq-sk-opt iq-shimmer"></div><div class="iq-sk-opt iq-shimmer"></div><div class="iq-sk-opt iq-shimmer"></div>'
      + '<p class="iq-gen-line">' + e(_iosLoadingLine(o)) + '</p>'
      + '<div class="iq-gen-prog"><div class="iq-gen-prog-track"><div class="iq-gen-prog-bar"></div></div><span class="iq-gen-prog-cap" id="ios-loading-cap">Generating questions...</span></div>'
      + '</div><div class="iq-qfoot"><button class="iq-btn-primary" type="button" disabled>Preparing your set</button></div>';
    var c = root.querySelector('[data-act="cancel"]');
    // ✕ is the existing Cancel (v8.164.0): same handler, same behaviour.
    if (c) c.addEventListener('click', function () { var b = document.getElementById('load-cancel'); if (b) b.click(); });
  }
  // Caption mirrors the real stage labels from _loadingProgressBegin/_loadingProgressUpdate.
  function iosLoadingCaption(label) {
    var cap = document.getElementById('ios-loading-cap');
    if (cap && label) cap.textContent = String(label).replace(/…$/, '...');
  }

  window._iosLoadingLine = _iosLoadingLine;
  window.renderIosLoading = renderIosLoading;
  window.iosLoadingCaption = iosLoadingCaption;
})();
