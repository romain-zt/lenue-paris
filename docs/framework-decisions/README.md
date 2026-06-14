# Framework Decisions

Framework Decisions (FDs) authorize changes to the framework governance layer that would otherwise violate the manifest's **append-only invariant**.

## FD vs PD

| | Framework Decision (FD) | Product Decision (PD) |
|---|---|---|
| **Governs** | `.cursor/core/**` — agent framework rules, skills, commands, agents, checkers, hooks, manifest | Product direction — architecture, implementation phase gates, feature trade-offs |
| **Lives in** | `docs/framework-decisions/FD-NNN-*.md` | `docs/product-decisions/PD-NNN-*.md` |
| **Required for** | Deleting or renaming a manifest entry | Enabling implementation phase, architecture choices |
| **Who approves** | Framework team (human merge) | Product owner / architect |

## When is an FD required?

An FD is required whenever you want to:

1. **Delete a manifest entry** — remove an artifact from `framework.manifest.json`.
2. **Rename a manifest entry** — change an entry's `id` or `path`.
3. **Deprecate a core/ artifact** — set `status: deprecated` on an entry that was previously `active`.
4. **Change a load-bearing governance rule** — modify `00-siso.mdc`, `intake-flow.mdc`, or `20-model-routing.mdc` in ways that change their enforcement behavior.

An FD is NOT required for:

- Adding new entries (append-only invariant allows additions).
- Editing the content of an existing artifact (fixing docs, clarifying language).
- Adding new templates.

## How to create an FD

1. Copy `.cursor/core/templates/framework-decisions/FD.template.md` → `docs/framework-decisions/FD-NNN-<slug>.md`.
2. Fill in all sections; set `Status: proposed`.
3. Open a PR with the FD doc FIRST — before making the manifest change.
4. Once the FD PR merges to `main`, the manifest change PR may proceed.
5. Reference the FD number in the manifest change PR description.

## Index

*(Add new entries here as FDs are approved)*

| FD | Title | Status | Date |
|----|-------|--------|------|
| — | No FDs yet | — | — |
