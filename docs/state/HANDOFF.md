# Project HANDOFF

> Living context for cloud agents. The PR reviewer and every orchestrator step agent
> read this file **first**. Keep it short, current, and honest. Update it as the last
> step of every run (what changed, what's next, what's blocked).

## What this project is

Lénue Paris — a luxury fashion boutique storefront built with Next.js 15 (App Router) +
Payload CMS 3 (Postgres/Neon), deployed on Vercel. Buyers browse dresses, bags, and scarfs
and order via WhatsApp. See `docs/project.config.md` for identity, stack, priority bands,
and the v0 boundary.

## Current architecture

- Monorepo: `apps/web` (Next.js 15, App Router), `apps/cms` (Payload 3), `packages/typescript-config` (pnpm + turbo).
- Stack: Next.js 15 · Payload 3 · Postgres (Neon) · S3/MinIO media · Tailwind CSS v4 · Vitest.
- See `.cursor/core/rules/40-architecture-baseline.mdc` and `docs/project.config.md`.

## Active work

**`orch-whatsapp-checkout--order-save-and-handoff` — COMPLETE (2026-06-14)**

Tracking PR #59 (`orchestrator/tracking-orch-whatsapp-checkout--order-save-and-handoff-1781471789620`).

**What was built:**

- **CMS schema**: New `Orders` Payload collection (`apps/cms/src/collections/Orders.ts`) — fields: `product` (optional relationship, no cascade), `productTitle`, `category`, `price` (all server-side snapshots), `length`, `size`, `buyerName`, `buyerContact`. Access: public create, auth-only read/update/delete. Registered in `payload.config.ts`.
- **API route**: `POST /api/orders` (`apps/web/src/app/api/orders/route.ts`) — validates request, looks up product from Payload REST to derive `price`/`title`/`category` server-side (client cannot tamper), creates order, returns `{ id }`. Returns 400/404/500 on errors.
- **UI**: Upgraded `OrderCTA` (`apps/web/src/components/product/OrderCTA.tsx`) — checkout form with `buyerName` + `buyerContact` (tel) fields, idle/submitting/success/error states, WhatsApp URL built pre-fetch via `window.location.href` (mobile-safe), confirmation with manual re-open link.
- **Types**: `apps/web/src/types/order.ts` — `CreateOrderRequest`, `CreateOrderResponse`, `CreateOrderError`.
- **WhatsApp number**: `+79117126262` from `NEXT_PUBLIC_WHATSAPP_NUMBER` env var (documented in code; fallback hardcoded).
- **Tests**: 46 total (39 web + 7 cms), all green. Typecheck clean on both apps.

**Reviewer notes (from vision-reviewer pre-challenge):**
- B1 (server-side price derivation): ✅ resolved — route looks up product from Payload, derives price/title/category
- B2 (public create + abuse): ✅ addressed — web route validates product existence; CMS create = public is acceptable for v0
- B3 (order survives product deletion): ✅ — `product` field is optional, denormalized snapshot is authoritative
- B4 (contract + integration tests): ✅ contract tests in place; integration test against real DB is deferred (v0 scope)
- B5 (handoff ordering): ✅ — URL prebuilt, `location.href` used, WhatsApp not opened on save failure

**Known open item:** WhatsApp number `+79117126262` is `+7` (Russia/Kazakhstan) country code — confirmed from scope slice docs (`+79117126262`). Move to `.env.example` as `NEXT_PUBLIC_WHATSAPP_NUMBER=79117126262` for production config.

**`setup` — COMPLETE (2026-06-14)**

Tracking PR #55 (`orchestrator/tracking-setup-1781469264704`).

- Replaced dev-placeholder home page with branded Lénue Paris landing page (hero, category grid, brand note).
- All checks pass: typecheck clean, 24 tests green (22 web + 2 cms).

**`orch-product-catalog--category-grid` — COMPLETE (2026-06-14)**

Tracking PR #56 (`orchestrator/tracking-orch-product-catalog--category-grid-1781469855459`). Prior run PR #47 was also complete; this run re-verified after orphan reset.

Implemented in main via prior merged commits:
- **UI**: `/catalogue` page (RSC) with `CatalogueClient`, `CategoryFilter` (Robes/Sacs/Foulards), `ProductGrid`, `ProductCard`, `ProductCardSkeleton`.
- **Tests**: 22 unit tests (Vitest + Testing Library), all green. Typecheck clean.
- **UX states**: populated grid, empty state, loading skeletons, error state, filtered view.

