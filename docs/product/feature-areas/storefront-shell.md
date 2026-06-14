# Feature Area: Storefront Shell

## Status

`delivery-ready`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` §Product Surface
- `docs/prd/PRD.md` §v0 Feature set (Storefront shell row)
- `docs/prd/PRD.md` §Design direction
- `docs/prd/PRD.md` §Configuration Matrix (Brand name, Instagram)
- Related open questions: Q-003 (brand/wordmark), Q-007 (Instagram) — both answered
- Related product decisions: none

---

## Product Intent

A visitor who lands on lenue.paris is greeted by a consistent, editorial brand presence — the
Lénue Paris wordmark, clear navigation, an inviting hero, and a footer — on any device. The
shell makes the boutique feel curated and trustworthy from the first screen and gives every
other page a stable, branded frame.

---

## In Scope

- Persistent top navigation carrying the **Lénue Paris** typography wordmark (no standalone logo file)
- A home-page hero presentation using brand/editorial photography
- A footer containing the Instagram link (placeholder URL until the real handle is confirmed) and brand information
- Mobile-first, responsive page chrome (header + footer) shared across all storefront pages
- Navigation entries that lead to the catalogue and the editorial/brand page

## Out of Scope

- The catalogue grid and product listing behavior (Feature Area: Product Catalog)
- Product detail content and variant selection (Feature Area: Product Detail)
- The checkout flow (Feature Area: WhatsApp Checkout)
- The actual translation of chrome strings and locale switching mechanics (Feature Area: i18n)
- A standalone logo asset — none exists for v0; the wordmark is typographic only
- "Complete the look" buyer-facing modules (PRD deferred — §v0 Feature set)

---

## Business Objects Touched

| Object | Relationship |
|--------|-------------|
| Editorial page | Reads — the shell links to at least one brand/editorial page in nav/footer |
| Media | Reads — brand/editorial photography presented in the hero |

---

## User Journeys Touched

- Buyer: discover and order — step 1 (Land on lenue.paris in any locale)

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| none | ready | Foundational layer; the shell is the base frame other areas render within |

---

## Risks

- The brand has no logo file; the wordmark must read as premium through typography alone
- i18n is cross-cutting — chrome strings (nav labels, footer) must be localizable even though translation lives in the i18n area
- Instagram URL is a placeholder until the owner confirms the real profile

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| storefront-shell--global-chrome | Persistent nav, hero, and footer with the brand wordmark and Instagram link | exploratory |

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

- [x] DR-01 — Status was `validated` before this transition
- [x] DR-02 — No direct dependency Feature Areas declared (trivially satisfied)
- [x] DR-03 — No Product Decision governs this FA's contract; the PRD grounds all behavior
- [x] DR-04 — No `NEED_HUMAN=true` on this FA or any direct dependency
- [x] DR-05 — Child slice `storefront-shell--global-chrome` is `ready-for-user-stories`

**Verdict:** READY FOR VERTICAL DELIVERY

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Scaffolded from approved Feature Area Map (`/feature-area scaffold`) | — |
| 2026-06-14 | Promoted to validated after CLEAR readiness check (`/feature-area promote`) | — |
| 2026-06-14 | Promoted to delivery-ready after CLEAR DR-01–DR-05 (`/feature-area clear-for-vertical`) | — |
