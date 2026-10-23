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

// ── Task 4: Exam mode wired on phones ──
async function setTier(page, tier) {
  await page.evaluate((t) => {
    window._quotaState = t === 'pro' ? { tier: 'pro' } : { tier: 'free', used_today: 0, daily_limit: 15 };
    document.body.classList.toggle('is-pro-tier', t === 'pro');
    if (typeof renderGauntletDrillsCard === 'function') renderGauntletDrillsCard();
  }, tier);
}
async function countConfirms(page) {
  await page.evaluate(() => { window.__confirms = 0; window.confirm = function () { window.__confirms++; return true; }; });
}
async function startExam(page, vp, n) {
  await boot(page, vp, 'pro');
  await page.evaluate(() => {
    try { localStorage.removeItem('nplus_pbq_free_count'); } catch (_) {}
    window._slMeteredGenerate = async () => ({ bad: true });   // force the seed pool (offline)
    startSimLabHome();
  });
  await expect(page.locator('#page-sim-lab-entry')).toHaveClass(/active/);
  await setTier(page, 'pro');
  await countConfirms(page);
  if (vp.width < 900) {
    await page.locator('#isl-entry [data-act="mode"][data-mode="exam"]').click();
    await page.locator('#isl-entry [data-act="rounds"][data-rounds="' + n + '"]').click();
    await page.locator('#isl-entry [data-act="start"]').click();
    await page.waitForSelector('#isl-xbar .sl-clock', { timeout: 10000 });
  } else {
    await page.locator('#sle-mode .sle-seg-opt[data-mode="exam"]').click();
    await page.locator('#sle-rounds .sle-chip[data-rounds="' + n + '"]').click();
    await page.locator('#sle-start').click();
    await page.waitForSelector('#sl-palette .pq', { timeout: 10000 });
  }
}
// Answer the round in view the way a widget would: write into the live responses object.
async function answerInView(page) {
  return page.evaluate(() => {
    const s = window._simLab.examSession(), st = s.scenarios[s.idx].steps[0];
    window.__slResponses[st.id] = st.type === 'order' ? [0] : 'probe';
    return st.id;
  });
}
const S = (page, fn) => page.evaluate(fn);

