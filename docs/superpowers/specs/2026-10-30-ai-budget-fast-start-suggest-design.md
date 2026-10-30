---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-30
tags: [spec, mobile]
---
# AI budget, a faster first question, and Suggest a cert

The founder approved all three on 30 Oct. They ship in the bundle, on the gated lane.

## 1. The app-wide AI limit, sized to a $100 a month budget
- Today `GLOBAL_DAILY_LIMIT` is 500 calls a day, matched to the testing-phase $20 a month Anthropic cap.
- **Measure first.** Read the real cost per quiz from Anthropic usage (generation plus checker calls),
  then set the daily limit so a month at that limit stays within **$100**. The numbers go in the plan.
- **Warn the founder.** Send one email when a day passes 80% of the limit (Resend, as `/api/notify` does).
- **A kinder message when the limit is hit:** "We're very busy right now. Your questions will be back
  shortly." This replaces "Too many requests". The Free 15 a day and Pro access are unchanged.
- **Founder action:** raise the Anthropic workspace cap from $20 to $100 a month. That is his account.

## 2. A faster first question
- **Measure.** Each quiz logs the seconds from Start to question 1, in the existing quiz-fill telemetry.
- **Start as soon as the first batch is checked.** Question 1 shows when the first batch has been
  written, checked by the second AI and passed the local checks. The other batches continue in the
  background. Checking is exactly as strict as before.
- **If the person catches up:** show "Next question coming…" briefly.
- **If a later batch fails:** the quiz ends shorter, with the existing short-set pill.
- **Works with:** the repeat filter (applied to each batch as it lands) and quiz resume (saves only
  questions already shown).
- **Rejected:** writing the next quiz in advance. It would spend Free users' daily 15 and AI money.

## 3. Suggest a cert
- **Where:** a "Suggest a cert" row in Settings → Study setup, and "Don't see yours? Suggest a cert"
  under the hub's "Add a cert".
- **The sheet uses the cert list's own look.** It has the same rows and badges.
  - Eyebrow "Help shape CertAnvil", heading "Which exam should we add next?", and the line "Tap any
    you'd study. We build the most-asked first."
  - **Typing your own exam:**
    - A search box, "Search or type an exam", filters the list.
    - Whatever is typed is offered as Suggest "ITIL 4" ("Not on our list yet") unless it exactly
      matches a listed exam, even when other rows partly match.
    - A picked typed exam stays in the list as "Your suggestion".
    - A permanent last row, "Something else? Type any exam in the box above", focuses the search
      box.
  - Exams are grouped by vendor: Cisco CCNA; CompTIA CySA+, PenTest+ and Linux+; AWS Solutions
    Architect Associate; Microsoft Azure Administrator; ISC2 CISSP; Google Cloud Associate Cloud
    Engineer. Each row has a badge, the name, "Vendor · code" and a tick ring.
  - The button counts the picks ("Send 2 suggestions"), or reads "Pick at least one". Under it:
    "Only we see these. One vote per exam."
  - Thanks screen: the chosen badges stacked, "Thanks, noted. When CCNA or CySA+ lands, we'll tell you."
- **Who:** signed in only. One vote per person per exam; a repeat vote is ignored. When an exam is
  added, everyone who asked for it is told.
- **Private:** no public counts.
- **Where the founder reads them:**
  - **Admin dashboard** (`landing/admin.html`, already admin-gated by `is_admin()`) gets a **Cert
    requests** section beside Users, Cert packs and Recent ships. It's a table sorted by votes, with
    columns for cert, total votes, new this week and last asked. Typed requests are normalised (case,
    spacing, a vendor prefix such as "Cisco CCNA" counting as CCNA), so the same exam isn't split across
    rows.
  - **Monday email** to the founder: "Cert requests this week: 12 new. Top: CCNA 41 (+5), CySA+ 18
    (+3). New typed ones: ITIL 4, CEH." It is sent through Resend, as `/api/notify` already does.
  - **"Tell them it's live"** on a row emails everyone who asked for that exam, once, when it's added.
- **Storage:** a new table. RLS lets a user insert their own votes and read only their own; admins read
  everything through `is_admin()`. It is a migration with a tested `-- ROLLBACK:` block.

## Rejected approaches
- **Public vote counts:** they look thin at launch, and counters are saas-gated (#123).
- **Anonymous suggestions from the website:** spam, and no way to say "it's added". The landing's
  "notify me" already covers coming-soon certs.
- **A plain chip picker:** rejected by the founder as basic. The cert-list rows replace it.
- **A fixed bigger AI limit:** set it from the measured cost and the budget instead.

## Related
[[2026-10-30-why-score-bookit-repeats-design]] · [[2026-10-30-my-certs-hub-design]] · [[Mobile MOC]]
