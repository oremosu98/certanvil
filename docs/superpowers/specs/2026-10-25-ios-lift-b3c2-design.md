---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: comptia
updated: 2026-10-25
tags: [spec, mobile, ios, launch, lift-b]
---
# Lift B3c2: Why-Not on phones (approved 25 Oct 2026)

B3c2 is the second of the three B3c releases ([[2026-10-23-ios-lift-b3c1-design]] split B3c one release per
activity: B3c1 Reword Gauntlet, B3c2 Why-Not, B3c3 Decision Lab with its Exam mode). B3c2 gives Why-Not's
entry, reason step and verdicts the June look on phones, and runs its question on the Lift A quiz.

Phone only (max-width 899px); desktop unchanged. `app.js` stays at its ratchet. No change to generation,
the quality gate, scoring, history, the Pro gate or milestones.

## What the app does today at 402pt (25 Oct)

- **Entry** (`#page-whynot`, `renderWhyNotEntry`): the old web top bar above a centred desktop card: back,
  "Why-Not", the Pro pill (free users), the mark, "Prove the wrong answers *wrong*", "The right answer is one
  point. Why the others lose is the other three.", the **Today's target** card (topic, why line, "Pick a
  different topic" that expands an inline list), a "Round 1 · Round 2 · Round 3" preview, Start Why-Not.
  Tab bar visible. A free user's Start opens `_gateProOnly`'s gate ("Why-Not is a Pro feature").
- **Run**: `showPage('loading')` with "Building the case files…" (Lift A loader, Cancel), then one question
  per round on the Lift A quiz (`whyNotMode`, chip "Why-Not · topic · Round N of 3", pills hidden).
- **Reason step** (`#page-whynot-round`, `renderWhyNotPicker`): web top bar and tab bar; the strip, the
  answered line, a card for one wrong option ("Why does it lose?", three shuffled reasons: one true, two
  fake), the note after the pick, a 4-segment bar, "Next: why does C lose? →" / "See the round verdict →",
  Leave session (no confirm).
- **Round verdict** (`#page-whynot-verdict`, `renderWhyNotVerdict`): "You earned N of 4", the callout, four
  static rows (the answer; each wrong option with its true reason), Next round → / Session verdict →, Leave
  session.
- **Session verdict** (`whyNotFinishSession`): "Session: N of 12", "topic · 3 questions answered toward
  today's goal", three round rows (N of 4), Next target →, Back to Drills / Back to Home. Milestone toasts.

## Founder decisions (25 Oct 2026)

