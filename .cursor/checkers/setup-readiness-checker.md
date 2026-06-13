# Setup Readiness Checker

Governed by: `.cursor/rules/intake-flow.mdc`.

Run at the start of `/intake` (and any time the workflow itself may be stale) to
decide whether the `.cursor/**` setup can handle the incoming request **before**
doing the work. Answer each **PASS / FAIL / SKIP (reason)**. A FAIL means a
**setup gap** — propose the missing rule/skill/command/agent/template before (or
alongside) routing the request.

---

## Part A — Inventory present

- **SR-01 · Workflow spine exists.** `.cursor/rules/` has the governance rules (`00-siso`, `10-prd-discovery`, `feature-area-workflow`, `user-story-workflow`, `execution-loop`, `20-model-routing`, `30-test-strategy`, `40-architecture-baseline`, `implementation-workflow`).
- **SR-02 · Commands cover the stage** the request needs (`/prd`, `/feature-area`, `/user-story`, `/spec`, `/task`, `/implement`, `/domain`, `/execute-prd`).
- **SR-03 · A skill exists** for the work type the request implies. If a new work type, flag for authoring.
- **SR-04 · An agent at the right tier exists** for any delegation the request needs (`20-model-routing.mdc`).
- **SR-05 · Templates exist** for any artifact the request will create.

## Part B — Project config & freshness

- **SR-06 · `docs/project.config.md` exists and is filled** (name, priority bands, v0 boundary, implementation-phase flag). If missing → create from `.cursor/templates/project/project.config.template.md`.
- **SR-07 · Implementation gate is consistent.** If the request implies writing code, the implementation phase is enabled (config + approved PD) per `implementation-workflow.mdc` §2; else routing must stop before code.
- **SR-08 · No open `NEED_UPDATE`** in `docs/POINTS_OF_ATTENTION.md` that blocks the request's stage.
- **SR-09 · PRD exists** when the request assumes product context (`docs/prd/PRD.md` non-empty); else route to `/prd init` first.

## Part C — Coverage of THIS request

- **SR-10 · The request maps to a known stage** (idea/PRD, scope, story, spec, implement, domain task, bug). If it maps to nothing, it is a setup gap.
- **SR-11 · No rule/skill/command/agent would need to be invented mid-flight** to honor the request. If yes, author it first (or surface it as a tracked gap).

---

## Verdict

```txt
Setup Readiness — <request one-liner>

| Check | Result | Note |
|-------|--------|------|
| SR-01 | PASS   |      |
| ...   |        |      |

Setup verdict: READY | GAP
Gaps (if any):
- <missing rule/skill/command/agent/template> — proposed path + one-line purpose
Routing: <which workflow/command handles the request next>
```

A **GAP** verdict means: propose the missing piece (using `create-rule` / `create-skill` conventions) and, for anything load-bearing, get user approval before routing. Minor gaps may be noted and routed around with `NEED_UPDATE` logged.
