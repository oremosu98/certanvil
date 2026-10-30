// F3 (30 Oct): the phone first run. This file holds the first-Home tour (features/ios-tour.js); Task 8 adds the flows.
// Native paths reuse lift-5b's harness: the app's UA suffix, a stubbed Capacitor with Preferences in localStorage
// __prefs, and tests/fixtures/fake-supabase.js for a signed-in boot.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const PHONE = { width: 402, height: 874 };
const FAKE = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'fake-supabase.js'), 'utf8');
const NATIVE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 CertAnvilApp';
const PREFS = { chosenCert: 'netplus', lockedCert: 'netplus', lastCertHost: 'networkplus.certanvil.com' };
const SKIP = { nplus_onb_skips: '{"at":1}' };   // past day-0
const HISTORY = JSON.stringify([{ topic: 'Ports', score: 7, total: 10, pct: 70, date: new Date().toISOString(), questions: [] }]);
function stubScript() {
  return () => {
    const read = () => { try { return JSON.parse(localStorage.getItem('__prefs') || '{}'); } catch (_) { return {}; } };
    const write = (o) => localStorage.setItem('__prefs', JSON.stringify(o));
    window.Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        Preferences: {
          get: ({ key }) => Promise.resolve({ value: read()[key] == null ? null : read()[key] }),
          set: ({ key, value }) => Promise.resolve().then(() => { const o = read(); o[key] = value; write(o); }),
          remove: ({ key }) => Promise.resolve().then(() => { const o = read(); delete o[key]; write(o); })
        },
        Haptics: { impact: () => Promise.resolve(), notification: () => Promise.resolve() },
        Browser: { open: () => Promise.resolve() },
        StatusBar: { setStyle: () => Promise.resolve() }
      }
    };
  };
}
// opts: {fake, prefs, seed, offline}
async function boot(page, opts) {
  opts = opts || {};
  await page.setViewportSize(PHONE);
  const F = Object.assign({ role: 'user', noResults: true, signedOut: false, tier: 'free', metaOverride: { tier: 'free', entitlements: {} } }, opts.fake || {});
  await page.route('**/lib/supabase.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB=' + JSON.stringify(F) + ';' + FAKE }));
  await page.addInitScript(([prefs, seed]) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1');
      localStorage.setItem('__prefs', JSON.stringify(prefs));
      Object.keys(seed || {}).forEach((k) => localStorage.setItem(k, seed[k]));
    }
  }, [opts.prefs || PREFS, opts.seed || SKIP]);
  if (opts.offline) await page.addInitScript(() => { Object.defineProperty(navigator, 'onLine', { get: () => false }); });
  await page.addInitScript(stubScript());
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => window._certanvilSignedIn === true, null, { timeout: 10000 });
}
const tour = (page) => page.locator('#ios-tour');
const rect = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, sel);
const ringRect = (page) => rect(page, '#ios-tour .tour-ring');
// The ring wraps the anchor with `pad` CSS px on every side (rects come back zoomed by html{zoom: 1.10})
async function expectRingOn(page, sel, pad) {
  await expect.poll(async () => {
    const a = await rect(page, sel), r = await ringRect(page);
    const p = pad * await page.evaluate(() => { const h = document.getElementById('ios-tour'); return h.getBoundingClientRect().width / h.offsetWidth; });   // html{zoom}
    return Math.max(Math.abs(r.x - (a.x - p)), Math.abs(r.y - (a.y - p)), Math.abs(r.w - (a.w + p * 2)), Math.abs(r.h - (a.h + p * 2)));
  }, { timeout: 3000 }).toBeLessThan(1.5);
}
const prefs = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('__prefs') || '{}'));

