# Skip on day 0 (phones)

Item 5 of [[2026-10-30-ios-flow-notes]]. Founder, 30 Oct: "not every user needs to do a readiness check. Not every
user wants to do one. They need to have the option of skipping entirely and landing right into the cert of their
choice." Ships in the same release as the readiness-tier fix (`05ad230b`).

## The problem

After locking in a cert, phones open day-0 Home ("Let's place your readiness") as a takeover: `html.ifr-day0` hides
the tab bar. Its only exits are taking the 30-second check or "Start today's 15", which launches a quiz at once.
There is no "not now", and day 0 comes back on every launch until one of the two happens.

## The design

1. **Skip, top right of day-0 Home** (free and Pro). A text button in the iOS nav-bar spot, copy `Skip`. Tapping it
   calls the existing `IFR.recordSkip()` (`ONB_SKIPS`, cloud-synced) and re-renders Home. `_ifrState` already treats
   a skip as "not day 0", so the person lands on the cert's normal Home with the tab bar back, readiness Locked.
2. **The check stays one tap away.** On normal Home, the locked Readiness card gets a text link under its insight:
   `Or take the 30-second check ›`, which calls `IFR.startCheck()`. Shown only while there is no score **and** the
   person is signed in: signed out, the check does nothing today (see Out of scope), so the link would be a dead end.

Drawing: june-e2e, HUD `Skip ›` (free-home-day0 → day0-pro → home-new), routes `.d0-skip → home-new` and
`.rd-check → first-run-diag`.

## Where it lands in code

- `features/ios-firstrun.js` `_ifrDay0Html`: a `.ifr-d0-top` row with `<button class="ifr-skip" data-act="skip">`
  before the greeting; `IFR.renderHome`'s `ACT` gains `skip: recordSkip + renderIosHome()`.
- `features/ios-home.js` `_iosHomeHtml` locked branch: `<button class="ih-rd-check" data-act="check">` when
  `m.signedIn`; the mount's `ACT` gains `check: IFR.startCheck`.
- `lift-ios.css`: the two text buttons. 44px tap height, accent text (`--accent-bright` dark, `--accent-deep`
  light), pressed state `opacity` only. No entrance motion: Skip is chrome, the link rides the card's existing reveal.

## Cross-platform

Day 0 and the lift Home are phone-only (≤899px), so: iOS Capacitor and mobile web get both changes; Safari/WebKit
desktop and desktop browsers are unchanged. Skip writes `ONB_SKIPS`, which already syncs, so skipping on the phone
also holds on the web.

## Tests (UAT)

- `_ifrDay0Html` (free and Pro) contains `data-act="skip"` with text `Skip`, before the greeting.
- `_iosHomeHtml` locked + signed in contains `data-act="check"`; locked + signed out does not; scored does not.
- Both `ACT` maps bind the new actions (source check, the 480/481 style).

## Out of scope (noted, not fixed here)

- Signed out, "Take the 30-second check" does nothing and "Start today's 15" opens the old Custom page without a
  tab bar. Day 0 should probably not show signed out at all; that belongs to the first-run redesign (items 1, 2, 4).
- What a brand-new person sees first. The first-run redesign may move or replace this Skip.

## Rejected approaches

- **Show the tab bar on day 0 instead of a Skip**: gives an exit but never says "you can skip this", and day 0
  would still come back on every launch.
- **Wait for the first-run redesign**: the right home for the bigger question, but the trap should not wait a day of
  design work; this Skip does not block the redesign.

## Related
[[2026-10-30-ios-flow-notes]] · [[2026-10-19-ios-launch-june-design]]
