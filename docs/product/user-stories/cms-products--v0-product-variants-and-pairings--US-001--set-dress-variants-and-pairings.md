# User Story: Set dress variants and pairings in admin

## Parent Scope Slice

[v0 Product Variants and Pairings](../scope-slices/cms-products--v0-product-variants-and-pairings.md)

## Status

`ready-for-spec`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As the boutique owner, I want to set length variants and a size set on a dress product, and link a bag or scarf to its related dress — so that dress options are correctly configured and pairing relationships are stored in the data model, ready for future use.

---

## Acceptance Criteria

### AC-1 — Dress variants visible only for dresses

- **Given** I open a product with category `robe` in the CMS
- **When** I view the product edit form
- **Then** I see controls to select length variants (longer / shorter) and to confirm or adjust the size set (XS–XL default)

### AC-2 — Non-dress products show pairing field only

- **Given** I open a product with category `sac` or `foulard`
- **When** I view the product edit form
- **Then** I see an optional field to link a related dress, and no length / size controls

### AC-3 — Owner saves length variants for a dress

- **Given** I have selected length variants and sizes on a dress product
- **When** I save the product
- **Then** the chosen variants and sizes are persisted and visible on re-opening the product

### AC-4 — Owner links a bag or scarf to a dress

- **Given** I have selected a related dress on a bag or scarf product
- **When** I save the product
- **Then** the pairing relationship is stored; the bag/scarf shows the linked dress on re-opening

### AC-5 — Pairing is optional

- **Given** a bag or scarf product with no related dress set
- **When** I save the product
- **Then** the product is saved without error — the pairing field is optional

---

## UX States Covered

- Dress variants (owner edits a dress — sees length + size controls)
- Default size set (XS–XL shown pre-selected)
- Pairing set (bag/scarf linked to a dress)
- Pairing absent (bag/scarf with no pairing — allowed)
- Non-dress product (no variant controls; only the pairing field)
- Save success (variants and pairings persisted)

---

## Out of Scope

- Base product create / edit / archive, price, and images (covered by `cms-products--v0-product-crud`)
- Buyer-facing "complete the look" pairing UI on the storefront (deferred per Q-012)
- Size pickers for bags and scarfs
- Inventory per variant or stock tracking
- Dynamic pricing per variant

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Product | Read, update | Length variants, size set, and related-dress link on the product |

---

## Credit / Payment Impact

None — variant and pairing setup involves no payment.

---

## Sharing / Privacy Impact

None — handled in the owner-only admin; pairings are not surfaced to buyers in v0 and carry no buyer data.

---

## Feedback / Instrumentation Impact

None — no owner feedback prompt or attributable analytics event in v0 scope.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `cms-products--v0-product-crud` | Scope Slice | complete | Base products must exist before variants/pairings can be set |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

The owner can give a dress its longer/shorter length variants and a size set, optionally link a bag or scarf to its related dress, and save those relationships — with pairings stored in the data model but not surfaced to buyers in v0.

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
| 2026-06-14 | Scaffolded from Scope Slice `cms-products--v0-product-variants-and-pairings` | orchestrator |
