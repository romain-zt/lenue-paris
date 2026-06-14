# Spec: Category Grid — Browse and Filter

## Parent User Story

[Browse and Filter the Product Catalogue](../user-stories/product-catalog--category-grid--US-001--browse-and-filter.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Summary

This spec implements the product catalogue page: a Payload CMS `products` collection that exposes published products via REST, and a Next.js page that renders those products in a responsive grid with a category filter (dresses / bags / scarfs). All six UX states from the parent User Story are covered.

---

## Acceptance Criteria Trace

| Parent AC | How this spec satisfies it | Notes |
|-----------|---------------------------|-------|
| AC-1 — Populated grid | `ProductGrid` fetches published products from Payload REST API and renders `ProductCard` for each | Server-side fetch; cards show image, title, EUR price |
| AC-2 — Category filter | `CategoryFilter` component renders three buttons; selecting one passes `category` query param; grid re-renders with only matching products | Client component; URL state via `useSearchParams` |
| AC-3 — Empty state | When fetch returns 0 docs, render `EmptyState` message | Calm, non-breaking message |
| AC-4 — Loading state | `Suspense` boundary with `ProductCardSkeleton` grid while data loads | React Suspense + skeleton cards |
| AC-5 — Error state | `error.tsx` boundary renders retry message with nav still mounted in `layout.tsx` | Next.js `error.tsx` segment |
| AC-6 — Navigation | Each `ProductCard` is an `<a href="/products/[slug]">` link | Href only — detail page is a future slice |

---

## Data Model

### New objects

**`products` Payload collection** — `apps/cms/src/collections/Products.ts`

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| `title` | text | yes (fr, en) | required |
| `slug` | text | no | required; unique |
| `category` | select | no | enum: `dresses` \| `bags` \| `scarfs`; required |
| `price` | number | no | EUR cents stored as integer (e.g. 12900 = €129.00) |
| `images` | array > upload (media) | no | min 1 image; first image used on card |
| `_status` | — | — | Payload draft/publish system field (versions: { drafts: true }) |

### Field-level constraints

- `slug` must match `^[a-z0-9-]+$`; auto-generated from `title` in fr locale if blank
- `price` must be a positive integer
- `category` is required; no default

### Migrations or schema changes

Payload auto-generates the Postgres table via `postgresAdapter` on first startup. No manual migration script needed.

---

## Contract

### REST endpoint consumed by `apps/web`

```
GET {CMS_URL}/api/products
  ?where[_status][equals]=published
  &locale=fr        (or en, varies by active locale)
  &depth=1          (resolve media relation for image URL)
  &limit=100
```

**Response shape** (subset — only fields used by the grid):

```ts
{
  docs: Array<{
    id: string;
    title: string;          // localized
    slug: string;
    category: "dresses" | "bags" | "scarfs";
    price: number;          // EUR cents
    images: Array<{
      image: {
        url: string;
        alt: string;
        width: number;
        height: number;
      };
    }>;
  }>;
  totalDocs: number;
}
```

### Errors

| Scenario | Behaviour |
|----------|-----------|
| CMS unreachable | `fetch` throws → Next.js `error.tsx` renders |
| `res.ok === false` | Treated as empty list (graceful degradation) |
| 0 products returned | `EmptyState` rendered; no error |

---

## UI Surfaces

All new files live under `apps/web/src/`.

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout (html, body, minimal chrome) |
| `app/page.tsx` | Server component — fetches products, passes to grid |
| `app/error.tsx` | Error boundary — gentle retry message |
| `components/CategoryFilter.tsx` | Client component — filter buttons (All / Dresses / Bags / Scarfs) |
| `components/ProductCard.tsx` | Product card — image, title, EUR price, link to `/products/[slug]` |
| `components/ProductCardSkeleton.tsx` | Placeholder card for Suspense loading state |
| `components/ProductGrid.tsx` | Grid layout wrapper |

**Grid layout:** CSS Grid, 2 columns on mobile (≥320px), 3 on tablet (≥768px), 4 on desktop (≥1280px). Tailwind CSS.

---

## Tests

### Unit tests (`apps/cms/src/collections/Products.test.ts`)

- Schema shape: all required fields present and typed correctly
- `category` select: only `dresses`, `bags`, `scarfs` are valid values
- `price` field: positive integer enforced

### Contract tests (`apps/web/src/__tests__/products-api.contract.test.ts`)

- Given a mock CMS response with the documented shape, `getProducts()` returns the correct typed array
- Given `res.ok === false`, `getProducts()` returns `[]`

### Integration note

Full integration (real Payload + Postgres) is deferred — no local infra is pre-configured in CI. Unit + contract tests cover the Spec's contract table. A manual smoke test against `docker compose up` is documented in `BOOTSTRAP.md`.

### E2E

None — AC-1 through AC-6 are fully covered by unit and contract tests, and there is no revenue journey on this read-only page.

---

## Implementation Notes

- Tailwind CSS added to `apps/web` as the only new dependency (already assumed in `40-architecture-baseline.mdc` for Next.js projects).
- `CMS_URL` environment variable read from `.env.local`; falls back to `http://localhost:3000`.
- `depth=1` on the Payload query resolves the `images[].image` upload relation so `url` is available without a second request.
- The `storefront-shell--global-chrome` slice (pending) will extend `apps/web/src/app/layout.tsx` with the shared nav/footer. This spec leaves `layout.tsx` minimal intentionally.

---

## Readiness for Implementation

- [x] Summary traces to parent User Story outcome
- [x] All ACs traced and satisfied
- [x] Data model fully specified (new fields named, constraints stated, migration addressed)
- [x] Contract specified (HTTP route, request, response, error table)
- [x] UI surfaces listed (file-level)
- [x] Tests listed per `30-test-strategy.mdc` (unit + contract; e2e justified as none)
- [x] No NEED_HUMAN blockers
- [x] Implementation notes address stack choices

**Verdict:** READY FOR IMPLEMENTATION

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Derived from US-001 by orchestrator; promoted to ready-for-implementation | — |
