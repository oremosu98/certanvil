---
up: "[[Mobile MOC]]"
type: audit
status: active
cert: all
updated: 2026-10-30
tags: [audit, design, mobile]
---
# Persona bundle: five-stage visual pass (30 Oct)

This pass covers every new screen in the bundle. The changes are applied in the June E2E drawings and
in the specs.

**Design read:** brand-locked mobile product UI for cert learners. Calm, editorial and bronze, with
BRAND.md tokens and Fraunces/Inter.

## 1. design-taste-frontend
- "Network+ · Passed · 812" becomes "Network+ passed · scored 812". This keeps to one middle dot per line.
- The admin email header "From CertAnvil · to you · every Monday" becomes "From CertAnvil to you,
  every Monday".
- The book-it checklist used text ✕ and ✓. It now uses an empty ring for "not yet" and a filled bronze
  tick for "done", matching Suggest a cert.
- No em dashes, left-border callouts or radius drift were added. The admin page's existing "—" data
  placeholders were left untouched.

## 2. emil-design-eng
- The exam-question buttons get `:active` scale(0.97) at 160ms.
- The "Why this score?" sheet runs .36s in and .2s out, the same as the other B2 sheets.
- "Start fresh" dims on press.
- Suggest-a-cert picks already use two channels (tint and a filled tick).
- Goodbye and welcome back motion was decided earlier: the clock sweep with seven day-dots, and the
  wind-back with a count-up.

## 3. transitions-dev
- No new motion beyond what stage 2 asked for.

## 4. humanizer
- "Tell us and we'll keep your plan right." becomes "Tell us and we'll update your plan."
- The log-result intro becomes "Sat the exam? Add your result. A pass marks the cert as passed in your
  hub." The old intro assumed a pass.
- The Suggest-a-cert thanks drops the repeated subtitle.

## 5. marketing-psychology
- The streak warnings ask for one question: "One question keeps it." Tapping one opens the
  1-question Daily Challenge. This lowers the activation energy.
- The book-it "not yet" shows the next step on the first unmet item ("Start a full exam"). This uses
  goal gradient.
- The passed card reads "Your streak carries on with your next cert." That is true (the streak is
  shared) and carries momentum into the next cert.
- Kept on purpose: on the goodbye, Done stays primary over "Sign back in". Pushing an undo would be a
  dark pattern.

## Related
[[2026-10-30-streak-honest-design]] · [[2026-10-30-why-score-bookit-repeats-design]] · [[2026-10-30-exam-outcome-design]] · [[2026-10-30-deletion-moments-design]]
