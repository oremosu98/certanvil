/* ============================================================
   Knowledge Constellation — shared base renderer
   Deterministic: every mockup gets the EXACT same node field,
   so you're critiquing MOTION, not layout differences.

   Exposes window.Constellation:
     .nodes    -> [{el, gEl, coreEl, haloEl, cx, cy, r, innerR,
                    mastery, attempts, domain, tier, topic}]
     .clusters -> {idx, cx, cy, name, kicker}
     .svg, .map (DOM refs)
     .W, .H
   Call Constellation.render('#mount') then layer your animation.
   ============================================================ */
(function () {
  const W = 1000, H = 440;
  const SVGNS = 'http://www.w3.org/2000/svg';

  const DOMAINS = [
    { idx: 1, cx: W * 0.18, cy: H * 0.38, kicker: 'DOMAIN 1', name: 'Networking Concepts' },
    { idx: 2, cx: W * 0.42, cy: H * 0.70, kicker: 'DOMAIN 2', name: 'Network Implementation' },
    { idx: 3, cx: W * 0.57, cy: H * 0.26, kicker: 'DOMAIN 3', name: 'Network Operations' },
    { idx: 4, cx: W * 0.78, cy: H * 0.62, kicker: 'DOMAIN 4', name: 'Network Security' },
    { idx: 5, cx: W * 0.92, cy: H * 0.30, kicker: 'DOMAIN 5', name: 'Network Troubleshooting' },
  ];

  const TOPIC_NAMES = [
    'OSI Model', 'TCP/IP Suite', 'Ports & Protocols', 'IP Addressing', 'Subnetting',
    'Cabling & Media', 'Network Topologies', 'Cloud Models', 'Ethernet Switching', 'Routing Fundamentals',
    'VLANs & Trunking', 'Wireless Standards', 'Network Services', 'DHCP & DNS', 'NAT & PAT',
    'IPv6 Concepts', 'SDN Basics', 'Load Balancing', 'Network Monitoring', 'SNMP & Logging',
    'QoS & Traffic Shaping', 'Documentation', 'Change Management', 'High Availability', 'Disaster Recovery',
    'Firewalls', 'VPN & Tunneling', 'Access Control', 'Network Hardening', 'Threat Vectors',
    'Authentication', 'Encryption Basics', 'Wireless Security', 'Physical Security', 'Zero Trust',
    'Cable Testing', 'Connectivity Issues', 'Latency & Jitter', 'Hardware Faults', 'Software Tools',
    'Command Line', 'Packet Capture', 'DNS Troubleshooting', 'Routing Issues', 'Performance Tuning',
    'Interface Errors', 'Spanning Tree', 'Network Baselines', 'Wireless Survey', 'Escalation',
  ];

  // seeded PRNG (mulberry32) — deterministic field every load
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(20260604);

  // build 50 topics: 10 per domain, varied attempts + mastery
  // realistic spread: some mastered, some developing, ~40% unstudied
  function buildData() {
    const out = [];
    for (let d = 0; d < 5; d++) {
      for (let k = 0; k < 10; k++) {
        const roll = rand();
        let attempts, mastery;
        if (roll < 0.40) { attempts = 0; mastery = 0; }            // unstudied
        else if (roll < 0.62) { attempts = 2 + Math.floor(rand() * 6);  mastery = 25 + rand() * 28; }
        else if (roll < 0.82) { attempts = 6 + Math.floor(rand() * 14); mastery = 55 + rand() * 18; }
        else if (roll < 0.94) { attempts = 14 + Math.floor(rand() * 22); mastery = 72 + rand() * 10; }
        else { attempts = 28 + Math.floor(rand() * 40); mastery = 82 + rand() * 16; }

        let tier = 'unstudied';
        if (attempts > 0) {
          if (mastery >= 80) tier = 'mastered';
          else if (mastery >= 70) tier = 'proficient';
          else if (mastery >= 55) tier = 'developing';
          else tier = 'novice';
        }
        out.push({
          domainIdx: d + 1,
          topic: TOPIC_NAMES[d * 10 + k],
          attempts, mastery: Math.round(mastery), tier,
          _i: k,
        });
      }
    }
    return out;
  }

  function el(tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function render(mountSel) {
    const mount = document.querySelector(mountSel);
    const data = buildData();

    const map = document.createElement('div');
    map.className = 'const-map';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Knowledge constellation' });

    // grid
    const grid = el('g', { class: 'const-grid' });
    for (let x = 0; x <= W; x += 100) grid.appendChild(el('line', { x1: x, y1: 0, x2: x, y2: H }));
    for (let y = 0; y <= H; y += 80) grid.appendChild(el('line', { x1: 0, y1: y, x2: W, y2: y }));
    svg.appendChild(grid);

    // layers
    const tetherLayer = el('g', { class: 'const-tether-layer' });
    const edgeLayer = el('g', { class: 'const-edge-layer' }); // for line/connection mockups
    const nodeLayer = el('g', { class: 'const-node-layer' });
    const labelLayer = el('g', { class: 'const-label-layer' });
    svg.appendChild(tetherLayer);
    svg.appendChild(edgeLayer);
    svg.appendChild(nodeLayer);
    svg.appendChild(labelLayer);

    const clusters = {};
    DOMAINS.forEach(D => { clusters[D.idx] = D; });

    // labels
    DOMAINS.forEach(D => {
      const g = el('g', { class: 'const-cluster-label' });
      const kx = D.cx, ky = D.cy - 118;
      const k = el('text', { x: kx, y: ky, 'text-anchor': 'middle', class: 'kicker' });
      k.textContent = D.kicker;
      const n = el('text', { x: kx, y: ky + 16, 'text-anchor': 'middle', class: 'name' });
      n.textContent = D.name;
      g.appendChild(k); g.appendChild(n);
      labelLayer.appendChild(g);
    });

    // nodes via golden-angle spiral (mirrors app.js)
    const nodes = [];
    const byDomain = {};
    data.forEach(d => { (byDomain[d.domainIdx] = byDomain[d.domainIdx] || []).push(d); });

    Object.entries(byDomain).forEach(([dom, topics]) => {
      const c = clusters[dom];
      topics.forEach((t, i) => {
        const angle = (i * 2.399) + (c.idx * 0.7);
        const baseDist = 42 + (i % 4) * 20;
        const cx = c.cx + Math.cos(angle) * baseDist;
        const cy = c.cy + Math.sin(angle) * baseDist;
        const r = t.attempts > 0 ? Math.min(22, 6 + Math.sqrt(t.attempts) * 2.2) : 5;
        const w = (t.mastery || 0) / 100;
        const innerR = Math.max(2, r * w + 2);

        const g = el('g', {
          class: 'const-node',
          'data-domain': c.idx,
          'data-tier': t.tier,
          tabindex: 0,
          'aria-label': `${t.topic}: ${t.mastery}% mastery, ${t.attempts} attempts`,
        });
        const halo = el('circle', { cx, cy, r, class: 'const-halo' });
        const core = el('circle', { cx, cy, r: innerR, class: 'const-core' });
        g.appendChild(halo); g.appendChild(core);

        // faint tether from cluster center
        const tether = el('line', { x1: c.cx, y1: c.cy, x2: cx, y2: cy, class: 'const-tether' });
        tetherLayer.appendChild(tether);

        nodeLayer.appendChild(g);
        nodes.push({
          gEl: g, haloEl: halo, coreEl: core, tetherEl: tether,
          cx, cy, r, innerR, mastery: t.mastery, attempts: t.attempts,
          domain: c.idx, tier: t.tier, topic: t.topic, _i: i,
        });
      });
    });

    map.appendChild(svg);

    // tooltip
    const tt = document.createElement('div');
    tt.className = 'const-tt';
    map.appendChild(tt);

    function showTip(n, evt) {
      tt.innerHTML = `<b>${n.topic}</b><br><span class="tt-meta">${n.mastery}% mastery · ${n.attempts} attempt${n.attempts === 1 ? '' : 's'}</span>`;
      const rect = map.getBoundingClientRect();
      const sx = (n.cx / W) * rect.width;
      const sy = (n.cy / H) * rect.height;
      tt.style.left = Math.min(rect.width - 150, Math.max(8, sx + 12)) + 'px';
      tt.style.top = Math.max(6, sy - 46) + 'px';
      tt.classList.add('show');
    }
    function hideTip() { tt.classList.remove('show'); }

    nodes.forEach(n => {
      n.gEl.addEventListener('pointerenter', e => showTip(n, e));
      n.gEl.addEventListener('pointerleave', hideTip);
      n.gEl.addEventListener('focus', e => showTip(n, e));
      n.gEl.addEventListener('blur', hideTip);
    });

    mount.appendChild(map);

    window.Constellation = {
      nodes, clusters, svg, map, tt,
      W, H,
      layers: { tether: tetherLayer, edge: edgeLayer, node: nodeLayer, label: labelLayer },
      showTip, hideTip, el,
    };
    return window.Constellation;
  }

  window.Constellation = { render };
})();
