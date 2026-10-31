// Desktop catch-up Task 4: "My certs" as a desktop page (drawing desktop-catchup.html?v=mycerts). The sidebar's
// Account section gets My certs above Settings; openHub() on desktop shows #page-mycerts through showPage. Same model
// and rules as the phone hub (features/ios-hub.js): Free studies one cert, every other cert sits behind one folded
// "Unlock every cert with Pro" row, and Free can never switch. Settings' "Your Pass Plans" list becomes a My certs row.
const { test, expect } = require('@playwright/test');

const DESKTOP = { width: 1280, height: 800 };
function dayOffset(n) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

async function boot(page) {
  await page.setViewportSize(DESKTOP);
  const now = new Date().toISOString();
  // localhost-only fixture seeds, in this test's own isolated browser context
  const seed = { nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1',
    nplus_exam_dates: JSON.stringify({ netplus: dayOffset(30), secplus: dayOffset(18) }),
    nplus_exam_outcomes: JSON.stringify({ az900: { outcome: 'passed', score: 767, date: dayOffset(-20) } }),
    nplus_readiness_snapshots: JSON.stringify({ netplus: { score: 553, computed_at: now }, secplus: { score: 612, computed_at: now } }) };
  await page.addInitScript((sd) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { Object.entries(sd).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (_) {}
  }, seed);
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof window.openHub === 'function' && typeof window.caIsDesk === 'function' && window.caIsDesk()
    && !!document.querySelector('.sb-item[data-sb-page="mycerts"]') && typeof window.getAvailableCerts === 'function'
    && document.body.classList.contains('is-state-resolved'));   // the cert registry (auth-state.js) and the signed-out quota reset land late
  // a stub that records switches; real switching reloads the page
  await page.evaluate(() => { window.__sw = []; window.tadSwitchCert = (id) => { window.__sw.push(id); return true; }; });
}
// the plan and the click in one tick: a late sign-out event can reset the quota state between two evaluates
const openAs = (page, plan) => page.evaluate((p) => {
  _quotaState = p === 'pro' ? { tier: 'pro', daily_limit: -1 } : p === 'free' ? { tier: 'free', daily_limit: 15 } : null;
  document.querySelector('.sb-item[data-sb-page="mycerts"]').click();
}, plan);
const host = (page) => page.locator('#desk-mycerts');

