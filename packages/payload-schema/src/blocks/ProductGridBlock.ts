import type { Block } from "payload";
import { FIELD_LABELS, SELECT_LABELS } from "../i18n/admin-labels";

export const ProductGridBlock: Block = {
  slug: "productGrid",
  labels: {
    singular: FIELD_LABELS.productGrid,
    plural: { en: "Product grids", fr: "Grilles produits", ru: "Сетки товаров" },
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
      label: FIELD_LABELS.title,
    },
    {
      name: "sourceType",
      type: "select",
      defaultValue: "all",
      label: FIELD_LABELS.sourceType,
      options: [
        { label: SELECT_LABELS.allProducts, value: "all" },
        { label: SELECT_LABELS.fromCollection, value: "collection" },
      ],
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
  ],
};