1. **Reason step = its own screen, one wrong option at a time** (today's flow in the June look).
2. **Round-verdict rows open**, like the B3c1 Gauntlet result rows.
3. **Leaving mid-session asks first** in the in-app sheet.
4. Founder approved the design as presented ("yeah looks good with me").

## The screens

### Entry (`#page-whynot` on phones)
No web top bar; the tab bar stays (as the B3c1 Gauntlet entry).
- ‹ back (to Drills or Home, as today's `_wnReturn`), title "Why-Not", the Pro pill for free users.
- Headline "Prove the wrong answers *wrong*" and lede "The right answer is one point. Why the others lose is
  the other three." (today's copy).
- **Today's target** card: eyebrow "Today's target", the topic, today's why line ("Your pick" / "Your weakest
  topic right now" / "A good place to start"), and **Pick a different topic**. That opens the B3c1 topic
  sheet (`iosGauntlet.pickTopic`, `#igt-topics`), current topic ticked; a tap closes it and updates the card
  (today's `whyNotChooseTopic`).
- A three-round strip: Round 1 · Round 2 · Round 3 (in the place of the Gauntlet's five rungs).
- **Start Why-Not** docked above the tab bar (drives today's `whyNotStart`; a free user's tap opens today's
  Pro gate).

### Run (the Lift A quiz)
- Loader: today's Lift A loader, "Building the case files…", Cancel.
- The round's question on `#page-quiz` with `whyNotMode`: chip "Why-Not · topic · Round N of 3", no question
  pills, today's answer card. Answering moves on to the reason step as today (`_wnFinishQuestion`).

### Reason step (`#page-whynot-round` on phones)
No web top bar, no tab bar. One wrong option at a time.
- ‹ (asks before leaving, see Leaving) and the strip "Why-Not · topic · Round N of 3".
- The answered line: ✓ "You answered **X**. Right. Now earn the other three points." or ✗ "The answer was
  **X**. The reasons below still score." (today's copy).
- The card: the option's letter and text, "Why does it lose?", three reason buttons. After a pick the true
  reason turns green, a wrong pick red, the buttons lock, and the note shows ("Right reason" / "Wrong reason"
  and today's note).
- The 4-point bar: answer, then each wrong option (done / missed / live).
- Docked: "Next: why does C lose?" after a pick, "See the round verdict" on the last option (hidden until a
  reason is picked). No arrow glyphs in the phone labels.

### Round verdict (`#page-whynot-verdict` on phones)
No web top bar, no tab bar.
- Kicker "Why-Not · topic · Round N of 3", "You earned **N of 4**", today's callout ("Clean sweep. Answer and
  all three reasons." etc.).
- Four rows, each with a Right / Wrong pill and a chevron, closed by default:
  - **The answer: X**: opens to "Your first pick" (the option picked on the quiz) and the explanation.
  - **Each wrong option**: opens to "Your reason" (only when it was wrong), "True reason" and the note.
- Docked: **Next round** (rounds 1–2) or **Session verdict** (round 3), then Leave session.

### Session verdict (`#page-whynot-verdict` on phones)
No web top bar, no tab bar.
- Kicker "Why-Not · topic", "Session: **N of 12**", "3 questions answered toward today's goal".
- Three round rows: "Round N" and "N of 4", Right pill at 4 of 4, otherwise a neutral pill.
- Docked: **Next target** (primary), then "Back to Drills" / "Back to Home".
- Milestone toasts drop from the top as on quiz results (Lift A `.mtoast`), never over the score.

### Leaving
Leave session and ‹ on the reason step and the round verdict open the in-app sheet (`iosSheet`, as Sim Lab
Exam's Abandon): "Leave Why-Not?", "Your rounds so far won't count.", **Leave** (runs today's `whyNotExit`) ·
Keep going. From the session verdict, Back to Drills / Home leaves straight away (the session is saved).
Desktop keeps leaving without asking.

## Architecture

- **New phone-only module `features/ios-whynot.js`** (eager `defer`, B3 pattern), pure model/view pairs plus
  small hosts:
  - `_iosWnEntryModel(s) / _iosWnEntryHtml(m)`: s = {topic, why, back, free}.
  - `_iosWnReasonModel(s) / _iosWnReasonHtml(m)`: s = {topic, round, rounds, answerRight, answerText,
    letter, optionText, reasons[3], segs[4]}.
  - `_iosWnVerdictModel(s) / _iosWnVerdictHtml(m)`: s = {topic, round, rounds, points, callout, answer:
    {text, right, firstPick, explanation}, wrong: [{letter, text, right, picked, reason, note}]}.
  - `_iosWnSessionModel(s) / _iosWnSessionHtml(m)`: s = {topic, points, rounds: [{points}], back}.
  - Every scenario-derived string is escaped; the callout's `<b>` is built from escaped option names.
  - `iosWhyNot.renderEntry / renderReasons / renderVerdict / renderSession`, and `confirmLeave() ->
    Promise<boolean>` through `iosSheet`.
- **Hooks in `features/flagship-drills.js`**, phone only: `renderWhyNotEntry`, `renderWhyNotPicker`,
  `whyNotPickReason` (repaints through the phone view), `renderWhyNotVerdict` and `whyNotFinishSession`
  hand phones to `iosWhyNot`; `whyNotToggleTopicList` opens the B3c1 sheet on phones. The round records
  the reason text picked per wrong option and the quiz's first pick (the open rows need them); scoring
  reads the same booleans as today.
- **CSS:** a `B3c2 · WHY-NOT` section in `lift-ios.css`, prefix `iwn-`. Reveals rest visible and animate
  from hidden (CLAUDE.md gotcha, UAT 481). Plain top padding (no `env(safe-area-inset-top)`).
- **lift-shell:** `HIDE_ON['whynot-round']` and `HIDE_ON['whynot-verdict']` hide the tab bar; the app top
  bar hides on all three pages.
- No inline `on*=`; delegation or `addEventListener`.

## Process

1. Draw into the E2E first (`mockups/cert-ios-whynot.html`, states `entry`, `entry-free`, `entry-pick`,
   `loading`, `question`, `reason`, `reason-picked`, `reason-wrong`, `verdict`, `verdict-open`,
   `session`, `leave`; HUD **B3c2 ›**). 5-stage visual pass. Founder taps it in the Simulator and approves.
2. Plan, build (native), side-by-sides, final review, ship on "ship it".

## Acceptance

- At 390 and 402: Drills → Why-Not entry → pick a different topic in the sheet → Start → three rounds
  (question, three reasons each) → round verdicts → session verdict, with no web top bar, the tab bar only on
  the entry, and no horizontal scroll.
- Each round-verdict row opens to the picked and true reasons and the note (answer row: first pick and
  explanation), text escaped.
- Leave session and ‹ mid-session ask in the sheet; Keep going stays put; Leave lands where today's exit
  lands. The session verdict's Back leaves without asking.
- Next round, Session verdict, Next target and Back behave as today; points and history match today's; a
  free user's Start still opens today's Pro gate.
- Desktop Why-Not looks and behaves as today.

## Rejected approaches

- **All three wrong options on one screen:** a long scroll, and the note after each pick gets lost.
- **Reason step inside the quiz answer card:** crowds the answer card approved for every quiz.
- **Static round-verdict rows:** you couldn't see the reason you picked or the note again.
- **Leaving without asking:** one stray tap throws away up to three rounds of paid generation.
- **A second topic sheet for Why-Not:** the B3c1 sheet already takes any topic list.

## Related
[[2026-10-23-ios-lift-b3c1-design]] · [[2026-10-22-ios-lift-b3b2-design]] · [[2026-10-19-ios-launch-june-design]] · [[Mobile MOC]]
