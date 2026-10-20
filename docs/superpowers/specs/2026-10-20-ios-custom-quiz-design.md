---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-20
tags: [spec, mobile, ios, launch, custom-quiz, lift-a]
---
# iOS Custom quiz: the E2E screen, made real (approved 20 Oct 2026)

Part of Lift A. It ships in the same release (founder, 20 Oct: "ship them together"). The parent spec is
[[2026-10-19-ios-launch-june-design]], and its Fidelity rule applies in full.

## Why

The founder walked Lift A on the Vercel preview and approved it ("i love it"). The one surface that
broke the look was the custom quiz. On a phone it is still the desktop `<details>` panel
(`#custom-quiz-section`), squeezed above Home.

The June E2E already designs this screen, as `mockups/cert-ios-custom-quiz.html` on `feat/cert-ios-e2e`
(commit `4d421ee3`). The launch spec never listed it, so it fell outside Lifts A, B and C. This spec
closes that gap.

## Founder decisions (20 Oct 2026)

- **Lift the E2E screen.** Do not explore new directions, and do not restyle the panel in place.
- **Catch-up goes in as a bento 2 + 1.** Smart and Mixed stay side by side, and Catch-up becomes a
  full-width card underneath.
- **Counts are 5 / 10 / 15 / 20** (the live app's set), not the E2E's 10 / 20 / 30 / 45. 15 fits the
  Free day exactly.
- **Ship with Lift A**, as one release.

## Order of work

1. Add Catch-up and the new counts to the E2E mockup first, on `feat/cert-ios-e2e`. Run the 5-stage
   visual pass, add a HUD entry, and let the founder tap it in the Simulator.
2. Only then build it into the real app, on `feat/lift-a`.

## The screen (phone, `max-width: 899px`)

It is a full-screen page in the shared `.iq-screen` shell, the same as the quiz.

- **Top bar:** ✕ (closes back to Home), title "Custom quiz", sub "Topic, difficulty and count", and the
  theme switch.
- **Cert row:** the mark plus the name and exam code, from `CERT_PACK`.
- **Topic:** one chip per domain (`1.0 Networking Concepts` …). A tap selects every topic in that
  domain, the same as `prefillDomainTopics(key)`.
- **How to choose questions:** a bento 2 + 1.
  - Smart: "Targets the topics you keep getting wrong."
  - Mixed: "A random spread across every topic."
  - Catch-up (wide): title "Catch-up", sub "Topics you haven't seen lately". Under a hairline it shows a
    live line, "**N** not practised in a week", where N counts topics last seen 7 or more days ago.
  - With history but N = 0, the line reads "All practised this week." With no history, the line is hidden.
  - Each card has an icon tile, a title and a sub. When selected it gets an accent border and a tick.
    Colour is never the only signal.
- **Or build it by topic:** one accordion card per domain, showing "N topics", the "X% of exam" badge
  and a chevron. Opened, it shows topic chips you can pick several of. A closed card shows how many of
  its topics are picked ("5 topics · 2 picked", or "all picked").
- **Difficulty:** a segmented control, Foundational / Exam level / Hard / Mixed. Hard is kept (founder, 20 Oct,
  added to the E2E as `c75e41e8`). The segments size to their labels and never wrap.
- **Count:** the count echoed as a large number ("10 questions"), then a segmented control, 5 / 10 /
  15 / 20.
- **Docked footer:** a sticky bar, as on the quiz. The primary button reads "Start quiz" with the count
  ("10 Q"). Under it, one line describes the session:
  - Mixed: "Mixed spread across all topics, mixed difficulty."
  - Picked topics: "3 topics from Concepts and Security, exam level." With more than 2 domains, it reads
    "from 3 domains". The line is always one line, so the docked footer never changes height.
- **Domain chips behave like the live pills.** A tap runs `prefillDomainTopics`: it picks that domain's topics
  and clears topics in other domains. A chip shows as pressed when all of its domain's topics are picked.
- **Accordions start open** for every domain that has picked topics, and the first one scrolls into view. That
  also covers "Drill this topic", with no special case needed.
- **The screen closes** on ✕ and on Start, when `#page-setup` stops being the active page, and when the viewport
  grows past 899px.
- **Picking rules:** the same as today. Picking a mode clears picked topics, and picking a topic clears
  the mode. If nothing is picked, Start falls back to the live app's default.

## Architecture

- **One entry point.** Every path into the custom quiz sets `#custom-quiz-section.open = true` and fires
  its `toggle` event. That includes `_jumpToCustomQuiz`, the Home buttons and the drill-a-topic links.
  On a phone, that event opens the phone screen instead, and the desktop modal stays hidden. Desktop
  does not change.
- **Entry paths that carry context**:
  - `features/progress.js` "drill this topic" opens the screen with that topic picked and its
    domain accordion open, scrolled into view.
  - `showSetupError()` (app.js) opens the custom quiz to reveal `#setup-err`. The phone screen shows
    that error card above the footer.
  - The existing `toggle` handler portals the `<details>` to `<body>` and locks page scroll. On a phone,
    the details closes straight away once the phone screen is up, which also runs the restore branch.
    Scroll must never stay locked.
- **No second state.** The phone screen is a view over the existing controls. These stay the single
  source of truth:
  - `#topic-group .chip.on` (topics and mode)
  - `#diff-group`
  - `#count-group`
- **Real logic.** Taps call the existing handlers or toggle `.on` the way those handlers do. "Start
  quiz" runs the existing generate path, so generation, Smart, Catch-up's least-recently-seen picks,
  history and caching are unchanged.
- **Phone count set.** `#count-group` already offers 5 / 10 / 15 / 20, so the phone segmented control
  maps one-to-one and nothing is added.
- **Files:**
  - `features/ios-custom.js`: pure `_iosCustomModel(...)` and `_iosCustomHtml(m)`, plus
    `renderIosCustom()` and the binding.
  - `#ios-custom` container (`ios-only iq-screen`) in `index.html`.
  - CSS ported into `lift-ios.css` with the `ic-` prefix, using the existing porter and token map.
- **Free cap.** The live app already limits Free to 15 per set. A capture-phase click handler in app.js
  opens the "Bigger sets are a Pro feature" prompt when a Free user taps 20, and `startQuiz` enforces the same
  limit. So the phone shows the E2E's note, "Free covers 15 questions a day. 20 needs Pro.", and dims 20 for Free.
  Pro sees neither.
  - Corrected 20 Oct after the final review. The first draft assumed 20 still worked for Free, which was wrong.
- **Stage 6.** Once the daily quota is server-side, change the note to the remaining count ("9 left today"), so
  the limit is never a surprise.

## Motion and copy

- **BRAND.md §6 tokens win.** The accordion uses the grid-rows pattern with a chevron flip. Selection is
  instant, apart from a short border and tick fade.
- **Reduced motion** reduces everything to a fade.
- **Hover** stays behind `(hover:hover) and (pointer:fine)`.
- **E2E copy wins.** The visual pass ran on 20 Oct 2026, on the additions only.
  - Stage 2 ruled that nothing new moves. Stage 3 therefore added nothing.
  - The one fix: the footer line stays one line, so the dock never jumps.
  - Stage 4 tightened the Catch-up line and "all picked".
  - Stage 5 kept the framing and added the Stage 6 note above.

## Acceptance

- **Side by side.** In the iOS Simulator, compare against the updated E2E screen: both themes, Free
  and Pro, empty and with history.
- **Tests:**
  - UAT: the model (Catch-up count and fallback, footer line, picked counts) and the pure view.
  - Playwright at 390px: every entry path opens the phone screen; picks reach the hidden controls;
    Start generates with the chosen topic, difficulty and count; ✕ returns to Home; desktop still gets
    the modal.

## Rejected approaches

- **Explore fresh directions (`/prototype`).** Rejected because it reopens a screen already designed
  and approved in June.
- **Restyle the panel in place.** Rejected because it breaks the Fidelity rule: the E2E has Custom quiz
  as its own screen, not a panel on Home.
- **Three mode cards in a row.** Rejected because each tile is about 110px at phone width, too narrow
  for its description.
- **A stacked mode list.** Rejected because it loses the bento grid and makes the screen longer.
- **E2E counts 10 / 20 / 30 / 45.** Rejected because three of the four options would sit over the Free
  cap of 15.
- **Ship Lift A first.** The founder chose one release, so phone users never see the old panel beside
  the new Home.

## Related
[[2026-10-19-ios-launch-june-design]] · [[Mobile MOC]] · [[BRAND]]
