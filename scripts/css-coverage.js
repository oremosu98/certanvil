#!/usr/bin/env node
// CSS Coverage analysis — measures which CSS bytes are actually used across
// the top pages of the app, then reports per-file unused percentages and
// lists the top unused selector blocks for manual review.
// Usage: node scripts/css-coverage.js [base-url]
// Default base-url: http://localhost:3140

const { chromium } = require('@playwright/test');

const BASE = process.argv[2] || 'http://localhost:3140';

// Pages to visit. Each entry is [path, waitFor, label].
// waitFor: a CSS selector to wait for after navigation (page-ready signal).
const PAGES = [
  ['/',                      '#page-setup.active',    'home'],
  ['/?_cb=cov1',             '#page-setup.active',    'home (reload)'],
];

// Sidebar nav clicks to reach inner pages (run after home loads).
const NAV_CLICKS = [
  { selector: 'a[href*="progress"], .sb-item[data-page="progress"]', label: 'progress' },
  { selector: 'a[href*="analytics"], .sb-item[data-page="analytics"]', label: 'analytics' },
  { selector: 'a[href*="settings"], .sb-item[data-page="settings"]', label: 'settings' },
];

// CSS files we care about (match by URL suffix).
const CSS_FILES = ['styles.css', 'dg-system.css', 'dg-critical.css', 'dg-depurple.css'];

function matchFile(url) {
  for (const f of CSS_FILES) {
    if (url.includes(f)) return f;
  }
  return null;
}

function fmt(n) { return (n / 1024).toFixed(1) + 'KB'; }
function pct(used, total) { return total ? Math.round((1 - used / total) * 100) : 0; }

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Accumulate used ranges per CSS file across all navigation.
  // Structure: { filename: { text, usedRanges: Set<string> } }
  const fileData = {};

  await page.coverage.startCSSCoverage({ resetOnNavigation: false });

  console.log('\nNavigating pages...');

  // 1. Direct URL pages
  for (const [p, waitFor, label] of PAGES) {
    try {
      await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 20000 });
      if (waitFor) await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(800);
      console.log('  ✓ ' + label);
    } catch (e) {
      console.log('  ✗ ' + label + ' — ' + e.message.split('\n')[0]);
    }
  }

  // 2. Sidebar-driven navigation (SPA page switches)
  for (const nav of NAV_CLICKS) {
    try {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.click();
      }, nav.selector);
      await page.waitForTimeout(1200);
      console.log('  ✓ ' + nav.label);
    } catch (e) {
      console.log('  ✗ ' + nav.label + ' — ' + e.message.split('\n')[0]);
    }
  }

  // 3. Start a quick quiz to get quiz/exam CSS coverage
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(800);
    // Click "Start your first quiz" or Quick Start
    const startBtn = await page.$('.tile-recommend, .rc-go, button[class*="recommend"]');
    if (startBtn) { await startBtn.click(); await page.waitForTimeout(1500); }
    console.log('  ✓ quiz init');
  } catch (e) {
    console.log('  ✗ quiz init — ' + e.message.split('\n')[0]);
  }

  const coverage = await page.coverage.stopCSSCoverage();
  await browser.close();

  // Aggregate coverage by file
  for (const entry of coverage) {
    const name = matchFile(entry.url);
    if (!name) continue;
    if (!fileData[name]) fileData[name] = { text: entry.text, usedChars: new Set() };
    // Merge used ranges
    for (const r of entry.ranges) {
      for (let i = r.start; i < r.end; i++) fileData[name].usedChars.add(i);
    }
  }

  // Report
  console.log('\n' + '═'.repeat(60));
  console.log('CSS COVERAGE REPORT');
  console.log('═'.repeat(60));

  let grandTotal = 0, grandUsed = 0;

  for (const name of CSS_FILES) {
    const d = fileData[name];
    if (!d) { console.log(`\n${name}: no coverage data`); continue; }
    const total = d.text.length;
    const used = d.usedChars.size;
    const unused = total - used;
    grandTotal += total;
    grandUsed += used;
    console.log(`\n${name}`);
    console.log(`  Total : ${fmt(total)}   Used: ${fmt(used)}   Unused: ${fmt(unused)}   (${pct(used, total)}% unused)`);

    // Find top unused blocks — extract runs of unused chars and show their CSS rule context
    if (unused > 0) {
      const unusedBlocks = findUnusedBlocks(d.text, d.usedChars);
      const top = unusedBlocks.sort((a, b) => b.size - a.size).slice(0, 8);
      console.log('  Top unused blocks:');
      for (const b of top) {
        const preview = d.text.slice(b.start, Math.min(b.start + 120, b.end)).replace(/\s+/g, ' ').trim();
        console.log(`    [${fmt(b.size)}] ${preview.slice(0, 100)}${preview.length > 100 ? '…' : ''}`);
      }
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`TOTAL: ${fmt(grandTotal)}   Used: ${fmt(grandUsed)}   Unused: ${fmt(grandTotal - grandUsed)}   (${pct(grandUsed, grandTotal)}% unused)`);
  console.log('─'.repeat(60) + '\n');
}

function findUnusedBlocks(text, usedChars) {
  const blocks = [];
  let start = null;
  for (let i = 0; i < text.length; i++) {
    if (!usedChars.has(i)) {
      if (start === null) start = i;
    } else {
      if (start !== null) {
        if (i - start > 50) blocks.push({ start, end: i, size: i - start });
        start = null;
      }
    }
  }
  if (start !== null && text.length - start > 50) {
    blocks.push({ start, end: text.length, size: text.length - start });
  }
  return blocks;
}

main().catch(e => { console.error(e); process.exit(1); });
