# Feature Area: CI Orchestration

## What this area owns

The GitHub Actions pipeline that drives autonomous slice delivery:
- `phase-orchestrator.ts` (coordinator + worker)
- `brainstorm-round.ts` (Orchestrator → Spark → Skeptic round loop)
- `wait-for-required-pr-checks.sh` (check-gate)
- All `.github/workflows/` orchestration workflows

## Acceptance bar

Every PR touching `apps/web` must pass `luxury-brand-gate` before merge.
The brainstorm round (when `BRAINSTORM_ROUND_ENABLED=true`) adds Orchestrator → Spark → Skeptic
review before `gh pr ready`. Default off until smoke on `ci--brainstorm-round-graft` passes.
