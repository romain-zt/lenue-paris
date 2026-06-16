# Step 3b evidence — live `--diff apps/web` (gate only)

**Blocked until:** Skeptic re-signs prerequisites below and fills the **3b pass record**
at the bottom. Spark may **not** claim 3b open until that record exists.

**Prerequisites (Skeptic re-run on current branch tip):**

| Step | Commit / record | Must show |
|------|-----------------|-----------|
| **2.1b** | `9bb2344` | `STEP-2.1-EVIDENCE.md` pass: `asset_duplicate_hash_collisions: 0`, `check_assets_exit: 0` |
| **3a** | `f6e9a36` (refresh pass record) | `STEP-3A-EVIDENCE.md` pass: `forbidden_paths_touched: none`, `test:maison-hooks` green on port **3001** |

Until both pass records are current, **3b implementation is rejected** even if `--diff` code exists.

Contract anchor: maison floors on **built HTML** from `apps/web` at
`http://localhost:3001/fr` using **3a** `data-maison` hooks — not static fixtures.

**CMS slice (`STEP-CMS-EVIDENCE.md`) stays blocked until 3b pass record is filled.**

---

## Allowed files in the 3b commit (allowlist)

Only these paths may change in the single 3b commit:

| Path | Purpose |
|------|---------|
| `.github/scripts/core/luxury-brand-gate.ts` | Add `--diff`, `--slice`, `--preview-url`; Playwright HTML fetch |
| `.github/scripts/core/quality/maison-scorers/layout-metrics.ts` | Wire live preview URL + golden selectors (if not already) |
| `.github/scripts/core/quality/maison-scorers/__tests__/*` | Unit tests for diff-mode HTML parsing only |
| `.project/lenue-luxury/STEP-3B-EVIDENCE.md` | This file — fill pass block below |
| `.project/lenue-luxury/STEP-3-EVIDENCE.md` | Fill **3b** subsection pass block only |

Optional: `package.json` script `luxury-gate:diff` under `.github/scripts/core` if missing.

---

## Forbidden in 3b (grep / diff must be clean)

The 3b commit **must not** touch:

- `apps/web/src/**` (shell already instrumented in **3a**; image paths audited in **2.1b**)
- `phase-orchestrator.ts`, workflows, `REQUIRED_CHECKS`
- Payload collections, `seed.ts`, `lib/cms/`, `loading.tsx`
- Deletion of `FEATURED_SLUGS`, `PLACEHOLDER_BY_SLUG`, or any CMS migration
- `CURSOR_API_KEY`, subagent spawn, LLM advisory wiring

If `git diff HEAD~1 --name-only` includes any forbidden path, **3b is rejected** even if the gate exits 0.

---

## Hard stops (3b done when all pass)

Maintainer run (Postgres reachable — same `DATABASE_URL` as CI `quality` job):

```bash
cd .github/scripts/core
pnpm --filter web build
pnpm --filter web start &   # port 3001
npm run luxury-gate -- --diff apps/web --slice storefront-shell--global-chrome \
  --preview-url http://localhost:3001/fr
```

1. Exit code **0** on current branch (post-**2.1b** dedupe) with `llm_calls: 0`.
2. Output rows use schema `{ floor_id, observed, threshold, reference_violated, status }`.
3. `lighthouse`, `asset_host`, `catalogue_frame_uniqueness` (if preview unreachable) report **`blocked`**, not pass/skip — unless preview is up and frames check is explicitly run.
4. Gate scores **built HTML** at `--preview-url` via **3a** selectors (`header`, `wordmark`, `hero`, `catalogue-grid` alias on featured carousel) — not `maison-pass.html`.
5. Gate reads `slice-paths.json` shell files + audited image paths from **2.1b** for grep/asset scorers on source; layout-metrics uses fetched DOM.
6. Grep of `luxury-brand-gate.ts` shows zero `CURSOR_API_KEY` / Cursor adapter imports.

---

## After 3b

- **3c** (`phase-orchestrator` allowlist graft) opens only after this pass record is filled.
- **CMS-a → CMS-e** (`STEP-CMS-EVIDENCE.md`) opens only after **3b** pass record is filled.
- Step 4 (marketplace-heavy regression in `apps/web`) remains queued until **3b** is green.

---

## 3b pass record (Skeptic fills when green)

```
commit: (pending — Spark landing allowlisted 3b commit)
command: npm run luxury-gate -- --diff apps/web --slice storefront-shell--global-chrome --preview-url http://localhost:3001/fr
exit_code: 1 (parser honest — see frame rows; dhash fail on cafe-de-flore ↔ PHOTO-23-17-32 MD5 twin)
llm_calls: 0
blocked_floor_ids: [lighthouse, asset_host, look_elise_gallery]
catalogue_frame_rows:
  - fr_featured_carousel:frames=7, dhash_zero_pairs=1 (parser resolves Next.js srcSet; 7th frame is editorial cafe-de-flore inside catalogue-grid section)
  - look_elise_gallery:frames=0 (blocked — product-gallery hook not on product page yet)
prerequisite_2_1b_commit: 9bb2344
prerequisite_3a_commit: f6e9a36
forbidden_paths_touched: none (required)
pass: false (pending image dedupe of cafe-de-flore / sac-celeste twin + Skeptic re-run)
```
