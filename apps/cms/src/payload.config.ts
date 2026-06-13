import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Products } from "./collections/Products";
import { Orders } from "./collections/Orders";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  // i18n: fr is the primary locale for lenue.paris
  localization: {
    locales: ["fr", "en"],
    defaultLocale: "fr",
    fallback: true,
  },
  i18n: {
    supportedLanguages: {},
  },

  admin: {
    user: Users.slug,
  },

  collections: [Users, Media, Products, Orders],

  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),

  // All media goes to S3 (AWS in production, MinIO locally).
  plugins: [
    s3Storage({
      collections: {
        [Media.slug]: true,
      },
      bucket: process.env.S3_BUCKET || "lenue-media",
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || "eu-west-3",
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
      },
    }),
  ],
});
