// Desktop catch-up Task 7: honest streak lines on desktop (Home momentum, sidebar, top-bar chip, Daily Challenge) and the
// Daily Challenge line on phone. Streak is seeded in storage; "ended" = last study day long ago.
const { test, expect } = require('@playwright/test');

const ENDED = 'Your 11-day streak ended. Your best is 11. A quick set starts a new one.';
function day(offset) { const d = new Date(Date.now() + offset * 86400000); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
async function boot(page, size, streak) {
  await page.setViewportSize(size);
  const seed = { nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1' };
  await page.addInitScript(([sd, st]) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { Object.entries(sd).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (_) {}
    try { if (st) localStorage.setItem(window.__SK || 'nplus_streak', JSON.stringify(st)); } catch (_) {}
  }, [seed, streak]);
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof window.getStreak === 'function' && document.body.classList.contains('is-state-resolved'));
}
const KEY = () => (typeof STORAGE !== 'undefined' && STORAGE.STREAK) || 'nplus_streak';
async function seed(page, st) { await page.evaluate(([k, v]) => { localStorage.setItem(k, JSON.stringify(v)); }, [await page.evaluate(KEY), st]); }
const DESK = { width: 1280, height: 800 }, PHONE = { width: 390, height: 844 };

test.describe('Desktop: honest streak lines', () => {
  test('desktop: an ended 11-day streak shows the ended line on Home and "Streak ended · best 11" in the sidebar', async ({ page }) => {
    await boot(page, DESK, null);
    await seed(page, { current: 11, best: 11, last: day(-6) });
    await page.evaluate(() => { renderBentoMomentum(); renderAppSidebar(); renderBentoQuickStart(); });
    await expect(page.locator('#moLine')).toHaveText(ENDED);
    await expect(page.locator('.sb-streak.sb-streak-ended .sb-streak-empty-t')).toHaveText('Streak ended · best 11');
    await expect(page.locator('.sb-streak.sb-streak-ended .sb-streak-empty-s')).toHaveText('A quick set starts a new one.');
    await expect(page.locator('#cb-streak')).toHaveText('0');   // the top-bar chip agrees: no live streak
    await expect(page.locator('#bento-dc-sub')).toHaveText('1 question, about a minute. Starts a new streak.');
  });
  test('alive / done / none-yet lines match the phone wording', async ({ page }) => {
    await boot(page, DESK, null);
    await seed(page, { current: 5, best: 9, last: day(-1) });
    await page.evaluate(() => { renderBentoMomentum(); renderAppSidebar(); });
    await expect(page.locator('#moLine')).toHaveText('5-day streak. Study today to keep it.');
    await expect(page.locator('.sb-streak-sub')).toHaveText('Study today to keep it.');
    await expect(page.locator('#bento-dc-sub')).toHaveText('1 question, about a minute. Keeps the streak, +1.');
    await seed(page, { current: 5, best: 9, last: day(0) });
    await page.evaluate(() => { renderBentoMomentum(); renderAppSidebar(); });
    await expect(page.locator('#moLine')).toHaveText("5-day streak. Today's done.");
    await expect(page.locator('.sb-streak-sub')).toHaveText("Today's done.");
    await seed(page, { current: 0, best: 0, last: null });
    await page.evaluate(() => { renderBentoMomentum(); renderAppSidebar(); });
    await expect(page.locator('#moLine')).toHaveText('No streak yet. Finish a set today to start one.');
    // the same words the phone model produces
    expect(await page.evaluate(() => window._iosHomeModel().momentum.streakLine)).toBe('No streak yet. Finish a set today to start one.');
  });
  test('desktop: the Daily Challenge card says Starts a new streak. when ended', async ({ page }) => {
    await boot(page, DESK, null);
    await seed(page, { current: 11, best: 11, last: day(-6) });
    await page.evaluate(() => { renderDailyChallengeCard(); });
    await expect(page.locator('#daily-challenge-card .dc-sub')).toContainText('Starts a new streak.');
  });
  test('phone: the Daily Challenge line says Starts a new streak. when ended, Keeps the streak, +1. otherwise', async ({ page }) => {
    await boot(page, PHONE, null);
    await seed(page, { current: 11, best: 11, last: day(-6) });
    await page.evaluate(() => window.renderIosHome());
    await expect(page.locator('#ios-home [data-act="daily"], #ios-home .ih-opt[data-act="daily"]').first()).toContainText('1 question, about a minute. Starts a new streak.');
    await seed(page, { current: 5, best: 9, last: day(-1) });
    await page.evaluate(() => window.renderIosHome());
    await expect(page.locator('#ios-home [data-act="daily"], #ios-home .ih-opt[data-act="daily"]').first()).toContainText('Keeps the streak, +1.');
  });
});
