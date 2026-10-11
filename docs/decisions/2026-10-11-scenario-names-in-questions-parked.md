---
up: "[[Decisions MOC]]"
type: decision
status: parked
cert: all
updated: 2026-10-11
tags: [decision]
---
# Named people and made-up companies in generated questions: parked

## Context
On 11 Oct the founder asked for more scenario questions built around made-up people, companies and situations, "because the real exam loves doing that". It was analysed before building, five days before their SY0-701 sitting.

Findings, from the last saved Sec+ writer run (`scripts/generator-ab-results.json`, 8 Oct, Haiku 5.5, 95 questions):
- Exam Level questions already open with a short situation ("A development team needs…"). About a third carry the optional `scenario` field. Foundational questions never do, by design.
- The median stem plus scenario is 33 words long.
- One question in 95 possibly names a person, and none names a company.
- 38–45% use "best", "most" or "first" wording. (A first count of 8% only matched capitalised "BEST" and was wrong.) Only 13–24% pair that with a setup line, and about 1 in 38 is a real case with a setting and a constraint.
- The Sec+ exemplar bank (1,437 few-shot questions) has the same shape: median 27 words, 7 with a scenario field.

As far as we know, current CompTIA questions use roles and organisation types, not names. Older exams used "Joe" and "Ann". Microsoft exams use fictional companies (Contoso, Fabrikam) and AWS uses "A company…". This isn't verifiable, because live items are under NDA.

## Decision
Parked. Names alone add realism, not score, and changing the question writer in the founder's final exam week isn't a must-have.

## Why
What makes the hard exam items hard is context: an organisation, one or two constraints, and a BEST/FIRST/MOST choice where two options are defensible. Real cases like that are rare in what we generate. That is the part with real value, and the founder chose to hold the whole idea until after the exam.

## If picked up again
The plan that was proposed:
- **Prompt-only change in `_fetchQuestionsBatch` (app.js).** About 4 in 10 Exam Level and Hard questions become a short case: who, where, one or two constraints, then BEST/MOST/FIRST. Each case stays under about 60 words.
- **Names supplied by the code.** Each batch gets a rotating pool of fictional first names and company names, used on about a third of cases. Names must never hint at the answer.
- **Per-vendor voice.**
  - CompTIA exams: roles, with the odd name.
  - Microsoft exams: Contoso-style companies.
  - AWS: "A company…".
- **Gate.** Run `node scripts/generator-spot.js --cert secplus` with the founder's key, before and after the change. Ship only if the checker pass rate holds and the qualifier share rises to about a quarter or more.

## Affects
`_fetchQuestionsBatch` and `scenarioInstructions` in app.js, and the `questionExemplars` in each `certs/<cert>.js` pack.

## Rejected alternatives
- **Names on every question.** This isn't how current CompTIA items read, and it adds reading time without testing anything.
- **Rewriting the 1,437-question exemplar bank** in the case style. The bank strongly steers style, but this is too big a job for its payoff. A handful of new case-style exemplars would be the cheaper lever.
- **Hand-written case studies** (one fictional company threaded through a quiz). This costs a lot of authoring, and the cloud certs' Decision Lab already covers hand-written scenarios.

## Related
[[2026-10-11-exam-simulator-hardening-design]]
