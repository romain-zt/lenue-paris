import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { en } from "@payloadcms/translations/languages/en";
import { fr } from "@payloadcms/translations/languages/fr";
import { ru } from "@payloadcms/translations/languages/ru";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Collections } from "./collections/Collections";
import { Pages } from "./collections/Pages";
import { Products } from "./collections/Products";
import { Orders } from "./collections/Orders";
import { SiteSettings } from "./globals/SiteSettings";
import { getPostgresPoolConfig } from "./lib/database";
import { getPreviewSiteUrl } from "./lib/cms/generatePreviewPath";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const hasS3Config =
  !!process.env.S3_BUCKET &&
  !!process.env.S3_ACCESS_KEY_ID &&
  !!process.env.S3_SECRET_ACCESS_KEY;

export default buildConfig({
  cors: [getPreviewSiteUrl(), "http://localhost:3001"],

  i18n: {
    // Admin UI language (separate from content localization below).
    // Browser defaults to fr if supported; user can override in Account → Language.
    fallbackLanguage: "fr",
    supportedLanguages: { en, fr, ru },
  },

  localization: {
    locales: ["en", "fr", "ru"],
    defaultLocale: "en",
    fallback: true,
  },

  admin: {
    user: Users.slug,
    livePreview: {
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 375, height: 667 },
        { label: "Tablet", name: "tablet", width: 768, height: 1024 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },

  collections: [Users, Media, Collections, Pages, Products, Orders],
  globals: [SiteSettings],

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
