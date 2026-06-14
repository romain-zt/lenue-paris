# WhatsApp Checkout Discovery Note — 2026-06-14

Source: `/prd discover`

Status: active

---

## 2026-06-14 — WhatsApp order destination

### Raw user input
> +7 911 712-62-62

### Interpreted product insight
Customer orders via the checkout form open WhatsApp to **+7 911 712-62-62** (E.164: +79117126262). This is the single destination for all v0 order messages — likely a business or personal WhatsApp line operated by the boutique owner.

### PRD implication
The WhatsApp checkout flow must deep-link to this number with a pre-filled message (product, size, customer contact). The number is a v0 configuration constant — env var or CMS setting TBD at spec time, not a PRD blocker.

### New / updated questions
- Q-001 — answered

---

## 2026-06-14 — Brand name and logo assets

### Raw user input
> Yes it's "Lénue Paris" visible many times in lenue-assets-bootstrap/pics/

### Interpreted product insight
The official brand name is **Lénue Paris** (accent on **é**). There is no separate logo file yet — the wordmark appears repeatedly on product photography in `lenue-assets-bootstrap/pics/` (14 reference photos). v0 can use a typography wordmark derived from brand direction until a vector logo is supplied.

### PRD implication
Storefront shell (nav, footer, hero) should display **Lénue Paris** consistently, including the accented **é**. Product and editorial photography in the bootstrap folder doubles as brand reference. Logo treatment for v0 = text wordmark, not an icon mark.

### New / updated questions
- Q-003 — answered

---

## 2026-06-14 — Launch languages (i18n)

### Raw user input
> fr+en+ru is day 1 mandatory

### Interpreted product insight
v0 launches with **three locales mandatory from day 1**: French (primary), English, and Russian. All buyer-facing content — catalogue, product detail, editorial pages, checkout form labels — must be available in all three. Not a phased rollout.

### PRD implication
Expands bootstrap assumption (fr + en only). **Russian is in v0 scope**, not deferred. Payload localization and Next.js i18n routing must cover `fr`, `en`, and `ru`. Aligns with WhatsApp destination (+7). `docs/project.config.md` i18n row will need update at `/prd update`. FA-i18n moves from nice-to-have to v0-critical path.

### New / updated questions
- Q-002 — answered

---

## 2026-06-14 — Launch catalogue size and structure

### Raw user input
> 4 dress (2 variants per dress - longer or shorter)
> 4 bags + 4 scarfs (that complete their related dress)

### Interpreted product insight
Launch catalogue is **curated and paired**, not an open grid:
- **4 dresses**, each with **2 length variants** (longer / shorter) — 8 dress SKUs or 4 products with a length variant.
- **4 bags** and **4 scarfs**, each **paired with a related dress** (complete-the-look sets).
- Roughly **12 product entities** (or 16 counting each dress length separately). Not a large open catalogue.

### PRD implication
Product model must support **dress length variant** (longer/shorter) and **cross-product pairing** (bag + scarf ↔ dress). Catalogue UX may surface “complete the look” or grouped presentation. Success metric “≥ 5 products” is met. CMS needs variant + relation fields (details at spec time).

### New / updated questions
- Q-004 — answered

---

## 2026-06-14 — Dress sizing at checkout

### Raw user input
> sure they have to pick a size

### Interpreted product insight
Dress orders require a **size selection** at checkout — not length alone. Buyer chooses both **length variant** (longer/shorter) and **size**. Bags and scarfs likely have no size picker (one-size or N/A).

### PRD implication
Product detail + WhatsApp checkout form must include a **required size field for dresses**. Default to a **fixed size set** (e.g. XS–XL) unless owner specifies otherwise; free-text sizing is out unless changed later. Size + length both flow into the pre-filled WhatsApp message and CMS order record.

### New / updated questions
- Q-005 — answered

---

## 2026-06-14 — Order persistence and admin visibility

### Raw user input
> sure it's important. The "whatsapto:number" link should have a ping attributes or make a silent post call on the flight to save he order for admin

### Interpreted product insight
CMS order history is **required in v0**, not optional. When the buyer taps through to WhatsApp, the order must **already be saved** for the owner in admin — WhatsApp is the conversation channel, CMS is the record of truth for back-office. User expects save to happen **on the fly** as part of the same checkout action (before or as the WA deep-link opens).

