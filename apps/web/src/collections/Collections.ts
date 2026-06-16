import type { CollectionConfig } from "payload";
import {
  ADMIN_GROUPS,
  COLLECTION_LABELS,
  FIELD_DESCRIPTIONS,
  FIELD_LABELS,
} from "@/i18n/admin-labels";
import { generatePreviewPath, getPreviewSiteUrl } from "@/lib/cms/generatePreviewPath";

export const Collections: CollectionConfig = {
  slug: "collections",
  labels: COLLECTION_LABELS.collections,
  admin: {
    group: ADMIN_GROUPS.boutique,
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    description: FIELD_DESCRIPTIONS.collectionsIntro,
    livePreview: {
      url: ({ data, req }) => {
        const slug = typeof data?.slug === "string" ? data.slug : "";
        if (!slug) return null;
        const locale = req.locale || "fr";
        const base = getPreviewSiteUrl();
        const path =
          locale === "fr" ? `/collections/${slug}` : `/${locale}/collections/${slug}`;
        return `${base}${path}`;
      },
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: typeof data?.slug === "string" ? data.slug : "",
        collection: "collections",
        req,
      }),
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
      label: FIELD_LABELS.title,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      label: FIELD_LABELS.slug,
      admin: {
        description: FIELD_DESCRIPTIONS.slugCollection,
      },
    },
    {
      name: "hero",
      type: "upload",
      relationTo: "media",
      label: FIELD_LABELS.hero,
      admin: {
        description: FIELD_DESCRIPTIONS.collectionsHero,
      },
    },
    {
      name: "products",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      label: FIELD_LABELS.products,
      admin: {
        description: FIELD_DESCRIPTIONS.collectionsProducts,
      },
    },
  ],
};
