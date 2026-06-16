import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { en } from "@payloadcms/translations/languages/en";
import { fr } from "@payloadcms/translations/languages/fr";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Collections } from "./collections/Collections";
import { Pages } from "./collections/Pages";
import { Products } from "./collections/Products";
import { Orders } from "./collections/Orders";
import { getPostgresPoolConfig } from "./lib/database";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const hasS3Config =
  !!process.env.S3_BUCKET &&
  !!process.env.S3_ACCESS_KEY_ID &&
  !!process.env.S3_SECRET_ACCESS_KEY;

export default buildConfig({
  i18n: {
    // Admin UI language (separate from content localization below).
    // Browser defaults to fr if supported; user can override in Account → Language.
    fallbackLanguage: "en",
    supportedLanguages: { en, fr },
  },

  localization: {
    locales: ["en", "fr", "ru"],
    defaultLocale: "en",
    fallback: true,
  },

  admin: {
    user: Users.slug,
  },

  collections: [Users, Media, Collections, Pages, Products, Orders],

  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },

  db: postgresAdapter({
    pool: getPostgresPoolConfig(),
  }),

  plugins: hasS3Config
    ? [
        s3Storage({
          collections: {
            [Media.slug]: true,
          },
          bucket: process.env.S3_BUCKET as string,
          config: {
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION || "us-east-1",
            forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
            },
          },
        }),
      ]
    : [],
});
