// Lift B3b1 (v8.188.0): practice Sim Lab on phones, against cert-ios-simlab.html.
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
async function setTier(page, tier) {
  // the way the app lands a tier: set _quotaState, then re-run renderGauntletDrillsCard
  await page.evaluate((t) => {
    window._quotaState = t === 'pro' ? { tier: 'pro' } : { tier: 'free', used_today: 0, daily_limit: 15 };
    document.body.classList.add('is-state-resolved');
    document.body.classList.toggle('is-pro-tier', t === 'pro');
    if (typeof renderGauntletDrillsCard === 'function') renderGauntletDrillsCard();
  }, tier || 'free');
}
async function openEntry(page, viewport, tier) {
  await boot(page, viewport, tier);
  await page.evaluate(() => startSimLabHome());
  await expect(page.locator('#page-sim-lab-entry')).toHaveClass(/active/);
  await setTier(page, tier);
}
async function record(page, names) {
  await page.evaluate((ns) => {
    window.__calls = [];
    ns.forEach((n) => { window[n] = function () { window.__calls.push(n); }; });
  }, names);
}

for (const vp of PHONES) {
  test.describe('Lift B3b1 start screen @' + vp.width, () => {
    test('June start screen replaces the old one, no app top bar, tab bar stays', async ({ page }) => {
      await openEntry(page, vp);
      const entry = page.locator('#isl-entry');
      await expect(entry.locator('.isl-title h1')).toHaveText('Sim Lab');
      await expect(page.locator('#page-sim-lab-entry .gnt-shell')).toBeHidden();
      await expect(page.locator('#app-topbar')).toBeHidden();
      await expect(page.locator('#lift-tabbar')).toBeVisible();
      await expect(entry.locator('.isl-cap')).toContainText('Free covers one Sim Lab session a day');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const small = await page.evaluate(() => [].slice.call(document.querySelectorAll('#isl-entry [data-act]:not(.isl-back)'))
        .filter((b) => b.getBoundingClientRect().height < 44).map((b) => b.textContent.trim()));
      expect(small).toEqual([]);
      const backHit = await page.evaluate(() => getComputedStyle(document.querySelector('#isl-entry .isl-back'), '::after').content);
      expect(backHit).not.toBe('none');
      const dock = await page.evaluate(() => {
        const d = document.querySelector('#isl-entry .isl-dock').getBoundingClientRect(), t = document.getElementById('lift-tabbar').getBoundingClientRect();
        return { bottom: Math.round(d.bottom), tabTop: Math.round(t.top), top: Math.round(d.top) };
      });
      expect(Math.abs(dock.bottom - dock.tabTop)).toBeLessThanOrEqual(1);   // Start is docked right above the tab bar, on screen
      expect(dock.top).toBeLessThan(vp.height);
    });

    test('rounds drive the real chips; locked 10 and Exam open the Pro gate', async ({ page }) => {
      await openEntry(page, vp);
      await page.locator('#isl-entry [data-act="rounds"][data-rounds="3"]').click();
      await expect(page.locator('#isl-entry .isl-bn')).toHaveText('3');
      await expect(page.locator('#isl-entry .isl-qc')).toHaveText('3 rounds');
      await expect(page.locator('#sle-rounds [data-rounds="3"]')).toHaveClass(/is-on/);
      await record(page, ['_gateProOnly']);
      await page.locator('#isl-entry [data-act="rounds"][data-rounds="10"]').click();
      await page.locator('#isl-entry [data-act="mode"][data-mode="exam"]').click();
      expect(await page.evaluate(() => window.__calls)).toEqual(['_gateProOnly', '_gateProOnly']);
      await expect(page.locator('#isl-entry .isl-bn')).toHaveText('3');
      await expect(page.locator('#isl-entry [data-mode="practice"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#sle-rounds [data-rounds="10"]')).not.toHaveClass(/is-on/);
    });

    test('a tier that lands late repaints the locks in place', async ({ page }) => {
      await boot(page, vp, 'free');
      await page.evaluate(() => { window._quotaState = null; document.body.classList.remove('is-state-resolved'); startSimLabHome(); });
      await expect(page.locator('#page-sim-lab-entry')).toHaveClass(/active/);
      await page.evaluate(() => { window._quotaState = null; document.body.classList.remove('is-state-resolved'); renderIosSimLabEntry(); });
      await expect(page.locator('#isl-entry [data-locked]')).toHaveCount(0);
      await setTier(page, 'free');
      await expect(page.locator('#isl-entry [data-rounds="10"][data-locked="1"]')).toHaveCount(1);
      await expect(page.locator('#isl-entry .isl-cap')).toHaveCount(1);
    });

    test('Pro picks Exam and 10; Start and Back reach their entries', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await expect(page.locator('#isl-entry .isl-cap')).toHaveCount(0);
      await page.locator('#isl-entry [data-act="mode"][data-mode="exam"]').click();
      await page.locator('#isl-entry [data-act="rounds"][data-rounds="10"]').click();
      await expect(page.locator('#isl-entry .isl-start')).toContainText('Start exam sim');
      await expect(page.locator('#isl-entry .isl-foot')).toContainText('one clock for all 10 rounds');
      await record(page, ['simLabSessionStart']);
      await page.locator('#isl-entry [data-act="start"]').click();
      expect(await page.evaluate(() => window.__calls)).toEqual(['simLabSessionStart']);
      await page.locator('#isl-entry [data-act="back"]').click();
      await expect(page.locator('#page-setup')).toHaveClass(/active/);
    });
  });
}

