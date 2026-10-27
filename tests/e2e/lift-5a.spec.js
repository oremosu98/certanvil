// Stage 5a (v8.195.0): the iOS native shell. Native paths run with the app's UA suffix and a stubbed
// window.Capacitor (in-memory Preferences, Haptics/Browser/StatusBar call logs); the website runs without them.
const { test, expect } = require('@playwright/test');

const PHONE = { width: 390, height: 844 };

test.describe('Stage 5a on the website', () => {
  test('the website never marks html.is-native', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/'); await page.waitForLoadState('load'); await page.waitForTimeout(500);
    await expect(page.locator('html')).not.toHaveClass(/is-native/);
    expect(await page.evaluate(() => window.CA_NATIVE)).toBe(false);
  });
});

// ── Native harness: the app's UA + a stubbed Capacitor bridge. Preferences live in this origin's localStorage under
// __prefs (app-wide in the real app; one origin here because localhost switches cert with ?cert=). __prefDelay slows writes.
const fs = require('fs');
const path = require('path');
const FAKE = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'fake-supabase.js'), 'utf8');
const NATIVE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 CertAnvilApp';
function stubScript() {
  return () => {
    const read = () => { try { return JSON.parse(localStorage.getItem('__prefs') || '{}'); } catch (_) { return {}; } };
    const write = (o) => localStorage.setItem('__prefs', JSON.stringify(o));
    const delay = () => Number(localStorage.getItem('__prefDelay') || 0);
    window.__hapt = [];
    window.Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        Preferences: {
          get: ({ key }) => Promise.resolve({ value: read()[key] == null ? null : read()[key] }),
          set: ({ key, value }) => new Promise((r) => setTimeout(() => { const o = read(); o[key] = value; write(o); r(); }, delay())),
          remove: ({ key }) => new Promise((r) => setTimeout(() => { const o = read(); delete o[key]; write(o); r(); }, delay()))
        },
        Haptics: { impact: (o) => { window.__hapt.push('impact:' + o.style); return Promise.resolve(); }, notification: (o) => { window.__hapt.push('notify:' + o.type); return Promise.resolve(); } },
        Browser: { open: () => Promise.resolve() },
        StatusBar: { setStyle: () => Promise.resolve() }
      }
    };
  };
}
// opts: {prefs: {...}, signed, query, seed: {k: v}}
async function bootNative(page, opts) {
  opts = opts || {};
  await page.setViewportSize(PHONE);
  if (opts.signed) await page.route('**/lib/supabase.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB={"role":"user","noResults":true,"metaOverride":{"tier":"free","entitlements":{}}};' + FAKE }));
  await page.addInitScript(([prefs, seed]) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1');
      if (prefs) localStorage.setItem('__prefs', JSON.stringify(prefs));
      Object.keys(seed || {}).forEach((k) => localStorage.setItem(k, seed[k]));
    }
  }, [opts.prefs || null, opts.seed || {}]);
  await page.addInitScript(stubScript());
  await page.goto('/' + (opts.query || ''));
  await page.waitForLoadState('load');
  await page.waitForTimeout(900);
}
const prefs = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('__prefs') || '{}'));

