# User Story: Create, edit, and archive a product

## Parent Scope Slice

[v0 Product CRUD](../scope-slices/cms-products--v0-product-crud.md)

## Status

`ready-for-spec`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a boutique owner, I want to create, edit, and archive products — with localized copy, a EUR price, a category, and gallery images — in the CMS admin, so the catalogue stays current without developer help.

---

## Acceptance Criteria

### AC-1 — Owner creates a product

- **Given** I am authenticated in the CMS admin
- **When** I fill in the product name (at least in French), category, EUR price, and at least one gallery image, then save
- **Then** the product is created and appears in the product list

### AC-2 — Owner edits a product

- **Given** a product already exists
- **When** I open it in the admin, change any of its localized copy, price, category, or images, and save
- **Then** the changes are persisted and visible on the admin product list

### AC-3 — Owner archives a product

- **Given** a product exists and is currently published (available = true)
- **When** I uncheck the Available field and save
- **Then** the product is archived (available = false) and no longer visible to buyers on the storefront

### AC-4 — Required-field validation prevents saving without essentials

- **Given** I try to save a product without a name, EUR price, category, or without any gallery image
- **When** the CMS validates the form
- **Then** I see inline guidance on the missing fields and the product is not saved

### AC-5 — Localized copy entry for fr, en, and ru

- **Given** I am editing a product in the CMS admin
- **When** I switch the locale (fr / en / ru) in the admin panel
- **Then** I can enter a distinct name and description for each locale; the slug is not localized

---

## UX States Covered

- Create
- Edit
- Archived
- Validation error
- Save success

---

## Out of Scope

- Dress length variants and related-product pairings (`cms-products--v0-product-variants-and-pairings`)
- Order management
- Inventory / stock tracking
- Bulk import
- Promotions or discounts

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| `i18n-localization` | pending | fr / en / ru locale support in Payload admin |
| PRD Configuration Matrix | ready | Category set and EUR currency confirmed |

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
