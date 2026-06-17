import type { CollectionConfig } from "payload";
import {
  ADMIN_GROUPS,
  COLLECTION_LABELS,
  FIELD_DESCRIPTIONS,
  FIELD_LABELS,
  SELECT_LABELS,
} from "@/i18n/admin-labels";
import { generatePreviewPath, getPreviewSiteUrl } from "@/lib/cms/generatePreviewPath";

export const Products: CollectionConfig = {
  slug: "products",
  labels: COLLECTION_LABELS.products,
  admin: {
    group: ADMIN_GROUPS.boutique,
    useAsTitle: "title",
    defaultColumns: ["title", "category", "price", "_status", "updatedAt"],
    livePreview: {
      url: ({ data, req }) => {
        const slug = typeof data?.slug === "string" ? data.slug : "";
        if (!slug) return null;
        const locale = req.locale || "fr";
        const base = getPreviewSiteUrl();
        const path =
          locale === "fr" ? `/produits/${slug}` : `/${locale}/produits/${slug}`;
        return `${base}${path}`;
      },
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: typeof data?.slug === "string" ? data.slug : "",
        collection: "products",
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
        description: FIELD_DESCRIPTIONS.slugProduct,
      },
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) => {
            if (!value && siblingData?.title) {
              return (siblingData.title as string)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            }
            return value;
          },
        ],
      },
    },
    {
      name: "category",
      type: "select",
      required: true,
      label: FIELD_LABELS.category,
      options: [
        { label: SELECT_LABELS.dresses, value: "dresses" },
        { label: SELECT_LABELS.bags, value: "bags" },
        { label: SELECT_LABELS.scarfs, value: "scarfs" },
      ],
    },
    {
      name: "price",
      type: "number",
      required: true,
      min: 0,
      label: FIELD_LABELS.price,
      admin: {
        description: FIELD_DESCRIPTIONS.price,
      },
    },
    {
      name: "inStock",
      type: "checkbox",
      defaultValue: true,
      label: FIELD_LABELS.inStock,
      admin: {
        description: FIELD_DESCRIPTIONS.inStock,
      },
    },
    {
      name: "limitedSeries",
      type: "checkbox",
      defaultValue: false,
      label: FIELD_LABELS.limitedSeries,
      admin: {
        description: FIELD_DESCRIPTIONS.limitedSeries,
        condition: (data) => data?.category === "dresses",
      },
    },
    {
      name: "mainImage",
      type: "upload",
      relationTo: "media",
      required: true,
      label: FIELD_LABELS.mainImage,
    },
    {
      name: "gallery",
      type: "array",
      label: FIELD_LABELS.gallery,
      admin: {
        description: FIELD_DESCRIPTIONS.gallery,
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
          label: FIELD_LABELS.image,
        },
      ],
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
      label: FIELD_LABELS.description,
      admin: {
        description: FIELD_DESCRIPTIONS.description,
      },
    },
    {
      name: "availableLengths",
      type: "select",
      hasMany: true,
      label: FIELD_LABELS.availableLengths,
      options: [
        { label: SELECT_LABELS.longer, value: "longer" },
        { label: SELECT_LABELS.shorter, value: "shorter" },
      ],
      admin: {
        condition: (data) => data?.category === "dresses",
      },
    },
    {
      name: "availableSizes",
      type: "select",
      hasMany: true,
      label: FIELD_LABELS.availableSizes,
      options: [
        { label: "XS", value: "XS" },
        { label: "S", value: "S" },
        { label: "M", value: "M" },
        { label: "L", value: "L" },
        { label: "XL", value: "XL" },
      ],
      admin: {
        condition: (data) => data?.category === "dresses",
      },
    },
    {
      name: "pairings",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      label: FIELD_LABELS.pairings,
      access: {
        read: ({ req }) => Boolean(req.user),
      },
    },
  ],
};
