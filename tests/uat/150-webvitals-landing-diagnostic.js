// tests/uat/150-webvitals-landing-diagnostic.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Web Vitals collector + admin dashboard, tablet/mobile polish, ToS/Privacy, landing baseline diagnostic D.1-D.6, migration rollback convention

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ── v4.99.45 — Phase 6b: Web Vitals collector ──
// Measurement infra ship. Adds Supabase migration + record_web_vitals RPC +
// client-side PerformanceObserver collector. Signed-in + prod-host only.
// Single write per session on tab hide. Data feeds admin slicing queries
// (p75 LCP by version, iOS vs Android etc.) so we can validate that
// Lighthouse synthetic wins translate to real-phone-on-cellular.
console.log('\n\x1b[1m── v4.99.45 — PHASE 6b WEB VITALS COLLECTOR ──\x1b[0m');

const _collectorRaw = fs.existsSync(path.join(ROOT, 'lib/web-vitals-collector.js'))
  ? fs.readFileSync(path.join(ROOT, 'lib/web-vitals-collector.js'), 'utf8')
  : '';
const _migrationRaw = fs.existsSync(path.join(ROOT, 'supabase/migrations/20260511_web_vitals.sql'))
  ? fs.readFileSync(path.join(ROOT, 'supabase/migrations/20260511_web_vitals.sql'), 'utf8')
  : '';

// — Migration —
test('v4.99.45 Phase6b: supabase/migrations/20260511_web_vitals.sql exists',
  _migrationRaw.length > 1000);
