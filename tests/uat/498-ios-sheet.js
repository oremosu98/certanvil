// Lift B3b1 (22 Oct): the shared phone sheet module. B2's _examSheet moves to features/ios-sheet.js
// as window.iosSheet so Sim Lab can use it too; the enlarge sheet (#isl-enlarge) is new.
const { fs, html, path, ROOT, results, test } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Lift B3b1 shared sheet ──\x1b[0m');
  try {
    const p = path.join(ROOT, 'features', 'ios-sheet.js');
    const sh = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    const ex = fs.readFileSync(path.join(ROOT, 'features', 'exam.js'), 'utf8');
    const ios = fs.readFileSync(path.join(ROOT, 'lift-ios.css'), 'utf8');
    test('ios-sheet.js exports iosSheet, iosSheet.dismiss and iosSheet.isOpen',
      /window\.iosSheet\s*=/.test(sh) && /iosSheet\.dismiss\s*=/.test(sh) && /iosSheet\.isOpen\s*=/.test(sh));
    test('ios-sheet.js exports iosEnlarge and iosEnlarge.close',
      /window\.iosEnlarge\s*=/.test(sh) && /iosEnlarge\.close\s*=/.test(sh));
    test('ios-sheet.js keeps the B2 key isolation (capture-phase keydown, stopImmediatePropagation)',
      /stopImmediatePropagation/.test(sh) && /addEventListener\('keydown', onKey, true\)/.test(sh));
    test('features/ios-sheet.js loads deferred after ios-drills.js, before lift-shell.js',
      /<script defer src="features\/ios-drills\.js"><\/script>[\s\S]*?<script defer src="features\/ios-sheet\.js"><\/script>[\s\S]*?lift-shell\.js/.test(html));
    test('exam.js _examSheet is a thin wrapper over window.iosSheet (the body moved)',
      /function _examSheet\(o\)\s*\{\s*return window\.iosSheet \? window\.iosSheet\(o\) : Promise\.resolve\(false\);\s*\}/.test(ex)
      && !/stopImmediatePropagation/.test(ex) && !/_examSheetOpen/.test(ex));
    test('exam.js submitExam dismisses an open sheet through iosSheet.dismiss',
      /window\.iosSheet && window\.iosSheet\.dismiss\(\)/.test(ex));
    const i = html.indexOf('<div id="isl-enlarge-scrim"'), j = html.indexOf('<div id="isl-enlarge" ');
    const k = html.indexOf('</div>', html.indexOf('class="isl-es-hint"', j));
    test('index.html has #isl-enlarge-scrim and #isl-enlarge after #exam-sheet',
      i > html.indexOf('id="exam-sheet"') && j > i && /role="dialog" aria-modal="true" aria-labelledby="isl-enlarge-title" hidden/.test(html.slice(j, k)));
    test('#isl-enlarge carries the Close button and the swipe hint, no on*= (Sec-P7)',
      j > 0 && /class="isl-es-close">Close<\/button>/.test(html.slice(j, k))
      && /Scroll to look around\. Swipe down or tap Close to go back\./.test(html.slice(j, k)) && !/\son[a-z]+=/.test(html.slice(i, k)));
    test('lift-ios.css styles #isl-enlarge open/closed and fades it under reduced motion',
      /#isl-enlarge\.open\s*\{/.test(ios) && /prefers-reduced-motion: reduce\)\s*\{[^}]*#isl-enlarge/.test(ios));
  } catch (err) {
    test('Lift B3b1 shared sheet: block (threw)', false);
    results.errors.push('498 ios-sheet block threw: ' + err.message);
  }
})();
