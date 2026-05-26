// ════════════════════════════════════════════════════════════════════
// TB v3 Phase 9 — Coach Module
// Hybrid (scripts + AI fallback) right-rail tutor for Topology Builder v3.
// Two modes (PBQ + Free Build), one shell. AI fires only as fallback —
// FB student questions + PBQ 4th-hint stuck-escape. Scripts everywhere
// else. Cost-bounded by design.
//
// Spec: docs/superpowers/specs/2026-05-26-tb-v3-coach-design.md
// Plan: docs/superpowers/plans/2026-05-26-tb-v3-coach.md
// ════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var COACH_VERSION = '1.0.0';

  // ── Mode detection (Task 3) ────────────────────────────────────────
  // The Coach lives in one of two modes. Mode is derived from canvas
  // state, NEVER stored independently — keeps the panel a pure render
  // of the source of truth. PBQ when a PBQ is loaded and the current
  // step index is within the catalog's step list; FB otherwise.
  function getCoachMode(state) {
    if (!state || !state.activePbqId) return 'fb';
    var catalog = (typeof window !== 'undefined' && window.TB_V3_PBQS) || [];
    var pbq = catalog.find(function (p) { return p.id === state.activePbqId; });
    if (!pbq) return 'fb';
    if (typeof state.currentStepIndex !== 'number') return 'fb';
    if (state.currentStepIndex >= pbq.steps.length) return 'fb';
    return 'pbq';
  }

  // ── AI session counter (Task 4) ────────────────────────────────────
  // Per-day counter persisted to localStorage. Renders top-right of the
  // panel header as a cost-conscious affordance — students always see
  // how many AI calls they have fired today. Resets when the calendar
  // date rolls over (UTC ISO date). Defensive try/catch for Safari
  // incognito SecurityError on localStorage access.
  var COUNTER_KEY = 'tbV3CoachCounter';

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function getCounter() {
    try {
      var raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(COUNTER_KEY) : null;
      if (!raw) return { date: today(), count: 0 };
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.date !== today()) return { date: today(), count: 0 };
      return parsed;
    } catch (e) {
      return { date: today(), count: 0 };
    }
  }

  function incrementCounter() {
    var cur = getCounter();
    var next = { date: today(), count: cur.count + 1 };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(COUNTER_KEY, JSON.stringify(next));
      }
    } catch (e) { /* swallow — quota exceeded / SecurityError */ }
    return next;
  }

  // ── Module export ──────────────────────────────────────────────────
  var TbV3Coach = {
    COACH_VERSION: COACH_VERSION,
    getCoachMode: getCoachMode,
    getCounter: getCounter,
    incrementCounter: incrementCounter,
  };

  if (typeof window !== 'undefined') {
    window.TbV3Coach = TbV3Coach;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TbV3Coach;
  }
})();
