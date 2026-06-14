import { isSupportedLocale, normalizeLocale } from "@repo/catalog";
import type { ProductSizeCode, ProductVariantPickers } from "@repo/product-detail";
import { getValidationMessage } from "./checkout-copy";
import type { CreateOrderInput, OrderValidationError } from "./types";

export interface ValidateOrderInputContext {
  /** Dress variant pickers from product detail; null for bags and foulards. */
  variantPickers: ProductVariantPickers | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimOrEmpty(value: string | undefined): string {
  return value?.trim() ?? "";
}

/** Domain validation for checkout POST body — traced to spec AC-6. */
export function validateOrderInput(
  input: CreateOrderInput,
  context: ValidateOrderInputContext,
): OrderValidationError[] {
  const locale = isSupportedLocale(input.locale) ? input.locale : normalizeLocale(input.locale);
  const errors: OrderValidationError[] = [];

  if (!trimOrEmpty(input.productSlug)) {
    errors.push({
      field: "productSlug",
      message: getValidationMessage(locale, "productSlugRequired"),
    });
  }

  if (!trimOrEmpty(input.customerName)) {
    errors.push({
      field: "customerName",
      message: getValidationMessage(locale, "customerNameRequired"),
    });
  }

  if (!trimOrEmpty(input.customerPhone)) {
    errors.push({
      field: "customerPhone",
      message: getValidationMessage(locale, "customerPhoneRequired"),
    });
  }

  const email = trimOrEmpty(input.customerEmail);
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.push({
      field: "customerEmail",
      message: getValidationMessage(locale, "customerEmailInvalid"),
    });
  }

  const { variantPickers } = context;

  if (variantPickers) {
    if (!input.length) {
      errors.push({
        field: "length",
        message: getValidationMessage(locale, "lengthRequired"),
      });
    } else if (!variantPickers.lengthOptions.includes(input.length)) {
      errors.push({
        field: "length",
        message: getValidationMessage(locale, "lengthInvalid"),
      });
    }

    if (!input.size) {
      errors.push({
        field: "size",
        message: getValidationMessage(locale, "sizeRequired"),
      });
    } else if (!variantPickers.sizeOptions.includes(input.size as ProductSizeCode)) {
      errors.push({
        field: "size",
        message: getValidationMessage(locale, "sizeInvalid"),
      });
    }
  }

  return errors;
}
