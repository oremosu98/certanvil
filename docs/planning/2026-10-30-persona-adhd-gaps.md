# Persona review: the restless studier (ADHD), iOS app

*Read-only review, 30 Oct 2026. Every claim points to code I read. Anything I worked out rather than saw is marked **(inferred)**.*

## Who he is

He's sitting a cert and means it, but his attention goes fast. He studies about an hour a day when it's going well, skips days when it isn't, and comes back in bursts. If he can't tell what to do within a couple of seconds, he closes the app.

## His first week today, in short

Day one gets him to a question fairly quickly. The 30-second check is short, and the "Just start practising" path lets him skip it. The rough part starts once he's in the loop. A 1-question Daily Challenge he gets wrong is marked like a failed exam. Closing a quiz halfway throws all his answers away. Nothing after a session shows his readiness number moving, even though moving that number is the app's whole promise. When he misses three days and comes back, Home still shows his old streak, then drops it to 1 right after he does the thing he came back to do. So the week tells him he's failing at the moments he's actually trying.

---

## The gaps, most valuable first

### 1. Short sessions get marked like a full exam, and the copy can be wrong for his cert

**What he sees today.** Every finished quiz, including the 1-question Daily Challenge and the 5-question Warmup, uses the same results screen. It shows a letter-grade headline and a "scaled exam score" with a below-pass verdict. Get the one Daily Challenge question wrong (0%) and he reads:

- **"More work needed."** / **"Rewatch the Messer videos on this topic."** (`features/quiz-engine.js:1830`)
- A scaled score out of 900, plus a pill like **"620 below pass, keep going"** (`features/ios-quiz.js:69`, `:113-115`)

"Messer" is Professor Messer, a CompTIA video course. Every cert gets this line, including AZ-900, AI-900, SC-900 and AWS (`features/quiz-engine.js:1825-1831`, no cert check).

**Why it matters for him.** Short sessions are how he gets back into studying. Marking a 1-question warm-up as an F with a "below pass" verdict is the worst feedback he could get, at the moment he's most fragile. Pass-mark numbers from 1 or 5 questions also mean nothing statistically.

**Suggested change.** Under about 10 questions, drop the scaled score and the below-pass pill. Show "3 of 5 right", say what he just did ("Daily Challenge done, streak kept"), and give one next step. Rewrite the five headlines to talk about the session, not him, and remove the Messer line (or show it only on CompTIA certs).

**Size:** S. **Reuse:** the results model already knows the question count (`_iosResultsModel`). The copy changes are one table.

---

### 2. Leaving a quiz partway loses everything

**What he sees today.** Tap ✕ during a normal quiz and he gets the phone's own pop-up: **"Go back to the menu? Quiz progress will be lost."** (`app.js:2849`). There's nowhere a half-finished quiz gets saved. The app has save slots for the exam, Daily Review settings and topology drafts, but none for a quiz (`app.js` STORAGE list from line 1123). Only a finished quiz updates his streak and history (`features/quiz-engine.js:1891`). So 7 of 10 answered, then a text message, counts as nothing done today. **(inferred)** If iOS closes the app in the background, an open quiz is lost the same way, because it only lives in memory.

The exam already does this properly. It can be paused, and Home offers "Resume your exam" for up to 7 days (`features/ios-home.js:56-68`).

**Why it matters for him.** He gets interrupted all the time. Being punished for stopping makes him avoid starting.

**Suggested change.** Save the quiz after every answer. When he taps ✕, ask in the app's own sheet: "Save and finish later" or "End now and count what I answered". Show "Finish your quiz: 3 left" as the top Home card, the way the exam resume works. At minimum, answered questions should count toward today, his history and his streak.

**Size:** M. **Reuse:** the exam's resume card on Home and its pause state (`nplus_exam_state`), and the phone confirm sheet (`features/ios-sheet.js`).

---

### 3. Coming back after missed days: a stale streak, then a drop

