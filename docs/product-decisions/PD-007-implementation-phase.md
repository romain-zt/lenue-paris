---
id: PD-007
status: approved
date: 2026-06-14
related_prd_version: 0.1
supersedes: "execution-loop v0 implementation boundary (§11.1, §12.1)"
---

# Open the Implementation Phase (Spec → Test → Implementation)

## Context

The v0 governance loop deliberately stopped before writing application code
(`.cursor/rules/execution-loop.mdc` §11–§12). The PRD is enriched (v0.1) and all
seven Feature Areas are validated. The owner has decided to run the full pipeline
unattended, so implementation must be authorized for `delivery-ready` Feature Areas.

## Decision

Implementation is authorized under `.cursor/rules/implementation-workflow.mdc`,
for a Spec that is `ready-for-implementation` whose grandparent Feature Area is
`delivery-ready`. Work proceeds **Spec → Test → Implementation**:

1. Write tests from the Spec's ACs + Contract (per `30-test-strategy.mdc`), minimizing e2e.
2. Implement against the architecture baseline (`40-architecture-baseline.mdc`).
3. A Task reaches `ready-for-merge` only when its traced tests pass.

`/implement` and the phase orchestrator (`.github/scripts/phase-orchestrator.ts`)
drive this. Executors (`composer-2.5-fast`) write code; a Manager plans/splits;
high-risk review is Vision-tier (`claude-opus-4-8`).

## Consequences / tradeoffs

- The execution loop and the CI phase orchestrator may now enter `delivery-ready`
  Feature Area subtrees and run code work — never past a `NEED_HUMAN` flag.
- `forbidden_files` in `EXECUTION_LOCK` is derived from `docs/project.config.md`
  (no longer a blanket implementation ban), still constrained by the v0 boundary.
- Risk: code work amplifies bad specs. Mitigation: test-first, tests trace to ACs,
  checker gates remain mandatory, and `quality` must pass before any PR merges.

## Links

- PRD: `docs/prd/PRD.md`
- Rule: `.cursor/rules/implementation-workflow.mdc`
- Config: `docs/project.config.md` → "Implementation phase"
- Paired decision: `docs/product-decisions/PD-008-autonomous-decomposition.md`
