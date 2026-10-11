---
up: "[[Drills MOC]]"
type: spec
status: active
updated: 2026-10-11
tags: [spec, questions, generator, quality]
---
# Judgement-case questions (design)

**Agreed 2026-10-11** ("lets do it"), five days before the founder sits SY0-701 aiming for 900. This is the narrowed form of [[2026-10-11-scenario-names-in-questions-parked]]: the judgement format, without names.

## Problem
Generated Exam Level questions mostly test recognition ("which malware type is this?"). CompTIA's hardest items are judgement calls: a setting and a constraint, two options that are both sound, and the situation decides which one is best. The founder scores 92.6% at Exam Level and 75% on Hard.

The last saved run of the live writer (8 Oct, Haiku 5.5, two arms, 75 Exam Level and Hard MCQs) shows the gap:
- **"Best / most / first" wording is already common:** 38–45% of questions use it. A first count of 8% only matched the capitalised "BEST" and was wrong. The founder was told the 8% figure before approving, and was given this correction.
- **A setup line plus a best/first question is less common:** 13–24%.
- **A real case is rare:** about 1 question in 38 per arm combines an organisation, a constraint and a best/first question (a rough keyword count).

## Change (prompt only, every cert)
- A **JUDGEMENT CASES** rule is added to the scenario block of the writer prompt. About 4 in 10 Exam Level and Hard MCQs become a short case.
  - **The `scenario` field gives:** who (a role), where (a type of organisation) and one or two constraints the answer depends on.
  - **The `question` asks for:** the BEST, MOST appropriate, MOST likely or FIRST option, in the vendor's style.
  - At least two options must be sound practice in general, and the constraints make exactly one of them best.
  - The explanation names the runner-up and the constraint that rules it out.
  - Scenario plus question stays under about 60 words.
  - Roles and organisation types only: no people's names or brand names.
  - Foundational questions stay plain, and multi-select is untouched.
- **The old "30-40% optional scenario" sentence is replaced.** Scenarios are now mainly the setup of judgement cases, and are still allowed elsewhere when context disambiguates.
- **The block moves out of app.js** into `features/quiz-engine.js` as `_scenarioPromptBlock(certCode, vendor)`. app.js is at its line cap.
  - `_fetchQuestionsBatch` calls the block and still drops it on the malformed-JSON retry.
  - The exemplar bank (short stems) is left alone. The rule tells the writer that the examples show format, not the mix.
- **No UI change.** The scenario block already renders above the question.

## Gate (before it ships)
`node scripts/generator-spot.js --cert secplus --compare` captures the real prompts from both the live code (a temporary checkout of HEAD) and the changed working tree. It sends each through the live writer and the app's Sonnet checker, prints both summaries side by side, and prints a verdict. The founder runs it with their own key, at about $0.60 per run.

It ships only if all three of these hold:
- **Case share:** at least 35% of Exam Level and Hard MCQs have a `scenario` and a best/most/first/least question, against 13–24% today.
- **Case share rise:** at least 10 points above the live code's share in the same run.
- **Checker pass rate:** at least 90%, and no more than 5 points below the live code's rate.

The script also reports the median and longest question length, the rough "real case" count (organisation plus constraint words), and any named people, for a human read.

## Result (founder's run, 2026-10-11) and the override
Each version produced 50 of 60 questions. In both, one batch of 10 failed on JSON, which the app's retry ladder recovers but the script doesn't.

| | Live (HEAD, v8.164.0) | Changed |
|---|---|---|
| Passed the Sonnet checker | 38/50 = 76% | 45/50 = 90% |
| Judgement cases (Exam/Hard MCQs) | 5/35 = 14% | 10/33 = 30% |
| Median / longest length | 30 / 77 words | 43 / 59 words |

The verdict was DON'T SHIP: the case share was 30%, against the 35% floor. The other two checks passed: +16 points, and the checker rate went up.
- **The floor is inside the noise:** with 33 questions, 30% and 35% can't be told apart.
- **Live's low rate came mostly from one topic batch:** threat actors, with 7 rejections.
- **A human read of all 10 cases:** the checker kept every one. Eight are real judgement calls where a constraint rules out a sound runner-up. One is a classification question with a story, and one has a setup line that doesn't change the answer.

**The founder overrode the 35% floor and said "ship it". Released as v8.165.0.**

## Cross-platform
Prompt text only: no runtime, storage or UI change, so Desktop, Safari, mobile web and iOS Capacitor are unaffected.

## Testing
- UAT: the block exists in quiz-engine.js and the writer prompt calls it. The judgement rule carries its key clauses (the share, BEST/FIRST, two sound options, runner-up in the explanation, under 60 words, no names). Foundational is excluded. The old prompt tests still pass.
- A capture-only run (no key) confirms that the real captured prompt contains the rule.

## Rejected approaches
- **Names and made-up companies:** parked. As far as we know, current CompTIA items use roles, and a name doesn't change difficulty.
- **Rewriting the exemplar bank into case style:** too big a job this week. Revisit if the prompt rule alone doesn't move the share.
- **Changing the Hard difficulty definition:** "Hard" today means edge cases. Mixing judgement into its definition would blur two things the founder's stats track separately.
- **Shipping without a gate:** the checker is the safety net, but in the final exam week only the founder's own numbers should decide.
