# User Story: View product gallery and copy

## Parent Scope Slice

[v0 PDP Gallery and Copy](../scope-slices/product-detail--v0-pdp-gallery-and-copy.md)

## Status

`ready-for-spec`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a buyer, I want to open a product page with its photos, localized description, and EUR price, so that I can appreciate the piece before deciding to order.

---

## Acceptance Criteria

### AC-1 — Product detail content

- **Given** a published product exists
- **When** I open its detail page
- **Then** I see its name, description, EUR price, and a gallery of its images

### AC-2 — Gallery browsing

- **Given** a product has multiple images
- **When** I browse the gallery
- **Then** I can view each photo in sequence

### AC-3 — Order call-to-action

- **Given** I am on a product detail page
- **When** the page has loaded
- **Then** I see a clear primary action that leads toward placing an order

### AC-4 — Unavailable product

- **Given** a product slug does not resolve or the product is no longer available
- **When** I open that detail page
- **Then** I see a clear message that the piece is no longer available and a way back to the catalogue

### AC-5 — Localized copy

- **Given** I switch the buyer locale
- **When** the product detail page renders
- **Then** the title and description appear in the active locale while the EUR price stays unchanged

---

## UX States Covered

- Default
- Gallery browsing
- Loading
- Missing media
- Not found
- Localized

---

## Out of Scope

- Dress length and size selection
- Checkout form and WhatsApp handoff
- Related-product modules
- Reviews, ratings, or social proof
- Stock / inventory display
- On-page payment

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Product | Read | Name, description, price, slug |
| Media | Read | Gallery images |

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `product-catalog` | Feature Area | complete | Entry from catalogue cards |
| `cms-products` | Feature Area | pending | Product copy and media from CMS |
| `storefront-shell` | Feature Area | pending | Page renders inside shared shell |
| `i18n-localization` | Feature Area | pending | Locale routing and localized fields |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Readiness for Spec

- [x] Story traces to parent Scope Slice acceptance outcome
- [x] 2–5 ACs in Given/When/Then form without implementation language
- [x] UX States Covered references parent slice state names
- [x] Out of Scope matches parent exclusions
- [x] Data Touched matches parent slice
- [x] Dependencies named with status
- [x] No NEED_HUMAN blockers

**Verdict:** READY FOR SPEC

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Authored by orchestrator step agent | — |
