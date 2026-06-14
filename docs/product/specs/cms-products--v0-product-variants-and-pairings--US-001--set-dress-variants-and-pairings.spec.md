# Spec: Product variants and pairings in Payload admin

## Parent User Story

[Set dress variants and pairings in admin](../user-stories/cms-products--v0-product-variants-and-pairings--US-001--set-dress-variants-and-pairings.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Summary

Extend the Payload `products` collection with a `relatedDress` relationship field that bags and scarfs can use to link their paired dress. The `lengthVariants` and `sizes` fields for dresses already exist; this spec covers the remaining gap — the optional pairing field shown only on non-dress products (`sac`, `foulard`, `autre`).

---

## Acceptance Criteria Trace

| Parent AC | How this spec satisfies it | Notes |
|-----------|---------------------------|-------|
| AC-1 | `lengthVariants` and `sizes` fields already exist with `condition: isDressCategory` — no change needed | Already implemented; covered by existing tests |
| AC-2 | Add `relatedDress` relationship field referencing `products`, with `condition: !isDressCategory` | Shown only for non-dress categories |
| AC-3 | `lengthVariants` and `sizes` persist via Payload standard collection save | Already works; existing tests confirm config |
| AC-4 | `relatedDress` relationship field persisted by Payload on save | Standard Payload relationship field |
| AC-5 | `relatedDress` field has no `required: true` — optional by design | Pairing absent is always valid |

---

## Data Model

### New / extended objects

- CMS `products` collection — add `relatedDress` relationship field (type `relationship`, relationTo `products`, hasMany `false`, not required, shown only when category ≠ `robe`).

### Field-level constraints

- `relatedDress` — optional relationship to `products`; shown only when `category` is not `robe`; no `required: true`; `hasMany: false` (one dress per accessory).

### Migrations or schema changes

Payload relationship fields are stored as a nullable foreign key column (`relatedDress_id`) added automatically by Payload's schema generation on next boot. No manual SQL migration file needed.

---

## Contract

### Inputs

- Payload admin form — POST/PATCH to `/api/products`
- Additional field: `relatedDress` (ID of a product with category `robe`, or null)

### Outputs

- 200 OK / 201 Created with the saved product document including `relatedDress` populated (standard Payload response)
- 400 Bad Request if `relatedDress` references a non-existent product ID (Payload relationship validation)

### Errors

| Error | When | User-visible message | Recovery |
|-------|------|---------------------|----------|
| Invalid related dress ID | `relatedDress` references a product that does not exist | "The following relationship value does not exist" (Payload default) | Select a valid dress or leave blank |

---

## UI Surface

Payload admin UI — auto-generated from collection config. No custom React components required for v0. The `relatedDress` field description reads: "The dress this bag or scarf is paired with (optional)."

---

## Async / Event / Webhook / Cron / Stream

### 1. Long-running operation

No — Payload form saves are synchronous CMS writes well under 2s.

### 2. External callback (webhook)

No — no external system calls back into the CMS for product saves.

### 3. Temporal trigger (cron)

No — no scheduled work for product pairing.

### 4. Event produced or consumed

No — pairing saves do not emit or consume events in v0.

### 5. Real-time push to client (SSE / WebSocket)

No — the admin UI re-fetches on navigation.

### 6. Background job / queue

No — no background processing for product saves.

### Summary

**Async classification:** Pure sync — no async patterns required, Payload REST/admin sync is sufficient.

---

## Tests

### Unit / behavior tests

- `relatedDress` field exists in the Products collection with type `relationship`
- `relatedDress` field has `relationTo: "products"` and `hasMany: false`
- `relatedDress` field is NOT required (no `required: true`)
- `relatedDress` condition returns `false` when category is `robe`
- `relatedDress` condition returns `true` when category is `sac`
- `relatedDress` condition returns `true` when category is `foulard`
- `relatedDress` condition returns `true` when category is `autre`
- Existing: `lengthVariants` condition returns `true` for `robe`, `false` for `sac`
- Existing: `sizes` condition returns `true` for `robe`, `false` for `foulard`

### Integration tests

None at this layer — Payload admin CRUD is framework-validated. Contract is the collection config itself.

### Acceptance tests against parent ACs

- AC-2/AC-4/AC-5: Unit tests confirm `relatedDress` field config and optional nature; Payload admin renders the field from config — no e2e required.
- AC-1/AC-3: Verified by existing unit tests covering `lengthVariants` and `sizes`.

### Non-functional tests (performance, security, accessibility)

None required in v0 — Payload admin handles auth gate.

---

## Observability

| Signal | Type | Purpose |
|--------|------|---------|
| Payload server logs | Log | Record create/update operations with user ID |

---

## Implementation notes

- Stack: Payload 3 (`CollectionConfig`), TypeScript. No additional dependencies.
- Add a single `relationship` field named `relatedDress` to `Products.ts` with `condition: (_, siblingData) => !isDressCategory(siblingData)`.
- The existing `isDressCategory` helper (`data.category === "robe"`) already handles the condition logic; negate it for the pairing field.
- Payload auto-creates the nullable FK column on next migration/push. No manual migration file required.
- No hooks, custom access control, or admin overrides needed.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Payload 3 collection config | Framework | active | Already wired in `apps/cms/src/collections/Products.ts` |
| `products` collection (self-referential) | CMS | active | `relatedDress` references the same `products` collection |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Out of Scope

- Base product create / edit / archive, price, and images (covered by `cms-products--v0-product-crud` spec)
- Buyer-facing "complete the look" pairing UI (deferred per Q-012)
- Size pickers for bags and scarfs
- Inventory per variant or stock tracking
- Dynamic pricing per variant

---

## Readiness for Implementation

- [x] Summary traces back to the parent User Story
- [x] All parent ACs traced (satisfied here, or explicitly deferred)
- [x] Data model fields named with constraints
- [x] Contract inputs/outputs/errors enumerated
- [x] UI surface named or marked None with reason
- [x] Async / Event / Webhook / Cron / Stream — all 6 sub-questions answered with one of the four allowed responses, and Async classification line filled
- [x] Tests section non-empty across unit, integration, and acceptance layers
- [x] Observability signals named with purpose
- [x] Implementation notes name stack and runtime constraints
- [x] All dependencies named with status
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Out of scope explicitly named

**Verdict:** READY FOR IMPLEMENTATION

---

## Tasks (optional)

No subdivision needed — the implementation is a single-surface edit to `Products.ts` + test additions.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Scaffolded and promoted to ready-for-implementation | orchestrator |
