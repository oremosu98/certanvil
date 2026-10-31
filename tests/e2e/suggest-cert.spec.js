// Persona bundle Task 14: Suggest a cert sheet. The Supabase call is stubbed (no network, no database); opening from the
// My certs hub layers the sheet above it and Escape closes one layer at a time. Spec: 2026-10-30-ai-budget-fast-start-suggest-design.md §3
const { test, expect } = require('@playwright/test');

const PHONE = { width: 390, height: 844 };
async function boot(page) {
  await page.setViewportSize(PHONE);
  const seed = { nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1' };
  await page.addInitScript((sd) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { Object.entries(sd).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (_) {}
  }, seed);
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof window.openHub === 'function' && typeof window.openSuggestCert === 'function' && !!document.querySelector('#ios-home [data-act="cert"]'));
}
// Replace the Supabase client with a recording stub; `mode` decides what the insert returns.
async function stub(page, mode) {
  await page.evaluate((m) => {
    window._certanvilSignedIn = true;
    window.__ups = [];
    window.certanvilSupabase = {
      auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: 'u-test' } } } }) },
      from: (t) => ({ upsert: (rows, opts) => { window.__ups.push({ t, rows, opts }); return Promise.resolve(m === 'ok' ? { error: null } : m === 'dup' ? { error: { code: '23505' } } : { error: { code: '42P01', status: 404, message: 'relation "cert_requests" does not exist' } }); } })
    };
  }, mode);
}
const sheet = (page) => page.locator('#ios-suggest');

test.describe('Suggest a cert', () => {
  test('sheet content, typed row rules, send count, thanks, and the stubbed insert', async ({ page }) => {
    await boot(page); await stub(page, 'ok');
    await page.evaluate(() => window.openSuggestCert());
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page).locator('.sg-eyebrow')).toHaveText('Help shape CertAnvil');
    await expect(sheet(page).locator('h3')).toHaveText('Which exam should we add next?');
    await expect(sheet(page).locator('.sg-vendor')).toHaveText(['Cisco', 'CompTIA', 'AWS', 'Microsoft', 'ISC2', 'Google Cloud']);
    await expect(sheet(page).locator('.sg-else')).toContainText('Something else?');
    await expect(sheet(page).locator('[data-act="send"]')).toHaveText('Pick at least one');
    await expect(sheet(page).locator('[data-act="send"]')).toBeDisabled();
    await sheet(page).locator('[data-c="CCNA"]').click();
    await expect(sheet(page).locator('[data-act="send"]')).toHaveText('Send 1 suggestion');
    await sheet(page).locator('#sg-q').fill('CCNA');
    await expect(sheet(page).locator('.sg-add')).toHaveCount(0);   // exact match: no typed row
    await sheet(page).locator('#sg-q').fill('Cloud Security');
    await expect(sheet(page).locator('.sg-add')).toContainText('Suggest “Cloud Security”');
    await expect(sheet(page).locator('.sg-else')).toHaveCount(0);
    await sheet(page).locator('.sg-add').click();
    await expect(sheet(page).locator('#sg-q')).toHaveValue('');
    await expect(sheet(page).locator('.sg-add')).toContainText('Your suggestion');
    await expect(sheet(page).locator('[data-act="send"]')).toHaveText('Send 2 suggestions');
    await sheet(page).locator('[data-act="send"]').click();
    await expect(sheet(page).locator('h3')).toHaveText('Thanks, noted.');
    await expect(sheet(page).locator('.sg-done p')).toHaveText('When CCNA or Cloud Security lands, we’ll tell you.');
    const ups = await page.evaluate(() => window.__ups);
    expect(ups).toHaveLength(1);
    expect(ups[0].opts).toEqual({ onConflict: 'user_id,exam_key', ignoreDuplicates: true });
    expect(ups[0].rows.map((r) => [r.exam_key, r.typed, r.user_id])).toEqual([['ccna', false, 'u-test'], ['cloud security', true, 'u-test']]);
    await sheet(page).locator('[data-act="done"]').click();
    await expect(sheet(page)).toHaveCount(0);
  });

  test('missing table queues the request and still says thanks; the next Home retries it', async ({ page }) => {
    await boot(page); await stub(page, 'missing');
    await page.evaluate(() => window.openSuggestCert());
    await sheet(page).locator('[data-c="CISSP"]').click();
    await sheet(page).locator('[data-act="send"]').click();
    await expect(sheet(page).locator('h3')).toHaveText('Thanks, noted.');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nplus_cert_req_pending')))).toEqual([{ u: 'u-test', label: 'CISSP' }]);
    await stub(page, 'ok');   // the founder has pasted the migration
    await page.evaluate(() => window.dispatchEvent(new Event('ca:home-shown')));
    await expect.poll(() => page.evaluate(() => window.__ups.length)).toBe(1);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('nplus_cert_req_pending'))).toBeNull();
  });

  test('a duplicate vote is fine and queues nothing', async ({ page }) => {
    await boot(page); await stub(page, 'dup');
    await page.evaluate(() => window.openSuggestCert());
    await sheet(page).locator('[data-c="CCNA"]').click();
    await sheet(page).locator('[data-act="send"]').click();
    await expect(sheet(page).locator('h3')).toHaveText('Thanks, noted.');
    expect(await page.evaluate(() => localStorage.getItem('nplus_cert_req_pending'))).toBeNull();
  });

  test('from the hub: link opens the sheet above it, Escape closes one layer, focus returns to the link', async ({ page }) => {
    await boot(page); await stub(page, 'ok');
    await page.evaluate(() => { _quotaState = { tier: 'pro', daily_limit: -1 }; document.querySelector('#ios-home [data-act="cert"]').click(); });
    const hub = page.locator('#ios-hub');
    await expect(hub).toBeVisible();
    const link = hub.locator('.ihb-suggest');
    await expect(link).toHaveText('Don\'t see yours? Suggest a cert');
    await link.click();
    await expect(sheet(page)).toBeVisible();
    // the sheet is above the hub and not inert
    expect(await page.evaluate(() => { const s = document.getElementById('ios-suggest'); return !s.closest('[inert]') && Number(getComputedStyle(s).zIndex) > 0; })).toBe(true);
    await sheet(page).locator('[data-c="CCNA"]').click();
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);
    await expect(hub).toBeVisible();   // the hub did not close with it
    expect(await page.evaluate(() => document.activeElement && document.activeElement.className)).toContain('ihb-suggest');
    await page.keyboard.press('Escape');
    await expect(hub).toBeHidden();
  });
});
