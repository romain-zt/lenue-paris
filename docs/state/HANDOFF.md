# Project HANDOFF

> Living context for cloud agents. The PR reviewer and every orchestrator step agent
> read this file **first**. Keep it short, current, and honest. Update it as the last
> step of every run (what changed, what's next, what's blocked).

## What this project is

Lénue Paris — luxury fashion boutique for Russian-speaking women in France. Buyers browse dresses, bags, and scarfs, then order via WhatsApp. The storefront is Next.js 15 (fr primary, en secondary); the CMS is Payload 3 on Neon Postgres. Both are deployed on Vercel. No payment gateway — prices are listed in EUR; settlement is manual in WhatsApp.

## Current architecture

- **Monorepo:** `apps/web` (Next.js 15, port 3001), `apps/cms` (Payload 3, port 3000), `packages/typescript-config`. pnpm 9 + Turbo.
- **Data:** Payload collections — `users`, `media`, `pages`, **`products`** (new: title/slug/category/price/images, draft/publish).
- **Web surface:** `/` — category grid page. Fetches published products from Payload REST API (`CMS_URL/api/products`). Components: `CategoryFilter`, `ProductGrid`, `ProductCard`, `ProductCardSkeleton`. All UX states handled (populated, filtered, empty, loading, error).
- **Stack baseline:** see `.cursor/core/rules/40-architecture-baseline.mdc` and `docs/project.config.md`. Media via S3/MinIO; i18n locales fr + en.
- **Check commands:** `pnpm --filter @lenue-paris/web typecheck`, `pnpm --filter @lenue-paris/cms typecheck`, `pnpm --filter @lenue-paris/cms test`, `pnpm --filter @lenue-paris/web test` — all pass.

## Active work

- **`orch-product-catalog--category-grid` → COMPLETE** (2026-06-14, PR #42).
  - User story + spec authored: `docs/product/user-stories/product-catalog--category-grid--US-001--browse-and-filter.md`
  - Spec: `docs/product/specs/product-catalog--category-grid--US-001--browse-and-filter.spec.md`
  - 12 tests passing (8 CMS schema + 4 web contract).

## Decomposition status (2026-06-14)

**Advanced — 7 v0 Feature Areas `delivery-ready`, 8 Scope Slices `ready-for-user-stories`:**

| Feature Area | Band | Scope Slice(s) ready |
|---|---|---|
| storefront-shell | P0 | storefront-shell--global-chrome |
| product-catalog | P0 | product-catalog--category-grid |
| product-detail | P1 | product-detail--gallery-and-variants |
| whatsapp-checkout | P1 | whatsapp-checkout--order-save-and-handoff |
| cms-products | P2 | cms-products--product-management; cms-products--order-viewing |
| editorial | P2 | editorial--brand-page |
| i18n | P3 | i18n--localized-storefront |

Each FA passed a real FA-01–FA-09 + CC-02–CC-05 check (→ validated) and DR-01–DR-05 +
CC-01–CC-05 (→ delivery-ready). Each slice passed SS-01–SS-10 + CC-01–CC-05.

**Flow map:** all 7 PRD `# Flow Inventory` v0=Yes rows are wired in
`orchestration.prd-flow-map.json`. Verified with `sync-prd-orchestration.ts --strict`
(7/7 flows resolve to existing slice files; pipeline/status mutations from that dry-run
were reverted — appending pipeline steps is owned by `orchestration-automation`).

**Deferred (declared in `docs/project.config.md` priority bands but out of the v0 boundary — not decomposed, no FA files created):**

- `FA-search-filter` (P3) — free-text search / advanced filtering is not grounded in PRD v0.
  Category filtering (the only filter in the PRD) lives inside `product-catalog--category-grid`.
- `FA-wishlist` (P4) — PRD hard exclusion: user accounts / wishlist are out of v0.
- `FA-analytics` (P4) — no v0 product grounding in the PRD feature set (Lighthouse ≥90 is a
  quality metric, not an analytics feature).

**Blocked on a human:** none. All 12 discovery questions are answered; no open blockers.

## Known issues / decisions in effect

<!-- Gotchas an agent must know before touching code. Link product decisions. -->
- Implementation phase: check `docs/project.config.md` → "Implementation governance enabled".
  When `no`, agents must not write application runtime code.
- **Setup notes observed during decomposition (non-blocking):**
  - Open questions live at `docs/prd/questions copy/open-questions.md`; the canonical path
    referenced by the rules/commands is `docs/prd/questions/open-questions.md`. Content is
    complete (Q-001–Q-012 all answered), so this did not block decomposition. Worth renaming
    the folder to the canonical path.
  - `docs/product-decisions/` contains only `README.md`; the PD files referenced by config and
    checker (`PD-001`, `PD-006`, `PD-007`, `PD-008`) are not authored as standalone records.
    No Product Decision governs any v0 Feature Area's product contract — the PRD grounds all v0
    behavior (no credit model; payment is offline WhatsApp settlement per the PRD; no share
    controls) — so DR-03 passed with "none" for every FA. If a load-bearing product decision
    emerges later, author the PD and re-run Part 8.

## Next recommended step

Next P0 steps (in dependency order):
1. **`orch-storefront-shell--global-chrome`** — shared nav, footer, hero. Extends `apps/web/src/app/layout.tsx`. The category grid already renders within a minimal layout; this slice adds the branded chrome.
2. **`orch-cms-products--product-management`** — CMS admin UX for product creation/editing. The `products` Payload collection already exists; this slice refines admin fields and adds `ru` locale.
3. **`orch-product-detail--gallery-and-variants`** — detail page at `/products/[slug]`. `ProductCard` already links to this path.

The `apps/web` and `apps/cms` packages are live; new slices should build on top of the existing monorepo rather than re-scaffolding.
