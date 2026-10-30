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

// ── Task 8: the flows. Signed out unless a test says otherwise (boot() above waits for a signed-in app). ──
// opts: {fake, prefs, seed, offline, query, ua (default: the app), cookie, width}
async function bootOut(page, opts) {
  opts = opts || {};
  await page.setViewportSize(opts.size || PHONE);
  const F = Object.assign({ role: 'user', noResults: true, signedOut: true, tier: 'free', metaOverride: { tier: 'free', entitlements: {} } }, opts.fake || {});
  await page.route('**/lib/supabase.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB=' + JSON.stringify(F) + ';' + FAKE }));
  await page.addInitScript(([prefs, seed, native]) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1');
      if (native) localStorage.setItem('__prefs', JSON.stringify(prefs));
      else localStorage.setItem('ca_tour_seen', '1');
      Object.keys(seed || {}).forEach((k) => localStorage.setItem(k, seed[k]));
    }
  }, [opts.prefs || {}, opts.seed || {}, opts.native !== false]);
  if (opts.offline) await page.addInitScript(() => { Object.defineProperty(navigator, 'onLine', { get: () => false }); });
  if (opts.native !== false) await page.addInitScript(stubScript());
  if (opts.cookie) await page.context().addCookies([{ name: opts.cookie[0], value: opts.cookie[1], url: 'http://localhost:3131' }]);
  await page.goto('/' + (opts.query || ''));
  await page.waitForLoadState('load');
  await page.waitForFunction(() => window._certanvilSignedIn !== undefined, null, { timeout: 10000 });
  await page.waitForTimeout(1200);
}
const acct = (page) => page.locator('#ios-signin');
const picker = (page) => page.locator('#onb-firstrun');
const lockIn = async (page, certName) => {
  if (certName) await page.click('#onb-firstrun .ifr-cert[data-id="' + certName + '"]');
  await page.click('#onb-firstrun [data-act="lock"]');
  await page.click('#ist-sheet [data-act="lock-go"]');
  await expect(page.locator('#ist-sheet')).toContainText('One last check');
  await page.click('#ist-sheet [data-act="last-go"]');
};
const typeCode = async (page, code) => { await page.locator('#isi-boxes input').first().focus(); await page.keyboard.type(code, { delay: 30 }); };

