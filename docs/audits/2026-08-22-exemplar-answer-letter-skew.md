# Exemplar answer-letter skew — all eight cert packs

**Date:** 2026-08-22
**Status:** Diagnosed. **Not fixed — blocked on the evidence gate below.**
**Surfaced by:** the whole-branch review of v8.14.0 (Sec+ obj 2.1 lesson), which flagged it for Sec+ only. Widening the check found it in every pack.

---

## The finding

Curated exemplars are few-shot references injected into the question-generation prompt. `_formatExemplarsForPrompt` (app.js) emits `Answer: <letter>` for each one, so the generator sees which letter was correct.

Across all eight packs the correct answer is almost never D.

| Pack | n | A | B | C | D |
|---|---|---|---|---|---|
| ai900 | 199 | 38.7% | 51.8% | 8.5% | **1.0%** |
| aplus-core1 | 189 | 68.8% | 23.8% | 7.4% | **0.0%** |
| aplus-core2 | 185 | 70.8% | 26.5% | 2.2% | **0.5%** |
| az900 | 179 | 21.2% | 60.3% | 15.6% | **2.8%** |
| clfc02 | 166 | 9.0% | 41.0% | 38.0% | 12.0% |
| netplus | 297 | 43.1% | 39.4% | 15.8% | **1.7%** |
| sc900 | 164 | 3.0% | 73.2% | 23.2% | **0.6%** |
| secplus | 285 | 32.3% | 44.2% | 21.4% | **2.1%** |
| **pooled** | **1664** | **37.0%** | **44.2%** | **16.3%** | **2.4%** |

Pooled chi-square against a uniform expectation is **732** with 3 degrees of freedom. The critical value at p=0.001 is 16.3. D appears at **9.6%** of its expected rate.

The per-pack distributions are not merely D-light, they disagree with each other: `aplus-core1` and `aplus-core2` are A-heavy at ~70%, `sc900` is B-heavy at 73.2% with A at 3.0%. `clfc02` is the only pack with a defensible spread, and it is the only one where D is not vanishing.

This is consistent with each pack's exemplars having been authored in bulk by a model that defaults to early letters, with nobody checking the distribution afterwards.

## Why it might matter

Two facts establish the exposure:

1. **The generator sees the letters.** `_formatExemplarsForPrompt` emits an `Answer:` line per exemplar. `_pickExemplarsForTopic` draws 3 per run, so every generation call carries three worked examples of which letter tends to be right.
2. **Nothing shuffles options afterwards.** There is no per-question option shuffle anywhere in the serve path — the letter the model picks is the letter the learner sees. (`app.js:3933` shuffles which *questions* are drawn from a bank; `app.js:5123` shuffles topics. Neither touches option order.)

If the skew propagates, generated questions become partly guessable by position, which is a direct quality problem for paying users.

## Why it might not matter

The generation prompt already contains an explicit counter-instruction at `app.js:4682`:

> `- Vary the correct answer letter across questions`

So this is an explicit instruction competing with an implicit few-shot pattern. Which one wins is **not** answerable from the code. It is an empirical question about model behaviour.

## The gate — do not skip it

**Do not rebalance 1,664 exemplars on theory.** If the model already obeys the explicit instruction, the bank's skew never reaches a user and the rebalance is pure churn with real regression risk (every explanation references option letters and would have to change in lockstep).

`scripts/exemplar-letter-bias-test.js` settles it with a controlled A/B — identical prompt, identical model, differing only in whether the exemplar block is present:

```bash
ANTHROPIC_API_KEY=sk-ant-... node scripts/exemplar-letter-bias-test.js
```

Roughly $0.02–0.05 on Haiku. Writes nothing, touches no app state. Flags to widen it: `--cert netplus`, `--batches 8`, `--n 10`.

It reports one of three verdicts:

| Outcome | Meaning | Action |
|---|---|---|
| Arm B materially more skewed than arm A | The exemplars are causing it | Rebalance the bank |
| Both arms skewed | The model skews regardless; exemplars are not the cause | Fix belongs in the prompt or a post-generation shuffle — **leave the bank alone** |
| Neither arm skewed | The instruction is working; skew never reaches users | Close as non-issue |

Note the middle outcome. It is the one that would make a bank rebalance actively wasteful, and it is entirely plausible.

## If a rebalance is warranted

