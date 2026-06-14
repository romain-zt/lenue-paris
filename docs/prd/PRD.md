# PRD — Lénue Paris

> Version: 0.1 · Status: discovery · Last updated: 2026-06-14

---

## Product

**Lénue Paris** is a curated online boutique selling dresses, bags, and foulards (scarfs).
The aesthetic is minimal and editorial — quality over quantity. Customers browse, fall in love
with a piece, and place an order via WhatsApp. No cart, no payment gateway, no account required.

**Domain:** lenue.paris  
**Languages:** French (primary), English, Russian — all mandatory at launch  
**Deployment:** Vercel  
**Brand:** Typography wordmark **Lénue Paris** (accent on **é**); no standalone logo file yet

---

## Problem

Small luxury fashion houses need a beautiful, brand-controlled online presence without the
overhead of full e-commerce infrastructure. Marketplaces dilute the brand; complex checkout
flows lose customers; managing a Shopify store is overkill for a curated collection.

---

## Solution (v0)

An editorial storefront where customers discover pieces and complete orders via WhatsApp —
personal, direct, human. The owner manages the catalogue and views orders from a CMS admin.
Payment and shipping logistics are handled manually in the WhatsApp conversation.

---

## Target user

- **Buyer:** Russian-speaking woman living in France, 25–45, fashion-conscious, comfortable
  ordering via WhatsApp. Uses **fr**, **en**, or **ru** on the site.
- **Owner/admin:** Boutique founder — needs to add/remove products and view orders without
  developer help.

---

## Product Surface

| Field | v0 value |
|-------|----------|
| Primary market / language | France-based buyer; **fr** primary, **en** + **ru** mandatory |
| Buyer entry point | Direct visit to **lenue.paris** |
| Buyer-facing surface | Editorial storefront (catalogue, product detail, checkout form) |
| Merchant operating surface | Payload CMS admin (products, orders) + WhatsApp (+79117126262) |
| Source of truth | CMS for catalogue and order records |
| Confirmation channel | WhatsApp conversation |
| Payment model | Listed **EUR** prices on site; settlement offline via WhatsApp (no payment gateway) |

### Surface Blockers

None blocking feature-area work. Deferred (non-blocking):

- Instagram profile URL — placeholder until real handle confirmed
- “Complete the look” buyer-facing UI — pairings in CMS only for v0 (see Business Objects)
- Shipping zones / fees — not enforced on-site; handled manually in WhatsApp

---

## Global Product Picture

Lénue Paris launches with a **curated, paired collection** (~12 product entities):

- **4 dresses**, each with **2 length variants** (longer / shorter)
- **4 bags** and **4 scarfs**, each **linked to a related dress** in CMS

v0 storefront uses the **fastest catalogue path**: flat category grid + product detail pages.
Product pairings exist in the data model but are **not surfaced** as “complete the look” modules
at launch.

---

## Operating Model

1. Owner publishes products (with price, images, localized copy, optional pairings) in CMS.
2. Buyer browses catalogue → opens product detail → selects **length** (dresses) and **size**
   (dresses: XS–XL fixed set; bags/scarfs: no size picker).
3. Buyer submits checkout → **order saved to CMS** → WhatsApp opens with pre-filled message
   (product, variants, price).
4. Owner fulfills order via WhatsApp (payment, shipping, logistics — all manual).

---

## Core User Journeys

### Buyer: discover and order

1. Land on lenue.paris (any locale: fr / en / ru).
2. Browse catalogue (filter by category).
3. View product detail (gallery, description, EUR price, length + size where applicable).
4. Submit order → CMS record created → WhatsApp deep-link with order summary.
5. Complete payment and delivery details in WhatsApp with owner.

### Owner: manage catalogue and orders

1. Log into CMS admin.
2. Create/edit/archive products (localized fr/en/ru, price, images, length variants, pairings).
3. View incoming orders saved at checkout.
4. Respond and fulfill via WhatsApp.

---

## Business Objects

| Object | v0 scope |
|--------|----------|
| **Product** | Dress, bag, or scarf; localized title/description; EUR price; images; category; dress **length variant** (longer/shorter); optional **related products** (pairing); size set for dresses only |
| **Order** | Created at checkout before WhatsApp handoff; line item, variants, price; buyer contact as captured on form |
| **Media** | Product and editorial photography |
| **Editorial page** | At least one brand/editorial page (e.g. About) |

---

## v0 Feature set

