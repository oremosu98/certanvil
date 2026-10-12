// tests/uat/370-exam-feedback-fixes.js
// Scope: the founder's 2026-10-12 feedback after a full sim (v8.166.0).
//
// 1. "on the pbq we need like an undo or reset button": Sim Lab PBQs get Reset.
// 2. "im not able to toggle between questions" and 5. "we need a pause button":
//    both came from Strict Mode ("hardcore"), whose switch had left the UI but
//    whose saved setting still applied. The simulator now always runs real-exam
//    rules (the real exam lets you go back and flag).
// 3. "the final score ... i can barely see anything": the results card kept
//    styles.css's dark purple gradient while its text followed the theme.
// 4. "why is it purple ????": the review header and PBQ chip had no desktop
//    brand rules (lift-screens.css only loads under 900px).

const fs = require('fs');
const path = require('path');
const { _fnBody, js, results, test } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Exam feedback fixes (v8.166.0) ──\x1b[0m');
  try {
    const ROOT = path.join(__dirname, '..', '..');
    const sl = fs.readFileSync(path.join(ROOT, 'features', 'sim-lab.js'), 'utf8');
    const ex = fs.readFileSync(path.join(ROOT, 'features', 'exam.js'), 'utf8');
    const dg = fs.readFileSync(path.join(ROOT, 'dg-system.css'), 'utf8');

    // ── 1. Reset ──
    const mount = _fnBody(sl, '_slMountScenario') || '';
    test('PBQ Reset: shown only when the host passes onReset, beside Submit in one actions row',
      /if \(opts && typeof opts\.onReset === 'function'\) \{[\s\S]{0,200}_el\('button', 'sl-reset', 'Reset'\)/.test(mount)
        && /actions\.appendChild\(submit\);\s*wrap\.appendChild\(actions\);/.test(mount));
    test('PBQ Reset: asks before clearing, then hands over to the host',
      /window\.confirm\('Clear your answers on this PBQ and start it again\?'\)\) return;\s*opts\.onReset\(\);/.test(mount));
    test('PBQ Reset: removed once the PBQ is submitted, so a graded answer cannot be reset',
      /submitted = true;\s*if \(resetBtn && resetBtn\.parentNode\) resetBtn\.parentNode\.removeChild\(resetBtn\);/.test(mount));
    test('PBQ Reset: the Full Exam Simulator clears the saved answers and re-renders the question',
      /onReset: function \(\) \{ ans\.sl = null; renderExam\(\); \}/.test(_fnBody(ex, '_examRenderPbq') || ''));
    test('PBQ Reset: Sim Lab exam mode keeps the time already spent on the round and clears its answer',
      /onReset: function \(\) \{[\s\S]{0,120}_slSession\.roundMs\[idx\] \+= [\s\S]{0,120}_slSession\.answers\[idx\] = null;\s*_slRenderRound\(idx\);/.test(_fnBody(sl, '_slRenderRound') || ''));
    test('PBQ Reset: Sim Lab practice and practice sessions re-mount the same PBQ blank',
      (sl.match(/onReset: function \(\) \{ _slMountScenario\(body, scn, this\); \}/g) || []).length === 2);
    test('PBQ Reset CSS: 44px target, hover gated to fine pointers, reduced-motion safe',
      /\.sl-reset\{min-height:44px;/.test(dg) && /@media \(hover:hover\) and \(pointer:fine\)\{\.sl-reset:hover\{/.test(dg)
        && /@media \(prefers-reduced-motion:reduce\)\{\.sl-reset\{transition:none;\}/.test(dg));

    // ── 2 + 5. Strict Mode retired from the simulator ──
    test('Strict Mode: startExam always runs real-exam rules (no more reading the hidden saved setting)',
      /examHardcore = false;/.test(_fnBody(ex, 'startExam') || '') && !/localStorage\.getItem\(STORAGE\.HARDCORE_EXAM\)/.test(ex));
    test('Strict Mode: a resumed exam saved in Strict Mode also runs real-exam rules',
      /examHardcore = false;/.test(_fnBody(ex, 'resumeExam') || '') && !/examHardcore = !!st\.hardcore/.test(ex));

    // ── 3. Results card ──
    test('Results card: one theme-aware surface card, no gradient, no purple glow',
      /#page-exam-results \.exam-results-v2-hero\{background:var\(--surface\)!important;border:1px solid var\(--border\)!important;/.test(dg)
        && /#page-exam-results \.exam-results-v2-hero::before\{content:none!important;/.test(dg));
    test('Results card: the two halves are no longer boxed; a single hairline divides them',
      /#page-exam-results \.exam-results-v2-big\{background:none!important;border:0!important;/.test(dg)
        && /#page-exam-results \.exam-results-v2-side\{background:none!important;border:0!important;border-left:1px solid var\(--dg-rule-soft\)!important;/.test(dg));
    test('Results card: score and stats use the hero-numeral pattern (Fraunces, lining figures) and theme text colours',
      /#page-exam-results \.exam-results-v2-big-score\{font-family:'Fraunces'[^}]*lining-nums tabular-nums/.test(dg)
        && /#page-exam-results \.results-v2-row \.v\{font-family:'Fraunces'[^}]*color:var\(--text\)!important;/.test(dg));

    // ── 4. Review page purple ──
    test('Review page: desktop header uses brand tokens (muted label, bronze em, no leading dash)',
      /@media \(min-width:900px\)\{\s*html\[data-theme\] body #page-review \.ed-pagehead-eyebrow\{[^}]*color:var\(--text-dim\)!important;/.test(dg)
        && /#page-review \.ed-pagehead-eyebrow::before\{content:none!important;/.test(dg)
        && /#page-review \.ed-pagehead-display em\{color:var\(--accent\)!important;\}/.test(dg));
    test('Review page: the PBQ type chip is the neutral outline, not the old purple',
      /html\[data-theme\] body #page-review \.pbq-badge\{[^}]*color:var\(--text-dim\);background:none!important;border:1px solid var\(--border\)!important;/.test(dg));
  } catch (err) {
    test('Exam feedback fixes: block (threw)', false);
    results.errors.push('370 exam-feedback-fixes block threw: ' + err.message);
  }
})();
