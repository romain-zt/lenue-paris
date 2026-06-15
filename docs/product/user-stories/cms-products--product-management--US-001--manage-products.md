# User Story: Manage Products in Admin

## Parent Scope Slice

[Product Management](../scope-slices/cms-products--product-management.md)

## Status

`ready-for-spec`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As the boutique owner, I create, edit, and archive products — with localized copy in French, English, and Russian, a EUR price, images, dress length variants, dress sizes, and optional pairings — so that the storefront always reflects my current catalogue without needing a developer.

---

## Acceptance Criteria

### AC-1 — Create a product with all fields

- **Given** the owner is logged into the admin
- **When** she fills in the French title, price, uploads a main image, and saves
- **Then** the product is published and appears on the storefront

### AC-2 — Localized copy in three locales

- **Given** a product is being edited
- **When** the owner switches between fr, en, and ru locales
- **Then** she can enter distinct title and description copy for each locale

### AC-3 — Dress length and size configuration

- **Given** a product with category "Robes" is being edited
- **When** the owner sets available lengths (longer / shorter) and available sizes (XS–XL)
- **Then** those values are saved and retrievable via the API

### AC-4 — Archiving removes product from storefront

- **Given** a product is published
- **When** the owner unpublishes (archives) it in the admin
- **Then** the product no longer appears on the buyer-facing storefront but remains in the admin

### AC-5 — Optional product pairings

- **Given** a dress product is being edited
- **When** the owner links one or more bags or scarfs as pairings
- **Then** those pairings are stored on the product and readable by authenticated admin users

---

## Out-of-Scope Reminders

- Surfacing pairings to buyers as "complete the look" is deferred (v0 exclusion)
- Inventory / stock tracking is excluded from v0
- Order viewing is a separate slice (cms-products--order-viewing)
