import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { runSql } from "./helpers/idempotent";

const BLOCK_TABLES = [
  "pages_blocks_hero",
  "pages_blocks_featured_products",
  "pages_blocks_editorial_strip",
  "pages_blocks_product_grid",
  "_pages_v_blocks_hero",
  "_pages_v_blocks_featured_products",
  "_pages_v_blocks_editorial_strip",
  "_pages_v_blocks_product_grid",
] as const;

const LOCALE_INDEXES: Record<(typeof BLOCK_TABLES)[number], string> = {
  pages_blocks_hero: "pages_blocks_hero_locale_idx",
  pages_blocks_featured_products: "pages_blocks_featured_products_locale_idx",
  pages_blocks_editorial_strip: "pages_blocks_editorial_strip_locale_idx",
  pages_blocks_product_grid: "pages_blocks_product_grid_locale_idx",
  _pages_v_blocks_hero: "_pages_v_blocks_hero_locale_idx",
  _pages_v_blocks_featured_products: "_pages_v_blocks_featured_products_locale_idx",
  _pages_v_blocks_editorial_strip: "_pages_v_blocks_editorial_strip_locale_idx",
  _pages_v_blocks_product_grid: "_pages_v_blocks_product_grid_locale_idx",
};

/** Prod tables created via dev push before blocks were localized lack `_locale`. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of BLOCK_TABLES) {
    await runSql(
      db,
      `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "_locale" "_locales" NOT NULL DEFAULT 'en';`,
    );
    await runSql(
      db,
      `CREATE INDEX IF NOT EXISTS "${LOCALE_INDEXES[table]}" ON "${table}" USING btree ("_locale");`,
    );
  }

  await runSql(
    db,
    `ALTER TABLE "pages_rels" ADD COLUMN IF NOT EXISTS "locale" "_locales";`,
  );
  await runSql(
    db,
    `CREATE INDEX IF NOT EXISTS "pages_rels_locale_idx" ON "pages_rels" USING btree ("locale");`,
  );

  await runSql(
    db,
    `ALTER TABLE "_pages_v_rels" ADD COLUMN IF NOT EXISTS "locale" "_locales";`,
  );
  await runSql(
    db,
    `CREATE INDEX IF NOT EXISTS "_pages_v_rels_locale_idx" ON "_pages_v_rels" USING btree ("locale");`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of BLOCK_TABLES) {
    await runSql(db, `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "_locale";`);
  }

  await runSql(db, `ALTER TABLE "pages_rels" DROP COLUMN IF EXISTS "locale";`);
  await runSql(db, `ALTER TABLE "_pages_v_rels" DROP COLUMN IF EXISTS "locale";`);
}