test.describe('F3: the flows in the app', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('fresh install: picker, Lock in, both reminders, then the account screen on the same page', async ({ page }) => {
    await bootOut(page);
    await expect(picker(page)).toContainText('Which exam are you studying for?');
    const url = page.url();
    await lockIn(page);
    await expect(acct(page)).toBeVisible({ timeout: 8000 });
    await expect(acct(page).locator('h1')).toHaveText('Create your account to start');
    await expect(acct(page)).toContainText('Network+');
    await expect(acct(page).locator('[data-act="back"]')).toBeVisible();
    expect(page.url()).toBe(url);
    expect(await prefs(page)).toMatchObject({ chosenCert: 'netplus', lockedCert: 'netplus' });
  });

  test('picking Security+ on the Network+ page navigates to ?cert=secplus and shows the account screen there', async ({ page }) => {
    await bootOut(page);
    await lockIn(page, 'secplus');
    await page.waitForURL(/cert=secplus/, { timeout: 10000 });
    await expect(acct(page)).toBeVisible({ timeout: 8000 });
    await expect(acct(page).locator('h1')).toHaveText('Create your account to start');
    // (localhost loads only the Network+ pack whatever ?cert says, so the exam's display name can't show here; the choice itself is what's checked)
    await expect(acct(page).locator('.isi-sub')).toContainText('progress is saved to it');
    expect(await prefs(page)).toMatchObject({ chosenCert: 'secplus', lockedCert: 'secplus', lastCertHost: 'secplus.certanvil.com' });
    await expect(acct(page).locator('[data-act="back"]')).toBeVisible();
  });

  test('Back on the account screen clears the choice, the lock and the free cert, and shows the picker', async ({ page }) => {
    await bootOut(page);
    await lockIn(page);
    await expect(acct(page)).toBeVisible({ timeout: 8000 });
    expect(await page.evaluate(() => localStorage.getItem('nplus_freeCertId'))).toBe('netplus');
    await acct(page).locator('[data-act="back"]').click();
    await expect(picker(page)).toContainText('Which exam are you studying for?');
    await expect(acct(page)).toBeHidden();
    const p = await prefs(page);
    expect(p.chosenCert).toBeUndefined(); expect(p.lockedCert).toBeUndefined(); expect(p.lastCertHost).toBeUndefined();
    expect(await page.evaluate(() => localStorage.getItem('nplus_freeCertId'))).toBeNull();
  });

  test('signing in with the code lands on day-0 ("You\'re in", "Network+ is set."); Skip reaches the normal Home with the tour', async ({ page }) => {
    await bootOut(page);
    await lockIn(page);
    await expect(acct(page)).toBeVisible({ timeout: 8000 });
    await page.fill('#isi-email', 'sam@example.test');
    await page.click('#ios-signin [data-act="continue"]');
    await expect(acct(page)).toContainText('Check your email');
    await typeCode(page, '123456');
    await expect(page.locator('html')).toHaveClass(/ifr-day0/, { timeout: 10000 });
    await expect(acct(page)).toBeHidden();
    await expect(page.locator('.ifr-home.ifr-day0')).toContainText('You\'re in');
    await expect(page.locator('.ifr-home.ifr-day0 h1')).toHaveText('Network+ is set.');
    await page.click('.ifr-home.ifr-day0 [data-act="skip"]');
    await expect(page.locator('html')).not.toHaveClass(/ifr-day0/);
    await expect(page.locator('#ios-home .ih-rd')).toBeVisible();
    await expect(tour(page)).toHaveClass(/\bopen\b/, { timeout: 6000 });
    await expect(page.locator('#it-h')).toHaveText('Your readiness score');
  });

  test('reload signed out with a choice and no history: the account screen with Back', async ({ page }) => {
    await bootOut(page, { prefs: PREFS });
    await expect(acct(page)).toBeVisible();
    await expect(acct(page).locator('h1')).toHaveText('Create your account to start');
    await expect(acct(page).locator('[data-act="back"]')).toBeVisible();
    await page.reload();
    await expect(acct(page)).toBeVisible({ timeout: 8000 });
    await expect(acct(page).locator('h1')).toHaveText('Create your account to start');
    await expect(acct(page).locator('[data-act="back"]')).toBeVisible();
  });

  test('reload signed out with history: "Sign in to keep studying" and no Back', async ({ page }) => {
    await bootOut(page, { prefs: PREFS, seed: { nplus_history: HISTORY } });
    await expect(acct(page)).toBeVisible();
    await expect(acct(page).locator('h1')).toHaveText('Sign in to keep studying');
    await expect(acct(page).locator('[data-act="back"]')).toHaveCount(0);
    await page.reload();
    await expect(acct(page)).toBeVisible({ timeout: 8000 });
    await expect(acct(page).locator('h1')).toHaveText('Sign in to keep studying');
    await expect(acct(page).locator('[data-act="back"]')).toHaveCount(0);
  });

  test('a stored session cookie or localStorage key means no account screen even though the flag says signed out', async ({ page }) => {
    await bootOut(page, { prefs: PREFS, seed: { 'sb-x-auth-token': '{"access_token":"x"}' } });
    expect(await page.evaluate(() => window._certanvilSignedIn)).toBe(false);
    await page.waitForTimeout(1500);
    await expect(acct(page)).toBeHidden();
    await expect(picker(page)).toBeHidden();
  });

  test('a stored session cookie alone also keeps the account screen away', async ({ page }) => {
    await bootOut(page, { prefs: PREFS, cookie: ['sb-certanvil-auth', 'base64-abc'] });
    expect(await page.evaluate(() => window._certanvilSignedIn)).toBe(false);
    await page.waitForTimeout(1500);
    await expect(acct(page)).toBeHidden();
  });

  test('offline (html.ifr-offline, navigator.onLine false): no account screen', async ({ page }) => {
    await bootOut(page, { prefs: PREFS, offline: true });
    expect(await page.evaluate(() => window._certanvilSignedIn)).toBe(false);
    await page.waitForTimeout(1500);
    await expect(acct(page)).toBeHidden();
    await expect(page.locator('html')).toHaveClass(/ifr-offline/);
  });

  test('Account → Sign out shows "Sign in to keep studying" with no Back', async ({ page }) => {
    await boot(page, { prefs: Object.assign({ tourSeen: '1' }, PREFS) });
    await page.click('#lift-tabbar .lift-tab[data-page="settings"]');
    await expect(page.locator('#ios-settings [data-act="signout"]')).toBeVisible();
    await page.click('#ios-settings [data-act="signout"]');
    await expect(acct(page)).toBeVisible({ timeout: 20000 });
    await expect(acct(page).locator('h1')).toHaveText('Sign in to keep studying');
    await expect(acct(page).locator('[data-act="back"]')).toHaveCount(0);
  });

  test('a code sent from the account step survives a reload; Change returns to the account step with Back', async ({ page }) => {
    await bootOut(page, { prefs: PREFS });
    await expect(acct(page).locator('h1')).toHaveText('Create your account to start');
    await page.fill('#isi-email', 'sam@example.test');
    await page.click('#ios-signin [data-act="continue"]');
    await expect(acct(page)).toContainText('Check your email');
    await page.reload();
    await expect(acct(page)).toContainText('Check your email', { timeout: 8000 });
    await acct(page).locator('.isi-change [data-act="change"]').click();
    await expect(acct(page).locator('h1')).toHaveText('Create your account to start');
    await expect(acct(page).locator('[data-act="back"]')).toBeVisible();
  });

  test('a code sent after the signed-out screen returns to it without Back', async ({ page }) => {
    await bootOut(page, { prefs: PREFS, seed: { nplus_history: HISTORY } });
    await page.fill('#isi-email', 'sam@example.test');
    await page.click('#ios-signin [data-act="continue"]');
    await expect(acct(page)).toContainText('Check your email');
    await page.reload();
    await expect(acct(page)).toContainText('Check your email', { timeout: 8000 });
    await acct(page).locator('.isi-change [data-act="change"]').click();
    await expect(acct(page).locator('h1')).toHaveText('Sign in to keep studying');
    await expect(acct(page).locator('[data-act="back"]')).toHaveCount(0);
  });

  test('relaunch mid-code started from the picker: Change it, Back reopens the picker (not signed-out Home)', async ({ page }) => {
    await bootOut(page);
    await expect(picker(page)).toContainText('Which exam are you studying for?');
    await page.click('#onb-firstrun [data-act="signin"]');
    await page.fill('#isi-email', 'sam@example.test');
    await page.click('#ios-signin [data-act="continue"]');
    await expect(acct(page)).toContainText('Check your email');
    await page.reload(); await page.waitForLoadState('load');
    await expect(acct(page)).toContainText('Check your email', { timeout: 8000 });
    await acct(page).locator('.isi-change [data-act="change"]').click();
    await acct(page).locator('[data-act="back"]').click();
    await expect(picker(page)).toContainText('Which exam are you studying for?', { timeout: 5000 });
    await expect(picker(page)).toBeVisible();
    await expect(acct(page)).toBeHidden();
  });

  test('picker -> Sign in -> Back with the picker still underneath just closes the account screen', async ({ page }) => {
    await bootOut(page);
    await page.click('#onb-firstrun [data-act="signin"]');
    await expect(acct(page)).toBeVisible();
    await acct(page).locator('[data-act="back"]').click();
    await expect(acct(page)).toBeHidden();
    await expect(picker(page)).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/ifr-picking/);
  });
});

