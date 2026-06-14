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
| i18n | P3 | i18n--localized-storefront | not-started |

## Known issues / decisions in effect

- **PD-007** (`docs/product-decisions/PD-007-implementation-phase.md`) authored and `approved` — implementation phase is now formally authorized.
- **storefront-shell--global-chrome** is not yet implemented; both the catalogue page and product detail page render without a shared chrome (acceptable stub for v0 slices). The next step should implement the global chrome.
- **WhatsApp CTA** on product detail (`OrderCTA`) now has a full checkout form — buyer fields, order persistence, and WhatsApp deep-link handoff.
- **`@payloadcms/next` peer dependency** expects a narrower Next.js range than 15.5.x; install succeeds and all checks pass. No action needed.
- **Open questions folder**: `docs/prd/questions copy/open-questions.md` vs canonical `docs/prd/questions/open-questions.md` — content is complete; worth renaming.
- **PD files** (PD-001, PD-006, PD-008) are not authored as standalone records; no blocker for current work.

## Next recommended step

1. **`orch-storefront-shell--global-chrome`** (P0) — shared layout/chrome (header, navigation) so both pages have proper context; unblocks visual QA.
2. **`orch-cms-products--product-management`** (P2) — CMS authoring for products.
3. **`orch-cms-products--order-viewing`** (P2) — owner-side order viewing (Orders collection is now in place).
