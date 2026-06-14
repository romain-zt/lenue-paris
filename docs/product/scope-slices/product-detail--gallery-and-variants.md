# Scope Slice: Gallery and Variants

## Parent Feature Area

[Product Detail](../feature-areas/product-detail.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A buyer can see a product's photos, description, and EUR price, and (for dresses) pick a length and size, so they have everything they need to start an order.

---

## Exact Boundary

### Included Behavior

- A product detail page with an image gallery, localized title and description, and EUR price
- A length-variant selector (longer / shorter) for dresses
- A size picker for dresses using the fixed set XS, S, M, L, XL
- No length or size selectors for bags and scarfs
- A clear call to order that carries the selected variants into checkout

### Excluded Behavior

- The catalogue grid and category filtering (slice: product-catalog--category-grid)
- Saving the order and opening WhatsApp (slice: whatsapp-checkout--order-save-and-handoff)
- "Complete the look" pairing modules shown to buyers (PRD deferred — owner-only for v0)
- Stock / availability indicators (PRD v0 exclusion — no inventory tracking)
- Authoring product content (slice: cms-products--product-management)

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Dress detail | A dress is opened | Gallery, description, EUR price, length selector, and XS–XL size picker |
| Non-dress detail | A bag or scarf is opened | Gallery, description, EUR price; no length or size selectors |
| Loading | Product content still loading | Placeholders for gallery and copy until content appears |
| Error / not found | The product cannot be loaded | A gentle message with a path back to the catalogue |
| Selection required | A dress with no length/size chosen yet | The call to order indicates that a length and size must be selected first |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Product | Reads | Gallery, localized title/description, EUR price, length variant, size set |
| Media | Reads | Product photography in the gallery |

---

## Credit / Payment Impact

None — viewing the product and selecting variants consumes no credits; the EUR price is displayed only and settled later via WhatsApp.

---

## Sharing / Privacy Impact

None — the product detail page is public to every visitor and exposes no private or viewer-specific data.

---

## Feedback / Instrumentation Impact

None — this slice triggers no feedback prompt and produces no attributable buyer data. (Analytics is deferred from the v0 boundary.)

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| product-catalog--category-grid | Scope Slice | pending | The detail page is reached from a catalogue grid item |
| cms-products--product-management | Scope Slice | pending | Provides product content, variants, and pricing |
| i18n--localized-storefront | Scope Slice | pending | Title/description shown in the active locale |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

A buyer can open a product, see its gallery, description, and EUR price, select a length and size for dresses (and skip those for bags/scarfs), and proceed to order with the selected variants carried forward.

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