| Flow | v0 | Notes |
|------|:--:|-------|
| Storefront shell (nav, footer, hero) | ✅ | Mobile-first; typography wordmark; Instagram link (placeholder URL) |
| Product catalogue listing | ✅ | Flat grid, filter by category |
| Product detail page | ✅ | Gallery, description, EUR price, length + size picker (dresses) |
| WhatsApp checkout | ✅ | CMS order save first, then pre-filled WA deep-link |
| CMS product management | ✅ | Payload admin — create/edit/archive; pairings in data model |
| CMS order viewing | ✅ | Orders persisted at checkout |
| Editorial / brand pages | ✅ | At least 1 editorial page |
| i18n (fr + en + ru) | ✅ | All buyer-facing content localized |
| “Complete the look” buyer UI | ❌ | Deferred — pairings CMS-only for v0 |
| On-site shipping zones | ❌ | Manual in WhatsApp |
| Real payment processing | ❌ | Out of v0 |
| User accounts / wishlist | ❌ | Out of v0 |
| Email notifications | ❌ | Out of v0 |
| Inventory management | ❌ | Out of v0 |

---

## Flow Inventory

| Flow | v0 |
|------|:--:|
| Browse catalogue & discover products | ✅ |
| View product detail, price, length & size | ✅ |
| Place order (CMS save + WhatsApp) | ✅ |
| Admin: manage products in CMS | ✅ |
| Admin: view orders in CMS | ✅ |
| Brand / editorial page | ✅ |
| Localized experience (fr / en / ru) | ✅ |

---

## Configuration Matrix

| Key | v0 value |
|-----|----------|
| Brand name | Lénue Paris |
| WhatsApp orders | +79117126262 |
| Currency | EUR (assumed) |
| Locales | fr (primary), en, ru |
| Dress sizes | XS, S, M, L, XL (fixed set) |
| S3 region (prod) | eu-west-3 (Paris) |
| Instagram | Placeholder URL until confirmed |
| Launch catalogue | 4 dresses × 2 lengths + 4 bags + 4 scarfs (paired in CMS) |

---

## Integration Boundaries

| Boundary | Role in v0 |
|----------|------------|
| **WhatsApp** | Order conversation channel; deep-link with pre-filled message to +79117126262 |
| **Payload CMS** | Product catalogue, orders, media, editorial content; admin UI for owner |
| **Postgres (Neon)** | CMS data store |
| **S3 / MinIO** | Product and editorial media (S3 eu-west-3 prod; MinIO local dev) |
| **Vercel** | Hosts storefront and CMS |

Out of v0: payment gateways, email providers, shipping APIs, inventory systems.

---

## MVP Completeness Checklist

- [ ] Storefront live on lenue.paris with fr / en / ru
- [ ] Typography wordmark **Lénue Paris** in shell
- [ ] Launch catalogue (~12 entities) with EUR prices visible
- [ ] Dress PDP: length variant + size picker
- [ ] Checkout saves order to CMS, then opens WhatsApp
- [ ] Owner can add a product without developer help
- [ ] Owner can view orders in CMS admin
- [ ] At least one editorial page
- [ ] Instagram link in footer (placeholder OK)
- [ ] Mobile Lighthouse score ≥ 90

### Open before implementation-readiness

- Real Instagram URL (placeholder sufficient for build)
- Exact size list confirmation if not XS–XL (default assumed)

---

## Design direction

Reference sites (customer-loved):

- [Rouje](https://www.rouje.com) — warm, feminine, editorial photography
- [Loro Piana](https://fr.loropiana.com) — luxury restraint, generous whitespace
- [The Row](https://www.therow.com) — extreme minimalism, typography-forward
- [Dôen](https://www.shopdoen.com) — soft, natural, lifestyle photography

Photography assets: `lenue-assets-bootstrap/pics/` (14 reference photos).

**Design principles:** ample whitespace · muted palette · strong typography · full-bleed photography · mobile-first.

---

## Success metrics (v0)

- Launch catalogue live (~12 curated products)
- Order placed via WhatsApp within 24h of launch
- Admin can add a new product without developer help
- Mobile Lighthouse score ≥ 90

---

## Risks & Assumptions

- **EUR currency** assumed from France-based ICP — confirm before content entry if different
- **Instagram URL** is placeholder until owner supplies real profile
- **XS–XL size set** assumed for dresses — owner may override
- **Pairing UX deferred** — data model supports pairings; buyer-facing surfacing post-v0
- **Shipping** not validated on-site — owner handles case-by-case in WhatsApp
- Order must persist even if buyer does not send the WhatsApp message after tap

---

## Open questions

See `docs/prd/questions/open-questions.md` — all discovery questions answered (Q-001–Q-012).

---

## v0 boundary (exclusions)

- Real payment processing (Stripe, etc.)
- User accounts and authentication
- Persistent cart
- Email notifications
- Inventory / stock tracking
- Multi-vendor
- On-site shipping zone selection or fee calculation
- “Complete the look” buyer-facing modules
- Any surface not listed in the Flow Inventory above
