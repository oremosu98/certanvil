---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-21
tags: [spec, mobile, ios, launch, lift-b]
---
# Lift B1: Progress, Analytics and Daily Review, made real (approved 21 Oct 2026)

Lift B (stage 3 of [[2026-10-19-ios-launch-june-design]]) is split into four sub-lifts. Each one is
designed into the E2E, approved, planned, built and shipped on its own. The founder chose this order on
21 Oct, quick wins first:

1. **B1** Progress, Analytics and Daily Review
2. **B2** Exam and exam results
3. **B3** Drills and Sim Lab
4. **B4** Settings

The parent spec's Fidelity rule applies in full. Phone only (`max-width: 899px`); desktop is unchanged.

## What the E2E has, what the app has

| Screen | E2E (`feat/cert-ios-e2e`) | Real app at phone width | Gap |
|---|---|---|---|
| Progress | `cert-ios-progress.html`: swipeable pages behind pills | One long scroll with domain accordions | Layout |
| Analytics | `cert-ios-analytics.html`: swipeable pages behind pills | One long scroll; the phone hides the section pills | Layout, plus Hands-on milestones |
| Daily Review | `cert-ios-review.html`: card, then a "Review done" summary | "SR queue." header, mono meta, Next not docked | Styling, plus three real-only items |

Progress pills: Overview, one page per domain, Insights. Analytics pills: Readiness, Map (was Sky), Trends,
Domains, Activity, Wins.

## Founder decisions (21 Oct 2026)

- **Layout.** Progress and Analytics use the E2E's swipeable pages behind section pills. Tapping a pill or
  swiping moves between pages.
- **Hands-on milestones** (Sim Lab, Decision Lab, Why-Not, Gauntlet) go on the Analytics **Wins** page, as a
  "Hands-on" group under the badges. Each drill gets one row with its three milestones and a progress bar.
- **Tab bar** (ruling, endorsed with the design): Home / Drills / Progress / Account, as the later June Home
  and Drills mockups and the real app have it. The older Progress, Analytics and Settings mockups, which
  draw Home / Progress / Analytics / Settings, are corrected in the E2E first.
- **Progress ⇄ Analytics switch.** The app's existing switch is drawn into the E2E as a small segmented
  control under the cert header, on both screens.

## The screens

### Progress

- **Overview page**
  - "Drill this next" card: weakest studied topic, mastery and Start drill.
  - "Where you stand": covered % ring, average mastery, topics seen out of the total, and the Weak /
    Untouched / Strong tiles.
  - Filter chips (All / Weak only / Untouched / Strong) and the "Worst first" sort.
- **One page per domain**, with pill names taken from the active cert's own domains.
  - Header: domain name, % of exam, mastery, "N of M studied · K untouched".
  - The domain's topic rows, with the smoothed mastery bars (a v8.x addition, kept). Tapping a row drills
    that topic, using the live behaviour.
  - The filter chips and sort apply here.
- **Insights page:** your weakest topics, strong and mastered, untouched (N never studied), recently studied.

### Analytics

- **Readiness:** scaled score card with the tier badge, the pass line, "forecast on this pace", days to
  exam, and four tiles (sessions, questions, accuracy, study days) with sparklines.
- **Map** (replaces the Sky constellation; founder, 21 Oct, via the feature lane):
  - **Why it changed.** The constellation was too small to read on a phone. Its fixed navy card fitted
    neither theme. It also broke three BRAND.md rules: no gradient chrome, no hardcoded hex, and no
    descriptive-only Analytics cards.
  - **Card header:** "Your topic map", with the line "N of M studied · K mastered".
  - **Action line:** "Your 3 weakest topics: A, B, C", with a **Drill them** button. The button starts a
    quiz on exactly the topics it names, through the same path as Readiness's weakest-topics quiz.
  - **Domain rows.** One row per domain: the domain name, "X% of exam" on the right, then a wrapping grid of
    topic tiles: a 32px square inside a 40px tap target (44pt on the device at the 1.10 zoom). Domains come
    from the cert.
  - **Tile colours** come from theme tokens:
    - mastered: `--pass`
    - proficient: `--pass` mixed 50% into `--surface` (`--accent` read too close to developing amber in dark)
    - developing: `--warn`
    - weak (studied, under 55%): a `--miss` tint
    - untouched: an outlined empty square
  - **Tapping a tile** rings it and opens a small sheet: the topic, its domain, mastery %, questions answered,
    last seen, and **Drill this topic** ("Start this topic" for a topic never studied). The sheet rises its
    own height in 360ms and drops in 200ms on `--ease`, with the scrim fading on the same clocks; reduced
    motion fades only. Opening focuses the button without scrolling the screen; closing returns focus to the tile.
  - **Legend** at the bottom of the card.
  - **VoiceOver** reads each tile as "<topic>, <status>, <mastery>%".
  - Data comes from `_computeConstellationData`. Desktop keeps the constellation.
