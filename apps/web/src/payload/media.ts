import path from "path";
import { fileURLToPath } from "url";
import type { CollectionConfig } from "payload";
import { Media as BaseMedia } from "@repo/payload-schema/collections";

const hasS3Config =
  !!process.env.S3_BUCKET &&
  !!process.env.S3_ACCESS_KEY_ID &&
  !!process.env.S3_SECRET_ACCESS_KEY;

const mediaDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../public/media-uploads",
);

const baseUpload =
  typeof BaseMedia.upload === "object" && BaseMedia.upload !== null
    ? BaseMedia.upload
    : {};

export const Media: CollectionConfig = {
  ...BaseMedia,
  upload: {
    ...baseUpload,
    ...(hasS3Config ? {} : { staticDir: mediaDir }),
  },
};
