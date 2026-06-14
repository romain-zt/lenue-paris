# Scope Slice: Order Save and Handoff

## Parent Feature Area

[WhatsApp Checkout](../feature-areas/whatsapp-checkout.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A buyer can place an order in one step: it is saved for the owner, then WhatsApp opens with a ready-to-send message summarizing the piece, variants, and price.

---

## Exact Boundary

### Included Behavior

- A checkout form that captures the chosen product, selected length/size, and buyer contact
- Saving the order (product, variants, EUR price, buyer contact as captured) before the handoff
- Opening WhatsApp to **+79117126262** with a pre-filled message summarizing the order
- The order persisting even if the buyer never sends the WhatsApp message after the handoff
- Mobile-first checkout form

### Excluded Behavior

- Real payment capture or processing (PRD v0 exclusion — settlement is offline via WhatsApp)
- On-site shipping zone selection or fee calculation (PRD v0 exclusion — handled in WhatsApp)
- Persistent cart or multi-item basket (PRD v0 exclusion)
- Email or other notifications (PRD v0 exclusion)
- Owner-side viewing of the saved order (slice: cms-products--order-viewing)
- User accounts or saved buyer profiles (PRD v0 exclusion)

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Ready to submit | A piece (and variants for dresses) is selected | A checkout form pre-filled with the chosen product and variants |
| Submitting | The buyer confirms the order | A brief in-progress indication while the order is saved |
| Handoff | Order saved successfully | WhatsApp opens with a pre-filled order message; a confirmation is shown on-site |
| Validation needed | A required field (e.g. contact, or dress length/size) is missing | The form indicates what must be completed before submitting |
| Save error | The order could not be saved | A gentle message inviting the buyer to retry; no silent loss of the attempt |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Order | Creates | A new order record (product, variants, EUR price, buyer contact) at checkout |
| Product | Reads | The ordered piece, its variants, and EUR price |

---

## Credit / Payment Impact

No credits are involved. Payment is not processed on-site — the listed EUR price is carried into the saved order and the WhatsApp message, and settlement happens offline in the WhatsApp conversation (PRD v0).

---

## Sharing / Privacy Impact

The buyer's contact details, as captured on the form, are stored on the order for the owner to fulfill. No public or anonymous-viewer surface exposes the order; it is visible to the owner only.

---

## Feedback / Instrumentation Impact

None — this slice triggers no feedback prompt and produces no attributable buyer analytics. (Analytics is deferred from the v0 boundary.)

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| product-detail--gallery-and-variants | Scope Slice | pending | Checkout is initiated from the product detail page with selected variants |
| cms-products--order-viewing | Scope Slice | pending | Saved orders are what the owner later views |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

A buyer can submit an order from a product, the order is reliably saved with its product, variants, price, and contact, and WhatsApp opens with a matching pre-filled message — and the saved order survives even if the buyer never sends that message.

---

## Readiness for User Stories

- [ ] User value stated without implementation language
- [ ] Exact boundary defined (included + excluded)
- [ ] UX states enumerated (including error and empty states)
- [ ] Business objects named
- [ ] Credit / payment impact assessed
- [ ] Sharing / privacy surface assessed
- [ ] Feedback / instrumentation impact assessed
- [ ] All dependencies named and their status known
- [ ] All blockers resolved or NEED_HUMAN=true explicitly set
- [ ] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** NOT READY

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Scaffolded from approved slice proposal (`/feature-area scaffold-slices`) | — |
| 2026-06-14 | Product-level sections completed (`/feature-area refine-slice`) | — |
