#!/usr/bin/env node
/**
 * stamp-css-versions.js — records the current ?v= and content hash of every
 * versioned stylesheet linked from index.html into tests/css-cache-bust.json.
 *
 * WHY THIS EXISTS. Seven stylesheets carry hand-maintained ?v= cache-bust
 * queries and `bump-version.js` touches NONE of them (CLAUDE.md documents only
 * dg-system.css). Twice now a render-blocking stylesheet's CONTENT changed while
 * its ?v= stayed put, so returning users kept being served the old file:
 *   · dg-critical.css     — stuck at 7.90.1 through the v8.6.0 motion audit
 *   · styles-critical.css — stuck at 7.83.0 across v7.88.0 and v7.92.0, both of
 *                           which were Lighthouse mobile CLS root-cause fixes
 * Every other check stayed green both times. The UAT guard that reads this
 * manifest is what turns that silent class of bug into a build failure.
 *
 * DO NOT WIRE THIS INTO THE PRE-COMMIT HOOK. If it re-stamped automatically it
 * would record the new hash and the guard could never fire. Stamping is meant to
 * be a deliberate act AFTER a real ?v= bump — the friction is the mechanism.
 *
 * Usage:  node scripts/stamp-css-versions.js [--check]
 *   (no args) rewrite the manifest from current state
 *   --check   report drift and exit 1, without writing (what UAT asserts)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const MANIFEST = path.join(ROOT, 'tests', 'css-cache-bust.json');

function scan() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const found = {};
  for (const m of html.matchAll(/([a-z0-9-]+\.css)\?v=([0-9.]+)/gi)) {
    const [, file, version] = m;
    const abs = path.join(ROOT, file);
    if (!fs.existsSync(abs)) continue;
    found[file] = {
      version,
      sha256: crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex').slice(0, 16)
    };
  }
  return found;
}

function drift(manifest, current) {
  const out = [];
  for (const [file, cur] of Object.entries(current)) {
    const rec = manifest[file];
    if (!rec) { out.push({ file, kind: 'untracked', msg: `${file} is versioned in index.html but absent from the manifest` }); continue; }
    // The bug this exists to catch: content moved, cache key did not.
    if (cur.sha256 !== rec.sha256 && cur.version === rec.version) {
      out.push({ file, kind: 'stale-query',
        msg: `${file} CHANGED but ?v= is still ${cur.version} — returning users keep the old file. Bump it in index.html, then re-run: node scripts/stamp-css-versions.js` });
    }
  }
  for (const file of Object.keys(manifest)) {
    if (!current[file]) out.push({ file, kind: 'dropped', msg: `${file} is in the manifest but no longer versioned in index.html — re-stamp` });
  }
  return out;
}

const current = scan();
const check = process.argv.includes('--check');
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};

if (check) {
  const issues = drift(manifest, current);
  if (!issues.length) { console.log(`✓ CSS cache-bust: ${Object.keys(current).length} stylesheets, no drift`); process.exit(0); }
  issues.forEach(i => console.error(`✗ ${i.msg}`));
  process.exit(1);
}
fs.writeFileSync(MANIFEST, JSON.stringify(current, null, 2) + '\n');
console.log(`Stamped ${Object.keys(current).length} stylesheets → tests/css-cache-bust.json`);
