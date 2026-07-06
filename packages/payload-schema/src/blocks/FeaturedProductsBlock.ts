import type { Block } from "payload";
import { FIELD_LABELS, SELECT_LABELS } from "../i18n/admin-labels";

export const FeaturedProductsBlock: Block = {
  slug: "featuredProducts",
  labels: {
    singular: FIELD_LABELS.featuredProducts,
    plural: { en: "Featured product blocks", fr: "Blocs produits mis en avant", ru: "Блоки избранных товаров" },
  },
  fields: [
    {
      name: "sourceType",
      type: "select",
      defaultValue: "manual",
      label: FIELD_LABELS.sourceType,
      options: [
        { label: SELECT_LABELS.manual, value: "manual" },
        { label: SELECT_LABELS.fromCollection, value: "collection" },
      ],
    },
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
      label: FIELD_LABELS.title,
    },
    {
      name: "viewCollectionLabel",
      type: "text",
      localized: true,
      label: FIELD_LABELS.viewCollectionLabel,
    },
    {
      name: "collection",
      type: "relationship",
      relationTo: "collections",
      label: FIELD_LABELS.collection,
      admin: {
        condition: (_, siblingData) => siblingData?.sourceType === "collection",
      },
    },
    {
      name: "products",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      label: FIELD_LABELS.products,
      admin: {
        condition: (_, siblingData) => siblingData?.sourceType !== "collection",
      },
    },
  ],
};
