---
type: planning
status: draft
cert: all
updated: 2026-10-30
tags: [ios, persona, readiness, product-review]
---
# Persona review: the cert stacker (iOS app)

**Who he is.** Wants 6 certs this year. Studies about 3 hours a day and flies through sessions. He trusts the app, with one nagging worry: is it pushing me towards a pass, or gassing me up? Security+ is expensive and he must not fail it.

**How this was done.** A read-only pass over the phone screens (`features/ios-*.js`), the readiness engine (`features/readiness.js`), the quiz and exam engines, the Sec+ pack and the planning docs. No code was changed. Every claim cites the line it comes from. Where I worked something out rather than reading it directly, it says **(inferred)**.

---

## Summary

Not yet. The maths underneath the readiness score is honest: it doesn't reward effort, it treats unstudied topics as weak, and it adjusts for how hard each question was. But the phone app hides almost all of that from him. It also mislabels his status on Home and celebrates every short quiz as if it were a pass. On thin evidence (about 40 easy answers and no timed mock) it can still stamp him "Pass ready". On the founder's own Security+ exam, the score predicted about 848 and the real result was 800 (`docs/planning/2026-10-19-launch-sequence.md:66-67`). A sceptical user who saw that gap would not book a £300+ exam on the app's word alone.

---

## Top gaps, ranked by value to him

### 1. Home shows the wrong readiness label, and the card does nothing when tapped

**What he sees today.** Unless he is fully "Pass ready", the Home readiness card always says **Behind**, even when the line underneath says "Above the pass mark. Keep it there."

**Evidence.** `features/ios-home.js:44` compares the pass chance to 50 and 20 (`r.passProbability >= 50`), but the engine returns that chance as a fraction from 0 to 1 (`features/readiness.js:351-353`). Every other screen multiplies it by 100 first (`readiness.js:964`, `readiness.js:1322`). So "On track" and "Close" can never appear. The card is also marked as a button (`data-act="readiness"`, `ios-home.js:195`), but the tap list at `ios-home.js:264-280` has no `readiness` entry, so tapping it does nothing. On top of that, Analytics uses a different set of labels for the same score ("Exam Ready / Getting Close / Building / Not Ready", `features/analytics.js:1957-1961`), so the two screens can disagree.

**Why it matters for him.** This is the one number he checks every day. If the label contradicts the sentence under it, he stops trusting both.

**Suggested change.** Multiply by 100 before comparing, or compare against 0.5 and 0.2. Use one set of labels everywhere: pick Home's or Analytics', not both. Make the tap open the "Why this score" sheet in gap 3.

**Size:** S. **Reuse:** the fix is a few lines. The Analytics tier logic could be shared.

---

### 2. "Pass ready" can be awarded on thin evidence, with no timed mock

**What he sees today.** "Pass ready" (Home) or "Exam Ready" (Analytics), plus the gold "passed" styling.

**Evidence.** "Exam ready" needs only two things: a predicted score at or above the pass mark, and 81% or better on his last 200 answers (`readiness.js:403-407`). There is no minimum number of answers. Every domain doesn't have to be covered. No full timed exam is required, and the bottom of the confidence range doesn't have to clear the pass mark. I rebuilt the formula in a scratch script **(inferred: simplified, equal topics per domain, ignores some range clamps)**. One Foundational (easiest) question per Sec+ topic, about 39 answers at 95% right, gives a predicted score of about 793 and a "Pass ready" stamp. The "last 200 answers" check uses raw percent right, so easy warm-ups count the same as hard questions (`readiness.js:404-406`).

**Why it matters for him.** He fears gassing more than anything else. A green light after one evening of easy questions is exactly that.

**Suggested change.** Turn "Pass ready" into a **Book-it checklist** with visible ticks, for example:
- predicted score above the pass mark *and* the bottom of the range above it too (`lowerBound` is already computed, `readiness.js:349`)
- at least N exam-level or hard answers (say 300)
- every domain at or above its pass-accuracy line
- 2 or more full timed simulations in the last 14 days at or above the pass mark
- recent accuracy measured on exam-level or harder questions only

Show "Not yet: 2 of 5" with the missing items, so a "not yet" comes with reasons.

**Size:** M. **Reuse:** every input already exists in `getReadinessScore()` and in history rows (`mode: 'exam'`).

---

### 3. No "Why this score?" on the phone: the confidence range is computed, then hidden

