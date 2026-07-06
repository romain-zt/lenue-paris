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
import { Users, Orders } from "@repo/payload-schema/collections";
import { SiteSettings as BaseSiteSettings, DesignTokens as BaseDesignTokens } from "@repo/payload-schema/globals";
import { migrations } from "@repo/payload-schema/migrations";

import { Collections, Pages, Products } from "./payload/collections";
import { Media } from "./payload/media";
import { withGlobalContentIndex } from "./payload/withContentIndex";
import { getPostgresPoolConfig } from "./lib/database";
import { getPreviewSiteUrl } from "./lib/cms/generatePreviewPath";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const hasS3Config =
  !!process.env.S3_BUCKET &&
  !!process.env.S3_ACCESS_KEY_ID &&
  !!process.env.S3_SECRET_ACCESS_KEY;

const SiteSettings = withGlobalContentIndex(BaseSiteSettings, "site-settings");
const DesignTokens = withGlobalContentIndex(BaseDesignTokens, "design-tokens");

export default buildConfig({
  cors: [getPreviewSiteUrl(), "http://localhost:3001"],

  i18n: {
    fallbackLanguage: "fr",
    supportedLanguages: { en, fr, ru },
  },

  localization: {
    locales: [...CONTENT_LOCALES],
    defaultLocale: PAYLOAD_DEFAULT_LOCALE,
    fallback: true,
  },

  admin: {
    user: Users.slug,
    components: {
      providers: ["@/components/admin/AIPanel#AIPanel"],
    },
    livePreview: {
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 375, height: 667 },
        { label: "Tablet", name: "tablet", width: 768, height: 1024 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
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
