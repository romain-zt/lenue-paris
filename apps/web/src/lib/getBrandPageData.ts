import { BRAND_PAGE_COPY } from "@/lib/brandPageCopy";
import { getPage } from "@/lib/getPage";
import type { BrandPageContentProps } from "@/app/(storefront)/a-propos/BrandPageContent";

export type { BrandPageContentProps };

export async function getBrandPageData(): Promise<BrandPageContentProps> {
  const page = await getPage("a-propos");
  if (page) {
    return {
      title: page.title,
      body: page.body ?? "",
      cover: page.cover ?? null,
    };
  }
  return {
    title: BRAND_PAGE_COPY.fr.title,
    body: BRAND_PAGE_COPY.fr.body,
    cover: null,
  };
}