**What he sees today.**

- The streak is only recalculated when he finishes something (`app.js:3180-3191`). Reading it doesn't check how long ago he last studied (`app.js:3176-3178`). Three days after a 5-day run, Home still shows the flame at **5** and **"5 day streak, best is 5. One short session adds another."** (`features/ios-home.js:96-113`, `:183`).
- He does the short session the line asked for, and the streak resets to **1** (`app.js:3185`). The loss arrives at the moment he did the right thing.
- The greeting doesn't change whatever the gap: **"Thursday evening. Pick up where you left off."** (`features/ios-home.js:34`).
- There's no grace for a missed day. One missed day ends the streak.

**Why it matters for him.** Missing days is normal for him, not a rare failure. A streak that breaks on any missed day, and only tells him afterwards, turns every return into a small defeat. That's the guilt loop that makes people with ADHD drop apps.

**Suggested change.**
1. Show the truth on return, kindly: "Welcome back. It's been 3 days. A 5-minute warm-up gets you going again." Don't show a streak that's already gone.
2. Make the streak forgiving: a free "rest day" each week, or count "days studied this week" (for example 4 of 7) instead of an unbroken chain.
3. After a gap, the greeting and the top card should offer the smallest useful step (see gap 7).

**Size:** M (the streak rules touch web as well). **Reuse:** the existing streak record (`current`, `best`, `last`) has everything needed to detect a gap. The analytics screen already tracks total active days (`features/ios-analytics.js:181`), which is a ready-made, forgiving number to put first.

---

### 4. He never sees his readiness move after a session

**What he sees today.** First run promises **"Answer a few and watch your readiness move."** (`features/ios-firstrun.js:65`), and the score screen says the best read on his progress is the next session (`:129`). But the phone results screen shows the session's own scaled score, stats and answer list. It doesn't show how his readiness changed (`features/ios-quiz.js:107-123`). It doesn't show the streak either: results are drawn before the streak updates (`features/quiz-engine.js:1889` vs `:1891`), and the streak "pulse" only plays on the desktop badge (`app.js:3205`). To see whether anything moved, he has to go back to Home and remember the old number.

**Why it matters for him.** An ADHD brain runs on immediate, visible reward. "+14 readiness" or "Day 4 kept" straight after the session is what pulls him back tomorrow. A number he has to compare from memory doesn't do that.

