# User Story: Browse and Filter the Product Catalogue

## Parent Scope Slice

[Category Grid](../scope-slices/product-catalog--category-grid.md)

## Status

`ready-for-spec`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a buyer, I can browse all published products in a flat grid and narrow them by category (dresses, bags, or scarfs), so that I can quickly find a piece I want to open.

---

## Acceptance Criteria

### AC-1 — Populated grid

- **Given** products are published in the CMS
- **When** I visit the catalogue page
- **Then** I see a grid of product cards, each showing the product image, title, and EUR price

### AC-2 — Category filter

- **Given** I am viewing the populated grid
- **When** I select a category (dresses, bags, or scarfs)
- **Then** only products in that category are shown, and the selected category is visually indicated

### AC-3 — Empty state

- **Given** no products are published, or the selected category has no products
- **When** I view the catalogue or a filtered category
- **Then** I see a calm message that there is nothing to show, with no broken layout

### AC-4 — Loading state

- **Given** the catalogue is being fetched
- **When** the page first loads
- **Then** placeholder cards appear until real products load

### AC-5 — Error state

- **Given** the catalogue cannot be loaded
- **When** I open the catalogue page
- **Then** I see a gentle message inviting me to retry, and navigation remains usable

### AC-6 — Navigation to product detail

- **Given** I can see a product card
- **When** I tap or click it
- **Then** I am taken to that product's detail page

---

## UX States Covered

- Populated grid
- Filtered
- Empty
- Loading
- Error

---

## Out of Scope

- Product detail content (slice: product-detail--gallery-and-variants)
- Free-text search and advanced filtering (deferred — not in PRD v0)
- Stock / availability badges (PRD v0 exclusion)
- Creating or editing products (slice: cms-products--product-management)

---

## Dependencies

- storefront-shell--global-chrome (grid renders within shared chrome — pending slice)
- cms-products--product-management (provides published products — pending slice)
- i18n--localized-storefront (titles in active locale — pending slice)

---

## Readiness for Spec

- [x] Story stated in user language without implementation details
- [x] Acceptance Criteria are observable behaviours (Given/When/Then)
- [x] Each AC maps to a single UX state or action from the parent Scope Slice
- [x] Out of Scope items listed
- [x] No blockers (NEED_HUMAN: false)

**Verdict:** READY FOR SPEC

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Derived from Scope Slice `product-catalog--category-grid` by orchestrator | — |
