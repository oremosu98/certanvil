---
up: "[[Decisions MOC]]"
type: decision
status: active
cert: all
updated: 2026-10-30
tags: [decision, mobile]
---
# The iPhone app asks for an account after the exam pick, and never lets you onto Home signed out

## Context
Before F3 a fresh install went welcome → picker → day-0 Home signed out. Questions come from the server
proxy, which needs an account, so day-0's buttons did nothing. Sign-in was a small link.

## Decision
Welcome → Get started → exam picker → lock-in sheets → "Create your account to start" → day-0 ("You're in").
`caNative.requireAccount` (native-shell.js) is the single gate: it opens the account screen on any launch
with an exam chosen, and after Account → Sign out, only when the person is settled signed out (flag false,
no stored `sb-certanvil-auth` session, not offline). Day 0 only shows signed in. The welcome stays first
(founder reversed "open on the picker" after seeing the build).

## Why
Asking after the pick feels like the next step, not a gate; and nothing in the app works signed out. The
offline/stored-session carve-out keeps a signed-in person whose session check failed from being thrown out.

## Affects
`native-shell.js` (`requireAccount`, `settledSignedOut`, `storedSession`), `features/ios-signin.js`
(`from: firstrun | signedout | picker | welcome`), `features/ios-firstrun.js` (`_ifrState` day0 gate, picker
`first`), `features/ios-settings.js` (`ON.signout`). [[2026-10-30-ios-first-run-f3-design]]

## Rejected alternatives
- Account before picking the exam: a sign-up wall before any choice.
- No account up front: needs questions without an account, which don't exist.
- Open straight on the picker (no welcome): built, then reversed by the founder, who wants an intro.
- Trusting the auth flag alone: a failed `getSession` would send a signed-in, offline person to the account screen.

## Related
[[2026-10-30-ios-first-run-f3-design]] · [[2026-10-27-ios-stage5a-native-shell-design]] · [[Decisions MOC]]
