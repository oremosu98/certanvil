// Lift C (v8.194.0): first run on phones, against the June E2E "C ›" states (june-e2e @ ee053395).
// This file opts out of the config-wide day-0 skip seed, so every boot here is a brand-new user.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

test.use({ storageState: { cookies: [], origins: [] } });

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };
const FAKE = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'fake-supabase.js'), 'utf8');

// opts: {signed, seed: {key: value}, query}
async function boot(page, viewport, opts) {
  opts = opts || {};
  await page.setViewportSize(viewport);
  if (opts.signed) {
    const fake = JSON.stringify(Object.assign({ role: 'user' }, opts.fake || {}));
    await page.route('**/lib/supabase.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB=' + fake + ';' + FAKE }));
  }
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try {
      localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1'); localStorage.setItem('ca_tour_seen', '1');
      Object.keys(seed || {}).forEach((k) => localStorage.setItem(k, seed[k]));
    } catch (_) {}
  }, opts.seed || {});
  await page.goto('/' + (opts.query || ''));
  await page.waitForLoadState('load');
  if (opts.signed) await page.waitForFunction(() => window._certanvilSignedIn === true, null, { timeout: 10000 });
  await page.waitForTimeout(600);
}
// tier: 'free' | 'pro'; used: questions used today (free). Re-renders Home with the pinned state.
async function setTier(page, tier, used) {
  await page.evaluate(([t, u]) => {
    window._quotaState = t === 'pro' ? { tier: 'pro', used_today: 0, daily_limit: -1 } : { tier: 'free', used_today: u || 0, daily_limit: 15 };
    document.body.classList.add('is-state-resolved');
    document.body.classList.toggle('is-pro-tier', t === 'pro');
    if (typeof renderIosHome === 'function') renderIosHome();
  }, [tier, used]);
}
const HISTORY = JSON.stringify([{ topic: 'Ports', score: 7, total: 10, pct: 70, date: new Date().toISOString(), questions: [] }]);
module.exports = { boot, setTier, HISTORY };

for (const vp of PHONES) {
  test.describe(`Lift C day-0 and capped Home @${vp.width}`, () => {
    test('new free user sees day-0 with no tab bar', async ({ page }) => {
      await boot(page, vp, { signed: true });
      await setTier(page, 'free', 0);
      const home = page.locator('#ios-home');
      await expect(home).toContainText("Network+ is set.");
      await expect(home).toContainText('15 of 15 ready');
      await expect(home.locator('[data-act="check"]')).toHaveText('Take the 30-second check');
      await expect(page.locator('html')).toHaveClass(/ifr-day0/);
      await expect(page.locator('#lift-tabbar')).toBeHidden();
    });
    test("Start today's 15 records the skip and starts today's quiz", async ({ page }) => {
      await boot(page, vp, { signed: true });   // signed in: the quiz can start (a signed-out tap keeps day-0, see the review fixes)
      await setTier(page, 'free', 0);
      await page.evaluate(() => { window.__started = null; window.startQuiz = function () { window.__started = { n: qCount, topic: topic }; }; });
      await page.locator('#ios-home [data-act="today"]').click();
      expect(await page.evaluate(() => window.__started && window.__started.n === 15 && window.__started.topic === MIXED_TOPIC)).toBe(true);
      expect(await page.evaluate(() => !!localStorage.getItem('nplus_onb_skips'))).toBe(true);
    });
    test("after a skip Home is today's new-user Home", async ({ page }) => {
      await boot(page, vp, { signed: true, seed: { nplus_onb_skips: '{"at":1}' } });
      await expect(page.locator('#ios-home')).toContainText('Your first session sets the baseline.');
      await expect(page.locator('html')).not.toHaveClass(/ifr-day0/);
      await expect(page.locator('#lift-tabbar')).toBeVisible();
    });
    test('day-0 with nothing left goes to the quota screen', async ({ page }) => {
      // The app's own async quota refresh can land after setTier; the fake answers it with the same 15-of-15 state.
      await boot(page, vp, { signed: true, fake: { tier: 'free', quotaUsed: 15 } });
      await setTier(page, 'free', 15);
      await expect(page.locator('#ios-home')).toContainText("Network+ is set.");
      await page.evaluate(() => { window.__quota = 0; window._showQuotaExceededUI = function () { window.__quota++; }; });
      await page.locator('#ios-home [data-act="today"]').click();
      await expect.poll(() => page.evaluate(() => window.__quota)).toBe(1);   // the quota check is async: poll, not one read
    });
    test('a free user at 0 left sees capped Home; Start review opens Daily Review; See Pro opens /pricing', async ({ page }) => {
      await boot(page, vp, { signed: true, seed: { nplus_history: HISTORY } });
      await setTier(page, 'free', 15);
      const home = page.locator('#ios-home');
      await expect(home).toContainText("That's today's 15 done.");
      await page.evaluate(() => { window.__sr = 0; window.startSrReview = function () { window.__sr++; }; window.__open = null; window.open = function (u) { window.__open = u; }; });
      const review = home.locator('[data-act="review"]');
      if (await review.count()) { await review.click(); expect(await page.evaluate(() => window.__sr)).toBe(1); }
      await home.locator('[data-act="gopro"]').click();
      expect(await page.evaluate(() => window.__open)).toBe('https://certanvil.com/pricing');
    });
    test('Pro day-0 has no quota rows', async ({ page }) => {
      await boot(page, vp, { signed: true });
      await setTier(page, 'pro');
      const home = page.locator('#ios-home');
      await expect(home).toContainText("Network+ is set.");
      await expect(home).not.toContainText('New practice');
      await expect(home.locator('[data-act="today"]')).toHaveText('Start a quiz');
    });
    test('crossing 899px clears html.ifr-day0', async ({ page }) => {
      await boot(page, vp, { signed: true });
      await expect(page.locator('html')).toHaveClass(/ifr-day0/);
      await page.setViewportSize(DESKTOP);
      await page.evaluate(() => renderIosHome());
      await expect(page.locator('html')).not.toHaveClass(/ifr-day0/);
    });
  });
}

