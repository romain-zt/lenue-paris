# User Story: Dress Variants and Product Pairings

**ID:** US-001  
**Slice:** `cms-products--v0-product-variants-and-pairings`  
**Status:** `ready-for-spec`

---

## Story

As the boutique owner, I want to configure length variants and a size set for each dress, and optionally link a bag or scarf to its related dress, so that the admin holds the right variant data and pairing relationships from the start.

---

## Acceptance Criteria

**AC-1 — Length variants (dress only)**  
When the owner edits a dress (category = robe) in the CMS admin, they see a multi-select field for length variants offering "longer" and "shorter". The field is hidden for bags and scarfs.

**AC-2 — Size set (dress only)**  
When the owner edits a dress, they see a multi-select field for sizes pre-populated with XS, S, M, L, XL. They may deselect sizes to restrict the set. The field is hidden for non-dress products.

**AC-3 — Pairing link (bag / scarf only)**  
When the owner edits a bag (sac) or scarf (foulard), they see a relationship field "Related Dress" that accepts a single product of category robe. The field is hidden on dress records. The pairing is optional — the owner may leave it blank.

**AC-4 — Save and retrieve**  
All configured variant data and pairing links persist to the database and are retrievable via the Payload REST/GraphQL API.

**AC-5 — Non-dress products have no variant controls**  
When a bag or scarf is open in the admin, neither length variants nor size fields appear. When a dress is open, the related dress field does not appear.

---

## Out of Scope

- Buyer-facing "complete the look" pairing UI (deferred)
- Size pickers for bags and scarfs
- Inventory per variant
- Dynamic pricing per variant
