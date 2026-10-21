// tests/e2e/lift-b1.spec.js — Lift B1 (Progress, Analytics, Daily Review at phone width).
// Spec: docs/superpowers/specs/2026-10-21-ios-lift-b1-design.md. E2E: feat/cert-ios-e2e.
// Phones are 390x844 and 402x874 (the device width side-by-sides use); desktop is 1280x800 and must not change.
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };
const TOPICS = ['AAA & Authentication', 'OSPF', 'Port Numbers', 'Cable Issues'];

async function openApp(page, viewport, withHistory) {
  await page.setViewportSize(viewport);
  await page.addInitScript((seed) => {
    try {
      localStorage.setItem('nplus_theme', 'dark');
      if (seed) {
        const h = Array.from({ length: 12 }, (_, i) => ({ date: new Date(Date.now() - (i + 1) * 864e5).toISOString(),
          topic: seed[i % seed.length], difficulty: 'Exam Level', score: i % 4 === 3 ? 2 : 7, total: 10, pct: i % 4 === 3 ? 20 : 70, mode: 'quiz' }));
        localStorage.setItem('nplus_history', JSON.stringify(h));
      }
    } catch (_) {}
  }, withHistory ? TOPICS : null);
  await page.goto('/');
  await page.waitForLoadState('load');
}

// Arrive the way a user does: the tab bar paints the page, then shows it (lift-shell navTo).
async function goTab(page, name) {
  await page.locator('#lift-tabbar .lift-tab[data-page="' + name + '"]').click();
  await expect(page.locator('#page-' + name)).toHaveClass(/active/);
}