test.describe('Lift C desktop Home @1280', () => {
  test("1280 shows today's desktop Home", async ({ page }) => {
    await boot(page, DESKTOP);
    await expect(page.locator('#ios-home')).toBeEmpty();
    await expect(page.locator('html')).not.toHaveClass(/ifr-day0/);
  });
});

// ── Task 3: the 30-second check (mock questions: ?onbmock=1, no AI) ──
async function openCheck(page, vp, opts) {
  await boot(page, vp, Object.assign({ query: '?onbmock=1', signed: true }, opts || {}));
  await page.locator('#ios-home [data-act="check"]').click();
  await expect(page.locator('#ios-check')).toBeVisible({ timeout: 8000 });
}
async function answerAll(page, n) {
  for (let i = 0; i < n; i++) {
    await page.locator('#ios-check [data-act="pick"][data-l="A"]').click();
    await page.locator('#ios-check [data-act="next"]').click();
  }
}
for (const vp of PHONES) {
  test.describe(`Lift C the check @${vp.width}`, () => {
    test('the check walks 5 questions with Next disabled until a pick', async ({ page }) => {
      await openCheck(page, vp);
      const chk = page.locator('#ios-check');
      await expect(chk).toContainText('Question 1 of 5');
      await expect(chk.locator('[data-act="next"]')).toBeDisabled();
      await chk.locator('[data-act="pick"][data-l="B"]').click();
      await expect(chk.locator('[data-act="next"]')).toBeEnabled();
      await chk.locator('[data-act="next"]').click();
      await expect(chk).toContainText('Question 2 of 5');
      await expect(page.locator('#lift-tabbar')).toBeHidden();
    });
    test("the score shows the cert's scale", async ({ page }) => {
      await openCheck(page, vp);
      // The legend reads the registry's scale for the active cert (the pack meta is only a fallback), so give the
      // registry a 1-1000 / pass 700 scale, as the Microsoft certs have, and the legend must follow it.
      await page.evaluate(() => { const R = window.CertRegistry, real = R.scale.bind(R); R.scale = (id) => (id === CURRENT_CERT ? { min: 1, max: 1000, pass: 700, format: 'scaled' } : real(id)); });
      await answerAll(page, 5);
      const chk = page.locator('#ios-check');
      await expect(chk).toContainText('Your starting point');
      await expect(chk).toContainText('/ 1000 readiness');
      await expect(chk).toContainText('Pass 700');
      await expect(chk.locator('.ifr-legend')).toHaveText(/^1\s*Pass 700\s*1000$/);
      await expect(chk).not.toContainText('See how readiness works');
    });
    test('Start practising starts a quiz (not just Home) and records no skip', async ({ page }) => {
      await openCheck(page, vp);
      await answerAll(page, 5);
      // The mock harness has no AI, so a real startQuiz would bounce back to Home; stub it and prove it is called.
      await page.evaluate(() => { window.__started = null; window.startQuiz = function () { window.__started = { n: qCount }; }; });
      await page.locator('#ios-check [data-act="practise"]').click();
      await expect(page.locator('#ios-check')).toBeHidden();
      expect(await page.evaluate(() => !!window.__started)).toBe(true);
      expect(await page.evaluate(() => localStorage.getItem('nplus_onb_skips'))).toBeNull();
    });
    test("Skip the check lands on today's new-user Home", async ({ page }) => {
      await openCheck(page, vp);
      await page.locator('#ios-check [data-act="skip"]').click();
      await expect(page.locator('#ios-check')).toBeHidden();
      await expect(page.locator('#ios-home')).toContainText('Your first session sets the baseline.');
      expect(await page.evaluate(() => !!localStorage.getItem('nplus_onb_skips'))).toBe(true);
    });
    test('a half check leaves no snapshot', async ({ page }) => {
      await openCheck(page, vp);
      await answerAll(page, 2);
      expect(await page.evaluate(() => localStorage.getItem('nplus_readiness_snapshots'))).toBeNull();
      await page.goto('/'); await page.waitForTimeout(700);
      await expect(page.locator('#ios-home')).toContainText("Network+ is set.");
    });
    test('the check sends no metered call', async ({ page }) => {
      await boot(page, vp, { signed: true });
      const bodies = [];
      await page.route('**/api/ai/generate*', async (r) => { bodies.push(r.request().postData() || ''); await r.fulfill({ status: 500, body: '{}' }); });
      await page.evaluate(() => { window.validateApiKey = function () { return null; }; });
      await page.locator('#ios-home [data-act="check"]').click();
      await page.waitForTimeout(2500);
      expect(bodies.length).toBeGreaterThan(0);
      expect(bodies.some((b) => /"_metered":\s*true/.test(b))).toBe(false);
    });
    test('a failed check fetch leaves day-0 and the meter flag clean', async ({ page }) => {
      await boot(page, vp, { signed: true });
      await page.route('**/api/ai/generate*', (r) => r.fulfill({ status: 500, body: '{}' }));
      await page.evaluate(() => { window.validateApiKey = function () { return null; }; });
      await page.locator('#ios-home [data-act="check"]').click();
      await page.waitForFunction(() => window._ifrUnmetered === false, null, { timeout: 20000 });   // set when the check starts, cleared when it ends
      await expect(page.locator('#page-setup')).toHaveClass(/active/);
      await expect(page.locator('html')).not.toHaveClass(/ifr-check/);
      await expect(page.locator('#ios-home')).toContainText("Network+ is set.");
      expect(await page.evaluate(() => localStorage.getItem('nplus_readiness_snapshots'))).toBeNull();
    });
  });
}
test("1280 Take the diagnostic is today's desktop flow", async ({ page }) => {
  await boot(page, DESKTOP, { query: '?onbmock=1' });
  await expect(page.locator('#ios-check')).toBeHidden();
  await expect(page.locator('#ios-home [data-act="check"]')).toHaveCount(0);
});

