// tests/e2e/lift-a.spec.js — Lift A (iOS June design at phone width).
// Spec: docs/superpowers/specs/2026-10-19-ios-launch-june-design.md (Fidelity rule).
// Phone = 390x844; desktop = 1280x800. Desktop must be untouched by Lift A.
const { test, expect } = require('@playwright/test');

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

async function openApp(page, viewport, theme) {
  await page.setViewportSize(viewport);
  await page.addInitScript((t) => { try { localStorage.setItem('nplus_theme', t); } catch (_) {} }, theme || 'dark');
  await page.goto('/');
  await page.waitForLoadState('load');
}

test.describe('Lift A scaffold', () => {
  test('desktop never shows ios-only', async ({ page }) => {
    await openApp(page, DESKTOP);
    const shown = await page.evaluate(() => [...document.querySelectorAll('.ios-only')]
      .filter(el => getComputedStyle(el).display !== 'none').map(el => el.id || el.className));
    expect(shown).toEqual([]);
  });

  test('phone uses E2E tokens (dark and light)', async ({ page }) => {
    await openApp(page, PHONE, 'dark');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const dark = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
    expect(dark).toBe('oklch(0.15 0.010 275)');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    const light = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
    expect(light).toBe('oklch(0.55 0.155 55)');
  });
});

test.describe('Lift A Home', () => {
  test('phone renders the E2E Home and hides the desktop bento', async ({ page }) => {
    await openApp(page, PHONE);
    await expect(page.locator('#ios-home .ih-topbar')).toBeVisible();
    await expect(page.locator('#ios-home .ih-rd')).toBeVisible();
    await expect(page.locator('#page-setup .bento')).toBeHidden();
    await expect(page.locator('#app-topbar')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });

  test('phone: Home buttons call the same handlers as the desktop Home', async ({ page }) => {
    await openApp(page, PHONE);
    await page.evaluate(() => {
      window.__calls = [];
      ['applyPreset', 'startDailyChallenge', 'startExam', '_jumpToCustomQuiz'].forEach(n => { window[n] = (...a) => window.__calls.push(n + ':' + a.join(',')); });
    });
    await page.locator('#ios-home [data-act="warmup"]').click();
    await page.locator('#ios-home [data-act="daily"]').click();
    await page.locator('#ios-home [data-act="custom"]').click();
    expect(await page.evaluate(() => window.__calls)).toEqual(['applyPreset:warmup', 'startDailyChallenge:', '_jumpToCustomQuiz:']);
  });

  test('phone: Practice accordion opens and shows its three options', async ({ page }) => {
    await openApp(page, PHONE);
    const acc = page.locator('#ios-home [data-acc]').first();
    await acc.locator('.ih-acc-head').click();
    await expect(acc).toHaveClass(/ih-open/);
    await expect(acc.locator('[data-act="grind"]')).toBeVisible();
  });

  test('desktop keeps the bento Home and never shows the E2E Home', async ({ page }) => {
    await openApp(page, DESKTOP);
    await expect(page.locator('#ios-home')).toBeHidden();
    await expect(page.locator('#page-setup .bento')).toBeVisible();
  });
});

test.describe('Lift A generating screen', () => {
  test('phone: starting a quiz shows the E2E generating screen; ✕ cancels back to Home', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('nplus_key', 'sk-ant-api03-' + 'x'.repeat(90)); } catch (_) {} });
    await openApp(page, PHONE);
    // Hold generation open (a slow network) so the loading screen stays up.
    await page.evaluate(() => { window._gateActivityForQuota = () => true; window._gateSessionSizeForQuota = () => true; window.fetchQuestions = () => new Promise(() => {}); });
    await page.locator('#ios-home [data-act="warmup"]').click();
    await expect(page.locator('#page-loading')).toHaveClass(/active/);
    await expect(page.locator('#ios-loading .iq-gen-line')).toHaveText(/^Generating 5 Foundational questions on .+\.\.\.$/);
    await expect(page.locator('#ios-loading .iq-btn-primary')).toBeDisabled();
    await page.locator('#ios-loading [data-act="cancel"]').click();
    await expect(page.locator('#page-setup')).toHaveClass(/active/);
  });
});

const QUIZ = [
  { type: 'mcq', question: 'Which port does HTTPS use by default?', options: { A: '80', B: '22', C: '443', D: '53' }, answer: 'C', explanation: 'HTTPS uses TCP 443.', topic: 'Ports & Protocols', difficulty: 'Foundational' },
  { type: 'mcq', question: 'At which OSI layer does ICMP operate?', options: { A: 'Layer 2', B: 'Layer 3', C: 'Layer 4', D: 'Layer 7' }, answer: 'B', explanation: 'ICMP is Layer 3.', topic: 'OSI Model', difficulty: 'Foundational' },
];
const MS = [{ type: 'multi-select', question: 'Pick TWO secure protocols.', options: { A: 'SSH', B: 'Telnet', C: 'HTTPS', D: 'FTP' }, answers: ['A', 'C'], explanation: 'SSH and HTTPS encrypt.', topic: 'Ports & Protocols', difficulty: 'Foundational' }];
async function inject(page, viewport, qs) {
  await openApp(page, viewport);
  await page.evaluate((q) => window._testInjectQuiz(q), qs);
  await expect(page.locator('#page-quiz')).toHaveClass(/active/);
}

