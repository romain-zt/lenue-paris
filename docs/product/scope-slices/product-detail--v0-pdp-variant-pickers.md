# Scope Slice: v0 PDP Variant Pickers

## Parent Feature Area

[Product Detail](../feature-areas/product-detail.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A buyer looking at a dress can choose its length and size before ordering, while bags and scarfs ask for no size — so the order carries exactly the variant the buyer wants.

---

## Exact Boundary

### Included Behavior

- Dress **length variant** selection (longer / shorter)
- Dress **size** selection from the fixed set (XS, S, M, L, XL) per Q-005
- No size or length picker for bags and scarfs
- The selected length and size are carried forward to the checkout / order handoff
- A required-selection state so a dress order cannot proceed without length and size chosen

### Excluded Behavior

- The gallery, description, and price display (covered by `product-detail--v0-pdp-gallery-and-copy`)
- The checkout form and WhatsApp message assembly (covered by `whatsapp-checkout--v0-checkout-and-wa-handoff`)
- Free-text or custom size entry
- Stock-aware availability of specific sizes (no inventory in v0)
- Owner overriding the default size set (handled in CMS, see `cms-products`)

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Dress — no selection | Dress detail page opens | Length and size options shown, none preselected; CTA indicates a choice is required |
| Dress — partial selection | Only length or only size chosen | The CTA is not yet actionable; the missing choice is highlighted |
| Dress — complete selection | Both length and size chosen | The chosen length and size are reflected and ready to carry to checkout |
| Bag / scarf | Bag or scarf detail page opens | No size or length picker; the buyer can proceed directly toward ordering |
| Localized | Buyer switches locale | Picker labels render in the active locale; size codes (XS–XL) stay constant |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Product | Read | Length variant and size set for the product |
| Order | Read (selection captured) | Chosen length + size are passed to the checkout handoff; no order written in this slice |

---

## Credit / Payment Impact

None — variant selection carries no pricing change or payment in v0.

---

## Sharing / Privacy Impact

None — selection state is local to the buyer's session; no shared or gated surface.

---

## Feedback / Instrumentation Impact

None — no owner feedback prompt or attributable event. Variant-selection analytics are out of v0 scope.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `product-detail--v0-pdp-gallery-and-copy` | Scope Slice | pending | Pickers sit on the same detail page |
| `cms-products` | Feature Area | pending | Length variants and size set defined per product in CMS |
| `whatsapp-checkout` | Feature Area | pending | Selected variant flows into the order handoff |
| `i18n-localization` | Feature Area | pending | Localized picker labels |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Acceptance-Level Outcome

A buyer on a dress page must choose a length and a size before they can proceed to order, those choices travel to the checkout handoff, and buyers on bags or scarfs proceed without any size step.

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
