// Account deletion (29 Oct): certanvil.com/account deletes through the server, signs out everywhere and sends you home with a notice;
// a sign-in that cancelled a deletion says so once. Supabase is tests/fixtures/fake-supabase.js.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const FAKE = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'fake-supabase.js'), 'utf8');
const DIALOG_LINE = 'Changed your mind? Sign back in within 7 days and your account stays.';
const AFTER_DELETING = 'Your account will be deleted in 7 days. Sign back in before then to keep it.';
const NOTICE = "Welcome back. We've cancelled the deletion and your account is safe.";

async function route(page, fake) {
  const F = Object.assign({}, fake || {});
  await page.route('**/lib/supabase.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB=' + JSON.stringify(F) + ';' + FAKE }));
}
const rpcCalls = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('__rpcCalls') || '[]'));

test.describe('website account deletion', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('/account delete: dialog line, rpc, global sign-out, home with the toast', async ({ page }) => {
    await route(page);
    let dialogMsg = '';
    page.on('dialog', (d) => { dialogMsg = d.message(); d.accept(); });
    await page.goto('/account');
    await expect(page.locator('#btn-delete-account')).toBeVisible();
    await page.evaluate(() => { localStorage.removeItem('__rpcCalls'); window.__order = []; });
    await page.click('#btn-delete-account');
    await page.waitForURL((u) => u.pathname === '/' , { timeout: 8000 });
    expect(dialogMsg).toContain(DIALOG_LINE);
    expect(dialogMsg).not.toContain('Cancel deletion');
    await expect(page.locator('#toast-stack .toast')).toHaveText(AFTER_DELETING);
    expect(page.url()).not.toContain('deleted');
    expect(await rpcCalls(page)).toEqual(['request_account_deletion']);
  });

  test('/account delete: rpc order is rpc then global sign-out', async ({ page }) => {
    await route(page);
    page.on('dialog', (d) => d.accept());
    await page.goto('/account');
    await expect(page.locator('#btn-delete-account')).toBeVisible();
    await page.evaluate(() => {
      const sb = window.certanvilSupabase, rpc = sb.rpc, so = sb.auth.signOut;
      window.__seq = [];
      sb.rpc = function (n) { window.__seq.push('rpc:' + n); return rpc.apply(sb, arguments); };
      sb.auth.signOut = function (o) { window.__seq.push('auth:signOut:' + ((o && o.scope) || 'local')); window.__seqSaved = window.__seq.slice(); sessionStorage.setItem('seq', JSON.stringify(window.__seq)); return so.apply(sb.auth, arguments); };
    });
    await page.click('#btn-delete-account');
    await page.waitForURL((u) => u.pathname === '/', { timeout: 8000 });
    expect(JSON.parse(await page.evaluate(() => sessionStorage.getItem('seq')))).toEqual(['rpc:request_account_deletion', 'auth:signOut:global']);
  });

  for (const [name, fake] of [['an rpc error', { rpcError: true }], ['a NULL result', { rpcNull: true }]]) {
    test(`/account delete: ${name} keeps you signed in with the failure toast`, async ({ page }) => {
      await route(page, fake);
      page.on('dialog', (d) => d.accept());
      await page.goto('/account');
      await expect(page.locator('#btn-delete-account')).toBeVisible();
      await page.click('#btn-delete-account');
      await expect(page.locator('#toast-stack .toast')).toHaveText("Couldn't schedule deletion. Try again.");
      expect(new URL(page.url()).pathname).toBe('/account');
      expect(await page.evaluate(() => window.__fakeLog)).not.toContain('auth:signOut:global');
    });
  }

  test('a sign-in that cancelled a deletion shows the notice once and clears it', async ({ page }) => {
    await route(page, { deletionCancelled: true });
    await page.goto('/');
    await expect(page.locator('#toast-stack .toast')).toHaveText(NOTICE);
    await expect(page.locator('#toast-stack .toast')).toHaveCount(1);
    await page.evaluate(() => window.__fakeEmit('SIGNED_IN'));
    await page.waitForTimeout(300);
    await expect(page.locator('#toast-stack .toast')).toHaveCount(1);
    expect(await rpcCalls(page)).toEqual(['clear_deletion_notice']);
    await page.reload();
    await page.waitForTimeout(500);
    await expect(page.locator('#toast-stack .toast')).toHaveCount(0);
    expect(await rpcCalls(page)).toEqual(['clear_deletion_notice']);
  });

  test('no notice and no rpc when nothing was cancelled', async ({ page }) => {
    await route(page);
    await page.goto('/');
    await page.waitForTimeout(500);
    await expect(page.locator('#toast-stack .toast')).toHaveCount(0);
    expect(await rpcCalls(page)).toEqual([]);
  });

  test('?deleted=1 shows the after-deleting toast and drops the param', async ({ page }) => {
    await route(page, { signedOut: true });
    await page.goto('/?deleted=1&x=2');
    await expect(page.locator('#toast-stack .toast')).toHaveText(AFTER_DELETING);
    expect(page.url()).not.toContain('deleted');
    expect(page.url()).toContain('x=2');
  });
});
