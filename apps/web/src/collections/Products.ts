import type { CollectionConfig } from "payload";

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: "Product",
    plural: "Products",
  },
  admin: {
    group: "Shop",
    useAsTitle: "title",
    defaultColumns: ["title", "category", "price", "_status", "updatedAt"],
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
        description: "URL-safe identifier. Auto-generated from title if left blank.",
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
      options: [
        { label: "Dresses", value: "dresses" },
        { label: "Bags", value: "bags" },
        { label: "Scarves", value: "scarfs" },
      ],
    },
    {
      name: "price",
      type: "number",
      required: true,
      min: 0,
      admin: {
        description: "Price in EUR (e.g. 290.00)",
      },
    },
    {
      name: "inStock",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "Uncheck to show as out of stock — buyers can express interest via WhatsApp.",
      },
    },
    {
      name: "mainImage",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "gallery",
      type: "array",
      label: "Image gallery",
      admin: {
        description: "Additional product photos (shown after the main image).",
      },
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
      name: "description",
      type: "textarea",
      localized: true,
      admin: {
        description: "Product description shown on the detail page.",
      },
    },
    {
      name: "availableLengths",
      type: "select",
      hasMany: true,
      options: [
        { label: "Long version", value: "longer" },
        { label: "Short version", value: "shorter" },
      ],
      admin: {
        description: "Available length variants for this dress.",
        condition: (data) => data?.category === "dresses",
      },
    },
    {
      name: "availableSizes",
      type: "select",
      hasMany: true,
      options: [
        { label: "XS", value: "XS" },
        { label: "S", value: "S" },
        { label: "M", value: "M" },
        { label: "L", value: "L" },
        { label: "XL", value: "XL" },
      ],
      admin: {
        description: "Available sizes for this dress.",
        condition: (data) => data?.category === "dresses",
      },
    },
    {
      name: "pairings",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      access: {
        read: ({ req }) => Boolean(req.user),
      },
      admin: {
        description: "Owner-only pairings (dress ↔ bag/scarf). Not shown on the site in v0.",
      },
    },
  ],
};
