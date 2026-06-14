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

**Step:** `orch-product-catalog--v0-category-grid` — API/route handlers layer complete; next is UI.

- User story: `docs/product/user-stories/product-catalog--v0-category-grid--US-001--browse-and-filter-grid.md` (`ready-for-spec`)
- Spec: `docs/product/specs/product-catalog--v0-category-grid--US-001--browse-and-filter-grid.spec.md` (`ready-for-implementation`)
- Package: `@repo/catalog` — types, category mapping, `ProductCard`, catalogue fetch helper + unit tests
- API: `GET /api/catalog` in `apps/web` — wires `fetchCatalogList` to Payload REST via `CMS_URL`

## Layer progress (v0 Category Grid)

| Layer | Status | Notes |
|-------|--------|-------|
| 1. data/schema | ✅ complete | CMS `products` collection already has category, price, localized name, images |
| 2. contracts/types | ✅ complete | `packages/catalog` — `ProductCard`, `CatalogListQuery/Response`, filter↔CMS mapping |
| 3. domain/business logic | ✅ complete | `fetchCatalogList`, `buildPayloadProductsWhere`, locale/query normalization |
| 4. API/route handlers | ✅ complete | `apps/web/src/app/api/catalog/route.ts` + Payload REST adapter + contract tests |
| 5. UI | ⏳ next | `/[locale]/catalogue` grid + filter chips + empty states |
| 6. tests + state finalization | pending | Integration tests + step `complete` |

## Known issues / decisions in effect

- PD-001 and PD-006 files still absent from `docs/product-decisions/` (only PD-007, PD-008). User story + spec were authored under orchestrator mandate for this step.
- Payload `(payload)` app route group not yet generated — run `npx create-payload-app@latest --no-deps` from `apps/cms` first time. Web API fetches via `CMS_URL/api/products` until local Payload routes exist.
- `.env` not created yet — copy `.env.example` and fill in real values.

## Next recommended step

1. Build catalogue UI page at `/[locale]/catalogue` with mobile-first grid + filter chips (layer 5).
2. Run full checks; set `orchestration.steps["orch-product-catalog--v0-category-grid"] = "complete"` and `gh pr ready 11`.