- **Swap option positions, never rewrite content.** Most affected exemplars have order-neutral options — bare actor names, short noun phrases — where moving the correct text to D costs nothing.
- **Explanations reference option letters** (`(B) Wrong — …`). Every one must be updated in the same edit or the entry becomes incoherent.
- **Multi-select entries key `answers` as an array** and may carry options past D. Handle separately; they are a small minority.
- **The domain-distribution guard** (`tests/uat/120-cert-pack-architecture-secplus-metadata.js:664`) counts `"objective":"N.M"` by regex. Option-order swaps must not touch objective tags. If it trips, trim rather than widen — founder decision 2026-07-27.
- Packs use **two different serialisations**: `secplus`/`az900` use the compact JSON-string form (`"answer":"B"`), the other six use the JS object form (`answer: "B"` or `answer: 'B'`). Any tooling must handle both.
- UAT baseline is 5008/5008.

## Cheaper alternative worth pricing first

If the A/B shows the model skews on its own, a **post-generation option shuffle** fixes the user-visible problem for every pack at once, in one place, without touching any content — and it would also neutralise any future authoring drift. It would need to permute the options and remap both `answer` and every letter reference inside `explanation`, which is the hard part and why it is not obviously cheap.

## Related

`docs/superpowers/specs/2026-08-22-secplus-threat-actors-design.md` — where this was first recorded, Sec+ only.
`.superpowers/sdd/progress.md` — the v8.14.0 whole-branch review that surfaced it.

---

## Addendum (2026-08-22, post-v8.15.0): a second generator-visible cue — correct-is-longest

The v8.15.0 whole-branch review measured a second cue on the same exposure path. Across the 25 MCQs newly authored in the v8.14.0 + v8.15.0 lessons, the correct option is the **longest** in 16 (64%, vs 25% chance, p≈0.001) — despite a per-item authoring rule against it and three review fix rounds. The cue only exists as a distribution, which is why per-item review kept missing it.

Consequence for this audit: when the A/B test runs, letter position is not the only axis worth reading off the generated output — record option lengths too. And if a rebalance pass ever happens, it should fix both axes in one sweep: letters by swapping option positions, length by **padding distractors** (never trimming keys — their length is usually the discriminating rationale).

The hedged-correct/absolute-distractor axis was measured clean pool-wide (absolutes: 4/39 correct options vs 11/107 distractors — statistically identical).

---

## Addendum 2 (2026-08-22, post-v8.17.0): per-topic D=0 breakdown — the actionable data

The v8.17.0 whole-branch review recomputed the skew against **four-option MCQs only** (322 of them), which is the population the generator actually imitates:

**A 101 / B 135 / C 71 / D 15 — D at 4.7%.**

The decisive finding is not the aggregate but the **per-topic** distribution. Seven of the twelve largest topics have **D = 0 outright**:

| Topic | n | D |
|---|---|---|
| Security Monitoring & SIEM | 25 | 0 |
| Cryptography Fundamentals | 22 | 0 |
| Security Controls | 21 | 0 |
| Threat Actors & Motivations | 17 | 0 |
| Network Security Architecture | 16 | 0 |
| Network Attacks | 16 | 0 |
| Risk Management | 9 | 0 (also C = 0) |

This matters because `_pickExemplarsForTopic` draws its three few-shot references from the **exact-topic tier first**. So a generation run on any of those topics shows Haiku three worked examples in which D is never correct — a far stronger signal than the pooled 4.7% suggests.

**Counter-evidence from the same day:** the four topics touched by the v8.14.0–v8.17.0 lessons are the only ones with sane D representation — Social Engineering A4/B7/C8/D3, Attack Vectors A5/B5/C3/D4, Audits & Assessments A2/B3/C5/D2, IAM A3/B2/C5/D1. **Nine of the pack's fifteen D-keys were authored today.** Deliberate letter targets work; the problem is everything authored before them.

### Consequence for the remedy

If the A/B test shows the exemplars are driving generated-answer position, the fix is a **letter-rotation pass over existing items in the seven D=0 topics** — swapping option order on order-neutral items and updating the letter references inside their explanations. That is materially cheaper and lower-risk than the pack-wide rebalance this audit originally contemplated, and it targets exactly the topics where the few-shot signal is most degenerate.

Run the A/B first. This addendum tells you where to aim if it comes back positive.
