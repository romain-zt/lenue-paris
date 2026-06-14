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

**`orch-product-detail--gallery-and-variants` — COMPLETE (2026-06-14)**

Implemented in PR #44 (`orchestrator/tracking-orch-product-detail--gallery-and-variants-1781461775624`):

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
| whatsapp-checkout | P1 | whatsapp-checkout--order-save-and-handoff | not-started |
| cms-products | P2 | cms-products--product-management; cms-products--order-viewing | not-started |
| editorial | P2 | editorial--brand-page | not-started |
| i18n | P3 | i18n--localized-storefront | not-started |

## Known issues / decisions in effect

- **PD-007** (`docs/product-decisions/PD-007-implementation-phase.md`) authored and `approved` — implementation phase is now formally authorized.
- **storefront-shell--global-chrome** is not yet implemented; both the catalogue page and product detail page render without a shared chrome (acceptable stub for v0 slices). The next step should implement the global chrome.
- **WhatsApp CTA** on product detail (`OrderCTA`) builds a `wa.me/?text=` link. The whatsapp-checkout slice will wire up order persistence before opening WhatsApp.
- **`@payloadcms/next` peer dependency** expects a narrower Next.js range than 15.5.x; install succeeds and all checks pass. No action needed.
- **Open questions folder**: `docs/prd/questions copy/open-questions.md` vs canonical `docs/prd/questions/open-questions.md` — content is complete; worth renaming.
- **PD files** (PD-001, PD-006, PD-008) are not authored as standalone records; no blocker for current work.

## Next recommended step

1. **`orch-storefront-shell--global-chrome`** (P0) — shared layout/chrome (header, navigation) so both pages have proper context; unblocks visual QA.
2. **`orch-whatsapp-checkout--order-save-and-handoff`** (P1) — saves the order and opens WhatsApp; upgrades the OrderCTA stub.
3. **`orch-cms-products--product-management`** (P2) — CMS authoring for products.
