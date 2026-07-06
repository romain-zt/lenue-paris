import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { en } from "@payloadcms/translations/languages/en";
import { fr } from "@payloadcms/translations/languages/fr";
import { ru } from "@payloadcms/translations/languages/ru";
import {
  CONTENT_LOCALES,
  PAYLOAD_DEFAULT_LOCALE,
} from "@repo/payload-schema/i18n/content-locales";
import {
  Users,
  Media,
  Collections,
  Pages,
  Products,
  Orders,
} from "@repo/payload-schema/collections";
import { SiteSettings, DesignTokens } from "@repo/payload-schema/globals";
import { migrations } from "@repo/payload-schema/migrations";

import { getPostgresPoolConfig } from "./lib/database";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  localization: {
    locales: [...CONTENT_LOCALES],
    defaultLocale: PAYLOAD_DEFAULT_LOCALE,
    fallback: true,
  },
  i18n: {
    fallbackLanguage: "fr",
    supportedLanguages: { en, fr, ru },
  },

  admin: {
    user: Users.slug,
  },

  collections: [Users, Media, Collections, Pages, Products, Orders],
  globals: [SiteSettings, DesignTokens],

  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(
      dirname,
      "../../../packages/payload-schema/src/payload-types.ts",
    ),
  },

  db: postgresAdapter({
    pool: getPostgresPoolConfig(),
    push: false,
    prodMigrations: migrations,
  }),

  plugins: [
    s3Storage({
      collections: {
        [Media.slug]: true,
      },
      bucket: process.env.S3_BUCKET || "media",
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || "us-east-1",
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
      },
    }),
  ],
});
