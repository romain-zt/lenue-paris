import type { SupportedLocale } from "@repo/catalog";
import type { ProductLengthVariant, ProductSizeCode } from "@repo/product-detail";

/** POST /api/orders JSON body — traced to spec Contract § Inputs. */
export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  productSlug: string;
  locale: SupportedLocale;
  length?: ProductLengthVariant;
  size?: ProductSizeCode | string;
}

/** Field keys referenced by validation error responses and inline form errors. */
export const CREATE_ORDER_INPUT_FIELDS = [
  "customerName",
  "customerPhone",
  "customerEmail",
  "productSlug",
  "locale",
  "length",
  "size",
] as const;

export type CreateOrderInputField = (typeof CREATE_ORDER_INPUT_FIELDS)[number];

export interface OrderValidationError {
  field: CreateOrderInputField;
  message: string;
}

export const ORDER_ERROR_CODES = [
  "validation_error",
  "product_not_found",
  "order_save_failed",
  "whatsapp_unavailable",
] as const;

export type OrderErrorCode = (typeof ORDER_ERROR_CODES)[number];

/** 201 — order persisted; client opens WhatsApp via returned URL. */
export interface CreateOrderSuccessResponse {
  id: string;
  whatsappUrl: string;
}

/** 400 — Zod / domain validation failures. */
export interface CreateOrderValidationErrorResponse {
  errors: OrderValidationError[];
}

/** 404 — unknown product slug. */
export interface CreateOrderNotFoundResponse {
  error: "product_not_found";
}

/** 500 — Payload create failed after validation passed. */
export interface CreateOrderSaveFailedResponse {
  error: "order_save_failed";
}

export type CreateOrderResponse =
  | CreateOrderSuccessResponse
  | CreateOrderValidationErrorResponse
  | CreateOrderNotFoundResponse
  | CreateOrderSaveFailedResponse;

/** Normalized order row written to Payload `orders` — internal adapter contract. */
export interface OrderSavePayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  productId: string;
  length?: ProductLengthVariant;
  size?: string;
  priceEur: number;
  locale: SupportedLocale;
  /** Localized WhatsApp prefill stored for admin reference. */
  message: string;
}

export interface SavedOrder {
  id: string;
  payload: OrderSavePayload;
}

export function isCreateOrderInputField(value: string): value is CreateOrderInputField {
  return (CREATE_ORDER_INPUT_FIELDS as readonly string[]).includes(value);
}