**`orch-product-detail--gallery-and-variants` — COMPLETE (2026-06-14)**

Implemented in PR #58 (`orchestrator/tracking-orch-product-detail--gallery-and-variants-1781471392958`):

- **CMS schema**: Extended `Products.ts` with `gallery` (array of media uploads) and `description` (localized textarea).
- **Types**: Updated `apps/web/src/types/product.ts` with `ProductGalleryItem`, `DressLength`, `DressSize`, `DRESS_SIZES`, `DRESS_LENGTHS`.
- **UI (layer 5)**:
  - `/produits/[slug]` page (RSC) with `generateMetadata`, `loading.tsx` skeleton, `not-found.tsx` error state.
  - `ProductGallery` — main image + thumbnail strip, client-side switching.
  - `VariantSelector` — length picker (Version longue / Version courte) for dresses.
  - `SizePicker` — XS/S/M/L/XL picker for dresses.
  - `OrderCTA` — carries selected variants into a WhatsApp deep-link; disabled and shows warning if dress has no selection yet. Bags/scarfs bypass selectors.
- **Tests**: 22 unit tests (Vitest + Testing Library), all green.
- **Vitest config**: Added `@/` alias (`resolve.alias`) so all tests using `@/types/product` resolve correctly.
- **Typecheck**: `pnpm --filter web typecheck` passes (0 errors).

## Decomposition status (2026-06-14)

**7 v0 Feature Areas `delivery-ready`, 8 Scope Slices.**

| Feature Area | Band | Scope Slice(s) | Implementation status |
|---|---|---|---|
| storefront-shell | P0 | storefront-shell--global-chrome | not-started |
| product-catalog | P0 | product-catalog--category-grid | **complete** |
| product-detail | P1 | product-detail--gallery-and-variants | **complete** |
| whatsapp-checkout | P1 | whatsapp-checkout--order-save-and-handoff | **complete** |
| cms-products | P2 | cms-products--product-management; cms-products--order-viewing | not-started |
| editorial | P2 | editorial--brand-page | not-started |
| i18n | P3 | i18n--localized-storefront | **complete** |

## Known issues / decisions in effect

- **PD-007** (`docs/product-decisions/PD-007-implementation-phase.md`) authored and `approved` — implementation phase is now formally authorized.
- **storefront-shell--global-chrome** is not yet implemented; both the catalogue page and product detail page render without a shared chrome (acceptable stub for v0 slices). The next step should implement the global chrome.
- **WhatsApp CTA** on product detail (`OrderCTA`) now has a full checkout form — buyer fields, order persistence, and WhatsApp deep-link handoff.
- **`@payloadcms/next` peer dependency** expects a narrower Next.js range than 15.5.x; install succeeds and all checks pass. No action needed.
- **Open questions folder**: `docs/prd/questions copy/open-questions.md` vs canonical `docs/prd/questions/open-questions.md` — content is complete; worth renaming.
- **PD files** (PD-001, PD-006, PD-008) are not authored as standalone records; no blocker for current work.

**`orch-cms-products--product-management` — IN-REVIEW (2026-06-15)**

Tracking PR #61 (`orchestrator/tracking-orch-cms-products--product-management-1781500590553`).

**What was built:**

- **CMS schema (`apps/cms/src/collections/Products.ts`)**: Added three new fields to the Products collection:
  - `availableLengths` (select, hasMany, dress-only via admin.condition) — owner sets which lengths (longer/shorter) the dress is available in
  - `availableSizes` (select, hasMany, dress-only via admin.condition) — owner sets which sizes (XS–XL) the dress is available in
  - `pairings` (relationship, hasMany, self-ref to products) — **field-level `access.read` restricted to auth users** to prevent buyer exposure; owner-only for v0
- **CMS config (`apps/cms/src/payload.config.ts`)**: Added `"ru"` locale (fr primary + en + ru now all three per PRD).
- **CMS tests (`apps/cms/src/collections/Products.test.ts`)**: 8 unit tests covering slug, access, localization, variant field definitions, and the pairings anonymous-read restriction.
- **Web types (`apps/web/src/types/product.ts`)**: `Product` interface extended with `availableLengths?: DressLength[] | null`, `availableSizes?: DressSize[] | null`, `pairings?: Array<{id:string;title:string}> | null` — reuses existing exported types.
- **User story**: `docs/product/user-stories/cms-products--product-management--US-001--manage-products.md`

**Checks:** 15 CMS tests (all green) + 39 web tests (all green). Typecheck clean on both apps.