test('Lift B3b1 desktop: the start screen is today\'s', async ({ page }) => {
  await openEntry(page, DESKTOP);
  await expect(page.locator('#isl-entry')).toBeEmpty();
  await expect(page.locator('#page-sim-lab-entry .gnt-shell')).toBeVisible();
});

// ── Task 4: the round ──
async function startSession(page, viewport) {
  await openEntry(page, viewport, 'free');
  await page.evaluate(() => {
    try { localStorage.removeItem('nplus_pbq_free_count'); } catch (_) {}
    window._slMeteredGenerate = async () => ({ bad: true });   // force the seed pool (offline)
  });
  await page.locator('#isl-entry [data-act="rounds"][data-rounds="3"]').click();
  await page.locator('#isl-entry [data-act="start"]').click();
  await expect(page.locator('#page-sim-lab')).toHaveClass(/active/);
  await page.waitForSelector('#sl-body [data-action="simLabSubmitScenario"]', { timeout: 8000 });
}
// Mount one seed directly (fixed reference kinds). pick: a function body run against the Net+ seed pool.
async function mountSeed(page, viewport, pick, opts) {
  await boot(page, viewport, 'free');
  await page.evaluate(async ([pickSrc, o]) => {
    await new Promise((res) => window._ensureSimLabLoaded(res));
    showPage('sim-lab');
    document.getElementById('page-sim-lab').classList.add('isl-practice');
    const scn = window.SIM_LAB_SEED_NETPLUS.find(new Function('s', pickSrc));
    window.__scn = scn;
    const body = document.getElementById('sl-body');
    window._simLab.mountScenario(body, scn, { lift: o.lift !== false, onReset: function () { window._simLab.mountScenario(body, scn, this); }, onSubmit: function () { window.__submitted = true; } });
  }, [pick, opts || {}]);
  await page.locator('#sl-body .sl-actions').waitFor({ state: 'visible' });   // showPage finishes its switch first
}
const TERMINAL = "return s.assets && s.assets.reference && s.assets.reference.kind === 'terminal' && JSON.stringify(s.steps).indexOf('excerptLines') > 0";
const FACEPLATE = "return s.assets && s.assets.reference && s.assets.reference.kind === 'faceplate' && JSON.stringify(s.steps).indexOf('facePorts') > 0";
const NETWORK = "return s.assets && s.assets.reference && s.assets.reference.kind === 'network'";
const PICKER = "return JSON.stringify(s.steps).indexOf('\"type\":\"analyze\"') > 0 && !(s.assets && s.assets.reference && s.assets.reference.kind === 'terminal')";

for (const vp of PHONES) {
  test.describe('Lift B3b1 round @' + vp.width, () => {
    test('June top bar, ticks, docked Reset and Submit; no tab bar or app top bar', async ({ page }) => {
      await startSession(page, vp);
      await expect(page.locator('#sl-round-pill')).toHaveText('Round 1 of 3');
      await expect(page.locator('.sl-topbar [data-action="simLabExit"]')).toBeVisible();
      await expect(page.locator('#sl-timer-slot .sl-timer')).toBeVisible();
      await expect(page.locator('#sl-dots .slr-dot')).toHaveCount(3);
      await expect(page.locator('#lift-tabbar')).toBeHidden();
      await expect(page.locator('#app-topbar')).toBeHidden();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test('Reset and Submit stay docked on a scenario taller than the screen', async ({ page }) => {
      await mountSeed(page, vp, TERMINAL);
      const st = await page.evaluate(() => ({ tall: document.documentElement.scrollHeight > window.innerHeight + 200 }));
      expect(st.tall).toBe(true);   // the test only proves the dock on a scenario that scrolls
      const inView = () => page.evaluate(() => {
        const r = document.querySelector('#sl-body .sl-actions').getBoundingClientRect();
        return r.top >= 0 && Math.round(r.bottom) <= window.innerHeight && r.height > 0;
      });
      expect(await inView()).toBe(true);
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      expect(await inView()).toBe(true);
      const last = await page.evaluate(() => {   // the last step is not hidden under the dock at the bottom
        const steps = document.querySelectorAll('#sl-body .sl-step'); const s = steps[steps.length - 1].getBoundingClientRect();
        return Math.round(s.bottom) <= Math.round(document.querySelector('#sl-body .sl-actions').getBoundingClientRect().top);
      });
      expect(last).toBe(true);
    });

    test('the 3-round session ends on the verdict; the loader reads "Building round N of M…"', async ({ page }) => {
      await startSession(page, vp);
      await page.evaluate(() => {   // the loader can be gone within a frame (prefetch), so record it as it appears
        window.__loader = [];
        new MutationObserver(() => { const t = document.querySelector('#sl-body .slr-loader-t'); if (t) window.__loader.push(t.textContent); })
          .observe(document.getElementById('sl-body'), { childList: true, subtree: true });
      });
      await page.locator('#sl-body [data-action="simLabSubmitScenario"]').click();
      await expect.poll(() => page.evaluate(() => window.__loader[0])).toBe('Building round 2 of 3…');
      expect(await page.evaluate(() => !!document.querySelector('#sl-body .isl-skel') || window.__loader.length > 0)).toBe(true);
      await page.waitForSelector('#sl-body [data-action="simLabSubmitScenario"]', { timeout: 8000 });
      await page.locator('#sl-body [data-action="simLabSubmitScenario"]').click();
      await page.waitForSelector('#sl-body [data-action="simLabSubmitScenario"]', { timeout: 8000 });
      await page.locator('#sl-body [data-action="simLabSubmitScenario"]').click();
      await expect(page.locator('#page-sim-lab-result')).toHaveClass(/active/);
    });

    test('terminal is the console card, stays inline and still takes answers', async ({ page }) => {
      await mountSeed(page, vp, TERMINAL);
      await expect(page.locator('#sl-body .term-host-name')).toBeVisible();
      const after = await page.evaluate(() => getComputedStyle(document.querySelector('#sl-body .term-host-name'), '::after').content);
      expect(after).toContain('console');
      await expect(page.locator('#sl-body .isl-enlarge')).toHaveCount(0);
      const tabs = page.locator('#sl-body .term-tab');   // the selectable lines sit under one of the console's tabs
      for (let i = 0; i < await tabs.count() && await page.locator('#sl-body button.term-line:visible').count() === 0; i++) await tabs.nth(i).click();
      const id = await page.locator('#sl-body button.term-line:visible').first().getAttribute('data-line');
      const line = page.locator('#sl-body button.term-line[data-line="' + id + '"]');   // a stable handle: :visible re-resolves as blocks animate
      await line.click();
      await expect(line).toHaveClass(/sl-sel/);
    });

    test('faceplate stays inline (no enlarge) and its ports still take answers', async ({ page }) => {
      await mountSeed(page, vp, FACEPLATE);
      await expect(page.locator('#sl-body .isl-enlarge')).toHaveCount(0);
      const port = page.locator('#sl-body button.port').first();
      await port.click();
      await expect(port).toHaveClass(/sl-sel/);
    });

    test('a network map gets Tap to enlarge; the sheet opens with the map and closes on Escape', async ({ page }) => {
      await mountSeed(page, vp, NETWORK);
      const btn = page.locator('#sl-body .isl-enlarge');
      await expect(btn).toHaveText('Tap to enlarge');
      const hit = await btn.evaluate((b) => { const a = getComputedStyle(b, '::after'); return a.content !== 'none' && b.getBoundingClientRect().height - 2 * parseFloat(a.top) >= 44; });
      expect(hit).toBe(true);
      await btn.click();
      await expect(page.locator('#isl-enlarge')).toHaveClass(/open/);
      await expect(page.locator('#isl-enlarge-title')).toHaveText('Network map');
      await expect(page.locator('#isl-enlarge .isl-es-body svg').first()).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('#isl-enlarge')).not.toHaveClass(/open/);
    });

    test('Reset asks in the sheet, never confirm(); Keep them keeps, Clear answers clears', async ({ page }) => {
      await mountSeed(page, vp, PICKER);
      await page.evaluate(() => { window.confirm = () => { throw new Error('confirm() called'); }; });
      const pick = page.locator('#sl-body .sl-analyze-line').first();
      await pick.click();
      await expect(pick).toHaveClass(/sl-sel/);
      await page.locator('#sl-body .sl-reset').click();
      await expect(page.locator('#exam-sheet')).toHaveClass(/open/);
      await expect(page.locator('#exam-sheet-title')).toHaveText('Start this PBQ again?');
      await expect(page.locator('#exam-sheet .ix-sheet-body')).toHaveText('Your answers on this question will be cleared.');
      await expect(page.locator('#exam-sheet .ix-sheet-stay')).toHaveText('Keep them');
      await expect(page.locator('#exam-sheet .ix-sheet-go')).toHaveText('Clear answers');
      await page.locator('#exam-sheet .ix-sheet-stay').click();
      await expect(page.locator('#sl-body .sl-analyze-line').first()).toHaveClass(/sl-sel/);
      await page.locator('#sl-body .sl-reset').click();
      await page.locator('#exam-sheet .ix-sheet-go').click();
      await expect(page.locator('#sl-body .sl-analyze-line.sl-sel')).toHaveCount(0);
    });

    test('a round that ends with the Reset sheet open closes it as Keep them', async ({ page }) => {
      await startSession(page, vp);
      await page.locator('#sl-body .sl-reset').click();
      await expect(page.locator('#exam-sheet')).toHaveClass(/open/);
      await page.evaluate(() => window.simLabSubmitScenario());
      await expect(page.locator('#exam-sheet')).not.toHaveClass(/open/);
      await page.waitForSelector('#sl-body [data-action="simLabSubmitScenario"]', { timeout: 8000 });
      await expect(page.locator('#sl-round-pill')).toHaveText('Round 2 of 3');
      expect(await page.evaluate(() => window.iosSheet.isOpen())).toBe(false);
    });
  });
}

test('Lift B3b1 desktop: the round keeps confirm() and no enlarge', async ({ page }) => {
  await mountSeed(page, DESKTOP, NETWORK);
  await expect(page.locator('#sl-body .isl-enlarge')).toHaveCount(0);
  await page.evaluate(() => { window.__confirmed = 0; window.confirm = () => { window.__confirmed++; return false; }; });
  await page.locator('#sl-body .sl-reset').click();
  expect(await page.evaluate(() => window.__confirmed)).toBe(1);
});

test('Lift B3b1: a mount without opts.lift (Decision Lab) gets no phone hooks', async ({ page }) => {
  await mountSeed(page, PHONES[1], NETWORK, { lift: false });
  await expect(page.locator('#sl-body .isl-enlarge')).toHaveCount(0);
  await page.evaluate(() => { window.__confirmed = 0; window.confirm = () => { window.__confirmed++; return false; }; });
  await page.locator('#sl-body .sl-reset').click();
  expect(await page.evaluate(() => window.__confirmed)).toBe(1);
});

// ── Task 5: the verdict ──
async function finishSession(page, viewport) {
  await startSession(page, viewport);
  for (let i = 0; i < 3; i++) {
    await page.waitForSelector('#sl-body [data-action="simLabSubmitScenario"]', { timeout: 8000 });
    await page.locator('#sl-body [data-action="simLabSubmitScenario"]').click();   // blank: every round missed
  }
  await expect(page.locator('#page-sim-lab-result')).toHaveClass(/active/);
}
for (const vp of PHONES) {
  test.describe('Lift B3b1 verdict @' + vp.width, () => {
    test('the verdict in the exam-results language; rows open to the answer', async ({ page }) => {
      await finishSession(page, vp);
      const root = page.locator('#sl-result-root');
      await expect(root.locator('.isl-vkick')).toContainText('Sim Lab · 3 rounds');
      await expect(root.locator('.isl-vtitle')).toHaveText('0 of 3 passed.');
      await expect(root.locator('.isl-vsub')).toHaveText(/^\d+ of \d+ steps right\.$/);
      await expect(root.locator('.isl-srow')).toHaveCount(3);
      await expect(root.locator('.isl-slip')).toContainText('Where you slipped');
      await expect(page.locator('#lift-tabbar')).toBeHidden();
      await expect(page.locator('#app-topbar')).toBeHidden();
      const dock = await page.evaluate(() => { const r = document.querySelector('#sl-result-root .isl-vdock').getBoundingClientRect(); return Math.round(r.bottom) <= innerHeight && r.top > 0; });
      expect(dock).toBe(true);
      const first = root.locator('.isl-srow').first();
      await first.click();
      await expect(first).toHaveAttribute('aria-expanded', 'true');
      await expect(root.locator('.isl-sdet').first()).toBeVisible();
      await expect(root.locator('.isl-sdet').first()).toContainText('Answer');
      await first.click();
      await expect(root.locator('.isl-sdet').first()).toBeHidden();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test('free upsell opens the Pro gate; Back to Practice leaves', async ({ page }) => {
      await finishSession(page, vp);
      await expect(page.locator('#sl-result-root [data-action="simLabSummaryUpsell"]')).toHaveText('Go Pro for exam-length runs');
      await record(page, ['_gateProOnly']);
      await page.locator('#sl-result-root [data-action="simLabSummaryUpsell"]').click();
      expect(await page.evaluate(() => window.__calls)).toEqual(['_gateProOnly']);
      await page.evaluate(() => { const m = document.getElementById('pro-only-modal'); if (m) m.remove(); });
      await page.locator('#sl-result-root [data-action="simLabExit"]').click();
      await expect(page.locator('#page-setup')).toHaveClass(/active/);
    });
  });
}

test('Lift B3b1 desktop: the verdict is today\'s', async ({ page }) => {
  await boot(page, DESKTOP, 'free');
  await page.evaluate(async () => {
    try { localStorage.removeItem('nplus_pbq_free_count'); } catch (_) {}
    await new Promise((res) => window._ensureSimLabLoaded(res));
    window._slMeteredGenerate = async () => ({ bad: true });
    window.simLabOpenEntry(); await new Promise((r) => setTimeout(r, 450));
    document.querySelector('.sle-chip[data-rounds="3"]').click(); window.simLabSessionStart();
  });
  for (let i = 0; i < 3; i++) {
    await page.waitForSelector('#sl-body [data-action="simLabSubmitScenario"]', { timeout: 8000 });
    await page.locator('#sl-body [data-action="simLabSubmitScenario"]').click();
  }
  await expect(page.locator('#sl-result-root .sls-score')).toBeVisible();
  await expect(page.locator('#sl-result-root .isl-srow')).toHaveCount(0);
});

// ── Task 6: Sim Lab questions inside the full exam ──
// A saved 12-question exam whose first question is a Sim Lab seed (pick runs against the Net+ pool), resumed like Home does.
async function openExamPbq(page, viewport, pick) {
  await page.setViewportSize(viewport);
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.evaluate(async (pickSrc) => {
    await new Promise((res) => window._ensureSimLabLoaded(res));
    const scn = pickSrc ? window.SIM_LAB_SEED_NETPLUS.find(new Function('s', pickSrc)) : { id: 'b3-pbq', cert: 'netplus', objective: '1.4', topic: 'IPv4', title: 'Find the mask', scenario: 'Branch cannot reach HQ.', estMinutes: 5,
      steps: [{ id: 'st1', type: 'fillin', prompt: 'Which mask?', points: 1, explanation: '/26', payload: { fields: [{ id: 'mask', label: 'Mask' }] }, answer: { mask: ['/26'] } }] };
    const qs = Array.from({ length: 12 }, (_, i) => ({ type: 'mcq', question: 'Sample exam question ' + (i + 1) + '?', options: { A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta' }, answer: 'A', explanation: 'Because A.', topic: 'OSPF', difficulty: 'Exam Level' }));
    qs[0] = { type: 'simlab', question: scn.title, topic: scn.topic, explanation: '', simlab: scn };
    const ans = qs.map(() => ({ chosen: null, flagged: false, msChosen: [], orderSeq: [], cliRan: [], topoState: {} }));
    localStorage.setItem('nplus_exam_state', JSON.stringify({ v: 1, savedAt: Date.now(), endTime: Date.now() + 84 * 60000, current: 0, questions: qs, answers: ans, answered: 0, paused: false, pausedAt: 0, timeLeft: 5040, pausedMs: 0, pauses: 0 }));
    const m = await _loadFeature('exam'); await m.resumeExam();
  }, pick || null);
  await expect(page.locator('#page-exam')).toHaveClass(/active/);
  await page.locator('#page-exam .exam-pbq .sl-step').first().waitFor({ state: 'visible' });
}
for (const vp of PHONES) {
  test.describe('Lift B3b1 exam PBQ @' + vp.width, () => {
    test('a terminal PBQ shows the console card with Reset in its bar; no Sim Lab dock', async ({ page }) => {
      await openExamPbq(page, vp, TERMINAL);
      const pbq = page.locator('#page-exam .exam-pbq');
      await expect(pbq.locator('.term-head .sl-reset')).toBeVisible();
      await expect(pbq.locator('[data-action="simLabSubmitScenario"]')).toHaveCount(0);
      await expect(pbq.locator('.sl-actions')).toBeHidden();
      await expect(page.locator('#page-exam #exam-next-btn')).toBeVisible();
      await pbq.locator('.term-head .sl-reset').click();
      await expect(page.locator('#exam-sheet-title')).toHaveText('Start this PBQ again?');
      await page.locator('#exam-sheet .ix-sheet-stay').click();
      await expect(page.locator('#exam-sheet')).not.toHaveClass(/open/);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test('a PBQ without a console puts a Reset pill in its first step; Clear answers clears it', async ({ page }) => {
      await openExamPbq(page, vp, null);
      const pbq = page.locator('#page-exam .exam-pbq');
      const pill = pbq.locator('.sl-step').first().locator('.sl-reset.isl-reset-pill');
      await expect(pill).toBeVisible();
      await pbq.locator('[data-field="mask"]').fill('/26');
      await page.evaluate(() => { window.confirm = () => { throw new Error('confirm() called'); }; });
      await pill.click();
      await page.locator('#exam-sheet .ix-sheet-go').click();
      await expect(pbq.locator('[data-field="mask"]')).toHaveValue('');
    });
  });
}
