// ══════════════════════════════════════════
// PBQ RENDER HELPERS — features/pbq.js
// ══════════════════════════════════════════
// #138-aligned extraction (v8.2.0). Stateless render/compute helpers for the
// inline PBQ types, lifted out of app.js byte-identical (only re-indented two
// spaces for the IIFE, per the extraction protocol).
//
// WHAT IS NOT HERE, AND WHY. The rest of the PBQ surface stays in app.js:
// renderHotArea, _haPickRegion, submitHotArea, _haRegionIsCorrect,
// _restoreAnsweredHotAreaState, renderCliSim, renderTopology, renderTopoState
// and submitTopology all read — and several WRITE — app.js's top-level `let`
// quiz state (score, streak, log, answered, bestStreak, quizFlags, questions,
// topoDevices, _hotAreaPick). Those bindings are let-declared, so they never
// attach to window; moving their readers into an IIFE is exactly the
// closure-captive class that produced the v7.79.2 Hot-Area scoring bug and the
// v7.96.0/v7.97.0 ReferenceError fixes. Rewriting them to route through an
// accessor is issue #21 (wrap globals in state objects), which is saas-gated
// and frozen. So only the genuinely stateless helpers moved.
//
// Everything here is window-exposed: all callers are in app.js, i.e. across
// the module boundary.
(function () {
  'use strict';

  function _renderHotAreaTopology(q, box) {
    const stage = document.createElement('div');
    stage.className = 'hot-area-stage';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'hot-area-svg');
    svg.setAttribute('viewBox', q.svgViewBox || '0 0 600 200');

    // Background connectors (non-clickable lines)
    (q.svgConnectors || []).forEach(c => {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', c.x1); line.setAttribute('y1', c.y1);
      line.setAttribute('x2', c.x2); line.setAttribute('y2', c.y2);
      line.setAttribute('class', 'hot-area-connector');
      svg.appendChild(line);
    });

    // Regions (clickable groups)
    (q.regions || []).forEach(r => {
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', 'hot-region');
      g.setAttribute('data-region', r.id);
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', r.label);
      g.onclick = () => _haPickRegion(r.id);
      g.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _haPickRegion(r.id); } };

      if (r.shape === 'circle') {
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', r.cx); circle.setAttribute('cy', r.cy); circle.setAttribute('r', r.r);
        g.appendChild(circle);
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', r.cx); text.setAttribute('y', r.cy + 4);
        text.textContent = r.label;
        g.appendChild(text);
      } else {
        // default: rect
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', r.x); rect.setAttribute('y', r.y);
        rect.setAttribute('width', r.w); rect.setAttribute('height', r.h);
        rect.setAttribute('rx', '6');
        g.appendChild(rect);
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', r.x + r.w / 2); text.setAttribute('y', r.y + r.h / 2 + 4);
        text.textContent = r.label;
        g.appendChild(text);
      }
      svg.appendChild(g);
    });

    stage.appendChild(svg);
    box.appendChild(stage);
  }

  function _renderHotAreaOsi(q, box) {
    const stage = document.createElement('div');
    stage.className = 'hot-area-stage';
    const stack = document.createElement('div');
    stack.className = 'osi-stack';
    const layers = [
      { id: 'L7', name: 'Application' },
      { id: 'L6', name: 'Presentation' },
      { id: 'L5', name: 'Session' },
      { id: 'L4', name: 'Transport' },
      { id: 'L3', name: 'Network' },
      { id: 'L2', name: 'Data Link' },
      { id: 'L1', name: 'Physical' }
    ];
    layers.forEach(l => {
      const div = document.createElement('div');
      div.className = 'osi-layer';
      div.setAttribute('data-region', l.id);
      div.setAttribute('tabindex', '0');
      div.setAttribute('role', 'button');
      div.setAttribute('aria-label', l.id + ' ' + l.name);
      div.innerHTML = '<span><span class="osi-layer-num">' + l.id + '</span> · <span class="osi-layer-name">' + l.name + '</span></span>';
      div.onclick = () => _haPickRegion(l.id);
      div.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _haPickRegion(l.id); } };
      stack.appendChild(div);
    });
    stage.appendChild(stack);
    box.appendChild(stage);
  }

  function _renderHotAreaCableGrid(q, box) {
    const stage = document.createElement('div');
    stage.className = 'hot-area-stage';
    const grid = document.createElement('div');
    grid.className = 'cable-grid';
    (q.cables || []).forEach(c => {
      const conn = CABLE_CONNECTORS[c.id];
      if (!conn) return;
      const card = document.createElement('div');
      card.className = 'cable-card';
      card.setAttribute('data-region', c.id);
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', conn.label);
      card.innerHTML = '<div class="cable-icon">' + conn.svg + '</div><div class="cable-name">' + escHtml(conn.label) + '</div>';
      card.onclick = () => _haPickRegion(c.id);
      card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _haPickRegion(c.id); } };
      grid.appendChild(card);
    });
    stage.appendChild(grid);
    box.appendChild(stage);
  }

  function _haCorrectRegionIds(q) {
    if (q.subShape === 'topology') {
      return (q.regions || []).filter(r => r.isCorrect).map(r => r.id);
    } else if (q.subShape === 'osi') {
      return q.correctLayers || [];
    } else if (q.subShape === 'cable-grid') {
      return (q.cables || []).filter(c => c.isCorrect).map(c => c.id);
    }
    return [];
  }

  function runCliCommand(cmd, q) {
    const terminal = document.getElementById('cli-terminal');
    if (!terminal) return;
    const output = (q.commands || {})[cmd] || 'Command not recognized.';
    const hn = escHtml(q.hostname || 'PC');
    terminal.querySelectorAll('.cli-cursor').forEach(c => c.remove());

    const cmdLine = document.createElement('div');
    cmdLine.className = 'cli-line';
    cmdLine.innerHTML = '<span class="cli-prompt-text">' + hn + '&gt; </span>' + escHtml(cmd);
    terminal.appendChild(cmdLine);

    const outputEl = document.createElement('pre');
    outputEl.className = 'cli-output';
    outputEl.textContent = output;
    terminal.appendChild(outputEl);

    const newPrompt = document.createElement('div');
    newPrompt.className = 'cli-prompt';
    newPrompt.innerHTML = hn + '&gt; <span class="cli-cursor">_</span>';
    terminal.appendChild(newPrompt);
    terminal.scrollTop = terminal.scrollHeight;

    const diag = document.getElementById('cli-diagnosis');
    if (diag) diag.classList.remove('is-hidden');
  }

  // ── window exposure ──────────────────────────────────────────────────────
  // Every one of these is called from app.js, which is now across a module
  // boundary. Without the exposure each call is a bare-identifier
  // ReferenceError — the v7.79.2 / v7.97.0 failure mode, silent except for
  // window.onerror. UAT's closure-captive guards cover this.
  window._renderHotAreaTopology  = _renderHotAreaTopology;
  window._renderHotAreaOsi       = _renderHotAreaOsi;
  window._renderHotAreaCableGrid = _renderHotAreaCableGrid;
  window._haCorrectRegionIds     = _haCorrectRegionIds;
  window.runCliCommand           = runCliCommand;

  window._certanvilFeatures = window._certanvilFeatures || {};
  window._certanvilFeatures['pbq'] = {
    _renderHotAreaTopology: _renderHotAreaTopology,
    _renderHotAreaOsi: _renderHotAreaOsi,
    _renderHotAreaCableGrid: _renderHotAreaCableGrid,
    _haCorrectRegionIds: _haCorrectRegionIds,
    runCliCommand: runCliCommand
  };
})();