// ── Task 4: the daily-limit screen ──
for (const vp of PHONES) {
  test.describe(`Lift C daily limit @${vp.width}`, () => {
    async function overCap(page) {
      await boot(page, vp, { signed: true, seed: { nplus_history: HISTORY } });
      await setTier(page, 'free', 8);   // 7 left today
      await page.evaluate(() => { window.__started = null; window.startQuiz = function () { window.__started = qCount; }; window.__open = null; window.open = function (u) { window.__open = u; }; });
      await page.evaluate(() => _gateSessionSizeForQuota(25, { mode: 'quiz' }));
    }
    test('a free custom 25 with 7 left shows the full-screen limit', async ({ page }) => {
      await overCap(page);
      const s = page.locator('#ios-check');
      await expect(s).toBeVisible();
      await expect(s).toContainText("That's more than your free day");
      await expect(s).toContainText('25-question');
      await expect(page.locator('#daily-limit-preblock')).toHaveCount(0);
      await expect(page.locator('#lift-tabbar')).toBeHidden();
    });
    test('Start a 7-question set starts 7', async ({ page }) => {
      await overCap(page);
      await page.locator('#ios-check [data-act="limit-small"]').click();
      expect(await page.evaluate(() => window.__started)).toBe(7);
      await expect(page.locator('#ios-check')).toBeHidden();
    });
    test('Go Pro for unlimited opens /pricing', async ({ page }) => {
      await overCap(page);
      await page.locator('#ios-check [data-act="limit-pro"]').click();
      expect(await page.evaluate(() => window.__open)).toBe('https://certanvil.com/pricing');
    });
    test('the back control closes it and leaves the page as it was', async ({ page }) => {
      await overCap(page);
      await page.locator('#ios-check [data-act="limit-back"]').click();
      await expect(page.locator('#ios-check')).toBeHidden();
      await expect(page.locator('html')).not.toHaveClass(/ifr-check/);
      expect(await page.evaluate(() => window.__started)).toBeNull();
    });
  });
}
test("1280 keeps today's daily-limit popup", async ({ page }) => {
  await boot(page, DESKTOP, { signed: true, seed: { nplus_history: HISTORY } });
  await setTier(page, 'free', 8);
  await page.evaluate(() => _gateSessionSizeForQuota(25, { mode: 'quiz' }));
  await expect(page.locator('#daily-limit-preblock')).toBeVisible();
  await expect(page.locator('#ios-check')).toBeHidden();
});

