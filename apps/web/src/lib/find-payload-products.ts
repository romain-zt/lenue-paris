import type {
  PayloadProductDoc,
  PayloadProductsWhere,
  SupportedLocale,
} from "@repo/catalog";

export function buildProductsListUrl(
  cmsUrl: string,
  args: { where?: PayloadProductsWhere; locale: SupportedLocale },
): string {
  const params = new URLSearchParams();
  params.set("locale", args.locale);
  params.set("limit", "100");

  const categoryEquals = args.where?.category?.equals;
  if (categoryEquals) {
    params.set("where[category][equals]", categoryEquals);
  }

  const base = cmsUrl.replace(/\/$/, "");
  return `${base}/api/products?${params.toString()}`;
}

export async function findPayloadProducts(args: {
  where?: PayloadProductsWhere;
  locale: SupportedLocale;
}): Promise<PayloadProductDoc[]> {
  const cmsUrl = process.env.CMS_URL ?? process.env.NEXT_PUBLIC_CMS_URL;
  if (!cmsUrl) {
    throw new Error("CMS_URL is not configured");
  }

  const url = buildProductsListUrl(cmsUrl, args);
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(
      `Payload products fetch failed with status ${response.status}`,
    );
  }

  const payload = (await response.json()) as { docs?: PayloadProductDoc[] };
  return payload.docs ?? [];
}
