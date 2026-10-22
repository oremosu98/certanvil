/* Lift B3b1 (v8.188.0): practice Sim Lab on phones (cert-ios-simlab.html). Loaded eagerly (defer);
 * features/sim-lab.js is lazy and calls in here only on phones, only when a caller passes opts.lift.
 * Desktop never reaches any of this. */
(function () {
  'use strict';
  var MQ = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
  function isPhone() { return !!(MQ && MQ.matches); }
  window.iosSimLab = window.iosSimLab || {};
  window.iosSimLab.isPhone = isPhone;
})();
