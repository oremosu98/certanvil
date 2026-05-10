// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3131',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block', // Prevent SW caching interference in tests
  },
  projects: [
    // Chromium is the GATING browser. CI runs `--project=chromium` only.
    // Tests must pass here before any deploy.
    { name: 'chromium', use: { browserName: 'chromium' } },

    // v4.99.29 (iOS Plan Phase 3) — WebKit + Mobile Safari projects.
    // These run iOS Safari behavior locally (~95% match — Playwright's
    // WebKit is the same engine Safari uses). Not yet in CI's gating
    // path because (a) the Chromium suite has pre-existing failing tests
    // that need triage first, and (b) WebKit/Mobile Safari surface
    // additional iOS-specific failures that we want to track separately
    // before requiring them.
    //
    // Run locally:
    //   npm run test:webkit          → desktop Safari simulation
    //   npm run test:mobile-safari   → iPhone 14 simulation
    //   npm run test:e2e             → all 3 projects in parallel
    //
    // Once stable, promote to CI by removing the --project=chromium
    // filter in .github/workflows/ci.yml. See IOS_TESTING.md for the
    // full recipe + iPhone-via-USB Develop-menu setup.
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npx serve . -l 3131 -s',
    port: 3131,
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
