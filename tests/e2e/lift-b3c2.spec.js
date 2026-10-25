// Lift B3c2 (v8.191.0): Why-Not on phones, against cert-ios-whynot.html.
// The forge is stubbed in the page (localhost only): _claudeFetch returns five rounds in today's shape (the
// drawing's RDP round first) and the quality checkers pass them, so a session is deterministic and offline.
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };
const KIT = (r, f1, f2, n) => ({ reason: r, fakes: [f1, f2], note: n });
const ROUND = (q, opts, ans, expl, kits) => ({ question: q, options: opts, answer: ans, explanation: expl, whynot: kits });
const RUN = { rounds: [
  ROUND('Which TCP port does Remote Desktop Protocol listen on by default?', ['3389', '22', '445', '5900'], 'A', 'RDP listens on TCP 3389 by default.', {
    B: KIT('22 is SSH, a command-line login.', '22 is UDP only, so it cannot carry a session.', '22 is reserved for DNS zone transfers.', 'SSH owns 22 and gives you a command line.'),
    C: KIT('445 is SMB, for file and printer sharing.', '445 only carries encrypted web traffic.', '445 is what RDP falls back to without NLA.', 'SMB shares run on 445.'),
    D: KIT('5900 is VNC, a different remote desktop protocol.', 'Windows blocks 5900, so nothing can listen on it.', '5900 is the RDP port for multi-monitor sessions.', 'VNC listens on 5900.') }),
  ROUND('Which port does HTTPS use by default on the public web?', ['80', '443', '8080', '21'], 'B', 'HTTPS uses TCP 443.', {
    A: KIT('80 is plain HTTP.', '80 is only for FTP.', '80 is UDP only.', 'HTTP is 80, HTTPS is 443.'),
    C: KIT('8080 is a common alternate HTTP port.', '8080 is reserved for DNS.', '8080 is SMTP.', '8080 is an alternate, not the default.'),
    D: KIT('21 is FTP control.', '21 is HTTPS on old servers.', '21 is SSH.', 'FTP control uses 21.') }),
  ROUND('Which port does DNS use for ordinary name lookups?', ['25', '110', '53', '123'], 'C', 'DNS lookups use port 53.', {
    A: KIT('25 is SMTP mail transfer.', '25 is DNS over TCP.', '25 is NTP.', 'SMTP is 25.'),
    B: KIT('110 is POP3 mail retrieval.', '110 is DNS zone transfers.', '110 is LDAP.', 'POP3 is 110.'),
    D: KIT('123 is NTP time sync.', '123 is DNS over UDP.', '123 is SNMP.', 'NTP is 123.') }),
  ROUND('Which port does SNMP polling use?', ['161', '389', '636', '514'], 'A', 'SNMP polling uses UDP 161.', {
    B: KIT('389 is LDAP.', '389 is SNMP traps.', '389 is Syslog.', 'LDAP is 389.'),
    C: KIT('636 is LDAPS.', '636 is SNMPv3.', '636 is RDP.', 'LDAPS is 636.'),
    D: KIT('514 is Syslog.', '514 is SNMP polling.', '514 is SSH.', 'Syslog is 514.') }),
  ROUND('Which port does SSH use by default?', ['23', '22', '3389', '69'], 'B', 'SSH uses TCP 22.', {
    A: KIT('23 is Telnet.', '23 is SFTP.', '23 is SSH over UDP.', 'Telnet is 23 and unencrypted.'),
    C: KIT('3389 is RDP.', '3389 is SSH tunnelling.', '3389 is SCP.', 'RDP is 3389.'),
    D: KIT('69 is TFTP.', '69 is SSH keys.', '69 is SFTP.', 'TFTP is 69.') })
] };

