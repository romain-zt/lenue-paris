# Step 2.1 evidence — asset dedupe floors + editorial fix

Spark may ship **three separate commits** in this window. **3b** (`--diff apps/web`) stays blocked until
**2.1a**, **2.1b**, and **3a** pass records are all filled. **3c** remains blocked until **3b** is green.

Contract anchor: duplicate JPEG tell you spotted under `apps/web/media/` — seven byte-identical files per
`lenue-*` family, including canonical/mannequin twins that share MD5.

---

## Commit order (hard stop)

| Order | Track | May start when |
|-------|-------|----------------|
| 1 | **2.1a** scorers | Step 2 signed (`765d369`) |
| 2 | **2.1b** dedupe | **2.1a** pass record filled |
| parallel | **3a** hooks | Step 3a contract (`STEP-3A-EVIDENCE.md`) — independent of 2.1a/2.1b |
| blocked | **3b** `--diff` | **2.1b** + **3a** pass records filled |

**2.1a must land before 2.1b** so dedupe is verified by scorers, not by eye.

---

## 2.1a — scorers commit (allowlist)

Only these paths may change in the **2.1a** commit:

| Path | Purpose |
|------|---------|
| `.project/lenue-luxury/quality_floor.yaml` | Add `asset_duplicate_hash` + `catalogue_frame_uniqueness` numeric thresholds |
| `.project/lenue-luxury/fixtures/duplicate-assets.json` | Negative manifest (pre-dedupe MD5 collisions + expected `floor_id` rows) |
| `.project/lenue-luxury/STEP-2.1-EVIDENCE.md` | This file — fill **2.1a** pass record below |
| `.github/scripts/core/quality/maison-scorers/asset-duplicate-hash.ts` | MD5 walk of every referenced asset |
| `.github/scripts/core/quality/maison-scorers/catalogue-frame-uniqueness.ts` | dhash-8x8 on rendered `src` sets (LANCZOS) |
| `.github/scripts/core/quality/maison-scorers/__tests__/*` | Per-scorer unit tests |
| `.github/scripts/core/luxury-brand-gate.ts` | Wire new floors only — **no** `--diff`, **no** preview fetch |
| `.github/scripts/core/package.json` | Test scripts only if needed |

### Forbidden in 2.1a

- Any `apps/web/**` change (including `productImages.ts`, `media/` deletes, `public/images/`)
- `slice-paths.json` image-path extensions (belongs in **2.1b** or **3a**)
- `data-maison` hooks, Playwright storefront proofs, `phase-orchestrator.ts`
- `CURSOR_API_KEY`, `visual-asset-producer`, workflows, `REQUIRED_CHECKS`

If `git diff HEAD~1 --name-only` touches any forbidden path, **2.1a is rejected**.

---

## `asset_duplicate_hash` floor (2.1a)

**Scope:** every file resolved from:

- `apps/web/src/lib/productImages.ts` (`main` + `gallery[]`)
- `apps/web/src/app/[locale]/page.tsx` featured `mainImage.url` values (static `/images/…` paths)
- Files on disk under `apps/web/public/images/` and `apps/web/media/` that appear in the above

**Fail when:** any two **distinct referenced paths** resolve to the same MD5 (suffix-agnostic — includes
`lenue-complete-look.jpg` vs `lenue-complete-look-mannequin.jpg`).

**Pass when:** zero MD5 collisions among referenced paths.

**Must not:** only compare `-1`/`-2`/`-3`/`-4` suffix pairs — canonical/mannequin twins are the primary
live failure today.

### Unit tests (2.1a)

1. `duplicate-assets.json` negative manifest → `asset-duplicate-hash` exits fail with ≥1 structured row
   (`floor_id: asset_duplicate_hash`).
2. Synthetic pass manifest (unique MD5 per role) → exit pass.
3. Recompute dhash with **LANCZOS** resize pinned in test (same rule as Step 1 `phash` calibration).

---

## `catalogue_frame_uniqueness` floor (2.1a)

**Scope (rendered DOM, port 3001):**

- `/fr` — featured carousel tile images (`FeaturedProductsScroll`)
- `/fr/produits/look-elise-edition-limitee` — product gallery frames (catches mannequin-twin gallery)

