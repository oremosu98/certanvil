---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-22
tags: [spec, mobile, ios, launch, lift-b]
---
# Lift B3a: the Drills tab, made real (approved 22 Oct 2026)

B3a is the first of three B3 releases ([[2026-10-19-ios-launch-june-design]] stage 3, after
[[2026-10-21-ios-lift-b2-design]]). It makes the phone Drills tab look and flow like the June E2E
(`mockups/cert-ios-drills.html`) and gives the drills June never drew a place on it. The screens
those drills open are later releases:

| Release | Scope |
|---|---|
| **B3a** | The Drills tab (this spec) |
| B3b | Sim Lab: start screen, rounds, the PBQ console look (also inside the exam), verdict |
| B3c | Reword Gauntlet, Why-Not and Decision Lab screens |

Phone only (max-width 899px). Desktop never shows `#page-drills` (its only way in is the phone tab
bar), so nothing changes there. `app.js` stays at its 8301-line ratchet.

## What the E2E has, what the app has (22 Oct)

- **E2E** (`cert-ios-drills.html`, 10 Jun, no states): header "Drills" with the cert code, a lede, a
  **Drill Mistakes** card ("9 saved", "Drill the 9 you missed"), a **Weakest topics** card (three
  red-% chips, "Drill weakest topics"), a **Drill by domain** list (weight, bar, mastery) and a foot
  note. No Sim Lab, Gauntlet, Why-Not or Decision Lab.
- **App** (`#page-drills`, `lift-shell.js liftRenderDrills`): Reword Gauntlet and Why-Not hero cards
  on top, then Drill Mistakes, Weakest topics, Drill by domain and the foot note, then a Sim Lab card
  that `features/sim-lab.js renderSimLabDrillsCard` appends after the foot note. Its "Start a sim"
  opens a single legacy scenario, not the session start screen Home uses. Decision Lab is on Home
  only.

## Founder decisions (22 Oct 2026)

1. **Split B3 in three** (B3a Drills tab, B3b Sim Lab, B3c Gauntlet + Why-Not + Decision Lab),
   each drawn, approved and shipped on its own.
2. **June first, then a section.** The drawn June cards stay on top in June order. Sim Lab, Reword
   Gauntlet and Why-Not move into one "More ways to practise" card of rows below Drill by domain.
3. **Sim Lab row opens the session start screen**, the same one Home opens (Practice / Exam,
   3 / 5 / 10 rounds). The free daily session counts the same either way.
4. **True copy, June style.** June's layout and tone, but the notes say what the app really does:
   missed questions come back re-worded (Pro); the weakest-topics drill "leads with the weakest of
   them". June's "stops when each one clears 70%" is not how the drill works and is not used.
5. **Decision Lab gets a row** on the four certs that have it (AZ-900, AI-900, SC-900, CLF-C02),
   opening the same Decision Lab as Home.

## The screen

In order, at 402pt:

1. **Header**: "Drills", the cert code tag, the theme button (as June).
2. **Lede**: June's line, "Short, repeat passes on the things you get wrong. Ten questions or fewer,
   scored like practice."
3. **Drill Mistakes**: pill "N saved"; a Pro lock for free users (the drill is Pro, as today).
   Note: "Your missed questions come back re-worded, so you beat the idea, not the wording. Right
   twice in a row and it leaves the bank." Button "Drill the N you missed".
   Empty: pill "0 saved", note "Questions you miss land here.", button "Nothing to drill yet"
   (disabled).
4. **Weakest topics**: the top three chips with their accuracy %, note "The drill leads with the
   weakest of them.", button "Drill weakest topics".
   Empty: no chips, note "Take a quiz and your weakest topics show up here.", no button.
5. **Drill by domain**: June's rows (domain number and name, weight "23% of exam", bar, "Mastery
   N% · 10 Q"), from `DOMAIN_WEIGHTS` / `DOMAIN_LABELS` as today.
