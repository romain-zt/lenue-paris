# Feature Area: Storefront Shell

## Status

`delivery-ready`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § v0 Feature set (Storefront shell)
- `docs/prd/PRD.md` § Flow Inventory
- `docs/prd/PRD.md` § MVP Completeness Checklist
- `docs/prd/PRD.md` § Design direction
- Related open questions: none
- Related product decisions: none

---

## Product Intent

Give buyers a cohesive, luxury editorial frame for Lénue Paris — navigation, hero, and footer that work on mobile first and carry the brand across every page. The shell is the consistent entry experience before catalogue or checkout.

---

## In Scope

- Site-wide navigation (catalogue, editorial, locale switcher placement)
- Footer with **Instagram** link (placeholder URL acceptable at launch)
- Hero / home landing treatment aligned with editorial design direction
- Typography wordmark **Lénue Paris** (accent on **é**)
- Mobile-first layout and touch-friendly navigation
- Shared layout wrapping buyer-facing pages

## Out of Scope

- Product listing logic (see `product-catalog`)
- Product detail or checkout flows
- CMS admin UI
- User accounts or login
- “Complete the look” modules
- Real Instagram URL requirement before launch (placeholder OK per PRD)

---

## Business Objects Touched

| Object | Relationship |
|--------|-------------|
| Editorial page | Linked from nav (routing only) |
| Product | Linked from nav to catalogue entry |

---

## User Journeys Touched

- Buyer: discover and order — steps 1 (land on lenue.paris)

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| `i18n-localization` | pending | Locale switcher and localized shell labels depend on tri-locale setup |
| PRD design direction | ready | Reference sites and photography assets documented |

---

## Risks

- Placeholder Instagram URL may need swap before public marketing push
- Wordmark-only brand (no logo file) may limit favicon/social preview treatment

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| `v0-mobile-shell` | Nav, footer, wordmark, Instagram placeholder, responsive layout | exploratory |
| `v0-home-hero` | Editorial home / landing hero using bootstrap photography direction | exploratory |

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

### Delivery Readiness

- [x] DR-01 — Status was `validated` prior to this transition
- [x] DR-02 — Every direct dependency Feature Area has a file in `docs/product/feature-areas/`
- [x] DR-03 — Every governing Product Decision is `approved`
- [x] DR-04 — No `NEED_HUMAN=true` on this FA or its direct dependencies
- [x] DR-05 — At least one child Scope Slice is `ready-for-user-stories`

**Verdict:** READY FOR VERTICAL DELIVERY

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Scaffolded from approved Feature Area Map (`/feature-area scaffold`) | — |
| 2026-06-14 | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |
| 2026-06-14 | Promoted to delivery-ready after CLEAR DR-01–DR-05 (`/feature-area clear-for-vertical`) | — |
