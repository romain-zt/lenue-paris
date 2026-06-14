# GitHub automation — operations guide

This repo ships a full cloud-agent CI pipeline under `.github/`. Once configured,
every PR is reviewed + merged by a Cursor cloud agent, conflicts are auto-resolved,
stacked PRs cascade, and an orchestrator drives Scope Slices to implementation —
with scheduled "re-catch" jobs so **nothing stays stuck for more than ~1h**.

> New here? Start with [`/BOOTSTRAP.md`](../BOOTSTRAP.md) for the end-to-end flow.
> This file is the reference for the GitHub side.

---

## 1. One-time setup (≈5 min)

### a. Cursor API key
1. [cursor.com/settings](https://cursor.com/settings) → **API Keys** (Team plan: Dashboard → Service accounts). Cloud agents need a Pro or Team plan.
2. Copy the key (starts with `cursor_`).
3. Repo → **Settings → Secrets and variables → Actions → Secrets** → **New repository secret**:
   - Name: `CURSOR_API_KEY`, Value: the key.

`GITHUB_TOKEN` is injected automatically — you don't add it.

### b. Allow Actions to merge PRs
**Settings → Actions → General → Workflow permissions**:
- **Read and write permissions** ✅
- **Allow GitHub Actions to create and approve pull requests** ✅

### c. Repository variables (optional — all have safe defaults)
**Settings → Secrets and variables → Actions → Variables**:

| Variable | Default | Purpose |
|---|---|---|
| `ORCHESTRATOR_ENABLED` | `true` | Kill switch — set `false` to pause all agent firing instantly |
| `REQUIRED_CHECKS` | `quality` | Comma-separated checks that gate merges. Add `playwright` once you have E2E |
| `ORCHESTRATOR_TRACKING_BASE` | `main` | Integration branch for tracking PRs (e.g. `feature/my-epic`) |
| `MAX_REMEDIATION_RUNS` | `5` | Circuit breaker — auto-block a step after this many stalled retries |
| `MAX_CI_AUTOFIX_ATTEMPTS` | `3` | Budget for `ci-failure-autofix` — stop and post `NEED_HUMAN` after this many `[ci-autofix]` commits on a PR |
| `CI_AUTOFIX_SKIP_BRANCH_PREFIXES` | `orchestrator/` | Branch prefixes the CI autofixer leaves alone (they run their own remediation) |

> **Model selection is not an env var.** Each CI script picks its model from
> `.github/scripts/core/cursor-models.config.ts` (see §1e). Change models there, not in
> repo variables — the mapping is reviewed in PRs alongside the script.

### d. Branch protection (recommended) — `main`
Settings → Branches → Add rule:
- Require a pull request before merging ✅
- Require status checks to pass: **`quality`** (add `playwright` when ready) ✅
- Require branches up to date ✅

### e. Model selection per script
The mapping lives in [`.github/scripts/core/cursor-models.config.ts`](scripts/core/cursor-models.config.ts) and follows the tiers defined in [`.cursor/core/rules/20-model-routing.mdc`](../.cursor/core/rules/20-model-routing.mdc):

| Script | Tier | Model | Why |
|---|---|---|---|
| `pr-automation.ts` | Manager | `claude-4.6-sonnet` | Routine PR review against governance; PRs stay < ~20 files |
| `conflict-resolver.ts` (default) | Manager | `claude-4.6-sonnet` | File-level merge judgment on most PRs |
| `conflict-resolver.ts` (sensitive) | Vision | `claude-opus-4-8` | Auto-escalates when ANY conflicted file touches `.cursor/**`, `docs/state/**`, `docs/product/**`, or `docs/product-decisions/**` |
| `ci-failure-autofix.ts` (default) | Manager | `claude-4.6-sonnet` | Diagnoses a failed CI/E2E run and pushes the smallest fix to the PR branch |
| `ci-failure-autofix.ts` (sensitive) | Vision | `claude-opus-4-8` | Auto-escalates when the PR diff touches `.cursor/**`, `docs/state/**`, `docs/product/**`, or `docs/product-decisions/**` |
| `phase-orchestrator.ts` worker | Manager | `claude-4.6-sonnet` | The worker IS the per-step router — picks the smallest coherent layer, decides blocked vs proceed, then sub-delegates the actual typing to Executor subagents (`composer-2.5-fast`) via `Task` |
| `prd-decomposer.ts` | Vision | `claude-opus-4-8` | Drives the full PRD → Feature Area → Scope Slice chain autonomously and commits durable product-scope decisions that feed implementation — irreversible/strategic, so Vision |

Inside the run, the cloud agent itself respects `20-model-routing.mdc` and routes subagent calls accordingly. To change a model, edit the constants file and open a PR.

---

## 2. What runs, and when

| Workflow | Trigger | Does |
|---|---|---|
| `ci.yml` (`quality`) | PR → main/master | typecheck · lint · test · build via turbo. **Graceful**: no-op green if no monorepo at root yet |
| `e2e.yml` (`playwright`) | PR → main/master | Playwright. **Auto-skips green** until a suite exists |
| `pr-automation.yml` | PR opened/sync/ready | Waits for `REQUIRED_CHECKS`, then a Cursor agent reviews + squash-merges |
| `phase-orchestrator.yml` | merge to main/`feature/*`, **cron */30m**, manual | Coordinator picks ready steps → fans out one worker per step → each opens a draft tracking PR + fires an agent |
| `pr-ready.yml` | PR → ready_for_review | Auto-merges orchestrator tracking PRs, re-dispatches the orchestrator |
| `pr-cascade.yml` | merge to main/`feature/*` | Rebases + merges stacked draft PRs |
| `auto-rebase.yml` | PR → ready | Regenerates a stale `pnpm-lock.yaml` |
| `conflict-resolver.yml` | push to main, **cron */30m**, manual | Cursor agent resolves conflicts on conflicting PRs |
| `ci-failure-autofix.yml` | **CI / E2E run fails on a PR** | Cursor agent reads the failing logs and pushes the smallest fix to the PR branch. Budget-capped; skips `orchestrator/*` |
| `prd-decomposition.yml` | push to `docs/prd/PRD.md` / feature-areas, **cron 6h**, manual | **Autonomous decomposition** (opt-in): a Vision agent runs the `.cursor/` map→slice chain and wires the flow map, opening a PR that `pr-automation` merges. Gated by `docs/project.config.md` → *Autonomous decomposition enabled* + PD-008 |
| `orchestration-automation.yml` | push to PRD/slice files, **cron 6h**, manual | Refills the pipeline from the PRD Flow Inventory + planner queue |
| `orchestration-planner.yml` | manual | Appends `planner-queue.json` steps into the pipeline |
| `orchestrator-cleanup.yml` | **cron hourly**, manual | The safety net (see §4) |

---

## 3. The orchestration state (`docs/state/`)

The orchestrator is **data-driven** — it never hardcodes your product. It reads:

| File | Role |
|---|---|
| `orchestration.pipeline.json` | Ordered steps + `dependsOn` + optional `priority` (0–5). Ships with a permanent `bootstrap` anchor |
| `status-events.ndjson` | **Append-only source of truth** for status (`merge=union`, never hand-edited). One transition = one line. See `60-status-lifecycle.mdc` |
| `status.json` | **Generated snapshot** projected from the event log: `todo` / `in-progress` / `in-review` / `validated` / `to-qa-human` / `complete` / `blocked` (+ remediation counts) |
| `inbox.ndjson` | **Append-only** priority input queue fed by `/btw` (`merge=union`). See `61-input-queue.mdc` |
| `orchestration.planner-queue.json` | Manual steps to append (you edit this); steps may carry `priority` |
| `orchestration.prd-flow-map.json` | Maps PRD Flow Inventory rows → Scope Slice files |
| `HANDOFF.md` | Living context every agent reads first |
| `seed-anchor.md` | Target of the `bootstrap` anchor — don't delete |

**A step ("slice") points at a Feature Area + Scope Slice** under `docs/product/**`.
The agent then follows the repo's `.cursor/` governance to implement it. To add work:
either let `orchestration-automation` derive it from the PRD, or hand-add steps to
`orchestration.planner-queue.json` and run the **Orchestration Planner**.

### How a step advances
1. Coordinator marks the step `in-progress`, opens a **draft tracking PR** (`orchestrator/tracking-<id>-*`).
2. A worker fires a Cursor agent. The agent commits to the tracking branch.
3. On success the agent sets `status.json` → `complete` and runs `gh pr ready`.
4. `pr-ready.yml` merges the tracking PR and re-dispatches the orchestrator → next step.
5. If the agent can't finish, it sets the step `blocked` with a `NEED_HUMAN:` reason; the orchestrator mirrors that to `main` and moves on to other ready steps.

### Fully autonomous mode (PRD → code, no human in the loop)

By default, turning a ready PRD into runnable slice steps is a human-driven `.cursor/`
workflow (`/feature-area slice` → `scaffold-slices` → `promote-slice`). To skip that and
let CI do it:

1. Set `docs/project.config.md` → **Autonomous decomposition enabled: yes** (governed by
   `docs/product-decisions/PD-008-autonomous-decomposition.md`).
2. Set **Implementation governance enabled: yes** (PD-007) if you also want code written.

Then the end-to-end chain is:

```
edit docs/prd/PRD.md  ─▶ prd-decomposition.yml (Vision agent runs map→slice→promote,
                          wires orchestration.prd-flow-map.json)  ─▶ PR
   ─▶ pr-automation.yml reviews + merges  ─▶ orchestration-automation.yml
   ─▶ sync-prd-orchestration.ts fills the pipeline  ─▶ phase-orchestrator.yml implements
```

A scope-readiness **`CLEAR`** verdict substitutes for the in-conversation human approval.
A genuine `NEED_HUMAN` (missing product truth, blocking open question, missing secret)
still stops *that* item — the agent marks it `blocked` and continues with siblings.
Reverse it any time by setting the flag back to `no` (or `ORCHESTRATOR_ENABLED=false`).

---

## 4. Resilience — "never stuck > 1h"

Every long step is bounded and every path has a scheduled re-catch:

- **Job timeouts** — every workflow has `timeout-minutes` (15–50). No job hangs.
- **Bounded waits** — `wait-for-required-pr-checks.sh` caps at `MAX_WAIT_SEC` (30 min) then fails loudly.
- **Orchestrator cron */30m** — recovers missed merge webhooks; reruns coordinator.
- **Conflict-resolver cron */30m** — catches conflicts the push trigger missed.
- **CI autofix on failure** — a failed CI/E2E run on a PR fires a Cursor agent that pushes the smallest fix, capped at `MAX_CI_AUTOFIX_ATTEMPTS` before it escalates to `NEED_HUMAN`.
- **Cleanup cron hourly** (`orchestrator-cleanup.yml`) — the catch-all:
  1. closes duplicate tracking PRs,
  2. merges "ready" tracking PRs that missed `pr-ready.yml`,
  3. **re-dispatches draft tracking PRs older than `STALE_DRAFT_MINUTES` (45m)** — a stalled agent is retried within the hour,
  4. resets orphaned `in-progress` steps (no PR) back to `not-started`.
- **Circuit breaker** — a step that keeps stalling is auto-`blocked` after `MAX_REMEDIATION_RUNS`, so the cron never refires it forever.
- **Orphan reset** — `in-progress` with no tracking PR is reset on the next coordinator pass.

Net effect: any single failure is re-attempted or surfaced as `NEED_HUMAN` within ~1h, without freezing the rest of the pipeline.

---

## 5. Kill switch & control

- **Pause everything:** set `ORCHESTRATOR_ENABLED=false` (agents log and exit cleanly).
- **Resume:** set it back to `true` (or delete the variable — defaults to enabled).
- **Manual kick:** Actions → *Phase Orchestrator* → *Run workflow* (blank `step_id` = coordinator; set `step_id` to force one step).
- **Force a stuck merge:** Actions → *Orchestrator Cleanup* → *Run workflow*.

---

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| `CURSOR_API_KEY is not set` | Add the secret (§1a) |
| `401 Unauthorized` from the SDK | Re-paste the key (stray whitespace) |
| `GH_TOKEN lacks merge permission` | Enable Actions write + PR approve (§1b) |
| Agent posts a blocker comment | Read it — it states exactly what a human must resolve |
| Workflow never triggers | The workflow file must be on the default branch (or in a PR to it) |
| `ci-failure-autofix` never runs | `workflow_run` only fires from the default-branch copy — merge it to `main` first. It also only acts on PR-event failures, not `main`-push failures |
| CI autofix stopped trying | Budget hit (`MAX_CI_AUTOFIX_ATTEMPTS`) — read the `NEED_HUMAN:` PR comment, fix manually or raise the limit |
| Orchestrator exits "missing pipeline" | Ensure `docs/state/orchestration.pipeline.json` is committed (it's git-tracked via a `.gitignore` exception) |
| First PR's `quality` is green but did nothing | Expected on a governance-only repo with no root monorepo yet |

---

## 7. CI failure auto-fix

`ci-failure-autofix.yml` watches the **CI** and **E2E** workflows. When either
finishes with `failure` on a pull request, `ci-failure-autofix.ts`:

1. resolves the open PR for the failing branch (skips `orchestrator/*` and other
   `CI_AUTOFIX_SKIP_BRANCH_PREFIXES`),
2. checks the budget — counts existing `[ci-autofix]` commits on the PR; at
   `MAX_CI_AUTOFIX_ATTEMPTS` (default 3) it posts a `NEED_HUMAN:` comment and stops,
3. pulls the failing logs (`gh run view --log-failed`, tail-truncated),
4. fires a Cursor agent (Manager tier, Vision if the diff touches sensitive paths)
   that checks out the branch, applies the smallest fix, and pushes a commit
   carrying the `[ci-autofix]` marker — which re-runs CI.

**Loop safety:** the `[ci-autofix]` marker is the counter, so each retry is
bounded; `ORCHESTRATOR_ENABLED=false` pauses it like the rest of the pipeline.
The agent is told never to disable/weaken a check or test just to go green — if it
can't fix the root cause confidently it escalates to `NEED_HUMAN` instead.

> **Heads up:** `workflow_run` triggers only fire from the copy of the workflow on
> the **default branch**, so this starts working once merged to `main`.

## 8. Not enabled yet: Vercel build-log watch

Vercel deploys run through Vercel's own Git integration (not a workflow here), so a
failed Vercel build surfaces as a failed **check** rather than a failed Actions run —
`ci-failure-autofix` won't see it. To auto-fix Vercel build failures too: add
`VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` secrets and a workflow on
`deployment_status` (failure) that reads the build log and reuses
`ci-failure-autofix.ts`'s prompt to push a fix to the PR branch.