6. **More ways to practise**: section title, then one card of rows. Each row: icon, name, one line
   on what it is, a pill, a chevron. Rows appear only where the drill exists:

   | Row | Shown on | Line | Pill |
   |---|---|---|---|
   | Sim Lab | CompTIA certs (`_SL_PBQ_CERTS_HOME`) | Hands-on PBQs, like the real exam | Free: "1 free today" / "Done today". Pro: none |
   | Reword Gauntlet | all certs | One idea, asked five ways | Free: "1 free today" / "Done today". Pro: none |
   | Why-Not | all certs | Say why each wrong answer loses | Free: "Pro". Pro: none |
   | Decision Lab | `_DL_CERTS` | Read the constraint, kill the look-alikes | none |

   Copy on the rows goes through the 5-stage pass when drawn.
7. **Foot note**: June's, "Drills don't touch your daily review queue."

The tab bar stays as today (Drills lit).

## Behaviour

- Each control calls today's entry, unchanged: Drill Mistakes `startWrongDrill()`, Weakest topics
  `focusTopic(top[0].topic)` (the weakest one, as today), domain rows `applyDomainPreset`, Sim Lab `startSimLabHome()`,
  Reword Gauntlet `startRewordGauntlet`, Why-Not `startWhyNot`, Decision Lab
  `startDecisionLabHome()`. Pro gates, free daily caps and their counting are untouched, so a free
  user tapping Why-Not gets today's Pro gate.
- Gauntlet and Why-Not still come back to Drills (they read the active page, which is still
  `#page-drills`).
- The screen re-renders when the tier loads (quota hydrates after the first paint), by chaining onto
  the existing tier hook in `features/ios-drills.js`, not by adding lines to `app.js`.

## Architecture

- **`features/ios-drills.js`** (new, loaded `defer` after `features/ios-exam.js`):
  - `_iosDrillsModel(s)`: pure. Takes plain state (cert id and code, tier, wrong-bank count, top weak
    topics with %, domain rows, gauntlet and Sim Lab runs used today with their caps) and returns
    every string, count, pill and row the view needs.
  - `_iosDrillsHtml(m)`: pure, escaped view.
  - `renderIosDrills()`: phone only; reads live state, renders into `#ios-drills`, wires taps by
    `data-act` (no inline `on*=`, Sec-P7).
- **`index.html`**: `<section id="ios-drills" class="ios-only iq-screen" aria-label="Drills">` as the
  first child of `#page-drills`; the script tag.
- **`lift-shell.js`**: `RENDER.drills` also calls `renderIosDrills()`.
- **`lift-ios.css`**: a `B3a` section, `id-` class prefix, ported from the drawn E2E. Hides the old
  cards (and the appended Sim Lab card) beside a rendered `#ios-drills`.
- Old markup and `liftRenderDrills` stay (they back the hidden cards and are harmless).

## Process

1. Draw into the E2E first (`cert-ios-drills.html`, branch `feat/cert-ios-e2e`): the "More ways to
   practise" card, the empty states, and free / Pro / Decision Lab variants, with a **B3a ›** HUD
   button stepping through `drills`, `drills-free`, `drills-empty`, `drills-dl`. 5-stage visual pass
   on the drawing. Founder taps it in the Simulator and approves.
2. Plan, build (native), side-by-sides with `scripts/lift-sbs.js`, final review, ship v8.187.0 on
   "ship it".

## Acceptance

- At 390 and 402, through the tab bar: June order; Mistakes, Weakest and domain rows filled from
  real data; the "More ways" rows match the table for netplus (Pro and free), az900 (Decision Lab,
  no Sim Lab) and a fresh user (empty states).
- Each row and button reaches its existing entry; a free Why-Not tap shows the Pro gate.
- The pills change from "1 free today" to "Done today" after a free run, and appear only once the
  tier is known.
- No horizontal scroll; 44pt targets; theme follows; desktop untouched.
- UAT on the pure model per cert and tier; Playwright at 390 and 402.

## Rejected approaches

- **Restyle the existing markup with CSS**: the Sim Lab card is appended later by the lazy Sim Lab
  module, so order and styling would be fragile.
- **CSS-only reorder (`order:`)**: would squeeze the hero cards into rows by CSS alone, the drift the
  launch spec warns about.
- **New cards on top / Sim Lab featured** (layout options): founder chose June first, then a section.
- **June copy verbatim with a real 70% stop**: an engine change for a promise nobody asked for.

## Related
[[2026-10-19-ios-launch-june-design]] · [[2026-10-21-ios-lift-b2-design]] · [[2026-10-21-ios-lift-b1-design]] · [[Mobile MOC]]
