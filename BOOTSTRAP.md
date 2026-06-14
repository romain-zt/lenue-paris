# Bootstrap a new project from this template

This template gives you a governed product pipeline end to end:

```
clone ─▶ set up locally with Cursor (PRD → scope → plan)
      ─▶ push to GitHub (+ API keys)
      ─▶ GitHub Actions + Cursor cloud agents plan · test · implement · review · merge
      ─▶ self-healing loop (re-catch ≤ 1h) until work is done or a human is needed
```

Two layers, kept separate:

- **`.cursor/**`** — project-agnostic governance (commands, rules, agents, skills). See [`.cursor/README.md`](.cursor/README.md).
- **`.github/**`** — the cloud automation. See [`.github/AUTOMATION.md`](.github/AUTOMATION.md).

Project specifics live in **`docs/project.config.md`** and **`docs/state/`** — nothing project-specific is hardcoded in the scripts.

---

## Step 1 — Clone the template

```bash
gh repo create my-product --private --clone --template <this-template-repo>
cd my-product
```

You now have `.cursor/`, `.github/`, `docs/`, and the starter monorepo skeleton.

---

## Step 2 — Make it your project (local, in Cursor)

1. **Set identity.** Edit `docs/project.config.md` (or recreate from
   `.cursor/templates/project/project.config.template.md`): project name, stack
   overrides, priority bands (P0–P4), v0 boundary.
2. **Bring in the code skeleton.** The product root must be a pnpm monorepo so CI can
   build it. Use `.cursor/templates/starter-monorepo/` as the base (next-forge direction
   + Payload(Postgres) + docker-compose for Postgres/MinIO). Local services:
   ```bash
   docker compose up -d        # Postgres + MinIO
   pnpm install
   ```
3. **Drive the workflow with Cursor.** Start anything with `/intake`, then:
   - `/prd init` → `/prd` — discover and converge the PRD. Include a **`# Flow Inventory`**
     table (columns `Flow | v0`) so the automation can derive work later.
   - `/feature-area` → `/user-story` → `/spec` — decompose into Scope Slices and Specs
     under `docs/product/**`.
   - When ready to build, enable the implementation phase (below).
4. **Seed `docs/state/HANDOFF.md`** with a short, true description of the project. Every
   cloud agent reads it first.

> The `docs/state/*.json` files ship ready (a permanent `bootstrap` anchor). You don't
> create them — you just append slice steps to the pipeline later.

### Enable implementation (off by default)
1. Copy `.cursor/templates/product-decisions/PD-implementation-phase.template.md` →
   `docs/product-decisions/PD-NNN-implementation-phase.md`, set `status: approved`.
2. In `docs/project.config.md` set **Implementation governance enabled: yes**.

---

## Step 3 — Push to GitHub + add keys

```bash
git add -A && git commit -m "chore: bootstrap project" && git push
```

Then configure the repo once (full detail in [`.github/AUTOMATION.md`](.github/AUTOMATION.md)):

1. **Secret** `CURSOR_API_KEY` (from cursor.com — Pro/Team plan).
2. **Settings → Actions → General**: enable *Read and write permissions* and *Allow
   GitHub Actions to create and approve pull requests*.
3. **Branch protection** on `main`: require the `quality` check.
4. Optional **variables**: `REQUIRED_CHECKS`, `ORCHESTRATOR_ENABLED`,
   `ORCHESTRATOR_TRACKING_BASE`, `MAX_REMEDIATION_RUNS`.

> Model selection is **not** an env var. Each CI script picks its model from
> `.github/scripts/cursor-models.config.ts`, aligned with
> `.cursor/rules/20-model-routing.mdc`. Change models there, in a PR.

---

## Step 4 — Let the loop run

Add work to the pipeline, then automation takes over:

- **From the PRD:** push changes to `docs/prd/PRD.md` (Flow Inventory) or
  `docs/state/orchestration.prd-flow-map.json`. `orchestration-automation` appends the
  matching Scope Slices and dispatches the orchestrator.
- **By hand:** add steps to `docs/state/orchestration.planner-queue.json`, then run the
  **Orchestration Planner** workflow.

For each ready step the orchestrator opens a draft tracking PR and fires a Cursor cloud
agent that implements the slice (test-first, per `.cursor/rules/`). When `quality` passes
and review approves, it merges and advances to the next step. Watch progress in the
**Actions** tab (each run prints a live Cursor dashboard link).

---

## Step 5 — Try it without any product code

Want to verify the plumbing on a fresh clone before writing a feature?

```bash
# open a tiny PR — CI is graceful, so `quality` goes green even with no app yet
git checkout -b test/automation
echo "<!-- smoke test -->" >> README.md
git commit -am "test: trigger automation"
git push -u origin test/automation
gh pr create --draft --title "test: automation smoke" --body "Verifying review + merge."
```

`pr-automation` waits for `quality`, undrafts, runs the review agent, and merges if clean.

---

## Daily controls

- **Pause everything:** set variable `ORCHESTRATOR_ENABLED=false`. Resume with `true`.
- **Unstick:** the hourly *Orchestrator Cleanup* recovers stalls automatically; you can
  also run it manually. See the resilience section in [`.github/AUTOMATION.md`](.github/AUTOMATION.md#4-resilience--never-stuck--1h).
- **A step needs you:** look for a PR comment or a `blocked` step in
  `docs/state/status.json` with a `NEED_HUMAN:` reason.
