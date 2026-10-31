// Readiness "Pass level" + "Before you book" (fix/readiness-pass-level, drawing readiness-bookit-stamp option C).
// Score at or above the pass mark without all four book-it points: "Pass level" in the pass colour and a row/line
// naming the next step, which opens "Why this score?". At 4 of 4: "Exam ready" with the celebration. Below: unchanged.
// Desktop: Home readiness card + Analytics tile. Phone: Home card (mobile-safari = the iOS app's engine).
const { test, expect } = require('@playwright/test');

const DESKTOP = { width: 1280, height: 900 };
const PHONE = { width: 390, height: 844 };

// Every Net+ topic answered at `score`/50, exam level, plus `mocks` passing full exams in the last few days.
// Seeded on localhost only, in this test's own isolated browser context.
async function boot(page, { score = 47, mocks = 0, size = DESKTOP } = {}) {
  await page.setViewportSize(size);
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.evaluate(([score, mocks]) => {
    if (location.hostname !== 'localhost') throw new Error('seed refused: not localhost');
    const now = Date.now();
    const hist = Object.keys(TOPIC_DOMAINS).map((t, i) => ({ date: new Date(now - (i % 10 + 1) * 3600000).toISOString(), topic: t,
      score, total: 50, pct: Math.round(score / 50 * 100), difficulty: 'Exam Level', mode: 'quiz', byDiff: { E: [score, 50] } }));
    for (let i = 0; i < mocks; i++) hist.push({ date: new Date(now - (i + 1) * 86400000).toISOString(), topic: 'Exam Simulation', difficulty: 'Mixed', score: 80, total: 90, pct: 89, mode: 'exam' });
    const seed = { nplus_history: JSON.stringify(hist), nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1' };
    Object.entries(seed).forEach(([k, v]) => localStorage.setItem(k, v));
  }, [score, mocks]);
  await page.reload();
  await page.waitForLoadState('load');
}

test.describe('Desktop: Pass level and Before you book', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop layout');
  const stampTxt = (page) => page.locator('#readiness-card-v2 .rc-v2-stamp .txt');
  const row = (page) => page.locator('#rc-v2-book');

  test('Home card at 3 of 4: green "Pass level", no ring or confetti, row names the next step and opens Why', async ({ page }) => {
    await boot(page);
    await page.waitForFunction(() => typeof window.caIsDesk === 'function' && window.caIsDesk());
    await expect(stampTxt(page)).toHaveText('Pass level', { timeout: 8000 });
    expect(await stampTxt(page).evaluate((el) => el.style.color)).toBe('var(--green)');
    await expect(page.locator('#readiness-card-v2')).not.toHaveClass(/is-pass/);
    await expect(page.locator('#readiness-card-v2 .rc-v2-confetti i')).toHaveCount(0);
    await expect(row(page)).toBeVisible();
    await expect(row(page)).toContainText('Before you book: Do 2 full exams and pass them');
    await expect(row(page).locator('.rc-v2-book-k')).toHaveText('3 of 4 ›');
    await expect(row(page).locator('.rc-v2-book-dots i.on')).toHaveCount(3);
    expect((await row(page).boundingBox()).height).toBeGreaterThanOrEqual(44);
    await row(page).click();
    await expect(page.locator('#ist-sheet')).toBeVisible();
    await expect(page.locator('#ist-sheet h3')).toHaveText(/^Why \d+\?$/);
    await expect(page.locator('#ist-sheet .iw-sect').first()).toContainText('Not yet · 3 of 4');
  });

  test('Analytics tile at 3 of 4: "Pass level" chip and the same row opening Why', async ({ page }) => {
    await boot(page);
    await expect(async () => {
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Analytics' }).click();
      await expect(page.locator('#page-analytics .tile.s-read')).toBeVisible({ timeout: 2500 });
    }).toPass({ timeout: 15000 });
    const tile = page.locator('#page-analytics .tile.s-read');
    await expect(tile.locator('.read-tier')).toHaveText('Pass level');
    await expect(tile.locator('.read-tier')).toHaveClass(/is-pass/);
    const r = tile.locator('.read-book');
    await expect(r).toContainText('Before you book: Do 2 full exams and pass them');
    await expect(r.locator('.rc-v2-book-k')).toHaveText('3 of 4 ›');
    await r.click();
    await expect(page.locator('#ist-sheet')).toBeVisible();
  });

  test('4 of 4: "Exam ready" with the ring, and no row', async ({ page }) => {
    await boot(page, { mocks: 2 });
    await expect(stampTxt(page)).toHaveText('Exam ready', { timeout: 8000 });
    await expect(page.locator('#readiness-card-v2')).toHaveClass(/is-pass/);
    await expect(row(page)).toBeHidden();
  });

  test('below the pass mark: "{N} pts to pass" as before, and no row', async ({ page }) => {
    await boot(page, { score: 25 });
    await expect(stampTxt(page)).toHaveText(/^\d+ pts to pass$/, { timeout: 8000 });
    expect(await stampTxt(page).evaluate((el) => el.style.color)).toBe('var(--yellow)');
    await expect(row(page)).toBeHidden();
  });
});

test.describe('Phone Home: Pass level and Before you book', () => {
  const card = (page) => page.locator('#ios-home .ih-rd');
  const phone = async (page, o) => { await boot(page, { ...o, size: page.viewportSize() && page.viewportSize().width < 500 ? page.viewportSize() : PHONE }); };

  test('3 of 4: "Pass level" pill, "Before you book · 3 of 4" and the next step; tapping opens Why', async ({ page }) => {
    await phone(page, {});
    await expect(card(page).locator('.ih-rd-tier')).toHaveText('Pass level');
    await expect(card(page)).not.toHaveClass(/ih-passed/);
    await expect(card(page).locator('.ih-rd-book-k')).toHaveText('Before you book · 3 of 4');
    await expect(card(page).locator('.ih-rd-book-s')).toHaveText('Do 2 full exams and pass them.');
    await card(page).click();
    await expect(page.locator('#ist-sheet')).toBeVisible();
    await expect(page.locator('#ist-sheet h3')).toHaveText(/^Why \d+\?$/);
  });

  test('4 of 4: "Exam ready" pill on the green card, no Before you book', async ({ page }) => {
    await phone(page, { mocks: 2 });
    await expect(card(page)).toHaveClass(/ih-passed/);
    await expect(card(page).locator('.ih-rd-tier')).toHaveText('Exam ready');
    await expect(card(page).locator('.ih-rd-tier')).toBeVisible();
    await expect(card(page).locator('.ih-rd-book')).toHaveCount(0);
  });

  test('below the pass mark: tier unchanged (On track / Close / Behind), no Before you book', async ({ page }) => {
    await phone(page, { score: 25 });
    await expect(card(page).locator('.ih-rd-tier')).toHaveText(/^(On track|Close|Behind)$/);
    await expect(card(page).locator('.ih-rd-book')).toHaveCount(0);
    await expect(card(page).locator('.ih-rd-insight')).toContainText('points to a pass');
  });
});
