import type { CollectionConfig } from "payload";
import { ADMIN_GROUPS, COLLECTION_LABELS, FIELD_LABELS } from "../i18n/admin-labels";

const hasS3Config =
  !!process.env.S3_BUCKET &&
  !!process.env.S3_ACCESS_KEY_ID &&
  !!process.env.S3_SECRET_ACCESS_KEY;

export const Media: CollectionConfig = {
  slug: "media",
  labels: COLLECTION_LABELS.media,
  admin: {
    group: ADMIN_GROUPS.media,
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  upload: {
    ...(hasS3Config || !process.env.MEDIA_STATIC_DIR
      ? {}
      : { staticDir: process.env.MEDIA_STATIC_DIR }),
    mimeTypes: ["image/*", "video/mp4", "video/webm", "application/pdf"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      localized: true,
      required: true,
      label: FIELD_LABELS.alt,
    },
  ],
};
