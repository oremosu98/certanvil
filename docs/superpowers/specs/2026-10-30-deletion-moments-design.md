---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-30
tags: [spec, mobile]
---
# Deletion moments: an honest goodbye, a proper welcome back, and the leftovers fix

From the founder's 30 Oct list ([[2026-10-30-ios-flow-notes]] items 3 and 6), plus PR #532. Approved
on 30 Oct and folded into the persona bundle, which ships on the gated lane.

## 1. Goodbye after deleting (iOS app)
After the delete is confirmed: "Scheduling your deletion…", then a full screen:
- A clock mark, then "Goodbye for now".
- "Your account will be deleted on Fri 6 Nov. Thanks for studying with CertAnvil."
- A tinted box: "Changed your mind? Sign back in before 6 Nov and everything's kept: your progress,
  streak and readiness."
- If Pro: "It's billed by Apple. Cancel it in iPhone Settings so you're not charged again."
- **Done** returns to the start. **Sign back in** opens sign-in.

The date is the scheduled deletion date, 7 days after confirming. This replaces the June drawing's
"Your account and data are gone", which was never true with the grace window.

## 2. Welcome back after cancelling a deletion by signing in (iOS app)
This replaces today's small line with a full moment:
- A return-arrow mark, then "Welcome back, Simi."
- "We've cancelled your account deletion. Everything is right where you left it."
- Three tiles prove it: readiness, answers and best streak.
- **Back to Network+** opens Home.

It shows once, when the cancellation notice is first seen. The existing notice logic and
`clear_deletion_notice` decide when.

## 3. PR #532, the deletion leftovers
- An in-flight sync could wipe a fresh deletion mark (cloud-store compare-and-set).
- Offline sign-out didn't really sign out.
- The branch conflicts with main, so it is rebased into the bundle; its tests come with it.
- Offline copy, waiting on the founder's OK. App: "Your account will be deleted in 7 days. We couldn't
  sign you out on this device, so sign out from Settings when you're back online." The website version
  ends "sign out here when you're back online."

## After the bundle ships
The founder runs the Apple delete retest on his phone (delete, then sign back in). We then check
`client_errors` for `apple-revoke: ok`.

## Rejected (founder, 30 Oct). Do not re-propose.
- **Carrying progress across certs** (Net+ shared topics seeding Sec+), in both its lighter and full
  versions.
- **A results-screen main button that follows the day** (rejected earlier too; Redo stays primary).
- **Showing answer speed and guessing.**

## Related
[[2026-10-30-ios-flow-notes]] · [[2026-10-30-persona-adhd-gaps]] · [[2026-10-30-persona-cert-stacker-gaps]] · [[Mobile MOC]]
