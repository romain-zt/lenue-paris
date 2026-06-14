# Spec: Category grid catalogue listing

## Parent User Story

[Browse and filter the launch catalogue](../user-stories/product-catalog--v0-category-grid--US-001--browse-and-filter-grid.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Summary

Implement the storefront catalogue grid that reads published products from Payload CMS, filters by category (dress / bag / scarf), renders localized card data with EUR prices, and links each card to the product detail route. Shared contracts live in `@repo/catalog` so the web app and CMS stay aligned on category values and list response shape.

---

## Acceptance Criteria Trace

| Parent AC | How this spec satisfies it | Notes |
|-----------|---------------------------|-------|
| AC-1 | `GET /api/catalog` + grid UI render `ProductCard[]` with image, name, price | |
| AC-2 | `category` query param filters CMS `products.category` | Maps dress→robe, bag→sac, scarf→foulard |
| AC-3 | Each `ProductCard.detailHref` links to `/[locale]/products/[slug]` | PDP slice owns page content |
| AC-4 | Empty category returns `products: []`; UI shows empty-category state | |
| AC-5 | Payload localized `name` resolved for active locale (fr/en/ru) | Price always EUR |

---

## Data Model

### New / extended objects

- `@repo/catalog` — `ProductCategoryFilter`, `ProductCategoryCms`, `ProductCard`, `CatalogListQuery`, `CatalogListResponse`
- CMS `products` collection — existing; no schema change (categories: robe, sac, foulard, autre)

### Field-level constraints

- `ProductCard.price` — number ≥ 0
- `ProductCard.currency` — literal `"EUR"`
- `ProductCard.thumbnailUrl` — nullable string (first image URL or null)
- `ProductCategoryFilter` — `all` | `dress` | `bag` | `scarf`

### Migrations or schema changes

None — existing `products` collection satisfies listing needs.

---

## Contract

### Inputs

- `GET /api/catalog?category={all|dress|bag|scarf}&locale={fr|en|ru}`
- Server-side catalogue fetch helper accepts `CatalogListQuery`

### Outputs

```json
{
  "products": [
    {
      "id": "string",
      "slug": "string",
      "name": "string",
      "price": 0,
      "currency": "EUR",
      "category": "robe",
      "thumbnailUrl": "string | null",
      "detailHref": "/fr/products/example-slug"
    }
  ],
  "category": "all",
  "locale": "fr"
}
```

### Errors

| Error | When | User-visible message | Recovery |
|-------|------|---------------------|----------|
| 400 | Invalid `category` or `locale` | — (fallback to defaults server-side) | Use `all` + `fr` |
| 500 | CMS unreachable | Generic catalogue error state | Retry / check back later |

---

## UI Surface

- `/[locale]/catalogue` — category filter chips + responsive product grid
- States: populated, filtered, empty category, empty catalogue, loading skeletons

---

## Async / Event / Webhook / Cron / Stream

### 1. Long-running operation

- No — sync CMS read; launch catalogue ~12 items.

### 2. External callback (webhook)

- No — no inbound webhooks for catalogue listing.

### 3. Temporal trigger (cron)

- No — on-demand read at request/render time.

### 4. Event produced or consumed

- No — read-only public surface.

### 5. Real-time push to client (SSE / WebSocket)

- No — polling-on-render acceptable in v0; catalogue is static between CMS publishes.

### 6. Background job / queue

- No — no async processing for listing.

**Async classification:** Pure sync — no async patterns required, REST/server-component fetch sufficient.

---

## Tests

### Unit / behavior tests

- `@repo/catalog` — category filter ↔ CMS value mapping
- `@repo/catalog` — `toProductCard` maps Payload doc to `ProductCard` with localized name and detail href
- `@repo/catalog` — invalid category filter rejected or normalized

### Integration tests

- Catalogue fetch against Payload local API (when CMS route exists) returns filtered products

### Acceptance tests against parent ACs

- Contract test: `CatalogListResponse` shape matches spec for sample fixture
- Filter `dress` excludes `sac` and `foulard` products

### Non-functional tests (performance, security, accessibility)

- None at contracts layer — grid a11y covered in UI task

---

## Observability

| Signal | Type | Purpose |
|--------|------|---------|
| `catalog.list.duration_ms` | metric | Detect slow CMS reads |
| `catalog.list.error` | log | CMS fetch failures |

---

## Implementation notes

- Stack: Next.js 15 (`apps/web`), Payload 3 (`apps/cms`), shared `@repo/catalog` package
- Category mapping: buyer filters use English keys; CMS stores French select values
- Locales: `fr` (default), `en`, `ru` per PRD; Next i18n routing deferred to `i18n-localization` slice — contracts accept all three
- No new dependencies beyond workspace packages

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `cms-products` | Feature Area | pending | Products in CMS |
| `storefront-shell` | Feature Area | pending | Page chrome |
| `i18n-localization` | Feature Area | pending | Locale routing |
| `product-detail` | Feature Area | pending | PDP target routes |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Out of Scope

- Pairing modules, search, sort, cart, wishlist, stock indicators, pagination

---

## Readiness for Implementation

- [x] Summary traces back to the parent User Story
- [x] All parent ACs traced (satisfied here, or explicitly deferred)
- [x] Data model fields named with constraints
- [x] Contract inputs/outputs/errors enumerated
- [x] UI surface named or marked None with reason
- [x] Async section complete with classification
- [x] Tests section non-empty across unit, integration, and acceptance layers
- [x] Observability signals named with purpose
- [x] Implementation notes name stack and runtime constraints
- [x] All dependencies named with status
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Out of scope explicitly named

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
