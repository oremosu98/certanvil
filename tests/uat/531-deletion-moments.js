// tests/uat/531-deletion-moments.js
// Persona bundle T18: the phone goodbye after requesting deletion and the welcome back after cancelling it
// (features/home.js, lift-ios.css). Spec: docs/superpowers/specs/2026-10-30-deletion-moments-design.md
// Behaviour (fixed clock, once-only, reduced motion) is in tests/e2e/lift-5c.spec.js; here the pure pieces and the source contracts.
const fs = require('fs');
const path = require('path');
const { _fnBody, js, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Deletion moments ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const home = fs.readFileSync(path.join(ROOT, 'features', 'home.js'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'lift-ios.css'), 'utf8');
  const dash = String.fromCharCode(0x2014);

  const ctx = vm.createContext({ Math, String, Array, Object, JSON, Date, Number, isFinite, isNaN });
  vm.runInContext(['_dmDate', '_dmScheduled'].map((n) => _fnBody(home, n)).join('\n'), ctx);
  const date = (d, o) => vm.runInContext('_dmDate(__d, __o)', Object.assign(ctx, { __d: d, __o: o }));
  const sched = (s, n) => vm.runInContext('_dmScheduled(__s, __n)', Object.assign(ctx, { __s: s, __n: n }));
  test('date: weekday, day and short month, like "Fri 6 Nov"', date(new Date(2026, 10, 6, 12)) === 'Fri 6 Nov');
  test('date: day only for the "before 6 Nov" line', date(new Date(2026, 10, 6, 12), true) === '6 Nov');
  test('date: single-digit days carry no leading zero', date(new Date(2026, 0, 2, 12)) === 'Fri 2 Jan');
  test('scheduled: the server stamp plus 7 days', date(sched('2026-10-30T12:00:00Z')) === 'Fri 6 Nov');
  test('scheduled: a missing stamp falls back to now plus 7 days', date(sched(null, new Date(2026, 9, 30, 12))) === 'Fri 6 Nov');
  test('scheduled: a junk stamp falls back to now plus 7 days', date(sched('nope', new Date(2026, 9, 30, 12))) === 'Fri 6 Nov');

  test('Apple billing line only in the iOS app', /pro && window\.CA_NATIVE \? '<p class="gb-quiet/.test(home));
  test('welcome back waits up to 15s for hydrate, then shows no tiles rather than zeros', /_dmHydrateWaitMs \|\| 15000/.test(home) && /_dmWelcome\(safe\)/.test(home) && /withTiles === false/.test(home));
  test('Back opens Home; Escape on document respects defaultPrevented', /showPage\('setup'\)/.test(home) && /ev\.defaultPrevented\) return;/.test(home) && /aria-labelledby/.test(home));
  test('fallback date adds calendar days with setDate', /d\.setDate\(d\.getDate\(\) \+ 7\)/.test(home));
  test('css: explicit focus ring on the buttons, welcome back delays reset under reduced motion', /\.dm-cta:focus-visible/.test(css) && /#ios-welcomeback\.dm-open \.dm-in \{ animation: dm-fade-only/.test(css));
  test('goodbye shows at every width once signed out; the offline card is the only other success outcome', /\} else if \(card\) \{[^\n]*\n\s*modal\.style\.display = 'none';[^\n]*\n\s*_dmGoodbye\(modal, stamp, wasPro\);/.test(home) && !/else if \(card && _dmPhone\(\)\) \{\s*_dmGoodbye/.test(home) && home.includes("Account scheduled for deletion") && /if \(card && !signedOut\) \{/.test(home));
  test('goodbye uses the server stamp from request_account_deletion', /stamp = r\.data;/.test(home));
  test('Pro is read before sign-out, so the Apple billing line can show', /var wasPro = false, stamp = null;[\s\S]{0,300}_quotaState/.test(home));
  test('Done reloads; Sign back in goes through iosSignIn', /data-act="done"[\s\S]{0,40}Done/.test(home) && /window\.location\.reload\(\); \}\s*else _dmClose\(el, function \(\) \{[\s\S]{0,200}iosSignIn\.go\('signedout'\)/.test(home));
  test('welcome back: the full moment at every width, no toast', /deletion_cancelled_at\) return null;[\s\S]{0,900}_dmWelcome\(safe\)[\s\S]{0,200}clear_deletion_notice/.test(home) && !/Welcome back\. We've cancelled the deletion/.test(home) && !/if \(_dmPhone\(\)\) \{\s*\/\/ The full moment/.test(home));
  test('welcome back: one clear_deletion_notice call, guarded by the shown flag', (home.match(/sb\.rpc\('clear_deletion_notice'\)/g) || []).length === 1 && /_noticeShown = true;/.test(home));
  test('welcome back tiles skip split history rows and read the best streak', /isHistorySplitRow\(e\)\) return;/.test(home) && /st && Number\(st\.best\)/.test(home) && /_readReadinessSnapshots/.test(home));
  test('overlay: inert behind, un-inert first on close, focus restored, Escape on welcome back',
    /c\.inert = true/.test(home) && /_dmInerted\.forEach\(function \(c\) \{ c\.inert = false; \}\);[\s\S]{0,200}_dmPrevFocus\.focus/.test(home) && /ev\.key !== 'Escape'/.test(home));
  test('count-up is 900ms and lands on the exact value', /\/ 900, 1\)/.test(home) && /b\.textContent = fmt\(to\)/.test(home));
  test('count-up is skipped under reduced motion', /var still = window\.matchMedia && window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches;\s*if \(!still\)/.test(home));

  test('css: BRAND curve only, hand sweep and wind are rotate, rises are translateY', css.includes('.dm-open .gb-hand { animation: dm-sweep .9s var(--ios-ease)') && css.includes('@keyframes dm-sweep { from { transform: rotate(-300deg); } }')
    && css.includes('@keyframes dm-rise { from { opacity: 0; transform: translateY(12px); } }') && !/cubic-bezier\(0\.23/.test(css.slice(css.indexOf('Persona bundle T18'))));
  test('css: entrances rest visible and animate from hidden (backwards fill)', /\.dm-open \.dm-in \{ animation: dm-rise \.54s var\(--ios-ease\) backwards;/.test(css) && css.includes('.dm-open .gb-clockwrap { animation: dm-fade .52s var(--ios-ease) backwards; }'));
  test('css: no entrance below scale(.96)', !/dm-(fade|pop)[^}]*scale\(0?\.9[0-5]/.test(css));
  test('css: reduced motion collapses to a fade only', /prefers-reduced-motion: reduce\) \{\s*\.dm-screen \{ transition: opacity \.18s ease; \}\s*\.dm-open \.gb-clockwrap[\s\S]{0,400}animation: dm-fade-only \.3s ease backwards/.test(css));
  const block = css.slice(css.indexOf('Persona bundle T18'));
  test('copy: no em dashes in the new code', !home.slice(home.indexOf('Deletion moments (persona bundle T18)'), home.indexOf('function _confirmDeleteAccount')).includes(dash) && !block.includes(dash));
  test('copy: the goodbye and welcome back lines match the spec', ['Goodbye for now', 'Your account will be deleted on', 'Changed your mind?', 'and everything&#39;s kept: your progress, streak and readiness.',
    'It&#39;s billed by Apple. Cancel it in iPhone Settings so you&#39;re not charged again.', 'We&#39;ve cancelled your account deletion.', ' Everything is right where you left it.', 'Sign back in', '>Done<'].every((t) => home.includes(t)));
})();
