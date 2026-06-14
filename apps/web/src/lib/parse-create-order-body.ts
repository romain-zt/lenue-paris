import { normalizeLocale } from "@repo/catalog";
import { getValidationMessage } from "@repo/checkout";
import type { CreateOrderInput, OrderValidationError } from "@repo/checkout";
import type { ProductLengthVariant, ProductSizeCode } from "@repo/product-detail";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function parseCreateOrderBody(
  request: Request,
): Promise<{ ok: true; input: CreateOrderInput } | { ok: false; errors: OrderValidationError[] }> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    const locale = "fr";
    return {
      ok: false,
      errors: [
        {
          field: "customerName",
          message: getValidationMessage(locale, "customerNameRequired"),
        },
      ],
    };
  }

  if (!isRecord(body)) {
    const locale = "fr";
    return {
      ok: false,
      errors: [
        {
          field: "customerName",
          message: getValidationMessage(locale, "customerNameRequired"),
        },
      ],
    };
  }

  const locale = normalizeLocale(readString(body.locale));
  const errors: OrderValidationError[] = [];

  if (readString(body.customerName) === undefined) {
    errors.push({
      field: "customerName",
      message: getValidationMessage(locale, "customerNameRequired"),
    });
  }

  if (readString(body.customerPhone) === undefined) {
    errors.push({
      field: "customerPhone",
      message: getValidationMessage(locale, "customerPhoneRequired"),
    });
  }

  if (readString(body.productSlug) === undefined) {
    errors.push({
      field: "productSlug",
      message: getValidationMessage(locale, "productSlugRequired"),
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const input: CreateOrderInput = {
    customerName: body.customerName as string,
    customerPhone: body.customerPhone as string,
    productSlug: body.productSlug as string,
    locale,
  };

  const email = readString(body.customerEmail);
  if (email !== undefined) {
    input.customerEmail = email;
  }

  const length = readString(body.length);
  if (length !== undefined) {
    input.length = length as ProductLengthVariant;
  }

  const size = readString(body.size);
  if (size !== undefined) {
    input.size = size as ProductSizeCode;
  }

  return { ok: true, input };
}