// ── Task 5: offline on phones ──
for (const vp of PHONES) {
  test.describe(`Lift C offline @${vp.width}`, () => {
    test("offline on Home shows June's offline state and the tab bar", async ({ page, context }) => {
      await boot(page, vp, { seed: { nplus_history: HISTORY } });
      await context.setOffline(true);
      await expect(page.locator('#ios-home')).toContainText("You're offline.");
      await expect(page.locator('#ios-home')).toContainText('Saved locally, will sync');
      await expect(page.locator('#ifr-offbar')).toBeVisible();
      await expect(page.locator('#lift-tabbar')).toBeVisible();
      await context.setOffline(false);
    });
    test('back online restores Home', async ({ page, context }) => {
      await boot(page, vp, { seed: { nplus_history: HISTORY } });
      await context.setOffline(true);
      await expect(page.locator('#ios-home')).toContainText("You're offline.");
      await context.setOffline(false);
      await expect(page.locator('#ios-home')).not.toContainText("You're offline.");
      await expect(page.locator('#ifr-offbar')).toBeHidden();
    });
    test('offline during a quiz shows the bar only', async ({ page, context }) => {
      await boot(page, vp, { seed: { nplus_history: HISTORY } });
      await page.evaluate(() => showPage('drills'));
      await context.setOffline(true);
      await expect(page.locator('#ifr-offbar')).toBeVisible();
      await expect(page.locator('#page-drills')).toHaveClass(/active/);
      await expect(page.locator('#page-drills')).not.toContainText("You're offline.");
      await context.setOffline(false);
    });
    test('no orange banner on phones', async ({ page, context }) => {
      await boot(page, vp, { seed: { nplus_history: HISTORY } });
      await context.setOffline(true);
      await expect(page.locator('#ifr-offbar')).toBeVisible();
      await expect(page.locator('#connectivity-banner')).toHaveCount(0);
      await context.setOffline(false);
    });
  });
}
test("1280 keeps today's offline banner", async ({ page, context }) => {
  await boot(page, DESKTOP, { seed: { nplus_history: HISTORY } });
  await context.setOffline(true);
  await expect(page.locator('#connectivity-banner')).toBeVisible();
  await expect(page.locator('#ifr-offbar')).toHaveCount(0);
  await context.setOffline(false);
});

