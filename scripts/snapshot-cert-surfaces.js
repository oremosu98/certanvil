#!/usr/bin/env node
// scripts/snapshot-cert-surfaces.js
// Characterisation snapshot: for each shipping cert, extract the value every hand-maintained
// per-cert surface holds TODAY (host detection, switcher, pickers, badges, scales, titles...).
// Output is deterministic JSON (certs sorted by id, fixed field order) on stdout.
// Used by tests/uat/540-cert-surfaces-snapshot.js to guard the cert-registry refactor.
//   node scripts/snapshot-cert-surfaces.js > tests/fixtures/cert-surfaces-v1.json
// If an anchor pattern is missing from source the extractor THROWS (never guesses, never silently nulls).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Balanced-brace slice starting at `start` (index of text to include) through the matching close brace.
function sliceBraced(src, start, what) {
  const open = start < 0 ? -1 : src.indexOf('{', start);
  if (open < 0) throw new Error('pattern ' + (what || 'braced block') + ' not found');
  let depth = 1, i = open + 1;
  while (i < src.length && depth > 0) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; i++; }
  return src.slice(start, i);
}
function fnSrc(src, name, file) {
  const m = new RegExp('function\\s+' + name + '\\s*\\(').exec(src);
  if (!m) throw new Error('pattern function ' + name + ' not found in ' + file);
  return sliceBraced(src, m.index, 'function ' + name + ' in ' + file);
}
// Evaluate the literal captured by re (group 1) from `<decl> NAME = <literal>`. Throws if the anchor misses.
function literal(src, re, name, file) {
  const m = re.exec(src);
  if (!m) throw new Error('pattern ' + name + ' not found in ' + file);
  try { return vm.runInNewContext('(' + m[1] + ')', {}); } catch (e) { throw new Error('pattern ' + name + ' in ' + file + ' did not evaluate: ' + e.message); }
}
const get = (obj, k) => (obj && Object.prototype.hasOwnProperty.call(obj, k) ? obj[k] : null);
const nz = (v) => (v === undefined ? null : v);

function loadPacks() {
  const packs = {};
  for (const f of fs.readdirSync(path.join(ROOT, 'certs')).filter((x) => x.endsWith('.js')).sort()) {
    const w = {}; w.window = w;
    try { vm.runInContext(read('certs/' + f), vm.createContext({ window: w, console: { log() {}, warn() {}, error() {} } })); } catch (_) { /* pack stays absent */ }
    Object.keys(w.CERT_PACKS || {}).forEach((id) => { packs[id] = w.CERT_PACKS[id]; });
  }
  return packs;
}

// ── auth-state.js: getAvailableCerts / getActiveCertId / tadSwitchCert ──
function authSurfaces() {
  const src = read('auth-state.js');
  const sm = /window\.tadSwitchCert\s*=\s*function/.exec(src);
  if (!sm) throw new Error('pattern window.tadSwitchCert not found in auth-state.js');
  const switchSrc = sliceBraced(src, sm.index, 'window.tadSwitchCert in auth-state.js');
  const mk = (host, storage) => {
    const win = { location: { hostname: host, href: '', reload() {} }, _gateProOnly: () => true };
    const ls = Object.assign({}, storage || {});
    const ctx = vm.createContext({
      window: win,
      localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }
    });
    vm.runInContext("var CERT_OVERRIDE_KEY = 'nplus_' + 'dev_cert';\n" + fnSrc(src, 'getAvailableCerts', 'auth-state.js') + '\n' + fnSrc(src, 'getActiveCertId', 'auth-state.js') + '\n' + switchSrc + ';', ctx);
    return { win, ctx };
  };
  const certs = vm.runInContext('getAvailableCerts("user")', mk('example.com').ctx);
  const switchHost = (id) => { const e = mk('example.com'); e.win.tadSwitchCert(id); return e.win.location.href || null; };
  const detect = (host) => vm.runInContext('getActiveCertId()', mk(host).ctx);
  // dev-override allow-list: every id compared against `dev` before the first host check in getActiveCertId
  const gsrc = fnSrc(src, 'getActiveCertId', 'auth-state.js');
  const lm = /dev\s*===\s*'[^']+'(?:\s*\|\|\s*dev\s*===\s*'[^']+')*/.exec(gsrc);
  if (!lm) throw new Error('pattern dev-override allow-list not found in auth-state.js');
  const allow = (lm[0].match(/'([^']+)'/g) || []).map((x) => x.slice(1, -1));
  return { certs, switchHost, detect, allow };
}