test.describe('F3: the first-Home tour', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('the first normal Home shows tip 1 on the readiness card, as a labelled modal with focus on Next', async ({ page }) => {
    await boot(page);
    await expect(tour(page)).toHaveClass(/\bopen\b/, { timeout: 5000 });
    await expect(tour(page)).toHaveAttribute('role', 'dialog');
    await expect(tour(page)).toHaveAttribute('aria-modal', 'true');
    await expect(tour(page)).toHaveAttribute('aria-labelledby', 'it-h');
    await expect(page.locator('#it-h')).toHaveText('Your readiness score');
    await expect(tour(page).locator('.tt-count')).toHaveText('1 of 4');
    await expect(tour(page).locator('.tt-p')).toHaveText('It runs from 100 to 900, and 720 is a pass. It unlocks after your first quiz and climbs as you answer.');
    await expect(tour(page).locator('[data-act="close"]')).toHaveAttribute('aria-label', 'Close tour');
    expect(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-act'))).toBe('next');
    await expectRingOn(page, '#ios-home .ih-rd', 5);
    // the bubble sits below the card
    const card = await rect(page, '#ios-home .ih-rd'), tip = await rect(page, '#ios-tour .tour-tip');
    expect(tip.y).toBeGreaterThan(card.y + card.h);
    expect((await prefs(page)).tourSeen).toBe('1');   // opening marks it seen
  });

  test('Next three times reaches tip 4 on the Progress tab with Done; Done closes; a reload does not show it again', async ({ page }) => {
    await boot(page);
    await expect(tour(page)).toHaveClass(/\bopen\b/, { timeout: 5000 });
    const next = tour(page).locator('[data-act="next"]');
    await next.click();
    await expect(page.locator('#it-h')).toHaveText('Not sure what to do?');
    await expectRingOn(page, '#ios-home .ih-rec', 5);
    await next.click();
    await expect(page.locator('#it-h')).toHaveText('Drills for weak spots');
    await expectRingOn(page, '#lift-tabbar .lift-tab[data-page="drills"]', 2);
    await next.click();
    await expect(page.locator('#it-h')).toHaveText('See how you’re doing');
    await expect(tour(page).locator('.tt-count')).toHaveText('4 of 4');
    await expect(next).toHaveText('Done');
    await expectRingOn(page, '#lift-tabbar .lift-tab[data-page="progress"]', 2);
    // above the tabs, not across them
    const tip = await rect(page, '#ios-tour .tour-tip'), bar = await rect(page, '#lift-tabbar');
    expect(tip.y + tip.h).toBeLessThan(bar.y);
    await next.click();
    await expect(tour(page)).toBeHidden();
    await expect(page.locator('#page-setup')).toHaveClass(/\bactive\b/);
    await page.reload();
    await page.waitForFunction(() => window._certanvilSignedIn === true, null, { timeout: 10000 });
    await page.waitForTimeout(2500);
    expect(await page.evaluate(() => window.iosTour.isOpen())).toBe(false);
    await expect(tour(page)).toHaveCount(0);
  });

  test('Account → Replay the tour shows tip 1 on Home', async ({ page }) => {
    await boot(page, { prefs: Object.assign({ tourSeen: '1' }, PREFS) });
    await page.waitForTimeout(1500);
    await expect(tour(page)).toHaveCount(0);
    await page.click('#lift-tabbar .lift-tab[data-page="settings"]');
    const row = page.locator('#ios-settings [data-act="tour"]');
    await expect(row).toContainText('Replay the tour');
    await expect(row).toContainText('Four quick tips on Home');
    await row.click();
    await expect(page.locator('#page-setup')).toHaveClass(/\bactive\b/);
    await expect(tour(page)).toHaveClass(/\bopen\b/, { timeout: 5000 });
    await expect(tour(page).locator('.tt-count')).toHaveText('1 of 4');
    await expectRingOn(page, '#ios-home .ih-rd', 5);
  });

  test('the X, a tap outside the bubble and Escape each close it', async ({ page }) => {
    await boot(page);
    await expect(tour(page)).toHaveClass(/\bopen\b/, { timeout: 5000 });
    await tour(page).locator('[data-act="close"]').click();
    await expect(tour(page)).toBeHidden();
    for (const how of ['outside', 'escape']) {
      await page.evaluate(() => window.iosTour.start());
      await expect(tour(page)).toHaveClass(/\bopen\b/);
      await tour(page).locator('.tt-p').click();   // a tap inside the bubble keeps it
      await expect(tour(page)).toHaveClass(/\bopen\b/);
      if (how === 'outside') await page.mouse.click(12, 12); else await page.keyboard.press('Escape');
      await expect(tour(page)).toBeHidden();
    }
  });

  test('Home re-rendering on tip 2 keeps tip 2 and moves the ring onto the new card', async ({ page }) => {
    await boot(page);
    await expect(tour(page)).toHaveClass(/\bopen\b/, { timeout: 5000 });
    await tour(page).locator('[data-act="next"]').click();
    await expect(page.locator('#it-h')).toHaveText('Not sure what to do?');
    const before = await page.evaluate(() => document.querySelector('#ios-home .ih-rec'));
    // push the new card down so the old rect is wrong, then re-render Home
    await page.evaluate(() => { document.querySelector('#ios-home').style.paddingTop = '60px'; window.renderIosHome(); });
    expect(await page.evaluate((b) => document.querySelector('#ios-home .ih-rec') !== b, before)).toBe(true);
    await expect(page.locator('#it-h')).toHaveText('Not sure what to do?');
    await expect(tour(page).locator('.tt-count')).toHaveText('2 of 4');
    await expectRingOn(page, '#ios-home .ih-rec', 5);
  });

  // ── fix round 1: edge cases ──
  test('Replay gives up silently when the normal Home is not there (capped Home, or another page)', async ({ page }) => {
    await boot(page, { fake: { quotaUsed: 15 }, prefs: Object.assign({ tourSeen: '1' }, PREFS), seed: Object.assign({ nplus_history: HISTORY }, SKIP) });
    await expect(page.locator('html')).toHaveClass(/ifr-capped/, { timeout: 5000 });
    await page.evaluate(() => window.iosTour.start());
    await page.waitForTimeout(2600);
    await expect(tour(page)).toHaveCount(0);
    await page.click('#lift-tabbar .lift-tab[data-page="settings"]');
    await expect(page.locator('#ios-settings')).toBeVisible();
    await page.evaluate(() => window.iosTour.start());
    await page.waitForTimeout(2600);
    await expect(tour(page)).toHaveCount(0);
  });

  test('a step whose anchor vanished is skipped and focus stays on Next', async ({ page }) => {
    await boot(page);
    await expect(tour(page)).toHaveClass(/\bopen\b/, { timeout: 5000 });
    await tour(page).locator('[data-act="next"]').click();
    await expect(page.locator('#it-h')).toHaveText('Not sure what to do?');
    await page.evaluate(() => { document.querySelector('#ios-home .ih-rec').remove(); window.dispatchEvent(new Event('resize')); });
    await expect(tour(page).locator('.tt-count')).toHaveText('3 of 4');
    expect(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-act'))).toBe('next');
    await expectRingOn(page, '#lift-tabbar .lift-tab[data-page="drills"]', 2);
  });

  test('the sign-in screen opening over Home closes the tour', async ({ page }) => {
    await boot(page);
    await expect(tour(page)).toHaveClass(/\bopen\b/, { timeout: 5000 });
    await page.evaluate(() => window.iosSignIn.open({ from: 'settings' }));
    await expect(page.locator('#ios-signin')).toBeVisible();
    await expect(tour(page)).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.classList.contains('itr-open'))).toBe(false);
  });

  test('while the reminders sheet is up the tour ignores the keyboard; the reminders ask waits for the tour', async ({ page }) => {
    await boot(page);
    await expect(tour(page)).toHaveClass(/\bopen\b/, { timeout: 5000 });
    await page.evaluate(() => { const d = document.createElement('div'); d.id = 'irm-sheet'; document.body.appendChild(d); });
    await page.keyboard.press('Escape');
    await expect(tour(page)).toHaveClass(/\bopen\b/);
    await page.evaluate(() => document.getElementById('irm-sheet').remove());
    await page.keyboard.press('Escape');
    await expect(tour(page)).toBeHidden();
  });

  test('day-0 Home never shows it', async ({ page }) => {
    await boot(page, { seed: {} });
    await expect(page.locator('html')).toHaveClass(/ifr-day0/);
    await page.waitForTimeout(2500);
    await expect(tour(page)).toHaveCount(0);
    expect((await prefs(page)).tourSeen).toBeUndefined();
  });

  test('capped Home never shows it', async ({ page }) => {
    await boot(page, { fake: { quotaUsed: 15 }, seed: Object.assign({ nplus_history: HISTORY }, SKIP) });
    await expect(page.locator('html')).toHaveClass(/ifr-capped/, { timeout: 5000 });
    await page.waitForTimeout(2500);
    await expect(tour(page)).toHaveCount(0);
    expect((await prefs(page)).tourSeen).toBeUndefined();
  });

  test('offline Home never shows it', async ({ page }) => {
    await boot(page, { offline: true });
    await expect(page.locator('html')).toHaveClass(/ifr-offline/, { timeout: 5000 });
    await page.waitForTimeout(2500);
    await expect(tour(page)).toHaveCount(0);
    expect((await prefs(page)).tourSeen).toBeUndefined();
  });
});

test.describe('F3: the tour on the website (phone)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('it shows once and remembers in localStorage ca_tour_seen', async ({ page }) => {
    await page.setViewportSize(PHONE);
    const F = { role: 'user', noResults: true, signedOut: false, tier: 'free', metaOverride: { tier: 'free', entitlements: {} } };
    await page.route('**/lib/supabase.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB=' + JSON.stringify(F) + ';' + FAKE }));
    await page.addInitScript((seed) => {
      if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
      localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1');
      Object.keys(seed).forEach((k) => localStorage.setItem(k, seed[k]));
    }, SKIP);
    await page.goto('/');
    await expect(tour(page)).toHaveClass(/\bopen\b/, { timeout: 8000 });
    expect(await page.evaluate(() => localStorage.getItem('ca_tour_seen'))).toBe('1');
    await page.keyboard.press('Escape');
    await page.reload();
    await page.waitForTimeout(2500);
    await expect(tour(page)).toHaveCount(0);
  });
});
