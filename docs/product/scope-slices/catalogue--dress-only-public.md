# Scope Slice: Catalogue — Dress-only public (P1 + client #1–#2)

## Status

`ready-for-user-stories`

---

## User Value

Buyers see Lénue as a robe-only atelier: three signature dresses on home and catalogue, each with 2–3 distinct editorial frames — no sacs, foulards, or multimarque category noise.

---

## Exact Boundary

### Included

- Public CMS queries filter `category === 'dresses'` on catalogue, home featured, collections
- Seed publishes **robe-camille**, **robe-louise**, **robe-margot** with 2–3 unique `PHOTO-*` gallery bytes each
- Bags/scarfs and non-signature dresses seeded as **draft** (admin-only)
- Home featured carousel: three dress slugs only
- Remove sac/foulard category links from home strip and header (full four-link nav is slice 4)

### Excluded

- Nav four links (slice: `storefront-shell--nav-four-links`)
- À propos rewrite (slice: `editorial--a-propos-atelier`)
- Capsule badge (slice: `editorial--capsule-limited-series`)

---

## Allowlist

- `apps/web/src/lib/catalogue/storefrontCatalogue.ts`
- `apps/web/src/lib/cms/queries.ts`
- `apps/web/src/lib/cms/blocks.ts`
- `apps/web/src/lib/productImages.ts`
- `apps/web/src/seed.ts`
- `apps/web/src/components/product/CategoryFilter.tsx`
- `apps/web/src/components/Header.tsx`
- `apps/web/src/app/[locale]/page.tsx`

---

## Acceptance

- `/fr/catalogue` lists only dresses (≥3 signature slugs when seeded)
- Home featured carousel shows only dress tiles
- `npm run check:assets` → `collisions: 0`
- Bags/scarf product URLs return 404 on public storefront (draft in CMS)
