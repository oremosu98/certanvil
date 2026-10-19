# Launch sequence (decided 2026-10-19)

Founder decision, 19 Oct 2026: **web fixes first, then the iOS app, then Stripe, then the rest.**
The iOS app is where most customers and almost all social marketing will point, so it is
the launch surface. Web stays free + Pro-via-Stripe later.

Supersedes the ordering in `PHASE-G-PLAN-2026-06-11.md` (web G1 → wrapper → iOS). The
Phase G sub-plans in `docs/superpowers/plans/2026-06-*` stay the build references.

## Reality check (sweep of 17 Oct 2026)

- The `status: shipped` frontmatter on the Phase G plans is wrong. On `main` there is **no**
  Stripe checkout, no Apple/Google sign-in, no Capacitor wrapper, no RevenueCat.
- G1 Stripe work exists only on local branch `feat/g1-hardening-provider-subscriptions`
  (3 commits, 2026-09-01, never pushed, ~268 commits behind main).
- Apple Developer account + Small Business Program: done 2026-07-25.

## Phase 1 · Web fixes (now)

1. Founder's list of minor additions (to be collected at the start of the phase).
2. Bug #498 (`goSetup()` RangeError, high) plus #497, #495.
3. Housekeeping: close the 17 stale "Deploy verification FAIL" issues and stale Dependabot PRs.
4. Mindmatrix cleanup of the CertAnvil build lane (overdue Next Actions, duplicate AI-901
   projects, one Next Action per project).

## Phase 2 · iOS app (the launch)

Before real users touch the AI proxy (same proxy for iOS):
- **Security C1**: the free daily quota only runs when the client sends `_metered: true`
  (`landing/api/ai/generate.js`). Enforce it server-side. S.
- **Caps**: Pro 150/day soft cap (decision 6); raise the 500/day global kill-switch sized to
  the $20 Anthropic test budget. Founder raises the Anthropic workspace cap. S–M.

Build (references in `docs/superpowers/plans/`):
- **Capacitor wrapper** + at least one native plugin (Guideline 4.2). `2026-06-27-capacitor-ios-prewrap-and-wrapper.md`. L.
- **G2 Sign in with Apple + Google** + account-merge support tool. `2026-06-26-g2-apple-google-signin.md`,
  `2026-06-26-account-merge-support-tool.md`. M.
- **G3 RevenueCat in-app purchase**: purchase coordinator (no web pricing links in-app, 3.1.1),
  Restore Purchases, App Store Server Notifications → entitlements. L.
- **Analytics on**: PostHog `LAUNCH_KEY` (currently null, dry-run) + signup → quiz → pay funnel.
- **Privacy policy + terms refresh** (add PostHog, RevenueCat, current cert list) — needed for
  the App Store privacy label. Founder approves.
- **G4 store launch**: listing copy + screenshots, privacy nutrition label, simulator E2E,
  real-iPhone smoke (`IOS_TESTING.md`), TestFlight, submission.
- **Go live**: `app_config.onboarding_enabled = true` (manual SQL, `docs/mobile/APP_STORE_DISTRIBUTION.md` §GO-LIVE),
  then `claude plugin enable marketing-skills` and delete the 7 copied skills in `~/.claude/skills/`.

Founder-only for Phase 2: Apple Services ID + Sign in with Apple key; Google Cloud OAuth
client; RevenueCat account + keys; App Store Connect subscription products ($9.99/mo, $89/yr);
PostHog project key; Resend DNS/domain verification; Supabase Pro + PITR + branching
(before any gated merge); Anthropic cap raise; approve listing + legal copy.

## Phase 3 · Stripe (web Pro)

- Rebase `feat/g1-hardening-provider-subscriptions` onto main, test on a Vercel preview in
  Stripe test mode, gated-lane merge (PR). Shares the `provider_subscriptions` schema with RevenueCat.
- G1 follow-ups: server-side already-Pro guard, checkout→webhook race, refund/chargeback revocation.
- Pricing page: swap the notify-me modal for checkout.
- Founder: Stripe account rebrand, 2 price IDs, live/test keys, webhook secret.

## Phase 4 · Everything else

- Per-user AI cost measurement (#135/#137), readiness tuning (#139, plus the real-score check:
  predicted ~848 vs actual 800 on 16 Oct).
- Deepen non-Sec+ packs (~200–320 exemplars each vs Sec+ 1,471); AI-901 Foundry/agents content;
  SC-900 check against its 21 Oct 2026 version; watch for SY0-801.
- Security audit leftovers (CSP `unsafe-inline`, DOMPurify), #138 app.js split, mobile-safari e2e.

## Open decisions

- Which certs are marketed at launch (recommendation: all eight live, Security+ as the headline).
- Signed-out bring-your-own-key path: keep or require sign-in (recommendation: require sign-in).
