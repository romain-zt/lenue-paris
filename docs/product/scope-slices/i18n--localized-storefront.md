# Scope Slice: Localized Storefront

## Parent Feature Area

[i18n](../feature-areas/i18n.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A buyer can use the whole storefront in French, English, or Russian and switch language whenever they want, so the boutique feels native to them.

---

## Exact Boundary

### Included Behavior

- All buyer-facing content presented in French (primary), English, and Russian
- A way for the buyer to choose or switch their language
- The chosen locale applied consistently across the shell, catalogue, product detail, editorial, and checkout
- The chosen locale persisting as the buyer navigates the site
- French shown as a fallback when a translation is missing

### Excluded Behavior

- Authoring the per-locale product and editorial copy (slices: cms-products--product-management, editorial--brand-page)
- Adding locales beyond fr / en / ru (only these three for v0)
- Currency localization — prices are EUR for all locales (PRD Configuration Matrix)
- Region/shipping localization (PRD v0 exclusion)
- Translating the owner-facing admin interface (this slice is buyer-facing)

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Default (fr) | First visit with no chosen locale | The storefront in French, the primary locale |
| Switched | The buyer picks en or ru | The interface and content re-render in the chosen language |
| Persisted | The buyer navigates after switching | The chosen locale stays applied across pages |
| Missing translation | Content lacks the active-locale copy | French (primary) copy is shown rather than a blank section |
| Loading | Locale content still loading | A brief in-progress indication until localized content appears |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Product | Reads | Presents localized product title/description per locale |
| Editorial page | Reads | Presents localized editorial copy per locale |

---

## Credit / Payment Impact

None — choosing or switching locale consumes no credits and involves no payment; prices remain EUR across all locales.

---

## Sharing / Privacy Impact

None — locale is a presentation choice over public content and exposes no private or viewer-specific data.

---

## Feedback / Instrumentation Impact

None — this slice triggers no feedback prompt and produces no attributable analytics. (Analytics is deferred from the v0 boundary.)

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| storefront-shell--global-chrome | Scope Slice | pending | The locale choice/switch surface lives in the shared chrome |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

A buyer can view the storefront in French by default, switch to English or Russian, and have that locale applied consistently and persistently across every buyer-facing surface, with French shown wherever a translation is missing.

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
