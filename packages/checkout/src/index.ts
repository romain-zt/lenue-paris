export {
  CREATE_ORDER_INPUT_FIELDS,
  ORDER_ERROR_CODES,
  isCreateOrderInputField,
} from "./types";
export type {
  CreateOrderInput,
  CreateOrderInputField,
  CreateOrderNotFoundResponse,
  CreateOrderResponse,
  CreateOrderSaveFailedResponse,
  CreateOrderSuccessResponse,
  CreateOrderValidationErrorResponse,
  OrderErrorCode,
  OrderSavePayload,
  OrderValidationError,
  SavedOrder,
} from "./types";
export {
  formatWhatsAppOrderMessage,
  getLengthLabel,
  getValidationMessage,
} from "./checkout-copy";
export type { ValidationMessageKey, WhatsAppOrderMessageLines } from "./checkout-copy";
export { validateOrderInput } from "./validation";
export type { ValidateOrderInputContext } from "./validation";
export {
  DEFAULT_WHATSAPP_ORDER_NUMBER,
  buildWhatsAppHandoff,
  buildWhatsAppHandoffUrl,
  buildWhatsAppMessage,
  isSupportedCheckoutLocale,
  resolveWhatsAppOrderNumber,
} from "./whatsapp";
export type {
  WhatsAppHandoffUrl,
  WhatsAppOrderMessage,
  WhatsAppOrderMessageInput,
} from "./whatsapp.types";