### PRD implication
WhatsApp checkout flow is **dual-write at product level**: (1) persist order in CMS for admin, (2) open WhatsApp with pre-filled message. Confirmation channel for the buyer = WhatsApp; merchant operating surface includes **Payload orders admin**. Exact mechanism (silent POST vs link ping) is implementation — product requirement is **no order lost if buyer abandons WA after tap**. Aligns with PRD Flow Inventory row “Admin: view orders in CMS”.

### New / updated questions
- Q-006 — answered

---

## 2026-06-14 — Social links (footer)

### Raw user input
> instagram for sure but use a placeholder link so far

### Interpreted product insight
Footer includes **Instagram** at launch. Final profile URL is **not ready** — ship with a **placeholder link** until the real handle/URL is confirmed.

### PRD implication
Storefront shell footer: Instagram icon/link required in v0. Use placeholder URL in config/CMS until owner supplies real link (no blocker for build). Other social networks: none required at launch unless added later.

### New / updated questions
- Q-007 — answered

---

## 2026-06-14 — Production media storage region

### Raw user input
> yes

### Interpreted product insight
Production S3 bucket region confirmed: **AWS eu-west-3 (Paris)** — matches bootstrap assumption and brand geography.

### PRD implication
Configuration Matrix / integration boundaries: prod media on **S3 eu-west-3**; local dev remains MinIO via docker-compose. No regional override needed.

### New / updated questions
- Q-008 — answered

---

## 2026-06-14 — Primary buyer profile

### Raw user input
> russian woman living in france

### Interpreted product insight
Primary buyer is a **Russian-speaking woman living in France** — not Paris-only FR monoculture, not remote CIS-only. She is local to France but Russian is her primary or co-primary language; fr/en/ru tri-locale and +7 WhatsApp align with this profile (diaspora / expat luxury shopper comfortable ordering via WhatsApp).

### PRD implication
Retire bootstrap “Parisian woman, FR-only” framing. Target user: **Russian woman in France**, fashion-conscious, 25–45 (age band unchanged unless refined). Tone and UX: luxury editorial, French market context (shipping, domain lenue.paris) with **Russian as a first-class locale**, not an afterthought. Success metrics and marketing copy should speak to this ICP.

### New / updated questions
- Q-009 — answered

---

## 2026-06-14 — Pricing visibility and checkout message

### Raw user input
> Yes

### Interpreted product insight
**Prices are shown** on the storefront (catalogue and/or product detail) and **included in the WhatsApp pre-filled order message**. No “price on request” or hidden-pricing luxury flow for v0.

### PRD implication
CMS product model requires a **price field** (currency TBD — assume EUR given France-based ICP). PDP and listing display price; checkout form and CMS order record capture price; WA deep-link message includes line item + price. Monetization = direct sale at listed price, settled offline via WhatsApp (no payment gateway).

### New / updated questions
- Q-010 — answered

---

## 2026-06-14 — Shipping geography (v0)

### Raw user input
> No need to specify for v0 as it's manual order process

### Interpreted product insight
v0 does **not** define or enforce shipping zones on the site. Delivery geography, fees, and logistics are handled **manually in the WhatsApp conversation** after the order is placed — not a storefront constraint or checkout validation rule.

### PRD implication
Checkout form and WA message do **not** require shipping country/zone selection for v0. CMS order may capture buyer contact details but shipping terms stay out of product scope. Defer shipping policy UI/copy to post-v0 unless owner adds FAQ text later.

### New / updated questions
- Q-011 — answered

---

## 2026-06-14 — Pairing UX (converge validation)

### Raw user input
> 6- keep the pairing possible, but go for the fastest option for v0

### Interpreted product insight
**Dress ↔ bag/scarf pairings must exist in the data model** (CMS can link related products), but v0 storefront takes the **fastest path**: no dedicated “complete the look” modules, curated landing sections, or pairing-driven navigation. Buyers browse a **straightforward catalogue/PDP**; pairings are admin-side structure only unless a later slice adds surfacing.

### PRD implication
Business Objects: Product includes optional **related products** (pairing). Catalogue UX for v0 = **flat category grid + PDP** — pairing is **backend-ready, buyer-invisible** at launch. Defer “complete the look” UI to post-v0 or a P1 slice. Keeps FA-product-catalog and FA-product-detail scoped for speed.

### New / updated questions
- Q-012 — answered (pairing surfacing deferred for v0)
