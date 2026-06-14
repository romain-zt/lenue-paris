# Project HANDOFF

> Living context for cloud agents. The PR reviewer and every orchestrator step agent
> read this file **first**. Keep it short, current, and honest. Update it as the last
> step of every run (what changed, what's next, what's blocked).

## What this project is

Lenue Paris (`lenue.paris`) is a luxury fashion boutique — dresses, bags, and foulards.
Customers browse the catalogue, pick an item, and place an order via a WhatsApp form that
also writes to the CMS. No real payment processing in v0. Aesthetic direction: minimal,
editorial, high-quality photography — inspired by Rouje, Loro Piana, The Row, and Dôen.

## Current architecture

- Monorepo: `apps/web` (Next.js storefront), `apps/cms` (Payload 3 CMS + admin), `packages/*` (pnpm + turbo).
- Database: Neon (Vercel-native serverless Postgres) in prod; local Postgres via docker-compose for dev.
- Media: AWS S3 in prod; MinIO (docker-compose) locally.
- i18n: `fr` primary, `en` secondary — both Payload localization and Next.js i18n routing.
- Deployment: Vercel (monorepo — `apps/web` + `apps/cms` in the same project, different build commands).
- CMS collections: `users`, `media`, `products`, `orders`.
- Checkout: web form → WhatsApp deep-link (pre-filled message) + POST to `/api/orders` (Payload).

## Active work

- PRD is converged (v0). Autonomous decomposition run complete on `orchestrator/decompose-1781421088660`.
- All **7 v0 Feature Areas** are `delivery-ready`; **12 Scope Slices** are `ready-for-user-stories`; the flow map is wired.
- Implementation phase: **on** (PD-007). Autonomous decomposition: **on** (PD-008).

## Decomposition state (2026-06-14)

**Advanced this run** (all checks via `.cursor/checkers/scope-readiness-checker.md`, genuine CLEAR):

- Feature Areas → `delivery-ready` (Part 8 DR-01–DR-05 + CC-01–CC-05 CLEAR):
  storefront-shell, product-catalog, product-detail, whatsapp-checkout, cms-products, editorial, i18n-localization.
- Scope Slices → `ready-for-user-stories` (Part 2 SS-01–SS-10 + CC-01–CC-05 CLEAR), 12 total:
  - storefront-shell: `v0-mobile-shell`, `v0-home-hero`
  - product-catalog: `v0-category-grid`
  - product-detail: `v0-pdp-gallery-and-copy`, `v0-pdp-variant-pickers`
  - whatsapp-checkout: `v0-checkout-and-wa-handoff`, `v0-admin-order-list`
  - cms-products: `v0-product-crud`, `v0-product-variants-and-pairings`
  - editorial: `v0-about-page`
  - i18n-localization: `v0-buyer-locale-routing`, `v0-cms-localized-fields`
- Flow map `docs/state/orchestration.prd-flow-map.json`: all 7 PRD Flow Inventory `v0=Yes` rows
  mapped to 10 slices. Validated end-to-end with `sync-prd-orchestration.ts --strict` (10 steps
  resolve cleanly; pipeline/status are regenerated post-merge by orchestration-automation.yml, so
  not committed here).

**Blocked:** none. No `NEED_HUMAN` was needed — all 12 open questions (Q-001–Q-012) are answered and
no FA/slice required missing product truth.

**Intentionally out of v0 (not decomposed):** the config Priority bands list `FA-search-filter` (P3),
`FA-wishlist` (P4), `FA-analytics` (P4). These are outside the v0 boundary — no v0 Flow Inventory row,
search/filter beyond category is deferred in `product-catalog`, and wishlist requires user accounts
(excluded). They were not scaffolded.

**Note for the User Story phase (next phase, not this run):** the two storefront-shell slices
(`v0-mobile-shell`, `v0-home-hero`) are foundational and are not tied to a Flow Inventory row, so they
are not auto-appended as pipeline steps — pull them in explicitly when sequencing implementation.
`docs/product-decisions/PD-001-post-slice-workflow.md` and `PD-006-per-fa-delivery-readiness-gate.md`
are referenced by the rules/checker but their files are not present in `docs/product-decisions/`
(only PD-007, PD-008). The `/user-story` workflow treats PD-001 as mandatory — author those PD files
before starting User Story / Spec / Task work.

## Known issues / decisions in effect

- Payload `(payload)` app route group not yet generated — run `npx create-payload-app@latest --no-deps` from `apps/cms` first time.
- `.env` not created yet — copy `.env.example` and fill in real values.

## Next recommended step

1. Merge this decomposition PR → `orchestration-automation.yml` regenerates the pipeline.
2. Author PD-001 and PD-006 files, then `/user-story` → `/spec` per `delivery-ready` Feature Area (P0 first).
3. Let the phase orchestrator run implementation within the v0 boundary.
