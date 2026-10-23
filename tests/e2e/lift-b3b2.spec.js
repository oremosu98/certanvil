// Lift B3b2 (v8.189.0): Sim Lab Exam mode on phones, against cert-ios-simlab.html exam-* states.
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };

async function boot(page, viewport, tier) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { localStorage.setItem('nplus_theme', 'dark'); } catch (_) {}
  });
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.evaluate((t) => {
    window._quotaState = t === 'pro' ? { tier: 'pro' } : { tier: 'free', used_today: 0, daily_limit: 15 };
    document.body.classList.add('is-state-resolved');
    document.body.classList.toggle('is-pro-tier', t === 'pro');
  }, tier || 'free');
}
const DRAWN = { idx: 1, rounds: 5, answered: [true, true, false, true, false], flagged: [false, false, false, true, false] };
async function openEndWith(page, abandon) {
  await page.evaluate(([m, ab]) => {
    window.__h = [];
    const rec = (n) => function (x) { window.__h.push(x === undefined ? n : n + ':' + x); };
    window.iosSimLab.openEnd(window._iosSlEndModel(m), {
      onSubmit: rec('submit'), onReview: rec('review'), onJump: rec('jump'), onClose: rec('close'),
      onAbandon: function () { window.__h.push('abandon'); return new Promise((res) => { window.__abandonRes = res; }); }
    });
  }, [DRAWN, !!abandon]);
  await expect(page.locator('#isl-end')).not.toHaveClass(/hidden/);
}

for (const vp of PHONES) {
  test.describe('Lift B3b2 End dialog host @' + vp.width, () => {
    test('opens with the drawn counts; focus inside; Escape and the scrim close it and call onClose', async ({ page }) => {
      await boot(page, vp, 'pro');
      await openEndWith(page);
      await expect(page.locator('#isl-end .ms-val')).toHaveText(['3', '2', '1']);
      await expect(page.locator('#isl-end .ix-review')).toHaveText('Review the 2 you skipped first');
      expect(await page.evaluate(() => document.getElementById('isl-end').contains(document.activeElement))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(page.locator('#isl-end')).toHaveClass(/hidden/);
      await openEndWith(page);
      await page.locator('#isl-end').click({ position: { x: 8, y: 8 } });
      await expect(page.locator('#isl-end')).toHaveClass(/hidden/);
      expect(await page.evaluate(() => window.__h)).toEqual(['close']);
      expect(await page.evaluate(() => window.iosSimLab.isEndOpen())).toBe(false);
    });
    test('submit, review and a grid tap close it and call their handler once', async ({ page }) => {
      await boot(page, vp, 'pro');
      await openEndWith(page);
      await page.locator('#isl-end [data-act="submit"]').click();
      await expect(page.locator('#isl-end')).toHaveClass(/hidden/);
      expect(await page.evaluate(() => window.__h)).toEqual(['submit']);
      await openEndWith(page);
      await page.locator('#isl-end .ix-review').click();
      expect(await page.evaluate(() => window.__h)).toEqual(['review:2']);
      await openEndWith(page);
      await page.locator('#isl-end .ix-jump-t').click();
      await expect(page.locator('#isl-end .ix-jump-t')).toHaveAttribute('aria-expanded', 'true');
      await page.locator('#isl-end .ix-jgrid button[data-i="3"]').click();
      await expect(page.locator('#isl-end')).toHaveClass(/hidden/);
      expect(await page.evaluate(() => window.__h)).toEqual(['jump:3']);
    });
    test('abandon recedes the dialog while it asks; a No keeps it open', async ({ page }) => {
      await boot(page, vp, 'pro');
      await openEndWith(page);
      await page.locator('#isl-end [data-act="abandon"]').click();
      await expect(page.locator('#isl-end')).toHaveClass(/is-under/);
      await page.evaluate(() => window.__abandonRes(false));
      await expect(page.locator('#isl-end')).not.toHaveClass(/is-under/);
      await expect(page.locator('#isl-end')).not.toHaveClass(/hidden/);
      await page.locator('#isl-end [data-act="abandon"]').click();
      await page.evaluate(() => window.__abandonRes(true));
      await expect(page.locator('#isl-end')).toHaveClass(/hidden/);
    });
  });
  test.describe('Lift B3b2 exam bar host @' + vp.width, () => {
    test('mount is idempotent and holds the clock slot; unmount puts it back', async ({ page }) => {
      await boot(page, vp, 'pro');
      const r = await page.evaluate(() => {
        const b = window.iosSimLab.examBar;
        b.mount(function () {}); b.mount(function () { window.__end = (window.__end || 0) + 1; });   // latest handler wins
        b.update(window._iosSlExamBarModel({ idx: 0, rounds: 3, answered: [false, false, false], flagged: [false, false, false] }));
        const bars = document.querySelectorAll('#isl-xbar').length;
        const inBar = !!document.querySelector('#isl-xbar #sl-clock-slot');
        const mid = document.querySelector('#isl-xbar .isl-xmid').textContent;
        const ticks = document.querySelectorAll('#isl-xstrip i').length;
        document.querySelector('#isl-xbar .isl-xend').click();
        b.unmount();
        const slot = document.getElementById('sl-clock-slot');
        return { bars, inBar, mid, ticks, end: window.__end, back: slot && slot.nextElementSibling && slot.nextElementSibling.id, gone: !document.getElementById('isl-xbar') && !document.getElementById('isl-xstrip') };
      });
      expect(r).toEqual({ bars: 1, inBar: true, mid: 'Round 1 of 30 answered', ticks: 3, end: 1, back: 'sl-timer-slot', gone: true });
    });
  });
}
