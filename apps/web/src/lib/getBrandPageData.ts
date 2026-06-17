import type { BrandPageContentProps } from "@/app/[locale]/(storefront)/a-propos/BrandPageContent";
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
  return {
    title: "",
    body: "",
    cover: null,
  };
}
