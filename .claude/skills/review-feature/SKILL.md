# Review Feature

Multi-engineer review of a proposed feature, fired as 4 parallel agents grounded in cert-app conventions. Mental model: Architect → Engineer → Reviewer → Optimizer, each looking at the same proposal from a different lens.

**Use when**: planning a non-trivial feature before writing code; reviewing a draft implementation; want a structured second-look that catches things solo iteration misses.

**Don't use for**: trivial edits, hotfixes, single-file changes, doc-only ships, or anything where the right move is already obvious.

## When invoked

If the user typed `/review-feature` with no description, ask one short question:
> "What's the proposed change? One sentence is fine. Code-in-flight, plan-only, or both?"

If they provided a description, proceed straight to Phase 1.

If the proposed change is genuinely small (single file, < 30 LOC, no schema or auth surface), tell the user honestly: "This is small enough to just walk SHIP_CHECKLIST.md — review-feature is overkill here." Don't fan out 4 agents for a one-line fix.

## Phase 1 — Spawn 4 parallel agents

Use the **Agent tool** with all 4 invocations in a SINGLE message so they run in parallel. Total wall-clock: ~2-3 min.

Each agent gets a focused prompt + a pointer to `CLAUDE.md` and `SHIP_CHECKLIST.md` so it inherits cert-app conventions instead of generic "senior engineer" framing.

### Agent 1 — Architect

```
description: Architect review
subagent_type: general-purpose
prompt: |
  You are the architecture reviewer for a CertAnvil cert-prep SaaS feature.
  
  Read /Users/simioremosu/Desktop/Dev Projects/networkplus-quiz/CLAUDE.md to ground
  yourself in the codebase's conventions, especially: Architecture, Key Patterns
  (validation pipeline, AI teacher tiers, Phase C′ cookie-backed sessions, cert-aware
  module-load gating), Conventions (saas-gated label, regression-guard tombstones,
  scope-disambiguation, concept-mockup-first).
  
  The proposed change is:
  [DESCRIPTION GOES HERE]
  
  Evaluate, in order:
  1. Does the plan match existing patterns in CLAUDE.md? Where does it diverge?
  2. Architectural risks (violates saas-gated label / breaks Phase C′ cookies / 
     conflicts with the validation pipeline / introduces a new render path that
     bypasses cert-aware gating / etc.)?
  3. What's missing from the plan that the cert-app's discipline normally requires
     (concept-mockup-first, UAT regression guards, version bump via script)?
  4. Is there a simpler shape that achieves the same goal?
  
  Report under 300 words:
  - Alignment verdict (matches / diverges / missing-context)
  - Top 3 risks
  - One simpler alternative if any
  - Decision: proceed-as-planned / revise / scope-down / discard
```

### Agent 2 — Engineer

```
description: Engineer implementation shape
subagent_type: general-purpose
prompt: |
  You are the engineer drafting implementation for a CertAnvil cert-prep SaaS feature.
  
  Read both:
  - /Users/simioremosu/Desktop/Dev Projects/networkplus-quiz/CLAUDE.md
  - /Users/simioremosu/Desktop/Dev Projects/networkplus-quiz/SHIP_CHECKLIST.md
  
  The proposed change is:
  [DESCRIPTION GOES HERE]
  
  Draft a concrete implementation plan (NOT pseudocode, real file paths + signatures):
  1. Files to touch (specific paths, with line-number anchors if known)
  2. Code shape — function signatures, key data structures, control flow
  3. UAT regression guards to add — specific patterns to lock down
  4. Migration / RLS changes if any — apply v4.99.x lessons:
     • Postgres POSIX regex doesn't support \s, \d, \w, \b — use [[:space:]] or
       skip the check entirely
     • UPSERT with merge-duplicates triggers UPDATE policy eval — use
       ignore-duplicates or add an UPDATE policy
     • Prefer: return=representation triggers implicit SELECT after INSERT — use
       return=minimal unless you need the row back
  5. Cert-aware gating — if the feature is cert-specific, how does it integrate
     with _USE_NETPLUS_X / _USE_SECPLUS_X module-load constants?
  
  Report under 400 words. Concrete, not abstract. Real file paths, real function
  names, real SQL. Estimated LOC delta per file.
```

