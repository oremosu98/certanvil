---
tags: [decision, convention]
up: "[[Decisions MOC]]"
status: adopted
updated: 2026-07-18
---
# Model Routing — Fable Plans, Sonnet Executes

Adopted 2026-07-18 (founder + Fable, refined from a GPT-5.6 draft). Generalizes the per-plan model split first recorded in [[2026-07-17-appjs-incremental-extraction]].

## Core rule

**Fable removes uncertainty. Sonnet implements. Fable reviews. Fable never touches implementation surfaces.**

No model may override this because a task is hard, urgent, blocked, or "small." When the rule can't hold, halt and consult the founder. Never silently break it.

## Scope

Governs **dev sessions** (Claude Code / agent sessions working on this repo). It does NOT govern the app's runtime three-way Claude split (Haiku generates, Sonnet validates + teaches) — that is product architecture, documented in CLAUDE.md §Architecture.

"Fable" = any Mythos-class model; "Sonnet" = the standard executor tier. Other models (Opus, Haiku) are not executors — routing anything to them requires explicit founder direction, recorded in the plan header.

## The surface table

The execution ban is defined by **file surfaces**, not by "any file edit":

| Sonnet-only (implementation) | Fable-permitted (planning / design) |
|---|---|
| `app.js` · `features/` · `index.html` · `styles.css` · `dg-system.css` · `sw.js` · `lib/` · `cloud-store.js` · `auth-state.js` · `migration.js` · `certs/` · `landing/` · `supabase/` · `tests/` · `scripts/` · `vercel.json` · `package.json` | `docs/` (specs, plans, ADRs, conventions) · `mockups/` + `design/` · `CLAUDE.md` / `CONTEXT.md` bookkeeping · `.claude/` (skills, briefs) · memory · GitHub issues / boards |

**Mockup guard:** mockups are design-phase work — Fable builds them and runs the 4-stage visual pass ("mockups ARE the build"). But the *faithful lift* into `index.html`/`features/` is Sonnet's, and Fable may not "just adjust" the lifted version during review — lift defects are review findings, handed to Sonnet.

## Routing — three categories, mapped to our lanes

**A — Sonnet direct.** Small, clear, localized, fast-lane, follows an existing pattern. Examples: copy/exemplar/CSS-token tweaks, a bug with an obvious root cause, adding UAT checks. No plan, no routing record — the gate stack (pre-commit UAT, tech-debt ratchet, ship checklist, live-verify) is the safety net.

**B — Fable plans, Sonnet executes.** Multi-file, new feature, design decisions, non-obvious bug investigation. Runs the existing pipeline: brainstorming → spec → mockups + 4-stage visual pass (if user-facing) → writing-plans (all Fable) → executing-plans inline or SDD (**Sonnet session** — subagents inherit Sonnet; Fable never orchestrates implementation) → Fable review where warranted.

**Gated-lane surfaces (schema / money / auth / service worker — see [[ENVIRONMENT_STRATEGY]]) are always Category B, and Fable review of the result is mandatory, not optional.**

**C — halt and consult the founder.** Triggers: anything risking user state in Supabase or localStorage; prod config flips (e.g. `onboarding_enabled`); irreversible migrations; Sonnet failing twice on the same underlying problem after one Fable replan; Fable concluding it would need to execute to finish safely; scope expanding materially beyond the approved plan. Category C never means "Fable executes" — it always means stop, preserve state, explain the blocker, present options + a recommendation, wait.

**Tie-breaker: unsure between A and B → it's B.**

## Execution & escalation

Sonnet execution discipline is enforced by the existing gate stack — pre-commit UAT + safety scan, `tests/tech-debt.js`, [[SHIP_CHECKLIST]], post-deploy live-verify per CLAUDE.md — plus the four repo-specific musts: **graphq-first** before touching `app.js` (`node scripts/graphq.js callers/impact`), **2-space feature-module indent** (UAT concat contract), **`bump-version.js` only** (never hand-edit versions), **never write localStorage on prod**.

**Stop-and-replan (Sonnet stops editing, reports, Fable replans):** repo differs materially from the plan · a needed abstraction doesn't exist · >2 important plan assumptions are false · the same approach fails twice · symptom-patching without a root cause · a gated-lane surface is discovered mid-task · tests reveal a design-level problem · acceptance criteria can't be met by the planned design. Fable must not take over execution during a replan.

**Tiny fixes:** when a Fable session root-causes something A-sized, it writes an exact patch note — file, line, before/after — into the plan or review doc; a Sonnet session applies it. There is no small-fix carve-out.

**Review loop:** Fable documents findings (severity, location, impact, recommended correction, blocking or not) → Sonnet evaluates and applies → Fable may re-review. Fable never fixes a finding directly.

**Escalation format (Category C halt), five lines:** task · what's done and validated · exact blocker · options · recommended option. Then wait.

## Safety valves

**Founder override.** This rule binds the models' defaults, never the founder. An explicit, in-the-moment instruction ("just fix it") authorizes that one fix, by that session, noted in the commit message. Overrides are per-instance — an *inferred* override ("they'd obviously approve") is a violation, and a repeated pattern of overrides means this doc should be edited, not eroded.

**Revert-first hotfix.** Prod broken after a ship → any session, any model, may `git revert <sha>` + bump + re-ship immediately. Reverting restores previously-shipped state and is not "implementation." The fix-forward then goes through normal routing (usually Category A on Sonnet). Fable authoring a hotfix is never the answer to time pressure — revert is.

## Routing record (Category B plan header)

Every Category B plan carries the header block precedent set by the #138 extraction plan:

> **Model split:** Planning = Fable · Execution = Sonnet (inline `executing-plans` / SDD — per plan) · Review = Fable (mandatory if gated-lane) · Reason: one line. Do not escalate execution to a larger model without the founder asking.

## Related
[[conventions]] · [[workflow]] · [[ENVIRONMENT_STRATEGY]] · [[SHIP_CHECKLIST]] · [[CLAUDE]] · [[2026-07-17-appjs-incremental-extraction]]