test('v4.99.45 Phase6b: migration creates web_vitals table',
  /create\s+table\s+if\s+not\s+exists\s+web_vitals\s*\(/i.test(_migrationRaw));
test('v4.99.45 Phase6b: migration creates record_web_vitals RPC',
  /create\s+or\s+replace\s+function\s+record_web_vitals\s*\(\s*payload\s+jsonb\s*\)/i.test(_migrationRaw));
test('v4.99.45 Phase6b: record_web_vitals is SECURITY DEFINER (clients can insert without table-level INSERT policy)',
  /create\s+or\s+replace\s+function\s+record_web_vitals[\s\S]{0,500}security\s+definer/i.test(_migrationRaw));
test('v4.99.45 Phase6b: record_web_vitals stamps user_id from auth.uid() (anti-spoof)',
  /auth\.uid\(\)/.test(_migrationRaw));
test('v4.99.45 Phase6b: web_vitals captures all 5 Core Web Vitals (LCP/FCP/CLS/TTFB/INP)',
  /lcp_ms\s+integer/i.test(_migrationRaw)
  && /fcp_ms\s+integer/i.test(_migrationRaw)
  && /cls\s+numeric/i.test(_migrationRaw)
  && /ttfb_ms\s+integer/i.test(_migrationRaw)
  && /inp_ms\s+integer/i.test(_migrationRaw));
test('v4.99.45 Phase6b: web_vitals captures slicing dimensions (app_version + cert + viewport + connection)',
  /app_version\s+text/i.test(_migrationRaw)
  && /cert\s+text/i.test(_migrationRaw)
  && /viewport_w\s+integer/i.test(_migrationRaw)
  && /connection_type\s+text/i.test(_migrationRaw));
test('v4.99.45 Phase6b: RLS — admin reads all, no client INSERT/UPDATE/DELETE policies (immutable log)',
  /alter\s+table\s+web_vitals\s+enable\s+row\s+level\s+security/i.test(_migrationRaw)
  && /web_vitals_admin_select[\s\S]{0,200}is_admin\(\)/i.test(_migrationRaw)
  && !/for\s+insert\s+on\s+web_vitals/i.test(_migrationRaw)
  && !/for\s+update\s+on\s+web_vitals/i.test(_migrationRaw)
  && !/for\s+delete\s+on\s+web_vitals/i.test(_migrationRaw));

// — Collector —
test('v4.99.45 Phase6b: lib/web-vitals-collector.js exists',
  _collectorRaw.length > 2000);
test('v4.99.45 Phase6b: collector wrapped in IIFE (no module-scope leaks)',
  /^\(function\(\)\s*\{/m.test(_collectorRaw)
  && /\}\)\(\);?\s*$/.test(_collectorRaw.trim()));
test('v4.99.45 Phase6b: collector gates on prod-only host (skips localhost + preview branch deploys)',
  /function\s+_isWebVitalsHost\s*\(/.test(_collectorRaw)
  && /localhost/.test(_collectorRaw)
  && /-git-/.test(_collectorRaw)
  && /\.certanvil\.com/.test(_collectorRaw));
test('v4.99.45 Phase6b: collector uses PerformanceObserver for FCP + LCP + CLS',
  /new\s+PerformanceObserver/.test(_collectorRaw)
  && /first-contentful-paint/.test(_collectorRaw)
  && /largest-contentful-paint/.test(_collectorRaw)
  && /layout-shift/.test(_collectorRaw));
test('v4.99.45 Phase6b: collector observers use buffered:true (retroactively capture pre-init events)',
  /buffered:\s*true/.test(_collectorRaw));
test('v4.99.45 Phase6b: collector reads TTFB from Navigation Timing',
  /getEntriesByType\(\s*['"]navigation['"]\s*\)/.test(_collectorRaw)
  && /responseStart/.test(_collectorRaw));
test('v4.99.45 Phase6b: collector flushes on visibilitychange:hidden AND pagehide (cross-browser)',
  /visibilitychange/.test(_collectorRaw)
  && /pagehide/.test(_collectorRaw));
test('v4.99.45 Phase6b: collector double-flush guard prevents N writes from N events',
  /_flushed\s*=\s*false/.test(_collectorRaw)
  && /_flushed\s*=\s*true/.test(_collectorRaw));
test('v4.99.45 Phase6b: collector skips flush if no Supabase client (silent no-op)',
  /window\.certanvilSupabase/.test(_collectorRaw)
  && /if\s*\(\s*!window\.certanvilSupabase/.test(_collectorRaw));
test('v4.99.45 Phase6b: collector requires signed-in session before flushing',
  /auth\.getSession\(\)/.test(_collectorRaw)
  && /session\.user/.test(_collectorRaw));
test('v4.99.45 Phase6b: collector calls record_web_vitals RPC with payload',
  /\.rpc\(\s*['"]record_web_vitals['"]/.test(_collectorRaw));
test('v4.99.45 Phase6b: collector exposes window.__certanvilWebVitals for debug/testability',
  /window\.__certanvilWebVitals\s*=/.test(_collectorRaw));
test('v4.99.45 Phase6b: collector strips auth tokens from page_path (anti-PII)',
  /access_token|refresh_token/.test(_collectorRaw)
  && /replace\(/.test(_collectorRaw));

// — Wiring —
test('v4.99.45 Phase6b: index.html loads collector after Supabase but before app.js',
  (() => {
    // Verify the script tag order: supabase modules → web-vitals-collector → app.js
    // v4.99.50: anchor on `<script ... src="lib/web-vitals-collector.js">` not just the
    // literal string, since the v4.99.50 admin-dashboard description mentions the
    // path in body copy too.
    const wvIdx = html.indexOf('<script defer src="lib/web-vitals-collector.js"');
    const appIdx = html.indexOf('src="app.js"');
    const supaIdx = html.indexOf('<script defer src="lib/supabase.js"');
    return wvIdx > 0 && wvIdx > supaIdx && wvIdx < appIdx;
  })());
test('v4.99.45 Phase6b: app.js exposes APP_VERSION on window for collector consumption',
  /window\.APP_VERSION\s*=\s*APP_VERSION/.test(js));

// ── v4.99.46 — Hotfix: signed-in Pro users blocked from diagnostic + 3 other flows ──
// Founder-caught on iPhone 2026-05-11: tapping "🩺 Take the Diagnostic" on
// mobile did nothing visible. Root cause: startDiagnostic + 3 other Tier A
// teacher flows rolled their own `if (!key)` BYOK check that didn't account
// for window._certanvilSignedIn. The v4.99.33 fix unified this through
// validateApiKey() for startQuiz / startExam / drill launchers — but missed
// these 4 sites. From the founder POV: invisible toast + subtle goSettings
// transition = "nothing happened."
console.log('\n\x1b[1m── v4.99.46 — DIAGNOSTIC SIGNED-IN BYOK BYPASS HOTFIX ──\x1b[0m');

test('v4.99.46 hotfix: startDiagnostic uses validateApiKey (handles signed-in proxy users)',
  // _fnBody extracts the function body. We assert validateApiKey is called
  // before the confirm() prompt so signed-in users see the dialog they need.
  (() => {
    const body = _fnBody(js, 'startDiagnostic');
    if (!body) return false;
    // validateApiKey must be called BEFORE the confirm() prompt
    const vIdx = body.indexOf('validateApiKey(');
    const cIdx = body.indexOf("confirm('");
    return vIdx > -1 && cIdx > -1 && vIdx < cIdx;
  })());
test('v4.99.46 hotfix: startDiagnostic does NOT have rolled-own `if (!key)` early-return that ignores signed-in',
  // The pre-fix pattern: `if (!key) { showToast(...); goSettings(); return; }`.
  // Post-fix uses validateApiKey() return value. Guard against the rolled-own
  // pattern resurfacing.
  (() => {
    const body = _fnBody(js, 'startDiagnostic');
    if (!body) return false;
    // The bad pattern: `if (!key) { showToast(...api key...); ...return; }`
    return !/if\s*\(\s*!key\s*\)\s*\{[\s\S]{0,200}Add\s+your\s+API\s+key/i.test(body);
  })());
test('v4.99.46 hotfix: regression tombstone — original "Add your API key in Settings first" toast not in startDiagnostic',
  // The exact pre-fix toast string must not return.
  (() => {
    const body = _fnBody(js, 'startDiagnostic');
    return body && !/Add your API key in Settings first/i.test(body);
  })());
test('v4.99.46 hotfix: explainFurther uses validateApiKey',
  (() => {
    const body = _fnBody(js, 'explainFurther');
    return body && /validateApiKey\(/.test(body);
  })());
test('v4.99.46 hotfix: drill-this-concept uses validateApiKey',
  // Anchor on the unique "Drill this concept" button label (which is reset
  // in the error-path block right after the validateApiKey check). Plain
  // text avoids the surrogate-pair regex issue with the 🎯 emoji.
  /validateApiKey\(key\)[\s\S]{0,300}Drill this concept/.test(js));
test('v4.99.46 hotfix: topic-deep-dive (showTopicDeepDive or buildTopicDive*) uses validateApiKey',
  // Find by searching for the unique 'No API key found' error message + validateApiKey nearby.
  /No API key found[\s\S]{0,1000}validateApiKey\(|validateApiKey\([\s\S]{0,1000}No API key found/.test(js));

// ── v4.99.47 — Phase 7: tablet layout (iPad portrait pinned sidebar + grid pinning) ──
// CSS-only ship. Lowers sidebar-drawer breakpoint from 900→767 so iPad portrait
// (768+) gets a pinned sidebar matching the desktop pattern. Adds a tablet
// portrait media block at the end of styles.css with explicit grid overrides
// for drills-launcher, modes-domain-tiles, ana-milestones, and quiz-presets
// because auto-fit minmax doesn't pick the right column count when content
// area shrinks to ~548px after sidebar pins.
console.log('\n\x1b[1m── v4.99.47 — PHASE 7 TABLET LAYOUT ──\x1b[0m');

test('v4.99.47 Phase7: sidebar mobile-drawer breakpoint lowered to 767px',
  /@media \(max-width:\s*767px\)[\s\S]{0,800}\.app-sidebar\s*\{[^}]*transform:\s*translateX\(-100%\)/.test(css));
test('v4.99.47 Phase7: tablet portrait media block exists at end of styles.css (768-1023)',
  /TABLET PORTRAIT[\s\S]{0,1200}@media \(min-width:\s*768px\) and \(max-width:\s*1023px\)/i.test(css));
test('v4.99.47 Phase7: tablet block pins sidebar at narrower 200px width',
  /@media \(min-width:\s*768px\) and \(max-width:\s*1023px\)[\s\S]{0,2000}\.app-sidebar\s*\{[^}]*width:\s*200px/.test(css));
test('v4.99.47 Phase7: tablet block pins drills-grid to 2-col (auto-fit picks 1-col at this width)',
  /@media \(min-width:\s*768px\) and \(max-width:\s*1023px\)[\s\S]{0,2000}\.drills-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*1fr\)/.test(css));
test('v4.99.47 Phase7: tablet block pins modes-domain-tiles to 3-col (was cramped 5-col)',
  /@media \(min-width:\s*768px\) and \(max-width:\s*1023px\)[\s\S]{0,2000}\.modes-domain-tiles\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/.test(css));
test('v4.99.47 Phase7: tablet block pins domain-grid to 3-col (analytics page)',
  /@media \(min-width:\s*768px\) and \(max-width:\s*1023px\)[\s\S]{0,2000}\.domain-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/.test(css));
test('v4.99.47 Phase7: tablet block pins ana-milestones to 3-col (was 4-col on desktop)',
  /@media \(min-width:\s*768px\) and \(max-width:\s*1023px\)[\s\S]{0,2000}\.ana-milestones\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/.test(css));
test('v4.99.47 Phase7: JS sidebar a11y breakpoint lowered to <768 (matches CSS)',
  /isMobile\s*=\s*window\.innerWidth\s*<\s*768/.test(js));

// ── v4.99.48 — Phase 8: desktop-only nudge (5 features) ──
// Closes the loop from Phase 7 audit: TB / ACL / IRW / PHT / Packet Trace
// all render awkwardly at iPad portrait. Pre-Phase-8 the only signal was a
// 3-second toast then bail — felt broken. Phase 8 replaces with a clean
// modal overlay with Web Share / copy-link affordances to continue on
// desktop. Same <900 viewport gate as Phase 7 sidebar pin breakpoint
// inverse (phones <768 + iPad portrait 768-899 fire the nudge; iPad
// landscape 900+ and desktop work normally).
console.log('\n\x1b[1m── v4.99.48 — PHASE 8 DESKTOP-ONLY NUDGE ──\x1b[0m');

test('v4.99.48 Phase8: _isDesktopOnlyViewport helper defined (gates at innerWidth < 900)',
  /function\s+_isDesktopOnlyViewport\s*\(\s*\)\s*\{[\s\S]{0,200}innerWidth\s*<\s*900/.test(js));
test('v4.99.48 Phase8: _showDesktopOnlyNudge helper defined',
  /function\s+_showDesktopOnlyNudge\s*\(\s*featureName/.test(js));
test('v4.99.48 Phase8: nudge supports Web Share API + copy-link fallback',
  /navigator\.share/.test(js) && /clipboard\.writeText/.test(js));
test('v4.99.48 Phase8: nudge uses dialog ARIA semantics (role + aria-modal)',
  /setAttribute\(['"]role['"],\s*['"]dialog['"]\)/.test(js)
  && /setAttribute\(['"]aria-modal['"],\s*['"]true['"]\)/.test(js));
test('v4.99.48 Phase8: nudge CSS exists in stylesheet (.donudge-overlay + .donudge-card)',
  /\.donudge-overlay\s*\{/.test(css) && /\.donudge-card\s*\{/.test(css));
test('v4.99.48 Phase8: nudge respects prefers-reduced-motion',
  /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]{0,200}\.donudge-overlay/.test(css));
test('v4.99.48 Phase8: regression tombstone — TB no longer uses showErrorToast for desktop-only',
  // The old "Topology Builder works best on desktop. Open on a wider screen" toast must be gone
  !/showErrorToast\("Topology Builder works best on desktop\. Open on a wider screen\."/.test(js));

// ── v4.99.49 — Phase 10: day-to-day mobile usability ──
// Wake Lock during exam · Visibility API for pause-on-blur · online/offline
// banner · inputmode hints on numeric/decimal inputs. Each piece is small
// but cumulatively closes the "feels like a real mobile app" gap.
console.log('\n\x1b[1m── v4.99.49 — PHASE 10 DAY-TO-DAY MOBILE POLISH ──\x1b[0m');

// Wake Lock
test('v4.99.49 Phase10: _acquireExamWakeLock helper defined (Screen Wake Lock API)',
  /async\s+function\s+_acquireExamWakeLock\s*\(/.test(js)
  && /navigator\.wakeLock\.request\(['"]screen['"]\)/.test(js));
test('v4.99.49 Phase10: _releaseExamWakeLock helper defined',
  /async\s+function\s+_releaseExamWakeLock\s*\(/.test(js));
test('v4.99.49 Phase10: startExamTimer acquires Wake Lock when exam timer starts',
  /function\s+startExamTimer[\s\S]{0,400}_acquireExamWakeLock\s*\(\s*\)/.test(js));
test('v4.99.49 Phase10: submitExam releases Wake Lock',
  /function\s+submitExam[\s\S]{0,400}_releaseExamWakeLock\s*\(\s*\)/.test(js));
test('v4.99.49 Phase10: exam timer auto-release on timeout also releases Wake Lock',
  // Inside the setInterval callback: examTimeLeft <= 0 → clear + release + submit
  /examTimeLeft\s*<=\s*0[\s\S]{0,150}_releaseExamWakeLock\s*\(\s*\)/.test(js));

// Visibility API
test('v4.99.49 Phase10: _examOnVisibilityChange handler defined',
  /function\s+_examOnVisibilityChange\s*\(/.test(js));
test('v4.99.49 Phase10: visibility handler is registered as event listener',
  /document\.addEventListener\(\s*['"]visibilitychange['"]\s*,\s*_examOnVisibilityChange/.test(js));
test('v4.99.49 Phase10: visibility handler extends examEndTime by hidden duration (no lost seconds)',
  /_examOnVisibilityChange[\s\S]{0,500}examEndTime\s*\+=\s*hiddenMs/.test(js));

// Online/offline banner
test('v4.99.49 Phase10: _renderConnectivityBanner helper defined',
  /function\s+_renderConnectivityBanner\s*\(\s*state\s*\)/.test(js));
test('v4.99.49 Phase10: online + offline event listeners registered',
  /window\.addEventListener\(\s*['"]offline['"]\s*,/.test(js)
  && /window\.addEventListener\(\s*['"]online['"]\s*,/.test(js));
test('v4.99.49 Phase10: initial cold-start offline check on DOMContentLoaded',
  /navigator\.onLine\s*===\s*false[\s\S]{0,200}_renderConnectivityBanner\(\s*['"]offline['"]\s*\)/.test(js));
test('v4.99.49 Phase10: connectivity-banner CSS exists (sticky top, slide-in animation)',
  /\.connectivity-banner\s*\{/.test(css)
  && /\.connectivity-banner\.offline\s*\{/.test(css)
  && /\.connectivity-banner\.online\s*\{/.test(css));
test('v4.99.49 Phase10: connectivity banner respects prefers-reduced-motion',
  /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]{0,300}\.connectivity-banner/.test(css));

// inputmode hints
test('v4.99.49 Phase10: settings daily-goal input has inputmode="numeric"',
  /id="settings-daily-input"[^>]*inputmode="numeric"|inputmode="numeric"[^>]*id="settings-daily-input"/.test(html));

// Read subnet-trainer.js source for inputmode check on its inputs
let _featStRaw = ""; try { _featStRaw = fs.readFileSync(path.join(ROOT, 'features/subnet-trainer.js'), "utf8"); } catch (_) { /* MVP-quiz-only: deleted */ }

// ── v4.99.50 — Phase 6c: Web Vitals admin dashboard ──
// Reads the web_vitals table (Phase 6b collector). Admin-only. Renders
// p75 summary cards + per-cert + per-version + per-platform + recent 20.
// Reachable via /?action=web-vitals URL param.
console.log('\n\x1b[1m── v4.99.50 — PHASE 6c WEB VITALS DASHBOARD ──\x1b[0m');

test('v4.99.50 Phase6c: #page-web-vitals exists in index.html',
  /<div\s+id="page-web-vitals"\s+class="page">/.test(html));
test('v4.99.50 Phase6c: page has the 5 expected render mount points',
  /id="wv-summary"/.test(html)
  && /id="wv-bycert"/.test(html)
  && /id="wv-byversion"/.test(html)
  && /id="wv-byplatform"/.test(html)
  && /id="wv-recent"/.test(html));
test('v4.99.50 Phase6c: openWebVitalsAdmin function defined',
  /async\s+function\s+openWebVitalsAdmin\s*\(/.test(js));
test('v4.99.50 Phase6c: openWebVitalsAdmin gates via is_admin RPC',
  /openWebVitalsAdmin[\s\S]{0,500}\.rpc\(\s*['"]is_admin['"]/.test(js));
test('v4.99.50 Phase6c: renderWebVitals function defined',
  /async\s+function\s+renderWebVitals\s*\(/.test(js));
test('v4.99.50 Phase6c: dashboard fetches from web_vitals table',
  /\.from\(['"]web_vitals['"]\)[\s\S]{0,200}\.select/.test(js));
test('v4.99.50 Phase6c: dashboard filters last 7 days',
  /7\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000[\s\S]{0,200}gte\(['"]captured_at['"]/.test(js));
test('v4.99.50 Phase6c: URL action ?action=web-vitals opens dashboard',
  /action\s*===\s*['"]web-vitals['"][\s\S]{0,200}openWebVitalsAdmin/.test(js));
test('v4.99.50 Phase6c: p75 helper used for percentile calculation',
  /\.slice\(\)\.sort[\s\S]{0,100}sorted\[Math\.floor\(sorted\.length\s*\*\s*0\.75\)\]/.test(js));
test('v4.99.50 Phase6c: LCP/FCP/CLS/TTFB all surfaced in summary',
  /LCP[\s\S]{0,300}FCP[\s\S]{0,300}CLS[\s\S]{0,300}TTFB/.test(js));
test('v4.99.50 Phase6c: by-platform slice (iOS / Android / Other)',
  /platLcps\s*=\s*\{\s*iOS:[\s\S]{0,80}Android:[\s\S]{0,80}Other:/.test(js));
test('v4.99.50 Phase6c: dashboard CSS exists (.wv-summary-grid + .wv-card)',
  /\.wv-summary-grid\s*\{/.test(css) && /\.wv-card\s*\{/.test(css));
test('v4.99.50 Phase6c: dashboard CSS has good/mid/bad verdict color tiers',
  /\.wv-card\.wv-good\s*\{/.test(css)
  && /\.wv-card\.wv-mid\s*\{/.test(css)
  && /\.wv-card\.wv-bad\s*\{/.test(css));
test('v4.99.50 Phase6c: dashboard is responsive (2-col grid at mobile)',
  /@media\s*\(max-width:\s*600px\)[\s\S]{0,300}\.wv-summary-grid\s*\{\s*grid-template-columns:\s*repeat\(2,/.test(css));

// ── v4.99.51 — Pre-launch: ToS + Privacy Policy ──
// Founder-stated bar: "really good and legit" — not boilerplate. Customised
// to CertAnvil's actual data flows (Supabase auth, Stripe billing, web_vitals
// telemetry, Anthropic AI proxy, magic-link auth, account deletion cascade,
// pass guarantee terms). GDPR + CCPA baseline. UK governing law.
console.log('\n\x1b[1m── v4.99.51 — TOS + PRIVACY POLICY DRAFTS ──\x1b[0m');

const _privacyRaw = fs.existsSync(path.join(ROOT, 'landing/privacy.html'))
  ? fs.readFileSync(path.join(ROOT, 'landing/privacy.html'), 'utf8') : '';
const _termsRaw = fs.existsSync(path.join(ROOT, 'landing/terms.html'))
  ? fs.readFileSync(path.join(ROOT, 'landing/terms.html'), 'utf8') : '';
const _landingIndexRaw = fs.readFileSync(path.join(ROOT, 'landing/index.html'), 'utf8');
const _landingPricingRaw = fs.readFileSync(path.join(ROOT, 'landing/pricing.html'), 'utf8');

// Privacy Policy structural guards
test('v4.99.51 Privacy: landing/privacy.html exists',
  _privacyRaw.length > 10000);
test('v4.99.51 Privacy: page has the 13 required sections (h2 ids)',
  ['who-we-are', 'what-we-collect', 'why-we-collect', 'who-we-share',
   'where-stored', 'how-long', 'cookies', 'your-rights', 'international',
   'security', 'children', 'changes', 'contact'].every(id =>
    _privacyRaw.includes('id="' + id + '"')));
test('v4.99.51 Privacy: lists all named sub-processors (Supabase, Stripe, Anthropic, Resend, Vercel, Hostinger)',
  /Supabase/.test(_privacyRaw)
  && /Stripe/.test(_privacyRaw)
  && /Anthropic/.test(_privacyRaw)
  && /Resend/.test(_privacyRaw)
  && /Vercel/.test(_privacyRaw)
  && /Hostinger/.test(_privacyRaw));
test('v4.99.51 Privacy: covers all 5 actual data categories (account · quiz · billing · telemetry · operational)',
  /Account data/i.test(_privacyRaw)
  && /Quiz.*data/i.test(_privacyRaw)
  && /Billing data/i.test(_privacyRaw)
  && /telemetry|Performance/i.test(_privacyRaw)
  && /AI usage|Operational/i.test(_privacyRaw));
test('v4.99.51 Privacy: GDPR + CCPA rights listed',
  /GDPR/.test(_privacyRaw) && /CCPA/.test(_privacyRaw)
  && /right to be forgotten|Erasure/i.test(_privacyRaw)
  && /portability/i.test(_privacyRaw));
test('v4.99.51 Privacy: ICO complaint route mentioned (UK)',
  /Information Commissioner.s Office|ICO/.test(_privacyRaw));
test('v4.99.51 Privacy: children\'s policy (13+ minimum age) present',
  /\b13\b[\s\S]{0,300}years|under 13/i.test(_privacyRaw));
test('v4.99.51 Privacy: dedicated privacy email exists',
  /privacy@certanvil\.com/.test(_privacyRaw));
test('v4.99.51 Privacy: 7-day self-delete cascade documented',
  /7 days|self-delete|cascade/i.test(_privacyRaw));
test('v4.99.51 Privacy: footer links to /terms',
  /href="\/terms"/.test(_privacyRaw));

// Terms of Service structural guards
test('v4.99.51 Terms: landing/terms.html exists',
  _termsRaw.length > 10000);
test('v5.6.0 Terms: page has the 15 required sections (pass-guarantee removed)',
  ['agreement', 'eligibility', 'account', 'subscriptions',
   'refunds', 'cancellation', 'acceptable-use', 'ip', 'ai-content',
   'service', 'liability', 'termination', 'disputes', 'changes', 'contact'].every(id =>
    _termsRaw.includes('id="' + id + '"')));
test('v4.99.51 Terms: documents actual pricing ($9.99/mo + $89/yr)',
  /\$9\.99[\s\S]{0,80}month/.test(_termsRaw)
  && /\$89[\s\S]{0,80}year/.test(_termsRaw));
test('v4.99.51 Terms: 14-day refund window for first-time subscribers',
  /14[\s\S]{0,80}day[\s\S]{0,500}refund/i.test(_termsRaw));
test('v4.99.51 Terms: AI-generated content disclaimer present',
  /AI-generated|Anthropic|Claude/.test(_termsRaw)
  && /validation|cross-check|hallucinat/i.test(_termsRaw));
test('v4.99.51 Terms: liability cap = amount paid in last 12 months',
  /amount you paid us in the 12 months|amount paid.*12 months/i.test(_termsRaw));
test('v4.99.51 Terms: governing law = England and Wales',
  /England and Wales/i.test(_termsRaw));
test('v4.99.51 Terms: UK + EU consumer rights preserved',
  /Consumer Rights Act|Consumer Rights Directive|consumer-protection/i.test(_termsRaw));
test('v4.99.51 Terms: dedicated billing + support emails listed',
  /support@certanvil\.com/.test(_termsRaw)
  && /billing@certanvil\.com/.test(_termsRaw));
test('v4.99.51 Terms: acceptable-use section lists both allowed + prohibited',
  /You may:[\s\S]{0,800}You may not:/.test(_termsRaw));
test('v4.99.51 Terms: prohibits AI proxy abuse + non-cert content generation',
  /non-cert content|automate|scrape/i.test(_termsRaw));

// Cross-page wiring
test('v4.99.51 wiring: landing/index.html footer links to /privacy + /terms',
  /<a href="\/privacy"[^>]*class="fzx-link">Privacy/.test(_landingIndexRaw)
  && /<a href="\/terms"[^>]*class="fzx-link">Terms/.test(_landingIndexRaw));
test('v4.99.51 wiring: landing/index.html signup screen links to /terms + /privacy',
  /agree to our <a href="\/terms">Terms<\/a> and <a href="\/privacy">Privacy/.test(_landingIndexRaw));
test('v4.99.51 wiring: landing/pricing.html signup screen also links to /terms + /privacy',
  /agree to our <a href="\/terms">Terms<\/a> and <a href="\/privacy">Privacy/.test(_landingPricingRaw));
test('v4.99.51 wiring: regression tombstone — no `href="#"` Terms/Privacy links remain',
  !/<a href="#"[^>]*>(Privacy|Terms)<\/a>/.test(_landingIndexRaw)
  && !/<a href="#"[^>]*>(Privacy|Terms)<\/a>/.test(_landingPricingRaw));

// ── v4.99.52 — D.1: Landing Baseline Diagnostic · cert picker + intake ──
// New PLG diagnostic flow at certanvil.com/diagnostic. Anonymous-friendly
// cert picker → optional 30-second intake → state persists via sessionStorage
// → handoff to /quiz placeholder (D.2 will replace this). Admin sees Security+
// tile (otherwise hidden). 24h cooldown + Turnstile land in D.3.
console.log('\n\x1b[1m── v4.99.52 — D.1 LANDING BASELINE DIAGNOSTIC · PICKER + INTAKE ──\x1b[0m');

const _dxPickerRaw = fs.existsSync(path.join(ROOT, 'landing/diagnostic/index.html'))
  ? fs.readFileSync(path.join(ROOT, 'landing/diagnostic/index.html'), 'utf8') : '';
const _dxIntakeNetRaw = fs.existsSync(path.join(ROOT, 'landing/diagnostic/network-plus/intake.html'))
  ? fs.readFileSync(path.join(ROOT, 'landing/diagnostic/network-plus/intake.html'), 'utf8') : '';
const _dxIntakeSecRaw = fs.existsSync(path.join(ROOT, 'landing/diagnostic/security-plus/intake.html'))
  ? fs.readFileSync(path.join(ROOT, 'landing/diagnostic/security-plus/intake.html'), 'utf8') : '';
const _dxQuizNetRaw = fs.existsSync(path.join(ROOT, 'landing/diagnostic/network-plus/quiz.html'))
  ? fs.readFileSync(path.join(ROOT, 'landing/diagnostic/network-plus/quiz.html'), 'utf8') : '';
const _dxQuizSecRaw = fs.existsSync(path.join(ROOT, 'landing/diagnostic/security-plus/quiz.html'))
  ? fs.readFileSync(path.join(ROOT, 'landing/diagnostic/security-plus/quiz.html'), 'utf8') : '';
const _landingIndexD1 = fs.readFileSync(path.join(ROOT, 'landing/index.html'), 'utf8');
const _landingPricingD1 = fs.readFileSync(path.join(ROOT, 'landing/pricing.html'), 'utf8');

// — Cert picker page —
test('v4.99.52 D.1: landing/diagnostic/index.html exists',
  _dxPickerRaw.length > 5000);
test('v4.99.52 D.1: cert picker has Step 1 of 4 progress indicator',
  /Step 1 of 4/.test(_dxPickerRaw));
test('v4.99.52 D.1: cert picker has Network+ tile (always visible)',
  /data-cert="network-plus"[\s\S]{0,300}Network\+/.test(_dxPickerRaw));
test('v4.99.52 D.1: cert picker has "more coming" disabled tile',
  /More certs coming/.test(_dxPickerRaw));
test('v4.99.52 D.1: cert picker stores choice in sessionStorage',
  /certanvilDiagnosticCert/.test(_dxPickerRaw));
test('v4.99.52 D.1: cert picker Continue button navigates to /diagnostic/<cert>/intake',
  /window\.location\.href\s*=\s*['"]\/diagnostic\/['"]?\s*\+\s*selectedCert/.test(_dxPickerRaw));

// — Network+ intake page —
test('v4.99.52 D.1: Network+ intake page exists',
  _dxIntakeNetRaw.length > 5000);
test('v4.99.52 D.1: N+ intake has Step 2 of 4 progress indicator',
  /Step 2 of 4/.test(_dxIntakeNetRaw));
test('v4.99.52 D.1: N+ intake captures exam date + intensity',
  /id="dx-exam-date"/.test(_dxIntakeNetRaw)
  && /data-intensity="light"/.test(_dxIntakeNetRaw)
  && /data-intensity="standard"/.test(_dxIntakeNetRaw)
  && /data-intensity="intense"/.test(_dxIntakeNetRaw));
test('v4.99.52 D.1: N+ intake defaults to standard intensity',
  /is-selected"\s+data-intensity="standard"|data-intensity="standard"\s+aria-pressed="true"/.test(_dxIntakeNetRaw));
test('v4.99.52 D.1: N+ intake exam-date input is type=date',
  /id="dx-exam-date"[^>]*type="date"|type="date"[^>]*id="dx-exam-date"/.test(_dxIntakeNetRaw));
test('v4.99.52 D.1: N+ intake persists state to sessionStorage on Start click',
  /certanvilDiagnosticIntake/.test(_dxIntakeNetRaw));
test('v4.99.52 D.1: N+ intake has Skip link to /quiz (sensible defaults path)',
  /Skip[\s\S]{0,80}\/diagnostic\/network-plus\/quiz|\/diagnostic\/network-plus\/quiz[\s\S]{0,80}Skip/.test(_dxIntakeNetRaw));
test('v4.99.52 D.1: N+ intake has Back link to cert picker',
  /href="\/diagnostic"[\s\S]{0,100}Back to cert picker/.test(_dxIntakeNetRaw));
test('v4.99.52 D.1: N+ intake is noindex (private route)',
  /<meta\s+name="robots"\s+content="noindex/.test(_dxIntakeNetRaw));

// — Security+ intake page —
test('v4.99.52 D.1: Security+ intake page exists (admin preview)',
  _dxIntakeSecRaw.length > 5000);
test('v4.99.52 D.1: S+ intake is cert-aware (CERT = security-plus)',
  /var\s+CERT\s*=\s*['"]security-plus['"]/.test(_dxIntakeSecRaw));
test('v4.99.52 D.1: S+ intake mentions admin preview status',
  /admin preview/i.test(_dxIntakeSecRaw));
test('v4.99.52 D.1: S+ intake does NOT contain "Network+" leftovers (sed-rewrite cleanliness)',
  !/Network\+/.test(_dxIntakeSecRaw)
  && !/network-plus/.test(_dxIntakeSecRaw));

// — Quiz placeholders —
test('v4.99.52 D.1: N+ /quiz placeholder exists (D.2 lands here next)',
  _dxQuizNetRaw.length > 1000);
// v4.99.53 retired: the D.1 placeholder content was replaced by the real
// D.2 quiz UI. Intake-recap was a placeholder-only feature. The N+ quiz
// page is now exercised by the v4.99.53 D.2 guards below.
test('v4.99.52 D.1: S+ /quiz placeholder exists',
  _dxQuizSecRaw.length > 1000);

// — Landing CTAs rewired —
// MIGRATED (hero-v2 rebrand): the hero primary CTA class was scoped
// .cta-primary -> .hv2-cta-primary. Intent unchanged — assert the hero
// primary CTA still points to /diagnostic with full regression strength.
test('v4.99.52 D.1: landing/index.html hero CTA points to /diagnostic (not direct cert-app URL)',
  /class="hv2-cta-primary"\s+href="\/diagnostic"/.test(_landingIndexD1));
test('v4.99.52 D.1: regression tombstone — landing/index.html no longer hard-redirects to cert-app diagnostic',
  !/networkplus\.certanvil\.com\/\?action=diagnostic[^"]*from=landing-hero/.test(_landingIndexD1));
test('v4.99.52 D.1: landing/pricing.html free-tier CTA points to /diagnostic',
  /pp-free-cta[^>]*href="\/diagnostic"/.test(_landingPricingD1));

// — Cross-page state envelope consistency —
test('v4.99.52 D.1: same sessionStorage key (certanvilDiagnosticIntake) used across all 4 page-types',
  /certanvilDiagnosticIntake/.test(_dxIntakeNetRaw)
  && /certanvilDiagnosticIntake/.test(_dxIntakeSecRaw)
  && /certanvilDiagnosticIntake/.test(_dxQuizNetRaw)
  && /certanvilDiagnosticIntake/.test(_dxQuizSecRaw));
test('v4.99.52 D.1: intake state envelope includes cert + examDate + intensity + capturedAt',
  /cert:\s*CERT[\s\S]{0,200}examDate[\s\S]{0,200}intensity[\s\S]{0,200}capturedAt/.test(_dxIntakeNetRaw));

// ── v4.99.53 — D.2: 20-question quiz UI + results page ──
// Self-contained quiz with inline question pool (D.3 will swap for AI-gen).
// Wake Lock + Visibility-API pause-on-blur mirror Phase 10 v4.99.49 exam pattern.
// Score calc: scaled 100-900 with 720 pass threshold. Results page reads
// sessionStorage envelope written by quiz on finish.
console.log('\n\x1b[1m── v4.99.53 — D.2 QUIZ UI + RESULTS PLACEHOLDER ──\x1b[0m');

const _dxQuizD2Raw = fs.readFileSync(path.join(ROOT, 'landing/diagnostic/network-plus/quiz.html'), 'utf8');
// v8.x: the results render logic was extracted from results.html into a shared
// renderer (results-core.js) + per-cert config (results-config.js) — one renderer
// now serves all 7 certs. The D.x results "render contract" therefore spans three
// files; assert against their combined source. (results.html is now a ~50-line shell.)
const _dxResultsShell = fs.readFileSync(path.join(ROOT, 'landing/diagnostic/network-plus/results.html'), 'utf8');
const _dxResultsCoreRaw = (() => { try { return fs.readFileSync(path.join(ROOT, 'landing/diagnostic/results-core.js'), 'utf8'); } catch (_) { return ''; } })();
const _dxResultsCfgRaw = (() => { try { return fs.readFileSync(path.join(ROOT, 'landing/diagnostic/results-config.js'), 'utf8'); } catch (_) { return ''; } })();
const _dxResultsD2Raw = _dxResultsShell + '\n' + _dxResultsCoreRaw + '\n' + _dxResultsCfgRaw;

// — Quiz page · structural —
test('v4.99.53 D.2: quiz page has live UI (not just D.1 placeholder)',
  /id="dq-live"/.test(_dxQuizD2Raw) && /id="dq-options"/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: regression tombstone — placeholder text gone',
  !/Quiz UI ships next/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: quiz has 20-question inline pool',
  // Count `id: N,` patterns where N is 1..20
  (() => {
    var m = _dxQuizD2Raw.match(/\bid:\s*\d+,/g);
    return m && m.length === 20;
  })());
test('v4.99.53 D.2: quiz pool covers all 5 N10-009 domains',
  /Networking Concepts/.test(_dxQuizD2Raw)
  && /Network Implementation/.test(_dxQuizD2Raw)
  && /Network Operations/.test(_dxQuizD2Raw)
  && /Network Security/.test(_dxQuizD2Raw)
  && /Network Troubleshooting/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: quiz pool weights match CompTIA blueprint (5/4/4/3/4 across the 5 domains)',
  (() => {
    var counts = {
      'Networking Concepts': (_dxQuizD2Raw.match(/domain: 'Networking Concepts'/g) || []).length,
      'Network Implementation': (_dxQuizD2Raw.match(/domain: 'Network Implementation'/g) || []).length,
      'Network Operations': (_dxQuizD2Raw.match(/domain: 'Network Operations'/g) || []).length,
      'Network Security': (_dxQuizD2Raw.match(/domain: 'Network Security'/g) || []).length,
      'Network Troubleshooting': (_dxQuizD2Raw.match(/domain: 'Network Troubleshooting'/g) || []).length,
    };
    return counts['Networking Concepts'] === 5
      && counts['Network Implementation'] === 4
      && counts['Network Operations'] === 4
      && counts['Network Security'] === 3
      && counts['Network Troubleshooting'] === 4;
  })());
test('v4.99.53 D.2: quiz pool covers Easy + Medium + Hard difficulty',
  /difficulty: 'Easy'/.test(_dxQuizD2Raw)
  && /difficulty: 'Medium'/.test(_dxQuizD2Raw)
  && /difficulty: 'Hard'/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: quiz uses 3-tier confidence picker (Guessing / Pretty sure / Locked in)',
  /data-confidence="guessing"/.test(_dxQuizD2Raw)
  && /data-confidence="pretty-sure"/.test(_dxQuizD2Raw)
  && /data-confidence="locked-in"/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: quiz Next button is disabled until both answer + confidence picked',
  /pickedLetter\s*&&\s*session\.pickedConfidence|session\.pickedLetter\s*&&\s*session\.pickedConfidence/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: quiz shuffles question order on fresh start (Fisher-Yates)',
  /Math\.floor\(Math\.random\(\)\s*\*\s*\(i\s*\+\s*1\)\)/.test(_dxQuizD2Raw));

// — Quiz page · timer & lifecycle —
test('v4.99.53 D.2: timer counts down from 30 min (DIAGNOSTIC_DURATION_MS = 30 * 60 * 1000)',
  /DIAGNOSTIC_DURATION_MS\s*=\s*30\s*\*\s*60\s*\*\s*1000/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: timer is informational — no hard cutoff (no submitExam on remaining<=0 inside tickTimer)',
  // The tickTimer fn should render overtime (+MM:SS) not auto-submit
  /timerEl\.classList\.add\(\s*['"]is-overtime['"]\)/.test(_dxQuizD2Raw)
  && !/finishDiagnostic\(\)[\s\S]{0,200}remaining\s*<\s*0/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: Wake Lock acquired on quiz load (mirrors Phase 10 v4.99.49 pattern)',
  /async\s+function\s+acquireWakeLock[\s\S]{0,200}navigator\.wakeLock\.request\(['"]screen['"]\)/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: Wake Lock released on finish + quit',
  /releaseWakeLock\(\)/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: Visibility API pauses timer on tab hide + resumes on visible',
  /document\.visibilityState\s*===\s*['"]hidden['"][\s\S]{0,400}hiddenAt\s*=\s*Date\.now\(\)/.test(_dxQuizD2Raw)
  && /document\.visibilityState\s*===\s*['"]visible['"][\s\S]{0,400}totalHiddenMs\s*\+=\s*pauseDuration/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: Quit button confirms before discarding progress',
  /quitBtn\.addEventListener[\s\S]{0,300}confirm\(/.test(_dxQuizD2Raw));

// — Quiz page · scoring + handoff —
test('v4.99.53 D.2: score scaled to CompTIA range (100-900) using linear formula',
  /scaledScore\s*=\s*Math\.round\(\s*100\s*\+\s*\(\s*correctCount\s*\/\s*n\s*\)\s*\*\s*800\s*\)/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: pass threshold = 720 (CompTIA Network+ official)',
  /passThreshold:\s*720/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: domain breakdown sorted weakest-first',
  /domainBreakdown[\s\S]{0,400}\.sort\(\s*function\s*\([\s\S]{0,80}a\.accuracy\s*-\s*b\.accuracy/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: writes certanvilDiagnosticResults to sessionStorage on finish',
  /sessionStorage\.setItem\(\s*RESULTS_KEY/.test(_dxQuizD2Raw)
  && /RESULTS_KEY\s*=\s*['"]certanvilDiagnosticResults['"]/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: writes localStorage snapshot (certanvilLastDiagnostic) for landing resume CTA',
  /localStorage\.setItem\(\s*['"]certanvilLastDiagnostic['"]/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: finish navigates to /diagnostic/<cert>/results',
  /window\.location\.href\s*=\s*['"]\/diagnostic\/['"]?\s*\+\s*CERT\s*\+\s*['"]\/results['"]/.test(_dxQuizD2Raw));
test('v4.99.53 D.2: quiz session cleared from sessionStorage after finish (so retake is fresh)',
  /sessionStorage\.removeItem\(\s*SESSION_KEY/.test(_dxQuizD2Raw));

// — Quiz page · resume + a11y —
test('v4.99.53 D.2: resumes in-progress session if returning to page (sessionStorage gate)',
  // v4.99.54 D.3 changed the envelope to require a full questions array
  // (so AI-generated sessions resume correctly). Validates against either
  // the D.2 shape (parsed.answers.length === QUESTION_POOL.length) or the
  // D.3 shape (parsed.questions + parsed.answers === TARGET_QUESTION_COUNT).
  /sessionStorage\.getItem\(\s*SESSION_KEY/.test(_dxQuizD2Raw)
  && /parsed\.cert\s*===\s*CERT/.test(_dxQuizD2Raw)
  && (/parsed\.answers\.length\s*===\s*QUESTION_POOL\.length/.test(_dxQuizD2Raw)
      || /parsed\.questions[\s\S]{0,100}length\s*===\s*TARGET_QUESTION_COUNT/.test(_dxQuizD2Raw)));
test('v4.99.53 D.2: no-JS fallback message present (graceful degradation)',
  /class="dq-no-js"|JavaScript required/i.test(_dxQuizD2Raw));
test('v4.99.53 D.2: reduced-motion gate for transitions (v4.99.61: moved to shared diagnostic-system.css)',
  (() => { let s=''; try { s=fs.readFileSync(path.join(require('path').join(__dirname, '..'),'..','landing','diagnostic','diagnostic-system.css'),'utf8'); } catch(_) {}
    return /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(s) &&
           /\.dq-progress-fill[\s\S]{0,120}transition:\s*none/.test(s); })());
test('v4.99.53 D.2: options use ARIA radiogroup semantics',
  /role="radiogroup"/.test(_dxQuizD2Raw)
  && /setAttribute\(\s*['"]aria-checked['"]/.test(_dxQuizD2Raw));

// — Results page —
test('v4.99.53 D.2: results page reads certanvilDiagnosticResults from sessionStorage',
  // v4.99.55: results.html refactored to read via constant RESULTS_KEY. Accept either shape.
  /sessionStorage\.getItem\(\s*['"]certanvilDiagnosticResults['"]/.test(_dxResultsD2Raw) ||
  (/RESULTS_KEY\s*=\s*['"]certanvilDiagnosticResults['"]/.test(_dxResultsD2Raw) &&
   /sessionStorage\.getItem\(\s*RESULTS_KEY/.test(_dxResultsD2Raw)));
test('v4.99.53 D.2: results page handles "no results yet" empty state gracefully',
  /No results yet|haven't taken/.test(_dxResultsD2Raw));
test('v4.99.53 D.2: results page renders scaled score (100-900) with pass-threshold marker',
  /results\.scaledScore/.test(_dxResultsD2Raw)
  && /results\.passThreshold/.test(_dxResultsD2Raw));
test('v4.99.53 D.2: results page renders domain breakdown with weakest-first ordering',
  /results\.domainBreakdown[\s\S]{0,400}\.map/.test(_dxResultsD2Raw));
test('v4.99.53 D.2: results page domain rows use weak/mid/strong color tiers',
  /is-weak[\s\S]{0,200}is-mid[\s\S]{0,200}is-strong|d\.accuracy\s*<\s*0\.5[\s\S]{0,200}d\.accuracy\s*<\s*0\.8/.test(_dxResultsD2Raw));
test('v4.99.53 D.2: results page notes D.4 next ship in banner',
  /D\.4/.test(_dxResultsD2Raw));

// ── v4.99.54 — D.3: AI generation endpoint + Turnstile + rate limit ──
// New /api/diagnostic/generate Vercel edge function. Turnstile invisible
// challenge gates calls. Per-IP-hash quota (25 calls / 24h) enforced via
// Supabase RPC. Anthropic Haiku produces 20 diagnostic Qs per request.
// Quiz UI now AI-first with graceful inline-pool fallback when any
// dependency is missing or fails.
console.log('\n\x1b[1m── v4.99.54 — D.3 AI ENDPOINT + TURNSTILE + RATE LIMIT ──\x1b[0m');

const _migrationRLRaw = fs.existsSync(path.join(ROOT, 'supabase/migrations/20260511_diagnostic_rate_limit.sql'))
  ? fs.readFileSync(path.join(ROOT, 'supabase/migrations/20260511_diagnostic_rate_limit.sql'), 'utf8') : '';
const _genEndpointRaw = fs.existsSync(path.join(ROOT, 'landing/api/diagnostic/generate.js'))
  ? fs.readFileSync(path.join(ROOT, 'landing/api/diagnostic/generate.js'), 'utf8') : '';
const _quizD3Raw = fs.readFileSync(path.join(ROOT, 'landing/diagnostic/network-plus/quiz.html'), 'utf8');

// — SQL migration —
test('v4.99.54 D.3: SQL migration file exists',
  _migrationRLRaw.length > 2000);
test('v4.99.54 D.3: migration creates diagnostic_rate_limit table',
  /create\s+table\s+if\s+not\s+exists\s+diagnostic_rate_limit/i.test(_migrationRLRaw));
test('v4.99.54 D.3: table has ip_hash primary key + call_count + first_at + last_at',
  /ip_hash\s+text\s+primary key/i.test(_migrationRLRaw)
  && /call_count\s+int/i.test(_migrationRLRaw)
  && /first_at\s+timestamptz/i.test(_migrationRLRaw)
  && /last_at\s+timestamptz/i.test(_migrationRLRaw));
test('v4.99.54 D.3: migration creates diag_rl_check_and_increment RPC',
  /create\s+or\s+replace\s+function\s+diag_rl_check_and_increment/i.test(_migrationRLRaw));
test('v4.99.54 D.3: RPC is SECURITY DEFINER (service-role bypass for atomic RL check)',
  /diag_rl_check_and_increment[\s\S]{0,600}security\s+definer/i.test(_migrationRLRaw));
test('v4.99.54 D.3: RPC enforces 25-call / 24h window',
  /v_limit\s+constant\s+int\s*:=\s*25/.test(_migrationRLRaw)
  && /interval\s+'24 hours'/.test(_migrationRLRaw));
test('v4.99.54 D.3: RLS admin-only select on rate-limit table (clients have no read)',
  /alter\s+table\s+diagnostic_rate_limit\s+enable\s+row\s+level\s+security/i.test(_migrationRLRaw)
  && /diag_rl_admin_select[\s\S]{0,200}is_admin\(\)/i.test(_migrationRLRaw));
test('v4.99.54 D.3: migration includes purge helper (diag_rl_purge_old)',
  /create\s+or\s+replace\s+function\s+diag_rl_purge_old/i.test(_migrationRLRaw));

// — Serverless endpoint —
test('v4.99.54 D.3: /api/diagnostic/generate endpoint exists',
  _genEndpointRaw.length > 4000);
test('v4.99.54 D.3: endpoint runs on Vercel edge runtime',
  /export\s+const\s+config\s*=\s*\{\s*runtime:\s*['"]edge['"]/.test(_genEndpointRaw));
test('v4.99.54 D.3: endpoint requires POST + handles OPTIONS preflight',
  /req\.method\s*===\s*['"]OPTIONS['"]/.test(_genEndpointRaw)
  && /req\.method\s*!==\s*['"]POST['"]/.test(_genEndpointRaw));
test('v4.99.54 D.3: endpoint validates Turnstile token via Cloudflare siteverify',
  /challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/.test(_genEndpointRaw));
test('v4.99.54 D.3: endpoint hashes client IP (SHA-256, raw IP never stored)',
  /crypto\.subtle\.digest\(\s*['"]SHA-256['"]/.test(_genEndpointRaw)
  && /salt-v1|certanvil-diagnostic-salt/.test(_genEndpointRaw));
test('v4.99.54 D.3: endpoint calls Supabase RPC for atomic rate-limit check',
  /\/rest\/v1\/rpc\/diag_rl_check_and_increment/.test(_genEndpointRaw));
test('v4.99.54 D.3: endpoint hard-caps requested question count',
  /HARD_QUESTION_CAP\s*=\s*25/.test(_genEndpointRaw)
  && /requestedCount\s*[<>]=?\s*\d+/.test(_genEndpointRaw));
test('v4.99.54 D.3: endpoint calls Anthropic Claude Haiku for generation',
  /claude-haiku-4-5/.test(_genEndpointRaw)
  && /api\.anthropic\.com\/v1\/messages/.test(_genEndpointRaw));
test('v4.99.54 D.3: endpoint normalizes Q shape + filters malformed responses',
  /function\s+normalizeQuestion/.test(_genEndpointRaw)
  && /'ABCD'\.includes/.test(_genEndpointRaw));
test('v4.99.54 D.3: endpoint accepts both network-plus and security-plus',
  /cert\s*!==\s*['"]network-plus['"][\s\S]{0,80}cert\s*!==\s*['"]security-plus['"]/.test(_genEndpointRaw));
test('v4.99.54 D.3: endpoint gracefully 503s when env vars missing (allows pre-config deploy)',
  /TURNSTILE_SECRET_KEY[\s\S]{0,200}service-unavailable/.test(_genEndpointRaw)
  && /ANTHROPIC_API_KEY[\s\S]{0,200}service-unavailable/.test(_genEndpointRaw));
test('v4.99.54 D.3: endpoint returns 429 when quota exceeded (with reset timestamp)',
  /status:\s*429|quota-exceeded[\s\S]{0,200}resetsAt/.test(_genEndpointRaw));
test('v4.99.54 D.3: prompt requires original content (no copy from prep banks)',
  /ORIGINAL[\s\S]{0,200}Jason Dion|Professor Messer|CertMaster/i.test(_genEndpointRaw));

// — Quiz UI integration —
test('v7.51.x: quiz.html no longer loads the Cloudflare Turnstile script (gate removed)',
  !/turnstile\/v0\/api\.js/.test(_quizD3Raw));
test('v7.51.x: quiz.html no longer renders the Turnstile widget (gate removed)',
  !/class="cf-turnstile"/.test(_quizD3Raw));
test('v4.99.54 D.3: quiz.html session envelope now includes full questions array + source field',
  /questions:\s*questions/.test(_quizD3Raw)
  && /source:\s*source/.test(_quizD3Raw)
  && /createFreshSession/.test(_quizD3Raw));
test('v4.99.54 D.3: quiz.html has AI-first fetch to /api/diagnostic/generate',
  /GENERATE_ENDPOINT\s*=\s*['"]\/api\/diagnostic\/generate['"]/.test(_quizD3Raw)
  && /fetch\(GENERATE_ENDPOINT/.test(_quizD3Raw));
test('v4.99.54 D.3: quiz.html falls back to inline pool on any error path',
  /bootWithFallback\(\s*['"]fallback['"]\s*\)/.test(_quizD3Raw)
  && /shuffleInlinePool/.test(_quizD3Raw));
test('v7.51.x: quiz.html boots directly via fetchAIQuestions(null) (Turnstile gate removed)',
  /fetchAIQuestions\(null\)/.test(_quizD3Raw)
  && !/TURNSTILE_TIMEOUT_MS/.test(_quizD3Raw));
test('v4.99.54 D.3: quiz.html has 25s fetch timeout via AbortController',
  /FETCH_TIMEOUT_MS\s*=\s*25000/.test(_quizD3Raw)
  && /AbortController/.test(_quizD3Raw));
test('v4.99.54 D.3: quiz.html handles 429 (quota exceeded) with explicit banner',
  /resp\.status\s*===\s*429/.test(_quizD3Raw));
test('v4.99.54 D.3: quiz.html handles 503 (service unavailable) gracefully',
  /resp\.status\s*===\s*503/.test(_quizD3Raw));
test('v4.99.54 D.3: quiz.html shows source banner only when fallback (not when ai or empty)',
  /showSourceBanner\(\s*['"]fallback['"]\)|showSourceBanner\(\s*session\.source/.test(_quizD3Raw));
test('v4.99.54 D.3: quiz.html resume path skips AI fetch if session restored from sessionStorage',
  /if\s*\(\s*session\s*\)\s*\{[\s\S]{0,200}showLive\(\)[\s\S]{0,80}return/.test(_quizD3Raw));
test('v4.99.54 D.3: quiz.html timer no longer auto-starts at module load (moved into showLive)',
  /function\s+startTimer\s*\(\s*\)[\s\S]{0,200}setInterval\(tickTimer/.test(_quizD3Raw));
test('v4.99.54 D.3: quiz.html tickTimer guards against null session (avoids load-time crash)',
  /function\s+tickTimer[\s\S]{0,100}if\s*\(\s*!session/.test(_quizD3Raw));
test('v4.99.54 D.3: quiz.html forwards intake state to /api/diagnostic/generate',
  /intake:\s*getIntake\(\)/.test(_quizD3Raw));

// ══════════════════════════════════════════════════════════════════════════
// v4.99.55 — D.4 Landing Diagnostic · rich results page
// ══════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m── v4.99.55 — D.4 LANDING DIAGNOSTIC RICH RESULTS ──\x1b[0m');

const _resultsD4Path = path.join(require('path').join(__dirname, '..'), '..', 'landing', 'diagnostic', 'network-plus', 'results.html');
let _resultsD4Shell = '';
try { _resultsD4Shell = fs.readFileSync(_resultsD4Path, 'utf8'); } catch (_) {}
// Combined render-contract source (shell + shared core + per-cert config) — see
// the D.2 note above; reuses the core/config reads from the D.2 block.
const _resultsD4Raw = _resultsD4Shell + '\n' + _dxResultsCoreRaw + '\n' + _dxResultsCfgRaw;
// v4.99.60 redesign: results.html's inline <style> was extracted into the
// shared diagnostic-system.css (one source of truth for the whole flow).
// Moved-rule guards now assert against the shared system; behaviour/JS
// guards still assert against results.html (the .dr-* render contract is
// unchanged). _dgSys = the shared design system stylesheet.
const _dgSysPath = path.join(require('path').join(__dirname, '..'), '..', 'landing', 'diagnostic', 'diagnostic-system.css');
let _dgSys = '';
try { _dgSys = fs.readFileSync(_dgSysPath, 'utf8'); } catch (_) {}

test('v4.99.55 D.4: landing/diagnostic/network-plus/results.html exists', _resultsD4Shell.length > 0);

// Tombstone: the D.2 placeholder banner must not reappear
test('v4.99.55 D.4: D.2 placeholder banner removed (dr-d4-banner tombstone)',
  !_resultsD4Raw.includes('dr-d4-banner'));
test('v4.99.55 D.4: placeholder "D.4 next ship" banner copy removed',
  !_resultsD4Raw.includes('📅 D.4 next ship'));

// Score ring structure
test('v4.99.55 D.4: score ring SVG present (viewBox 200x200)',
  _resultsD4Raw.includes('viewBox="0 0 200 200"') && _resultsD4Raw.includes('dr-ring-svg'));
test('v4.99.55 D.4: score ring has bg + fg circles with same radius (RING_RADIUS)',
  /class="dr-ring-bg"[^>]+r="['"]?\s*\+\s*RING_RADIUS/.test(_resultsD4Raw) &&
  /class="dr-ring-fg[^"]*"[^>]+r="['"]?\s*\+\s*RING_RADIUS/.test(_resultsD4Raw) &&
  /var\s+RING_RADIUS\s*=\s*80/.test(_resultsD4Raw));
test('v4.99.60 redesign: SVG ring retired, score is a typographic verdict (ring hidden in shared system)',
  /\.dr-ring-(wrap|svg)[^{]*\{[^}]*display:\s*none/.test(_dgSys) &&
  /\.dr-score-num[^{]*\{[^}]*clamp\([^)]*--dg-t-score/.test(_dgSys));
test('v4.99.55 D.4: score ring has pass-threshold tick element',
  _resultsD4Raw.includes('dr-ring-tick'));
test('v4.99.55 D.4: pass tick rotates to passFraction × 360°',
  /passFraction\s*\*\s*360/.test(_resultsD4Raw));

// Score band classification: foundation / near-pass / on-pace / ready
test('v4.99.55 D.4: classifyBand uses per-cert band thresholds (shared core + config)',
  /function\s+classifyBand[\s\S]{0,200}cfg\.bands\.ready[\s\S]{0,160}cfg\.bands\.onPace[\s\S]{0,160}cfg\.bands\.nearPass/.test(_dxResultsCoreRaw) &&
  /['"]network-plus['"][\s\S]{0,600}bands:\s*\{\s*ready:\s*800,\s*onPace:\s*720,\s*nearPass:\s*600/.test(_dxResultsCfgRaw));
test('v4.99.60 redesign: score/band state-colour classes live in shared system',
  /\.dr-score-num\.is-passing/.test(_dgSys) && /\.dr-score-num\.is-foundation/.test(_dgSys) &&
  /\.dr-passplan-band\.is-near-pass/.test(_dgSys) && _dgSys.includes('is-on-pace') && _dgSys.includes('is-ready'));

// Pass Plan
test('v4.99.55 D.4: Pass Plan section with band pill + headline + 3 steps',
  _resultsD4Raw.includes('dr-passplan-band') && _resultsD4Raw.includes('dr-passplan-steps'));
test('v4.99.55 D.4: bandCopy function returns label/headline/tone per band',
  /function\s+bandCopy[\s\S]{0,2000}Exam-ready[\s\S]{0,1000}On pace[\s\S]{0,1000}Near pass[\s\S]{0,1000}Foundation/.test(_resultsD4Raw));
test('v4.99.55 D.4: Pass Plan keyed to weak domains (uses top3WeakDomains)',
  _resultsD4Raw.includes('top3WeakDomains'));
test('v4.99.55 D.4: Pass Plan keyed to intake.examDate (daysUntil helper)',
  /function\s+daysUntil/.test(_resultsD4Raw) && _resultsD4Raw.includes('examDays'));
test('v4.99.55 D.4: Pass Plan keyed to intake.intensity (casual/balanced/intense)',
  _resultsD4Raw.includes("intensity === 'intense'") && _resultsD4Raw.includes("intensity === 'casual'"));
test('v4.99.55 D.4: network-plus domain drills cover all 5 N10-009 domains (config)',
  /['"]network-plus['"][\s\S]{0,2400}Networking Concepts[\s\S]{0,400}Network Implementation[\s\S]{0,400}Network Operations[\s\S]{0,400}Network Security[\s\S]{0,400}Network Troubleshooting/.test(_dxResultsCfgRaw));

// 5-path CTAs (in priority order)
// Pre-Stripe CTA hierarchy: the free path (Continue · magic-link) is the
// PRIMARY action; the Pro waitlist is demoted to secondary until checkout ships.
test('v4.99.55 D.4: CTA · primary free path (Continue · magic-link)',
  /id="dr-cta-continue"[\s\S]{0,300}keep practising free/.test(_resultsD4Raw));
test('v4.99.55 D.4: CTA · Pro waitlist present (demoted to secondary pre-Stripe)',
  /id="dr-cta-subscribe"[\s\S]{0,300}Get CertAnvil Pro at launch/.test(_resultsD4Raw));
test('v4.99.55 D.4: CTA 3 · Download / email score report (Path C)',
  /id="dr-cta-download"[\s\S]{0,300}Download or email score report/.test(_resultsD4Raw));
test('v4.99.55 D.4: CTA 4 · Retake (Path D · clears session + results)',
  _resultsD4Raw.includes('id="dr-cta-retake"') && /Retake[\s\S]{0,500}removeItem\(SESSION_KEY\)[\s\S]{0,500}removeItem\(RESULTS_KEY\)/.test(_resultsD4Raw));
test('v4.99.55 D.4: CTA 5 · Back to landing (Path E)',
  /<a\s+href="\/"[^>]*id="dr-cta-back"/.test(_resultsD4Raw));
test('v4.99.55 D.4: Retake button confirms before clearing results',
  /window\.confirm\([^)]*[Rr]etake/.test(_resultsD4Raw));

// Stub panels (pre-Stripe / pre-D.5 / pre-D.6 placeholders)
test('v4.99.55 D.4: Subscribe stub panel present with launch-waitlist copy',
  _resultsD4Raw.includes('dr-stub-subscribe') && _resultsD4Raw.includes('Launching soon'));
test('v4.99.55 D.4: Continue stub panel exists (v4.99.56: stub copy replaced by D.5 magic-link form)',
  _resultsD4Raw.includes('dr-stub-continue') &&
  // v4.99.56 D.5: stub no longer has "D.5 next ship" placeholder copy — it has a working form
  (_resultsD4Raw.includes('D.5 next ship') || _resultsD4Raw.includes('id="dr-continue-form"')));
test('v4.99.55 D.4: Download stub panel exists (v4.99.57: stub copy replaced by D.6 dialog)',
  _resultsD4Raw.includes('dr-stub-download') &&
  // v4.99.57 D.6: placeholder copy replaced with working 3-action dialog
  (_resultsD4Raw.includes('D.6 next ship') || _resultsD4Raw.includes('id="dr-action-print"')));
test('v4.99.55 D.4: stub panels open/close via openStub/closeStub helpers',
  /function\s+openStub[\s\S]{0,800}function\s+closeStub/.test(_resultsD4Raw));

// Domain breakdown + answer review
test('v4.99.55 D.4: domain breakdown sorted weakest-first (uses results.domainBreakdown directly)',
  /results\.domainBreakdown[\s\S]{0,200}\.map/.test(_resultsD4Raw));
test('v4.99.55 D.4: domain rows include progress bar + drill targets',
  _resultsD4Raw.includes('dr-domain-bar-fill') && _resultsD4Raw.includes('DOMAIN_DRILLS[d.domain]'));
test('v4.99.55 D.4: answer review section is collapsible (toggle button + aria-expanded)',
  _resultsD4Raw.includes('dr-review-toggle') && _resultsD4Raw.includes('aria-expanded'));
test('v4.99.55 D.4: answer review surfaces confidence (locked-in/pretty-sure/guessing)',
  _resultsD4Raw.includes("a.confidence === 'locked-in'") && _resultsD4Raw.includes("a.confidence === 'guessing'"));

// Source banner (carries through from D.3 quiz.html)
test('v4.99.55 D.4: source eyebrow handles ai / fallback / inline cases',
  /results\.source\s*===\s*['"]fallback['"]/.test(_resultsD4Raw) && /results\.source\s*===\s*['"]ai['"]/.test(_resultsD4Raw));

// Empty state
test('v4.99.55 D.4: empty state shown when sessionStorage results missing',
  // v4.99.57: empty-state predicate + renderer can live in separate functions now.
  /!results\s*\|\|\s*!results\.totalQuestions/.test(_resultsD4Raw) &&
  _resultsD4Raw.includes('Take the diagnostic to see results'));
test('v4.99.55 D.4: empty state CTA builds intake link from the page cert slug',
  /\/diagnostic\/['"]\s*\+\s*pageCfg\.slug\s*\+\s*['"]\/intake/.test(_dxResultsCoreRaw));

// Accessibility + reduced motion
test('v4.99.60 redesign: prefers-reduced-motion gate in shared system (neutralises transitions)',
  /@media\s*\(prefers-reduced-motion[\s\S]{0,400}transition:\s*none/.test(_dgSys));
test('v4.99.55 D.4: review toggle has aria-controls for screen readers',
  _resultsD4Raw.includes('aria-controls="dr-review-list"'));

// ══════════════════════════════════════════════════════════════════════════
// v4.99.56 — D.5 Landing Diagnostic · anon → authed magic-link migration
// ══════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m── v4.99.56 — D.5 LANDING DIAGNOSTIC MAGIC-LINK MIGRATION ──\x1b[0m');

// ── Migration SQL ──
const _migD5Path = path.join(require('path').join(__dirname, '..'), '..', 'supabase', 'migrations', '20260511_diagnostic_pending.sql');
let _migD5Raw = '';
try { _migD5Raw = fs.readFileSync(_migD5Path, 'utf8'); } catch (_) {}

test('v4.99.56 D.5: migration file exists at supabase/migrations/20260511_diagnostic_pending.sql', _migD5Raw.length > 0);
test('v4.99.56 D.5: migration creates diagnostic_pending table (token PK, jsonb results)',
  /create\s+table\s+if\s+not\s+exists\s+diagnostic_pending[\s\S]{0,400}token\s+text\s+primary\s+key[\s\S]{0,400}results\s+jsonb\s+not\s+null/i.test(_migD5Raw));
test('v4.99.56 D.5: migration creates diagnostic_signup_rate_limit table (separate from D.3 quota)',
  /create\s+table\s+if\s+not\s+exists\s+diagnostic_signup_rate_limit/i.test(_migD5Raw));
test('v4.99.56 D.5: migration creates claim_diagnostic_results(p_token) RPC with SECURITY DEFINER',
  /create\s+or\s+replace\s+function\s+claim_diagnostic_results[\s\S]{0,300}security\s+definer/i.test(_migD5Raw));
test('v4.99.56 D.5: claim RPC rejects unsigned-in callers',
  /v_user_id\s+is\s+null[\s\S]{0,200}not_signed_in/i.test(_migD5Raw));
test('v4.99.56 D.5: claim RPC handles already_claimed / expired / not_found cases',
  /already_claimed/.test(_migD5Raw) && /expired/.test(_migD5Raw) && /not_found/.test(_migD5Raw));
test('v4.99.56 D.5: claim RPC merges into profiles.metadata.diagnostic + diagnostic_history',
  /profiles[\s\S]{0,1000}metadata[\s\S]{0,1000}diagnostic_history/i.test(_migD5Raw));
test('v4.99.56 D.5: claim RPC marks token claimed (one-shot)',
  /update\s+diagnostic_pending\s+set\s+claimed_at/i.test(_migD5Raw));
test('v4.99.56 D.5: migration creates diag_signup_check_and_increment(ip_hash) RPC',
  /create\s+or\s+replace\s+function\s+diag_signup_check_and_increment/i.test(_migD5Raw));
test('v4.99.56 D.5: signup rate limit is 5 calls / 1 hour rolling window',
  /v_limit\s+constant\s+int\s*:=\s*5/.test(_migD5Raw) && /v_window\s+constant\s+interval\s*:=\s*interval\s*'1\s+hour'/.test(_migD5Raw));
test('v4.99.56 D.5: claim RPC has authenticated execute grant',
  /grant\s+execute\s+on\s+function\s+claim_diagnostic_results[\s\S]{0,100}to\s+authenticated/i.test(_migD5Raw));
test('v4.99.56 D.5: migration enables RLS on both new tables · admin reads only',
  /alter\s+table\s+diagnostic_pending\s+enable\s+row\s+level\s+security[\s\S]{0,800}is_admin\(\)/i.test(_migD5Raw));
test('v4.99.56 D.5: cleanup helper diag_pending_purge_old() defined',
  /create\s+or\s+replace\s+function\s+diag_pending_purge_old/i.test(_migD5Raw));

// ── Endpoint ──
const _epD5Path = path.join(require('path').join(__dirname, '..'), '..', 'landing', 'api', 'diagnostic', 'signup-magic-link.js');
let _epD5Raw = '';
try { _epD5Raw = fs.readFileSync(_epD5Path, 'utf8'); } catch (_) {}

test('v4.99.56 D.5: endpoint file exists at landing/api/diagnostic/signup-magic-link.js', _epD5Raw.length > 0);
test('v4.99.56 D.5: endpoint uses Vercel edge runtime',
  /export\s+const\s+config\s*=\s*\{\s*runtime:\s*['"]edge['"]/.test(_epD5Raw));
test('v4.99.56 D.5: endpoint validates email format',
  /isValidEmail/.test(_epD5Raw) && /invalid_email/.test(_epD5Raw));
test('v4.99.56 D.5: endpoint validates cert ∈ [network-plus, security-plus]',
  /ALLOWED_CERTS\s*=\s*\[\s*['"]network-plus['"]\s*,\s*['"]security-plus['"]/.test(_epD5Raw));
test('v4.99.56 D.5: endpoint validates diagnosticResults shape (scaledScore/totalQuestions/correctCount)',
  /scaledScore[\s\S]{0,80}totalQuestions[\s\S]{0,80}correctCount/.test(_epD5Raw) && /incomplete_results/.test(_epD5Raw));
test('v4.99.56 D.5: endpoint hashes client IP (SHA-256, never stores raw)',
  /sha256Hex/.test(_epD5Raw) && /IP_HASH_SALT/.test(_epD5Raw));
test('v4.99.56 D.5: endpoint rate-limits via diag_signup_check_and_increment RPC',
  /diag_signup_check_and_increment/.test(_epD5Raw));
test('v4.99.56 D.5: endpoint generates crypto-random token via WebCrypto',
  /crypto\.getRandomValues/.test(_epD5Raw) &&
  // No actual call to Math.random — comment-mention is fine (regex excludes comment lines)
  !/^[^/]*Math\.random\(/.test(_epD5Raw.split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n')));
test('v4.99.56 D.5: endpoint writes pending row via service-role bypassing RLS',
  /SUPABASE_SERVICE_ROLE_KEY/.test(_epD5Raw) && /diagnostic_pending/.test(_epD5Raw));
test('v4.99.56 D.5: endpoint builds redirectTo with cert-specific claim host',
  /CERT_TO_CLAIM_HOST/.test(_epD5Raw) && /action=claim-diagnostic/.test(_epD5Raw));
test('v4.99.56 D.5: endpoint gracefully 503s when env vars missing',
  /service_unconfigured/.test(_epD5Raw) && /503/.test(_epD5Raw));
test('v4.99.56 D.5: endpoint 429s on rate limit with resetsAt',
  /rate_limited/.test(_epD5Raw) && /resetsAt/.test(_epD5Raw));
test('v4.99.56 D.5: endpoint optional Turnstile re-check (defense in depth)',
  /turnstileToken[\s\S]{0,400}verifyTurnstile/.test(_epD5Raw));

// ── Continue stub on results.html ──
test('v4.99.56 D.5: results.html loads Supabase client (UMD + lib/supabase.js)',
  /script[\s\S]{0,100}supabase-umd\.min\.js/.test(_resultsD4Raw) && /script[\s\S]{0,100}lib\/supabase\.js/.test(_resultsD4Raw));
test('v4.99.56 D.5: results.html Continue stub replaced with email form (no "D.5 next ship" stub copy)',
  !_resultsD4Raw.includes('D.5 next ship') && _resultsD4Raw.includes('id="dr-continue-form"'));
test('v4.99.56 D.5: results.html form posts to /api/diagnostic/signup-magic-link',
  /fetch\(['"]\/api\/diagnostic\/signup-magic-link['"]/.test(_resultsD4Raw));
test('v4.99.56 D.5: results.html form calls signInWithOtp with returned redirectTo',
  /signInWithOtp\(/.test(_resultsD4Raw) && /emailRedirectTo:\s*r\.body\.redirectTo/.test(_resultsD4Raw));
test('v4.99.56 D.5: results.html handles 503/429 inline status messages',
  /r\.status\s*===\s*503/.test(_resultsD4Raw) && /r\.status\s*===\s*429/.test(_resultsD4Raw));
test('v4.99.56 D.5: results.html disables submit + email during fetch (busy state)',
  /setContinueBusy/.test(_resultsD4Raw));

// ── Cert app claim hook ──
const _claimPath = path.join(require('path').join(__dirname, '..'), '..', 'diagnostic-claim.js');
let _claimRaw = '';
try { _claimRaw = fs.readFileSync(_claimPath, 'utf8'); } catch (_) {}

test('v4.99.56 D.5: diagnostic-claim.js exists at repo root', _claimRaw.length > 0);
test('v4.99.56 D.5: claim hook reads ?action=claim-diagnostic&token=... from URL',
  /action\s*(?:===|!==)\s*['"]claim-diagnostic['"]/.test(_claimRaw) && /params\.get\(['"]token['"]\)/.test(_claimRaw));
test('v4.99.56 D.5: claim hook waits for SIGNED_IN before firing RPC',
  /onAuthStateChange[\s\S]{0,400}SIGNED_IN/.test(_claimRaw));
test('v4.99.56 D.5: claim hook calls claim_diagnostic_results RPC with p_token',
  /sb\.rpc\(['"]claim_diagnostic_results['"]\s*,\s*\{\s*p_token/.test(_claimRaw));
test('v4.99.56 D.5: claim hook strips action+token URL params after attempt',
  /searchParams\.delete\(['"]action['"]\)/.test(_claimRaw) && /searchParams\.delete\(['"]token['"]\)/.test(_claimRaw));
test('v4.99.56 D.5: claim hook re-hydrates cloud-store on success',
  /cloudStore\.hydrate/.test(_claimRaw));
test('v4.99.56 D.5: claim hook tracks attempted tokens in sessionStorage (idempotent)',
  /certanvilClaimAttemptedTokens/.test(_claimRaw));
test('v4.99.56 D.5: claim hook handles all 4 RPC outcomes (claimed/already_claimed/expired/not_found)',
  /['"]claimed['"]/.test(_claimRaw) && /already_claimed/.test(_claimRaw) &&
  /expired/.test(_claimRaw) && /not_found/.test(_claimRaw));

// ── Wiring on cert app ──
test('v4.99.56 D.5: index.html loads diagnostic-claim.js after auth-state.js',
  /<script defer src="auth-state\.js"[\s\S]{0,500}<script defer src="diagnostic-claim\.js"/.test(html));
test('v4.99.56 D.5: sw.js precaches diagnostic-claim.js in SHELL_ASSETS',
  /SHELL_ASSETS[\s\S]{0,2000}'\.\/diagnostic-claim\.js'/.test(sw));

// ══════════════════════════════════════════════════════════════════════════
// v4.99.57 — D.6 Landing Diagnostic · download + email + /r/{token} shareable
// ══════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m── v4.99.57 — D.6 LANDING DIAGNOSTIC DOWNLOAD / EMAIL / SHARE ──\x1b[0m');

// ── Migration SQL ──
const _migD6Path = path.join(require('path').join(__dirname, '..'), '..', 'supabase', 'migrations', '20260511_diagnostic_share.sql');
let _migD6Raw = '';
try { _migD6Raw = fs.readFileSync(_migD6Path, 'utf8'); } catch (_) {}

test('v4.99.57 D.6: migration file exists at supabase/migrations/20260511_diagnostic_share.sql', _migD6Raw.length > 0);
test('v4.99.57 D.6: migration creates diagnostic_share table (token PK · jsonb results · 90d expiry)',
  /create\s+table\s+if\s+not\s+exists\s+diagnostic_share[\s\S]{0,400}token\s+text\s+primary\s+key[\s\S]{0,400}results\s+jsonb\s+not\s+null[\s\S]{0,400}expires_at[\s\S]{0,200}interval\s*'90\s+days'/i.test(_migD6Raw));
test('v4.99.57 D.6: migration creates diagnostic_share view_count column for telemetry',
  /view_count\s+int\s+not\s+null\s+default\s+0/i.test(_migD6Raw));
test('v4.99.57 D.6: migration creates diagnostic_email_rate_limit table (10/1h shared counter)',
  /create\s+table\s+if\s+not\s+exists\s+diagnostic_email_rate_limit/i.test(_migD6Raw) &&
  /v_limit\s+constant\s+int\s*:=\s*10/.test(_migD6Raw));
test('v4.99.57 D.6: migration grants public SELECT on diagnostic_share (token = access gate)',
  /create\s+policy\s+"diag_share_public_select"[\s\S]{0,200}for\s+select\s+using\s*\(true\)/i.test(_migD6Raw));
test('v4.99.57 D.6: migration creates increment_share_view(token) RPC granted to anon',
  /create\s+or\s+replace\s+function\s+increment_share_view/i.test(_migD6Raw) &&
  /grant\s+execute\s+on\s+function\s+increment_share_view[\s\S]{0,80}anon/i.test(_migD6Raw));
test('v4.99.57 D.6: increment_share_view bumps view_count + last_viewed_at on valid token',
  /view_count\s*=\s*view_count\s*\+\s*1[\s\S]{0,200}last_viewed_at\s*=\s*now\(\)/i.test(_migD6Raw));
test('v4.99.57 D.6: increment_share_view silent no-op on expired tokens',
  /increment_share_view[\s\S]{0,800}expires_at\s*>\s*now\(\)/i.test(_migD6Raw));
test('v4.99.57 D.6: migration creates diag_email_check_and_increment(ip_hash) RPC (SECURITY DEFINER)',
  /create\s+or\s+replace\s+function\s+diag_email_check_and_increment[\s\S]{0,400}security\s+definer/i.test(_migD6Raw));
test('v4.99.57 D.6: cleanup helper diag_share_purge_old() defined',
  /create\s+or\s+replace\s+function\s+diag_share_purge_old/i.test(_migD6Raw));

// ── Endpoint · share.js ──
const _epSharePath = path.join(require('path').join(__dirname, '..'), '..', 'landing', 'api', 'diagnostic', 'share.js');
let _epShareRaw = '';
try { _epShareRaw = fs.readFileSync(_epSharePath, 'utf8'); } catch (_) {}

test('v4.99.57 D.6: share.js endpoint exists', _epShareRaw.length > 0);
test('v4.99.57 D.6: share.js uses Vercel edge runtime',
  /export\s+const\s+config\s*=\s*\{\s*runtime:\s*['"]edge['"]/.test(_epShareRaw));
test('v4.99.57 D.6: share.js generates crypto-random token (no Math.random)',
  /crypto\.getRandomValues/.test(_epShareRaw));
test('v4.99.57 D.6: share.js rate-limits via diag_email_check_and_increment',
  /diag_email_check_and_increment/.test(_epShareRaw));
test('v4.99.57 D.6: share.js writes via service-role to diagnostic_share',
  /SUPABASE_SERVICE_ROLE_KEY/.test(_epShareRaw) && /diagnostic_share/.test(_epShareRaw));
test('v4.99.57 D.6: share.js returns shareUrl built from PUBLIC_BASE_URL + /r/{token}',
  /PUBLIC_BASE_URL[\s\S]{0,200}\/r\//.test(_epShareRaw));
test('v4.99.57 D.6: share.js gracefully 503s when env vars missing',
  /service_unconfigured/.test(_epShareRaw));

// ── Endpoint · share-fetch.js ──
const _epShareFetchPath = path.join(require('path').join(__dirname, '..'), '..', 'landing', 'api', 'diagnostic', 'share-fetch.js');
let _epShareFetchRaw = '';
try { _epShareFetchRaw = fs.readFileSync(_epShareFetchPath, 'utf8'); } catch (_) {}

test('v4.99.57 D.6: share-fetch.js endpoint exists', _epShareFetchRaw.length > 0);
test('v4.99.57 D.6: share-fetch.js is GET-only',
  /req\.method\s*!==\s*['"]GET['"]/.test(_epShareFetchRaw));
test('v4.99.57 D.6: share-fetch.js uses anon publishable key (open RLS SELECT)',
  /SUPABASE_PUBLISHABLE_KEY|SUPABASE_ANON_KEY/.test(_epShareFetchRaw));
test('v4.99.57 D.6: share-fetch.js validates token charset (hex 16-64)',
  /\^\[a-f0-9\]\{16,64\}\$/i.test(_epShareFetchRaw));
test('v4.99.57 D.6: share-fetch.js returns 404 for expired/not-found tokens',
  /not_found/.test(_epShareFetchRaw) && /expired/.test(_epShareFetchRaw));
test('v4.99.57 D.6: share-fetch.js fires increment_share_view fire-and-forget',
  /increment_share_view/.test(_epShareFetchRaw) && /\.catch\(/.test(_epShareFetchRaw));

// ── Endpoint · share-redirect.js (/r/:token target) ──
const _epShareRedirPath = path.join(require('path').join(__dirname, '..'), '..', 'landing', 'api', 'diagnostic', 'share-redirect.js');
let _epShareRedirRaw = '';
try { _epShareRedirRaw = fs.readFileSync(_epShareRedirPath, 'utf8'); } catch (_) {}

test('v4.99.57 D.6: share-redirect.js endpoint exists', _epShareRedirRaw.length > 0);
test('v4.99.57 D.6: share-redirect.js 302s to /diagnostic/{cert}/results?token=…',
  /\/diagnostic\/['"]\s*\+\s*certPath\s*\+\s*['"]\/results\?token=/.test(_epShareRedirRaw) ||
  /\/diagnostic\/[\s\S]{0,100}\/results\?token=/.test(_epShareRedirRaw));
test('v4.99.57 D.6: share-redirect.js whitelists cert before composing redirect',
  /cert\s*===\s*['"]network-plus['"]\s*\|\|\s*cert\s*===\s*['"]security-plus['"]/.test(_epShareRedirRaw));
test('v4.99.57 D.6: share-redirect.js handles invalid/expired/missing tokens with soft-error redirect',
  /share-not-found/.test(_epShareRedirRaw) && /share-expired/.test(_epShareRedirRaw) && /share-invalid-token/.test(_epShareRedirRaw));

// ── Endpoint · email-report.js ──
const _epEmailPath = path.join(require('path').join(__dirname, '..'), '..', 'landing', 'api', 'diagnostic', 'email-report.js');
let _epEmailRaw = '';
try { _epEmailRaw = fs.readFileSync(_epEmailPath, 'utf8'); } catch (_) {}

test('v4.99.57 D.6: email-report.js endpoint exists', _epEmailRaw.length > 0);
test('v4.99.57 D.6: email-report.js sends via Resend (api.resend.com/emails)',
  /api\.resend\.com\/emails/.test(_epEmailRaw) && /RESEND_API_KEY/.test(_epEmailRaw));
test('v4.99.57 D.6: email-report.js validates email + cert + results shape',
  /isValidEmail/.test(_epEmailRaw) && /invalid_cert/.test(_epEmailRaw) && /incomplete_results/.test(_epEmailRaw));
test('v4.99.57 D.6: email-report.js ensures shareToken (reuses if provided, creates if not)',
  /ensureShareToken/.test(_epEmailRaw));
test('v4.99.57 D.6: email-report.js HTML template includes score + pass verdict + weak domain + share URL',
  /scaledScore/.test(_epEmailRaw) && /passThreshold|passVerdict/.test(_epEmailRaw) && /domainBreakdown/.test(_epEmailRaw) && /shareUrl/.test(_epEmailRaw));
test('v4.99.57 D.6: email-report.js uses NOTIFY_FROM_EMAIL env var (mirrors notify.js)',
  /NOTIFY_FROM_EMAIL/.test(_epEmailRaw));
test('v4.99.57 D.6: email-report.js 503s on missing RESEND_API_KEY / SUPABASE keys',
  /service_unconfigured/.test(_epEmailRaw) && /RESEND_API_KEY/.test(_epEmailRaw));
test('v4.99.57 D.6: email-report.js plain-text fallback alongside HTML',
  /return\s*\{\s*subject\s*,\s*html\s*,\s*text\s*\}/.test(_epEmailRaw));

// ── Vercel rewrite · /r/:token → share-redirect ──
const _landingVercelPath = path.join(require('path').join(__dirname, '..'), '..', 'landing', 'vercel.json');
let _landingVercelRaw = '';
try { _landingVercelRaw = fs.readFileSync(_landingVercelPath, 'utf8'); } catch (_) {}

test('v4.99.57 D.6: landing/vercel.json has /r/:token → share-redirect rewrite',
  /\/r\/:token/.test(_landingVercelRaw) && /share-redirect\?token=:token/.test(_landingVercelRaw));

// ── results.html · Download dialog wiring + ?token= hydrate + print CSS ──
test('v4.99.57 D.6: results.html Download stub replaced with working 3-action dialog (Print/Email/Share)',
  !_resultsD4Raw.includes('D.6 next ship') &&
  _resultsD4Raw.includes('id="dr-action-print"') &&
  _resultsD4Raw.includes('id="dr-action-email"') &&
  _resultsD4Raw.includes('id="dr-action-share"'));
test('v4.99.57 D.6: results.html Print action calls window.print()',
  /printBtn[\s\S]{0,400}window\.print\(\)/.test(_resultsD4Raw));
test('v4.99.57 D.6: results.html Email form posts to /api/diagnostic/email-report',
  /fetch\(['"]\/api\/diagnostic\/email-report['"]/.test(_resultsD4Raw));
test('v4.99.57 D.6: results.html Share action posts to /api/diagnostic/share',
  /fetch\(['"]\/api\/diagnostic\/share['"]/.test(_resultsD4Raw));
test('v4.99.57 D.6: results.html cachedShareToken reused across Email + Share clicks',
  /cachedShareToken/.test(_resultsD4Raw));
test('v4.99.57 D.6: results.html Copy-to-clipboard wiring on share reveal',
  /navigator\.clipboard\.writeText/.test(_resultsD4Raw) && /dr-share-copy/.test(_resultsD4Raw));
test('v4.99.57 D.6: results.html supports ?token=<hex> URL hydrate via share-fetch',
  /fetch\(['"]\/api\/diagnostic\/share-fetch\?token=/.test(_resultsD4Raw));
test('v4.99.57 D.6: results.html token query param validated against hex regex (16-64)',
  /\[a-f0-9\]\{16,64\}/.test(_resultsD4Raw));
test('v4.99.57 D.6: results.html renderShareError for expired/not_found/network paths',
  /renderShareError[\s\S]{0,800}expired[\s\S]{0,200}not_found/.test(_resultsD4Raw));
test('v4.99.60 redesign: @media print hides chrome + unrolls review (in shared system)',
  /@media\s+print[\s\S]{0,2200}\.dr-cta-block[\s\S]{0,200}display:\s*none/.test(_dgSys) &&
  /@media\s+print[\s\S]{0,2200}\.dr-review-list[\s\S]{0,200}display:\s*block/.test(_dgSys));
test('v4.99.57 D.6: results.html print footer shows /r/{token} or canonical URL',
  /dr-print-footer/.test(_resultsD4Raw));
test('v4.99.60 redesign: reduced-motion gate present (shared system)',
  /@media\s+\(prefers-reduced-motion/.test(_dgSys));

// ── v4.99.60 redesign tombstones — lock the impeccable wins, prevent regress ──
test('v4.99.60 tombstone: results.html has ZERO em-dashes (was 32)',
  !_resultsD4Raw.includes('—'));
test('v4.99.60 tombstone: results.html no longer has an inline <style> block (uses shared system)',
  !/<style>/.test(_resultsD4Raw));
test('v4.99.60 tombstone: results.html links the shared diagnostic-system.css',
  /<link[^>]+diagnostic-system\.css/.test(_resultsD4Raw));
test('v4.99.60 tombstone: shared system is OKLCH + namespaced (--dg-*); zero pure #fff/#000 in SCREEN styles (print may use paper b/w)',
  /oklch\(/.test(_dgSys) && /--dg-bg:/.test(_dgSys) &&
  // strip the @media print block (paper black/white there is correct, not the ban)
  !/#fff\b|#ffffff\b|#000\b|#000000\b/.test(_dgSys.replace(/@media\s+print\s*\{[\s\S]*?\n\}/g, '')));
test('v4.99.60 tombstone: de-carded — score/passplan/cta/domain blocks have no card chrome',
  /\.dr-score-block[\s\S]{0,200}background:\s*none\s*!important/.test(_dgSys) &&
  /\.dr-passplan,[\s\S]{0,260}background:\s*none\s*!important/.test(_dgSys));
test('v4.99.60 tombstone: token war won via html:root higher specificity',
  /html:root\s*\{/.test(_dgSys));

// ── v4.99.61 increment-2 tombstones — picker/intake/quiz swept to system ──
const _pickerRaw = (() => { try { return fs.readFileSync(path.join(require('path').join(__dirname, '..'),'..','landing','diagnostic','index.html'),'utf8'); } catch(_) { return ''; } })();
const _intakeRaw = (() => { try { return fs.readFileSync(path.join(require('path').join(__dirname, '..'),'..','landing','diagnostic','network-plus','intake.html'),'utf8'); } catch(_) { return ''; } })();
const _quizRaw   = (() => { try { return fs.readFileSync(path.join(require('path').join(__dirname, '..'),'..','landing','diagnostic','network-plus','quiz.html'),'utf8'); } catch(_) { return ''; } })();
test('v4.99.61 tombstone: all 3 screens link the shared system, zero inline <style>',
  /diagnostic-system\.css/.test(_pickerRaw) && !/<style>/.test(_pickerRaw) &&
  /diagnostic-system\.css/.test(_intakeRaw) && !/<style>/.test(_intakeRaw) &&
  /diagnostic-system\.css/.test(_quizRaw) && !/<style>/.test(_quizRaw));
// v4.99.62 prod-incident class-of-bug guard: a diagnostic page's
// diagnostic-system.css link must NEVER be bare-`./`-relative. Vercel
// cleanUrls + trailingSlash:false serves the picker at /diagnostic (no
// slash) → `./x.css` resolves to /x.css (404, unstyled page). All
// diagnostic CSS links must be `../diagnostic/`-prefixed (resolves to
// /diagnostic/diagnostic-system.css in BOTH prod cleanUrls and the
// localhost /landing/ root). Guards the PATTERN across all 4 screens.
test('v4.99.62 class-of-bug: no diagnostic page links diagnostic-system.css via bare ./ (cleanUrls 404 trap)',
  ![_pickerRaw, _intakeRaw, _quizRaw, _resultsD4Raw].some(s =>
    /href="\.\/diagnostic-system\.css/.test(s)) &&
  /href="\.\.\/diagnostic\/diagnostic-system\.css/.test(_pickerRaw));
// v4.99.63: superseded forced-dark with the dual-theme prefers-aware
// bootstrap. The 3 screens (a) must NOT force `var theme = 'dark'`,
// (b) must use the persisted-or-prefers bootstrap, (c) still 0 em-dash.
test('v4.99.63 dual-theme: diagnostic-system.css has the 4-block cascade, html[data-theme] LAST',
  (() => { let s=''; try { s=fs.readFileSync(path.join(require('path').join(__dirname, '..'),'..','landing','diagnostic','diagnostic-system.css'),'utf8'); } catch(_) {}
    // base html:root dark → @media prefers light → html[data-theme=dark] → html[data-theme=light], in that order
    return /html:root\s*\{[\s\S]*?@media\s*\(prefers-color-scheme:\s*light\)[\s\S]*?html\[data-theme="dark"\][\s\S]*?html\[data-theme="light"\]/.test(s)
      && /--dg-bg:\s*oklch\(0\.975/.test(s) && /--dg-bg:\s*oklch\(0\.17 0\.008 275\)/.test(s); })());
test('v4.99.63 dual-theme: all 4 diagnostic pages cache-bust diagnostic-system.css',
  [_pickerRaw, _intakeRaw, _quizRaw, _resultsD4Raw].every(s =>
    /diagnostic-system\.css\?v=4\.99\.\d+/.test(s)));
test('v4.99.61 tombstone: dx-* + dq-* systems authored in shared CSS (de-carded, tap targets, decorative emoji hidden)',
  /PICKER \+ INTAKE\s+\(dx-\*/.test(_dgSys) && /QUIZ\s+\(dq-\*/.test(_dgSys) &&
  /\.dx-intensity-btn-emoji\s*\{\s*display:\s*none/.test(_dgSys) &&
  /\.dq-confidence-btn-emoji\s*\{\s*display:\s*none/.test(_dgSys));
test('v4.99.61 tombstone: quiz stem is a real type anchor (audit fix: was 16px/500, now clamp→--dg-t2)',
  /\.dq-stem\s*\{[\s\S]{0,120}clamp\([^)]*--dg-t2/.test(_dgSys));
test('v4.99.61 tombstone: flow control tap targets >= 44px (dx-back/skip, dq-quit)',
  /\.dx-back-link,\s*\.dx-skip-link\s*\{[\s\S]{0,140}min-height:\s*44px/.test(_dgSys) &&
  /\.dq-quit-link\s*\{[\s\S]{0,200}min-height:\s*44px/.test(_dgSys));

// ══════════════════════════════════════════════════════════════════════════
// v4.99.59 — Environment Strategy · migration rollback-block convention
// ══════════════════════════════════════════════════════════════════════════
// Every supabase/migrations/*.sql file dated 2026-05-12 OR LATER must carry a
// `-- ROLLBACK` block (the documented backout plan — gated-lane discipline per
// ENVIRONMENT_STRATEGY.md). Migrations dated BEFORE 2026-05-12 predate the
// convention + are already applied to prod; their recovery path is Supabase
// PITR — we do NOT retrofit fabricated reversal SQL onto them (untested
// rollback SQL is itself a risk). The cutoff is enforced here automatically.
console.log('\n\x1b[1m── v4.99.59 — ENVIRONMENT STRATEGY · MIGRATION ROLLBACK GUARD ──\x1b[0m');

const _migDir = path.join(ROOT, 'supabase', 'migrations');
const _ROLLBACK_CONVENTION_CUTOFF = 20260512; // YYYYMMDD — convention adopted

test('v4.99.59 EnvStrategy: supabase/migrations/ directory exists', (() => {
  try { return fs.statSync(_migDir).isDirectory(); } catch (_) { return false; }
})());

test('v4.99.59 EnvStrategy: every migration dated >= 2026-05-12 carries a -- ROLLBACK block (pre-cutoff grandfathered → PITR)', (() => {
  let files;
  try { files = fs.readdirSync(_migDir).filter(f => /^\d{8}_.*\.sql$/.test(f)); }
  catch (_) { return false; }
  const offenders = [];
  for (const f of files) {
    const datePrefix = parseInt(f.slice(0, 8), 10);
    if (isNaN(datePrefix) || datePrefix < _ROLLBACK_CONVENTION_CUTOFF) continue; // grandfathered
    let body = '';
    try { body = fs.readFileSync(path.join(_migDir, f), 'utf8'); } catch (_) { body = ''; }
    // Convention marker: a "-- ROLLBACK" comment line (case-insensitive).
    if (!/^\s*--\s*ROLLBACK/im.test(body)) offenders.push(f);
  }
  if (offenders.length) {
    results.errors.push('migrations missing -- ROLLBACK block: ' + offenders.join(', '));
  }
  return offenders.length === 0;
})());

