# Scope Slice: v0 Product CRUD

## Parent Feature Area

[CMS Products](../feature-areas/cms-products.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

The boutique owner can add, edit, and archive products — with localized copy, EUR price, and images — without developer help, so the catalogue stays current.

---

## Exact Boundary

### Included Behavior

- Owner creates a product in one of the categories (dress, bag, scarf)
- Owner edits an existing product's localized title and description (fr / en / ru), EUR price, and category
- Owner uploads and manages a product's gallery images
- Owner archives / unpublishes a product so it no longer appears on the storefront
- Required-field guidance so a product cannot be published without the essentials (name, price, category, at least one image)

### Excluded Behavior

- Dress length variants and related-product pairings (covered by `cms-products--v0-product-variants-and-pairings`)
- Order management (covered by `whatsapp-checkout--v0-admin-order-list`)
- Inventory / stock tracking
- Bulk import or migration tooling
- Promotions, discounts, or pricing rules
- Multi-vendor catalogue ownership

---

## UX States

| State | When | What the owner sees / experiences |
|-------|------|-----------------------------------|
| Empty catalogue | No products created yet | A clear starting state inviting the owner to add the first product |
| Create | Owner adds a new product | A form for category, localized title/description, EUR price, and images |
| Edit | Owner opens an existing product | The product's current values, editable and re-saveable |
| Validation error | A required field is missing | Inline guidance on what must be filled before publishing |
| Archived | Owner archives a product | The product is marked unpublished and drops off the storefront |
| Save success | Owner saves a valid product | Confirmation that changes are stored |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Product | Create, read, update, archive | Core catalogue entity with localized fields, price, category |
| Media | Create, read | Product gallery images |

---

## Credit / Payment Impact

None — catalogue management involves no payment. The EUR price is content the owner sets, not a charge.

---

## Sharing / Privacy Impact

None — product management happens in the owner-only admin. Published products become public, but this slice handles no buyer data or share surface.

---

## Feedback / Instrumentation Impact

None — no owner feedback prompt or attributable analytics event in v0 scope.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `i18n-localization` | Feature Area | pending | Localized field entry (fr / en / ru) in the admin |
| PRD Configuration Matrix | PRD reference | ready | Launch catalogue structure and EUR currency defined in PRD |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

The owner can create a product with localized copy, an EUR price, a category, and images; edit or archive it later; and is prevented from publishing one that is missing its essentials — all without developer help.

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
