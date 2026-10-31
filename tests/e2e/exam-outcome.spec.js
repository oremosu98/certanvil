// Persona bundle Task 11: "How did your exam go?" is one flow. From the day after the exam, phone Home asks;
// Passed opens the June "Log your result" screen preselected; Save marks the cert passed (badge + next-cert card);
// Didn't pass is met kindly and offers a new date. Spec: docs/superpowers/specs/2026-10-30-exam-outcome-design.md
const { test, expect } = require('@playwright/test');

const PHONE = { width: 390, height: 844 };
const OUT = 'nplus_exam_outcomes';

function dayOffset(n) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

async function boot(page, examDate) {
  await page.setViewportSize(PHONE);
  // localhost-only fixture seeds, in this test's own isolated browser context
  const seed = { nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1',
    nplus_exam_dates: JSON.stringify({ netplus: examDate }),
    nplus_readiness_snapshots: JSON.stringify({ netplus: { score: 553, computed_at: new Date().toISOString() } }) };
  await page.addInitScript((sd) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { Object.entries(sd).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (_) {}
  }, seed);
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof window.openLogResult === 'function' && typeof window.outcomeDue === 'function');
}
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), OUT);

test.describe('How did your exam go', () => {
  test('Home Passed opens the screen preselected; Save shows the passed state on Home', async ({ page }) => {
    await boot(page, dayOffset(-1));
    const card = page.locator('#ios-home .ih-oc');
    await expect(card).toContainText('How did your Network+ exam go?', { timeout: 8000 });
    await expect(card).toContainText("Tell us and we'll update your plan.");
    await card.locator('[data-act="oc-passed"]').click();

    const screen = page.locator('#ios-log-result');
    await expect(screen).toBeVisible();
    await expect(screen.locator('.il-h1')).toHaveText('Log your result');
    await expect(screen.locator('[data-v="passed"]')).toHaveAttribute('aria-checked', 'true');
    await expect(screen.locator('#il-date')).toHaveValue(dayOffset(-1));   // pre-filled from the exam date
    await expect(screen.locator('#il-lab-oc')).toHaveText('How did it go?');
    await expect(screen).not.toContainText(/centre|center/i);

    await screen.locator('#il-score').fill('950');   // out of the cert scale: rejected, nothing saved
    await screen.locator('#il-save').click();
    await expect(screen.locator('#il-err')).toHaveText('Scores run from 100 to 900.');
    expect(await saved(page)).toBeNull();

    await screen.locator('#il-score').fill('812');
    await screen.locator('#il-save').click();
    await expect(screen.locator('#il-done-t')).toHaveText('Network+ is passed');
    await expect(screen.locator('#il-done-b')).toContainText('812 / 900');
    await expect(page.locator('.il-toast')).toContainText('You passed Network+. Well done.');
    const rec = await saved(page);
    expect(rec.netplus).toMatchObject({ outcome: 'passed', score: 812, date: dayOffset(-1), predicted: 553 });

    await screen.locator('#il-done-go').click();   // See it in your hub (closes the screen until the hub lands)
    await expect(screen).toBeHidden();
    await expect(page.locator('#ios-home .ih-tb-passed')).toHaveText('Passed');
    const next = page.locator('#ios-home .ih-oc');
    await expect(next).toContainText('Pick your next cert');
    await expect(next).toContainText('We predicted 553 on exam day. Your streak carries on with your next cert.');
    await expect(page.locator('#ios-home [data-act="oc-passed"]')).toHaveCount(0);
  });

  test('Didn\'t pass is met kindly and offers a new date; the score is optional', async ({ page }) => {
    await boot(page, dayOffset(-2));
    await page.locator('#ios-home [data-act="oc-failed"]').click();
    const screen = page.locator('#ios-log-result');
    await expect(screen.locator('[data-v="failed"]')).toHaveAttribute('aria-checked', 'true');
    await expect(screen.locator('#il-save')).toHaveText('Save and keep studying');
    await screen.locator('#il-save').click();   // no score
    await expect(screen.locator('#il-done-t')).toHaveText("That's a hard exam.");
    await expect(screen.locator('#il-done-l')).toContainText('Your progress is all still here.');
    await expect(page.locator('.il-toast')).toHaveCount(0);
    expect((await saved(page)).netplus).toMatchObject({ outcome: 'failed', score: null });
    await expect(screen.locator('#il-done-alt')).toHaveText('Not now');
    await screen.locator('#il-done-go').click();   // Set a new date -> the exam-date sheet
    await expect(screen).toBeHidden();
    await expect(page.locator('#ist-sheet')).toHaveClass(/open/);
  });

  test('outcomeDue is false on the exam day and the card does not show', async ({ page }) => {
    await boot(page, dayOffset(0));
    expect(await page.evaluate(() => outcomeDue('netplus'))).toBe(false);
    await expect(page.locator('#ios-home .ih-oc')).toHaveCount(0);
  });

  test('"I haven\'t sat it yet" opens the exam-date sheet', async ({ page }) => {
    await boot(page, dayOffset(-1));
    await page.locator('#ios-home [data-act="oc-notyet"]').click();
    await expect(page.locator('#ist-sheet')).toHaveClass(/open/);
  });
});
