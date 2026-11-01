#!/usr/bin/env node
// scripts/snapshot-cert-surfaces.js
// Characterisation snapshot: for each shipping cert, extract the value every hand-maintained
// per-cert surface holds TODAY (host detection, switcher, pickers, badges, scales, titles...).
// Output is deterministic JSON (certs sorted by id, fixed field order) on stdout.
// Used by tests/uat/540-cert-surfaces-snapshot.js to guard the cert-registry refactor.
//   node scripts/snapshot-cert-surfaces.js > tests/fixtures/cert-surfaces-v1.json
// Since Task 1.4 it runs each surface's own function against the real registry. A missing function THROWS (never guesses, never silently nulls).
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
    vm.runInContext(read('lib/cert-registry.js'), ctx);
    vm.runInContext("var CERT_OVERRIDE_KEY = 'nplus_' + 'dev_cert';\n" + fnSrc(src, 'getAvailableCerts', 'auth-state.js') + '\n' + fnSrc(src, 'getActiveCertId', 'auth-state.js') + '\n' + switchSrc + ';', ctx);
    return { win, ctx };
  };
  const certs = vm.runInContext('getAvailableCerts("user")', mk('example.com').ctx);
  const switchHost = (id) => { const e = mk('example.com'); e.win.tadSwitchCert(id); return e.win.location.href || null; };
  const detect = (host) => vm.runInContext('getActiveCertId()', mk(host).ctx);
  // dev-override allow-list: probe it. An id is allowed if a saved override of that id (on a host with no cert) wins.
  const probe = (id) => { const e = mk('example.com', { nplus_dev_cert: id }); return vm.runInContext('getActiveCertId()', e.ctx) === id; };
  const allow = { indexOf: (id) => (probe(id) ? 1 : -1) };
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
    vm.runInContext(read('lib/cert-registry.js'), ctx);
    vm.runInContext(code, ctx);
    return { cert: attrs['data-cert'] || null, title: doc.title || null, topbar: nz(win._cbCertHtml) };
  };
  return { run };
}

// Since Task 1.4 the per-cert maps are gone: every surface reads window.CertRegistry. So instead of parsing map literals,
// each surface's own function is cut out of the real source and run next to the real registry. A missing function throws.
function surface(file, names, code, globals) {
  const src = read(file);
  const win = {}; win.window = win;
  const ctx = vm.createContext(Object.assign({ window: win, console: { log() {}, warn() {}, error() {} } }, globals || {}));
  vm.runInContext(read('lib/cert-registry.js'), ctx);
  return vm.runInContext(names.map((n) => fnSrc(src, n, file)).join('\n') + '\n' + code, ctx);
}
const docStub = { documentElement: { getAttribute: () => 'dark' } };
function certGlobals(id) { return { CURRENT_CERT: id, CERT_CODE: '', CERT_PACK: { meta: { name: id } }, document: docStub }; }
const MARK_SURFACES = [
  (id) => surface('features/ios-analytics.js', ['_inCert'], '_inCert().mark', certGlobals(id)),
  (id) => surface('features/ios-custom.js', ['iosCertIdentity'], 'iosCertIdentity().mark', certGlobals(id)),
  (id) => surface('features/ios-firstrun.js', ['certInfo'], 'function certId(){return CURRENT_CERT;} function packMeta(){return CERT_PACK.meta;} certInfo(CURRENT_CERT).glyph', certGlobals(id)),
  (id) => surface('features/ios-home.js', ['_iosHomeModel'], '_iosHomeModel(new Date(0)).cert.mark', certGlobals(id)),
  (id) => surface('features/ios-log-result.js', ['_certMark'], '_certMark(CURRENT_CERT)', certGlobals(id)),
  (id) => surface('features/ios-progress.js', ['_ipCert'], '_ipCert().mark', certGlobals(id))
];
// Sim Lab / Decision Lab tiles: run the two real render functions against stub elements and read which one hides.
function labTiles(id) {
  const mk = () => { const c = new Set(); return { classList: { add: (x) => c.add(x), remove: (x) => c.delete(x), has: (x) => c.has(x) }, textContent: '' }; };
  const els = { 'sl-home-opt': mk(), 'sl-home-sub': mk(), 'dl-home-opt': mk(), 'dl-home-sub': mk() };
  surface('app.js', ['renderSimLabHomeEntry', 'renderDecisionLabHomeEntry'], 'window.CURRENT_CERT = CURRENT_CERT; renderSimLabHomeEntry(); renderDecisionLabHomeEntry();',
    { CURRENT_CERT: id, document: { getElementById: (i) => els[i] || null }, _pbqFreeRunsToday: () => 0, PBQ_FREE_DAILY_CAP: 1, _dlFreeRunsToday: () => 0 });
  return { simLab: !els['sl-home-opt'].classList.has('is-hidden'), decisionLab: !els['dl-home-opt'].classList.has('is-hidden') };
}

function extract() {
  const packs = loadPacks();
  const ids = Object.keys(packs).sort();
  const auth = authSurfaces();
  const head = headSurfaces();
  const byId = {}; auth.certs.forEach((c) => { byId[c.id] = c; });

  const pickRows = {}; surface('features/ios-firstrun.js', ['pickRow', 'pickCerts'], 'pickCerts()').forEach((r) => { pickRows[r.id] = r; });
  const signinName = (id) => surface('features/ios-signin.js', ['certName'], 'certName(' + JSON.stringify(id) + ')');
  const lockName = (id) => surface('lib/cert-lock.js', ['certLabel'], 'certLabel(' + JSON.stringify(id) + ')');
  const rowsOf = (file) => { const o = {}; surface(file, ['row', 'certs'], 'certs()').forEach((c) => { o[c.id] = c; }); return o; };
  const onbRows = rowsOf('lib/onboarding-firstrun.js'), onbHomeRows = rowsOf('lib/onboarding-home.js');
  const hubMax = (id) => surface('features/ios-hub.js', ['_hubMax'], '_hubMax(' + JSON.stringify(id) + ')');

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
    const perFileMarks = MARK_SURFACES.map((f) => f(id));
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
        signin: signinName(id),
        firstrun: get(pickRows[id], 'name'),
        onboarding: get(onbRows[id], 'name'),
        onboardingHome: get(onbHomeRows[id], 'name'),
        certLock: lockName(id)
      },
      codes: { switcher: byId[id] ? nz(byId[id].code) : null, firstrun: get(pickRows[id], 'code') },
      scale: { min: nz(meta.examMinScore), max: hubMax(id), pass: nz(meta.examPassScore) },
      simLab: labTiles(id).simLab,
      decisionLab: labTiles(id).decisionLab,
      title: titled.title,
      topbar: titled.topbar,
      domainCount: pack.domainLabels ? Object.keys(pack.domainLabels).length : null
    };
  });
  return out;
}

module.exports = { extract };
if (require.main === module) process.stdout.write(JSON.stringify(extract(), null, 2) + '\n');
