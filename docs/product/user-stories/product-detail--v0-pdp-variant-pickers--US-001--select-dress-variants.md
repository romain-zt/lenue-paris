# User Story: Select dress length and size

## Parent Scope Slice

[v0 PDP Variant Pickers](../scope-slices/product-detail--v0-pdp-variant-pickers.md)

## Status

`ready-for-spec`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a buyer viewing a dress, I want to choose its length and size before ordering, so that my order reflects exactly the variant I want.

---

## Acceptance Criteria

### AC-1 — Dress requires both choices

- **Given** I am on a dress detail page
- **When** I have not chosen both a length and a size
- **Then** I cannot proceed to order and I see that a choice is required

### AC-2 — Partial selection is blocked

- **Given** I am on a dress detail page
- **When** I have chosen only a length or only a size
- **Then** the order action stays unavailable and the missing choice is highlighted

### AC-3 — Complete selection carries forward

- **Given** I am on a dress detail page
- **When** I have chosen both a length and a size
- **Then** my choices are shown and ready to carry into the order handoff

### AC-4 — Bags and scarfs skip pickers

- **Given** I am on a bag or scarf detail page
- **When** the page has loaded
- **Then** I see no length or size picker and can proceed toward ordering without a size step

### AC-5 — Localized picker labels

- **Given** I switch the buyer locale
- **When** a dress detail page shows length and size pickers
- **Then** the picker labels appear in the active locale while size codes stay XS–XL

---

## UX States Covered

- Dress — no selection
- Dress — partial selection
- Dress — complete selection
- Bag / scarf
- Localized

---

## Out of Scope

- Gallery, description, and price display
- Checkout form and WhatsApp message assembly
- Free-text or custom size entry
- Stock-aware availability of specific sizes
- Owner overriding the default size set in CMS admin

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Product | Read | Length variants and size set for dresses |

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `product-detail--v0-pdp-gallery-and-copy` | Scope Slice | complete | Pickers sit on the same detail page |
| `cms-products` | Feature Area | pending | Variant data defined in CMS |
| `whatsapp-checkout` | Feature Area | pending | Selected variant flows into order handoff |
| `i18n-localization` | Feature Area | pending | Localized picker labels |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Readiness for Spec

- [x] Story traces to parent Scope Slice acceptance outcome
- [x] 2–5 ACs in Given/When/Then form without implementation language
- [x] UX States Covered references parent slice state names
- [x] Out of Scope matches parent exclusions
- [x] Data Touched matches parent slice
- [x] Dependencies named with status
- [x] No NEED_HUMAN blockers

**Verdict:** READY FOR SPEC

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Authored by orchestrator step agent | — |
