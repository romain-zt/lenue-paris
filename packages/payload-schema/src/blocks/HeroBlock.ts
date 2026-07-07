import type { Block } from "payload";
import { FIELD_DESCRIPTIONS, FIELD_LABELS } from "../i18n/admin-labels";

export const HeroBlock: Block = {
  slug: "hero",
  labels: {
    singular: { en: "Hero", fr: "Hero", ru: "Hero" },
    plural: { en: "Hero blocks", fr: "Blocs hero", ru: "Hero-блоки" },
  },
  fields: [
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      required: true,
      label: FIELD_LABELS.heroImage,
    },
    {
      name: "heroVideo",
      type: "upload",
      relationTo: "media",
      label: FIELD_LABELS.heroVideo,
      admin: {
        description: FIELD_DESCRIPTIONS.heroVideo,
      },
    },
    {
      name: "showCapsuleBadge",
      type: "checkbox",
      defaultValue: false,
      label: FIELD_LABELS.showCapsuleBadge,
      admin: {
        description: FIELD_DESCRIPTIONS.showCapsuleBadge,
      },
    },
    {
      name: "season",
      type: "text",
      required: true,
      localized: true,
      label: FIELD_LABELS.season,
    },
    {
      name: "tagline",
      type: "text",
      required: true,
      localized: true,
      label: FIELD_LABELS.tagline,
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
  ],
};
