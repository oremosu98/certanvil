/* event-actions.js — CSP-clean event delegation (M7).
   Replaces inline on*= handlers. Loaded (defer) BEFORE app.js; globals it
   dispatches to are resolved lazily at event time, so load order is safe.
   See docs/superpowers/specs/2026-05-31-m7-csp-unsafe-inline-design.md */
(function () {
  'use strict';

  function decodeArgs(el) {
    var raw = el.dataset.args;
    if (!raw) return [];
    try { return JSON.parse(raw); }
    catch (_) { return []; }   // fail safe: no args rather than throw
  }

  // Handlers that need the event object or bespoke wiring. Checked first.
  var ACTIONS = {
    copyCmd: function (e, el) { if (typeof copyCmd === 'function') copyCmd(e, decodeArgs(el)[0]); },
    updateExamDateStop: function (e, el) {
      e.stopPropagation();
      if (typeof updateExamDate === 'function') updateExamDate(decodeArgs(el)[0]);
    },
    aclSidebar: function (e, el) {
      var key = decodeArgs(el)[0];
      var t = window.__aclSidebarHandlers;
      if (t && typeof t[key] === 'function') t[key](e, el);
    }
  };

  function run(e) {
    var el = e.target.closest && e.target.closest('[data-action]');
    if (!el) return;
    var name = el.dataset.action;
    if (ACTIONS[name]) { ACTIONS[name](e, el); return; }
    var fn = window[name];
    if (typeof fn === 'function') fn.apply(null, decodeArgs(el));
  }

  document.addEventListener('click', run);
  document.addEventListener('change', run);
  document.addEventListener('input', run);

  // Expose for tests + for app.js to register additional ACTIONS if needed.
  window.__eventActions = { run: run, ACTIONS: ACTIONS, decodeArgs: decodeArgs };
})();
