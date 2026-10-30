---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-30
tags: [spec, mobile]
---
# AI budget, a faster first question, and Suggest a cert

The founder approved all three on 30 Oct. They ship in the bundle, which ships on the gated lane.

## 1. The app-wide AI limit, sized to a $100 a month budget
- Today `GLOBAL_DAILY_LIMIT` is 500 calls a day, matched to the testing-phase $20/month Anthropic cap.
- **Measure first:** read the real cost per quiz from Anthropic usage (generation plus checker calls),
  then set the daily limit so a month at that limit stays within **$100**. The numbers go in the plan.
- **Warn the founder:** one email when a day passes 80% of the limit (Resend, as `/api/notify` already
  does).
- **A kinder message if the limit is hit:** "We're very busy right now. Your questions will be back
  shortly." Today it says "Too many requests". The Free 15 a day and Pro are unchanged.
- **Founder action:** raise the Anthropic workspace cap from $20 to $100 a month. This is the
  founder's account, so it's done by him, not by code.

## 2. A faster first question
- **Measure:** each quiz logs the seconds from Start to question 1, in the existing quiz-fill
  telemetry.
- **Start as soon as the first batch is checked.** Question 1 shows when the first batch has been
  written, checked by the second AI and passed the local checks. The other batches carry on in the
  background. Checking is just as strict as before.
- **If the person catches up:** "Next question coming…" shows briefly.
- **If a later batch fails:** the quiz ends shorter, with the existing short-set pill.
- **Works with the other bundle items:**
  - The repeat filter applies to each batch as it lands.
  - A resumed quiz saves only questions already shown.
- **Rejected:** writing the next quiz in advance. It spends Free users' daily 15 and AI money on quizzes
  that may never be taken.

## 3. Suggest a cert
- **Where:** a "Suggest a cert" row in Settings → Study setup, and "Don't see yours? Suggest a cert"
  under the hub's "Add a cert".
- **What:** tick any of a short list of likely certs (CCNA, CySA+, AWS Solutions Architect, Azure
  Administrator (AZ-104), CISSP, Linux+, PenTest+, Google Cloud ACE), or type one under "Other", then
  Send.
- **Who:** signed in only. One vote per person per cert; a repeat vote is ignored.
- **Afterwards:** "Thanks. We read every suggestion. If we add CCNA or CySA+, we'll let you know."
  When a cert is added, everyone who asked for it is told.
- **Private:** no public counts. The founder reads a tally view sorted by votes, starting as a
  database view; an admin page can come later.
- **Storage:** a new table with RLS that lets a user insert their own votes and read only their own.
  It's a migration with a tested `-- ROLLBACK:` block, on the gated lane.

## Rejected approaches
- **Public vote counts:** they look thin at launch, and counters are saas-gated (#123).
- **Anonymous suggestions from the website:** spam, and no way to say "it's added".
  The landing's "notify me" already covers coming-soon certs.
- **A fixed bigger number for the AI limit:** set it from the measured cost and the budget instead.

## Related
[[2026-10-30-why-score-bookit-repeats-design]] · [[2026-10-30-my-certs-hub-design]] · [[Mobile MOC]]
