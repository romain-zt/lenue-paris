# Step 3a evidence — instrumentation only (`apps/web`)

Spark is cleared for **3a only**. **3b**, **3c**, and any `--diff` / orchestrator work remain blocked.

Contract anchor: `apps/web/` storefront at port **3001** (`next dev` / `next start -p 3001` in
`apps/web/package.json`), not 3000.

---

## Allowed files in the 3a commit (allowlist)

Only these paths may change in the single 3a commit (plus lockfile if Playwright is added):

| Path | Purpose |
|------|---------|
| `.project/lenue-luxury/slice-paths.json` | Slice → `apps/web` file map |
| `.project/lenue-luxury/STEP-3A-EVIDENCE.md` | Evidence record (fill pass block below) |
| `apps/web/src/components/Header.tsx` | `header`, `wordmark`, `nav` hooks |
| `apps/web/src/app/[locale]/page.tsx` | `hero`, `hero-image`, featured surface hook |
| `apps/web/src/app/[locale]/layout.tsx` | `footer`, `footer-instagram` hooks |
| `apps/web/src/app/globals.css` | Layout tokens only — **no** `data-maison` in CSS |
| `apps/web/src/components/product/OrderCTA.tsx` | `cta-whatsapp` hook (component source) |
| `apps/web/**/__tests__/*maison*` or `apps/web/e2e/*maison*` | Playwright / DOM proof test |
| `apps/web/package.json` | Playwright devDependency + `test:maison-hooks` script only |

Any other path in the 3a commit **fails the gate**, including partial Step 3b/3c work.

---

## Forbidden in 3a (grep / diff must be clean)

The 3a commit **must not** touch or add:

- `.github/scripts/core/luxury-brand-gate.ts` — especially no `--diff`, `--slice`, or preview fetch logic
- `.github/scripts/core/phase-orchestrator.ts`
- `.github/workflows/*luxury*` or `REQUIRED_CHECKS` changes
- `docs/state/luxury-review-log.ndjson` seeding for orchestrator re-entry
- Any `CURSOR_API_KEY`, subagent, or LLM advisory wiring

If `git diff HEAD~1 --name-only` includes any forbidden path, **3a is rejected** even if hooks tests pass.

---

## `slice-paths.json`

Must map `storefront-shell--global-chrome` → exactly these five paths:

1. `apps/web/src/components/Header.tsx`
2. `apps/web/src/app/[locale]/page.tsx`
3. `apps/web/src/app/[locale]/layout.tsx`
4. `apps/web/src/app/globals.css`
5. `apps/web/src/components/product/OrderCTA.tsx`

Include `preview_url: "http://localhost:3001/fr"` and `preview_port: 3001`.

A unit test in the 3a suite must load `slice-paths.json` and assert every listed file exists on disk.

---

## Golden selectors vs live `/fr` DOM

Hooks must align with `selectors/storefront-shell--global-chrome.json`. The Playwright proof
runs against **built** HTML at `http://localhost:3001/fr` after:

```bash
pnpm --filter web build
pnpm --filter web start   # binds :3001
```

**Required on `/fr` rendered DOM** (must be visible in DOM, not source-only):

- `[data-maison="header"]`
- `[data-maison="wordmark"]`
- `[data-maison="nav"]`
- `[data-maison="hero"]`
- `[data-maison="hero-image"]` or `img` inside `[data-maison="hero"]`
- `[data-maison="footer"]`

**Home route adaptations** (do not fake marketplace UI):

- Home uses `FeaturedProductsScroll`, not a catalogue grid. Tag the featured section with
  `[data-maison="catalogue-grid"]` **or** add `featured-products` to golden selectors in the
  **same 3a commit** and document the mapping in `slice-paths.json`. Do not assert a grid that
  does not exist.
- `[data-maison="cta-whatsapp"]` is **not** on `/fr` today (lives on product pages via
  `OrderCTA.tsx`). 3a proof: assert hook on `OrderCTA` via a **second** Playwright navigation to
  one product URL (e.g. `/fr/produits/robe-camille`) **or** a focused component test that
  renders `OrderCTA` — do not put a fake WhatsApp CTA on the hero.
- `[data-maison="footer-instagram"]`: required only if an Instagram link exists in footer chrome;
  if not yet in UI, omit from `/fr` Playwright assertions until editorial slice adds it — do not
  fail 3a on a link the shell has not shipped.

---

## Playwright proof (hard stop)

1. Test file lives under `apps/web/` and runs via `pnpm --filter web test:maison-hooks` (or
   documented equivalent).
2. Test spawns or assumes `next start` on port **3001** — port pinned in test, not env default.
3. Test fails if any required `/fr` selector is missing.
4. Test does **not** invoke `luxury-brand-gate`, layout-metrics floors, or maison scorers — hooks
   presence only.
5. Green run recorded below.

---

## 3a pass record (fill when green)

```
commit: f6e9a36
test_command: pnpm --filter web test:maison-hooks
test_result: 2/2 (playwright 1 + OrderCTA.maison vitest 1)
selectors_asserted_on_fr: [header, wordmark, nav, hero, hero-image, footer, catalogue-grid]
cta_whatsapp_proof: OrderCTA component test
forbidden_paths_touched: none (required)
```

---

## After 3a

**3b** may add `--diff apps/web` to `luxury-brand-gate.ts` only after this pass record is filled.
**3c** remains blocked until **3b** is green on current `main`.