for (const vp of PHONES) {
  test.describe('Lift B1 Progress @' + vp.width, () => {
    test('phone renders the E2E Progress screen and hides the desktop page', async ({ page }) => {
      await openApp(page, vp, true);
      await goTab(page, 'progress');
      await expect(page.locator('#ios-progress .ip-topbar')).toBeVisible();
      await expect(page.locator('#page-progress .progress-toolbar')).toBeHidden();
      await expect(page.locator('#page-progress .lift-seg')).toBeHidden();
      await expect(page.locator('#app-topbar')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(vp.width);
    });

    test('pills move the pager and swiping moves the pills', async ({ page }) => {
      await openApp(page, vp, true);
      await goTab(page, 'progress');
      const pager = page.locator('#ios-progress .ip-pager');
      await page.locator('#ios-progress .ip-chip[data-page="2"]').click();
      await expect.poll(() => pager.evaluate(el => Math.round(el.scrollLeft / el.clientWidth))).toBe(2);
      await pager.evaluate(el => el.scrollTo({ left: el.clientWidth * 4, behavior: 'auto' }));
      await expect(page.locator('#ios-progress .ip-chip[data-page="4"]')).toHaveAttribute('aria-selected', 'true');
    });

    test('a topic row drills that topic in the Custom quiz', async ({ page }) => {
      await openApp(page, vp, true);
      await goTab(page, 'progress');
      const row = page.locator('#ios-progress .ip-trow[data-t="OSPF"]').first();
      // open the row's domain page through its pill, as a user would
      const pg = await row.evaluate(el => el.closest('.ip-page').getAttribute('data-page'));
      await page.locator('#ios-progress .ip-chip[data-page="' + pg + '"]').click();
      await row.click();
      await expect(page.locator('#ios-custom .ic-topbar')).toBeVisible();
      await expect(page.locator('#ios-custom [data-act="topic"][data-v="OSPF"]')).toHaveAttribute('aria-pressed', 'true');
    });

    test('the Weak filter and Best first sort re-render the domain pages', async ({ page }) => {
      await openApp(page, vp, true);
      await goTab(page, 'progress');
      await page.locator('#ios-progress .ip-ftab[data-filter="weak"]').click();
      await expect(page.locator('#ios-progress .ip-ftab[data-filter="weak"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#ios-progress .ip-trow[data-t="OSPF"]')).toHaveCount(0);
      await page.locator('#ios-progress .ip-fsort').click();
      await expect(page.locator('#ios-progress .ip-fsort span')).toHaveText('Best first');
    });

    test('the Analytics side of the switch opens Analytics', async ({ page }) => {
      await openApp(page, vp, true);
      await goTab(page, 'progress');
      await page.locator('#ios-progress [data-view="analytics"]').click();
      await expect(page.locator('#page-analytics')).toHaveClass(/active/);
    });

    test('a new user sees no Drill this next card and 0% covered', async ({ page }) => {
      await openApp(page, vp, false);
      await goTab(page, 'progress');
      await expect(page.locator('#ios-progress .ip-hero')).toHaveCount(0);
      await expect(page.locator('#ios-progress .ip-ring-n')).toHaveText('0%');
    });
  });
}

for (const vp of PHONES) {
  test.describe('Lift B1 Analytics @' + vp.width, () => {
    async function openAnalytics(page, withHistory) {
      await openApp(page, vp, withHistory);
      await goTab(page, 'progress');
      await page.locator('#ios-progress [data-view="analytics"]').click();
      await expect(page.locator('#page-analytics')).toHaveClass(/active/);
    }

    test('phone renders the E2E Analytics screen with six pages', async ({ page }) => {
      await openAnalytics(page, true);
      await expect(page.locator('#ios-analytics .in-topbar')).toBeVisible();
      await expect(page.locator('#ios-analytics .in-chip')).toHaveCount(6);
      await expect(page.locator('#page-analytics #analytics-content')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(vp.width);
    });

    test('pills and swipe move between the pages', async ({ page }) => {
      await openAnalytics(page, true);
      const pager = page.locator('#ios-analytics .in-pager');
      await page.locator('#ios-analytics .in-chip[data-page="3"]').click();
      await expect.poll(() => pager.evaluate(el => Math.round(el.scrollLeft / el.clientWidth))).toBe(3);
      await pager.evaluate(el => el.scrollTo({ left: el.clientWidth * 5, behavior: 'auto' }));
      await expect(page.locator('#ios-analytics .in-chip[data-page="5"]')).toHaveAttribute('aria-selected', 'true');
    });

    test('a Map tile opens its sheet without moving the screen; the scrim closes it and returns focus', async ({ page }) => {
      await openAnalytics(page, true);
      await page.locator('#ios-analytics .in-chip[data-page="1"]').click();
      const tile = page.locator('#ios-analytics .in-mtile[data-t="OSPF"]');
      await tile.click();
      const sheet = page.locator('#ios-analytics [role="dialog"]');
      await expect(sheet).toHaveClass(/in-is-open/);
      await expect(sheet.locator('.in-ms-name')).toHaveText('OSPF');
      expect(await page.evaluate(() => document.getElementById('ios-analytics').scrollTop)).toBe(0);
      await page.locator('#ios-analytics .in-map-scrim').click({ position: { x: 20, y: 20 } });
      await expect(sheet).not.toHaveClass(/in-is-open/);
      expect(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-t'))).toBe('OSPF');
    });

    test('an untouched tile offers "Start this topic"', async ({ page }) => {
      await openAnalytics(page, true);
      await page.locator('#ios-analytics .in-chip[data-page="1"]').click();
      await page.locator('#ios-analytics .in-mtile.in-t-untouched').first().click();
      await expect(page.locator('#ios-analytics .in-ms-go')).toHaveText('Start this topic');
    });

    test('Drill this topic starts a quiz on that topic', async ({ page }) => {
      await openAnalytics(page, true);
      await page.evaluate(() => { window.__q = []; window.focusTopic = (t) => window.__q.push(t); });
      await page.locator('#ios-analytics .in-chip[data-page="1"]').click();
      await page.locator('#ios-analytics .in-mtile[data-t="OSPF"]').click();
      await page.locator('#ios-analytics .in-ms-go').click();
      expect(await page.evaluate(() => window.__q)).toEqual(['OSPF']);
    });

    test('Drill them quizzes exactly the topics it names', async ({ page }) => {
      await openAnalytics(page, true);
      await page.evaluate(() => { window.__t = null; window.startQuiz = () => { window.__t = topic; }; });
      await page.locator('#ios-analytics .in-chip[data-page="1"]').click();
      const names = (await page.locator('#ios-analytics .in-map-act-t span').textContent()).split(', ');
      await page.locator('#ios-analytics [data-act="drill-weakest"]').click();
      expect(await page.evaluate(() => window.__t)).toBe('Multi: ' + names.join(', '));
    });

    test('the Progress side of the switch opens Progress', async ({ page }) => {
      await openAnalytics(page, true);
      await page.locator('#ios-analytics [data-view="progress"]').click();
      await expect(page.locator('#page-progress')).toHaveClass(/active/);
      await expect(page.locator('#ios-progress .ip-topbar')).toBeVisible();
    });

    test('a new user sees the empty card, not six empty pages', async ({ page }) => {
      await openAnalytics(page, false);
      await expect(page.locator('#ios-analytics .in-empty-card')).toBeVisible();
      await expect(page.locator('#ios-analytics .in-pager')).toHaveCount(0);
    });
  });
}

// Daily Review: three due MCQ cards (answers C, B, A), seeded on localhost only.
async function openReview(page, viewport) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    const card = (qHash, question, answer, topic) => ({ qHash, question, options: { A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta' }, answer,
      explanation: 'Because ' + answer + '.', topic, difficulty: 'Exam Level', nextReview: 0, intervalDays: 0, easiness: 2.5, repetitions: 0, graduated: false });
    try {
      localStorage.setItem('nplus_theme', 'dark');
      localStorage.setItem('nplus_sr_queue', JSON.stringify([card('r1', 'First?', 'C', 'Port Numbers'), card('r2', 'Second?', 'B', 'OSPF'), card('r3', 'Third?', 'A', 'IPv6')]));
    } catch (_) {}
  });
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.evaluate(() => startSrReview());
  await expect(page.locator('#page-sr-review')).toHaveClass(/active/);
}

for (const vp of PHONES) {
  test.describe('Lift B1 Daily Review @' + vp.width, () => {
    test('header, plan line and the waiting dock match the E2E', async ({ page }) => {
      await openReview(page, vp);
      await expect(page.locator('#page-sr-review .iv-title')).toBeVisible();
      await expect(page.locator('#page-sr-review .ed-pagehead-display:not(.iv-title)')).toBeHidden();
      await expect(page.locator('#sr-plan-line')).toHaveText(/^\d+ today · \d+ in queue$/);
      await expect(page.locator('#sr-progress-text')).toHaveText('Card 1 of 3');
      await expect(page.locator('#page-sr-review .sr-card-meta')).toBeHidden();
      const wait = page.locator('#page-sr-review .iv-wait-btn');
      await expect(wait).toBeVisible();
      await expect(wait).toBeDisabled();
      const box = await wait.boundingBox();
      expect(box.y + box.height).toBeGreaterThan(vp.height - 90);
    });

    test('a correct answer docks Guessed and Knew it; Knew it moves on', async ({ page }) => {
      await openReview(page, vp);
      await page.locator('#sr-card-host .sr-option[data-letter="C"]').click();
      await expect(page.locator('#page-sr-review .sr-confidence-uncertain')).toHaveText(/Guessed/);
      await expect(page.locator('#page-sr-review .sr-confidence-confident')).toHaveText(/Knew it/);
      const g = await page.locator('#page-sr-review .sr-confidence-uncertain').boundingBox();
      const k = await page.locator('#page-sr-review .sr-confidence-confident').boundingBox();
      expect(g.x).toBeLessThan(k.x);
      await page.locator('#page-sr-review .sr-confidence-confident').click();
      await expect(page.locator('#sr-progress-text')).toHaveText('Card 2 of 3');
    });

    test('a wrong answer docks a single Next card', async ({ page }) => {
      await openReview(page, vp);
      await page.locator('#sr-card-host .sr-option[data-letter="A"]').click();
      await expect(page.locator('#page-sr-review .sr-confidence-wrong')).toHaveText(/Next card/);
      await expect(page.locator('#page-sr-review .sr-confidence-confident')).toHaveCount(0);
    });

    test('Remove it still removes the card', async ({ page }) => {
      await openReview(page, vp);
      await page.locator('#sr-card-host .sr-remove-btn').click();
      await page.locator('#sr-card-host .sr-remove-yes').click();
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('nplus_sr_queue')).length)).toBe(2);
    });

    test('Review done shows the tiles and forecast; Retry replays only the missed card', async ({ page }) => {
      await openReview(page, vp);
      const answer = async (letter, conf) => {
        await page.locator('#sr-card-host .sr-option[data-letter="' + letter + '"]').click();
        await page.locator('#page-sr-review .sr-confidence-' + conf).click();
      };
      await answer('C', 'confident');
      await answer('A', 'wrong');            // card 2 is B: missed
      await answer('A', 'confident');
      // the in-session retry brings the missed card back once; miss it again
      while (await page.locator('#sr-card-host .sr-option').count()) await answer('A', 'wrong');
      const tiles = page.locator('#page-sr-review .sr-done-tiles');
      await expect(tiles).toBeVisible();
      await expect(tiles.locator('.sr-done-miss b')).not.toHaveText('0');
      await expect(page.locator('#page-sr-review .iv-done-t')).toHaveText('Review done');
      await expect(page.locator('#sr-forecast-complete')).toBeVisible();
      await page.locator('#page-sr-review .iv-retry').click();
      await expect(page.locator('#sr-progress-text')).toHaveText('Card 1 of 1');
    });
  });
}

