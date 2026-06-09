// @ts-check
//
// CertAnvil iOS E2E — fidelity pixel-diff harness (Phase 5)
// ----------------------------------------------------------------------------
// Guards that the live SPA shell keeps rendering each screen 1:1. Because the
// shell loads each *untouched* mockup in an iframe and strips only the gallery
// bezel (D8), a golden baseline of the live `.screen` IS the mockup contract:
// any future drift (a broken STRIP_CSS rule, an errant applyProState mutation,
// a mockup edit that breaks layout) fails the diff. A diff = a release blocker.
//
// Captures every registered screen × {light, dark}, plus the Pro variants of
// the tier-aware screens. Animations are frozen (reducedMotion + Playwright's
// animations:'disabled') and <canvas> elements are masked (constellation / ECG
// / confetti draw via requestAnimationFrame and can't be frozen by CSS).
//
// Run:    npm run test:fidelity
// Reseed: npm run test:fidelity -- --update-snapshots   (after an INTENDED change)
//
// NOTE: golden-baseline mode (not literal mockup-vs-live two-buffer diff) was
// chosen to avoid adding pixelmatch/pngjs deps; the baselines are seeded from a
// build already verified faithful to the mockups. To switch to true two-buffer
// parity, add pixelmatch + pngjs and capture the standalone mockup `.screen`
// as the expected image.

const { test, expect } = require('@playwright/test');

const SHELL = '/mockups/cert-ios-app.html';

// Mirror of SCREENS in mockups/e2e/shell.js — keep in sync if screens change.
const ALL_SCREENS = [
  'native-welcome', 'rollout', 'signup-signin', 'magic-link', 'welcome-back',
  'plan-picker', 'free-cert-picker', 'free-home-day0', 'first-run-diag',
  'notifications', 'home', 'hub', 'quiz', 'custom-quiz', 'exam', 'results',
  'exam-results', 'progress', 'analytics', 'report', 'cross-cert', 'settings',
  'log-result', 'review', 'review-answers', 'daily-limit', 'free-capped-home',
  'upgrade-sheet', 'pro-iap', 'pro-welcome', 'my-certs-pro', 'restore-purchase',
  'manage-sub', 'account-deletion', 'pro-expired', 'error-states', 'loading-states',
];

// Excluded — NOT phone `.screen` mockups, so there's nothing to pixel-diff:
//   rollout = onboarding-rollout-flow.html is a flow-diagram explainer ("How a
//   user lands"), a conceptual router with no inner `.screen` element.
const NO_SCREEN = ['rollout'];
const SCREENS = ALL_SCREENS.filter((id) => !NO_SCREEN.includes(id));

// Screens whose render legitimately changes for Pro — snapshot both states.
const PRO_VARIANTS = ['home', 'hub', 'settings', 'my-certs-pro'];

const THEMES = /** @type {const} */ (['light', 'dark']);
const DEMO_KEYS = ['e2e_daily15', 'e2e_overcap', 'e2e_daily_goal', 'e2e_review_size', 'e2e_topup'];

// The active screen's `.screen` element, inside the top iframe of the stack.
function activeScreen(page) {
  return page.frameLocator('#e2e-scaler .e2e-view:last-child iframe').locator('.screen');
}
function activeCanvases(page) {
  return page.frameLocator('#e2e-scaler .e2e-view:last-child iframe').locator('canvas');
}

/** Drive the shell to `id` in the requested theme / tier, then settle for a clean shot. */
async function showScreen(page, id, theme, pro) {
  // set theme + tier before navigating (the shell reads these on screen load)
  await page.evaluate(({ theme, pro, DEMO_KEYS }) => {
    try {
      localStorage.setItem('ca-theme', theme);
      DEMO_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* ignore */ }
    window.E2E.setPro(!!pro);
  }, { theme, pro, DEMO_KEYS });

  // Drive resetTo until it sticks. push() no-ops while a prior transition is
  // animating (and resetTo empties the stack first), so a too-early call leaves
  // the stack empty — re-issue every poll until the target iframe is mounted.
  await page.waitForFunction((wantId) => {
    const ifr = document.querySelectorAll('#e2e-scaler .e2e-view:last-child iframe');
    const top = ifr[ifr.length - 1];
    if (top && top.getAttribute('title') === wantId) return true;
    try { window.E2E.resetTo(wantId); } catch (e) { /* ignore */ }
    return false;
  }, id, { timeout: 15000, polling: 250 });

  const screen = activeScreen(page);
  await expect(screen).toBeVisible({ timeout: 10000 });

  // inside the iframe: wait for web fonts, then hard-freeze CSS motion
  await screen.evaluate(async (el) => {
    const doc = el.ownerDocument;
    const st = doc.createElement('style');
    st.textContent =
      '*,*::before,*::after{animation:none!important;transition:none!important;' +
      'animation-duration:0s!important;animation-delay:0s!important;caret-color:transparent!important}';
    (doc.head || doc.documentElement).appendChild(st);
    try { if (doc.fonts && doc.fonts.ready) await doc.fonts.ready; } catch (e) { /* ignore */ }
  });

  // hide the dev HUD so it never overlays the captured .screen region
  await page.evaluate(() => { const h = document.getElementById('hud'); if (h) h.style.display = 'none'; });

  // let the push transition finish + a paint settle
  await page.waitForTimeout(450);
}

async function assertFidelity(page, name) {
  await expect(activeScreen(page)).toHaveScreenshot(`${name}.png`, {
    animations: 'disabled',
    mask: [activeCanvases(page)],            // canvas draws via rAF — can't be frozen
    maxDiffPixelRatio: 0.01,                  // absorb sub-pixel AA, catch real drift
  });
}

test.describe('cert-ios fidelity — every screen × both themes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHELL);
    // wait for boot's first screen so the push transition's `animating` lock has
    // cleared before showScreen() drives resetTo (see showScreen's retry loop).
    await expect(activeScreen(page)).toBeVisible({ timeout: 10000 });
  });

  for (const theme of THEMES) {
    for (const id of SCREENS) {
      test(`${id} · ${theme}`, async ({ page }) => {
        await showScreen(page, id, theme, false);
        await assertFidelity(page, `${id}-${theme}`);
      });
    }
    for (const id of PRO_VARIANTS) {
      test(`${id} · ${theme} · pro`, async ({ page }) => {
        await showScreen(page, id, theme, true);
        await assertFidelity(page, `${id}-pro-${theme}`);
      });
    }
  }
});
