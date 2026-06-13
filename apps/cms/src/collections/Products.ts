import type { CollectionConfig } from "payload";

// Product catalogue for lenue.paris — dresses, bags, foulards.
export const Products: CollectionConfig = {
  slug: "products",
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "category", "price", "available", "updatedAt"],
  },
  fields: [
    {
      name: "name",
      type: "text",
      localized: true,
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      // identifier — NOT localized
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: ["robe", "sac", "foulard", "autre"],
    },
    {
      name: "description",
      type: "richText",
      localized: true,
    },
    {
      name: "price",
      type: "number",
      required: true,
      min: 0,
    },
    {
      name: "currency",
      type: "select",
      defaultValue: "EUR",
      options: ["EUR"],
    },
    {
      name: "images",
      type: "array",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
    {
      name: "available",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "sizes",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "inStock",
          type: "checkbox",
          defaultValue: true,
        },
      ],
    },
  ],
};
