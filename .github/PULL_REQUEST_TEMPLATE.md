<!--
  PR template — keep the opened PR CRYSTAL CLEAR and skimmable.
  Title: conventional commit, e.g. `feat(catalogue): category grid` / `fix(auth): …`.
  Fill the sections that apply; DELETE the ones that don't (don't leave empty headers).
  Source of truth: .cursor/core/templates/pr/PULL_REQUEST_TEMPLATE.md — edit there and copy here.
-->

## Summary

<!-- 1–3 lines: WHAT changes and WHY. No marketing, no fluff. -->

## Type

<!-- one of: feat · fix · refactor · chore · docs · test · perf -->

## Changes

<!-- The actual changes, grouped and bulleted. Skimmable. -->
-

## Scope

<!-- What this implements + where it sits in the pipeline. -->
- **Scope Slice / Spec / Feature Area:** <!-- path or N/A (framework change) -->
- **Pipeline step id:** <!-- e.g. orch-… / setup / N/A -->

## How it was validated

<!-- Tests are written first (30-test-strategy). Required checks must be green. -->
- [ ] `quality` (typecheck · lint · test · build) is green
- **Tests added/updated:** <!-- which, at which layer (unit/contract/integration/e2e) -->
- **Manual check:** <!-- what you verified, or N/A -->

## Screenshots / first paint

<!-- UI changes: before/after or the visible page. Delete if not UI. -->

## Risk & rollback

<!-- Blast radius; how to revert; any data/migration/contract/security impact. -->

## Checklist

- [ ] Stays inside the slice/spec scope (no scope creep) and the v0 boundary
- [ ] Test-first; behavior changes are covered
- [ ] Follows code + markup quality rules (`50`/`51`/`52` — thin boundaries, no div soup)
- [ ] Built per part by the right specialist (no one-off primitives) where applicable
- [ ] Status recorded via the append-only log (never hand-edited `status.json`)
- [ ] Setup gap recorded (`64-self-improvement`) if one surfaced
- [ ] `HANDOFF.md` / docs updated if needed