**What he sees today.** A number, a label, "About N points to a pass", and "Last 200 answers: X% right · N days to exam" (`ios-home.js:45-50`). Analytics adds sessions, questions, accuracy and study days (`ios-analytics.js:100-110`).

**Evidence.** The engine already returns a range (`lowerBound`, `upperBound`, `ciHalfWidth`), a pass chance, topics covered out of total, total answers, accuracy per domain, and the top three "what-if" topics (`readiness.js:409-430`). None of the phone files read `lowerBound`, `upperBound` or `passProbability` except the broken tier check in gap 1. The desktop card does show the pass chance (`readiness.js:963-964`).

**Why it matters for him.** He wants the evidence behind the verdict: how many answers it rests on, which domains are thin, how hard the questions were, and how sure the app is.

**Suggested change.** Add a bottom sheet that opens when he taps the readiness card (the app already has a sheet component, `features/ios-sheet.js`). Contents:
- "792, likely between 730 and 850. Pass chance 68%."
- "Based on 1,240 answers across 33 of 39 topics."
- A domain table: his answers per domain vs the official Sec+ weights (12/22/18/28/20, `certs/secplus.js:124-130`), with accuracy per domain.
- Difficulty mix: "62% exam-level or hard".
- Last full mock: score and date, or "none yet".
- One plain-English line on how it works: "We estimate your accuracy topic by topic, adjusted for difficulty, weight it like the real exam, and treat unstudied topics as 40%."

**Size:** M. **Reuse:** all the data exists, and so does the sheet component. The Analytics "Highest-leverage move" card already explains part of this (`ios-analytics.js:168`).

---

### 4. Every quiz result tells him he passed

**What he sees today.** After any quiz, even a 5-question Foundational warm-up, the results screen shows "Scaled score – CompTIA SY0-701", for example **900 / 900**, with "Pass mark cleared". At 90% or above the subtitle says "You're exam-ready on this topic."

**Evidence.** `features/ios-quiz.js:96` turns the quiz's raw percent into an exam-scale score, and `ios-quiz.js:66` writes the verdict. The "exam-ready" line is at `features/quiz-engine.js:1826`.

**Why it matters for him.** He sees this screen dozens of times a day. It is the loudest "gassing" signal in the app, and it says something different from the readiness score.

**Suggested change.** Drop the exam-scale score and pass verdict from quiz results. Show instead:
- raw score and the difficulty split (already rendered, `ios-quiz.js:68`)
- **how his readiness moved**: "Readiness 781 → 784 (+3)"
- "This quiz was mostly Foundational, so it counts less towards readiness" when that's true

Keep exam-scale scores for the Exam Simulator only. Change "You're exam-ready on this topic" to something like "Strong session on this topic."

**Size:** S. **Reuse:** the desktop card already has a readiness-change element (`rc-v2-delta`, `readiness.js:1270`).

---

### 5. Speed and guessing are invisible

**What he sees today.** A "Time" figure for the whole session on results (`ios-quiz.js:67`). Nothing per question.

**Evidence.** No time is stored per answer. History rows hold only date, topic, difficulty, score, total and mode (`quiz-engine.js:1900-1953`), and a search for per-answer timing in the quiz engine finds nothing. There is no "I guessed" option. A 3-second lucky tap counts as fully right. The exam results page shows no pacing either (`features/ios-exam.js:44-50`: correct, wrong, skipped and raw only).

**Why it matters for him.** He answers fast. He can't tell whether his speed is efficient or careless, and the score can't tell either.

**Suggested change.**
- Record seconds per answer (stored inside the existing question log, no new database table).
- On results: "7 answers under 5 seconds, 5 of them right. Fast answers were 71% right vs 88% overall."
- On exam results: "Average 52s per question. The real exam allows 60s. You finished with 14 minutes left."
- Optionally, a long-press "I guessed" on an answer that marks a right answer as a lucky one, so readiness counts it at half weight.

**Size:** M. **Reuse:** the elapsed-time timer already exists (`quiz-engine.js:1871-1874`).

---

### 6. The real exam result is never captured, so the score can't learn

**What he sees today.** No way to say "I sat Security+ and scored 812." Once he passes there is no "passed" state either.

**Evidence.** A search for any exam-outcome capture finds nothing in `app.js` or `features/`. The only calibration so far is the founder's own exam: about 848 predicted vs 800 actual (`launch-sequence.md:66-67`). Readiness tuning is parked in Phase 4 (`launch-sequence.md:65`). The difficulty adjustments were also tuned on the founder's data alone (`readiness.js:149-153`).

