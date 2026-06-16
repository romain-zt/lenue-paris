import path from "path";
import { fileURLToPath } from "url";
import type { CollectionConfig } from "payload";

const mediaDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../public/media-uploads");

const hasS3Config =
  !!process.env.S3_BUCKET &&
  !!process.env.S3_ACCESS_KEY_ID &&
  !!process.env.S3_SECRET_ACCESS_KEY;

// Upload collection. Storage is handled by the S3 plugin (MinIO local).
export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: "Media",
    plural: "Media",
  },
  admin: {
    group: "Shop",
  },
  access: {
    read: () => true, // public read; tighten if media is private
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  upload: {
    ...(hasS3Config ? {} : { staticDir: mediaDir }),
    mimeTypes: ["image/*", "application/pdf"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      localized: true, // i18n: alt text is user-facing
      required: true,
    },
  ],
};
