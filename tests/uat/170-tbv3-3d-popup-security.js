// tests/uat/170-tbv3-3d-popup-security.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: TB v3 trace/OSI mode fixtures, 3D popup + polish stages, walkthrough, v6.5.2 hotfix, security hardening phases 1-7

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ══════════════════════════════════════════
// TB v3 Phase 7 v2 — 3D popup UAT fixtures
// ══════════════════════════════════════════
(function _tbv3Phase7v2Fixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  const fs = require('fs');
  const path = require('path');
  let tbv3SrcP7v2 = "";
  try { tbv3SrcP7v2 = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }
  let tbv3CssP7v2 = "";
  try { tbv3CssP7v2 = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.css'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  // ---- Stage 1: _3dPopup state + lifecycle + pill rewire ----
  test('P7v2: _3dPopup state object defined with all fields',
    /_3dPopup\s*=\s*\{[\s\S]{0,400}open:\s*false[\s\S]{0,400}camera:[\s\S]{0,200}rotX[\s\S]{0,200}rotY[\s\S]{0,200}zoom[\s\S]{0,400}dragState/.test(tbv3SrcP7v2)
  );
  test('P7v2: _open3DPopup is defined',
    /function\s+_open3DPopup\s*\(/.test(tbv3SrcP7v2)
  );
  test('P7v2: _close3DPopup is defined',
    /function\s+_close3DPopup\s*\(/.test(tbv3SrcP7v2)
  );
  test('P7v2: 3D modebar pill unlocked (locked:false)',
    /id:\s*['"]3d['"][\s\S]{0,400}locked:\s*false/.test(tbv3SrcP7v2)
  );
  test('P7v2: modebar wires 3d click to _open3DPopup (NOT _open3D)',
    /mode\s*===\s*['"]3d['"][\s\S]{0,100}_open3DPopup\s*\(/.test(tbv3SrcP7v2) &&
    !/mode\s*===\s*['"]3d['"][\s\S]{0,100}_open3D\s*\(\s*\)/.test(tbv3SrcP7v2.replace(/_open3DPopup/g, 'XX'))
  );

  // ---- Stage 2: modal DOM + chrome CSS ----
  test('P7v2: _open3DPopup creates modal with role=dialog + aria-modal',
    /_open3DPopup[\s\S]{0,1500}role['"]?\s*,\s*['"]dialog['"][\s\S]{0,200}aria-modal['"]?\s*,\s*['"]true['"]/.test(tbv3SrcP7v2)
  );
  test('P7v2: modal chrome CSS defines tb3-3d-popup-modal positioning above builder stacking context',
    /\.tb3-3d-popup-modal\s*\{[\s\S]{0,800}position:\s*fixed[\s\S]{0,400}z-index:\s*10001/.test(tbv3CssP7v2)
  );
  test('P7v2: modal card has the spec-cream background + bronze shadow',
    /\.tb3-3d-popup-card[\s\S]{0,800}background:\s*var\(--tb3-cream/.test(tbv3CssP7v2)
  );
  test('P7v2: _apply3DCamera writes transform to stage',
    /function\s+_apply3DCamera[\s\S]{0,400}getElementById\(['"]tb3-3d-popup-stage['"]\)[\s\S]{0,400}transform[\s\S]{0,200}rotateX/.test(tbv3SrcP7v2)
  );

  // ---- Stage 3: device extruded cards ----
  test('P7v2: _render3DScene is defined',
    /function\s+_render3DScene\s*\(/.test(tbv3SrcP7v2)
  );
  test('P7v2: _build3DDeviceEl emits 5-face extruded card structure',
    /function\s+_build3DDeviceEl[\s\S]{0,3500}tb3-3d-dev-top[\s\S]{0,200}tb3-3d-dev-bottom[\s\S]{0,200}tb3-3d-dev-side-n[\s\S]{0,200}tb3-3d-dev-side-s[\s\S]{0,200}tb3-3d-dev-side-e[\s\S]{0,200}tb3-3d-dev-side-w/.test(tbv3SrcP7v2)
  );
  test('P7v2: top face uses 135deg gradient (light from upper-left)',
    /\.tb3-3d-dev-top[\s\S]{0,400}linear-gradient\(\s*135deg/.test(tbv3CssP7v2)
  );
  test('P7v2: device drop-shadow offset matches light direction',
    /\.tb3-3d-dev\s*\{[\s\S]{0,200}drop-shadow\(8px\s+14px\s+16px/.test(tbv3CssP7v2)
  );
  test('P7v2: _render3DScene updates header counts + viewport aria-label',
    /function\s+_render3DScene[\s\S]{0,2000}\.tb3-3d-popup-counts[\s\S]{0,400}aria-label[\s\S]{0,300}rotate/.test(tbv3SrcP7v2)
  );

  // ---- Stage 4: cables + floor ----
  test('P7v2: _build3DCableEl creates SVG with bezier path + gradient',
    /function\s+_build3DCableEl[\s\S]{0,2500}createElementNS[\s\S]{0,800}linearGradient[\s\S]{0,500}createElementNS[\s\S]{0,800}path/.test(tbv3SrcP7v2)
  );
  test('P7v2: cables sit at translateZ(0) (table plane)',
    /_build3DCableEl[\s\S]{0,3000}transform\s*=\s*['"]translateZ\(0\)['"]/.test(tbv3SrcP7v2)
  );
  test('P7v2: floor uses rotateX(90deg) + radial gradient vignette',
    /\.tb3-3d-floor[\s\S]{0,800}rotateX\(90deg\)[\s\S]{0,1600}radial-gradient/.test(tbv3CssP7v2)
  );

  // ---- Stage 5: drag + zoom + momentum + animations ----
  test('P7v2: _attach3DInputListeners wires mousedown/mousemove/mouseup/wheel/dblclick',
    /function\s+_attach3DInputListeners[\s\S]{0,1500}mousedown[\s\S]{0,500}mousemove[\s\S]{0,500}mouseup[\s\S]{0,500}wheel[\s\S]{0,500}dblclick/.test(tbv3SrcP7v2)
  );
  test('P7v2: drag rotates camera with rotX clamped [15, 75]',
    /_on3DPopupMouseMove[\s\S]{0,800}_clamp3D[\s\S]{0,80}15[\s\S]{0,80}75/.test(tbv3SrcP7v2)
  );
  test('P7v2: momentum decay 0.92 (emil-tuned, less floaty than 0.94)',
    /_start3DMomentumDecay[\s\S]{0,800}velocityX\s*\*=\s*0\.92/.test(tbv3SrcP7v2)
  );
  test('P7v2: wheel zoom clamped [0.5, 2.0]',
    /_on3DPopupWheel[\s\S]{0,500}_clamp3D[\s\S]{0,80}0\.5[\s\S]{0,80}2(\.0)?/.test(tbv3SrcP7v2)
  );

  // ---- Stage 6: live sync + keyboard nav ----
  test('P7v2: _renderCanvas calls _render3DScene when popup is open',
    /function\s+_renderCanvas[\s\S]{0,8000}if\s*\(\s*_3dPopup\.open\s*\)\s*_render3DScene\s*\(\s*\)/.test(tbv3SrcP7v2)
  );
  test('P7v2: keyboard nav covers Esc + ArrowLeft/Right/Up/Down + plus/minus + R',
    /_on3DPopupKeyDown[\s\S]{0,2500}ArrowLeft[\s\S]{0,300}ArrowRight[\s\S]{0,300}ArrowUp[\s\S]{0,300}ArrowDown[\s\S]{0,500}['"]\+['"][\s\S]{0,500}['"]-['"][\s\S]{0,500}['"][rR]['"]/.test(tbv3SrcP7v2)
  );

  // ---- Stage 7: reduced-motion + a11y ----
  test('P7v2: @media prefers-reduced-motion disables popup transitions',
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]{0,800}\.tb3-3d-popup-modal[\s\S]{0,200}transition:\s*none/.test(tbv3CssP7v2)
  );
  test('P7v2: _on3DPopupMouseUp respects reduced-motion (no momentum)',
    /function\s+_on3DPopupMouseUp[\s\S]{0,600}_3dPopupReducedMotion\s*\(\s*\)\s*\)\s*return/.test(tbv3SrcP7v2)
  );
  test('P7v2: focus trap pulls escaped focus back to close button',
    /_on3DPopupFocusIn[\s\S]{0,500}modal\.contains[\s\S]{0,200}tb3-3d-popup-close-btn[\s\S]{0,80}\.focus/.test(tbv3SrcP7v2)
  );

})();

(function _tbv3V1ParityFixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  const fs = require('fs');
  const path = require('path');
  let tbv3SrcV1P = "";
  try { tbv3SrcV1P = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  test('V1P: TB_V3_DEVICE_TYPES uses V1 id wap (not ap)',
    /TB_V3_DEVICE_TYPES[\s\S]{0,3000}'wap':\s*\{[\s\S]{0,200}label:\s*'WAP'/.test(tbv3SrcV1P) &&
    !/'ap':\s*\{[\s\S]{0,80}label:\s*'Access Point'/.test(tbv3SrcV1P)
  );
  test('V1P: TB_V3_DEVICE_TYPES uses V1 id pc (not workstation)',
    /'pc':\s*\{[\s\S]{0,80}label:\s*'PC'/.test(tbv3SrcV1P) &&
    !/'workstation':\s*\{[\s\S]{0,80}label:\s*'Workstation'/.test(tbv3SrcV1P)
  );
  test('V1P: TB_V3_DEVICE_TYPES uses V1 id ids (not ids-ips)',
    /'ids':\s*\{[\s\S]{0,80}label:\s*'IDS\/IPS'/.test(tbv3SrcV1P)
  );
  test('V1P: TB_V3_DEVICE_TYPES uses V1 id vpg (not vpn-gateway)',
    /'vpg':\s*\{[\s\S]{0,80}label:\s*'VPN Gateway'/.test(tbv3SrcV1P)
  );
  test('V1P: TB_V3_DEVICE_TYPES uses V1 id isp-router (not isp-modem)',
    /'isp-router':\s*\{[\s\S]{0,80}label:\s*'ISP Router'/.test(tbv3SrcV1P)
  );
  test('V1P: _V1_TYPE_RENAMES migration map defined',
    /_V1_TYPE_RENAMES\s*=\s*\{[\s\S]{0,400}'ap':\s*'wap'[\s\S]{0,400}'workstation':\s*'pc'/.test(tbv3SrcV1P)
  );
  test('V1P: _migrateStateTypesToV1 is defined',
    /function\s+_migrateStateTypesToV1\s*\(/.test(tbv3SrcV1P)
  );
  // Stage 2 V1-parity guards
  test('V1P Stage2: TB_V3_DEVICE_TYPES includes all 16 new device type ids',
    ['dmz-switch','printer','voip','iot','public-web','public-file','public-cloud',
     'vpc','cloud-subnet','igw','nat-gw','tgw','onprem-dc','sase-edge','dns-server','bridge']
      .every(id => new RegExp("'" + id + "'\\s*:\\s*\\{").test(tbv3SrcV1P))
  );
  test('V1P Stage2: TB_V3_PALETTE_GROUPS includes Public Cloud group with igw and tgw',
    /name:\s*'Public Cloud'[\s\S]{0,300}'igw'[\s\S]{0,100}'tgw'/.test(tbv3SrcV1P)
  );
  test('V1P Stage2: _autoFillIp ENDPOINT_TYPES includes new endpoint device types',
    /ENDPOINT_TYPES\s*=\s*\[[\s\S]{0,200}'printer'[\s\S]{0,100}'voip'[\s\S]{0,100}'iot'[\s\S]{0,100}'dns-server'/.test(tbv3SrcV1P)
  );
  // ---- Stage 2 follow-up: inspector ENDPOINT_TYPES includes new endpoint types ----
  test('V1P: inspector ENDPOINT_TYPES includes printer/voip/iot/dns-server',
    (function() {
      // Match the SECOND ENDPOINT_TYPES (inside _renderInspector around line 2633)
      // The first one is _autoFillIp's earlier in the file.
      var matches = tbv3SrcV1P.match(/var\s+ENDPOINT_TYPES\s*=\s*\[[^\]]+\]/g) || [];
      if (matches.length < 2) return false;
      var inspectorArr = matches[1];
      return /'printer'/.test(inspectorArr) &&
             /'voip'/.test(inspectorArr) &&
             /'iot'/.test(inspectorArr) &&
             /'dns-server'/.test(inspectorArr);
    })()
  );

  // ---- Stage 3: 16 ported V1 scenarios ----
  test('V1P: ported V1 scenarios present in TB_V3_SCENARIOS',
    /id:\s*'small-office'/.test(tbv3SrcV1P) &&
    /id:\s*'enterprise-ids-lb'/.test(tbv3SrcV1P) &&
    /id:\s*'branch-office-wireless'/.test(tbv3SrcV1P) &&
    /id:\s*'home-network'/.test(tbv3SrcV1P) &&
    /id:\s*'cloud-vpc-architecture'/.test(tbv3SrcV1P) &&
    /id:\s*'multi-vpc-transit-gateway'/.test(tbv3SrcV1P) &&
    /id:\s*'sase-architecture'/.test(tbv3SrcV1P) &&
    /id:\s*'sd-wan-network'/.test(tbv3SrcV1P) &&
    /id:\s*'nat-gateway-cloud'/.test(tbv3SrcV1P) &&
    /id:\s*'internet-gateway-cloud'/.test(tbv3SrcV1P) &&
    /id:\s*'vpc-peering-cloud'/.test(tbv3SrcV1P) &&
    /id:\s*'metropolitan-area-network'/.test(tbv3SrcV1P) &&
    /id:\s*'site-to-site-ipsec-vpn'/.test(tbv3SrcV1P) &&
    /id:\s*'remote-access-vpn'/.test(tbv3SrcV1P) &&
    /id:\s*'cellular-4g-5g-wan'/.test(tbv3SrcV1P) &&
    /id:\s*'satellite-wan'/.test(tbv3SrcV1P) &&
    /id:\s*'hybrid-cloud-vpn'/.test(tbv3SrcV1P)
  );

  // ---- Stage 4: title-case sweep ----
  test('V1P: _titleCase helper defined',
    /function\s+_titleCase\s*\(/.test(tbv3SrcV1P)
  );
  test('V1P: scenario titles are title-cased (spot check)',
    /title:\s*'Star Topology With Central Switch'/.test(tbv3SrcV1P) &&
    /title:\s*'DMZ \/ Screened Subnet'/.test(tbv3SrcV1P) &&
    /title:\s*'Router-on-a-Stick/.test(tbv3SrcV1P)
  );
  test('V1P: no sentence-case scenario titles remain (regression guard)',
    !/title:\s*'Star topology with central switch'/.test(tbv3SrcV1P)
  );
})();

// ══════════════════════════════════════════
// TB v3 Phase 7 v2 Polish UAT fixtures (Stage 1)
// ══════════════════════════════════════════
(function _tbv3PolishStage1Fixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  const fs = require('fs');
  const path = require('path');
  let tbv3SrcPo = "";
  try { tbv3SrcPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }
  let tbv3CssPo = "";
  try { tbv3CssPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.css'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  // ---- Stage 1: device family map + accent CSS ----
  test('POLISH: _TB_V3_DEVICE_FAMILY defined with 37 entries',
    (function () {
      var m = tbv3SrcPo.match(/_TB_V3_DEVICE_FAMILY\s*=\s*\{([^}]+)\}/);
      if (!m) return false;
      var entries = (m[1].match(/'[a-z0-9-]+'\s*:/g) || []).length;
      return entries >= 37;
    })()
  );
  test('POLISH: _build3DDeviceEl emits data-family attribute',
    /function\s+_build3DDeviceEl[\s\S]{0,1500}setAttribute\(['"]data-family['"]/.test(tbv3SrcPo)
  );
  test('POLISH: family accent CSS defines all 5 color variables',
    /--tb3-3d-accent-network/.test(tbv3CssPo) &&
    /--tb3-3d-accent-endpoint/.test(tbv3CssPo) &&
    /--tb3-3d-accent-wireless/.test(tbv3CssPo) &&
    /--tb3-3d-accent-security/.test(tbv3CssPo) &&
    /--tb3-3d-accent-cloud/.test(tbv3CssPo)
  );
})();

// ══════════════════════════════════════════
// TB v3 Phase 7 v2 Polish Stage 2A UAT fixtures
// ══════════════════════════════════════════
(function _tbv3PolishStage2AFixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  const fs = require('fs');
  const path = require('path');
  let tbv3SrcPo = "";
  try { tbv3SrcPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  test('POLISH: Batch 2A — all 10 network device illustrations defined',
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['router'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['l3-router'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['isp-router'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['switch'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['l3-switch'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['dmz-switch'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['hub'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['bridge'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['onprem-dc'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['mpls-core'\]/.test(tbv3SrcPo)
  );
})();

// ══════════════════════════════════════════
// TB v3 Phase 7 v2 Polish Stage 2B UAT fixtures
// ══════════════════════════════════════════
(function _tbv3PolishStage2BFixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  const fs = require('fs');
  const path = require('path');
  let tbv3SrcPo = "";
  try { tbv3SrcPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  test('POLISH: Batch 2B — all 10 endpoint device illustrations defined',
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['pc'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['laptop'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['server'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['smartphone'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['smart-tv'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['game-console'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['printer'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['voip'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['iot'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['dns-server'\]/.test(tbv3SrcPo)
  );
})();

// ══════════════════════════════════════════
// TB v3 Phase 7 v2 Polish Stage 2C UAT fixtures
// ══════════════════════════════════════════
(function _tbv3PolishStage2CFixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  const fs = require('fs');
  const path = require('path');
  let tbv3SrcPo = "";
  try { tbv3SrcPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  test('POLISH: Batch 2C — all 6 wireless+security device illustrations defined',
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['wap'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['wlc'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['firewall'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['ids'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['vpg'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['sase-edge'\]/.test(tbv3SrcPo)
  );
})();

// ══════════════════════════════════════════
// TB v3 Phase 7 v2 Polish Stage 2D UAT fixtures
// ══════════════════════════════════════════
(function _tbv3PolishStage2DFixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  const fs = require('fs');
  const path = require('path');
  let tbv3SrcPo = "";
  try { tbv3SrcPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  test('POLISH: Batch 2D — all 3 cloud core device illustrations defined',
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['cloud'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['internet'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['load-balancer'\]/.test(tbv3SrcPo)
  );
})();

// ══════════════════════════════════════════
// TB v3 Phase 7 v2 Polish Stage 2E UAT fixtures — FINAL illustration batch
// ══════════════════════════════════════════
(function _tbv3PolishStage2EFixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  const fs = require('fs');
  const path = require('path');
  let tbv3SrcPo = "";
  try { tbv3SrcPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  test('POLISH: Batch 2E — all 8 public-cloud device illustrations defined',
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['public-web'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['public-file'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['public-cloud'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['vpc'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['cloud-subnet'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['igw'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['nat-gw'\]/.test(tbv3SrcPo) &&
    /_TB_V3_DEVICE_3D_ILLUSTRATIONS\['tgw'\]/.test(tbv3SrcPo)
  );
  test('POLISH: all 37 device types have illustrations',
    (function () {
      var src = tbv3SrcPo;
      var types = [
        'router','l3-router','isp-router','switch','l3-switch','dmz-switch','hub','bridge','onprem-dc','mpls-core',
        'pc','laptop','server','smartphone','smart-tv','game-console','printer','voip','iot','dns-server',
        'wap','wlc','firewall','ids','vpg','sase-edge',
        'cloud','internet','load-balancer',
        'public-web','public-file','public-cloud','vpc','cloud-subnet','igw','nat-gw','tgw'
      ];
      for (var i = 0; i < types.length; i++) {
        var t = types[i].replace(/[\.\*\+\?\(\)\[\]\\]/g, '\\$&');
        var rx = new RegExp("_TB_V3_DEVICE_3D_ILLUSTRATIONS\\['" + t + "'\\]");
        if (!rx.test(src)) return false;
      }
      return true;
    })()
  );
})();

// ══════════════════════════════════════════
// TB v3 Phase 7 v2 Polish Stage 3 UAT fixtures
// ══════════════════════════════════════════
(function _tbv3PolishStage3Fixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  const fs = require('fs');
  const path = require('path');
  let tbv3SrcPo = "";
  try { tbv3SrcPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }
  let tbv3CssPo = "";
  try { tbv3CssPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.css'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  // ---- Stage 3: device labels below + counter-rotation ----
  test('POLISH: label-below CSS classes defined',
    /\.tb3-3d-dev-label-below/.test(tbv3CssPo) &&
    /\.tb3-3d-dev-name/.test(tbv3CssPo) &&
    /\.tb3-3d-dev-ip/.test(tbv3CssPo)
  );
  test('POLISH: _apply3DCamera counter-rotates labels',
    /function\s+_apply3DCamera[\s\S]{0,1200}\.tb3-3d-dev-label-below[\s\S]{0,300}counterTransform/.test(tbv3SrcPo)
  );
  test('POLISH: _build3DDeviceEl emits .tb3-3d-dev-label-below in innerHTML',
    /function\s+_build3DDeviceEl[\s\S]{0,3500}tb3-3d-dev-label-below/.test(tbv3SrcPo)
  );
})();

// ══════════════════════════════════════════
// TB v3 Phase 7 v2 Polish Stage 4 UAT fixtures — centroid offset
// ══════════════════════════════════════════
(function _tbv3PolishStage4Fixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  const fs = require('fs');
  const path = require('path');
  let tbv3SrcPo = "";
  try { tbv3SrcPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  test('POLISH: _computeSceneCentroid helper defined',
    /function\s+_computeSceneCentroid\s*\(/.test(tbv3SrcPo)
  );
  test('POLISH: _build3DDeviceEl + _build3DCableEl accept sceneCx/sceneCy params',
    /function\s+_build3DDeviceEl\s*\([^)]*sceneCx[^)]*sceneCy/.test(tbv3SrcPo) &&
    /function\s+_build3DCableEl\s*\([^)]*sceneCx[^)]*sceneCy/.test(tbv3SrcPo)
  );
})();

// ══════════════════════════════════════════
// TB v3 Phase 7 v2 Polish Stage 5 UAT fixtures — ambient packets
// ══════════════════════════════════════════
(function _tbv3PolishStage5Fixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  const fs = require('fs');
  const path = require('path');
  let tbv3SrcPo = "";
  try { tbv3SrcPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }
  let tbv3CssPo = "";
  try { tbv3CssPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.css'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  test('POLISH: _buildAmbientPacketEl defined with animateMotion + mpath',
    /function\s+_buildAmbientPacketEl[\s\S]{0,4000}animateMotion[\s\S]{0,500}mpath/.test(tbv3SrcPo)
  );
  test('POLISH: reduced-motion hides ambient packets',
    /@media\s*\(prefers-reduced-motion[\s\S]{0,3000}\.tb3-3d-ambient-packet[\s\S]{0,100}display\s*:\s*none/.test(tbv3CssPo)
  );
})();

// ── Stage 6: v6.4.3 TB v3 Popup Polish ──
(function () {
  var fs = require('fs');
  if (!fs.existsSync(require('path').join(require('path').join(__dirname, '..'), '../features/topology-builder-v3.js'))) return; /* MVP-quiz-only */
  var tbv3SrcS6 = fs.readFileSync(
    require('path').join(require('path').join(__dirname, '..'), '../features/topology-builder-v3.js'), 'utf8'
  );
  var tbv3CssS6 = fs.readFileSync(
    require('path').join(require('path').join(__dirname, '..'), '../features/topology-builder-v3.css'), 'utf8'
  );

  // 6.1 Floor grid CSS: background-color + background-image with linear-gradient grid
  test('STAGE6: .tb3-3d-floor has background-color (not shorthand)',
    /\.tb3-3d-floor[\s\S]{0,600}background-color\s*:/.test(tbv3CssS6)
  );
  test('STAGE6: .tb3-3d-floor background-image includes 60px grid linear-gradient',
    /\.tb3-3d-floor[\s\S]{0,800}linear-gradient[\s\S]{0,400}60px\s+60px/.test(tbv3CssS6)
  );
  test('STAGE6: .tb3-3d-floor has mask-image edge-fade',
    /\.tb3-3d-floor[\s\S]{0,2200}mask-image\s*:[\s\S]{0,400}radial-gradient/.test(tbv3CssS6)
  );

  // 6.2 Camera defaults updated
  test('STAGE6: _3dPopup camera defaults rotX:42 zoom:1.1',
    /camera\s*:\s*\{\s*rotX\s*:\s*42\s*,\s*rotY\s*:\s*-18\s*,\s*zoom\s*:\s*1\.1\b/.test(tbv3SrcS6)
  );
  test('STAGE6: _on3DPopupDblClick reset targets use rotX 42 zoom 1.1',
    /targetRotX\s*=\s*42[\s\S]{0,100}targetZoom\s*=\s*1\.1/.test(tbv3SrcS6)
  );
  test('STAGE6: _on3DPopupDblClick reduced-motion branch uses rotX 42 zoom 1.1',
    /camera\.rotX\s*=\s*42[\s\S]{0,100}camera\.zoom\s*=\s*1\.1/.test(tbv3SrcS6)
  );

  // 6.3 Fit + Reset buttons in header HTML
  test('STAGE6: header contains tb3-3d-popup-fit-btn',
    /tb3-3d-popup-fit-btn/.test(tbv3SrcS6)
  );
  test('STAGE6: header contains tb3-3d-popup-reset-btn',
    /tb3-3d-popup-reset-btn/.test(tbv3SrcS6)
  );
  test('STAGE6: header contains tb3-3d-popup-header-spacer',
    /tb3-3d-popup-header-spacer/.test(tbv3SrcS6)
  );

  // 6.4 Fit/Reset handlers wired
  test('STAGE6: fit-btn click wires _fitCameraToDevices',
    /tb3-3d-popup-fit-btn[\s\S]{0,200}_fitCameraToDevices/.test(tbv3SrcS6)
  );
  test('STAGE6: reset-btn click wires _on3DPopupDblClick',
    /tb3-3d-popup-reset-btn[\s\S]{0,200}_on3DPopupDblClick/.test(tbv3SrcS6)
  );

  // 6.5 _fitCameraToDevices function exists with rAF tween
  test('STAGE6: _fitCameraToDevices defined with rAF tween + cancel discipline',
    /function\s+_fitCameraToDevices[\s\S]{0,1600}cancelAnimationFrame[\s\S]{0,700}requestAnimationFrame/.test(tbv3SrcS6)
  );
  test('STAGE6: _fitCameraToDevices respects reduced-motion fast path',
    /function\s+_fitCameraToDevices[\s\S]{0,2000}_3dPopupReducedMotion/.test(tbv3SrcS6)
  );

  // 6.6 Legend chip present in viewport HTML
  test('STAGE6: tb3-3d-legend-chip appended inside viewport',
    /tb3-3d-legend-chip/.test(tbv3SrcS6)
  );
  test('STAGE6: legend chip contains at least 3 device-family dots',
    (tbv3SrcS6.match(/tb3-3d-legend-dot/g) || []).length >= 3
  );

  // 6.7 Chrome CSS present
  test('STAGE6: .tb3-3d-popup-tool-btn CSS rule exists',
    /\.tb3-3d-popup-tool-btn\s*\{/.test(tbv3CssS6)
  );
  test('STAGE6: .tb3-3d-legend-chip CSS rule exists',
    /\.tb3-3d-legend-chip\s*\{/.test(tbv3CssS6)
  );
  test('STAGE6: .tb3-3d-dev hover-lift CSS exists for child elements',
    /\.tb3-3d-dev:hover\s+\.tb3-3d-dev-top[\s\S]{0,200}translateZ\(8px\)/.test(tbv3CssS6)
  );
  test('STAGE6: Stage 6 reduced-motion gate kills tool-btn transition and hover lift',
    /@media\s*\(prefers-reduced-motion[\s\S]{0,3000}\.tb3-3d-popup-tool-btn[\s\S]{0,100}transition\s*:\s*none/.test(tbv3CssS6)
  );
  test('STAGE6: legend chip contains "Device families" title',
    /tb3-3d-legend-chip[\s\S]{0,500}Device families/.test(tbv3SrcS6)
  );
})();

// ══════════════════════════════════════════
// TB v3 Phase 7 v2 Polish Stage 7 UAT fixtures — reduced-motion + a11y
// ══════════════════════════════════════════
(function _tbv3PolishStage7Fixtures() {
  if (!require("fs").existsSync(require("path").join(require('path').join(__dirname, '..'), "..", "features", "topology-builder-v3.js"))) return; /* MVP-quiz-only */
  const fs = require('fs');
  const path = require('path');
  let tbv3SrcPo = "";
  try { tbv3SrcPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.js'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }
  let tbv3CssPo = "";
  try { tbv3CssPo = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'features', 'topology-builder-v3.css'), "utf8"); } catch (_) { /* MVP-quiz-only: TB v3 deleted */ }

  test('POLISH: reduced-motion kills hover-lift transitions',
    /@media\s*\(prefers-reduced-motion[\s\S]{0,5000}\.tb3-3d-dev\s+\.tb3-3d-dev-top[\s\S]{0,300}transition\s*:\s*none/.test(tbv3CssPo)
  );
  test('POLISH: reduced-motion kills hover-lift transforms',
    /@media\s*\(prefers-reduced-motion[\s\S]{0,5000}\.tb3-3d-dev:hover\s+\.tb3-3d-dev-top[\s\S]{0,300}transform\s*:\s*none/.test(tbv3CssPo)
  );
  test('POLISH: Fit + Reset buttons have aria-labels',
    /tb3-3d-popup-fit-btn[\s\S]{0,200}aria-label/.test(tbv3SrcPo) &&
    /tb3-3d-popup-reset-btn[\s\S]{0,200}aria-label/.test(tbv3SrcPo)
  );
})();

// ════════════════════════════════════════════════════════════════════
// TB v3 Walkthrough (Phase 8)
// ════════════════════════════════════════════════════════════════════
let tbV3JsForWalk = '';
try { tbV3JsForWalk = read('features/topology-builder-v3.js'); } catch (_) { /* MVP-quiz-only: deleted */ }


// (removed: TB v3 walkthrough tests — feature + JS file deleted in MVP quiz-only pivot)

// Tombstone: the TB v3 walkthroughs feature + its JS file were removed in the
// quiz-only MVP pivot. index.html must NOT reference the deleted script (the
// dead <script defer src="features/topology-builder-v3-walkthroughs.js"> tag
// was pruned). Keep it gone.
test('TB v3 walk: dead walkthroughs script reference removed from index.html', (function () {
  return !/topology-builder-v3-walkthroughs\.js/.test(html);
})());


test('TB v3 walk: STORAGE adds TB_V3_WALK_PROGRESS key (registered in app.js)', (function () {
  const appJs = read('app.js');
  return /TB_V3_WALK_PROGRESS\s*:\s*['"]nplus_tb_v3_walk_progress/.test(appJs);
})());

// (removed: TB v3 walkStart/_loadProgress tests — feature deleted in MVP quiz-only pivot)


// v6.5.9 — Phase 8b Topology fundamentals: 6 new walkthroughs for star / mesh /
// three-tier / ring / point-to-point / spine-leaf scenarios. Consolidated guard
// asserts presence + scenario binding + step count for each; the existing data-
// integrity sweep below auto-validates their device-id targets against the
// scenarios in topology-builder-v3.js — no additional sweep needed.

// v6.5.9 — Phase 8c Switching/VLAN: 3 new walkthroughs for router-on-a-stick /
// l3-switch-svi / collapsed-core. Same consolidated-guard pattern as v6.5.9;
// the data-integrity sweep below auto-validates device-id targets.

// v6.5.10 — Phase 8d WAN: 7 new walkthroughs covering the entire WAN category
// (MPLS, partial mesh, dual-ISP failover, SD-WAN, cellular 4G/5G, satellite, MAN).
// Same consolidated-guard pattern; data-integrity sweep auto-validates device IDs.

// v6.5.11 — Phase 8e Cloud: 9 new walkthroughs covering the entire Cloud category
// (hybrid · public-only · multi-cloud · Direct Connect · VPC + IGW/NAT/subnets ·
// multi-VPC TGW · NAT-GW outbound · IGW + LB · VPC peering non-transitive).
// Note: v6.5.7 quantification said 8; the actual Cloud category has 9. Shipping all 9.

// v6.5.12 — Phase 8f SMB/Office: 3 new walkthroughs (SOHO converged box,
// small-office single-firewall edge, enterprise dual-firewall + IDS + LB).

// v6.5.13 — Phase 8g Wireless: 3 new walkthroughs (ESS+WLC roaming, mesh
// backhaul throughput trade, point-to-point bridge between buildings).

// v6.5.14 — Phase 8h VPN: 3 new walkthroughs (site-to-site IPSec firewall-to-firewall,
// remote-access SSL/TLS through concentrator, hybrid-cloud IPSec to cloud VPG).

// v6.5.15 — Phase 8i SASE + Security: 4 new walkthroughs (SASE cloud-edge,
// zero-trust microsegmentation, bastion/jump-host single-door, 802.1X NAC).
// FINAL ship — closes the catalog at 42 of 42 scenarios covered.


test('TB v3 walk: mockMatchMedia helper produces correct reduced-motion fake', (function () {
  var fakeOn = mockMatchMedia(true);
  var fakeOff = mockMatchMedia(false);
  return fakeOn('(prefers-reduced-motion: reduce)').matches === true
      && fakeOff('(prefers-reduced-motion: reduce)').matches === false
      && fakeOn('(min-width: 800px)').matches === false;
})());


// ── v6.5.2 hotfix tests ──


// Bug A: MutationObserver re-applies walk FX after canvas re-render


test('v6.5.4 Bug A: walkActiveFlowStepId no longer assigned (removed from code paths)', (function () {
  // v6.5.4: state.walkActiveFlowStepId no longer written or read — assignment patterns gone
  // (a doc-comment may still mention the name; assertion targets actual usage)
  return !/state\.walkActiveFlowStepId\s*=/.test(tbV3JsForWalk)
      && !/walkActiveFlowStepId\s*===?/.test(tbV3JsForWalk);
})());


// Bug B: walkStart reassigns state from loadScenarioOnCanvas + re-renders


// Bug C: anchor positioning uses smaller margin + zero buffer


// Draggable step card


// (removed: TB v3 runStep test — feature deleted in MVP quiz-only pivot)

// ── Security Phase 1 (2026-05-29) — AI-proxy hardening guards (audit C1/C2/H1/L1) ──
(() => {
  const aiProxySrc = fs.existsSync(path.join(ROOT, 'api/ai/generate.js'))
    ? fs.readFileSync(path.join(ROOT, 'api/ai/generate.js'), 'utf8') : '';
  const aiRlMig = fs.existsSync(path.join(ROOT, 'supabase/migrations/20260529_ai_proxy_rate_limit.sql'))
    ? fs.readFileSync(path.join(ROOT, 'supabase/migrations/20260529_ai_proxy_rate_limit.sql'), 'utf8') : '';

  // C2 — input allowlist (no more open Claude relay)
  test('Sec-P1 C2: ai-proxy no longer spreads req.body to Anthropic',
    aiProxySrc.length > 0 && !/Object\.assign\(\{\},\s*req\.body\)/.test(aiProxySrc));
  test('Sec-P1 C2: ai-proxy enforces a model allowlist',
    /ALLOWED_MODELS/.test(aiProxySrc) && /invalid_model/.test(aiProxySrc));
  test('Sec-P1 C2: ai-proxy clamps max_tokens to a cap',
    /MAX_TOKENS_CAP/.test(aiProxySrc) && /maxTokens\s*>\s*MAX_TOKENS_CAP/.test(aiProxySrc));
  test('Sec-P1 C2: ai-proxy caps prompt size',
    /MAX_PROMPT_BYTES/.test(aiProxySrc) && /prompt_too_large/.test(aiProxySrc));

  // H1 — rate limiting + spend ceiling
  test('Sec-P1 H1: ai-proxy calls the ai_rl rate-limit RPC',
    /ai_rl_check_and_increment/.test(aiProxySrc) && /rlCheck\(/.test(aiProxySrc));
  test('Sec-P1 H1: ai-proxy enforces per-user + per-IP + global ceilings',
    /USER_DAILY_LIMIT/.test(aiProxySrc) && /IP_HOURLY_LIMIT/.test(aiProxySrc) && /GLOBAL_DAILY_LIMIT/.test(aiProxySrc));
  test('Sec-P1 H1: ai-proxy returns 429 when rate-limited',
    /rate_limited/.test(aiProxySrc) && /429/.test(aiProxySrc));
  test('Sec-P1 H1: ai-proxy hashes the IP, never stores raw',
    /_hashIp/.test(aiProxySrc) && /sha256/.test(aiProxySrc));

  // L1 — error sanitization
  test('Sec-P1 L1: ai-proxy does not leak raw error detail to client',
    aiProxySrc.length > 0 && !/detail:\s*String\(e/.test(aiProxySrc));
  test('Sec-P1 L1: ai-proxy returns a generic error_id on failure',
    /error_id/.test(aiProxySrc));

  // Migration
  test('Sec-P1 migration: ai_proxy_rate_limit table + RLS enabled',
    /create table if not exists ai_proxy_rate_limit/.test(aiRlMig) && /enable row level security/.test(aiRlMig));
  test('Sec-P1 migration: ai_rl_check_and_increment is SECURITY DEFINER + granted to authenticated',
    /create or replace function ai_rl_check_and_increment/.test(aiRlMig) && /security definer/.test(aiRlMig) && /grant execute on function ai_rl_check_and_increment.+to authenticated/.test(aiRlMig));
  test('Sec-P1 migration: carries a ROLLBACK block',
    /ROLLBACK:/.test(aiRlMig) && /drop table if exists ai_proxy_rate_limit/.test(aiRlMig));
})();

// ══════════════════════════════════════════════════════════════════════════
// Security Phase 2 · DB quick wins (20260529_phase2_db_quick_wins.sql)
// M1 stripe_events RLS · M2 diagnostic_share enumeration · M4 notify validation
// · L3 claim_diagnostic_results email-match. See docs/audits/SECURITY-AUDIT-2026-05-29.md.
// ══════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m── Security Phase 2 — DB QUICK WINS ──\x1b[0m');
(function () {
  const p2Path = path.join(ROOT, 'supabase/migrations/20260529_phase2_db_quick_wins.sql');
  const p2 = fs.existsSync(p2Path) ? fs.readFileSync(p2Path, 'utf8') : '';
  const shareFetch = fs.existsSync(path.join(ROOT, 'landing/api/diagnostic/share-fetch.js'))
    ? fs.readFileSync(path.join(ROOT, 'landing/api/diagnostic/share-fetch.js'), 'utf8') : '';
  const shareRedirect = fs.existsSync(path.join(ROOT, 'landing/api/diagnostic/share-redirect.js'))
    ? fs.readFileSync(path.join(ROOT, 'landing/api/diagnostic/share-redirect.js'), 'utf8') : '';

  // — file + gated-lane convention —
  test('Sec-P2 migration: 20260529_phase2_db_quick_wins.sql exists',
    p2.length > 1000);
  test('Sec-P2 migration: carries a -- ROLLBACK block (gated-lane discipline)',
    /-- ROLLBACK/.test(p2));

  // — M1: stripe_events RLS, no client policies —
  test('Sec-P2 M1: enables RLS on stripe_events',
    /alter\s+table\s+stripe_events\s+enable\s+row\s+level\s+security/i.test(p2));
  test('Sec-P2 M1: adds NO client policy on stripe_events (service-role only)',
    !/create\s+policy[\s\S]{0,120}\son\s+stripe_events/i.test(p2));

  // — M2: diagnostic_share enumeration fix —
  test('Sec-P2 M2: drops the world-readable open SELECT policy',
    /drop\s+policy\s+if\s+exists\s+"diag_share_public_select"\s+on\s+diagnostic_share/i.test(p2));
  test('Sec-P2 M2: get_diagnostic_share is a SECURITY DEFINER fn token+expiry scoped',
    /create\s+or\s+replace\s+function\s+get_diagnostic_share\s*\(\s*p_token\s+text\s*\)/i.test(p2)
    && /create\s+or\s+replace\s+function\s+get_diagnostic_share[\s\S]{0,400}security\s+definer/i.test(p2)
    && /where\s+s\.token\s*=\s*p_token/i.test(p2)
    && /expires_at\s*>\s*now\(\)/i.test(p2));
  test('Sec-P2 M2: get_diagnostic_share execute granted to anon',
    /grant\s+execute\s+on\s+function\s+get_diagnostic_share\(text\)\s+to\s+anon/i.test(p2));
  test('Sec-P2 M2: share-fetch.js reads via the RPC, not the open table',
    /\/rest\/v1\/rpc\/get_diagnostic_share/.test(shareFetch)
    && !/\/rest\/v1\/diagnostic_share'/.test(shareFetch));
  test('Sec-P2 M2: share-redirect.js reads via the RPC, not the open table',
    /\/rest\/v1\/rpc\/get_diagnostic_share/.test(shareRedirect)
    && !/\/rest\/v1\/diagnostic_share'/.test(shareRedirect));

  // — M4: notify_signups NULL-safe validation restored —
  test('Sec-P2 M4: notify policy recreated with the regex_fix regex + length bounds',
    /email\s*~\s*'\^\[\^@\]\+@\[\^@\]\+\\\.\[\^@\]\+\$'/.test(p2)
    && /length\(email\)\s*<=\s*254/i.test(p2)
    && /length\(cert\)\s*>\s*0/i.test(p2));
  test('Sec-P2 M4: source-length predicate is NULL-safe (the v4.99.13 42501 root cause)',
    /source\s+is\s+null\s+or\s+length\(source\)\s*<=\s*100/i.test(p2));

  // — L3: claim_diagnostic_results email-match guard —
  test('Sec-P2 L3: claim_diagnostic_results recreated',
    /create\s+or\s+replace\s+function\s+claim_diagnostic_results\s*\(\s*p_token\s+text\s*\)/i.test(p2));
  test('Sec-P2 L3: adds an email-match guard (auth.users email vs pending email)',
    /select\s+email\s+into\s+v_user_email\s+from\s+auth\.users/i.test(p2)
    && /is\s+distinct\s+from\s+lower\(v_pending\.email\)/i.test(p2)
    && /'email_mismatch'/.test(p2));
})();

// ══════════════════════════════════════════════════════════════════════════
// Security Phase 3 · notify-me rate limit + CORS (20260529_phase3_notify_rate_limit.sql
// + landing/api/notify.js). M3a per-IP-hash rate limit (fail-OPEN) · M3b CORS
// tightened from `*` to the certanvil.com allowlist. See docs/audits/SECURITY-AUDIT-2026-05-29.md.
// ══════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m── Security Phase 3 — NOTIFY RATE LIMIT + CORS ──\x1b[0m');
(function () {
  const p3Path = path.join(ROOT, 'supabase/migrations/20260529_phase3_notify_rate_limit.sql');
  const p3 = fs.existsSync(p3Path) ? fs.readFileSync(p3Path, 'utf8') : '';
  const notify = fs.existsSync(path.join(ROOT, 'landing/api/notify.js'))
    ? fs.readFileSync(path.join(ROOT, 'landing/api/notify.js'), 'utf8') : '';

  // — file + gated-lane convention —
  test('Sec-P3 migration: 20260529_phase3_notify_rate_limit.sql exists',
    p3.length > 1000);
  test('Sec-P3 migration: carries a -- ROLLBACK block (gated-lane discipline, dated >= 2026-05-12)',
    /-- ROLLBACK/.test(p3));
  test('Sec-P3 migration: preflight guard requires notify_signups + is_admin()',
    /notify_signups not found/.test(p3) && /is_admin\(\) not found/.test(p3));

  // — M3a: rate-limit table + RPC (mirrors diag_signup pattern) —
  test('Sec-P3 M3a: creates notify_rate_limit table (ip_hash PK + counters)',
    /create\s+table\s+if\s+not\s+exists\s+notify_rate_limit/i.test(p3)
    && /ip_hash\s+text\s+primary key/i.test(p3)
    && /call_count\s+int/i.test(p3)
    && /first_at\s+timestamptz/i.test(p3)
    && /last_at\s+timestamptz/i.test(p3));
  test('Sec-P3 M3a: creates notify_rl_check_and_increment RPC',
    /create\s+or\s+replace\s+function\s+notify_rl_check_and_increment/i.test(p3));
  test('Sec-P3 M3a: RPC is SECURITY DEFINER with pinned search_path (atomic RL check)',
    /notify_rl_check_and_increment[\s\S]{0,800}security\s+definer/i.test(p3)
    && /notify_rl_check_and_increment[\s\S]{0,900}set\s+search_path\s*=\s*public/i.test(p3));
  test('Sec-P3 M3a: RPC enforces 10-call / 1h window',
    /v_limit\s+constant\s+int\s*:=\s*10/.test(p3)
    && /interval\s+'1 hour'/.test(p3));
  test('Sec-P3 M3a: RLS admin-only select on rate-limit table (clients have no read/write)',
    /alter\s+table\s+notify_rate_limit\s+enable\s+row\s+level\s+security/i.test(p3)
    && /notify_rl_admin_select[\s\S]{0,200}is_admin\(\)/i.test(p3));
  test('Sec-P3 M3a: migration includes purge helper (notify_rl_purge_old)',
    /create\s+or\s+replace\s+function\s+notify_rl_purge_old/i.test(p3));

  // — M3a: endpoint wiring —
  test('Sec-P3 M3a: notify.js calls the rate-limit RPC',
    /\/rest\/v1\/rpc\/notify_rl_check_and_increment/.test(notify));
  test('Sec-P3 M3a: notify.js hashes client IP (SHA-256, raw IP never stored, distinct salt)',
    /crypto\.subtle\.digest\(\s*['"]SHA-256['"]/.test(notify)
    && /certanvil-notify-salt-v1/.test(notify));
  test('Sec-P3 M3a: notify.js uses the service-role key for the RL RPC',
    /SUPABASE_SERVICE_ROLE_KEY/.test(notify));
  test('Sec-P3 M3a: rate limit FAILS OPEN on infra error (missing key / RPC fail / throw)',
    /rate limit skipped \(fail-open\)/i.test(notify)
    && /fail-open\)/i.test(notify)
    && /threw \(fail-open\)/i.test(notify));
  test('Sec-P3 M3a: notify.js returns 429 only on explicit allowed:false',
    /row\.allowed\s*===\s*false/.test(notify)
    && /\}\s*,\s*429\s*,\s*req\s*\)/.test(notify));
  test('Sec-P3 M3a: rate-limit check sits AFTER the honeypot (bots do not spend RL budget)',
    /body\.website[\s\S]{0,700}checkNotifyRateLimit\(req\)/.test(notify));

  // — M3b: CORS tightened from `*` to the certanvil.com allowlist —
  test('Sec-P3 M3b: no Access-Control-Allow-Origin: * anywhere in notify.js',
    !/Access-Control-Allow-Origin['"]?\s*:\s*['"]\*['"]/.test(notify));
  test('Sec-P3 M3b: ALLOWED_ORIGINS allowlist contains the certanvil.com origins',
    /ALLOWED_ORIGINS\s*=\s*new\s+Set\(/.test(notify)
    && /https:\/\/certanvil\.com/.test(notify)
    && /https:\/\/www\.certanvil\.com/.test(notify));
  test('Sec-P3 M3b: corsHeaders echoes an allowlisted Origin + sets Vary: Origin',
    /ALLOWED_ORIGINS\.has\(origin\)/.test(notify)
    && /['"]Vary['"]\s*:\s*['"]Origin['"]/.test(notify));
  test('Sec-P3 M3b: OPTIONS preflight + json() both route through corsHeaders(req)',
    /headers:\s*corsHeaders\(req\)/.test(notify)
    && /\.\.\.corsHeaders\(req\)/.test(notify));

  // — graceful-degrade preserved (M3 must not break the existing soft-fail flow) —
  test('Sec-P3 graceful: notify.js still soft-fails the Supabase insert (try/catch preserved)',
    /try\s*\{[\s\S]{0,2000}\/rest\/v1\/notify_signups[\s\S]{0,2000}\}\s*catch\s*\(/.test(notify));
  test('Sec-P3 graceful: notify.js still returns persisted_to_supabase flag (UX contract intact)',
    /persisted_to_supabase:\s*persistedToSupabase/.test(notify));
})();

// ══════════════════════════════════════════════════════════════════════════
// Security Phase 4 · XSS defence-in-depth (M6 DOMPurify + L2 + L5)
// M6 vendors DOMPurify (no build step — committed .min.js + <script>) and runs
// the innerHTML sinks carrying untrusted data through it as a backstop to the
// always-on escHtml/escapeHtml layer: cert-app AI output (topic guide + "explain
// further" deep-dive) and landing cross-user/remote rows (admin user table from
// Supabase profiles + ship commits from the GitHub API). L2 keeps guide.diagram
// escHtml-escaped AND routes the guide body through the DOMPurify backstop. L5
// adds secret-file patterns to .gitignore. See docs/audits/SECURITY-AUDIT-2026-05-29.md.
// ══════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m── Security Phase 4 — XSS DEFENCE-IN-DEPTH (DOMPurify) ──\x1b[0m');
(function () {
  const rd = (p) => { const f = path.join(ROOT, p); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
  const appjs   = rd('app.js') + '\n' + rd('features/topic-dive.js');
  const indexer = rd('index.html');
  const swjs    = rd('sw.js');
  const adminjs = rd('landing/lib/admin.js');
  const adminht = rd('landing/admin.html');
  const gitig   = rd('.gitignore');
  const dpCert  = rd('lib/dompurify.min.js');
  const dpLand  = rd('landing/lib/dompurify.min.js');

  // — M6 vendoring: genuine DOMPurify committed in both apps (no npm dep) —
  test('Sec-P4 M6: lib/dompurify.min.js vendored (genuine Cure53 DOMPurify 3.x bundle)',
    dpCert.length > 10000 && /DOMPurify\s+3\./.test(dpCert) && /Cure53/.test(dpCert));
  test('Sec-P4 M6: landing/lib/dompurify.min.js vendored (same bundle)',
    dpLand.length > 10000 && /DOMPurify\s+3\./.test(dpLand));
  test('Sec-P4 M6: cert + landing vendored bundles are byte-identical',
    dpCert.length > 0 && dpCert === dpLand);

  // — M6 load order: the DOMPurify <script> precedes the script that consumes it —
  test('Sec-P4 M6: index.html loads lib/dompurify.min.js before app.js',
    /src="lib\/dompurify\.min\.js"/.test(indexer)
    && indexer.indexOf('src="lib/dompurify.min.js"') < indexer.indexOf('src="app.js"'));
  test('Sec-P4 M6: admin.html loads lib/dompurify.min.js before lib/admin.js',
    /src="lib\/dompurify\.min\.js"/.test(adminht)
    && adminht.indexOf('src="lib/dompurify.min.js"') < adminht.indexOf('src="lib/admin.js"'));

  // — M6 offline: precached in the service-worker shell —
  test('Sec-P4 M6: sw.js SHELL_ASSETS precaches ./lib/dompurify.min.js',
    /['"]\.\/lib\/dompurify\.min\.js['"]/.test(swjs));

  // — M6 helper wired (cert app), fails OPEN to escHtml if the bundle is missing —
  test('Sec-P4 M6: app.js defines sanitizeHTML() backed by window.DOMPurify',
    /function\s+sanitizeHTML\s*\(/.test(appjs) && /window\.DOMPurify/.test(appjs) && /DP\.sanitize/.test(appjs));
  test('Sec-P4 M6: app.js sanitizeHTML fails OPEN (returns input when DOMPurify absent)',
    /function\s+sanitizeHTML\([\s\S]{0,360}return\s+s;/.test(appjs));

  // — M6 + L2: cert-app AI sinks routed through the backstop —
  test('Sec-P4 L2: AI topic-guide body assigned via sanitizeHTML(aiGuideHtml)',
    /contentEl\.innerHTML\s*=\s*sanitizeHTML\(aiGuideHtml\)/.test(appjs));
  test('Sec-P4 L2: guide.diagram still escHtml-escaped inside <pre> (primary layer intact)',
    /<pre class="td-diagram">\$\{escHtml\(guide\.diagram\)\}/.test(appjs));
  test('Sec-P4 M6: AI "Explain further" deep-dive sink wrapped in sanitizeHTML',
    /deepDiv\.innerHTML\s*=\s*sanitizeHTML\(/.test(appjs));
  test('Sec-P4 M6: trusted onclick terminal/lab sections kept OUTSIDE sanitizeHTML',
    /sanitizeHTML\(aiGuideHtml\)\s*\+\s*_renderTopicTerminalSection/.test(appjs));

  // — M6 landing admin (cross-user + remote) sinks, table-context-safe —
  test('Sec-P4 M6: admin.js defines table-aware sanitizeRows (wraps <table>, extracts tbody)',
    /function\s+sanitizeRows\s*\(/.test(adminjs)
    && /'<table><tbody>'\s*\+\s*s\s*\+\s*'<\/tbody><\/table>'/.test(adminjs)
    && /querySelector\('tbody'\)/.test(adminjs));
  test('Sec-P4 M6: admin renderUsers (other-user rows) routed through sanitizeRows',
    /elUsersTbody\.innerHTML\s*=\s*sanitizeRows\(/.test(adminjs));
  test('Sec-P4 M6: admin renderShips (GitHub commits) routed through sanitizeRows',
    /elShipsTbody\.innerHTML\s*=\s*sanitizeRows\(/.test(adminjs));

  // — L5 .gitignore secret-file guard —
  test('Sec-P4 L5: .gitignore guards .env / *.key / *.pem / secrets/',
    /^\.env$/m.test(gitig) && /^\*\.key$/m.test(gitig) && /^\*\.pem$/m.test(gitig) && /^secrets\/$/m.test(gitig));
})();

// ══════════════════════════════════════════════════════════════════════════
// Security Phase 5 · RBAC formalization + admin audit log
// (20260531_phase5_admin_audit_log.sql + docs/decisions/ADR-001 + ADR-002)
// Append-only admin_audit_log table + SECURITY DEFINER triggers on the three
// privilege/entitlement-sensitive tables (profiles.role, subscriptions,
// cert_entitlements). M5 closed as an accepted-decision ADR (no BFF build).
// See docs/audits/SECURITY-AUDIT-2026-05-29.md.
// ══════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m── Security Phase 5 — RBAC + ADMIN AUDIT LOG ──\x1b[0m');
(function () {
  const rd = (p) => { const f = path.join(ROOT, p); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
  const p5    = rd('supabase/migrations/20260531_phase5_admin_audit_log.sql');
  const adr1  = rd('docs/decisions/ADR-001-m5-supabase-session-cookies.md');
  const adr2  = rd('docs/decisions/ADR-002-rbac-admin-surface.md');

  // — file + gated-lane convention —
  test('Sec-P5 migration: 20260531_phase5_admin_audit_log.sql exists',
    p5.length > 1000);
  test('Sec-P5 migration: carries a -- ROLLBACK block (gated-lane discipline, dated >= 2026-05-12)',
    /-- ROLLBACK/.test(p5) && /drop table if exists admin_audit_log/i.test(p5));
  test('Sec-P5 migration: uses uniquely-tagged dollar quotes ($guard$ / $audit_fn$), no bare $$',
    /\$guard\$/.test(p5) && /\$audit_fn\$/.test(p5) && !/\$\$/.test(p5));
  test('Sec-P5 migration: preflight guard requires is_admin() (Phase C′ prereq)',
    /is_admin\(\) not found/.test(p5));

  // — append-only audit table —
  test('Sec-P5 table: creates admin_audit_log with actor/action/target/old+new jsonb',
    /create\s+table\s+if\s+not\s+exists\s+admin_audit_log/i.test(p5)
    && /actor_id\s+uuid/i.test(p5)
    && /action\s+text\s+not\s+null/i.test(p5)
    && /target_table\s+text\s+not\s+null/i.test(p5)
    && /target_op\s+text\s+not\s+null/i.test(p5)
    && /old_data\s+jsonb/i.test(p5)
    && /new_data\s+jsonb/i.test(p5));
  test('Sec-P5 RLS: admin-only SELECT policy via is_admin()',
    /alter\s+table\s+admin_audit_log\s+enable\s+row\s+level\s+security/i.test(p5)
    && /"admin_audit_admin_select"[\s\S]{0,120}for\s+select\s+using\s*\(\s*public\.is_admin\(\)\s*\)/i.test(p5));
  test('Sec-P5 RLS: append-only — NO client insert/update/delete policy',
    !/create\s+policy[\s\S]{0,200}on\s+admin_audit_log[\s\S]{0,120}for\s+(insert|update|delete)/i.test(p5));

  // — the single SECURITY DEFINER writer —
  test('Sec-P5 fn: admin_audit_record is SECURITY DEFINER with pinned search_path',
    /create\s+or\s+replace\s+function\s+admin_audit_record\(\)/i.test(p5)
    && /admin_audit_record[\s\S]{0,200}security\s+definer/i.test(p5)
    && /admin_audit_record[\s\S]{0,260}set\s+search_path\s*=\s*public/i.test(p5));
  test('Sec-P5 fn: captures auth.uid() actor + tg_op + full old/new jsonb images',
    /auth\.uid\(\)/.test(p5)
    && /tg_argv\[0\]/.test(p5)
    && /tg_op/.test(p5)
    && /to_jsonb\(old\)/i.test(p5) && /to_jsonb\(new\)/i.test(p5));
  test('Sec-P5 fn: resolves target id generically (id OR user_id)',
    /coalesce\(\s*v_rec->>'id'\s*,\s*v_rec->>'user_id'\s*\)/i.test(p5));

  // — triggers on the three sensitive tables —
  test('Sec-P5 trigger: profiles fires ONLY on a real role change (skips metadata flushes)',
    /create\s+trigger\s+trg_audit_profiles_role[\s\S]{0,200}after\s+update\s+on\s+public\.profiles/i.test(p5)
    && /when\s*\(\s*old\.role\s+is\s+distinct\s+from\s+new\.role\s*\)/i.test(p5)
    && /execute\s+function\s+admin_audit_record\('role_change'\)/i.test(p5));
  test('Sec-P5 trigger: subscriptions logs every write (insert/update/delete)',
    /create\s+trigger\s+trg_audit_subscriptions[\s\S]{0,200}after\s+insert\s+or\s+update\s+or\s+delete\s+on\s+public\.subscriptions/i.test(p5)
    && /execute\s+function\s+admin_audit_record\('subscription_write'\)/i.test(p5));
  test('Sec-P5 trigger: cert_entitlements logs every write (insert/update/delete)',
    /create\s+trigger\s+trg_audit_entitlements[\s\S]{0,200}after\s+insert\s+or\s+update\s+or\s+delete\s+on\s+public\.cert_entitlements/i.test(p5)
    && /execute\s+function\s+admin_audit_record\('entitlement_write'\)/i.test(p5));

  // — M5 decision (ADR-001): accept-as-inherent, no BFF unless trigger fires —
  test('Sec-P5 M5: ADR-001 exists and records an ACCEPTED accept-as-inherent decision',
    adr1.length > 800
    && /Status:\*\*\s*Accepted/i.test(adr1)
    && /accept the non-HttpOnly token storage as an inherent property/i.test(adr1));
  test('Sec-P5 M5: ADR-001 documents the BFF revisit trigger (multi-tenant PII at scale)',
    /Revisit trigger/i.test(adr1)
    && /multi-tenant SaaS/i.test(adr1)
    && /HttpOnly/i.test(adr1));

  // — formalization (ADR-002): admin surface documented, no speculative roles —
  test('Sec-P5 formalization: ADR-002 documents the admin surface + is_admin() routing',
    adr2.length > 800
    && /admin surface/i.test(adr2)
    && /is_admin\(\)/.test(adr2));
  test('Sec-P5 formalization: ADR-002 explicitly excludes a speculative role-enum expansion',
    /NOT a role-system expansion/i.test(adr2));
})();

// ══════════════════════════════════════════════════════════════════════════
// Security Phase 7 (M7) — remove CSP script-src 'unsafe-inline'
// (event-actions.js delegation core + staged handler migration; see
//  docs/superpowers/plans/2026-05-31-m7-csp-unsafe-inline.md)
// ══════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m── Security Phase 7 — CSP script-src unsafe-inline removal (M7) ──\x1b[0m');
(function () {
  const rd = (p) => { const f = path.join(ROOT, p); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
  const ea  = rd('event-actions.js');
  const idx = rd('index.html');
  const app = rd('app.js');
  const sw  = rd('sw.js');

  // — scaffold (PR-1) —
  test('Sec-P7 scaffold: event-actions.js installs click/change/input delegated listeners',
    /addEventListener\(['"]click['"]/.test(ea)
    && /addEventListener\(['"]change['"]/.test(ea)
    && /addEventListener\(['"]input['"]/.test(ea));
  test('Sec-P7 scaffold: event-actions.js dispatches via closest([data-action]) + dataset.action',
    /closest\(['"]\[data-action\]['"]\)/.test(ea) && /dataset\.action/.test(ea));
  test('Sec-P7 scaffold: index.html loads event-actions.js BEFORE app.js',
    idx.indexOf('event-actions.js') > -1
    && idx.indexOf('event-actions.js') < idx.indexOf('src="app.js"'));
  test('Sec-P7 scaffold: sw.js precaches ./event-actions.js',
    /['"]\.\/event-actions\.js['"]/.test(sw));

  // — migration ratchet (literals lowered toward 0 across PR-2..PR-5) —
  const idxHandlers = (idx.match(/\son(click|change|input|keydown|keyup|submit)=/gi) || []).length;
  const appHandlers = (app.match(/onclick=\\?["']/g) || []).length;
  test('Sec-P7 ratchet: index.html inline on*= within ceiling (target 0 by PR-5)',
    idxHandlers <= 102);
  test('Sec-P7 ratchet: app.js generated onclick within ceiling (target 0 by PR-5)',
    appHandlers <= 73);

  // — flip guard placeholder (becomes the real CSP assertion in PR-6) —
  test('Sec-P7 flip (pending until PR-6): placeholder', true);
})();

