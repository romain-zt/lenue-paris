# User Story: Submit order and hand off to WhatsApp

## Parent Scope Slice

[v0 Checkout and WhatsApp Handoff](../scope-slices/whatsapp-checkout--v0-checkout-and-wa-handoff.md)

## Status

`ready-for-spec`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a buyer who chose a piece, I want to submit my contact details, have my order saved immediately, and continue on WhatsApp with a pre-filled message — so the boutique receives my order even if I never send the WhatsApp message.

---

## Acceptance Criteria

### AC-1 — Checkout summarizes the product

- **Given** I reach checkout from a product detail call-to-action
- **When** the form loads
- **Then** I see the selected product and, for dresses, my chosen length and size

### AC-2 — Order is saved before handoff

- **Given** I complete the required checkout fields
- **When** I submit the form
- **Then** my order is recorded for the owner before or as WhatsApp opens

### AC-3 — WhatsApp opens with order details

- **Given** my order was saved successfully
- **When** handoff runs
- **Then** WhatsApp opens to +79117126262 with a pre-filled message containing the product, dress variants when applicable, and the EUR price

### AC-4 — Confirmation after save

- **Given** my order was saved successfully
- **When** handoff completes or WhatsApp is unavailable
- **Then** I see confirmation that my order was recorded

### AC-5 — WhatsApp unavailable fallback

- **Given** my order was saved but the device cannot open WhatsApp
- **When** handoff fails
- **Then** I still see confirmation and the WhatsApp number or link to retry manually

### AC-6 — Validation blocks premature save

- **Given** I leave a required field empty or invalid
- **When** I try to submit
- **Then** I see inline guidance and no order is recorded yet

### AC-7 — Save failure blocks handoff

- **Given** the order could not be saved
- **When** I submit
- **Then** I see a clear retry message and WhatsApp does not open

### AC-8 — Localized checkout experience

- **Given** I switch the buyer locale
- **When** I view checkout or the pre-filled WhatsApp message
- **Then** form labels and the buyer-facing message appear in the active locale (fr, en, or ru)

---

## UX States Covered

- Form ready
- Submitting
- Saved + handoff
- WhatsApp unavailable
- Validation error
- Save failure
- Localized

---

## Out of Scope

- Owner CMS order list UI (admin-order-list slice)
- On-site payment or shipping zone selection
- Cart or multi-line checkout
- Buyer order status tracking after handoff
- Inventory reservation

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| `product-detail--v0-pdp-variant-pickers` | complete | Passes length/size via order URL |
| `cms-products` | pending | Product + price source |
| `i18n-localization` | pending | fr / en / ru labels and message |
| `storefront-shell` | pending | Checkout inside shared shell |

---

## Blockers

| Blocker | NEED_HUMAN |
|---------|------------|
| none | false |

---

## Readiness for Spec

- [x] Story maps to parent Slice acceptance outcome
- [x] ACs are Given/When/Then and product-readable
- [x] UX states reference parent Slice names
- [x] Out of scope matches parent exclusions
- [x] No implementation language in ACs
- [x] NEED_HUMAN false

**Verdict:** READY FOR SPEC

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Authored by orchestrator step agent | — |
