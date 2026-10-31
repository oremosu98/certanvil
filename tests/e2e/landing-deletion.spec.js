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
    await page.evaluate(() => { localStorage.removeItem('__rpcCalls'); });
    // __fakeLog dies with the page; mirror it to sessionStorage on every sign-out so the order survives the navigation home.
    await page.evaluate(() => {
      const so = window.certanvilSupabase.auth.signOut;
      window.certanvilSupabase.auth.signOut = function () { const r = so.apply(this, arguments); sessionStorage.setItem('log', JSON.stringify(window.__fakeLog)); return r; };
    });
    await page.click('#btn-delete-account');
    await page.waitForURL((u) => u.pathname === '/', { timeout: 8000 });
    expect(dialogMsg).toContain(DIALOG_LINE);
    expect(dialogMsg).not.toContain('Cancel deletion');
    await expect(page.locator('#toast-stack .toast')).toHaveText(AFTER_DELETING);
    expect(page.url()).not.toContain('deleted');
    const log = JSON.parse(await page.evaluate(() => sessionStorage.getItem('log')));
    expect(log.filter((e) => /^(rpc:request_account_deletion|auth:signOut:)/.test(e))).toEqual(['rpc:request_account_deletion', 'auth:signOut:global']);
  });

  test('/account delete: offline, a failed global sign-out clears this device\'s session before going home', async ({ page }) => {
    await route(page, { signOutOffline: true });
    page.on('dialog', (d) => d.accept());
    await page.goto('/account');
    await expect(page.locator('#btn-delete-account')).toBeVisible();
    await page.evaluate(() => {
      const a = window.certanvilSupabase.auth, so = a.signOut, rm = a._removeSession;
      a.signOut = function () { const r = so.apply(this, arguments); sessionStorage.setItem('log', JSON.stringify(window.__fakeLog)); return r; };
      // '1' once the session is really gone (checked before the page leaves)
      a._removeSession = function () { return rm.apply(this, arguments).then(() => a.getSession()).then((r) => { sessionStorage.setItem('removed', r.data.session ? '0' : '1'); }); };
    });
    await page.click('#btn-delete-account');
    await page.waitForURL((u) => u.pathname === '/', { timeout: 8000 });
    await expect(page.locator('#toast-stack .toast')).toHaveText(AFTER_DELETING);
    const log = JSON.parse(await page.evaluate(() => sessionStorage.getItem('log')));
    // v8.198.1: no second network sign-out (offline it fails too); the stored session goes without the network
    expect(log.filter((e) => /^auth:(signOut|removeSession)/.test(e))).toEqual(['auth:signOut:global']);
    expect(await page.evaluate(() => sessionStorage.getItem('removed'))).toBe('1');
  });

  test('/account delete: offline, if the session cannot be cleared it stays and says so', async ({ page }) => {
    await route(page, { signOutOffline: true, removeSessionFails: true });
    page.on('dialog', (d) => d.accept());
    await page.goto('/account');
    await expect(page.locator('#btn-delete-account')).toBeVisible();
    await page.click('#btn-delete-account');
    await expect(page.locator('#toast-stack .toast')).toHaveText(
      "Your account will be deleted in 7 days. We couldn't sign you out on this device, so sign out here when you're back online.");
    expect(new URL(page.url()).pathname).toBe('/account');
    expect(await rpcCalls(page)).toContain('request_account_deletion');
    expect(await page.evaluate(() => window.certanvilSupabase.auth.getSession().then((r) => !!(r.data && r.data.session)))).toBe(true);
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
    // the flag is gone after the rpc really ran: a reload shows no notice and sends no second rpc
    await page.reload();
    await page.waitForTimeout(500);
    await expect(page.locator('#toast-stack .toast')).toHaveCount(0);
    expect(await rpcCalls(page)).toEqual(['clear_deletion_notice']);
    expect(await page.evaluate(() => window.__FAKE_PROFILE.metadata.deletion_cancelled_at)).toBeUndefined();
  });

  // A sign-in on certanvil.com with ?action=signin&return= bounces to the app 250ms later; the app shows and clears the
  // notice, so the landing must not (its toast would flash and the clear would leave the app nothing to show).
  const RETURN = 'https://networkplus.certanvil.com/';
  async function landingStorage(page) { // the landing's localStorage, read from a script-free page on its origin
    await page.route('**/__probe', (r) => r.fulfill({ contentType: 'text/html', body: '<p>probe</p>' }));
    await page.goto('/__probe');
    return page.evaluate(() => ({ rpc: JSON.parse(localStorage.getItem('__rpcCalls') || '[]'), cleared: localStorage.getItem('__fakeNoticeCleared') }));
  }
  for (const [name, fake] of [['a code sign-in', { signedOut: true }], ['an existing session', {}]]) {
    test(`${name} that bounces to return= leaves the notice for the app`, async ({ page }) => {
      await route(page, Object.assign({ deletionCancelled: true }, fake));
      await page.route('https://networkplus.certanvil.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<p>cert app</p>' }));
      await page.goto('/?action=signin&return=' + encodeURIComponent(RETURN));
      if (fake.signedOut) {
        await expect(page.locator('#auth-modal')).toBeVisible();
        await page.fill('#auth-email', 'sam@example.test');
        await page.click('#auth-submit');
        await expect(page.locator('#auth-sent')).toBeVisible();
        await page.locator('#auth-otp-boxes input').first().focus();
        await page.keyboard.type('123456', { delay: 30 });
      }
      await page.waitForURL(RETURN, { timeout: 8000 });
      const s = await landingStorage(page);
      expect(s.rpc).not.toContain('clear_deletion_notice');
      expect(s.cleared).toBeNull();
    });
  }

  test('?deleted=1 shows the after-deleting toast and drops the param', async ({ page }) => {
    await route(page, { signedOut: true });
    await page.goto('/?deleted=1&x=2');
    await expect(page.locator('#toast-stack .toast')).toHaveText(AFTER_DELETING);
    expect(page.url()).not.toContain('deleted');
    expect(page.url()).toContain('x=2');
  });
});