**Known open item (infrastructure, pre-existing gap):** No Payload migration files committed — the project has no `migrations/` dir and prior field additions (gallery, description) were merged the same way. Payload's auto-push covers dev/staging; a prod migration step (`payload migrate`) is needed before deploying to Neon. Not a blocker for v0 but worth adding to the stack before first production deploy.

**`orch-cms-products--order-viewing` — IN-REVIEW (2026-06-15)**

Tracking PR #62 (`orchestrator/tracking-orch-cms-products--order-viewing-1781501840309`).

**What was built:**

- **CMS admin config (`apps/cms/src/collections/Orders.ts`)**: Improved Payload admin presentation for the owner:
  - `admin.defaultColumns`: `productTitle, category, buyerName, buyerContact, price, createdAt` — key order info visible at a glance in the list view
  - `admin.description`: "Commandes passées par les acheteurs. Lecture seule — la prise en charge se fait sur WhatsApp."
  - `admin.group: "Boutique"` — grouped alongside Products in the admin sidebar
  - All fields, access control, and data schema unchanged
- **User story**: `docs/product/user-stories/cms-products--order-viewing--US-001--view-orders.md`
- **Tests (`apps/cms/src/collections/Orders.test.ts`)**: 4 new tests covering admin config (9 total, all green)

**Checks:** 19 CMS tests + 39 web tests green, typecheck clean on both apps.

**UX states covered by Payload admin automatically:** empty, list, detail, loading, error — no custom UI needed.

**`orch-editorial--brand-page` — IN-REVIEW (2026-06-15)**

Tracking PR #64 (`orchestrator/tracking-orch-editorial--brand-page-1781507732913`).

**What was built:**

- **CMS schema (`apps/cms/src/collections/Pages.ts`)**: Changed `body` from `richText` to `textarea` (plain string, no Lexical serializer needed on web). Added `admin.group: "Boutique"` and `admin.description`. 4 Pages tests pass.
- **Types (`apps/web/src/types/page.ts`)**: `Page`, `PageCover`, `PagesResponse` interfaces.
- **Data layer (`apps/web/src/lib/getPage.ts`, `getBrandPageData.ts`)**: `getPage(slug)` fetches from Payload `locale=fr`, revalidate 3600, returns null on error. `getBrandPageData()` resolves CMS page or falls back to fr hardcoded copy.
- **Fallback copy (`apps/web/src/lib/brandPageCopy.ts`)**: `BRAND_PAGE_COPY` with brand story in fr (primary), en, ru.
- **UI (`apps/web/src/app/(storefront)/a-propos/`)**: RSC page with `generateMetadata`, `BrandPageContent` client component (full-bleed cover image, prose title/body), `loading.tsx` skeleton, `not-found.tsx` with back link.
- **Navigation (`apps/web/src/app/layout.tsx`)**: Minimal footer with Boutique / Catalogue / À propos links (nav entry for the editorial page).
- **Tests**: 7 new web tests covering all UX states (CMS path, fallback, image-unavailable, skeleton, not-found, nav link). All 46 web tests pass, all 21 CMS tests pass. Typecheck clean on both apps.

**Challenge resolutions (vision-reviewer):**
- ru is confirmed in CMS config (added in prior step orch-cms-products--product-management)
- Pages has no `_status` — no draft filter used in fetch
- richText→textarea: no Lexical serializer needed in web
- subtitle dropped (gold-plating)
- Hardcoded fallback copy is the v0 brand story; CMS is for owner customization

**`orch-i18n--localized-storefront` — COMPLETE (2026-06-15)**

Tracking PR #68 (`orchestrator/tracking-orch-i18n--localized-storefront-1781512609328`).

**What was built:**

- **Root layout fix (`apps/web/src/app/layout.tsx`)**: Made minimal pass-through (imports globals.css, returns children). The `[locale]/layout.tsx` renders `<html lang={locale}><body>...</body></html>`.
- **Brand page migration**: `(storefront)/a-propos/` moved to `[locale]/(storefront)/a-propos/` — page now calls `setRequestLocale`, passes locale to `getBrandPageData`, uses `getTranslations` for metadata.
- **Data layer**: `getPage(slug, locale?)` and `getBrandPageData(locale?)` updated to accept locale; fallback copy uses `BRAND_PAGE_COPY[locale]` instead of always fr.
- **Footer localization**: `[locale]/layout.tsx` has a localized footer using `getTranslations("footer")` and `Link` from `@/i18n/navigation`.
- **Messages**: Added `"footer"` namespace to fr/en/ru messages files.
- **User story**: `docs/product/user-stories/i18n--localized-storefront--US-001--browse-in-preferred-language.md`.
- **Tests**: 46 web + 21 cms tests all green. Typecheck clean on both apps.

