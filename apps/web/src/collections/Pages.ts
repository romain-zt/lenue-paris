import type { Block, CollectionConfig } from "payload";
import {
  ADMIN_GROUPS,
  COLLECTION_LABELS,
  FIELD_DESCRIPTIONS,
  FIELD_LABELS,
  SELECT_LABELS,
} from "@/i18n/admin-labels";
import { generatePreviewPath, getPreviewSiteUrl } from "@/lib/cms/generatePreviewPath";

const HeroBlock: Block = {
  slug: "hero",
  labels: {
    singular: { en: "Hero", fr: "Hero", ru: "Hero" },
    plural: { en: "Hero blocks", fr: "Blocs hero", ru: "Hero-блоки" },
  },
  fields: [
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      required: true,
      label: FIELD_LABELS.heroImage,
    },
    {
      name: "heroVideo",
      type: "upload",
      relationTo: "media",
      label: FIELD_LABELS.heroVideo,
      admin: {
        description: FIELD_DESCRIPTIONS.heroVideo,
      },
    },
    {
      name: "showCapsuleBadge",
      type: "checkbox",
      defaultValue: false,
      label: FIELD_LABELS.showCapsuleBadge,
      admin: {
        description: FIELD_DESCRIPTIONS.showCapsuleBadge,
      },
    },
    {
      name: "season",
      type: "text",
      required: true,
      label: FIELD_LABELS.season,
    },
    {
      name: "tagline",
      type: "text",
      required: true,
      label: FIELD_LABELS.tagline,
    },
    {
      name: "ctaLabel",
      type: "text",
      required: true,
      label: FIELD_LABELS.ctaLabel,
    },
    {
      name: "ctaLink",
      type: "text",
      required: true,
      defaultValue: "/catalogue",
      label: FIELD_LABELS.ctaLink,
    },
  ],
};

const FeaturedProductsBlock: Block = {
  slug: "featuredProducts",
  labels: {
    singular: FIELD_LABELS.featuredProducts,
    plural: { en: "Featured product blocks", fr: "Blocs produits mis en avant", ru: "Блоки избранных товаров" },
  },
  fields: [
    {
      name: "sourceType",
      type: "select",
      defaultValue: "manual",
      label: FIELD_LABELS.sourceType,
      options: [
        { label: SELECT_LABELS.manual, value: "manual" },
        { label: SELECT_LABELS.fromCollection, value: "collection" },
      ],
    },
    {
      name: "title",
      type: "text",
      required: true,
      label: FIELD_LABELS.title,
    },
    {
      name: "viewCollectionLabel",
      type: "text",
      label: FIELD_LABELS.viewCollectionLabel,
    },
    {
      name: "collection",
      type: "relationship",
      relationTo: "collections",
      label: FIELD_LABELS.collection,
      admin: {
        condition: (_, siblingData) => siblingData?.sourceType === "collection",
      },
    },
    {
      name: "products",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      label: FIELD_LABELS.products,
      admin: {
        condition: (_, siblingData) => siblingData?.sourceType !== "collection",
      },
    },
  ],
};

const ProductGridBlock: Block = {
  slug: "productGrid",
  labels: {
    singular: FIELD_LABELS.productGrid,
    plural: { en: "Product grids", fr: "Grilles produits", ru: "Сетки товаров" },
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      label: FIELD_LABELS.title,
    },
    {
      name: "sourceType",
      type: "select",
      defaultValue: "all",
      label: FIELD_LABELS.sourceType,
      options: [
        { label: SELECT_LABELS.allProducts, value: "all" },
        { label: SELECT_LABELS.fromCollection, value: "collection" },
      ],
    },
    {
      name: "collection",
      type: "relationship",
      relationTo: "collections",
      label: FIELD_LABELS.collection,
      admin: {
        condition: (_, siblingData) => siblingData?.sourceType === "collection",
      },
    },
  ],
};

const EditorialStripBlock: Block = {
  slug: "editorialStrip",
  labels: {
    singular: FIELD_LABELS.editorialStrip,
    plural: { en: "Editorial strips", fr: "Bandeaux éditoriaux", ru: "Редакционные полосы" },
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
      label: FIELD_LABELS.label,
    },
    {
      name: "headline",
      type: "text",
      required: true,
      label: FIELD_LABELS.headline,
    },
    {
      name: "subline",
      type: "text",
      required: true,
      label: FIELD_LABELS.subline,
    },
    {
      name: "body",
      type: "textarea",
      required: true,
      label: FIELD_LABELS.body,
    },
    {
      name: "ctaLabel",
      type: "text",
      required: true,
      label: FIELD_LABELS.ctaLabel,
    },
    {
      name: "ctaLink",
      type: "text",
      required: true,
      defaultValue: "/catalogue",
      label: FIELD_LABELS.ctaLink,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
      label: FIELD_LABELS.image,
    },
  ],
};

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: COLLECTION_LABELS.pages,
  admin: {
    group: ADMIN_GROUPS.editorial,
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    livePreview: {
      url: ({ data, req }) => {
        const slug = typeof data?.slug === "string" ? data.slug : "home";
        const locale = req.locale || "fr";
        const base = getPreviewSiteUrl();
        if (slug === "home") {
          return locale === "fr" ? `${base}/` : `${base}/${locale}`;
        }
        return locale === "fr" ? `${base}/${slug}` : `${base}/${locale}/${slug}`;
      },
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: typeof data?.slug === "string" ? data.slug : "home",
        collection: "pages",
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
        description: FIELD_DESCRIPTIONS.slugPage,
      },
    },
    {
      name: "blocks",
      type: "blocks",
      localized: true,
      label: FIELD_LABELS.blocks,
      blocks: [HeroBlock, FeaturedProductsBlock, EditorialStripBlock, ProductGridBlock],
    },
    {
      name: "body",
      type: "textarea",
      localized: true,
      label: FIELD_LABELS.body,
    },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
      label: FIELD_LABELS.cover,
    },
  ],
};
