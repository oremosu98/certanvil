/* ════════════════════════════════════════════════════════════════════════
   CertAnvil iOS E2E — shell engine  (Phase 1 skeleton)
   ------------------------------------------------------------------------
   Stitches the EXACT cert-ios-* / onboarding-* mockups into one navigable
   app. Each view is the untouched mockup loaded in an iframe (perfect 1:1
   fidelity by construction). The shell only:
     1. renders the inner .screen full-bleed on a 390x844 canvas, scaled to
        fit the viewport (strips the .stage caption + .phone bezel via
        injected CSS — the mockup files are NEVER edited)
     2. manages a view stack with iOS push/pop transitions
     3. shares state across views via same-origin localStorage
   See: docs/superpowers/specs/2026-06-08-cert-ios-e2e-app-plan.md
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Device design canvas (matches .phone in every mockup) ───────────────
  var CANVAS_W = 390, CANVAS_H = 844;

  // ── Screen registry: id -> mockup filename (relative to /mockups/) ──────
  var SCREENS = {
    'native-welcome'    : 'onboarding-native-welcome.html',
    'rollout'           : 'onboarding-rollout-flow.html',
    'signup-signin'     : 'onboarding-signup-signin.html',
    'magic-link'        : 'onboarding-magic-link-sent.html',
    'signin-typo'       : 'onboarding-signup-signin.html?v=typo',          // Stage 5b (28 Oct): "Did you mean"
    'email-code'        : 'onboarding-email-code.html',                    // Stage 5b: the 6-digit code
    'code-wrong'        : 'onboarding-email-code.html?v=wrong',
    'code-expired'      : 'onboarding-email-code.html?v=expired',
    'resend-wait'       : 'onboarding-email-code.html?v=resend-wait',
    'code-offline'      : 'onboarding-email-code.html?v=offline',
    'lock-switched'     : 'cert-ios-home.html?v=lockswitch',               // Stage 5b: the account's free exam wins, said once
    'welcome-back'      : 'onboarding-welcome-back.html',
    'plan-picker'       : 'onboarding-plan-picker-concept.html',
    'free-cert-picker'  : 'onboarding-free-cert-picker.html',
    'free-home-day0'    : 'onboarding-free-home-day0.html',
    'first-run-diag'    : 'onboarding-first-run-diagnostic.html',
    'picker-lock'       : 'onboarding-free-cert-picker.html?v=lock',       // Lift C (26 Oct): the lock-in sheet open
    'picker-pro'        : 'onboarding-free-cert-picker.html?v=pro',        // Lift C: a Pro user picks, no lock-in
    'picker-last'       : 'onboarding-free-cert-picker.html?v=last',       // Stage 5a (27 Oct): reminder 2, "One last check"
    'offline-native'    : 'onboarding-loading-states.html?v=offline-native', // Stage 5a: the app's own offline page
    'day0-pro'          : 'onboarding-free-home-day0.html?v=pro',          // Lift C: Pro day 0, no quota rows
    'check-score'       : 'onboarding-first-run-diagnostic.html?v=score',  // Lift C: "Your starting point"
    'restore'           : 'onboarding-loading-states.html?v=restore',      // Lift C: session restore skeleton
    'offline'           : 'onboarding-loading-states.html?v=offline',      // Lift C: the calm offline state
    'notifications'     : 'onboarding-notifications-prime.html',
    'home'              : 'cert-ios-home.html',
    'home-exam-paused'  : 'cert-ios-home.html?v=exam',
    'home-signed-out'   : 'cert-ios-home.html?v=signedout',
    'drills'            : 'cert-ios-drills.html',
    'drills-free'       : 'cert-ios-drills.html?v=free',   // B3a (22 Oct): free pills + Pro locks
    'drills-empty'      : 'cert-ios-drills.html?v=empty',  // B3a: a fresh user, empty states
    'drills-dl'         : 'cert-ios-drills.html?v=dl',     // B3a: AZ-900, Decision Lab instead of Sim Lab
    'simlab'            : 'cert-ios-simlab.html',          // B3b1 (22 Oct): practice Sim Lab start screen
    'simlab-loading'    : 'cert-ios-simlab.html?v=loading',
    'simlab-round'      : 'cert-ios-simlab.html?v=round',   // console card stays inline (it takes answers)
    'simlab-reset'      : 'cert-ios-simlab.html?v=reset',   // Reset asks in B2's sheet
    'simlab-map'        : 'cert-ios-simlab.html?v=round-map', // passive reference: Tap to enlarge
    'simlab-enlarge'    : 'cert-ios-simlab.html?v=enlarge',
    'simlab-verdict'    : 'cert-ios-simlab.html?v=verdict',
    'simlab-verdict-open': 'cert-ios-simlab.html?v=verdict-open',
    'simlab-exam-loading'  : 'cert-ios-simlab.html?v=exam-loading',      // B3b2 (22 Oct): Sim Lab Exam mode
    'simlab-exam-round'    : 'cert-ios-simlab.html?v=exam-round',        // the full exam's bar + dock around B3b1 cards
    'simlab-exam-last'     : 'cert-ios-simlab.html?v=exam-round-last',   // last round: Review opens the End dialog
    'simlab-exam-end'      : 'cert-ios-simlab.html?v=exam-end',
    'simlab-exam-jump'     : 'cert-ios-simlab.html?v=exam-end-jump',
    'simlab-exam-abandon'  : 'cert-ios-simlab.html?v=exam-abandon',
    'simlab-exam-result'   : 'cert-ios-simlab.html?v=exam-result',
    'simlab-exam-timeup'   : 'cert-ios-simlab.html?v=exam-result-timeup',
    'gauntlet'             : 'cert-ios-gauntlet.html',                      // B3c1 (23 Oct): Reword Gauntlet
    'gauntlet-pick'        : 'cert-ios-gauntlet.html?v=entry-pick',
    'gauntlet-free'        : 'cert-ios-gauntlet.html?v=entry-free',
    'gauntlet-loading'     : 'cert-ios-gauntlet.html?v=loading',
    'gauntlet-run'         : 'cert-ios-gauntlet.html?v=run',
    'gauntlet-answered'    : 'cert-ios-gauntlet.html?v=run-answered',
    'gauntlet-cracked'     : 'cert-ios-gauntlet.html?v=result-cracked',
    'gauntlet-miss'        : 'cert-ios-gauntlet.html?v=result-miss',
    'gauntlet-miss-open'   : 'cert-ios-gauntlet.html?v=result-miss-open',
    'gauntlet-miss-free'   : 'cert-ios-gauntlet.html?v=result-miss-free',
    'whynot'              : 'cert-ios-whynot.html',                      // B3c2 (25 Oct): Why-Not
    'whynot-free'         : 'cert-ios-whynot.html?v=entry-free',
    'whynot-pick'         : 'cert-ios-whynot.html?v=entry-pick',
    'whynot-loading'      : 'cert-ios-whynot.html?v=loading',
    'whynot-question'     : 'cert-ios-whynot.html?v=question',
    'whynot-reason'       : 'cert-ios-whynot.html?v=reason',
    'whynot-picked'       : 'cert-ios-whynot.html?v=reason-picked',
    'whynot-wrong'        : 'cert-ios-whynot.html?v=reason-wrong',
    'whynot-verdict'      : 'cert-ios-whynot.html?v=verdict',
    'whynot-verdict-open' : 'cert-ios-whynot.html?v=verdict-open',
    'whynot-session'      : 'cert-ios-whynot.html?v=session',
    'whynot-leave'        : 'cert-ios-whynot.html?v=leave',
    'dl'                  : 'cert-ios-decisionlab.html',                 // B3c3 (25 Oct): Decision Lab
    'dl-free'             : 'cert-ios-decisionlab.html?v=entry-free',
    'dl-practice'         : 'cert-ios-decisionlab.html?v=practice',
    'dl-graded'           : 'cert-ios-decisionlab.html?v=practice-graded',
    'dl-exam'             : 'cert-ios-decisionlab.html?v=exam',
    'dl-exam-amber'       : 'cert-ios-decisionlab.html?v=exam-amber',
    'dl-exam-end'         : 'cert-ios-decisionlab.html?v=exam-end',
    'dl-results'          : 'cert-ios-decisionlab.html?v=results',
    'dl-results-open'     : 'cert-ios-decisionlab.html?v=results-open',
    'dl-results-timeup'   : 'cert-ios-decisionlab.html?v=results-exam-timeup',
    'dl-leave'            : 'cert-ios-decisionlab.html?v=leave',
    'hub'               : 'cert-ios-hub.html',
    'quiz'              : 'cert-ios-quiz.html',
    'quiz-short-set'    : 'cert-ios-quiz.html?v=short',
    'quiz-answered'     : 'cert-ios-quiz.html?v=ans',
    'custom-quiz'       : 'cert-ios-custom-quiz.html',
    'custom-quiz-topic' : 'cert-ios-custom-quiz.html?v=topic',   // from "Drill this topic" (20 Oct)
    'custom-quiz-caught-up' : 'cert-ios-custom-quiz.html?cu=0',  // Catch-up with nothing stale (20 Oct)
    'analytics-map'     : 'cert-ios-analytics.html?p=1',   // B1: topic map replaces Sky (21 Oct)
    'analytics-wins'    : 'cert-ios-analytics.html?p=5',   // B1: Hands-on milestones on Wins (21 Oct)
    'review-done'       : 'cert-ios-review.html?v=done',   // B1: Next 7 days with exam day (21 Oct)
    'exam'              : 'cert-ios-exam.html',
    'exam-paused'       : 'cert-ios-exam.html?v=paused',   // B2 (21 Oct): Pause covers the question
    'exam-end'          : 'cert-ios-exam.html?v=jump',     // B2: End dialog with the question grid
    'exam-leave'        : 'cert-ios-exam.html?v=leave',    // B2: leave sheet instead of the system alert
    'exam-pbq'          : 'cert-ios-exam.html?v=pbq',      // B2: a Sim Lab question inside the exam
    'exam-results-toast': 'cert-ios-exam-results.html?v=toast',   // B2: milestone toast from the top
    'results'           : 'cert-ios-results.html',
    'results-milestone' : 'cert-ios-results.html?v=milestone',
    'exam-results'      : 'cert-ios-exam-results.html',
    'progress'          : 'cert-ios-progress.html',
    'analytics'         : 'cert-ios-analytics.html',
    'report'            : 'cert-ios-report.html',
    'cross-cert'        : 'cert-ios-cross-cert.html',
    'settings'          : 'cert-ios-settings.html',                     // B4 (26 Oct): Settings, the Account tab
    'st-signed-out'     : 'cert-ios-settings.html?v=signed-out',
    'st-free'           : 'cert-ios-settings.html?v=free',
    'st-pro'            : 'cert-ios-settings.html?v=pro',
    'st-exam-date'      : 'cert-ios-settings.html?v=exam-date',
    'st-cert-switch'    : 'cert-ios-settings.html?v=cert-switch',
    'st-diag'           : 'cert-ios-settings.html?v=diag',
    'st-restore'        : 'cert-ios-settings.html?v=restore',
    'st-clear-bank'     : 'cert-ios-settings.html?v=clear-bank',
    'st-delete'         : 'cert-ios-settings.html?v=delete',
    'st-methods'        : 'cert-ios-settings.html?v=methods',          // Stage 5c (28 Oct): Sign-in methods
    'st-methods-added'  : 'cert-ios-settings.html?v=methods-added',
    'st-methods-exists' : 'cert-ios-settings.html?v=methods-exists',
    'st-delete-apple'   : 'cert-ios-settings.html?v=delete-apple',     // Stage 5c: Apple confirms before deletion
    'signin-provider-error': 'onboarding-signup-signin.html?v=provider-error',
    'log-result'        : 'cert-ios-log-result.html',
    'review'            : 'cert-ios-review.html',
    'review-answers'    : 'cert-ios-review-answers.html',
    'daily-limit'       : 'cert-ios-daily-limit.html',
    'free-capped-home'  : 'onboarding-free-capped-home.html',
    'upgrade-sheet'     : 'onboarding-upgrade-sheet.html',
    'pro-iap'           : 'onboarding-pro-iap.html',
    'pro-welcome'       : 'onboarding-pro-welcome.html',
    'my-certs-pro'      : 'onboarding-my-certs-pro.html',
    'restore-purchase'  : 'onboarding-restore-purchase.html',
    'manage-sub'        : 'onboarding-manage-subscription.html',
    'account-deletion'  : 'onboarding-account-deletion.html',
    'pro-expired'       : 'cert-ios-pro-expired.html',
    'error-states'      : 'onboarding-error-states.html',
    'loading-states'    : 'onboarding-loading-states.html'
  };

  // ── Canonical happy-path spine (D7: Option B) ───────────────────────────
  var HAPPY_PATH = [
    'native-welcome', 'free-cert-picker', 'free-home-day0',
    'home', 'hub', 'free-capped-home', 'upgrade-sheet', 'pro-iap',
    'pro-welcome', 'my-certs-pro'
  ];

  // ── Nav-bridge route map (Phase 2) ──────────────────────────────────────
  //  Wires each mockup's in-screen CTAs to drive the shell, WITHOUT editing
  //  the mockups. Only navigation actions are bound; in-screen toggles
  //  (.seg, .state-chip), cert selection (.cert-row), and modals are left to
  //  the mockup's own JS. Universal: .back / [data-act="back"] -> pop.
  //  Each rule: {sel, to, push?} — `to` is a SCREENS id (or 'pop'/'next').
  var NAV = {
    // Stage 5b (28 Oct): Get started -> the 5a picker; Sign in -> one screen -> the code -> the account's cert
    'native-welcome'   : [ {sel:'.btn-primary', to:'free-cert-picker'},
                           {sel:'.btn-link',    to:'signup-signin'} ],
    'signup-signin'    : [ {sel:'.btn-apple',   to:'home'},          // 5c switches Apple on
                           {sel:'#googleBtn',   to:'home'},          // 5c: Google, like Apple, lands on the account's cert
                           {sel:'#goCode',      to:'email-code'} ],  // the mockup clicks it once the typo check passes
    'email-code'       : [ {sel:'#goHome',      to:'home'},
                           {sel:'#changeEmail', to:'pop'} ],
    // Lift C (26 Oct): Lock in opens the lock-in sheet (the mockup's own JS); only its confirm moves on
    // Stage 5a: Lock in -> sheet 1 -> sheet 2 (mockup JS); only "Yes, lock in" moves on
    'free-cert-picker' : [ {sel:'#lastGo',      to:'free-home-day0'} ],
    'picker-pro'       : [ {sel:'#lockBtn',     to:'day0-pro'} ],
    'day0-pro'         : [ {sel:'.btn-primary', to:'first-run-diag'}, {sel:'.btn-ghost', to:'quiz'} ],
    // day-0 free home: the primary CTA places a readiness score (the 30-sec
    // check); the secondary "Start today's 15" (ghost) launches the daily
    // session — both handled with extra logic in the screen-specific block.
    'free-home-day0'   : [ {sel:'.btn-primary', to:'first-run-diag'} ],
    // home dashboard: cert name -> hub (cert switcher), gear -> settings.
    // The 4-tab bar (Home/Drills/Progress/Account) is wired generically below.
    // "Review 7 cards" (returning) -> spaced-repetition session; first-quiz lead -> quiz.
    //  Study menus already exist on home; wire them. Order matters (first rule
    //  that matches an element wins): exam launchers before the generic .opt.
    'home-exam-paused' : [ {sel:'.rec-exam', to:'exam'}, {sel:'.tb-set', to:'settings'}, {sel:'.mo-go', to:'quiz'}, {sel:'.opt', to:'quiz'} ],
    'home-signed-out'  : [ {sel:'.tb-signin', to:'signup-signin'}, {sel:'.tb-set', to:'settings'}, {sel:'.mo-go', to:'quiz'}, {sel:'.opt', to:'quiz'} ],
    'home'             : [ {sel:'.tb-name', to:'hub'},
                           {sel:'.mo-go', to:'quiz'},
                           {sel:'.tb-set',  to:'settings'},
                           {sel:'.rec.only-returning', to:'review'},
                           {sel:'.rec.only-new', to:'quiz'},
                           {sel:'.exam-lead', to:'exam'},          // 60Q SIM
                           {text:'Full Exam', to:'exam'},          // 90Q full simulator
                           {sel:'.opt', to:'quiz'},                // remaining practice options
                           {sel:'.custom', to:'custom-quiz'},      // Build a custom quiz
                           {sel:'.domain', to:'quiz'} ],           // drill-by-domain (stand-in)
    // drills launcher: every drill CTA starts a (10-Q) drill session -> quiz
    'drills'           : [ {sel:'#drillMistakes', to:'quiz'},
                           {sel:'#drillWeak',     to:'quiz'},
                           {sel:'.domain',        to:'quiz'},
                           {sel:'.mrow', text:'Reword Gauntlet', to:'gauntlet'},
                           {sel:'.mrow', text:'Why-Not', to:'whynot'},
                           {sel:'.mrow', text:'Decision Lab', to:'dl'} ],
    'review'           : [ {sel:'#toHome', to:'home'} ],
    // report is a sheet; its X / Cancel close it (pop back to the previous screen)
    'report'           : [ {sel:'#closeBtn', to:'pop'}, {sel:'#cancelBtn', to:'pop'} ],
    // account-lifecycle exits (no dead-ends): restore success -> home; after
    // account deletion -> back to the welcome screen.
    'restore-purchase' : [ {text:'Continue to CertAnvil', to:'home'} ],
    'account-deletion' : [ {sel:'#restartBtn', to:'native-welcome'} ],
    // settings Account section -> the Apple lifecycle screens
    // B4: Sign in, the delete confirm and the Go Pro rows (Manage subscription / Restore purchases left out until payments exist)
    'settings'         : [ {sel:'#stSignIn',      to:'signup-signin'},
                           {sel:'#setDeleteAcct', to:'account-deletion'},
                           {sel:'#goProRow',      to:'upgrade-sheet'},
                           // free users: the locked daily-goal / daily-review upsells -> paywall
                           {sel:'#goProGoal',     to:'upgrade-sheet'},
                           {sel:'#goProReview',   to:'upgrade-sheet'} ],
    // hub: tapping a locked cert opens the upsell sheet (mockup JS); the sheet's
    // "Unlock with Pro" and the "Go Pro" CTA drive the paywall arc
    // .pro-cta / tapping a locked cert opens the mockup's own upsell sheet;
    // the sheet's "Unlock with Pro" (#sheetGoPro) is the real nav to the IAP.
    'hub'              : [ {sel:'#sheetGoPro', to:'pro-iap'},
                           {sel:'#sheetClose', to:'pop'},
                           {sel:'#logResultLink', to:'log-result'} ],
    'free-capped-home' : [ {sel:'.see',        to:'upgrade-sheet'},
                           {sel:'.btn-primary',to:'quiz'} ],
    'upgrade-sheet'    : [ {sel:'.btn-primary',to:'pro-iap'},
                           {sel:'#maybeLater', to:'pop'},
                           {text:'Restore purchase', to:'restore-purchase'} ],
    // pro-iap purchase buttons handled by the Pro-bypass block (sets demoPro);
    // here we only wire the cancel + restore paths.
    'pro-iap'          : [ {sel:'#skCancel',   to:'pop'},
                           {sel:'#restoreLink', to:'restore-purchase'} ],
    'pro-welcome'      : [ {sel:'.btn-primary',to:'my-certs-pro'} ],
    'my-certs-pro'     : [ {sel:'.btn-primary',to:'home'} ],
    // study loop: quiz advances to a session result; exam submits to exam-results.
    // the top-bar exit/close leaves the session back to home (no dead-end).
    'quiz'             : [ {sel:'.btn-primary:not([disabled])', to:'results'},
                           {sel:'.exit', to:'home'} ],
    'custom-quiz'      : [ {sel:'.btn-primary:not([disabled])', to:'results'},
                           {sel:'.tb-close', to:'home'} ],
    'exam'             : [ {sel:'#mSubmit',  to:'exam-results'},
                           {sel:'#endBtn',   to:'pop'},
                           {sel:'#mAbandon', to:'pop'} ],
    'results'          : [ {text:'Redo this quiz',       to:'quiz'},
                           {text:'Drill my 3 mistakes',  to:'quiz'},
                           {text:'Review answers',       to:'review-answers'},
                           {text:'Back to menu',         to:'home'} ],
    'exam-results'     : [ {text:'Drill the gap', to:'quiz'},
                           {text:'Review all',    to:'review-answers'},
                           {text:'Menu',          to:'home'} ],
    'review-answers'   : [ {sel:'#done', to:'pop'} ],
    // free daily-limit blocker: upsell -> paywall; "do 15" -> a (free-sized) quiz
    'daily-limit'      : [ {sel:'#goPro', to:'upgrade-sheet'}, {sel:'#do15', to:'quiz'} ],
    // lapsed-subscription re-entry: renew -> IAP; keep Free -> home
    'pro-expired'      : [ {sel:'#renewBtn', to:'pro-iap'}, {sel:'#freeBtn', to:'home'} ],
    // log-result: after saving, "See it in your hub" -> hub (Passed state)
    'log-result'       : [ {sel:'#toHub', to:'hub'} ]
  };
  var BACK_SEL = '.back, .btn-back, [data-act="back"], [data-nav="back"]';

  // The dashboard tab bar (Home/Drills/Progress/Account) recurs across screens.
  // Wire it generically by label so every screen that has it navigates.
  // post-June variant screens reuse their base screen's routes
  NAV['quiz-short-set'] = NAV['quiz']; NAV['quiz-answered'] = NAV['quiz']; NAV['results-milestone'] = NAV['results'];
  NAV['picker-lock'] = NAV['free-cert-picker']; NAV['picker-last'] = NAV['free-cert-picker'];
  NAV['custom-quiz-topic'] = NAV['custom-quiz']; NAV['custom-quiz-caught-up'] = NAV['custom-quiz'];
  // B1 (21 Oct): the Progress | Analytics view switch
  NAV['progress'] = (NAV['progress'] || []).concat([{sel:'[data-view="analytics"]', to:'analytics'}]);
  NAV['analytics'] = (NAV['analytics'] || []).concat([{sel:'[data-view="progress"]', to:'progress'}]);
  ['exam-paused','exam-end','exam-leave','exam-pbq'].forEach(function (k) { NAV[k] = NAV['exam']; });
  NAV['exam-results-toast'] = NAV['exam-results'];
  NAV['signin-typo'] = NAV['signup-signin'];
  NAV['signin-provider-error'] = NAV['signup-signin'];
  NAV['lock-switched'] = NAV['home'];
  ['code-wrong','code-expired','resend-wait','code-offline'].forEach(function (k) { NAV[k] = NAV['email-code']; });
  ['drills-free','drills-empty','drills-dl'].forEach(function (k) { NAV[k] = NAV['drills']; });
  NAV['simlab'] = [ {text:'Start the sim', to:'simlab-loading'}, {sel:'.back', to:'drills'} ];
  NAV['simlab-verdict'] = [ {text:'Back to Practice', to:'drills'} ]; NAV['simlab-verdict-open'] = NAV['simlab-verdict'];
  ['simlab-round','simlab-reset','simlab-map','simlab-enlarge'].forEach(function (k) { NAV[k] = [ {sel:'.leave', to:'drills'} ]; });
  NAV['simlab-exam-round'] = [ {sel:'#nextBtn', to:'simlab-exam-last'} ];
  NAV['simlab-exam-result'] = [ {text:'Back to Practice', to:'drills'} ]; NAV['simlab-exam-timeup'] = NAV['simlab-exam-result'];
  NAV['gauntlet'] = [ {sel:'#startBtn', to:'gauntlet-loading'}, {sel:'.back', to:'drills'} ]; NAV['gauntlet-free'] = NAV['gauntlet'];
  NAV['gauntlet-run'] = [ {sel:'.exit', to:'drills'} ]; NAV['gauntlet-answered'] = [ {text:'Next question', to:'gauntlet-miss'}, {sel:'.exit', to:'drills'} ];
  NAV['gauntlet-cracked'] = [ {text:'Back to Drills', to:'drills'}, {text:'Next target', to:'gauntlet-loading'} ];
  NAV['gauntlet-miss'] = [ {text:'Run it again', to:'gauntlet-loading'}, {text:'Different concept', to:'gauntlet-loading'} ]; NAV['gauntlet-miss-open'] = NAV['gauntlet-miss']; NAV['gauntlet-miss-free'] = NAV['gauntlet-miss'];
  NAV['whynot'] = [ {sel:'#startBtn', to:'whynot-loading'}, {sel:'.back', to:'drills'} ]; NAV['whynot-free'] = [ {sel:'.back', to:'drills'} ];
  NAV['whynot-question'] = [ {sel:'.exit', to:'whynot-leave'} ];
  NAV['whynot-picked'] = [ {text:'Next: why does D lose?', to:'whynot-wrong'} ]; NAV['whynot-wrong'] = [ {text:'See the round verdict', to:'whynot-verdict'} ];
  NAV['whynot-verdict'] = [ {text:'Next round', to:'whynot-session'} ]; NAV['whynot-verdict-open'] = NAV['whynot-verdict'];
  NAV['whynot-session'] = [ {text:'Back to Drills', to:'drills'}, {text:'Next target', to:'whynot-loading'} ];
  NAV['whynot-leave'] = [ {text:'Leave', to:'drills'} ];
  NAV['dl'] = [ {sel:'#startBtn', to:'dl-practice'}, {sel:'.back', to:'drills'} ]; NAV['dl-free'] = [ {sel:'.back', to:'drills'} ];
  NAV['dl-practice'] = [ {text:'Submit', to:'dl-graded'} ]; NAV['dl-graded'] = [ {text:'Next decision', to:'dl-exam'} ];
  NAV['dl-exam'] = [ {text:'Submit', to:'dl-exam-amber'} ]; NAV['dl-exam-amber'] = [ {text:'Submit and see results', to:'dl-results-timeup'} ];
  NAV['dl-results'] = [ {text:'Back to Drills', to:'drills'}, {text:'Run another set', to:'dl-practice'} ]; NAV['dl-results-open'] = NAV['dl-results']; NAV['dl-results-timeup'] = NAV['dl-results'];
  NAV['dl-leave'] = [ {text:'Leave', to:'drills'} ];
  NAV['analytics-wins'] = NAV['analytics']; NAV['analytics-map'] = NAV['analytics']; NAV['review-done'] = NAV['review'] || [];

  var TABS = { 'Home':'home', 'Drills':'drills', 'Progress':'progress', 'Account':'settings',
               'Analytics':'analytics', 'Settings':'settings' };

  // ── Injected CSS: strip the gallery frame, render .screen full-bleed ────
  //    (D8 — the live app is the inner .screen, minus bezel + caption)
  var STRIP_CSS = [
    'html,body{margin:0!important;padding:0!important;background:transparent!important;',
      'overflow:hidden!important;width:' + CANVAS_W + 'px!important;height:' + CANVAS_H + 'px!important;max-width:none!important;}',
    '.stage{max-width:none!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important;}',
    '.stage-head{display:none!important;}',
    /* designer state chips (Returning / New user / Generating...) are gallery chrome, not app UI */
    '.states,.switcher{display:none!important;}',
    /* kill any below-phone gallery caption (e.g. the report screen's .hint) */
    '.hint{display:none!important;}',
    '.phone-wrap{display:block!important;width:100%!important;height:100%!important;max-width:none!important;margin:0!important;padding:0!important;}',
    /* force .phone to fill the canvas (overrides the gallery ~92vw max-width media
       query); strip only bezel decoration; blend the 11px gutter to the screen bg
       so the .screen still renders at its exact DESIGN size — true 1:1.
       The explicit height chain (stage->phone->screen all 100%) is REQUIRED: some
       screens (report) have all-absolute content, so without it the screen
       collapses to the status-bar height. */
    '.phone{box-sizing:border-box!important;width:100%!important;height:100%!important;max-width:none!important;',
      'margin:0!important;border-radius:0!important;box-shadow:none!important;background:var(--bg,#fff)!important;}',
    '.screen{box-shadow:none!important;height:100%!important;}'
  ].join('');

  // ── App-wide theme (D: light/dark picker on every screen) ───────────────
  //  Every cert-ios-*/onboarding-* screen is data-theme aware and persists to
  //  the shared 'ca-theme' key. The shell applies the saved theme to each
  //  screen on load (so screens whose own toggle is stripped still theme
  //  correctly), exposes one persistent toggle, and listens for in-screen
  //  toggles so everything stays in sync.
  var THEME_KEY = 'ca-theme';
  function currentTheme() {
    try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch (_) { return 'light'; }
  }
  function applyThemeToDoc(doc) {
    try { if (doc && doc.documentElement) doc.documentElement.setAttribute('data-theme', currentTheme()); } catch (_) {}
  }
  function setTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    // re-apply to every screen currently in the stack (not just the top)
    stack.forEach(function (v) { try { applyThemeToDoc(v.iframeEl.contentDocument); } catch (_) {} });
    syncThemeHud();
  }
  function toggleTheme() { setTheme(currentTheme() === 'dark' ? 'light' : 'dark'); }
  function syncThemeHud() {
    if (!hudTheme) return;
    var dark = currentTheme() === 'dark';
    hudTheme.textContent = dark ? '☀ Light' : '☾ Dark';
    hudTheme.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  // ── Shell state ─────────────────────────────────────────────────────────
  var stackEl, scalerEl, hudCrumb, hudBack, hudPro, hudTheme;
  var stack = [];          // [{id, viewEl, iframeEl}]
  var animating = false;

  // ── Pro demo-bypass (D2) ────────────────────────────────────────────────
  //  A single, clearly-labelled demo flag. When ON it (a) flips the hub to its
  //  unlocked Pro view, and (b) lets the simulated Apple IAP "purchase"
  //  complete without real payment. One chokepoint, trivially removable.
  var DEMO_KEY = 'e2e_demo_pro';
  var demoPro = false;
  function isDemoPro() { return demoPro; }
  function setDemoPro(v) {
    demoPro = !!v;
    try { localStorage.setItem(DEMO_KEY, demoPro ? '1' : '0'); } catch (_) {}
    if (hudPro) {
      hudPro.textContent = demoPro ? '◈ Pro: ON' : '◈ Pro: off';
      hudPro.classList.toggle('on', demoPro);
    }
    // re-apply to whatever is currently on screen
    if (stack.length) {
      var top = stack[stack.length - 1];
      try { applyProState(top.iframeEl.contentDocument, top.id); } catch (_) {}
    }
  }
  // reflect Pro state inside a gated mockup (without editing the mockup file)
  function applyProState(doc, id) {
    if (!doc) return;
    if (id === 'hub') {
      var planPro = doc.querySelector('#planPro');
      var planFree = doc.querySelector('#planFree');
      if (demoPro && planPro && planFree && planFree.classList.contains('is-on')) {
        planPro.click();   // flip the hub to its unlocked Pro view (mockup JS)
      } else if (!demoPro && planFree && planPro && planPro.getAttribute('aria-pressed') === 'true') {
        planFree.click();  // back to free view
      }
    }
    if (/^custom-quiz/.test(id)) {
      // free: show the cap note + dim the over-cap options; pro: clear both
      var note = doc.getElementById('freeCapNote');
      if (note) note.style.display = demoPro ? 'none' : '';
      doc.querySelectorAll('[data-overcap]').forEach(function (el) { el.style.opacity = demoPro ? '' : '0.5'; });
    }
    if (id === 'home') {
      // daily-review count: free is capped at 5/day; Pro reflects the size
      // chosen in Settings (persisted), defaulting to "All due".
      var rc = doc.querySelector('.rec.only-returning .rc-title');
      if (rc) {
        if (demoPro) {
          var rsize = '';
          try { rsize = localStorage.getItem('e2e_review_size') || ''; } catch (_) {}
          if (!rsize) rsize = 'All due';
          rc.textContent = (rsize === 'All due') ? 'Review all due' : ('Review ' + rsize + ' cards');
        } else {
          rc.textContent = 'Review 5 cards';
        }
      }
    }
    if (id === 'settings') {
      // free: daily goal locked at 15, review capped at 5, no top-up (Pro upsell);
      // pro: live controls. The mockup owns the toggle via window.setPlan.
      try { if (doc.defaultView && doc.defaultView.setPlan) doc.defaultView.setPlan(demoPro); } catch (_) {}
    }
  }

  function fit() {
    // scale the 390x844 canvas to fit the viewport, preserving aspect.
    // translate(-50%,-50%) centres reliably regardless of scaled size.
    var vw = window.innerWidth, vh = window.innerHeight;
    var s = Math.min(vw / CANVAS_W, vh / CANVAS_H);
    scalerEl.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
  }

  function injectInto(iframe) {
    try {
      var doc = iframe.contentDocument;
      if (!doc) return;
      var style = doc.createElement('style');
      style.id = '__e2e_strip__';
      style.textContent = STRIP_CSS;
      (doc.head || doc.documentElement).appendChild(style);
      // apply the app-wide theme last, so it wins over the screen's own default
      applyThemeToDoc(doc);
    } catch (e) { /* cross-origin shouldn't happen (same dir) — fail soft */ }
  }

  // bind in-mockup CTAs to shell navigation (does not edit the mockup)
  function bindNav(iframe, id) {
    try {
      var doc = iframe.contentDocument;
      if (!doc) return;
      // universal: any back control pops the stack
      doc.querySelectorAll(BACK_SEL).forEach(function (el) {
        if (el.__e2e_bound) return; el.__e2e_bound = 1;
        el.addEventListener('click', function (e) { e.preventDefault(); pop(); });
      });
      // ── conditional routes that must PRE-EMPT the generic NAV rules ───────
      // Flow B: a session launched as the free "today's 15" ends on the
      // done-for-today capped home, not the normal results recap. Claim the
      // submit button here (sets __e2e_bound) so the generic quiz rule skips it.
      if (id === 'quiz') {
        var isDaily15 = false;
        try { isDaily15 = localStorage.getItem('e2e_daily15') === '1'; } catch (_) {}
        if (isDaily15) {
          doc.querySelectorAll('.btn-primary').forEach(function (el) {
            if (el.__e2e_bound) return; el.__e2e_bound = 1;
            el.addEventListener('click', function () {
              if (el.disabled) return;
              try { localStorage.removeItem('e2e_daily15'); } catch (_) {}
              setTimeout(function () { push('free-capped-home'); }, 90);
            });
          });
        }
      }

      // per-screen forward routes (rule.sel OR rule.text label match)
      (NAV[id] || (/^st-/.test(id) ? NAV.settings : null) || []).forEach(function (rule) {   // B4: every Settings state shares its links
        var els;
        if (rule.text) {
          els = [].slice.call(doc.querySelectorAll(rule.sel || 'button, a')).filter(function (e) {
            var t = (e.textContent || '').trim();
            return t === rule.text || t.indexOf(rule.text) === 0;
          });
        } else {
          els = [].slice.call(doc.querySelectorAll(rule.sel));
        }
        els.forEach(function (el) {
          if (el.__e2e_bound) return; el.__e2e_bound = 1;
          el.addEventListener('click', function () {
            // let the mockup's own press animation start, then navigate
            setTimeout(function () {
              if (rule.to === 'pop') pop();
              else if (rule.to === 'next') nextInPath();
              else push(rule.to);
            }, 90);
          });
        });
      });
      // generic dashboard tab bar (recurs across home/progress/settings/…)
      doc.querySelectorAll('.tabbar .tab').forEach(function (tab) {
        if (tab.__e2e_bound) return; tab.__e2e_bound = 1;
        var to = TABS[(tab.textContent || '').trim()];
        if (!to || to === id) return;          // skip unknown / current tab
        tab.addEventListener('click', function () {
          setTimeout(function () { push(to); }, 90);
        });
      });
      // Pro bypass: the simulated Apple IAP "purchase" flips demoPro on and
      // advances — no real StoreKit transaction. Subscribe opens the mockup's
      // own sheet; confirming it (or the post-purchase Start) becomes Pro.
      if (id === 'pro-iap') {
        var subBtn = doc.querySelector('#subscribeBtn');
        if (subBtn && !subBtn.__e2e_bound) { subBtn.__e2e_bound = 1;
          subBtn.addEventListener('click', function () { setDemoPro(true); });
        }
        ['#skConfirm', '#startBtn'].forEach(function (sel) {
          var el = doc.querySelector(sel);
          if (el && !el.__e2e_bound) { el.__e2e_bound = 1;
            el.addEventListener('click', function () {
              setDemoPro(true);
              setTimeout(function () { push('pro-welcome'); }, 120);
            });
          }
        });
      }
      // custom-quiz: a FREE user picking a set bigger than the daily cap (20)
      // hits the daily-limit blocker. Pro removes the cap (mockup selects normally).
      if (/^custom-quiz/.test(id)) {
        doc.querySelectorAll('[data-overcap]').forEach(function (el) {
          if (el.__e2e_bound) return; el.__e2e_bound = 1;
          el.addEventListener('click', function () {
            if (isDemoPro()) return; // Pro: no cap
            try { localStorage.setItem('e2e_overcap', el.getAttribute('data-overcap')); } catch (_) {}
            setTimeout(function () { push('daily-limit'); }, 60);
          });
        });
      }
      // free-home-day0: the secondary "Start today's 15" ghost button launches
      // the free daily session. Flag it so finishing the session lands on the
      // "done for today" capped home (see the quiz pre-empt block above).
      if (id === 'free-home-day0') {
        var go15 = doc.querySelector('.btn-ghost');
        if (go15 && !go15.__e2e_bound) { go15.__e2e_bound = 1;
          go15.addEventListener('click', function () {
            try { localStorage.setItem('e2e_daily15', '1'); } catch (_) {}
            setTimeout(function () { push('quiz'); }, 90);
          });
        }
      }

      // first-run-diag: the mockup is a designer two-pane (tab-toggle between
      // "The check" and "Your readiness"). In the live flow it's a sequence:
      // hide the designer tabs, run a short check, then reveal readiness.
      if (id === 'first-run-diag' || id === 'check-score') {
        var momentsWrap = doc.querySelector('.moments-wrap');
        if (momentsWrap) momentsWrap.style.display = 'none';   // not real app chrome
        var chipB   = doc.getElementById('chipB');
        var qcount  = doc.querySelector('#momentA .q-count');
        var qbar    = doc.querySelector('#momentA .qbar span');
        var TOTAL_Q = 5, qn = 1;
        if (qcount) qcount.textContent = 'Question 1 of ' + TOTAL_Q;
        if (qbar)   qbar.style.width = (100 / TOTAL_Q) + '%';
        // "Next question" walks the short check, then flips to the reveal
        var nextQ = doc.querySelector('#momentA .btn-primary');
        if (nextQ && !nextQ.__e2e_bound) { nextQ.__e2e_bound = 1;
          nextQ.addEventListener('click', function () {
            qn++;
            if (qn > TOTAL_Q) { if (chipB) chipB.click(); return; }  // -> readiness reveal
            if (qcount) qcount.textContent = 'Question ' + qn + ' of ' + TOTAL_Q;
            if (qbar)   qbar.style.width = ((qn / TOTAL_Q) * 100) + '%';
          });
        }
        // "Skip the check" -> straight to home (no score placed; full quota waits)
        var skipChk = doc.querySelector('#momentA .btn-text');
        if (skipChk && !skipChk.__e2e_bound) { skipChk.__e2e_bound = 1;
          skipChk.addEventListener('click', function () { setTimeout(function () { push('home'); }, 90); });
        }
        // "Start practising" (on the readiness reveal) -> home with the score placed
        var startPr = doc.querySelector('#momentB .btn-primary');
        if (startPr && !startPr.__e2e_bound) { startPr.__e2e_bound = 1;
          startPr.addEventListener('click', function () { setTimeout(function () { push('home'); }, 90); });
        }
      }

      // pro-expired: the subscription has lapsed, so the user is now Free
      if (id === 'pro-expired' && isDemoPro()) setDemoPro(false);
      // reflect current Pro state into this screen (e.g. unlock the hub)
      applyProState(doc, id);
    } catch (e) { /* fail soft */ }
  }

  function makeView(id) {
    var file = SCREENS[id];
    if (!file) { console.warn('[shell] unknown screen:', id); return null; }
    var view = document.createElement('div');
    view.className = 'e2e-view';
    var iframe = document.createElement('iframe');
    iframe.className = 'e2e-frame';
    iframe.setAttribute('title', id);
    iframe.addEventListener('load', function () { injectInto(iframe); bindNav(iframe, id); });
    iframe.src = file;
    view.appendChild(iframe);
    scalerEl.appendChild(view);
    return { id: id, viewEl: view, iframeEl: iframe };
  }

  function updateHud() {
    if (hudCrumb) hudCrumb.textContent = stack.map(function (v) { return v.id; }).join('  ›  ') || '—';
    if (hudBack) hudBack.disabled = stack.length <= 1;
  }

  // ── Navigation ──────────────────────────────────────────────────────────
  function push(id) {
    if (animating) return;
    var next = makeView(id);
    if (!next) return;
    var prev = stack[stack.length - 1];
    stack.push(next);
    // start offscreen-right, then slide in; prev slides slightly left + dims
    next.viewEl.classList.add('enter-right');
    // force reflow so the transition runs
    void next.viewEl.offsetWidth;
    animating = true;
    requestAnimationFrame(function () {
      next.viewEl.classList.remove('enter-right');
      if (prev) prev.viewEl.classList.add('behind');
    });
    setTimeout(function () { animating = false; updateHud(); }, 420);
    updateHud();
  }

  function pop() {
    if (animating || stack.length <= 1) return;
    var top = stack.pop();
    var prev = stack[stack.length - 1];
    animating = true;
    if (prev) prev.viewEl.classList.remove('behind');
    top.viewEl.classList.add('enter-right'); // slide back out to the right
    setTimeout(function () {
      if (top.viewEl.parentNode) top.viewEl.parentNode.removeChild(top.viewEl);
      animating = false;
      updateHud();
    }, 420);
    updateHud();
  }

  function resetTo(id) {
    while (stack.length) {
      var v = stack.pop();
      if (v.viewEl.parentNode) v.viewEl.parentNode.removeChild(v.viewEl);
    }
    animating = false;   // a reset during a slide must still land (rapid HUD taps left a blank stack)
    push(id);
  }

  function nextInPath() {
    var cur = stack.length ? stack[stack.length - 1].id : null;
    var i = HAPPY_PATH.indexOf(cur);
    if (i >= 0 && i < HAPPY_PATH.length - 1) push(HAPPY_PATH[i + 1]);
  }

  // ── Dev HUD wiring (floating, unobtrusive — not part of the app) ────────
  function wireHud() {
    hudCrumb = document.getElementById('hud-crumb');
    hudBack = document.getElementById('hud-back');
    document.getElementById('hud-next').addEventListener('click', nextInPath);
    hudBack.addEventListener('click', pop);
    document.getElementById('hud-toggle').addEventListener('click', function () {
      document.body.classList.toggle('hud-collapsed');
    });
    hudPro = document.getElementById('hud-pro');
    if (hudPro) hudPro.addEventListener('click', function () { setDemoPro(!demoPro); });
    hudTheme = document.getElementById('hud-theme');
    if (hudTheme) hudTheme.addEventListener('click', toggleTheme);
    syncThemeHud();
    var hudReset = document.getElementById('hud-reset');
    if (hudReset) hudReset.addEventListener('click', function () {
      // clear demo-only state (logged result, daily-15 flag, persisted Pro
      // settings), keep theme, go to start
      ['ca-exam-result', 'e2e_daily15', 'e2e_overcap', 'e2e_daily_goal', 'e2e_review_size', 'e2e_topup']
        .forEach(function (k) { try { localStorage.removeItem(k); } catch (_) {} });
      setDemoPro(false);
      resetTo(HAPPY_PATH[0]);
    });
    var sel = document.getElementById('hud-jump');
    Object.keys(SCREENS).forEach(function (id) {
      var o = document.createElement('option'); o.value = id; o.textContent = id; sel.appendChild(o);
    });
    sel.addEventListener('change', function () { if (sel.value) resetTo(sel.value); });
    // Lift A review: step through the post-June additions in order (founder sign-off aid).
    var LIFT_A = ['home','home-exam-paused','home-signed-out','custom-quiz','custom-quiz-topic','custom-quiz-caught-up','quiz','quiz-short-set','quiz-answered','results-milestone','review-answers'];
    // Lift B1 review (21 Oct): Progress, Analytics (switch + Wins), Daily Review (plan, Remove it, forecast)
    var LIFT_B1 = ['progress','analytics','analytics-map','analytics-wins','review','review-done'];
    var LIFT_B2 = ['exam','exam-paused','exam-end','exam-leave','exam-pbq','exam-results','exam-results-toast'];
    var LIFT_B3B = ['simlab','simlab-loading','simlab-round','simlab-reset','simlab-map','simlab-enlarge','simlab-verdict','simlab-verdict-open','exam-pbq'];
    var b3bBtn = document.getElementById('hud-liftb3b'), b3bI = -1;
    if (b3bBtn) b3bBtn.addEventListener('click', function () {
      b3bI = (b3bI + 1) % LIFT_B3B.length; resetTo(LIFT_B3B[b3bI]);
      b3bBtn.textContent = 'B3b ' + (b3bI + 1) + '/' + LIFT_B3B.length + ' \u203a';
    });
    var LIFT_B3B2 = ['simlab','simlab-exam-loading','simlab-exam-round','simlab-exam-last','simlab-exam-end','simlab-exam-jump','simlab-exam-abandon','simlab-exam-result','simlab-exam-timeup'];
    var b3b2Btn = document.getElementById('hud-liftb3b2'), b3b2I = -1;
    if (b3b2Btn) b3b2Btn.addEventListener('click', function () {
      b3b2I = (b3b2I + 1) % LIFT_B3B2.length; resetTo(LIFT_B3B2[b3b2I]);
      b3b2Btn.textContent = 'B3b2 ' + (b3b2I + 1) + '/' + LIFT_B3B2.length + ' \u203a';
    });
    var LIFT_B3C1 = ['gauntlet','gauntlet-pick','gauntlet-free','gauntlet-loading','gauntlet-run','gauntlet-answered','gauntlet-cracked','gauntlet-miss','gauntlet-miss-open','gauntlet-miss-free'];
    var b3c1Btn = document.getElementById('hud-liftb3c1'), b3c1I = -1;
    if (b3c1Btn) b3c1Btn.addEventListener('click', function () {
      b3c1I = (b3c1I + 1) % LIFT_B3C1.length; resetTo(LIFT_B3C1[b3c1I]);
      b3c1Btn.textContent = 'B3c1 ' + (b3c1I + 1) + '/' + LIFT_B3C1.length + ' \u203a';
    });
    // Stage 5a (27 Oct): the native shell's first launch and offline page
    var LIFT_5A = ['free-cert-picker','picker-lock','picker-last','offline-native'];
    var s5Btn = document.getElementById('hud-5a'), s5I = -1;
    if (s5Btn) s5Btn.addEventListener('click', function () {
      s5I = (s5I + 1) % LIFT_5A.length; resetTo(LIFT_5A[s5I]);
      s5Btn.textContent = '5a ' + (s5I + 1) + '/' + LIFT_5A.length + ' \u203a';
    });
    // Lift C (26 Oct): first run on phones
    // Stage 5c (28 Oct): Sign in with Apple and Google
    var LIFT_5C = ['native-welcome','signup-signin','signin-provider-error','st-methods','st-methods-added','st-methods-exists','st-delete-apple'];
    var s5cBtn = document.getElementById('hud-5c'), s5cI = -1;
    if (s5cBtn) s5cBtn.addEventListener('click', function () {
      s5cI = (s5cI + 1) % LIFT_5C.length; resetTo(LIFT_5C[s5cI]);
      s5cBtn.textContent = '5c ' + (s5cI + 1) + '/' + LIFT_5C.length + ' \u203a';
    });
    // Stage 5b (28 Oct): sign in by email code
    var LIFT_5B = ['native-welcome','signup-signin','signin-typo','email-code','code-wrong','code-expired','resend-wait','code-offline','lock-switched'];
    var s5bBtn = document.getElementById('hud-5b'), s5bI = -1;
    if (s5bBtn) s5bBtn.addEventListener('click', function () {
      s5bI = (s5bI + 1) % LIFT_5B.length; resetTo(LIFT_5B[s5bI]);
      s5bBtn.textContent = '5b ' + (s5bI + 1) + '/' + LIFT_5B.length + ' \u203a';
    });
    var LIFT_C = ['restore','free-cert-picker','picker-lock','picker-pro','free-home-day0','day0-pro','first-run-diag','check-score','free-capped-home','daily-limit','offline'];
    var cBtn = document.getElementById('hud-liftc'), cI = -1;
    if (cBtn) cBtn.addEventListener('click', function () {
      cI = (cI + 1) % LIFT_C.length; resetTo(LIFT_C[cI]);
      cBtn.textContent = 'C ' + (cI + 1) + '/' + LIFT_C.length + ' \u203a';
    });
    var LIFT_B4 = ['st-signed-out','st-free','st-pro','st-exam-date','st-cert-switch','st-diag','st-restore','st-clear-bank','st-delete'];
    var b4Btn = document.getElementById('hud-liftb4'), b4I = -1;
    if (b4Btn) b4Btn.addEventListener('click', function () {
      b4I = (b4I + 1) % LIFT_B4.length; resetTo(LIFT_B4[b4I]);
      b4Btn.textContent = 'B4 ' + (b4I + 1) + '/' + LIFT_B4.length + ' \u203a';
    });
    var LIFT_B3C3 = ['dl','dl-free','dl-practice','dl-graded','dl-exam','dl-exam-amber','dl-exam-end','dl-results','dl-results-open','dl-results-timeup','dl-leave'];
    var b3c3Btn = document.getElementById('hud-liftb3c3'), b3c3I = -1;
    if (b3c3Btn) b3c3Btn.addEventListener('click', function () {
      b3c3I = (b3c3I + 1) % LIFT_B3C3.length; resetTo(LIFT_B3C3[b3c3I]);
      b3c3Btn.textContent = 'B3c3 ' + (b3c3I + 1) + '/' + LIFT_B3C3.length + ' \u203a';
    });
    var LIFT_B3C2 = ['whynot','whynot-free','whynot-pick','whynot-loading','whynot-question','whynot-reason','whynot-picked','whynot-wrong','whynot-verdict','whynot-verdict-open','whynot-session','whynot-leave'];
    var b3c2Btn = document.getElementById('hud-liftb3c2'), b3c2I = -1;
    if (b3c2Btn) b3c2Btn.addEventListener('click', function () {
      b3c2I = (b3c2I + 1) % LIFT_B3C2.length; resetTo(LIFT_B3C2[b3c2I]);
      b3c2Btn.textContent = 'B3c2 ' + (b3c2I + 1) + '/' + LIFT_B3C2.length + ' \u203a';
    });
    var LIFT_B3A = ['drills','drills-free','drills-empty','drills-dl'];
    var b3Btn = document.getElementById('hud-liftb3a'), b3I = -1;
    if (b3Btn) b3Btn.addEventListener('click', function () {
      b3I = (b3I + 1) % LIFT_B3A.length; resetTo(LIFT_B3A[b3I]);
      b3Btn.textContent = 'B3a ' + (b3I + 1) + '/' + LIFT_B3A.length + ' \u203a';
    });
    var b2Btn = document.getElementById('hud-liftb2'), b2I = -1;
    if (b2Btn) b2Btn.addEventListener('click', function () {
      b2I = (b2I + 1) % LIFT_B2.length; resetTo(LIFT_B2[b2I]);
      b2Btn.textContent = 'B2 ' + (b2I + 1) + '/' + LIFT_B2.length + ' \u203a';
    });
    var b1Btn = document.getElementById('hud-liftb1'), b1I = -1;
    if (b1Btn) b1Btn.addEventListener('click', function () {
      b1I = (b1I + 1) % LIFT_B1.length; resetTo(LIFT_B1[b1I]);
      b1Btn.textContent = 'B1 ' + (b1I + 1) + '/' + LIFT_B1.length + ' \u203a';
    });
    var liftBtn = document.getElementById('hud-lifta'), liftI = -1;
    if (liftBtn) liftBtn.addEventListener('click', function () {
      liftI = (liftI + 1) % LIFT_A.length; resetTo(LIFT_A[liftI]);
      liftBtn.textContent = 'Lift A ' + (liftI + 1) + '/' + LIFT_A.length + ' \u203a';
    });
  }

  // ── Boot ────────────────────────────────────────────────────────────────
  function boot() {
    stackEl = document.getElementById('e2e-stack');
    scalerEl = document.getElementById('e2e-scaler');
    scalerEl.style.width = CANVAS_W + 'px';
    scalerEl.style.height = CANVAS_H + 'px';
    wireHud();
    fit();
    window.addEventListener('resize', fit);
    // when a screen's own in-screen toggle changes the theme, keep the shell +
    // all other stacked screens in sync (storage events fire across same-origin frames)
    window.addEventListener('storage', function (e) {
      if (e && e.key === THEME_KEY) {
        stack.forEach(function (v) { try { applyThemeToDoc(v.iframeEl.contentDocument); } catch (_) {} });
        syncThemeHud();
      }
    });
    // restore Pro demo state (?pro=1 wins, else persisted flag)
    var qpPro = /[?&]pro=1\b/.test(location.search);
    var saved = false;
    try { saved = localStorage.getItem(DEMO_KEY) === '1'; } catch (_) {}
    setDemoPro(qpPro || saved);
    // start at the happy-path entry (or #screen)
    var start = (location.hash || '').replace('#', '') || HAPPY_PATH[0];
    if (!SCREENS[start]) start = HAPPY_PATH[0];
    push(start);
  }

  // expose for console / bypass control
  window.E2E = { push: push, pop: pop, resetTo: resetTo, next: nextInPath,
                 setPro: setDemoPro, isPro: isDemoPro, SCREENS: SCREENS };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
