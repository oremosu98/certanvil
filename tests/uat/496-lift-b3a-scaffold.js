// tests/uat/496-lift-b3a-scaffold.js
// Scope: Lift B3a phone scaffold. #ios-drills lives inside #page-drills and, once rendered,
// hides the old Drills cards. Spec: docs/superpowers/specs/2026-10-22-ios-lift-b3a-design.md
const { fs, html, path, ROOT, results, test } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift B3a scaffold (Drills) ──\x1b[0m');
  try {
    const ios = fs.readFileSync(path.join(ROOT, 'lift-ios.css'), 'utf8');
    test('#ios-drills is the first child of #page-drills, ios-only iq-screen',
      /<div id="page-drills" class="page">\s*<section id="ios-drills" class="ios-only iq-screen" aria-label="Drills"><\/section>/.test(html));
    test('features/ios-drills.js loads deferred right after ios-exam.js',
      /<script defer src="features\/ios-exam\.js"><\/script>\s*<script defer src="features\/ios-drills\.js"><\/script>/.test(html));
    test('lift-ios.css hides the old Drills cards beside a rendered #ios-drills',
      /#page-drills:has\(#ios-drills:not\(:empty\)\) > :not\(#ios-drills\)\s*\{\s*display:\s*none\s*!important;?\s*\}/.test(ios));
    const i = html.indexOf('<section id="ios-drills"'), j = html.indexOf('</section>', i);
    test('#ios-drills carries no inline on*= handlers (Sec-P7)', i > 0 && !/\son[a-z]+=/.test(html.slice(i, j)));
    // Founder side-by-sides (26 Oct): the drill entries kept the tab bar but lit no tab; the June drawings light Drills
    const shell = fs.readFileSync(path.join(ROOT, 'lift-shell.js'), 'utf8');
    const lm = shell.match(/var LIGHT_AS = (\{[\s\S]*?\});/);
    const lightAs = lm ? Function('return ' + lm[1])() : {};
    test('lift-shell lights Drills on the four drill entries (Gauntlet, Why-Not, Sim Lab, Decision Lab)',
      ['gauntlet', 'whynot', 'sim-lab-entry', 'decision-lab-entry'].every(function (p) { return lightAs[p] === 'drills'; }));
  } catch (err) {
    test('Lift B3a scaffold: block (threw)', false);
    results.errors.push('496 lift-b3a-scaffold block threw: ' + err.message);
  }
})();
