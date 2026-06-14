# Spec: Dress length and size variant pickers

## Parent User Story

[Select dress length and size](../user-stories/product-detail--v0-pdp-variant-pickers--US-001--select-dress-variants.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Summary

Extend the product detail stack so dress pages expose length and size pickers backed by CMS variant fields, block the order CTA until both choices are made, carry the selection into the order URL query params for the checkout slice, and hide pickers entirely for bags and scarfs. Layer 1 adds CMS schema; subsequent layers extend `@repo/product-detail` contracts, mapping, API, UI, and tests.

---

## Acceptance Criteria Trace

| Parent AC | How this spec satisfies it | Notes |
|-----------|---------------------------|-------|
| AC-1 | Dress PDP shows pickers; order CTA disabled until both selected | |
| AC-2 | Partial selection keeps CTA disabled and highlights missing picker | |
| AC-3 | Selected length + size appended to `orderHref` query string | Checkout slice reads params |
| AC-4 | `variantPickers: null` for non-dress categories — no picker UI | |
| AC-5 | Picker group labels localized via `@/lib/pdp-copy`; size codes stay XS–XL | |

---

## Data Model

### New / extended objects

- CMS `products` collection — `lengthVariants` (select, hasMany) and `sizes` (select, hasMany, default XS–XL) for dresses only
- `@repo/product-detail` — `ProductLengthVariant`, `ProductSizeCode`, `ProductVariantPickers`, extended `ProductDetail` and `PayloadProductDetailDoc`

### Field-level constraints

- `lengthVariants` — allowed values `"longer" | "shorter"`; only on `category: "robe"`
- `sizes` — allowed values `"XS" | "S" | "M" | "L" | "XL"`; default all five; only on `category: "robe"`
- `ProductDetail.variantPickers` — `null` for bags/scarfs; object with `lengthOptions` + `sizeOptions` arrays for dresses

### Migrations or schema changes

- Payload `products` collection: add `lengthVariants`; replace legacy `sizes` array (`label` + `inStock`) with select hasMany of fixed size codes (no inventory in v0). Payload push/migration on next CMS boot.

---

## Contract

### Inputs

- Existing `GET /api/products/[slug]?locale={fr|en|ru}` — response extended with optional `variantPickers`
- Client-side selection state on PDP (dress only)

### Outputs

Extended `ProductDetail`:

```json
{
  "variantPickers": {
    "lengthOptions": ["longer", "shorter"],
    "sizeOptions": ["XS", "S", "M", "L", "XL"]
  },
  "orderHref": "/fr/order/robe-lin?length=longer&size=M"
}
```

Non-dress:

```json
{
  "variantPickers": null,
  "orderHref": "/fr/order/sac-cuir"
}
```

### Errors

| Error | When | User-visible message | Recovery |
|-------|------|---------------------|----------|
| — | Dress with empty CMS variant lists | Pickers hidden; CTA links without params | Owner fills CMS fields |
| — | Partial client selection | CTA disabled with helper text | Buyer completes selection |

---

## UI Surface

- `/[locale]/products/[slug]` — dress: length + size picker groups above order CTA; bag/scarf: unchanged layout without pickers
- States: no selection, partial selection, complete selection, localized labels

---

## Async / Event / Webhook / Cron / Stream

### 1. Long-running operation

- No — sync CMS read + client selection state.

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

**Async classification:** Pure sync — client selection state + REST response extension; no async patterns required.

---

## Tests

### Unit / behavior tests

- `@repo/product-detail` — `resolveVariantPickers` returns options for dress docs, null for bag/scarf
- `@repo/product-detail` — `buildOrderHrefWithVariants` appends length + size query params
- `@repo/product-detail` — `isVariantSelectionComplete` validates dress selection rules
- `apps/cms` — Products collection exposes `lengthVariants` and `sizes` with dress-only admin conditions

### Contract tests

- `GET /api/products/[slug]` includes `variantPickers` for dress fixture
- `GET /api/products/[slug]` returns `variantPickers: null` for bag fixture

### Integration tests

- None — CMS fetch stubbed at adapter boundary

### E2E

- None — covered by unit + contract + UI component tests

---

## Observability

| Signal | Type | Purpose |
|--------|------|---------|
| `product.detail.variant_pickers.missing` | log | Dress doc with empty CMS variant lists |
| `product.detail.variant_selection.incomplete` | metric | Client-side blocked CTA attempts (future) |

---

## Implementation notes

- Stack: Payload 3 (`apps/cms`), Next.js 15 (`apps/web`), `@repo/product-detail`
- Reuse `@repo/catalog` category constants; dresses = CMS value `robe`
- Order CTA for dresses is a client component that builds href with selected query params; disabled until complete
- Checkout slice (`whatsapp-checkout`) will read `length` and `size` query params — out of scope here but contract is stable
- No new runtime dependencies

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `product-detail--v0-pdp-gallery-and-copy` | Scope Slice | complete | Base PDP page |
| `cms-products` | Feature Area | pending | Owner edits variant fields in admin |
| `whatsapp-checkout` | Feature Area | pending | Consumes selection via order URL |
| `i18n-localization` | Feature Area | pending | Locale routing + copy |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Out of Scope

- Gallery, description, price display
- Checkout form and WhatsApp message assembly
- Inventory per size
- CMS admin UX for editing variants (cms-products slice)

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
