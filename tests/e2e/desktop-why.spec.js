// Desktop catch-up Task 6: Analytics readiness tile on desktop (drawings analytics-why, why-sheet).
// "Why this score?" opens the phone's why sheet as a 700px centred dialog, the PBQ note line shows, a past exam date
// reads "N days ago" with "Set a new exam date to see where you'll be on the day.", and the old "Why you're at N" card
// is gone. The Home console chip and the top-bar chip say how long ago the exam was. Phone: lift-a.spec.js.
const { test, expect } = require('@playwright/test');

const DESKTOP = { width: 1280, height: 860 };

function dayOffset(n) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

async function boot(page, examDate) {
  await page.setViewportSize(DESKTOP);
  const now = Date.now();
  const hist = [{ date: new Date(now - 3600000).toISOString(), topic: 'OSPF', score: 18, total: 25, pct: 72, difficulty: 'Exam Level', mode: 'quiz', byDiff: { E: [18, 25] } }];
  // three full exams, each with 3 PBQs: 2 + 2 + 2 fully right = "6 of 9"
  for (let i = 1; i <= 3; i++) hist.push({ date: new Date(now - i * 86400000).toISOString(), topic: 'Exam Simulation', difficulty: 'Mixed', score: 60, total: 90, pct: 67, mode: 'exam', pbq: { right: 2, count: 3 } });
  // localhost-only fixture seeds, in this test's own isolated browser context
  const seed = { nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1', nplus_history: JSON.stringify(hist) };
  if (examDate) seed.nplus_exam_dates = JSON.stringify({ netplus: examDate });
  await page.addInitScript((sd) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { Object.entries(sd).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (_) {}
  }, seed);
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof window.caIsDesk === 'function' && window.caIsDesk() && typeof window.showPage === 'function');
}
async function openAnalytics(page) {
  // the sidebar button, as a user would; repeat if the click lands while Home's own entrance is still switching
  await expect(async () => {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Analytics' }).click();
    await expect(page.locator('#page-analytics .tile.s-read')).toBeVisible({ timeout: 2500 });
  }).toPass({ timeout: 15000 });
}
const tile = (page) => page.locator('#page-analytics .tile.s-read');

test.describe('Desktop: Why this score and the honest Analytics tile', () => {
  test('desktop: Why this score? opens the dialog with range, evidence, exam areas and the four book-it items', async ({ page }) => {
    await boot(page, dayOffset(30));
    await openAnalytics(page);
    const link = tile(page).locator('.read-why');
    await expect(link).toHaveText('Why this score?');
    await link.focus(); await page.keyboard.press('Enter');   // keyboard open: WebKit does not focus a clicked button, so focus return is tested this way
    const dlg = page.locator('#ist-sheet');
    await expect(dlg).toBeVisible();
    await expect(dlg).toHaveClass(/is-dialog/);
    await expect(dlg).toHaveClass(/is-lg/);
    expect(await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('ist-sheet')).width))).toBe(700);   // CSS px
    const box = await dlg.boundingBox();
    expect(Math.abs(box.x + box.width / 2 - DESKTOP.width / 2)).toBeLessThan(2);   // centred
    await expect(page.locator('#ist-sheet [data-ca-close]')).toBeFocused();
    await expect(dlg.locator('h3')).toHaveText(/^Why \d+\?$/);
    await expect(dlg.locator('.iw-lede')).toContainText(/likely between \d+ and \d+\. Pass chance \d+%\. Based on 25 answers across 1 of \d+ topics\./);
    await expect(dlg.locator('.iw-sect').first()).toContainText('Book it?');
    await expect(dlg.locator('.iw-check li')).toHaveCount(4);
    await expect(dlg.locator('.iw-sect').nth(1)).toHaveText('Exam areas');
    expect(await dlg.locator('.iw-dom > div').count()).toBeGreaterThan(0);
    await expect(dlg.locator('.iw-sect').nth(2)).toHaveText('The evidence');
    await expect(dlg.locator('.iw-facts')).toContainText('Last full exam:');
    await expect(dlg.locator('.iw-how')).toContainText("count topics you haven't studied as 40%");
    // the drawing's two columns: book-it on the left, exam areas and the evidence on the right
    const chk = await dlg.locator('.iw-check').boundingBox(), dom = await dlg.locator('.iw-dom').boundingBox();
    expect(dom.x).toBeGreaterThan(chk.x + chk.width);
    expect(Math.abs(dom.y - chk.y)).toBeLessThan(4);
    // the grip is phone chrome
    await expect(dlg.locator('.ist-grip')).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(dlg).toBeHidden();
    expect(await page.evaluate(() => [].some.call(document.body.children, (el) => el.inert && el.id !== 'ist-sheet'))).toBe(false);
    await expect(link).toBeFocused();
  });

  test('the PBQ note shows on the desktop tile', async ({ page }) => {
    await boot(page, dayOffset(30));
    await openAnalytics(page);
    await expect(tile(page).locator('.read-pbq')).toHaveText('Readiness counts multiple-choice only. PBQs: 6 of 9 fully right in your last 3 full exams.');
  });

  test('a date 2 days past reads "2 days ago" and "Set a new exam date to see where you\'ll be on the day."', async ({ page }) => {
    await boot(page, dayOffset(-2));
    await openAnalytics(page);
    await expect(tile(page).locator('.read-fore')).toContainText('Days to exam 2 days ago');
    await expect(tile(page).locator('.read-fore')).not.toContainText('—');
    await expect(tile(page).locator('.read-cap')).toContainText("Set a new exam date to see where you'll be on the day.");
    await expect(tile(page).locator('.read-fore')).toContainText('Set a date');
  });

  test('a date never set keeps "Set your exam date" and "—"', async ({ page }) => {
    await boot(page, null);
    await openAnalytics(page);
    await expect(tile(page).locator('.read-cap')).toContainText("Set your exam date to see where you'll be on the day.");
    await expect(tile(page).locator('.read-fore')).toContainText('— days to exam');
  });

  test('the old Why you\'re at card is gone', async ({ page }) => {
    await boot(page, dayOffset(30));
    await openAnalytics(page);
    await expect(page.locator('#ana-s-why-score')).toHaveCount(0);
    await expect(page.locator('#page-analytics')).not.toContainText("Why you're at");
    await expect(page.locator('#page-analytics .ana-hero')).toHaveCount(0);   // the old getReadinessForecast hero
  });

  test('Home console chip: "Yesterday · exam day", then "2 days ago · exam day"; the top-bar chip says "Exam was ..."', async ({ page }) => {
    await boot(page, dayOffset(-1));
    const chip = page.locator('#cb-days').locator('xpath=..');
    await expect(chip).toHaveText('Yesterdayexam day');
    await expect(page.locator('#topbar-countdown-val')).toHaveText('Exam was yesterday');
    await page.evaluate((d) => { setExamDate(d); }, dayOffset(-2));
    await page.reload(); await page.waitForLoadState('load');
    await expect(chip).toHaveText('2 days agoexam day');
    await expect(page.locator('#topbar-countdown-val')).toHaveText('Exam was 2 days ago');
    await page.evaluate((d) => { setExamDate(d); }, dayOffset(10));
    await page.reload(); await page.waitForLoadState('load');
    await expect(chip).toHaveText(/^\d+days to exam$/);
  });
});
