# Scope Slice: CI — Brainstorm Round Graft (P00000)

## Parent Feature Area

`.github/scripts/core/` — CI orchestration layer

## Status

`implemented` — verified 2026-06-17 on tracking PR #87

---

## Goal

Wire the multi-participant brainstorm loop (Orchestrator → Spark → Skeptic) into
`phase-orchestrator.ts` so that CI workers run this exact chat-grade review before
stamping `complete` and calling `gh pr ready`. Laptop-off proof: PR → checks → merge
→ orchestrator opens next slice, all without a human steering.

---

## Exact Boundary

### Included

- `phase-orchestrator.ts` imports `runBrainstormRound()` from `./brainstorm-round`
  with a real Cursor `dispatch()` behind `BRAINSTORM_ROUND_ENABLED=true` (default off)
- Worker completion path calls `wait-for-required-pr-checks.sh quality,playwright,luxury-brand-gate`
  on the tracking SHA **before** `gh pr ready` — exit non-zero blocks ready
- Smoke: CI workflow on this tracking PR runs the graft with `BRAINSTORM_ROUND_ENABLED=false`
  (check-gate only) and confirms `gh pr ready` is blocked until checks pass

### Excluded

- `BRAINSTORM_ROUND_ENABLED=true` as default (stays off until smoke passes on this PR)
- Changes to `brainstorm-round.ts` itself (already on `main`)
- Any `apps/web` storefront changes

---

## Allowlist (files this slice may touch)

```
.github/scripts/core/phase-orchestrator.ts
docs/state/orchestration.planner-queue.json
docs/product/scope-slices/ci--brainstorm-round-graft.md
```

---

## Acceptance Criteria

1. `grep -n "runBrainstormRound\|brainstorm-round" .github/scripts/core/phase-orchestrator.ts`
   returns at least one import and one call site.

2. `grep -n "wait-for-required-pr-checks" .github/scripts/core/phase-orchestrator.ts`
   returns at least one `execFileSync` call inside the `phaseIsComplete` block.

3. `BRAINSTORM_ROUND_ENABLED` is read from env and defaults to `false`.

4. Running the orchestrator in coordinator mode with `ORCHESTRATOR_ENABLED=true` and
   `REPO=romain-zt/lenue-paris` exits 0 (no crash from the import).

5. The tracking PR checks (`quality`, `playwright`, `luxury-brand-gate`) are all green
   before `gh pr ready` is called — proven by `gh pr checks <PR> --watch` on the
   tracking branch reaching all-success before this PR is flipped to ready.

---

## Smoke Plan

| Step | Command | Expected outcome |
|------|---------|-----------------|
| 1 | Open tracking PR from orchestrator on this scope slice | Draft PR exists |
| 2 | `gh pr checks <tracking_PR> --watch` | `quality`, `playwright`, `luxury-brand-gate` all pass |
| 3 | Worker marks complete → orchestrator runs check gate | Gate blocks `gh pr ready` until step 2 green |
| 4 | All checks green → `gh pr ready` is called | Tracking PR becomes ready, auto-merge merges it |
| 5 | Post-merge: orchestrator runs with `BRAINSTORM_ROUND_ENABLED=false` | No dispatch, only check gate active |
| 6 | Set `BRAINSTORM_ROUND_ENABLED=true` on next slice's tracking branch | Round fires: Orchestrator → Spark → Skeptic via Cursor cloud |

Default-on only after step 6 smoke passes.
