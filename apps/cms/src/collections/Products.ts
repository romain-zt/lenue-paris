import type { CollectionConfig } from "payload";

/** Dress length options shown on the storefront PDP. */
export const DRESS_LENGTH_VARIANTS = ["longer", "shorter"] as const;

export type DressLengthVariant = (typeof DRESS_LENGTH_VARIANTS)[number];

/** Fixed dress size set per Q-005 — owner may adjust in CMS. */
export const DRESS_SIZE_OPTIONS = ["XS", "S", "M", "L", "XL"] as const;

export type DressSizeCode = (typeof DRESS_SIZE_OPTIONS)[number];

const isDressCategory = (data: { category?: string | null }) =>
  data?.category === "robe";

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
    {
      name: "available",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "relatedDress",
      type: "relationship",
      relationTo: "products",
      hasMany: false,
      required: false,
      admin: {
        condition: (_, siblingData) => !isDressCategory(siblingData),
        description:
          "Optional: link this bag or scarf to the dress it pairs with.",
      },
    },
    {
      name: "lengthVariants",
      type: "select",
      hasMany: true,
      options: [
        { label: "Longer", value: "longer" },
        { label: "Shorter", value: "shorter" },
      ],
      admin: {
        condition: (_, siblingData) => isDressCategory(siblingData),
        description:
          "Dress length options shown on the product page (longer / shorter).",
      },
    },
    {
      name: "sizes",
      type: "select",
      hasMany: true,
      options: DRESS_SIZE_OPTIONS.map((size) => ({
        label: size,
        value: size,
      })),
      defaultValue: [...DRESS_SIZE_OPTIONS],
      admin: {
        condition: (_, siblingData) => isDressCategory(siblingData),
        description:
          "Available dress sizes on the product page. Defaults to XS–XL.",
      },
    },
  ],
};
