// ════════════════════════════════════════════════════════════════════
// features/topology-builder-v2.js — Topology Builder V2 shell
// ════════════════════════════════════════════════════════════════════
//
// Ground-up rebuild of the Network Builder UI to the locked mockups:
// · mockups/network-builder-revamp-concept.html (canvas bible)
// · mockups/network-builder-modes-concept.html (modes bible)
//
// Ship #1: Visual shell — layout, modebar, palette, scenario rail.
// The existing TB engine (tbState, simulation, grading, AI) will be
// wired incrementally in subsequent ships. For now, this is a static
// visual shell that proves the mockup translates to production.
//
// ARCHITECTURE:
// · V2 has its own render layer (this file) + CSS (topology-builder-v2.css)
// · V2 calls into the existing TB engine functions (window-exposed)
//   for state management — no state duplication
// · V1 stays live as fallback until V2 is feature-complete
// · V2 lazy-loads via _loadFeature('topology-builder-v2')
// ════════════════════════════════════════════════════════════════════

(function() {
  "use strict";

  // ── CSS injection (one-shot) ──────────────────────────────────────
  let _cssLoaded = false;
  function _ensureCss() {
    if (_cssLoaded) return;
    _cssLoaded = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/features/topology-builder-v2.css';
    document.head.appendChild(link);
  }

  // ── Device palette data ───────────────────────────────────────────
  // Mirrors the mockup's categorized device list. Each device has a
  // monoline SVG icon (matching tbPaletteLineIcon from V1 + the locked
  // mockup's exact icon paths).
  const PALETTE = [
    { cat: 'Infrastructure', devices: [
      { type: 'router',     label: 'Router',       icon: '<rect x="3" y="9" width="18" height="6" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="7" cy="12" r="1" fill="currentColor"/><circle cx="11" cy="12" r="1" fill="currentColor"/>' },
      { type: 'switch',     label: 'Switch',       icon: '<rect x="3" y="9" width="18" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M7 9V6M11 9V6M15 9V6M19 9V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { type: 'firewall',   label: 'Firewall',     icon: '<rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 10h14M9 4v6M15 4v6" stroke="currentColor" stroke-width="1.3"/>' },
      { type: 'wap',        label: 'Access Point',  icon: '<path d="M12 3c3 2 6 5 6 9a6 6 0 0 1-12 0c0-4 3-7 6-9z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="13" r="2" stroke="currentColor" stroke-width="1.5"/>' },
      { type: 'ids',        label: 'IDS / IPS',    icon: '<rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M12 9v4M10 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { type: 'load-balancer', label: 'Load Balancer', icon: '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
    ]},
    { cat: 'Endpoints', devices: [
      { type: 'pc',         label: 'PC',           icon: '<rect x="4" y="4" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 20h8M12 16v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { type: 'server',     label: 'Server',       icon: '<rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M3 7h18M7 17h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { type: 'laptop',     label: 'Laptop',       icon: '<rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M10 18h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { type: 'printer',    label: 'Printer',      icon: '<rect x="6" y="10" width="12" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M6 14H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2M8 4h8v4H8z" stroke="currentColor" stroke-width="1.5"/>' },
      { type: 'voip',       label: 'VoIP Phone',   icon: '<rect x="5" y="6" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M9 10h6M9 13h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' },
      { type: 'iot',        label: 'IoT Device',   icon: '<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' },
    ]},
    { cat: 'Cloud', devices: [
      { type: 'cloud',      label: 'Cloud',        icon: '<path d="M6 18h12a4 4 0 0 0 0-8 5 5 0 0 0-10 0 3 3 0 0 0 0 6" stroke="currentColor" stroke-width="1.5" fill="none"/>' },
      { type: 'vpc',        label: 'VPC',          icon: '<rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 2"/>' },
      { type: 'igw',        label: 'Internet GW',  icon: '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M4 12h16M12 4c2 2.7 3 5.3 3 8s-1 5.3-3 8c-2-2.7-3-5.3-3-8s1-5.3 3-8z" stroke="currentColor" stroke-width="1.3"/>' },
      { type: 'isp-router', label: 'ISP Router',   icon: '<rect x="3" y="9" width="18" height="6" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 9V5M17 9V5M7 5h10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' },
    ]},
  ];

  // ── Modebar pills ─────────────────────────────────────────────────
  // SVG paths from the locked mockup (network-builder-revamp-concept.html)
  const MODES = [
    { id: 'design',   label: 'Design',   icon: '<path d="M4 20l4-1L19 8a2.8 2.8 0 0 0-4-4L4 15l-1 4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' },
    { id: 'simulate', label: 'Simulate', icon: '<path d="M8 5v14l11-7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' },
    { id: 'trace',    label: 'Trace',    icon: '<path d="M4 12h5l2-5 4 10 2-5h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' },
    { id: 'labs',     label: 'Labs',     icon: '<path d="M9 3v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V3" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' },
    { id: 'threed',   label: '3D',       icon: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>' },
    { id: '_sep' },
    { id: 'coach',    label: 'Coach',    icon: '<circle cx="12" cy="9" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
    { id: 'grade',    label: 'Grade',    icon: '<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' },
    { id: 'export',   label: 'Export',   icon: '<path d="M12 4v10M8 10l4 4 4-4M5 20h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' },
  ];

  // ── Scenario categories (static for shell — will read TB_SCENARIOS later) ──
  const SCENARIO_GROUPS = [
    { label: 'Sandbox', rows: [
      { name: 'Free Build', meta: 'any', active: true },
    ]},
    { label: 'Campus', count: 5, rows: [
      { name: 'Home network', meta: '7 dev' },
      { name: 'Small office', meta: '7 dev' },
      { name: 'DMZ with screened subnet', meta: '9 dev' },
      { name: 'Enterprise with IDS', meta: '12 dev' },
      { name: 'Branch office', meta: '11 dev' },
    ]},
    { label: 'WAN', count: 4, rows: [
      { name: 'Leased line', meta: '8 dev' },
      { name: 'Hub and spoke', meta: '13 dev' },
      { name: 'Full mesh', meta: '12 dev' },
      { name: 'SD-WAN', meta: '12 dev' },
    ]},
  ];

  // ── Active mode state ─────────────────────────────────────────────
  let _activeMode = 'design';

  // ── Escaping ──────────────────────────────────────────────────────
  function _esc(s) {
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  // ── Build the palette HTML ────────────────────────────────────────
  function _renderPalette(el) {
    let html = '';
    for (const cat of PALETTE) {
      html += '<div class="cat">';
      html += '<div class="cat-h">' + _esc(cat.cat) + '</div>';
      for (const dev of cat.devices) {
        html += '<button class="dev-btn" type="button" data-type="' + _esc(dev.type) + '">'
          + '<svg viewBox="0 0 24 24" fill="none">' + dev.icon + '</svg>'
          + _esc(dev.label)
          + '</button>';
      }
      html += '</div>';
    }
    // Cable type section
    html += '<div class="cable-section">';
    html += '<h3>Cable type</h3>';
    html += '<button class="cable-chip on" data-cable="cat6"><span class="dot"></span>Cat6</button>';
    html += '<button class="cable-chip" data-cable="fiber"><span class="dot"></span>Fiber</button>';
    html += '<button class="cable-chip" data-cable="coax"><span class="dot"></span>Coax</button>';
    html += '<button class="cable-chip" data-cable="console"><span class="dot"></span>Console</button>';
    html += '</div>';
    el.innerHTML = html;
  }

  // ── Build the modebar HTML ────────────────────────────────────────
  function _renderModebar(el) {
    let html = '';
    for (const m of MODES) {
      if (m.id === '_sep') {
        html += '<span class="mb-sep"></span>';
        continue;
      }
      const cls = m.id === _activeMode ? ' on' : '';
      html += '<button class="mb' + cls + '" type="button" data-mode="' + m.id + '">'
        + '<svg viewBox="0 0 24 24" fill="none">' + m.icon + '</svg>'
        + _esc(m.label)
        + '</button>';
    }
    el.innerHTML = html;
  }

  // ── Build the scenario rail HTML ──────────────────────────────────
  function _renderScenarios(el) {
    let html = '<div class="palette-head"><h2>Scenarios</h2><p>Select to auto-populate.</p></div>';
    html += '<div class="scn">';
    for (const g of SCENARIO_GROUPS) {
      html += '<div class="scn-g">';
      html += '<div class="scn-gh">' + _esc(g.label);
      if (g.count) html += ' <span class="n">' + g.count + '</span>';
      html += '</div>';
      for (const r of g.rows) {
        const cls = r.active ? ' on' : '';
        html += '<button class="scn-row' + cls + '" type="button">'
          + '<span>' + _esc(r.name) + '</span>'
          + '<span class="dv">' + _esc(r.meta) + '</span>'
          + '</button>';
      }
      html += '</div>';
    }
    html += '</div>';
    el.innerHTML = html;
  }

  // ── Build the empty-state canvas ──────────────────────────────────
  function _renderEmptyState(canvasEl) {
    const el = document.createElement('div');
    el.className = 'empty-state';
    el.id = 'tbv2-empty';
    el.innerHTML = '<div class="empty-card">'
      + '<div class="empty-title">Start building</div>'
      + '<div class="empty-sub">Drag a device from the palette, select a scenario, or generate with AI.</div>'
      + '<div style="display:flex;gap:8px;justify-content:center;">'
      + '<button class="empty-btn primary" type="button">AI Generate</button>'
      + '<button class="empty-btn" type="button">Pick scenario</button>'
      + '</div>'
      + '<div class="empty-kbd"><kbd>D</kbd> to add device  ·  <kbd>C</kbd> to connect</div>'
      + '</div>';
    canvasEl.appendChild(el);
  }

  // ── Mode switching ────────────────────────────────────────────────
  function _setMode(modeId) {
    _activeMode = modeId;
    // Update modebar active state
    var bar = document.getElementById('tbv2-modebar');
    if (bar) {
      bar.querySelectorAll('.mb').forEach(function(btn) {
        btn.classList.toggle('on', btn.dataset.mode === modeId);
      });
    }
    // Update mode label
    var label = document.getElementById('tbv2-mode-label');
    if (label) {
      var descriptions = {
        design: '<b>Design</b> mode · drag, connect, configure',
        simulate: '<b>Simulate</b> mode · run L2/L3 simulation',
        trace: '<b>Trace</b> mode · packet path analysis',
        labs: '<b>Labs</b> mode · guided topology exercises',
        threed: '<b>3D</b> mode · immersive view',
        coach: '<b>Coach</b> mode · AI topology review',
        grade: '<b>Grade</b> mode · scenario scoring',
        export: '<b>Export</b> mode · save and share',
      };
      label.innerHTML = descriptions[modeId] || '';
    }
  }
  // Expose for onclick
  window.tbv2SetMode = _setMode;

  // ── Enter / Exit ──────────────────────────────────────────────────
  function enter() {
    _ensureCss();

    var paletteList = document.getElementById('tbv2-palette-list');
    var modebar = document.getElementById('tbv2-modebar');
    var scenarioRail = document.getElementById('tbv2-scenarios');
    var canvasWrap = document.querySelector('#page-topology-v2 .canvas');

    if (paletteList) _renderPalette(paletteList);
    if (modebar) {
      _renderModebar(modebar);
      // Wire mode switching via event delegation
      modebar.addEventListener('click', function(e) {
        var btn = e.target.closest('.mb[data-mode]');
        if (btn) _setMode(btn.dataset.mode);
      });
    }
    if (scenarioRail) _renderScenarios(scenarioRail);
    if (canvasWrap) _renderEmptyState(canvasWrap);

    // Wire palette search filter
    var searchInput = document.getElementById('tbv2-palette-search');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        var q = this.value.toLowerCase().trim();
        var btns = document.querySelectorAll('#tbv2-palette-list .dev-btn');
        btns.forEach(function(btn) {
          var match = !q || btn.textContent.toLowerCase().includes(q);
          btn.style.display = match ? '' : 'none';
        });
        // Hide category headers if all children hidden
        var cats = document.querySelectorAll('#tbv2-palette-list .cat');
        cats.forEach(function(cat) {
          var visible = cat.querySelectorAll('.dev-btn:not([style*="display: none"])');
          cat.style.display = visible.length > 0 ? '' : 'none';
        });
      });
    }
  }

  function exit() {
    // Cleanup if needed when navigating away
  }

  // ── Module registration ───────────────────────────────────────────
  window._certanvilFeatures = window._certanvilFeatures || {};
  window._certanvilFeatures['topology-builder-v2'] = { enter: enter, exit: exit };

  // Expose for sidebar handler
  window.openTopologyBuilderV2 = function() { enter(); };
})();
