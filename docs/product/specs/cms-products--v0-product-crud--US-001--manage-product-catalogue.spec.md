# Spec: Product CRUD in Payload admin

## Parent User Story

[Manage product catalogue](../user-stories/cms-products--v0-product-crud--US-001--manage-product-catalogue.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Summary

Confirm and finalize the Payload `products` collection so the boutique owner can create, edit, and archive products with localized copy (fr/en/ru), an EUR price, a category (robe/sac/foulard/autre), and at least one gallery image — via the Payload admin UI. The collection already exists; the main gap is enforcing `minRows: 1` on the images array so a product cannot be saved without at least one image.

---

## Acceptance Criteria Trace

| Parent AC | How this spec satisfies it | Notes |
|-----------|---------------------------|-------|
| AC-1 | `products` Payload collection with `name` (required, localized), `category` (required select), `price` (required number ≥ 0), `images` (array, minRows 1) | Payload admin generates the create form |
| AC-2 | All fields editable; Payload PATCH handles persistence | Edit path auto-generated |
| AC-3 | `available` checkbox (default true); storefront filters `available=true` | Archive = uncheck + save |
| AC-4 | `required: true` on name/price/category; `minRows: 1` on images; Payload renders inline errors | Payload field validation; images enforced at array level |
| AC-5 | `name` and `description` fields marked `localized: true`; Payload admin locale switcher | fr/en/ru wired in Payload config |

---

## Data Model

### New / extended objects

- CMS `products` collection (existing) — add `minRows: 1` to the `images` array to enforce at least one image before saving.

### Field-level constraints

- `name` — required text, localized (fr/en/ru)
- `slug` — required text, unique, NOT localized (URL-safe identifier)
- `category` — required select: `robe | sac | foulard | autre`
- `description` — optional richText, localized
- `price` — required number, min 0
- `currency` — select, defaultValue `EUR`, options `[EUR]`
- `images` — array, **minRows: 1**, each item references `media` upload (required)
- `available` — checkbox, defaultValue `true`; false = archived / not shown on storefront
- `lengthVariants` — select (hasMany), options `[longer, shorter]`, shown only when category = robe
- `sizes` — select (hasMany), defaultValue XS–XL, shown only when category = robe

### Migrations or schema changes

The `minRows: 1` constraint is a Payload validation rule — no database migration required. Payload enforces it at the application layer during create/update.

---

## Contract

### Inputs

- Payload admin form — POST/PATCH to Payload internal REST API (`/api/products`)
- Fields: name (per locale), slug, category, description (per locale), price, currency, images (array), available, lengthVariants (dress only), sizes (dress only)

### Outputs

- 201 Created or 200 OK with the saved product document (Payload auto-generated)
- 400 Bad Request with field-level validation errors when required fields are missing

### Errors

| Error | When | User-visible message | Recovery |
|-------|------|---------------------|----------|
| Missing name | Save without name for active locale | "This field is required" (Payload default) | Fill in the name |
| Missing category | Save without category | "This field is required" (Payload default) | Select a category |
| Missing price | Save without price | "This field is required" (Payload default) | Enter a price |
| No images | Save with 0 images | "This field requires at least 1 item" (Payload minRows) | Upload at least one image |
| Non-unique slug | Save with duplicate slug | "Value must be unique" (Payload unique constraint) | Change the slug |

---

## UI Surface

Payload admin UI — auto-generated from collection config. No custom React components required for v0. Admin columns: name, category, price, available, updatedAt.

---

## Async / Event / Webhook / Cron / Stream

### 1. Long-running operation

No — Payload form saves are synchronous CMS writes well under 2s.

### 2. External callback (webhook)

No — no external system calls back into the CMS for product saves.

### 3. Temporal trigger (cron)

No — no scheduled work for product CRUD.

### 4. Event produced or consumed

No — product saves do not emit or consume events in v0.

### 5. Real-time push to client (SSE / WebSocket)

No — the admin UI re-fetches on navigation; polling-on-render acceptable in v0.

### 6. Background job / queue

No — no background processing for product saves.

### Summary

**Async classification:** Pure sync — no async patterns required, Payload REST/admin sync is sufficient.

---

## Tests

### Unit / behavior tests

- Products collection config: `name` field is `localized: true` and `required: true`
- Products collection config: `slug` field is NOT localized and `required: true`
- Products collection config: `category` field is `required: true` with options `[robe, sac, foulard, autre]`
- Products collection config: `price` field is `required: true` with `min: 0`
- Products collection config: `images` array has `minRows: 1`
- Products collection config: `images[].image` is `required: true`
- Products collection config: `available` checkbox defaults to `true`
- Products collection config: `lengthVariants` condition shows only for category = robe
- Products collection config: `sizes` condition shows only for category = robe
- Access control: public read returns true; create/update/delete require authenticated user

### Integration tests

None at this layer — Payload admin CRUD is framework-validated. Contract is the collection config itself.

### Acceptance tests against parent ACs

- AC-1/AC-4: Products config unit tests confirm all required fields and minRows; Payload enforces at runtime — no e2e required.
- AC-2/AC-3/AC-5: Verified structurally by config; Payload admin renders edit + locale switcher from the config — no e2e required.

### Non-functional tests (performance, security, accessibility)

None required in v0 — Payload admin handles auth gate (`create/update/delete` require `req.user`).

---

## Observability

| Signal | Type | Purpose |
|--------|------|---------|
| Payload server logs | Log | Record create/update/delete operations with user ID |

---

## Implementation notes

- Stack: Payload 3 (`CollectionConfig`), TypeScript. No additional dependencies.
- The `minRows` property on array fields is a Payload 3 built-in — no workaround needed.
- `available` is a simple boolean checkbox; the storefront already filters `where[available][equals]=true` to exclude archived products.
- Locale handling: Payload config must have `fr`, `en`, `ru` in `locales` (already configured in `apps/cms`).
- No custom hooks, access control changes, or admin UI overrides required for this spec.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Payload 3 collection config | Framework | active | Already wired in `apps/cms/src/collections/Products.ts` |
| Media collection | CMS | active | Product gallery images reference `media` |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Out of Scope

- Dress length variants and related-product pairings (covered by `cms-products--v0-product-variants-and-pairings` spec)
- Order management
- Inventory / stock tracking
- Bulk import
- Promotions or pricing rules
- Custom Payload admin UI components

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

No subdivision needed — the implementation is a single-surface edit to `Products.ts` + test update.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Scaffolded and promoted to ready-for-implementation | orchestrator |
