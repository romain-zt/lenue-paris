import type { SupportedLocale } from "@repo/catalog";
import { formatWhatsAppOrderMessage } from "./checkout-copy";
import type {
  WhatsAppHandoffUrl,
  WhatsAppOrderMessage,
  WhatsAppOrderMessageInput,
} from "./whatsapp.types";
import { DEFAULT_WHATSAPP_ORDER_NUMBER } from "./whatsapp.types";

export {
  DEFAULT_WHATSAPP_ORDER_NUMBER,
  type WhatsAppHandoffUrl,
  type WhatsAppOrderMessage,
  type WhatsAppOrderMessageInput,
} from "./whatsapp.types";

/** Strips non-digits; falls back to spec default when env is empty. */
export function resolveWhatsAppOrderNumber(envValue?: string): string {
  const digits = envValue?.replace(/\D/g, "") ?? "";
  return digits.length > 0 ? digits : DEFAULT_WHATSAPP_ORDER_NUMBER;
}

/** Builds localized prefill text — traced to spec AC-3 / AC-8. */
export function buildWhatsAppMessage(input: WhatsAppOrderMessageInput): WhatsAppOrderMessage {
  const text = formatWhatsAppOrderMessage({
    locale: input.locale,
    productName: input.productName,
    productSlug: input.productSlug,
    priceEur: input.priceEur,
    length: input.length,
    size: input.size,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
  });

  return { locale: input.locale, text };
}

/** Encodes message for wa.me handoff — traced to spec AC-3. */
export function buildWhatsAppHandoffUrl(
  messageText: string,
  phoneNumber: string = DEFAULT_WHATSAPP_ORDER_NUMBER,
): WhatsAppHandoffUrl {
  const normalizedPhone = resolveWhatsAppOrderNumber(phoneNumber);
  const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageText)}`;

  return {
    phoneNumber: normalizedPhone,
    messageText,
    url,
  };
}

/** Convenience: message + handoff URL from order context. */
export function buildWhatsAppHandoff(
  input: WhatsAppOrderMessageInput,
  phoneNumber?: string,
): WhatsAppHandoffUrl {
  const { text } = buildWhatsAppMessage(input);
  return buildWhatsAppHandoffUrl(text, phoneNumber);
}

export function isSupportedCheckoutLocale(value: string): value is SupportedLocale {
  return value === "fr" || value === "en" || value === "ru";
}
