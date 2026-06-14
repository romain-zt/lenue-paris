import type { SupportedLocale } from "@repo/catalog";
import type { ProductLengthVariant, ProductSizeCode } from "@repo/product-detail";

/** Default wa.me path segment — override via WHATSAPP_ORDER_NUMBER env (spec Implementation notes). */
export const DEFAULT_WHATSAPP_ORDER_NUMBER = "79117126262";

/** Input contract for localized WhatsApp prefill message builders (layer 3). */
export interface WhatsAppOrderMessageInput {
  locale: SupportedLocale;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  productName: string;
  productSlug: string;
  priceEur: number;
  length?: ProductLengthVariant;
  size?: ProductSizeCode | string;
}

/** Output of message builder — plain text before URL encoding. */
export interface WhatsAppOrderMessage {
  locale: SupportedLocale;
  text: string;
}

/** Parsed handoff URL parts — `buildWhatsAppHandoffUrl` output shape (layer 3). */
export interface WhatsAppHandoffUrl {
  phoneNumber: string;
  messageText: string;
  /** Full https://wa.me/…?text=… URL returned to the client on 201. */
  url: string;
}
