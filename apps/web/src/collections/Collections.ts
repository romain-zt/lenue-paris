import type { CollectionConfig } from "payload";

export const Collections: CollectionConfig = {
  slug: "collections",
  labels: {
    singular: "Collection",
    plural: "Collections",
  },
  admin: {
    group: "Shop",
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    description: "Curated product groups — Été 2026, Sacs, Nouveautés. Never one Page per SKU.",
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
        description: "URL segment for /collections/[slug]",
      },
    },
    {
      name: "hero",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Optional editorial hero for the collection page.",
      },
    },
    {
      name: "products",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      admin: {
        description: "Drag to reorder — storefront respects this order.",
      },
    },
  ],
};
