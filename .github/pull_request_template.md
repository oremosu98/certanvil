<!--
  CertAnvil PR template. PRs are the GATED LANE only — fast-lane changes
  (UI/copy/exemplars/docs) go trunk-based direct to main, no PR needed.
  Full spec: ENVIRONMENT_STRATEGY.md
-->

## What & why

<!-- One or two sentences. The "why" matters more than the "what". -->

## Risk tier

> Does this change touch the **database schema, money, auth, or the service worker?**

- [ ] This is a **gated-lane** change (one or more triggers below apply) — that's why this is a PR
- [ ] (If you're seeing this template for a pure fast-lane change, you probably didn't need a PR — consider trunk-based)

**Gated triggers that apply** (check all that match):

- [ ] `supabase/migrations/*` — schema change
- [ ] `landing/api/stripe/*` — payments
- [ ] `landing/api/{ai,diagnostic}/*` — cost / quota / abuse surface
- [ ] `auth-state.js` / `cloud-store.js` / `lib/supabase.js` — session + cloud-state machine
- [ ] `sw.js` — service worker (cache-poisoning + slow-rollback risk)
- [ ] RLS policy / entitlements / `is_pro()` / quota RPC

## Gated-lane checklist (must all be ✅ before squash-merge)

- [ ] **Preview deploy** came up green and I smoke-tested the actual change on the preview URL
- [ ] **Supabase branch DB** auto-provisioned; I ran the migration there and it applied cleanly
- [ ] If a migration: it carries a `-- ROLLBACK:` block AND I tested the rollback on the branch DB (not just wrote it)
- [ ] `node tests/uat.js` green locally + CI `UAT + Playwright` check green on the PR
- [ ] Pre-prod activation accounted for: env vars set in the right Vercel scope, endpoints graceful-503 if a var is missing (deploy never breaks)
- [ ] Stripe (if touched): preview uses `sk_test_…` only; live keys are Production-scope only
- [ ] Rollback runbook entry exists / still accurate for this failure mode (ENVIRONMENT_STRATEGY.md)

## Post-merge

- [ ] Confirm Supabase applied the migration to **prod** (not just the branch)
- [ ] Smoke-test prod (incognito) for the gated path
- [ ] CLAUDE.md version-history row + version bump done (if user-facing/contract-changing)

<!--
  Solo-founder reality: this isn't peer review. It's the forced pause +
  green checklist. You approve your own PR as the explicit "I verified
  this" gate, then squash-merge (auto-tears-down branch DB + preview).
-->
