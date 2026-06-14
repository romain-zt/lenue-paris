# User Story: Set dress length variants, sizes, and related-product pairings

## Parent Scope Slice

[v0 Product Variants and Pairings](../scope-slices/cms-products--v0-product-variants-and-pairings.md)

## Status

`ready-for-spec`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a boutique owner, I want to set a dress's length variants and size set in the CMS admin and optionally link a bag or scarf to its related dress, so the storefront and orders carry the right options and pairings are ready in the data model.

---

## Acceptance Criteria

### AC-1 — Owner sets dress length variants

- **Given** I am editing a dress product in the CMS admin
- **When** I select one or both length variants (longer / shorter) and save
- **Then** the length variants are persisted on the product

### AC-2 — Owner confirms or adjusts the size set

- **Given** I am editing a dress product in the CMS admin
- **When** I view the sizes field
- **Then** XS–XL is pre-selected by default; I can add or remove sizes and save the adjusted set

### AC-3 — Length and size controls are hidden for non-dress products

- **Given** I am editing a bag or scarf product in the CMS admin
- **When** I view the product form
- **Then** the length variants and sizes fields are not shown

### AC-4 — Owner links a bag or scarf to its related dress

- **Given** I am editing a bag or scarf product in the CMS admin
- **When** I select a dress from the "Related dress" field and save
- **Then** the pairing is persisted on the bag/scarf product

### AC-5 — Pairing is optional for all product types

- **Given** I am editing any product in the CMS admin
- **When** I leave the "Related dress" field empty and save
- **Then** the product saves successfully with no error

---

## UX States Covered

- Dress variants
- Default size set
- Pairing set
- Pairing absent
- Non-dress product

---

## Out of Scope

- Base product create / edit / archive, price, and images (`cms-products--v0-product-crud`)
- Buyer-facing "complete the look" pairing UI on the storefront
- Inventory per variant or stock tracking
- Dynamic pricing per variant

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| `cms-products--v0-product-crud` | complete | Base products must exist before variants/pairings can be set |

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
