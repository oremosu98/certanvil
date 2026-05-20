// features/topology-builder-v3.js — v6.x Network Builder revamp
//
// Lazy-loaded via _loadFeature('topology-builder-v3') from the sidebar entry.
// Replaces v1 (features/topology-builder.js) and v2 (features/topology-builder-v2.js).
//
// 3 intents (Free Build / Lab / PBQ) × 5 action modes (Design / Simulate / Trace / OSI / 3D)
// + Export pinned right. Infinite canvas with pan/zoom/minimap. Forged-bronze editorial.
//
// Phase 1 ships: Free Build intent + Design mode + canvas + palette + save state + PNG export.
// Phases 2-9 layer on Scenarios / Simulate / Trace / OSI / 3D / Coach / PBQ / retire-v1-v2.

(function () {
  'use strict';

  // ───────────────────────────────────────────────────────────
  // STATE (single source of truth, serialised to STORAGE.TB_V3_DRAFT)
  // ───────────────────────────────────────────────────────────

  var state = {
    devices: [],           // [{id, type, x, y, label, config}]
    cables: [],            // [{id, fromId, fromPort, toId, toPort}]
    viewport: { x: 0, y: 0, zoom: 1 }, // pan offset + zoom
    intent: 'free-build',  // 'free-build' | 'lab' | 'pbq'
    mode: 'design',        // 'design' | 'simulate' | 'trace' | 'osi' | '3d'
    selectedId: null,      // currently-selected device id (or null)
  };

  // ───────────────────────────────────────────────────────────
  // CSS LOADING (single-call from enter())
  // ───────────────────────────────────────────────────────────

  function _ensureCss() {
    if (document.querySelector('link[href*="topology-builder-v3.css"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/features/topology-builder-v3.css?v=' + (window.APP_VERSION || 'dev');
    document.head.appendChild(link);
  }

  // ───────────────────────────────────────────────────────────
  // ENTRY POINT (called by sidebar handler)
  // ───────────────────────────────────────────────────────────

  function openTopologyBuilderV3() {
    _ensureCss();
    _loadState();
    _renderWorkspace();
  }

  // ───────────────────────────────────────────────────────────
  // PURE FUNCTIONS (testable in isolation via vm-sandbox)
  // ───────────────────────────────────────────────────────────

  function buildDevice(type, x, y) {
    return {
      id: 'dev_' + Date.now().toString(36) + '_' + Math.floor(Math.random()*1296).toString(36).padStart(2,'0'),
      type: type,
      x: x,
      y: y,
      label: '',
      config: {},
    };
  }

  function buildCable(fromId, fromPort, toId, toPort) {
    return {
      id: 'cbl_' + Date.now().toString(36) + '_' + Math.floor(Math.random()*1296).toString(36).padStart(2,'0'),
      fromId: fromId,
      fromPort: fromPort || 0,
      toId: toId,
      toPort: toPort || 0,
    };
  }

  function serialiseState(s) {
    return JSON.stringify({
      devices: s.devices,
      cables: s.cables,
      viewport: s.viewport,
      intent: s.intent,
      mode: s.mode,
    });
  }

  function parseState(json) {
    try {
      var parsed = JSON.parse(json || '{}');
      return {
        devices: Array.isArray(parsed.devices) ? parsed.devices : [],
        cables: Array.isArray(parsed.cables) ? parsed.cables : [],
        viewport: (parsed.viewport && typeof parsed.viewport === 'object')
          ? { x: parsed.viewport.x || 0, y: parsed.viewport.y || 0, zoom: parsed.viewport.zoom || 1 }
          : { x: 0, y: 0, zoom: 1 },
        intent: parsed.intent || 'free-build',
        mode: parsed.mode || 'design',
        selectedId: null,
      };
    } catch (e) {
      return { devices: [], cables: [], viewport: { x: 0, y: 0, zoom: 1 }, intent: 'free-build', mode: 'design', selectedId: null };
    }
  }

  // ───────────────────────────────────────────────────────────
  // SAVE / LOAD (TASK 6.x)
  // ───────────────────────────────────────────────────────────

  var _saveTimer = null;
  function _saveState() { /* TASK 6.2 */ }
  function _loadState() { /* TASK 6.3 */ }

  // ───────────────────────────────────────────────────────────
  // WORKSPACE RENDER (TASK 1.x)
  // ───────────────────────────────────────────────────────────

  function _renderWorkspace() { /* TASK 1.3 */ }

  // ───────────────────────────────────────────────────────────
  // CANVAS (TASK 2.x)
  // ───────────────────────────────────────────────────────────

  function _renderCanvas() { /* TASK 2.1 */ }
  function _wirePanZoom() { /* TASK 2.3 */ }
  function _renderMinimap() { /* TASK 2.5 */ }

  // ───────────────────────────────────────────────────────────
  // PALETTE (TASK 3.x)
  // ───────────────────────────────────────────────────────────

  function _renderPalette() { /* TASK 3.1 */ }
  function _wireDragToCanvas() { /* TASK 3.3 */ }

  // ───────────────────────────────────────────────────────────
  // CABLES (TASK 4.x)
  // ───────────────────────────────────────────────────────────

  function _wireCableDrawing() { /* TASK 4.1 */ }
  function _renderCables() { /* TASK 4.2 */ }

  // ───────────────────────────────────────────────────────────
  // SELECTION + INSPECTOR (TASK 5.x)
  // ───────────────────────────────────────────────────────────

  function _selectDevice(id) { /* TASK 5.1 */ }
  function _deleteSelected() { /* TASK 5.3 */ }
  function _renderInspector() { /* TASK 5.4 */ }

  // ───────────────────────────────────────────────────────────
  // MODE BAR + INTENT CHIP (TASK 7.x)
  // ───────────────────────────────────────────────────────────

  function _renderModeBar() { /* TASK 7.1 */ }

  // ───────────────────────────────────────────────────────────
  // EXPORT (TASK 8.x)
  // ───────────────────────────────────────────────────────────

  function _exportPng() { /* TASK 8.1 */ }

  // Register on the standard feature-modules contract
  window._certanvilFeatures = window._certanvilFeatures || {};
  window._certanvilFeatures['topology-builder-v3'] = {
    // Entry
    openTopologyBuilderV3: openTopologyBuilderV3,
    // Pure (exposed for testing)
    buildDevice: buildDevice,
    buildCable: buildCable,
    serialiseState: serialiseState,
    parseState: parseState,
    // State access (for tests)
    _getState: function () { return state; },
    _setState: function (s) { state = s; },
  };

  // Also expose openTopologyBuilderV3 directly on window for the sidebar handler
  window.openTopologyBuilderV3 = openTopologyBuilderV3;
})();
