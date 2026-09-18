---
name: secplus-sweep
description: The study-notes → exemplars pipeline. Reads Simi's Security+ notes in Notion, works out for itself what is new, decides what the cert pack has room for, authors the batch, and ships it. Use on the scheduled Wednesday/Sunday runs, whenever Simi says "run the sweep" / "ship it" / "any new questions from my notes", and whenever he mentions he has been studying and wants the app updated. Do NOT use for engine, PBQ, Sim Lab or gated-lane work.
---

# Sec+ Notes Sweep

Simi studies Sec+ daily and writes it up in Notion. He is not going to tell an agent what changed — that friction is exactly what this exists to remove. **Work it out yourself. Do not ask him what he studied.**

Established 2026-09-18. Founder decisions that bind this skill:

| Decision | Setting |
|---|---|
| Cadence | **Wednesday and Sunday**, plus whenever he asks |
| Ship gate | **He says go.** Author, check and stage unattended; then one short message |
| Overflow routing | **Your initiative.** Route it, don't narrate it |
| Study gaps | **Never raise them.** He explicitly asked not to be nagged about what he hasn't studied |

That last one is a standing instruction, not a preference. The pipeline handles a thin domain by routing around it silently — it does not tell him to go study.

## The sources

Two Notion pages, nothing else (hub page checked 2026-09-18):

- Part 1 — `3575bcea-ddab-81c9-8f2c-d9586d0c726c`
- Part 2 — `3c45bcea-ddab-8192-9f1d-e7d19e041a94`

Both are large; `notion-fetch` will spill them to a file rather than return them. That is fine and expected — decode and save:

```bash
python3 -c '
import json,sys,pathlib
d=json.load(open(sys.argv[1])); pathlib.Path(sys.argv[2]).write_text(d["text"])' <spill-file> <scratch>/secplus-part2.md
```

## The steps

### 1. Sweep

```bash
node scripts/notes-sweep.js --cert secplus \
  --notes <scratch>/secplus-part1.md --notes <scratch>/secplus-part2.md
```

Read the output before deciding anything. It gives you three things: how much room each domain has, what is new or still outstanding, and which concepts in each section are **not yet keyed** (i.e. never the correct answer anywhere — a term sitting in a distractor teaches nothing).

**UNMAPPED sections are the one thing needing a human.** New topics Simi writes will not be in `docs/research/secplus-topic-domain-map.json`, so they are reported and deliberately not queued. Read the section, decide its domain, add it to the map, re-run. Never let the script guess — the notes' own `## Domain` headings are unreliable (Part 2 has one at the top and 60+ unrelated sections beneath it), and mis-filing content breaks weak-topic targeting.

### 2. Take the top of the queue — one objective per batch

The queue is ranked by what the **pack** needs, not by what he studied most recently. Take the highest-scoring section, or two adjacent sections sharing an objective. **10–14 items.** Resist a bigger batch: the letter-spread and length-bias checks are statistical and a huge batch hides drift inside itself.

If the top item routes to `overflow`, its domain is at ceiling — author it as **retention concepts** instead (`retentionGapConcepts`). That channel has no cap and no domain gate, and reaches every generation surface rather than only the few-shot sample. Do this silently; it is not a problem and does not need explaining.

### 3. Author, gate, review

Follow **`exemplar-lane`** from its step 3 onward — it owns the house format, the binding content rules and the review loop. Do not re-derive them here, and do not write a spec or plan document.

The gate is not optional:

```bash
node scripts/exemplar-gate.js --cert secplus --version <next>
```

A gate failure is fixed by changing content, never by loosening the gate.

### 4. Report — short

One message. He is not reading a report:

> Made 11 new questions on Asset Management. Gate green, review clean. D4 −6.8pp → −4.1pp. Ship it?

No domain tables, no study advice, no explanation of routing decisions. If something genuinely needs his judgement, ask that one thing.

### 5. On "go"

Ship per `exemplar-lane` step 6 — bump, CHANGELOG row by hand, commit with the reasoning in the body (there is no spec, so the commit message *is* the record), push, wait for both CI workflows green, then verify live in prod. Remember prod is minified: `"objective":"4.2"` becomes `objective:"4.2"`.

Then close the loop:

```bash
node scripts/notes-sweep.js --cert secplus --notes ... --commit
```

and mark the shipped sections `shipped` in `docs/research/secplus-notes-manifest.json` so they leave the queue for good.

### 6. Notion

Standard Mindmatrix triggers. Tick a milestone only when its done-test is **observably** true — "the commit landed" is not "the questions are live". Generation smoke-testing is BYOK and belongs to Simi; leave that milestone open with the reason on the page rather than ticking it optimistically.

## The thing that will eventually bite

The bank is capacity-constrained. Every batch narrows the room for the next one, and adding to one domain pushes the others toward their floors. When the sweep reports a domain at `room: 0`, the answer is **not** to widen the guard — that was refused twice already (`docs/decisions/2026-07-31-secplus-d1-saturated-no-third-widening.md`). Route to retention concepts, and if the pack is genuinely full, say so plainly rather than shipping filler to keep a cadence.

## Related

`scripts/notes-sweep.js` · `scripts/exemplar-gate.js` · `.claude/skills/exemplar-lane/SKILL.md` · `docs/research/secplus-topic-domain-map.json` · `docs/research/secplus-notes-manifest.json`
