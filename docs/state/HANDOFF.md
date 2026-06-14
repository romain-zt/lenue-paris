# Project HANDOFF

> Living context for cloud agents. The PR reviewer and every orchestrator step agent
> read this file **first**. Keep it short, current, and honest. Update it as the last
> step of every run (what changed, what's next, what's blocked).

## What this project is

Lénue Paris — a luxury fashion boutique storefront. Buyers browse dresses, bags, and
scarfs and order via WhatsApp. See `docs/project.config.md` for identity, stack,
priority bands, the v0 boundary, and the picked apps.

## 🔄 FRESH RESTART (2026-06-14)

The earlier build was **reset to start fresh on the upgraded setup**. The half-built
monorepo (`apps/**`, `packages/**`, root build config, lockfile) was removed on purpose.
Nothing about the product definition changed — the **original PRD and the product
decomposition are intact** and remain the source of truth:

- `docs/prd/PRD.md` (+ `docs/prd/chunks/` for any offloaded detail)
- `docs/product/feature-areas/**`, `docs/product/scope-slices/**`, `docs/product/specs/**`, `docs/product/user-stories/**`

The pipeline is reset so it **rebuilds from `setup` first**, on the current framework:
latest stable stack (Node 22, Next 16, pnpm catalog as single source), pickable apps,
seed + committed base assets, a visible first page, then per-part specialist builds.

## Current architecture

No product code yet — the repo is governance + product docs only until the `setup`
step runs. The `setup` step forks `.cursor/core/templates/starter-monorepo/` (the
upgraded skeleton) per `05-project-setup.mdc` + `/setup`, scaffolding only the apps
selected in `docs/project.config.md` (`web`, `cms`) on the latest stable stack.

## Active work — restart sequence

The pipeline runs in order (every feature depends on `setup`):

1. **`setup`** (priority 0) — fork the upgraded starter, pin latest, pick apps, enable
   clean-code rules, seed + commit base assets, ship a visible first page, wire deploy.
2. **`orch-product-catalog--category-grid`** (P0)
3. **`orch-product-detail--gallery-and-variants`** (P1)
4. **`orch-whatsapp-checkout--order-save-and-handoff`** (P1)
5. **`orch-cms-products--product-management`** then **`--order-viewing`** (P2)
6. **`orch-editorial--brand-page`** (P2)
7. **`orch-i18n--localized-storefront`** (P3)

Status starts clean: **only `bootstrap` is recorded (complete)**. `setup` and the
feature steps are implicitly `todo` and record their own events as the pipeline runs.
Status is the append-only log `docs/state/status-events.ndjson` (never hand-edit
`status.json`, which is a generated snapshot).

## How features get built now (new doctrine)

- **Inventory first / reuse-first** (`62-feature-decomposition.mdc` §0): before building,
  see what exists; build missing primitives as reusable shared pieces.
- **Per-part specialists**: the Manager decomposes each slice on pickup and delegates
  each part (data/contract/domain/api/ui/design/copy) to its specialist.
- **Loop per part**: spec → plan → tests → implement → re-test (validation) → review.
- **Two-model challenge** of every plan/decomposition; **composer** does the typing.
- **Record setup gaps** at review (`64-self-improvement.mdc`); `/btw` for product inputs.

## Known issues / decisions in effect

- **PD-007** (implementation phase) `approved`; **PD-008** (autonomous decomposition) per `docs/project.config.md`.
- Prior open question: `docs/prd/questions copy/open-questions.md` vs canonical `docs/prd/questions/open-questions.md` — worth renaming.

## Next recommended step

Run the pipeline (orchestrator) — the first ready step is **`setup`**.