test.describe('Stage 5a in the app: first launch, the saved choice, the lock', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });
  test('a fresh install opens the picker on Network+', async ({ page }) => {
    await bootNative(page);
    await expect(page.locator('html')).toHaveClass(/is-native/);
    await expect(page.locator('#onb-firstrun')).toBeVisible();
    await expect(page.locator('#onb-firstrun')).toContainText('Pick your exam');
    await expect(page.locator('#onb-firstrun [data-act="lock"]')).toHaveText('Lock in Network+');
  });
  test('choose writes all keys before goToCert navigates', async ({ page }) => {
    await bootNative(page, { seed: { __prefDelay: '300' } });
    const r = await page.evaluate(async () => { const t0 = Date.now(); await window.caNative.choose('secplus', { locked: true }); return { ms: Date.now() - t0, p: JSON.parse(localStorage.getItem('__prefs')) }; });
    expect(r.ms).toBeGreaterThanOrEqual(280);
    expect(r.p).toMatchObject({ chosenCert: 'secplus', lockedCert: 'secplus', lastCertHost: 'secplus.certanvil.com' });
  });
  test('a reload after choosing never reopens the picker', async ({ page }) => {
    await bootNative(page, { prefs: { chosenCert: 'netplus', lockedCert: 'netplus', lastCertHost: 'networkplus.certanvil.com' } });
    await expect(page.locator('#onb-firstrun')).toBeHidden();
    await page.reload(); await page.waitForTimeout(900);
    await expect(page.locator('#onb-firstrun')).toBeHidden();
  });
  test('relaunch with nothing chosen reopens the picker', async ({ page }) => {
    await bootNative(page);
    await page.reload(); await page.waitForTimeout(900);
    await expect(page.locator('#onb-firstrun')).toBeVisible();
  });
  test('a locked free user on another cert sees the lock wall with Back to their cert', async ({ page }) => {
    await bootNative(page, { prefs: { chosenCert: 'secplus', lockedCert: 'secplus', lastCertHost: 'secplus.certanvil.com' } });
    await expect(page.locator('#cl-wall')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('#cl-wall .cl-wall-cta')).toHaveText('Back to Security+');
    await expect(page.locator('#cl-wall .cl-wall-pro')).toBeHidden();   // web pricing hidden in the app (3.1.1)
  });
  test('the lock waits for a signed-in tier', async ({ page }) => {
    // Hold the tier as "still loading": the app's own quota writes are ignored until the test lets one through.
    await page.addInitScript(() => {
      let q = null;
      Object.defineProperty(window, '_quotaState', { configurable: true, get: () => q, set: (v) => { if (window.__allowQ) q = v; } });
    });
    await bootNative(page, { signed: true, prefs: { chosenCert: 'secplus', lockedCert: 'secplus', lastCertHost: 'secplus.certanvil.com' } });
    await page.waitForTimeout(3500);
    await expect(page.locator('#cl-wall')).toHaveCount(0);
    await page.evaluate(() => { window.__allowQ = true; window._quotaState = { tier: 'free', used_today: 0, daily_limit: 15 }; });
    await expect(page.locator('#cl-wall')).toBeVisible({ timeout: 6000 });
  });
  test("the locked cert's page records the free cert itself", async ({ page }) => {
    await bootNative(page, { prefs: { chosenCert: 'netplus', lockedCert: 'netplus', lastCertHost: 'networkplus.certanvil.com' } });
    expect(await page.evaluate(() => localStorage.getItem('nplus_freeCertId'))).toBe('netplus');
    expect((await prefs(page)).lastCertHost).toBe('networkplus.certanvil.com');
  });
  test('a pick taps lightly; results tap once', async ({ page }) => {
    await bootNative(page, { prefs: { chosenCert: 'netplus', lockedCert: 'netplus', lastCertHost: 'networkplus.certanvil.com' } });
    await page.evaluate(() => { const b = document.createElement('button'); b.className = 'ifr-opt'; b.id = 'zz-opt'; document.body.appendChild(b); });
    await page.locator('#zz-opt').click();
    await page.evaluate(() => showPage('results'));
    await page.waitForTimeout(600);
    const h = await page.evaluate(() => window.__hapt);
    expect(h.filter((x) => x === 'impact:LIGHT').length).toBe(1);
    expect(h.filter((x) => x === 'notify:SUCCESS').length).toBe(1);
  });
});

// ── Task 4: no web purchase links inside the app (Guideline 3.1.1) ──
test.describe('Stage 5a: no web purchase links in the app', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });
  const LOCKED = { chosenCert: 'netplus', lockedCert: 'netplus', lastCertHost: 'networkplus.certanvil.com' };
  const HIST = JSON.stringify([{ topic: 'Ports', score: 7, total: 10, pct: 70, date: new Date().toISOString(), questions: [] }]);
  async function free(page, used) {
    await page.evaluate((u) => { window._quotaState = { tier: 'free', used_today: u, daily_limit: 15 }; document.body.classList.add('is-state-resolved'); renderIosHome(); }, used);
  }
  test('no Go Pro on Settings', async ({ page }) => {
    await bootNative(page, { signed: true, prefs: LOCKED, seed: { nplus_history: HIST, nplus_onb_skips: '{"at":1}' } });
    await free(page, 0);
    await page.locator('#lift-tabbar .lift-tab[data-page="settings"]').click();
    await page.waitForTimeout(800);
    expect(await page.locator('#ios-settings [data-act="gopro"]').count()).toBeGreaterThan(0);
    for (const el of await page.locator('#ios-settings [data-act="gopro"]').all()) await expect(el).toBeHidden();
  });
  test('no See Pro on capped Home', async ({ page }) => {
    await bootNative(page, { signed: true, prefs: LOCKED, seed: { nplus_history: HIST } });
    await free(page, 15);
    await expect(page.locator('#ios-home')).toContainText("That's today's 15 done.");
    await expect(page.locator('#ios-home .ifr-see')).toBeHidden();
  });
  test('no Go Pro for unlimited on the daily limit; the smaller set stays', async ({ page }) => {
    await bootNative(page, { signed: true, prefs: LOCKED, seed: { nplus_history: HIST } });
    await free(page, 8);
    await page.evaluate(() => _gateSessionSizeForQuota(25, { mode: 'quiz' }));
    await expect(page.locator('#ios-check')).toBeVisible();
    await expect(page.locator('#ios-check [data-act="limit-pro"]')).toBeHidden();
    await expect(page.locator('#ios-check [data-act="limit-small"]')).toBeVisible();
  });
});
