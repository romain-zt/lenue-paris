# Feature Area: WhatsApp Checkout

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Operating Model
- `docs/prd/PRD.md` § Product Surface
- `docs/prd/PRD.md` § Integration Boundaries (WhatsApp)
- `docs/prd/PRD.md` § v0 Feature set (WhatsApp checkout, CMS order viewing)
- `docs/prd/PRD.md` § Flow Inventory (Place order)
- Related open questions: Q-001, Q-006, Q-010, Q-011 (answered)
- Related product decisions: none

---

## Product Intent

Turn intent into an order the owner can act on: buyer submits checkout, the order is **saved for admin immediately**, then WhatsApp opens with a pre-filled message (product, variants, EUR price). Payment and shipping stay in the WhatsApp conversation — not on the site.

---

## In Scope

- Checkout form from product detail (minimal buyer fields as needed for order record)
- Persist order to CMS **before or as** WhatsApp opens — order must not be lost if buyer abandons WA
- Pre-filled WhatsApp message to **+79117126262** including product, length/size (dresses), and price
- Owner views saved orders in CMS admin
- Offline payment settlement via WhatsApp (no payment gateway)
- Localized checkout labels (fr/en/ru)

## Out of Scope

- On-site payment processing
- Shipping zone selection or fee calculation on site (manual in WhatsApp per Q-011)
- Email order confirmations
- Cart / multi-line checkout
- Order status tracking for buyer on site
- Inventory reservation

---

## Business Objects Touched

| Object | Relationship |
|--------|-------------|
| Order | Create at checkout; read in admin |
| Product | Read — line item reference |

---

## User Journeys Touched

- Buyer: discover and order — step 4 (submit order → CMS + WhatsApp)
- Owner: manage catalogue and orders — steps 3–4 (view orders, fulfill via WhatsApp)

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| `product-detail` | pending | Variant selections passed from PDP |
| `i18n-localization` | pending | Localized form labels |
| `cms-products` | pending | Product/price source for order line |

---

## Risks

- Order must persist even if buyer never sends the WhatsApp message after tap
- Buyer contact fields on form not fully specified — keep minimal for v0 manual process

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| `v0-checkout-and-wa-handoff` | Form, CMS order save, WhatsApp deep-link with pre-filled message | exploratory |
| `v0-admin-order-list` | Owner views incoming orders in CMS admin | exploratory |

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

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Scaffolded from approved Feature Area Map (`/feature-area scaffold`) | — |
| 2026-06-14 | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |
