# Cursor Workflow

Idea → PRD → scope → architecture → spec → test → implementation, governed end to end.
The `.cursor/**` layer is **project-agnostic**; project specifics live in
`docs/project.config.md`.

## The flow

```
/intake  ── classify · SISO · setup-readiness · route ──────────────┐
                                                                     │
  idea ───────▶ /prd            (discover → converge → update)       │
  scope ──────▶ /feature-area   (map → validate → slice)             │
              ▶ /user-story      (propose → refine → promote)        │ each step
              ▶ /spec            (propose → refine → promote)        │ gated by the
  architecture ▶ /domain architecture  + 40-architecture-baseline   │ scope-readiness
  build ──────▶ /implement      (plan → test → run → verify → review)│ checker
  expertise ──▶ /domain <name>  (backend/http/event/websocket/…)     │
                                                                     ┘
```

Start anything you're unsure about with **`/intake`** — it routes you to the right command and checks the setup can handle the request first.

## Model tiers (`rules/20-model-routing.mdc`)

| Tier | Model | Owns |
|------|-------|------|
| **Vision** | `claude-opus-4-8` | big plans, strategy, architecture & business decisions, high-risk review, triage/delegation |
| **Manager** | `claude-4.6-sonnet` | planning, scoping, splitting into bricks, routine review |
| **Executor** | `composer-2.5-fast` | one brick — one Task / one commit, test-first code |

## Doctrine rules

| Rule | Enforces |
|------|----------|
| `00-siso.mdc` | input quality before execution |
| `10-prd-discovery.mdc` · `11-prd-question-loop.mdc` | PRD discovery |
| `feature-area-workflow.mdc` · `user-story-workflow.mdc` | product decomposition chain |
| `20-model-routing.mdc` | model tier per action |
| `30-test-strategy.mdc` | test-first; contract/integration/unit over e2e |
| `40-architecture-baseline.mdc` | monorepo · Payload (i18n+S3) · Postgres · MinIO |
| `implementation-workflow.mdc` | spec → test → implementation gates |
| `execution-loop.mdc` | autonomous queue orchestration |
| `intake-flow.mdc` | the front-door router |

## Domain specialists (`/domain <name>`)

Engineering: `architecture` (Vision) · `backend` · `http` · `event` · `websocket`.
Product/brand: `design` · `copywriter` · `marketing` · `business` (Vision).
Each has a skill (`skills/domains/<name>`) + a specialist agent (`agents/domains/`).

## Architecture & starter template

Default stack is fixed (`40-architecture-baseline.mdc`). Don't re-litigate it per
feature. Fork the clonable skeleton to start:

```
.cursor/templates/starter-monorepo/   # next-forge direction + Payload(i18n+S3) + docker-compose(Postgres+MinIO)
```

## Enabling implementation

Implementation is **off by default**. To turn it on for a project:

1. Copy `.cursor/templates/product-decisions/PD-implementation-phase.template.md` → `docs/product-decisions/PD-NNN-implementation-phase.md`, set `status: approved`.
2. In `docs/project.config.md` set **Implementation governance enabled: yes** and the forbidden-paths default.

Then `/implement` (spec → test → run → verify → review) is unlocked for `delivery-ready` Feature Areas.

## New project bootstrap

1. `/prd init` — scaffold the PRD workspace.
2. Create `docs/project.config.md` from `.cursor/templates/project/project.config.template.md` (name, priority bands, v0 boundary).
3. Fork `.cursor/templates/starter-monorepo/` for the code.
4. `/intake "<your idea>"` and follow the route.
