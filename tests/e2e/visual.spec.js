// @ts-check
const { test, expect } = require('@playwright/test');

// ══════════════════════════════════════════════════════════════════════════
// Visual regression — screenshot baselines for key stable pages.
//
// LOCAL ONLY. Runs under the `visual` Playwright project (chromium-based,
// fixed 1280x900 viewport). NOT part of the CI gating path — CI runs only
// `--project=chromium` and `--project=landing`; see playwright.config.js and
// docs/conventions/visual-regression.md for why (macOS-rendered baselines
// would mismatch on Linux CI runners).
//
// Determinism strategy (see docs/conventions/visual-regression.md for the
// full rationale):
//   1. `page.emulateMedia({ reducedMotion: 'reduce' })` — the app already
//      branches on `prefers-reduced-motion` throughout (readiness ring/count-up,
//      sidebar streak count-up, analytics reveal + count-up tiles, home bento
//      `.reveal` entrance). Under `reduce`, every one of those either sets its
//      final value synchronously or skips the animation class entirely, so the
//      screenshot never races a CSS transition, a WAAPI `.animate()` call, or a
//      requestAnimationFrame count-up loop.
//   2. `animations: 'disabled'` on the screenshot call — belt-and-suspenders:
//      fast-forwards any remaining CSS animation/transition or WAAPI animation
//      (e.g. the page-enter/page-exit transition, or the readiness-card
//      confetti/ring draw that still fires under reduced motion when a seeded
//      score clears the pass line) to its end state before capture.
//   3. Fresh/empty localStorage per test (`localStorage.clear()` in an
//      addInitScript, localhost-only — see CLAUDE.md's "never write user-state
//      localStorage" rule, which is scoped to prod/*.vercel.app, not localhost)
//      plus the same signed-in/Pro-tier stub app.spec.js uses, so every run
//      starts from the same known state instead of accumulating drift.
//   4. An injected stabilization stylesheet (`display:none` — see
//      hideDynamicChrome() below) for chrome that is inherently live/time-based
//      and can't be neutralized by seeding or reduced motion: the topbar clock
//      (#topbar-time), the two version badges (.sb-brand-version in the
//      sidebar + #topbar-version-pill in the topbar — both bump on every
//      ship), and on the home page the days-to-exam/streak chips + sidebar
//      streak card. NOTE: we use a stylesheet instead of toHaveScreenshot's
//      built-in `mask` option — `mask` was tried first but produces silently
//      no-op (unmasked) output for small/nested elements on pages taller than
//      the viewport (fullPage screenshots capture by scrolling + stitching
//      tiles, and mask is a post-hoc pixel overlay keyed to a single tile's
//      coordinates), confirmed empirically while building this suite.
//      `display:none` bakes the hidden state into the actual DOM before any
//      tile is captured, so it has no such issue — and unlike
//      `visibility:hidden`, it can't leave a content-dependent-width
//      invisible box around to perturb layout (e.g. "3:53pm" vs "10:53pm"
//      rendering at different widths and occasionally tipping a
//      tightly-packed row into wrapping, which was observed to make total
//      page height flicker by ~2px between otherwise-identical runs when
//      this used visibility:hidden instead).
//   5. hideDynamicChrome() can't run before `page.goto` (the elements don't
//      exist yet) — each test calls it right after the target page/section
//      is confirmed attached, and right before the screenshot.
// ══════════════════════════════════════════════════════════════════════════

// Chrome that is global to every page and inherently non-deterministic
// (wall-clock time, app version badges). Always hidden.
const GLOBAL_DYNAMIC_SELECTORS = [
  '#topbar-time',           // live clock (day · h:mm am/pm)
  '.sb-brand-version',      // sidebar version badge, bumps every ship
  '#topbar-version-pill',   // topbar version pill (v4.89.7), same reason
];

// Extra selectors for the home page only — days-to-exam / streak chips and
// the sidebar streak card all read live localStorage-derived state that,
// even seeded to a fixed fixture, we don't need pixel-perfect (they're
// covered by app.spec.js's own assertions) and would otherwise force every
// test to hand-craft a streak/exam-date fixture just to stay deterministic.
const HOME_DYNAMIC_SELECTORS = ['#cb-days', '#cb-streak', '.sb-streak'];

