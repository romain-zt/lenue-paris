# Spec: Set dress length variants, sizes, and related-product pairings

## Parent User Story

[US-001 — Set dress length variants, sizes, and related-product pairings](../user-stories/cms-products--v0-product-variants-and-pairings--US-001--set-dress-variants-and-pairings.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Summary

Extends the Payload `Products` collection with:
1. `lengthVariants` — multi-select (longer / shorter), admin-visible only for `category = robe`.
2. `sizes` — multi-select (XS–XL), defaulting to the full set, admin-visible only for `category = robe`.
3. `relatedDress` — optional relationship to another `products` document, filtered to `category = robe`, shown for all product types (bags and scarfs may use it; dresses may too but it is optional).

All three fields are stored on the `products` collection; no new collection or migration table is required (Payload + Neon Postgres auto-handles schema via the existing Payload migration runner).

---

## Data Model

### Products collection changes (`apps/cms/src/collections/Products.ts`)

| Field | Type | Config |
|-------|------|--------|
| `lengthVariants` | `select` (hasMany) | options: `longer`, `shorter`; admin condition: `category === "robe"` |
| `sizes` | `select` (hasMany) | options: XS S M L XL; defaultValue: all five; admin condition: `category === "robe"` |
| `relatedDress` | `relationship` | relationTo: `"products"`; hasMany: false; required: false; filterOptions: `{ category: { equals: "robe" } }` |

`lengthVariants` and `sizes` were introduced in the prior `cms-products--v0-product-crud` step but were already present in the schema; they are included here for completeness of the spec.

---

## Contract

### Fields contract (Payload collection schema)

| AC | Field | Behaviour |
|----|-------|-----------|
| AC-1 | `lengthVariants` | persists `["longer"]`, `["shorter"]`, or `["longer","shorter"]`; null/empty allowed |
| AC-2 | `sizes` | defaults to `["XS","S","M","L","XL"]`; owner can override; persisted on save |
| AC-3 | `lengthVariants`, `sizes` | `admin.condition` returns false when `siblingData.category !== "robe"` |
| AC-4 | `relatedDress` | stores a reference to a products document with `category = robe`; `filterOptions` enforces the category filter in the admin picker |
| AC-5 | `relatedDress` | `required: false` — omitting it does not block save |

### Errors

| Error condition | Behaviour |
|-----------------|-----------|
| `relatedDress` points to a non-dress product | Payload `filterOptions` prevents selection in admin; REST API does not enforce category at the DB level (v0 scope, admin-only) |

---

## Async / Event / Webhook / Cron / Stream

- **Does this Spec introduce any async operation, background job, scheduled task, webhook call, or streaming response?** No.
- **Are there events produced or consumed?** No.
- **Is there a queue, topic, or message broker involved?** No.
- **Are there retry / idempotency requirements?** No.
- **Are there ordering or delivery guarantees required?** No.
- **Are there backpressure or rate-limiting concerns?** No.

**Classification: default-REST-sync** — all writes are synchronous Payload admin saves; no async layer needed in v0.

---

## UI Surface

Payload admin panel — auto-generated from collection config. No custom React components required.

- `lengthVariants` and `sizes` appear in the dress product form only (admin condition gate).
- `relatedDress` appears for all product types as an optional relationship picker, filtered to dresses.

---

## Observability

None required in v0 — no analytics events, no error tracking beyond Payload's built-in logging.

---

## Tests

### Unit / behaviour tests (`apps/cms/src/collections/Products.test.ts`)

- `relatedDress` field exists with `type: "relationship"`, `relationTo: "products"`, `required: false`
- `relatedDress.filterOptions` is set (truthy)
- `lengthVariants` admin condition is true for `category = "robe"`, false for others (already tested)
- `sizes` admin condition is true for `category = "robe"`, false for others (already tested)

### Contract tests

None — all behaviour is configuration-level on the Payload collection; the unit tests above verify the contract directly.

### Integration tests

None — Payload schema tests are unit-level; no custom business logic or hooks to integration-test.

### E2E

None — covered by unit tests on collection config. Payload admin rendering is not tested at E2E level in v0.

---

## Implementation Notes

- `relatedDress` uses Payload's `relationship` field type — Payload auto-generates the join column on the Postgres `products` table.
- `filterOptions` on the `relatedDress` field restricts the admin picker to dresses but does not add a DB-level foreign key constraint to `category = robe` (acceptable for v0 admin-only surface).
- No Payload migration file needed beyond what Payload generates automatically on next startup.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Authored by orchestrator step agent | — |
