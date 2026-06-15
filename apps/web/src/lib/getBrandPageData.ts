import type { BrandPageContentProps } from "@/app/[locale]/(storefront)/a-propos/BrandPageContent";
import { BRAND_PAGE_COPY } from "@/lib/brandPageCopy";
import { getPage } from "@/lib/getPage";

export type { BrandPageContentProps };

export async function getBrandPageData(locale: string = "fr"): Promise<BrandPageContentProps> {
  const page = await getPage("a-propos", locale);
  if (page) {
    return {
      title: page.title,
      body: page.body ?? "",
      cover: page.cover ?? null,
    };
  }
  const fallback = BRAND_PAGE_COPY[locale as keyof typeof BRAND_PAGE_COPY] ?? BRAND_PAGE_COPY.fr;
  return {
    title: fallback.title,
    body: fallback.body,
    cover: null,
  };
}
