# Scope Slice: v0 Admin Order List

## Parent Feature Area

[WhatsApp Checkout](../feature-areas/whatsapp-checkout.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

The boutique owner can see incoming orders in the CMS admin — what was ordered, in which variant, and at what price — so they can follow up and fulfill each one via WhatsApp.

---

## Exact Boundary

### Included Behavior

- The owner can view the list of orders saved at checkout in the CMS admin
- Each order shows the product, chosen length/size (for dresses), EUR price, and the buyer contact captured on the form
- The owner can open a single order to see its full detail

### Excluded Behavior

- Creating or editing orders by hand (orders originate from buyer checkout)
- Buyer-facing order status or tracking
- Order fulfillment, shipping, or payment workflows (handled manually in WhatsApp)
- Email or other outbound notifications
- Analytics, reporting, or exports
- Inventory adjustments tied to orders

---

## UX States

| State | When | What the owner sees / experiences |
|-------|------|-----------------------------------|
| Populated list | Orders exist | A list of saved orders with product, variants, price, and buyer contact |
| Empty list | No orders yet | A clear "no orders yet" state |
| Order detail | Owner opens one order | Full order detail: product, variants, price, buyer contact |
| Loading | Admin list still loading | Standard admin loading affordance |
| New order arrived | An order was saved since last view | The new order appears in the list on refresh |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Order | Read | List and detail view in the admin |
| Product | Read | Line-item reference shown on each order |

---

## Credit / Payment Impact

None — viewing orders involves no payment. Settlement is handled offline in WhatsApp.

---

## Sharing / Privacy Impact

This slice exposes buyer contact details inside the owner-only CMS admin. There is no public or anonymous surface; access is limited to the boutique owner operating the admin.

---

## Feedback / Instrumentation Impact

None — no owner feedback prompt and no attributable analytics event in v0 scope.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `whatsapp-checkout--v0-checkout-and-wa-handoff` | Scope Slice | pending | Orders must be created at checkout before they can be listed |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

The owner can open the CMS admin and see every order saved at checkout — with product, variants, price, and buyer contact — open any one for detail, and see a clear empty state before the first order arrives.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated (including error and empty states)
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Scaffolded from approved `/feature-area slice` proposal (`/feature-area scaffold-slices`) | — |
| 2026-06-14 | Product-level sections completed (`/feature-area refine-slice`) | — |
| 2026-06-14 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
