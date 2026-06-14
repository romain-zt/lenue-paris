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

**Step:** `orch-product-detail--v0-pdp-variant-pickers` — **in progress** (layer 4 complete).

- User story: `docs/product/user-stories/product-detail--v0-pdp-variant-pickers--US-001--select-dress-variants.md` (`ready-for-spec`)
- Spec: `docs/product/specs/product-detail--v0-pdp-variant-pickers--US-001--select-dress-variants.spec.md` (`ready-for-implementation`)
- Layer 1 (data/schema): CMS `products` — `lengthVariants` + `sizes` select fields (dress-only)
- Layer 2 (contracts/types): `@repo/product-detail` — `ProductLengthVariant`, `ProductSizeCode`, `ProductVariantPickers`, extended `ProductDetail` + `PayloadProductDetailDoc`
- Layer 3 (domain/business logic): `resolveVariantPickers`, `buildOrderHrefWithVariants`, `isVariantSelectionComplete`; wired into `toProductDetail`

## Layer progress (v0 PDP Variant Pickers)

| Layer | Status | Notes |
|-------|--------|-------|
| 1. data/schema | ✅ complete | CMS `products.lengthVariants` + `sizes` select fields; schema unit tests |
| 2. contracts/types | ✅ complete | `variants.ts` types + exports; `ProductDetail.variantPickers`; Payload doc fields |
| 3. domain/business logic | ✅ complete | `resolveVariantPickers`, `buildOrderHrefWithVariants`, `isVariantSelectionComplete`; `toProductDetail` resolves pickers |
| 4. API/route handlers | ✅ complete | `GET /api/products/[slug]` exposes `variantPickers` via `fetchProductDetail`; dress + bag contract tests |
| 5. UI | ⏳ next | Dress pickers + disabled CTA states on PDP |
| 6. tests + state finalization | pending | Contract + UI tests; mark step `complete` |

## Known issues / decisions in effect

- PD-001 and PD-006 files still absent from `docs/product-decisions/` (only PD-007, PD-008). User story + spec authored under orchestrator mandate.
- Order CTA for dresses will append `?length=&size=` query params once UI layer lands; checkout slice reads them.
- Payload `(payload)` app route group not yet generated — run `npx create-payload-app@latest --no-deps` from `apps/cms` first time.
- `.env` not created yet — copy `.env.example` and fill in real values.

## Next recommended step

Continue `orch-product-detail--v0-pdp-variant-pickers` at **layer 5 (UI)** — dress length + size pickers, disabled CTA until selection complete, `buildOrderHrefWithVariants` on order link.
