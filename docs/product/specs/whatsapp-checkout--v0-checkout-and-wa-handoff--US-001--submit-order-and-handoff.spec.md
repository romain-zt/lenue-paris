# Spec: Checkout form, CMS order save, and WhatsApp handoff

## Parent User Story

[Submit order and hand off to WhatsApp](../user-stories/whatsapp-checkout--v0-checkout-and-wa-handoff--US-001--submit-order-and-handoff.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Summary

Deliver the v0 checkout slice: order page from PDP CTA, minimal buyer fields, persist order to Payload **before** WhatsApp handoff, localized labels and pre-filled message (fr/en/ru), confirmation and fallback when WhatsApp cannot open. Layer 1 extends the CMS `orders` schema; later layers add `@repo/checkout` contracts, POST `/api/orders`, checkout UI, and tests.

---

## Acceptance Criteria Trace

| Parent AC | How this spec satisfies it | Notes |
|-----------|---------------------------|-------|
| AC-1 | Order page loads product by slug; pre-fills length/size from query params | Dress variants from PDP |
| AC-2 | Client POST `/api/orders` completes before `window.location` / WA deep-link | Dual-write ordering |
| AC-3 | `buildWhatsAppHandoffUrl` encodes product, variants, EUR price to +79117126262 | Env-configurable number |
| AC-4 | Success UI after 201 from orders API | |
| AC-5 | On WA open failure, show number + `wa.me` link; order already saved | |
| AC-6 | Zod validation on API + inline form errors | name + phone required |
| AC-7 | Handoff only after successful save; 5xx shows retry | |
| AC-8 | `@/lib/checkout-copy` per locale; message template localized | |

---

## Data Model

### New / extended objects

- CMS `orders` collection — add `length` (dress variant), `priceEur` (snapshot at checkout), `locale` (buyer locale)
- `@repo/checkout` (layer 2) — order create input/output types, WA message builder

### Field-level constraints

- `orders.customerName` — required text (existing)
- `orders.customerPhone` — required text (existing)
- `orders.customerEmail` — optional email (existing)
- `orders.product` — required relationship to `products` (existing)
- `orders.size` — optional text; required semantically for dress orders at API layer
- `orders.length` — optional text; `"longer" | "shorter"` when dress
- `orders.priceEur` — required number; EUR, copied from product at submit time
- `orders.locale` — optional select `fr | en | ru`
- `orders.message` — optional textarea; stores localized WA prefill for admin reference
- `orders.status` — default `new` (existing)

### Migrations or schema changes

- Payload `orders` collection: add `length`, `priceEur`, `locale`. Payload push on next CMS boot.

---

## Contract

### Inputs

- `GET /[locale]/order/[slug]?length=&size=` — checkout page (layer 5)
- `POST /api/orders` — JSON body:

```json
{
  "customerName": "Anna",
  "customerPhone": "+33612345678",
  "customerEmail": "anna@example.com",
  "productSlug": "robe-lin",
  "locale": "fr",
  "length": "longer",
  "size": "M"
}
```

### Outputs

- `201` — `{ "id": "<orderId>", "whatsappUrl": "https://wa.me/79117126262?text=..." }`
- `400` — validation errors `{ "errors": [{ "field": "customerPhone", "message": "..." }] }`
- `404` — unknown product slug
- `500` — save failure `{ "error": "order_save_failed" }`

### Errors

| Error | When | User-visible message | Recovery |
|-------|------|---------------------|----------|
| validation_error | Missing name/phone or dress missing length/size | Inline field guidance | Fix fields |
| product_not_found | Unknown slug | Product unavailable | Return to catalogue |
| order_save_failed | Payload create fails | Retry message | Retry submit |
| whatsapp_unavailable | Browser blocks custom URL scheme | Confirmation + manual WA link | Tap link or copy number |

---

## UI Surface

- `/[locale]/order/[slug]` — checkout form, product summary, submit CTA
- States: form ready, submitting, saved + handoff, WA unavailable, validation error, save failure, localized

---

## Async / Event / Webhook / Cron / Stream

### 1. Long-running operation

- No — sync POST + client redirect.

### 2. External callback (webhook)

- No.

### 3. Temporal trigger (cron)

- No.

### 4. Event produced or consumed

- No.

### 5. Real-time push to client (SSE / WebSocket)

- No.

### 6. Background job / queue

- No.

**Async classification:** Pure sync REST — POST persists order then returns WhatsApp URL; client opens WA. No async patterns required.

---

## Tests

### Unit / behavior tests

- `apps/cms` — Orders collection exposes `length`, `priceEur`, `locale` with constraints
- `@repo/checkout` — `buildWhatsAppMessage` includes product, variants, EUR price per locale
- `@repo/checkout` — `validateOrderInput` enforces dress length+size, name, phone

### Contract tests

- `POST /api/orders` — 201 with `whatsappUrl` for valid dress order fixture
- `POST /api/orders` — 400 when dress missing length or size
- `POST /api/orders` — 404 for unknown slug

### Integration tests

- None in v0 — Payload adapter stubbed at route boundary

### E2E

- None — covered by unit + contract + checkout component tests

---

## Observability

| Signal | Type | Purpose |
|--------|------|---------|
| `checkout.order.create.success` | metric | Orders persisted |
| `checkout.order.create.failure` | metric | Payload write errors |
| `checkout.whatsapp.handoff.failure` | log | Client could not open WA URL |

---

## Implementation notes

- Stack: Payload 3 (`apps/cms`), Next.js 15 (`apps/web`), new `@repo/checkout` package
- WhatsApp number default `79117126262` (no + in wa.me path); override via `WHATSAPP_ORDER_NUMBER` env
- Order save **must** complete before returning `whatsappUrl` to client
- Reuse `@repo/product-detail` variant codes for dress validation
- Layer order: schema → contracts → domain → API → UI → tests + state

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `product-detail--v0-pdp-variant-pickers` | Scope Slice | complete | Query params on order URL |
| `cms-products` | Feature Area | pending | Product price source |
| `i18n-localization` | Feature Area | pending | Locale routing |
| `storefront-shell` | Feature Area | pending | Shared layout |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| none | — | false |

---

## Out of Scope

- CMS admin order list (separate slice)
- Payment gateway, cart, email, inventory

---

## Readiness for Implementation

- [x] Summary traces back to the parent User Story
- [x] All parent ACs traced
- [x] Data model fields named with constraints
- [x] Contract inputs/outputs/errors enumerated
- [x] UI surface named
- [x] Async section complete with classification
- [x] Tests section non-empty
- [x] Observability signals named
- [x] Implementation notes name stack constraints
- [x] Dependencies named with status
- [x] All blockers resolved

**Verdict:** READY FOR IMPLEMENTATION

---

## Tasks (optional)

| Task | Path | Status |
|------|------|--------|
| — | — | Direct implementation (no task subdivision) |

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-14 | Authored by orchestrator step agent | — |
