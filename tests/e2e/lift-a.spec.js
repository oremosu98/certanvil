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
    await expect(page.locator('#options .option').nth(1)).not.toHaveClass(/\bsel\b/);   // the pick turns red, not bronze
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

test.describe('Lift A review fixes', () => {
  test('phone: a failed quiz start shows its error on Home (not hidden)', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('nplus_key', 'sk-ant-api03-' + 'x'.repeat(90)); } catch (_) {} });
    await openApp(page, PHONE);
    await page.evaluate(() => { window._gateActivityForQuota = () => true; window._gateSessionSizeForQuota = () => true; window.fetchQuestions = () => Promise.reject(new Error('Boom test failure')); });
    await page.locator('#ios-home [data-act="warmup"]').click();
    await expect(page.locator('#page-setup')).toHaveClass(/active/);
    await expect(page.locator('#setup-err')).toBeVisible();
  });

  test('phone results never show a previous session after a wide (desktop-width) finish', async ({ page }) => {
    await inject(page, PHONE, QUIZ);
    await finishQuiz(page);
    await page.setViewportSize(DESKTOP);
    await page.evaluate((q) => window._testInjectQuiz(q), QUIZ);
    for (let i = 0; i < 2; i++) { await page.locator('#options .option').nth(2).click(); await page.locator('#btn-next').click(); }
    await expect(page.locator('#page-results')).toHaveClass(/active/);
    expect(await page.evaluate(() => document.getElementById('ios-results').innerHTML)).toBe('');
  });

  test('phone: if the phone Home script never loads, the desktop Home still shows (no blank screen)', async ({ page }) => {
    await page.route(/features\/ios-home\.js/, r => r.abort());
    await openApp(page, PHONE);
    await expect(page.locator('#page-setup .bento')).toBeVisible();
  });
});

// ── Custom quiz (phone) — spec docs/superpowers/specs/2026-10-20-ios-custom-quiz-design.md ──
const KEY = () => { try { localStorage.setItem('nplus_key', 'sk-ant-api03-' + 'x'.repeat(90)); } catch (_) {} };
async function openCustom(page) {
  await page.locator('#ios-home [data-act="custom"]').click();
  await expect(page.locator('#ios-custom .ic-topbar')).toBeVisible();
}
const hiddenOn = (page, sel) => page.evaluate((s) => !!document.querySelector(s) && document.querySelector(s).classList.contains('on'), sel);

