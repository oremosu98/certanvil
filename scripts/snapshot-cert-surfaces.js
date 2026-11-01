#!/usr/bin/env node
// scripts/snapshot-cert-surfaces.js
// Characterisation snapshot: for each shipping cert, extract the value every hand-maintained
// per-cert surface holds TODAY (host detection, switcher, pickers, badges, scales, titles...).
// Output is deterministic JSON (certs sorted by id, fixed field order) on stdout.
// Used by tests/uat/540-cert-surfaces-snapshot.js to guard the cert-registry refactor.
//   node scripts/snapshot-cert-surfaces.js > tests/fixtures/cert-surfaces-v1.json
// Any surface that cannot be read from source is recorded as null (never guessed).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Balanced-brace slice starting at `start` (index of text to include) through the matching close brace.
function sliceBraced(src, start) {
  const open = src.indexOf('{', start);
  if (start < 0 || open < 0) return '';
  let depth = 1, i = open + 1;
  while (i < src.length && depth > 0) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; i++; }
  return src.slice(start, i);
}
function fnSrc(src, name) { return sliceBraced(src, src.indexOf('function ' + name)); }
// Evaluate the literal on the right of `<decl> NAME = <literal>;` (object or array literal).
function literal(src, re) {
  const m = re.exec(src);
  if (!m) return null;
  try { return vm.runInNewContext('(' + m[1] + ')', {}); } catch (_) { return null; }
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
  const switchSrc = sliceBraced(src, src.indexOf('window.tadSwitchCert = function'));
  const mk = (host, storage) => {
    const win = { location: { hostname: host, href: '', reload() {} }, _gateProOnly: () => true };
    const ls = Object.assign({}, storage || {});
    const ctx = vm.createContext({
      window: win,
      localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }
    });
    vm.runInContext("var CERT_OVERRIDE_KEY = 'nplus_' + 'dev_cert';\n" + fnSrc(src, 'getAvailableCerts') + '\n' + fnSrc(src, 'getActiveCertId') + '\n' + switchSrc + ';', ctx);
    return { win, ctx };
  };
  const certs = vm.runInContext('getAvailableCerts("user")', mk('example.com').ctx);
  const switchHost = (id) => { const e = mk('example.com'); e.win.tadSwitchCert(id); return e.win.location.href || null; };
  const detect = (host) => vm.runInContext('getActiveCertId()', mk(host).ctx);
  return { certs, switchHost, detect };
}

// ── index.html head IIFE: host detection, title, topbar eyebrow ──
function headSurfaces() {
  const html = read('index.html');
  const start = html.indexOf('(function() {\n  var cert = null;');
  const end = html.indexOf('})();', start) + 5;
  const code = start < 0 ? '' : html.slice(start, end);
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
  return { run, ok: !!code };
}

const MARK_FILES = ['features/ios-analytics.js', 'features/ios-custom.js', 'features/ios-firstrun.js', 'features/ios-home.js', 'features/ios-log-result.js', 'features/ios-progress.js'];

function extract() {
  const packs = loadPacks();
  const ids = Object.keys(packs).sort();
  const auth = authSurfaces();
  const head = headSurfaces();
  const byId = {}; auth.certs.forEach((c) => { byId[c.id] = c; });

  const marks = MARK_FILES.map((f) => literal(read(f), /var MARKS = (\{[^}]*\})/));
  const scale1000 = literal(read('features/ios-hub.js'), /var HUB_SCALE_1000 = (\{[^}]*\})/);
  const pickNames = literal(read('features/ios-firstrun.js'), /var PICK_NAMES = (\{[^}]*\})/);
  const pickCodes = literal(read('features/ios-firstrun.js'), /var PICK_CODES = (\{[^}]*\})/);
  const signinNames = literal(read('features/ios-signin.js'), /var NAMES = (\{[^}]*\})/);
  const lockSrc = read('lib/cert-lock.js');
  const lockNames = literal(lockSrc.slice(lockSrc.indexOf('function certLabel')), /var L = (\{[^}]*\})/);
  const onbList = literal(read('lib/onboarding-firstrun.js'), /var CERTS = (\[[^\]]*\])/) || [];
  const onbNames = {}; onbList.forEach((c) => { onbNames[c.id] = c.name; });
  const appSrc = read('app.js');
  const simLabIds = literal(appSrc, /const _SL_PBQ_CERTS_HOME = (\[[^\]]*\])/);
  const decisionLabIds = literal(appSrc, /const _DL_CERTS = (\[[^\]]*\])/);

  const out = {};
  ids.forEach((id) => {
    const pack = packs[id]; const meta = pack.meta || {}; const sw = auth.switchHost(id);
    let swHost = null; try { swHost = sw ? new URL(sw).hostname : null; } catch (_) {}
    const perFileMarks = marks.map((m) => get(m, id));
    const mark = perFileMarks.every((m) => m === perFileMarks[0]) ? perFileMarks[0] : perFileMarks;
    const titled = head.run('localhost', { nplus_dev_cert: id });
    out[id] = {
      hostDetected: swHost ? { authState: nz(auth.detect(swHost)), head: nz(head.run(swHost).cert) } : null,
      switchHost: sw,
      proGated: byId[id] ? byId[id].tier === 'pro' : null,
      glyph: byId[id] ? nz(byId[id].glyph) : null,
      mark: nz(mark),
      names: {
        switcher: byId[id] ? nz(byId[id].name) : null,
        signin: get(signinNames, id),
        firstrun: get(pickNames, id),
        onboarding: get(onbNames, id),
        certLock: get(lockNames, id)
      },
      codes: { switcher: byId[id] ? nz(byId[id].code) : null, firstrun: get(pickCodes, id) },
      scale: { min: nz(meta.examMinScore), max: scale1000 ? (scale1000[id] ? 1000 : 900) : null, pass: nz(meta.examPassScore) },
      simLab: simLabIds ? simLabIds.indexOf(id) !== -1 : null,
      decisionLab: decisionLabIds ? decisionLabIds.indexOf(id) !== -1 : null,
      title: head.ok ? titled.title : null,
      topbar: head.ok ? titled.topbar : null,
      domainCount: pack.domainLabels ? Object.keys(pack.domainLabels).length : null
    };
  });
  return out;
}

module.exports = { extract };
if (require.main === module) process.stdout.write(JSON.stringify(extract(), null, 2) + '\n');
