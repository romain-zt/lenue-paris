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

**`orch-product-catalog--category-grid` — COMPLETE (2026-06-14)**

Implemented in PR #40 (`orchestrator/tracking-orch-product-catalog--category-grid-1781456424537`):

- **Governance**: PD-007 authored, two user stories (`US-001` browse grid, `US-002` filter by category) promoted to `ready-for-spec`, combined spec promoted to `ready-for-implementation`.
- **Monorepo bootstrap**: Scaffolded from `.cursor/core/templates/starter-monorepo/` — `apps/web`, `apps/cms`, `packages/typescript-config`, root config files.
- **Data/schema**: `apps/cms/src/collections/Products.ts` — Payload 3 collection with `title` (i18n), `slug`, `category` (dresses/bags/scarfs), `price` (EUR), `mainImage` (→ Media), draft/publish versions.
- **UI (layer 5)**: `/catalogue` page (`apps/web/src/app/(storefront)/catalogue/`) with RSC data fetch from Payload REST API, `CategoryFilter` client component for client-side filtering, `ProductGrid`, `ProductCard`, `ProductCardSkeleton`, `EmptyState` states.
- **Tests**: 11 unit tests (Vitest + Testing Library), all green.
- **Typecheck**: `pnpm --filter web typecheck` passes (0 errors).

## Decomposition status (2026-06-14)

**7 v0 Feature Areas `delivery-ready`, 8 Scope Slices `ready-for-user-stories`.**

| Feature Area | Band | Scope Slice(s) | Implementation status |
|---|---|---|---|
| storefront-shell | P0 | storefront-shell--global-chrome | not-started |
| product-catalog | P0 | product-catalog--category-grid | **complete** |
| product-detail | P1 | product-detail--gallery-and-variants | not-started |
| whatsapp-checkout | P1 | whatsapp-checkout--order-save-and-handoff | not-started |
| cms-products | P2 | cms-products--product-management; cms-products--order-viewing | not-started |
| editorial | P2 | editorial--brand-page | not-started |
| i18n | P3 | i18n--localized-storefront | not-started |

## Known issues / decisions in effect

- **PD-007** (`docs/product-decisions/PD-007-implementation-phase.md`) authored and `approved` — implementation phase is now formally authorized.
- **storefront-shell--global-chrome** is not yet implemented; the catalogue page renders without a shared chrome (acceptable stub for v0 category grid step). The next step should implement the global chrome first.
- **Product detail page** (`/produits/[slug]`) is linked from `ProductCard` but not yet implemented — product-detail--gallery-and-variants slice is next in P1 band.
- **`@payloadcms/next` peer dependency** expects a narrower Next.js range than 15.5.x; install succeeds and all checks pass. No action needed.
- **Open questions folder**: `docs/prd/questions copy/open-questions.md` vs canonical `docs/prd/questions/open-questions.md` — content is complete; worth renaming.
- **PD files** (PD-001, PD-006, PD-008) are not authored as standalone records; no blocker for current work.

## Next recommended step

1. **`orch-storefront-shell--global-chrome`** (P0) — implement the shared layout/chrome (header, navigation) so the catalogue page has proper context; this also unblocks visual QA.
2. **`orch-product-detail--gallery-and-variants`** (P1) — implement `/produits/[slug]` page so the catalogue card links resolve.
3. **`orch-whatsapp-checkout--order-save-and-handoff`** (P1) — WhatsApp CTA flow.
