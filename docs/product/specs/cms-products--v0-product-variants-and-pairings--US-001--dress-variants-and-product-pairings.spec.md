# Spec: Dress Variants and Product Pairings

**ID:** SPEC-001  
**User Story:** `cms-products--v0-product-variants-and-pairings--US-001`  
**Slice:** `cms-products--v0-product-variants-and-pairings`  
**Status:** `ready-for-implementation`

---

## Behavior

### Field: `lengthVariants` (dress only)

- Type: `select`, `hasMany: true`
- Options: `longer`, `shorter` (matching `DRESS_LENGTH_VARIANTS`)
- Shown only when `category === "robe"` (admin `condition`)
- Optional — no `required: true`
- Already present in `Products.ts`; no schema change needed

### Field: `sizes` (dress only)

- Type: `select`, `hasMany: true`
- Options: XS, S, M, L, XL (matching `DRESS_SIZE_OPTIONS`)
- Default: all five selected
- Shown only when `category === "robe"` (admin `condition`)
- Already present in `Products.ts`; no schema change needed

### Field: `relatedDress` (bag / scarf only) — **new**

- Type: `relationship`, `relationTo: "products"`, `hasMany: false`
- Shown only when `category === "sac"` OR `category === "foulard"` (admin `condition`)
- Optional — no `required: true`
- Label: "Related Dress"
- Admin description: "The dress this bag or scarf is paired with. Optional."
- Must NOT appear on dress records (condition returns false for `category === "robe"`)

---

## Contract

| Field | Payload field type | Stored as | Notes |
|---|---|---|---|
| `lengthVariants` | `select` (hasMany) | `string[]` | Values: `"longer"`, `"shorter"` |
| `sizes` | `select` (hasMany) | `string[]` | Values: `"XS"` … `"XL"` |
| `relatedDress` | `relationship` | `string` (product id) | Nullable; only for sac/foulard |

---

## Tests

- **Unit:** `relatedDress` field exists on `Products.fields` with correct type, `relationTo`, and `hasMany: false`
- **Unit:** `relatedDress` admin condition returns `true` for `sac`, `true` for `foulard`, `false` for `robe`
- **Unit:** `lengthVariants` condition returns `true` for `robe`, `false` for `sac`
- **Unit:** `sizes` condition returns `true` for `robe`, `false` for `foulard`
- E2E: none — field config is fully verifiable by unit tests on the collection config object

---

## Implementation Notes

- Add `relatedDress` field to `apps/cms/src/collections/Products.ts` after the `available` field
- Use Payload `relationship` field type pointing at `"products"` collection
- `admin.condition` mirrors the `isDressCategory` helper but inverted: `category === "sac" || category === "foulard"`
- No migration needed beyond Payload's auto-DDL (new nullable column)
- No storefront changes in v0 — pairings are CMS-only
