// tests/uat/470-lift-a-scaffold.js
// Scope: Lift A (iOS June design) phone scaffold. lift-ios.css carries the E2E's exact
// tokens at phone width, and .ios-only containers stay hidden on desktop.
// Spec: docs/superpowers/specs/2026-10-19-ios-launch-june-design.md (Fidelity rule).
const { dgCss, fs, html, path, ROOT, results, test } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift A scaffold (phone tokens) ──\x1b[0m');
  try {
    const iosPath = path.join(ROOT, 'lift-ios.css');
    const ios = fs.existsSync(iosPath) ? fs.readFileSync(iosPath, 'utf8') : '';
    const linkIdx = html.search(/<link rel="stylesheet" href="lift-ios\.css\?v=[0-9.]+" media="\(max-width: 899px\)">/);
    const screensIdx = html.lastIndexOf('lift-screens.css?v=');
    test('index.html links lift-ios.css at phone width, after lift-screens.css', linkIdx > 0 && linkIdx > screensIdx);
    test('index.html has the phone Custom quiz container right after #ios-home, plus its script',
      /<section id="ios-home"[^>]*><\/section>\s*<section id="ios-custom" class="ios-only iq-screen"/.test(html) && /<script defer src="features\/ios-custom\.js"><\/script>/.test(html));
    test('dg-system.css hides .ios-only everywhere by default', dgCss.includes('.ios-only{display:none!important;}'));
    test('lift-ios.css shows .ios-only and hides .ios-desktop-only at phone width',
      /\.ios-only\s*\{\s*display:\s*block\s*!important;?\s*\}/.test(ios) && /\.ios-desktop-only\s*\{\s*display:\s*none\s*!important;?\s*\}/.test(ios));
    const block = (sel) => { const i = ios.indexOf(sel + '{'); if (i < 0) return ''; return ios.slice(i, ios.indexOf('}', i)); };
    const dark = block('html[data-theme="dark"]'), light = block('html[data-theme="light"]');
    const DARK = { '--bg': 'oklch(0.15 0.010 275)', '--surface': 'oklch(0.205 0.009 275)', '--surface3': 'oklch(0.255 0.010 275)',
      '--border': 'oklch(0.34 0.009 275)', '--text': 'oklch(0.97 0.006 275)', '--text-mid': 'oklch(0.80 0.010 275)',
      '--text-dim': 'oklch(0.62 0.013 275)', '--accent': 'oklch(0.82 0.150 66)', '--green': 'oklch(0.78 0.150 152)' };
    const LIGHT = { '--bg': 'oklch(0.975 0.007 85)', '--surface': 'oklch(0.955 0.009 84)', '--surface3': 'oklch(0.92 0.010 84)',
      '--border': 'oklch(0.85 0.010 85)', '--text': 'oklch(0.22 0.015 280)', '--text-mid': 'oklch(0.38 0.014 280)',
      '--text-dim': 'oklch(0.52 0.013 280)', '--accent': 'oklch(0.55 0.155 55)', '--green': 'oklch(0.52 0.13 150)' };
    const has = (blk, map) => Object.keys(map).every(k => blk.includes(k + ':' + map[k] + ';'));
    test('lift-ios.css dark tokens equal the E2E (cert-ios-home.html) values', has(dark, DARK));
    test('lift-ios.css light tokens equal the E2E values', has(light, LIGHT));
    test('lift-ios.css also defines --accent-deep, --accent-bright, --on-accent, --track, --miss in both themes',
      ['--accent-deep:', '--accent-bright:', '--on-accent:', '--track:', '--miss:'].every(k => dark.includes(k) && light.includes(k)));
  } catch (err) {
    test('Lift A scaffold: block (threw)', false);
    results.errors.push('470 lift-a-scaffold block threw: ' + err.message);
  }
})();
