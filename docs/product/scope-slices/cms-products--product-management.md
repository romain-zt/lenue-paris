# Scope Slice: Product Management

## Parent Feature Area

[CMS Products](../feature-areas/cms-products.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

The owner can add, edit, and archive products — with localized copy, prices, images, and dress variants — entirely on her own, without a developer.

---

## Exact Boundary

### Included Behavior

- Creating, editing, and archiving products in the admin
- Per-product localized title and description in fr, en, and ru
- Setting the EUR price and uploading product images
- Setting dress length variants (longer / shorter) and the fixed size set where applicable
- Recording optional product pairings (related dress ↔ bag/scarf) as an owner-only relationship

### Excluded Behavior

- The buyer-facing catalogue grid and product pages (slices: product-catalog--category-grid, product-detail--gallery-and-variants)
- Capturing or placing orders (slice: whatsapp-checkout--order-save-and-handoff)
- Viewing orders (slice: cms-products--order-viewing)
- Surfacing pairings to buyers as "complete the look" (PRD deferred — owner-only for v0)
- Inventory / stock tracking (PRD v0 exclusion)

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Empty catalogue | No products created yet | An admin view inviting the owner to create the first product |
| Editing | Creating or editing a product | Fields for localized copy, EUR price, images, and dress variants |
| Saved | A product is saved | Confirmation that the product is published and will appear on the storefront |
| Validation needed | A required field (e.g. price, fr title) is missing | The admin indicates what must be completed before saving |
| Archived | A product is archived | The product no longer appears on the storefront but remains in the admin |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Product | Creates / Reads / Updates / Archives | Localized copy, EUR price, variants, pairings |
| Media | Creates / Reads | Product imagery uploaded and attached |

---

## Credit / Payment Impact

None — product management consumes no credits and processes no payment.

---

## Sharing / Privacy Impact

Publishing a product makes its localized copy, price, and images publicly visible on the storefront. Archiving removes it from the public storefront. No buyer or order data is exposed by this slice.

---

## Feedback / Instrumentation Impact

None — this slice triggers no feedback prompt and produces no attributable analytics. (Analytics is deferred from the v0 boundary.)

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| i18n--localized-storefront | Scope Slice | pending | Defines the fr/en/ru locales product copy is authored against |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

The owner can create a product with localized copy, an EUR price, images, and dress variants, see it published to the storefront, edit it, and archive it to remove it — all without developer help.

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
| 2026-06-14 | Scaffolded from approved slice proposal (`/feature-area scaffold-slices`) | — |
| 2026-06-14 | Product-level sections completed (`/feature-area refine-slice`) | — |
| 2026-06-14 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
