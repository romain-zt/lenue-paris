# Feature Area: Selection UX (Maison Multi-Piece)

## Status

`delivery-ready`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Product Intent

A buyer browsing LÉNUE can build a small personal selection (up to three pieces), continue the conversation on WhatsApp with a pre-filled message listing each piece and chosen variants — invitation copy, not marketplace checkout.

---

## In Scope

- Primary “Ajouter à ma sélection” CTA on product detail (variants first, then add)
- Visible add-to-selection on catalogue/collection tiles
- Soft-animated selection panel (maison motion, not abrupt mount)
- “Continuer sur WhatsApp” as the only handoff from the panel
- Tri-locale copy (fr / en / ru), max 3 pieces enforced in code

---

## Out of Scope

- Cart icon, checkout, sticky buy bar, promo urgency
- Saving orders server-side before WhatsApp (existing order API may remain for single-piece legacy until dress-only repositioning)
- Payload schema changes (uses existing **Produits** only)

---

## Dependencies

| Dependency | Status |
|------------|--------|
| whatsapp-checkout--order-save-and-handoff | complete |
| i18n--localized-storefront | complete |
| luxury-brand-gate on `apps/web` diffs | complete |
