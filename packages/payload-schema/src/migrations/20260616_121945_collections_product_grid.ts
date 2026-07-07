import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import { addConstraintIfNotExists, createEnumIfNotExists, runSql } from './helpers/idempotent'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await createEnumIfNotExists(db, 'enum_collections_status', ['draft', 'published'])
  await createEnumIfNotExists(db, 'enum__collections_v_version_status', ['draft', 'published'])
  await createEnumIfNotExists(db, 'enum__collections_v_published_locale', ['en', 'fr', 'ru'])
  await createEnumIfNotExists(db, 'enum_pages_blocks_featured_products_source_type', ['manual', 'collection'])
  await createEnumIfNotExists(db, 'enum_pages_blocks_product_grid_source_type', ['all', 'collection'])
  await createEnumIfNotExists(db, 'enum__pages_v_blocks_featured_products_source_type', ['manual', 'collection'])
  await createEnumIfNotExists(db, 'enum__pages_v_blocks_product_grid_source_type', ['all', 'collection'])
  await runSql(db, `CREATE TABLE IF NOT EXISTS "collections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"hero_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_collections_status" DEFAULT 'draft'
  );`)
  await runSql(db, `CREATE TABLE IF NOT EXISTS "collections_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );`)
  await runSql(db, `CREATE TABLE IF NOT EXISTS "collections_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );`)
  await runSql(db, `CREATE TABLE IF NOT EXISTS "_collections_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_hero_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__collections_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__collections_v_published_locale",
  	"latest" boolean
  );`)
  await runSql(db, `CREATE TABLE IF NOT EXISTS "_collections_v_locales" (
  	"version_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );`)
  await runSql(db, `CREATE TABLE IF NOT EXISTS "_collections_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );`)
  await runSql(db, `CREATE TABLE IF NOT EXISTS "pages_blocks_product_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"source_type" "enum_pages_blocks_product_grid_source_type" DEFAULT 'all',
  	"collection_id" integer,
  	"block_name" varchar
  );`)
  await runSql(db, `CREATE TABLE IF NOT EXISTS "_pages_v_blocks_product_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"source_type" "enum__pages_v_blocks_product_grid_source_type" DEFAULT 'all',
  	"collection_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );`)
  await runSql(db, `ALTER TABLE "pages_blocks_featured_products" ADD COLUMN IF NOT EXISTS "source_type" "enum_pages_blocks_featured_products_source_type" DEFAULT 'manual';`)
  await runSql(db, `ALTER TABLE "pages_blocks_featured_products" ADD COLUMN IF NOT EXISTS "collection_id" integer;`)
  await runSql(db, `ALTER TABLE "_pages_v_blocks_featured_products" ADD COLUMN IF NOT EXISTS "source_type" "enum__pages_v_blocks_featured_products_source_type" DEFAULT 'manual';`)
  await runSql(db, `ALTER TABLE "_pages_v_blocks_featured_products" ADD COLUMN IF NOT EXISTS "collection_id" integer;`)
  await runSql(db, `ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "collections_id" integer;`)
  await addConstraintIfNotExists(db, 'ALTER TABLE "collections" ADD CONSTRAINT "collections_hero_id_media_id_fk" FOREIGN KEY ("hero_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "collections_locales" ADD CONSTRAINT "collections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "collections_rels" ADD CONSTRAINT "collections_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "collections_rels" ADD CONSTRAINT "collections_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "_collections_v" ADD CONSTRAINT "_collections_v_parent_id_collections_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "_collections_v" ADD CONSTRAINT "_collections_v_version_hero_id_media_id_fk" FOREIGN KEY ("version_hero_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "_collections_v_locales" ADD CONSTRAINT "_collections_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_collections_v"("id") ON DELETE cascade ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "_collections_v_rels" ADD CONSTRAINT "_collections_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_collections_v"("id") ON DELETE cascade ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "_collections_v_rels" ADD CONSTRAINT "_collections_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "pages_blocks_product_grid" ADD CONSTRAINT "pages_blocks_product_grid_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "pages_blocks_product_grid" ADD CONSTRAINT "pages_blocks_product_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "_pages_v_blocks_product_grid" ADD CONSTRAINT "_pages_v_blocks_product_grid_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "_pages_v_blocks_product_grid" ADD CONSTRAINT "_pages_v_blocks_product_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;')
  await runSql(db, `CREATE UNIQUE INDEX IF NOT EXISTS "collections_slug_idx" ON "collections" USING btree ("slug");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "collections_hero_idx" ON "collections" USING btree ("hero_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "collections_updated_at_idx" ON "collections" USING btree ("updated_at");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "collections_created_at_idx" ON "collections" USING btree ("created_at");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "collections__status_idx" ON "collections" USING btree ("_status");`)
  await runSql(db, `CREATE UNIQUE INDEX IF NOT EXISTS "collections_locales_locale_parent_id_unique" ON "collections_locales" USING btree ("_locale","_parent_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "collections_rels_order_idx" ON "collections_rels" USING btree ("order");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "collections_rels_parent_idx" ON "collections_rels" USING btree ("parent_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "collections_rels_path_idx" ON "collections_rels" USING btree ("path");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "collections_rels_products_id_idx" ON "collections_rels" USING btree ("products_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_parent_idx" ON "_collections_v" USING btree ("parent_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_version_version_slug_idx" ON "_collections_v" USING btree ("version_slug");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_version_version_hero_idx" ON "_collections_v" USING btree ("version_hero_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_version_version_updated_at_idx" ON "_collections_v" USING btree ("version_updated_at");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_version_version_created_at_idx" ON "_collections_v" USING btree ("version_created_at");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_version_version__status_idx" ON "_collections_v" USING btree ("version__status");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_created_at_idx" ON "_collections_v" USING btree ("created_at");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_updated_at_idx" ON "_collections_v" USING btree ("updated_at");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_snapshot_idx" ON "_collections_v" USING btree ("snapshot");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_published_locale_idx" ON "_collections_v" USING btree ("published_locale");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_latest_idx" ON "_collections_v" USING btree ("latest");`)
  await runSql(db, `CREATE UNIQUE INDEX IF NOT EXISTS "_collections_v_locales_locale_parent_id_unique" ON "_collections_v_locales" USING btree ("_locale","_parent_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_rels_order_idx" ON "_collections_v_rels" USING btree ("order");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_rels_parent_idx" ON "_collections_v_rels" USING btree ("parent_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_rels_path_idx" ON "_collections_v_rels" USING btree ("path");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_collections_v_rels_products_id_idx" ON "_collections_v_rels" USING btree ("products_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "pages_blocks_product_grid_order_idx" ON "pages_blocks_product_grid" USING btree ("_order");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "pages_blocks_product_grid_parent_id_idx" ON "pages_blocks_product_grid" USING btree ("_parent_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "pages_blocks_product_grid_path_idx" ON "pages_blocks_product_grid" USING btree ("_path");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "pages_blocks_product_grid_locale_idx" ON "pages_blocks_product_grid" USING btree ("_locale");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "pages_blocks_product_grid_collection_idx" ON "pages_blocks_product_grid" USING btree ("collection_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_product_grid_order_idx" ON "_pages_v_blocks_product_grid" USING btree ("_order");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_product_grid_parent_id_idx" ON "_pages_v_blocks_product_grid" USING btree ("_parent_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_product_grid_path_idx" ON "_pages_v_blocks_product_grid" USING btree ("_path");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_product_grid_locale_idx" ON "_pages_v_blocks_product_grid" USING btree ("_locale");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_product_grid_collection_idx" ON "_pages_v_blocks_product_grid" USING btree ("collection_id");`)
  await addConstraintIfNotExists(db, 'ALTER TABLE "pages_blocks_featured_products" ADD CONSTRAINT "pages_blocks_featured_products_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "_pages_v_blocks_featured_products" ADD CONSTRAINT "_pages_v_blocks_featured_products_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;')
  await addConstraintIfNotExists(db, 'ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_collections_fk" FOREIGN KEY ("collections_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;')
  await runSql(db, `CREATE INDEX IF NOT EXISTS "pages_blocks_featured_products_collection_idx" ON "pages_blocks_featured_products" USING btree ("collection_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_featured_products_collection_idx" ON "_pages_v_blocks_featured_products" USING btree ("collection_id");`)
  await runSql(db, `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_collections_id_idx" ON "payload_locked_documents_rels" USING btree ("collections_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "collections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "collections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "collections_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_collections_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_collections_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_collections_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_product_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_product_grid" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "collections" CASCADE;
  DROP TABLE "collections_locales" CASCADE;
  DROP TABLE "collections_rels" CASCADE;
  DROP TABLE "_collections_v" CASCADE;
  DROP TABLE "_collections_v_locales" CASCADE;
  DROP TABLE "_collections_v_rels" CASCADE;
  DROP TABLE "pages_blocks_product_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_product_grid" CASCADE;
  ALTER TABLE "pages_blocks_featured_products" DROP CONSTRAINT "pages_blocks_featured_products_collection_id_collections_id_fk";
  
  ALTER TABLE "_pages_v_blocks_featured_products" DROP CONSTRAINT "_pages_v_blocks_featured_products_collection_id_collections_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_collections_fk";
  
  DROP INDEX "pages_blocks_featured_products_collection_idx";
  DROP INDEX "_pages_v_blocks_featured_products_collection_idx";
  DROP INDEX "payload_locked_documents_rels_collections_id_idx";
  ALTER TABLE "pages_blocks_featured_products" DROP COLUMN "source_type";
  ALTER TABLE "pages_blocks_featured_products" DROP COLUMN "collection_id";
  ALTER TABLE "_pages_v_blocks_featured_products" DROP COLUMN "source_type";
  ALTER TABLE "_pages_v_blocks_featured_products" DROP COLUMN "collection_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "collections_id";
  DROP TYPE "public"."enum_collections_status";
  DROP TYPE "public"."enum__collections_v_version_status";
  DROP TYPE "public"."enum__collections_v_published_locale";
  DROP TYPE "public"."enum_pages_blocks_featured_products_source_type";
  DROP TYPE "public"."enum_pages_blocks_product_grid_source_type";
  DROP TYPE "public"."enum__pages_v_blocks_featured_products_source_type";
  DROP TYPE "public"."enum__pages_v_blocks_product_grid_source_type";`)
}
