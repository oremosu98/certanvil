---
up: "[[Drills MOC]]"
type: spec
status: active
updated: 2026-10-11
tags: [spec, exam, simulator, pbq]
---
# Full Exam Simulator: safe to sit, honest to score (design)

**Agreed 2026-10-11.** The founder plans daily full sims in the week before SY0-701 (Fri 16 Oct) and asked for a deep, transparent analysis, then said "do release 1 + 2 today".

## What the analysis found
1. **A reload wipes the exam.** State lives only in memory: refresh, crash, iOS tab eviction or the "New version → Refresh" banner loses up to 90 minutes.
2. **The sidebar stays live mid-exam** (checked on localhost). Progress or Analytics leaves silently while the exam keeps running with no way back, and the deadline later throws you onto the results page. Home (`goSetup`) abandons it with no prompt.
3. **The clock pauses while the tab is hidden** (`_examOnVisibilityChange` extends the deadline). The real exam never pauses.
4. **The Security+ simulator has no PBQs.** `injectPBQs` only has Network+ banks (v8.113.0 gate), and the 129 Sec+ Sim Lab PBQs are unused.
5. **Difficulty is "Mixed"**, which includes foundational recall the real exam doesn't ask. The founder's own data: Exam Level 92.6%, Hard 75%, Mixed 88%.
6. **The 100–900 score is linear** (750 ≈ 81% correct) and the page says "Exam-ready!". CompTIA doesn't publish its scaling.

## Release 1 (v8.162.0)
- **Saved progress.** `nplus_exam_state` holds `{v, endTime, questions, answers, current, hardcore}`. It is written on start, on every `renderExam`, and every 5 s while the clock runs, and cleared on submit or abandon. It is local only: a per-subdomain key, so per cert.
- **Resume.** The Home Recommended tile shows "Resume your exam · Q23 of 90 · 54 min left". If time ran out while away, it shows "Time's up · see your result", which submits the saved answers.
- **Leaving asks first.** `examLeaveOk()` confirms "Leave the exam? The clock keeps running, and you can resume from Home." On yes it suspends: the timer stops, `examMode` is cleared, and the saved state stays. It is wired into `showPage` (leaving `page-exam` for anything except exam-results / review / loading) and `goSetup`. Because the state is saved, the update banner's Refresh is now safe.
- **Real clock.** No pause while hidden; the wake lock is still re-acquired.
- **Exam-level questions.** Batches 1–4 are Exam Level, batch 5 is Hard (≈80/20), and the top-up is Exam Level. MCQs are shuffled after generation so the Hard batch doesn't cluster at the end.
- **Pace line** in the exam header: "on pace" / "3 min behind" / "4 min ahead". Each item has a time budget: PBQ = estMinutes × 0.9, and the MCQs share the rest of the clock evenly. Within ±2 min counts as on pace.
- **Honest score line:** "Here, 750 is about 81% correct. CompTIA doesn't publish its real scaling, so treat this as an estimate." "Exam-ready!" is dropped.

## Release 2 (v8.163.0)
- **4 Sim Lab PBQs open the exam**, as on the real SY0-701. `window._simLab.pickExamPbqs(cert, n)` picks validated seeds of distinct exam-style archetypes (firewall, cli, diagram, wireless, incident, vpntunnel, defense), least-recently-served first, and marks them served. MCQs fill the remaining 86. The legacy `injectPBQs` only runs when no Sim Lab PBQ was added.
- **One exam, one navigator.** A PBQ item is `{type:'simlab', simlab: seed}`, mounted in the exam card with `_simLab.mountScenario` (its own Submit button removed; responses captured live and restored on revisit). Flag, navigator, clock and back/forward all work as for MCQs.
- **Styling.** Every `#page-sim-lab` selector in dg-system.css gets a `#page-exam .exam-pbq` twin. A UAT ratchet keeps them in step.
- **Scoring.** Each PBQ counts as one question with partial credit (fraction of steps right), scored with `simLabScoreScenario`. Points = MCQs right + Σ PBQ fractions. CompTIA doesn't publish PBQ weights, and the results page says so. PBQs stay out of the wrong bank, the type stats and the readiness topic splits; they aren't calibrated like MCQs.
- **Review.** Each PBQ shows its steps with ✓/✗ and the explanation.

## Cross-platform
Saving and restoring is plain localStorage: Desktop, Safari, mobile web and iOS Capacitor all behave the same. Resume covers WKWebView suspend and iOS tab eviction, which previously lost the exam. The deadline-based clock is correct after suspend. PBQ renderers are the Sim Lab ones, already verified on all four targets.

## Testing
- vm fixtures: state round-trip (save → load → expired detection), leave guard (in progress vs not), pace maths, difficulty plan per batch, PBQ picker (distinct archetypes, unseen first), and submit scoring with partial PBQ credit.
- A CSS twin ratchet for `#page-sim-lab` selectors.
- Live check on localhost with a seeded exam: resume after reload, sidebar confirm, a PBQ rendered and scored, review.

## Rejected approaches
- **Running the PBQ section on the Sim Lab page in its own exam mode:** that mode ends the session when you leave its page and has its own results screen, so you couldn't move between PBQs and MCQs as on the real exam.
- **Keeping the hidden-tab pause:** it flatters timing in a rehearsal meant to be honest.
- **Weighting PBQs as several questions:** the weights are unpublished, so one question with partial credit is the honest default.