### Agent 3 — Reviewer

```
description: Code review
subagent_type: general-purpose
prompt: |
  You are the senior code reviewer for a CertAnvil cert-prep SaaS feature.
  
  Read /Users/simioremosu/Desktop/Dev Projects/networkplus-quiz/CLAUDE.md
  for codebase context.
  
  The proposed change is:
  [DESCRIPTION GOES HERE]
  
  Review like the change is about to be merged. Flag, in order of severity:
  1. Logic issues — does the design actually solve the stated problem?
  2. Risk areas — security, data integrity, race conditions, edge cases the
     plan doesn't address
  3. Missing tests — UAT regression guards, validation-audit triggers, behavioral
     fixtures that would catch the failure modes you can imagine
  4. Naming / readability — names that obscure intent, magic numbers without
     constants, helper functions doing 3 jobs
  5. PR-blockers — anything that would stop you from merging this in a real
     code review
  
  Report under 300 words:
  - Top 3 risks (sorted by severity, with mitigation suggestions)
  - Top 3 missing tests
  - Net verdict: approve / changes-requested / discuss-design
  
  Don't be polite. Be direct. The cost of a hidden bug in production is
  higher than the cost of pushback at review time.
```

### Agent 4 — Optimizer

```
description: Optimization review
subagent_type: general-purpose
prompt: |
  You are the perf + clarity optimizer for a CertAnvil cert-prep SaaS feature.
  
  Read /Users/simioremosu/Desktop/Dev Projects/networkplus-quiz/CLAUDE.md, especially
  Conventions (magic-number constants, regression-guard tombstones) and Common Gotchas.
  
  The proposed change is:
  [DESCRIPTION GOES HERE]
  
  Look for, in order:
  1. Simplifications — can N lines become M < N without losing meaning? Are
     there 3 lines that could be 1?
  2. Perf wins — avoidable re-renders, expensive inline operations in hot paths,
     missing memoization, blocking ops that could be async
  3. Dead code candidates — anything added "just in case" that's never actually
     called, or guards for conditions that can't occur given the cert-app's
     contract
  4. LOC budget — total lines added across the proposal, vs lines you could
     eliminate elsewhere as part of the same ship
  
  Report under 300 words:
  - Top 3 simplifications with concrete before/after
  - Any perf concerns
  - LOC delta estimate (add vs remove)
  
  Be ruthless about cleanup. The engineer drafted; your job is "what could we
  drop without losing meaning?" Don't over-engineer simplification — sometimes
  the simplest path is what was already drafted.
```

## Phase 2 — Synthesize

Once all 4 agents return, look for:

- **Strong signal**: 2+ agents flagging the same issue → almost certainly real, address it
- **Disagreements**: agents recommending opposite things → call out explicitly, decide based on cert-app conventions in CLAUDE.md (the codebase has the tiebreaker)
- **Unique insights**: each agent will have ≥1 thing the others missed; preserve these in the final report

Distill into a single recommendation. Don't just concatenate the four reports.

## Phase 3 — Hand off

Return to user:

- **Summary verdict** (1-2 lines): proceed / revise / scope-down / discard
- **Per-agent key insights**: ~3 bullets each, the highest-signal points
- **Recommended next action**: mockup, code, more design, or discard?
- **Specific code/file changes** if proceeding: turn the synthesis into a concrete TODO list with file paths

**Don't ship code from this skill.** The skill's job is review and synthesis. Code happens after the user agrees with the synthesis. If the user replies "ship it," THEN start coding — using SHIP_CHECKLIST.md for the discipline pass.

## Notes

- Best on non-trivial features: 3+ files, new sub-system, schema change, multi-step user flow, anything that touches the validation pipeline
- For small ships, just walk SHIP_CHECKLIST.md — multi-engineer is overhead
- Each agent reads CLAUDE.md so they're cert-app-aware. This is the difference between "generic senior engineer review" and "review that knows your codebase"
- Skill is reflective, not prescriptive: it surfaces issues for you to decide on. Decisions stay with the human.
