# Step CMS evidence — Payload-driven storefront (post-3b)

**Blocked until:** **2.1b** dedupe pass record filled (`collisions: 0`) **and** **3b**
`--diff apps/web` exits 0 on `storefront-shell--global-chrome`.

Contract anchor: `apps/web/` storefront must read buyer-facing content from Payload only — no
`FEATURED_SLUGS`, no `PLACEHOLDER_BY_SLUG`, no buyer-facing image paths in route files.

This file is **contract-only** until **3b** passes. No CMS implementation may start before then.

---

## Commit order (hard stop)

| Order | Track | May start when |
|-------|-------|----------------|
| blocked | **CMS-a** seed idempotency | **3b** pass record filled |
| blocked | **CMS-b** `lib/cms/` + block mapper | **CMS-a** pass record filled |
| blocked | **CMS-c** loading skeletons | **CMS-b** pass record filled |
| blocked | **CMS-d** admin fr/en/ru UX | **CMS-c** pass record filled |
| blocked | **CMS-e** gate scorers | **CMS-d** pass record filled |

**CMS-b must not delete `PLACEHOLDER_BY_SLUG` until CMS-a proves a published home `Page` exists in
seed and CMS-e scorers are wired** — otherwise empty CMS shows blank screens instead of skeletons.

---

## CMS-a — idempotent seed (allowlist)

Only these paths may change in the **CMS-a** commit:

| Path | Purpose |
|------|---------|
| `apps/web/src/collections/Pages.ts` | Add `blocks` field: `hero`, `featuredProducts`, `editorialStrip` |
| `apps/web/src/seed.ts` | Upsert published home `Page` slug `home` + featured product relations |
| `apps/web/src/seed.test.ts` or `apps/web/src/__tests__/seed-idempotency.test.ts` | Re-run seed twice → row count unchanged |
| `.project/lenue-luxury/STEP-CMS-EVIDENCE.md` | Fill **CMS-a** pass record below |

### CMS-a hard stops

1. `pnpm --filter web seed` run **twice** → `pages` count for slug `home` = 1, featured relation
   count unchanged, no duplicate product slugs.
2. Home `Page` is `_status: published` in all three content locales (`fr`, `en`, `ru`).
3. Featured products linked by **relation** (product slug), not hardcoded URLs in seed prose.

### Forbidden in CMS-a

- Deleting `FEATURED_SLUGS` / `PLACEHOLDER_BY_SLUG` from `page.tsx`
- `lib/cms/` implementation (belongs in **CMS-b**)
- `loading.tsx` files (belongs in **CMS-c**)
- `payload.config.ts` admin `i18n` changes (belongs in **CMS-d**)

---

## CMS-b — thin data layer + block mapper (allowlist)

Only these paths may change in the **CMS-b** commit:

| Path | Purpose |
|------|---------|
| `apps/web/src/lib/cms/queries.ts` | `getHomePage(locale)`, `getPageBySlug(slug, locale)` |
| `apps/web/src/lib/cms/blocks.ts` | Typed block union + `mapBlocksToProps()` |
| `apps/web/src/lib/cms/types.ts` | DTOs for presentation layer |
| `apps/web/src/components/cms/HeroBlock.tsx` | Props only — no fetch |
| `apps/web/src/components/cms/FeaturedProductsBlock.tsx` | Props only — receives `Product[]` |
| `apps/web/src/app/[locale]/page.tsx` | Ten-line mapper: query → blocks → components |
| `apps/web/src/lib/cms/__tests__/*` | Unit tests on mapper + empty-state behaviour |

### CMS-b hard stops

1. `grep -r "PLACEHOLDER_BY_SLUG\|FEATURED_SLUGS" apps/web/src/app` → **zero matches**.
2. `grep -E '"/images/|/media/' apps/web/src/app/[locale]/page.tsx` → **zero matches** (no
   buyer-facing image paths in route file).
3. When Payload returns empty/missing home `Page`, route renders **skeleton** (wired in CMS-c) or
   explicit empty state — **never** silent fallback to hardcoded products.
4. `page.tsx` contains no buyer-facing copy strings — only `getTranslations` for chrome labels
   delegated to layout, or none at all on home body.

### Forbidden in CMS-b

