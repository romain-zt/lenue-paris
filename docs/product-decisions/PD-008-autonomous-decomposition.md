---
id: PD-008
status: approved
date: 2026-06-14
related_prd_version: 0.1
supersedes: "in-conversation human approval gate for /feature-area scaffold, scaffold-slices, promote, promote-slice, clear-for-vertical (when run by CI in autonomous mode)"
---

# Autonomous Decomposition (PRD → Scope Slices, unattended on CI)

## Context

The `/feature-area` and `/prd` workflows require that file-writing steps
(`scaffold`, `scaffold-slices`, the promotion transitions) be driven from a slice
or map proposal **approved by a human in the current conversation**. `00-siso.mdc`
also treats PRD → Feature Area → Scope Slice as product truth that must not be
invented without explicit waiver.

A cloud agent firing inside GitHub Actions has no human in its conversation, so
under those gates it can never complete decomposition — which is why a validated
PRD did not start CI on its own. The owner has decided that, once the PRD is ready,
decomposition should proceed autonomously, with the scope-readiness checker acting
as the gate instead of a person.

## Decision

When `docs/project.config.md` → **Autonomous decomposition enabled: yes**, a CI
cloud agent (`.github/scripts/prd-decomposer.ts`) is the authorized actor for the
full decomposition chain:

- Feature Area: `map` → `scaffold` → `validate` → `promote` → `clear-for-vertical`
- Scope Slice: `slice` → `scaffold-slices` → `refine-slice` → `promote-slice`
- Wiring: update `docs/state/orchestration.prd-flow-map.json` so each PRD Flow
  Inventory `v0 = Yes` row maps to its new Scope Slice file(s).

A **`CLEAR`** verdict from `.cursor/checkers/scope-readiness-checker.md` substitutes
for the in-conversation human approval those modes normally require. Everything
ships as a normal PR reviewed and merged by `pr-automation.yml`; the merge feeds
`orchestration-automation.yml` → `sync-prd-orchestration.ts` → the phase orchestrator.

## Consequences / tradeoffs

- "PRD ready → CI keeps moving" becomes true end-to-end (decomposition **and**,
  with PD-007, implementation).
- The checker is now load-bearing: a weak check passes weak scope. Mitigation: the
  checker gates are unchanged and a `BLOCKED`/`NEED_HUMAN` verdict still stops the
  affected item (it does not invent an answer).
- Genuine `NEED_HUMAN` is **never** bypassed — missing product truth, blocking open
  questions, missing secrets, or two materially different valid interpretations make
  the agent set the item `blocked` + `NEED_HUMAN:` and move on to siblings.
- Reversible: set the flag to `no` (or `ORCHESTRATOR_ENABLED=false`) to return to
  human-driven decomposition immediately.

## Links

- PRD: `docs/prd/PRD.md`
- Rules touched: `.cursor/rules/00-siso.mdc`, `.cursor/rules/feature-area-workflow.mdc`, `.cursor/rules/execution-loop.mdc`
- Driver: `.github/workflows/prd-decomposition.yml`, `.github/scripts/prd-decomposer.ts`
- Config: `docs/project.config.md` → "Autonomous decomposition"
- Paired decision: `docs/product-decisions/PD-007-implementation-phase.md`
