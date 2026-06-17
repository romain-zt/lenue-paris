# Scope Slice: Storefront — Broken links audit (client #3)

## Status

`ready-for-user-stories`

---

## User Value

Buyers never hit dead product fiches or legacy sac/foulard URLs — only the three signature robes resolve on `/produits/[slug]`.

---

## Exact Boundary

### Included

- Product detail route returns 404 for non-public slugs when not in draft preview (`isPublicStorefrontSlug`)
- Legacy `?categorie=sacs|foulards` catalogue URLs show all robes (null filter), not empty grids
- `robe-margot` third gallery frame — unique `PHOTO-*` byte
- Unit tests: link parity for `PUBLIC_DRESS_SLUGS`, category param retirement
- Honest `status-events` reset: `orch-catalogue--dress-only-public` → `complete`

### Excluded

- Nav four links (#7) — `storefront-shell--nav-four-links`
- Livraison / Contact pages (created in nav slice)
- Sitemap.xml (follow-up if needed)

---

## Allowlist

- `apps/web/src/app/[locale]/(storefront)/produits/[slug]/page.tsx`
- `apps/web/src/lib/catalogueCategory.ts`
- `apps/web/src/lib/productImages.ts`
- `apps/web/src/lib/catalogue/__tests__/storefrontLinks.test.ts`
- `apps/web/src/lib/__tests__/catalogueCategory.test.ts`
- `docs/state/status-events.ndjson`

---

## Acceptance

- [ ] `/produits/sac-celeste` → 404 on published storefront (draft preview still works in admin)
- [ ] `/catalogue?categorie=sacs` shows three robes, not empty state
- [ ] `pnpm --filter web test` green
- [ ] `npm run luxury-gate -- --check-assets` → `asset_duplicate_hash: 0`
