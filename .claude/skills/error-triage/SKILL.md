---
name: error-triage
description: Query client_errors, group by fingerprint, rank by count × recency × severity, and produce a founder triage brief with RCA candidates. Use when the user asks about production errors, error triage, RCA, or the weekly groundskeeper sweep runs.
---

# Error Triage Skill

Produces a structured triage brief from the `client_errors` Supabase table. Run it when the user asks about production errors, error triage, RCA analysis, or when the groundskeeper sweep fires.

## Step 1 — Query the table

Run via Supabase MCP `execute_sql` (project: CertAnvil's Supabase project):

```sql
select
  fingerprint,
  type,
  message,
  page,
  version,
  count(*) as n,
  min(created_at) as first_seen,
  max(created_at) as last_seen
from client_errors
group by 1, 2, 3, 4, 5
order by n desc, last_seen desc
limit 40;
```

Fallback (if MCP unavailable): paste the same SQL into the Supabase SQL editor at your project dashboard → Table Editor → SQL editor.

## Step 2 — Split client vs server rows

Separate the result into two groups:
- **Client errors** — `type` is anything except `'server'` (e.g. `'runtime'`, `'promise'`, `'api:timeout'`, `'api:network'`, `'api:server'`, `'resource'`, `'swallowed:*'`)
- **Server errors** — `type = 'server'` (inserted by `logServerError` from `api/ai/generate.js`, `landing/api/notify.js`, etc.)

## Step 3 — Filter muted fingerprints

Skip any fingerprints listed in the `## Muted fingerprints` section below. Start empty — add entries when the founder decides a fingerprint is known-noise.

## Muted fingerprints

_(none yet — add one per line as `- fingerprint-string-here`)_

## Step 4 — Produce the triage brief

Format:

```
── Error Triage Brief — <date> ──────────────────────────────

CLIENT ERRORS (top groups)
┌─────────────────────────────────────────────────────────────┐
│ #1  <fingerprint> (n=X, last: <date>)                       │
│     Type: <type> · Page: <page> · Version: <version>       │
│     Message: <message>                                      │
│     Hypothesis: <1-line root-cause candidate>               │
│     Action: FIX NOW / WATCH / MUTE                         │
└─────────────────────────────────────────────────────────────┘
... (repeat for top 5 client groups)

SERVER ERRORS (top groups)
... (same format, top 3 server groups)

TOTALS
  Client rows in table (last 40): X
  Server rows in table (last 40): Y
  Total table row count: run `select count(*) from client_errors;` if needed

──────────────────────────────────────────────────────────────
```

**Action guidance:**
- **FIX NOW** — n ≥ 10 in last 7 days, or affects a critical flow (quiz generation, auth, cloud sync)
- **WATCH** — n 3–9, or single occurrence of a critical-looking error
- **MUTE** — known-benign noise (e.g. extension conflicts, old SW version churn); add to Muted fingerprints above

## Step 5 — Present and offer next steps

Present the brief to the founder and offer:
1. "Create a fix task for [fingerprint]" — spin a spawned task targeting the root cause
2. "Add [fingerprint] to Muted fingerprints" — for known-noise entries
3. "Show full extra JSON for [fingerprint]" — query the raw `extra` column for diagnosis

## Integration with groundskeeper

When the groundskeeper sweep invokes this skill, include the triage brief in the Monday digest under a "Error triage" section. Use the same muted-fingerprint list so the digest stays signal-only.