test.describe('Lift A quiz: pick, then confirm (phone)', () => {
  test('phone: tapping an option only selects it; Next is disabled until then', async ({ page }) => {
    await inject(page, PHONE, QUIZ);
    await expect(page.locator('#btn-next')).toBeDisabled();
    await page.locator('#options .option').nth(1).click();
    await expect(page.locator('#options .option').nth(1)).toHaveClass(/\bsel\b/);
    await expect(page.locator('#options .option.correct, #options .option.wrong')).toHaveCount(0);
    expect(await page.evaluate(() => log.length)).toBe(0);
    await expect(page.locator('#btn-next')).toBeEnabled();
  });

  test('phone: Next submits the selection, then reads "Next question"', async ({ page }) => {
    await inject(page, PHONE, QUIZ);
    await page.locator('#options .option').nth(1).click();
    await page.locator('#btn-next').click();
    expect(await page.evaluate(() => log.length)).toBe(1);
    await expect(page.locator('#options .option').nth(1)).toHaveClass(/wrong/);
    await expect(page.locator('#exp-box')).toBeVisible();
    await expect(page.locator('#btn-next')).toHaveText('Next question');
    await page.locator('#btn-next').click();
    await expect(page.locator('#q-label')).toContainText('Question 2 of 2');
  });

  test('phone: a multi-select question keeps its own flow (no confirm gate)', async ({ page }) => {
    await inject(page, PHONE, MS);
    await page.locator('#options .option').first().click();
    await expect(page.locator('#options .option').first()).toHaveClass(/ms-selected/);
  });

  test('phone: Flag sits in the top-right corner and toggles aria-pressed', async ({ page }) => {
    await inject(page, PHONE, QUIZ);
    const flag = page.locator('#quiz-flag-btn');
    const box = await flag.boundingBox();
    expect(box.x + box.width).toBeGreaterThan(390 - 30);
    expect(box.y).toBeLessThan(80);
    await flag.click();
    await expect(flag).toHaveAttribute('aria-pressed', 'true');
  });

  test('desktop: one tap still answers immediately', async ({ page }) => {
    await inject(page, DESKTOP, QUIZ);
    await page.locator('#options .option').nth(2).click();
    await expect(page.locator('#options .option').nth(2)).toHaveClass(/correct/);
    expect(await page.evaluate(() => log.length)).toBe(1);
  });
});

async function finishQuiz(page) {
  for (let i = 0; i < 2; i++) {
    await page.locator('#options .option').first().click();
    await page.locator('#btn-next').click();   // confirm
    await page.locator('#btn-next').click();   // next / see results
  }
  await expect(page.locator('#page-results')).toHaveClass(/active/);
}

test.describe('Lift A results (phone)', () => {
  test('phone: finishing a quiz shows the E2E results with Redo this quiz + Back to menu', async ({ page }) => {
    await inject(page, PHONE, QUIZ);
    await finishQuiz(page);
    await expect(page.locator('#ios-results .ir-done-kick')).toHaveText('Session complete');
    await expect(page.locator('#ios-results .ir-scaled-of')).toHaveText('/ 900');
    await expect(page.locator('#ios-results [data-act="redo"]')).toHaveText('Redo this quiz');
    await expect(page.locator('#ios-results .ir-qrow')).toHaveCount(2);
    await page.evaluate(() => { window.__redo = 0; window.retryQuiz = () => { window.__redo++; }; });
    await page.locator('#ios-results [data-act="redo"]').click();
    expect(await page.evaluate(() => window.__redo)).toBe(1);
    await page.locator('#ios-results [data-act="menu"]').click();
    await expect(page.locator('#page-setup')).toHaveClass(/active/);
  });

  test('phone: CLF-C02 results use its own scale (/ 1000)', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('nplus_dev_cert', 'clfc02'); } catch (_) {} });
    await inject(page, PHONE, QUIZ);
    await finishQuiz(page);
    await expect(page.locator('#ios-results .ir-scaled-of')).toHaveText('/ 1000');
  });

  test('desktop: results page is the existing desktop layout', async ({ page }) => {
    await inject(page, DESKTOP, QUIZ);
    for (let i = 0; i < 2; i++) { await page.locator('#options .option').first().click(); await page.locator('#btn-next').click(); }
    await expect(page.locator('#page-results')).toHaveClass(/active/);
    await expect(page.locator('#ios-results')).toBeHidden();
  });
});

test.describe('Lift A review answers (phone)', () => {
  test('phone: All / Wrong only filters; Flagged hidden with no flags; Done returns to results', async ({ page }) => {
    await inject(page, PHONE, QUIZ);
    await finishQuiz(page);   // picks A twice: Q1 wrong (answer C), Q2 wrong (answer B)
    await page.locator('#ios-results [data-act="review"]').click();
    await expect(page.locator('#page-review')).toHaveClass(/active/);
    await expect(page.locator('#ios-review .ia-sline')).toContainText('2 questions');
    await expect(page.locator('#ios-review [data-mode="flag"]')).toHaveCount(0);
    await expect(page.locator('#ios-review .ia-qa')).toHaveCount(2);
    await page.locator('#ios-review [data-mode="wrong"]').click();
    await expect(page.locator('#ios-review .ia-qa')).toHaveCount(2);
    await expect(page.locator('#ios-review .ia-qa-opt.ia-yours-wrong .ia-tag').first()).toHaveText('Your pick');
    await page.locator('#ios-review [data-act="done"]').click();
    await expect(page.locator('#page-results')).toHaveClass(/active/);
  });

  test('phone: a flagged question shows the Flagged filter and tag', async ({ page }) => {
    await inject(page, PHONE, QUIZ);
    await page.locator('#quiz-flag-btn').click();
    await finishQuiz(page);
    await page.locator('#ios-results [data-act="review"]').click();
    await page.locator('#ios-review [data-mode="flag"]').click();
    await expect(page.locator('#ios-review .ia-qa')).toHaveCount(1);
    await expect(page.locator('#ios-review .ia-qa-flag')).toContainText('Flagged');
  });
});
