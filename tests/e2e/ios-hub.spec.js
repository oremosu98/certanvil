// Persona bundle Task 12: "My certs" hub. The Home cert name opens it; Pro lists Studying / Passed / Not started and
// a row tap calls tadSwitchCert; Free folds everything into one Pro row. Spec: 2026-10-30-my-certs-hub-design.md
const { test, expect } = require('@playwright/test');

const PHONE = { width: 390, height: 844 };
function dayOffset(n) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

async function boot(page) {
  await page.setViewportSize(PHONE);
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
  await page.waitForFunction(() => typeof window.openHub === 'function' && !!document.querySelector('#ios-home [data-act="cert"]'));
}

test.describe('My certs hub', () => {
  test('Free: Home cert name opens the hub with one folded Pro row that opens the Pro sheet', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => { _quotaState = { tier: 'free', daily_limit: 15 }; document.querySelector('#ios-home [data-act="cert"]').click(); });   // same tick: a late sign-out event resets the quota state
    const hub = page.locator('#ios-hub');
    await expect(hub).toBeVisible();
    await expect(hub.locator('.ihb-h1')).toHaveText('My certs');
    await expect(hub.locator('.ihb-stat span')).toHaveText(['Readiness', 'Due today', 'Day streak']);
    await expect(hub.locator('.ihb-stat b').first()).toHaveText('553');
    await expect(hub.locator('.ihb-greet')).toContainText(/^(Morning|Afternoon|Evening)/);
    await expect(hub.locator('.ihb-sect b')).toHaveText(['Your cert', 'Other certs', 'More']);
    await expect(hub.locator('.ihb-link')).toHaveText([/Settings/, /Account/]);
    await expect(hub.locator('.ihb-row')).toHaveCount(1);
    await expect(hub.locator('.ihb-locked')).toContainText('Unlock every cert with Pro');
    await expect(hub.locator('.ihb-ua-list')).toContainText(/ and more$/);
    await expect(hub.locator('.ihb-suggest')).toHaveCount(0);   // Task 14 has not landed
    await hub.locator('.ihb-locked').click();
    await expect(page.locator('#pro-only-modal')).toBeVisible();
    await page.locator('#pro-only-dismiss').click();
    // Escape closes, Home is live again and focus returns
    await page.keyboard.press('Escape');
    await expect(hub).toBeHidden();
    expect(await page.evaluate(() => document.querySelector('#ios-home').closest('body > *').inert)).toBe(false);
  });

  test('Pro: sections, passed score, and a row tap switches cert', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => { _quotaState = { tier: 'pro', daily_limit: -1 }; window.__sw = []; window.tadSwitchCert = (id) => { window.__sw.push(id); return true; }; document.querySelector('#ios-home [data-act="cert"]').click(); });
    const hub = page.locator('#ios-hub');
    await expect(hub.locator('.ihb-sect b')).toHaveText(['My certs', 'Studying', 'Passed', 'Not started', 'More']);
    await expect(hub.locator('.ihb-studying').first()).toContainText('Exam in 18 days');
    await expect(hub.locator('.ihb-passed')).toContainText('Scored 767');
    await expect(hub.locator('.ihb-stat').first()).toContainText('18');   // next exam: the soonest date
    await expect(hub.locator('.ihb-logresult')).toHaveText('Took your exam? Log your result');
    // the log-result link opens over the hub and returns to it
    await hub.locator('.ihb-logresult').click();
    await expect(page.locator('#ios-log-result')).toBeVisible();
    await page.locator('#ios-log-result [data-act="back"]').click();
    await expect(hub).toBeVisible();
    expect(await hub.evaluate((e) => e.inert)).toBe(false);
    // a switch that goes through closes the hub
    await hub.locator('.ihb-fresh').first().click();
    expect(await page.evaluate(() => window.__sw.length)).toBe(1);
    await expect(hub).toBeHidden();
  });

  test('Escape closes only the top layer: the log screen first, then the hub', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => { _quotaState = { tier: 'pro', daily_limit: -1 }; document.querySelector('#ios-home [data-act="cert"]').click(); });
    const hub = page.locator('#ios-hub'), log = page.locator('#ios-log-result');
    await hub.locator('.ihb-logresult').click();
    await expect(log).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(log).toBeHidden();
    await expect(hub).toBeVisible();
    expect(await page.evaluate(() => !!document.activeElement.closest('#ios-hub'))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(hub).toBeHidden();
  });

  test('A late session email fixes the greeting in place: rows keep identity and focus stays', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => {
      window._certanvilDisplayName = 'jsmith';
      let release; const gate = new Promise((r) => { release = r; });
      window.__release = release;
      window.certanvilSupabase = { auth: { getSession: () => gate.then(() => ({ data: { session: { user: { email: 'jsmith@x.com' } } } })) } };
      _quotaState = { tier: 'pro', daily_limit: -1 };
      document.querySelector('#ios-home [data-act="cert"]').click();
    });
    const hub = page.locator('#ios-hub');
    await expect(hub.locator('.ihb-greet')).toContainText(/, Jsmith\.$/);
    await hub.locator('.ihb-logresult').click();   // the log screen is open over the hub
    await expect(page.locator('#ios-log-result')).toBeVisible();
    await page.evaluate(() => { window.__row = document.querySelector('#ios-hub .ihb-row'); window.__focus = document.activeElement; window.__release(); });
    await expect(hub.locator('.ihb-greet')).toHaveText(/^(Morning|Afternoon|Evening)\.( |$)/);
    const same = await page.evaluate(() => ({ row: window.__row === document.querySelector('#ios-hub .ihb-row'), focus: window.__focus === document.activeElement }));
    expect(same).toEqual({ row: true, focus: true });
    await page.locator('#ios-log-result [data-act="back"]').click();
    await expect(hub).toBeVisible();
  });
});
