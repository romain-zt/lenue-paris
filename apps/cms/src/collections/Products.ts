import type { CollectionConfig } from "payload";

export const Products: CollectionConfig = {
  slug: "products",
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      type: "text",
      localized: true,
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "URL-safe identifier, e.g. robe-rouge-courte",
      },
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: "Dresses", value: "dresses" },
        { label: "Bags", value: "bags" },
        { label: "Scarfs", value: "scarfs" },
      ],
    },
    {
      name: "price",
      type: "number",
      required: true,
      min: 1,
      admin: {
        description: "Price in EUR cents (e.g. 12900 = €129.00)",
      },
    },
    {
      name: "images",
      type: "array",
      minRows: 1,
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
  ],
};