// ── index.html head IIFE: host detection, title, topbar eyebrow ──
function headSurfaces() {
  const html = read('index.html');
  const hm = /\(function\s*\(\s*\)\s*\{\s*var\s+cert\s*=\s*null\s*;/.exec(html);
  if (!hm) throw new Error('pattern head cert-detection IIFE not found in index.html');
  const start = hm.index;
  const end = html.indexOf('})();', start) + 5;
  const code = html.slice(start, end);
  const run = (host, storage) => {
    const ls = Object.assign({}, storage || {});
    const attrs = {}; const doc = { title: '', write() {}, documentElement: { setAttribute: (k, v) => { attrs[k] = v; } } };
    const win = {};
    const ctx = vm.createContext({
      document: doc, window: win, URL,
      location: { hostname: host, href: 'https://' + host + '/', search: '' },
      localStorage: { getItem: (k) => (k in ls ? ls[k] : null) }
    });
    vm.runInContext(code, ctx);
    return { cert: attrs['data-cert'] || null, title: doc.title || null, topbar: nz(win._cbCertHtml) };
  };
  return { run };
}

const MARK_FILES = ['features/ios-analytics.js', 'features/ios-custom.js', 'features/ios-firstrun.js', 'features/ios-home.js', 'features/ios-log-result.js', 'features/ios-progress.js'];

function extract() {
  const packs = loadPacks();
  const ids = Object.keys(packs).sort();
  const auth = authSurfaces();
  const head = headSurfaces();
  const byId = {}; auth.certs.forEach((c) => { byId[c.id] = c; });

  const marks = MARK_FILES.map((f) => literal(read(f), /var\s+MARKS\s*=\s*(\{[^}]*\})/, 'MARKS', f));
  const scale1000 = literal(read('features/ios-hub.js'), /var\s+HUB_SCALE_1000\s*=\s*(\{[^}]*\})/, 'HUB_SCALE_1000', 'features/ios-hub.js');
  const pickNames = literal(read('features/ios-firstrun.js'), /var\s+PICK_NAMES\s*=\s*(\{[^}]*\})/, 'PICK_NAMES', 'features/ios-firstrun.js');
  const pickCodes = literal(read('features/ios-firstrun.js'), /var\s+PICK_CODES\s*=\s*(\{[^}]*\})/, 'PICK_CODES', 'features/ios-firstrun.js');
  const signinNames = literal(read('features/ios-signin.js'), /var\s+NAMES\s*=\s*(\{[^}]*\})/, 'NAMES', 'features/ios-signin.js');
  const lockSrc = read('lib/cert-lock.js');
  const lockNames = literal(lockSrc, /function\s+certLabel\s*\([^)]*\)\s*\{\s*var\s+L\s*=\s*(\{[^}]*\})/, 'certLabel L map', 'lib/cert-lock.js');
  const namesOf = (list) => { const o = {}; list.forEach((c) => { o[c.id] = c.name; }); return o; };
  const onbNames = namesOf(literal(read('lib/onboarding-firstrun.js'), /var\s+CERTS\s*=\s*(\[[^\]]*\])/, 'CERTS', 'lib/onboarding-firstrun.js'));
  const onbHomeNames = namesOf(literal(read('lib/onboarding-home.js'), /var\s+CERTS\s*=\s*(\[[^\]]*\])/, 'CERTS', 'lib/onboarding-home.js'));
  const appSrc = read('app.js');
  const simLabIds = literal(appSrc, /const\s+_SL_PBQ_CERTS_HOME\s*=\s*(\[[^\]]*\])/, '_SL_PBQ_CERTS_HOME', 'app.js');
  const decisionLabIds = literal(appSrc, /const\s+_DL_CERTS\s*=\s*(\[[^\]]*\])/, '_DL_CERTS', 'app.js');

  // Host aliases: subdomain prefix each cert answers on (probe input), then what both detectors say for the
  // canonical host and a Vercel preview host. Prefix list is the probe, the detected results are the capture.
  const PREFIX = { netplus: 'networkplus', secplus: 'secplus', az900: 'azure', ai900: 'ai', sc900: 'sc900', clfc02: 'clfc02', 'aplus-core1': 'aplus', 'aplus-core2': 'aplus' };
  const aliases = (id) => {
    const p = PREFIX[id]; const o = {};
    [p + '.certanvil.com', p + '-x.vercel.app'].forEach((h) => { o[h] = { authState: auth.detect(h), head: head.run(h).cert }; });
    return o;
  };

  const out = {};
  ids.forEach((id) => {
    const pack = packs[id]; const meta = pack.meta || {}; const sw = auth.switchHost(id);
    if (!sw) throw new Error('tadSwitchCert produced no target for ' + id);
    const swHost = new URL(sw).hostname;
    const perFileMarks = marks.map((m) => get(m, id));
    const mark = perFileMarks.every((m) => m === perFileMarks[0]) ? perFileMarks[0] : perFileMarks;
    const titled = head.run('localhost', { nplus_dev_cert: id });
    out[id] = {
      hostDetected: { authState: auth.detect(swHost), head: head.run(swHost).cert },
      hostAliases: aliases(id),
      devOverrideAllowed: auth.allow.indexOf(id) !== -1,
      switchHost: sw,
      proGated: byId[id] ? byId[id].tier === 'pro' : null,
      glyph: byId[id] ? nz(byId[id].glyph) : null,
      mark: nz(mark),
      names: {
        switcher: byId[id] ? nz(byId[id].name) : null,
        signin: get(signinNames, id),
        firstrun: get(pickNames, id),
        onboarding: get(onbNames, id),
        onboardingHome: get(onbHomeNames, id),
        certLock: get(lockNames, id)
      },
      codes: { switcher: byId[id] ? nz(byId[id].code) : null, firstrun: get(pickCodes, id) },
      scale: { min: nz(meta.examMinScore), max: scale1000 ? (scale1000[id] ? 1000 : 900) : null, pass: nz(meta.examPassScore) },
      simLab: simLabIds ? simLabIds.indexOf(id) !== -1 : null,
      decisionLab: decisionLabIds ? decisionLabIds.indexOf(id) !== -1 : null,
      title: titled.title,
      topbar: titled.topbar,
      domainCount: pack.domainLabels ? Object.keys(pack.domainLabels).length : null
    };
  });
  return out;
}

module.exports = { extract };
if (require.main === module) process.stdout.write(JSON.stringify(extract(), null, 2) + '\n');
