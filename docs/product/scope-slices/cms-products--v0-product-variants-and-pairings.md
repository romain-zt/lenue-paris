# Scope Slice: v0 Product Variants and Pairings

## Parent Feature Area

[CMS Products](../feature-areas/cms-products.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

The owner can set up each dress with its length variants and link bags or scarfs to their related dress, so the storefront and orders carry the right options and the pairings are ready in the data model.

---

## Exact Boundary

### Included Behavior

- Owner defines a dress's **length variants** (longer / shorter)
- Owner confirms the dress **size set** (defaults to XS–XL per Q-005, owner may adjust)
- Owner links a bag or scarf to its **related dress** (pairing) — stored in the data model
- Pairings and variants are editable alongside the base product

### Excluded Behavior

- Base product create / edit / archive, price, and images (covered by `cms-products--v0-product-crud`)
- Any buyer-facing "complete the look" pairing UI on the storefront (deferred per Q-012 — pairings CMS-only for v0)
- Size pickers for bags and scarfs (those have no size)
- Inventory per variant or stock tracking
- Dynamic pricing per variant (one EUR price per product in v0)

---

## UX States

| State | When | What the owner sees / experiences |
|-------|------|-----------------------------------|
| Dress variants | Owner edits a dress | Controls to set longer / shorter length variants and confirm the size set |
| Default size set | Owner has not changed sizes | XS–XL applied by default, clearly shown as editable |
| Pairing set | Owner links a bag/scarf to a dress | The related dress is recorded on the bag/scarf |
| Pairing absent | A bag/scarf has no pairing | Allowed — pairing is optional; no error |
| Non-dress product | Owner edits a bag or scarf | No length/size controls; only the optional pairing field |
| Save success | Owner saves variants/pairings | Confirmation that the variant and pairing data are stored |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Product | Read, update | Length variants, size set, and related-product link on the product |

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
| `cms-products--v0-product-crud` | Scope Slice | pending | Base products must exist before variants/pairings can be set |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

The owner can give a dress its longer/shorter length variants and a size set, optionally link a bag or scarf to its related dress, and save those relationships — with pairings stored in the data model but not surfaced to buyers in v0.

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
