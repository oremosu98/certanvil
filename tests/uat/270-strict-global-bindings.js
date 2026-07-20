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

// Strips // line comments, /* */ block comments, and '…'/"…"/`…` string
// contents down to spaces (preserving newlines + overall length/offsets, so
// line numbers computed via src.slice(0, idx).split('\n').length still line
// up). Used only by the v7.96.0 closure-captive-CALL sweep below — comment
// prose ("...calls getWeakTopic()...") and quiz-content string literals
// ("...during the move (for example...") both contain bare `name(` text that
// isn't a real call and would otherwise flood the sweep with false positives.
function stripCommentsAndStrings(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i], c2 = src[i + 1];
    if (c === '/' && c2 === '/') {
      while (i < n && src[i] !== '\n') { out += ' '; i++; }
      continue;
    }
    if (c === '/' && c2 === '*') {
      out += '  '; i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        out += (src[i] === '\n' ? '\n' : ' '); i++;
      }
      if (i < n) { out += '  '; i += 2; }
      continue;
    }
    if (c === '\'' || c === '"' || c === '`') {
      const quote = c;
      out += ' '; i++;
      while (i < n && src[i] !== quote) {
        if (src[i] === '\\' && i + 1 < n) { out += '  '; i += 2; continue; }
        out += (src[i] === '\n' ? '\n' : ' '); i++;
      }
      if (i < n) { out += ' '; i++; }
      continue;
    }
    out += c; i++;
  }
  return out;
}

const files = [['app.js', appJs]].concat(
  featureFiles.map(rel => [rel, fs.readFileSync(path.join(ROOT, rel), 'utf8')])
);

// (b) global bindings: top-level declarations in app.js (column 0)
const appTopLevelDecls = new Set();
{
  let m;
  const topRe = /^(?:let|var|const|function|async function)\s+([A-Za-z_$][\w$]*)/gm;
  while ((m = topRe.exec(appJs))) appTopLevelDecls.add(m[1]);
  // top-level comma lists WITH or WITHOUT initializers: let a = 1, b = null;
  const topListRe = /^(?:let|var)\s+([^;]+);/gm;
  while ((m = topListRe.exec(appJs))) {
    m[1].split(',').forEach(seg => {
      const id = seg.trim().split(/[\s=]/)[0];
      if (/^[A-Za-z_$][\w$]*$/.test(id)) appTopLevelDecls.add(id);
    });
  }
}

// (c) window.* exposures anywhere
const windowExposed = new Set();
for (const [, src] of files) {
  let m;
  const wRe = /window\.([A-Za-z_$][\w$]*)\s*=/g;
  while ((m = wRe.exec(src))) windowExposed.add(m[1]);
}

// Union used by the bare-assignment sweep below (a name is "global enough"
// if it's either an app.js top-level binding or window-exposed anywhere).
const globalDecls = new Set([...appTopLevelDecls, ...windowExposed]);

const KEYWORDS = new Set(['if', 'else', 'for', 'while', 'return', 'typeof',
  'new', 'in', 'of', 'this', 'window', 'document', 'module', 'exports']);

const landmines = [];
const declsByFile = {}; // rel -> Set(all declared identifiers in this file) — reused below
const fnDeclsByFile = {}; // rel -> Set(names declared via `function NAME(` in this file)
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

  declsByFile[rel] = decls;
}

// code-only (comments/strings blanked) source, used solely by the v7.96.0
// closure-captive-CALL sweep below so prose/content mentions of `name(`
// don't get mistaken for real calls or declarations.
const codeOnlyByFile = {};
for (const [rel, src] of files) {
  const codeOnly = stripCommentsAndStrings(src);
  codeOnlyByFile[rel] = codeOnly;
  const fnDecls = new Set();
  const fnRe = /function\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let m;
  while ((m = fnRe.exec(codeOnly))) fnDecls.add(m[1]);
  fnDeclsByFile[rel] = fnDecls;
}

// ── v7.96.0: extend the guard to bare CALLS to closure-captive helpers, not
// just bare assignments. The _formatElapsed bug: quiz-engine.js's finish()
// called `_formatElapsed(elapsedMs)` as a bare identifier, but the only
// definition lived inside exam.js's strict-mode IIFE — a lazy-loaded module
// that may never have executed by the time a regular quiz finishes.
//
// A name is "closure-captive" if it's declared via `function NAME(` inside
// some features/*.js file, but is NOT window-exposed anywhere and NOT
// declared at app.js top level (i.e. calling it from any OTHER file is a
// strict-mode ReferenceError waiting to fire, unless that other file also
// declares it locally or typeof-guards the call).
const closureCaptive = new Map(); // name -> defining file (features/*.js)
for (const [rel] of files) {
  if (rel === 'app.js') continue;
  for (const name of fnDeclsByFile[rel]) {
    if (name.length < 4) continue;
    if (KEYWORDS.has(name)) continue;
    if (windowExposed.has(name)) continue;
    if (appTopLevelDecls.has(name)) continue;
    closureCaptive.set(name, rel);
  }
}

const callLandmines = [];
for (const [rel, rawSrc] of files) {
  const codeOnly = codeOnlyByFile[rel];
  for (const [name, definingFile] of closureCaptive) {
    if (rel === definingFile) continue; // calls within the defining file are fine
    if (declsByFile[rel] && declsByFile[rel].has(name)) continue; // locally declared/shadowed here
    const callRe = new RegExp('(?<![\\w$.])' + name + '\\s*\\(', 'g');
    let m;
    while ((m = callRe.exec(codeOnly))) {
      // Guard check runs against the RAW source (not codeOnly) — the
      // typeof-guard pattern's 'function' half is itself a string literal,
      // which codeOnly has blanked out.
      const windowStart = Math.max(0, m.index - 200);
      const preceding = rawSrc.slice(windowStart, m.index);
      const guardRe = new RegExp("typeof\\s+" + name + "\\s*===\\s*'function'");
      if (guardRe.test(preceding)) continue;
      const line = codeOnly.slice(0, m.index).split('\n').length;
      callLandmines.push(`${rel}:${line} → bare call to closure-captive '${name}' (declared only in ${definingFile})`);
    }
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

test('v7.96.0 guard: zero bare calls to closure-captive helpers across app.js + features/*.js' +
  (callLandmines.length ? ` — FOUND: ${callLandmines.join(' | ')}` : ''),
  callLandmines.length === 0);

// Pin the v7.96.0 root-cause fix specifically (the _formatElapsed bug):
test('v7.96.0 fix: _formatElapsed declared at top level of app.js (global binding)',
  /^function _formatElapsed\b/m.test(appJs));

{
  const readinessSrc = fs.readFileSync(path.join(ROOT, 'features/readiness.js'), 'utf8');
  const quizEngineSrc = fs.readFileSync(path.join(ROOT, 'features/quiz-engine.js'), 'utf8');
  const guardLine = "window._certanvilFeatures = window._certanvilFeatures || {}";

  const hasGuardBeforeRegistration = (src, regKey) => {
    const guardIdx = src.indexOf(guardLine);
    const regIdx = src.indexOf(regKey);
    return guardIdx !== -1 && regIdx !== -1 && guardIdx < regIdx;
  };

  test('v7.96.0 fix: readiness.js guards window._certanvilFeatures before registering',
    hasGuardBeforeRegistration(readinessSrc, "window._certanvilFeatures['readiness']"));

  test('v7.96.0 fix: quiz-engine.js guards window._certanvilFeatures before registering',
    hasGuardBeforeRegistration(quizEngineSrc, "window._certanvilFeatures['quiz-engine']"));
}
