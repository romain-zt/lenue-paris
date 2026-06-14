# Scope Slice: v0 Buyer Locale Routing

## Parent Feature Area

[i18n Localization](../feature-areas/i18n-localization.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A buyer can use the site in French, English, or Russian and have their choice carried across pages, so the whole storefront speaks their language from day one.

---

## Exact Boundary

### Included Behavior

- Three buyer-facing locales: **fr** (primary), **en**, **ru** — all available at launch
- A locale switcher the buyer can use to change language
- The chosen locale persists as the buyer moves between pages
- Localized UI chrome / interface labels across buyer-facing pages
- A sensible default locale (fr) when none is chosen

### Excluded Behavior

- Localized product and editorial **content** entry by the owner (covered by `i18n-localization--v0-cms-localized-fields`)
- Additional locales beyond fr / en / ru
- Machine translation or auto-generated copy
- Locale-specific pricing or currency (EUR only)
- Separate domains per locale
- A phased rollout (all three ship together)

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Default locale | Buyer arrives with no prior choice | Site renders in French (primary) by default |
| Switch locale | Buyer uses the locale switcher | Interface re-renders in the chosen locale (fr / en / ru) |
| Persisted locale | Buyer navigates to another page | The previously chosen locale is retained |
| Unsupported request | Buyer requests an unsupported locale | The site falls back to the default locale gracefully |
| Active indicator | Locale switcher is shown | The current locale is clearly indicated |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Product | Read | Localized titles/descriptions surfaced in the active locale |
| Editorial page | Read | Localized body surfaced in the active locale |
| Order | Read | Localized checkout labels and buyer-facing order message |

---

## Credit / Payment Impact

None — locale routing changes language only, not pricing. Currency stays EUR across all locales.

---

## Sharing / Privacy Impact

None — locale preference is a display setting; it captures no buyer identity and exposes no shared surface.

---

## Feedback / Instrumentation Impact

None — no owner feedback prompt or attributable analytics event in v0 scope.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `storefront-shell` | Feature Area | pending | The locale switcher is positioned within the shell |
| PRD Product Surface | PRD reference | ready | Market/language resolved (fr primary, en + ru mandatory) |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

A buyer can switch the site between French, English, and Russian, the interface re-renders in the chosen language, the choice follows them across pages, and an unsupported locale falls back to French without breaking the experience.

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