test.describe('Lift B1 desktop is unchanged', () => {
  test('desktop Progress keeps its own page and leaves #ios-progress empty', async ({ page }) => {
    await openApp(page, DESKTOP, true);
    await page.evaluate(() => showPage('progress'));
    await expect(page.locator('#ios-progress')).toBeEmpty();
    await expect(page.locator('#page-progress .progress-toolbar')).toBeVisible();
  });

  test('desktop Daily Review keeps "SR queue." and hides the phone hooks', async ({ page }) => {
    await openReview(page, DESKTOP);
    await expect(page.locator('#page-sr-review .ed-pagehead-display:not(.iv-title)')).toBeVisible();
    await expect(page.locator('#page-sr-review .iv-title')).toBeHidden();
    await expect(page.locator('#sr-plan-line')).toBeHidden();
    await expect(page.locator('#sr-progress-text')).toHaveText('1 of 3', { useInnerText: true });   // what desktop shows (the phone span is hidden)
  });

  test('desktop Analytics keeps the bento and leaves #ios-analytics empty', async ({ page }) => {
    await openApp(page, DESKTOP, true);
    await page.evaluate(() => showPage('analytics'));
    await expect(page.locator('#ios-analytics')).toBeEmpty();
    await expect(page.locator('#analytics-content .ana-bento')).toBeVisible();
  });
});