async function hideDynamicChrome(page, extraSelectors = []) {
  const selectors = [...GLOBAL_DYNAMIC_SELECTORS, ...extraSelectors];
  await page.addStyleTag({ content: selectors.map((s) => `${s}{display:none !important;}`).join('\n') });
}

// Matches app.spec.js's beforeEach fixture (see its v4.99.32 comment): stub
// signed-in + Pro tier so Pro-gated pages (drills, sim lab, etc.) render their
// full content instead of the upgrade-gate modal, and stub the body classes
// auth-state.js would otherwise set asynchronously after a real Supabase
// round-trip. Also clears localStorage first so every visual test starts from
// the same empty-state baseline (localhost only — safe per CLAUDE.md).
async function seedFreshProState(page) {
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch (_) {}
    Object.defineProperty(window, '_certanvilSignedIn', {
      value: true, writable: false, configurable: false
    });
    window._quotaState = { tier: 'pro', daily_limit: -1 };
    window.addEventListener('DOMContentLoaded', () => {
      try { document.body && document.body.classList.add('is-pro-tier', 'is-state-resolved'); } catch (_) {}
    });
  });
}

test.beforeEach(async ({ page }) => {
  // Freeze CSS transitions/animations + the app's own JS count-ups (they all
  // branch on this media feature — see file header). Must be set before goto.
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

// `fullPage: true` — Playwright captures by scrolling + stitching tiles and
// handles its own font/layout settling internally. An earlier version of
// this suite instead resized the viewport to the page's measured content
// height and took a plain (non-fullPage) screenshot, to work around a
// mask-during-stitch bug — but once masking moved to hideDynamicChrome()
// (a real DOM change, not a post-hoc overlay — see file header point 4),
// that workaround no longer had a bug to work around, and it turned out to
// be a *source* of flakiness itself: manually reading
// `document.documentElement.scrollHeight` and resizing to match raced
// Chromium's own layout/font settling independently of Playwright's
// screenshot pipeline, producing ±1-2px height mismatches between
// otherwise-identical runs (confirmed empirically — removing it and using
// plain `fullPage: true` fixed the flakiness). Kept simple on purpose.
const SCREENSHOT_OPTS = { fullPage: true, animations: 'disabled', maxDiffPixelRatio: 0.02 };
// Locator-level screenshots (#app-sidebar / #app-topbar below) don't take a
// `fullPage` option — they're already scoped to one element.
const ELEMENT_SCREENSHOT_OPTS = { animations: 'disabled', maxDiffPixelRatio: 0.02 };

test.describe('Setup / Home', () => {
  test('home bento renders consistently (fresh state)', async ({ page }) => {
    await seedFreshProState(page);
    await page.goto('/');

    await expect(page.locator('#page-setup')).toHaveClass(/active/);
    await expect(page.locator('#page-setup .cmd-bar')).toBeVisible();
    await expect(page.locator('#cb-cert')).toBeVisible();
    // Readiness card starts in its "no quiz yet" placeholder state (deterministic
    // "—" — see renderReadinessCardV2's history.length===0 branch in app.js),
    // so there's no count-up/confetti/ring-draw race to wait out.
    await expect(page.locator('#rc-v2-num')).toHaveText('—');

    await hideDynamicChrome(page, HOME_DYNAMIC_SELECTORS);
    await expect(page).toHaveScreenshot('setup-home.png', SCREENSHOT_OPTS);
  });

  // Scoped region shots for the persistent app chrome (sidebar + topbar),
  // captured on the setup page since that chrome is identical across pages.
  test('sidebar chrome renders consistently', async ({ page }) => {
    await seedFreshProState(page);
    await page.goto('/');
    await expect(page.locator('#app-sidebar')).toBeVisible();
    await hideDynamicChrome(page, HOME_DYNAMIC_SELECTORS);
    await expect(page.locator('#app-sidebar')).toHaveScreenshot('chrome-sidebar.png', ELEMENT_SCREENSHOT_OPTS);
  });

  test('topbar chrome renders consistently', async ({ page }) => {
    await seedFreshProState(page);
    await page.goto('/');
    await expect(page.locator('#app-topbar')).toBeVisible();
    await hideDynamicChrome(page);
    await expect(page.locator('#app-topbar')).toHaveScreenshot('chrome-topbar.png', ELEMENT_SCREENSHOT_OPTS);
  });
});

test.describe('Drills launcher', () => {
  test('drills page renders consistently (Pro tier, seeded stats)', async ({ page }) => {
    await seedFreshProState(page);
    await page.addInitScript(() => {
      try {
        localStorage.setItem('nplus_dev_cert', 'netplus');
        // Seed per-cert drill stats + a milestone so the "earned" tiles render
        // instead of the all-empty starter state (matches app.spec.js's Task 8
        // Analytics-visibility fixture, reused here for the same reason).
        localStorage.setItem('nplus_drill_stats', JSON.stringify({
          netplus: { simlab: { done: 18, perfect: 1 }, gauntlet: { done: 6 } },
        }));
        localStorage.setItem('nplus_milestones', JSON.stringify({
          netplus: { simlab_first: '2026-01-01T00:00:00.000Z' },
        }));
      } catch (_) {}
    });
    await page.goto('/');

    // Desktop viewport hides the mobile lift-tabbar entirely (display:none)
    // and the drills entry isn't in the desktop sidebar (MVP-QUIZ-ONLY removed
    // the drill sidebar section — see APP_SIDEBAR_DRILLS in app.js) — currently
    // Drills is a mobile-tabbar-only surface, reached via #lift-tabbar. So this
    // one test runs at a mobile viewport throughout (not the project's default
    // 1280x900) to match how the page is actually reached. Calling
    // window.showPage('drills') directly (the sim-lab.spec.js pattern) swaps
    // the page but skips content rendering — lift-shell.js only dispatches to
    // liftRenderDrills() from its own tab-click handler (navTo()), not from
    // showPage() itself, and that renderer isn't exposed on window — so the
    // real tab must actually be clicked. (Resizing back to desktop afterwards
    // was tried and tested: dg-system.css's mobile-only lift styling doesn't
    // fully revert on resize, leaving the cards unstyled — confirmed empirically.)
    await page.setViewportSize({ width: 430, height: 844 });
    const drillsTab = page.locator('#lift-tabbar .lift-tab[data-page="drills"]');
    await drillsTab.click();
    await expect(page.locator('#page-drills')).toHaveClass(/active/);
    await expect(page.locator('#drills-domain-list .drills-domain').first()).toBeVisible();

    await hideDynamicChrome(page);
    await expect(page).toHaveScreenshot('drills-launcher.png', SCREENSHOT_OPTS);
  });
});

test.describe('Progress', () => {
  test('progress page renders consistently (seeded topic history)', async ({ page }) => {
    await seedFreshProState(page);
    await page.addInitScript(() => {
      try {
        localStorage.setItem('nplus_dev_cert', 'netplus');
        // Relative to Date.now() (not a fixed calendar date) so the "N days/
        // months ago" labels the app derives from this timestamp stay the
        // same on every run, today or a year from now — a fixed ISO string
        // would silently drift by a day every 24h and eventually flip units
        // (e.g. "6 months ago" becoming "7 months ago"), breaking the
        // "passes twice in a row, indefinitely" contract for this suite.
        const now = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        localStorage.setItem('nplus_history', JSON.stringify([
          { topic: 'TCP/IP Basics', score: 8, total: 10, pct: 80, date: now, mode: 'quiz', difficulty: 'Exam Level' },
          { topic: 'Subnetting', score: 4, total: 10, pct: 40, date: now, mode: 'quiz', difficulty: 'Exam Level' },
          { topic: 'Cabling & Connectors', score: 9, total: 10, pct: 90, date: now, mode: 'quiz', difficulty: 'Exam Level' },
        ]));
      } catch (_) {}
    });
    await page.goto('/');

    const sidebarItem = page.locator('.sb-item[data-sb-page="progress"]');
    await expect(sidebarItem).toBeVisible();
    await sidebarItem.click();
    await expect(page.locator('#page-progress')).toHaveClass(/active/);
    await expect(page.locator('#progress-topic-grid')).toBeVisible();

    await hideDynamicChrome(page);
    await expect(page).toHaveScreenshot('progress.png', SCREENSHOT_OPTS);
  });
});

test.describe('Analytics', () => {
  test('analytics page renders consistently (seeded history, drills group revealed)', async ({ page }) => {
    await seedFreshProState(page);
    // Same fixture app.spec.js's "Analytics Drills group renders VISIBLE" test
    // uses — proven to drive the live (non-empty-state) analytics render path
    // and populate the reveal-gated drills group.
    await page.addInitScript(() => {
      try {
        localStorage.setItem('nplus_dev_cert', 'netplus');
        localStorage.setItem('nplus_drill_stats', JSON.stringify({
          netplus: { simlab: { done: 18, perfect: 1 }, gauntlet: { done: 6 } },
        }));
        // Fixed calendar dates (not relative-to-now, unlike the Progress
        // test): this page renders them as absolute "15 jan" / "EARNED JAN 1"
        // strings rather than "N days ago", so a fixed date is what stays
        // pixel-stable run over run — a relative offset would instead make
        // the rendered date text itself drift daily. (The one relative-time
        // figure on this page, the recency-decay %, is already floored at 0%
        // with a date this old, so it can't drift further either.)
        localStorage.setItem('nplus_milestones', JSON.stringify({
          netplus: { simlab_first: '2026-01-01T00:00:00.000Z' },
        }));
        localStorage.setItem('nplus_history', JSON.stringify([{
          topic: 'TCP/IP Basics', score: 8, total: 10, pct: 80,
          date: '2026-01-15T12:00:00.000Z', mode: 'quiz', difficulty: 'Exam Level',
        }]));
      } catch (_) {}
    });
    await page.goto('/');

    const sidebarItem = page.locator('.sb-item[data-sb-page="analytics"]');
    await expect(sidebarItem).toBeVisible();
    await sidebarItem.click();
    await expect(page.locator('#page-analytics')).toHaveClass(/active/);

    // _anaBtWire()/the drills-group wiring both check prefers-reduced-motion
    // and, when set, mark every reveal-gated tile/row `.visible` synchronously
    // (no IntersectionObserver/timeout wait needed) — see app.js. Still assert
    // the group is attached + populated before the screenshot as a guard.
    const drillsSection = page.locator('#ana-ms-drills-section');
    await expect(drillsSection).toBeAttached();
    await expect(page.locator('#ana-ms-drills-section .dg-drill').first()).toBeVisible();

    await hideDynamicChrome(page);
    await expect(page).toHaveScreenshot('analytics.png', SCREENSHOT_OPTS);
  });
});

test.describe('Settings', () => {
  test('settings page renders consistently (fresh state)', async ({ page }) => {
    await seedFreshProState(page);
    await page.goto('/');

    const sidebarItem = page.locator('.sb-item[data-sb-page="settings"]');
    await expect(sidebarItem).toBeVisible();
    await sidebarItem.click();
    await expect(page.locator('#page-settings')).toHaveClass(/active/);
    await expect(page.locator('#passplan-section')).toBeVisible();

    // #autobackup-list: _takeAutoBackup() (app.js) fires an idempotent
    // once-per-day snapshot on every page load and renderAutoBackupList()
    // shows its real capture date + wall-clock timestamp ("captured
    // 7/17/2026, 3:43:10 PM") — inherently today/now, not seedable.
    await hideDynamicChrome(page, ['#autobackup-list']);
    await expect(page).toHaveScreenshot('settings.png', SCREENSHOT_OPTS);
  });
});

test.describe('Sim Lab entry', () => {
  test('sim lab entry screen renders consistently', async ({ page }) => {
    await seedFreshProState(page);
    await page.addInitScript(() => {
      try { localStorage.setItem('nplus_dev_cert', 'netplus'); } catch (_) {}
    });
    await page.goto('/');

    // Same lazy-load + open pattern the app itself uses from the Home →
    // Practice section (see startSimLabHome() in app.js): it lazy-loads
    // features/sim-lab*.js on first use, then opens the entry screen.
    await page.waitForFunction(() => typeof window.startSimLabHome === 'function');
    await page.evaluate(() => window.startSimLabHome());
    await expect(page.locator('#page-sim-lab-entry')).toHaveClass(/active/, { timeout: 10000 });
    await expect(page.locator('#sle-start')).toBeVisible();

    await hideDynamicChrome(page);
    await expect(page).toHaveScreenshot('sim-lab-entry.png', SCREENSHOT_OPTS);
  });
});
