import type { CollectionConfig } from "payload";

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: "Produit",
    plural: "Produits",
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
          ({ data, siblingData }) => {
            if (!data && siblingData?.title) {
              return (siblingData.title as string)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            }
            return data;
          },
        ],
      },
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: "Robes", value: "dresses" },
        { label: "Sacs", value: "bags" },
        { label: "Foulards", value: "scarfs" },
      ],
    },
    {
      name: "price",
      type: "number",
      required: true,
      min: 0,
      admin: {
        description: "Prix en EUR (ex: 290.00)",
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
      label: "Galerie d'images",
      admin: {
        description: "Images supplémentaires du produit (après l'image principale).",
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
        description: "Description du produit affichée sur la page détail.",
      },
    },
  ],
};
