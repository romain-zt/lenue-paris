import type { CollectionConfig } from "payload";

export const Orders: CollectionConfig = {
  slug: "orders",
  labels: {
    singular: "Commande",
    plural: "Commandes",
  },
  admin: {
    useAsTitle: "productTitle",
    defaultColumns: [
      "productTitle",
      "category",
      "buyerName",
      "buyerContact",
      "price",
      "createdAt",
    ],
    description:
      "Commandes passées par les acheteurs. Lecture seule — la prise en charge se fait sur WhatsApp.",
    group: "Boutique",
  },
  defaultSort: "-createdAt",
  access: {
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      required: false,
    },
    {
      name: "productTitle",
      type: "text",
      required: false,
      admin: {
        description: "Snapshot du titre produit au moment de la commande (renseigné côté serveur).",
      },
    },
    {
      name: "category",
      type: "select",
      required: false,
      options: [
        { label: "Robes", value: "dresses" },
        { label: "Sacs", value: "bags" },
        { label: "Foulards", value: "scarfs" },
      ],
      admin: {
        description: "Snapshot de la catégorie au moment de la commande (renseigné côté serveur).",
      },
    },
    {
      name: "length",
      type: "select",
      required: false,
      options: [
        { label: "Version longue", value: "longer" },
        { label: "Version courte", value: "shorter" },
      ],
    },
    {
      name: "size",
      type: "select",
      required: false,
      options: [
        { label: "XS", value: "XS" },
        { label: "S", value: "S" },
        { label: "M", value: "M" },
        { label: "L", value: "L" },
        { label: "XL", value: "XL" },
      ],
    },
    {
      name: "price",
      type: "number",
      required: false,
      min: 0,
      admin: {
        description: "Snapshot du prix au moment de la commande (renseigné côté serveur).",
      },
    },
    {
      name: "buyerName",
      type: "text",
      required: true,
    },
    {
      name: "buyerContact",
      type: "text",
      required: true,
      admin: {
        description: "Numéro de téléphone de l'acheteur.",
      },
    },
  ],
};
