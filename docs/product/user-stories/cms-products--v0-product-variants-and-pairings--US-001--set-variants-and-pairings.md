# User Story: Set Dress Variants and Product Pairings

**ID:** cms-products--v0-product-variants-and-pairings--US-001  
**Slice:** [v0 Product Variants and Pairings](../scope-slices/cms-products--v0-product-variants-and-pairings.md)  
**Status:** `ready-for-spec`

---

## Story

As the boutique owner,  
I want to set length variants and a size set on a dress, and optionally link a bag or scarf to its related dress,  
so that the storefront shows the right options and the pairing is stored in the data model.

---

## Acceptance Criteria

### AC-1 — Length variants on a dress
Given I am editing a dress product in the CMS admin,  
when I open the product form,  
then I see a "Length variants" multi-select with options `longer` and `shorter`,  
and the field is hidden for bags, scarfs, and other categories.

### AC-2 — Size set defaults to XS–XL for a dress
Given I am editing a dress product in the CMS admin,  
when I open the product form without having changed sizes,  
then I see a "Sizes" multi-select pre-filled with XS, S, M, L, XL,  
and the field is hidden for bags, scarfs, and other categories.

### AC-3 — Owner can adjust the size set
Given I am editing a dress product in the CMS admin,  
when I remove or add values in the Sizes field and save,  
then the new size set is stored on the product.

### AC-4 — Pairing a bag or scarf to a dress
Given I am editing a bag or scarf (or "autre") product in the CMS admin,  
when I open the product form,  
then I see an optional "Related dress" relationship field  
that lets me pick one dress from the product list.

### AC-5 — Pairing is optional
Given I am editing a bag or scarf product in the CMS admin,  
when I save the product without selecting a related dress,  
then the product saves successfully with no pairing error.

### AC-6 — Pairing field hidden for dresses
Given I am editing a dress product in the CMS admin,  
when I open the product form,  
then the "Related dress" relationship field is not shown.

---

## Out of scope

- Buyer-facing "complete the look" UI (deferred per Q-012)
- Size pickers for bags and scarfs
- Inventory per variant or stock tracking
- Dynamic pricing per variant

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Authored from scope slice (orchestrator mandate) | — |
