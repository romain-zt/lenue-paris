# Scope Slice: Selection UX — Primary CTA (P0.1)

## Parent Feature Area

[Selection UX](../feature-areas/selection-ux.md)

## Status

`ready-for-user-stories`

---

## User Value

On a product page, the buyer picks length/size if needed, taps one clear primary action to add the piece to their selection, and the panel opens — no name/phone form blocking the path.

---

## Exact Boundary

### Included

- Full-width primary **Ajouter à ma sélection** on `/produits/[slug]` after variant pickers
- Writes `{ slug, title, price, length?, size? }` to `SelectionProvider` and opens panel
- Remove buyer name/tel inputs from product hero; WhatsApp handoff only inside panel via **Continuer sur WhatsApp**
- Reuse `buildMultiPieceWhatsAppMessage` for variant lines

### Excluded

- List tile overlay (slice: `selection-ux--p0-list-overlay`)
- Drawer motion (slice: `selection-ux--p0-drawer-motion`)
- Dress-only catalogue filter (slice: `catalogue--dress-only-public`)

---

## Allowlist (implementation)

- `apps/web/src/components/product/OrderCTA.tsx`
- `apps/web/src/components/cms/ProductPageContent.tsx`
- `apps/web/src/components/selection/**`
- `apps/web/src/lib/selection/**`
- `apps/web/messages/{fr,en,ru}.json` (selection keys only)
- Tests under `apps/web/src/**/__tests__/**`

---

## Acceptance

- Product page shows no name/tel fields above the fold
- Primary button adds to selection and opens panel when variants satisfied
- `marketplace-grep` + **CMS-e** pass on diff
- `luxury-brand-gate --diff apps/web` exits 0

---

## Readiness

**Verdict:** READY FOR USER STORIES