// ── Task 6: behind the onboarding switch (?onb=1) ──
const FREE_FAKE = { noResults: true, metaOverride: { tier: 'free', entitlements: {} } };   // a free account with no logged results
for (const vp of PHONES) {
  test.describe(`Lift C first run behind the switch @${vp.width}`, () => {
    async function onb(page, seed) {
      page.__dialogs = [];
      page.on('dialog', (d) => { page.__dialogs.push(d.message()); d.dismiss().catch(() => {}); });
      await boot(page, vp, { signed: true, query: '?onb=1', seed: seed, fake: FREE_FAKE });
    }
    test('a never-activated phone user gets the picker with AI-901', async ({ page }) => {
      await onb(page);
      const fr = page.locator('#onb-firstrun');
      await expect(fr).toBeVisible({ timeout: 10000 });
      await expect(fr).toContainText('Pick your exam');
      await expect(fr).toContainText('AI-901');
      await expect(fr).not.toContainText('AI-900');
    });
    test('Lock in opens the sheet, never confirm()', async ({ page }) => {
      await onb(page);
      await page.locator('#onb-firstrun [data-act="lock"]').click();
      await expect(page.locator('#ist-sheet')).toBeVisible();
      await expect(page.locator('#ist-sheet')).toContainText('Lock in Network+?');
      expect(page.__dialogs).toEqual([]);
    });
    test('Lock in on the current cert saves it, survives reload, lands on day-0', async ({ page }) => {
      await onb(page);
      await page.locator('#onb-firstrun [data-act="lock"]').click();
      await page.locator('#ist-sheet [data-act="lock-go"]').click();
      await page.locator('#ist-sheet [data-act="last-go"]').click();
      await expect(page.locator('#onb-firstrun')).toBeHidden();
      await expect(page.locator('#ios-home')).toContainText("Network+ is set.");
      expect(await page.evaluate(() => localStorage.getItem('nplus_freeCertId'))).toBe('netplus');
      await page.reload(); await page.waitForTimeout(1200);
      await expect(page.locator('#onb-firstrun')).toBeHidden();
      await expect(page.locator('#ios-home')).toContainText("Network+ is set.");
    });
    test('Lock in on another cert saves it and navigates there', async ({ page }) => {
      await onb(page);
      await page.locator('#onb-firstrun [data-act="cert"][data-id="secplus"]').click();
      await expect(page.locator('#onb-firstrun [data-act="lock"]')).toHaveText('Lock in Security+');
      await page.locator('#onb-firstrun [data-act="lock"]').click();
      await page.locator('#ist-sheet [data-act="lock-go"]').click();
      await Promise.all([page.waitForURL(/cert=secplus/), page.locator('#ist-sheet [data-act="last-go"]').click()]);
      expect(await page.evaluate(() => localStorage.getItem('nplus_freeCertId'))).toBe('secplus');
    });
    test('a not-activated user with a saved cert lands on day-0', async ({ page }) => {
      await onb(page, { nplus_freeCertId: 'netplus' });
      await page.waitForTimeout(800);
      await expect(page.locator('#onb-firstrun')).toBeHidden();
      await expect(page.locator('#ios-home')).toContainText("Network+ is set.");
    });
    test('a user who practised is never routed into first run', async ({ page }) => {
      await onb(page, { nplus_history: HISTORY });
      await page.waitForTimeout(800);
      await expect(page.locator('#onb-firstrun')).toBeHidden();
    });
    test('Pro picker has no sheet', async ({ page }) => {
      await onb(page);
      await page.evaluate(() => window.iosFirstRun.picker({ tier: 'pro' }));
      await expect(page.locator('#onb-firstrun [data-act="start"]')).toHaveText('Start with Network+');
      await expect(page.locator('#onb-firstrun [data-act="lock"]')).toHaveCount(0);
    });
    test("restore shows June's skeleton on phones", async ({ page }) => {
      await boot(page, vp, { query: '?onb=1' });
      await expect(page.locator('#onb-resolve .ifr-restore')).toHaveCount(1);
      await expect(page.locator('#onb-resolve .ifr-restore')).toContainText('Picking up where you left off');
    });
  });
}
test("1280 ?onb=1 keeps today's first run", async ({ page }) => {
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  await boot(page, DESKTOP, { signed: true, query: '?onb=1', fake: FREE_FAKE });
  const fr = page.locator('#onb-firstrun');
  await expect(fr).toBeVisible({ timeout: 10000 });
  await expect(fr.locator('[data-fr-action="confirm-cert"]')).toHaveCount(1);
  await expect(fr.locator('.ifr-picker')).toHaveCount(0);
});

