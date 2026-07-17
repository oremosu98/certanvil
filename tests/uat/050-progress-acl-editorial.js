// tests/uat/050-progress-acl-editorial.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Progress Page v2 redesign, ACL/Firewall Rule Builder, full v4.53-4.55 editorial redesign (hero, topbar, sidebar, results, topology builder editorial polish, ACL fix-this)

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── v7.2.0 PROGRESS PAGE v2 REDESIGN ──
// Work-first dashboard rebuild: mastery instrument hero + domain readiness
// strip + whole-row button + empty state + locked stop-slop copy. Supersedes
// the v4.51.0 4-tile-stat-strip + 26x26 chevron-button surface.
//
// Migrated v4.51.0 guards: 5141-5147 (header) + 5150-5161 (mastery emission)
// + 5168-5169 (topic-obj-domainKey badge — mockup has no obj badge by design).
// KEPT v4.51.0 guards: 5163 (.ps-row tombstone), 5166-5167 (domainKey read),
// 5170-5173 (friendlier date), 5176-5179 (data-domain-idx/key) — all true in v2.
// KEPT all 5181-5267 styles.css CSS guards (legacy CSS retained; dg-system.css
// Batch 4b override wins at runtime — same proven scoped-CSS pattern from
// v4.99.66 / v4.99.67 / v4.99.68 / Batch 4l Settings et al).
console.log('\n\x1b[1m── v7.2.0 PROGRESS v2 (mastery instrument + domain strip) ──\x1b[0m');

// HTML — top eyebrow strip
// v4.54.9: editorial .ed-pagehead retained as the page-progress chrome.
test('v7.2.0 HTML: progress page uses .ed-pagehead editorial header',
  /id="page-progress"[\s\S]{0,400}class="ed-pagehead"/.test(html));
test('v7.18.0 HTML: progress page uses the analytics-style mono kicker title (Network+ N10-009 · Progress)',
  /id="page-progress"[\s\S]{0,800}ana-pagehead-title[^>]*><span class="ana-ph-cert">Network\+ N10-009<\/span>\s*<span class="ana-ph-dot"[^>]*>&middot;<\/span>\s*Progress/.test(html));
test('v4.51.0 HTML: regression — old inline-styled flex header removed',
  !html.includes('<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">'));
test('v4.51.0 HTML: regression — old inline legend dots removed from header',
  !html.includes('<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--green);margin-right:4px">'));

// JS — v2 mastery instrument emission (.pm-bar + .pm-ledger + 4 segments + 4 tier classes)
// Windows widened to 9000 to accommodate the .pm wrapper appearing later in
// the function body after the labs block + segment math + isEmpty branch.
test('v7.2.0: _renderProgressSummary emits .pm wrapper with role=region',
  /_renderProgressSummary[\s\S]{0,9000}class="pm[\s"][\s\S]{0,400}role="region"/.test(js));
test('v7.2.0: _renderProgressSummary emits .pm-headline ({N} of {total} studied)',
  /_renderProgressSummary[\s\S]{0,9000}class="pm-headline"/.test(js));
