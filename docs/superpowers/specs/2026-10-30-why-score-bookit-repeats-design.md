---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-30
tags: [spec, mobile]
---
# "Why this score?", the book-it checklist, and no repeat questions

From [[2026-10-30-persona-cert-stacker-gaps]] gaps 2 and 3 plus "Repeated questions across sessions".
The founder approved all three on 30 Oct. The repeats one is key: he saw repeats himself while
studying Security+. Ships in the bundle.

## 1. "Why this score?" (phones)
Tapping the readiness card on Home opens a sheet that uses numbers the score already computes:
- "553, likely between 505 and 600. Pass chance 8%."
- "Based on 1,240 answers across 41 of 50 topics."
- **Exam areas:** each domain with its share of the real exam and your accuracy, weakest marked.
- **How hard:** "62% of your answers were exam-level or hard."
- **Last full exam:** score and date, or "None yet".
- **How it works:** "We estimate your accuracy topic by topic, adjusted for how hard each question
  was, weight it like the real exam, and count topics you haven't studied as 40%."

## 2. Book-it checklist (replaces "Pass ready" / "Exam ready")
The label shows only when all four are true. The sheet lists the four with ticks:
1. Score clears the pass mark, even at the low end of its likely range.
2. 300 or more exam-level or harder answers.
3. Every exam area at or above the cert's pass line.
4. Two full timed exams at a pass in the last 14 days.

The sheet heading reads "Book it? Not yet · 1 of 4" or "Ready to book · 4 of 4". The score itself
is unchanged; only when the app says "ready" changes. That keeps it clear of readiness tuning (#139).

## 3. No repeat questions across days
Two causes found on 30 Oct:
- **Silent re-serve.** When generation fails, the app serves the last cached set for that topic,
  difficulty and count. Those are the exact same questions, with no notice.
- **No memory across quizzes.** Duplicates are only removed within one generation, so a narrow topic
  keeps landing on the same few facts.

The fix:
- **Remember what you've seen,** per cert: a short fingerprint of each question you answered in the
  last 30 days, capped at 1,500. It's kept on the device.
- **Drop near-repeats after generation** (same fingerprint, or nearly the same wording and the same
  right answer) and top up with fresh ones, as the existing retry-to-fill does.
- **Steer the writer away up front:** the request lists the last 20 questions seen on that topic as
  "already asked; cover something else".
- **No silent re-serve.** Cached questions are only used if they weren't answered in the last 7 days.
  Otherwise the quiz shows the normal "couldn't make new questions, try again" error.
- **Measure it:** count the near-repeats dropped and log them with each quiz, so the effect can be
  checked in production.
- **Out of scope:** resumed quizzes (they must be the same set, see [[2026-10-30-quiz-resume-design]])
  and mistake drills (they reuse your misses on purpose).

## Rejected approaches
- **A server-side question bank:** a bigger change. Device memory plus prompt steering fixes what he saw.
- **"Pass ready" based on the score alone:** that's the thin-evidence problem.
- **Changing the readiness formula:** frozen (#139). The checklist sits on top of it.

## Related
[[2026-10-30-persona-cert-stacker-gaps]] · [[2026-10-30-reminders-forecast-pbq-design]] · [[Mobile MOC]]