**Suggested change.** At the top of results, add one line or chip: "Readiness 612 → 626 (+14)" (or "Readiness held" when it didn't move), plus "Day 4 kept". Count it up once. Respect reduced motion.

**Size:** S–M. **Reuse:** readiness snapshots are already saved after every quiz (`STORAGE.READINESS_SNAPSHOTS`). The Daily Review "done" screen already has a streak tile (`lift-ios.css:1245`). Move `updateStreak()` before the phone results render.

---

### 5. "Start practising" after the 30-second check doesn't start anything

**What he sees today.** After the check, the score screen's only button says **"Start practising"** (`features/ios-firstrun.js:131`). Tapping it just closes the check and goes back to Home (`:365`, `leaveCheck`). Home then asks him to choose again ("Start your first quiz", `features/ios-home.js:78`) among the other options.

**Why it matters for him.** He's most motivated right after seeing his starting number. A button that doesn't do what it says, followed by another decision, is exactly where he drifts off.

**Suggested change.** Make the button start the first quiz (today's 15 for Free, the recommended quiz for Pro). Use the existing `startToday()` in the same file (`:274`), so he lands on a question.

**Size:** S. **Reuse:** `startToday()` already exists. *This supports founder items 1 and 4 (a welcome after picking an exam, a clearer first screen).*

---

### 6. After a session, the main button is "Redo this quiz"

**What he sees today.** The results footer's main button is **"Redo this quiz"**, then "Drill my N mistakes", "Review answers" and "Back to menu" (`features/ios-quiz.js:121-123`). Nothing says how much of today is left. There's no "keep going" and no "you're done for today".

**Why it matters for him.** Repeating the same questions isn't the obvious next step, and four buttons is a decision he doesn't want to make. Good stopping points matter as much as starting points. Without a clear "done for today", "one more" turns into guilt.

**Suggested change.** Make the main button depend on where his day stands. Before the daily goal: "Keep going: 5 more (8 of 15 left today)". At the goal: "That's today done. See you tomorrow", with the review cards as an optional second button. Put Redo and Review answers in a quieter row.

**Size:** S. **Reuse:** Home's Recommended-next logic (`features/ios-home.js:53-82`) and today's count / quota (`getTodayQuestionCount`, `_quotaRemainingToday`).

---

### 7. Home is long and has two competing "next" buttons, and the suggestion ignores gaps

**What he sees today.** A returning Home has about ten ways in: the readiness card, Recommended next, a 7-day review strip, the momentum ring with its own **"Pick up: <topic> … Practise it · 10 questions"** button, Warmup, Daily Challenge, Drill Mistakes, three fold-out menus, the domain list, and Build a custom quiz (`features/ios-home.js:188-248`). "Recommended next" and "Pick up" both say "do this next", and they can point at different things. With no reviews due, the default suggestion is **"15-min Weak Spots"** (`:81`), even when he's been away a week.

**Why it matters for him.** He needs a single answer to "what now?" in two seconds. Two answers is the same as none. After a gap, 15 minutes at exam level is too much to start with. The 5-minute Warmup ("Ease back in", `:229`) fits better, but it sits further down.

**Suggested change.** Keep one main action. Fold "Pick up" into Recommended next as its subtitle, not a second button. Make the suggestion gap-aware: away 2+ days and no reviews due means the top card is the 5-minute Warmup ("Ease back in"). Consider moving the study menus behind a single "More ways to study" row.

**Size:** S–M. **Reuse:** all the pieces exist. It's a reorder plus one rule in `_iosHomeModel`.

---

### 8. Reminders stop when he drifts away and say the same thing every day

**What he sees today.** The app sets up 7 days of reminders and re-plans them only when it's opened (`features/ios-reminders.js:12-31`, `:251`). The spec chose this on purpose: *"If they stop opening the app, reminders stop after the 7 scheduled days."* (`docs/superpowers/specs/2026-10-29-ios-stage5d-study-reminders-design.md`). On a normal day the text is the same one line, **"Your 15 questions for today are waiting."** (`:27`), whether it's his first missed day or his sixth. Only a finished quiz or exam marks the day as studied (`:93-98`). **(inferred)** On a day he only does Daily Review, the 7 pm reminder still tells him his 15 questions are waiting.

**Why it matters for him.** His usual way of dropping off is a lapse that quietly becomes permanent. Reminders that end exactly then, after six identical nags, mean the app goes quiet when a nudge would help most. Asking for "15 questions" also feels heavy when he's drifting.

**Suggested change.** (This needs a founder decision, because it reverses a spec choice.)
- After the last daily reminder, schedule one or two gentle "door's open" reminders, for example at day 10 and day 21, worded as the smallest step: "One question, about a minute. Your progress is still here."
- Shrink the ask as days go by without study: 15 questions, then a 5-minute warm-up, then 1 question.
- Count a Daily Review session as studying for the day.

**Size:** M. **Reuse:** the reminder planner is a small, self-contained function (`planReminders`) that's easy to extend. The Daily Challenge (1 question) is the ready-made smallest step.

---

### 9. Every quiz waits for new questions to be written **(wait time inferred)**

**What he sees today.** Every quiz writes its questions live with AI and then checks them (`docs/architecture/key-patterns.md`, Quiz Flow). There's no stock of ready-made questions (I found no question cache in `app.js` or `features/quiz-engine.js`). The phone shows a loading screen: **"Generating 10 Exam level questions on …"** and a disabled **"Preparing your set"** button (`features/ios-quiz.js:26-40`). The request is allowed up to 90 seconds (`app.js:518`). I couldn't measure the real wait from code.

**Why it matters for him.** A blank wait between "I'll study" and the first question is where a restless person picks up another app. If the wait is regularly over a few seconds, it costs sessions every day.

**Suggested change.** Prepare his next Warmup or recommended set in the background while he's on Home or Results, so tapping it opens a question straight away. Or show the first question as soon as it's ready while the rest are still being made.

**Size:** L (quota counting and freshness need care). **Reuse:** the loading screen already shows stage-by-stage progress. Check real wait times in analytics before committing to this.

---

### 10. "Today" is measured in UTC for some things and local time for others

**What he sees today.** The streak and "questions today" use UTC dates (`toISOString().slice(0, 10)`, `app.js:2953`, `:3181-3184`). The free 15 also resets at midnight UTC (`api/ai/generate.js`, "Resets at midnight UTC"). Reminders use the phone's local day (`features/ios-reminders.js:40-43`). In the UK in winter this makes no difference. In UK summer, anything after midnight counts as the day before. In the US, evening study after about 7–8 pm counts as the next day in UTC. So a night-owl studying Monday at 9 pm and Tuesday at 6 pm can land both sessions on the same UTC day, lose Monday, and lose his streak.

**Why it matters for him.** People with ADHD often study late. A streak that breaks even though he studied every evening is unfair, and it's confusing too.

**Suggested change.** Use the phone's local date for the streak and "today" (reminders already do). Leaving the server quota on UTC is fine, but say so in local time ("new 15 at 1 am").

**Size:** S. **Reuse:** `localDay()` in `features/ios-reminders.js:40`.

---

## Already works well for him (don't break it)

- **A 1-question Daily Challenge that keeps the streak** ("1 question, about a minute. Keeps the streak, +1.", `features/ios-home.js:230`). This is the right minimum session. It just needs better results copy (gap 1).
- **The Daily Review backlog is spread out, not stacked.** Free reviews are capped at 5 a day, and the overflow is described as "over the next few days" instead of a big number (`features/sr-review.js:28-30`, `:90-110`).
- **Readiness doesn't drop because he took a break.** Time away only widens the uncertainty range, not the score (`features/readiness.js:270-279`, comments at `:280-284`).
- **The exam can be paused and resumed for 7 days** from a Home card (`features/ios-home.js:56-68`).
- **A day-0 escape hatch:** "Just start practising: skip the check and dive into today's 15" (`features/ios-firstrun.js:61-64`). The check also has its own "Skip the check" link (`:109`).
- **Hitting the free cap is handled kindly:** "That's today's 15 done. Your streak is safe." with reviews still on offer (`features/ios-firstrun.js:78-82`).
- **The reminder ask comes after his first finished quiz,** not during onboarding. It's one a day at most, off unless he turns it on, and he picks the time (`features/ios-reminders.js:159-212`).
- **Offline is calm:** "Your progress is saved on this device… Nothing is lost." (`features/ios-firstrun.js:161-168`).
- **Drills are short:** "Ten questions or fewer" (`features/ios-drills.js`), and there's one clear Recommended-next card at the top of Home.
- **The free 30-second check doesn't use up his daily 15** (`features/ios-firstrun.js:371`).

## What I could not verify

- How long question generation actually takes (gap 9). I read code only and measured nothing on a device.
- Whether iOS closing the app in the background loses an open quiz (gap 2). Inferred from the lack of any saved quiz state.
- That a review-only day still triggers the "15 questions are waiting" reminder (gap 8). Inferred from `lastStudiedDay` being set only on a finished quiz or exam.
- Exactly how the daily quota counts questions per generation call (`consume_daily_quota` is called with 1 per request). I didn't follow it far enough to say whether quitting a quiz early wastes part of the free 15, so I left that out.
- I didn't run the app, so on-screen layout and length are judged from the markup, not from screenshots.
