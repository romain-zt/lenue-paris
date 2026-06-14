# Feature Area: i18n Localization

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/prd/PRD.md` § Product Surface
- `docs/prd/PRD.md` § v0 Feature set (i18n fr + en + ru)
- `docs/prd/PRD.md` § Flow Inventory (Localized experience)
- `docs/prd/PRD.md` § Configuration Matrix (Locales)
- Related open questions: Q-002 (answered — fr/en/ru mandatory)
- Related product decisions: none

---

## Product Intent

Let the primary buyer — a Russian-speaking woman in France — use the site in **French, English, or Russian** from day one. All buyer-facing copy and owner-managed product/editorial content must be available in all three locales without a phased rollout.

---

## In Scope

- Three locales: **fr** (primary), **en**, **ru** — mandatory at launch
- Buyer-facing locale selection and persistence of locale preference across pages
- Localized product titles, descriptions, and editorial content surfaced on the storefront
- Localized checkout form labels and order-related buyer messages
- Owner can enter and maintain fr/en/ru content for catalogue and editorial pages in CMS

## Out of Scope

- Additional locales beyond fr/en/ru
- Machine translation or auto-generated copy
- Locale-specific pricing or currency (EUR only)
- Separate domains per locale
- Phased rollout (e.g. French first, Russian later)

---

## Business Objects Touched

| Object | Relationship |
|--------|-------------|
| Product | Localized fields (title, description) |
| Editorial page | Localized body content |
| Order | Localized checkout labels (buyer-facing) |

---

## User Journeys Touched

- Buyer: discover and order — steps 1–4 (any locale)
- Owner: manage catalogue and orders — step 2 (localized product/editorial entry)

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| PRD Product Surface | ready | Market/language resolved |
| `storefront-shell` | pending | Locale switcher lives in shell |

---

## Risks

- Tri-locale content entry burden on owner before launch (~12 products × 3 languages)
- Russian copy quality depends on owner or copywriter input

---

## Open Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| `v0-buyer-locale-routing` | fr/en/ru routing, switcher, localized UI chrome | exploratory |
| `v0-cms-localized-fields` | Owner enters product and editorial content in all three locales | exploratory |

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
