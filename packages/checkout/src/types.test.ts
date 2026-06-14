import { describe, expect, it } from "vitest";
import {
  CREATE_ORDER_INPUT_FIELDS,
  DEFAULT_WHATSAPP_ORDER_NUMBER,
  isCreateOrderInputField,
  type CreateOrderInput,
  type CreateOrderNotFoundResponse,
  type CreateOrderSaveFailedResponse,
  type CreateOrderSuccessResponse,
  type CreateOrderValidationErrorResponse,
  type WhatsAppHandoffUrl,
  type WhatsAppOrderMessageInput,
} from "./index";

/** Spec Contract § Inputs — dress order POST body example. */
const specCreateOrderInput: CreateOrderInput = {
  customerName: "Anna",
  customerPhone: "+33612345678",
  customerEmail: "anna@example.com",
  productSlug: "robe-lin",
  locale: "fr",
  length: "longer",
  size: "M",
};

describe("CreateOrderInput contract", () => {
  it("matches spec POST /api/orders body example", () => {
    expect(specCreateOrderInput.customerName).toBe("Anna");
    expect(specCreateOrderInput.productSlug).toBe("robe-lin");
    expect(specCreateOrderInput.length).toBe("longer");
    expect(specCreateOrderInput.size).toBe("M");
  });

  it("lists every validation field key", () => {
    expect(CREATE_ORDER_INPUT_FIELDS).toEqual([
      "customerName",
      "customerPhone",
      "customerEmail",
      "productSlug",
      "locale",
      "length",
      "size",
    ]);
  });

  it("type-guards create-order field names", () => {
    expect(isCreateOrderInputField("customerPhone")).toBe(true);
    expect(isCreateOrderInputField("unknown")).toBe(false);
  });
});

describe("CreateOrderResponse contract", () => {
  it("201 success includes id and whatsappUrl", () => {
    const response: CreateOrderSuccessResponse = {
      id: "order-1",
      whatsappUrl: `https://wa.me/${DEFAULT_WHATSAPP_ORDER_NUMBER}?text=hello`,
    };
    expect(response.id).toBeTruthy();
    expect(response.whatsappUrl).toMatch(/^https:\/\/wa\.me\//);
  });

  it("400 validation errors enumerate field + message", () => {
    const response: CreateOrderValidationErrorResponse = {
      errors: [{ field: "customerPhone", message: "Required" }],
    };
    expect(response.errors[0]?.field).toBe("customerPhone");
  });

  it("404 and 500 error codes match spec", () => {
    const notFound: CreateOrderNotFoundResponse = { error: "product_not_found" };
    const saveFailed: CreateOrderSaveFailedResponse = { error: "order_save_failed" };
    expect(notFound.error).toBe("product_not_found");
    expect(saveFailed.error).toBe("order_save_failed");
  });
});

describe("WhatsApp message contract", () => {
  it("accepts localized dress order context for message builder", () => {
    const input: WhatsAppOrderMessageInput = {
      locale: "fr",
      customerName: specCreateOrderInput.customerName,
      customerPhone: specCreateOrderInput.customerPhone,
      productName: "Robe lin",
      productSlug: specCreateOrderInput.productSlug,
      priceEur: 420,
      length: "longer",
      size: "M",
    };
    expect(input.locale).toBe("fr");
    expect(input.priceEur).toBeGreaterThan(0);
  });

  it("handoff URL shape includes phone, text, and full wa.me link", () => {
    const handoff: WhatsAppHandoffUrl = {
      phoneNumber: DEFAULT_WHATSAPP_ORDER_NUMBER,
      messageText: "Bonjour",
      url: `https://wa.me/${DEFAULT_WHATSAPP_ORDER_NUMBER}?text=Bonjour`,
    };
    expect(handoff.url).toContain(handoff.phoneNumber);
  });
});
