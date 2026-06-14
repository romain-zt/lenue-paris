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
- Autonomous decomposition run on `orchestrator/decompose-1781454348705` (PR #38) is **complete**.
  All v0 Feature Areas are `delivery-ready` and each has at least one `ready-for-user-stories`
  Scope Slice. The PRD flow map is wired. Pipeline anchor `bootstrap` is still the only
  pipeline step — appending slice steps is the next (separate) automation's job.

## Decomposition status (2026-06-14)

**Advanced — 7 v0 Feature Areas `delivery-ready`, 8 Scope Slices `ready-for-user-stories`:**

| Feature Area | Band | Scope Slice(s) ready |
|---|---|---|
| storefront-shell | P0 | storefront-shell--global-chrome |
| product-catalog | P0 | product-catalog--category-grid |
| product-detail | P1 | product-detail--gallery-and-variants |
| whatsapp-checkout | P1 | whatsapp-checkout--order-save-and-handoff |
| cms-products | P2 | cms-products--product-management; cms-products--order-viewing |
| editorial | P2 | editorial--brand-page |
| i18n | P3 | i18n--localized-storefront |

Each FA passed a real FA-01–FA-09 + CC-02–CC-05 check (→ validated) and DR-01–DR-05 +
CC-01–CC-05 (→ delivery-ready). Each slice passed SS-01–SS-10 + CC-01–CC-05.

**Flow map:** all 7 PRD `# Flow Inventory` v0=Yes rows are wired in
`orchestration.prd-flow-map.json`. Verified with `sync-prd-orchestration.ts --strict`
(7/7 flows resolve to existing slice files; pipeline/status mutations from that dry-run
were reverted — appending pipeline steps is owned by `orchestration-automation`).

**Deferred (declared in `docs/project.config.md` priority bands but out of the v0 boundary — not decomposed, no FA files created):**

- `FA-search-filter` (P3) — free-text search / advanced filtering is not grounded in PRD v0.
  Category filtering (the only filter in the PRD) lives inside `product-catalog--category-grid`.
- `FA-wishlist` (P4) — PRD hard exclusion: user accounts / wishlist are out of v0.
- `FA-analytics` (P4) — no v0 product grounding in the PRD feature set (Lighthouse ≥90 is a
  quality metric, not an analytics feature).

**Blocked on a human:** none. All 12 discovery questions are answered; no open blockers.

## Known issues / decisions in effect

<!-- Gotchas an agent must know before touching code. Link product decisions. -->
- Implementation phase: check `docs/project.config.md` → "Implementation governance enabled".
  When `no`, agents must not write application runtime code.
- **Setup notes observed during decomposition (non-blocking):**
  - Open questions live at `docs/prd/questions copy/open-questions.md`; the canonical path
    referenced by the rules/commands is `docs/prd/questions/open-questions.md`. Content is
    complete (Q-001–Q-012 all answered), so this did not block decomposition. Worth renaming
    the folder to the canonical path.
  - `docs/product-decisions/` contains only `README.md`; the PD files referenced by config and
    checker (`PD-001`, `PD-006`, `PD-007`, `PD-008`) are not authored as standalone records.
    No Product Decision governs any v0 Feature Area's product contract — the PRD grounds all v0
    behavior (no credit model; payment is offline WhatsApp settlement per the PRD; no share
    controls) — so DR-03 passed with "none" for every FA. If a load-bearing product decision
    emerges later, author the PD and re-run Part 8.

## Next recommended step

<!-- The single safest next action. Agents use this to avoid analysis loops. -->
- Run `orchestration-automation` / `Orchestration Planner` to append the 7 wired slices as
  pipeline steps after `bootstrap`, then begin `/user-story` → `/spec` → `/implement` on the
  `delivery-ready` Feature Areas in priority-band order (P0 first: storefront-shell, product-catalog).