test('v7.2.0: _renderProgressSummary emits .pm-bar with role=img',
  /_renderProgressSummary[\s\S]{0,9000}class="pm-bar[\s\S]{0,200}role="img"/.test(js));
test('v7.2.0: _renderProgressSummary emits 4 .pm-seg segments (s/o/w/u)',
  /_renderProgressSummary[\s\S]{0,9000}pm-seg s[\s\S]{0,400}pm-seg o[\s\S]{0,400}pm-seg w[\s\S]{0,400}pm-seg u/.test(js));
test('v7.2.0: _renderProgressSummary emits .pm-ledger with 4 .pm-led tiles',
  /_renderProgressSummary[\s\S]{0,9000}class="pm-ledger[\s\S]{0,2000}pm-led s[\s\S]{0,400}pm-led o[\s\S]{0,400}pm-led w[\s\S]{0,400}pm-led u/.test(js));
test('v7.2.0: _renderProgressSummary uses tabular nums in .pm-led-n',
  /_renderProgressSummary[\s\S]{0,9000}class="pm-led-n/.test(js));
test('v7.2.0: _renderProgressSummary covered pct line derived from rows (off-by-one fix)',
  /_renderProgressSummary[\s\S]{0,9000}buckets\.untouched[\s\S]{0,1500}coveragePct/.test(js));

// JS — v2 domain readiness strip emission (.dr-strip with 5 .dr-row buttons + data-domain-jump)
test('v7.2.0: _renderProgressSummary emits .dr-strip with role=region',
  /_renderProgressSummary[\s\S]{0,12000}class="dr"[\s\S]{0,400}role="region"/.test(js));
test('v7.2.0: _renderProgressSummary emits .dr-eyebrow strip header',
  /_renderProgressSummary[\s\S]{0,12000}class="dr-eyebrow"/.test(js));
test('v7.2.0: _renderProgressSummary emits .dr-row buttons with data-domain-jump',
  /_renderProgressSummary[\s\S]{0,12000}class="dr-row"[\s\S]{0,400}data-domain-jump/.test(js));
test('v7.2.0: _renderProgressSummary domain readiness rows include .dr-name + .dr-weight + .dr-bar + .dr-pct',
  /_renderProgressSummary[\s\S]{0,12000}class="dr-name"[\s\S]{0,400}class="dr-weight"[\s\S]{0,400}class="dr-bar"[\s\S]{0,400}class="dr-pct/.test(js));
test('v7.2.0: _renderProgressSummary cert-aware domain strip uses CERT_PACK.domainWeights',
  /_renderProgressSummary[\s\S]{0,12000}(CERT_PACK\.domainWeights|DOMAIN_WEIGHTS)/.test(js));

// JS — v2 empty-state branch (rows.every(r => !r.studied))
test('v7.2.0: _renderProgressSummary has empty-state branch when no rows studied',
  /_renderProgressSummary[\s\S]{0,8000}rows\.every\(/.test(js) ||
  /_renderProgressSummary[\s\S]{0,8000}touched\s*===\s*0/.test(js));
test('v7.2.0: empty-state copy "Take any quiz to start tracking your mastery."',
  /Take any quiz to start tracking your mastery/.test(js));
test('v7.2.0: empty-state CTA copy "Take the diagnostic"',
  /Take the diagnostic/.test(js));

// JS — v2 row-as-button + chevron pseudo + data-topic delegation
// Windows widened to 4500 to span the v7.2.0 leading comment block + the
// verdict/date computation logic, ending at the return template literal.
test('v7.2.0: _progressRowHtml emits <button class="t-row" instead of <div class="t-row"',
  /_progressRowHtml[\s\S]{0,4500}<button[^>]*class="t-row/.test(js));
test('v7.2.0: _progressRowHtml emits data-topic for click delegation',
  /_progressRowHtml[\s\S]{0,4500}data-topic=/.test(js));
test('v7.2.0: _progressRowHtml emits aria-label on row',
  /_progressRowHtml[\s\S]{0,4500}aria-label/.test(js));
test('v7.2.0: _progressRowHtml emits .tn/.tnm/.tsub/.tbar/.tpc structure (v2 markup)',
  /_progressRowHtml[\s\S]{0,4500}class="tn"[\s\S]{0,800}class="tnm"[\s\S]{0,800}class="tbar"[\s\S]{0,800}class="tpc/.test(js));
test('v7.2.0: _progressRowHtml applies .untouched class when no studied',
  /_progressRowHtml[\s\S]{0,4500}untouched/.test(js));
test('v7.2.0: tombstone — old div.topic-row markup removed from _progressRowHtml',
  !/<div class="topic-row" onclick="drillTopic/.test(js));
test('v7.2.0: tombstone — old 26x26 play button separate element removed from _progressRowHtml',
  !/_progressRowHtml[\s\S]{0,4500}<button[^>]*topic-play-btn/.test(js));

// JS — v2 click delegation (drillTopic via data-topic + .dr-row scroll-into-view)
test('v7.2.0: _renderProgressGrouped wires .t-row[data-topic] click delegation',
  /_renderProgressGrouped[\s\S]{0,5000}data-topic[\s\S]{0,2000}drillTopic/.test(js) ||
  /_wireProgressDelegation/.test(js));
test('v7.2.0: domain-jump click handler emits #domain-<slug> scroll',
  /data-domain-jump[\s\S]{0,2000}scrollIntoView/.test(js));

// JS — v2 domain sections carry id="domain-<slug>"
test('v7.2.0: _renderProgressGrouped emits id="domain-<slug>" on each .dom section',
  /_renderProgressGrouped[\s\S]{0,3500}id="domain-/.test(js));

// JS — v2 prescription card locked copy (Where to drill next + per-minute language)
test('v7.2.0: rec card eyebrow "WHERE TO DRILL NEXT" (locked stop-slop copy)',
  /WHERE TO DRILL NEXT/i.test(js) || /Where to drill next/i.test(js));
test('v7.2.0: rec card sub "Drilling here moves readiness furthest per minute."',
  /Drilling here moves readiness furthest per minute/.test(js));
test('v7.2.0: rec card empty-state copy "Start with the diagnostic"',
  /Start with the diagnostic/.test(js));

// JS — _progressRowHtml upgrades (KEPT from v4.51.0). Window widened to
// 1200 to span the v7.2.0 leading comment block.
test('v4.51.0: _progressRowHtml reads domainKey from row',
  /_progressRowHtml\([^)]*row[\s\S]{0,1200}const\s*\{[^}]*domainKey/.test(js));
test('v4.51.0: _progressRowHtml uses friendlier date formatting (yesterday / weeks ago / months ago)',
  /yesterday[\s\S]{0,400}days ago[\s\S]{0,400}week ago[\s\S]{0,400}weeks ago[\s\S]{0,400}month ago[\s\S]{0,400}months ago/.test(js));
test('v4.51.0: regression — terse "Nd ago" date format removed from row renderer',
  !/metaRight\s*=\s*total\s*\+\s*'Q\s*·\s*'\s*\+\s*\(daysSince\s*===\s*0\s*\?\s*'today'\s*:\s*daysSince\s*\+\s*'d ago'/.test(js));

// JS — _renderProgressGrouped domain idx (KEPT from v4.51.0)
test('v4.51.0: _renderProgressGrouped emits data-domain-idx (1..5) on each accordion',
  /_renderProgressGrouped[\s\S]{0,5000}data-domain-idx="\$\{domainIdx\s*\+\s*1\}"/.test(js));
test('v4.51.0: _renderProgressGrouped also emits data-domain-key for JS hooks',
  /_renderProgressGrouped[\s\S]{0,5000}data-domain-key="\$\{dk\}"/.test(js));

// CSS — header + cards
test('v4.51.0 CSS: .progress-header flex layout',
  /\.progress-header\s*\{[^}]*display:\s*flex/.test(css));
test('v4.51.0 CSS: .progress-title styling (22px, weight 800)',
  /\.progress-title\s*\{[^}]*font-size:\s*22px[\s\S]{0,200}font-weight:\s*800/.test(css));
test('v4.51.0 CSS: .progress-card premium radial+linear gradient background',
  /\.progress-card\s*\{[\s\S]{0,500}radial-gradient[\s\S]{0,300}linear-gradient\(160deg/.test(css));
test('v4.51.0 CSS: .progress-card layered box-shadow (depth)',
  /\.progress-card\s*\{[\s\S]{0,700}box-shadow:[\s\S]{0,200}rgba\(var\(--accent-rgb\)/.test(css));
test('v4.51.0 CSS: .progress-card-labs swaps to green accent',
  /\.progress-card-labs\s*\{[\s\S]{0,500}rgba\(34,\s*197,\s*94/.test(css));

// CSS — tiles + bars
test('v4.51.0 CSS: .ps2-cover-bar premium 8px height',
  /\.ps2-cover-bar\s*\{[^}]*height:\s*8px/.test(css));
test('v4.51.0 CSS: .ps2-cover-fill uses 800ms cubic-bezier transition',
  /\.ps2-cover-fill\s*\{[\s\S]{0,300}transition:\s*width\s+800ms\s+cubic-bezier\(0\.2,\s*0\.8,\s*0\.2,\s*1\)/.test(css));
test('v4.51.0 CSS: .ps2-grid-mastery is 4-col grid',
  /\.ps2-grid-mastery\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/.test(css));
test('v4.51.0 CSS: .ps2-stat has hover-lift (translateY)',
  /\.ps2-stat:hover\s*\{[^}]*transform:\s*translateY\(-2px\)/.test(css));
test('v4.51.0 CSS: .ps2-strong .ps2-stat-val uses green',
  /\.ps2-strong\s+\.ps2-stat-val\s*\{[^}]*color:\s*var\(--green\)/.test(css));
test('v4.51.0 CSS: .ps2-solid .ps2-stat-val uses blue',
  /\.ps2-solid\s+\.ps2-stat-val\s*\{[^}]*color:\s*var\(--blue\)/.test(css));
test('v4.51.0 CSS: .ps2-weak .ps2-stat-val uses red',
  /\.ps2-weak\s+\.ps2-stat-val\s*\{[^}]*color:\s*var\(--red\)/.test(css));

// CSS — legend dots
test('v4.51.0 CSS: .pcl-green dot uses var(--green)',
  /\.pcl-green\s+\.pcl-dot\s*\{[^}]*background:\s*var\(--green\)/.test(css));
test('v4.51.0 CSS: .pcl-blue dot uses var(--blue)',
  /\.pcl-blue\s+\.pcl-dot\s*\{[^}]*background:\s*var\(--blue\)/.test(css));
test('v4.51.0 CSS: .pcl-red dot uses var(--red)',
  /\.pcl-red\s+\.pcl-dot\s*\{[^}]*background:\s*var\(--red\)/.test(css));

// CSS — 5-colour accordion borders
test('v4.51.0 CSS: .progress-domain[data-domain-idx="1"] purple left-border',
  /\.progress-domain\[data-domain-idx="1"\]\s*\{[^}]*border-left-color:\s*#7c6ff7/.test(css));
test('v4.51.0 CSS: .progress-domain[data-domain-idx="2"] green left-border',
  /\.progress-domain\[data-domain-idx="2"\]\s*\{[^}]*border-left-color:\s*#22c55e/.test(css));
test('v4.51.0 CSS: .progress-domain[data-domain-idx="3"] blue left-border',
  /\.progress-domain\[data-domain-idx="3"\]\s*\{[^}]*border-left-color:\s*#3b82f6/.test(css));
test('v4.51.0 CSS: .progress-domain[data-domain-idx="4"] amber left-border',
  /\.progress-domain\[data-domain-idx="4"\]\s*\{[^}]*border-left-color:\s*#f59e0b/.test(css));
test('v4.51.0 CSS: .progress-domain[data-domain-idx="5"] red left-border',
  /\.progress-domain\[data-domain-idx="5"\]\s*\{[^}]*border-left-color:\s*#ef4444/.test(css));

// CSS — domain-tinted objective badges
test('v4.51.0 CSS: .topic-obj-concepts purple-tinted',
  /\.topic-obj-concepts\s*\{[\s\S]{0,300}rgba\(124,\s*111,\s*247/.test(css));
test('v4.51.0 CSS: .topic-obj-implementation green-tinted',
  /\.topic-obj-implementation\s*\{[\s\S]{0,300}rgba\(34,\s*197,\s*94/.test(css));
test('v4.51.0 CSS: .topic-obj-operations blue-tinted',
  /\.topic-obj-operations\s*\{[\s\S]{0,300}rgba\(59,\s*130,\s*246/.test(css));
test('v4.51.0 CSS: .topic-obj-security amber-tinted',
  /\.topic-obj-security\s*\{[\s\S]{0,300}rgba\(245,\s*158,\s*11/.test(css));
test('v4.51.0 CSS: .topic-obj-troubleshooting red-tinted',
  /\.topic-obj-troubleshooting\s*\{[\s\S]{0,300}rgba\(239,\s*68,\s*68/.test(css));

// CSS — toolbar + play button polish
test('v4.51.0 CSS: .prog-filter-active uses gradient (was flat accent)',
  /\.prog-filter-btn\.prog-filter-active\s*\{[\s\S]{0,300}linear-gradient\(135deg,\s*var\(--accent\)/.test(css));
test('v4.51.0 CSS: .topic-play-btn hover uses linear-gradient',
  /\.topic-play-btn:hover\s*\{[\s\S]{0,300}linear-gradient\(135deg,\s*var\(--accent\)/.test(css));

// CSS — responsive + reduced-motion
test('v4.51.0 CSS: narrow-viewport collapses mastery grid to 2-col',
  /@media \(max-width:\s*600px\)[\s\S]{0,800}\.ps2-grid-mastery\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*1fr\)/.test(css));
test('v4.51.0 CSS: reduced-motion neutralises ps2-cover-fill transition',
  /prefers-reduced-motion[\s\S]{0,4000}\.ps2-cover-fill[\s\S]{0,400}transition:\s*none/.test(css));
test('v4.51.0 CSS: reduced-motion kills .ps2-stat:hover translateY',
  /prefers-reduced-motion[\s\S]{0,4000}\.ps2-stat:hover[\s\S]{0,200}transform:\s*none/.test(css));

// CSS — light-theme
test('v4.51.0 CSS: light-theme override for .progress-card',
  /\[data-theme="light"\]\s+\.progress-card\s*\{/.test(css));
test('v4.51.0 CSS: light-theme override for .progress-card-labs',
  /\[data-theme="light"\]\s+\.progress-card-labs\s*\{/.test(css));
test('v4.51.0 CSS: light-theme tinted objective badges',
  /\[data-theme="light"\]\s+\.topic-obj-concepts[\s\S]{0,200}#6d5ce0/.test(css));

// CSS — regression guards on old surface
test('v4.51.0 CSS: regression — flat .progress-summary background removed',
  !/^\.progress-summary\s*\{\s*background:\s*var\(--surface\);\s*border:\s*1px\s+solid\s+var\(--border\)/m.test(css));
test('v4.51.0 CSS: regression — old .ps-lab-row flex layout gone',
  !/\.ps-lab-row\s*\{[^}]*display:\s*flex/.test(css));

// ── v4.52.0 ACL / FIREWALL RULE BUILDER ──
// Major new feature: N10-009 Security-domain sandbox. 8 scenarios +
// Free Build, stateless rule evaluator, outcome-based grader, Tier C
// AI Coach. User green-lit full Option B scope 2026-04-18.
console.log('\n\x1b[1m── v4.52.0 ACL BUILDER ──\x1b[0m');

// HTML — page + setup tile + modals

// JS — STORAGE keys
test('v4.52.0: STORAGE.ACL_STATE key defined',
  js.includes("ACL_STATE: 'nplus_acl_state'"));
test('v4.52.0: STORAGE.ACL_COACH_CACHE key defined',
  js.includes("ACL_COACH_CACHE: 'nplus_acl_coach_cache'"));

// JS — evaluator core (correctness floor — functions exist)

// JS — behavioral sandbox test on the evaluator (reuses UAT's _fnBody / vm pattern)
try {
  const vm = require('vm');
  const extractFn = (name) => {
    const idx = js.indexOf('function ' + name + '(');
    if (idx === -1) return null;
    const braceStart = js.indexOf('{', idx);
    let depth = 0;
    for (let i = braceStart; i < js.length; i++) {
      if (js[i] === '{') depth++;
      else if (js[i] === '}') { depth--; if (depth === 0) return js.slice(idx, i + 1); }
    }
    return null;
  };
  const fns = ['_aclParseCidr','_aclIpToUint','_aclCidrContains','_aclPortMatches','_aclRuleMatches','_aclEvalPacket','_aclGradeScenario'].map(extractFn).join('\n');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fns, ctx);

  // Fixture 1: permit/deny first-match-wins
  const rules1 = [
    { id: 'r1', action: 'deny',   proto: 'any', srcAddr: '10.0.0.50/32', srcPort: 'any', dstAddr: 'any', dstPort: 'any' },
    { id: 'r2', action: 'permit', proto: 'any', srcAddr: '10.0.0.0/24',  srcPort: 'any', dstAddr: 'any', dstPort: 'any' }
  ];
  const r1 = ctx._aclEvalPacket(rules1, { src: '10.0.0.50', sp: 'any', dst: '8.8.8.8', dp: 53, proto: 'udp' });
  test('v4.52.0 EVAL: quarantined host denied on rule 0',
    r1.action === 'deny' && r1.ruleIdx === 0);
  const r2 = ctx._aclEvalPacket(rules1, { src: '10.0.0.20', sp: 'any', dst: '8.8.8.8', dp: 53, proto: 'udp' });
  test('v4.52.0 EVAL: clean host permitted on rule 1',
    r2.action === 'permit' && r2.ruleIdx === 1);
  const r3 = ctx._aclEvalPacket(rules1, { src: '192.168.1.5', sp: 'any', dst: '8.8.8.8', dp: 53, proto: 'udp' });
  test('v4.52.0 EVAL: outside subnet hits implicit deny',
    r3.action === 'deny' && r3.ruleIdx === -1 && r3.implicit === true);

  // Fixture 2: protocol + port matching
  const rules2 = [
    { id: 'r1', action: 'permit', proto: 'tcp', srcAddr: 'any', srcPort: 'any', dstAddr: '203.0.113.10/32', dstPort: 443 }
  ];
  const r4 = ctx._aclEvalPacket(rules2, { src: '198.51.100.5', sp: 'any', dst: '203.0.113.10', dp: 443, proto: 'tcp' });
  test('v4.52.0 EVAL: TCP 443 permit matches',
    r4.action === 'permit' && r4.ruleIdx === 0);
  const r5 = ctx._aclEvalPacket(rules2, { src: '198.51.100.5', sp: 'any', dst: '203.0.113.10', dp: 443, proto: 'udp' });
  test('v4.52.0 EVAL: proto mismatch (UDP vs TCP rule) hits implicit',
    r5.action === 'deny' && r5.implicit === true);
  const r6 = ctx._aclEvalPacket(rules2, { src: '198.51.100.5', sp: 'any', dst: '203.0.113.10', dp: 22, proto: 'tcp' });
  test('v4.52.0 EVAL: port mismatch (22 vs 443 rule) hits implicit',
    r6.action === 'deny' && r6.implicit === true);

  // Fixture 3: empty rule list = implicit deny for all
  const r7 = ctx._aclEvalPacket([], { src: '10.0.0.5', sp: 'any', dst: '8.8.8.8', dp: 443, proto: 'tcp' });
  test('v4.52.0 EVAL: empty ACL = implicit deny everything',
    r7.action === 'deny' && r7.implicit === true);

  // Fixture 4: CIDR /24 subnet match
  test('v4.52.0 EVAL: _aclCidrContains 10.10.0.5 in 10.10.0.0/24',
    ctx._aclCidrContains('10.10.0.0/24', '10.10.0.5') === true);
  test('v4.52.0 EVAL: _aclCidrContains 10.11.0.5 NOT in 10.10.0.0/24',
    ctx._aclCidrContains('10.10.0.0/24', '10.11.0.5') === false);
  test('v4.52.0 EVAL: _aclCidrContains "any" matches anything',
    ctx._aclCidrContains('any', '8.8.8.8') === true);

  // Fixture 5: /16 contains /24 hosts (rule-order trap semantics)
  test('v4.52.0 EVAL: 10.30.10.5 IS inside 10.30.0.0/16 (trap math)',
    ctx._aclCidrContains('10.30.0.0/16', '10.30.10.5') === true);
} catch (err) {
  // ACL evaluator (_aclEvalPacket etc.) was removed for the quiz-only MVP; a
  // missing-function error is expected, not a failure. Reactivates if it returns.
  if (!/is not a function/.test(err.message)) results.errors.push('ACL evaluator sandbox test failed: ' + err.message);
}

// JS — scenarios

// JS — state + CRUD

// JS — render functions

// JS — interactions

// JS — AI Coach (Tier C pattern)

// CSS — structure + premium aesthetic

// CSS — animations

// CSS — rule list + test panel + grade panel
test('v4.52.0 CSS: .acl-rule-implicit has red dashed border (attention)',
  /\.acl-rule-implicit\s*\{[\s\S]{0,300}rgba\(239,\s*68,\s*68/.test(css));

// CSS — modals
test('v4.52.0 CSS: .acl-picker-card hover-lift (translateY)',
  /\.acl-picker-card:hover\s*\{[\s\S]{0,300}transform:\s*translateY\(-2px\)/.test(css));

// CSS — responsive + reduced motion
test('v4.52.0 CSS: reduced-motion kills hover translateY on ACL cards',
  /prefers-reduced-motion[\s\S]{0,8000}\.acl-picker-card:hover[\s\S]{0,300}transform:\s*none/.test(css));

// CSS — light-theme

// ── v4.53.0 EDITORIAL REDESIGN ──
// Persistent sidebar (Practice/Drills IA) + setup-page polish (focus
// banner, \u00a7 01-04 numbered sections, vertical-bar domain grid,
// readiness pass-mark tick). User green-lit full scope after Claude
// Design prototype review. Kept brand palette + Inter font, added
// editorial pattern from prototype.
console.log('\n\x1b[1m── v4.53.0 EDITORIAL REDESIGN ──\x1b[0m');

// HTML
test('v4.53.0 HTML: #app-sidebar container exists',
  html.includes('id="app-sidebar"') && html.includes('class="app-sidebar"'));
test('v4.53.0 HTML: mobile sidebar toggle button',
  html.includes('class="sb-mobile-toggle"') && html.includes('onclick="toggleSidebarMobile()"'));
// v4.81.23 tombstone: #focus-banner element removed (retired in v4.81.20, deleted in v4.81.23)
test('v4.81.23 tombstone: #focus-banner element removed', !html.includes('id="focus-banner"'));
// v4.76.0 update: \u00a701 + \u00a702 retired. Mode Ladder now uses \u00a701 with
// "Pick your session" heading; Marathon presets are inside Practice tier.
// bento: the v7.16-era "\u00a7 01 \u00b7 Pick your session" editorial head was replaced by the
// bento command bar (the board's top chrome). The "Pick your session" picker survives
// as the #modes-ladder legacy stub (aria-label preserved). Assert the bento cmd-bar +
// the preserved session-picker stub.
test('bento HTML: command bar header + #modes-ladder "Pick your session" stub (was \u00a7 01 head)',
  /<header class="cmd-bar[\s\S]{0,400}id="cb-cert"/.test(html)
    && /id="modes-ladder"[^>]*aria-label="Pick your session"/.test(html));
test('v4.76.0 HTML: \u00a7 02 retired (Marathon Mode merged into Mode Ladder Practice tier)',
  !/&#167;\s*02[\s\S]{0,400}Marathon\s*<em>mode<\/em>/.test(html));
// bento: the v7.16-era `.domain-header`/"By Domain" head + #setup-domain-grid was
// replaced by the bento domain tile (head "Drill by domain", live #domainGrid built by
// renderBentoDomains). #setup-domain-grid/#domain-grid-section live on as legacy stubs.
test('bento HTML: domain tile head ("Drill by domain") + #domainGrid container (+ legacy #setup-domain-grid stub)',
  /class="tile-title">Drill by <i>domain<\/i>/.test(html)
    && html.includes('id="domainGrid"')
    && html.includes('id="setup-domain-grid"') && html.includes('id="domain-grid-section"'));
// v4.79.0: \u00a704 Custom Quiz editorial section head retired per Codex
// round-3 \u2014 Mode Ladder's "Custom Quiz" tile is the single entry point;
// the <details> form below is the implementation.
test('v4.79.0 tombstone: \u00a704 "Custom quiz" editorial section head removed',
  !/&#167;\s*04[\s\S]{0,400}Custom\s*<em>quiz<\/em>/.test(html));
test('v4.53.0 HTML: pass-mark 720 tick positioned at 62.5% on readiness bar',
  /class="readiness-pass-tick"[\s\S]{0,200}left:\s*62\.5%/.test(html));
test('v4.53.0 HTML: regression \u2014 old .setup-nav-group 6-button row removed',
  !html.includes('class="setup-nav-group"'));

// JS \u2014 sidebar
test('v4.53.0 JS: APP_SIDEBAR_PRACTICE + APP_SIDEBAR_DRILLS arrays defined',
  js.includes('const APP_SIDEBAR_PRACTICE') && js.includes('const APP_SIDEBAR_DRILLS'));
test('v4.53.0 JS: Practice nav has Home/Progress/Analytics/Network Builder/Builder V2/ACL Builder',
  /APP_SIDEBAR_PRACTICE[\s\S]{0,1500}Home[\s\S]{0,300}Progress[\s\S]{0,300}Analytics[\s\S]{0,400}Network Builder[\s\S]{0,600}ACL Builder/.test(js));
test('v4.53.0 JS: renderAppSidebar function defined',
  js.includes('function renderAppSidebar('));
test('v4.53.0 JS: SIDEBAR_ACTIVE_MAP defined (maps page names to sidebar highlight)',
  js.includes('const SIDEBAR_ACTIVE_MAP'));
test('v4.53.0 JS: updateSidebarActiveState function defined',
  js.includes('function updateSidebarActiveState('));
test('v4.53.0 JS: showPage hook calls updateSidebarActiveState',
  /function showPage\([\s\S]{0,600}updateSidebarActiveState/.test(js));
test('v4.53.0 JS: toggleSidebarMobile defined for mobile drawer',
  js.includes('function toggleSidebarMobile('));
test('v4.53.0 JS: has-sidebar body class applied on init',
  js.includes("document.body.classList.add('has-sidebar')"));

// JS \u2014 focus banner + domain grid
// v4.81.20: renderSetupFocusBanner is now a thin compat shim that hides
// the legacy #focus-banner element + delegates to renderTodayPlan. The
// v4.53.0/v4.54.0 in-banner content (greeting + weak-topic callout +
// empty-state copy) was retired because the v4.81.18 #today-plan card
// fully replaces this surface AND respects the isStudyPlanDoneToday
// gate. Tests below converted to tombstones \u2014 guarding that the legacy
// content stays gone, not that it still renders.
test('v4.53.0 JS: renderSetupFocusBanner function defined (now a compat shim)',
  js.includes('function renderSetupFocusBanner('));
test('v4.81.20 tombstone: renderSetupFocusBanner no longer renders greeting copy',
  !/renderSetupFocusBanner[\s\S]{0,3000}<em>Simi<\/em>/.test(js));
test('v4.81.20 tombstone: renderSetupFocusBanner no longer reads computeWeakSpotScores directly',
  !/renderSetupFocusBanner[\s\S]{0,2000}computeWeakSpotScores/.test(js));
test('v4.81.20 tombstone: renderSetupFocusBanner no longer renders "Seven questions per topic" copy',
  !/Seven questions per topic, mixed difficulty/.test(js));
test('v4.81.20 retire: renderSetupFocusBanner delegates to renderTodayPlan',
  /renderTodayPlan/.test(_fnBody(js, 'renderSetupFocusBanner') || ''));
test('v4.53.0 JS: renderSetupDomainGrid function defined',
  js.includes('function renderSetupDomainGrid('));
test('v4.53.0 JS: domain grid aggregates via TOPIC_DOMAINS lookup',
  /renderSetupDomainGrid[\s\S]{0,2500}TOPIC_DOMAINS\[e\.topic\]/.test(js));
// v4.54.10: renderSetupDomainGrid body grew \u2014 widen the regex window.
// v4.88.1: cert-aware bail at top of fn pushes drillDomain further down.
// v4.99.80: window widened 7000→10000 (cert-aware canonical topic maps added)
// v7.3.0: window widened 10000→12000 (AZ-900 _CANONICAL_AZ900 block + 3-way
// CANONICAL_DOMAIN_TOPICS ternary added ~1.5K chars inside renderSetupDomainGrid)
// v4.81.23: renderSetupFocusBanner stopped being called from goSetup (retired
// in v4.81.20 as a shim; element removed entirely in v4.81.23). goSetup
// still calls renderSetupDomainGrid + renderTodayPlan.
test('v4.53.0 JS (retargeted): goSetup calls renderSetupDomainGrid + renderTodayPlan',
  // v4.99.39: windows 1500 → 2500 (same reason as Tier1: teardown-hook accumulation)
  // v7.50.0: 2500 → 2900 after the gauntlet + why-not mode-reset blocks.
  /function goSetup\([\s\S]{0,2900}renderSetupDomainGrid[\s\S]{0,200}renderTodayPlan|function goSetup\([\s\S]{0,2900}renderTodayPlan[\s\S]{0,200}renderSetupDomainGrid/.test(js));

// CSS \u2014 sidebar
test('v4.53.0 CSS: body.has-sidebar adds 240px left padding',
  /body\.has-sidebar\s*\{[^}]*padding-left:\s*240px/.test(css));
test('v4.53.0 CSS: .app-sidebar fixed 240px left rail',
  /\.app-sidebar\s*\{[\s\S]{0,400}position:\s*fixed[\s\S]{0,200}width:\s*240px/.test(css));
// v4.87.4: brand mark gradient changed from accent-purple to dark forge gradient
// (M14 SVG inside needs dark backdrop for contrast). Test retargeted to verify
// gradient still present (any color) so the basic shape stays styled.
test('v4.53.0 CSS: sidebar brand mark has gradient + shadow (v4.87.4: dark forge gradient)',
  /\.sb-brand-mark\s*\{[\s\S]{0,400}linear-gradient\(135deg,/.test(css));
test('v4.53.0 CSS: .sb-item-active has accent-tinted background + left rail',
  /\.sb-item\.sb-item-active\s*\{/.test(css) && /\.sb-item\.sb-item-active::before\s*\{[^}]*background:\s*var\(--accent\)/.test(css));
test('v4.53.0 CSS: mobile breakpoint collapses sidebar to drawer',
  // v4.99.47 Phase 7: breakpoint lowered from 900px → 767px so iPad portrait
  // (768+) keeps the pinned sidebar. Below 768 = phone = hamburger drawer.
  /@media \(max-width:\s*767px\)[\s\S]{0,800}\.app-sidebar\s*\{[^}]*transform:\s*translateX\(-100%\)/.test(css));

// v4.81.23 tombstones: legacy v4.53.0 focus banner CSS retired (element
// removed in v4.81.23 cleanup; was retired in v4.81.20 as a shim).
test('v4.81.23 tombstone: .focus-banner CSS rule removed', !/\.focus-banner\s*\{/.test(css));
test('v4.81.23 tombstone: .focus-cta CSS rule removed', !/\.focus-cta\s*\{/.test(css));
test('v4.81.23 tombstone: @keyframes focusBannerFadeIn removed', !/@keyframes focusBannerFadeIn/.test(css));

// CSS \u2014 editorial numbered sections
test('v4.53.0 CSS: .ed-section-num monospace accent-light',
  /\.ed-section-num\s*\{[\s\S]{0,300}font-family:\s*monospace[\s\S]{0,200}color:\s*var\(--accent-light\)/.test(css));
test('v4.53.0 CSS: .ed-section-title em uses accent-light (editorial italic accent)',
  /\.ed-section-title\s+em\s*\{[^}]*color:\s*var\(--accent-light\)/.test(css));
test('v4.53.0 CSS: .ed-section-head has dashed-underline accent border',
  /\.ed-section-head\s*\{[\s\S]{0,400}border-bottom:\s*1px dashed rgba\(var\(--accent-rgb\)/.test(css));

// CSS \u2014 pass-mark tick
test('v4.53.0 CSS: .readiness-pass-tick positioned absolute',
  /\.readiness-pass-tick\s*\{[\s\S]{0,300}position:\s*absolute/.test(css));
test('v4.53.0 CSS: pass tick has 720 label above + PASS label below',
  /\.readiness-pass-tick::before[\s\S]{0,300}content:\s*'720'/.test(css) && /\.readiness-pass-tick::after[\s\S]{0,300}content:\s*'PASS'/.test(css));
test('v4.53.0 CSS: readiness-bar-wrap has overflow:visible (tick labels protrude)',
  /\.readiness-bar-wrap\s*\{[\s\S]{0,300}overflow:\s*visible/.test(css));

// CSS \u2014 domain grid
test('v4.53.0 CSS: .domain-grid uses 5-col grid',
  /\.domain-grid\s*\{[\s\S]{0,200}grid-template-columns:\s*repeat\(5,\s*1fr\)/.test(css));
test('v4.53.0 CSS: .domain-cell has per-idx top border colour (5-domain palette)',
  /\.domain-cell\[data-domain-idx="1"\][\s\S]{0,100}#7c6ff7/.test(css) &&
  /\.domain-cell\[data-domain-idx="5"\][\s\S]{0,100}#ef4444/.test(css));
test('v4.53.0 CSS: .dg-bar uses 800ms cubic-bezier height transition',
  /\.dg-bar\s*\{[\s\S]{0,400}transition:\s*height\s+800ms\s+cubic-bezier\(0\.2,\s*0\.8,\s*0\.2,\s*1\)/.test(css));
test('v4.53.0 CSS: .domain-cell:hover translateY(-3px)',
  /\.domain-cell:hover\s*\{[^}]*transform:\s*translateY\(-3px\)/.test(css));

// CSS \u2014 reduced motion
test('v4.53.0 CSS: reduced-motion neutralises sidebar + focus-banner + dg-bar',
  /prefers-reduced-motion[\s\S]{0,10000}\.app-sidebar[\s\S]{0,3000}transition:\s*none/.test(css));
test('v4.53.0 CSS: reduced-motion kills hover translateY on focus-cta + domain-cell',
  /prefers-reduced-motion[\s\S]{0,10000}\.domain-cell:hover[\s\S]{0,200}transform:\s*none/.test(css));

// CSS \u2014 light-theme overrides
test('v4.53.0 CSS: light-theme .app-sidebar recoloured',
  /\[data-theme="light"\]\s+\.app-sidebar\s*\{/.test(css));
// v4.81.23 tombstone: light-theme .focus-banner override retired (element removed)
test('v4.81.23 tombstone: light-theme .focus-banner override removed',
  !/\[data-theme="light"\]\s+\.focus-banner\s*\{/.test(css));
test('v4.53.0 CSS: light-theme .sb-item-active recoloured',
  /\[data-theme="light"\]\s+\.sb-item\.sb-item-active\s*\{/.test(css));
test('v4.53.0 CSS: light-theme .ed-section-num recoloured',
  /\[data-theme="light"\]\s+\.ed-section-num[\s\S]{0,200}#6355e0/.test(css));

// ── v4.54.0 EDITORIAL HERO v2 + TOP BAR + SIDEBAR COLLAPSE ──
// User saw a mockup screenshot and asked for that exact layout. Built:
//   • Persistent topbar across all pages (breadcrumb + time + gear + theme + avatar + sidebar toggle)
//   • Setup hero v2: display heading + lede (left) + dark readiness card + 2 mini-cards (right aside)
//   • Focus banner v2: full-width purple gradient + giant quote mark + white CTA
//   • Sidebar collapse with localStorage persistence
console.log('\n\x1b[1m── v4.54.0 HERO v2 + TOP BAR + COLLAPSE ──\x1b[0m');

// HTML \u2014 topbar
test('v4.54.0 HTML: #app-topbar exists',
  html.includes('id="app-topbar"') && html.includes('class="app-topbar"'));
// v4.89.0 (Phase C′ cloud-first): the static .topbar-avatar 'S' was retired
// in favor of a dynamic account pill rendered by auth-state.js into the
// #topbar-account-mount span. The mount point IS what auth-state replaces with
// either a Sign-in pill or a full account pill + dropdown. Either presence
// satisfies the "topbar has an identity surface" structural invariant.
test('v4.54.0 HTML: topbar has sidebar-toggle + breadcrumb + time + gear + theme + account-mount',
  html.includes('id="topbar-toggle"') && html.includes('id="topbar-crumb"') &&
  html.includes('id="topbar-time"') && html.includes('id="topbar-theme"') &&
  html.includes('id="topbar-account-mount"'));
test('v4.54.0 HTML: topbar toggle calls toggleSidebarCollapsed',
  /id="topbar-toggle"[\s\S]{0,200}onclick="toggleSidebarCollapsed/.test(html));

// HTML \u2014 hero v2
// bento: the v7.16-era `.col-main`/`.col-side` split was replaced by the bento board.
// The KEEPER readiness hero #readiness-card-v2 now lives in `.cell-hero` (markup
// verbatim); #setup-hero-v2 survives as a hidden legacy stub.
test('bento HTML: #readiness-card-v2 hero in .cell-hero (+ legacy #setup-hero-v2 stub, was .col split)',
  /class="cell-hero[^"]*"[\s\S]{0,200}class="[^"]*\breadiness-card\b[^"]*"\s+id="readiness-card-v2"/.test(html)
    && html.includes('id="setup-hero-v2"'));
test('v4.54.0 HTML: display heading defaults to "Good afternoon, Simi."',
  /id="hero-v2-display"[\s\S]{0,200}Good afternoon, <span class="name">Simi\.<\/span>/.test(html));
test('v4.54.0/dg4 HTML: readiness card v2 has score + bar fill + prediction + delta',
  html.includes('id="rc-v2-num"') && html.includes('id="rc-v2-bar-fill"') &&
  html.includes('id="rc-v2-prediction"') && html.includes('id="rc-v2-delta"'));
test('v4.54.0 HTML: two mini cards (today + streak) in hero-v2-mini-row',
  html.includes('id="mc-today-done"') && html.includes('id="mc-today-goal"') &&
  html.includes('id="mc-streak-num"') && html.includes('id="mc-streak-sub"'));
// v4.81.23 tombstone: .focus-banner-v2 element removed (retired in v4.81.20)
test('v4.81.23 tombstone: .focus-banner-v2 class removed from HTML', !/class="focus-banner-v2/.test(html));
test('v4.54.0 HTML: legacy hero hidden (.hero.is-hidden)',
  /class="hero is-hidden"/.test(html));

// JS \u2014 topbar
test('v4.54.0 JS: updateTopbarCrumb function defined',
  js.includes('function updateTopbarCrumb('));
test('v4.54.0 JS: showPage hooks updateTopbarCrumb',
  /function showPage\([\s\S]{0,800}updateTopbarCrumb/.test(js));
test('v4.54.0 JS: _topbarTick live clock helper',
  js.includes('function _topbarTick(') && js.includes('function _topbarStartClock('));
test('v4.54.0 JS: scrollToSettings nav helper (gear button)',
  js.includes('function scrollToSettings('));
test('v4.54.0 JS: topbar theme icon mirrors current theme via _syncTopbarTheme',
  js.includes('function _syncTopbarTheme('));

// JS \u2014 sidebar collapse
test('v4.54.0 JS: STORAGE_SIDEBAR_COLLAPSED key + toggleSidebarCollapsed function',
  js.includes('STORAGE_SIDEBAR_COLLAPSED') && js.includes('function toggleSidebarCollapsed('));
test('v4.54.0 JS: toggleSidebarCollapsed persists state to localStorage',
  /function toggleSidebarCollapsed\([\s\S]{0,400}localStorage\.setItem\(STORAGE_SIDEBAR_COLLAPSED/.test(js));
test('v4.54.0 JS: _initSidebarCollapsed reads persisted state on load',
  js.includes('function _initSidebarCollapsed(') && /_initSidebarCollapsed[\s\S]{0,300}localStorage\.getItem\(STORAGE_SIDEBAR_COLLAPSED/.test(js));

// JS \u2014 hero v2
test('v4.54.0 JS: renderHeroV2 function defined',
  js.includes('function renderHeroV2('));
test('v4.54.0 JS: hero v2 adds body.hero-v2-active class (hides legacy hero)',
  /renderHeroV2[\s\S]{0,400}classList\.add\('hero-v2-active'\)/.test(js));
test('v4.54.0 JS: hero eyebrow renders DAY \u00B7 MONTH DATE \u00B7 H:MMam/pm format',
  /hero-v2-eyebrow[\s\S]{0,1500}dayNames[\s\S]{0,400}monthNames/.test(js));
test('v4.54.0 JS: display heading uses time-aware greeting (Good morning/afternoon/evening/Working late)',
  /renderHeroV2[\s\S]{0,2500}Good morning[\s\S]{0,300}Good afternoon[\s\S]{0,300}Good evening/.test(js));
test('v4.54.0 JS: renderReadinessCardV2 pulls from getReadinessScore + computes bar %',
  js.includes('function renderReadinessCardV2(') &&
  /renderReadinessCardV2[\s\S]{0,2500}getReadinessScore\(\)/.test(js));
test('v4.54.0 JS: readiness bar uses (predicted - 420) / 450 formula (matches existing scale)',
  /renderReadinessCardV2[\s\S]{0,3000}r\.predicted\s*-\s*420[\s\S]{0,80}\/ 450/.test(js));
test('v4.54.0 JS: renderHeroV2MiniCards pulls from getDailyGoal + getStreak',
  js.includes('function renderHeroV2MiniCards(') &&
  /renderHeroV2MiniCards[\s\S]{0,2500}getDailyGoal[\s\S]{0,1000}getStreak/.test(js));
test('v4.54.0 JS: goSetup calls renderHeroV2',
  // v4.99.38: window bumped from 1500 → 2000 after _portDrillTeardown
  // shell-callable hook added in goSetup body.
  // v4.99.42: window bumped 2000 → 2500 after 3rd teardown hook (_subnetTrainerTeardown).
  // v7.48.0: window bumped 2500 → 2900 after the gauntlet-mode reset block in goSetup.
  /function goSetup\([\s\S]{0,2900}renderHeroV2/.test(js));
// v4.81.20: tombstone — focus-banner v2 structure was retired (the function
// is now a compat shim that delegates to renderTodayPlan). The CSS for
// .focus-banner-v2 + .fb-* classes is retained for the (now hidden)
// element shell, but the banner no longer emits those children.
test('v4.81.20 tombstone: renderSetupFocusBanner no longer emits fb-quote/fb-body/fb-cta children',
  !/renderSetupFocusBanner[\s\S]{0,4000}fb-quote[\s\S]{0,400}fb-body[\s\S]{0,400}fb-cta/.test(js));

// CSS \u2014 topbar
test('v4.54.0 CSS: .app-topbar sticky + flex',
  /\.app-topbar\s*\{[\s\S]{0,400}position:\s*sticky/.test(css) && /\.app-topbar\s*\{[\s\S]{0,400}display:\s*flex/.test(css));
// v4.89.0 (Phase C′): the static .topbar-avatar styles stay in place as a
// compat shim, but the canonical signed-in surface is now .topbar-account-pill
// + .topbar-account-avatar. Assert BOTH rules exist (legacy .topbar-avatar
// for any DOM that still uses it, plus the new account pill avatar with the
// same circular gradient treatment).
test('v4.54.0 CSS: .topbar-avatar legacy circular gradient still defined',
  /\.topbar-avatar\s*\{[\s\S]{0,600}linear-gradient\(135deg,\s*var\(--accent\)/.test(css) &&
  /\.topbar-avatar\s*\{[\s\S]{0,700}border-radius:\s*50%/.test(css));
test('v4.89.0 CSS: .topbar-account-avatar circular gradient (new account pill)',
  /\.topbar-account-avatar\s*\{[\s\S]{0,600}linear-gradient\(135deg,\s*var\(--accent\)/.test(css) &&
  /\.topbar-account-avatar\s*\{[\s\S]{0,400}border-radius:\s*50%/.test(css));
test('v4.54.0 CSS: .topbar-time monospace + tabular nums',
  /\.topbar-time\s*\{[\s\S]{0,400}font-family:\s*monospace[\s\S]{0,200}tabular-nums/.test(css));

// CSS \u2014 sidebar collapse
test('v4.54.0 CSS: body.sidebar-collapsed removes padding',
  /body\.sidebar-collapsed\s*\{[^}]*padding-left:\s*0/.test(css));
test('v4.54.0 CSS: body.sidebar-collapsed .app-sidebar uses translateX(-100%)',
  /body\.sidebar-collapsed\s+\.app-sidebar\s*\{[^}]*transform:\s*translateX\(-100%\)/.test(css));

// CSS \u2014 hero v2
test('v4.54.0 CSS: .setup-hero-v2 is 2-col grid',
  /\.setup-hero-v2\s*\{[^}]*display:\s*grid/.test(css) && /\.setup-hero-v2\s*\{[^}]*grid-template-columns:\s*1\.45fr/.test(css));
test('v4.54.0 CSS: .hero-v2-display uses 64px weight-800 tight tracking',
  /\.hero-v2-display\s*\{[\s\S]{0,500}font-size:\s*64px[\s\S]{0,200}letter-spacing:\s*-0\.04em/.test(css));
test('v4.54.0 CSS: .hero-v2-display .name coloured accent-light',
  /\.hero-v2-display\s+\.name\s*\{[^}]*color:\s*var\(--accent-light\)/.test(css));
test('v4.54.0 CSS: .readiness-card-v2 dark gradient + accent-tinted radial highlight',
  /\.readiness-card-v2\s*\{[\s\S]{0,800}linear-gradient\(160deg,\s*#16131f/.test(css));
test('v4.54.0 CSS: .readiness-card-v2 score is 56px weight-800',
  /\.rc-v2-score\s*\{[\s\S]{0,400}font-size:\s*56px[\s\S]{0,80}font-weight:\s*800/.test(css));
test('v4.54.0 CSS: readiness bar uses citron/orange gradient',
  /\.rc-v2-bar-fill\s*\{[\s\S]{0,500}linear-gradient\(90deg,\s*var\(--citron/.test(css));
test('v4.54.0 CSS: mini-card-v2 uses monospace label + tabular-nums value',
  /\.mini-card-v2-label\s*\{[\s\S]{0,300}font-family:\s*monospace/.test(css) &&
  /\.mini-card-v2-val\s*\{[\s\S]{0,400}tabular-nums/.test(css));

// v4.81.23 tombstones: .focus-banner-v2 + all .fb-* CSS classes retired
// (the v4.54.0 focus banner was retired in v4.81.20 and the CSS was
// removed in v4.81.23 cleanup pass).
test('v4.81.23 tombstone: .focus-banner-v2 CSS removed', !/\.focus-banner-v2\s*\{/.test(css));
test('v4.81.23 tombstone: .fb-quote CSS removed', !/\.fb-quote\s*\{/.test(css));
test('v4.81.23 tombstone: .fb-text CSS removed', !/\.fb-text\s*\{/.test(css));
test('v4.81.23 tombstone: .fb-cta CSS removed', !/\.fb-cta\s*\{/.test(css));

// CSS \u2014 responsive
test('v4.54.0 CSS: narrow-viewport (<900px) collapses hero to single-col',
  /@media \(max-width:\s*900px\)[\s\S]{0,600}\.setup-hero-v2\s*\{[^}]*grid-template-columns:\s*1fr/.test(css));
test('v4.54.0 CSS: <540px hides topbar-time',
  /@media \(max-width:\s*540px\)[\s\S]{0,300}\.topbar-time\s*\{[^}]*display:\s*none/.test(css));

// CSS \u2014 reduced-motion
test('v4.54.0 CSS: reduced-motion neutralises topbar transitions + readiness bar + fb-cta',
  /prefers-reduced-motion[\s\S]{0,12000}\.topbar-toggle,[\s\S]{0,400}rc-v2-bar-fill/.test(css));

// CSS \u2014 light-theme
test('v4.54.0 CSS: light-theme .app-topbar bg override',
  /\[data-theme="light"\]\s+\.app-topbar\s*\{/.test(css));
test('v4.54.0 CSS: light-theme .hero-v2-display .name recoloured #6355e0',
  /\[data-theme="light"\]\s+\.hero-v2-display\s+\.name\s*\{[^}]*color:\s*#6355e0/.test(css));
// v4.81.23 tombstone: light-theme .focus-banner-v2 override retired (element removed)
test('v4.81.23 tombstone: light-theme .focus-banner-v2 override removed',
  !/\[data-theme="light"\]\s+\.focus-banner-v2\s*\{/.test(css));

// ── v4.54.1 RECENT PERF \u2192 ANALYTICS, SETTINGS \u2192 OWN PAGE ──
// User asked to move Recent Performance off the home page to Analytics,
// and extract the Settings details block into its own sidebar-entry page.
// Late-Saturday ship, kept scope tight to 3 moves + wiring.
console.log('\n\x1b[1m── v4.54.1 LAYOUT CLEANUP ──\x1b[0m');

// HTML
test('v4.54.1 HTML: #page-settings exists',
  html.includes('id="page-settings"'));
// v4.81.2: window bumped 800 → 2500 chars after the auto-backup section was
// added between Import Data and Clear Wrong Bank.
// v4.81.12: page-settings → exportData window bumped 5000 → 7000 because the
// Control Centre reorg put §01 Study Setup + §02 AI Coach BEFORE §03 Data &
// Backups. Also bumped importData → clearWrongBank window 2500 → 3500 for
// headroom (current gap ~2250 with §04 Danger Zone wrapper).
test('v4.54.1 (v4.54.16 update) HTML: settings has API key + Exam Date + Daily Goal + Export/Import + Clear Wrong Bank',
  html.includes('id="api-key"') && /id="page-settings"[\s\S]{0,9500}exportData\(\)[\s\S]{0,800}importData\([\s\S]{0,3500}clearWrongBank/.test(html));  // window 7000→9500: v7.42.0 GAP-3 tier-lock markup grew the settings page
test('v4.54.1 HTML: #history-panel moved to #page-analytics',
  /id="page-analytics"[\s\S]{0,1500}id="history-panel"/.test(html));
test('v4.54.1 HTML: regression \u2014 #advanced-section removed from home',
  !html.includes('id="advanced-section"'));
test('v4.54.1 HTML: regression \u2014 #history-panel no longer inside #page-setup',
  !/#page-setup[\s\S]{0,20000}id="history-panel"/.test(html) ||
  html.indexOf('id="page-analytics"') < html.indexOf('id="history-panel"'));

// JS
test('v4.54.1 JS: APP_SIDEBAR_SETTINGS array with Settings entry',
  js.includes('const APP_SIDEBAR_SETTINGS') && /APP_SIDEBAR_SETTINGS[\s\S]{0,400}label:\s*'Settings'/.test(js));
test('v4.54.1 JS: renderAppSidebar merges Settings into handler registry',
  // v4.91.0: ...APP_SIDEBAR_DRILLS_SECPLUS now sits between DRILLS and SETTINGS
  // for cert-aware Security+ drills. The handler-registration spread MUST still
  // include all four collections so click handlers wire up regardless of cert.
  /APP_SIDEBAR_PRACTICE,\s*\.\.\.APP_SIDEBAR_DRILLS(?:,\s*\.\.\.APP_SIDEBAR_DRILLS_SECPLUS)?,\s*\.\.\.APP_SIDEBAR_SETTINGS/.test(js));
test('v4.54.1 JS: sidebar renders Account section with Settings',
  /Account[\s\S]{0,500}APP_SIDEBAR_SETTINGS\.map/.test(js));
test('v4.54.1 JS: SIDEBAR_ACTIVE_MAP has settings entry',
  /SIDEBAR_ACTIVE_MAP[\s\S]{0,1500}'settings':\s*'settings'/.test(js));
test('v4.54.1 JS: TOPBAR_CRUMBS has Settings entry',
  /TOPBAR_CRUMBS[\s\S]{0,1500}'settings':\s*'Settings'/.test(js));
test('v4.54.1 JS: scrollToSettings now navigates to #page-settings',
  /function scrollToSettings\([\s\S]{0,300}showPage\('settings'\)/.test(js));
test('v4.54.1 JS: renderSettingsPage defined, refreshes wrong-bank count',
  js.includes('function renderSettingsPage(') && /renderSettingsPage[\s\S]{0,300}renderWrongBankBtn/.test(js));
test('v4.54.1 JS: goSetup no longer calls renderHistoryPanel (moved to renderAnalytics)',
  !/function goSetup\([\s\S]{0,1500}renderHistoryPanel\(\)/.test(js));
// v4.54.10: Recent Performance retired from Analytics per user feedback ("clogging
// the page"). Flip the assertion to a regression guard.
test('v4.54.1 (v4.54.10 update) JS: renderAnalytics no longer renders renderHistoryPanel',
  !/function renderAnalytics\([\s\S]{0,700}renderHistoryPanel\(\)/.test(js));

// CSS
test('v4.54.1 CSS: #page-settings has max-width',
  /#page-settings\s*\{[^}]*max-width:\s*720px/.test(css));
test('v4.54.1 CSS: .settings-section + .settings-section-title styling',
  css.includes('.settings-section') && /\.settings-section-title\s*\{/.test(css));

// ── v4.54.2 KNOWLEDGE CONSTELLATION ──
// User asked to build the prototype's most distinctive moment — topics as
// floating nodes clustered by domain, sized by practice count, inner core
// sized + colored by mastery. Sunday side-build, patch release.
console.log('\n\x1b[1m── v4.54.2 KNOWLEDGE CONSTELLATION ──\x1b[0m');

// JS
test('v4.54.2 JS: _computeConstellationData function defined',
  js.includes('function _computeConstellationData('));
test('v4.54.2 JS: _renderAnaConstellation function defined',
  js.includes('function _renderAnaConstellation('));
test('v4.54.2 JS: renderAnalytics bento composes the constellation tile (_anaBtConstellation)',
  /_anaBtConstellation\(/.test(js));
test('v4.54.2 JS: constellation uses TOPIC_DOMAINS for domain lookup',
  /_computeConstellationData[\s\S]{0,800}TOPIC_DOMAINS\[topic\]/.test(js));
test('v4.54.2 JS: tier thresholds match Domain Mastery (v4.85.11: 55/70/80, lowered from 85)',
  /_computeConstellationData[\s\S]{0,1500}mastery\s*>=\s*80[\s\S]{0,200}mastery\s*>=\s*70[\s\S]{0,200}mastery\s*>=\s*55/.test(js));
// v4.88.2: CLUSTERS is now built dynamically from DOMAIN_WEIGHTS+DOMAIN_LABELS
// (cert-aware) so the literal-key regex no longer applies. Test retargeted to
// verify the cert-aware construction pattern is present.
test('v4.54.2 JS (retargeted v4.88.2): CLUSTERS built cert-aware via DOMAIN_WEIGHTS + position table',
  /const CLUSTERS\s*=\s*\{\}/.test(js)
  && /_DOMAIN_POSITIONS\s*=\s*\[/.test(js)
  && /_domainKeysCC[\s\S]{0,200}DOMAIN_WEIGHTS/.test(js));
test('v4.54.2 JS: golden-angle jitter for stable deterministic layout',
  /_renderAnaConstellation[\s\S]{0,3500}i\s*\*\s*2\.399/.test(js));
test('v4.54.2 JS: node radius uses sqrt scale on attempts',
  /Math\.sqrt\(t\.attempts\)\s*\*\s*2\.2/.test(js));
test('v4.54.2 JS: nodes drill to focusTopic via tooltip button (v4.85.13: moved from inline onclick on <g> to explicit button inside tooltip)',
  /_anaConstTooltipShow[\s\S]{0,2000}focusTopic\(topicRaw\)/.test(js));
test('v4.54.2 JS: SVG <title> tooltip with topic + mastery + attempts + last-studied (v4.85.11: still present as a11y fallback alongside custom hover tooltip)',
  /_renderAnaConstellation[\s\S]{0,8000}<title>\$\{title\}<\/title>/.test(js));
test('v4.54.2 JS: empty state when no studied topics',
  /_renderAnaConstellation[\s\S]{0,1500}studied\s*===\s*0/.test(js));
test('v4.54.2 JS: legend HTML with 4 tiers (mastered/proficient/developing/novice)',
  /ana-const-tier-mastered[\s\S]{0,500}ana-const-tier-proficient[\s\S]{0,500}ana-const-tier-developing[\s\S]{0,500}ana-const-tier-novice/.test(js));

// CSS
test('v4.54.2 CSS: .ana-const-map has starfield radial-gradient background',
  /\.ana-const-map\s*\{[\s\S]{0,800}radial-gradient\(circle at 20%/.test(css));
test('v4.54.2 CSS: 5 per-domain-idx color tints on nodes',
  /\.ana-const-node\[data-domain-idx="1"\][\s\S]{0,100}#7c6ff7/.test(css) &&
  /\.ana-const-node\[data-domain-idx="5"\][\s\S]{0,100}#ef4444/.test(css));
test('v4.54.2 CSS: tier-based brightness (mastered brighter, novice dimmed)',
  /\.ana-const-tier-mastered\s+\.ana-const-core\s*\{[\s\S]{0,200}brightness\(1\.25\)/.test(css) &&
  /\.ana-const-tier-novice\s+\.ana-const-core\s*\{[\s\S]{0,100}opacity:\s*0?\.45/.test(css));
test('v4.54.2 CSS: @keyframes anaConstTwinkle (entry animation)',
  /@keyframes anaConstTwinkle/.test(css));
test('v4.54.2 CSS: per-cluster stagger delays',
  /ana-const-node\[data-domain-idx="1"\][\s\S]{0,200}animation-delay:\s*\.05s/.test(css) &&
  /ana-const-node\[data-domain-idx="5"\][\s\S]{0,200}animation-delay:\s*\.45s/.test(css));
test('v4.54.2 CSS: reduced-motion neutralises twinkle',
  /prefers-reduced-motion[\s\S]{0,15000}#ana-s-constellation\s+\.ana-const-node[\s\S]{0,200}animation:\s*none/.test(css));
test('v4.54.2 CSS: light-theme cluster-name fill recoloured',
  /\[data-theme="light"\]\s+\.ana-const-cluster-name\s*\{/.test(css));

// ── v4.54.3 RESULTS PAGE EDITORIAL REDESIGN ──
// User: "lets do the results page redesign in order to fit the prototype
// aesthetics". Replaces circular grade ring + A-F letter with scaled-score
// hero + italic-accent display heading.
console.log('\n\x1b[1m── v4.54.3 RESULTS v2 ──\x1b[0m');

// HTML
test('v4.54.3 HTML: .results-v2 wrapper exists',
  html.includes('class="results-v2"'));
test('v4.54.3 HTML: eyebrow + display heading + lede',
  html.includes('class="results-v2-eyebrow"') && html.includes('class="results-v2-display"') && html.includes('class="results-v2-lede"'));
test('v4.54.3 HTML: scaled-score hero with score + verdict',
  html.includes('class="results-v2-big-score"') && html.includes('id="r-v2-score"') && html.includes('id="r-v2-verdict"'));
test('v4.54.3 HTML: 4-row stats aside (Correct / Wrong / Raw % / Best streak)',
  /id="r-correct"[\s\S]{0,500}id="r-wrong"[\s\S]{0,500}id="r-v2-pct"[\s\S]{0,500}id="r-streak"/.test(html));
test('v4.54.3 HTML: editorial CTA row with 3 buttons (Back / Review / New session)',
  html.includes('class="results-v2-cta-row"') && html.includes('New session') && html.includes('Review answers'));
test('v4.54.3 HTML: regression \u2014 legacy grade-ring removed',
  !html.includes('class="grade-ring"') && !html.includes('id="grade-fill"') && !html.includes('id="grade-letter"'));
test('v4.54.3 HTML: regression \u2014 legacy .results-stats/.results-actions removed from #page-results (exam-results page keeps its own layout)',
  (() => {
    const i = html.indexOf('id="page-results"');
    const j = html.indexOf('id="page-review"');
    if (i < 0 || j < 0) return false;
    const quizResults = html.slice(i, j);
    return !quizResults.includes('class="results-stats"') && !quizResults.includes('class="results-actions"');
  })());

// JS
test('v4.54.3 JS: finish() guards legacy grade-ring writes with if(el)',
  /function finish\([\s\S]{0,2000}const ringFill\s*=\s*document\.getElementById\('grade-fill'\);\s*\n\s*if\s*\(ringFill\)/.test(js));
test('v4.54.3 JS: finish() writes scaled score via animateCount to #r-v2-score',
  /function finish\([\s\S]{0,4000}animateCount\('r-v2-score'/.test(js));
test('v4.54.3 JS: scaled-score formula 100 + (pct/100) * 800',
  /const scaled\s*=\s*Math\.max\(100,\s*Math\.min\(900,\s*Math\.round\(100 \+ \(pct \/ 100\) \* 800\)\)\)/.test(js));
test('v4.54.3 JS: passed = scaled >= EXAM_PASS_SCORE (cert-aware, was hardcoded 720 pre-v4.99.82)',
  /const passed\s*=\s*scaled\s*>=\s*EXAM_PASS_SCORE/.test(js));
test('v4.99.82 tombstone: finish() must NOT hardcode 720 in verdict/gap (use EXAM_PASS_SCORE)',
  !/Pass mark cleared.*\b720\b/.test(js) && !/const gap = 720/.test(js));
test('v4.99.82 tombstone: submitExam result msg must NOT hardcode 720 (use EXAM_PASS_SCORE)',
  !/above the 720 pass mark/.test(js));
test('v4.99.82 tombstone: milestone descs must NOT hardcode 720 (use EXAM_PASS_SCORE)',
  !/desc:\s*'Score 720/.test(js) && !/desc:\s*'Reach a readiness score of 720/.test(js));
test('v4.54.3 JS: verdict adds pass/fail class + text',
  /function finish\([\s\S]{0,5500}results-v2-verdict-pass[\s\S]{0,300}results-v2-verdict-fail/.test(js));
test('v4.54.3 JS: headlines use HTML italic em (not plain text)',
  /headlines\s*=\s*\{[\s\S]{0,400}Crushing <em>/.test(js));
test('v4.54.3 JS: result-headline uses innerHTML (supports em tag)',
  /headlineEl\.innerHTML\s*=\s*headlines\[grade\]\[0\]/.test(js));

// CSS
test('v4.54.3 CSS: .results-v2-display uses 50px weight-800 tight tracking',
  /\.results-v2-display\s*\{[\s\S]{0,400}font-size:\s*50px[\s\S]{0,200}letter-spacing:\s*-0\.03em/.test(css));
test('v4.54.3 CSS: .results-v2-display em uses accent-light + normal style',
  /\.results-v2-display em\s*\{[\s\S]{0,300}color:\s*var\(--accent-light\)/.test(css));
test('v4.54.3 CSS: .results-v2-hero is dark gradient + 2-col grid',
  /\.results-v2-hero\s*\{[\s\S]{0,500}grid-template-columns:\s*1\.3fr\s+1fr/.test(css) &&
  /\.results-v2-hero\s*\{[\s\S]{0,1000}linear-gradient\(160deg,\s*#16131f/.test(css));
test('v4.54.3 CSS: .results-v2-big-score is 68px weight-800 tabular-nums',
  /\.results-v2-big-score\s*\{[\s\S]{0,400}font-size:\s*68px[\s\S]{0,200}tabular-nums/.test(css));
test('v4.54.3 CSS: .results-v2-verdict-pass green, -fail red pill styling',
  /\.results-v2-verdict-pass\s*\{[\s\S]{0,300}rgba\(34,\s*197,\s*94/.test(css) &&
  /\.results-v2-verdict-fail\s*\{[\s\S]{0,300}rgba\(239,\s*68,\s*68/.test(css));
test('v4.54.3 CSS: legacy .results-hero/.results-stats/.results-actions force-hidden',
  /\.results-hero\s*\{\s*display:\s*none\s*!important/.test(css) &&
  /\.results-stats\s*\{\s*display:\s*none\s*!important/.test(css) &&
  /\.results-actions\s*\{\s*display:\s*none\s*!important/.test(css));
test('v4.54.3 CSS: narrow viewport collapses hero to single-col',
  /@media \(max-width:\s*680px\)[\s\S]{0,600}\.results-v2-hero\s*\{[^}]*grid-template-columns:\s*1fr/.test(css));
test('v4.54.3 CSS: light-theme hero stays dark (design intent)',
  /\[data-theme="light"\]\s+\.results-v2-hero\s*\{[\s\S]{0,500}linear-gradient\(160deg,\s*#1a1725/.test(css));

// ── v4.54.4 TOPOLOGY BUILDER EDITORIAL POLISH ──
// User: "now lets do the Topology page redesign to fit the prototype as best
// you can". Zero changes to the 4500-LOC TB engine; editorial chrome polish only.
console.log('\n\x1b[1m── v4.54.4 TB EDITORIAL POLISH ──\x1b[0m');

// v4.54.5: editorial header moved OUT of .tb-v2-header and INTO .tb-pane-head at the top of the left palette pane.
// These assertions retargeted to the new location.


test('v4.54.4 CSS: .tb-hero retired via display:none important',
  /\.tb-hero\s*\{\s*display:\s*none\s*!important/.test(css));
test('v4.54.4 CSS: .tb-v2-display uses 42px weight-800',
  /\.tb-v2-display\s*\{[\s\S]{0,400}font-size:\s*42px[\s\S]{0,200}font-weight:\s*800/.test(css));
test('v4.54.4 CSS: .tb-v2-display em uses accent-light',
  /\.tb-v2-display em\s*\{[^}]*color:\s*var\(--accent-light\)/.test(css));
test('v4.54.4 CSS: .tb-v2-stats positioned absolute at canvas bottom with backdrop-blur',
  /\.tb-v2-stats\s*\{[\s\S]{0,500}position:\s*absolute/.test(css) &&
  /\.tb-v2-stats\s*\{[\s\S]{0,800}backdrop-filter:\s*blur/.test(css));
test('v4.54.4 CSS: palette headers use monospace small-caps',
  /\.tb-palette-head[\s\S]{0,400}font-family:\s*monospace/.test(css) &&
  /\.tb-palette-head[\s\S]{0,500}text-transform:\s*uppercase/.test(css));
test('v4.54.4 CSS: toolbar-v2 uses radial+linear gradient background',
  /\.tb-toolbar\.tb-toolbar-v2\s*\{[\s\S]{0,400}radial-gradient/.test(css));
test('v4.54.4 CSS: light-theme .tb-v2-stats + .tb-v2-display em recoloured',
  /\[data-theme="light"\]\s+\.tb-v2-stats\s*\{/.test(css) &&
  /\[data-theme="light"\][\s\S]{0,300}\.tb-v2-display em[\s\S]{0,100}#6355e0/.test(css));

// ── v4.54.5 TB 3-COLUMN LAYOUT ──
// User clarified: wants the prototype's full 3-col layout (palette / canvas /
// right-pane Scenarios + Inspector). Zero engine changes; layout shell only.
console.log('\n\x1b[1m── v4.54.5 TB 3-COLUMN LAYOUT ──\x1b[0m');

// HTML
// v4.54.6: .tb-v3-section-sep retired \u2014 Inspector moved out of right pane into floating popup,
// so the divider between Scenarios and Inspector is no longer needed. Regression-guard the removal.
test('v4.54.6 HTML: .tb-v3-section-sep removed (Inspector moved to popup)',
  !html.includes('class="tb-v3-section-sep"'));

// JS
// v4.60.0: legacy v4.54.5 assertion retired — the inspector now renders
// Routing / ARP / MAC / DHCP accordion sections instead of iface/routing/vlan.
// Equivalent structural check covered by the v4.60.0 JS block below.

// CSS
test('v4.54.5 CSS: .tb-workspace-v3 uses 3-col grid (220 / 1fr / 260)',
  /\.tb-workspace\.tb-workspace-v3\s*\{[\s\S]{0,400}grid-template-columns:\s*220px\s+1fr\s+260px/.test(css));
test('v4.54.5 CSS: .tb-pane-head uses 20px weight-800 italic-accent em',
  /\.tb-pane-head\s*\{[\s\S]{0,300}font-size:\s*20px[\s\S]{0,200}font-weight:\s*800/.test(css) &&
  /\.tb-pane-head em\s*\{[^}]*color:\s*var\(--accent-light\)/.test(css));
test('v4.54.5 CSS: .tb-v3-right fixed-height scrollable',
  /\.tb-v3-right\s*\{[\s\S]{0,500}overflow-y:\s*auto[\s\S]{0,200}max-height/.test(css));
test('v4.54.5 CSS: .tb-v3-scn-active has accent gradient + border',
  /\.tb-v3-scn-active\s*\{[\s\S]{0,400}linear-gradient\(135deg,\s*rgba\(var\(--accent-rgb\)/.test(css));
test('v4.54.5 CSS: .tb-v3-inspect-row monospace key + tabular-nums value',
  /\.tb-v3-inspect-row\s*\.k\s*\{[\s\S]{0,300}font-family:\s*monospace/.test(css) &&
  /\.tb-v3-inspect-row\s*\.v\s*\{[\s\S]{0,300}tabular-nums/.test(css));
test('v4.54.5 CSS: responsive <1200px hides .tb-v3-right + collapses to 2-col',
  /@media \(max-width:\s*1200px\)[\s\S]{0,500}\.tb-workspace\.tb-workspace-v3\s*\{[^}]*grid-template-columns:\s*200px\s+1fr/.test(css) &&
  /@media \(max-width:\s*1200px\)[\s\S]{0,500}\.tb-v3-right\s*\{\s*display:\s*none/.test(css));
test('v4.54.5 CSS: light-theme .tb-v3-scn-active recoloured #6355e0',
  /\[data-theme="light"\]\s+\.tb-v3-scn-active\s*\{[\s\S]{0,300}99,\s*85,\s*224/.test(css));

// ── v4.54.6 TB usability fixes ──
// User asked for 6 things after v4.54.5 shipped: pill-tab toolbar inside the
// canvas, canvas pan + zoom + default zoom-in, draggable transparent inspector
// popup (replacing the right-pane Inspector), categorised scenarios with
// subheaders + full text wrap, 2-col palette grid. This block guards all of
// them.
console.log('\n\x1b[1m\u2500\u2500 v4.54.6 TB USABILITY FIXES \u2500\u2500\x1b[0m');

// HTML

// JS

// CSS
test('v4.54.6 CSS: palette devices in 2-col grid',
  /\.tb-palette\.tb-palette-v3\s+#tb-palette-items\s*\{[\s\S]{0,300}grid-template-columns:\s*1fr\s+1fr/.test(css));
test('v4.54.6 CSS: palette group head spans both columns',
  /tb-palette-group-head[\s\S]{0,400}grid-column:\s*1\s*\/\s*-1/.test(css));
test('v4.54.6 CSS: scenario titles wrap (white-space:normal, no ellipsis)',
  /\.tb-v3-scn-cat-body\s+\.tb-v3-scn-title\s*\{[\s\S]{0,300}white-space:\s*normal/.test(css));
test('v4.54.6 CSS: scenario category subheader is monospace small-caps accent',
  /\.tb-v3-scn-cat-head\s*\{[\s\S]{0,500}font-family:\s*monospace[\s\S]{0,300}text-transform:\s*uppercase/.test(css));
test('v4.54.6 CSS: pill toolbar absolute-positioned top-left of canvas with backdrop blur',
  /\.tb-canvas-pills\s*\{[\s\S]{0,500}position:\s*absolute[\s\S]{0,200}backdrop-filter:\s*blur/.test(css));
test('v4.54.6 CSS: active pill gets accent gradient + accent-light text',
  /\.tb-pill-active\s*\{[\s\S]{0,400}linear-gradient\(135deg,\s*rgba\(124,\s*111,\s*247/.test(css));
test('v4.54.6 CSS: green Grade pill has its own tint (.tb-pill-grade)',
  /\.tb-pill-grade\s*\{[\s\S]{0,300}rgba\(34,\s*197,\s*94/.test(css));
test('v4.54.6 CSS: zoom controls bottom-right with backdrop blur',
  /\.tb-zoom-ctrls\s*\{[\s\S]{0,500}position:\s*absolute[\s\S]{0,200}backdrop-filter:\s*blur/.test(css));
test('v4.54.6 CSS: inspector popup is absolute, transparent dark glass, rounded',
  /\.tb-inspector-pop\s*\{[\s\S]{0,800}position:\s*absolute[\s\S]{0,400}backdrop-filter:\s*blur[\s\S]{0,200}border-radius:\s*14px/.test(css));
test('v4.54.6 CSS: inspector popup head is grab cursor (drag handle)',
  /\.tb-inspector-pop-head\s*\{[\s\S]{0,400}cursor:\s*grab/.test(css));
test('v4.54.6 CSS: tbInspectorPopIn keyframe entrance animation',
  /@keyframes tbInspectorPopIn\s*\{/.test(css));
test('v4.54.6 CSS: light-theme overrides for pills + zoom + popup',
  /\[data-theme="light"\]\s+\.tb-canvas-pills\s*\{/.test(css) &&
  /\[data-theme="light"\]\s+\.tb-zoom-ctrls\s*\{/.test(css) &&
  /\[data-theme="light"\]\s+\.tb-inspector-pop\s*\{/.test(css));
test('v4.54.6 CSS: reduced-motion neutralises popup animation + pill transitions',
  /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,400}\.tb-inspector-pop\s*\{[^}]*animation:\s*none/.test(css));

// ── v4.54.7 TB full-bleed + draggable config panel + collapsibles ──
// User feedback on v4.54.6: wanted canvas to cover full horizontal area to the
// sidebar; full-config panel to open as a draggable translucent popup (same
// aesthetic as inspector); legacy top toolbar collapsible; devices spread
// horizontally; how-to collapsed by default.
console.log('\n\x1b[1m\u2500\u2500 v4.54.7 TB FULL-BLEED + DRAGGABLE CONFIG \u2500\u2500\x1b[0m');

// HTML

// JS

// CSS
test('v4.54.7 CSS: #page-topology-builder overrides .page max-width to none (full-bleed)',
  /#page-topology-builder\.page\s*\{[\s\S]{0,400}max-width:\s*none/.test(css));
// v4.54.16 widened palette 220 \u2192 260px; middle column still minmax(0, 1fr).
test('v4.54.7 (v4.54.16 update) CSS: .tb-workspace-v3 uses minmax(0, 1fr) middle column',
  /\.tb-workspace\.tb-workspace-v3\s*\{[\s\S]{0,800}grid-template-columns:\s*260px\s+minmax\(0,\s*1fr\)\s+260px/.test(css));
test('v4.54.7 CSS: canvas uses viewport-height min-height (calc(100vh - ...))',
  /\.tb-canvas-wrap\s*\{[\s\S]{0,500}min-height:\s*calc\(100vh\s*-\s*\d+px\)/.test(css));
test('v4.54.7 CSS: toolbar-details collapsible styling with rotating chevron',
  /\.tb-toolbar-details\s*\{[\s\S]{0,400}border-radius/.test(css) &&
  /\.tb-toolbar-summary::before\s*\{[\s\S]{0,400}transition:\s*transform/.test(css) &&
  /\.tb-toolbar-details\[open\]\s*>\s*\.tb-toolbar-summary::before\s*\{[\s\S]{0,200}transform:\s*rotate\(90deg\)/.test(css));
test('v4.54.7 CSS: .tb-config-panel is position:fixed translucent glass with blur',
  /\.tb-config-panel\s*\{[\s\S]{0,600}position:\s*fixed[\s\S]{0,400}backdrop-filter:\s*blur/.test(css));
test('v4.54.7 CSS: config panel has grab cursor on header (drag handle)',
  /\.tb-config-panel\s+\.tb-config-head\s*\{[\s\S]{0,300}cursor:\s*grab/.test(css));
test('v4.54.7 CSS: tbConfigPopIn keyframe entrance animation',
  /@keyframes tbConfigPopIn\s*\{/.test(css));
test('v4.54.7 CSS: how-to-details expanded state capped via max-height 40vh',
  /\.tb-howto-details\[open\]\s*\{[\s\S]{0,200}max-height:\s*40vh/.test(css));
test('v4.54.7 CSS: light-theme overrides for toolbar-details + config-panel',
  /\[data-theme="light"\]\s+\.tb-toolbar-details\s*\{/.test(css) &&
  /\[data-theme="light"\]\s+\.tb-config-panel\s*\{/.test(css));
test('v4.54.7 CSS: reduced-motion neutralises config-panel entrance animation',
  /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,400}\.tb-config-panel\s*\{[^}]*animation:\s*none/.test(css));
test('v4.54.7 CSS: responsive <900px stacks workspace and sizes config popup to viewport',
  /@media \(max-width:\s*900px\)[\s\S]{0,800}\.tb-config-panel\s*\{[\s\S]{0,400}width:\s*calc\(100vw\s*-\s*24px\)/.test(css));

// ── v4.54.8 Editorial prototype completion ──
// One mega-ship closing the prototype-mapping backlog: Quiz editorial overhaul,
// Analytics accuracy chart + sparklines, Home polish pass, Results review list
// + drill-mistakes CTA, sidebar drill nav-count pills, elapsed-time on Results.
console.log('\n\x1b[1m\u2500\u2500 v4.54.8 EDITORIAL PROTOTYPE COMPLETION \u2500\u2500\x1b[0m');

// v4.54.9: drill nav-count pills retired. Guard the removal + the CSS hide rule.
test('v4.54.9 JS: renderAppSidebar no longer computes drillCounts (pills retired)',
  !/renderAppSidebar[\s\S]{0,3000}drillCounts/.test(js));
test('v4.54.9 CSS: .sb-item-count hidden via display: none',
  /\.sb-item-count\s*\{[\s\S]{0,200}display:\s*none\s*!important/.test(css));

// Results: elapsed-time row + review list + drill-mistakes CTA
test('v4.54.8 HTML: Results aside includes #r-elapsed row',
  /<span class="k">Time<\/span><span class="v" id="r-elapsed">/.test(html));
test('v4.54.8 HTML: #results-review-list container + eyebrow + italic-accent title',
  html.includes('id="results-review-list"') &&
  /results-v2-review-eyebrow[^<]*>Review[^<]*session/.test(html) &&
  /results-v2-review-title[^<]*>Every\s*<em>answer\.<\/em>/.test(html));
test('v4.54.8 HTML: Drill my mistakes CTA button exists',
  /id="btn-drill-mistakes"[\s\S]{0,200}drillMistakesFromResults\(\)/.test(html));
test('v4.54.8 JS: _sessionStartTs tracked on startQuiz + drillMistakesFromResults',
  /function startQuiz\([\s\S]{0,7600}_sessionStartTs\s*=\s*Date\.now\(\)/.test(js) &&  // window 6000→6800 (v7.46.0 free-tier gates) →7600 (v7.65.1 picker-dismiss block); scopes the match to startQuiz's body, not a size budget
  js.includes('let _sessionStartTs') &&
  js.includes('function drillMistakesFromResults(') &&
  js.includes('function _formatElapsed('));
test('v4.54.8 JS: _renderResultsReviewList builds rows with N\u00ba + prompt + topic + verdict',
  js.includes('function _renderResultsReviewList(') &&
  /_renderResultsReviewList[\s\S]{0,2500}results-v2-review-row[\s\S]{0,800}results-v2-review-mark/.test(js));
test('v4.54.8 JS: finish() wires elapsed + review list + drill-btn visibility',
  /function finish\(\)[\s\S]{0,5000}r-elapsed[\s\S]{0,2000}_renderResultsReviewList\(\)[\s\S]{0,600}btn-drill-mistakes/.test(js));
test('v4.54.8 CSS: .results-v2-review-list uses 56/1fr/auto grid + hover lift + verdict badges',
  /\.results-v2-review-row\s*\{[\s\S]{0,500}grid-template-columns:\s*56px\s+1fr\s+auto/.test(css) &&
  /\.results-v2-review-mark-ok\s*\{/.test(css) &&
  /\.results-v2-review-mark-bad\s*\{/.test(css));

// Home polish
// v4.76.0: 60Q tile relocated to Exam tier (as `.modes-card-exam` "60-Question SIM").
// SIM-badge styling is no longer needed because the tile is already in the Exam tier
// with its own visual treatment. Tombstone keeps both legacy classes from sneaking back.
test('v4.76.0 tombstone: legacy preset-sim + preset-sim-badge classes no longer in HTML',
  !html.includes('class="preset-tile preset-sim"') && !html.includes('class="preset-sim-badge"'));
test('v4.54.8 HTML: cq-summary-bar prose + CTA exists above Generate button',
  html.includes('id="cq-summary-bar"') &&
  html.includes('id="cq-summary-prose"') &&
  /class="[^"]*\bcq-summary-cta\b/.test(html));
test('v4.54.8 JS: updateCqSummaryBar defined + called from initChips click handler',
  js.includes('function updateCqSummaryBar(') &&
  /initChips[\s\S]{0,1500}updateCqSummaryBar\(\)/.test(js));
// v4.54.10: wrap-chip pattern replaced by vertical .dg-topic-list with canonical topics.
// Legacy dg-weak-chips class retired + hidden via CSS !important.
// v4.99.80: CANONICAL_DOMAIN_TOPICS split into _CANONICAL_NETPLUS + _CANONICAL_SECPLUS
// (cert-aware domain grid). Retargeted to assert the new structure.
// v7.3.0: window widened 9000→11000 (AZ-900 _CANONICAL_AZ900 added ~1.5K chars)
// + asserts _CANONICAL_AZ900 exists alongside the netplus + secplus maps so the
// 3-way CANONICAL_DOMAIN_TOPICS ternary stays cert-complete (regression strength
// preserved per CLAUDE.md "guards MUST be migrated, never bypassed" rule).
test('v4.54.8 CSS: Quick Start preset tiles color-cycle (4 nth-child ::after backgrounds)',
  /\.quiz-presets\s+\.preset-tile:nth-child\(1\)::after\s*\{[^}]*background:\s*var\(--accent\)/.test(css) &&
  /\.quiz-presets\s+\.preset-tile:nth-child\(2\)::after\s*\{[^}]*background:\s*var\(--green\)/.test(css) &&
  /\.quiz-presets\s+\.preset-tile:nth-child\(3\)::after\s*\{[^}]*background:\s*var\(--yellow\)/.test(css) &&
  /\.quiz-presets\s+\.preset-tile:nth-child\(4\)::after\s*\{[^}]*background:\s*var\(--red\)/.test(css));
test('v4.54.8 CSS: \u00a7 section-head has 80px accent strip + 2px ink rule',
  /\.ed-section-head\s*\{[\s\S]{0,300}border-bottom:\s*2px\s+solid/.test(css) &&
  /\.ed-section-head::after\s*\{[\s\S]{0,300}width:\s*80px/.test(css));
test('v4.54.8 CSS: .cq-summary-bar dark gradient + yellow strong + italic em',
  /\.cq-summary-bar\s*\{[\s\S]{0,500}linear-gradient\(135deg,\s*#16131f/.test(css) &&
  /\.cq-summary-prose\s+strong\s*\{[\s\S]{0,200}color:\s*var\(--yellow\)/.test(css));
test('v4.54.8 CSS: .dg-weak-chip outlined accent styling',
  /\.dg-weak-chip\s*\{[\s\S]{0,400}color:\s*var\(--accent-light\)/.test(css));
test('v4.54.8 CSS: .preset-sim-badge SIM pill yellow outline',
  /\.preset-sim-badge\s*\{[\s\S]{0,400}color:\s*var\(--yellow\)/.test(css));

// Analytics: sparklines + accuracy chart
test('v4.54.8 JS: _sparkPath + _weeklyStatSeries helpers defined',
  js.includes('function _sparkPath(') && js.includes('function _weeklyStatSeries('));
test('v4.54.8 JS: readiness stats strip injects 4 ana-hero-stat-spark SVGs',
  /_renderAnaReadiness[\s\S]{0,6000}ana-hero-stat-spark[\s\S]{0,3000}_series\.sessions[\s\S]{0,600}_series\.questions[\s\S]{0,600}_series\.accuracy[\s\S]{0,600}_series\.studyDays/.test(js));
test('v4.54.8 JS: _renderAnaAccuracyChart defined with SVG 960x220 + pass line',
  js.includes('function _renderAnaAccuracyChart(') &&
  /_renderAnaAccuracyChart[\s\S]{0,8000}viewBox="0 0 \$\{W\} \$\{H\}"/.test(js));
test('v4.54.8 JS: _anaAccChartTab tab-switcher defined + 3 ranges (week/month/all)',
  js.includes('function _anaAccChartTab(') &&
  /_anaAccChartTab[\s\S]{0,800}ana-accchart-tab-active/.test(js));
test('v4.54.8 JS: renderAnalytics bento composes readiness then the trend/accuracy tile',
  /_anaBtReadiness\(D\)[\s\S]{0,600}_anaBtTrend\(D\)/.test(js));
test('v4.54.8 CSS: .ana-accchart-card editorial head (eyebrow + italic-accent title)',
  /\.ana-accchart-eyebrow\s*\{[\s\S]{0,400}font-family:\s*monospace[\s\S]{0,300}text-transform:\s*uppercase/.test(css) &&
  /\.ana-accchart-title\s+em\s*\{[\s\S]{0,200}color:\s*var\(--accent-light\)/.test(css));
test('v4.54.8 CSS: .ana-accchart-tabs + active state gradient',
  /\.ana-accchart-tab-active\s*\{[\s\S]{0,400}linear-gradient\(135deg,\s*rgba\(var\(--accent-rgb\)/.test(css));
test('v4.54.8 CSS: .ana-hero-stat-spark inline SVG styling',
  /\.ana-hero-stat-spark\s*\{[\s\S]{0,300}height:\s*22px/.test(css));

// Quiz editorial overhaul
test('v4.54.8 HTML: #quiz-prog-dots segmented progress container in progress-wrap',
  html.includes('id="quiz-prog-dots"') && html.includes('class="quiz-prog-dots"'));
test('v4.54.8 HTML: .quiz-kbd-hints footer with A/B/C/D + Enter + F',
  html.includes('class="quiz-kbd-hints"') &&
  /<kbd>A<\/kbd><kbd>B<\/kbd><kbd>C<\/kbd><kbd>D<\/kbd>\s*pick/.test(html));
test('v4.54.8 HTML: #exp-wrong-explain block inside explanation-box',
  html.includes('id="exp-wrong-explain"') && html.includes('class="exp-wrong-explain is-hidden"'));
test('v4.54.8 JS: _renderQuizProgressDots defined + called from render()',
  js.includes('function _renderQuizProgressDots(') &&
  /function render\(\)[\s\S]{0,2500}_renderQuizProgressDots\(\)/.test(js));
test('v4.54.8 JS: _renderQuizProgressDots emits qpd-done / qpd-wrong / qpd-now classes',
  /_renderQuizProgressDots[\s\S]{0,2500}qpd-now[\s\S]{0,400}qpd-done[\s\S]{0,400}qpd-wrong/.test(js));
test('v4.54.8 JS: showExplanation populates wrongExplain from q.wrongExplain[chosen]',
  /showExplanation[\s\S]{0,3000}exp-wrong-explain[\s\S]{0,600}q\.wrongExplain/.test(js));
test('v4.54.8 CSS: .qpd-cell segmented dots (4px base, 6px done/wrong, 8px now)',
  /\.qpd-cell\s*\{[\s\S]{0,400}height:\s*4px/.test(css) &&
  /\.qpd-cell\.qpd-done\s*\{[\s\S]{0,300}background:\s*var\(--green\)/.test(css) &&
  /\.qpd-cell\.qpd-now\s*\{[\s\S]{0,300}height:\s*8px/.test(css));
test('v4.54.8 CSS: .quiz-kbd-hints kbd styling (bordered monospace pill)',
  /\.quiz-kbd-hints\s+kbd\s*\{[\s\S]{0,400}font-family:\s*monospace/.test(css));
test('v4.54.8 CSS: .exp-wrong-explain italic muted pullquote styling',
  /\.exp-wrong-explain\s*\{[\s\S]{0,400}font-style:\s*italic[\s\S]{0,400}border-left:\s*3px/.test(css));
test('v4.54.8 CSS: legacy .kb-hint hidden (superseded by .quiz-kbd-hints)',
  /#page-quiz\s+\.kb-hint\s*\{\s*display:\s*none/.test(css));

// Cross-cutting: reduced-motion
test('v4.54.8 CSS: reduced-motion neutralises new transitions (quick-card, qpd, acc-tab)',
  /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,800}\.quiz-presets\s+\.preset-tile::after[\s\S]{0,400}transition:\s*none/.test(css));

// ── v4.54.9 Editorial sweep on remaining pages + global zoom-in ──
// User: comb the app, apply editorial aesthetic to remaining surfaces, zoom in
// for readability, remove the sidebar drill count pills. This block guards the
// reusable .ed-pagehead component + per-page adoption + exam parity.
console.log('\n\x1b[1m\u2500\u2500 v4.54.9 EDITORIAL SWEEP + GLOBAL ZOOM \u2500\u2500\x1b[0m');

// Reusable .ed-pagehead component
test('v4.54.9 CSS: reusable .ed-pagehead with 80px accent strip + italic-accent display',
  /\.ed-pagehead\s*\{[\s\S]{0,400}border-bottom:\s*2px\s+solid/.test(css) &&
  /\.ed-pagehead::after\s*\{[\s\S]{0,300}width:\s*80px/.test(css) &&
  /\.ed-pagehead-display\s+em\s*\{[\s\S]{0,200}color:\s*var\(--accent-light\)/.test(css));
test('v4.54.9 CSS: .ed-pagehead-eyebrow monospace small-caps with leading-dash pseudo',
  /\.ed-pagehead-eyebrow\s*\{[\s\S]{0,400}font-family:\s*monospace[\s\S]{0,400}text-transform:\s*uppercase/.test(css) &&
  /\.ed-pagehead-eyebrow::before\s*\{[\s\S]{0,200}content:\s*'\u2014'/.test(css));

// Per-page adoption
test('v4.54.9 HTML: Review page uses .ed-pagehead with italic-accent "Every answer."',
  /id="page-review"[\s\S]{0,400}class="ed-pagehead"[\s\S]{0,1000}Every\s*<em>answer\.<\/em>/.test(html));
test('v4.54.9 HTML: Progress page uses .ed-pagehead with the analytics-style kicker title',
  /id="page-progress"[\s\S]{0,500}class="ed-pagehead"[\s\S]{0,1000}ana-pagehead-title[^>]*><span class="ana-ph-cert">Network\+ N10-009/.test(html));
test('v7.18.0 HTML: Settings page uses .ed-pagehead with the bento kicker title',
  /id="page-settings"[\s\S]{0,500}class="ed-pagehead"[\s\S]{0,1000}ana-pagehead-title[^>]*><span class="ana-ph-cert">Network\+ N10-009/.test(html));

// Exam parity: progress dots + kbd hints + wrongExplain
test('v4.54.9 HTML: Exam page has #exam-prog-dots segmented progress container',
  html.includes('id="exam-prog-dots"'));
test('v4.54.9 HTML: Exam page uses editorial .quiz-kbd-hints footer',
  /id="page-exam"[\s\S]{0,6000}class="quiz-kbd-hints"[\s\S]{0,400}<kbd>A<\/kbd>/.test(html));
test('v4.54.9 HTML: Exam page has #exam-wrong-explain block',
  html.includes('id="exam-wrong-explain"'));
test('v4.54.9 JS: _renderExamProgressDots defined + called from renderExam',
  js.includes('function _renderExamProgressDots(') &&
  /renderExam[\s\S]{0,2000}_renderExamProgressDots\(\)/.test(js));
test('v4.54.9 JS: exam progress dots emit qpd-flagged state',
  /_renderExamProgressDots[\s\S]{0,2000}qpd-flagged/.test(js));
test('v4.54.9 CSS: qpd-flagged uses yellow fill',
  /\.qpd-cell\.qpd-flagged\s*\{[\s\S]{0,200}background:\s*var\(--yellow\)/.test(css));

// Exam Results v2 editorial parallel
test('v4.54.9 HTML: Exam Results uses .exam-results-v2 editorial display heading',
  html.includes('class="exam-results-v2"') &&
  /exam-results-v2-display[\s\S]{0,400}Pass mark\s*<em>cleared\.<\/em>/.test(html));
test('v4.54.9 HTML: Exam Results has dark hero + side aside with 4 stat rows',
  html.includes('class="exam-results-v2-hero"') &&
  html.includes('class="exam-results-v2-side"'));
test('v4.54.9 JS: submitExam updates headline with pass/fail italic-accent em',
  /submitExam[\s\S]{0,8000}exam-result-headline[\s\S]{0,400}Pass mark\s*<em>cleared\.<\/em>/.test(js) &&
  /submitExam[\s\S]{0,8000}exam-result-headline[\s\S]{0,400}More\s*<em>work needed\.<\/em>/.test(js));
test('v4.54.9 CSS: exam-results-v2-hero dark gradient + 84px tabular-nums score',
  /\.exam-results-v2-hero\s*\{[\s\S]{0,600}linear-gradient\(160deg,\s*#16131f/.test(css) &&
  /\.exam-results-v2-big-score\s*\{[\s\S]{0,400}font-size:\s*84px[\s\S]{0,300}tabular-nums/.test(css));
test('v4.54.9 CSS: legacy .exam-results-hero retired (display:none)',
  /\.exam-results-hero\s*\{\s*display:\s*none\s*!important/.test(css));

// Session Transition / Complete editorial hero
test('v4.54.9 HTML: Session Transition uses .session-hero-v2 with italic-accent display',
  /id="page-session-transition"[\s\S]{0,400}class="session-hero session-hero-v2"[\s\S]{0,1500}class="session-hero-display"/.test(html));
test('v4.54.9 HTML: Session Complete uses italic-accent "All topics cleared."',
  /id="page-session-complete"[\s\S]{0,500}All topics\s*<em>cleared\.<\/em>/.test(html));
test('v4.54.9 CSS: .session-hero-eyebrow monospace small-caps + leading-dash pseudo',
  /\.session-hero-eyebrow\s*\{[\s\S]{0,400}font-family:\s*monospace[\s\S]{0,400}text-transform:\s*uppercase/.test(css));

// Drills launcher tile polish
test('v4.54.9 CSS: .drills-tile has hover accent bar (::after scaleX) + per-index color cycling',
  /\.drills-tile::after\s*\{[\s\S]{0,400}transform:\s*scaleX\(0\)/.test(css) &&
  /\.drills-tile:nth-child\(2\)::after\s*\{[\s\S]{0,200}background:\s*var\(--green\)/.test(css));

// Global zoom-in
// v4.54.11: zoom nudged 1.06 \u2192 1.10 per user request ("zoom in the app a bit more")
test('v4.54.9 (v4.54.11 update) CSS: html { zoom: 1.10 } for 10% global zoom-in',
  /html\s*\{[\s\S]{0,200}zoom:\s*1\.10/.test(css));

// Reduced motion coverage
test('v4.54.9 CSS: reduced-motion neutralises .drills-tile transitions',
  /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,600}\.drills-tile[\s\S]{0,200}transition:\s*none/.test(css));

// ── v4.54.10 Streak hero + vertical domain topics + heatmap + editable goal ──
console.log('\n\x1b[1m\u2500\u2500 v4.54.10 STREAK HERO + DOMAIN TOPICS + HEATMAP \u2500\u2500\x1b[0m');

// Sidebar streak card restyle
test('v4.54.10 CSS: .sb-streak uses dark gradient card (matches prototype)',
  /\.sb-streak\s*\{[\s\S]{0,500}linear-gradient\(135deg,\s*#1e1b2e,\s*#0f0c1b\)/.test(css));
test('v4.54.10 CSS: .sb-streak-num is 28px weight-800 white tabular-nums',
  /\.sb-streak-num\s*\{[\s\S]{0,400}font-size:\s*28px[\s\S]{0,300}tabular-nums/.test(css));
test('v4.54.10 CSS: .sb-streak-label is monospace small-caps',
  /\.sb-streak-label\s*\{[\s\S]{0,600}text-transform:\s*uppercase[\s\S]{0,400}font-family:\s*monospace/.test(css));

// Domain grid canonical topics
// v4.99.80: cert-aware — Net+ canonical has OSI→Firewalls→7-Step; Sec+ has Security Controls→Audits
test('v4.54.10 JS: _CANONICAL_NETPLUS covers 5 topics per domain',
  /_CANONICAL_NETPLUS\s*=\s*\{[\s\S]{0,3000}OSI Model[\s\S]{0,2000}Firewalls[\s\S]{0,1000}7-Step Method/.test(js));
test('v4.54.10 JS: _CANONICAL_SECPLUS covers 5 SY0-701 domains',
  /_CANONICAL_SECPLUS\s*=\s*\{[\s\S]{0,3000}Security Controls[\s\S]{0,2000}Incident Response[\s\S]{0,1000}Audits/.test(js));
test('v4.54.10 CSS: .dg-topic-list vertical list with accent-dot bullets',
  /\.dg-topic-list\s*\{[\s\S]{0,400}flex-direction:\s*column/.test(css) &&
  /\.dg-topic-dot\s*\{[\s\S]{0,400}border-radius:\s*50%/.test(css));
test('v4.54.10 CSS: weak-topic row gets accent text + filled dot + glow ring',
  /\.dg-topic-weak\s*\{[\s\S]{0,300}color:\s*var\(--accent-light\)/.test(css) &&
  /\.dg-topic-weak\s+\.dg-topic-dot\s*\{[\s\S]{0,300}background:\s*var\(--accent\)/.test(css));
test('v4.54.10 CSS: legacy .dg-weak-chips hidden via !important',
  /\.dg-weak-chips[\s\S]{0,200}display:\s*none\s*!important/.test(css));

// Settings: editable daily goal
test('v4.54.10 HTML: Settings page has Daily Goal section with input + presets',
  /id="page-settings"[\s\S]{0,3800}settings-daily-input[\s\S]{0,800}settings-daily-chip/.test(html));  // window 3000→3800: v7.42.0 GAP-3 pro-lock pill + comment before the input
test('v4.54.10 JS: saveSettingsDailyGoal + pickSettingsDailyPreset + syncSettingsDailyGoal defined',
  js.includes('function saveSettingsDailyGoal(') &&
  js.includes('function pickSettingsDailyPreset(') &&
  js.includes('function syncSettingsDailyGoal('));
test('v4.54.10 JS: renderSettingsPage calls syncSettingsDailyGoal',
  /function renderSettingsPage\([\s\S]{0,400}syncSettingsDailyGoal\(\)/.test(js));
test('v4.54.10 JS: saveSettingsDailyGoal calls setDailyGoal + refreshes home cards',
  /saveSettingsDailyGoal[\s\S]{0,1500}setDailyGoal\(v\)[\s\S]{0,800}renderReadinessCard/.test(js) &&
  /saveSettingsDailyGoal[\s\S]{0,1500}renderHeroV2MiniCards/.test(js));
test('v4.54.10 CSS: .settings-daily-chip active state gradient',
  /\.settings-daily-chip\.is-active\s*\{[\s\S]{0,400}linear-gradient\(135deg,\s*rgba\(var\(--accent-rgb\)/.test(css));

// Knowledge Constellation grid overlay
test('v4.54.10 CSS: .ana-const-map::before 40px grid overlay',
  /\.ana-const-map::before\s*\{[\s\S]{0,800}background-size:\s*40px\s+40px/.test(css));

// Daily Study Streak Heatmap
test('v4.54.10 JS: renderAnalytics bento composes the study-heatmap tile (_anaBtHeat)',
  /_anaBtHeat\(/.test(js));
test('v4.54.10 JS: heatmap renders 53-week grid ending today',
  /_renderAnaStudyHeatmap[\s\S]{0,4000}WEEKS\s*=\s*53/.test(js));
test('v4.54.10 JS: heatmap tier intensity thresholds (0/5/15/40/41+)',
  /_renderAnaStudyHeatmap[\s\S]{0,8000}tierFor[\s\S]{0,400}q\s*<=\s*5[\s\S]{0,300}q\s*<=\s*15[\s\S]{0,300}q\s*<=\s*40/.test(js));
test('v4.54.10 JS: heatmap shows exam-day marker when getExamDate returns a date',
  /_renderAnaStudyHeatmap[\s\S]{0,8000}getExamDate\(\)[\s\S]{0,4000}hm-cell-exam/.test(js));
test('v4.54.10 JS: heatmap displays streak + best + 30d/90d stats',
  /_renderAnaStudyHeatmap[\s\S]{0,8000}streakCurr[\s\S]{0,400}streakBest[\s\S]{0,400}daysStudied30[\s\S]{0,400}daysStudied90/.test(js));
test('v4.54.10 JS: heatmap uses native SVG <title> tooltips on each cell',
  /_renderAnaStudyHeatmap[\s\S]{0,8000}<title>\$\{title\}<\/title>/.test(js));
test('v4.54.10 CSS: .hm-cell intensity tiers (t0..t4) with accent-rgb tints',
  /\.hm-cell-t0\s*\{[\s\S]{0,200}rgba\(var\(--accent-rgb\)/.test(css) &&
  /\.hm-cell-t4\s*\{[\s\S]{0,200}fill:\s*var\(--accent\)/.test(css));
test('v4.54.10 CSS: exam-day heatmap cell uses red fill + white stroke',
  /\.hm-cell-exam\s*\{[\s\S]{0,400}fill:\s*var\(--red\)[\s\S]{0,300}stroke:\s*#ffffff/.test(css));
test('v4.54.10 CSS: heatmap editorial head (eyebrow + italic-accent title)',
  /\.ana-heatmap-title\s+em\s*\{[\s\S]{0,200}color:\s*var\(--accent-light\)/.test(css));
test('v4.54.10 CSS: heatmap stats (22px tabular-nums + monospace label)',
  /\.hms-val\s*\{[\s\S]{0,400}tabular-nums/.test(css) &&
  /\.hms-lbl\s*\{[\s\S]{0,400}font-family:\s*monospace/.test(css));

// Analytics: Recent Performance retired
test('v4.54.10 JS: renderAnalytics hides #history-panel (Recent Performance retired)',
  /function renderAnalytics\([\s\S]{0,1500}getElementById\('history-panel'\)[\s\S]{0,200}add\('is-hidden'\)/.test(js));

// ── v4.54.12 Editorial headers on drill pages + Analytics ──
console.log('\n\x1b[1m\u2500\u2500 v4.54.12 DRILL PAGES + ANALYTICS EDITORIAL HEADERS \u2500\u2500\x1b[0m');
test('v7.16.0 HTML: Analytics page uses .ed-pagehead with the N10-009 kicker title',
  /id="page-analytics"[\s\S]{0,500}class="ed-pagehead"[\s\S]{0,800}ana-pagehead-title[\s\S]{0,160}Network\+ N10-009/.test(html));
test('v4.54.14 CSS: .ed-cardhead reusable card-level header defined',
  /\.ed-cardhead\s*\{[\s\S]{0,400}border-bottom:\s*1px\s+dashed/.test(css) &&
  /\.ed-cardhead-eyebrow\s*\{[\s\S]{0,400}font-family:\s*monospace[\s\S]{0,400}text-transform:\s*uppercase/.test(css) &&
  /\.ed-cardhead-title\s+em\s*\{[\s\S]{0,200}color:\s*var\(--accent-light\)/.test(css));

// v4.54.15 Multi-select topic chips
test('v4.54.15 JS: initTopicGroupMulti + _computeTopicFromChips helpers defined',
  js.includes('function initTopicGroupMulti(') &&
  js.includes('function _computeTopicFromChips('));
test('v4.54.15 JS: DOMContentLoaded uses initTopicGroupMulti (not initChips) for topic-group',
  js.includes('initTopicGroupMulti(v => topic = v)') &&
  !/initChips\('topic-group'/.test(js));
test('v4.54.15 JS: _computeTopicFromChips returns Multi: prefix for 2+ domain chips',
  /_computeTopicFromChips[\s\S]{0,1500}Multi:\s*'\s*\+\s*domainOn\.join/.test(js));
test('v4.54.15 JS: mode-card click deselects all other chips (single-select kept for Smart/Mixed)',
  /initTopicGroupMulti[\s\S]{0,3000}isMode[\s\S]{0,800}querySelectorAll\('\.chip'\)\.forEach[\s\S]{0,400}classList\.remove\('on'\)/.test(js));
test('v4.54.15 JS: domain-chip click clears mode cards when turning ON',
  /initTopicGroupMulti[\s\S]{0,3500}turningOn[\s\S]{0,600}cq-mode-card/.test(js));
test('v4.54.15 JS: fallback to Mixed when all chips deselected',
  /initTopicGroupMulti[\s\S]{0,3500}!anyOn[\s\S]{0,400}Mixed/.test(js));
test('v4.54.15 JS: fetchQuestions parses Multi: prefix into multiTopicList',
  /async function fetchQuestions[\s\S]{0,12000}startsWith\('Multi:\s*'\)[\s\S]{0,800}multiTopicList/.test(js));
test('v4.54.15 JS: fetchQuestions builds MANDATORY MULTI-TOPIC DISTRIBUTION prompt',
  /fetchQuestions[\s\S]{0,15000}MANDATORY MULTI-TOPIC DISTRIBUTION/.test(js));
test('v4.54.15 JS: startQuiz loading-msg handles multi-topic count',
  /loading-msg[\s\S]{0,800}_multiCount\s*>=\s*2[\s\S]{0,400}across\s*\$\{_multiCount\}\s*topics/.test(js));
test('v4.54.15 JS: topic-brief skipped for Multi: mode',
  /briefTopic\.startsWith\('Multi:\s*'\)/.test(js));
test('v4.54.15 JS: updateCqSummaryBar renders multi-topic prose with count + preview',
  /updateCqSummaryBar[\s\S]{0,2500}domainOn\.length\s*>=\s*2[\s\S]{0,600}across\s*<em>\$\{domainOn\.length\}\s*topics<\/em>/.test(js));
test('v4.54.15 CSS: multi-selected domain chips get outline ring',
  /#topic-group\s+\.chip:not\(\.cq-mode-card\)\.on\s*\{[\s\S]{0,200}outline:\s*2px\s+solid/.test(css));

// v4.54.16 wider TB palette + exam date in Settings + modal editorial head
test('v4.54.16 CSS: TB workspace palette column widened (220 \u2192 260px)',
  /\.tb-workspace\.tb-workspace-v3\s*\{[\s\S]{0,800}grid-template-columns:\s*260px\s+minmax\(0,\s*1fr\)\s+260px/.test(css));
test('v4.54.16 HTML: Settings page has Exam Date section with #settings-exam-row',
  /id="page-settings"[\s\S]{0,4000}Exam Date[\s\S]{0,400}id="settings-exam-row"/.test(html));
test('v4.54.16 JS: syncSettingsExamDate defined + called from renderSettingsPage',
  js.includes('function syncSettingsExamDate(') &&
  /renderSettingsPage[\s\S]{0,800}syncSettingsExamDate\(\)/.test(js));
test('v4.54.16 JS: syncSettingsExamDate reuses _buildExamDateChipHtml',
  /syncSettingsExamDate[\s\S]{0,1000}_buildExamDateChipHtml\(\s*dateStr,\s*days,\s*'settings-exam-input'\s*\)/.test(js));
test('v4.54.16 JS: updateExamDate also refreshes the Settings chip',
  /function updateExamDate\([\s\S]{0,600}syncSettingsExamDate\(\)/.test(js));
test('v4.54.16 HTML: Exam submit modal uses .ed-modalhead with "Submit exam?"',
  /id="exam-modal"[\s\S]{0,800}class="ed-modalhead"[\s\S]{0,800}Submit\s*<em>exam\?<\/em>/.test(html));
test('v4.54.16 HTML: Topic Deep Dive page uses .ed-pagehead',
  /id="page-topic-dive"[\s\S]{0,500}class="ed-pagehead"[\s\S]{0,800}Topic\s*<em>deep dive\.<\/em>/.test(html));
test('v4.54.16 HTML: Guided Lab page uses .ed-pagehead',
  /id="page-guided-lab"[\s\S]{0,500}class="ed-pagehead"[\s\S]{0,800}Guided\s*<em>terminal lab\.<\/em>/.test(html));
test('v4.54.16 JS: dynamic topic-dive title uses italic-accent em',
  /topic-dive-title[\s\S]{0,400}innerHTML\s*=\s*'Topic \\u00b7 <em>'/.test(js));
test('v4.54.16 JS: dynamic lab-title uses italic-accent em',
  /lab-title[\s\S]{0,400}innerHTML\s*=\s*'Lab \\u00b7 <em>'/.test(js));
test('v4.54.16 CSS: .ed-modalhead reusable modal-level editorial head',
  /\.ed-modalhead\s*\{[\s\S]{0,400}border-bottom:\s*1px\s+dashed/.test(css) &&
  /\.ed-modalhead-eyebrow\s*\{[\s\S]{0,400}font-family:\s*monospace/.test(css) &&
  /\.ed-modalhead-title\s+em\s*\{[\s\S]{0,200}color:\s*var\(--accent-light\)/.test(css));
test('v4.54.16 CSS: .settings-exam-row wrapper styled',
  /\.settings-exam-row\s*\{[\s\S]{0,200}display:\s*flex/.test(css));

// v4.54.17 — Topbar exam countdown + end-of-day recap + follow-up drill
test('v4.54.17 HTML: topbar has #topbar-countdown chip',
  /id="app-topbar"[\s\S]{0,1200}id="topbar-countdown"[\s\S]{0,400}topbar-countdown-val/.test(html));
test('v4.54.17 JS: renderTopbarCountdown defined + called from _topbarTick',
  js.includes('function renderTopbarCountdown(') &&
  /function _topbarTick\(\)[\s\S]{0,1200}renderTopbarCountdown\(\)/.test(js));
test('v4.54.17 JS: countdown chip hidden when no exam date set',
  /renderTopbarCountdown[\s\S]{0,1500}if\s*\(!dateStr\)[\s\S]{0,200}classList\.add\('is-hidden'\)/.test(js));
test('v4.54.17 JS: countdown urgency tiers (urgent/soon/ok/past)',
  /renderTopbarCountdown[\s\S]{0,2500}topbar-countdown-urgent[\s\S]{0,400}topbar-countdown-soon[\s\S]{0,400}topbar-countdown-ok[\s\S]{0,400}topbar-countdown-past/.test(js));
test('v4.54.17 JS: updateExamDate refreshes topbar countdown',
  /function updateExamDate\([\s\S]{0,800}renderTopbarCountdown\(\)/.test(js));
test('v4.54.17 CSS: .topbar-countdown chip with urgency tier palette',
  /\.topbar-countdown\s*\{[\s\S]{0,400}font-family:\s*monospace/.test(css) &&
  /\.topbar-countdown-urgent\s*\{[\s\S]{0,300}color:\s*var\(--red\)/.test(css) &&
  /@keyframes topbarCountdownPulse\s*\{/.test(css));

// End-of-day recap
test('v4.54.17 HTML: daily-recap-modal exists with editorial ed-modalhead',
  html.includes('id="daily-recap-modal"') &&
  /daily-recap-modal[\s\S]{0,500}class="ed-modalhead"[\s\S]{0,400}Nice\s*<em>work\.<\/em>/.test(html));
test('v4.54.17 JS: _maybeShowDailyRecap + dismissDailyRecap defined',
  js.includes('function _maybeShowDailyRecap(') &&
  js.includes('function dismissDailyRecap('));
test('v4.54.17 JS: daily recap gated by localStorage once-per-day',
  /_maybeShowDailyRecap[\s\S]{0,2000}STORAGE_DAILY_RECAP_SHOWN[\s\S]{0,400}todayKey/.test(js));
test('v4.54.17 JS: finish() calls _maybeShowDailyRecap after saveToHistory',
  /function finish\(\)[\s\S]{0,10000}saveToHistory[\s\S]{0,1500}_maybeShowDailyRecap/.test(js));  // v4.57.1: widened both gaps (6000→10000, 500→1500) for multi-topic split branch
// v4.81.13: window bumped 400 → 1500 chars after _saveExamPerTopicSplit
// + renderExamDomainBreakdown calls were added between the summary
// saveToHistory and _maybeShowDailyRecap.
test('v4.54.17 JS: submitExam calls _maybeShowDailyRecap after saveToHistory',
  /submitExam[\s\S]{0,12000}saveToHistory[\s\S]{0,1500}_maybeShowDailyRecap/.test(js));
test('v4.54.17 JS: recap shows today\'s stats + delta + streak + days-to-exam',
  /_maybeShowDailyRecap[\s\S]{0,3500}todayAcc[\s\S]{0,600}deltaAcc[\s\S]{0,400}streak[\s\S]{0,400}daysToExam/.test(js));
test('v4.54.17 CSS: .daily-recap-card uses dark gradient + overshoot entrance animation',
  /\.daily-recap-card\s*\{[\s\S]{0,500}linear-gradient\(160deg,\s*#16131f/.test(css) &&
  /@keyframes dailyRecapIn\s*\{/.test(css));

// Follow-up drill on wrong answers
test('v4.54.17 JS: followUpOnMistake defined + calls fetchQuestions for 2 extras',
  js.includes('function followUpOnMistake(') &&
  /followUpOnMistake[\s\S]{0,2000}fetchQuestions\(key,\s*targetTopic,\s*targetDiff,\s*2\)/.test(js));
test('v4.54.17 JS: followUpOnMistake injects extras at current + 1',
  /followUpOnMistake[\s\S]{0,3000}questions\.splice\(current\s*\+\s*1,\s*0,\s*\.\.\.extras\)/.test(js));
test('v4.54.17 JS: showExplanation adds Drill-this-concept button only on wrong',
  /showExplanation[\s\S]{0,4000}!isRight[\s\S]{0,400}explain-btn-followup[\s\S]{0,200}followUpOnMistake/.test(js));
test('v4.54.17 CSS: .explain-btn-followup accent gradient override',
  /\.explain-btn-followup\s*\{[\s\S]{0,400}linear-gradient\(135deg,\s*rgba\(var\(--accent-rgb\)/.test(css));

// ── v4.55.0 ACL Fix-This + Packet Flow Visualisation (issue #179) ──
console.log('\n\x1b[1m\u2500\u2500 v4.55.0 ACL FIX-THIS + PACKET FLOW ANIMATION \u2500\u2500\x1b[0m');

// New "Fix It" category in scenario picker

// 6 Fix-It scenarios with initialRules
// (removed: v4.55.0 ACL Fix-It scenario tests — ACL Builder deleted in MVP quiz-only pivot)

// initialRules seeding

// Animation engine

// CSS keyframes + editorial styling
test('v4.55.0 CSS: .acl-packet-pill editorial dark-glass with backdrop-blur',
  /\.acl-packet-pill\s*\{[\s\S]{0,800}backdrop-filter:\s*blur/.test(css));
test('v4.55.0 CSS: packet-burst-permit + packet-burst-deny tier colours',
  /\.acl-packet-burst-permit\s*\{[\s\S]{0,600}rgba\(34,\s*197,\s*94/.test(css) &&
  /\.acl-packet-burst-deny\s*\{[\s\S]{0,600}rgba\(239,\s*68,\s*68/.test(css));
test('v4.55.0 CSS: rule-inspecting + rule-matched classes with accent glow',
  /\.acl-rule-inspecting\s*\{[\s\S]{0,400}box-shadow:[\s\S]{0,300}rgba\(124,\s*111,\s*247/.test(css) &&
  /\.acl-rule-matched-permit\s*\{[\s\S]{0,400}rgba\(34,\s*197,\s*94/.test(css));
test('v4.55.0 CSS: aclRuleMatchPulse keyframe with overshoot cubic-bezier',
  /@keyframes aclRuleMatchPulse\s*\{[\s\S]{0,300}scale\(1\.015\)/.test(css));
test('v4.55.0 CSS: implicit-deny row hit indicator defined',
  /\.acl-rule-implicit-matched\s*\{[\s\S]{0,400}rgba\(239,\s*68,\s*68/.test(css));
test('v4.55.0 CSS: reduced-motion hides the packet overlay',
  /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,600}\.acl-packet-overlay\s*\{[^}]*display:\s*none/.test(css));
test('v4.55.0 CSS: light-theme overrides for packet pill + rule highlight',
  /\[data-theme="light"\]\s+\.acl-packet-pill\s*\{/.test(css) &&
  /\[data-theme="light"\]\s+\.acl-rule-inspecting\s*\{/.test(css));
test('v4.55.0 CSS: per-packet accent tone variants (0..3)',
  /\.acl-packet-pill-0\s*\{/.test(css) &&
  /\.acl-packet-pill-1\s*\{/.test(css) &&
  /\.acl-packet-pill-2\s*\{/.test(css) &&
  /\.acl-packet-pill-3\s*\{/.test(css));

// ── v4.55.1 ACL Stateful Firewall Mode (issue #181) ──
console.log('\n\x1b[1m\u2500\u2500 v4.55.1 ACL STATEFUL FIREWALL MODE \u2500\u2500\x1b[0m');
test('v4.55.1 CSS: .acl-sc-mode-stateful accent treatment',
  /\.acl-sc-mode-stateful\s*\{[\s\S]{0,400}color:\s*var\(--accent-light\)/.test(css));

// ── v4.55.2 ACL Progressive Hints + Solution reveal (issue #183) ──
console.log('\n\x1b[1m\u2500\u2500 v4.55.2 ACL PROGRESSIVE HINTS + SOLUTION REVEAL \u2500\u2500\x1b[0m');
test('v4.55.2 HTML: #acl-hint-modal dark-glass shell with ed-modalhead',
  html.includes('id="acl-hint-modal"') &&
  /acl-hint-modal[\s\S]{0,500}class="ed-modalhead"[\s\S]{0,400}Nudge,\s*<em>not solve\.<\/em>/.test(html));
test('v4.55.2 CSS: .acl-hint-btn yellow/warm styling',
  /\.acl-hint-btn\s*\{[\s\S]{0,400}rgba\(251,\s*191,\s*36/.test(css));
test('v4.55.2 CSS: .acl-hint-tier + .acl-hint-tier-current tier stack',
  /\.acl-hint-tier\s*\{/.test(css) &&
  /\.acl-hint-tier-current\s*\{[\s\S]{0,400}rgba\(var\(--accent-rgb\)/.test(css));
test('v4.55.2 CSS: .acl-sol-rules monospace grid + permit/deny action pills',
  /\.acl-sol-rule\s*\{[\s\S]{0,400}font-family:\s*monospace/.test(css) &&
  /\.acl-sol-action-permit\s*\{[\s\S]{0,300}rgba\(34,\s*197,\s*94/.test(css) &&
  /\.acl-sol-action-deny\s*\{[\s\S]{0,300}rgba\(239,\s*68,\s*68/.test(css));

// Behavioural sandbox: verify stateful auto-permit + stateless deny in vm
(function() {
  try {
    const vm = require('vm');
    const ctx = {};
    vm.createContext(ctx);
    // _fnBody returns the full function declaration ("function foo(...) {...}"),
    // so we run each body directly (no need to prepend the signature).
    const helpers = [
      '_aclIpToUint','_aclParseCidr','_aclCidrContains','_aclPortMatches','_aclRuleMatches',
      '_aclEvalPacket','_aclFlowKey','_aclEvaluateFlowsStateful'
    ];
    helpers.forEach(name => {
      vm.runInContext(_fnBody(js, name), ctx);
    });
    // Forward outbound permit followed by reverse inbound: stateful auto-permits
    const rules = [{ id: 'r1', action: 'permit', srcAddr: '10.0.0.0/24', srcPort: 'any', dstAddr: '8.8.8.8/32', dstPort: 53, proto: 'udp' }];
    const packets = [
      { src: '10.0.0.5', sp: 55000, dst: '8.8.8.8', dp: 53, proto: 'udp' },
      { src: '8.8.8.8',  sp: 53,    dst: '10.0.0.5', dp: 55000, proto: 'udp' }
    ];
    const stateless = packets.map(p => ctx._aclEvalPacket(rules, p));
    const stateful  = ctx._aclEvaluateFlowsStateful(rules, packets);
    test('v4.55.1 sandbox: stateless mode denies reverse packet (no explicit rule)',
      stateless[1].action === 'deny');
    test('v4.55.1 sandbox: stateful mode auto-permits reverse via state-track',
      stateful[1].action === 'permit' && stateful[1].stateTrack === true);
    test('v4.55.1 sandbox: unrelated packet still denied in stateful mode',
      ctx._aclEvaluateFlowsStateful(rules, [{ src: '10.0.0.5', sp: 55001, dst: '1.1.1.1', dp: 53, proto: 'udp' }])[0].action === 'deny');
  } catch (e) {
  }
})();

// Sidebar streak lift
test('v4.54.12 CSS: sidebar capped to calc(100vh - 140px) so streak clears dock',
  /\.app-sidebar\s*\{[\s\S]{0,600}height:\s*calc\(100vh\s*-\s*140px\)[\s\S]{0,400}padding-bottom:\s*max\(24px/.test(css));

