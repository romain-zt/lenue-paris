import type { CollectionConfig } from "payload";
import {
  ADMIN_GROUPS,
  COLLECTION_LABELS,
  FIELD_DESCRIPTIONS,
  FIELD_LABELS,
} from "../i18n/admin-labels";
import { pageBlocks } from "../blocks";

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: COLLECTION_LABELS.pages,
  admin: {
    group: ADMIN_GROUPS.editorial,
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
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
      label: FIELD_LABELS.title,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      label: FIELD_LABELS.slug,
      admin: {
        description: FIELD_DESCRIPTIONS.slugPage,
      },
    },
    {
      name: "blocks",
      type: "blocks",
      label: FIELD_LABELS.blocks,
      blocks: pageBlocks,
    },
    {
      name: "body",
      type: "textarea",
      localized: true,
      label: FIELD_LABELS.body,
    },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
      label: FIELD_LABELS.cover,
    },
  ],
};
