# Feature Area: CMS Products

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Core User Journeys (Owner: manage catalogue)
- `docs/prd/PRD.md` § Business Objects (Product, Media)
- `docs/prd/PRD.md` § v0 Feature set (CMS product management)
- `docs/prd/PRD.md` § Global Product Picture
- Related open questions: Q-004, Q-005, Q-012 (answered)
- Related product decisions: none

---

## Product Intent

Let the boutique owner manage the launch catalogue without developer help — create, edit, and archive dresses, bags, and scarfs with localized copy, EUR prices, images, dress length variants, and optional dress pairings stored in the data model.

---

## In Scope

- Owner CRUD for products (dress, bag, scarf categories)
- Localized title and description (fr/en/ru)
- EUR price field
- Media upload for product gallery
- Dress **length variants** (longer / shorter)
- Optional **related product** links (bag/scarf paired to dress) — data model only; no buyer-facing pairing UI in v0
- Archive / unpublish products

## Out of Scope

- Buyer-facing “complete the look” configuration UI beyond related-product links
- Inventory / stock tracking
- Multi-vendor catalogue
- Order management (see `whatsapp-checkout`)
- Bulk import tools
- Promotions or discount rules

---

## Business Objects Touched

| Object | Relationship |
|--------|-------------|
| Product | Create, read, update, archive |
| Media | Create, read — product images |

---

## User Journeys Touched

- Owner: manage catalogue and orders — step 2 (create/edit/archive products)

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| `i18n-localization` | pending | Localized field entry in admin |
| PRD Configuration Matrix | ready | Launch catalogue structure defined |

---

## Risks

- Tri-locale data entry for ~12 entities before launch
- Pairing relationships must be maintainable in admin even without buyer surfacing

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| `v0-product-crud` | Owner create/edit/archive products with price and media | exploratory |
| `v0-product-variants-and-pairings` | Length variants and optional related-product links in admin | exploratory |

---

## Readiness Verdict

- [x] PRD source sections read
- [x] Product intent stated without technical language
- [x] Business objects enumerated
- [x] User journeys identified
- [x] In-scope / out-of-scope explicitly separated
- [x] No unresolved PRD open questions affecting this area
- [x] Deferred behaviors explicitly named
- [x] Candidate Scope Slices are individually small enough

**Verdict:** READY FOR SCOPE SLICES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Scaffolded from approved Feature Area Map (`/feature-area scaffold`) | — |
| 2026-06-14 | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |
