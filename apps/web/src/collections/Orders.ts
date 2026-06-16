import type { CollectionConfig } from "payload";
import { ADMIN_GROUPS } from "@/i18n/admin-labels";

export const Orders: CollectionConfig = {
  slug: "orders",
  labels: {
    singular: { en: "Order", fr: "Commande", ru: "Заказ" },
    plural: { en: "Orders", fr: "Commandes", ru: "Заказы" },
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
    description: {
      en: "Orders placed by buyers. Read-only — fulfilment happens on WhatsApp.",
      fr: "Commandes clientes. Lecture seule — le suivi se fait sur WhatsApp.",
      ru: "Заказы покупательниц. Только просмотр — обработка в WhatsApp.",
    },
    group: ADMIN_GROUPS.orders,
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
        description: "Product title snapshot at order time (set server-side).",
      },
    },
    {
      name: "category",
      type: "select",
      required: false,
      options: [
        { label: "Dresses", value: "dresses" },
        { label: "Bags", value: "bags" },
        { label: "Scarves", value: "scarfs" },
      ],
      admin: {
        description: "Category snapshot at order time (set server-side).",
      },
    },
    {
      name: "length",
      type: "select",
      required: false,
      options: [
        { label: "Long version", value: "longer" },
        { label: "Short version", value: "shorter" },
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
        description: "Price snapshot at order time (set server-side).",
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
        description: "Buyer phone number.",
      },
    },
  ],
};
