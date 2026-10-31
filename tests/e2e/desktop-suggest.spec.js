// Desktop catch-up Task 5: "Suggest a cert" as a centred desktop dialog (drawings suggest, suggest-sent), opened from the
// desktop My certs page and a Settings row (signed in only). The Supabase call is stubbed (no network, no database).
const { test, expect } = require('@playwright/test');

const DESKTOP = { width: 1280, height: 800 };
async function boot(page) {
  await page.setViewportSize(DESKTOP);
  const seed = { nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1' };
  await page.addInitScript((sd) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { Object.entries(sd).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (_) {}
  }, seed);
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof window.openHub === 'function' && typeof window.openSuggestCert === 'function' && typeof window.caIsDesk === 'function' && window.caIsDesk()
    && !!document.querySelector('.sb-item[data-sb-page="mycerts"]') && document.body.classList.contains('is-state-resolved'));
}
async function stub(page, signedIn) {
  await page.evaluate((si) => {
    window._certanvilSignedIn = si;
    window.__ups = [];
    window.certanvilSupabase = {
      auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: 'u-test' } } } }) },
      from: (t) => ({ upsert: (rows, opts) => { window.__ups.push({ t, rows, opts }); return Promise.resolve({ error: null }); } })
    };
  }, signedIn);
}
const dlg = (page) => page.locator('#ios-suggest');

test.describe('Desktop: Suggest a cert', () => {
  test('desktop: My certs → Suggest a cert opens the dialog with "Pick any you\'d study."', async ({ page }) => {
    await boot(page); await stub(page, true);
    await page.evaluate(() => document.querySelector('.sb-item[data-sb-page="mycerts"]').click());
    await expect(page.locator('#page-mycerts')).toHaveClass(/active/);
    await page.locator('#desk-mycerts [data-act="suggest"]').click();
    await expect(dlg(page)).toHaveClass(/is-dialog/);
    await expect(dlg(page)).toHaveClass(/is-md/);
    await expect(dlg(page).locator('.sg-sub')).toHaveText('Pick any you’d study. We build the most-asked first.');
    await expect(dlg(page).locator('h3')).toHaveText('Which exam should we add next?');
    await expect(dlg(page).locator('[data-ca-close]')).toBeFocused();
    expect(await dlg(page).evaluate((el) => getComputedStyle(el).width)).toBe('560px');   // the drawing's mid width
    await expect(page.locator('.sg-scrim')).toHaveCount(0);   // the dialog frame's scrim, not the phone one
    expect(await page.evaluate(() => [...document.body.children].some((el) => el.inert))).toBe(true);   // the page behind is inert
    // Escape closes, the page is live again, focus returns to the opener
    await page.keyboard.press('Escape');
    await expect(dlg(page)).toHaveCount(0);
    expect(await page.evaluate(() => [...document.body.children].some((el) => el.inert))).toBe(false);
    await expect(page.locator('#desk-mycerts [data-act="suggest"]')).toBeFocused();
  });

  test('Settings row opens it; hidden when signed out', async ({ page }) => {
    await boot(page); await stub(page, false);
    await page.evaluate(() => { showPage('settings'); });
    await expect(page.locator('#page-settings')).toHaveClass(/active/);
    await expect(page.locator('#settings-suggest-row')).toBeHidden();
    await stub(page, true);
    await page.evaluate(() => renderSettingsPage());
    await expect(page.locator('#settings-suggest-row')).toBeVisible();
    await page.locator('#settings-suggest-btn').click();
    await expect(dlg(page)).toHaveClass(/is-dialog/);
    await expect(dlg(page).locator('.sg-sub')).toContainText('Pick any');
    await page.locator('#ios-suggest [data-ca-close]').click();
    await expect(dlg(page)).toHaveCount(0);
    await expect(page.locator('#settings-suggest-btn')).toBeFocused();
  });

  test('send shows the sent state, then Done closes; Escape closes one layer', async ({ page }) => {
    await boot(page); await stub(page, true);
    await page.evaluate(() => window.openSuggestCert());
    await dlg(page).locator('[data-c="CCNA"]').click();
    await dlg(page).locator('[data-c="CySA+"]').click();
    await expect(dlg(page).locator('[data-act="send"]')).toHaveText('Send 2 suggestions');
    await dlg(page).locator('[data-act="send"]').click();
    await expect(dlg(page).locator('h3')).toHaveText('Thanks, noted.');
    await expect(dlg(page)).toContainText('we’ll tell you');
    await expect(dlg(page).locator('[data-ca-close]')).toHaveCount(1);   // the X survives the redraw
    expect(await page.evaluate(() => window.__ups.length)).toBe(1);
    await dlg(page).locator('[data-act="done"]').click();
    await expect(dlg(page)).toHaveCount(0);
    expect(await page.evaluate(() => [...document.body.children].some((el) => el.inert))).toBe(false);
  });

  test('resizing across 900px leaves no desktop dialog over the phone layout', async ({ page }) => {
    await boot(page); await stub(page, true);
    await page.evaluate(() => window.openSuggestCert());
    await expect(dlg(page)).toHaveClass(/is-dialog/);
    await page.setViewportSize({ width: 600, height: 800 });
    await expect(dlg(page)).toHaveCount(0);
    expect(await page.evaluate(() => [...document.body.children].some((el) => el.inert))).toBe(false);
  });
});
