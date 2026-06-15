import type { BrandPageContentProps } from "@/app/[locale]/(storefront)/a-propos/BrandPageContent";
import { BRAND_PAGE_COPY } from "@/lib/brandPageCopy";
import { getPage } from "@/lib/getPage";

export type { BrandPageContentProps };

type Locale = "fr" | "en" | "ru";

export async function getBrandPageData(locale: Locale = "fr"): Promise<BrandPageContentProps> {
  const page = await getPage("a-propos", locale);
  if (page) {
    return {
      title: page.title,
      body: page.body ?? "",
      cover: page.cover ?? null,
    };
  }
  return {
    title: BRAND_PAGE_COPY[locale].title,
    body: BRAND_PAGE_COPY[locale].body,
    cover: null,
  };
}
