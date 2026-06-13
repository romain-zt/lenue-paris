# PRD — Lenue Paris

> Version: 0.1 · Status: discovery · Last updated: 2026-06-13

---

## Product

Lenue Paris is an online boutique selling a curated selection of dresses, bags, and foulards.
The aesthetic is minimal and editorial — quality over quantity. Customers browse, fall in love
with a piece, and place an order via WhatsApp. No cart, no payment gateway, no account required.

**Domain:** lenue.paris  
**Primary language:** French (secondary: English)  
**Deployment:** Vercel  

---

## Problem

Small luxury fashion houses need a beautiful, brand-controlled online presence without the
overhead of full e-commerce infrastructure. Marketplaces dilute the brand; complex checkout
flows lose customers; managing a Shopify store is overkill for a curated 20–50 piece collection.

---

## Solution (v0)

A stunning editorial storefront where customers discover pieces and complete orders via
WhatsApp — personal, direct, human. The owner manages the catalogue from a simple CMS admin.

---

## Target user

- **Buyer:** Parisian woman, 25–45, fashion-conscious, comfortable with WhatsApp ordering.
- **Owner/admin:** Boutique founder — needs to add/remove products without developer help.

---

## v0 Feature set

| Flow | v0 | Notes |
|------|:--:|-------|
| Storefront shell (nav, footer, hero) | ✅ | Mobile-first, editorial design |
| Product catalogue listing | ✅ | Grid, filter by category |
| Product detail page | ✅ | Gallery, description, size picker |
| WhatsApp checkout | ✅ | Pre-filled WA deep-link + CMS order save |
| CMS product management | ✅ | Payload admin — create/edit/archive products |
| Editorial / brand pages | ✅ | About, lookbook (at least 1 editorial page) |
| i18n (fr + en) | ✅ | All content localized |
| Real payment processing | ❌ | Out of v0 |
| User accounts / wishlist | ❌ | Out of v0 |
| Email notifications | ❌ | Out of v0 |
| Inventory management | ❌ | Out of v0 |

---

## Flow Inventory

| Flow | v0 |
|------|:--:|
| Browse catalogue & discover products | ✅ |
| View product detail & select size | ✅ |
| Place order via WhatsApp | ✅ |
| Admin: manage products in CMS | ✅ |
| Admin: view orders in CMS | ✅ |
| Brand / editorial page | ✅ |

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

- Catalogue live with ≥ 5 products before launch
- Order placed via WhatsApp within 24h of launch
- Admin can add a new product without developer help
- Mobile Lighthouse score ≥ 90

---

## Open questions

See `docs/prd/questions/open-questions.md`.

---

## Surface blockers

None at this stage.

---

## v0 boundary (exclusions)

- Real payment processing
- User accounts and authentication
- Persistent cart
- Email notifications
- Inventory / stock tracking
- Multi-vendor
- Any surface not listed in the Flow Inventory above
