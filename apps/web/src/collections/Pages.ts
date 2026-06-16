import type { Block, CollectionConfig } from "payload";

const HeroBlock: Block = {
  slug: "hero",
  labels: {
    singular: "Hero",
    plural: "Hero blocks",
  },
  fields: [
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "season",
      type: "text",
      required: true,
    },
    {
      name: "tagline",
      type: "text",
      required: true,
    },
    {
      name: "ctaLabel",
      type: "text",
      required: true,
    },
    {
      name: "ctaLink",
      type: "text",
      required: true,
      defaultValue: "/catalogue",
    },
  ],
};

const FeaturedProductsBlock: Block = {
  slug: "featuredProducts",
  labels: {
    singular: "Featured products",
    plural: "Featured product blocks",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "viewCollectionLabel",
      type: "text",
    },
    {
      name: "products",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      required: true,
    },
  ],
};

const EditorialStripBlock: Block = {
  slug: "editorialStrip",
  labels: {
    singular: "Editorial strip",
    plural: "Editorial strips",
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
    },
    {
      name: "headline",
      type: "text",
      required: true,
    },
    {
      name: "subline",
      type: "text",
      required: true,
    },
    {
      name: "body",
      type: "textarea",
      required: true,
    },
    {
      name: "ctaLabel",
      type: "text",
      required: true,
    },
    {
      name: "ctaLink",
      type: "text",
      required: true,
      defaultValue: "/catalogue",
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
    },
  ],
};

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: {
    singular: "Page",
    plural: "Pages",
  },
  admin: {
    group: "Shop",
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
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
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "URL-safe identifier. Use 'home' for the storefront homepage.",
      },
    },
    {
      name: "blocks",
      type: "blocks",
      localized: true,
      blocks: [HeroBlock, FeaturedProductsBlock, EditorialStripBlock],
    },
    {
      name: "body",
      type: "textarea",
      localized: true,
    },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
    },
  ],
};
