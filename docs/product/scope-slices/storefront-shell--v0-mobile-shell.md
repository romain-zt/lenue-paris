# Scope Slice: v0 Mobile Shell

## Parent Feature Area

[Storefront Shell](../feature-areas/storefront-shell.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A buyer arriving on any page sees a consistent, mobile-first Lénue Paris frame — navigation, locale switcher, and footer — so they can move between catalogue, editorial, and the brand without losing orientation.

---

## Exact Boundary

### Included Behavior

- Site-wide top navigation linking to catalogue and the editorial page
- Typography wordmark **Lénue Paris** (accent on **é**) shown as the brand mark in the navigation
- Footer with an **Instagram** link (placeholder URL acceptable at launch)
- Placement of the locale switcher control within the shell (fr / en / ru)
- Mobile-first responsive layout with touch-friendly navigation targets
- A shared page frame that wraps every buyer-facing page (catalogue, product detail, editorial)

### Excluded Behavior

- The home / landing hero treatment (covered by `storefront-shell--v0-home-hero`)
- Catalogue listing and grid logic (covered by `product-catalog`)
- Product detail and checkout flows
- Locale routing and switching behavior itself (covered by `i18n-localization--v0-buyer-locale-routing`); this slice only positions the switcher
- CMS admin chrome
- A real Instagram profile URL before launch (placeholder is acceptable per PRD § Surface Blockers)

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Default | Any buyer page loads | Wordmark, navigation links, locale switcher, footer with Instagram link |
| Mobile (narrow viewport) | Viewport ≤ 375px | Collapsed / touch-friendly navigation; tap targets meet a comfortable minimum size |
| Navigation open | Buyer opens the mobile navigation | Catalogue + editorial links visible and tappable; current locale indicated |
| Placeholder link | Instagram URL not yet confirmed | Instagram link present pointing at a placeholder destination, visually identical to a final link |
| Active section | Buyer is on catalogue or editorial | The shell reflects the current section (active nav state) |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Editorial page | Read | Navigation links to the editorial page (routing only) |
| Product | Read | Navigation links toward the catalogue entry point (routing only) |

---

## Credit / Payment Impact

None — the shell carries no pricing, checkout, or payment interaction. v0 has no payment gateway.

---

## Sharing / Privacy Impact

None — the shell renders public navigation and a public Instagram link. It captures no buyer data and exposes no private or shared content.

---

## Feedback / Instrumentation Impact

None — no owner feedback prompt and no attributable buyer event originate from the shell. Page-level analytics are out of v0 scope.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `i18n-localization` | Feature Area | pending | Shell positions the locale switcher; switching behavior is owned by i18n |
| PRD design direction | PRD reference | ready | Reference sites and photography direction documented in PRD § Design direction |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

A buyer can open any buyer-facing page on a phone and see a coherent Lénue Paris frame — wordmark, navigation to catalogue and editorial, a locale switcher slot, and a footer with an Instagram link — with comfortable touch targets, and the frame stays consistent as they move between sections.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated (including error and empty states)
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Scaffolded from approved `/feature-area slice` proposal (`/feature-area scaffold-slices`) | — |
| 2026-06-14 | Product-level sections completed (`/feature-area refine-slice`) | — |
| 2026-06-14 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