- **Trends:** the trend chart (Week / Month / All), "Where you hold up" and "Pressure check".
- **Domains:** worst first, plus the top 3 patterns.
- **Activity:** "Keep the chain" streak and the 26-week heatmap.
- **Wins:** badges, plus the new **Hands-on** group: Sim Lab, Decision Lab, Why-Not and Gauntlet, each with
  three milestones and an earned / in-progress / locked state.
- **Every domain in Mastery** (a v8.x addition, kept).

### Founder refinements (21 Oct, after the first Simulator walk)

- **"Where you stand", cleaner.** The coverage ring holds only its number: 72px, 5px stroke. "Covered",
  "Avg mastery" and "Topics seen" each sit as a value over a label, on one shared baseline.
- **Topic filters on one toolbar line.** Underlined text tabs (All / Weak / Untouched / Strong) and a quiet
  "Worst first" sort button, with a hairline beneath. Motion goes through `transitions-polish` (which the
  founder asked for), remapped onto BRAND §6: the underline moves in 220ms and the sort button fades on
  press over 150ms.

### Daily Review

- **Header:** "Daily Review" and today's plan from `getSrTodayPlan()` (e.g. "6 of 18 today").
- **Confidence step (founder, 21 Oct):** after a correct answer the docked button splits into **Guessed** and **Knew it** (the real app's confident / unsure grading, which sets the next interval). A wrong answer keeps one **Next card**. Drawn into the E2E first and approved in the Simulator.
- **The card:** one question per card, with the E2E options. The **"Something wrong with this question?
  Remove it"** link sits under the card (real-only, kept). The Answer / Next button is docked.
- **Review done:**
  - The E2E result tiles, review streak and "Next review".
  - A **Next 7 days** forecast with exam day marked (real-only, kept; today it appears only on the complete
    screen).
  - "Back to home" and "Retry the cards you missed".

## Architecture

- **Progress and Analytics** get phone-only renderers, because their structure differs from desktop.
  - Files: `features/ios-progress.js` and `features/ios-analytics.js`.
  - Each follows the Lift A pattern: a pure `_ios…Model` and `_ios…Html` (UAT vm-testable via `_fnBody`),
    plus a render function, rendered into `#ios-progress` and `#ios-analytics` (`ios-only iq-screen`).
  - Data comes from the same functions the desktop pages use, so there is no new data layer.
  - The swipe uses CSS scroll-snap, as the E2E does, and the pills follow the active page.
- **Daily Review** is restyled in `lift-ios.css`, plus small markup hooks in `features/sr-review.js`: the
  plan line, the docked button and the forecast on the complete screen.
- CSS is ported from the mockups with the porter, using the `ip-` (progress), `in-` (analytics) and `iv-`
  (review) prefixes.
- **No new lines in `app.js`** (it is at its ratchet).

## Motion and copy

- **BRAND.md §6 tokens win.** Page swipes use native scroll-snap. Pills move instantly, with the pressed
  state taking an accent fill.
- Reduced motion turns movement into fades.
- The new E2E parts get the 5-stage visual pass before they are lifted.

## Acceptance

- Side by side in the Simulator at 402pt against the E2E: both themes, Free and Pro, an empty profile and
  one with history.
- UAT: the models (pages per cert, filters, milestone states, plan line, forecast with exam day).
- Playwright at 390 and 402:
  - pills and swipe move between pages
  - a topic row drills the topic
  - the Progress ⇄ Analytics switch works
  - Remove it still works
  - desktop is unchanged

## Rejected approaches

- **Long scroll with pill shortcuts.** Rejected because it isn't the E2E, and Progress stays about five
  screens long.
- **A separate "Drills" page in Analytics for hands-on milestones.** Rejected because it splits
  achievements in two and adds a seventh page.
- **One big Lift B release.** Rejected because it means a very large single ship and a long wait before
  anything lands.
- **Exam first.** Rejected because the first ship would be the slowest. Exam is B2.

## Related
[[2026-10-19-ios-launch-june-design]] · [[2026-10-20-ios-custom-quiz-design]] · [[Mobile MOC]] · [[BRAND]]
