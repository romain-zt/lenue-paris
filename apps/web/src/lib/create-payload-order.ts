import type { OrderSavePayload } from "@repo/checkout";

export interface CreatePayloadOrderResult {
  id: string;
}

export function buildOrdersCreateUrl(cmsUrl: string): string {
  const base = cmsUrl.replace(/\/$/, "");
  return `${base}/api/orders`;
}

export async function createPayloadOrder(
  payload: OrderSavePayload,
): Promise<CreatePayloadOrderResult | null> {
  const cmsUrl = process.env.CMS_URL ?? process.env.NEXT_PUBLIC_CMS_URL;
  if (!cmsUrl) {
    throw new Error("CMS_URL is not configured");
  }

  const response = await fetch(buildOrdersCreateUrl(cmsUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      product: payload.productId,
      length: payload.length,
      size: payload.size,
      priceEur: payload.priceEur,
      locale: payload.locale,
      message: payload.message,
      status: "new",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as {
    doc?: { id?: string | number };
    id?: string | number;
  };
  const id = result.doc?.id ?? result.id;

  if (id == null) {
    return null;
  }

  return { id: String(id) };
}
