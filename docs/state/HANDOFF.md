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

### What was implemented (layer 1 — data/schema + layer 6 finalization)

- User story authored: `docs/product/user-stories/cms-products--v0-product-variants-and-pairings--US-001--set-dress-variants-and-pairings.md` (`ready-for-spec`)
- Spec authored: `docs/product/specs/cms-products--v0-product-variants-and-pairings--US-001--set-dress-variants-and-pairings.spec.md` (`ready-for-implementation`)
- `apps/cms/src/collections/Products.ts` — added `relatedDress` relationship field: self-referential, optional, shown only for non-dress categories (bags/scarves). `lengthVariants` and `sizes` were already present.
- `apps/cms/src/collections/Products.test.ts` — added 6 tests for `relatedDress` (relationship type, optionality, condition for robe/sac/foulard).
- `pnpm --filter cms test` → 19/19 pass. `pnpm --filter cms typecheck` → clean.

### Layer progress (v0 Product Variants and Pairings)

| Layer | Status | Notes |
|-------|--------|-------|
| 1. data/schema | ✅ complete | `relatedDress` relationship field added; `lengthVariants` + `sizes` already present |
| 2. contracts/types | ✅ n/a | Payload auto-generates REST + types |
| 3. domain/business logic | ✅ n/a | Validation handled by Payload field constraints |
| 4. API/route handlers | ✅ n/a | Payload admin REST auto-generated |
| 5. UI | ✅ n/a | Payload admin panel auto-generated from collection config |
| 6. tests + state finalization | ✅ complete | Unit tests pass; status.json → complete |

## Previous completed steps

- `orch-cms-products--v0-product-crud` — complete (layers 1–6 shipped, PR #36).
- `orch-whatsapp-checkout--v0-checkout-and-wa-handoff` — complete (layers 1–6 shipped, PR #24).

## Known issues / decisions in effect

- PD-001 and PD-006 files still absent from `docs/product-decisions/` (only PD-007, PD-008). User stories + specs authored under orchestrator mandate.
- Order CTA for dresses appends `?length=&size=` query params; checkout reads them on the order page.
- Payload `(payload)` app route group not yet generated — run `npx create-payload-app@latest --no-deps` from `apps/cms` first time.
- `.env` not created yet — copy `.env.example` and fill in real values.

## Next recommended steps

1. `orch-whatsapp-checkout--v0-admin-order-list` — order management in Payload admin
2. `orch-editorial--v0-about-page` — editorial about page
3. `orch-i18n-localization--v0-buyer-locale-routing` — buyer locale routing
