# Scope Slice: Order Viewing

## Parent Feature Area

[CMS Products](../feature-areas/cms-products.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

The owner can see the orders buyers place at checkout — the piece, variants, price, and buyer contact — so she can fulfill them in WhatsApp.

---

## Exact Boundary

### Included Behavior

- Viewing a list of orders saved at checkout
- Viewing a single order's details: product, selected length/size, EUR price, and buyer contact as captured
- Orders appearing for the owner whether or not the buyer sent the WhatsApp message

### Excluded Behavior

- Capturing or creating orders (slice: whatsapp-checkout--order-save-and-handoff)
- Editing, replying to, or fulfilling orders inside the admin (fulfillment happens in WhatsApp)
- Payment status or settlement tracking (PRD v0 exclusion — settlement is offline)
- Shipping/fulfillment status fields (PRD v0 exclusion — handled in WhatsApp)
- Email notifications on new orders (PRD v0 exclusion)
- Product management (slice: cms-products--product-management)

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Empty | No orders placed yet | An admin view stating there are no orders yet |
| Order list | One or more orders exist | A list of orders with enough summary to identify each |
| Order detail | An order is opened | Product, selected variants, EUR price, and buyer contact as captured |
| Loading | Orders still loading | A brief in-progress indication until orders appear |
| Error | Orders cannot be loaded | A gentle message inviting the owner to retry |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Order | Reads | Product, variants, EUR price, buyer contact captured at checkout |
| Product | Reads | The ordered piece referenced by the order |

---

## Credit / Payment Impact

None directly — viewing orders consumes no credits. Orders carry the listed EUR price for reference, but no payment is processed or settled in this slice (settlement is offline via WhatsApp).

---

## Sharing / Privacy Impact

Orders contain buyer contact details and are visible to the owner only — never on any public or anonymous-viewer surface. This slice does not change what buyers or visitors can see.

---

## Feedback / Instrumentation Impact

None — this slice triggers no feedback prompt and produces no attributable analytics. (Analytics is deferred from the v0 boundary.)

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| whatsapp-checkout--order-save-and-handoff | Scope Slice | pending | Produces the orders this slice displays |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

The owner can open the admin and see every order saved at checkout, open any one to read its product, variants, price, and buyer contact, and rely on the order being present even when the buyer never sent the WhatsApp message.

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
