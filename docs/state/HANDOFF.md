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

## Active work

**Step:** `orch-whatsapp-checkout--v0-checkout-and-wa-handoff` — **complete** (all 6 layers shipped).

- User story: `docs/product/user-stories/whatsapp-checkout--v0-checkout-and-wa-handoff--US-001--submit-order-and-handoff.md`
- Spec: `docs/product/specs/whatsapp-checkout--v0-checkout-and-wa-handoff--US-001--submit-order-and-handoff.spec.md`
- All layers complete — full `pnpm typecheck` + `pnpm test` pass (32/32 tests, 5/5 packages)
- Tracking PR #27 marked ready

## Layer progress (v0 Checkout and WhatsApp Handoff)

| Layer | Status | Notes |
|-------|--------|-------|
| 1. data/schema | ✅ complete | CMS `orders.length`, `priceEur`, `locale`; `Orders.test.ts` |
| 2. contracts/types | ✅ complete | `@repo/checkout` — API + WA message types, field keys, contract tests |
| 3. domain/business logic | ✅ complete | `validateOrderInput`, `buildWhatsAppMessage`, `buildWhatsAppHandoffUrl`, `checkout-copy` |
| 4. API/route handlers | ✅ complete | `POST /api/orders` + contract tests |
| 5. UI | ✅ complete | `/[locale]/order/[slug]` checkout page + component tests |
| 6. tests + state finalization | ✅ complete | Full check pass, step `complete`, PR #27 ready |

## Known issues / decisions in effect

- PD-001 and PD-006 files still absent from `docs/product-decisions/` (only PD-007, PD-008). User story + spec authored under orchestrator mandate.
- Order CTA for dresses appends `?length=&size=` query params; checkout reads them on the order page (layer 5).
- Payload `(payload)` app route group not yet generated — run `npx create-payload-app@latest --no-deps` from `apps/cms` first time.
- `.env` not created yet — copy `.env.example` and fill in real values.

## Next recommended step

Step `orch-whatsapp-checkout--v0-checkout-and-wa-handoff` is **complete**. Next available steps per `status.json`: `orch-cms-products--v0-product-crud` or `orch-whatsapp-checkout--v0-admin-order-list`.
