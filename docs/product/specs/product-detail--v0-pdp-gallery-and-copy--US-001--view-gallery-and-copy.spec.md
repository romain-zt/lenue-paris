# Spec: Product detail gallery and copy

## Parent User Story

[View product gallery and copy](../user-stories/product-detail--v0-pdp-gallery-and-copy--US-001--view-gallery-and-copy.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Summary

Implement the storefront product detail page that reads a single published product from Payload CMS by slug, renders a mobile-first gallery with localized title and description, shows EUR price, and exposes a primary CTA toward the order flow. Shared contracts live in `@repo/product-detail`; the web app exposes `GET /api/products/[slug]` and `/[locale]/products/[slug]`.

---

## Acceptance Criteria Trace

| Parent AC | How this spec satisfies it | Notes |
|-----------|---------------------------|-------|
| AC-1 | PDP UI + `ProductDetail` contract with name, description, price, gallery | |
| AC-2 | Client gallery component with thumbnail / main image selection | |
| AC-3 | Primary CTA links to `/[locale]/order/[slug]` | Checkout slice owns order page |
| AC-4 | Missing slug or `available: false` → not-found state with catalogue link | |
| AC-5 | Payload localized `name` + `description` for active locale; price always EUR | |

---

## Data Model

### New / extended objects

- `@repo/product-detail` — `ProductDetail`, `ProductGalleryImage`, `ProductDetailQuery`, `ProductDetailResponse`
- CMS `products` collection — existing; no schema change

### Field-level constraints

- `ProductDetail.price` — number ≥ 0
- `ProductDetail.currency` — literal `"EUR"`
- `ProductDetail.gallery` — ordered array; may be empty (missing media degrades gracefully)
- `ProductDetail.description` — plain text extracted from Payload richText; nullable

### Migrations or schema changes

None — existing `products` collection satisfies detail needs.

---

## Contract

### Inputs

- `GET /api/products/[slug]?locale={fr|en|ru}`
- Server-side fetch helper accepts `{ slug, locale }`

### Outputs

```json
{
  "product": {
    "id": "string",
    "slug": "string",
    "name": "string",
    "description": "string | null",
    "price": 0,
    "currency": "EUR",
    "category": "robe",
    "gallery": [
      { "id": "string", "url": "string", "alt": "string" }
    ],
    "orderHref": "/fr/order/example-slug",
    "catalogueHref": "/fr/catalogue"
  },
  "locale": "fr"
}
```

Not found:

```json
{
  "error": "product_not_found",
  "locale": "fr",
  "catalogueHref": "/fr/catalogue"
}
```

### Errors

| Error | When | User-visible message | Recovery |
|-------|------|---------------------|----------|
| 404 | Slug not found or product unavailable | Piece no longer available | Link back to catalogue |
| 400 | Invalid locale | — (fallback to `fr`) | Normalize server-side |
| 500 | CMS unreachable | Generic error state | Retry later |

---

## UI Surface

- `/[locale]/products/[slug]` — mobile-first PDP: gallery, title, price, description, order CTA
- States: default, gallery browsing, loading skeleton, missing media placeholder, not found, localized copy

---

## Async / Event / Webhook / Cron / Stream

### 1. Long-running operation

- No — sync CMS read for a single product.

### 2. External callback (webhook)

- No — no inbound webhooks for product detail.

### 3. Temporal trigger (cron)

- No — on-demand read at request/render time.

### 4. Event produced or consumed

- No — read-only public surface.

### 5. Real-time push to client (SSE / WebSocket)

- No — static between CMS publishes.

### 6. Background job / queue

- No — no async processing for detail view.

**Async classification:** Pure sync — no async patterns required, REST/server-component fetch sufficient.

---

## Tests

### Unit / behavior tests

- `@repo/product-detail` — richText → plain description extraction
- `@repo/product-detail` — gallery URL resolution from Payload images array
- `@repo/product-detail` — `toProductDetail` maps doc to contract with order + catalogue hrefs
- `@repo/product-detail` — unavailable or missing doc → not found

### Contract tests

- `GET /api/products/[slug]` returns `ProductDetailResponse` for fixture doc
- `GET /api/products/[slug]` returns 404 contract for missing slug

### Integration tests

- None at this layer — CMS fetch stubbed at adapter boundary

### E2E

- None — covered by contract + UI component tests

---

## Observability

| Signal | Type | Purpose |
|--------|------|---------|
| `product.detail.duration_ms` | metric | Detect slow CMS reads |
| `product.detail.error` | log | CMS fetch failures |
| `product.detail.not_found` | log | Track missing/archived slugs |

---

## Implementation notes

- Stack: Next.js 15 (`apps/web`), Payload 3 (`apps/cms`), shared `@repo/product-detail` package
- Reuse `@repo/catalog` for `SupportedLocale`, locale normalization, and detail href pattern
- Filter unavailable products (`available: false`) as not found
- Order CTA href targets checkout slice route; page may 404 until `whatsapp-checkout` slice lands
- No new runtime dependencies beyond workspace packages

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `product-catalog` | Feature Area | complete | Cards link to PDP |
| `cms-products` | Feature Area | pending | Product data in CMS |
| `storefront-shell` | Feature Area | pending | Page chrome |
| `i18n-localization` | Feature Area | pending | Locale routing |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Out of Scope

- Variant pickers, checkout form, related products, reviews, stock display, payment

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
