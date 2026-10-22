// tests/e2e/lift-b2.spec.js — Lift B2 (exam and exam results at phone width).
// Spec: docs/superpowers/specs/2026-10-21-ios-lift-b2-design.md. E2E: feat/cert-ios-e2e (597e06e8, 47147981).
// Phones are 390x844 and 402x874; desktop is 1280x800 and must not change.
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };
const TOPICS = ['DNS & DHCP', 'OSPF', 'PKI & Certificates', 'Cable Issues', 'Monitoring & SNMP'];

// A saved 12-question exam (7 answered, Q3 flagged, sitting on Q3), resumed the way Home resumes it.
async function openExam(page, viewport, o) {
  const opts = o || {};
  await page.setViewportSize(viewport);
  await page.addInitScript((op) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    const T = ['DNS & DHCP', 'OSPF', 'PKI & Certificates', 'Cable Issues', 'Monitoring & SNMP'];
    const qs = Array.from({ length: 12 }, (_, i) => ({ type: 'mcq', question: 'Sample exam question ' + (i + 1) + '?' + (op.long ? ' A long scenario sentence about a branch network.'.repeat(40) : ''),
      options: { A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta' }, answer: 'A', explanation: 'Because A.', topic: T[i % 5], difficulty: 'Exam Level' }));
    if (op.pbq) qs[0] = { type: 'simlab', question: 'Find the mask', topic: 'IPv4', explanation: '', simlab: { id: 'b2-pbq', cert: 'netplus', objective: '1.4', topic: 'IPv4',
      title: 'Find the mask', scenario: 'Branch cannot reach HQ.', estMinutes: 5,
      steps: [{ id: 'st1', type: 'fillin', prompt: 'Which mask?', points: 1, explanation: '/26', payload: { fields: [{ id: 'mask', label: 'Mask' }] }, answer: { mask: ['/26'] } }] } };
    const ans = qs.map((_, i) => ({ chosen: (i < 7 && !(op.pbq && i === 0)) ? (i % 3 ? 'A' : 'B') : null, flagged: i === 2, msChosen: [], orderSeq: [], cliRan: [], topoState: {} }));
    try {
      localStorage.setItem('nplus_theme', 'dark');
      localStorage.setItem('nplus_exam_state', JSON.stringify({ v: 1, savedAt: Date.now(), endTime: Date.now() + (op.secondsLeft ? op.secondsLeft * 1000 : 84 * 60000), current: op.pbq ? 0 : 2, questions: qs, answers: ans,
        answered: 7, paused: !!op.paused, pausedAt: op.paused ? Date.now() - 60000 : 0, timeLeft: op.secondsLeft || 5040, pausedMs: 0, pauses: op.paused ? 1 : 0 }));
    } catch (_) {}
  }, opts);
  await page.goto('/');
  await page.waitForLoadState('load');
  // the same path Home's resume tile takes (the exam module is lazy-loaded)
  await page.evaluate(async () => { const m = await _loadFeature('exam'); await m.resumeExam(); });
  await expect(page.locator('#page-exam')).toHaveClass(/active/);
}

async function submitExamViaDialog(page) {
  await page.locator('#page-exam .end-exam-btn').click();
  await page.locator('#exam-modal .btn-primary').click();
  await expect(page.locator('#page-exam-results')).toHaveClass(/active/);
}

for (const vp of PHONES) {
  test.describe('Lift B2 results @' + vp.width, () => {
    test('submitting shows the E2E results screen', async ({ page }) => {
      await openExam(page, vp);
      await submitExamViaDialog(page);
      const r = page.locator('#ios-exam-results');
      await expect(r.locator('.ie-done-title')).toBeVisible();
      await expect(r.locator('.ie-sc-stat')).toHaveCount(4);
      await expect(r.locator('.ie-drow')).toHaveCount(5);
      await expect(page.locator('#page-exam-results .exam-results-v2')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(vp.width);
    });

    test('Review all opens the review', async ({ page }) => {
      await openExam(page, vp);
      await submitExamViaDialog(page);
      await page.locator('#ios-exam-results [data-act="review"]').click();
      await expect(page.locator('#page-review')).toHaveClass(/active/);
    });

    test('Drill the gap starts a quiz on the topics it picked', async ({ page }) => {
      await openExam(page, vp);
      await submitExamViaDialog(page);
      await page.evaluate(() => { window.__t = null; window.startQuiz = () => { window.__t = topic; }; });
      await page.locator('#ios-exam-results [data-act="drill-gap"]').click();
      // the analytics module may still be loading (lazy), so wait for the quiz to start
      await expect.poll(() => page.evaluate(() => window.__t), { timeout: 5000 }).toMatch(/^Multi: /);
    });

    test('Retry the exam starts a new exam', async ({ page }) => {
      await openExam(page, vp);
      await submitExamViaDialog(page);
      await page.evaluate(() => { window.__retry = 0; window.startExam = () => { window.__retry++; }; });
      await page.locator('#ios-exam-results [data-act="retry"]').click();
      await expect.poll(() => page.evaluate(() => window.__retry)).toBe(1);
    });
  });
}

test.describe('Lift B2 desktop is unchanged', () => {
  test('desktop results keep their own page and leave #ios-exam-results empty', async ({ page }) => {
    await openExam(page, DESKTOP);
    await submitExamViaDialog(page);
    await expect(page.locator('#ios-exam-results')).toBeEmpty();
    await expect(page.locator('#page-exam-results .exam-results-v2')).toBeVisible();
  });
});

// ── Task 4: the exam screen itself ──
for (const vp of PHONES) {
  test.describe('Lift B2 exam @' + vp.width, () => {
    test('top bar reads "Question 3 of 12" and "7 answered", with the pace line under it', async ({ page }) => {
      await openExam(page, vp);
      const ex = page.locator('#page-exam');
      await expect(ex.locator('.ix-cn')).toHaveText('Question 3 of 12');
      await expect(ex.locator('.ix-cs')).toHaveText('7 answered');
      await expect(ex.locator('#exam-q-num')).toBeHidden();
      await expect(ex.locator('.end-exam-btn')).toHaveText(/^\s*End\s*$/, { useInnerText: true });
      const pace = ex.locator('#exam-pace');
      await expect(pace).toBeVisible();
      await expect(pace).toHaveText(/ahead|behind|on pace/);
      const cs = await ex.locator('.ix-cs').boundingBox(), pc = await pace.boundingBox();
      expect(pc.y).toBeGreaterThan(cs.y);
      await expect(ex.locator('.qnav-toggle')).toBeHidden();
      await expect(ex.locator('.quiz-kbd-hints')).toBeHidden();
      await expect(ex.locator('#exam-flag-btn')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(vp.width);
    });

    test('the dock is Prev, Flag, Next at the bottom of the screen', async ({ page }) => {
      await openExam(page, vp);
      const ex = page.locator('#page-exam');
      const prev = await ex.locator('#exam-prev-btn').boundingBox();
      const flag = await ex.locator('.ix-flag').boundingBox();
      const next = await ex.locator('#exam-next-btn').boundingBox();
      expect(prev.x).toBeLessThan(flag.x);
      expect(flag.x).toBeLessThan(next.x);
      expect(next.y + next.height).toBeGreaterThan(vp.height - 90);
      expect(next.y + next.height).toBeLessThanOrEqual(vp.height);
      await expect(ex.locator('#exam-next-btn')).toHaveText(/^\s*Next\s*$/, { useInnerText: true });
    });

    test('Flag in the dock toggles aria-pressed and the Flagged chip', async ({ page }) => {
      await openExam(page, vp);
      const ex = page.locator('#page-exam'), flag = ex.locator('.ix-flag');
      await expect(flag).toHaveAttribute('aria-pressed', 'true');
      await expect(ex.locator('.ix-flagged')).toBeVisible();
      await flag.click();
      await expect(flag).toHaveAttribute('aria-pressed', 'false');
      await expect(ex.locator('.ix-flagged')).toBeHidden();
      await flag.click();
      await expect(flag).toHaveAttribute('aria-pressed', 'true');
    });

    test('Next on the last question reads End and opens the End dialog', async ({ page }) => {
      await openExam(page, vp);
      const next = page.locator('#exam-next-btn');
      for (let i = 0; i < 9; i++) await next.click();
      await expect(page.locator('.ix-cn')).toHaveText('Question 12 of 12');
      await expect(next).toHaveText(/^\s*End\s*$/, { useInnerText: true });
      await next.click();
      await expect(page.locator('#exam-modal')).not.toHaveClass(/hidden/);
    });

    test('Pause covers the question and hides the dock; Resume brings it back', async ({ page }) => {
      await openExam(page, vp);
      const ex = page.locator('#page-exam'), pb = ex.locator('#exam-pause-btn');
      await pb.click();
      await expect(pb).toHaveAttribute('aria-label', 'Resume the exam');
      await expect(ex.locator('#exam-paused')).toBeVisible();
      await expect(ex.locator('#exam-paused')).toContainText(/\d+:\d\d left/);
      await expect(ex.locator('.exam-nav-row')).toBeHidden();
      await expect(ex.locator('.q-card')).toBeHidden();
      await ex.locator('#exam-paused .exam-paused-btn').click();
      await expect(ex.locator('.q-card')).toBeVisible();
      await expect(ex.locator('#exam-paused')).toHaveCount(0);
      await expect(pb).toHaveAttribute('aria-label', 'Pause the exam');
    });

    test('a Sim Lab question shows its console and Reset clears it', async ({ page }) => {
      await openExam(page, vp, { pbq: true });
      const ex = page.locator('#page-exam');
      await expect(ex.locator('.ix-cn')).toHaveText('Question 1 of 12');
      const field = ex.locator('.exam-pbq [data-field="mask"]');
      await expect(field).toBeVisible();
      await expect(ex.locator('.ix-cs')).toHaveText('6 answered');
      await field.fill('/26');
      // the counter refreshes on the next render: move on and come back
      await ex.locator('#exam-next-btn').click();
      await ex.locator('#exam-prev-btn').click();
      await expect(ex.locator('.ix-cs')).toHaveText('7 answered');
      await expect(ex.locator('.exam-pbq [data-field="mask"]')).toHaveValue('/26');
      await ex.locator('.exam-pbq .sl-reset').click();   // v8.188.0 (B3b1): phones ask in the in-app sheet, not confirm()
      await page.locator('#exam-sheet .ix-sheet-go').click();
      await expect(ex.locator('.exam-pbq [data-field="mask"]')).toHaveValue('');
      await expect(ex.locator('.ix-cs')).toHaveText('6 answered');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(vp.width);
    });
  });
}

test.describe('Lift B2 exam desktop is unchanged', () => {
  test('desktop keeps End Exam, the navigator and the kbd hints', async ({ page }) => {
    await openExam(page, DESKTOP);
    const ex = page.locator('#page-exam');
    await expect(ex.locator('.end-exam-btn')).toHaveText(/End Exam/, { useInnerText: true });
    await expect(ex.locator('.qnav-toggle')).toBeVisible();
    await expect(ex.locator('.quiz-kbd-hints')).toBeVisible();
    await expect(ex.locator('#exam-q-num')).toHaveText('Q3 / 12');
    await expect(ex.locator('.ix-flag')).toBeHidden();
    await expect(ex.locator('.ix-cn')).toBeHidden();
    await expect(ex.locator('#exam-next-btn')).toHaveText(/Next/, { useInnerText: true });
  });
});

// ── Task 5: End dialog grid, leave and abandon sheets ──
for (const vp of PHONES) {
  test.describe('Lift B2 End dialog and sheets @' + vp.width, () => {
    test('End shows the counts and "Review the 5 you skipped first" goes to the first skipped', async ({ page }) => {
      await openExam(page, vp);
      await page.locator('#page-exam .end-exam-btn').click();
      const m = page.locator('#exam-modal');
      await expect(m).not.toHaveClass(/hidden/);
      await expect(m.locator('#modal-answered')).toHaveText('7');
      await expect(m.locator('#modal-unanswered')).toHaveText('5');
      await expect(m.locator('#modal-flagged')).toHaveText('1');
      await expect(m.locator('#modal-flagged-btn')).toBeHidden();
      const review = m.locator('.ix-review');
      await expect(review).toHaveText('Review the 5 you skipped first');
      await review.click();
      await expect(m).toHaveClass(/hidden/);
      await expect(page.locator('#page-exam .ix-cn')).toHaveText('Question 8 of 12');
    });

    test('Jump to a question opens a grid and goes where you tap', async ({ page }) => {
      await openExam(page, vp);
      await page.locator('#page-exam .end-exam-btn').click();
      const t = page.locator('#exam-modal .ix-jump-t');
      await expect(t).toHaveAttribute('aria-expanded', 'false');
      await t.click();
      await expect(t).toHaveAttribute('aria-expanded', 'true');
      const cells = page.locator('#exam-modal .ix-jgrid button');
      await expect(cells).toHaveCount(12);
      const box = await cells.first().boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(40);
      await cells.filter({ hasText: /^9$/ }).click();
      await expect(page.locator('#exam-modal')).toHaveClass(/hidden/);
      await expect(page.locator('#page-exam .ix-cn')).toHaveText('Question 9 of 12');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(vp.width);
    });

    test('a new question starts at the top of the card', async ({ page }) => {
      await openExam(page, vp, { long: true });
      const card = page.locator('#page-exam .q-card');
      await card.evaluate(el => { el.scrollTop = 400; });
      expect(await card.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
      await page.locator('#exam-next-btn').click();
      expect(await card.evaluate(el => el.scrollTop)).toBe(0);
    });

    test('leaving mid-exam asks in a sheet: Stay keeps the exam, Leave lands on Home', async ({ page }) => {
      await openExam(page, vp);
      let native = 0; page.on('dialog', d => { native++; d.dismiss(); });
      const sheet = page.locator('#exam-sheet');
      await page.evaluate(() => goSetup());
      await expect(sheet).toBeVisible();
      await expect(sheet.locator('#exam-sheet-title')).toHaveText('Leave the exam?');
      await expect(sheet).toContainText('The clock keeps running, and you can resume from Home.');
      await sheet.locator('.ix-sheet-stay').click();
      await expect(sheet).toBeHidden();
      await expect(page.locator('#page-exam')).toHaveClass(/active/);
      await page.evaluate(() => goSetup());
      await sheet.locator('.ix-sheet-go').click();
      await expect(page.locator('#page-setup')).toHaveClass(/active/);
      await expect(page.getByText('Resume your exam').first()).toBeVisible();
      expect(native).toBe(0);
    });

    test('Leave goes to the page that was asked for', async ({ page }) => {
      await openExam(page, vp);
      await page.evaluate(() => showPage('progress'));
      await page.locator('#exam-sheet .ix-sheet-go').click();
      await expect(page.locator('#page-progress')).toHaveClass(/active/);
    });

    test('Abandon asks in a sheet; Keep going returns to the dialog', async ({ page }) => {
      await openExam(page, vp);
      let native = 0; page.on('dialog', d => { native++; d.dismiss(); });
      await page.locator('#page-exam .end-exam-btn').click();
      await page.locator('#exam-modal .btn-danger').click();
      const sheet = page.locator('#exam-sheet');
      await expect(sheet.locator('#exam-sheet-title')).toHaveText('Abandon this exam?');
      await expect(sheet).toContainText('Your answers will be lost.');
      await sheet.locator('.ix-sheet-stay').click();
      await expect(sheet).toBeHidden();
      await expect(page.locator('#exam-modal')).not.toHaveClass(/hidden/);
      await page.locator('#exam-modal .btn-danger').click();
      await sheet.locator('.ix-sheet-go').click();
      await expect(page.locator('#page-setup')).toHaveClass(/active/);
      expect(await page.evaluate(() => localStorage.getItem('nplus_exam_state'))).toBeNull();
      expect(native).toBe(0);
    });
  });
}

test.describe('Lift B2 desktop leave is unchanged', () => {
  test('desktop leave still asks with confirm()', async ({ page }) => {
    await openExam(page, DESKTOP);
    let msg = '';
    page.once('dialog', d => { msg = d.message(); d.dismiss(); });
    await page.evaluate(() => goSetup());
    await expect.poll(() => msg).toContain('Leave the exam?');
    await expect(page.locator('#page-exam')).toHaveClass(/active/);
    await expect(page.locator('#exam-sheet')).toBeHidden();
  });
});

// ── Found during B2: the end-of-day recap's × sat under its own eyebrow ──
for (const vp of [...PHONES, DESKTOP]) {
  test('the daily recap closes from its × @' + vp.width, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
      const now = new Date().toISOString();
      localStorage.setItem('nplus_history', JSON.stringify([{ date: now, topic: 'OSPF', score: 18, total: 25, pct: 72, difficulty: 'Exam Level', mode: 'quiz' }]));
    });
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.evaluate(() => _maybeShowDailyRecap());
    const modal = page.locator('#daily-recap-modal');
    await expect(modal).toBeVisible();
    await modal.locator('.daily-recap-close').click({ timeout: 3000 });
    await expect(modal).toBeHidden();
  });
}

// ── Final-review fix pass (review of 8bb03fa7..63082fbf) ──
for (const vp of PHONES) {
  test.describe('Lift B2 review fixes @' + vp.width, () => {
    test('a leave sheet open when the clock runs out closes with the exam (I1)', async ({ page }) => {
      await openExam(page, vp, { secondsLeft: 3 });
      await page.evaluate(() => goSetup());
      await expect(page.locator('#exam-sheet')).toBeVisible();
      await expect(page.locator('#page-exam-results')).toHaveClass(/active/, { timeout: 8000 });
      await expect(page.locator('#exam-sheet')).toBeHidden();
    });

    test('keys pressed while the sheet is open do not reach the exam (I3)', async ({ page }) => {
      await openExam(page, vp);
      const before = await page.evaluate(() => examAnswers[examCurrent].chosen);
      await page.locator('#page-exam .end-exam-btn').click();
      await page.locator('#exam-modal .btn-danger').click();
      await expect(page.locator('#exam-sheet')).toBeVisible();
      await page.keyboard.press('a'); await page.keyboard.press('d'); await page.keyboard.press('f');
      expect(await page.evaluate(() => [examAnswers[examCurrent].chosen, examAnswers[examCurrent].flagged])).toEqual([before, true]);
      await page.keyboard.press('Escape');
      await expect(page.locator('#exam-sheet')).toBeHidden();
      await expect(page.locator('#exam-modal')).not.toHaveClass(/hidden/);   // Escape closed the sheet only
    });

    test('opening the End dialog moves focus into it (I4)', async ({ page }) => {
      await openExam(page, vp);
      await page.locator('#page-exam .end-exam-btn').click();
      await expect.poll(() => page.evaluate(() => { const a = document.activeElement; return !!(a && a.closest('#exam-modal') && a.offsetParent); })).toBe(true);
    });

    test('"Retry the exam" is a full-size tap target (I6)', async ({ page }) => {
      await openExam(page, vp);
      await submitExamViaDialog(page);
      const box = await page.locator('#ios-exam-results [data-act="retry"]').boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(40);
    });
  });
}