test.describe('Desktop: My certs', () => {
  test('desktop: the sidebar shows My certs under Account and opens the page with the greeting and the three numbers', async ({ page }) => {
    await boot(page);
    const account = page.locator('#app-sidebar .sb-section').filter({ has: page.locator('.sb-section-label', { hasText: 'Account' }) });
    await expect(account.locator('.sb-item')).toHaveText([/My certs/, /Settings/]);
    await openAs(page, 'free');
    await expect(page.locator('#page-mycerts')).toHaveClass(/active/);
    await expect(page.locator('.sb-item[data-sb-page="mycerts"]')).toHaveClass(/sb-item-active/);
    await expect(page.locator('#topbar-crumb')).toHaveText('My certs');
    await expect(page.locator('#page-mycerts h1')).toBeFocused();
    await expect(host(page).locator('.dmc-greet')).toContainText(/^(Morning|Afternoon|Evening)/);
    await expect(host(page).locator('.dmc-stat span')).toHaveText(['Readiness', 'Due today', 'Day streak']);
    await expect(host(page).locator('.dmc-stat b').first()).toHaveText('553');
    await expect(page.locator('#ios-hub')).toHaveCount(0);   // no phone overlay on desktop
    // Continue goes back to Home
    await host(page).locator('[data-act="continue"]').click();
    await expect(page.locator('#page-setup')).toHaveClass(/active/);
  });

  test('Free: other certs are locked and the Pro row opens the Pro sheet; no switching', async ({ page }) => {
    await boot(page);
    await openAs(page, 'free');
    const h = host(page);
    await expect(h.locator('.dmc-sect b')).toHaveText(['Your cert', 'Other certs']);
    await expect(h.locator('.dmc-sect span').first()).toHaveText('Free plan');
    await expect(h.locator('.dmc-ac .dmc-nm')).toHaveText('Network+');
    await expect(h.locator('.dmc-ac .dmc-badge')).toHaveText('Active');
    await expect(h.locator('[data-act="continue"]')).toHaveText('Continue Network+');
    await expect(h.locator('[data-act="continue"]')).toHaveClass(/dmc-pri/);
    await expect(h.locator('[data-act="log"]')).toHaveText('Took your exam? Log your result');
    await expect(h.locator('[data-act="open-cert"]')).toHaveCount(0);   // no cert tiles at all on Free
    await expect(h.locator('.dmc-locked')).toContainText('Unlock every cert with Pro');
    await expect(h.locator('.dmc-locked')).toContainText(/ and more/);
    // the Go Pro card: an outline button, so Continue stays the one main action
    const pro = h.locator('.dmc-procard');
    await expect(pro).toContainText('On Free, you study one cert');
    await expect(pro).toContainText('Study every cert with Pro');
    await expect(pro.locator('.dmc-gopro')).toHaveText('Go Pro');
    await expect(pro.locator('.dmc-gopro')).not.toHaveClass(/dmc-pri/);
    await expect(pro).toContainText('From $7.42 a month. Cancel anytime.');
    await h.locator('.dmc-locked').click();
    await expect(page.locator('#pro-only-modal')).toBeVisible();
    await expect(page.locator('#pro-only-modal')).toContainText('Every cert comes with Pro');
    await page.locator('#pro-only-dismiss').click();
    expect(await page.evaluate(() => window.__sw.length)).toBe(0);
    // even a forged open-cert on the Free page does not switch
    await page.evaluate(() => { const b = document.createElement('button'); b.setAttribute('data-act', 'open-cert'); b.setAttribute('data-id', 'secplus'); document.getElementById('desk-mycerts').appendChild(b); b.click(); });
    expect(await page.evaluate(() => window.__sw.length)).toBe(0);
  });

  test('Pro: tapping another cert switches', async ({ page }) => {
    await boot(page);
    await openAs(page, 'pro');
    const h = host(page);
    await expect(h.locator('.dmc-sect b')).toHaveText(['My certs', 'Other certs']);
    await expect(h.locator('.dmc-sect span')).toHaveText(['all certs', 'nearest exam first']);
    await expect(h.locator('.dmc-stat span')).toHaveText(['Next exam', 'Passed', 'Day streak']);
    await expect(h.locator('.dmc-stat b').first()).toContainText('18');
    await expect(h.locator('.dmc-locked')).toHaveCount(0);
    await expect(h.locator('.dmc-procard')).toHaveCount(0);
    const tiles = h.locator('.dmc-cg');
    await expect(tiles.first()).toContainText('Security+');
    await expect(tiles.first()).toContainText('Exam in 18 days');
    await expect(tiles.first()).toContainText('612');
    await expect(h.locator('.dmc-cg.dmc-pass')).toContainText('Scored 767');
    await h.locator('.dmc-cg[data-id="secplus"]').click();
    expect(await page.evaluate(() => window.__sw)).toEqual(['secplus']);
  });

  test('the plan arriving late redraws the page in place', async ({ page }) => {
    await boot(page);
    await openAs(page, null);
    const h = host(page);
    await expect(h.locator('.dmc-sect b')).toHaveText(['Your cert', 'Other certs']);
    await page.evaluate(() => { _quotaState = { tier: 'pro', daily_limit: -1 }; window.dispatchEvent(new Event('ca:quota-ready')); });
    await expect(h.locator('.dmc-sect b').first()).toHaveText('My certs');
    await expect(h.locator('.dmc-locked')).toHaveCount(0);
    await expect(page.locator('#page-mycerts')).toHaveClass(/active/);
    // a redraw while another page is showing leaves that page alone
    await page.evaluate(() => showPage('setup'));
    await expect(page.locator('#page-setup')).toHaveClass(/active/);
    await page.evaluate(() => { window.dispatchEvent(new Event('ca:quota-ready')); });
    await expect(page.locator('#page-setup')).toHaveClass(/active/);
  });

  test('Settings shows a My certs row instead of the Pass Plans list', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => { document.body.classList.add('is-standalone'); _quotaState = { tier: 'pro', daily_limit: -1 }; document.querySelector('.sb-item[data-sb-page="settings"]').click(); });
    await expect(page.locator('#page-settings')).toHaveClass(/active/);
    const pp = page.locator('#passplan-section');
    await expect(pp.locator('[data-act="pp-mycerts"]')).toBeVisible();
    await expect(pp.locator('[data-act="pp-mycerts"]')).toContainText('My certs');
    await expect(pp).not.toContainText('Your Pass Plans');
    await expect(pp.locator('.plan-list')).toHaveCount(0);
    await pp.locator('[data-act="pp-mycerts"]').click();
    await expect(page.locator('#page-mycerts')).toHaveClass(/active/);
  });

  test('resizing across 900px moves between the page and the phone hub, never both', async ({ page }) => {
    await boot(page);
    await openAs(page, 'pro');
    await expect(page.locator('#page-mycerts')).toHaveClass(/active/);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#ios-hub')).toBeVisible();
    await expect(page.locator('#page-mycerts')).not.toHaveClass(/active/);
    await page.setViewportSize(DESKTOP);
    await expect(page.locator('#page-mycerts')).toHaveClass(/active/);
    await expect(page.locator('#ios-hub')).toBeHidden();
    expect(await page.evaluate(() => [].some.call(document.body.children, (el) => el.inert))).toBe(false);
  });
});