**Locale switcher**: FR/EN/RU buttons already in Header (desktop + mobile) — persists via next-intl cookie. `localePrefix: "as-needed"` so fr URLs have no prefix.

**`orch-i18n--localized-storefront` — VALIDATED (2026-06-15, second pass)**

Tracking PR #68.

**Additional work in this pass (on top of prior `24dfad5`):**

- **`getPage(slug, locale?)`**: locale param threaded through CMS fetch (was hardcoded `fr`)
- **`getBrandPageData(locale?)`**: threads locale to `getPage`; fallback uses `BRAND_PAGE_COPY[locale] ?? BRAND_PAGE_COPY.fr`
- **`i18n/request.ts`**: French messages merged as base — missing en/ru keys fall back to French value
- **`about` + `footer` message sections**: added to fr/en/ru message files
- **User story**: `docs/product/user-stories/i18n--localized-storefront--US-001--switch-locale.md`
- **`docs/project.config.md`**: i18n row updated to `fr (primary) + en + ru`
- **Tests**: 9 new focused tests (getPage locale param, getBrandPageData locale fallback, request.ts fr-fallback merge)

**Final checks: 55 web + 21 CMS tests green, typecheck clean on both apps.**

**`orch-selection-ux--p0-primary-cta` — COMPLETE (2026-06-16)**

Tracking PR #81 (`orchestrator/tracking-orch-selection-ux--p0-primary-cta-1781642794357`).

**What was built:**

- **`SelectionProvider`**: Added `isPanelOpen`, `openPanel`, `closePanel` to context — shared panel state across all components.
- **`SelectionPill`**: Removed local `open` state; now uses context `isPanelOpen`/`openPanel`/`closePanel`. Panel opens from any component that calls `openPanel()`.
- **`OrderCTA`** (major refactor): Replaced checkout form (name/tel/fetch to `/api/orders`) with selection-aware CTA:
  - Dresses: VariantSelector + SizePicker → "Ajouter à ma sélection" (disabled until both variants picked) → `addItem({ slug, title, price, length, size })` + `openPanel()`
  - Bags/scarfs: button enabled immediately
  - Already in selection: shows "Ajoutée" (disabled)
  - Out-of-stock: unchanged WhatsApp interest link
  - `data-maison="cta-add-selection"` on primary button (brand gate hook)
- **`ProductPageContent`**: Removed standalone `AddToSelectionButton` (redundant; `OrderCTA` now handles add-to-selection with full variant awareness).
- **Tests**: Replaced 15 old checkout-form tests with 10 new selection-flow tests; fixed `ProductCard`, `ProductGrid`, `OrderCTA.maison` tests to mock `SelectionProvider`.

**Checks:** 90 web tests green (0 failed), typecheck clean.

**WhatsApp handoff location:** Inside `SelectionPanel` only, via "Continuer sur WhatsApp" → `buildMultiPieceWhatsAppMessage` (unchanged).

**Remediation note (2026-06-16):** Re-affirmed complete after orchestrator re-sync overwrote status.json with in-progress. Re-appended complete event; status.json regenerated from projection.

**`orch-selection-ux--p0-primary-cta` — COMPLETE (remediation pass, 2026-06-16)**

Tracking PR #81 (`orchestrator/tracking-orch-selection-ux--p0-primary-cta-1781642794357`).

**Remediation actions:**
- Branch was `CONFLICTING` vs `main` due to orchestrator commits (`remediation run 1/5`, `2/5`) touching `docs/state/status.json` while this branch also changed that file.
- Resolved by rebasing the tracking branch onto `origin/main`; the only conflict was `docs/state/status.json` (keep `remediation_counts` from main, keep `complete` status from this branch).
- Force-pushed the rebased branch. PR is now `MERGEABLE`.
- E2E failure (`maison-hooks.spec.ts` — server timeout on port 3001) is pre-existing across all PRs containing that spec; `REQUIRED_CHECKS` is `'quality'` only — E2E does not block merge.
- 90 web unit tests + typecheck clean confirmed locally.

**`orch-selection-ux--p0-list-overlay` — VALIDATED (2026-06-16)**

Tracking PR #84 (`orchestrator/tracking-orch-selection-ux--p0-list-overlay-1781647954597`).

**What was built:**