// ── Final review fix pass ──
for (const vp of PHONES) {
  test.describe(`Lift C review fixes @${vp.width}`, () => {
    test('finishing the check lands on the active Home page with the tab bar', async ({ page }) => {
      await openCheck(page, vp);
      await answerAll(page, 5);
      await page.locator('#ios-check [data-act="practise"]').click();
      await expect(page.locator('#page-setup')).toHaveClass(/active/);
      await expect(page.locator('#ios-home')).toBeVisible();
      await expect(page.locator('#lift-tabbar')).toBeVisible();
    });
    test('skipping the check lands on the active Home page', async ({ page }) => {
      await openCheck(page, vp);
      await page.locator('#ios-check [data-act="skip"]').click();
      await expect(page.locator('#page-setup')).toHaveClass(/active/);
      await expect(page.locator('#ios-home')).toBeVisible();
    });
    test('a signed-out new user never sees day-0 (F3)', async ({ page }) => {
      await boot(page, vp);
      await expect(page.locator('html')).not.toHaveClass(/ifr-day0/);
      await expect(page.locator('#ios-home [data-act="today"]')).toHaveCount(0);
      expect(await page.evaluate(() => localStorage.getItem('nplus_onb_skips'))).toBeNull();
    });
    test('Home follows the quota when it arrives after first paint', async ({ page }) => {
      await boot(page, vp, { signed: true, seed: { nplus_history: HISTORY } });
      await page.evaluate(() => { window._quotaState = { tier: 'free', used_today: 15, daily_limit: 15 }; document.body.classList.toggle('is-state-resolved'); document.body.classList.toggle('is-state-resolved'); });
      await expect(page.locator('#ios-home')).toContainText("That's today's 15 done.");
    });
    test('capped Home keeps the tab bar', async ({ page }) => {
      await boot(page, vp, { signed: true, seed: { nplus_history: HISTORY } });
      await setTier(page, 'free', 15);
      await expect(page.locator('#ios-home')).toContainText("That's today's 15 done.");
      await expect(page.locator('#lift-tabbar')).toBeVisible();
    });
    test('lock-in on another cert waits for the saved choice to flush before leaving', async ({ page }) => {
      await page.addInitScript(() => {
        const t = setInterval(() => { if (window.cloudStore) { clearInterval(t); window.cloudStore.flushNow = () => new Promise((r) => setTimeout(() => { sessionStorage.setItem('flushed', '1'); r(); }, 300)); } }, 20);
      });
      page.on('dialog', (d) => d.dismiss().catch(() => {}));
      await boot(page, vp, { signed: true, query: '?onb=1', fake: FREE_FAKE });
      await page.locator('#onb-firstrun [data-act="cert"][data-id="secplus"]').click();
      await page.locator('#onb-firstrun [data-act="lock"]').click();
      await page.locator('#ist-sheet [data-act="lock-go"]').click();
      await Promise.all([page.waitForURL(/cert=secplus/), page.locator('#ist-sheet [data-act="last-go"]').click()]);
      expect(await page.evaluate(() => sessionStorage.getItem('flushed'))).toBe('1');
    });
  });
}

// ── Stage 5a: the last check (reminder 2) ──
for (const vp of PHONES) {
  test.describe(`Stage 5a the last check @${vp.width}`, () => {
    async function toLast(page) {
      page.on('dialog', (d) => d.dismiss().catch(() => {}));
      await boot(page, vp, { signed: true, query: '?onb=1', fake: FREE_FAKE });
      await page.locator('#onb-firstrun [data-act="lock"]').click();
      await expect(page.locator('#ist-sheet')).toContainText('Lock in Network+?');
      await page.locator('#ist-sheet [data-act="lock-go"]').click();
    }
    test('Lock in → the last check replaces the sheet in place', async ({ page }) => {
      await toLast(page);
      const sheet = page.locator('#ist-sheet');
      await expect(sheet).toBeVisible();
      await expect(sheet).toContainText('One last check');
      await expect(sheet).toContainText("Network+ will be your exam on Free. You can't switch to another exam unless you go Pro.");
      await expect(sheet).not.toContainText('A fresh set each morning');
      await expect(sheet.locator('[data-act="last-go"]')).toHaveText('Yes, lock in Network+');
    });
    test('Go back on the last check saves nothing', async ({ page }) => {
      await toLast(page);
      await page.locator('#ist-sheet [data-act="last-back"]').click();
      await expect(page.locator('#ist-sheet')).toBeHidden();
      await expect(page.locator('#onb-firstrun')).toBeVisible();
      expect(await page.evaluate(() => localStorage.getItem('nplus_freeCertId'))).toBeNull();
    });
    test('Yes, lock in lands on day-0', async ({ page }) => {
      await toLast(page);
      await page.locator('#ist-sheet [data-act="last-go"]').click();
      await expect(page.locator('#ios-home')).toContainText("Network+ is set.");
      expect(await page.evaluate(() => localStorage.getItem('nplus_freeCertId'))).toBe('netplus');
    });
  });
}