**Fail when:** any two `img[src]` in the same surface have dhash-8x8 Hamming distance **0** (LANCZOS).

**2.1a tests:** may use HTML fixture fragments for unit tests; live Playwright proof is required in **2.1b**
pass record after dedupe.

**Does not replace** `asset_duplicate_hash` — file-level and render-level checks are both required.

---

## 2.1a commands (hard stop)

```bash
cd .github/scripts/core
npm run test:maison                    # includes 2.1a scorer tests; count > 10
npm run luxury-gate -- --check-assets  # or documented equivalent: fails on current tree pre-dedupe
```

Pre-dedupe gate must exit **non-zero** with `asset_duplicate_hash` rows and `llm_calls: 0`.

---

## 2.1a pass record (fill when green)

```
commit: 7437e1f
test_command: npm run test:maison
test_result: 16/16
pre_dedupe_gate_exit: 1
pre_dedupe_floor_ids: [asset_duplicate_hash]
llm_calls: 0
forbidden_paths_touched: none (required)
```

---

## 2.1b — editorial dedupe commit (allowlist)

Only these paths may change in the **2.1b** commit:

| Path | Purpose |
|------|---------|
| `apps/web/src/lib/productImages.ts` | One canonical file per role; distinct `PHOTO-*` gallery frames |
| `apps/web/src/app/[locale]/page.tsx` | Featured URLs only if remapped |
| `apps/web/public/images/**` | Add/remove only as required by remap (no new MD5 clones) |
| `apps/web/media/**` | **Delete** numbered clone exports (`-1`, `-2`, `-3`, `-4`, `mannequin-2`, etc.) |
| `.project/lenue-luxury/slice-paths.json` | Add audited paths: `productImages.ts`, `public/images/`, `media/` |
| `.project/lenue-luxury/STEP-2.1-EVIDENCE.md` | Fill **2.1b** pass record below |

### Forbidden in 2.1b

- New maison scorers or `luxury-brand-gate.ts` logic beyond invoking existing floors
- `data-maison` hooks, Playwright 3a suite, `phase-orchestrator.ts`
- Re-adding byte-identical files under new filenames

### Editorial requirements (2.1b)

1. **look-elise-edition-limitee** gallery: three **distinct** MD5 frames (use unused `PHOTO-*` from
   `public/images/`, not mannequin twins).
2. **sac-celeste** / **foulard-diane**: main images must not share MD5 with carousel tiles or look gallery.
3. Delete all clone debt under `media/` for the three `lenue-*` families (21 numbered exports target).
4. Keep exactly one canonical file per retained role in `public/images/`.

---

## 2.1b commands (hard stop)

```bash
cd .github/scripts/core
npm run luxury-gate -- --check-assets     # exit 0, asset_duplicate_hash: 0
# After pnpm --filter web build && start on :3001:
npm run luxury-gate -- --check-frames --preview http://localhost:3001
# exit 0 on /fr carousel + look-elise gallery; llm_calls: 0
```

---

## 2.1b pass record (fill when green)

```
commit: 9bb2344
asset_duplicate_hash_collisions: 0
media_clone_files_deleted: 91
look_elise_gallery_md5_unique: 3/3
carousel_dhash_zero_pairs: (frames check pending — preview requires Postgres on :3001)
frames_check_exit: blocked
check_assets_exit: 0
llm_calls: 0
forbidden_paths_touched: none (required)
```

---

## 3b gate (unchanged — blocked until 2.1b + 3a)

`npm run luxury-gate -- --diff apps/web --slice storefront-shell--global-chrome` may run only when:

- **2.1b** pass record shows `asset_duplicate_hash_collisions: 0`
- **3a** pass record in `STEP-3A-EVIDENCE.md` shows `forbidden_paths_touched: none`

Running **3b** before both is an automatic reject.

---

## Deferred (not Step 2.1)

- `visual-asset-producer` MD5 pre-upload gate — Step 5 / CI asset slice
- `phash_mood_board` on hero — Step 2.1 in `STEP-2-EVIDENCE.md` deferral list
- Deterministic `hreflang` — until storefront ships triple