**Why it matters for him.** He will pass certs back to back. Logging each result would (a) give him a "Passed" badge and let the app move him to the next cert, and (b) let the app say honestly "people at 780 passed 9 times out of 10". Today the app has nothing to show that claim is true.

**Suggested change.** After the exam date passes, ask "How did it go?" with Passed/Failed and an optional score. Store it alongside the readiness snapshot taken on exam day. Show the history in the explainer sheet ("Your last prediction was 820, real score 812"). Combined across users, this becomes the calibration data the Phase 4 readiness tuning needs.

**Size:** M (a new stored record per user means the gated lane, since it's a migration). **Reuse:** readiness snapshots already exist per cert (`READINESS_SNAPSHOTS`, `readiness.js:434-486`). The hub mockup already has a "Passed" state (`mockups/cert-ios-hub.html:359-364`).

---

### 7. The "forecast" can only go up, and the exam date doesn't drive a plan

**What he sees today.** Analytics → Readiness shows "Forecast on this pace" next to "Days to exam" (`ios-analytics.js:104-106`).

**Evidence.** The forecast is set to `max(predicted, trend)` (`features/analytics.js:1970-1976`), so it can never be below today's score. The trend line uses raw quiz percent and ignores difficulty and domain weights (`readiness.js:517-541`). It doesn't project to the exam date at all. It uses the trend's current value, and a target of 75% that was set for Network+, not Sec+ at 81% (`readiness.js:544`). The exam date only changes how many Daily Review cards are due per day (`features/sr-review.js:80-84`). Nothing turns "18 days left, 40 points short" into "do this much a day".

**Why it matters for him.** He is juggling dates for 6 exams. He needs to know whether he's on pace and what a day should contain, not a number that only ever rises.

**Suggested change.**
- Let the forecast go down as well as up.
- Project it to the exam date: "On your last 14 days' pace, you'd be about 770 on 12 Nov (likely 720 to 820)."
- Add a pace line under the countdown: "To be safely ready by 12 Nov: about 60 exam-level questions a day plus one full mock a week. Weakest: Security Operations (28% of exam)."
- If the pace can't get there: "At this pace you'd be around 735 on exam day. Consider moving the date." That is the honest "not yet" he wants.

**Size:** M. **Reuse:** `daysToExam`, `targetGap` and `impactTopics` are already returned (`readiness.js:383-386`, `readiness.js:371-375`).

---

### 8. Six certs, six silos: no cross-cert view on the phone

**What he sees today.** Settings → Cert opens a list with the note "Your progress stays with each cert" (`features/ios-settings.js:144`). Each cert is its own website address, so its data is stored separately (`app.js:91-147`). Home only knows about the cert that's currently open.

**Evidence.** The multi-cert Pass Plan only appears when the app thinks it's an installed home-screen web app (`features/settings.js:43-48`). That check (`app.js:2270-2283`) looks for "standalone display mode", which the native iOS shell most likely doesn't report, so the iOS app probably shows only the current cert's plan **(inferred, not tested on a device)**. Nothing carries Network+ knowledge into Security+: a new cert starts with every topic at 40% (`readiness.js:285`). A full cross-cert screen (where each cert stands, how much Net+ carries into Sec+, what to study next) was designed in June (`mockups/cert-ios-cross-cert.html`) and never built. No feature file references it.

**Why it matters for him.** This is his core job: 6 certs, 6 dates, one calendar. Today he has to switch certs one at a time to see where he stands.

**Suggested change.** Build the June cross-cert screen in two phases:
- **Phase 1 (smaller):** a "My certs" list with one row per cert: readiness from its snapshot, exam date, days left, and Passed / Studying / Not started.
- **Phase 2:** the knowledge-overlap view and a "seed Sec+ readiness from Net+" option. Shared topics such as ports, wireless and attacks start at his Net+ estimate instead of 40%, clearly labelled as carried over.

**Size:** L (Phase 1 alone is M). **Reuse:** the mockup, `READINESS_SNAPSHOTS` (cloud-synced per cert) and `_renderPassPlanProHtml` (`settings.js:110-140`). This fits with the founder-list item on a clearer first screen.

---

### 9. Copy that promises more than the code does

These are small, but each one is a place a sceptic would catch the app out:

- **"Daily Review still moves your readiness"** (`features/ios-firstrun.js:79`). It doesn't. `features/sr-review.js` never writes to history, and readiness reads only history. The fix is either to change the copy ("keeps what you've learned fresh") or to decide that review answers should count.
- **"Drilling here moves your readiness fastest per minute"** (`features/ios-progress.js:109`). The phone picks the lowest-percent studied topic (`ios-progress.js:24-25`). Desktop uses the readiness-impact ranking (`features/progress.js:538-546`), which also considers untouched topics and exam weight. Use `impactTopics` on the phone too.
- **"60-Question SIM. Closest to the real thing. No timer."** (`ios-home.js:239`). An untimed set isn't the closest to the real thing. The 90-minute simulator is right below it.
- **"Real exam questions"** on the sign-in welcome (`features/ios-signin.js:25`). The questions are original and AI-generated, which the docs are careful about (`docs/architecture/key-patterns.md`, legal boundary). An IT pro reads "real exam questions" as either a brain-dump (against CompTIA's candidate agreement) or a false claim. This strengthens founder-list item 4: that same screen also shows a fixed 720 pass mark that is wrong for Sec+ (750).

**Size:** S (copy, plus one small logic swap for "Drill this next"). **Reuse:** `impactTopics`.

---

### 10. Performance-based questions (PBQs) sit outside readiness, and nobody tells him

**What he sees today.** PBQs appear in the Exam Simulator with partial credit, and results list them (`ios-exam.js:33-41`). The readiness score never mentions them.

**Evidence.** PBQs are deliberately left out of readiness (`features/exam.js:1013`, "PBQs aren't calibrated like MCQs"; also `docs/superpowers/specs/2026-10-11-exam-simulator-hardening-design.md:33`). The decision is reasonable, but the phone never says so.

**Why it matters for him.** On Security+, PBQs come first and are worth a lot. A readiness score that silently ignores them overstates how prepared he is if PBQs are his weak spot.

**Suggested change.** Add one line in the explainer sheet: "Readiness covers multiple-choice. Your PBQs: 6 of 9 fully right across your last 3 mocks." Then include PBQ results in the Book-it checklist (gap 2), for example "PBQ average 70% or better in your last 2 mocks".

**Size:** S. **Reuse:** PBQ fractions are already computed per exam (`ios-exam.js:33-41`), and Sim Lab drill results are tracked for Hands-on milestones.

---

### Worth checking before launch (not ranked)

- **App-wide limit on AI calls.** `api/ai/generate.js:51-56` caps AI calls for the whole service at 500 a day (`GLOBAL_DAILY_LIMIT`, "raise at go-live"). A 3-hour user generates roughly one generation call per 10 questions plus validation calls **(inferred: about 100 calls a day for him)**. A handful of users like him would use up the whole day's limit, and everyone would then get "Too many requests. Please slow down." This is probably already planned, but it would hit this persona first.
- **Repeated questions across sessions.** Questions are only de-duplicated within a single generation (`app.js:4529-4557`). Nothing stops the same idea, worded nearly the same way, from coming back on later days. At 300+ questions a day he could start recognising questions rather than knowing the answer, which would inflate accuracy **(inferred, not measured)**.

---

## Is the readiness score honest?

### How it's actually computed

All of this is in `getReadinessScore()`, `features/readiness.js:198-431`.

1. **What counts.** Only this cert's quiz, Mixed and exam history. Mixed and exam sessions count through their per-topic rows. Gauntlet and Why-Not drills are excluded as "trap-heavy" (`:223-226`). Mistake drills never reach history (`quiz-engine.js:1900`), and neither does Daily Review.
2. **Per-topic ability, adjusted for difficulty.** Each answer is weighed by how hard the question was. A right answer on a Hard question counts for more, and a miss on a Foundational question costs more (`:153` difficulty offsets, `:177-192` solver). The last 7 days count double, and exam-mode answers count 1.3× (`:164`).
3. **Shrinkage.** Each studied topic is blended with about 3 imaginary answers at his own overall ability, so one lucky answer can't make a topic look mastered (`:285-301`).
4. **Untouched topics count as 40%** (`:285, :300`). This is how coverage enters the score: skip a topic and it drags the score down.
5. **Weighted like the real exam.** Topic estimates are averaged inside each domain, then the domains are weighted by the official blueprint. Sec+: 12/22/18/28/20 (`:304-308`, `certs/secplus.js:124-130`).
6. **Mapped to the scale.** Expected accuracy is placed on the 100–900 scale, so Sec+ 750 means about 81% right (`:309-313`).
7. **Range and pass chance.** The range widens with few answers, poor coverage and stale topics, plus the natural luck of a 90-question exam (`:338-353`).
8. **"Exam ready"** = predicted score at or above the pass mark AND 81%+ on the last 200 answers (`:403-407`).

This is genuinely thoughtful. Steps 4, 7 and 8 are there specifically to stop effort alone from showing a pass. That was the v1 flaw, fixed in v2 (`key-patterns.md`, Readiness section).

### What could inflate it for a fast, high-volume user

| Inflater | Where | Effect |
|---|---|---|
| Difficulty is the AI's own label, not measured | `readiness.js:102-117` | If the generator labels medium questions "Hard", right answers on them earn extra credit |
| Difficulty adjustments tuned on one person's data | `readiness.js:149-153` | May not fit other learners. The founder's real score came in about 48 points under the prediction |
| "Last 200 answers" uses raw percent | `readiness.js:404-406` | Easy warm-ups help pass the second "exam ready" check |
| Shrinkage pulls toward his overall ability | `readiness.js:296-300` | A strong user's barely-touched topics inherit his strong average instead of being treated as unknown |
| No minimum-evidence or timed-mock requirement | `readiness.js:407` | About 40 easy answers can earn "Pass ready" **(inferred via scratch replica)** |
| No per-answer timing, no "I guessed" | quiz-engine history rows | Lucky fast taps count as fully right |
| No cross-session repeat tracking | `app.js:4529-4557` | Near-duplicate questions could make recall look like knowledge **(inferred)** |
| PBQs excluded | `exam.js:1013` | Weak PBQ skills never pull the score down |
| Forecast floored at today's score | `analytics.js:1975` | The "Forecast on this pace" figure can only be good news |

### What would make it trustworthy to a sceptic

1. **Show the range and pass chance, not just a point.** "792, likely 730–850, 68% pass chance." The data already exists (gap 3).
2. **Show the receipts.** Answers counted, topics covered, domain coverage vs the official weights, difficulty mix, last mock date and score (gap 3).
3. **Make "ready" a checklist he can audit**, including timed full mocks and a minimum count of exam-level answers (gap 2).
4. **Close the loop with real results** and publish the hit rate once there's enough data: "Of users at 780+, X% passed" (gap 6).
5. **Run recent-form checks on exam-level-or-harder questions only**, and count fast guesses at reduced weight (gaps 2 and 5).
6. **Say what it doesn't cover:** PBQs, and that scaling is an estimate. The exam results page already does this well (`exam.js:960-966`). The readiness card should too.

---

## Already works well for him: don't break it

- **Readiness doesn't reward effort.** Untouched topics count as 40%, and difficulty is adjusted for (`readiness.js:285-311`). Keep the v2/v3 approach.
- **Practice that isn't evidence stays out.** Mistake drills, Daily Review, Gauntlet and Why-Not don't touch readiness (`quiz-engine.js:1900`, `readiness.js:224-226`).
- **"Exam ready" needs recent form as well as the prediction** (`readiness.js:407`). Strengthen it, don't replace it.
- **Mixed quizzes follow the official domain weights**, with coverage-aware topic draws (`app.js:4587-4603`, `quiz-engine.js:2293`). Sec+ weights match the SY0-701 blueprint (`secplus.js:124-130`).
- **The Exam Simulator is honest.** 90 questions in 90 minutes, PBQs with partial credit, a domain breakdown, "Drill the gap", the "real exam's scaling isn't published" note, and pauses disclosed with "the real exam has no pause" (`exam.js:960-966`, `ios-exam.js:18-50`).
- **Analytics "Practice vs timed" and "By difficulty"** (`ios-analytics.js:131-145`). This is exactly the pressure check he wants. Bring it forward rather than leaving it two taps deep.
- **Pro has no daily question cap.** His 3-hour days work (`api/ai/generate.js:10-11`). The free cap of 15 a day plus 5 reviews is clearly explained on the "Done for today" screen.
- **The Sec+ question bank is deep:** about 1,471 hand-curated exemplars vs about 200–320 on other packs (`launch-sequence.md:68`). Worth telling him when he switches to a thinner pack. That's a small idea, not ranked.

---

## Could not verify

- How the iOS shell answers the "standalone" check, and so whether the multi-cert Pass Plan shows in the app (gap 8). This needs a device check.
- The "about 40 easy answers gives Pass ready" figure comes from my own simplified copy of the formula, not from running the app.
- How often the same questions come back across days. Not measured.
- AI calls per question, for the app-wide limit estimate.
- Whether cloud sync brings other certs' readiness snapshots into the cert that's open.
