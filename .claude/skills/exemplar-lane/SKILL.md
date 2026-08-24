---
name: exemplar-lane
description: The lightweight path for exemplar and retention-concept changes to a cert pack. Use whenever the work is ONLY adding, rewriting or fixing curated exemplars (`questionExemplars`) or retention concepts (`retentionGapConcepts`). TRIGGERS — the founder pasting study notes of any kind ("here are my notes on X", "potential exemplars off these notes", "more exemplars here", "we can author exemplars from this"), or asking for question coverage on a topic/objective, a wording fix to existing questions, a letter/length rebalance, or a coverage-gap check. Fires on pasted revision notes even when the word "exemplar" is absent. This skill REPLACES brainstorming → writing-plans → subagent-driven-development for this class of change; do not run those as well. Do NOT use for engine/logic changes, PBQ archetypes, Sim Lab seeds, schema, or anything on the gated lane.
---

# Exemplar Lane

Adding questions to a cert pack is a **Fast-lane data change**. It does not need a spec document, a plan document, or a multi-task subagent decomposition.

**Established 2026-08-22**, after five exemplar lessons (v8.14.0–v8.18.0) shipped in one day through the full heavyweight process. Reviewing what actually caught defects:

| What caught real defects | What caught nothing |
|---|---|
| Adversarial content review | The spec document |
| Scripted gates (guard, length, letters, counts) | The plan document |
| Cross-checking against live pack content | The SDD task decomposition |
| The coverage-delta measurement | The implementer subagents |

The specs and plans were transcription vehicles — the items were authored in them, then subagents were paid to copy them into the file. **This lane keeps the checks and drops the paperwork.**

## This lane wins over the global process skills

`superpowers:using-superpowers` instructs that brainstorming must run before any creative work, and `feature-lane` claims all CertAnvil work. **For exemplar-only changes, this skill supersedes both** — that is the whole point of it existing, it is recorded in `CLAUDE.md` → Decision rules, and project instructions outrank default skill behaviour.

Concretely: do not write a spec document, do not write a plan document, and do not decompose the work into SDD tasks. If you catch yourself about to author items into a plan file so that a subagent can copy them into `certs/*.js`, stop — write them into the pack directly. That round trip was the single largest waste in the six ships that produced this lane.

The design conversation still happens; it just happens in chat. Ask the scoping questions, state the delta you measured, get a yes, then build.

## When this lane applies

**Use it when the change touches ONLY:**
- `certs/*.js` → `questionExemplars`
- `certs/*.js` → `retentionGapConcepts`
- plus the version bump and CHANGELOG row that ship them

**Do NOT use it for** — these keep the full brainstorming → spec → plan → SDD sequence:
- Anything in `app.js`, `features/`, `index.html`, CSS, `lib/`, `sw.js`, `supabase/`, `tests/`
- PBQ archetypes, Sim Lab seeds, drill banks
- `domainWeights`, `topicDomains`, `topicResources`, `_pickExemplarsForTopic`, `_formatExemplarsForPrompt`
- Anything on the gated lane (see `ENVIRONMENT_STRATEGY.md`)

If a change starts in this lane and turns out to need a logic edit, **stop and switch lanes** — do not smuggle a code change through as content.

## The six steps

### 1. Measure the delta — never author blind

The single highest-value step. Twice in one day this stopped a redundant lesson: the founder's OSINT notes were already 4-keyed, and the watering-hole notes had four of five discriminations already tested.

For each concept the notes teach, check **is it keyed** (the correct answer somewhere), not just **is it mentioned**:

```bash
node -e '
const vm=require("vm"),fs=require("fs");const sb={window:{}};
new vm.Script(fs.readFileSync("certs/secplus.js","utf8")).runInNewContext(sb);
const A=sb.window.CERT_PACKS.secplus.questionExemplars;
["watering hole","drive-by","malvertis","EDR"].forEach(t=>{
  const re=new RegExp(t,"i");
  const men=A.filter(e=>re.test(JSON.stringify(e))).length;
  const keyed=A.filter(e=>{const k=Array.isArray(e.answers)?e.answers:[e.answer];
    return k.some(x=>re.test(e.options[x]||""));}).length;
  console.log(t.padEnd(20)+"mentions:"+men+"  KEYED:"+keyed);});'
```

For discriminations, check whether **both terms appear as options in the same item** — a term keyed once does not mean its traps are tested.

