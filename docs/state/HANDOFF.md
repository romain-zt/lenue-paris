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

**Step:** `orch-whatsapp-checkout--v0-checkout-and-wa-handoff` — **in progress** (layer 1 complete).

- User story: `docs/product/user-stories/whatsapp-checkout--v0-checkout-and-wa-handoff--US-001--submit-order-and-handoff.md` (`ready-for-spec`)
- Spec: `docs/product/specs/whatsapp-checkout--v0-checkout-and-wa-handoff--US-001--submit-order-and-handoff.spec.md` (`ready-for-implementation`)
- Layer 1 shipped: CMS `orders` schema extended with `length`, `priceEur`, `locale` + unit tests
- Tracking PR #20 — **not ready** (layers 2–6 remain)

## Layer progress (v0 Checkout and WhatsApp Handoff)

| Layer | Status | Notes |
|-------|--------|-------|
| 1. data/schema | ✅ complete | CMS `orders.length`, `priceEur`, `locale`; `Orders.test.ts` |
| 2. contracts/types | ⏳ next | `@repo/checkout` package — order input/output, WA message types |
| 3. domain/business logic | ⏳ pending | Validation, `buildWhatsAppMessage`, handoff URL builder |
| 4. API/route handlers | ⏳ pending | `POST /api/orders` |
| 5. UI | ⏳ pending | `/[locale]/order/[slug]` checkout page |
| 6. tests + state finalization | ⏳ pending | Contract tests, component tests, step `complete` |

## Known issues / decisions in effect

- PD-001 and PD-006 files still absent from `docs/product-decisions/` (only PD-007, PD-008). User story + spec authored under orchestrator mandate.
- Order CTA for dresses appends `?length=&size=` query params; checkout reads them on the order page (layer 5).
- Payload `(payload)` app route group not yet generated — run `npx create-payload-app@latest --no-deps` from `apps/cms` first time.
- `.env` not created yet — copy `.env.example` and fill in real values.

## Next recommended step

Continue `orch-whatsapp-checkout--v0-checkout-and-wa-handoff` **layer 2**: scaffold `@repo/checkout` with order create types and WhatsApp message contracts traced to the spec.
