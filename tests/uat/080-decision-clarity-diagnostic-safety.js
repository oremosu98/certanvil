// tests/uat/080-decision-clarity-diagnostic-safety.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Decision-clarity polish, Codex round 2-4 polish, baseline diagnostic + pass plan, auto-backup safety net, data-safety layer, retake cooldown, exam integration

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');
// #138 wave 5: startDiagnostic moved to features/diagnostic.js; search that directly
// to avoid the loader-stub in app.js masking _fnBody results.
const _diagnosticJs = (() => { try { return fs.readFileSync(require('path').join(ROOT, 'features/diagnostic.js'), 'utf8'); } catch(_) { return ''; } })();

// ══════════════════════════════════════════
// v4.75.1 — Pass-Rate Prediction surfaced in HeroV2 (visible homepage layout)
// v4.73.0 added prediction to legacy #readiness-card but the homepage uses
// HeroV2 layout which hides that. Surface the prediction in the visible
// dark readiness card + below-card what-if chips + trajectory.
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.75.1 PREDICTION IN HERO V2 ──\x1b[0m');
test('v4.75.1 HTML: #rc-v2-prediction element exists in HeroV2 card',
  html.includes('id="rc-v2-prediction"'));
test('v4.75.1 HTML: #rc-v2-whatif container exists',
  html.includes('id="rc-v2-whatif"'));
test('v4.75.1 HTML: #rc-v2-whatif-row chip slot exists',
  html.includes('id="rc-v2-whatif-row"'));
test('v4.75.1 HTML: #rc-v2-trajectory line exists',
  html.includes('id="rc-v2-trajectory"'));
test('v4.75.1 wiring: renderReadinessCardV2 populates rc-v2-prediction',
  /renderReadinessCardV2[\s\S]{0,5000}rc-v2-prediction/.test(js));
test('v4.75.1 wiring: renderReadinessCardV2 populates rc-v2-whatif',
  /renderReadinessCardV2[\s\S]{0,5000}rc-v2-whatif/.test(js));
test('v4.75.1 wiring: renderReadinessCardV2 populates rc-v2-trajectory',
  /renderReadinessCardV2[\s\S]{0,5000}rc-v2-trajectory/.test(js));
test('v4.75.1 wiring: rc-v2-whatif chips wire to focusTopic',
  /rc-v2-whatif-chip[\s\S]{0,500}focusTopic/.test(js));
test('v4.75.1 CSS: .rc-v2-prediction styled', css.includes('.rc-v2-prediction'));
test('v4.75.1 CSS: .rc-v2-whatif-chip styled', css.includes('.rc-v2-whatif-chip'));
test('v4.75.1 CSS: .rc-v2-trajectory tier classes (.warn/.mid/.good)',
  /\.rc-v2-trajectory\.warn[\s\S]{0,300}\.rc-v2-trajectory\.mid[\s\S]{0,300}\.rc-v2-trajectory\.good/.test(css));

// ══════════════════════════════════════════
// v4.76.0 — Decision-Clarity Polish
// 1. Next-Best-Move CTA in HeroV2
// 2. Mode Ladder (Quick / Practice / Exam tiers)
// 3. Actionable headline on Analytics page
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.76.0 DECISION-CLARITY POLISH ──\x1b[0m');

// 1. Next-Best-Move CTA
test('v4.76.0 logic: _computeNextBestMove function defined',
  /function\s+_computeNextBestMove\s*\(/.test(js));
test('v4.76.0 logic: _computeNextBestMove checks SR queue first',
  /function\s+_computeNextBestMove[\s\S]{0,1500}getSrStats[\s\S]{0,1500}srStats\.due/.test(js));
test('v4.76.0 logic: _computeNextBestMove checks daily challenge',
  /_computeNextBestMove[\s\S]{0,3000}isDailyChallengeDoneToday/.test(js));
test('v4.76.0 logic: _computeNextBestMove checks weak warmup path',
  /_computeNextBestMove[\s\S]{0,4000}computeWeakSpotScores/.test(js));
test('v4.76.0 logic: _computeNextBestMove checks what-if drill',
  /_computeNextBestMove[\s\S]{0,5000}whatIf/.test(js));
test('v4.76.0 logic: _computeNextBestMove fallback returns custom-quiz',
  /_computeNextBestMove[\s\S]{0,6000}type:\s*['"]custom-quiz['"]/.test(js));
test('v4.76.0 helper: _setWarmupTopic defined', /function\s+_setWarmupTopic\s*\(/.test(js));
test('v4.76.0 helper: _jumpToCustomQuiz defined', /function\s+_jumpToCustomQuiz\s*\(/.test(js));
test('v4.76.0 helper: renderNextBestMove defined', /function\s+renderNextBestMove\s*\(/.test(js));
test('v4.76.0 wiring: goSetup hooks renderNextBestMove',
  (() => {
    const body = _fnBody(js, 'goSetup');
    return body && /renderNextBestMove/.test(body);
  })());

// HTML
test('v4.76.0 HTML: #hero-v2-cta card exists in hero', html.includes('id="hero-v2-cta"'));
test('v4.76.0 HTML: #hero-v2-cta-title element exists', html.includes('id="hero-v2-cta-title"'));
test('v4.76.0 HTML: #hero-v2-cta-btn element exists', html.includes('id="hero-v2-cta-btn"'));
test('v4.76.0 HTML: #hero-v2-cta-reason element exists', html.includes('id="hero-v2-cta-reason"'));

// 2. Mode Ladder
// v5.5.3 MIGRATED — the session picker was reshuffled OUT of the cramped
// 372px .col-side rail into a full-width horizontal board (#modes-ladder
// now a .ch-wrap sibling after the masthead grid, with a new .dgh-board
// 3-tier wrapper; col-side-card class dropped). Same full-width treatment
// v5.4.0 gave the By-Domain matrix. This guard keeps equal regression
// strength: asserts the new structure AND tombstones the old col-side
// placement so it can't silently regress to the vertical rail dropdown.
// bento: the v7.16-era `.dgh-board`/`.dgh-sess` full-width session-picker (and the
// `.col-side` rail it was pulled out of) were replaced by the bento `.board` > `.bento`
// grid. #modes-ladder survives as a hidden legacy stub. Assert the bento board scaffold
// + the preserved stub ordering inside the legacy block.
test('bento HTML: board > cmd-bar + bento grid (was .dgh-board full-width session picker); #modes-ladder stub preserved',
  /<main class="board"[\s\S]{0,400}<header class="cmd-bar/.test(html)
  && /<header class="cmd-bar[\s\S]{0,700}<div class="bento"/.test(html)
  && html.includes('id="modes-ladder"')
  && !html.includes('class="dgh-board"') && !/class="[^"]*\bdgh-sess\b/.test(html)
  && html.indexOf('id="daily-challenge-card"') < html.indexOf('id="modes-ladder"')
  && html.indexOf('id="modes-ladder"') < html.indexOf('id="domain-grid-section"'));
// v5.5.5 — Continue anchor: the right rail's ALWAYS-present bottom (founder
// caught dead space below Daily Challenge when NBM/SR collapse). It is the
// rail's reliable bottom: after #daily-challenge-card, before #modes-ladder
// (.col-side closes before the full-width session board). The is-hidden
// NOT() is load-bearing — this card must never collapse (that IS the fix);
// it tombstones any future is-hidden regression. dg-system.css carries the
// look (not UAT-read), so this guard is HTML structure + the always-called
// renderContinueCard contract only.
// bento: the v7.16-era `.col-side` rail was replaced by the bento board. #continue-card
// survives as an always-present legacy stub (still after #daily-challenge-card, before
// #modes-ladder in the legacy block; never is-hidden — its always-present contract is
// preserved). renderContinueCard stays defined + called on both render paths.
test('bento HTML: #continue-card always-present legacy stub (after #daily-challenge-card, before #modes-ladder; NOT is-hidden; renderContinueCard defined + called both render paths)',
  html.includes('id="continue-card"')
  && html.indexOf('id="daily-challenge-card"') < html.indexOf('id="continue-card"')
  && html.indexOf('id="continue-card"') < html.indexOf('id="modes-ladder"')
  && !/id="continue-card"[^>]*\bis-hidden\b/.test(html)
  && /function renderContinueCard\s*\(/.test(js)
  && (js.match(/typeof renderContinueCard === 'function'\) renderContinueCard\(\)/g) || []).length >= 2);
// v5.5.7 — cert-leak fix. Quiz history + wrong bank are global per user
// (v4.99.26) but topics belong to a cert. renderContinueCard (v5.5.5) +
// the pre-existing renderHeroV2 lede both surfaced raw global topics →
// leaked N10-009 "Cable Issues" while in Security+. Both must filter
// through _isCurrentCertTopic (the canonical v4.99.26 buildSessionPlan
// pattern). These regexes double as tombstones: a revert to bare
// loadHistory()/loadWrongBank()/computeWeakSpotScores() fails them.
test('v5.5.7 CertLeak: renderContinueCard cert-scopes loadHistory + loadWrongBank via _isCurrentCertTopic (tombstone: revert to bare loadHistory()/loadWrongBank() fails this)',
  /\(\s*loadHistory\(\)\s*\|\|\s*\[\]\)\.filter\(\s*e\s*=>\s*e\s*&&\s*_isCurrentCertTopic\(\s*e\.topic\s*\)\s*\)/.test(js)
  && /\(\s*loadWrongBank\(\)\s*\|\|\s*\[\]\)\.filter\(\s*w\s*=>\s*w\s*&&\s*_isCurrentCertTopic\(\s*w\.topic\s*\)\s*\)\.length/.test(js));
test('v5.5.7 CertLeak: renderHeroV2 lede cert-scopes computeWeakSpotScores via _isCurrentCertTopic (the |\| [] form is unique vs buildSessionPlan)',
  /\(\s*computeWeakSpotScores\(\)\s*\|\|\s*\[\]\)\.filter\(\s*w\s*=>\s*w\s*&&\s*_isCurrentCertTopic\(\s*w\.topic\s*\)\s*\)/.test(js));
// v5.5.8 — sidebar streak redesign (founder: legacy dark pill is "ugly").
// styles.css .sb-streak UNTOUCHED (the v4.54.10 css guards 6448/6450/6452
// stay green); the look is a scoped dg-system.css de-card (not UAT-read).
// This guards the app.js render contract: the additive brand flame
// (.sb-streak-ico via the namespaced sbStreakFlame SVG) + Longest sub +
// the byte-exact preserved goSetup/.sb-streak-num/.sb-streak-label and the
// .sb-streak-empty contract. Tombstones a revert to the bare old markup.
test('v5.5.8 StreakRedesign: sidebar streak render = brand flame + Longest sub, contract (goSetup/.sb-streak-num/-label/-empty) preserved',
  /const\s+streakFlameSvg\s*=\s*'<svg viewBox="0 0 128 128"[\s\S]{0,260}sbStreakFlame[\s\S]{0,400}sb-streak-core/.test(js)
  && /class="sb-streak sb-streak-active" onclick="goSetup\(\)"[\s\S]{0,220}sb-streak-ico[\s\S]{0,220}sb-streak-num[\s\S]{0,140}sb-streak-label[\s\S]{0,140}sb-streak-sub/.test(js)
  && /class="sb-streak sb-streak-empty"[\s\S]{0,220}sb-streak-ico[\s\S]{0,200}sb-streak-empty-t/.test(js));
// bento: the v7.16-era `.dgh-grp` 3-tier session picker was replaced by three bento
// tiles — Quick start (#grp-quick), Practice (#grp-practice), Exam simulation
// (#grp-exam) — each in its own `.cell-*` tile with a `.tile-title` head.
test('bento HTML: 3 commitment tiles (quick / practice / exam simulation)',
  html.includes('id="grp-quick"') && html.includes('id="grp-practice"') && html.includes('id="grp-exam"')
    && /class="tile-title">Quick start</.test(html)
    && /class="tile-title">Practice[ <]/.test(html)  // v7.46.1: free-tier PRO pill may follow the title
    && /class="tile-title">Exam <i>simulation<\/i>/.test(html));
test('v4.76.0 HTML: Daily Challenge tile in Quick tier', html.includes('id="modes-dc-tile"'));
test('v4.76.0 HTML: Drill Mistakes tile in Quick tier', html.includes('id="modes-wrong-tile"'));
test('v4.76.0 HTML: Custom Quiz card delegates to _jumpToCustomQuiz',
  html.includes('onclick="_jumpToCustomQuiz()"'));
test('v4.76.0/dg4 HTML: Full Exam Simulator opt delegates to startExam',
  /onclick="startExam\(\)"[\s\S]{0,80}Full Exam Simulator/.test(html));
test('v4.76.0 HTML: legacy wrong-preset-tile + sub preserved (renderWrongBankBtn compat)',
  html.includes('id="wrong-preset-tile"') && html.includes('id="wrong-preset-sub"'));
test('v4.76.0 HTML: legacy marathon-section preserved as hidden',
  /id="marathon-section"[^>]*hidden/.test(html));

// 3. Analytics actionable headline
test('v4.76.0 helper: renderAnalyticsActionHeadline defined',
  /function\s+renderAnalyticsActionHeadline\s*\(/.test(js));
test('v4.76.0 wiring: renderAnalytics calls renderAnalyticsActionHeadline',
  (() => {
    const body = _fnBody(js, 'renderAnalytics');
    return body && /renderAnalyticsActionHeadline/.test(body);
  })());
test('v4.76.0 HTML: #ana-action-headline element exists',
  html.includes('id="ana-action-headline"'));
test('v4.76.0 logic: action headline reads from getReadinessScore().whatIf',
  /renderAnalyticsActionHeadline[\s\S]{0,800}getReadinessScore[\s\S]{0,400}whatIf/.test(js));

// CSS
test('v4.76.0 CSS: .hero-v2-cta gradient styled',
  /\.hero-v2-cta\s*\{[\s\S]{0,500}gradient/.test(css));
test('v4.76.0 CSS: .modes-tier with quick/practice/exam variants',
  css.includes('.modes-tier-quick') && css.includes('.modes-tier-practice') && css.includes('.modes-tier-exam'));
test('v4.76.0 CSS: .modes-card hover treatment',
  /\.modes-card:hover/.test(css));
test('v4.76.0 CSS: .modes-card-exam-full premium dark treatment',
  css.includes('.modes-card-exam-full'));
test('v4.76.0 CSS: .ana-action-headline gradient styled',
  /\.ana-action-headline\s*\{[\s\S]{0,500}gradient/.test(css));
test('v4.76.0 CSS: reduced-motion gate present for new elements',
  /prefers-reduced-motion[\s\S]{0,800}\.modes-card[\s\S]{0,400}transition:\s*none/.test(css));

// ══════════════════════════════════════════
// v4.77.0 — Codex round-2 polish
// 1. NEXT BEST MOVE eyebrow promoted to inline pill (more authoritative)
// 2. Analytics empty state — "Unlock your first insight" + Start Warmup CTA
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.77.0 CODEX ROUND-2 POLISH ──\x1b[0m');

// 1. Eyebrow upgrade
// bento: the v7.16-era visible "Next best move" eyebrow was dropped (the bento
// Recommended tile #primaryLaunch is the surfaced next move). The NBM machinery is
// preserved: renderNextBestMove (defined + called) fills the #hero-v2-cta legacy stub.
test('bento: Next-Best-Move machinery preserved (renderNextBestMove defined + called; #hero-v2-cta stub) — visible eyebrow replaced by #primaryLaunch tile',
  /function renderNextBestMove\s*\(/.test(js)
    && (js.match(/\brenderNextBestMove\s*\(/g) || []).length >= 2
    && html.includes('id="hero-v2-cta"')
    && /id="primaryLaunch"[^>]*onclick="applyPreset\('focused'\)"/.test(html));
test('v4.77.0 CSS: eyebrow is now an inline pill (display: inline-flex)',
  /\.hero-v2-cta-eyebrow\s*\{[\s\S]{0,500}display:\s*inline-flex/.test(css));
test('v4.77.0 CSS: eyebrow has pill background',
  /\.hero-v2-cta-eyebrow\s*\{[\s\S]{0,800}background:\s*rgba\(255,\s*255,\s*255,\s*0\.14\)/.test(css));
test('v4.77.0 CSS: eyebrow border-radius 99px (pill shape)',
  /\.hero-v2-cta-eyebrow\s*\{[\s\S]{0,800}border-radius:\s*99px/.test(css));

// 2. Analytics empty state
test('v4.77.0 logic: renderAnalytics empty state uses "Unlock your first insight"',
  /renderAnalytics[\s\S]{0,3000}Unlock your first insight/.test(js));
test('v4.77.0 logic: empty state has "Start 5-min Warmup" CTA',
  /Start 5-min Warmup/.test(js));
test('v4.77.0 logic: empty state CTA wires to applyPreset(\'warmup\')',
  /ana-empty-cta[\s\S]{0,400}applyPreset\([\\'"]+warmup[\\'"]+\)/.test(js));
test('v4.77.0 logic: empty state names the 3 unlocks (weakest topic / readiness trend / next study move)',
  /weakest topic[\s\S]{0,200}readiness trend[\s\S]{0,200}next study move/.test(js));
test('v4.77.0 CSS: .ana-empty-card styled', css.includes('.ana-empty-card'));
test('v4.77.0 CSS: .ana-empty-title styled', css.includes('.ana-empty-title'));
test('v4.77.0 CSS: .ana-empty-cta styled', css.includes('.ana-empty-cta'));

// ══════════════════════════════════════════
// v4.78.0 — Per-page recommendation cards (Codex round-2 strategic note)
// "Every page should have one strong recommendation, one primary CTA,
// then supporting data underneath." Applied to Drills + Progress +
// Subnet Trainer + Topology Builder.
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.78.0 PER-PAGE RECOMMENDATIONS ──\x1b[0m');

// Shared helper
test('v4.78.0 helper: _pageRecCard returns HTML',
  /function\s+_pageRecCard\s*\(opts\)/.test(js));
test('v4.78.0 helper: card includes page-rec-eyebrow + page-rec-headline + page-rec-btn',
  /_pageRecCard[\s\S]{0,2000}page-rec-eyebrow[\s\S]{0,2000}page-rec-headline[\s\S]{0,2000}page-rec-btn/.test(js));

// Per-page picker functions
test('v4.78.0: _pickProgressRecommendation defined', /function\s+_pickProgressRecommendation\s*\(/.test(js));

// Per-page render functions
test('v4.78.0: renderProgressRecommendation defined', /function\s+renderProgressRecommendation\s*\(/.test(js));

// Render-flow wiring
test('v4.78.0 wiring: renderProgressPage calls renderProgressRecommendation',
  (() => { const body = _fnBody(js, 'renderProgressPage'); return body && /renderProgressRecommendation/.test(body); })());
// (removed: v4.78.0 openTopologyBuilder wiring test — Topology Builder deleted in MVP quiz-only pivot)

// HTML host elements
test('v4.78.0 HTML: #progress-rec-host exists', html.includes('id="progress-rec-host"'));

// Topology recommendation logic — verify keyword-to-scenario map exists

// CSS
test('v4.78.0 CSS: .page-rec-card styled', css.includes('.page-rec-card'));
test('v4.78.0 CSS: .page-rec-eyebrow inline pill styling',
  /\.page-rec-eyebrow\s*\{[\s\S]{0,500}border-radius:\s*99px/.test(css));
test('v4.78.0 CSS: .page-rec-btn white CTA',
  /\.page-rec-btn\s*\{[\s\S]{0,400}background:\s*#fff/.test(css));
test('v4.78.0 CSS: reduced-motion gate for .page-rec-btn',
  /prefers-reduced-motion[\s\S]{0,400}\.page-rec-btn/.test(css));

// ══════════════════════════════════════════
// v4.79.0 — Codex round-3 hierarchy tightening
// 1. Home consolidation — retire §04 heading + standalone exam-section
// 2. Analytics empty H1 swap — hide page header in empty state
// 3. Progress fallback → specific starter topic ("Network Models & OSI")
// 4. Drill placeholders → strong "Start Lesson 1" CTAs (5 drills)
// 5. A11y — inert closed mobile sidebar + aria-expanded toggle
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.79.0 CODEX ROUND-3 HIERARCHY ──\x1b[0m');

// 1. Home consolidation
test('v4.79.0 home: §04 Custom Quiz section heading retired',
  !/&#167;\s*04[\s\S]{0,400}Custom\s*<em>quiz<\/em>/.test(html));
test('v4.79.0 home: standalone exam-section retired (was duplicating Mode Ladder)',
  !/<div class="exam-section">[\s\S]{0,800}Simulate Full Exam/.test(html));
test('v4.79.0 home: legacy #hardcore-checkbox preserved as hidden compat shim',
  /id="hardcore-checkbox"[^>]*hidden/.test(html));
// bento: the v7.16-era `.dgh-strict` Exam-group toggle was replaced by the bento
// composition; #modes-strict-checkbox survives as a hidden legacy stub still wired to
// setHardcoreMode (the next assertion guards the dual-checkbox sync).
test('bento home: Strict Mode toggle preserved as #modes-strict-checkbox legacy stub (→ setHardcoreMode)',
  html.includes('id="modes-strict-checkbox"')
    && /id="modes-strict-checkbox"[\s\S]{0,160}setHardcoreMode\(/.test(html));
test('v4.79.0 home: Strict Mode toggle syncs both checkboxes',
  /modes-strict-checkbox[\s\S]{0,400}hardcore-checkbox/.test(html));
test('v4.79.0 CSS: .modes-strict-toggle styled', css.includes('.modes-strict-toggle'));

// 2. Analytics empty H1 swap
test('v4.79.0 analytics: empty path hides #page-analytics > .ed-pagehead',
  /renderAnalytics[\s\S]{0,2500}page-analytics[\s\S]{0,400}ed-pagehead[\s\S]{0,200}is-hidden/.test(js));
test('v4.79.0 analytics: data path restores .ed-pagehead (removes is-hidden)',
  /renderAnalytics[\s\S]{0,4000}classList\.remove\(['"]is-hidden['"]\)/.test(js));
test('v4.79.0 analytics: empty title is now an <h1> (was <h2>)',
  /<h1\s+class="ana-empty-title">/.test(js));
test('v4.79.0 CSS: .ana-empty-title bumped to H1 sizing (font-size 36px)',
  /\.ana-empty-title\s*\{[\s\S]{0,500}font-size:\s*36px/.test(css));

// 3. Progress fallback → specific starter topic
test('v4.79.0 progress: fallback recommends Network Models & OSI specifically',
  /_pickProgressRecommendation[\s\S]{0,1500}Network Models\s*&\s*OSI/.test(js));
test('v4.79.0 progress: fallback no longer says "Take a custom quiz" generically',
  (() => {
    const body = _fnBody(js, '_pickProgressRecommendation');
    return body && !/headline:\s*['"]Take a custom quiz['"]/.test(body);
  })());

// 4. Drill placeholders → strong CTAs
test('v4.79.0 drill: legacy "Select a lesson" placeholders no longer appear',
  !html.includes('Select a lesson from the sidebar to begin'));
test('v4.79.0 CSS: .st-lesson-placeholder-v2 shared style',
  /\.st-lesson-placeholder-v2/.test(css));

// 5. A11y polish
test('v4.79.0 a11y: toggleSidebarMobile sets inert on closed mobile sidebar',
  // v4.99.47 Phase 7: window bumped 800→1500 because the comment block
  // explaining the 768 breakpoint pushed setAttribute past the prior limit.
  /toggleSidebarMobile[\s\S]{0,1500}setAttribute\(['"]inert['"]/.test(js));
test('v4.79.0 a11y: _syncSidebarA11y defined for resize-driven inert sync',
  /function\s+_syncSidebarA11y\s*\(/.test(js));
test('v4.79.0 a11y: mobile toggle button has aria-expanded',
  /id="sb-mobile-toggle"[^>]*aria-expanded/.test(html));
test('v4.79.0 a11y: mobile toggle button has aria-controls="app-sidebar"',
  /id="sb-mobile-toggle"[^>]*aria-controls="app-sidebar"/.test(html));

// ══════════════════════════════════════════
// v4.80.0 — Codex round-4 polish
// 1. Custom Quiz section hidden by default on homepage (Mode Ladder is sole entry)
// 2. ACL Builder defaults to a guided scenario for first-time users (not Free Build)
// ══════════════════════════════════════════
console.log('\n\x1b[1m── v4.80.0 CODEX ROUND-4 POLISH ──\x1b[0m');

// 1. Custom Quiz hide-by-default reverted (broke too many flows + tests).
// Tombstone keeps the cq-collapsed class from accidentally coming back —
// if we want to revisit hiding the form, the right path is a modal.
test('v4.80.0 tombstone: cq-collapsed class NOT applied to live elements',
  !/class="[^"]*cq-collapsed/.test(html));

// v4.80.0: setup-err relocated OUT of the Custom Quiz <details> for
// page-level visibility (still applies — error needs to render even if
// the form is closed/scrolled past).
test('v4.80.0 home: #setup-err sits at page level (outside Custom Quiz <details>)',
  (() => {
    const setupErrIdx = html.indexOf('id="setup-err"');
    const detailsCloseIdx = html.indexOf('</details>', html.indexOf('id="custom-quiz-section"'));
    return setupErrIdx > detailsCloseIdx;
  })());

// 2. ACL Builder first-time scenario

// ──────────────────────────────────────────────────────────
// v4.81.0: Baseline Diagnostic + Pass Plan (Codex r5 #1 / Issue #243)
// ──────────────────────────────────────────────────────────
test('v4.81.0 Diagnostic: STORAGE.DIAGNOSTIC key declared',
  /DIAGNOSTIC:\s*['"]nplus_diagnostic['"]/.test(js));
test('v4.81.0 Diagnostic: STORAGE.LAST_DIAGNOSTIC_AT key declared',
  /LAST_DIAGNOSTIC_AT:\s*['"]nplus_last_diagnostic_at['"]/.test(js));
test('v4.81.0 Diagnostic: DIAGNOSTIC_QUESTION_COUNT = 20',
  /const\s+DIAGNOSTIC_QUESTION_COUNT\s*=\s*20/.test(js));
test('v4.81.0 Diagnostic: DIAGNOSTIC_DURATION_MS is 30 minutes',
  /const\s+DIAGNOSTIC_DURATION_MS\s*=\s*30\s*\*\s*60\s*\*\s*1000/.test(js));
test('v4.81.0 Diagnostic: DIAGNOSTIC_RETAKE_COOLDOWN_DAYS = 7',
  /const\s+DIAGNOSTIC_RETAKE_COOLDOWN_DAYS\s*=\s*7/.test(js));

// Function existence
test('v4.81.0 Diagnostic: startDiagnostic function defined',
  /async\s+function\s+startDiagnostic\b/.test(js));
test('v4.81.0 Diagnostic: submitDiagnosticAnswer function defined',
  /function\s+submitDiagnosticAnswer\b/.test(js));
test('v4.81.0 Diagnostic: completeDiagnostic function defined (renamed from finishDiagnostic to avoid prefix-match trap with finish)',
  /function\s+completeDiagnostic\b/.test(js));
// Regression guard: do NOT reintroduce a `function finishDiagnostic` or
// `function finishPassPlanReview` — both prefix-collide with the existing
// `function finish` body and break six v4.42.0 finish() UAT regexes.
test('v4.81.0 Diagnostic: no finishDiagnostic prefix collision with finish()',
  !/function\s+finishDiagnostic\s*\(/.test(js));
test('v4.81.0 Diagnostic: no finishPassPlanReview prefix collision with finish()',
  !/function\s+finishPassPlanReview\s*\(/.test(js));
test('v4.81.0 Diagnostic: _buildPassPlan function defined',
  /function\s+_buildPassPlan\b/.test(js));
test('v4.81.0 Diagnostic: _seedReviewQueueFromDiagnostic function defined',
  /function\s+_seedReviewQueueFromDiagnostic\b/.test(js));
test('v4.81.0 Diagnostic: renderDiagnosticResult function defined',
  /function\s+renderDiagnosticResult\b/.test(js));
// v7.52.0 · state-aware conversion block at the bottom of the Pass Plan.
test('diagnostic conversion block present', html.includes('id="dq-conversion"'));
test('conversion renders states', _fnBody(js, '_renderDiagnosticConversion').includes('_certanvilSignedIn'));
test('Pro teaser has no pricing link', !_fnBody(js, '_showProWaitlist').includes('certanvil.com/pricing'));
// v7.52.0: account Pass Plan home (Free one-plan+upsell, Pro plan-per-cert)
test('account Pass Plan section', html.includes('id="passplan-section"'));
test('Pass Plan section tier-aware', _fnBody(js, 'renderPassPlanSection').includes('_renderPassPlanProHtml'));
test('Pro plan list uses snapshots', _fnBody(js, '_renderPassPlanProHtml').includes('_readReadinessSnapshots'));
test('Pass Plan section branches on standalone vs browser', _fnBody(js, 'renderPassPlanSection').includes("classList.contains('is-standalone')"));
test('browser Pass Plan reuses single current-cert card helper', /_passPlanCurrentCertCardHtml/.test(js));
// v7.52.0: weak domains open the Custom Quiz builder pre-loaded (no auto-start) + quota-aware line
test('weak drill opens builder (no autostart)', _fnBody(js, '_drillWeakDomainToBuilder').includes('prefillDomainTopics') && !_fnBody(js, '_drillWeakDomainToBuilder').includes('startQuiz('));
test('builder quota line', html.includes('id="cq-quota-line"') && /function _renderBuilderQuotaLine\(/.test(js));
test('getAvailableCerts exposed', /window\.getAvailableCerts\s*=/.test(authStateJs));
test('readiness snapshot reader', /function _readReadinessSnapshots\(/.test(js));
test('v4.81.0 Diagnostic: renderDiagnosticSurface function defined',
  /function\s+renderDiagnosticSurface\b/.test(js));
test('v4.81.0 Diagnostic: getDiagnosticCooldownDays function defined',
  /function\s+getDiagnosticCooldownDays\b/.test(js));

// Wiring checks
test('v4.81.0 Diagnostic: goSetup calls renderDiagnosticSurface',
  (() => {
    const body = _fnBody(js, 'goSetup');
    return body && /renderDiagnosticSurface\b/.test(body);
  })());
test('v4.81.0 Diagnostic: _computeNextBestMove has baseline-diagnostic branch',
  (() => {
    const body = _fnBody(js, '_computeNextBestMove');
    return body && /baseline-diagnostic/.test(body) && /loadDiagnostic/.test(body);
  })());
test('v4.81.0 Diagnostic: _seedReviewQueueFromDiagnostic calls addToSrQueue',
  (() => {
    const body = _fnBody(js, '_seedReviewQueueFromDiagnostic');
    return body && /addToSrQueue\b/.test(body);
  })());
test('v4.81.0 Diagnostic: _seedReviewQueueFromDiagnostic seeds wrong + uncertain + guessing',
  (() => {
    const body = _fnBody(js, '_seedReviewQueueFromDiagnostic');
    return body && /a\.correct/.test(body) && /uncertain/.test(body) && /guessing/.test(body);
  })());

// _buildPassPlan math fixture — given known inputs, verify probability + CI shape.
// Note: _fnBody returns the full `function _buildPassPlan(session) {...}`
// declaration. Strategy: vm.runInContext(decl) installs the fn in the ctx,
// then we call it from a second runInContext.
test('v4.81.0 Diagnostic: _buildPassPlan returns expected shape (vm fixture)',
  (() => {
    try {
      const body = _fnBody(js, '_buildPassPlan');
      if (!body) return false;
      const vm = require('vm');
      const ctx = {
        DOMAIN_WEIGHTS: { concepts: 0.23, implementation: 0.20, operations: 0.19, security: 0.14, troubleshooting: 0.24 },
        DOMAIN_LABELS: { concepts: 'Concepts', implementation: 'Implementation', operations: 'Operations', security: 'Security', troubleshooting: 'Troubleshooting' },
        TOPIC_DOMAINS: { 'A': 'concepts', 'B': 'implementation', 'C': 'operations', 'D': 'security', 'E': 'troubleshooting' },
        EXAM_PASS_SCORE: 720,
        _buildWeekPlan: () => [],
        // v4.81.6: _buildPassPlan now calls _resolveDomainForTopic; stub
        // it to use the simple TOPIC_DOMAINS lookup for these existing
        // fixtures (which use exact-match canonical keys A-E).
        _resolveDomainForTopic: (t) => ({ A: 'concepts', B: 'implementation', C: 'operations', D: 'security', E: 'troubleshooting' })[t] || null,
        Math, Date, JSON
      };
      vm.createContext(ctx);
      const questions = Array.from({ length: 20 }, (_, i) => ({ topic: ['A','B','C','D','E'][i % 5] }));
      const answers = questions.map((_, i) => ({ correct: i < 12, confidence: i < 12 ? 'confident' : 'guessing', answeredAt: 1 }));
      ctx.session = { questions, answers };
      vm.runInContext(body, ctx);
      const plan = vm.runInContext('_buildPassPlan(session)', ctx);
      return plan && plan.questionCount === 20
        && typeof plan.predicted === 'number'
        && plan.predicted >= 420 && plan.predicted <= 870
        && typeof plan.passProbability === 'number'
        && plan.passProbability >= 0 && plan.passProbability <= 1
        && Array.isArray(plan.weakDomains)
        && plan.weakDomains.length <= 3
        && plan.lowerBound <= plan.predicted && plan.upperBound >= plan.predicted;
    } catch (e) { return false; }
  })());

test('v4.81.0 Diagnostic: _buildPassPlan probability near 0.5 at ~70% accuracy (vm fixture)',
  (() => {
    try {
      const body = _fnBody(js, '_buildPassPlan');
      if (!body) return false;
      const vm = require('vm');
      const ctx = {
        DOMAIN_WEIGHTS: { concepts: 0.23, implementation: 0.20, operations: 0.19, security: 0.14, troubleshooting: 0.24 },
        DOMAIN_LABELS: { concepts: 'Concepts', implementation: 'Implementation', operations: 'Operations', security: 'Security', troubleshooting: 'Troubleshooting' },
        TOPIC_DOMAINS: { 'A': 'concepts', 'B': 'implementation', 'C': 'operations', 'D': 'security', 'E': 'troubleshooting' },
        EXAM_PASS_SCORE: 720,
        _buildWeekPlan: () => [],
        // v4.81.6: _buildPassPlan now calls _resolveDomainForTopic; stub
        // it to use the simple TOPIC_DOMAINS lookup for these existing
        // fixtures (which use exact-match canonical keys A-E).
        _resolveDomainForTopic: (t) => ({ A: 'concepts', B: 'implementation', C: 'operations', D: 'security', E: 'troubleshooting' })[t] || null,
        Math, Date, JSON
      };
      vm.createContext(ctx);
      const questions = Array.from({ length: 20 }, (_, i) => ({ topic: ['A','B','C','D','E'][i % 5] }));
      const answers = questions.map((_, i) => ({ correct: i < 14, confidence: 'confident', answeredAt: 1 }));
      ctx.session = { questions, answers };
      vm.runInContext(body, ctx);
      const plan = vm.runInContext('_buildPassPlan(session)', ctx);
      return plan.passProbability >= 0.30 && plan.passProbability <= 0.60;
    } catch (e) { return false; }
  })());

// HTML structural checks
test('v4.81.0 Diagnostic: #diagnostic-cta-card on home page',
  /id="diagnostic-cta-card"/.test(html));
test('v4.81.0 Diagnostic: #pass-plan-tile on home page',
  /id="pass-plan-tile"/.test(html));
test('v4.81.0 Diagnostic: #page-diagnostic-quiz exists',
  /id="page-diagnostic-quiz"/.test(html));
test('v4.81.0 Diagnostic: #page-diagnostic-result exists',
  /id="page-diagnostic-result"/.test(html));
test('v4.81.0 Diagnostic: 3-tier confidence picker present',
  /data-tier="confident"/.test(html) && /data-tier="uncertain"/.test(html) && /data-tier="guessing"/.test(html));
test('v4.81.0 Diagnostic: confidence ladder (low/medium/high) present',
  /pass-plan-ladder-tier[^>]*data-tier="low"/.test(html)
  && /pass-plan-ladder-tier[^>]*data-tier="medium"/.test(html)
  && /pass-plan-ladder-tier[^>]*data-tier="high"/.test(html));
test('v4.81.0 Diagnostic: "Take the Diagnostic" CTA wired to startDiagnostic()',
  /onclick="startDiagnostic\(\)"/.test(html));
test('v4.81.0 Diagnostic: Pass Plan tile View report wired to viewPassPlan()',
  /viewPassPlan\(\)/.test(html));

// CSS structural checks
test('v4.81.0 Diagnostic: .diagnostic-cta-card style declared',
  /\.diagnostic-cta-card\s*\{/.test(css));
test('v4.81.0 Diagnostic: .pass-plan-prob-ring style declared',
  /\.pass-plan-prob-ring\s*\{/.test(css));
test('v4.81.0 Diagnostic: .pass-plan-week-strip style declared',
  /\.pass-plan-week-strip\s*\{/.test(css));
test('v4.81.0 Diagnostic: .diag-conf-tier confidence picker style declared',
  /\.diag-conf-tier\s*\{/.test(css));

// ──────────────────────────────────────────────────────────
// v4.81.1: NBM + SR + Diagnostic surface render on first paint
// ──────────────────────────────────────────────────────────
// Pre-fix these home-page surfaces only rendered when goSetup() was called
// (i.e. after a navigation). On raw page load (DOMContentLoaded only) they
// stayed in their default-hidden state, producing a "card appears then
// disappears" inconsistency for users who reloaded from a goSetup'd state.
// Fix: hoist the three render calls into the DOMContentLoaded handler so
// initial paint matches the post-navigation state.
test('v4.81.1: DOMContentLoaded calls renderNextBestMove on first paint',
  /DOMContentLoaded[\s\S]{0,3500}renderNextBestMove\b/.test(js));
test('v4.81.1: DOMContentLoaded calls renderSrReviewCard on first paint',
  /DOMContentLoaded[\s\S]{0,3500}renderSrReviewCard\b/.test(js));
test('v4.81.1: DOMContentLoaded calls renderDiagnosticSurface on first paint',
  /DOMContentLoaded[\s\S]{0,3500}renderDiagnosticSurface\b/.test(js));
test('v7.34.1: DOMContentLoaded calls _initHomeCollapse on first load (phone collapse bug fix)',
  /DOMContentLoaded[\s\S]{0,6000}_initHomeCollapse\b/.test(js));

// ──────────────────────────────────────────────────────────
// v4.81.2: Auto-backup safety net
// ──────────────────────────────────────────────────────────
// Filed in direct response to a localStorage-corruption incident where
// test-injected state overwrote a user's quiz history + streak + exam
// date. This safety net snapshots every nplus_* key once per day and
// keeps a rolling 7-day window so any catastrophic corruption is
// recoverable.
test('v4.81.2 Backup: STORAGE.AUTOBACKUP_PREFIX declared',
  /AUTOBACKUP_PREFIX:\s*['"]nplus_autobackup_['"]/.test(js));
test('v4.81.2 Backup: STORAGE.LAST_AUTOBACKUP_AT declared',
  /LAST_AUTOBACKUP_AT:\s*['"]nplus_last_autobackup_at['"]/.test(js));
test('v4.81.2 Backup: AUTOBACKUP_KEEP_DAYS = 7',
  /const\s+AUTOBACKUP_KEEP_DAYS\s*=\s*7/.test(js));

// Function existence
test('v4.81.2 Backup: _captureSnapshot function defined',
  /function\s+_captureSnapshot\b/.test(js));
test('v4.81.2 Backup: _autoBackupTodayKey function defined',
  /function\s+_autoBackupTodayKey\b/.test(js));
test('v4.81.2 Backup: _takeAutoBackup function defined',
  /function\s+_takeAutoBackup\b/.test(js));
test('v4.81.2 Backup: _pruneAutoBackups function defined',
  /function\s+_pruneAutoBackups\b/.test(js));
test('v4.81.2 Backup: listAutoBackups function defined',
  /function\s+listAutoBackups\b/.test(js));
test('v4.81.2 Backup: restoreFromAutoBackup function defined',
  /function\s+restoreFromAutoBackup\b/.test(js));
test('v4.81.2 Backup: downloadAutoBackup function defined',
  /function\s+downloadAutoBackup\b/.test(js));
test('v4.81.2 Backup: renderAutoBackupList function defined',
  /function\s+renderAutoBackupList\b/.test(js));

// Wiring checks
test('v4.81.2 Backup: DOMContentLoaded calls _takeAutoBackup',
  // #138 wave 3: DOMContentLoaded handler at line ~2271; _takeAutoBackup call at ~2341
  // is ~3600 chars away (long handler). Widened from 2500 → 5000 to cover actual distance.
  /DOMContentLoaded[\s\S]{0,5000}_takeAutoBackup\b/.test(js));
test('v4.81.2 Backup: renderSettingsPage calls renderAutoBackupList',
  (() => {
    const body = _fnBody(js, 'renderSettingsPage');
    return body && /renderAutoBackupList\b/.test(body);
  })());
test('v4.81.2 Backup: _captureSnapshot excludes autobackup-namespace keys (no recursion)',
  (() => {
    const body = _fnBody(js, '_captureSnapshot');
    return body && /AUTOBACKUP_PREFIX/.test(body) && /continue/.test(body);
  })());
test('v4.81.2 Backup: restoreFromAutoBackup snapshots current state pre-restore (rollback safety)',
  (() => {
    const body = _fnBody(js, 'restoreFromAutoBackup');
    return body && /pre-restore/i.test(body);
  })());

// Behavioral fixture — round-trip a synthetic snapshot and verify restore
test('v4.81.2 Backup: snapshot round-trip preserves keys (vm fixture)',
  (() => {
    try {
      const captureBody = _fnBody(js, '_captureSnapshot');
      if (!captureBody) return false;
      const vm = require('vm');
      // In-memory localStorage shim
      const store = {};
      const localStorage = {
        get length() { return Object.keys(store).length; },
        key(i) { return Object.keys(store)[i]; },
        getItem(k) { return store[k] === undefined ? null : store[k]; },
        setItem(k, v) { store[k] = String(v); },
        removeItem(k) { delete store[k]; }
      };
      const ctx = {
        STORAGE: { AUTOBACKUP_PREFIX: 'nplus_autobackup_', LAST_AUTOBACKUP_AT: 'nplus_last_autobackup_at' },
        localStorage,
        Math, Date, JSON
      };
      vm.createContext(ctx);
      // Plant test data
      store['nplus_history'] = '[{"a":1}]';
      store['nplus_streak'] = '{"current":3}';
      store['nplus_autobackup_2026-04-24'] = '{"snapshot":{"old":"x"}}';
      store['unrelated_key'] = 'should-not-be-captured';
      vm.runInContext(captureBody, ctx);
      const snap = vm.runInContext('_captureSnapshot()', ctx);
      // Should include nplus_history + nplus_streak, EXCLUDE autobackup key + unrelated
      return snap.nplus_history === '[{"a":1}]'
        && snap.nplus_streak === '{"current":3}'
        && !('nplus_autobackup_2026-04-24' in snap)
        && !('unrelated_key' in snap)
        && Object.keys(snap).length === 2;
    } catch (e) { return false; }
  })());

// HTML structural checks
test('v4.81.2 Backup: Settings page has #autobackup-list',
  /id="autobackup-list"/.test(html));
test('v4.81.2 Backup: Settings page has Snapshot now button',
  /Snapshot\s+now/i.test(html));
test('v4.81.2 Backup: Settings page has Download latest snapshot button',
  /Download\s+latest\s+snapshot/i.test(html));

// CSS structural checks
test('v4.81.2 Backup: .autobackup-list style declared',
  /\.autobackup-list\s*\{/.test(css));
test('v4.81.2 Backup: .ab-row style declared',
  /\.ab-row\s*\{/.test(css));

// ──────────────────────────────────────────────────────────
// v4.81.3: Data-safety discipline layer (defense-in-depth)
// ──────────────────────────────────────────────────────────
// Five forward-looking guards added in direct response to the
// localStorage-corruption incident:
// 1. _emitProdConsoleBanner() warns on prod page load
// 2. _renderEnvBadge() puts a PROD/DEV pill in the top-right corner
// 3. _maybeExportReminder() surfaces a periodic export-reminder toast
// 4. UAT regression guard: zero literal-string 'nplus_' writes outside STORAGE
// 5. Pre-commit hook scans for risky MCP+setItem patterns

// Storage / constants
test('v4.81.3 Safety: STORAGE.TB_INTRO_SEEN namespaced (was outlier literal)',
  /TB_INTRO_SEEN:\s*['"]nplus_tb_intro_seen['"]/.test(js));
test('v4.81.3 Safety: STORAGE.LAST_EXPORT_REMINDER_AT declared',
  /LAST_EXPORT_REMINDER_AT:\s*['"]nplus_last_export_reminder_at['"]/.test(js));
test('v4.81.3 Safety: EXPORT_REMINDER_DAYS = 14',
  /const\s+EXPORT_REMINDER_DAYS\s*=\s*14/.test(js));

// Functions exist
test('v4.81.3 Safety: _isProdHost function defined',
  /function\s+_isProdHost\b/.test(js));
test('v4.81.3 Safety: _emitProdConsoleBanner function defined',
  /function\s+_emitProdConsoleBanner\b/.test(js));
test('v4.81.3 Safety: _renderEnvBadge function defined',
  /function\s+_renderEnvBadge\b/.test(js));
test('v4.81.3 Safety: _maybeExportReminder function defined',
  /function\s+_maybeExportReminder\b/.test(js));

// DOMContentLoaded wires all three
test('v4.81.3 Safety: DOMContentLoaded calls _emitProdConsoleBanner',
  /DOMContentLoaded[\s\S]{0,4000}_emitProdConsoleBanner\b/.test(js));
test('v4.81.3 Safety: DOMContentLoaded calls _renderEnvBadge',
  /DOMContentLoaded[\s\S]{0,4000}_renderEnvBadge\b/.test(js));
test('v4.81.3 Safety: DOMContentLoaded calls _maybeExportReminder',
  // v4.88.0: window widened 3500 → 4500 (v4.88.0 added _renderCertAwareCopy hook)
  /DOMContentLoaded[\s\S]{0,4500}_maybeExportReminder\b/.test(js));

// Banner content sanity
test('v4.81.3 Safety: prod banner mentions DO NOT write to localStorage',
  (() => {
    const body = _fnBody(js, '_emitProdConsoleBanner');
    return body && /DO NOT write to localStorage/i.test(body);
  })());
test('v4.81.3 Safety: prod banner mentions Auto-backups recovery path',
  (() => {
    const body = _fnBody(js, '_emitProdConsoleBanner');
    return body && /Auto-backups/i.test(body);
  })());
test('v4.81.3 Safety: prod banner only fires once per page load',
  (() => {
    const body = _fnBody(js, '_emitProdConsoleBanner');
    return body && /__nplusProdBannerEmitted/.test(body);
  })());

// _isProdHost detection
test('v4.81.3 Safety: _isProdHost detects vercel.app hosts',
  (() => {
    const body = _fnBody(js, '_isProdHost');
    return body && /vercel\.app/.test(body);
  })());

// Export reminder gates
test('v4.81.3 Safety: _maybeExportReminder skips users with <5 sessions',
  (() => {
    const body = _fnBody(js, '_maybeExportReminder');
    return body && /hist\.length\s*<\s*5/.test(body);
  })());
test('v4.81.3 Safety: _maybeExportReminder uses LAST_EXPORT_REMINDER_AT throttle',
  (() => {
    const body = _fnBody(js, '_maybeExportReminder');
    return body && /LAST_EXPORT_REMINDER_AT/.test(body) && /EXPORT_REMINDER_DAYS/.test(body);
  })());

// CSS for badge
test('v4.81.3 Safety: .env-badge style declared',
  /\.env-badge\s*\{/.test(css));
test('v4.81.3 Safety: .env-badge-prod has red treatment',
  /\.env-badge-prod[\s\S]{0,300}#dc2626/.test(css));
test('v4.81.3 Safety: .env-badge-dev has green treatment',
  /\.env-badge-dev[\s\S]{0,300}#16a34a/.test(css));

// 🛑 THE BIG ONE — zero-tolerance regression guard:
// No literal-string `localStorage.setItem('nplus_…')` anywhere in app.js.
// All state writes must go through STORAGE.X. This is the structural
// guard that prevents the corruption-incident pattern from regressing.
test('v4.81.3 Safety: ZERO literal-string nplus_* writes outside STORAGE',
  !/localStorage\.setItem\(\s*['"]nplus_[a-z_]/.test(js));
test('v4.81.3 Safety: ZERO literal-string nplus_* removeItem outside STORAGE',
  !/localStorage\.removeItem\(\s*['"]nplus_[a-z_]/.test(js));

// CLAUDE.md institutional rule check
test('v4.81.3 Safety: CLAUDE.md has Testing Discipline section',
  (() => {
    try {
      const md = require('fs').readFileSync(require('path').join(ROOT, 'CLAUDE.md'), 'utf8');
      return /Testing Discipline/i.test(md) && /NEVER write to user-state localStorage/.test(md);
    } catch (_) { return false; }
  })());

// Pre-commit hook scan for risky patterns
// ──────────────────────────────────────────────────────────
// v4.81.4: API key auto-save (UX fix from v4.81.3 follow-up)
// ──────────────────────────────────────────────────────────
test('v4.81.4 ApiKey: API_KEY_AUTOSAVE_DEBOUNCE_MS constant declared',
  /const\s+API_KEY_AUTOSAVE_DEBOUNCE_MS\s*=\s*\d+/.test(js));
test('v4.81.4 ApiKey: autoSaveApiKey function defined',
  /function\s+autoSaveApiKey\b/.test(js));
test('v4.81.4 ApiKey: _apiKeyDebouncedSave function defined',
  /function\s+_apiKeyDebouncedSave\b/.test(js));
test('v4.81.4 ApiKey: _renderApiKeyStatusOnLoad function defined',
  /function\s+_renderApiKeyStatusOnLoad\b/.test(js));
// v4.99.3: BYOK input retired — wiring no longer present (Settings field removed).
// autoSaveApiKey + _apiKeyDebouncedSave functions still exist in app.js for legacy
// callsites but the input element they bind to is now a hidden no-op.
test('v4.81.4 ApiKey: autoSaveApiKey function still defined (legacy callers safe)',
  /function\s+autoSaveApiKey\b/.test(js));
test('v4.81.4 ApiKey: _apiKeyDebouncedSave function still defined',
  /function\s+_apiKeyDebouncedSave\b/.test(js));
test('v4.81.4 ApiKey: #api-key-status status pill present',
  /id="api-key-status"/.test(html));
test('v4.81.4 ApiKey: autoSaveApiKey validates sk-ant- prefix',
  (() => {
    const body = _fnBody(js, 'autoSaveApiKey');
    return body && /sk-ant-/.test(body);
  })());
test('v4.81.4 ApiKey: autoSaveApiKey trims whitespace before save',
  (() => {
    const body = _fnBody(js, 'autoSaveApiKey');
    return body && /\.trim\(\)/.test(body);
  })());
test('v4.81.4 ApiKey: renderSettingsPage calls _renderApiKeyStatusOnLoad',
  (() => {
    const body = _fnBody(js, 'renderSettingsPage');
    return body && /_renderApiKeyStatusOnLoad\b/.test(body);
  })());
test('v4.81.4 ApiKey: .api-key-status-ok style declared',
  /\.api-key-status-ok\s*\{/.test(css));

// ──────────────────────────────────────────────────────────
// v4.81.5: Diagnostic options-render bugfix
// ──────────────────────────────────────────────────────────
// User report: "where is the questions??? even when i click on Next nothing
// even happens" — screenshot showed question stem but no answer buttons.
// Root cause: _renderDiagnosticQuestion did `(q.options || []).forEach(...)`
// but q.options is a LETTER-KEYED OBJECT ({A:'…', B:'…', C:'…', D:'…'})
// matching the rest of the app's MCQ schema, NOT an array. forEach on an
// object silently throws (forEach is undefined). No options rendered, the
// "Pick an answer" hint blocked Next.
test('v4.81.5 Diagnostic: _renderDiagnosticQuestion uses Object.keys for options (not array forEach)',
  (() => {
    const body = _fnBody(js, '_renderDiagnosticQuestion');
    return body && /Object\.keys\(q\.options/.test(body);
  })());
test('v4.81.5 Diagnostic: pickDiagnosticOption takes a letter (not numeric index)',
  (() => {
    const body = _fnBody(js, 'pickDiagnosticOption');
    return body && /pickedLetter/.test(body);
  })());
test('v4.81.5 Diagnostic: submitDiagnosticAnswer compares pickedLetter to q.answer',
  (() => {
    const body = _fnBody(js, 'submitDiagnosticAnswer');
    return body && /pickedLetter\s*===\s*q\.answer/.test(body);
  })());
test('v4.81.5 Diagnostic: regression guard — no .pickedIdx in diagnostic flow (renamed to pickedLetter)',
  (() => {
    // pickedIdx is still legitimately used by the SR review session — this
    // check scopes the regression to the diagnostic functions specifically.
    const fns = ['_renderDiagnosticQuestion', 'pickDiagnosticOption', '_refreshDiagnosticActions', 'submitDiagnosticAnswer'];
    for (const fn of fns) {
      const body = _fnBody(js, fn);
      if (body && /pickedIdx/.test(body)) return false;
    }
    return true;
  })());
test('v4.81.5 Diagnostic: startDiagnostic filters to MCQ-only questions',
  (() => {
    const body = _fnBody(_diagnosticJs, 'startDiagnostic');
    return body && /_isMcq\b/.test(body);
  })());
test('v4.81.5 Diagnostic: MCQ-filter requires 4 letter-keyed options + single-letter answer',
  (() => {
    const body = _fnBody(_diagnosticJs, 'startDiagnostic');
    return body && /Object\.keys\(q\.options\)\.length\s*===\s*4/.test(body)
      && /'ABCD'\.includes\(q\.answer\)/.test(body);
  })());

// Behavioral fixture — synthetic MCQ question, verify the render code
// produces 4 buttons with correct letters.
// ──────────────────────────────────────────────────────────
// v4.81.6: Pass Plan resilience to non-canonical topic strings
// ──────────────────────────────────────────────────────────
// User report (after taking diagnostic, getting most correct): "i kwow for
// a fact i got most of them correct yet this was the score" — screenshot
// showed 0% pass probability, 420/870 predicted, 0 weak domains. Root
// cause: Haiku returned verbose topic strings like "NETWORKING CONCEPTS
// - OSI MODEL & TCP/IP" that didn't match canonical TOPIC_DOMAINS keys
// (e.g. "Network Models & OSI"), so every answer was silently skipped
// from the score calculation. Fix: _resolveDomainForTopic adds fuzzy
// matching + raw-accuracy fallback when domain coverage drops below 50%.
test('v4.81.6 PassPlan: _resolveDomainForTopic helper defined',
  /function\s+_resolveDomainForTopic\b/.test(js));
test('v4.81.6 PassPlan: _resolveDomainForTopic does substring + keyword fallback',
  (() => {
    const body = _fnBody(js, '_resolveDomainForTopic');
    return body && /toLowerCase\(\)/.test(body) && /keywordMap/.test(body);
  })());
test('v4.81.6 PassPlan: _buildPassPlan tracks rawCorrect + rawTotal alongside domain bucketing',
  (() => {
    const body = _fnBody(js, '_buildPassPlan');
    return body && /rawCorrect/.test(body) && /rawTotal/.test(body);
  })());
test('v4.81.6 PassPlan: _buildPassPlan falls back to raw accuracy when domain coverage <50%',
  (() => {
    const body = _fnBody(js, '_buildPassPlan');
    return body && /domainCoverageOk/.test(body) && />= 0\.5/.test(body);
  })());

// Behavioral fixture — the exact failure mode the user hit. Synthesises
// a session where Haiku returned verbose topics that don't match
// TOPIC_DOMAINS exactly. Pre-fix this would yield 0% accuracy; post-fix
// it should yield the actual raw-accuracy score.
test('v4.81.6 PassPlan: VM fixture — non-canonical topics produce real score (regression for the user-reported bug)',
  (() => {
    try {
      const resolveBody = _fnBody(js, '_resolveDomainForTopic');
      const buildBody = _fnBody(js, '_buildPassPlan');
      if (!resolveBody || !buildBody) return false;
      const vm = require('vm');
      const ctx = {
        DOMAIN_WEIGHTS: { concepts: 0.23, implementation: 0.20, operations: 0.19, security: 0.14, troubleshooting: 0.24 },
        DOMAIN_LABELS: { concepts: 'Concepts', implementation: 'Implementation', operations: 'Operations', security: 'Security', troubleshooting: 'Troubleshooting' },
        // Realistic TOPIC_DOMAINS subset — short canonical keys
        TOPIC_DOMAINS: {
          'Network Models & OSI': 'concepts',
          'OSPF': 'implementation',
          'Network Troubleshooting & Tools': 'troubleshooting',
          'Network Security': 'security',
          'Network Operations': 'operations'
        },
        EXAM_PASS_SCORE: 720,
        _buildWeekPlan: () => [],
        Math, Date, JSON
      };
      vm.createContext(ctx);
      vm.runInContext(resolveBody, ctx);
      vm.runInContext(buildBody, ctx);
      // Build session: 20 questions with VERBOSE topic strings (the actual
      // failure mode), 18 of which are correct.
      const verboseTopics = [
        'NETWORKING CONCEPTS - OSI MODEL & TCP/IP',
        'NETWORKING CONCEPTS - PORTS & PROTOCOLS',
        'NETWORK IMPLEMENTATION - OSPF & ROUTING',
        'NETWORK SECURITY - FIREWALL FUNDAMENTALS',
        'NETWORK TROUBLESHOOTING - LATENCY DIAGNOSIS'
      ];
      const questions = Array.from({ length: 20 }, (_, i) => ({
        topic: verboseTopics[i % verboseTopics.length]
      }));
      const answers = questions.map((_, i) => ({
        correct: i < 18,
        confidence: 'confident',
        answeredAt: 1
      }));
      ctx.session = { questions, answers };
      const plan = vm.runInContext('_buildPassPlan(session)', ctx);
      // 18/20 = 90% raw accuracy → predicted ~ 420 + 90 * 4.275 ≈ 805
      // → way above the 720 pass mark → high probability
      // Pre-fix would have returned predicted=420 / probability ~= 0
      return plan.predicted > 700
        && plan.passProbability > 0.5
        && plan.accPct >= 80;
    } catch (e) { return false; }
  })());
test('v4.81.6 PassPlan: VM fixture — exact-match canonical topics still work (no regression)',
  (() => {
    try {
      const resolveBody = _fnBody(js, '_resolveDomainForTopic');
      const buildBody = _fnBody(js, '_buildPassPlan');
      if (!resolveBody || !buildBody) return false;
      const vm = require('vm');
      const ctx = {
        DOMAIN_WEIGHTS: { concepts: 0.23, implementation: 0.20, operations: 0.19, security: 0.14, troubleshooting: 0.24 },
        DOMAIN_LABELS: { concepts: 'Concepts', implementation: 'Implementation', operations: 'Operations', security: 'Security', troubleshooting: 'Troubleshooting' },
        TOPIC_DOMAINS: { 'A': 'concepts', 'B': 'implementation', 'C': 'operations', 'D': 'security', 'E': 'troubleshooting' },
        EXAM_PASS_SCORE: 720,
        _buildWeekPlan: () => [],
        Math, Date, JSON
      };
      vm.createContext(ctx);
      vm.runInContext(resolveBody, ctx);
      vm.runInContext(buildBody, ctx);
      const questions = Array.from({ length: 20 }, (_, i) => ({ topic: ['A','B','C','D','E'][i % 5] }));
      const answers = questions.map((_, i) => ({ correct: i < 12, confidence: 'confident', answeredAt: 1 }));
      ctx.session = { questions, answers };
      const plan = vm.runInContext('_buildPassPlan(session)', ctx);
      return plan.questionCount === 20
        && typeof plan.passProbability === 'number'
        && plan.passProbability > 0;
    } catch (e) { return false; }
  })());

// ──────────────────────────────────────────────────────────
// v4.81.6: ENV badge relocated bottom-left (was overlapping topbar)
// ──────────────────────────────────────────────────────────
test('v4.81.6 EnvBadge: .env-badge uses bottom-left positioning (not top-right)',
  /\.env-badge\s*\{[^}]*bottom:\s*12px[^}]*left:\s*12px/.test(css));
test('v4.81.6 EnvBadge: regression guard — .env-badge no longer uses top-right positioning',
  !/\.env-badge\s*\{[^}]*\btop:\s*12px[^}]*\bright:\s*12px/.test(css));

// ──────────────────────────────────────────────────────────
// v4.81.7: Retake-cooldown softened + corruption detection
// ──────────────────────────────────────────────────────────
// User report after v4.81.6 ship: "it makes sense to allow me to redo the
// diagnostic now. since it already has logged me as 0% pass probability".
// The 7-day cooldown was a hard block — users with a buggy Pass Plan
// (from v4.81.0-v4.81.5) couldn't retake to verify the fix. Two changes:
// 1. _isCorruptedPassPlan() detects the v4.81.0-v4.81.5 bug signature
//    (accPct=0 yet seededCount<questionCount, or predicted=420 with
//    correctCount>0) — auto-bypasses cooldown entirely
// 2. Cooldown softened from hard block to confirm dialog ("Retake anyway?")
test('v4.81.7 Retake: _isCorruptedPassPlan helper defined',
  /function\s+_isCorruptedPassPlan\b/.test(js));
test('v4.81.7 Retake: corruption detection checks accPct=0 + seededCount mismatch',
  (() => {
    const body = _fnBody(js, '_isCorruptedPassPlan');
    return body && /accPct[\s\S]{0,100}=== 0/.test(body) && /seededCount[\s\S]{0,100}questionCount/.test(body);
  })());
test('v4.81.7 Retake: corruption detection checks predicted=420 + correctCount>0 (secondary)',
  (() => {
    const body = _fnBody(js, '_isCorruptedPassPlan');
    return body && /predicted[\s\S]{0,80}=== 420/.test(body) && /correctCount[\s\S]{0,80}>\s*0/.test(body);
  })());
test('v4.81.7 Retake: retakeDiagnostic checks _isCorruptedPassPlan first',
  (() => {
    const body = _fnBody(js, 'retakeDiagnostic');
    return body && /_isCorruptedPassPlan/.test(body);
  })());
test('v4.81.7 Retake: cooldown is now confirm-based (not hard block)',
  (() => {
    const body = _fnBody(js, 'retakeDiagnostic');
    return body && /confirm\(/.test(body);
  })());
test('v4.81.7 Retake: renderDiagnosticSurface flags corrupted Plan in tile',
  (() => {
    const body = _fnBody(js, 'renderDiagnosticSurface');
    return body && /_isCorruptedPassPlan/.test(body) && /fix bug/i.test(body);
  })());

// Behavioral fixture — given a synthetic corrupted Pass Plan, verify
// _isCorruptedPassPlan returns true. Given a healthy one, false.
// ──────────────────────────────────────────────────────────
// v4.81.8: 3D View defensive observability (Codex external review)
// ──────────────────────────────────────────────────────────
// Codex hit: clicking 3D View after loading Home Network → red toast
// "Could not load 3D View — check network / console". Couldn't reproduce
// locally; Playwright tests pass. Shipped defensive observability instead
// of speculative patch:
//   1. WebGL preflight — fail-fast if browser lacks WebGL
//   2. Phase tracking — error toast names which step failed
//   3. Error log persistence — full stack + state captured to ERROR_LOG
test('v4.81.8 TB3D: regression guard — old generic toast text removed',
  !/'Could not load 3D View — check network \/ console\.'/.test(js));

// ──────────────────────────────────────────────────────────
// v4.81.9: ACL Builder scenario-aware Add Rule defaults (Codex r7 #1)
// ──────────────────────────────────────────────────────────
// Codex r7: pre-fix the Add Rule modal defaulted to `permit any any any
// any` regardless of scenario context — for "Block a Single Host" that's
// the OPPOSITE of the right first move. Fix derives smart defaults from
// scenario.testPackets + scenario.zones (no schema change needed).
test('v4.81.9 ACL: .acl-rm-helper CSS declared',
  /\.acl-rm-helper\s*\{/.test(css));
test('v4.81.9 ACL: .acl-rm-chip CSS declared',
  /\.acl-rm-chip\s*\{/.test(css));
test('v4.81.9 ACL: input-flash animation honors reduced-motion',
  /prefers-reduced-motion[\s\S]{0,200}\.acl-rm-input-flash/.test(css));

// Behavioral fixture — derive hints for "Block a Single Host" pattern
// (mixed deny + permit packets with different srcs) and verify the
// suggested first rule is a SPECIFIC DENY, not the generic permit-any.

// Behavioral fixture — default-deny pattern (permits + implicit deny)
// suggests a specific PERMIT first.

// Behavioral fixture — when rules already exist, NO suggested first rule
// (only chips). The "specific-deny-first" guidance only fires for the
// empty-state.
// ──────────────────────────────────────────────────────────
// v4.81.10: "Start Lesson 1" bug fix + Drill Mission Cards (Codex r8)
// ──────────────────────────────────────────────────────────
// Codex r8: clicking "Start Lesson 1" CTAs on all 5 drill placeholder
// cards silently no-op'd. Root cause: lesson IDs are strings ('binary',
// 'ip_anatomy', 'web', 'protocols', etc.) but the buttons passed the
// number 1. find(l => l.id === id) returned undefined → function exited
// at `if (!lesson) return;`. Fix: id-normalization in all 5 *OpenLesson
// functions tolerates 1 / '1' as "first lesson".
//
// Also adds the "Drill Mission Card" surface (Codex r8 strategic ask)
// to the 4 drills that didn't have one (Subnet had it from v4.78.0).

// vm fixture — simulate the exact Codex-flagged path: pass 1 to
// stOpenLesson against a realistic SUBNET_LESSONS schema. Pre-fix this
// would silently exit; post-fix it should resolve to the first lesson.

// Drill Mission Card structural checks

// Behavioral fixture — picker correctly handles "new user" state
// ──────────────────────────────────────────────────────────
// v4.81.11: Settings polish (Codex r9 — trust + safety layer)
// ──────────────────────────────────────────────────────────
// Codex r9 rated Settings 7.6/10 — utility drawer not trust centre.
// Shipped 4 of the 6 enhancements as a focused polish ship:
//   #2 Import button a11y (real <button>, not a <label> wrapper)
//   #3 Danger confirmations explicit about what gets deleted/replaced
//   #4 Restore "what will change" enumerates data categories
//   #5 Study Setup Health card at top — at-a-glance status
// Deferred: #1 BYOK (saas-gated) + #6 Control Centre reorg

// #2 — Import button a11y
test('v4.81.11 Settings: Import is now a real <button>, not a <label> wrapper',
  /<button[^>]+aria-label="Import data from JSON file"[^>]*>[^<]*Import Data/.test(html));
test('v4.81.11 Settings: hidden #import-file-input input present',
  /<input[^>]*id="import-file-input"/.test(html) && /<input[^>]*type="file"[^>]*id="import-file-input"|<input[^>]*id="import-file-input"[^>]*type="file"/.test(html));
test('v4.81.11 Settings: Import button triggers hidden input via .click()',
  /onclick="document\.getElementById\('import-file-input'\)\.click\(\)"/.test(html));
test('v4.81.11 Settings: regression — Import is no longer a <label> wrapping <input type="file">',
  !/<label[^>]+class="btn btn-ghost"[^>]*>[\s\S]{0,200}<input type="file"[\s\S]{0,200}importData/.test(html));

// #3 — Stronger clearWrongBank confirmation
test('v4.81.11 Settings: clearWrongBank confirm enumerates what gets deleted',
  (() => {
    const body = _fnBody(js, 'clearWrongBank');
    return body
      && /Drill Mistakes/.test(body)
      && /Spaced Repetition queue/.test(body)
      && /Automatic backups/.test(body);
  })());

// #4 — Restore "what will change" copy
test('v4.81.11 Settings: restoreFromAutoBackup confirm enumerates data categories',
  (() => {
    const body = _fnBody(js, 'restoreFromAutoBackup');
    return body
      && /Quiz history/.test(body)
      && /Wrong bank/.test(body)
      && /drill mastery/i.test(body)
      && /pre-restore/i.test(body);
  })());

// #5 — Study Setup Health card
test('v4.81.11 Settings: renderSettingsHealthCard function defined',
  /function\s+renderSettingsHealthCard\b/.test(js));
test('v4.81.11 Settings: renderSettingsPage calls renderSettingsHealthCard',
  (() => {
    const body = _fnBody(js, 'renderSettingsPage');
    return body && /renderSettingsHealthCard/.test(body);
  })());
test('v4.81.11 Settings: #settings-health-card container in markup',
  /id="settings-health-card"/.test(html) && /id="settings-health-grid"/.test(html));
// v4.99.6: Local safety net tile retired (cloud sync is the primary recovery path).
// Health card now has 4 rows: cloud-sync / exam / goal / today.
test('v4.99.6 Settings: health card surfaces 4 rows (cloud-sync/exam/goal/today)',
  (() => {
    const body = _fnBody(js, 'renderSettingsHealthCard');
    return body
      && /Cloud sync/.test(body)
      && /Exam date/.test(body)
      && /Daily goal/.test(body)
      && /Today/.test(body)
      && !/label: 'Local safety net'/.test(body);
  })());
test('v4.81.11 Settings: .settings-health-row CSS declared',
  /\.settings-health-row\s*\{/.test(css));
test('v4.81.11 Settings: 3 status tiers (ok/mid/warn) styled',
  /\.settings-health-ok\s/.test(css)
  && /\.settings-health-warn\s/.test(css)
  && /\.settings-health-mid\s/.test(css));

// vm fixture — health card surfaces "Not connected" when no API key,
// "Connected · sk-ant-..." when key present
// ──────────────────────────────────────────────────────────
// v4.81.12: Settings Control Centre 4-section reorg (Codex r9 #6 / #266)
// ──────────────────────────────────────────────────────────
// Settings page restructured into 4 deliberate groups: Study Setup /
// AI Coach / Data & Backups / Danger Zone. Each group has a section
// header (eyebrow + display heading + sub) for trust hierarchy.
// Existing IDs + handlers all preserved; only wrapping structure changed.
test('v4.81.12 Settings: 4 settings-group containers present',
  /data-group="study-setup"/.test(html)
  && /data-group="ai-coach"/.test(html)
  && /data-group="data-backups"/.test(html)
  && /data-group="danger-zone"/.test(html));
// v4.99.3: § 02 AI Coach group retired (BYOK gone), remaining groups renumbered to §01/§02/§03.
test('v4.81.12 Settings: 3 visible §-numbered eyebrows after BYOK retirement (§01/§02/§03)',
  /class="settings-group-num">&sect; 01/.test(html)
  && /class="settings-group-num">&sect; 02/.test(html)
  && /class="settings-group-num">&sect; 03/.test(html));
test('v4.81.12 Settings: Danger Zone has settings-group-danger class',
  /class="settings-group settings-group-danger"/.test(html));
test('v4.81.12 Settings: Wrong Answers Bank section has settings-section-danger class',
  /class="card settings-section settings-section-danger"/.test(html));
test('v4.81.12 Settings: Health card lives in §01 Study Setup',
  /data-group="study-setup"[\s\S]{0,2000}id="settings-health-card"/.test(html));
test('v4.81.12 Settings: API key lives in §02 AI Coach',
  /data-group="ai-coach"[\s\S]{0,800}id="api-key"/.test(html));
test('v4.81.12 Settings: Export+Import live in §03 Data & Backups',
  /data-group="data-backups"[\s\S]{0,2000}exportData\(\)/.test(html)
  && /data-group="data-backups"[\s\S]{0,2000}id="import-file-input"/.test(html));
test('v4.81.12 Settings: Auto-backups list lives in §03 Data & Backups',
  /data-group="data-backups"[\s\S]{0,3000}id="autobackup-list"/.test(html));
test('v4.81.12 Settings: Wrong Answers Bank lives in §04 Danger Zone',
  /data-group="danger-zone"[\s\S]{0,2000}id="wrong-bank-clear"/.test(html));
test('v4.81.12 Settings: .settings-group CSS declared',
  /\.settings-group\s*\{/.test(css));
test('v4.81.12 Settings: .settings-group-danger has red tint',
  /\.settings-group-danger\s*\{[^}]*background:\s*rgba\(248,113,113/.test(css));
test('v4.81.12 Settings: mobile breakpoint exists for settings-group',
  /max-width:\s*540px[\s\S]{0,500}\.settings-group\b/.test(css));

// ──────────────────────────────────────────────────────────
// v4.81.13: Exam → readiness/progress/analytics integration (user request)
// ──────────────────────────────────────────────────────────
// User report: "i did my first exam simulator on the app and i got 780.
// ideally this should reflect somehow on the exam readiness score...
// rather than just a standalone entity and it should reflect somehow in
// the progress and analytics part for what topics i got right/wrong and
// their domains."
//
// Pre-fix: submitExam saved ONE summary row tagged `topic: EXAM_TOPIC`.
// getReadinessScore explicitly filters EXAM_TOPIC out → exam contributed
// zero signal to readiness/progress/analytics/weak-spots/what-if.
// Wrong-bank + SR seeding worked but headline metrics ignored the exam.
//
// Fix: per-topic history split (A) writes one row per topic from log[]
// after the summary, tagged `mode: 'exam'` (gets 1.3× boost) and
// `via: 'exam-split'` (traceable). Plus domain breakdown card on the
// exam-results page (C) for immediate post-exam visibility.

test('v4.81.13 Exam: _saveExamPerTopicSplit helper defined',
  /function\s+_saveExamPerTopicSplit\b/.test(js));
test('v4.81.13 Exam: _buildExamDomainBreakdown helper defined',
  /function\s+_buildExamDomainBreakdown\b/.test(js));
test('v4.81.13 Exam: renderExamDomainBreakdown function defined',
  /function\s+renderExamDomainBreakdown\b/.test(js));
test('v4.81.13 Exam: submitExam wires _saveExamPerTopicSplit after summary save',
  (() => {
    const body = _fnBody(js, 'submitExam');
    return body && /_saveExamPerTopicSplit\(log,/.test(body);
  })());
test('v4.81.13 Exam: submitExam wires renderExamDomainBreakdown',
  (() => {
    const body = _fnBody(js, 'submitExam');
    return body && /renderExamDomainBreakdown\(log\)/.test(body);
  })());
test('v4.81.13 Exam: per-topic split tags rows with via:"exam-split" marker',
  (() => {
    const body = _fnBody(js, '_saveExamPerTopicSplit');
    return body && /via:\s*['"]exam-split['"]/.test(body);
  })());
test('v4.81.13 Exam: per-topic split uses mode:"exam" so 1.3× boost applies',
  (() => {
    const body = _fnBody(js, '_saveExamPerTopicSplit');
    return body && /mode:\s*['"]exam['"]/.test(body);
  })());
test('v4.81.13 Exam: per-topic split skips MIXED_TOPIC + EXAM_TOPIC entries (defensive)',
  (() => {
    const body = _fnBody(js, '_saveExamPerTopicSplit');
    return body && /MIXED_TOPIC/.test(body) && /EXAM_TOPIC/.test(body);
  })());
test('v4.81.13 Exam: domain breakdown uses tier system anchored to 55/70/80 (v4.85.11: lowered from 85)',
  (() => {
    const body = _fnBody(js, '_buildExamDomainBreakdown');
    return body && />=\s*80/.test(body) && />=\s*70/.test(body) && />=\s*55/.test(body);
  })());
test('v4.81.13 Exam: #exam-domain-breakdown card present in HTML',
  /id="exam-domain-breakdown"/.test(html) && /id="exam-domain-breakdown-grid"/.test(html));
test('v4.81.13 Exam: .exam-domain-breakdown CSS declared',
  /\.exam-domain-breakdown\s*\{/.test(css));
test('v4.81.13 Exam: tier classes styled (mastered/proficient/developing/novice/empty)',
  /\.exam-domain-mastered\s/.test(css)
  && /\.exam-domain-proficient\s/.test(css)
  && /\.exam-domain-developing\s/.test(css)
  && /\.exam-domain-novice\s/.test(css)
  && /\.exam-domain-empty\s/.test(css));

// Behavioral fixture — vm-sandbox _saveExamPerTopicSplit with a synthetic
// log of 5 questions across 3 topics. Pre-fix this was not a function;
// post-fix it should call saveToHistory 3 times with correct shapes.
test('v4.81.13 Exam: vm fixture — per-topic split writes one row per unique topic',
  (() => {
    try {
      const body = _fnBody(js, '_saveExamPerTopicSplit');
      if (!body) return false;
      const vm = require('vm');
      const writes = [];
      const ctx = {
        MIXED_TOPIC: 'Mixed — All Topics',
        EXAM_TOPIC: 'Exam Simulation',
        saveToHistory: (entry) => { writes.push(entry); },
        Date, Math, JSON
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const log = [
        { q: { topic: 'OSPF' }, isRight: true,  isSkipped: false },
        { q: { topic: 'OSPF' }, isRight: true,  isSkipped: false },
        { q: { topic: 'OSPF' }, isRight: false, isSkipped: false },
        { q: { topic: 'BGP' },  isRight: true,  isSkipped: false },
        { q: { topic: 'STP' },  isRight: false, isSkipped: false }
      ];
      ctx.log = log;
      const written = vm.runInContext('_saveExamPerTopicSplit(log, false)', ctx);
      // Expect 3 writes (one per unique topic), all with mode='exam' + via='exam-split'
      return written === 3
        && writes.length === 3
        && writes.every(w => w.mode === 'exam' && w.via === 'exam-split')
        && writes.find(w => w.topic === 'OSPF' && w.score === 2 && w.total === 3)
        && writes.find(w => w.topic === 'BGP' && w.score === 1 && w.total === 1)
        && writes.find(w => w.topic === 'STP' && w.score === 0 && w.total === 1);
    } catch (e) { return false; }
  })());

test('v4.81.13 Exam: vm fixture — per-topic split skips EXAM_TOPIC + MIXED_TOPIC entries',
  (() => {
    try {
      const body = _fnBody(js, '_saveExamPerTopicSplit');
      if (!body) return false;
      const vm = require('vm');
      const writes = [];
      const ctx = {
        MIXED_TOPIC: 'Mixed',
        EXAM_TOPIC: 'Exam',
        saveToHistory: (entry) => { writes.push(entry); },
        Date, Math, JSON
      };
      vm.createContext(ctx);
      vm.runInContext(body, ctx);
      const log = [
        { q: { topic: 'OSPF' }, isRight: true, isSkipped: false },
        { q: { topic: 'Mixed' }, isRight: true, isSkipped: false },  // skipped
        { q: { topic: 'Exam' }, isRight: false, isSkipped: false },  // skipped
        { q: { topic: '' }, isRight: true, isSkipped: false }        // skipped (empty)
      ];
      ctx.log = log;
      const written = vm.runInContext('_saveExamPerTopicSplit(log, false)', ctx);
      return written === 1 && writes.length === 1 && writes[0].topic === 'OSPF';
    } catch (e) { return false; }
  })());

