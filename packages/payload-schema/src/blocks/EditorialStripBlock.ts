import type { Block } from "payload";
import { FIELD_LABELS } from "../i18n/admin-labels";

export const EditorialStripBlock: Block = {
  slug: "editorialStrip",
  labels: {
    singular: FIELD_LABELS.editorialStrip,
    plural: { en: "Editorial strips", fr: "Bandeaux éditoriaux", ru: "Редакционные полосы" },
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
      localized: true,
      label: FIELD_LABELS.label,
    },
    {
      name: "headline",
      type: "text",
      required: true,
      localized: true,
      label: FIELD_LABELS.headline,
    },
    {
      name: "subline",
      type: "text",
      required: true,
      localized: true,
      label: FIELD_LABELS.subline,
    },
    {
      name: "body",
      type: "textarea",
      required: true,
      localized: true,
      label: FIELD_LABELS.body,
    },
    {
      name: "ctaLabel",
      type: "text",
      required: true,
      localized: true,
      label: FIELD_LABELS.ctaLabel,
    },
    {
      name: "ctaLink",
      type: "text",
      required: true,
      defaultValue: "/catalogue",
      label: FIELD_LABELS.ctaLink,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
      label: FIELD_LABELS.image,
    },
  ],
};