test.describe('Lift A custom quiz (phone)', () => {
  test('custom: Home "Build a custom quiz" opens the phone screen', async ({ page }) => {
    await openApp(page, PHONE);
    await openCustom(page);
    await expect(page.locator('#ios-home')).toBeHidden();
    await expect(page.locator('#custom-quiz-section')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });

  test('custom: Catch-up card drives the real chip', async ({ page }) => {
    await openApp(page, PHONE);
    await openCustom(page);
    await page.locator('#ios-custom .ic-mode-wide').click();
    expect(await hiddenOn(page, '#topic-group .chip[data-v="Mixed — Catch-up"]')).toBe(true);
    await expect(page.locator('#ios-custom .ic-mode-wide')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#ios-custom .ic-foot-note')).toHaveText(/^The topics you've gone longest without, /);
  });

  test('custom: domain chip picks the domain', async ({ page }) => {
    await openApp(page, PHONE);
    await openCustom(page);
    await page.locator('#ios-custom [data-act="domain"][data-idx="1"]').click();
    const allOn = await page.evaluate(() => [...document.querySelectorAll('details.topic-domain-group[data-domain-idx="1"] .chip')].every(c => c.classList.contains('on')));
    expect(allOn).toBe(true);
    await expect(page.locator('#ios-custom .ic-dom[data-idx="1"] .ic-picked')).toHaveText('all picked');
    expect(await page.evaluate(() => document.querySelectorAll('#topic-group .cq-mode-card.on').length)).toBe(0);
  });

  test('custom: topic, Hard and 5 reach the hidden controls', async ({ page }) => {
    await openApp(page, PHONE);
    await openCustom(page);
    await page.locator('#ios-custom .ic-dom[data-idx="2"] .ic-dom-head').click();
    const first = page.locator('#ios-custom .ic-dom[data-idx="2"] [data-act="topic"]').first();
    const v = await first.getAttribute('data-v');
    await first.click();
    expect(await page.evaluate((x) => document.querySelector('#topic-group .chip[data-v="' + CSS.escape(x) + '"]').classList.contains('on'), v)).toBe(true);
    await page.locator('#ios-custom [data-act="diff"][data-v="Hard / Tricky"]').click();
    await page.locator('#ios-custom [data-act="count"][data-v="5"]').click();
    expect(await hiddenOn(page, '#diff-group .chip[data-v="Hard / Tricky"]')).toBe(true);
    expect(await hiddenOn(page, '#count-group .chip[data-v="5"]')).toBe(true);
    await expect(page.locator('#ios-custom .ic-qc')).toHaveText('5 Q');
    await expect(page.locator('#ios-custom .ic-foot-note')).toHaveText(/^1 topic from .+, hard\.$/);
  });

  test('custom: Start generates with the chosen settings', async ({ page }) => {
    await page.addInitScript(KEY);
    await openApp(page, PHONE);
    await page.evaluate(() => { window._gateActivityForQuota = () => true; window._gateSessionSizeForQuota = () => true; window.fetchQuestions = () => new Promise(() => {}); });
    await openCustom(page);
    await page.locator('#ios-custom [data-act="count"][data-v="5"]').click();
    await page.locator('#ios-custom [data-act="start"]').click();
    await expect(page.locator('#page-loading')).toHaveClass(/active/);
    await expect(page.locator('#ios-custom')).toBeEmpty();
    expect(await page.evaluate(() => (typeof qCount !== 'undefined') ? qCount : null)).toBe(5);
  });

  test('custom: ✕ returns Home', async ({ page }) => {
    await openApp(page, PHONE);
    await openCustom(page);
    await page.locator('#ios-custom [data-act="close"]').click();
    await expect(page.locator('#ios-custom')).toBeEmpty();
    await expect(page.locator('#ios-home .ih-topbar')).toBeVisible();
  });

  test('custom: drill-a-topic opens with the topic picked and its domain open', async ({ page }) => {
    await page.addInitScript(() => {
      const T = ['AAA & Authentication', 'OSPF', 'Port Numbers'];
      const h = Array.from({ length: 9 }, (_, i) => ({ date: new Date(Date.now() - (i + 1) * 864e5).toISOString(), topic: T[i % 3], difficulty: 'Exam Level', score: 6, total: 10, pct: 60, mode: 'quiz' }));
      try { localStorage.setItem('nplus_history', JSON.stringify(h)); } catch (_) {}
    });
    await openApp(page, PHONE);
    await page.evaluate(() => showPage('progress'));
    const row = page.locator('#page-progress .t-row[data-topic="AAA & Authentication"]').first();
    await expect(row).toBeVisible();
    const topic = await row.getAttribute('data-topic');
    await row.click();
    await expect(page.locator('#ios-custom .ic-topbar')).toBeVisible();
    const chip = page.locator('#ios-custom [data-act="topic"][data-v="' + topic.replace(/"/g, '\\"') + '"]');
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    const dom = page.locator('#ios-custom .ic-dom').filter({ has: page.locator('[data-act="topic"][data-v="' + topic.replace(/"/g, '\\"') + '"]') });
    await expect(dom).toHaveAttribute('aria-expanded', 'true');
    await expect(dom.locator('.ic-picked')).toHaveText('1 picked');
    // fix M2: the picked topic's domain is scrolled into view once Setup is active
    await expect.poll(async () => { const bb = await dom.boundingBox(); return !!bb && bb.y >= 0 && bb.y + 40 <= 844; }, { timeout: 3000 }).toBe(true);
  });

  test('custom: setup error shows inside the screen', async ({ page }) => {
    await openApp(page, PHONE);
    await page.evaluate(() => { const b = document.getElementById('setup-err'); b.textContent = 'Add your API key to start.'; b.classList.remove('is-hidden'); showSetupError(); });
    await expect(page.locator('#ios-custom .ic-err')).toContainText('Add your API key to start.');
  });

  test('custom: opening twice leaves one screen and no scroll lock', async ({ page }) => {
    await openApp(page, PHONE);
    await openCustom(page);
    await page.evaluate(() => { _jumpToCustomQuiz(); _jumpToCustomQuiz(); });
    await page.waitForTimeout(150);
    expect(await page.locator('#ios-custom .ic-topbar').count()).toBe(1);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
    expect(await page.evaluate(() => document.getElementById('custom-quiz-section').open)).toBe(false);
  });

  test('custom: Security+ lists its own domains', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('nplus_dev_cert', 'secplus'); } catch (_) {} });
    await openApp(page, PHONE);
    await openCustom(page);
    const want = await page.evaluate(() => [...document.querySelectorAll('details.topic-domain-group .dom-name')].map(n => n.textContent.trim()));
    const got = await page.locator('#ios-custom .ic-dh-txt b').allTextContents();
    expect(got).toEqual(want);
    expect(got[0]).not.toMatch(/Networking Concepts/);
  });

  test('custom: growing past 899px clears the phone screen', async ({ page }) => {
    await openApp(page, PHONE);
    await openCustom(page);
    await page.setViewportSize(DESKTOP);
    await expect(page.locator('#ios-custom')).toBeEmpty();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
  });

  test('custom: leaving Setup closes it', async ({ page }) => {
    await openApp(page, PHONE);
    await openCustom(page);
    await page.evaluate(() => showPage('progress'));
    await expect(page.locator('#page-progress')).toHaveClass(/active/);
    await page.evaluate(() => goSetup());
    await expect(page.locator('#ios-custom')).toBeEmpty();
    await expect(page.locator('#ios-home .ih-topbar')).toBeVisible();
  });

  test('custom (fix C1): AZ-900 lists only its own domains, no stale Network+ slots', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('nplus_dev_cert', 'az900'); } catch (_) {} });
    await openApp(page, PHONE);
    await openCustom(page);
    const want = await page.evaluate(() => [...document.querySelectorAll('details.topic-domain-group')].filter(d => d.querySelector('.chip[data-v]')).length);
    await expect(page.locator('#ios-custom .ic-dom')).toHaveCount(want);
    await expect(page.locator('#ios-custom [data-act="domain"]')).toHaveCount(want);
    const names = await page.locator('#ios-custom .ic-dh-txt b').allTextContents();
    expect(names.some(n => /Network/.test(n))).toBe(false);
    const counts = await page.locator('#ios-custom .ic-dh-txt small').allTextContents();
    expect(counts.some(t => /^0 topics/.test(t))).toBe(false);
  });

  test('custom (fix I1): signed-out Start keeps the screen, shows the error in view with Sign in', async ({ page }) => {
    await openApp(page, PHONE);
    await page.evaluate(() => { window._certanvilSignedIn = false; window._gateActivityForQuota = () => true; window._gateSessionSizeForQuota = () => true; });
    await openCustom(page);
    await page.locator('#ios-custom [data-act="start"]').click();
    await expect(page.locator('#page-setup')).toHaveClass(/active/);
    const err = page.locator('#ios-custom .ic-err');
    await expect(err).toBeVisible();
    await expect(err.locator('[data-act="signin"]')).toBeVisible();
    await expect.poll(async () => { const bb = await err.boundingBox(); return !!bb && bb.y >= 0 && bb.y + bb.height <= 844; }, { timeout: 3000 }).toBe(true);
  });

  test('custom (fix I2): narrowing with the desktop modal open hands over to the phone screen', async ({ page }) => {
    await openApp(page, DESKTOP);
    await page.evaluate(() => _jumpToCustomQuiz());
    await expect(page.locator('#custom-quiz-section')).toHaveAttribute('open', '');
    await page.setViewportSize(PHONE);
    await expect(page.locator('#ios-custom .ic-topbar')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
    expect(await page.evaluate(() => document.getElementById('custom-quiz-section').open)).toBe(false);
  });

  test('custom (fix I3): focus stays on the control you used after the screen re-renders', async ({ page }) => {
    await openApp(page, PHONE);
    await openCustom(page);
    await page.locator('#ios-custom [data-act="mode"][data-v="Mixed — Catch-up"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#ios-custom .ic-mode-wide')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => { const a = document.activeElement; return a && a.getAttribute('data-act') + '|' + a.getAttribute('data-v'); })).toBe('mode|Mixed — Catch-up');
  });

  test('custom (fix I3): collapsed topics are out of reach; the header carries aria-expanded', async ({ page }) => {
    await openApp(page, PHONE);
    await openCustom(page);
    const head = page.locator('#ios-custom .ic-dom[data-idx="3"] .ic-dom-head');
    await expect(head).toHaveAttribute('aria-expanded', 'false');
    const chip = page.locator('#ios-custom .ic-dom[data-idx="3"] [data-act="topic"]').first();
    expect(await chip.evaluate(el => getComputedStyle(el).visibility)).toBe('hidden');
    await head.click();
    await expect(head).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(() => chip.evaluate(el => getComputedStyle(el).visibility)).toBe('visible');
  });

  test('custom (fix M4): Free sees the cap note; 20 is dimmed and opens the Pro prompt', async ({ page }) => {
    await openApp(page, PHONE);
    await page.evaluate(() => { window._srIsFreeTier = () => true; });
    await openCustom(page);
    await expect(page.locator('#ios-custom .ic-cap-note')).toHaveText('Free covers 15 questions a day. 20 needs Pro.');
    await expect(page.locator('#ios-custom [data-act="count"][data-v="20"]')).toHaveClass(/ic-overcap/);
    await page.locator('#ios-custom [data-act="count"][data-v="20"]').click();
    await expect(page.getByText('Bigger sets are a Pro feature')).toBeVisible();
    expect(await hiddenOn(page, '#count-group .chip[data-v="10"]')).toBe(true);
  });

  test('custom (fix M4): Pro sees no cap note and an undimmed 20', async ({ page }) => {
    await openApp(page, PHONE);
    await page.evaluate(() => { window._srIsFreeTier = () => false; });
    await openCustom(page);
    await expect(page.locator('#ios-custom .ic-cap-note')).toHaveCount(0);
    await expect(page.locator('#ios-custom [data-act="count"][data-v="20"]')).not.toHaveClass(/ic-overcap/);
  });

  test('custom: desktop still gets the modal', async ({ page }) => {
    await openApp(page, DESKTOP);
    await page.evaluate(() => _jumpToCustomQuiz());
    await expect(page.locator('#custom-quiz-section')).toHaveAttribute('open', '');
    await expect(page.locator('#custom-quiz-section')).toBeVisible();
    await expect(page.locator('#ios-custom')).toBeEmpty();
  });
});
