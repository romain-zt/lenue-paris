# Scope Slice: v0 Checkout and WhatsApp Handoff

## Parent Feature Area

[WhatsApp Checkout](../feature-areas/whatsapp-checkout.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A buyer can submit an order from a product page, have it saved for the owner immediately, and then continue the conversation on WhatsApp with a pre-filled message — so no order is lost even if they never send the message.

---

## Exact Boundary

### Included Behavior

- A checkout form reached from the product detail call-to-action, with the minimal buyer fields needed to record an order
- The order is persisted for the owner **before or as** WhatsApp opens, so it survives even if the buyer abandons WhatsApp
- WhatsApp opens to **+79117126262** with a pre-filled message containing the product, the chosen length/size (for dresses), and the EUR price
- Localized checkout labels and the localized buyer-facing order message (fr / en / ru)
- A confirmation state acknowledging the order was recorded

### Excluded Behavior

- The owner's view of saved orders in the CMS (covered by `whatsapp-checkout--v0-admin-order-list`)
- On-site payment processing or a payment gateway
- Shipping zone selection or fee calculation on the site (handled manually in WhatsApp per Q-011)
- Email order confirmations
- Cart or multi-line checkout
- Buyer-facing order status tracking after handoff
- Inventory reservation

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Form ready | Buyer reaches checkout from a product | Minimal fields with the selected product and variants summarized |
| Submitting | Buyer submits the form | A brief in-progress state while the order is recorded |
| Saved + handoff | Order recorded successfully | Confirmation that the order is saved, then WhatsApp opens with the pre-filled message |
| WhatsApp unavailable | Device cannot open WhatsApp | The order is still saved; the buyer sees the WhatsApp number / link to retry manually |
| Validation error | A required field is missing or invalid | Inline guidance on what to fix; no order recorded yet |
| Save failure | The order could not be recorded | A clear retry message; the buyer is not handed off until the order is saved |
| Localized | Buyer switches locale | Form labels and the pre-filled message render in the active locale |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Order | Create | Saved at checkout with line item, chosen variants, EUR price, and buyer contact as captured |
| Product | Read | Line-item reference and price source |

---

## Credit / Payment Impact

None — no on-site payment. The order records the EUR price for offline settlement in the WhatsApp conversation; v0 has no payment gateway.

---

## Sharing / Privacy Impact

The checkout captures buyer contact details for the order record and forwards order details into a WhatsApp message. No public share link or anonymous-viewer surface is created. Buyer-provided contact data is held only for the owner to fulfill the order; collection is limited to the minimal fields needed for the manual process.

---

## Feedback / Instrumentation Impact

None — no owner feedback prompt is triggered. The created order itself is the durable record the owner acts on; no separate analytics event is in v0 scope.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `product-detail` | Feature Area | pending | Variant selections passed from the PDP into checkout |
| `cms-products` | Feature Area | pending | Product and price source for the order line |
| `i18n-localization` | Feature Area | pending | Localized form labels and order message |
| `storefront-shell` | Feature Area | pending | Checkout renders inside the shared shell |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

A buyer can submit a checkout form for a piece, the order is saved for the owner before WhatsApp opens, and WhatsApp launches with a pre-filled message carrying the product, variants, and EUR price — and if WhatsApp cannot open or the buyer abandons it, the saved order is still available to the owner.

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