- `loading.tsx` (CMS-c)
- Admin label rewrites (CMS-d)
- Gate scorer wiring (CMS-e)

---

## CMS-c — never-stuck loading (allowlist)

Only these paths may change in the **CMS-c** commit:

| Path | Purpose |
|------|---------|
| `apps/web/src/app/[locale]/loading.tsx` | Full-bleed hero + featured-carousel skeleton |
| `apps/web/src/app/[locale]/(storefront)/catalogue/loading.tsx` | Two-column tile skeleton at 375px |
| `apps/web/src/app/[locale]/(storefront)/catalogue/page.tsx` | Replace `Suspense fallback={null}` with skeleton component |
| `apps/web/src/components/skeletons/*` | Reusable maison skeleton primitives |
| `apps/web/e2e/*loading*` or `apps/web/**/__tests__/*loading*` | Assert `data-maison` hooks present in skeleton DOM |

### CMS-c hard stops

1. `apps/web/src/app/[locale]/loading.tsx` exists and renders `[data-maison="hero"]` +
   `[data-maison="catalogue-grid"]` skeleton surfaces (same hooks as **3a**).
2. Catalogue route has `loading.tsx` **or** non-null `Suspense` fallback — no `fallback={null}`.
3. Skeleton uses muted tokens / negative space — no centered spinner orphan.
4. Playwright or RTL test: navigating to `/fr` shows skeleton DOM before content hydrates (or
   documents `loading.tsx` static render test if SSR-only).

### Forbidden in CMS-c

- Payload collection schema changes
- `seed.ts` changes
- Admin `i18n` (CMS-d)

---

## CMS-d — admin fr/en/ru for boutique staff (allowlist)

Only these paths may change in the **CMS-d** commit:

| Path | Purpose |
|------|---------|
| `apps/web/src/payload.config.ts` | `i18n.supportedLanguages: { en, fr, ru }` |
| `apps/web/src/collections/Pages.ts` | Human `label` / `description` / `admin.group` in fr/en/ru |
| `apps/web/src/collections/Products.ts` | Same — boutique vocabulary, not dev jargon |
| `apps/web/src/collections/Media.ts` | Same for upload fields |
| `apps/web/src/i18n/admin-labels.ts` | Shared label map if needed |

### CMS-d hard stops

1. `payload.config.ts` `supportedLanguages` includes `ru` (not only content `localization`).
2. Every field an editor touches on `Pages` and `Products` has a human `label` — e.g.
   `Image de couverture` / `Cover image` / `Обложка`, not raw field name `cover`.
3. Collection `admin.group` uses boutique vocabulary: `Boutique`, `Produits`, `Médias` — not
   `Shop` / internal slugs.
4. Manual check documented: switch admin UI to `ru` → chrome is Russian, not English fallback.

### CMS-e prerequisite (i18n parity on storefront)

CMS-driven nav/footer strings (when moved to Payload globals or `Pages`) must pass existing
`i18n-key-parity` maison scorer across `fr` / `en` / `ru`.

---

## CMS-e — gate scorers (allowlist)

Only these paths may change in the **CMS-e** commit:

| Path | Purpose |
|------|---------|
| `.github/scripts/core/quality/maison-scorers/cms-no-fallback.ts` | Fail on `PLACEHOLDER_BY_SLUG` / `FEATURED_SLUGS` in `apps/web/src/app` |
| `.github/scripts/core/quality/maison-scorers/cms-route-purity.ts` | Fail on buyer-facing image path strings in route files |
| `.github/scripts/core/quality/maison-scorers/__tests__/cms-*.test.ts` | Negative fixture with placeholder pattern → exit fail |
| `.github/scripts/core/luxury-brand-gate.ts` | Wire CMS floors when `--diff apps/web` |
| `.project/lenue-luxury/quality_floor.yaml` | Add `cms_no_hardcoded_fallback`, `cms_route_purity` thresholds |

### CMS-e hard stops

1. `cms-no-fallback` grep of `apps/web/src/app/**/*.tsx` fails if `PLACEHOLDER_BY_SLUG`,
   `FEATURED_SLUGS`, or `isPlaceholder` fallback patterns exist.
