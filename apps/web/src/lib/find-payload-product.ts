import type { SupportedLocale } from "@repo/catalog";
import type { PayloadProductDetailDoc } from "@repo/product-detail";

export function buildProductBySlugUrl(
  cmsUrl: string,
  args: { slug: string; locale: SupportedLocale },
): string {
  const params = new URLSearchParams();
  params.set("locale", args.locale);
  params.set("limit", "1");
  params.set("where[slug][equals]", args.slug);

  const base = cmsUrl.replace(/\/$/, "");
  return `${base}/api/products?${params.toString()}`;
}

export async function findPayloadProductBySlug(args: {
  slug: string;
  locale: SupportedLocale;
}): Promise<PayloadProductDetailDoc | null> {
  const cmsUrl = process.env.CMS_URL ?? process.env.NEXT_PUBLIC_CMS_URL;
  if (!cmsUrl) {
    throw new Error("CMS_URL is not configured");
  }

  const url = buildProductBySlugUrl(cmsUrl, args);
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(
      `Payload product fetch failed with status ${response.status}`,
    );
  }

  const payload = (await response.json()) as { docs?: PayloadProductDetailDoc[] };
  return payload.docs?.[0] ?? null;
}
