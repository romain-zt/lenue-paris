# Scope Slice: Global Chrome

## Parent Feature Area

[Storefront Shell](../feature-areas/storefront-shell.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A visitor sees a consistent, branded frame — the Lénue Paris wordmark, navigation, a home hero, and a footer — on every page and on any device.

---

## Exact Boundary

### Included Behavior

- A persistent header showing the **Lénue Paris** typography wordmark on every storefront page
- Primary navigation entries leading to the catalogue and the editorial/brand page
- A home-page hero presentation using brand/editorial photography
- A footer containing the Instagram link (placeholder URL) and brand information
- Responsive, mobile-first layout of header, hero, and footer
- A compact navigation treatment on small viewports

### Excluded Behavior

- The catalogue grid contents and category filtering (slice: product-catalog--category-grid)
- Product detail content (slice: product-detail--gallery-and-variants)
- Checkout (slice: whatsapp-checkout--order-save-and-handoff)
- Translation of chrome strings and locale switching mechanics (slice: i18n--localized-storefront)
- The editorial page content itself (slice: editorial--brand-page)
- A standalone logo asset (none exists for v0)

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Default | Any page loaded | Header with wordmark + nav, page content, footer with Instagram link |
| Loading | Hero/brand imagery still loading | A calm placeholder in the hero area until imagery appears |
| Media unavailable | Hero image fails to load | Hero falls back to the wordmark on a solid brand background; navigation still usable |
| Compact viewport | Narrow mobile width | Navigation condenses into a compact menu; touch targets stay large enough to tap |
| Placeholder Instagram | Real handle not yet confirmed | Instagram link is visible but points to the placeholder destination |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Media | Reads | Brand/editorial photography shown in the hero |
| Editorial page | Reads | Navigation/footer entry references the brand page |

---

## Credit / Payment Impact

None — no credit or payment interaction in this slice.

---

## Sharing / Privacy Impact

None — the chrome is public to every visitor and exposes no viewer-specific or private data.

---

## Feedback / Instrumentation Impact

None — this slice triggers no feedback prompt and produces no attributable buyer data. (Analytics is deferred from the v0 boundary.)

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| i18n--localized-storefront | Scope Slice | pending | Chrome strings must be localizable; translation lives in the i18n slice |
| editorial--brand-page | Scope Slice | pending | Nav/footer links to the editorial page once it exists |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

A visitor can open any storefront page and consistently see the Lénue Paris wordmark, working navigation to the catalogue and editorial page, a home hero, and a footer with the Instagram link, with the layout adapting cleanly from mobile to desktop.

---

## Readiness for User Stories

- [ ] User value stated without implementation language
- [ ] Exact boundary defined (included + excluded)
- [ ] UX states enumerated (including error and empty states)
- [ ] Business objects named
- [ ] Credit / payment impact assessed
- [ ] Sharing / privacy surface assessed
- [ ] Feedback / instrumentation impact assessed
- [ ] All dependencies named and their status known
- [ ] All blockers resolved or NEED_HUMAN=true explicitly set
- [ ] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** NOT READY

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Scaffolded from approved slice proposal (`/feature-area scaffold-slices`) | — |
| 2026-06-14 | Product-level sections completed (`/feature-area refine-slice`) | — |
