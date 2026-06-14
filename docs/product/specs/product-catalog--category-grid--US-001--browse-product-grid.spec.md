# Spec: Category Grid — Browse & Filter

## Parent User Story

[Browse Product Grid](../user-stories/product-catalog--category-grid--US-001--browse-product-grid.md)

> Also implements: [Filter by Category](../user-stories/product-catalog--category-grid--US-002--filter-by-category.md) — same UI surface, no separate spec warranted.

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Summary

Implements the `/catalogue` page in `apps/web`: a mobile-first product grid that fetches all published products from the Payload CMS REST API and renders them as cards (image + title + EUR price). A three-option category filter (dresses, bags, scarfs) narrows the visible cards client-side. Handles populated, loading, empty, filtered-empty, and error states.

---

## Acceptance Criteria Trace

| Parent AC | How this spec satisfies it | Notes |
|-----------|---------------------------|-------|
| US-001 AC-1 (grid shows all published products) | `/catalogue` page fetches published products and renders a `ProductCard` per item | |
| US-001 AC-2 (loading placeholders) | `<ProductCardSkeleton>` shown while data loads | |
| US-001 AC-3 (empty state) | Empty-state component shown when product list is empty | |
| US-001 AC-4 (error state) | Error boundary / error component shown on fetch failure, retry CTA | |
| US-001 AC-5 (tap opens detail page) | Each card links to `/produits/[slug]` | |
| US-002 AC-1 (category filter visible) | `<CategoryFilter>` renders Dresses / Bags / Scarfs buttons; default: all | |
| US-002 AC-2 (selecting category narrows grid) | Client-side filter on `product.category`; active category visually highlighted | |
| US-002 AC-3 (empty filtered state) | Empty-state component with category name when no products in category | |
| US-002 AC-4 (clearing filter restores all) | "All" option or deselecting active category resets to full list | |

---

## Data Model

### New / extended objects

**Product** (Payload CMS collection — `apps/cms`):

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Payload auto-generated |
| `title` | string (required) | Product name, i18n: fr + en |
| `slug` | string (required, unique) | URL-safe identifier |
| `category` | enum: `dresses` \| `bags` \| `scarfs` | Required |
| `price` | number (required) | EUR, displayed as `€X,XX` |
| `mainImage` | relationship → Media | Required, used on card |
| `_status` | `draft` \| `published` | Payload drafts plugin |

### Field-level constraints

- `slug` — auto-generated from `title` on save, unique index
- `price` — positive non-zero number; stored as integer cents or float (two decimal places)
- `mainImage` — required; must resolve to a media record with an uploaded image

### Migrations or schema changes

None — Payload 3 auto-syncs collection schema to the DB on startup; no manual migration file needed for new collections.

---

## Contract

### Inputs

- `GET /api/products?where[_status][equals]=published&limit=100` — Payload REST endpoint; returns paginated product list
- Query-param filter applied client-side on `category` field (no server-side filter needed for v0 catalogue size)

### Outputs

- `/catalogue` — rendered page with product grid + category filter
- `/produits/[slug]` — navigation target for each card (page implemented by product-detail slice, not this spec)

### Errors

| Error | When | User-visible message | Recovery |
|-------|------|---------------------|----------|
| Fetch failure (network / 5xx) | Payload API unreachable | "Impossible de charger le catalogue. Veuillez réessayer." | Retry button re-triggers fetch |
| Empty catalogue | No published products | "La collection arrive bientôt." | None needed; navigation usable |
| Empty category | Category has no published products | "Aucun article dans cette catégorie pour l'instant." | Filter reset link |
| Image missing | `mainImage` relation resolves to null | Fallback placeholder image shown | — |

---

## UI Surface

### Pages

- `apps/web/app/(storefront)/catalogue/page.tsx` — catalogue page (Next.js App Router)

### Components (under `apps/web/components/product/`)

