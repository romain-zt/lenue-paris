import { describe, expect, it } from "vitest";
import { getLengthLabel } from "./checkout-copy";
import {
  buildWhatsAppHandoff,
  buildWhatsAppHandoffUrl,
  buildWhatsAppMessage,
  DEFAULT_WHATSAPP_ORDER_NUMBER,
  resolveWhatsAppOrderNumber,
} from "./whatsapp";
import type { WhatsAppOrderMessageInput } from "./whatsapp.types";

const dressMessageInput: WhatsAppOrderMessageInput = {
  locale: "fr",
  customerName: "Anna",
  customerPhone: "+33612345678",
  customerEmail: "anna@example.com",
  productName: "Robe lin",
  productSlug: "robe-lin",
  priceEur: 420,
  length: "longer",
  size: "M",
};

describe("buildWhatsAppMessage", () => {
  it("includes product, dress variants, and EUR price in French (spec AC-3)", () => {
    const { text } = buildWhatsAppMessage(dressMessageInput);

    expect(text).toContain("Robe lin");
    expect(text).toContain("robe-lin");
    expect(text).toContain(getLengthLabel("fr", "longer"));
    expect(text).toContain("M");
    expect(text).toContain("420 €");
    expect(text).toContain("Anna");
    expect(text).toContain("+33612345678");
  });

  it("localizes message for en and ru (spec AC-8)", () => {
    const en = buildWhatsAppMessage({ ...dressMessageInput, locale: "en" }).text;
    const ru = buildWhatsAppMessage({ ...dressMessageInput, locale: "ru" }).text;

    expect(en).toContain("Hello, I would like to order:");
    expect(en).toContain("Length: Longer");
    expect(ru).toContain("Здравствуйте, хочу оформить заказ:");
    expect(ru).toContain("Длина: Длиннее");
  });

  it("omits length and size lines for bags", () => {
    const text = buildWhatsAppMessage({
      locale: "en",
      customerName: "Anna",
      customerPhone: "+33612345678",
      productName: "Leather bag",
      productSlug: "sac-cuir",
      priceEur: 890,
    }).text;

    expect(text).not.toContain("Length:");
    expect(text).not.toContain("Size:");
    expect(text).toContain("890 €");
  });
});

describe("buildWhatsAppHandoffUrl", () => {
  it("encodes message to wa.me with default number (spec AC-3)", () => {
    const handoff = buildWhatsAppHandoffUrl("Bonjour");

    expect(handoff.phoneNumber).toBe(DEFAULT_WHATSAPP_ORDER_NUMBER);
    expect(handoff.url).toBe(
      `https://wa.me/${DEFAULT_WHATSAPP_ORDER_NUMBER}?text=${encodeURIComponent("Bonjour")}`,
    );
  });

  it("normalizes env phone override", () => {
    expect(resolveWhatsAppOrderNumber("+7 911 712-62-62")).toBe("79117126262");
    expect(buildWhatsAppHandoffUrl("Hi", "+79117126262").phoneNumber).toBe("79117126262");
  });

  it("buildWhatsAppHandoff combines message builder and URL", () => {
    const handoff = buildWhatsAppHandoff(dressMessageInput);

    expect(handoff.messageText).toContain("Robe lin");
    expect(handoff.url).toMatch(/^https:\/\/wa\.me\/79117126262\?text=/);
  });
});
