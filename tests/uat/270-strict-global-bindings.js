// tests/uat/270-strict-global-bindings.js
// Scope: wave-extraction shared-state guard (v7.80.1).
//
// FAILURE CLASS: the #138 module split wrapped each extracted feature in a
// strict-mode IIFE. Shared mutable globals (examMode, current, log, …) only
// keep working because their declarations sit at TOP LEVEL of app.js — a
// top-level `let`/`var` in a classic script is a global binding visible to
// every other script. When an extraction wave accidentally moves the ONLY
// declaration into one module's closure, every bare assignment to that name
// in other modules throws a strict-mode ReferenceError at runtime — silently
// killing whatever async flow it was in (the v7.80.1 infinite-quiz-spinner
// bug: `_sessionStartTs` declaration captive in exam.js, assignments in
// quiz-engine.js/flagship-drills.js/app.js all threw after generation).
// Three recurrences of this class shipped to prod (v7.79.1, v7.79.2, v7.80.1).
//
// THE GUARD: statically scan app.js + every features/*.js for statement-level
// bare assignments (`foo = …` at low indent) to identifiers that are neither
// (a) declared anywhere in the same file (incl. comma lists + params via the
// decl regex), (b) declared at top level of app.js (global binding), nor
// (c) exposed as `window.foo` anywhere. Any hit is a runtime ReferenceError
// waiting to fire. Sweep-verified 2026-07-20: zero legitimate hits exist, so
// this asserts an empty list — a new hit means a new landmine.

const { fs, path, ROOT, appJs, test } = require('./_context');

const featureDir = path.join(ROOT, 'features');
const featureFiles = fs.readdirSync(featureDir)
  .filter(f => f.endsWith('.js'))
  .map(f => path.join('features', f));

const files = [['app.js', appJs]].concat(
  featureFiles.map(rel => [rel, fs.readFileSync(path.join(ROOT, rel), 'utf8')])
);

// (b) global bindings: top-level declarations in app.js (column 0)
const globalDecls = new Set();
{
  let m;
  const topRe = /^(?:let|var|const|function|async function)\s+([A-Za-z_$][\w$]*)/gm;
  while ((m = topRe.exec(appJs))) globalDecls.add(m[1]);
  // top-level comma lists WITH or WITHOUT initializers: let a = 1, b = null;
  const topListRe = /^(?:let|var)\s+([^;]+);/gm;
  while ((m = topListRe.exec(appJs))) {
    m[1].split(',').forEach(seg => {
      const id = seg.trim().split(/[\s=]/)[0];
      if (/^[A-Za-z_$][\w$]*$/.test(id)) globalDecls.add(id);
    });
  }
}

// (c) window.* exposures anywhere
for (const [, src] of files) {
  let m;
  const wRe = /window\.([A-Za-z_$][\w$]*)\s*=/g;
  while ((m = wRe.exec(src))) globalDecls.add(m[1]);
}

const KEYWORDS = new Set(['if', 'else', 'for', 'while', 'return', 'typeof',
  'new', 'in', 'of', 'this', 'window', 'document', 'module', 'exports']);

const landmines = [];
for (const [rel, src] of files) {
  // (a) every declaration in this file: let/var/const/function heads,
  // comma lists (with initializers), and function parameters.
  const decls = new Set();
  let m;
  const dRe = /(?:let|var|const|function)\s+([A-Za-z_$][\w$]*)/g;
  while ((m = dRe.exec(src))) decls.add(m[1]);
  const listRe = /(?:let|var|const)\s+([^;]+);/g;
  while ((m = listRe.exec(src))) {
    m[1].split(',').forEach(seg => {
      const id = seg.trim().split(/[\s=]/)[0];
      if (/^[A-Za-z_$][\w$]*$/.test(id)) decls.add(id);
    });
  }
  const paramRe = /function[^(]*\(([^)]*)\)/g;
  while ((m = paramRe.exec(src))) {
    m[1].split(',').forEach(p => {
      const id = p.trim().split(/[\s=]/)[0];
      if (/^[A-Za-z_$][\w$]*$/.test(id)) decls.add(id);
    });
  }
  const arrowRe = /\(([^)]*)\)\s*=>/g;
  while ((m = arrowRe.exec(src))) {
    m[1].split(',').forEach(p => {
      const id = p.trim().split(/[\s=]/)[0];
      if (/^[A-Za-z_$][\w$]*$/.test(id)) decls.add(id);
    });
  }
  const singleArrowRe = /(?:^|[(,=\s])([A-Za-z_$][\w$]*)\s*=>/g;
  while ((m = singleArrowRe.exec(src))) decls.add(m[1]);
  // catch clauses: catch (e)
  const catchRe = /catch\s*\(\s*([A-Za-z_$][\w$]*)/g;
  while ((m = catchRe.exec(src))) decls.add(m[1]);

  // statement-level bare assignments at indent ≤ 10 (statement position, not
  // object literals — those sit deeper or follow `{`).
  const asRe = /^(\s{0,10})([A-Za-z_$][\w$]*)\s*=\s*[^=>]/gm;
  while ((m = asRe.exec(src))) {
    const id = m[2];
    if (decls.has(id) || globalDecls.has(id) || KEYWORDS.has(id)) continue;
    const line = src.slice(0, m.index).split('\n').length;
    landmines.push(`${rel}:${line} → bare assignment to undeclared '${id}'`);
  }
}

console.log('\n\x1b[1m── Strict-mode global bindings (wave-extraction guard, v7.80.1) ──\x1b[0m');

test('v7.80.1 guard: zero bare assignments to undeclared identifiers across app.js + features/*.js' +
  (landmines.length ? ` — FOUND: ${landmines.join(' | ')}` : ''),
  landmines.length === 0);

// Pin the two v7.80.1 root-cause fixes specifically:
test('v7.80.1 fix: _sessionStartTs declared at top level of app.js (global binding)',
  /^let _sessionStartTs\b/m.test(appJs));

test('v7.80.1 fix: sr-review.js exposes window._srIsFreeTier',
  /window\._srIsFreeTier\s*=\s*_srIsFreeTier/.test(
    fs.readFileSync(path.join(ROOT, 'features/sr-review.js'), 'utf8')));

test('v7.80.1 fix: _renderBuilderQuotaLine guards _srIsFreeTier with typeof',
  /_renderBuilderQuotaLine[\s\S]{0,300}typeof _srIsFreeTier === 'function'/.test(appJs));
