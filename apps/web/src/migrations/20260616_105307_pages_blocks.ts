import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import { addConstraintIfNotExists, createEnumIfNotExists, runSql } from './helpers/idempotent'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await createEnumIfNotExists(db, 'enum_pages_status', ['draft', 'published'])
  await createEnumIfNotExists(db, 'enum__pages_v_version_status', ['draft', 'published'])
  await createEnumIfNotExists(db, 'enum__pages_v_published_locale', ['en', 'fr', 'ru'])

  await runSql(
    db,
    `
    CREATE TABLE IF NOT EXISTS "pages_blocks_hero" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "hero_image_id" integer,
      "season" varchar,
      "tagline" varchar,
      "cta_label" varchar,
      "cta_link" varchar DEFAULT '/catalogue',
      "block_name" varchar
    );
    `,
  )

  await runSql(
    db,
    `
    CREATE TABLE IF NOT EXISTS "pages_blocks_featured_products" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar,
      "view_collection_label" varchar,
      "block_name" varchar
    );
    `,
  )

  await runSql(
    db,
    `
    CREATE TABLE IF NOT EXISTS "pages_blocks_editorial_strip" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "headline" varchar,
      "subline" varchar,
      "body" varchar,
      "cta_label" varchar,
      "cta_link" varchar DEFAULT '/catalogue',
      "image_id" integer,
      "block_name" varchar
    );
    `,
  )

  await runSql(
    db,
    `
    CREATE TABLE IF NOT EXISTS "pages_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "locale" "_locales",
      "products_id" integer
    );
    `,
  )

  await runSql(
    db,
    `
    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_hero" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "hero_image_id" integer,
      "season" varchar,
      "tagline" varchar,
      "cta_label" varchar,
      "cta_link" varchar DEFAULT '/catalogue',
      "_uuid" varchar,
      "block_name" varchar
    );
    `,
  )

  await runSql(
    db,
    `
    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_featured_products" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar,
      "view_collection_label" varchar,
      "_uuid" varchar,
      "block_name" varchar
    );
    `,
  )

  await runSql(
    db,
    `
    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_editorial_strip" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar,
      "headline" varchar,
      "subline" varchar,
      "body" varchar,
      "cta_label" varchar,
      "cta_link" varchar DEFAULT '/catalogue',
      "image_id" integer,
      "_uuid" varchar,
      "block_name" varchar
    );
    `,
  )

  await runSql(
    db,
    `
    CREATE TABLE IF NOT EXISTS "_pages_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_slug" varchar,
      "version_cover_id" integer,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__pages_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "snapshot" boolean,
      "published_locale" "enum__pages_v_published_locale",
      "latest" boolean
    );
    `,
  )

  await runSql(
    db,
    `
    CREATE TABLE IF NOT EXISTS "_pages_v_locales" (
      "version_title" varchar,
      "version_body" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
    `,
  )

  await runSql(
    db,
    `
    CREATE TABLE IF NOT EXISTS "_pages_v_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "locale" "_locales",
      "products_id" integer
    );
    `,
  )

  await runSql(db, `ALTER TABLE "pages" ALTER COLUMN "slug" DROP NOT NULL;`)
  await runSql(db, `ALTER TABLE "pages_locales" ALTER COLUMN "title" DROP NOT NULL;`)

  await runSql(
    db,
    `
    ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "_status" "enum_pages_status" DEFAULT 'draft';
    `,
  )
  await runSql(
    db,
    `
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "in_stock" boolean DEFAULT true;
    `,
  )
  await runSql(
    db,
    `
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_in_stock" boolean DEFAULT true;
    `,
  )

  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "pages_blocks_featured_products" ADD CONSTRAINT "pages_blocks_featured_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "pages_blocks_editorial_strip" ADD CONSTRAINT "pages_blocks_editorial_strip_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "pages_blocks_editorial_strip" ADD CONSTRAINT "pages_blocks_editorial_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "_pages_v_blocks_featured_products" ADD CONSTRAINT "_pages_v_blocks_featured_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "_pages_v_blocks_editorial_strip" ADD CONSTRAINT "_pages_v_blocks_editorial_strip_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "_pages_v_blocks_editorial_strip" ADD CONSTRAINT "_pages_v_blocks_editorial_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;`,
  )

  const indexes = [
    `CREATE INDEX IF NOT EXISTS "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_hero_locale_idx" ON "pages_blocks_hero" USING btree ("_locale");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_hero_hero_image_idx" ON "pages_blocks_hero" USING btree ("hero_image_id");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_featured_products_order_idx" ON "pages_blocks_featured_products" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_featured_products_parent_id_idx" ON "pages_blocks_featured_products" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_featured_products_path_idx" ON "pages_blocks_featured_products" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_featured_products_locale_idx" ON "pages_blocks_featured_products" USING btree ("_locale");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_editorial_strip_order_idx" ON "pages_blocks_editorial_strip" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_editorial_strip_parent_id_idx" ON "pages_blocks_editorial_strip" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_editorial_strip_path_idx" ON "pages_blocks_editorial_strip" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_editorial_strip_locale_idx" ON "pages_blocks_editorial_strip" USING btree ("_locale");`,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_editorial_strip_image_idx" ON "pages_blocks_editorial_strip" USING btree ("image_id");`,
    `CREATE INDEX IF NOT EXISTS "pages_rels_order_idx" ON "pages_rels" USING btree ("order");`,
    `CREATE INDEX IF NOT EXISTS "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");`,
    `CREATE INDEX IF NOT EXISTS "pages_rels_path_idx" ON "pages_rels" USING btree ("path");`,
    `CREATE INDEX IF NOT EXISTS "pages_rels_locale_idx" ON "pages_rels" USING btree ("locale");`,
    `CREATE INDEX IF NOT EXISTS "pages_rels_products_id_idx" ON "pages_rels" USING btree ("products_id","locale");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_locale_idx" ON "_pages_v_blocks_hero" USING btree ("_locale");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_hero_image_idx" ON "_pages_v_blocks_hero" USING btree ("hero_image_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_featured_products_order_idx" ON "_pages_v_blocks_featured_products" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_featured_products_parent_id_idx" ON "_pages_v_blocks_featured_products" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_featured_products_path_idx" ON "_pages_v_blocks_featured_products" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_featured_products_locale_idx" ON "_pages_v_blocks_featured_products" USING btree ("_locale");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_editorial_strip_order_idx" ON "_pages_v_blocks_editorial_strip" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_editorial_strip_parent_id_idx" ON "_pages_v_blocks_editorial_strip" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_editorial_strip_path_idx" ON "_pages_v_blocks_editorial_strip" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_editorial_strip_locale_idx" ON "_pages_v_blocks_editorial_strip" USING btree ("_locale");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_editorial_strip_image_idx" ON "_pages_v_blocks_editorial_strip" USING btree ("image_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_version_version_cover_idx" ON "_pages_v" USING btree ("version_cover_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_rels_locale_idx" ON "_pages_v_rels" USING btree ("locale");`,
    `CREATE INDEX IF NOT EXISTS "_pages_v_rels_products_id_idx" ON "_pages_v_rels" USING btree ("products_id","locale");`,
    `CREATE INDEX IF NOT EXISTS "pages__status_idx" ON "pages" USING btree ("_status");`,
  ]

  for (const indexSql of indexes) {
    await runSql(db, indexSql)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_featured_products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_editorial_strip" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_featured_products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_editorial_strip" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_featured_products" CASCADE;
  DROP TABLE "pages_blocks_editorial_strip" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_products" CASCADE;
  DROP TABLE "_pages_v_blocks_editorial_strip" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP INDEX "pages__status_idx";
  ALTER TABLE "pages" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "pages_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "pages" DROP COLUMN "_status";
  ALTER TABLE "products" DROP COLUMN "in_stock";
  ALTER TABLE "_products_v" DROP COLUMN "version_in_stock";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";`)
}