- **`AddToSelectionButton`**: Added `variant?: "default" | "overlay"` prop. Overlay variant: full-width (`w-full`), `bg-white/90`, `min-h-[36px]`, no absolute positioning (parent handles layout). Selected state shows quiet `t("inSelection")` label instead of `t("added")`.
- **`ProductCard`**: Restructured tile — image area uses an absolute-positioned `<Link>` cover for navigation; overlay `<div>` is outside the link at `z-10`; always visible below `xl` (≤1279px), hover fade at `xl` (≥1280px via `xl:opacity-0 xl:group-hover:opacity-100`). Out-of-stock products show no overlay.
- **Messages (`fr/en/ru`)**: Added `"inSelection"` key — fr: "Dans ma sélection", en: "In my selection", ru: "В моей подборке".
- **Tests**: 5 `ProductCard` tests + 4 new `AddToSelectionButton` tests (96 total, all green). Typecheck clean.

**Checks:** 96 web tests green, typecheck clean. luxury-gate infra (sharp + dev server) not available in agent env; `can_pr_ready: true` (no open floor failures listed).

**`orch-selection-ux--p0-drawer-motion` — IN-REVIEW (2026-06-16)**

Tracking PR #86 (`orchestrator/tracking-orch-selection-ux--p0-drawer-motion-1781649501367`).

**What was built:**

- **`SelectionPanel` animated mount** (`apps/web/src/components/selection/SelectionPill.tsx`): Replaced `if (!open) return null` with `mounted` + `visible` two-state pattern using `useEffect` + `requestAnimationFrame` double-frame defer for CSS transition triggering.
- **Backdrop:** `opacity 0 → 1` over 200ms, easing `cubic-bezier(0.25, 0.8, 0.25, 1)` (matches header nav `softEase`).
- **Mobile sheet:** `translateY(100%) → translateY(0)` over 300ms with same easing.
- **Desktop (sm+):** `opacity 0 → 1` + `translateY(-6px) → translateY(0)` over 250ms.
- **Close:** reverse animation plays, panel unmounts after 350ms delay.
- **`prefers-reduced-motion`:** `motion-reduce:!transition-none` on both backdrop and sheet — instant show/hide.
- **Tests** (`apps/web/src/components/selection/__tests__/SelectionPill.test.tsx`): 7 new tests written test-first. All 103 web tests pass, typecheck clean.

**`orch-catalogue--dress-only-public` — IN-REVIEW (2026-06-17)**

Tracking PR #88 (`orchestrator/tracking-orch-catalogue--dress-only-public-1781674681732`).

**What was built:**

The implementation was already in place across all allowlist files (prior runs had laid the groundwork). This run finalized the slice:

- **`storefrontCatalogue.ts`** (existing): `PUBLIC_DRESS_SLUGS = ["robe-camille","robe-louise","robe-margot"]`, `filterStorefrontProducts` filters by `category === 'dresses'`, `isPublicStorefrontSlug` gates draft/published in seed.
- **`queries.ts`** (existing): `getCataloguePage` queries only published dresses; `getCollectionBySlug` uses `filterStorefrontProducts`.
- **`seed.ts`** (existing): signature trio seeded as `published`; bags, scarfs, and non-signature dresses seeded as `draft`. `HOME_FEATURED_SLUGS = PUBLIC_DRESS_SLUGS`.
- **`productImages.ts`** (existing): each signature dress has 2–3 unique `PHOTO-*` gallery entries.
- **`CategoryFilter.tsx`** (existing): only "Tout" + "Robes" — no bags/scarfs filter.
- **`Header.tsx`** (existing): no bag/scarf category links.
- **`page.tsx` (home)** (existing): `categoryLinks` passes only `[{ href: "/catalogue" }]` to `HomeCategoryStrip` — no sac/foulard links.
- **Tests (this run)**: Fixed `CategoryFilter.test.tsx` to match dress-only implementation (removed stale Sacs/Foulards expectations). Added 7 new `storefrontCatalogue` tests (all 3 signature slugs, bag/scarf/non-signature rejection). Added gallery PHOTO-* test in `productImages.test.ts`. 112 web tests green, typecheck clean on both apps.
- **User story**: `docs/product/user-stories/catalogue--dress-only-public--US-001--dress-only-catalogue.md`

**Checks:** 112 web tests green (0 failed), typecheck clean on web + cms.

## Next recommended step

1. **`orch-storefront-shell--global-chrome`** (P0) — shared layout/chrome (header, navigation) so both pages have proper context; unblocks visual QA.
