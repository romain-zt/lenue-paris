# User Story: Manage product catalogue

## Parent Scope Slice

[v0 Product CRUD](../scope-slices/cms-products--v0-product-crud.md)

## Status

`ready-for-spec`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As the boutique owner, I want to create, edit, and archive products with localized copy, an EUR price, a category, and at least one gallery image — so the catalogue stays current without developer help.

---

## Acceptance Criteria

### AC-1 — Create product with required fields

- **Given** I open the CMS admin
- **When** I fill in a product name (localized), category, EUR price, and at least one image, then save
- **Then** the product is created and visible in the product list

### AC-2 — Edit existing product

- **Given** an existing product in the CMS
- **When** I update its localized title, description, price, category, or images and save
- **Then** the changes are persisted and reflected in the product list

### AC-3 — Archive product

- **Given** a published product in the CMS
- **When** I uncheck the "available" flag and save
- **Then** the product is archived and no longer visible on the storefront

### AC-4 — Validation prevents publishing without essentials

- **Given** I try to save a product missing name, price, category, or any image
- **When** I submit the form
- **Then** the CMS displays inline guidance identifying the missing required field(s) and does not save

### AC-5 — Localized copy per locale

- **Given** I edit a product in the CMS
- **When** I switch between fr / en / ru locale tabs
- **Then** I can enter distinct title and description per locale without affecting the other locales

---

## UX States Covered

- Create (owner adds a new product)
- Edit (owner opens an existing product)
- Validation error (a required field is missing)
- Archived (owner archives a product)
- Save success (owner saves a valid product)

---

## Out of Scope

- Dress length variants and related-product pairings (covered by `cms-products--v0-product-variants-and-pairings`)
- Empty catalogue starting state (Payload admin provides it automatically)
- Order management
- Inventory / stock tracking
- Bulk import
- Promotions or pricing rules

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Product | Create, read, update, archive | Core catalogue entity — localized name/description, EUR price, category, gallery images, available flag |
| Media | Create, read | Product gallery images |

---

## Credit / Payment Impact

None — catalogue management involves no payment. The EUR price is content the owner sets, not a charge.

---

## Sharing / Privacy Impact

None — product management happens in the owner-only admin. Published products become public, but this story handles no buyer data or share surface.

---

## Feedback / Instrumentation Impact

None — no owner feedback prompt or attributable analytics event in v0 scope.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `i18n-localization` | Feature Area | pending | Localized field entry (fr / en / ru) in the admin; Payload localization already wired in the Products collection |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

The owner can create a product with localized copy, an EUR price, a category, and at least one image; edit or archive it later; and is prevented from saving a product that is missing its essentials — all without developer help.

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
| 2026-06-14 | Scaffolded from Scope Slice `cms-products--v0-product-crud` | orchestrator |
