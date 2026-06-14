# Spec: CMS Products collection — create, edit, and archive

## Parent User Story

[Create, edit, and archive a product](../user-stories/cms-products--v0-product-crud--US-001--create-edit-archive-product.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Summary

Ensure the Payload 3 `products` CMS collection correctly enforces all required fields (name, price, category, at least one image) and exposes the `available` flag for archiving. The collection already exists in `apps/cms/src/collections/Products.ts`; this spec adds the `minRows: 1` constraint on the `images` array and confirms the full schema is coherent for the v0 Product CRUD slice. No new routes or UI are needed — Payload auto-generates the admin panel from the collection config.

---

## Acceptance Criteria Trace

| Parent AC | How this spec satisfies it | Notes |
|-----------|---------------------------|-------|
| AC-1 | `Products` collection config: `name` (required, localized), `category` (required select), `price` (required number ≥ 0), `images` array with `minRows: 1` | Payload admin generates the create form |
| AC-2 | Same collection config enables edit via Payload admin | No extra route needed |
| AC-3 | `available` checkbox (default `true`) — set to `false` to archive | Storefront queries filter `available: true` at read time |
| AC-4 | `required: true` on `name`, `price`, `category`; `minRows: 1` on `images` array | Payload enforces at save; inline errors in admin UI |
| AC-5 | `localized: true` on `name` and `description`; `slug` not localized; Payload admin locale switcher | fr primary, en + ru secondary per project config |

---

## Data Model

### Collection: `products` (`apps/cms/src/collections/Products.ts`)

Already exists. The only schema change required for this slice:

| Field | Change | Reason |
|-------|--------|--------|
| `images` (array) | Add `minRows: 1` | Enforces "at least one image" per AC-4 |

All other fields are already correctly configured:

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `name` | text | required, localized | fr (primary), en, ru |
| `slug` | text | required, unique, NOT localized | URL identifier |
| `category` | select | required; options: robe/sac/foulard/autre | |
| `description` | richText | localized (optional) | |
| `price` | number | required, min: 0 | EUR value |
| `currency` | select | default "EUR", options: ["EUR"] | Fixed to EUR in v0 |
| `images` | array | minRows: 1 (new) | Each row has an `upload` to `media` |
| `available` | checkbox | default: true | false = archived / unpublished |

Dress-specific fields (`lengthVariants`, `sizes`) are in scope for the sibling slice `cms-products--v0-product-variants-and-pairings` and already present; they are out of scope for this spec.

### Migrations

- No SQL migration needed. Payload pushes schema changes on next CMS boot.
- `minRows: 1` is a Payload-layer validation rule, not a DB constraint; no migration file required.

---

## Contract

This slice uses the Payload-generated admin REST API. No custom route changes.

### Validation errors (Payload admin)

| Error | When | Admin feedback |
|-------|------|----------------|
| required_name | `name` empty | Inline "This field is required" on name |
| required_price | `price` empty or missing | Inline "This field is required" on price |
| required_category | `category` not selected | Inline "This field is required" on category |
| min_one_image | `images` array empty (minRows: 1) | Inline "This field requires at least 1 item" on images |

---

## UI Surface

- Payload admin panel at `/admin/collections/products` — auto-generated from the collection config.
- No custom React component or override needed for this slice.

---

## Async / Event / Webhook / Cron / Stream

### 1. Long-running operation

- No.

### 2. External callback (webhook)

- No.

### 3. Temporal trigger (cron)

- No.

### 4. Event produced or consumed

- No.

### 5. Real-time push to client (SSE / WebSocket)

- No.

### 6. Background job / queue

- No.

**Async classification:** Pure sync — Payload admin form POST; no async patterns required.

---

## Tests

### Unit / behavior tests

- `apps/cms/src/collections/Products.test.ts`
  - `images` field has `type: "array"` and `minRows: 1`
  - `name` field: `required: true`, `localized: true`
  - `slug` field: `required: true`, NOT localized
  - `price` field: `required: true`, `min: 0`
  - `category` field: `required: true`, options include robe / sac / foulard / autre
  - `available` field: `type: "checkbox"`, `defaultValue: true`
  - Public read access; authenticated write access

### Contract tests

- Not applicable — no custom API route added by this slice.

### Integration tests

- None in v0 — Payload schema enforcement is validated by unit tests on the collection config.

### E2E

- None — covered by unit tests on the collection config; Payload admin behavior is Payload's own integration concern.

---

## Observability

No custom signals for this slice — product creates/updates are visible in Payload admin audit logs.

---

## Implementation notes

- Stack: Payload 3 (`apps/cms`). No changes to `apps/web` or any `packages/*`.
- The only code change: add `minRows: 1` to the `images` array field in `Products.ts`.
- The test file `Products.test.ts` must be updated to assert `images.minRows === 1`.
- Dress-specific variant fields (`lengthVariants`, `sizes`) are already in the collection and remain untouched by this spec.
- `available` checkbox provides archive/unpublish without Payload's draft/publish system — acceptable for v0 because there is no buyer-facing draft workflow.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `i18n-localization` | Feature Area | pending | Localized field support depends on Payload locales config; already wired in `payload.config.ts` |
| PRD Configuration Matrix | PRD reference | ready | Category set and EUR currency confirmed |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Out of Scope

- Dress length variants and related-product pairings (sibling slice)
- Any storefront query changes (buyer-facing `available` filter is a product-catalog concern)
- Order management, inventory, bulk import, promotions

---

## Readiness for Implementation

- [x] Summary traces back to the parent User Story
- [x] All parent ACs traced
- [x] Data model fields named with constraints
- [x] Contract inputs/outputs/errors enumerated
- [x] UI surface named
- [x] Async section complete with classification
- [x] Tests section non-empty
- [x] Observability signals named
- [x] Implementation notes name stack constraints
- [x] Dependencies named with status
- [x] All blockers resolved

**Verdict:** READY FOR IMPLEMENTATION

---

## Tasks (optional)

| Task | Path | Status |
|------|------|--------|
| — | — | Direct implementation (no task subdivision) |

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Authored by orchestrator step agent | — |
