# User Story: View Orders in Admin

**ID:** cms-products--order-viewing--US-001  
**Slice:** cms-products--order-viewing  
**Feature Area:** cms-products  

---

## Story

**As** the boutique owner,  
**I want** to open the admin and see every order buyers have placed at checkout,  
**So that** I can identify who ordered what and reach them on WhatsApp to fulfill the order.

---

## Acceptance Criteria

1. **List view**: The admin shows all orders sorted newest-first with the product name, category, buyer name, buyer contact, and price visible at a glance.
2. **Detail view**: Opening an order shows the full snapshot: product, selected length (if applicable), selected size (if applicable), EUR price, buyer name, and buyer phone number as captured at checkout.
3. **Empty state**: When no orders exist, the admin shows a clear "no orders yet" state (standard Payload empty state).
4. **Loading**: While orders are loading the admin shows a brief in-progress indicator (standard Payload loading state).
5. **Error**: If orders cannot be loaded, the admin shows an error inviting the owner to retry (standard Payload error state).
6. **Access control**: Only authenticated users (the owner) can read orders. Anonymous visitors cannot access order data at any URL.
7. **Buyer contact preserved**: The buyer's phone number is displayed as entered — no masking or truncation.
8. **Order present regardless of WhatsApp**: Orders appear in the list whether or not the buyer actually sent the WhatsApp message.

---

## Out of Scope

- Editing or replying to orders inside the admin (fulfillment happens in WhatsApp)
- Payment status or settlement tracking
- Shipping/fulfillment status fields
- Email notifications on new orders
- Filtering or searching orders (v0: full list is sufficient)

---

## Notes

- The `Orders` Payload collection already exists (created in slice `whatsapp-checkout--order-save-and-handoff`). This story is about ensuring the admin presentation is clear and usable for the owner.
- All UX states (empty, loading, error) are provided by Payload admin automatically; this story validates the configuration rather than custom UI.
