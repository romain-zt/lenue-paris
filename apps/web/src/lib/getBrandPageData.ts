import type { BrandPageContentProps } from "@/app/[locale]/(storefront)/a-propos/BrandPageContent";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Page as PayloadPage } from "@/payload-types";
import { resolveMediaUrl, resolveMediaAlt } from "@/lib/cms/media";

export type { BrandPageContentProps };

const A_PROPOS_SLUG = "a-propos";

export async function getBrandPageData(locale: string = "fr"): Promise<BrandPageContentProps> {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "pages",
      locale: locale as "fr" | "en" | "ru",
      fallbackLocale: "fr",
      where: {
        and: [
          { slug: { equals: A_PROPOS_SLUG } },
          { _status: { equals: "published" } },
        ],
      },
      depth: 1,
      limit: 1,
    });

    const page = result.docs[0] as PayloadPage | undefined;
    if (!page) {
      return { title: "", body: "", cover: null };
    }

    let coverUrl: string | null = null;
    let coverAlt: string | null = null;
    if (page.cover) {
      coverUrl = resolveMediaUrl(page.cover) ?? null;
      coverAlt = resolveMediaAlt(page.cover, "") || null;
    }

    return {
      title: page.title ?? "",
      body: (page.body as string | null | undefined) ?? "",
      cover: coverUrl ? { url: coverUrl, alt: coverAlt ?? "" } : null,
    };
  } catch {
    return { title: "", body: "", cover: null };
  }
}