async function boot(page, viewport, tier) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { localStorage.setItem('nplus_theme', 'dark'); } catch (_) {}
  });
  await page.goto('/');
  await page.waitForLoadState('load');
  await setTier(page, tier || 'pro');
}
async function setTier(page, tier) {
  await page.evaluate((t) => {
    window._quotaState = t === 'pro' ? { tier: 'pro' } : { tier: 'free', used_today: 0, daily_limit: 15 };
    document.body.classList.add('is-state-resolved');
    document.body.classList.toggle('is-pro-tier', t === 'pro');
  }, tier);
}
async function stubForge(page, mode) {
  await page.evaluate(([run, m]) => {
    window.__forgeCalls = 0;
    window._claudeFetch = async () => { window.__forgeCalls++; if (m === 'fail') throw new Error('forge down');
      return { ok: true, json: async () => ({ content: [{ type: 'text', text: JSON.stringify(run) }] }) }; };
    window.aiValidateQuestions = async (k, qs) => qs; window.validateQuestions = (qs) => qs;
  }, [RUN, mode || 'ok']);
}
async function openEntry(page, vp, tier) {
  await boot(page, vp, tier);
  await stubForge(page);
  await page.evaluate(() => startWhyNot());
  await expect(page.locator('#page-whynot')).toHaveClass(/active/);
}
module.exports = { RUN, boot, setTier, stubForge, openEntry };

for (const vp of PHONES) {
  test.describe('Lift B3c2 entry @' + vp.width, () => {
    test('June entry replaces the desktop card; tab bar stays; no app top bar', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await expect(page.locator('#iwn-entry .iwn-start')).toBeVisible();
      await expect(page.locator('#page-whynot .gnt-shell')).toBeHidden();
      await expect(page.locator('#lift-tabbar')).toBeVisible();
      await expect(page.locator('#app-topbar')).toBeHidden();
      await expect(page.locator('#iwn-entry .iwn-rd')).toHaveCount(3);
      await expect(page.locator('#iwn-entry .iwn-pro')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      await setTier(page, 'free');
      await page.evaluate(() => startWhyNot());
      await expect(page.locator('#iwn-entry .iwn-pro')).toHaveCount(1);
    });
    test('Pick a different topic opens the sheet; a tap updates the target to Your pick', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      const cur = (await page.locator('#iwn-entry .iwn-v').textContent()).trim();
      await page.locator('#iwn-entry .iwn-switch').click();
      await expect(page.locator('#igt-topics')).toBeVisible();
      await expect(page.locator('#igt-topics .igt-tlist button[aria-pressed="true"]')).toHaveText(cur);
      const other = page.locator('#igt-topics .igt-tlist button[aria-pressed="false"]').first();
      const name = (await other.textContent()).trim();
      await other.click();
      await expect(page.locator('#igt-topics')).toBeHidden();
      await expect(page.locator('#iwn-entry .iwn-v')).toHaveText(name);
      await expect(page.locator('#iwn-entry .iwn-why')).toHaveText('Your pick');
    });
    test("free Start opens today's Pro gate and keeps the entry", async ({ page }) => {
      await openEntry(page, vp, 'free');
      await page.evaluate(() => { window.__gate = 0; window._showProOnlyUI = function () { window.__gate++; }; });
      await setTier(page, 'free');   // signed out, the app resets _quotaState after load
      await page.locator('#iwn-entry .iwn-start').click();
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => window.__gate)).toBe(1);
      expect(await page.evaluate(() => window.__forgeCalls)).toBe(0);
      await expect(page.locator('#page-whynot')).toHaveClass(/active/);
    });
    test('a misfire returns to the phone entry', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await stubForge(page, 'fail');
      await setTier(page, 'pro');
      await page.locator('#iwn-entry .iwn-start').click();
      await expect(page.locator('#page-whynot')).toHaveClass(/active/, { timeout: 8000 });
      await expect(page.locator('#iwn-entry .iwn-start')).toBeVisible();
      await stubForge(page);
      await setTier(page, 'pro');
      await page.locator('#iwn-entry .iwn-start').click();
      await expect(page.locator('#page-quiz')).toHaveClass(/active/, { timeout: 8000 });
    });
  });
}

test.describe('Lift B3c2 desktop', () => {
  test("the entry is today's", async ({ page }) => {
    await openEntry(page, DESKTOP, 'pro');
    await expect(page.locator('#page-whynot .gnt-shell')).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('iwn-entry').innerHTML)).toBe('');
  });
});
