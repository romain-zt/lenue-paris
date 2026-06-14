# Project HANDOFF

> Living context for cloud agents. The PR reviewer and every orchestrator step agent
> read this file **first**. Keep it short, current, and honest. Update it as the last
> step of every run (what changed, what's next, what's blocked).

## What this project is

<!-- One paragraph. Pulled from docs/project.config.md once you fill it in. -->
A new project bootstrapped from the Cursor governance template. See
`docs/project.config.md` for identity, stack, priority bands, and the v0 boundary.

## Current architecture

<!-- The shape of the codebase as it exists right now: apps, packages, key boundaries.
     On a fresh project this is just the starter monorepo (apps/web, apps/cms, packages/*). -->
- Monorepo: `apps/*`, `packages/*` (pnpm + turbo).
- Stack baseline: see `.cursor/core/rules/40-architecture-baseline.mdc` and `docs/project.config.md`.

## Active work

<!-- The step currently in flight, if any. The orchestrator keeps this roughly in sync. -->
- Nothing in flight yet. Pipeline anchor `bootstrap` is complete; no slice steps queued.

## Known issues / decisions in effect

<!-- Gotchas an agent must know before touching code. Link product decisions. -->
- Implementation phase: check `docs/project.config.md` → "Implementation governance enabled".
  When `no`, agents must not write application runtime code.

## Next recommended step

<!-- The single safest next action. Agents use this to avoid analysis loops. -->
- Run the local Cursor workflow (`/prd`, `/feature-area`, `/spec`) to produce slices, then
  let `orchestration-automation` / `Orchestration Planner` append them to the pipeline.
