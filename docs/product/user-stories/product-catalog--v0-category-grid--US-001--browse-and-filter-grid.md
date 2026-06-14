# User Story: Browse and filter the launch catalogue

## Parent Scope Slice

[v0 Category Grid](../scope-slices/product-catalog--v0-category-grid.md)

## Status

`ready-for-spec`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a buyer, I want to browse the launch collection in an editorial grid and narrow it by category (dress, bag, scarf), so that I can find the kind of piece I want and open its detail page.

---

## Acceptance Criteria

### AC-1 — Populated grid

- **Given** the launch catalogue has published products
- **When** I open the catalogue
- **Then** I see a grid of cards, each showing a product image, localized name, and EUR price

### AC-2 — Category filter

- **Given** I am on the catalogue
- **When** I select a category (dress, bag, or scarf)
- **Then** the grid shows only products in that category

### AC-3 — Card navigation

- **Given** I see a product card in the grid
- **When** I tap or click the card
- **Then** I reach that product's detail page

### AC-4 — Empty category

- **Given** I have selected a category with no published products
- **When** the catalogue loads
- **Then** I see a clear message that no pieces are in this category and a way back to all products

### AC-5 — Localized names

- **Given** I switch the buyer locale
- **When** the catalogue renders
- **Then** product names appear in the active locale while EUR prices stay unchanged

---

## UX States Covered

- Populated grid
- Category filtered
- Empty category
- Empty catalogue
- Loading
- Localized

---

## Out of Scope

- "Complete the look" pairing modules on the listing
- Free-text search, faceted filters, or sort beyond category
- Add-to-cart, cart, or multi-item basket
- Wishlist or save-for-later
- Stock / inventory indicators
- Pagination beyond the small launch catalogue

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Product | Read | List and filter for display (name, price, category) |
| Media | Read | Thumbnail image per card |

---

## Credit / Payment Impact

None — the catalogue displays EUR prices but takes no payment. Settlement happens offline via WhatsApp in v0.

---

## Sharing / Privacy Impact

None — the catalogue is public and captures no buyer data.

---

## Feedback / Instrumentation Impact

None — no owner feedback prompt or attributable buyer event in v0.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `cms-products` | Feature Area | pending | Products must exist in CMS to list |
| `storefront-shell` | Feature Area | pending | Catalogue pages render inside the shared shell |
| `i18n-localization` | Feature Area | pending | Localized product names on cards |
| `product-detail` | Feature Area | pending | Card links target the product detail page |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

A buyer can open the catalogue, see the launch collection as a grid of cards with localized names and EUR prices, filter to a single category, tap a card to reach its detail page, and see a clear empty state when a category has no pieces.

---

## Readiness for Spec

- [x] Story in standard form ("As X, I do Y, so that Z")
- [x] 2-5 inline Acceptance Criteria in Given/When/Then form
- [x] UX states covered are a non-empty subset of the parent Scope Slice
- [x] Out of scope explicitly named
- [x] Data touched named as product objects (no implementation detail)
- [x] Credit / payment impact inherited from parent slice
- [x] Sharing / privacy impact inherited from parent slice
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR SPEC

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Scaffolded from Scope Slice by orchestrator step agent | — |