Report the delta honestly before proposing scope. "Most of this is already live" is a valid and valuable answer.

### 2. Choose the domain split deliberately

The domain guard is the one hard CI gate on content. Before authoring, model where the items land:

```bash
node scripts/exemplar-gate.js --cert secplus
```

The `floor headroom` line names the tightest domain and how many more items it can absorb. **Adding items to an over-target domain makes an under-target domain's deficit worse**, because the denominator grows — so a ship can fail a floor without adding a single item to that domain.

Where an item's objective genuinely allows a choice (a control can sit under mitigation *or* under the objective that owns the control), prefer the split that eases the tightest domain.

### 3. Author the items directly

Write them into `certs/*.js`. No intermediate document.

Binding rules, all learned from shipped defects:

- **Compact JSON, no space after any colon.** The guard counts `"objective":"N.M"` by regex.
- **mcq keys `answer`** (single letter); **multi-select keys `answers`** (array, plural — the runtime scorer's key).
- **House format:** why the answer is right → `(X) Wrong — …` for *every* distractor → a `Memory:` or `Exam clue:` closer.
- **Grounded:** explanations reference only details present in their own stem. (A "radar designs" invented specific shipped once.)
- **No absolutes the exam hedges.** "Never", "only", "always" have each produced a fix. Nation-states *do* act for financial gain; EOL products *do* occasionally get out-of-band patches.
- **Every distractor unambiguously wrong.** After padding a distractor for length, **re-verify it is still false** — a padded FIDO2 distractor once became factually true.
- **After ANY option edit, re-check length across ALL items**, not just the edited one — a fix once relocated a length cue onto an unchecked item.
- **Grep new persona names across the whole pack** before using them. A rename to fix an intra-lesson collision once created a worse cross-lesson one.
- **Vary the stem template.** The "pairing" template reached 8 uses before anyone counted; a second template reached 4.

### 4. Run the gate

```bash
node scripts/exemplar-gate.js --cert secplus --version 8.18.0
```

Thirteen checks. Every failure blocks. Advisory lines marked `REVIEW` are for a human read, not automatic failures.

**A gate failure is fixed by changing the content, never by loosening the gate.** If the domain guard trips, trim items — the founder's 2026-07-27 decision forbids widening it a third time.

### 5. One adversarial content review

This is the step that earns its cost. Dispatch **one** agent on a capable model with the diff and these instructions:

> Work each question cold before reading its explanation. For each: is the keyed answer the single best one? Argue the strongest case for every distractor and say whether it survives. Check factual accuracy against the objective. Check groundedness — does each explanation reference only its own stem? Flag absolutes the exam hedges. Then cross-check against the live pack: read the existing items and retention concepts on the same topics and flag anything the new content contradicts, in either direction.

Then fix what it finds and **re-review the fix** — three separate times today a fix introduced a new defect or relocated the one it fixed.

### 6. Ship

```bash
node scripts/bump-version.js <version> "<one-line description>"
```

Add the CHANGELOG row by hand. Commit, push, wait for **both** CI workflows to conclude green, then verify the content is actually live in prod:

```bash
curl -s "https://<cert>.certanvil.com/certs/<cert>.js?_cb=<version>" | grep -c "<source-tag>"
```

Remember prod is minified — `"objective":"2.2"` becomes `objective:"2.2"`.

**Working-tree discipline:** if uncommitted files are present that are not part of the ship, stash them by path before committing and pop them after — then confirm `git stash list` has no leftover. A stash was orphaned once and the founder's work was nearly lost.

## What still applies

- **Notion** — the Mindmatrix triggers are unchanged. New work agreed → project + milestones. Ship lands → tick what is *observably* true. A generation smoke test is BYOK and belongs to the founder; leave that milestone open with the reason written on the page.
- **The commit message carries the record.** No spec means the "why we scoped it this way / what we rejected" reasoning lives in the commit body. Write it properly — it is the only durable trace.
- **The acceptance test is generation, not a green suite.** Exemplars are few-shot references injected into the prompt, never served as questions. A bigger file and a green CI prove nothing about what a learner is asked.

## Related

`scripts/exemplar-gate.js` · `docs/audits/2026-08-22-exemplar-answer-letter-skew.md` · [[ENVIRONMENT_STRATEGY]] · [[SHIP_CHECKLIST]]
