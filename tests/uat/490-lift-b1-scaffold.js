// tests/uat/490-lift-b1-scaffold.js
// Scope: Lift B1 phone containers. #ios-progress / #ios-analytics live inside their pages,
// and once rendered they hide every desktop sibling (incl. the .lift-seg switch) at phone width.
// Spec: docs/superpowers/specs/2026-10-21-ios-lift-b1-design.md
const { fs, html, path, ROOT, results, test } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift B1 scaffold (Progress, Analytics) ──\x1b[0m');
  try {
    const ios = fs.readFileSync(path.join(ROOT, 'lift-ios.css'), 'utf8');
    test('#ios-progress is the first child of #page-progress, ios-only iq-screen',
      /<div id="page-progress" class="page">\s*<section id="ios-progress" class="ios-only iq-screen" aria-label="Progress"><\/section>/.test(html));
    test('#ios-analytics is the first child of #page-analytics, ios-only iq-screen',
      /<div id="page-analytics" class="page">\s*<section id="ios-analytics" class="ios-only iq-screen" aria-label="Analytics"><\/section>/.test(html));
    test('features/ios-progress.js and ios-analytics.js load deferred after ios-custom.js',
      /<script defer src="features\/ios-custom\.js"><\/script>\s*<script defer src="features\/ios-progress\.js"><\/script>\s*<script defer src="features\/ios-analytics\.js"><\/script>/.test(html));
    test('lift-ios.css hides the desktop Progress page beside a rendered #ios-progress',
      /#page-progress:has\(#ios-progress:not\(:empty\)\) > :not\(#ios-progress\)\s*\{\s*display:\s*none\s*!important;?\s*\}/.test(ios));
    test('lift-ios.css hides the desktop Analytics page beside a rendered #ios-analytics',
      /#page-analytics:has\(#ios-analytics:not\(:empty\)\) > :not\(#ios-analytics\)\s*\{\s*display:\s*none\s*!important;?\s*\}/.test(ios));
    test('lift-ios.css hides the app top bar while a B1 phone screen is showing',
      ios.includes('body:has(#page-progress.active #ios-progress:not(:empty)) #app-topbar') &&
      ios.includes('body:has(#page-analytics.active #ios-analytics:not(:empty)) #app-topbar'));
    const appLines = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8').split('\n').length;
    test('app.js stays at its 8301-line ratchet (B1 adds nothing there)', appLines === 8301);
  } catch (err) {
    test('Lift B1 scaffold: block (threw)', false);
    results.errors.push('490 lift-b1-scaffold block threw: ' + err.message);
  }
})();
