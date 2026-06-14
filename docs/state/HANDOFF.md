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

**Step:** `orch-product-detail--v0-pdp-gallery-and-copy` — **complete**.

- User story: `docs/product/user-stories/product-detail--v0-pdp-gallery-and-copy--US-001--view-gallery-and-copy.md` (`ready-for-spec`)
- Spec: `docs/product/specs/product-detail--v0-pdp-gallery-and-copy--US-001--view-gallery-and-copy.spec.md` (`ready-for-implementation`)
- Package: `@repo/product-detail` — types, gallery mapping, richText extraction, fetch helper + unit tests
- API: `GET /api/products/[slug]` in `apps/web` — wires `fetchProductDetail` to Payload REST via `CMS_URL`
- UI: `/[locale]/products/[slug]` — mobile-first gallery, localized copy, EUR price, order CTA
- Tests: contract + UI component tests; all monorepo checks green

## Layer progress (v0 PDP Gallery and Copy)

| Layer | Status | Notes |
|-------|--------|-------|
| 1. data/schema | ✅ complete | CMS `products` collection already has name, description, price, images, available |
| 2. contracts/types | ✅ complete | `packages/product-detail` — `ProductDetail`, `ProductGalleryImage`, query/response types |
| 3. domain/business logic | ✅ complete | `fetchProductDetail`, gallery + richText mapping, unavailable → not found |
| 4. API/route handlers | ✅ complete | `apps/web/src/app/api/products/[slug]/route.ts` + Payload slug adapter + contract tests |
| 5. UI | ✅ complete | PDP page + gallery browsing + not-found/error/loading states |
| 6. tests + state finalization | ✅ complete | Step marked `complete` |

## Known issues / decisions in effect

- PD-001 and PD-006 files still absent from `docs/product-decisions/` (only PD-007, PD-008). User story + spec authored under orchestrator mandate.
- Order CTA links to `/[locale]/order/[slug]` — route owned by `whatsapp-checkout` slice (may 404 until that step lands).
- Payload `(payload)` app route group not yet generated — run `npx create-payload-app@latest --no-deps` from `apps/cms` first time.
- `.env` not created yet — copy `.env.example` and fill in real values.

## Next recommended step

Pick the next orchestrator step from `docs/state/orchestration.prd-flow-map.json` — likely `orch-product-detail--v0-pdp-variant-pickers` or `orch-whatsapp-checkout--v0-checkout-and-wa-handoff`.