test.describe('F3: the flows on the website', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('mobile web, 390px, signed out: no day-0, the normal Home with Sign in, no account screen', async ({ page }) => {
    await bootOut(page, { native: false, size: { width: 390, height: 844 }, seed: SKIP });
    await expect(page.locator('html')).not.toHaveClass(/ifr-day0/);
    await expect(acct(page)).toBeHidden();
    await expect(picker(page)).toBeHidden();
    await expect(page.locator('#ios-home .ih-tb-signin')).toBeVisible();
  });

  test('mobile web, 390px, signed out and brand new: still no day-0 and no account screen', async ({ page }) => {
    await bootOut(page, { native: false, size: { width: 390, height: 844 } });
    await expect(page.locator('html')).not.toHaveClass(/ifr-day0/);
    await expect(acct(page)).toBeHidden();
    await expect(picker(page)).toBeHidden();
    await expect(page.locator('#ios-home .ih-tb-signin')).toBeVisible();
  });

  test('desktop, 1280px: first run and Home unchanged', async ({ page }) => {
    await bootOut(page, { native: false, size: { width: 1280, height: 800 } });
    await expect(acct(page)).toBeHidden();
    await expect(picker(page)).toBeHidden();
    await expect(page.locator('html')).not.toHaveClass(/ifr-day0/);
    await expect(page.locator('#ios-home')).toBeHidden();
    await expect(page.locator('#page-setup')).toHaveClass(/\bactive\b/);
    await expect(page.locator('a.topbar-signin-pill')).toBeVisible();
  });
});
