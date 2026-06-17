# User Story: Dress-only Public Catalogue

## Parent Scope Slice

[Catalogue — Dress-only public](../scope-slices/catalogue--dress-only-public.md)

## Status

`ready-for-spec`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a buyer visiting Lénue Paris, I see only the three signature dresses on the home page and catalogue — not bags or scarfs — so that the boutique feels focused and robe-centric from my very first visit.

---

## Acceptance Criteria

### AC-1 — Catalogue shows only dresses

- **Given** the buyer opens `/fr/catalogue`
- **When** the page loads
- **Then** only products with `category === 'dresses'` are visible; bags and scarfs are not listed

### AC-2 — Three signature dresses are always present

- **Given** the seed has run at least once
- **When** the buyer opens `/fr/catalogue`
- **Then** robe-camille, robe-louise, and robe-margot are each present with a title and image

### AC-3 — Home featured carousel shows only dresses

- **Given** the buyer is on the home page
- **When** the featured products carousel renders
- **Then** only the three signature dress tiles are shown; no bag or scarf tiles appear

### AC-4 — Bags and scarf URLs return 404

- **Given** the buyer tries to navigate directly to a bag or scarf product URL
- **When** the page renders
- **Then** a 404 / not-found state is returned because those products are draft-only in the CMS

### AC-5 — No sac/foulard links in home strip or header

- **Given** the buyer is on any public storefront page
- **When** they view the home category strip and the header navigation
- **Then** no links to "Sacs" or "Foulards" category pages are present

### AC-6 — Category filter shows only dresses

- **Given** the buyer is on the catalogue page
- **When** the category filter is displayed
- **Then** only "Tout" (all dresses) and "Robes" filter options are present

---

## Implementation Notes

- `storefrontCatalogue.ts`: `PUBLIC_DRESS_SLUGS` + `filterStorefrontProducts` are the single source of truth for what is public
- `seed.ts`: uses `isPublicStorefrontSlug` to set `_status: "published"` only for the three signature dresses; all others are `"draft"`
- `productImages.ts`: each signature dress has 2–3 unique `PHOTO-*` gallery entries
- `CategoryFilter.tsx`: renders only "Tout" + "Robes" — no bag/scarf filter
- `Header.tsx`: nav has no bag/scarf category links
- `page.tsx` (home): `categoryLinks` passes only `[{ href: "/catalogue" }]` to `HomeCategoryStrip`
