import { getCmsClient } from "../client";
import type { ContentLocale, SiteSnapshot } from "../types";

export async function getSiteSnapshot(
  locale: ContentLocale = "fr",
): Promise<SiteSnapshot> {
  const payload = await getCmsClient();

  const [siteSettings, designTokens, productsPublished, productsInStock, pagesPublished, collectionsPublished, ordersPending] =
    await Promise.all([
      payload.findGlobal({
        slug: "site-settings",
        locale,
        overrideAccess: true,
        depth: 0,
      }),
      payload.findGlobal({
        slug: "design-tokens",
        locale,
        overrideAccess: true,
        depth: 0,
      }),
      payload.count({
        collection: "products",
        where: { _status: { equals: "published" } },
        overrideAccess: true,
      }),
      payload.count({
        collection: "products",
        where: {
          and: [
            { _status: { equals: "published" } },
            { inStock: { equals: true } },
          ],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: "pages",
        where: { _status: { equals: "published" } },
        overrideAccess: true,
      }),
      payload.count({
        collection: "collections",
        where: { _status: { equals: "published" } },
        overrideAccess: true,
      }),
      payload.count({
        collection: "orders",
        where: { status: { equals: "pending" } },
        overrideAccess: true,
      }),
    ]);

  return {
    siteSettings: siteSettings as unknown as Record<string, unknown>,
    designTokens: designTokens as unknown as Record<string, unknown>,
    counts: {
      productsPublished: productsPublished.totalDocs,
      productsInStock: productsInStock.totalDocs,
      pagesPublished: pagesPublished.totalDocs,
      collectionsPublished: collectionsPublished.totalDocs,
      ordersPending: ordersPending.totalDocs,
    },
  };
}