for (const vp of PHONES) {
  test.describe('Lift B3b2 exam @' + vp.width, () => {
    test('June exam chrome: bar, strip and dock; no palette, inline Submit or entrance', async ({ page }) => {
      await startExam(page, vp, 3);
      await expect(page.locator('#isl-xbar .isl-xcn')).toHaveText('Round 1 of 3');
      await expect(page.locator('#isl-xbar .isl-xcs')).toHaveText('0 answered');
      await expect(page.locator('#isl-xbar .isl-xtl')).toHaveText('Time left');
      await expect(page.locator('#isl-xstrip i')).toHaveCount(3);
      await expect(page.locator('.isl-xdock')).toBeVisible();
      await expect(page.locator('.isl-xdock [data-act="prev"]')).toBeDisabled();
      await expect(page.locator('#sl-palette')).toBeHidden();
      await expect(page.locator('.sl-topbar')).toBeHidden();
      await expect(page.locator('#lift-tabbar')).toBeHidden();
      await expect(page.locator('#app-topbar')).toBeHidden();
      await expect(page.locator('#sl-body [data-action="simLabSubmitScenario"]')).toHaveCount(0);
      await expect(page.locator('#sl-body .isl-enter')).toHaveCount(0);
      await expect(page.locator('#page-sim-lab')).toHaveClass(/isl-exam/);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
    test('the clock ticks in the bar and latches amber in the last 10%', async ({ page }) => {
      await startExam(page, vp, 3);
      await S(page, () => { const s = window._simLab.examSession(); s.deadlineMs = Date.now() + 0.05 * s.budgetMs; window._simLab.tickClock(); });
      await expect(page.locator('#isl-xbar .sl-clock')).toHaveClass(/is-low/);
    });
    test('Flag and Next mark and move; ‹ returns with the flag kept', async ({ page }) => {
      await startExam(page, vp, 3);
      await page.locator('.isl-xdock [data-act="flag"]').click();
      await expect(page.locator('.isl-xdock [data-act="flag"]')).toHaveText('Flagged');
      await expect(page.locator('#isl-xstrip i').nth(0)).toHaveClass('cur');
      await page.locator('.isl-xdock [data-act="next"]').click();
      await expect(page.locator('#isl-xbar .isl-xcn')).toHaveText('Round 2 of 3');
      await expect(page.locator('#isl-xstrip i').nth(0)).toHaveClass('flag');
      await page.locator('.isl-xdock [data-act="prev"]').click();
      await expect(page.locator('#isl-xbar .isl-xcn')).toHaveText('Round 1 of 3');
      await expect(page.locator('.isl-xdock [data-act="flag"]')).toHaveText('Flagged');
    });
    test('counts include the round in view', async ({ page }) => {
      await startExam(page, vp, 3);
      await page.locator('.isl-xdock [data-act="next"]').click();
      await page.locator('.isl-xdock [data-act="next"]').click();
      await expect(page.locator('.isl-xdock [data-act="next"]')).toHaveText('Review');
      await answerInView(page);
      await page.locator('.isl-xdock [data-act="flag"]').click();
      // the bar counts saved answers only (not the round in view); the dialog adds the round in view.
      // Untouched rounds may count (an order step's shown order is an answer), so compare, not hardcode.
      const before = Number((await page.locator('#isl-xbar .isl-xcs').textContent()).split(' ')[0]);
      await page.locator('.isl-xdock [data-act="next"]').click();
      const want = String(before + 1), skipped = String(3 - before - 1);
      await expect(page.locator('#isl-end .ms-val')).toHaveText([want, skipped, '1']);
      await expect(page.locator('#isl-end .ix-review')).toHaveText(skipped === '0' ? 'Review the 1 you flagged first' : 'Review the ' + skipped + ' you skipped first');
      await expect(page.locator('#isl-xbar .isl-xcs')).toHaveText(want + ' answered');
      await expect(page.locator('#isl-end .ix-jgrid button[data-i="2"]')).toHaveClass('f c');
      expect(await S(page, () => window._simLab.examSession().view)).toBe('review');
    });
    test('dialog time is not counted; a jump restores answers', async ({ page }) => {
      await startExam(page, vp, 3);
      const id = await answerInView(page);
      await page.locator('#isl-xbar .isl-xend').click();
      await expect(page.locator('#isl-end')).not.toHaveClass(/hidden/);
      const before = await S(page, () => window._simLab.examSession().roundMs.slice());
      await page.waitForTimeout(1200);
      await page.locator('#isl-end .ix-jump-t').click();
      await page.locator('#isl-end .ix-jgrid button[data-i="0"]').click();
      await expect(page.locator('#isl-end')).toHaveClass(/hidden/);
      const after = await S(page, () => window._simLab.examSession().roundMs.slice());
      expect(after).toEqual(before);
      expect(await page.evaluate((k) => !!window._simLab.examSession().answers[0][k], id)).toBe(true);
      await expect(page.locator('#isl-xstrip i').nth(0)).toHaveClass('cur');
      await page.locator('#isl-xbar .isl-xend').click();
      await page.keyboard.press('Escape');
      expect(await S(page, () => window._simLab.examSession().view)).toBe('round');
    });
    test('abandon asks; Keep going keeps; Escape closes only the sheet; Abandon leaves for good', async ({ page }) => {
      await startExam(page, vp, 3);
      await page.locator('#isl-xbar .isl-xend').click();
      await page.locator('#isl-end [data-act="abandon"]').click();
      await expect(page.locator('#exam-sheet')).toBeVisible();
      await expect(page.locator('#exam-sheet-title')).toHaveText('Abandon this exam?');
      await expect(page.locator('#exam-sheet .ix-sheet-stay')).toHaveText('Keep going');
      await page.locator('#exam-sheet .ix-sheet-stay').click();
      await expect(page.locator('#exam-sheet')).toBeHidden();
      expect(await S(page, () => window.iosSimLab.isEndOpen())).toBe(true);
      await page.locator('#isl-end [data-act="abandon"]').click();
      await expect(page.locator('#exam-sheet')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('#exam-sheet')).toBeHidden();
      expect(await S(page, () => window.iosSimLab.isEndOpen())).toBe(true);
      await page.locator('#isl-end [data-act="abandon"]').click();
      await page.locator('#exam-sheet .ix-sheet-go').click();
      await expect(page.locator('#page-setup')).toHaveClass(/active/);
      expect(await S(page, () => window._simLab.examSession())).toBeFalsy();
      await page.waitForTimeout(2500);
      await expect(page.locator('#page-sim-lab-result')).not.toHaveClass(/active/);
      expect(await S(page, () => window.__confirms)).toBe(0);
    });
    test('time-up closes the dialog and the sheet', async ({ page }) => {
      await startExam(page, vp, 3);
      await page.locator('#isl-xbar .isl-xend').click();
      await page.locator('#isl-end [data-act="abandon"]').click();
      await expect(page.locator('#exam-sheet')).toBeVisible();
      await S(page, () => { window._simLab.examSession().deadlineMs = Date.now() - 1; window._simLab.tickClock(); });
      await expect(page.locator('#page-sim-lab-result')).toHaveClass(/active/);
      await expect(page.locator('#exam-sheet')).toBeHidden();
      expect(await S(page, () => window.iosSimLab.isEndOpen())).toBe(false);
      await page.waitForTimeout(500);
      await expect(page.locator('#page-sim-lab-result')).toHaveClass(/active/);
    });
    test('Reset asks in the sheet, from the console bar or the step-1 pill', async ({ page }) => {
      await startExam(page, vp, 3);
      await expect(page.locator('#sl-body .isl-reset-pill')).toHaveCount(1);
      await page.locator('#sl-body .isl-reset-pill').click();
      await expect(page.locator('#exam-sheet-title')).toHaveText('Start this PBQ again?');
      await page.locator('#exam-sheet .ix-sheet-stay').click();
      expect(await S(page, () => window.__confirms)).toBe(0);
    });
    test('exam then practice leaves no exam chrome', async ({ page }) => {
      await startExam(page, vp, 3);
      await page.locator('#isl-xbar .isl-xend').click();
      await page.locator('#isl-end [data-act="abandon"]').click();
      await page.locator('#exam-sheet .ix-sheet-go').click();
      await expect(page.locator('#page-setup')).toHaveClass(/active/);
      await page.evaluate(() => startSimLabHome());
      await page.locator('#isl-entry [data-act="mode"][data-mode="practice"]').click();
      await page.locator('#isl-entry [data-act="rounds"][data-rounds="3"]').click();
      await page.locator('#isl-entry [data-act="start"]').click();
      await page.waitForSelector('#sl-body [data-action="simLabSubmitScenario"]', { timeout: 10000 });
      await expect(page.locator('#page-sim-lab')).toHaveClass(/isl-practice/);
      await expect(page.locator('#page-sim-lab')).not.toHaveClass(/isl-exam/);
      await expect(page.locator('#isl-xbar')).toHaveCount(0);
      await expect(page.locator('.isl-xdock')).toHaveCount(0);
      await expect(page.locator('.sl-topbar #sl-clock-slot')).toHaveCount(1);
      await expect(page.locator('#sl-timer-slot .sl-timer')).toBeVisible();
    });
  });
}

test('Lift B3b2 desktop: Exam mode keeps the palette, the footer, the review screen and confirm()', async ({ page }) => {
  await startExam(page, DESKTOP, 3);
  await expect(page.locator('#sl-palette')).toBeVisible();
  await expect(page.locator('#sl-body .sl-examfoot')).toBeVisible();
  await expect(page.locator('#isl-xbar')).toHaveCount(0);
  await page.locator('#sl-body .sl-examfoot .sl-navbtn.next').click();
  await page.locator('#sl-body .sl-examfoot .sl-navbtn.next').click();
  await page.locator('#sl-body .sl-examfoot .sl-navbtn.next').click();
  await expect(page.locator('#sl-body .slv-review')).toBeVisible();
  expect(await page.evaluate(() => !!window._simLab.examSession())).toBe(true);
  await page.locator('.sl-topbar [data-action="simLabExit"]').click();
  expect(await page.evaluate(() => window.__confirms)).toBe(1);
});

// ── Task 5: exam results on phones ──
for (const vp of PHONES) {
  test.describe('Lift B3b2 results @' + vp.width, () => {
    test('results: the verdict with the Pace card; why on every row; no upsell; Back to Practice leaves', async ({ page }) => {
      await startExam(page, vp, 3);
      await page.locator('#isl-xbar .isl-xend').click();
      await page.locator('#isl-end [data-act="submit"]').click();
      await expect(page.locator('#page-sim-lab-result')).toHaveClass(/active/);
      await expect(page.locator('#sl-result-root .isl-vkick')).toHaveText('Sim Lab exam · 3 rounds');
      await expect(page.locator('#sl-result-root .isl-pace')).toHaveCount(1);
      await expect(page.locator('#sl-result-root .isl-pk')).toHaveText('Pace');
      await expect(page.locator('#sl-result-root .isl-pv')).toHaveText('On exam pace');
      await expect(page.locator('#sl-result-root .isl-ptick b')).toHaveText(/^Target \d+:\d\d$/);
      await expect(page.locator('#sl-result-root .isl-prow')).toHaveCount(3);
      // long topics truncate: every time and par sits inside the card
      const fit = await page.evaluate(() => { const card = document.querySelector('#sl-result-root .isl-pace').getBoundingClientRect();
        return Array.from(document.querySelectorAll('#sl-result-root .isl-prp, #sl-result-root .isl-prt')).every((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.right <= card.right - 8; }); });
      expect(fit).toBe(true);
      expect(await page.locator('#sl-result-root').textContent()).not.toContain('NaN');
      await expect(page.locator('#sl-result-root .isl-upsell')).toHaveCount(0);
      const rows = page.locator('#sl-result-root .isl-srow');
      await expect(rows).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        await rows.nth(i).click();
        await expect(page.locator('#isl-sdet-' + i + ' .sls-ans-why').first()).toBeVisible();
      }
      await page.locator('#sl-result-root .isl-vback').click();
      await expect(page.locator('#page-setup')).toHaveClass(/active/);
    });
    test('results: time-up reads Time\'s up and Out of time', async ({ page }) => {
      await startExam(page, vp, 3);
      await page.evaluate(() => { window._simLab.examSession().deadlineMs = Date.now() - 1; window._simLab.tickClock(); });
      await expect(page.locator('#page-sim-lab-result')).toHaveClass(/active/);
      await expect(page.locator('#sl-result-root .isl-vkick')).toHaveText("Time's up · 3 rounds");
      await expect(page.locator('#sl-result-root .isl-pv')).toHaveText('Out of time');
      await expect(page.locator('#sl-result-root .isl-pv')).toHaveClass(/over/);
    });
  });
}

test('Lift B3b2 desktop: the exam result keeps its seal and Pace card, with a real target', async ({ page }) => {
  await startExam(page, DESKTOP, 3);
  await page.evaluate(() => window._simLab.examSubmit(false));
  await expect(page.locator('#sl-result-root .sls-seal')).toBeVisible();
  await expect(page.locator('#sl-result-root .slp-pace-card')).toBeVisible();
  await expect(page.locator('#sl-result-root .slp-par-tick')).toHaveText(/^Target \d+:\d\d$/);
  expect(await page.locator('#sl-result-root').textContent()).not.toContain('NaN');
  await expect(page.locator('#sl-result-root .isl-vbody')).toHaveCount(0);
});
