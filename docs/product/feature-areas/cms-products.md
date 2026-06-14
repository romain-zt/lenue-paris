# Feature Area: CMS Products

## Status

`delivery-ready`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` §v0 Feature set (CMS product management row; CMS order viewing row)
- `docs/prd/PRD.md` §Operating Model (steps 1, 3)
- `docs/prd/PRD.md` §Core User Journeys (Owner: manage catalogue and orders)
- `docs/prd/PRD.md` §Business Objects (Product, Order, Media)
- Related open questions: Q-004 (catalogue), Q-005 (sizes), Q-006 (orders in CMS), Q-012 (pairings in data model) — all answered
- Related product decisions: none

---

## Product Intent

The boutique owner can run the catalogue and see incoming orders on her own — adding, editing,
and archiving products with localized copy, prices, images, and length variants, and reviewing
the orders buyers place — without needing a developer.

---

## In Scope

- Owner creating, editing, and archiving products in the admin
- Per-product localized title and description (fr / en / ru), EUR price, and images
- Dress length variants (longer / shorter) and the fixed size set on products that need them
- Recording optional product pairings (related dress ↔ bag/scarf) as a stored relationship, not shown to buyers in v0
- Owner viewing the orders saved at checkout (product, variants, price, buyer contact as captured)

## Out of Scope

- The buyer-facing catalogue grid and product pages (Feature Areas: Product Catalog, Product Detail)
- Capturing or placing orders (Feature Area: WhatsApp Checkout)
- Surfacing pairings to buyers as "complete the look" (PRD deferred — owner-only for v0)
- Inventory / stock tracking (PRD v0 exclusion)
- Editing or replying to orders inside the admin beyond viewing (fulfillment happens in WhatsApp)
- Email notifications on new orders (PRD v0 exclusion)

---

## Business Objects Touched

| Object | Relationship |
|--------|-------------|
| Product | Creates / Reads / Updates / Archives — full owner management including variants and pairings |
| Media | Creates / Reads — product imagery uploaded and attached |
| Order | Reads — owner views orders saved at checkout |

---

## User Journeys Touched

- Owner: manage catalogue and orders — steps 2–3 (Create/edit/archive products; view incoming orders)

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| none | ready | Foundational — the owner-facing source of truth for catalogue and orders |

---

## Risks

- The owner is non-technical; product and order management must be understandable without training
- Localized copy across three locales (fr / en / ru) increases the chance of incomplete translations per product
- Pairings are recorded but not shown to buyers in v0 — the owner must understand they are owner-only for now

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| cms-products--product-management | Owner creates, edits, and archives localized products with variants and pairings | exploratory |
| cms-products--order-viewing | Owner views the orders saved at checkout | exploratory |

---

## Readiness Verdict

- [x] PRD source sections read
- [x] Product intent stated without technical language
- [x] Business objects enumerated
- [x] User journeys identified
- [x] In-scope / out-of-scope explicitly separated
- [x] No unresolved PRD open questions affecting this area
- [x] Deferred behaviors explicitly named
- [x] Candidate Scope Slices are individually small enough

**Verdict:** READY FOR SCOPE SLICES

### Delivery Readiness

- [x] DR-01 — Status was `validated` before this transition
- [x] DR-02 — No direct dependency Feature Areas declared (trivially satisfied)
- [x] DR-03 — No Product Decision governs this FA's contract; the PRD grounds all behavior
- [x] DR-04 — No `NEED_HUMAN=true` on this FA or any direct dependency
- [x] DR-05 — Child slices `cms-products--product-management` and `cms-products--order-viewing` are `ready-for-user-stories`

**Verdict:** READY FOR VERTICAL DELIVERY

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Scaffolded from approved Feature Area Map (`/feature-area scaffold`) | — |
| 2026-06-14 | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |
| 2026-06-14 | Promoted to delivery-ready after CLEAR DR-01–DR-05 (`/feature-area clear-for-vertical`) | — |
