import type { CollectionConfig } from "payload";
import {
  Collections as BaseCollections,
  Pages as BasePages,
  Products as BaseProducts,
} from "@repo/payload-schema/collections";
import { generatePreviewPath, getPreviewSiteUrl } from "@/lib/cms/generatePreviewPath";

type PreviewCollection = "pages" | "products" | "collections";

const LIVE_PREVIEW_COMPONENT =
  "@/components/admin/CustomLivePreview#CustomLivePreview";

function previewSlug(data: Record<string, unknown> | undefined, fallback: string): string {
  return typeof data?.slug === "string" ? data.slug : fallback;
}

function withStorefrontLivePreview(
  base: CollectionConfig,
  collection: PreviewCollection,
  slugFallback = "",
): CollectionConfig {
  return {
    ...base,
    admin: {
      ...base.admin,
      livePreview: {
        url: ({ data, req }) => {
          const slug = previewSlug(data, collection === "pages" ? "home" : slugFallback);
          if (!slug) return null;
          return (
            generatePreviewPath({ slug, collection, req }) ??
            (collection === "pages" ? getPreviewSiteUrl() : null)
          );
        },
      },
      preview: (data, { req }) => {
        const slug = previewSlug(data, collection === "pages" ? "home" : slugFallback);
        if (!slug && collection !== "pages") return null;
        return generatePreviewPath({ slug, collection, req });
      },
      components: {
        ...base.admin?.components,
        views: {
          ...base.admin?.components?.views,
          edit: {
            ...base.admin?.components?.views?.edit,
            livePreview: {
              Component: LIVE_PREVIEW_COMPONENT,
            },
          },
        },
      },
    },
  } as CollectionConfig;
}

export const Pages = withStorefrontLivePreview(BasePages, "pages");
export const Products = withStorefrontLivePreview(BaseProducts, "products");
export const Collections = withStorefrontLivePreview(BaseCollections, "collections");
