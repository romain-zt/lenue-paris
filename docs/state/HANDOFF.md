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
- i18n: `fr` primary, `en` secondary, `ru` tertiary — Payload localization and Next.js i18n routing.
- Deployment: Vercel (monorepo — `apps/web` + `apps/cms` in the same project, different build commands).
- CMS collections: `users`, `media`, `products`, `orders`.
- Checkout: web form → WhatsApp deep-link (pre-filled message) + POST to `/api/orders` (Payload).

## Completed steps (this session)

**Step:** `orch-cms-products--v0-product-variants-and-pairings` — **complete**.

- User story: `docs/product/user-stories/cms-products--v0-product-variants-and-pairings--US-001--dress-variants-and-product-pairings.md` (`ready-for-spec`)
- Spec: `docs/product/specs/cms-products--v0-product-variants-and-pairings--US-001--dress-variants-and-product-pairings.spec.md` (`ready-for-implementation`)
- Implementation: Added `relatedDress` relationship field to `apps/cms/src/collections/Products.ts` — optional field linking a bag/scarf to its paired dress, hidden on dress records
- Tests: Added 2 tests for `relatedDress` (condition logic for sac/foulard/robe/autre); all 15 CMS tests pass
- Typecheck: ✅ all packages clean

**Step:** `orch-cms-products--v0-product-crud` — **complete**.

- User story: `docs/product/user-stories/cms-products--v0-product-crud--US-001--manage-product-catalogue.md` (`ready-for-spec`)
- Spec: `docs/product/specs/cms-products--v0-product-crud--US-001--manage-product-catalogue.spec.md` (`ready-for-implementation`)
- Implementation: Added `minRows: 1` to the `images` array in `apps/cms/src/collections/Products.ts` — enforces at least one image before saving a product
- Tests: Added `Products.test.ts` coverage for `minRows: 1` (all 13 CMS tests pass)
- Typecheck: ✅ all packages clean

## Known issues / decisions in effect

- PD-001 and PD-006 files still absent from `docs/product-decisions/` (only PD-007, PD-008). User stories + specs authored under orchestrator mandate.
- Order CTA for dresses appends `?length=&size=` query params; checkout reads them on the order page.
- Payload `(payload)` app route group not yet generated — run `npx create-payload-app@latest --no-deps` from `apps/cms` first time.
- `.env` not created yet — copy `.env.example` and fill in real values.

## Next recommended steps

1. `orch-whatsapp-checkout--v0-admin-order-list` — order management in Payload admin
2. `orch-editorial--v0-about-page` — editorial about page
3. `orch-i18n-localization--v0-buyer-locale-routing` — buyer locale routing