| Component | Responsibility |
|-----------|---------------|
| `ProductGrid` | Responsive grid wrapper; receives product array + loading/error flags |
| `ProductCard` | Single product card: image, title, EUR price, link to detail |
| `ProductCardSkeleton` | Placeholder card for loading state |
| `CategoryFilter` | Dresses / Bags / Scarfs toggle buttons + All |
| `EmptyState` | Reusable empty / error message component |

### Responsive behaviour

- Mobile (≥320px): 2-column grid
- Tablet (≥768px): 3-column grid
- Desktop (≥1024px): 4-column grid
- Touch targets ≥ 44×44 px

---

## Async / Event / Webhook / Cron / Stream

- **Async:** Yes — product list is fetched via `fetch` in a Next.js Server Component (async RSC); no client-side async beyond navigation.
- **Event:** No — no event bus or pub/sub.
- **Webhook:** No — not in v0 scope.
- **Cron:** No.
- **Stream:** No.
- **Async classification:** Single async data fetch at render time (RSC); category filter is synchronous client-side state.

---

## Tests

### Unit

- `ProductCard` renders title, price formatted as `€X,XX`, and a link to `/produits/[slug]`
- `CategoryFilter` calls `onSelect` with correct category value when a button is clicked; "All" resets to `null`
- `EmptyState` renders the passed message string

### Integration

- `/catalogue` route: when Payload API returns 3 published products, all 3 cards render
- `/catalogue` route: when category "dresses" is selected, only dress products are shown
- `/catalogue` route: when category has no products, the empty-filtered-state message renders
- `/catalogue` route: when Payload API returns an error, the error state renders with a retry button
- `/catalogue` route: when Payload API returns an empty array, the empty-catalogue state renders

### Acceptance (Playwright — only if justified)

Not justified for this slice; integration tests cover all ACs.

---

## Observability

- None for v0 (analytics deferred per scope slice)
- Console error logged on fetch failure (development only)

---

## Implementation notes

- **Framework:** Next.js 15 App Router, React Server Components for the initial data fetch
- **CMS:** Payload 3 with Postgres (Neon) — Product collection defined in `apps/cms/src/collections/Products.ts`
- **Styling:** Tailwind CSS v4, mobile-first
- **Images:** Next.js `<Image>` component with S3 / MinIO media URL from Payload; `sizes` prop set for responsive grid columns
- **i18n:** Title displayed in the active locale (fr primary, en secondary); handled by i18n slice later — for v0, single-locale render is acceptable
- **No auth required** — catalogue is public
- **Category filter state:** React `useState` in a Client Component wrapper; URL search params can be added in a future iteration

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Monorepo scaffold (apps/web + apps/cms) | Infrastructure | pending | Must exist before code can be written |
| Payload CMS Product collection | Schema | pending | Defined in this spec; created in this step |
| storefront-shell--global-chrome | Scope Slice | pending | Page renders inside shared chrome; stub layout acceptable for v0 |

---

## Blockers

None.

---

## Out of Scope

- Product detail page (`/produits/[slug]`) — product-detail--gallery-and-variants slice
- CMS admin UI for creating products — cms-products--product-management slice
- Free-text search, multi-facet filters — deferred from v0
- Stock badges, inventory — v0 exclusion
- Analytics / tracking — v0 exclusion
- i18n locale switching — i18n--localized-storefront slice

---

## Readiness for Implementation

- [x] Summary traces back to the parent User Story
- [x] All parent ACs traced (satisfied here, or explicitly deferred)
- [x] Data model fields named with constraints
- [x] Contract inputs/outputs/errors enumerated
- [x] UI surface named or marked None with reason
- [x] Async / Event / Webhook / Cron / Stream — all 6 sub-questions answered
- [x] Tests section non-empty across unit and integration layers
- [x] Observability signals named with purpose
- [x] Implementation notes name stack and runtime constraints
- [x] All dependencies named with status
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Out of scope explicitly named

**Verdict:** READY FOR IMPLEMENTATION

---

## Tasks

Single-spec implementation — no `/task` subdivision needed.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Drafted and promoted to ready-for-implementation (autonomous orchestration) | — |
