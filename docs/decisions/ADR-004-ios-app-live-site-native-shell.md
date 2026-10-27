---
up: "[[Decisions MOC]]"
type: adr
status: accepted
date: 2026-10-19
tags: [adr, mobile, ios]
---
# ADR-004 · The iOS app is the live site inside a native shell

## Decision (founder, 19 Oct 2026)

The CertAnvil iOS app loads the **live cert sites** (`https://secplus.certanvil.com` etc.)
inside a Capacitor native shell. It does **not** bundle the web files into the app.

Supersedes the "A2 bundled-served-as-certanvil.com" ship target in
`docs/superpowers/plans/2026-06-27-capacitor-ios-prewrap-and-wrapper.md`. That plan's
"A1 remote-load" smoke option becomes the ship target.

## Why

- **Per-cert storage.** On the web each cert lives on its own subdomain, so each has its own
  localStorage: history, streak, wrong bank, spaced repetition, milestones. A bundled app
  runs on one origin, so every cert would share one storage space. Making that safe means
  splitting every storage key by cert, including the gated `cloud-store.js`: a large,
  risky rework. Milestones are per-cert by standing rule.
- **The cert switcher navigates between subdomains**, so a bundled app would leave its
  bundle for the live site on the first switch anyway.
- **Sign-in, sync and the API work unchanged**, because the origin is the real one.
- **Every web ship updates the app instantly**, without an App Store review.

## Costs and how they are handled

- **Needs a connection.** Accepted; the product is AI-generated questions, which need the
  network anyway.
- **Apple Guideline 4.2 ("not just a website").** Met with real native features: in-app
  purchase (RevenueCat, G-3), Sign in with Apple (G-2), haptics, the native share sheet,
  status bar and splash, and streak-reminder notifications.
- **Guideline 3.1.1 (no web purchase links in the app).** The web app hides its Go-Pro
  links when it runs inside the native shell until G-3 replaces them with in-app purchase.

## Rejected

- **Bundled app on one origin** (June plan, A2): shared cross-cert storage, every change
  needs a store build, weeks more work.

## Related
[[APP_STORE_DISTRIBUTION]] · [[CAPACITOR_NAV_AUDIT]] · `docs/planning/2026-10-19-launch-sequence.md`
