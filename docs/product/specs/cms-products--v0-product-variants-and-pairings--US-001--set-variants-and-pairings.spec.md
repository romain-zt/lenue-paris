# Spec: Set Dress Variants and Product Pairings

**ID:** cms-products--v0-product-variants-and-pairings--US-001  
**User Story:** [Set Dress Variants and Product Pairings](../user-stories/cms-products--v0-product-variants-and-pairings--US-001--set-variants-and-pairings.md)  
**Status:** `ready-for-implementation`

---

## Behavior

### lengthVariants field (dress-only)

- Field: `lengthVariants`, type `select`, `hasMany: true`
- Options: `longer`, `shorter`
- Admin condition: shown only when `category === "robe"`
- Not required; no default
- Already present in `apps/cms/src/collections/Products.ts`

### sizes field (dress-only)

- Field: `sizes`, type `select`, `hasMany: true`
- Options: `XS`, `S`, `M`, `L`, `XL`
- Default value: all five sizes
- Admin condition: shown only when `category === "robe"`
- Already present in `apps/cms/src/collections/Products.ts`

### relatedDress field (non-dress only)

- Field: `relatedDress`, type `relationship`, `relationTo: "products"`
- `hasMany: false`
- Not required (pairing is optional)
- Admin condition: shown only when `category !== "robe"`
- Description: "The dress this bag or scarf is paired with."
- **Not yet implemented — this is the implementation target**

---

## Contract

### Field contract

| Field | Type | Required | Condition |
|-------|------|----------|-----------|
| `lengthVariants` | `select` (multi) | no | `category === "robe"` |
| `sizes` | `select` (multi) | no | `category === "robe"` |
| `relatedDress` | `relationship → products` | no | `category !== "robe"` |

### Errors

| Condition | Behavior |
|-----------|----------|
| Non-dress saved without relatedDress | Saves successfully (field is optional) |
| relatedDress field shown on a dress | Never shown (admin condition gate) |

---

## Tests

### Unit (Products collection config)

- `relatedDress` field exists with `type: "relationship"` and `relationTo: "products"`
- `relatedDress` is not required
- `relatedDress` admin condition returns `true` for `sac`, `foulard`, `autre`
- `relatedDress` admin condition returns `false` for `robe`
- `lengthVariants` field exists with `hasMany: true` and correct options — already tested
- `sizes` field defaults to all 5 sizes — already tested

### E2E
None — all behavior is a Payload admin field config; contract + unit tests suffice.

---

## Implementation Notes

- Only `apps/cms/src/collections/Products.ts` and its test file need to change.
- No migration needed: Payload adds the `relatedDress` column automatically on next start.
- No buyer-facing surface changes in this slice.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Authored from user story (orchestrator mandate) | — |
