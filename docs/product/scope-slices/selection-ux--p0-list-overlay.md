# Scope Slice: Selection UX — List Overlay (P0.2)

## Parent Feature Area

[Selection UX](../feature-areas/selection-ux.md)

## Status

`ready-for-user-stories`

---

## User Value

While browsing the catalogue or a collection, the buyer sees add-to-selection on each tile without opening the product page — Toteme cadence, not Amazon grid buttons.

---

## Exact Boundary

### Included

- `AddToSelectionButton` as bottom overlay on tile image (always visible ≤375px; hover fade ≥1280px)
- Quiet **Dans ma sélection** state when `isInSelection(slug)`
- Works on catalogue grid and collection product grid

### Excluded

- Primary CTA refactor on product page (prior slice)
- Drawer motion polish (next slice)

---

## Allowlist

- `apps/web/src/components/product/ProductCard.tsx`
- `apps/web/src/components/selection/AddToSelectionButton.tsx`
- `apps/web/src/app/[locale]/(storefront)/catalogue/**`
- `apps/web/src/app/[locale]/(storefront)/collections/**`
- Tests under `apps/web/src/**/__tests__/**`

---

## Acceptance

- Overlay visible on mobile without hover
- Selection state updates header pill count
- No cart/bag icon; `marketplace-grep` clean

---

## Readiness

**Verdict:** READY FOR USER STORIES
