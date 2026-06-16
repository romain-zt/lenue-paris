# Step 3 evidence — `apps/web` live gate + orchestrator graft

Contract anchor: all storefront enforcement scopes to `apps/web/` only. Fixtures in
`.project/lenue-luxury/fixtures/` remain calibration; Step 3 proves the gate on built
Next.js HTML from the real app.

Step 3 is **not** started until Step 2 is signed at commit `765d369`.

---

## 3a — `data-maison` hooks + `slice-paths.json`

**Done when all of the following pass on disk:**

1. `.project/lenue-luxury/slice-paths.json` maps `storefront-shell--global-chrome` to:
   - `apps/web/src/components/Header.tsx`
   - `apps/web/src/app/[locale]/page.tsx`
   - `apps/web/src/app/[locale]/layout.tsx`
   - `apps/web/src/app/globals.css`
   - `apps/web/src/components/product/OrderCTA.tsx`

2. Those five files expose golden selectors from
   `selectors/storefront-shell--global-chrome.json`:
   - `[data-maison="header"]`, `[data-maison="wordmark"]`, `[data-maison="nav"]`
   - `[data-maison="hero"]`, `[data-maison="hero-image"]` (or equivalent hero img hook)
   - `[data-maison="footer"]`, `[data-maison="footer-instagram"]`, `[data-maison="cta-whatsapp"]`
   - `[data-maison="catalogue-grid"]` when the slice includes a grid on the home route

3. Unit or integration test (no LLM): after `pnpm --filter web build` and
   `pnpm --filter web start` on port 3000, Playwright (or equivalent) fetches
   `http://localhost:3000/fr` and asserts each required `[data-maison="…"]` selector
   is present in the rendered DOM.

4. Grep of Step 3 commit shows **no** edits to `phase-orchestrator.ts` until 3a tests
   are green (hooks land first).

**Hard stop artifact:** test file path + green run recorded in this section when complete.

---

## 3b — `luxury-gate --diff apps/web` on current `main`

**Done when:**

```bash
cd .github/scripts/core
pnpm --filter web build --dir ../../../apps/web   # or repo-root pnpm --filter web build
pnpm --filter web start --dir ../../../apps/web &  # port 3000, pinned in test
npm run luxury-gate -- --diff apps/web --slice storefront-shell--global-chrome \
  --preview-url http://localhost:3000/fr
```

1. Exit code **0** on current `main` (maison-clean storefront) with `llm_calls: 0`.

2. Output rows use the same schema as fixtures:
   `{ floor_id, observed, threshold, reference_violated, status }`.

3. `lighthouse` and `asset_host` (S3/ffprobe) report **`blocked`**, not `pass` and not
   silent skip, until preview/Lighthouse wiring and asset secrets exist.

4. Gate reads only files listed in `slice-paths.json` for the given `--slice` plus
   built HTML from `--preview-url` — not static fixtures.

5. Grep of `luxury-brand-gate.ts` still shows zero `CURSOR_API_KEY` / subagent imports.

**Hard stop artifact:** paste `pass`, `llm_calls`, and `blocked` floor_ids from the
green run below.

```
# Record maintainer run:
pass: true
llm_calls: 0
blocked: [lighthouse, asset_host]
commit: (pending — 3b implementation on disk)
command: npm run luxury-gate -- --diff apps/web --slice storefront-shell--global-chrome --preview-url http://localhost:3001/fr
exit_code: 0
```

---

## 3c — `phase-orchestrator` allowlist dry-run

**Done when a scripted dry-run (no live agent) proves:**

1. **PRD injection fails:** compiled Manager prompt containing `docs/prd/PRD.md` body
   aborts or exits non-zero (same freeze semantics as agent-loop-kit freeze-bypass).

2. **Scope-slice-only passes:** compiled prompt contains
   `docs/product/scope-slices/storefront-shell--global-chrome.md` and
   `luxury-review-log.ndjson` tail, and **does not** contain `docs/prd/PRD.md`.

3. **Open floor blocks ready:** when `docs/state/luxury-review-log.ndjson` has any row
   with `status: fail` and no matching `status: resolved`, the worker path sets
   `can_pr_ready: false` (or equivalent) — `gh pr ready` must not be invoked.

4. **Failure re-entry:** seed one `{ floor_id, observed, threshold, reference_violated }`
   row from Step 2 marketplace-heavy run; the remediation prompt includes that JSON
   verbatim (same `floor_id` values).

5. Dry-run test lives in repo (e.g. `.github/scripts/core/quality/orchestrator-allowlist.test.ts`),
   invoked by `npm run test:maison` or a sibling `test:step3` script — not maintainer-only.

**Hard stop artifact:** test count + green output recorded below.

```
# Record dry-run:
tests_passed: 
can_pr_ready_with_open_floor: false (required)
```

---

## Step 3 complete

Step 3 advances to Step 4 only when **3a, 3b, and 3c** evidence blocks above are
filled and all tests green. Step 4 then commits deliberate marketplace violations
**inside `apps/web`** to prove `--diff` exits non-zero on real components.

## Explicitly not Step 3

- No `REQUIRED_CHECKS` / `luxury-brand-gate.yml` CI wiring
- No Cursor LLM advisory reviewers (Step 5)
- No `phash_mood_board` live scorer until hero asset paths exist in slice (Step 2.1)
