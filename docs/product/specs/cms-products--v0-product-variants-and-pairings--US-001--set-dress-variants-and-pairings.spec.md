# Spec: Set dress length variants, size set, and related-product pairings

## Parent User Story

[US-001 — Set dress length variants, size set, and related-product pairings](../user-stories/cms-products--v0-product-variants-and-pairings--US-001--set-dress-variants-and-pairings.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Scope

Extend the `products` Payload collection with:

1. `lengthVariants` — multi-select (`longer` / `shorter`), visible only for `category === "robe"` — **already present in Products.ts**.
2. `sizes` — multi-select (XS–XL, defaultValue all five), visible only for `category === "robe"` — **already present in Products.ts**.
3. `relatedDress` — optional relationship field pointing to another product (self-referential, filtered to `category === "robe"` in the admin), visible only when `category !== "robe"`.

No migration file is needed — Payload auto-generates the schema. No buyer-facing UI change.

---

## Data Model

### Products collection — fields added / confirmed

| Field | Type | Payload config | Condition |
|-------|------|----------------|-----------|
| `lengthVariants` | `select` (hasMany) | options: longer / shorter | `category === "robe"` |
| `sizes` | `select` (hasMany) | options: XS, S, M, L, XL; defaultValue: all five | `category === "robe"` |
| `relatedDress` | `relationship` | relationTo: "products"; required: false | `category !== "robe"` |

`relatedDress` stores the Payload document ID of the linked dress. It is optional and unrestricted — any non-dress product may link zero or one dress.

---

## Contract

No new public API route. Payload REST/GraphQL auto-exposes the field on `GET /api/products/:id`.

### AC Satisfaction

| AC | Satisfied by |
|----|-------------|
| AC-1 | `lengthVariants` select field (already present) |
| AC-2 | `sizes` select field with `defaultValue` (already present) |
| AC-3 | `admin.condition` gates on both fields → hidden for non-dress |
| AC-4 | `relatedDress` relationship field, optional, hidden for dresses |
| AC-5 | `relatedDress` has no `required: true` → Payload allows absent |
| AC-6 | `relatedDress` has `admin.condition` → hidden for dresses |

---

## UI Surface

Payload Admin only (no buyer-facing surface). The `relatedDress` field renders as a relationship picker in the product edit form.

---

## Async / Event / Webhook / Cron / Stream

- **Does this change introduce any async processing, background jobs, cron tasks, outbound webhooks, or event emissions?** No.
- **Does it consume any queue messages, subscribe to events, or process streams?** No.
- **Does it trigger any side-effects on other collections?** No.
- **Does it expose any inbound webhook endpoints?** No.
- **Does any timing concern exist?** No.
- **Classification:** default-REST-sync — all reads/writes are synchronous Payload CRUD operations.

---

## Observability

No owner feedback prompt or analytics event in v0 scope (per Scope Slice).

---

## Tests

### Unit / behavior (field-level, no Payload runtime needed)

| Test | Traces to |
|------|-----------|
| `relatedDress` field exists with `type: "relationship"` and `relationTo: "products"` | AC-4 |
| `relatedDress` has no `required: true` | AC-5 |
| `relatedDress` condition returns `false` for `category === "robe"` | AC-6 |
| `relatedDress` condition returns `true` for `category === "sac"` | AC-4 |
| `relatedDress` condition returns `true` for `category === "foulard"` | AC-4 |
| `lengthVariants` condition returns `true` for `robe`, `false` for `sac` | AC-3 (regression) |
| `sizes` defaults to all five XS–XL values | AC-2 (regression) |

### Contract

No custom API endpoint — Payload auto-generates REST; no contract test needed.

### Integration

Not required for this layer — field configuration is pure TypeScript; runtime schema generation tested by the existing Payload test suite.

### E2E

None — field configuration coverage via unit tests is sufficient; no revenue-critical journey involved.

---

## Implementation Notes

- All three fields (`lengthVariants`, `sizes`) are already implemented; only `relatedDress` is new.
- Use Payload's `relationship` field type with `relationTo: "products"` (self-referential). Set `hasMany: false` (one dress per bag/scarf).
- The `admin.condition` uses the same `isDressCategory` guard (negated) already used for `lengthVariants` and `sizes`.
- No Payload migration file needed — Payload handles schema updates on startup.

---

## Readiness for Implementation

- [x] Every parent AC has a satisfaction strategy
- [x] Data model fields specified
- [x] Contract surface described
- [x] Async classification stated explicitly
- [x] Tests section is non-empty with layers justified
- [x] UI surface described
- [x] No behavior outside parent User Story scope
- [x] NEED_HUMAN false

**Verdict:** READY FOR IMPLEMENTATION

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Authored by orchestrator step agent | — |
