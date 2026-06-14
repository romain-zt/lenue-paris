# Feature Area: WhatsApp Checkout

## Status

`delivery-ready`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` §v0 Feature set (WhatsApp checkout row)
- `docs/prd/PRD.md` §Operating Model (steps 3–4)
- `docs/prd/PRD.md` §Core User Journeys (Buyer: discover and order, steps 4–5)
- `docs/prd/PRD.md` §Business Objects (Order)
- `docs/prd/PRD.md` §Configuration Matrix (WhatsApp orders number)
- Related open questions: Q-001 (WhatsApp number), Q-006 (order saved for admin), Q-010 (price in message), Q-011 (shipping offline) — all answered
- Related product decisions: none

---

## Product Intent

A buyer who has chosen a piece can place an order in one step: the order is saved so the owner
always has a record, and WhatsApp opens with a ready-to-send message summarizing the product,
variants, and price — turning the purchase into a personal, direct conversation.

---

## In Scope

- A checkout action on the product detail page that captures the chosen product and variants
- Saving the order (product, selected length/size, EUR price, buyer contact as captured on the form) before the WhatsApp handoff
- Opening WhatsApp to **+79117126262** with a pre-filled message summarizing the order
- Persisting the order even if the buyer does not actually send the WhatsApp message after the handoff
- Listed EUR price carried into the order record and the WhatsApp message
- Mobile-first checkout form

## Out of Scope

- Real payment capture or processing (PRD v0 exclusion — settlement is offline via WhatsApp)
- On-site shipping zone selection or fee calculation (PRD v0 exclusion — handled manually in WhatsApp)
- Persistent cart or multi-item basket (PRD v0 exclusion — cart not persisted beyond session)
- Email or other notifications (PRD v0 exclusion)
- Owner-side viewing of the saved order (Feature Area: CMS Products — order viewing)
- User accounts / saved buyer profiles (PRD v0 exclusion)

---

## Business Objects Touched

| Object | Relationship |
|--------|-------------|
| Order | Creates — a new order record at checkout, before the WhatsApp handoff |
| Product | Reads — the ordered piece, its variants, and EUR price |

---

## User Journeys Touched

- Buyer: discover and order — steps 4–5 (Submit order → order saved → WhatsApp deep-link → continue in WhatsApp)

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Product Detail | pending | Checkout is initiated from the product detail page with selected variants |
| CMS Products | pending | Orders are persisted as records the owner can view |

---

## Risks

- The order must persist reliably even if the buyer abandons the WhatsApp step (explicit PRD assumption)
- The WhatsApp message must be readable and complete so the owner can fulfill without extra back-and-forth
- No payment gateway means trust rests on the message clarity and the WhatsApp conversation

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| whatsapp-checkout--order-save-and-handoff | Save the order, then open a pre-filled WhatsApp message | exploratory |

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
- [x] DR-02 — Dependency FAs have files: product-detail, cms-products
- [x] DR-03 — No Product Decision governs this FA's contract; the PRD grounds all behavior (payment posture: offline WhatsApp settlement, stated in the PRD)
- [x] DR-04 — No `NEED_HUMAN=true` on this FA or any direct dependency
- [x] DR-05 — Child slice `whatsapp-checkout--order-save-and-handoff` is `ready-for-user-stories`

**Verdict:** READY FOR VERTICAL DELIVERY

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Scaffolded from approved Feature Area Map (`/feature-area scaffold`) | — |
| 2026-06-14 | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |
| 2026-06-14 | Promoted to delivery-ready after CLEAR DR-01–DR-05 (`/feature-area clear-for-vertical`) | — |
