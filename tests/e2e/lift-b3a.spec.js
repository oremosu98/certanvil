// tests/e2e/lift-b3a.spec.js — Lift B3a (the Drills tab on phones).
// Spec: docs/superpowers/specs/2026-10-22-ios-lift-b3a-design.md. E2E: feat/cert-ios-e2e cert-ios-drills.html @ ab952bb4.
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };

async function openDrills(page, viewport, o) {
  const opts = o || {};
  await page.setViewportSize(viewport);
  await page.addInitScript((op) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    const now = Date.now();
    const T = ['OSPF', 'DNS & DHCP', 'Port Security', 'Subnetting', 'Cable Issues'];
    const h = T.map((t, i) => ({ date: new Date(now - (i + 1) * 3600e3).toISOString(), topic: t, score: 3 + i, total: 10, pct: 30 + i * 10, difficulty: 'Exam Level', mode: 'quiz' }));
    const bank = Array.from({ length: op.wrong == null ? 9 : op.wrong }, (_, i) => ({ question: 'Missed ' + i + '?', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, answer: 'A', topic: T[i % 5] }));
    try {
      if (op.cert) localStorage.setItem('nplus_dev_cert', op.cert);
      localStorage.setItem('nplus_theme', 'dark');
      localStorage.setItem('nplus_history', JSON.stringify(h));
      localStorage.setItem('nplus_wrong_bank', JSON.stringify(bank));
    } catch (_) {}
  }, opts);
  await page.goto('/');
  await page.waitForLoadState('load');
  if (viewport.width > 899) { await page.evaluate(() => showPage('drills')); return; }
  await page.locator('#lift-tabbar .lift-tab[data-page="drills"]').click();
  await expect(page.locator('#page-drills')).toHaveClass(/active/);
}

for (const vp of PHONES) {
  test.describe('Lift B3a Drills @' + vp.width, () => {
    test('June order, real counts, old cards hidden', async ({ page }) => {
      await openDrills(page, vp);
      const r = page.locator('#ios-drills');
      await expect(r.locator('.id-card-title').first()).toHaveText('Drill Mistakes');
      await expect(r.locator('[data-act="mistakes"]')).toHaveText('Drill the 9 you missed');
      await expect(r.locator('.id-chip')).toHaveCount(3);
      await expect(r.locator('.id-sect').nth(0)).toHaveText('Drill by domain');
      await expect(r.locator('.id-sect').nth(1)).toHaveText('More ways to practise');
      await expect(page.locator('#drills-gauntlet-card')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(vp.width);
      for (const b of await r.locator('.id-mrow').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
    });

    test('every control reaches its existing entry', async ({ page }) => {
      await openDrills(page, vp);
      await page.evaluate(() => {
        window.__calls = [];
        const rec = (n) => (a) => window.__calls.push(n + (a !== undefined ? ':' + a : ''));
        ['startWrongDrill', 'focusTopic', 'applyDomainPreset', 'startSimLabHome', 'startRewordGauntlet', 'startWhyNot'].forEach(n => { window[n] = rec(n); });
      });
      const r = page.locator('#ios-drills');
      await r.locator('[data-act="mistakes"]').click();
      await r.locator('[data-act="weak"]').click();
      await r.locator('[data-act="domain"]').first().click();
      for (const id of ['sim', 'gnt', 'why']) await r.locator('[data-act="row"][data-id="' + id + '"]').click();
      const calls = await page.evaluate(() => window.__calls);
      expect(calls[0]).toBe('startWrongDrill');
      expect(calls[1]).toMatch(/^focusTopic:/);
      expect(calls[2]).toMatch(/^applyDomainPreset:/);
      expect(calls.slice(3)).toEqual(['startSimLabHome', 'startRewordGauntlet', 'startWhyNot']);
    });

    test('pills wait for the tier, then appear without a tap', async ({ page }) => {
      await openDrills(page, vp);
      await page.evaluate(() => { _quotaState = null; document.body.classList.remove('is-state-resolved', 'is-pro-tier'); renderIosDrills(); });
      await expect(page.locator('#ios-drills .id-mpill, #ios-drills .id-lock-pill')).toHaveCount(0);
      await page.evaluate(() => { _quotaState = { tier: 'free', used_today: 0, daily_limit: 15 }; document.body.classList.add('is-state-resolved'); renderGauntletDrillsCard(); });
      await expect(page.locator('#ios-drills [data-id="sim"] .id-mpill')).toHaveText('1 free today');
      await expect(page.locator('#ios-drills [data-id="why"] .id-lock-pill')).toHaveText('Pro');
    });

    test('coming back to Drills shows fresh counts', async ({ page }) => {
      await openDrills(page, vp);
      await page.evaluate(() => { localStorage.setItem('nplus_wrong_bank', JSON.stringify([{ question: 'a' }, { question: 'b' }])); goSetup(); });
      await page.locator('#lift-tabbar .lift-tab[data-page="drills"]').click();
      await expect(page.locator('#ios-drills [data-act="mistakes"]')).toHaveText('Drill the 2 you missed');
    });

    test('AZ-900 has Decision Lab and no Sim Lab', async ({ page }) => {
      await openDrills(page, vp, { cert: 'az900' });
      const r = page.locator('#ios-drills');
      await expect(r.locator('[data-id="sim"]')).toHaveCount(0);
      await page.evaluate(() => { window.__dl = 0; window.startDecisionLabHome = () => { window.__dl++; }; });
      await r.locator('[data-id="dl"]').click();
      expect(await page.evaluate(() => window.__dl)).toBe(1);
      await expect(r.locator('.id-plan-tag')).toHaveText('AZ-900');
    });
  });
}

test('desktop leaves #ios-drills empty', async ({ page }) => {
  await openDrills(page, DESKTOP);
  await expect(page.locator('#ios-drills')).toBeEmpty();
});
