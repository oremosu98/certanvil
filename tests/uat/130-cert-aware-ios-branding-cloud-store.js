// tests/uat/130-cert-aware-ios-branding-cloud-store.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Cert-aware Today's Plan, iOS phases 1-3, brand identity (CertAnvil), cert-aware domain ordering, Phase C' cloud-store regression guards

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── v4.99.26 — Cert-aware Today's Plan filter + GT_ZERO_TRUST validator ──
test('v4.99.26 CertFilter: _isCurrentCertTopic helper defined',
  /function _isCurrentCertTopic\(topic\)/.test(js));
test('v4.99.26 CertFilter: buildSessionPlan filters weakRows via _isCurrentCertTopic',
  /weakRows = computeWeakSpotScores\(\)\.filter\(w => w && _isCurrentCertTopic\(w\.topic\)\)/.test(js));
test('v4.99.26 CertFilter: buildSessionPlan filters staleRows via _isCurrentCertTopic',
  /staleRows = _computeStaleTopics\([\s\S]{0,200}\.filter\(s => s && _isCurrentCertTopic\(s\.topic\)\)/.test(js));
test('v4.99.26 CertFilter: helper falls back gracefully if TOPIC_DOMAINS undefined',
  /function _isCurrentCertTopic[\s\S]{0,400}typeof TOPIC_DOMAINS === 'undefined'[\s\S]{0,80}return true/.test(js));
test('v4.99.26 GT_ZERO_TRUST: constant defined in app.js',
  /const GT_ZERO_TRUST = \(CERT_PACK && CERT_PACK\.gt && CERT_PACK\.gt\.zeroTrust\)/.test(js));
test('v4.99.26 GT_ZERO_TRUST: secplus.js gt.zeroTrust populated with validPrinciples',
  /zeroTrust:\s*\{[\s\S]{0,1500}validPrinciples:\s*\[[\s\S]{0,500}'adaptive identity'[\s\S]{0,500}'policy enforcement point'/.test(certSecplus));
test('v4.99.26 GT_ZERO_TRUST: secplus.js gt.zeroTrust populated with offVocabulary',
  /zeroTrust:\s*\{[\s\S]{0,3000}offVocabulary:\s*\[[\s\S]{0,500}'device posture assessment'/.test(certSecplus));
test('v4.99.26 _buildGtHint: injects Zero Trust principle block when topic mentions Zero Trust',
  /_buildGtHint[\s\S]{0,5000}PE DECIDES, PA CONFIGURES, PEP ENFORCES[\s\S]{0,500}Zero Trust principles \(SY0-701\)/.test(js));
test('v4.99.26 _groundTruthOk: rejects answers naming off-vocab Zero Trust principles',
  /_groundTruthOk[\s\S]{0,15000}Zero Trust principle vocabulary check[\s\S]{0,1500}GT_ZERO_TRUST\.offVocabulary\.some/.test(js));

// ── v4.99.27 — iOS Plan Phase 1: SW network-first + visible update banner ──
test('v4.99.27 SW: HTML + JS use network-first strategy (predictable iOS deploys)',
  /isHtmlOrJs[\s\S]{0,400}fetch\(event\.request\)\.then/.test(sw));
test('v4.99.27 SW: stale-while-revalidate retained for static assets (CSS/fonts/images)',
  /[Ss]tale-while-revalidate for everything else[\s\S]{0,1200}cached \|\| fetchPromise/.test(sw));
test('v4.99.27 SW: network-first detects HTML + .html + .js paths',
  /url\.pathname === '\/'[\s\S]{0,200}url\.pathname === '\/index\.html'[\s\S]{0,200}url\.pathname\.endsWith\('\.html'\)[\s\S]{0,200}url\.pathname\.endsWith\('\.js'\)/.test(sw));
test('v4.99.27 SW: network failure falls back to cache (offline support preserved)',
  /isHtmlOrJs[\s\S]{0,1000}\.catch\(\(\) => caches\.match\(event\.request\)\)/.test(sw));
test('v4.99.27 AppJs: silent auto-reload REPLACED with _showSwUpdateBanner',
  /function _showSwUpdateBanner\(reason\)/.test(js));
test('v4.99.27 AppJs: stale _swTriggerReload silent-reload removed',
  !/function _swTriggerReload/.test(js));
test('v4.99.27 AppJs: banner has "New version available" title + Refresh CTA',
  /sw-banner-title[\s\S]{0,200}New version available[\s\S]{0,500}sw-banner-cta[\s\S]{0,80}Refresh/.test(js));
test('v4.99.27 AppJs: banner Refresh button reloads page',
  /refreshBtn[\s\S]{0,300}window\.location\.reload\(\)/.test(js));
test('v4.99.27 AppJs: banner has dismiss button (manual close)',
  /sw-banner-dismiss[\s\S]{0,300}banner\.remove\(\)/.test(js));
test('v4.99.27 AppJs: _swBannerShown guard prevents duplicate banner',
  /_swBannerShown[\s\S]{0,200}_swBannerShown = true/.test(js));
test('v4.99.27 Css: .sw-update-banner rule defined',
  /\.sw-update-banner\s*\{/.test(css));
test('v4.99.27 Css: mobile breakpoint hides sub-text to save vertical space',
  /@media \(max-width:\s*480px\)[\s\S]{0,500}\.sw-banner-sub\s*\{\s*display:\s*none/.test(css));
test('v4.99.27 Css: reduced-motion gate present for banner',
  /prefers-reduced-motion[\s\S]{0,300}\.sw-update-banner\s*\{\s*animation:\s*none/.test(css));
// v5.5.9 — SW update-banner redesign (founder: off-system purple Refresh).
// styles.css UNTOUCHED (the v4.99.27 guards above read app.js/styles.css
// and stay green); the editorial look is a scoped dg-system.css de-card
// (not UAT-read, the v5.5.8 pattern). This guards the ADDITIVE app.js
// render: the brand sync-arrows (namespaced swSyncOrange) inlined into the
// .sw-banner-icon span, with the title/cta/dismiss contract byte-exact.
// Doubles as a tombstone vs reverting the icon span to empty.
test('v5.5.9 SwBanner: brand sync SVG inlined in .sw-banner-icon (namespaced swSyncOrange), title/Refresh/dismiss contract preserved',
  /class="sw-banner-icon"[^>]*>\s*<svg viewBox="0 0 128 128"[\s\S]{0,200}linearGradient id="swSyncOrange"/.test(js)
  && /stroke="url\(#swSyncOrange\)"[\s\S]{0,140}<\/svg><\/span>/.test(js)
  && /sw-banner-title[\s\S]{0,200}New version available[\s\S]{0,500}sw-banner-cta[\s\S]{0,80}Refresh/.test(js)
  && /sw-banner-dismiss[\s\S]{0,300}banner\.remove\(\)/.test(js));
test('v7.x SW update banner mounts as a top strip, not a bottom overlay',
  /sw-update-strip/.test(js) && /\.sw-update-strip\{[\s\S]{0,200}(top:0|sticky|fixed)/.test(read('dg-system.css')));
test('v7.x SW update strip does not cover the topbar (pushdown wired)',
  /has-sw-strip/.test(js) && /body\.has-sw-strip[\s\S]{0,200}app-topbar[\s\S]{0,100}top:\s*48px/.test(read('dg-system.css')));

// ── v4.99.28 — iOS Plan Phase 2: Mobile UX audit fixes ──
test('v4.99.28 InputZoom: input[type=password]/text now uses 16px font (prevents iOS zoom)',
  /input\[type="password"\], input\[type="text"\][\s\S]{0,500}font-size:\s*16px/.test(css)
  && !/input\[type="password"\], input\[type="text"\][\s\S]{0,500}font-size:\s*14px/.test(css));
test('v4.99.28 TouchTarget: .chip min-height bumped to 44px (Apple HIG floor)',
  /\.chip\s*\{[\s\S]{0,500}min-height:\s*44px/.test(css)
  && !/\.chip\s*\{[\s\S]{0,500}min-height:\s*36px/.test(css));
test('v4.99.28 ViewportHeight: body has 100vh fallback + 100dvh override',
  /body\s*\{[\s\S]{0,500}min-height:\s*100vh;\s*min-height:\s*100dvh/.test(css));
test('v4.99.28 FocusVisible: .btn has focus-visible partner (a11y)',
  /\.btn:focus-visible\s*\{[\s\S]{0,200}outline:\s*2px solid var\(--accent\)/.test(css));
test('v4.99.28 FocusVisible: .chip has focus-visible partner',
  /\.chip:focus-visible\s*\{[\s\S]{0,200}outline:\s*2px solid var\(--accent\)/.test(css));
test('v4.99.28 FocusVisible: .sb-item has focus-visible partner (sidebar nav a11y)',
  /\.sb-item:focus-visible\s*\{[\s\S]{0,300}outline:\s*2px solid var\(--accent\)/.test(css));

// ── v4.99.29 — iOS Plan Phase 3: Playwright WebKit + Mobile Safari + iPhone-via-USB doc ──
const playwrightConfig = fs.readFileSync(path.join(ROOT, 'playwright.config.js'), 'utf8');
const ciYml = fs.readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8');
const packageJsonRaw = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8');
test('v4.99.29 Playwright: webkit project added (Desktop Safari engine)',
  /name:\s*'webkit'[\s\S]{0,200}devices\['Desktop Safari'\]/.test(playwrightConfig));
test('v4.99.29 Playwright: mobile-safari project added (iPhone 14 viewport)',
  /name:\s*'mobile-safari'[\s\S]{0,200}devices\['iPhone 14'\]/.test(playwrightConfig));
test('v4.99.29 Playwright: chromium remains as gating browser',
  /name:\s*'chromium'/.test(playwrightConfig));
test('v4.99.29 CI: gating Playwright run filtered to chromium-only',
  /npx playwright test --project=chromium/.test(ciYml));
test('v4.99.29 PackageJson: test:webkit script wired',
  /"test:webkit":\s*"npx playwright test --project=webkit"/.test(packageJsonRaw));
test('v4.99.29 PackageJson: test:mobile-safari script wired',
  /"test:mobile-safari":\s*"npx playwright test --project=mobile-safari"/.test(packageJsonRaw));
test('v4.99.29 PackageJson: test:ios runs both iOS projects together',
  /"test:ios":\s*"npx playwright test --project=webkit --project=mobile-safari"/.test(packageJsonRaw));
test('v4.99.29 PackageJson: test:e2e:all runs all 3 projects',
  /"test:e2e:all":\s*"npx playwright test"/.test(packageJsonRaw));
test('v4.99.29 IOS_TESTING.md: doc file exists at repo root',
  fs.existsSync(path.join(ROOT, 'IOS_TESTING.md')));
const iosTesting = fs.existsSync(path.join(ROOT, 'IOS_TESTING.md'))
  ? fs.readFileSync(path.join(ROOT, 'IOS_TESTING.md'), 'utf8') : '';
test('v4.99.29 IOS_TESTING.md: documents iPhone-via-USB Develop-menu setup',
  /Develop menu[\s\S]{0,500}Web Inspector/.test(iosTesting));
test('v4.99.29 IOS_TESTING.md: documents Playwright iOS commands',
  /npm run test:webkit[\s\S]{0,200}npm run test:mobile-safari/.test(iosTesting));
test('v4.99.29 IOS_TESTING.md: documents the trigger to promote iOS to gating CI',
  /promote[\s\S]{0,400}--project=chromium/.test(iosTesting));

test('v4.87.1 CarryOver: every carry-over has source: curated-netplus-carryover',
  (() => {
    const m = certSecplus.match(/questionExemplars:\s*\[([\s\S]*?)\n\s*\]\s*\n?\s*\}/);
    if (!m) return false;
    const matches = m[1].match(/"source":"curated-netplus-carryover"/g) || [];
    return matches.length === 77;
  })());
test('v4.87.1 CarryOver: every entry has originalTopic field for traceability',
  (() => {
    const m = certSecplus.match(/questionExemplars:\s*\[([\s\S]*?)\n\s*\]\s*\n?\s*\}/);
    if (!m) return false;
    const matches = m[1].match(/"originalTopic":/g) || [];
    return matches.length === 77;
  })());
// v4.99.58: now covers all 131 exemplars (77 carry-over + 54 Phase 3 Cycles 1+2+3+4+5+6)

// ── Dynamic topic-chip rendering ──
test('v4.87.1 ChipRender: _renderTopicChipsForActiveCert function defined',
  /function\s+_renderTopicChipsForActiveCert\s*\(\)/.test(js));
test('v4.87.1 ChipRender: function reads CERT_PACK.topicDomains',
  /_renderTopicChipsForActiveCert[\s\S]{0,3000}CERT_PACK\.topicDomains/.test(js));
test('v4.87.1 ChipRender: function is no-op for netplus cert',
  /_renderTopicChipsForActiveCert[\s\S]{0,800}CURRENT_CERT === ['"]netplus['"]\)\s*return/.test(js));
test('v4.87.1 ChipRender: function rebuilds 5 topic-domain-group accordions',
  /_renderTopicChipsForActiveCert[\s\S]{0,3000}details\.topic-domain-group\[data-domain-idx="['"]?\s*['"]?\s*\+\s*idx/.test(js));
test('v4.87.1 ChipRender: function updates 5 .tdp-pill labels',
  /_renderTopicChipsForActiveCert[\s\S]{0,3500}\.tdp-pill/.test(js));
test('v5.5.0 ChipRender: function updates 5 .dgh-db domain-preset buttons',
  /_renderTopicChipsForActiveCert[\s\S]{0,4000}\.dgh-db/.test(js));
test('v5.5.0 TOMBSTONE: .modes-domain-tile must not appear in _renderTopicChipsForActiveCert (dead DOM class replaced by .dgh-db)',
  !/_renderTopicChipsForActiveCert[\s\S]{0,4000}\.modes-domain-tile/.test(js));
test('v4.87.1 ChipRender: hooked into DOMContentLoaded',
  /DOMContentLoaded[\s\S]{0,800}_renderTopicChipsForActiveCert\s*\(\)/.test(js));

// ── _DOMAIN_IDX is now cert-aware ──
test('v4.87.1 DomainIdx: _DOMAIN_IDX derives from CERT_PACK.domainWeights',
  /_DOMAIN_IDX\s*=\s*\(\(\)\s*=>\s*\{[\s\S]{0,400}CERT_PACK\.domainWeights/.test(js));
test('v4.87.1 DomainIdx: Network+ fallback preserved for safety',
  /_DOMAIN_IDX[\s\S]{0,800}idx\.concepts\s*=\s*1[\s\S]{0,200}idx\.troubleshooting\s*=\s*5/.test(js));

// ═══════════════════════════════════════════════════════════════════════
// v4.87.2 — Security+ branding fixes (user dogfood).
// User screenshot showed: (1) Mode Ladder tile titles still showed Network+
// names in Security+ mode (my v4.87.1 chip render targeted span:last-child
// = .mdt-meta instead of .mdt-name); (2) Sidebar still showed N+ / Network+
// brand even in Security+ mode (renderAppSidebar hardcoded the mark + name).
// Plus browser-tab title was still "Network+ AI Quiz" in Security+ mode.
// ═══════════════════════════════════════════════════════════════════════

test('v5.5.0 ChipRender: domain-preset buttons target .dbn label span',
  /\.dbn/.test(_fnBody(js, '_renderTopicChipsForActiveCert') || ''));
test('v5.5.0 ChipRender: domain-preset buttons update .dbk + .dbn + .dbm spans',
  (() => {
    const body = _fnBody(js, '_renderTopicChipsForActiveCert') || '';
    return /\.dbk/.test(body) && /\.dbn/.test(body) && /\.dbm/.test(body);
  })());
test('v4.87.2 ChipRender: tombstone — span:last-child fallback removed',
  !/lastTextSpan\s*=\s*tile\.querySelector\(['"]span:last-child['"]\)/.test(js));

// v4.87.3 retired the v4.87.2 cert-aware brandMark/brandName variables.
// Brand is now CertAnvil (parent) + cert sub-line (Network+ / Security+).
// Keep the "no Network+ in mark" tombstones (still relevant) but retarget
// the interpolation tests to the new architecture.
test('v4.87.2 → v4.87.3 SidebarBrand: hardcoded "N+" sidebar mark removed (now "CA")',
  !/sb-brand-mark[^>]*>N\+</.test(js));
test('v4.87.2 → v4.87.3 SidebarBrand: hardcoded "Network+" sidebar name removed (now "CertAnvil")',
  !/sb-brand-name[^>]*>Network\+</.test(js));
test('v4.87.2 → v4.87.3 PageTitle: title now CertAnvil-prefixed, not "Security+ AI Quiz"',
  /document\.title[\s\S]{0,300}CertAnvil · Security\+/.test(html));

// ═══════════════════════════════════════════════════════════════════════
// v4.87.3 — CertAnvil brand identity adopted. Domain certanvil.com +
// certanvil.co.uk registered 2026-05-05. Brand becomes the parent product
// identity; Network+ and Security+ become cert sub-brands shown below.
// ═══════════════════════════════════════════════════════════════════════

test('v4.87.3 Brand: page <title> is CertAnvil-prefixed',
  /<title>CertAnvil/.test(html));
test('v4.87.3 Brand: meta description leads with CertAnvil',
  /<meta name="description" content="CertAnvil/.test(html));
test('v4.87.3 Brand: apple-mobile-web-app-title is CertAnvil',
  /<meta name="apple-mobile-web-app-title" content="CertAnvil"/.test(html));
test('v4.87.3 Brand: inline <head> script sets CertAnvil-prefixed title for both certs',
  /document\.title\s*=.*CertAnvil · Security\+.*CertAnvil · Network\+/s.test(html));
test('v4.87.3 Brand: hardcoded "Network+ AI Quiz" page title removed',
  !/<title>Network\+ AI Quiz<\/title>/.test(html));

// v4.87.3 → v4.87.4: brand mark upgraded from "CA" text to M14 SVG logo.
// Retired the literal-text check; the M14 SVG presence is verified by
// v4.87.4 Logo block above.
test('v4.87.3 → v4.87.4 Sidebar: brand mark renders M14 SVG (was "CA" text)',
  /sb-brand-mark[^>]*>\$\{brandSvg\}<\/div>/.test(js));
test('v4.87.3 Sidebar: brand name is "CertAnvil"',
  /sb-brand-name[^>]*>CertAnvil</.test(js));
test('v4.87.3 Sidebar: cert sub-line uses CERT_PACK.meta name + code',
  /certShortLabel\s*=[\s\S]{0,300}CERT_PACK\.meta[\s\S]{0,200}\.name[\s\S]{0,200}\.code/.test(js));
test('v4.87.3 Sidebar: .sb-brand-cert CSS declared (cert sub-line)',
  /\.sb-brand-cert\s*\{/.test(css));
test('v4.87.3 Sidebar: tombstone — N+/Network+ literal sidebar mark removed',
  !/sb-brand-mark[^>]*>N\+<\/div>/.test(js) && !/sb-brand-name[^>]*>Network\+</.test(js));
test('v4.87.3 Sidebar: tombstone — S+/Security+ literal sidebar mark removed',
  !/sb-brand-mark[^>]*>S\+<\/div>/.test(js) && !/sb-brand-name[^>]*>Security\+</.test(js));

// ═══════════════════════════════════════════════════════════════════════
// v4.87.4 → v5.0.2: brand mark upgraded from M14 hammer+anvil to C/A monogram.
// The C/A monogram is a stroke-only SVG: stylised C, diagonal slash, A.
// Per locked mockup at mockups/certanvil-ca-monogram-concept.html.
// ═══════════════════════════════════════════════════════════════════════

test('v4.87.4 Logo: brandSvg const declared in renderAppSidebar',
  /const\s+brandSvg\s*=\s*['"`]<svg/.test(js));
test('v5.0.2 Logo: C/A monogram C-arc path present',
  /M58 12 C42 6, 16 16, 14 34[\s\S]{0,100}class="sb-brand-c"/.test(js));
test('v5.0.2 Logo: C/A monogram slash line present',
  /x1="30" y1="84" x2="70" y2="16"[\s\S]{0,60}class="sb-brand-slash"/.test(js));
test('v5.0.2 Logo: C/A monogram A-legs path present',
  /M46 88 L64 50 L82 88[\s\S]{0,80}class="sb-brand-a"/.test(js));
test('v4.87.4 Logo: sidebar mark renders ${brandSvg} not "CA" text',
  /sb-brand-mark[^>]*>\$\{brandSvg\}<\/div>/.test(js));
test('v4.87.4 Logo: tombstone — "CA" text content removed from sidebar mark',
  !/sb-brand-mark[^>]*>CA<\/div>/.test(js));
test('v5.0.2 Logo: tombstone — old M14 hammer+anvil removed',
  !/rotate\(-25 35 30\)/.test(js) && !/sb-brand-anvil/.test(js) && !/sb-brand-spark/.test(js));

test('v4.87.4 Favicon: index.html links favicon.svg',
  /<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="favicon\.svg"/.test(html));
test('v4.87.4 Favicon: index.html links apple-touch-icon',
  /<link\s+rel="apple-touch-icon"\s+href="favicon\.svg"/.test(html));
test('v4.87.4 Favicon: sw.js precaches favicon.svg in SHELL_ASSETS',
  /SHELL_ASSETS\s*=\s*\[[\s\S]{0,500}favicon\.svg/.test(sw));

test('v4.87.4 Manifest: name updated to CertAnvil',
  (() => {
    const m = require('fs').readFileSync(require('path').join(ROOT, 'manifest.json'), 'utf8');
    return /"name":\s*"CertAnvil"/.test(m) && /"short_name":\s*"CertAnvil"/.test(m);
  })());
test('v4.87.4 Manifest: icon points at favicon.svg',
  (() => {
    const m = require('fs').readFileSync(require('path').join(ROOT, 'manifest.json'), 'utf8');
    return /"src":\s*"favicon\.svg"/.test(m);
  })());

test('v4.87.4 CSS: .sb-brand-mark has padding for SVG breathing room',
  /\.sb-brand-mark\s*\{[\s\S]{0,400}padding:\s*3px/.test(css));
test('v4.87.4 CSS: .sb-brand-mark svg fills container',
  /\.sb-brand-mark\s+svg\s*\{[\s\S]{0,200}width:\s*100%[\s\S]{0,100}height:\s*100%/.test(css));

// ═══════════════════════════════════════════════════════════════════════
// v4.88.0 — Cert-aware copy sweep + landing page polish.
// User dogfood + Security+ readiness: the cert app had ~9 user-visible
// "Network+" / "N10-009" hardcodes that didn't update when CURRENT_CERT
// flipped to secplus. New _renderCertAwareCopy() runs at DOMContentLoaded
// and rewrites those strings in Security+ mode. Plus topic-objective
// tooltip uses CERT_CODE template instead of literal "N10-009".
// ═══════════════════════════════════════════════════════════════════════

test('v4.88.0 CertAwareCopy: _renderCertAwareCopy function defined',
  /function\s+_renderCertAwareCopy\s*\(\)/.test(js));
test('v4.88.0 CertAwareCopy: function is no-op for netplus (early return)',
  /_renderCertAwareCopy[\s\S]{0,1500}CURRENT_CERT === ['"]netplus['"]\)\s*return/.test(js));
test('v4.88.0 CertAwareCopy: substitutes diagnostic-cta-title',
  /_renderCertAwareCopy[\s\S]{0,3500}\.diagnostic-cta-title/.test(js));
test('v4.88.0 CertAwareCopy: substitutes pass-plan-sub',
  /_renderCertAwareCopy[\s\S]{0,3500}getElementById\(['"]pass-plan-sub['"]\)/.test(js));
test('v4.88.0 CertAwareCopy: substitutes Scaled Score labels',
  /_renderCertAwareCopy[\s\S]{0,3500}\.results-v2-big-label[\s\S]{0,200}\.exam-results-v2-big-label/.test(js));
test('v4.88.0 CertAwareCopy: substitutes Pass mark with cert-specific scores',
  /_renderCertAwareCopy[\s\S]{0,4000}exam-results-v2-threshold[\s\S]{0,200}passMark[\s\S]{0,200}maxScore/.test(js));
test('v4.88.0 CertAwareCopy: substitutes domain-breakdown sub',
  /_renderCertAwareCopy[\s\S]{0,4000}\.exam-domain-breakdown-sub/.test(js));
test('v4.88.0 CertAwareCopy: substitutes ed-pagehead-lede',
  /_renderCertAwareCopy[\s\S]{0,4500}\.ed-pagehead-lede/.test(js));
test('v4.88.0 CertAwareCopy: hooked into DOMContentLoaded after chip render',
  /DOMContentLoaded[\s\S]{0,1500}_renderCertAwareCopy\s*\(\)/.test(js));

// v7.2.0 MIGRATED: Progress v2 removed the .topic-obj-badge from the row
// emission (name-led row per mockup; obj badge intentionally dropped, see
// app.js _progressRowHtml header comment). Tombstone the hardcoded
// N10-009 path so it can't return. The ObjBadge title template lives on
// in other surfaces (Home, etc.) so the live cert-aware template stays.
test('v7.2.0 ObjBadge: tombstone — hardcoded "N10-009 objective" removed from any progress-row template',
  !/title="N10-009 objective \$\{obj\}"/.test(js));
test('v7.2.0 ObjBadge: _progressRowHtml does NOT emit a topic-obj-badge (v2 name-led)',
  !/_progressRowHtml[\s\S]{0,4500}topic-obj-badge/.test(js));

// ── v4.88.1: Security+ Home crash fix ──
// renderSetupDomainGrid had hardcoded Network+ domain keys that crashed when
// CURRENT_CERT === 'secplus' (DOMAIN_LABELS['implementation'] is undefined →
// .replace(...) on undefined → window.onerror fires → red toast).
// Fix: cert-aware early-return so the section is hidden cleanly for non-netplus.
// v4.99.80: domain grid is now cert-aware (no bail). Assert the cert-aware
// domain-order derivation from DOMAIN_WEIGHTS and Sec+ canonical topics.
test('v4.88.1 → v4.99.80 Security+: renderSetupDomainGrid reads domainOrder from DOMAIN_WEIGHTS',
  /renderSetupDomainGrid[\s\S]{0,2000}DOMAIN_WEIGHTS[\s\S]{0,200}Object\.keys\(DOMAIN_WEIGHTS\)/.test(js));
test('v4.88.1 → v4.99.80 Security+: renderSetupDomainGrid uses _CANONICAL_SECPLUS for Sec+ topics',
  js.includes('_CANONICAL_SECPLUS'));

// ── v4.88.4: URL action handler ──
// External surfaces (landing CTA, share links) can route to specific app
// actions via ?action=<verb>. Currently: action=diagnostic auto-fires
// startDiagnostic() after page paint. URL is cleaned via replaceState so
// refresh doesn't re-fire.
test('v4.88.4 URLAction: _processUrlAction function defined',
  /function _processUrlAction\s*\(\)/.test(js));
test('v4.88.4 URLAction: parses URLSearchParams from location.search',
  /_processUrlAction[\s\S]{0,400}new URLSearchParams\(window\.location\.search\)/.test(js));
test('v4.88.4 URLAction: action=diagnostic fires startDiagnostic',
  /_processUrlAction[\s\S]{0,1500}action === 'diagnostic'[\s\S]{0,300}startDiagnostic\(\)/.test(js));
test('v4.88.4 URLAction: cleans URL via history.replaceState (prevents re-fire on refresh)',
  /_processUrlAction[\s\S]{0,1200}history\.replaceState/.test(js));
test('v4.88.4 URLAction: hooked into DOMContentLoaded',
  /DOMContentLoaded',\s*_processUrlAction/.test(js));

// ── v4.88.2: cert-aware domain ordering across 4 surfaces ──
// Bug class: hardcoded Network+ keys ('concepts','implementation','operations',
// 'security','troubleshooting') showing wrong labels in Security+ mode AND
// silently breaking question generation (DOMAIN_WEIGHTS['implementation'] →
// undefined → NaN distribution). Fix: pull domain order from
// Object.keys(DOMAIN_WEIGHTS) so every surface honors the active cert pack.
test('v4.88.2 Security+: _computeConstellationData uses cert-aware domainOrder',
  /_computeConstellationData[\s\S]{0,1200}DOMAIN_WEIGHTS[\s\S]{0,100}Object\.keys\(DOMAIN_WEIGHTS\)/.test(js));
test('v4.88.2 Security+: _renderAnaConstellation builds CLUSTERS via DOMAIN_LABELS',
  /_renderAnaConstellation[\s\S]{0,3500}_domainLabelsCC\s*=[\s\S]{0,200}DOMAIN_LABELS/.test(js));
test('v4.88.2 Security+: cluster name renders full DOMAIN_LABELS (no split-and-slice)',
  /class="ana-const-cluster-name">\$\{esc\(c\.label\)\}</.test(js));
test('v4.88.2 Security+: computeDomainDistribution uses cert-aware key order',
  /function computeDomainDistribution[\s\S]{0,800}Object\.keys\(DOMAIN_WEIGHTS\)/.test(js));
test('v4.88.2 Security+: exam-domain-breakdown render uses cert-aware order',
  /buckets = _buildExamDomainBreakdown[\s\S]{0,800}Object\.keys\(DOMAIN_WEIGHTS\)/.test(js));

// ══════════════════════════════════════════════════════════════════════════
// v4.89.0 (Phase C′ cloud-first) — regression guards for the cloud-store
// integration. Failure modes we want to catch on every push:
//   1. Script-tag order rearranged (Supabase UMD must load BEFORE lib/supabase
//      before cloud-store before auth-state before migration before app.js).
//   2. _cloudFlush helper deleted or renamed (silent loss of cloud sync).
//   3. A USER_DATA write site accidentally drops its _cloudFlush hook.
//   4. SHELL_ASSETS in sw.js missing one of the 4 new modules (broken offline).
// ══════════════════════════════════════════════════════════════════════════

// 1. Script-tag order — index.html must load Supabase UMD → lib/supabase.js
//    → cloud-store.js → auth-state.js → migration.js → app.js, in that order.
//    v4.89.1: switched from cdn.jsdelivr.net to vendored lib/supabase-umd.min.js
//    after the CDN 503'd intermittently for some users and broke the auth flow
//    (auth.js bails out when window.supabase is missing → Sign-in button does
//    nothing → migration banner never appears).
test('v4.89.0 Phase C′: index.html loads Supabase UMD before cloud modules',
  html.indexOf('src="lib/supabase-umd.min.js"') < html.indexOf('src="lib/supabase.js"') &&
  html.indexOf('src="lib/supabase.js"') < html.indexOf('src="cloud-store.js"') &&
  html.indexOf('src="cloud-store.js"') < html.indexOf('src="auth-state.js"') &&
  html.indexOf('src="auth-state.js"') < html.indexOf('src="migration.js"') &&
  html.indexOf('src="migration.js"') < html.indexOf('src="app.js"'));

// v4.89.1: zero-tolerance regression guard — no third-party CDN script tags
// for Supabase. Vendored locally because cdn.jsdelivr.net 503'd for users.
test('v4.89.1 Phase C′: index.html does NOT load Supabase from cdn.jsdelivr.net',
  !/<script[^>]*cdn\.jsdelivr\.net[^>]*supabase/i.test(html));
test('v4.89.1 Phase C′: sw.js precaches the vendored Supabase UMD bundle',
  sw.includes("'./lib/supabase-umd.min.js'"));
test('v4.89.1 Phase C′: lib/supabase-umd.min.js exists on disk',
  require('fs').existsSync(require('path').join(require('path').join(__dirname, '..'), '..', 'lib', 'supabase-umd.min.js')));

// v4.89.2: SW auto-update — every future deploy reloads the page automatically
// when the new SW takes control. Regression guards on the 4 wired pieces.
test('v4.89.2 SW: app.js wires controllerchange listener for auto-reload',
  /navigator\.serviceWorker\.addEventListener\(\s*['"]controllerchange['"]/.test(js));
test('v4.89.2 SW: app.js wires postMessage listener (belt-and-suspenders)',
  /navigator\.serviceWorker\.addEventListener\(\s*['"]message['"]/.test(js) &&
  /sw-updated/.test(js));
// v4.99.27 — superseded silent auto-reload with visible banner; guard is
// now _swBannerShown (prevents duplicate banner instead of reload loop).
test('v4.89.2/4.99.27 SW: app.js dedupes SW-update events (banner shown once)',
  /_swBannerShown/.test(js));
test('v4.89.2 SW: app.js polls for SW updates every 60s (open-tab catch-up)',
  /reg\.update\(\)/.test(js) && /setInterval[\s\S]{0,200}60000/.test(js));
test('v4.89.2 SW: sw.js broadcasts postMessage to clients on activate',
  /clients\.matchAll[\s\S]{0,300}postMessage[\s\S]{0,100}sw-updated/.test(sw));

// v4.89.3: SW pass-through for Supabase API calls. Caching auth/REST
// requests is wrong (POST etc. can't be cached anyway) and breaking
// pass-through caused "Failed to fetch" errors on certanvil.com via a
// rogue leftover SW. Regression-guarded so this can never silently regress.
test('v4.89.3 SW: sw.js bypasses Supabase API hostnames',
  /url\.hostname\.endsWith\(['"]\.supabase\.co['"]\)/.test(sw));

// 2. Topbar mount point exists (replaces legacy .topbar-avatar 'S')
test('v4.89.0 Phase C′: index.html has #topbar-account-mount span',
  html.includes('id="topbar-account-mount"'));

// 3. SW precaches all 4 new modules (Supabase UMD lives on CDN, not in shell)
test('v4.89.0 Phase C′: sw.js SHELL_ASSETS includes lib/supabase.js',
  sw.includes("'./lib/supabase.js'"));
test('v4.89.0 Phase C′: sw.js SHELL_ASSETS includes cloud-store.js',
  sw.includes("'./cloud-store.js'"));
test('v4.89.0 Phase C′: sw.js SHELL_ASSETS includes auth-state.js',
  sw.includes("'./auth-state.js'"));
test('v4.89.0 Phase C′: sw.js SHELL_ASSETS includes migration.js',
  sw.includes("'./migration.js'"));

// 4. _cloudFlush helper exists, is defensive, and does NOT touch DEV_ONLY keys
test('v4.89.0 Phase C′: _cloudFlush helper defined in app.js',
  /function _cloudFlush\(key\)\s*\{/.test(js));
test('v4.89.0 Phase C′: _cloudFlush is defensive (try/catch + cloudStore guard)',
  /function _cloudFlush[\s\S]{0,500}window\.cloudStore[\s\S]{0,200}cloudStore\.flush/.test(js) &&
  /function _cloudFlush[\s\S]{0,500}catch\s*\(/.test(js));

// 5. Critical USER_DATA writers all carry _cloudFlush. Any future ship that
//    drops one of these hooks will fail UAT loudly so the regression is caught
//    at commit time, not after the user notices missing cross-device sync.
test('v4.89.0 Phase C′: saveToHistory flushes STORAGE.HISTORY',
  /function saveToHistory[\s\S]{0,400}_cloudFlush\(STORAGE\.HISTORY\)/.test(js));
test('v4.89.0 Phase C′: saveStreak flushes STORAGE.STREAK',
  /STORAGE\.STREAK,\s*JSON\.stringify\(s\)\);\s*_cloudFlush\(STORAGE\.STREAK\)/.test(js));
test('v4.89.0 Phase C′: saveWrongBank flushes STORAGE.WRONG_BANK',
  /function saveWrongBank[\s\S]{0,300}_cloudFlush\(STORAGE\.WRONG_BANK\)/.test(js));
test('v4.89.0 Phase C′: saveSrQueue flushes STORAGE.SR_QUEUE',
  /function saveSrQueue[\s\S]{0,300}_cloudFlush\(STORAGE\.SR_QUEUE\)/.test(js));
test('v4.89.0 Phase C′: setExamDate flushes STORAGE.EXAM_DATE',
  /function setExamDate[\s\S]{0,300}_cloudFlush\(STORAGE\.EXAM_DATE\)/.test(js));
test('v4.89.0 Phase C′: setDailyGoal flushes STORAGE.DAILY_GOAL',
  /function setDailyGoal[\s\S]{0,300}_cloudFlush\(STORAGE\.DAILY_GOAL\)/.test(js));
test('v4.89.0 Phase C′: unlockMilestone flushes STORAGE.MILESTONES',
  // window widened 400→800 for Task 1: the per-cert write-path/clobber-safety
  // comments lengthened the body; the flush still lives inside the function.
  /function unlockMilestone[\s\S]{0,800}_cloudFlush\(STORAGE\.MILESTONES\)/.test(js));

// ============================================================================
// v4.91.0 — Security+ Acronym Blitz drill (first SY0-701 drill)
// ============================================================================
// Cert-aware AB scaffold reusing the existing Network+ drill plumbing via
// _USE_SECPLUS_AB switch. Storage namespaced separately (SAB_*) so Network+
// progress + Security+ progress can never collide. Sidebar branches by cert.
// Launcher renders 5 tiles (1 live + 4 coming-soon → issues #301-#304).

// Storage keys
test('v4.91.0 SAB: STORAGE.SAB_MASTERY key declared',
  /SAB_MASTERY:\s*['"]nplus_sab_mastery['"]/.test(js));
test('v4.91.0 SAB: STORAGE.SAB_LESSONS key declared',
  /SAB_LESSONS:\s*['"]nplus_sab_lessons['"]/.test(js));

// Cloud-store sync coverage — SAB keys must hydrate + flush to Supabase
test('v4.91.0 SAB: cloud-store USER_DATA_KEYS includes sab_mastery',
  cloudStoreJs.includes("'nplus_sab_mastery'"));
test('v4.91.0 SAB: cloud-store USER_DATA_KEYS includes sab_lessons',
  cloudStoreJs.includes("'nplus_sab_lessons'"));

// Cert-aware module-load aliases — switch on _USE_SECPLUS_AB at boot

// Original Network+ data preserved under _NETPLUS_AB_* names (renamed, not deleted)

// Drill scaffold wired to cert-aware keys

// Sidebar — Security+ drill list + cert-aware branching
test('v4.91.0 SAB: APP_SIDEBAR_DRILLS_SECPLUS array declared',
  /const APP_SIDEBAR_DRILLS_SECPLUS = \[/.test(js));
test('v4.91.0 SAB: sidebar handler-registration loop includes SECPLUS drills',
  /\.\.\.APP_SIDEBAR_DRILLS_SECPLUS/.test(js));

// Drills launcher — replaced placeholder with cert-aware tile grid
test('v4.91.0 SAB: old _renderSecPlusDrillsPlaceholder is gone (regression-guard)',
  !/function _renderSecPlusDrillsPlaceholder\(/.test(js));

// CSS — secplus-drill-grid replaces secplus-drills-placeholder
test('v4.91.0 SAB: secplus-drill-grid CSS pattern present',
  /\.secplus-drill-grid\s*\{/.test(css));
test('v4.91.0 SAB: secplus-drill-tile CSS pattern present',
  /\.secplus-drill-tile\s*\{/.test(css));
test('v4.91.0 SAB: is-coming-soon variant present (4 placeholder tiles use it)',
  /\.secplus-drill-tile\.is-coming-soon/.test(css));
test('v4.91.0 SAB: old secplus-drills-placeholder CSS is gone (regression-guard)',
  !/\.secplus-drills-placeholder\s*\{/.test(css));

// Cert-pack data integrity — secplus.js must carry the drill content
test('v4.91.0 SAB: secplus.js cert pack declares acronymBank',
  certSecplus.includes('acronymBank:'));
test('v4.91.0 SAB: secplus.js cert pack declares acronymCategories',
  certSecplus.includes('acronymCategories:'));
test('v4.91.0 SAB: secplus.js cert pack declares acronymLessons',
  certSecplus.includes('acronymLessons:'));
test('v4.91.0 SAB: secplus.js acronymBank has ≥100 entries',
  (certSecplus.match(/abbr:\s*['"][A-Z0-9]+['"]/g) || []).length >= 100);
test('v4.91.0 SAB: secplus.js acronymCategories covers all 7 SY0-701 buckets',
  /acronymCategories:\s*\{[\s\S]{0,4000}threats[\s\S]{0,4000}detection[\s\S]{0,4000}identity[\s\S]{0,4000}crypto[\s\S]{0,4000}network[\s\S]{0,4000}compliance[\s\S]{0,4000}operations/.test(certSecplus));

// ============================================================================
// v4.94.0 — Attack-to-Mitigation Match drill (issue #301)
// ============================================================================
// Security+ drill: 96 attack/mitigation pairs across 5 categories, MCQ format.
// Visual contract locked to mockups/security-attack-mitigation-match-concept.html
// State 3. Cert-aware via _USE_SECPLUS_AMM, sidebar-gated to Security+ mode.

// Storage keys

// Cloud-store sync
test('v4.94.0 AMM: cloud-store USER_DATA_KEYS includes amm_mastery',
  cloudStoreJs.includes("'nplus_amm_mastery'"));
test('v4.94.0 AMM: cloud-store USER_DATA_KEYS includes amm_lessons',
  cloudStoreJs.includes("'nplus_amm_lessons'"));

// Cert-aware module-load aliases

// Drill code

// Sidebar wiring

// Drills launcher (live tile, not coming-soon)

// HTML page exists

// CSS contract

// Cert-pack data
test('v4.94.0 AMM: secplus.js declares attackMitigationCategories',
  certSecplus.includes('attackMitigationCategories:'));
test('v4.94.0 AMM: secplus.js declares attackMitigationPairs',
  certSecplus.includes('attackMitigationPairs:'));
test('v4.94.0 AMM: secplus.js declares attackMitigationLessons',
  certSecplus.includes('attackMitigationLessons:'));
test('v4.94.0 AMM: secplus.js has 5 attack categories',
  /attackMitigationCategories:\s*\{[\s\S]{0,1500}webapp[\s\S]{0,1500}socialeng[\s\S]{0,1500}network[\s\S]{0,1500}malware[\s\S]{0,1500}physical/.test(certSecplus));
test('v4.94.0 AMM: secplus.js has ≥90 attack/mitigation pairs',
  (certSecplus.match(/id:\s*['"][a-z0-9-]+['"]/g) || []).filter(s => true).length >= 90);

// ============================================================================
// v4.95.0 — Control Type Sorter drill (issue #302)
// ============================================================================
// Security+ drill: 120 controls across CompTIA 6 types × 4 categories matrix.
// Dual-axis MCQ — pick TYPE (1-of-6) AND CATEGORY (1-of-4); submit gated on
// both axes locked. Visual contract locked to mockups/security-control-type-
// sorter-concept.html State 2 (MCQ mode v1; Sort mode disabled toggle).

// Storage keys

// Cloud-store sync
test('v4.95.0 CTS: cloud-store USER_DATA_KEYS includes cts_mastery',
  cloudStoreJs.includes("'nplus_cts_mastery'"));
test('v4.95.0 CTS: cloud-store USER_DATA_KEYS includes cts_lessons',
  cloudStoreJs.includes("'nplus_cts_lessons'"));

// Cert-aware module-load aliases

// Drill code — dual-axis specific functions

// Sidebar + breadcrumb wiring

// Launcher tile is LIVE

// HTML page exists

// CSS contract

// Cert-pack data
test('v4.95.0 CTS: secplus.js declares controls array',
  /controls:\s*\[/.test(certSecplus));
test('v4.95.0 CTS: secplus.js declares 6 controlTypes',
  /controlTypes:\s*\{[\s\S]{0,1500}prev[\s\S]{0,1500}det[\s\S]{0,1500}corr[\s\S]{0,1500}deter[\s\S]{0,1500}comp[\s\S]{0,1500}dir/.test(certSecplus));
test('v4.95.0 CTS: secplus.js declares 4 controlCategories',
  /controlCategories:\s*\{[\s\S]{0,800}tech[\s\S]{0,800}mgmt[\s\S]{0,800}ops[\s\S]{0,800}phys/.test(certSecplus));
test('v4.95.0 CTS: secplus.js declares controlMatrixLessons',
  certSecplus.includes('controlMatrixLessons:'));

// ============================================================================
// v4.96.0 — Packet Trace Drill (issue #305)
// ============================================================================
// Network+ drill walking a packet through curated networks hop-by-hop with an
// MCQ at each step. Distinct from TB's free-form trace — curated scenarios
// with mastery tracking + lesson cheatsheets. Visual contract locked to
// mockups/network-packet-trace-drill-concept.html State 2.

// Storage keys
test('v4.96.0 PT: STORAGE.PT_MASTERY key declared',
  /PT_MASTERY:\s*['"]nplus_pt_mastery['"]/.test(js));
test('v4.96.0 PT: STORAGE.PT_LESSONS key declared',
  /PT_LESSONS:\s*['"]nplus_pt_lessons['"]/.test(js));
test('v4.96.0 PT: STORAGE.PT_RESUME key declared (mid-scenario resume)',
  /PT_RESUME:\s*['"]nplus_pt_resume['"]/.test(js));

// Cloud-store sync
test('v4.96.0 PT: cloud-store USER_DATA_KEYS includes pt_mastery',
  cloudStoreJs.includes("'nplus_pt_mastery'"));
test('v4.96.0 PT: cloud-store USER_DATA_KEYS includes pt_lessons',
  cloudStoreJs.includes("'nplus_pt_lessons'"));
test('v4.96.0 PT: cloud-store USER_DATA_KEYS includes pt_resume',
  cloudStoreJs.includes("'nplus_pt_resume'"));

// Cert-aware module-load aliases (Network+ side, distinct from Sec+ pattern)

// Drill code — state machine + render functions

// Sidebar + breadcrumb wiring

// HTML page exists

// CSS contract

// Cert-pack data
test('v4.96.0 PT: netplus.js declares packetTraceScenarios',
  certNetplus.includes('packetTraceScenarios:'));
test('v4.96.0 PT: netplus.js declares packetTraceLessons',
  certNetplus.includes('packetTraceLessons:'));
test('v4.96.4 PT: netplus.js has 15 scenarios (Batch C added TCP/TLS/IPsec/WPA2/Traceroute)',
  (() => {
    // Count `unlockAfter:` — appears once per scenario at top level, never nested
    const m = certNetplus.match(/packetTraceScenarios:\s*\[([\s\S]+?)\n\s*\],\s*\n\s*packetTraceLessons:/);
    if (!m) return false;
    const unlocks = m[1].match(/\bunlockAfter:\s*\[/g) || [];
    return unlocks.length === 15;
  })());
test('v4.96.0 PT: netplus.js has 5 lessons at v1',
  (() => {
    // Count `keyPoints:` — appears once per lesson at top level, never nested.
    // packetTraceLessons is the last property in the cert pack so match to EOF.
    const m = certNetplus.match(/packetTraceLessons:\s*\[([\s\S]+)$/);
    if (!m) return false;
    const points = m[1].match(/\bkeyPoints:\s*\[/g) || [];
    return points.length === 5;
  })());

// ============================================================================
// v4.96.1 — Packet Trace slide animation (polish)
// ============================================================================

// ============================================================================
// v4.97.0 — Incident Response War Room (Sec+ flagship #1, issue #312)
// ============================================================================
test('v4.97.0 IRW: secplus.js declares incidentResponseScenarios',
  certSecplus.includes('incidentResponseScenarios:'));
test('v4.97.0 IRW: secplus.js declares incidentResponsePhases (PICERL)',
  certSecplus.includes('incidentResponsePhases:'));
test('v4.97.0 IRW: secplus.js declares incidentResponseVectors',
  certSecplus.includes('incidentResponseVectors:'));
test('v4.97.3 IRW: secplus.js has 20 scenarios (v4.97.3 added 5 final: vishing/0-day/azure/cfo-embezzle/apt)',
  (() => {
    const m = certSecplus.match(/incidentResponseScenarios:\s*\[([\s\S]+?)INCIDENT RESPONSE LESSONS/);
    if (!m) return false;
    const scenarioIds = m[1].match(/^      id: '[a-z][a-z0-9-]+',/gm) || [];
    return scenarioIds.length === 20;
  })());
test('v4.97.0 IRW: 6 PICERL phases canonical order',
  /incidentResponsePhases:\s*\[[\s\S]{0,800}preparation[\s\S]{0,400}identification[\s\S]{0,400}containment[\s\S]{0,400}eradication[\s\S]{0,400}recovery[\s\S]{0,400}lessons/.test(certSecplus));
test('v4.97.0 IRW: STORAGE.IRW_MASTERY + IRW_LESSONS keys defined',
  /IRW_MASTERY:\s*'nplus_irw_mastery'/.test(js) &&
  /IRW_LESSONS:\s*'nplus_irw_lessons'/.test(js));
test('v4.97.0 IRW: cloud-store registers IRW keys',
  cloudStoreJs.includes("'nplus_irw_mastery'") &&
  cloudStoreJs.includes("'nplus_irw_lessons'"));
test('v4.97.0 IRW: IRW total actions ≥ 100 across 5 scenarios',
  (() => {
    // Match to EOF — see scenarios test above.
    const m = certSecplus.match(/incidentResponseScenarios:\s*\[([\s\S]+)$/);
    if (!m) return false;
    // Action lines: `            { id: 'p1a1', ...` — `{ id: '` + p<N>a<N> prefix
    const actions = m[1].match(/\{ id: 'p\d+a\d+'/g) || [];
    return actions.length >= 100;
  })());
test('v4.97.0 IRW: ryuk-finance scenario has trapCallout (power-off canonical)',
  /id:\s*'ryuk-finance'[\s\S]{0,12000}trapCallout:\s*\{/.test(certSecplus));
test('v4.97.0 IRW: lockbit-multihost gated behind ryuk-finance (unlockAfter)',
  /id:\s*'lockbit-multihost'[\s\S]{0,500}unlockAfter:\s*\['ryuk-finance'\]/.test(certSecplus));

// ============================================================================
// v4.97.1 — IR War Room Batch 2/4: Pressure mode + 5 scenarios + 6 lessons
// ============================================================================
test('v4.97.1 IRW: secplus.js declares incidentResponseLessons (6 PICERL cheatsheets)',
  certSecplus.includes('incidentResponseLessons:'));
test('v4.97.1 IRW: 6 lesson cards present',
  (() => {
    const m = certSecplus.match(/incidentResponseLessons:\s*\[([\s\S]+)$/);
    if (!m) return false;
    const phaseRefs = m[1].match(/^      phase:\s*'[a-z-]+'/gm) || [];
    return phaseRefs.length === 6;
  })());
test('v4.97.1 IRW: lesson card structure (phase + title + goal + actions + traps)',
  /phase:\s*'preparation'[\s\S]{0,3000}title:\s*'Preparation'[\s\S]{0,3000}goal:[\s\S]{0,500}actions:\s*\[[\s\S]{0,3000}traps:\s*\[/.test(certSecplus));
test('v4.97.1 IRW: containment lesson references "isolate" + "power off" trap',
  /phase:\s*'containment'[\s\S]{0,5000}power-off|phase:\s*'containment'[\s\S]{0,5000}power off/i.test(certSecplus));
test('v4.97.1 IRW: 5 new scenarios shipped (ddos-frontend, npm-supply-chain, aws-key-leak, spear-to-ransomware, k8s-container-escape)',
  /id:\s*'ddos-frontend'/.test(certSecplus) &&
  /id:\s*'npm-supply-chain'/.test(certSecplus) &&
  /id:\s*'aws-key-leak'/.test(certSecplus) &&
  /id:\s*'spear-to-ransomware'/.test(certSecplus) &&
  /id:\s*'k8s-container-escape'/.test(certSecplus));
test('v4.97.1 IRW: spear-to-ransomware locked behind bec-wire-fraud',
  /id:\s*'spear-to-ransomware'[\s\S]{0,500}unlockAfter:\s*\['bec-wire-fraud'\]/.test(certSecplus));
test('v4.97.1 IRW: k8s-container-escape locked behind s3-pii-exposure',
  /id:\s*'k8s-container-escape'[\s\S]{0,500}unlockAfter:\s*\['s3-pii-exposure'\]/.test(certSecplus));
test('v4.97.1 IRW: npm-supply-chain locked behind ryuk-finance',
  /id:\s*'npm-supply-chain'[\s\S]{0,500}unlockAfter:\s*\['ryuk-finance'\]/.test(certSecplus));
test('v4.97.1 IRW: total actions ≥ 250 across 10 scenarios',
  (() => {
    const m = certSecplus.match(/incidentResponseScenarios:\s*\[([\s\S]+?)INCIDENT RESPONSE LESSONS/);
    if (!m) return false;
    const actions = m[1].match(/\{ id: 'p\d+a\d+'/g) || [];
    return actions.length >= 250;
  })());

// ============================================================================
// v4.97.2 — IR War Room Batch 3/4: AI generator + 7-layer validator + 5 scens
// ============================================================================
test('v4.97.2 IRW: 5 new scenarios shipped (mfa-bombing, dns-registrar-hijack, stolen-laptop, saas-vendor-breach, golden-ticket)',
  /id:\s*'mfa-bombing'/.test(certSecplus) &&
  /id:\s*'dns-registrar-hijack'/.test(certSecplus) &&
  /id:\s*'stolen-laptop'/.test(certSecplus) &&
  /id:\s*'saas-vendor-breach'/.test(certSecplus) &&
  /id:\s*'golden-ticket'/.test(certSecplus));
test('v4.97.2 IRW: total actions ≥ 400 across 15 scenarios',
  (() => {
    const m = certSecplus.match(/incidentResponseScenarios:\s*\[([\s\S]+?)INCIDENT RESPONSE LESSONS/);
    if (!m) return false;
    const actions = m[1].match(/\{ id: 'p\d+a\d+'/g) || [];
    return actions.length >= 400;
  })());
test('v4.97.2 IRW: golden-ticket has krbtgt-rotation trapCallout',
  /id:\s*'golden-ticket'[\s\S]{0,15000}trapCallout:\s*\{/.test(certSecplus));
test('v4.97.2 IRW: validator rejects famously real public IPs',
  /8\.8\.8\.8|1\.1\.1\.1/.test(js));

// ============================================================================
// v4.97.3 — IR War Room Batch 4/4 (FINAL): 5 scenarios + dashboard + AI persist
// Issue #312 (Sec+ flagship #1) closes here.
// ============================================================================
test('v4.97.3 IRW: 5 final scenarios shipped (vishing-exfil, zero-day-rce, azure-tenant-compromise, cfo-embezzlement, apt-nation-state)',
  /id:\s*'vishing-exfil'/.test(certSecplus) &&
  /id:\s*'zero-day-rce'/.test(certSecplus) &&
  /id:\s*'azure-tenant-compromise'/.test(certSecplus) &&
  /id:\s*'cfo-embezzlement'/.test(certSecplus) &&
  /id:\s*'apt-nation-state'/.test(certSecplus));
test('v4.97.3 IRW: total actions ≥ 550 across 20 scenarios',
  (() => {
    const m = certSecplus.match(/incidentResponseScenarios:\s*\[([\s\S]+?)INCIDENT RESPONSE LESSONS/);
    if (!m) return false;
    const actions = m[1].match(/\{ id: 'p\d+a\d+'/g) || [];
    return actions.length >= 550;
  })());
test('v4.97.3 IRW: apt-nation-state has trapCallout for "obvious containment" pattern',
  /id:\s*'apt-nation-state'[\s\S]{0,15000}trapCallout:\s*\{/.test(certSecplus));
test('v4.97.3 IRW: zero-day-rce locked behind k8s-container-escape',
  /id:\s*'zero-day-rce'[\s\S]{0,500}unlockAfter:\s*\['k8s-container-escape'\]/.test(certSecplus));
test('v4.97.3 IRW: apt-nation-state locked behind golden-ticket (apex scenario)',
  /id:\s*'apt-nation-state'[\s\S]{0,500}unlockAfter:\s*\['golden-ticket'\]/.test(certSecplus));

// ============================================================================
// v4.98.0 — Phishing Triage Lab Batch 1/4 (Sec+ flagship #2, issue #313)
// ============================================================================
test('v4.98.0 PHT: secplus.js declares phishingScenarios',
  certSecplus.includes('phishingScenarios:'));
test('v4.98.0 PHT: secplus.js declares phishingLessons',
  certSecplus.includes('phishingLessons:'));
test('v4.98.0 PHT: secplus.js declares phishingVectors (4 vectors)',
  certSecplus.includes('phishingVectors:') &&
  /'email'/.test(certSecplus) && /'sms'/.test(certSecplus) &&
  /'voice'/.test(certSecplus) && /'qr'/.test(certSecplus));
test('v4.98.2 PHT: 27 phish total (10 email + 6 SMS + 6 voice + 5 QR) at v4.98.2',
  (() => {
    const m = certSecplus.match(/phishingScenarios:\s*\[([\s\S]+?)phishingLessons:/);
    if (!m) return false;
    const ids = m[1].match(/^      id: '[a-z][a-z0-9-]+',/gm) || [];
    return ids.length === 27;
  })());
test('v4.98.0 PHT: 6 phish IDs (cfo-bec / ms-password / vendor-invoice / it-mfa / bank-fraud / ceo-gift-card)',
  /id:\s*'cfo-bec-wire-fraud'/.test(certSecplus) &&
  /id:\s*'ms-password-expiry'/.test(certSecplus) &&
  /id:\s*'vendor-invoice-update'/.test(certSecplus) &&
  /id:\s*'it-mfa-reset'/.test(certSecplus) &&
  /id:\s*'bank-fraud-callback'/.test(certSecplus) &&
  /id:\s*'ceo-gift-card'/.test(certSecplus));
test('v4.98.0 PHT: vendor-invoice locked behind cfo-bec-wire-fraud (progressive disclosure)',
  /id:\s*'vendor-invoice-update'[\s\S]{0,500}unlockAfter:\s*\['cfo-bec-wire-fraud'\]/.test(certSecplus));
test('v4.98.0 PHT: STORAGE.PHT_MASTERY + PHT_LESSONS keys defined',
  /PHT_MASTERY:\s*'nplus_pht_mastery'/.test(js) &&
  /PHT_LESSONS:\s*'nplus_pht_lessons'/.test(js));
test('v4.98.0 PHT: cloud-store registers PHT keys',
  cloudStoreJs.includes("'nplus_pht_mastery'") &&
  cloudStoreJs.includes("'nplus_pht_lessons'"));
test('v4.98.0 PHT: 4 lesson cards (anatomy, BEC, credential harvest, callback)',
  /id:\s*'anatomy-of-phish'/.test(certSecplus) &&
  /id:\s*'bec-redflags'/.test(certSecplus) &&
  /id:\s*'credential-harvest-redflags'/.test(certSecplus) &&
  /id:\s*'callback-scam-redflags'/.test(certSecplus));
test('v4.98.0 PHT: total flags ≥ 35 across 6 phish',
  (() => {
    const m = certSecplus.match(/phishingScenarios:\s*\[([\s\S]+?)phishingLessons:/);
    if (!m) return false;
    const flags = m[1].match(/\{ id:\s*'f\d+'/g) || [];
    return flags.length >= 35;
  })());
test('v4.98.0 PHT: cfo-bec-wire-fraud has all 5 decisionReveal options',
  /id:\s*'cfo-bec-wire-fraud'[\s\S]{0,15000}decisionReveal:\s*\{[\s\S]{0,3000}report:[\s\S]{0,500}delete:[\s\S]{0,500}reply:[\s\S]{0,500}click:[\s\S]{0,500}spam:/.test(certSecplus));

// ============================================================================
// v4.98.1 — PHT Batch 2/4: +4 email + smishing variant (SMS UI + 6 SMS phish)
// ============================================================================
test('v4.98.1 PHT: 4 new email phish (docusign, github, aws-suspended, hr-benefits)',
  /id:\s*'docusign-contract'/.test(certSecplus) &&
  /id:\s*'github-security-alert'/.test(certSecplus) &&
  /id:\s*'aws-account-suspended'/.test(certSecplus) &&
  /id:\s*'hr-benefits-enrolment'/.test(certSecplus));
test('v4.98.1 PHT: 6 new SMS phish (bank-fraud, package, irs, ms-2fa, apple-id, verizon)',
  /id:\s*'bank-fraud-smish'/.test(certSecplus) &&
  /id:\s*'package-delivery-smish'/.test(certSecplus) &&
  /id:\s*'irs-refund-smish'/.test(certSecplus) &&
  /id:\s*'ms-2fa-smish'/.test(certSecplus) &&
  /id:\s*'apple-id-locked-smish'/.test(certSecplus) &&
  /id:\s*'verizon-billing-smish'/.test(certSecplus));
test('v4.98.1 PHT: SMS phish use vector "sms"',
  (() => {
    // Match top-level scenario `vector: 'sms',` lines (6-space indent, comma-terminated)
    const m = certSecplus.match(/phishingScenarios:\s*\[([\s\S]+?)phishingLessons:/);
    if (!m) return false;
    const smsCount = (m[1].match(/^      vector:\s*'sms',/gm) || []).length;
    return smsCount === 6;
  })());
test('v4.98.1 PHT: smishing lesson card added',
  /id:\s*'smishing-redflags'/.test(certSecplus));
test('v4.98.2 PHT: 7 lesson cards now (was 4 → 5 → 7; v4.98.2 added vishing + quishing)',
  (() => {
    const m = certSecplus.match(/phishingLessons:\s*\[([\s\S]+)$/);
    if (!m) return false;
    const ids = m[1].match(/^      id:\s*'[a-z-]+'/gm) || [];
    return ids.length === 7;
  })());
test('v4.98.1 PHT: ms-2fa-smish has 2FA-share critical warning in patternBlurb',
  /id:\s*'ms-2fa-smish'[\s\S]{0,4000}NEVER share 2FA codes/.test(certSecplus));
test('v4.98.1 PHT: irs-refund-smish notes IRS never SMSes',
  /id:\s*'irs-refund-smish'[\s\S]{0,4000}IRS NEVER contacts/.test(certSecplus));
test('v4.98.1 PHT: SMS phish use senderId field (not sender object)',
  (() => {
    const m = certSecplus.match(/id:\s*'bank-fraud-smish'[\s\S]{0,4000}/);
    if (!m) return false;
    return /senderId:\s*'BANK-ALERT'/.test(m[0]);
  })());
test('v4.98.1 PHT: ms-2fa-smish locked behind bank-fraud-smish',
  /id:\s*'ms-2fa-smish'[\s\S]{0,500}unlockAfter:\s*\['bank-fraud-smish'\]/.test(certSecplus));
test('v4.98.1 PHT: total flags ≥ 80 across 16 phish',
  (() => {
    const m = certSecplus.match(/phishingScenarios:\s*\[([\s\S]+?)phishingLessons:/);
    if (!m) return false;
    const flags = m[1].match(/\{ id:\s*'f\d+'/g) || [];
    return flags.length >= 80;
  })());

// ============================================================================
// v4.98.2 — PHT Batch 3/4: vishing + quishing variants
// ============================================================================
test('v4.98.2 PHT: 6 voice phish (vishing variant)',
  (() => {
    const m = certSecplus.match(/phishingScenarios:\s*\[([\s\S]+?)phishingLessons:/);
    if (!m) return false;
    const voiceCount = (m[1].match(/^      vector:\s*'voice',/gm) || []).length;
    return voiceCount === 6;
  })());
test('v4.98.2 PHT: 5 QR phish (quishing variant)',
  (() => {
    const m = certSecplus.match(/phishingScenarios:\s*\[([\s\S]+?)phishingLessons:/);
    if (!m) return false;
    const qrCount = (m[1].match(/^      vector:\s*'qr',/gm) || []).length;
    return qrCount === 5;
  })());
test('v4.98.2 PHT: voice phish IDs (ms-tech, irs-back-tax, bank-fraud-verify, ssn-suspension, tech-support-remote, police-warrant)',
  /id:\s*'ms-tech-support-vish'/.test(certSecplus) &&
  /id:\s*'irs-back-tax-vish'/.test(certSecplus) &&
  /id:\s*'bank-fraud-verify-vish'/.test(certSecplus) &&
  /id:\s*'ssn-suspension-vish'/.test(certSecplus) &&
  /id:\s*'tech-support-remote-vish'/.test(certSecplus) &&
  /id:\s*'police-warrant-vish'/.test(certSecplus));
test('v4.98.2 PHT: QR phish IDs (parking-meter, mfa-update-poster, restaurant-menu, charity-donation, conference-badge)',
  /id:\s*'parking-meter-qr'/.test(certSecplus) &&
  /id:\s*'mfa-update-qr'/.test(certSecplus) &&
  /id:\s*'restaurant-menu-qr'/.test(certSecplus) &&
  /id:\s*'charity-donation-qr'/.test(certSecplus) &&
  /id:\s*'conference-badge-qr'/.test(certSecplus));
test('v4.98.2 PHT: 7 lesson cards now (was 5; v4.98.2 added vishing + quishing)',
  /id:\s*'vishing-redflags'/.test(certSecplus) &&
  /id:\s*'quishing-redflags'/.test(certSecplus));
test('v4.98.2 PHT: ms-tech-support-vish patternBlurb has CRITICAL RULE about Microsoft never calling',
  /id:\s*'ms-tech-support-vish'[\s\S]{0,5000}Microsoft \+ Apple \+ IRS \+ Social Security NEVER call you/.test(certSecplus));
test('v4.98.2 PHT: irs-back-tax-vish has gift-cards-as-payment trap',
  /id:\s*'irs-back-tax-vish'[\s\S]{0,4000}gift card/.test(certSecplus));
test('v4.98.2 PHT: ssn-suspension-vish notes SSNs are never suspended',
  /id:\s*'ssn-suspension-vish'[\s\S]{0,5000}SSNs are never suspended/.test(certSecplus));
test('v4.98.2 PHT: parking-meter-qr decoded URL ≠ real city domain',
  /id:\s*'parking-meter-qr'[\s\S]{0,3000}park-now-pay\.app[\s\S]{0,500}parkdc\.dc\.gov/.test(certSecplus));
test('v4.98.2 PHT: tech-support-remote-vish locked behind ms-tech-support-vish',
  /id:\s*'tech-support-remote-vish'[\s\S]{0,500}unlockAfter:\s*\['ms-tech-support-vish'\]/.test(certSecplus));
test('v4.98.2 PHT: mfa-update-qr locked behind parking-meter-qr',
  /id:\s*'mfa-update-qr'[\s\S]{0,500}unlockAfter:\s*\['parking-meter-qr'\]/.test(certSecplus));
test('v4.98.2 PHT: bank-fraud-verify-vish locked behind bank-fraud-smish (cross-vector progression)',
  /id:\s*'bank-fraud-verify-vish'[\s\S]{0,500}unlockAfter:\s*\['bank-fraud-smish'\]/.test(certSecplus));
test('v4.98.2 PHT: total flags ≥ 130 across 27 phish',
  (() => {
    const m = certSecplus.match(/phishingScenarios:\s*\[([\s\S]+?)phishingLessons:/);
    if (!m) return false;
    const flags = m[1].match(/\{ id:\s*'f\d+'/g) || [];
    return flags.length >= 130;
  })());

// ============================================================================
// v4.98.3 — PHT Batch 4/4 FINAL: AI generator + 7-layer validator + dashboard
// Issue #313 (Sec+ flagship #2) closes here.
// ============================================================================

// ============================================================================
// v4.98.4 — Hotfix: escAttr() was used throughout IRW + PHT flagships but
// never defined → crashed on first render. Both flagships were inaccessible.
// ============================================================================
test('v4.98.4 hotfix: escAttr function is defined',
  /function escAttr\(/.test(js));
test('v4.98.4 hotfix: escAttr defined in same scope as escHtml (right after)',
  /function escHtml\(str\)\s*\{[\s\S]{0,400}\}\s*[\s\S]{0,500}function escAttr\(/.test(js));
test('v4.98.4 hotfix: every escAttr call site has a matching definition',
  // Counts: many call sites, exactly 1 definition. If 0 definitions but call sites exist, regression.
  (() => {
    const callSites = (js.match(/\bescAttr\(/g) || []).length;
    const defs = (js.match(/^function escAttr\(/gm) || []).length;
    return defs === 1 && callSites > 1;  // at least 1 def, at least 2 call sites (definition + use)
  })());

// ============================================================================
// v4.98.5 — Locked-card UI fix: corner padlock badge + bottom prereq banner
// (Was: absolute-positioned single div whose long prereq text overflowed the
// scenario title — caught in user feedback after v4.98.4.)
// ============================================================================

// ============================================================================
// v4.98.6 — Sec+ Practice section cert-aware: IRW + PHT replace TB + ACL leakage
// ============================================================================
test('v4.98.6 Sec+ practice: APP_SIDEBAR_PRACTICE_BASE has 3 base items (Home/Progress/Analytics)',
  (() => {
    const m = js.match(/const APP_SIDEBAR_PRACTICE_BASE\s*=\s*\[([\s\S]+?)\];/);
    if (!m) return false;
    return /'setup'/.test(m[1]) && /'progress'/.test(m[1]) && /'analytics'/.test(m[1]);
  })());
test('v4.98.6 Sec+ practice: APP_SIDEBAR_PRACTICE concatenates BASE + cert-aware TAIL',
  /APP_SIDEBAR_PRACTICE\s*=\s*\[\s*\.\.\.APP_SIDEBAR_PRACTICE_BASE,\s*\.\.\.\(\(typeof CURRENT_CERT[\s\S]{0,200}APP_SIDEBAR_PRACTICE_SECPLUS_TAIL[\s\S]{0,200}APP_SIDEBAR_PRACTICE_NETPLUS_TAIL/.test(js));
test('v4.98.6 Sec+ practice: APP_SIDEBAR_DRILLS_SECPLUS no longer contains IRW or PHT entries',
  // IRW + PHT moved out of Drills into Practice — they shouldn\'t appear in
  // the Drills array anymore (otherwise sidebar duplicates them).
  (() => {
    const m = js.match(/const APP_SIDEBAR_DRILLS_SECPLUS\s*=\s*\[([\s\S]+?)\];/);
    if (!m) return false;
    return !/page:\s*'irw'/.test(m[1]) && !/page:\s*'pht'/.test(m[1]);
  })());
test('v4.98.6 Sec+ practice: APP_SIDEBAR_DRILLS_SECPLUS still has the 3 supporting drills',
  (() => {
    const m = js.match(/const APP_SIDEBAR_DRILLS_SECPLUS\s*=\s*\[([\s\S]+?)\];/);
    if (!m) return false;
    return /'acronyms'/.test(m[1]) && /'amm'/.test(m[1]) && /'cts'/.test(m[1]);
  })());

// ============================================================================
// v4.98.7 — Account dropdown polish: opacity fix + pill renders instantly
// ============================================================================
test('v4.98.7 dropdown: backdrop-filter blur applied so dropdown is opaque-glass',
  /\.topbar-account-dropdown\s*\{[\s\S]{0,500}backdrop-filter:\s*blur/.test(css));
test('v4.98.7 dropdown: webkit prefix for Safari',
  /\.topbar-account-dropdown\s*\{[\s\S]{0,500}-webkit-backdrop-filter:\s*blur/.test(css));
test('v4.98.7 dropdown: @supports fallback uses opaque surface3 if no backdrop-filter',
  /@supports not \(backdrop-filter[\s\S]{0,300}\.topbar-account-dropdown\s*\{\s*background:\s*var\(--surface3\)/.test(css));
test('v4.98.7 auth-state: handleSignedIn calls renderSignedIn BEFORE fetchProfile',
  // Render-immediately pattern — pill appears instantly, profile fetch happens after.
  // Window bumped from 800 → 1500 in v4.99.34 after the _certanvilSignedIn
  // wire-up added a 10-line explanatory comment block before the renderSignedIn call.
  /function handleSignedIn[\s\S]{0,1500}renderSignedIn\(session\.user,\s*\{\s*role:\s*'user'\s*\}\)[\s\S]{0,300}fetchProfile\(userId\)/.test(authStateJs));
test('v4.98.7 auth-state: re-render only happens when role differs from default',
  /fetchProfile\(userId\)\.then[\s\S]{0,500}profile\.role !== 'user'[\s\S]{0,200}renderSignedIn\(session\.user,\s*profile\)/.test(authStateJs));