2. `cms-route-purity` fails if any `[locale]/**/page.tsx` contains literal `/images/` or `/media/`
   path strings (presentation components and `lib/cms` may hold URLs; routes may not).
3. Gate run with `--diff apps/web` includes CMS floors with `llm_calls: 0`.
4. Negative unit test: synthetic route file with placeholder fallback → structured
   `{ floor_id, observed, threshold, reference_violated }` row.

---

## Queued beside CMS (same post-3b window)

These slices open only after **CMS-e** or in parallel if they do not touch CMS allowlists:

| Slice | Scope |
|-------|-------|
| `whatsapp-selection` | Multi-piece message prefill — no marketplace cart |
| `hero-motion` | ≤8s muted loop, `ffprobe` gate |
| `visual-asset-producer` | Editorial imagery + mood-board phash |

---

## CMS-a pass record (fill when green)

```
commit: d739fee
seed_twice_pages_home_count: 1
seed_twice_featured_count_unchanged: true
SEED_SKIP_HOME_IF_PUBLISHED: true (default)
forbidden_paths_touched: none
```

---

## CMS-b pass record (fill when green)

```
commit: e10bf2a
grep_PLACEHOLDER_BY_SLUG: 0
grep_FEATURED_SLUGS: 0
grep_image_paths_in_page_tsx: 0
lib_cms_blocks_test: 3/3
forbidden_paths_touched: none
```

---

## CMS-c pass record (fill when green)

```
commit: 38663ef
loading_tsx_locale: present
loading_tsx_catalogue: present
catalogue_suspense_fallback_null: 0
skeleton_data_maison_hooks: [hero, catalogue-grid]
loading_skeleton_tests: 2/2
forbidden_paths_touched: none
```

---

## CMS-d pass record (fill when green)

```
commit: de03169
admin_supported_languages: [en, fr, ru]
fields_with_human_labels: Pages, Products, Media, Collections, Orders
admin_groups: [Boutique, Contenu éditorial, Médias, Commandes]
forbidden_paths_touched: none
pass: true
```

---

## CMS-e pass record (fill when green)

```
commit: df70d65
cms_no_hardcoded_fallback: pass
cms_route_purity: pass
test_cms_scorers: 4/4
check_cms_exit: 0
llm_calls: 0
forbidden_paths_touched: none
```

---

## After CMS-e

Storefront is editor-owned: boutique staff change home hero and featured products in admin;
buyers never see developer placeholders; loading states match maison shell instrumentation from
**3a**; CI rejects any PR that reintroduces hardcoded fallbacks.

---

## CMS-a½ — Collections + catalogue productGrid (allowlist)

Only these paths may change in the **CMS-a½** commit:

| Path | Purpose |
|------|---------|
| `apps/web/src/collections/Collections.ts` | Curated product groups (slug, title, products relation) |
| `apps/web/src/collections/Pages.ts` | `productGrid` block + `featuredProducts.sourceType` |
| `apps/web/src/migrations/20260616_121945_collections_product_grid.ts` | Idempotent schema migration |
| `apps/web/src/lib/cms/queries.ts` | `getCollectionBySlug`, `getCataloguePage` |
| `apps/web/src/lib/cms/blocks.ts` | Collection-sourced featured + productGrid mapper |
| `apps/web/src/app/[locale]/(storefront)/collections/[slug]/page.tsx` | Collection storefront route |
| `apps/web/src/app/[locale]/(storefront)/catalogue/page.tsx` | CMS-driven catalogue title/products |
| `apps/web/src/seed.ts` | Seed collections + catalogue Page |
| `apps/web/src/payload.config.ts` | Register Collections collection |

### CMS-a½ hard stops

1. Staff curate **Collections** in admin — never one Page per SKU.
2. `/fr/collections/[slug]` renders ordered products from Payload relation.
3. Catalogue reads `productGrid` block from Page slug `catalogue` (falls back to all products).
4. Migration uses idempotent helpers (Vercel-safe after dev-push).

---

## CMS-a½ pass record (fill when green)

```
commit: 978915c
collections_seeded: [ete-2026, sacs, nouveautes]
catalogue_page_slug: catalogue
featured_source_type: manual
migration_idempotent: true
blocks_test: 3/3
tsc: pass
forbidden_paths_touched: none
pass: true
```
