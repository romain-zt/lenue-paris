import type { CollectionConfig } from "payload";

// WhatsApp order submissions — saved on checkout form submit.
export const Orders: CollectionConfig = {
  slug: "orders",
  access: {
    // Orders are written by the web app (API key), read by admins only.
    read: ({ req }) => Boolean(req.user),
    create: () => true, // public — called from the web checkout form
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: "customerName",
    defaultColumns: [
      "customerName",
      "product",
      "length",
      "size",
      "priceEur",
      "status",
      "createdAt",
    ],
  },
  fields: [
    {
      name: "customerName",
      type: "text",
      required: true,
    },
    {
      name: "customerPhone",
      type: "text",
      required: true,
    },
    {
      name: "customerEmail",
      type: "email",
    },
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      required: true,
    },
    {
      name: "length",
      type: "select",
      options: [
        { label: "Longer", value: "longer" },
        { label: "Shorter", value: "shorter" },
      ],
    },
    {
      name: "size",
      type: "text",
    },
    {
      name: "priceEur",
      type: "number",
      required: true,
      min: 0,
    },
    {
      name: "locale",
      type: "select",
      options: [
        { label: "Français", value: "fr" },
        { label: "English", value: "en" },
        { label: "Русский", value: "ru" },
      ],
    },
    {
      name: "message",
      type: "textarea",
    },
    {
      name: "status",
      type: "select",
      defaultValue: "new",
      options: ["new", "contacted", "confirmed", "shipped", "cancelled"],
    },
  ],
};
