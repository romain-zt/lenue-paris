# User Story: Set dress length variants, size set, and related-product pairings

## Parent Scope Slice

[v0 Product Variants and Pairings](../scope-slices/cms-products--v0-product-variants-and-pairings.md)

## Status

`ready-for-spec`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a boutique owner, I want to set length variants and a size set on a dress, and optionally link a bag or scarf to its related dress, so that the correct options and pairings are stored in the data model and ready for the storefront and orders.

---

## Acceptance Criteria

### AC-1 — Owner sets length variants on a dress

- **Given** I am editing a dress in the CMS admin
- **When** I select one or both length variants (longer / shorter) and save
- **Then** the selected length variants are persisted on the product

### AC-2 — Dress size set defaults to XS–XL and is editable

- **Given** I am editing a dress in the CMS admin
- **When** I view the sizes field
- **Then** it shows XS–XL pre-selected by default; I can add or remove sizes and save the adjusted set

### AC-3 — Length and size controls are not shown for bags or scarves

- **Given** I am editing a bag or scarf in the CMS admin
- **When** I view the product edit form
- **Then** I do not see the length variants or sizes fields

### AC-4 — Owner links a bag or scarf to a related dress

- **Given** I am editing a bag or scarf in the CMS admin
- **When** I choose a related dress from the pairing field and save
- **Then** the pairing relationship is stored on the product

### AC-5 — Pairing is optional — no error when absent

- **Given** I am editing a bag or scarf with no pairing set
- **When** I save the product
- **Then** the product is saved successfully without any error about the pairing field

### AC-6 — Pairing field is not shown on dresses

- **Given** I am editing a dress in the CMS admin
- **When** I view the product edit form
- **Then** I do not see the related dress pairing field

---

## UX States Covered

- Dress variants
- Default size set
- Pairing set
- Pairing absent
- Non-dress product
- Save success

---

## Out of Scope

- Base product create / edit / archive, price, and images (`cms-products--v0-product-crud`)
- Buyer-facing "complete the look" pairing UI (deferred per Q-012 — pairings CMS-only for v0)
- Inventory per variant or stock tracking
- Dynamic pricing per variant

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| `cms-products--v0-product-crud` | complete | Base products collection must exist |

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
